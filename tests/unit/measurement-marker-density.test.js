import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

const RUNTIME_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/runtime.cjs')
const { RUNTIME_EXTRACTORS } = require(RUNTIME_PATH)

function getExtractor(name) {
  const extractor = RUNTIME_EXTRACTORS.find(entry => entry.name === name)
  if (!extractor) {
    throw new Error(`Missing extractor: ${name}`)
  }
  return extractor
}

function assistantThinkingRecord(text) {
  return {
    type: 'assistant',
    message: {
      content: [{ type: 'thinking', thinking: text }],
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
    session_id: overrides.session_id || 'sess-marker',
    runtime_identity: {
      model: 'claude-sonnet-4-5',
      ...(overrides.runtime_identity || {}),
    },
    effort_override: {
      value: null,
      ...(overrides.effort_override || {}),
    },
    thinking: {
      emitted: false,
      block_count: 0,
      total_chars: 0,
      visible_chars: 0,
      over_visible_ratio: null,
      dispatch_context: 'parent',
      ...(overrides.thinking || {}),
    },
    parent_jsonl: parentJsonl,
  }
}

function runMarkerDensity(sessions) {
  const extractor = getExtractor('marker_density')
  return extractor.extract({
    observed_at: '2026-04-16T20:00:00.000Z',
    claude: { sessions },
  })
}

describe('measurement marker_density extractor', () => {
  it('computes per-1k marker densities from thinking text', () => {
    const text = 'Actually, wait. I am not sure this might work.'
    const session = makeSession({
      session_id: 'sess-marker-counts',
      effort_override: { value: 'medium' },
      thinking: {
        emitted: true,
        block_count: 1,
        total_chars: text.length,
        visible_chars: 0,
        over_visible_ratio: null,
        dispatch_context: 'parent',
      },
      parent_jsonl: {
        status: 'matched',
        records: [assistantThinkingRecord(text)],
      },
    })

    const [row] = runMarkerDensity([session])

    expect(row.availability_status).toBe('exposed')
    expect(row.value.marker_self_correction_count).toBe(2)
    expect(row.value.marker_uncertainty_count).toBe(2)
    expect(row.value.marker_self_correction_density).toBeCloseTo((2 * 1000) / text.length)
    expect(row.value.marker_uncertainty_density).toBeCloseTo((2 * 1000) / text.length)
    expect(row.value.effort_level).toBe('medium')
    expect(row.value.caveat).toBe('effort_tracking_not_quality_proxy')
    expect(row.value.dropped_markers).toEqual(['branching', 'dead_end'])
  })

  it('keeps exposed sessions with zero marker hits at zero density', () => {
    const text = 'This explanation proceeds linearly and stays concrete.'
    const session = makeSession({
      session_id: 'sess-marker-zero',
      thinking: {
        emitted: true,
        block_count: 1,
        total_chars: text.length,
        visible_chars: 0,
        over_visible_ratio: null,
        dispatch_context: 'parent',
      },
      parent_jsonl: {
        status: 'matched',
        records: [assistantThinkingRecord(text)],
      },
    })

    const [row] = runMarkerDensity([session])

    expect(row.availability_status).toBe('exposed')
    expect(row.value.marker_self_correction_count).toBe(0)
    expect(row.value.marker_uncertainty_count).toBe(0)
    expect(row.value.marker_self_correction_density).toBe(0)
    expect(row.value.marker_uncertainty_density).toBe(0)
    expect(row.value.caveat).toBe('effort_tracking_not_quality_proxy')
    expect(row.value.dropped_markers).toEqual(['branching', 'dead_end'])
  })

  it('emits not_emitted when the session has no thinking content', () => {
    const session = makeSession({
      session_id: 'sess-marker-missing',
      thinking: {
        emitted: false,
        block_count: 0,
        total_chars: 0,
        visible_chars: 120,
        over_visible_ratio: null,
        dispatch_context: 'parent',
      },
      parent_jsonl: {
        status: 'matched',
        records: [],
      },
    })

    const [row] = runMarkerDensity([session])

    expect(row.availability_status).toBe('not_emitted')
    expect(row.value.marker_self_correction_density).toBe(0)
    expect(row.value.marker_uncertainty_density).toBe(0)
    expect(row.value.caveat).toBe('effort_tracking_not_quality_proxy')
    expect(row.value.dropped_markers).toEqual(['branching', 'dead_end'])
  })
})
