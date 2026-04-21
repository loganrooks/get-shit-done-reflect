import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'fixtures')
const HELPER_PATH = path.resolve(process.cwd(), 'get-shit-done', 'bin', 'extract-session-fingerprints.py')
const sqliteProbe = spawnSync('which', ['sqlite3'], { encoding: 'utf8' })
const hasSqlite3 = sqliteProbe.status === 0

function runHelper(sessionPath) {
  const result = spawnSync('python3', [HELPER_PATH, sessionPath], { encoding: 'utf8' })
  expect(result.status, `helper exited non-zero: ${result.stderr}`).toBe(0)
  expect(result.stdout.trim()).not.toBe('')
  return JSON.parse(result.stdout.trim())
}

function runSqlite(dbPath, sql) {
  const result = spawnSync('sqlite3', [dbPath, sql], { encoding: 'utf8' })
  expect(result.status, `sqlite3 failed: ${result.stderr}`).toBe(0)
  return result.stdout
}

describe('extract-session-fingerprints.py helper', () => {
  const claudeFixture = path.join(FIXTURE_DIR, 'claude-session-sample.jsonl')
  const codexFixture = path.join(FIXTURE_DIR, 'codex-rollout-sample.jsonl')

  it('exists and is executable', () => {
    expect(fs.existsSync(HELPER_PATH)).toBe(true)
    expect(fs.statSync(HELPER_PATH).mode & 0o111).toBeGreaterThan(0)
  })

  it('detects Claude format and counts messages', () => {
    const fp = runHelper(claudeFixture)
    expect(fp._format).toBe('claude')
    expect(fp.user_message_count).toBe(1)
    expect(fp.assistant_message_count).toBe(2)
    expect(fp.tool_call_count).toBe(1)
  })

  it('marks Codex-only additive fields as not_available for Claude logs', () => {
    const fp = runHelper(claudeFixture)
    expect(fp.reasoning_output_tokens).toBe('not_available')
    expect(fp.rate_limit_primary_used_percent).toBe('not_available')
    expect(fp.model_context_window).toBe('not_available')
    expect(fp.source).toBe('not_available')
    expect(fp.agent_role).toBe('not_available')
  })

  it('detects Codex format and extracts session metadata', () => {
    const fp = runHelper(codexFixture)
    expect(fp._format).toBe('codex')
    expect(fp.session_id).toBe('test-session-001')
    expect(fp.source).toBe('cli')
    expect(fp.model).toBe('gpt-5')
  })

  it('extracts Codex token fields and counts turn_aborted interruptions', () => {
    const fp = runHelper(codexFixture)
    expect(fp.total_tokens).toBe(1234)
    expect(fp.reasoning_output_tokens).toBe(56)
    expect(fp.model_context_window).toBe(200000)
    expect(fp.rate_limit_primary_used_percent).toBe(12.3)
    expect(fp.interruptions).toBe(1)
  })

  it('counts Codex tool calls and does not flag known event types as unknown', () => {
    const fp = runHelper(codexFixture)
    expect(fp.tool_call_count).toBe(1)
    expect(Object.keys(fp._sens07_unknown_event_msg_types)).not.toContain('exec_command_end')
  })

  it('emits SENS-07 diagnostics for unknown event types', () => {
    const fp = runHelper(codexFixture)
    expect(fp._sens07_unknown_event_msg_types).toHaveProperty('this_is_an_unknown_type')
    expect(fp._sens07_unknown_event_msg_types.this_is_an_unknown_type).toBe(1)
  })

  it('returns unknown format instead of crashing on a missing path', () => {
    const fp = runHelper('/tmp/does-not-exist-phase-60-test.jsonl')
    expect(fp._format).toBe('unknown')
    expect(fp._sens07_error).toBe('format_detection_failed')
  })

  it('continues after malformed JSONL lines and records parse errors', () => {
    const tmpFile = path.join(os.tmpdir(), `phase60-malformed-${process.pid}-${Date.now()}.jsonl`)
    fs.writeFileSync(
      tmpFile,
      [
        '{"type":"session_meta","timestamp":"2026-04-21T10:00:00Z","payload":{"id":"x","source":"cli"}}',
        'NOT VALID JSON',
        '{"type":"event_msg","timestamp":"2026-04-21T10:00:01Z","payload":{"type":"user_message"}}',
      ].join('\n'),
      'utf8'
    )

    try {
      const fp = runHelper(tmpFile)
      expect(fp._format).toBe('codex')
      expect(fp.user_message_count).toBe(1)
      expect(fp._sens07_parse_errors.length).toBeGreaterThanOrEqual(1)
      expect(fp._sens07_parse_errors[0]).toHaveProperty('line_number')
    } finally {
      fs.unlinkSync(tmpFile)
    }
  })
})

const sqliteDescribe = hasSqlite3 ? describe : describe.skip

sqliteDescribe('SQLite-based Codex session discovery', () => {
  let tmpDbPath

  beforeEach(() => {
    tmpDbPath = path.join(os.tmpdir(), `phase60-state-${process.pid}-${Date.now()}.sqlite`)
    runSqlite(
      tmpDbPath,
      'CREATE TABLE threads (id TEXT PRIMARY KEY, rollout_path TEXT, cwd TEXT, archived INTEGER DEFAULT 0, created_at INTEGER);'
    )
    runSqlite(
      tmpDbPath,
      "INSERT INTO threads VALUES ('t1', '/tmp/rollout1.jsonl', '/home/test/project', 0, 1000);"
    )
    runSqlite(
      tmpDbPath,
      "INSERT INTO threads VALUES ('t2', '/tmp/rollout2.jsonl', '/home/test/other', 0, 2000);"
    )
    runSqlite(
      tmpDbPath,
      "INSERT INTO threads VALUES ('t3', '/tmp/rollout3.jsonl', '/home/test/project', 1, 3000);"
    )
  })

  afterEach(() => {
    if (tmpDbPath && fs.existsSync(tmpDbPath)) {
      fs.unlinkSync(tmpDbPath)
    }
  })

  it('PRAGMA table_info reports the cwd column', () => {
    const out = runSqlite(tmpDbPath, 'PRAGMA table_info(threads);')
    expect(out).toMatch(/\|cwd\|/)
  })

  it('selects rollout paths for the active project cwd only', () => {
    const out = runSqlite(
      tmpDbPath,
      "SELECT rollout_path FROM threads WHERE cwd = '/home/test/project' AND archived = 0;"
    )
    expect(out.trim()).toBe('/tmp/rollout1.jsonl')
  })

  it('returns an empty result set when the cwd does not match', () => {
    const out = runSqlite(
      tmpDbPath,
      "SELECT rollout_path FROM threads WHERE cwd = '/nonexistent' AND archived = 0;"
    )
    expect(out.trim()).toBe('')
  })

  it('simulates schema drift by omitting cwd and observing the PRAGMA probe fail', () => {
    const v6Db = path.join(os.tmpdir(), `phase60-state-v6-${process.pid}-${Date.now()}.sqlite`)
    try {
      runSqlite(v6Db, 'CREATE TABLE threads (id TEXT PRIMARY KEY, rollout_path TEXT, archived INTEGER);')
      const probe = spawnSync('sqlite3', [v6Db, 'PRAGMA table_info(threads);'], { encoding: 'utf8' })
      expect(probe.status).toBe(0)
      expect(probe.stdout).not.toMatch(/\|cwd\|/)
    } finally {
      if (fs.existsSync(v6Db)) {
        fs.unlinkSync(v6Db)
      }
    }
  })
})
