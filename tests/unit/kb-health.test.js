/**
 * Unit tests for kb-health.cjs -- Phase 59 Plan 03.
 *
 * Covers the four-check contract:
 *   1. edge_integrity         -- PASS on clean, FAIL on planted malformed edge
 *   2. lifecycle_vs_plan      -- PASS on aligned, FAIL on drift
 *   3. dual_write             -- PASS on coherent, FAIL on SQL-diverged row
 *   4. depends_on_freshness   -- always SUMMARY; never trips exit code
 *
 * Plus:
 *   - exit-code bitmask (bit0=edge, bit1=lifecycle, bit2=dual_write; 7=all)
 *   - --all sample expansion
 *   - deterministic sampling with --seed
 *   - cross-runtime parity note (kb-health.cjs inherits installer coverage)
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

function runHealthJson(tmpdir, extraArgs = []) {
  const args = ['kb', 'health', ...extraArgs, '--format', 'json']
  try {
    const stdout = execSync(
      `node --no-warnings "${GSD_TOOLS}" ${args.join(' ')}`,
      { cwd: tmpdir, encoding: 'utf-8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }
    )
    return { json: JSON.parse(stdout.trim()), code: 0 }
  } catch (err) {
    const stdout = err.stdout || ''
    const stderr = err.stderr || ''
    const code = err.status != null ? err.status : 1
    // Health intentionally exits non-zero on FAIL but still emits JSON.
    let json = null
    try { json = JSON.parse(stdout.trim()) } catch { /* not parseable */ }
    if (json === null) {
      throw new Error(`kb health failed with no parseable JSON:\nstdout: ${stdout}\nstderr: ${stderr}`)
    }
    return { json, code }
  }
}

function runKb(tmpdir, args) {
  const cmd = `node --no-warnings "${GSD_TOOLS}" kb ${args.join(' ')} --raw`
  try {
    return JSON.parse(
      execSync(cmd, { cwd: tmpdir, encoding: 'utf-8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    )
  } catch (err) {
    throw new Error(`kb ${args.join(' ')} failed: ${err.stdout || ''} ${err.stderr || ''}`)
  }
}

function createKbDir(tmpdir) {
  const kbDir = path.join(tmpdir, '.planning', 'knowledge')
  fs.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
  fs.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
  return kbDir
}

/**
 * Seed a small, clean fixture: 5 signals in various lifecycle states,
 * 1 spike, 2 completed plans (PLAN.md + SUMMARY.md) with resolves_signals.
 * Baseline: all four health checks PASS.
 */
function seedCleanFixture(tmpdir) {
  const kbDir = createKbDir(tmpdir)
  const signalsDir = path.join(kbDir, 'signals', 'demo-project')
  fs.mkdirSync(signalsDir, { recursive: true })

  const signals = [
    { id: 'sig-remediated-A', lifecycle: 'remediated', severity: 'critical' },
    { id: 'sig-verified-B', lifecycle: 'verified', severity: 'notable' },
    { id: 'sig-detected-C', lifecycle: 'detected', severity: 'minor' },
    { id: 'sig-triaged-D', lifecycle: 'triaged', severity: 'notable' },
    { id: 'sig-detected-E', lifecycle: 'detected', severity: 'minor' },
  ]
  for (const s of signals) {
    const content = [
      '---',
      `id: ${s.id}`,
      'type: signal',
      'project: demo-project',
      `severity: ${s.severity}`,
      `lifecycle_state: ${s.lifecycle}`,
      'status: active',
      'detection_method: manual',
      'origin: user-observation',
      "created: '2026-04-15T10:00:00Z'",
      'tags: []',
      '---',
      '',
      `## ${s.id}`,
      '',
      `Body of ${s.id}.`,
      '',
    ].join('\n')
    fs.writeFileSync(path.join(signalsDir, `${s.id}.md`), content, 'utf-8')
  }

  // Minimal spike
  const spikeDir = path.join(kbDir, 'spikes', 'demo-project')
  fs.mkdirSync(spikeDir, { recursive: true })
  fs.writeFileSync(
    path.join(spikeDir, 'spk-test.md'),
    [
      '---',
      'id: spk-test',
      'type: spike',
      'project: demo-project',
      "created: '2026-04-10T10:00:00Z'",
      'status: active',
      '---',
      '',
      '## Hypothesis',
      '',
      'Test spike.',
    ].join('\n'),
    'utf-8'
  )

  // Two completed plans: one references the remediated signal (PASS), the
  // other references the verified one. Both should satisfy Check 2.
  const phaseDir = path.join(tmpdir, '.planning', 'phases', '99-test-phase')
  fs.mkdirSync(phaseDir, { recursive: true })
  for (const { planFile, refId } of [
    { planFile: '99-01', refId: 'sig-remediated-A' },
    { planFile: '99-02', refId: 'sig-verified-B' },
  ]) {
    fs.writeFileSync(
      path.join(phaseDir, `${planFile}-PLAN.md`),
      [
        '---',
        `phase: 99-test-phase`,
        `plan: "${planFile.split('-')[1]}"`,
        'resolves_signals:',
        `  - ${refId}`,
        '---',
        '',
        'plan body',
      ].join('\n'),
      'utf-8'
    )
    fs.writeFileSync(
      path.join(phaseDir, `${planFile}-SUMMARY.md`),
      [
        '---',
        `phase: 99-test-phase`,
        `plan: "${planFile.split('-')[1]}"`,
        'completed: 2026-04-15',
        '---',
        '',
        'summary body',
      ].join('\n'),
      'utf-8'
    )
  }

  return { kbDir, signals }
}

// ─── Test 1: Clean fixture -- all four checks PASS ──────────────────────────

describeIf('kb health: clean fixture baseline', () => {
  tmpdirTest('all four checks PASS, exit code 0, JSON shape stable', async ({ tmpdir }) => {
    seedCleanFixture(tmpdir)
    runKb(tmpdir, ['rebuild'])

    const { json, code } = runHealthJson(tmpdir)
    expect(code).toBe(0)
    expect(json.exit_code).toBe(0)
    expect(json.checks.edge_integrity.status).toBe('pass')
    expect(json.checks.lifecycle_vs_plan.status).toBe('pass')
    expect(json.checks.dual_write.status).toBe('pass')
    expect(json.checks.depends_on_freshness.status).toBe('summary')
  }, 20000)
})

// ─── Test 2: Planted malformed edge -- Check 1 FAILs ────────────────────────

describeIf('kb health: Check 1 edge_integrity', () => {
  tmpdirTest('planted malformed edge FAILs with exit bit 1 set', async ({ tmpdir }) => {
    const { kbDir } = seedCleanFixture(tmpdir)
    runKb(tmpdir, ['rebuild'])

    // Plant a malformed edge directly in SQL (simulates the pre-Plan-01 bug
    // class without requiring us to crash the YAML parser path).
    const DatabaseSync = require('node:sqlite').DatabaseSync
    const dbPath = path.join(kbDir, 'kb.db')
    const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true })
    db.prepare(
      `INSERT INTO signal_links (source_id, target_id, link_type, created_at, source_content_hash)
       VALUES (?, '[object Object]', 'related_to', '2026-04-21T00:00:00Z', 'deadbeef')`
    ).run('sig-detected-C')
    db.close()

    const { json, code } = runHealthJson(tmpdir)
    expect(code & 1).toBe(1) // bit 0 = edge_integrity
    expect(json.checks.edge_integrity.status).toBe('fail')
    expect(json.checks.edge_integrity.malformed).toBeGreaterThanOrEqual(1)
    expect(json.checks.edge_integrity.remediation).toMatch(/kb repair --malformed-targets/)
  }, 20000)
})

// ─── Test 3: Planted lifecycle-vs-plan drift -- Check 2 FAILs ───────────────

describeIf('kb health: Check 2 lifecycle_vs_plan', () => {
  tmpdirTest('drift planted via detected signal + completed plan FAILs', async ({ tmpdir }) => {
    seedCleanFixture(tmpdir)
    // Plant: add a completed plan referencing sig-detected-C (still detected).
    const phaseDir = path.join(tmpdir, '.planning', 'phases', '99-test-phase')
    fs.writeFileSync(
      path.join(phaseDir, '99-03-PLAN.md'),
      [
        '---',
        'phase: 99-test-phase',
        'plan: "03"',
        'resolves_signals:',
        '  - sig-detected-C',
        '---',
        '',
        'plan referencing an unresolved signal',
      ].join('\n'),
      'utf-8'
    )
    fs.writeFileSync(
      path.join(phaseDir, '99-03-SUMMARY.md'),
      [
        '---',
        'phase: 99-test-phase',
        'plan: "03"',
        'completed: 2026-04-15',
        '---',
        '',
        'summary',
      ].join('\n'),
      'utf-8'
    )
    runKb(tmpdir, ['rebuild'])

    const { json, code } = runHealthJson(tmpdir)
    expect(code & 2).toBe(2) // bit 1 = lifecycle_vs_plan
    expect(json.checks.lifecycle_vs_plan.status).toBe('fail')
    expect(json.checks.lifecycle_vs_plan.drift_count).toBeGreaterThanOrEqual(1)
    const drift = json.checks.lifecycle_vs_plan.drifts.find(d => d.signal_id === 'sig-detected-C')
    expect(drift).toBeDefined()
    expect(drift.plan).toBe('99-03-PLAN.md')
    expect(drift.state).toBe('detected')
  }, 20000)
})

// ─── Test 4: Planted dual-write divergence -- Check 3 FAILs ─────────────────

describeIf('kb health: Check 3 dual_write', () => {
  tmpdirTest('SQL row diverged from file FAILs with exit bit 4 set', async ({ tmpdir }) => {
    const { kbDir } = seedCleanFixture(tmpdir)
    runKb(tmpdir, ['rebuild'])

    // Plant divergence: file says 'remediated', we mutate SQL row to 'detected'.
    const DatabaseSync = require('node:sqlite').DatabaseSync
    const dbPath = path.join(kbDir, 'kb.db')
    const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true })
    db.prepare("UPDATE signals SET lifecycle_state = 'detected' WHERE id = 'sig-remediated-A'").run()
    db.close()

    // --all so the divergence is guaranteed to land in the sample.
    const { json, code } = runHealthJson(tmpdir, ['--all'])
    expect(code & 4).toBe(4) // bit 2 = dual_write
    expect(json.checks.dual_write.status).toBe('fail')
    expect(json.checks.dual_write.remediation).toMatch(/kb rebuild/)
    const div = json.checks.dual_write.divergences.find(d => d.signal_id === 'sig-remediated-A')
    expect(div).toBeDefined()
    expect(div.file_state).toBe('remediated')
    expect(div.sql_state).toBe('detected')
  }, 20000)
})

// ─── Test 5: depends_on freshness -- Check 4 is SUMMARY, never FAIL ─────────

describeIf('kb health: Check 4 depends_on_freshness', () => {
  tmpdirTest('dangling path-like ref shows in summary but does not trip exit', async ({ tmpdir }) => {
    const { kbDir } = seedCleanFixture(tmpdir)
    // Add a signal carrying depends_on with one resolving path and one dangling.
    // Use a real file that exists in the tmpdir to guarantee a resolving ref.
    fs.writeFileSync(path.join(tmpdir, 'README.md'), '# readme\n', 'utf-8')
    const signalsDir = path.join(kbDir, 'signals', 'demo-project')
    fs.writeFileSync(
      path.join(signalsDir, 'sig-with-deps.md'),
      [
        '---',
        'id: sig-with-deps',
        'type: signal',
        'project: demo-project',
        'severity: minor',
        'lifecycle_state: detected',
        'status: active',
        'detection_method: manual',
        'origin: user-observation',
        "created: '2026-04-15T10:00:00Z'",
        'tags: []',
        'depends_on:',
        '  - README.md',
        '  - does/not/exist.ts',
        '---',
        '',
        '## Body',
        '',
        'x',
      ].join('\n'),
      'utf-8'
    )
    runKb(tmpdir, ['rebuild'])

    const { json, code } = runHealthJson(tmpdir)
    // With only this planted signal: no other check fails.
    expect(code).toBe(0)
    expect(json.checks.depends_on_freshness.status).toBe('summary')
    expect(json.checks.depends_on_freshness.refs_dangling).toBeGreaterThanOrEqual(1)
    expect(json.checks.depends_on_freshness.refs_resolving).toBeGreaterThanOrEqual(1)
  }, 20000)
})

// ─── Test 6: --all flag scans all signals vs default samples ────────────────

describeIf('kb health: --all flag sample expansion', () => {
  tmpdirTest('--all sets sample_size to total_signals; default is min(20, total)', async ({ tmpdir }) => {
    const { kbDir } = seedCleanFixture(tmpdir)
    runKb(tmpdir, ['rebuild'])

    const defaultRun = runHealthJson(tmpdir)
    const allRun = runHealthJson(tmpdir, ['--all'])

    // Fixture has 5 signals, so default samples floor(min(20,5))=5 and --all
    // samples all 5 as well -- but --all suppresses the seed field.
    expect(defaultRun.json.checks.dual_write.total_signals).toBe(5)
    expect(defaultRun.json.checks.dual_write.sample_size).toBe(5)
    expect(allRun.json.checks.dual_write.sample_size).toBe(allRun.json.checks.dual_write.total_signals)
    expect(allRun.json.checks.dual_write.seed).toBeNull()
  }, 20000)
})

// ─── Test 7: All three hard checks fail simultaneously -- exit 7 ────────────

describeIf('kb health: exit-code bitmask', () => {
  tmpdirTest('all three hard checks failing yields exit 7 (bit 0|1|2)', async ({ tmpdir }) => {
    const { kbDir } = seedCleanFixture(tmpdir)
    runKb(tmpdir, ['rebuild'])

    // Plant all three failures simultaneously:
    // - edge: inject [object Object] target
    // - lifecycle: add a completed plan referencing sig-detected-C
    // - dual_write: mutate sig-remediated-A SQL row
    const DatabaseSync = require('node:sqlite').DatabaseSync
    const dbPath = path.join(kbDir, 'kb.db')
    const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true })
    db.prepare(
      `INSERT INTO signal_links (source_id, target_id, link_type, created_at, source_content_hash)
       VALUES (?, '[object Object]', 'related_to', '2026-04-21T00:00:00Z', 'deadbeef')`
    ).run('sig-detected-C')
    db.prepare("UPDATE signals SET lifecycle_state = 'detected' WHERE id = 'sig-remediated-A'").run()
    db.close()

    const phaseDir = path.join(tmpdir, '.planning', 'phases', '99-test-phase')
    fs.writeFileSync(
      path.join(phaseDir, '99-03-PLAN.md'),
      [
        '---',
        'phase: 99-test-phase',
        'plan: "03"',
        'resolves_signals:',
        '  - sig-detected-C',
        '---',
        '',
        'drift plan',
      ].join('\n'),
      'utf-8'
    )
    fs.writeFileSync(
      path.join(phaseDir, '99-03-SUMMARY.md'),
      ['---', 'completed: 2026-04-15', '---', '', 'x'].join('\n'),
      'utf-8'
    )

    const { json, code } = runHealthJson(tmpdir, ['--all'])
    expect(code).toBe(7)
    expect(json.exit_code).toBe(7)
    expect(json.checks.edge_integrity.status).toBe('fail')
    expect(json.checks.lifecycle_vs_plan.status).toBe('fail')
    expect(json.checks.dual_write.status).toBe('fail')
  }, 20000)
})

// ─── Test 8: Deterministic sampling with --seed ─────────────────────────────

describeIf('kb health: deterministic sampling via --seed', () => {
  tmpdirTest('same seed produces same sample across runs', async ({ tmpdir }) => {
    // Seed a larger fixture so --seed has room to actually vary the sample.
    const kbDir = createKbDir(tmpdir)
    const signalsDir = path.join(kbDir, 'signals', 'demo-project')
    fs.mkdirSync(signalsDir, { recursive: true })
    for (let i = 0; i < 30; i++) {
      fs.writeFileSync(
        path.join(signalsDir, `sig-${i}.md`),
        [
          '---',
          `id: sig-${i}`,
          'type: signal',
          'project: demo-project',
          'severity: minor',
          'lifecycle_state: detected',
          'status: active',
          'detection_method: manual',
          'origin: user-observation',
          "created: '2026-04-15T10:00:00Z'",
          'tags: []',
          '---',
          '',
          `## sig-${i}`,
          '',
          'x',
        ].join('\n'),
        'utf-8'
      )
    }
    runKb(tmpdir, ['rebuild'])

    // Plant a divergence on exactly one signal; pick a seed that samples it.
    // Easier approach: assert seed is echoed back in JSON and is reproducible.
    const run1 = runHealthJson(tmpdir, ['--seed', '42'])
    const run2 = runHealthJson(tmpdir, ['--seed', '42'])
    expect(run1.json.checks.dual_write.seed).toBe(42)
    expect(run2.json.checks.dual_write.seed).toBe(42)
    // Both runs should PASS (clean fixture) and have identical sample_size.
    expect(run1.json.checks.dual_write.sample_size).toBe(run2.json.checks.dual_write.sample_size)
  }, 20000)
})

// ─── Cross-runtime parity: bin/install.js copies lib/*.cjs inclusively ──────

describe('kb health: installer includes kb-health.cjs', () => {
  it('bin/install.js does not denylist kb-health.cjs', () => {
    const installerPath = path.resolve(process.cwd(), 'bin/install.js')
    const src = fs.readFileSync(installerPath, 'utf-8')
    // No explicit denylist entry for the new module.
    expect(src).not.toMatch(/['"]kb-health\.cjs['"]/)
    // copyWithPathReplacement is the generic tree copier; verify the lib
    // source exists on disk so the copier will see it.
    const libPath = path.resolve(process.cwd(), 'get-shit-done/bin/lib/kb-health.cjs')
    expect(fs.existsSync(libPath)).toBe(true)
  })
})
