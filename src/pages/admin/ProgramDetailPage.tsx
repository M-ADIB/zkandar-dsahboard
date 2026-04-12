import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Plus, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { SessionModal } from '@/components/admin/programs/SessionModal';
import { AssignmentModal } from '@/components/admin/assignments/AssignmentModal';
import { SubmissionsModal } from '@/components/admin/assignments/SubmissionsModal';
import { SelectionActionBar } from '@/components/admin/shared/SelectionActionBar';
import { BulkDeleteConfirm } from '@/components/admin/shared/BulkDeleteConfirm';
import { formatDateLabel, formatTimeLabel } from '@/lib/time';
import type { Assignment, Cohort, CohortStatus, OfferingType, Session, SessionStatus } from '@/types/database';

type DetailTab = 'sessions' | 'assignments';

const offeringLabels: Record<OfferingType, string> = {
    sprint_workshop: 'Sprint Workshop',
    master_class: 'Master Class',
};

const sessionStatusLabels: Record<SessionStatus, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
};

const selectClass = 'w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white text-sm focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all';

// ─── Sessions Panel ───────────────────────────────────────────────────────────
function SessionsPanel({ cohort, onRefreshCount }: { cohort: Cohort; onRefreshCount: () => void }) {
    const supabase = useSupabase();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const fetchSessions = async () => {
        setIsLoading(true);
        setError(null);
        const { data, error: e } = await supabase
            .from('sessions')
            .select('id, cohort_id, session_number, title, scheduled_date, status, recording_url, created_at')
            .eq('cohort_id', cohort.id)
            .order('session_number', { ascending: true });
        if (e) { setError(e.message); } else { setSessions((data as Session[]) ?? []); }
        setIsLoading(false);
    };

    useEffect(() => { fetchSessions(); }, [cohort.id]);

    const nextSessionNumber = useMemo(() => {
        if (sessions.length === 0) return 1;
        return Math.max(...sessions.map((s) => s.session_number || 0)) + 1;
    }, [sessions]);

    const columns = useMemo(() => [
        { header: '#', accessor: (s: Session) => <span className="font-medium text-white">{s.session_number}</span> },
        { header: 'Title', accessor: 'title' as keyof Session },
        {
            header: 'Scheduled',
            accessor: (s: Session) => {
                const d = s.scheduled_date ?? s.created_at;
                return <span className="text-gray-400 text-sm">{d ? formatDateLabel(d) : 'TBD'} {d ? formatTimeLabel(d) : ''}</span>;
            },
        },
        {
            header: 'Status',
            accessor: (s: Session) => {
                const cls: Record<SessionStatus, string> = {
                    scheduled: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                    completed: 'bg-lime/10 text-lime border-lime/30',
                };
                return <span className={`px-2 py-1 text-xs rounded-lg border ${cls[s.status]}`}>{sessionStatusLabels[s.status]}</span>;
            },
        },
        {
            header: 'Recording URL',
            accessor: (s: Session) => s.recording_url
                ? <span className="text-lime text-xs truncate max-w-[160px] block">Set</span>
                : <span className="text-gray-600 text-xs">—</span>,
        },
    ], []);

    const handleDelete = async (session: Session) => {
        if (!confirm(`Delete ${session.title}?`)) return;
        const { error: e } = await supabase.from('sessions').delete().eq('id', session.id);
        if (e) { setError(e.message); return; }
        fetchSessions();
        onRefreshCount();
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        const { error: e } = await supabase.from('sessions').delete().in('id', selectedIds);
        setIsBulkDeleting(false);
        if (e) { setError(e.message); return; }
        setShowBulkDeleteConfirm(false);
        setSelectedIds([]);
        fetchSessions();
        onRefreshCount();
    };

    const handleBulkEdit = () => {
        const item = sessions.find((s) => s.id === selectedIds[0]);
        if (item) { setSelectedSession(item); setIsModalOpen(true); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">{sessions.length} session{sessions.length !== 1 ? 's' : ''} in this program</p>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <SelectionActionBar
                            selectedCount={selectedIds.length}
                            onEdit={handleBulkEdit}
                            onDelete={() => setShowBulkDeleteConfirm(true)}
                        />
                    )}
                    <button
                        onClick={() => { setSelectedSession(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl font-medium hover:opacity-90 transition"
                    >
                        <Plus className="h-4 w-4" />
                        Add Session
                    </button>
                </div>
            </div>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <AdminTable
                data={sessions}
                columns={columns}
                isLoading={isLoading}
                onEdit={(s) => { setSelectedSession(s); setIsModalOpen(true); }}
                onDelete={handleDelete}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
            />

            <SessionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); setSelectedSession(null); fetchSessions(); onRefreshCount(); }}
                cohortId={cohort.id}
                session={selectedSession}
                defaultSessionNumber={nextSessionNumber}
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

// ─── Assignments Panel ────────────────────────────────────────────────────────
function AssignmentsPanel({ cohort }: { cohort: Cohort }) {
    const supabase = useSupabase();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissionsAssignment, setSubmissionsAssignment] = useState<Assignment | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        const { data: sessionData, error: se } = await supabase
            .from('sessions')
            .select('id, cohort_id, title, session_number')
            .eq('cohort_id', cohort.id)
            .order('session_number', { ascending: true });
        if (se) { setError(se.message); setIsLoading(false); return; }
        const cohortSessions = (sessionData as Session[]) ?? [];
        setSessions(cohortSessions);

        if (cohortSessions.length === 0) { setAssignments([]); setIsLoading(false); return; }

        const { data: assignmentData, error: ae } = await supabase
            .from('assignments')
            .select('id, session_id, title, description, due_date, submission_format, created_at')
            .in('session_id', cohortSessions.map((s) => s.id))
            .order('due_date', { ascending: false });
        if (ae) { setError(ae.message); setIsLoading(false); return; }
        setAssignments((assignmentData as Assignment[]) ?? []);
        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, [cohort.id]);

    const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

    const filteredAssignments = useMemo(() =>
        selectedSessionId === 'all'
            ? assignments
            : assignments.filter((a) => a.session_id === selectedSessionId),
        [assignments, selectedSessionId]
    );

    const columns = useMemo(() => [
        { header: 'Assignment', accessor: (a: Assignment) => <span className="font-medium text-white">{a.title}</span> },
        {
            header: 'Session',
            accessor: (a: Assignment) => {
                const s = sessionMap.get(a.session_id);
                return s ? `Session ${s.session_number ?? '—'}: ${s.title}` : '—';
            },
        },
        {
            header: 'Due',
            accessor: (a: Assignment) => (
                <span className="text-gray-400 text-sm">{formatDateLabel(a.due_date) || 'TBD'} {formatTimeLabel(a.due_date) || ''}</span>
            ),
        },
        { header: 'Format', accessor: (a: Assignment) => a.submission_format.toUpperCase() },
        {
            header: 'Submissions',
            accessor: (a: Assignment) => (
                <button onClick={(e) => { e.stopPropagation(); setSubmissionsAssignment(a); }} className="text-sm text-lime hover:text-lime/80 font-medium">View</button>
            ),
        },
    ], [sessionMap]);

    const handleDelete = async (a: Assignment) => {
        if (!confirm(`Delete ${a.title}?`)) return;
        const { error: e } = await supabase.from('assignments').delete().eq('id', a.id);
        if (e) { setError(e.message); return; }
        fetchData();
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        const { error: e } = await supabase.from('assignments').delete().in('id', selectedIds);
        setIsBulkDeleting(false);
        if (e) { setError(e.message); return; }
        setShowBulkDeleteConfirm(false);
        setSelectedIds([]);
        fetchData();
    };

    const handleBulkEdit = () => {
        const item = filteredAssignments.find((a) => a.id === selectedIds[0]);
        if (item) { setSelectedAssignment(item); setIsModalOpen(true); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">{filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <SelectionActionBar
                            selectedCount={selectedIds.length}
                            onEdit={handleBulkEdit}
                            onDelete={() => setShowBulkDeleteConfirm(true)}
                        />
                    )}
                    <button
                        onClick={() => { setSelectedAssignment(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl font-medium hover:opacity-90 transition"
                    >
                        <Plus className="h-4 w-4" />
                        Add Assignment
                    </button>
                </div>
            </div>

            {sessions.length > 1 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-4">
                    <div className="min-w-[220px]">
                        <label className="block text-xs text-gray-400 mb-1">Filter by Session</label>
                        <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className={selectClass}>
                            <option value="all">All Sessions</option>
                            {sessions.map((s) => <option key={s.id} value={s.id}>Session {s.session_number}: {s.title}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <AdminTable
                data={filteredAssignments}
                columns={columns}
                isLoading={isLoading}
                onEdit={(a) => { setSelectedAssignment(a); setIsModalOpen(true); }}
                onDelete={handleDelete}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
            />

            <AssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); setSelectedAssignment(null); fetchData(); }}
                assignment={selectedAssignment}
                sessions={sessions}
                programs={[cohort]}
                defaultSessionId={selectedSessionId !== 'all' ? selectedSessionId : sessions[0]?.id}
            />

            <SubmissionsModal
                isOpen={Boolean(submissionsAssignment)}
                onClose={() => setSubmissionsAssignment(null)}
                assignment={submissionsAssignment}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ProgramDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const supabase = useSupabase();

    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [sessionCount, setSessionCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<DetailTab>('sessions');

    const fetchCohort = async () => {
        if (!id) return;
        const { data } = await supabase.from('cohorts').select('*').eq('id', id).single();
        setCohort((data as Cohort | null) ?? null);
        setIsLoading(false);
    };

    const refreshSessionCount = async () => {
        if (!id) return;
        const { count } = await supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('cohort_id', id);
        setSessionCount(count ?? 0);
    };

    useEffect(() => {
        fetchCohort();
        refreshSessionCount();
    }, [id]);

    const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
        { id: 'sessions', label: 'Sessions', icon: Calendar },
        { id: 'assignments', label: 'Assignments', icon: FileText },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 rounded-full border-2 border-lime/30 border-t-lime animate-spin" />
            </div>
        );
    }

    if (!cohort) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Program not found.</p>
                <button onClick={() => navigate('/admin/programs')} className="mt-4 text-lime text-sm hover:underline">← Back to Programs</button>
            </div>
        );
    }

    const statusClass: Record<CohortStatus, string> = {
        upcoming: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        active: 'bg-lime/10 text-lime border-lime/30',
        completed: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
    };

    return (
        <div className="space-y-6">
            {/* Back nav */}
            <button
                onClick={() => navigate('/admin/programs')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Programs
            </button>

            {/* Program header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-lime/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-6 w-6 text-lime" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-white">{cohort.name}</h1>
                            <span className={`px-2.5 py-1 text-xs rounded-lg border ${statusClass[cohort.status]}`}>
                                {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{offeringLabels[cohort.offering_type]}</span>
                            <span>·</span>
                            <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
                            {cohort.start_date && (
                                <>
                                    <span>·</span>
                                    <span>{formatDateLabel(cohort.start_date)} → {formatDateLabel(cohort.end_date) || 'TBD'}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-1 w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="programDetailTab"
                                    className="absolute inset-0 rounded-xl gradient-lime"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <Icon className="h-4 w-4 relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'sessions' && <SessionsPanel cohort={cohort} onRefreshCount={refreshSessionCount} />}
                {activeTab === 'assignments' && <AssignmentsPanel cohort={cohort} />}
            </motion.div>
        </div>
    );
}
