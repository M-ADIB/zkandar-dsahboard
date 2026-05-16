import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useCountdown } from '@/hooks/useCountdown'
import { Check, X as XIcon, ChevronDown, Shield, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ── Animation Helpers ─────────────────────────────────── */

export function FadeIn({ children, direction = 'up', delay = 0, className = '' }: {
    children: React.ReactNode; direction?: 'up' | 'down' | 'left' | 'right'; delay?: number; className?: string
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-60px' })
    const off = { up: [0, 30], down: [0, -30], left: [30, 0], right: [-30, 0] }[direction]
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, x: off[0], y: off[1] }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >{children}</motion.div>
    )
}

/* ── Section Wrapper ───────────────────────────────────── */

export function Section({ children, id, dark = false, className = '' }: {
    children: React.ReactNode; id?: string; dark?: boolean; className?: string
}) {
    return (
        <section id={id} className={`py-20 md:py-28 ${dark ? 'bg-[#050505]' : 'bg-black'} border-t border-white/[0.04] ${className}`}>
            <div className="max-w-[52rem] mx-auto px-5 sm:px-8">{children}</div>
        </section>
    )
}

/* ── Section Heading ───────────────────────────────────── */

export function SectionHeading({ children, sub, center = true }: {
    children: React.ReactNode; sub?: string; center?: boolean
}) {
    return (
        <div className={`mb-10 md:mb-14 ${center ? 'text-center' : ''}`}>
            <h2 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.6rem)] leading-[0.93] tracking-[0.01em]">
                {children}
            </h2>
            {sub && <p className="text-[0.85rem] text-gray-400 mt-4 max-w-xl mx-auto leading-relaxed">{sub}</p>}
        </div>
    )
}

/* ── Seats Counter ─────────────────────────────────────── */

export function SeatsCounter({ seats, className = '' }: { seats: number; className?: string }) {
    return (
        <div className={`flex flex-col items-center gap-1.5 ${className}`}>
            <motion.span
                key={seats}
                initial={{ scale: 1.12 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-[3.5rem] font-heading font-black text-white tabular-nums leading-none"
            >{seats}</motion.span>
            <span className="text-[0.6rem] uppercase tracking-[0.22em] text-gray-600 font-bold">seats remaining</span>
        </div>
    )
}

/* ── Countdown Timer ───────────────────────────────────── */

export function CountdownTimer({ targetDate, compact = false }: { targetDate: Date; compact?: boolean }) {
    const { days, hours, minutes, seconds, expired } = useCountdown(targetDate)
    if (expired) return <span className="text-red-400 font-heading font-bold uppercase text-sm tracking-wider">Offer Expired</span>

    if (compact) {
        return (
            <span className="text-[0.8rem] font-body tabular-nums text-gray-400" aria-live="polite">
                <span className="text-white font-bold">{days}</span>d{' '}
                <span className="text-white font-bold">{String(hours).padStart(2, '0')}</span>h{' '}
                <span className="text-white font-bold">{String(minutes).padStart(2, '0')}</span>m{' '}
                <span className="text-white font-bold">{String(seconds).padStart(2, '0')}</span>s
            </span>
        )
    }

    const boxes = [
        { val: days, label: 'DAYS' },
        { val: hours, label: 'HOURS' },
        { val: minutes, label: 'MIN' },
        { val: seconds, label: 'SEC' },
    ]
    return (
        <div className="flex gap-3 sm:gap-4 justify-center" aria-live="polite">
            {boxes.map(b => (
                <div key={b.label} className="bg-[#111] border border-white/[0.08] rounded-2xl w-[4.5rem] h-[5rem] sm:w-[5rem] sm:h-[5.5rem] flex flex-col items-center justify-center">
                    <span className="text-[2rem] sm:text-[2.25rem] font-heading font-black text-white tabular-nums leading-none">{String(b.val).padStart(2, '0')}</span>
                    <span className="text-[0.45rem] uppercase tracking-[0.22em] text-gray-600 mt-1.5 font-bold">{b.label}</span>
                </div>
            ))}
        </div>
    )
}

/* ── CTA Button ────────────────────────────────────────── */

export function CtaButton({ onClick, label = "RESERVE MY SEAT — JUST $19", sub, size = 'lg' }: {
    onClick: () => void; label?: string; sub?: string; size?: 'lg' | 'md'
}) {
    return (
        <div className="flex flex-col items-center gap-3">
            <button
                onClick={onClick}
                className={`bg-lime text-black font-heading font-black uppercase rounded-full hover:shadow-[0_0_40px_rgba(208,255,113,0.35)] hover:-translate-y-0.5 transition-all duration-300 w-full max-w-lg tracking-[0.04em] ${
                    size === 'lg' ? 'text-sm md:text-base px-10 py-5' : 'text-[0.8rem] md:text-sm px-8 py-4'
                }`}
            >
                {label}
            </button>
            {sub && <p className="text-[0.7rem] text-gray-500 text-center max-w-sm leading-relaxed">{sub}</p>}
        </div>
    )
}

/* ── Scarcity Pricing ──────────────────────────────────── */

export function ScarcityPricing({ currentTier, targetDate, onCta }: { currentTier: number; targetDate: Date; onCta: () => void }) {
    const tiers = [
        { tier: 1, audience: 'First 27 participants', price: 19, deadline: 'Ends June 1, 2026' },
        { tier: 2, audience: 'Participants 28–100', price: 29, deadline: 'Ends June 4, 2026' },
        { tier: 3, audience: 'Participants 100–1000', price: 39, deadline: 'Ends June 7, 2026' },
    ]
    return (
        <div id="register" className="space-y-10">
            {/* Price hero */}
            <div className="text-center space-y-2">
                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 font-bold">Limited-Time Offer</p>
                <div className="flex items-baseline justify-center gap-3">
                    <span className="line-through text-gray-700 text-2xl font-heading font-black">$100</span>
                    <span className="text-lime text-5xl sm:text-6xl font-heading font-black leading-none">$19</span>
                </div>
            </div>

            {/* Tier cards */}
            <div className="space-y-2.5 max-w-md mx-auto">
                {tiers.map(t => {
                    const active = t.tier === currentTier
                    return (
                        <div key={t.tier} className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                            active
                                ? 'border-lime/30 bg-lime/[0.04] shadow-[0_0_20px_rgba(208,255,113,0.06)]'
                                : 'border-white/[0.06] bg-[#0A0A0A] opacity-40'
                        }`}>
                            <div>
                                <p className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-600'}`}>Tier {t.tier}</p>
                                <p className="text-[0.65rem] text-gray-600 mt-0.5">{t.audience}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-heading font-black ${active ? 'text-lime' : 'text-gray-700 line-through'}`}>${t.price}</p>
                                <p className="text-[0.55rem] text-gray-700">{t.deadline}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Countdown */}
            <div className="pt-2">
                <CountdownTimer targetDate={targetDate} />
            </div>

            {/* CTA */}
            <CtaButton onClick={onCta} size="md" label="RESERVE MY SEAT — JUST $19" />
        </div>
    )
}

/* ── Testimonial Card ──────────────────────────────────── */

export function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
    return (
        <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 flex flex-col h-full hover:border-white/[0.12] transition-colors">
            <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-[0.85rem]">★</span>)}</div>
            <p className="text-[0.85rem] text-gray-300 leading-[1.7] flex-1 mb-6">"{quote}"</p>
            <div className="border-t border-white/[0.05] pt-4">
                <p className="text-sm font-bold text-white">{name}</p>
                <p className="text-[0.65rem] text-gray-500 mt-0.5">{role}</p>
            </div>
        </div>
    )
}

/* ── FAQ Accordion ─────────────────────────────────────── */

export function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
    return (
        <div className={`border rounded-xl mb-2.5 overflow-hidden transition-all duration-200 ${open ? 'border-lime/20 bg-lime/[0.02]' : 'border-white/[0.06] bg-[#0A0A0A]'}`}>
            <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left group">
                <span className={`text-[0.85rem] font-bold pr-4 transition-colors ${open ? 'text-lime' : 'text-white group-hover:text-gray-200'}`}>{q}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-colors ${open ? 'text-lime' : 'text-gray-600'}`} />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                        <p className="px-5 pb-5 text-[0.82rem] text-gray-400 leading-[1.75]">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ── Before/After Section ──────────────────────────────── */

export function BeforeAfterSection({ onCta }: { onCta: () => void }) {
    const before = [
        'Developing design ideas using traditional methods only',
        'Long render and presentation prep times',
        'Unclear project stages from concept to execution',
        'Using AI tools randomly or in limited ways',
        'Knowing AI exists but not connecting it to a real workflow',
    ]
    const after = [
        'Develop design ideas faster and more efficiently',
        'Create renders and presentations in a fraction of the time',
        'A complete Workflow for interior design — idea to execution',
        'Present projects to clients clearly and persuasively',
        'Integrate AI into every stage of the design process',
    ]
    return (
        <div className="space-y-12">
            <SectionHeading sub="This isn't about disconnected tools or theory — it's about understanding the complete interior design workflow as a clear, organized system with AI integrated at every stage.">
                WHAT WILL YOU <span className="text-lime">WALK AWAY WITH?</span>
            </SectionHeading>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-white/[0.06]">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-red-400/60 mb-5">Before the Webinar</p>
                    <ul className="space-y-4">{before.map((b, i) => (
                        <li key={i} className="flex gap-3 text-[0.82rem] text-gray-500 leading-relaxed">
                            <XIcon className="w-4 h-4 text-red-500/50 shrink-0 mt-0.5" />{b}
                        </li>
                    ))}</ul>
                </div>
                <div className="rounded-2xl p-6 border border-lime/[0.12] bg-lime/[0.02]">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-lime mb-5">After the Webinar</p>
                    <ul className="space-y-4">{after.map((a, i) => (
                        <li key={i} className="flex gap-3 text-[0.82rem] text-gray-200 leading-relaxed">
                            <Check className="w-4 h-4 text-lime shrink-0 mt-0.5" />{a}
                        </li>
                    ))}</ul>
                </div>
            </div>
            <div className="text-center space-y-5 pt-4">
                <h3 className="font-heading font-black uppercase text-xl text-white tracking-wide">THE RESULT:</h3>
                <p className="text-[0.85rem] text-gray-400 leading-[1.75] max-w-xl mx-auto">
                    Instead of treating the project as disconnected steps… you'll understand how the entire design process becomes an integrated <span className="text-lime font-semibold">Workflow</span> — executed with speed and efficiency using AI tools, through a real project we built live.
                </p>
                <CtaButton onClick={onCta} label="BOOK YOUR SEAT NOW — JUST $19" size="md" />
            </div>
        </div>
    )
}

/* ── Value Stacking Table ──────────────────────────────── */

export function ValueTable() {
    const items = [
        { item: '3 days of live training', value: '$250' },
        { item: 'AI prompt library for designers', value: '$75' },
        { item: 'Professional Creative Brief template', value: '$50' },
        { item: 'Marketing Strategy Blueprint', value: '$50' },
        { item: 'Storytelling Framework for presentations', value: '$40' },
        { item: 'Traditional vs. AI Design comparison guide', value: '$35' },
    ]
    return (
        <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl overflow-hidden max-w-md mx-auto">
            {items.map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 1 ? 'bg-white/[0.02]' : ''} ${i < items.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                    <span className="text-[0.82rem] text-gray-300">{row.item}</span>
                    <span className="text-[0.82rem] text-gray-600 font-bold ml-4 shrink-0 tabular-nums">{row.value}</span>
                </div>
            ))}
            <div className="flex items-center justify-between px-5 py-4 border-t-2 border-lime/20 bg-lime/[0.03]">
                <span className="text-sm font-bold text-white">Total real value</span>
                <span className="text-2xl font-heading font-black text-lime">$500</span>
            </div>
        </div>
    )
}

/* ── Guarantee Badge ───────────────────────────────────── */

export function GuaranteeBadge() {
    return (
        <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-lime/30 bg-lime/[0.05] flex items-center justify-center">
                <Shield className="w-9 h-9 text-lime" />
            </div>
        </div>
    )
}

/* ── Lead Collection Modal ─────────────────────────────── */

export function LeadCaptureModal({ open, onClose, onSuccess }: {
    open: boolean
    onClose: () => void
    onSuccess: (data: { name: string; email: string; phone: string }) => void
}) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!name.trim() || !email.trim()) {
            setError('Please fill in your name and email.')
            return
        }
        setLoading(true)
        try {
            // Save lead to Supabase
            const { error: dbError } = await (supabase.from('webinar_leads') as any).insert({
                full_name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim() || null,
                source: 'webinar_landing',
                status: 'new',
            })
            if (dbError) {
                // If duplicate email, still proceed
                if (dbError.code !== '23505') {
                    console.error('Lead save error:', dbError)
                }
            }
            onSuccess({ name: name.trim(), email: email.trim(), phone: phone.trim() })
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    onClick={e => { if (e.target === e.currentTarget) onClose() }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                            <div>
                                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-lime font-bold mb-1">Step 1 of 2</p>
                                <h3 className="font-heading font-black uppercase text-base text-white">Where should we send your access?</h3>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">✕</button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-500 font-bold mb-1.5 block">Full Name *</label>
                                <input
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Sara Al-Mansoori"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-lime/40 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-500 font-bold mb-1.5 block">Email Address *</label>
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="you@studio.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-lime/40 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-500 font-bold mb-1.5 block">Phone Number</label>
                                <input
                                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                    placeholder="+971 50 123 4567"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-lime/40 focus:outline-none transition-colors"
                                />
                            </div>

                            {error && <p className="text-red-400 text-xs">{error}</p>}

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-lime text-black font-heading font-black uppercase text-sm py-4 rounded-xl hover:shadow-[0_0_30px_rgba(208,255,113,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                CONTINUE TO CHECKOUT →
                            </button>

                            <p className="text-[0.6rem] text-gray-600 text-center">We respect your privacy & information.</p>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
