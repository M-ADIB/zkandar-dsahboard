import { useEffect, useState } from 'react'
import { ExternalLink, FileText, MessageSquare, Sparkles } from 'lucide-react'
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

function isImageUrl(url: string) {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url)
}

function isVideoUrl(url: string) {
    return /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(url)
}

function SubmissionContent({ sub }: { sub: SubmissionRow }) {
    if (sub.file_url) {
        if (isImageUrl(sub.file_url)) {
            return (
                <div className="space-y-2">
                    <a href={sub.file_url} target="_blank" rel="noreferrer">
                        <img
                            src={sub.file_url}
                            alt="Submission"
                            className="max-h-64 w-auto rounded-xl border border-border object-contain bg-black/20 hover:opacity-90 transition cursor-pointer"
                        />
                    </a>
                    <a href={sub.file_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-lime hover:underline">
                        <ExternalLink className="h-3 w-3" /> Open full size
                    </a>
                </div>
            )
        }
        if (isVideoUrl(sub.file_url)) {
            return (
                <video
                    src={sub.file_url}
                    controls
                    className="w-full rounded-xl border border-border max-h-64"
                />
            )
        }
        // Generic file link
        return (
            <a href={sub.file_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-lime hover:underline">
                <ExternalLink className="h-4 w-4" /> View uploaded file
            </a>
        )
    }

    if (sub.notes) {
        return (
            <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{sub.notes}</p>
            </div>
        )
    }

    return <p className="text-xs text-gray-600 italic">No submission content.</p>
}

export function SubmissionsModal({ isOpen, onClose, assignment }: SubmissionsModalProps) {
    const supabase = useSupabase()
    const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})
    const [scoreDrafts, setScoreDrafts] = useState<Record<string, number | null>>({})

    useEffect(() => {
        if (!isOpen || !assignment) return
        let ignore = false

        const fetchSubmissions = async () => {
            setIsLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('submissions')
                .select('id, assignment_id, user_id, file_url, notes, prompt_text, submitted_at, status, feedback, score, user:users(id, full_name, email)')
                .eq('assignment_id', assignment.id)
                .order('submitted_at', { ascending: false })

            if (ignore) return

            if (fetchError) {
                setError(fetchError.message)
                setSubmissions([])
            } else {
                const rows = (data as SubmissionRow[]) ?? []
                setSubmissions(rows)
                setFeedbackDrafts(Object.fromEntries(rows.map((r) => [r.id, r.feedback ?? ''])))
                setScoreDrafts(Object.fromEntries(rows.map((r) => [r.id, r.score ?? null])))
            }
            setIsLoading(false)
        }

        fetchSubmissions()
        return () => { ignore = true }
    }, [isOpen, assignment?.id])

    const handleSave = async (submissionId: string) => {
        const feedbackVal = feedbackDrafts[submissionId] ?? ''
        const scoreVal    = scoreDrafts[submissionId] ?? null
        setSavingId(submissionId)

        const { error: updateError } = await supabase
            .from('submissions')
            // @ts-expect-error - runtime columns
            .update({ feedback: feedbackVal.trim() || null, score: scoreVal, status: 'reviewed' })
            .eq('id', submissionId)

        if (updateError) { setError(updateError.message); setSavingId(null); return }

        setSubmissions((prev) => prev.map((r) =>
            r.id === submissionId
                ? { ...r, feedback: feedbackVal.trim() || null, score: scoreVal, status: 'reviewed' }
                : r
        ))
        setSavingId(null)
    }

    const title = assignment ? `Submissions · ${assignment.title}` : 'Submissions'

    return (
        <ModalForm isOpen={isOpen} onClose={onClose} title={title} showActions={false}>
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 mb-3">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-sm text-gray-400">Loading submissions…</div>
            ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <MessageSquare className="h-8 w-8 text-gray-700" />
                    <p className="text-sm text-gray-400">No submissions yet.</p>
                    <p className="text-xs text-gray-600">Participants haven't submitted this assignment.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                    {submissions.map((sub) => {
                        const dateLabel = sub.submitted_at ? formatDateLabel(sub.submitted_at) : '—'
                        const timeLabel = sub.submitted_at ? formatTimeLabel(sub.submitted_at) : ''
                        return (
                            <div key={sub.id} className="rounded-xl border border-border bg-bg-card/60 p-4 space-y-3">
                                {/* Participant + date */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{sub.user?.full_name ?? 'Participant'}</p>
                                        <p className="text-xs text-gray-500">{sub.user?.email ?? ''}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium ${
                                            sub.status === 'reviewed'
                                                ? 'border-lime/30 text-lime bg-lime/10'
                                                : 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'
                                        }`}>
                                            {sub.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                                        </span>
                                        <span className="text-xs text-gray-500">{dateLabel} {timeLabel}</span>
                                    </div>
                                </div>

                                {/* Submission content */}
                                <SubmissionContent sub={sub} />

                                {/* Prompt (if present) */}
                                {sub.prompt_text && (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                        <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-0.5">Prompt used</p>
                                            <p className="text-xs text-gray-300 leading-relaxed">{sub.prompt_text}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Score slider */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">Score (0–100)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range" min={0} max={100} step={5}
                                            value={scoreDrafts[sub.id] ?? 0}
                                            onChange={(e) => setScoreDrafts((p) => ({ ...p, [sub.id]: Number(e.target.value) }))}
                                            className="flex-1 h-2 rounded-full appearance-none bg-white/[0.05] accent-lime cursor-pointer"
                                        />
                                        <span className={`text-sm font-bold min-w-[3ch] text-right ${
                                            (scoreDrafts[sub.id] ?? 0) < 30 ? 'text-red-400'
                                            : (scoreDrafts[sub.id] ?? 0) < 60 ? 'text-amber-400'
                                            : 'text-lime'
                                        }`}>
                                            {scoreDrafts[sub.id] ?? 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">Feedback</label>
                                    <textarea
                                        value={feedbackDrafts[sub.id] ?? ''}
                                        onChange={(e) => setFeedbackDrafts((p) => ({ ...p, [sub.id]: e.target.value }))}
                                        rows={3}
                                        placeholder="Add feedback for this submission…"
                                        className="w-full rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all resize-none"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleSave(sub.id)}
                                        disabled={savingId === sub.id}
                                        className="px-3 py-1.5 rounded-lg border border-lime/40 text-xs text-lime hover:border-lime/70 disabled:opacity-50 transition"
                                    >
                                        {savingId === sub.id ? 'Saving…' : 'Save feedback'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </ModalForm>
    )
}
