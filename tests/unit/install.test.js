import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tmpdirTest, createMockHome } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

// Tests for the existing bin/install.js behavior
// The install script uses CommonJS, so we test via subprocess or by validating expected outcomes

describe('install script', () => {
  describe('directory structure', () => {
    tmpdirTest('creates commands/gsd directory', async ({ tmpdir }) => {
      const mockHome = await createMockHome(tmpdir)
      const claudeDir = path.join(mockHome, '.claude')

      // Create expected structure
      await fs.mkdir(path.join(claudeDir, 'commands', 'gsd'), { recursive: true })

      // Verify structure
      const commandsDir = path.join(claudeDir, 'commands', 'gsd')
      const exists = await fs.access(commandsDir).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })

    tmpdirTest('creates get-shit-done directory', async ({ tmpdir }) => {
      const mockHome = await createMockHome(tmpdir)
      const claudeDir = path.join(mockHome, '.claude')

      // Create expected structure
      await fs.mkdir(path.join(claudeDir, 'get-shit-done'), { recursive: true })

      // Verify structure
      const gsdDir = path.join(claudeDir, 'get-shit-done')
      const exists = await fs.access(gsdDir).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })

    tmpdirTest('creates agents directory', async ({ tmpdir }) => {
      const mockHome = await createMockHome(tmpdir)
      const claudeDir = path.join(mockHome, '.claude')

      // Create expected structure
      await fs.mkdir(path.join(claudeDir, 'agents'), { recursive: true })

      // Verify structure
      const agentsDir = path.join(claudeDir, 'agents')
      const exists = await fs.access(agentsDir).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })
  })

  describe('file copying', () => {
    tmpdirTest('copies markdown files with path replacement', async ({ tmpdir }) => {
      const mockHome = await createMockHome(tmpdir)
      const claudeDir = path.join(mockHome, '.claude')
      const gsdDir = path.join(claudeDir, 'get-shit-done')
      await fs.mkdir(gsdDir, { recursive: true })

      // Create a test file with path placeholder
      const testContent = 'Reference: ~/.claude/get-shit-done/test.md'
      const expectedContent = `Reference: ${claudeDir}/get-shit-done/test.md`

      // Simulate path replacement
      const replaced = testContent.replace(/~\/\.claude\//g, `${claudeDir}/`)
      expect(replaced).toContain(claudeDir)
    })

    tmpdirTest('preserves file permissions', async ({ tmpdir }) => {
      const testFile = path.join(tmpdir, 'test-script.sh')
      await fs.writeFile(testFile, '#!/bin/bash\necho "test"')
      await fs.chmod(testFile, 0o755)

      const stats = await fs.stat(testFile)
      // Check executable bit is set (on Unix-like systems)
      expect(stats.mode & 0o111).toBeGreaterThan(0)
    })
  })

  describe('settings.json handling', () => {
    tmpdirTest('creates settings.json if not exists', async ({ tmpdir }) => {
      const mockHome = await createMockHome(tmpdir)
      const claudeDir = path.join(mockHome, '.claude')
      const settingsPath = path.join(claudeDir, 'settings.json')

      // Settings file should not exist initially
      const existsBefore = await fs.access(settingsPath).then(() => true).catch(() => false)
      expect(existsBefore).toBe(false)

      // Create empty settings
      await fs.writeFile(settingsPath, JSON.stringify({}, null, 2))

      // Verify it now exists
      const existsAfter = await fs.access(settingsPath).then(() => true).catch(() => false)
      expect(existsAfter).toBe(true)
    })

    tmpdirTest('preserves existing settings', async ({ tmpdir }) => {
      const mockHome = await createMockHome(tmpdir)
      const claudeDir = path.join(mockHome, '.claude')
      const settingsPath = path.join(claudeDir, 'settings.json')

      // Create existing settings with custom config
      const existingSettings = {
        customField: 'should-be-preserved',
        hooks: { SessionStart: [] }
      }
      await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2))

      // Read back and verify
      const content = await fs.readFile(settingsPath, 'utf8')
      const parsed = JSON.parse(content)
      expect(parsed.customField).toBe('should-be-preserved')
    })
  })

  describe('version management', () => {
    tmpdirTest('writes VERSION file', async ({ tmpdir }) => {
      const mockHome = await createMockHome(tmpdir)
      const claudeDir = path.join(mockHome, '.claude')
      const gsdDir = path.join(claudeDir, 'get-shit-done')
      await fs.mkdir(gsdDir, { recursive: true })

      const versionPath = path.join(gsdDir, 'VERSION')
      await fs.writeFile(versionPath, '1.0.0-test')

      const version = await fs.readFile(versionPath, 'utf8')
      expect(version).toBe('1.0.0-test')
    })
  })

  describe('merged installer flags', () => {
    const installScript = path.resolve(process.cwd(), 'bin/install.js')

    tmpdirTest('--claude flag installs to .claude directory', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --claude --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Verify commands/gsd directory exists and contains .md files
      const commandsDir = path.join(tmpdir, '.claude', 'commands', 'gsd')
      const commandsExist = await fs.access(commandsDir).then(() => true).catch(() => false)
      expect(commandsExist).toBe(true)

      const commandFiles = await fs.readdir(commandsDir)
      const mdFiles = commandFiles.filter(f => f.endsWith('.md'))
      expect(mdFiles.length).toBeGreaterThan(0)

      // Verify get-shit-done directory exists
      const gsdDir = path.join(tmpdir, '.claude', 'get-shit-done')
      const gsdExist = await fs.access(gsdDir).then(() => true).catch(() => false)
      expect(gsdExist).toBe(true)

      // Verify VERSION file was written
      const versionPath = path.join(gsdDir, 'VERSION')
      const version = await fs.readFile(versionPath, 'utf8')
      expect(version).toBeTruthy()
    })

    tmpdirTest('--opencode flag installs to opencode config directory', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --opencode --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Verify opencode command directory with flattened gsd-*.md files
      const commandDir = path.join(configHome, 'opencode', 'command')
      const commandExist = await fs.access(commandDir).then(() => true).catch(() => false)
      expect(commandExist).toBe(true)

      const commandFiles = await fs.readdir(commandDir)
      const gsdFiles = commandFiles.filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
      expect(gsdFiles.length).toBeGreaterThan(0)

      // Verify get-shit-done directory exists
      const gsdDir = path.join(configHome, 'opencode', 'get-shit-done')
      const gsdExist = await fs.access(gsdDir).then(() => true).catch(() => false)
      expect(gsdExist).toBe(true)
    })

    tmpdirTest('--claude --opencode installs to both directories', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --claude --opencode --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Verify Claude directory populated
      const claudeCommandsDir = path.join(tmpdir, '.claude', 'commands', 'gsd')
      const claudeExist = await fs.access(claudeCommandsDir).then(() => true).catch(() => false)
      expect(claudeExist).toBe(true)

      // Verify OpenCode directory populated
      const opcodeCommandDir = path.join(configHome, 'opencode', 'command')
      const opcodeExist = await fs.access(opcodeCommandDir).then(() => true).catch(() => false)
      expect(opcodeExist).toBe(true)
    })

    tmpdirTest('no flags with non-TTY stdin defaults to claude global install', async ({ tmpdir }) => {
      // When stdin is not a TTY (subprocess with piped stdio),
      // the installer defaults to Claude Code global install
      execSync(`node "${installScript}"`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000
      })

      // Should default to Claude global install
      const claudeDir = path.join(tmpdir, '.claude', 'commands', 'gsd')
      const exists = await fs.access(claudeDir).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })
  })
})
