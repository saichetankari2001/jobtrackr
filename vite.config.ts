/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // react(): JSX + fast refresh. tailwindcss(): turns Tailwind classes into real CSS at build time.
  plugins: [react(), tailwindcss()],
  test: {
    // jsdom = a fake browser inside Node, so component tests can render HTML.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
