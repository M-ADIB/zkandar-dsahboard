import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Play, FileText, CheckCircle2, Clock } from 'lucide-react'

const sessions = [
    {
        id: 1,
        number: 1,
        title: 'Introduction to AI in Architecture',
        date: 'January 15, 2026',
        duration: '2 hours',
        status: 'completed',
        thumbnail: null,
        materialsCount: 3,
    },
    {
        id: 2,
        number: 2,
        title: 'Prompt Engineering Basics',
        date: 'January 22, 2026',
        duration: '2 hours',
        status: 'completed',
        thumbnail: null,
        materialsCount: 4,
    },
    {
        id: 3,
        number: 3,
        title: 'AI Image Generation for Design',
        date: 'January 29, 2026',
        duration: '2.5 hours',
        status: 'scheduled',
        thumbnail: null,
        materialsCount: 0,
    },
    {
        id: 4,
        number: 4,
        title: 'Automating Workflows with AI',
        date: 'February 5, 2026',
        duration: '2 hours',
        status: 'upcoming',
        thumbnail: null,
        materialsCount: 0,
    },
    {
        id: 5,
        number: 5,
        title: 'Advanced AI Integration',
        date: 'February 12, 2026',
        duration: '2 hours',
        status: 'upcoming',
        thumbnail: null,
        materialsCount: 0,
    },
]

export function SessionsPage() {
    const [filter, setFilter] = useState<'all' | 'completed' | 'upcoming'>('all')

    const filteredSessions = sessions.filter((session) => {
        if (filter === 'all') return true
        if (filter === 'completed') return session.status === 'completed'
        return session.status === 'scheduled' || session.status === 'upcoming'
    })

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Sessions</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Access your masterclass sessions and materials
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'all'
                            ? 'bg-lime/10 text-lime border border-lime/20'
                            : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'completed'
                            ? 'bg-lime/10 text-lime border border-lime/20'
                            : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'upcoming'
                            ? 'bg-lime/10 text-lime border border-lime/20'
                            : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        Upcoming
                    </button>
                </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session, index) => (
                    <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group bg-bg-card border border-border rounded-2xl overflow-hidden hover:border-lime/20 transition-colors"
                    >
                        {/* Thumbnail */}
                        <div className="aspect-video bg-bg-elevated relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-16 w-16 rounded-full bg-lime/10 flex items-center justify-center group-hover:bg-lime/20 transition">
                                    {session.status === 'completed' ? (
                                        <Play className="h-6 w-6 text-lime ml-1" />
                                    ) : (
                                        <Calendar className="h-6 w-6 text-lime" />
                                    )}
                                </div>
                            </div>
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                {session.status === 'completed' ? (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-lime/10 text-lime text-xs rounded-lg">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Completed
                                    </span>
                                ) : session.status === 'scheduled' ? (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg">
                                        <Clock className="h-3 w-3" />
                                        Live Soon
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-lg">
                                        <Clock className="h-3 w-3" />
                                        Upcoming
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <p className="text-xs text-lime mb-2">Session {session.number}</p>
                            <h3 className="font-semibold mb-2 line-clamp-2">{session.title}</h3>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>{session.date}</span>
                                <span>{session.duration}</span>
                            </div>
                            {session.materialsCount > 0 && (
                                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                                    <FileText className="h-3 w-3" />
                                    {session.materialsCount} materials
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
