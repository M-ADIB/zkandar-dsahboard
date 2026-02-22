import logo from '@/assets/logo.png'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Calendar,
    FileText,
    MessageSquare,
    BarChart3,
    Settings,
    Users,
    Menu,
    X,
    Building2,
    GraduationCap,
    TrendingUp,
    Wrench,
} from 'lucide-react'
import type { UserRole } from '@/types/database'
import { useViewMode } from '@/context/ViewModeContext'

interface SidebarProps {
    userRole: UserRole
}

interface NavItem {
    icon: React.ElementType
    label: string
    path: string
    roles: UserRole[]
}

const adminNavItems: NavItem[] = [
    {
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/admin',
        roles: ['owner', 'admin'],
    },
    {
        icon: Building2,
        label: 'Companies',
        path: '/admin/companies',
        roles: ['owner', 'admin'],
    },
    {
        icon: TrendingUp,
        label: 'Leads',
        path: '/admin/leads',
        roles: ['owner', 'admin'],
    },
    {
        icon: GraduationCap,
        label: 'Programs',
        path: '/admin/programs',
        roles: ['owner', 'admin'],
    },
    {
        icon: BarChart3,
        label: 'Analytics',
        path: '/analytics',
        roles: ['owner', 'admin'],
    },
    {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        roles: ['owner', 'admin'],
    },
]

const memberNavItems: NavItem[] = [
    {
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        roles: ['owner', 'admin', 'executive', 'participant'],
    },
    {
        icon: Calendar,
        label: 'Sessions',
        path: '/sessions',
        roles: ['owner', 'admin', 'executive', 'participant'],
    },
    {
        icon: FileText,
        label: 'Assignments',
        path: '/assignments',
        roles: ['owner', 'admin', 'participant'],
    },
    {
        icon: MessageSquare,
        label: 'Chat',
        path: '/chat',
        roles: ['owner', 'admin', 'executive', 'participant'],
    },
    {
        icon: Wrench,
        label: 'Toolbox',
        path: '/toolbox',
        roles: ['owner', 'admin', 'executive', 'participant'],
    },
    {
        icon: Users,
        label: 'Team',
        path: '/team',
        roles: ['executive'],
    },
    {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        roles: ['owner', 'admin', 'executive', 'participant'],
    },
]

export function Sidebar({ userRole }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()
    const { isPreviewing, canPreview, setPreviewing } = useViewMode()

    const activeItems = canPreview && !isPreviewing ? adminNavItems : memberNavItems
    const filteredItems = activeItems.filter((item) => item.roles.includes(userRole))

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-bg-card border border-border"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-screen w-64 z-50
          bg-bg-elevated border-r border-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-30
        `}
            >
                {/* Logo */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Skender AI" className="h-12 w-auto object-contain" />
                        <div>
                            <h1 className="font-heading text-lg font-bold tracking-wide">
                                ZKANDAR AI
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 rounded-lg hover:bg-white/5"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {filteredItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                            || (item.path !== '/admin' && location.pathname.startsWith(`${item.path}/`))

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 group
                  ${isActive
                                        ? 'bg-lime/10 text-lime'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }
                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 rounded-xl bg-lime/10 glow"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <Icon
                                    className={`h-5 w-5 relative z-10 ${isActive ? 'text-lime' : ''
                                        }`}
                                />
                                <span className="relative z-10 font-medium">{item.label}</span>
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    {canPreview && (
                        <button
                            onClick={() => setPreviewing(!isPreviewing)}
                            className="mb-3 w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-left text-xs font-medium text-gray-300 hover:border-lime/40"
                        >
                            <div className="flex items-center justify-between">
                                <span>Preview Member View</span>
                                <span className={`h-4 w-8 rounded-full border border-border p-0.5 ${isPreviewing ? 'bg-lime/20' : 'bg-white/5'}`}>
                                    <span
                                        className={`block h-3 w-3 rounded-full bg-lime transition-transform ${isPreviewing ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] text-gray-500">
                                {isPreviewing ? 'Showing member navigation' : 'Switch to member navigation'}
                            </div>
                        </button>
                    )}
                    <div className="px-4 py-3 rounded-xl bg-lime/5 border border-lime/20">
                        <p className="text-xs text-lime font-medium mb-1">Pro Tip</p>
                        <p className="text-xs text-gray-400">
                            Use the chat feature to connect with your cohort!
                        </p>
                    </div>
                </div>
            </aside>
        </>
    )
}
