import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Calendar, Mail } from 'lucide-react'
import { trackFBEvent } from '@/lib/fbpixel'
import { getWebinarPrice } from '@/components/webinar/WebinarComponents'
import logoSrc from '@/assets/logo.png'

export default function WebinarSuccessPage() {
    useEffect(() => {
        trackFBEvent('Purchase', { content_name: 'webinar_complete', value: getWebinarPrice(), currency: 'USD' })
    }, [])

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-5 text-white font-body selection:bg-lime/30">
            {/* Nav */}
            <div className="absolute top-0 left-0 right-0 border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center">
                <a href="/main" className="flex items-center gap-3">
                    <img src={logoSrc} alt="Zkandar" className="h-7 object-contain opacity-60" />
                </a>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md"
            >
                <div className="h-20 w-20 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-lime" />
                </div>

                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-lime/70 mb-3">Registration confirmed</p>
                <h1 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3rem)] leading-[0.95] text-white mb-3">
                    You're in.
                </h1>
                <p className="text-gray-400 leading-relaxed mb-8 text-sm">
                    Welcome to the 2-Day AI Design Webinar.
                    Check your inbox. You'll receive your confirmation, Zoom link, and pre-session materials within the next few minutes.
                </p>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8 text-left space-y-3">
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-1">What happens next</p>
                    {[
                        { icon: Mail, text: 'Confirmation email with Zoom link and calendar invite' },
                        { icon: Calendar, text: 'Day 1 starts July 15 at 7:00 PM Dubai time' },
                        { icon: CheckCircle2, text: 'Pre-session materials and AI tool setup guide' },
                        { icon: CheckCircle2, text: 'Access to session recordings within 24 hours' },
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <step.icon className="h-4 w-4 text-lime shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{step.text}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href="/main"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] text-gray-300 font-medium text-sm hover:border-white/20 hover:text-white transition"
                    >
                        Back to Home <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
