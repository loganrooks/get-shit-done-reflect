import { describe, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const installScript = path.resolve(REPO_ROOT, 'bin/install.js')
const GSD_TOOLS = path.resolve(REPO_ROOT, 'get-shit-done/bin/gsd-tools.cjs')
const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')
const { reconstructFrontmatter } = require('../../get-shit-done/bin/lib/frontmatter.cjs')

/** Write a signal fixture file to the shared KB */
async function writeSignal(kbDir, project, filename, fields = {}) {
  const defaults = {
    id: `sig-2026-02-11-${filename.replace('.md', '')}`,
    type: 'signal',
    project,
    tags: '[testing, cross-runtime]',
    created: '2026-02-11T10:00:00Z',
    updated: '2026-02-11T10:00:00Z',
    durability: 'workaround',
    status: 'active',
    severity: 'notable',
    signal_type: 'deviation',
    phase: '17',
    plan: '2',
  }
  const merged = { ...defaults, ...fields }
  const frontmatter = Object.entries(merged)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const dir = path.join(kbDir, 'signals', project)
  await fs.mkdir(dir, { recursive: true })
  const content = `---\n${frontmatter}\n---\n\n## What Happened\n\nTest signal: ${filename}\n`
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, content)
  return { filepath, content }
}

function makeSignature(role) {
  return {
    role,
    harness: 'codex-cli',
    platform: 'codex',
    vendor: 'openai',
    model: 'gpt-5.4',
    reasoning_effort: 'xhigh',
    profile: 'quality',
    gsd_version: '1.19.4+dev',
    generated_at: '2026-04-17T00:00:00Z',
    session_id: 'thread-123',
    provenance_status: {
      role: 'derived',
      harness: 'exposed',
      platform: 'derived',
      vendor: 'derived',
      model: 'exposed',
      reasoning_effort: 'exposed',
      profile: 'derived',
      gsd_version: 'derived',
      generated_at: 'exposed',
      session_id: 'exposed',
    },
    provenance_source: {
      role: 'artifact_role',
      harness: 'runtime_context',
      platform: 'derived_from_harness',
      vendor: 'derived_from_harness',
      model: 'codex_state_store',
      reasoning_effort: 'codex_state_store',
      profile: 'config',
      gsd_version: 'installed_harness',
      generated_at: 'writer_clock',
      session_id: 'env:CODEX_THREAD_ID',
    },
  }
}

async function writeStructuredSignal(kbDir, project, filename, frontmatter) {
  const dir = path.join(kbDir, 'signals', project)
  await fs.mkdir(dir, { recursive: true })
  const content = `---\n${reconstructFrontmatter(frontmatter)}\n---\n\n## What Happened\n\nStructured signal fixture.\n`
  await fs.writeFile(path.join(dir, filename), content)
}

describe('VALID-04: Cross-runtime KB accessibility', () => {
  describe('shared KB after --all install', () => {
    tmpdirTest('--all install creates shared KB at ~/.gsd/knowledge/', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      const entries = await fs.readdir(kbDir)
      expect(entries).toContain('signals')
      expect(entries).toContain('spikes')
      expect(entries).toContain('lessons')
    })

    tmpdirTest('signal written to shared KB is readable at shared path', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')

      // Write a signal with runtime/model provenance fields
      const { content: written } = await writeSignal(
        kbDir, 'test-project', 'sig-cross-rt.md',
        { runtime: 'claude-code', model: 'claude-opus-4-6' }
      )

      // Read it back from the same path
      const readBack = await fs.readFile(
        path.join(kbDir, 'signals', 'test-project', 'sig-cross-rt.md'),
        'utf8'
      )

      expect(readBack).toBe(written)
      expect(readBack).toContain('runtime: claude-code')
      expect(readBack).toContain('model: claude-opus-4-6')
    })

    tmpdirTest('signal written to shared KB is readable via Claude symlink', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')

      // Write a signal to the shared KB
      const { content: written } = await writeSignal(
        kbDir, 'test-project', 'sig-symlink-test.md'
      )

      // Read it via the Claude backward-compat symlink path
      const claudeKb = path.join(tmpdir, '.claude', 'gsd-knowledge')
      const viaSymlink = await fs.readFile(
        path.join(claudeKb, 'signals', 'test-project', 'sig-symlink-test.md'),
        'utf8'
      )

      // Verify content is identical
      expect(viaSymlink).toBe(written)

      // Verify the path is actually a symlink
      const stat = await fs.lstat(claudeKb)
      expect(stat.isSymbolicLink()).toBe(true)
    })
  })

  describe('signal format compatibility', () => {
    tmpdirTest('old-format signal (no runtime/model fields) is readable', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')

      // Write a signal in the OLD format (no runtime: or model: fields)
      const { content: written } = await writeSignal(
        kbDir, 'test-project', 'sig-old-format.md'
        // No runtime/model fields -- uses only defaults which don't include them
      )

      // Read it back
      const readBack = await fs.readFile(
        path.join(kbDir, 'signals', 'test-project', 'sig-old-format.md'),
        'utf8'
      )

      expect(readBack).toBe(written)

      // Verify it does NOT have runtime/model fields (old format)
      expect(readBack).not.toContain('runtime:')
      expect(readBack).not.toContain('model:')

      // Verify the standard fields ARE present and parseable
      const frontmatterMatch = readBack.match(/^---\n([\s\S]*?)\n---/)
      expect(frontmatterMatch).not.toBeNull()
      expect(frontmatterMatch[1]).toContain('id:')
      expect(frontmatterMatch[1]).toContain('type: signal')
      expect(frontmatterMatch[1]).toContain('severity:')
      expect(frontmatterMatch[1]).toContain('signal_type:')
    })

    tmpdirTest('new-format signal (with runtime/model fields) is readable', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')

      // Write a signal with the new format including runtime and model
      const { content: written } = await writeSignal(
        kbDir, 'test-project', 'sig-new-format.md',
        { runtime: 'opencode', model: 'gpt-4.1' }
      )

      // Read it back
      const readBack = await fs.readFile(
        path.join(kbDir, 'signals', 'test-project', 'sig-new-format.md'),
        'utf8'
      )

      expect(readBack).toBe(written)

      // Verify both standard and new fields are present
      const frontmatterMatch = readBack.match(/^---\n([\s\S]*?)\n---/)
      expect(frontmatterMatch).not.toBeNull()
      const fm = frontmatterMatch[1]
      expect(fm).toContain('id:')
      expect(fm).toContain('type: signal')
      expect(fm).toContain('severity:')
      expect(fm).toContain('runtime: opencode')
      expect(fm).toContain('model: gpt-4.1')
    })

    tmpdirTest('multiple signals from different runtimes coexist in shared KB', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      const project = 'multi-runtime-project'

      // Write 3 signals, each with a different runtime
      await writeSignal(kbDir, project, 'sig-from-claude.md', {
        id: 'sig-2026-02-11-from-claude',
        runtime: 'claude-code',
        model: 'claude-opus-4-6'
      })
      await writeSignal(kbDir, project, 'sig-from-opencode.md', {
        id: 'sig-2026-02-11-from-opencode',
        runtime: 'opencode',
        model: 'gpt-4.1'
      })
      await writeSignal(kbDir, project, 'sig-from-codex.md', {
        id: 'sig-2026-02-11-from-codex',
        runtime: 'codex-cli',
        model: 'o4-mini'
      })

      // Read all 3 back
      const signalDir = path.join(kbDir, 'signals', project)
      const files = await fs.readdir(signalDir)
      expect(files).toHaveLength(3)
      expect(files).toContain('sig-from-claude.md')
      expect(files).toContain('sig-from-opencode.md')
      expect(files).toContain('sig-from-codex.md')

      // Verify each has the correct runtime field
      const claude = await fs.readFile(path.join(signalDir, 'sig-from-claude.md'), 'utf8')
      expect(claude).toContain('runtime: claude-code')

      const opencode = await fs.readFile(path.join(signalDir, 'sig-from-opencode.md'), 'utf8')
      expect(opencode).toContain('runtime: opencode')

      const codex = await fs.readFile(path.join(signalDir, 'sig-from-codex.md'), 'utf8')
      expect(codex).toContain('runtime: codex-cli')
    })

    tmpdirTest('legacy and split-provenance signals rebuild together in shared KB', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')

      await writeSignal(kbDir, 'test-project', 'sig-legacy-format.md', {
        id: 'sig-legacy-format',
        runtime: 'claude-code',
        model: 'claude-opus-4-6',
        gsd_version: '1.18.2+dev',
      })

      await writeStructuredSignal(kbDir, 'test-project', 'sig-split-format.md', {
        id: 'sig-split-format',
        type: 'signal',
        project: 'test-project',
        tags: ['split', 'provenance'],
        created: '2026-04-17T00:00:00Z',
        updated: '2026-04-17T00:00:00Z',
        durability: 'convention',
        status: 'active',
        severity: 'notable',
        signal_type: 'deviation',
        provenance_schema: 'v2_split',
        about_work: [makeSignature('planner')],
        detected_by: makeSignature('sensor'),
        written_by: makeSignature('synthesizer'),
      })

      execSync(`node "${GSD_TOOLS}" kb rebuild --raw`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const db = new DatabaseSync(path.join(kbDir, 'kb.db'), { readonly: true })
      const rows = db.prepare(`
        SELECT id, provenance_schema, about_work_json, detected_by_json, written_by_json, runtime, model, gsd_version
        FROM signals
        WHERE project = 'test-project'
        ORDER BY id
      `).all()

      expect(rows).toHaveLength(2)
      expect(rows[0].id).toBe('sig-legacy-format')
      expect(rows[0].provenance_schema).toBe('v1_legacy')
      expect(rows[0].runtime).toBe('claude-code')

      expect(rows[1].id).toBe('sig-split-format')
      expect(rows[1].provenance_schema).toBe('v2_split')
      expect(rows[1].about_work_json).toContain('"role":"planner"')
      expect(rows[1].detected_by_json).toContain('"role":"sensor"')
      expect(rows[1].written_by_json).toContain('"role":"synthesizer"')
      expect(rows[1].runtime).toBe('codex-cli')
      expect(rows[1].model).toBe('gpt-5.4')
      expect(rows[1].gsd_version).toBe('1.19.4+dev')
    })
  })

  describe('Claude backward-compat symlink', () => {
    tmpdirTest('Claude symlink target resolves to ~/.gsd/knowledge/', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      const claudeKb = path.join(tmpdir, '.claude', 'gsd-knowledge')
      const target = await fs.readlink(claudeKb)
      const expectedTarget = path.join(tmpdir, '.gsd', 'knowledge')
      expect(target).toBe(expectedTarget)
    })
  })

  describe('KB path references in installed workflow files', () => {
    tmpdirTest('installed workflow files reference .planning/knowledge/ (primary) or ~/.gsd/knowledge/ (fallback), not ~/.claude/gsd-knowledge/', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Check each runtime's installed get-shit-done-reflect/ reference docs
      const runtimeDirs = [
        { name: 'claude', dir: path.join(tmpdir, '.claude', 'get-shit-done-reflect') },
        { name: 'opencode', dir: path.join(configHome, 'opencode', 'get-shit-done-reflect') },
        { name: 'gemini', dir: path.join(tmpdir, '.gemini', 'get-shit-done-reflect') },
        { name: 'codex', dir: path.join(tmpdir, '.codex', 'get-shit-done-reflect') },
      ]

      for (const { name, dir } of runtimeDirs) {
        const allFiles = await fs.readdir(dir, { recursive: true })
        const textFiles = allFiles.filter(f => f.endsWith('.md') || f.endsWith('.toml'))

        for (const file of textFiles) {
          const filePath = path.join(dir, file)
          const stat = await fs.stat(filePath)
          if (!stat.isFile()) continue

          const content = await fs.readFile(filePath, 'utf8')

          // If the file mentions "knowledge", it should reference .planning/knowledge/
          // (project-local primary) or .gsd/knowledge/ (user-global fallback),
          // and NOT ~/.claude/gsd-knowledge/ (the old, pre-migration path)
          if (content.includes('gsd-knowledge') && !content.includes('.gsd/knowledge') && !content.includes('.planning/knowledge')) {
            expect.fail(
              `${name}: ${file} references old KB path ~/.claude/gsd-knowledge/ ` +
              `instead of .planning/knowledge/ or ~/.gsd/knowledge/`
            )
          }
        }
      }
    })
  })

  describe('project-local KB paths in installed files', () => {
    tmpdirTest('installed agent/workflow files contain .planning/knowledge references', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Check Claude runtime for .planning/knowledge references
      const claudeDir = path.join(tmpdir, '.claude')
      const allFiles = await fs.readdir(claudeDir, { recursive: true })
      const textFiles = allFiles.filter(f => f.endsWith('.md'))

      let filesWithProjectLocalKB = 0
      for (const file of textFiles) {
        const filePath = path.join(claudeDir, file)
        const stat = await fs.stat(filePath)
        if (!stat.isFile()) continue
        const content = await fs.readFile(filePath, 'utf8')
        if (content.includes('.planning/knowledge')) {
          filesWithProjectLocalKB++
        }
      }

      // Plan 01 updated 20 source files with .planning/knowledge references
      expect(filesWithProjectLocalKB).toBeGreaterThanOrEqual(10)
    })
  })

  describe('v1.14 release readiness', () => {
    tmpdirTest('all runtimes produce consistent VERSION files', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --all --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      })

      // Read VERSION file from each runtime
      const versionPaths = [
        path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'VERSION'),
        path.join(configHome, 'opencode', 'get-shit-done-reflect', 'VERSION'),
        path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'VERSION'),
        path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'VERSION'),
      ]

      const versions = []
      for (const vp of versionPaths) {
        const version = (await fs.readFile(vp, 'utf8')).trim()
        versions.push(version)
      }

      // All 4 must match
      expect(new Set(versions).size).toBe(1)

      // Must be a valid semver pattern (major.minor.patch with optional +dev suffix)
      expect(versions[0]).toMatch(/^\d+\.\d+\.\d+(\+dev)?$/)
    })

    // Release gate: npx vitest run must show 0 failures
    // Note: Nested vitest execution is impractical (vitest inside vitest causes issues).
    // The release gate is validated by running `npx vitest run` at the top level and
    // confirming zero failures across the full suite. This is documented rather than
    // automated as a meta-test to avoid nested test runner complications.

    // =========================================================================
    // v1.14 Release Readiness -- Phase 17 Validation Coverage
    // =========================================================================
    //
    // VALID-01: OpenCode install correctness
    //   Covered by: tests/integration/multi-runtime.test.js (17-01)
    //   - OpenCode file layout, path transformation, frontmatter conversion
    //
    // VALID-02: Gemini install correctness
    //   Covered by: tests/integration/multi-runtime.test.js (17-01)
    //   - Gemini TOML commands, settings.json, path transformation
    //
    // VALID-03: Multi-runtime --all install depth
    //   Covered by: tests/integration/multi-runtime.test.js (17-01)
    //   - All 4 runtimes install correctly with --all --global
    //   - No leaked Claude paths in non-Claude runtimes
    //   - KB paths reference ~/.gsd/knowledge/ across all runtimes
    //
    // VALID-04: Cross-runtime KB accessibility
    //   Covered by: tests/integration/cross-runtime-kb.test.js (this file, 17-02)
    //   - Shared KB created at ~/.gsd/knowledge/ by --all install
    //   - Signals writable and readable at shared path
    //   - Claude symlink provides transparent backward-compat access
    //   - Old-format signals (no runtime/model) are readable
    //   - New-format signals (with runtime/model) are readable
    //   - Multi-runtime signals coexist in shared KB
    //   - Installed workflow files reference correct KB path
    //   - VERSION consistency across all 4 runtimes
    //
    // Release gate: `npx vitest run` must show 0 failures, 100+ tests passing.
    // =========================================================================
  })
})
