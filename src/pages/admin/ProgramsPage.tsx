import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { ProgramModal } from '@/components/admin/programs/ProgramModal';
import { formatDateLabel } from '@/lib/time';
import type { Cohort, CohortStatus, OfferingType } from '@/types/database';

type OfferingFilter = 'all' | OfferingType;
type StatusFilter = 'all' | CohortStatus;

const offeringLabels: Record<OfferingType, string> = {
    sprint_workshop: 'Sprint Workshop',
    master_class: 'Master Class',
};

export function ProgramsPage() {
    const supabase = useSupabase();
    const [programs, setPrograms] = useState<Cohort[]>([]);
    const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<Cohort | null>(null);
    const [offeringFilter, setOfferingFilter] = useState<OfferingFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const fetchPrograms = async () => {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('cohorts')
            .select('*')
            .order('start_date', { ascending: false });

        if (fetchError) {
            setError(fetchError.message);
            setPrograms([]);
            setSessionCounts({});
            setIsLoading(false);
            return;
        }

        const cohortRows = (data as Cohort[]) ?? [];
        setPrograms(cohortRows);

        if (cohortRows.length === 0) {
            setSessionCounts({});
            setIsLoading(false);
            return;
        }

        const cohortIds = cohortRows.map((cohort) => cohort.id);
        const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, cohort_id')
            .in('cohort_id', cohortIds);

        if (sessionsError) {
            setError(sessionsError.message);
            setSessionCounts({});
            setIsLoading(false);
            return;
        }

        const counts: Record<string, number> = {};
        (sessionsData as { id: string; cohort_id: string }[] | null)?.forEach((session) => {
            counts[session.cohort_id] = (counts[session.cohort_id] || 0) + 1;
        });
        setSessionCounts(counts);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const filteredPrograms = useMemo(() => {
        return programs.filter((program) => {
            const offeringMatch = offeringFilter === 'all' || program.offering_type === offeringFilter;
            const statusMatch = statusFilter === 'all' || program.status === statusFilter;
            return offeringMatch && statusMatch;
        });
    }, [programs, offeringFilter, statusFilter]);

    const columns = useMemo(() => [
        {
            header: 'Program Name',
            accessor: 'name' as keyof Cohort,
            className: 'font-medium text-white',
        },
        {
            header: 'Offering',
            accessor: (program: Cohort) => offeringLabels[program.offering_type] ?? 'Program',
        },
        {
            header: 'Status',
            accessor: (program: Cohort) => {
                const statusLabel = program.status.charAt(0).toUpperCase() + program.status.slice(1);
                const statusClass: Record<CohortStatus, string> = {
                    upcoming: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                    active: 'bg-lime/10 text-lime border-lime/30',
                    completed: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
                };

                return (
                    <span className={`px-2 py-1 text-xs rounded-lg border ${statusClass[program.status]}`}>
                        {statusLabel}
                    </span>
                );
            },
        },
        {
            header: 'Dates',
            accessor: (program: Cohort) => {
                const startLabel = formatDateLabel(program.start_date) || 'TBD';
                const endLabel = formatDateLabel(program.end_date) || 'TBD';
                return (
                    <span className="text-gray-400 text-sm">{startLabel} → {endLabel}</span>
                );
            },
        },
        {
            header: 'Sessions',
            accessor: (program: Cohort) => (
                <span className="text-gray-300 text-sm">{sessionCounts[program.id] || 0}</span>
            ),
        },
        {
            header: 'Manage',
            accessor: (program: Cohort) => (
                <Link
                    to={`/admin/programs/${program.id}/sessions`}
                    className="text-dashboard-accent hover:text-dashboard-accent-bright text-sm font-medium"
                >
                    Sessions
                </Link>
            ),
        },
    ], [sessionCounts]);

    const handleDelete = async (program: Cohort) => {
        if (!confirm(`Delete ${program.name}? This will remove all associated sessions.`)) return;

        const { error: deleteError } = await supabase
            .from('cohorts')
            .delete()
            .eq('id', program.id);

        if (deleteError) {
            setError(deleteError.message);
            return;
        }

        fetchPrograms();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Programs</h1>
                    <p className="text-gray-400 mt-1">Manage Sprint Workshops and Master Classes</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedProgram(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-white rounded-lg transition-colors font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add Program
                </button>
            </div>

            <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4 flex flex-wrap gap-4">
                <div className="min-w-[220px]">
                    <label className="block text-xs text-gray-400 mb-1">Offering Type</label>
                    <select
                        value={offeringFilter}
                        onChange={(e) => setOfferingFilter(e.target.value as OfferingFilter)}
                        className="w-full px-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        <option value="all">All Offerings</option>
                        <option value="sprint_workshop">Sprint Workshop</option>
                        <option value="master_class">Master Class</option>
                    </select>
                </div>
                <div className="min-w-[220px]">
                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="w-full px-3 py-2 bg-dashboard-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        <option value="all">All Statuses</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <AdminTable
                data={filteredPrograms}
                columns={columns}
                isLoading={isLoading}
                onEdit={(program) => {
                    setSelectedProgram(program);
                    setIsModalOpen(true);
                }}
                onDelete={handleDelete}
            />

            <ProgramModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                program={selectedProgram}
                onSuccess={() => {
                    setIsModalOpen(false);
                    setSelectedProgram(null);
                    fetchPrograms();
                }}
            />
        </div>
    );
}
