import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { User } from '@/types/database'

type ViewModeContextValue = {
    isPreviewing: boolean
    canPreview: boolean
    setPreviewing: (enabled: boolean) => void
    /** The member being previewed (null = no specific member selected) */
    previewUser: User | null
    setPreviewUser: (member: User | null) => void
    /** Returns previewUser.id when previewing, else the logged-in user's id */
    effectiveUserId: string
}

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined)

const PREVIEW_STORAGE_KEY = 'zkandar:view-mode'
const PREVIEW_USER_KEY = 'zkandar:preview-user'

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

    const [previewUser, setPreviewUserState] = useState<User | null>(() => {
        if (typeof window === 'undefined') return null
        try {
            const stored = localStorage.getItem(PREVIEW_USER_KEY)
            return stored ? JSON.parse(stored) as User : null
        } catch {
            return null
        }
    })

    useEffect(() => {
        if (!isAdmin && isPreviewing) {
            setIsPreviewing(false)
            setPreviewUserState(null)
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

    // Persist preview user
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            if (previewUser) {
                localStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(previewUser))
            } else {
                localStorage.removeItem(PREVIEW_USER_KEY)
            }
        } catch {
            // Ignore storage errors
        }
    }, [previewUser])

    useEffect(() => {
        if (!isAdmin) return

        if (isPreviewing && location.pathname.startsWith('/admin')) {
            navigate('/dashboard', { replace: true })
        }

        if (!isPreviewing && !location.pathname.startsWith('/admin') && location.pathname !== '/settings') {
            const memberPaths = ['/dashboard', '/sessions', '/assignments', '/chat', '/team', '/my-program']
            const isMemberPath = memberPaths.some((path) => location.pathname.startsWith(path))
            if (isMemberPath) {
                navigate('/admin', { replace: true })
            }
        }
    }, [isAdmin, isPreviewing, location.pathname, navigate])

    const setPreviewing = useCallback((enabled: boolean) => {
        if (!isAdmin) return
        setIsPreviewing(enabled)
        if (!enabled) {
            setPreviewUserState(null)
        }
    }, [isAdmin])

    const setPreviewUser = useCallback((member: User | null) => {
        if (!isAdmin) return
        setPreviewUserState(member)
        if (member) {
            setIsPreviewing(true)
        } else {
            setIsPreviewing(false)
        }
    }, [isAdmin])

    const effectiveUserId = useMemo(() => {
        if (isAdmin && isPreviewing && previewUser) {
            return previewUser.id
        }
        return user?.id ?? ''
    }, [isAdmin, isPreviewing, previewUser, user])

    const value = useMemo<ViewModeContextValue>(() => ({
        isPreviewing: isAdmin ? isPreviewing : false,
        canPreview: isAdmin,
        setPreviewing,
        previewUser: isAdmin ? previewUser : null,
        setPreviewUser,
        effectiveUserId,
    }), [isAdmin, isPreviewing, setPreviewing, previewUser, setPreviewUser, effectiveUserId])

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
