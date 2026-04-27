import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import logoSrc from '../../assets/logo.png'

const CALENDLY_URL = 'https://calendly.com/zkandarstudio-info/ai-discovery-call'

export function CalendlyModal({ onClose }: { onClose: () => void }) {
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
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <img src={logoSrc} alt="" className="h-5 object-contain" />
                        <span className="text-sm font-bold font-heading text-white/80">Book a Discovery Call</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all text-base">✕</button>
                </div>
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
