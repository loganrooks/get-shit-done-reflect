import { describe, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { execSync } from 'node:child_process'

const installScript = path.resolve(process.cwd(), 'bin/install.js')

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

/**
 * Check that a directory exists and contains at least `minCount` entries
 * matching an optional extension filter.
 */
async function dirHasFiles(dir, extension, minCount) {
  const exists = await fs.access(dir).then(() => true).catch(() => false)
  expect(exists, `directory should exist: ${dir}`).toBe(true)
  const entries = await fs.readdir(dir)
  const filtered = extension
    ? entries.filter(f => f.endsWith(extension))
    : entries
  expect(filtered.length, `${dir} should have >= ${minCount} ${extension || ''} files`).toBeGreaterThanOrEqual(minCount)
}

/**
 * Check that a directory exists and contains at least `minCount` entries
 * whose names match a simple glob pattern (only supports prefix*suffix).
 */
async function dirHasGlobFiles(dir, pattern, minCount) {
  const exists = await fs.access(dir).then(() => true).catch(() => false)
  expect(exists, `directory should exist: ${dir}`).toBe(true)
  const entries = await fs.readdir(dir)
  // Simple glob: split on * to get prefix and suffix
  const [prefix, suffix] = pattern.split('*')
  const matched = entries.filter(f => f.startsWith(prefix) && f.endsWith(suffix))
  expect(matched.length, `${dir} should have >= ${minCount} files matching ${pattern}`).toBeGreaterThanOrEqual(minCount)
}

/**
 * Check that a directory contains at least `minCount` subdirectories matching
 * a simple prefix* pattern.
 */
async function dirHasGlobDirs(dir, pattern, minCount) {
  const exists = await fs.access(dir).then(() => true).catch(() => false)
  expect(exists, `directory should exist: ${dir}`).toBe(true)
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const [prefix] = pattern.split('*')
  const matched = entries.filter(e => e.isDirectory() && e.name.startsWith(prefix))
  expect(matched.length, `${dir} should have >= ${minCount} subdirs matching ${pattern}`).toBeGreaterThanOrEqual(minCount)
}

async function fileExists(filePath) {
  const exists = await fs.access(filePath).then(() => true).catch(() => false)
  expect(exists, `file should exist: ${filePath}`).toBe(true)
}

async function fileNotExists(filePath) {
  const exists = await fs.access(filePath).then(() => true).catch(() => false)
  expect(exists, `file should NOT exist: ${filePath}`).toBe(false)
}

/**
 * Verify expected directory structure per runtime after installation.
 */
async function verifyRuntimeLayout(rootDir, runtime, configHome) {
  if (runtime === 'claude') {
    const base = path.join(rootDir, '.claude')
    await dirHasFiles(path.join(base, 'commands', 'gsd'), '.md', 3)
    await dirHasFiles(path.join(base, 'get-shit-done'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsd-*.md', 1)
    await dirHasFiles(path.join(base, 'hooks'), '.js', 1)
    await fileExists(path.join(base, 'get-shit-done', 'VERSION'))
    await fileExists(path.join(base, 'settings.json'))
  } else if (runtime === 'opencode') {
    const base = configHome
      ? path.join(configHome, 'opencode')
      : path.join(rootDir, '.config', 'opencode')
    await dirHasGlobFiles(path.join(base, 'command'), 'gsd-*.md', 3)
    await dirHasFiles(path.join(base, 'get-shit-done'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsd-*.md', 1)
    await fileExists(path.join(base, 'get-shit-done', 'VERSION'))
  } else if (runtime === 'gemini') {
    const base = path.join(rootDir, '.gemini')
    await dirHasFiles(path.join(base, 'commands', 'gsd'), '.toml', 3)
    await dirHasFiles(path.join(base, 'get-shit-done'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsd-*.md', 1)
    await dirHasFiles(path.join(base, 'hooks'), '.js', 1)
    await fileExists(path.join(base, 'get-shit-done', 'VERSION'))
    await fileExists(path.join(base, 'settings.json'))
  } else if (runtime === 'codex') {
    const base = path.join(rootDir, '.codex')
    await dirHasGlobDirs(path.join(base, 'skills'), 'gsd-*', 3)
    await dirHasFiles(path.join(base, 'get-shit-done'), null, 1)
    await fileExists(path.join(base, 'AGENTS.md'))
    await fileExists(path.join(base, 'get-shit-done', 'VERSION'))
    // Codex should NOT have these:
    await fileNotExists(path.join(base, 'agents'))
    await fileNotExists(path.join(base, 'hooks'))
    await fileNotExists(path.join(base, 'settings.json'))
  }
}

/**
 * Scan all .md and .toml files recursively in runtimeDir and assert no
 * ~/.claude/ paths remain (except in Claude's own install). Also verify
 * KB paths use ~/.gsd/knowledge/ not old ~/.claude/gsd-knowledge/.
 * Returns array of violation objects for detailed failure messages.
 */
async function verifyNoLeakedPaths(runtimeDir, runtime) {
  const allFiles = await fs.readdir(runtimeDir, { recursive: true })
  const textFiles = allFiles.filter(f => f.endsWith('.md') || f.endsWith('.toml'))

  const violations = []
  for (const file of textFiles) {
    const filePath = path.join(runtimeDir, file)
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) continue

    const content = await fs.readFile(filePath, 'utf8')

    // Check for leaked ~/.claude/ paths in non-Claude runtimes
    if (runtime !== 'claude' && content.includes('~/.claude/')) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('~/.claude/')) {
          violations.push({ file, line: i + 1, issue: 'leaked ~/.claude/ path', text: lines[i].trim() })
        }
      }
    }

    // Check for old gsd-knowledge paths (should be .gsd/knowledge)
    if (content.includes('gsd-knowledge') && !content.includes('.gsd/knowledge')) {
      violations.push({ file, issue: 'uses old gsd-knowledge path instead of .gsd/knowledge' })
    }
  }

  expect(violations, `Path leakage violations in ${runtime}:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0)
}

/**
 * Scan installed files for any reference to 'knowledge' and verify they
 * use ~/.gsd/knowledge/ (shared path).
 */
async function verifyKBPathsShared(runtimeDir) {
  const allFiles = await fs.readdir(runtimeDir, { recursive: true })
  const textFiles = allFiles.filter(f => f.endsWith('.md') || f.endsWith('.toml'))

  const violations = []
  for (const file of textFiles) {
    const filePath = path.join(runtimeDir, file)
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) continue

    const content = await fs.readFile(filePath, 'utf8')

    // If file references 'gsd-knowledge' or 'gsd_knowledge', it should use ~/.gsd/knowledge/
    if (content.includes('gsd-knowledge') || content.includes('gsd_knowledge')) {
      // Allow only the pattern ~/.gsd/knowledge or $HOME/.gsd/knowledge
      if (!content.includes('.gsd/knowledge')) {
        violations.push({ file, issue: 'references gsd-knowledge but not via ~/.gsd/knowledge/' })
      }
    }
  }

  expect(violations, `KB path violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0)
}

// ---------------------------------------------------------------------------
// VALID-01: OpenCode Installation
// ---------------------------------------------------------------------------

describe('multi-runtime validation', () => {
  describe('VALID-01: OpenCode installation', () => {
    tmpdirTest('OpenCode: correct file layout after install', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --opencode --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      await verifyRuntimeLayout(tmpdir, 'opencode', configHome)
    })

    tmpdirTest('OpenCode: all paths transformed from ~/.claude/ to XDG path', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --opencode --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const opcodeDir = path.join(configHome, 'opencode')
      await verifyNoLeakedPaths(opcodeDir, 'opencode')
    })

    tmpdirTest('OpenCode: command files use flat gsd-*.md naming', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --opencode --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const commandDir = path.join(configHome, 'opencode', 'command')
      const files = await fs.readdir(commandDir)

      // All GSD command files should be gsd-*.md (flat, no nested gsd/ subdirectory)
      const gsdFiles = files.filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
      expect(gsdFiles.length).toBeGreaterThanOrEqual(3)

      // There should be NO gsd/ subdirectory inside command/
      const gsdSubdir = await fs.access(path.join(commandDir, 'gsd')).then(() => true).catch(() => false)
      expect(gsdSubdir, 'command/gsd/ subdirectory should NOT exist (flat structure)').toBe(false)

      // Every file in the command dir that starts with gsd- should be .md
      for (const file of gsdFiles) {
        expect(file).toMatch(/^gsd-.*\.md$/)
      }
    })

    tmpdirTest('OpenCode: KB paths reference shared ~/.gsd/knowledge/', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --opencode --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const opcodeDir = path.join(configHome, 'opencode')
      await verifyKBPathsShared(opcodeDir)
    })
  })

  // ---------------------------------------------------------------------------
  // VALID-02: Gemini Installation
  // ---------------------------------------------------------------------------

  describe('VALID-02: Gemini installation', () => {
    tmpdirTest('Gemini: correct file layout after install', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      await verifyRuntimeLayout(tmpdir, 'gemini')
    })

    tmpdirTest('Gemini: all paths transformed from ~/.claude/ to ~/.gemini/', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const geminiDir = path.join(tmpdir, '.gemini')
      await verifyNoLeakedPaths(geminiDir, 'gemini')
    })

    tmpdirTest('Gemini: command files are .toml format', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const commandsDir = path.join(tmpdir, '.gemini', 'commands', 'gsd')
      const files = await fs.readdir(commandsDir)

      // All command files should be .toml, NOT .md
      const tomlFiles = files.filter(f => f.endsWith('.toml'))
      const mdFiles = files.filter(f => f.endsWith('.md'))

      expect(tomlFiles.length).toBeGreaterThanOrEqual(3)
      expect(mdFiles.length, 'no .md files should be in Gemini commands/gsd/').toBe(0)

      // Verify at least one .toml file has valid TOML-like content
      const sampleToml = await fs.readFile(path.join(commandsDir, tomlFiles[0]), 'utf8')
      expect(sampleToml).toContain('prompt = ')
    })

    tmpdirTest('Gemini: KB paths reference shared ~/.gsd/knowledge/', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const geminiDir = path.join(tmpdir, '.gemini')
      await verifyKBPathsShared(geminiDir)
    })
  })

  // ---------------------------------------------------------------------------
  // VALID-03: Multi-runtime --all install (added in Task 2)
  // ---------------------------------------------------------------------------

  // VALID-03 tests are added in Task 2
  describe('VALID-03: Multi-runtime --all install', () => {
    tmpdirTest.todo('--all installs all 4 runtimes with correct file layouts')
    tmpdirTest.todo('--all install: no cross-runtime path leakage')
    tmpdirTest.todo('--all install: each runtime has format-correct command files')
    tmpdirTest.todo('--all install: shared KB directory created with correct structure')
    tmpdirTest.todo('--all install: VERSION files present in all runtimes')
  })
})
