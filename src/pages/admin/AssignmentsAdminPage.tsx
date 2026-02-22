import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { AdminTable } from '@/components/admin/shared/AdminTable'
import { AssignmentModal } from '@/components/admin/assignments/AssignmentModal'
import { SubmissionsModal } from '@/components/admin/assignments/SubmissionsModal'
import { formatDateLabel, formatTimeLabel } from '@/lib/time'
import type { Assignment, Cohort, Session } from '@/types/database'

export function AssignmentsAdminPage() {
    const supabase = useSupabase()
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [programs, setPrograms] = useState<Cohort[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
    const [selectedSessionId, setSelectedSessionId] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
    const [submissionsAssignment, setSubmissionsAssignment] = useState<Assignment | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)

        const [assignmentsResult, sessionsResult, programsResult] = await Promise.all([
            supabase.from('assignments').select('id, session_id, title, description, due_date, submission_format, created_at').order('due_date', { ascending: false }),
            supabase.from('sessions').select('id, cohort_id, title, session_number').order('session_number', { ascending: true }),
            supabase.from('cohorts').select('id, name, start_date, end_date, status, offering_type, created_at').order('start_date', { ascending: false }),
        ])

        const errors = [assignmentsResult.error, sessionsResult.error, programsResult.error].filter(Boolean)
        if (errors.length > 0) {
            setError(errors[0]?.message ?? 'Failed to load assignments')
            setAssignments([])
            setSessions([])
            setPrograms([])
            setIsLoading(false)
            return
        }

        setAssignments((assignmentsResult.data as Assignment[]) ?? [])
        setSessions((sessionsResult.data as Session[]) ?? [])
        setPrograms((programsResult.data as Cohort[]) ?? [])
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const programMap = useMemo(() => new Map(programs.map((program) => [program.id, program])), [programs])
    const sessionMap = useMemo(() => new Map(sessions.map((session) => [session.id, session])), [sessions])

    const sessionsForProgram = useMemo(() => {
        if (selectedProgramId === 'all') return sessions
        return sessions.filter((session) => session.cohort_id === selectedProgramId)
    }, [sessions, selectedProgramId])

    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            const session = sessionMap.get(assignment.session_id)
            if (!session) return false
            if (selectedProgramId !== 'all' && session.cohort_id !== selectedProgramId) return false
            if (selectedSessionId !== 'all' && assignment.session_id !== selectedSessionId) return false
            return true
        })
    }, [assignments, selectedProgramId, selectedSessionId, sessionMap])

    const columns = useMemo(() => [
        {
            header: 'Assignment',
            accessor: (assignment: Assignment) => (
                <span className="font-medium text-white">{assignment.title}</span>
            ),
        },
        {
            header: 'Program',
            accessor: (assignment: Assignment) => {
                const session = sessionMap.get(assignment.session_id)
                return session ? (programMap.get(session.cohort_id)?.name ?? 'Program') : 'Program'
            },
        },
        {
            header: 'Session',
            accessor: (assignment: Assignment) => {
                const session = sessionMap.get(assignment.session_id)
                if (!session) return 'Session'
                const sessionNumber = session.session_number ?? '—'
                return `Session ${sessionNumber}: ${session.title}`
            },
        },
        {
            header: 'Due',
            accessor: (assignment: Assignment) => {
                const dateLabel = formatDateLabel(assignment.due_date) || 'TBD'
                const timeLabel = formatTimeLabel(assignment.due_date) || ''
                return <span className="text-gray-400 text-sm">{dateLabel} {timeLabel}</span>
            },
        },
        {
            header: 'Format',
            accessor: (assignment: Assignment) => assignment.submission_format.toUpperCase(),
        },
        {
            header: 'Submissions',
            accessor: (assignment: Assignment) => (
                <button
                    onClick={() => setSubmissionsAssignment(assignment)}
                    className="text-sm text-lime hover:underline"
                >
                    View
                </button>
            ),
        },
    ], [programMap, sessionMap])

    const handleDelete = async (assignment: Assignment) => {
        if (!confirm(`Delete ${assignment.title}?`)) return

        const { error: deleteError } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignment.id)

        if (deleteError) {
            setError(deleteError.message)
            return
        }

        fetchData()
    }

    const defaultSessionId = selectedSessionId !== 'all'
        ? selectedSessionId
        : sessionsForProgram[0]?.id

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Assignments</h1>
                    <p className="text-gray-400 mt-1">Create and review program assignments</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedAssignment(null)
                        setIsModalOpen(true)
                    }}
                    disabled={sessions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-black rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-5 w-5" />
                    Add Assignment
                </button>
            </div>

            <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4 flex flex-wrap gap-4">
                <div className="min-w-[220px]">
                    <label className="block text-xs text-gray-400 mb-1">Program</label>
                    <select
                        value={selectedProgramId}
                        onChange={(e) => {
                            setSelectedProgramId(e.target.value)
                            setSelectedSessionId('all')
                        }}
                        className="w-full px-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        <option value="all">All Programs</option>
                        {programs.map((program) => (
                            <option key={program.id} value={program.id}>{program.name}</option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[220px]">
                    <label className="block text-xs text-gray-400 mb-1">Session</label>
                    <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-full px-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        <option value="all">All Sessions</option>
                        {sessionsForProgram.map((session) => (
                            <option key={session.id} value={session.id}>
                                Session {session.session_number}: {session.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <AdminTable
                data={filteredAssignments}
                columns={columns}
                isLoading={isLoading}
                onEdit={(assignment) => {
                    setSelectedAssignment(assignment)
                    setIsModalOpen(true)
                }}
                onDelete={handleDelete}
            />

            <AssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false)
                    setSelectedAssignment(null)
                    fetchData()
                }}
                assignment={selectedAssignment}
                sessions={sessions}
                programs={programs}
                defaultSessionId={defaultSessionId}
            />

            <SubmissionsModal
                isOpen={Boolean(submissionsAssignment)}
                onClose={() => setSubmissionsAssignment(null)}
                assignment={submissionsAssignment}
            />
        </div>
    )
}
