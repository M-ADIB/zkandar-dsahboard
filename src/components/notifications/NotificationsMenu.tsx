import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'
import { formatRelativeTime } from '@/lib/time'

interface NotificationsMenuProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationsMenu({ isOpen, onClose }: NotificationsMenuProps) {
    const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
    const menuRef = useRef<HTMLDivElement>(null)

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
                    className="absolute right-0 top-full mt-2 w-96 bg-bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right ring-1 ring-white/5"
                >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm tracking-wide">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-lime/10 text-lime text-xs font-medium border border-lime/20">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-gray-400 hover:text-lime transition-colors flex items-center gap-1"
                            >
                                <Check className="h-3 w-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <p className="text-sm">Loading notifications...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-400">
                                <p className="text-sm">Failed to load notifications</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.slice(0, 5).map((notif) => (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`group relative p-4 transition-all hover:bg-white/5 ${!notif.read ? 'bg-lime/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className={`text-sm font-medium truncate ${!notif.read ? 'text-white' : 'text-gray-400'
                                                        }`}>
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                        {formatRelativeTime(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                                                    {notif.message}
                                                </p>

                                                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                                    {!notif.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                markAsRead(notif.id)
                                                            }}
                                                            className="text-[10px] font-medium text-lime hover:underline"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                    {notif.action_url && (
                                                        <Link
                                                            to={notif.action_url}
                                                            onClick={onClose}
                                                            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-white"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            View
                                                        </Link>
                                                    )}
                                                    <div className="flex-1" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteNotification(notif.id)
                                                        }}
                                                        className="text-gray-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            {!notif.read && (
                                                <div className="h-2 w-2 rounded-full bg-lime mt-1.5 shrink-0 shadow-[0_0_8px_rgba(202,246,26,0.5)]" />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-white/5 bg-bg-card/50">
                        <Link
                            to="/notifications"
                            onClick={onClose}
                            className="block w-full py-2 text-center text-xs font-medium text-gray-400 hover:text-lime hover:bg-white/5 rounded-lg transition-all"
                        >
                            View All Notifications
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
