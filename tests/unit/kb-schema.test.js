import { describe, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)
const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

const [major, minor] = process.versions.node.split('.').map(Number)
const hasNodeSqlite = major > 22 || (major === 22 && minor >= 5)
const describeIf = hasNodeSqlite ? describe : describe.skip

function createKbDir(tmpdir) {
  const kbDir = path.join(tmpdir, '.planning', 'knowledge')
  fs.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
  fs.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
  return kbDir
}

function runKb(tmpdir, subcommand, extraArgs = []) {
  const args = ['kb', subcommand, ...extraArgs, '--raw']
  try {
    const result = execSync(
      `node --no-warnings "${GSD_TOOLS}" ${args.join(' ')}`,
      {
        cwd: tmpdir,
        encoding: 'utf-8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    )
    return JSON.parse(result.trim())
  } catch (err) {
    const stdout = err.stdout || ''
    const stderr = err.stderr || ''
    throw new Error(`kb ${subcommand} failed:\nstdout: ${stdout}\nstderr: ${stderr}`)
  }
}

function openDb(tmpdir) {
  const { DatabaseSync } = require('node:sqlite')
  const dbPath = path.join(tmpdir, '.planning', 'knowledge', 'kb.db')
  return new DatabaseSync(dbPath)
}

function readFtsObjects(db) {
  return db.prepare(
    "SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name LIKE '%fts%' ORDER BY name"
  ).all()
}

describeIf('kb schema migration', () => {
  // Phase 59 KB-04b: signal_fts is now the required full-text search substrate
  // (external-content contentless rewrite over the signals table). Phase 57.7
  // dropped the broken canonical-row expansion; Phase 59 re-introduces the
  // correct shape. These tests track the re-entry, not the drop.

  tmpdirTest(
    'kb rebuild creates signal_fts external-content virtual table on a fresh database',
    async ({ tmpdir }) => {
      createKbDir(tmpdir)

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)

      const db = openDb(tmpdir)
      try {
        const ftsObjects = readFtsObjects(db)
        // Phase 59 creates signal_fts plus its FTS5 shadow tables
        // (signal_fts_data, signal_fts_idx, signal_fts_docsize, signal_fts_config)
        const ftsNames = ftsObjects.map(o => o.name)
        expect(ftsNames).toContain('signal_fts')
        // Verify external-content mode: the FTS table definition references
        // content='signals' (not a canonical-row expansion).
        const schema = db
          .prepare("SELECT sql FROM sqlite_master WHERE name='signal_fts'")
          .get()
        expect(schema.sql).toMatch(/content\s*=\s*'signals'/)
      } finally {
        db.close()
      }
    },
    10000
  )

  tmpdirTest(
    'kb rebuild drops a pre-existing malformed signal_fts and replaces it with the correct external-content shape',
    async ({ tmpdir }) => {
      createKbDir(tmpdir)

      const initial = runKb(tmpdir, 'rebuild')
      expect(initial.errors).toBe(0)

      // Install a malformed signal_fts (old Phase 57.7 canonical-row style)
      // after downgrading schema_version to v2 so initSchema's v<3 cleanup
      // path fires on next rebuild.
      const preMigrationDb = openDb(tmpdir)
      try {
        preMigrationDb.exec('DROP TRIGGER IF EXISTS signals_ai; DROP TRIGGER IF EXISTS signals_ad; DROP TRIGGER IF EXISTS signals_au; DROP TABLE IF EXISTS signal_fts;')
        preMigrationDb.exec('CREATE VIRTUAL TABLE signal_fts USING fts5(id, title, body);')
        preMigrationDb.exec("UPDATE meta SET value='2' WHERE key='schema_version'")
        // Confirm the malformed (no external content) shape is present
        const schema = preMigrationDb
          .prepare("SELECT sql FROM sqlite_master WHERE name='signal_fts'")
          .get()
        expect(schema.sql).not.toMatch(/content\s*=\s*'signals'/)
      } finally {
        preMigrationDb.close()
      }

      const migrated = runKb(tmpdir, 'rebuild')
      expect(migrated.errors).toBe(0)

      const db = openDb(tmpdir)
      try {
        // After migration signal_fts exists again, but in external-content shape
        const schema = db
          .prepare("SELECT sql FROM sqlite_master WHERE name='signal_fts'")
          .get()
        expect(schema).toBeTruthy()
        expect(schema.sql).toMatch(/content\s*=\s*'signals'/)

        const schemaVersion = db
          .prepare("SELECT value FROM meta WHERE key='schema_version'")
          .get()
        expect(schemaVersion.value).toBe('3')
      } finally {
        db.close()
      }
    },
    10000
  )
})
