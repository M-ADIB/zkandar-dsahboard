import { useState } from 'react';
import { Plus } from 'lucide-react';

interface QuickAddLeadProps {
    onAdd: (name: string, company: string) => Promise<boolean>;
}

export function QuickAddLead({ onAdd }: QuickAddLeadProps) {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        const success = await onAdd(name, company);
        setIsSubmitting(false);

        if (success) {
            setName('');
            setCompany('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-dashboard-card p-2 rounded-lg border border-gray-800 mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <input
                    type="text"
                    placeholder="New Lead Name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-dashboard-bg border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-dashboard-accent placeholder-gray-500"
                    disabled={isSubmitting}
                />
            </div>
            <div className="flex-1">
                <input
                    type="text"
                    placeholder="Company (Optional)..."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-dashboard-bg border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-dashboard-accent placeholder-gray-500"
                    disabled={isSubmitting}
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="bg-dashboard-accent hover:bg-dashboard-accent-hover text-dashboard-bg font-bold py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
                {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Plus className="h-4 w-4" />
                )}
                Quick Add
            </button>
        </form>
    );
}
