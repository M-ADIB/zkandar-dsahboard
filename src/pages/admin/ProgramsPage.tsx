import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, GraduationCap, Calendar, FileText, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { ProgramModal } from '@/components/admin/programs/ProgramModal';
import { SessionModal } from '@/components/admin/programs/SessionModal';
import { AssignmentModal } from '@/components/admin/assignments/AssignmentModal';
import { SubmissionsModal } from '@/components/admin/assignments/SubmissionsModal';
import { AdminToolboxTab } from '@/components/admin/programs/AdminToolboxTab';
import { formatDateLabel, formatTimeLabel } from '@/lib/time';
import type { Assignment, Cohort, CohortStatus, OfferingType, Session, SessionStatus } from '@/types/database';

type Tab = 'programs' | 'sessions' | 'assignments' | 'toolbox';
type OfferingFilter = 'all' | OfferingType;
type StatusFilter = 'all' | CohortStatus;

const offeringLabels: Record<OfferingType, string> = {
    sprint_workshop: 'Sprint Workshop',
    master_class: 'Master Class',
};

const sessionStatusLabels: Record<SessionStatus, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
};

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'programs', label: 'Programs', icon: GraduationCap },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'toolbox', label: 'Toolbox', icon: Wrench },
];

// ─── Filter box shared style ────────────────────────────────────────────────
const filterBoxClass = 'bg-bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-4';
const selectClass = 'w-full px-3 py-2 bg-bg-elevated border border-border rounded-xl text-white text-sm focus:outline-none focus:border-lime/50 transition-colors';

// ─── Programs Tab ────────────────────────────────────────────────────────────
function ProgramsTab() {
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
            header: 'Manage',
            accessor: (p: Cohort) => (
                <Link to={`/admin/programs/${p.id}/sessions`} className="text-lime hover:text-lime/80 text-sm font-medium">
                    Sessions →
                </Link>
            ),
        },
    ], [sessionCounts]);

    const handleDelete = async (program: Cohort) => {
        if (!confirm(`Delete ${program.name}? This will remove all associated sessions.`)) return;
        const { error: deleteError } = await supabase.from('cohorts').delete().eq('id', program.id);
        if (deleteError) { setError(deleteError.message); return; }
        fetchPrograms();
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">Manage Sprint Workshops and Master Classes</p>
                <button
                    onClick={() => { setSelectedProgram(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl transition font-medium hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    Add Program
                </button>
            </div>

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
            />

            <ProgramModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                program={selectedProgram}
                onSuccess={() => { setIsModalOpen(false); setSelectedProgram(null); fetchPrograms(); }}
            />
        </div>
    );
}

// ─── Sessions Tab ─────────────────────────────────────────────────────────────
function SessionsTab() {
    const supabase = useSupabase();
    const [programs, setPrograms] = useState<Cohort[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const fetchPrograms = async () => {
        const { data } = await supabase.from('cohorts').select('id, name, start_date, end_date, status, offering_type, created_at').order('start_date', { ascending: false });
        setPrograms((data as Cohort[]) ?? []);
    };

    const fetchSessions = async (programId: string) => {
        setIsLoading(true);
        setError(null);
        const baseQuery = supabase.from('sessions').select('id, cohort_id, session_number, title, scheduled_date, status, created_at');
        const { data, error: sessionsError } = programId === 'all'
            ? await baseQuery.order('scheduled_date', { ascending: true })
            : await baseQuery.eq('cohort_id', programId).order('session_number', { ascending: true });

        if (!sessionsError) { setSessions((data as Session[]) ?? []); setIsLoading(false); return; }

        // Fallback for missing columns
        const fallback = await supabase.from('sessions').select('id, cohort_id, session_number, title, status, created_at').order('created_at', { ascending: true });
        if (fallback.error) { setError(fallback.error.message); setSessions([]); } else { setSessions((fallback.data as Session[]) ?? []); }
        setIsLoading(false);
    };

    useEffect(() => { fetchPrograms(); }, []);
    useEffect(() => { fetchSessions(selectedProgramId); }, [selectedProgramId]);

    const programMap = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
    const nextSessionNumber = useMemo(() => {
        if (selectedProgramId === 'all') return 1;
        const ps = sessions.filter((s) => s.cohort_id === selectedProgramId);
        return ps.length === 0 ? 1 : Math.max(...ps.map((s) => s.session_number || 0)) + 1;
    }, [sessions, selectedProgramId]);

    const columns = useMemo(() => [
        { header: 'Program', accessor: (s: Session) => programMap.get(s.cohort_id)?.name ?? '—' },
        { header: '#', accessor: (s: Session) => s.session_number, className: 'font-medium text-white' },
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
    ], [programMap]);

    const handleDelete = async (session: Session) => {
        if (!confirm(`Delete ${session.title}?`)) return;
        const { error: e } = await supabase.from('sessions').delete().eq('id', session.id);
        if (e) { setError(e.message); return; }
        fetchSessions(selectedProgramId);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">Manage upcoming and completed sessions</p>
                <button
                    onClick={() => { setSelectedSession(null); setIsModalOpen(true); }}
                    disabled={selectedProgramId === 'all'}
                    className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="h-4 w-4" />
                    Add Session
                </button>
            </div>

            <div className={filterBoxClass}>
                <div className="min-w-[220px]">
                    <label className="block text-xs text-gray-400 mb-1">Filter by Program</label>
                    <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)} className={selectClass}>
                        <option value="all">All Programs</option>
                        {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                {selectedProgramId === 'all' && (
                    <div className="flex items-end pb-1 text-xs text-gray-500">Select a program to add sessions</div>
                )}
            </div>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <AdminTable
                data={sessions}
                columns={columns}
                isLoading={isLoading}
                onEdit={(s) => { setSelectedSession(s); setIsModalOpen(true); }}
                onDelete={handleDelete}
            />

            {selectedProgramId !== 'all' && (
                <SessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { setIsModalOpen(false); setSelectedSession(null); fetchSessions(selectedProgramId); }}
                    cohortId={selectedSession?.cohort_id ?? selectedProgramId}
                    session={selectedSession}
                    defaultSessionNumber={nextSessionNumber}
                />
            )}
        </div>
    );
}

// ─── Assignments Tab ──────────────────────────────────────────────────────────
function AssignmentsTab() {
    const supabase = useSupabase();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [programs, setPrograms] = useState<Cohort[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
    const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissionsAssignment, setSubmissionsAssignment] = useState<Assignment | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        const [ar, sr, pr] = await Promise.all([
            supabase.from('assignments').select('id, session_id, title, description, due_date, submission_format, created_at').order('due_date', { ascending: false }),
            supabase.from('sessions').select('id, cohort_id, title, session_number').order('session_number', { ascending: true }),
            supabase.from('cohorts').select('id, name, start_date, end_date, status, offering_type, created_at').order('start_date', { ascending: false }),
        ]);
        const errors = [ar.error, sr.error, pr.error].filter(Boolean);
        if (errors.length > 0) { setError(errors[0]?.message ?? 'Failed to load'); setIsLoading(false); return; }
        setAssignments((ar.data as Assignment[]) ?? []);
        setSessions((sr.data as Session[]) ?? []);
        setPrograms((pr.data as Cohort[]) ?? []);
        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const programMap = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
    const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
    const sessionsForProgram = useMemo(() => selectedProgramId === 'all' ? sessions : sessions.filter((s) => s.cohort_id === selectedProgramId), [sessions, selectedProgramId]);

    const filteredAssignments = useMemo(() => assignments.filter((a) => {
        const session = sessionMap.get(a.session_id);
        if (!session) return false;
        if (selectedProgramId !== 'all' && session.cohort_id !== selectedProgramId) return false;
        if (selectedSessionId !== 'all' && a.session_id !== selectedSessionId) return false;
        return true;
    }), [assignments, selectedProgramId, selectedSessionId, sessionMap]);

    const columns = useMemo(() => [
        { header: 'Assignment', accessor: (a: Assignment) => <span className="font-medium text-white">{a.title}</span> },
        {
            header: 'Program',
            accessor: (a: Assignment) => {
                const s = sessionMap.get(a.session_id);
                return s ? (programMap.get(s.cohort_id)?.name ?? '—') : '—';
            },
        },
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
                <button onClick={() => setSubmissionsAssignment(a)} className="text-sm text-lime hover:text-lime/80 font-medium">View</button>
            ),
        },
    ], [programMap, sessionMap]);

    const handleDelete = async (a: Assignment) => {
        if (!confirm(`Delete ${a.title}?`)) return;
        const { error: e } = await supabase.from('assignments').delete().eq('id', a.id);
        if (e) { setError(e.message); return; }
        fetchData();
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">Create and review program assignments</p>
                <button
                    onClick={() => { setSelectedAssignment(null); setIsModalOpen(true); }}
                    disabled={sessions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="h-4 w-4" />
                    Add Assignment
                </button>
            </div>

            <div className={filterBoxClass}>
                <div className="min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Program</label>
                    <select value={selectedProgramId} onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedSessionId('all'); }} className={selectClass}>
                        <option value="all">All Programs</option>
                        {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="min-w-[200px]">
                    <label className="block text-xs text-gray-400 mb-1">Session</label>
                    <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className={selectClass}>
                        <option value="all">All Sessions</option>
                        {sessionsForProgram.map((s) => <option key={s.id} value={s.id}>Session {s.session_number}: {s.title}</option>)}
                    </select>
                </div>
            </div>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <AdminTable
                data={filteredAssignments}
                columns={columns}
                isLoading={isLoading}
                onEdit={(a) => { setSelectedAssignment(a); setIsModalOpen(true); }}
                onDelete={handleDelete}
            />

            <AssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); setSelectedAssignment(null); fetchData(); }}
                assignment={selectedAssignment}
                sessions={sessions}
                programs={programs}
                defaultSessionId={selectedSessionId !== 'all' ? selectedSessionId : sessionsForProgram[0]?.id}
            />

            <SubmissionsModal
                isOpen={Boolean(submissionsAssignment)}
                onClose={() => setSubmissionsAssignment(null)}
                assignment={submissionsAssignment}
            />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ProgramsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('programs');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Programs</h1>
                <p className="text-gray-400 mt-1 text-sm">Manage your masterclass programs, sessions, and assignments</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-bg-card border border-border rounded-2xl p-1 w-fit">
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
                                    layoutId="programsActiveTab"
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
                {activeTab === 'programs' && <ProgramsTab />}
                {activeTab === 'sessions' && <SessionsTab />}
                {activeTab === 'assignments' && <AssignmentsTab />}
                {activeTab === 'toolbox' && <AdminToolboxTab />}
            </motion.div>
        </div>
    );
}
