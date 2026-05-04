/**
 * Facebook Pixel helper — wraps `fbq()` calls with a type-safe guard.
 * The base snippet is loaded in index.html (PageView fires automatically).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const fbq: (...args: any[]) => void

/** Fire a standard FB pixel event (only if the snippet loaded). */
export function trackFBEvent(event: string, params?: Record<string, unknown>) {
    if (typeof fbq === 'function') {
        if (params) {
            fbq('track', event, params)
        } else {
            fbq('track', event)
        }
    }
}
