import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { User as AuthUser, Session } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types/database'
import { identifyUser, resetAnalytics, initAnalytics } from '@/lib/analytics'
import { initSentry } from '@/lib/sentry'

interface AuthContextType {
    authUser: AuthUser | null
    user: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (
        email: string,
        password: string,
        fullName: string,
        role?: UserRole,
        companyId?: string,
        userType?: 'management' | 'team',
        sprintCohortId?: string
    ) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    sendMagicLink: (email: string) => Promise<{ error: Error | null }>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isAbortError(err: unknown): boolean {
    if (err instanceof DOMException && err.name === 'AbortError') return true
    if (err && typeof err === 'object' && 'message' in err) {
        const msg = (err as { message: string }).message
        return msg.includes('AbortError') || msg.includes('aborted')
    }
    return false
}

// Prevent overlapping background profile fetches using isFetchingProfileRef
export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const mountedRef = useRef(true)
    const isFetchingProfileRef = useRef(false)
    const authInitializedRef = useRef(false)

    // Simple delay helper for the retry logic
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Fetch user profile from the "users" table, with retry for network/abort errors
    const fetchUserProfile = async (
        userId: string,
        email?: string,
        attempt = 0
    ): Promise<User | null> => {
        const MAX_RETRIES = 3

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                const shouldRetry = isAbortError(error) || error.message?.toLowerCase().includes('fetch')
                if (shouldRetry && attempt < MAX_RETRIES) {
                    console.log(`[Auth] Profile fetch failed, retrying (${attempt + 1}/${MAX_RETRIES})...`)
                    await delay(500 * (attempt + 1))
                    return fetchUserProfile(userId, email, attempt + 1)
                }

                if (shouldRetry) {
                    console.warn('[Auth] Fetch failed after all retries')
                    return null
                }

                console.error('[Auth] Error fetching user profile:', error)

                // User doesn't exist yet — create one
                if (error.code === 'PGRST116' && email) {
                    console.log('[Auth] Creating missing user profile for', email)
                    const { data: newUser, error: insertError } = await supabase
                        .from('users')
                        // @ts-ignore - Insert type resolves to never
                        .insert({
                            id: userId,
                            email: email,
                            full_name: email.split('@')[0],
                            role: 'participant',
                            onboarding_completed: false,
                        })
                        .select()
                        .single()

                    if (insertError) {
                        console.error('[Auth] Error creating user profile:', insertError)
                        return null
                    }

                    if (newUser) {
                        console.log('[Auth] Created new user profile:', (newUser as User).role)
                        return newUser as User
                    }
                }
                return null
            }

            if (data) {
                console.log('[Auth] Profile fetched:', (data as User).role)
                return data as User
            }
            return null
        } catch (err) {
            // If the error looks like a network interruption, we capture it and retry
            if ((isAbortError(err) || (err as Error).message?.toLowerCase().includes('fetch')) && attempt < MAX_RETRIES) {
                console.log(`[Auth] Fetch threw error, retrying (${attempt + 1}/${MAX_RETRIES})...`)
                await delay(500 * (attempt + 1))
                return fetchUserProfile(userId, email, attempt + 1)
            }
            console.error('[Auth] Unexpected error:', err)
            return null
        }
    }

    // Get session with retry, relying on native Supabase timeout/fetch config
    const getSessionWithRetry = async (attempt = 0): Promise<Session | null> => {
        const MAX_RETRIES = 3
        try {
            const { data: { session: s }, error } = await supabase.auth.getSession()

            if (error) {
                const shouldRetry = isAbortError(error) || error.message?.toLowerCase().includes('fetch')
                if (shouldRetry && attempt < MAX_RETRIES) {
                    await delay(500 * (attempt + 1))
                    return getSessionWithRetry(attempt + 1)
                }
                console.error('[Auth] getSession error:', error)
                // We don't manually clear storage; Supabase handles invalid sessions internally
                if (error.status === 400 || error.status === 401) {
                    console.log('[Auth] Invalid session caught during initialization.')
                }
                return null
            }
            return s
        } catch (err) {
            if ((isAbortError(err) || (err as Error).message?.toLowerCase().includes('fetch')) && attempt < MAX_RETRIES) {
                await delay(500 * (attempt + 1))
                return getSessionWithRetry(attempt + 1)
            }
            console.error('[Auth] getSession error:', err)
            return null
        }
    }

    useEffect(() => {
        mountedRef.current = true

        const resolveAuthStatus = () => {
            if (!authInitializedRef.current) {
                authInitializedRef.current = true
                if (mountedRef.current) {
                    setLoading(false)
                    console.log('[Auth] Auth gates cleared, initializing app.')
                    initAnalytics()
                    initSentry()
                }
            }
        }

        const initialize = async () => {
            console.log('[Auth] Initializing...')
            try {
                const currentSession = await getSessionWithRetry()

                if (!mountedRef.current) return

                setSession(currentSession)
                setAuthUser(currentSession?.user ?? null)

                if (currentSession?.user) {
                    isFetchingProfileRef.current = true
                    const profile = await fetchUserProfile(
                        currentSession.user.id,
                        currentSession.user.email
                    )
                    isFetchingProfileRef.current = false

                    if (mountedRef.current) {
                        setUser(profile)
                        console.log('[Auth] Init profile:', profile?.role ?? 'null')
                    }
                }
            } catch (err) {
                console.error('[Auth] Unexpected initialize error:', err)
                isFetchingProfileRef.current = false
            } finally {
                resolveAuthStatus()
            }
        }

        initialize()

        // Setup BroadcastChannel for cross-tab sync
        const authChannel = typeof window !== 'undefined' ? new BroadcastChannel('zkandar_auth') : null
        if (authChannel) {
            authChannel.onmessage = async (e) => {
                const { data } = await supabase.auth.getSession()
                if (e.data === 'LOGOUT') {
                    console.log('[Auth] Received LOGOUT broadcast from another tab')
                    if (!data.session?.user && mountedRef.current) {
                        setSession(null)
                        setAuthUser(null)
                        setUser(null)
                    }
                } else if (e.data === 'SESSION_UPDATED') {
                    console.log('[Auth] Received SESSION_UPDATED broadcast')
                    if (mountedRef.current) {
                        setSession(data.session)
                        setAuthUser(data.session?.user ?? null)
                    }
                }
            }
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('[Auth] onAuthStateChange:', event)
            if (!mountedRef.current) return

            // Broadcast changes to other tabs
            if (authChannel) {
                if (event === 'SIGNED_OUT') {
                    authChannel.postMessage('LOGOUT')
                } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
                    authChannel.postMessage('SESSION_UPDATED')
                }
            }

            setSession(newSession)
            setAuthUser(newSession?.user ?? null)

            // Silently handle TOKEN_REFRESHED without refetching profile
            if (event === 'TOKEN_REFRESHED') {
                return
            }

            if (newSession?.user) {
                // Prevent overlapping profile fetches if one is already in flight for init or previous event.
                if (isFetchingProfileRef.current) {
                    console.log('[Auth] Profile fetch already in progress, skipping redundant fetch on event:', event)
                    return
                }

                isFetchingProfileRef.current = true
                const profile = await fetchUserProfile(
                    newSession.user.id,
                    newSession.user.email
                )
                isFetchingProfileRef.current = false

                if (mountedRef.current) {
                    setUser(profile)
                    console.log('[Auth] Auth change profile:', profile?.role ?? 'null')
                    resolveAuthStatus()
                }
            } else {
                if (mountedRef.current) {
                    setUser(null)
                    resolveAuthStatus()
                }
            }
        })

        return () => {
            mountedRef.current = false
            subscription.unsubscribe()
            if (authChannel) authChannel.close()
        }
    }, [])

    useEffect(() => {
        if (!authUser) return

        const channel = supabase
            .channel(`user:${authUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${authUser.id}`,
                },
                (payload) => {
                    if (!mountedRef.current) return

                    if (payload.eventType === 'DELETE') {
                        setUser(null)
                        return
                    }

                    if (payload.new) {
                        setUser(payload.new as User)
                    }
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [authUser?.id])

    const signIn = async (email: string, password: string) => {
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                return { error: error as Error | null }
            }

            if (mountedRef.current) {
                setSession(data.session ?? null)
                setAuthUser(data.user ?? null)
            }

            if (data.user) {
                // Prevent the onAuthStateChange listener from also fetching
                isFetchingProfileRef.current = true

                const profile = await fetchUserProfile(
                    data.user.id,
                    data.user.email
                )

                isFetchingProfileRef.current = false

                if (!mountedRef.current) return { error: null }

                if (profile) {
                    setUser(profile)
                    identifyUser(profile.id, { email: profile.email, role: profile.role })
                } else {
                    // Profile fetch failed — try one more time after a brief delay
                    console.warn('[Auth] First profile fetch returned null, retrying after 1s...')
                    await delay(1000)

                    isFetchingProfileRef.current = true
                    const retryProfile = await fetchUserProfile(
                        data.user.id,
                        data.user.email
                    )
                    isFetchingProfileRef.current = false

                    if (!mountedRef.current) return { error: null }

                    if (retryProfile) {
                        setUser(retryProfile)
                    } else {
                        // Still null — sign out and report error
                        try {
                            await supabase.auth.signOut({ scope: 'local' })
                        } catch (signOutError) {
                            console.error('[Auth] Error clearing session after profile failure:', signOutError)
                        }
                        if (mountedRef.current) {
                            setSession(null)
                            setAuthUser(null)
                            setUser(null)
                        }
                        return { error: new Error('Unable to load user profile. Please try again.') }
                    }
                }
            }

            return { error: null }
        } catch (err) {
            console.error('[Auth] signIn error:', err)
            isFetchingProfileRef.current = false
            return { error: err as Error }
        } finally {
            if (mountedRef.current) {
                setLoading(false)
            }
        }
    }

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        role: UserRole = 'participant',
        companyId?: string,
        userType?: 'management' | 'team',
        sprintCohortId?: string
    ) => {
        setLoading(true)
        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) {
                return { error: authError as Error }
            }

            if (data.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    // @ts-ignore - Insert type resolves to never
                    .insert({
                        id: data.user.id,
                        email,
                        full_name: fullName,
                        role,
                        company_id: companyId || null,
                        user_type: userType || null,
                        onboarding_completed: false,
                        ai_readiness_score: 0,
                    })

                if (profileError) {
                    console.error('[Auth] Error creating user profile:', profileError)
                    return { error: profileError as Error }
                }

                if (sprintCohortId) {
                    const { error: membershipError } = await supabase
                        .from('cohort_memberships')
                        // @ts-ignore
                        .insert({
                            user_id: data.user.id,
                            cohort_id: sprintCohortId,
                        })

                    if (membershipError) {
                        console.error('[Auth] Error creating cohort membership:', membershipError)
                        return { error: membershipError as Error }
                    }
                }
            }

            return { error: null }
        } finally {
            if (mountedRef.current) {
                setLoading(false)
            }
        }
    }

    async function signOut() {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (error) {
            console.error('[Auth] Error signing out:', error)
        } finally {
            try {
                await supabase.auth.signOut({ scope: 'local' })
            } catch (error) {
                console.error('[Auth] Error clearing local auth session:', error)
            }

            setSession(null)
            setAuthUser(null)
            setUser(null)
            setLoading(false)
            resetAnalytics()
            navigate('/login')
        }
    }

    const sendMagicLink = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
            },
        })
        return { error: error as Error | null }
    }

    const refreshUser = async () => {
        if (authUser) {
            const profile = await fetchUserProfile(authUser.id)
            setUser(profile)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                authUser,
                user,
                session,
                loading,
                signIn,
                signUp,
                signOut,
                sendMagicLink,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
    const { user, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('zkandar_last_path', window.location.pathname + window.location.search)
                }
                navigate('/login')
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                navigate('/unauthorized')
            } else if (!user.onboarding_completed && user.role === 'participant') {
                navigate('/onboarding')
            }
        }
    }, [user, loading, allowedRoles, navigate])

    return { user, loading }
}
