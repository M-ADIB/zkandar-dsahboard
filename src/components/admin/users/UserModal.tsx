import { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import type { Cohort, Company, User, UserRole, UserType } from '@/types/database';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
    companies: Company[];
    programs: Cohort[];
    memberships: string[];
}

type UserFormData = {
    full_name: string;
    role: UserRole;
    user_type: UserType | '';
    company_id: string;
};

const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'executive', label: 'Executive' },
    { value: 'participant', label: 'Participant' },
];

const userTypeOptions: { value: UserType | ''; label: string }[] = [
    { value: '', label: 'Unassigned' },
    { value: 'management', label: 'Management' },
    { value: 'team', label: 'Team' },
];

export function UserModal({
    isOpen,
    onClose,
    onSuccess,
    user,
    companies,
    programs,
    memberships,
}: UserModalProps) {
    const supabase = useSupabase();
    const [formData, setFormData] = useState<UserFormData>({
        full_name: '',
        role: 'participant',
        user_type: '',
        company_id: '',
    });
    const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
    const [initialPrograms, setInitialPrograms] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        setFormData({
            full_name: user.full_name,
            role: user.role,
            user_type: user.user_type ?? '',
            company_id: user.company_id ?? '',
        });
        setSelectedPrograms(memberships);
        setInitialPrograms(memberships);
        setError(null);
    }, [user, memberships, isOpen]);

    const programGroups = useMemo(() => {
        const sprint = programs.filter((program) => program.offering_type === 'sprint_workshop');
        const master = programs.filter((program) => program.offering_type === 'master_class');
        return { sprint, master };
    }, [programs]);

    const masterClassIds = useMemo(() => {
        return new Set(programGroups.master.map((program) => program.id));
    }, [programGroups.master]);

    const hasMasterClassSelection = useMemo(() => {
        return selectedPrograms.some((id) => masterClassIds.has(id));
    }, [selectedPrograms, masterClassIds]);

    const isCompanyMissing = !formData.company_id;

    const handleProgramToggle = (programId: string) => {
        setSelectedPrograms((prev) =>
            prev.includes(programId)
                ? prev.filter((id) => id !== programId)
                : [...prev, programId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;
        if (!formData.full_name.trim()) {
            setError('Full name is required.');
            return;
        }

        if (hasMasterClassSelection && isCompanyMissing) {
            setError('Master Class participants must be assigned to a company.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const payload = {
            full_name: formData.full_name.trim(),
            role: formData.role,
            user_type: formData.user_type || null,
            company_id: formData.company_id || null,
        };

        const { error: updateError } = await supabase
            .from('users')
            // @ts-expect-error - Supabase update type inference issue
            .update(payload)
            .eq('id', user.id);

        if (updateError) {
            setError(updateError.message);
            setIsLoading(false);
            return;
        }

        const toAdd = selectedPrograms.filter((id) => !initialPrograms.includes(id));
        const toRemove = initialPrograms.filter((id) => !selectedPrograms.includes(id));

        if (toAdd.length > 0) {
            const { error: addError } = await supabase
                .from('cohort_memberships')
                // @ts-expect-error - Supabase insert type inference issue
                .insert(toAdd.map((cohort_id) => ({ user_id: user.id, cohort_id })));

            if (addError) {
                setError(addError.message);
                setIsLoading(false);
                return;
            }
        }

        if (toRemove.length > 0) {
            const { error: removeError } = await supabase
                .from('cohort_memberships')
                .delete()
                .eq('user_id', user.id)
                .in('cohort_id', toRemove);

            if (removeError) {
                setError(removeError.message);
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(false);
        onSuccess();
    };

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Edit User' : 'Edit User'}
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                    type="email"
                    value={user?.email ?? ''}
                    readOnly
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-gray-400 focus:outline-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">User Type</label>
                    <select
                        value={formData.user_type}
                        onChange={(e) => setFormData({ ...formData, user_type: e.target.value as UserType | '' })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        {userTypeOptions.map((type) => (
                            <option key={type.value || 'none'} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company (Master Class)</label>
                <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                >
                    <option value="">Unassigned</option>
                    {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                            {company.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-gray-300">Program Memberships</p>
                    <p className="text-xs text-gray-500">Assign sprint workshop or additional programs directly to the user.</p>
                </div>

                {programs.length === 0 ? (
                    <div className="text-xs text-gray-500">No programs available.</div>
                ) : (
                    <div className="space-y-4">
                        {programGroups.sprint.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Sprint Workshops</p>
                                {programGroups.sprint.map((program) => (
                                    <label key={program.id} className="flex items-start gap-2 text-sm text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedPrograms.includes(program.id)}
                                            onChange={() => handleProgramToggle(program.id)}
                                            className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#0F1219] text-dashboard-accent focus:ring-dashboard-accent"
                                        />
                                        <span>{program.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {programGroups.master.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Master Classes</p>
                                {isCompanyMissing && (
                                    <p className="text-xs text-amber-400">
                                        Select a company to assign Master Class programs.
                                    </p>
                                )}
                                {programGroups.master.map((program) => (
                                    <label key={program.id} className="flex items-start gap-2 text-sm text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedPrograms.includes(program.id)}
                                            disabled={isCompanyMissing && !selectedPrograms.includes(program.id)}
                                            onChange={() => handleProgramToggle(program.id)}
                                            className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#0F1219] text-dashboard-accent focus:ring-dashboard-accent disabled:opacity-40"
                                        />
                                        <span>{program.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ModalForm>
    );
}
