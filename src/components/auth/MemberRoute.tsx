import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'

interface MemberRouteProps {
    children: React.ReactNode
}

const SPRINT_BLOCKED = ['/chat', '/my-program', '/my-performance']

export function MemberRoute({ children }: MemberRouteProps) {
    const { user } = useAuth()
    const { isPreviewing, canPreview, previewUser } = useViewMode()
    const location = useLocation()

    if (!user) return null

    const isAdmin = user.role === 'owner' || user.role === 'admin'
    if (isAdmin && !isPreviewing) {
        return <Navigate to="/admin" replace />
    }

    const effectiveUserType = (canPreview && isPreviewing && previewUser)
        ? previewUser.user_type
        : user.user_type

    if (effectiveUserType === 'sprint_member') {
        const blocked = SPRINT_BLOCKED.some(p => location.pathname.startsWith(p))
        if (blocked) return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
