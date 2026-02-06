import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    // Fetch user profile from users table
    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching user profile:', error)
            return null
        }
        return data as User
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session)
            setAuthUser(session?.user ?? null)

            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id)
                setUser(profile)
            }

            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setAuthUser(session?.user ?? null)

            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id)
                setUser(profile)
            } else {
                setUser(null)
            }

            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error: error as Error | null }
    }

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        role: UserRole = 'participant'
    ) => {
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            return { error: authError as Error }
        }

        // Create user profile
        if (data.user) {
            // @ts-expect-error - Supabase types not inferring correctly without generated types
            const { error: profileError } = await supabase.from('users').insert({
                id: data.user.id,
                email,
                full_name: fullName,
                role,
                onboarding_completed: false,
                ai_readiness_score: 0,
            })

            if (profileError) {
                console.error('Error creating user profile:', profileError)
                return { error: profileError as Error }
            }
        }

        return { error: null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        navigate('/login')
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

// Hook for role-based access
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
