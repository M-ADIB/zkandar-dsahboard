import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import type { Cohort, Company, User } from '@/types/database';

interface CompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    company?: Company | null;
    programs: Cohort[];
    users: User[];
}

type CompanyFormData = {
    name: string;
    industry: string;
    team_size: string;
    enrollment_date: string;
    cohort_id: string;
    executive_user_id: string;
};

const defaultFormData: CompanyFormData = {
    name: '',
    industry: '',
    team_size: '',
    enrollment_date: '',
    cohort_id: '',
    executive_user_id: '',
};

const toDateInputValue = (isoDate: string | null | undefined) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export function CompanyModal({
    isOpen,
    onClose,
    onSuccess,
    company,
    programs,
    users,
}: CompanyModalProps) {
    const supabase = useSupabase();
    const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name,
                industry: company.industry ?? '',
                team_size: company.team_size ? String(company.team_size) : '',
                enrollment_date: toDateInputValue(company.enrollment_date),
                cohort_id: company.cohort_id ?? '',
                executive_user_id: company.executive_user_id ?? '',
            });
        } else {
            setFormData(defaultFormData);
        }
        setError(null);
    }, [company, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Company name is required.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const payload = {
            name: formData.name.trim(),
            industry: formData.industry.trim() || null,
            team_size: formData.team_size ? parseInt(formData.team_size, 10) : 0,
            enrollment_date: formData.enrollment_date || null,
            cohort_id: formData.cohort_id || null,
            executive_user_id: formData.executive_user_id || null,
        };

        const { error: saveError } = company
            ? await supabase.from('companies')
                // @ts-expect-error - Supabase update type inference issue
                .update(payload)
                .eq('id', company.id)
            : await supabase.from('companies')
                // @ts-expect-error - Supabase insert type inference issue
                .insert(payload);

        setIsLoading(false);

        if (saveError) {
            setError(saveError.message);
            return;
        }

        onSuccess();
    };

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={company ? 'Edit Company' : 'Add Company'}
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. Acme Studio"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
                <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. Architecture"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Team Size</label>
                    <input
                        type="number"
                        min="0"
                        value={formData.team_size}
                        onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                        placeholder="e.g. 12"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Enrollment Date</label>
                    <input
                        type="date"
                        value={formData.enrollment_date}
                        onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Program (Master Class)</label>
                <select
                    value={formData.cohort_id}
                    onChange={(e) => setFormData({ ...formData, cohort_id: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                >
                    <option value="">Unassigned</option>
                    {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                            {program.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Executive User</label>
                <select
                    value={formData.executive_user_id}
                    onChange={(e) => setFormData({ ...formData, executive_user_id: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                        </option>
                    ))}
                </select>
            </div>
        </ModalForm>
    );
}
