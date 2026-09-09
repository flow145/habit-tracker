/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  base: process.env.BASE_URL,

  build: {
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'],
  },

  test: {
    environment: 'happy-dom',
    fileParallelism: false,
    setupFiles: ['src/shared/tests/setup.ts'],
    env: {
      TZ: 'America/New_York',
    },
  },

  plugins: [
    react(),
    mkcert(),
    svgr({
      include: 'src/shared/assets/**/*.svg',
      svgrOptions: {
        ref: true,
        titleProp: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      scope: process.env.BASE_URL,
      manifest: {
        name: 'Habit tracker',
        short_name: 'Habits',
        description:
          'A simple, cross-platform habit tracker with flexible scheduling and a focus on long-term consistency over streaks.',
        display: 'standalone',
        background_color: '#B9BBC6',
        theme_color: '#FCFCFD',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html}', 'assets/*.woff2'],
      },
    }),
  ],
})
