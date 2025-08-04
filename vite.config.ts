import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer';
import vitePluginCompression from 'vite-plugin-compression'

// Check if this is an Android build
const isAndroidBuild = process.env.CAPACITOR_PLATFORM === 'android'
// Disable compression plugin since Caddy handles compression with zstd
const disableCompression = true

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    eslint({
      failOnError: false,
      failOnWarning: false
    }),
    // Disable compression plugin since Caddy handles compression with zstd
    // ...(isAndroidBuild ? [] : [
    //   vitePluginCompression({
    //     algorithm: "gzip",
    //     filter: (file) => {
    //       // Only compress JavaScript and CSS files
    //       return file.endsWith('.js') || file.endsWith('.css');
    //     }
    //   })
    // ]),
    VitePWA({
      registerType: 'autoUpdate',
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
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'firebase-messaging-sw.ts',
      workbox: {
        globPatterns: [],
        globIgnores: ['*']
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      }
    }),
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

      output: {
        manualChunks(id) {
          if (id.includes('commonjsHelpers')) return 'commonjsHelpers'
          if (!id.includes('node_modules')) return

          // Ionic ecosystem
          if (
            id.includes('/@ionic/') ||
            id.includes('/@ionic/react/') ||
            id.includes('/@ionic/react-router/') ||
            id.includes('/@ionic/pwa-elements/') ||
            id.includes('/@ionic/storage/') ||
            id.includes('/ionicons/') ||
            id.includes('/@capacitor/') ||
            id.includes('/@stencil/core/')
          ) return 'ionic-ecosystem';


          // React core ecosystem
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/react-is/') ||
            id.includes('/use-sync-external-store/') ||
            id.includes('/hoist-non-react-statics/') ||
            id.includes('/styled-components/') ||
            id.includes('/prop-types/') ||
            id.includes('/react-chartjs-2/') ||
            id.includes('/react-router/') ||
            id.includes('/history/')

          ) return 'react-core';

          // State management
          if (
            id.includes('/redux/') ||
            id.includes('/redux-thunk/') ||
            id.includes('/react-redux/') ||
            id.includes('/redux-persist/') ||
            id.includes('/@reduxjs/toolkit') ||
            id.includes('/reselect/')
          ) return "state-management";



          // Framer Motion
          if (id.includes('/framer-motion/')) return 'framer-motion';

          // React Router
          if (id.includes('/react-router/') || id.includes('/history/')) return 'react-router';

          // UI libraries
          if (
            id.includes('/react-toastify/') ||
            id.includes('dnd') ||
            id.includes('/swiper/') ||
            id.includes('/qrcode.react/') ||
            id.includes('/html5-qrcode/')
          ) return 'ui-libraries';


          // Vendor catch-all
          return 'vendor';
        }
      },
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
    dedupe: ['react', 'react-dom', 'react-is', 'scheduler', 'use-sync-external-store']
  },
})
