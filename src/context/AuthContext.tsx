import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { User as AuthUser, Session } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types/database'

interface AuthContextType {
    authUser: AuthUser | null
    user: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: Error | null }>
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

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const mountedRef = useRef(true)

    // Fetch user profile from the "users" table, with retry for AbortErrors
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
                // On AbortError, retry instead of giving up
                if (isAbortError(error) && attempt < MAX_RETRIES) {
                    console.log(`[Auth] Fetch aborted, retrying (${attempt + 1}/${MAX_RETRIES})...`)
                    await delay(300 * (attempt + 1))
                    return fetchUserProfile(userId, email, attempt + 1)
                }

                if (isAbortError(error)) {
                    console.warn('[Auth] Fetch aborted after all retries')
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
            if (isAbortError(err) && attempt < MAX_RETRIES) {
                console.log(`[Auth] Fetch threw abort, retrying (${attempt + 1}/${MAX_RETRIES})...`)
                await delay(300 * (attempt + 1))
                return fetchUserProfile(userId, email, attempt + 1)
            }
            console.error('[Auth] Unexpected error:', err)
            return null
        }
    }

    // Get session with retry for AbortErrors
    const getSessionWithRetry = async (attempt = 0): Promise<Session | null> => {
        const MAX_RETRIES = 3
        try {
            const { data: { session: s }, error } = await supabase.auth.getSession()
            if (error) {
                if (isAbortError(error) && attempt < MAX_RETRIES) {
                    await delay(300 * (attempt + 1))
                    return getSessionWithRetry(attempt + 1)
                }
                console.error('[Auth] getSession error:', error)
                return null
            }
            return s
        } catch (err) {
            if (isAbortError(err) && attempt < MAX_RETRIES) {
                await delay(300 * (attempt + 1))
                return getSessionWithRetry(attempt + 1)
            }
            console.error('[Auth] getSession error:', err)
            return null
        }
    }

    useEffect(() => {
        mountedRef.current = true

        const initialize = async () => {
            console.log('[Auth] Initializing...')
            const currentSession = await getSessionWithRetry()

            if (!mountedRef.current) return

            setSession(currentSession)
            setAuthUser(currentSession?.user ?? null)

            if (currentSession?.user) {
                const profile = await fetchUserProfile(
                    currentSession.user.id,
                    currentSession.user.email
                )
                if (mountedRef.current) {
                    setUser(profile)
                    console.log('[Auth] Init profile:', profile?.role ?? 'null')
                }
            }

            if (mountedRef.current) {
                setLoading(false)
                console.log('[Auth] Init complete, loading=false')
            }
        }

        initialize()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('[Auth] onAuthStateChange:', event)
            if (!mountedRef.current) return

            setSession(newSession)
            setAuthUser(newSession?.user ?? null)

            if (newSession?.user) {
                const profile = await fetchUserProfile(
                    newSession.user.id,
                    newSession.user.email
                )
                if (mountedRef.current) {
                    setUser(profile)
                    setLoading(false)
                    console.log('[Auth] Auth change profile:', profile?.role ?? 'null')
                }
            } else {
                if (mountedRef.current) {
                    setUser(null)
                    setLoading(false)
                }
            }
        })

        return () => {
            mountedRef.current = false
            subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        // Don't set loading=true — avoids race condition with ProtectedRoute
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { error: error as Error | null }
        }

        return { error: null }
    }

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        role: UserRole = 'participant'
    ) => {
        setLoading(true)
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            setLoading(false)
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
                    onboarding_completed: false,
                    ai_readiness_score: 0,
                })

            if (profileError) {
                console.error('[Auth] Error creating user profile:', profileError)
                setLoading(false)
                return { error: profileError as Error }
            }
        }

        return { error: null }
    }

    const signOut = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (error) {
            console.error('[Auth] Error signing out:', error)
        } finally {
            setSession(null)
            setAuthUser(null)
            setUser(null)
            setLoading(false)
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
