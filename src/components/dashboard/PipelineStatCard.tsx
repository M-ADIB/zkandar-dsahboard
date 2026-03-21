import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PipelineStatCardProps {
    value: string | number | ReactNode;
    label: string;
    icon?: ReactNode;
    colorMain?: string; // Tailwind color class for text/glow
    onClick?: () => void;
    className?: string;
}

export function PipelineStatCard({ value, label, icon, colorMain = "text-white", onClick, className }: PipelineStatCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group relative w-full h-[120px] rounded-xl overflow-hidden p-[1px] bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02] cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${className || ''}`}
        >
            {/* The animated moving halo inside the card border */}
            <motion.div
                className="absolute w-12 h-12 rounded-full bg-white/20 blur-xl z-0"
                animate={{
                    top: ["-10%", "-10%", "110%", "110%", "-10%"],
                    left: ["-10%", "110%", "110%", "-10%", "-10%"],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Card content container */}
            <div className="relative flex flex-col items-center justify-center w-full h-full rounded-xl bg-bg-elevated/90 backdrop-blur-md z-10 p-3 hover:bg-bg-elevated/80 transition-colors">
                
                {/* Value & Icon Row */}
                <div className={`text-2xl font-black tracking-tight flex items-center justify-center gap-2 mb-1 z-20 ${colorMain}`}>
                    {icon && <span className="opacity-80">{icon}</span>}
                    {value}
                </div>

                {/* Label Row */}
                <div className="text-[11px] font-medium tracking-[0.05em] uppercase text-gray-500 z-20">
                    {label}
                </div>

                {/* Subtle scanning lines on hover */}
                <motion.div
                    className="absolute top-[10%] w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{ y: [0, 80, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
            </div>
            
            {/* Subtle glow border appearing on hover behind everything */}
            <div className="absolute inset-0 z-0 bg-lime/0 group-hover:bg-lime/5 transition-colors duration-500 rounded-xl" />
        </div>
    )
}
