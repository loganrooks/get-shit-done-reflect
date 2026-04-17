import { describe, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const CLAUDE_SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/claude.cjs')
const DERIVED_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/derived.cjs')

const { loadClaude } = require(CLAUDE_SOURCE_PATH)
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
    user_message_count: 5,
  })
  const touchedAt = new Date(mtimeMs)
  await fs.utimes(filePath, touchedAt, touchedAt)
}

function extractWritePathRows(tmpdir) {
  const claude = loadClaude(tmpdir, {
    homeDir: path.join(tmpdir, 'home'),
    projectFilter: tmpdir,
  })
  const extractor = derived.DERIVED_EXTRACTORS.find(entry => entry.name === 'derived_write_path_provenance')
  return extractor.extract({
    cwd: tmpdir,
    observed_at: '2026-04-16T20:00:00.000Z',
    claude,
  })
}

describe('measurement derived write path provenance extractor', () => {
  tmpdirTest('classifies six close session-meta artifacts as one bulk write', async ({ tmpdir }) => {
    const base = Date.UTC(2026, 3, 16, 15, 6, 46)
    await Promise.all(Array.from({ length: 6 }, (_, index) => (
      writeSessionMeta(tmpdir, `bulk-${index}`, base + (index * 200))
    )))

    const rows = extractWritePathRows(tmpdir)

    expect(rows).toHaveLength(6)
    expect(new Set(rows.map(row => row.value.write_path))).toEqual(new Set(['bulk']))
    expect(new Set(rows.map(row => row.value.mtime_cluster_id)).size).toBe(1)
    expect(rows.every(row => row.value.cluster_size === 6)).toBe(true)
  })

  tmpdirTest('classifies widely spaced session-meta artifacts as single writes', async ({ tmpdir }) => {
    const base = Date.UTC(2026, 3, 16, 15, 6, 46)
    await Promise.all(Array.from({ length: 6 }, (_, index) => (
      writeSessionMeta(tmpdir, `single-${index}`, base + (index * 10000))
    )))

    const rows = extractWritePathRows(tmpdir)

    expect(rows).toHaveLength(6)
    expect(rows.every(row => row.value.write_path === 'single')).toBe(true)
    expect(rows.every(row => row.value.mtime_cluster_id === null)).toBe(true)
  })

  tmpdirTest('handles mixed bulk and single artifact write paths per row', async ({ tmpdir }) => {
    const base = Date.UTC(2026, 3, 16, 15, 6, 46)
    await Promise.all([
      ...Array.from({ length: 5 }, (_, index) => (
        writeSessionMeta(tmpdir, `mixed-bulk-${index}`, base + (index * 150))
      )),
      writeSessionMeta(tmpdir, 'mixed-single-1', base + 10000),
      writeSessionMeta(tmpdir, 'mixed-single-2', base + 25000),
    ])

    const rows = extractWritePathRows(tmpdir)
    const bulkRows = rows.filter(row => row.value.write_path === 'bulk')
    const singleRows = rows.filter(row => row.value.write_path === 'single')

    expect(rows).toHaveLength(7)
    expect(bulkRows).toHaveLength(5)
    expect(singleRows).toHaveLength(2)
    expect(new Set(bulkRows.map(row => row.value.mtime_cluster_id)).size).toBe(1)
    expect(singleRows.every(row => row.value.mtime_cluster_id === null)).toBe(true)
  })
})
