import './lib/sentry'   // must be first — initializes Sentry before any app code
import './lib/analytics' // initialize PostHog early

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
            retry: 1, // Only retry failed requests once
            refetchOnWindowFocus: false, // Don't refetch automatically when switching tabs back
        },
    },
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#111111',
                            color: '#fff',
                            border: '1px solid hsl(0, 0%, 15%)',
                        },
                        success: {
                            iconTheme: {
                                primary: '#D0FF71',
                                secondary: '#000',
                            },
                        },
                    }}
                />
            </BrowserRouter>
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </QueryClientProvider>
    </StrictMode>,
)
