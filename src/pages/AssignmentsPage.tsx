import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle2, Upload, Link as LinkIcon, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/hooks/useCompany'
import { formatDateLabel } from '@/lib/time'
import type { Assignment, Session, Submission, SubmissionFormat } from '@/types/database'

type AssignmentCard = {
    id: string
    title: string
    description: string
    session: string
    dueDate: string
    submissionFormat: SubmissionFormat
    status: 'pending' | 'submitted' | 'upcoming'
    feedback?: string
}

export function AssignmentsPage() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all')
    const { user, loading: authLoading } = useAuth()
    const { company, loading: companyLoading } = useCompany()
    const [assignments, setAssignments] = useState<AssignmentCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading || companyLoading) return

        const cohortId = company?.cohort_id
        if (!user || !cohortId) {
            setAssignments([])
            setLoading(false)
            return
        }

        let ignore = false

        const fetchAssignments = async () => {
            setLoading(true)
            setError(null)

            const { data: sessionsData, error: sessionsError } = await supabase
                .from('sessions')
                .select('id, title, session_number, scheduled_date')
                .eq('cohort_id', cohortId)

            if (ignore) return

            if (sessionsError) {
                setError(sessionsError.message)
                setAssignments([])
                setLoading(false)
                return
            }

            const sessions = (sessionsData as Session[]) ?? []
            const sessionMap = new Map(sessions.map((session) => [session.id, session]))
            const sessionIds = sessions.map((session) => session.id)

            if (sessionIds.length === 0) {
                setAssignments([])
                setLoading(false)
                return
            }

            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('assignments')
                .select('*')
                .in('session_id', sessionIds)
                .order('due_date', { ascending: true })

            if (ignore) return

            if (assignmentsError) {
                setError(assignmentsError.message)
                setAssignments([])
                setLoading(false)
                return
            }

            const assignmentRows = (assignmentsData as Assignment[]) ?? []
            const assignmentIds = assignmentRows.map((assignment) => assignment.id)

            if (assignmentIds.length === 0) {
                setAssignments([])
                setLoading(false)
                return
            }

            const { data: submissionsData, error: submissionsError } = await supabase
                .from('submissions')
                .select('*')
                .eq('user_id', user.id)
                .in('assignment_id', assignmentIds)

            if (ignore) return

            if (submissionsError) {
                setError(submissionsError.message)
                setAssignments([])
                setLoading(false)
                return
            }

            const submissions = (submissionsData as Submission[]) ?? []
            const submissionsByAssignment = new Map(submissions.map((submission) => [submission.assignment_id, submission]))

            const cards = assignmentRows.map((assignment) => {
                const session = sessionMap.get(assignment.session_id)
                const submission = submissionsByAssignment.get(assignment.id)
                const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
                const isOverdue = dueDate ? dueDate.getTime() < Date.now() : false

                const status: AssignmentCard['status'] = submission
                    ? 'submitted'
                    : isOverdue
                        ? 'pending'
                        : 'upcoming'

                return {
                    id: assignment.id,
                    title: assignment.title,
                    description: assignment.description ?? 'No description provided.',
                    session: session ? `Session ${session.session_number}: ${session.title}` : 'Session',
                    dueDate: assignment.due_date ? formatDateLabel(assignment.due_date) : 'TBD',
                    submissionFormat: assignment.submission_format,
                    status,
                    feedback: submission?.admin_feedback ?? undefined,
                }
            })

            setAssignments(cards)
            setLoading(false)
        }

        fetchAssignments()

        return () => {
            ignore = true
        }
    }, [authLoading, companyLoading, user?.id, company?.cohort_id])

    const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
        if (filter === 'all') return true
        if (filter === 'pending') return assignment.status === 'pending' || assignment.status === 'upcoming'
        return assignment.status === 'submitted'
    }), [assignments, filter])

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Assignments</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Complete assignments to track your progress
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
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'pending'
                                ? 'bg-lime/10 text-lime border border-lime/20'
                                : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('submitted')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'submitted'
                                ? 'bg-lime/10 text-lime border border-lime/20'
                                : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        Submitted
                    </button>
                </div>
            </div>

            {/* Assignments List */}
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading assignments...</div>
            ) : error ? (
                <div className="p-8 text-center text-red-400">Failed to load assignments</div>
            ) : filteredAssignments.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No assignments available yet.</div>
            ) : (
                <div className="space-y-4">
                    {filteredAssignments.map((assignment, index) => (
                        <motion.div
                            key={assignment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-bg-card border rounded-2xl p-6 transition-colors ${assignment.status === 'pending'
                                    ? 'border-yellow-500/30 hover:border-yellow-500/50'
                                    : assignment.status === 'submitted'
                                        ? 'border-lime/20 hover:border-lime/40'
                                        : 'border-border hover:border-lime/20'
                                }`}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                {/* Icon */}
                                <div
                                    className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${assignment.status === 'submitted' ? 'bg-lime/10' : 'bg-white/5'
                                        }`}
                                >
                                    {assignment.status === 'submitted' ? (
                                        <CheckCircle2 className="h-6 w-6 text-lime" />
                                    ) : assignment.submissionFormat === 'file' ? (
                                        <Upload className="h-6 w-6 text-gray-400" />
                                    ) : assignment.submissionFormat === 'link' ? (
                                        <LinkIcon className="h-6 w-6 text-gray-400" />
                                    ) : (
                                        <FileText className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                            <p className="text-xs text-lime mt-1">{assignment.session}</p>
                                        </div>
                                        {/* Status Badge */}
                                        {assignment.status === 'pending' && (
                                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg shrink-0">
                                                Due Soon
                                            </span>
                                        )}
                                        {assignment.status === 'submitted' && (
                                            <span className="px-3 py-1 bg-lime/10 text-lime text-xs rounded-lg shrink-0">
                                                Submitted
                                            </span>
                                        )}
                                        {assignment.status === 'upcoming' && (
                                            <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-lg shrink-0">
                                                Upcoming
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm mt-2">{assignment.description}</p>
                                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            Due: {assignment.dueDate}
                                        </span>
                                    </div>

                                    {/* Feedback */}
                                    {assignment.feedback && (
                                        <div className="mt-4 p-4 bg-lime/5 border border-lime/20 rounded-xl">
                                            <p className="text-xs text-lime mb-1 font-medium">Admin Feedback</p>
                                            <p className="text-sm text-gray-300">{assignment.feedback}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action */}
                                {assignment.status !== 'submitted' && (
                                    <button className="px-5 py-2.5 gradient-lime text-black font-medium rounded-xl hover:opacity-90 transition shrink-0 flex items-center gap-2">
                                        Submit <ArrowRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
