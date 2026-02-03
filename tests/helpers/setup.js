// Global test setup
// Runs before all tests via vitest.config.js setupFiles

import { beforeAll, afterAll } from 'vitest'

// Store original environment
const originalEnv = { ...process.env }

beforeAll(() => {
  // Ensure consistent test environment
  // Unset any user-specific paths that might affect tests
  delete process.env.CLAUDE_CONFIG_DIR
  delete process.env.OPENCODE_CONFIG_DIR
  delete process.env.GEMINI_CONFIG_DIR
})

afterAll(() => {
  // Restore original environment
  process.env = originalEnv
})
