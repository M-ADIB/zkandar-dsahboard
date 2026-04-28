import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/hooks/useSupabase'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import type { AssessmentSubmission } from '@/types/database'

const PAGE_SIZE = 25

const SCORE_BADGE: { max: number; label: string; color: string; bg: string }[] = [
    { max: 12,  label: 'Just Starting',   color: '#f87171', bg: 'rgba(248,113,113,0.1)'  },
    { max: 25,  label: 'Dabbling',        color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'   },
    { max: 38,  label: 'Gaining Ground',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
    { max: 100, label: 'AI-Active',       color: '#D0FF71', bg: 'rgba(208,255,113,0.08)' },
]

function scoreBadge(score: number) {
    return SCORE_BADGE.find(b => score <= b.max) ?? SCORE_BADGE[SCORE_BADGE.length - 1]
}

const ANSWER_LABELS: Record<string, Record<string, string>> = {
    context:          { individual: 'Individual', owner: 'Studio Owner', lead: 'Team Lead', student: 'Student' },
    team_size:        { solo: 'Solo', small: '2–5', medium: '6–20', large: '20+' },
    project_type:     { concepts: 'Concepts', rendering: 'Rendering', presentations: 'Presentations', revisions: 'Revisions' },
    ai_frequency:     { never: 'Never', few_times: 'A few times', weekly: 'Weekly', daily: 'Daily' },
    ai_tools:         { none: 'None', midjourney: 'Midjourney', render_tools: 'Render tools', multi: 'Multiple tools' },
    ai_output_quality:{ nothing: 'Nothing yet', rough: 'Rough concepts', decent: 'Decent', client_ready: 'Client-ready' },
    ai_client_use:    { never: 'Never', once: 'Once or twice', occasionally: 'Occasionally', regularly: 'Regularly' },
    ai_confidence:    { not_at_all: 'Not at all', a_little: 'A little', fairly: 'Fairly', very: 'Very confident' },
    ai_gap:           { direction: 'No direction', quality: 'Quality', consistency: 'Consistency', team: 'Team adoption' },
    timeline:         { urgent: 'Right now', soon: 'Next 3 months', planned: 'Longer term', unsure: 'Still deciding' },
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function AnswerDrawer({ answers }: { answers: Record<string, string> }) {
    return (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(answers).map(([key, val]) => (
                <div key={key} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[0.55rem] uppercase tracking-wider text-gray-600 mb-0.5">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-300">{ANSWER_LABELS[key]?.[val] ?? val}</p>
                </div>
            ))}
        </div>
    )
}

export function AssessmentSubmissionsTab() {
    const supabase = useSupabase()
    const [page, setPage] = useState(0)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const { data, isLoading, isError } = useQuery({
        queryKey: ['assessmentSubmissions', page],
        queryFn: async () => {
            const from = page * PAGE_SIZE
            const to = from + PAGE_SIZE - 1
            const { data, error, count } = await (supabase.from('assessment_submissions') as any)
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to)
            if (error) throw new Error(error.message)
            return { rows: (data ?? []) as AssessmentSubmission[], total: count ?? 0 }
        },
    })

    const rows = data?.rows ?? []
    const total = data?.total ?? 0
    const totalPages = Math.ceil(total / PAGE_SIZE)

    const handleExport = () => {
        if (!rows.length) return
        const headers = ['Date', 'Name', 'Email', 'Score', 'Path', 'Role', 'Team Size']
        const csv = [
            headers.join(','),
            ...rows.map(r => [
                `"${formatDate(r.created_at)}"`,
                `"${r.name}"`,
                `"${r.email}"`,
                r.readiness_score,
                r.path_result,
                r.context ?? '',
                r.team_size ?? '',
            ].join(','))
        ].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `assessments_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime/50" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="text-center py-20 text-gray-500 text-sm">
                Failed to load assessment submissions.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{total} submission{total !== 1 ? 's' : ''}</p>
                <button
                    onClick={handleExport}
                    disabled={rows.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                </button>
            </div>

            {rows.length === 0 ? (
                <div className="text-center py-20 text-gray-600 text-sm">
                    No assessment submissions yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map(row => {
                        const badge = scoreBadge(row.readiness_score)
                        const isExpanded = expandedId === row.id
                        return (
                            <div key={row.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                                <div className="px-4 py-3.5 flex items-center gap-4 flex-wrap">
                                    {/* Date */}
                                    <span className="text-[0.6rem] text-gray-600 shrink-0 w-36">{formatDate(row.created_at)}</span>

                                    {/* Name + email */}
                                    <div className="flex-1 min-w-[160px]">
                                        <p className="text-sm font-semibold text-white leading-snug">{row.name}</p>
                                        <p className="text-xs text-gray-500">{row.email}</p>
                                    </div>

                                    {/* Score badge */}
                                    <span
                                        className="px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider shrink-0"
                                        style={{ color: badge.color, background: badge.bg }}
                                    >
                                        {row.readiness_score}% · {badge.label}
                                    </span>

                                    {/* Path pill */}
                                    <span className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider shrink-0 ${
                                        row.path_result === 'sprint'
                                            ? 'bg-lime/[0.08] text-lime border border-lime/20'
                                            : 'bg-purple-500/[0.08] text-purple-400 border border-purple-500/20'
                                    }`}>
                                        {row.path_result === 'sprint' ? 'Sprint' : 'Masterclass'}
                                    </span>

                                    {/* Role + team */}
                                    <div className="hidden sm:flex gap-2 shrink-0">
                                        {row.context && (
                                            <span className="text-[0.6rem] text-gray-600 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-md">
                                                {ANSWER_LABELS.context?.[row.context] ?? row.context}
                                            </span>
                                        )}
                                        {row.team_size && (
                                            <span className="text-[0.6rem] text-gray-600 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-md">
                                                {ANSWER_LABELS.team_size?.[row.team_size] ?? row.team_size}
                                            </span>
                                        )}
                                    </div>

                                    {/* Expand toggle */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                                        className="ml-auto shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-white/[0.04]">
                                        <AnswerDrawer answers={row.answers} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.06] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-600">Page {page + 1} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.06] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
