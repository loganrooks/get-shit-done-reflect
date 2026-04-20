// Phase 58 Plan 09 — GATE-15 source/install parity
//
// Unit tests for scripts/verify-install-parity.js. These tests exercise the
// comparator core against synthetic source + installed pairs, validating both
// the happy path (parity) and the failure modes the CI step relies on.
//
// We do NOT shell out to the real installer here — that's the CI step's job.
// These tests lock down the comparator semantics so the fire-event marker
// shape (`result=pass` vs `result=block path=<path> reason=<why>`) stays
// stable for Plan 19's gate_fire_events extractor.

import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fsSync from 'node:fs'

// Pull in the comparator via createRequire — the script is CommonJS.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const {
  compareRoot,
  expectedInstalledContent,
  mapInstalledRelPath,
  firstDiffLine,
} = require('../../scripts/verify-install-parity.js')

const { replacePathsInContent, injectVersionScope } = require('../../bin/install.js')
const pkg = require('../../package.json')
const VERSION_STRING = `${pkg.version}+dev`

// ---------------------------------------------------------------------------
// Filesystem scaffolding helpers
// ---------------------------------------------------------------------------

function writeFileRecursive(filePath, contents) {
  fsSync.mkdirSync(path.dirname(filePath), { recursive: true })
  fsSync.writeFileSync(filePath, contents)
}

/**
 * Build a minimal synthetic repo + install-dir pair in the given tmpdir.
 * Returns { repoRoot, installDir }.
 *
 * The synthetic repo only contains one source root per invocation — the caller
 * passes `rootKind` to select which shape to build. This keeps each test
 * focused on a single comparator code path.
 */
function buildSyntheticPair(tmpdir, rootKind, { drift = null } = {}) {
  const repoRoot = path.join(tmpdir, 'repo')
  const installDir = path.join(tmpdir, 'install')

  if (rootKind === 'commands') {
    const srcFile = path.join(repoRoot, 'commands/gsd/help.md')
    const sourceContent =
      '---\ndescription: Help command\n---\n\nRefers to ~/.claude/get-shit-done/ and /gsd:plan.\n'
    writeFileRecursive(srcFile, sourceContent)

    const installedFile = path.join(installDir, '.claude/commands/gsdr/help.md')
    let installedContent = replacePathsInContent(sourceContent, './.claude/')
    installedContent = injectVersionScope(installedContent, VERSION_STRING, 'local')
    if (drift === 'tweak-installed') installedContent += '<<drift>>'
    if (drift !== 'missing-installed') {
      writeFileRecursive(installedFile, installedContent)
    }
  } else if (rootKind === 'skill') {
    const srcFile = path.join(repoRoot, 'get-shit-done/references/demo.md')
    const sourceContent = 'See ~/.claude/get-shit-done/workflows/foo.md and run gsd-tools.\n'
    writeFileRecursive(srcFile, sourceContent)

    const srcJson = path.join(repoRoot, 'get-shit-done/migrations/m.json')
    writeFileRecursive(srcJson, '{"version":"1.0.0"}\n')

    const installedMd = path.join(installDir, '.claude/get-shit-done-reflect/references/demo.md')
    const installedMdContent = replacePathsInContent(sourceContent, './.claude/')
    if (drift !== 'missing-installed') {
      writeFileRecursive(installedMd, drift === 'tweak-installed' ? installedMdContent + '<<drift>>' : installedMdContent)
    }
    // Non-.md: byte-identical copy.
    const installedJson = path.join(installDir, '.claude/get-shit-done-reflect/migrations/m.json')
    writeFileRecursive(installedJson, '{"version":"1.0.0"}\n')
  } else if (rootKind === 'agents') {
    // gsd-*.md must rename to gsdr-*.md
    const srcFile = path.join(repoRoot, 'agents/gsd-sample.md')
    const sourceContent =
      '---\nname: gsd-sample\n---\n\nRefers to ~/.claude/agents/ and gsd-executor.\n'
    writeFileRecursive(srcFile, sourceContent)

    const installedFile = path.join(installDir, '.claude/agents/gsdr-sample.md')
    const installedContent = replacePathsInContent(sourceContent, './.claude/')
    if (drift !== 'missing-installed') {
      writeFileRecursive(installedFile, drift === 'tweak-installed' ? installedContent + '<<drift>>' : installedContent)
    }
  } else {
    throw new Error(`unknown rootKind: ${rootKind}`)
  }

  return { repoRoot, installDir }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('verify-install-parity: mapInstalledRelPath', () => {
  it('renames gsd- prefix to gsdr- in agents root', () => {
    expect(mapInstalledRelPath('gsd-sample.md', 'agents')).toBe('gsdr-sample.md')
  })

  it('leaves already-gsdr and non-prefixed agents alone', () => {
    expect(mapInstalledRelPath('gsdr-sample.md', 'agents')).toBe('gsdr-sample.md')
    expect(mapInstalledRelPath('knowledge-store.md', 'agents')).toBe('knowledge-store.md')
  })

  it('does not rename outside agents root (skill/commands)', () => {
    // commands/gsd/*.md keeps basenames; the whole directory re-maps via installedRoot.
    expect(mapInstalledRelPath('plan.md', 'commands')).toBe('plan.md')
    expect(mapInstalledRelPath('workflows/explore.md', 'skill')).toBe('workflows/explore.md')
  })
})

describe('verify-install-parity: firstDiffLine', () => {
  it('returns null when contents are identical', () => {
    expect(firstDiffLine(Buffer.from('a\nb\nc\n'), Buffer.from('a\nb\nc\n'))).toBeNull()
  })

  it('locates the first differing line (1-indexed)', () => {
    expect(firstDiffLine(Buffer.from('a\nb\nc\n'), Buffer.from('a\nX\nc\n'))).toBe('line_2')
  })

  it('locates the trailing line when one side has an extra newline', () => {
    // 'a\nb\n' → ['a','b',''], 'a\nb' → ['a','b']; diff at index 2 → line_3.
    expect(firstDiffLine(Buffer.from('a\nb\n'), Buffer.from('a\nb'))).toBe('line_3')
    // 'a\n' → ['a',''], 'a\nb\n' → ['a','b','']; diff at index 1 → line_2.
    expect(firstDiffLine(Buffer.from('a\n'), Buffer.from('a\nb\n'))).toBe('line_2')
  })
})

describe('verify-install-parity: expectedInstalledContent', () => {
  tmpdirTest('applies replacePaths + injectVersionScope for commands/', async ({ tmpdir }) => {
    const srcFile = path.join(tmpdir, 'plan.md')
    const src =
      '---\ndescription: Plan command\n---\n\nReference ~/.claude/get-shit-done/templates/plan.md.\n'
    writeFileRecursive(srcFile, src)
    const out = expectedInstalledContent(srcFile, 'plan.md', 'commands').toString('utf8')
    expect(out).toContain('./.claude/get-shit-done-reflect/templates/plan.md')
    expect(out).toContain(`(v${VERSION_STRING})`)
  })

  tmpdirTest('applies only replacePaths for get-shit-done/ (.md)', async ({ tmpdir }) => {
    const srcFile = path.join(tmpdir, 'demo.md')
    const src = '---\ndescription: Demo\n---\n\nSee ~/.claude/get-shit-done/ and /gsd:plan.\n'
    writeFileRecursive(srcFile, src)
    const out = expectedInstalledContent(srcFile, 'references/demo.md', 'skill').toString('utf8')
    expect(out).toContain('./.claude/get-shit-done-reflect/')
    expect(out).toContain('/gsdr:plan')
    // No version suffix for skill/ files.
    expect(out).not.toContain(`(v${VERSION_STRING})`)
  })

  tmpdirTest('returns raw bytes for non-.md files (byte-identical)', async ({ tmpdir }) => {
    const srcFile = path.join(tmpdir, 'm.json')
    const src = '{"a":1}\n'
    writeFileRecursive(srcFile, src)
    const out = expectedInstalledContent(srcFile, 'migrations/m.json', 'skill')
    expect(out.toString('utf8')).toBe(src)
  })
})

describe('verify-install-parity: compareRoot — pass cases', () => {
  const cases = [
    { kind: 'commands', root: 'commands/gsd', installed: '.claude/commands/gsdr' },
    { kind: 'skill', root: 'get-shit-done', installed: '.claude/get-shit-done-reflect' },
    { kind: 'agents', root: 'agents', installed: '.claude/agents' },
  ]
  for (const c of cases) {
    tmpdirTest(`returns ok for matching ${c.kind} pair`, async ({ tmpdir }) => {
      const { repoRoot, installDir } = buildSyntheticPair(tmpdir, c.kind)
      const res = compareRoot(
        { srcRoot: c.root, installedRoot: c.installed, kind: c.kind },
        repoRoot,
        installDir
      )
      expect(res.ok).toBe(true)
      expect(res.count).toBeGreaterThan(0)
    })
  }
})

describe('verify-install-parity: compareRoot — block cases', () => {
  tmpdirTest('reports installed_root_missing when installed dir is absent', async ({ tmpdir }) => {
    const repoRoot = path.join(tmpdir, 'repo')
    const installDir = path.join(tmpdir, 'install')
    writeFileRecursive(path.join(repoRoot, 'agents/x.md'), 'hi')
    // Intentionally no install tree — compareRoot sees no .claude/agents/.
    fsSync.mkdirSync(installDir, { recursive: true })
    const res = compareRoot(
      { srcRoot: 'agents', installedRoot: '.claude/agents', kind: 'agents' },
      repoRoot,
      installDir
    )
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('installed_root_missing')
  })

  tmpdirTest('reports installed_file_missing when a source file has no installed counterpart', async ({ tmpdir }) => {
    const { repoRoot, installDir } = buildSyntheticPair(tmpdir, 'agents', { drift: 'missing-installed' })
    // Create the installed root so we pass the root-presence check.
    fsSync.mkdirSync(path.join(installDir, '.claude/agents'), { recursive: true })
    const res = compareRoot(
      { srcRoot: 'agents', installedRoot: '.claude/agents', kind: 'agents' },
      repoRoot,
      installDir
    )
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('installed_file_missing')
    expect(res.path).toContain('gsdr-sample.md')
  })

  tmpdirTest('reports content_mismatch when installed byte drifts', async ({ tmpdir }) => {
    const { repoRoot, installDir } = buildSyntheticPair(tmpdir, 'commands', { drift: 'tweak-installed' })
    const res = compareRoot(
      { srcRoot: 'commands/gsd', installedRoot: '.claude/commands/gsdr', kind: 'commands' },
      repoRoot,
      installDir
    )
    expect(res.ok).toBe(false)
    expect(res.reason).toMatch(/^content_mismatch_/)
    expect(res.path).toContain('help.md')
  })

  tmpdirTest('reports source_root_missing when source dir is absent', async ({ tmpdir }) => {
    const repoRoot = path.join(tmpdir, 'repo')
    const installDir = path.join(tmpdir, 'install')
    fsSync.mkdirSync(repoRoot, { recursive: true })
    fsSync.mkdirSync(installDir, { recursive: true })
    const res = compareRoot(
      { srcRoot: 'agents', installedRoot: '.claude/agents', kind: 'agents' },
      repoRoot,
      installDir
    )
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('source_root_missing')
  })
})
