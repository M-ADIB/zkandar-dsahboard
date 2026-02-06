import { motion } from 'framer-motion'
import {
    Users,
    GraduationCap,
    TrendingUp,
    Calendar,
    Plus,
    UserPlus,
    ArrowRight,
    Sparkles,
} from 'lucide-react'
import { MetricsCard } from '@/components/dashboard/MetricsCard'

const stats = [
    { icon: GraduationCap, label: 'Active Cohorts', value: '3', trend: '+1 this month' },
    { icon: Users, label: 'Total Participants', value: '156', trend: '+23 this week' },
    { icon: TrendingUp, label: 'Completion Rate', value: '87%', trend: '+5%' },
    { icon: Calendar, label: 'Upcoming Sessions', value: '12', trend: 'Next: Tomorrow' },
]

const recentActivity = [
    { user: 'Sarah Chen', action: 'completed Session 3', time: '10 min ago' },
    { user: 'Mike Johnson', action: 'submitted Assignment 2', time: '25 min ago' },
    { user: 'Emma Davis', action: 'joined the platform', time: '1 hour ago' },
    { user: 'Alex Kim', action: 'started onboarding survey', time: '2 hours ago' },
]

export function OwnerDashboard() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card to-bg-elevated border border-border p-8"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-lime" />
                        <span className="text-xs uppercase tracking-widest text-lime">
                            Admin Dashboard
                        </span>
                    </div>
                    <h1 className="hero-text text-3xl md:text-4xl mb-4">
                        Welcome back, <span className="text-gradient">Admin</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mb-6">
                        Here's an overview of your masterclass programs. Manage cohorts,
                        track progress, and engage with participants.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition">
                            <Plus className="h-4 w-4" />
                            Create Cohort
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl hover:border-lime/50 transition">
                            <UserPlus className="h-4 w-4" />
                            Invite Company
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <MetricsCard {...stat} />
                    </motion.div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-heading text-lg font-bold">Recent Activity</h2>
                        <button className="text-sm text-lime hover:underline flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition"
                            >
                                <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                                    <span className="text-lime font-bold text-sm">
                                        {activity.user.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <span className="font-medium">{activity.user}</span>{' '}
                                        <span className="text-gray-400">{activity.action}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h2 className="font-heading text-lg font-bold mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-lime/10 transition group">
                            <div className="h-10 w-10 rounded-lg gradient-lime flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-black" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-sm">Schedule Session</p>
                                <p className="text-xs text-gray-500">Set up your next class</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-lime transition" />
                        </button>
                        <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-lime/10 transition group">
                            <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-lime" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-sm">Manage Team</p>
                                <p className="text-xs text-gray-500">View all participants</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-lime transition" />
                        </button>
                        <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-lime/10 transition group">
                            <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-lime" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-sm">View Analytics</p>
                                <p className="text-xs text-gray-500">Track performance</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-lime transition" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
