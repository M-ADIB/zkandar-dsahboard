import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAnimatedNumber(end: number, duration = 1400, inView = false, decimals = 0) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        if (!inView) return
        let start = 0
        const startTime = performance.now()
        const step = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3) // cubic ease-out
            start = easeOut * end
            setValue(parseFloat(start.toFixed(decimals)))
            if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
    }, [end, duration, inView, decimals])
    return value
}

// ─── Section wrapper with scroll reveal ───────────────────────────────────────

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-60px' })
    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.section>
    )
}

// ─── Animated stat pill ───────────────────────────────────────────────────────

function StatPill({ value, label, decimals = 0, suffix = '' }: { value: number; label: string; decimals?: number; suffix?: string }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(value, 1200, inView, decimals)
    return (
        <div ref={ref} className="flex flex-col items-center gap-2 px-6 py-4 bg-bg-card border border-border rounded-2xl min-w-[140px] group hover:border-lime/30 hover:shadow-glow transition-all duration-300">
            <span className="text-3xl md:text-4xl font-heading font-black text-lime tabular-nums">
                {animated}{suffix}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-body">{label}</span>
        </div>
    )
}

// ─── Animated horizontal bar ──────────────────────────────────────────────────

function AnimatedBar({
    label, pct, color = '#D0FF71', delay = 0
}: {
    label: string; pct: number; color?: string; delay?: number
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-30px' })
    return (
        <div ref={ref} className="space-y-1.5">
            <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-300 font-body">{label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${pct}%` } : {}}
                    transition={{ duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
            </div>
        </div>
    )
}

// ─── Stacked bar (Section 2) ──────────────────────────────────────────────────

function StackedBar({ segments }: { segments: { label: string; pct: number; color: string }[] }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    return (
        <div ref={ref} className="space-y-4">
            <div className="h-6 rounded-full bg-white/5 overflow-hidden flex">
                {segments.map((seg, i) => (
                    <motion.div
                        key={seg.label}
                        className="h-full first:rounded-l-full last:rounded-r-full relative group"
                        style={{ backgroundColor: seg.color }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${seg.pct}%` } : {}}
                        transition={{ duration: 0.8, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                        title={`${seg.label} — ${seg.pct}%`}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-4">
                {segments.map(seg => (
                    <div key={seg.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs text-gray-400 font-body">{seg.label} — {seg.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Score callout ────────────────────────────────────────────────────────────

function ScoreCallout({ score, total, label }: { score: number; total: number; label: string }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(score, 1200, inView, 1)
    return (
        <div ref={ref} className="flex flex-col items-center gap-2 p-6 bg-bg-card border border-border rounded-2xl group hover:border-lime/30 hover:shadow-glow transition-all duration-300">
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-heading font-black text-lime tabular-nums">{animated}</span>
                <span className="text-lg text-gray-500 font-heading">/ {total}</span>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-widest text-center font-body">{label}</span>
        </div>
    )
}

// ─── Impact card with dot indicator ───────────────────────────────────────────

function ImpactCard({ label, score }: { label: string; score: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(score, 1000, inView, 1)
    const filledDots = Math.round(score)
    return (
        <div ref={ref} className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 group hover:border-lime/30 hover:shadow-glow transition-all duration-300">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-body">{label}</span>
            <span className="text-3xl font-heading font-black text-white tabular-nums">{animated}<span className="text-sm text-gray-500 ml-1">/ 5</span></span>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(dot => (
                    <div
                        key={dot}
                        className={`w-3 h-3 rounded-full transition-colors duration-500 ${dot <= filledDots ? 'bg-lime' : 'bg-white/10'}`}
                    />
                ))}
            </div>
        </div>
    )
}

// ─── Ranked list item ─────────────────────────────────────────────────────────

function RankedItem({ rank, label, pct }: { rank: number; label: string; pct: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: rank * 0.08, duration: 0.5 }}
            className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
        >
            <span className="text-xs font-bold text-lime bg-lime/10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">{rank}</span>
            <span className="text-sm text-gray-300 flex-1 font-body">{label}</span>
            <span className="text-sm font-bold text-white tabular-nums">{pct}%</span>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function WorkflowsPage() {
    return (
        <div className="min-h-screen bg-bg-primary text-white font-body">
            <div className="max-w-[960px] mx-auto px-6 py-16 md:py-24 space-y-24">

                {/* ─── SECTION 1: Hero ──────────────────────────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-lime font-body">Industry Data</span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black leading-[1.05] tracking-tight text-white">
                            Design studios are experimenting{' '}
                            <br className="hidden md:block" />
                            with AI.{' '}
                            <span className="text-gray-500">Very few are using it.</span>
                        </h1>
                        <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed font-body">
                            Real data from 45 designers across 3 studios shows where the gap is — and what teams actually need.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <StatPill value={45} label="Designers surveyed" />
                            <StatPill value={3} label="Studios" />
                            <StatPill value={62} label="Only experimenting" suffix="%" />
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 2: Where Teams Are Right Now ─────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight">Where teams are right now</h2>

                        <StackedBar segments={[
                            { label: 'Not using AI at all', pct: 16, color: '#555555' },
                            { label: 'Occasionally experimenting', pct: 62, color: '#D0FF71' },
                            { label: 'Regularly for internal work', pct: 13, color: '#75C345' },
                            { label: 'Regularly for client-facing', pct: 9, color: '#5A9F2E' },
                        ]} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ScoreCallout score={2.7} total={5} label="Average team confidence in AI workflow" />
                            <ScoreCallout score={2.4} total={5} label="Average self-rated skill level" />
                        </div>

                        <p className="text-sm text-gray-500 italic border-l-2 border-lime/30 pl-4 font-body">
                            "78% of designers are either not using AI or only experimenting — with no structured workflow in place."
                        </p>
                    </div>
                </Section>

                {/* ─── SECTION 3: What Teams Are Struggling With ────────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight">What teams are struggling with</h2>

                        <div className="space-y-4 bg-bg-card border border-border rounded-2xl p-6">
                            <AnimatedBar label="Controlling style & consistency" pct={44} delay={0} />
                            <AnimatedBar label="Getting strong concept ideas" pct={40} delay={0.1} />
                            <AnimatedBar label="Translating AI into real design work" pct={33} delay={0.2} />
                            <AnimatedBar label="Creating mood / storytelling visuals" pct={22} delay={0.3} />
                            <AnimatedBar label="Iterating efficiently" pct={18} delay={0.4} />
                        </div>

                        <CalloutCard number={67} text={`of designers say "difficulty controlling results" is their primary concern.`} />
                    </div>
                </Section>

                {/* ─── SECTION 4: What Teams Actually Want ──────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight">What teams actually want</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Team goals */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 font-heading">Team goals</h3>
                                <RankedItem rank={1} label="Gain more control over AI results" pct={69} />
                                <RankedItem rank={2} label="Learn structured AI workflows" pct={33} />
                                <RankedItem rank={3} label="Generate concepts faster" pct={33} />
                                <RankedItem rank={4} label="Improve visual quality" pct={27} />
                                <RankedItem rank={5} label="Build confidence using AI tools" pct={16} />
                            </div>

                            {/* Right: What would help most */}
                            <div className="space-y-4">
                                <BigStatCard value={42} label="Better prompting techniques" />
                                <BigStatCard value={36} label="Refining & controlling results" />
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 italic border-l-2 border-lime/30 pl-4 font-body">
                            "Teams don't need more tools. They need a framework."
                        </p>
                    </div>
                </Section>

                {/* ─── SECTION 5: What Leadership Sees ──────────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight">What leadership sees</h2>
                            <p className="text-sm text-gray-500 mt-2 font-body">Data from 10 studio directors, heads of design, and partners</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Opportunities */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-heading">Opportunities</h3>
                                <AnimatedBar label="Better use of team time" pct={60} color="#D0FF71" delay={0} />
                                <AnimatedBar label="Faster concept development" pct={60} color="#D0FF71" delay={0.1} />
                                <AnimatedBar label="Greater design consistency" pct={30} color="#D0FF71" delay={0.2} />
                                <AnimatedBar label="Competitive differentiation" pct={20} color="#D0FF71" delay={0.3} />
                            </div>

                            {/* Risks */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-heading">Risks</h3>
                                <AnimatedBar label="Client perception / trust" pct={50} color="#F87171" delay={0} />
                                <AnimatedBar label="Inconsistent output quality" pct={50} color="#F87171" delay={0.1} />
                                <AnimatedBar label="Lack of clear guidelines" pct={40} color="#F87171" delay={0.2} />
                                <AnimatedBar label="Brand or design misalignment" pct={20} color="#F87171" delay={0.3} />
                            </div>
                        </div>

                        {/* Impact ratings */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <ImpactCard label="Speed" score={4.2} />
                            <ImpactCard label="Efficiency" score={4.0} />
                            <ImpactCard label="Quality" score={3.9} />
                            <ImpactCard label="Client Satisfaction" score={3.9} />
                            <ImpactCard label="Competitive Advantage" score={4.2} />
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 6: What Leadership Wants to Achieve ──────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight">What leadership is trying to achieve</h2>

                        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                            <AnimatedBar label="Improve output quality & consistency" pct={60} delay={0} />
                            <AnimatedBar label="Establish clear AI workflows" pct={50} delay={0.1} />
                            <AnimatedBar label="Upskill teams efficiently" pct={40} delay={0.2} />
                            <AnimatedBar label="Enable safe client-facing AI use" pct={30} delay={0.3} />
                        </div>

                        {/* Full-width callout block */}
                        <div className="bg-bg-card border-l-4 border-lime rounded-2xl p-8">
                            <h3 className="text-xl font-heading font-black text-white mb-3">
                                The gap is not tool access. It's workflow structure.
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed font-body">
                                Leadership sees the opportunity. Teams feel the friction. The missing piece is a clear, repeatable system — built for how design studios actually work.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 7: CTA ───────────────────────────────────────── */}
                <Section className="text-center pb-12">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tight">
                            This is what Zkandar AI is built for.
                        </h2>
                        <p className="text-gray-400 text-base font-body">
                            Structured AI workflows for architecture and design studios.
                        </p>
                        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
                            <Link
                                to="/programs"
                                className="px-8 py-3.5 bg-lime text-black font-bold rounded-xl hover:bg-lime-400 transition-colors text-sm uppercase tracking-wider"
                            >
                                View Programs
                            </Link>
                            <a
                                href="#"
                                className="px-8 py-3.5 border border-white/15 text-white font-bold rounded-xl hover:border-lime/40 hover:text-lime transition-colors text-sm uppercase tracking-wider"
                            >
                                Talk to Us
                            </a>
                        </div>
                    </div>
                </Section>

            </div>
        </div>
    )
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function CalloutCard({ number, text }: { number: number; text: string }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(number, 1200, inView)
    return (
        <div
            ref={ref}
            className="bg-bg-card border-l-4 border-lime rounded-2xl p-6 flex items-start gap-4"
        >
            <motion.span
                className="text-4xl font-heading font-black text-lime tabular-nums shrink-0"
                animate={inView ? { textShadow: ['0 0 0px #D0FF71', '0 0 20px #D0FF71', '0 0 0px #D0FF71'] } : {}}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
                {animated}%
            </motion.span>
            <span className="text-sm text-gray-400 leading-relaxed pt-2 font-body">{text}</span>
        </div>
    )
}

function BigStatCard({ value, label }: { value: number; label: string }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(value, 1200, inView)
    return (
        <div ref={ref} className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col gap-2 group hover:border-lime/30 hover:shadow-glow transition-all duration-300">
            <span className="text-4xl font-heading font-black text-lime tabular-nums">{animated}%</span>
            <span className="text-sm text-gray-400 font-body">{label}</span>
        </div>
    )
}
