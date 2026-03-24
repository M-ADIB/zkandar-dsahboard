import { useState } from 'react'
import { Bell, Search } from 'lucide-react'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { useNotifications } from '@/context/NotificationContext'

export function Navbar() {
    const { unreadCount } = useNotifications()
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <header className="sticky top-0 z-20 bg-bg-primary backdrop-blur-xl border-b border-border">
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

                </div>
            </div>
        </header>
    )
}
