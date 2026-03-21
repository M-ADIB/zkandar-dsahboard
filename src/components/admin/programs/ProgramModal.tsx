import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import type { Cohort, CohortStatus, OfferingType } from '@/types/database';

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

export function ProgramModal({ isOpen, onClose, onSuccess, program }: ProgramModalProps) {
    const supabase = useSupabase();
    const [formData, setFormData] = useState<ProgramFormData>(defaultFormData);
    // company_id lives in its own state — no setFormData call can ever reset it.
    const [companyId, setCompanyId] = useState('');
    // Fetch cohort_id alongside companies so we can look up the assigned company synchronously.
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all companies (with their cohort assignment) once on mount.
    useEffect(() => {
        supabase
            .from('companies')
            .select('id, name, cohort_id')
            .order('name')
            .then(({ data }) => {
                setCompanies((data as Company[]) ?? []);
            });
    }, []);

    // Sync form fields whenever the modal opens or the program changes.
    // `companies` is included so that if the list loads after the modal opens,
    // the assigned company is still found correctly.
    useEffect(() => {
        if (program) {
            setFormData({
                name: program.name,
                offering_type: program.offering_type,
                status: program.status,
                start_date: program.start_date?.slice(0, 10) ?? '',
                end_date: program.end_date?.slice(0, 10) ?? '',
                miro_board_url: program.miro_board_url ?? '',
            });
            // Synchronous lookup — no async query, no race condition.
            const assigned = companies.find((c) => c.cohort_id === program.id);
            setCompanyId(assigned?.id ?? '');
            setError(null);
        } else {
            setFormData(defaultFormData);
            setCompanyId('');
            setError(null);
        }
    }, [program, isOpen, companies]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Program name is required.');
            return;
        }

        if (!companyId) {
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

        if (program) {
            // Edit mode: update cohort, then update the company link.
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

            // Unlink any company previously assigned to this program
            // (except the newly selected one), then assign the new company.
            await supabase
                .from('companies')
                // @ts-expect-error - Supabase update type inference issue
                .update({ cohort_id: null })
                .eq('cohort_id', program.id)
                .neq('id', companyId);

            await supabase
                .from('companies')
                // @ts-expect-error - Supabase update type inference issue
                .update({ cohort_id: program.id })
                .eq('id', companyId);
        } else {
            // Create mode: insert cohort, get new ID, then link the company.
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
            if ((newCohort as any)?.id) {
                await supabase
                    .from('companies')
                    // @ts-expect-error - Supabase update type inference issue
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .update({ cohort_id: (newCohort as any).id })
                    .eq('id', companyId);
            }
        }

        setIsLoading(false);
        onSuccess();
    };

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
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    placeholder="e.g. Spring Sprint Workshop"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company <span className="text-red-400">*</span></label>
                <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                >
                    <option value="">Select a company…</option>
                    {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Offering Type</label>
                <select
                    value={formData.offering_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, offering_type: e.target.value as OfferingType }))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                >
                    <option value="sprint_workshop">Sprint Workshop</option>
                    <option value="master_class">Master Class</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as CohortStatus }))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
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
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Miro Board URL</label>
                <input
                    type="url"
                    value={formData.miro_board_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, miro_board_url: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                    placeholder="https://miro.com/..."
                />
            </div>
        </ModalForm>
    );
}
