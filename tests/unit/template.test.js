import { describe, expect, test } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { extractFrontmatter } = require('../../get-shit-done/bin/lib/frontmatter.cjs')
const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

describe('template signature surfaces', () => {
  test('summary and verification templates advertise the nested signature contract', async () => {
    const templateFiles = [
      'get-shit-done/templates/summary-minimal.md',
      'get-shit-done/templates/summary-standard.md',
      'get-shit-done/templates/summary-complex.md',
      'get-shit-done/templates/verification-report.md',
      'get-shit-done/templates/phase-prompt.md',
    ]

    for (const file of templateFiles) {
      const content = await fs.readFile(path.resolve(process.cwd(), file), 'utf8')
      expect(content).toContain('signature:')
      expect(content).toContain('provenance_status:')
      expect(content).toContain('provenance_source:')
    }
  })

  tmpdirTest('template fill emits valid summary and verification signatures', async ({ tmpdir }) => {
    const phaseDir = path.join(tmpdir, '.planning', 'phases', '57.8-sample-phase')
    await fs.mkdir(phaseDir, { recursive: true })

    execSync(`node "${GSD_TOOLS}" template fill summary --phase 57.8 --plan 09`, {
      cwd: tmpdir,
      encoding: 'utf8',
    })
    execSync(`node "${GSD_TOOLS}" template fill verification --phase 57.8`, {
      cwd: tmpdir,
      encoding: 'utf8',
    })

    const summaryPath = path.join(phaseDir, '57.8-09-SUMMARY.md')
    const verificationPath = path.join(phaseDir, '57.8-VERIFICATION.md')

    const summary = extractFrontmatter(await fs.readFile(summaryPath, 'utf8'))
    const verification = extractFrontmatter(await fs.readFile(verificationPath, 'utf8'))

    expect(summary.signature.role).toBe('executor')
    expect(summary.signature.generated_at).toBeTruthy()
    expect(summary.signature.provenance_status.gsd_version).toBeTruthy()

    expect(verification.signature.role).toBe('verifier')
    expect(verification.signature.generated_at).toBeTruthy()
    expect(verification.signature.provenance_source.gsd_version).toBeTruthy()

    const summaryValid = execSync(`node "${GSD_TOOLS}" frontmatter validate "${summaryPath}" --schema summary --raw`, {
      cwd: tmpdir,
      encoding: 'utf8',
    }).trim()
    const verificationValid = execSync(`node "${GSD_TOOLS}" frontmatter validate "${verificationPath}" --schema verification --raw`, {
      cwd: tmpdir,
      encoding: 'utf8',
    }).trim()

    expect(summaryValid).toBe('valid')
    expect(verificationValid).toBe('valid')
  })
})
