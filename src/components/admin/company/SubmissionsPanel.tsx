import { useEffect, useState } from 'react'
import { X, Download, MessageSquare, Loader2, CheckCircle2, Clock, Link as LinkIcon, FileText, Sparkles, Image } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Portal } from '@/components/shared/Portal'
import { formatDateLabel } from '@/lib/time'
import type { Assignment, User } from '@/types/database'

interface Submission {
    id: string
    assignment_id: string
    user_id: string
    file_url: string | null
    notes: string | null
    prompt_text: string | null
    score: number | null
    feedback: string | null
    status: string
    submitted_at: string | null
}

interface SubmissionsPanelProps {
    assignment: Assignment
    members: User[]
    onClose: () => void
}

function isImageUrl(url: string) {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url)
}

function isVideoUrl(url: string) {
    return /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(url)
}

function SubmissionContent({ sub }: { sub: Submission }) {
    if (sub.file_url) {
        if (isImageUrl(sub.file_url)) {
            return (
                <div className="space-y-1.5">
                    <a href={sub.file_url} target="_blank" rel="noreferrer">
                        <img
                            src={sub.file_url}
                            alt="Submission"
                            className="max-h-48 w-auto rounded-lg border border-border object-contain bg-black/20 hover:opacity-90 transition cursor-pointer"
                        />
                    </a>
                    <a href={sub.file_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-lime hover:underline">
                        <Image className="h-3 w-3" /> Open full size
                    </a>
                </div>
            )
        }
        if (isVideoUrl(sub.file_url)) {
            return (
                <video
                    src={sub.file_url}
                    controls
                    className="w-full rounded-lg border border-border max-h-48"
                />
            )
        }
        return (
            <a href={sub.file_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-lime hover:underline">
                <Download className="h-3.5 w-3.5" /> Download Submission
            </a>
        )
    }
    if (sub.notes) {
        return (
            <div className="flex items-start gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 bg-white/5 rounded-lg p-2 flex-1 whitespace-pre-wrap">{sub.notes}</p>
            </div>
        )
    }
    return null
}

export function SubmissionsPanel({ assignment, members, onClose }: SubmissionsPanelProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { feedback: string; score: string }>>({})

    const fetchSubmissions = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('submissions')
            .select('id, assignment_id, user_id, file_url, notes, prompt_text, score, feedback, status, submitted_at')
            .eq('assignment_id', assignment.id)
        setSubmissions((data as Submission[]) ?? [])
        setIsLoading(false)
    }

    useEffect(() => { fetchSubmissions() }, [assignment.id])

    const subMap = new Map(submissions.map((s) => [s.user_id, s]))

    const handleSaveFeedback = async (userId: string) => {
        const sub = subMap.get(userId)
        if (!sub) return
        const draft = feedbackDrafts[userId]
        if (!draft) return

        setSavingId(userId)
        const score = draft.score.trim() ? parseInt(draft.score, 10) : null
        // @ts-expect-error - Supabase update type
        await supabase.from('submissions').update({
            feedback: draft.feedback.trim() || null,
            score: Number.isNaN(score) ? null : score,
            status: 'reviewed',
        }).eq('id', sub.id)

        setSavingId(null)
        fetchSubmissions()
    }

    const initDraft = (userId: string) => {
        const sub = subMap.get(userId)
        setFeedbackDrafts((prev) => ({
            ...prev,
            [userId]: {
                feedback: sub?.feedback ?? '',
                score: sub?.score != null ? String(sub.score) : '',
            },
        }))
    }

    const pendingCount = submissions.filter((s) => s.status !== 'reviewed').length

    return (
        <Portal>
            <AnimatePresence>
                <div className="fixed inset-0 z-[71] flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative z-10 w-full max-w-lg bg-bg-card border-l border-border h-full overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-bg-card/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-base font-semibold text-white">{assignment.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-gray-500">
                                        {submissions.length}/{members.length} submitted
                                        {assignment.due_date && ` · Due ${formatDateLabel(assignment.due_date)}`}
                                    </p>
                                    {pendingCount > 0 && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            {pendingCount} pending review
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Member list */}
                        <div className="p-6 space-y-3">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-lime" />
                                </div>
                            ) : (
                                members.map((member) => {
                                    const sub = subMap.get(member.id)
                                    const draft = feedbackDrafts[member.id]
                                    const hasSubmitted = !!sub
                                    const isReviewed = sub?.status === 'reviewed'

                                    return (
                                        <div key={member.id} className="bg-bg-elevated border border-border rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-lime/10 flex items-center justify-center text-xs font-bold text-lime">
                                                        {(member.full_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{member.full_name || member.email}</p>
                                                    </div>
                                                </div>
                                                {hasSubmitted ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md border ${isReviewed ? 'bg-lime/10 text-lime border-lime/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>
                                                        {isReviewed ? <><CheckCircle2 className="h-3 w-3" /> Reviewed</> : <><Clock className="h-3 w-3" /> Needs Review</>}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-[10px] text-gray-500 border border-border rounded-md">Not submitted</span>
                                                )}
                                            </div>

                                            {hasSubmitted && (
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-xs text-gray-500">Submitted {sub.submitted_at ? formatDateLabel(sub.submitted_at) : ''}</p>

                                                    {/* Submission content */}
                                                    <SubmissionContent sub={sub} />

                                                    {/* Prompt used */}
                                                    {sub.prompt_text && (
                                                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                                            <Sparkles className="h-3 w-3 text-purple-400 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-0.5">Prompt used</p>
                                                                <p className="text-xs text-gray-300">{sub.prompt_text}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Feedback section */}
                                                    {draft ? (
                                                        <div className="space-y-2 mt-2 pt-2 border-t border-border">
                                                            <div className="flex gap-2">
                                                                <div className="flex-1">
                                                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Feedback</label>
                                                                    <textarea
                                                                        value={draft.feedback}
                                                                        onChange={(e) => setFeedbackDrafts((p) => ({ ...p, [member.id]: { ...draft, feedback: e.target.value } }))}
                                                                        className="w-full mt-1 px-2.5 py-1.5 text-xs bg-bg-card border border-border rounded-lg text-white focus:outline-none focus:border-lime/50 resize-none"
                                                                        rows={3}
                                                                        placeholder="Write feedback..."
                                                                    />
                                                                </div>
                                                                <div className="w-20">
                                                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Score</label>
                                                                    <input
                                                                        type="number"
                                                                        value={draft.score}
                                                                        onChange={(e) => setFeedbackDrafts((p) => ({ ...p, [member.id]: { ...draft, score: e.target.value } }))}
                                                                        className="w-full mt-1 px-2.5 py-1.5 text-xs bg-bg-card border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                                                                        placeholder="0-100"
                                                                        min={0}
                                                                        max={100}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setFeedbackDrafts((p) => { const n = { ...p }; delete n[member.id]; return n })}
                                                                    className="px-3 py-1 text-xs text-gray-400 hover:text-white transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSaveFeedback(member.id)}
                                                                    disabled={savingId === member.id}
                                                                    className="px-3 py-1 text-xs font-medium rounded-lg gradient-lime text-black hover:opacity-90 disabled:opacity-50"
                                                                >
                                                                    {savingId === member.id ? 'Saving...' : 'Save Feedback'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-2">
                                                            {isReviewed && (
                                                                <div className="text-xs text-gray-400 mb-1">
                                                                    {sub.score != null && <span className="text-lime font-medium">Score: {sub.score}</span>}
                                                                    {sub.feedback && <p className="mt-1">{sub.feedback}</p>}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => initDraft(member.id)}
                                                                className={`inline-flex items-center gap-1 text-xs transition ${isReviewed ? 'text-gray-500 hover:text-lime' : 'text-amber-400 hover:text-amber-300 font-medium'}`}
                                                            >
                                                                <MessageSquare className="h-3 w-3" />
                                                                {isReviewed ? 'Edit Feedback' : 'Review & Give Feedback'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        </Portal>
    )
}
