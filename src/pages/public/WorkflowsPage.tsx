import { useRef, useEffect, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import logoSrc from '../../assets/logo.png'
import { ProductivityCalculator } from '../../components/public/ProductivityCalculator'
import { PublicNav } from '../../components/public/PublicNav'
import { InlineWidget } from 'react-calendly'

const MASTERCLASS_CALENDLY = 'https://calendly.com/zkandarstudio-info/ai-discovery-call'

const masterclassInclusions = [
    'Tailored content & case studies for your studio',
    'In-session hands-on exercises',
    'Prize money competition',
    'Life-time access to all session recordings',
    'Free access to E-prompt books',
    'Bonus 2-hr support call post Masterclass',
    '60-day free access to AI community',
    'Data-driven analysis of teams performance',
]

const masterclassGains = [
    { label: 'Control', body: 'Direct AI output with precision so it fits your visual language every time' },
    { label: 'Speed', body: 'Compress days of ideation into hours without sacrificing quality' },
    { label: 'Confidence', body: 'Present AI-assisted work to clients with full creative ownership' },
]

function CalendlyModal({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-[#111111] border border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl flex flex-col"
                style={{ height: 'min(850px, 90vh)' }}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <img src={logoSrc} alt="" className="h-5 object-contain" />
                        <span className="text-sm font-bold font-heading text-white/80">Book a Discovery Call</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all text-base">✕</button>
                </div>
                <div className="flex-1 min-h-0 relative bg-[#111111]">
                    <InlineWidget
                        url={MASTERCLASS_CALENDLY}
                        styles={{ height: '100%', width: '100%' }}
                        pageSettings={{ hideGdprBanner: true, backgroundColor: '111111', textColor: 'ffffff', primaryColor: 'd0ff71' }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
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
            className="flex flex-col items-center gap-1.5 px-3 sm:px-8 py-3 sm:py-5 bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl min-w-0 group hover:border-lime/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
        >
            <span className="text-xl sm:text-3xl md:text-4xl font-heading font-black text-lime tabular-nums">
                {animated}{suffix}
            </span>
            <span className="text-[0.6rem] sm:text-xs text-gray-500 uppercase tracking-widest font-body text-center leading-tight">{label}</span>
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

// ─── Ring chart (SVG donut) ───────────────────────────────────────────────────

function RingChart({ pct, label, delay = 0 }: { pct: number; label: string; delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const animated = useAnimatedNumber(pct, 1200, inView)
    const r = 18
    const circumference = 2 * Math.PI * r
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay }}
            className="flex items-center gap-4"
        >
            <div className="relative w-14 h-14 shrink-0">
                <svg viewBox="0 0 40 40" className="w-14 h-14 -rotate-90">
                    <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                    <motion.circle
                        cx="20" cy="20" r={r}
                        fill="none"
                        stroke="#D0FF71"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={inView ? { strokeDashoffset: circumference - (pct / 100) * circumference } : {}}
                        transition={{ duration: 1.1, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-black text-lime font-heading leading-none">{animated}%</span>
                </div>
            </div>
            <span className="text-sm text-gray-400 font-body leading-snug">{label}</span>
        </motion.div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function WorkflowsPage() {
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <>
        <AnimatePresence>
            {modalOpen && <CalendlyModal onClose={() => setModalOpen(false)} />}
        </AnimatePresence>
        <div className="min-h-screen bg-[#0B0B0B] text-white font-body selection:bg-lime/30 selection:text-white relative overflow-hidden">
            <PublicNav />
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

            <div className="max-w-[960px] mx-auto px-6 pt-24 pb-16 md:pt-28 md:pb-24 space-y-24 relative z-10">

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
                        <h1 className="font-heading font-black uppercase text-[clamp(1.4rem,4.5vw,3.2rem)] leading-[1.0] md:leading-[0.93] text-white">
                            Design Studios Are Experimenting With AI.<br /><span className="text-lime">Very Few Are Using It.</span>
                        </h1>
                        <p
                            className="text-base md:text-lg text-gray-400 leading-relaxed font-body"
                            style={{
                                marginTop: '20px',
                                maxWidth: '600px'
                            }}
                        >
                            Real data from +200 Participants across 10 studios shows where the gap is and what teams actually need.
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <StatPill value={200} suffix="+" label="Participants surveyed" delay={0.1} />
                            <StatPill value={10} label="Studios" delay={0.2} />
                            <StatPill value={62} label="Only experimenting" suffix="%" delay={0.3} />
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 2: Where Teams Are Right Now ─────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.5rem)] leading-[1.05] md:leading-[0.95] text-white">Where Teams Are <span className="text-lime">Right Now</span></h2>

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
                            <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.5rem)] leading-[1.05] md:leading-[0.95] text-white">What AI Changes <span className="text-lime">In Your Process</span></h2>
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatPill value={75} suffix="%" label="More creative output / month" delay={0.1} />
                            <StatPill value={50} suffix="%" label="Faster client approvals" delay={0.2} />
                            <StatPill value={10} suffix="×" label="More visual content produced" delay={0.3} />
                        </div>
                    </div>
                </Section>

                {/* ─── SECTION 4: What Teams Actually Want ──────────────────── */}
                <Section>
                    <div className="space-y-8">
                        <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.5rem)] leading-[1.05] md:leading-[0.95] text-white">What Teams <span className="text-lime">Actually Want</span></h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Bar chart of team priorities */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
                                <h3 className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">Team priorities</h3>
                                <AnimatedBar label="Gain more control over AI results" pct={69} delay={0} />
                                <AnimatedBar label="Learn structured AI workflows" pct={33} delay={0.1} />
                                <AnimatedBar label="Generate concepts faster" pct={33} delay={0.2} />
                                <AnimatedBar label="Improve visual quality" pct={27} delay={0.3} />
                                <AnimatedBar label="Build confidence using AI tools" pct={16} delay={0.4} />
                            </div>

                            {/* Right: Ring charts for what would help most */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-6">
                                <h3 className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">What would help most</h3>
                                <RingChart pct={42} label="say structured prompting techniques would make the biggest difference" delay={0.1} />
                                <RingChart pct={36} label="say learning to refine and control AI results is their top need" delay={0.25} />
                                <RingChart pct={22} label="want better tools and guidance for client-facing work" delay={0.4} />
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
                            <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.5rem)] leading-[1.05] md:leading-[0.95] text-white">What <span className="text-lime">Leadership Sees</span></h2>
                            <p className="text-sm text-gray-500 mt-2 font-body">Data from 5 studio directors, heads of design, and partners</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Opportunities */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">Opportunities</h3>
                                <AnimatedBar label="Better use of team time" pct={60} color="#D0FF71" delay={0} />
                                <AnimatedBar label="Faster concept development" pct={60} color="#D0FF71" delay={0.1} />
                                <AnimatedBar label="Greater design consistency" pct={30} color="#D0FF71" delay={0.2} />
                                <AnimatedBar label="Competitive differentiation" pct={80} color="#D0FF71" delay={0.3} />
                            </div>

                            {/* Risks */}
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">Risks of not using AI</h3>
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

                {/* ─── CTA strip ───────────────────────────────────────────── */}
                <Section>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl"
                        style={{ background: 'linear-gradient(145deg, #111811 0%, #0C130C 100%)', border: '1px solid rgba(208,255,113,0.15)' }}>
                        <div>
                            <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-lime/60 mb-1">Seen enough?</p>
                            <p className="font-heading font-black uppercase text-xl text-white leading-tight">Ready to bring AI to your studio?</p>
                        </div>
                        <button onClick={() => setModalOpen(true)}
                            className="group shrink-0 flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-glow-lg hover:-translate-y-0.5 font-heading">
                            Book a Discovery Call
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </Section>

                {/* ─── SECTION 7: Studio Capacity Multiplier ───────────────── */}
                <Section>
                    <div className="space-y-8">
                        <div>
                            <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.5rem)] leading-[1.05] md:leading-[0.95] text-white">Your Team, <span className="text-lime">Amplified</span></h2>
                            <p className="text-sm text-gray-500 mt-2 font-body">What the same 10-person studio looks like before and after structured AI workflows</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
                                <h3 className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">Without AI workflows</h3>
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
                                A 10-person team operating with structured AI workflows produces the creative output equivalent to 20–25 participants using traditional methods — without adding headcount, salaries, or management overhead.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ─── Productivity Calculator ────────────────────────────────── */}
                <ProductivityCalculator />

                {/* ─── CTA strip 2 ─────────────────────────────────────────── */}
                <Section>
                    <div className="text-center space-y-5">
                        <p className="text-gray-500 text-sm font-body">Your studio could be operating like this within 15 hours of training.</p>
                        <button onClick={() => setModalOpen(true)}
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-glow-lg hover:-translate-y-0.5 font-heading">
                            Book a Discovery Call
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <p className="text-xs text-lime font-bold font-body">Free 15-minute call. No commitment.</p>
                    </div>
                </Section>

                {/* ─── SECTION 7: MASTERCLASS CARD ─────────────────────────── */}
                <Section className="pb-12">
                    <div className="space-y-6 mb-10 text-center">
                        <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">The Program</p>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.3rem,3.5vw,2.5rem)] leading-[1.05] md:leading-[0.95] text-white">
                            THIS IS WHAT<br /><span className="text-lime">ZKANDAR AI IS BUILT FOR.</span>
                        </h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-3xl overflow-hidden"
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
                                    Zkandar AI<br /><span className="text-lime">Masterclass</span>
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
                                    { label: 'Format', value: 'Live + Async' },
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
                                    {masterclassInclusions.map((item, i) => (
                                        <CheckItem key={item} text={item} delay={i * 0.05} />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* What you'll gain */}
                            <div className="space-y-5">
                                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">What you'll walk away with</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {masterclassGains.map((g, i) => (
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
                                    onClick={() => setModalOpen(true)}
                                    className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-glow-lg hover:-translate-y-0.5 font-heading"
                                >
                                    Book a Discovery Call
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <p className="text-xs text-lime font-bold font-body">Free 15-minute call. No commitment.</p>
                            </div>

                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime/20 to-transparent" />
                    </motion.div>
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
        </>
    )
}

