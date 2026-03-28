import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

/**
 * Helper: run health-probe validation-coverage via CLI
 */
function runValidationCoverage(tmpdir) {
  const result = execSync(`node "${GSD_TOOLS}" health-probe validation-coverage --raw`, {
    cwd: tmpdir,
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  return JSON.parse(result.trim())
}

/**
 * Helper: create a VALIDATION.md file with given compliance_pct
 */
async function createValidation(tmpdir, phaseDir, fileName, compliancePct) {
  const dir = path.join(tmpdir, '.planning', 'phases', phaseDir)
  await fs.mkdir(dir, { recursive: true })
  const content = `---
compliance_pct: ${compliancePct}
nyquist_compliant: ${compliancePct >= 80 ? 'true' : 'false'}
---

# Validation Results
`
  await fs.writeFile(path.join(dir, fileName), content)
}

describe('health-probe validation-coverage', () => {

  tmpdirTest('returns PASS with no phases directory', async ({ tmpdir }) => {
    // No .planning/phases/ directory at all
    const result = runValidationCoverage(tmpdir)

    expect(result.probe_id).toBe('validation-coverage')
    expect(result.checks).toHaveLength(1)
    expect(result.checks[0].id).toBe('VAL-COVERAGE-01')
    expect(result.checks[0].status).toBe('PASS')
    expect(result.checks[0].detail).toBe('No phases directory found')
    expect(result.dimension_contribution.type).toBe('quality')
  })

  tmpdirTest('returns PASS with no VALIDATION.md files', async ({ tmpdir }) => {
    // Create phase dir with only a PLAN.md
    const phaseDir = path.join(tmpdir, '.planning', 'phases', '01-test')
    await fs.mkdir(phaseDir, { recursive: true })
    await fs.writeFile(path.join(phaseDir, '01-01-PLAN.md'), '# Plan')

    const result = runValidationCoverage(tmpdir)

    expect(result.probe_id).toBe('validation-coverage')
    expect(result.checks[0].status).toBe('PASS')
    expect(result.checks[0].detail).toBe('No validation files found')
    expect(result.checks[0].data.phases_scanned).toBe(1)
    expect(result.checks[0].data.phases_with_validation).toBe(0)
  })

  tmpdirTest('returns PASS when all phases above threshold', async ({ tmpdir }) => {
    await createValidation(tmpdir, '01-test', '01-VALIDATION.md', 90)

    const result = runValidationCoverage(tmpdir)

    expect(result.probe_id).toBe('validation-coverage')
    expect(result.checks[0].status).toBe('PASS')
    expect(result.checks[0].data.average_compliance_pct).toBe(90)
    expect(result.checks[0].data.below_threshold).toHaveLength(0)
    expect(result.dimension_contribution.signals.notable).toBe(0)
  })

  tmpdirTest('returns WARNING when phase below threshold', async ({ tmpdir }) => {
    await createValidation(tmpdir, '01-test', '01-VALIDATION.md', 50)

    const result = runValidationCoverage(tmpdir)

    expect(result.probe_id).toBe('validation-coverage')
    expect(result.checks[0].status).toBe('WARNING')
    expect(result.checks[0].data.below_threshold).toHaveLength(1)
    expect(result.checks[0].data.below_threshold[0].compliance_pct).toBe(50)
    expect(result.dimension_contribution.signals.notable).toBe(1)
  })

  tmpdirTest('respects custom threshold from config.json', async ({ tmpdir }) => {
    await createValidation(tmpdir, '01-test', '01-VALIDATION.md', 90)

    // Create config with higher threshold
    const configDir = path.join(tmpdir, '.planning')
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify({
        health_check: { validation_threshold_pct: 95 },
      }, null, 2)
    )

    const result = runValidationCoverage(tmpdir)

    expect(result.checks[0].status).toBe('WARNING')
    expect(result.checks[0].data.below_threshold).toHaveLength(1)
    expect(result.checks[0].data.below_threshold[0].compliance_pct).toBe(90)
  })

  tmpdirTest('computes average across multiple phases', async ({ tmpdir }) => {
    await createValidation(tmpdir, '01-test', '01-VALIDATION.md', 80)
    await createValidation(tmpdir, '02-test', '02-VALIDATION.md', 60)

    const result = runValidationCoverage(tmpdir)

    expect(result.checks[0].data.phases_with_validation).toBe(2)
    expect(result.checks[0].data.average_compliance_pct).toBe(70)
    // 60 is below the default threshold of 80
    expect(result.checks[0].data.below_threshold).toHaveLength(1)
    expect(result.checks[0].status).toBe('WARNING')
  })

})
