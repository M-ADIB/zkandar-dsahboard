import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'

export function ThankYouPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white font-body selection:bg-lime/30 selection:text-white relative overflow-hidden flex items-center justify-center">
            {/* Ambient gradient orbs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5A9F2E]/20 blur-[120px] rounded-full pointer-events-none z-0 animate-float-slow" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#D0FF71]/8 blur-[140px] rounded-full pointer-events-none z-0 animate-float-slow-reverse" />

            {/* Noise overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            {/* Background logo */}
            <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05]">
                <img src={logoSrc} alt="" className="w-[80%] md:w-[55%] lg:w-[40%] max-w-[600px] grayscale object-contain" />
            </div>

            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(30px, -20px) scale(1.05); }
                }
                @keyframes float-slow-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 15px) scale(1.03); }
                }
                .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
                .animate-float-slow-reverse { animation: float-slow-reverse 25s ease-in-out infinite; }
            `}</style>

            <div className="relative z-10 max-w-[600px] mx-auto px-6 text-center space-y-8">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-center gap-2"
                >
                    <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
                    <span className="text-sm font-heading font-bold tracking-wider text-white/70">Zkandar AI</span>
                </motion.div>

                {/* Checkmark */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center"
                >
                    <div className="w-20 h-20 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <path d="M8 18L15 25L28 11" stroke="#D0FF71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                >
                    <h1
                        className="font-heading font-black text-white"
                        style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
                    >
                        You're booked.
                    </h1>
                    <p className="text-gray-400 text-base leading-relaxed font-body">
                        We've received your booking and will confirm shortly. In the meantime, feel free to review the program details.
                    </p>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center gap-4 flex-wrap pt-2"
                >
                    <Link
                        to="/program"
                        className="px-8 py-3.5 bg-lime text-black font-bold rounded-xl hover:bg-lime-400 transition-all text-sm uppercase tracking-wider hover:shadow-glow-lg hover:-translate-y-0.5"
                    >
                        Back to Program
                    </Link>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="pt-8 opacity-40"
                >
                    <div className="flex items-center justify-center gap-2">
                        <img src={logoSrc} alt="" className="h-5 object-contain grayscale" />
                        <span className="text-xs font-heading tracking-wider">Zkandar AI</span>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
