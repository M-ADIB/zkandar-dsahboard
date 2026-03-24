import { useState, useEffect } from 'react'
import { X, Share, PlusSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isIOSDevice)

        // Detect if app is already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
        setIsStandalone(isStandaloneMode)

        // Listen for standard PWA install prompt (Android/Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            setShowPrompt(true)
        })

        // For iOS, show the prompt if not installed after a short delay
        if (isIOSDevice && !isStandaloneMode) {
            const hasSeenPrompt = localStorage.getItem('zkandar_ios_install_prompt')
            if (!hasSeenPrompt) {
                const timer = setTimeout(() => {
                    setShowPrompt(true)
                }, 3000)
                return () => clearTimeout(timer)
            }
        }
    }, [])

    const handleDismiss = () => {
        setShowPrompt(false)
        if (isIOS) {
            localStorage.setItem('zkandar_ios_install_prompt', 'true')
        }
    }

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt')
        } else {
            console.log('User dismissed the install prompt')
        }
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    if (!showPrompt || isStandalone) return null

    return (
        <AnimatePresence>
            {isIOS ? (
                // iOS Safari Prompt
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-[#111111]/95 backdrop-blur-md rounded-t-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                >
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-2 text-white/50 hover:text-white transition-colors"
                >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-start gap-4 pr-8">
                        <img src="/favicon.png" alt="Zkandar AI Icon" className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2 text-sm text-white/80">
                            <p className="font-semibold text-white">Install Zkandar AI</p>
                            <p>
                                Tap <Share className="inline w-4 h-4 mx-1" /> from your browser menu, then tap <strong>Add to Home Screen</strong> <PlusSquare className="inline w-4 h-4 mx-1" />
                            </p>
                        </div>
                    </div>
                </motion.div>
            ) : deferredPrompt ? (
                // Standard Play Install Prompt (Android/Desktop)
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[100] p-4 bg-[#111111] border border-lime/30 rounded-2xl shadow-xl flex items-center gap-4"
                >
                    <img src="/favicon.png" alt="Zkandar AI Icon" className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">Install App</p>
                        <p className="text-xs text-white/60">For a better mobile experience</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDismiss}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleInstallClick}
                            className="px-4 py-2 bg-lime text-black text-sm font-semibold rounded-lg hover:bg-lime/90 transition-colors"
                        >
                            Install
                        </button>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
