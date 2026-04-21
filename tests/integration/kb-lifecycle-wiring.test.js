/**
 * Integration test for Phase 59 Plan 04 lifecycle wiring (KB-07).
 *
 * End-to-end regression for the collect-signals -> kb transition closed loop:
 *   1. A fixture phase directory with one PLAN.md declaring
 *      `resolves_signals: [sig-fixture-A]` plus a matching SUMMARY.md (the
 *      "completed" marker per execute-plan's commit convention).
 *   2. A fixture signal sig-fixture-A.md in `lifecycle_state: triaged`.
 *   3. Mirror the collect-signals reconcile step: extract resolves_signals
 *      via `gsd-tools frontmatter get` and invoke `gsd-tools kb transition`
 *      per referenced signal id.
 *   4. Assert:
 *      (i)  the signal file's frontmatter now has lifecycle_state: remediated
 *      (ii) the SQL signals row matches (dual-write invariant)
 *      (iii) lifecycle_log carries a structured entry referencing the plan
 *      (iv) running the same wiring a second time is idempotent (noop, no
 *           duplicate log entry, no error)
 *      (v)  the alternate path: signal already in remediated -> no-op path
 *           reports noop=true and does not re-log
 *
 * This closes the v1.16 KB-07 wiring gap; the bash script path is deprecated
 * with a Linux guard and is intentionally NOT exercised here (see
 * reconcile-signal-lifecycle.sh header).
 *
 * Requires Node >= 22.5.0 (node:sqlite).
 */

import { describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { execSync, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
import { tmpdirTest } from '../helpers/tmpdir.js'

const [major, minor] = process.versions.node.split('.').map(Number)
const hasNodeSqlite = major > 22 || (major === 22 && minor >= 5)
const describeIf = hasNodeSqlite ? describe : describe.skip

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

// ─── Fixture builders ───────────────────────────────────────────────────────

function seedPhaseWithResolvingPlan(tmpdir, signalId, initialLifecycle) {
  const kbDir = path.join(tmpdir, '.planning', 'knowledge')
  const sigsDir = path.join(kbDir, 'signals', 'demo')
  fs.mkdirSync(sigsDir, { recursive: true })
  fs.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })

  const signalContent = [
    '---',
    `id: ${signalId}`,
    'type: signal',
    'project: demo',
    'severity: notable',
    `lifecycle_state: ${initialLifecycle}`,
    'status: active',
    'detection_method: manual',
    'origin: user-observation',
    "created: '2026-04-21T10:00:00Z'",
    'tags: [lifecycle-wiring, phase-59]',
    '---',
    '',
    `## ${signalId}`,
    '',
    'Fixture signal for lifecycle wiring regression.',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(sigsDir, `${signalId}.md`), signalContent, 'utf-8')

  const phaseDir = path.join(tmpdir, '.planning', 'phases', '59-test-phase')
  fs.mkdirSync(phaseDir, { recursive: true })

  const planContent = [
    '---',
    'phase: 59-test-phase',
    'plan: "04"',
    'type: execute',
    'resolves_signals:',
    `  - ${signalId}`,
    '---',
    '',
    '<objective>Fixture plan.</objective>',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(phaseDir, '59-04-PLAN.md'), planContent, 'utf-8')

  const summaryContent = [
    '---',
    'phase: 59-test-phase',
    'plan: "04"',
    `resolves_signals: [${signalId}]`,
    '---',
    '',
    '# Fixture summary',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(phaseDir, '59-04-SUMMARY.md'), summaryContent, 'utf-8')

  return { phaseDir, planPath: path.join(phaseDir, '59-04-PLAN.md'), signalPath: path.join(sigsDir, `${signalId}.md`) }
}

function openDb(tmpdir) {
  const { DatabaseSync } = require('node:sqlite')
  return new DatabaseSync(path.join(tmpdir, '.planning', 'knowledge', 'kb.db'))
}

function runGsd(tmpdir, args) {
  const cmd = `node --no-warnings "${GSD_TOOLS}" ${args.join(' ')}`
  try {
    const stdout = execSync(cmd, {
      cwd: tmpdir,
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { stdout, code: 0 }
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      code: err.status != null ? err.status : 1,
    }
  }
}

/**
 * Mirror the collect-signals reconcile_signal_lifecycle step: for each
 * -PLAN.md in the phase dir that has a matching -SUMMARY.md, extract
 * resolves_signals and invoke `kb transition <id> remediated` per id.
 *
 * Returns the list of transition results (one per signal id encountered).
 */
function runLifecycleWiring(tmpdir, phaseDir, planBasename) {
  const planPath = path.join(phaseDir, planBasename)
  const summaryPath = planPath.replace(/-PLAN\.md$/, '-SUMMARY.md')
  if (!fs.existsSync(summaryPath)) return []

  // Extract resolves_signals via gsd-tools frontmatter get --raw.
  const fmRaw = execFileSync('node', [
    '--no-warnings', GSD_TOOLS,
    'frontmatter', 'get', planPath,
    '--field', 'resolves_signals', '--raw',
  ], { cwd: tmpdir, encoding: 'utf-8' })
  let ids
  try { ids = JSON.parse(fmRaw.trim()) } catch { ids = [] }
  if (!Array.isArray(ids)) return []

  const results = []
  for (const id of ids) {
    const tx = runGsd(tmpdir, [
      'kb', 'transition', id, 'remediated',
      '--reason', `"completed by ${planBasename}"`,
      '--resolved-by-plan', planBasename,
      '--raw',
    ])
    results.push({ id, ...tx })
  }
  return results
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describeIf('lifecycle wiring: full closed-loop regression', () => {
  tmpdirTest('completed plan with resolves_signals transitions signal to remediated (file + SQL atomic)', async ({ tmpdir }) => {
    const sigId = 'sig-fixture-A'
    const fx = seedPhaseWithResolvingPlan(tmpdir, sigId, 'triaged')

    runGsd(tmpdir, ['kb', 'rebuild'])
    const results = runLifecycleWiring(tmpdir, fx.phaseDir, '59-04-PLAN.md')

    expect(results.length).toBe(1)
    expect(results[0].code).toBe(0)
    const payload = JSON.parse(results[0].stdout.trim())
    expect(payload.from).toBe('triaged')
    expect(payload.to).toBe('remediated')
    expect(payload.resolved_by_plan).toBe('59-04-PLAN.md')

    // File side: frontmatter.
    const sigContent = fs.readFileSync(fx.signalPath, 'utf-8')
    expect(sigContent).toMatch(/lifecycle_state:\s*remediated/)

    // SQL side: dual-write invariant.
    const db = openDb(tmpdir)
    const row = db.prepare('SELECT lifecycle_state, lifecycle_log FROM signals WHERE id=?').get(sigId)
    expect(row.lifecycle_state).toBe('remediated')

    const log = JSON.parse(row.lifecycle_log)
    expect(Array.isArray(log)).toBe(true)
    expect(log.length).toBe(1)
    expect(log[0].event).toBe('remediated')
    expect(log[0].from).toBe('triaged')
    expect(log[0].resolved_by_plan).toBe('59-04-PLAN.md')
  }, 20000)

  tmpdirTest('re-running the wiring is idempotent (no duplicate log entries)', async ({ tmpdir }) => {
    const sigId = 'sig-fixture-A'
    const fx = seedPhaseWithResolvingPlan(tmpdir, sigId, 'triaged')

    runGsd(tmpdir, ['kb', 'rebuild'])
    runLifecycleWiring(tmpdir, fx.phaseDir, '59-04-PLAN.md')

    // Re-run the wiring a second time.
    const results2 = runLifecycleWiring(tmpdir, fx.phaseDir, '59-04-PLAN.md')
    expect(results2.length).toBe(1)
    expect(results2[0].code).toBe(0)
    const payload2 = JSON.parse(results2[0].stdout.trim())
    expect(payload2.noop).toBe(true)

    // Log should still have exactly ONE entry (the first transition).
    const db = openDb(tmpdir)
    const row = db.prepare('SELECT lifecycle_log FROM signals WHERE id=?').get(sigId)
    const log = JSON.parse(row.lifecycle_log)
    expect(log.length).toBe(1)
  }, 20000)

  tmpdirTest('alternate path: signal already in remediated before wiring runs is no-op', async ({ tmpdir }) => {
    const sigId = 'sig-fixture-A'
    const fx = seedPhaseWithResolvingPlan(tmpdir, sigId, 'remediated')
    runGsd(tmpdir, ['kb', 'rebuild'])

    const results = runLifecycleWiring(tmpdir, fx.phaseDir, '59-04-PLAN.md')
    expect(results.length).toBe(1)
    expect(results[0].code).toBe(0)
    const payload = JSON.parse(results[0].stdout.trim())
    expect(payload.noop).toBe(true)
    expect(payload.from).toBe('remediated')
    expect(payload.to).toBe('remediated')
  }, 20000)

  tmpdirTest('kb health Check 2 goes GREEN after the wiring runs on a triaged signal', async ({ tmpdir }) => {
    const sigId = 'sig-fixture-A'
    const fx = seedPhaseWithResolvingPlan(tmpdir, sigId, 'triaged')
    runGsd(tmpdir, ['kb', 'rebuild'])

    // Before wiring: Check 2 should FAIL (drift_count >= 1).
    const before = runGsd(tmpdir, ['kb', 'health', '--format', 'json', '--raw'])
    const beforeJson = JSON.parse(before.stdout.trim())
    expect(beforeJson.checks.lifecycle_vs_plan.status).toBe('fail')
    expect(beforeJson.checks.lifecycle_vs_plan.drift_count).toBeGreaterThanOrEqual(1)

    // Apply wiring.
    runLifecycleWiring(tmpdir, fx.phaseDir, '59-04-PLAN.md')

    // After wiring: Check 2 should PASS for THIS plan's resolves_signals.
    const after = runGsd(tmpdir, ['kb', 'health', '--format', 'json', '--raw'])
    const afterJson = JSON.parse(after.stdout.trim())
    expect(afterJson.checks.lifecycle_vs_plan.status).toBe('pass')
    expect(afterJson.checks.lifecycle_vs_plan.drift_count).toBe(0)
  }, 20000)

  tmpdirTest('deprecated bash script exits non-zero on Linux with guidance', async ({ tmpdir }) => {
    // Confirm the Linux guard is in place so downstream callers can trust
    // that the bash fallback will surface the deprecation, not silently
    // no-op as it did in v1.16-v1.19.
    if (process.platform !== 'linux') {
      return  // macOS test machines would skip; here we are Linux
    }
    const scriptPath = path.resolve(process.cwd(), 'get-shit-done/bin/reconcile-signal-lifecycle.sh')
    expect(fs.existsSync(scriptPath)).toBe(true)

    let stdout = ''
    let stderr = ''
    let code = 0
    try {
      stdout = execSync(`bash "${scriptPath}" "${tmpdir}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (err) {
      stdout = err.stdout || ''
      stderr = err.stderr || ''
      code = err.status != null ? err.status : 1
    }
    expect(code).not.toBe(0)
    expect(stderr).toMatch(/DEPRECATED.*v1\.21|does not work on GNU sed/s)
    expect(stderr).toMatch(/kb transition/)
  }, 15000)
})
