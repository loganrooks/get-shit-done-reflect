import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const {
  isDogfoodingRepo,
  classify,
  artifactCategoryApplies,
  loadCapabilityMatrix,
  scanPatchesDirectories,
  runSensor,
  LEGACY_PATCHES_DIR_NAME,
} = require('../../get-shit-done/bin/lib/patch-classifier.cjs')

const FIXTURE_PATH = path.resolve(process.cwd(), 'tests/fixtures/codex-v1175-backup-meta.json')

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

describe('patch-classifier library', () => {
  describe('isDogfoodingRepo()', () => {
    it('returns true for the GSDR source repo cwd', () => {
      expect(isDogfoodingRepo(process.cwd())).toBe(true)
    })

    it('returns false for an arbitrary temp directory', () => {
      const tmpdir = createTempDir('patch-classifier-nodog-')
      try {
        expect(isDogfoodingRepo(tmpdir)).toBe(false)
      } finally {
        fs.rmSync(tmpdir, { recursive: true, force: true })
      }
    })

    it('returns false when package.json.name is not the source repo package', () => {
      const tmpdir = createTempDir('patch-classifier-wrong-name-')
      try {
        writeJson(path.join(tmpdir, 'package.json'), { name: 'some-other-project' })
        fs.mkdirSync(path.join(tmpdir, '.git'))
        fs.mkdirSync(path.join(tmpdir, 'bin'))
        fs.writeFileSync(path.join(tmpdir, 'bin', 'install.js'), '')
        fs.mkdirSync(path.join(tmpdir, 'agents'))
        fs.mkdirSync(path.join(tmpdir, 'get-shit-done'))
        expect(isDogfoodingRepo(tmpdir)).toBe(false)
      } finally {
        fs.rmSync(tmpdir, { recursive: true, force: true })
      }
    })

    it('returns false when any of the required source-repo predicates is missing', () => {
      const missingCases = ['.git', 'bin/install.js', 'agents', 'get-shit-done']
      for (const missing of missingCases) {
        const tmpdir = createTempDir('patch-classifier-predicate-')
        try {
          writeJson(path.join(tmpdir, 'package.json'), { name: 'get-shit-done-reflect-cc' })
          fs.mkdirSync(path.join(tmpdir, '.git'))
          fs.mkdirSync(path.join(tmpdir, 'bin'))
          fs.writeFileSync(path.join(tmpdir, 'bin', 'install.js'), '')
          fs.mkdirSync(path.join(tmpdir, 'agents'))
          fs.mkdirSync(path.join(tmpdir, 'get-shit-done'))
          fs.rmSync(path.join(tmpdir, missing), { recursive: true, force: true })
          expect(isDogfoodingRepo(tmpdir), `missing ${missing} should disable dogfooding detection`).toBe(false)
        } finally {
          fs.rmSync(tmpdir, { recursive: true, force: true })
        }
      }
    })
  })

  describe('classify() taxonomy', () => {
    const baseInput = {
      relPath: 'agents/gsdr-sensor.md',
      runtime: 'claude',
      capabilityMatrixText: null,
      sourceFileExists: true,
      inLocalPatches: false,
      crossRuntimeInstalled: null,
    }

    const taxonomyCases = [
      {
        name: 'stale',
        expectedClass: 'stale',
        regularSeverity: 'notable',
        input: {
          manifestHash: 'old',
          installedHash: 'new',
          sourceHash: 'new',
        },
      },
      {
        name: 'customization',
        expectedClass: 'customization',
        regularSeverity: 'minor',
        input: {
          manifestHash: 'current',
          installedHash: 'user-edit',
          sourceHash: 'current',
          inLocalPatches: true,
        },
      },
      {
        name: 'bug',
        expectedClass: 'bug',
        regularSeverity: 'notable',
        input: {
          manifestHash: 'manifest',
          installedHash: 'installed',
          sourceHash: 'source',
        },
      },
      {
        name: 'format-drift',
        expectedClass: 'format-drift',
        regularSeverity: 'minor',
        input: {
          relPath: 'workflows/help.md',
          manifestHash: null,
          installedHash: null,
          sourceHash: null,
          sourceFileExists: false,
          crossRuntimeInstalled: { claudeHash: 'claude', codexHash: 'codex' },
        },
      },
      {
        name: 'feature-gap',
        expectedClass: 'feature-gap',
        regularSeverity: 'notable',
        input: {
          relPath: 'hooks/gsdr-context-monitor.js',
          runtime: 'codex',
          manifestHash: null,
          installedHash: null,
          sourceHash: 'source',
          sourceFileExists: true,
        },
      },
    ]

    for (const testCase of taxonomyCases) {
      it(`classifies ${testCase.name} with normal severity`, () => {
        const result = classify({ ...baseInput, ...testCase.input, isDogfooding: false })
        expect(result.class).toBe(testCase.expectedClass)
        expect(result.severity).toBe(testCase.regularSeverity)
      })

      it(`downgrades ${testCase.name} severity to trace in dogfooding mode`, () => {
        const result = classify({ ...baseInput, ...testCase.input, isDogfooding: true })
        expect(result.class).toBe(testCase.expectedClass)
        expect(result.severity).toBe('trace')
      })
    }

    it('classifies a source-removed installed file as stale with medium confidence', () => {
      const result = classify({
        ...baseInput,
        manifestHash: 'manifest',
        installedHash: 'installed',
        sourceHash: null,
        sourceFileExists: false,
      })
      expect(result.class).toBe('stale')
      expect(result.confidence).toBe('medium')
    })

    it('returns null when there is no divergence', () => {
      const result = classify({
        ...baseInput,
        manifestHash: 'same',
        installedHash: 'same',
        sourceHash: 'same',
      })
      expect(result).toBeNull()
    })
  })

  describe('G-3 low_confidence invariant', () => {
    it('always marks bug classifications as low confidence', () => {
      const result = classify({
        relPath: 'workflows/help.md',
        runtime: 'claude',
        manifestHash: 'manifest',
        installedHash: 'installed',
        sourceHash: 'source',
        sourceFileExists: true,
        inLocalPatches: false,
        crossRuntimeInstalled: null,
        capabilityMatrixText: null,
        isDogfooding: false,
      })

      expect(result.class).toBe('bug')
      expect(result.confidence).toBe('low')
      expect(result.low_confidence).toBe(true)
    })
  })

  describe('artifactCategoryApplies()', () => {
    const capabilityMatrixFixture = [
      '| Capability | Claude | OpenCode | Gemini | Codex |',
      '|------------|--------|----------|--------|-------|',
      '| hooks | Y | N | Y | Y [6] |',
      '| tool_permissions | Y | Y | Y [3] | N |',
      '| mcp_servers | Y | Y | Y | Y |',
      '',
    ].join('\n')

    it('treats hooks as applicable on claude', () => {
      const result = artifactCategoryApplies('claude', 'hooks/gsdr-check-update.js', capabilityMatrixFixture)
      expect(result.applies).toBe(true)
      expect(result.reason).toBeNull()
    })

    it('treats hooks as a codex feature-gap regardless of the conditional matrix cell', () => {
      const result = artifactCategoryApplies('codex', 'hooks/gsdr-check-update.js', capabilityMatrixFixture)
      expect(result.applies).toBe(false)
      expect(result.reason).toBe('codex-hooks-under-development')
    })

    it('uses the runtime column instead of any N in the row', () => {
      const result = artifactCategoryApplies('claude', 'tool_permissions/something.md', capabilityMatrixFixture)
      expect(result.applies).toBe(true)
      expect(result.reason).toBeNull()
    })

    it('returns the codex column N for tool_permissions', () => {
      const result = artifactCategoryApplies('codex', 'tool_permissions/something.md', capabilityMatrixFixture)
      expect(result.applies).toBe(false)
      expect(result.reason).toBe('capability-matrix-codex-column-is-N')
    })

    it('preserves conditional footnotes as applies=true', () => {
      const conditionalMatrix = [
        '| Capability | Claude | OpenCode | Gemini | Codex |',
        '|------------|--------|----------|--------|-------|',
        '| mcp_servers | Y | Y | Y | Y [6] |',
      ].join('\n')
      const result = artifactCategoryApplies('codex', 'mcp/transport.md', conditionalMatrix)
      expect(result.applies).toBe(true)
      expect(result.reason).toBe('capability-matrix-codex-conditional-Y-footnote')
    })

    it('returns a safe applies=true fallback for runtimes outside the phase scope', () => {
      const result = artifactCategoryApplies('opencode', 'tool_permissions/something.md', capabilityMatrixFixture)
      expect(result.applies).toBe(true)
      expect(result.reason).toBe('runtime-not-in-matrix-columns')
    })
  })

  describe('loadCapabilityMatrix()', () => {
    it('reads the installed capability matrix from a runtime mirror layout', () => {
      const runtimeDir = createTempDir('patch-classifier-matrix-')
      try {
        const installedMatrixDir = path.join(runtimeDir, 'get-shit-done-reflect', 'references')
        fs.mkdirSync(installedMatrixDir, { recursive: true })
        fs.copyFileSync(
          path.join(process.cwd(), 'get-shit-done', 'references', 'capability-matrix.md'),
          path.join(installedMatrixDir, 'capability-matrix.md'),
        )

        const matrix = loadCapabilityMatrix(runtimeDir)
        expect(matrix).toContain('# Runtime Capability Matrix')
        expect(matrix).toContain('| Capability | Claude Code | OpenCode [D] | Gemini CLI [D] | Codex CLI |')
      } finally {
        fs.rmSync(runtimeDir, { recursive: true, force: true })
      }
    })
  })

  describe('scanPatchesDirectories()', () => {
    let runtimeDir

    beforeEach(() => {
      runtimeDir = createTempDir('patch-classifier-scan-')
    })

    afterEach(() => {
      fs.rmSync(runtimeDir, { recursive: true, force: true })
    })

    it('scans both legacy and current patch directory names', () => {
      const legacyDir = path.join(runtimeDir, LEGACY_PATCHES_DIR_NAME)
      const currentDir = path.join(runtimeDir, 'gsdr-local-patches')

      fs.mkdirSync(legacyDir)
      fs.mkdirSync(currentDir)

      writeJson(path.join(legacyDir, 'backup-meta.json'), {
        from_version: '1.17.5',
        files: ['get-shit-done-reflect/workflows/help.md', 'get-shit-done-reflect/workflows/quick.md'],
      })
      writeJson(path.join(currentDir, 'backup-meta.json'), {
        from_version: '1.19.4',
        files: {
          'agents/gsdr-log-sensor.md': { hash: 'abc123' },
        },
      })

      const result = scanPatchesDirectories(runtimeDir)
      expect(result).toHaveLength(3)
      expect(result.some((entry) => entry.legacyNaming)).toBe(true)
      expect(result.some((entry) => entry.legacyNaming === false)).toBe(true)
    })
  })

  describe('17-file v1.17.5 golden fixture', () => {
    it('classifies every historical backup entry as stale with high confidence', () => {
      const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'))
      expect(Array.isArray(fixture.files)).toBe(true)
      expect(fixture.files).toHaveLength(17)

      for (const relPath of fixture.files) {
        const sourcePath = path.join(
          process.cwd(),
          'get-shit-done',
          relPath.replace(/^get-shit-done-reflect\//, '')
        )
        const sourceFileExists = fs.existsSync(sourcePath)

        const result = classify({
          relPath,
          runtime: 'codex',
          manifestHash: null,
          installedHash: null,
          sourceHash: sourceFileExists ? `source:${relPath}` : null,
          sourceFileExists,
          inLocalPatches: true,
          crossRuntimeInstalled: null,
          capabilityMatrixText: null,
          isDogfooding: false,
        })

        expect(result, relPath).not.toBeNull()
        expect(result.class, relPath).toBe('stale')
        expect(result.confidence, relPath).toBe('high')
      }
    })
  })

  describe('runSensor()', () => {
    it('returns the expected shape on the source repo', () => {
      const result = runSensor(process.cwd())
      expect(result.sensor).toBe('patch')
      expect(result.dogfooding_mode).toBe(true)
      expect(Array.isArray(result.signals)).toBe(true)
      expect(typeof result.stats.files_scanned).toBe('number')
      expect(typeof result.stats.divergences_found).toBe('number')
      expect(typeof result.stats.classification_failures).toBe('number')
    })
  })
})
