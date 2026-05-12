import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * PWA auto-update handler.
 * 
 * With registerType: 'autoUpdate' and skipWaiting: true, the new service worker
 * activates immediately. This component just ensures the registration happens
 * and clears any legacy caches from the old prompt-based flow.
 */
export function UpdatePrompt() {
    useRegisterSW({
        onRegisterError(error) {
            console.error('SW registration error', error)
        },
        onRegistered(swRegistration) {
            if (swRegistration) {
                // Check for SW updates every 60 seconds
                setInterval(() => {
                    swRegistration.update()
                }, 60 * 1000)
            }
        },
        onNeedRefresh() {
            // With autoUpdate + skipWaiting, the browser reloads automatically.
            // Clear any old caches from the previous prompt-based SW to prevent stale content.
            if ('caches' in window) {
                caches.keys().then(keys => {
                    keys.forEach(key => {
                        // Nuke legacy workbox precaches — the new SW uses runtime caching only
                        if (key.startsWith('workbox-precache') || key.startsWith('workbox-runtime')) {
                            caches.delete(key)
                        }
                    })
                })
            }
        },
    })

    return null
}
