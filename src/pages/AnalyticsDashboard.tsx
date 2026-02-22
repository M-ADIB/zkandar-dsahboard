import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { Users, Brain, Target, Building2, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManagementSubmission {
    id: string
    created_at: string
    user_email: string
    full_name: string | null
    company_name: string | null
    company_id: string | null
    q1_role: string | null
    q2_studio_focus: string | null
    q3_ai_adoption_status: string | null
    q4_visibility: number | null
    q5_opportunities: string[] | null
    q6_risks: string[] | null
    q7_alignment_confidence: number | null
    q8_guidance_level: string | null
    q9_success_factor: string | null
    q10_team_readiness: number | null
    q11_impact_speed: number | null
    q11_impact_quality: number | null
    q11_impact_efficiency: number | null
    q11_impact_client_satisfaction: number | null
    q11_impact_competitive_advantage: number | null
    q12_objectives: string[] | null
    q13_success_definition: string | null
}

interface TeamSubmission {
    id: string
    created_at: string
    user_email: string
    full_name: string | null
    company_name: string | null
    company_id: string | null
    q1_role: string | null
    q1_role_other: string | null
    q2_experience_years: string | null
    q3_ai_usage: string | null
    q4_ai_tools: string[] | null
    q5_confidence_ai_workflow: number | null
    q6_skill_level_ai_tools: number | null
    q7_difficulty_areas: string[] | null
    q8_outputs_meet_standards_confidence: number | null
    q9_concerns: string[] | null
    q10_help_most: string | null
    q11_readiness: number | null
    q12_top_goals: string[] | null
    q13_success_definition: string | null
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = ['#D0FF71', '#75C345', '#5A9F2E', '#9AD41A', '#B8F23E', '#A3D783', '#C6F05A']
const DARK_PALETTE = ['#8B5CF6', '#A78BFA', '#7C3AED', '#6D28D9', '#5B21B6', '#DDD6FE']

const avg = (arr: (number | null | undefined)[]): number => {
    const vals = arr.filter((v): v is number => v != null)
    if (vals.length === 0) return 0
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
}

const countArr = (rows: (string[] | null)[]): Record<string, number> => {
    const counts: Record<string, number> = {}
    rows.forEach(arr => {
        if (!arr) return
        arr.forEach(item => {
            counts[item] = (counts[item] || 0) + 1
        })
    })
    return counts
}

const topN = (counts: Record<string, number>, n: number, palette: string[]) =>
    Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }))

const countField = <T extends object>(rows: T[], key: keyof T): Record<string, number> => {
    const counts: Record<string, number> = {}
    rows.forEach(row => {
        const val = row[key]
        if (val == null) return
        const s = String(val)
        counts[s] = (counts[s] || 0) + 1
    })
    return counts
}

const toBarData = (counts: Record<string, number>) =>
    Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-bg-card border border-border rounded-2xl p-6"
        >
            <h3 className="font-heading font-bold mb-5 text-sm text-gray-300 uppercase tracking-widest">{title}</h3>
            {children}
        </motion.div>
    )
}

function MiniBar({ data, color = '#D0FF71', height = 220 }: { data: { name: string; value: number }[]; color?: string; height?: number }) {
    if (data.length === 0) return <Empty />
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#aaa', fontSize: 11 }} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: 12 }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

function DonutChart({ data, height = 220 }: { data: { name: string; value: number; color: string }[]; height?: number }) {
    if (data.length === 0) return <Empty />
    return (
        <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={height}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: 12 }}
                        formatter={(v: number) => [`${v}`, 'Count']}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 overflow-hidden">
                {data.map(d => (
                    <div key={d.name} className="flex items-start gap-2">
                        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-gray-400 leading-tight">{d.name}</span>
                        <span className="ml-auto text-xs text-gray-500 shrink-0">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Empty() {
    return <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
}

function KpiCard({ icon: Icon, label, value, sub, delay = 0 }: { icon: React.ElementType; label: string; value: string; sub?: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
        >
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-lime/10">
                    <Icon className="h-4 w-4 text-lime" />
                </div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-gray-500">{sub}</p>}
        </motion.div>
    )
}

// ─── Management Tab ───────────────────────────────────────────────────────────

function ManagementTab({ data }: { data: ManagementSubmission[] }) {
    const adoptionData = useMemo(() => toBarData(countField(data, 'q3_ai_adoption_status')), [data])
    const objectivesData = useMemo(() => topN(countArr(data.map(d => d.q12_objectives)), 8, PALETTE), [data])
    const studioFocusData = useMemo(() => topN(countField(data, 'q2_studio_focus'), 8, PALETTE), [data])
    const opportunitiesData = useMemo(() => topN(countArr(data.map(d => d.q5_opportunities)), 8, DARK_PALETTE), [data])
    const risksData = useMemo(() => topN(countArr(data.map(d => d.q6_risks)), 8, ['#F87171', '#FB923C', '#FBBF24', '#F472B6', '#A78BFA', '#60A5FA']), [data])

    const impactAreas = useMemo(() => [
        { area: 'Speed', value: avg(data.map(d => d.q11_impact_speed)) },
        { area: 'Quality', value: avg(data.map(d => d.q11_impact_quality)) },
        { area: 'Efficiency', value: avg(data.map(d => d.q11_impact_efficiency)) },
        { area: 'Client Sat.', value: avg(data.map(d => d.q11_impact_client_satisfaction)) },
        { area: 'Competitive', value: avg(data.map(d => d.q11_impact_competitive_advantage)) },
    ], [data])

    const confidenceDist = useMemo(() => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        data.forEach(d => { if (d.q7_alignment_confidence) counts[d.q7_alignment_confidence]++ })
        return Object.entries(counts).map(([k, v]) => ({ name: `★${k}`, value: v }))
    }, [data])

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="AI Adoption Status" delay={0.1}>
                    <MiniBar data={adoptionData} color="#D0FF71" />
                </ChartCard>
                <ChartCard title="Studio Focus" delay={0.2}>
                    <DonutChart data={studioFocusData} />
                </ChartCard>
                <ChartCard title="Top Objectives (Q12)" delay={0.3}>
                    <MiniBar data={objectivesData} color="#75C345" height={260} />
                </ChartCard>
                <ChartCard title="Impact Areas — Avg Score (1–5)" delay={0.4}>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={impactAreas}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="area" tick={{ fill: '#aaa', fontSize: 11 }} />
                            <Radar dataKey="value" stroke="#D0FF71" fill="#D0FF71" fillOpacity={0.15} strokeWidth={2} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: 12 }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Alignment Confidence Distribution" delay={0.5}>
                    <div className="flex items-end gap-3 h-40 mt-2">
                        {confidenceDist.map((d, i) => (
                            <div key={d.name} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs text-gray-400">{d.value}</span>
                                <div
                                    className="w-full rounded-t-md transition-all"
                                    style={{
                                        height: `${Math.max(4, (d.value / Math.max(...confidenceDist.map(x => x.value))) * 120)}px`,
                                        backgroundColor: PALETTE[i % PALETTE.length]
                                    }}
                                />
                                <span className="text-xs text-gray-500">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </ChartCard>
                <ChartCard title="Top Perceived Risks (Q6)" delay={0.6}>
                    <MiniBar data={risksData} color="#F87171" height={220} />
                </ChartCard>
                <ChartCard title="Key Opportunities (Q5)" delay={0.7}>
                    <MiniBar data={opportunitiesData} color="#A78BFA" height={220} />
                </ChartCard>
            </div>
        </div>
    )
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab({ data }: { data: TeamSubmission[] }) {
    const toolsData = useMemo(() => topN(countArr(data.map(d => d.q4_ai_tools)), 10, PALETTE), [data])
    const usageData = useMemo(() => toBarData(countField(data, 'q3_ai_usage')), [data])
    const experienceData = useMemo(() => toBarData(countField(data, 'q2_experience_years')), [data])
    const goalsData = useMemo(() => topN(countArr(data.map(d => d.q12_top_goals)), 8, PALETTE), [data])
    const difficultyData = useMemo(() => topN(countArr(data.map(d => d.q7_difficulty_areas)), 8, ['#F87171', '#FB923C', '#FBBF24', '#60A5FA', '#A78BFA', '#34D399']), [data])
    const concernsData = useMemo(() => topN(countArr(data.map(d => d.q9_concerns)), 8, DARK_PALETTE), [data])
    const roleData = useMemo(() => topN(countField(data, 'q1_role'), 8, PALETTE), [data])

    const avgConfidence = avg(data.map(d => d.q5_confidence_ai_workflow))
    const avgSkill = avg(data.map(d => d.q6_skill_level_ai_tools))
    const avgReadiness = avg(data.map(d => d.q11_readiness))
    const avgStandards = avg(data.map(d => d.q8_outputs_meet_standards_confidence))

    const ScoreGauge = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-20">
                <svg viewBox="0 0 80 80" className="rotate-[-90deg]">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#222" strokeWidth="8" />
                    <circle
                        cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
                        strokeDasharray={`${(value / 5) * 188} 188`} strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{value}</span>
                </div>
            </div>
            <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Score gauges */}
            <ChartCard title="Average Scores (out of 5)" delay={0.1}>
                <div className="flex justify-around py-2">
                    <ScoreGauge label="AI Confidence" value={avgConfidence} color="#D0FF71" />
                    <ScoreGauge label="Skill Level" value={avgSkill} color="#75C345" />
                    <ScoreGauge label="Readiness" value={avgReadiness} color="#9AD41A" />
                    <ScoreGauge label="Output Quality" value={avgStandards} color="#B8F23E" />
                </div>
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Top AI Tools Used (Q4)" delay={0.2}>
                    <MiniBar data={toolsData} color="#D0FF71" height={240} />
                </ChartCard>
                <ChartCard title="AI Usage Frequency (Q3)" delay={0.3}>
                    <MiniBar data={usageData} color="#75C345" />
                </ChartCard>
                <ChartCard title="Role Distribution (Q1)" delay={0.4}>
                    <DonutChart data={roleData} />
                </ChartCard>
                <ChartCard title="Experience Level (Q2)" delay={0.5}>
                    <MiniBar data={experienceData} color="#9AD41A" />
                </ChartCard>
                <ChartCard title="Top Goals (Q12)" delay={0.6}>
                    <MiniBar data={goalsData} color="#5A9F2E" height={240} />
                </ChartCard>
                <ChartCard title="Difficulty Areas (Q7)" delay={0.7}>
                    <MiniBar data={difficultyData} color="#F87171" height={240} />
                </ChartCard>
                <ChartCard title="Key Concerns (Q9)" delay={0.8}>
                    <MiniBar data={concernsData} color="#A78BFA" height={220} />
                </ChartCard>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
    const [mgmt, setMgmt] = useState<ManagementSubmission[]>([])
    const [team, setTeam] = useState<TeamSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<'management' | 'team'>('management')
    const [companyFilter, setCompanyFilter] = useState<string>('all')

    useEffect(() => {
        let ignore = false
        const load = async () => {
            setLoading(true)
            const [mr, tr] = await Promise.all([
                supabase.from('management_submissions').select('*').order('created_at'),
                supabase.from('team_submissions').select('*').order('created_at'),
            ])
            if (ignore) return
            if (mr.error || tr.error) {
                setError(mr.error?.message ?? tr.error?.message ?? 'Failed to load data')
            } else {
                setMgmt((mr.data as ManagementSubmission[]) ?? [])
                setTeam((tr.data as TeamSubmission[]) ?? [])
            }
            setLoading(false)
        }
        load()
        return () => { ignore = true }
    }, [])

    // Company list for filter
    const companyList = useMemo(() => {
        const map = new Map<string, string>()
            ;[...mgmt, ...team].forEach(d => {
                if (d.company_id && d.company_name) map.set(d.company_id, d.company_name)
            })
        return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
    }, [mgmt, team])

    // Filtered data
    const filteredMgmt = useMemo(() => companyFilter === 'all' ? mgmt : mgmt.filter(d => d.company_id === companyFilter), [mgmt, companyFilter])
    const filteredTeam = useMemo(() => companyFilter === 'all' ? team : team.filter(d => d.company_id === companyFilter), [team, companyFilter])

    // KPI computations
    const companies = useMemo(() => {
        const s = new Set<string>()
        filteredMgmt.forEach(d => { if (d.company_name) s.add(d.company_name.toLowerCase().trim()) })
        filteredTeam.forEach(d => { if (d.company_name) s.add(d.company_name.toLowerCase().trim()) })
        return s.size
    }, [filteredMgmt, filteredTeam])

    const avgTeamReadiness = avg(filteredMgmt.map(d => d.q10_team_readiness))
    const avgAiConfidence = avg(filteredTeam.map(d => d.q5_confidence_ai_workflow))

    const kpis = [
        { icon: Users, label: 'Management Respondents', value: String(filteredMgmt.length), sub: 'from survey', delay: 0 },
        { icon: Brain, label: 'Team Respondents', value: String(filteredTeam.length), sub: 'from survey', delay: 0.07 },
        { icon: Target, label: 'Avg Team Readiness', value: `${avgTeamReadiness}/5`, sub: 'management-rated', delay: 0.14 },
        { icon: Building2, label: 'Companies Represented', value: String(companies), sub: 'unique studios', delay: 0.21 },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Analytics</h1>
                    <p className="text-gray-400 text-sm mt-1">Sprint Workshop & Master Class survey insights</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Company filter */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border rounded-xl">
                        <Filter className="h-3.5 w-3.5 text-gray-500" />
                        <select
                            value={companyFilter}
                            onChange={e => setCompanyFilter(e.target.value)}
                            className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-bg-card">All Companies</option>
                            {companyList.map(c => (
                                <option key={c.id} value={c.id} className="bg-bg-card">{c.name}</option>
                            ))}
                        </select>
                    </div>
                    {/* Tab selector */}
                    <div className="flex gap-1 p-1 bg-bg-card border border-border rounded-xl">
                        {(['management', 'team'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t
                                    ? 'bg-lime text-black shadow'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="p-16 text-center text-gray-500">Loading analytics…</div>
            ) : (
                <>
                    {/* KPI row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
                    </div>

                    {/* Survey data avg confidence banner */}
                    {tab === 'team' && (
                        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-lime/5 border border-lime/20 text-sm text-gray-300">
                            <Brain className="h-4 w-4 text-lime shrink-0" />
                            Avg AI Workflow Confidence across {filteredTeam.length} team members:
                            <span className="font-bold text-lime ml-1">{avgAiConfidence} / 5</span>
                        </div>
                    )}

                    {/* Tab content */}
                    {tab === 'management' ? (
                        <ManagementTab data={filteredMgmt} />
                    ) : (
                        <TeamTab data={filteredTeam} />
                    )}
                </>
            )}
        </div>
    )
}
