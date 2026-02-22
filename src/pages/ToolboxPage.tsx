import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wrench, ExternalLink, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
    const [items, setItems] = useState<ToolboxItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterType, setFilterType] = useState('all')
    const [filterImportance, setFilterImportance] = useState('all')

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from('toolbox_items')
                .select('*')
                .eq('is_active', true)
                .order('order_index', { ascending: true })
            setItems((data as ToolboxItem[]) ?? [])
            setLoading(false)
        }
        fetch()
    }, [])

    const categories = useMemo(() =>
        ['all', ...Array.from(new Set(items.map(i => i.category))).sort()]
        , [items])

    const toolTypes = useMemo(() =>
        ['all', ...Array.from(new Set(items.map(i => i.tool_type))).sort()]
        , [items])

    const filtered = useMemo(() => {
        return items.filter(item => {
            const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
                (item.description ?? '').toLowerCase().includes(search.toLowerCase())
            const matchCat = filterCategory === 'all' || item.category === filterCategory
            const matchType = filterType === 'all' || item.tool_type === filterType
            const matchImp = filterImportance === 'all' || item.importance === filterImportance
            return matchSearch && matchCat && matchType && matchImp
        })
    }, [items, search, filterCategory, filterType, filterImportance])

    // Sort: essential first, then recommended, then optional
    const sorted = useMemo(() => {
        const order = { essential: 0, recommended: 1, optional: 2 }
        return [...filtered].sort((a, b) => order[a.importance] - order[b.importance])
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
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lime/40 transition"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select className={selectClass} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                    </select>
                    <select className={selectClass} value={filterType} onChange={e => setFilterType(e.target.value)}>
                        {toolTypes.map(t => (
                            <option key={t} value={t}>
                                {t === 'all' ? 'All Types' : toolTypeConfig[t]?.label ?? t}
                            </option>
                        ))}
                    </select>
                    <select className={selectClass} value={filterImportance} onChange={e => setFilterImportance(e.target.value)}>
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
                        const tt = toolTypeConfig[item.tool_type] ?? { label: item.tool_type, color: 'text-gray-400' }
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
                                    {/* Avatar initial */}
                                    <div className="h-10 w-10 rounded-xl gradient-lime flex items-center justify-center shrink-0">
                                        <span className="text-black font-bold text-sm">{item.title.charAt(0)}</span>
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

                                {/* Categories */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg">
                                        {item.category}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-lg bg-white/5 ${tt.color}`}>
                                        {tt.label}
                                    </span>
                                </div>

                                {/* CTA */}
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-lime/10 border border-lime/20 text-lime text-sm font-medium hover:bg-lime/20 transition group-hover:border-lime/40"
                                >
                                    Open Tool <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
