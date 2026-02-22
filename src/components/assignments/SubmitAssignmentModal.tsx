import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Link as LinkIcon, Upload, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SubmissionFormat } from '@/types/database'

interface AssignmentInfo {
    id: string
    title: string
    session: string
    submissionFormat: SubmissionFormat
}

interface SubmitAssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    assignment: AssignmentInfo | null
    userId: string
}

type Mode = 'text' | 'link' | 'file'

function modeForFormat(format: SubmissionFormat): Mode {
    if (format === 'text') return 'text'
    if (format === 'link') return 'link'
    if (format === 'file') return 'file'
    return 'text'
}

export function SubmitAssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    assignment,
    userId,
}: SubmitAssignmentModalProps) {
    const [textValue, setTextValue] = useState('')
    const [linkValue, setLinkValue] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [mode, setMode] = useState<Mode>(() =>
        assignment ? modeForFormat(assignment.submissionFormat) : 'text'
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isAny = assignment?.submissionFormat === ('any' as SubmissionFormat)

    const reset = () => {
        setTextValue('')
        setLinkValue('')
        setFile(null)
        setMode(assignment ? modeForFormat(assignment.submissionFormat) : 'text')
        setError(null)
        setDone(false)
        setIsSubmitting(false)
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    const handleSuccess = () => {
        setDone(true)
        setTimeout(() => {
            reset()
            onSuccess()
        }, 1200)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assignment) return

        setIsSubmitting(true)
        setError(null)

        type ContentShape = { text?: string; link?: string; file_url?: string }
        const content: ContentShape = {}

        // Handle file upload
        if (mode === 'file') {
            if (!file) {
                setError('Please select a file to upload.')
                setIsSubmitting(false)
                return
            }
            const ext = file.name.split('.').pop()
            const path = `${userId}/${assignment.id}/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from('submissions')
                .upload(path, file, { upsert: false })

            if (uploadError) {
                setError(`File upload failed: ${uploadError.message}`)
                setIsSubmitting(false)
                return
            }

            const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(path)
            content.file_url = urlData.publicUrl
        } else if (mode === 'link') {
            if (!linkValue.trim()) {
                setError('Please enter a URL.')
                setIsSubmitting(false)
                return
            }
            content.link = linkValue.trim()
        } else {
            if (!textValue.trim()) {
                setError('Please enter your submission.')
                setIsSubmitting(false)
                return
            }
            content.text = textValue.trim()
        }

        const { error: insertError } = await supabase
            .from('submissions')
            // @ts-expect-error - Supabase insert type inference
            .insert({
                assignment_id: assignment.id,
                user_id: userId,
                content,
                status: 'pending',
            })

        if (insertError) {
            setError(insertError.message)
            setIsSubmitting(false)
            return
        }

        handleSuccess()
    }

    if (!isOpen || !assignment) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.97 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                    className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-bg-elevated border border-border shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
                        <div>
                            <h2 className="text-base font-semibold text-white">Submit Assignment</h2>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{assignment.session}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="shrink-0 p-1.5 -mr-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {done ? (
                        <div className="flex flex-col items-center gap-3 px-6 py-12">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 15 }}
                                className="h-14 w-14 rounded-full bg-lime/10 flex items-center justify-center"
                            >
                                <CheckCircle2 className="h-7 w-7 text-lime" />
                            </motion.div>
                            <p className="text-sm font-medium text-white">Submitted!</p>
                            <p className="text-xs text-gray-500">Your work has been submitted for review.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <h3 className="text-sm font-medium text-white mb-0.5">{assignment.title}</h3>
                            </div>

                            {/* Mode toggle for 'any' format */}
                            {isAny && (
                                <div className="flex items-center gap-2 p-1 rounded-xl bg-bg-card border border-border w-fit">
                                    {(['text', 'link', 'file'] as Mode[]).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMode(m)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === m
                                                ? 'bg-bg-elevated text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            {m === 'text' && <FileText className="h-3.5 w-3.5" />}
                                            {m === 'link' && <LinkIcon className="h-3.5 w-3.5" />}
                                            {m === 'file' && <Upload className="h-3.5 w-3.5" />}
                                            {m.charAt(0).toUpperCase() + m.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Text input */}
                            {mode === 'text' && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">
                                        Your response
                                    </label>
                                    <textarea
                                        value={textValue}
                                        onChange={(e) => setTextValue(e.target.value)}
                                        placeholder="Write your answer here..."
                                        rows={6}
                                        className="w-full px-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white resize-none focus:outline-none focus:border-lime/50 transition-colors placeholder:text-gray-600"
                                    />
                                </div>
                            )}

                            {/* Link input */}
                            {mode === 'link' && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">
                                        Submission URL
                                    </label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            type="url"
                                            value={linkValue}
                                            onChange={(e) => setLinkValue(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full pl-9 pr-3 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-white focus:outline-none focus:border-lime/50 transition-colors placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* File input */}
                            {mode === 'file' && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5">
                                        Upload file
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 transition-colors ${file
                                            ? 'border-lime/30 bg-lime/5'
                                            : 'border-border hover:border-lime/20 hover:bg-white/2'
                                            }`}
                                    >
                                        <Upload className={`h-6 w-6 ${file ? 'text-lime' : 'text-gray-500'}`} />
                                        {file ? (
                                            <span className="text-sm text-lime font-medium">{file.name}</span>
                                        ) : (
                                            <>
                                                <span className="text-sm text-gray-400">Click to choose a file</span>
                                                <span className="text-xs text-gray-600">PDF, DOCX, PNG, JPG, MP4 etc.</span>
                                            </>
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl text-sm font-medium gradient-lime text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
