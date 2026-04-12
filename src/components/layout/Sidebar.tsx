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
    Wrench,
    ChevronDown,
    LogOut,
    FileText,
    Film,
    SlidersHorizontal,
    Mail,
} from 'lucide-react'
import type { UserRole, UserType } from '@/types/database'
import type { User as DbUser } from '@/types/database'
import { useViewMode } from '@/context/ViewModeContext'
import { useNotifications } from '@/context/NotificationContext'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
    userRole: UserRole
    userType?: UserType | null
}

interface NavItem {
    icon: React.ElementType
    label: string
    path: string
    roles: UserRole[]
    hiddenForUserTypes?: UserType[]
}

interface NavSection {
    title: string
    id: string
    items: NavItem[]
}

const adminNavSections: NavSection[] = [
    {
        title: 'Core',
        id: 'admin_core',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', roles: ['owner', 'admin'] },
            { icon: MessageSquare, label: 'Chat', path: '/admin/chat', roles: ['owner', 'admin'] },
            { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', roles: ['owner', 'admin'] },
        ]
    },
    {
        title: 'Network',
        id: 'admin_network',
        items: [
            { icon: Building2, label: 'Companies', path: '/admin/companies', roles: ['owner', 'admin'] },
            { icon: Users, label: 'Members', path: '/admin/members', roles: ['owner', 'admin'] },
            { icon: TrendingUp, label: 'Leads', path: '/admin/leads', roles: ['owner', 'admin'] },
        ]
    },
    {
        title: 'Operations',
        id: 'admin_operations',
        items: [
            { icon: GraduationCap, label: 'Programs', path: '/admin/programs', roles: ['owner', 'admin'] },
            { icon: Mic, label: 'Events', path: '/admin/events', roles: ['owner', 'admin'] },
            { icon: DollarSign, label: 'Costs', path: '/admin/costs', roles: ['owner', 'admin'] },
            { icon: Mail, label: 'Email', path: '/admin/email', roles: ['owner', 'admin'] },
{ icon: Briefcase, label: 'Recruiting', path: '/admin/recruiting', roles: ['owner', 'admin'] },
        ]
    },
    {
        title: 'System',
        id: 'admin_system',
        items: [
            { icon: SlidersHorizontal, label: 'Platform Settings', path: '/admin/settings', roles: ['owner', 'admin'] },
            { icon: Settings, label: 'My Settings', path: '/settings', roles: ['owner', 'admin'] },
        ]
    }
]

const memberNavSections: NavSection[] = [
    {
        title: 'Learning',
        id: 'member_learning',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['owner', 'admin', 'executive', 'participant'] },
            { icon: GraduationCap, label: 'My Program', path: '/my-program', roles: ['owner', 'admin', 'executive', 'participant'], hiddenForUserTypes: ['sprint_member'] },
            { icon: FileText, label: 'Assignments', path: '/assignments', roles: ['owner', 'admin', 'executive', 'participant'] },
            { icon: Film, label: 'Recordings', path: '/recordings', roles: ['owner', 'admin', 'executive', 'participant'] },
            { icon: TrendingUp, label: 'My Performance', path: '/my-performance', roles: ['owner', 'admin', 'executive', 'participant'], hiddenForUserTypes: ['sprint_member'] },
            { icon: Wrench, label: 'Toolbox', path: '/toolbox', roles: ['owner', 'admin', 'executive', 'participant'] },
        ]
    },
    {
        title: 'Connect',
        id: 'member_connect',
        items: [
            { icon: MessageSquare, label: 'Chat', path: '/chat', roles: ['owner', 'admin', 'executive', 'participant'], hiddenForUserTypes: ['sprint_member'] },
        ]
    },
    {
        title: 'System',
        id: 'member_system',
        items: [
            { icon: Settings, label: 'Settings', path: '/settings', roles: ['owner', 'admin', 'executive', 'participant'] },
        ]
    }
]

export function Sidebar({ userRole, userType }: SidebarProps) {
    const { user, signOut } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const location = useLocation()
    const { isPreviewing, canPreview, previewUser, setPreviewUser } = useViewMode()
    const { unreadCount } = useNotifications()

    // Member picker state
    const [pickerOpen, setPickerOpen] = useState(false)
    const [members, setMembers] = useState<DbUser[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loadingMembers, setLoadingMembers] = useState(false)

    const activeSections = canPreview && !isPreviewing ? adminNavSections : memberNavSections
    const filteredSections = activeSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
            item.roles.includes(userRole) &&
            !(userType && item.hiddenForUserTypes?.includes(userType))
        )
    })).filter(section => section.items.length > 0)

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('zkandar_sidebar_state')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                // Return default state on parse error
            }
        }
        return {
            admin_core: true, admin_network: true, admin_operations: true, admin_system: true,
            member_learning: true, member_connect: true, member_system: true
        }
    })

    const toggleSection = (id: string) => {
        setOpenSections(prev => {
            const next = { ...prev, [id]: !prev[id] }
            localStorage.setItem('zkandar_sidebar_state', JSON.stringify(next))
            return next
        })
    }

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
            setMembers((data as DbUser[]) ?? [])
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
                    <NavLink to={canPreview && !isPreviewing ? '/admin' : '/dashboard'} className="flex items-center gap-3 hover:opacity-80 transition" onClick={() => setIsOpen(false)}>
                        <img src={logo} alt="Skender AI" className="h-12 w-auto object-contain" />
                        <div>
                            <h1 className="font-heading text-lg font-bold tracking-wide">
                                ZKANDAR AI
                            </h1>
                        </div>
                    </NavLink>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 rounded-lg hover:bg-white/5"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
                    {filteredSections.map((section) => {
                        const isExpanded = openSections[section.id] !== false // Default to true

                        return (
                            <div key={section.id} className="space-y-1">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition"
                                >
                                    {section.title}
                                    <ChevronDown
                                        className={`h-3 w-3 transition-transform duration-200 ${
                                            isExpanded ? '' : '-rotate-90'
                                        }`}
                                    />
                                </button>
                                
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-1 overflow-hidden"
                                        >
                                            {section.items.map((item) => {
                                                const Icon = item.icon
                                                const isActive = location.pathname === item.path
                                                    || (item.path !== '/admin' && location.pathname !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))

                                                return (
                                                    <NavLink
                                                        key={item.path}
                                                        to={item.path}
                                                        onClick={() => setIsOpen(false)}
                                                        className={`
                                                            relative flex items-center gap-3 px-4 py-2.5 rounded-xl
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
                                                            className={`h-4 w-4 relative z-10 ${isActive ? 'text-lime' : ''
                                                                }`}
                                                        />
                                                        <span className="relative z-10 font-medium text-sm flex-1">
                                                            {item.path === '/dashboard' && userType === 'sprint_member' ? 'My Program' : item.label}
                                                        </span>
                                                        {item.label === 'Chat' && unreadCount > 0 && (
                                                            <span className="relative z-10 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full bg-red-500 text-white">
                                                                {unreadCount > 99 ? '99+' : unreadCount}
                                                            </span>
                                                        )}
                                                    </NavLink>
                                                )
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
                                        className="w-full rounded-xl border border-border bg-bg-card px-4 py-2 text-left text-xs font-medium text-gray-300 hover:border-lime/40 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-white font-medium text-sm">
                                                <Eye className="h-4 w-4 text-gray-400" />
                                                Preview as Member
                                            </span>
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
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
                    
                    {/* User Profile */}
                    <div className="relative mt-auto">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-bg-card transition-colors group"
                        >
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                            ) : (
                                <div className="h-10 w-10 rounded-lg gradient-lime flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-black">{user?.full_name?.charAt(0) || 'U'}</span>
                                </div>
                            )}
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'User'}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{user?.role}</p>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180 text-lime' : 'group-hover:text-white'}`} />
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute bottom-full left-0 mb-3 w-full bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-border">
                                            <p className="font-medium text-sm text-white truncate">{user?.full_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <div className="p-1.5">
                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(false)
                                                    signOut()
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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
            </aside>
        </>
    )
}
