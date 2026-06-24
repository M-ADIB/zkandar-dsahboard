import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Upload, CheckCircle2, Loader2, Image as ImageIcon, Video, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Portal } from '@/components/shared/Portal'
import { useAuth } from '@/context/AuthContext'
import type { SubmissionFormat } from '@/types/database'

interface AssignmentInfo {
    id: string
    title: string
    session: string
    submissionFormat: SubmissionFormat
    description?: string
}

interface SubmitAssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    assignment: AssignmentInfo | null
    userId: string
}

type Mode = 'file' | 'text'

const MAX_FILE_MB = 50

function modeForFormat(format: SubmissionFormat): Mode {
    if (format === 'text') return 'text'
    return 'file'
}

export function SubmitAssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    assignment,
    userId,
}: SubmitAssignmentModalProps) {
    const { user } = useAuth()
    const [textValue, setTextValue]     = useState('')
    const [promptValue, setPromptValue] = useState('')
    const [file, setFile]               = useState<File | null>(null)
    const [mode, setMode]               = useState<Mode>('file')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError]             = useState<string | null>(null)
    const [done, setDone]               = useState(false)
    const fileInputRef                  = useRef<HTMLInputElement>(null)

    // Custom states for Session 1 Reflection
    const [s1Gap, setS1Gap] = useState('')
    const [s1GapExplanation, setS1GapExplanation] = useState('')
    const [s1Skipped, setS1Skipped] = useState<string[]>([])
    const [s1Mistake, setS1Mistake] = useState('')

    // Custom states for Session 2 Reflection
    const [s2NewUseCases, setS2NewUseCases] = useState('')
    const [s2Blocker, setS2Blocker] = useState('')
    const [s2BlockerOther, setS2BlockerOther] = useState('')
    const [s2Confidence, setS2Confidence] = useState('')

    // Custom states for Sprint Assignment
    const [sprintTrack, setSprintTrack] = useState('')
    const [sprintConcept, setSprintConcept] = useState('')
    const [sprintSubmitMode, setSprintSubmitMode] = useState<'link' | 'upload'>('upload')
    const [sprintPromptsText, setSprintPromptsText] = useState('')
    
    // Sprint Assignment individual files
    const [fileHero, setFileHero] = useState<File | null>(null)
    const [fileDetail, setFileDetail] = useState<File | null>(null)
    const [fileAlt, setFileAlt] = useState<File | null>(null)
    const [fileAnimA, setFileAnimA] = useState<File | null>(null)
    const [fileAnimB, setFileAnimB] = useState<File | null>(null)
    const [fileDoc, setFileDoc] = useState<File | null>(null)
    const [fileBonus, setFileBonus] = useState<File | null>(null)

    // File input refs for Sprint Assignment
    const refHero = useRef<HTMLInputElement>(null)
    const refDetail = useRef<HTMLInputElement>(null)
    const refAlt = useRef<HTMLInputElement>(null)
    const refAnimA = useRef<HTMLInputElement>(null)
    const refAnimB = useRef<HTMLInputElement>(null)
    const refDoc = useRef<HTMLInputElement>(null)
    const refBonus = useRef<HTMLInputElement>(null)

    const isS1Reflection = assignment?.title.toLowerCase().includes('session 1 reflection')
    const isS2Reflection = assignment?.title.toLowerCase().includes('session 2 reflection')
    const isSprintAssignment = assignment?.title.toLowerCase().includes('sprint assignment') || assignment?.title === 'AI ASSIGNMENT'
    const isAny = assignment?.submissionFormat === ('any' as SubmissionFormat) && !isSprintAssignment

    useEffect(() => {
        if (isOpen && assignment) {
            setMode(modeForFormat(assignment.submissionFormat))
            setTextValue('')
            setPromptValue('')
            setFile(null)
            setError(null)
            setDone(false)
            setIsSubmitting(false)

            // Reset custom states
            setS1Gap('')
            setS1GapExplanation('')
            setS1Skipped([])
            setS1Mistake('')

            setS2NewUseCases('')
            setS2Blocker('')
            setS2BlockerOther('')
            setS2Confidence('')

            setSprintTrack('')
            setSprintConcept('')
            setSprintSubmitMode('upload')
            setSprintPromptsText('')
            setFileHero(null)
            setFileDetail(null)
            setFileAlt(null)
            setFileAnimA(null)
            setFileAnimB(null)
            setFileDoc(null)
            setFileBonus(null)
        }
    }, [assignment?.id, isOpen])

    const reset = () => {
        setTextValue('')
        setPromptValue('')
        setFile(null)
        setMode(assignment ? modeForFormat(assignment.submissionFormat) : 'file')
        setError(null)
        setDone(false)
        setIsSubmitting(false)

        setS1Gap('')
        setS1GapExplanation('')
        setS1Skipped([])
        setS1Mistake('')

        setS2NewUseCases('')
        setS2Blocker('')
        setS2BlockerOther('')
        setS2Confidence('')

        setSprintTrack('')
        setSprintConcept('')
        setSprintSubmitMode('upload')
        setSprintPromptsText('')
        setFileHero(null)
        setFileDetail(null)
        setFileAlt(null)
        setFileAnimA(null)
        setFileAnimB(null)
        setFileDoc(null)
        setFileBonus(null)
    }

    const handleClose = () => { reset(); onClose() }

    const handleSuccess = () => {
        setDone(true)
        setTimeout(() => { reset(); onSuccess() }, 1200)
    }

    const uploadFile = async (pickedFile: File, prefix: string): Promise<string> => {
        const ext = pickedFile.name.split('.').pop() ?? 'bin'
        const path = `${userId}/${assignment!.id}/${prefix}_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
            .from('submissions')
            .upload(path, pickedFile, { upsert: false })
        if (uploadError) {
            throw new Error(`Upload of ${prefix} failed: ${uploadError.message}`)
        }
        const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(path)
        return urlData.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assignment) return
        setIsSubmitting(true)
        setError(null)

        let file_url: string | null = null
        let notes: string | null = null
        let prompt_text: string | null = null

        try {
            if (isS1Reflection) {
                // Validation
                if (!s1Gap) throw new Error('Please select your biggest gap (Question 1).')
                if (!s1GapExplanation.trim()) throw new Error('Please explain your biggest gap (Question 1).')
                if (!s1Mistake.trim()) throw new Error('Please enter your biggest mistake (Question 3).')

                const answers = {
                    gap: s1Gap,
                    gap_explanation: s1GapExplanation.trim(),
                    skipped_practices: s1Skipped,
                    biggest_mistake: s1Mistake.trim()
                }

                file_url = JSON.stringify({ type: 's1_reflection', data: answers })
                notes = `Q1. Biggest Gap: ${s1Gap}\nExplanation: ${s1GapExplanation.trim()}\n\nQ2. Regularly Skipped: ${s1Skipped.join(', ') || 'None'}\n\nQ3. Biggest Mistake: ${s1Mistake.trim()}`
            } 
            else if (isS2Reflection) {
                // Validation
                if (!s2NewUseCases) throw new Error('Please answer Question 4.')
                if (!s2Blocker) throw new Error('Please select your biggest blocker (Question 5).')
                if (s2Blocker === 'other' && !s2BlockerOther.trim()) throw new Error('Please specify your other blocker (Question 5).')
                if (!s2Confidence) throw new Error('Please select your confidence score (Question 6).')

                const finalBlocker = s2Blocker === 'other' ? s2BlockerOther.trim() : s2Blocker
                const answers = {
                    new_use_cases: s2NewUseCases,
                    biggest_blocker: finalBlocker,
                    confidence_score: Number(s2Confidence)
                }

                file_url = JSON.stringify({ type: 's2_reflection', data: answers })
                notes = `Q4. New Use Cases: ${s2NewUseCases}\n\nQ5. Biggest Blocker: ${finalBlocker}\n\nQ6. Confidence Score: ${s2Confidence}/10`
            } 
            else if (isSprintAssignment) {
                // Validation
                if (!sprintTrack) throw new Error('Please select your track.')
                if (!sprintConcept) throw new Error('Please select your concept.')

                // Upload mode validation
                if (!fileHero) throw new Error('Please upload Deliverable 1 (Hero wide/establishing shot).')
                if (!fileDetail) throw new Error('Please upload Deliverable 2 (Detail/FF&E/Interior moment).')
                if (!fileAlt) throw new Error('Please upload Deliverable 3 (Alternative/Facade/POV switch).')
                if (!fileAnimA) throw new Error('Please upload Deliverable 4 (Animation A).')
                if (!fileAnimB) throw new Error('Please upload Deliverable 5 (Animation B).')
                if (!sprintPromptsText.trim() && !fileDoc) throw new Error('Please provide prompts (either paste them in the text area or upload a prompts document).')

                const urls = {
                    track: sprintTrack,
                    concept: sprintConcept,
                    submission_mode: 'upload',
                    hero: await uploadFile(fileHero, 'hero'),
                    detail: await uploadFile(fileDetail, 'detail'),
                    alt: await uploadFile(fileAlt, 'alt'),
                    animA: await uploadFile(fileAnimA, 'anim_a'),
                    animB: await uploadFile(fileAnimB, 'anim_b'),
                    doc: fileDoc ? await uploadFile(fileDoc, 'prompts_doc') : null,
                    bonus: fileBonus ? await uploadFile(fileBonus, 'bonus_film') : null
                }

                file_url = JSON.stringify(urls)
                prompt_text = sprintPromptsText.trim() || 'Uploaded in prompts document'
                notes = `Track: ${sprintTrack}\nConcept: ${sprintConcept}\nSubmission Mode: Direct Upload`
            } 
            else {
                // Default assignment submission mode
                if (mode === 'file') {
                    if (!file) throw new Error('Please select a file to upload.')
                    file_url = await uploadFile(file, 'submission')
                } else {
                    if (!textValue.trim()) throw new Error('Please write your response.')
                    notes = textValue.trim()
                }
                prompt_text = promptValue.trim() || null
            }

            // Check if submission already exists for this user and assignment to handle resubmission
            const { data: existingSub } = await supabase
                .from('submissions')
                .select('id')
                .eq('assignment_id', assignment.id)
                .eq('user_id', userId)
                .maybeSingle()

            let dbError
            if (existingSub) {
                const { error: updateError } = await supabase
                    .from('submissions')
                    .update({
                        file_url,
                        notes,
                        prompt_text,
                        status: 'pending',
                        submitted_at: new Date().toISOString(),
                    })
                    .eq('id', existingSub.id)
                dbError = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('submissions')
                    .insert({
                        assignment_id: assignment.id,
                        user_id:       userId,
                        file_url,
                        notes,
                        prompt_text,
                        status:        'pending',
                        feedback:      null,
                        score:         null,
                    })
                dbError = insertError
            }

            if (dbError) throw new Error(dbError.message)

            // Automate Email Trigger on Sprint Assignment submission
            if (isSprintAssignment) {
                const trackName = sprintTrack === 'A' ? 'Track A - Architect' : sprintTrack === 'B' ? 'Track B - Interior Designer' : 'Track C - Hospitality / F&B'
                const conceptVal = sprintConcept

                await supabase.from('email_queue').insert({
                    recipient_email: 'admin@zkandar.com',
                    recipient_name: 'Khaled Zkandar',
                    subject: `[New Submission] Sprint Assignment - ${user?.full_name ?? 'Attendee'}`,
                    html_body: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #000000; color: #ffffff; border: 1px solid #222222; border-radius: 24px;">
                            <h2 style="color: #D0FF71; margin-top: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">New Sprint Assignment Submitted</h2>
                            <p style="font-size: 14px; line-height: 1.6; color: #aaaaaa; margin-top: 12px;">
                                A new sprint assignment is available for review on the dashboard.
                            </p>
                            <div style="background-color: #0a0a0a; padding: 20px; border-radius: 16px; border: 1px solid #1a1a1a; margin: 24px 0; font-size: 14px; line-height: 1.5;">
                                <p style="margin: 0 0 10px 0; color: #ffffff;"><strong style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 2px;">Attendee</strong> ${user?.full_name ?? 'Attendee'} (${user?.email ?? ''})</p>
                                <p style="margin: 0 0 10px 0; color: #ffffff;"><strong style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 2px;">Track</strong> ${trackName}</p>
                                <p style="margin: 0; color: #ffffff;"><strong style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 2px;">Concept</strong> ${conceptVal}</p>
                            </div>
                            <p style="font-size: 13px; color: #666666; margin-bottom: 24px; line-height: 1.5;">
                                Please review their submissions, assign a score, and change status to "Approved" to unlock their certificate and 1-on-1 booking.
                            </p>
                            <a href="${window.location.origin}/admin/programs" style="display: inline-block; background-color: #D0FF71; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; transition: opacity 0.2s;">
                                Review Submission
                            </a>
                        </div>
                    `,
                    status: 'pending',
                    campaign_id: null,
                    attempts: 0,
                    send_after: null
                })
            }

            handleSuccess()
        } catch (err: any) {
            setError(err.message)
            setIsSubmitting(false)
        }
    }

    if (!isOpen || !assignment) return null

    const s1Practices = [
        { key: 'hyper-specific', label: 'Being hyper-specific' },
        { key: 'iterate', label: 'Iterating and refining' },
        { key: 'positive-framing', label: 'Using positive framing' },
        { key: 'control-camera', label: 'Controlling the camera' },
        { key: 'think-director', label: 'Thinking like a director' }
    ]

    const s2Blockers = [
        { key: 'confidence', label: 'Confidence in prompting' },
        { key: 'time', label: 'Time to experiment' },
        { key: 'cost', label: 'Tool access/cost' },
        { key: 'buy-in', label: 'Client buy-in' },
        { key: 'start', label: 'Not sure which to start with' },
        { key: 'other', label: 'Other (specify below)' }
    ]

    const tracks = {
        A: {
            title: 'Track A · Architect',
            desc: 'Buildings, exteriors, facades, urban context.',
            concepts: [
                { id: 'A1', title: 'Coastal observatory tower', desc: '12-storey concrete-and-glass research tower on a rocky coastline. Quiet and scientific, not ornamental.' },
                { id: 'A2', title: 'Private museum on a cliff edge', desc: 'Low-rise, cantilevered. Stone or rammed earth. Sits with the landscape, not on top of it.' },
                { id: 'A3', title: 'Vertical urban farm', desc: '20-storey mid-rise with terraced planting. Dense city centre. A working building, not a render trophy.' }
            ]
        },
        B: {
            title: 'Track B · Interior Designer',
            desc: 'Rooms, materials, FF&E, lighting, atmosphere.',
            concepts: [
                { id: 'B1', title: 'Private library lounge', desc: 'Floor-to-ceiling bookshelves, deep reading armchair, layered lighting, one feature wall. Quiet and lived-in.' },
                { id: 'B2', title: 'Master bathroom in a mountain house', desc: 'Spa-quality with a large window framing the mountain view. Natural stone, warm wood. Hotel, not domestic.' },
                { id: 'B3', title: 'Boutique workspace for a creative founder', desc: 'Desk, lounge corner, materials wall, art. Structured + informal. Personal, not corporate.' }
            ]
        },
        C: {
            title: 'Track C · Hospitality / F&B',
            desc: 'Suites, restaurants, bars, guest journey moments.',
            concepts: [
                { id: 'C1', title: 'Speakeasy cocktail bar', desc: 'Hidden behind an unmarked door. Dark, layered, theatrical lighting. Intimate seating. Must feel discovered, not designed.' },
                { id: 'C2', title: 'Boutique hotel suite', desc: 'Signature corner suite in a 30-key hotel. Living, bedroom, statement bathroom, balcony. Anchors the hotel\'s brand story.' },
                { id: 'C3', title: 'Destination restaurant in a heritage building', desc: '70 covers inside a preserved heritage shell. Stone walls, original beams, modern intervention. Respects what was there.' }
            ]
        }
    }

    const currentTrack = sprintTrack as 'A' | 'B' | 'C'

    return (
        <Portal>
            <AnimatePresence>
                <div className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/85 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                        className="relative z-10 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-bg-elevated border border-border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
                            <div>
                                <h2 className="text-base font-semibold text-white uppercase tracking-wider text-lime">Submit Assignment</h2>
                                <p className="text-xs text-gray-500 mt-0.5">{assignment.session}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="shrink-0 p-1.5 -mr-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {done ? (
                            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', damping: 15 }}
                                    className="h-16 w-16 rounded-full bg-lime/10 flex items-center justify-center mb-2"
                                >
                                    <CheckCircle2 className="h-8 w-8 text-lime" />
                                </motion.div>
                                <p className="text-lg font-black text-white uppercase tracking-wide">Submitted Successfully!</p>
                                <p className="text-sm text-gray-400 max-w-sm">Your work has been submitted. Khaled has been notified for review.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="border-b border-white/[0.03] pb-3">
                                    <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-lime" /> {assignment.title}
                                    </h3>
                                    {assignment.description && (
                                        <p className="text-xs text-gray-500 mt-1">{assignment.description}</p>
                                    )}
                                </div>

                                {/* ── SESSION 1 REFLECTION FORM ── */}
                                {isS1Reflection && (
                                    <div className="space-y-5">
                                        {/* Q1 */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                1. Of the 5 best practices, which one is your biggest gap?
                                            </label>
                                            <select
                                                value={s1Gap}
                                                onChange={(e) => setS1Gap(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/40 transition"
                                            >
                                                <option value="">Select an option...</option>
                                                {s1Practices.map((p) => (
                                                    <option key={p.key} value={p.label}>{p.label}</option>
                                                ))}
                                            </select>
                                            {s1Gap && (
                                                <textarea
                                                    value={s1GapExplanation}
                                                    onChange={(e) => setS1GapExplanation(e.target.value)}
                                                    placeholder="Explain why this is your biggest gap..."
                                                    rows={3}
                                                    className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/40 transition resize-none mt-2"
                                                />
                                            )}
                                        </div>

                                        {/* Q2 */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                2. Tick every best practice you regularly skip when writing prompts today:
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                {s1Practices.map((p) => {
                                                    const isChecked = s1Skipped.includes(p.label)
                                                    return (
                                                        <label
                                                            key={p.key}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                                                                isChecked 
                                                                    ? 'bg-lime/5 border-lime/30 text-lime' 
                                                                    : 'bg-bg-card/40 border-border hover:border-white/10 text-gray-400'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => {
                                                                    if (isChecked) {
                                                                        setS1Skipped(s1Skipped.filter((s) => s !== p.label))
                                                                    } else {
                                                                        setS1Skipped([...s1Skipped, p.label])
                                                                    }
                                                                }}
                                                                className="rounded border-border text-lime focus:ring-lime/20 h-4 w-4 accent-lime"
                                                            />
                                                            {p.label}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Q3 */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                3. What's the biggest mistake you've been making when generating images that Session 1 made obvious to you? (One sentence)
                                            </label>
                                            <textarea
                                                value={s1Mistake}
                                                onChange={(e) => setS1Mistake(e.target.value)}
                                                placeholder="Write your one-sentence response..."
                                                rows={2}
                                                className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/40 transition resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* ── SESSION 2 REFLECTION FORM ── */}
                                {isS2Reflection && (
                                    <div className="space-y-5">
                                        {/* Q4 */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                4. How many Session 2 use cases were completely new to you?
                                            </label>
                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                {['0', '1–3', '4–6', '7+'].map((opt) => (
                                                    <label
                                                        key={opt}
                                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-semibold cursor-pointer transition ${
                                                            s2NewUseCases === opt 
                                                                ? 'bg-lime/5 border-lime/30 text-lime shadow-sm' 
                                                                : 'bg-bg-card/40 border-border hover:border-white/10 text-gray-400'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="s2_usecases"
                                                            value={opt}
                                                            checked={s2NewUseCases === opt}
                                                            onChange={() => setS2NewUseCases(opt)}
                                                            className="sr-only"
                                                        />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Q5 */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                5. What's your biggest blocker to using Session 2 workflows in your real work? (Pick one)
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                {s2Blockers.map((b) => (
                                                    <label
                                                        key={b.key}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                                                            s2Blocker === b.label 
                                                                ? 'bg-lime/5 border-lime/30 text-lime' 
                                                                : 'bg-bg-card/40 border-border hover:border-white/10 text-gray-400'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="s2_blocker"
                                                            value={b.label}
                                                            checked={s2Blocker === b.label}
                                                            onChange={() => setS2Blocker(b.label)}
                                                            className="rounded-full border-border text-lime focus:ring-lime/20 h-4 w-4 accent-lime"
                                                        />
                                                        {b.label}
                                                    </label>
                                                ))}
                                            </div>
                                            {s2Blocker.includes('Other') && (
                                                <input
                                                    type="text"
                                                    value={s2BlockerOther}
                                                    onChange={(e) => setS2BlockerOther(e.target.value)}
                                                    placeholder="Please specify your blocker..."
                                                    className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/40 transition mt-2 animate-fade-in"
                                                />
                                            )}
                                        </div>

                                        {/* Q6 */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                6. Confidence score 1–10: could you run that workflow end-to-end after the Sprint?
                                            </label>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((score) => (
                                                    <label
                                                        key={score}
                                                        className={`flex-1 min-w-[32px] h-10 rounded-lg flex items-center justify-center text-xs font-black cursor-pointer transition border ${
                                                            s2Confidence === score 
                                                                ? 'bg-lime text-black border-lime font-black' 
                                                                : 'bg-bg-card/40 border-border hover:border-white/10 text-gray-400 font-bold'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="s2_confidence"
                                                            value={score}
                                                            checked={s2Confidence === score}
                                                            onChange={() => setS2Confidence(score)}
                                                            className="sr-only"
                                                        />
                                                        {score}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── SPRINT ASSIGNMENT FORM ── */}
                                {isSprintAssignment && (
                                    <div className="space-y-5">
                                        <div className="p-4 bg-lime/5 border border-lime/20 rounded-2xl">
                                            <p className="text-xs text-lime/90 font-medium italic">
                                                "Pick ONE track only. Pick one concept. Produce 5 deliverables + optional bonus film. Submit. Proof of work, not a portfolio shoot."
                                            </p>
                                        </div>

                                        {/* Step 1: Choose Track */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                Step 1: Pick your track
                                            </label>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {(Object.keys(tracks) as Array<'A' | 'B' | 'C'>).map((tKey) => {
                                                    const t = tracks[tKey]
                                                    const isChecked = sprintTrack === tKey
                                                    return (
                                                        <label
                                                            key={tKey}
                                                            className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                                                                isChecked 
                                                                    ? 'bg-lime/5 border-lime/30 text-lime' 
                                                                    : 'bg-bg-card/40 border-border hover:border-white/10 text-gray-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="sprint_track"
                                                                value={tKey}
                                                                checked={isChecked}
                                                                onChange={() => {
                                                                    setSprintTrack(tKey)
                                                                    setSprintConcept('') // reset concept
                                                                }}
                                                                className="mt-1 border-border text-lime focus:ring-lime/20 h-4 w-4 accent-lime"
                                                            />
                                                            <div className="space-y-0.5">
                                                                <span className="text-sm font-bold text-white block">{t.title}</span>
                                                                <span className="text-xs text-gray-500 block">{t.desc}</span>
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Step 2: Choose Concept */}
                                        {sprintTrack && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-2"
                                            >
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    Step 2: Pick one concept
                                                </label>
                                                <div className="grid grid-cols-1 gap-2.5">
                                                    {tracks[currentTrack].concepts.map((c) => {
                                                        const isChecked = sprintConcept === c.title
                                                        return (
                                                            <label
                                                                key={c.id}
                                                                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                                                                    isChecked 
                                                                        ? 'bg-lime/5 border-lime/30 text-lime' 
                                                                        : 'bg-bg-card/40 border-border hover:border-white/10 text-gray-300'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="sprint_concept"
                                                                    value={c.title}
                                                                    checked={isChecked}
                                                                    onChange={() => setSprintConcept(c.title)}
                                                                    className="mt-1 border-border text-lime focus:ring-lime/20 h-4 w-4 accent-lime"
                                                                />
                                                                <div className="space-y-0.5">
                                                                    <span className="text-sm font-bold text-white block">{c.id} · {c.title}</span>
                                                                    <span className="text-xs text-gray-500 block">{c.desc}</span>
                                                                </div>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 3: Choose Submission Mode */}
                                        {sprintConcept && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                        Step 3: Upload Deliverables
                                                    </label>
                                                </div>

                                                {sprintSubmitMode === 'upload' && (
                                                    <div className="space-y-4 animate-fade-in">
                                                        <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-start gap-2">
                                                            <div className="text-[10px] text-gray-500 leading-normal">
                                                                Upload files below. File sizes must be under {MAX_FILE_MB}MB each. Prompts can be written or uploaded.
                                                            </div>
                                                        </div>

                                                        {/* REQUIRED 3 IMAGES */}
                                                        <div className="space-y-2 border border-border/60 bg-bg-card/20 p-4 rounded-2xl">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime/80">Required Images</span>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
                                                                {[
                                                                    { label: 'Hero wide shot', f: fileHero, sf: setFileHero, r: refHero, pref: 'hero' },
                                                                    { label: 'Interior moment', f: fileDetail, sf: setFileDetail, r: refDetail, pref: 'detail' },
                                                                    { label: 'Iteration shot', f: fileAlt, sf: setFileAlt, r: refAlt, pref: 'alt' }
                                                                ].map((slot, i) => (
                                                                    <div key={i} className="flex flex-col gap-1.5">
                                                                        <span className="text-[10px] text-gray-400 truncate">{slot.label}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => slot.r.current?.click()}
                                                                            className={`w-full aspect-video rounded-xl border border-dashed flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer ${
                                                                                slot.f ? 'bg-lime/5 border-lime/30' : 'bg-bg-card/60 border-border hover:border-lime/20'
                                                                            }`}
                                                                        >
                                                                            {slot.f ? (
                                                                                <div className="flex flex-col items-center text-center max-w-full">
                                                                                    <CheckCircle2 className="h-5 w-5 text-lime mb-1" />
                                                                                    <span className="text-[10px] text-lime font-bold truncate max-w-full px-1">{slot.f.name}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center text-center">
                                                                                    <Upload className="h-4 w-4 text-gray-600 mb-1" />
                                                                                    <span className="text-[10px] text-gray-500">Click to upload</span>
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                        <input
                                                                            ref={slot.r}
                                                                            type="file"
                                                                            accept="image/*"
                                                                            className="hidden"
                                                                            onChange={(e) => {
                                                                                const picked = e.target.files?.[0] ?? null
                                                                                if (picked && picked.size > MAX_FILE_MB * 1024 * 1024) {
                                                                                    setError('File size must be under 200MB')
                                                                                    return
                                                                                }
                                                                                slot.sf(picked)
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* REQUIRED 2 ANIMATIONS */}
                                                        <div className="space-y-2 border border-border/60 bg-bg-card/20 p-4 rounded-2xl">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime/80">Required Animations</span>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                                                                {[
                                                                    { label: 'Animation A (3–5s video)', f: fileAnimA, sf: setFileAnimA, r: refAnimA },
                                                                    { label: 'Animation B (3–5s video)', f: fileAnimB, sf: setFileAnimB, r: refAnimB }
                                                                ].map((slot, i) => (
                                                                    <div key={i} className="flex flex-col gap-1.5">
                                                                        <span className="text-[10px] text-gray-400 truncate">{slot.label}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => slot.r.current?.click()}
                                                                            className={`w-full py-4 px-3 rounded-xl border border-dashed flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
                                                                                slot.f ? 'bg-lime/5 border-lime/30' : 'bg-bg-card/60 border-border hover:border-lime/20'
                                                                            }`}
                                                                        >
                                                                            {slot.f ? (
                                                                                <>
                                                                                    <CheckCircle2 className="h-4 w-4 text-lime shrink-0" />
                                                                                    <span className="text-[11px] text-lime font-bold truncate max-w-[150px]">{slot.f.name}</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Video className="h-4 w-4 text-gray-600 shrink-0" />
                                                                                    <span className="text-[11px] text-gray-500">Click to upload video</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                        <input
                                                                            ref={slot.r}
                                                                            type="file"
                                                                            accept="video/*"
                                                                            className="hidden"
                                                                            onChange={(e) => {
                                                                                const picked = e.target.files?.[0] ?? null
                                                                                if (picked && picked.size > MAX_FILE_MB * 1024 * 1024) {
                                                                                    setError('File size must be under 200MB')
                                                                                    return
                                                                                }
                                                                                slot.sf(picked)
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* PROMPTS DOCUMENT / TEXT */}
                                                        <div className="space-y-3.5 border border-border/60 bg-bg-card/20 p-4 rounded-2xl">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime/80">Prompts & Document</span>
                                                            <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
                                                                <div className="flex-1 space-y-1">
                                                                    <span className="text-[10px] text-gray-400">Written Prompts Text Area</span>
                                                                    <textarea
                                                                        value={sprintPromptsText}
                                                                        onChange={(e) => setSprintPromptsText(e.target.value)}
                                                                        placeholder="Paste all 5 prompts clearly..."
                                                                        rows={3}
                                                                        className="w-full px-3 py-2 bg-bg-card border border-border rounded-xl text-xs text-white focus:outline-none focus:border-lime/40 transition resize-none placeholder:text-gray-700 font-mono"
                                                                    />
                                                                </div>
                                                                <div className="sm:w-56 shrink-0 flex flex-col gap-1.5">
                                                                    <span className="text-[10px] text-gray-400">Upload Doc (PDF/Text)</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => refDoc.current?.click()}
                                                                        className={`h-full py-4 px-3 rounded-xl border border-dashed flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                                                                            fileDoc ? 'bg-lime/5 border-lime/30' : 'bg-bg-card/60 border-border hover:border-lime/20'
                                                                        }`}
                                                                    >
                                                                        {fileDoc ? (
                                                                            <>
                                                                                <CheckCircle2 className="h-4 w-4 text-lime shrink-0" />
                                                                                <span className="text-[10px] text-lime font-bold truncate max-w-[120px]">{fileDoc.name}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <FileText className="h-4 w-4 text-gray-600 shrink-0" />
                                                                                <span className="text-[10px] text-gray-500">Upload doc</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                    <input
                                                                        ref={refDoc}
                                                                        type="file"
                                                                        accept=".pdf,.doc,.docx,.txt"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const picked = e.target.files?.[0] ?? null
                                                                            if (picked && picked.size > MAX_FILE_MB * 1024 * 1024) {
                                                                                setError('File size must be under 200MB')
                                                                                return
                                                                            }
                                                                            setFileDoc(picked)
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* OPTIONAL BONUS FILM */}
                                                        <div className="space-y-2 border border-border/60 bg-bg-card/20 p-4 rounded-2xl">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime/80">Bonus (Optional)</span>
                                                                <span className="text-[9px] text-gray-600 font-medium">Won't gate your unlock</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 mt-1.5">
                                                                <span className="text-[10px] text-gray-400">30-second Short Film</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => refBonus.current?.click()}
                                                                    className={`w-full py-4 px-3 rounded-xl border border-dashed flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
                                                                        fileBonus ? 'bg-lime/5 border-lime/30 shadow-lime/5' : 'bg-bg-card/60 border-border hover:border-lime/20'
                                                                    }`}
                                                                >
                                                                    {fileBonus ? (
                                                                        <>
                                                                            <CheckCircle2 className="h-4 w-4 text-lime shrink-0" />
                                                                            <span className="text-[11px] text-lime font-bold truncate max-w-[200px]">{fileBonus.name}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Video className="h-4 w-4 text-gray-600 shrink-0" />
                                                                            <span className="text-[11px] text-gray-500">Upload bonus short film</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <input
                                                                    ref={refBonus}
                                                                    type="file"
                                                                    accept="video/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const picked = e.target.files?.[0] ?? null
                                                                        if (picked && picked.size > MAX_FILE_MB * 1024 * 1024) {
                                                                            setError('File size must be under 200MB')
                                                                            return
                                                                        }
                                                                        setFileBonus(picked)
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* ── DEFAULT ASSIGNMENT FORM ── */}
                                {!isS1Reflection && !isS2Reflection && !isSprintAssignment && (
                                    <>
                                        {/* Mode toggle — only for 'any' format */}
                                        {isAny && (
                                            <div className="flex items-center gap-2 p-1 rounded-xl bg-bg-card border border-border w-fit">
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('file')}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'file' ? 'bg-bg-elevated text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    <Upload className="h-3.5 w-3.5" />
                                                    Upload
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('text')}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'text' ? 'bg-bg-elevated text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Text
                                                </button>
                                            </div>
                                        )}

                                        {/* File upload */}
                                        {mode === 'file' && (
                                            <div className="space-y-3">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 transition-colors ${
                                                        file ? 'border-lime/30 bg-lime/5' : 'border-border hover:border-lime/20 hover:bg-white/[0.02]'
                                                    }`}
                                                >
                                                    {file ? (
                                                        <>
                                                            {file?.type.startsWith('image/') && <ImageIcon className="h-6 w-6 text-lime" />}
                                                            {file?.type.startsWith('video/') && <Video className="h-6 w-6 text-lime" />}
                                                            {!file?.type.startsWith('image/') && !file?.type.startsWith('video/') && <Upload className="h-6 w-6 text-lime" />}
                                                            <span className="text-sm text-lime font-medium max-w-xs truncate px-4">{file.name}</span>
                                                            <span className="text-xs text-lime/60">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-6 w-6 text-gray-500" />
                                                            <span className="text-sm text-gray-400">Click to upload image or video</span>
                                                            <span className="text-xs text-gray-600">PNG, JPG, GIF, WEBP, MP4, MOV — up to {MAX_FILE_MB} MB</span>
                                                        </>
                                                    )}
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*,video/*,.gif"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const picked = e.target.files?.[0] ?? null
                                                        if (!picked) return
                                                        if (picked.size > MAX_FILE_MB * 1024 * 1024) {
                                                            setError(`File must be under ${MAX_FILE_MB} MB`)
                                                            e.target.value = ''
                                                            return
                                                        }
                                                        setError(null)
                                                        setFile(picked)
                                                    }}
                                                />

                                                {/* Optional prompt */}
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1.5">
                                                        Prompt used <span className="text-gray-600">(optional)</span>
                                                    </label>
                                                    <textarea
                                                        value={promptValue}
                                                        onChange={(e) => setPromptValue(e.target.value)}
                                                        placeholder="What prompt did you use to generate this? e.g. 'Create a logo for a fintech startup…'"
                                                        rows={3}
                                                        className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white resize-none focus:outline-none focus:border-lime/50 transition-colors placeholder:text-gray-600"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Text input */}
                                        {mode === 'text' && (
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1.5">Your response</label>
                                                <textarea
                                                    value={textValue}
                                                    onChange={(e) => setTextValue(e.target.value)}
                                                    placeholder="Write your answer here…"
                                                    rows={6}
                                                    className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white resize-none focus:outline-none focus:border-lime/50 transition-colors placeholder:text-gray-600"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {error && (
                                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.03] shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold gradient-lime text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                                        {isSubmitting ? 'Submitting…' : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            </AnimatePresence>
        </Portal>
    )
}
