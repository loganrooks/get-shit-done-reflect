import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

/**
 * Helper: run resolve-model CLI command and parse JSON output
 */
function resolveModel(tmpdir, agentType) {
  const result = execSync(`node "${GSD_TOOLS}" resolve-model ${agentType}`, {
    cwd: tmpdir,
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  return JSON.parse(result.trim())
}

/**
 * Helper: create .planning/config.json in a tmpdir
 */
async function createConfig(tmpdir, config) {
  const planningDir = path.join(tmpdir, '.planning')
  await fs.mkdir(planningDir, { recursive: true })
  await fs.writeFile(
    path.join(planningDir, 'config.json'),
    JSON.stringify(config, null, 2)
  )
}

describe('model-resolution', () => {
  describe('gsdr- prefix resolves same as gsd- prefix', () => {
    const agents = ['planner', 'executor', 'debugger', 'phase-researcher', 'roadmapper']

    for (const name of agents) {
      tmpdirTest(`gsdr-${name} matches gsd-${name}`, async ({ tmpdir }) => {
        await createConfig(tmpdir, { model_profile: 'quality' })

        const gsdResult = resolveModel(tmpdir, `gsd-${name}`)
        const gsdrResult = resolveModel(tmpdir, `gsdr-${name}`)

        expect(gsdrResult.model).toBe(gsdResult.model)
        expect(gsdrResult).not.toHaveProperty('unknown_agent')
      })
    }
  })

  describe('executor quality tier is opus (inherit)', () => {
    tmpdirTest('gsd-executor quality returns inherit', async ({ tmpdir }) => {
      await createConfig(tmpdir, { model_profile: 'quality' })

      const result = resolveModel(tmpdir, 'gsd-executor')
      expect(result.model).toBe('inherit')
      expect(result).not.toHaveProperty('unknown_agent')
    })

    tmpdirTest('gsdr-executor quality returns inherit', async ({ tmpdir }) => {
      await createConfig(tmpdir, { model_profile: 'quality' })

      const result = resolveModel(tmpdir, 'gsdr-executor')
      expect(result.model).toBe('inherit')
      expect(result).not.toHaveProperty('unknown_agent')
    })
  })

  describe('bucket 3 agents are known', () => {
    const bucket3 = [
      'artifact-sensor', 'ci-sensor', 'git-sensor', 'log-sensor',
      'signal-collector', 'signal-synthesizer', 'reflector',
      'spike-runner', 'checker', 'advisor', 'advisor-researcher',
    ]

    for (const name of bucket3) {
      tmpdirTest(`gsd-${name} is a known agent`, async ({ tmpdir }) => {
        await createConfig(tmpdir, { model_profile: 'balanced' })

        const result = resolveModel(tmpdir, `gsd-${name}`)
        expect(result).not.toHaveProperty('unknown_agent')
      })
    }
  })

  describe('model_overrides with gsdr- prefix', () => {
    tmpdirTest('gsdr- key in config overrides gsdr- agent', async ({ tmpdir }) => {
      await createConfig(tmpdir, {
        model_profile: 'balanced',
        model_overrides: { 'gsdr-executor': 'haiku' },
      })

      const result = resolveModel(tmpdir, 'gsdr-executor')
      expect(result.model).toBe('haiku')
    })

    tmpdirTest('gsd- key in config overrides gsdr- agent (normalized key wins)', async ({ tmpdir }) => {
      await createConfig(tmpdir, {
        model_profile: 'balanced',
        model_overrides: { 'gsd-executor': 'haiku' },
      })

      const result = resolveModel(tmpdir, 'gsdr-executor')
      expect(result.model).toBe('haiku')
    })

    tmpdirTest('gsd- key takes precedence over gsdr- key when both present', async ({ tmpdir }) => {
      await createConfig(tmpdir, {
        model_profile: 'balanced',
        model_overrides: {
          'gsd-planner': 'haiku',
          'gsdr-planner': 'sonnet',
        },
      })

      // normalizedType (gsd-) is checked first via ?? operator
      const result = resolveModel(tmpdir, 'gsdr-planner')
      expect(result.model).toBe('haiku')
    })
  })

  describe('fallback for truly unknown agent', () => {
    tmpdirTest('unknown agent returns sonnet with unknown_agent flag', async ({ tmpdir }) => {
      await createConfig(tmpdir, { model_profile: 'balanced' })

      const result = resolveModel(tmpdir, 'gsd-nonexistent')
      expect(result.model).toBe('sonnet')
      expect(result.unknown_agent).toBe(true)
    })
  })
})
