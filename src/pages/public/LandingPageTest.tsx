import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Eye, ArrowRight, Brain, Layers, Sparkles, Users, Building2, ChevronRight } from 'lucide-react'
import logoSrc from '../../assets/logo.png'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROBLEM_STATS = [
    { value: '78%',   label: 'struggle controlling AI output' },
    { value: '2.5/5', label: 'average confidence across 73 designers' },
    { value: '71%',   label: 'report inconsistent output quality' },
    { value: '0',     label: 'studios with formal AI guidelines' },
]

const JOURNEY_STEPS = [
    { num: '01', label: 'BLANK SITE',     img: '/lander/16.png', caption: 'Empty desert. Just a boundary.' },
    { num: '02', label: 'THE SKETCH',     img: '/lander/2.png',  caption: "A rough concept. AI's first input." },
    { num: '03', label: 'THE ANALYSIS',   img: '/lander/3.png',  caption: 'AI maps every element of the site.' },
    { num: '04', label: 'THE VISION',     img: '/lander/15.png', caption: 'Full photorealistic render. AI-generated.' },
    { num: '05', label: 'THE BUILD',      img: '/lander/9.png',  caption: 'Construction begins. Every layer predicted.' },
    { num: '06', label: 'THE EXPERIENCE', img: '/lander/1.png',  caption: 'The crowd. The energy. AI imagined this.' },
]

// Smart editorial grid — each entry carries its own Tailwind span classes
const GALLERY_ITEMS = [
    { label: 'Night Render',  img: '/lander/24.png', cls: 'col-span-2 row-span-2' },
    { label: 'Detail',        img: '/lander/8.png',  cls: 'col-span-1 row-span-1' },
    { label: 'Atmosphere',    img: '/lander/10.png', cls: 'col-span-1 row-span-1' },
    { label: 'Interior',      img: '/lander/11.png', cls: 'col-span-1 row-span-2' },
    { label: 'Section Cut',   img: '/lander/13.png', cls: 'col-span-1 row-span-1' },
    { label: 'Exterior',      img: '/lander/15.png', cls: 'col-span-2 row-span-1' },
    { label: 'Sketch',        img: '/lander/2.png',  cls: 'col-span-1 row-span-1' },
    { label: 'Crowd',         img: '/lander/1.png',  cls: 'col-span-1 row-span-1' },
    { label: 'Urban Plan',    img: '/lander/19.png', cls: 'col-span-1 row-span-1' },
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

const STEPS = [
    { num: '01', Icon: Brain,    title: 'Learn the Tools',         copy: 'Master AI tools purpose-built for spatial design — Midjourney, ControlNet, Krea.ai — with structured workflows that produce consistent results every time.' },
    { num: '02', Icon: Layers,   title: 'Build a Workflow',        copy: 'Install a repeatable system: from client brief to moodboard to final render, every step guided by proven prompting frameworks and templates.' },
    { num: '03', Icon: Sparkles, title: 'Deliver Client-Ready Work', copy: "Output professional-grade visuals that match your studio's standards — not random AI experiments. On time, every time." },
]

const SPRINT_FEATURES     = ['3-Day Intensive', '2 Hours per day', 'Concept creation & ideation', 'Prompting frameworks included']
const MASTERCLASS_FEATURES = ['End-to-end curriculum', 'Custom dashboard & analytics', 'Team readiness certification', 'Advanced render workflows']

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPageTest() {
    const heroRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-lime/30">
            <GrainOverlay />

            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none z-0"
                style={{ background: 'radial-gradient(circle, rgba(208,255,113,0.09) 0%, transparent 70%)', filter: 'blur(100px)', animation: 'orbDrift 22s ease-in-out infinite' }} />

            <style>{`
                @keyframes orbDrift {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33%     { transform: translate(60px,-40px) scale(1.05); }
                    66%     { transform: translate(-30px,30px) scale(0.97); }
                }
                @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
                .marquee-track { animation: marquee 30s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
            `}</style>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
                <motion.div style={{ y: heroBgY }} className="absolute inset-0 z-0">
                    <img src="/lander/4.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                </motion.div>

                <div className="relative z-10 container mx-auto px-5 sm:px-6 py-24 sm:py-32">
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
                                    <div className="text-2xl font-heading font-black text-lime">{s.value}</div>
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
                        <MicroLabel center>Skidmore Owings &amp; Merrill × Zkandar AI</MicroLabel>
                    </FadeIn>
                    <FadeIn direction="up" delay={0.2}>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.9rem,5.5vw,4.5rem)] leading-[0.93] mt-8 mb-8">
                            HOW IS AI <span className="text-lime">REDEFINING</span><br className="hidden sm:block" />
                            {' '}THE DESIGN PROCESS?
                        </h2>
                    </FadeIn>
                    <FadeIn direction="up" delay={0.4}>
                        <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            We worked with one of the world's top architecture firms to find out.<br className="hidden sm:block" />
                            The answer is on this page.
                        </p>
                    </FadeIn>
                    <FadeIn direction="up" delay={0.6}>
                        <div className="mt-10 flex items-center justify-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                            <span className="text-[0.6875rem] uppercase tracking-[0.25em] text-gray-600">Scroll to see the project</span>
                        </div>
                    </FadeIn>
                </div>

                <div className="absolute bottom-6 left-6">
                    <MicroLabel>+ ZKANDAR AI +</MicroLabel>
                </div>
            </section>

            {/* ── THE PROBLEM ────────────────────────────────────────── */}
            <section className="py-20 md:py-28 relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg,white,white 1px,transparent 1px,transparent 60px)' }} />
                <div className="container mx-auto px-5 sm:px-6 relative z-10">
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
                                <motion.div whileHover={{ scale: 1.02, y: -4 }}
                                    className="relative bg-bg-card border border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 overflow-hidden group hover:border-lime/30 transition-colors duration-300">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                        style={{ background: 'radial-gradient(circle at 50% 0%,rgba(208,255,113,0.07) 0%,transparent 70%)', filter: 'blur(16px)' }} />
                                    <div className="relative z-10">
                                        <div className="text-[clamp(2rem,5vw,3.5rem)] font-heading font-black text-lime leading-none mb-2 sm:mb-3">{stat.value}</div>
                                        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{stat.label}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── THE JOURNEY ────────────────────────────────────────── */}
            <section className="py-20 md:py-28 bg-bg-elevated border-y border-white/5">
                <div className="container mx-auto px-5 sm:px-6 mb-10 md:mb-14">
                    <FadeIn>
                        <MicroLabel>The Process</MicroLabel>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                FROM BLANK LAND<br className="sm:hidden" /> TO FINISHED VISION
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-md">AI touched every step. This is what it looked like.</p>
                    </FadeIn>
                </div>

                {/* ── Desktop: horizontal scroll with arrows ── */}
                <div className="hidden md:flex items-stretch gap-0 overflow-x-auto no-scrollbar px-6"
                    style={{ paddingLeft: 'max(24px, calc((100vw - 1280px)/2 + 24px))' }}>
                    {JOURNEY_STEPS.map((step, i) => (
                        <div key={i} className="flex items-center gap-0 shrink-0">
                            <FadeIn delay={i * 0.07} className="w-64 xl:w-72">
                                <motion.div whileHover={{ y: -6 }} className="relative group cursor-default">
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="text-[0.625rem] font-heading font-black uppercase tracking-widest text-white/70 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">
                                            {step.num}
                                        </span>
                                    </div>
                                    <div className="relative h-48 rounded-2xl overflow-hidden border border-white/5 group-hover:border-lime/30 transition-all duration-300">
                                        <img src={step.img} alt={step.label}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                    </div>
                                    <div className="mt-3 px-1">
                                        <p className="text-[0.7rem] font-heading font-black uppercase tracking-[0.18em] text-lime">{step.label}</p>
                                        <p className="text-[0.7rem] text-gray-600 mt-0.5 leading-snug">{step.caption}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>

                            {/* Arrow between steps */}
                            {i < JOURNEY_STEPS.length - 1 && (
                                <div className="flex flex-col items-center justify-center px-3 xl:px-4 self-start mt-20">
                                    <ChevronRight className="w-5 h-5 text-lime/40" />
                                </div>
                            )}
                        </div>
                    ))}
                    {/* right padding spacer */}
                    <div className="shrink-0 w-6" />
                </div>

                {/* ── Mobile: 2-col grid with down arrows ── */}
                <div className="md:hidden px-5 space-y-3">
                    {JOURNEY_STEPS.map((step, i) => (
                        <div key={i}>
                            <FadeIn delay={i * 0.06}>
                                <div className="relative group flex gap-4 items-center">
                                    {/* Step number pill */}
                                    <div className="shrink-0 w-10 h-10 rounded-full border border-lime/30 bg-lime/5 flex items-center justify-center">
                                        <span className="text-[0.6rem] font-heading font-black text-lime">{step.num}</span>
                                    </div>
                                    {/* Image + text */}
                                    <div className="flex-1 flex gap-3 items-center">
                                        <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-white/5 shrink-0">
                                            <img src={step.img} alt={step.label} className="absolute inset-0 w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-[0.65rem] font-heading font-black uppercase tracking-wider text-lime leading-tight">{step.label}</p>
                                            <p className="text-[0.65rem] text-gray-600 mt-0.5 leading-snug">{step.caption}</p>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                            {/* Down connector */}
                            {i < JOURNEY_STEPS.length - 1 && (
                                <div className="flex items-center pl-5 py-1">
                                    <div className="w-px h-4 bg-lime/20 ml-4" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── GALLERY ────────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-b border-white/5">
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
                            The colosseum doesn't exist. AI built it from a sketch. This is the output level you'll reach.
                        </p>
                    </FadeIn>

                    {/* Desktop editorial grid */}
                    <div className="hidden sm:grid grid-cols-4 auto-rows-[180px] md:auto-rows-[210px] gap-3 md:gap-4">
                        {GALLERY_ITEMS.map((item, i) => (
                            <FadeIn key={i} delay={i * 0.04} className={item.cls}>
                                <motion.div whileHover={{ scale: 1.015 }}
                                    className="relative rounded-2xl border border-white/5 hover:border-lime/20 overflow-hidden group cursor-pointer h-full transition-colors duration-300">
                                    <img src={item.img} alt={item.label}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                                        <Eye className="w-4 h-4 text-white" />
                                        <span className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-200">{item.label}</span>
                                    </div>
                                    <div className="absolute bottom-2.5 left-3">
                                        <span className="text-[0.6rem] uppercase tracking-wider text-white/30">{item.label}</span>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Mobile: simple 2-col grid, no spans */}
                    <div className="sm:hidden grid grid-cols-2 gap-3">
                        {GALLERY_ITEMS.map((item, i) => (
                            <FadeIn key={i} delay={i * 0.04}>
                                <div className="relative h-36 rounded-xl border border-white/5 overflow-hidden">
                                    <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute bottom-2 left-2.5">
                                        <span className="text-[0.55rem] uppercase tracking-wider text-white/50">{item.label}</span>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 5 AI CAPABILITIES ──────────────────────────────────── */}
            <section className="py-20 md:py-28 bg-bg-elevated border-y border-white/5 relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg,white,white 1px,transparent 1px,transparent 60px)' }} />
                <div className="container mx-auto px-5 sm:px-6 relative z-10">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>What AI Can Do</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            5 THINGS AI MADE POSSIBLE<br />
                            <span className="text-lime">ON THIS PROJECT</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">We teach each of these in the Sprint Workshop and Masterclass.</p>
                    </FadeIn>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {CAPABILITIES.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.08}
                                className={i === 3 ? 'sm:col-span-1 lg:col-span-1' : i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                                <motion.div whileHover={{ y: -5 }}
                                    className="relative bg-bg-card border border-white/5 hover:border-lime/25 rounded-2xl sm:rounded-3xl overflow-hidden group h-full transition-colors duration-300">
                                    <div className="relative h-44 sm:h-48 overflow-hidden">
                                        <img src={cap.img} alt={cap.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/30 to-transparent" />
                                        <div className="absolute top-3 right-3">
                                            <span className="text-[0.625rem] font-heading font-black text-lime bg-black/60 backdrop-blur-sm border border-lime/20 px-2 py-1 rounded-lg tracking-wider">
                                                {cap.num}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 sm:p-5">
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
            <section className="py-20 md:py-28">
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
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 bg-bg-card border border-white/5 hover:border-lime/20 rounded-xl sm:rounded-2xl text-center transition-colors duration-300">
                                    <span className="text-xs text-gray-400">{s}</span>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                    <div className="overflow-hidden border-t border-b border-white/5 py-3.5">
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

            {/* ── THE SOLUTION ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 bg-bg-elevated border-y border-white/5 relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg,white,white 1px,transparent 1px,transparent 60px)' }} />
                <div className="container mx-auto px-5 sm:px-6 relative z-10">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>The Framework</MicroLabel>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">FROM CHAOS TO SYSTEM</h2>
                            <LimeBar />
                        </div>
                    </FadeIn>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                        {STEPS.map((step, i) => (
                            <FadeIn key={i} delay={i * 0.15}>
                                <motion.div whileHover={{ scale: 1.02, y: -4 }}
                                    className="relative bg-bg-card border border-white/5 hover:border-lime/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden group h-full transition-colors duration-300">
                                    <div className="absolute top-4 right-5 font-heading font-black text-[5rem] sm:text-[6rem] text-lime/8 leading-none select-none pointer-events-none">{step.num}</div>
                                    <div className="relative z-10">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-lime/10 flex items-center justify-center text-lime mb-5 sm:mb-6">
                                            <step.Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <h3 className="font-heading font-black uppercase text-base sm:text-xl mb-3">{step.title}</h3>
                                        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{step.copy}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA / PRICING ──────────────────────────────────────── */}
            <section id="sprint" className="py-20 md:py-28">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16 text-center">
                        <MicroLabel center>Choose Your Path</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">WHERE DO YOU START?</h2>
                    </FadeIn>

                    <div id="masterclass" className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 max-w-5xl mx-auto">
                        {/* Sprint */}
                        <FadeIn direction="left" className="flex">
                            <motion.div whileHover={{ scale: 1.01, y: -4 }}
                                className="relative bg-bg-card border border-white/5 hover:border-white/20 rounded-2xl sm:rounded-3xl p-7 sm:p-10 flex flex-col overflow-hidden group transition-colors duration-300 w-full">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/5 to-transparent transition-opacity duration-500 pointer-events-none" />
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
                                className="relative bg-bg-card border border-lime/30 rounded-2xl sm:rounded-3xl p-7 sm:p-10 flex flex-col overflow-hidden group w-full"
                                style={{ boxShadow: '0 0 40px -10px rgba(208,255,113,0.15)' }}>
                                <div className="absolute inset-0 bg-gradient-to-br from-lime/10 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-10 w-px h-24 bg-gradient-to-b from-lime to-transparent pointer-events-none" />
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
            <footer className="py-7 border-t border-white/5">
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
