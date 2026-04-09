import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

/**
 * Helper: run a sensors CLI command and parse JSON output
 */
function runSensors(tmpdir, subcommand, extraArgs = []) {
  const args = ['sensors', subcommand, ...extraArgs, '--raw']
  const result = execSync(`node "${GSD_TOOLS}" ${args.join(' ')}`, {
    cwd: tmpdir,
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  return JSON.parse(result.trim())
}

/**
 * Helper: create a mock sensor agent spec file
 */
async function createSensorSpec(agentsDir, name, opts = {}) {
  const timeout = opts.timeout || 30
  const blindSpots = opts.blindSpots || '- Test blind spot'
  const noBlindSpots = opts.noBlindSpots || false

  let content = `---
name: gsd-${name}-sensor
description: Test ${name} sensor
sensor_name: ${name}
timeout_seconds: ${timeout}
config_schema: null
---

<role>Test sensor</role>
`

  if (!noBlindSpots) {
    content += `
<blind_spots>
## Blind Spots

${blindSpots}
</blind_spots>
`
  }

  await fs.mkdir(agentsDir, { recursive: true })
  await fs.writeFile(path.join(agentsDir, `gsd-${name}-sensor.md`), content)
}

/**
 * Helper: create config.json with sensor config and automation stats
 */
async function createConfig(tmpdir, config) {
  const planningDir = path.join(tmpdir, '.planning')
  await fs.mkdir(planningDir, { recursive: true })
  await fs.writeFile(
    path.join(planningDir, 'config.json'),
    JSON.stringify(config, null, 2)
  )
}

describe('sensors list', () => {
  tmpdirTest('discovers sensor files from agents directory', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'alpha')
    await createSensorSpec(agentsDir, 'beta', { timeout: 60 })

    const result = runSensors(tmpdir, 'list')
    expect(result.sensors).toHaveLength(2)
    expect(result.sensors[0].name).toBe('alpha')
    expect(result.sensors[0].timeout).toBe(30)
    expect(result.sensors[1].name).toBe('beta')
    expect(result.sensors[1].timeout).toBe(60)
  })

  tmpdirTest('shows enabled=true by default when no config entry', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'test')

    const result = runSensors(tmpdir, 'list')
    expect(result.sensors[0].enabled).toBe(true)
  })

  tmpdirTest('shows enabled=false when config says disabled', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'test')
    await createConfig(tmpdir, {
      signal_collection: {
        sensors: {
          test: { enabled: false }
        }
      }
    })

    const result = runSensors(tmpdir, 'list')
    expect(result.sensors[0].enabled).toBe(false)
  })

  tmpdirTest('shows automation stats (fires, skips, last_triggered)', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'test')
    await createConfig(tmpdir, {
      automation: {
        stats: {
          sensor_test: {
            fires: 5,
            skips: 1,
            last_triggered: '2026-03-01T10:00:00Z',
            last_skip_reason: null,
            last_signal_count: 3
          }
        }
      }
    })

    const result = runSensors(tmpdir, 'list')
    expect(result.sensors[0].fires).toBe(5)
    expect(result.sensors[0].skips).toBe(1)
    expect(result.sensors[0].last_run).toBe('2026-03-01T10:00:00Z')
    expect(result.sensors[0].last_status).toBe('success')
    expect(result.sensors[0].signals).toBe(3)
  })

  tmpdirTest('handles missing agents directory gracefully', async ({ tmpdir }) => {
    // No agents dir created -- should error
    expect(() => runSensors(tmpdir, 'list')).toThrow()
  })

  tmpdirTest('handles no sensor files gracefully', async ({ tmpdir }) => {
    // Create agents dir but with no sensor files
    const agentsDir = path.join(tmpdir, 'agents')
    await fs.mkdir(agentsDir, { recursive: true })
    await fs.writeFile(path.join(agentsDir, 'gsd-some-agent.md'), '---\nname: test\n---')

    const result = runSensors(tmpdir, 'list')
    expect(result.sensors).toHaveLength(0)
    expect(result.message).toBe('No sensors discovered')
  })

  tmpdirTest('discovers gsdr- prefixed sensor files from .claude/agents/', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, '.claude', 'agents')
    await fs.mkdir(agentsDir, { recursive: true })

    const content = (name) => `---
name: gsdr-${name}-sensor
description: Test ${name} sensor
sensor_name: ${name}
timeout_seconds: 30
config_schema: null
---

<role>Test sensor</role>

<blind_spots>
## Blind Spots

- Test blind spot
</blind_spots>
`
    await fs.writeFile(path.join(agentsDir, `gsdr-alpha-sensor.md`), content('alpha'))
    await fs.writeFile(path.join(agentsDir, `gsdr-beta-sensor.md`), content('beta'))

    const result = runSensors(tmpdir, 'list')
    expect(result.sensors).toHaveLength(2)
    expect(result.sensors[0].name).toBe('alpha')
    expect(result.sensors[1].name).toBe('beta')
    // Verify no prefix remnant in names
    expect(result.sensors[0].name).not.toContain('gsdr')
    expect(result.sensors[1].name).not.toContain('gsdr')
  })

  tmpdirTest('merges sensors from .claude/agents/ and agents/ directories', async ({ tmpdir }) => {
    // Create both .claude/agents/ with gsdr- and agents/ with gsd-
    const installedDir = path.join(tmpdir, '.claude', 'agents')
    await fs.mkdir(installedDir, { recursive: true })
    await fs.writeFile(path.join(installedDir, 'gsdr-alpha-sensor.md'), `---
name: gsdr-alpha-sensor
description: Test alpha sensor
sensor_name: alpha
timeout_seconds: 30
config_schema: null
---

<role>Test sensor</role>
`)

    const devDir = path.join(tmpdir, 'agents')
    await fs.mkdir(devDir, { recursive: true })
    await fs.writeFile(path.join(devDir, 'gsd-beta-sensor.md'), `---
name: gsd-beta-sensor
description: Test beta sensor
sensor_name: beta
timeout_seconds: 30
config_schema: null
---

<role>Test sensor</role>
`)

    const result = runSensors(tmpdir, 'list')
    // Multi-directory merge: finds sensors from both directories
    expect(result.sensors).toHaveLength(2)
    const names = result.sensors.map(s => s.name)
    expect(names).toContain('alpha')
    expect(names).toContain('beta')
  })

  tmpdirTest('shows last_status from last_skip_reason when present', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'test')
    await createConfig(tmpdir, {
      automation: {
        stats: {
          sensor_test: {
            fires: 2,
            skips: 1,
            last_triggered: '2026-03-01T10:00:00Z',
            last_skip_reason: 'timeout'
          }
        }
      }
    })

    const result = runSensors(tmpdir, 'list')
    expect(result.sensors[0].last_status).toBe('timeout')
  })
})

describe('sensors blind-spots', () => {
  tmpdirTest('extracts blind spots from all sensors', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'alpha', { blindSpots: '- Alpha blind spot 1\n- Alpha blind spot 2' })
    await createSensorSpec(agentsDir, 'beta', { blindSpots: '- Beta blind spot 1' })

    const result = runSensors(tmpdir, 'blind-spots')
    expect(result.blind_spots).toHaveLength(2)
    expect(result.blind_spots[0].sensor).toBe('alpha')
    expect(result.blind_spots[0].blind_spots).toContain('Alpha blind spot 1')
    expect(result.blind_spots[1].sensor).toBe('beta')
    expect(result.blind_spots[1].blind_spots).toContain('Beta blind spot 1')
  })

  tmpdirTest('filters by sensor name argument', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'alpha', { blindSpots: '- Alpha spot' })
    await createSensorSpec(agentsDir, 'beta', { blindSpots: '- Beta spot' })

    const result = runSensors(tmpdir, 'blind-spots', ['beta'])
    expect(result.blind_spots).toHaveLength(1)
    expect(result.blind_spots[0].sensor).toBe('beta')
    expect(result.blind_spots[0].blind_spots).toContain('Beta spot')
  })

  tmpdirTest('handles sensors with no blind_spots section', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'test', { noBlindSpots: true })

    const result = runSensors(tmpdir, 'blind-spots')
    expect(result.blind_spots).toHaveLength(1)
    expect(result.blind_spots[0].blind_spots).toBe('No blind spots documented')
  })

  tmpdirTest('extracts blind spots from gsdr- prefixed sensor files', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, '.claude', 'agents')
    await fs.mkdir(agentsDir, { recursive: true })
    await fs.writeFile(path.join(agentsDir, 'gsdr-test-sensor.md'), `---
name: gsdr-test-sensor
description: Test sensor
sensor_name: test
timeout_seconds: 30
config_schema: null
---

<role>Test sensor</role>

<blind_spots>
## Blind Spots

- GSDR test blind spot
</blind_spots>
`)

    const result = runSensors(tmpdir, 'blind-spots')
    expect(result.blind_spots).toHaveLength(1)
    expect(result.blind_spots[0].sensor).toBe('test')
    // Verify name is correctly parsed (should be "test", not "gsdr-test" or "r-test")
    expect(result.blind_spots[0].sensor).not.toContain('gsdr')
    expect(result.blind_spots[0].sensor).not.toMatch(/^r-/)
    expect(result.blind_spots[0].blind_spots).toContain('GSDR test blind spot')
  })

  tmpdirTest('filters gsdr- sensors by name argument', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, '.claude', 'agents')
    await fs.mkdir(agentsDir, { recursive: true })

    const content = (name, spot) => `---
name: gsdr-${name}-sensor
description: Test ${name} sensor
sensor_name: ${name}
timeout_seconds: 30
config_schema: null
---

<role>Test sensor</role>

<blind_spots>
## Blind Spots

- ${spot}
</blind_spots>
`
    await fs.writeFile(path.join(agentsDir, 'gsdr-alpha-sensor.md'), content('alpha', 'Alpha spot'))
    await fs.writeFile(path.join(agentsDir, 'gsdr-beta-sensor.md'), content('beta', 'Beta spot'))

    const result = runSensors(tmpdir, 'blind-spots', ['beta'])
    expect(result.blind_spots).toHaveLength(1)
    expect(result.blind_spots[0].sensor).toBe('beta')
    expect(result.blind_spots[0].blind_spots).toContain('Beta spot')
  })

  tmpdirTest('errors when filtering by nonexistent sensor name', async ({ tmpdir }) => {
    const agentsDir = path.join(tmpdir, 'agents')
    await createSensorSpec(agentsDir, 'alpha')

    expect(() => runSensors(tmpdir, 'blind-spots', ['nonexistent'])).toThrow()
  })
})
