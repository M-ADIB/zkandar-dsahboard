import { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { X, Check, UserPlus, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Cohort, CohortStatus, OfferingType, User } from '@/types/database';

interface ProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    program?: Cohort | null;
}

type ProgramFormData = {
    name: string;
    offering_type: OfferingType;
    status: CohortStatus;
    start_date: string;
    end_date: string;
    miro_board_url: string;
};

type Company = { id: string; name: string; cohort_id: string | null };

type PendingInvite = {
    firstName: string;
    lastName: string;
    email: string;
};

const defaultFormData: ProgramFormData = {
    name: '',
    offering_type: 'master_class',
    status: 'upcoming',
    start_date: '',
    end_date: '',
    miro_board_url: '',
};

const inputClass = 'w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all';

// ProgramModal is key-mounted by its parent on each open, so this component
// always starts with fresh state — no effects needed to reset the form.
export function ProgramModal({ isOpen, onClose, onSuccess, program }: ProgramModalProps) {
    const supabase = useSupabase();
    const { session: authSession } = useAuth();

    const [formData, setFormData] = useState<ProgramFormData>(
        program
            ? {
                  name: program.name,
                  offering_type: program.offering_type,
                  status: program.status,
                  start_date: program.start_date?.slice(0, 10) ?? '',
                  end_date: program.end_date?.slice(0, 10) ?? '',
                  miro_board_url: program.miro_board_url ?? '',
              }
            : defaultFormData,
    );

    // Master Class state
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState<Company[]>([]);

    // Sprint Workshop state
    const [allUsers, setAllUsers] = useState<Pick<User, 'id' | 'full_name' | 'email'>[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [session2Date, setSession2Date] = useState('');
    const [sprintSessionCount, setSprintSessionCount] = useState(3);
    const [sprintTemplates, setSprintTemplates] = useState<Array<{
        session_number: number; title: string; description: string;
        submission_format: string; due_days_after_session: number;
    }>>([]);

    // Inline invite state
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [inviteFirstName, setInviteFirstName] = useState('');
    const [inviteLastName, setInviteLastName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteError, setInviteError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Runs exactly once per mount (parent re-mounts this component on each modal
    // open via key). Fetches companies, users, and sprint settings.
    useEffect(() => {
        const loadData = async () => {
            const [companiesRes, usersRes, sprintSettingsRes] = await Promise.all([
                supabase.from('companies').select('id, name, cohort_id').order('name'),
                supabase.from('users').select('id, full_name, email').order('full_name'),
                supabase.from('platform_settings').select('key, value').in('key', ['sprint_session_count', 'sprint_assignment_templates']),
            ]);

            const companiesList = (companiesRes.data as Company[]) ?? [];
            const usersList = (usersRes.data as Pick<User, 'id' | 'full_name' | 'email'>[]) ?? [];

            setCompanies(companiesList);
            setAllUsers(usersList);

            // Load sprint settings
            const sprintMap: Record<string, string> = {};
            ;(sprintSettingsRes.data as { key: string; value: string }[] ?? []).forEach((s) => { sprintMap[s.key] = s.value; });
            if (sprintMap.sprint_session_count) setSprintSessionCount(parseInt(sprintMap.sprint_session_count) || 3);
            if (sprintMap.sprint_assignment_templates) {
                try { setSprintTemplates(JSON.parse(sprintMap.sprint_assignment_templates)); } catch { /* ignore */ }
            }

            if (program) {
                // Pre-select company for master_class
                const assigned = companiesList.find((c) => c.cohort_id === program.id);
                if (assigned) setCompanyId(assigned.id);

                // Pre-select members for sprint_workshop
                if (program.offering_type === 'sprint_workshop') {
                    const { data: members } = await supabase
                        .from('cohort_memberships')
                        .select('user_id')
                        .eq('cohort_id', program.id);
                    if (members) {
                        setSelectedUserIds(members.map((m: { user_id: string }) => m.user_id));
                    }
                }
            }
        };
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — runs once per fresh mount

    const toggleUser = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsers = allUsers.filter(
        (u) =>
            u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const handleAddInvite = () => {
        setInviteError(null);
        if (!inviteEmail.trim()) {
            setInviteError('Email is required.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail.trim())) {
            setInviteError('Please enter a valid email address.');
            return;
        }
        // Prevent duplicate invites
        if (pendingInvites.some((inv) => inv.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
            setInviteError('This person has already been added to the invite list.');
            return;
        }
        setPendingInvites((prev) => [
            ...prev,
            { firstName: inviteFirstName.trim(), lastName: inviteLastName.trim(), email: inviteEmail.trim().toLowerCase() },
        ]);
        setInviteFirstName('');
        setInviteLastName('');
        setInviteEmail('');
        setShowInviteForm(false);
    };

    const removePendingInvite = (email: string) => {
        setPendingInvites((prev) => prev.filter((inv) => inv.email !== email));
    };

    /** Format a Date object as YYYY-MM-DD */
    const fmtDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    /** Parse a YYYY-MM-DD (or YYYY-MM-DDTHH:mm) string as a local date */
    const parseDate = (s: string) => {
        const [y, m, d] = s.split('T')[0].split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    /** Add N days to a YYYY-MM-DD string, return YYYY-MM-DD */
    const addDays = (dateStr: string, n: number) =>
        fmtDate(new Date(parseDate(dateStr).getTime() + n * 86400000));

    /**
     * Auto-create sessions for a new Sprint Workshop.
     * Dates are explicit: for 2 sessions [start, end]; for 3 [start, session2, end].
     * Returns the created session rows (id, session_number, scheduled_date) or null on error.
     */
    const createSprintSessions = async (
        cohortId: string,
        startDate: string,
        s2Date: string,
        endDate: string,
    ): Promise<{ id: string; session_number: number; scheduled_date: string }[] | null> => {
        const dateDates = sprintSessionCount === 2 ? [startDate, endDate] : [startDate, s2Date, endDate];
        const sessionRows = dateDates.map((dateStr, i) => ({
            cohort_id: cohortId,
            session_number: i + 1,
            title: `Session ${i + 1}`,
            session_date: dateStr.split('T')[0],
            scheduled_date: dateStr.split('T')[0],
            status: 'scheduled',
            materials: [],
        }));

        // @ts-expect-error - Supabase insert type inference
        const { data, error: sessionsError } = await supabase.from('sessions').insert(sessionRows).select('id, session_number, scheduled_date');
        if (sessionsError) {
            console.error('Auto-create sessions failed:', sessionsError.message);
            return null;
        }
        return data as { id: string; session_number: number; scheduled_date: string }[];
    };

    /**
     * Auto-create assignments for a new Sprint Workshop from platform setting templates.
     */
    const createSprintAssignments = async (
        createdSessions: { id: string; session_number: number; scheduled_date: string }[],
    ) => {
        if (!sprintTemplates.length) return;
        const assignments = sprintTemplates.flatMap((t) => {
            const session = createdSessions.find((s) => s.session_number === t.session_number);
            if (!session) return [];
            return [{
                session_id: session.id,
                title: t.title,
                description: t.description,
                due_date: addDays(session.scheduled_date, t.due_days_after_session),
                submission_format: t.submission_format,
            }];
        });
        if (assignments.length === 0) return;
        // @ts-expect-error - Supabase insert type inference
        const { error } = await supabase.from('assignments').insert(assignments);
        if (error) console.error('Auto-create assignments failed:', error.message);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Program name is required.');
            return;
        }

        if (formData.offering_type === 'master_class' && !companyId) {
            setError('Please select a company.');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            setError('Start and end dates are required.');
            return;
        }

        if (isSprintWorkshop) {
            if (sprintSessionCount >= 3) {
                const start = parseDate(formData.start_date);
                const end = parseDate(formData.end_date);
                if (end.getTime() < start.getTime() + 2 * 86400000) {
                    setError('End date must be at least 2 days after the start date so Session 2 can fit in between.');
                    return;
                }
                if (!program && !session2Date) {
                    setError('Please select a date for Session 2.');
                    return;
                }
            } else if (parseDate(formData.start_date) >= parseDate(formData.end_date)) {
                setError('End date must be after the start date.');
                return;
            }
        } else if (formData.start_date > formData.end_date) {
            setError('End date must be after the start date.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const payload = {
            name: formData.name.trim(),
            offering_type: formData.offering_type,
            status: formData.status,
            start_date: formData.start_date,
            end_date: formData.end_date,
            miro_board_url: formData.miro_board_url.trim() || null,
        };

        let cohortId: string = program?.id ?? '';
        const isNew = !program;

        if (program) {
            // Update existing cohort
            const { error: saveError } = await supabase
                .from('cohorts')
                // @ts-expect-error - Supabase update type inference issue
                .update(payload)
                .eq('id', program.id);

            if (saveError) {
                setIsLoading(false);
                setError(saveError.message);
                return;
            }
        } else {
            // Insert new cohort
            const { data: newCohort, error: saveError } = await supabase
                .from('cohorts')
                // @ts-expect-error - Supabase insert type inference issue
                .insert(payload)
                .select('id')
                .single();

            if (saveError) {
                setIsLoading(false);
                setError(saveError.message);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cohortId = (newCohort as any)?.id ?? '';
        }

        if (!cohortId) {
            setIsLoading(false);
            setError('Could not determine program ID.');
            return;
        }

        if (formData.offering_type === 'master_class') {
            // Unlink any company previously assigned, then assign the new one.
            await supabase
                .from('companies')
                // @ts-expect-error - Supabase update type inference issue
                .update({ cohort_id: null })
                .eq('cohort_id', cohortId)
                .neq('id', companyId);

            const { error: linkError } = await supabase
                .from('companies')
                // @ts-expect-error - Supabase update type inference issue
                .update({ cohort_id: cohortId })
                .eq('id', companyId);

            if (linkError) {
                setIsLoading(false);
                setError(linkError.message);
                return;
            }
        } else {
            // Sprint Workshop: auto-create sessions + assignments on new program creation
            if (isNew && formData.start_date) {
                const createdSessions = await createSprintSessions(cohortId, formData.start_date, session2Date, formData.end_date);
                if (createdSessions) {
                    await createSprintAssignments(createdSessions);
                }
            }

            // Save members to cohort_memberships.
            // First remove all existing memberships for this cohort.
            await supabase.from('cohort_memberships').delete().eq('cohort_id', cohortId);

            if (selectedUserIds.length > 0) {
                const inserts = selectedUserIds.map((userId) => ({
                    user_id: userId,
                    cohort_id: cohortId,
                }));
                const { error: memberError } = await supabase
                    .from('cohort_memberships')
                    // @ts-expect-error - Supabase insert type inference issue
                    .insert(inserts);

                if (memberError) {
                    setIsLoading(false);
                    setError(memberError.message);
                    return;
                }
            }

            // Send invites for pending (new) members
            if (pendingInvites.length > 0) {
                const token = authSession?.access_token;
                if (token) {
                    const inviteResults = await Promise.allSettled(
                        pendingInvites.map((inv) =>
                            supabase.functions.invoke('invite-user', {
                                body: {
                                    first_name: inv.firstName,
                                    last_name: inv.lastName,
                                    email: inv.email,
                                    role: 'participant',
                                    cohort_id: cohortId,
                                },
                                headers: { Authorization: `Bearer ${token}` },
                            })
                        )
                    );
                    const failed = inviteResults.filter((r) => r.status === 'rejected');
                    if (failed.length > 0) {
                        console.error('Some invites failed to send:', failed);
                    }
                }
            }
        }

        setIsLoading(false);
        onSuccess();
    };

    const isSprintWorkshop = formData.offering_type === 'sprint_workshop';

    // For 3-session sprints: end must be ≥ start + 2 days; for 2-session: end > start
    const isEndDateValid = useMemo(() => {
        if (!formData.start_date || !formData.end_date) return false;
        const gap = sprintSessionCount >= 3 ? 2 : 1;
        return parseDate(formData.end_date).getTime() >= parseDate(formData.start_date).getTime() + gap * 86400000;
    }, [formData.start_date, formData.end_date, sprintSessionCount]);

    // Bounds for the Session 2 picker
    const session2Min = formData.start_date ? addDays(formData.start_date, 1) : undefined;
    const session2Max = formData.end_date ? addDays(formData.end_date, -1) : undefined;

    // Clear session2Date if it falls outside the valid window when dates change
    useEffect(() => {
        if (!session2Date) return;
        if (!session2Min || !session2Max || session2Date < session2Min || session2Date > session2Max) {
            setSession2Date('');
        }
    }, [formData.start_date, formData.end_date]); // eslint-disable-line react-hooks/exhaustive-deps

    // Min for end date depends on session count
    const endDateMin = formData.start_date ? addDays(formData.start_date, sprintSessionCount >= 3 ? 2 : 1) : undefined;

    // Show Session 2 picker only when count >= 3 and on new sprint programs
    const showSession2Picker = isSprintWorkshop && !program && sprintSessionCount >= 3;

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={program ? 'Edit Program' : 'Add Program'}
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Program Name</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Spring Sprint Workshop"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Offering Type</label>
                <select
                    value={formData.offering_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, offering_type: e.target.value as OfferingType }))}
                    className={inputClass}
                >
                    <option value="sprint_workshop">Sprint Workshop</option>
                    <option value="master_class">Master Class</option>
                </select>
            </div>

            {/* Company (Master Class only) */}
            {!isSprintWorkshop && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Company <span className="text-red-400">*</span></label>
                    <select
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        required
                        className={inputClass}
                    >
                        <option value="">Select a company…</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Members (Sprint Workshop only) */}
            {isSprintWorkshop && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Members
                        {(selectedUserIds.length + pendingInvites.length) > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-lime/10 text-lime border border-lime/20">
                                {selectedUserIds.length + pendingInvites.length} selected
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search existing members…"
                        className={`${inputClass} mb-2`}
                    />
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-white/[0.05] bg-white/[0.03] divide-y divide-white/[0.04]">
                        {filteredUsers.length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-4">No members found</p>
                        )}
                        {filteredUsers.map((u) => {
                            const isSelected = selectedUserIds.includes(u.id);
                            return (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => toggleUser(u.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-lime/5' : 'hover:bg-white/[0.03]'}`}
                                >
                                    <div>
                                        <p className={`font-medium ${isSelected ? 'text-lime' : 'text-white'}`}>{u.full_name}</p>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="h-5 w-5 rounded-full bg-lime/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-3 w-3 text-lime" />
                                        </div>
                                    )}
                                    {!isSelected && (
                                        <div className="h-5 w-5 rounded-full border border-white/10 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Inline invite form */}
                    <div className="mt-3">
                        {!showInviteForm ? (
                            <button
                                type="button"
                                onClick={() => { setShowInviteForm(true); setInviteError(null); }}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-lime transition-colors"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Invite a new member
                            </button>
                        ) : (
                            <div className="rounded-xl border border-lime/20 bg-lime/5 p-3 space-y-2">
                                <p className="text-xs font-medium text-lime flex items-center gap-1.5">
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Invite New Member
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={inviteFirstName}
                                        onChange={(e) => setInviteFirstName(e.target.value)}
                                        placeholder="First name"
                                        className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
                                    />
                                    <input
                                        type="text"
                                        value={inviteLastName}
                                        onChange={(e) => setInviteLastName(e.target.value)}
                                        placeholder="Last name"
                                        className="w-full px-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="email@company.com"
                                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-lime/40 placeholder:text-gray-600"
                                    />
                                </div>
                                {inviteError && (
                                    <p className="text-xs text-red-300">{inviteError}</p>
                                )}
                                <div className="flex items-center gap-2 pt-0.5">
                                    <button
                                        type="button"
                                        onClick={handleAddInvite}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg gradient-lime text-black hover:opacity-90 transition"
                                    >
                                        <Loader2 className="h-3 w-3 hidden" />
                                        Add to invite list
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowInviteForm(false); setInviteError(null); setInviteFirstName(''); setInviteLastName(''); setInviteEmail(''); }}
                                        className="text-xs text-gray-500 hover:text-white transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected & pending chips */}
                    {(selectedUserIds.length > 0 || pendingInvites.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {selectedUserIds.map((uid) => {
                                const user = allUsers.find((u) => u.id === uid);
                                if (!user) return null;
                                return (
                                    <span
                                        key={uid}
                                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg bg-lime/10 text-lime border border-lime/20"
                                    >
                                        {user.full_name}
                                        <button
                                            type="button"
                                            onClick={() => toggleUser(uid)}
                                            className="opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                );
                            })}
                            {pendingInvites.map((inv) => (
                                <span
                                    key={inv.email}
                                    className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                    title={`Will be invited as new member`}
                                >
                                    <Mail className="h-3 w-3 opacity-60" />
                                    {inv.firstName || inv.email}
                                    <button
                                        type="button"
                                        onClick={() => removePendingInvite(inv.email)}
                                        className="opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Sprint Workshop — live session map */}
                    {!program && (
                        <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 space-y-1.5">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Auto-created Sessions ({sprintSessionCount})
                            </p>
                            <div className="text-[11px] text-gray-500 space-y-1">
                                {sprintSessionCount === 2 ? (
                                    <>
                                        <div className="flex items-center justify-between"><span>Session 1</span><span className="text-white/70">{formData.start_date || '—'}</span></div>
                                        <div className="flex items-center justify-between"><span>Session 2</span><span className="text-white/70">{formData.end_date || '—'}</span></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between"><span>Session 1</span><span className="text-white/70">{formData.start_date || '—'}</span></div>
                                        <div className="flex items-center justify-between"><span>Session 2</span><span className={session2Date ? 'text-lime/80' : 'text-white/70'}>{session2Date || 'Pick a date below'}</span></div>
                                        <div className="flex items-center justify-between"><span>Session 3</span><span className="text-white/70">{formData.end_date || '—'}</span></div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as CohortStatus }))}
                    className={inputClass}
                >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateTimePicker
                    label={isSprintWorkshop ? 'Start Date (Session 1)' : 'Start Date'}
                    value={formData.start_date}
                    onChange={(val) => setFormData((prev) => ({ ...prev, start_date: val }))}
                    required
                    showTime
                />
                <DateTimePicker
                    label={isSprintWorkshop ? `End Date (Session ${sprintSessionCount})` : 'End Date'}
                    value={formData.end_date}
                    onChange={(val) => setFormData((prev) => ({ ...prev, end_date: val }))}
                    required
                    showTime
                    min={isSprintWorkshop ? endDateMin : undefined}
                />
            </div>

            {/* Session 2 date picker — 3-session sprints only */}
            {showSession2Picker && (
                <div>
                    {!isEndDateValid && formData.start_date && formData.end_date && (
                        <p className="mb-2 text-xs text-yellow-400/80">
                            End date must be at least 2 days after the start date to fit Session 2.
                        </p>
                    )}
                    <DateTimePicker
                        label="Session 2 Date"
                        value={session2Date}
                        onChange={setSession2Date}
                        required
                        min={session2Min}
                        max={session2Max}
                    />
                    {!isEndDateValid && (
                        <p className="mt-1.5 text-[11px] text-gray-600">Set valid start & end dates first to unlock this picker.</p>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Miro Board URL</label>
                <input
                    type="url"
                    value={formData.miro_board_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, miro_board_url: e.target.value }))}
                    className={inputClass}
                    placeholder="https://miro.com/..."
                />
            </div>
        </ModalForm>
    );
}
