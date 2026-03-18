import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function ScrollRestoration() {
    const location = useLocation()
    const navigationType = useNavigationType()

    // 1. Save scroll position on scroll and on route exit
    useEffect(() => {
        let timeoutId: number
        const handleScroll = () => {
            if (timeoutId) return
            timeoutId = window.setTimeout(() => {
                sessionStorage.setItem(`scroll_${location.key}`, window.scrollY.toString())
                timeoutId = 0
            }, 100)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (timeoutId) clearTimeout(timeoutId)
            sessionStorage.setItem(`scroll_${location.key}`, window.scrollY.toString())
        }
    }, [location.key])

    // 2. Restore scroll position on route enter
    useLayoutEffect(() => {
        if (navigationType === 'POP') {
            const savedPosition = sessionStorage.getItem(`scroll_${location.key}`)
            if (savedPosition) {
                requestAnimationFrame(() => {
                    window.scrollTo(0, parseInt(savedPosition, 10))
                })
            } else {
                requestAnimationFrame(() => window.scrollTo(0, 0))
            }
        } else {
            requestAnimationFrame(() => window.scrollTo(0, 0))
        }
    }, [location.key, navigationType])

    return null
}
