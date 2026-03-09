import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'
import { ProductivityCalculator } from '../../components/public/ProductivityCalculator'

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

function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.section>
    )
}

// ─── Animated stat pill ───────────────────────────────────────────────────────

function StatPill({ value, label, decimals = 0, suffix = '', delay = 0 }: { value: number; label: string; decimals?: number; suffix?: string; delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(value, 1200, inView, decimals)
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 px-8 py-5 bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl min-w-[150px] group hover:border-lime/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
        >
            <span className="text-3xl md:text-4xl font-heading font-black text-lime tabular-nums">
                {animated}{suffix}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-body">{label}</span>
        </motion.div>
    )
}

// ─── Animated horizontal bar ──────────────────────────────────────────────────

function AnimatedBar({
    label, sublabel, pct, color = '#D0FF71', delay = 0
}: {
    label: string; sublabel?: string; pct: number; color?: string; delay?: number
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-30px' })
    return (
        <div ref={ref} className="space-y-1.5">
            <div className="flex justify-between items-baseline gap-4">
                <div>
                    <span className="text-sm text-gray-300 font-body">{label}</span>
                    {sublabel && <span className="block text-xs text-gray-500 font-body mt-0.5">{sublabel}</span>}
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0" style={{ color }}>{pct}%</span>
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
                        title={`${seg.label}: ${seg.pct}%`}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-4">
                {segments.map(seg => (
                    <div key={seg.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs text-gray-400 font-body">{seg.label} {seg.pct}%</span>
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
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 p-6 bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl group hover:border-lime/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
        >
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-heading font-black text-lime tabular-nums">{animated}</span>
                <span className="text-lg text-gray-500 font-heading">/ {total}</span>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-widest text-center font-body">{label}</span>
        </motion.div>
    )
}

// ─── Impact card with dot indicator ───────────────────────────────────────────

function ImpactCard({ label, score }: { label: string; score: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(score, 1000, inView, 1)
    const filledDots = Math.round(score)
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 flex flex-col gap-3 group hover:border-lime/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
        >
            <span className="text-xs text-gray-500 uppercase tracking-widest font-body">{label}</span>
            <span className="text-3xl font-heading font-black text-white tabular-nums">{animated}<span className="text-sm text-gray-500 ml-1">/ 5</span></span>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(dot => (
                    <motion.div
                        key={dot}
                        initial={{ scale: 0 }}
                        animate={inView ? { scale: 1 } : {}}
                        transition={{ delay: dot * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-3 h-3 rounded-full ${dot <= filledDots ? 'bg-lime shadow-[0_0_6px_rgba(208,255,113,0.4)]' : 'bg-white/10'}`}
                    />
                ))}
            </div>
        </motion.div>
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
        <div className="min-h-screen bg-[#0B0B0B] text-white font-body selection:bg-lime/30 selection:text-white relative overflow-hidden">
            {/* Animated ambient gradient orbs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5A9F2E]/20 blur-[120px] rounded-full pointer-events-none z-0 animate-float-slow" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#D0FF71]/8 blur-[140px] rounded-full pointer-events-none z-0 animate-float-slow-reverse" />

            {/* Noise overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            {/* Background logo badge — zoomed out so full badge is visible */}
            <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05]">
                <img src={logoSrc} alt="" className="w-[80%] md:w-[55%] lg:w-[40%] max-w-[600px] grayscale object-contain" />
            </div>

            {/* Floating CSS keyframes */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(30px, -20px) scale(1.05); }
                }
                @keyframes float-slow-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 15px) scale(1.03); }
                }
                .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
                .animate-float-slow-reverse { animation: float-slow-reverse 25s ease-in-out infinite; }
            `}</style>

            <div className="max-w-[960px] mx-auto px-6 py-16 md:py-24 space-y-24 relative z-10">

                {/* ─── Zkandar AI Header ────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3 pb-4 border-b border-white/5"
                >
                    <img src={logoSrc} alt="Zkandar AI" className="h-9 object-contain" />
                    <span className="text-sm font-heading font-bold tracking-wider text-white/70">Zkandar AI</span>
                    <span className="ml-auto text-[10px] uppercase tracking-[0.15em] text-lime/60 font-bold border border-lime/20 px-3 py-1 rounded-full">Industry Report</span>
                </motion.div>

                {/* ─── SECTION 1: Hero ──────────────────────────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-lime font-body"
                        >
                            Industry Data
                        </motion.span>
                        <h1
                            className="font-heading font-black text-white"
                            style={{
                                lineHeight: 1.15,
                                letterSpacing: '-0.01em',
                                wordSpacing: '0.05em',
                                maxWidth: '820px',
                                overflowWrap: 'break-word',
                                hyphens: 'none',
                                whiteSpace: 'normal',
                                fontSize: 'clamp(28px, 6vw, 52px)'
                            }}
                        >
                            Design Studios Are Experimenting With AI. Very Few Are Using It.
                        </h1>
                        <p
                            className="text-base md:text-lg text-gray-400 leading-relaxed font-body"
                            style={{
                                marginTop: '20px',
                                maxWidth: '600px'
                            }}
                        >
                            Real data from +200 designers across 5 studios shows where the gap is and what teams actually need.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <StatPill value={200} suffix="+" label="Designers surveyed" delay={0.1} />
                            <StatPill value={5} label="Studios" delay={0.2} />
                            <StatPill value={62} label="Only experimenting" suffix="%" delay={0.3} />
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 2: Where Teams Are Right Now ─────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">Where teams are right now</h2>

                        <StackedBar segments={[
                            { label: 'Not using AI at all', pct: 16, color: '#6B7280' },
                            { label: 'Occasionally experimenting', pct: 62, color: '#D0FF71' },
                            { label: 'Regularly for internal work', pct: 13, color: '#4ADE80' },
                            { label: 'Regularly for client-facing', pct: 9, color: '#16A34A' },
                        ]} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ScoreCallout score={2.7} total={5} label="Average team confidence in AI workflow" />
                            <ScoreCallout score={2.4} total={5} label="Average self-rated skill level" />
                        </div>

                    </div>
                </Section>

                {/* ─── SECTION 2.5: What AI Changes in Your Process ────────── */}
                <Section>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What AI changes in your process</h2>
                            <p className="text-sm text-gray-500 mt-2 font-body">Average time saved per workflow phase when structured AI tools are adopted</p>
                        </div>

                        <div className="space-y-5 bg-bg-card border border-border rounded-2xl p-6">
                            <AnimatedBar label="Research & moodboarding" sublabel="1–3 days → 10–20 minutes" pct={90} delay={0} />
                            <AnimatedBar label="Concept development" sublabel="3–7 days → under 1 hour, exploring 10–20 directions instead of 3–5" pct={80} delay={0.1} />
                            <AnimatedBar label="Material & FF&E exploration" sublabel="1–2 days sourcing finishes and references → curated boards in minutes" pct={85} delay={0.2} />
                            <AnimatedBar label="Visualization turnaround" sublabel="Days or weeks of rendering → multiple variations in minutes" pct={70} delay={0.3} />
                            <AnimatedBar label="Client presentation prep" sublabel="Full days assembling visuals → client-ready materials in hours" pct={80} delay={0.4} />
                            <AnimatedBar label="Proposal response time" sublabel="Days of scrambling to respond to RFPs → same-day turnaround" pct={60} delay={0.5} />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <StatPill value={75} suffix="%" label="More creative output / month" delay={0.1} />
                            <StatPill value={50} suffix="%" label="Faster client approvals" delay={0.2} />
                            <StatPill value={10} suffix="×" label="More visual content produced" delay={0.3} />
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 3: What Teams Are Struggling With ────────────── */}
                <Section>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What teams are struggling with</h2>
                            <p className="text-sm text-gray-500 mt-2 font-body">Share of designers who cited each as a primary friction point</p>
                        </div>

                        <div className="space-y-4 bg-bg-card border border-border rounded-2xl p-6">
                            <AnimatedBar label="Controlling style and consistency" sublabel="AI outputs don't match the studio's visual language" pct={44} delay={0} />
                            <AnimatedBar label="Getting strong concept ideas" sublabel="Struggling to push AI beyond generic directions" pct={40} delay={0.1} />
                            <AnimatedBar label="Translating AI into real design work" sublabel="Results look good but don't connect to actual projects" pct={33} delay={0.2} />
                            <AnimatedBar label="Creating mood and storytelling visuals" sublabel="Can't get the emotional quality needed for client presentations" pct={22} delay={0.3} />
                            <AnimatedBar label="Iterating efficiently" sublabel="Each round of changes takes too long" pct={18} delay={0.4} />
                        </div>

                        <CalloutCard number={67} text={`of designers say difficulty controlling results is their primary concern — not lack of access to tools.`} />
                    </div>
                </Section>

                {/* ─── SECTION 4: What Teams Actually Want ──────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What teams actually want</h2>

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
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500 uppercase tracking-widest font-heading">Of designers, what would help them most</p>
                                <BigStatCard value={42} label="say structured prompting techniques would make the biggest difference" />
                                <BigStatCard value={36} label="say learning to refine and control AI results is their top need" />
                            </div>
                        </div>

                        <p className="text-base text-gray-500 italic border-l-2 border-lime/30 pl-4 font-body">
                            Teams don't need more tools. They need a structured workflow framework.
                        </p>
                    </div>
                </Section>

                {/* ─── SECTION 5: What Leadership Sees ──────────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What leadership sees</h2>
                            <p className="text-sm text-gray-500 mt-2 font-body">Data from 5 studio directors, heads of design, and partners</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Opportunities */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-heading">Opportunities</h3>
                                <AnimatedBar label="Better use of team time" pct={60} color="#D0FF71" delay={0} />
                                <AnimatedBar label="Faster concept development" pct={60} color="#D0FF71" delay={0.1} />
                                <AnimatedBar label="Greater design consistency" pct={30} color="#D0FF71" delay={0.2} />
                                <AnimatedBar label="Competitive differentiation" pct={80} color="#D0FF71" delay={0.3} />
                            </div>

                            {/* Risks */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-heading">Risks of not using AI</h3>
                                <AnimatedBar label="Falling behind competitors" pct={80} color="#F87171" delay={0} />
                                <AnimatedBar label="Slower delivery, higher costs" pct={70} color="#F87171" delay={0.1} />
                                <AnimatedBar label="Team skill gaps widening" pct={60} color="#F87171" delay={0.2} />
                                <AnimatedBar label="Losing top creative talent" pct={40} color="#F87171" delay={0.3} />
                            </div>
                        </div>

                        {/* Impact ratings */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <ImpactCard label="Speed" score={4.7} />
                            <ImpactCard label="Efficiency" score={4.6} />
                            <ImpactCard label="Quality" score={4.2} />
                            <ImpactCard label="Client Satisfaction" score={5.0} />
                            <ImpactCard label="Competitive Advantage" score={5.0} />
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 6: What Leadership Wants to Achieve ──────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What leadership is trying to achieve</h2>

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
                                The missing piece is a clear, repeatable system built for how design studios actually work.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 7: Studio Capacity Multiplier ───────────────── */}
                <Section>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">Your team, amplified</h2>
                            <p className="text-sm text-gray-500 mt-2 font-body">What the same 10-person studio looks like before and after structured AI workflows</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-heading">Without AI workflows</h3>
                                <div className="space-y-3">
                                    {[
                                        '3–5 concept directions explored per project',
                                        '2–3 projects handled simultaneously',
                                        'Limited bandwidth to respond to new RFPs',
                                        '40–60% of designer time spent before real design begins',
                                        'Dependence on external visualization studios',
                                    ].map(item => (
                                        <div key={item} className="flex items-start gap-3">
                                            <span className="text-gray-600 shrink-0 mt-0.5 text-base leading-none">–</span>
                                            <p className="text-sm text-gray-400 font-body">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-bg-card border border-lime/20 rounded-2xl p-6 space-y-4">
                                <h3 className="text-xs font-bold text-lime/60 uppercase tracking-widest font-heading">With AI workflows</h3>
                                <div className="space-y-3">
                                    {[
                                        '8–12 concept directions per project',
                                        '40–60% more proposals responded to per month',
                                        '30–50% increase in project acquisition capacity',
                                        'Concept visuals, moodboards, and walkthroughs produced in-house',
                                        '5–10× more visual content for presentations and social media',
                                    ].map(item => (
                                        <div key={item} className="flex items-start gap-3">
                                            <span className="text-lime shrink-0 mt-0.5 text-base leading-none">↑</span>
                                            <p className="text-sm text-gray-300 font-body">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-bg-card border-l-4 border-lime rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="shrink-0 text-center md:text-left">
                                <span className="text-5xl font-heading font-black text-lime">2–3×</span>
                                <p className="text-xs text-gray-500 uppercase tracking-widest font-heading mt-1">Creative output capacity</p>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed font-body">
                                A 10-person team operating with structured AI workflows produces the creative output equivalent to 20–25 designers using traditional methods — without adding headcount, salaries, or management overhead.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ─── Productivity Calculator ────────────────────────────────── */}
                <ProductivityCalculator />

                {/* ─── SECTION 7: CTA ───────────────────────────────────────── */}
                <Section className="text-center pb-12">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-heading font-black tracking-wide">
                            This is what Zkandar AI is built for.
                        </h2>
                        <p className="text-gray-400 text-base font-body">
                            Structured AI workflows for architecture and design studios.
                        </p>
                        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
                            <Link
                                to="/program"
                                className="px-8 py-3.5 bg-lime text-black font-bold rounded-xl hover:bg-lime-400 transition-all text-sm uppercase tracking-wider hover:shadow-glow-lg hover:-translate-y-0.5"
                            >
                                View Program
                            </Link>
                        </div>
                    </div>
                </Section>

                {/* ─── Footer Branding ──────────────────────────────────────── */}
                <div className="text-center pt-8 pb-4 border-t border-white/5">
                    <div className="flex items-center justify-center gap-2 opacity-40">
                        <img src={logoSrc} alt="" className="h-5 object-contain grayscale" />
                        <span className="text-xs font-heading tracking-wider">Zkandar AI</span>
                    </div>
                </div>

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
