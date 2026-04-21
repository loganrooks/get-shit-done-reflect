import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  checkCrossRuntimeParity,
  MANIFEST_NAME,
} = require('../../bin/install.js')

describe('checkCrossRuntimeParity — Phase 60 SENS-06', () => {
  let tmpRoot
  let claudeDir
  let codexDir
  let logSpy

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phase60-parity-'))
    claudeDir = path.join(tmpRoot, '.claude')
    codexDir = path.join(tmpRoot, '.codex')
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    vi.restoreAllMocks()
    if (tmpRoot && fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  function setupInstall(dir, version, files = {}) {
    fs.mkdirSync(path.join(dir, 'get-shit-done-reflect'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'get-shit-done-reflect', 'VERSION'), `${version}\n`)
    fs.writeFileSync(
      path.join(dir, MANIFEST_NAME),
      JSON.stringify({ version, files }, null, 2)
    )
  }

  function readReport(dir) {
    return JSON.parse(fs.readFileSync(path.join(dir, 'gsd-parity-report.json'), 'utf8'))
  }

  function loggedOutput() {
    return logSpy.mock.calls.flat().join('\n')
  }

  describe('divergent versions', () => {
    it('detects divergence, writes the report, and prints the remediation command', () => {
      setupInstall(claudeDir, '1.19.8', { 'agents/a.md': 'hash-a' })
      setupInstall(codexDir, '1.19.7', { 'agents/b.md': 'hash-b' })

      const report = checkCrossRuntimeParity(claudeDir, 'claude', false, { otherRuntimeDir: codexDir })

      expect(report.divergent).toBe(true)
      expect(report.this_runtime).toBe('claude')
      expect(report.this_version).toBe('1.19.8')
      expect(report.other_runtime).toBe('codex')
      expect(report.other_version).toBe('1.19.7')
      expect(report.remediation_command).toBe('node bin/install.js --codex')

      const diskReport = readReport(claudeDir)
      expect(diskReport.divergent).toBe(true)
      expect(loggedOutput()).toContain('Cross-runtime parity:')
      expect(loggedOutput()).toContain('node bin/install.js --codex')
    })

    it('strips the +dev suffix when comparing versions and still writes a report', () => {
      setupInstall(claudeDir, '1.19.8+dev', { 'agents/a.md': 'hash-a' })
      setupInstall(codexDir, '1.19.8', { 'agents/a.md': 'hash-a' })

      const report = checkCrossRuntimeParity(claudeDir, 'claude', false, { otherRuntimeDir: codexDir })

      expect(report.divergent).toBe(false)
      expect(report.remediation_command).toBeNull()
      expect(readReport(claudeDir).divergent).toBe(false)
    })

    it('counts divergent files when manifests disagree', () => {
      setupInstall(claudeDir, '1.19.8', { 'agents/a.md': 'same', 'agents/b.md': 'claude-only' })
      setupInstall(codexDir, '1.19.7', { 'agents/a.md': 'same', 'agents/c.md': 'codex-only' })

      const report = checkCrossRuntimeParity(claudeDir, 'claude', false, { otherRuntimeDir: codexDir })

      expect(report.divergent_file_count).toBe(2)
    })
  })

  describe('G-4 honest skips', () => {
    it('returns other_runtime_not_installed and avoids a false parity advisory', () => {
      setupInstall(claudeDir, '1.19.8')

      const report = checkCrossRuntimeParity(claudeDir, 'claude', false, { otherRuntimeDir: codexDir })

      expect(report.divergent).toBe(false)
      expect(report.reason).toBe('other_runtime_not_installed')
      expect(report.remediation_command).toBeNull()
      expect(readReport(claudeDir).reason).toBe('other_runtime_not_installed')
      expect(loggedOutput()).not.toContain('Cross-runtime parity:')
      expect(report.reason).not.toBe('parity_ok')
    })

    it('returns other_manifest_unreadable when the other manifest is invalid JSON', () => {
      setupInstall(claudeDir, '1.19.8')
      fs.mkdirSync(path.join(codexDir, 'get-shit-done-reflect'), { recursive: true })
      fs.writeFileSync(path.join(codexDir, 'get-shit-done-reflect', 'VERSION'), '1.19.7\n')
      fs.writeFileSync(path.join(codexDir, MANIFEST_NAME), '{ not valid json ')

      const report = checkCrossRuntimeParity(claudeDir, 'claude', false, { otherRuntimeDir: codexDir })

      expect(report.divergent).toBe(false)
      expect(report.reason).toBe('other_manifest_unreadable')
      expect(readReport(claudeDir).reason).toBe('other_manifest_unreadable')
      expect(loggedOutput()).not.toContain('Cross-runtime parity:')
    })
  })

  describe('advisory-only behavior', () => {
    it('does not prompt or throw and returns synchronously', () => {
      setupInstall(claudeDir, '1.19.8')
      setupInstall(codexDir, '1.19.7')

      const start = Date.now()
      const report = checkCrossRuntimeParity(claudeDir, 'claude', false, { otherRuntimeDir: codexDir })

      expect(Date.now() - start).toBeLessThan(500)
      expect(report).toHaveProperty('divergent')
    })
  })

  describe('reverse direction', () => {
    it('works symmetrically for a Codex-side invocation', () => {
      setupInstall(claudeDir, '1.19.8')
      setupInstall(codexDir, '1.19.7')

      const report = checkCrossRuntimeParity(codexDir, 'codex', false, { otherRuntimeDir: claudeDir })

      expect(report.this_runtime).toBe('codex')
      expect(report.other_runtime).toBe('claude')
      expect(report.divergent).toBe(true)
      expect(report.remediation_command).toBe('node bin/install.js --claude')
    })
  })
})
