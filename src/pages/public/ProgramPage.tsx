import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'

const CALENDLY_URL = 'https://calendly.com/zkandarstudio-info/ai-discovery-call'

const inclusions = [
    'Tailored AI content & case studies built specifically for your studio',
    'In-session hands-on exercises',
    'Prize money competition',
    'Life-time access to all session recordings',
    'Free access to E-prompt books',
    'Bonus 2-hr support call post Masterclass',
    '60-day free access to AI community',
    'Data-driven analysis of teams performance',
]

const gains = [
    { label: 'Control', body: 'Direct AI output with precision so it fits your visual language every time' },
    { label: 'Speed', body: 'Compress days of ideation into hours without sacrificing quality' },
    { label: 'Confidence', body: 'Present AI-assisted work to clients with full creative ownership' },
]

const testimonials = [
    {
        quote: 'This completely changed how our team approaches the early stages of a project. We\'re generating better concepts in a fraction of the time.',
        name: 'Sofia M.',
        role: 'Creative Director, Studio Forma',
    },
    {
        quote: 'I was skeptical going in. I left with a workflow I use every single day. The difference in output quality is real.',
        name: 'James R.',
        role: 'Senior Designer, Atelier Nord',
    },
    {
        quote: 'Finally a program that respects that we\'re designers first. Not a tech course, a design course that happens to use AI.',
        name: 'Lena K.',
        role: 'Head of Design, Blank Studio',
    },
]

// ─── Calendly Modal ───────────────────────────────────────────────────────────

function CalendlyModal({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-[#111111] border border-white/10 rounded-2xl overflow-hidden w-full max-w-[540px] flex flex-col"
                style={{ height: '720px' }}
            >
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <img src={logoSrc} alt="" className="h-5 object-contain" />
                        <span className="text-sm font-bold font-heading text-white/80">Book a Discovery Call</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all text-base"
                    >
                        ✕
                    </button>
                </div>

                {/* Calendly iframe */}
                <iframe
                    src={`${CALENDLY_URL}?embed_type=Inline&hide_gdpr_banner=1`}
                    width="100%"
                    className="flex-1 min-h-0"
                    frameBorder="0"
                    title="Book a discovery call with Zkandar AI"
                />

                {/* I Have Booked — inside modal */}
                <div className="px-5 py-4 border-t border-white/10 shrink-0 bg-[#0E0E0E]">
                    <p className="text-xs text-gray-600 text-center mb-3 font-body">Already completed your booking?</p>
                    <Link
                        to="/thank-you"
                        onClick={onClose}
                        className="flex items-center justify-center w-full px-6 py-3 border border-lime/30 text-lime font-bold rounded-xl hover:bg-lime/5 transition-all text-sm uppercase tracking-wider font-heading"
                    >
                        I Have Booked
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Check item ───────────────────────────────────────────────────────────────

function CheckItem({ text, delay = 0 }: { text: string; delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -12 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function ProgramPage() {
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    return (
        <>
            <AnimatePresence>
                {modalOpen && <CalendlyModal onClose={() => setModalOpen(false)} />}
            </AnimatePresence>

            <div className="min-h-screen bg-[#0B0B0B] text-white font-body selection:bg-lime/30 selection:text-white relative overflow-hidden">
                {/* Ambient orbs */}
                <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5A9F2E]/20 blur-[120px] rounded-full pointer-events-none z-0 animate-float-slow" />
                <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#D0FF71]/8 blur-[140px] rounded-full pointer-events-none z-0 animate-float-slow-reverse" />
                <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.04]">
                    <img src={logoSrc} alt="" className="w-[80%] md:w-[55%] lg:w-[40%] max-w-[600px] grayscale object-contain" />
                </div>

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

                <div className="max-w-[960px] mx-auto px-6 py-16 md:py-24 space-y-20 relative z-10">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-3 pb-4 border-b border-white/5"
                    >
                        <img src={logoSrc} alt="Zkandar AI" className="h-9 object-contain" />
                        <span className="text-sm font-heading font-bold tracking-wider text-white/70">Zkandar AI</span>
                        <span className="ml-auto text-[10px] uppercase tracking-[0.15em] text-lime/60 font-bold border border-lime/20 px-3 py-1 rounded-full">Program</span>
                    </motion.div>

                    {/* ─── THE CARD ─────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-3xl overflow-hidden"
                        style={{
                            background: 'linear-gradient(145deg, #111811 0%, #0C130C 50%, #090D09 100%)',
                            border: '1px solid rgba(208, 255, 113, 0.15)',
                            boxShadow: '0 0 0 1px rgba(208,255,113,0.04), 0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(208,255,113,0.05) inset',
                        }}
                    >
                        {/* Subtle top glow line */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />

                        <div className="p-8 md:p-12 lg:p-16 space-y-10">

                            {/* Top: badge + title */}
                            <div className="space-y-6">
                                <motion.span
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-lime font-body border border-lime/20 bg-lime/5 px-3 py-1.5 rounded-full"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                                    Exclusive Program
                                </motion.span>

                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                        className="font-heading font-black text-white uppercase"
                                        style={{
                                            fontSize: 'clamp(36px, 7vw, 76px)',
                                            lineHeight: 1.0,
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        Zkandar AI
                                        <br />
                                        <span className="text-lime">Masterclass</span>
                                    </motion.h1>
                                </div>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                    className="text-gray-400 text-base md:text-lg leading-relaxed font-body max-w-xl"
                                >
                                    A hands-on, studio-first AI program that gives your design team a complete operating system for using AI in real work.
                                </motion.p>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/5" />

                            {/* Meta tags */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.55 }}
                                className="flex flex-wrap gap-3"
                            >
                                {[
                                    { label: 'Duration', value: '15 hours' },
                                    { label: 'Format', value: 'Live + Async' },
                                    { label: 'Delivery', value: 'In-Person or Remote' },
                                    { label: 'Team Size', value: 'Up to 20 designers' },
                                ].map(m => (
                                    <div key={m.label} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-2">
                                        <span className="text-[10px] uppercase tracking-widest text-lime/60 font-bold font-heading">{m.label}</span>
                                        <span className="text-xs text-white font-body">{m.value}</span>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Divider */}
                            <div className="border-t border-white/5" />

                            {/* What's included */}
                            <div className="space-y-5">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-heading">What's included</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                    {inclusions.map((item, i) => (
                                        <CheckItem key={item} text={item} delay={0.6 + i * 0.06} />
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/5" />

                            {/* What you'll gain */}
                            <div className="space-y-5">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-heading">What you'll walk away with</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {gains.map((g, i) => (
                                        <motion.div
                                            key={g.label}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.8 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                            className="rounded-2xl p-5 space-y-2"
                                            style={{ background: 'rgba(208,255,113,0.03)', border: '1px solid rgba(208,255,113,0.08)' }}
                                        >
                                            <span className="text-lg font-heading font-black text-lime">{g.label}</span>
                                            <p className="text-xs text-gray-400 leading-relaxed font-body">{g.body}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/5" />

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 1.0 }}
                                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                            >
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:bg-lime-400 transition-all text-sm uppercase tracking-wider hover:shadow-glow-lg hover:-translate-y-0.5 font-heading"
                                >
                                    Book a Discovery Call
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <p className="text-xs text-lime font-bold font-body">Free 15-minute call. No commitment.</p>
                            </motion.div>

                        </div>

                        {/* Bottom glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime/20 to-transparent" />
                    </motion.div>

                    {/* ─── Testimonials ─────────────────────────────────────── */}
                    <div className="space-y-8">
                        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-wide">What participants say</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {testimonials.map((t, i) => (
                                <motion.div
                                    key={t.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
                                >
                                    <p className="text-sm text-gray-300 leading-relaxed font-body italic flex-1">"{t.quote}"</p>
                                    <div>
                                        <p className="text-sm font-bold text-white font-heading">{t.name}</p>
                                        <p className="text-xs text-gray-500 font-body">{t.role}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
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
