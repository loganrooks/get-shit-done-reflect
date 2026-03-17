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
    await dirHasFiles(path.join(base, 'commands', 'gsdr'), '.md', 3)
    await dirHasFiles(path.join(base, 'get-shit-done-reflect'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsdr-*.md', 1)
    await dirHasFiles(path.join(base, 'hooks'), '.js', 1)
    await fileExists(path.join(base, 'get-shit-done-reflect', 'VERSION'))
    await fileExists(path.join(base, 'settings.json'))
  } else if (runtime === 'opencode') {
    const base = configHome
      ? path.join(configHome, 'opencode')
      : path.join(rootDir, '.config', 'opencode')
    await dirHasGlobFiles(path.join(base, 'command'), 'gsdr-*.md', 3)
    await dirHasFiles(path.join(base, 'get-shit-done-reflect'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsdr-*.md', 1)
    await fileExists(path.join(base, 'get-shit-done-reflect', 'VERSION'))
  } else if (runtime === 'gemini') {
    const base = path.join(rootDir, '.gemini')
    await dirHasFiles(path.join(base, 'commands', 'gsdr'), '.toml', 3)
    await dirHasFiles(path.join(base, 'get-shit-done-reflect'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsdr-*.md', 1)
    await dirHasFiles(path.join(base, 'hooks'), '.js', 1)
    await fileExists(path.join(base, 'get-shit-done-reflect', 'VERSION'))
    await fileExists(path.join(base, 'settings.json'))
  } else if (runtime === 'codex') {
    const base = path.join(rootDir, '.codex')
    await dirHasGlobDirs(path.join(base, 'skills'), 'gsdr-*', 3)
    await dirHasFiles(path.join(base, 'get-shit-done-reflect'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsdr-*.toml', 1)
    await fileExists(path.join(base, 'AGENTS.md'))
    await fileExists(path.join(base, 'get-shit-done-reflect', 'VERSION'))
    // Codex should NOT have these:
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
    // Documentation-style uses (e.g., "~/.claude/ = claude-code") have a space after the slash
    // and are intentionally preserved by replacePathsInContent()
    if (runtime !== 'claude' && content.includes('~/.claude/')) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('~/.claude/') && !lines[i].match(/~\/\.claude\/\s/)) {
          violations.push({ file, line: i + 1, issue: 'leaked ~/.claude/ path', text: lines[i].trim() })
        }
      }
    }

    // Check for old gsd-knowledge paths (should be .gsd/knowledge)
    if (content.includes('gsd-knowledge') && !content.includes('.gsd/knowledge')) {
      violations.push({ file, issue: 'uses old gsd-knowledge path instead of .gsd/knowledge' })
    }

    // Check for stale gsd- references that should be gsdr- in installed output
    // Exempt: gsd-tools.js (filename preserved), gsd-knowledge (legacy KB path),
    //         CHANGELOG.md (historical references to old agent names),
    //         gsd-test (temp directory names from test harness),
    //         gsd-build (upstream GitHub org name)
    if (!file.endsWith('CHANGELOG.md') && content.match(/\bgsd-(?!tools|knowledge|test|build)/)) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/\bgsd-(?!tools|knowledge|test|build)/) && !lines[i].includes('gsdr-')) {
          violations.push({ file, line: i + 1, issue: 'stale gsd- reference (should be gsdr-)', text: lines[i].trim() })
        }
      }
    }
  }

  expect(violations, `Path leakage violations in ${runtime}:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0)
}

/**
 * Scan installed files for any reference to 'knowledge' and verify they
 * use .planning/knowledge/ (project-local primary) or ~/.gsd/knowledge/ (fallback).
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

    // If file references 'gsd-knowledge' or 'gsd_knowledge', it should use
    // .planning/knowledge (project-local) or .gsd/knowledge (user-global fallback)
    if (content.includes('gsd-knowledge') || content.includes('gsd_knowledge')) {
      if (!content.includes('.gsd/knowledge') && !content.includes('.planning/knowledge')) {
        violations.push({ file, issue: 'references gsd-knowledge but not via .planning/knowledge/ or .gsd/knowledge/' })
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

    tmpdirTest('OpenCode: command files use flat gsdr-*.md naming', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --opencode --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const commandDir = path.join(configHome, 'opencode', 'command')
      const files = await fs.readdir(commandDir)

      // All GSD command files should be gsdr-*.md (flat, no nested gsdr/ subdirectory)
      const gsdFiles = files.filter(f => f.startsWith('gsdr-') && f.endsWith('.md'))
      expect(gsdFiles.length).toBeGreaterThanOrEqual(3)

      // There should be NO gsdr/ subdirectory inside command/
      const gsdSubdir = await fs.access(path.join(commandDir, 'gsdr')).then(() => true).catch(() => false)
      expect(gsdSubdir, 'command/gsdr/ subdirectory should NOT exist (flat structure)').toBe(false)

      // Every file in the command dir that starts with gsdr- should be .md
      for (const file of gsdFiles) {
        expect(file).toMatch(/^gsdr-.*\.md$/)
      }
    })

    tmpdirTest('OpenCode: KB paths reference .planning/knowledge/ (primary) or ~/.gsd/knowledge/ (fallback)', async ({ tmpdir }) => {
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

      const commandsDir = path.join(tmpdir, '.gemini', 'commands', 'gsdr')
      const files = await fs.readdir(commandsDir)

      // All command files should be .toml, NOT .md
      const tomlFiles = files.filter(f => f.endsWith('.toml'))
      const mdFiles = files.filter(f => f.endsWith('.md'))

      expect(tomlFiles.length).toBeGreaterThanOrEqual(3)
      expect(mdFiles.length, 'no .md files should be in Gemini commands/gsdr/').toBe(0)

      // Verify at least one .toml file has valid TOML-like content
      const sampleToml = await fs.readFile(path.join(commandsDir, tomlFiles[0]), 'utf8')
      expect(sampleToml).toContain('prompt = ')
    })

    tmpdirTest('Gemini: KB paths reference .planning/knowledge/ (primary) or ~/.gsd/knowledge/ (fallback)', async ({ tmpdir }) => {
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
      const plannerAgent = path.join(tmpdir, '.gemini', 'agents', 'gsdr-planner.md')
      const content = await fs.readFile(plannerAgent, 'utf8')

      // MCP tool reference should be preserved, not stripped
      expect(content).toContain('mcp__context7')
    })

    tmpdirTest('Gemini: ALL agent body text uses Gemini-native tool names', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      const agentsDir = path.join(tmpdir, '.gemini', 'agents')
      const agentFiles = (await fs.readdir(agentsDir)).filter(f => f.startsWith('gsdr-') && f.endsWith('.md'))

      expect(agentFiles.length, 'should have multiple agent files').toBeGreaterThanOrEqual(3)

      for (const agentFile of agentFiles) {
        const content = await fs.readFile(path.join(agentsDir, agentFile), 'utf8')
        const parts = content.split('---')
        const body = parts.slice(2).join('---')

        // Body text should NOT contain Claude tool names (word-boundary match)
        expect(body, `${agentFile}: should not contain \\bRead\\b`).not.toMatch(/\bRead\b/)
        expect(body, `${agentFile}: should not contain \\bBash\\b`).not.toMatch(/\bBash\b/)
        expect(body, `${agentFile}: should not contain \\bWrite\\b`).not.toMatch(/\bWrite\b/)
        expect(body, `${agentFile}: should not contain \\bGlob\\b`).not.toMatch(/\bGlob\b/)
        expect(body, `${agentFile}: should not contain \\bGrep\\b`).not.toMatch(/\bGrep\b/)
      }
    })

    tmpdirTest('Gemini: agent body text uses Gemini-native tool names after install', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --gemini --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Read the installed planner agent (body references Read, Write, Bash, Glob, Grep)
      const plannerAgent = path.join(tmpdir, '.gemini', 'agents', 'gsdr-planner.md')
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
  // Codex agent TOML literal string safety
  // ---------------------------------------------------------------------------

  describe('Codex agent TOML literal string safety', () => {
    tmpdirTest('Codex agent TOML files use literal strings for backslash safety', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Read the verifier agent (highest backslash density)
      const verifierPath = path.join(tmpdir, '.codex', 'agents', 'gsdr-verifier.toml')
      const exists = await fs.access(verifierPath).then(() => true).catch(() => false)
      expect(exists, 'gsdr-verifier.toml should exist after Codex install').toBe(true)

      const content = await fs.readFile(verifierPath, 'utf8')

      // Must use literal string delimiters ('''), not basic string delimiters (""")
      expect(content).toContain("developer_instructions = '''")
      expect(content).not.toContain('developer_instructions = """')

      // Must contain actual agent content (not empty)
      expect(content).not.toContain('description =')
      expect(content.length).toBeGreaterThan(100)
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
      const opcodeGsd = path.join(opcodeDir, 'get-shit-done-reflect')
      const opcodeFiles = await fs.readdir(opcodeGsd, { recursive: true })
      const opcodeMdFiles = opcodeFiles.filter(f => f.endsWith('.md'))
      for (const file of opcodeMdFiles) {
        const filePath = path.join(opcodeGsd, file)
        const stat = await fs.stat(filePath)
        if (!stat.isFile()) continue
        const content = await fs.readFile(filePath, 'utf8')
        // If file references get-shit-done paths, they should use opencode path
        if (content.includes('/get-shit-done-reflect/') && !content.includes('.gsd/knowledge')) {
          expect(content).not.toContain('~/.claude/get-shit-done')
        }
      }

      // Gemini: should use ~/.gemini/
      const geminiGsd = path.join(geminiDir, 'get-shit-done-reflect')
      const geminiFiles = await fs.readdir(geminiGsd, { recursive: true })
      const geminiMdFiles = geminiFiles.filter(f => f.endsWith('.md'))
      for (const file of geminiMdFiles) {
        const filePath = path.join(geminiGsd, file)
        const stat = await fs.stat(filePath)
        if (!stat.isFile()) continue
        const content = await fs.readFile(filePath, 'utf8')
        if (content.includes('/get-shit-done-reflect/') && !content.includes('.gsd/knowledge')) {
          expect(content).not.toContain('~/.claude/get-shit-done')
        }
      }

      // Codex: should use ~/.codex/
      const codexGsd = path.join(codexDir, 'get-shit-done-reflect')
      const codexFiles = await fs.readdir(codexGsd, { recursive: true })
      const codexMdFiles = codexFiles.filter(f => f.endsWith('.md'))
      for (const file of codexMdFiles) {
        const filePath = path.join(codexGsd, file)
        const stat = await fs.stat(filePath)
        if (!stat.isFile()) continue
        const content = await fs.readFile(filePath, 'utf8')
        if (content.includes('/get-shit-done-reflect/') && !content.includes('.gsd/knowledge')) {
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

      // Claude: .md files in commands/gsdr/
      const claudeCommandsDir = path.join(tmpdir, '.claude', 'commands', 'gsdr')
      const claudeFiles = await fs.readdir(claudeCommandsDir)
      const claudeMdFiles = claudeFiles.filter(f => f.endsWith('.md'))
      expect(claudeMdFiles.length).toBeGreaterThanOrEqual(3)

      // OpenCode: .md files matching gsdr-*.md in command/ (flat)
      const opcodeCommandDir = path.join(configHome, 'opencode', 'command')
      const opcodeFiles = await fs.readdir(opcodeCommandDir)
      const opcodeGsdFiles = opcodeFiles.filter(f => f.startsWith('gsdr-') && f.endsWith('.md'))
      expect(opcodeGsdFiles.length).toBeGreaterThanOrEqual(3)

      // Gemini: .toml files in commands/gsdr/
      const geminiCommandsDir = path.join(tmpdir, '.gemini', 'commands', 'gsdr')
      const geminiFiles = await fs.readdir(geminiCommandsDir)
      const geminiTomlFiles = geminiFiles.filter(f => f.endsWith('.toml'))
      expect(geminiTomlFiles.length).toBeGreaterThanOrEqual(3)
      // No .md files should be in Gemini commands
      const geminiMdFiles = geminiFiles.filter(f => f.endsWith('.md'))
      expect(geminiMdFiles.length).toBe(0)

      // Codex: SKILL.md files in skills/gsdr-*/
      const codexSkillsDir = path.join(tmpdir, '.codex', 'skills')
      const codexEntries = await fs.readdir(codexSkillsDir, { withFileTypes: true })
      const codexSkillDirs = codexEntries.filter(e => e.isDirectory() && e.name.startsWith('gsdr-'))
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

    tmpdirTest('--all install: file name parity across runtimes per category', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      /**
       * Helper: read directory, filter by pattern, strip extensions, return sorted Set.
       */
      function getNameSet(dir, prefix, suffix) {
        if (!fsSync.existsSync(dir)) return new Set()
        const entries = fsSync.readdirSync(dir)
        const matched = entries.filter(f => f.startsWith(prefix) && f.endsWith(suffix))
        return new Set(matched.map(f => {
          // Strip extension (last .xxx)
          const lastDot = f.lastIndexOf('.')
          return lastDot > 0 ? f.substring(0, lastDot) : f
        }))
      }

      /**
       * Helper: get directory names matching prefix.
       */
      function getDirNameSet(dir, prefix) {
        if (!fsSync.existsSync(dir)) return new Set()
        const entries = fsSync.readdirSync(dir, { withFileTypes: true })
        return new Set(
          entries.filter(e => e.isDirectory() && e.name.startsWith(prefix)).map(e => e.name)
        )
      }

      // Known intentional divergences (empty = no exceptions expected)
      const exceptions = {
        agents: [],
        commands: [],
        workflows: [],
        hooks: []
      }

      // --- Agents: All 4 runtimes (Codex uses .toml, others use .md) ---
      const claudeAgents = getNameSet(path.join(tmpdir, '.claude', 'agents'), 'gsdr-', '.md')
      const opcodeAgents = getNameSet(path.join(configHome, 'opencode', 'agents'), 'gsdr-', '.md')
      const geminiAgents = getNameSet(path.join(tmpdir, '.gemini', 'agents'), 'gsdr-', '.md')
      const codexAgents = getNameSet(path.join(tmpdir, '.codex', 'agents'), 'gsdr-', '.toml')

      expect([...claudeAgents].sort(), 'Agent parity: Claude vs OpenCode').toEqual([...opcodeAgents].sort())
      expect([...claudeAgents].sort(), 'Agent parity: Claude vs Gemini').toEqual([...geminiAgents].sort())
      expect([...claudeAgents].sort(), 'Agent parity: Claude vs Codex').toEqual([...codexAgents].sort())

      // --- Workflows: All 4 runtimes use .md (Gemini no longer TOML-converts non-command files) ---
      const claudeWorkflows = getNameSet(path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'workflows'), '', '.md')
      const opcodeWorkflows = getNameSet(path.join(configHome, 'opencode', 'get-shit-done-reflect', 'workflows'), '', '.md')
      const geminiWorkflows = getNameSet(path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'workflows'), '', '.md')
      const codexWorkflows = getNameSet(path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows'), '', '.md')

      expect([...claudeWorkflows].sort(), 'Workflow parity: Claude vs OpenCode').toEqual([...opcodeWorkflows].sort())
      expect([...claudeWorkflows].sort(), 'Workflow parity: Claude vs Gemini').toEqual([...geminiWorkflows].sort())
      expect([...claudeWorkflows].sort(), 'Workflow parity: Claude vs Codex').toEqual([...codexWorkflows].sort())

      // --- Commands: different naming per runtime, compare extension-stripped ---
      // Claude: commands/gsdr/*.md (strip leading path, keep name only)
      const claudeCommands = getNameSet(path.join(tmpdir, '.claude', 'commands', 'gsdr'), '', '.md')
      // OpenCode: command/gsdr-*.md
      const opcodeCommands = getNameSet(path.join(configHome, 'opencode', 'command'), 'gsdr-', '.md')
      // Gemini: commands/gsdr/*.toml
      const geminiCommands = getNameSet(path.join(tmpdir, '.gemini', 'commands', 'gsdr'), '', '.toml')
      // Codex: skills/gsdr-*/ (directory names)
      const codexCommands = getDirNameSet(path.join(tmpdir, '.codex', 'skills'), 'gsdr-')

      // Normalize: Claude and Gemini commands lack gsdr- prefix (nested in gsdr/ subdir),
      // while OpenCode and Codex have gsdr- prefix (flat naming). Add gsdr- prefix to normalize.
      function addGsdPrefix(nameSet) {
        return new Set([...nameSet].map(n => n.startsWith('gsdr-') ? n : `gsdr-${n}`))
      }
      const claudeNorm = addGsdPrefix(claudeCommands)
      const geminiNorm = addGsdPrefix(geminiCommands)

      expect([...claudeNorm].sort(), 'Command parity: Claude vs OpenCode').toEqual([...opcodeCommands].sort())
      expect([...claudeNorm].sort(), 'Command parity: Claude vs Gemini').toEqual([...geminiNorm].sort())
      expect([...claudeNorm].sort(), 'Command parity: Claude vs Codex').toEqual([...codexCommands].sort())

      // --- Hooks: Claude, OpenCode, Gemini (Codex excluded -- no hooks) ---
      const claudeHooks = getNameSet(path.join(tmpdir, '.claude', 'hooks'), 'gsdr-', '.js')
      const opcodeHooks = getNameSet(path.join(configHome, 'opencode', 'hooks'), 'gsdr-', '.js')
      const geminiHooks = getNameSet(path.join(tmpdir, '.gemini', 'hooks'), 'gsdr-', '.js')

      expect([...claudeHooks].sort(), 'Hook parity: Claude vs OpenCode').toEqual([...opcodeHooks].sort())
      expect([...claudeHooks].sort(), 'Hook parity: Claude vs Gemini').toEqual([...geminiHooks].sort())
    })

    tmpdirTest('--all install: hook files match hook registrations in settings.json', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // For Claude and Gemini: validate settings.json hook registrations match actual hook files
      const runtimes = [
        { name: 'Claude', settingsPath: path.join(tmpdir, '.claude', 'settings.json'), hooksDir: path.join(tmpdir, '.claude', 'hooks') },
        { name: 'Gemini', settingsPath: path.join(tmpdir, '.gemini', 'settings.json'), hooksDir: path.join(tmpdir, '.gemini', 'hooks') },
      ]

      for (const rt of runtimes) {
        const settings = JSON.parse(await fs.readFile(rt.settingsPath, 'utf8'))

        // Extract hook filenames from settings.json hook commands
        // Structure: hooks.EventType[] -> { hooks: [{ type, command }] }
        const registeredHooks = new Set()
        const hooks = settings.hooks || {}
        for (const eventType of Object.keys(hooks)) {
          const eventHooks = hooks[eventType]
          if (!Array.isArray(eventHooks)) continue
          for (const hookEntry of eventHooks) {
            // Each hookEntry has a nested hooks array with {type, command}
            const innerHooks = hookEntry.hooks || []
            for (const inner of innerHooks) {
              const command = inner.command || ''
              const match = command.match(/gsdr-[\w-]+\.js/)
              if (match) registeredHooks.add(match[0])
            }
            // Also check direct command (in case structure varies)
            const directCommand = hookEntry.command || ''
            const directMatch = directCommand.match(/gsdr-[\w-]+\.js/)
            if (directMatch) registeredHooks.add(directMatch[0])
          }
        }

        // Collect actual hook files
        const actualHookFiles = (await fs.readdir(rt.hooksDir))
          .filter(f => f.startsWith('gsdr-') && f.endsWith('.js'))
        const actualHookSet = new Set(actualHookFiles)

        // Every registered hook must have a corresponding file
        // (catches: settings.json references a hook that wasn't built/copied)
        for (const registered of registeredHooks) {
          expect(actualHookSet.has(registered), `${rt.name}: registered hook ${registered} should have corresponding file`).toBe(true)
        }

        // At least one hook should be registered (sanity check)
        expect(registeredHooks.size, `${rt.name}: should have at least 1 registered hook`).toBeGreaterThanOrEqual(1)

        // Note: not all hook files need settings.json registration (e.g., gsd-statusline.js
        // is a notification hook invoked via a different mechanism). We only assert the
        // "registered -> file exists" direction to catch the build-hooks.js sync bug class.
      }
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
        path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'VERSION'),
        path.join(configHome, 'opencode', 'get-shit-done-reflect', 'VERSION'),
        path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'VERSION'),
        path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'VERSION'),
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

  // ---------------------------------------------------------------------------
  // Cross-runtime parity enforcement
  // ---------------------------------------------------------------------------

  describe('Cross-runtime parity enforcement', () => {
    const SUPPORTED_RUNTIMES = ['claude', 'opencode', 'gemini', 'codex']

    const INTENTIONAL_DIVERGENCES = {
      agentExtensions: {
        claude: '.md', opencode: '.md', gemini: '.md', codex: '.toml',
        // WHY: Codex uses TOML config files for agents, others use markdown
      },
      commandStructure: {
        claude: { dir: 'commands/gsdr', nested: true },
        opencode: { dir: 'command', nested: false },
        gemini: { dir: 'commands/gsdr', nested: true },
        codex: { dir: 'skills', nested: false },
        // WHY: Each runtime has its own command/skill format
      },
      hooksSupport: {
        claude: true, opencode: false, gemini: true, codex: false,
        // WHY: OpenCode has no settings.json hook system, Codex has no hook support
      },
      codexAgentsMd: true,
      // WHY: Codex benefits from a consolidated AGENTS.md alongside individual .toml files
    }

    tmpdirTest('artifact count parity across runtimes', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Define paths for each runtime's artifact categories
      const runtimePaths = {
        claude: {
          agents: path.join(tmpdir, '.claude', 'agents'),
          workflows: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'workflows'),
          references: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'references'),
          templates: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'templates'),
        },
        opencode: {
          agents: path.join(configHome, 'opencode', 'agents'),
          workflows: path.join(configHome, 'opencode', 'get-shit-done-reflect', 'workflows'),
          references: path.join(configHome, 'opencode', 'get-shit-done-reflect', 'references'),
          templates: path.join(configHome, 'opencode', 'get-shit-done-reflect', 'templates'),
        },
        gemini: {
          agents: path.join(tmpdir, '.gemini', 'agents'),
          workflows: path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'workflows'),
          references: path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'references'),
          templates: path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'templates'),
        },
        codex: {
          agents: path.join(tmpdir, '.codex', 'agents'),
          workflows: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows'),
          references: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'references'),
          templates: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'templates'),
        },
      }

      // Count agents per runtime (using runtime-specific extensions)
      const agentCounts = {}
      for (const runtime of SUPPORTED_RUNTIMES) {
        const ext = INTENTIONAL_DIVERGENCES.agentExtensions[runtime]
        const dir = runtimePaths[runtime].agents
        if (!fsSync.existsSync(dir)) {
          agentCounts[runtime] = 0
          continue
        }
        const entries = fsSync.readdirSync(dir)
        agentCounts[runtime] = entries.filter(f => f.startsWith('gsdr-') && f.endsWith(ext)).length
      }

      // All runtimes should have the same agent count
      const refAgentCount = agentCounts.claude
      expect(refAgentCount, 'Claude should have at least 1 agent').toBeGreaterThanOrEqual(1)
      for (const runtime of SUPPORTED_RUNTIMES) {
        expect(agentCounts[runtime], `Agent count parity: ${runtime} (${agentCounts[runtime]}) vs claude (${refAgentCount})`).toBe(refAgentCount)
      }

      // Count shared categories (workflows, references, templates) -- all use .md
      for (const category of ['workflows', 'references', 'templates']) {
        const counts = {}
        for (const runtime of SUPPORTED_RUNTIMES) {
          const dir = runtimePaths[runtime][category]
          if (!fsSync.existsSync(dir)) {
            counts[runtime] = 0
            continue
          }
          const entries = fsSync.readdirSync(dir)
          counts[runtime] = entries.filter(f => f.endsWith('.md')).length
        }

        const refCount = counts.claude
        expect(refCount, `Claude should have at least 1 ${category} file`).toBeGreaterThanOrEqual(1)
        for (const runtime of SUPPORTED_RUNTIMES) {
          expect(counts[runtime], `${category} count parity: ${runtime} (${counts[runtime]}) vs claude (${refCount})`).toBe(refCount)
        }
      }
    })

    tmpdirTest('agent name set equivalence across runtimes', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Extract agent names per runtime, stripping runtime-specific extension
      function getAgentNames(dir, ext) {
        if (!fsSync.existsSync(dir)) return []
        const entries = fsSync.readdirSync(dir)
        return entries
          .filter(f => f.startsWith('gsdr-') && f.endsWith(ext))
          .map(f => f.substring(0, f.lastIndexOf('.')))
          .sort()
      }

      const agentSets = {}
      const agentDirs = {
        claude: path.join(tmpdir, '.claude', 'agents'),
        opencode: path.join(configHome, 'opencode', 'agents'),
        gemini: path.join(tmpdir, '.gemini', 'agents'),
        codex: path.join(tmpdir, '.codex', 'agents'),
      }

      for (const runtime of SUPPORTED_RUNTIMES) {
        const ext = INTENTIONAL_DIVERGENCES.agentExtensions[runtime]
        agentSets[runtime] = getAgentNames(agentDirs[runtime], ext)
      }

      // All runtimes should have the identical sorted name list
      expect(agentSets.claude.length, 'should have at least 1 agent').toBeGreaterThanOrEqual(1)
      expect(agentSets.opencode, 'Agent names: OpenCode vs Claude').toEqual(agentSets.claude)
      expect(agentSets.gemini, 'Agent names: Gemini vs Claude').toEqual(agentSets.claude)
      expect(agentSets.codex, 'Agent names: Codex vs Claude').toEqual(agentSets.claude)
    })

    tmpdirTest('content quality: runtime-specific transformations applied', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // 1. Gemini agents: no ${} template patterns in body
      const geminiAgentsDir = path.join(tmpdir, '.gemini', 'agents')
      const geminiAgentFiles = fsSync.readdirSync(geminiAgentsDir)
        .filter(f => f.startsWith('gsdr-') && f.endsWith('.md'))
      expect(geminiAgentFiles.length, 'should have Gemini agent files').toBeGreaterThanOrEqual(1)

      for (const agentFile of geminiAgentFiles) {
        const content = await fs.readFile(path.join(geminiAgentsDir, agentFile), 'utf8')
        // Separate frontmatter from body (split on ---)
        const parts = content.split('---')
        const body = parts.slice(2).join('---')
        // Strip fenced code blocks before checking -- bash ${ARRAY[@]} syntax
        // inside code examples is intentional, not leaked template variables
        const bodyWithoutCodeBlocks = body.replace(/```[\s\S]*?```/g, '')
        const templateVarMatches = bodyWithoutCodeBlocks.match(/\$\{[^}]+\}/g)
        expect(templateVarMatches, `Gemini ${agentFile}: body should have no \${} template variables outside code blocks (found: ${templateVarMatches})`).toBeNull()
      }

      // 2. Codex workflows: actual command invocations use $gsdr- not /gsdr:
      // Note: /gsdr: may appear in prose documenting other runtimes' syntax.
      // We check for actual command invocation patterns: /gsdr:verb-name
      const codexWorkflowsDir = path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows')
      const codexWorkflowFiles = fsSync.readdirSync(codexWorkflowsDir)
        .filter(f => f.endsWith('.md'))

      for (const wfFile of codexWorkflowFiles) {
        const content = await fs.readFile(path.join(codexWorkflowsDir, wfFile), 'utf8')
        // Check for /gsdr: used as actual command invocations (e.g., /gsdr:plan-phase, /gsdr:execute-phase)
        // These are the patterns that should have been converted to $gsdr-plan-phase etc.
        // Exclude prose/documentation references like "command prefix: /gsdr:" or lists of syntax formats
        const commandInvocations = content.match(/\/gsdr:[a-z][\w-]*/g)
        expect(commandInvocations, `Codex workflow ${wfFile}: should NOT contain /gsdr: command invocations (found: ${commandInvocations})`).toBeNull()
      }

      // 3. OpenCode agents: no skills: in frontmatter
      const opcodeAgentsDir = path.join(configHome, 'opencode', 'agents')
      const opcodeAgentFiles = fsSync.readdirSync(opcodeAgentsDir)
        .filter(f => f.startsWith('gsdr-') && f.endsWith('.md'))
      expect(opcodeAgentFiles.length, 'should have OpenCode agent files').toBeGreaterThanOrEqual(1)

      for (const agentFile of opcodeAgentFiles) {
        const content = await fs.readFile(path.join(opcodeAgentsDir, agentFile), 'utf8')
        // Extract frontmatter (between first and second ---)
        const parts = content.split('---')
        if (parts.length >= 3) {
          const frontmatter = parts[1]
          expect(frontmatter, `OpenCode ${agentFile}: frontmatter should NOT contain skills:`).not.toContain('skills:')
        }
      }

      // 4. Codex agent TOMLs: contain sandbox_mode =
      const codexAgentsDir = path.join(tmpdir, '.codex', 'agents')
      const codexAgentFiles = fsSync.readdirSync(codexAgentsDir)
        .filter(f => f.startsWith('gsdr-') && f.endsWith('.toml'))
      expect(codexAgentFiles.length, 'should have Codex agent TOML files').toBeGreaterThanOrEqual(1)

      for (const agentFile of codexAgentFiles) {
        const content = await fs.readFile(path.join(codexAgentsDir, agentFile), 'utf8')
        expect(content, `Codex ${agentFile}: should contain sandbox_mode =`).toContain('sandbox_mode =')
      }
    })

    tmpdirTest('new runtime detection: unknown runtime directories flagged', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Known directories that are expected after --all install
      const knownDirs = new Set([
        '.claude', '.codex', '.gemini', '.config', '.gsd',
        '.npm', '.node_modules',
      ])

      // Plausible future runtime directories to watch for
      const futureRuntimePatterns = ['.copilot', '.cursor', '.windsurf', '.agent', '.aide']

      // Scan tmpdir for hidden directories
      const entries = fsSync.readdirSync(tmpdir, { withFileTypes: true })
      const hiddenDirs = entries
        .filter(e => e.isDirectory() && e.name.startsWith('.'))
        .map(e => e.name)

      // Flag any hidden directory that matches a future runtime pattern
      const unexpectedRuntimes = hiddenDirs.filter(
        dir => futureRuntimePatterns.includes(dir) && !knownDirs.has(dir)
      )

      expect(
        unexpectedRuntimes,
        `Detected runtime directory ${unexpectedRuntimes.join(', ')} not in SUPPORTED_RUNTIMES -- add parity coverage`
      ).toHaveLength(0)

      // Also flag any completely unknown hidden directory not in knownDirs
      // (catches installer producing unexpected output)
      const unknownDirs = hiddenDirs.filter(dir => !knownDirs.has(dir))
      // Only warn about unknown dirs that look like they could be runtimes
      // (have agents/ or get-shit-done-reflect/ subdir)
      const suspiciousUnknown = unknownDirs.filter(dir => {
        const dirPath = path.join(tmpdir, dir)
        return fsSync.existsSync(path.join(dirPath, 'agents')) ||
               fsSync.existsSync(path.join(dirPath, 'get-shit-done-reflect'))
      })

      expect(
        suspiciousUnknown,
        `Unknown directories with runtime-like structure: ${suspiciousUnknown.join(', ')} -- investigate and add to SUPPORTED_RUNTIMES or knownDirs`
      ).toHaveLength(0)
    })
  })
})
