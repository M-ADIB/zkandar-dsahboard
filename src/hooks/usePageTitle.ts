import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'

export const TITLE_MAP: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/admin': 'Dashboard',
    '/admin/companies': 'Companies',
    '/admin/leads': 'Leads',
    '/admin/programs': 'Programs',
    '/admin/members': 'Members',
    '/admin/events': 'Events',
    '/admin/costs': 'Costs',
    '/admin/recruiting': 'Recruiting',
    '/admin/chat': 'Chat',
    '/admin/analytics': 'Analytics',
    '/chat': 'Chat',
    '/my-program': 'My Program',
    '/my-performance': 'My Performance',
    '/toolbox': 'Toolbox',
    '/settings': 'Settings',
    '/notifications': 'Notifications',
    '/login': 'Log In',
    '/signup': 'Sign Up',
    '/events-apply': 'Apply',
    '/apply/sales': 'Apply',
    '/masterclass-analytics': 'Workflows',
    '/program': 'Program',
    '/thank-you': 'Thank You',
    '/survey/post-completion': 'Survey',
    '/privacy': 'Privacy Policy',
    '/terms': 'Terms of Service',
}

let currentDynamicTitle: string | null = null

export function setDynamicPageTitle(title: string | null) {
    currentDynamicTitle = title
    window.dispatchEvent(new Event('dynamic-title-change'))
}

export function useDynamicTitle() {
    const [title, setTitle] = useState<string | null>(currentDynamicTitle)

    useEffect(() => {
        const handler = () => setTitle(currentDynamicTitle)
        window.addEventListener('dynamic-title-change', handler)
        return () => window.removeEventListener('dynamic-title-change', handler)
    }, [])

    return title
}

const originalFavicon = '/favicon.png'

function updateFaviconBadge(count: number) {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
    if (!link) {
        link = document.createElement('link')
        link.type = 'image/png'
        link.rel = 'icon'
        document.head.appendChild(link)
    }

    if (count === 0) {
        link.href = originalFavicon
        return
    }

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
        ctx.drawImage(img, 0, 0, 32, 32)
        
        ctx.beginPath()
        ctx.arc(24, 8, 8, 0, 2 * Math.PI)
        ctx.fillStyle = '#D0FF71' // Zkandar Lime
        ctx.fill()
        
        ctx.font = 'bold 11px Inter, sans-serif'
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(count > 9 ? '9+' : count.toString(), 24, 8.5)

        link!.href = canvas.toDataURL('image/png')
    }
    img.src = originalFavicon
}

export function PageTitleUpdater() {
    const location = useLocation()
    const { unreadCount } = useNotifications()

    useEffect(() => {
        // Reset dynamic title on route change
        currentDynamicTitle = null

        const updateTitle = () => {
            const baseName = TITLE_MAP[location.pathname]
            let newTitle = 'Zkandar AI'
            
            // If there's a dynamic title set by a detail page
            if (currentDynamicTitle) {
                newTitle = `${currentDynamicTitle} · Zkandar AI`
            } 
            // If it matches a known static route
            else if (baseName) {
                newTitle = `${baseName} · Zkandar AI`
            } 
            // Fallbacks for detail pages before the data loads
            else {
                // Check if it's a known resource type by matching the path prefix
                if (location.pathname.startsWith('/admin/companies/')) {
                    newTitle = `Company · Zkandar AI`
                } else if (location.pathname.startsWith('/admin/leads/')) {
                    newTitle = `Lead · Zkandar AI`
                } else if (location.pathname.startsWith('/toolbox/')) {
                    newTitle = `Tool · Zkandar AI`
                } else if (location.pathname.startsWith('/epk/')) {
                    newTitle = `EPK · Zkandar AI`
                }
            }

            const prefix = unreadCount > 0 ? `(${unreadCount}) ` : ''
            document.title = prefix + newTitle
        }

        updateTitle()

        const handleDynamicChange = () => updateTitle()
        window.addEventListener('dynamic-title-change', handleDynamicChange)

        return () => {
            window.removeEventListener('dynamic-title-change', handleDynamicChange)
        }
    }, [location.pathname, unreadCount])

    useEffect(() => {
        updateFaviconBadge(unreadCount)
    }, [unreadCount])

    return null
}
