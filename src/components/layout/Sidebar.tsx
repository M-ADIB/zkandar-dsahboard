import logo from '@/assets/logo.png'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    MessageSquare,
    BarChart3,
    Settings,
    Users,
    Menu,
    X,
    Building2,
    GraduationCap,
    TrendingUp,
    Search,
    Eye,
    EyeOff,
    Mic,
    DollarSign,
    Briefcase,
} from 'lucide-react'
import type { User, UserRole } from '@/types/database'
import { useViewMode } from '@/context/ViewModeContext'
import { supabase } from '@/lib/supabase'

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
        icon: Users,
        label: 'Members',
        path: '/admin/members',
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
        icon: MessageSquare,
        label: 'Chat',
        path: '/admin/chat',
        roles: ['owner', 'admin'],
    },
    {
        icon: BarChart3,
        label: 'Analytics',
        path: '/admin/analytics',
        roles: ['owner', 'admin'],
    },
    {
        icon: Mic,
        label: 'Events',
        path: '/admin/events',
        roles: ['owner', 'admin'],
    },
    {
        icon: DollarSign,
        label: 'Costs',
        path: '/admin/costs',
        roles: ['owner', 'admin'],
    },
    {
        icon: Briefcase,
        label: 'Recruiting',
        path: '/admin/recruiting',
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
        icon: GraduationCap,
        label: 'My Program',
        path: '/my-program',
        roles: ['owner', 'admin', 'executive', 'participant'],
    },
    {
        icon: TrendingUp,
        label: 'My Performance',
        path: '/my-performance',
        roles: ['owner', 'admin', 'executive', 'participant'],
    },
    {
        icon: MessageSquare,
        label: 'Chat',
        path: '/chat',
        roles: ['owner', 'admin', 'executive', 'participant'],
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
    const { isPreviewing, canPreview, previewUser, setPreviewUser } = useViewMode()

    // Member picker state
    const [pickerOpen, setPickerOpen] = useState(false)
    const [members, setMembers] = useState<User[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loadingMembers, setLoadingMembers] = useState(false)

    const activeItems = canPreview && !isPreviewing ? adminNavItems : memberNavItems
    const filteredItems = activeItems.filter((item) => item.roles.includes(userRole))

    // Fetch members when picker opens
    useEffect(() => {
        if (!pickerOpen || members.length > 0) return
        const fetchMembers = async () => {
            setLoadingMembers(true)
            const { data } = await supabase
                .from('users')
                .select('*')
                .in('role', ['participant', 'executive'])
                .order('full_name', { ascending: true })
            setMembers((data as User[]) ?? [])
            setLoadingMembers(false)
        }
        fetchMembers()
    }, [pickerOpen, members.length])

    const filteredMembers = members.filter((m) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    })

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

                {/* Footer — Preview Member Picker */}
                <div className="p-4 border-t border-border space-y-3">
                    {canPreview && (
                        <>
                            {isPreviewing && previewUser ? (
                                // Currently previewing — show who + exit button
                                <div className="rounded-xl border border-lime/30 bg-lime/5 p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-lime shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] text-lime font-medium uppercase tracking-wider">Previewing as</p>
                                            <p className="text-sm text-white font-semibold truncate">{previewUser.full_name}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{previewUser.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPreviewUser(null)}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-bg-card text-gray-300 hover:text-white hover:border-gray-500 transition"
                                    >
                                        <EyeOff className="h-3.5 w-3.5" />
                                        Exit Preview
                                    </button>
                                </div>
                            ) : (
                                // Not previewing — show picker button or picker dropdown
                                <div className="relative">
                                    <button
                                        onClick={() => setPickerOpen(!pickerOpen)}
                                        className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-left text-xs font-medium text-gray-300 hover:border-lime/40 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Eye className="h-4 w-4 text-gray-500" />
                                                Preview as Member
                                            </span>
                                            <span className="text-gray-600 text-[10px]">▾</span>
                                        </div>
                                        <div className="mt-1 text-[11px] text-gray-500">
                                            View dashboard as a specific member
                                        </div>
                                    </button>

                                    {/* Member Picker Dropdown */}
                                    <AnimatePresence>
                                        {pickerOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute bottom-full left-0 right-0 mb-2 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                                            >
                                                {/* Search */}
                                                <div className="p-2 border-b border-border">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search members..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            autoFocus
                                                            className="w-full pl-8 pr-3 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Member list */}
                                                <div className="max-h-52 overflow-y-auto">
                                                    {loadingMembers ? (
                                                        <div className="py-6 text-center">
                                                            <div className="h-5 w-5 rounded-full border-2 border-lime border-t-transparent animate-spin mx-auto" />
                                                        </div>
                                                    ) : filteredMembers.length === 0 ? (
                                                        <div className="py-4 text-center text-xs text-gray-500">No members found</div>
                                                    ) : (
                                                        filteredMembers.map((m) => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => {
                                                                    setPreviewUser(m)
                                                                    setPickerOpen(false)
                                                                    setSearchQuery('')
                                                                }}
                                                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition text-left"
                                                            >
                                                                <div className="h-7 w-7 rounded-lg bg-lime/10 flex items-center justify-center text-[10px] font-bold text-lime shrink-0">
                                                                    {m.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs text-white truncate">{m.full_name}</p>
                                                                    <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
                                                                </div>
                                                                <span className="text-[9px] text-gray-600 capitalize shrink-0">{m.user_type || m.role}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Close */}
                                                <div className="p-2 border-t border-border">
                                                    <button
                                                        onClick={() => { setPickerOpen(false); setSearchQuery('') }}
                                                        className="w-full py-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </>
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
