/**
 * Unit tests for kb link create / kb link delete (Phase 59 Plan 04).
 *
 * Covers:
 *   - create related_to writes fm.related_signals on source AND inserts
 *     signal_links row, both in one transaction
 *   - create never touches target file (frozen invariant)
 *   - qualified_by without --force rejects (frozen-field guard)
 *   - qualified_by with --force succeeds
 *   - delete removes both frontmatter entry and signal_links row
 *   - idempotent: re-create is no-op; delete missing is no-op
 *   - created_at is ISO-8601 and source_content_hash is 64-hex
 *
 * Requires Node >= 22.5.0 (node:sqlite).
 */

import { describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
import { tmpdirTest } from '../helpers/tmpdir.js'

const [major, minor] = process.versions.node.split('.').map(Number)
const hasNodeSqlite = major > 22 || (major === 22 && minor >= 5)
const describeIf = hasNodeSqlite ? describe : describe.skip

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

function runKb(tmpdir, args) {
  const cmd = `node --no-warnings "${GSD_TOOLS}" kb ${args.join(' ')} --raw`
  try {
    const stdout = execSync(cmd, {
      cwd: tmpdir,
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return JSON.parse(stdout.trim())
  } catch (err) {
    const stdout = err.stdout || ''
    const stderr = err.stderr || ''
    throw new Error(`kb ${args.join(' ')} failed:\nstdout: ${stdout}\nstderr: ${stderr}`)
  }
}

function runKbCapture(tmpdir, args) {
  const cmd = `node --no-warnings "${GSD_TOOLS}" kb ${args.join(' ')}`
  let stdout = ''
  let stderr = ''
  let code = 0
  try {
    stdout = execSync(cmd, { cwd: tmpdir, encoding: 'utf-8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (err) {
    stdout = err.stdout || ''
    stderr = err.stderr || ''
    code = err.status != null ? err.status : 1
  }
  return { stdout, stderr, code }
}

function openDb(tmpdir) {
  const { DatabaseSync } = require('node:sqlite')
  return new DatabaseSync(path.join(tmpdir, '.planning', 'knowledge', 'kb.db'))
}

function seedSignal(tmpdir, id) {
  const kbDir = path.join(tmpdir, '.planning', 'knowledge')
  const sigsDir = path.join(kbDir, 'signals', 'demo')
  fs.mkdirSync(sigsDir, { recursive: true })
  fs.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
  const lines = [
    '---',
    `id: ${id}`,
    'type: signal',
    'project: demo',
    'severity: minor',
    'lifecycle_state: detected',
    'status: active',
    'detection_method: manual',
    'origin: user-observation',
    "created: '2026-04-21T10:00:00Z'",
    'tags: []',
    '---',
    '',
    `## ${id}`,
    '',
    'Body.',
    '',
  ]
  fs.writeFileSync(path.join(sigsDir, `${id}.md`), lines.join('\n'), 'utf-8')
  return path.join(sigsDir, `${id}.md`)
}

function seedTwoSignals(tmpdir) {
  seedSignal(tmpdir, 'sig-src')
  seedSignal(tmpdir, 'sig-tgt')
  runKb(tmpdir, ['rebuild'])
}

describeIf('kb link create: related_to (mutable)', () => {
  tmpdirTest('writes fm.related_signals on source AND inserts signal_links row', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)

    const result = runKb(tmpdir, ['link', 'create', 'sig-src', 'sig-tgt', '--type', 'related_to'])
    expect(result.verb).toBe('create')
    expect(result.srcId).toBe('sig-src')
    expect(result.tgtId).toBe('sig-tgt')

    // Source frontmatter has related_signals array including tgt.
    const srcContent = fs.readFileSync(path.join(tmpdir, '.planning/knowledge/signals/demo/sig-src.md'), 'utf-8')
    expect(srcContent).toMatch(/related_signals:/)
    expect(srcContent).toMatch(/sig-tgt/)

    // SQL row with provenance columns populated.
    const db = openDb(tmpdir)
    const row = db.prepare(`
      SELECT source_id, target_id, link_type, created_at, source_content_hash
      FROM signal_links WHERE source_id=? AND target_id=? AND link_type=?
    `).get('sig-src', 'sig-tgt', 'related_to')
    expect(row).toBeTruthy()
    expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(row.source_content_hash).toMatch(/^[0-9a-f]{64}$/)
  }, 15000)

  tmpdirTest('re-create is idempotent (noop=true)', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    runKb(tmpdir, ['link', 'create', 'sig-src', 'sig-tgt', '--type', 'related_to'])
    const second = runKb(tmpdir, ['link', 'create', 'sig-src', 'sig-tgt', '--type', 'related_to'])
    expect(second.noop).toBe(true)
  }, 15000)

  tmpdirTest('does not touch target file frontmatter', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const tgtPath = path.join(tmpdir, '.planning/knowledge/signals/demo/sig-tgt.md')
    const beforeBytes = fs.readFileSync(tgtPath, 'utf-8')

    runKb(tmpdir, ['link', 'create', 'sig-src', 'sig-tgt', '--type', 'related_to'])

    const afterBytes = fs.readFileSync(tgtPath, 'utf-8')
    expect(afterBytes).toBe(beforeBytes)
  }, 15000)

  tmpdirTest('--dry-run writes nothing but reports the planned change', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const srcPath = path.join(tmpdir, '.planning/knowledge/signals/demo/sig-src.md')
    const before = fs.readFileSync(srcPath, 'utf-8')

    const result = runKb(tmpdir, ['link', 'create', 'sig-src', 'sig-tgt', '--type', 'related_to', '--dry-run'])
    expect(result.dry_run).toBe(true)
    expect(fs.readFileSync(srcPath, 'utf-8')).toBe(before)

    const db = openDb(tmpdir)
    const row = db.prepare('SELECT 1 FROM signal_links WHERE source_id=? AND target_id=? AND link_type=?')
      .get('sig-src', 'sig-tgt', 'related_to')
    expect(row).toBeUndefined()
  }, 15000)
})

describeIf('kb link create: frozen-field guard (qualified_by / superseded_by)', () => {
  tmpdirTest('qualified_by without --force rejects with exit 1', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const cap = runKbCapture(tmpdir, [
      'link', 'create', 'sig-src', 'sig-tgt', '--type', 'qualified_by', '--raw',
    ])
    expect(cap.code).not.toBe(0)
    const payload = JSON.parse(cap.stdout.trim())
    expect(payload.error).toMatch(/FROZEN/)

    // Neither file nor SQL should be modified.
    const srcContent = fs.readFileSync(path.join(tmpdir, '.planning/knowledge/signals/demo/sig-src.md'), 'utf-8')
    expect(srcContent).not.toMatch(/qualified_by:/)
  }, 15000)

  tmpdirTest('qualified_by with --force succeeds', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const result = runKb(tmpdir, [
      'link', 'create', 'sig-src', 'sig-tgt', '--type', 'qualified_by', '--force',
    ])
    expect(result.verb).toBe('create')
    expect(result.linkType).toBe('qualified_by')

    const db = openDb(tmpdir)
    const row = db.prepare('SELECT 1 FROM signal_links WHERE source_id=? AND target_id=? AND link_type=?')
      .get('sig-src', 'sig-tgt', 'qualified_by')
    expect(row).toBeTruthy()
  }, 15000)
})

describeIf('kb link delete', () => {
  tmpdirTest('removes both frontmatter entry and SQL row', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    runKb(tmpdir, ['link', 'create', 'sig-src', 'sig-tgt', '--type', 'related_to'])

    // Confirm it's there.
    const db = openDb(tmpdir)
    expect(
      db.prepare('SELECT 1 FROM signal_links WHERE source_id=? AND target_id=? AND link_type=?')
        .get('sig-src', 'sig-tgt', 'related_to')
    ).toBeTruthy()

    const result = runKb(tmpdir, ['link', 'delete', 'sig-src', 'sig-tgt', '--type', 'related_to'])
    expect(result.verb).toBe('delete')

    const srcContent = fs.readFileSync(path.join(tmpdir, '.planning/knowledge/signals/demo/sig-src.md'), 'utf-8')
    // Either related_signals field is absent OR the array is empty (both acceptable).
    const rowAfter = db.prepare('SELECT 1 FROM signal_links WHERE source_id=? AND target_id=? AND link_type=?')
      .get('sig-src', 'sig-tgt', 'related_to')
    expect(rowAfter).toBeUndefined()
    // And the tgt id should no longer appear in the fm block literal.
    const fmBlock = srcContent.match(/^---\r?\n([\s\S]+?)\r?\n---/)[1]
    expect(fmBlock).not.toMatch(/sig-tgt/)
  }, 15000)

  tmpdirTest('delete of missing link is idempotent no-op', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const result = runKb(tmpdir, ['link', 'delete', 'sig-src', 'sig-tgt', '--type', 'related_to'])
    expect(result.noop).toBe(true)
  }, 15000)
})

describeIf('kb link write: error surfaces', () => {
  tmpdirTest('missing --type rejects', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const cap = runKbCapture(tmpdir, ['link', 'create', 'sig-src', 'sig-tgt', '--raw'])
    expect(cap.code).not.toBe(0)
    const payload = JSON.parse(cap.stdout.trim())
    expect(payload.error).toMatch(/--type is required/)
  }, 15000)

  tmpdirTest('invalid --type value rejects', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const cap = runKbCapture(tmpdir, [
      'link', 'create', 'sig-src', 'sig-tgt', '--type', 'bogus', '--raw',
    ])
    expect(cap.code).not.toBe(0)
  }, 15000)

  tmpdirTest('missing source signal errors', async ({ tmpdir }) => {
    seedTwoSignals(tmpdir)
    const cap = runKbCapture(tmpdir, [
      'link', 'create', 'sig-missing', 'sig-tgt', '--type', 'related_to', '--raw',
    ])
    expect(cap.code).not.toBe(0)
    const payload = JSON.parse(cap.stdout.trim())
    expect(payload.error).toMatch(/source signal file not found/)
  }, 15000)
})

describeIf('kb link write: module-level helpers', () => {
  it('applyLinkCreate / applyLinkDelete return {fm, changed}', () => {
    const mod = require('../../get-shit-done/bin/lib/kb-link.cjs')
    const applyCreate = mod.__testOnly_applyLinkCreate
    const applyDelete = mod.__testOnly_applyLinkDelete

    // Create related_to on empty fm.
    const r1 = applyCreate({}, 'related_to', 'sig-x')
    expect(r1.changed).toBe(true)
    expect(r1.fm.related_signals).toEqual(['sig-x'])

    // Second create of same link is a no-op.
    const r2 = applyCreate(r1.fm, 'related_to', 'sig-x')
    expect(r2.changed).toBe(false)

    // Delete removes it.
    const r3 = applyDelete(r1.fm, 'related_to', 'sig-x')
    expect(r3.changed).toBe(true)
    expect(r3.fm.related_signals).toEqual([])

    // Delete of missing is a no-op.
    const r4 = applyDelete({}, 'related_to', 'sig-x')
    expect(r4.changed).toBe(false)

    // Superseded_by scalar.
    const r5 = applyCreate({}, 'superseded_by', 'sig-y')
    expect(r5.changed).toBe(true)
    expect(r5.fm.superseded_by).toBe('sig-y')
    const r6 = applyDelete(r5.fm, 'superseded_by', 'sig-y')
    expect(r6.changed).toBe(true)
    expect(r6.fm.superseded_by).toBeUndefined()
  })
})
