import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    GraduationCap, Calendar, ClipboardList, Film, FileText,
    CheckCircle2, Clock, Upload, ChevronDown, ChevronUp, Link as LinkIcon,
} from 'lucide-react'
import { SubmitAssignmentModal } from '@/components/assignments/SubmitAssignmentModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import { formatDateLabel, formatTimeLabel } from '@/lib/time'
import type { Assignment, Cohort, Session, SubmissionFormat } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Submission {
    id: string
    assignment_id: string
    user_id: string
    file_url: string | null
    notes: string | null
    score: number | null
    feedback: string | null
    status: string
    submitted_at: string | null
}

// ─── My Program Page ─────────────────────────────────────────────────────────
export function MyProgramPage() {
    const { user } = useAuth()
    const { effectiveUserId } = useViewMode()
    const [cohort, setCohort] = useState<Cohort | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [attendance, setAttendance] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedSession, setExpandedSession] = useState<string | null>(null)
    const [submitTarget, setSubmitTarget] = useState<{
        id: string; title: string; session: string; submissionFormat: SubmissionFormat
    } | null>(null)

    useEffect(() => {
        if (!user || !effectiveUserId) return
        const fetchAll = async () => {
            setLoading(true)
            setError(null)

            // Get user's cohort — try company path first, then cohort_memberships
            const { data: userData } = await supabase
                .from('users').select('company_id').eq('id', effectiveUserId).single()
            const userRow = userData as { company_id: string | null } | null

            let resolvedCohortId: string | null = null

            // Path 1: company → cohort
            if (userRow?.company_id) {
                const { data: companyData } = await supabase
                    .from('companies').select('cohort_id').eq('id', userRow.company_id).single()
                const companyRow = companyData as { cohort_id: string | null } | null
                resolvedCohortId = companyRow?.cohort_id ?? null
            }

            // Path 2: cohort_memberships (sprint workshop / direct membership)
            if (!resolvedCohortId) {
                const { data: memberships } = await supabase
                    .from('cohort_memberships').select('cohort_id')
                    .eq('user_id', effectiveUserId)
                const memberCohortIds = ((memberships as { cohort_id: string }[] | null) ?? []).map(m => m.cohort_id)
                if (memberCohortIds.length > 0) {
                    resolvedCohortId = memberCohortIds[0]
                }
            }

            if (!resolvedCohortId) { setError('No program assigned'); setLoading(false); return }

            // Fetch cohort
            const { data: cohortData } = await supabase
                .from('cohorts').select('*').eq('id', resolvedCohortId).single()
            if (!cohortData) { setError('Program not found'); setLoading(false); return }
            setCohort(cohortData as Cohort)

            // Fetch sessions
            const { data: sessionsData } = await supabase
                .from('sessions').select('*')
                .eq('cohort_id', resolvedCohortId)
                .order('session_number', { ascending: true })
            const sess = (sessionsData as Session[]) ?? []
            setSessions(sess)

            // Fetch assignments for these sessions
            if (sess.length > 0) {
                const { data: assignData } = await supabase
                    .from('assignments').select('*')
                    .in('session_id', sess.map((s) => s.id))
                    .order('due_date', { ascending: true })
                const asgn = (assignData as Assignment[]) ?? []
                setAssignments(asgn)

                // Fetch my submissions
                if (asgn.length > 0) {
                    const { data: subData } = await supabase
                        .from('submissions').select('*')
                        .eq('user_id', effectiveUserId)
                        .in('assignment_id', asgn.map((a) => a.id))
                    setSubmissions((subData as Submission[]) ?? [])
                }

                // Fetch my attendance
                const { data: attData } = await supabase
                    .from('session_attendance').select('session_id')
                    .eq('user_id', effectiveUserId)
                    .in('session_id', sess.map((s) => s.id))
                const attSet = new Set<string>()
                    ; (attData as { session_id: string }[] | null)?.forEach((r) => attSet.add(r.session_id))
                setAttendance(attSet)
            }

            setLoading(false)
        }
        fetchAll()
    }, [user, effectiveUserId])

    // ─── Derived ────────────────────────────────────────────────────────────────
    const completedSessions = useMemo(() => sessions.filter((s) => s.status === 'completed').length, [sessions])
    const attendedSessions = useMemo(() => sessions.filter((s) => attendance.has(s.id)).length, [sessions, attendance])
    const submissionMap = useMemo(() => new Map(submissions.map((s) => [s.assignment_id, s])), [submissions])
    const submittedCount = submissions.length
    const totalAssignments = assignments.length
    const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions])

    // Progress percentage
    const progressPct = useMemo(() => {
        const sessionWeight = 0.5
        const assignmentWeight = 0.5
        const sessionScore = sessions.length > 0 ? attendedSessions / sessions.length : 0
        const assignmentScore = totalAssignments > 0 ? submittedCount / totalAssignments : 0
        return Math.round((sessionScore * sessionWeight + assignmentScore * assignmentWeight) * 100)
    }, [sessions, attendedSessions, totalAssignments, submittedCount])

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
        </div>
    )

    if (error) return (
        <div className="max-w-2xl mx-auto mt-12 text-center space-y-4">
            <GraduationCap className="h-12 w-12 text-gray-600 mx-auto" />
            <p className="text-gray-400">{error}</p>
        </div>
    )

    if (!cohort) return null

    const formatBadge: Record<SubmissionFormat, string> = {
        file: 'File Upload',
        link: 'Link',
        text: 'Text',
        any: 'Open Format',
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* ── Progress Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-2xl p-6"
            >
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white">{cohort.name}</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {cohort.offering_type === 'master_class' ? 'Master Class' : 'Sprint Workshop'} ·
                            {' '}{formatDateLabel(cohort.start_date) || 'TBD'} → {formatDateLabel(cohort.end_date) || 'TBD'}
                        </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 text-xs rounded-xl border ${cohort.status === 'active' ? 'bg-lime/10 text-lime border-lime/30' : cohort.status === 'completed' ? 'bg-gray-500/10 text-gray-300 border-gray-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30'}`}>
                        {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-400">Overall Progress</span>
                        <span className="text-lime font-semibold">{progressPct}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full gradient-lime"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-bg-elevated rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-white">{attendedSessions}/{sessions.length}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Sessions</p>
                    </div>
                    <div className="bg-bg-elevated rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-white">{submittedCount}/{totalAssignments}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Assignments</p>
                    </div>
                    <div className="bg-bg-elevated rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-lime">{completedSessions}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Sessions Done</p>
                    </div>
                    <div className="bg-bg-elevated rounded-xl p-3 text-center">
                        <p className={`text-lg font-bold ${progressPct >= 80 ? 'text-lime' : 'text-amber-400'}`}>
                            {progressPct >= 80 ? '🎓' : '⏳'}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                            {progressPct >= 80 ? 'Certificate Ready' : 'In Progress'}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ── Session Timeline ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-card border border-border rounded-2xl p-6"
            >
                <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-lime" />
                    Session Timeline
                </h2>

                <div className="space-y-0">
                    {sessions.map((session, idx) => {
                        const isCompleted = session.status === 'completed'
                        const isAttended = attendance.has(session.id)
                        const isExpanded = expandedSession === session.id
                        const sessionAssignments = assignments.filter((a) => a.session_id === session.id)
                        const isLast = idx === sessions.length - 1

                        return (
                            <div key={session.id} className="relative flex gap-4">
                                {/* Connector line - Absolute for perfect alignment */}
                                {!isLast && (
                                    <div className="absolute left-[18px] top-9 bottom-[-24px] w-px bg-border -ml-px z-0" />
                                )}
                                {/* Left Side: Icon */}
                                <div className="flex flex-col items-center shrink-0">
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold relative z-10 shadow-sm ${
                                        isCompleted
                                            ? isAttended ? 'bg-lime/20 text-lime border border-lime/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : 'bg-white/5 text-gray-500 border border-white/5'
                                    }`}>
                                        {isCompleted ? (isAttended ? <CheckCircle2 className="h-4 w-4" /> : '✗') : session.session_number}
                                    </div>
                                </div>

                                {/* Right Side: content */}
                                <div className="flex-1 min-w-0 pb-6">
                                    <button
                                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                                        className={`w-full flex items-start justify-between gap-2 p-3 -ml-3 rounded-xl transition text-left ${
                                            isExpanded ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white">{session.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatDateLabel(session.scheduled_date) || 'TBD'}
                                                {formatTimeLabel(session.scheduled_date) ? ` · ${formatTimeLabel(session.scheduled_date)}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {session.recording_url && (
                                                <span className="text-[10px] text-lime bg-lime/5 px-2 py-0.5 rounded border border-lime/20">Recording</span>
                                            )}
                                            {sessionAssignments.length > 0 && (
                                                <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-border">{sessionAssignments.length} task{sessionAssignments.length > 1 ? 's' : ''}</span>
                                            )}
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                                        </div>
                                    </button>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2 pt-1 pb-2"
                                        >
                                            {session.recording_url && (
                                                <a
                                                    href={session.recording_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs text-lime hover:underline"
                                                >
                                                    <Film className="h-3.5 w-3.5" />
                                                    Watch Recording
                                                </a>
                                            )}

                                            {Array.isArray(session.materials) && session.materials.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Materials</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {session.materials.map((mat, i) => (
                                                            <a key={i} href={mat.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-gray-300 bg-white/5 rounded-md border border-border hover:border-lime/30 transition">
                                                                {mat.type === 'link' ? <LinkIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                                                {mat.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {sessionAssignments.length > 0 && (
                                                <div className="space-y-1.5 mt-2">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Assignments</p>
                                                    {sessionAssignments.map((asgn) => {
                                                        const sub = submissionMap.get(asgn.id)
                                                        return (
                                                            <div key={asgn.id} className="flex items-center justify-between bg-bg-elevated rounded-lg p-2.5 border border-border">
                                                                <div className="flex items-center gap-2">
                                                                    <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
                                                                    <div>
                                                                        <p className="text-xs font-medium text-white">{asgn.title}</p>
                                                                        {asgn.due_date && <p className="text-[10px] text-gray-500">Due {formatDateLabel(asgn.due_date)}</p>}
                                                                    </div>
                                                                </div>
                                                                {sub ? (
                                                                    <span className={`px-2 py-0.5 text-[10px] rounded-md border ${sub.score != null ? 'bg-lime/10 text-lime border-lime/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>
                                                                        {sub.score != null ? `✓ ${sub.score}pts` : 'Submitted'}
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setSubmitTarget({ id: asgn.id, title: asgn.title, session: session.title, submissionFormat: asgn.submission_format }) }}
                                                                        className="px-2 py-0.5 text-[10px] text-lime border border-lime/30 rounded-md hover:bg-lime/10 transition"
                                                                    >
                                                                        Submit
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            {/* ── Assignments Overview ── */}
            {assignments.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-bg-card border border-border rounded-2xl p-6"
                >
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                        <ClipboardList className="h-4 w-4 text-lime" />
                        All Assignments
                    </h2>

                    <div className="space-y-2">
                        {assignments.map((asgn) => {
                            const sub = submissionMap.get(asgn.id)
                            const session = sessionMap.get(asgn.session_id)
                            const isDue = asgn.due_date && new Date(asgn.due_date) < new Date() && !sub

                            return (
                                <div key={asgn.id} className={`bg-bg-elevated border rounded-xl p-4 transition ${isDue ? 'border-red-500/30' : 'border-border'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium text-white">{asgn.title}</p>
                                                <span className="px-2 py-0.5 text-[10px] text-gray-400 border border-border rounded-md">
                                                    {formatBadge[asgn.submission_format]}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                {session && <span>Session {session.session_number}</span>}
                                                {asgn.due_date && (
                                                    <span className={isDue ? 'text-red-400 font-medium' : ''}>
                                                        {isDue ? '⚠ Overdue' : `Due ${formatDateLabel(asgn.due_date)}`}
                                                    </span>
                                                )}
                                            </div>
                                            {asgn.description && (
                                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{asgn.description}</p>
                                            )}
                                        </div>

                                        <div className="shrink-0">
                                            {sub ? (
                                                <div className="text-right">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg ${sub.score != null ? 'bg-lime/10 text-lime' : 'bg-amber-500/10 text-amber-300'}`}>
                                                        {sub.score != null ? <><CheckCircle2 className="h-3.5 w-3.5" /> {sub.score}pts</> : <><Clock className="h-3.5 w-3.5" /> Submitted</>}
                                                    </span>
                                                    {sub.feedback && (
                                                        <p className="text-[10px] text-gray-500 mt-1.5 max-w-[200px] truncate" title={sub.feedback}>
                                                            💬 {sub.feedback}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSubmitTarget({ id: asgn.id, title: asgn.title, session: sessionMap.get(asgn.session_id)?.title ?? '', submissionFormat: asgn.submission_format })}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-lime border border-lime/30 rounded-lg hover:bg-lime/10 transition"
                                                >
                                                    <Upload className="h-3.5 w-3.5" />
                                                    Submit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── Submit Assignment Modal ── */}
            <SubmitAssignmentModal
                isOpen={submitTarget !== null}
                onClose={() => setSubmitTarget(null)}
                assignment={submitTarget}
                userId={effectiveUserId ?? ''}
                onSuccess={async () => {
                    setSubmitTarget(null)
                    if (assignments.length > 0) {
                        const { data: subData } = await supabase
                            .from('submissions').select('*')
                            .eq('user_id', effectiveUserId)
                            .in('assignment_id', assignments.map((a) => a.id))
                        setSubmissions((subData as Submission[]) ?? [])
                    }
                }}
            />

            {/* ── Miro Board ── */}
            {cohort.miro_board_url && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-bg-card border border-border rounded-2xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <FileText className="h-4 w-4 text-lime" />
                            Miro Board
                        </h2>
                        <a href={cohort.miro_board_url} target="_blank" rel="noopener noreferrer" className="text-xs text-lime hover:underline">
                            Open in new tab →
                        </a>
                    </div>
                    <div className="aspect-video">
                        <iframe
                            src={cohort.miro_board_url.replace('board/', 'board/embed/')}
                            className="w-full h-full border-0"
                            allow="fullscreen"
                            title="Miro Board"
                        />
                    </div>
                </motion.div>
            )}
        </div>
    )
}
