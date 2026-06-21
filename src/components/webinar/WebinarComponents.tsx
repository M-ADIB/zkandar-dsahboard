import { useRef, useState, useMemo } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useCountdown } from '@/hooks/useCountdown'
import { Check, X as XIcon, ChevronDown, Shield, ShieldCheck, Loader2 } from 'lucide-react'
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
    const digits = String(seats).padStart(2, '0').split('')
    return (
        <div className={`flex items-center justify-center gap-2.5 ${className}`}>
            <div className="flex gap-1">
                {digits.map((d, i) => (
                    <motion.div
                        key={`${i}-${d}`}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="bg-[#111] border border-white/[0.08] rounded-lg w-8 h-10 flex items-center justify-center"
                    >
                        <span className="text-lg font-heading font-black text-white tabular-nums">{d}</span>
                    </motion.div>
                ))}
            </div>
            <span className="text-[0.6rem] uppercase tracking-[0.18em] text-gray-600 font-bold">seats remaining</span>
        </div>
    )
}

/* ── Countdown Timer ───────────────────────────────────── */

export function CountdownTimer({ targetDate, compact = false }: { targetDate: Date; compact?: boolean }) {
    const { days, hours, minutes, seconds, expired } = useCountdown(targetDate)
    if (expired) return <span className="text-red-400 font-heading font-bold uppercase text-sm tracking-wider">Offer Expired</span>

    if (compact) {
        const segments = [
            { val: days, label: 'D' },
            { val: hours, label: 'H' },
            { val: minutes, label: 'M' },
            { val: seconds, label: 'S' },
        ]
        return (
            <span className="flex items-center gap-1" aria-live="polite">
                {segments.map((s, i) => (
                    <span key={s.label} className="flex items-center gap-1">
                        <span className="bg-white/[0.06] border border-white/[0.08] rounded-md px-1.5 py-0.5 flex items-baseline gap-0.5">
                            <span className="text-[0.75rem] font-heading font-black text-white tabular-nums leading-none">
                                {String(s.val).padStart(2, '0')}
                            </span>
                            <span className="text-[0.45rem] text-gray-600 uppercase font-bold">{s.label}</span>
                        </span>
                        {i < segments.length - 1 && (
                            <span className="text-gray-700 text-[0.6rem] font-bold">:</span>
                        )}
                    </span>
                ))}
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

export function CtaButton({ onClick, label, sub, size = 'lg' }: {
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
                {label ?? `RESERVE MY SEAT · $${getWebinarPrice()}`}
            </button>
            {sub && <p className="text-[0.7rem] text-gray-500 text-center max-w-sm leading-relaxed">{sub}</p>}
        </div>
    )
}

/* ── Webinar Pricing (Single Source of Truth) ──────────── */

export const WEBINAR_DATE = new Date('2026-07-15T19:00:00+04:00') // 7 PM Dubai
const WEBINAR_LAUNCH = new Date(WEBINAR_DATE.getTime() - 29 * 86400000)

const PRICING_TIERS = [
    { price: 19, label: 'Early Bird Offer', from: WEBINAR_LAUNCH },
    { price: 29, label: 'After 1 Week', from: new Date(WEBINAR_LAUNCH.getTime() + 7 * 86400000) },
    { price: 39, label: 'After 2 Weeks', from: new Date(WEBINAR_LAUNCH.getTime() + 14 * 86400000) },
    { price: 49, label: 'Final Price', from: new Date(WEBINAR_LAUNCH.getTime() + 21 * 86400000) },
]

/** Returns the current webinar price based on weekly tier escalation */
export function getWebinarPrice(): number {
    const now = new Date()
    let activeIdx = 0
    for (let i = PRICING_TIERS.length - 1; i >= 0; i--) {
        if (now >= PRICING_TIERS[i].from) { activeIdx = i; break }
    }
    return PRICING_TIERS[activeIdx].price
}

/** Returns the next price increase date, or the webinar date if final price reached */
export function getNextPriceIncreaseDate(): Date {
    const now = new Date()
    const launch = new Date(WEBINAR_DATE.getTime() - 29 * 86400000)
    const t2 = new Date(launch.getTime() + 7 * 86400000)
    const t3 = new Date(launch.getTime() + 14 * 86400000)
    const t4 = new Date(launch.getTime() + 21 * 86400000)
    if (now < t2) return t2
    if (now < t3) return t3
    if (now < t4) return t4
    return WEBINAR_DATE
}

/* ── Scarcity Pricing ──────────────────────────────────── */

export function ScarcityPricing({ onCta }: { currentTier?: number; targetDate?: Date; onCta: () => void }) {
    const steps = PRICING_TIERS

    // Determine current step based on current date
    const now = new Date()
    let activeIdx = 0
    for (let i = steps.length - 1; i >= 0; i--) {
        if (now >= steps[i].from) { activeIdx = i; break }
    }
    const currentPrice = steps[activeIdx].price
    const nextIncrease = activeIdx < steps.length - 1 ? steps[activeIdx + 1].from : null

    return (
        <div id="register" className="space-y-10">
            {/* Price hero */}
            <div className="text-center space-y-2">
                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 font-bold">Price increases every 7 days</p>
                <div className="flex items-baseline justify-center gap-3">
                    <span className="text-lime text-5xl sm:text-6xl font-heading font-black leading-none">${currentPrice}</span>
                </div>
            </div>

            {/* Escalation pyramid */}
            <div className="max-w-lg mx-auto space-y-2.5">
                {steps.map((s, i) => {
                    const isActive = i === activeIdx
                    const isPast = i < activeIdx
                    const isFuture = i > activeIdx
                    return (
                        <div
                            key={i}
                            className={`flex items-center justify-between rounded-2xl border-2 transition-all ${
                                isActive
                                    ? 'border-lime/50 bg-lime/[0.08] shadow-[0_0_40px_rgba(208,255,113,0.12),inset_0_0_30px_rgba(208,255,113,0.04)] px-6 py-5'
                                    : isPast
                                        ? 'border-white/[0.08] bg-[#0D0D0D] px-5 py-4'
                                        : 'border-white/[0.10] bg-[#111111] px-5 py-4'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Step indicator */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    isActive
                                        ? 'bg-lime text-black'
                                        : isPast
                                            ? 'bg-white/[0.06] text-gray-600'
                                            : 'bg-white/[0.08] text-gray-400'
                                }`}>
                                    {isActive ? (
                                        <div className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
                                    ) : (
                                        <span className="text-[0.6rem] font-black">{i + 1}</span>
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${
                                        isActive ? 'text-white' : isPast ? 'text-gray-500' : 'text-gray-300'
                                    }`}>
                                        {s.label}
                                        {isActive && <span className="text-lime font-black ml-2">← CURRENT</span>}
                                    </p>
                                    {isFuture && (
                                        <p className="text-[0.6rem] text-gray-600 mt-0.5">+${s.price - steps[activeIdx].price} increase</p>
                                    )}
                                </div>
                            </div>
                            <p className={`font-heading font-black ${
                                isActive
                                    ? 'text-lime text-2xl'
                                    : isPast
                                        ? 'text-gray-600 text-lg line-through'
                                        : 'text-white text-xl'
                            }`}>${s.price}</p>
                        </div>
                    )
                })}
            </div>

            {/* Countdown to next increase */}
            {nextIncrease && (
                <div className="text-center space-y-3">
                    <p className="text-xs sm:text-sm text-red-500 uppercase tracking-[0.15em] font-black">
                        ⏰ Price increases to ${steps[activeIdx + 1].price} in
                    </p>
                    <CountdownTimer targetDate={nextIncrease} />
                </div>
            )}

            {/* CTA */}
            <CtaButton onClick={onCta} size="md" label={`RESERVE MY SEAT · $${currentPrice}`} />
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
        'Generating random AI images with no direction or consistency',
        'Hitting a wall after one or two outputs and not knowing where to go',
        'Using the same Pinterest references as every other designer',
        'Clients showing YOU AI-generated images, and you can\'t do better',
        'Falling behind competitors who\'ve already figured this out',
    ]
    const after = [
        'A complete system to go from sketch to full project with AI at every stage',
        'Consistent, fingerprint-level imagery that looks like YOUR work, not generic AI',
        'The ability to direct AI toward the exact results you want',
        'Storytelling through your imagery, from macro concept to blow-up detail shots',
        'The competitive edge that makes you indispensable, not replaceable',
    ]
    return (
        <div className="space-y-12">
            <SectionHeading sub="This isn't about learning another tool. It's about closing the gap between where you are and where the market demands you to be.">
                WHAT WILL YOU <span className="text-lime">WALK AWAY WITH?</span>
            </SectionHeading>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-white/[0.06]">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-red-400/60 mb-5">Without This Webinar</p>
                    <ul className="space-y-4">{before.map((b, i) => (
                        <li key={i} className="flex gap-3 text-[0.82rem] text-gray-500 leading-relaxed">
                            <XIcon className="w-4 h-4 text-red-500/50 shrink-0 mt-0.5" />{b}
                        </li>
                    ))}</ul>
                </div>
                <div className="rounded-2xl p-6 border border-lime/[0.12] bg-lime/[0.02]">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-lime mb-5">After This Webinar</p>
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
                    You won't just know how to prompt. You'll know how to <span className="text-lime font-semibold">think, direct, and execute</span> with AI — turning rough sketches into complete design projects at a speed and quality level that puts you ahead of 95% of designers still guessing.
                </p>
                <CtaButton onClick={onCta} label={`GO BEYOND THE AI PROMPT · $${getWebinarPrice()}`} size="md" />
            </div>
        </div>
    )
}

/* ── Value Stacking Table ──────────────────────────────── */

export function ValueTable() {
    const items = [
        { item: '2 days of live training with a real project walkthrough', value: '$250' },
        { item: 'AI workflow system for design projects', value: '$150' },
        { item: 'Storytelling framework for project presentations', value: '$40' },
        { item: '4 years of AI in the design industry, compressed into 3 hrs', value: 'Priceless' },
    ]
    return (
        <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl overflow-hidden max-w-md mx-auto">
            {items.map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 1 ? 'bg-white/[0.02]' : ''} ${i < items.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                    <span className="text-[0.82rem] text-gray-300">{row.item}</span>
                    <span className="ml-4 shrink-0 flex items-center gap-2">
                        <span className="text-[0.75rem] text-gray-700 line-through tabular-nums" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{row.value}</span>
                        <span className="text-[0.75rem] text-lime font-bold uppercase tracking-wider">FREE</span>
                    </span>
                </div>
            ))}
            <div className="flex items-center justify-between px-5 py-4 border-t-2 border-lime/20 bg-lime/[0.03]">
                <span className="text-sm font-bold text-white">Total real value</span>
                <span className="text-2xl font-heading font-black text-lime">$440+</span>
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

/* ── Upsell Products ─────────────────────────────────────── */

const UPSELLS = [
    {
        id: 'presentation-template',
        name: 'Professional Presentation Template',
        description: 'A ready-to-use template covering every stage of a design project, from brief to delivery.',
        price: 17,
        badge: 'LIMITED OFFER',
        features: [
            'Complete project presentation structure',
            'Moodboard & material board layouts',
            'Render showcase pages',
            'Client-ready export format',
        ],
        image: '/upsell-template.jpg',
    },
    {
        id: 'style-catalog',
        name: 'Interior Design Style Catalog',
        description: 'A visual catalog of 18 interior design styles with reference images, color palettes, and material suggestions.',
        price: 13,
        features: [
            '18 clearly defined design styles',
            'Color & material palette per style',
            'Real reference images',
            'Use as a client consultation tool',
        ],
        image: '/upsell-catalog.jpg',
    },
]

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
    const [error, setError] = useState(false)
    return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/10 via-zinc-900 to-black border border-amber-500/20 group">
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(245,158,11,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,158,11,0.05)_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <span className="text-[0.55rem] font-bold tracking-[0.2em] text-amber-500/60 uppercase mb-1">
                        PREVIEW ONLY
                    </span>
                    <span className="text-[0.7rem] font-heading font-black uppercase text-zinc-400 group-hover:text-amber-400 transition-colors">
                        {alt}
                    </span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setError(true)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            )}
        </div>
    )
}

const BASE_PRICE = getWebinarPrice()

export function LeadCaptureModal({ open, onClose }: {
    open: boolean
    onClose: () => void
}) {
    const [step, setStep] = useState<1 | 2>(1)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)

    const toggleUpsell = (id: string) => {
        setSelectedUpsells(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const total = useMemo(() => {
        let t = BASE_PRICE
        UPSELLS.forEach(u => { if (selectedUpsells.has(u.id)) t += u.price })
        return t
    }, [selectedUpsells])

    // ── Anti-spam validation ──
    const validateName = (val: string): string | null => {
        const trimmed = val.trim()
        if (!trimmed) return 'Please enter your name.'
        if (trimmed.length < 2) return 'Name is too short.'
        if (/\d/.test(trimmed)) return 'Name should not contain numbers.'
        if (/^[^a-zA-Z\u0600-\u06FF\u00C0-\u024F]+$/.test(trimmed)) return 'Please enter a valid name.'
        if (/(.)(\1{4,})/.test(trimmed)) return 'Please enter a real name.'
        return null
    }

    const validateEmail = (val: string): string | null => {
        const trimmed = val.trim()
        if (!trimmed) return 'Please enter your email.'
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
            return 'Please enter a valid email address.'
        }
        return null
    }

    const validatePhone = (val: string): string | null => {
        const trimmed = val.trim()
        if (!trimmed) return null // optional

        // Clean: remove spaces, dashes, parentheses
        const clean = trimmed.replace(/[\s\-()]/g, '')

        // Check for all identical digits (e.g. 999999999)
        const digitsOnly = clean.replace('+', '')
        if (/^(\d)\1+$/.test(digitsOnly)) {
            return 'Please enter a valid phone number.'
        }

        // Check for completely sequential digits (e.g. 123456789)
        let isSeq = true
        for (let i = 1; i < digitsOnly.length; i++) {
            const diff = digitsOnly.charCodeAt(i) - digitsOnly.charCodeAt(i - 1)
            if (Math.abs(diff) !== 1 && diff !== 0) {
                isSeq = false
                break
            }
        }
        if (isSeq) {
            return 'Please enter a valid phone number.'
        }

        // Smart check:
        // Must start with + or 00 (international) or 0 (local mobile)
        const isInternational = clean.startsWith('+') || clean.startsWith('00')
        const isLocal = clean.startsWith('0') && !clean.startsWith('00')

        if (!isInternational && !isLocal) {
            return 'Please include your country code (e.g., +971 50 123 4567).'
        }

        if (isInternational) {
            // Strip leading + or 00
            const intDigits = clean.startsWith('+') ? clean.substring(1) : clean.substring(2)
            // Most country codes + number are between 8 and 15 digits
            if (!/^[0-9]{8,15}$/.test(intDigits)) {
                return 'Please enter a valid international phone number.'
            }
        }

        if (isLocal) {
            // Local mobile number (typically 9 to 11 digits starting with 0)
            if (!/^[0-9]{9,11}$/.test(clean)) {
                return 'Please enter a valid phone number.'
            }
        }

        return null
    }

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const nameErr = validateName(name)
        if (nameErr) { setError(nameErr); return }
        const emailErr = validateEmail(email)
        if (emailErr) { setError(emailErr); return }
        const phoneErr = validatePhone(phone)
        if (phoneErr) { setError(phoneErr); return }

        setLoading(true)
        try {
            // Check if email already has a dashboard account
            const { data: exists, error: checkError } = await supabase.rpc('check_user_email_exists', {
                email_to_check: email.trim().toLowerCase()
            })
            
            if (checkError) {
                console.error('Email check error:', checkError)
            } else if (exists) {
                setError('This email is already registered to a dashboard account. Please sign in or use a different email.')
                setLoading(false)
                return
            }

            // Save lead using our new RPC function
            const { error: dbError } = await supabase.rpc('save_webinar_lead', {
                p_name: name.trim(),
                p_email: email.trim().toLowerCase(),
                p_phone: phone.trim() || null
            })
            
            if (dbError) {
                console.error('Lead save error:', dbError)
                setError('Failed to save registration info. Please try again.')
                setLoading(false)
                return
            }
            
            setStep(2)
        } catch (err) {
            console.error('Step 1 error:', err)
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCheckout = async () => {
        setIsProcessing(true)
        setError('')
        try {
            const origin = window.location.origin
            const productSlugs = ['webinar']
            if (selectedUpsells.has('presentation-template')) productSlugs.push('webinar-template')
            if (selectedUpsells.has('style-catalog')) productSlugs.push('webinar-catalog')

            console.log('[Checkout] Calling create-checkout-session with products:', productSlugs)

            // Direct fetch instead of supabase.functions.invoke to avoid SDK auth issues on public pages
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
            const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    products: productSlugs,
                    customer_email: email.trim().toLowerCase(),
                    customer_name: name.trim(),
                    success_url: `${origin}/webinar/upgrade?name=${encodeURIComponent(name.trim())}&email=${encodeURIComponent(email.trim())}`,
                    cancel_url: `${origin}/webinar`,
                }),
            })

            const data = await res.json()
            console.log('[Checkout] Response:', res.status, data)

            if (!res.ok) {
                throw new Error(data?.error || `Checkout failed (${res.status})`)
            }

            if (!data?.url) {
                throw new Error('Checkout session created but no redirect URL received')
            }

            console.log('[Checkout] Redirecting to Stripe:', data.url)
            window.location.href = data.url
        } catch (err: unknown) {
            console.error('[Checkout] Error:', err)
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
            setIsProcessing(false)
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
                        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-[#111] z-10">
                            <div>
                                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-lime font-bold mb-1">
                                    Step {step} of 2
                                </p>
                                <h3 className="font-heading font-black uppercase text-base text-white">
                                    {step === 1 ? 'Where should we send your access?' : 'Complete your order'}
                                </h3>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">✕</button>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.form
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleStep1}
                                    className="p-6 space-y-4"
                                >
                                    <div>
                                        <label className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-500 font-bold mb-1.5 block">Full Name *</label>
                                        <input
                                            type="text" value={name} onChange={e => setName(e.target.value)}
                                            placeholder="Full name"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-lime/40 focus:outline-none transition-colors"
                                            autoFocus
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
                                        CONTINUE →
                                    </button>

                                    <p className="text-[0.6rem] text-gray-600 text-center">We respect your privacy & information.</p>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-6 space-y-4"
                                >
                                    {/* Base product */}
                                    <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded bg-lime/20 flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-lime" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-white">2-Day AI Design Webinar</span>
                                                <p className="text-[0.6rem] text-gray-500 mt-0.5">Registered as: {name}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-heading font-black text-lime">${BASE_PRICE}</span>
                                    </div>

                                    {/* Upsells */}
                                    <p className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-500 font-bold pt-1">Enhance your experience</p>
                                    {UPSELLS.map(upsell => {
                                        const isSelected = selectedUpsells.has(upsell.id)
                                        return (
                                            <div
                                                key={upsell.id}
                                                className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-lime/40 bg-lime/[0.03]'
                                                        : 'border-white/[0.06] bg-black/20 hover:border-white/[0.12]'
                                                }`}
                                                onClick={() => toggleUpsell(upsell.id)}
                                            >
                                                {upsell.badge && (
                                                    <span className="text-[0.5rem] font-bold uppercase tracking-[0.15em] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full mb-2 inline-block">
                                                        {upsell.badge}
                                                    </span>
                                                )}
                                                <div className="flex items-start gap-3 relative pl-6">
                                                    {!isSelected && (
                                                        <span className="absolute left-0 top-0 text-red-500 font-bold text-sm leading-none select-none animate-flash-arrow">
                                                            ➔
                                                        </span>
                                                    )}
                                                    <div className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                                        isSelected ? 'bg-lime border-lime' : 'border-gray-600'
                                                    }`}>
                                                        {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[0.8rem] font-bold text-white leading-snug">
                                                            Add "{upsell.name}" +${upsell.price}
                                                        </h4>
                                                        <p className="text-[0.7rem] text-gray-400 leading-relaxed mt-1">{upsell.description}</p>
                                                        {upsell.image && (
                                                            <div className="mt-3 max-w-sm">
                                                                <ImageWithFallback src={upsell.image} alt={upsell.name} />
                                                            </div>
                                                        )}
                                                        <ul className="mt-2 space-y-1">
                                                            {upsell.features.map((f, i) => (
                                                                <li key={i} className="flex items-center gap-1.5 text-[0.65rem] text-gray-300">
                                                                    <Check className="w-2.5 h-2.5 text-lime shrink-0" />{f}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Order total */}
                                    <div className="bg-lime/[0.04] border border-lime/20 rounded-xl px-4 py-3 flex items-center justify-between">
                                        <span className="text-sm font-bold text-white">Total</span>
                                        <span className="text-xl font-heading font-black text-lime">${total}</span>
                                    </div>

                                    {/* Checkout button */}
                                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        className="w-full h-14 bg-lime text-black font-heading font-black uppercase text-sm rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 whitespace-nowrap enabled:hover:shadow-[0_0_30px_rgba(208,255,113,0.3)]"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                                <span>REDIRECTING TO STRIPE...</span>
                                            </>
                                        ) : (
                                            <span>COMPLETE PURCHASE · ${total}</span>
                                        )}
                                    </button>

                                    <div className="flex items-center justify-center gap-2 text-[0.6rem] text-gray-600">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>Secure payment · 100% money-back guarantee</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
