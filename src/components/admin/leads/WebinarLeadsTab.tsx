import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/hooks/useSupabase'
import { Download, Users, UserPlus, Eye, MailCheck, Search, ChevronDown, CheckCircle, DollarSign } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'

interface WebinarLead {
    id: string
    full_name: string
    email: string
    phone: string | null
    source: string
    status: 'new' | 'contacted' | 'registered' | 'attended' | 'no_show'
    payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded'
    amount_paid: number
    stripe_session_id: string | null
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    contacted: { label: 'Contacted', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    registered: { label: 'Registered', color: 'text-lime', bg: 'bg-lime/10 border-lime/20' },
    attended: { label: 'Attended', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
    no_show: { label: 'No Show', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
}

export function WebinarLeadsTab() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [toast, setToast] = useState<string | null>(null)

    const showToast = useCallback((msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }, [])

    const { data: leads = [], isLoading } = useQuery({
        queryKey: ['webinarLeads'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('webinar_leads')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return (data || []) as WebinarLead[]
        },
    })

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('webinar-leads-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'webinar_leads' }, () => {
                queryClient.invalidateQueries({ queryKey: ['webinarLeads'] })
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [supabase, queryClient])

    const filtered = useMemo(() => {
        let result = leads
        if (statusFilter !== 'all') {
            result = result.filter(l => l.status === statusFilter)
        }
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(l =>
                l.full_name.toLowerCase().includes(q) ||
                l.email.toLowerCase().includes(q) ||
                (l.phone && l.phone.includes(q))
            )
        }
        return result
    }, [leads, statusFilter, search])

    const stats = useMemo(() => ({
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        registered: leads.filter(l => l.status === 'registered').length,
        attended: leads.filter(l => l.status === 'attended').length,
        revenue: leads.reduce((sum, l) => sum + (l.amount_paid || 0), 0),
        paid: leads.filter(l => l.payment_status === 'paid').length,
    }), [leads])

    const handleUpdateStatus = async (id: string, status: string) => {
        // Optimistic
        queryClient.setQueryData(['webinarLeads'], (old: WebinarLead[] | undefined) =>
            (old || []).map(l => l.id === id ? { ...l, status } : l)
        )
        const { error } = await (supabase.from('webinar_leads') as any)
            .update({ status })
            .eq('id', id)
        if (error) {
            queryClient.invalidateQueries({ queryKey: ['webinarLeads'] })
            showToast('Failed to update status')
        } else {
            showToast('Status updated')
        }
    }

    const handleExport = () => {
        if (filtered.length === 0) return
        const headers = ['Name', 'Email', 'Phone', 'Status', 'Payment Status', 'Amount Paid', 'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Created']
        const rows = filtered.map(l => [
            l.full_name, l.email, l.phone || '', l.status, l.payment_status || 'unpaid',
            l.amount_paid ? `$${(l.amount_paid / 100).toFixed(2)}` : '$0',
            l.source || '',
            l.utm_source || '', l.utm_medium || '', l.utm_campaign || '',
            new Date(l.created_at).toLocaleDateString()
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

        const csv = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `webinar_leads_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const formatDate = (d: string) => {
        const date = new Date(d)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatTime = (d: string) => {
        const date = new Date(d)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime/50" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 bg-bg-elevated border border-lime/30 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CheckCircle className="h-5 w-5 text-lime flex-shrink-0" />
                    <span className="text-sm font-medium text-white">{toast}</span>
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard label="Total Leads" value={stats.total} icon={Users} iconColor="text-gray-400" />
                <MetricCard label="New" value={stats.new} icon={UserPlus} iconColor="text-blue-400" />
                <MetricCard label="Registered" value={stats.registered} icon={MailCheck} limeAccent />
                <MetricCard label="Paid" value={stats.paid} icon={DollarSign} iconColor="text-green-400" />
                <MetricCard label="Revenue" value={`$${(stats.revenue / 100).toFixed(0)}`} icon={DollarSign} limeAccent />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email, or phone…"
                            className="w-full bg-white/[0.025] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:border-lime/30 focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="appearance-none bg-white/[0.025] border border-white/[0.06] rounded-lg px-3 py-2 pr-8 text-sm text-white focus:border-lime/30 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-white/[0.025] hover:bg-white/10 text-white rounded-lg transition-colors font-medium border border-white/[0.06] text-sm disabled:opacity-50"
                >
                    <Download className="h-4 w-4" /> Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                                <th className="px-4 py-3 text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold">Name</th>
                                <th className="px-4 py-3 text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold">Email</th>
                                <th className="px-4 py-3 text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold">Phone</th>
                                <th className="px-4 py-3 text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold">Status</th>
                                <th className="px-4 py-3 text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold">Source</th>
                                <th className="px-4 py-3 text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold">Payment</th>
                                <th className="px-4 py-3 text-[0.65rem] uppercase tracking-wider text-gray-500 font-bold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-600 text-sm">
                                        {search || statusFilter !== 'all' ? 'No leads match your filters.' : 'No webinar leads yet. They\'ll appear here when people register through the landing page.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(lead => {
                                    const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
                                    return (
                                        <tr key={lead.id} className="hover:bg-white/[0.015] transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-white">{lead.full_name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <a href={`mailto:${lead.email}`} className="text-sm text-gray-400 hover:text-lime transition-colors">{lead.email}</a>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-500">{lead.phone || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={lead.status}
                                                    onChange={e => handleUpdateStatus(lead.id, e.target.value)}
                                                    className={`appearance-none text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${sc.bg} ${sc.color}`}
                                                >
                                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                        <option key={key} value={key}>{cfg.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-gray-600">{lead.source || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {lead.payment_status === 'paid' ? (
                                                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-green-400/10 text-green-400 border border-green-400/20">
                                                        ${((lead.amount_paid || 0) / 100).toFixed(0)} paid
                                                    </span>
                                                ) : lead.payment_status === 'pending' ? (
                                                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                                                        Pending
                                                    </span>
                                                ) : lead.payment_status === 'refunded' ? (
                                                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-red-400/10 text-red-400 border border-red-400/20">
                                                        Refunded
                                                    </span>
                                                ) : (
                                                    <span className="text-[0.65rem] text-gray-700">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-gray-400">{formatDate(lead.created_at)}</div>
                                                <div className="text-[0.6rem] text-gray-600">{formatTime(lead.created_at)}</div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-xs text-gray-600 text-center">
                Showing {filtered.length} of {leads.length} total leads
            </p>
        </div>
    )
}
