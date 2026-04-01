import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types/database'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-lime" />
                    <p className="text-sm text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('zkandar_last_path', location.pathname + location.search)
        }
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />
    }

    const isOnboardingRoute = location.pathname.startsWith('/onboarding')
    const isWelcomeRoute = location.pathname === '/welcome'
    const needsOnboarding = user.role === 'participant' && !user.onboarding_completed
    const needsWelcomeVideo =
        user.role === 'participant' &&
        user.onboarding_completed &&
        !user.welcome_video_watched

    // 1. Onboarding gate
    if (needsOnboarding && !isOnboardingRoute) {
        if (!user.company_id) {
            return <Navigate to="/onboarding/sprint-workshop" replace />
        }
        return <Navigate to="/onboarding" replace />
    }

    // 2. Enforce correct onboarding route if they try to switch
    if (isOnboardingRoute && needsOnboarding) {
        if (!user.company_id && location.pathname === '/onboarding') {
            return <Navigate to="/onboarding/sprint-workshop" replace />
        }
        if (user.company_id && location.pathname === '/onboarding/sprint-workshop') {
            return <Navigate to="/onboarding" replace />
        }
    }

    // 3. Block access to onboarding routes once completed
    if (isOnboardingRoute && !needsOnboarding) {
        return <Navigate to="/dashboard" replace />
    }

    // 4. Welcome video gate — redirect to /welcome if not yet watched
    if (needsWelcomeVideo && !isWelcomeRoute) {
        return <Navigate to="/welcome" replace />
    }

    // 5. Block /welcome if video already watched (prevent re-visiting)
    if (isWelcomeRoute && !needsWelcomeVideo) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
