/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // react(): JSX + fast refresh. tailwindcss(): turns Tailwind classes into real CSS at build time.
  plugins: [react(), tailwindcss()],
  // In development, /api/* goes to the local API server (npm run dev:api), so the
  // browser only ever talks to its own origin and never sees the Matilda API key.
  server: {
    proxy: { '/api': 'http://127.0.0.1:8787' },
  },
  test: {
    // jsdom = a fake browser inside Node, so component tests can render HTML.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
