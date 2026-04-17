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

function compactBoundary(trigger = 'manual', preTokens = 1200) {
  return {
    type: 'system',
    subtype: 'compact_boundary',
    compact_metadata: { trigger, pre_tokens: preTokens },
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
    session_id: overrides.session_id || 'sess-content',
    parent_jsonl: parentJsonl,
  }
}

function runExtractor(name, sessions) {
  return getExtractor(name).extract({
    observed_at: '2026-04-17T05:30:00.000Z',
    claude: { sessions },
  })
}

describe('measurement content helpers', () => {
  it('builds a tool invocation sequence and entropy from tool_use blocks only', () => {
    const scan = sources.scanToolInvocationSequence([
      assistantRecord([
        { type: 'thinking', thinking: 'ignore me' },
        { type: 'tool_use', name: 'Bash', input: { command: 'pwd' } },
        { type: 'text', text: 'also ignore me' },
        { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/demo' } },
      ]),
      assistantRecord([
        { type: 'tool_use', name: 'Bash', input: { command: 'ls' } },
      ]),
    ])

    expect(scan.sequence).toEqual(['Bash', 'Read', 'Bash'])
    expect(scan.tool_count_per_tool).toEqual({ Bash: 2, Read: 1 })
    expect(scan.distinct_tool_count).toBe(2)
    expect(scan.tool_sequence_entropy).toBeCloseTo(0.9183, 3)
    expect(JSON.stringify(scan)).not.toContain('pwd')
    expect(JSON.stringify(scan)).not.toContain('file_path')
  })

  it('counts structural topic-shift markers from clear, compaction, and tool-category changes', () => {
    const scan = sources.scanTopicShiftMarkers([
      userRecord('<command-name>/clear</command-name>'),
      assistantRecord([{ type: 'tool_use', name: 'Bash', input: { command: 'ls' } }]),
      assistantRecord([{ type: 'tool_use', name: 'Read', input: { file_path: '/tmp/demo' } }]),
      assistantRecord([{ type: 'tool_use', name: 'Bash', input: { command: 'pwd' } }]),
      compactBoundary('manual', 900),
    ])

    expect(scan.clear_shifts).toBe(1)
    expect(scan.compaction_shifts).toBe(1)
    expect(scan.tool_category_shifts).toBe(2)
    expect(scan.topic_shift_count).toBe(4)
    expect(scan.shift_positions).toEqual([2, 3])
  })
})

describe('measurement content extractors', () => {
  it('emits tool invocation sequence rows with names only and asymmetric runtime markers', () => {
    const [row] = runExtractor('tool_invocation_sequence', [
      makeSession({
        session_id: 'sess-tools',
        parent_jsonl: {
          status: 'matched',
          records: [
            assistantRecord([
              { type: 'tool_use', name: 'Bash', input: { command: 'rm -rf /' } },
              { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/demo' } },
              { type: 'tool_use', name: 'Bash', input: { command: 'pwd' } },
            ]),
          ],
        },
      }),
    ])

    expect(row.availability_status).toBe('exposed')
    expect(row.runtime).toBe('claude-code')
    expect(row.symmetry_marker).toBe('asymmetric_only')
    expect(row.value.tool_sequence).toEqual(['Bash', 'Read', 'Bash'])
    expect(row.value.tool_count_per_tool).toEqual({ Bash: 2, Read: 1 })
    expect(row.value.distinct_tool_count).toBe(2)
    expect(row.value.tool_sequence_entropy).toBeCloseTo(0.9183, 3)
    expect(JSON.stringify(row.value)).not.toContain('rm -rf')
    expect(row.provenance.content_contract).toBe('derived_features_only')
  })

  it('marks tool invocation sequence as not_emitted or not_available when appropriate', () => {
    const [noTools] = runExtractor('tool_invocation_sequence', [
      makeSession({
        session_id: 'sess-no-tools',
        parent_jsonl: {
          status: 'matched',
          records: [assistantRecord([{ type: 'text', text: 'plain assistant text' }])],
        },
      }),
    ])
    const [missing] = runExtractor('tool_invocation_sequence', [
      makeSession({
        session_id: 'sess-missing-tools',
        parent_jsonl: {
          status: 'source_unavailable',
          records: [],
        },
      }),
    ])

    expect(noTools.availability_status).toBe('not_emitted')
    expect(noTools.value.tool_sequence).toEqual([])
    expect(missing.availability_status).toBe('not_available')
    expect(missing.value.distinct_tool_count).toBe(0)
  })

  it('emits topic shift rows with clear, compaction, and tool category counts', () => {
    const [row] = runExtractor('topic_shift_markers', [
      makeSession({
        session_id: 'sess-topic',
        parent_jsonl: {
          status: 'matched',
          records: [
            userRecord('<command-name>/clear</command-name>'),
            assistantRecord([{ type: 'tool_use', name: 'Bash', input: { command: 'ls' } }]),
            assistantRecord([{ type: 'tool_use', name: 'Read', input: { file_path: '/tmp/demo' } }]),
            assistantRecord([{ type: 'tool_use', name: 'Bash', input: { command: 'pwd' } }]),
            compactBoundary('auto', 1500),
          ],
        },
      }),
    ])

    expect(row.availability_status).toBe('exposed')
    expect(row.runtime).toBe('claude-code')
    expect(row.symmetry_marker).toBe('asymmetric_only')
    expect(row.value.clear_shifts).toBe(1)
    expect(row.value.compaction_shifts).toBe(1)
    expect(row.value.tool_category_shifts).toBe(2)
    expect(row.value.topic_shift_count).toBe(4)
    expect(row.value.shift_positions).toEqual([2, 3])
  })

  it('marks topic shift extractor as not_available when parent_jsonl is missing', () => {
    const [row] = runExtractor('topic_shift_markers', [
      makeSession({
        session_id: 'sess-topic-missing',
        parent_jsonl: {
          status: 'session_dir_only',
          records: [],
        },
      }),
    ])

    expect(row.availability_status).toBe('not_available')
    expect(row.value.topic_shift_count).toBe(0)
  })

  it('preserves content_contract on built registry entries and exposes the new extractor names', () => {
    const built = registry.buildRegistry()
    const toolSequence = built.extractors.find((entry) => entry.name === 'tool_invocation_sequence')
    const topicShift = built.extractors.find((entry) => entry.name === 'topic_shift_markers')

    expect(toolSequence).toBeTruthy()
    expect(topicShift).toBeTruthy()
    expect(toolSequence.content_contract).toBe('derived_features_only')
    expect(topicShift.content_contract).toBe('derived_features_only')
  })

  it('rejects invalid content_contract values and preserves null when absent', () => {
    expect(() => registry.defineExtractor({
      name: 'invalid_content_contract_fixture',
      source_family: 'RUNTIME',
      raw_sources: ['claude_jsonl_projects'],
      runtimes: ['claude-code'],
      reliability_tier: 'direct_observation',
      features_produced: ['fixture'],
      serves_loop: ['pipeline_integrity'],
      distinguishes: ['fixture'],
      content_contract: 'bad-value',
      extract: () => [],
    })).toThrow(/content_contract/)

    const entry = registry.defineExtractor({
      name: 'null_content_contract_fixture',
      source_family: 'RUNTIME',
      raw_sources: ['claude_jsonl_projects'],
      runtimes: ['claude-code'],
      reliability_tier: 'direct_observation',
      features_produced: ['fixture'],
      serves_loop: ['pipeline_integrity'],
      distinguishes: ['fixture'],
      extract: () => [],
    })

    expect(entry.content_contract).toBeNull()
  })

  it('keeps the runtime extractor list loaded with the two new entries', () => {
    const names = runtime.RUNTIME_EXTRACTORS.map((entry) => entry.name)

    expect(names).toContain('tool_invocation_sequence')
    expect(names).toContain('topic_shift_markers')
    expect(runtime.RUNTIME_EXTRACTORS.length).toBeGreaterThanOrEqual(12)
  })
})
