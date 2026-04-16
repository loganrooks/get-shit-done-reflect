import { describe, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const [major, minor] = process.versions.node.split('.').map(Number)
const hasNodeSqlite = major > 22 || (major === 22 && minor >= 5)
const describeIf = hasNodeSqlite ? describe : describe.skip

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')
const { DatabaseSync } = hasNodeSqlite ? require('node:sqlite') : { DatabaseSync: null }

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function writeText(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content)
}

async function setupPlanningArtifacts(tmpdir) {
  await writeJson(path.join(tmpdir, '.planning', 'config.json'), {
    gsd_reflect_version: '1.19.4+dev',
    model_profile: 'quality',
    automation: {
      stats: {
        sensor_artifact: {
          fires: 2,
          skips: 0,
          last_triggered: '2026-04-16T10:00:00Z',
          last_signal_count: 3,
        },
      },
    },
  })
  await writeText(path.join(tmpdir, '.planning', 'STATE.md'), '# State\n\nRetroactive integration fixture.\n')
  await writeText(
    path.join(tmpdir, '.planning', 'phases', '57-retroactive', '57-01-SUMMARY.md'),
    '# Phase 57 Summary\n\nRetroactive summary fixture.\n'
  )
  await writeText(
    path.join(tmpdir, '.planning', 'phases', '57-retroactive', '57-VERIFICATION.md'),
    '# Phase 57 Verification\n\nRetroactive verification fixture.\n'
  )
  await writeText(
    path.join(tmpdir, '.planning', 'knowledge', 'signals', 'demo', 'sig-retro.md'),
    `---
id: sig-retro
type: signal
project: retro-demo
created: 2026-04-16T10:00:00Z
updated: 2026-04-16T10:00:00Z
status: active
severity: notable
signal_type: deviation
---

Retroactive signal fixture.
`
  )
}

async function setupClaudeArtifacts(tmpdir) {
  const homeDir = path.join(tmpdir, 'home')
  const projectDirName = path.resolve(tmpdir).replace(/[\\/]/g, '-')

  await writeJson(path.join(homeDir, '.claude', 'settings.json'), {
    showThinkingSummaries: true,
    effortLevel: 'xhigh',
    skipDangerousModePermissionPrompt: true,
  })
  await writeJson(path.join(homeDir, '.claude', 'usage-data', 'session-meta', 'claude-session.json'), {
    session_id: 'claude-session',
    project_path: tmpdir,
    start_time: '2026-04-16T10:00:00Z',
    duration_minutes: 20,
    user_message_count: 99,
    assistant_message_count: 4,
    input_tokens: 5,
    output_tokens: 7,
    first_prompt: '/gsd:execute-phase 57.5',
    message_hours: [10, 10, 11],
  })
  await writeJson(path.join(homeDir, '.claude', 'usage-data', 'facets', 'claude-session.json'), {
    session_id: 'claude-session',
    outcome: 'fully_achieved',
    session_type: 'development',
    claude_helpfulness: 'very_helpful',
    friction_counts: { tool_failure: 1 },
  })
  await writeText(
    path.join(homeDir, '.claude', 'projects', projectDirName, 'claude-session.jsonl'),
    [
      JSON.stringify({
        type: 'user',
        sessionId: 'claude-session',
        timestamp: '2026-04-16T10:00:00.000Z',
        cwd: tmpdir,
        version: '2.1.110',
        message: {
          role: 'user',
          content: 'Please run the retroactive measurement query.',
        },
      }),
      JSON.stringify({
        type: 'assistant',
        sessionId: 'claude-session',
        timestamp: '2026-04-16T10:00:01.000Z',
        version: '2.1.110',
        message: {
          id: 'claude-msg-1',
          role: 'assistant',
          model: 'claude-opus-4-6',
          content: [{ type: 'text', text: 'Running query.' }],
          usage: {
            input_tokens: 10,
            output_tokens: 20,
            cache_creation_input_tokens: 30,
            cache_read_input_tokens: 40,
          },
        },
      }),
    ].join('\n')
  )
}

function createThreadsTable(db) {
  db.exec(`
    CREATE TABLE threads (
      id TEXT PRIMARY KEY,
      rollout_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'cli',
      model_provider TEXT NOT NULL,
      cwd TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      sandbox_policy TEXT NOT NULL,
      approval_mode TEXT NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      has_user_event INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      archived_at INTEGER,
      git_sha TEXT,
      git_branch TEXT,
      git_origin_url TEXT,
      cli_version TEXT NOT NULL DEFAULT '',
      first_user_message TEXT NOT NULL DEFAULT '',
      agent_nickname TEXT,
      agent_role TEXT,
      memory_mode TEXT NOT NULL DEFAULT 'enabled',
      model TEXT,
      reasoning_effort TEXT,
      agent_path TEXT,
      created_at_ms INTEGER,
      updated_at_ms INTEGER
    )
  `)
}

async function setupCodexArtifacts(tmpdir) {
  const homeDir = path.join(tmpdir, 'home')
  const codexDir = path.join(homeDir, '.codex')
  const rolloutPath = path.join(
    codexDir,
    'sessions',
    '2026',
    '04',
    '16',
    'rollout-2026-04-16T20-15-10-codex-thread.jsonl'
  )
  const stateStorePath = path.join(codexDir, 'state_5.sqlite')

  await writeText(
    rolloutPath,
    [
      JSON.stringify({
        timestamp: '2026-04-16T20:15:12.547Z',
        type: 'session_meta',
        payload: {
          id: 'codex-thread',
          timestamp: '2026-04-16T20:15:10.139Z',
          cwd: tmpdir,
          originator: 'codex-tui',
          cli_version: '0.121.0',
          model_provider: 'openai',
          source: 'cli',
          git: {
            commit_hash: 'abc123',
            branch: 'main',
            repository_url: 'git@github.com:loganrooks/get-shit-done-reflect.git',
          },
        },
      }),
      JSON.stringify({
        timestamp: '2026-04-16T20:15:12.551Z',
        type: 'event_msg',
        payload: { type: 'user_message', message: 'retroactive codex fixture' },
      }),
    ].join('\n')
  )
  await fs.mkdir(path.dirname(stateStorePath), { recursive: true })
  const db = new DatabaseSync(stateStorePath)
  createThreadsTable(db)
  db.prepare(`
    INSERT INTO threads (
      id, rollout_path, created_at, updated_at, model_provider, cwd,
      sandbox_policy, approval_mode, git_sha, git_branch, git_origin_url,
      cli_version, model, reasoning_effort, created_at_ms, updated_at_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'codex-thread',
    rolloutPath,
    1776370510,
    1776370618,
    'openai',
    tmpdir,
    JSON.stringify({ type: 'danger-full-access' }),
    'never',
    'abc123',
    'main',
    'git@github.com:loganrooks/get-shit-done-reflect.git',
    '0.121.0',
    'gpt-5.4',
    'xhigh',
    1776370510139,
    1776370618000
  )
  db.close()
}

function gitInit(tmpdir) {
  execSync('git init', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git config user.email "tests@example.com"', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git config user.name "Tests"', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git add .planning', { cwd: tmpdir, stdio: 'ignore' })
  execSync('git commit -m "seed retroactive measurement fixture"', { cwd: tmpdir, stdio: 'ignore' })
}

function runMeasurement(tmpdir, args = []) {
  const command = ['measurement', ...args, '--raw'].join(' ')
  let result = execSync(`node --no-warnings "${GSD_TOOLS}" ${command}`, {
    cwd: tmpdir,
    env: { ...process.env, HOME: path.join(tmpdir, 'home') },
    encoding: 'utf-8',
    timeout: 20000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  result = result.trim()
  if (result.startsWith('@file:')) {
    result = require('node:fs').readFileSync(result.slice('@file:'.length), 'utf-8')
  }
  return JSON.parse(result)
}

function runKbRebuild(tmpdir) {
  execSync(`node --no-warnings "${GSD_TOOLS}" kb rebuild --cwd "${tmpdir}" --raw`, {
    cwd: tmpdir,
    env: { ...process.env, HOME: path.join(tmpdir, 'home') },
    encoding: 'utf-8',
    timeout: 20000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

async function setupRetroactiveProject(tmpdir) {
  await setupPlanningArtifacts(tmpdir)
  await setupClaudeArtifacts(tmpdir)
  await setupCodexArtifacts(tmpdir)
  gitInit(tmpdir)
  runKbRebuild(tmpdir)
}

describeIf('measurement retroactive mixed-runtime integration', () => {
  tmpdirTest('rebuild and query expose Codex, Claude, and GSDR retroactively with separate availability and symmetry markers', async ({ tmpdir }) => {
    await setupRetroactiveProject(tmpdir)

    const rebuild = runMeasurement(tmpdir, ['rebuild'])
    const response = runMeasurement(tmpdir, ['query', 'pipeline integrity'])

    expect(rebuild.status).toBe('ok')
    expect(rebuild.store.db_path).toContain(path.join('.planning', 'measurement', 'measurement.db'))

    expect(response.provenance.store.present).toBe(true)
    expect(response.provenance.live_overlay.enabled).toBe(true)
    expect(response.runtime_dimension.runtimes_observed).toContain('claude-code')
    expect(response.runtime_dimension.runtimes_observed).toContain('codex-cli')
    expect(response.runtime_dimension.availability_markers.exposed.count).toBeGreaterThan(0)
    expect(response.runtime_dimension.symmetry_markers.asymmetric_only.count).toBeGreaterThan(0)
    expect(response.contract.feature_availability_statuses).toContain('not_emitted')
    expect(response.contract.runtime_symmetry_markers).toEqual([
      'symmetric_available',
      'symmetric_unavailable',
      'asymmetric_derived',
      'asymmetric_only',
    ])

    const codexRow = response.features.find(feature => feature.extractor === 'codex_runtime_metadata')
    expect(codexRow).toBeTruthy()
    expect(codexRow.value.model.value).toBe('gpt-5.4')
    expect(codexRow.value.gsd_version.value).toBe('1.19.4+dev')

    const traceRow = response.features.find(feature => feature.feature === 'intervention_lifecycle_artifact_trace')
    expect(traceRow).toBeTruthy()
    expect(traceRow.availability_status).toBe('exposed')
    expect(traceRow.value.summaries.count).toBe(1)
    expect(traceRow.value.verifications.count).toBe(1)
    expect(traceRow.value.signals.count).toBe(1)
    expect(traceRow.value.git_trace.available).toBe(true)
  })
})
