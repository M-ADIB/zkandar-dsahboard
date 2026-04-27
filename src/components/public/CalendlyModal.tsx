import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import { ArrowRight } from 'lucide-react'
import logoSrc from '../../assets/logo.png'

const CALENDLY_URL = 'https://calendly.com/zkandarstudio-info/ai-discovery-call'

interface CalendlyModalProps {
    onClose: () => void
    studioMode?: boolean
}

export function CalendlyModal({ onClose, studioMode = false }: CalendlyModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-[#111111] border border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl flex flex-col"
                style={{ height: 'min(850px, 90vh)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <img src={logoSrc} alt="" className="h-5 object-contain" />
                        <span className="text-sm font-bold font-heading text-white/80">Book a Discovery Call</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all text-base">✕</button>
                </div>

                {/* Studio notice banner */}
                {studioMode && (
                    <div className="shrink-0 px-5 py-3.5 bg-lime/[0.06] border-b border-lime/[0.12] flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-lime mb-0.5">Studio & Firm Masterclass Only</p>
                            <p className="text-xs text-gray-400 leading-snug">
                                This program is designed for design teams of 3 or more — not for individual enrollment.
                                Individual learners should start with the Sprint Workshop instead.
                            </p>
                        </div>
                        <a
                            href="/checkout"
                            onClick={onClose}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-lime text-black text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity font-heading whitespace-nowrap"
                        >
                            Enroll Directly <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                )}

                {/* Calendly widget */}
                <div className="flex-1 min-h-0 relative bg-[#111111]">
                    <InlineWidget
                        url={CALENDLY_URL}
                        styles={{ height: '100%', width: '100%' }}
                        pageSettings={{ hideGdprBanner: true, backgroundColor: '111111', textColor: 'ffffff', primaryColor: 'd0ff71' }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}
