import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Pin,
    PinOff,
    Archive,
    ArchiveRestore,
    ExternalLink,
    CheckCheck,
    Circle,
    X,
    ChevronRight,
    Zap,
    BookOpen,
    Youtube,
    RefreshCw,
    Filter,
    Loader2,
    Inbox,
    Lightbulb,
    ChevronUp,
    ChevronDown as ChevronDownIcon,
    SortAsc,
    FileText,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { ContentItem, SourceType } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60_000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d > 0)  return `${d}d ago`
    if (h > 0)  return `${h}h ago`
    if (m > 0)  return `${m}m ago`
    return 'just now'
}

function ScoreBadge({ score }: { score: number | null }) {
    if (score === null || score === undefined) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-white/5 text-gray-600 border border-white/[0.06]">—</span>
    }
    const { bg, text, border } = score >= 80
        ? { bg: 'bg-lime/10',         text: 'text-lime',       border: 'border-lime/20' }
        : score >= 60
        ? { bg: 'bg-amber-500/10',    text: 'text-amber-400',  border: 'border-amber-500/20' }
        : score >= 45
        ? { bg: 'bg-orange-500/10',   text: 'text-orange-400', border: 'border-orange-500/20' }
        : { bg: 'bg-white/[0.04]',    text: 'text-gray-500',   border: 'border-white/[0.06]' }
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${bg} ${text} ${border}`}>
            <Zap className="h-2.5 w-2.5" />{score}
        </span>
    )
}

function SourceIcon({ type }: { type: SourceType | undefined }) {
    if (type === 'video_channel') return <Youtube className="h-3.5 w-3.5 text-red-400" />
    if (type === 'blog')          return <BookOpen className="h-3.5 w-3.5 text-blue-400" />
    return <Search className="h-3.5 w-3.5 text-purple-400" />
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
    video_channel: 'Video',
    blog:          'Blog',
    search_query:  'Search',
}

type SortField = 'relevance_score' | 'created_at' | 'published_at'
type SortDir   = 'asc' | 'desc'

// ─── Deep Dive Panel ─────────────────────────────────────────────────────────

interface DeepDivePanelProps {
    item: ContentItem
    onClose: () => void
    onUpdate: (updated: Partial<ContentItem>) => void
}

function DeepDivePanel({ item, onClose, onUpdate }: DeepDivePanelProps) {
    async function toggle(field: 'is_pinned' | 'is_read' | 'is_archived') {
        const newVal = !item[field]
        const { error } = await db
            .from('content_items')
            .update({ [field]: newVal, updated_at: new Date().toISOString() })
            .eq('id', item.id)
        if (error) { toast.error('Failed to update'); return }
        onUpdate({ [field]: newVal })
    }

    return (
        <motion.div
            key="deep-dive"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[560px] bg-bg-elevated border-l border-white/[0.08] z-50 flex flex-col shadow-2xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                    {item.content_sources && (
                        <>
                            <SourceIcon type={item.content_sources.type} />
                            <span className="text-xs text-gray-400">{item.content_sources.name}</span>
                            <ChevronRight className="h-3 w-3 text-gray-600" />
                        </>
                    )}
                    <span className="text-xs text-gray-500">{timeAgo(item.created_at)}</span>
                    <ScoreBadge score={item.relevance_score} />
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Title */}
                <div>
                    <h2 className="text-lg font-bold text-white leading-tight mb-2">{item.title}</h2>
                    {item.published_at && (
                        <p className="text-xs text-gray-500">
                            Published {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    )}
                </div>

                {/* Summary */}
                {item.summary ? (
                    <div className="p-4 bg-bg-primary rounded-xl border border-white/[0.06]">
                        <div className="flex items-center gap-1.5 mb-2">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</p>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{item.summary}</p>
                    </div>
                ) : (
                    <div className="p-4 bg-bg-primary rounded-xl border border-white/[0.06] border-dashed">
                        <p className="text-xs text-gray-600 italic">No AI summary available. Re-sync to generate.</p>
                    </div>
                )}

                {/* Deep Dive */}
                {item.deep_dive && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Zap className="h-3.5 w-3.5 text-amber-400" />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Strategic Context</p>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{item.deep_dive}</p>
                    </div>
                )}

                {/* Action Items */}
                {item.action_items && item.action_items.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-3">
                            <Lightbulb className="h-3.5 w-3.5 text-lime" />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Zkandar AI Actions ({item.action_items.length})
                            </p>
                        </div>
                        <ul className="space-y-2.5">
                            {item.action_items.map((a, i) => (
                                <li key={i} className="flex items-start gap-2.5 p-3 bg-lime/[0.04] border border-lime/[0.1] rounded-xl">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-lime flex-shrink-0" />
                                    <span className="text-sm text-gray-200 leading-snug">{a}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!item.deep_dive && (!item.action_items || item.action_items.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-white/[0.06] rounded-xl">
                        <Lightbulb className="h-8 w-8 text-gray-700 mb-2" />
                        <p className="text-xs text-gray-600">AI insights not yet generated.</p>
                        <p className="text-xs text-gray-700 mt-0.5">Run Sync to enrich this item.</p>
                    </div>
                )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 p-4 border-t border-white/[0.08]">
                <a
                    href={item.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors"
                >
                    <ExternalLink className="h-4 w-4" />
                    Open Original
                </a>
                <button
                    onClick={() => toggle('is_pinned')}
                    title={item.is_pinned ? 'Unpin' : 'Pin'}
                    className={`p-2.5 rounded-xl border transition-colors ${item.is_pinned ? 'bg-lime/10 border-lime/20 text-lime' : 'border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    {item.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
                <button
                    onClick={() => toggle('is_read')}
                    title={item.is_read ? 'Mark unread' : 'Mark read'}
                    className={`p-2.5 rounded-xl border transition-colors ${item.is_read ? 'bg-white/5 border-white/10 text-gray-400' : 'border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    {item.is_read ? <CheckCheck className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </button>
                <button
                    onClick={() => { toggle('is_archived'); onClose() }}
                    title={item.is_archived ? 'Unarchive' : 'Archive'}
                    className="p-2.5 rounded-xl border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    {item.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </button>
            </div>
        </motion.div>
    )
}

// ─── Table Row ────────────────────────────────────────────────────────────────

interface TableRowProps {
    item: ContentItem
    onClick: () => void
    onToggle: (field: 'is_pinned' | 'is_read' | 'is_archived', val: boolean) => void
}

function FeedTableRow({ item, onClick, onToggle }: TableRowProps) {
    async function handleToggle(e: React.MouseEvent, field: 'is_pinned' | 'is_read' | 'is_archived') {
        e.stopPropagation()
        const newVal = !item[field]
        const { error } = await db
            .from('content_items')
            .update({ [field]: newVal, updated_at: new Date().toISOString() })
            .eq('id', item.id)
        if (error) { toast.error('Failed to update'); return }
        onToggle(field, newVal)
    }

    const actionCount = item.action_items?.length ?? 0
    const hasDeepDive = Boolean(item.deep_dive)

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={onClick}
            className={`group border-b border-white/[0.04] cursor-pointer transition-colors hover:bg-white/[0.025] last:border-0 ${
                item.is_pinned ? 'bg-lime/[0.03]' : item.is_read ? '' : 'bg-white/[0.015]'
            }`}
        >
            {/* Score */}
            <td className="py-3 pl-4 pr-3 w-16 align-middle">
                <div className="flex items-center gap-1">
                    {item.is_pinned && <Pin className="h-3 w-3 text-lime flex-shrink-0" />}
                    <ScoreBadge score={item.relevance_score} />
                </div>
            </td>

            {/* Title + Summary + First Action */}
            <td className="py-3 pr-4 align-middle">
                <p className={`text-sm font-semibold leading-snug line-clamp-1 mb-1 ${item.is_read ? 'text-gray-400' : 'text-white'}`}>
                    {item.title}
                </p>
                {item.summary ? (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-1.5">{item.summary}</p>
                ) : (
                    <p className="text-xs text-gray-700 italic mb-1.5">No summary — re-sync to generate</p>
                )}
                {item.action_items && item.action_items.length > 0 && (
                    <div className="flex items-start gap-1.5">
                        <Lightbulb className="h-3 w-3 text-lime flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-lime/70 leading-snug line-clamp-1">{item.action_items[0]}</p>
                    </div>
                )}
            </td>

            {/* Source */}
            <td className="py-3 pr-4 w-32 align-middle">
                {item.content_sources ? (
                    <div className="flex items-center gap-1.5">
                        <SourceIcon type={item.content_sources.type} />
                        <div>
                            <p className="text-xs text-gray-300 font-medium leading-tight truncate max-w-[88px]">{item.content_sources.name}</p>
                            <p className="text-[10px] text-gray-600">{SOURCE_TYPE_LABELS[item.content_sources.type]}</p>
                        </div>
                    </div>
                ) : (
                    <span className="text-xs text-gray-700">—</span>
                )}
            </td>

            {/* AI Insights */}
            <td className="py-3 pr-4 w-24 align-middle">
                {(actionCount > 0 || hasDeepDive) ? (
                    <div className="flex flex-col gap-1">
                        {actionCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-lime/[0.08] text-lime border border-lime/[0.15] w-fit">
                                <Lightbulb className="h-2.5 w-2.5" />
                                {actionCount}
                            </span>
                        )}
                        {hasDeepDive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/[0.08] text-amber-400 border border-amber-500/[0.15] w-fit">
                                <Zap className="h-2.5 w-2.5" />
                                Dive
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[10px] text-gray-700 italic">—</span>
                )}
            </td>

            {/* Time */}
            <td className="py-3 pr-3 w-24 align-middle">
                <span className="text-xs text-gray-600">{timeAgo(item.created_at)}</span>
            </td>

            {/* Actions (hover) */}
            <td className="py-3 pr-4 w-28 align-middle">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => handleToggle(e, 'is_pinned')}
                        title={item.is_pinned ? 'Unpin' : 'Pin'}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    >
                        {item.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={(e) => handleToggle(e, 'is_read')}
                        title={item.is_read ? 'Mark unread' : 'Mark read'}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    >
                        {item.is_read ? <CheckCheck className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={(e) => handleToggle(e, 'is_archived')}
                        title={item.is_archived ? 'Unarchive' : 'Archive'}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    >
                        {item.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </button>
                    <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
            </td>
        </motion.tr>
    )
}

// ─── Sort Header Cell ─────────────────────────────────────────────────────────

function SortTh({
    label,
    field,
    current,
    dir,
    onSort,
    className = '',
}: {
    label: string
    field: SortField
    current: SortField
    dir: SortDir
    onSort: (f: SortField) => void
    className?: string
}) {
    const active = current === field
    return (
        <th
            className={`px-4 py-2.5 text-left cursor-pointer select-none group ${className}`}
            onClick={() => onSort(field)}
        >
            <div className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                active ? 'text-lime' : 'text-gray-600 group-hover:text-gray-400'
            }`}>
                {label}
                {active
                    ? dir === 'desc' ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                    : <SortAsc className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                }
            </div>
        </th>
    )
}

// ─── FeedTab ─────────────────────────────────────────────────────────────────

interface FeedTabProps {
    onSync: () => Promise<void>
    syncing: boolean
}

export function FeedTab({ onSync, syncing }: FeedTabProps) {
    const [items, setItems]               = useState<ContentItem[]>([])
    const [loading, setLoading]           = useState(true)
    const [searchQuery, setSearchQuery]   = useState('')
    const [typeFilter, setTypeFilter]     = useState<string>('all')
    const [viewMode, setViewMode]         = useState<'active' | 'archived'>('active')
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
    const [sortField, setSortField]       = useState<SortField>('relevance_score')
    const [sortDir, setSortDir]           = useState<SortDir>('desc')

    const fetchItems = useCallback(async () => {
        setLoading(true)
        const { data, error } = await db
            .from('content_items')
            .select('*, content_sources(name, type)')
            .eq('is_archived', viewMode === 'archived')
            .order('is_pinned', { ascending: false })
            .order('relevance_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(200)

        if (error) { toast.error('Failed to load content'); setLoading(false); return }
        setItems((data ?? []) as ContentItem[])
        setLoading(false)
    }, [viewMode])

    useEffect(() => { fetchItems() }, [fetchItems])

    function updateItem(id: string, patch: Partial<ContentItem>) {
        setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it))
        if (selectedItem?.id === id) setSelectedItem((prev) => prev ? { ...prev, ...patch } : null)
    }

    // Client-side filter
    const filtered = items.filter((item) => {
        const q = searchQuery.toLowerCase()
        const matchSearch = !q
            || item.title.toLowerCase().includes(q)
            || (item.summary ?? '').toLowerCase().includes(q)
            || (item.deep_dive ?? '').toLowerCase().includes(q)
        const matchType = typeFilter === 'all' || item.content_sources?.type === typeFilter
        return matchSearch && matchType
    })

    // Client-side sort
    const sorted = [...filtered].sort((a, b) => {
        let av: number | string = 0
        let bv: number | string = 0
        if (sortField === 'relevance_score') {
            // Pinned always first
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
            av = a.relevance_score ?? 0
            bv = b.relevance_score ?? 0
        } else if (sortField === 'created_at') {
            av = new Date(a.created_at).getTime()
            bv = new Date(b.created_at).getTime()
        } else if (sortField === 'published_at') {
            av = a.published_at ? new Date(a.published_at).getTime() : 0
            bv = b.published_at ? new Date(b.published_at).getTime() : 0
        }
        if (typeof av === 'number' && typeof bv === 'number') {
            return sortDir === 'desc' ? bv - av : av - bv
        }
        return 0
    })

    function handleSort(field: SortField) {
        if (field === sortField) {
            setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
        } else {
            setSortField(field)
            setSortDir('desc')
        }
    }

    async function handleSync() {
        await onSync()
        fetchItems()
    }

    // Computed stats
    const enrichedCount  = sorted.filter((i) => i.summary).length
    const pinnedCount    = sorted.filter((i) => i.is_pinned).length
    const unreadCount    = sorted.filter((i) => !i.is_read).length

    return (
        <div className="flex h-full">
            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search title, summary, deep dive…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-bg-elevated border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/30 transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <X className="h-3.5 w-3.5 text-gray-500 hover:text-white" />
                            </button>
                        )}
                    </div>

                    {/* Type filter */}
                    <div className="flex items-center gap-1 bg-bg-elevated border border-white/[0.08] rounded-xl p-1">
                        <Filter className="h-3.5 w-3.5 text-gray-500 ml-2" />
                        {(['all', 'blog', 'video_channel', 'search_query'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t === 'all' ? 'All' : SOURCE_TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>

                    {/* Active / Archived */}
                    <div className="flex items-center gap-1 bg-bg-elevated border border-white/[0.08] rounded-xl p-1">
                        {(['active', 'archived'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${viewMode === v ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    {/* Sync button */}
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing…' : 'Sync Now'}
                    </button>
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-4 px-6 py-2 border-b border-white/[0.04]">
                    <span className="text-xs text-gray-500">{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
                    {unreadCount > 0 && (
                        <span className="text-xs text-white/60">
                            <span className="font-semibold text-white">{unreadCount}</span> unread
                        </span>
                    )}
                    {pinnedCount > 0 && (
                        <span className="text-xs text-lime/70">
                            <span className="font-semibold text-lime">{pinnedCount}</span> pinned
                        </span>
                    )}
                    {enrichedCount < sorted.length && sorted.length > 0 && (
                        <span className="text-xs text-amber-400/60">
                            <span className="font-semibold text-amber-400">{sorted.length - enrichedCount}</span> not yet enriched
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-lime" />
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Inbox className="h-10 w-10 text-gray-700 mb-3" />
                            <p className="text-sm text-gray-500">No content yet.</p>
                            <p className="text-xs text-gray-600 mt-1">Add sources and hit Sync Now to start ingesting.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse min-w-[640px]">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-bg-primary/50 sticky top-0 z-10">
                                    <SortTh label="Score"     field="relevance_score" current={sortField} dir={sortDir} onSort={handleSort} className="pl-4 w-16" />
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title &amp; Summary</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-36">Source</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">AI Insights</th>
                                    <SortTh label="Added"     field="created_at"      current={sortField} dir={sortDir} onSort={handleSort} className="w-24" />
                                    <th className="px-4 py-2.5 w-28" />
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {sorted.map((item) => (
                                        <FeedTableRow
                                            key={item.id}
                                            item={item}
                                            onClick={() => setSelectedItem(item)}
                                            onToggle={(field, val) => updateItem(item.id, { [field]: val })}
                                        />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Deep Dive slide-over */}
            <AnimatePresence>
                {selectedItem && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <DeepDivePanel
                            item={selectedItem}
                            onClose={() => setSelectedItem(null)}
                            onUpdate={(patch) => updateItem(selectedItem.id, patch)}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
