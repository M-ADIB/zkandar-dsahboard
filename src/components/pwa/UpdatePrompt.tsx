import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error) {
            console.error('SW registration error', error)
        },
        onRegistered(swRegistration) {
            if (swRegistration) {
                // Poll for updates every 30 seconds
                setInterval(() => {
                    swRegistration.update()
                }, 30 * 1000)
            }
        },
    })

    useEffect(() => {
        if (needRefresh) {
            toast('A new version is available', {
                description: 'Update to get the latest features and fixes.',
                duration: Infinity, // stay visible until acted upon
                onDismiss: () => setNeedRefresh(false),
                action: {
                    label: 'Update now',
                    onClick: async () => {
                        // Clear all caches before updating
                        if ('caches' in window) {
                            try {
                                const cacheKeys = await caches.keys()
                                await Promise.all(cacheKeys.map(key => caches.delete(key)))
                            } catch (e) {
                                console.error('Failed to clear caches', e)
                            }
                        }
                        
                        // Proceed to update and reload
                        updateServiceWorker(true)
                    }
                }
            })
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh])

    return null
}
