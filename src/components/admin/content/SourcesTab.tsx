import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Clock,
    Power,
    Youtube,
    BookOpen,
    Search,
    X,
    Loader2,
    ChevronDown,
    Hash,
    Globe,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { ContentSource, SourceType } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_TYPES: { value: SourceType; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'blog',          label: 'Blog / RSS',       icon: BookOpen, description: 'Fetch articles from a website or RSS feed' },
    { value: 'video_channel', label: 'Video Channel',    icon: Youtube,  description: 'Ingest videos from a YouTube channel' },
    { value: 'search_query',  label: 'Search Query',     icon: Search,   description: 'Run a search query via Brave Search API' },
]

function SourceIcon({ type }: { type: SourceType }) {
    if (type === 'video_channel') return <Youtube className="h-4 w-4 text-red-400" />
    if (type === 'blog')          return <BookOpen className="h-4 w-4 text-blue-400" />
    return <Search className="h-4 w-4 text-purple-400" />
}

function StatusBadge({ status }: { status: ContentSource['status'] }) {
    const cfg = {
        success: { icon: CheckCircle2, label: 'Success', className: 'text-lime bg-lime/10 border-lime/20' },
        failing: { icon: AlertCircle,  label: 'Failing',  className: 'text-red-400 bg-red-400/10 border-red-400/20' },
        pending: { icon: Clock,        label: 'Pending',  className: 'text-gray-400 bg-white/5 border-white/10' },
    }[status] ?? { icon: Clock, label: status, className: 'text-gray-400 bg-white/5 border-white/10' }

    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
            <Icon className="h-3 w-3" />{cfg.label}
        </span>
    )
}

function timeAgo(ts: string | null): string {
    if (!ts) return 'Never'
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60_000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d > 0)  return `${d}d ago`
    if (h > 0)  return `${h}h ago`
    if (m > 0)  return `${m}m ago`
    return 'just now'
}

// ─── Source Modal ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
    name:        '',
    type:        'blog' as SourceType,
    url:         '',
    query:       '',
    max_results: 10,
}

interface SourceModalProps {
    source: ContentSource | null
    onClose: () => void
    onSaved: (source: ContentSource) => void
}

function SourceModal({ source, onClose, onSaved }: SourceModalProps) {
    const [form, setForm]     = useState(
        source
            ? { name: source.name, type: source.type, url: source.url ?? '', query: source.query ?? '', max_results: source.max_results }
            : EMPTY_FORM
    )
    const [saving, setSaving] = useState(false)

    function set(key: string, val: string | number) {
        setForm((f) => ({ ...f, [key]: val }))
    }

    async function handleSave() {
        if (!form.name.trim()) { toast.error('Name is required'); return }
        if (form.type !== 'search_query' && !form.url.trim()) { toast.error('URL is required'); return }
        if (form.type === 'search_query' && !form.query.trim()) { toast.error('Query is required'); return }

        setSaving(true)

        const payload = {
            name:        form.name.trim(),
            type:        form.type,
            url:         form.type !== 'search_query' ? form.url.trim() : null,
            query:       form.type === 'search_query' ? form.query.trim() : null,
            max_results: form.max_results,
            updated_at:  new Date().toISOString(),
        }

        let data: ContentSource | null = null
        let error: { message: string } | null = null

        if (source) {
            const res = await db
                .from('content_sources')
                .update(payload)
                .eq('id', source.id)
                .select()
                .single()
            data  = res.data as ContentSource | null
            error = res.error
        } else {
            const res = await db
                .from('content_sources')
                .insert({ ...payload, status: 'pending', active: true })
                .select()
                .single()
            data  = res.data as ContentSource | null
            error = res.error
        }

        setSaving(false)
        if (error) { toast.error(error.message); return }
        toast.success(source ? 'Source updated' : 'Source added')
        onSaved(data as ContentSource)
    }

    const isEdit = Boolean(source)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md bg-bg-elevated border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                    <h3 className="font-semibold text-white">{isEdit ? 'Edit Source' : 'Add Source'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder="e.g. TechCrunch AI Blog"
                            className="w-full px-3 py-2 bg-bg-primary border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                        <div className="relative">
                            <select
                                value={form.type}
                                onChange={(e) => set('type', e.target.value as SourceType)}
                                className="w-full px-3 py-2 bg-bg-primary border border-white/[0.08] rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-lime/40 transition-colors pr-8"
                            >
                                {SOURCE_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                            {SOURCE_TYPES.find((t) => t.value === form.type)?.description}
                        </p>
                    </div>

                    {/* URL (blog + video_channel) */}
                    {form.type !== 'search_query' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                {form.type === 'blog' ? 'Blog / RSS URL' : 'Channel URL'}
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                                <input
                                    type="url"
                                    value={form.url}
                                    onChange={(e) => set('url', e.target.value)}
                                    placeholder={form.type === 'blog' ? 'https://example.com/blog' : 'https://youtube.com/@channelname'}
                                    className="w-full pl-9 pr-3 py-2 bg-bg-primary border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Query (search_query) */}
                    {form.type === 'search_query' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Search Query</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                                <input
                                    type="text"
                                    value={form.query}
                                    onChange={(e) => set('query', e.target.value)}
                                    placeholder="e.g. AI agents enterprise 2025"
                                    className="w-full pl-9 pr-3 py-2 bg-bg-primary border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lime/40 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Max Results */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Max Results per Sync</label>
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={form.max_results}
                            onChange={(e) => set('max_results', parseInt(e.target.value) || 10)}
                            className="w-full px-3 py-2 bg-bg-primary border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-lime/40 transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.08]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? 'Save Changes' : 'Add Source'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// ─── Source Card ──────────────────────────────────────────────────────────────

interface SourceCardProps {
    source: ContentSource
    itemCount: number
    onEdit: () => void
    onDelete: () => void
    onToggleActive: () => void
}

function SourceCard({ source, itemCount, onEdit, onDelete, onToggleActive }: SourceCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-2xl border transition-colors ${source.active ? 'bg-bg-elevated border-white/[0.08]' : 'bg-bg-primary border-white/[0.04] opacity-60'}`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/5 border border-white/[0.08]">
                        <SourceIcon type={source.type} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">{source.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{SOURCE_TYPES.find((t) => t.value === source.type)?.label}</p>
                    </div>
                </div>
                <StatusBadge status={source.status} />
            </div>

            {/* Meta */}
            <div className="space-y-1.5 mb-3">
                {source.url && (
                    <p className="text-xs text-gray-600 truncate" title={source.url}>
                        <span className="text-gray-500">URL: </span>{source.url}
                    </p>
                )}
                {source.query && (
                    <p className="text-xs text-gray-600 truncate" title={source.query}>
                        <span className="text-gray-500">Query: </span>{source.query}
                    </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{itemCount} items</span>
                    <span>·</span>
                    <span>Max {source.max_results} / sync</span>
                    <span>·</span>
                    <span>Checked {timeAgo(source.last_checked_at)}</span>
                </div>
            </div>

            {/* Error log */}
            {source.status === 'failing' && source.error_log && (
                <p className="text-xs text-red-400 bg-red-400/5 rounded-lg px-3 py-2 mb-3 line-clamp-2">
                    {source.error_log}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
                {/* Active toggle */}
                <button
                    onClick={onToggleActive}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        source.active
                            ? 'border-lime/20 text-lime bg-lime/5 hover:bg-lime/10'
                            : 'border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                    <Power className="h-3 w-3" />
                    {source.active ? 'Active' : 'Inactive'}
                </button>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {confirmDelete ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onDelete}
                                className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="px-2 py-1 rounded-lg text-gray-500 text-xs hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ─── SourcesTab ───────────────────────────────────────────────────────────────

interface SourcesTabProps {
    sources: ContentSource[]
    onSourcesChange: (sources: ContentSource[]) => void
}

export function SourcesTab({ sources, onSourcesChange }: SourcesTabProps) {
    const [loading, setLoading]         = useState(true)
    const [showModal, setShowModal]     = useState(false)
    const [editingSource, setEditing]   = useState<ContentSource | null>(null)
    const [itemCounts, setItemCounts]   = useState<Record<string, number>>({})

    useEffect(() => {
        async function fetchSources() {
            setLoading(true)
            const { data, error } = await db
                .from('content_sources')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) { toast.error('Failed to load sources'); setLoading(false); return }
            onSourcesChange((data ?? []) as ContentSource[])
            setLoading(false)
        }

        async function fetchCounts() {
            const { data } = await db
                .from('content_items')
                .select('source_id')
            const counts: Record<string, number> = {}
            ;(data ?? []).forEach((r: { source_id: string | null }) => {
                if (r.source_id) counts[r.source_id] = (counts[r.source_id] ?? 0) + 1
            })
            setItemCounts(counts)
        }

        fetchSources()
        fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function handleDelete(id: string) {
        const { error } = await db.from('content_sources').delete().eq('id', id)
        if (error) { toast.error('Failed to delete source'); return }
        toast.success('Source deleted')
        onSourcesChange(sources.filter((s) => s.id !== id))
    }

    async function handleToggleActive(source: ContentSource) {
        const { error } = await db
            .from('content_sources')
            .update({ active: !source.active, updated_at: new Date().toISOString() })
            .eq('id', source.id)
        if (error) { toast.error('Failed to update'); return }
        onSourcesChange(sources.map((s) => s.id === source.id ? { ...s, active: !source.active } : s))
    }

    function handleSaved(saved: ContentSource) {
        const exists = sources.find((s) => s.id === saved.id)
        if (exists) {
            onSourcesChange(sources.map((s) => s.id === saved.id ? saved : s))
        } else {
            onSourcesChange([saved, ...sources])
        }
        setShowModal(false)
        setEditing(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-lime" />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-base font-semibold text-white">Content Sources</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{sources.length} source{sources.length !== 1 ? 's' : ''} configured</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setShowModal(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Source
                </button>
            </div>

            {sources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.08] rounded-2xl">
                    <Globe className="h-10 w-10 text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">No sources yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Add blogs, YouTube channels, or search queries to start aggregating content.</p>
                    <button
                        onClick={() => { setEditing(null); setShowModal(true) }}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-lime/10 hover:bg-lime/20 text-lime text-sm font-semibold rounded-xl transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add First Source
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {sources.map((source) => (
                            <SourceCard
                                key={source.id}
                                source={source}
                                itemCount={itemCounts[source.id] ?? 0}
                                onEdit={() => { setEditing(source); setShowModal(true) }}
                                onDelete={() => handleDelete(source.id)}
                                onToggleActive={() => handleToggleActive(source)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Source modal */}
            <AnimatePresence>
                {showModal && (
                    <SourceModal
                        source={editingSource}
                        onClose={() => { setShowModal(false); setEditing(null) }}
                        onSaved={handleSaved}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
