import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Plus, GraduationCap, Users, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { SessionModal } from '@/components/admin/programs/SessionModal';
import { AssignmentModal } from '@/components/admin/assignments/AssignmentModal';
import { SubmissionsModal } from '@/components/admin/assignments/SubmissionsModal';
import { SelectionActionBar } from '@/components/admin/shared/SelectionActionBar';
import { BulkDeleteConfirm } from '@/components/admin/shared/BulkDeleteConfirm';
import { formatDateLabel, formatTimeLabel } from '@/lib/time';
import type { Assignment, Cohort, CohortStatus, OfferingType, Session, SessionStatus, User, Company } from '@/types/database';
import { setDynamicPageTitle } from '@/hooks/usePageTitle';
import { UserModal } from '@/components/admin/users/UserModal';
import { InviteUserModal } from '@/components/admin/users/InviteUserModal';

type DetailTab = 'sessions' | 'assignments' | 'participants';

const offeringLabels: Record<OfferingType, string> = {
    sprint_workshop: 'Sprint Workshop',
    master_class: 'Master Class',
    webinar: 'Webinar',
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
            .select('id, cohort_id, session_number, title, scheduled_date, status, zoom_link, recording_url, created_at')
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
            header: 'Zoom Link',
            accessor: (s: Session) => s.zoom_link
                ? <span className="text-lime text-xs truncate max-w-[160px] block">Set</span>
                : <span className="text-gray-600 text-xs">—</span>,
        },
        {
            header: 'Recording Link',
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
                onRowClick={(s) => { setSelectedSession(s); setIsModalOpen(true); }}
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
    const [submissionCounts, setSubmissionCounts] = useState<Record<string, { total: number; pending: number }>>({});
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
            .select('id, session_id, title, description, due_date, submission_format, created_at, lock_override')
            .in('session_id', cohortSessions.map((s) => s.id))
            .order('due_date', { ascending: false });
        if (ae) { setError(ae.message); setIsLoading(false); return; }
        const rows = (assignmentData as Assignment[]) ?? [];
        setAssignments(rows);

        // Fetch submission counts + pending counts
        if (rows.length > 0) {
            const { data: subs } = await supabase
                .from('submissions')
                .select('assignment_id, status')
                .in('assignment_id', rows.map((a) => a.id));
            const counts: Record<string, { total: number; pending: number }> = {};
            (subs as { assignment_id: string; status: string }[] | null)?.forEach((s) => {
                if (!counts[s.assignment_id]) counts[s.assignment_id] = { total: 0, pending: 0 };
                counts[s.assignment_id].total += 1;
                if (s.status !== 'reviewed') counts[s.assignment_id].pending += 1;
            });
            setSubmissionCounts(counts);
        }

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
            accessor: (a: Assignment) => {
                const counts = submissionCounts[a.id];
                const total = counts?.total ?? 0;
                const pending = counts?.pending ?? 0;
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); setSubmissionsAssignment(a); }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                            pending > 0
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                                : total > 0
                                ? 'bg-lime/10 border-lime/30 text-lime hover:bg-lime/20'
                                : 'bg-white/[0.03] border-white/[0.08] text-gray-500 hover:text-white hover:border-white/20'
                        }`}
                    >
                        {pending > 0 ? `${pending} to review` : total > 0 ? `${total} reviewed` : 'No submissions'}
                    </button>
                );
            },
        },
        {
            header: 'Lock Override',
            accessor: (a: Assignment) => {
                const currentOverride = a.lock_override ?? 'default';
                return (
                    <div className="inline-flex rounded-xl bg-white/5 border border-white/[0.06] p-0.5 gap-0.5" onClick={(e) => e.stopPropagation()}>
                        {[
                            { value: 'default', label: 'Default' },
                            { value: 'unlocked', label: 'Unlock' },
                            { value: 'locked', label: 'Lock' },
                        ].map((opt) => {
                            const isActive = currentOverride === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const { error: err } = await supabase
                                            .from('assignments')
                                            .update({ lock_override: opt.value as 'default' | 'unlocked' | 'locked' })
                                            .eq('id', a.id);
                                        
                                        if (err) {
                                            alert(err.message);
                                        } else {
                                            setAssignments((prev) =>
                                                prev.map((item) =>
                                                    item.id === a.id
                                                        ? { ...item, lock_override: opt.value as any }
                                                        : item
                                                )
                                            );
                                        }
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                                        isActive
                                            ? opt.value === 'unlocked'
                                                ? 'bg-lime text-black'
                                                : opt.value === 'locked'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white/10 text-white'
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                );
            },
        },
    ], [sessionMap, submissionCounts]);

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
                onRowClick={(a) => { setSelectedAssignment(a); setIsModalOpen(true); }}
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

// ─── Participants Panel ──────────────────────────────────────────────────────
function ParticipantsPanel({ cohort }: { cohort: Cohort }) {
    const supabase = useSupabase();
    const navigate = useNavigate();
    const [participants, setParticipants] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [programs, setPrograms] = useState<Cohort[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // User modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserMemberships, setSelectedUserMemberships] = useState<string[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const fetchParticipants = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch memberships for this cohort
            const { data: directMemberships, error: mError } = await supabase
                .from('cohort_memberships')
                .select('user_id')
                .eq('cohort_id', cohort.id);

            if (mError) throw mError;
            const directUserIds = (directMemberships as { user_id: string }[] | null)?.map((m) => m.user_id) || [];

            // 2. Fetch companies assigned to this cohort
            const { data: companiesData, error: cError } = await supabase
                .from('companies')
                .select('id, name')
                .eq('cohort_id', cohort.id);

            if (cError) throw cError;
            const companyIds = (companiesData as { id: string }[] | null)?.map((c) => c.id) || [];

            // 3. Fetch users matching either direct memberships OR belonging to these companies
            let fetchedUsers: User[] = [];
            if (directUserIds.length > 0 || companyIds.length > 0) {
                let query = supabase.from('users').select('*');
                if (directUserIds.length > 0 && companyIds.length > 0) {
                    query = query.or(`id.in.(${directUserIds.join(',')}),company_id.in.(${companyIds.join(',')})`);
                } else if (directUserIds.length > 0) {
                    query = query.in('id', directUserIds);
                } else {
                    query = query.in('company_id', companyIds);
                }
                const { data: usersData, error: uError } = await query;
                if (uError) throw uError;
                fetchedUsers = (usersData as User[]) ?? [];
            }

            setParticipants(fetchedUsers);

            // Fetch reference lists for UserModal
            const [companiesResult, programsResult] = await Promise.all([
                supabase.from('companies').select('*').order('name'),
                supabase.from('cohorts').select('*').order('start_date', { ascending: false }),
            ]);

            if (companiesResult.data) setCompanies(companiesResult.data as Company[]);
            if (programsResult.data) setPrograms(programsResult.data as Cohort[]);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
    }, [cohort.id]);

    const handleEditUser = async (user: User) => {
        // Fetch user memberships first to pass to UserModal
        const { data: userMemberships } = await supabase
            .from('cohort_memberships')
            .select('cohort_id')
            .eq('user_id', user.id);

        const mIds = (userMemberships as { cohort_id: string }[] | null)?.map((m) => m.cohort_id) || [];
        setSelectedUserMemberships(mIds);
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleRemoveUser = async (user: User) => {
        // Find if they are a direct member or member via company
        const { data: membershipsData } = await supabase
            .from('cohort_memberships')
            .select('id')
            .eq('cohort_id', cohort.id)
            .eq('user_id', user.id)
            .maybeSingle();

        const membershipObj = membershipsData as { id: string } | null;

        if (membershipObj?.id) {
            if (!confirm(`Remove ${user.full_name} from this program?`)) return;
            const { error: deleteErr } = await supabase
                .from('cohort_memberships')
                .delete()
                .eq('id', membershipObj.id);

            if (deleteErr) {
                alert(`Error: ${deleteErr.message}`);
            } else {
                fetchParticipants();
            }
        } else {
            alert(`${user.full_name} is in this cohort because their company is assigned to it. To remove them, change the company's assigned program on the Companies page.`);
        }
    };

    const columns = useMemo(() => [
        {
            header: 'Name',
            accessor: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-lime/10 flex items-center justify-center shrink-0">
                        <span className="text-lime font-bold text-xs">{(user.full_name || '?').charAt(0)}</span>
                    </div>
                    <span className="font-medium text-white">{user.full_name}</span>
                </div>
            ),
            className: 'font-medium text-white',
        },
        { header: 'Email', accessor: 'email' as keyof User },
        {
            header: 'Role',
            accessor: (user: User) => {
                const roleLabel: Record<string, string> = {
                    owner: 'Owner',
                    admin: 'Admin',
                    executive: 'Executive',
                    participant: 'Participant',
                };
                return (
                    <span className="px-2 py-1 text-xs rounded-lg border border-border text-gray-300">
                        {roleLabel[user.role] ?? user.role}
                    </span>
                );
            },
        },
        { header: 'Type', accessor: (user: User) => user.user_type ? user.user_type.replace(/_/g, ' ') : 'Unassigned', className: 'capitalize' },
        {
            header: 'Company',
            accessor: (user: User) => {
                if (!user.company_id) return '—';
                const comp = companies.find((c) => c.id === user.company_id);
                return comp ? comp.name : '—';
            },
        },
        { header: 'Position', accessor: (user: User) => user.position || '—' },
        {
            header: 'Onboarding',
            accessor: (user: User) => user.onboarding_completed ? (
                <span className="px-2 py-0.5 rounded-lg border border-lime/30 bg-lime/10 text-lime text-xs font-medium">Completed</span>
            ) : (
                <span className="px-2 py-0.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-gray-500 text-xs font-medium">Pending</span>
            ),
        },
        {
            header: 'AI Readiness',
            accessor: (user: User) => {
                const score = user.ai_readiness_score;
                const scoreText = score !== null ? `${score}%` : '—';
                const colorClass = score !== null 
                    ? (score >= 70 ? 'text-lime' : score >= 40 ? 'text-yellow-400' : 'text-red-400')
                    : 'text-gray-500';
                return (
                    <span className={`font-semibold ${colorClass}`}>
                        {scoreText}
                    </span>
                );
            },
        },
    ], [companies]);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''} in this program</p>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-lime hover:bg-lime/90 text-black text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(208,255,113,0.15)] cursor-pointer"
                >
                    <UserPlus className="h-4 w-4" />
                    Invite Participant
                </button>
            </div>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <AdminTable
                data={participants}
                columns={columns}
                isLoading={isLoading}
                onEdit={handleEditUser}
                onDelete={handleRemoveUser}
                onRowClick={(user) => navigate(`/admin/members/${user.id}`)}
            />

            {selectedUser && (
                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedUser(null);
                        fetchParticipants();
                    }}
                    user={selectedUser}
                    companies={companies}
                    programs={programs}
                    memberships={selectedUserMemberships}
                />
            )}

            <InviteUserModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={() => {
                    setIsInviteModalOpen(false);
                    fetchParticipants();
                }}
                companies={companies}
                programs={programs}
                defaultCohortId={cohort.id}
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
        const fetchedCohort = (data as Cohort | null) ?? null;
        setCohort(fetchedCohort);
        if (fetchedCohort) {
            setDynamicPageTitle(fetchedCohort.name);
        }
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
        return () => {
            setDynamicPageTitle(null);
        };
    }, [id]);

    const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
        { id: 'sessions', label: 'Sessions', icon: Calendar },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'participants', label: 'Participants', icon: Users },
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
                {activeTab === 'participants' && <ParticipantsPanel cohort={cohort} />}
            </motion.div>
        </div>
    );
}
