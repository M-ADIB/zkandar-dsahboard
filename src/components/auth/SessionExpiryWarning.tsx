import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, LogOut } from 'lucide-react'
import { Portal } from '@/components/shared/Portal'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const WARNING_BEFORE_MS = 5 * 60 * 1000 // 5 minutes before expiry

function parseJwtExp(token: string): number | null {
    try {
        const payload = token.split('.')[1]
        if (!payload) return null
        const decoded = JSON.parse(atob(payload))
        return typeof decoded.exp === 'number' ? decoded.exp : null
    } catch {
        return null
    }
}

function formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function SessionExpiryWarning() {
    const { session, signOut } = useAuth()
    const [showWarning, setShowWarning] = useState(false)
    const [remainingMs, setRemainingMs] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const expiryRef = useRef<number>(0)

    const clearTimers = useCallback(() => {
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current)
            warningTimeoutRef.current = null
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
        }
    }, [])

    const startCountdown = useCallback((expiryMs: number) => {
        expiryRef.current = expiryMs
        setShowWarning(true)
        setRemainingMs(expiryMs - Date.now())

        countdownIntervalRef.current = setInterval(() => {
            const remaining = expiryRef.current - Date.now()
            if (remaining <= 0) {
                // Session expired — save path and redirect
                clearTimers()
                setShowWarning(false)
                localStorage.setItem('zkandar_last_path', window.location.pathname + window.location.search)
                signOut()
            } else {
                setRemainingMs(remaining)
            }
        }, 1000)
    }, [clearTimers, signOut])

    useEffect(() => {
        clearTimers()
        setShowWarning(false)

        if (!session?.access_token) return

        const exp = parseJwtExp(session.access_token)
        if (!exp) return

        const expiryMs = exp * 1000
        const timeUntilWarning = expiryMs - Date.now() - WARNING_BEFORE_MS

        if (timeUntilWarning <= 0) {
            // Already within the 5-minute window
            startCountdown(expiryMs)
        } else {
            warningTimeoutRef.current = setTimeout(() => {
                startCountdown(expiryMs)
            }, timeUntilWarning)
        }

        return clearTimers
    }, [session?.access_token, clearTimers, startCountdown])

    const handleStayLoggedIn = async () => {
        setIsRefreshing(true)
        try {
            await supabase.auth.refreshSession()
            setShowWarning(false)
            clearTimers()
        } catch (err) {
            console.error('[SessionExpiry] Failed to refresh session:', err)
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleLogOut = () => {
        clearTimers()
        setShowWarning(false)
        localStorage.setItem('zkandar_last_path', window.location.pathname + window.location.search)
        signOut()
    }

    return (
        <AnimatePresence>
            {showWarning && (
                <Portal>
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                            className="relative z-10 w-full max-w-sm rounded-2xl bg-bg-elevated border border-border shadow-2xl overflow-hidden"
                        >
                            <div className="px-6 py-5 text-center">
                                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                                    <Clock className="h-7 w-7 text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Session Expiring</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Your session expires in{' '}
                                    <span className="font-mono text-yellow-400 font-bold text-base">
                                        {formatCountdown(remainingMs)}
                                    </span>
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleLogOut}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-border hover:bg-white/10 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log Out
                                    </button>
                                    <button
                                        onClick={handleStayLoggedIn}
                                        disabled={isRefreshing}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium gradient-lime text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRefreshing ? 'Refreshing...' : 'Stay Logged In'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </Portal>
            )}
        </AnimatePresence>
    )
}
