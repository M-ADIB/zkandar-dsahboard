import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MetricCard } from '@/components/shared/MetricCard'
import { PipelineStatCard } from '@/components/dashboard/PipelineStatCard'
import { motion } from 'framer-motion'
import {
    DollarSign, Flame, Building2, Mic,
    Users, ArrowRight, TrendingUp,
    ChevronRight, CheckCircle2,
} from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import type { Cohort, Company, Lead, Session, User, EventRequest } from '@/types/database'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from 'date-fns'

// ─── Small helpers ────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString()

// ─── Lead status bar ─────────────────────────────────────────────────────────
function LeadsStatusBar({ counts }: { counts: Record<string, number> }) {
    const total = Object.values(counts).reduce((s, v) => s + v, 0)
    if (total === 0) return null

    const segments = [
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

// ─── Calendar Event Type Colors ───────────────────────────────────────────────
const eventTypeColors: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    master_class: { bg: 'bg-lime/10', text: 'text-lime', dot: 'bg-lime', label: 'Masterclass' },
    sprint_workshop: { bg: 'bg-orange-500/10', text: 'text-orange-300', dot: 'bg-orange-400', label: 'Sprint Workshop' },
    ai_talk: { bg: 'bg-purple-500/10', text: 'text-purple-300', dot: 'bg-purple-400', label: 'AI Talk' },
}

// ─── Mini Calendar Widget ─────────────────────────────────────────────────────
function CalendarWidget({ cohorts, eventsData }: { cohorts: Cohort[], eventsData: EventRequest[] }) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startPadding = getDay(monthStart)

    // Map events from cohorts and approved event requests
    const events = useMemo(() => {
        const cohortEvents = cohorts
            .filter(c => c.start_date)
            .map(c => ({
                date: c.start_date!,
                name: c.name,
                type: (c as any).offering_type || 'master_class',
                status: c.status,
            }))

        const requestEvents = eventsData
            .filter(e => e.proposed_date)
            .map(e => {
                // Safely handle timestamp strings by extracting the YYYY-MM-DD part
                const dateString = typeof e.proposed_date === 'string' 
                    ? e.proposed_date.split('T')[0] 
                    : String(e.proposed_date);
                    
                return {
                    date: dateString,
                    name: e.company ? `${e.company} Talk` : 'AI Talk',
                    type: 'ai_talk',
                    status: e.status,
                }
            })

        return [...cohortEvents, ...requestEvents]
    }, [cohorts, eventsData])

    const getEventsForDay = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        return events.filter(e => e.date === dayStr)
    }

    const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))

    return (
        <div className="space-y-4">
            {/* Month nav */}
            <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <span className="text-sm font-medium text-white">{format(currentDate, 'MMMM yyyy')}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-[10px] text-gray-600 font-medium py-1">{d}</div>
                ))}
                {Array.from({ length: startPadding }).map((_, i) => (
                    <div key={`pad-${i}`} />
                ))}
                {daysInMonth.map(day => {
                    const dayEvents = getEventsForDay(day)
                    const today = isToday(day)
                    const sameMonth = isSameMonth(day, currentDate)

                    return (
                        <div
                            key={day.toISOString()}
                            className={`relative h-8 flex items-center justify-center rounded-lg text-xs transition ${today ? 'bg-lime/20 text-lime font-bold' :
                                sameMonth ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700'
                                }`}
                        >
                            {format(day, 'd')}
                            {dayEvents.length > 0 && (
                                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                    {dayEvents.slice(0, 3).map((e, i) => {
                                        const colors = eventTypeColors[e.type] || eventTypeColors.master_class
                                        return <span key={i} className={`h-1 w-1 rounded-full ${colors.dot}`} />
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                {Object.values(eventTypeColors).map(({ dot, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span className={`h-2 w-2 rounded-full ${dot}`} />
                        {label}
                    </div>
                ))}
            </div>

            {/* Upcoming events list */}
            <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Upcoming</p>
                {events.length === 0 ? (
                    <p className="text-xs text-gray-600">No events scheduled</p>
                ) : (
                    events
                        .filter(e => e.date >= format(new Date(), 'yyyy-MM-dd'))
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .slice(0, 4)
                        .map((e, i) => {
                            const colors = eventTypeColors[e.type] || eventTypeColors.master_class
                            return (
                                <div key={i} className="flex items-center gap-2.5 py-1.5">
                                    <span className={`h-2 w-2 rounded-full ${colors.dot} shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-white truncate">{e.name}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-500 shrink-0">
                                        {format(parseISO(e.date), 'MMM d')}
                                    </span>
                                </div>
                            )
                        })
                )}
            </div>
        </div>
    )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function OwnerDashboard() {
    const supabase = useSupabase()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    useEffect(() => {
        const channel = supabase.channel('dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                queryClient.invalidateQueries({ queryKey: ['ownerDashboardData'] })
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cohorts' }, () => {
                queryClient.invalidateQueries({ queryKey: ['ownerDashboardData'] })
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
                queryClient.invalidateQueries({ queryKey: ['ownerDashboardData'] })
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_requests' }, () => {
                queryClient.invalidateQueries({ queryKey: ['ownerDashboardData'] })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient])

    const { data, isLoading: loading } = useQuery({
        queryKey: ['ownerDashboardData', monthStart, monthEnd],
        queryFn: async () => {
            const [coRes, cohRes, sessRes, usersRes, leadsRes, costsRes, eventsRes] = await Promise.all([
                supabase.from('companies').select('*').order('name'),
                supabase.from('cohorts').select('*').order('start_date', { ascending: false }),
                supabase.from('sessions').select('id,cohort_id,status,scheduled_date,session_number').order('scheduled_date', { ascending: true }),
                supabase.from('users').select('id,role,company_id,onboarding_completed').order('created_at'),
                supabase.from('leads').select('id,priority,payment_amount,amount_paid,balance,paid_full,offering_type'),
                (supabase as any).from('costs').select('total_amount, payment_date, is_active'),
                supabase.from('event_requests').select('*').eq('status', 'approved')
            ])
            const costsData = (costsRes as any).data ?? []
            
            // Monthly costs = any cost that is recurring (is_active) OR any one-off cost that occurred specifically this month
            const monthlyCostsScore = costsData.reduce((s: number, c: any) => {
                const isActive = c.is_active === true
                const isThisMonth = c.payment_date && c.payment_date >= monthStart && c.payment_date <= monthEnd
                
                if (isActive || isThisMonth) {
                    return s + (c.total_amount ?? 0)
                }
                return s
            }, 0)

            return {
                companies: (coRes.data as Company[]) ?? [],
                cohorts: (cohRes.data as Cohort[]) ?? [],
                sessions: (sessRes.data as Session[]) ?? [],
                users: (usersRes.data as User[]) ?? [],
                leads: (leadsRes.data as Lead[]) ?? [],
                monthlyCosts: monthlyCostsScore,
                eventsData: (eventsRes.data as EventRequest[]) ?? []
            }
        }
    })

    const companies = data?.companies ?? []
    const cohorts = data?.cohorts ?? []
    const sessions = data?.sessions ?? []
    const users = data?.users ?? []
    const leads = data?.leads ?? []
    const monthlyCosts = data?.monthlyCosts ?? 0
    const eventsData = data?.eventsData ?? []

    // ── KPI calculations ──
    const cohortMap = useMemo(() => new Map(cohorts.map((c) => [c.id, c])), [cohorts])

    const leadCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        leads.forEach((l) => { if ((l as any).priority) counts[(l as any).priority] = (counts[(l as any).priority] || 0) + 1 })
        return counts
    }, [leads])

    const lavaLeads = leadCounts['LAVA'] || 0

    const pipelineValue = useMemo(() => {
        return leads.reduce((sum, l) => sum + (Number((l as any).payment_amount) || 0), 0)
    }, [leads])

    const completedRevenue = useMemo(() =>
        leads.filter((l) => (l as any).priority === 'COMPLETED').reduce((sum, l) => sum + ((l as any).amount_paid ?? 0), 0)
        , [leads])

    // Active masterclasses = cohorts with offering_type='master_class' and status='active'
    const activeMasterclasses = useMemo(() =>
        cohorts.filter(c => (c as any).offering_type === 'master_class' && c.status === 'active').length
        , [cohorts])

    // Active AI Talks = cohorts with offering_type that matches ai_talk or leads with offering_type ai_talk, PLUS approved event_requests
    const activeAITalks = useMemo(() => {
        const cohortTalks = cohorts.filter(c => ((c as any).offering_type === 'ai_talk') && c.status === 'active').length
        const leadTalks = leads.filter(l => (l as any).offering_type === 'ai_talk' && ((l as any).priority === 'ACTIVE' || (l as any).priority === 'LAVA')).length
        const eventTalks = eventsData.length
        return cohortTalks + leadTalks + eventTalks
    }, [cohorts, leads, eventsData])

    const activeMembers = useMemo(() =>
        users.filter((u) => u.role === 'participant' || u.role === 'executive').length
        , [users])

    const conversionRate = useMemo(() => {
        if (leads.length === 0) return 0
        return Math.round(((leadCounts['COMPLETED'] || 0) / leads.length) * 100)
    }, [leads, leadCounts])

    // Pending = leads where paid_full is not true/yes and priority is not 'NOT INTERESTED' and not 'COMPLETED'
    const pendingLeads = useMemo(() =>
        leads.filter(l => {
            const p = (l as any).priority
            // Safely handle both boolean true/false and string "yes"/"no" from before migration
            const paidFullStr = String((l as any).paid_full || '').toLowerCase()
            const isPaid = paidFullStr === 'true' || paidFullStr === 'yes'
            return p !== 'NOT INTERESTED' && p !== 'COMPLETED' && !isPaid
        }).length
        , [leads])



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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                <MetricCard
                    icon={DollarSign}
                    label="Pipeline Value"
                    value={`AED ${fmt(pipelineValue)}`}
                    sub={`AED ${fmt(completedRevenue)} collected`}
                    delay={0}
                    limeAccent
                    onClick={() => navigate('/admin/leads?priority=COMPLETED')}
                />
                <MetricCard
                    icon={Flame}
                    label="Lava Leads"
                    value={String(lavaLeads)}
                    sub={`${leads.length} total leads`}
                    trend={lavaLeads > 0 ? `${lavaLeads} active` : undefined}
                    delay={0.05}
                    onClick={() => navigate('/admin/leads?priority=LAVA')}
                />
                <MetricCard
                    icon={Building2}
                    label="Active Masterclasses"
                    value={String(activeMasterclasses)}
                    sub={`of ${cohorts.filter(c => (c as any).offering_type === 'master_class').length} total`}
                    delay={0.1}
                    onClick={() => navigate('/admin/programs?type=master_class&status=active')}
                />
                <MetricCard
                    icon={Mic}
                    label="Active AI Talks"
                    value={String(activeAITalks)}
                    sub="current engagements"
                    delay={0.15}
                    onClick={() => navigate('/admin/programs?type=ai_talk')}
                />
                <MetricCard
                    icon={Users}
                    label="Active Members"
                    value={String(activeMembers)}
                    sub="executives + participants"
                    delay={0.2}
                    onClick={() => navigate('/admin/members')}
                />
            </div>

            {/* ── Row 2: Pipeline Analytics + Calendar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Pipeline Analytics Bento Widget (Massive Redesign) */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-3 flex flex-col sm:flex-row gap-4 h-full"
                >
                    {/* The Main Huge Metric Banner */}
                    <div 
                        className="flex-1 bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-white/[0.08] rounded-[24px] p-6 sm:p-8 relative overflow-hidden group hover:border-lime/30 cursor-pointer transition-all duration-500 shadow-2xl flex flex-col justify-between"
                        onClick={() => navigate('/admin/leads?priority=ACTIVE')}
                    >
                        {/* Background Glow */}
                        <div className="absolute top-[-50%] right-[-10%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_top_right,rgba(208,255,113,0.05),transparent_40%)]" />
                        
                        {/* Huge Abstract Icon Background */}
                        <div className="absolute top-8 right-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700 pointer-events-none rotate-12">
                            <DollarSign className="w-48 h-48 text-lime" />
                        </div>

                        {/* Top Ribbon */}
                        <div className="relative z-10 w-full flex items-center justify-between mb-8 sm:mb-12">
                            <div className="inline-flex items-center gap-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs text-gray-300 font-medium tracking-wide">
                                <TrendingUp className="w-4 h-4 text-lime" />
                                <span>Pipeline Engine</span>
                            </div>
                            {/* Hover Arrow Component */}
                            <div className="w-10 h-10 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-lime">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Middle Focus -> Value */}
                        <div className="relative z-10 mb-8 sm:mb-12">
                            <p className="text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-gray-500 mb-3 ml-1">Total Pipeline Value</p>
                            <h3 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(208,255,113,0.1)] group-hover:drop-shadow-[0_0_30px_rgba(208,255,113,0.25)] transition-all duration-500">
                                <span className="text-lime/90">AED</span> {fmt(pipelineValue)}
                            </h3>
                        </div>

                        {/* Bottom Focus -> Distribution Bar */}
                        <div className="relative z-10 w-full mt-auto bg-black/40 p-5 rounded-2xl border border-white/[0.03] backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">Health Distribution</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{leads.length} Active Profiles</p>
                            </div>
                            <LeadsStatusBar counts={leadCounts} />
                        </div>
                    </div>

                    {/* The 4 Smaller Bento Cards stacked in a 2x2 grid */}
                    <div className="w-full sm:w-[280px] xl:w-[320px] shrink-0 grid grid-cols-2 grid-rows-2 gap-4">
                        <PipelineStatCard 
                            label="Total"
                            value={fmt(leads.length)}
                            colorMain="text-white"
                            onClick={() => navigate('/admin/leads')}
                        />
                        <PipelineStatCard 
                            label="Convert"
                            value={`${conversionRate}%`}
                            colorMain="text-orange-400"
                            onClick={() => navigate('/admin/leads?priority=COMPLETED')}
                        />
                        <PipelineStatCard 
                            label="Pending"
                            value={pendingLeads}
                            colorMain="text-amber-400"
                            onClick={() => navigate('/admin/leads?paid=pending')}
                        />
                        <PipelineStatCard 
                            label="Costs"
                            value={<span className="text-lg">AED {fmt(monthlyCosts)}</span>}
                            colorMain="text-green-400"
                            onClick={() => navigate('/admin/costs')}
                        />
                    </div>
                </motion.div>


                {/* Calendar Widget (replaced Recent Leads) */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-lime" />
                            Calendar
                        </h2>
                        <button
                            onClick={() => navigate('/admin/programs')}
                            className="text-xs text-gray-400 hover:text-lime transition flex items-center gap-1"
                        >
                            Programs <ArrowRight className="h-3 w-3" />
                        </button>
                    </div>
                    <CalendarWidget cohorts={cohorts} eventsData={eventsData} />
                </motion.div>
            </div>

            {/* ── Row 3: Masterclass Progress ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-bg-card border border-border rounded-2xl p-6"
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-lime" />
                        Masterclass Progress
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
