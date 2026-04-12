import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GraduationCap } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { ProgramModal } from '@/components/admin/programs/ProgramModal';
import { formatDateLabel } from '@/lib/time';
import type { Cohort, CohortStatus, OfferingType } from '@/types/database';
import { SelectionActionBar } from '@/components/admin/shared/SelectionActionBar';
import { BulkDeleteConfirm } from '@/components/admin/shared/BulkDeleteConfirm';

type OfferingFilter = 'all' | OfferingType;
type StatusFilter = 'all' | CohortStatus;

const offeringLabels: Record<OfferingType, string> = {
    sprint_workshop: 'Sprint Workshop',
    master_class: 'Master Class',
};

const filterBoxClass = 'bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-4 flex flex-wrap gap-4';
const selectClass = 'w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white text-sm focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all';

export function ProgramsPage() {
    const supabase = useSupabase();
    const navigate = useNavigate();
    const [programs, setPrograms] = useState<Cohort[]>([]);
    const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<Cohort | null>(null);
    const [offeringFilter, setOfferingFilter] = useState<OfferingFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const fetchPrograms = async () => {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('cohorts')
            .select('*')
            .order('start_date', { ascending: false });

        if (fetchError) { setError(fetchError.message); setPrograms([]); setSessionCounts({}); setIsLoading(false); return; }

        const cohortRows = (data as Cohort[]) ?? [];
        setPrograms(cohortRows);

        if (cohortRows.length === 0) { setSessionCounts({}); setIsLoading(false); return; }

        const { data: sessionsData } = await supabase
            .from('sessions')
            .select('id, cohort_id')
            .in('cohort_id', cohortRows.map((c) => c.id));

        const counts: Record<string, number> = {};
        (sessionsData as { id: string; cohort_id: string }[] | null)?.forEach((s) => {
            counts[s.cohort_id] = (counts[s.cohort_id] || 0) + 1;
        });
        setSessionCounts(counts);
        setIsLoading(false);
    };

    useEffect(() => { fetchPrograms(); }, []);

    const filteredPrograms = useMemo(() => programs.filter((p) => {
        const offeringMatch = offeringFilter === 'all' || p.offering_type === offeringFilter;
        const statusMatch = statusFilter === 'all' || p.status === statusFilter;
        return offeringMatch && statusMatch;
    }), [programs, offeringFilter, statusFilter]);

    const columns = useMemo(() => [
        { header: 'Program Name', accessor: 'name' as keyof Cohort, className: 'font-medium text-white' },
        { header: 'Offering', accessor: (p: Cohort) => offeringLabels[p.offering_type] ?? 'Program' },
        {
            header: 'Status',
            accessor: (p: Cohort) => {
                const statusClass: Record<CohortStatus, string> = {
                    upcoming: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                    active: 'bg-lime/10 text-lime border-lime/30',
                    completed: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
                };
                return <span className={`px-2 py-1 text-xs rounded-lg border ${statusClass[p.status]}`}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>;
            },
        },
        {
            header: 'Dates',
            accessor: (p: Cohort) => (
                <span className="text-gray-400 text-sm">{formatDateLabel(p.start_date) || 'TBD'} → {formatDateLabel(p.end_date) || 'TBD'}</span>
            ),
        },
        { header: 'Sessions', accessor: (p: Cohort) => <span className="text-gray-300 text-sm">{sessionCounts[p.id] || 0}</span> },
        {
            header: '',
            accessor: (p: Cohort) => (
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/programs/${p.id}`); }}
                    className="text-lime hover:text-lime/80 text-sm font-medium"
                >
                    Open →
                </button>
            ),
        },
    ], [sessionCounts, navigate]);

    const handleDelete = async (program: Cohort) => {
        if (!confirm(`Delete ${program.name}? This will remove all associated sessions.`)) return;
        const { error: deleteError } = await supabase.from('cohorts').delete().eq('id', program.id);
        if (deleteError) { setError(deleteError.message); return; }
        fetchPrograms();
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        const { error: deleteError } = await supabase.from('cohorts').delete().in('id', selectedIds);
        setIsBulkDeleting(false);
        if (deleteError) { setError(deleteError.message); return; }
        setShowBulkDeleteConfirm(false);
        setSelectedIds([]);
        fetchPrograms();
    };

    const handleBulkEdit = () => {
        const item = filteredPrograms.find((p) => p.id === selectedIds[0]);
        if (item) { setSelectedProgram(item); setIsModalOpen(true); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-9 w-9 rounded-xl bg-lime/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-lime" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Programs</h1>
                    </div>
                    <p className="text-gray-400 text-sm pl-12">Manage Sprint Workshops and Master Classes</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <SelectionActionBar
                            selectedCount={selectedIds.length}
                            onEdit={handleBulkEdit}
                            onDelete={() => setShowBulkDeleteConfirm(true)}
                        />
                    )}
                    <button
                        onClick={() => { setSelectedProgram(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl transition font-medium hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        New Program
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={filterBoxClass}>
                <div className="min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Offering Type</label>
                    <select value={offeringFilter} onChange={(e) => setOfferingFilter(e.target.value as OfferingFilter)} className={selectClass}>
                        <option value="all">All Offerings</option>
                        <option value="sprint_workshop">Sprint Workshop</option>
                        <option value="master_class">Master Class</option>
                    </select>
                </div>
                <div className="min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
                        <option value="all">All Statuses</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <AdminTable
                data={filteredPrograms}
                columns={columns}
                isLoading={isLoading}
                onEdit={(p) => { setSelectedProgram(p); setIsModalOpen(true); }}
                onDelete={handleDelete}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
            />

            <ProgramModal
                key={isModalOpen ? (selectedProgram?.id ?? 'new') : 'closed'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                program={selectedProgram}
                onSuccess={() => { setIsModalOpen(false); setSelectedProgram(null); fetchPrograms(); }}
            />

            <BulkDeleteConfirm
                isOpen={showBulkDeleteConfirm}
                count={selectedIds.length}
                isLoading={isBulkDeleting}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
            />
        </div>
    );
}
