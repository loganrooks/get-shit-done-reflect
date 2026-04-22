import { describe, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')
const REGISTRY = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/registry.cjs'))
const { loadGsdr } = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/gsdr.cjs'))
const { loadSessionMetaPostlude } = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/session-meta-postlude.cjs'))
const { buildGsdrExtractors } = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/gsdr.cjs'))

async function setupGsdrProject(tmpdir, options = {}) {
  await fsp.mkdir(path.join(tmpdir, '.planning', 'phases', '01-test'), { recursive: true })
  await fsp.mkdir(path.join(tmpdir, '.planning', 'knowledge', 'signals', 'demo'), { recursive: true })

  const config = options.config || {
    mode: 'yolo',
    automation: {
      stats: {},
    },
  }

  await fsp.writeFile(
    path.join(tmpdir, '.planning', 'config.json'),
    JSON.stringify(config, null, 2)
  )
  await fsp.writeFile(
    path.join(tmpdir, '.planning', 'STATE.md'),
    '# State\n\nMinimal state for measurement-gsdr tests.\n'
  )
  await fsp.writeFile(
    path.join(tmpdir, '.planning', 'phases', '01-test', '01-01-SUMMARY.md'),
    '# Summary\n\nMeasurement summary fixture.\n'
  )
  await fsp.writeFile(
    path.join(tmpdir, '.planning', 'phases', '01-test', '01-VERIFICATION.md'),
    '# Verification\n\nMeasurement verification fixture.\n'
  )
  await fsp.writeFile(
    path.join(tmpdir, '.planning', 'knowledge', 'signals', 'demo', 'sig-one.md'),
    `---
id: sig-one
type: signal
project: demo
created: 2026-04-16T10:00:00Z
updated: 2026-04-16T10:00:00Z
status: active
severity: notable
signal_type: deviation
---

Signal body.
`
  )
}

function gitInit(tmpdir) {
  execSync('git init', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git config user.email "tests@example.com"', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git config user.name "Tests"', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git add .planning', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git commit -m "seed gsdr measurement fixtures"', { cwd: tmpdir, stdio: 'ignore' })
}

function runTrackEvent(tmpdir, feature, event, reason) {
  const extra = reason ? ` "${reason}"` : ''
  const result = execSync(
    `node "${GSD_TOOLS}" automation track-event ${feature} ${event}${extra} --cwd "${tmpdir}" --raw`,
    { cwd: tmpdir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  )
  return JSON.parse(result.trim())
}

function runSensorsList(tmpdir) {
  const result = execSync(
    `node "${GSD_TOOLS}" sensors list --cwd "${tmpdir}" --raw`,
    { cwd: tmpdir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  )
  return JSON.parse(result.trim())
}

function runKbRebuild(tmpdir) {
  execSync(
    `node "${GSD_TOOLS}" kb rebuild --cwd "${tmpdir}" --raw`,
    { cwd: tmpdir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  )
}

function runGsdrExtractors(tmpdir, extraContext = {}) {
  const extractors = buildGsdrExtractors({
    defineExtractor: REGISTRY.defineExtractor,
    buildFeatureRecord: REGISTRY.buildFeatureRecord,
  })

  const context = {
    cwd: tmpdir,
    observed_at: '2026-04-16T20:00:00Z',
    ...extraContext,
  }

  return extractors.flatMap(extractor => extractor.extract(context))
}

async function writePostludeFixture(tmpdir, lines, fileName = 'fixture.jsonl') {
  const fixtureDir = path.join(tmpdir, '.planning', 'measurement', 'session-meta-postlude')
  await fsp.mkdir(fixtureDir, { recursive: true })
  await fsp.writeFile(path.join(fixtureDir, fileName), `${lines.join('\n')}\n`)
  return path.join(fixtureDir, fileName)
}

describe('measurement GSDR sources', () => {
  tmpdirTest('loadGsdr reads summaries, verifications, signal files, and git history', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)
    gitInit(tmpdir)

    const raw = loadGsdr(tmpdir, { observedAt: '2026-04-16T20:00:00Z' })

    expect(raw.config.exists).toBe(true)
    expect(raw.artifacts.summaries).toHaveLength(1)
    expect(raw.artifacts.verifications).toHaveLength(1)
    expect(raw.artifacts.signals).toHaveLength(1)
    expect(raw.artifacts.git_history.available).toBe(true)
    expect(raw.artifacts.git_history.commits.length).toBeGreaterThan(0)
    expect(raw.artifacts.git_history.commits[0].artifact_types).toContain('SUMMARY')
    expect(raw.artifacts.git_history.commits[0].artifact_types).toContain('VERIFICATION')
    expect(raw.artifacts.git_history.commits[0].artifact_types).toContain('SIGNAL')
  })

  tmpdirTest('loadSessionMetaPostlude tolerates a missing postlude directory', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)

    const rows = loadSessionMetaPostlude(tmpdir, { phase: '57.9' })

    expect(rows).toEqual([])
  })

  tmpdirTest('loadSessionMetaPostlude adapts canonical rows, preserves source_file, and skips malformed lines', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)
    const fixturePath = await writePostludeFixture(tmpdir, [
      '{not-json',
      JSON.stringify({
        ts: '2026-04-22T01:00:00Z',
        phase: '57.9',
        runtime: 'codex-cli',
        postlude_fired: true,
        error_rate: { status: 'not_available', reason: 'not_computed_in_closeout_hook' },
        direction_change: { status: 'not_available', reason: 'downstream_live_wiring_not_shipped' },
        destructive_event: { status: 'not_available', reason: 'downstream_live_wiring_not_shipped' },
      }),
    ])

    const rows = loadSessionMetaPostlude(tmpdir, { phase: '57.9' })

    expect(rows).toHaveLength(4)
    expect(rows[0]).toMatchObject({
      gate: 'GATE-06',
      result: 'pass',
      marker: 'postlude_fired',
      source_file: fixturePath,
    })
    expect(rows.filter(row => row.gate === 'GATE-07' && row.result === 'waived')).toHaveLength(3)
    expect(rows.every(row => row.source_file === fixturePath)).toBe(true)
  })

  tmpdirTest('loadSessionMetaPostlude honors phase filtering', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)
    await writePostludeFixture(tmpdir, [
      JSON.stringify({
        ts: '2026-04-22T01:00:00Z',
        phase: '57.8',
        postlude_fired: true,
      }),
      JSON.stringify({
        ts: '2026-04-22T01:05:00Z',
        phase: '57.9',
        postlude_fired: true,
        error_rate: { status: 'not_available', reason: 'not_computed_in_closeout_hook' },
      }),
    ])

    const rows = loadSessionMetaPostlude(tmpdir, { phase: '57.9' })

    expect(rows).toHaveLength(2)
    expect(rows.every(row => row.phase === '57.9')).toBe(true)
  })
})

describe('measurement GSDR extractors', () => {
  tmpdirTest('automation signal yield persists through track-event without breaking sensor summaries', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)
    await fsp.mkdir(path.join(tmpdir, 'agents'), { recursive: true })
    await fsp.writeFile(
      path.join(tmpdir, 'agents', 'gsdr-artifact-sensor.md'),
      `---
name: gsdr-artifact-sensor
sensor_name: artifact
timeout_seconds: 30
---
<role>Test sensor</role>
`
    )

    const tracked = runTrackEvent(tmpdir, 'sensor_artifact', 'fire', 'signal-count=4')
    const listed = runSensorsList(tmpdir)
    const rows = runGsdrExtractors(tmpdir)
    const yieldRow = rows.find(row => row.feature_name === 'automation_signal_yield')

    expect(tracked.stats.last_signal_count).toBe(4)
    expect(listed.sensors[0].signals).toBe(4)
    expect(listed.sensors[0].last_status).toBe('success')
    expect(yieldRow.availability_status).toBe('exposed')
    expect(yieldRow.value.total_last_signal_count).toBe(4)
    expect(yieldRow.value.sensors[0].last_signal_count).toBe(4)
  })

  tmpdirTest('intervention lifecycle trace reports the retroactive artifact surface', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)
    gitInit(tmpdir)

    const rows = runGsdrExtractors(tmpdir)
    const traceRow = rows.find(row => row.feature_name === 'intervention_lifecycle_artifact_trace')

    expect(traceRow.availability_status).toBe('exposed')
    expect(traceRow.value.summaries.count).toBe(1)
    expect(traceRow.value.verifications.count).toBe(1)
    expect(traceRow.value.signals.count).toBe(1)
    expect(traceRow.value.git_trace.available).toBe(true)
    expect(traceRow.value.git_trace.commit_count).toBeGreaterThan(0)
  })

  tmpdirTest('kb signal stats surface stale freshness instead of trusting kb.db silently', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)
    runKbRebuild(tmpdir)

    const signalPath = path.join(tmpdir, '.planning', 'knowledge', 'signals', 'demo', 'sig-one.md')
    const future = new Date(Date.now() + 10000)
    fs.utimesSync(signalPath, future, future)

    const rows = runGsdrExtractors(tmpdir)
    const kbRow = rows.find(row => row.feature_name === 'kb_signal_stats')

    expect(kbRow.availability_status).toBe('derived')
    expect(kbRow.freshness.status).toBe('stale')
    expect(kbRow.value.totals.total_signals).toBe(1)
    expect(kbRow.notes[0]).toMatch(/stale-or-unknown/i)
  })

  tmpdirTest('gate_fire_events consumes session_meta_postlude rows and keeps not_available markers visible as waivers', async ({ tmpdir }) => {
    await setupGsdrProject(tmpdir)
    await writePostludeFixture(tmpdir, [
      JSON.stringify({
        ts: '2026-04-22T01:10:00Z',
        phase: '57.9',
        runtime: 'codex-cli',
        postlude_fired: true,
        error_rate: { status: 'not_available', reason: 'not_computed_in_closeout_hook' },
        direction_change: { status: 'not_available', reason: 'downstream_live_wiring_not_shipped' },
        destructive_event: { status: 'not_available', reason: 'downstream_live_wiring_not_shipped' },
      }),
    ])

    const rows = runGsdrExtractors(tmpdir, { phase: '57.9' })
    const gateRow = rows.find(row => row.feature_name === 'gate_fire_events' && row.runtime === 'codex-cli')

    expect(gateRow.availability_status).toBe('exposed')
    expect(gateRow.value.gate_fire_count).toBe(4)
    expect(gateRow.value.gate_waiver_count).toBe(3)
    expect(gateRow.value.sources_seen.session_meta_postlude).toBe('exposed')
  })
})
