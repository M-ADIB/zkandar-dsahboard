import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { Plus, Download, Users, Target, Flame, DollarSign, CheckCircle, Phone, PaintBucket } from 'lucide-react';
import type { Lead, LeadColumn, LeadColumnOption } from '@/types/database';
import { LeadDetailsModal } from '@/components/admin/LeadDetailsModal';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { ColumnSettingsPanel } from '@/components/admin/leads/ColumnSettingsPanel';
import { logAudit } from '@/lib/audit';

// ── Stat card ──────────────────────────────────────────────────────────────────
// Inspired by 21st.dev dark-stats card pattern.
// Pure black bg, subtle decorative circles, Lime #D0FF71 accent on the headline number.
function LeadStatCard({
    label,
    value,
    icon: Icon,
    limeAccent = false,
    iconColor = 'text-gray-500',
}: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    limeAccent?: boolean;
    iconColor?: string;
}) {
    return (
        <div className="relative bg-[#080808] border border-[#1a1a1a] rounded-2xl px-5 pt-5 pb-6 overflow-hidden">
            {/* Decorative background circles (21st.dev style) */}
            <svg
                className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-[0.06]"
                viewBox="0 0 200 160"
                fill="none"
            >
                <circle cx="160" cy="40"  r="70" fill="white" />
                <circle cx="190" cy="110" r="45" fill="white" />
                <circle cx="130" cy="130" r="30" fill="white" />
            </svg>

            {/* Top lime hairline accent */}
            <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D0FF71]/50 to-transparent" />

            <div className="relative z-10">
                {/* Label + icon */}
                <div className="flex items-start justify-between mb-4">
                    <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-500 leading-none">
                        {label}
                    </p>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-[#111] border border-[#1f1f1f] ${iconColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                    </span>
                </div>

                {/* Value */}
                <p className={`text-[1.85rem] font-bold leading-none tabular-nums ${limeAccent ? 'text-[#D0FF71]' : 'text-white'}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}


export function LeadsPage() {
    const supabase = useSupabase();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [showHighlightedOnly, setShowHighlightedOnly] = useState(false);
    const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string } | null>(null);

    const showToast = useCallback((message: string) => {
        setToast({ message });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const queryClient = useQueryClient();
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['leadsData'],
        queryFn: async () => {
            const [leadsQuery, columnsQuery] = await Promise.all([
                supabase.from('leads').select('*').order('updated_at', { ascending: false }),
                supabase.from('lead_columns').select('*').order('order_index', { ascending: true })
            ]);

            if (leadsQuery.error) throw new Error('Unable to load leads: ' + leadsQuery.error.message);
            if (columnsQuery.error) throw new Error('Unable to load lead columns: ' + columnsQuery.error.message);

            return {
                leads: (leadsQuery.data || []) as Lead[],
                columns: (columnsQuery.data || []) as LeadColumn[]
            };
        }
    });

    const leads = data?.leads || [];
    const leadColumns = data?.columns || [];
    const loadError = isError ? (error as Error).message : null;
    const fetchLeads = useCallback(() => { refetch(); }, [refetch]);

    // Real-time subscription — surgical state updates without full refetch
    useEffect(() => {
        const channel = supabase
            .channel('leads-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
                queryClient.setQueryData(['leadsData'], (old: any) => {
                    if (!old) return old;
                    return { ...old, leads: [payload.new as Lead, ...(old.leads || [])] };
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
                queryClient.setQueryData(['leadsData'], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        leads: old.leads?.map((l: Lead) =>
                            l.id === (payload.new as Lead).id ? (payload.new as Lead) : l
                        ) || [],
                    };
                });
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, (payload) => {
                queryClient.setQueryData(['leadsData'], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        leads: old.leads?.filter((l: Lead) => l.id !== (payload.old as any).id) || [],
                    };
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, queryClient]);

    // Handle highlight and priority search params from Dashboard navigation
    useEffect(() => {
        if (!isLoading && leads.length > 0) {
            const hlId = searchParams.get('highlight');
            const priorityFilter = searchParams.get('priority');

            if (hlId) {
                setHighlightId(hlId);
                // Scroll to the highlighted row after a short delay for DOM rendering
                setTimeout(() => {
                    const row = document.getElementById(`lead-row-${hlId}`);
                    if (row) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
                // Clear highlight after animation
                setTimeout(() => setHighlightId(null), 3000);
                // Clean up URL
                searchParams.delete('highlight');
                setSearchParams(searchParams, { replace: true });
            }

            if (priorityFilter) {
                // Clean up URL (the filter will be handled by the table's existing filter UI)
                searchParams.delete('priority');
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [isLoading, leads.length]);

    const handleUpdatePriority = async (leadId: string, newPriority: string) => {
        setIsUpdating(leadId);
        // Optimistic update
        queryClient.setQueryData(['leadsData'], (old: any) => ({
            ...old,
            leads: old?.leads?.map((l: Lead) => l.id === leadId ? { ...l, priority: newPriority as Lead['priority'] } : l) || []
        }));

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
        queryClient.setQueryData(['leadsData'], (old: any) => ({
            ...old,
            leads: old?.leads?.map((l: Lead) => l.id === leadId ? { ...l, [field]: value } : l) || []
        }));

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
            const isNew = !updatedLead.id;
            void logAudit(isNew ? 'lead.create' : 'lead.update', 'lead', updatedLead.id, { name: updatedLead.full_name });
            await fetchLeads();
            setIsModalOpen(false);
            // BUG-8 fix: show success toast after save
            showToast(updatedLead.id ? 'Lead updated successfully' : 'Lead created successfully');
        }
    };

    const handleDeleteLead = async (lead: Lead) => {
        // BUG-6 fix: confirmation is now handled in-modal, so directly delete
        const { error } = await (supabase.from('leads') as any)
            .delete()
            .eq('id', lead.id);

        if (error) {
            console.error('Error deleting lead:', error);
        } else {
            void logAudit('lead.delete', 'lead', lead.id, { name: lead.full_name });
            queryClient.setQueryData(['leadsData'], (old: any) => ({
                ...old,
                leads: old?.leads?.filter((l: Lead) => l.id !== lead.id) || []
            }));
            setIsModalOpen(false);
            setSelectedLead(null);
            // BUG-8 fix: also show toast after delete
            showToast('Lead deleted');
        }
    };

    const formatCsvValue = (value: any) => {
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

        // Dynamically build headers based on visible columns
        const visibleCols = leadColumns.filter(c => c.visible).sort((a, b) => a.order_index - b.order_index);
        const headers = visibleCols.map((column) => escapeCsvValue(column.label));
        const rows = leads.map((lead) => {
            return visibleCols
                .map((column) => {
                    if (column.is_custom) {
                        return escapeCsvValue(formatCsvValue(lead.custom_fields?.[column.key]));
                    } else {
                        return escapeCsvValue(formatCsvValue((lead as any)[column.key]));
                    }
                })
                .join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExporting(false);
    };

    const handleAddColumn = async (label: string, type: string = 'text', options: LeadColumnOption[] = []) => {
        const tempKey = `custom_${Date.now()}`;
        const newCol = {
            key: tempKey,
            label,
            type,
            is_custom: true,
            visible: true,
            order_index: leadColumns.length, // Appended to end
            options,
        };

        const { data, error } = await (supabase.from('lead_columns') as any)
            .insert(newCol)
            .select()
            .single();

        if (error) {
            console.error('Error adding column:', error);
            showToast('Failed to add column');
            return;
        }

        queryClient.setQueryData(['leadsData'], (old: any) => ({
            ...old,
            columns: [...(old?.columns || []), data]
        }));
        showToast('Column added');
    };

    const handleReorderColumn = async (colId: string, direction: 'up' | 'down') => {
        const sorted = [...leadColumns].sort((a, b) => a.order_index - b.order_index);
        const idx = sorted.findIndex(c => c.id === colId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;

        const col = sorted[idx];
        const swapCol = sorted[swapIdx];
        const newOrderA = swapCol.order_index;
        const newOrderB = col.order_index;

        // Optimistic update
        queryClient.setQueryData(['leadsData'], (old: any) => ({
            ...old,
            columns: old?.columns?.map((c: LeadColumn) => {
                if (c.id === col.id) return { ...c, order_index: newOrderA };
                if (c.id === swapCol.id) return { ...c, order_index: newOrderB };
                return c;
            }) || []
        }));

        // Persist both updates
        await Promise.all([
            (supabase.from('lead_columns') as any).update({ order_index: newOrderA }).eq('id', col.id),
            (supabase.from('lead_columns') as any).update({ order_index: newOrderB }).eq('id', swapCol.id),
        ]);
    };

    const handleUpdateColumn = async (colId: string, updates: Partial<LeadColumn>) => {
        // Optimistic update
        queryClient.setQueryData(['leadsData'], (old: any) => ({
            ...old,
            columns: old?.columns?.map((c: LeadColumn) => c.id === colId ? { ...c, ...updates } : c) || []
        }));

        const { error } = await (supabase.from('lead_columns') as any)
            .update(updates)
            .eq('id', colId);

        if (error) {
            console.error('Error updating column:', error);
            showToast('Failed to update column');
            fetchLeads(); // Revert
        }
    };

    const handleDeleteColumn = async (colId: string) => {
        // Optimistic UI updates
        queryClient.setQueryData(['leadsData'], (old: any) => ({
            ...old,
            columns: old?.columns?.filter((c: LeadColumn) => c.id !== colId) || []
        }));

        const { error } = await (supabase.from('lead_columns') as any)
            .delete()
            .eq('id', colId);

        if (error) {
            console.error('Error deleting column:', error);
            showToast('Failed to delete column');
            fetchLeads(); // Revert
        } else {
            showToast('Column deleted');
        }
    };
    const stats = {
        total: leads.length,
        active: leads.filter((l: Lead) => l.priority === 'ACTIVE').length,
        lava: leads.filter((l: Lead) => l.priority === 'LAVA').length,
        followUp: leads.filter((l: Lead) => l.discovery_call_date != null).length,
        // Pipeline value = payment_amount for active/lava leads
        pipelineValue: leads
            .filter((l: Lead) => l.priority === 'ACTIVE' || l.priority === 'LAVA')
            .reduce((sum: number, l: Lead) => sum + (l.payment_amount || 0), 0),
    };

    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat('en-AE', {
                style: 'currency',
                currency: 'AED',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }),
        []
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime/50"></div>
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
        <div className="space-y-6 max-w-full min-w-0 overflow-x-hidden">
            {/* BUG-8 fix: success toast notification */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 bg-bg-elevated border border-lime/30 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CheckCircle className="h-5 w-5 text-lime flex-shrink-0" />
                    <span className="text-sm font-medium text-white">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leads Pipeline</h1>
                    <p className="text-gray-400 mt-1">Manage and track your sales leads</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowHighlightedOnly(!showHighlightedOnly)}
                        className={`flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-colors font-medium border ${showHighlightedOnly ? 'bg-lime/20 text-lime border-lime/50' : 'bg-bg-card text-gray-400 border-border'}`}
                    >
                        <PaintBucket className="h-5 w-5" />
                        <span className="hidden sm:inline">Highlighted</span>
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || leads.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-bg-card hover:bg-white/10 text-white rounded-lg transition-colors font-medium border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-5 w-5" />
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                    <button
                        onClick={() => {
                            setSelectedLead(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 gradient-lime hover:opacity-90 text-black rounded-lg transition-colors font-medium"
                    >
                        <Plus className="h-5 w-5" />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <LeadStatCard label="Total Leads"   value={stats.total}                              icon={Users}      iconColor="text-gray-400" />
                <LeadStatCard label="Lava"          value={stats.lava}                               icon={Flame}      iconColor="text-purple-400" />
                <LeadStatCard label="Pipeline (AED)" value={currencyFormatter.format(stats.pipelineValue)} icon={DollarSign} iconColor="text-yellow-400" />
                <LeadStatCard label="Follow Up"     value={stats.followUp}                           icon={Phone}      iconColor="text-blue-400" />
                <LeadStatCard label="Active"        value={stats.active}                             icon={Target}     iconColor="text-[#D0FF71]" limeAccent />
            </div>

            {/* Table */}
            <LeadsTable
                data={showHighlightedOnly ? leads.filter(l => l.is_highlighted) : leads}
                columnsConfig={leadColumns}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
                onOpenColumnSettings={() => setIsColumnPanelOpen(true)}
                onEdit={(lead) => {
                    setSelectedLead(lead);
                    setIsModalOpen(true);
                }}
                onDelete={handleDeleteLead}
                onUpdatePriority={handleUpdatePriority}
                onUpdateLead={handleUpdateLead}
                isUpdating={isUpdating}
                highlightId={highlightId}
            />

            {/* Column Settings Panel */}
            {isColumnPanelOpen && (
                <ColumnSettingsPanel
                    columns={leadColumns}
                    onClose={() => setIsColumnPanelOpen(false)}
                    onAddColumn={handleAddColumn}
                    onUpdateColumn={handleUpdateColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onReorderColumn={handleReorderColumn}
                />
            )}

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
