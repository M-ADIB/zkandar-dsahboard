import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useViewMode } from '@/context/ViewModeContext'
import type { ToolboxItem } from '@/types/database'
import { setDynamicPageTitle } from '@/hooks/usePageTitle'

function getVimeoEmbedUrl(url: string): string | null {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

const importanceConfig = {
    essential: { label: 'Essential', color: 'text-red-300', bg: 'bg-red-500/10 border-red-500/30' },
    recommended: { label: 'Recommended', color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    optional: { label: 'Optional', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30' },
}

const subscriptionConfig = {
    free: { label: 'Free', color: 'text-green-300', bg: 'bg-green-500/10 border-green-500/30' },
    freemium: { label: 'Freemium', color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/30' },
    paid: { label: 'Paid', color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    enterprise: { label: 'Enterprise', color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/30' },
}

const toolTypeConfig: Record<string, { label: string; color: string }> = {
    image_generation: { label: 'Image Generation', color: 'text-purple-300' },
    video_generation: { label: 'Video Generation', color: 'text-blue-300' },
    text_generation: { label: 'Text Generation', color: 'text-lime' },
    automation: { label: 'Automation', color: 'text-orange-300' },
    analytics: { label: 'Analytics', color: 'text-teal-300' },
    other: { label: 'Other', color: 'text-gray-400' },
}

function resolveTypes(item: ToolboxItem): { label: string; color: string }[] {
    const raw = Array.isArray(item.tool_types) && item.tool_types.length > 0
        ? item.tool_types : [item.tool_type]
    return raw.map(t => toolTypeConfig[t] ?? { label: t, color: 'text-gray-400' })
}

export function ToolboxDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const { isPreviewing, canPreview, previewUser } = useViewMode()
    const effectiveUserType = (canPreview && isPreviewing && previewUser)
        ? previewUser.user_type
        : user?.user_type ?? null

    const [item, setItem] = useState<ToolboxItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!id) return
        const fetch = async () => {
            const { data } = await supabase
                .from('toolbox_items')
                .select('*')
                .eq('id', id)
                .single()
            if (!data) {
                setNotFound(true)
            } else {
                const fetched = data as ToolboxItem
                const vt = Array.isArray(fetched.visible_to) ? fetched.visible_to : []
                const visible = vt.length > 0
                    ? (effectiveUserType ? vt.includes(effectiveUserType) : false)
                    : fetched.is_active
                if (!visible) {
                    setNotFound(true)
                } else {
                    setItem(fetched)
                    setDynamicPageTitle(fetched.title)
                }
            }
            setLoading(false)
        }
        fetch()
    }, [id, effectiveUserType])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
            </div>
        )
    }

    if (notFound || !item) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
                <p className="text-gray-400">Tool not found.</p>
                <Link to="/toolbox" className="inline-flex items-center gap-2 text-sm text-lime hover:opacity-80 transition">
                    <ArrowLeft className="h-4 w-4" /> Back to Toolbox
                </Link>
            </div>
        )
    }

    const imp = importanceConfig[item.importance]
    const sub = subscriptionConfig[item.subscription_type] ?? subscriptionConfig.paid
    const resolvedTypes = resolveTypes(item)

    // Fallback logic for demonstration purposes until media is fully populated
    const rawMediaItems = item.media && item.media.length > 0 ? item.media : [
        ...(item.vimeo_url ? [{ id: 'legacy-video', type: 'video' as const, url: item.vimeo_url, title: 'Tutorial Video' }] : []),
        { id: '1', type: 'image' as const, url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', title: 'Walkthrough Tutorial' },
        { id: '2', type: 'image' as const, url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2670&auto=format&fit=crop', title: 'Example Output' }
    ].slice(0, 3)

    const mediaItems = rawMediaItems.map(m => ({
        ...m,
        title: m.title === 'Interface Overview' ? 'Walkthrough Tutorial' : m.title
    }))

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6 pb-20 w-full"
        >
            {/* Back link */}
            <Link
                to="/toolbox"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Toolbox
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Right Column: Tool Info Card (Stops at top on mobile, sits sticky on right on desktop) */}
                <div className="order-1 lg:order-2 lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                    <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xl shadow-black/30">
                        {/* Header with Logo, Title, and Consolidated Badges below Title */}
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-xl bg-bg-elevated border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {item.logo_url ? (
                                    <img src={item.logo_url} alt="" className="h-full w-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                ) : (
                                    <div className="h-full w-full gradient-lime flex items-center justify-center rounded-xl">
                                        <span className="text-black font-bold text-lg">{item.title.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-bold text-white tracking-tight">{item.title}</h1>
                                
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    <span className={`px-2 py-0.5 text-[10px] rounded-lg border font-semibold tracking-wide uppercase ${imp.bg} ${imp.color}`}>
                                        {imp.label}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] rounded-lg border font-semibold tracking-wide uppercase ${sub.bg} ${sub.color}`}>
                                        {sub.label}
                                    </span>
                                    {resolvedTypes.map((t, i) => (
                                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-medium ${t.color}`}>
                                            {t.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                            <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                        )}

                        {/* CTA */}
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-lime text-black font-semibold text-sm hover:opacity-90 hover:shadow-[0_0_20px_rgba(208,255,113,0.15)] transition-all duration-200"
                        >
                            Open Tool <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {/* Left Column: Media Gallery (Underneath Info Card on mobile, left on desktop) */}
                <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
                    {mediaItems.length > 0 ? (
                        <div className="space-y-6">
                            {mediaItems.map((media, index) => (
                                <div key={media.id || index} className="bg-bg-card border border-border rounded-2xl p-5 space-y-4 shadow-lg shadow-black/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-white tracking-wide">{media.title || 'Media Item'}</p>
                                        <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-gray-400 capitalize">
                                            {media.type}
                                        </span>
                                    </div>
                                    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-black/40" style={{ aspectRatio: '16/9' }}>
                                        {media.type === 'video' ? (
                                            <iframe
                                                src={getVimeoEmbedUrl(media.url) || media.url}
                                                className="absolute inset-0 w-full h-full"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                                title={media.title || 'Tutorial Video'}
                                            />
                                        ) : (
                                            <img
                                                src={media.url}
                                                alt={media.title || 'Screenshot'}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-bg-card border border-border rounded-2xl p-12 text-center text-gray-500 text-sm">
                            No screenshots or walkthrough videos available.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
