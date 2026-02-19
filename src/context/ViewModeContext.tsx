import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

type ViewModeContextValue = {
    isPreviewing: boolean
    canPreview: boolean
    setPreviewing: (enabled: boolean) => void
}

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined)

const PREVIEW_STORAGE_KEY = 'zkandar:view-mode'

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const isAdmin = user?.role === 'owner' || user?.role === 'admin'

    const [isPreviewing, setIsPreviewing] = useState(() => {
        if (typeof window === 'undefined') return false
        try {
            return localStorage.getItem(PREVIEW_STORAGE_KEY) === 'member'
        } catch {
            return false
        }
    })

    useEffect(() => {
        if (!isAdmin && isPreviewing) {
            setIsPreviewing(false)
        }
    }, [isAdmin, isPreviewing])

    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            if (isPreviewing) {
                localStorage.setItem(PREVIEW_STORAGE_KEY, 'member')
            } else {
                localStorage.removeItem(PREVIEW_STORAGE_KEY)
            }
        } catch {
            // Ignore storage errors
        }
    }, [isPreviewing])

    useEffect(() => {
        if (!isAdmin) return

        if (isPreviewing && location.pathname.startsWith('/admin')) {
            navigate('/dashboard', { replace: true })
        }

        if (!isPreviewing && !location.pathname.startsWith('/admin') && location.pathname !== '/settings') {
            const memberPaths = ['/dashboard', '/sessions', '/assignments', '/chat', '/team']
            const isMemberPath = memberPaths.some((path) => location.pathname.startsWith(path))
            if (isMemberPath) {
                navigate('/admin', { replace: true })
            }
        }
    }, [isAdmin, isPreviewing, location.pathname, navigate])

    const setPreviewing = useCallback((enabled: boolean) => {
        if (!isAdmin) return
        setIsPreviewing(enabled)
    }, [isAdmin])

    const value = useMemo<ViewModeContextValue>(() => ({
        isPreviewing: isAdmin ? isPreviewing : false,
        canPreview: isAdmin,
        setPreviewing,
    }), [isAdmin, isPreviewing, setPreviewing])

    return (
        <ViewModeContext.Provider value={value}>
            {children}
        </ViewModeContext.Provider>
    )
}

export function useViewMode() {
    const context = useContext(ViewModeContext)
    if (!context) {
        throw new Error('useViewMode must be used within a ViewModeProvider')
    }
    return context
}
