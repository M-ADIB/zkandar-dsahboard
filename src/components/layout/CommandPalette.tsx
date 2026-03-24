import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '@/components/shared/Portal'
import { useAuth } from '@/context/AuthContext'
import {
    Search,
    LayoutDashboard,
    MessageSquare,
    BarChart3,
    Settings,
    Users,
    Building2,
    GraduationCap,
    TrendingUp,
    Mic,
    DollarSign,
    Briefcase,
    Wrench,
    FileText,
    Film,
    Command,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface PaletteItem {
    id: string
    icon: React.ElementType
    label: string
    path: string
    section: string
    roles: UserRole[]
}

const allItems: PaletteItem[] = [
    // Admin
    { id: 'admin-dash', icon: LayoutDashboard, label: 'Dashboard (Admin)', path: '/admin', section: 'Core', roles: ['owner', 'admin'] },
    { id: 'admin-chat', icon: MessageSquare, label: 'Chat (Admin)', path: '/admin/chat', section: 'Core', roles: ['owner', 'admin'] },
    { id: 'admin-analytics', icon: BarChart3, label: 'Analytics', path: '/admin/analytics', section: 'Core', roles: ['owner', 'admin'] },
    { id: 'admin-companies', icon: Building2, label: 'Companies', path: '/admin/companies', section: 'Network', roles: ['owner', 'admin'] },
    { id: 'admin-members', icon: Users, label: 'Members', path: '/admin/members', section: 'Network', roles: ['owner', 'admin'] },
    { id: 'admin-leads', icon: TrendingUp, label: 'Leads', path: '/admin/leads', section: 'Network', roles: ['owner', 'admin'] },
    { id: 'admin-programs', icon: GraduationCap, label: 'Programs', path: '/admin/programs', section: 'Operations', roles: ['owner', 'admin'] },
    { id: 'admin-events', icon: Mic, label: 'Events', path: '/admin/events', section: 'Operations', roles: ['owner', 'admin'] },
    { id: 'admin-costs', icon: DollarSign, label: 'Costs', path: '/admin/costs', section: 'Operations', roles: ['owner', 'admin'] },
    { id: 'admin-recruiting', icon: Briefcase, label: 'Recruiting', path: '/admin/recruiting', section: 'Operations', roles: ['owner', 'admin'] },
    // Member
    { id: 'member-dash', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', section: 'Learning', roles: ['owner', 'admin', 'executive', 'participant'] },
    { id: 'member-program', icon: GraduationCap, label: 'My Program', path: '/my-program', section: 'Learning', roles: ['owner', 'admin', 'executive', 'participant'] },
    { id: 'member-assignments', icon: FileText, label: 'Assignments', path: '/assignments', section: 'Learning', roles: ['owner', 'admin', 'executive', 'participant'] },
    { id: 'member-recordings', icon: Film, label: 'Recordings', path: '/recordings', section: 'Learning', roles: ['owner', 'admin', 'executive', 'participant'] },
    { id: 'member-performance', icon: TrendingUp, label: 'My Performance', path: '/my-performance', section: 'Learning', roles: ['owner', 'admin', 'executive', 'participant'] },
    { id: 'member-toolbox', icon: Wrench, label: 'Toolbox', path: '/toolbox', section: 'Learning', roles: ['owner', 'admin', 'executive', 'participant'] },
    { id: 'member-chat', icon: MessageSquare, label: 'Chat', path: '/chat', section: 'Connect', roles: ['owner', 'admin', 'executive', 'participant'] },
    // Shared
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings', section: 'System', roles: ['owner', 'admin', 'executive', 'participant'] },
]

export function CommandPalette() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const userRole = user?.role as UserRole | undefined

    const filteredItems = useMemo(() => {
        if (!userRole) return []
        const available = allItems.filter((item) => item.roles.includes(userRole))
        if (!query.trim()) return available
        const q = query.toLowerCase()
        return available.filter(
            (item) =>
                item.label.toLowerCase().includes(q) ||
                item.section.toLowerCase().includes(q) ||
                item.path.toLowerCase().includes(q)
        )
    }, [query, userRole])

    // Group items by section for rendering
    const grouped = useMemo(() => {
        const groups: { section: string; items: PaletteItem[] }[] = []
        for (const item of filteredItems) {
            const existing = groups.find((g) => g.section === item.section)
            if (existing) {
                existing.items.push(item)
            } else {
                groups.push({ section: item.section, items: [item] })
            }
        }
        return groups
    }, [filteredItems])

    const open = useCallback(() => {
        setIsOpen(true)
        setQuery('')
        setActiveIndex(0)
    }, [])

    const close = useCallback(() => {
        setIsOpen(false)
        setQuery('')
    }, [])

    const selectItem = useCallback(
        (item: PaletteItem) => {
            close()
            navigate(item.path)
        },
        [close, navigate]
    )

    // Global keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                if (isOpen) {
                    close()
                } else {
                    open()
                }
            }
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault()
                close()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, open, close])

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    }, [isOpen])

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(0)
    }, [query])

    // Keyboard navigation within palette
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const item = filteredItems[activeIndex]
            if (item) selectItem(item)
        }
    }

    // Scroll active item into view
    useEffect(() => {
        if (!listRef.current) return
        const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest' })
        }
    }, [activeIndex])

    if (!user) return null

    let flatIndex = -1

    return (
        <AnimatePresence>
            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[250]">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={close}
                        />

                        {/* Palette */}
                        <div className="absolute inset-0 flex items-start justify-center pt-[20vh]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                                className="w-full max-w-lg rounded-2xl bg-bg-elevated border border-border shadow-2xl overflow-hidden"
                                onKeyDown={handleKeyDown}
                            >
                                {/* Search Input */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                    <Search className="h-5 w-5 text-gray-500 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search pages…"
                                        className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none"
                                    />
                                    <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-white/5 border border-border rounded-md">
                                        ESC
                                    </kbd>
                                </div>

                                {/* Results */}
                                <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
                                    {filteredItems.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                                            No results found
                                        </div>
                                    ) : (
                                        grouped.map((group) => (
                                            <div key={group.section}>
                                                <div className="px-4 pt-2 pb-1">
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                                        {group.section}
                                                    </span>
                                                </div>
                                                {group.items.map((item) => {
                                                    flatIndex++
                                                    const idx = flatIndex
                                                    const isActive = idx === activeIndex
                                                    const Icon = item.icon
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            data-index={idx}
                                                            onClick={() => selectItem(item)}
                                                            onMouseEnter={() => setActiveIndex(idx)}
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                                                isActive
                                                                    ? 'bg-lime/10 text-lime'
                                                                    : 'text-gray-300 hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-lime' : 'text-gray-500'}`} />
                                                            <span className="flex-1 text-left font-medium">{item.label}</span>
                                                            {isActive && (
                                                                <span className="text-[10px] text-gray-500">↵</span>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[10px] text-gray-500">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-white/5 border border-border rounded text-[9px]">↑</kbd>
                                            <kbd className="px-1 py-0.5 bg-white/5 border border-border rounded text-[9px]">↓</kbd>
                                            Navigate
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-white/5 border border-border rounded text-[9px]">↵</kbd>
                                            Open
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1">
                                        <Command className="h-3 w-3" />K to toggle
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </Portal>
            )}
        </AnimatePresence>
    )
}
