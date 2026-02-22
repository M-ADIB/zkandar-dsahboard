import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { SessionModal } from '@/components/admin/programs/SessionModal';
import { formatDateLabel, formatTimeLabel } from '@/lib/time';
import type { Cohort, Session, SessionStatus } from '@/types/database';

const statusLabels: Record<SessionStatus, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
};

export function ProgramSessionsPage() {
    const { programId } = useParams();
    const supabase = useSupabase();
    const [program, setProgram] = useState<Cohort | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const fetchData = async (cohortId: string) => {
        setIsLoading(true);
        setError(null);

        const { data: cohortData, error: cohortError } = await supabase
            .from('cohorts')
            .select('*')
            .eq('id', cohortId)
            .single();

        if (cohortError) {
            setError(cohortError.message);
            setProgram(null);
            setSessions([]);
            setIsLoading(false);
            return;
        }

        const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .eq('cohort_id', cohortId)
            .order('session_number', { ascending: true });

        if (sessionsError) {
            setError(sessionsError.message);
            setProgram(cohortData as Cohort);
            setSessions([]);
            setIsLoading(false);
            return;
        }

        setProgram(cohortData as Cohort);
        setSessions((sessionsData as Session[]) ?? []);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!programId) {
            setError('Program not found.');
            setIsLoading(false);
            return;
        }

        fetchData(programId);
    }, [programId]);

    const nextSessionNumber = useMemo(() => {
        if (sessions.length === 0) return 1;
        return Math.max(...sessions.map((session) => session.session_number || 0)) + 1;
    }, [sessions]);

    const columns = useMemo(() => [
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
                const dateLabel = formatDateLabel(session.scheduled_date) || 'TBD';
                const timeLabel = formatTimeLabel(session.scheduled_date) || '';
                return (
                    <span className="text-gray-400 text-sm">{dateLabel} {timeLabel}</span>
                );
            },
        },
        {
            header: 'Status',
            accessor: (session: Session) => {
                const statusClass: Record<SessionStatus, string> = {
                    scheduled: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                    completed: 'bg-lime/10 text-lime border-lime/30',
                };
                return (
                    <span className={`px-2 py-1 text-xs rounded-lg border ${statusClass[session.status]}`}>
                        {statusLabels[session.status]}
                    </span>
                );
            },
        },
    ], []);

    const handleDelete = async (session: Session) => {
        if (!confirm(`Delete ${session.title}?`)) return;

        const { error: deleteError } = await supabase
            .from('sessions')
            .delete()
            .eq('id', session.id);

        if (deleteError) {
            setError(deleteError.message);
            return;
        }

        if (programId) {
            fetchData(programId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Link
                        to="/admin/programs"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Programs
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-2">Sessions</h1>
                    <p className="text-gray-400 mt-1">
                        {program ? program.name : 'Program'}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedSession(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-black rounded-lg transition-colors font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add Session
                </button>
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
                    setSelectedSession(session);
                    setIsModalOpen(true);
                }}
                onDelete={handleDelete}
            />

            {programId && (
                <SessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedSession(null);
                        fetchData(programId);
                    }}
                    cohortId={programId}
                    session={selectedSession}
                    defaultSessionNumber={nextSessionNumber}
                />
            )}
        </div>
    );
}
