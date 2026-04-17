import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

const SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/claude.cjs')
const RUNTIME_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/runtime.cjs')
const REGISTRY_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/registry.cjs')

const sources = require(SOURCE_PATH)
const runtime = require(RUNTIME_PATH)
const registry = require(REGISTRY_PATH)

function getExtractor(name) {
  const extractor = runtime.RUNTIME_EXTRACTORS.find((entry) => entry.name === name)
  if (!extractor) {
    throw new Error(`Missing extractor: ${name}`)
  }
  return extractor
}

function assistantRecord(blocks) {
  return {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: blocks,
    },
  }
}

function userRecord(content) {
  return {
    type: 'user',
    message: {
      role: 'user',
      content,
    },
  }
}

function makeSession(overrides = {}) {
  const records = overrides.parent_jsonl && Array.isArray(overrides.parent_jsonl.records)
    ? overrides.parent_jsonl.records
    : []
  const parentJsonl = {
    status: 'matched',
    path: null,
    project_dir_path: null,
    candidate_project_dirs: [],
    record_count: records.length,
    records,
    ...(overrides.parent_jsonl || {}),
  }

  if (!Array.isArray(parentJsonl.records)) {
    parentJsonl.records = []
  }

  if (parentJsonl.record_count == null) {
    parentJsonl.record_count = parentJsonl.records.length
  }

  return {
    session_id: overrides.session_id || 'sess-intervention',
    parent_jsonl: parentJsonl,
  }
}

function runExtractor(name, sessions) {
  return getExtractor(name).extract({
    observed_at: '2026-04-17T05:45:00.000Z',
    claude: { sessions },
  })
}

describe('measurement intervention-point helper', () => {
  it('counts stop-style redirects after two assistant turns', () => {
    const scan = sources.scanInterventionPoints([
      userRecord('initial request'),
      assistantRecord([{ type: 'text', text: 'step one' }]),
      assistantRecord([{ type: 'text', text: 'step two' }]),
      userRecord('stop, I want Y instead'),
    ])

    expect(scan.intervention_count).toBe(1)
    expect(scan.intervention_positions).toEqual([3])
    expect(scan.sampled_matches).toEqual([{ position: 3, marker: 'stop' }])
  })

  it('treats request-interrupted placeholders as structural intervention markers', () => {
    const scan = sources.scanInterventionPoints([
      assistantRecord([{ type: 'text', text: 'working' }]),
      assistantRecord([{ type: 'text', text: 'still working' }]),
      userRecord('[Request interrupted by user]'),
    ])

    expect(scan.intervention_count).toBe(1)
    expect(scan.sampled_matches).toEqual([{ position: 2, marker: 'request_interrupted' }])
  })

  it('ignores tool-result echoes and single-assistant prefixes', () => {
    const toolEcho = sources.scanInterventionPoints([
      assistantRecord([{ type: 'text', text: 'first' }]),
      assistantRecord([{ type: 'text', text: 'second' }]),
      userRecord([{ type: 'tool_result', content: 'stop' }]),
    ])
    const oneAssistant = sources.scanInterventionPoints([
      assistantRecord([{ type: 'text', text: 'first' }]),
      userRecord('STOP - let me redirect'),
    ])

    expect(toolEcho.intervention_count).toBe(0)
    expect(oneAssistant.intervention_count).toBe(0)
  })
})

describe('measurement intervention-points extractor', () => {
  it('emits live rows with counts only and drops calibration-only fields', () => {
    const [row] = runExtractor('intervention_points', [
      makeSession({
        session_id: 'sess-live',
        parent_jsonl: {
          status: 'matched',
          records: [
            assistantRecord([{ type: 'text', text: 'first' }]),
            assistantRecord([{ type: 'text', text: 'second' }]),
            userRecord('[Request interrupted by user]'),
          ],
        },
      }),
    ])

    expect(row.availability_status).toBe('exposed')
    expect(row.runtime).toBe('claude-code')
    expect(row.symmetry_marker).toBe('asymmetric_only')
    expect(row.value.intervention_count).toBe(1)
    expect(row.value.intervention_positions).toEqual([2])
    expect(row.value.total_turns).toBe(3)
    expect(row.value.sampled_matches).toBeUndefined()
    expect(row.provenance.heuristic_version).toBe('57.7-v1')
    expect(row.provenance.content_contract).toBe('derived_features_only')
  })

  it('emits not_emitted or not_available when appropriate', () => {
    const [noHits] = runExtractor('intervention_points', [
      makeSession({
        session_id: 'sess-no-hits',
        parent_jsonl: {
          status: 'matched',
          records: [
            assistantRecord([{ type: 'text', text: 'first' }]),
            userRecord('actually redirect, but only one assistant turn'),
          ],
        },
      }),
    ])
    const [missing] = runExtractor('intervention_points', [
      makeSession({
        session_id: 'sess-missing',
        parent_jsonl: {
          status: 'source_unavailable',
          records: [],
        },
      }),
    ])

    expect(noHits.availability_status).toBe('not_emitted')
    expect(noHits.value.intervention_count).toBe(0)
    expect(missing.availability_status).toBe('not_available')
    expect(missing.value.total_turns).toBe(0)
  })

  it('preserves content_contract on the registry entry and exports the extractor', () => {
    const built = registry.buildRegistry()
    const entry = built.extractors.find((record) => record.name === 'intervention_points')

    expect(entry).toBeTruthy()
    expect(entry.content_contract).toBe('derived_features_only')
    expect(runtime.RUNTIME_EXTRACTORS.some((record) => record.name === 'intervention_points')).toBe(true)
    expect(runtime.intervention_points.name).toBe('intervention_points')
  })
})
