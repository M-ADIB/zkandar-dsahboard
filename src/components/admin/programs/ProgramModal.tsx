import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import { X, Check } from 'lucide-react';
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

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Runs exactly once per mount (parent re-mounts this component on each modal
    // open via key). Fetches companies and users and pre-selects assigned ones.
    useEffect(() => {
        const loadData = async () => {
            const [companiesRes, usersRes] = await Promise.all([
                supabase.from('companies').select('id, name, cohort_id').order('name'),
                supabase.from('users').select('id, full_name, email').order('full_name'),
            ]);

            const companiesList = (companiesRes.data as Company[]) ?? [];
            const usersList = (usersRes.data as Pick<User, 'id' | 'full_name' | 'email'>[]) ?? [];

            setCompanies(companiesList);
            setAllUsers(usersList);

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

        if (formData.start_date > formData.end_date) {
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
            // Sprint Workshop: Save members to cohort_memberships.
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
        }

        setIsLoading(false);
        onSuccess();
    };

    const isSprintWorkshop = formData.offering_type === 'sprint_workshop';

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
                        {selectedUserIds.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-lime/10 text-lime border border-lime/20">
                                {selectedUserIds.length} selected
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search members…"
                        className={`${inputClass} mb-2`}
                    />
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.05] bg-white/[0.03] divide-y divide-white/[0.04]">
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
                    {selectedUserIds.length > 0 && (
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
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                    <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                        className={inputClass}
                    />
                </div>
            </div>

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
