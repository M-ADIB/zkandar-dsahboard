import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
    Eye, ArrowRight, Users, Building2,
    X, ZoomIn, ZoomOut, TrendingDown, BarChart2, AlertCircle, ShieldOff,
    ChevronLeft, ChevronRight, Clock, Zap, Sparkles,
} from 'lucide-react'
import logoSrc from '../../assets/logo.png'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROBLEM_STATS = [
    { value: '83%',   label: 'of architects struggle controlling AI output quality',      Icon: TrendingDown },
    { value: '2.5/5', label: 'average AI confidence rating across 1,000+ designers', Icon: BarChart2   },
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
    { label: 'Night Entrance',  img: '/lander/24.png', cls: 'col-span-2 row-span-2' }, // cinematic entrance close-up
    { label: 'Arch Detail',     img: '/lander/26.png', cls: '' },                       // stone arch with S.O.M. sign
    { label: 'Reflecting Pool', img: '/lander/27.png', cls: '' },                       // pool reflection at night
    { label: 'Interior Hall',   img: '/lander/30.png', cls: 'row-span-2' },             // grand colosseum interior with torches
    { label: 'Section Cut',     img: '/lander/13.png', cls: '' },                       // facade cutaway
    { label: 'Wide Entrance',   img: '/lander/4.png',  cls: 'col-span-2' },             // definitive S.O.M. entrance — full width, cypress + reflecting pool
    { label: 'Concept Sketch',  img: '/lander/33.png', cls: '' },                       // white-line concept sketch on blue
    { label: 'Materials',       img: '/lander/32.png', cls: '' },                       // S.O.M. editorial detail collage
    { label: 'Construction',    img: '/lander/9.png',  cls: '' },                       // aerial night construction tilt-shift
    { label: 'Arena',           img: '/lander/1.png',  cls: '' },                       // gladiator crowd scene
    { label: 'Armor Detail',    img: '/lander/31.png', cls: '' },                       // gladiator armor close-up
]

const CAPABILITIES = [
    {
        num: '01', title: 'Generate Detail Shots',
        img: '/lander/8.png',
        copy: 'AI produces photorealistic close-ups of any material, texture, or architectural element. On demand.',
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
        copy: 'Draw the idea rough. AI builds the world. Fully rendered, client ready, in minutes.',
    },
    {
        num: '05', title: 'Section & Interior Visualization',
        img: '/lander/13.png',
        copy: 'AI cuts through any building and renders the spatial experience inside. No modeling software needed.',
    },
]

const STUDIOS = [
    'FORM Studio', 'Atelier Haus', 'Studio Collective', 'Arc & Co.',
    'Design Meridian', 'Whitespace Lab', 'Grid Atelier', 'The Spatial Co.',
    'Studio Mira', 'Blank Canvas', 'Forma Group', 'Norte Studio',
    'Eleven Architecture', 'Archway', 'Blueprint Studio', 'Render+',
]


const SPRINT_FEATURES = [
    'Day 1: Foundation. Identify AI stack, run first prompt to render workflow',
    'Day 2: In Depth. Master prompting from mediocre to advanced',
    'Day 3: Full Circle. Package results for client presentation',
    'Leave with portfolio renders. Generate in 20 min, not 3 weeks',
]

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
    { num: 1, id: '1113394028', label: 'Masterclass Cohort 1' },
    { num: 2, id: '1113394271', label: 'Masterclass Cohort 2' },
    { num: 3, id: '1113394139', label: 'Masterclass Cohort 3' },
]

const VSL_VIDEO_ID = '1174567061'
// Replace with actual testimonial mashup Vimeo ID when available
const TESTIMONIAL_MASHUP_ID = '1113394028'

const CASE_STUDIES = [
    {
        name: 'Sara Al-Rashid',
        role: 'Senior Architect',
        location: 'Dubai, UAE',
        before: {
            label: 'Before Zkandar AI',
            headline: '3 to 4 weeks per render.',
            points: [
                { icon: Clock,    text: 'Every visualization took 3 to 4 weeks to reach client-ready quality' },
                { icon: Zap,      text: 'Output quality was inconsistent. Clients frequently rejected first rounds' },
                { icon: Sparkles, text: 'Finding creative direction required days of reference gathering and sketching' },
            ],
            imgs: ['/lander/16.png', '/lander/2.png', '/lander/33.png'],
        },
        after: {
            label: 'After Zkandar AI',
            headline: 'Client-ready in 20 minutes.',
            points: [
                { icon: Clock,    text: 'Full render workflow from brief to presentation in under an hour' },
                { icon: Zap,      text: 'Consistent, photorealistic output every session. Zero outsourcing' },
                { icon: Sparkles, text: 'Creative direction unlocked instantly. Explore 10 concepts before lunch' },
            ],
            imgs: ['/lander/4.png', '/lander/15.png', '/lander/24.png'],
        },
    },
    {
        name: 'Mariam Khalil',
        role: 'Interior Design Studio Owner',
        location: 'Abu Dhabi, UAE',
        before: {
            label: 'Before Zkandar AI',
            headline: 'AED 1,200 per outsourced render.',
            points: [
                { icon: Clock,    text: 'Each outsourced visualization cost 800 to 1,200 AED and took over a week' },
                { icon: Zap,      text: 'Low output volume meant fewer proposals, fewer won projects' },
                { icon: Sparkles, text: 'Could not iterate quickly. Clients were shown one direction, not many' },
            ],
            imgs: ['/lander/33.png', '/lander/16.png', '/lander/2.png'],
        },
        after: {
            label: 'After Zkandar AI',
            headline: 'ROI recovered in 2 weeks.',
            points: [
                { icon: Clock,    text: 'Generates renders in-house in 20 minutes. Zero outsourcing costs' },
                { icon: Zap,      text: 'Proposal volume doubled. More pitches, more closes' },
                { icon: Sparkles, text: 'Now presents 5 to 8 concepts per client. Closes faster' },
            ],
            imgs: ['/lander/11.png', '/lander/4.png', '/lander/15.png'],
        },
    },
    {
        name: 'Faisal Al-Mutairi',
        role: 'Urban Planner',
        location: 'Riyadh, Saudi Arabia',
        before: {
            label: 'Before Zkandar AI',
            headline: 'Months to produce a single master plan visual.',
            points: [
                { icon: Clock,    text: 'Master plan visuals required specialized teams and months of production time' },
                { icon: Zap,      text: 'Hard to communicate spatial ideas to non-technical stakeholders' },
                { icon: Sparkles, text: 'Creative exploration was limited to what the budget allowed for' },
            ],
            imgs: ['/lander/16.png', '/lander/3.png', '/lander/2.png'],
        },
        after: {
            label: 'After Zkandar AI',
            headline: 'Full master plan visual in a single session.',
            points: [
                { icon: Clock,    text: 'Generates master plan perspectives and aerials in one working session' },
                { icon: Zap,      text: 'Stakeholders and clients grasp spatial vision immediately. Fewer revisions' },
                { icon: Sparkles, text: 'Explores design directions freely before committing to one' },
            ],
            imgs: ['/lander/19.png', '/lander/9.png', '/lander/24.png'],
        },
    },
    {
        name: 'Laila Hassan',
        role: 'Landscape Architect',
        location: 'Cairo, Egypt',
        before: {
            label: 'Before Zkandar AI',
            headline: 'Site analysis ate up the entire concept phase.',
            points: [
                { icon: Clock,    text: 'Manual site analysis diagrams took days to produce and update' },
                { icon: Zap,      text: 'Low-quality hand drawings failed to impress clients at early stages' },
                { icon: Sparkles, text: 'Lacked tools to visualize how planting schemes and materials would look' },
            ],
            imgs: ['/lander/2.png', '/lander/16.png', '/lander/33.png'],
        },
        after: {
            label: 'After Zkandar AI',
            headline: 'Site to concept in one afternoon.',
            points: [
                { icon: Clock,    text: 'Annotated site sections, planting plans, and renders generated same day' },
                { icon: Zap,      text: 'Client presentations elevated dramatically. Approval rates improved' },
                { icon: Sparkles, text: 'Visualizes any planting scheme or material instantly. No guessing' },
            ],
            imgs: ['/lander/12.png', '/lander/15.png', '/lander/4.png'],
        },
    },
    {
        name: 'Ahmed Al-Sayed',
        role: 'Architecture Studio Director',
        location: 'Riyadh, Saudi Arabia',
        before: {
            label: 'Before Zkandar AI',
            headline: 'The team wasted weeks on visualization production.',
            points: [
                { icon: Clock,    text: 'Junior staff spent 60% of their time on renders, not design thinking' },
                { icon: Zap,      text: 'Quality varied wildly across team members. No standardized workflow' },
                { icon: Sparkles, text: 'Creative bottlenecks delayed projects and strained client relationships' },
            ],
            imgs: ['/lander/33.png', '/lander/2.png', '/lander/16.png'],
        },
        after: {
            label: 'After Zkandar AI',
            headline: 'The whole studio works faster. Together.',
            points: [
                { icon: Clock,    text: 'Every team member generates client-ready visuals independently' },
                { icon: Zap,      text: 'Standardized AI workflows mean consistent quality across every project' },
                { icon: Sparkles, text: 'Creative output per project tripled. Overhead costs dropped significantly' },
            ],
            imgs: ['/lander/24.png', '/lander/13.png', '/lander/9.png'],
        },
    },
    {
        name: 'Nora Al-Farsi',
        role: 'Interior Design Freelancer',
        location: 'Dubai, UAE',
        before: {
            label: 'Before Zkandar AI',
            headline: 'Competing with larger studios felt impossible.',
            points: [
                { icon: Clock,    text: 'Render production was outsourced, slow, and ate into already thin margins' },
                { icon: Zap,      text: 'Could only pitch one concept per client. Larger firms showed five' },
                { icon: Sparkles, text: 'Struggled to turn around concepts quickly enough to win fast-moving projects' },
            ],
            imgs: ['/lander/16.png', '/lander/33.png', '/lander/2.png'],
        },
        after: {
            label: 'After Zkandar AI',
            headline: 'Now out-pitching studios 10 times her size.',
            points: [
                { icon: Clock,    text: 'Turnaround time cut from 2 weeks to same-day. Clients notice immediately' },
                { icon: Zap,      text: 'Presents 6 to 8 concepts per pitch. Win rate has more than doubled' },
                { icon: Sparkles, text: 'Operates at the output level of a full studio. Solo' },
            ],
            imgs: ['/lander/11.png', '/lander/4.png', '/lander/27.png'],
        },
    },
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
    const [activeMasterVideo, setActiveMasterVideo] = useState(0)
    const [tickerPage, setTickerPage] = useState(0)
    const [mobileTickerIdx, setMobileTickerIdx] = useState(0)
    const [expandedCase, setExpandedCase] = useState(0)
    const TICKER_TOTAL = Math.ceil(WORKSHOPS.length / 3)
    useEffect(() => {
        const t = setInterval(() => {
            setTickerPage(p => (p + 1) % TICKER_TOTAL)
            setMobileTickerIdx(p => (p + 1) % WORKSHOPS.length)
        }, 5000)
        return () => clearInterval(t)
    }, [TICKER_TOTAL])

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

            {/* ── ANNOUNCEMENT BAR ───────────────────────────────────── */}
            <div className="fixed top-0 inset-x-0 z-[51] bg-lime overflow-hidden h-8 flex items-center">
                <div className="flex announce-track whitespace-nowrap">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="inline-flex items-center gap-5 px-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-black">
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Sprint Workshop · May 13 to 15
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Limited Spots Remaining
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Secure Your Place Now
                        </span>
                    ))}
                </div>
            </div>

            {/* ── NAV ────────────────────────────────────────────────── */}
            <nav className="fixed top-8 inset-x-0 z-50 border-b border-white/[0.05] bg-black/80 backdrop-blur-md px-5 sm:px-10 py-3 flex items-center justify-between">
                <a href="/test-landingpage" className="flex items-center gap-3">
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                </a>
                <div className="flex items-center gap-3 sm:gap-5">
                    <span className="hidden sm:block text-[0.6rem] uppercase tracking-[0.18em] text-gray-500 font-bold">50+ Master Classes · 1000+ Participants</span>
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

                <div className="relative z-10 container mx-auto px-5 sm:px-6 pt-36 pb-24 sm:pt-44 sm:pb-32">
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
                                <span className="block text-white whitespace-nowrap"><SplitText text="THIS IS WHAT" baseDelay={0.1} /></span>
                                <span className="block text-lime whitespace-nowrap"><SplitText text="AI DIRECTED" baseDelay={0.28} /></span>
                                <span className="block text-white whitespace-nowrap"><SplitText text="DESIGN LOOKS LIKE." baseDelay={0.52} /></span>
                            </h1>

                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.95 }}
                                className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl mb-10 leading-relaxed">
                                <span className="text-gray-500 text-xs uppercase tracking-[0.18em]">Disclaimer:</span>{' '}
                                Every image on this page was generated by AI.
                            </motion.p>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1 }}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <a href="/submit-form"
                                    className="px-9 py-4 gradient-lime text-black font-body font-bold uppercase tracking-wider rounded-full hover:opacity-90 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 text-sm shadow-[0_0_40px_rgba(208,255,113,0.25)]">
                                    Get Started Now <ArrowRight className="w-4 h-4" />
                                </a>
                            </motion.div>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
                                className="flex flex-wrap items-center gap-3 sm:gap-4 mt-10 text-[0.6rem] sm:text-[0.6875rem] text-gray-600 uppercase tracking-[0.15em]">
                                <span>500+ Surveyed</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>15+ Studios</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>Architects &amp; Designers</span>
                            </motion.div>
                        </div>

                        {/* 4:5 video — desktop only (placeholder until real clip provided) */}
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="hidden lg:block pl-8 shrink-0">
                            <div className="w-48 xl:w-56 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]"
                                style={{ aspectRatio: '4/5' }}>
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4 text-white/30 rotate-90" />
                                    </div>
                                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-white/20">Video placeholder</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </section>

            {/* ── VSL ────────────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
                    <FadeIn className="text-center mb-10">
                        <MicroLabel center>AI For Architects And Designers</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.9rem,5.5vw,4rem)] leading-[0.93] mt-4 mb-4">
                            AI <span className="text-lime">REDEFINES</span> DESIGN.
                        </h2>
                        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                            Watch a complete AI design workflow from brief to final render.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a] aspect-video shadow-[0_0_80px_rgba(208,255,113,0.06)]">
                            <iframe
                                src={`https://player.vimeo.com/video/${VSL_VIDEO_ID}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── TESTIMONIALS ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#050505]">
                <div className="container mx-auto px-5 sm:px-6">

                    <FadeIn className="text-center mb-10 md:mb-14">
                        <MicroLabel center>Real People. Real Results.</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4 mb-3">
                            HEAR FROM OUR <span className="text-lime">GRADUATES.</span>
                        </h2>
                        <p className="text-gray-500 text-base mt-2">This could be you.</p>
                    </FadeIn>

                    {/* Testimonial mashup — 16:9 */}
                    <FadeIn delay={0.1} className="mb-12 max-w-4xl mx-auto">
                        <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black aspect-video shadow-[0_0_60px_rgba(208,255,113,0.05)]">
                            <iframe
                                src={`https://player.vimeo.com/video/${TESTIMONIAL_MASHUP_ID}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>

                    {/* Workshop ticker */}
                    <FadeIn delay={0.2}>
                        {/* Mobile: 1 at a time */}
                        <div className="sm:hidden">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600">Sprint Workshop Testimonials</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setMobileTickerIdx(p => (p - 1 + WORKSHOPS.length) % WORKSHOPS.length)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-[0.6875rem] text-gray-600 tabular-nums">{mobileTickerIdx + 1} / {WORKSHOPS.length}</span>
                                    <button onClick={() => setMobileTickerIdx(p => (p + 1) % WORKSHOPS.length)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div key={mobileTickerIdx}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-video">
                                    <iframe
                                        src={`https://player.vimeo.com/video/${WORKSHOPS[mobileTickerIdx].id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                    />
                                </motion.div>
                            </AnimatePresence>
                            <div className="flex items-center justify-center gap-1.5 mt-4">
                                {WORKSHOPS.map((_, i) => (
                                    <button key={i} onClick={() => setMobileTickerIdx(i)}
                                        className={`rounded-full transition-all duration-300 ${i === mobileTickerIdx ? 'w-5 h-1.5 bg-lime' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop: 3 at a time */}
                        <div className="hidden sm:block">
                            <div className="flex items-center justify-between mb-5">
                                <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600">Sprint Workshop Testimonials</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setTickerPage(p => (p - 1 + TICKER_TOTAL) % TICKER_TOTAL)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-[0.6875rem] text-gray-600 tabular-nums">{tickerPage + 1} / {TICKER_TOTAL}</span>
                                    <button onClick={() => setTickerPage(p => (p + 1) % TICKER_TOTAL)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <AnimatePresence mode="wait">
                                    {WORKSHOPS.slice(tickerPage * 3, tickerPage * 3 + 3).map((w, i) => (
                                        <motion.div key={`${tickerPage}-${i}`}
                                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-video hover:border-lime/20 transition-colors">
                                            <iframe
                                                src={`https://player.vimeo.com/video/${w.id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                                className="w-full h-full pointer-events-none"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 mt-5">
                                {Array.from({ length: TICKER_TOTAL }).map((_, i) => (
                                    <button key={i} onClick={() => setTickerPage(i)}
                                        className={`rounded-full transition-all duration-300 ${i === tickerPage ? 'w-5 h-1.5 bg-lime' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── CASE STUDIES ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>Transformations</MicroLabel>
                        <div className="flex flex-wrap items-end gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                BEFORE AND AFTER.
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">
                            Real participants. Real numbers. Real work. These are the transformations from going through our program.
                        </p>
                    </FadeIn>

                    <div className="space-y-3">
                        {CASE_STUDIES.map((cs, idx) => {
                            const isOpen = expandedCase === idx
                            const initials = cs.name.split(' ').map((n: string) => n[0]).join('')
                            return (
                                <FadeIn key={idx} delay={idx * 0.04}>
                                    <div className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${isOpen ? 'border-white/[0.1]' : 'border-white/[0.05] hover:border-white/[0.08]'}`}>

                                        {/* Collapsed header — always visible */}
                                        <button
                                            onClick={() => setExpandedCase(isOpen ? -1 : idx)}
                                            className="w-full flex items-center gap-4 px-5 sm:px-7 py-5 text-left"
                                        >
                                            {/* Profile picture placeholder */}
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                                                <span className="font-heading font-black text-lime text-sm">{initials}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-heading font-black uppercase text-base sm:text-lg text-white leading-tight">{cs.name}</p>
                                                <p className="text-sm text-gray-400 mt-0.5">{cs.role}</p>
                                                <p className="text-xs text-gray-600">{cs.location}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`hidden sm:block text-[0.6rem] font-bold uppercase tracking-[0.15em] transition-colors ${isOpen ? 'text-lime' : 'text-gray-600'}`}>
                                                    {isOpen ? 'Collapse' : 'See transformation'}
                                                </span>
                                                <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                                            </div>
                                        </button>

                                        {/* Expanded content */}
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-white/[0.06]">

                                                        {/* BEFORE */}
                                                        <div className="bg-[#0a0a0a] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
                                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[0.6rem] font-bold uppercase tracking-[0.18em] mb-4">
                                                                {cs.before.label}
                                                            </span>
                                                            <h3 className="font-heading font-black uppercase text-lg sm:text-xl text-white mb-5 leading-tight">
                                                                {cs.before.headline}
                                                            </h3>
                                                            <div className="space-y-3 mb-6">
                                                                {cs.before.points.map((pt, pi) => (
                                                                    <div key={pi} className="flex items-start gap-3">
                                                                        <pt.icon className="w-4 h-4 text-red-400/60 shrink-0 mt-0.5" />
                                                                        <p className="text-sm text-gray-500 leading-snug">{pt.text}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {cs.before.imgs.map((src, ii) => (
                                                                    <div key={ii} className="relative rounded-xl overflow-hidden aspect-square bg-white/5">
                                                                        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 contrast-75" />
                                                                        <div className="absolute inset-0 bg-red-950/30" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* AFTER */}
                                                        <div className="bg-[#080d05] p-6 sm:p-8">
                                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-lime/10 border border-lime/20 text-lime text-[0.6rem] font-bold uppercase tracking-[0.18em] mb-4">
                                                                {cs.after.label}
                                                            </span>
                                                            <h3 className="font-heading font-black uppercase text-lg sm:text-xl text-white mb-5 leading-tight">
                                                                {cs.after.headline}
                                                            </h3>
                                                            <div className="space-y-3 mb-6">
                                                                {cs.after.points.map((pt, pi) => (
                                                                    <div key={pi} className="flex items-start gap-3">
                                                                        <pt.icon className="w-4 h-4 text-lime/70 shrink-0 mt-0.5" />
                                                                        <p className="text-sm text-gray-300 leading-snug">{pt.text}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {cs.after.imgs.map((src, ii) => (
                                                                    <div key={ii} className="relative rounded-xl overflow-hidden aspect-square bg-white/5">
                                                                        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </FadeIn>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── THE PROBLEM ────────────────────────────────────────── */}
            <section className="py-20 md:py-28 bg-black border-t border-white/[0.04]">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>We surveyed 1,000+ participants</MicroLabel>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">THE DATA DOESN'T LIE</h2>
                            <LimeBar />
                        </div>
                    </FadeIn>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                        {PROBLEM_STATS.map((stat, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="relative bg-[#0d0d0d] border border-white/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-8 overflow-hidden h-full flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="text-[clamp(1.8rem,4.5vw,3rem)] font-heading font-black text-red-400 leading-none">{stat.value}</div>
                                        <stat.Icon className="w-4 h-4 text-red-400/50 mt-1 shrink-0" />
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-4 flex-1">{stat.label}</p>
                                    {/* Visual bar — below the text */}
                                    <div className="flex items-end gap-0.5 h-8">
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
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ARCHIVED: THE PROCESS, GALLERY, FULL FILM, AI CAPABILITIES, SOCIAL PROOF */}
            {false && (<>
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
                                    Every frame. Every scene. Every visual. Produced entirely through AI directed workflows.
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
                        <MicroLabel>Studio Masterclasses</MicroLabel>
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.4rem,4vw,2.5rem)] leading-[0.95]">TRUSTED BY 15+ STUDIOS</h2>
                            <span className="px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime text-[0.6875rem] uppercase tracking-[0.15em] font-bold shrink-0">Growing</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">
                            3 firmwide masterclasses delivered. Every studio left with a certified AI workflow they own.
                        </p>
                    </FadeIn>

                    {/* Studios marquee */}
                    <FadeIn delay={0.05} className="mb-10">
                        <div className="overflow-hidden border-t border-b border-white/[0.04] py-3.5">
                            <div className="flex gap-8 marquee-track whitespace-nowrap">
                                {[...STUDIOS, ...STUDIOS].map((s, i) => (
                                    <span key={i} className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600 inline-flex items-center gap-8">
                                        {s}<span className="text-lime/30">·</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    {/* Masterclass video player */}
                    <FadeIn delay={0.1}>
                        <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-video mb-4">
                            <iframe
                                key={`master-${activeMasterVideo}`}
                                src={`https://player.vimeo.com/video/${MASTERCLASS_VIDEOS[activeMasterVideo].id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>

                    {/* Masterclass selector */}
                    <FadeIn delay={0.15}>
                        <div className="flex flex-wrap gap-2">
                            {MASTERCLASS_VIDEOS.map((w, i) => (
                                <button
                                    key={w.num}
                                    onClick={() => setActiveMasterVideo(i)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${i === activeMasterVideo ? 'bg-lime/10 border-lime/40 text-lime' : 'border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-gray-300'}`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </FadeIn>

                </div>
            </section>
            </>)}

            {/* ── CTA / PRICING ──────────────────────────────────────── */}
            <section id="sprint" className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16 text-center">
                        <MicroLabel center>You've seen the results. Now take action.</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            HOW TO <span className="text-lime">GET STARTED.</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-4 max-w-md mx-auto">
                            Choose the right program for where you are. Both get you to the same result — faster design, better output, real results.
                        </p>
                    </FadeIn>

                    <div id="masterclass" className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 max-w-5xl mx-auto">

                        {/* Masterclass — LEFT, featured */}
                        <FadeIn direction="left" className="flex">
                            <motion.div whileHover={{ y: -4 }}
                                className="relative rounded-2xl sm:rounded-3xl border border-lime/25 bg-gradient-to-br from-lime/[0.05] to-transparent p-7 sm:p-10 flex flex-col w-full"
                                style={{ boxShadow: '0 0 50px -15px rgba(208,255,113,0.12)' }}>
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime/80">AI Masterclass</span>
                                            <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-lime/20 text-lime px-2 py-0.5 rounded">For Studios</span>
                                        </div>
                                        <h3 className="font-heading font-black uppercase text-xl sm:text-2xl text-white leading-tight">Transform Your<br />Entire Firm.</h3>
                                    </div>
                                    <div className="w-11 h-11 rounded-full bg-lime/20 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-lime" />
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                                    A comprehensive AI system rollout built for your studio. Custom curriculum, team-wide training, and a certified AI workflow your firm owns permanently.
                                </p>
                                <div className="space-y-2.5 mb-6">
                                    {['Team of 3 to 12 designers', 'Custom AI workflow built for your studio', 'Live sessions + async work', 'Readiness certification for every team member'].map(f => (
                                        <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />{f}
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/[0.06] pt-5 mb-6">
                                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-gray-600 mb-3">Studios already in</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {STUDIOS.slice(0, 8).map((s, i) => (
                                            <span key={i} className="text-[0.6rem] px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-gray-500">{s}</span>
                                        ))}
                                        <span className="text-[0.6rem] px-2.5 py-1 bg-lime/[0.06] border border-lime/15 rounded-lg text-lime/60">+{STUDIOS.length - 8} more</span>
                                    </div>
                                </div>
                                <a href="/submit-form"
                                    className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:opacity-90 transition">
                                    Book Studio Discovery <ArrowRight className="w-4 h-4" />
                                </a>
                            </motion.div>
                        </FadeIn>

                        {/* Sprint — RIGHT */}
                        <FadeIn direction="right" className="flex">
                            <motion.div whileHover={{ y: -4 }}
                                className="relative bg-[#0d0d0d] border border-white/[0.06] hover:border-white/20 rounded-2xl sm:rounded-3xl p-7 sm:p-10 flex flex-col transition-colors duration-300 w-full">
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-gray-400">Sprint Workshop</span>
                                            <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-white/10 text-gray-400 px-2 py-0.5 rounded">For Individuals</span>
                                        </div>
                                        <h3 className="font-heading font-black uppercase text-xl sm:text-2xl text-white leading-tight">Go From Zero<br />to AI-Fluent.</h3>
                                    </div>
                                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                {/* Urgency badge */}
                                <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] w-fit">
                                    <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse shrink-0" />
                                    <span className="text-[0.6rem] font-bold uppercase tracking-wider text-lime">Next: May 13–15, 2026 · Limited Spots</span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                                    3 days. Hands on. Output focused. You leave with real AI generated deliverables and the skills to keep going. Open to architects and designers worldwide.
                                </p>
                                <div className="space-y-2.5 mb-6">
                                    {SPRINT_FEATURES.map(f => (
                                        <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />{f}
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/[0.06] pt-5 mb-6">
                                    <div className="grid grid-cols-3 gap-3">
                                        {[{ val: '50+', label: 'Master Classes' }, { val: '1000+', label: 'Participants' }, { val: 'Global', label: 'Access' }].map(s => (
                                            <div key={s.label} className="text-center">
                                                <div className="text-lg font-heading font-black text-white">{s.val}</div>
                                                <div className="text-[0.6rem] uppercase tracking-wider text-gray-600 mt-0.5">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <a href="/submit-form"
                                    className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-white text-black font-body font-bold uppercase tracking-wider text-sm hover:bg-lime transition-colors duration-300">
                                    Apply for Sprint <ArrowRight className="w-4 h-4" />
                                </a>
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
