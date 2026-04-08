import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, DollarSign, ListChecks } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface QuickAction {
    icon: React.ElementType
    label: string
    onClick: () => void
    color: string
}

export function QuickActionsFAB() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Only show for admin/owner
    if (!user || !['owner', 'admin'].includes(user.role)) return null

    const actions: QuickAction[] = [
        {
            icon: DollarSign,
            label: 'Record a Cost',
            onClick: () => {
                navigate('/admin/costs?action=add')
                setIsOpen(false)
            },
            color: 'bg-emerald-500/20 text-emerald-400',
        },
        {
            icon: ListChecks,
            label: 'Add a Task',
            onClick: () => {
                // Placeholder — task system not yet built
                setIsOpen(false)
            },
            color: 'bg-blue-500/20 text-blue-400',
        },
    ]

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen])

    return (
        <div ref={containerRef} className="fixed bottom-6 right-6 z-[80] flex flex-col-reverse items-end gap-3">
            {/* Main toggle button */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={`group relative h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ease-out flex items-center justify-center ${
                    isOpen
                        ? 'bg-white/10 border border-white/20 backdrop-blur-xl rotate-45 scale-95'
                        : 'gradient-lime hover:scale-110 hover:shadow-[0_0_30px_rgba(208,255,113,0.3)]'
                }`}
                aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
            >
                {isOpen ? (
                    <Plus className="h-6 w-6 text-white transition-transform duration-300" />
                ) : (
                    <Plus className="h-6 w-6 text-black transition-transform duration-300" />
                )}
            </button>

            {/* Action items — stacked vertically above the FAB */}
            {actions.map((action, idx) => {
                const Icon = action.icon
                return (
                    <div
                        key={action.label}
                        className="flex items-center gap-3 origin-bottom-right"
                        style={{
                            opacity: isOpen ? 1 : 0,
                            transform: isOpen
                                ? 'translateY(0) scale(1)'
                                : `translateY(${(idx + 1) * 12}px) scale(0.7)`,
                            transition: isOpen
                                ? `all 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 70}ms`
                                : `all 200ms ease-in ${(actions.length - 1 - idx) * 50}ms`,
                            pointerEvents: isOpen ? 'auto' : 'none',
                        }}
                    >
                        {/* Label pill */}
                        <button
                            onClick={action.onClick}
                            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-bg-card/95 backdrop-blur-xl border border-white/[0.08] shadow-xl hover:border-lime/30 hover:bg-white/[0.06] transition-all duration-200 group"
                        >
                            <div className={`h-8 w-8 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-white whitespace-nowrap">
                                {action.label}
                            </span>
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
