import React, { Component, ReactNode } from 'react'
import { AlertTriangle, Home } from 'lucide-react'
import { Sentry } from '@/lib/sentry'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    isChunkError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, isChunkError: false, error: null }
    }

    private static isChunkLoadError(error: Error): boolean {
        return (
            error.name === 'ChunkLoadError' ||
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Importing a module script failed') ||
            error.message?.includes('Loading chunk')
        )
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Always set hasError: true — returning false would re-render children, which throw
        // again immediately, creating a re-render loop before componentDidCatch can fire.
        return {
            hasError: true,
            isChunkError: ErrorBoundary.isChunkLoadError(error),
            error,
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })

        // After a deployment, lazy-loaded chunk URLs change. SPA navigation to a page
        // whose chunk no longer exists throws a ChunkLoadError. Auto-reload fetches the
        // updated asset manifest and resolves the issue without user intervention.
        if (ErrorBoundary.isChunkLoadError(error)) {
            console.warn('[ErrorBoundary] Stale deployment chunk detected — reloading for updated assets')
            window.location.reload()
        }
    }

    render() {
        if (!this.state.hasError) return this.props.children

        // Chunk error: show a spinner while componentDidCatch reloads the page.
        // We must NOT render children here (they'd throw again) and we don't want
        // the error dialog — just a neutral loading state during the brief reload window.
        if (this.state.isChunkError) {
            return (
                <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-lime border-t-transparent animate-spin" />
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary p-6">
                <div className="bg-bg-card border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                    <p className="text-sm text-gray-400">
                        We encountered an unexpected error while loading this component.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <div className="bg-[#111] border border-white/5 rounded-lg p-3 text-left overflow-auto mt-4 max-h-32">
                            <p className="text-xs text-red-400 font-mono italic">
                                {this.state.error.message}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => window.location.href = '/'}
                        className="mt-6 w-full py-2.5 bg-lime font-medium text-black rounded-xl hover:bg-[#B8F23E] transition flex items-center justify-center gap-2"
                    >
                        <Home className="h-4 w-4" /> Return to Dashboard
                    </button>
                </div>
            </div>
        )
    }
}
