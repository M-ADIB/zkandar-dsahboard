import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Notification } from '@/types/database'

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    pendingSubmissionsCount: number
    loading: boolean
    error: string | null
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    deleteNotification: (id: string) => void
    refresh: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0)

    const sortByCreatedAt = (items: Notification[]) => {
        return [...items].sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }

    const fetchNotifications = async () => {
        if (!user) {
            setNotifications([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (fetchError) {
            setError(fetchError.message)
            setNotifications([])
        } else {
            setNotifications((data as Notification[]) ?? [])
        }

        setLoading(false)
    }

    useEffect(() => {
        if (authLoading) return
        fetchNotifications()
    }, [authLoading, user?.id])

    // Request browser notification permission on first load
    useEffect(() => {
        if (authLoading || !user) return
        if ('Notification' in window && window.Notification.permission === 'default') {
            window.Notification.requestPermission()
        }
    }, [authLoading, user?.id])

    useEffect(() => {
        if (authLoading || !user) return

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification
                        setNotifications((prev) => {
                            if (prev.some((n) => n.id === newNotification.id)) return prev
                            return sortByCreatedAt([newNotification, ...prev])
                        })

                        // Fire browser push notification if permission granted
                        if ('Notification' in window && window.Notification.permission === 'granted') {
                            try {
                                new window.Notification(newNotification.title || 'Zkandar AI', {
                                    body: newNotification.message || '',
                                    icon: '/favicon.png',
                                    tag: newNotification.id, // prevents duplicate browser notifications
                                })
                            } catch {
                                // Silent fail — some browsers don't allow Notification from foreground
                            }
                        }

                        return
                    }

                    if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as Notification
                        setNotifications((prev) => {
                            const next = prev.map((n) => (n.id === updated.id ? updated : n))
                            return sortByCreatedAt(next)
                        })
                        return
                    }

                    if (payload.eventType === 'DELETE') {
                        const removed = payload.old as Notification
                        setNotifications((prev) => prev.filter((n) => n.id !== removed.id))
                    }
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [authLoading, user?.id])

    // Pending submissions count — only relevant for admin/owner users
    useEffect(() => {
        if (authLoading || !user) return
        if (user.role !== 'owner' && user.role !== 'admin') return

        const fetchPending = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { count } = await (supabase as any)
                .from('submissions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending')
            setPendingSubmissionsCount(count ?? 0)
        }

        fetchPending()

        // Subscribe to submission inserts/updates to keep count live
        const sub = supabase
            .channel('pending-submissions-count')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, () => {
                setPendingSubmissionsCount((c) => c + 1)
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'submissions' }, () => {
                // Re-fetch on any update (status may have changed to 'reviewed')
                fetchPending()
            })
            .subscribe()

        return () => { void supabase.removeChannel(sub) }
    }, [authLoading, user?.id, user?.role])

    const unreadCount = notifications.filter((n) => !n.read).length

    const markAsRead = (id: string) => {
        if (!user) return
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        void supabase
            .from('notifications')
            // @ts-expect-error - Supabase update type inference issue
            .update({ read: true })
            .eq('id', id)
            .eq('user_id', user.id)
            .then(({ error: updateError }) => {
                if (updateError) {
                    console.error('Failed to mark notification as read', updateError)
                    fetchNotifications()
                }
            })
    }

    const markAllAsRead = () => {
        if (!user) return
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        void supabase
            .from('notifications')
            // @ts-expect-error - Supabase update type inference issue
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)
            .then(({ error: updateError }) => {
                if (updateError) {
                    console.error('Failed to mark all notifications as read', updateError)
                    fetchNotifications()
                }
            })
    }

    const deleteNotification = (id: string) => {
        if (!user) return
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        void supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
            .then(({ error: deleteError }) => {
                if (deleteError) {
                    console.error('Failed to delete notification', deleteError)
                    fetchNotifications()
                }
            })
    }

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                pendingSubmissionsCount,
                loading,
                error,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                refresh: fetchNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}
