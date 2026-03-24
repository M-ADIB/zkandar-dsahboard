import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
    const isOnline = useOnlineStatus()

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -48, opacity: 0 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                    className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-red-900/90 via-red-800/90 to-red-900/90 backdrop-blur-md border-b border-red-500/30 text-white text-sm font-medium shadow-lg"
                >
                    <WifiOff className="h-4 w-4 text-red-300 animate-pulse" />
                    <span>You are offline — changes will sync when reconnected</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
