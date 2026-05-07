import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/hooks/useSupabase'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
    SortingState,
} from '@tanstack/react-table'
import {
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Download,
    Search,
    Filter,
} from 'lucide-react'
import type { AssessmentSubmission } from '@/types/database'

const PAGE_SIZE = 50

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
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ROW_BG = ['bg-[#000000]', 'bg-[#050505]'] as const

export function AssessmentSubmissionsTab() {
    const supabase = useSupabase()
    const [page, setPage] = useState(0)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
    const [globalFilter, setGlobalFilter] = useState('')
    const [pathFilter, setPathFilter] = useState<string>('ALL')
    const [scoreFilter, setScoreFilter] = useState<string>('ALL')
    const [denseMode, setDenseMode] = useState(false)

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

    const allRows = data?.rows ?? []
    const total = data?.total ?? 0
    const totalPages = Math.ceil(total / PAGE_SIZE)

    // Pre-filter by path and score before handing to the table
    const filteredData = useMemo(() => {
        let rows = allRows
        if (pathFilter !== 'ALL') {
            rows = rows.filter(r => r.path_result === pathFilter)
        }
        if (scoreFilter !== 'ALL') {
            const badge = SCORE_BADGE.find(b => b.label === scoreFilter)
            if (badge) {
                const prevMax = SCORE_BADGE[SCORE_BADGE.indexOf(badge) - 1]?.max ?? -1
                rows = rows.filter(r => r.readiness_score > prevMax && r.readiness_score <= badge.max)
            }
        }
        return rows
    }, [allRows, pathFilter, scoreFilter])

    const columns = useMemo<ColumnDef<AssessmentSubmission>[]>(() => [
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Date <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-xs text-gray-500">{formatDate(row.original.created_at)}</span>
            ),
            meta: { headerClassName: 'min-w-[120px]', cellClassName: 'min-w-[120px]' },
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Name <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="font-medium text-white">{row.original.name}</span>
            ),
            meta: { headerClassName: 'min-w-[180px]', cellClassName: 'min-w-[180px]' },
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => (
                <span className="text-sm text-gray-400">{row.original.email}</span>
            ),
            meta: { headerClassName: 'min-w-[240px]', cellClassName: 'min-w-[240px]' },
        },
        {
            accessorKey: 'readiness_score',
            header: ({ column }) => (
                <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Score <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
            ),
            cell: ({ row }) => {
                const badge = scoreBadge(row.original.readiness_score)
                return (
                    <span
                        className="px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: badge.color, background: badge.bg }}
                    >
                        {row.original.readiness_score}% · {badge.label}
                    </span>
                )
            },
            meta: { headerClassName: 'min-w-[160px]', cellClassName: 'min-w-[160px]' },
        },
        {
            accessorKey: 'path_result',
            header: 'Path',
            cell: ({ row }) => (
                <span className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider ${
                    row.original.path_result === 'sprint'
                        ? 'bg-lime/[0.08] text-lime border border-lime/20'
                        : 'bg-purple-500/[0.08] text-purple-400 border border-purple-500/20'
                }`}>
                    {row.original.path_result === 'sprint' ? 'Sprint' : 'Masterclass'}
                </span>
            ),
            meta: { headerClassName: 'min-w-[130px]', cellClassName: 'min-w-[130px]' },
        },
        {
            accessorKey: 'context',
            header: 'Role',
            cell: ({ row }) => (
                <span className="text-xs text-gray-400">
                    {row.original.context ? (ANSWER_LABELS.context?.[row.original.context] ?? row.original.context) : '-'}
                </span>
            ),
            meta: { headerClassName: 'min-w-[130px]', cellClassName: 'min-w-[130px]' },
        },
        {
            accessorKey: 'team_size',
            header: 'Team',
            cell: ({ row }) => (
                <span className="text-xs text-gray-400">
                    {row.original.team_size ? (ANSWER_LABELS.team_size?.[row.original.team_size] ?? row.original.team_size) : '-'}
                </span>
            ),
            meta: { headerClassName: 'min-w-[100px]', cellClassName: 'min-w-[100px]' },
        },
        {
            id: 'details',
            header: '',
            cell: ({ row }) => {
                const isExpanded = expandedId === row.original.id
                return (
                    <button
                        onClick={() => setExpandedId(isExpanded ? null : row.original.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )
            },
            meta: { headerClassName: 'w-[48px] min-w-[48px]', cellClassName: 'w-[48px] min-w-[48px]' },
        },
    ], [expandedId])

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getRowId: (row) => row.id,
        state: { sorting, globalFilter },
    })

    const visibleRows = table.getRowModel().rows

    const handleExport = () => {
        if (!allRows.length) return
        const headers = ['Date', 'Name', 'Email', 'Score', 'Level', 'Path', 'Role', 'Team Size', ...Object.keys(allRows[0]?.answers ?? {})]
        const csv = [
            headers.join(','),
            ...allRows.map(r => {
                const badge = scoreBadge(r.readiness_score)
                const answerValues = Object.values(r.answers ?? {}).map(v => `"${v}"`)
                return [
                    `"${formatDateTime(r.created_at)}"`,
                    `"${r.name}"`,
                    `"${r.email}"`,
                    r.readiness_score,
                    `"${badge.label}"`,
                    r.path_result,
                    r.context ?? '',
                    r.team_size ?? '',
                    ...answerValues,
                ].join(',')
            })
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
            {/* ── Toolbar ────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] p-4 shadow-sm hover:border-white/[0.12] transition-colors">
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-[260px]">
                        <div className="relative group/search">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within/search:text-lime transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-lime/30 focus:ring-1 focus:ring-lime/10 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Path Filter */}
                    <div className="min-w-[160px] relative">
                        <select
                            value={pathFilter}
                            onChange={(e) => setPathFilter(e.target.value)}
                            className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60"
                        >
                            <option value="ALL">All Paths</option>
                            <option value="sprint">Sprint</option>
                            <option value="masterclass">Masterclass</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>

                    {/* Score Filter */}
                    <div className="min-w-[160px] relative">
                        <select
                            value={scoreFilter}
                            onChange={(e) => setScoreFilter(e.target.value)}
                            className="w-full appearance-none px-4 py-2 pr-10 bg-bg-primary/60 border border-border rounded-xl text-sm text-gray-100 focus:outline-none focus:border-gray-500/60"
                        >
                            <option value="ALL">All Levels</option>
                            {SCORE_BADGE.map(b => (
                                <option key={b.label} value={b.label}>{b.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>

                    {/* Density toggle */}
                    <button
                        onClick={() => setDenseMode(p => !p)}
                        className={`px-4 py-2 rounded-xl border text-sm transition-colors font-medium ${denseMode ? 'border-lime/30 text-lime bg-lime/5' : 'border-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.03]'}`}
                    >
                        {denseMode ? 'Compact rows' : 'Comfort rows'}
                    </button>

                    {/* Export */}
                    <button
                        onClick={handleExport}
                        disabled={allRows.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white/[0.025] hover:bg-white/10 text-white rounded-xl transition-colors font-medium border border-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>

                {/* Active Filters Summary */}
                {(pathFilter !== 'ALL' || scoreFilter !== 'ALL' || globalFilter) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">Active filters:</span>
                        {globalFilter && (
                            <span className="px-2 py-1 bg-bg-primary/60 text-gray-200 rounded border border-border/60">
                                Search: &quot;{globalFilter}&quot;
                            </span>
                        )}
                        {pathFilter !== 'ALL' && (
                            <span className="px-2 py-1 bg-bg-primary/60 text-gray-200 rounded border border-border/60">
                                Path: {pathFilter}
                            </span>
                        )}
                        {scoreFilter !== 'ALL' && (
                            <span className="px-2 py-1 bg-bg-primary/60 text-gray-200 rounded border border-border/60">
                                Level: {scoreFilter}
                            </span>
                        )}
                        <button
                            onClick={() => { setPathFilter('ALL'); setScoreFilter('ALL'); setGlobalFilter(''); }}
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                    Showing {visibleRows.length} of {total} submissions
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────── */}
            <div className="w-full max-w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a0a0a] shadow-sm hover:border-white/[0.12] transition-colors">
                <div className="w-full max-w-full overflow-x-auto">
                    <table className={`w-full border-separate border-spacing-0 ${denseMode ? 'text-xs' : 'text-sm'}`}>
                        <thead className="sticky top-0 z-30 bg-[#0a0a0a]">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const meta = header.column.columnDef.meta as { headerClassName?: string } | undefined
                                        return (
                                            <th
                                                key={header.id}
                                                className={[
                                                    'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 border-b border-white/[0.08]',
                                                    meta?.headerClassName || '',
                                                ].join(' ')}
                                            >
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        )
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {visibleRows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="h-24 text-center text-gray-500">
                                        No submissions found.
                                    </td>
                                </tr>
                            ) : (
                                visibleRows.map((row, rowIndex) => {
                                    const baseBg = ROW_BG[rowIndex % 2]
                                    const isExpanded = expandedId === row.original.id
                                    return (
                                        <>
                                            <tr
                                                key={row.id}
                                                className={`${baseBg} hover:bg-white/5 transition-colors`}
                                            >
                                                {row.getVisibleCells().map((cell) => {
                                                    const meta = cell.column.columnDef.meta as { cellClassName?: string } | undefined
                                                    return (
                                                        <td
                                                            key={cell.id}
                                                            className={[
                                                                'whitespace-nowrap border-b border-white/[0.05]',
                                                                'px-4',
                                                                denseMode ? 'py-2' : 'py-3',
                                                                'text-gray-200',
                                                                meta?.cellClassName || '',
                                                            ].join(' ')}
                                                        >
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${row.id}-answers`} className={baseBg}>
                                                    <td colSpan={columns.length} className="px-4 pb-4 pt-2 border-b border-white/[0.05]">
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                                            {Object.entries(row.original.answers).map(([key, val]) => (
                                                                <div key={key} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                                                    <p className="text-[0.55rem] uppercase tracking-wider text-gray-600 mb-0.5">{key.replace(/_/g, ' ')}</p>
                                                                    <p className="text-xs text-gray-300">{ANSWER_LABELS[key]?.[val] ?? val}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination ─────────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.06] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-600">Page {page + 1} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.06] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
