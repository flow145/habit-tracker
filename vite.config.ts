/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  plugins: [react(), mkcert()],

  test: {
    environment: 'happy-dom',
    setupFiles: ['src/shared/tests/setup.ts'],
  },
})
