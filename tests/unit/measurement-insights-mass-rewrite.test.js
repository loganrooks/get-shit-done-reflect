import { describe, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const CLAUDE_SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/claude.cjs')
const DERIVED_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/derived.cjs')

const { encodeClaudeProjectPath, loadClaude } = require(CLAUDE_SOURCE_PATH)
const derived = require(DERIVED_PATH)

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function writeSessionMeta(tmpdir, sessionId, mtimeMs) {
  const filePath = path.join(tmpdir, 'home', '.claude', 'usage-data', 'session-meta', `${sessionId}.json`)
  await writeJson(filePath, {
    session_id: sessionId,
    project_path: tmpdir,
    start_time: '2026-04-16T10:00:00Z',
    user_message_count: 8,
  })
  const touchedAt = new Date(mtimeMs)
  await fs.utimes(filePath, touchedAt, touchedAt)
}

async function writeParentJsonl(tmpdir, sessionId, mtimeMs) {
  const projectDir = path.join(tmpdir, 'home', '.claude', 'projects', encodeClaudeProjectPath(tmpdir))
  const filePath = path.join(projectDir, `${sessionId}.jsonl`)
  await fs.mkdir(projectDir, { recursive: true })
  await fs.writeFile(filePath, [
    JSON.stringify({
      type: 'user',
      sessionId,
      cwd: tmpdir,
      entrypoint: 'cli',
      userType: 'external',
      version: '2.1.110',
      timestamp: '2026-04-16T10:00:00.000Z',
      message: { role: 'user', content: 'Fixture prompt' },
    }),
    JSON.stringify({
      type: 'assistant',
      sessionId,
      cwd: tmpdir,
      entrypoint: 'cli',
      userType: 'external',
      version: '2.1.110',
      timestamp: '2026-04-16T10:00:01.000Z',
      message: {
        id: `assistant-${sessionId}`,
        role: 'assistant',
        model: 'claude-opus-4-6',
        usage: {
          input_tokens: 3,
          output_tokens: 4,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
        content: [{ type: 'text', text: 'Fixture response' }],
      },
    }),
  ].join('\n'))
  const touchedAt = new Date(mtimeMs)
  await fs.utimes(filePath, touchedAt, touchedAt)
}

function extractInsightsRows(tmpdir) {
  const claude = loadClaude(tmpdir, {
    homeDir: path.join(tmpdir, 'home'),
    projectFilter: tmpdir,
  })
  const extractor = derived.DERIVED_EXTRACTORS.find(entry => entry.name === 'insights_mass_rewrite_boundary')
  return extractor.extract({
    cwd: tmpdir,
    observed_at: '2026-04-16T20:00:00.000Z',
    claude,
  })
}

describe('measurement insights mass rewrite boundary extractor', () => {
  tmpdirTest('detects a batch cluster and flags sessions with newer parent JSONL mtimes as stale analysis', async ({ tmpdir }) => {
    const base = Date.UTC(2026, 3, 16, 15, 6, 46)

    for (let index = 0; index < 6; index++) {
      const sessionId = `batch-${index}`
      const sessionMetaMtime = base + (index * 200)
      await writeSessionMeta(tmpdir, sessionId, sessionMetaMtime)
      await writeParentJsonl(tmpdir, sessionId, index === 0 ? sessionMetaMtime + 5000 : sessionMetaMtime - 5000)
    }

    const rows = extractInsightsRows(tmpdir)

    expect(rows).toHaveLength(1)
    expect(rows[0].value.batch_size).toBe(6)
    expect(rows[0].value.session_ids_in_batch).toHaveLength(6)
    expect(rows[0].value.staleness.stale_analysis_detected).toBe(true)
    expect(rows[0].value.staleness.sessions_with_newer_jsonl).toEqual(['batch-0'])
  })

  tmpdirTest('emits no rows when no session-meta cluster reaches the /insights batch threshold', async ({ tmpdir }) => {
    const base = Date.UTC(2026, 3, 16, 15, 6, 46)

    for (let index = 0; index < 4; index++) {
      const sessionId = `sparse-${index}`
      const sessionMetaMtime = base + (index * 200)
      await writeSessionMeta(tmpdir, sessionId, sessionMetaMtime)
      await writeParentJsonl(tmpdir, sessionId, sessionMetaMtime - 1000)
    }

    expect(extractInsightsRows(tmpdir)).toEqual([])
  })
})
