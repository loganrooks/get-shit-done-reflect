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
    session_id: overrides.session_id || 'sess-1',
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

function runThinkingComposite(sessions) {
  const extractor = getExtractor('thinking_composite')
  return extractor.extract({
    observed_at: '2026-04-16T20:00:00.000Z',
    claude: { sessions },
  })
}

describe('measurement thinking_composite extractor', () => {
  it('emits exposed for parent Claude sessions with visible thinking blocks', () => {
    const session = makeSession({
      session_id: 'sess-exposed',
      effort_override: { value: 'high' },
      thinking: {
        emitted: true,
        block_count: 3,
        total_chars: 500,
        visible_chars: 100,
        over_visible_ratio: 5,
        dispatch_context: 'parent',
      },
    })

    const [row] = runThinkingComposite([session])

    expect(row.availability_status).toBe('exposed')
    expect(row.value.thinking_emitted).toBe(true)
    expect(row.value.thinking_block_count).toBe(3)
    expect(row.value.thinking_total_chars).toBe(500)
    expect(row.value.thinking_over_visible_ratio).toBe(5)
    expect(row.value.effective_effort_level).toBe('high')
    expect(row.value.gate_applied).toBeNull()
    expect(row.value.dispatch_context).toBe('parent')
    expect(row.runtime).toBe('claude-code')
  })

  it('emits not_emitted for capable parent sessions with zero thinking blocks', () => {
    const session = makeSession({
      session_id: 'sess-no-thinking',
      thinking: {
        emitted: false,
        block_count: 0,
        total_chars: 0,
        visible_chars: 120,
        over_visible_ratio: null,
        dispatch_context: 'parent',
      },
    })

    const [row] = runThinkingComposite([session])

    expect(row.availability_status).toBe('not_emitted')
    expect(row.value.thinking_block_count).toBe(0)
    expect(row.value.gate_applied).toBe('emission_threshold')
  })

  it('emits not_available for subagent dispatch sessions', () => {
    const session = makeSession({
      session_id: 'sess-subagent',
      thinking: {
        emitted: false,
        block_count: 0,
        total_chars: 0,
        visible_chars: 0,
        over_visible_ratio: null,
        dispatch_context: 'subagent',
      },
    })

    const [row] = runThinkingComposite([session])

    expect(row.availability_status).toBe('not_available')
    expect(row.value.gate_applied).toBe('dispatch_context')
    expect(row.value.dispatch_context).toBe('subagent')
  })

  it('emits not_applicable for Haiku sessions even when a parent JSONL is present', () => {
    const session = makeSession({
      session_id: 'sess-haiku',
      runtime_identity: { model: 'claude-haiku-3-5' },
      thinking: {
        emitted: false,
        block_count: 0,
        total_chars: 0,
        visible_chars: 0,
        over_visible_ratio: null,
        dispatch_context: 'parent',
      },
    })

    const [row] = runThinkingComposite([session])

    expect(row.availability_status).toBe('not_applicable')
    expect(row.value.model).toBe('claude-haiku-3-5')
    expect(row.value.gate_applied).toBe('model_family')
  })

  it('emits not_available when the parent JSONL is missing', () => {
    const session = makeSession({
      session_id: 'sess-missing-parent',
      parent_jsonl: {
        status: 'source_unavailable',
        records: [],
      },
      thinking: {
        emitted: false,
        block_count: 0,
        total_chars: 0,
        visible_chars: 0,
        over_visible_ratio: null,
        dispatch_context: 'unavailable',
      },
    })

    const [row] = runThinkingComposite([session])

    expect(row.availability_status).toBe('not_available')
    expect(row.value.gate_applied).toBeNull()
    expect(row.value.dispatch_context).toBe('unavailable')
  })
})
