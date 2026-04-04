import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            workbox: {
                cleanupOutdatedCaches: true,
                skipWaiting: false,
                clientsClaim: true,
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
