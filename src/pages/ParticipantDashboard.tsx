import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useViewMode } from '@/context/ViewModeContext'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { supabase } from '@/lib/supabase'
import { formatDateLabel, formatRelativeTime } from '@/lib/time'
import type { Assignment, ChatMessage, Cohort, Session, Submission } from '@/types/database'

export function ParticipantDashboard() {
    const { user } = useAuth()
    const { effectiveUserId } = useViewMode()

    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const firstName = user?.full_name?.split(' ')[0] || 'there'

    useEffect(() => {
        if (!effectiveUserId) {
            setLoading(false)
            return
        }

        let ignore = false

        const fetchDashboard = async () => {
            setLoading(true)
            setError(null)

            // ── 1. Get all cohort IDs accessible to this user ──────────────────
            // Via their company's cohort_id
            const [profileRes, membershipRes] = await Promise.all([
                supabase
                    .from('users')
                    .select('company_id, ai_readiness_score')
                    .eq('id', effectiveUserId)
                    .single(),
                supabase
                    .from('cohort_memberships')
                    .select('cohort_id')
                    .eq('user_id', effectiveUserId),
            ])

            if (ignore) return

            const profileRow = profileRes.data as { company_id: string | null; ai_readiness_score: number } | null
            const membershipIds = ((membershipRes.data as { cohort_id: string }[] | null) ?? []).map((m) => m.cohort_id)

            const cohortIdSet = new Set<string>(membershipIds)

            // Also check if the user's company has a cohort
            if (profileRow?.company_id) {
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('cohort_id')
                    .eq('id', profileRow.company_id)
                    .single()

                if (ignore) return

                const compRow = companyData as { cohort_id: string | null } | null
                if (compRow?.cohort_id) cohortIdSet.add(compRow.cohort_id)
            }

            const cohortIds = Array.from(cohortIdSet)

            if (cohortIds.length === 0) {
                setSessions([])
                setAssignments([])
                setSubmissions([])
                setRecentMessages([])
                setCohorts([])
                setLoading(false)
                return
            }

            // ── 2. Fetch cohorts ───────────────────────────────────────────────
            const { data: cohortData } = await supabase
                .from('cohorts')
                .select('*')
                .in('id', cohortIds)

            if (ignore) return
            setCohorts((cohortData as Cohort[]) ?? [])

            // ── 3. Fetch sessions ─────────────────────────────────────────────
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('sessions')
                .select('id, title, scheduled_date, status, cohort_id')
                .in('cohort_id', cohortIds)
                .order('scheduled_date', { ascending: true })

            if (ignore) return

            if (sessionsError) {
                setError(sessionsError.message)
                setLoading(false)
                return
            }

            const sessionRows = (sessionsData as Session[]) ?? []
            const sessionIds = sessionRows.map((s) => s.id)
            setSessions(sessionRows)

            // ── 4. Fetch assignments ──────────────────────────────────────────
            let assignmentRows: Assignment[] = []
            if (sessionIds.length > 0) {
                const { data: assignmentsData } = await supabase
                    .from('assignments')
                    .select('id, title, due_date, session_id, submission_format')
                    .in('session_id', sessionIds)
                    .order('due_date', { ascending: true })

                if (ignore) return
                assignmentRows = (assignmentsData as Assignment[]) ?? []
                setAssignments(assignmentRows)

                // ── 5. Fetch submissions ──────────────────────────────────────
                if (assignmentRows.length > 0) {
                    const { data: submissionsData } = await supabase
                        .from('submissions')
                        .select('id, assignment_id, submitted_at')
                        .eq('user_id', effectiveUserId)
                        .in('assignment_id', assignmentRows.map((a) => a.id))

                    if (ignore) return
                    setSubmissions((submissionsData as Submission[]) ?? [])
                }
            }

            // ── 6. Fetch recent chat messages ─────────────────────────────────
            const companyId = profileRow?.company_id
            if (cohortIds.length > 0 || companyId) {
                const chatQuery = supabase
                    .from('chat_messages')
                    .select('id, message, created_at, sender:users(full_name), cohort_id, company_id')
                    .order('created_at', { ascending: false })
                    .limit(4)

                if (cohortIds.length > 0 && companyId) {
                    chatQuery.or(`cohort_id.in.(${cohortIds.join(',')}),company_id.eq.${companyId}`)
                } else if (cohortIds.length > 0) {
                    chatQuery.in('cohort_id', cohortIds)
                } else if (companyId) {
                    chatQuery.eq('company_id', companyId)
                }

                const { data: chatData } = await chatQuery
                if (ignore) return
                setRecentMessages((chatData as ChatMessage[]) ?? [])
            }

            if (!ignore) setLoading(false)
        }

        fetchDashboard()
        return () => { ignore = true }
    }, [effectiveUserId])

    // ── Derived state ──────────────────────────────────────────────────────────
    const sessionTimeline = useMemo(() => {
        const now = Date.now()
        let currentMarked = false

        return sessions
            .slice()
            .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
            .slice(0, 5)
            .map((session) => {
                const scheduledAt = new Date(session.scheduled_date).getTime()
                const completed = session.status === 'completed' || scheduledAt < now
                const current = !completed && !currentMarked
                if (current) currentMarked = true
                return {
                    id: session.id,
                    title: session.title,
                    date: formatDateLabel(session.scheduled_date) || 'TBD',
                    completed,
                    current,
                }
            })
    }, [sessions])

    const totalSessions = sessions.length
    const completedSessions = useMemo(() => {
        const now = Date.now()
        return sessions.filter((s) => s.status === 'completed' || new Date(s.scheduled_date).getTime() < now).length
    }, [sessions])

    const assignmentSummary = useMemo(() => {
        const submissionIds = new Set(submissions.map((s) => s.assignment_id))
        const now = Date.now()

        const items = assignments
            .map((a) => {
                const submitted = submissionIds.has(a.id)
                const dueDate = a.due_date ? new Date(a.due_date).getTime() : null
                const isOverdue = dueDate ? dueDate < now : false
                const status: 'pending' | 'upcoming' | 'submitted' = submitted ? 'submitted' : isOverdue ? 'pending' : 'upcoming'
                return { id: a.id, title: a.title, dueDate: a.due_date ? formatDateLabel(a.due_date) : 'TBD', status, dueSort: dueDate ?? Number.MAX_SAFE_INTEGER }
            })
            .sort((a, b) => {
                const order = { pending: 0, upcoming: 1, submitted: 2 }
                if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
                return a.dueSort - b.dueSort
            })
            .slice(0, 3)

        return { total: assignments.length, completed: submissionIds.size, items }
    }, [assignments, submissions])

    const chatPreview = useMemo(() => recentMessages.map((m) => ({
        id: m.id,
        sender: m.sender?.full_name ?? 'Member',
        message: m.message,
        time: formatRelativeTime(m.created_at),
    })), [recentMessages])

    const primaryCohort = cohorts[0]
    const isSprintWorkshop = primaryCohort?.offering_type === 'sprint_workshop'

    // AI readiness score — comes from the previewed user's profile
    const aiScore = user?.ai_readiness_score ?? 0

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
                            {isSprintWorkshop ? 'Sprint Workshop' : 'Master Class Journey'}
                        </span>
                    </div>
                    <h1 className="hero-text text-3xl md:text-4xl mb-4">
                        Hey <span className="text-gradient">{firstName}</span>, here's your progress
                    </h1>
                    <p className="text-gray-400 max-w-lg">
                        {isSprintWorkshop
                            ? "Welcome to your sprint! Follow the sessions below and engage with your program to maximize your learning."
                            : "You're making great progress! Keep up the momentum and complete your assignments to earn your certificate."}
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
                            <p className="text-2xl font-bold">{completedSessions}/{totalSessions}</p>
                            <p className="text-xs text-gray-500">Sessions Attended</p>
                        </div>
                    </div>
                    <ProgressBar current={completedSessions} total={totalSessions || 1} />
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{assignmentSummary.completed}/{assignmentSummary.total}</p>
                            <p className="text-xs text-gray-500">Assignments Done</p>
                        </div>
                    </div>
                    <ProgressBar current={assignmentSummary.completed} total={assignmentSummary.total || 1} />
                </div>
                <div className="bg-bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-lime" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{aiScore}%</p>
                            <p className="text-xs text-gray-500">AI Readiness Score</p>
                        </div>
                    </div>
                    <ProgressBar current={aiScore} total={100} />
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
                    {loading ? (
                        <div className="p-6 text-center text-gray-500">Loading sessions...</div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-400">{error}</div>
                    ) : sessionTimeline.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No sessions yet.</div>
                    ) : (
                        <div className="space-y-0">
                            {sessionTimeline.map((session, idx) => {
                                const isLast = idx === sessionTimeline.length - 1
                                return (
                                    <div key={session.id} className="relative flex gap-4">
                                        {/* Left: icon */}
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 relative z-10 ${
                                            session.completed ? 'bg-lime/10' : session.current ? 'gradient-lime' : 'bg-white/5'
                                        }`}>
                                            {session.completed ? (
                                                <CheckCircle2 className="h-5 w-5 text-lime" />
                                            ) : session.current ? (
                                                <Play className="h-5 w-5 text-black" />
                                            ) : (
                                                <Clock className="h-5 w-5 text-gray-500" />
                                            )}
                                        </div>
                                        {/* Connector line */}
                                        {!isLast && (
                                            <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
                                        )}

                                        {/* Right: content */}
                                        <div className={`flex-1 flex items-center justify-between gap-4 pb-4 ${
                                            session.current ? 'rounded-xl bg-lime/5 border border-lime/20 px-3 mb-1' : ''
                                        }`}>
                                            <div>
                                                <p className={`font-medium ${session.completed ? 'text-gray-400' : ''}`}>
                                                    {session.title}
                                                </p>
                                                <p className="text-xs text-gray-500">{session.date}</p>
                                            </div>
                                            {session.current && (
                                                <button className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0">
                                                    Watch Now
                                                </button>
                                            )}
                                            {session.completed && (
                                                <button className="px-4 py-2 text-sm border border-border rounded-lg hover:border-lime/50 transition shrink-0">
                                                    Rewatch
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
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
                            <Link to="/my-program" className="text-sm text-lime hover:underline">View all</Link>
                        </div>
                        {loading ? (
                            <div className="p-4 text-sm text-gray-500">Loading assignments...</div>
                        ) : assignmentSummary.items.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No assignments yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {assignmentSummary.items.map((assignment) => (
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
                                                <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded-lg">Pending</span>
                                            )}
                                            {assignment.status === 'upcoming' && (
                                                <span className="px-2 py-1 text-xs bg-gray-500/10 text-gray-400 rounded-lg">Upcoming</span>
                                            )}
                                            {assignment.status === 'submitted' && (
                                                <span className="px-2 py-1 text-xs bg-lime/10 text-lime rounded-lg">Submitted</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                        {loading ? (
                            <div className="p-4 text-sm text-gray-500">Loading messages...</div>
                        ) : chatPreview.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No recent messages.</div>
                        ) : (
                            <div className="space-y-3">
                                {chatPreview.map((msg) => (
                                    <div key={msg.id} className="p-3 rounded-xl bg-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium">{msg.sender}</p>
                                            <p className="text-xs text-gray-500">{msg.time}</p>
                                        </div>
                                        <p className="text-xs text-gray-400">{msg.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link
                            to="/chat"
                            className="w-full mt-4 py-2 border border-border rounded-xl text-sm hover:border-lime/50 transition flex items-center justify-center gap-2"
                        >
                            Open Chat <ArrowRight className="h-3 w-3" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
