import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Play } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const IS_DEV = import.meta.env.DEV

// Extract Vimeo ID from a full URL or plain ID string
function extractVimeoId(urlOrId: string): string {
    const match = urlOrId.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : urlOrId.replace(/\D/g, '')
}

export function WelcomePage() {
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate()

    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [canEnter, setCanEnter] = useState(false)
    const [isEntering, setIsEntering] = useState(false)
    const [videoLoaded, setVideoLoaded] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Determine which video key to use based on user type
    const videoKey =
        user?.user_type === 'management'
            ? 'welcome_video_management'
            : 'welcome_video_team'

    // Fetch video URL from platform_settings
    useEffect(() => {
        async function fetchVideoUrl() {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', videoKey)
                .single<{ value: string }>()
            if (!error && data) {
                setVideoUrl(data.value)
            }
        }
        fetchVideoUrl()
    }, [videoKey])

    // Listen for Vimeo postMessage to detect video end
    useEffect(() => {
        function registerFinish() {
            iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ method: 'addEventListener', value: 'finish' }),
                '*'
            )
        }

        function handleMessage(event: MessageEvent) {
            if (!event.origin.includes('vimeo.com')) return
            try {
                const data =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data
                // Re-register for finish once the player signals it's ready
                if (data?.event === 'ready') {
                    registerFinish()
                }
                if (data?.event === 'finish') {
                    setCanEnter(true)
                }
            } catch {
                // ignore parse errors
            }
        }
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    function handleVideoLoad() {
        setVideoLoaded(true)
        // Send immediately on iframe load (belt-and-suspenders — player may not be
        // ready yet, but the 'ready' handler above will re-send if needed)
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ method: 'addEventListener', value: 'finish' }),
            '*'
        )
    }

    // Mark welcome_video_watched and trigger unlock animation
    async function handleEnter() {
        if (!user) return
        setIsEntering(true)

        // Mark in DB
        await supabase
            .from('users')
            // @ts-expect-error - update type inference failing for new column
            .update({ welcome_video_watched: true })
            .eq('id', user.id)

        // Delay to allow the epic animation to play out
        await new Promise((r) => setTimeout(r, 4000))

        // Refresh global state AFTER animation so the page doesn't unmount prematurely
        await refreshUser()
        navigate('/dashboard', { state: { unlocked: true }, replace: true })
    }

    // Dev-only skip
    function handleDevSkip() {
        setCanEnter(true)
    }

    const vimeoSrc = videoUrl
        ? `https://player.vimeo.com/video/${extractVimeoId(videoUrl)}?autoplay=1&api=1&background=0&loop=0&title=0&byline=0&portrait=0`
        : null

    return (
        <AnimatePresence mode="wait">
            {isEntering ? (
                /* ── Cinematic unlock: full-screen flash then radial expand ── */
                <motion.div
                    key="unlock"
                    className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
                    style={{ background: '#000000' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Radial lime flash */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(circle at center, #D0FF71 0%, #5A9F2E 30%, #000000 70%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 4, 4], opacity: [0, 1, 0] }}
                        transition={{ duration: 4, ease: 'easeInOut' }}
                    />
                    {/* Logo pulse */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1.2, 0.8] }}
                        transition={{ duration: 4, ease: 'easeInOut' }}
                        className="relative z-10 text-5xl font-black text-black"
                    >
                        ZKANDAR AI
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    key="welcome"
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                    {/* Background glow */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime/5 rounded-full blur-[120px]" />
                    </div>

                    {/* Noise texture */}
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
                            backgroundSize: '256px 256px',
                        }}
                    />

                    <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center gap-8">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Sparkles className="h-4 w-4 text-lime" />
                                <span className="text-xs uppercase tracking-widest text-lime">
                                    Welcome to the Platform
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                                Before you dive in, watch this
                            </h1>
                            <p className="text-gray-400 text-sm">
                                A quick walkthrough of everything you have access to.
                            </p>
                        </motion.div>

                        {/* Vimeo Player */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
                            style={{ aspectRatio: '16/9' }}
                        >
                            {!videoLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
                                    <div className="h-10 w-10 rounded-full border-2 border-lime border-t-transparent animate-spin" />
                                </div>
                            )}
                            {vimeoSrc ? (
                                <iframe
                                    ref={iframeRef}
                                    src={vimeoSrc}
                                    className="absolute inset-0 w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    onLoad={handleVideoLoad}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
                                    <div className="flex flex-col items-center gap-3 text-gray-500">
                                        <Play className="h-12 w-12" />
                                        <p className="text-sm">Video loading…</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* CTA row */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-col items-center gap-3 w-full"
                        >
                            <button
                                onClick={handleEnter}
                                className={`flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl text-sm transition-all ${
                                    canEnter
                                        ? 'gradient-lime text-black hover:scale-105 shadow-xl shadow-lime/20'
                                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {canEnter ? 'Enter the Platform' : 'Skip & Enter Platform'}
                                <ArrowRight className="h-4 w-4" />
                            </button>

                            {!canEnter && (
                                <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider">
                                    Video playing — feel free to skip when you're ready
                                </p>
                            )}

                            {IS_DEV && !canEnter && (
                                <button
                                    onClick={handleDevSkip}
                                    className="text-xs text-lime/50 underline underline-offset-2 hover:text-lime transition-colors mt-1"
                                >
                                    [dev] trigger finish state
                                </button>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
