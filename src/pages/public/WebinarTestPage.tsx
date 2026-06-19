import { useState } from 'react'
import { CreditCard, Loader2, AlertTriangle, Zap } from 'lucide-react'
import logoSrc from '../../assets/logo.png'

export default function WebinarTestPage() {
    const [name, setName] = useState('Test User')
    const [email, setEmail] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState('')
    const [log, setLog] = useState<string[]>([])

    const addLog = (msg: string) => {
        setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
    }

    const handleTestCheckout = async () => {
        if (!email) { setError('Enter your email'); return }
        setIsProcessing(true)
        setError('')
        addLog('Starting $2 test checkout...')

        try {
            const origin = window.location.origin
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

            addLog(`POST → ${SUPABASE_URL}/functions/v1/create-checkout-session`)

            const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    products: ['test'],
                    customer_email: email.trim().toLowerCase(),
                    customer_name: name.trim(),
                    success_url: `${origin}/webinar/success?test=true`,
                    cancel_url: `${origin}/webinar/test`,
                }),
            })

            const data = await res.json()
            addLog(`Response: ${res.status} ${JSON.stringify(data).substring(0, 200)}`)

            if (!res.ok) {
                throw new Error(data?.error || `Checkout failed (${res.status})`)
            }

            if (!data?.url) {
                throw new Error('No redirect URL received')
            }

            addLog(`✅ Redirecting to Stripe: ${data.url.substring(0, 60)}...`)
            window.location.href = data.url
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            addLog(`❌ Error: ${msg}`)
            setError(msg)
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white font-body">
            {/* Nav */}
            <div className="border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center justify-between">
                <a href="/webinar" className="flex items-center gap-3">
                    <img src={logoSrc} alt="Zkandar" className="h-8 object-contain" />
                </a>
                <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full">
                    TEST MODE
                </span>
            </div>

            <div className="max-w-lg mx-auto px-5 py-16 space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Stripe Integration Test
                    </div>
                    <h1 className="font-heading font-black uppercase text-3xl text-white">
                        $2 Test Checkout
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                        This will create a real $2.00 USD Stripe charge to verify the full flow:
                        checkout → webhook → DB update → confirmation email.
                    </p>
                </div>

                {/* Flow Diagram */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-3">
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">What gets tested</p>
                    {[
                        'Stripe Checkout Session creation (with metadata)',
                        'Payment processing ($2.00 USD)',
                        'Webhook: checkout.session.completed → signature verification',
                        'DB: webinar_purchases updated to "completed"',
                        'DB: webinar_leads payment_status → "paid"',
                        'Email: Resend booking confirmation sent',
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <div className="h-5 w-5 rounded-full bg-lime/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-lime">{i + 1}</span>
                            </div>
                            <span className="text-sm text-gray-300">{step}</span>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition"
                            placeholder="Test User"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Email (receives confirmation)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition"
                            placeholder="your@email.com"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleTestCheckout}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, #D0FF71, #5A9F2E)',
                            color: '#000',
                        }}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating Stripe Session...
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4" />
                                Pay $2.00 — Test Full Flow
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-600 text-center">
                        Use Stripe test card: <code className="text-gray-400">4242 4242 4242 4242</code> — Any future exp — Any CVC
                    </p>
                </div>

                {/* Console Log */}
                {log.length > 0 && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-3.5 w-3.5 text-lime" />
                            <span className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500">Console</span>
                        </div>
                        {log.map((entry, i) => (
                            <div key={i} className="font-mono text-xs text-gray-400 leading-relaxed break-all">
                                {entry}
                            </div>
                        ))}
                    </div>
                )}

                {/* Stripe Test Cards Reference */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-3">Stripe Test Cards</p>
                    <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-gray-400">
                            <span>Success:</span>
                            <span className="text-green-400">4242 4242 4242 4242</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Declined:</span>
                            <span className="text-red-400">4000 0000 0000 0002</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>3D Secure:</span>
                            <span className="text-yellow-400">4000 0025 0000 3155</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
