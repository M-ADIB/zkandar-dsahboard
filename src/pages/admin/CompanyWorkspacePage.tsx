import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from 'recharts'
import {
    ArrowLeft, Building2, Users, GraduationCap, BarChart3,
    Calendar, CheckCircle2, Clock, Target, Brain, TrendingUp, FileText,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateLabel } from '@/lib/time'
import type { Cohort, Company, Session, SessionStatus, User } from '@/types/database'
import { MemberDetailsPanel } from '@/components/admin/company/MemberDetailsPanel'

// ─── Types ─────────────────────────────────────────────────────────────────
interface ManagementSubmission {
    id: string
    company_name: string | null
    q4_visibility: number | null
    q7_alignment_confidence: number | null
    q10_team_readiness: number | null
    q11_impact_speed: number | null
    q11_impact_quality: number | null
    q11_impact_efficiency: number | null
}

interface TeamSubmission {
    id: string
    full_name: string | null
    q1_role: string | null
    q5_confidence_ai_workflow: number | null
    q6_skill_level_ai_tools: number | null
    q11_readiness: number | null
    q3_ai_usage: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const avg = (arr: (number | null | undefined)[]): number => {
    const vals = arr.filter((v): v is number => v != null)
    if (vals.length === 0) return 0
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
}

const PALETTE = ['#D0FF71', '#75C345', '#9AD41A', '#5A9F2E', '#B8F23E']

// ─── Tab definitions ─────────────────────────────────────────────────────────
type WorkspaceTab = 'overview' | 'members' | 'analytics' | 'program'

const workspaceTabs: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'program', label: 'Program', icon: GraduationCap },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-lime' }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
        >
            <div className="w-10 h-10 rounded-xl bg-lime/10 flex items-center justify-center">
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
                <p className="text-2xl font-bold text-white leading-none">{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
            <p className="text-sm text-gray-400">{label}</p>
        </motion.div>
    )
}

// ─── Score gauge ─────────────────────────────────────────────────────────────
function ScoreGauge({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
    const pct = Math.min((value / max) * 100, 100)
    const color = pct >= 70 ? '#D0FF71' : pct >= 40 ? '#F59E0B' : '#EF4444'
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold" style={{ color }}>{value}/{max}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                />
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CompanyWorkspacePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview')

    const [company, setCompany] = useState<Company | null>(null)
    const [cohort, setCohort] = useState<Cohort | null>(null)
    const [members, setMembers] = useState<User[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [mgmtSubmissions, setMgmtSubmissions] = useState<ManagementSubmission[]>([])
    const [teamSubmissions, setTeamSubmissions] = useState<TeamSubmission[]>([])
    const [selectedMember, setSelectedMember] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        const fetchAll = async () => {
            setLoading(true)
            setError(null)

            // Fetch company
            const { data: companyData, error: companyErr } = await supabase
                .from('companies').select('*').eq('id', id).single()
            if (companyErr) { setError(companyErr.message); setLoading(false); return }
            const co = companyData as Company
            setCompany(co)

            // Fetch cohort first (sequential to avoid type issue)
            let cohortData: Cohort | null = null
            if (co.cohort_id) {
                const { data: cd } = await supabase.from('cohorts').select('*').eq('id', co.cohort_id).single()
                if (cd) cohortData = cd as Cohort
            }

            const [membersRes, mgmtRes, teamRes] = await Promise.all([
                supabase.from('users').select('*').eq('company_id', id).order('full_name'),
                supabase.from('management_submissions').select('id,company_name,q4_visibility,q7_alignment_confidence,q10_team_readiness,q11_impact_speed,q11_impact_quality,q11_impact_efficiency').eq('company_id', id),
                supabase.from('team_submissions').select('id,full_name,q1_role,q5_confidence_ai_workflow,q6_skill_level_ai_tools,q11_readiness,q3_ai_usage').eq('company_id', id),
            ])

            if (cohortData) {
                setCohort(cohortData)
                // Fetch sessions for this cohort
                const { data: sessData } = await supabase
                    .from('sessions').select('*')
                    .eq('cohort_id', cohortData.id)
                    .order('session_number', { ascending: true })
                setSessions((sessData as Session[]) ?? [])
            }

            setMembers((membersRes.data as User[]) ?? [])
            setMgmtSubmissions((mgmtRes.data as ManagementSubmission[]) ?? [])
            setTeamSubmissions((teamRes.data as TeamSubmission[]) ?? [])
            setLoading(false)
        }
        fetchAll()
    }, [id])

    // ── Derived data ──
    const completedSessions = useMemo(() => sessions.filter((s) => s.status === 'completed').length, [sessions])
    const onboardedMembers = useMemo(() => members.filter((m) => m.onboarding_completed).length, [members])
    const avgTeamReadiness = useMemo(() => avg(mgmtSubmissions.map((m) => m.q10_team_readiness)), [mgmtSubmissions])
    const avgTeamConfidence = useMemo(() => avg(teamSubmissions.map((t) => t.q5_confidence_ai_workflow)), [teamSubmissions])

    // ── Radar data ──
    const radarData = useMemo(() => [
        { subject: 'Visibility', value: avg(mgmtSubmissions.map((m) => m.q4_visibility)) },
        { subject: 'Alignment', value: avg(mgmtSubmissions.map((m) => m.q7_alignment_confidence)) },
        { subject: 'Team Readiness', value: avg(mgmtSubmissions.map((m) => m.q10_team_readiness)) },
        { subject: 'Speed', value: avg(mgmtSubmissions.map((m) => m.q11_impact_speed)) },
        { subject: 'Quality', value: avg(mgmtSubmissions.map((m) => m.q11_impact_quality)) },
        { subject: 'Efficiency', value: avg(mgmtSubmissions.map((m) => m.q11_impact_efficiency)) },
    ], [mgmtSubmissions])

    const teamScoreData = useMemo(() => [
        { name: 'AI Confidence', value: avg(teamSubmissions.map((t) => t.q5_confidence_ai_workflow)) },
        { name: 'Skill Level', value: avg(teamSubmissions.map((t) => t.q6_skill_level_ai_tools)) },
        { name: 'Readiness', value: avg(teamSubmissions.map((t) => t.q11_readiness)) },
    ], [teamSubmissions])

    const roleLabel: Record<string, string> = {
        owner: 'Owner', admin: 'Admin', executive: 'Executive', participant: 'Participant',
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
        </div>
    )

    if (error || !company) return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error ?? 'Company not found'}
        </div>
    )

    const statusBadge: Record<string, string> = {
        upcoming: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        active: 'bg-lime/10 text-lime border-lime/30',
        completed: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
    }

    const sessionStatusBadge: Record<SessionStatus, string> = {
        scheduled: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        completed: 'bg-lime/10 text-lime border-lime/30',
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Back + Header ── */}
            <div>
                <button
                    onClick={() => navigate('/admin/companies')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Companies
                </button>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl gradient-lime flex items-center justify-center shrink-0">
                            <span className="text-2xl font-bold text-black">{company.name.charAt(0)}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                            <p className="text-gray-400 text-sm mt-0.5">
                                {company.industry ?? 'Design Studio'} · {cohort ? cohort.name : 'No program assigned'}
                                {cohort && (
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-lg border ${statusBadge[cohort.status]}`}>
                                        {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="flex items-center gap-1 bg-bg-card border border-border rounded-2xl p-1 w-fit flex-wrap">
                {workspaceTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items - center gap - 2 px - 4 py - 2 rounded - xl text - sm font - medium transition - all duration - 200 ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'} `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="workspaceActiveTab"
                                    className="absolute inset-0 rounded-xl gradient-lime"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <Icon className="h-4 w-4 relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* ── Tab Content ── */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >

                {/* ══ OVERVIEW ══ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* KPI row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard icon={Users} label="Total Members" value={members.length} sub={`${onboardedMembers} onboarded`} />
                            <StatCard icon={CheckCircle2} label="Sessions Done" value={completedSessions} sub={`of ${sessions.length} total`} />
                            <StatCard icon={Brain} label="Avg Team Readiness" value={`${avgTeamReadiness} /10`} sub="Management view" />
                            <StatCard icon={Target} label="AI Confidence" value={`${avgTeamConfidence}/10`} sub="Team self-report" />
                        </div >

                        {/* Survey quick summary */}
                        {
                            (mgmtSubmissions.length > 0 || teamSubmissions.length > 0) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {mgmtSubmissions.length > 0 && (
                                        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-lime" />
                                                Management Survey Scores
                                                <span className="ml-auto text-xs text-gray-500">{mgmtSubmissions.length} respondents</span>
                                            </h3>
                                            <ScoreGauge label="AI Visibility" value={avg(mgmtSubmissions.map(m => m.q4_visibility))} />
                                            <ScoreGauge label="Team Alignment" value={avg(mgmtSubmissions.map(m => m.q7_alignment_confidence))} />
                                            <ScoreGauge label="Team Readiness" value={avg(mgmtSubmissions.map(m => m.q10_team_readiness))} />
                                            <ScoreGauge label="Impact on Speed" value={avg(mgmtSubmissions.map(m => m.q11_impact_speed))} />
                                            <ScoreGauge label="Impact on Quality" value={avg(mgmtSubmissions.map(m => m.q11_impact_quality))} />
                                        </div>
                                    )}

                                    {teamSubmissions.length > 0 && (
                                        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                <Users className="h-4 w-4 text-lime" />
                                                Team Survey Scores
                                                <span className="ml-auto text-xs text-gray-500">{teamSubmissions.length} respondents</span>
                                            </h3>
                                            <ScoreGauge label="AI Confidence in Workflow" value={avg(teamSubmissions.map(t => t.q5_confidence_ai_workflow))} />
                                            <ScoreGauge label="AI Skill Level" value={avg(teamSubmissions.map(t => t.q6_skill_level_ai_tools))} />
                                            <ScoreGauge label="Overall Readiness" value={avg(teamSubmissions.map(t => t.q11_readiness))} />
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        {
                            mgmtSubmissions.length === 0 && teamSubmissions.length === 0 && (
                                <div className="bg-bg-card border border-border rounded-2xl p-8 text-center">
                                    <Brain className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No survey submissions yet for this company.</p>
                                </div>
                            )
                        }
                    </div >
                )}

                {/* ══ MEMBERS ══ */}
                {
                    activeTab === 'members' && (
                        <div className="space-y-4">
                            <p className="text-gray-400 text-sm">{members.length} member{members.length !== 1 ? 's' : ''} enrolled</p>
                            {members.length === 0 ? (
                                <div className="bg-bg-card border border-border rounded-2xl p-8 text-center">
                                    <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No members found for this company.</p>
                                </div>
                            ) : (
                                <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Name</th>
                                                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Email</th>
                                                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Role</th>
                                                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Type</th>
                                                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Onboarded</th>
                                                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">AI Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {members.map((member) => (
                                                <tr
                                                    key={member.id}
                                                    className="hover:bg-white/5 transition cursor-pointer"
                                                    onClick={() => setSelectedMember(member)}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-lime/10 flex items-center justify-center shrink-0">
                                                                <span className="text-lime font-bold text-xs">{member.full_name?.charAt(0) ?? '?'}</span>
                                                            </div>
                                                            <span className="font-medium text-white">{member.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-400">{member.email}</td>
                                                    <td className="px-5 py-4">
                                                        <span className="px-2 py-1 text-xs rounded-lg border border-border text-gray-300">
                                                            {roleLabel[member.role] ?? member.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-400 capitalize">{member.user_type ?? '—'}</td>
                                                    <td className="px-5 py-4">
                                                        {member.onboarding_completed ? (
                                                            <span className="flex items-center gap-1 text-lime text-xs">
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-gray-500 text-xs">
                                                                <Clock className="h-3.5 w-3.5" /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`text-sm font-semibold ${member.ai_readiness_score >= 7 ? 'text-lime' : member.ai_readiness_score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {member.ai_readiness_score ?? '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* ══ ANALYTICS ══ */}
                {
                    activeTab === 'analytics' && (
                        <div className="space-y-6">
                            {mgmtSubmissions.length === 0 && teamSubmissions.length === 0 ? (
                                <div className="bg-bg-card border border-border rounded-2xl p-8 text-center">
                                    <BarChart3 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No survey data available for analytics.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Top: Radar + Team Bar */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {mgmtSubmissions.length > 0 && (
                                            <div className="bg-bg-card border border-border rounded-2xl p-6">
                                                <h3 className="font-semibold text-white mb-4">Management — Readiness Radar</h3>
                                                <ResponsiveContainer width="100%" height={260}>
                                                    <RadarChart data={radarData}>
                                                        <PolarGrid stroke="#374151" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                                        <Radar dataKey="value" stroke="#D0FF71" fill="#D0FF71" fillOpacity={0.2} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {teamSubmissions.length > 0 && (
                                            <div className="bg-bg-card border border-border rounded-2xl p-6">
                                                <h3 className="font-semibold text-white mb-4">Team — Avg Scores</h3>
                                                <ResponsiveContainer width="100%" height={260}>
                                                    <BarChart data={teamScoreData} barSize={36}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                        <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                                        <YAxis domain={[0, 10]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                            {teamScoreData.map((_, i) => (
                                                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    {/* Individual score gauges */}
                                    {teamSubmissions.length > 0 && (
                                        <div className="bg-bg-card border border-border rounded-2xl p-6">
                                            <h3 className="font-semibold text-white mb-5">Team Members — Individual Scores</h3>
                                            <div className="space-y-4">
                                                {teamSubmissions.map((t, i) => (
                                                    <div key={t.id} className="border border-border rounded-xl p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-7 w-7 rounded-lg bg-lime/10 flex items-center justify-center">
                                                                    <span className="text-lime text-xs font-bold">{(t.full_name ?? `T${i + 1}`).charAt(0)}</span>
                                                                </div>
                                                                <span className="text-sm font-medium text-white">{t.full_name ?? `Team Member ${i + 1}`}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500 capitalize">{t.q1_role ?? 'Unknown role'}</span>
                                                        </div>
                                                        <ScoreGauge label="AI Confidence" value={t.q5_confidence_ai_workflow ?? 0} />
                                                        <ScoreGauge label="Skill Level" value={t.q6_skill_level_ai_tools ?? 0} />
                                                        <ScoreGauge label="Readiness" value={t.q11_readiness ?? 0} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                }

                {/* ══ PROGRAM ══ */}
                {
                    activeTab === 'program' && (
                        <div className="space-y-6">
                            {!cohort ? (
                                <div className="bg-bg-card border border-border rounded-2xl p-8 text-center">
                                    <GraduationCap className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No masterclass program assigned to this company yet.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Program info */}
                                    <div className="bg-bg-card border border-border rounded-2xl p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1">{cohort.name}</h3>
                                                <p className="text-gray-400 text-sm">
                                                    {cohort.offering_type === 'master_class' ? 'Master Class' : 'Sprint Workshop'} ·
                                                    {' '}{formatDateLabel(cohort.start_date) || 'TBD'} → {formatDateLabel(cohort.end_date) || 'TBD'}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 text-xs rounded-xl border ${statusBadge[cohort.status]}`}>
                                                {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mt-6">
                                            <div className="bg-bg-elevated rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-white">{sessions.length}</p>
                                                <p className="text-xs text-gray-400 mt-1">Total Sessions</p>
                                            </div>
                                            <div className="bg-bg-elevated rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-lime">{completedSessions}</p>
                                                <p className="text-xs text-gray-400 mt-1">Completed</p>
                                            </div>
                                            <div className="bg-bg-elevated rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-white">{sessions.length - completedSessions}</p>
                                                <p className="text-xs text-gray-400 mt-1">Remaining</p>
                                            </div>
                                        </div>

                                        {cohort.miro_board_url && (
                                            <a
                                                href={cohort.miro_board_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-4 inline-flex items-center gap-2 text-sm text-lime hover:underline"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Open Miro Board
                                            </a>
                                        )}
                                    </div>

                                    {/* Sessions list */}
                                    {sessions.length > 0 && (
                                        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                                            <div className="px-6 py-4 border-b border-border">
                                                <h3 className="font-semibold text-white flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-lime" />
                                                    Sessions
                                                </h3>
                                            </div>
                                            <div className="divide-y divide-border">
                                                {sessions.map((session) => (
                                                    <div key={session.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition">
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${session.status === 'completed' ? 'bg-lime/10 text-lime' : 'bg-white/5 text-gray-400'}`}>
                                                            {session.session_number ?? '—'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-white">{session.title || `Session ${session.session_number}`}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {session.scheduled_date ? formatDateLabel(session.scheduled_date) : 'Date TBD'}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-lg border ${sessionStatusBadge[session.status]}`}>
                                                            {session.status === 'completed' ? 'Completed' : 'Scheduled'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                }
            </motion.div >

            {/* Slide-over member panel */}
            {
                selectedMember && (
                    <MemberDetailsPanel
                        member={selectedMember}
                        companyId={company.id}
                        onClose={() => setSelectedMember(null)}
                    />
                )
            }
        </div >
    )
}
