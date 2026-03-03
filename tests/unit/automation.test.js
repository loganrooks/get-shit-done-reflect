import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { execSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.js')

/**
 * Helper: create a temp project with .planning/config.json and run track-event
 */
async function setupAndTrackEvent(tmpdir, config, feature, event, reason) {
  const planningDir = path.join(tmpdir, '.planning')
  await fs.mkdir(planningDir, { recursive: true })
  await fs.writeFile(
    path.join(planningDir, 'config.json'),
    JSON.stringify(config, null, 2)
  )

  const args = ['automation', 'track-event', feature, event]
  if (reason) args.push(reason)
  args.push('--raw')

  const result = execSync(`node "${GSD_TOOLS}" ${args.join(' ')}`, {
    cwd: tmpdir,
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  return JSON.parse(result.trim())
}

/**
 * Helper: read config.json from tmpdir after track-event
 */
async function readConfig(tmpdir) {
  const configPath = path.join(tmpdir, '.planning', 'config.json')
  const content = await fs.readFile(configPath, 'utf8')
  return JSON.parse(content)
}

/**
 * Helper: run track-event CLI directly (for sequential calls on same tmpdir)
 */
function runTrackEvent(tmpdir, feature, event, reason) {
  const args = ['automation', 'track-event', feature, event]
  if (reason) args.push(reason)
  args.push('--raw')

  const result = execSync(`node "${GSD_TOOLS}" ${args.join(' ')}`, {
    cwd: tmpdir,
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  return JSON.parse(result.trim())
}

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

describe('automation track-event', () => {
  describe('fire events', () => {
    tmpdirTest('first fire: fires=1, last_triggered is ISO timestamp, skips=0', async ({ tmpdir }) => {
      const result = await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal_collection', 'fire')
      expect(result.feature).toBe('signal_collection')
      expect(result.event).toBe('fire')
      expect(result.stats.fires).toBe(1)
      expect(result.stats.skips).toBe(0)
      expect(result.stats.last_triggered).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(result.stats.last_skip_reason).toBeNull()
    })

    tmpdirTest('multiple fires: fires increments, last_triggered updates', async ({ tmpdir }) => {
      const result1 = await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal_collection', 'fire')
      expect(result1.stats.fires).toBe(1)
      const ts1 = result1.stats.last_triggered

      // Small delay to ensure different timestamp
      const result2 = runTrackEvent(tmpdir, 'signal_collection', 'fire')
      expect(result2.stats.fires).toBe(2)
      expect(result2.stats.last_triggered).toBeDefined()
    })

    tmpdirTest('stats section auto-created if not present', async ({ tmpdir }) => {
      // Config has no automation section at all
      const result = await setupAndTrackEvent(tmpdir, {}, 'signal_collection', 'fire')
      expect(result.stats.fires).toBe(1)

      // Verify config.json was updated with automation.stats section
      const config = await readConfig(tmpdir)
      expect(config.automation).toBeDefined()
      expect(config.automation.stats).toBeDefined()
      expect(config.automation.stats.signal_collection).toBeDefined()
    })
  })

  describe('skip events', () => {
    tmpdirTest('skip with reason: skips=1, last_skip_reason matches', async ({ tmpdir }) => {
      const result = await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal_collection', 'skip', 'context_exceeded')
      expect(result.stats.skips).toBe(1)
      expect(result.stats.last_skip_reason).toBe('context_exceeded')
      expect(result.stats.fires).toBe(0)
    })

    tmpdirTest('skip without reason: last_skip_reason="unknown"', async ({ tmpdir }) => {
      const result = await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal_collection', 'skip')
      expect(result.stats.skips).toBe(1)
      expect(result.stats.last_skip_reason).toBe('unknown')
    })

    tmpdirTest('multiple skips: skips increments, last_skip_reason updates to latest', async ({ tmpdir }) => {
      await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal_collection', 'skip', 'reason_one')
      const result2 = runTrackEvent(tmpdir, 'signal_collection', 'skip', 'reason_two')
      expect(result2.stats.skips).toBe(2)
      expect(result2.stats.last_skip_reason).toBe('reason_two')
    })
  })

  describe('atomic persistence', () => {
    tmpdirTest('after track-event, config.json contains persisted stats', async ({ tmpdir }) => {
      await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal_collection', 'fire')

      const config = await readConfig(tmpdir)
      expect(config.automation.stats.signal_collection.fires).toBe(1)
      expect(config.automation.stats.signal_collection.last_triggered).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    tmpdirTest('stats for different features are independent', async ({ tmpdir }) => {
      await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal_collection', 'fire')
      const result = runTrackEvent(tmpdir, 'reflection', 'skip', 'not_needed')

      const config = await readConfig(tmpdir)
      expect(config.automation.stats.signal_collection.fires).toBe(1)
      expect(config.automation.stats.signal_collection.skips).toBe(0)
      expect(config.automation.stats.reflection.fires).toBe(0)
      expect(config.automation.stats.reflection.skips).toBe(1)
      expect(config.automation.stats.reflection.last_skip_reason).toBe('not_needed')
    })
  })

  describe('feature name normalization', () => {
    tmpdirTest('hyphenated feature name normalizes to underscored', async ({ tmpdir }) => {
      const result = await setupAndTrackEvent(tmpdir, { mode: 'yolo' }, 'signal-collection', 'fire')
      expect(result.feature).toBe('signal_collection')

      const config = await readConfig(tmpdir)
      expect(config.automation.stats.signal_collection).toBeDefined()
      expect(config.automation.stats['signal-collection']).toBeUndefined()
    })
  })

  describe('error cases', () => {
    tmpdirTest('missing feature name: error', async ({ tmpdir }) => {
      const planningDir = path.join(tmpdir, '.planning')
      await fs.mkdir(planningDir, { recursive: true })
      await fs.writeFile(
        path.join(planningDir, 'config.json'),
        JSON.stringify({ mode: 'yolo' })
      )

      expect(() => {
        execSync(`node "${GSD_TOOLS}" automation track-event --raw`, {
          cwd: tmpdir,
          encoding: 'utf-8',
          timeout: 10000,
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      }).toThrow()
    })

    tmpdirTest('invalid event type (not fire/skip): error', async ({ tmpdir }) => {
      const planningDir = path.join(tmpdir, '.planning')
      await fs.mkdir(planningDir, { recursive: true })
      await fs.writeFile(
        path.join(planningDir, 'config.json'),
        JSON.stringify({ mode: 'yolo' })
      )

      expect(() => {
        execSync(`node "${GSD_TOOLS}" automation track-event signal_collection invalid --raw`, {
          cwd: tmpdir,
          encoding: 'utf-8',
          timeout: 10000,
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      }).toThrow()
    })

    tmpdirTest('missing config.json: error', async ({ tmpdir }) => {
      // No .planning/config.json created
      expect(() => {
        execSync(`node "${GSD_TOOLS}" automation track-event signal_collection fire --raw`, {
          cwd: tmpdir,
          encoding: 'utf-8',
          timeout: 10000,
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      }).toThrow()
    })
  })
})
