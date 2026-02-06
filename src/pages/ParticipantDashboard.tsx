import { motion } from 'framer-motion'
import {
    Calendar,
    FileText,
    MessageSquare,
    CheckCircle2,
    Clock,
    ArrowRight,
    Sparkles,
    Play,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ProgressBar } from '@/components/shared/ProgressBar'

const sessions = [
    { id: 1, title: 'Introduction to AI in Architecture', date: 'Jan 15', completed: true },
    { id: 2, title: 'Prompt Engineering Basics', date: 'Jan 22', completed: true },
    { id: 3, title: 'AI Image Generation for Design', date: 'Jan 29', completed: false, current: true },
    { id: 4, title: 'Automating Workflows with AI', date: 'Feb 5', completed: false },
    { id: 5, title: 'Advanced AI Integration', date: 'Feb 12', completed: false },
]

const assignments = [
    { id: 1, title: 'Create AI-Generated Concept Renders', dueDate: 'Feb 1', status: 'pending' },
    { id: 2, title: 'Prompt Engineering Exercise', dueDate: 'Feb 8', status: 'upcoming' },
]

const recentMessages = [
    { sender: 'John Smith', message: 'Great work on the last assignment!', time: '5m ago' },
    { sender: 'Admin', message: 'Session 3 materials are now available', time: '1h ago' },
]

export function ParticipantDashboard() {
    const { user } = useAuth()
    const firstName = user?.full_name?.split(' ')[0] || 'there'

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
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
                            Your Learning Journey
                        </span>
                    </div>
                    <h1 className="hero-text text-3xl md:text-4xl mb-4">
                        Hey <span className="text-gradient">{firstName}</span>, here's your progress
                    </h1>
                    <p className="text-gray-400 max-w-lg">
                        You're making great progress! Keep up the momentum and complete your
                        assignments to earn your certificate.
                    </p>
                </div>
            </motion.div>

            {/* Progress Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <div className="bg-bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">2/5</p>
                            <p className="text-xs text-gray-500">Sessions Attended</p>
                        </div>
                    </div>
                    <ProgressBar current={2} total={5} />
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">1/4</p>
                            <p className="text-xs text-gray-500">Assignments Done</p>
                        </div>
                    </div>
                    <ProgressBar current={1} total={4} />
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{user?.ai_readiness_score || 0}%</p>
                            <p className="text-xs text-gray-500">AI Readiness Score</p>
                        </div>
                    </div>
                    <ProgressBar current={user?.ai_readiness_score || 0} total={100} />
                </div>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Session Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h2 className="font-heading text-lg font-bold mb-6">Session Timeline</h2>
                    <div className="space-y-4">
                        {sessions.map((session, index) => (
                            <div
                                key={session.id}
                                className={`relative flex items-center gap-4 p-4 rounded-xl transition
                  ${session.current ? 'bg-lime/5 border border-lime/20' : 'hover:bg-white/5'}
                `}
                            >
                                {/* Timeline line */}
                                {index < sessions.length - 1 && (
                                    <div className="absolute left-7 top-16 w-0.5 h-6 bg-border" />
                                )}

                                {/* Status icon */}
                                <div
                                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                    ${session.completed ? 'bg-lime/10' : session.current ? 'gradient-lime' : 'bg-white/5'}
                  `}
                                >
                                    {session.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-lime" />
                                    ) : session.current ? (
                                        <Play className="h-5 w-5 text-black" />
                                    ) : (
                                        <Clock className="h-5 w-5 text-gray-500" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <p className={`font-medium ${session.completed ? 'text-gray-400' : ''}`}>
                                        {session.title}
                                    </p>
                                    <p className="text-xs text-gray-500">{session.date}</p>
                                </div>

                                {/* Action */}
                                {session.current && (
                                    <button className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg">
                                        Watch Now
                                    </button>
                                )}
                                {session.completed && (
                                    <button className="px-4 py-2 text-sm border border-border rounded-lg hover:border-lime/50 transition">
                                        Rewatch
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Upcoming Assignments */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-bg-card border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-heading text-lg font-bold">Assignments</h2>
                            <button className="text-sm text-lime hover:underline">View all</button>
                        </div>
                        <div className="space-y-3">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="p-4 rounded-xl bg-white/5 hover:bg-lime/5 transition"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-sm">{assignment.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">Due: {assignment.dueDate}</p>
                                        </div>
                                        {assignment.status === 'pending' && (
                                            <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded-lg">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Chat */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-bg-card border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-heading text-lg font-bold">Chat</h2>
                            <MessageSquare className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="space-y-3">
                            {recentMessages.map((msg, index) => (
                                <div key={index} className="p-3 rounded-xl bg-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium">{msg.sender}</p>
                                        <p className="text-xs text-gray-500">{msg.time}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">{msg.message}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2 border border-border rounded-xl text-sm hover:border-lime/50 transition flex items-center justify-center gap-2">
                            Open Chat <ArrowRight className="h-3 w-3" />
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
