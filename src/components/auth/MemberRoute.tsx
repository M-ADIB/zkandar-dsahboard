import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'

interface MemberRouteProps {
    children: React.ReactNode
}


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

    if (effectiveUserType === 'webinar_member') {
        const blocked = ['/chat', '/my-program', '/my-performance', '/toolbox', '/assignments'].some(p => location.pathname.startsWith(p))
        if (blocked) return <Navigate to="/dashboard" replace />
    }

    if (effectiveUserType === 'sprint_member') {
        const blocked = ['/chat', '/my-program', '/my-performance', '/toolbox'].some(p => location.pathname.startsWith(p))
        if (blocked) return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
