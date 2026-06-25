import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    AreaChart, Area
} from 'recharts'
import { 
    Users, Brain, Target, Building2, Filter,
    Eye, Clock, Activity, FileText, ArrowUpRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MetricCard } from '@/components/shared/MetricCard'
import { RespondentListModal, type RespondentData } from '@/components/admin/shared/RespondentListModal'
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

interface PostSubmission {
    id: string
    submitted_at: string
    survey_type: 'management' | 'team'
    respondent_name: string | null
    respondent_email: string | null
    company_name: string | null
    company_id: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: Record<string, any>
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
            className="group relative overflow-hidden bg-[#0a0a0a] border border-white/[0.08] rounded-[24px] p-6 shadow-sm hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] hover:border-white/[0.12] transition-colors duration-500"
        >
            {/* Top glare/hairline */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            
            {/* Subtle lime glow tied to hover state */}
            <div className="absolute -z-10 inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(208,255,113,0.03),transparent_70%)]" />

            <h3 className="font-heading font-bold mb-5 text-[11px] text-gray-500 uppercase tracking-[0.12em]">{title}</h3>
            <div className="relative z-10 w-full">
                {children}
            </div>
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
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: 12, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
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
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: 12, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
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
                <ChartCard title="Impact Areas: Avg Score (1–5)" delay={0.4}>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={impactAreas}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="area" tick={{ fill: '#aaa', fontSize: 11 }} />
                            <Radar dataKey="value" stroke="#D0FF71" fill="#D0FF71" fillOpacity={0.15} strokeWidth={2} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: 12, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
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


// ─── Post-Masterclass Tabs ────────────────────────────────────────────────────

function PostManagementTab({ data }: { data: PostSubmission[] }) {
    const goalsData = useMemo(() => toBarData(countField(data.map(d => d.answers), 'goals_achieved')), [data])
    const concernsData = useMemo(() => topN(countArr(data.map(d => d.answers.remaining_concerns)), 8, ['#F87171', '#FB923C', '#FBBF24', '#60A5FA']), [data])
    const outcomesData = useMemo(() => topN(countArr(data.map(d => d.answers.outcomes_observed)), 8, PALETTE), [data])

    const avgValue = avg(data.map(d => d.answers.overall_value))
    const avgRelevance = avg(data.map(d => d.answers.content_relevance))
    const avgSkillShift = avg(data.map(d => d.answers.team_skill_shift))
    const avgROI = avg(data.map(d => d.answers.roi_perception))
    const avgInternal = avg(data.map(d => d.answers.likelihood_internal_adoption))
    const avgClient = avg(data.map(d => d.answers.likelihood_client_adoption))

    const ScoreMap = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className="flex flex-col items-center gap-2">
            <div className="text-3xl font-bold font-heading" style={{ color }}>{value || '-'}</div>
            <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
        </div>
    )

    return (
        <div className="space-y-6">
            <ChartCard title="Average Ratings (out of 5)" delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-2">
                    <ScoreMap label="Overall Value" value={avgValue} color="#D0FF71" />
                    <ScoreMap label="Content Relevance" value={avgRelevance} color="#75C345" />
                    <ScoreMap label="Team Skill Shift" value={avgSkillShift} color="#9AD41A" />
                    <ScoreMap label="ROI Perception" value={avgROI} color="#B8F23E" />
                    <ScoreMap label="Internal Adoption" value={avgInternal} color="#5A9F2E" />
                    <ScoreMap label="Client Adoption" value={avgClient} color="#C6F05A" />
                </div>
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Goals Achieved" delay={0.2}>
                    <DonutChart data={goalsData.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }))} />
                </ChartCard>
                <ChartCard title="Outcomes Observed" delay={0.3}>
                    <MiniBar data={outcomesData} color="#D0FF71" height={220} />
                </ChartCard>
                <ChartCard title="Remaining Concerns" delay={0.4}>
                    <MiniBar data={concernsData} color="#F87171" height={220} />
                </ChartCard>
            </div>
        </div>
    )
}

function PostTeamTab({ data }: { data: PostSubmission[] }) {
    const goalsData = useMemo(() => toBarData(countField(data.map(d => d.answers), 'goals_achieved')), [data])
    const confidenceChangeData = useMemo(() => toBarData(countField(data.map(d => d.answers), 'confidence_change')), [data])
    const concernsData = useMemo(() => topN(countArr(data.map(d => d.answers.remaining_concerns)), 8, ['#A78BFA', '#F87171', '#FB923C']), [data])
    const outcomesData = useMemo(() => topN(countArr(data.map(d => d.answers.outcomes_experienced)), 8, PALETTE), [data])

    const avgValue = avg(data.map(d => d.answers.overall_value))
    const avgRelevance = avg(data.map(d => d.answers.content_relevance))
    const avgConfidence = avg(data.map(d => d.answers.post_ai_confidence))
    const avgSkill = avg(data.map(d => d.answers.post_ai_skill))
    const avgQuality = avg(data.map(d => d.answers.quality_confidence))
    const avgReadiness = avg(data.map(d => d.answers.workflow_readiness))

    const ScoreMap = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className="flex flex-col items-center gap-2">
            <div className="text-3xl font-bold font-heading" style={{ color }}>{value || '-'}</div>
            <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
        </div>
    )

    return (
        <div className="space-y-6">
            <ChartCard title="Average Ratings (out of 5)" delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-2">
                    <ScoreMap label="Overall Value" value={avgValue} color="#D0FF71" />
                    <ScoreMap label="Content Relevance" value={avgRelevance} color="#75C345" />
                    <ScoreMap label="Post AI Confidence" value={avgConfidence} color="#9AD41A" />
                    <ScoreMap label="Post AI Skill" value={avgSkill} color="#B8F23E" />
                    <ScoreMap label="Quality Confidence" value={avgQuality} color="#5A9F2E" />
                    <ScoreMap label="Workflow Readiness" value={avgReadiness} color="#C6F05A" />
                </div>
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Confidence Change" delay={0.2}>
                    <MiniBar data={confidenceChangeData} color="#D0FF71" height={220} />
                </ChartCard>
                <ChartCard title="Goals Achieved" delay={0.3}>
                    <DonutChart data={goalsData.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }))} />
                </ChartCard>
                <ChartCard title="Outcomes Experienced" delay={0.4}>
                    <MiniBar data={outcomesData} color="#75C345" height={220} />
                </ChartCard>
                <ChartCard title="Remaining Concerns" delay={0.5}>
                    <MiniBar data={concernsData} color="#A78BFA" height={220} />
                </ChartCard>
            </div>
        </div>
    )
}

// ─── Webinar Analytics Tab ───────────────────────────────────────────────────

interface WebinarAnalyticsRecord {
    id: string
    session_id: string
    path: string
    referrer: string
    variant: string
    duration_seconds: number
    created_at: string
    updated_at: string
}

function WebinarAnalyticsTab() {
    const [records, setRecords] = useState<WebinarAnalyticsRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchWebinarData = async () => {
            setLoading(true)
            try {
                const { data, error: err } = await supabase
                    .from('webinar_analytics')
                    .select('*')
                    .order('created_at', { ascending: true })

                if (err) throw err
                setRecords((data as WebinarAnalyticsRecord[]) || [])
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load webinar analytics'
                console.error('Error fetching webinar analytics:', err)
                setError(message)
            } finally {
                setLoading(false)
            }
        }
        fetchWebinarData()
    }, [])

    // Process statistics
    const uniqueCount = useMemo(() => {
        return new Set(records.map(r => r.session_id)).size
    }, [records])

    const pageviewsCount = useMemo(() => {
        return records.length
    }, [records])

    const viewsPerVisit = useMemo(() => {
        return uniqueCount > 0 ? (pageviewsCount / uniqueCount).toFixed(1) : '0'
    }, [uniqueCount, pageviewsCount])

    const avgVisitDuration = useMemo(() => {
        const sessionDurations: Record<string, number> = {}
        records.forEach(r => {
            sessionDurations[r.session_id] = (sessionDurations[r.session_id] || 0) + r.duration_seconds
        })
        const durations = Object.values(sessionDurations)
        const avgSecs = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0
        
        if (avgSecs <= 0) return '0s'
        if (avgSecs < 60) return `${Math.round(avgSecs)}s`
        const mins = Math.floor(avgSecs / 60)
        const secs = Math.round(avgSecs % 60)
        return `${mins}m ${secs}s`
    }, [records])

    const bounceRate = useMemo(() => {
        const sessionCounts: Record<string, number> = {}
        records.forEach(r => {
            sessionCounts[r.session_id] = (sessionCounts[r.session_id] || 0) + 1
        })
        const total = Object.keys(sessionCounts).length
        const bounces = Object.values(sessionCounts).filter(c => c === 1).length
        return total > 0 ? `${((bounces / total) * 100).toFixed(1)}%` : '0%'
    }, [records])

    // A/B Funnel calculations
    const funnelA = useMemo(() => {
        const variantRecords = records.filter(r => r.variant === 'A')
        const landed = new Set(variantRecords.filter(r => r.path === '/' || r.path === '/main').map(r => r.session_id))
        const converted = new Set(variantRecords.filter(r => r.path === '/thank-you' && landed.has(r.session_id)).map(r => r.session_id))
        const landedCount = landed.size
        const convertedCount = converted.size
        const rate = landedCount > 0 ? (convertedCount / landedCount) * 100 : 0
        return { landed: landedCount, converted: convertedCount, rate }
    }, [records])

    const funnelB = useMemo(() => {
        const variantRecords = records.filter(r => r.variant === 'B')
        const landed = new Set(variantRecords.filter(r => r.path === '/' || r.path === '/main').map(r => r.session_id))
        const converted = new Set(variantRecords.filter(r => r.path === '/thank-you' && landed.has(r.session_id)).map(r => r.session_id))
        const landedCount = landed.size
        const convertedCount = converted.size
        const rate = landedCount > 0 ? (convertedCount / landedCount) * 100 : 0
        return { landed: landedCount, converted: convertedCount, rate }
    }, [records])

    const liftData = useMemo(() => {
        if (funnelA.rate === 0 && funnelB.rate === 0) {
            return { lift: '0.0%', text: 'No conversions yet', isGreen: false }
        }
        if (funnelA.rate === 0) {
            return { lift: '+100%', text: 'Variant B Win', isGreen: true }
        }
        const diff = funnelB.rate - funnelA.rate
        const liftPercent = (diff / funnelA.rate) * 100
        if (liftPercent > 0) {
            return { lift: `+${liftPercent.toFixed(1)}%`, text: 'Variant B Win', isGreen: true }
        } else if (liftPercent < 0) {
            return { lift: `${liftPercent.toFixed(1)}%`, text: 'Variant A Win', isGreen: false }
        }
        return { lift: '0.0%', text: 'Draw', isGreen: false }
    }, [funnelA, funnelB])

    // Daily unique visitors chart data
    const dailyChartData = useMemo(() => {
        const dailyMap: Record<string, Set<string>> = {}
        records.forEach(r => {
            const dateStr = new Date(r.created_at).toISOString().split('T')[0]
            if (!dailyMap[dateStr]) {
                dailyMap[dateStr] = new Set()
            }
            dailyMap[dateStr].add(r.session_id)
        })

        return Object.entries(dailyMap)
            .map(([date, sessions]) => ({
                rawDate: date,
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                visitors: sessions.size
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    }, [records])

    // Referrers data
    const referrerData = useMemo(() => {
        const referrerMap: Record<string, Set<string>> = {}
        records.forEach(r => {
            const ref = r.referrer || 'Direct'
            if (!referrerMap[ref]) {
                referrerMap[ref] = new Set()
            }
            referrerMap[ref].add(r.session_id)
        })

        return Object.entries(referrerMap)
            .map(([name, sessions]) => ({
                name,
                value: sessions.size,
                percentage: uniqueCount > 0 ? parseFloat(((sessions.size / uniqueCount) * 100).toFixed(1)) : 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
    }, [records, uniqueCount])

    // Top paths data
    const pathsData = useMemo(() => {
        const pathMap: Record<string, number> = {}
        records.forEach(r => {
            pathMap[r.path] = (pathMap[r.path] || 0) + 1
        })

        return Object.entries(pathMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
    }, [records])

    const kpiCards = [
        { icon: Users, label: 'Unique Visitors', value: String(uniqueCount), sub: 'Active sessions tracked', delay: 0 },
        { icon: Eye, label: 'Pageviews', value: String(pageviewsCount), sub: 'Total paths visited', delay: 0.05 },
        { icon: FileText, label: 'Views Per Visit', value: viewsPerVisit, sub: 'Average paths / session', delay: 0.1 },
        { icon: Clock, label: 'Visit Duration', value: avgVisitDuration, sub: 'Time spent per session', delay: 0.15 },
        { icon: Activity, label: 'Bounce Rate', value: bounceRate, sub: 'Single pageviews / total', delay: 0.2 }
    ]

    if (loading) {
        return <div className="p-16 text-center text-gray-500">Loading webinar statistics…</div>
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiCards.map(k => (
                    <MetricCard 
                        key={k.label} 
                        icon={k.icon} 
                        label={k.label} 
                        value={k.value} 
                        sub={k.sub} 
                        delay={k.delay}
                    />
                ))}
            </div>

            {/* Row 2: A/B Testing Funnel + Daily Visitors Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* A/B Testing Funnel Card */}
                <div className="group relative overflow-hidden bg-[#0a0a0a] border border-white/[0.08] rounded-[24px] p-6 shadow-sm hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] hover:border-white/[0.12] transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                    <div className="absolute -z-10 inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(208,255,113,0.03),transparent_70%)]" />
                    
                    <h3 className="font-heading font-bold mb-1 text-[11px] text-gray-500 uppercase tracking-[0.12em]">A/B Testing Funnel</h3>
                    <p className="text-[11px] text-gray-500 mb-6">Conversion Rate comparison: landing on '/' vs. reaching '/thank-you'</p>
                    
                    <div className="space-y-6">
                        {/* Variant A */}
                        <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                            <div>
                                <span className="text-[10px] font-semibold tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20 uppercase">
                                    Variant A
                                </span>
                                <div className="text-[11px] text-gray-500 mt-1">{funnelA.converted} / {funnelA.landed} users</div>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight tabular-nums">
                                {funnelA.rate.toFixed(1)}%
                            </div>
                        </div>

                        {/* Variant B */}
                        <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                            <div>
                                <span className="text-[10px] font-semibold tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-md border border-purple-400/20 uppercase">
                                    Variant B
                                </span>
                                <div className="text-[11px] text-gray-500 mt-1">{funnelB.converted} / {funnelB.landed} users</div>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight tabular-nums">
                                {funnelB.rate.toFixed(1)}%
                            </div>
                        </div>

                        {/* Conversion Lift */}
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] uppercase font-medium tracking-[0.15em] text-gray-500">
                                Conversion Lift
                            </span>
                            <div className={`text-3xl font-bold mt-1 tracking-tight tabular-nums ${liftData.isGreen ? 'text-lime drop-shadow-[0_0_12px_rgba(208,255,113,0.15)]' : 'text-gray-300'}`}>
                                {liftData.lift}
                            </div>
                            <span className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full ${liftData.isGreen ? 'bg-lime/10 text-lime border border-lime/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                                {liftData.isGreen && <ArrowUpRight className="inline-block h-3.5 w-3.5 mr-0.5 align-text-bottom" />}
                                {liftData.text}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Daily Unique Visitors Chart */}
                <div className="lg:col-span-2 group relative overflow-hidden bg-[#0a0a0a] border border-white/[0.08] rounded-[24px] p-6 shadow-sm hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] hover:border-white/[0.12] transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                    <div className="absolute -z-10 inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(208,255,113,0.03),transparent_70%)]" />
                    
                    <h3 className="font-heading font-bold mb-1 text-[11px] text-gray-500 uppercase tracking-[0.12em]">Daily Unique Visitors</h3>
                    <p className="text-[11px] text-gray-500 mb-6">Active user sessions tracked over this interval</p>
                    
                    <div className="w-full">
                        {dailyChartData.length === 0 ? (
                            <div className="h-60 flex items-center justify-center text-gray-600 text-sm">No visitor history yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={dailyChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#181818" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fill: '#555', fontSize: 11 }} 
                                        axisLine={{ stroke: '#222' }}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#555', fontSize: 11 }} 
                                        axisLine={{ stroke: '#222' }}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(0,0,0,0.85)', 
                                            backdropFilter: 'blur(12px)', 
                                            border: '1px solid rgba(255,255,255,0.08)', 
                                            borderRadius: '12px', 
                                            fontSize: 12, 
                                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                                            color: '#fff'
                                        }}
                                        cursor={{ stroke: 'rgba(167, 139, 250, 0.2)', strokeWidth: 1 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="visitors" 
                                        stroke="#A78BFA" 
                                        fillOpacity={1} 
                                        fill="url(#colorVisitors)" 
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3: Referrers + Paths Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Referrer Channels */}
                <div className="group relative overflow-hidden bg-[#0a0a0a] border border-white/[0.08] rounded-[24px] p-6 shadow-sm hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] hover:border-white/[0.12] transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                    <div className="absolute -z-10 inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(208,255,113,0.03),transparent_70%)]" />
                    
                    <h3 className="font-heading font-bold mb-1 text-[11px] text-gray-500 uppercase tracking-[0.12em]">Referrer Channels</h3>
                    <p className="text-[11px] text-gray-500 mb-6">Where your traffic originates</p>

                    {referrerData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No referrer data yet</div>
                    ) : (
                        <div className="space-y-4">
                            {referrerData.map(item => (
                                <div key={item.name} className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-300 font-medium">{item.name}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-white font-bold">{item.value}</span>
                                            <span className="text-gray-500">({item.percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/[0.02] border border-white/[0.05] rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#A78BFA] rounded-full transition-all duration-500" 
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Visited Paths */}
                <div className="group relative overflow-hidden bg-[#0a0a0a] border border-white/[0.08] rounded-[24px] p-6 shadow-sm hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] hover:border-white/[0.12] transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                    <div className="absolute -z-10 inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(208,255,113,0.03),transparent_70%)]" />
                    
                    <h3 className="font-heading font-bold mb-1 text-[11px] text-gray-500 uppercase tracking-[0.12em]">Top Visited Paths</h3>
                    <p className="text-[11px] text-gray-500 mb-6">Most frequently viewed routes</p>

                    {pathsData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No path views yet</div>
                    ) : (
                        <div className="divide-y divide-white/[0.05]">
                            {pathsData.map(item => (
                                <div key={item.name} className="flex items-center justify-between py-3 text-xs">
                                    <span className="text-gray-300 font-mono">{item.name}</span>
                                    <span className="text-gray-400 font-medium">
                                        <span className="text-white font-bold">{item.value}</span> views
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
    const [mgmt, setMgmt] = useState<ManagementSubmission[]>([])
    const [team, setTeam] = useState<TeamSubmission[]>([])
    const [postMgmt, setPostMgmt] = useState<PostSubmission[]>([])
    const [postTeam, setPostTeam] = useState<PostSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [phaseTab, setPhaseTab] = useState<'pre' | 'post'>('pre')
    const [roleTab, setRoleTab] = useState<'management' | 'team'>('management')
    const [isDrillDownOpen, setIsDrillDownOpen] = useState(false)
    const [activeDashboard, setActiveDashboard] = useState<'surveys' | 'webinar'>('surveys')

    // Data lists
    const [companyFilter, setCompanyFilter] = useState<string>('all')

    useEffect(() => {
        let ignore = false
        const load = async () => {
            setLoading(true)
            const [mr, tr, post] = await Promise.all([
                supabase.from('management_submissions').select('*').order('created_at'),
                supabase.from('team_submissions').select('*').order('created_at'),
                supabase.from('post_completion_survey_responses').select('*').order('submitted_at'),
            ])
            if (ignore) return
            if (mr.error || tr.error || post.error) {
                setError(mr.error?.message ?? tr.error?.message ?? post.error?.message ?? 'Failed to load data')
            } else {
                setMgmt((mr.data as ManagementSubmission[]) ?? [])
                setTeam((tr.data as TeamSubmission[]) ?? [])
                const postResponses = (post.data as PostSubmission[]) ?? []
                setPostMgmt(postResponses.filter(r => r.survey_type === 'management'))
                setPostTeam(postResponses.filter(r => r.survey_type === 'team'))
            }
            setLoading(false)
        }
        load()
        return () => { ignore = true }
    }, [])

    // Company list for filter
    const companyList = useMemo(() => {
        const map = new Map<string, string>()
            ;[...mgmt, ...team, ...postMgmt, ...postTeam].forEach(d => {
                if (d.company_id && d.company_name) map.set(d.company_id, d.company_name)
            })
        return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
    }, [mgmt, team])

    // Filtered data
    const filteredMgmt = useMemo(() => companyFilter === 'all' ? mgmt : mgmt.filter(d => d.company_id === companyFilter), [mgmt, companyFilter])
    const filteredTeam = useMemo(() => companyFilter === 'all' ? team : team.filter(d => d.company_id === companyFilter), [team, companyFilter])
    const filteredPostMgmt = useMemo(() => companyFilter === 'all' ? postMgmt : postMgmt.filter(d => d.company_id === companyFilter), [postMgmt, companyFilter])
    const filteredPostTeam = useMemo(() => companyFilter === 'all' ? postTeam : postTeam.filter(d => d.company_id === companyFilter), [postTeam, companyFilter])

    // KPI computations
    const companies = useMemo(() => {
        const s = new Set<string>()
        if (phaseTab === 'pre') {
            filteredMgmt.forEach(d => { if (d.company_name) s.add(d.company_name.toLowerCase().trim()) })
            filteredTeam.forEach(d => { if (d.company_name) s.add(d.company_name.toLowerCase().trim()) })
        } else {
            filteredPostMgmt.forEach(d => { if (d.company_name) s.add(d.company_name.toLowerCase().trim()) })
            filteredPostTeam.forEach(d => { if (d.company_name) s.add(d.company_name.toLowerCase().trim()) })
        }
        return s.size
    }, [filteredMgmt, filteredTeam, filteredPostMgmt, filteredPostTeam, phaseTab])

    const avgTeamReadiness = avg(filteredMgmt.map(d => d.q10_team_readiness))
    const avgAiConfidencePre = avg(filteredTeam.map(d => d.q5_confidence_ai_workflow))
    const avgAiConfidencePost = avg(filteredPostTeam.map(d => d.answers.post_ai_confidence))
    const avgOverallValuePostMgmt = avg(filteredPostMgmt.map(d => d.answers.overall_value))

    const avgAlignMgmtPre = avg(filteredMgmt.map(d => d.q7_alignment_confidence))
    const avgSkillTeamPre = avg(filteredTeam.map(d => d.q6_skill_level_ai_tools))
    const avgRelevancePostMgmt = avg(filteredPostMgmt.map(d => d.answers.content_relevance))
    const avgSkillPostTeam = avg(filteredPostTeam.map(d => d.answers.post_ai_skill))

    const activeListCount = phaseTab === 'pre' 
        ? (roleTab === 'management' ? filteredMgmt.length : filteredTeam.length)
        : (roleTab === 'management' ? filteredPostMgmt.length : filteredPostTeam.length)

    const currentRespondents: RespondentData[] = useMemo(() => {
        if (phaseTab === 'pre') {
            const list = roleTab === 'management' ? filteredMgmt : filteredTeam;
            return list.map((d, i) => ({
                id: d.id || `pre-${roleTab}-${i}`,
                name: d.full_name || 'Unknown',
                email: d.user_email,
                company: d.company_name || 'Unknown'
            }));
        } else {
            const list = roleTab === 'management' ? filteredPostMgmt : filteredPostTeam;
            return list.map((d, i) => ({
                id: d.id || `post-${roleTab}-${i}`,
                name: d.respondent_name || 'Unknown',
                email: d.respondent_email || '',
                company: d.company_name || 'Unknown'
            }));
        }
    }, [phaseTab, roleTab, filteredMgmt, filteredTeam, filteredPostMgmt, filteredPostTeam]);

    const kpis = [
        { 
            icon: roleTab === 'management' ? Users : Brain, 
            label: `${roleTab === 'management' ? 'Management' : 'Team'} Respondents`, 
            value: String(activeListCount), 
            sub: 'Click to view list', 
            delay: 0,
            onClick: () => setIsDrillDownOpen(true)
        },
        { 
            icon: Target, 
            label: phaseTab === 'pre' 
                ? (roleTab === 'management' ? 'Avg Team Readiness' : 'Avg AI Confidence') 
                : (roleTab === 'management' ? 'Avg Overall Value' : 'Post AI Confidence'), 
            value: phaseTab === 'pre' 
                ? (roleTab === 'management' ? `${avgTeamReadiness}/5` : `${avgAiConfidencePre}/5`) 
                : (roleTab === 'management' ? `${avgOverallValuePostMgmt}/5` : `${avgAiConfidencePost}/5`),
            sub: phaseTab === 'pre' ? 'self-rated' : 'post-completion', 
            delay: 0.07 
        },
        { 
            icon: Building2, 
            label: 'Companies Represented', 
            value: String(companies), 
            sub: phaseTab === 'pre' ? 'unique studios (pre)' : 'unique studios (post)', 
            delay: 0.14 
        },
        { 
            icon: Target, 
            label: phaseTab === 'pre' 
                ? (roleTab === 'management' ? 'Avg Alignment' : 'Avg AI Skill') 
                : (roleTab === 'management' ? 'Avg Relevance' : 'Post AI Skill'), 
            value: phaseTab === 'pre' 
                ? (roleTab === 'management' ? `${avgAlignMgmtPre}/5` : `${avgSkillTeamPre}/5`) 
                : (roleTab === 'management' ? `${avgRelevancePostMgmt}/5` : `${avgSkillPostTeam}/5`),
            sub: phaseTab === 'pre' ? 'self-rated' : 'post-completion', 
            delay: 0.21 
        },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {activeDashboard === 'surveys'
                            ? 'Sprint Workshop & Master Class survey insights'
                            : 'Real-time webinar traffic & conversion analytics'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Dashboard Selector */}
                    <div className="flex bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setActiveDashboard('surveys')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                activeDashboard === 'surveys'
                                    ? 'bg-lime text-black font-semibold'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Surveys
                        </button>
                        <button
                            onClick={() => setActiveDashboard('webinar')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                activeDashboard === 'webinar'
                                    ? 'bg-lime text-black font-semibold'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Webinar Analytics
                        </button>
                    </div>

                    {activeDashboard === 'surveys' && (
                        <>
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
                            {/* Unified Smart Filter */}
                            <div className="flex bg-bg-card border border-border rounded-xl p-1 gap-1 overflow-x-auto max-w-[calc(100vw-32px)] hide-scrollbar shrink-0">
                                {[
                                    { id: 'pre-management', label: 'Pre: Mgmt' },
                                    { id: 'pre-team', label: 'Pre: Team' },
                                    { id: 'post-management', label: 'Post: Mgmt' },
                                    { id: 'post-team', label: 'Post: Team' },
                                ].map(t => {
                                    const isSelected = phaseTab === (t.id.startsWith('pre') ? 'pre' : 'post') &&
                                        roleTab === (t.id.endsWith('management') ? 'management' : 'team')

                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setPhaseTab(t.id.startsWith('pre') ? 'pre' : 'post')
                                                setRoleTab(t.id.endsWith('management') ? 'management' : 'team')
                                            }}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isSelected
                                                ? 'bg-lime text-black shadow'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {activeDashboard === 'surveys' ? (
                loading ? (
                    <div className="p-16 text-center text-gray-500">Loading analytics…</div>
                ) : (
                    <>
                        {/* KPI row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {kpis.map(k => <MetricCard key={k.label} {...k} />)}
                        </div>

                        {/* Survey data avg confidence banner */}
                        {roleTab === 'team' && phaseTab === 'pre' && (
                            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-lime/5 border border-lime/20 text-sm text-gray-300">
                                <Brain className="h-4 w-4 text-lime shrink-0" />
                                Avg AI Workflow Confidence across {filteredTeam.length} team members:
                                <span className="font-bold text-lime ml-1">{avgAiConfidencePre} / 5</span>
                            </div>
                        )}

                        {/* Tab content */}
                        {phaseTab === 'pre' ? (
                            roleTab === 'management' ? (
                                <ManagementTab data={filteredMgmt} />
                            ) : (
                                <TeamTab data={filteredTeam} />
                            )
                        ) : (
                            roleTab === 'management' ? (
                                <PostManagementTab data={filteredPostMgmt} />
                            ) : (
                                <PostTeamTab data={filteredPostTeam} />
                            )
                        )}

                        <RespondentListModal
                            isOpen={isDrillDownOpen}
                            onClose={() => setIsDrillDownOpen(false)}
                            title={`${roleTab === 'management' ? 'Management' : 'Team'} Respondents (${phaseTab === 'pre' ? 'Pre' : 'Post'})`}
                            respondents={currentRespondents}
                        />
                    </>
                )
            ) : (
                <WebinarAnalyticsTab />
            )}
        </div>
    )
}
