import { useEffect, useState } from 'react'
import { ExternalLink, FileText, MessageSquare, Sparkles, Film } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { ModalForm } from '@/components/admin/shared/ModalForm'
import { formatDateLabel, formatTimeLabel } from '@/lib/time'
import type { Assignment, Submission, SubmissionStatus, User } from '@/types/database'

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
    let parsedJson: any = null
    try {
        if (sub.file_url && (sub.file_url.startsWith('{') || sub.file_url.startsWith('['))) {
            parsedJson = JSON.parse(sub.file_url)
        }
    } catch (e) {
        // Not JSON
    }

    if (parsedJson) {
        if (parsedJson.type === 's1_reflection') {
            const data = parsedJson.data || {}
            return (
                <div className="space-y-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <p className="text-xs text-lime font-bold uppercase tracking-wider">Session 1 Reflection Answers</p>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Q1. Biggest Gap</p>
                            <p className="text-white font-medium mt-0.5">{data.gap || '—'}</p>
                            <p className="text-gray-300 mt-1 text-xs whitespace-pre-wrap">{data.gap_explanation || '—'}</p>
                        </div>
                        <div className="pt-2.5 border-t border-white/[0.05]">
                            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Q2. Regularly Skipped Practices</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {Array.isArray(data.skipped_practices) && data.skipped_practices.length > 0 ? (
                                    data.skipped_practices.map((p: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300">
                                            {p}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-500 italic text-xs">None selected</span>
                                )}
                            </div>
                        </div>
                        <div className="pt-2.5 border-t border-white/[0.05]">
                            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Q3. Biggest Mistake</p>
                            <p className="text-white italic mt-0.5">"{data.biggest_mistake || '—'}"</p>
                        </div>
                    </div>
                </div>
            )
        }

        if (parsedJson.type === 's2_reflection') {
            const data = parsedJson.data || {}
            return (
                <div className="space-y-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <p className="text-xs text-lime font-bold uppercase tracking-wider">Session 2 Reflection Answers</p>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Q4. New Use Cases Discovered</p>
                            <p className="text-white font-medium mt-0.5">{data.new_use_cases || '—'}</p>
                        </div>
                        <div className="pt-2.5 border-t border-white/[0.05]">
                            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Q5. Biggest Blocker</p>
                            <p className="text-white font-medium mt-0.5">{data.biggest_blocker || '—'}</p>
                        </div>
                        <div className="pt-2.5 border-t border-white/[0.05]">
                            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Q6. Confidence Score</p>
                            <p className="text-white font-bold text-base text-lime mt-0.5">{data.confidence_score || '0'}/10</p>
                        </div>
                    </div>
                </div>
            )
        }

        if (parsedJson.submission_mode === 'upload') {
            const trackLabel = parsedJson.track === 'A' ? 'Track A - Architect' : parsedJson.track === 'B' ? 'Track B - Interior Designer' : 'Track C - Hospitality / F&B'
            return (
                <div className="space-y-4 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-lime/10 border border-lime/20 text-lime rounded-lg text-xs font-semibold uppercase tracking-wider">
                            {trackLabel}
                        </span>
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-medium">
                            {parsedJson.concept}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {parsedJson.hero && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">1. Hero Shot</p>
                                <a href={parsedJson.hero} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-white/5 aspect-video bg-black/40 hover:border-lime/30 transition-all">
                                    <img src={parsedJson.hero} alt="Hero Shot" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </a>
                            </div>
                        )}
                        {parsedJson.detail && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">2. Detail Moment</p>
                                <a href={parsedJson.detail} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-white/5 aspect-video bg-black/40 hover:border-lime/30 transition-all">
                                    <img src={parsedJson.detail} alt="Detail Moment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </a>
                            </div>
                        )}
                        {parsedJson.alt && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">3. Iteration/Alt POV</p>
                                <a href={parsedJson.alt} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-white/5 aspect-video bg-black/40 hover:border-lime/30 transition-all">
                                    <img src={parsedJson.alt} alt="Alt POV" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parsedJson.animA && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">4. Animation A</p>
                                <video src={parsedJson.animA} controls className="w-full rounded-lg border border-white/5 aspect-video bg-black/50" />
                                <a href={parsedJson.animA} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-lime hover:underline mt-1.5">
                                    <ExternalLink className="h-3 w-3" /> Open / Download Animation A
                                </a>
                            </div>
                        )}
                        {parsedJson.animB && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">5. Animation B</p>
                                <video src={parsedJson.animB} controls className="w-full rounded-lg border border-white/5 aspect-video bg-black/50" />
                                <a href={parsedJson.animB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-lime hover:underline mt-1.5">
                                    <ExternalLink className="h-3 w-3" /> Open / Download Animation B
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2.5 border-t border-white/[0.05]">
                        {parsedJson.doc && (
                            <a href={parsedJson.doc} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-lime bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-all">
                                <FileText className="h-3.5 w-3.5" /> View Prompts Document
                            </a>
                        )}
                        {parsedJson.bonus && (
                            <a href={parsedJson.bonus} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-lime bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-all">
                                <Film className="h-3.5 w-3.5" /> View Bonus Film
                            </a>
                        )}
                    </div>
                </div>
            )
        }
    }

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
        
        const isDriveLink = sub.file_url.includes('drive.google.com') || sub.file_url.includes('dropbox.com')
        return (
            <div className="space-y-3">
                {sub.notes && (
                    <div className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5">
                        <FileText className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{sub.notes}</p>
                    </div>
                )}
                <a href={sub.file_url} target="_blank" rel="noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isDriveLink 
                            ? 'bg-lime text-black hover:opacity-90 shadow-lg shadow-lime/10' 
                            : 'bg-white/5 text-lime border border-white/10 hover:bg-white/10'
                    }`}>
                    <ExternalLink className="h-4 w-4" /> 
                    {isDriveLink ? 'Open Google Drive / ZIP Folder' : 'View Uploaded File'}
                </a>
            </div>
        )
    }

    if (sub.notes) {
        return (
            <div className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5">
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
    const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({})

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
                const rows = (data as unknown as SubmissionRow[]) ?? []
                setSubmissions(rows)
                setFeedbackDrafts(Object.fromEntries(rows.map((r) => [r.id, r.feedback ?? ''])))
                setScoreDrafts(Object.fromEntries(rows.map((r) => [r.id, r.score ?? null])))
                setStatusDrafts(Object.fromEntries(rows.map((r) => [r.id, r.status ?? 'pending'])))
            }
            setIsLoading(false)
        }

        fetchSubmissions()
        return () => { ignore = true }
    }, [isOpen, assignment?.id])

    const handleSave = async (submissionId: string) => {
        const feedbackVal = feedbackDrafts[submissionId] ?? ''
        const scoreVal    = scoreDrafts[submissionId] ?? null
        const statusVal   = statusDrafts[submissionId] ?? 'pending'
        setSavingId(submissionId)

        const currentSub = submissions.find(s => s.id === submissionId)
        const wasApprovedBefore = currentSub?.status === 'approved'

        const { error: updateError } = await supabase
            .from('submissions')
            .update({ feedback: feedbackVal.trim() || null, score: scoreVal, status: statusVal as SubmissionStatus })
            .eq('id', submissionId)

        if (updateError) { setError(updateError.message); setSavingId(null); return }

        // Status text map for display
        const statusTextMap: Record<string, string> = {
            approved: 'Approved',
            resubmit: 'Resubmit Required',
            in_review: 'In Review',
            pending: 'Pending',
        }
        const statusText = statusTextMap[statusVal] || statusVal

        // If status is reviewed (not pending), trigger notifications
        if (statusVal !== 'pending' && currentSub?.user_id) {
            // 1. Send in-app notification
            const { error: notifyError } = await supabase
                .from('notifications')
                .insert({
                    user_id: currentSub.user_id,
                    title: 'Submission Reviewed',
                    message: `Your submission for "${assignment?.title || 'Assignment'}" has been reviewed. Status: ${statusText}.`,
                    type: statusVal === 'approved' ? 'success' : statusVal === 'resubmit' ? 'warning' : 'info',
                    action_url: '/assignments'
                })
            
            if (notifyError) {
                console.error('Failed to insert in-app notification:', notifyError)
            }

            // 2. Queue Email notification
            if (currentSub?.user?.email) {
                const recipientEmail = currentSub.user.email
                const recipientName = currentSub.user.full_name ?? 'Attendee'

                if (statusVal === 'approved' && !wasApprovedBefore) {
                    // Approved / Certificate congratulations email
                    await supabase.from('email_queue').insert({
                        recipient_email: recipientEmail,
                        recipient_name: recipientName,
                        subject: 'Khaled Zkandar - 1-on-1 + AI Certificate Unlocked!',
                        html_body: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #000000; color: #ffffff; border: 1px solid #222222; border-radius: 24px;">
                                <h2 style="color: #D0FF71; margin-top: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">Congratulations, ${recipientName}!</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: #cccccc; margin-top: 12px;">
                                    Khaled has reviewed and <strong>approved</strong> your Sprint Assignment! Your hard work has paid off.
                                </p>
                                <p style="font-size: 15px; line-height: 1.6; color: #cccccc;">
                                    You have unlocked two major achievements:
                                </p>
                                <div style="background-color: #0a0a0a; padding: 20px; border-radius: 16px; border: 1px solid #1a1a1a; margin: 24px 0;">
                                    <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                                        <span style="font-size: 20px;">🎓</span>
                                        <span style="font-size: 14px; font-weight: bold; color: #ffffff;">Your AI Certificate of Completion is ready.</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span style="font-size: 20px;">📅</span>
                                        <span style="font-size: 14px; font-weight: bold; color: #ffffff;">Your 1-on-1 booking with Khaled is unlocked.</span>
                                    </div>
                                </div>
                                <p style="font-size: 14px; color: #888888; margin-bottom: 24px; line-height: 1.5;">
                                    Head back to your dashboard to claim your certificate, download the PDF, and book your personalized 1-on-1 session.
                                </p>
                                <a href="${window.location.origin}/dashboard" style="display: inline-block; background-color: #D0FF71; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; transition: opacity 0.2s;">
                                    Go to Dashboard
                                </a>
                            </div>
                        `,
                        status: 'pending',
                        campaign_id: null,
                        attempts: 0,
                        send_after: null
                    })
                } else if (statusVal !== 'approved') {
                    // General reviewed email (e.g. resubmit, in_review)
                    await supabase.from('email_queue').insert({
                        recipient_email: recipientEmail,
                        recipient_name: recipientName,
                        subject: `Submission Reviewed: ${assignment?.title || 'Assignment'}`,
                        html_body: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #000000; color: #ffffff; border: 1px solid #222222; border-radius: 24px;">
                                <h2 style="color: #D0FF71; margin-top: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">Submission Reviewed</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: #cccccc; margin-top: 12px;">
                                    Your submission for <strong>${assignment?.title || 'Assignment'}</strong> has been reviewed by the instructor.
                                </p>
                                <div style="background-color: #0a0a0a; padding: 20px; border-radius: 16px; border: 1px solid #1a1a1a; margin: 24px 0;">
                                    <p style="margin: 0 0 5px 0; font-size: 11px; color: #666666; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Review Status</p>
                                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #ffffff; font-weight: bold;">${statusText}</p>
                                    
                                    ${scoreVal !== null ? `
                                    <p style="margin: 0 0 5px 0; font-size: 11px; color: #666666; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Score</p>
                                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #D0FF71; font-weight: bold;">${scoreVal}/100 pts</p>
                                    ` : ''}
                                    
                                    ${feedbackVal.trim() ? `
                                    <p style="margin: 0 0 5px 0; font-size: 11px; color: #666666; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Feedback</p>
                                    <p style="margin: 0; font-size: 14px; color: #cccccc; line-height: 1.5; white-space: pre-wrap;">${feedbackVal.trim()}</p>
                                    ` : ''}
                                </div>
                                <a href="${window.location.origin}/dashboard" style="display: inline-block; background-color: #D0FF71; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; transition: opacity 0.2s;">
                                    Go to Dashboard
                                </a>
                            </div>
                        `,
                        status: 'pending',
                        campaign_id: null,
                        attempts: 0,
                        send_after: null
                    })
                }
            }
        }

        setSubmissions((prev) => prev.map((r) =>
            r.id === submissionId
                ? { ...r, feedback: feedbackVal.trim() || null, score: scoreVal, status: statusVal as SubmissionStatus }
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
                            <div key={sub.id} className="rounded-xl border border-border bg-bg-card/60 p-4 space-y-4">
                                {/* Participant + date */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{sub.user?.full_name ?? 'Participant'}</p>
                                        <p className="text-xs text-gray-500">{sub.user?.email ?? ''}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                                            sub.status === 'approved'
                                                ? 'border-lime/30 text-lime bg-lime/10'
                                                : sub.status === 'resubmit'
                                                ? 'border-orange-500/30 text-orange-400 bg-orange-500/10'
                                                : sub.status === 'in_review'
                                                ? 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'
                                                : 'border-white/10 text-gray-400 bg-white/5'
                                        }`}>
                                            {sub.status === 'approved' ? 'Approved' : sub.status === 'resubmit' ? 'Resubmit' : sub.status === 'in_review' ? 'In Review' : 'Pending'}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">{dateLabel} {timeLabel}</span>
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

                                {/* Review Status dropdown */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/[0.05]">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Review Status</label>
                                        <select
                                            value={statusDrafts[sub.id] ?? 'pending'}
                                            onChange={(e) => setStatusDrafts((p) => ({ ...p, [sub.id]: e.target.value }))}
                                            className="w-full rounded-xl border border-white/[0.05] bg-[#0c0c0c] px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/40 transition-all"
                                        >
                                            <option value="pending" className="bg-[#111] text-white">Pending</option>
                                            <option value="in_review" className="bg-[#111] text-white">In Review</option>
                                            <option value="approved" className="bg-[#111] text-white">Approved</option>
                                            <option value="resubmit" className="bg-[#111] text-white">Resubmit Required</option>
                                        </select>
                                    </div>

                                    {/* Score slider */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Score (0–100)</label>
                                            <span className={`text-xs font-bold font-mono ${
                                                (scoreDrafts[sub.id] ?? 0) < 30 ? 'text-red-400'
                                                : (scoreDrafts[sub.id] ?? 0) < 60 ? 'text-amber-400'
                                                : 'text-lime'
                                            }`}>
                                                {scoreDrafts[sub.id] ?? 0} pts
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 h-9">
                                            <input
                                                type="range" min={0} max={100} step={5}
                                                value={scoreDrafts[sub.id] ?? 0}
                                                onChange={(e) => setScoreDrafts((p) => ({ ...p, [sub.id]: Number(e.target.value) }))}
                                                className="flex-1 h-1.5 rounded-full appearance-none bg-white/[0.05] accent-lime cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Feedback</label>
                                    <textarea
                                        value={feedbackDrafts[sub.id] ?? ''}
                                        onChange={(e) => setFeedbackDrafts((p) => ({ ...p, [sub.id]: e.target.value }))}
                                        rows={3}
                                        placeholder="Add feedback for this submission…"
                                        className="w-full rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2 text-sm text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all resize-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleSave(sub.id)}
                                        disabled={savingId === sub.id}
                                        className="px-4 py-2 rounded-xl gradient-lime text-black font-semibold text-xs hover:opacity-90 disabled:opacity-50 transition"
                                    >
                                        {savingId === sub.id ? 'Saving…' : 'Save review'}
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
