import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, ExternalLink } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { ProposalModal } from '@/components/admin/proposals/ProposalModal';
import { formatDateLabel } from '@/lib/time';
import { toast } from 'react-hot-toast';

export interface MasterclassProposal {
    id: string;
    slug: string;
    prepared_for: string;
    company_name: string;
    prepared_by: string;
    total_investment: number;
    agreement_pdf_url: string | null;
    duration: string;
    delivery_format: string;
    team_capacity: string;
    session_style: string;
    recommended_audience: string[];
    modules: any[];
    whats_included: string[];
    expected_outcomes: string[];
    created_at: string;
    updated_at: string;
}

export function ProposalsPage() {
    const supabase = useSupabase();
    const [proposals, setProposals] = useState<MasterclassProposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<MasterclassProposal | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchProposals = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('masterclass_proposals')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) {
                setError(fetchError.message);
            } else {
                setProposals((data as MasterclassProposal[]) || []);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred fetching proposals');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    const handleDelete = async (proposal: MasterclassProposal) => {
        if (!confirm(`Are you sure you want to delete the proposal for ${proposal.company_name}? This cannot be undone.`)) return;
        
        try {
            const { error: deleteError } = await supabase
                .from('masterclass_proposals')
                .delete()
                .eq('id', proposal.id);

            if (deleteError) {
                toast.error(`Error: ${deleteError.message}`);
            } else {
                toast.success('Proposal deleted successfully');
                fetchProposals();
            }
        } catch (err: any) {
            toast.error(err.message || 'An error occurred during deletion');
        }
    };

    const columns = useMemo(() => [
        { 
            header: 'Company Name', 
            accessor: 'company_name' as keyof MasterclassProposal, 
            className: 'font-medium text-white' 
        },
        { 
            header: 'Prepared For', 
            accessor: 'prepared_for' as keyof MasterclassProposal, 
            className: 'text-gray-300' 
        },
        { 
            header: 'Slug / URL', 
            accessor: (p: MasterclassProposal) => (
                <span className="text-lime text-xs font-mono">/masterclass/{p.slug}</span>
            ),
        },
        { 
            header: 'Investment', 
            accessor: (p: MasterclassProposal) => (
                <span className="text-white font-medium">
                    AED {p.total_investment.toLocaleString()}
                </span>
            ),
        },
        {
            header: 'Date Created',
            accessor: (p: MasterclassProposal) => (
                <span className="text-gray-400 text-sm">{formatDateLabel(p.created_at) || 'TBD'}</span>
            ),
        },
        {
            header: '',
            accessor: (p: MasterclassProposal) => (
                <a
                    href={`/masterclass/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-lime hover:text-lime/80 text-sm font-medium inline-flex items-center gap-1"
                >
                    View Page <ExternalLink className="h-3 w-3" />
                </a>
            ),
        },
    ], []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-9 w-9 rounded-xl bg-lime/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-lime" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Proposals</h1>
                    </div>
                    <p className="text-gray-400 text-sm pl-12">Manage dynamic masterclass client agreements and landing pages</p>
                </div>
                <button
                    onClick={() => { setSelectedProposal(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 gradient-lime text-black rounded-xl transition font-medium hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    New Proposal
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <AdminTable
                data={proposals}
                columns={columns}
                isLoading={isLoading}
                onEdit={(p) => { setSelectedProposal(p); setIsModalOpen(true); }}
                onDelete={handleDelete}
                onRowClick={(p) => { setSelectedProposal(p); setIsModalOpen(true); }}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                getRowUrl={(p) => `/masterclass/${p.slug}`}
            />

            <ProposalModal
                key={isModalOpen ? (selectedProposal?.id ?? 'new') : 'closed'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                proposal={selectedProposal}
                onSuccess={() => { setIsModalOpen(false); setSelectedProposal(null); fetchProposals(); }}
            />
        </div>
    );
}
