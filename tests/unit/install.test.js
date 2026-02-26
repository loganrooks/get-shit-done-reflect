import { describe, it, expect, vi } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

import fsSync from 'node:fs'
import os from 'node:os'

// Import functions for direct unit testing
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { replacePathsInContent, injectVersionScope, getGsdHome, migrateKB, countKBEntries, convertClaudeToCodexSkill, copyCodexSkills, generateCodexAgentsMd, generateCodexMcpConfig, convertClaudeToGeminiAgent, safeFs } = require('../../bin/install.js')

// Tests for the existing bin/install.js behavior
// The install script uses CommonJS, so we test via subprocess or by validating expected outcomes

describe('install script', () => {
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

      it('preserves bare ~/.claude/ in documentation text (space after slash)', () => {
        const input = '~/.claude/ = claude-code provenance'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('~/.claude/ = claude-code provenance')
      })

      it('preserves $HOME/.claude/ in documentation text (space after slash)', () => {
        const input = '$HOME/.claude/ paths -> runtime paths'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('$HOME/.claude/ paths -> runtime paths')
      })

      it('still replaces ~/.claude/ followed by path component', () => {
        const input = '~/.claude/get-shit-done/VERSION'
        const result = replacePathsInContent(input, '~/.config/opencode/')
        expect(result).toBe('~/.config/opencode/get-shit-done/VERSION')
      })
    })

    describe('injectVersionScope unit tests', () => {
      const cmd = (desc) => `---\nname: gsd:test\ndescription: ${desc}\n---\nBody content`

      it('appends version to description without scope', () => {
        const result = injectVersionScope(cmd('Do something cool'), '1.15.5', 'local')
        expect(result).toContain('description: Do something cool (v1.15.5)')
        expect(result).not.toContain('local')
        expect(result).not.toContain('global')
      })

      it('strips old version+scope suffix before injecting', () => {
        const result = injectVersionScope(cmd('Do something cool (v1.15.4 local)'), '1.15.5', 'local')
        expect(result).toContain('description: Do something cool (v1.15.5)')
        expect(result).not.toContain('v1.15.4')
        expect(result).not.toContain('local')
      })

      it('strips old version-only suffix before injecting', () => {
        const result = injectVersionScope(cmd('Do something cool (v1.15.4)'), '1.15.5', 'global')
        expect(result).toContain('description: Do something cool (v1.15.5)')
        expect(result).not.toContain('v1.15.4')
      })

      it('ignores scope parameter (does not include it in output)', () => {
        const local = injectVersionScope(cmd('Test'), '1.15.5', 'local')
        const global = injectVersionScope(cmd('Test'), '1.15.5', 'global')
        expect(local).toBe(global)
      })

      it('returns content unchanged when no frontmatter', () => {
        const input = 'No frontmatter here'
        expect(injectVersionScope(input, '1.15.5', 'local')).toBe(input)
      })

      it('returns content unchanged when frontmatter has no closing ---', () => {
        const input = '---\nname: gsd:test\ndescription: broken'
        expect(injectVersionScope(input, '1.15.5', 'local')).toBe(input)
      })

      it('preserves body content after frontmatter', () => {
        const result = injectVersionScope(cmd('Test'), '1.15.5', 'local')
        expect(result).toContain('Body content')
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

        // Read reflect.md which contains KB paths (already ~/.gsd/knowledge/ in source)
        const reflectWorkflow = path.join(configHome, 'opencode', 'get-shit-done', 'workflows', 'reflect.md')
        const content = await fs.readFile(reflectWorkflow, 'utf8')

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

        // Read reflect.md from Claude install
        const reflectWorkflow = path.join(tmpdir, '.claude', 'get-shit-done', 'workflows', 'reflect.md')
        const content = await fs.readFile(reflectWorkflow, 'utf8')

        // KB paths already at shared location pass through unchanged
        expect(content).toContain('~/.gsd/knowledge')
        expect(content).not.toContain('~/.claude/gsd-knowledge')
      })
    })
  })

  describe('KB migration', () => {
    // Helper to set HOME for migration tests and restore after
    function withMockHome(tmpdir, fn) {
      const origHome = process.env.HOME
      process.env.HOME = tmpdir
      try {
        return fn()
      } finally {
        process.env.HOME = origHome
      }
    }

    describe('getGsdHome()', () => {
      it('returns ~/.gsd by default when GSD_HOME not set', () => {
        const origGsdHome = process.env.GSD_HOME
        delete process.env.GSD_HOME
        try {
          const result = getGsdHome()
          expect(result).toBe(path.join(os.homedir(), '.gsd'))
        } finally {
          if (origGsdHome !== undefined) {
            process.env.GSD_HOME = origGsdHome
          }
        }
      })

      it('returns custom path when GSD_HOME is set', () => {
        const origGsdHome = process.env.GSD_HOME
        process.env.GSD_HOME = '/custom/gsd/path'
        try {
          const result = getGsdHome()
          expect(result).toBe('/custom/gsd/path')
        } finally {
          if (origGsdHome !== undefined) {
            process.env.GSD_HOME = origGsdHome
          } else {
            delete process.env.GSD_HOME
          }
        }
      })

      it('expands tilde in GSD_HOME value', () => {
        const origGsdHome = process.env.GSD_HOME
        process.env.GSD_HOME = '~/custom-gsd'
        try {
          const result = getGsdHome()
          expect(result).toBe(path.join(os.homedir(), 'custom-gsd'))
        } finally {
          if (origGsdHome !== undefined) {
            process.env.GSD_HOME = origGsdHome
          } else {
            delete process.env.GSD_HOME
          }
        }
      })
    })

    describe('countKBEntries()', () => {
      tmpdirTest('returns 0 for empty KB directory', async ({ tmpdir }) => {
        const kbDir = path.join(tmpdir, 'knowledge')
        fsSync.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
        fsSync.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
        fsSync.mkdirSync(path.join(kbDir, 'lessons'), { recursive: true })

        expect(countKBEntries(kbDir)).toBe(0)
      })

      tmpdirTest('counts .md files across subdirectories', async ({ tmpdir }) => {
        const kbDir = path.join(tmpdir, 'knowledge')
        fsSync.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
        fsSync.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
        fsSync.mkdirSync(path.join(kbDir, 'lessons'), { recursive: true })

        // Add some .md files
        fsSync.writeFileSync(path.join(kbDir, 'signals', 'sig-001.md'), 'signal content')
        fsSync.writeFileSync(path.join(kbDir, 'signals', 'sig-002.md'), 'signal content')
        fsSync.writeFileSync(path.join(kbDir, 'spikes', 'spk-001.md'), 'spike content')
        fsSync.writeFileSync(path.join(kbDir, 'lessons', 'les-001.md'), 'lesson content')

        expect(countKBEntries(kbDir)).toBe(4)
      })

      tmpdirTest('ignores non-.md files', async ({ tmpdir }) => {
        const kbDir = path.join(tmpdir, 'knowledge')
        fsSync.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })

        fsSync.writeFileSync(path.join(kbDir, 'signals', 'sig-001.md'), 'signal')
        fsSync.writeFileSync(path.join(kbDir, 'signals', 'index.json'), '{}')
        fsSync.writeFileSync(path.join(kbDir, 'signals', 'notes.txt'), 'notes')

        expect(countKBEntries(kbDir)).toBe(1)
      })

      tmpdirTest('handles missing subdirectories gracefully', async ({ tmpdir }) => {
        const kbDir = path.join(tmpdir, 'knowledge')
        // Only create signals, not spikes or lessons
        fsSync.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
        fsSync.writeFileSync(path.join(kbDir, 'signals', 'sig-001.md'), 'content')

        expect(countKBEntries(kbDir)).toBe(1)
      })
    })

    describe('migrateKB()', () => {
      tmpdirTest('creates KB directory structure on fresh install (no old KB)', async ({ tmpdir }) => {
        withMockHome(tmpdir, () => {
          const gsdHome = path.join(tmpdir, '.gsd')
          migrateKB(gsdHome, [])

          expect(fsSync.existsSync(path.join(gsdHome, 'knowledge', 'signals'))).toBe(true)
          expect(fsSync.existsSync(path.join(gsdHome, 'knowledge', 'spikes'))).toBe(true)
          expect(fsSync.existsSync(path.join(gsdHome, 'knowledge', 'lessons'))).toBe(true)
        })
      })

      tmpdirTest('does not create symlink when Claude not in runtimes (fresh install)', async ({ tmpdir }) => {
        withMockHome(tmpdir, () => {
          const gsdHome = path.join(tmpdir, '.gsd')
          migrateKB(gsdHome, ['opencode'])

          const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
          expect(fsSync.existsSync(oldKBDir)).toBe(false)
        })
      })

      tmpdirTest('creates symlink when Claude is in runtimes (fresh install)', async ({ tmpdir }) => {
        withMockHome(tmpdir, () => {
          const gsdHome = path.join(tmpdir, '.gsd')
          migrateKB(gsdHome, ['claude'])

          const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
          expect(fsSync.existsSync(oldKBDir)).toBe(true)
          expect(fsSync.lstatSync(oldKBDir).isSymbolicLink()).toBe(true)
          expect(fsSync.readlinkSync(oldKBDir)).toBe(path.join(gsdHome, 'knowledge'))
        })
      })

      tmpdirTest('migrates data from old KB with zero data loss', async ({ tmpdir }) => {
        withMockHome(tmpdir, () => {
          // Set up old KB with data
          const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
          fsSync.mkdirSync(path.join(oldKBDir, 'signals'), { recursive: true })
          fsSync.mkdirSync(path.join(oldKBDir, 'spikes'), { recursive: true })
          fsSync.mkdirSync(path.join(oldKBDir, 'lessons'), { recursive: true })
          fsSync.writeFileSync(path.join(oldKBDir, 'signals', 'sig-001.md'), 'signal 1')
          fsSync.writeFileSync(path.join(oldKBDir, 'signals', 'sig-002.md'), 'signal 2')
          fsSync.writeFileSync(path.join(oldKBDir, 'spikes', 'spk-001.md'), 'spike 1')
          fsSync.writeFileSync(path.join(oldKBDir, 'lessons', 'les-001.md'), 'lesson 1')

          const gsdHome = path.join(tmpdir, '.gsd')
          migrateKB(gsdHome)

          const newKBDir = path.join(gsdHome, 'knowledge')

          // Verify all entries migrated
          expect(countKBEntries(newKBDir)).toBe(4)

          // Verify content preserved
          expect(fsSync.readFileSync(path.join(newKBDir, 'signals', 'sig-001.md'), 'utf8')).toBe('signal 1')
          expect(fsSync.readFileSync(path.join(newKBDir, 'spikes', 'spk-001.md'), 'utf8')).toBe('spike 1')
          expect(fsSync.readFileSync(path.join(newKBDir, 'lessons', 'les-001.md'), 'utf8')).toBe('lesson 1')

          // Verify old location is now a symlink
          expect(fsSync.lstatSync(oldKBDir).isSymbolicLink()).toBe(true)
          expect(fsSync.readlinkSync(oldKBDir)).toBe(newKBDir)

          // Verify backup exists
          const backupDir = oldKBDir + '.migration-backup'
          expect(fsSync.existsSync(backupDir)).toBe(true)
          expect(countKBEntries(backupDir)).toBe(4)
        })
      })

      tmpdirTest('is idempotent on re-run (existing symlink)', async ({ tmpdir }) => {
        withMockHome(tmpdir, () => {
          const gsdHome = path.join(tmpdir, '.gsd')
          const newKBDir = path.join(gsdHome, 'knowledge')
          const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')

          // Set up as if migration already happened
          fsSync.mkdirSync(path.join(newKBDir, 'signals'), { recursive: true })
          fsSync.mkdirSync(path.join(newKBDir, 'spikes'), { recursive: true })
          fsSync.mkdirSync(path.join(newKBDir, 'lessons'), { recursive: true })
          fsSync.writeFileSync(path.join(newKBDir, 'signals', 'sig-001.md'), 'existing signal')

          // Create symlink (as if first migration ran)
          fsSync.mkdirSync(path.join(tmpdir, '.claude'), { recursive: true })
          fsSync.symlinkSync(newKBDir, oldKBDir)

          // Run migration again -- should be idempotent
          migrateKB(gsdHome)

          // Symlink still exists, still points to same place
          expect(fsSync.lstatSync(oldKBDir).isSymbolicLink()).toBe(true)
          expect(fsSync.readlinkSync(oldKBDir)).toBe(newKBDir)

          // Data unchanged
          expect(countKBEntries(newKBDir)).toBe(1)
          expect(fsSync.readFileSync(path.join(newKBDir, 'signals', 'sig-001.md'), 'utf8')).toBe('existing signal')

          // No duplicate backup created
          const backupDir = oldKBDir + '.migration-backup'
          expect(fsSync.existsSync(backupDir)).toBe(false)
        })
      })

      tmpdirTest('reading through symlink returns same content as new path', async ({ tmpdir }) => {
        withMockHome(tmpdir, () => {
          const gsdHome = path.join(tmpdir, '.gsd')
          const newKBDir = path.join(gsdHome, 'knowledge')
          const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')

          // Set up old KB data
          fsSync.mkdirSync(path.join(oldKBDir, 'signals'), { recursive: true })
          fsSync.writeFileSync(path.join(oldKBDir, 'signals', 'sig-test.md'), 'test content via symlink')

          migrateKB(gsdHome)

          // Read via symlink (old path) and via new path
          const viaSymlink = fsSync.readFileSync(path.join(oldKBDir, 'signals', 'sig-test.md'), 'utf8')
          const viaNewPath = fsSync.readFileSync(path.join(newKBDir, 'signals', 'sig-test.md'), 'utf8')

          expect(viaSymlink).toBe(viaNewPath)
          expect(viaSymlink).toBe('test content via symlink')
        })
      })

      tmpdirTest('symlink NOT created when only non-Claude runtimes selected', async ({ tmpdir }) => {
        withMockHome(tmpdir, () => {
          const gsdHome = path.join(tmpdir, '.gsd')
          migrateKB(gsdHome, ['opencode', 'gemini'])

          const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
          // Should not exist at all since no Claude runtime selected
          expect(fsSync.existsSync(oldKBDir)).toBe(false)
        })
      })
    })

    describe('GSD_HOME override', () => {
      tmpdirTest('uses custom GSD_HOME for KB location', async ({ tmpdir }) => {
        const origGsdHome = process.env.GSD_HOME
        const customGsdHome = path.join(tmpdir, 'custom-gsd')
        process.env.GSD_HOME = customGsdHome

        try {
          withMockHome(tmpdir, () => {
            const gsdHome = getGsdHome()
            expect(gsdHome).toBe(customGsdHome)

            migrateKB(gsdHome, [])

            expect(fsSync.existsSync(path.join(customGsdHome, 'knowledge', 'signals'))).toBe(true)
            expect(fsSync.existsSync(path.join(customGsdHome, 'knowledge', 'spikes'))).toBe(true)
            expect(fsSync.existsSync(path.join(customGsdHome, 'knowledge', 'lessons'))).toBe(true)

            // KB should NOT be at the default ~/.gsd/ location
            expect(fsSync.existsSync(path.join(tmpdir, '.gsd', 'knowledge'))).toBe(false)
          })
        } finally {
          if (origGsdHome !== undefined) {
            process.env.GSD_HOME = origGsdHome
          } else {
            delete process.env.GSD_HOME
          }
        }
      })
    })

    describe('integration: installer creates KB dirs', () => {
      const installScript = path.resolve(process.cwd(), 'bin/install.js')

      tmpdirTest('Claude global install creates KB directory structure', async ({ tmpdir }) => {
        execSync(`node "${installScript}" --claude --global`, {
          env: { ...process.env, HOME: tmpdir },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Verify KB directory created at ~/.gsd/knowledge/
        const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
        const signalsExist = await fs.access(path.join(kbDir, 'signals')).then(() => true).catch(() => false)
        const spikesExist = await fs.access(path.join(kbDir, 'spikes')).then(() => true).catch(() => false)
        const lessonsExist = await fs.access(path.join(kbDir, 'lessons')).then(() => true).catch(() => false)
        expect(signalsExist).toBe(true)
        expect(spikesExist).toBe(true)
        expect(lessonsExist).toBe(true)

        // Verify symlink created for Claude runtime
        const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
        const stat = await fs.lstat(oldKBDir)
        expect(stat.isSymbolicLink()).toBe(true)
      })

      tmpdirTest('OpenCode-only install creates KB dirs but no symlink at ~/.claude/', async ({ tmpdir }) => {
        const configHome = path.join(tmpdir, '.config')

        execSync(`node "${installScript}" --opencode --global`, {
          env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Verify KB directory created
        const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
        const signalsExist = await fs.access(path.join(kbDir, 'signals')).then(() => true).catch(() => false)
        expect(signalsExist).toBe(true)

        // Verify NO symlink at ~/.claude/gsd-knowledge (only OpenCode selected)
        const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
        const exists = await fs.access(oldKBDir).then(() => true).catch(() => false)
        expect(exists).toBe(false)
      })
    })
  })

  describe('Codex CLI integration', () => {
    describe('convertClaudeToCodexSkill() unit tests', () => {
      it('strips disallowed frontmatter fields and keeps only name + description', () => {
        const input = `---
name: help
description: Show all GSD commands
allowed-tools:
  - Read
  - Bash
argument-hint: <optional-filter>
color: blue
---

Show all available GSD commands.`

        const result = convertClaudeToCodexSkill(input, 'gsd-help')

        // Should have name and description
        expect(result).toContain('name: gsd-help')
        expect(result).toContain('description: Show all GSD commands')

        // Should NOT have disallowed fields
        expect(result).not.toContain('allowed-tools:')
        expect(result).not.toContain('argument-hint:')
        expect(result).not.toContain('color:')
        expect(result).not.toContain('- Read')
        expect(result).not.toContain('- Bash')
      })

      it('replaces Claude tool names with Codex equivalents in body', () => {
        const input = `---
name: test
description: test skill
---

Use the Read tool to read files. Use Bash to run commands.
The Edit tool modifies files. Use Grep to search and Glob to find files.
Use Write to create new files.`

        const result = convertClaudeToCodexSkill(input, 'gsd-test')

        expect(result).toContain('read_file tool')
        expect(result).toContain('shell to run commands')
        expect(result).toContain('apply_patch tool modifies')
        expect(result).toContain('grep_files to search')
        expect(result).toContain('list_dir to find')
        expect(result).toContain('apply_patch to create')
        expect(result).not.toMatch(/\bRead\b/)
        expect(result).not.toMatch(/\bBash\b/)
      })

      it('replaces /gsd:command with $gsd-command for skill mention syntax', () => {
        const input = `---
name: help
description: Help command
---

Run /gsd:plan-phase to plan. Use /gsd:execute-phase to execute.
Also try /gsd:signal for insights.`

        const result = convertClaudeToCodexSkill(input, 'gsd-help')

        expect(result).toContain('$gsd-plan-phase')
        expect(result).toContain('$gsd-execute-phase')
        expect(result).toContain('$gsd-signal')
        expect(result).not.toContain('/gsd:')
      })

      it('wraps content without frontmatter in minimal SKILL.md frontmatter', () => {
        const input = 'This is a simple command body with no frontmatter.'

        const result = convertClaudeToCodexSkill(input, 'gsd-simple')

        expect(result).toContain('---')
        expect(result).toContain('name: gsd-simple')
        expect(result).toContain('description: GSD command: gsd-simple')
        expect(result).toContain('This is a simple command body')
      })

      it('uses fallback description when description is empty', () => {
        const input = `---
name: empty
description:
---

Body content.`

        const result = convertClaudeToCodexSkill(input, 'gsd-empty')

        expect(result).toContain('description: GSD command: gsd-empty')
      })

      it('strips angle brackets from description', () => {
        const input = `---
name: test
description: <Run this command to do something>
---

Body.`

        const result = convertClaudeToCodexSkill(input, 'gsd-test')

        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
        expect(result).toContain('description: Run this command to do something')
      })

      it('truncates description longer than 1024 chars', () => {
        const longDesc = 'A'.repeat(2000)
        const input = `---
name: test
description: ${longDesc}
---

Body.`

        const result = convertClaudeToCodexSkill(input, 'gsd-test')

        // Extract description from result
        const descMatch = result.match(/description: (.+)/)
        expect(descMatch).not.toBeNull()
        expect(descMatch[1].length).toBeLessThanOrEqual(1024)
      })

      it('converts @~/.codex/ file references to explicit read instructions', () => {
        const input = `---
name: test
description: test
---

Read @~/.codex/get-shit-done/workflows/signal.md for workflow details.`

        const result = convertClaudeToCodexSkill(input, 'gsd-test')

        expect(result).toContain('Read the file at `~/.codex/get-shit-done/workflows/signal.md`')
        expect(result).not.toContain('@~/.codex/')
      })

      it('handles null tool mappings (WebFetch, Task, SlashCommand) by leaving them', () => {
        const input = `---
name: test
description: test
---

Use WebFetch and Task and SlashCommand for these features.`

        const result = convertClaudeToCodexSkill(input, 'gsd-test')

        // Null-mapped tools should remain unchanged (not replaced)
        expect(result).toContain('WebFetch')
        expect(result).toContain('Task')
        expect(result).toContain('SlashCommand')
      })
    })

    describe('generateCodexAgentsMd() unit tests', () => {
      tmpdirTest('creates new AGENTS.md with GSD markers when none exists', async ({ tmpdir }) => {
        generateCodexAgentsMd(tmpdir, '~/.codex/')

        const agentsMdPath = path.join(tmpdir, 'AGENTS.md')
        const exists = await fs.access(agentsMdPath).then(() => true).catch(() => false)
        expect(exists).toBe(true)

        const content = await fs.readFile(agentsMdPath, 'utf8')
        expect(content).toContain('<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->')
        expect(content).toContain('<!-- GSD:END (get-shit-done-reflect-cc) -->')
        expect(content).toContain('$gsd-help')
        expect(content).toContain('~/.gsd/knowledge')
        expect(content).toContain('codex exec')
        expect(content).toContain('No Task tool support')
      })

      tmpdirTest('appends GSD section to existing AGENTS.md without GSD section', async ({ tmpdir }) => {
        const agentsMdPath = path.join(tmpdir, 'AGENTS.md')
        await fs.writeFile(agentsMdPath, '# My Project\n\nExisting instructions.\n')

        generateCodexAgentsMd(tmpdir, '~/.codex/')

        const content = await fs.readFile(agentsMdPath, 'utf8')
        expect(content).toContain('# My Project')
        expect(content).toContain('Existing instructions.')
        expect(content).toContain('<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->')
        expect(content).toContain('<!-- GSD:END (get-shit-done-reflect-cc) -->')
      })

      tmpdirTest('replaces existing GSD section idempotently', async ({ tmpdir }) => {
        const agentsMdPath = path.join(tmpdir, 'AGENTS.md')
        const initial = '# My Project\n\n<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->\nOld content.\n<!-- GSD:END (get-shit-done-reflect-cc) -->\n\n# Other Section\n'
        await fs.writeFile(agentsMdPath, initial)

        generateCodexAgentsMd(tmpdir, '~/.codex/')

        const content = await fs.readFile(agentsMdPath, 'utf8')
        expect(content).toContain('# My Project')
        expect(content).toContain('# Other Section')
        expect(content).not.toContain('Old content.')
        expect(content).toContain('$gsd-help')

        // Verify exactly one GSD:BEGIN marker (idempotent)
        const beginCount = (content.match(/GSD:BEGIN/g) || []).length
        expect(beginCount).toBe(1)
      })

      tmpdirTest('content is under 4KB', async ({ tmpdir }) => {
        generateCodexAgentsMd(tmpdir, '~/.codex/')

        const content = await fs.readFile(path.join(tmpdir, 'AGENTS.md'), 'utf8')
        expect(content.length).toBeLessThan(4096)
      })

      tmpdirTest('contains capability matrix reference with correct path prefix', async ({ tmpdir }) => {
        generateCodexAgentsMd(tmpdir, '~/.codex/')

        const content = await fs.readFile(path.join(tmpdir, 'AGENTS.md'), 'utf8')
        expect(content).toContain('~/.codex/get-shit-done/references/capability-matrix.md')
      })
    })

    describe('integration: --codex flag', () => {
      const installScript = path.resolve(process.cwd(), 'bin/install.js')

      tmpdirTest('--codex --global installs complete file layout', async ({ tmpdir }) => {
        execSync(`node "${installScript}" --codex --global`, {
          env: { ...process.env, HOME: tmpdir },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Verify skills/ contains gsd-*/SKILL.md directories
        const skillsDir = path.join(tmpdir, '.codex', 'skills')
        const skillsDirExists = await fs.access(skillsDir).then(() => true).catch(() => false)
        expect(skillsDirExists).toBe(true)

        const skillEntries = await fs.readdir(skillsDir)
        const gsdSkills = skillEntries.filter(e => e.startsWith('gsd-'))
        expect(gsdSkills.length).toBeGreaterThanOrEqual(3) // At least gsd-help, gsd-new-project, gsd-plan-phase

        // Verify specific expected skills exist
        expect(gsdSkills).toContain('gsd-help')
        expect(gsdSkills).toContain('gsd-new-project')
        expect(gsdSkills).toContain('gsd-plan-phase')

        // Verify SKILL.md files have correct frontmatter
        for (const skill of ['gsd-help', 'gsd-new-project', 'gsd-plan-phase']) {
          const skillMd = await fs.readFile(path.join(skillsDir, skill, 'SKILL.md'), 'utf8')
          expect(skillMd).toContain(`name: ${skill}`)
          expect(skillMd).toContain('description:')
          expect(skillMd).not.toContain('allowed-tools:')
          expect(skillMd).not.toContain('color:')
        }

        // Verify paths in SKILL.md use ~/.codex/ not ~/.claude/
        const helpSkill = await fs.readFile(path.join(skillsDir, 'gsd-help', 'SKILL.md'), 'utf8')
        expect(helpSkill).not.toContain('~/.claude/')

        // Verify get-shit-done reference docs exist
        const gsdDir = path.join(tmpdir, '.codex', 'get-shit-done')
        const gsdDirExists = await fs.access(gsdDir).then(() => true).catch(() => false)
        expect(gsdDirExists).toBe(true)

        // Verify AGENTS.md exists with GSD markers
        const agentsMdPath = path.join(tmpdir, '.codex', 'AGENTS.md')
        const agentsMd = await fs.readFile(agentsMdPath, 'utf8')
        expect(agentsMd).toContain('<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->')
        expect(agentsMd).toContain('<!-- GSD:END (get-shit-done-reflect-cc) -->')

        // Verify NO agents directory (agents skipped for Codex)
        const agentsDir = path.join(tmpdir, '.codex', 'agents')
        const agentsDirExists = await fs.access(agentsDir).then(() => true).catch(() => false)
        expect(agentsDirExists).toBe(false)

        // Verify NO hooks directory (hooks skipped for Codex)
        const hooksDir = path.join(tmpdir, '.codex', 'hooks')
        const hooksDirExists = await fs.access(hooksDir).then(() => true).catch(() => false)
        expect(hooksDirExists).toBe(false)
      })

      tmpdirTest('--codex --global --uninstall removes GSD skills and AGENTS.md section', async ({ tmpdir }) => {
        // First install
        execSync(`node "${installScript}" --codex --global`, {
          env: { ...process.env, HOME: tmpdir },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Verify install succeeded
        const skillsDir = path.join(tmpdir, '.codex', 'skills')
        const preUninstallSkills = await fs.readdir(skillsDir)
        expect(preUninstallSkills.filter(e => e.startsWith('gsd-')).length).toBeGreaterThan(0)

        // Uninstall
        execSync(`node "${installScript}" --codex --global --uninstall`, {
          env: { ...process.env, HOME: tmpdir },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Verify gsd-* skill directories removed
        const postSkills = await fs.readdir(skillsDir)
        const remainingGsd = postSkills.filter(e => e.startsWith('gsd-'))
        expect(remainingGsd.length).toBe(0)

        // Verify GSD section removed from AGENTS.md
        const agentsMdPath = path.join(tmpdir, '.codex', 'AGENTS.md')
        const agentsMdExists = await fs.access(agentsMdPath).then(() => true).catch(() => false)
        // If AGENTS.md was entirely GSD content, it may be deleted
        if (agentsMdExists) {
          const content = await fs.readFile(agentsMdPath, 'utf8')
          expect(content).not.toContain('<!-- GSD:BEGIN')
        }
      })

      tmpdirTest('--all --global installs Codex alongside other runtimes', async ({ tmpdir }) => {
        const configHome = path.join(tmpdir, '.config')

        execSync(`node "${installScript}" --all --global`, {
          env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 30000
        })

        // Verify Codex installed
        const codexDir = path.join(tmpdir, '.codex')
        const codexExists = await fs.access(codexDir).then(() => true).catch(() => false)
        expect(codexExists).toBe(true)

        const codexSkills = path.join(codexDir, 'skills')
        const codexSkillsExists = await fs.access(codexSkills).then(() => true).catch(() => false)
        expect(codexSkillsExists).toBe(true)

        // Verify Claude installed
        const claudeDir = path.join(tmpdir, '.claude', 'commands', 'gsd')
        const claudeExists = await fs.access(claudeDir).then(() => true).catch(() => false)
        expect(claudeExists).toBe(true)

        // Verify OpenCode installed
        const opcodeDir = path.join(configHome, 'opencode', 'command')
        const opcodeExists = await fs.access(opcodeDir).then(() => true).catch(() => false)
        expect(opcodeExists).toBe(true)

        // Verify Gemini installed
        const geminiDir = path.join(tmpdir, '.gemini', 'commands', 'gsd')
        const geminiExists = await fs.access(geminiDir).then(() => true).catch(() => false)
        expect(geminiExists).toBe(true)
      })

      tmpdirTest('Codex path replacement converts ~/.claude/ to ~/.codex/ in installed files', async ({ tmpdir }) => {
        execSync(`node "${installScript}" --codex --global`, {
          env: { ...process.env, HOME: tmpdir },
          cwd: tmpdir,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        })

        // Read a get-shit-done reference doc that contains ~/.claude/ paths in source
        const gsdDir = path.join(tmpdir, '.codex', 'get-shit-done')
        const gsdFiles = await fs.readdir(gsdDir, { recursive: true })
        const mdFiles = gsdFiles.filter(f => f.endsWith('.md'))

        // At least some .md files should exist
        expect(mdFiles.length).toBeGreaterThan(0)

        // Check that none contain ~/.claude/ (should all be ~/.codex/)
        // Documentation-style uses ("~/.claude/ " with trailing space) are intentionally preserved
        for (const mdFile of mdFiles) {
          const filePath = path.join(gsdDir, mdFile)
          const stat = await fs.stat(filePath)
          if (!stat.isFile()) continue
          const content = await fs.readFile(filePath, 'utf8')
          // Runtime-specific paths should use ~/.codex/, not ~/.claude/
          if (content.includes('~/.claude/')) {
            // Allow KB-related paths that are supposed to use ~/.gsd/
            const lines = content.split('\n').filter(l => l.includes('~/.claude/') && !l.match(/~\/\.claude\/\s/))
            for (const line of lines) {
              // Every line with ~/.claude/ is an error for Codex install
              expect(line).not.toContain('~/.claude/')
            }
          }
        }
      })
    })
  })

  describe('Gemini CLI MCP tool preservation', () => {
    describe('convertClaudeToGeminiAgent() unit tests', () => {
      it('preserves MCP tools in Gemini agent tools field', () => {
        const input = `---
tools: Read, Write, Bash, mcp__context7__resolve-library-id
---

Agent body content.`

        const result = convertClaudeToGeminiAgent(input)

        // MCP tool should be preserved as-is
        expect(result).toContain('mcp__context7__resolve-library-id')
        // Built-in tool should be converted to Gemini name
        expect(result).toContain('read_file')
        // Original Claude tool name should be converted
        expect(result).not.toMatch(/\bRead\b/)
      })

      it('preserves MCP tools from allowed-tools YAML array in Gemini agent', () => {
        const input = `---
allowed-tools:
  - Read
  - Write
  - Task
  - mcp__context7__*
---

Agent body content.`

        const result = convertClaudeToGeminiAgent(input)

        // MCP tool wildcard should be preserved
        expect(result).toContain('mcp__context7__*')
        // Task should be excluded (agents auto-register in Gemini)
        expect(result).not.toMatch(/\bTask\b/)
        // Built-in tool should be converted
        expect(result).toContain('read_file')
      })

      it('preserves multiple MCP tools in Gemini agent', () => {
        const input = `---
tools: Read, mcp__context7__resolve-library-id, mcp__context7__query-docs, mcp__fetch__get
---

Agent body content.`

        const result = convertClaudeToGeminiAgent(input)

        expect(result).toContain('mcp__context7__resolve-library-id')
        expect(result).toContain('mcp__context7__query-docs')
        expect(result).toContain('mcp__fetch__get')
      })
    })
  })

  describe('Gemini agent body text tool name replacement', () => {
    it('replaces Claude tool names with Gemini names in body text', () => {
      const input = `---
tools: Read, Write, Bash
---

Use the Read tool to read files.
Use Write to create new files.
Run Bash to execute commands.
Use Grep for searching and Glob for finding files.`

      const result = convertClaudeToGeminiAgent(input)

      // Body text should use Gemini tool names
      expect(result).toContain('read_file tool to read files')
      expect(result).toContain('Use write_file to create')
      expect(result).toContain('Run run_shell_command to execute')
      expect(result).toContain('Use search_file_content for searching')
      expect(result).toContain('glob for finding files')
      // Claude tool names should not remain in body
      expect(result).not.toMatch(/\bRead\b/)
      expect(result).not.toMatch(/\bWrite\b/)
      expect(result).not.toMatch(/\bBash\b/)
    })

    it('preserves MCP tool references in body text while replacing Claude names', () => {
      const input = `---
tools: Read
---

Use mcp__context7__resolve-library-id to find libraries.
Also use the Read tool to read files.`

      const result = convertClaudeToGeminiAgent(input)

      // MCP reference should be unchanged
      expect(result).toContain('mcp__context7__resolve-library-id')
      // Claude tool name should be replaced
      expect(result).toContain('read_file tool')
      expect(result).not.toMatch(/\bRead\b/)
    })

    it('replaces all mapped tools in body text', () => {
      const input = `---
tools: Read, Write, Edit, Bash, Glob, Grep
---

Read files. Write files. Edit content. Bash commands.
Glob patterns. Grep search. WebSearch queries. WebFetch pages.
TodoWrite tasks. AskUserQuestion prompts.`

      const result = convertClaudeToGeminiAgent(input)

      expect(result).toContain('read_file')
      expect(result).toContain('write_file')
      expect(result).toContain('replace')
      expect(result).toContain('run_shell_command')
      expect(result).toContain('glob')
      expect(result).toContain('search_file_content')
      expect(result).toContain('google_web_search')
      expect(result).toContain('web_fetch')
      expect(result).toContain('write_todos')
      expect(result).toContain('ask_user')
      // No Claude tool names should remain
      expect(result).not.toMatch(/\bRead\b/)
      expect(result).not.toMatch(/\bWrite\b/)
      expect(result).not.toMatch(/\bEdit\b/)
      expect(result).not.toMatch(/\bBash\b/)
      expect(result).not.toMatch(/\bGrep\b/)
      expect(result).not.toMatch(/\bWebSearch\b/)
      expect(result).not.toMatch(/\bWebFetch\b/)
      expect(result).not.toMatch(/\bTodoWrite\b/)
      expect(result).not.toMatch(/\bAskUserQuestion\b/)
    })

    it('converts both frontmatter and body text tool names', () => {
      const input = `---
tools: Read, Write, Bash
---

Use Read to read files. Run Bash for commands. Use Write to create files.`

      const result = convertClaudeToGeminiAgent(input)

      // Frontmatter should have Gemini tool names as YAML array
      expect(result).toContain('tools:')
      expect(result).toContain('  - read_file')
      expect(result).toContain('  - write_file')
      expect(result).toContain('  - run_shell_command')
      // Body should also have Gemini tool names
      expect(result).toContain('Use read_file to read files')
      expect(result).toContain('Run run_shell_command for commands')
      expect(result).toContain('Use write_file to create files')
    })
  })

  describe('Codex CLI MCP body text preservation', () => {
    it('Codex skill conversion preserves MCP tool references in body text', () => {
      const input = `---
name: phase-researcher
description: Researches how to implement a phase
---

Use mcp__context7__resolve-library-id to find library IDs.
Then use mcp__context7__query-docs to get documentation.
Also use the Read tool to read files and Bash to run commands.`

      const result = convertClaudeToCodexSkill(input, 'gsd-phase-researcher')

      // MCP tool references should pass through unchanged
      expect(result).toContain('mcp__context7__resolve-library-id')
      expect(result).toContain('mcp__context7__query-docs')
      // Built-in tool names in body text ARE converted per claudeToCodexTools map
      expect(result).toContain('read_file')
      expect(result).toContain('shell')
      // Original Claude tool names should be replaced
      expect(result).not.toMatch(/\bRead\b/)
      expect(result).not.toMatch(/\bBash\b/)
    })
  })

  describe('Codex MCP config.toml generation', () => {
    tmpdirTest('creates config.toml with MCP entries', async ({ tmpdir }) => {
      generateCodexMcpConfig(tmpdir)

      const configPath = path.join(tmpdir, 'config.toml')
      const exists = fsSync.existsSync(configPath)
      expect(exists).toBe(true)

      const content = fsSync.readFileSync(configPath, 'utf8')
      expect(content).toContain('[mcp_servers.context7]')
      expect(content).toContain('command = "npx"')
      expect(content).toContain('args = ["-y", "@upstash/context7-mcp"]')
      expect(content).toContain('# GSD:BEGIN (get-shit-done-reflect-cc)')
      expect(content).toContain('# GSD:END (get-shit-done-reflect-cc)')
    })

    tmpdirTest('merges with existing config.toml', async ({ tmpdir }) => {
      const configPath = path.join(tmpdir, 'config.toml')
      const userContent = 'model = "o3-mini"\n\n[mcp_servers.my-server]\ncommand = "my-server"\n'
      fsSync.writeFileSync(configPath, userContent)

      generateCodexMcpConfig(tmpdir)

      const content = fsSync.readFileSync(configPath, 'utf8')
      // User content preserved
      expect(content).toContain('model = "o3-mini"')
      expect(content).toContain('[mcp_servers.my-server]')
      expect(content).toContain('command = "my-server"')
      // GSD MCP section appended
      expect(content).toContain('[mcp_servers.context7]')
      expect(content).toContain('# GSD:BEGIN (get-shit-done-reflect-cc)')
    })

    tmpdirTest('idempotent update replaces existing GSD section', async ({ tmpdir }) => {
      generateCodexMcpConfig(tmpdir)
      generateCodexMcpConfig(tmpdir)

      const content = fsSync.readFileSync(path.join(tmpdir, 'config.toml'), 'utf8')
      // Exactly ONE [mcp_servers.context7] entry (not duplicated)
      const context7Count = (content.match(/\[mcp_servers\.context7\]/g) || []).length
      expect(context7Count).toBe(1)
      // Exactly ONE GSD:BEGIN marker
      const beginCount = (content.match(/# GSD:BEGIN/g) || []).length
      expect(beginCount).toBe(1)
    })

    tmpdirTest('does not include required = true', async ({ tmpdir }) => {
      generateCodexMcpConfig(tmpdir)

      const content = fsSync.readFileSync(path.join(tmpdir, 'config.toml'), 'utf8')
      expect(content).not.toContain('required')
    })
  })

  describe('safeFs', () => {
    it('returns the value from the wrapped function on success', () => {
      const result = safeFs('mkdirSync', () => 'ok', '/tmp/test');
      expect(result).toBe('ok');
    });

    it('re-throws the original error after logging', () => {
      const original = Object.assign(new Error('permission denied'), { code: 'EACCES' });
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => safeFs('mkdirSync', () => { throw original; }, '/tmp/test')).toThrow(original);
      spy.mockRestore();
    });

    it('logs error message with operation name, path, and EACCES hint', () => {
      const errors = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
      const err = Object.assign(new Error('permission denied'), { code: 'EACCES' });
      try {
        safeFs('mkdirSync', () => { throw err; }, '/some/path');
      } catch (e) { /* expected */ }
      spy.mockRestore();
      expect(errors.some(line => line.includes('mkdirSync'))).toBe(true);
      expect(errors.some(line => line.includes('/some/path'))).toBe(true);
      expect(errors.some(line => line.includes('Check file/directory permissions'))).toBe(true);
    });

    it('logs error message with operation name, both paths, and ENOENT hint', () => {
      const errors = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
      const err = Object.assign(new Error('no such file'), { code: 'ENOENT' });
      try {
        safeFs('cpSync', () => { throw err; }, '/src/path', '/dest/path');
      } catch (e) { /* expected */ }
      spy.mockRestore();
      expect(errors.some(line => line.includes('cpSync'))).toBe(true);
      expect(errors.some(line => line.includes('/src/path') && line.includes('/dest/path'))).toBe(true);
      expect(errors.some(line => line.includes('Source path does not exist'))).toBe(true);
    });

    it('logs operation name but no hint for unknown error codes', () => {
      const errors = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
      const err = Object.assign(new Error('something unexpected'), { code: 'UNKNOWN' });
      try {
        safeFs('mkdirSync', () => { throw err; }, '/tmp/test');
      } catch (e) { /* expected */ }
      spy.mockRestore();
      expect(errors.some(line => line.includes('mkdirSync'))).toBe(true);
      expect(errors.every(line => !line.includes('Hint:'))).toBe(true);
    });
  });
})
