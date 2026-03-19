import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Pencil, Trash2, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { AssignmentModal } from '@/components/admin/assignments/AssignmentModal'
import { SubmissionsPanel } from '@/components/admin/company/SubmissionsPanel'
import { formatDateLabel } from '@/lib/time'
import type { Assignment, Cohort, Session, SubmissionFormat, User } from '@/types/database'

interface WorkspaceAssignmentsProps {
    cohortId: string
    cohort: Cohort
    sessions: Session[]
    members: User[]
}

const formatBadge: Record<SubmissionFormat, { label: string; cls: string }> = {
    file: { label: 'File', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
    link: { label: 'Link', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
    text: { label: 'Text', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    any: { label: 'Open', cls: 'bg-gray-500/10 text-gray-300 border-gray-500/30' },
}



export function WorkspaceAssignments({ cohortId: _cohortId, cohort, sessions, members }: WorkspaceAssignmentsProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
    const [reviewingAssignment, setReviewingAssignment] = useState<Assignment | null>(null)

    const fetchAssignments = async () => {
        setIsLoading(true)
        const sessionIds = sessions.map((s) => s.id)
        if (sessionIds.length === 0) { setAssignments([]); setSubmissionCounts({}); setIsLoading(false); return }

        const { data } = await supabase
            .from('assignments')
            .select('*')
            .in('session_id', sessionIds)
            .order('due_date', { ascending: true })

        const rows = (data as Assignment[]) ?? []
        setAssignments(rows)

        // Count submissions per assignment
        if (rows.length > 0) {
            const { data: subs } = await supabase
                .from('submissions')
                .select('assignment_id')
                .in('assignment_id', rows.map((a) => a.id))

            const counts: Record<string, number> = {}
                ; (subs as { assignment_id: string }[] | null)?.forEach((s) => {
                    counts[s.assignment_id] = (counts[s.assignment_id] || 0) + 1
                })
            setSubmissionCounts(counts)
        }
        setIsLoading(false)
    }

    useEffect(() => { fetchAssignments() }, [sessions])

    const handleDelete = async (assignment: Assignment) => {
        if (!confirm(`Delete "${assignment.title}"?`)) return
        await supabase.from('assignments').delete().eq('id', assignment.id)
        fetchAssignments()
    }

    const sessionMap = new Map(sessions.map((s) => [s.id, s]))

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-lime" />
                    Assignments ({assignments.length})
                </h4>
                <button
                    onClick={() => { setSelectedAssignment(null); setIsModalOpen(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg gradient-lime text-black hover:opacity-90 transition"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Assignment
                </button>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-border bg-bg-elevated/50 p-6 text-center">
                    <p className="text-xs text-gray-500">Loading assignments...</p>
                </div>
            ) : assignments.length === 0 ? (
                <div className="rounded-xl border border-border border-dashed bg-bg-elevated/50 p-6 text-center">
                    <ClipboardList className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No assignments yet. Add your first assignment.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {assignments.map((assignment) => {
                        const session = sessionMap.get(assignment.session_id)
                        const subCount = submissionCounts[assignment.id] || 0
                        const totalMembers = members.length
                        const badge = formatBadge[assignment.submission_format] || formatBadge.file
                        const isDue = assignment.due_date && new Date(assignment.due_date) < new Date()
                        return (
                            <motion.div
                                key={assignment.id}
                                layout
                                className="bg-white/[0.02] border border-white/[0.05] rounded-[20px] p-4 hover:border-lime/20 hover:bg-white/[0.04] transition-all duration-300"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <p className="text-sm font-medium text-white">{assignment.title}</p>
                                            <span className={`px-2 py-0.5 text-[10px] rounded-md border ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            {session && <span>Session {session.session_number}: {session.title}</span>}
                                            {assignment.due_date && (
                                                <span className={isDue ? 'text-red-400' : ''}>
                                                    Due {formatDateLabel(assignment.due_date)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Submission count button */}
                                        <button
                                            onClick={() => setReviewingAssignment(assignment)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-white/5 border border-border hover:border-lime/30 text-gray-300 hover:text-white transition"
                                            title="View submissions"
                                        >
                                            <Users className="h-3.5 w-3.5" />
                                            {subCount}/{totalMembers}
                                        </button>
                                        <button
                                            onClick={() => { setSelectedAssignment(assignment); setIsModalOpen(true) }}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-lime hover:bg-lime/5 transition"
                                            title="Edit"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(assignment)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <AssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); setSelectedAssignment(null); fetchAssignments() }}
                assignment={selectedAssignment}
                sessions={sessions}
                programs={[cohort]}
            />

            {reviewingAssignment && (
                <SubmissionsPanel
                    assignment={reviewingAssignment}
                    members={members}
                    onClose={() => { setReviewingAssignment(null); fetchAssignments() }}
                />
            )}
        </div>
    )
}
