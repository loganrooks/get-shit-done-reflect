import { describe, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

import { tmpdirTest } from '../helpers/tmpdir.js'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

async function createConfig(tmpdir) {
  const planningDir = path.join(tmpdir, '.planning')
  await fs.mkdir(planningDir, { recursive: true })
  await fs.writeFile(
    path.join(planningDir, 'config.json'),
    JSON.stringify({}, null, 2)
  )
}

function configSet(tmpdir, key, value) {
  return JSON.parse(execFileSync('node', [GSD_TOOLS, 'config-set', key, value], {
    cwd: tmpdir,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim())
}

async function readConfig(tmpdir) {
  return JSON.parse(await fs.readFile(path.join(tmpdir, '.planning', 'config.json'), 'utf8'))
}

function getNestedValue(object, keyPath) {
  return keyPath.split('.').reduce((current, key) => current?.[key], object)
}

describe('config-set accepts fork config namespaces', () => {
  const cases = [
    ['devops.ci_provider', 'github-actions', 'github-actions'],
    ['automation.level', '3', 3],
    ['release.version_file', 'package.json', 'package.json'],
    ['signal_lifecycle.lifecycle_strictness', 'strict', 'strict'],
    ['codex_hooks_waived', 'true', true],
    ['codex_hooks_waiver_reason', 'project_inconclusive_global_enabled', 'project_inconclusive_global_enabled'],
    ['codex_hooks_waiver_checked_at', '2026-04-21T12:34:56.000Z', '2026-04-21T12:34:56.000Z'],
    ['codex_hooks_waiver_scope', 'global', 'global'],
    ['codex_hooks_waiver_evidence', '{"enabled_sources":["global"],"explicit_conflict":true}', { enabled_sources: ['global'], explicit_conflict: true }],
  ]

  for (const [keyPath, value, expected] of cases) {
    tmpdirTest(`${keyPath} is accepted`, async ({ tmpdir }) => {
      await createConfig(tmpdir)

      const result = configSet(tmpdir, keyPath, value)
      const config = await readConfig(tmpdir)

      expect(result.updated).toBe(true)
      expect(result.key).toBe(keyPath)
      expect(getNestedValue(config, keyPath)).toEqual(expected)
    })
  }
})
