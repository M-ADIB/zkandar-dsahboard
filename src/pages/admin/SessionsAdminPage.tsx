import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { AdminTable } from '@/components/admin/shared/AdminTable'
import { SessionModal } from '@/components/admin/programs/SessionModal'
import { formatDateLabel, formatTimeLabel } from '@/lib/time'
import type { Cohort, Session, SessionStatus } from '@/types/database'

const statusLabels: Record<SessionStatus, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
}

export function SessionsAdminPage() {
    const supabase = useSupabase()
    const [programs, setPrograms] = useState<Cohort[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [selectedProgramId, setSelectedProgramId] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)

    const fetchPrograms = async () => {
        const { data, error: programsError } = await supabase
            .from('cohorts')
            .select('id, name, start_date, end_date, status, offering_type, created_at')
            .order('start_date', { ascending: false })

        if (programsError) {
            setError(programsError.message)
            setPrograms([])
            return
        }

        setPrograms((data as Cohort[]) ?? [])
    }

    const fetchSessions = async (programId: string) => {
        setIsLoading(true)
        setError(null)

        const baseQuery = supabase
            .from('sessions')
            .select('id, cohort_id, session_number, title, scheduled_date, status, created_at')

        const { data, error: sessionsError } = programId === 'all'
            ? await baseQuery.order('scheduled_date', { ascending: true })
            : await baseQuery.eq('cohort_id', programId).order('session_number', { ascending: true })

        if (!sessionsError) {
            setSessions((data as Session[]) ?? [])
            setIsLoading(false)
            return
        }

        const missingScheduledDate = sessionsError.message.includes('scheduled_date')
        const missingCohortId = sessionsError.message.includes('cohort_id')

        if (missingScheduledDate || missingCohortId) {
            const fallbackSelect = missingCohortId
                ? 'id, session_number, title, status, created_at'
                : 'id, cohort_id, session_number, title, status, created_at'

            const fallbackQuery = supabase
                .from('sessions')
                .select(fallbackSelect)

            const shouldFilterByProgram = programId !== 'all' && !missingCohortId
            const fallback = shouldFilterByProgram
                ? await fallbackQuery.eq('cohort_id', programId).order('session_number', { ascending: true })
                : await fallbackQuery.order('created_at', { ascending: true })

            if (fallback.error) {
                setError(fallback.error.message)
                setSessions([])
                setIsLoading(false)
                return
            }

            setSessions((fallback.data as Session[]) ?? [])
            setIsLoading(false)
            return
        }

        setError(sessionsError.message)
        setSessions([])
        setIsLoading(false)
    }

    useEffect(() => {
        fetchPrograms()
    }, [])

    useEffect(() => {
        fetchSessions(selectedProgramId)
    }, [selectedProgramId])

    const programMap = useMemo(() => new Map(programs.map((program) => [program.id, program])), [programs])

    const nextSessionNumber = useMemo(() => {
        if (selectedProgramId === 'all') return 1
        const programSessions = sessions.filter((session) => session.cohort_id === selectedProgramId)
        if (programSessions.length === 0) return 1
        return Math.max(...programSessions.map((session) => session.session_number || 0)) + 1
    }, [sessions, selectedProgramId])

    const columns = useMemo(() => [
        {
            header: 'Program',
            accessor: (session: Session) => programMap.get(session.cohort_id)?.name ?? 'Unassigned',
        },
        {
            header: '#',
            accessor: (session: Session) => session.session_number,
            className: 'font-medium text-white',
        },
        {
            header: 'Title',
            accessor: 'title' as keyof Session,
        },
        {
            header: 'Scheduled',
            accessor: (session: Session) => {
                const dateValue = session.scheduled_date ?? session.created_at
                const dateLabel = dateValue ? formatDateLabel(dateValue) : 'TBD'
                const timeLabel = dateValue ? formatTimeLabel(dateValue) : ''
                return <span className="text-gray-400 text-sm">{dateLabel} {timeLabel}</span>
            },
        },
        {
            header: 'Status',
            accessor: (session: Session) => {
                const statusClass: Record<SessionStatus, string> = {
                    scheduled: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                    completed: 'bg-lime/10 text-lime border-lime/30',
                }
                return (
                    <span className={`px-2 py-1 text-xs rounded-lg border ${statusClass[session.status]}`}>
                        {statusLabels[session.status]}
                    </span>
                )
            },
        },
    ], [programMap])

    const handleDelete = async (session: Session) => {
        if (!confirm(`Delete ${session.title}?`)) return

        const { error: deleteError } = await supabase
            .from('sessions')
            .delete()
            .eq('id', session.id)

        if (deleteError) {
            setError(deleteError.message)
            return
        }

        fetchSessions(selectedProgramId)
    }

    const selectedProgramLabel = selectedProgramId === 'all'
        ? 'All Programs'
        : programMap.get(selectedProgramId)?.name ?? 'Program'

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sessions</h1>
                    <p className="text-gray-400 mt-1">Manage upcoming and completed sessions</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedSession(null)
                        setIsModalOpen(true)
                    }}
                    disabled={selectedProgramId === 'all'}
                    className="flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-black rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-5 w-5" />
                    Add Session
                </button>
            </div>

            <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4 flex flex-wrap gap-4">
                <div className="min-w-[220px]">
                    <label className="block text-xs text-gray-400 mb-1">Program</label>
                    <select
                        value={selectedProgramId}
                        onChange={(e) => setSelectedProgramId(e.target.value)}
                        className="w-full px-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        <option value="all">All Programs</option>
                        {programs.map((program) => (
                            <option key={program.id} value={program.id}>{program.name}</option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[220px] flex items-center text-xs text-gray-400">
                    {selectedProgramLabel}
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <AdminTable
                data={sessions}
                columns={columns}
                isLoading={isLoading}
                onEdit={(session) => {
                    setSelectedSession(session)
                    setIsModalOpen(true)
                }}
                onDelete={handleDelete}
            />

            {selectedProgramId !== 'all' && (
                <SessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false)
                        setSelectedSession(null)
                        fetchSessions(selectedProgramId)
                    }}
                    cohortId={selectedSession?.cohort_id ?? selectedProgramId}
                    session={selectedSession}
                    defaultSessionNumber={nextSessionNumber}
                />
            )}
        </div>
    )
}
