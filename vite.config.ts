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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Your App Name',
        short_name: 'App',
        description: 'Your app description',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@ionic/')) return 'ionic';
          if (id.includes('framer-motion')) return 'framer-motion';
          if (id.includes('html5-qrcode')) return 'html5-qrcode';
          if (id.includes('react')) return 'react';


          return 'vendor';
        }
      },
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
