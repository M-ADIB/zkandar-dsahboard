import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                cleanupOutdatedCaches: true,
                // Auto-update immediately — no more "click to update" gates
                skipWaiting: true,
                clientsClaim: true,
                // Do NOT precache the HTML shell — always fetch from network
                navigateFallback: null,
                // Only precache hashed static assets (JS/CSS chunks with content hashes)
                // This means index.html is NEVER cached by the service worker
                globPatterns: ['**/*.{js,css,woff2}'],
                // Runtime caching rules — network-first for everything that matters
                runtimeCaching: [
                    {
                        // Navigation requests (HTML pages) — ALWAYS network first
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 },
                            networkTimeoutSeconds: 3,
                        },
                    },
                    {
                        // Supabase API calls — never cache
                        urlPattern: /\.supabase\.co/,
                        handler: 'NetworkOnly',
                    },
                    {
                        // Images — cache but keep them fresh
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'images',
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                        },
                    },
                    {
                        // Fonts — safe to cache longer since they rarely change
                        urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts',
                            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                ],
            },
            includeAssets: ['favicon.png'],
            manifest: {
                name: 'Zkandar AI',
                short_name: 'Zkandar AI',
                description: 'Futuristic AI-themed learning management dashboard for architecture and design studios',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                icons: [
                    {
                        src: 'favicon.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'favicon.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'favicon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
