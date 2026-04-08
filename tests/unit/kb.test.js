/**
 * Unit tests for kb.cjs -- Knowledge base SQLite index operations
 *
 * Tests: schema generations, source field migration mapping, rebuild correctness,
 * stats output, migrate behavior, dual-write invariant, tags/links, status normalization.
 *
 * Requires Node >=22.5.0 (node:sqlite). This machine: v22.22.1.
 */

import { describe, it, expect, beforeAll } from 'vitest'

// Skip entire file on Node < 22.5.0 (node:sqlite not available)
const [major, minor] = process.versions.node.split('.').map(Number)
const hasNodeSqlite = major > 22 || (major === 22 && minor >= 5)
const describeIf = hasNodeSqlite ? describe : describe.skip
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Run a kb CLI command against a tmpdir. Returns parsed JSON (--raw).
 * Suppresses ExperimentalWarning from node:sqlite (Pitfall 3).
 */
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
    // execSync throws if exit code != 0; include stdout+stderr for debugging
    const stdout = err.stdout || ''
    const stderr = err.stderr || ''
    throw new Error(`kb ${subcommand} failed:\nstdout: ${stdout}\nstderr: ${stderr}`)
  }
}

/**
 * Create a .planning/knowledge/signals/{project}/ signal file with given frontmatter fields.
 * Returns absolute path to created file.
 */
function writeSignalFixture(kbDir, project, filename, frontmatterFields) {
  const lines = []
  for (const [k, v] of Object.entries(frontmatterFields)) {
    if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${k}: []`)
      } else {
        lines.push(`${k}:`)
        for (const item of v) {
          lines.push(`  - ${item}`)
        }
      }
    } else {
      lines.push(`${k}: ${v}`)
    }
  }

  let dir
  if (project) {
    dir = path.join(kbDir, 'signals', project)
  } else {
    dir = path.join(kbDir, 'signals')
  }
  fs.mkdirSync(dir, { recursive: true })

  const content = `---\n${lines.join('\n')}\n---\n\n## What Happened\n\nTest signal: ${filename}\n`
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

/**
 * Create a .planning/knowledge/spikes/{project}/ spike file.
 */
function writeSpikeFixture(kbDir, project, filename, frontmatterFields) {
  const lines = []
  for (const [k, v] of Object.entries(frontmatterFields)) {
    lines.push(`${k}: ${v}`)
  }
  const dir = path.join(kbDir, 'spikes', project)
  fs.mkdirSync(dir, { recursive: true })
  const content = `---\n${lines.join('\n')}\n---\n\n## Hypothesis\n\nTest spike.\n`
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

/**
 * Open the kb.db SQLite file directly for assertions. Returns DatabaseSync instance.
 */
function openDb(tmpdir) {
  const { DatabaseSync } = require('node:sqlite')
  const dbPath = path.join(tmpdir, '.planning', 'knowledge', 'kb.db')
  return new DatabaseSync(dbPath)
}

/**
 * Create the .planning/knowledge directory structure in tmpdir.
 */
function createKbDir(tmpdir) {
  const kbDir = path.join(tmpdir, '.planning', 'knowledge')
  fs.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
  fs.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
  return kbDir
}

// ─── 1. Schema generation handling ───────────────────────────────────────────

describeIf('schema generation handling', () => {
  tmpdirTest(
    'legacy SIG-format (observation type, no lifecycle_state) defaults correctly',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      writeSignalFixture(kbDir, null, 'sig-legacy-obs.md', {
        id: 'sig-legacy-obs',
        type: 'observation',
        status: 'open',
        severity: 'high',
        date: '2026-01-15',
        tags: [],
      })

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)
      expect(result.signals).toBe(1)

      const db = openDb(tmpdir)
      const row = db.prepare('SELECT * FROM signals WHERE id = ?').get('sig-legacy-obs')
      expect(row).toBeTruthy()
      // status: open -> normalized to active
      expect(row.status).toBe('active')
      // No lifecycle_state -> defaults to detected (via normalizeLifecycleFromStatus('open'))
      expect(row.lifecycle_state).toBe('detected')
      // No polarity -> defaults to negative
      expect(row.polarity).toBe('negative')
      // Severity: high -> mapped to critical
      expect(row.severity).toBe('critical')
    },
    10000
  )

  tmpdirTest(
    'early standard signal (type: signal, source already migrated to detection_method) parses correctly',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      writeSignalFixture(kbDir, 'test-project', 'sig-early.md', {
        id: 'sig-early-standard',
        type: 'signal',
        project: 'test-project',
        detection_method: 'manual',
        origin: 'user-observation',
        severity: 'notable',
        status: 'active',
        created: '2026-02-01T00:00:00Z',
        tags: [],
      })

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)

      const db = openDb(tmpdir)
      const row = db.prepare('SELECT * FROM signals WHERE id = ?').get('sig-early-standard')
      expect(row).toBeTruthy()
      expect(row.detection_method).toBe('manual')
      expect(row.origin).toBe('user-observation')
      // No lifecycle_state -> defaults to detected
      expect(row.lifecycle_state).toBe('detected')
    },
    10000
  )

  tmpdirTest(
    'Phase 31 enriched signal (lifecycle_state, evidence, signal_category) preserves all fields',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      writeSignalFixture(kbDir, 'test-project', 'sig-phase31.md', {
        id: 'sig-phase31-enriched',
        type: 'signal',
        project: 'test-project',
        detection_method: 'automated',
        origin: 'collect-signals',
        severity: 'notable',
        status: 'active',
        polarity: 'negative',
        signal_category: 'negative',
        lifecycle_state: 'triaged',
        confidence: 'high',
        occurrence_count: 3,
        created: '2026-03-01T00:00:00Z',
        updated: '2026-03-15T00:00:00Z',
        tags: [],
      })

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)

      const db = openDb(tmpdir)
      const row = db.prepare('SELECT * FROM signals WHERE id = ?').get('sig-phase31-enriched')
      expect(row).toBeTruthy()
      // Lifecycle state preserved as-is
      expect(row.lifecycle_state).toBe('triaged')
      // Signal category preserved
      expect(row.signal_category).toBe('negative')
      // Confidence preserved
      expect(row.confidence).toBe('high')
      // Occurrence count preserved
      expect(row.occurrence_count).toBe(3)
    },
    10000
  )

  tmpdirTest(
    'latest signal with response_disposition populates disposition field',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      writeSignalFixture(kbDir, 'test-project', 'sig-latest.md', {
        id: 'sig-latest-with-disposition',
        type: 'capability-gap',
        project: 'test-project',
        severity: 'notable',
        status: 'active',
        polarity: 'negative',
        response_disposition: 'formalize',
        detection_method: 'manual',
        origin: 'user-observation',
        created: '2026-04-08T00:00:00Z',
        tags: [],
      })

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)

      const db = openDb(tmpdir)
      const row = db.prepare('SELECT * FROM signals WHERE id = ?').get('sig-latest-with-disposition')
      expect(row).toBeTruthy()
      expect(row.disposition).toBe('formalize')
    },
    10000
  )
})

// ─── 2. Source field migration mapping ───────────────────────────────────────

describeIf('source field migration mapping (cmdKbMigrate)', () => {
  // Helper: write a signal with source field and run migrate
  function testSourceMigration(tmpdir, sourceValue) {
    const kbDir = createKbDir(tmpdir)
    const fields = {
      id: 'sig-test-source',
      type: 'signal',
      severity: 'minor',
      status: 'active',
      created: '2026-01-01',
      tags: [],
    }
    if (sourceValue !== undefined) {
      fields.source = sourceValue
    }
    writeSignalFixture(kbDir, 'test', 'sig-source.md', fields)

    const result = runKb(tmpdir, 'migrate')
    if (sourceValue !== undefined) {
      expect(result.files_modified).toBe(1)
    } else {
      expect(result.files_modified).toBe(0)
    }

    // Read the file back and check fields
    const filePath = path.join(kbDir, 'signals', 'test', 'sig-source.md')
    const content = fs.readFileSync(filePath, 'utf-8')
    return content
  }

  tmpdirTest('source: auto -> detection_method: automated, origin: collect-signals', async ({ tmpdir }) => {
    const content = testSourceMigration(tmpdir, 'auto')
    expect(content).toContain('detection_method: automated')
    expect(content).toContain('origin: collect-signals')
    expect(content).not.toMatch(/^source:/m)
  })

  tmpdirTest('source: manual -> detection_method: manual, origin: user-observation', async ({ tmpdir }) => {
    const content = testSourceMigration(tmpdir, 'manual')
    expect(content).toContain('detection_method: manual')
    expect(content).toContain('origin: user-observation')
    expect(content).not.toMatch(/^source:/m)
  })

  tmpdirTest('source: automated -> detection_method: automated, origin: collect-signals', async ({ tmpdir }) => {
    const content = testSourceMigration(tmpdir, 'automated')
    expect(content).toContain('detection_method: automated')
    expect(content).toContain('origin: collect-signals')
    expect(content).not.toMatch(/^source:/m)
  })

  tmpdirTest('source: deliberation-trigger -> detection_method: manual, origin: deliberation-trigger', async ({ tmpdir }) => {
    const content = testSourceMigration(tmpdir, 'deliberation-trigger')
    expect(content).toContain('detection_method: manual')
    expect(content).toContain('origin: deliberation-trigger')
    expect(content).not.toMatch(/^source:/m)
  })

  tmpdirTest('source: auto-collected -> detection_method: automated, origin: collect-signals', async ({ tmpdir }) => {
    const content = testSourceMigration(tmpdir, 'auto-collected')
    expect(content).toContain('detection_method: automated')
    expect(content).toContain('origin: collect-signals')
    expect(content).not.toMatch(/^source:/m)
  })

  tmpdirTest('source: plan summary reference -> detection_method: automated, origin: plan-summary', async ({ tmpdir }) => {
    const content = testSourceMigration(tmpdir, '55-01-SUMMARY.md')
    expect(content).toContain('detection_method: automated')
    expect(content).toContain('origin: plan-summary')
    expect(content).not.toMatch(/^source:/m)
  })

  tmpdirTest('source absent -> no modification (skipped)', async ({ tmpdir }) => {
    const kbDir = createKbDir(tmpdir)
    writeSignalFixture(kbDir, 'test', 'sig-no-source.md', {
      id: 'sig-no-source',
      type: 'signal',
      severity: 'minor',
      status: 'active',
      detection_method: 'unknown',
      origin: 'unknown',
      created: '2026-01-01',
      tags: [],
    })

    const result = runKb(tmpdir, 'migrate')
    // File has no source field, already has detection_method -> skipped
    expect(result.files_modified).toBe(0)
    expect(result.files_skipped).toBe(1)
    expect(result.errors).toBe(0)
  })
})

// ─── 3. Rebuild correctness ───────────────────────────────────────────────────

describeIf('rebuild correctness', () => {
  tmpdirTest(
    'empty corpus: rebuild on empty signals dir produces 0 entries, no errors',
    async ({ tmpdir }) => {
      createKbDir(tmpdir)

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)
      expect(result.signals).toBe(0)
      expect(result.spikes).toBe(0)
      expect(result.added).toBe(0)
    },
    10000
  )

  tmpdirTest(
    'mixed corpus: 5 signals across 2 projects + 1 root-level signal + 1 spike -> correct counts',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)

      // 3 signals in project-alpha
      for (let i = 1; i <= 3; i++) {
        writeSignalFixture(kbDir, 'project-alpha', `sig-alpha-${i}.md`, {
          id: `sig-alpha-${i}`,
          type: 'signal',
          project: 'project-alpha',
          severity: 'minor',
          status: 'active',
          detection_method: 'manual',
          origin: 'user-observation',
          created: '2026-01-01',
          tags: [],
        })
      }

      // 2 signals in project-beta
      for (let i = 1; i <= 2; i++) {
        writeSignalFixture(kbDir, 'project-beta', `sig-beta-${i}.md`, {
          id: `sig-beta-${i}`,
          type: 'signal',
          project: 'project-beta',
          severity: 'notable',
          status: 'active',
          detection_method: 'automated',
          origin: 'collect-signals',
          created: '2026-01-01',
          tags: [],
        })
      }

      // 1 root-level signal (no project subdir)
      writeSignalFixture(kbDir, null, 'sig-root-level.md', {
        id: 'sig-root-level',
        type: 'signal',
        severity: 'critical',
        status: 'active',
        detection_method: 'manual',
        origin: 'user-observation',
        created: '2026-01-01',
        tags: [],
      })

      // 1 spike
      writeSpikeFixture(kbDir, 'project-alpha', 'spk-001.md', {
        id: 'spk-001',
        type: 'spike',
        project: 'project-alpha',
        status: 'active',
        hypothesis: 'Test hypothesis',
        outcome: 'confirmed',
        created: '2026-01-01',
      })

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)
      expect(result.signals).toBe(6) // 3 + 2 + 1 root
      expect(result.spikes).toBe(1)
      expect(result.added).toBe(7) // 6 signals + 1 spike
    },
    10000
  )

  tmpdirTest(
    'incremental rebuild: unchanged files are skipped, modified file is updated',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)

      writeSignalFixture(kbDir, 'test', 'sig-a.md', {
        id: 'sig-a',
        type: 'signal',
        project: 'test',
        severity: 'minor',
        status: 'active',
        detection_method: 'manual',
        origin: 'user-observation',
        created: '2026-01-01',
        tags: [],
      })
      writeSignalFixture(kbDir, 'test', 'sig-b.md', {
        id: 'sig-b',
        type: 'signal',
        project: 'test',
        severity: 'notable',
        status: 'active',
        detection_method: 'automated',
        origin: 'collect-signals',
        created: '2026-01-01',
        tags: [],
      })

      // First rebuild: 2 added
      const firstResult = runKb(tmpdir, 'rebuild')
      expect(firstResult.added).toBe(2)
      expect(firstResult.skipped).toBe(0)

      // Modify sig-b only
      const sigBPath = path.join(kbDir, 'signals', 'test', 'sig-b.md')
      const existing = fs.readFileSync(sigBPath, 'utf-8')
      fs.writeFileSync(sigBPath, existing + '\n<!-- modified -->', 'utf-8')

      // Second rebuild: 1 skipped (sig-a), 1 updated (sig-b)
      const secondResult = runKb(tmpdir, 'rebuild')
      expect(secondResult.skipped).toBe(1)
      expect(secondResult.updated).toBe(1)
      expect(secondResult.added).toBe(0)
      expect(secondResult.errors).toBe(0)
    },
    10000
  )
})

// ─── 4. Stats output ──────────────────────────────────────────────────────────

describeIf('stats output', () => {
  tmpdirTest(
    'stats on populated corpus returns counts by severity, lifecycle, polarity, project',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)

      writeSignalFixture(kbDir, 'proj-a', 'sig-critical.md', {
        id: 'sig-critical',
        type: 'signal',
        project: 'proj-a',
        severity: 'critical',
        polarity: 'negative',
        signal_category: 'negative',
        lifecycle_state: 'triaged',
        status: 'active',
        detection_method: 'manual',
        origin: 'user-observation',
        created: '2026-01-01',
        tags: [],
      })
      writeSignalFixture(kbDir, 'proj-b', 'sig-minor.md', {
        id: 'sig-minor',
        type: 'signal',
        project: 'proj-b',
        severity: 'minor',
        polarity: 'positive',
        signal_category: 'positive',
        lifecycle_state: 'detected',
        status: 'active',
        detection_method: 'automated',
        origin: 'collect-signals',
        created: '2026-01-01',
        tags: [],
      })

      runKb(tmpdir, 'rebuild')
      const stats = runKb(tmpdir, 'stats')

      expect(stats.total_signals).toBe(2)
      expect(stats.total_spikes).toBe(0)

      // by_severity
      const severityMap = Object.fromEntries(stats.by_severity.map(r => [r.severity, r.n]))
      expect(severityMap.critical).toBe(1)
      expect(severityMap.minor).toBe(1)

      // by_lifecycle_state
      const lifecycleMap = Object.fromEntries(stats.by_lifecycle_state.map(r => [r.lifecycle_state, r.n]))
      expect(lifecycleMap.triaged).toBe(1)
      expect(lifecycleMap.detected).toBe(1)

      // by_polarity
      const polarityMap = Object.fromEntries(stats.by_polarity.map(r => [r.polarity, r.n]))
      expect(polarityMap.negative).toBe(1)
      expect(polarityMap.positive).toBe(1)

      // by_project
      const projectMap = Object.fromEntries(stats.by_project.map(r => [r.project, r.n]))
      expect(projectMap['proj-a']).toBe(1)
      expect(projectMap['proj-b']).toBe(1)
    },
    10000
  )

  tmpdirTest(
    'stats on missing db returns error message, not crash',
    async ({ tmpdir }) => {
      // No kb.db created, no rebuild run
      // Create kbDir so gsd-tools can resolve it
      createKbDir(tmpdir)

      const stats = runKb(tmpdir, 'stats')
      expect(stats).toHaveProperty('error')
      expect(stats.error).toContain('No KB index found')
    },
    10000
  )
})

// ─── 5. Migrate behavior ──────────────────────────────────────────────────────

describeIf('migrate behavior', () => {
  tmpdirTest(
    'file with source: auto -> adds detection_method + origin, removes source',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      const filePath = writeSignalFixture(kbDir, 'test', 'sig-migrate-me.md', {
        id: 'sig-migrate-me',
        type: 'signal',
        severity: 'minor',
        status: 'active',
        source: 'auto',
        created: '2026-01-01',
        tags: [],
      })

      const result = runKb(tmpdir, 'migrate')
      expect(result.files_modified).toBe(1)
      expect(result.files_skipped).toBe(0)
      expect(result.errors).toBe(0)

      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toContain('detection_method: automated')
      expect(content).toContain('origin: collect-signals')
      expect(content).not.toMatch(/^source:/m)
    }
  )

  tmpdirTest(
    'file without source field -> skipped, not modified',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      const filePath = writeSignalFixture(kbDir, 'test', 'sig-no-source.md', {
        id: 'sig-no-source',
        type: 'signal',
        severity: 'minor',
        status: 'active',
        created: '2026-01-01',
        tags: [],
      })

      const originalContent = fs.readFileSync(filePath, 'utf-8')
      const result = runKb(tmpdir, 'migrate')
      const afterContent = fs.readFileSync(filePath, 'utf-8')

      expect(result.files_modified).toBe(0)
      expect(result.files_skipped).toBe(1)
      expect(afterContent).toBe(originalContent)
    }
  )

  tmpdirTest(
    'file already migrated (has detection_method) -> skipped, not modified',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      const filePath = writeSignalFixture(kbDir, 'test', 'sig-already-migrated.md', {
        id: 'sig-already-migrated',
        type: 'signal',
        severity: 'minor',
        status: 'active',
        source: 'manual',
        detection_method: 'manual',
        origin: 'user-observation',
        created: '2026-01-01',
        tags: [],
      })

      const originalContent = fs.readFileSync(filePath, 'utf-8')
      const result = runKb(tmpdir, 'migrate')
      const afterContent = fs.readFileSync(filePath, 'utf-8')

      // Already has detection_method + origin -> skipped (alreadyMigrated flag)
      expect(result.files_modified).toBe(0)
      expect(result.files_skipped).toBe(1)
      expect(afterContent).toBe(originalContent)
    }
  )
})

// ─── 6. Dual-write invariant (KB-05) ─────────────────────────────────────────

describeIf('dual-write invariant', () => {
  tmpdirTest(
    'delete kb.db and rebuild -> identical counts (SQLite is derived cache)',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)

      // Create 4 signals
      for (let i = 1; i <= 4; i++) {
        writeSignalFixture(kbDir, 'test', `sig-${i}.md`, {
          id: `sig-inv-${i}`,
          type: 'signal',
          project: 'test',
          severity: 'minor',
          status: 'active',
          detection_method: 'manual',
          origin: 'user-observation',
          created: '2026-01-01',
          tags: [],
        })
      }

      // Initial rebuild
      const firstResult = runKb(tmpdir, 'rebuild')
      expect(firstResult.signals).toBe(4)
      expect(firstResult.errors).toBe(0)

      // Get initial stats
      const firstStats = runKb(tmpdir, 'stats')
      expect(firstStats.total_signals).toBe(4)

      // Delete kb.db
      const dbPath = path.join(kbDir, 'kb.db')
      fs.unlinkSync(dbPath)
      expect(fs.existsSync(dbPath)).toBe(false)

      // Rebuild again
      const secondResult = runKb(tmpdir, 'rebuild')
      expect(secondResult.signals).toBe(4)
      expect(secondResult.errors).toBe(0)

      // Stats should be identical
      const secondStats = runKb(tmpdir, 'stats')
      expect(secondStats.total_signals).toBe(firstStats.total_signals)
      expect(secondStats.total_spikes).toBe(firstStats.total_spikes)
    },
    15000
  )
})

// ─── 7. Tags and links ────────────────────────────────────────────────────────

describeIf('tags and links extraction', () => {
  tmpdirTest(
    'signal with tags -> signal_tags table has correct entries',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      // Write tags as YAML list (need to write raw frontmatter for this)
      const kbDirSignals = path.join(kbDir, 'signals', 'test')
      fs.mkdirSync(kbDirSignals, { recursive: true })
      const content = `---
id: sig-with-tags
type: signal
project: test
severity: minor
status: active
detection_method: manual
origin: user-observation
created: '2026-01-01'
tags:
  - tag1
  - tag2
---

## What Happened

Test signal with tags.
`
      fs.writeFileSync(path.join(kbDirSignals, 'sig-with-tags.md'), content, 'utf-8')

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)

      const db = openDb(tmpdir)
      const tags = db.prepare('SELECT tag FROM signal_tags WHERE signal_id = ? ORDER BY tag').all('sig-with-tags')
      expect(tags).toHaveLength(2)
      expect(tags.map(r => r.tag)).toEqual(['tag1', 'tag2'])
    },
    10000
  )

  tmpdirTest(
    'signal with qualified_by and related_signals -> signal_links table has entries with correct link_types',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      const kbDirSignals = path.join(kbDir, 'signals', 'test')
      fs.mkdirSync(kbDirSignals, { recursive: true })
      const content = `---
id: sig-with-links
type: signal
project: test
severity: minor
status: active
detection_method: manual
origin: user-observation
created: '2026-01-01'
tags: []
qualified_by:
  - sig-qualifier-001
related_signals:
  - sig-related-001
---

## What Happened

Test signal with links.
`
      fs.writeFileSync(path.join(kbDirSignals, 'sig-with-links.md'), content, 'utf-8')

      const result = runKb(tmpdir, 'rebuild')
      expect(result.errors).toBe(0)

      const db = openDb(tmpdir)
      const links = db
        .prepare('SELECT target_id, link_type FROM signal_links WHERE source_id = ? ORDER BY link_type')
        .all('sig-with-links')

      expect(links.length).toBeGreaterThanOrEqual(2)

      const linkMap = Object.fromEntries(links.map(l => [l.link_type, l.target_id]))
      expect(linkMap.qualified_by).toBe('sig-qualifier-001')
      expect(linkMap.related_to).toBe('sig-related-001')
    },
    10000
  )
})

// ─── 8. Status normalization (RESEARCH.md Pitfall 4) ─────────────────────────

describeIf('status normalization (Pitfall 4)', () => {
  tmpdirTest(
    'status: resolved -> normalized to status: active, lifecycle_state: remediated',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      writeSignalFixture(kbDir, 'test', 'sig-resolved.md', {
        id: 'sig-status-resolved',
        type: 'signal',
        severity: 'minor',
        status: 'resolved',
        detection_method: 'manual',
        origin: 'user-observation',
        created: '2026-01-01',
        tags: [],
      })

      runKb(tmpdir, 'rebuild')

      const db = openDb(tmpdir)
      const row = db.prepare('SELECT status, lifecycle_state FROM signals WHERE id = ?').get('sig-status-resolved')
      expect(row).toBeTruthy()
      // status: resolved -> active (not excluded from index)
      expect(row.status).toBe('active')
      // lifecycle_state derived from status: resolved -> remediated
      expect(row.lifecycle_state).toBe('remediated')
    },
    10000
  )

  tmpdirTest(
    'status: remediated -> normalized to status: active, lifecycle_state: remediated',
    async ({ tmpdir }) => {
      const kbDir = createKbDir(tmpdir)
      writeSignalFixture(kbDir, 'test', 'sig-remediated.md', {
        id: 'sig-status-remediated',
        type: 'signal',
        severity: 'minor',
        status: 'remediated',
        detection_method: 'manual',
        origin: 'user-observation',
        created: '2026-01-01',
        tags: [],
      })

      runKb(tmpdir, 'rebuild')

      const db = openDb(tmpdir)
      const row = db.prepare('SELECT status, lifecycle_state FROM signals WHERE id = ?').get('sig-status-remediated')
      expect(row).toBeTruthy()
      // status: remediated -> active (signal still indexed, not excluded)
      expect(row.status).toBe('active')
      // lifecycle_state: remediated (derived from status)
      expect(row.lifecycle_state).toBe('remediated')
    },
    10000
  )
})
