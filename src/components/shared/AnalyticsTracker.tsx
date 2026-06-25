import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

const getReferrer = (): string => {
    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source')
    if (utmSource) {
        if (utmSource === 'ig') return 'ig'
        if (utmSource === 'fb') return 'facebook.com'
        return utmSource
    }

    const referrer = document.referrer
    if (!referrer) return 'Direct'
    try {
        const url = new URL(referrer)
        if (url.hostname === window.location.hostname || url.hostname.includes('localhost')) {
            return 'Direct'
        }
        return url.hostname.replace('www.', '')
    } catch {
        return 'Direct'
    }
}

export function AnalyticsTracker() {
    const location = useLocation()
    const currentViewId = useRef<string | null>(null)
    const viewStartTime = useRef<number>(0)

    useEffect(() => {
        // Initialize session ID
        let sessionId = sessionStorage.getItem('zkandar_session_id')
        if (!sessionId) {
            sessionId = generateUUID()
            sessionStorage.setItem('zkandar_session_id', sessionId)
        }

        // Initialize A/B variant
        let variant = sessionStorage.getItem('zkandar_ab_variant')
        if (!variant) {
            variant = Math.random() < 0.5 ? 'A' : 'B'
            sessionStorage.setItem('zkandar_ab_variant', variant)
        }

        // Initialize referrer
        let sessionReferrer = sessionStorage.getItem('zkandar_session_referrer')
        if (!sessionReferrer) {
            sessionReferrer = getReferrer()
            sessionStorage.setItem('zkandar_session_referrer', sessionReferrer)
        }

        const path = location.pathname
        const pageViewId = generateUUID()
        currentViewId.current = pageViewId
        viewStartTime.current = Date.now()

        // Insert page view record
        const logPageView = async () => {
            try {
                await supabase.from('webinar_analytics').insert({
                    id: pageViewId,
                    session_id: sessionId as string,
                    path,
                    referrer: sessionReferrer as string,
                    variant: variant as string,
                    duration_seconds: 0
                })
            } catch (err) {
                console.error('Failed to log page view:', err)
            }
        }

        logPageView()

        // Heartbeat interval updates duration every 10 seconds
        const interval = setInterval(async () => {
            if (!currentViewId.current) return
            const elapsed = Math.round((Date.now() - viewStartTime.current) / 1000)
            try {
                await supabase
                    .from('webinar_analytics')
                    .update({ duration_seconds: elapsed, updated_at: new Date().toISOString() })
                    .eq('id', currentViewId.current)
            } catch (err) {
                console.error('Failed to update duration heartbeat:', err)
            }
        }, 10000)

        // Cleanup on navigate / unmount
        return () => {
            clearInterval(interval)
            const finalElapsed = Math.round((Date.now() - viewStartTime.current) / 1000)
            if (currentViewId.current && finalElapsed > 0) {
                supabase
                    .from('webinar_analytics')
                    .update({ duration_seconds: finalElapsed, updated_at: new Date().toISOString() })
                    .eq('id', currentViewId.current)
                    .then()
            }
            currentViewId.current = null
        }
    }, [location.pathname])

    return null
}
