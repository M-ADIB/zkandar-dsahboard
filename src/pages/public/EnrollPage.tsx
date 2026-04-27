import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
    CheckCircle2, ArrowRight, Loader2, Shield, Clock,
    Zap, Users, Star, AlertTriangle, Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import logoSrc from '../../assets/logo.png'

// ── Configuration ─────────────────────────────────────────────────────────────
const ENROLLMENT_DEADLINE = new Date('2026-05-13T23:59:59')
const SPOTS_REMAINING = 4

const VALUE_STACK = [
    { item: '3 Day Live Sprint Workshop', value: '8,500 AED', included: true },
    { item: 'Lifetime access to all session recordings', value: '1,200 AED', included: true },
    { item: 'AI Prompt Library (200+ architecture-specific prompts)', value: '800 AED', included: true },
    { item: 'Private cohort community (Slack)', value: '400 AED', included: true },
    { item: 'Post sprint 1 on 1 follow up session', value: '600 AED', included: true },
    { item: 'Zkandar AI Certification of Completion', value: 'Priceless', included: true },
]

const WHAT_YOU_WILL_DO = [
    {
        icon: Zap,
        title: 'Day 1: Foundation',
        body: 'Identify your AI design stack. Run your first prompt to render workflow on a live brief. Learn to direct AI like a tool you own.',
    },
    {
        icon: Star,
        title: 'Day 2: In Depth',
        body: 'Master prompting. From mediocre output to advanced, client ready results. The gap between generic AI and precision AI is in this session.',
    },
    {
        icon: Users,
        title: 'Day 3: Full Circle',
        body: 'Package your results for client presentation. Walk out with deliverables, a workflow you can repeat, and the confidence to pitch AI directed work.',
    },
]

const WHAT_YOU_LEAVE_WITH = [
    'A complete AI design workflow you own and can repeat',
    'A portfolio of renders from actual project briefs',
    'A prompt library that keeps working after the Sprint ends',
    'The ability to generate renders in 20 minutes, not 3 weeks',
    'Confidence to pitch AI directed work to any client',
]

const CALENDLY_URL = 'https://calendly.com/zkandar/sprint-questions'

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(deadline: Date) {
    const calcRemaining = () => {
        const diff = Math.max(0, deadline.getTime() - Date.now())
        return {
            days: Math.floor(diff / 86_400_000),
            hours: Math.floor((diff % 86_400_000) / 3_600_000),
            minutes: Math.floor((diff % 3_600_000) / 60_000),
            seconds: Math.floor((diff % 60_000) / 1_000),
            expired: diff === 0,
        }
    }
    const [remaining, setRemaining] = useState(calcRemaining)
    useEffect(() => {
        const id = setInterval(() => setRemaining(calcRemaining()), 1000)
        return () => clearInterval(id)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return remaining
}

// ── Components ────────────────────────────────────────────────────────────────
function CountdownBlock({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-heading font-black text-white tabular-nums">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1.5 font-body">{label}</span>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function EnrollPage() {
    const countdown = useCountdown(ENROLLMENT_DEADLINE)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const checkoutRef = useRef<HTMLDivElement>(null)

    const handleCheckout = async () => {
        setLoading(true)
        setError(null)

        const origin = window.location.origin
        const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                product: 'sprint',
                success_url: `${origin}/checkout-success?source=enroll`,
                cancel_url: `${origin}/enroll`,
            },
        })

        if (fnError || !data?.url) {
            setError(data?.error ?? fnError?.message ?? 'Something went wrong. Please try again.')
            setLoading(false)
            return
        }

        window.location.href = data.url
    }

    return (
        <div className="min-h-screen bg-black text-white font-body">
            {/* Nav */}
            <div className="border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center justify-between">
                <a href="/main" className="flex items-center gap-3">
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                </a>
                <button
                    onClick={() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-xs font-medium text-lime hover:text-lime/80 transition flex items-center gap-1"
                >
                    Jump to checkout <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* ── SECTION 1: URGENCY ─────────────────────────────────────────────── */}
            <div className="bg-[#0A0A00] border-b border-yellow-500/20">
                <div className="max-w-4xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
                    <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
                        {/* Spots */}
                        <motion.div
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 text-center sm:text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Enrollment closing soon
                            </div>
                            <h2 className="font-heading font-black uppercase text-[clamp(1.6rem,4vw,2.8rem)] leading-[0.95] text-white mb-3">
                                Only <span className="text-yellow-400">{SPOTS_REMAINING} spots</span> left<br />
                                in the next cohort.
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
                                We deliberately keep cohorts small so every participant gets real attention.
                                Once these fill, the next opening won't be for 6 to 8 weeks.
                            </p>
                        </motion.div>

                        {/* Countdown */}
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="shrink-0 text-center"
                        >
                            <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-3">Enrollment closes in</p>
                            {countdown.expired ? (
                                <p className="text-lg font-heading font-black uppercase text-red-400">Enrollment closed</p>
                            ) : (
                                <div className="flex items-end gap-2">
                                    <CountdownBlock value={countdown.days} label="days" />
                                    <span className="text-2xl font-heading font-black text-white/30 pb-4">:</span>
                                    <CountdownBlock value={countdown.hours} label="hrs" />
                                    <span className="text-2xl font-heading font-black text-white/30 pb-4">:</span>
                                    <CountdownBlock value={countdown.minutes} label="min" />
                                    <span className="text-2xl font-heading font-black text-white/30 pb-4">:</span>
                                    <CountdownBlock value={countdown.seconds} label="sec" />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 2: VALUE ───────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-20 space-y-16">

                {/* Transformation headline */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-4">Sprint Workshop — What actually happens</p>
                    <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,4vw,3rem)] leading-[0.95] text-white mb-4">
                        In 3 days, you go from<br />
                        <span className="text-lime">"I've seen AI demos"</span> to<br />
                        <span className="text-white">"I just ran a client workflow."</span>
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto leading-relaxed text-sm">
                        This isn't a course. There are no slides. Every session is live,
                        hands on, and built around real project briefs.
                    </p>
                </motion.div>

                {/* 3-day program label with inline countdown */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6"
                >
                    <div>
                        <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-1">The Program</p>
                        <h3 className="font-heading font-black uppercase text-xl text-white">
                            3 Day Sprint Program
                            {!countdown.expired && (
                                <span className="ml-3 text-lime text-base tabular-nums">
                                    [{String(countdown.hours).padStart(2,'0')}:{String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}]
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">Build AI skills and real project deliverables in 3 intensive days</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Calendar className="h-4 w-4 text-lime" />
                        <span className="text-sm font-bold text-lime">May 13–15, 2026</span>
                    </div>
                </motion.div>

                {/* 3-day breakdown */}
                <div className="grid sm:grid-cols-3 gap-5">
                    {WHAT_YOU_WILL_DO.map((day, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.15] transition-colors"
                        >
                            <div className="h-9 w-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center mb-4">
                                <day.icon className="h-4 w-4 text-lime" />
                            </div>
                            <h3 className="font-heading font-black uppercase text-sm text-white mb-2">{day.title}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{day.body}</p>
                        </motion.div>
                    ))}
                </div>

                {/* What you leave with */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-lime/[0.03] border border-lime/10 rounded-2xl p-7"
                >
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-lime/60 mb-4">You walk out with</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {WHAT_YOU_LEAVE_WITH.map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-lime shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-200 leading-snug">{item}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Value stack */}
                <div>
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-4">Everything that's included</p>
                    <div className="space-y-2">
                        {VALUE_STACK.map((row, i) => (
                            <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05]">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-lime shrink-0" />
                                    <span className="text-sm text-gray-300">{row.item}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-400 shrink-0">{row.value}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between gap-4 pt-3">
                            <span className="text-sm font-bold text-white">Total value</span>
                            <span className="text-sm font-bold text-gray-400 line-through">11,500+ AED</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="font-heading font-black uppercase text-base text-white">Your investment</span>
                            <div className="text-right">
                                <span className="font-heading font-black text-2xl text-lime">8,500 AED</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero image */}
                <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden">
                    <img src="/lander/15.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 flex items-center px-8">
                        <div>
                            <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-lime/70 mb-2">AI-generated</p>
                            <h3 className="font-heading font-black uppercase text-xl sm:text-2xl text-white max-w-xs leading-[0.95]">
                                20 minutes.<br />
                                <span className="text-lime">Not 3 weeks.</span>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION 3: CHECKOUT ────────────────────────────────────────────── */}
            <div ref={checkoutRef} className="bg-white/[0.01] border-t border-white/[0.06]">
                <div className="max-w-lg mx-auto px-5 sm:px-6 py-16">

                    {/* Countdown repeat */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Clock className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-yellow-400 font-medium">
                            {countdown.expired
                                ? 'Enrollment closed'
                                : `Closes in ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
                            }
                        </span>
                        <span className="text-gray-600 text-sm">·</span>
                        <span className="text-sm text-gray-400">{SPOTS_REMAINING} spots left</span>
                    </div>

                    {/* Order card */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden mb-5">
                        <div className="px-6 py-5 border-b border-white/[0.06]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-heading font-black uppercase text-sm text-white">Sprint Workshop</span>
                                <span className="text-xs font-bold text-lime bg-lime/10 border border-lime/20 px-2 py-0.5 rounded-md">Next cohort</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">3 Day Sprint Program · Small cohort · Full AI design workflow</p>
                        </div>
                        <div className="px-6 py-5 space-y-2.5">
                            {VALUE_STACK.map((row, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-lime shrink-0" />
                                    <span className="text-xs text-gray-400">{row.item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500">One-time payment</p>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="font-heading font-black text-3xl text-white">8,500</span>
                                    <span className="text-sm text-gray-400 font-semibold">AED</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600 line-through">11,500 AED</p>
                                <p className="text-xs font-bold text-lime">Save 3,000 AED</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    {error && (
                        <p className="text-sm text-red-400 mb-3 text-center">{error}</p>
                    )}
                    <button
                        onClick={handleCheckout}
                        disabled={loading || countdown.expired}
                        className="w-full py-4 rounded-2xl gradient-lime text-black font-body font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Redirecting to Stripe...</>
                        ) : (
                            <>Secure my spot — 8,500 AED <ArrowRight className="h-5 w-5" /></>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-3">
                        <Shield className="h-3.5 w-3.5 text-gray-600" />
                        <p className="text-xs text-gray-600">256-bit SSL · Secured by Stripe · No data stored on our servers</p>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600">
                        <a href="/not-sure" className="hover:text-gray-400 transition">Still not sure?</a>
                        <span>·</span>
                        <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">
                            Talk to Khaled first
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
