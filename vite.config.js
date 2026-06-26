import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Loktoré — Votre santé à portée de main',
        short_name: 'Loktoré',
        description:
          'Prise de rendez-vous, dossier médical, pharmacies de garde et conseils santé au Burkina Faso.',
        lang: 'fr',
        theme_color: '#059669',
        background_color: '#f1f5f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Handlers Web Push ajoutés au service worker généré.
        importScripts: ['/push-sw.js'],
        // Cache léger adapté aux connexions lentes / intermittentes (cf. plan §1)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  // Tests frontend (Vitest) — limités à src/ (le backend utilise node:test).
  test: {
    include: ['src/**/*.test.{js,jsx}'],
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy vers l'API Express en développement
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // WebSocket Socket.IO (messagerie temps réel)
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
