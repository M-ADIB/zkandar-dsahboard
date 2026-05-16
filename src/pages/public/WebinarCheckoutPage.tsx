import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react'
import { trackFBEvent } from '@/lib/fbpixel'
import logoSrc from '@/assets/logo.png'

/* ── Upsell Product Type ── */
interface UpsellProduct {
    id: string
    name: string
    description: string
    price: number
    badge?: string
    features: string[]
}

const BASE_PRODUCT = { name: '3-Day AI Design Webinar', price: 19 }

const UPSELLS: UpsellProduct[] = [
    {
        id: 'presentation-template',
        name: 'Professional Presentation Template',
        description: 'A ready-to-use presentation template covering every stage of a design project — from brief to delivery. Just drop in your images and you\'re done.',
        price: 17,
        badge: 'LIMITED OFFER',
        features: [
            'Complete project presentation structure',
            'Moodboard & material board layouts',
            'Render showcase pages',
            'Client-ready export format',
        ],
    },
    {
        id: 'style-catalog',
        name: 'Interior Design Style Catalog',
        description: 'A visual catalog of 18 interior design styles with real reference images, color palettes, and material suggestions. Helps clients understand what they want from day one.',
        price: 13,
        features: [
            '18 clearly defined design styles',
            'Color & material palette per style',
            'Real reference images',
            'Use as a client consultation tool',
        ],
    },
]

export default function WebinarCheckoutPage() {
    const [searchParams] = useSearchParams()
    const name = searchParams.get('name') || ''
    const email = searchParams.get('email') || ''

    const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        trackFBEvent('InitiateCheckout', { content_name: 'webinar_checkout', value: BASE_PRODUCT.price, currency: 'USD' })
    }, [])

    const toggleUpsell = (id: string) => {
        setSelectedUpsells(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const orderItems = useMemo(() => {
        const items = [{ name: BASE_PRODUCT.name, price: BASE_PRODUCT.price, qty: 1 }]
        UPSELLS.forEach(u => {
            if (selectedUpsells.has(u.id)) {
                items.push({ name: u.name, price: u.price, qty: 1 })
            }
        })
        return items
    }, [selectedUpsells])

    const total = useMemo(() => orderItems.reduce((s, i) => s + i.price * i.qty, 0), [orderItems])

    const handleCheckout = async () => {
        setIsProcessing(true)
        trackFBEvent('Purchase', {
            content_name: 'webinar_purchase',
            value: total,
            currency: 'USD',
            content_ids: ['webinar', ...Array.from(selectedUpsells)],
        })
        // TODO: Integrate Stripe checkout session creation
        // For now, simulate and redirect to success
        await new Promise(r => setTimeout(r, 1500))
        window.location.href = '/webinar/success'
    }

    return (
        <div className="min-h-screen bg-black text-white font-body selection:bg-lime/30 selection:text-black">
            {/* Top Nav */}
            <div className="border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center justify-between">
                <a href="/webinar" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back
                </a>
                <img src={logoSrc} alt="Zkandar" className="h-7 opacity-60" />
                <div className="w-16" />
            </div>

            {/* Step indicator */}
            <div className="max-w-3xl mx-auto px-5 pt-8">
                <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-lime/20 border border-lime/40 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-lime" />
                        </div>
                        <span className="text-lime font-bold">Your Details</span>
                    </div>
                    <div className="w-8 h-px bg-lime/30" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-lime flex items-center justify-center">
                            <span className="text-black font-black text-[0.6rem]">2</span>
                        </div>
                        <span className="text-white font-bold">Checkout</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-5 py-10 grid md:grid-cols-[1fr_320px] gap-8">
                {/* Left Column: Upsells */}
                <div className="space-y-6">
                    {/* Base product confirmation */}
                    <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-lime/20 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-lime" />
                                </div>
                                <span className="text-sm font-bold text-white">{BASE_PRODUCT.name}</span>
                            </div>
                            <span className="text-sm font-heading font-black text-lime">${BASE_PRODUCT.price}.00</span>
                        </div>
                        {name && <p className="text-xs text-gray-500 mt-2 ml-8">Registered as: {name} ({email})</p>}
                    </div>

                    {/* Upsell offers */}
                    {UPSELLS.map(upsell => {
                        const isSelected = selectedUpsells.has(upsell.id)
                        return (
                            <motion.div
                                key={upsell.id}
                                layout
                                className={`rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                                    isSelected
                                        ? 'border-lime/40 bg-lime/[0.03]'
                                        : 'border-white/[0.06] bg-[#0A0A0A] hover:border-white/[0.12]'
                                }`}
                                onClick={() => toggleUpsell(upsell.id)}
                            >
                                {upsell.badge && (
                                    <div className="inline-block mb-3">
                                        <span className="text-[0.55rem] font-bold uppercase tracking-[0.15em] bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">
                                            {upsell.badge}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isSelected ? 'bg-lime border-lime' : 'border-gray-600'
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-bold text-white">
                                                Yes! Add "{upsell.name}" for just ${upsell.price}
                                            </h3>
                                            <p className="text-[0.78rem] text-gray-400 leading-relaxed">{upsell.description}</p>
                                            <ul className="space-y-1.5 mt-3">
                                                {upsell.features.map((f, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                                                        <Check className="w-3 h-3 text-lime shrink-0" />{f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <span className="text-lg font-heading font-black text-lime shrink-0">${upsell.price}</span>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Right Column: Order Summary */}
                <div className="md:sticky md:top-8 self-start space-y-5">
                    <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.04]">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Order Summary</h3>
                        </div>

                        <div className="divide-y divide-white/[0.04]">
                            {orderItems.map((item, i) => (
                                <div key={i} className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-300">{item.name}</p>
                                        <p className="text-[0.6rem] text-gray-600">Qty: {item.qty}</p>
                                    </div>
                                    <span className="text-sm font-bold text-white">${item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="px-5 py-4 border-t-2 border-lime/20 bg-lime/[0.02] flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Order Total</span>
                            <span className="text-xl font-heading font-black text-lime">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full bg-lime text-black font-heading font-black uppercase text-sm py-4 rounded-xl hover:shadow-[0_0_30px_rgba(208,255,113,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isProcessing ? 'PROCESSING…' : `COMPLETE PURCHASE — $${total}`}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[0.65rem] text-gray-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Secure payment · 100% money-back guarantee</span>
                    </div>

                    <p className="text-[0.6rem] text-gray-700 text-center leading-relaxed">
                        * All payments are securely processed. We accept all major currencies.
                    </p>
                </div>
            </div>
        </div>
    )
}
