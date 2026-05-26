import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Phone, Calendar, Shield, CheckCircle2, User, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { trackFBEvent } from '@/lib/fbpixel'
import logoSrc from '../../assets/logo.png'

const SPRINT_INCLUSIONS = [
    '3 live days of hands-on AI training',
    'Real client-ready deliverables by Day 3',
    'Access to session recordings',
]

const CALENDLY_URL = 'https://calendly.com/zkandar/sprint-questions'

function PurpleCheckItem({ text, delay = 0 }: { text: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.35 }}
            className="flex items-start gap-3"
        >
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-300 font-body">{text}</span>
        </motion.div>
    )
}

export function CheckoutPage() {
    const params = new URLSearchParams(window.location.search)
    const hasQuestions = params.get('questions') === 'true'
    const isTestMode = params.get('test') === 'true'
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sprintDates, setSprintDates] = useState('June 3–5')
    const [sprintLocation, setSprintLocation] = useState('Live Zoom')
    const [customerName, setCustomerName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')

    useEffect(() => {
        supabase.from('platform_settings').select('key, value')
            .in('key', ['marketing_sprint_dates', 'marketing_sprint_location'])
            .then(({ data }) => {
                if (!data) return
                const map: Record<string, string> = {}
                ;(data as { key: string; value: string }[]).forEach(r => { map[r.key] = r.value })
                if (map.marketing_sprint_dates) setSprintDates(map.marketing_sprint_dates)
                if (map.marketing_sprint_location !== undefined) setSprintLocation(map.marketing_sprint_location)
            })
    }, [])

    const handleCheckout = async () => {
        // Validate required fields
        if (!customerName.trim() || !customerEmail.trim()) {
            setError('Please enter your full name and email address.')
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
            setError('Please enter a valid email address.')
            return
        }

        setLoading(true)
        setError(null)
        trackFBEvent('InitiateCheckout', { content_name: 'sprint_workshop', value: 0, currency: 'USD' })

        const origin = window.location.origin
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

        let data: { url?: string; error?: string } | null = null
        let fetchError: string | null = null

        try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    product: isTestMode ? 'test' : 'sprint',
                    customer_name: customerName.trim(),
                    customer_email: customerEmail.trim().toLowerCase(),
                    success_url: `${origin}/checkout-success?source=checkout`,
                    cancel_url: `${origin}/checkout${isTestMode ? '?test=true' : ''}`,
                }),
            })
            data = await res.json()
            if (!res.ok) fetchError = data?.error ?? `Request failed (${res.status})`
        } catch (err) {
            fetchError = err instanceof Error ? err.message : 'Network error'
        }

        if (fetchError || !data?.url) {
            setError(data?.error ?? fetchError ?? 'Something went wrong. Please try again.')
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
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Shield className="h-3.5 w-3.5" />
                    Secure checkout
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-20">

                {/* "Book a call" banner — shown when user has questions */}
                {hasQuestions && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] flex items-start gap-3"
                    >
                        <Phone className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-300">You mentioned you have questions</p>
                            <p className="text-xs text-amber-400/70 mt-0.5 mb-2">
                                Khaled and the Zkandar team are available for a 15-minute call before you commit.
                            </p>
                            <a
                                href={CALENDLY_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                Book a 15-min call with Khaled
                                <ArrowRight className="h-3 w-3" />
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* Test mode banner */}
                {isTestMode && (
                    <div className="mb-6 p-3.5 rounded-2xl border border-yellow-500/40 bg-yellow-500/[0.06] flex items-center gap-3">
                        <span className="text-lg">🧪</span>
                        <div>
                            <p className="text-sm font-bold text-yellow-300">TEST MODE — $2 charge only</p>
                            <p className="text-xs text-yellow-400/70 mt-0.5">
                                Using Stripe test card <strong className="text-yellow-300">4242 4242 4242 4242</strong> · Exp: any future date · CVC: any 3 digits
                            </p>
                        </div>
                    </div>
                )}

                {/* ── AI SPRINT WORKSHOP CARD (matches main lander) ──────── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
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

                        {/* Price */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Total (one-time payment)</p>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="font-heading font-black text-3xl text-white">12,500</span>
                                    <span className="text-sm font-semibold text-gray-400">AED</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/5" />

                        {/* Your details */}
                        <div className="space-y-4">
                            <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">Your details</p>
                            <div className="space-y-3">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Full name"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 text-sm font-body focus:outline-none focus:border-purple-400/40 transition-colors"
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={customerEmail}
                                        onChange={e => setCustomerEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 text-sm font-body focus:outline-none focus:border-purple-400/40 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/5" />

                        {/* CTA */}
                        <div className="space-y-3">
                            {error && (
                                <p className="text-sm text-red-400 text-center">{error}</p>
                            )}
                            <button
                                onClick={handleCheckout}
                                disabled={loading}
                                className="group w-full flex items-center justify-center gap-3 px-8 py-4 font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-wider hover:-translate-y-0.5 font-heading disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
                            >
                                {loading ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> Redirecting to Stripe...</>
                                ) : isTestMode ? (
                                    <>🧪 Test Payment ($2) <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                ) : (
                                    <>Pay 12,500 AED <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                            <div className="flex items-center justify-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-gray-600" />
                                <p className="text-xs text-gray-600">Secured by Stripe · Card details never touch our servers</p>
                            </div>
                        </div>

                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />
                </motion.div>

                {/* Footer links */}
                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-600">
                    <a href="/not-sure" className="hover:text-gray-400 transition">Not sure yet?</a>
                    <span>·</span>
                    <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Talk to the team</a>
                </div>
            </div>
        </div>
    )
}
