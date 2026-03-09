import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com'

if (key) {
    posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false, // manual event tracking only
        loaded: (ph) => {
            if (import.meta.env.DEV) ph.debug()
        },
    })
}

export { posthog }

/** Identify user after login — call this once the user profile is loaded */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
    if (!key) return
    posthog.identify(userId, properties)
}

/** Reset identity on logout */
export function resetAnalytics() {
    if (!key) return
    posthog.reset()
}
