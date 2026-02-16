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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (program) {
            setFormData({
                name: program.name,
                offering_type: program.offering_type,
                status: program.status,
                start_date: program.start_date,
                end_date: program.end_date,
                miro_board_url: program.miro_board_url ?? '',
            });
            setError(null);
        } else {
            setFormData(defaultFormData);
            setError(null);
        }
    }, [program, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Program name is required.');
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

        const { error: saveError } = program
            ? await supabase.from('cohorts')
                // @ts-expect-error - Supabase update type inference issue
                .update(payload)
                .eq('id', program.id)
            : await supabase.from('cohorts')
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. Spring Sprint Workshop"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Offering Type</label>
                <select
                    value={formData.offering_type}
                    onChange={(e) => setFormData({ ...formData, offering_type: e.target.value as OfferingType })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                >
                    <option value="sprint_workshop">Sprint Workshop</option>
                    <option value="master_class">Master Class</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CohortStatus })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
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
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Miro Board URL</label>
                <input
                    type="url"
                    value={formData.miro_board_url}
                    onChange={(e) => setFormData({ ...formData, miro_board_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="https://miro.com/..."
                />
            </div>
        </ModalForm>
    );
}
