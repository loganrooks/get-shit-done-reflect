/**
 * Verify XRT-01 Closeout — capability-matrix diff check.
 *
 * Phase 58 Plan 18 acceptance:
 *   - Pass when phase does NOT touch capability surface (no hook/Session/
 *     codex_hooks/capability-matrix keywords in SUMMARY.md or CONTEXT.md).
 *   - Pass when phase touches capability AND capability-matrix.md was
 *     modified since phase-start commit.
 *   - Block when phase touches capability but capability-matrix.md is
 *     unchanged since phase start (reason=capability_matrix_unreviewed).
 *   - Pass (with warning reason) when the matrix file is missing from the
 *     working tree entirely (reason=capability_matrix_file_missing).
 *   - Pass (with warning reason) when the phase directory has no git
 *     history that can anchor the diff (reason=matrix_start_not_resolvable).
 *   - Fire-event emission: `::notice title=XRT-01::gate_fired=XRT-01
 *     result=<pass|block> reason=<str>` on every invocation.
 */

import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')
const PHASE_60_BEHAVIOR_MATRIX = path.resolve(
  process.cwd(),
  '.planning/phases/60-sensor-pipeline-codex-parity/60-codex-behavior-matrix.md'
)

function runVerify(cwd, phase, flags = []) {
  const result = spawnSync(
    process.execPath,
    [GSD_TOOLS, 'verify', 'ledger', phase, ...flags, '--cwd', cwd],
    { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 }
  )
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status == null ? -1 : result.status,
  }
}

function parseJson(stdout) {
  const i = stdout.indexOf('{')
  if (i < 0) return null
  try { return JSON.parse(stdout.slice(i)) } catch { return null }
}

function runGit(cwd, args) {
  return spawnSync('git', args, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
}

function extractPhase60MatrixRows(content) {
  const matrixSection = content.split('## Matrix')[1]?.split('## Notes')[0] ?? ''
  return matrixSection
    .split('\n')
    .filter(line => line.startsWith('| **SENS-') || line.startsWith('| **XRT-'))
}

async function gitInit(tmpdir) {
  runGit(tmpdir, ['init', '-q', '-b', 'main'])
  runGit(tmpdir, ['config', 'user.email', 'test@example.com'])
  runGit(tmpdir, ['config', 'user.name', 'Test User'])
  runGit(tmpdir, ['config', 'commit.gpgsign', 'false'])
}

async function gitCommit(tmpdir, message) {
  runGit(tmpdir, ['add', '-A'])
  runGit(tmpdir, ['commit', '-q', '-m', message, '--allow-empty'])
}

async function scaffoldPhase(tmpdir, {
  contextContent = '',
  summaryContent = null,
  matrixContent = null,
}) {
  const planningDir = path.join(tmpdir, '.planning')
  await fs.mkdir(planningDir, { recursive: true })
  await fs.writeFile(
    path.join(planningDir, 'config.json'),
    JSON.stringify({ model_profile: 'quality' }, null, 2)
  )
  await fs.writeFile(
    path.join(planningDir, 'ROADMAP.md'),
    '# Roadmap\n\n## Phase 99: test-phase\n\nTest phase.\n'
  )
  await fs.writeFile(
    path.join(planningDir, 'REQUIREMENTS.md'),
    '# Requirements\n\n## Traceability\n\n| Requirement | Phase | Status |\n|-|-|-|\n'
  )

  if (matrixContent !== null) {
    const refDir = path.join(tmpdir, 'get-shit-done', 'references')
    await fs.mkdir(refDir, { recursive: true })
    await fs.writeFile(path.join(refDir, 'capability-matrix.md'), matrixContent)
  }

  const phaseDir = path.join(planningDir, 'phases', '99-test-phase')
  await fs.mkdir(phaseDir, { recursive: true })
  await fs.writeFile(path.join(phaseDir, '99-CONTEXT.md'), contextContent)
  if (summaryContent !== null) {
    await fs.writeFile(path.join(phaseDir, '99-01-SUMMARY.md'), summaryContent)
  }
  return { phaseDir, planningDir }
}

describe('verify ledger — XRT-01 closeout capability-matrix diff', () => {
  tmpdirTest(
    'passes when phase SUMMARY / CONTEXT do not reference capability surface',
    async ({ tmpdir }) => {
      await gitInit(tmpdir)
      await scaffoldPhase(tmpdir, {
        contextContent: '<working_model>\n- [decided] A claim without capability keywords.\n</working_model>\n',
        summaryContent: '# Summary\nRoutine feature work. Nothing about runtime substrate.\n',
        matrixContent: '# Matrix v1\nAll capability rows here.\n',
      })
      await gitCommit(tmpdir, 'initial commit')

      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      expect(stdout).toMatch(/gate_fired=XRT-01 result=pass reason=no_capability_touch/)
      const parsed = parseJson(stdout)
      expect(parsed).not.toBeNull()
      expect(parsed.info.xrt_01.status).toBe('pass')
      expect(parsed.info.xrt_01.reason).toBe('no_capability_touch')
    }
  )

  tmpdirTest(
    'passes when phase touches capability surface AND matrix is modified',
    async ({ tmpdir }) => {
      await gitInit(tmpdir)
      // Phase-start state: matrix exists, phase directory is created.
      await scaffoldPhase(tmpdir, {
        contextContent: '<working_model>\n- [decided] SessionStop hook commitment.\n</working_model>\n',
        summaryContent: '# Summary\nImplements SessionStop hook wiring and postlude emission.\n',
        matrixContent: '# Matrix\nInitial rows.\n',
      })
      await gitCommit(tmpdir, 'phase start: create phase 99 + initial matrix')

      // Phase work: edit the matrix to reflect the new feature.
      const matrixPath = path.join(tmpdir, 'get-shit-done', 'references', 'capability-matrix.md')
      await fs.writeFile(matrixPath, '# Matrix\nInitial rows.\nNEW: SessionStop on Codex (applies-via-installer).\n')
      await gitCommit(tmpdir, 'phase 99: refresh capability-matrix for SessionStop')

      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      expect(stdout).toMatch(/gate_fired=XRT-01 result=pass reason=matrix_updated/)
      const parsed = parseJson(stdout)
      expect(parsed.info.xrt_01.status).toBe('pass')
      expect(parsed.info.xrt_01.reason).toBe('matrix_updated')
      expect(parsed.info.capability_matrix_modified).toBe(true)
    }
  )

  tmpdirTest(
    'blocks when phase touches capability but matrix is unchanged since phase start',
    async ({ tmpdir }) => {
      await gitInit(tmpdir)
      // Commit 1: matrix exists pre-phase.
      const refDir = path.join(tmpdir, 'get-shit-done', 'references')
      await fs.mkdir(refDir, { recursive: true })
      await fs.writeFile(path.join(refDir, 'capability-matrix.md'), '# Matrix\nPre-phase state.\n')
      await fs.mkdir(path.join(tmpdir, '.planning'), { recursive: true })
      await fs.writeFile(
        path.join(tmpdir, '.planning', 'config.json'),
        JSON.stringify({ model_profile: 'quality' }, null, 2)
      )
      await fs.writeFile(
        path.join(tmpdir, '.planning', 'ROADMAP.md'),
        '# Roadmap\n\n## Phase 99: test-phase\n'
      )
      await fs.writeFile(
        path.join(tmpdir, '.planning', 'REQUIREMENTS.md'),
        '# Requirements\n'
      )
      await gitCommit(tmpdir, 'pre-phase: matrix baseline')

      // Commit 2: phase directory created WITH capability-touching content,
      // but matrix is NOT updated.
      const phaseDir = path.join(tmpdir, '.planning', 'phases', '99-test-phase')
      await fs.mkdir(phaseDir, { recursive: true })
      await fs.writeFile(
        path.join(phaseDir, '99-CONTEXT.md'),
        '<working_model>\n- [decided] codex_hooks feature flag integration.\n</working_model>\n'
      )
      await fs.writeFile(
        path.join(phaseDir, '99-01-SUMMARY.md'),
        '# Summary\nWired SessionStop via codex_hooks. has_capability() updated.\n'
      )
      await gitCommit(tmpdir, 'phase 99: ship hooks without matrix refresh')

      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      expect(stdout).toMatch(/gate_fired=XRT-01 result=block reason=capability_matrix_unreviewed/)
      const parsed = parseJson(stdout)
      expect(parsed).not.toBeNull()
      expect(parsed.info.xrt_01.status).toBe('block')
      expect(parsed.info.xrt_01.reason).toBe('capability_matrix_unreviewed')
      expect(parsed.info.capability_touched).toBe(true)
      expect(parsed.info.capability_matrix_modified).toBe(false)
      // XRT-01 block contributes a missing_claims entry to roll into GATE-09d.
      const hasXrtInClaims = parsed.missing_claims.some(c =>
        /xrt_01_capability_matrix_unreviewed/.test(c)
      )
      expect(hasXrtInClaims).toBe(true)
    }
  )

  tmpdirTest(
    'passes (with reason) when capability-matrix file is missing entirely',
    async ({ tmpdir }) => {
      await gitInit(tmpdir)
      await scaffoldPhase(tmpdir, {
        contextContent: '<working_model>\n- [decided] hook commitment.\n</working_model>\n',
        summaryContent: '# Summary\nhook feature landed.\n',
        matrixContent: null, // no matrix file
      })
      await gitCommit(tmpdir, 'phase start without matrix file')

      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      expect(stdout).toMatch(/gate_fired=XRT-01 result=pass reason=capability_matrix_file_missing/)
      const parsed = parseJson(stdout)
      expect(parsed.info.xrt_01.status).toBe('pass')
      expect(parsed.info.xrt_01.reason).toBe('capability_matrix_file_missing')
    }
  )

  tmpdirTest(
    'emits XRT-01 fire-event on every invocation (deadlock-guard: matrix_start_not_resolvable path)',
    async ({ tmpdir }) => {
      // No git init here → phase dir has no git history → start SHA
      // cannot be resolved → verifier skips with warning reason.
      await scaffoldPhase(tmpdir, {
        contextContent: '<working_model>\n- [decided] hook commitment.\n</working_model>\n',
        summaryContent: '# Summary\nhook feature landed without matrix refresh.\n',
        matrixContent: '# Matrix\nUnchanged.\n',
      })

      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      // Fire-event MUST emit regardless of whether the diff could be computed.
      expect(stdout).toMatch(/::notice title=XRT-01::gate_fired=XRT-01 result=pass reason=matrix_start_not_resolvable/)
      const parsed = parseJson(stdout)
      expect(parsed.info.xrt_01.status).toBe('pass')
      expect(parsed.info.xrt_01.reason).toBe('matrix_start_not_resolvable')
    }
  )
})

describe('Phase 60: codex-behavior-matrix sidecar', () => {
  it('exists and is non-trivial', async () => {
    await expect(fs.access(PHASE_60_BEHAVIOR_MATRIX)).resolves.toBeUndefined()

    const content = await fs.readFile(PHASE_60_BEHAVIOR_MATRIX, 'utf8')
    expect(content.length).toBeGreaterThan(1000)
  })

  it('has 9 requirement/surface rows', async () => {
    const content = await fs.readFile(PHASE_60_BEHAVIOR_MATRIX, 'utf8')
    const rows = extractPhase60MatrixRows(content)

    expect(rows.length).toBe(9)
  })

  it('uses only canonical substrate vocabulary and non-empty reasons', async () => {
    const content = await fs.readFile(PHASE_60_BEHAVIOR_MATRIX, 'utf8')
    const rows = extractPhase60MatrixRows(content)
    const canonicalPrefixes = [
      'applies',
      'applies-via-workflow-step',
      'applies-via-installer',
      'does-not-apply-with-reason',
    ]

    expect(content).not.toMatch(/applies-via-hook/)

    for (const row of rows) {
      const cells = row.split('|').map(cell => cell.trim())
      const behaviors = [cells[3], cells[4]].map(value => value.replace(/`/g, '').trim())

      for (const behavior of behaviors) {
        const prefix = behavior.split(':')[0].trim()
        expect(canonicalPrefixes).toContain(prefix)

        if (behavior.startsWith('does-not-apply-with-reason')) {
          expect(behavior).toMatch(/^does-not-apply-with-reason:\s*\S/)
        }
      }
    }
  })
})
