import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Crown, Gem, ShieldCheck, Loader2, ArrowRight, Sparkles, Zap, Users, Video, Award, Rocket, FileText, X } from 'lucide-react'
import { trackFBEvent } from '@/lib/fbpixel'
import logoSrc from '@/assets/logo.png'
import toast from 'react-hot-toast'

/* ── Tier Type ── */
interface TierDef {
    id: string
    name: string
    tagline: string
    price: number
    icon: typeof Crown
    color: string
    gradient: string
    borderColor: string
    accentColor: string
    bgGlow: string
    badge?: string
    features: { icon: typeof Crown; text: string }[]
}

/* ── Upgrade Tiers ── */
const SILVER_TIER: TierDef = {
    id: 'silver',
    name: 'Silver',
    tagline: 'Go beyond the live sessions. Own the knowledge.',
    price: 59,
    icon: Crown,
    color: 'amber',
    gradient: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'border-amber-500/30',
    accentColor: 'text-amber-400',
    bgGlow: 'shadow-[0_0_40px_rgba(245,158,11,0.08)]',
    features: [
        { icon: Video, text: 'Full workshop recordings — rewatch both days at your own pace, forever' },
        { icon: Zap, text: 'Live Q&A priority — your questions get answered first during the workshop' },
        { icon: Award, text: 'AI Certificate from Zkandar — proof you went beyond the prompt' },
    ],
}

const GOLD_TIER: TierDef = {
    id: 'gold',
    name: 'Gold',
    tagline: 'The full transformation. Personal mentoring included.',
    price: 149,
    icon: Gem,
    color: 'lime',
    gradient: 'from-lime/20 to-green-600/5',
    borderColor: 'border-lime/30',
    accentColor: 'text-lime',
    bgGlow: 'shadow-[0_0_40px_rgba(208,255,113,0.08)]',
    badge: 'BEST VALUE',
    features: [
        { icon: Sparkles, text: 'Everything in Silver — recordings, priority Q&A, and AI certificate' },
        { icon: Video, text: 'Full workshop recordings — lifetime access to both days' },
        { icon: FileText, text: 'Complete workshop PDF — the entire system documented for reference' },
        { icon: Zap, text: 'Live Q&A priority — your questions answered first' },
        { icon: Award, text: 'AI Certificate from Zkandar — recognized completion credential' },
        { icon: Users, text: '1-on-1 call with Khaled (30 min) — personalized to your workflow' },
        { icon: Rocket, text: 'Early access to the Sprint Workshop — locked-in priority registration' },
    ],
}

export default function WebinarUpgradePage() {
    const [searchParams] = useSearchParams()
    const name = searchParams.get('name') || ''
    const email = searchParams.get('email') || ''

    const [selectedTier, setSelectedTier] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        trackFBEvent('ViewContent', { content_name: 'webinar_upgrade_page', email })
    }, [email])

    const handleUpgrade = async (tierId: string, price: number) => {
        if (!email) {
            toast.error('Email parameter is missing in the URL. Cannot proceed with one-click upgrade.');
            return;
        }

        setSelectedTier(tierId)
        setIsProcessing(true)
        trackFBEvent('Purchase', {
            content_name: `webinar_upgrade_${tierId}`,
            value: price,
            currency: 'USD',
        })

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const res = await fetch(`${supabaseUrl}/functions/v1/confirm-upgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    tierId,
                    price,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to complete one-click upgrade.');
            }

            toast.success(`Successfully upgraded to ${tierId === 'gold' ? 'Gold' : 'Silver'} Tier!`);
            
            // Redirect to success page with parameters
            window.location.href = `/webinar/success?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&upgraded=true&tier=${tierId}`;
        } catch (err: any) {
            console.error('Upgrade error:', err);
            toast.error(err.message || 'Payment failed. Please try again.');
        } finally {
            setIsProcessing(false)
            setSelectedTier(null)
        }
    }

    const handleSkip = () => {
        trackFBEvent('CustomEvent', { content_name: 'webinar_upgrade_skipped' })
        window.location.href = '/webinar/success'
    }

    return (
        <div className="min-h-screen bg-black text-white font-body selection:bg-lime/30 selection:text-black relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-lime/[0.06] to-transparent rounded-full blur-[120px] pointer-events-none" />

            {/* Top Nav */}
            <div className="relative border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center justify-center">
                <img src={logoSrc} alt="Zkandar" className="h-7 opacity-60" />
            </div>

            {/* Urgency Banner */}
            <div className="relative bg-amber-500/[0.08] border-b border-amber-500/20 py-3.5 px-4 text-center">
                <p className="text-sm font-bold text-amber-400 flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    WAIT — You're not done yet, {name || 'there'}.
                </p>
                <p className="text-[0.7rem] text-amber-300/60 mt-1">Your seat is confirmed. But this one-time offer disappears when you leave this page.</p>
            </div>

            {/* Main Content */}
            <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-12 md:py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-4 mb-12"
                >
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 font-bold">
                        EXCLUSIVE ONE-TIME OFFER
                    </p>
                    <h1 className="font-heading font-black uppercase text-[clamp(1.5rem,4vw,2.8rem)] leading-[0.93] tracking-[0.01em]">
                        DON'T JUST WATCH.<br className="hidden sm:block" /> <span className="text-lime">OWN THE SYSTEM.</span>
                    </h1>
                    <p className="text-[0.9rem] text-gray-400 max-w-xl mx-auto leading-relaxed">
                        You've secured your seat to Beyond the AI Prompt. Now decide how deep you want to go — do you want to <strong className="text-white">watch</strong> it, or do you want to <strong className="text-white">own</strong> it?
                    </p>
                    <p className="text-[0.65rem] text-red-400/70 font-bold uppercase tracking-wider">
                        ⏰ This offer disappears when you leave this page
                    </p>
                </motion.div>

                {/* Tier Cards */}
                <div className="grid md:grid-cols-2 gap-5 mb-10">
                    {/* Silver Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        <TierCard
                            tier={SILVER_TIER}
                            isProcessing={isProcessing && selectedTier === SILVER_TIER.id}
                            disabled={isProcessing}
                            onUpgrade={() => handleUpgrade(SILVER_TIER.id, SILVER_TIER.price)}
                        />
                    </motion.div>

                    {/* Gold Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                    >
                        <TierCard
                            tier={GOLD_TIER}
                            isProcessing={isProcessing && selectedTier === GOLD_TIER.id}
                            disabled={isProcessing}
                            onUpgrade={() => handleUpgrade(GOLD_TIER.id, GOLD_TIER.price)}
                            featured
                        />
                    </motion.div>
                </div>

                {/* Comparison Table */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-10"
                >
                    <h3 className="font-heading font-black uppercase text-sm text-white mb-6 text-center tracking-wide">
                        WHAT'S THE <span className="text-lime">DIFFERENCE?</span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left py-3 text-gray-500 font-bold uppercase tracking-wider">Feature</th>
                                    <th className="py-3 text-gray-500 font-bold uppercase tracking-wider text-center w-24">Standard</th>
                                    <th className="py-3 text-amber-400 font-bold uppercase tracking-wider text-center w-24">Silver</th>
                                    <th className="py-3 text-lime font-bold uppercase tracking-wider text-center w-24">Gold</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {[
                                    { feature: '2-day live workshop access', standard: true, silver: true, gold: true },
                                    { feature: 'Workshop recordings (lifetime)', standard: false, silver: true, gold: true },
                                    { feature: 'Complete workshop PDF', standard: false, silver: false, gold: true },
                                    { feature: 'Priority Q&A', standard: false, silver: true, gold: true },
                                    { feature: 'AI Certificate from Zkandar', standard: false, silver: true, gold: true },
                                    { feature: '1-on-1 call with Khaled (30 min)', standard: false, silver: false, gold: true },
                                    { feature: 'Early access to Sprint Workshop', standard: false, silver: false, gold: true },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.01]">
                                        <td className="py-2.5 text-gray-300 pr-4">{row.feature}</td>
                                        <td className="py-2.5 text-center">
                                            {row.standard ? <Check className="w-3.5 h-3.5 text-gray-500 mx-auto" /> : <X className="w-3.5 h-3.5 text-gray-700 mx-auto" />}
                                        </td>
                                        <td className="py-2.5 text-center">
                                            {row.silver ? <Check className="w-3.5 h-3.5 text-amber-400 mx-auto" /> : <X className="w-3.5 h-3.5 text-gray-700 mx-auto" />}
                                        </td>
                                        <td className="py-2.5 text-center">
                                            {row.gold ? <Check className="w-3.5 h-3.5 text-lime mx-auto" /> : <X className="w-3.5 h-3.5 text-gray-700 mx-auto" />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Trust + Skip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-center space-y-5"
                >
                    <div className="flex items-center justify-center gap-2 text-[0.65rem] text-gray-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Secure checkout · Instant access after purchase</span>
                    </div>

                    <button
                        onClick={handleSkip}
                        disabled={isProcessing}
                        className="text-[0.7rem] text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2 disabled:opacity-50"
                    >
                        No thanks, continue with standard access →
                    </button>
                </motion.div>
            </div>
        </div>
    )
}

/* ── Tier Card Component ── */

function TierCard({ tier, isProcessing, disabled, onUpgrade, featured = false }: {
    tier: TierDef
    isProcessing: boolean
    disabled: boolean
    onUpgrade: () => void
    featured?: boolean
}) {
    const Icon = tier.icon
    return (
        <div className={`relative rounded-2xl border-2 p-6 md:p-7 h-full flex flex-col transition-all ${
            featured
                ? `${tier.borderColor} bg-gradient-to-b ${tier.gradient} ${tier.bgGlow}`
                : `${tier.borderColor} bg-[#0A0A0A] hover:${tier.bgGlow}`
        }`}>
            {/* Badge */}
            {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[0.55rem] font-black uppercase tracking-[0.15em] bg-lime text-black px-4 py-1.5 rounded-full">
                        {tier.badge}
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    featured ? 'bg-lime/10' : 'bg-amber-500/10'
                }`}>
                    <Icon className={`w-6 h-6 ${tier.accentColor}`} />
                </div>
                <div>
                    <h3 className={`font-heading font-black uppercase text-lg ${tier.accentColor}`}>{tier.name}</h3>
                    <p className="text-[0.75rem] text-gray-400 mt-0.5">{tier.tagline}</p>
                </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-[0.6rem] text-gray-600 uppercase tracking-wider font-bold">Add for just</span>
                <span className={`text-3xl font-heading font-black ${tier.accentColor}`}>${tier.price}</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 flex-1 mb-7">
                {tier.features.map((f, i) => {
                    const FIcon = f.icon
                    return (
                        <li key={i} className="flex gap-3 text-[0.78rem] text-gray-300 leading-relaxed">
                            <FIcon className={`w-4 h-4 ${tier.accentColor} shrink-0 mt-0.5`} />
                            <span>{f.text}</span>
                        </li>
                    )
                })}
            </ul>

            {/* CTA */}
            <button
                onClick={onUpgrade}
                disabled={disabled}
                className={`w-full font-heading font-black uppercase text-sm py-4 rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    featured
                        ? 'bg-lime text-black hover:shadow-[0_0_30px_rgba(208,255,113,0.35)]'
                        : 'bg-amber-500/90 text-black hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                }`}
            >
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        UPGRADE TO {tier.name.toUpperCase()}
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    )
}
