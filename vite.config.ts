/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
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
  ],

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
})
