/**
 * MasterclassCard – universal "AI Masterclass for Teams" card used on:
 *   - Landing page (LandingPageTest)
 *   - AI for Teams (WorkflowsPage)
 *
 * Single source of truth so edits propagate everywhere.
 */

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, ArrowDown } from 'lucide-react'

// ── Shared data ─────────────────────────────────────────────────────────

export const MASTERCLASS_INCLUSIONS = [
    'Tailored content & case studies for your studio',
    'In-session hands-on exercises',
    'Prize money competition',
    'Life-time access to all session recordings',
    'Free access to E-prompt books',
    'Bonus 2-hr support call post Masterclass',
    '60-day free access to AI community',
    'Data-driven analysis of team performance',
]

export const MASTERCLASS_GAINS = [
    { label: 'Control', body: 'Direct AI output with precision so it fits your visual language every time' },
    { label: 'Speed', body: 'Compress days of ideation into hours without sacrificing quality' },
    { label: 'Confidence', body: 'Present AI-assisted work to clients with full creative ownership' },
]

// ── CheckItem ───────────────────────────────────────────────────────────

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

// ── Props ────────────────────────────────────────────────────────────────

interface MasterclassCardProps {
    /** Called when user clicks the CTA button */
    onBookCall: () => void
    /** If true, show the "Not a team? See individual training" link that scrolls to #sprint */
    showSprintLink?: boolean
}

// ── Component ───────────────────────────────────────────────────────────

export function MasterclassCard({ onBookCall, showSprintLink = false }: MasterclassCardProps) {
    return (
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
                        onClick={onBookCall}
                        className="group flex items-center gap-3 px-8 py-4 bg-lime text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:shadow-[0_0_24px_rgba(208,255,113,0.4)] hover:-translate-y-0.5 font-heading"
                    >
                        Book a Discovery Call
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    {showSprintLink && (
                        <button
                            onClick={() => document.getElementById('sprint')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider font-body transition-all hover:-translate-y-0.5"
                            style={{ background: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}
                        >
                            Not a team? See individual training
                            <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    )}
                    {!showSprintLink && (
                        <p className="text-xs text-lime font-bold font-body">Free 15-minute call. No commitment.</p>
                    )}
                </div>

            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime/20 to-transparent" />
        </motion.div>
    )
}
