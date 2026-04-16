import { describe, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const [major, minor] = process.versions.node.split('.').map(Number)
const hasNodeSqlite = major > 22 || (major === 22 && minor >= 5)
const describeIf = hasNodeSqlite ? describe : describe.skip

const SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/codex.cjs')
const EXTRACTOR_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/codex.cjs')

const { DatabaseSync } = hasNodeSqlite ? require('node:sqlite') : { DatabaseSync: null }
const { loadCodex, REQUIRED_THREAD_FIELDS } = require(SOURCE_PATH)
const { CODEX_EXTRACTORS } = require(EXTRACTOR_PATH)

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function writeRolloutHeader(filePath, sessionId, cwd) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const lines = [
    JSON.stringify({
      timestamp: '2026-04-16T20:15:12.547Z',
      type: 'session_meta',
      payload: {
        id: sessionId,
        timestamp: '2026-04-16T20:15:10.139Z',
        cwd,
        originator: 'codex-tui',
        cli_version: '0.121.0',
        model_provider: 'openai',
        agent_nickname: 'Plato',
        agent_role: 'gsdr-executor',
        source: {
          subagent: {
            thread_spawn: {
              parent_thread_id: 'parent-thread-id',
              depth: 1,
              agent_path: null,
              agent_nickname: 'Plato',
              agent_role: 'gsdr-executor',
            },
          },
        },
        git: {
          commit_hash: 'abc123',
          branch: 'gsd/phase-57.5-measurement-architecture-retroactive-foundation',
          repository_url: 'git@github.com:loganrooks/get-shit-done-reflect.git',
        },
      },
    }),
    JSON.stringify({
      timestamp: '2026-04-16T20:15:12.551Z',
      type: 'event_msg',
      payload: { type: 'user_message', message: 'fixture' },
    }),
  ]
  await fs.writeFile(filePath, lines.join('\n'))
}

function createThreadsTable(db, options = {}) {
  const includeReasoningEffort = options.includeReasoningEffort !== false
  const columns = [
    'id TEXT PRIMARY KEY',
    'rollout_path TEXT NOT NULL',
    'created_at INTEGER NOT NULL',
    'updated_at INTEGER NOT NULL',
    "source TEXT NOT NULL DEFAULT 'cli'",
    'model_provider TEXT NOT NULL',
    'cwd TEXT NOT NULL',
    "title TEXT NOT NULL DEFAULT ''",
    'sandbox_policy TEXT NOT NULL',
    'approval_mode TEXT NOT NULL',
    'tokens_used INTEGER NOT NULL DEFAULT 0',
    'has_user_event INTEGER NOT NULL DEFAULT 0',
    'archived INTEGER NOT NULL DEFAULT 0',
    'archived_at INTEGER',
    'git_sha TEXT',
    'git_branch TEXT',
    'git_origin_url TEXT',
    "cli_version TEXT NOT NULL DEFAULT ''",
    "first_user_message TEXT NOT NULL DEFAULT ''",
    'agent_nickname TEXT',
    'agent_role TEXT',
    "memory_mode TEXT NOT NULL DEFAULT 'enabled'",
    'model TEXT',
    ...(includeReasoningEffort ? ['reasoning_effort TEXT'] : []),
    'agent_path TEXT',
    'created_at_ms INTEGER',
    'updated_at_ms INTEGER',
  ]

  db.exec(`CREATE TABLE threads (${columns.join(', ')})`)
}

async function setupCodexFixture(tmpdir, options = {}) {
  const homeDir = path.join(tmpdir, 'home')
  const codexDir = path.join(homeDir, '.codex')
  const rolloutPath = path.join(
    codexDir,
    'sessions',
    '2026',
    '04',
    '16',
    'rollout-2026-04-16T20-15-10-thread-001.jsonl'
  )
  const stateStorePath = path.join(codexDir, 'state_5.sqlite')

  await writeJson(path.join(tmpdir, '.planning', 'config.json'), {
    gsd_reflect_version: '1.19.4+dev',
    model_profile: 'quality',
  })
  await writeRolloutHeader(rolloutPath, 'thread-001', tmpdir)
  await fs.mkdir(path.dirname(stateStorePath), { recursive: true })

  const db = new DatabaseSync(stateStorePath)
  createThreadsTable(db, options)
  db.prepare(`
    INSERT INTO threads (
      id, rollout_path, created_at, updated_at, model_provider, cwd,
      sandbox_policy, approval_mode, git_sha, git_branch, git_origin_url,
      cli_version, agent_nickname, agent_role, model,
      ${options.includeReasoningEffort === false ? '' : 'reasoning_effort,'}
      agent_path, created_at_ms, updated_at_ms
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ${options.includeReasoningEffort === false ? '' : '?, '}
      ?, ?, ?
    )
  `).run(
    'thread-001',
    rolloutPath,
    1776370510,
    1776370618,
    'openai',
    tmpdir,
    JSON.stringify({ type: 'danger-full-access' }),
    'never',
    'abc123',
    'gsd/phase-57.5-measurement-architecture-retroactive-foundation',
    'git@github.com:loganrooks/get-shit-done-reflect.git',
    '0.121.0',
    'Plato',
    'gsdr-executor',
    'gpt-5.4',
    ...(options.includeReasoningEffort === false ? [] : ['xhigh']),
    null,
    1776370510139,
    1776370618000
  )
  db.close()

  return { homeDir, rolloutPath }
}

describeIf('measurement codex source and extractor', () => {
  tmpdirTest('loadCodex verifies live schema fields and rollout header provenance', async ({ tmpdir }) => {
    const { homeDir } = await setupCodexFixture(tmpdir)
    const raw = loadCodex(tmpdir, {
      homeDir,
      observedAt: '2026-04-16T21:00:00.000Z',
    })

    expect(raw.runtime).toBe('codex-cli')
    expect(raw.schema.missing_required_fields).toEqual([])
    expect(raw.schema.fields).toEqual(expect.arrayContaining(REQUIRED_THREAD_FIELDS))
    expect(raw.coverage.threads_scanned).toBe(1)
    expect(raw.coverage.project_threads).toBe(1)
    expect(raw.coverage.rollout_headers.matched).toBe(1)
    expect(raw.threads[0].session_meta.status).toBe('matched')
    expect(raw.threads[0].runtime_identity.source.subagent.thread_spawn.parent_thread_id).toBe('parent-thread-id')
    expect(raw.threads[0].sandbox_policy).toEqual({ type: 'danger-full-access' })
  })

  tmpdirTest('loadCodex rejects state-store schema drift instead of silently dropping fields', async ({ tmpdir }) => {
    const { homeDir } = await setupCodexFixture(tmpdir, { includeReasoningEffort: false })
    expect(() => loadCodex(tmpdir, { homeDir })).toThrow(/reasoning_effort/)
  })

  tmpdirTest('codex_runtime_metadata exposes runtime, sandbox, and GSD provenance explicitly', async ({ tmpdir }) => {
    const { homeDir, rolloutPath } = await setupCodexFixture(tmpdir)
    const raw = loadCodex(tmpdir, {
      homeDir,
      observedAt: '2026-04-16T21:00:00.000Z',
    })
    const rows = CODEX_EXTRACTORS.flatMap(extractor => extractor.extract({
      cwd: tmpdir,
      observed_at: '2026-04-16T21:00:00.000Z',
      codex: raw,
    }))

    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row.feature_name).toBe('codex_runtime_metadata:thread-001')
    expect(row.availability_status).toBe('exposed')
    expect(row.symmetry_marker).toBe('asymmetric_only')
    expect(row.value.model.status).toBe('exposed')
    expect(row.value.model.value).toBe('gpt-5.4')
    expect(row.value.reasoning_effort.value).toBe('xhigh')
    expect(row.value.sandbox_policy.value).toEqual({ type: 'danger-full-access' })
    expect(row.value.rollout_path.value).toBe(rolloutPath)
    expect(row.value.gsd_version.status).toBe('derived')
    expect(row.value.gsd_version.value).toBe('1.19.4+dev')
    expect(row.value.gsd_version.provenance).toMatch(/config\.json/)
    expect(row.value.profile.value).toBe('quality')
    expect(row.coverage.raw_sources).toEqual(['codex_state_store', 'codex_sessions'])
    expect(row.provenance.schema_fields).toContain('reasoning_effort')
    expect(row.notes.join(' ')).toMatch(/state_5\.sqlite/)
    expect(row.notes.join(' ')).toMatch(/session_meta/)
  })
})
