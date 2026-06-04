import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Film } from 'lucide-react'
import { Portal } from '@/components/shared/Portal'

interface VideoModalProps {
    isOpen: boolean
    videoUrl: string
    onClose: () => void
}

interface ParsedVideo {
    type: 'vimeo' | 'youtube' | 'raw' | 'fallback'
    embedUrl?: string
    rawUrl?: string
}

function parseVideoUrl(url: string): ParsedVideo {
    if (!url) return { type: 'fallback', rawUrl: '' }

    const trimmedUrl = url.trim()

    // 1. YouTube detection
    const ytMatch = trimmedUrl.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i)
    if (ytMatch) {
        return {
            type: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
        }
    }

    // 2. Vimeo detection
    // Matches:
    // - https://vimeo.com/123456789
    // - https://vimeo.com/123456789/abcdef1234 (private hash format)
    // - https://player.vimeo.com/video/123456789
    // - https://vimeo.com/manage/videos/123456789
    const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/|showcase\/[^/]+\/video\/|manage\/videos\/)?|player\.vimeo\.com\/video\/)(\d+)(?:\/([a-zA-Z0-9]+))?/i)
    if (vimeoMatch) {
        const id = vimeoMatch[1]
        const hash = vimeoMatch[2]
        let embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1&muted=0&title=0&byline=0&portrait=0`
        if (hash) {
            embedUrl += `&h=${hash}`
        }
        return {
            type: 'vimeo',
            embedUrl
        }
    }

    // 3. Raw video file detection (.mp4, .webm, .ogg, .mov)
    if (/\.(mp4|webm|ogg|mov)(?:\?|$)/i.test(trimmedUrl)) {
        return {
            type: 'raw',
            rawUrl: trimmedUrl
        }
    }

    // 4. Fallback for Zoom, Google Drive, or any other external URL
    return {
        type: 'fallback',
        rawUrl: trimmedUrl
    }
}

export function VideoModal({ isOpen, videoUrl, onClose }: VideoModalProps) {
    const parsed = parseVideoUrl(videoUrl)

    return (
        <AnimatePresence>
            {isOpen && (
                <Portal>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black border border-white/10 bg-[#0A0A0A] flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/20 text-white transition-colors z-50 group hover:border-red-500/50"
                            >
                                <X className="h-5 w-5 group-hover:text-red-400 transition-colors" />
                            </button>

                            {/* Render different frames based on video type */}
                            {parsed.type === 'vimeo' && parsed.embedUrl && (
                                <iframe
                                    src={parsed.embedUrl}
                                    className="w-full h-full border-0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title="Vimeo Video Player"
                                />
                            )}

                            {parsed.type === 'youtube' && parsed.embedUrl && (
                                <iframe
                                    src={parsed.embedUrl}
                                    className="w-full h-full border-0"
                                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="YouTube Video Player"
                                />
                            )}

                            {parsed.type === 'raw' && parsed.rawUrl && (
                                <video
                                    src={parsed.rawUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                />
                            )}

                            {parsed.type === 'fallback' && (
                                <div className="p-8 text-center max-w-md space-y-6">
                                    <div className="h-16 w-16 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(208,255,113,0.05)]">
                                        <Film className="h-8 w-8 text-lime" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">External Video Host</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            This recording is hosted on an external platform (e.g. Zoom, Google Drive) that restricts embedding directly inside the dashboard.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            window.open(parsed.rawUrl, '_blank', 'noopener,noreferrer')
                                            onClose()
                                        }}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-lime text-black hover:bg-lime/90 font-semibold rounded-xl transition hover:scale-[1.02] shadow-lg shadow-lime/20"
                                    >
                                        Open Video in New Tab
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </Portal>
            )}
        </AnimatePresence>
    )
}
