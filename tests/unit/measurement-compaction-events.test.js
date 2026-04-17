import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const RUNTIME_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/runtime.cjs')
const CODEX_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/codex.cjs')

const { RUNTIME_EXTRACTORS } = require(RUNTIME_PATH)
const { CODEX_EXTRACTORS } = require(CODEX_PATH)

function getRuntimeExtractor(name) {
  const extractor = RUNTIME_EXTRACTORS.find(entry => entry.name === name)
  if (!extractor) {
    throw new Error(`Missing runtime extractor: ${name}`)
  }
  return extractor
}

function getCodexExtractor(name) {
  const extractor = CODEX_EXTRACTORS.find(entry => entry.name === name)
  if (!extractor) {
    throw new Error(`Missing codex extractor: ${name}`)
  }
  return extractor
}

function makeClaudeSession(overrides = {}) {
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
    session_id: overrides.session_id || 'sess-compaction',
    parent_jsonl: parentJsonl,
  }
}

function makeCodexThread(overrides = {}) {
  return {
    thread_id: overrides.thread_id || 'thread-001',
    rollout_path: overrides.rollout_path === undefined ? null : overrides.rollout_path,
    freshness: overrides.freshness || {
      status: 'fresh',
      observed_at: '2026-04-16T20:00:00.000Z',
      modified_at: null,
      reasons: [],
      stale_after_hours: 24,
      age_hours: 0,
    },
    session_meta: overrides.session_meta || { status: 'matched' },
    runtime_identity: overrides.runtime_identity || {},
    sandbox_policy: overrides.sandbox_policy || { type: 'workspace-write' },
    sandbox_policy_text: overrides.sandbox_policy_text || '{"type":"workspace-write"}',
    approval_mode: overrides.approval_mode || 'never',
    cwd: overrides.cwd || '/fixture/project',
    model: overrides.model || 'gpt-5',
    reasoning_effort: overrides.reasoning_effort === undefined ? 'high' : overrides.reasoning_effort,
    cli_version: overrides.cli_version || '0.121.0',
    git_branch: overrides.git_branch || 'main',
    git_sha: overrides.git_sha || 'abc123',
    git_origin_url: overrides.git_origin_url || 'git@example.com:repo.git',
    created_at: overrides.created_at || '2026-04-16T20:00:00.000Z',
    updated_at: overrides.updated_at || '2026-04-16T20:05:00.000Z',
    ...overrides,
  }
}

function runClaudeCompaction(sessions) {
  const extractor = getRuntimeExtractor('claude_compaction_events')
  return extractor.extract({
    observed_at: '2026-04-16T20:00:00.000Z',
    claude: { sessions },
  })
}

function runCodexCompaction(threads) {
  const extractor = getCodexExtractor('codex_compaction_events')
  return extractor.extract({
    observed_at: '2026-04-16T20:00:00.000Z',
    codex: { threads },
  })
}

async function writeRollout(filePath, entries) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, entries.map(entry => JSON.stringify(entry)).join('\n'))
}

describe('measurement compaction event extractors', () => {
  it('counts Claude compact boundaries and compact summaries', () => {
    const session = makeClaudeSession({
      session_id: 'sess-claude-compact',
      parent_jsonl: {
        status: 'matched',
        records: [
          {
            type: 'system',
            subtype: 'compact_boundary',
            compact_metadata: { trigger: 'manual', pre_tokens: 1200 },
          },
          {
            type: 'system',
            subtype: 'compact_boundary',
            compact_metadata: { trigger: 'auto', pre_tokens: 2400 },
          },
          {
            type: 'assistant',
            isCompactSummary: true,
            message: { content: [{ type: 'text', text: 'summary' }] },
          },
        ],
      },
    })

    const [row] = runClaudeCompaction([session])

    expect(row.availability_status).toBe('exposed')
    expect(row.value.compaction_count).toBe(2)
    expect(row.value.has_compaction).toBe(true)
    expect(row.value.compaction_trigger_mix).toEqual({ manual: 1, auto: 1 })
    expect(row.value.pre_compact_token_counts).toEqual([1200, 2400])
    expect(row.value.summary_messages_found).toBe(1)
  })

  it('marks Claude sessions without compaction as not_emitted and missing JSONL as not_available', () => {
    const [noCompaction] = runClaudeCompaction([
      makeClaudeSession({
        session_id: 'sess-claude-none',
        parent_jsonl: {
          status: 'matched',
          records: [{ type: 'assistant', message: { content: [{ type: 'text', text: 'no compact markers' }] } }],
        },
      }),
    ])
    const [missing] = runClaudeCompaction([
      makeClaudeSession({
        session_id: 'sess-claude-missing',
        parent_jsonl: {
          status: 'source_unavailable',
          records: [],
        },
      }),
    ])

    expect(noCompaction.availability_status).toBe('not_emitted')
    expect(noCompaction.value.compaction_count).toBe(0)
    expect(missing.availability_status).toBe('not_available')
  })

  tmpdirTest('counts Codex context_compacted events from rollout JSONL', async ({ tmpdir }) => {
    const rolloutPath = path.join(tmpdir, 'rollouts', 'thread-001.jsonl')
    await writeRollout(rolloutPath, [
      { type: 'event_msg', payload: { type: 'context_compacted', replacement_history: [1, 2, 3, 4, 5] } },
      { type: 'event_msg', payload: { type: 'context_compacted', replacement_history: [1, 2, 3, 4, 5, 6, 7, 8] } },
      { type: 'event_msg', payload: { type: 'context_compacted', replacement_history: [1, 2] } },
    ])

    const [row] = runCodexCompaction([
      makeCodexThread({
        thread_id: 'thread-001',
        rollout_path: rolloutPath,
      }),
    ])

    expect(row.availability_status).toBe('exposed')
    expect(row.value.compaction_count).toBe(3)
    expect(row.value.has_compaction).toBe(true)
    expect(row.value.context_compacted_events).toBe(3)
    expect(row.value.replacement_history_lengths).toEqual([5, 8, 2])
  })

  tmpdirTest('distinguishes missing rollout from present-but-zero Codex rollout events', async ({ tmpdir }) => {
    const noEventsPath = path.join(tmpdir, 'rollouts', 'thread-no-events.jsonl')
    await writeRollout(noEventsPath, [
      { type: 'event_msg', payload: { type: 'user_message', text: 'hello' } },
    ])

    const [noEvents] = runCodexCompaction([
      makeCodexThread({
        thread_id: 'thread-no-events',
        rollout_path: noEventsPath,
      }),
    ])
    const [missing] = runCodexCompaction([
      makeCodexThread({
        thread_id: 'thread-missing',
        rollout_path: null,
      }),
    ])

    expect(noEvents.availability_status).toBe('not_emitted')
    expect(noEvents.value.compaction_count).toBe(0)
    expect(missing.availability_status).toBe('not_available')
    expect(missing.provenance.scan_error).toBe('no_path')
  })

  tmpdirTest('keeps Claude and Codex compaction rows asymmetric at the extractor layer', async ({ tmpdir }) => {
    const rolloutPath = path.join(tmpdir, 'rollouts', 'thread-symmetry.jsonl')
    await writeRollout(rolloutPath, [
      { type: 'event_msg', payload: { type: 'context_compacted', replacement_history: [1, 2, 3] } },
    ])

    const [claudeRow] = runClaudeCompaction([
      makeClaudeSession({
        session_id: 'sess-symmetry',
        parent_jsonl: {
          status: 'matched',
          records: [
            {
              type: 'system',
              subtype: 'compact_boundary',
              compact_metadata: { trigger: 'manual', pre_tokens: 900 },
            },
          ],
        },
      }),
    ])
    const [codexRow] = runCodexCompaction([
      makeCodexThread({
        thread_id: 'thread-symmetry',
        rollout_path: rolloutPath,
      }),
    ])

    expect(claudeRow.runtime).toBe('claude-code')
    expect(codexRow.runtime).toBe('codex-cli')
    expect(claudeRow.symmetry_marker).toBe('asymmetric_only')
    expect(codexRow.symmetry_marker).toBe('asymmetric_only')
  })

  it('extends codex_runtime_metadata with effort and sandbox breadth fields', () => {
    const extractor = getCodexExtractor('codex_runtime_metadata')
    const raw = {
      observed_at: '2026-04-16T20:00:00.000Z',
      state_store: { exists: true },
      gsd_context: {
        gsd_version: '1.19.4+dev',
        profile: 'quality',
        provenance_notes: ['fixture config context'],
      },
      paths: {
        state_store_path: '/tmp/state_5.sqlite',
      },
      schema: {
        fields: ['reasoning_effort', 'sandbox_policy'],
      },
      threads: [
        makeCodexThread({
          thread_id: 'thread-metadata',
          rollout_path: '/tmp/thread-metadata.jsonl',
          reasoning_effort: 'xhigh',
          sandbox_policy: { type: 'danger-full-access' },
          sandbox_policy_text: '{"type":"danger-full-access"}',
          session_meta: {
            status: 'matched',
            payload: {
              timestamp: '2026-04-16T20:00:00.000Z',
            },
          },
          runtime_identity: {
            originator: 'codex-tui',
            cli_version: '0.121.0',
            model_provider: 'openai',
            agent_nickname: 'Plato',
            agent_role: 'gsdr-executor',
            agent_path: null,
            source: { subagent: { thread_spawn: { parent_thread_id: 'parent-1' } } },
            git: {
              branch: 'main',
              commit_hash: 'abc123',
              repository_url: 'git@example.com:repo.git',
            },
          },
        }),
      ],
    }

    const [row] = extractor.extract({
      observed_at: '2026-04-16T20:00:00.000Z',
      codex: raw,
    })

    expect(extractor.distinguishes).toContain('codex_effort_stratification')
    expect(row.value.effort_level_breakdown).toEqual({
      reasoning_effort: 'xhigh',
      effort_count_this_thread: 1,
    })
    expect(row.value.sandbox_mode_distribution).toEqual({
      mode: 'danger-full-access',
      raw: '{"type":"danger-full-access"}',
    })
  })
})
