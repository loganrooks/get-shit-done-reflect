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
  tmpdirTest(
    'kb rebuild does not create signal_fts virtual table on a fresh database',
    async ({ tmpdir }) => {
      createKbDir(tmpdir)

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)

      const db = openDb(tmpdir)
      try {
        expect(readFtsObjects(db)).toEqual([])
      } finally {
        db.close()
      }
    },
    10000
  )

  tmpdirTest(
    'kb rebuild drops a pre-existing signal_fts virtual table and its shadow tables',
    async ({ tmpdir }) => {
      createKbDir(tmpdir)

      const initial = runKb(tmpdir, 'rebuild')
      expect(initial.errors).toBe(0)

      const preMigrationDb = openDb(tmpdir)
      try {
        preMigrationDb.exec('CREATE VIRTUAL TABLE signal_fts USING fts5(id, title, body);')
        expect(readFtsObjects(preMigrationDb).length).toBeGreaterThan(0)
      } finally {
        preMigrationDb.close()
      }

      const migrated = runKb(tmpdir, 'rebuild')
      expect(migrated.errors).toBe(0)

      const db = openDb(tmpdir)
      try {
        expect(readFtsObjects(db)).toEqual([])
      } finally {
        db.close()
      }
    },
    10000
  )
})
