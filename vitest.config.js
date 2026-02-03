import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/hooks/dist/**']
    },
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/helpers/setup.js']
  }
})
