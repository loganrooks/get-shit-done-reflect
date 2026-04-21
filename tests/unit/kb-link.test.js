/**
 * Unit tests for kb-link.cjs -- Phase 59 Plan 02 (read half of kb link).
 *
 * Covers:
 *   - --outbound / --inbound / --both modes and default-direction behaviour
 *   - target_kind classification: signal / spike / malformed / orphan
 *   - Nonexistent signal-id errors (not silent empty)
 *   - --format json shape stability
 *   - idx_signal_links_target usage via EXPLAIN QUERY PLAN
 *   - kb.db-absence surfaces a clean error (no grep fallback for inbound)
 *   - kb link create / delete emit the Plan 04 stub error
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

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function createKbDir(tmpdir) {
  const kbDir = path.join(tmpdir, '.planning', 'knowledge')
  fs.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
  fs.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
  return kbDir
}

function openDb(tmpdir) {
  const { DatabaseSync } = require('node:sqlite')
  const dbPath = path.join(tmpdir, '.planning', 'knowledge', 'kb.db')
  return new DatabaseSync(dbPath)
}

/**
 * Seed a signal corpus with a linkable edge graph:
 *   sig-a --related_to--> sig-b
 *   sig-a --related_to--> sig-c
 *   sig-a --recurrence_of--> sig-b
 *   sig-b --related_to--> sig-c
 *   sig-c <- (nothing outbound; receives inbound from a and b)
 *   sig-d --related_to--> sig-missing   (orphan target)
 *
 * Also seeds a spike spk-s1 so we can test the spike target_kind branch:
 *   sig-e --related_to--> spk-s1
 */
function seedLinkedCorpus(kbDir) {
  const sigsDir = path.join(kbDir, 'signals', 'demo')
  fs.mkdirSync(sigsDir, { recursive: true })

  const signal = (id, extras = {}) => {
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
    ]
    for (const [k, v] of Object.entries(extras)) {
      if (Array.isArray(v)) {
        lines.push(`${k}:`)
        for (const item of v) lines.push(`  - ${item}`)
      } else {
        lines.push(`${k}: ${v}`)
      }
    }
    lines.push('---', '', `## ${id}`, '', 'Body.', '')
    return lines.join('\n')
  }

  fs.writeFileSync(
    path.join(sigsDir, 'sig-a.md'),
    signal('sig-a', { related_signals: ['sig-b', 'sig-c'], recurrence_of: 'sig-b' }),
    'utf-8'
  )
  fs.writeFileSync(
    path.join(sigsDir, 'sig-b.md'),
    signal('sig-b', { related_signals: ['sig-c'] }),
    'utf-8'
  )
  fs.writeFileSync(path.join(sigsDir, 'sig-c.md'), signal('sig-c'), 'utf-8')
  fs.writeFileSync(
    path.join(sigsDir, 'sig-d.md'),
    signal('sig-d', { related_signals: ['sig-missing'] }),
    'utf-8'
  )
  fs.writeFileSync(
    path.join(sigsDir, 'sig-e.md'),
    signal('sig-e', { related_signals: ['spk-s1'] }),
    'utf-8'
  )

  // Spike fixture.
  const spikesDir = path.join(kbDir, 'spikes', 'demo')
  fs.mkdirSync(spikesDir, { recursive: true })
  fs.writeFileSync(
    path.join(spikesDir, 'spk-s1.md'),
    [
      '---',
      'id: spk-s1',
      'type: spike',
      'project: demo',
      'status: active',
      'hypothesis: test',
      "created: '2026-04-21T10:00:00Z'",
      '---',
      '',
      '## Hypothesis',
      '',
      'Test spike.',
      '',
    ].join('\n'),
    'utf-8'
  )
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describeIf('kb link show: direction modes', () => {
  tmpdirTest('--outbound returns sig-a\'s two related_to edges plus recurrence_of', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['link', 'show', 'sig-a', '--outbound'])
    expect(result.signalId).toBe('sig-a')
    expect(result.outbound.length).toBe(3)
    expect(result.inbound).toEqual([])
    const pairs = result.outbound.map(r => `${r.link_type}:${r.target_id}`).sort()
    expect(pairs).toEqual([
      'recurrence_of:sig-b',
      'related_to:sig-b',
      'related_to:sig-c',
    ])
    for (const r of result.outbound) {
      expect(r.target_kind).toBe('signal')
    }
  }, 15000)

  tmpdirTest('--inbound returns sig-c\'s two incoming related_to edges', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['link', 'show', 'sig-c', '--inbound'])
    expect(result.outbound).toEqual([])
    expect(result.inbound.length).toBe(2)
    const sources = result.inbound.map(r => r.source_id).sort()
    expect(sources).toEqual(['sig-a', 'sig-b'])
    for (const r of result.inbound) {
      expect(r.link_type).toBe('related_to')
      // Inbound rows deliberately omit target_kind (target is the signal we
      // queried; its kind is known).
      expect(r.target_kind).toBeUndefined()
    }
  }, 15000)

  tmpdirTest('--both returns the union with both sections for sig-b', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['link', 'show', 'sig-b', '--both'])
    // sig-b outbound: related_to sig-c
    expect(result.outbound.length).toBe(1)
    expect(result.outbound[0].target_id).toBe('sig-c')
    // sig-b inbound: sig-a via related_to AND sig-a via recurrence_of
    expect(result.inbound.length).toBe(2)
  }, 15000)

  tmpdirTest('default direction (no flag) is --both', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['link', 'show', 'sig-b'])
    expect(result.requested).toBe('both')
    expect(Array.isArray(result.outbound)).toBe(true)
    expect(Array.isArray(result.inbound)).toBe(true)
  }, 15000)
})

describeIf('kb link show: target_kind classification', () => {
  tmpdirTest('orphan target (nonexistent signal/spike) is labeled orphan', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['link', 'show', 'sig-d', '--outbound'])
    expect(result.outbound.length).toBe(1)
    expect(result.outbound[0].target_id).toBe('sig-missing')
    expect(result.outbound[0].target_kind).toBe('orphan')
  }, 15000)

  tmpdirTest('spike target is labeled spike', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['link', 'show', 'sig-e', '--outbound'])
    expect(result.outbound.length).toBe(1)
    expect(result.outbound[0].target_id).toBe('spk-s1')
    expect(result.outbound[0].target_kind).toBe('spike')
  }, 15000)

  tmpdirTest('malformed target (literal [object Object]) is labeled malformed', async ({ tmpdir }) => {
    const kbDir = createKbDir(tmpdir)
    seedLinkedCorpus(kbDir)
    runKb(tmpdir, ['rebuild'])

    // After repair landed in Plan 01 the live rebuild path cannot produce
    // '[object Object]' target_ids. Inject one directly into signal_links so
    // we can verify the CASE-WHEN branch still labels it correctly. This is
    // a post-rebuild SQL-only injection; the .md side stays clean.
    const db = openDb(tmpdir)
    db.prepare(`
      INSERT INTO signal_links (source_id, target_id, link_type, created_at, source_content_hash)
      VALUES ('sig-a', '[object Object]', 'recurrence_of', '2026-04-21T10:00:00Z', 'test-hash')
    `).run()
    db.close()

    const result = runKb(tmpdir, ['link', 'show', 'sig-a', '--outbound'])
    const malformed = result.outbound.find(r => r.target_id === '[object Object]')
    expect(malformed).toBeDefined()
    expect(malformed.target_kind).toBe('malformed')
    expect(malformed.link_type).toBe('recurrence_of')
  }, 15000)
})

describeIf('kb link show: error surfaces', () => {
  tmpdirTest('nonexistent signal exits non-zero with "signal not found"', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const { stderr, code } = runKbCapture(tmpdir, ['link', 'show', 'sig-does-not-exist'])
    expect(code).not.toBe(0)
    expect(stderr.toLowerCase()).toContain('signal not found')
  }, 15000)

  tmpdirTest('missing signal-id argument exits non-zero with usage', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const { stderr, code } = runKbCapture(tmpdir, ['link', 'show'])
    expect(code).not.toBe(0)
    expect(stderr.toLowerCase()).toContain('usage')
  }, 15000)

  tmpdirTest('kb.db absence errors cleanly (no grep fallback for link traversal)', async ({ tmpdir }) => {
    createKbDir(tmpdir) // signals dir exists but no rebuild -> kb.db absent
    const { stderr, code } = runKbCapture(tmpdir, ['link', 'show', 'sig-a'])
    expect(code).not.toBe(0)
    expect(stderr.toLowerCase()).toMatch(/kb\.db required/)
    expect(stderr.toLowerCase()).toMatch(/kb rebuild/)
  }, 15000)
})

describeIf('kb link show: JSON shape stability', () => {
  tmpdirTest('--format json returns {signalId, outbound, inbound, requested}', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['link', 'show', 'sig-a', '--both'])
    expect(result).toHaveProperty('signalId', 'sig-a')
    expect(result).toHaveProperty('outbound')
    expect(result).toHaveProperty('inbound')
    expect(result).toHaveProperty('requested', 'both')
    expect(Array.isArray(result.outbound)).toBe(true)
    expect(Array.isArray(result.inbound)).toBe(true)
  }, 15000)
})

describeIf('kb link show: index usage', () => {
  tmpdirTest('inbound query plans as SEARCH USING INDEX idx_signal_links_target', async ({ tmpdir }) => {
    seedLinkedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const db = openDb(tmpdir)
    const plan = db.prepare(
      "EXPLAIN QUERY PLAN SELECT source_id, link_type FROM signal_links WHERE target_id = ? ORDER BY link_type, source_id"
    ).all('sig-c')
    db.close()

    const detail = plan.map(p => p.detail || '').join(' | ')
    expect(detail).toMatch(/USING INDEX idx_signal_links_target/)
    expect(detail).not.toMatch(/SCAN signal_links(?!.*USING)/)
  }, 15000)
})

describeIf('kb link create / delete: Plan 04 stub', () => {
  tmpdirTest('kb link create emits Plan 04 deferral error', async ({ tmpdir }) => {
    const { stderr, code } = runKbCapture(tmpdir, ['link', 'create', 'x', 'y', '--type', 'related_to'])
    expect(code).not.toBe(0)
    expect(stderr).toMatch(/Plan 04/)
    expect(stderr.toLowerCase()).toContain('not yet implemented')
  }, 15000)

  tmpdirTest('kb link delete emits Plan 04 deferral error', async ({ tmpdir }) => {
    const { stderr, code } = runKbCapture(tmpdir, ['link', 'delete', 'x', 'y', '--type', 'related_to'])
    expect(code).not.toBe(0)
    expect(stderr).toMatch(/Plan 04/)
  }, 15000)
})
