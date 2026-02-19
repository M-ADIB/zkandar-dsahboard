import { useEffect, useMemo, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { ModalForm } from '@/components/admin/shared/ModalForm'
import type { Assignment, Cohort, Session, SubmissionFormat } from '@/types/database'

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
        submission_format: 'file',
    })
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
            setError(null)
            return
        }

        setFormData({
            title: '',
            description: '',
            session_id: defaultSessionId ?? sessions[0]?.id ?? '',
            due_date: '',
            submission_format: 'file',
        })
        setError(null)
    }, [assignment, defaultSessionId, sessions, isOpen])

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

        setIsLoading(true)
        setError(null)

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            session_id: formData.session_id,
            due_date: new Date(formData.due_date).toISOString(),
            submission_format: formData.submission_format,
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Assignment Title</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. Workflow audit"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Session</label>
                <select
                    value={formData.session_id}
                    onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input
                    type="datetime-local"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Submission Format</label>
                <select
                    value={formData.submission_format}
                    onChange={(e) => setFormData({ ...formData, submission_format: e.target.value as SubmissionFormat })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                >
                    <option value="file">File upload</option>
                    <option value="link">Link</option>
                    <option value="text">Text</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    rows={4}
                    placeholder="Add context or instructions for participants."
                />
            </div>
        </ModalForm>
    )
}
