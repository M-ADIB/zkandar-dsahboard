import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
    ArrowRight, ArrowDown,
    X,
    ChevronLeft, ChevronRight, Play,
} from 'lucide-react'
import { PublicNav } from '../../components/public/PublicNav'
import { PublicFooter } from '../../components/public/PublicFooter'
import { CalendlyModal } from '../../components/public/CalendlyModal'
import { CASE_STUDIES, type CaseStudy } from '../../data/public-data'
import { supabase } from '@/lib/supabase'

// ─── Data ─────────────────────────────────────────────────────────────────────



const LOGOS = [
    { name: 'Skidmore, Owings & Merrill', file: '/logos/som.png' },
    { name: 'Vitra',                      file: '/logos/vitra.png' },
    { name: 'SBE',                        file: '/logos/sbe.avif' },
    { name: 'KCA International',          file: '/logos/kca.avif' },
    { name: 'Genting',                    file: '/logos/genting.avif' },
    { name: 'GGB',                        file: '/logos/ggb.avif' },
    { name: 'EHN Interiors',              file: '/logos/ehn.avif' },
    { name: 'Al Bayan',                   file: '/logos/al-bayan.avif' },
    { name: 'Poincaré Studio',            file: '/logos/poincare.avif' },
    { name: 'Studio Echelle',             file: '/logos/studio-echelle.avif' },
    { name: 'JT CPL Designs',             file: '/logos/jt-cpl.avif' },
    { name: 'Beyond Dreams',              file: '/logos/beyond-dreams.avif' },
    { name: 'Rolling Stones Korea',       file: '/logos/rolling-stones-korea.avif' },
    { name: 'Zouk',                       file: '/logos/zouk.avif' },
    { name: 'Hawke House',                file: '/logos/hawke-house.avif' },
    { name: 'Finasi',                     file: '/logos/finasi.png' },
]





const MASTERCLASS_INCLUSIONS = [
    'Tailored content & case studies for your studio',
    'In-session hands-on exercises',
    'Prize money competition',
    'Life-time access to all session recordings',
    'Free access to E-prompt books',
    'Bonus 2-hr support call post Masterclass',
    '60-day free access to AI community',
    'Data-driven analysis of team performance',
]

const MASTERCLASS_GAINS = [
    { label: 'Control', body: 'Direct AI output with precision so it fits your visual language every time' },
    { label: 'Speed', body: 'Compress days of ideation into hours without sacrificing quality' },
    { label: 'Confidence', body: 'Present AI-assisted work to clients with full creative ownership' },
]

const SPRINT_INCLUSIONS = [
    '3 live days of hands-on AI training',
    'Real client-ready deliverables by Day 3',
    'Full Midjourney + AI rendering workflow',
    'Access to session recordings',
    'Free access to E-prompt books',
]

const SPRINT_GAINS = [
    { label: 'Speed', body: 'Go from sketch to photorealistic render in under 30 minutes' },
    { label: 'Output', body: 'Leave with real deliverables you can present to clients immediately' },
]

const VSL_VIDEO_ID = '1187084528'
// Replace with actual testimonial mashup Vimeo ID when available
const TESTIMONIAL_MASHUP_ID = '1187721520'


// ─── Helpers ──────────────────────────────────────────────────────────────────

function FadeIn({ children, direction = 'up', delay = 0, className = '' }: {
    children: React.ReactNode; direction?: 'up' | 'down' | 'left' | 'right'; delay?: number; className?: string
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    const off = { up: [0, 40], down: [0, -40], left: [40, 0], right: [-40, 0] }[direction]
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, x: off[0], y: off[1] }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >{children}</motion.div>
    )
}

function SplitText({ text, className = '', baseDelay = 0 }: { text: string; className?: string; baseDelay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    const words = text.split(' ')
    return (
        <span ref={ref} className={className}>
            {words.map((w, i) => (
                <motion.span key={i} className="inline-block"
                    initial={{ opacity: 0, y: 24 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.55, delay: baseDelay + i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                >{w}{i < words.length - 1 ? '\u00A0' : ''}</motion.span>
            ))}
        </span>
    )
}

function GrainOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
                <rect width="100%" height="100%" filter="url(#grain)" />
            </svg>
        </div>
    )
}

function MicroLabel({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
    return <p className={`text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 ${center ? 'text-center' : ''}`}>{children}</p>
}

function CheckItem({ text, delay = 0 }: { text: string; delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3"
        >
            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#D0FF71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <span className="text-sm text-gray-300 leading-relaxed font-body">{text}</span>
        </motion.div>
    )
}

function PurpleCheckItem({ text, delay = 0 }: { text: string; delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3"
        >
            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-purple-400/10 border border-purple-400/30 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <span className="text-sm text-gray-300 leading-relaxed font-body">{text}</span>
        </motion.div>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Case Study Presentation ──────────────────────────────────────────────────

function CaseStudyPresentation({
    cs, slideIdx, onClose, onNext, onPrev, onJump,
}: {
    cs: CaseStudy
    slideIdx: number
    onClose: () => void
    onNext: () => void
    onPrev: () => void
    onJump: (i: number) => void
}) {
    const filmstripRef = useRef<HTMLDivElement>(null)
    const slide = cs.slides[slideIdx]
    const prevSlide = slideIdx > 0 ? cs.slides[slideIdx - 1] : null
    const nextSlide = slideIdx < cs.slides.length - 1 ? cs.slides[slideIdx + 1] : null

    useEffect(() => {
        const el = filmstripRef.current?.children[slideIdx] as HTMLElement
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [slideIdx])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') onNext()
            if (e.key === 'ArrowLeft') onPrev()
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onNext, onPrev, onClose])

    // Group slides by category for divider lines in filmstrip
    let lastCategory = ''

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* ── Top bar: caption + close ── */}
            <div className="px-4 sm:px-8 py-3 border-b border-white/[0.07] bg-black/80 backdrop-blur shrink-0">
                <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-lime/80 font-bold mb-0.5">{slide.category}</p>
                        <p className="font-heading font-black uppercase text-lg sm:text-xl text-white leading-tight">{slide.title}</p>
                        {slide.caption && (
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed line-clamp-2">{slide.caption}</p>
                        )}
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                        <p className="text-[0.65rem] text-gray-600 tabular-nums hidden sm:block">{slideIdx + 1} / {cs.slides.length}</p>
                        <button onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/15 hover:border-lime/40 hover:bg-lime/10 text-gray-300 hover:text-lime transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main image area with blurred prev/next ── */}
            <div
                className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 bg-[#040404]"
                onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            >
                {/* Blurred previous image (left edge) */}
                {prevSlide && prevSlide.img && (
                    <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={prevSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}

                {/* Blurred next image (right edge) */}
                {nextSlide && nextSlide.img && (
                    <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 z-[1] pointer-events-none hidden md:block">
                        <img src={nextSlide.img} alt="" className="w-full h-full object-cover opacity-20 blur-[6px]" />
                        <div className="absolute inset-0 bg-gradient-to-l from-[#040404] via-[#040404]/60 to-transparent" />
                    </div>
                )}

                {/* Main content */}
                <div className="relative z-[2] flex items-center justify-center w-full h-full p-4 sm:p-8 md:px-52">
                    <AnimatePresence mode="wait">
                        {slide.vimeoId ? (
                            <motion.div
                                key={`video-${slideIdx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
                                    <iframe
                                        src={`https://player.vimeo.com/video/${slide.vimeoId}?autoplay=1&loop=0&title=0&byline=0&portrait=0&color=c8f542`}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title={slide.title}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.img
                                key={slideIdx}
                                src={slide.img}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="max-h-full max-w-full object-contain rounded-lg"
                                alt={slide.title}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Prev arrow */}
                <button onClick={onPrev}
                    className={`absolute left-3 sm:left-5 z-[5] p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm ${slideIdx === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next arrow */}
                <button onClick={onNext}
                    className={`absolute right-3 sm:right-5 z-[5] p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm ${slideIdx === cs.slides.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* ── Timeline filmstrip (BELOW image) ── */}
            <div className="shrink-0 border-t border-white/[0.07] bg-black/80 backdrop-blur px-3 sm:px-5 py-3">
                <div ref={filmstripRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide mx-auto max-w-5xl py-1">
                    {cs.slides.map((s, i) => {
                        const isActive = i === slideIdx
                        const showDivider = s.category !== lastCategory && i > 0
                        const currentCategory = s.category
                        if (s.category !== lastCategory) lastCategory = s.category
                        return (
                            <div key={i} className="shrink-0 flex items-center gap-2">
                                {showDivider && (
                                    <div className="w-px h-10 bg-white/[0.08] shrink-0" />
                                )}
                                <button
                                    onClick={() => onJump(i)}
                                    className={`shrink-0 flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                                    title={`${currentCategory} — ${s.title}`}
                                >
                                    <div className={`w-14 h-9 rounded-lg overflow-hidden border-2 transition-colors duration-200 flex items-center justify-center bg-white/[0.04] ${isActive ? 'border-lime' : 'border-white/[0.06]'}`}>
                                        {s.vimeoId ? (
                                            <Play className="w-3.5 h-3.5 text-lime/80" />
                                        ) : (
                                            <img src={s.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        )}
                                    </div>
                                    <span className={`text-[0.5rem] uppercase tracking-wider font-bold tabular-nums ${isActive ? 'text-lime' : 'text-gray-600'}`}>{s.stepLabel}</span>
                                </button>
                            </div>
                        )
                    })}
                </div>
                {/* Project name under timeline */}
                <p className="text-center text-[0.6rem] uppercase tracking-[0.18em] text-gray-700 mt-2">{cs.name} · {cs.projectType}</p>
            </div>

        </motion.div>
    )
}

function HeroVideo() {
    const [ready, setReady] = useState(false)
    return (
        <div
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: ready ? 1 : 0, filter: 'blur(3px) brightness(0.55)' }}
        >
            <iframe
                src="https://player.vimeo.com/video/1186560999?background=1&autoplay=1&loop=1&muted=1&title=0&byline=0&portrait=0"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: '100vw', height: '56.25vw', minHeight: '100%', minWidth: '177.78vh' }}
                allow="autoplay; fullscreen; picture-in-picture"
                onLoad={() => setReady(true)}
            />
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPageTest() {
    const heroRef = useRef(null)
    const [caseStudyOpen, setCaseStudyOpen] = useState<string | null>(null)
    const [caseSlideIdx, setCaseSlideIdx] = useState(0)
    const [masterclassModalOpen, setMasterclassModalOpen] = useState(false)
    const [sprintDates, setSprintDates] = useState('June 3–5')
    const [sprintLocation, setSprintLocation] = useState('Live Zoom')

    // Fetch marketing settings from Supabase CMS
    useEffect(() => {
        supabase
            .from('platform_settings')
            .select('key, value')
            .in('key', ['marketing_sprint_dates', 'marketing_sprint_location'])
            .then(({ data }) => {
                if (!data) return
                const map: Record<string, string> = {}
                data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
                if (map.marketing_sprint_dates) setSprintDates(map.marketing_sprint_dates)
                if (map.marketing_sprint_location !== undefined) setSprintLocation(map.marketing_sprint_location)
            })
    }, [])

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-lime/30">
            <GrainOverlay />

            <style>{`
                @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
                .marquee-track { animation: marquee 30s linear infinite; }
                .announce-track { animation: marquee 22s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
            `}</style>


            {/* ── ANNOUNCEMENT BAR ───────────────────────────────────── */}
            <div className="fixed top-0 inset-x-0 z-[51] bg-lime overflow-hidden h-8 flex items-center">
                <div className="flex announce-track whitespace-nowrap">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="inline-flex items-center gap-5 px-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-black">
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Sprint Workshop · {sprintDates}
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Limited Spots Remaining
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Secure Your Place Now
                        </span>
                    ))}
                </div>
            </div>

            {/* ── NAV ────────────────────────────────────────────────── */}
            <PublicNav topOffset={32} />

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Poster image — shows instantly while video buffers */}
                    <img
                        src="/casestudies/nisreen/money-shot-night.jpg"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'blur(3px) brightness(0.55)' }}
                        fetchPriority="high"
                    />
                    {/* Full-bleed video background — fades in over poster once loaded */}
                    <HeroVideo />
                    {/* Gradient overlays for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                </div>

                <div className="relative z-10 container mx-auto px-5 sm:px-6 pt-36 pb-24 sm:pt-44 sm:pb-32">
                    <div className="max-w-5xl mx-auto text-center">

                            <div className="space-y-3 mb-6">
                                <motion.span
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="block text-[0.7rem] sm:text-[0.8rem] font-bold uppercase tracking-[0.3em] text-white/40 font-body"
                                >
                                    We Teach
                                </motion.span>
                                <h1 className="font-heading font-black uppercase leading-[0.92]">
                                    <span className="block text-white text-[clamp(2rem,5.5vw,4.5rem)]">
                                        <SplitText text="ARCHITECTS &" baseDelay={0.15} />
                                    </span>
                                    <span className="block text-white text-[clamp(2rem,5.5vw,4.5rem)]">
                                        <SplitText text="INTERIOR DESIGNERS" baseDelay={0.3} />
                                    </span>
                                    <span className="block text-lime text-[clamp(1.3rem,3.2vw,2.6rem)] mt-2">
                                        <SplitText text="HOW TO USE AI." baseDelay={0.5} />
                                    </span>
                                </h1>
                            </div>

                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.95 }}
                                className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/30 mb-10">
                                * Every image on this page was generated by AI.
                            </motion.p>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1 }}
                                className="flex justify-center">
                                <button
                                    onClick={() => document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-[0_0_24px_rgba(208,255,113,0.4)] hover:-translate-y-0.5 font-heading">
                                    See How It's Done <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                                </button>
                            </motion.div>
                        </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </section>

            {/* ── PARTNERS LOGO TICKER ─────────────────────────────── */}
            <section id="partners" className="border-t border-white/[0.05] bg-black py-14">
                <style>{`
                    @keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
                    .logo-ticker { animation: ticker 35s linear infinite; }
                    .logo-ticker:hover { animation-play-state: paused; }
                `}</style>
                <FadeIn className="text-center mb-8">
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-gray-600">OUR PARTNERS</p>
                </FadeIn>
                <div className="overflow-hidden">
                    <div className="flex items-center gap-16 logo-ticker whitespace-nowrap w-max">
                        {[...LOGOS, ...LOGOS].map((logo, i) => (
                            <img
                                key={i}
                                src={logo.file}
                                alt={logo.name}
                                className="h-28 w-auto object-contain flex-shrink-0 opacity-65 hover:opacity-90 transition-opacity duration-300"
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF / ABOUT ────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#060606] overflow-hidden">
                <div className="container mx-auto px-5 sm:px-6">

                    {/* Bio layout — portrait photo + text */}
                    <FadeIn delay={0.1}>
                        <div className="max-w-5xl mx-auto grid md:grid-cols-[auto_1.6fr] gap-10 md:gap-16 items-start mb-20">

                            {/* Left — portrait photo with name overlay */}
                            <div className="flex flex-col items-center md:items-start">
                                <div className="relative w-64 md:w-72 rounded-2xl overflow-hidden border border-white/[0.08]" style={{ aspectRatio: '9/16' }}>
                                    <img
                                        src="/bio-khaled-portrait.jpg"
                                        alt="Khaled Iskandar"
                                        className="w-full h-full object-cover object-top"
                                    />
                                    {/* Name overlay at bottom */}
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-5 px-5">
                                        <h2 className="font-heading font-black uppercase text-[clamp(1.6rem,4vw,2.4rem)] leading-[0.92] text-white">
                                            KHALED<br /><span className="text-lime">ISKANDAR.</span>
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Right — bio text */}
                            <div className="flex flex-col justify-center">
                                <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300 mb-6">
                                    Interior designer turned AI Educator and Workflow Strategist, working with architects, interior designers, and marketers to rethink how ideas are created and presented.
                                </p>
                                <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300 mb-8">
                                    For the past five years, he has led Masterclasses for award-winning design studios and built a strong presence as a thought leader in AI globally, headlining talks for <span className="text-white font-semibold">Skidmore Owings &amp; Merrill</span>, <span className="text-white font-semibold">LW Design Group</span>, <span className="text-white font-semibold">Sikka Festival</span>, <span className="text-white font-semibold">Dubai Institute of Design &amp; Innovation</span>, and more.
                                </p>
                                <p className="font-body text-[1.05rem] leading-[1.75] text-gray-300">
                                    Explore below how this approach is applied through <span className="text-lime font-semibold">Sprint Workshops</span> for individuals and tailored <span className="text-lime font-semibold">Masterclasses</span> for teams.
                                </p>

                                {/* Headline talks */}
                                <div className="space-y-2 mt-10">
                                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.18em] text-gray-600 mb-3">Headline talks &amp; partnerships</p>
                                    {[
                                        { name: 'Skidmore Owings & Merrill', abbr: 'SOM' },
                                        { name: 'LW Design Group', abbr: 'LW Design' },
                                        { name: 'Sikka Art & Design Festival', abbr: 'Sikka' },
                                        { name: 'Dubai Institute of Design & Innovation', abbr: 'DIDI' },
                                    ].map((item) => (
                                        <div key={item.name} className="flex items-center gap-3 py-2 border-b border-white/[0.05]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                                            <span className="text-sm text-gray-300 font-body">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Photo strip label */}
                    <FadeIn delay={0.25}>
                        <p className="text-center text-[0.6875rem] font-body uppercase tracking-[0.22em] text-gray-600 mb-8">In the room with the best</p>
                    </FadeIn>
                </div>

                {/* Full-bleed infinite photo strip */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#060606] to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#060606] to-transparent z-10 pointer-events-none" />
                    <div className="flex overflow-hidden">
                        <div
                            className="flex gap-3 shrink-0 animate-[ticker_35s_linear_infinite]"
                            style={{ paddingRight: '0.75rem' }}
                        >
                            {[
                                { src: '/collabs/collab-1.jpg', alt: 'Vitra showroom talk' },
                                { src: '/collabs/collab-2.jpg', alt: 'Lighting Institute panel' },
                                { src: '/collabs/collab-3.jpg', alt: 'Studio training' },
                                { src: '/collabs/collab-4.jpg', alt: 'Design workshop' },
                                { src: '/collabs/collab-5.jpg', alt: 'Team masterclass' },
                                { src: '/collabs/collab-7.jpg', alt: 'Partner event' },
                                { src: '/collabs/collab-1.jpg', alt: 'Vitra showroom talk' },
                                { src: '/collabs/collab-2.jpg', alt: 'Lighting Institute panel' },
                                { src: '/collabs/collab-3.jpg', alt: 'Studio training' },
                                { src: '/collabs/collab-4.jpg', alt: 'Design workshop' },
                                { src: '/collabs/collab-5.jpg', alt: 'Team masterclass' },
                                { src: '/collabs/collab-7.jpg', alt: 'Partner event' },
                            ].map((photo, i) => (
                                <div key={i} className="shrink-0 h-52 md:h-64 w-80 md:w-96 rounded-xl overflow-hidden">
                                    <img
                                        src={photo.src}
                                        alt={photo.alt}
                                        loading="lazy"
                                        className="h-full w-full object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── VSL ────────────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
                    <FadeIn className="text-center mb-10">
                        <div className="space-y-2">
                            <p className="text-[0.65rem] sm:text-[0.75rem] font-bold uppercase tracking-[0.3em] text-white/30 font-body">Full Workflow</p>
                            <h2 className="font-heading font-black uppercase leading-[0.93]">
                                <span className="block text-white text-[clamp(1.5rem,4vw,3rem)]">AI Design Workflow</span>
                                <span className="block text-lime text-[clamp(1rem,2.4vw,1.8rem)] mt-1">From Sketch to Client Presentation.</span>
                            </h2>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a] aspect-video shadow-[0_0_80px_rgba(208,255,113,0.06)]">
                            <iframe
                                src={`https://player.vimeo.com/video/${VSL_VIDEO_ID}?autoplay=1&muted=1&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.35} className="flex flex-col items-center justify-center mt-8 gap-4">
                        <button
                            onClick={() => document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-[0_0_24px_rgba(208,255,113,0.4)] hover:-translate-y-0.5 font-heading">
                            See Case Studies <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                        </button>
                        <a href="/find-your-path"
                            className="text-[0.7rem] uppercase tracking-[0.15em] text-gray-500 hover:text-lime transition-colors font-body">
                            or take the AI readiness assessment →
                        </a>
                    </FadeIn>
                </div>
            </section>

            {/* ── TESTIMONIALS ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#050505]">
                <div className="container mx-auto px-5 sm:px-6">

                    <FadeIn className="text-center mb-10 md:mb-14">
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4 mb-3">
                            THE RESULTS SPEAK<br /><span className="text-lime">FOR THEMSELVES.</span>
                        </h2>
                        <p className="text-gray-500 text-base mt-2">From 30+ studios and firms around the world.</p>
                    </FadeIn>

                    {/* Testimonial mashup — 9:16 portrait */}
                    <FadeIn delay={0.1} className="flex justify-center">
                        <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black shadow-[0_0_60px_rgba(208,255,113,0.05)] w-full max-w-sm" style={{ aspectRatio: '9/16' }}>
                            <iframe
                                src={`https://player.vimeo.com/video/${TESTIMONIAL_MASHUP_ID}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── CASE STUDIES ───────────────────────────────────────── */}
            <section id="case-studies" className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16">
                        <div className="flex flex-wrap items-end gap-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                CASE STUDIES FROM<br /><span className="text-lime">OUR PARTICIPANTS.</span>
                            </h2>
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">
                            Every image below was generated by AI. Click any project to open the full presentation.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {CASE_STUDIES.map((cs) => (
                            <FadeIn key={cs.id}>
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    onClick={() => { setCaseStudyOpen(cs.id); setCaseSlideIdx(0) }}
                                    className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-colors duration-300 group"
                                >
                                    {/* Preview grid */}
                                    <div className="flex h-60 sm:h-72 gap-[3px]">
                                        {/* Big left image */}
                                        <div className="relative overflow-hidden flex-[2]">
                                            <img src={cs.previewImgs[0]} alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                                        </div>
                                        {/* 3 stacked right */}
                                        <div className="flex flex-col flex-1 gap-[3px]">
                                            {cs.previewImgs.slice(1, 4).map((img, i) => (
                                                <div key={i} className="relative overflow-hidden flex-1 min-h-0">
                                                    <img src={img} alt=""
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Info row */}
                                    <div className="px-5 sm:px-6 py-4 flex items-center gap-4">
                                        {/* DP */}
                                        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-white/10 group-hover:border-lime/30 transition-colors duration-300">
                                            <img src={cs.dp} alt={cs.name} className="w-full h-full object-cover object-top" />
                                        </div>
                                        {/* Text */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-heading font-black uppercase text-base sm:text-lg text-white leading-tight">{cs.name}</h3>
                                            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-600 font-bold mt-0.5">{cs.role}</p>
                                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-1 max-w-sm">{cs.tagline}</p>
                                        </div>
                                        {/* Arrow */}
                                        <div className="shrink-0 w-9 h-9 rounded-full border border-white/10 group-hover:border-lime/40 group-hover:bg-lime/10 transition-all flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-lime transition-colors" />
                                        </div>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={0.1} className="flex items-center justify-center mt-12">
                        <button
                            onClick={() => document.getElementById('masterclass')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-[0_0_24px_rgba(208,255,113,0.4)] hover:-translate-y-0.5 font-heading">
                            See Our Programs <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                        </button>
                    </FadeIn>
                </div>
            </section>


            {/* ── AI FOR TEAMS ──────────────────────────────────────────── */}
            <section id="masterclass" className="relative py-20 md:py-32 border-t border-white/[0.04] bg-black overflow-hidden">
                {/* Lime gradient orb atmosphere */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.07] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #D0FF71 0%, #5A9F2E 40%, transparent 70%)', filter: 'blur(80px)' }} />
                <div className="relative z-10 container mx-auto px-5 sm:px-6">

                    {/* Big Masterclass card */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-3xl overflow-hidden max-w-4xl mx-auto"
                        style={{
                            background: 'linear-gradient(145deg, #111811 0%, #0C130C 50%, #090D09 100%)',
                            border: '1px solid rgba(208, 255, 113, 0.15)',
                            boxShadow: '0 0 0 1px rgba(208,255,113,0.04), 0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(208,255,113,0.05) inset',
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />

                        <div className="p-8 md:p-12 lg:p-16 space-y-10">

                            {/* Badge + title */}
                            <div className="space-y-6">
                                <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-lime font-body border border-lime/20 bg-lime/5 px-3 py-1.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                                    Exclusive Program
                                </span>
                                <h3 className="font-heading font-black text-white uppercase text-[clamp(1.6rem,5vw,4rem)] leading-[1.0] md:leading-[0.93]">
                                    AI Masterclass<br /><span className="text-lime">for Teams</span>
                                </h3>
                                <p className="text-gray-400 text-base md:text-lg leading-relaxed font-body max-w-xl">
                                    A hands-on, studio-first AI program that gives your design team a complete operating system for using AI in real work.
                                </p>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* Meta tags */}
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: 'Duration', value: '15 hours' },
                                    { label: 'Format', value: 'Hands-On' },
                                    { label: 'Delivery', value: 'In-Person or Remote' },
                                    { label: 'Team Size', value: 'Up to 20 designers' },
                                ].map(m => (
                                    <div key={m.label} className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-full px-4 py-2">
                                        <span className="text-[10px] uppercase tracking-widest text-lime/60 font-bold font-heading">{m.label}</span>
                                        <span className="text-xs text-white font-body">{m.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/5" />

                            {/* What's included */}
                            <div className="space-y-5">
                                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">What's included</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                    {MASTERCLASS_INCLUSIONS.map((item, i) => (
                                        <CheckItem key={item} text={item} delay={i * 0.05} />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* What you'll gain */}
                            <div className="space-y-5">
                                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">What you'll walk away with</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {MASTERCLASS_GAINS.map((g, i) => (
                                        <motion.div
                                            key={g.label}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                            className="rounded-2xl p-5 space-y-2"
                                            style={{ background: 'rgba(208,255,113,0.03)', border: '1px solid rgba(208,255,113,0.08)' }}
                                        >
                                            <span className="font-heading font-black uppercase text-xl text-lime leading-none">{g.label}</span>
                                            <p className="text-xs text-gray-400 leading-relaxed font-body">{g.body}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <button
                                    onClick={() => setMasterclassModalOpen(true)}
                                    className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-[0_0_24px_rgba(208,255,113,0.4)] hover:-translate-y-0.5 font-heading"
                                >
                                    Book a Discovery Call
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => document.getElementById('sprint')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider font-body transition-all hover:-translate-y-0.5"
                                    style={{ background: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}
                                >
                                    Not a team? See individual training
                                    <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                                </button>
                            </div>

                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime/20 to-transparent" />
                    </motion.div>
                </div> {/* /z-10 container */}
            </section>

            {/* ── AI FOR INDIVIDUALS ─────────────────────────────────────── */}
            <section id="sprint" className="relative py-16 md:py-24 border-t border-white/[0.04] bg-black overflow-hidden">
                {/* Purple gradient orb atmosphere */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #8B5CF6 0%, #6D28D9 40%, transparent 70%)', filter: 'blur(80px)' }} />
                <div className="relative z-10 container mx-auto px-5 sm:px-6">

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-3xl overflow-hidden max-w-3xl mx-auto"
                        style={{
                            background: 'linear-gradient(145deg, #12101a 0%, #0d0b14 50%, #09080f 100%)',
                            border: '1px solid rgba(139, 92, 246, 0.15)',
                            boxShadow: '0 0 0 1px rgba(139,92,246,0.04), 0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(139,92,246,0.05) inset',
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

                        <div className="p-8 md:p-12 space-y-8">

                            {/* Badge + title */}
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-purple-300 font-body border border-purple-400/20 bg-purple-400/5 px-3 py-1.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                        Sprint Workshop · {sprintDates}
                                    </span>
                                    {sprintLocation && (
                                        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-purple-300/60 font-body border border-purple-400/10 bg-purple-400/[0.03] px-3 py-1.5 rounded-full">
                                            {sprintLocation}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-heading font-black text-white uppercase text-[clamp(1.6rem,5vw,3.2rem)] leading-[1.0] md:leading-[0.93]">
                                    AI for<br /><span className="text-purple-300">Individuals</span>
                                </h3>
                                <p className="text-gray-400 text-base leading-relaxed font-body max-w-xl">
                                    3 live days on Zoom. Hands-on from session one. You leave with real AI-generated deliverables and a workflow you can use immediately. No prior experience needed.
                                </p>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* Meta tags */}
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: 'Duration', value: '3 Days' },
                                    { label: 'Format', value: 'Hands-On' },
                                    { label: 'Delivery', value: 'Live Zoom' },
                                    { label: 'Time', value: '7 PM Dubai' },
                                ].map(m => (
                                    <div key={m.label} className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-full px-4 py-2">
                                        <span className="text-[10px] uppercase tracking-widest text-purple-300/60 font-bold font-heading">{m.label}</span>
                                        <span className="text-xs text-white font-body">{m.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/5" />

                            {/* What's included */}
                            <div className="space-y-5">
                                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">What's included</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                    {SPRINT_INCLUSIONS.map((item, i) => (
                                        <PurpleCheckItem key={item} text={item} delay={i * 0.05} />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* What you'll gain */}
                            <div className="space-y-5">
                                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">What you'll walk away with</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {SPRINT_GAINS.map((g, i) => (
                                        <motion.div
                                            key={g.label}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                            className="rounded-2xl p-5 space-y-2"
                                            style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.08)' }}
                                        >
                                            <span className="font-heading font-black uppercase text-xl text-purple-300 leading-none">{g.label}</span>
                                            <p className="text-xs text-gray-400 leading-relaxed font-body">{g.body}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <a href="https://buy.stripe.com/00wbJ10jzeCB3jGdfd1wY0M"
                                    className="group flex items-center gap-3 px-8 py-4 font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:-translate-y-0.5 font-heading"
                                    style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
                                >
                                    Direct Checkout
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>

                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />
                    </motion.div>
                </div> {/* /z-10 container */}
            </section>

            <PublicFooter />

            {/* ── MASTERCLASS BOOKING MODAL ─────────────────────────── */}
            <AnimatePresence>
                {masterclassModalOpen && (
                    <CalendlyModal studioMode onClose={() => setMasterclassModalOpen(false)} />
                )}
            </AnimatePresence>

            {/* ── CASE STUDY LIGHTBOX ────────────────────────────────── */}
            <AnimatePresence>
                {caseStudyOpen && (() => {
                    const cs = CASE_STUDIES.find(c => c.id === caseStudyOpen)!
                    const nextSlide = () => setCaseSlideIdx(i => Math.min(i + 1, cs.slides.length - 1))
                    const prevSlide = () => setCaseSlideIdx(i => Math.max(i - 1, 0))
                    return (
                        <CaseStudyPresentation
                            cs={cs}
                            slideIdx={caseSlideIdx}
                            onClose={() => setCaseStudyOpen(null)}
                            onNext={nextSlide}
                            onPrev={prevSlide}
                            onJump={setCaseSlideIdx}
                        />
                    )
                })()}
            </AnimatePresence>
        </div>
    )
}
