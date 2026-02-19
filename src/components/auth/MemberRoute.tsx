import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'

interface MemberRouteProps {
    children: React.ReactNode
}

export function MemberRoute({ children }: MemberRouteProps) {
    const { user } = useAuth()
    const { isPreviewing } = useViewMode()

    if (!user) return null

    const isAdmin = user.role === 'owner' || user.role === 'admin'
    if (isAdmin && !isPreviewing) {
        return <Navigate to="/admin" replace />
    }

    return <>{children}</>
}
