import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, CheckCircle2, MessageSquare } from 'lucide-react'

const completionData = [
    { name: 'Session 1', completed: 45, total: 50 },
    { name: 'Session 2', completed: 42, total: 50 },
    { name: 'Session 3', completed: 38, total: 50 },
    { name: 'Session 4', completed: 15, total: 50 },
    { name: 'Session 5', completed: 0, total: 50 },
]

const aiReadinessData = [
    { week: 'Week 1', score: 25 },
    { week: 'Week 2', score: 35 },
    { week: 'Week 3', score: 48 },
    { week: 'Week 4', score: 62 },
    { week: 'Week 5', score: 75 },
]

const toolAdoption = [
    { name: 'Midjourney', value: 85, color: '#D0FF71' },
    { name: 'ChatGPT', value: 92, color: '#5A9F2E' },
    { name: 'DALL-E', value: 65, color: '#75C345' },
    { name: 'Stable Diffusion', value: 45, color: '#9AD41A' },
]

const stats = [
    { icon: Users, label: 'Total Participants', value: '156' },
    { icon: CheckCircle2, label: 'Avg Completion', value: '78%' },
    { icon: TrendingUp, label: 'AI Score Growth', value: '+50%' },
    { icon: MessageSquare, label: 'Messages Today', value: '234' },
]

export function AnalyticsDashboard() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-heading font-bold">Analytics</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Track cohort progress and engagement metrics
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-bg-card border border-border rounded-2xl p-5"
                        >
                            <Icon className="h-5 w-5 text-lime mb-3" />
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </motion.div>
                    )
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Completion Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">Session Completion</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={completionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#111',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="completed" fill="#D0FF71" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* AI Readiness Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">AI Readiness Score Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={aiReadinessData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#111',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#D0FF71"
                                    strokeWidth={3}
                                    dot={{ fill: '#D0FF71', strokeWidth: 0, r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Tool Adoption */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">Tool Adoption</h3>
                    <div className="h-64 flex items-center">
                        <div className="w-1/2">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={toolAdoption}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                        paddingAngle={3}
                                    >
                                        {toolAdoption.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-3">
                            {toolAdoption.map((tool) => (
                                <div key={tool.name} className="flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: tool.color }}
                                    />
                                    <span className="text-sm flex-1">{tool.name}</span>
                                    <span className="text-sm text-gray-400">{tool.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Engagement Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h3 className="font-heading font-bold mb-6">Chat Engagement</h3>
                    <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-lime/30 mx-auto mb-4" />
                            <p className="text-gray-500">Detailed engagement heatmap</p>
                            <p className="text-xs text-gray-600 mt-1">Coming soon</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
