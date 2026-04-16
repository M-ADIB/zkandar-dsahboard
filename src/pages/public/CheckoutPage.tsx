import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Loader2, Phone, Calendar, Shield, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import logoSrc from '../../assets/logo.png'

const WHAT_YOU_GET = [
    '3 days of live, hands-on AI design sessions',
    'Prompt engineering for architectural output',
    'Site analysis, concept sketching, and render workflows',
    'All session recordings + lifetime access to materials',
    'Private cohort Slack channel',
    'Post-sprint 1-on-1 follow-up session',
]

// TODO: Replace with your actual Calendly URL
const CALENDLY_URL = 'https://calendly.com/zkandar/sprint-questions'

export function CheckoutPage() {
    const hasQuestions = new URLSearchParams(window.location.search).get('questions') === 'true'
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCheckout = async () => {
        setLoading(true)
        setError(null)

        const origin = window.location.origin
        const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                product: 'sprint',
                success_url: `${origin}/checkout-success?source=checkout`,
                cancel_url: `${origin}/checkout`,
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
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <div className="border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center justify-between">
                <a href="/test-landingpage" className="flex items-center">
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                </a>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Shield className="h-3.5 w-3.5" />
                    Secure checkout
                </div>
            </div>

            <div className="max-w-lg mx-auto px-5 sm:px-6 py-12 sm:py-20">

                {/* "Book a call" banner */}
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

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <p className="text-xs font-bold tracking-widest text-lime/70 uppercase mb-2">Sprint Workshop</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Complete your enrollment</h1>
                </motion.div>

                {/* Order card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden mb-6"
                >
                    {/* Product header */}
                    <div className="relative h-32 overflow-hidden">
                        <img src="/lander/4.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
                        <div className="absolute bottom-4 left-5">
                            <p className="text-xs font-bold tracking-widest text-lime/80 uppercase">Zkandar AI</p>
                            <h2 className="text-lg font-bold text-white">Sprint Workshop</h2>
                        </div>
                    </div>

                    {/* What's included */}
                    <div className="p-5 border-b border-white/[0.06]">
                        <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-3">What's included</p>
                        <div className="space-y-2">
                            {WHAT_YOU_GET.map((item, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-lime shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Total (one-time payment)</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-2xl font-black text-white">8,500</span>
                                <span className="text-sm font-semibold text-gray-400">AED</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            3-day program
                        </div>
                    </div>
                </motion.div>

                {/* Checkout button */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    {error && (
                        <p className="text-sm text-red-400 mb-3 text-center">{error}</p>
                    )}
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl gradient-lime text-black font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Redirecting to Stripe...</>
                        ) : (
                            <>Pay 8,500 AED <ArrowRight className="h-5 w-5" /></>
                        )}
                    </button>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <Shield className="h-3.5 w-3.5 text-gray-600" />
                        <p className="text-xs text-gray-600">Secured by Stripe · Card details never touch our servers</p>
                    </div>
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
