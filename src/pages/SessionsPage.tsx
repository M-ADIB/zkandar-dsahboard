import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Play, FileText, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/hooks/useCompany'
import { formatDateLabel, formatTimeLabel } from '@/lib/time'
import type { Session } from '@/types/database'

type SessionCard = {
    id: string
    number: number
    title: string
    date: string
    duration: string
    status: 'completed' | 'scheduled' | 'upcoming'
    materialsCount: number
}

export function SessionsPage() {
    const [filter, setFilter] = useState<'all' | 'completed' | 'upcoming'>('all')
    const { user, loading: authLoading } = useAuth()
    const { company, loading: companyLoading } = useCompany()
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading || companyLoading) return
        const cohortId = company?.cohort_id

        if (!user || !cohortId) {
            setSessions([])
            setLoading(false)
            return
        }

        let ignore = false

        const fetchSessions = async () => {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('sessions')
                .select('*')
                .eq('cohort_id', cohortId)
                .order('session_number', { ascending: true })

            if (ignore) return

            if (fetchError) {
                setError(fetchError.message)
                setSessions([])
            } else {
                setSessions((data as Session[]) ?? [])
            }

            setLoading(false)
        }

        fetchSessions()

        return () => {
            ignore = true
        }
    }, [authLoading, companyLoading, user?.id, company?.cohort_id])

    const sessionCards = useMemo<SessionCard[]>(() => {
        return sessions.map((session) => {
            const scheduledAt = new Date(session.scheduled_date)
            const isPast = scheduledAt.getTime() < Date.now()
            const diffDays = (scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            const derivedStatus: SessionCard['status'] = session.status === 'completed' || isPast
                ? 'completed'
                : diffDays <= 3
                    ? 'scheduled'
                    : 'upcoming'

            const materialsCount = Array.isArray(session.materials) ? session.materials.length : 0

            return {
                id: session.id,
                number: session.session_number,
                title: session.title,
                date: formatDateLabel(session.scheduled_date) || 'TBD',
                duration: formatTimeLabel(session.scheduled_date) || 'TBD',
                status: derivedStatus,
                materialsCount,
            }
        })
    }, [sessions])

    const filteredSessions = sessionCards.filter((session) => {
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
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading sessions...</div>
            ) : error ? (
                <div className="p-8 text-center text-red-400">Failed to load sessions</div>
            ) : filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No sessions available yet.</div>
            ) : (
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
            )}
        </div>
    )
}
