import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'

export function SprintWorkshopOnboarding() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-bg-elevated border border-border rounded-3xl p-8 md:p-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 text-lime text-xs uppercase tracking-widest mb-6">
                    <Sparkles className="h-4 w-4" />
                    Sprint Workshop Onboarding
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                    Coming soon
                </h1>
                <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-8">
                    We are finalizing the Sprint Workshop onboarding experience. If you are joining the Master Class,
                    continue to the standard onboarding flow.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        to="/onboarding"
                        className="flex items-center gap-2 px-5 py-2.5 gradient-lime text-black font-semibold rounded-xl hover:opacity-90 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Master Class Onboarding
                    </Link>
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl hover:border-lime/50 transition"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
