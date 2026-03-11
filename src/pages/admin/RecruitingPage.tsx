import { useState, useEffect } from 'react'
import { Search, Filter, ChevronRight, Users, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { JobApplication, ApplicationStatus } from '@/types/database'
import { ApplicationDetailDrawer } from '@/components/admin/recruiting/ApplicationDetailDrawer'

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

    const filtered = applications.filter(app => {
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
    const counts = applications.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black font-base-neue text-white tracking-widest uppercase mb-2">
                        Recruiting
                    </h1>
                    <p className="text-gray-400">Review and manage job applications.</p>
                </div>
                <button
                    onClick={() => window.open('/apply/sales', '_blank')}
                    className="px-5 py-3 bg-[#111] hover:bg-[#1A1A1A] text-white font-medium rounded-xl border border-white/10 transition-colors flex items-center gap-2 text-sm"
                >
                    <ExternalLink className="w-4 h-4 text-[#D0FF71]" />
                    Closer Application Form
                </button>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
                {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map(s => {
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
                    {filtered.length} / {applications.length} applications
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
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
                                    <td colSpan={8} className="p-12 text-center">
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
                                            className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                            onClick={() => { setSelectedApp(app); setIsDrawerOpen(true) }}
                                        >
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
        </div>
    )
}
