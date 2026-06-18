import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wrench, Search, Filter, ChevronRight, Play, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import type { ToolboxItem } from '@/types/database'

function getVimeoIdAndHash(url: string): { id: string; hash: string | null } | null {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
        const hParam = urlObj.searchParams.get('h')
        
        const pathname = urlObj.pathname
        const parts = pathname.split('/').filter(Boolean)
        
        let videoId: string | null = null
        let hash: string | null = hParam || null
        
        if (parts.length > 0) {
            if (parts[0] === 'video') {
                videoId = parts[1] || null
                if (parts[2]) {
                    hash = parts[2]
                }
            } else {
                videoId = parts[0]
                if (parts[1]) {
                    hash = parts[1]
                }
            }
        }
        
        if (videoId && /^\d+$/.test(videoId)) {
            return { id: videoId, hash }
        }
    } catch (e) {
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
        if (match) {
            return { id: match[1], hash: null }
        }
    }
    return null
}

function getVimeoEmbedUrl(url: string): string | null {
    const parsed = getVimeoIdAndHash(url)
    if (!parsed) return null
    const { id, hash } = parsed
    return hash 
        ? `https://player.vimeo.com/video/${id}?h=${hash}` 
        : `https://player.vimeo.com/video/${id}`
}

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
    const [playingId, setPlayingId] = useState<string | null>(null)
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
                    {effectiveUserType === 'webinar_member' ? (
                        "Your curated AI toolkit for the Webinar. All the tools you need to succeed."
                    ) : effectiveUserType === 'sprint_member' ? (
                        "Your curated AI toolkit for the Sprint Workshop. All the tools you need to succeed."
                    ) : effectiveUserType === 'team' || effectiveUserType === 'management' ? (
                        "Master Class for team and management-type members"
                    ) : (
                        "Your curated AI toolkit for the masterclass. All the tools you need to succeed."
                    )}
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

                        const previewMedia = item.media?.find(
                            m => m.type === 'image' && 
                            (m.title?.toLowerCase().includes('preview') || 
                             m.title?.toLowerCase().includes('walkthrough') || 
                             m.title?.toLowerCase().includes('overview'))
                        ) || item.media?.find(m => m.type === 'image')

                        const videoMedia = item.media?.find(m => m.type === 'video')
                        const videoUrl = videoMedia?.url || item.vimeo_url

                        let previewUrl = previewMedia?.url || null

                        if (!previewUrl && videoUrl) {
                            const parsed = getVimeoIdAndHash(videoUrl)
                            if (parsed) {
                                previewUrl = parsed.hash 
                                    ? `https://vumbnail.com/${parsed.id}.jpg?h=${parsed.hash}`
                                    : `https://vumbnail.com/${parsed.id}.jpg`
                            }
                        }

                        if (!previewUrl) {
                            previewUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                        }

                        const isPlaying = playingId === item.id

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
                                                className="h-full w-full object-cover"
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

                                {/* Interface Preview Image / Inline Video Player */}
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-black/40 group/media">
                                    <div className="absolute inset-0 opacity-[0.03] z-10 pointer-events-none" style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                    }} />
                                    {isPlaying && videoUrl ? (
                                        <>
                                            <iframe
                                                src={`${getVimeoEmbedUrl(videoUrl)}?autoplay=1&title=0&byline=0&portrait=0&color=d0ff71`}
                                                className="absolute inset-0 w-full h-full z-20"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                                title={item.title}
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setPlayingId(null)
                                                }}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all duration-200 z-30"
                                                title="Close Video"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <img
                                                src={previewUrl}
                                                alt={item.title}
                                                className="h-full w-full object-cover group-hover/media:scale-[1.03] transition-transform duration-300"
                                                onError={e => {
                                                    const el = e.target as HTMLImageElement
                                                    el.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                                                }}
                                            />
                                            {videoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setPlayingId(item.id)
                                                    }}
                                                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors z-20"
                                                    title="Play Video"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-xl group-hover/media:scale-110 group-hover/media:border-lime/50 transition-all duration-300">
                                                        <Play className="h-5 w-5 fill-lime text-lime ml-0.5" />
                                                    </div>
                                                </button>
                                            )}
                                        </>
                                    )}
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
