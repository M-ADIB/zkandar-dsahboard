/**
 * SprintCard – universal "AI Sprint Workshop for Individuals" card.
 * Single source of truth used on:
 *   - Landing page (LandingPageTest)
 *   - Checkout page
 */

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── Shared data ─────────────────────────────────────────────────────────

export const SPRINT_INCLUSIONS = [
    '3 live days of hands-on AI training',
    'Real client-ready deliverables by Day 3',
    'Access to session recordings',
]

// ── PurpleCheckItem ─────────────────────────────────────────────────────

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

// ── Props ────────────────────────────────────────────────────────────────

interface SprintCardProps {
    /** Dynamic sprint date string, e.g. "June 3–5" */
    sprintDates: string
    /** Sprint location label, e.g. "Live Zoom" */
    sprintLocation?: string
    /** Stripe checkout URL */
    checkoutUrl?: string
}

// ── Component ───────────────────────────────────────────────────────────

export function SprintCard({
    sprintDates,
    sprintLocation,
    checkoutUrl = '/checkout',
}: SprintCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl overflow-hidden"
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
                        AI Sprint Workshop<br /><span className="text-purple-300">for Individuals</span>
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

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {checkoutUrl.startsWith('http') ? (
                        <a href={checkoutUrl}
                            className="group flex items-center gap-3 px-8 py-4 font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:-translate-y-0.5 font-heading"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
                        >
                            Direct Checkout
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    ) : (
                        <Link to={checkoutUrl}
                            className="group flex items-center gap-3 px-8 py-4 font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:-translate-y-0.5 font-heading"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
                        >
                            Direct Checkout
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />
        </motion.div>
    )
}
