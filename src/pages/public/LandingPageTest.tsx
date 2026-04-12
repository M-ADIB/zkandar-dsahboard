import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
    Eye, ArrowRight, Brain, Layers, Sparkles,
    Users, Building2
} from 'lucide-react'
import logoSrc from '../../assets/logo.png'

// ─── Survey / copy data ───────────────────────────────────────────────────────

const PROBLEM_STATS = [
    { value: '78%', label: 'struggle with controlling AI results' },
    { value: '2.5/5', label: 'average confidence score across 73 designers' },
    { value: '71%', label: 'report inconsistent output quality' },
    { value: '0', label: 'studios have formal AI guidelines in place' },
]

const STUDIOS = [
    'FORM Studio', 'Atelier Haus', 'Studio Collective', 'Arc & Co.',
    'Design Meridian', 'Whitespace Lab', 'Grid Atelier', 'The Spatial Co.',
    'Studio Mira', 'Blank Canvas', 'Forma Group', 'Norte Studio',
    'Eleven Architecture', 'Archway', 'Blueprint Studio', 'Render+',
]

const GALLERY_ITEMS = [
    { label: 'Residential', span: true },
    { label: 'Commercial', span: false },
    { label: 'Interior', span: false },
    { label: 'Facade', span: false },
    { label: 'Landscape', span: true },
    { label: 'Concept', span: false },
    { label: 'Urban', span: false },
    { label: 'Render', span: false },
]

const STEPS = [
    {
        num: '01',
        Icon: Brain,
        title: 'Learn the Tools',
        copy: 'Master AI tools purpose-built for spatial design — Midjourney, ControlNet, Krea.ai — with structured workflows that produce consistent results every time.',
    },
    {
        num: '02',
        Icon: Layers,
        title: 'Build a Workflow',
        copy: 'Install a repeatable system: from client brief to moodboard to final render, every step guided by proven prompting frameworks and templates.',
    },
    {
        num: '03',
        Icon: Sparkles,
        title: 'Deliver Client-Ready Work',
        copy: "Output professional-grade visuals that match your studio's standards — not random AI experiments. On time, every time.",
    },
]

const SPRINT_FEATURES = [
    '3-Day Intensive',
    '2 Hours per day',
    'Concept creation & ideation',
    'Prompting frameworks included',
]

const MASTERCLASS_FEATURES = [
    'End-to-end curriculum',
    'Custom dashboard & analytics',
    'Team readiness certification',
    'Advanced render workflows',
]

// ─── Animation helpers ────────────────────────────────────────────────────────

function FadeIn({
    children,
    direction = 'up',
    delay = 0,
    className = '',
}: {
    children: React.ReactNode
    direction?: 'up' | 'down' | 'left' | 'right'
    delay?: number
    className?: string
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })
    const initial: Record<'up' | 'down' | 'left' | 'right', { x: number; y: number }> = {
        up: { x: 0, y: 40 },
        down: { x: 0, y: -40 },
        left: { x: 40, y: 0 },
        right: { x: -40, y: 0 },
    }
    const { x, y } = initial[direction]
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x, y }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

function SplitText({
    text,
    className = '',
    baseDelay = 0,
}: {
    text: string
    className?: string
    baseDelay?: number
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    return (
        <span ref={ref} className={className}>
            {text.split(' ').map((word, i) => (
                <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: baseDelay + i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    {word}
                    {i < text.split(' ').length - 1 ? '\u00A0' : ''}
                </motion.span>
            ))}
        </span>
    )
}

// ─── Grain overlay (fixed, z-50, 3% opacity) ─────────────────────────────────

function GrainOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grain)" />
            </svg>
        </div>
    )
}

// ─── Micro-label ──────────────────────────────────────────────────────────────

function MicroLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">
            {children}
        </p>
    )
}

// ─── Lime accent bar ──────────────────────────────────────────────────────────

function LimeBar({ width = '4rem', height = '2px' }: { width?: string; height?: string }) {
    return (
        <motion.div
            initial={{ width: 0 }}
            whileInView={{ width }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-lime flex-shrink-0"
            style={{ height }}
        />
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LandingPageTest() {
    const heroRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    })
    const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-lime/30 selection:text-white">
            <GrainOverlay />

            {/* Gradient orb (drifts 20s) */}
            <div
                className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(208,255,113,0.12) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    animation: 'orbDrift 20s ease-in-out infinite',
                }}
            />

            {/* CSS keyframes */}
            <style>{`
                @keyframes orbDrift {
                    0%,100% { transform: translate(0,0); }
                    33%     { transform: translate(60px,-40px); }
                    66%     { transform: translate(-30px,30px); }
                }
                @keyframes marquee {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .marquee-track { animation: marquee 28s linear infinite; }
            `}</style>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 1 · HERO
            ═══════════════════════════════════════════════════════════════ */}
            <section
                ref={heroRef}
                className="relative min-h-screen flex flex-col justify-center overflow-hidden"
            >
                {/* Parallax background layer */}
                <motion.div style={{ y: heroBgY }} className="absolute inset-0 z-0">
                    {/* Faint logo watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
                        <img
                            src={logoSrc}
                            alt=""
                            className="w-[70%] max-w-[700px] grayscale object-contain"
                        />
                    </div>
                    {/* Directional gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                </motion.div>

                {/* Vertical accent line (desktop) */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-lime/15 to-transparent hidden lg:block pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 container mx-auto px-6 py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">

                        {/* ── Left: main content ─── */}
                        <div className="max-w-3xl">

                            {/* 3px lime bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '3rem' }}
                                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                                className="h-[3px] bg-lime mb-6"
                            />

                            {/* Micro-label */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-6"
                            >
                                AI FOR ARCHITECTS & DESIGNERS
                            </motion.p>

                            {/* Headline */}
                            <h1 className="font-heading font-black uppercase leading-[0.95] text-[clamp(3rem,8vw,5.5rem)] mb-6">
                                <span className="block text-white">
                                    <SplitText text="YOUR TEAM IS USING AI." baseDelay={0.1} />
                                </span>
                                <span className="block text-lime">
                                    <SplitText text="WITHOUT A SYSTEM." baseDelay={0.5} />
                                </span>
                            </h1>

                            {/* Subheadline */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.9 }}
                                className="text-base md:text-lg text-gray-400 font-body max-w-xl mb-10"
                            >
                                73 designers surveyed. The #1 problem? No control over results.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.1 }}
                                className="flex flex-wrap gap-4"
                            >
                                <a
                                    href="#sprint"
                                    className="px-8 py-4 bg-white text-black font-body font-bold uppercase tracking-wider rounded-full hover:bg-lime transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 text-sm"
                                >
                                    I'm an Individual <ArrowRight className="w-4 h-4" />
                                </a>
                                <a
                                    href="#masterclass"
                                    className="px-8 py-4 bg-transparent text-white font-body font-bold uppercase tracking-wider rounded-full border border-white/20 hover:border-lime/50 hover:text-lime transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 text-sm"
                                >
                                    I Lead a Team <ArrowRight className="w-4 h-4" />
                                </a>
                            </motion.div>

                            {/* Bottom info bar */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 1.4 }}
                                className="flex items-center gap-4 mt-12 text-[0.6875rem] text-gray-600 uppercase tracking-[0.15em]"
                            >
                                <span>73 Surveyed</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>15+ Studios</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>Architects & Designers</span>
                            </motion.div>
                        </div>

                        {/* ── Right: stat strip (desktop only) ─── */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.7 }}
                            className="hidden lg:flex flex-col gap-0 border-l border-white/10 pl-8"
                        >
                            {[
                                { value: '73', label: 'Surveyed' },
                                { value: '78%', label: 'Struggle' },
                                { value: '2.5/5', label: 'Confidence' },
                            ].map((stat, i) => (
                                <div key={i} className="py-5 border-b border-white/5 last:border-0">
                                    <div className="text-2xl font-heading font-black text-lime">{stat.value}</div>
                                    <div className="text-[0.6875rem] uppercase tracking-[0.15em] text-gray-600 mt-0.5">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 2 · THE PROBLEM
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32 relative">
                {/* Subtle line pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(0deg, white, white 1px, transparent 1px, transparent 60px)',
                    }}
                />

                <div className="container mx-auto px-6 relative z-10">
                    <FadeIn direction="up" className="mb-16">
                        <MicroLabel>Survey Results — 73 Respondents</MicroLabel>
                        <div className="flex items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]">
                                THE DATA DOESN'T LIE
                            </h2>
                            <LimeBar height="2px" width="4rem" />
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {PROBLEM_STATS.map((stat, i) => (
                            <FadeIn key={i} direction="up" delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="relative bg-bg-card border border-white/5 rounded-3xl p-6 md:p-8 overflow-hidden group cursor-default transition-all duration-300 hover:border-lime/30"
                                >
                                    {/* Card hover glow */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(208,255,113,0.07) 0%, transparent 70%)', filter: 'blur(16px)' }}
                                    />
                                    <div className="relative z-10">
                                        <div className="text-[clamp(2.5rem,5vw,3.5rem)] font-heading font-black text-lime leading-none mb-3">
                                            {stat.value}
                                        </div>
                                        <p className="text-sm text-gray-400 font-body leading-relaxed">
                                            {stat.label}
                                        </p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 3 · THE WORK (GALLERY)
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32 bg-bg-elevated border-y border-white/5">
                <div className="container mx-auto px-6">
                    <FadeIn direction="up" className="mb-16">
                        <MicroLabel>Output Gallery</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            THIS IS WHAT AI-DIRECTED<br />
                            DESIGN LOOKS LIKE.{' '}
                            <span className="text-lime">IT'S OUTPUT.</span>
                        </h2>
                    </FadeIn>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-[200px] gap-4">
                        {GALLERY_ITEMS.map((item, i) => (
                            <FadeIn
                                key={i}
                                direction="up"
                                delay={i * 0.05}
                                className={item.span ? 'row-span-2' : ''}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="relative rounded-3xl border border-white/5 hover:border-lime/20 overflow-hidden group cursor-pointer bg-bg-card h-full transition-colors duration-300"
                                >
                                    {/* Geometric decorations to suggest rendered output */}
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                        <div className="absolute top-4 left-4 w-14 h-14 border border-white/5 rounded-lg rotate-12" />
                                        <div
                                            className="absolute bottom-8 right-6 w-20 h-6 rounded-md"
                                            style={{ background: 'rgba(255,255,255,0.03)' }}
                                        />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-lime/8 rounded-full" />
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background:
                                                    'radial-gradient(circle at 30% 30%, rgba(208,255,113,0.03) 0%, transparent 60%)',
                                            }}
                                        />
                                    </div>

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                                            <Eye className="w-5 h-5 text-white" />
                                            <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-gray-300">
                                                {item.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Category label */}
                                    <div className="absolute bottom-3 left-4">
                                        <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-gray-700 font-body">
                                            {item.label}
                                        </span>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 4 · SOCIAL PROOF
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32">
                <div className="container mx-auto px-6">
                    <FadeIn direction="up" className="mb-12">
                        <div className="flex items-center gap-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.5rem)] leading-[0.95]">
                                TRUSTED BY 15+ STUDIOS
                            </h2>
                            <span className="px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime text-[0.6875rem] uppercase tracking-[0.15em] font-body font-bold shrink-0">
                                Growing
                            </span>
                        </div>
                    </FadeIn>

                    {/* Studio tag grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-12">
                        {STUDIOS.map((studio, i) => (
                            <FadeIn key={i} direction="up" delay={i * 0.03}>
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    className="px-4 py-3 bg-bg-card border border-white/5 hover:border-lime/20 rounded-2xl text-center transition-colors duration-300 cursor-default"
                                >
                                    <span className="text-xs text-gray-400 font-body">{studio}</span>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Infinite marquee */}
                    <div className="overflow-hidden border-t border-b border-white/5 py-4">
                        <div className="flex gap-8 marquee-track whitespace-nowrap">
                            {[...STUDIOS, ...STUDIOS].map((studio, i) => (
                                <span
                                    key={i}
                                    className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-700 font-body inline-flex items-center gap-8"
                                >
                                    {studio}
                                    <span className="text-lime/30">·</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 5 · THE SOLUTION
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32 bg-bg-elevated border-y border-white/5 relative">
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(0deg, white, white 1px, transparent 1px, transparent 60px)',
                    }}
                />
                <div className="container mx-auto px-6 relative z-10">
                    <FadeIn direction="up" className="mb-16">
                        <MicroLabel>The Framework</MicroLabel>
                        <div className="flex items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]">
                                FROM CHAOS TO SYSTEM
                            </h2>
                            <LimeBar height="2px" width="4rem" />
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {STEPS.map((step, i) => (
                            <FadeIn key={i} direction="up" delay={i * 0.15}>
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="relative bg-bg-card border border-white/5 hover:border-lime/30 rounded-3xl p-8 overflow-hidden group cursor-default transition-colors duration-300 h-full"
                                >
                                    {/* Step number watermark */}
                                    <div className="absolute top-4 right-6 font-heading font-black text-[6rem] text-lime/10 leading-none select-none pointer-events-none">
                                        {step.num}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-lime/10 flex items-center justify-center text-lime mb-6">
                                            <step.Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-heading font-black uppercase text-xl mb-3">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 font-body leading-relaxed">
                                            {step.copy}
                                        </p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 6 · CTA / PRICING
            ═══════════════════════════════════════════════════════════════ */}
            <section id="sprint" className="py-24 md:py-32">
                <div className="container mx-auto px-6">
                    <FadeIn direction="up" className="mb-16 text-center">
                        <MicroLabel>Choose Your Path</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            WHERE DO YOU START?
                        </h2>
                    </FadeIn>

                    <div id="masterclass" className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto items-stretch">

                        {/* Sprint Workshop */}
                        <FadeIn direction="left" className="flex">
                            <motion.div
                                whileHover={{ scale: 1.01, y: -4 }}
                                className="relative bg-bg-card border border-white/5 hover:border-white/20 rounded-3xl p-8 md:p-10 flex flex-col overflow-hidden group transition-colors duration-300 w-full"
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/5 to-transparent transition-opacity duration-500 pointer-events-none" />
                                <div className="relative z-10 flex flex-col flex-1">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <MicroLabel>Sprint Workshop</MicroLabel>
                                    <h3 className="font-heading font-black uppercase text-2xl mt-2 mb-4">
                                        For Individuals
                                    </h3>
                                    <p className="text-gray-400 font-body text-sm leading-relaxed mb-8 flex-1">
                                        A fast-paced, focused 3-day workshop to master AI ideation tools. Perfect for designers who want immediate workflow integration.
                                    </p>
                                    <ul className="space-y-3 mb-8">
                                        {SPRINT_FEATURES.map(feat => (
                                            <li key={feat} className="flex items-center gap-3 text-sm text-gray-300 font-body">
                                                <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <motion.a
                                        href="#"
                                        whileHover={{ scale: 1.02 }}
                                        className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-white text-black font-body font-bold uppercase tracking-wider text-sm hover:bg-lime transition-colors duration-300"
                                    >
                                        Apply for Sprint <ArrowRight className="w-4 h-4" />
                                    </motion.a>
                                </div>
                            </motion.div>
                        </FadeIn>

                        {/* "or" divider — mobile only */}
                        <div className="flex items-center justify-center gap-4 md:hidden">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-gray-600 font-body text-sm uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Exclusive Masterclass */}
                        <FadeIn direction="right" className="flex">
                            <motion.div
                                whileHover={{ scale: 1.01, y: -4 }}
                                className="relative bg-bg-card border border-lime/30 rounded-3xl p-8 md:p-10 flex flex-col overflow-hidden group w-full"
                                style={{ boxShadow: '0 0 40px -10px rgba(208,255,113,0.15)' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-lime/10 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-10 w-px h-24 bg-gradient-to-b from-lime to-transparent pointer-events-none" />
                                <div className="relative z-10 flex flex-col flex-1">
                                    <div className="w-12 h-12 rounded-full bg-lime/20 flex items-center justify-center mb-6">
                                        <Building2 className="w-6 h-6 text-lime" />
                                    </div>
                                    <MicroLabel>Exclusive Masterclass</MicroLabel>
                                    <h3 className="font-heading font-black uppercase text-2xl mt-2 mb-4">
                                        For Teams & Studios
                                    </h3>
                                    <p className="text-gray-400 font-body text-sm leading-relaxed mb-8 flex-1">
                                        A comprehensive AI system overhaul for your studio. Align firm standards with AI capabilities, track team progress, and certify readiness.
                                    </p>
                                    <ul className="space-y-3 mb-8">
                                        {MASTERCLASS_FEATURES.map(feat => (
                                            <li key={feat} className="flex items-center gap-3 text-sm text-gray-300 font-body">
                                                <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <motion.a
                                        href="#"
                                        whileHover={{ scale: 1.02 }}
                                        className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:bg-lime-400 transition-colors duration-300"
                                    >
                                        Book Team Discovery <ArrowRight className="w-4 h-4" />
                                    </motion.a>
                                </div>
                            </motion.div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 7 · FOOTER
            ═══════════════════════════════════════════════════════════════ */}
            <footer className="py-8 border-t border-white/5">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 opacity-50">
                        <img src={logoSrc} alt="Zkandar AI" className="h-7 object-contain grayscale" />
                        <span className="text-xs font-heading tracking-wider text-white">Zkandar AI</span>
                    </div>
                    <p className="text-[0.6875rem] text-gray-600 uppercase tracking-[0.15em] font-body">
                        © {new Date().getFullYear()} Zkandar AI
                    </p>
                </div>
            </footer>
        </div>
    )
}
