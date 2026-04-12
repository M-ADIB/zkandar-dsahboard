import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wrench, Search, Filter, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import type { ToolboxItem } from '@/types/database'

const importanceConfig = {
    essential: { label: 'Essential', color: 'text-red-300', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
    recommended: { label: 'Recommended', color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
    optional: { label: 'Optional', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', dot: 'bg-gray-500' },
}

const toolTypeConfig: Record<string, { label: string; color: string }> = {
    image_generation: { label: 'Image Generation', color: 'text-purple-300' },
    video_generation: { label: 'Video Generation', color: 'text-blue-300' },
    text_generation: { label: 'Text Generation', color: 'text-lime' },
    automation: { label: 'Automation', color: 'text-orange-300' },
    analytics: { label: 'Analytics', color: 'text-teal-300' },
    other: { label: 'Other', color: 'text-gray-400' },
}

export function ToolboxPage() {
    const { user } = useAuth()
    const { isPreviewing, canPreview, previewUser } = useViewMode()
    const effectiveUserType = (canPreview && isPreviewing && previewUser)
        ? previewUser.user_type
        : user?.user_type ?? null

    const [items, setItems] = useState<ToolboxItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams()

    const search = searchParams.get('q') || ''
    const filterType = searchParams.get('type') || 'all'
    const filterImportance = searchParams.get('importance') || 'all'

    const updateFilter = (key: string, value: string) => {
        setSearchParams((prev: URLSearchParams) => {
            if (!value || value === 'all') {
                prev.delete(key)
            } else {
                prev.set(key, value)
            }
            return prev
        }, { replace: true })
    }

    useEffect(() => {
        const fetch = async () => {
            // Fetch all items ordered by admin-defined order; filter visible_to client-side
            const { data } = await supabase
                .from('toolbox_items')
                .select('*')
                .order('order_index', { ascending: true })

            const all = (data as ToolboxItem[]) ?? []

            // Filter to items visible for this user's type
            const visible = effectiveUserType
                ? all.filter(item => {
                    const vt = Array.isArray(item.visible_to) ? item.visible_to : []
                    if (vt.length === 0) {
                        // Fall back to legacy is_active for items not yet migrated
                        return item.is_active
                    }
                    return vt.includes(effectiveUserType)
                })
                : all.filter(item => item.is_active)

            setItems(visible)
            setLoading(false)
        }
        fetch()
    }, [effectiveUserType])

    const toolTypes = useMemo(() => {
        const allTypes = items.flatMap(i =>
            Array.isArray(i.tool_types) && i.tool_types.length > 0 ? i.tool_types : [i.tool_type]
        )
        return ['all', ...Array.from(new Set(allTypes)).sort()]
    }, [items])

    const filtered = useMemo(() => {
        return items.filter(item => {
            const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
                (item.description ?? '').toLowerCase().includes(search.toLowerCase())
            const itemTypes = Array.isArray(item.tool_types) && item.tool_types.length > 0
                ? item.tool_types : [item.tool_type]
            const matchType = filterType === 'all' || itemTypes.includes(filterType)
            const matchImp = filterImportance === 'all' || item.importance === filterImportance
            return matchSearch && matchType && matchImp
        })
    }, [items, search, filterType, filterImportance])

    // Respect admin-defined order_index, fall back to importance sort
    const sorted = useMemo(() => {
        return [...filtered]
    }, [filtered])

    const selectClass = 'px-3 py-1.5 bg-bg-elevated border border-border rounded-xl text-sm text-gray-300 focus:outline-none focus:border-lime/40 transition'

    return (
        <div className="space-y-6 max-w-full">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <Wrench className="h-6 w-6 text-lime" />
                    Toolbox
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                    Your curated AI toolkit for the masterclass. All the tools you need to succeed.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search tools…"
                        value={search}
                        onChange={e => updateFilter('q', e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lime/40 transition"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select className={selectClass} value={filterType} onChange={e => updateFilter('type', e.target.value)}>
                        {toolTypes.map(t => (
                            <option key={t} value={t}>
                                {t === 'all' ? 'All Types' : toolTypeConfig[t]?.label ?? t}
                            </option>
                        ))}
                    </select>
                    <select className={selectClass} value={filterImportance} onChange={e => updateFilter('importance', e.target.value)}>
                        <option value="all">All Levels</option>
                        <option value="essential">Essential</option>
                        <option value="recommended">Recommended</option>
                        <option value="optional">Optional</option>
                    </select>
                </div>
            </div>

            {/* Items count */}
            {!loading && (
                <p className="text-xs text-gray-500">
                    {sorted.length} tool{sorted.length !== 1 ? 's' : ''} found
                </p>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
                </div>
            ) : sorted.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-sm">
                    No tools match your filters.
                </div>
            ) : (
                /* Cards grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {sorted.map((item, i) => {
                        const imp = importanceConfig[item.importance]
                        const types = Array.isArray(item.tool_types) && item.tool_types.length > 0
                            ? item.tool_types : [item.tool_type]
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="group relative bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-lime/30 transition-all duration-200"
                            >
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-2">
                                    {/* Logo */}
                                    <div className="h-10 w-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center overflow-hidden shrink-0">
                                        {item.logo_url ? (
                                            <img
                                                src={item.logo_url}
                                                alt=""
                                                className="h-full w-full object-contain p-1"
                                                onError={e => {
                                                    const el = e.target as HTMLImageElement
                                                    el.style.display = 'none'
                                                    el.parentElement!.innerHTML = `<span class="text-black font-bold text-sm gradient-lime rounded-xl h-full w-full flex items-center justify-center">${item.title.charAt(0)}</span>`
                                                }}
                                            />
                                        ) : (
                                            <div className="h-full w-full gradient-lime flex items-center justify-center rounded-xl">
                                                <span className="text-black font-bold text-sm">{item.title.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium ${imp.bg} ${imp.color}`}>
                                        {imp.label}
                                    </span>
                                </div>

                                {/* Title + description */}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white text-base">{item.title}</h3>
                                    {item.description && (
                                        <p className="text-sm text-gray-400 mt-1.5 leading-relaxed line-clamp-3">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Type chips */}
                                <div className="flex flex-wrap gap-1.5">
                                    {types.slice(0, 3).map(t => (
                                        <span key={t} className={`text-xs px-2 py-0.5 rounded-lg bg-white/5 ${toolTypeConfig[t]?.color ?? 'text-gray-400'}`}>
                                            {toolTypeConfig[t]?.label ?? t}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA */}
                                <Link
                                    to={`/toolbox/${item.id}`}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-lime/10 border border-lime/20 text-lime text-sm font-medium hover:bg-lime/20 transition group-hover:border-lime/40"
                                >
                                    View Tool <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
