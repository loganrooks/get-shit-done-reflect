import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { execSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.js')

/**
 * Helper: create a temp project with .planning/config.json and run resolve-level
 */
async function setupAndResolve(tmpdir, config, feature, extraArgs = []) {
  const planningDir = path.join(tmpdir, '.planning')
  await fs.mkdir(planningDir, { recursive: true })
  await fs.writeFile(
    path.join(planningDir, 'config.json'),
    JSON.stringify(config, null, 2)
  )

  const args = ['automation', 'resolve-level', feature, '--raw', ...extraArgs]
  const result = execSync(`node "${GSD_TOOLS}" ${args.join(' ')}`, {
    cwd: tmpdir,
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  return JSON.parse(result.trim())
}

describe('automation resolve-level', () => {
  describe('global level resolution', () => {
    tmpdirTest('default level (no automation section) returns effective=1', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, { mode: 'yolo' }, 'some_feature')
      expect(result.configured).toBe(1)
      expect(result.effective).toBe(1)
      expect(result.reasons).toEqual([])
    })

    tmpdirTest('explicit level 0 returns effective=0', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: { level: 0 }
      }, 'some_feature')
      expect(result.configured).toBe(0)
      expect(result.effective).toBe(0)
    })

    tmpdirTest('explicit level 3 returns effective=3', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: { level: 3 }
      }, 'some_feature')
      expect(result.configured).toBe(3)
      expect(result.effective).toBe(3)
    })
  })

  describe('per-feature overrides (AUTO-02)', () => {
    tmpdirTest('override exists: effective uses override value, not global', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          overrides: { signal_collection: 3 }
        }
      }, 'signal_collection')
      expect(result.configured).toBe(1)
      expect(result.override).toBe(3)
      expect(result.effective).toBe(3)
      expect(result.reasons).toContain('override: signal_collection=3')
    })

    tmpdirTest('override does not exist: effective uses global level', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 2,
          overrides: { signal_collection: 3 }
        }
      }, 'health_check')
      expect(result.configured).toBe(2)
      expect(result.override).toBeNull()
      expect(result.effective).toBe(2)
      expect(result.reasons).toEqual([])
    })

    tmpdirTest('hyphenated feature name is normalized for override lookup', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          overrides: { signal_collection: 3 }
        }
      }, 'signal-collection')
      expect(result.feature).toBe('signal_collection')
      expect(result.override).toBe(3)
      expect(result.effective).toBe(3)
      expect(result.reasons).toContain('override: signal_collection=3')
    })

    tmpdirTest('override with value 0 correctly sets effective to 0', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { signal_collection: 0 }
        }
      }, 'signal_collection')
      expect(result.override).toBe(0)
      expect(result.effective).toBe(0)
      expect(result.reasons).toContain('override: signal_collection=0')
    })
  })

  describe('context-aware deferral (AUTO-04)', () => {
    tmpdirTest('level 3 with context > threshold: effective=1 (nudge)', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          overrides: { signal_collection: 3 },
          context_threshold_pct: 60
        }
      }, 'signal_collection', ['--context-pct', '75'])
      expect(result.effective).toBe(1)
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('context_deferred')
        ])
      )
    })

    tmpdirTest('level 3 with context < threshold: effective stays 3', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          overrides: { signal_collection: 3 },
          context_threshold_pct: 60
        }
      }, 'signal_collection', ['--context-pct', '50'])
      expect(result.effective).toBe(3)
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('context_deferred')
        ])
      )
    })

    tmpdirTest('level 2 with context > threshold: no deferral (only level 3 defers)', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          overrides: { health_check: 2 },
          context_threshold_pct: 60
        }
      }, 'health_check', ['--context-pct', '75'])
      expect(result.effective).toBe(2)
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('context_deferred')
        ])
      )
    })

    tmpdirTest('custom context_threshold_pct is respected', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          context_threshold_pct: 80
        }
      }, 'some_feature', ['--context-pct', '75'])
      // 75% < 80% threshold, so no deferral
      expect(result.effective).toBe(3)
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('context_deferred')
        ])
      )
    })

    tmpdirTest('default threshold is 60% when not specified', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3
        }
      }, 'some_feature', ['--context-pct', '65'])
      // 65% > 60% default threshold, level 3 -> deferred to 1
      expect(result.effective).toBe(1)
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('context_deferred: 65% > 60% threshold')
        ])
      )
    })
  })

  describe('runtime capability capping', () => {
    tmpdirTest('hook_dependent_above: feature capped on constrained runtime', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { health_check: 3 }
        }
      }, 'health_check', ['--runtime', 'constrained'])
      // health_check: hook_dependent_above=2, no hooks -> capped at 2
      expect(result.effective).toBe(2)
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped: health_check needs hooks above level 2')
        ])
      )
    })

    tmpdirTest('ci_status capped at level 1 on constrained runtime (hook_dependent_above=1)', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { ci_status: 3 }
        }
      }, 'ci_status', ['--runtime', 'constrained'])
      expect(result.effective).toBe(1)
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped: ci_status needs hooks above level 1')
        ])
      )
    })

    tmpdirTest('no hook dependency: no capping regardless of runtime', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { signal_collection: 3 }
        }
      }, 'signal_collection', ['--runtime', 'constrained'])
      // signal_collection: hook_dependent_above=null -> no hook cap
      // signal_collection: task_tool_dependent=false -> no task tool cap
      expect(result.effective).toBe(3)
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped')
        ])
      )
    })

    tmpdirTest('task_tool_dependent: reflection capped at 2 on constrained runtime', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { reflection: 3 }
        }
      }, 'reflection', ['--runtime', 'constrained'])
      // reflection: task_tool_dependent=true, no task tool -> capped at 2
      expect(result.effective).toBe(2)
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped: reflection needs task_tool above level 2')
        ])
      )
    })

    tmpdirTest('full runtime: no capping applied', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { health_check: 3 }
        }
      }, 'health_check', ['--runtime', 'full'])
      expect(result.effective).toBe(3)
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped')
        ])
      )
    })

    tmpdirTest('unknown feature: no runtime constraints applied', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3
        }
      }, 'unknown_feature', ['--runtime', 'constrained'])
      expect(result.effective).toBe(3)
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped')
        ])
      )
    })

    tmpdirTest('heuristic: detects hooks from .claude/settings.json', async ({ tmpdir }) => {
      // Create .claude/settings.json with hooks
      const claudeDir = path.join(tmpdir, '.claude')
      await fs.mkdir(claudeDir, { recursive: true })
      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify({ hooks: { pre_tool_use: [] } })
      )

      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { health_check: 3 }
        }
      }, 'health_check')
      // Hooks detected via heuristic -> no capping
      expect(result.effective).toBe(3)
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped')
        ])
      )
    })

    tmpdirTest('heuristic: no settings.json means constrained runtime', async ({ tmpdir }) => {
      // No .claude/settings.json -> constrained
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 3,
          overrides: { health_check: 3 }
        }
      }, 'health_check')
      // No hooks detected -> capped at 2
      expect(result.effective).toBe(2)
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped: health_check needs hooks above level 2')
        ])
      )
    })
  })

  describe('fine-grained knobs (AUTO-03)', () => {
    tmpdirTest('knobs present in config: included in output', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          signal_collection: {
            auto_collect: true,
            context_threshold_pct: 65
          }
        }
      }, 'signal_collection')
      expect(result.knobs).toEqual({
        auto_collect: true,
        context_threshold_pct: 65
      })
    })

    tmpdirTest('knobs absent: knobs field is empty object', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: { level: 1 }
      }, 'signal_collection')
      expect(result.knobs).toEqual({})
    })

    tmpdirTest('knobs with hyphenated feature name are resolved', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          signal_collection: { auto_collect: true }
        }
      }, 'signal-collection')
      expect(result.knobs).toEqual({ auto_collect: true })
    })
  })

  describe('full resolution chain integration', () => {
    tmpdirTest('override -> context deferral -> runtime cap applied in order', async ({ tmpdir }) => {
      // Start: global=1, override=3
      // Context deferral: 3 at 75% > 60% -> deferred to 1
      // Runtime cap: not applicable (already at 1, below any cap)
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          overrides: { health_check: 3 },
          context_threshold_pct: 60
        }
      }, 'health_check', ['--context-pct', '75', '--runtime', 'constrained'])
      expect(result.effective).toBe(1)
      expect(result.reasons).toContain('override: health_check=3')
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('context_deferred')
        ])
      )
      // Runtime cap should NOT appear because context deferral already dropped to 1
      expect(result.reasons).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped')
        ])
      )
    })

    tmpdirTest('override -> no deferral -> runtime cap', async ({ tmpdir }) => {
      // Start: global=1, override=3
      // Context: not provided
      // Runtime cap: health_check needs hooks above 2, constrained -> cap at 2
      const result = await setupAndResolve(tmpdir, {
        automation: {
          level: 1,
          overrides: { health_check: 3 }
        }
      }, 'health_check', ['--runtime', 'constrained'])
      expect(result.effective).toBe(2)
      expect(result.reasons).toContain('override: health_check=3')
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('runtime_capped')
        ])
      )
    })

    tmpdirTest('level_names always present in output', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: { level: 2 }
      }, 'any_feature')
      expect(result.level_names).toEqual({
        '0': 'manual',
        '1': 'nudge',
        '2': 'prompt',
        '3': 'auto'
      })
    })

    tmpdirTest('output shape includes all required fields', async ({ tmpdir }) => {
      const result = await setupAndResolve(tmpdir, {
        automation: { level: 1 }
      }, 'some_feature')
      expect(result).toHaveProperty('feature')
      expect(result).toHaveProperty('configured')
      expect(result).toHaveProperty('override')
      expect(result).toHaveProperty('effective')
      expect(result).toHaveProperty('reasons')
      expect(result).toHaveProperty('knobs')
      expect(result).toHaveProperty('level_names')
    })
  })
})
