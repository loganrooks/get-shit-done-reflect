import { describe, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')
const REGISTRY_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/registry.cjs')

const [major, minor] = process.versions.node.split('.').map(Number)
const hasNodeSqlite = major > 22 || (major === 22 && minor >= 5)
const describeIf = hasNodeSqlite ? describe : describe.skip

function runMeasurement(tmpdir, args = []) {
  const command = ['measurement', ...args, '--raw'].join(' ')
  const result = execSync(`node --no-warnings "${GSD_TOOLS}" ${command}`, {
    cwd: tmpdir,
    env: { ...process.env, HOME: path.join(tmpdir, 'home') },
    encoding: 'utf-8',
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  return JSON.parse(result.trim())
}

async function setupMeasurementProject(tmpdir) {
  await fsp.mkdir(path.join(tmpdir, 'home'), { recursive: true })
  await fsp.mkdir(path.join(tmpdir, '.planning'), { recursive: true })
  await fsp.writeFile(
    path.join(tmpdir, '.planning', 'config.json'),
    JSON.stringify({ mode: 'yolo', automation: { level: 1 } }, null, 2)
  )
  await fsp.writeFile(
    path.join(tmpdir, '.planning', 'STATE.md'),
    '# State\n\nMinimal test state.\n'
  )
}

function openMeasurementDb(tmpdir) {
  const { DatabaseSync } = require('node:sqlite')
  return new DatabaseSync(path.join(tmpdir, '.planning', 'measurement', 'measurement.db'))
}

describe('measurement router wiring', () => {
  tmpdirTest('returns structured help instead of a router miss', async ({ tmpdir }) => {
    await setupMeasurementProject(tmpdir)
    const help = runMeasurement(tmpdir)
    expect(help.command).toBe('measurement')
    expect(help.subcommands).toHaveProperty('rebuild')
    expect(help.subcommands).toHaveProperty('query')
  })
})

describeIf('measurement store bootstrap', () => {
  tmpdirTest('rebuilds a separate measurement store without touching kb.db', async ({ tmpdir }) => {
    await setupMeasurementProject(tmpdir)

    const rebuild = runMeasurement(tmpdir, ['rebuild'])
    const measurementDbPath = path.join(tmpdir, '.planning', 'measurement', 'measurement.db')
    const kbDbPath = path.join(tmpdir, '.planning', 'knowledge', 'kb.db')

    expect(rebuild.action).toBe('rebuild')
    expect(rebuild.status).toBe('ok')
    expect(rebuild.store.db_path).toBe(measurementDbPath)
    expect(rebuild.store.db_path).not.toContain(path.join('.planning', 'knowledge'))
    expect(fs.existsSync(measurementDbPath)).toBe(true)
    expect(fs.existsSync(kbDbPath)).toBe(false)

    const db = openMeasurementDb(tmpdir)
    const runCount = db.prepare('SELECT COUNT(*) AS count FROM rebuild_runs').get().count
    const featureCount = db.prepare('SELECT COUNT(*) AS count FROM feature_records').get().count
    db.close()

    expect(runCount).toBe(1)
    expect(featureCount).toBeGreaterThan(0)
  })
})

describe('measurement registry contract', () => {
  const { buildRegistry, validateExtractorEntry } = require(REGISTRY_PATH)

  tmpdirTest('default registry entries expose required metadata fields', async () => {
    const registry = buildRegistry()
    expect(registry.extractors.length).toBeGreaterThan(0)

    for (const extractor of registry.extractors) {
      expect(extractor).toHaveProperty('name')
      expect(extractor).toHaveProperty('source_family')
      expect(extractor).toHaveProperty('raw_sources')
      expect(extractor).toHaveProperty('runtimes')
      expect(extractor).toHaveProperty('reliability_tier')
      expect(extractor).toHaveProperty('features_produced')
      expect(extractor).toHaveProperty('serves_loop')
      expect(extractor).toHaveProperty('distinguishes')
    }
  })

  tmpdirTest('missing family metadata is rejected explicitly', async () => {
    expect(() => validateExtractorEntry({
      name: 'broken_extractor',
      raw_sources: ['source_a'],
      runtimes: ['claude-code'],
      reliability_tier: 'artifact_derived',
      features_produced: ['feature_a'],
      serves_loop: ['pipeline_integrity'],
      distinguishes: ['coverage_gap'],
    })).toThrow(/source_family/)
  })
})

describeIf('measurement query contract', () => {
  tmpdirTest('preserves provenance freshness and symmetry fields before full coverage exists', async ({ tmpdir }) => {
    await setupMeasurementProject(tmpdir)

    runMeasurement(tmpdir, ['rebuild'])
    const response = runMeasurement(tmpdir, ['query', 'overview'])

    expect(response).toHaveProperty('question', 'overview')
    expect(response).toHaveProperty('scope')
    expect(response).toHaveProperty('features')
    expect(response).toHaveProperty('interpretations')
    expect(response).toHaveProperty('distinguishing_features')
    expect(response).toHaveProperty('anomaly_register')
    expect(response).toHaveProperty('provenance')
    expect(response).toHaveProperty('reliability')
    expect(response).toHaveProperty('coverage')
    expect(response).toHaveProperty('freshness')

    expect(response.provenance).toHaveProperty('store')
    expect(response.provenance.store.present).toBe(true)
    expect(response.freshness).toHaveProperty('status')
    expect(['fresh', 'stale', 'unknown']).toContain(response.freshness.status)

    expect(response.contract.runtime_symmetry_markers).toEqual([
      'symmetric_available',
      'symmetric_unavailable',
      'asymmetric_derived',
      'asymmetric_only',
    ])
    expect(response.contract.runtime_symmetry_markers).toContain('asymmetric_only')
    expect(response.contract.feature_availability_statuses).toContain('not_available')

    expect(response.features.length).toBeGreaterThan(0)
    const feature = response.features[0]
    expect(feature).toHaveProperty('availability_status')
    expect(feature).toHaveProperty('symmetry_marker')
    expect(response.contract.runtime_symmetry_markers).not.toContain(feature.availability_status)
    expect(response.contract.feature_availability_statuses).not.toContain(feature.symmetry_marker)
  })
})
