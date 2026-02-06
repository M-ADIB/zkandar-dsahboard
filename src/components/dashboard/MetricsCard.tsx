import type { LucideIcon } from 'lucide-react'

interface MetricsCardProps {
    icon: LucideIcon
    label: string
    value: string
    trend?: string
}

export function MetricsCard({ icon: Icon, label, value, trend }: MetricsCardProps) {
    return (
        <div className="bg-bg-card border border-border rounded-2xl p-6 hover:border-lime/20 transition-colors group">
            <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-lime/10 flex items-center justify-center group-hover:glow transition-shadow">
                    <Icon className="h-6 w-6 text-lime" />
                </div>
            </div>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
            {trend && (
                <p className="text-xs text-lime mt-2">{trend}</p>
            )}
        </div>
    )
}
