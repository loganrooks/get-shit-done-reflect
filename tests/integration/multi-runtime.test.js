import { describe, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { execFileSync, execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  INSTALLER_RUNTIME_METADATA,
  SUPPORTED_INSTALLER_RUNTIMES,
} = require('../../get-shit-done/bin/lib/runtime-support.cjs')
const { checkCrossRuntimeParity } = require('../../bin/install.js')

const installScript = path.resolve(process.cwd(), 'bin/install.js')
const LEGACY_UNSUPPORTED_INSTALLER_TARGETS = Object.freeze(['opencode', 'gemini'])

function runNodeJson(scriptPath, args, options = {}) {
  const output = execFileSync('node', [scriptPath, ...args], {
    encoding: 'utf8',
    timeout: 30000,
    ...options,
  })
  return JSON.parse(output.trim())
}

async function pathExists(targetPath) {
  return fs.access(targetPath).then(() => true).catch(() => false)
}

async function dirHasFiles(dir, extension, minCount) {
  const exists = await pathExists(dir)
  expect(exists, `directory should exist: ${dir}`).toBe(true)
  const entries = await fs.readdir(dir)
  const filtered = extension
    ? entries.filter((entry) => entry.endsWith(extension))
    : entries
  expect(filtered.length, `${dir} should have >= ${minCount} ${extension || ''} files`).toBeGreaterThanOrEqual(minCount)
}

async function dirHasGlobFiles(dir, pattern, minCount) {
  const exists = await pathExists(dir)
  expect(exists, `directory should exist: ${dir}`).toBe(true)
  const entries = await fs.readdir(dir)
  const [prefix, suffix] = pattern.split('*')
  const matched = entries.filter((entry) => entry.startsWith(prefix) && entry.endsWith(suffix))
  expect(matched.length, `${dir} should have >= ${minCount} files matching ${pattern}`).toBeGreaterThanOrEqual(minCount)
}

async function dirHasGlobDirs(dir, pattern, minCount) {
  const exists = await pathExists(dir)
  expect(exists, `directory should exist: ${dir}`).toBe(true)
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const [prefix] = pattern.split('*')
  const matched = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
  expect(matched.length, `${dir} should have >= ${minCount} subdirs matching ${pattern}`).toBeGreaterThanOrEqual(minCount)
}

async function fileExists(filePath) {
  expect(await pathExists(filePath), `file should exist: ${filePath}`).toBe(true)
}

async function fileNotExists(filePath) {
  expect(await pathExists(filePath), `file should NOT exist: ${filePath}`).toBe(false)
}

function getSupportedRuntimeBaseDir(rootDir, runtime) {
  const metadata = INSTALLER_RUNTIME_METADATA[runtime]
  if (!metadata) {
    throw new Error(`Unsupported runtime requested in test helper: ${runtime}`)
  }
  return path.join(rootDir, metadata.dirName)
}

async function verifyRuntimeLayout(rootDir, runtime, options = {}) {
  if (runtime === 'claude') {
    const base = getSupportedRuntimeBaseDir(rootDir, runtime)
    await dirHasFiles(path.join(base, 'commands', 'gsdr'), '.md', 3)
    await dirHasFiles(path.join(base, 'get-shit-done-reflect'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsdr-*.md', 1)
    await dirHasFiles(path.join(base, 'hooks'), '.js', 1)
    await fileExists(path.join(base, 'get-shit-done-reflect', 'VERSION'))
    await fileExists(path.join(base, 'settings.json'))
    return
  }

  if (runtime === 'codex') {
    const base = getSupportedRuntimeBaseDir(rootDir, runtime)
    const codexCloseoutHook = options.codexCloseoutHook || 'either'
    await dirHasGlobDirs(path.join(base, 'skills'), 'gsdr-*', 3)
    await dirHasFiles(path.join(base, 'get-shit-done-reflect'), null, 1)
    await dirHasGlobFiles(path.join(base, 'agents'), 'gsdr-*.toml', 1)
    await fileExists(path.join(base, 'AGENTS.md'))
    await fileExists(path.join(base, 'get-shit-done-reflect', 'VERSION'))
    if (codexCloseoutHook === 'present') {
      await dirHasFiles(path.join(base, 'hooks'), '.js', 1)
      await fileExists(path.join(base, 'hooks.json'))
    } else if (codexCloseoutHook === 'absent') {
      await fileNotExists(path.join(base, 'hooks'))
      await fileNotExists(path.join(base, 'hooks.json'))
    }
    await fileNotExists(path.join(base, 'settings.json'))
    return
  }

  throw new Error(`verifyRuntimeLayout only supports supported runtimes, received: ${runtime}`)
}

async function verifyUnsupportedRuntimeDirsAbsent(rootDir, configHome) {
  await fileNotExists(path.join(rootDir, '.gemini'))
  await fileNotExists(path.join(rootDir, '.opencode'))
  await fileNotExists(path.join(configHome, 'opencode'))
}

async function assertSupportedInstallOutputs(rootDir, configHome) {
  for (const runtime of SUPPORTED_INSTALLER_RUNTIMES) {
    await fileExists(getSupportedRuntimeBaseDir(rootDir, runtime))
  }
  await fileExists(path.join(rootDir, '.gsd', 'knowledge'))
  await verifyUnsupportedRuntimeDirsAbsent(rootDir, configHome)
}

async function installAllSupported(rootDir, configHome) {
  execSync(`node "${installScript}" --all --global`, {
    env: { ...process.env, HOME: rootDir, XDG_CONFIG_HOME: configHome },
    cwd: rootDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000,
  })

  await assertSupportedInstallOutputs(rootDir, configHome)
}

async function verifyNoLeakedPaths(runtimeDir, runtime) {
  const allFiles = await fs.readdir(runtimeDir, { recursive: true })
  const textFiles = allFiles.filter((file) => file.endsWith('.md') || file.endsWith('.toml'))

  const violations = []
  for (const file of textFiles) {
    const filePath = path.join(runtimeDir, file)
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) continue

    const content = await fs.readFile(filePath, 'utf8')

    if (runtime !== 'claude' && content.includes('~/.claude/')) {
      const lines = content.split('\n')
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (lines[lineIndex].includes('~/.claude/') && !lines[lineIndex].match(/~\/\.claude\/\s/)) {
          violations.push({
            file,
            line: lineIndex + 1,
            issue: 'leaked ~/.claude/ path',
            text: lines[lineIndex].trim(),
          })
        }
      }
    }

    if (content.includes('gsd-knowledge') && !content.includes('.gsd/knowledge')) {
      violations.push({ file, issue: 'uses old gsd-knowledge path instead of .gsd/knowledge' })
    }

    if (!file.endsWith('CHANGELOG.md') && content.match(/\bgsd-(?!tools|knowledge|test|build)/)) {
      const lines = content.split('\n')
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (lines[lineIndex].match(/\bgsd-(?!tools|knowledge|test|build)/) && !lines[lineIndex].includes('gsdr-')) {
          violations.push({
            file,
            line: lineIndex + 1,
            issue: 'stale gsd- reference (should be gsdr-)',
            text: lines[lineIndex].trim(),
          })
        }
      }
    }
  }

  expect(violations, `Path leakage violations in ${runtime}:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0)
}

async function verifyKBPathsShared(runtimeDir) {
  const allFiles = await fs.readdir(runtimeDir, { recursive: true })
  const textFiles = allFiles.filter((file) => file.endsWith('.md') || file.endsWith('.toml'))

  const violations = []
  for (const file of textFiles) {
    const filePath = path.join(runtimeDir, file)
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) continue

    const content = await fs.readFile(filePath, 'utf8')
    if ((content.includes('gsd-knowledge') || content.includes('gsd_knowledge')) &&
      !content.includes('.gsd/knowledge') &&
      !content.includes('.planning/knowledge')
    ) {
      violations.push({
        file,
        issue: 'references gsd-knowledge but not via .planning/knowledge/ or .gsd/knowledge/',
      })
    }
  }

  expect(violations, `KB path violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0)
}

describe('multi-runtime validation', () => {
  describe('supported runtime installs', () => {
    tmpdirTest('Claude: correct file layout after install', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --claude --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: path.join(tmpdir, '.config') },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      })

      await verifyRuntimeLayout(tmpdir, 'claude')
      await verifyUnsupportedRuntimeDirsAbsent(tmpdir, path.join(tmpdir, '.config'))
    })

    tmpdirTest('Codex: correct file layout after install', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: path.join(tmpdir, '.config') },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      })

      await verifyRuntimeLayout(tmpdir, 'codex', { codexCloseoutHook: 'absent' })
      await verifyUnsupportedRuntimeDirsAbsent(tmpdir, path.join(tmpdir, '.config'))
    })

    tmpdirTest('Codex: installed files use shared KB paths and do not leak Claude runtime paths', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: path.join(tmpdir, '.config') },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      })

      const codexDir = getSupportedRuntimeBaseDir(tmpdir, 'codex')
      await verifyNoLeakedPaths(codexDir, 'codex')
      await verifyKBPathsShared(codexDir)
      await verifyUnsupportedRuntimeDirsAbsent(tmpdir, path.join(tmpdir, '.config'))
    })
  })

  describe('legacy unsupported installer targets', () => {
    for (const runtime of LEGACY_UNSUPPORTED_INSTALLER_TARGETS) {
      tmpdirTest(`${runtime}: explicit legacy runtime flag exits with guidance and creates no runtime output`, async ({ tmpdir }) => {
        const configHome = path.join(tmpdir, '.config')
        let error

        try {
          execSync(`node "${installScript}" --${runtime} --global`, {
            env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
            cwd: tmpdir,
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 15000,
          })
        } catch (caught) {
          error = caught
        }

        expect(error, `--${runtime} should exit non-zero`).toBeTruthy()
        expect(error.status).not.toBe(0)
        const stderr = error.stderr?.toString() || ''
        expect(stderr).toContain(`--${runtime}`)
        expect(stderr).toContain('--all for all supported runtimes')
        expect(stderr).toContain('Legacy Gemini/OpenCode installer support has been removed')

        await fileNotExists(getSupportedRuntimeBaseDir(tmpdir, 'claude'))
        await fileNotExists(getSupportedRuntimeBaseDir(tmpdir, 'codex'))
        await verifyUnsupportedRuntimeDirsAbsent(tmpdir, configHome)
      })
    }
  })

  describe('Codex MCP config.toml after install', () => {
    tmpdirTest('Codex install generates config.toml with MCP servers', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      })

      const configTomlPath = path.join(tmpdir, '.codex', 'config.toml')
      const exists = await pathExists(configTomlPath)
      expect(exists, 'config.toml should exist after Codex install').toBe(true)

      const content = await fs.readFile(configTomlPath, 'utf8')
      const compactPromptPath = path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'templates', 'codex-compact-prompt.md').replace(/\\/g, '/')
      expect(content).toContain(`experimental_compact_prompt_file = "${compactPromptPath}"`)
      expect(content).toContain('[mcp_servers.context7]')
      expect(content).toContain('command = "npx"')
      expect(content).toContain('args = ["-y", "@upstash/context7-mcp"]')
      expect(content).toContain('# GSD:BEGIN (get-shit-done-reflect-cc)')
      expect(content).toContain('# GSD:END (get-shit-done-reflect-cc)')

      const promptExists = await pathExists(compactPromptPath)
      expect(promptExists, 'codex compact prompt file should exist after Codex install').toBe(true)
    })
  })

  describe('Codex agent TOML literal string safety', () => {
    tmpdirTest('Codex agent TOML files use literal strings for backslash safety', async ({ tmpdir }) => {
      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 15000,
      })

      const verifierPath = path.join(tmpdir, '.codex', 'agents', 'gsdr-verifier.toml')
      const exists = await pathExists(verifierPath)
      expect(exists, 'gsdr-verifier.toml should exist after Codex install').toBe(true)

      const content = await fs.readFile(verifierPath, 'utf8')
      expect(content).toContain("developer_instructions = '''")
      expect(content).not.toContain('developer_instructions = """')
      expect(content).toContain('description = ')
      expect(content.length).toBeGreaterThan(100)
    })
  })

  describe('VALID-03: Multi-runtime --all install', () => {
    tmpdirTest('--all installs only supported runtimes with correct file layouts', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)
      for (const runtime of SUPPORTED_INSTALLER_RUNTIMES) {
        await verifyRuntimeLayout(
          tmpdir,
          runtime,
          runtime === 'codex' ? { codexCloseoutHook: 'absent' } : {},
        )
      }
    })

    tmpdirTest('--all install: supported runtime files reference shared KB paths without unsupported output dirs', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      await verifyKBPathsShared(getSupportedRuntimeBaseDir(tmpdir, 'claude'))
      await verifyKBPathsShared(getSupportedRuntimeBaseDir(tmpdir, 'codex'))
      await verifyNoLeakedPaths(getSupportedRuntimeBaseDir(tmpdir, 'codex'), 'codex')
      await verifyUnsupportedRuntimeDirsAbsent(tmpdir, configHome)
    })

    tmpdirTest('--all install: each supported runtime has format-correct command files', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      const claudeCommandsDir = path.join(tmpdir, '.claude', 'commands', 'gsdr')
      const claudeFiles = await fs.readdir(claudeCommandsDir)
      const claudeMdFiles = claudeFiles.filter((file) => file.endsWith('.md'))
      expect(claudeMdFiles.length).toBeGreaterThanOrEqual(3)

      const codexSkillsDir = path.join(tmpdir, '.codex', 'skills')
      const codexEntries = await fs.readdir(codexSkillsDir, { withFileTypes: true })
      const codexSkillDirs = codexEntries.filter((entry) => entry.isDirectory() && entry.name.startsWith('gsdr-'))
      expect(codexSkillDirs.length).toBeGreaterThanOrEqual(3)

      for (const skillDir of codexSkillDirs) {
        await fileExists(path.join(codexSkillsDir, skillDir.name, 'SKILL.md'))
      }
    })

    tmpdirTest('--all install: shared KB directory created with correct structure', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      await fileExists(path.join(kbDir, 'signals'))
      await fileExists(path.join(kbDir, 'spikes'))
      await fileExists(path.join(kbDir, 'lessons'))

      const claudeSymlink = path.join(tmpdir, '.claude', 'gsd-knowledge')
      const stat = await fs.lstat(claudeSymlink)
      expect(stat.isSymbolicLink()).toBe(true)

      const target = await fs.readlink(claudeSymlink)
      expect(target).toBe(kbDir)
    })

    tmpdirTest('--all install: file name parity across supported runtimes per category', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      function getNameSet(dir, prefix, suffix) {
        if (!fsSync.existsSync(dir)) return new Set()
        const entries = fsSync.readdirSync(dir)
        const matched = entries.filter((entry) => entry.startsWith(prefix) && entry.endsWith(suffix))
        return new Set(matched.map((entry) => entry.substring(0, entry.lastIndexOf('.'))))
      }

      function getDirNameSet(dir, prefix) {
        if (!fsSync.existsSync(dir)) return new Set()
        const entries = fsSync.readdirSync(dir, { withFileTypes: true })
        return new Set(entries.filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix)).map((entry) => entry.name))
      }

      const claudeAgents = getNameSet(path.join(tmpdir, '.claude', 'agents'), 'gsdr-', '.md')
      const codexAgents = getNameSet(path.join(tmpdir, '.codex', 'agents'), 'gsdr-', '.toml')
      expect([...claudeAgents].sort(), 'Agent parity: Claude vs Codex').toEqual([...codexAgents].sort())

      const claudeWorkflows = getNameSet(path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'workflows'), '', '.md')
      const codexWorkflows = getNameSet(path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows'), '', '.md')
      expect([...claudeWorkflows].sort(), 'Workflow parity: Claude vs Codex').toEqual([...codexWorkflows].sort())

      const claudeCommands = getNameSet(path.join(tmpdir, '.claude', 'commands', 'gsdr'), '', '.md')
      const codexCommands = getDirNameSet(path.join(tmpdir, '.codex', 'skills'), 'gsdr-')
      const normalizedClaudeCommands = new Set([...claudeCommands].map((name) => (name.startsWith('gsdr-') ? name : `gsdr-${name}`)))
      expect([...normalizedClaudeCommands].sort(), 'Command parity: Claude vs Codex').toEqual([...codexCommands].sort())
    })

    tmpdirTest('--all install: Claude registers the Stop closeout hook against the shipped postlude script', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      const settings = JSON.parse(await fs.readFile(path.join(tmpdir, '.claude', 'settings.json'), 'utf8'))
      const closeoutHooks = (settings.hooks?.Stop || [])
        .flatMap((entry) => entry.hooks || [])
        .filter((hook) => hook.command?.includes('gsdr-postlude.js'))

      expect(closeoutHooks).toHaveLength(1)
      expect(closeoutHooks[0].timeout).toBe(30)
      expect(closeoutHooks[0].command).toContain('gsdr-postlude.js')
      await fileExists(path.join(tmpdir, '.claude', 'hooks', 'gsdr-postlude.js'))
      expect(settings.hooks?.SessionStop).toBeUndefined()
    })

    tmpdirTest('Codex install: supported fixture writes hooks.json and bundled postlude hook', async ({ tmpdir }) => {
      const homeDir = path.join(tmpdir, 'home')
      const configHome = path.join(tmpdir, '.config')

      await fs.mkdir(path.join(homeDir, '.codex'), { recursive: true })
      await fs.writeFile(path.join(homeDir, '.codex', 'config.toml'), 'codex_hooks = true\n', 'utf8')

      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: homeDir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      await verifyRuntimeLayout(homeDir, 'codex', { codexCloseoutHook: 'present' })
      const hooksConfig = JSON.parse(await fs.readFile(path.join(homeDir, '.codex', 'hooks.json'), 'utf8'))
      const stopHooks = (hooksConfig.hooks?.Stop || []).flatMap((entry) => entry.hooks || [])
      const closeoutHook = stopHooks.find((hook) => hook.command?.includes('gsdr-postlude.js'))

      expect(closeoutHook).toEqual(expect.objectContaining({
        type: 'command',
        timeout: 30,
      }))
    })

    tmpdirTest('Codex install: project/global conflict records a waiver instead of hooks', async ({ tmpdir }) => {
      const homeDir = path.join(tmpdir, 'home')
      const projectDir = path.join(tmpdir, 'project')
      const configHome = path.join(tmpdir, '.config')

      await fs.mkdir(path.join(homeDir, '.codex'), { recursive: true })
      await fs.writeFile(path.join(homeDir, '.codex', 'config.toml'), 'codex_hooks = true\n', 'utf8')
      await fs.mkdir(path.join(projectDir, '.planning'), { recursive: true })
      await fs.writeFile(path.join(projectDir, '.planning', 'config.json'), JSON.stringify({}, null, 2), 'utf8')
      await fs.mkdir(path.join(projectDir, '.codex'), { recursive: true })
      await fs.writeFile(path.join(projectDir, '.codex', 'config.toml'), 'codex_hooks = false\n', 'utf8')

      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: homeDir, XDG_CONFIG_HOME: configHome },
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      await verifyRuntimeLayout(homeDir, 'codex', { codexCloseoutHook: 'absent' })
      const planningConfig = JSON.parse(await fs.readFile(path.join(projectDir, '.planning', 'config.json'), 'utf8'))
      expect(planningConfig.codex_hooks_waived).toBe(true)
      expect(planningConfig.codex_hooks_waiver_reason).toBe('global_enabled_project_disabled')
      expect(planningConfig.codex_hooks_waiver_scope).toBe('global')
      expect(planningConfig.codex_hooks_waiver_evidence).toEqual(expect.objectContaining({
        enabled_sources: ['global'],
        explicit_conflict: true,
        project_flag_state: 'disabled',
        global_flag_state: 'enabled',
      }))
    })

    tmpdirTest('Codex writer provenance prefers installed harness VERSION over repo mirror', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      const projectDir = path.join(tmpdir, 'project')
      await fs.mkdir(path.join(projectDir, '.planning'), { recursive: true })
      await fs.mkdir(path.join(projectDir, '.codex', 'get-shit-done-reflect'), { recursive: true })
      await fs.writeFile(
        path.join(projectDir, '.planning', 'config.json'),
        JSON.stringify({ model_profile: 'quality', gsd_reflect_version: '9.9.9-config' }),
        'utf8',
      )
      await fs.writeFile(
        path.join(projectDir, '.codex', 'get-shit-done-reflect', 'VERSION'),
        '0.0.1-stale\n',
        'utf8',
      )

      const installedVersion = (await fs.readFile(
        path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'VERSION'),
        'utf8',
      )).trim()
      const provenancePath = path.resolve(process.cwd(), 'get-shit-done/bin/lib/provenance.cjs')

      const output = execSync(
        `node - <<'NODE'\nconst { buildArtifactSignature } = require(${JSON.stringify(provenancePath)});\nconst sig = buildArtifactSignature({ cwd: process.cwd(), role: 'synthesizer', generatedAt: '2026-04-17T00:00:00Z' });\nconsole.log(JSON.stringify({ value: sig.gsd_version, source: sig.provenance_source.gsd_version }));\nNODE`,
        {
          env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome, CODEX_THREAD_ID: 'thread-test' },
          cwd: projectDir,
          encoding: 'utf8',
          timeout: 30000,
        },
      )

      const parsed = JSON.parse(output.trim())
      expect(parsed.value).toBe(installedVersion)
      expect(parsed.source).toBe('installed_harness')
      expect(parsed.value).not.toBe('0.0.1-stale')
    })

    tmpdirTest('Codex update workflow prefers stale global install over newer repo mirror and keeps the installed entrypoint chain', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      const projectDir = path.join(tmpdir, 'project')
      await fs.mkdir(path.join(projectDir, '.codex', 'get-shit-done-reflect'), { recursive: true })
      await fs.writeFile(path.join(projectDir, '.codex', 'get-shit-done-reflect', 'VERSION'), '1.19.6\n', 'utf8')
      await fs.writeFile(path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'VERSION'), '1.19.4\n', 'utf8')

      const resolverPath = path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'bin', 'update-target.cjs')
      const result = runNodeJson(
        resolverPath,
        ['--runtime', 'codex', '--cwd', projectDir, '--latest-version', '1.19.6'],
        {
          cwd: projectDir,
          env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        },
      )

      expect(result.selected_target.scope).toBe('global')
      expect(result.install_args).toEqual(['--codex', '--global'])
      expect(result.reason_code).toBe('global_stale_local_newer')
      expect(result.remaining_divergent_scope?.scope).toBe('local')

      const skillPath = path.join(tmpdir, '.codex', 'skills', 'gsdr-update', 'SKILL.md')
      const workflowPath = path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows', 'update.md')
      const skill = await fs.readFile(skillPath, 'utf8')
      const workflow = await fs.readFile(workflowPath, 'utf8')

      expect(skill).toContain('$HOME/.codex/get-shit-done-reflect/workflows/update.md')
      expect(workflow).toContain('get-shit-done-reflect/bin/update-target.cjs')
      expect(workflow).toContain('get-shit-done-reflect-cc@latest')
      expect(workflow).toContain('--codex --global')
      expect(workflow).toContain('remaining_divergent_scope')
      expect(workflow).toContain('Restart Codex CLI')
    })

    tmpdirTest('Codex update target preserves custom config dir and surfaces the other stale scope', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')
      const customCodexDir = path.join(tmpdir, 'custom-codex')

      execSync(`node "${installScript}" --codex --global --config-dir "${customCodexDir}"`, {
        env: {
          ...process.env,
          HOME: tmpdir,
          XDG_CONFIG_HOME: configHome,
          CODEX_CONFIG_DIR: customCodexDir,
        },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      const projectDir = path.join(tmpdir, 'project')
      await fs.mkdir(path.join(projectDir, '.codex', 'get-shit-done-reflect'), { recursive: true })
      await fs.writeFile(path.join(projectDir, '.codex', 'get-shit-done-reflect', 'VERSION'), '1.19.3\n', 'utf8')
      await fs.writeFile(path.join(customCodexDir, 'get-shit-done-reflect', 'VERSION'), '1.19.1\n', 'utf8')

      const resolverPath = path.join(customCodexDir, 'get-shit-done-reflect', 'bin', 'update-target.cjs')
      const result = runNodeJson(
        resolverPath,
        ['--runtime', 'codex', '--cwd', projectDir, '--latest-version', '1.19.6', '--config-dir', customCodexDir],
        {
          cwd: projectDir,
          env: {
            ...process.env,
            HOME: tmpdir,
            XDG_CONFIG_HOME: configHome,
            CODEX_CONFIG_DIR: customCodexDir,
          },
        },
      )

      expect(result.selected_target.scope).toBe('global')
      expect(result.reason_code).toBe('both_scopes_stale_select_global')
      expect(result.remaining_divergent_scope?.scope).toBe('local')
      expect(result.install_args).toEqual(['--codex', '--global', '--config-dir', customCodexDir])
      expect(result.config_dir).toBe(customCodexDir)

      const workflowPath = path.join(customCodexDir, 'get-shit-done-reflect', 'workflows', 'update.md')
      const workflow = await fs.readFile(workflowPath, 'utf8')
      expect(workflow).toContain('--config-dir')
      expect(workflow).toContain('remaining_divergent_scope')
    })

    tmpdirTest('Codex local update wiring stays on .codex for skill, workflow, and selected target', async ({ tmpdir }) => {
      const homeDir = path.join(tmpdir, 'home')
      const projectDir = path.join(tmpdir, 'project')
      const configHome = path.join(tmpdir, '.config')

      await fs.mkdir(homeDir, { recursive: true })
      await fs.mkdir(projectDir, { recursive: true })

      execSync(`node "${installScript}" --codex --local`, {
        env: { ...process.env, HOME: homeDir, XDG_CONFIG_HOME: configHome },
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      await fs.writeFile(
        path.join(projectDir, '.codex', 'get-shit-done-reflect', 'VERSION'),
        '1.19.5\n',
        'utf8',
      )

      const resolverPath = path.join(projectDir, '.codex', 'get-shit-done-reflect', 'bin', 'update-target.cjs')
      const result = runNodeJson(
        resolverPath,
        ['--runtime', 'codex', '--cwd', projectDir, '--latest-version', '1.19.6'],
        {
          cwd: projectDir,
          env: { ...process.env, HOME: homeDir, XDG_CONFIG_HOME: configHome },
        },
      )

      expect(result.selected_target.scope).toBe('local')
      expect(result.install_args).toEqual(['--codex', '--local'])
      expect(result.selected_target.version_path).toBe(path.join(projectDir, '.codex', 'get-shit-done-reflect', 'VERSION'))

      const skillPath = path.join(projectDir, '.codex', 'skills', 'gsdr-update', 'SKILL.md')
      const workflowPath = path.join(projectDir, '.codex', 'get-shit-done-reflect', 'workflows', 'update.md')
      const skill = await fs.readFile(skillPath, 'utf8')
      const workflow = await fs.readFile(workflowPath, 'utf8')

      expect(skill).toContain('Read the file at `./.codex/get-shit-done-reflect/workflows/update.md`')
      expect(workflow).toContain('./.codex/get-shit-done-reflect/bin/update-target.cjs')
      expect(workflow).toContain('--codex --local')
      expect(workflow).not.toContain('./.claude/')
    })

    tmpdirTest('--all install: VERSION files present in all supported runtimes', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      const versionPaths = SUPPORTED_INSTALLER_RUNTIMES.map((runtime) =>
        path.join(getSupportedRuntimeBaseDir(tmpdir, runtime), 'get-shit-done-reflect', 'VERSION'),
      )

      const versions = []
      for (const versionPath of versionPaths) {
        await fileExists(versionPath)
        const version = (await fs.readFile(versionPath, 'utf8')).trim()
        expect(version).toBeTruthy()
        versions.push(version)
      }

      expect(new Set(versions).size, 'Supported runtimes should share a single VERSION value').toBe(1)
    })
  })

  describe('Supported-runtime parity enforcement', () => {
    const INTENTIONAL_DIVERGENCES = {
      agentExtensions: {
        claude: '.md',
        codex: '.toml',
      },
      commandStructure: {
        claude: { dir: 'commands/gsdr', nested: true },
        codex: { dir: 'skills', nested: false },
      },
      hooksSupport: {
        claude: true,
        codex: false,
      },
      codexAgentsMd: true,
    }

    tmpdirTest('artifact count parity across supported runtimes', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      const runtimePaths = {
        claude: {
          agents: path.join(tmpdir, '.claude', 'agents'),
          workflows: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'workflows'),
          references: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'references'),
          templates: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'templates'),
        },
        codex: {
          agents: path.join(tmpdir, '.codex', 'agents'),
          workflows: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows'),
          references: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'references'),
          templates: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'templates'),
        },
      }

      const agentCounts = {}
      for (const runtime of SUPPORTED_INSTALLER_RUNTIMES) {
        const ext = INTENTIONAL_DIVERGENCES.agentExtensions[runtime]
        const dir = runtimePaths[runtime].agents
        const entries = fsSync.existsSync(dir) ? fsSync.readdirSync(dir) : []
        agentCounts[runtime] = entries.filter((entry) => entry.startsWith('gsdr-') && entry.endsWith(ext)).length
      }

      const referenceAgentCount = agentCounts.claude
      expect(referenceAgentCount, 'Claude should have at least 1 agent').toBeGreaterThanOrEqual(1)
      for (const runtime of SUPPORTED_INSTALLER_RUNTIMES) {
        expect(agentCounts[runtime], `Agent count parity: ${runtime} (${agentCounts[runtime]}) vs claude (${referenceAgentCount})`).toBe(referenceAgentCount)
      }

      for (const category of ['workflows', 'references', 'templates']) {
        const counts = {}
        for (const runtime of SUPPORTED_INSTALLER_RUNTIMES) {
          const dir = runtimePaths[runtime][category]
          const entries = fsSync.existsSync(dir) ? fsSync.readdirSync(dir) : []
          counts[runtime] = entries.filter((entry) => entry.endsWith('.md')).length
        }

        const referenceCount = counts.claude
        expect(referenceCount, `Claude should have at least 1 ${category} file`).toBeGreaterThanOrEqual(1)
        for (const runtime of SUPPORTED_INSTALLER_RUNTIMES) {
          expect(counts[runtime], `${category} count parity: ${runtime} (${counts[runtime]}) vs claude (${referenceCount})`).toBe(referenceCount)
        }
      }
    })

    tmpdirTest('agent name set equivalence across supported runtimes', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      function getAgentNames(dir, extension) {
        if (!fsSync.existsSync(dir)) return []
        return fsSync.readdirSync(dir)
          .filter((entry) => entry.startsWith('gsdr-') && entry.endsWith(extension))
          .map((entry) => entry.substring(0, entry.lastIndexOf('.')))
          .sort()
      }

      const agentDirs = {
        claude: path.join(tmpdir, '.claude', 'agents'),
        codex: path.join(tmpdir, '.codex', 'agents'),
      }

      const agentSets = {}
      for (const runtime of SUPPORTED_INSTALLER_RUNTIMES) {
        agentSets[runtime] = getAgentNames(agentDirs[runtime], INTENTIONAL_DIVERGENCES.agentExtensions[runtime])
      }

      expect(agentSets.claude.length, 'should have at least 1 agent').toBeGreaterThanOrEqual(1)
      expect(agentSets.codex, 'Agent names: Codex vs Claude').toEqual(agentSets.claude)
    })

    tmpdirTest('content quality: supported-runtime transformations applied', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      const codexWorkflowsDir = path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows')
      const codexWorkflowFiles = fsSync.readdirSync(codexWorkflowsDir).filter((entry) => entry.endsWith('.md'))
      for (const workflowFile of codexWorkflowFiles) {
        const content = await fs.readFile(path.join(codexWorkflowsDir, workflowFile), 'utf8')
        const commandInvocations = content.match(/\/gsdr:[a-z][\w-]*/g)
        expect(commandInvocations, `Codex workflow ${workflowFile}: should NOT contain /gsdr: command invocations (found: ${commandInvocations})`).toBeNull()
      }

      const codexAgentsDir = path.join(tmpdir, '.codex', 'agents')
      const codexAgentFiles = fsSync.readdirSync(codexAgentsDir).filter((entry) => entry.startsWith('gsdr-') && entry.endsWith('.toml'))
      expect(codexAgentFiles.length, 'should have Codex agent TOML files').toBeGreaterThanOrEqual(1)

      for (const agentFile of codexAgentFiles) {
        const content = await fs.readFile(path.join(codexAgentsDir, agentFile), 'utf8')
        expect(content, `Codex ${agentFile}: should contain sandbox_mode =`).toContain('sandbox_mode =')
      }
    })

    tmpdirTest('new runtime detection: unexpected runtime directories flagged against runtime-support authority', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      await installAllSupported(tmpdir, configHome)

      const knownHiddenDirs = new Set([
        ...SUPPORTED_INSTALLER_RUNTIMES.map((runtime) => INSTALLER_RUNTIME_METADATA[runtime].dirName),
        '.config',
        '.gsd',
        '.npm',
        '.node_modules',
      ])
      const entries = fsSync.readdirSync(tmpdir, { withFileTypes: true })
      const hiddenDirs = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith('.')).map((entry) => entry.name)

      const suspiciousRuntimeDirs = hiddenDirs.filter((dir) => {
        if (knownHiddenDirs.has(dir)) return false
        const dirPath = path.join(tmpdir, dir)
        return (
          dir === '.gemini' ||
          dir === '.opencode' ||
          fsSync.existsSync(path.join(dirPath, 'agents')) ||
          fsSync.existsSync(path.join(dirPath, 'get-shit-done-reflect'))
        )
      })

      expect(
        suspiciousRuntimeDirs,
        `Detected runtime directory ${suspiciousRuntimeDirs.join(', ')} outside SUPPORTED_INSTALLER_RUNTIMES in get-shit-done/bin/lib/runtime-support.cjs`,
      ).toHaveLength(0)

      const unexpectedConfigDirs = fsSync.existsSync(configHome)
        ? fsSync.readdirSync(configHome, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name === 'opencode').map((entry) => entry.name)
        : []
      expect(
        unexpectedConfigDirs,
        `Detected config runtime directory ${unexpectedConfigDirs.join(', ')} outside SUPPORTED_INSTALLER_RUNTIMES in get-shit-done/bin/lib/runtime-support.cjs`,
      ).toHaveLength(0)
    })
  })

  describe('Phase 60: post-install parity (SENS-06)', () => {
    async function setInstalledVersion(runtimeDir, version) {
      const versionPath = path.join(runtimeDir, 'get-shit-done-reflect', 'VERSION')
      const manifestPath = path.join(runtimeDir, 'gsd-file-manifest.json')
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))

      manifest.version = version
      await fs.writeFile(versionPath, `${version}\n`, 'utf8')
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
    }

    tmpdirTest('global install writes an honest-skip report when the other runtime is absent', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')
      const output = execSync(`node "${installScript}" --claude --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      const report = JSON.parse(await fs.readFile(path.join(tmpdir, '.claude', 'gsd-parity-report.json'), 'utf8'))
      expect(report.divergent).toBe(false)
      expect(report.reason).toBe('other_runtime_not_installed')
      expect(report.remediation_command).toBeNull()
      expect(output).not.toContain('Cross-runtime parity:')
    })

    tmpdirTest('divergent global installs produce cross-referencing parity reports for both runtimes', async ({ tmpdir }) => {
      const configHome = path.join(tmpdir, '.config')

      execSync(`node "${installScript}" --claude --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      const claudeDir = path.join(tmpdir, '.claude')
      const codexDir = path.join(tmpdir, '.codex')
      await setInstalledVersion(claudeDir, '1.19.7')

      const codexOutput = execSync(`node "${installScript}" --codex --global`, {
        env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
        cwd: tmpdir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
      })

      const codexVersion = (await fs.readFile(path.join(codexDir, 'get-shit-done-reflect', 'VERSION'), 'utf8')).trim()
      const codexReport = JSON.parse(await fs.readFile(path.join(codexDir, 'gsd-parity-report.json'), 'utf8'))

      expect(codexOutput).toContain('Cross-runtime parity:')
      expect(codexOutput).toContain('node bin/install.js --claude')
      expect(codexReport.divergent).toBe(true)
      expect(codexReport.this_runtime).toBe('codex')
      expect(codexReport.other_runtime).toBe('claude')
      expect(codexReport.this_version).toBe(codexVersion)
      expect(codexReport.other_version).toBe('1.19.7')

      const claudeResult = checkCrossRuntimeParity(claudeDir, 'claude', true, { otherRuntimeDir: codexDir })
      const claudeReport = JSON.parse(await fs.readFile(path.join(claudeDir, 'gsd-parity-report.json'), 'utf8'))

      expect(claudeResult.divergent).toBe(true)
      expect(claudeReport.divergent).toBe(true)
      expect(claudeReport.this_runtime).toBe('claude')
      expect(claudeReport.other_runtime).toBe('codex')
      expect(claudeReport.this_version).toBe('1.19.7')
      expect(claudeReport.other_version).toBe(codexVersion)
    })
  })
})
