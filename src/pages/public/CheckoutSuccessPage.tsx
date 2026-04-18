import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Calendar } from 'lucide-react'
import logoSrc from '../../assets/logo.png'

const ONBOARDING_URL = 'https://calendly.com/zkandar/sprint-onboarding'

export function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-5 text-white font-body">
            {/* Nav */}
            <div className="absolute top-0 left-0 right-0 border-b border-white/[0.06] px-5 sm:px-10 py-4 flex items-center">
                <a href="/test-landingpage" className="flex items-center gap-3">
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                    <div className="w-px h-4 bg-white/[0.12] hidden sm:block" />
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-600 hidden sm:block">kind of AI</span>
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

                <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-lime/70 mb-3">Payment confirmed</p>
                <h1 className="font-heading font-black uppercase text-[clamp(2rem,5vw,3rem)] leading-[0.95] text-white mb-3">
                    You're in.
                </h1>
                <p className="text-gray-400 leading-relaxed mb-8 text-sm">
                    Welcome to the next Zkandar AI Sprint Workshop cohort.
                    Check your inbox — you'll receive your confirmation and
                    pre-work details within the next few minutes.
                </p>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8 text-left space-y-3">
                    <p className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 mb-1">What happens next</p>
                    {[
                        'Confirmation email with session dates and Zoom links',
                        'Pre-work brief to set up your AI tools before Day 1',
                        'Access to the private cohort Slack channel',
                        'Optional 1-on-1 onboarding call with the Zkandar team',
                    ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-lime shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{step}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href={ONBOARDING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-lime text-black font-body font-bold uppercase tracking-wider text-xs hover:opacity-90 transition"
                    >
                        <Calendar className="h-4 w-4" />
                        Book onboarding call
                    </a>
                    <a
                        href="/test-landingpage"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] text-gray-300 font-medium text-sm hover:border-white/20 hover:text-white transition"
                    >
                        Back to Zkandar AI <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
