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

    tmpdirTest('Gemini: agent files retain MCP tool references after install', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Read the installed planner agent (source has mcp__context7__* in tools)
      const plannerAgent = path.join(tmpdir, '.gemini', 'agents', 'gsd-planner.md')
      const content = await fs.readFile(plannerAgent, 'utf8')

      // MCP tool reference should be preserved, not stripped
      expect(content).toContain('mcp__context7')
    })

    tmpdirTest('Gemini: agent body text uses Gemini-native tool names after install', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Read the installed planner agent (body references Read, Write, Bash, Glob, Grep)
      const plannerAgent = path.join(tmpdir, '.gemini', 'agents', 'gsd-planner.md')
      const content = await fs.readFile(plannerAgent, 'utf8')

      // Separate frontmatter from body for body-only assertions
      const parts = content.split('---')
      const body = parts.slice(2).join('---')

      // Body text should contain Gemini-native tool names
      expect(body).toContain('read_file')
      // Body text should NOT contain Claude tool names (word-boundary match)
      expect(body).not.toMatch(/\bRead\b/)
      expect(body).not.toMatch(/\bBash\b/)
      // MCP references should still be preserved in body if present
      if (body.includes('mcp__')) {
        expect(body).toMatch(/mcp__\w+__/)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // Codex MCP config.toml after install
  // ---------------------------------------------------------------------------

  describe('Codex MCP config.toml after install', () => {
    tmpdirTest('Codex install generates config.toml with MCP servers', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const configTomlPath = path.join(tmpdir, '.codex', 'config.toml')
      const exists = await fs.access(configTomlPath).then(() => true).catch(() => false)
      expect(exists, 'config.toml should exist after Codex install').toBe(true)

      const content = await fs.readFile(configTomlPath, 'utf8')
      expect(content).toContain('[mcp_servers.context7]')
      expect(content).toContain('command = "npx"')
      expect(content).toContain('args = ["-y", "@upstash/context7-mcp"]')
      expect(content).toContain('# GSD:BEGIN (get-shit-done-reflect-cc)')
      expect(content).toContain('# GSD:END (get-shit-done-reflect-cc)')
    })
  })

  // ---------------------------------------------------------------------------
  // VALID-03: Multi-runtime --all install (added in Task 2)
  // ---------------------------------------------------------------------------

  describe('VALID-03: Multi-runtime --all install', () => {
    tmpdirTest('--all installs all 4 runtimes with correct file layouts', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Verify all 4 runtimes have correct file layouts
      await verifyRuntimeLayout(tmpdir, 'claude')
      await verifyRuntimeLayout(tmpdir, 'opencode', configHome)
      await verifyRuntimeLayout(tmpdir, 'gemini')
      await verifyRuntimeLayout(tmpdir, 'codex')
    })

    tmpdirTest('--all install: no cross-runtime path leakage', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // For each non-Claude runtime, verify no ~/.claude/ paths leaked
      const opcodeDir = path.join(configHome, 'opencode')
      await verifyNoLeakedPaths(opcodeDir, 'opencode')

      const geminiDir = path.join(tmpdir, '.gemini')
      await verifyNoLeakedPaths(geminiDir, 'gemini')

      const codexDir = path.join(tmpdir, '.codex')
      await verifyNoLeakedPaths(codexDir, 'codex')

      // Verify each runtime's installed files reference the correct runtime-specific prefix
      // OpenCode: should use ~/.config/opencode/
      const opcodeGsd = path.join(opcodeDir, 'get-shit-done')
      const opcodeFiles = await fs.readdir(opcodeGsd, { recursive: true })
      const opcodeMdFiles = opcodeFiles.filter(f => f.endsWith('.md'))
      for (const file of opcodeMdFiles) {
        const filePath = path.join(opcodeGsd, file)
        const stat = await fs.stat(filePath)
        if (!stat.isFile()) continue
        const content = await fs.readFile(filePath, 'utf8')
        // If file references get-shit-done paths, they should use opencode path
        if (content.includes('/get-shit-done/') && !content.includes('.gsd/knowledge')) {
          expect(content).not.toContain('~/.claude/get-shit-done')
        }
      }

      // Gemini: should use ~/.gemini/
      const geminiGsd = path.join(geminiDir, 'get-shit-done')
      const geminiFiles = await fs.readdir(geminiGsd, { recursive: true })
      const geminiMdFiles = geminiFiles.filter(f => f.endsWith('.md'))
      for (const file of geminiMdFiles) {
        const filePath = path.join(geminiGsd, file)
        const stat = await fs.stat(filePath)
        if (!stat.isFile()) continue
        const content = await fs.readFile(filePath, 'utf8')
        if (content.includes('/get-shit-done/') && !content.includes('.gsd/knowledge')) {
          expect(content).not.toContain('~/.claude/get-shit-done')
        }
      }

      // Codex: should use ~/.codex/
      const codexGsd = path.join(codexDir, 'get-shit-done')
      const codexFiles = await fs.readdir(codexGsd, { recursive: true })
      const codexMdFiles = codexFiles.filter(f => f.endsWith('.md'))
      for (const file of codexMdFiles) {
        const filePath = path.join(codexGsd, file)
        const stat = await fs.stat(filePath)
        if (!stat.isFile()) continue
        const content = await fs.readFile(filePath, 'utf8')
        if (content.includes('/get-shit-done/') && !content.includes('.gsd/knowledge')) {
          expect(content).not.toContain('~/.claude/get-shit-done')
        }
      }
    })

    tmpdirTest('--all install: each runtime has format-correct command files', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Claude: .md files in commands/gsd/
      const claudeCommandsDir = path.join(tmpdir, '.claude', 'commands', 'gsd')
      const claudeFiles = await fs.readdir(claudeCommandsDir)
      const claudeMdFiles = claudeFiles.filter(f => f.endsWith('.md'))
      expect(claudeMdFiles.length).toBeGreaterThanOrEqual(3)

      // OpenCode: .md files matching gsd-*.md in command/ (flat)
      const opcodeCommandDir = path.join(configHome, 'opencode', 'command')
      const opcodeFiles = await fs.readdir(opcodeCommandDir)
      const opcodeGsdFiles = opcodeFiles.filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
      expect(opcodeGsdFiles.length).toBeGreaterThanOrEqual(3)

      // Gemini: .toml files in commands/gsd/
      const geminiCommandsDir = path.join(tmpdir, '.gemini', 'commands', 'gsd')
      const geminiFiles = await fs.readdir(geminiCommandsDir)
      const geminiTomlFiles = geminiFiles.filter(f => f.endsWith('.toml'))
      expect(geminiTomlFiles.length).toBeGreaterThanOrEqual(3)
      // No .md files should be in Gemini commands
      const geminiMdFiles = geminiFiles.filter(f => f.endsWith('.md'))
      expect(geminiMdFiles.length).toBe(0)

      // Codex: SKILL.md files in skills/gsd-*/
      const codexSkillsDir = path.join(tmpdir, '.codex', 'skills')
      const codexEntries = await fs.readdir(codexSkillsDir, { withFileTypes: true })
      const codexSkillDirs = codexEntries.filter(e => e.isDirectory() && e.name.startsWith('gsd-'))
      expect(codexSkillDirs.length).toBeGreaterThanOrEqual(3)

      // Verify each Codex skill has a SKILL.md
      for (const skillDir of codexSkillDirs) {
        const skillMdPath = path.join(codexSkillsDir, skillDir.name, 'SKILL.md')
        const exists = await fs.access(skillMdPath).then(() => true).catch(() => false)
        expect(exists, `${skillDir.name}/SKILL.md should exist`).toBe(true)
      }
    })

    tmpdirTest('--all install: shared KB directory created with correct structure', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Verify ~/.gsd/knowledge/ directory exists with signals/, spikes/, lessons/
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      await fileExists(path.join(kbDir, 'signals'))
      await fileExists(path.join(kbDir, 'spikes'))
      await fileExists(path.join(kbDir, 'lessons'))

      // Verify Claude backward-compat symlink
      const claudeSymlink = path.join(tmpdir, '.claude', 'gsd-knowledge')
      const stat = await fs.lstat(claudeSymlink)
      expect(stat.isSymbolicLink()).toBe(true)

      const target = await fs.readlink(claudeSymlink)
      expect(target).toBe(kbDir)
    })

    tmpdirTest('--all install: VERSION files present in all runtimes', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Collect VERSION file contents from all 4 runtimes
      const versionPaths = [
        path.join(tmpdir, '.claude', 'get-shit-done', 'VERSION'),
        path.join(configHome, 'opencode', 'get-shit-done', 'VERSION'),
        path.join(tmpdir, '.gemini', 'get-shit-done', 'VERSION'),
        path.join(tmpdir, '.codex', 'get-shit-done', 'VERSION'),
      ]

      const versions = []
      for (const vp of versionPaths) {
        const exists = await fs.access(vp).then(() => true).catch(() => false)
        expect(exists, `VERSION file should exist: ${vp}`).toBe(true)
        const version = (await fs.readFile(vp, 'utf8')).trim()
        expect(version).toBeTruthy()
        versions.push(version)
      }

      // All 4 runtimes should have the same version string
      const [claude, opencode, gemini, codex] = versions
      expect(opencode, 'OpenCode VERSION should match Claude').toBe(claude)
      expect(gemini, 'Gemini VERSION should match Claude').toBe(claude)
      expect(codex, 'Codex VERSION should match Claude').toBe(claude)
    })
  })
})
