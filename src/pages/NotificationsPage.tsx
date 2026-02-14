import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Trash2, Search, ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'
import { formatRelativeTime } from '@/lib/time'

export function NotificationsPage() {
    const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' || !n.read
        const message = n.message ?? ''
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            message.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-heading font-bold gradient-text">Notifications</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border hover:border-lime/50 transition-all text-sm font-medium"
                    >
                        <Check className="h-4 w-4 text-lime" />
                        Mark all as read
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center p-1 rounded-xl bg-bg-elevated border border-border w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
                            ? 'bg-bg-card shadow-sm text-white'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unread'
                            ? 'bg-bg-card shadow-sm text-white'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Unread
                    </button>
                </div>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-lime/50 transition-colors"
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20 rounded-3xl bg-bg-elevated/50 border border-border border-dashed"
                        >
                            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                            <h3 className="text-lg font-medium text-gray-300">Loading notifications</h3>
                            <p className="text-gray-500">Fetching your latest updates...</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20 rounded-3xl bg-bg-elevated/50 border border-red-500/20 border-dashed"
                        >
                            <Bell className="h-12 w-12 mx-auto mb-4 text-red-400" />
                            <h3 className="text-lg font-medium text-red-400">Failed to load notifications</h3>
                            <p className="text-gray-500">Please try again in a moment.</p>
                        </motion.div>
                    ) : filteredNotifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20 rounded-3xl bg-bg-elevated/50 border border-border border-dashed"
                        >
                            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                            <h3 className="text-lg font-medium text-gray-300">No notifications found</h3>
                            <p className="text-gray-500">
                                {searchQuery ? 'Try adjusting your search terms' : 'You are all caught up!'}
                            </p>
                        </motion.div>
                    ) : (
                        filteredNotifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group relative p-6 rounded-2xl border transition-all ${notif.read
                                    ? 'bg-bg-elevated border-border'
                                    : 'bg-lime/5 border-lime/20'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-bg-card text-gray-500' : 'bg-lime/20 text-lime'
                                        }`}>
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={`font-semibold text-base mb-1 ${!notif.read ? 'text-white' : 'text-gray-300'
                                                    }`}>
                                                    {notif.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                                                    {notif.message}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatRelativeTime(notif.created_at)}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-center gap-4">
                                            {!notif.read && (
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="text-xs font-medium text-lime hover:text-lime/80 transition-colors"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                            {notif.action_url && (
                                                <Link
                                                    to={notif.action_url}
                                                    className="text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                                >
                                                    View details <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                            <div className="flex-1" />
                                            <button
                                                onClick={() => deleteNotification(notif.id)}
                                                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
