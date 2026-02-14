import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { useNotifications } from '@/context/NotificationContext'

export function Navbar() {
    const { user, signOut } = useAuth()
    const { unreadCount } = useNotifications()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <header className="sticky top-0 z-20 bg-bg-primary/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
                {/* Search */}
                <div className="flex-1 max-w-md ml-12 lg:ml-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search sessions, assignments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border rounded-xl
                text-sm placeholder:text-gray-500 focus:outline-none focus:border-lime/50
                transition-colors"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(true)}
                            className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-2 w-2 bg-lime rounded-full shadow-[0_0_8px_rgba(202,246,26,0.5)] animate-pulse" />
                            )}
                        </button>

                        <NotificationsMenu isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <div className="h-8 w-8 rounded-lg gradient-lime flex items-center justify-center">
                                <User className="h-4 w-4 text-black" />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-border">
                                            <p className="font-medium text-sm">{user?.full_name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(false)
                                                    signOut()
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    )
}
