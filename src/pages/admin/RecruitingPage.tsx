import { useState, useEffect, useRef } from 'react'
import { Search, Filter, ChevronRight, Users, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { JobApplication, ApplicationStatus } from '@/types/database'
import { ApplicationDetailDrawer } from '@/components/admin/recruiting/ApplicationDetailDrawer'
import { SelectionActionBar } from '@/components/admin/shared/SelectionActionBar'
import { BulkDeleteConfirm } from '@/components/admin/shared/BulkDeleteConfirm'
import { toast } from 'react-hot-toast'

const STATUS_CONFIG: Record<ApplicationStatus, { bg: string; text: string; label: string }> = {
    new: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'New' },
    reviewing: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Reviewing' },
    shortlisted: { bg: 'bg-[#D0FF71]/10', text: 'text-[#D0FF71]', label: 'Shortlisted' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Rejected' },
    hired: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Hired' },
}

const POSITION_LABELS: Record<string, string> = {
    sales_closer: 'High-Ticket Closer',
    video_editor: 'Video Editor',
}

const COMPENSATION_LABELS: Record<string, string> = {
    commission_only: 'Commission Only',
    commission_plus_base: 'Commission + Base',
    base_plus_bonus: 'Base + Bonus',
    base_only: 'Base Only',
}

export function RecruitingPage() {
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [positionFilter, setPositionFilter] = useState<string>('all')
    const [compensationFilter, setCompensationFilter] = useState<string>('all')
    const [timezoneFilter, setTimezoneFilter] = useState<string>('all')
    const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [viewTab, setViewTab] = useState<'active' | 'archived'>('active')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const selectAllRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        try {
            setLoading(true)
            const { data, error } = await (supabase
                .from('job_applications') as any)
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setApplications(data || [])
        } catch (err) {
            console.error('Error fetching applications:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = (updated: JobApplication) => {
        setApplications(prev => prev.map(a => a.id === updated.id ? updated : a))
        if (selectedApp?.id === updated.id) setSelectedApp(updated)
    }

    const visibleApps = applications.filter(app => {
        if (viewTab === 'active') return app.status !== 'rejected'
        return app.status === 'rejected'
    })

    const filtered = visibleApps.filter(app => {
        const q = searchTerm.toLowerCase()
        const matchSearch = !q
            || app.full_name.toLowerCase().includes(q)
            || app.email.toLowerCase().includes(q)
            || app.country.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || app.status === statusFilter
        const matchPosition = positionFilter === 'all' || app.position_type === positionFilter
        const matchComp = compensationFilter === 'all' || (app.compensation_model && app.compensation_model === compensationFilter)
        const matchTz = timezoneFilter === 'all' || app.timezone.includes(timezoneFilter)
        return matchSearch && matchStatus && matchPosition && matchComp && matchTz
    })

    // Counts per status for header badges
    const counts = visibleApps.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true)
        const { error } = await (supabase.from('job_applications') as any).delete().in('id', selectedIds)
        setIsBulkDeleting(false)
        if (error) { console.error(error); return }
        toast.success(`${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''} deleted`)
        setApplications(prev => prev.filter(a => !selectedIds.includes(a.id)))
        setSelectedIds([])
        setShowBulkDeleteConfirm(false)
    }

    const allSelected = filtered.length > 0 && selectedIds.length === filtered.length
    const someSelected = selectedIds.length > 0 && !allSelected
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Recruiting</h1>
                    <p className="text-gray-400 text-sm mt-1">Review and manage job applications.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <SelectionActionBar
                            selectedCount={selectedIds.length}
                            onDelete={() => setShowBulkDeleteConfirm(true)}
                        />
                    )}
                    <button
                        onClick={() => window.open('/apply/sales', '_blank')}
                        className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] text-white font-medium rounded-xl hover:border-lime/50 hover:text-lime transition-colors flex items-center gap-2 text-sm"
                    >
                        <ExternalLink className="w-4 h-4 text-[#D0FF71]" />
                        Closer Application Form
                    </button>
                </div>
            </div>

            {/* Top-Level Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-px">
                <button
                    onClick={() => { setViewTab('active'); setStatusFilter('all') }}
                    className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                        viewTab === 'active' 
                        ? 'border-[#D0FF71] text-white' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Active Candidates
                </button>
                <button
                    onClick={() => { setViewTab('archived'); setStatusFilter('all') }}
                    className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                        viewTab === 'archived' 
                        ? 'border-red-500 text-red-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Archive / Rejected
                </button>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-3">
                {(Object.keys(STATUS_CONFIG) as ApplicationStatus[])
                    .filter(s => viewTab === 'active' ? s !== 'rejected' : s === 'rejected')
                    .map(s => {
                    const cfg = STATUS_CONFIG[s]
                    const count = counts[s] || 0
                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                statusFilter === s
                                    ? `${cfg.bg} ${cfg.text} border-current`
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                            }`}
                        >
                            <span>{cfg.label}</span>
                            {count > 0 && (
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
                <span className="ml-auto text-xs text-gray-500 self-center">
                    {filtered.length} / {visibleApps.length} applications
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or country..."
                        className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#D0FF71]/50 transition-colors"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    <select
                        className="bg-[#111] border border-white/5 rounded-xl py-3 px-3 text-white text-sm focus:outline-none focus:border-[#D0FF71]/50 transition-colors cursor-pointer outline-none"
                        value={positionFilter}
                        onChange={e => setPositionFilter(e.target.value)}
                    >
                        <option value="all">All Positions</option>
                        <option value="sales_closer">High-Ticket Closer</option>
                        <option value="video_editor">Video Editor</option>
                    </select>
                    <select
                        className="bg-[#111] border border-white/5 rounded-xl py-3 px-3 text-white text-sm focus:outline-none focus:border-[#D0FF71]/50 transition-colors cursor-pointer outline-none"
                        value={compensationFilter}
                        onChange={e => setCompensationFilter(e.target.value)}
                    >
                        <option value="all">All Comp Models</option>
                        <option value="commission_only">Commission Only</option>
                        <option value="commission_plus_base">Commission + Base</option>
                        <option value="base_plus_bonus">Base + Bonus</option>
                        <option value="base_only">Base Only</option>
                    </select>
                    <select
                        className="bg-[#111] border border-white/5 rounded-xl py-3 px-3 text-white text-sm focus:outline-none focus:border-[#D0FF71]/50 transition-colors cursor-pointer outline-none"
                        value={timezoneFilter}
                        onChange={e => setTimezoneFilter(e.target.value)}
                    >
                        <option value="all">All Timezones</option>
                        <option value="GMT+4">GMT+4 (UAE / Gulf)</option>
                        <option value="GMT+3">GMT+3 (Saudi / Kuwait)</option>
                        <option value="GMT+5">GMT+5 (Pakistan)</option>
                        <option value="GMT+2">GMT+2 (Egypt / Levant)</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-[#0A0A0A]">
                                <th className="w-10 px-4 py-3">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={(e) => setSelectedIds(e.target.checked ? filtered.map(a => a.id) : [])}
                                        className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.05] accent-lime cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Applicant</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Position</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Experience</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Comp Model</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Timezone</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Applied</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-3"></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-32 mb-1"></div><div className="h-3 bg-white/5 rounded w-44"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-28"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-16"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-24"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-20"></div></td>
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-20"></div></td>
                                        <td className="p-4"><div className="h-6 bg-white/5 rounded-full w-20"></div></td>
                                        <td className="p-4"></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center">
                                        <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No applications found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(app => {
                                    const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.new
                                    return (
                                        <tr
                                            key={app.id}
                                            className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${selectedIds.includes(app.id) ? '!bg-lime/5 shadow-[inset_2px_0_0_0_#D0FF71]' : ''}`}
                                            onClick={() => { setSelectedApp(app); setIsDrawerOpen(true) }}
                                        >
                                            <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(app.id)}
                                                    onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, app.id] : selectedIds.filter(id => id !== app.id))}
                                                    className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.05] accent-lime cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-white">{app.full_name}</div>
                                                <div className="text-sm text-gray-400 mt-0.5">{app.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-white">
                                                    {POSITION_LABELS[app.position_type] ?? app.position_type}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-white">{app.years_experience}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{app.avg_deal_size}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-white">
                                                    {app.compensation_model ? (COMPENSATION_LABELS[app.compensation_model] ?? app.compensation_model) : '—'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-white">{app.timezone.split(' ')[0]}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{app.country}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-300">
                                                    {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg inline-flex items-center justify-center transition-colors group-hover:text-[#D0FF71]">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ApplicationDetailDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                application={selectedApp}
                onUpdate={handleUpdate}
            />

            <BulkDeleteConfirm
                isOpen={showBulkDeleteConfirm}
                count={selectedIds.length}
                isLoading={isBulkDeleting}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                itemLabel="application"
            />
        </div>
    )
}
