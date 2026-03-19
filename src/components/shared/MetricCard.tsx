import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export interface MetricCardProps {
    label: string
    value: string | number
    icon?: React.ElementType<{ className?: string }>
    trend?: string | React.ReactNode
    sub?: string | React.ReactNode
    limeAccent?: boolean
    iconColor?: string
    onClick?: () => void
    delay?: number
}

export function MetricCard({
    label,
    value,
    icon: Icon,
    trend,
    sub,
    limeAccent = false,
    iconColor = 'text-gray-500',
    onClick,
    delay = 0,
}: MetricCardProps) {
    const isClickable = !!onClick

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            onClick={onClick}
            className={`group relative flex flex-col justify-between bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.15] rounded-[24px] p-6 overflow-hidden transition-all duration-300 shadow-sm ${isClickable ? 'cursor-pointer hover:shadow-[0_0_20px_rgba(208,255,113,0.08)] hover:border-lime/30' : ''}`}
        >
            {/* Subtle interactive glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-[0.03] group-hover:opacity-[0.10] transition-opacity duration-500 pointer-events-none ${limeAccent ? 'bg-lime' : 'bg-white'}`} />
            
            {/* Top gradient hairline (glows on hover if lime, otherwise subtle white) */}
            <span className={`absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/0 to-transparent transition-all duration-500 ${limeAccent ? 'group-hover:via-lime/50' : 'group-hover:via-white/20'}`} />

            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                {/* Header (Icon + Trend) */}
                <div className="flex items-start justify-between">
                    {Icon ? (
                        <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.03] border border-white/[0.05] shadow-inner ${iconColor}`}>
                            <Icon className="h-4 w-4" />
                        </span>
                    ) : (
                        <div /> // Placeholder for spacing if no icon
                    )}
                    
                    <div className="flex items-center gap-3">
                        {limeAccent && <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_8px_rgba(208,255,113,0.8)] animate-pulse" />}
                        {trend && (
                            <span className="text-xs text-lime bg-lime/10 px-2 py-1 rounded-lg border border-lime/20 font-medium">
                                {trend}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content (Value + Label + Sub) */}
                <div>
                    <h3 className={`text-3xl font-semibold tracking-tight tabular-nums ${limeAccent ? 'text-lime drop-shadow-[0_0_12px_rgba(208,255,113,0.15)]' : 'text-white'}`}>
                        {value}
                    </h3>
                    
                    <div className="mt-1.5 flex flex-col gap-1">
                        <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-gray-400">
                            {label}
                        </p>
                        {sub && <p className="text-xs text-gray-500 leading-snug">{sub}</p>}
                    </div>
                </div>
            </div>

            {isClickable && (
                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </motion.div>
    )
}
