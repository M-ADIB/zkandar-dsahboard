import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    FileText,
    MessageSquare,
    CheckCircle2,
    Clock,
    ArrowRight,
    Sparkles,
    Play,
    X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Portal } from '@/components/shared/Portal'
import { supabase } from '@/lib/supabase'
import { formatDateLabel, formatRelativeTime } from '@/lib/time'
import { computeInitialScore, computeAssignmentBoost, computeFinalScore } from '@/lib/scoring'
import type { Assignment, ChatMessage, Cohort, Session, Submission, SurveyAnswers, UserType } from '@/types/database'

function extractVimeoId(urlOrId: string): string {
    const match = urlOrId.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : urlOrId.replace(/\D/g, '')
}

/** Mini Vimeo frame shown in the hero banner — fetches URL from platform_settings */
function WelcomeVideoMiniFrame({ userType }: { userType: UserType | null }) {
    const [vimeoId, setVimeoId] = useState<string | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const key = userType === 'management' ? 'welcome_video_management' : 'welcome_video_team'

    useEffect(() => {
        supabase
            .from('platform_settings')
            .select('value')
            .eq('key', key)
            .single<{ value: string }>()
            .then(({ data, error }) => {
                if (!error && data?.value) {
                    setVimeoId(extractVimeoId(data.value))
                }
            })
    }, [key])

    if (!vimeoId) return null

    return (
        <>
            <div className="hidden lg:block shrink-0 w-56 xl:w-64">
                <div
                    className="relative rounded-xl overflow-hidden border border-white/10 shadow-xl shadow-black/50"
                    style={{ aspectRatio: '16/9' }}
                >
                    <iframe
                        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&title=0&byline=0&portrait=0`}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        allow="autoplay; fullscreen"
                        title="Platform walkthrough preview"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center p-2 group">
                        <div 
                            onClick={() => setIsFullscreen(true)}
                            className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/60 hover:scale-110 hover:border-lime/50 transition-all cursor-pointer z-20 group-hover:shadow-[0_0_30px_rgba(208,255,113,0.2)]"
                        >
                            <Play className="h-5 w-5 text-white ml-1 transition-colors group-hover:text-lime" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                        <p className="text-[10px] text-white/90 font-medium tracking-wide shadow-black drop-shadow-md">PLATFORM WALKTHROUGH</p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isFullscreen && (
                    <Portal>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-xl"
                            onClick={() => setIsFullscreen(false)}
                        >
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black border border-white/10 bg-black/50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <iframe
                                    src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=0&title=0&byline=0&portrait=0`}
                                    className="absolute inset-0 w-full h-full"
                                    allow="autoplay; fullscreen"
                                />
                                <button
                                    onClick={() => setIsFullscreen(false)}
                                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/20 text-white transition-colors z-50 group hover:border-red-500/50"
                                >
                                    <X className="h-5 w-5 group-hover:text-red-400 transition-colors" />
                                </button>
                            </motion.div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    )
}


export function ParticipantDashboard() {
    const { user } = useAuth()
    const { effectiveUserId } = useViewMode()

    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([])
    const [aiScore, setAiScore] = useState<number | null>(null)
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
                    .select('company_id, ai_readiness_score, onboarding_data, user_type')
                    .eq('id', effectiveUserId)
                    .single(),
                supabase
                    .from('cohort_memberships')
                    .select('cohort_id')
                    .eq('user_id', effectiveUserId),
            ])

            if (ignore) return

            const profileRow = profileRes.data as { company_id: string | null; ai_readiness_score: number; onboarding_data: Record<string, unknown> | null; user_type: string | null } | null
            // Note: we do NOT set aiScore from the DB value here to avoid a visible flash.
            // The score is computed live below once all data is fetched.
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

            // ── 2. Fetch cohorts, sessions, and chats in parallel ──────────────
            const companyId = profileRow?.company_id

            let chatQuery = supabase
                .from('chat_messages')
                .select('id, message, created_at, sender:users(full_name), cohort_id, company_id')
                .order('created_at', { ascending: false })
                .limit(4)

            if (cohortIds.length > 0 && companyId) {
                chatQuery = chatQuery.or(`cohort_id.in.(${cohortIds.join(',')}),company_id.eq.${companyId}`)
            } else if (cohortIds.length > 0) {
                chatQuery = chatQuery.in('cohort_id', cohortIds)
            } else if (companyId) {
                chatQuery = chatQuery.eq('company_id', companyId)
            }

            const [cohortsRes, sessionsRes, chatRes] = await Promise.all([
                supabase.from('cohorts').select('*').in('id', cohortIds),
                supabase.from('sessions').select('id, title, scheduled_date, status, cohort_id').in('cohort_id', cohortIds).order('scheduled_date', { ascending: true }),
                chatQuery
            ])

            if (ignore) return

            if (sessionsRes.error) {
                setError(sessionsRes.error.message)
                setLoading(false)
                return
            }

            setCohorts((cohortsRes.data as Cohort[]) ?? [])
            const sessionRows = (sessionsRes.data as Session[]) ?? []
            setSessions(sessionRows)
            setRecentMessages((chatRes.data as ChatMessage[]) ?? [])

            // ── 3. Fetch assignments (needs sessionIds) ───────────────────────
            const sessionIds = sessionRows.map((s) => s.id)
            if (sessionIds.length > 0) {
                const { data: assignmentsData } = await supabase
                    .from('assignments')
                    .select('id, title, due_date, session_id, submission_format')
                    .in('session_id', sessionIds)
                    .order('due_date', { ascending: true })

                if (ignore) return
                const assignmentRows = (assignmentsData as Assignment[]) ?? []
                setAssignments(assignmentRows)

                // ── 4. Fetch submissions (needs assignmentIds) ────────────────
                if (assignmentRows.length > 0) {
                    const { data: submissionsData } = await supabase
                        .from('submissions')
                        .select('id, assignment_id, submitted_at, score')
                        .eq('user_id', effectiveUserId)
                        .in('assignment_id', assignmentRows.map((a) => a.id))

                    if (ignore) return
                    const subs = (submissionsData as (Submission & { score?: number })[]) ?? []
                    setSubmissions(subs)
                    
                    // Live compute the exact AI readiness score using the same engine as My Performance
                    if (profileRow?.onboarding_data?.survey_answers) {
                        const answers = profileRow.onboarding_data.survey_answers as SurveyAnswers
                        const initialScore = computeInitialScore(answers, profileRow.user_type)
                        const gradedScores = subs.map(s => s.score).filter((s): s is number => typeof s === 'number')
                        const boost = computeAssignmentBoost(gradedScores)
                        const finalLiveScore = computeFinalScore(initialScore, boost)
                        setAiScore(finalLiveScore)
                    }
                } else if (profileRow?.onboarding_data?.survey_answers) {
                    const answers = profileRow.onboarding_data.survey_answers as SurveyAnswers
                    const initialScore = computeInitialScore(answers, profileRow.user_type)
                    setAiScore(computeFinalScore(initialScore, 0))
                }
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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card to-bg-elevated border border-border p-8"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex items-center gap-8">
                    {/* Left: text */}
                    <div className="flex-1 min-w-0">
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

                    {/* Right: Welcome video mini-frame */}
                    <WelcomeVideoMiniFrame userType={user?.user_type ?? null} />
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
                            <p className="text-2xl font-bold">
                                {aiScore === null ? <span className="inline-block w-12 h-7 bg-white/10 rounded animate-pulse" /> : `${aiScore}%`}
                            </p>
                            <p className="text-xs text-gray-500">AI Readiness Score</p>
                        </div>
                    </div>
                    <ProgressBar current={aiScore ?? 0} total={100} />
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
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="h-10 w-10 rounded-lg bg-white/5 shrink-0" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-white/5 rounded w-1/3" />
                                        <div className="h-3 bg-white/5 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center text-red-400">{error}</div>
                    ) : sessionTimeline.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No sessions yet.</div>
                    ) : (
                        <div className="space-y-0">
                            {sessionTimeline.map((session, idx) => {
                                const isLast = idx === sessionTimeline.length - 1
                                return (
                                    <div key={session.id} className="relative group">
                                        {/* Connector line - Absolute for perfect alignment */}
                                        {!isLast && (
                                            <div className="absolute left-[35px] top-[56px] bottom-[-16px] w-px bg-border z-0" />
                                        )}
                                        
                                        <div className={`relative flex items-center gap-4 p-4 rounded-xl transition-colors ${
                                            session.current ? 'bg-lime/5 border border-lime/20' : 'hover:bg-white/5 border border-transparent'
                                        }`}>
                                            {/* Left Side: Icon */}
                                            <div className="flex flex-col items-center shrink-0 w-10">
                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center relative z-10 ${
                                                    session.completed ? 'bg-lime/10' : session.current ? 'gradient-lime shadow-lg shadow-lime/20' : 'bg-white/5'
                                                }`}>
                                                    {session.completed ? (
                                                        <CheckCircle2 className="h-5 w-5 text-lime" />
                                                    ) : session.current ? (
                                                        <Play className="h-5 w-5 text-black ml-0.5" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-gray-500" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Side: content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className={`font-medium truncate ${session.completed ? 'text-gray-400' : 'text-white'} ${session.current ? 'text-lime' : ''}`}>
                                                            {session.title}
                                                        </p>
                                                        <p className={`text-xs mt-0.5 truncate ${session.current ? 'text-lime/70' : 'text-gray-500'}`}>{session.date}</p>
                                                    </div>
                                                    {session.current && (
                                                        <button className="px-4 py-2 text-sm gradient-lime text-black font-medium rounded-lg shrink-0 hover:scale-105 transition-transform">
                                                            Watch Now
                                                        </button>
                                                    )}
                                                    {session.completed && (
                                                        <button className="px-4 py-2 text-sm border border-border rounded-lg hover:border-lime/50 text-gray-300 hover:text-white transition-colors shrink-0">
                                                            Rewatch
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Spacing between rows */}
                                        {!isLast && <div className="h-2" />}
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
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 animate-pulse flex justify-between h-20" />
                                ))}
                            </div>
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
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-3 rounded-xl bg-white/5 animate-pulse h-16" />
                                ))}
                            </div>
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
