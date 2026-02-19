import { useEffect, useMemo, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { ModalForm } from '@/components/admin/shared/ModalForm'
import { formatDateLabel, formatTimeLabel } from '@/lib/time'
import type { Assignment, Submission, User } from '@/types/database'

type SubmissionRow = Submission & { user?: Pick<User, 'id' | 'full_name' | 'email'> }

interface SubmissionsModalProps {
    isOpen: boolean
    onClose: () => void
    assignment: Assignment | null
}

export function SubmissionsModal({ isOpen, onClose, assignment }: SubmissionsModalProps) {
    const supabase = useSupabase()
    const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!isOpen || !assignment) return

        let ignore = false
        const fetchSubmissions = async () => {
            setIsLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('submissions')
                .select('id, assignment_id, user_id, content, submitted_at, status, admin_feedback, user:users(id, full_name, email)')
                .eq('assignment_id', assignment.id)
                .order('submitted_at', { ascending: false })

            if (ignore) return

            if (fetchError) {
                setError(fetchError.message)
                setSubmissions([])
            } else {
                const rows = (data as SubmissionRow[]) ?? []
                setSubmissions(rows)
                setFeedbackDrafts(Object.fromEntries(rows.map((row) => [row.id, row.admin_feedback ?? ''])))
            }

            setIsLoading(false)
        }

        fetchSubmissions()

        return () => {
            ignore = true
        }
    }, [isOpen, assignment?.id])

    const handleSave = async (submissionId: string) => {
        const feedback = feedbackDrafts[submissionId] ?? ''
        setSavingId(submissionId)

        const { error: updateError } = await supabase
            .from('submissions')
            // @ts-expect-error - Supabase update type inference issue
            .update({
                admin_feedback: feedback.trim() || null,
                status: 'reviewed',
            })
            .eq('id', submissionId)

        if (updateError) {
            setError(updateError.message)
            setSavingId(null)
            return
        }

        setSubmissions((prev) => prev.map((row) => (
            row.id === submissionId
                ? { ...row, admin_feedback: feedback.trim() || null, status: 'reviewed' }
                : row
        )))
        setSavingId(null)
    }

    const title = assignment ? `Submissions · ${assignment.title}` : 'Submissions'

    const submissionsContent = useMemo(() => submissions.map((submission) => {
        const rawContent = submission.content as Submission['content'] | null | undefined
        const content = rawContent && typeof rawContent === 'object' ? rawContent : {}
        const submittedDate = submission.submitted_at
        const dateLabel = submittedDate ? formatDateLabel(submittedDate) : '—'
        const timeLabel = submittedDate ? formatTimeLabel(submittedDate) : ''
        const link = content.link || content.file_url
        const textValue = content.text

        return (
            <div key={submission.id} className="rounded-xl border border-border bg-bg-card/60 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-medium text-white">{submission.user?.full_name ?? 'Participant'}</p>
                        <p className="text-xs text-gray-500">{submission.user?.email ?? 'No email on file'}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                        {dateLabel} {timeLabel}
                    </div>
                </div>

                <div className="text-sm text-gray-300">
                    {link ? (
                        <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-lime hover:underline"
                        >
                            {link}
                        </a>
                    ) : textValue ? (
                        <p className="whitespace-pre-wrap">{textValue}</p>
                    ) : (
                        <span className="text-gray-500">No submission content.</span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-lg border ${submission.status === 'reviewed'
                        ? 'border-lime/30 text-lime bg-lime/10'
                        : 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'
                        }`}
                    >
                        {submission.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                    </span>
                </div>

                <div>
                    <label className="block text-xs text-gray-400 mb-1">Admin Feedback</label>
                    <textarea
                        value={feedbackDrafts[submission.id] ?? ''}
                        onChange={(e) =>
                            setFeedbackDrafts((prev) => ({ ...prev, [submission.id]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/50"
                        rows={3}
                        placeholder="Add feedback for this submission"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => handleSave(submission.id)}
                        disabled={savingId === submission.id}
                        className="px-3 py-1.5 rounded-lg border border-lime/40 text-xs text-lime hover:border-lime/70 disabled:opacity-50"
                    >
                        {savingId === submission.id ? 'Saving...' : 'Save feedback'}
                    </button>
                </div>
            </div>
        )
    }), [feedbackDrafts, savingId, submissions])

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            showActions={false}
        >
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-sm text-gray-400">Loading submissions...</div>
            ) : submissions.length === 0 ? (
                <div className="text-sm text-gray-400">No submissions yet.</div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {submissionsContent}
                </div>
            )}
        </ModalForm>
    )
}
