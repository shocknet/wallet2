import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    eslint({
      failOnError: false,
      failOnWarning: false
    }),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'shockwallet-logo.svg'],
      manifest: {
        name: 'Shockwallet',
        short_name: 'App',
        description: 'Lightning for Everyone',
        theme_color: '#29abe2',
        background_color: '#16191c',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
  build: {
    rollupOptions: {
      plugins: [
        visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          filename: 'bundle-report.html',
        }),
      ],
    },
  },
  server: {
    host: true,
    port: 8100,
  },
  // Add this section to handle SPA routing for PWA
  preview: {
    port: 8080,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
