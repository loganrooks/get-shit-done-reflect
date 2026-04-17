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
    session_id: overrides.session_id || 'sess-clear',
    parent_jsonl: parentJsonl,
  }
}

function runClearInvocation(sessions) {
  const extractor = getExtractor('clear_invocation')
  return extractor.extract({
    observed_at: '2026-04-16T20:00:00.000Z',
    claude: { sessions },
  })
}

describe('measurement clear_invocation extractor', () => {
  it('counts repeated /clear invocations and exposes the operator habit', () => {
    const session = makeSession({
      session_id: 'sess-clear-3',
      parent_jsonl: {
        status: 'matched',
        records: [
          userRecord('<command-name>/clear</command-name>'),
          userRecord('<command-name>/clear</command-name>\n<command-message>again</command-message>'),
          userRecord('plain text'),
          userRecord('<command-name>/clear</command-name>'),
        ],
      },
    })

    const [row] = runClearInvocation([session])

    expect(row.availability_status).toBe('exposed')
    expect(row.value.clear_invocation_count).toBe(3)
    expect(row.value.operator_habit).toBe('preemptive_reset')
    expect(row.value.caveat).toBe('operator_habit_not_reasoning_quality')
    expect(row.runtime).toBe('claude-code')
    expect(row.symmetry_marker).toBe('asymmetric_only')
  })

  it('emits not_emitted when a matched parent JSONL contains no /clear commands', () => {
    const session = makeSession({
      session_id: 'sess-clear-none',
      parent_jsonl: {
        status: 'matched',
        records: [
          userRecord('plain text only'),
        ],
      },
    })

    const [row] = runClearInvocation([session])

    expect(row.availability_status).toBe('not_emitted')
    expect(row.value.clear_invocation_count).toBe(0)
    expect(row.value.operator_habit).toBe('no_reset_observed')
    expect(row.runtime).toBe('claude-code')
    expect(row.symmetry_marker).toBe('asymmetric_only')
  })

  it('emits not_available when no parent JSONL is linked', () => {
    const session = makeSession({
      session_id: 'sess-clear-missing',
      parent_jsonl: {
        status: 'source_unavailable',
        records: [],
      },
    })

    const [row] = runClearInvocation([session])

    expect(row.availability_status).toBe('not_available')
    expect(row.value.clear_invocation_count).toBe(0)
    expect(row.runtime).toBe('claude-code')
    expect(row.symmetry_marker).toBe('asymmetric_only')
  })
})
