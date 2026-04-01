import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from 'recharts'
import {
    ArrowLeft, Building2, Users, GraduationCap, BarChart3, MessageSquare,
    CheckCircle2, Clock, Target, Brain, TrendingUp, FileText, Plus, X, Loader2,
    Archive, Trash2, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateLabel } from '@/lib/time'
import type { Cohort, Company, Session, User } from '@/types/database'
import { MemberDetailsPanel } from '@/components/admin/company/MemberDetailsPanel'
import { WorkspaceSessions } from '@/components/admin/company/WorkspaceSessions'
import { WorkspaceAssignments } from '@/components/admin/company/WorkspaceAssignments'
import { WorkspaceAttendance } from '@/components/admin/company/WorkspaceAttendance'
import { Portal } from '@/components/shared/Portal'
import { setDynamicPageTitle } from '@/hooks/usePageTitle'

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
type WorkspaceTab = 'overview' | 'members' | 'program' | 'chat' | 'analytics'

const workspaceTabs: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'program', label: 'Program', icon: GraduationCap },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-lime' }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5 flex flex-col gap-3"
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
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = (searchParams.get('tab') as WorkspaceTab) || 'overview'

    const setActiveTab = (tab: WorkspaceTab) => {
        setSearchParams((prev: URLSearchParams) => {
            if (tab === 'overview') {
                prev.delete('tab')
            } else {
                prev.set('tab', tab)
            }
            return prev
        }, { replace: true })
    }

    const [company, setCompany] = useState<Company | null>(null)
    const [cohort, setCohort] = useState<Cohort | null>(null)
    const [members, setMembers] = useState<User[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [mgmtSubmissions, setMgmtSubmissions] = useState<ManagementSubmission[]>([])
    const [teamSubmissions, setTeamSubmissions] = useState<TeamSubmission[]>([])
    const [selectedMember, setSelectedMember] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Assign Program modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [allCohorts, setAllCohorts] = useState<Cohort[]>([])
    const [selectedCohortId, setSelectedCohortId] = useState<string>('')
    const [isAssigning, setIsAssigning] = useState(false)
    const [assignError, setAssignError] = useState<string | null>(null)

    // Add Member modal state
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [availableUsers, setAvailableUsers] = useState<User[]>([])
    const [selectedAddUserId, setSelectedAddUserId] = useState<string>('')
    const [isAddingMember, setIsAddingMember] = useState(false)
    const [addMemberError, setAddMemberError] = useState<string | null>(null)

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
            setDynamicPageTitle(co.name)

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
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-1 w-fit flex-wrap">
                {workspaceTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}`}
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
                                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 space-y-4">
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
                                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 space-y-4">
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
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 text-center">
                                    <Brain className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No survey submissions yet for this company.</p>
                                </div>
                            )
                        }

                        {/* ── Company Actions ── */}
                        <div className="bg-white/[0.02] border border-red-500/20 rounded-[24px] p-6 space-y-4">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                Company Actions
                            </h3>
                            <p className="text-xs text-gray-500">These actions affect all members in this company.</p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={async () => {
                                        if (!confirm(`Archive "${company.name}"? Members will lose dashboard access.`)) return
                                        // @ts-expect-error - status column exists but not in generated types
                                        await supabase.from('companies').update({ status: 'archived' }).eq('id', company.id)
                                        navigate('/admin/companies')
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition"
                                >
                                    <Archive className="h-4 w-4" />
                                    Archive Company
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!confirm(`DELETE "${company.name}"? This is irreversible and will remove all associated data.`)) return
                                        await supabase.from('companies').delete().eq('id', company.id)
                                        navigate('/admin/companies')
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Company
                                </button>
                            </div>
                        </div>
                    </div >
                )}

                {/* ══ MEMBERS ══ */}
                {
                    activeTab === 'members' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-sm">{members.length} member{members.length !== 1 ? 's' : ''} enrolled</p>
                                <button
                                    onClick={async () => {
                                        const { data } = await supabase
                                            .from('users')
                                            .select('*')
                                            .neq('company_id', id ?? '')
                                            .order('full_name')
                                        setAvailableUsers((data as User[]) ?? [])
                                        setSelectedAddUserId('')
                                        setAddMemberError(null)
                                        setIsAddMemberOpen(true)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-lime/30 bg-lime/10 text-lime hover:bg-lime/20 transition"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Member
                                </button>
                            </div>
                            {members.length === 0 ? (
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 text-center">
                                    <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No members found for this company.</p>
                                </div>
                            ) : (
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] overflow-hidden">
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
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 text-center">
                                    <BarChart3 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No survey data available for analytics.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Top: Radar + Team Bar */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {mgmtSubmissions.length > 0 && (
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6">
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
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6">
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
                                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6">
                                            <h3 className="font-semibold text-white mb-5">Team Members — Individual Scores</h3>
                                            <div className="space-y-4">
                                                {teamSubmissions.map((t, i) => (
                                                    <div key={t.id} className="border border-white/[0.06] rounded-xl p-4 space-y-3 bg-white/[0.015]">
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
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 text-center space-y-4">
                                    <GraduationCap className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No masterclass program assigned to this company yet.</p>
                                    <button
                                        onClick={async () => {
                                            const { data } = await supabase.from('cohorts').select('*').order('start_date', { ascending: false })
                                            setAllCohorts((data as Cohort[]) ?? [])
                                            setSelectedCohortId((data as Cohort[])?.[0]?.id ?? '')
                                            setAssignError(null)
                                            setIsAssignModalOpen(true)
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-lime text-black text-sm font-medium hover:opacity-90 transition"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Assign Program
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Program header card */}
                                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1">{cohort.name}</h3>
                                                <p className="text-gray-400 text-sm">
                                                    {cohort.offering_type === 'master_class' ? 'Master Class' : 'Sprint Workshop'} ·
                                                    {' '}{formatDateLabel(cohort.start_date) || 'TBD'} → {formatDateLabel(cohort.end_date) || 'TBD'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 text-xs rounded-xl border ${statusBadge[cohort.status]}`}>
                                                    {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                                                </span>
                                                <button
                                                    onClick={async () => {
                                                        const { data } = await supabase.from('cohorts').select('*').order('start_date', { ascending: false })
                                                        setAllCohorts((data as Cohort[]) ?? [])
                                                        setSelectedCohortId(cohort.id)
                                                        setAssignError(null)
                                                        setIsAssignModalOpen(true)
                                                    }}
                                                    className="px-3 py-1 text-xs text-gray-400 hover:text-white border border-border rounded-xl hover:bg-white/5 transition"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mt-6">
                                            <div className="bg-bg-elevated rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-white">{sessions.length}</p>
                                                <p className="text-xs text-gray-400 mt-1">Sessions</p>
                                            </div>
                                            <div className="bg-bg-elevated rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-lime">{completedSessions}</p>
                                                <p className="text-xs text-gray-400 mt-1">Completed</p>
                                            </div>
                                            <div className="bg-bg-elevated rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-white">{members.length}</p>
                                                <p className="text-xs text-gray-400 mt-1">Members</p>
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

                                    {/* Sessions management */}
                                    <WorkspaceSessions
                                        cohortId={cohort.id}
                                        sessions={sessions}
                                        onSessionsChange={async () => {
                                            const { data } = await supabase
                                                .from('sessions').select('*')
                                                .eq('cohort_id', cohort.id)
                                                .order('session_number', { ascending: true })
                                            setSessions((data as Session[]) ?? [])
                                        }}
                                    />

                                    {/* Assignments management */}
                                    <WorkspaceAssignments
                                        cohortId={cohort.id}
                                        cohort={cohort}
                                        sessions={sessions}
                                        members={members}
                                    />

                                    {/* Attendance tracking */}
                                    <WorkspaceAttendance
                                        sessions={sessions}
                                        members={members}
                                    />
                                </>
                            )}
                        </div>
                    )
                }

                {/* ══ CHAT ══ */}
                {activeTab === 'chat' && (
                    <div className="space-y-6">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 text-center space-y-4">
                            <MessageSquare className="h-10 w-10 text-lime mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold text-white">Company Chat</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    View and manage conversations with {company.name}'s team
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/admin/chat')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl gradient-lime text-black hover:opacity-90 transition"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Open Chat
                            </button>
                        </div>

                        {/* Quick member list for DMs */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 space-y-3">
                            <h4 className="text-sm font-semibold text-white">Members — Quick DM</h4>
                            <p className="text-xs text-gray-500">Click a member to start a direct message from the Chat page.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {members.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => navigate('/admin/chat')}
                                        className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.025] border border-white/[0.05] rounded-xl hover:border-lime/30 transition text-left"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-lime/10 flex items-center justify-center text-xs font-bold text-lime shrink-0">
                                            {m.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-white truncate">{m.full_name}</p>
                                            <p className="text-[11px] text-gray-500 capitalize">{m.user_type || m.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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

            {/* ── Assign Program Modal ── */}
            <Portal>
                <AnimatePresence>
                    {isAssignModalOpen && (
                        <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAssignModalOpen(false)}
                                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                                className="relative z-10 w-full max-w-sm rounded-[24px] bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden"
                            >
                                <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-lime/10 flex items-center justify-center">
                                            <GraduationCap className="h-5 w-5 text-lime" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-white">Assign Program</h2>
                                            <p className="text-xs text-gray-500">Link a cohort to {company.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAssignModalOpen(false)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    {assignError && (
                                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{assignError}</div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Program / Cohort</label>
                                        <select
                                            value={selectedCohortId}
                                            onChange={(e) => setSelectedCohortId(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                                        >
                                            {allCohorts.length === 0 && <option value="">No programs available</option>}
                                            {allCohorts.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} ({c.offering_type === 'master_class' ? 'Master Class' : 'Sprint Workshop'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsAssignModalOpen(false)}
                                            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isAssigning || !selectedCohortId}
                                            onClick={async () => {
                                                if (!selectedCohortId || !company) return
                                                setIsAssigning(true)
                                                setAssignError(null)
                                                const { error: updateErr } = await supabase
                                                    .from('companies')
                                                    // @ts-expect-error - Supabase update type inference
                                                    .update({ cohort_id: selectedCohortId })
                                                    .eq('id', company.id)
                                                if (updateErr) {
                                                    setAssignError(updateErr.message)
                                                    setIsAssigning(false)
                                                    return
                                                }
                                                // Reload the cohort in state
                                                const { data: newCohort } = await supabase
                                                    .from('cohorts').select('*').eq('id', selectedCohortId).single()
                                                if (newCohort) setCohort(newCohort as Cohort)
                                                setIsAssigning(false)
                                                setIsAssignModalOpen(false)
                                            }}
                                            className="px-5 py-2 rounded-xl text-sm font-medium gradient-lime text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isAssigning && <Loader2 className="h-4 w-4 animate-spin" />}
                                            {isAssigning ? 'Assigning...' : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* ── Add Member Modal ── */}
            <Portal>
                <AnimatePresence>
                    {isAddMemberOpen && (
                        <div className="fixed inset-0 z-[71] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAddMemberOpen(false)}
                                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                                className="relative z-10 w-full max-w-sm rounded-[24px] bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden"
                            >
                                <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-lime/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-lime" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-white">Add Member</h2>
                                            <p className="text-xs text-gray-500">Assign an existing user to {company.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAddMemberOpen(false)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    {addMemberError && (
                                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{addMemberError}</div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Select User</label>
                                        <select
                                            value={selectedAddUserId}
                                            onChange={(e) => setSelectedAddUserId(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm text-white focus:outline-none focus:border-lime/40 focus:bg-white/[0.05] transition-all"
                                        >
                                            <option value="">Select a user…</option>
                                            {availableUsers.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.full_name} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                        {availableUsers.length === 0 && (
                                            <p className="text-xs text-gray-500 mt-2">No unassigned users found.</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddMemberOpen(false)}
                                            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isAddingMember || !selectedAddUserId}
                                            onClick={async () => {
                                                if (!selectedAddUserId || !id) return
                                                setIsAddingMember(true)
                                                setAddMemberError(null)
                                                const { error: updateErr } = await supabase
                                                    .from('users')
                                                    // @ts-expect-error - Supabase update type inference
                                                    .update({ company_id: id })
                                                    .eq('id', selectedAddUserId)
                                                if (updateErr) {
                                                    setAddMemberError(updateErr.message)
                                                    setIsAddingMember(false)
                                                    return
                                                }
                                                // Refresh members list
                                                const { data: updatedMembers } = await supabase
                                                    .from('users')
                                                    .select('*')
                                                    .eq('company_id', id)
                                                    .order('full_name')
                                                setMembers((updatedMembers as User[]) ?? [])
                                                setIsAddingMember(false)
                                                setIsAddMemberOpen(false)
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-lime text-black hover:bg-lime/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isAddingMember && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Add Member
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>
        </div >
    )
}
