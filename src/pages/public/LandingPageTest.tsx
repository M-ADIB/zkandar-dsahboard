import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
    Eye, ArrowRight, Users, Building2,
    X, ZoomIn, ZoomOut, TrendingDown, BarChart2, AlertCircle, ShieldOff,
} from 'lucide-react'
import logoSrc from '../../assets/logo.png'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROBLEM_STATS = [
    { value: '78%',   label: 'struggle controlling AI output quality',      Icon: TrendingDown },
    { value: '2.5/5', label: 'average confidence rating across 73 designers', Icon: BarChart2   },
    { value: '71%',   label: 'report inconsistent results across projects',  Icon: AlertCircle },
    { value: '0',     label: 'studios with a formal AI design framework',   Icon: ShieldOff   },
]

const TRADITIONAL_STEPS = [
    { num: '01', label: 'The Sketch',          img: '/lander/2.png',  caption: 'A hand-drawn concept. The starting point for every design.' },
    { num: '02', label: 'Massing Analysis',    img: '/lander/3.png',  caption: 'Weeks of analysis to understand the site and program.' },
    { num: '03', label: 'Visualization',       img: '/lander/15.png', caption: 'Final renders. Months of work. One direction committed.' },
]

// 11 images — clean 4-col grid: rows 1-2 share the big feature, row 3 has the wide+tall combo, row 4 is even
const GALLERY_ITEMS = [
    { label: 'Night Render',  img: '/lander/24.png', cls: 'col-span-2 row-span-2' },
    { label: 'Detail',        img: '/lander/8.png',  cls: '' },
    { label: 'Atmosphere',    img: '/lander/10.png', cls: '' },
    { label: 'Interior',      img: '/lander/11.png', cls: 'row-span-2' },
    { label: 'Section Cut',   img: '/lander/13.png', cls: '' },
    { label: 'Exterior',      img: '/lander/15.png', cls: 'col-span-2' },
    { label: 'Urban Plan',    img: '/lander/19.png', cls: '' },
    { label: 'Sketch',        img: '/lander/2.png',  cls: '' },
    { label: 'Crowd',         img: '/lander/1.png',  cls: '' },
    { label: 'Structure',     img: '/lander/22.png', cls: '' },
    { label: 'Storyboard',    img: '/lander/25.png', cls: '' },
]

const CAPABILITIES = [
    {
        num: '01', title: 'Generate Detail Shots',
        img: '/lander/8.png',
        copy: 'AI produces photorealistic close-ups of any material, texture, or architectural element — on demand.',
    },
    {
        num: '02', title: 'Analyze Any Site',
        img: '/lander/12.png',
        copy: 'Drop in a site. AI reads the landscape and outputs annotated sections: plants, drainage, soil layers.',
    },
    {
        num: '03', title: 'Iterate Facades at Speed',
        img: '/lander/23.png',
        copy: 'One base structure. Infinite directions. AI tests every variation before you commit to one.',
    },
    {
        num: '04', title: 'Sketch to Photorealistic Render',
        img: '/lander/2.png',
        copy: 'Draw the idea rough. AI builds the world — fully rendered, client-ready, in minutes.',
    },
    {
        num: '05', title: 'Section & Interior Visualization',
        img: '/lander/13.png',
        copy: 'AI cuts through any building and renders the spatial experience inside — no modeling software needed.',
    },
]

const STUDIOS = [
    'FORM Studio', 'Atelier Haus', 'Studio Collective', 'Arc & Co.',
    'Design Meridian', 'Whitespace Lab', 'Grid Atelier', 'The Spatial Co.',
    'Studio Mira', 'Blank Canvas', 'Forma Group', 'Norte Studio',
    'Eleven Architecture', 'Archway', 'Blueprint Studio', 'Render+',
]


const SPRINT_FEATURES     = ['3-Day Intensive', '2 Hours per day', 'Concept creation & ideation', 'Prompting frameworks included']
const MASTERCLASS_FEATURES = ['End-to-end curriculum', 'Custom dashboard & analytics', 'Team readiness certification', 'Advanced render workflows']

const WORKSHOPS = [
    { num: 1,  id: '1113394139', label: 'Sprint Workshop 1' },
    { num: 2,  id: '1113394104', label: 'Sprint Workshop 2' },
    { num: 3,  id: '1113394254', label: 'Sprint Workshop 3' },
    { num: 4,  id: '1113394271', label: 'Sprint Workshop 4' },
    { num: 5,  id: '1113394244', label: 'Sprint Workshop 5' },
    { num: 6,  id: '1113394028', label: 'Sprint Workshop 6' },
    { num: 7,  id: '1141677962', label: 'Sprint Workshop 7' },
    { num: 8,  id: '1141677978', label: 'Sprint Workshop 8' },
    { num: 9,  id: '1183473523', label: 'Sprint Workshop 9' },
]

const MASTERCLASS_VIDEOS = [
    { num: 1, id: '1113394028', label: 'Masterclass — Cohort 1' },
    { num: 2, id: '1113394271', label: 'Masterclass — Cohort 2' },
    { num: 3, id: '1113394139', label: 'Masterclass — Cohort 3' },
]

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

function LimeBar({ width = '4rem' }: { width?: string }) {
    return (
        <motion.div initial={{ width: 0 }} whileInView={{ width }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-lime h-[2px] flex-shrink-0" style={{ width }} />
    )
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose }: {
    images: typeof GALLERY_ITEMS; index: number; onClose: () => void
}) {
    const [current, setCurrent] = useState(index)
    const [zoom, setZoom] = useState(1)

    const item = images[current]

    const prev = () => { setZoom(1); setCurrent((c) => (c - 1 + images.length) % images.length) }
    const next = () => { setZoom(1); setCurrent((c) => (c + 1) % images.length) }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
            onClick={onClose}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs uppercase tracking-widest text-gray-500">{item.label} · {current + 1}/{images.length}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Image area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden cursor-default relative" onClick={(e) => e.stopPropagation()}>
                <motion.img
                    key={current}
                    src={item.img}
                    alt={item.label}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: zoom }}
                    transition={{ duration: 0.25 }}
                    className="max-h-full max-w-full object-contain select-none"
                    style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                    draggable={false}
                />
                {/* Prev / Next */}
                <button onClick={prev}
                    className="absolute left-4 p-3 rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white transition">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <button onClick={next}
                    className="absolute right-4 p-3 rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white transition">
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 px-5 py-3 border-t border-white/[0.06] overflow-x-auto no-scrollbar shrink-0" onClick={(e) => e.stopPropagation()}>
                {images.map((img, i) => (
                    <button key={i} onClick={() => { setZoom(1); setCurrent(i) }}
                        className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border transition ${i === current ? 'border-lime/60' : 'border-white/10 opacity-50 hover:opacity-80'}`}>
                        <img src={img.img} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </motion.div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPageTest() {
    const heroRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [videoTab, setVideoTab] = useState<'sprint' | 'masterclass'>('sprint')
    const [activeVideo, setActiveVideo] = useState(0)

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-lime/30">
            <GrainOverlay />

            <style>{`
                @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
                .marquee-track { animation: marquee 30s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
            `}</style>

            {/* Lightbox portal */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <Lightbox
                        images={GALLERY_ITEMS}
                        index={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── NAV ────────────────────────────────────────────────── */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.05] bg-black/75 backdrop-blur-md px-5 sm:px-10 py-3 flex items-center justify-between">
                <a href="/test-landingpage" className="flex items-center">
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                </a>
                <div className="flex items-center gap-3 sm:gap-5">
                    <span className="hidden sm:block text-[0.6rem] uppercase tracking-[0.18em] text-lime/60 font-bold">#1 AI Education · Dubai</span>
                    <a href="/submit-form" className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-lime transition-colors duration-200">Apply Now</a>
                </div>
            </nav>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
                <motion.div style={{ y: heroBgY }} className="absolute inset-0 z-0">
                    <img src="/lander/1.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
                </motion.div>

                <div className="relative z-10 container mx-auto px-5 sm:px-6 pt-28 pb-24 sm:pt-36 sm:pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
                        <div className="max-w-3xl">
                            <motion.div initial={{ width: 0 }} animate={{ width: '3rem' }}
                                transition={{ duration: 0.8 }} className="h-[3px] bg-lime mb-5" />

                            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-400 mb-5">
                                AI for Architects &amp; Designers
                            </motion.p>

                            <h1 className="font-heading font-black uppercase leading-[0.92] text-[clamp(2.6rem,7vw,5.5rem)] mb-6">
                                <span className="block text-white"><SplitText text="THIS IS WHAT" baseDelay={0.1} /></span>
                                <span className="block text-white"><SplitText text="AI-DIRECTED" baseDelay={0.28} /></span>
                                <span className="block text-lime"><SplitText text="DESIGN LOOKS LIKE." baseDelay={0.52} /></span>
                            </h1>

                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.95 }}
                                className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl mb-10 leading-relaxed">
                                From a blank sketch to a world-class colosseum — entirely AI-generated.{' '}
                                <span className="text-lime/80">This is what Zkandar AI teaches.</span>
                            </motion.p>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1 }}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <a href="/submit-form"
                                    className="px-7 py-4 bg-white text-black font-body font-bold uppercase tracking-wider rounded-full hover:bg-lime transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 text-sm">
                                    I'm an Individual <ArrowRight className="w-4 h-4" />
                                </a>
                                <a href="/submit-form"
                                    className="px-7 py-4 bg-transparent text-white font-body font-bold uppercase tracking-wider rounded-full border border-white/20 hover:border-lime/50 hover:text-lime transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 text-sm">
                                    I Lead a Team <ArrowRight className="w-4 h-4" />
                                </a>
                            </motion.div>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
                                className="flex flex-wrap items-center gap-3 sm:gap-4 mt-10 text-[0.6rem] sm:text-[0.6875rem] text-gray-600 uppercase tracking-[0.15em]">
                                <span>73 Surveyed</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>15+ Studios</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>Architects &amp; Designers</span>
                            </motion.div>
                        </div>

                        {/* Stat strip — desktop only */}
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="hidden lg:flex flex-col border-l border-white/10 pl-8">
                            {[{ value: '73', label: 'Surveyed' }, { value: '78%', label: 'Struggle' }, { value: '2.5/5', label: 'Confidence' }].map((s, i) => (
                                <div key={i} className="py-5 border-b border-white/5 last:border-0">
                                    <div className="text-2xl font-heading font-black text-red-400">{s.value}</div>
                                    <div className="text-[0.6875rem] uppercase tracking-[0.15em] text-gray-600 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </section>

            {/* ── THE QUESTION ───────────────────────────────────────── */}
            <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black px-5 sm:px-6">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    <FadeIn direction="up">
                        <MicroLabel center>An AI-Directed Project — Built From a Sketch</MicroLabel>
                    </FadeIn>
                    <FadeIn direction="up" delay={0.2}>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.9rem,5.5vw,4.5rem)] leading-[0.93] mt-8 mb-8">
                            HOW IS AI <span className="text-lime">REDEFINING</span><br className="hidden sm:block" />
                            {' '}THE DESIGN PROCESS?
                        </h2>
                    </FadeIn>
                    <FadeIn direction="up" delay={0.4}>
                        <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            We ran a real project — from a blank desert site to a finished colosseum — using only AI.<br className="hidden sm:block" />
                            Every render on this page was generated. Nothing was built.
                        </p>
                    </FadeIn>
                    <FadeIn direction="up" delay={0.6}>
                        <div className="mt-10 flex items-center justify-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                            <span className="text-[0.6875rem] uppercase tracking-[0.25em] text-gray-600">Scroll to see the project</span>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── THE PROBLEM ────────────────────────────────────────── */}
            <section className="py-20 md:py-28 bg-black border-t border-white/[0.04]">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>What we found — 73 architects &amp; designers surveyed</MicroLabel>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">THE DATA DOESN'T LIE</h2>
                            <LimeBar />
                        </div>
                    </FadeIn>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                        {PROBLEM_STATS.map((stat, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="relative bg-[#0d0d0d] border border-white/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-8 overflow-hidden h-full">
                                    {/* Visual bar */}
                                    <div className="flex items-end gap-0.5 mb-4 h-8">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <motion.div key={j}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${30 + Math.sin((i + j) * 1.3) * 25 + 25}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.1 + j * 0.04, duration: 0.5 }}
                                                className={`flex-1 rounded-sm ${j < 5 ? 'bg-red-500/60' : 'bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="text-[clamp(1.8rem,4.5vw,3rem)] font-heading font-black text-red-400 leading-none mb-2">{stat.value}</div>
                                        <stat.Icon className="w-4 h-4 text-red-400/50 mt-1 shrink-0" />
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{stat.label}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── THE PROCESS ────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#080808]">

                {/* Part 1 — Traditional workflow header */}
                <div className="container mx-auto px-5 sm:px-6 mb-10 md:mb-14">
                    <FadeIn>
                        <MicroLabel>The Traditional Process</MicroLabel>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                HOW IT USED TO WORK
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-md">Three stages. Linear. Slow. Expensive to change course.</p>
                    </FadeIn>
                </div>

                {/* Part 1 — 3-step row with arrows */}
                <div className="container mx-auto px-5 sm:px-6">
                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-[1fr_52px_1fr_52px_1fr] items-start">
                        {TRADITIONAL_STEPS.map((step, pos) => (
                            <>
                                <FadeIn key={step.num} delay={pos * 0.1}>
                                    <motion.div whileHover={{ y: -4 }} className="group cursor-default">
                                        <div className="relative h-52 rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-white/20 transition-all duration-300">
                                            <img src={step.img} alt={step.label}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                            <div className="absolute bottom-3 left-3">
                                                <p className="text-[0.55rem] font-heading font-black uppercase tracking-[0.2em] text-white/50">Step {step.num}</p>
                                                <p className="text-xs font-heading font-black uppercase tracking-wide text-white">{step.label}</p>
                                            </div>
                                        </div>
                                        <p className="text-[0.68rem] text-gray-600 mt-2.5 leading-snug px-0.5">{step.caption}</p>
                                    </motion.div>
                                </FadeIn>
                                {pos < 2 && (
                                    <div key={`arr-${pos}`} className="flex items-center justify-center pt-[84px]">
                                        <svg viewBox="0 0 52 20" fill="none" className="w-full h-5">
                                            <line x1="0" y1="10" x2="36" y2="10" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.5" />
                                            <path d="M34 4l8 6-8 6" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </>
                        ))}
                    </div>

                    {/* Mobile — vertical */}
                    <div className="md:hidden space-y-4">
                        {TRADITIONAL_STEPS.map((step, i) => (
                            <div key={step.num} className="flex gap-4 items-start">
                                <div className="flex flex-col items-center shrink-0 pt-1">
                                    <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                                        <span className="text-[0.6rem] font-heading font-black text-white/60">{step.num}</span>
                                    </div>
                                    {i < TRADITIONAL_STEPS.length - 1 && (
                                        <div className="w-px flex-1 bg-gradient-to-b from-white/20 to-white/5 my-1.5 min-h-[24px]" />
                                    )}
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="relative h-40 rounded-xl overflow-hidden border border-white/[0.06] mb-2">
                                        <img src={step.img} alt={step.label} className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <p className="text-[0.7rem] font-heading font-black uppercase tracking-wider text-white/80">{step.label}</p>
                                    <p className="text-[0.68rem] text-gray-500 mt-1 leading-snug">{step.caption}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Part 2 — HOW IS AI REDEFINING THIS? */}
                <FadeIn>
                    <div className="relative mt-20 mb-14 overflow-hidden">
                        <div className="absolute inset-0">
                            <img src="/lander/pres-8.png" alt="AI Process Diagram" className="w-full h-full object-cover opacity-[0.1]" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/60 to-[#080808]" />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808]" />
                        </div>
                        <div className="relative container mx-auto px-5 sm:px-6 py-16 md:py-20 text-center">
                            <MicroLabel>Skidmore Owings &amp; Merrill × Zkandar AI</MicroLabel>
                            <h2 className="font-heading font-black uppercase text-[clamp(2rem,6vw,4.5rem)] leading-[0.9] mt-5 mb-5">
                                HOW IS AI<br />
                                <span className="text-lime">REDEFINING THIS?</span>
                            </h2>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                                We ran this process with one of the world's top architecture firms. The difference came down to one thing: how you prompt.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* Part 3 — Mediocre vs Advanced prompting */}
                <div className="container mx-auto px-5 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

                        {/* Mediocre Prompting */}
                        <FadeIn delay={0}>
                            <div className="group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-red-500/25 transition-all duration-300 bg-white/[0.02]">
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img src="/lander/pres-19.png" alt="Mediocre Prompting result"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                                <div className="p-5 border-t border-white/[0.05]">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/70" />
                                        <span className="text-[0.6rem] font-heading font-black uppercase tracking-[0.2em] text-red-400/80">Mediocre Prompting</span>
                                    </div>
                                    <p className="text-white/90 font-semibold text-sm leading-snug mb-1.5">Generic output. No context, no direction.</p>
                                    <p className="text-gray-600 text-xs leading-relaxed">What you get when you describe the project without understanding how to steer AI. Technically correct. Architecturally forgettable.</p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Advanced Prompting */}
                        <FadeIn delay={0.12}>
                            <div className="group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-lime/25 transition-all duration-300 bg-white/[0.02]">
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img src="/lander/pres-20.png" alt="Advanced Prompting result"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                                <div className="p-5 border-t border-white/[0.05]">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-lime/70" />
                                        <span className="text-[0.6rem] font-heading font-black uppercase tracking-[0.2em] text-lime/80">Advanced Prompting</span>
                                    </div>
                                    <p className="text-white/90 font-semibold text-sm leading-snug mb-1.5">Cinematic. Atmospheric. Client-ready.</p>
                                    <p className="text-gray-600 text-xs leading-relaxed">Same project. Same AI. Completely different result. This is what happens when you know the framework — and it's exactly what Zkandar AI teaches.</p>
                                </div>
                            </div>
                        </FadeIn>

                    </div>
                </div>

            </section>

            {/* ── GALLERY ────────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-4">
                        <MicroLabel>Output Gallery</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            EVERY IMAGE WAS<br />
                            <span className="text-lime">GENERATED WITH AI.</span>
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.1} className="mb-10 md:mb-14">
                        <p className="text-gray-600 text-sm max-w-lg mt-3">
                            The colosseum doesn't exist. AI built it from a sketch. Click any image to preview.
                        </p>
                    </FadeIn>

                    {/* Desktop editorial grid — 4 cols, 4 rows, all 11 items visible */}
                    <div className="hidden sm:grid grid-cols-4 auto-rows-[200px] gap-3 md:gap-4">
                        {GALLERY_ITEMS.map((item, i) => (
                            <motion.div
                                key={i}
                                onClick={() => setLightboxIndex(i)}
                                whileHover={{ scale: 1.015 }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
                                className={`relative rounded-2xl border border-white/[0.05] hover:border-lime/25 overflow-hidden group cursor-pointer transition-colors duration-300 ${item.cls}`}
                            >
                                <img src={item.img} alt={item.label}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                                    <Eye className="w-5 h-5 text-white" />
                                    <span className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-200">{item.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile: 2-col, no spans */}
                    <div className="sm:hidden grid grid-cols-2 gap-3">
                        {GALLERY_ITEMS.map((item, i) => (
                            <motion.div
                                key={i}
                                onClick={() => setLightboxIndex(i)}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.04 }}
                                className="relative h-36 rounded-xl border border-white/[0.05] overflow-hidden cursor-pointer"
                            >
                                <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 hover:bg-black/50 transition-colors duration-300" />
                                <div className="absolute bottom-2 left-2.5 flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-white/60" />
                                    <span className="text-[0.55rem] uppercase tracking-wider text-white/60">{item.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FULL FILM ──────────────────────────────────────────── */}
            <section className="border-t border-white/[0.04] bg-black">
                {/* Cinematic header */}
                <div className="container mx-auto px-5 sm:px-6 pt-20 md:pt-28 pb-10 md:pb-14">
                    <FadeIn>
                        <MicroLabel>The Full Product</MicroLabel>
                        <div className="flex flex-wrap items-end justify-between gap-6 mt-4">
                            <div>
                                <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                    A FULLY AI-GENERATED<br />
                                    <span className="text-lime">FEATURE FILM.</span>
                                </h2>
                                <p className="text-gray-500 text-sm mt-4 max-w-xl leading-relaxed">
                                    Every frame. Every scene. Every visual — produced entirely through AI-directed workflows.
                                    No cameras. No crew. No traditional production.
                                    This is what you learn to build.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600">Full feature · AI-generated</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                {/* Full-width video */}
                <FadeIn delay={0.15}>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            src="https://player.vimeo.com/video/1183148939?title=0&byline=0&portrait=0&badge=0&dnt=1"
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="Fully AI-Generated Feature Film — Zkandar AI"
                        />
                    </div>
                </FadeIn>

                {/* Caption strip */}
                <div className="container mx-auto px-5 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.04]">
                    <p className="text-xs text-gray-700 uppercase tracking-[0.15em]">
                        Produced using AI workflows taught in the Sprint Workshop &amp; Masterclass
                    </p>
                    <a href="/submit-form"
                        className="inline-flex items-center gap-2 text-xs font-bold text-lime hover:text-lime/80 uppercase tracking-[0.15em] transition">
                        Learn to build this <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </section>

            {/* ── 5 AI CAPABILITIES ──────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#080808]">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>What AI Can Do</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            5 THINGS AI MADE POSSIBLE<br />
                            <span className="text-lime">ON THIS PROJECT</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">We teach each of these in the Sprint Workshop and Masterclass.</p>
                    </FadeIn>

                    {/* 2×2 grid + last card full-width */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                        {CAPABILITIES.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.08}
                                className={i === 4 ? 'sm:col-span-2' : ''}>
                                <motion.div whileHover={{ y: -4 }}
                                    className={`relative bg-[#0d0d0d] border border-white/[0.06] hover:border-lime/25 rounded-2xl overflow-hidden group h-full transition-colors duration-300 ${i === 4 ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}>
                                    <div className={`relative overflow-hidden shrink-0 ${i === 4 ? 'h-48 sm:h-auto sm:w-72' : 'h-44 sm:h-48'}`}>
                                        <img src={cap.img} alt={cap.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/20 to-transparent" />
                                        <div className="absolute top-3 right-3">
                                            <span className="text-[0.625rem] font-heading font-black text-lime bg-black/70 backdrop-blur-sm border border-lime/20 px-2 py-1 rounded-lg tracking-wider">
                                                {cap.num}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                                        <h3 className="font-heading font-black uppercase text-sm sm:text-base mb-2">{cap.title}</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">{cap.copy}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-10 md:mb-12">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.4rem,4vw,2.5rem)] leading-[0.95]">TRUSTED BY 15+ STUDIOS</h2>
                            <span className="px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime text-[0.6875rem] uppercase tracking-[0.15em] font-bold shrink-0">Growing</span>
                        </div>
                    </FadeIn>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mb-10">
                        {STUDIOS.map((s, i) => (
                            <FadeIn key={i} delay={i * 0.025}>
                                <motion.div whileHover={{ scale: 1.02, y: -2 }}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0d0d0d] border border-white/[0.05] hover:border-lime/20 rounded-xl sm:rounded-2xl text-center transition-colors duration-300">
                                    <span className="text-xs text-gray-400">{s}</span>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                    <div className="overflow-hidden border-t border-b border-white/[0.04] py-3.5">
                        <div className="flex gap-8 marquee-track whitespace-nowrap">
                            {[...STUDIOS, ...STUDIOS].map((s, i) => (
                                <span key={i} className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-700 inline-flex items-center gap-8">
                                    {s}<span className="text-lime/30">·</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIAL VIDEOS ─────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#050505]">
                <div className="container mx-auto px-5 sm:px-6">

                    {/* Header */}
                    <FadeIn className="mb-10 md:mb-14">
                        <MicroLabel>Real Results. Real Participants.</MicroLabel>
                        <div className="flex flex-wrap items-end gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                10 WORKSHOPS.<br className="sm:hidden" /> 500+ PARTICIPANTS.
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">
                            The most attended AI design education program in the UAE — for architects and interior designers.
                        </p>
                    </FadeIn>

                    {/* Stats strip */}
                    <FadeIn delay={0.05} className="mb-10 md:mb-12">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { val: '10',   label: 'Sprint Workshops run' },
                                { val: '500+', label: 'Participants trained' },
                                { val: '#1',   label: 'AI education in Dubai' },
                                { val: 'UAE',  label: 'Architects & designers' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 text-center">
                                    <div className="text-xl sm:text-2xl font-heading font-black text-lime">{s.val}</div>
                                    <div className="text-[0.6rem] sm:text-[0.6875rem] uppercase tracking-[0.15em] text-gray-600 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Tab switcher */}
                    <FadeIn delay={0.1} className="mb-6">
                        <div className="inline-flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-full p-1">
                            <button
                                onClick={() => { setVideoTab('sprint'); setActiveVideo(0) }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${videoTab === 'sprint' ? 'bg-lime text-black' : 'text-gray-400 hover:text-white'}`}
                            >Sprint Workshops</button>
                            <button
                                onClick={() => { setVideoTab('masterclass'); setActiveVideo(0) }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${videoTab === 'masterclass' ? 'bg-lime text-black' : 'text-gray-400 hover:text-white'}`}
                            >Masterclasses</button>
                        </div>
                    </FadeIn>

                    {/* Featured video player */}
                    <FadeIn delay={0.15}>
                        <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-video mb-4">
                            {videoTab === 'sprint' ? (
                                <iframe
                                    key={`sprint-${activeVideo}`}
                                    src={`https://player.vimeo.com/video/${WORKSHOPS[activeVideo].id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <iframe
                                    key={`master-${activeVideo}`}
                                    src={`https://player.vimeo.com/video/${MASTERCLASS_VIDEOS[activeVideo].id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            )}
                        </div>
                    </FadeIn>

                    {/* Workshop selector row */}
                    {videoTab === 'sprint' ? (
                        <FadeIn delay={0.2}>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {WORKSHOPS.map((w, i) => (
                                    <button
                                        key={w.num}
                                        onClick={() => setActiveVideo(i)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${i === activeVideo ? 'bg-lime/10 border-lime/40 text-lime' : 'border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-gray-300'}`}
                                    >
                                        {w.num < 10 ? `0${w.num}` : w.num}
                                    </button>
                                ))}
                                {/* Sprint Workshop 10 — Pro Workshop */}
                                <div className="px-3 py-1.5 rounded-xl text-xs font-bold border border-lime/20 text-lime/50 bg-lime/[0.03] flex items-center gap-1.5 cursor-default">
                                    <span>10</span>
                                    <span className="text-[0.55rem] uppercase tracking-wider bg-lime/20 text-lime rounded px-1 py-0.5">Pro</span>
                                </div>
                            </div>

                            {/* Sprint Workshop 10 Pro teaser */}
                            <div className="bg-gradient-to-r from-lime/[0.06] to-transparent border border-lime/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-lime/70">Sprint Workshop 10 — Pro Edition</span>
                                        <span className="text-[0.55rem] uppercase tracking-wider bg-lime/20 text-lime rounded px-1.5 py-0.5 font-bold">Limited 20 Spots</span>
                                    </div>
                                    <p className="text-white font-semibold text-sm mb-1">A Pro Workshop. Only for serious practitioners.</p>
                                    <p className="text-gray-500 text-xs leading-relaxed">Deeper curriculum, smaller cohort, higher-level output. Happens only a few times a year. If you're on this page, be part of it.</p>
                                </div>
                                <a href="/submit-form" className="shrink-0 px-5 py-2.5 rounded-full bg-lime text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 transition">
                                    Express Interest
                                </a>
                            </div>
                        </FadeIn>
                    ) : (
                        <FadeIn delay={0.2}>
                            <div className="flex flex-wrap gap-2">
                                {MASTERCLASS_VIDEOS.map((w, i) => (
                                    <button
                                        key={w.num}
                                        onClick={() => setActiveVideo(i)}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${i === activeVideo ? 'bg-lime/10 border-lime/40 text-lime' : 'border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-gray-300'}`}
                                    >
                                        {w.label}
                                    </button>
                                ))}
                            </div>
                        </FadeIn>
                    )}

                </div>
            </section>

            {/* ── CTA / PRICING ──────────────────────────────────────── */}
            <section id="sprint" className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16 text-center">
                        <MicroLabel center>Choose Your Path</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">WHERE DO YOU START?</h2>
                        <div className="mt-5 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-lime/10 border border-lime/25">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                            <span className="text-xs font-bold text-lime uppercase tracking-wider">Next Sprint Workshop: May 13–15, 2026</span>
                        </div>
                    </FadeIn>

                    <div id="masterclass" className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 max-w-5xl mx-auto">
                        {/* Sprint */}
                        <FadeIn direction="left" className="flex">
                            <motion.div whileHover={{ scale: 1.01, y: -4 }}
                                className="relative bg-[#0d0d0d] border border-white/[0.06] hover:border-white/20 rounded-2xl sm:rounded-3xl p-7 sm:p-10 flex flex-col overflow-hidden group transition-colors duration-300 w-full">
                                <div className="relative z-10 flex flex-col flex-1">
                                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-5">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <MicroLabel>Sprint Workshop</MicroLabel>
                                    <h3 className="font-heading font-black uppercase text-xl sm:text-2xl mt-2 mb-4">For Individuals</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-7 flex-1">A fast-paced, focused 3-day workshop to master AI ideation tools. Perfect for designers who want immediate workflow integration.</p>
                                    <ul className="space-y-2.5 mb-7">
                                        {SPRINT_FEATURES.map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <a href="/submit-form"
                                        className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-white text-black font-body font-bold uppercase tracking-wider text-sm hover:bg-lime transition-colors duration-300">
                                        Apply for Sprint <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        </FadeIn>

                        {/* Masterclass */}
                        <FadeIn direction="right" className="flex">
                            <motion.div whileHover={{ scale: 1.01, y: -4 }}
                                className="relative bg-[#0d0d0d] border border-lime/30 rounded-2xl sm:rounded-3xl p-7 sm:p-10 flex flex-col overflow-hidden group w-full"
                                style={{ boxShadow: '0 0 40px -10px rgba(208,255,113,0.12)' }}>
                                <div className="absolute inset-0 bg-gradient-to-br from-lime/[0.06] to-transparent pointer-events-none" />
                                <div className="relative z-10 flex flex-col flex-1">
                                    <div className="w-11 h-11 rounded-full bg-lime/20 flex items-center justify-center mb-5">
                                        <Building2 className="w-5 h-5 text-lime" />
                                    </div>
                                    <MicroLabel>Exclusive Masterclass</MicroLabel>
                                    <h3 className="font-heading font-black uppercase text-xl sm:text-2xl mt-2 mb-4">For Teams &amp; Studios</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-7 flex-1">A comprehensive AI system overhaul for your studio. Align firm standards with AI capabilities, track team progress, and certify readiness.</p>
                                    <ul className="space-y-2.5 mb-7">
                                        {MASTERCLASS_FEATURES.map(f => (
                                            <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <a href="/submit-form"
                                        className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity duration-300">
                                        Book Team Discovery <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────────────── */}
            <footer className="py-7 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 opacity-40">
                        <img src={logoSrc} alt="Zkandar AI" className="h-6 object-contain grayscale" />
                        <span className="text-xs font-heading tracking-wider">Zkandar AI</span>
                    </div>
                    <p className="text-[0.6rem] sm:text-[0.6875rem] text-gray-700 uppercase tracking-[0.15em]">
                        © {new Date().getFullYear()} Zkandar AI
                    </p>
                </div>
            </footer>
        </div>
    )
}
