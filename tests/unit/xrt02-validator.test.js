import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const {
  validatePatchForRuntime,
  runtimeAxis,
  formatAxis,
  versionAxis,
  conversionAxis,
  detectFormat,
} = require('../../get-shit-done/bin/lib/xrt02-validator.cjs')
const { claudeToCodexTools } = require('../../bin/install.js')

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests/fixtures')

describe('xrt02-validator', () => {
  describe('detectFormat()', () => {
    it('detects markdown, toml, and unknown paths', () => {
      expect(detectFormat('agents/example.md')).toBe('markdown')
      expect(detectFormat('skills/gsdr-audit/SKILL.md')).toBe('markdown')
      expect(detectFormat('agents/example.toml')).toBe('toml')
      expect(detectFormat('hooks/pre-tool-use.json')).toBe('unknown')
    })
  })

  describe('runtimeAxis()', () => {
    it('classifies hook references as a codex feature-gap even when relPath is generic', () => {
      const patch = fs.readFileSync(path.join(FIXTURE_DIR, 'incompatible-patch-hook-ref.md'), 'utf8')
      const result = runtimeAxis({
        patchContent: patch,
        targetRuntime: 'codex',
        relPath: 'agents/test.md',
        capabilityMatrixText: null,
      })

      expect(result.compatible).toBe(false)
      expect(result.class).toBe('feature-gap')
      expect(result.reason).toBe('codex-hooks-under-development')
    })

    it('accepts claude tools that have codex mappings', () => {
      const patch = fs.readFileSync(path.join(FIXTURE_DIR, 'compatible-patch-tool-renamed.md'), 'utf8')
      const result = runtimeAxis({
        patchContent: patch,
        targetRuntime: 'codex',
        relPath: 'agents/file-reader.md',
        capabilityMatrixText: null,
      })

      expect(result.compatible).toBe(true)
    })

    it('rejects claude tools with no codex mapping', () => {
      const patch = [
        '---',
        'name: unsupported-tool-user',
        'allowed_tools: [WebFetch]',
        '---',
        '',
        'Call WebFetch(url="https://example.com").',
      ].join('\n')

      const result = runtimeAxis({
        patchContent: patch,
        targetRuntime: 'codex',
        relPath: 'agents/unsupported-tool.md',
        capabilityMatrixText: null,
      })

      expect(result.compatible).toBe(false)
      expect(result.class).toBe('feature-gap')
      expect(result.reason).toContain('WebFetch')
    })

    it('parses multiline allowed-tools frontmatter entries', () => {
      const patch = [
        '---',
        'name: multiline-tool-user',
        'allowed-tools:',
        '  - Read',
        '  - Bash',
        '---',
        '',
        'Call Read(file_path=\"./x.md\")',
      ].join('\n')

      const result = runtimeAxis({
        patchContent: patch,
        targetRuntime: 'codex',
        relPath: 'agents/multiline.md',
        capabilityMatrixText: null,
      })

      expect(result.compatible).toBe(true)
    })
  })

  describe('formatAxis()', () => {
    it('rejects skill and toml surfaces on claude', () => {
      expect(formatAxis({
        patchContent: '# skill',
        relPath: 'skills/gsdr-audit/SKILL.md',
        targetRuntime: 'claude',
      }).class).toBe('feature-gap')

      expect(formatAxis({
        patchContent: '[agent]\nname = "x"',
        relPath: 'agents/example.toml',
        targetRuntime: 'claude',
      }).class).toBe('feature-gap')
    })

    it('flags malformed markdown frontmatter as format-drift', () => {
      const malformed = ['---', 'name: broken', '', '<role>oops</role>'].join('\n')
      const result = formatAxis({
        patchContent: malformed,
        relPath: 'agents/broken.md',
        targetRuntime: 'codex',
      })

      expect(result.compatible).toBe(false)
      expect(result.class).toBe('format-drift')
    })

    it('marks unknown formats as low confidence instead of failing closed', () => {
      const result = formatAxis({
        patchContent: '{"example":true}',
        relPath: 'hooks/pre-tool-use.json',
        targetRuntime: 'claude',
      })

      expect(result.compatible).toBe(true)
      expect(result.low_confidence).toBe(true)
    })
  })

  describe('versionAxis()', () => {
    it('rejects major version mismatches', () => {
      const result = versionAxis({
        patchSourceVersion: '1.17.5',
        targetVersion: '2.0.0',
      })

      expect(result.compatible).toBe(false)
      expect(result.class).toBe('feature-gap')
    })

    it('passes matching major versions', () => {
      expect(versionAxis({
        patchSourceVersion: '1.17.5',
        targetVersion: '1.19.8',
      }).compatible).toBe(true)
    })
  })

  describe('conversionAxis()', () => {
    it('converts claude agent markdown to codex-compatible content', () => {
      const patch = fs.readFileSync(path.join(FIXTURE_DIR, 'compatible-patch-tool-renamed.md'), 'utf8')
      const result = conversionAxis({
        patchContent: patch,
        patchSourceRuntime: 'claude',
        targetRuntime: 'codex',
        relPath: 'agents/file-reader.md',
      })

      expect(result.compatible).toBe(true)
      expect(result.converted).toBeDefined()
      expect(result.converted).not.toContain('~/.claude/')
      expect(result.converted).not.toContain('/gsdr:')
      expect(result.converted).toContain(claudeToCodexTools.Read)
      expect(result.converted).toContain(claudeToCodexTools.Bash)
    })

    it('leaves same-runtime content unchanged', () => {
      const patch = '# existing content'
      const result = conversionAxis({
        patchContent: patch,
        patchSourceRuntime: 'claude',
        targetRuntime: 'claude',
        relPath: 'agents/example.md',
      })

      expect(result.compatible).toBe(true)
      expect(result.converted).toBe(patch)
    })

    it('returns low-confidence format-drift for codex-to-claude conversion', () => {
      const result = conversionAxis({
        patchContent: '[agent]\nname = "x"',
        patchSourceRuntime: 'codex',
        targetRuntime: 'claude',
        relPath: 'agents/example.toml',
      })

      expect(result.compatible).toBe(false)
      expect(result.class).toBe('format-drift')
      expect(result.low_confidence).toBe(true)
    })
  })

  describe('validatePatchForRuntime()', () => {
    it('classifies the hook fixture as feature-gap on codex', () => {
      const patch = fs.readFileSync(path.join(FIXTURE_DIR, 'incompatible-patch-hook-ref.md'), 'utf8')
      const result = validatePatchForRuntime({
        patchContent: patch,
        patchSourceRuntime: 'claude',
        targetRuntime: 'codex',
        relPath: 'agents/test.md',
      })

      expect(result.compatible).toBe(false)
      expect(result.class).toBe('feature-gap')
      expect(result.remediation).toBe('skip')
    })

    it('classifies the tool rename fixture as auto-convertible format-drift', () => {
      const patch = fs.readFileSync(path.join(FIXTURE_DIR, 'compatible-patch-tool-renamed.md'), 'utf8')
      const result = validatePatchForRuntime({
        patchContent: patch,
        patchSourceRuntime: 'claude',
        targetRuntime: 'codex',
        relPath: 'agents/file-reader.md',
      })

      expect(result.compatible).toBe(true)
      expect(result.class).toBe('format-drift')
      expect(result.remediation).toBe('convert-and-apply')
      expect(result.converted).toBeDefined()
      expect(result.converted).toContain('read_file')
      expect(result.converted).not.toMatch(/\bRead\b/)
    })

    it('uses only the shared format-drift / feature-gap vocabulary for failures', () => {
      const results = [
        validatePatchForRuntime({
          patchContent: fs.readFileSync(path.join(FIXTURE_DIR, 'incompatible-patch-hook-ref.md'), 'utf8'),
          patchSourceRuntime: 'claude',
          targetRuntime: 'codex',
          relPath: 'agents/test.md',
        }),
        validatePatchForRuntime({
          patchContent: '[agent]\nname = "x"',
          patchSourceRuntime: 'codex',
          targetRuntime: 'claude',
          relPath: 'agents/example.toml',
        }),
        validatePatchForRuntime({
          patchContent: '# version mismatch',
          patchSourceRuntime: 'claude',
          targetRuntime: 'codex',
          relPath: 'agents/example.md',
          patchSourceVersion: '1.17.5',
          targetVersion: '2.0.0',
        }),
      ]

      for (const result of results) {
        if (!result.compatible) {
          expect(['format-drift', 'feature-gap']).toContain(result.class)
        }
      }
    })

    it('preserves low_confidence when any axis is uncertain', () => {
      const result = validatePatchForRuntime({
        patchContent: '{"example":true}',
        patchSourceRuntime: 'codex',
        targetRuntime: 'claude',
        relPath: 'hooks/pre-tool-use.json',
      })

      expect(result.compatible).toBe(false)
      expect(result.low_confidence).toBe(true)
      expect(result.confidence).toBe('low')
    })

    it('returns abort for invalid input', () => {
      const result = validatePatchForRuntime({
        patchContent: '',
        patchSourceRuntime: '',
        targetRuntime: '',
        relPath: '',
      })

      expect(result.compatible).toBe(false)
      expect(result.remediation).toBe('abort')
      expect(result.low_confidence).toBe(true)
    })
  })

  describe('live install.js helper reuse', () => {
    it('keeps the tool mapping live and avoids a duplicated static map', () => {
      const validatorPath = path.resolve(process.cwd(), 'get-shit-done/bin/lib/xrt02-validator.cjs')
      const validatorContent = fs.readFileSync(validatorPath, 'utf8')

      expect(validatorContent).toMatch(/require\(['"]\.\.\/\.\.\/\.\.\/bin\/install\.js['"]\)/)
      expect(validatorContent).not.toMatch(/['"]Read['"]\s*:\s*['"]read_file['"]/)
    })
  })
})
