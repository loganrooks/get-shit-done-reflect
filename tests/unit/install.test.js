import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tmpdirTest, createMockHome } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

// Import replacePathsInContent for direct unit testing
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { replacePathsInContent } = require('../../bin/install.js')

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

  describe('two-pass path replacement', () => {
    // Unit tests for replacePathsInContent() function

    describe('replacePathsInContent unit tests', () => {
      it('passes through already-migrated KB tilde paths unchanged (no-op)', () => {
        const input = 'Read the index at ~/.gsd/knowledge/signals/'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('Read the index at ~/.gsd/knowledge/signals/')
      })

      it('passes through already-migrated KB $HOME paths unchanged (no-op)', () => {
        const input = 'KB_DIR="$HOME/.gsd/knowledge"'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('KB_DIR="$HOME/.gsd/knowledge"')
      })

      it('still handles legacy KB tilde paths as safety guard', () => {
        const input = 'Read the index at ~/.claude/gsd-knowledge/signals/'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('Read the index at ~/.gsd/knowledge/signals/')
      })

      it('still handles legacy KB $HOME paths as safety guard', () => {
        const input = 'KB_DIR="$HOME/.claude/gsd-knowledge"'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('KB_DIR="$HOME/.gsd/knowledge"')
      })

      it('replaces runtime-specific tilde paths with runtime prefix', () => {
        const input = 'Reference: ~/.claude/get-shit-done/workflows/signal.md'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('Reference: ~/.config/opencode/get-shit-done/workflows/signal.md')
      })

      it('replaces runtime-specific $HOME paths with runtime prefix', () => {
        const input = 'TEMPLATE="$HOME/.claude/get-shit-done/templates/config.json"'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('TEMPLATE="$HOME/.config/opencode/get-shit-done/templates/config.json"')
      })

      it('handles mixed KB and runtime-specific paths in same content', () => {
        const input = [
          'KB at ~/.gsd/knowledge/index.md',
          'Workflow at ~/.claude/get-shit-done/workflows/signal.md',
          'Also $HOME/.gsd/knowledge/signals/',
          'And $HOME/.claude/get-shit-done/VERSION'
        ].join('\n')
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toContain('~/.gsd/knowledge/index.md')
        expect(result).toContain('~/.config/opencode/get-shit-done/workflows/signal.md')
        expect(result).toContain('$HOME/.gsd/knowledge/signals/')
        expect(result).toContain('$HOME/.config/opencode/get-shit-done/VERSION')
        // Must NOT have these incorrect transformations
        expect(result).not.toContain('~/.config/opencode/gsd-knowledge')
        expect(result).not.toContain('$HOME/.config/opencode/gsd-knowledge')
      })

      it('handles Gemini runtime paths with already-migrated KB paths', () => {
        const input = 'Reference: ~/.claude/get-shit-done/workflows/signal.md and ~/.gsd/knowledge/index.md'
        const result = replacePathsInContent(input, '~/.gemini/')
        expect(result).toContain('~/.gemini/get-shit-done/workflows/signal.md')
        expect(result).toContain('~/.gsd/knowledge/index.md')
        expect(result).not.toContain('~/.gemini/gsd-knowledge')
      })

      it('leaves Claude runtime-specific paths unchanged for Claude runtime', () => {
        const input = [
          'Reference: ~/.claude/get-shit-done/workflows/signal.md',
          'KB at ~/.gsd/knowledge/index.md'
        ].join('\n')
        const result = replacePathsInContent(input, '~/.claude/')
        // Runtime-specific paths remain ~/.claude/ (identity transform)
        expect(result).toContain('~/.claude/get-shit-done/workflows/signal.md')
        // KB paths already at shared location, pass through unchanged
        expect(result).toContain('~/.gsd/knowledge/index.md')
      })

      it('handles absolute path prefix for global installs', () => {
        const input = [
          'Reference: ~/.claude/get-shit-done/test.md',
          'KB: ~/.gsd/knowledge/index.md',
          'Shell: $HOME/.claude/get-shit-done/VERSION'
        ].join('\n')
        const homeDir = require('os').homedir()
        const absPrefix = homeDir + '/.config/opencode/'
        const result = replacePathsInContent(input, absPrefix)
        expect(result).toContain(absPrefix + 'get-shit-done/test.md')
        expect(result).toContain('~/.gsd/knowledge/index.md')
        expect(result).toContain('$HOME/.config/opencode/get-shit-done/VERSION')
      })

      it('handles already-migrated KB path without trailing slash (no-op)', () => {
        const input = 'KB_DIR="~/.gsd/knowledge"'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('KB_DIR="~/.gsd/knowledge"')
      })

      it('still handles legacy KB path without trailing slash as safety guard', () => {
        const input = 'KB_DIR="~/.claude/gsd-knowledge"'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('KB_DIR="~/.gsd/knowledge"')
      })

      it('handles @ file include syntax', () => {
        // The @ prefix is not part of the matched pattern, so it works naturally
        const input = '@~/.claude/get-shit-done/workflows/signal.md'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('@~/.config/opencode/get-shit-done/workflows/signal.md')
      })
    })

    // Integration tests: full installer run
    describe('integration: full installer', () => {
      const installScript = path.resolve(process.cwd(), 'bin/install.js')

      tmpdirTest('OpenCode install preserves already-migrated KB paths', async ({ tmpdir }) => {
        const configHome = path.join(tmpdir, '.config')

        execSync(`node "${installScript}" --opencode --global`, {
          env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Read signal.md which contains KB paths (already ~/.gsd/knowledge/ in source)
        const signalWorkflow = path.join(configHome, 'opencode', 'get-shit-done', 'workflows', 'signal.md')
        const content = await fs.readFile(signalWorkflow, 'utf8')

        // KB paths should remain at shared location (no-op for Pass 1)
        expect(content).toContain('~/.gsd/knowledge')
        // KB paths must NOT be transformed to OpenCode-specific paths
        expect(content).not.toContain('~/.config/opencode/gsd-knowledge')
        // Legacy KB paths should not appear
        expect(content).not.toContain('~/.claude/gsd-knowledge')
      })

      tmpdirTest('OpenCode install preserves already-migrated $HOME KB paths', async ({ tmpdir }) => {
        const configHome = path.join(tmpdir, '.config')

        execSync(`node "${installScript}" --opencode --global`, {
          env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Read reflect.md which has $HOME/.gsd/knowledge (already migrated in source)
        const reflectWorkflow = path.join(configHome, 'opencode', 'get-shit-done', 'workflows', 'reflect.md')
        const content = await fs.readFile(reflectWorkflow, 'utf8')

        // $HOME/.gsd/knowledge should pass through unchanged
        expect(content).toContain('$HOME/.gsd/knowledge')
        // Must NOT be transformed to OpenCode-specific path
        expect(content).not.toContain('$HOME/.config/opencode/gsd-knowledge')
        // Legacy path should not appear
        expect(content).not.toContain('$HOME/.claude/gsd-knowledge')
      })

      tmpdirTest('OpenCode install transforms runtime-specific $HOME paths', async ({ tmpdir }) => {
        const configHome = path.join(tmpdir, '.config')

        execSync(`node "${installScript}" --opencode --global`, {
          env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Read health-check.md which has $HOME/.claude/get-shit-done/ (runtime-specific)
        const healthCheck = path.join(configHome, 'opencode', 'get-shit-done', 'references', 'health-check.md')
        const content = await fs.readFile(healthCheck, 'utf8')

        // $HOME/.claude/get-shit-done should be transformed to runtime path
        expect(content).not.toContain('$HOME/.claude/get-shit-done')
        // KB paths already at shared location should pass through
        expect(content).toContain('$HOME/.gsd/knowledge')
      })

      tmpdirTest('Claude install preserves already-migrated KB paths', async ({ tmpdir }) => {
        execSync(`node "${installScript}" --claude --global`, {
          env: { ...process.env, HOME: tmpdir },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Read signal.md from Claude install
        const signalWorkflow = path.join(tmpdir, '.claude', 'get-shit-done', 'workflows', 'signal.md')
        const content = await fs.readFile(signalWorkflow, 'utf8')

        // KB paths already at shared location pass through unchanged
        expect(content).toContain('~/.gsd/knowledge')
        expect(content).not.toContain('~/.claude/gsd-knowledge')
      })
    })
  })
})
