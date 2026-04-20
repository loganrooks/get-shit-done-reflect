/**
 * Verify Ledger — GATE-09d + GATE-09e embedded meta-gate tests.
 *
 * Phase 58 Plan 17 acceptance:
 *   - Pass state: ledger present + covers load-bearing claims + evidence paths
 *     exist → status=pass, exit 0, fire-event with result=pass.
 *   - Block on missing ledger: no NN-LEDGER.md → missing_claims includes
 *     `ledger_not_present` and status=block.
 *   - Block on claim-coverage gap: load-bearing CONTEXT claim not referenced
 *     in any ledger entry → status=block.
 *   - Block on broken evidence path: disposition=implemented_this_phase with
 *     a path that does not exist on disk → status=block.
 *   - Meta-gate guard: --no-meta-gate flag skips the meta-gate check.
 *   - Fire-event emission shape: `::notice title=GATE-09d::gate_fired=GATE-09d
 *     result=<pass|block> missing_claims=N unwired_gates=M`.
 */

import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

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
  // When --raw is set, the extractor emits a fire-event notice on its own line
  // then a JSON payload. Locate the JSON by finding the first `{`.
  const i = stdout.indexOf('{')
  if (i < 0) return null
  try {
    return JSON.parse(stdout.slice(i))
  } catch {
    return null
  }
}

async function scaffoldPhase(tmpdir, phaseNumber, phaseName, opts = {}) {
  const {
    contextContent = '',
    ledgerContent = null, // null = no ledger file written
    requirementsRows = [], // [['GATE-01', 'Phase 99'], ...]
  } = opts

  const planningDir = path.join(tmpdir, '.planning')
  await fs.mkdir(planningDir, { recursive: true })
  await fs.writeFile(
    path.join(planningDir, 'config.json'),
    JSON.stringify({ model_profile: 'quality' }, null, 2)
  )

  // Minimal ROADMAP.md so findPhaseInternal can resolve the phase.
  const roadmapContent = `# Roadmap\n\n## Phase ${phaseNumber}: ${phaseName}\n\nTest phase.\n`
  await fs.writeFile(path.join(planningDir, 'ROADMAP.md'), roadmapContent)

  // Minimal REQUIREMENTS.md traceability table.
  let reqContent = '# Requirements\n\n## Traceability\n\n| Requirement | Phase | Status |\n|-|-|-|\n'
  for (const [req, ph] of requirementsRows) {
    reqContent += `| ${req} | ${ph} | Pending |\n`
  }
  await fs.writeFile(path.join(planningDir, 'REQUIREMENTS.md'), reqContent)

  // Phase directory + CONTEXT.md + optional LEDGER.md.
  const phaseDir = path.join(planningDir, 'phases', `${phaseNumber}-${phaseName}`)
  await fs.mkdir(phaseDir, { recursive: true })
  await fs.writeFile(path.join(phaseDir, `${phaseNumber}-CONTEXT.md`), contextContent)
  if (ledgerContent !== null) {
    await fs.writeFile(path.join(phaseDir, `${phaseNumber}-LEDGER.md`), ledgerContent)
  }

  return { phaseDir, planningDir }
}

describe('verify ledger (GATE-09d + GATE-09e)', () => {
  tmpdirTest(
    'blocks when NN-LEDGER.md is absent',
    async ({ tmpdir }) => {
      await scaffoldPhase(tmpdir, '99', 'test-phase', {
        contextContent: `<domain>\n**Requirements in scope:** GATE-XX\n</domain>\n\n<working_model>\n- [decided:cited] Test claim A.\n</working_model>\n`,
      })

      const { stdout, stderr, exitCode } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      expect(exitCode).toBe(0) // raw → always exit 0
      expect(stdout).toMatch(/gate_fired=GATE-09d result=block/)
      const parsed = parseJson(stdout)
      expect(parsed).not.toBeNull()
      expect(parsed.status).toBe('block')
      expect(parsed.missing_claims).toContain('ledger_not_present')
    }
  )

  tmpdirTest(
    'passes when ledger covers load-bearing claim and evidence path exists',
    async ({ tmpdir }) => {
      const contextContent = `<domain>
**Requirements in scope:** GATE-XX
</domain>

<working_model>
- [decided:cited] Important test claim about gizmos.
</working_model>
`

      // Write evidence file (required for implemented_this_phase).
      const evidencePath = 'evidence.md'
      await fs.writeFile(path.join(tmpdir, evidencePath), '# evidence content\n')

      const ledgerContent = `---
phase: 99-test-phase
ledger_schema: v1
generated_at: "2026-04-20T00:00:00Z"
generator_role: verifier
entries:
  - context_claim: "Important test claim about gizmos"
    disposition: implemented_this_phase
    load_bearing: true
    evidence_paths:
      - "${evidencePath}"
    role_split_provenance:
      written_by: verifier
      written_at: "2026-04-20T00:00:00Z"
      session_id: "test-session"
---
# Phase 99 Ledger
`

      await scaffoldPhase(tmpdir, '99', 'test-phase', { contextContent, ledgerContent })

      const { stdout, exitCode } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      expect(exitCode).toBe(0)
      expect(stdout).toMatch(/gate_fired=GATE-09d result=pass/)
      const parsed = parseJson(stdout)
      expect(parsed).not.toBeNull()
      expect(parsed.status).toBe('pass')
      expect(parsed.missing_claims).toEqual([])
    }
  )

  tmpdirTest(
    'blocks when a load-bearing CONTEXT claim has no matching ledger entry',
    async ({ tmpdir }) => {
      const contextContent = `<working_model>
- [decided:cited] Claim about gizmos must be implemented.
- [governing:reasoned] Widgets shall be load-bearing in every phase.
</working_model>
`

      // Ledger mentions gizmos but NOT widgets → widgets is uncovered.
      const ledgerContent = `---
phase: 99-test-phase
ledger_schema: v1
generated_at: "2026-04-20T00:00:00Z"
generator_role: verifier
entries:
  - context_claim: "Claim about gizmos must be implemented"
    disposition: left_open_blocking_planning
    load_bearing: true
    role_split_provenance:
      written_by: verifier
      written_at: "2026-04-20T00:00:00Z"
      session_id: "test-session"
---
`

      await scaffoldPhase(tmpdir, '99', 'test-phase', { contextContent, ledgerContent })

      const { stdout, exitCode } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      expect(exitCode).toBe(0)
      const parsed = parseJson(stdout)
      expect(parsed).not.toBeNull()
      expect(parsed.status).toBe('block')
      // At least one uncovered_claim should reference the widgets line.
      const uncoveredWidget = parsed.missing_claims.some(m => /widget/i.test(m))
      expect(uncoveredWidget).toBe(true)
    }
  )

  tmpdirTest(
    'blocks when implemented_this_phase entry has missing evidence path',
    async ({ tmpdir }) => {
      const contextContent = `<working_model>
- [decided:cited] Must implement thing X.
</working_model>
`

      // evidence_paths points at a file that will not be created.
      const ledgerContent = `---
phase: 99-test-phase
ledger_schema: v1
generated_at: "2026-04-20T00:00:00Z"
generator_role: verifier
entries:
  - context_claim: "Must implement thing X"
    disposition: implemented_this_phase
    load_bearing: true
    evidence_paths:
      - "nonexistent/file.md"
    role_split_provenance:
      written_by: verifier
      written_at: "2026-04-20T00:00:00Z"
      session_id: "test-session"
---
`

      await scaffoldPhase(tmpdir, '99', 'test-phase', { contextContent, ledgerContent })

      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      const parsed = parseJson(stdout)
      expect(parsed).not.toBeNull()
      expect(parsed.status).toBe('block')
      const brokenEvidence = parsed.missing_claims.some(m =>
        /broken_evidence.*nonexistent\/file\.md/.test(m)
      )
      expect(brokenEvidence).toBe(true)
    }
  )

  tmpdirTest(
    '--no-meta-gate skips the meta-gate check', async ({ tmpdir }) => {
      const contextContent = `<domain>
**Requirements in scope:** GATE-XX, GATE-YY
</domain>

<working_model>
- [decided:cited] Dummy claim.
</working_model>
`

      const ledgerContent = `---
phase: 99-test-phase
ledger_schema: v1
generated_at: "2026-04-20T00:00:00Z"
generator_role: verifier
entries:
  - context_claim: "Dummy claim"
    disposition: left_open_blocking_planning
    load_bearing: true
    role_split_provenance:
      written_by: verifier
      written_at: "2026-04-20T00:00:00Z"
      session_id: "test-session"
---
`

      await scaffoldPhase(tmpdir, '99', 'test-phase', {
        contextContent,
        ledgerContent,
        requirementsRows: [['GATE-XX', 'Phase 99'], ['GATE-YY', 'Phase 99']],
      })

      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      const parsed = parseJson(stdout)
      expect(parsed).not.toBeNull()
      expect(parsed.info.meta_gate_skipped).toBe(true)
      // unwired_gates must be empty when meta-gate is skipped.
      expect(parsed.unwired_gates).toEqual([])
    }
  )

  tmpdirTest(
    'emits fire-event marker on every invocation',
    async ({ tmpdir }) => {
      await scaffoldPhase(tmpdir, '99', 'test-phase', { contextContent: '' })
      const { stdout } = runVerify(tmpdir, '99', ['--raw', '--no-meta-gate'])
      // The fire-event marker must appear regardless of pass/block outcome.
      expect(stdout).toMatch(/::notice title=GATE-09d::gate_fired=GATE-09d result=(pass|block) missing_claims=\d+ unwired_gates=\d+/)
    }
  )

  tmpdirTest(
    'errors clearly when phase arg is missing',
    async ({ tmpdir }) => {
      const result = spawnSync(
        process.execPath,
        [GSD_TOOLS, 'verify', 'ledger', '--cwd', tmpdir],
        { cwd: tmpdir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 }
      )
      // error() writes to stderr; either exit code != 0 or stderr message.
      const combined = (result.stdout || '') + (result.stderr || '')
      expect(combined).toMatch(/phase required|Unknown verify subcommand/)
    }
  )
})
