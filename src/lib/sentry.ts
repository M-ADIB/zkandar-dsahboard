import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initSentry() {
    if (dsn) {
        Sentry.init({
            dsn,
            environment: import.meta.env.MODE,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: false,
                }),
            ],
            // 10% of transactions traced in production; 100% in dev
            tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
            // Capture replays on 10% of sessions; 100% if an error occurs
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            // Strip PII from breadcrumbs
            beforeBreadcrumb(breadcrumb) {
                if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
                    return null // Don't forward debug logs to Sentry
                }
                return breadcrumb
            },
        })
    }
}

export { Sentry }
