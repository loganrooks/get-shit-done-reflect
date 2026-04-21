/**
 * Unit tests for kb-query.cjs -- Phase 59 Plan 02 (read half).
 *
 * Covers:
 *   - kb query: structured AND filters (severity / lifecycle / project / tag / since)
 *   - kb search: FTS5 MATCH, porter stemming, phrase query, JSON shape
 *   - Fallback: kb.db absent -> grep-over-markdown path, clearly labeled
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

/**
 * Seed a tmpdir with a small, varied corpus of signals for query/search tests.
 * Fixtures chosen to exercise every filter combination exactly once.
 */
function seedCorpus(kbDir) {
  const signalsDir = path.join(kbDir, 'signals', 'demo-project')
  fs.mkdirSync(signalsDir, { recursive: true })

  const fixtures = [
    {
      filename: 'sig-crit-auth.md',
      id: 'sig-crit-auth',
      severity: 'critical',
      lifecycle: 'triaged',
      created: '2026-04-15T10:00:00Z',
      tags: ['auth', 'security'],
      title: 'Authentication token refresh broken',
      body: 'The refresh token rotation flow drops tokens on expiry and users log out unexpectedly.',
    },
    {
      filename: 'sig-minor-perf.md',
      id: 'sig-minor-perf',
      severity: 'minor',
      lifecycle: 'detected',
      created: '2026-03-10T10:00:00Z',
      tags: ['performance'],
      title: 'Slow dashboard load',
      body: 'Dashboard takes several seconds to render; perf trace points at N+1 query.',
    },
    {
      filename: 'sig-crit-perf.md',
      id: 'sig-crit-perf',
      severity: 'critical',
      lifecycle: 'remediated',
      created: '2026-04-05T10:00:00Z',
      tags: ['performance', 'database'],
      title: 'Index missing on hot path',
      body: 'Full-table scan on events table causes production slowdown during peak hours.',
    },
    {
      filename: 'sig-note-auth.md',
      id: 'sig-note-auth',
      severity: 'notable',
      lifecycle: 'triaged',
      created: '2026-04-20T10:00:00Z',
      tags: ['auth'],
      title: 'Session cookie not rotated on privilege change',
      body: 'When a user escalates to admin the session identifier is not invalidated.',
    },
    {
      filename: 'sig-note-docs.md',
      id: 'sig-note-docs',
      severity: 'notable',
      lifecycle: 'verified',
      created: '2026-02-28T10:00:00Z',
      tags: ['docs'],
      title: 'Migration guide is outdated',
      body: 'The v2 migration guide mentions deprecated flags and the rotating key procedure.',
    },
  ]

  for (const f of fixtures) {
    const fm = [
      '---',
      `id: ${f.id}`,
      `type: signal`,
      `project: demo-project`,
      `severity: ${f.severity}`,
      `lifecycle_state: ${f.lifecycle}`,
      `status: active`,
      `detection_method: manual`,
      `origin: user-observation`,
      `created: '${f.created}'`,
      `tags:`,
      ...f.tags.map(t => `  - ${t}`),
      '---',
      '',
      `## ${f.title}`,
      '',
      f.body,
      '',
    ].join('\n')
    fs.writeFileSync(path.join(signalsDir, f.filename), fm, 'utf-8')
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describeIf('kb query: structured AND filters', () => {
  tmpdirTest('--lifecycle triaged returns only triaged signals', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['query', '--lifecycle', 'triaged'])
    expect(result.fallback).toBeNull()
    expect(result.results.length).toBe(2)
    for (const r of result.results) {
      expect(r.lifecycle_state).toBe('triaged')
    }
    const ids = result.results.map(r => r.id).sort()
    expect(ids).toEqual(['sig-crit-auth', 'sig-note-auth'])
  }, 15000)

  tmpdirTest('--tag auth + --severity critical ANDs correctly', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['query', '--tag', 'auth', '--severity', 'critical'])
    expect(result.results.length).toBe(1)
    expect(result.results[0].id).toBe('sig-crit-auth')
  }, 15000)

  tmpdirTest('--since 2026-04-01 filters by created lexically', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['query', '--since', '2026-04-01'])
    const ids = result.results.map(r => r.id).sort()
    expect(ids).toEqual(['sig-crit-auth', 'sig-crit-perf', 'sig-note-auth'])
  }, 15000)

  tmpdirTest('--project filter returns only signals in that project', async ({ tmpdir }) => {
    const kbDir = createKbDir(tmpdir)
    seedCorpus(kbDir)
    // Add a second project to prove the filter narrows it.
    const otherDir = path.join(kbDir, 'signals', 'other-project')
    fs.mkdirSync(otherDir, { recursive: true })
    fs.writeFileSync(
      path.join(otherDir, 'sig-other.md'),
      [
        '---',
        'id: sig-other',
        'type: signal',
        'project: other-project',
        'severity: minor',
        'lifecycle_state: detected',
        'status: active',
        'detection_method: manual',
        'origin: user-observation',
        "created: '2026-04-18T10:00:00Z'",
        'tags: []',
        '---',
        '',
        '## Other',
        '',
        'Different project body.',
      ].join('\n'),
      'utf-8'
    )
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['query', '--project', 'demo-project'])
    for (const r of result.results) expect(r.project).toBe('demo-project')
    expect(result.results.length).toBe(5)
  }, 15000)

  tmpdirTest('query_params echoes supplied flags for observability', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['query', '--severity', 'critical', '--limit', '2'])
    expect(result.query_params.severity).toBe('critical')
    expect(result.query_params.limit).toBe(2)
  }, 15000)
})

describeIf('kb search: FTS5 MATCH + porter stemming', () => {
  tmpdirTest('search on literal phrase finds body hit', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['search', 'dashboard'])
    expect(result.fallback).toBeNull()
    const ids = result.results.map(r => r.id)
    expect(ids).toContain('sig-minor-perf')
  }, 15000)

  tmpdirTest('porter stemming: "rotating" matches body "rotation" and "rotated"', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['search', 'rotating'])
    const ids = result.results.map(r => r.id)
    // sig-crit-auth body says "rotation", sig-note-docs says "rotating"
    expect(ids).toContain('sig-crit-auth')
    expect(ids).toContain('sig-note-docs')
  }, 15000)

  tmpdirTest('--format json JSON shape is stable', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const result = runKb(tmpdir, ['search', 'session'])
    expect(result).toHaveProperty('query')
    expect(result).toHaveProperty('limit')
    expect(result).toHaveProperty('results')
    expect(result).toHaveProperty('fallback')
    if (result.results.length > 0) {
      for (const r of result.results) {
        expect(r).toHaveProperty('id')
        expect(r).toHaveProperty('severity')
        expect(r).toHaveProperty('lifecycle_state')
        expect(r).toHaveProperty('project')
        expect(r).toHaveProperty('created')
        expect(r).toHaveProperty('context')
      }
    }
  }, 15000)

  tmpdirTest('empty query errors with usage', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    const { stderr, code } = runKbCapture(tmpdir, ['search'])
    expect(code).not.toBe(0)
    expect(stderr.toLowerCase()).toContain('usage')
  }, 15000)

  tmpdirTest('--limit caps the result set', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    runKb(tmpdir, ['rebuild'])

    // "the" is in almost every body -- use as a guaranteed-many-hit proxy.
    const result = runKb(tmpdir, ['search', 'the', '--limit', '2'])
    expect(result.results.length).toBeLessThanOrEqual(2)
  }, 15000)
})

describeIf('fresh-clone fallback: grep when kb.db absent', () => {
  tmpdirTest('kb query falls back to grep + labels output', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    // Intentionally NO rebuild -- kb.db does not exist.
    const result = runKb(tmpdir, ['query', '--severity', 'critical'])
    expect(result.fallback).not.toBeNull()
    expect(result.fallback.engine).toBe('grep')
    expect(result.fallback.reason).toMatch(/kb\.db not found/i)
    const ids = result.results.map(r => r.id).sort()
    expect(ids).toEqual(['sig-crit-auth', 'sig-crit-perf'])
  }, 15000)

  tmpdirTest('kb search falls back to grep + labels output', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    const result = runKb(tmpdir, ['search', 'rotation'])
    expect(result.fallback).not.toBeNull()
    expect(result.fallback.engine).toBe('grep')
    // grep is substring-only; porter stemming is unavailable in fallback.
    const ids = result.results.map(r => r.id)
    expect(ids).toContain('sig-crit-auth')
  }, 15000)

  tmpdirTest('kb query fallback obeys --tag filter via frontmatter parse', async ({ tmpdir }) => {
    seedCorpus(createKbDir(tmpdir))
    const result = runKb(tmpdir, ['query', '--tag', 'auth'])
    expect(result.fallback.engine).toBe('grep')
    const ids = result.results.map(r => r.id).sort()
    expect(ids).toEqual(['sig-crit-auth', 'sig-note-auth'])
  }, 15000)

  tmpdirTest('kb query with empty signals directory returns empty + fallback note', async ({ tmpdir }) => {
    // Create the local knowledge dir (so getKbDir resolves to tmpdir's
    // .planning/knowledge, not the global ~/.gsd fallback) but do NOT seed
    // any signals and do NOT rebuild -- kb.db is absent.
    createKbDir(tmpdir)
    const result = runKb(tmpdir, ['query'])
    expect(result.fallback).not.toBeNull()
    expect(result.fallback.engine).toBe('grep')
    expect(result.results).toEqual([])
  }, 15000)
})

describeIf('router smoke: kb query / kb search appear in usage', () => {
  tmpdirTest('unknown kb subcommand error string mentions query and search', async ({ tmpdir }) => {
    const { stderr, code } = runKbCapture(tmpdir, ['nonexistent'])
    expect(code).not.toBe(0)
    expect(stderr).toMatch(/query/)
    expect(stderr).toMatch(/search/)
  }, 15000)
})
