import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ToolboxItem } from '@/types/database'

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

export function ToolboxDetailPage() {
    const { id } = useParams<{ id: string }>()
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
                .eq('is_active', true)
                .single()
            if (!data) {
                setNotFound(true)
            } else {
                setItem(data as ToolboxItem)
            }
            setLoading(false)
        }
        fetch()
    }, [id])

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
    const tt = toolTypeConfig[item.tool_type] ?? { label: item.tool_type, color: 'text-gray-400' }
    const embedUrl = item.vimeo_url ? getVimeoEmbedUrl(item.vimeo_url) : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            {/* Back link */}
            <Link
                to="/toolbox"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Toolbox
            </Link>

            {/* Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-6">

                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl gradient-lime flex items-center justify-center shrink-0">
                        <span className="text-black font-bold text-lg">{item.title.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium ${imp.bg} ${imp.color}`}>
                                {imp.label}
                            </span>
                            <span className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium ${sub.bg} ${sub.color}`}>
                                {sub.label}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-white">{item.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg">
                                {item.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-lg bg-white/5 ${tt.color}`}>
                                {tt.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-gray-300 leading-relaxed">{item.description}</p>
                )}

                {/* Vimeo embed */}
                {embedUrl && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Video Tutorial</p>
                        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <iframe
                                src={embedUrl}
                                className="absolute inset-0 w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                title={`${item.title} tutorial`}
                            />
                        </div>
                    </div>
                )}

                {/* CTA */}
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-lime text-black font-semibold text-sm hover:opacity-90 transition"
                >
                    Open Tool <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </motion.div>
    )
}
