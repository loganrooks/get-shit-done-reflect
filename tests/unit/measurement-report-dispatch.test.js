import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

const DISPATCH_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/report/dispatch.cjs')
const QUERY_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/query.cjs')

const queryModule = require(QUERY_PATH)

function loadDispatch() {
  delete require.cache[DISPATCH_PATH]
  return require(DISPATCH_PATH)
}

function makeQueryResult() {
  return {
    anomaly_register: [],
    coverage: {
      by_source_family: {
        GSDR: {
          missing_sources: [],
          stale_sources: [],
          unknown_sources: [],
        },
      },
      extractor_registry_size: 26,
      feature_row_count: 3,
    },
    distinguishing_features: [],
    features: [
      {
        availability_status: 'exposed',
        feature: 'automation_health',
        reliability_tier: 'direct_observation',
        runtime: 'project',
        symmetry_marker: 'symmetric_available',
        value: { healthy: true },
      },
      {
        availability_status: 'derived',
        feature: 'derived_write_path_provenance:/tmp/report.md',
        reliability_tier: 'artifact_derived',
        runtime: 'claude-code',
        symmetry_marker: 'asymmetric_only',
        value: { write_path: 'bulk' },
      },
      {
        availability_status: 'exposed',
        feature: 'skip_reason_canonical:signal_collection',
        reliability_tier: 'direct_observation',
        runtime: 'project',
        symmetry_marker: 'asymmetric_only',
        value: { canonical: true },
      },
    ],
    interpretations: [
      {
        competing_readings: ['Coverage is explicit.', 'Coverage can still drift.'],
        id: 'interp-1',
        reliability_tier: 'artifact_derived',
        summary: 'Pipeline integrity stays visible.',
      },
    ],
    provenance: {
      live_overlay: { extractor_count: 26 },
      source_snapshots: [
        { observed_at: '2026-04-16T21:00:00.000Z' },
      ],
      store: { rebuilt_at: '2026-04-16T20:55:00.000Z' },
    },
    reliability: {
      overall_tier: 'artifact_derived',
    },
    runtime_dimension: {
      by_feature: [],
      runtimes_observed: ['project'],
    },
    scope: {
      cwd: process.cwd(),
      level: 'project',
      runtime_filter: null,
    },
  }
}

afterEach(() => {
  delete require.cache[DISPATCH_PATH]
  vi.restoreAllMocks()
})

describe('measurement report dispatch', () => {
  it('parses the first positional argument as the loop', () => {
    const { parseReportArgs } = loadDispatch()

    expect(parseReportArgs(['pipeline_integrity'])).toEqual({
      loop: 'pipeline_integrity',
      opts: {
        runtime: null,
        stratified: true,
      },
    })
  })

  it('parses --no-stratification', () => {
    const { parseReportArgs } = loadDispatch()

    expect(parseReportArgs(['signal_quality', '--no-stratification']).opts.stratified).toBe(false)
  })

  it('parses --runtime <name>', () => {
    const { parseReportArgs } = loadDispatch()

    expect(parseReportArgs(['cross_runtime_comparison', '--runtime', 'codex-cli']).opts.runtime).toBe('codex-cli')
  })

  it('returns an error for an unknown loop', () => {
    const { cmdMeasurementReport } = loadDispatch()

    expect(cmdMeasurementReport(process.cwd(), ['unknown_loop'], false)).toEqual({
      error: expect.stringMatching(/Unknown loop "unknown_loop"/),
    })
  })

  it('calls queryMeasurement exactly once for a known loop', () => {
    const querySpy = vi.spyOn(queryModule, 'queryMeasurement').mockReturnValue(makeQueryResult())
    const { cmdMeasurementReport } = loadDispatch()

    cmdMeasurementReport(process.cwd(), ['pipeline_integrity'], false)

    expect(querySpy).toHaveBeenCalledTimes(1)
    expect(querySpy).toHaveBeenCalledWith(process.cwd(), {
      question: 'pipeline_integrity',
      runtime: null,
      scope: 'project',
    })
  })

  it('returns the raw query result when raw=true', () => {
    const queryResult = makeQueryResult()
    vi.spyOn(queryModule, 'queryMeasurement').mockReturnValue(queryResult)
    const { cmdMeasurementReport } = loadDispatch()

    expect(cmdMeasurementReport(process.cwd(), ['pipeline_integrity'], true)).toBe(queryResult)
  })

  it('returns markdown text in __text when raw=false', () => {
    vi.spyOn(queryModule, 'queryMeasurement').mockReturnValue(makeQueryResult())
    const { cmdMeasurementReport } = loadDispatch()

    const result = cmdMeasurementReport(process.cwd(), ['pipeline_integrity'], false)

    expect(result).toEqual({
      __text: expect.any(String),
    })
    expect(result.__text).toContain('# Pipeline Integrity Report')
    expect(result.__text).toContain('## Feature Summary')
  })
})
