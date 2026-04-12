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

function RelevanceBadge({ score }: { score: number | null }) {
    if (!score) return null
    const color = score >= 80
        ? 'bg-lime/10 text-lime border-lime/20'
        : score >= 60
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-white/5 text-gray-400 border-white/10'
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
            <Zap className="h-3 w-3" />{score}
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
            className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-bg-elevated border-l border-white/[0.08] z-50 flex flex-col shadow-2xl"
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
                {/* Title + score */}
                <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h2 className="text-lg font-bold text-white leading-tight">{item.title}</h2>
                        <RelevanceBadge score={item.relevance_score} />
                    </div>
                    {item.published_at && (
                        <p className="text-xs text-gray-500">
                            Published {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    )}
                </div>

                {/* Summary */}
                {item.summary && (
                    <div className="p-4 bg-bg-primary rounded-xl border border-white/[0.06]">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Summary</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{item.summary}</p>
                    </div>
                )}

                {/* Deep Dive */}
                {item.deep_dive && (
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Deep Dive</p>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{item.deep_dive}</p>
                    </div>
                )}

                {/* Action Items */}
                {item.action_items && item.action_items.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Action Items</p>
                        <ul className="space-y-2">
                            {item.action_items.map((a, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-lime flex-shrink-0" />
                                    <span className="text-sm text-gray-300">{a}</span>
                                </li>
                            ))}
                        </ul>
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

// ─── Item Card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
    item: ContentItem
    onClick: () => void
    onToggle: (field: 'is_pinned' | 'is_read' | 'is_archived', val: boolean) => void
}

function ItemCard({ item, onClick, onToggle }: ItemCardProps) {
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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={onClick}
            className={`group relative p-4 rounded-2xl border cursor-pointer transition-all hover:border-white/20 hover:bg-white/[0.02] ${
                item.is_read
                    ? 'bg-bg-primary border-white/[0.05]'
                    : 'bg-bg-elevated border-white/[0.08]'
            } ${item.is_pinned ? 'ring-1 ring-lime/20' : ''}`}
        >
            {/* Source + time row */}
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                    {item.content_sources && (
                        <>
                            <SourceIcon type={item.content_sources.type} />
                            <span className="text-xs text-gray-500">
                                {SOURCE_TYPE_LABELS[item.content_sources.type]} · {item.content_sources.name}
                            </span>
                        </>
                    )}
                </div>
                <span className="text-xs text-gray-600">{timeAgo(item.created_at)}</span>
            </div>

            {/* Title */}
            <h3 className={`text-sm font-semibold leading-snug mb-1.5 line-clamp-2 ${item.is_read ? 'text-gray-400' : 'text-white'}`}>
                {item.title}
            </h3>

            {/* Summary */}
            {item.summary && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{item.summary}</p>
            )}

            {/* Footer: badge + actions */}
            <div className="flex items-center justify-between">
                <RelevanceBadge score={item.relevance_score} />

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.is_pinned && <Pin className="h-3.5 w-3.5 text-lime" />}
                    <button
                        onClick={(e) => handleToggle(e, 'is_pinned')}
                        title={item.is_pinned ? 'Unpin' : 'Pin'}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        {item.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={(e) => handleToggle(e, 'is_read')}
                        title={item.is_read ? 'Mark unread' : 'Mark read'}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        {item.is_read ? <CheckCheck className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={(e) => handleToggle(e, 'is_archived')}
                        title={item.is_archived ? 'Unarchive' : 'Archive'}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        {item.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </button>
                    <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </motion.div>
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

    const fetchItems = useCallback(async () => {
        setLoading(true)
        const query = db
            .from('content_items')
            .select('*, content_sources(name, type)')
            .eq('is_archived', viewMode === 'archived')
            .order('is_pinned', { ascending: false })
            .order('relevance_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(100)

        const { data, error } = await query
        if (error) { toast.error('Failed to load content'); setLoading(false); return }
        setItems((data ?? []) as ContentItem[])
        setLoading(false)
    }, [viewMode])

    useEffect(() => { fetchItems() }, [fetchItems])

    function updateItem(id: string, patch: Partial<ContentItem>) {
        setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it))
        if (selectedItem?.id === id) setSelectedItem((prev) => prev ? { ...prev, ...patch } : null)
    }

    // Filter items client-side
    const filtered = items.filter((item) => {
        const matchSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || (item.summary ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchType   = typeFilter === 'all' || item.content_sources?.type === typeFilter
        return matchSearch && matchType
    })

    async function handleSync() {
        await onSync()
        fetchItems()
    }

    return (
        <div className="flex h-full">
            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search items…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/30 transition-colors"
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

                    {/* Active / Archived toggle */}
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

                {/* Count */}
                <div className="px-6 py-2 border-b border-white/[0.04]">
                    <span className="text-xs text-gray-500">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-lime" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Inbox className="h-10 w-10 text-gray-700 mb-3" />
                            <p className="text-sm text-gray-500">No content yet.</p>
                            <p className="text-xs text-gray-600 mt-1">Add sources and hit Sync Now to start ingesting.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((item) => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => setSelectedItem(item)}
                                        onToggle={(field, val) => updateItem(item.id, { [field]: val })}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
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
