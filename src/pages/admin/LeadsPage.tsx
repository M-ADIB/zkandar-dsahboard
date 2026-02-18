import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Plus, Download, Users, Target, Flame, DollarSign } from 'lucide-react';
import type { Lead } from '@/types/database';
import { LeadDetailsModal } from '@/components/admin/LeadDetailsModal';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { QuickAddLead } from '@/components/admin/leads/QuickAddLead';

const EXPORT_COLUMNS: { key: keyof Lead; label: string }[] = [
    { key: 'record_id', label: 'Record ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City' },
    { key: 'description', label: 'Description' },
    { key: 'priority', label: 'Priority' },
    { key: 'discovery_call_date', label: 'Discovery Call Date' },
    { key: 'offering_type', label: 'Offering Type' },
    { key: 'session_type', label: 'Session Type' },
    { key: 'payment_amount', label: 'Payment Amount' },
    { key: 'seats', label: 'Seats' },
    { key: 'balance', label: 'Balance' },
    { key: 'balance_2', label: 'Balance 2' },
    { key: 'coupon_percent', label: 'Coupon Percent' },
    { key: 'coupon_code', label: 'Coupon Code' },
    { key: 'paid_deposit', label: 'Paid Deposit' },
    { key: 'amount_paid', label: 'Amount Paid' },
    { key: 'amount_paid_2', label: 'Amount Paid 2' },
    { key: 'date_of_payment', label: 'Date of Payment' },
    { key: 'date_of_payment_2', label: 'Date of Payment 2' },
    { key: 'date_of_payment_3', label: 'Date of Payment 3' },
    { key: 'payment_plan', label: 'Payment Plan' },
    { key: 'paid_full', label: 'Paid Full' },
    { key: 'balance_dop', label: 'Balance DOP' },
    { key: 'day_slot', label: 'Day Slot' },
    { key: 'time_slot', label: 'Time Slot' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'sessions_done', label: 'Sessions Done' },
    { key: 'booked_support', label: 'Booked Support' },
    { key: 'support_date_booked', label: 'Support Date Booked' },
    { key: 'notes', label: 'Notes' },
    { key: 'priority_changed_at', label: 'Priority Changed At' },
    { key: 'priority_previous_values', label: 'Priority Previous Values' },
    { key: 'owner_id', label: 'Owner ID' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_at', label: 'Updated At' },
];

export function LeadsPage() {
    const supabase = useSupabase();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const fetchLeads = async () => {
        setIsLoading(true);
        setLoadError(null);
        const timeoutMs = 8000;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const timeoutPromise = new Promise<{ data: Lead[] | null; error: Error }>((resolve) => {
            timeoutId = setTimeout(() => {
                resolve({ data: null, error: new Error('Leads fetch timeout') });
            }, timeoutMs);
        });

        try {
            const query = supabase
                .from('leads')
                .select('*')
                .order('updated_at', { ascending: false });

            const result = await Promise.race([query, timeoutPromise]) as { data: Lead[] | null; error: Error | null };

            if (timeoutId) clearTimeout(timeoutId);

            if (result.error) {
                console.error('Error fetching leads:', result.error);
                setLoadError('Unable to load leads. Please try again.');
                setLeads([]);
            } else {
                setLeads(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
            setLoadError('Unable to load leads. Please try again.');
            setLeads([]);
        } finally {
            setIsLoading(false);
        }
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

    const formatCsvValue = (value: Lead[keyof Lead]) => {
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return value.join('; ');
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const escapeCsvValue = (value: string) => {
        if (value.includes('"')) {
            value = value.replace(/"/g, '""');
        }
        if (value.includes(',') || value.includes('\n') || value.includes('\r') || value.includes('"')) {
            return `"${value}"`;
        }
        return value;
    };

    const handleExport = () => {
        if (leads.length === 0) return;

        setIsExporting(true);

        const headers = EXPORT_COLUMNS.map((column) => escapeCsvValue(column.label));
        const rows = leads.map((lead) => {
            return EXPORT_COLUMNS
                .map((column) => escapeCsvValue(formatCsvValue(lead[column.key])))
                .join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsExporting(false);
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

    if (loadError) {
        return (
            <div className="rounded-xl border border-border bg-bg-card/60 px-6 py-8 text-center text-gray-300">
                <p className="text-sm">{loadError}</p>
                <button
                    onClick={fetchLeads}
                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-bg-primary/60 px-4 py-2 text-sm text-gray-100 hover:border-gray-500/60"
                >
                    Retry
                </button>
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
                        onClick={handleExport}
                        disabled={isExporting || leads.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-dashboard-card hover:bg-dashboard-card-hover text-white rounded-lg transition-colors font-medium border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-5 w-5" />
                        {isExporting ? 'Exporting...' : 'Export'}
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
