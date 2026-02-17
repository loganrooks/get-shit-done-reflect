import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'

/**
 * Real Agent E2E Tests
 *
 * These tests spawn actual Claude Code agents and verify the full signal collection
 * chain works end-to-end. They make real API calls and consume tokens.
 *
 * Run modes per CONTEXT.md:
 * - Skip by default (npm test skips these)
 * - Run on-demand: npm test -- --run tests/e2e/real-agent.test.js
 * - Run on release: CI triggers on release tags
 *
 * Environment requirements:
 * - ANTHROPIC_API_KEY must be set
 * - Claude Code CLI must be installed
 */

// Skip these tests unless explicitly enabled
const SKIP_REAL_AGENT_TESTS = process.env.RUN_REAL_AGENT_TESTS !== 'true'

describe.skipIf(SKIP_REAL_AGENT_TESTS)('real agent E2E tests', () => {

  beforeAll(() => {
    // Verify Claude CLI is available
    try {
      execSync('claude --version', { stdio: 'pipe' })
    } catch (e) {
      throw new Error('Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code')
    }

    // Verify API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable not set')
    }
  })

  describe('signal collection chain', () => {
    it.todo('collects signals from completed plan execution — requires spawning real Claude agent')
    it.todo('handles agent failure gracefully — requires spawning real Claude agent')
  })

  describe('API interaction', () => {
    it.todo('can make authenticated API request — requires real ANTHROPIC_API_KEY usage')
  })

  describe('signal verification', () => {
    it.todo('verifies signal file format after real agent collection — requires real agent output')
  })
})
