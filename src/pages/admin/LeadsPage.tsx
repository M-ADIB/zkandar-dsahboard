import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Plus, Download, Users, Target, Flame, DollarSign } from 'lucide-react';
import type { Lead } from '@/types/database';
import { LeadDetailsModal } from '@/components/admin/LeadDetailsModal';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { QuickAddLead } from '@/components/admin/leads/QuickAddLead';

export function LeadsPage() {
    const supabase = useSupabase();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const fetchLeads = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            setLeads(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleUpdatePriority = async (leadId: string, newPriority: string) => {
        setIsUpdating(leadId);
        // Optimistic update
        setLeads((prev: Lead[]) => prev.map((l: Lead) => l.id === leadId ? { ...l, priority: newPriority as Lead['priority'] } : l));

        const { error } = await (supabase.from('leads') as any)
            .update({
                priority: newPriority,
                priority_changed_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) {
            console.error('Error updating priority:', error);
            // Revert on error
            fetchLeads();
        }
        setIsUpdating(null);
    };

    const handleUpdateLead = async (leadId: string, field: keyof Lead, value: any) => {
        // optimistically update local state
        setLeads((prev) => prev.map(l => l.id === leadId ? { ...l, [field]: value } : l));

        const { error } = await (supabase.from('leads') as any)
            .update({
                [field]: value,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) {
            console.error(`Error updating lead ${field}:`, error);
            // revert if error (could add toast notification here)
            fetchLeads();
        }
    };

    const handleQuickAdd = async (name: string, company: string) => {
        try {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) return false;

            const newLead: Partial<Lead> = {
                full_name: name,
                company_name: company,
                priority: 'COLD', // default
                offering_type: 'TBA', // default
                owner_id: user.user.id
            };

            const { data, error } = await (supabase.from('leads') as any)
                .insert([newLead])
                .select()
                .single();

            if (error) throw error;

            setLeads(prev => [data, ...prev]);
            return true;
        } catch (error) {
            console.error('Error adding lead:', error);
            return false;
        }
    };

    const handleSaveLead = async (updatedLead: Lead) => {
        const { error } = await (supabase.from('leads') as any)
            .upsert({
                ...updatedLead,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving lead:', error);
            throw error;
        } else {
            fetchLeads();
            setIsModalOpen(false);
        }
    };

    const handleDeleteLead = async (lead: Lead) => {
        if (!confirm(`Are you sure you want to delete ${lead.full_name}?`)) return;

        const { error } = await (supabase.from('leads') as any)
            .delete()
            .eq('id', lead.id);

        if (error) {
            console.error('Error deleting lead:', error);
        } else {
            setLeads((prev: Lead[]) => prev.filter((l: Lead) => l.id !== lead.id));
            setIsModalOpen(false);
            setSelectedLead(null);
        }
    };

    const stats = {
        total: leads.length,
        active: leads.filter((l: Lead) => l.priority === 'ACTIVE').length,
        hot: leads.filter((l: Lead) => l.priority === 'HOT').length,
        completed: leads.filter((l: Lead) => l.priority === 'COMPLETED').length,
        totalRevenue: leads
            .filter((l: Lead) => l.priority === 'COMPLETED')
            .reduce((sum: number, l: Lead) => sum + (l.payment_amount || 0), 0),
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dashboard-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leads Pipeline</h1>
                    <p className="text-gray-400 mt-1">Manage and track your sales leads</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => console.log('Export CSV')}
                        className="flex items-center gap-2 px-4 py-2 bg-dashboard-card hover:bg-dashboard-card-hover text-white rounded-lg transition-colors font-medium border border-gray-700"
                    >
                        <Download className="h-5 w-5" />
                        Export
                    </button>
                    <button
                        onClick={() => {
                            setSelectedLead(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus className="h-5 w-5" />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 text-sm">Total Leads</div>
                        <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 text-sm">Active</div>
                        <Target className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{stats.active}</div>
                </div>
                <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 text-sm">Hot</div>
                        <Flame className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-red-400">{stats.hot}</div>
                </div>
                <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 text-sm">Completed</div>
                        <div className="h-4 w-4 text-green-500">✓</div>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                </div>
                <div className="bg-dashboard-card border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-400 text-sm">Total Revenue</div>
                        <DollarSign className="h-4 w-4 text-dashboard-accent" />
                    </div>
                    <div className="text-2xl font-bold text-dashboard-accent">
                        ${stats.totalRevenue.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Quick Add and Table */}
            <div className="space-y-4">
                <QuickAddLead onAdd={handleQuickAdd} />

                <LeadsTable
                    data={leads}
                    onEdit={(lead) => {
                        setSelectedLead(lead);
                        setIsModalOpen(true);
                    }}
                    onDelete={handleDeleteLead}
                    onUpdatePriority={handleUpdatePriority}
                    onUpdateLead={handleUpdateLead}
                    isUpdating={isUpdating}
                />
            </div>

            {/* Modal */}
            <LeadDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lead={selectedLead}
                onSave={handleSaveLead}
                onDelete={handleDeleteLead}
            />
        </div>
    );
}
