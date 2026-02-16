import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Notification } from '@/types/database'

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
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
