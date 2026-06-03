import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, Mail, GraduationCap, Clock, 
    BarChart3, Brain, Target, Calendar, Building2, ExternalLink, 
    Award, AlertCircle, Star, Play
} from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import type { User as DbUser, Cohort, Company, Assignment, Session } from '@/types/database'

// Question text lookup for management survey rendering
const MGMT_QUESTION_LABELS: Record<string, string> = {
    q1_role: 'Leadership Role',
    q2_studio_focus: 'Studio Focus',
    q2_studio_focus_other: 'Studio Focus (Other)',
    q3_ai_adoption_status: 'AI Adoption Status',
    q4_visibility: 'AI Adoption Visibility',
    q5_opportunities: 'Opportunities Identified',
    q6_risks: 'Risks Identified',
    q7_alignment_confidence: 'Brand Alignment Confidence',
    q8_guidance_level: 'AI Policy/Guidance Level',
    q9_success_factor: 'Primary Success Factor',
    q10_team_readiness: 'Team Readiness Score',
    q12_objectives: 'Leadership Objectives',
    q13_success_definition: 'Success Definition',
    q14_reference_work_type: 'Reference Work Type',
    q15_reference_value: 'Reference Deliverable Value'
}

// Question text lookup for team survey rendering
const TEAM_QUESTION_LABELS: Record<string, string> = {
    q1_role: 'Role in Studio',
    q1_role_other: 'Role in Studio (Other)',
    q2_experience_years: 'Years of Experience',
    q3_ai_usage: 'Current AI Usage Frequency',
    q4_ai_tools: 'AI Tools Used Regularly',
    q4_ai_tools_other: 'AI Tools Used Regularly (Other)',
    q5_confidence_ai_workflow: 'Confidence in AI Workflows',
    q6_skill_level_ai_tools: 'Self-Rated AI Skill Level',
    q7_difficulty_areas: 'Workflow Difficulty Areas',
    q8_outputs_meet_standards_confidence: 'Confidence in Outputs Meeting Standards',
    q9_concerns: 'Concerns About AI Adoption',
    q10_help_most: 'What Would Help You Most',
    q11_readiness: 'Self-Rated Overall Readiness',
    q12_top_goals: 'Top Goals for the Masterclass',
    q13_success_definition: 'Success Definition',
    q14_project_context: 'Project Context & Needs'
}

// Dynamic question metadata for general rendering
const GENERAL_QUESTION_META: Record<string, { label: string; section: string; type: 'radio' | 'checkbox' | 'scale' | 'text' | 'matrix'; scaleLabels?: [string, string] }> = {
    role:                { label: 'Current Role', section: 'Role & Experience', type: 'radio' },
    experience_years:    { label: 'Years of Experience', section: 'Role & Experience', type: 'radio' },
    current_ai_usage:    { label: 'Current AI Usage', section: 'AI Usage', type: 'radio' },
    ai_tools_used:       { label: 'AI Tools Used', section: 'AI Usage', type: 'checkbox' },
    ai_confidence:       { label: 'AI Confidence', section: 'Skill Baseline', type: 'scale', scaleLabels: ['Not confident at all', 'Very confident'] },
    ai_skill_level:      { label: 'AI Skill Level', section: 'Skill Baseline', type: 'scale', scaleLabels: ['Beginner', 'Advanced'] },
    workflow_difficulties:{ label: 'Workflow Difficulties', section: 'Challenges', type: 'checkbox' },
    quality_confidence:  { label: 'Output Quality Confidence', section: 'Challenges', type: 'scale', scaleLabels: ['Not confident', 'Very confident'] },
    ai_concerns:         { label: 'AI Concerns', section: 'Concerns', type: 'checkbox' },
    learning_needs:      { label: 'Learning Needs', section: 'Learning', type: 'checkbox' },
    workflow_readiness:  { label: 'Workflow Readiness', section: 'Learning', type: 'scale', scaleLabels: ['Not ready', 'Fully ready'] },
    masterclass_goals:   { label: 'Sprint Workshop Goals', section: 'Expectations', type: 'checkbox' },
    success_definition:  { label: 'Success Definition', section: 'Expectations', type: 'text' },
    project_context:     { label: 'Project Context', section: 'Expectations', type: 'text' }
}

export function MemberDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const supabase = useSupabase()

    const [member, setMember] = useState<DbUser | null>(null)
    const [company, setCompany] = useState<Company | null>(null)
    const [cohorts, setCohorts] = useState<Cohort[]>([])
    const [assignments, setAssignments] = useState<(Assignment & { sessionNumber?: number; sessionTitle?: string })[]>([])
    const [submissions, setSubmissions] = useState<any[]>([])
    
    // Surveys
    const [mgmtSurvey, setMgmtSurvey] = useState<any>(null)
    const [teamSurvey, setTeamSurvey] = useState<any>(null)
    const [preSurvey, setPreSurvey] = useState<any>(null)
    const [postSurvey, setPostSurvey] = useState<any>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'onboarding' | 'assignments' | 'surveys'>('onboarding')

    // Video play preview modal states
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return

        const fetchAllData = async () => {
            setIsLoading(true)
            setError(null)
            try {
                // 1. Fetch user profile
                const { data: uData, error: uErr } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .single()
                
                if (uErr) throw uErr
                const userObj = uData as DbUser
                setMember(userObj)

                // 2. Fetch company if present
                if (userObj.company_id) {
                    const { data: cData } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', userObj.company_id)
                        .maybeSingle()
                    setCompany(cData as Company | null)
                }

                // 3. Fetch surveys (Mgmt / Team / Pre-check / Post-check)
                const emailQuery = userObj.email || ''
                const [mgmtRes, teamRes, preRes, postRes] = await Promise.all([
                    supabase.from('management_submissions').select('*').ilike('user_email', emailQuery).maybeSingle(),
                    supabase.from('team_submissions').select('*').ilike('user_email', emailQuery).maybeSingle(),
                    (supabase as any).from('pre_completion_survey_responses').select('*').ilike('respondent_email', emailQuery).maybeSingle(),
                    supabase.from('post_completion_survey_responses').select('*').ilike('respondent_email', emailQuery).maybeSingle()
                ])

                setMgmtSurvey(mgmtRes.data)
                setTeamSurvey(teamRes.data)
                setPreSurvey(preRes.data)
                setPostSurvey(postRes.data)

                // 4. Fetch program memberships
                const { data: memberships } = await supabase
                    .from('cohort_memberships')
                    .select('cohort_id')
                    .eq('user_id', id)

                const cohortIds = (memberships as { cohort_id: string }[] | null)?.map((m) => m.cohort_id) || []
                
                // Fallback: If user's company is assigned to a cohort, add it
                if (userObj.company_id) {
                    const { data: compObj } = await supabase
                        .from('companies')
                        .select('cohort_id')
                        .eq('id', userObj.company_id)
                        .maybeSingle()
                    
                    if (compObj?.cohort_id && !cohortIds.includes(compObj.cohort_id)) {
                        cohortIds.push(compObj.cohort_id)
                    }
                }

                // 5. Fetch cohorts and corresponding assignments/sessions
                if (cohortIds.length > 0) {
                    const [cohortsRes, sessionsRes] = await Promise.all([
                        supabase.from('cohorts').select('*').in('id', cohortIds),
                        supabase.from('sessions').select('*').in('cohort_id', cohortIds).order('session_number')
                    ])

                    const loadedCohorts = (cohortsRes.data as Cohort[]) || []
                    setCohorts(loadedCohorts)

                    const sessionsList = (sessionsRes.data as Session[]) || []
                    const sessionIds = sessionsList.map((s) => s.id)

                    if (sessionIds.length > 0) {
                        const { data: assignmentsRes } = await supabase
                            .from('assignments')
                            .select('*')
                            .in('session_id', sessionIds)
                            .order('due_date', { ascending: true })

                        const assignmentsList = (assignmentsRes as Assignment[]) || []
                        
                        // Map session details to assignments
                        const sessionMap = new Map(sessionsList.map(s => [s.id, s]))
                        const mappedAssignments = assignmentsList.map((a) => {
                            const sess = sessionMap.get(a.session_id)
                            return {
                                ...a,
                                sessionNumber: sess?.session_number,
                                sessionTitle: sess?.title
                            }
                        })
                        setAssignments(mappedAssignments)
                    }
                }

                // 6. Fetch submissions by this user
                const { data: subsData } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('user_id', id)
                    .order('submitted_at', { ascending: false })
                
                setSubmissions(subsData || [])

            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAllData()
    }, [id])

    // Match assignments with user submissions
    const assignmentSubmissions = useMemo(() => {
        return assignments.map((a) => {
            const sub = submissions.find((s) => s.assignment_id === a.id)
            return {
                assignment: a,
                submission: sub
            }
        })
    }, [assignments, submissions])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
            </div>
        )
    }

    if (error || !member) {
        return (
            <div className="space-y-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error ?? 'Member profile not found'}
                </div>
            </div>
        )
    }

    const readiness = member.ai_readiness_score
    const scoreColorClass = readiness !== null 
        ? (readiness >= 70 ? 'text-lime border-lime/30 bg-lime/10' : readiness >= 40 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5')
        : 'text-gray-500 border-white/[0.08] bg-white/[0.02]'

    // ── Helper Score Bar ──
    const ScoreBar = ({ label, value }: { label: string; value: number | null | undefined }) => (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
                <span className="text-gray-500">{label}</span>
                <span className={`font-black ${value && value >= 7 ? 'text-lime' : value && value >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {value ? `${value} / 10` : '—'}
                </span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${value && value >= 7 ? 'bg-lime shadow-[0_0_8px_rgba(208,255,113,0.3)]' : value && value >= 4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${(value || 0) * 10}%` }}
                />
            </div>
        </div>
    )

    // Parse submissions data safely
    const parseSubmissionUrl = (fileUrl: string | null) => {
        if (!fileUrl) return null
        try {
            return JSON.parse(fileUrl)
        } catch {
            return fileUrl // Fallback if plain text URL
        }
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* ── Back + Page Header ── */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{member.full_name || 'Member Profile'}</h1>
                        <p className="text-gray-400 text-sm mt-1">Detailed participant input workspace, onboarding, and submissions</p>
                    </div>
                </div>
            </div>

            {/* ── Member Identity Summary Card ── */}
            <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm hover:border-white/[0.12] transition">
                <div className="h-20 w-20 rounded-2xl gradient-lime flex items-center justify-center shrink-0 shadow-lg">
                    {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                        <span className="text-3xl font-black text-black">
                            {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                    <h2 className="text-xl font-bold text-white truncate">{member.full_name}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-gray-500" />{member.email}</span>
                        {company && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gray-500" />{company.name}</span>}
                        {cohorts.length > 0 && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-gray-500" />{cohorts.map(c => c.name).join(', ')}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-wide">
                            {member.user_type ? member.user_type.replace(/_/g, ' ') : 'Participant'}
                        </span>
                        {member.position && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-gray-300 text-xs font-medium">
                                {member.position}
                            </span>
                        )}
                        {member.nationality && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-gray-300 text-xs font-medium">
                                {member.nationality}
                            </span>
                        )}
                        {member.age && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-gray-300 text-xs font-medium">
                                Age {member.age}
                            </span>
                        )}
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">AI Readiness</p>
                        <div className={`px-4 py-2 rounded-xl border text-lg font-black text-center ${scoreColorClass}`}>
                            {readiness !== null ? `${readiness}%` : 'Pending'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Subtitle Tab Toggles ── */}
            <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.06] rounded-[20px] p-1 w-fit flex-wrap">
                {[
                    { id: 'onboarding', label: 'Onboarding Survey', icon: Brain },
                    { id: 'assignments', label: 'Submissions & Assignments', icon: Target },
                    { id: 'surveys', label: 'Program Feedback Surveys', icon: BarChart3 }
                ].map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                isActive 
                                    ? 'bg-lime/10 text-lime border border-lime/20' 
                                    : 'text-gray-400 hover:text-white border border-transparent'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* ── Tab Content ── */}
            <div className="space-y-6">

                {/* ══ ONBOARDING SURVEY ══ */}
                {activeTab === 'onboarding' && (
                    <div className="space-y-6">
                        {/* Onboarding Status Alert */}
                        {!member.onboarding_completed && (
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-white text-sm">Onboarding Survey Pending</h4>
                                    <p className="text-gray-400 text-xs mt-1">This user has not completed the onboarding workflow survey.</p>
                                </div>
                            </div>
                        )}

                        {/* Rendering dynamically based on User Type */}
                        {member.onboarding_completed && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* Onboarding: Sprint Member Mode (direct JSON in onboarding_data) */}
                                {member.user_type === 'sprint_member' && member.onboarding_data && (
                                    <div className="lg:col-span-3 space-y-6">
                                        {(() => {
                                            const oData = member.onboarding_data as Record<string, any>
                                            const answers = oData?.survey_answers as Record<string, any> | undefined
                                            if (!answers) return <p className="text-gray-500 text-sm">No survey answers found.</p>
                                            
                                            // Group questions
                                            const sections: Record<string, Array<{ key: string; meta: any; value: any }>> = {}
                                            for (const [key, value] of Object.entries(answers)) {
                                                const meta = GENERAL_QUESTION_META[key]
                                                if (!meta) continue
                                                if (!sections[meta.section]) sections[meta.section] = []
                                                sections[meta.section].push({ key, meta, value })
                                            }

                                            return Object.entries(sections).map(([sectName, items]) => (
                                                <div key={sectName} className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
                                                    <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.01]">
                                                        <h3 className="font-heading text-base font-bold text-white uppercase tracking-wider">{sectName}</h3>
                                                    </div>
                                                    <div className="divide-y divide-white/[0.05] px-6">
                                                        {items.map(({ key, meta, value }) => (
                                                            <div key={key} className="py-4 space-y-2">
                                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold">{meta.label}</p>
                                                                {meta.type === 'scale' ? (
                                                                    <ScoreBar label="" value={value} />
                                                                ) : meta.type === 'checkbox' && Array.isArray(value) ? (
                                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                                        {value.map(v => (
                                                                            <span key={v} className="px-2.5 py-0.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-wide">
                                                                                {v}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-white font-medium">{String(value)}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        })()}
                                    </div>
                                )}

                                {/* Onboarding: Management Survey Mode (from management_submissions table) */}
                                {member.user_type === 'management' && (
                                    <>
                                        {!mgmtSurvey ? (
                                            <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-8 text-center text-gray-500">
                                                No Management Survey record found for {member.email}.
                                            </div>
                                        ) : (
                                            <div className="lg:col-span-3 space-y-6">
                                                {/* Scale Metrics */}
                                                <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6 space-y-5">
                                                    <h3 className="font-heading text-sm font-extrabold text-lime uppercase tracking-widest">Key Management Metrics</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <ScoreBar label="Adoption Visibility (Q4)" value={mgmtSurvey.q4_visibility} />
                                                        <ScoreBar label="Brand Alignment (Q7)" value={mgmtSurvey.q7_alignment_confidence} />
                                                        <ScoreBar label="Team Readiness (Q10)" value={mgmtSurvey.q10_team_readiness} />
                                                    </div>
                                                    <div className="border-t border-white/[0.06] pt-5 space-y-4">
                                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Expected Business Impact Matrix (Q11)</span>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                                            <ScoreBar label="Speed" value={mgmtSurvey.q11_impact_speed} />
                                                            <ScoreBar label="Quality" value={mgmtSurvey.q11_impact_quality} />
                                                            <ScoreBar label="Efficiency" value={mgmtSurvey.q11_impact_efficiency} />
                                                            <ScoreBar label="Client Satisfaction" value={mgmtSurvey.q11_impact_client_satisfaction} />
                                                            <ScoreBar label="Comp. Advantage" value={mgmtSurvey.q11_impact_competitive_advantage} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Text Questions list */}
                                                <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6">
                                                    <h3 className="font-heading text-sm font-extrabold text-white uppercase tracking-widest mb-4">Detailed Answers</h3>
                                                    <div className="divide-y divide-white/[0.05] space-y-4">
                                                        {Object.entries(MGMT_QUESTION_LABELS).map(([col, text]) => {
                                                            const val = mgmtSurvey[col]
                                                            if (val === undefined || val === null || col === 'q4_visibility' || col === 'q7_alignment_confidence' || col === 'q10_team_readiness') return null
                                                            return (
                                                                <div key={col} className="pt-4 first:pt-0 space-y-1.5">
                                                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold">{text}</p>
                                                                    {Array.isArray(val) ? (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {val.map(v => (
                                                                                <span key={v} className="px-2.5 py-0.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-wide">
                                                                                    {v}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-white font-medium">{String(val)}</p>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Onboarding: Team Member Survey Mode (from team_submissions table) */}
                                {member.user_type === 'team' && (
                                    <>
                                        {!teamSurvey ? (
                                            <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-8 text-center text-gray-500">
                                                No Team Survey record found for {member.email}.
                                            </div>
                                        ) : (
                                            <div className="lg:col-span-3 space-y-6">
                                                {/* Scale Metrics */}
                                                <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6 space-y-5">
                                                    <h3 className="font-heading text-sm font-extrabold text-lime uppercase tracking-widest">Self-Rated AI Performance</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <ScoreBar label="Confidence in AI Workflows" value={teamSurvey.q5_confidence_ai_workflow} />
                                                        <ScoreBar label="Self-Rated AI Skill Level" value={teamSurvey.q6_skill_level_ai_tools} />
                                                        <ScoreBar label="Overall Readiness" value={teamSurvey.q11_readiness} />
                                                    </div>
                                                </div>

                                                {/* Text Questions list */}
                                                <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6">
                                                    <h3 className="font-heading text-sm font-extrabold text-white uppercase tracking-widest mb-4">Detailed Answers</h3>
                                                    <div className="divide-y divide-white/[0.05] space-y-4">
                                                        {Object.entries(TEAM_QUESTION_LABELS).map(([col, text]) => {
                                                            const val = teamSurvey[col]
                                                            if (val === undefined || val === null || col === 'q5_confidence_ai_workflow' || col === 'q6_skill_level_ai_tools' || col === 'q11_readiness') return null
                                                            return (
                                                                <div key={col} className="pt-4 first:pt-0 space-y-1.5">
                                                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold">{text}</p>
                                                                    {Array.isArray(val) ? (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {val.map(v => (
                                                                                <span key={v} className="px-2.5 py-0.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-wide">
                                                                                    {v}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-white font-medium">{String(val)}</p>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                            </div>
                        )}
                    </div>
                )}

                {/* ══ ASSIGNMENTS & SUBMISSIONS ══ */}
                {activeTab === 'assignments' && (
                    <div className="space-y-6">
                        {assignmentSubmissions.length === 0 ? (
                            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[24px] p-8 text-center text-gray-500">
                                <Target className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                No assignments found for the cohorts this member is registered in.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {assignmentSubmissions.map(({ assignment: a, submission: s }) => {
                                    const isReflection1 = a.title.toLowerCase().includes('session 1 reflection')
                                    const isReflection2 = a.title.toLowerCase().includes('session 2 reflection')
                                    const isSprintDeliverable = a.title.toLowerCase().includes('sprint assignment') || a.title === 'AI ASSIGNMENT'
                                    
                                    const details = parseSubmissionUrl(s?.file_url)

                                    return (
                                        <div key={a.id} className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6 hover:border-white/[0.12] transition flex flex-col gap-5">
                                            {/* Sub header */}
                                            <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/[0.05] pb-4">
                                                <div>
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime">Session {a.sessionNumber ?? '—'}: {a.sessionTitle ?? '—'}</span>
                                                    <h3 className="text-base font-bold text-white mt-0.5">{a.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {s ? (
                                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border uppercase tracking-wider ${
                                                            s.status === 'approved' ? 'bg-lime/10 border-lime/30 text-lime' :
                                                            s.status === 'resubmit' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                            s.status === 'in_review' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                                                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                        }`}>
                                                            {s.status === 'resubmit' ? 'Needs Resubmit' : s.status.replace(/_/g, ' ')}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg border border-white/[0.08] bg-white/[0.02] text-gray-500 uppercase tracking-wider">
                                                            Unsubmitted
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub description if unsubmitted */}
                                            {!s && (
                                                <p className="text-xs text-gray-500 italic">No deliverable has been uploaded yet for this assignment.</p>
                                            )}

                                            {/* Submission Details */}
                                            {s && (
                                                <div className="space-y-4">
                                                    {/* Session 1 Reflection answers */}
                                                    {isReflection1 && details?.data && (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl text-xs">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500">Biggest Gap</span>
                                                                <p className="text-white font-medium">{details.data.gap}</p>
                                                                <p className="text-gray-400 mt-1 italic">"{details.data.gap_explanation}"</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500">Skipped Practices</span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {details.data.skipped_practices?.map((p: string) => (
                                                                        <span key={p} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[9px] uppercase tracking-wide font-bold">{p}</span>
                                                                    )) || 'None'}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500">Biggest Mistake</span>
                                                                <p className="text-white font-medium italic">"{details.data.biggest_mistake}"</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Session 2 Reflection answers */}
                                                    {isReflection2 && details?.data && (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl text-xs">
                                                            <div className="space-y-1 col-span-2">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500">New Use Cases</span>
                                                                <p className="text-white font-medium italic">"{details.data.new_use_cases}"</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500">Biggest Blocker</span>
                                                                <p className="text-white font-medium">{details.data.biggest_blocker}</p>
                                                            </div>
                                                            <div className="space-y-1 col-span-3 pt-3 border-t border-white/[0.05]">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500">Confidence Score</span>
                                                                <ScoreBar label="" value={details.data.confidence_score} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Sprint Deliverables Images and Videos inline display */}
                                                    {isSprintDeliverable && details && (
                                                        <div className="space-y-5">
                                                            {/* Track and Concept header info */}
                                                            <div className="flex flex-wrap gap-4 text-xs font-semibold border-b border-white/[0.05] pb-3">
                                                                <span className="text-gray-400">Track: <span className="text-white font-bold uppercase">{details.track}</span></span>
                                                                <span className="text-gray-400">Concept: <span className="text-white font-bold">{details.concept}</span></span>
                                                                <span className="text-gray-400">Format: <span className="text-white font-bold uppercase">{details.submission_mode}</span></span>
                                                            </div>

                                                            {/* Google Drive Folder Link fallback if used */}
                                                            {details.submission_mode === 'link' && (
                                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                                    <div className="space-y-1">
                                                                        <span className="text-[10px] uppercase text-gray-500 font-bold">Google Drive Link</span>
                                                                        <p className="text-white text-xs truncate max-w-md">{details.folder_link}</p>
                                                                    </div>
                                                                    <a href={details.folder_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-lime text-black text-xs font-bold rounded-lg hover:opacity-90 transition">
                                                                        <ExternalLink className="h-3.5 w-3.5" /> View Folder
                                                                    </a>
                                                                </div>
                                                            )}

                                                            {/* Direct Uploaded Files layout */}
                                                            {details.submission_mode === 'upload' && (
                                                                <div className="space-y-4">
                                                                    {/* Images Row */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                        {[
                                                                            { label: 'Hero Shot', url: details.hero },
                                                                            { label: 'Interior FF&E', url: details.detail },
                                                                            { label: 'Iteration POVs', url: details.alt }
                                                                        ].map((img, i) => (
                                                                            <div key={i} className="space-y-1.5">
                                                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{img.label}</span>
                                                                                {img.url ? (
                                                                                    <div className="relative group aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                                                                                        <img src={img.url} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" alt="" />
                                                                                        <a href={img.url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                                                        </a>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="aspect-video rounded-xl border border-dashed border-white/[0.08] flex items-center justify-center text-xs text-gray-600 bg-white/[0.01]">Missing file</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Animations Videos Row */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/[0.05] pt-4">
                                                                        {[
                                                                            { label: 'Animation A (Required)', url: details.animA },
                                                                            { label: 'Animation B (Required)', url: details.animB }
                                                                        ].map((vid, i) => (
                                                                            <div key={i} className="space-y-1.5">
                                                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{vid.label}</span>
                                                                                {vid.url ? (
                                                                                    <div className="relative group aspect-video rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                                                                                        <video src={vid.url} className="h-full w-full object-cover" preload="metadata" />
                                                                                        <button 
                                                                                            onClick={() => setActiveVideoUrl(vid.url)}
                                                                                            className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-lime text-black flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer"
                                                                                        >
                                                                                            <Play className="h-5 w-5 fill-current ml-0.5" />
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="aspect-video rounded-xl border border-dashed border-white/[0.08] flex items-center justify-center text-xs text-gray-600 bg-white/[0.01]">Missing video</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Docs / Prompts document row */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/[0.05] pt-4 text-xs">
                                                                        <div className="space-y-1">
                                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Prompts document</span>
                                                                            {details.doc ? (
                                                                                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                                                                    <span className="truncate text-white font-medium max-w-[200px]">{details.doc.split('/').pop()}</span>
                                                                                    <a href={details.doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-lime hover:underline font-bold">
                                                                                        <ExternalLink className="h-3 w-3" /> View Doc
                                                                                    </a>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="p-3 border border-dashed border-white/[0.08] text-gray-600 rounded-xl bg-white/[0.01] italic">No prompts document uploaded</div>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Optional Bonus film</span>
                                                                            {details.bonus ? (
                                                                                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                                                                    <span className="truncate text-white font-medium">30s Short Film</span>
                                                                                    <button 
                                                                                        onClick={() => setActiveVideoUrl(details.bonus)}
                                                                                        className="flex items-center gap-1 text-[10px] text-lime hover:underline font-bold cursor-pointer"
                                                                                    >
                                                                                        <Play className="h-3 w-3 fill-current" /> Play Video
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="p-3 border border-dashed border-white/[0.08] text-gray-600 rounded-xl bg-white/[0.01] italic">No bonus short film uploaded</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Textarea prompts value for Sprint */}
                                                    {s.prompt_text && (
                                                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
                                                            <span className="text-[10px] uppercase font-bold text-gray-500">Submitted Prompts Text</span>
                                                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{s.prompt_text}</pre>
                                                        </div>
                                                    )}

                                                    {/* General Submission files link */}
                                                    {!isReflection1 && !isReflection2 && !isSprintDeliverable && s.file_url && (
                                                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] uppercase text-gray-500 font-bold">Submission File Link</span>
                                                                <p className="text-white text-xs truncate max-w-md">{s.file_url}</p>
                                                            </div>
                                                            <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-lime text-black text-xs font-bold rounded-lg hover:opacity-90 transition">
                                                                <ExternalLink className="h-3.5 w-3.5" /> View file
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Grading score and notes summary */}
                                                    <div className="border-t border-white/[0.05] pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                                                        <div className="flex items-center gap-4 text-gray-400">
                                                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Submitted {new Date(s.submitted_at).toLocaleDateString()}</span>
                                                            {s.score !== null && (
                                                                <span className="flex items-center gap-1 font-bold text-white">
                                                                    <Star className="h-3.5 w-3.5 text-lime fill-current" />
                                                                    Grade: {s.score}/100
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Feedback panel */}
                                                    {s.feedback && (
                                                        <div className="p-4 border border-lime/20 bg-lime/[0.02] rounded-xl space-y-1">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-lime">Khaled's Feedback</span>
                                                            <p className="text-xs text-gray-300 leading-relaxed italic">"{s.feedback}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ OTHER SURVEYS (MID & POST) ══ */}
                {activeTab === 'surveys' && (
                    <div className="space-y-6">
                        
                        {/* Mid-Program Survey Check-In */}
                        <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6 space-y-4">
                            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.05] pb-3">
                                <Clock className="h-5 w-5 text-lime" />
                                Mid-Program Survey Response
                            </h3>

                            {!preSurvey ? (
                                <p className="text-xs text-gray-500 italic">No mid-program survey responses submitted by this member.</p>
                            ) : (
                                <div className="space-y-4 divide-y divide-white/[0.05]">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-2">
                                        <ScoreBar label="AI Adoption Visibility" value={(preSurvey.answers as any)?.ai_visibility} />
                                        <ScoreBar label="Team Readiness" value={(preSurvey.answers as any)?.team_readiness} />
                                        <ScoreBar label="Brand Alignment Confidence" value={(preSurvey.answers as any)?.brand_confidence} />
                                    </div>
                                    {Object.entries((preSurvey.answers as Record<string, any>) || {}).map(([key, val]) => {
                                        if (key === 'ai_visibility' || key === 'team_readiness' || key === 'brand_confidence') return null
                                        return (
                                            <div key={key} className="pt-4 space-y-1.5">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold">{key.replace(/_/g, ' ')}</p>
                                                {Array.isArray(val) ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {val.map(v => (
                                                            <span key={v} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px] uppercase font-bold">{v}</span>
                                                        ))}
                                                    </div>
                                                ) : (typeof val === 'object' && val !== null) ? (
                                                    <div className="grid grid-cols-2 gap-3 text-xs pl-2.5 border-l border-lime/20">
                                                        {Object.entries(val as Record<string, any>).map(([k, v]) => (
                                                            <div key={k} className="flex justify-between">
                                                                <span className="text-gray-500">{k}</span>
                                                                <span className="text-lime font-black">{String(v)}/5</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-white font-medium">{String(val)}</p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Post-Completion Offboarding Survey */}
                        <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-6 space-y-4">
                            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 border-b border-white/[0.05] pb-3">
                                <Award className="h-5 w-5 text-lime" />
                                Post-Completion Survey Response (Offboarding)
                            </h3>

                            {!postSurvey ? (
                                <p className="text-xs text-gray-500 italic">No post-completion offboarding survey responses submitted by this member.</p>
                            ) : (
                                <div className="space-y-4 divide-y divide-white/[0.05]">
                                    {Object.entries((postSurvey.answers as Record<string, any>) || {}).map(([key, val]) => (
                                        <div key={key} className="pt-4 first:pt-0 space-y-1.5">
                                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold">{key.replace(/_/g, ' ')}</p>
                                            {Array.isArray(val) ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {val.map(v => (
                                                        <span key={v} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px] uppercase font-bold">{v}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-white font-medium">{String(val)}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>

            {/* ── Video Preview Modal ── */}
            {activeVideoUrl && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveVideoUrl(null)} />
                    <div className="relative z-10 w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <video src={activeVideoUrl} controls autoPlay className="h-full w-full object-contain" />
                        <button 
                            onClick={() => setActiveVideoUrl(null)}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black text-white hover:text-red-400 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
