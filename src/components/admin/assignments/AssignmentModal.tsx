import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { ModalForm } from '@/components/admin/shared/ModalForm'
import type { Assignment, Cohort, Session, SubmissionFormat, SessionMaterial } from '@/types/database'

interface AssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    assignment?: Assignment | null
    sessions: Session[]
    programs: Cohort[]
    defaultSessionId?: string
}

type AssignmentFormData = {
    title: string
    description: string
    session_id: string
    due_date: string
    submission_format: SubmissionFormat
}

type MaterialDraft = {
    name: string
    url: string
    type: SessionMaterial['type']
}

const emptyMaterial = (): MaterialDraft => ({ name: '', url: '', type: 'link' })

const toDateTimeLocal = (isoDate: string | null) => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return ''
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function AssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    assignment,
    sessions,
    programs,
    defaultSessionId,
}: AssignmentModalProps) {
    const supabase = useSupabase()
    const [formData, setFormData] = useState<AssignmentFormData>({
        title: '',
        description: '',
        session_id: defaultSessionId ?? '',
        due_date: '',
        submission_format: 'any',
    })
    const [materials, setMaterials] = useState<MaterialDraft[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const programMap = useMemo(() => new Map(programs.map((program) => [program.id, program])), [programs])

    useEffect(() => {
        if (assignment) {
            setFormData({
                title: assignment.title,
                description: assignment.description ?? '',
                session_id: assignment.session_id,
                due_date: toDateTimeLocal(assignment.due_date),
                submission_format: assignment.submission_format,
            })
            const existing = Array.isArray((assignment as any).materials) ? (assignment as any).materials : []
            setMaterials(existing.map((m: any) => ({ name: m.name, url: m.url, type: m.type })))
            setError(null)
            return
        }

        setFormData({
            title: '',
            description: '',
            session_id: defaultSessionId ?? sessions[0]?.id ?? '',
            due_date: '',
            submission_format: 'any',
        })
        setMaterials([])
        setError(null)
    }, [assignment, defaultSessionId, sessions, isOpen])

    const addMaterial = () => setMaterials((prev) => [...prev, emptyMaterial()])

    const updateMaterial = (index: number, patch: Partial<MaterialDraft>) => {
        setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
    }

    const removeMaterial = (index: number) => {
        setMaterials((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            setError('Assignment title is required.')
            return
        }

        if (!formData.session_id) {
            setError('Session is required.')
            return
        }

        if (!formData.due_date) {
            setError('Due date is required.')
            return
        }

        const validatedMaterials = materials.filter((m) => m.name.trim() && m.url.trim())

        setIsLoading(true)
        setError(null)

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            session_id: formData.session_id,
            due_date: new Date(formData.due_date).toISOString(),
            submission_format: formData.submission_format,
            materials: validatedMaterials,
        }

        const { error: saveError } = assignment
            ? await supabase.from('assignments')
                // @ts-expect-error - Supabase update type inference issue
                .update(payload)
                .eq('id', assignment.id)
            : await supabase.from('assignments')
                // @ts-expect-error - Supabase insert type inference issue
                .insert(payload)

        setIsLoading(false)

        if (saveError) {
            setError(saveError.message)
            return
        }

        onSuccess()
    }

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={assignment ? 'Edit Assignment' : 'Add Assignment'}
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assignment Title <span className="text-red-400">*</span></label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    placeholder="e.g. Workflow audit"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Session <span className="text-red-400">*</span></label>
                    <select
                        value={formData.session_id}
                        onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    >
                        <option value="">Select a session</option>
                        {sessions.map((session) => {
                            const programLabel = programMap.get(session.cohort_id)?.name
                            const sessionNumber = session.session_number ?? '—'
                            return (
                                <option key={session.id} value={session.id}>
                                    {programLabel ? `${programLabel} · ` : ''}Session {sessionNumber}: {session.title}
                                </option>
                            )
                        })}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Due Date <span className="text-red-400">*</span></label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Submission Format</label>
                <select
                    value={formData.submission_format}
                    onChange={(e) => setFormData({ ...formData, submission_format: e.target.value as SubmissionFormat })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                >
                    <option value="any">Any format</option>
                    <option value="file">File upload</option>
                    <option value="link">Link</option>
                    <option value="text">Text</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description / Instructions</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50 resize-none"
                    rows={4}
                    placeholder="Add context or instructions for participants."
                />
            </div>

            {/* Materials */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Reference Materials</label>
                    <button
                        type="button"
                        onClick={addMaterial}
                        className="flex items-center gap-1 text-xs text-lime hover:text-lime/80 transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add material
                    </button>
                </div>

                {materials.length === 0 ? (
                    <p className="text-xs text-gray-600 italic">No reference materials added.</p>
                ) : (
                    <div className="space-y-3">
                        {materials.map((mat, i) => (
                            <div key={i} className="flex gap-2 items-start">
                                <select
                                    value={mat.type}
                                    onChange={(e) => updateMaterial(i, { type: e.target.value as SessionMaterial['type'] })}
                                    className="px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-gray-300 focus:outline-none focus:border-lime/50 shrink-0"
                                >
                                    <option value="link">Link</option>
                                    <option value="pdf">PDF</option>
                                    <option value="video">Video</option>
                                    <option value="image">Image</option>
                                </select>
                                <input
                                    type="text"
                                    value={mat.name}
                                    onChange={(e) => updateMaterial(i, { name: e.target.value })}
                                    placeholder="Label"
                                    className="flex-1 min-w-0 px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-lime/50"
                                />
                                <input
                                    type="url"
                                    value={mat.url}
                                    onChange={(e) => updateMaterial(i, { url: e.target.value })}
                                    placeholder="https://..."
                                    className="flex-1 min-w-0 px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-lime/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeMaterial(i)}
                                    className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ModalForm>
    )
}
