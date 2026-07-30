import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Vitest reuses the Vite config so tests run through the same transform pipeline.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      css: true,
      restoreMocks: true,
      clearMocks: true,
      passWithNoTests: true,
    },
  }),
)
