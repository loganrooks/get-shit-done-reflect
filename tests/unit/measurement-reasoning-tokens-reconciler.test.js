import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const RUNTIME_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/runtime.cjs')
const CODEX_SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/codex.cjs')
const REGISTRY_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/registry.cjs')
const MANIFEST_PATH = path.resolve(process.cwd(), 'get-shit-done/feature-manifest.json')

const runtime = require(RUNTIME_PATH)
const codexSource = require(CODEX_SOURCE_PATH)
const registry = require(REGISTRY_PATH)
const manifest = require(MANIFEST_PATH)

function getExtractor() {
  const extractor = runtime.RUNTIME_EXTRACTORS.find((entry) => entry.name === 'reasoning_tokens_reconciler')
  if (!extractor) {
    throw new Error('Missing reasoning_tokens_reconciler extractor')
  }
  return extractor
}

function assistantRecord(sessionId, outputTokens, content) {
  return {
    type: 'assistant',
    sessionId,
    message: {
      role: 'assistant',
      usage: {
        output_tokens: outputTokens,
      },
      content,
    },
  }
}

function claudeSession(sessionId, records, parentStatus = 'matched') {
  return {
    session_id: sessionId,
    session_meta: {
      path: `/tmp/${sessionId}.json`,
      record: {},
    },
    parent_jsonl: {
      status: parentStatus,
      path: parentStatus === 'matched' ? `/tmp/${sessionId}.jsonl` : null,
      records: parentStatus === 'matched' ? records : [],
    },
  }
}

function codexThread(threadId, rolloutPath) {
  return {
    thread_id: threadId,
    rollout_path: rolloutPath,
    session_meta: {
      status: 'matched',
    },
    freshness: {
      status: 'fresh',
      observed_at: '2026-04-17T00:00:00.000Z',
      modified_at: '2026-04-17T00:00:00.000Z',
      reasons: [],
      stale_after_hours: 24,
      age_hours: 0,
    },
  }
}

describe('measurement reasoning-tokens reconciler', () => {
  const extractor = getExtractor()

  describe('codex helpers', () => {
    tmpdirTest('reads direct reasoning token counts from rollout records', async ({ tmpdir }) => {
      const rolloutPath = path.join(tmpdir, 'thread.jsonl')
      await fs.writeFile(
        rolloutPath,
        [
          JSON.stringify({ type: 'session_meta', payload: { id: 'thread-1' } }),
          JSON.stringify({ type: 'event_msg', token_count: { reasoning_output_tokens: 200 } }),
          JSON.stringify({ type: 'event_msg', token_count: { reasoning_output_tokens: 300 } }),
        ].join('\n')
      )

      expect(codexSource.readReasoningOutputTokens({ token_count: { reasoning_output_tokens: 123 } })).toBe(123)
      expect(codexSource.readReasoningOutputTokens({ token_count: { reasoning_output_tokens: -1 } })).toBeNull()
      expect(codexSource.summarizeCodexReasoningTokens({ rollout_path: rolloutPath })).toEqual({
        reasoning_tokens: 500,
        field_present: true,
        records_scanned: 3,
      })
    })

    tmpdirTest('treats absent Codex reasoning token fields as unavailable', async ({ tmpdir }) => {
      const rolloutPath = path.join(tmpdir, 'thread-missing.jsonl')
      await fs.writeFile(
        rolloutPath,
        [
          JSON.stringify({ type: 'session_meta', payload: { id: 'thread-2' } }),
          JSON.stringify({ type: 'event_msg', payload: { type: 'token_count' } }),
        ].join('\n')
      )

      expect(codexSource.summarizeCodexReasoningTokens({ rollout_path: rolloutPath })).toEqual({
        reasoning_tokens: null,
        field_present: false,
        records_scanned: 2,
      })
    })
  })

  describe('claude branch', () => {
    it('computes a derived delta only when the tokenizer verdict and dependency decision both allow it', () => {
      const rows = extractor.extract({
        cwd: process.cwd(),
        observed_at: '2026-04-17T00:00:00.000Z',
        reasoningTokenizerDecision: {
          verdict: 'PASS',
          production_dependency_decision: 'approve_top_level_dependency',
          tokenizer_id: 'fixture-tokenizer',
          decision_path: '.planning/spikes/011-C3-tokenizer-availability/DECISION.md',
        },
        reasoningTokenCounter: (text) => text.length,
        claude: {
          sessions: [
            claudeSession('sess-live', [
              assistantRecord('sess-live', 12, [
                { type: 'text', text: 'abc' },
                { type: 'thinking', thinking: 'de' },
                { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/demo' } },
              ]),
            ]),
          ],
        },
        codex: { threads: [] },
      })

      expect(rows).toHaveLength(1)
      expect(rows[0].availability_status).toBe('exposed')
      expect(rows[0].value.reasoning_tokens_source).toBe('derived_delta')
      expect(rows[0].value.reasoning_tokens).toBe(3)
      expect(rows[0].value.negative_delta_flag).toBe(false)
      expect(rows[0].value.tokenizer_id).toBe('fixture-tokenizer')
    })

    it('flags negative deltas on the Claude derived branch instead of throwing', () => {
      const rows = extractor.extract({
        cwd: process.cwd(),
        observed_at: '2026-04-17T00:00:00.000Z',
        reasoningTokenizerDecision: {
          verdict: 'PASS',
          production_dependency_decision: 'approve_top_level_dependency',
          tokenizer_id: 'fixture-tokenizer',
        },
        reasoningTokenCounter: (text) => text.length,
        claude: {
          sessions: [
            claudeSession('sess-negative', [
              assistantRecord('sess-negative', 4, [
                { type: 'text', text: 'visible-output' },
                { type: 'thinking', thinking: 'thinking' },
              ]),
            ]),
          ],
        },
        codex: { threads: [] },
      })

      expect(rows[0].availability_status).toBe('exposed')
      expect(rows[0].value.negative_delta_flag).toBe(true)
      expect(rows[0].notes.join(' ')).toMatch(/Negative delta detected/)
    })

    it('ships schema-only for non-live Claude decision combinations', () => {
      const scenarios = [
        {
          verdict: 'PASS',
          production_dependency_decision: 'reject_top_level_dependency_schema_only',
          label: 'pass-but-rejected',
        },
        {
          verdict: 'PASS',
          production_dependency_decision: 'defer',
          label: 'pass-but-deferred',
        },
        {
          verdict: 'MARGINAL',
          production_dependency_decision: 'approve_top_level_dependency',
          label: 'marginal',
        },
        {
          verdict: 'FAIL: schema-only',
          production_dependency_decision: 'reject_top_level_dependency_schema_only',
          label: 'fail',
        },
      ]

      for (const scenario of scenarios) {
        const [row] = extractor.extract({
          cwd: process.cwd(),
          observed_at: '2026-04-17T00:00:00.000Z',
          reasoningTokenizerDecision: scenario,
          claude: {
            sessions: [claudeSession(`sess-${scenario.label}`, [assistantRecord(`sess-${scenario.label}`, 10, [{ type: 'text', text: 'abc' }])])],
          },
          codex: { threads: [] },
        })

        expect(row.availability_status).toBe('not_available')
        expect(row.value.skip_reason).toBe('tokenizer_unavailable')
        expect(row.value.reasoning_tokens).toBeNull()
        expect(row.provenance.schema_only_reason).toMatch(/verdict=|production_dependency_decision=/)
      }
    })

    it('surfaces source unavailability distinctly when the Claude parent JSONL is not matched', () => {
      const [row] = extractor.extract({
        cwd: process.cwd(),
        observed_at: '2026-04-17T00:00:00.000Z',
        reasoningTokenizerDecision: {
          verdict: 'FAIL: schema-only',
          production_dependency_decision: 'reject_top_level_dependency_schema_only',
        },
        claude: {
          sessions: [claudeSession('sess-missing', [], 'session_dir_only')],
        },
        codex: { threads: [] },
      })

      expect(row.availability_status).toBe('not_available')
      expect(row.value.skip_reason).toBe('parent_jsonl_not_matched')
      expect(row.notes.join(' ')).toMatch(/Parent JSONL was not matched/)
    })
  })

  describe('codex branch', () => {
    tmpdirTest('emits direct counts when Codex rollout records expose reasoning_output_tokens', async ({ tmpdir }) => {
      const rolloutPath = path.join(tmpdir, 'thread-direct.jsonl')
      await fs.writeFile(
        rolloutPath,
        [
          JSON.stringify({ type: 'session_meta', payload: { id: 'thread-direct' } }),
          JSON.stringify({ type: 'event_msg', token_count: { reasoning_output_tokens: 200 } }),
          JSON.stringify({ type: 'event_msg', token_count: { reasoning_output_tokens: 300 } }),
        ].join('\n')
      )

      const [row] = extractor.extract({
        cwd: process.cwd(),
        observed_at: '2026-04-17T00:00:00.000Z',
        claude: { sessions: [] },
        codex: {
          state_store: { exists: true },
          threads: [codexThread('thread-direct', rolloutPath)],
        },
      })

      expect(row.availability_status).toBe('exposed')
      expect(row.value.reasoning_tokens).toBe(500)
      expect(row.value.reasoning_tokens_source).toBe('direct_count')
      expect(row.value.negative_delta_flag).toBe(false)
      expect(row.value.tokenizer_id).toBeNull()
    })

    tmpdirTest('returns not_available when the Codex direct-count field is absent', async ({ tmpdir }) => {
      const rolloutPath = path.join(tmpdir, 'thread-absent.jsonl')
      await fs.writeFile(
        rolloutPath,
        [
          JSON.stringify({ type: 'session_meta', payload: { id: 'thread-absent' } }),
          JSON.stringify({ type: 'event_msg', payload: { type: 'token_count' } }),
        ].join('\n')
      )

      const [row] = extractor.extract({
        cwd: process.cwd(),
        observed_at: '2026-04-17T00:00:00.000Z',
        claude: { sessions: [] },
        codex: {
          state_store: { exists: true },
          threads: [codexThread('thread-absent', rolloutPath)],
        },
      })

      expect(row.availability_status).toBe('not_available')
      expect(row.value.skip_reason).toBe('codex_reasoning_tokens_field_absent')
      expect(row.value.negative_delta_flag).toBeNull()
      expect(row.notes.join(' ')).toMatch(/Pitfall 4 guard/)
    })
  })

  it('preserves a single reasoning_tokens axis and registers the extractor in both runtime lists and the manifest', () => {
    expect(getExtractor().features_produced).toEqual(['reasoning_tokens'])
    expect(runtime.RUNTIME_EXTRACTORS.some((entry) => entry.name === 'reasoning_tokens_reconciler')).toBe(true)

    const built = registry.buildRegistry().extractors.find((entry) => entry.name === 'reasoning_tokens_reconciler')
    expect(built).toBeTruthy()
    expect(built.runtimes).toEqual(['claude-code', 'codex-cli'])
    expect(manifest.measurement_skip_reasons).toEqual(
      expect.arrayContaining(['tokenizer_unavailable', 'codex_reasoning_tokens_field_absent'])
    )
  })
})
