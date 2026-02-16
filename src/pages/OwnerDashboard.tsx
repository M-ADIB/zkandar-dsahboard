import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatDateLabel, formatRelativeTime } from '@/lib/time'
import type { Assignment, Cohort, Session, Submission, User } from '@/types/database'

export function OwnerDashboard() {
    const { user } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let ignore = false

        const fetchData = async () => {
            setLoading(true)
            setError(null)

            const [usersResult, cohortsResult, sessionsResult, assignmentsResult, submissionsResult] = await Promise.all([
                supabase
                    .from('users')
                    .select('id, full_name, role, onboarding_completed, onboarding_data, created_at'),
                supabase
                    .from('cohorts')
                    .select('id, name, status, start_date, end_date'),
                supabase
                    .from('sessions')
                    .select('id, scheduled_date, status'),
                supabase
                    .from('assignments')
                    .select('id, title'),
                supabase
                    .from('submissions')
                    .select('id, user_id, assignment_id, submitted_at')
                    .order('submitted_at', { ascending: false })
                    .limit(20),
            ])

            if (ignore) return

            const errors = [
                usersResult.error,
                cohortsResult.error,
                sessionsResult.error,
                assignmentsResult.error,
                submissionsResult.error,
            ].filter(Boolean)

            if (errors.length > 0) {
                setError(errors[0]?.message ?? 'Failed to load dashboard')
                setLoading(false)
                return
            }

            setUsers((usersResult.data as User[]) ?? [])
            setCohorts((cohortsResult.data as Cohort[]) ?? [])
            setSessions((sessionsResult.data as Session[]) ?? [])
            setAssignments((assignmentsResult.data as Assignment[]) ?? [])
            setSubmissions((submissionsResult.data as Submission[]) ?? [])
            setLoading(false)
        }

        fetchData()

        return () => {
            ignore = true
        }
    }, [])

    const participantUsers = useMemo(() => {
        return users.filter((userItem) => userItem.role !== 'owner' && userItem.role !== 'admin')
    }, [users])

    const onboardingCompletedCount = useMemo(() => {
        return participantUsers.filter((userItem) => userItem.onboarding_completed).length
    }, [participantUsers])

    const onboardingRate = useMemo(() => {
        if (participantUsers.length === 0) return 0
        return Math.round((onboardingCompletedCount / participantUsers.length) * 100)
    }, [participantUsers.length, onboardingCompletedCount])

    const activePrograms = useMemo(() => {
        return cohorts.filter((cohort) => cohort.status === 'active').length
    }, [cohorts])

    const upcomingSessions = useMemo(() => {
        const now = Date.now()
        return sessions.filter((session) => {
            const date = new Date(session.scheduled_date).getTime()
            return date > now && session.status !== 'completed'
        })
    }, [sessions])

    const nextSessionLabel = useMemo(() => {
        if (upcomingSessions.length === 0) return 'No upcoming sessions'
        const next = upcomingSessions
            .slice()
            .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0]
        return formatDateLabel(next.scheduled_date) || 'Upcoming session'
    }, [upcomingSessions])

    const stats = useMemo(() => ([
        { icon: GraduationCap, label: 'Active Programs', value: String(activePrograms), trend: activePrograms > 0 ? 'Running now' : 'No active programs' },
        { icon: Users, label: 'Total Participants', value: String(participantUsers.length), trend: `${onboardingCompletedCount} onboarded` },
        { icon: TrendingUp, label: 'Onboarding Completion', value: `${onboardingRate}%`, trend: 'Across all programs' },
        { icon: Calendar, label: 'Upcoming Sessions', value: String(upcomingSessions.length), trend: `Next: ${nextSessionLabel}` },
    ]), [activePrograms, participantUsers.length, onboardingCompletedCount, onboardingRate, upcomingSessions.length, nextSessionLabel])

    const recentActivity = useMemo(() => {
        const assignmentMap = new Map(assignments.map((assignment) => [assignment.id, assignment]))
        const userMap = new Map(users.map((userItem) => [userItem.id, userItem]))
        const events: { id: string; user: string; action: string; time: string }[] = []

        submissions.forEach((submission) => {
            const userItem = userMap.get(submission.user_id)
            const assignment = assignmentMap.get(submission.assignment_id)
            if (!userItem) return
            events.push({
                id: `submission-${submission.id}`,
                user: userItem.full_name,
                action: `submitted ${assignment?.title ?? 'an assignment'}`,
                time: submission.submitted_at,
            })
        })

        users.forEach((userItem) => {
            const completedAt = (userItem.onboarding_data as { completed_at?: string } | null)?.completed_at
            if (completedAt) {
                events.push({
                    id: `onboarding-${userItem.id}`,
                    user: userItem.full_name,
                    action: 'completed onboarding survey',
                    time: completedAt,
                })
            }
        })

        return events
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 6)
            .map((event) => ({
                ...event,
                time: formatRelativeTime(event.time),
            }))
    }, [assignments, submissions, users])

    const displayName = user?.full_name?.split(' ')[0] || 'Admin'

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
                        Welcome back, <span className="text-gradient">{displayName}</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mb-6">
                        Here's an overview of your masterclass programs. Manage cohorts,
                        track progress, and engage with participants.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/admin/programs"
                            className="flex items-center gap-2 px-5 py-2.5 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition"
                        >
                            <Plus className="h-4 w-4" />
                            Create Program
                        </Link>
                        <Link
                            to="/admin/companies"
                            className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl hover:border-lime/50 transition"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Company
                        </Link>
                    </div>
                </div>
            </motion.div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading dashboard...</div>
            ) : (
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
            )}

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
                        <Link to="/analytics" className="text-sm text-lime hover:underline flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <div className="p-6 text-sm text-gray-500 text-center">
                                No recent activity yet.
                            </div>
                        ) : (
                            recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
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
                            ))
                        )}
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
                        <Link
                            to="/admin/programs"
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-lime/10 transition group"
                        >
                            <div className="h-10 w-10 rounded-lg gradient-lime flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-black" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-sm">Schedule Session</p>
                                <p className="text-xs text-gray-500">Set up your next class</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-lime transition" />
                        </Link>
                        <Link
                            to="/admin/users"
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-lime/10 transition group"
                        >
                            <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-lime" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-sm">Manage Team</p>
                                <p className="text-xs text-gray-500">View all participants</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-lime transition" />
                        </Link>
                        <Link
                            to="/analytics"
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-lime/10 transition group"
                        >
                            <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-lime" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-sm">View Analytics</p>
                                <p className="text-xs text-gray-500">Track performance</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-lime transition" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
