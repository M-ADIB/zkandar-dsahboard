import { motion } from 'framer-motion'

interface ProgressBarProps {
    current: number
    total: number
    label?: string
    showPercentage?: boolean
}

export function ProgressBar({ current, total, label, showPercentage = false }: ProgressBarProps) {
    const percentage = Math.round((current / total) * 100)

    return (
        <div className="space-y-2">
            {(label || showPercentage) && (
                <div className="flex items-center justify-between text-xs">
                    {label && <span className="text-gray-500">{label}</span>}
                    {showPercentage && <span className="text-lime">{percentage}%</span>}
                </div>
            )}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full gradient-lime rounded-full"
                    style={{ boxShadow: '0 0 10px rgba(208, 255, 113, 0.3)' }}
                />
            </div>
        </div>
    )
}
