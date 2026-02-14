import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';

interface AddCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
    const supabase = useSupabase();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        team_size: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await supabase
            .from('companies')
            // @ts-expect-error - Supabase type inference issue
            .insert([{
                name: formData.name,
                industry: formData.industry,
                team_size: parseInt(formData.team_size) || 0,
                // enrollment_date is default now() often, but let's see schema. 
                // Schema usually has default or we send it. database.ts says only 'id' omitted.
                enrollment_date: new Date().toISOString()
            }]);

        setIsLoading(false);

        if (error) {
            console.error('Error creating company:', error);
            alert('Failed to create company');
        } else {
            setFormData({ name: '', industry: '', team_size: '' });
            onSuccess();
        }
    };

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Company"
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Company Name
                </label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. Acme Corp"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Industry
                </label>
                <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. Technology"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Team Size
                </label>
                <input
                    type="number"
                    min="1"
                    value={formData.team_size}
                    onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. 10"
                />
            </div>
        </ModalForm>
    );
}
