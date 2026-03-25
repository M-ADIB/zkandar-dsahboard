import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, Clock, Target, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'

import { computeInitialScore, computeAssignmentBoost, computeFinalScore } from '@/lib/scoring'
import type { SurveyAnswers } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────
interface GradedSubmission {
    score: number
}

// ─── Radar Chart Helpers ─────────────────────────────────────────────────────
const RADAR_AXES = ['Speed', 'Quality', 'Tool Mastery', 'Confidence', 'Consistency']
const RADAR_CENTER = 120
const RADAR_RADIUS = 90

function polarToCartesian(angle: number, radius: number): [number, number] {
    const rad = ((angle - 90) * Math.PI) / 180
    return [RADAR_CENTER + radius * Math.cos(rad), RADAR_CENTER + radius * Math.sin(rad)]
}

function getRadarPoints(values: number[], maxRadius: number): string {
    const step = 360 / values.length
    return values.map((v, i) => {
        const r = (v / 100) * maxRadius
        const [x, y] = polarToCartesian(i * step, r)
        return `${x},${y}`
    }).join(' ')
}

function computeRadarValues(
    answers: SurveyAnswers,
    userType: string | null,
    avgScore: number
): number[] {
    if (userType === 'management') {
        return [
            ((typeof answers.team_readiness === 'number' ? answers.team_readiness : 1) / 5) * 100,
            ((typeof answers.brand_confidence === 'number' ? answers.brand_confidence : 1) / 5) * 100,
            getToolMasteryManagement(answers),
            ((typeof answers.ai_visibility === 'number' ? answers.ai_visibility : 1) / 5) * 100,
            avgScore,
        ]
    }
    return [
        ((typeof answers.workflow_readiness === 'number' ? answers.workflow_readiness : 1) / 5) * 100,
        ((typeof answers.quality_confidence === 'number' ? answers.quality_confidence : 1) / 5) * 100,
        getToolMasteryTeam(answers),
        ((typeof answers.ai_confidence === 'number' ? answers.ai_confidence : 1) / 5) * 100,
        avgScore,
    ]
}

function getToolMasteryTeam(answers: SurveyAnswers): number {
    const tools = answers.ai_tools_used
    if (!Array.isArray(tools)) return 10
    const count = tools.filter((t: string) => t !== 'None of the above').length
    return Math.min(100, Math.round((count / 6) * 100))
}

function getToolMasteryManagement(answers: SurveyAnswers): number {
    const usage = answers.studio_ai_usage
    const map: Record<string, number> = {
        'Not in use': 10,
        'Informal experimentation by individuals': 30,
        'Structured internal use for concept design': 55,
        'Regular use including client-facing outputs': 80,
    }
    return typeof usage === 'string' ? (map[usage] ?? 15) : 15
}

// ─── Bottleneck Zones ────────────────────────────────────────────────────────
const BOTTLENECK_ZONES = [
    { key: 'Getting strong concepts or ideas', label: 'Concept Generation', icon: Target },
    { key: 'Creating mood or storytelling visuals', label: 'Visual Storytelling', icon: Zap },
    { key: 'Controlling style and consistency', label: 'Style Control', icon: Target },
    { key: 'Iterating efficiently', label: 'Iteration Speed', icon: Clock },
    { key: 'Handling feedback or revisions', label: 'Revision Handling', icon: AlertTriangle },
    { key: 'Translating AI ideas into real design work', label: 'Design Translation', icon: TrendingUp },
]

// ─── Time Wasted Data ────────────────────────────────────────────────────────
const TIME_DATA: Record<string, { manual: number; optimized: number }> = {
    'Interior Designer': { manual: 18, optimized: 6 },
    'Architect': { manual: 20, optimized: 7 },
    'Visualizer': { manual: 22, optimized: 5 },
    'Junior Designer': { manual: 15, optimized: 5 },
    'Senior Designer': { manual: 16, optimized: 5 },
    'BIM / Technical': { manual: 14, optimized: 8 },
    'Other': { manual: 12, optimized: 6 },
}

// ─── Score Color ─────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
    if (score < 30) return '#f87171' // red
    if (score < 60) return '#fbbf24' // amber
    return '#D0FF71' // lime
}

function scoreLabel(score: number): string {
    if (score < 20) return 'Critical Gap'
    if (score < 35) return 'Not AI-Ready'
    if (score < 55) return 'Developing'
    if (score < 75) return 'Progressing'
    if (score < 90) return 'Proficient'
    return 'AI-Ready'
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export function MyPerformancePage() {
    const { user } = useAuth()
    const { effectiveUserId } = useViewMode()

    const [loading, setLoading] = useState(true)
    const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({})
    const [userType, setUserType] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [gradedScores, setGradedScores] = useState<number[]>([])

    // Fetch data
    useEffect(() => {
        if (!user || !effectiveUserId) return
        const fetch = async () => {
            setLoading(true)

            // Get user profile
            const { data: profile } = await supabase
                .from('users')
                .select('onboarding_data, user_type, ai_readiness_score')
                .eq('id', effectiveUserId)
                .single() as { data: { onboarding_data: Record<string, unknown> | null; user_type: string | null; ai_readiness_score: number } | null }

            if (profile) {
                const od = profile.onboarding_data as Record<string, unknown> | null
                setSurveyAnswers((od?.survey_answers as SurveyAnswers) ?? {})
                setUserType(profile.user_type)
                // Get role from survey
                const answers = (od?.survey_answers as SurveyAnswers) ?? {}
                setUserRole(typeof answers.role === 'string' ? answers.role : null)
            }

            // Get user's cohort → sessions → assignments → graded submissions
            // Try company path first, then cohort_memberships
            const { data: userData } = await supabase
                .from('users')
                .select('company_id')
                .eq('id', effectiveUserId)
                .single() as { data: { company_id: string | null } | null }

            let cohortId: string | null = null

            // Path 1: company → cohort
            if (userData?.company_id) {
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('cohort_id')
                    .eq('id', userData.company_id)
                    .single() as { data: { cohort_id: string | null } | null }
                cohortId = companyData?.cohort_id ?? null
            }

            // Path 2: cohort_memberships (sprint workshop / direct membership)
            if (!cohortId) {
                const { data: memberships } = await supabase
                    .from('cohort_memberships')
                    .select('cohort_id')
                    .eq('user_id', effectiveUserId)
                const memberCohortIds = ((memberships as { cohort_id: string }[] | null) ?? []).map(m => m.cohort_id)
                if (memberCohortIds.length > 0) {
                    cohortId = memberCohortIds[0]
                }
            }

            if (cohortId) {
                const { data: sessions } = await supabase
                    .from('sessions')
                    .select('id')
                    .eq('cohort_id', cohortId)

                if (sessions && sessions.length > 0) {
                    const { data: assignments } = await supabase
                        .from('assignments')
                        .select('id')
                        .in('session_id', sessions.map((s: { id: string }) => s.id))

                    if (assignments && assignments.length > 0) {
                        const { data: subs } = await supabase
                            .from('submissions')
                            .select('score')
                            .eq('user_id', effectiveUserId)
                            .in('assignment_id', assignments.map((a: { id: string }) => a.id))
                            .not('score', 'is', null)

                        setGradedScores(
                            ((subs as GradedSubmission[]) ?? []).map((s) => s.score)
                        )
                    }
                }
            }

            setLoading(false)
        }
        fetch()
    }, [user, effectiveUserId])

    // ─── Computed Values ──────────────────────────────────────────────────────
    const initialScore = useMemo(
        () => computeInitialScore(surveyAnswers, userType),
        [surveyAnswers, userType]
    )
    const boost = useMemo(() => computeAssignmentBoost(gradedScores), [gradedScores])
    const finalScore = useMemo(() => computeFinalScore(initialScore, boost), [initialScore, boost])

    const radarValues = useMemo(
        () => computeRadarValues(surveyAnswers, userType, gradedScores.length > 0 ? gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length : 0),
        [surveyAnswers, userType, gradedScores]
    )

    const difficulties = useMemo(() => {
        const d = surveyAnswers.workflow_difficulties
        return Array.isArray(d) ? d : []
    }, [surveyAnswers])

    const roleKey = userRole ?? 'Other'
    const timeData = TIME_DATA[roleKey] ?? TIME_DATA['Other']

    // Write the computed score back to the DB so the dashboard can read it
    useEffect(() => {
        if (loading || !effectiveUserId || finalScore === 0) return
        // @ts-expect-error - Supabase update type inference issue
        supabase.from('users').update({ ai_readiness_score: finalScore }).eq('id', effectiveUserId)
    }, [finalScore, effectiveUserId, loading])

    // ─── SVG Gauge ────────────────────────────────────────────────────────────
    const gaugeCircumference = 2 * Math.PI * 70
    const gaugeFill = (finalScore / 100) * gaugeCircumference

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">My Performance</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Your AI readiness assessment based on your survey responses and assignment performance.
                </p>
            </div>

            {/* ─── Row 1: AI Readiness Gauge + Summary ────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-[300px_1fr] gap-6"
            >
                {/* Gauge */}
                <div className="rounded-2xl border border-border bg-bg-card p-6 flex flex-col items-center justify-center">
                    <svg width="180" height="180" viewBox="0 0 180 180" className="mb-4">
                        {/* Background circle */}
                        <circle
                            cx="90" cy="90" r="70"
                            fill="none"
                            stroke="hsl(0, 0%, 12%)"
                            strokeWidth="12"
                        />
                        {/* Score arc */}
                        <motion.circle
                            cx="90" cy="90" r="70"
                            fill="none"
                            stroke={scoreColor(finalScore)}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={gaugeCircumference}
                            strokeDashoffset={gaugeCircumference - gaugeFill}
                            transform="rotate(-90 90 90)"
                            initial={{ strokeDashoffset: gaugeCircumference }}
                            animate={{ strokeDashoffset: gaugeCircumference - gaugeFill }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                        {/* Score text */}
                        <text
                            x="90" y="82"
                            textAnchor="middle"
                            className="fill-white font-heading text-4xl font-black"
                        >
                            {finalScore}%
                        </text>
                        <text
                            x="90" y="105"
                            textAnchor="middle"
                            className="fill-gray-500 text-xs"
                        >
                            AI Readiness
                        </text>
                    </svg>

                    <span
                        className="text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-lg"
                        style={{
                            color: scoreColor(finalScore),
                            backgroundColor: `${scoreColor(finalScore)}15`,
                        }}
                    >
                        {scoreLabel(finalScore)}
                    </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-bg-card p-5">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Survey Base Score</p>
                        <p className="text-2xl font-black" style={{ color: scoreColor(initialScore) }}>
                            {initialScore}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">From your onboarding assessment</p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-card p-5">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Assignment Boost</p>
                        <p className="text-2xl font-black text-lime">
                            +{boost}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {gradedScores.length === 0
                                ? 'Complete assignments to grow'
                                : `From ${gradedScores.length} graded assignment${gradedScores.length > 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-card p-5">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Potential Remaining</p>
                        <p className="text-2xl font-black text-gray-400">
                            {100 - finalScore}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Room to grow through assignments</p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-card p-5">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Assignments Graded</p>
                        <p className="text-2xl font-black text-white">
                            {gradedScores.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {gradedScores.length > 0
                                ? `Avg score: ${Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)}/100`
                                : 'None graded yet'}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ─── Row 2: Skill Gap Radar + Workflow Bottleneck ────────────── */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-border bg-bg-card p-6"
                >
                    <h2 className="font-heading text-lg font-bold mb-1">Skill Gap Analysis</h2>
                    <p className="text-xs text-gray-500 mb-4">Your skills vs. the Zkandar Standard</p>

                    <svg width="240" height="240" viewBox="0 0 240 240" className="mx-auto">
                        {/* Grid circles */}
                        {[20, 40, 60, 80, 100].map((pct) => (
                            <polygon
                                key={pct}
                                points={getRadarPoints([pct, pct, pct, pct, pct], RADAR_RADIUS)}
                                fill="none"
                                stroke="hsl(0, 0%, 15%)"
                                strokeWidth="0.5"
                            />
                        ))}

                        {/* Axis lines */}
                        {RADAR_AXES.map((_, i) => {
                            const angle = (360 / RADAR_AXES.length) * i
                            const [x, y] = polarToCartesian(angle, RADAR_RADIUS)
                            return (
                                <line
                                    key={i}
                                    x1={RADAR_CENTER} y1={RADAR_CENTER}
                                    x2={x} y2={y}
                                    stroke="hsl(0, 0%, 15%)"
                                    strokeWidth="0.5"
                                />
                            )
                        })}

                        {/* Zkandar Standard fill (100% on all axes) */}
                        <polygon
                            points={getRadarPoints([100, 100, 100, 100, 100], RADAR_RADIUS)}
                            fill="rgba(255,255,255,0.03)"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1"
                        />

                        {/* Member's values */}
                        <motion.polygon
                            points={getRadarPoints(radarValues, RADAR_RADIUS)}
                            fill="rgba(208, 255, 113, 0.15)"
                            stroke="#D0FF71"
                            strokeWidth="2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        />

                        {/* Dots on vertices */}
                        {radarValues.map((v, i) => {
                            const angle = (360 / radarValues.length) * i
                            const r = (v / 100) * RADAR_RADIUS
                            const [x, y] = polarToCartesian(angle, r)
                            return (
                                <circle key={i} cx={x} cy={y} r="3" fill="#D0FF71" />
                            )
                        })}

                        {/* Axis labels */}
                        {RADAR_AXES.map((label, i) => {
                            const angle = (360 / RADAR_AXES.length) * i
                            const [x, y] = polarToCartesian(angle, RADAR_RADIUS + 18)
                            return (
                                <text
                                    key={label}
                                    x={x} y={y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-gray-500 text-[9px]"
                                >
                                    {label}
                                </text>
                            )
                        })}
                    </svg>

                    <div className="mt-4 flex items-center justify-center gap-6 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-white/10 border border-white/20" />
                            Zkandar Standard
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-lime/20 border border-lime" />
                            Your Level
                        </span>
                    </div>
                </motion.div>

                {/* Workflow Bottleneck Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-border bg-bg-card p-6"
                >
                    <h2 className="font-heading text-lg font-bold mb-1">Workflow Risk Zones</h2>
                    <p className="text-xs text-gray-500 mb-4">Areas identified from your survey responses</p>

                    <div className="grid grid-cols-2 gap-3">
                        {BOTTLENECK_ZONES.map((zone) => {
                            const isRisk = difficulties.includes(zone.key)
                            const Icon = zone.icon
                            return (
                                <motion.div
                                    key={zone.key}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className={`rounded-xl border p-4 transition-all ${isRisk
                                        ? 'border-red-500/30 bg-red-500/5'
                                        : 'border-green-500/20 bg-green-500/5'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isRisk ? 'text-red-400' : 'text-green-400'
                                            }`} />
                                        <div>
                                            <p className={`text-xs font-medium ${isRisk ? 'text-red-300' : 'text-green-300'
                                                }`}>
                                                {zone.label}
                                            </p>
                                            <p className={`text-[10px] mt-0.5 ${isRisk ? 'text-red-400/60' : 'text-green-400/60'
                                                }`}>
                                                {isRisk ? 'Needs improvement' : 'On track'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`mt-2 h-1 rounded-full ${isRisk ? 'bg-red-500/30' : 'bg-green-500/30'
                                        }`}>
                                        <div
                                            className={`h-full rounded-full transition-all ${isRisk ? 'bg-red-400 w-1/4' : 'bg-green-400 w-3/4'
                                                }`}
                                        />
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {difficulties.length === 0 && (
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            No workflow difficulties were reported in your survey.
                        </p>
                    )}
                </motion.div>
            </div>

            {/* ─── Row 3: Time Wasted ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-border bg-bg-card p-6"
            >
                <h2 className="font-heading text-lg font-bold mb-1">Estimated Weekly Time Impact</h2>
                <p className="text-xs text-gray-500 mb-6">
                    Based on your role as <span className="text-white font-medium">{roleKey}</span>
                </p>

                <div className="grid md:grid-cols-3 gap-6 items-end">
                    {/* Current bar */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-20 bg-bg-elevated rounded-t-xl overflow-hidden" style={{ height: `${(timeData.manual / 24) * 200}px` }}>
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-red-400/80 rounded-t-xl"
                                initial={{ height: 0 }}
                                animate={{ height: '100%' }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                        <div className="mt-3 text-center">
                            <p className="text-2xl font-black text-red-400">{timeData.manual}h</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Current / Week</p>
                        </div>
                    </div>

                    {/* Arrow + savings */}
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="text-4xl font-black text-lime">
                            {timeData.manual - timeData.optimized}h
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">hours saved per week</p>
                        <p className="text-[10px] text-gray-600 mt-0.5 text-center">
                            That's <span className="text-lime font-bold">{Math.round(((timeData.manual - timeData.optimized) / timeData.manual) * 100)}%</span> more efficient
                        </p>
                    </div>

                    {/* Optimized bar */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-20 bg-bg-elevated rounded-t-xl overflow-hidden" style={{ height: `${(timeData.optimized / 24) * 200}px` }}>
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-lime/80 rounded-t-xl"
                                initial={{ height: 0 }}
                                animate={{ height: '100%' }}
                                transition={{ duration: 1, delay: 0.7 }}
                            />
                        </div>
                        <div className="mt-3 text-center">
                            <p className="text-2xl font-black text-lime">{timeData.optimized}h</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">AI-Optimized / Week</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-xl bg-red-500/5 border border-red-500/20 p-4 text-center">
                    <p className="text-sm text-red-300">
                        You're currently spending <strong className="text-red-400">~{timeData.manual - timeData.optimized} extra hours per week</strong> on tasks
                        that AI could handle — that's <strong className="text-red-400">{(timeData.manual - timeData.optimized) * 4} hours per month</strong> of
                        untapped productivity.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
