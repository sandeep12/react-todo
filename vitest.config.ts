import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Test-time configuration. Kept separate from vite.config.ts so the app build
// never pulls in test-only settings.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    restoreMocks: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
