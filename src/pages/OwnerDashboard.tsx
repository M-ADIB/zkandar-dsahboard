import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    DollarSign, Flame, Building2, Calendar,
    Users, BarChart3, ArrowRight, TrendingUp,
    ChevronRight, Clock, CheckCircle2,
} from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import type { Cohort, Company, Lead, Session, User } from '@/types/database'

// ─── Small helpers ────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString()

function KPICard({
    icon: Icon, label, value, sub, trend, delay = 0, onClick, accent = false,
}: {
    icon: React.ElementType
    label: string
    value: string
    sub?: string
    trend?: string
    delay?: number
    onClick?: () => void
    accent?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className={`relative bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 overflow-hidden ${onClick ? 'cursor-pointer hover:border-lime/40 transition-colors' : ''}`}
        >
            {accent && (
                <div className="absolute inset-0 bg-lime/5 pointer-events-none" />
            )}
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${accent ? 'bg-lime/20' : 'bg-white/5'} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${accent ? 'text-lime' : 'text-gray-400'}`} />
                </div>
                {trend && (
                    <span className="text-xs text-lime bg-lime/10 px-2 py-1 rounded-lg border border-lime/20 font-medium">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold text-white leading-none">{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
            <p className="text-sm text-gray-400">{label}</p>
            {onClick && <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />}
        </motion.div>
    )
}

// ─── Status pill ─────────────────────────────────────────────────────────────
const priorityStyle: Record<string, string> = {
    HOT: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    ACTIVE: 'bg-lime/10 text-lime border-lime/30',
    COLD: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    COMPLETED: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    'NOT INTERESTED': 'bg-red-500/10 text-red-300 border-red-500/30',
    LAVA: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
}

// ─── Lead status bar ─────────────────────────────────────────────────────────
function LeadsStatusBar({ counts }: { counts: Record<string, number> }) {
    const total = Object.values(counts).reduce((s, v) => s + v, 0)
    if (total === 0) return null

    const segments = [
        { key: 'HOT', label: 'Hot', color: '#F97316' },
        { key: 'ACTIVE', label: 'Active', color: '#D0FF71' },
        { key: 'LAVA', label: 'Lava', color: '#8B5CF6' },
        { key: 'COLD', label: 'Cold', color: '#60A5FA' },
        { key: 'COMPLETED', label: 'Completed', color: '#6B7280' },
        { key: 'NOT INTERESTED', label: 'Not Int.', color: '#EF4444' },
    ]

    return (
        <div className="space-y-3">
            <div className="flex h-3 rounded-full overflow-hidden w-full gap-px">
                {segments.map(({ key, color }) => {
                    const pct = ((counts[key] || 0) / total) * 100
                    if (pct === 0) return null
                    return (
                        <motion.div
                            key={key}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ backgroundColor: color }}
                            className="h-full first:rounded-l-full last:rounded-r-full"
                        />
                    )
                })}
            </div>
            <div className="flex flex-wrap gap-3">
                {segments.map(({ key, label, color }) => {
                    const count = counts[key] || 0
                    if (count === 0) return null
                    return (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            {label}: <span className="text-white font-medium">{count}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Company health mini-card ─────────────────────────────────────────────────
function CompanyCard({ company, cohort, memberCount, progress, onClick }: {
    company: Company
    cohort: Cohort | null
    memberCount: number
    progress: number
    onClick: () => void
}) {
    const statusBadge: Record<string, string> = {
        active: 'bg-lime/10 text-lime border-lime/30',
        upcoming: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        completed: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
    }

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-lime/30 hover:bg-white/5 transition cursor-pointer"
        >
            <div className="h-10 w-10 rounded-xl gradient-lime flex items-center justify-center shrink-0">
                <span className="text-black font-bold">{company.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{company.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                    {cohort ? ` · ${cohort.name}` : ' · No program'}
                </p>
                {cohort && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-lime rounded-full"
                            />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{Math.round(progress)}%</span>
                    </div>
                )}
            </div>
            {cohort && (
                <span className={`px-2 py-0.5 text-xs rounded-lg border ${statusBadge[cohort.status]} shrink-0`}>
                    {cohort.status}
                </span>
            )}
        </div>
    )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function OwnerDashboard() {
    const supabase = useSupabase()
    const navigate = useNavigate()

    const [companies, setCompanies] = useState<Company[]>([])
    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [recentLeads, setRecentLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const [coRes, cohRes, sessRes, usersRes, leadsRes, recentLeadsRes] = await Promise.all([
                supabase.from('companies').select('*').order('name'),
                supabase.from('cohorts').select('*').order('start_date', { ascending: false }),
                supabase.from('sessions').select('id,cohort_id,status,scheduled_date,session_number').order('scheduled_date', { ascending: true }),
                supabase.from('users').select('id,role,company_id,onboarding_completed').order('created_at'),
                supabase.from('leads').select('id,priority,payment_amount,amount_paid'),
                supabase.from('leads').select('id,full_name,company_name,priority,offering_type,created_at').order('created_at', { ascending: false }).limit(5),
            ])
            setCompanies((coRes.data as Company[]) ?? [])
            setCohorts((cohRes.data as Cohort[]) ?? [])
            setSessions((sessRes.data as Session[]) ?? [])
            setUsers((usersRes.data as User[]) ?? [])
            setLeads((leadsRes.data as Lead[]) ?? [])
            setRecentLeads((recentLeadsRes.data as Lead[]) ?? [])
            setLoading(false)
        }
        fetch()
    }, [])

    // ── KPI calculations ──
    const cohortMap = useMemo(() => new Map(cohorts.map((c) => [c.id, c])), [cohorts])

    const activeCompanies = useMemo(() =>
        companies.filter((c) => c.cohort_id && cohortMap.get(c.cohort_id)?.status === 'active').length
        , [companies, cohortMap])

    const leadCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        leads.forEach((l) => { if (l.priority) counts[l.priority] = (counts[l.priority] || 0) + 1 })
        return counts
    }, [leads])

    const hotLeads = (leadCounts['HOT'] || 0) + (leadCounts['LAVA'] || 0)

    const pipelineValue = useMemo(() => {
        return leads
            .filter((l) => l.priority === 'HOT' || l.priority === 'ACTIVE' || l.priority === 'LAVA')
            .reduce((sum, l) => sum + (l.payment_amount ?? 0), 0)
    }, [leads])

    const completedRevenue = useMemo(() =>
        leads.filter((l) => l.priority === 'COMPLETED').reduce((sum, l) => sum + (l.amount_paid ?? 0), 0)
        , [leads])

    const totalMembers = useMemo(() =>
        users.filter((u) => u.role === 'participant' || u.role === 'executive').length
        , [users])

    const surveyCompletion = useMemo(() => {
        const members = users.filter((u) => u.role === 'participant' || u.role === 'executive')
        if (members.length === 0) return 0
        return Math.round((members.filter((u) => u.onboarding_completed).length / members.length) * 100)
    }, [users])

    const nextSession = useMemo(() => {
        const now = new Date().toISOString()
        return sessions.find((s) => s.status === 'scheduled' && s.scheduled_date && s.scheduled_date > now) ?? null
    }, [sessions])

    const nextSessionLabel = useMemo(() => {
        if (!nextSession?.scheduled_date) return 'None scheduled'
        const d = new Date(nextSession.scheduled_date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }, [nextSession])

    // Company health
    const companyHealth = useMemo(() => {
        const memberMap = new Map<string, number>()
        users.forEach((u) => { if (u.company_id) memberMap.set(u.company_id, (memberMap.get(u.company_id) || 0) + 1) })

        const sesssByProgram = new Map<string, { total: number; done: number }>()
        sessions.forEach((s) => {
            const cur = sesssByProgram.get(s.cohort_id) ?? { total: 0, done: 0 }
            sesssByProgram.set(s.cohort_id, {
                total: cur.total + 1,
                done: cur.done + (s.status === 'completed' ? 1 : 0),
            })
        })

        return companies.map((c) => {
            const cohort = c.cohort_id ? cohortMap.get(c.cohort_id) ?? null : null
            const prog = cohort ? sesssByProgram.get(cohort.id) : null
            const progress = prog && prog.total > 0 ? (prog.done / prog.total) * 100 : 0
            return { company: c, cohort, memberCount: memberMap.get(c.id) ?? 0, progress }
        })
    }, [companies, cohortMap, users, sessions])

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
        </div>
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Everything you need to know at a glance</p>
            </div>

            {/* ── Row 1: KPIs ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard
                    icon={DollarSign}
                    label="Pipeline Value"
                    value={`AED ${fmt(pipelineValue)}`}
                    sub={`AED ${fmt(completedRevenue)} collected`}
                    delay={0}
                    accent
                    onClick={() => navigate('/admin/leads')}
                />
                <KPICard
                    icon={Flame}
                    label="Hot Leads"
                    value={String(hotLeads)}
                    sub={`${leads.length} total leads`}
                    trend={hotLeads > 0 ? `${leadCounts['LAVA'] ?? 0} lava` : undefined}
                    delay={0.05}
                    onClick={() => navigate('/admin/leads')}
                />
                <KPICard
                    icon={Building2}
                    label="Active Companies"
                    value={String(activeCompanies)}
                    sub={`of ${companies.length} total`}
                    delay={0.1}
                    onClick={() => navigate('/admin/companies')}
                />
                <KPICard
                    icon={Calendar}
                    label="Next Session"
                    value={nextSessionLabel}
                    sub={nextSession ? `Session ${nextSession.session_number ?? '?'}` : 'All caught up'}
                    delay={0.15}
                    onClick={() => navigate('/admin/programs')}
                />
                <KPICard
                    icon={BarChart3}
                    label="Survey Completion"
                    value={`${surveyCompletion}%`}
                    sub={`of enrolled members`}
                    delay={0.2}
                    onClick={() => navigate('/analytics')}
                />
                <KPICard
                    icon={Users}
                    label="Total Members"
                    value={String(totalMembers)}
                    sub="executives + participants"
                    delay={0.25}
                    onClick={() => navigate('/settings')}
                />
            </div>

            {/* ── Row 2: Leads status + Recent leads ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Leads Status Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-3 bg-bg-card border border-border rounded-2xl p-6 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-lime" />
                            Leads by Status
                        </h2>
                        <button
                            onClick={() => navigate('/admin/leads')}
                            className="text-xs text-gray-400 hover:text-lime transition flex items-center gap-1"
                        >
                            View all <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                    <LeadsStatusBar counts={leadCounts} />

                    {/* Mini stat row */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                        {[
                            { label: 'Active', count: leadCounts['ACTIVE'] ?? 0, color: 'text-lime' },
                            { label: 'Completed', count: leadCounts['COMPLETED'] ?? 0, color: 'text-gray-300' },
                            { label: 'Not Interested', count: leadCounts['NOT INTERESTED'] ?? 0, color: 'text-red-400' },
                        ].map(({ label, count, color }) => (
                            <div key={label} className="bg-bg-elevated rounded-xl p-3 text-center">
                                <p className={`text-lg font-bold ${color}`}>{count}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Leads */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-lime" />
                            Recent Leads
                        </h2>
                        <button
                            onClick={() => navigate('/admin/leads')}
                            className="text-xs text-gray-400 hover:text-lime transition flex items-center gap-1"
                        >
                            All <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="flex-1 space-y-2">
                        {recentLeads.length === 0 ? (
                            <p className="text-gray-500 text-sm">No leads yet</p>
                        ) : recentLeads.map((lead) => (
                            <div
                                key={lead.id}
                                onClick={() => navigate('/admin/leads')}
                                className="flex items-center gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 transition"
                            >
                                <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-gray-300">{(lead.full_name || '?').charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{lead.full_name}</p>
                                    <p className="text-xs text-gray-500 truncate">{lead.offering_type ?? 'No offering'}</p>
                                </div>
                                {lead.priority && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] border font-medium ${priorityStyle[lead.priority] ?? 'border-border text-gray-400'}`}>
                                        {lead.priority}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Row 3: Company health ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-bg-card border border-border rounded-2xl p-6"
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-lime" />
                        Company Progress
                    </h2>
                    <button
                        onClick={() => navigate('/admin/companies')}
                        className="text-xs text-gray-400 hover:text-lime transition flex items-center gap-1"
                    >
                        Manage companies <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
                {companyHealth.length === 0 ? (
                    <p className="text-gray-500 text-sm">No companies added yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {companyHealth.map(({ company, cohort, memberCount, progress }) => (
                            <CompanyCard
                                key={company.id}
                                company={company}
                                cohort={cohort}
                                memberCount={memberCount}
                                progress={progress}
                                onClick={() => navigate(`/admin/companies/${company.id}`)}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
