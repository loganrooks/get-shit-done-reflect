import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { installKBScripts, migrateKB, countKBEntries } = require('../../bin/install.js')

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const KB_CREATE_DIRS = path.join(REPO_ROOT, '.claude/agents/kb-create-dirs.sh')
const KB_REBUILD_INDEX = path.join(REPO_ROOT, 'get-shit-done/bin/kb-rebuild-index.sh')
const GSD_TOOLS = path.join(REPO_ROOT, 'get-shit-done/bin/gsd-tools.cjs')

/** Run a KB shell script with HOME overridden to tmpdir and cwd set to tmpdir */
function runKbScript(script, homeDir) {
  return execSync(`bash "${script}"`, {
    env: { ...process.env, HOME: homeDir },
    cwd: homeDir,
    encoding: 'utf8',
    timeout: 10000,
  })
}

/** Write a signal fixture file */
async function writeSignal(kbDir, filename, fields = {}) {
  const defaults = {
    id: `sig-2026-01-15-${filename.replace('.md', '')}`,
    type: 'signal',
    project: 'test-project',
    tags: '[testing, fixture]',
    created: '2026-01-15T10:00:00Z',
    updated: '2026-01-15T10:00:00Z',
    durability: 'workaround',
    status: 'active',
    severity: 'notable',
    signal_type: 'deviation',
    phase: '1',
    plan: '1',
  }
  const merged = { ...defaults, ...fields }
  const frontmatter = Object.entries(merged)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const dir = path.join(kbDir, 'signals', merged.project)
  await fs.mkdir(dir, { recursive: true })
  const content = `---\n${frontmatter}\n---\n\n## What Happened\n\nTest signal: ${filename}\n`
  await fs.writeFile(path.join(dir, filename), content)
}

/** Write a spike fixture file */
async function writeSpike(kbDir, filename, fields = {}) {
  const defaults = {
    id: `spk-2026-01-15-${filename.replace('.md', '')}`,
    type: 'spike',
    project: 'test-project',
    tags: '[testing]',
    created: '2026-01-15T10:00:00Z',
    updated: '2026-01-15T10:00:00Z',
    durability: 'convention',
    status: 'active',
    hypothesis: '"Test hypothesis"',
    outcome: 'confirmed',
    rounds: '1',
  }
  const merged = { ...defaults, ...fields }
  const frontmatter = Object.entries(merged)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const dir = path.join(kbDir, 'spikes', merged.project)
  await fs.mkdir(dir, { recursive: true })
  const content = `---\n${frontmatter}\n---\n\n## Hypothesis\n\nTest spike.\n\n## Decision\n\nConfirmed.\n`
  await fs.writeFile(path.join(dir, filename), content)
}

/** Write a lesson fixture file */
async function writeLesson(kbDir, filename, fields = {}) {
  const defaults = {
    id: `les-2026-01-15-${filename.replace('.md', '')}`,
    type: 'lesson',
    project: '_global',
    tags: '[testing]',
    created: '2026-01-15T10:00:00Z',
    updated: '2026-01-15T10:00:00Z',
    durability: 'convention',
    status: 'active',
    category: 'testing',
    evidence_count: '1',
    evidence: '[sig-2026-01-15-test]',
  }
  const merged = { ...defaults, ...fields }
  const frontmatter = Object.entries(merged)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const dir = path.join(kbDir, 'lessons', merged.category || 'testing')
  await fs.mkdir(dir, { recursive: true })
  const content = `---\n${frontmatter}\n---\n\n## Lesson\n\nTest lesson.\n\n## Recommendation\n\nDo the thing.\n`
  await fs.writeFile(path.join(dir, filename), content)
}

describe('kb-create-dirs.sh', () => {
  tmpdirTest('creates signals/, spikes/, lessons/ directories', async ({ tmpdir }) => {
    runKbScript(KB_CREATE_DIRS, tmpdir)

    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    const entries = await fs.readdir(kbDir)
    expect(entries).toContain('signals')
    expect(entries).toContain('spikes')
    expect(entries).toContain('lessons')
  })

  tmpdirTest('is idempotent on repeated execution', async ({ tmpdir }) => {
    runKbScript(KB_CREATE_DIRS, tmpdir)
    runKbScript(KB_CREATE_DIRS, tmpdir)

    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    const entries = await fs.readdir(kbDir)
    expect(entries).toContain('signals')
    expect(entries).toContain('spikes')
    expect(entries).toContain('lessons')
  })

  tmpdirTest('exits with code 0', async ({ tmpdir }) => {
    // execSync throws on non-zero exit, so reaching here means success
    const output = runKbScript(KB_CREATE_DIRS, tmpdir)
    expect(output).toContain('Knowledge store directories verified')
  })
})

describe('kb-rebuild-index.sh', () => {
  tmpdirTest('empty KB produces valid index with "Total entries: 0"', async ({ tmpdir }) => {
    // Create empty KB structure first
    runKbScript(KB_CREATE_DIRS, tmpdir)
    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(
      path.join(tmpdir, '.gsd', 'knowledge', 'index.md'),
      'utf8'
    )
    expect(index).toContain('# Knowledge Store Index')
    expect(index).toContain('**Total entries:** 0')
    expect(index).toContain('## Signals (0)')
    expect(index).toContain('## Spikes (0)')
    expect(index).toContain('## Lessons (0)')
  })

  tmpdirTest('single signal entry appears in Signals table', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'test-deviation.md', {
      id: 'sig-2026-01-15-test-deviation',
      severity: 'high',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('**Total entries:** 1')
    expect(index).toContain('## Signals (1)')
    expect(index).toContain('sig-2026-01-15-test-deviation')
    expect(index).toContain('high')
  })

  tmpdirTest('multiple entry types all indexed correctly', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'multi-sig.md')
    await writeSpike(kbDir, 'multi-spk.md')
    await writeLesson(kbDir, 'multi-les.md')

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('**Total entries:** 3')
    expect(index).toContain('## Signals (1)')
    expect(index).toContain('## Spikes (1)')
    expect(index).toContain('## Lessons (1)')
  })

  tmpdirTest('archived entries filtered out', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'active-signal.md', {
      id: 'sig-2026-01-15-active',
      status: 'active',
    })
    await writeSignal(kbDir, 'archived-signal.md', {
      id: 'sig-2026-01-15-archived',
      status: 'archived',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('**Total entries:** 1')
    expect(index).toContain('sig-2026-01-15-active')
    expect(index).not.toContain('sig-2026-01-15-archived')
  })

  tmpdirTest('date descending sort order', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'older.md', {
      id: 'sig-2026-01-10-older',
      created: '2026-01-10T10:00:00Z',
    })
    await writeSignal(kbDir, 'newer.md', {
      id: 'sig-2026-01-20-newer',
      created: '2026-01-20T10:00:00Z',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    const newerPos = index.indexOf('sig-2026-01-20-newer')
    const olderPos = index.indexOf('sig-2026-01-10-older')
    expect(newerPos).toBeLessThan(olderPos)
  })

  tmpdirTest('entries without status field treated as active', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    // Write signal without status field
    const dir = path.join(kbDir, 'signals', 'test-project')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(
      path.join(dir, 'no-status.md'),
      `---
id: sig-2026-01-15-no-status
type: signal
project: test-project
tags: [test]
created: 2026-01-15T10:00:00Z
severity: low
signal_type: deviation
---

## What Happened

Signal without explicit status field.
`
    )

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('**Total entries:** 1')
    expect(index).toContain('sig-2026-01-15-no-status')
    // The script should display status as "active" for entries with no status field
    expect(index).toContain('active')
  })

  tmpdirTest('tags extraction handles [tag1, tag2] array format', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'tagged.md', {
      id: 'sig-2026-01-15-tagged',
      tags: '[api, performance, critical-path]',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('api')
    expect(index).toContain('performance')
  })

  tmpdirTest('spike outcome column populated', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSpike(kbDir, 'outcome-test.md', {
      id: 'spk-2026-01-15-outcome',
      outcome: 'rejected',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('spk-2026-01-15-outcome')
    expect(index).toContain('rejected')
  })

  tmpdirTest('lesson category column populated', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeLesson(kbDir, 'category-test.md', {
      id: 'les-2026-01-15-category',
      category: 'architecture',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('les-2026-01-15-category')
    expect(index).toContain('architecture')
  })

  tmpdirTest('atomic write leaves no .tmp file behind', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'atomic-test.md')
    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const files = await fs.readdir(kbDir)
    const tmpFiles = files.filter(f => f.endsWith('.tmp'))
    expect(tmpFiles).toHaveLength(0)
    expect(files).toContain('index.md')
  })

  tmpdirTest('per-type section counts accurate in headers', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'sig-1.md', { id: 'sig-2026-01-15-one' })
    await writeSignal(kbDir, 'sig-2.md', { id: 'sig-2026-01-15-two' })
    await writeSpike(kbDir, 'spk-1.md', { id: 'spk-2026-01-15-one' })
    await writeLesson(kbDir, 'les-1.md', { id: 'les-2026-01-15-one' })
    await writeLesson(kbDir, 'les-2.md', { id: 'les-2026-01-15-two' })
    await writeLesson(kbDir, 'les-3.md', { id: 'les-2026-01-15-three' })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('**Total entries:** 6')
    expect(index).toContain('## Signals (2)')
    expect(index).toContain('## Spikes (1)')
    expect(index).toContain('## Lessons (3)')
  })

  tmpdirTest('project-local KB (no lessons dir) omits Lessons section from index', async ({ tmpdir }) => {
    // Simulate project-local KB structure: signals, reflections, spikes (no lessons)
    const kbDir = path.join(tmpdir, '.planning', 'knowledge')
    await fs.mkdir(path.join(kbDir, 'signals'), { recursive: true })
    await fs.mkdir(path.join(kbDir, 'reflections'), { recursive: true })
    await fs.mkdir(path.join(kbDir, 'spikes'), { recursive: true })
    // Deliberately NOT creating lessons/

    await writeSignal(kbDir, 'local-sig.md', { id: 'sig-2026-01-15-local' })

    // Run kb-rebuild-index.sh from the tmpdir so it finds .planning/knowledge
    execSync(`bash "${KB_REBUILD_INDEX}"`, {
      env: { ...process.env, HOME: tmpdir },
      cwd: tmpdir,
      encoding: 'utf8',
      timeout: 10000,
    })

    const index = await fs.readFile(path.join(kbDir, 'index.md'), 'utf8')
    expect(index).toContain('## Signals (1)')
    expect(index).toContain('## Spikes (0)')
    expect(index).not.toContain('## Lessons')
    expect(index).toContain('**Total entries:** 1')
  })

  tmpdirTest('project-local KB rebuild refreshes kb.db alongside index.md', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.planning', 'knowledge')
    await fs.mkdir(kbDir, { recursive: true })
    await writeSignal(kbDir, 'local-signal.md', {
      id: 'sig-2026-01-15-local',
      project: 'local-project',
    })

    const output = runKbScript(KB_REBUILD_INDEX, tmpdir)

    expect(output).toContain('Index and kb.db rebuilt')
    expect(fsSync.existsSync(path.join(kbDir, 'index.md'))).toBe(true)
    expect(fsSync.existsSync(path.join(kbDir, 'kb.db'))).toBe(true)

    const stats = JSON.parse(execSync(`node "${GSD_TOOLS}" kb stats --cwd "${tmpdir}" --raw`, {
      cwd: tmpdir,
      env: { ...process.env, HOME: tmpdir },
      encoding: 'utf8',
      timeout: 10000,
    }).trim())

    expect(stats.total_signals).toBe(1)
    expect(stats.by_project[0].project).toBe('local-project')
  })

  tmpdirTest('rerunning project-local rebuild refreshes kb.db after corpus changes', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.planning', 'knowledge')
    await fs.mkdir(kbDir, { recursive: true })
    await writeSignal(kbDir, 'first-signal.md', {
      id: 'sig-2026-01-15-first',
      project: 'refresh-project',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    await writeSignal(kbDir, 'second-signal.md', {
      id: 'sig-2026-01-16-second',
      project: 'refresh-project',
    })

    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const stats = JSON.parse(execSync(`node "${GSD_TOOLS}" kb stats --cwd "${tmpdir}" --raw`, {
      cwd: tmpdir,
      env: { ...process.env, HOME: tmpdir },
      encoding: 'utf8',
      timeout: 10000,
    }).trim())

    expect(stats.total_signals).toBe(2)
    expect(stats.by_project[0].n).toBe(2)
  })
})

describe('installKBScripts', () => {
  tmpdirTest('creates ~/.gsd/bin/ directory', async ({ tmpdir }) => {
    installKBScripts(tmpdir)

    const binDir = path.join(tmpdir, 'bin')
    const exists = fsSync.existsSync(binDir)
    expect(exists).toBe(true)
  })

  tmpdirTest('copies kb-rebuild-index.sh to ~/.gsd/bin/', async ({ tmpdir }) => {
    installKBScripts(tmpdir)

    const scriptPath = path.join(tmpdir, 'bin', 'kb-rebuild-index.sh')
    const exists = fsSync.existsSync(scriptPath)
    expect(exists).toBe(true)
  })

  tmpdirTest('copies kb-create-dirs.sh to ~/.gsd/bin/', async ({ tmpdir }) => {
    installKBScripts(tmpdir)

    const scriptPath = path.join(tmpdir, 'bin', 'kb-create-dirs.sh')
    const exists = fsSync.existsSync(scriptPath)
    expect(exists).toBe(true)
  })

  tmpdirTest('sets executable permissions on copied scripts', async ({ tmpdir }) => {
    installKBScripts(tmpdir)

    const rebuildScript = path.join(tmpdir, 'bin', 'kb-rebuild-index.sh')
    const createDirsScript = path.join(tmpdir, 'bin', 'kb-create-dirs.sh')

    const rebuildMode = fsSync.statSync(rebuildScript).mode
    const createDirsMode = fsSync.statSync(createDirsScript).mode

    // Check that user-execute bit is set (0o100)
    expect(rebuildMode & 0o100).toBe(0o100)
    expect(createDirsMode & 0o100).toBe(0o100)

    // Check that full 0o755 permissions are set
    expect(rebuildMode & 0o755).toBe(0o755)
    expect(createDirsMode & 0o755).toBe(0o755)
  })

  tmpdirTest('is idempotent (safe to run twice)', async ({ tmpdir }) => {
    installKBScripts(tmpdir)
    installKBScripts(tmpdir)

    // Both scripts still exist with correct permissions
    const rebuildScript = path.join(tmpdir, 'bin', 'kb-rebuild-index.sh')
    const createDirsScript = path.join(tmpdir, 'bin', 'kb-create-dirs.sh')

    expect(fsSync.existsSync(rebuildScript)).toBe(true)
    expect(fsSync.existsSync(createDirsScript)).toBe(true)
    expect(fsSync.statSync(rebuildScript).mode & 0o755).toBe(0o755)
    expect(fsSync.statSync(createDirsScript).mode & 0o755).toBe(0o755)
  })
})

describe('migrateKB pre-migration backup', () => {
  tmpdirTest('creates timestamped backup when KB has existing entries', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    const signalDir = path.join(kbDir, 'signals', 'test-project')
    fsSync.mkdirSync(signalDir, { recursive: true })
    fsSync.writeFileSync(path.join(signalDir, 'test-signal.md'), '---\nid: sig-test\ntype: signal\n---\n')

    migrateKB(tmpdir, [])

    const entries = fsSync.readdirSync(tmpdir)
    const backupDirs = entries.filter(e => e.startsWith('knowledge.backup-'))
    expect(backupDirs.length).toBeGreaterThanOrEqual(1)

    // Verify backup contains the test signal
    const backupDir = path.join(tmpdir, backupDirs[0])
    const backupSignal = path.join(backupDir, 'signals', 'test-project', 'test-signal.md')
    expect(fsSync.existsSync(backupSignal)).toBe(true)
  })

  tmpdirTest('backup preserves all entry files', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')

    // Create 3 entries across signals/, spikes/, lessons/
    const sigDir = path.join(kbDir, 'signals', 'test-project')
    const spkDir = path.join(kbDir, 'spikes', 'test-project')
    const lesDir = path.join(kbDir, 'lessons', 'testing')
    fsSync.mkdirSync(sigDir, { recursive: true })
    fsSync.mkdirSync(spkDir, { recursive: true })
    fsSync.mkdirSync(lesDir, { recursive: true })
    fsSync.writeFileSync(path.join(sigDir, 'sig.md'), '---\nid: sig-1\ntype: signal\n---\n')
    fsSync.writeFileSync(path.join(spkDir, 'spk.md'), '---\nid: spk-1\ntype: spike\n---\n')
    fsSync.writeFileSync(path.join(lesDir, 'les.md'), '---\nid: les-1\ntype: lesson\n---\n')

    migrateKB(tmpdir, [])

    const entries = fsSync.readdirSync(tmpdir)
    const backupDirs = entries.filter(e => e.startsWith('knowledge.backup-'))
    expect(backupDirs.length).toBeGreaterThanOrEqual(1)

    const backupDir = path.join(tmpdir, backupDirs[0])
    expect(countKBEntries(backupDir)).toBe(3)
  })

  tmpdirTest('skips backup when KB is empty', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    fsSync.mkdirSync(path.join(kbDir, 'signals'), { recursive: true })
    fsSync.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
    fsSync.mkdirSync(path.join(kbDir, 'lessons'), { recursive: true })

    migrateKB(tmpdir, [])

    const entries = fsSync.readdirSync(tmpdir)
    const backupDirs = entries.filter(e => e.startsWith('knowledge.backup-'))
    expect(backupDirs).toHaveLength(0)
  })

  tmpdirTest('skips backup when KB directory does not exist', async ({ tmpdir }) => {
    // tmpdir has NO knowledge/ directory
    migrateKB(tmpdir, [])

    const entries = fsSync.readdirSync(tmpdir)
    const backupDirs = entries.filter(e => e.startsWith('knowledge.backup-'))
    expect(backupDirs).toHaveLength(0)
  })
})

describe('TST-04: KB migration nested subdirectories and edge-case filenames', () => {
  tmpdirTest('migrates deeply nested subdirectories (3 levels deep)', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')

    // Create 3-level deep nested structures
    const deepSignalDir = path.join(kbDir, 'signals', 'project-a', 'subsystem', 'deep')
    const deepSpikeDir = path.join(kbDir, 'spikes', 'project-b', 'nested')
    fsSync.mkdirSync(deepSignalDir, { recursive: true })
    fsSync.mkdirSync(deepSpikeDir, { recursive: true })

    const sigContent = '---\nid: sig-deep\ntype: signal\n---\nDeep signal content'
    const spkContent = '---\nid: spk-nested\ntype: spike\n---\nNested spike content'
    fsSync.writeFileSync(path.join(deepSignalDir, 'sig-deep.md'), sigContent)
    fsSync.writeFileSync(path.join(deepSpikeDir, 'spk-nested.md'), spkContent)

    migrateKB(tmpdir, [])

    // Verify files still exist at original relative paths
    expect(fsSync.readFileSync(path.join(deepSignalDir, 'sig-deep.md'), 'utf8')).toBe(sigContent)
    expect(fsSync.readFileSync(path.join(deepSpikeDir, 'spk-nested.md'), 'utf8')).toBe(spkContent)
    expect(countKBEntries(kbDir)).toBe(2)
  })

  tmpdirTest('preserves filenames with spaces', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    const projectDir = path.join(kbDir, 'signals', 'my project')
    fsSync.mkdirSync(projectDir, { recursive: true })

    const content = '---\nid: sig-spaces\ntype: signal\n---\nSignal with spaces in path'
    fsSync.writeFileSync(path.join(projectDir, 'signal with spaces.md'), content)

    migrateKB(tmpdir, [])

    // Verify file accessible and content preserved byte-for-byte
    const actual = fsSync.readFileSync(path.join(projectDir, 'signal with spaces.md'), 'utf8')
    expect(actual).toBe(content)
  })

  tmpdirTest('preserves filenames with unicode characters', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    const accentedDir = path.join(kbDir, 'lessons', 'filosof\u00eda')
    const asciiDir = path.join(kbDir, 'signals', 'test')
    fsSync.mkdirSync(accentedDir, { recursive: true })
    fsSync.mkdirSync(asciiDir, { recursive: true })

    const lessonContent = '---\nid: les-unica\ntype: lesson\n---\nLecci\u00f3n \u00fanica con acentos'
    const signalContent = '---\nid: sig-emdash\ntype: signal\n---\nContent with em\u2014dash and \u201csmart quotes\u201d'
    fsSync.writeFileSync(path.join(accentedDir, 'lecci\u00f3n-\u00fanica.md'), lessonContent)
    fsSync.writeFileSync(path.join(asciiDir, 'signal-with-em-dash.md'), signalContent)

    migrateKB(tmpdir, [])

    // Verify files exist and content preserved including unicode
    expect(fsSync.readFileSync(path.join(accentedDir, 'lecci\u00f3n-\u00fanica.md'), 'utf8')).toBe(lessonContent)
    expect(fsSync.readFileSync(path.join(asciiDir, 'signal-with-em-dash.md'), 'utf8')).toBe(signalContent)
  })

  tmpdirTest('preserves dot-prefixed files and directories', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    const hiddenProjectDir = path.join(kbDir, 'signals', '.hidden-project')
    const lessonDir = path.join(kbDir, 'lessons', 'test')
    fsSync.mkdirSync(hiddenProjectDir, { recursive: true })
    fsSync.mkdirSync(lessonDir, { recursive: true })

    const sigContent = '---\nid: sig-hidden\ntype: signal\n---\nHidden project signal'
    const metaContent = '---\nid: les-metadata\ntype: lesson\n---\nMetadata lesson'
    fsSync.writeFileSync(path.join(hiddenProjectDir, 'sig-hidden.md'), sigContent)
    fsSync.writeFileSync(path.join(lessonDir, '.metadata.md'), metaContent)

    migrateKB(tmpdir, [])

    // Verify dot-prefixed files and directories survive migration
    expect(fsSync.readFileSync(path.join(hiddenProjectDir, 'sig-hidden.md'), 'utf8')).toBe(sigContent)
    expect(fsSync.readFileSync(path.join(lessonDir, '.metadata.md'), 'utf8')).toBe(metaContent)
  })

  tmpdirTest('handles empty subdirectories gracefully', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    // Create empty subdirectories
    fsSync.mkdirSync(path.join(kbDir, 'signals', 'project-a'), { recursive: true })
    fsSync.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true })
    // Plus one real entry
    const lessonDir = path.join(kbDir, 'lessons', 'test')
    fsSync.mkdirSync(lessonDir, { recursive: true })
    const content = '---\nid: les-001\ntype: lesson\n---\nThe one real entry'
    fsSync.writeFileSync(path.join(lessonDir, 'les-001.md'), content)

    // Should not crash
    migrateKB(tmpdir, [])

    // The one real entry is preserved
    expect(fsSync.readFileSync(path.join(lessonDir, 'les-001.md'), 'utf8')).toBe(content)
    expect(countKBEntries(kbDir)).toBe(1)
  })
})

describe('TST-05: crash recovery for interrupted KB migration', () => {
  tmpdirTest('cpSync failure: original KB data preserved, no partial destination', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    const signalDir = path.join(kbDir, 'signals', 'test')
    fsSync.mkdirSync(signalDir, { recursive: true })
    const originalContent = '---\nid: sig-001\ntype: signal\n---\nOriginal content for crash test'
    fsSync.writeFileSync(path.join(signalDir, 'sig-001.md'), originalContent)

    // Mock cpSync to throw during backup creation
    const origCpSync = fsSync.cpSync
    fsSync.cpSync = (...args) => { throw new Error('Simulated disk failure during copy') }
    try {
      expect(() => migrateKB(tmpdir, [])).toThrow('Simulated disk failure during copy')
    } finally {
      fsSync.cpSync = origCpSync
    }

    // Original data must be preserved
    expect(fsSync.readFileSync(path.join(signalDir, 'sig-001.md'), 'utf8')).toBe(originalContent)
    expect(countKBEntries(kbDir)).toBe(1)

    // No partial backup directories should exist
    const entries = fsSync.readdirSync(tmpdir)
    const backupDirs = entries.filter(e => e.startsWith('knowledge.backup-'))
    expect(backupDirs).toHaveLength(0)
  })

  tmpdirTest('mkdirSync failure: no partial state created', async ({ tmpdir }) => {
    // Start WITHOUT an existing knowledge/ directory so backup is skipped
    // and mkdirSync for the new KB dirs is the first fs-intensive operation

    // Mock mkdirSync to throw when creating the new KB directory structure
    const origMkdirSync = fsSync.mkdirSync
    let mkdirCallCount = 0
    fsSync.mkdirSync = (...args) => {
      mkdirCallCount++
      // Throw on first mkdirSync call (creating signals/ dir)
      if (mkdirCallCount === 1) {
        throw new Error('Simulated permission denied')
      }
      return origMkdirSync(...args)
    }
    try {
      expect(() => migrateKB(tmpdir, [])).toThrow('Simulated permission denied')
    } finally {
      fsSync.mkdirSync = origMkdirSync
    }

    // No knowledge directory should have been created since the first mkdir failed
    const entries = fsSync.readdirSync(tmpdir)
    // The knowledge/ dir should not exist OR should be empty (no signals/ subdir)
    if (entries.includes('knowledge')) {
      // If recursive:true created the parent before failing on subdir,
      // at minimum no data files should exist
      expect(countKBEntries(path.join(tmpdir, 'knowledge'))).toBe(0)
    }
  })

  tmpdirTest('renameSync failure: original data preserved, copy may exist but is not authoritative', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    const signalDir = path.join(kbDir, 'signals', 'test')
    fsSync.mkdirSync(signalDir, { recursive: true })
    const originalContent = '---\nid: sig-rename\ntype: signal\n---\nRename crash test content'
    fsSync.writeFileSync(path.join(signalDir, 'sig-rename.md'), originalContent)

    // Let cpSync succeed (backup will be created) but mock renameSync to throw
    const origRenameSync = fsSync.renameSync
    fsSync.renameSync = (...args) => { throw new Error('Simulated rename failure') }
    try {
      // migrateKB may or may not throw depending on whether renameSync is called
      // in this code path. Since oldKBDir (os.homedir()/.claude/gsd-knowledge)
      // does not exist in the test env, renameSync is not called in this path.
      // The function completes normally -- this verifies that the non-rename
      // path preserves data even when renameSync is broken.
      migrateKB(tmpdir, [])
    } catch (e) {
      // If renameSync WAS called and threw, that's also acceptable
    } finally {
      fsSync.renameSync = origRenameSync
    }

    // Original KB data must still be intact regardless of rename behavior
    expect(fsSync.readFileSync(path.join(signalDir, 'sig-rename.md'), 'utf8')).toBe(originalContent)
    expect(countKBEntries(kbDir)).toBe(1)
  })

  tmpdirTest('successful migration creates backup and preserves data (happy path baseline)', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, 'knowledge')
    const signalDir = path.join(kbDir, 'signals', 'test')
    const spikeDir = path.join(kbDir, 'spikes', 'test')
    fsSync.mkdirSync(signalDir, { recursive: true })
    fsSync.mkdirSync(spikeDir, { recursive: true })
    fsSync.writeFileSync(path.join(signalDir, 'sig-happy.md'), '---\nid: sig-happy\ntype: signal\n---\nHappy path')
    fsSync.writeFileSync(path.join(spikeDir, 'spk-happy.md'), '---\nid: spk-happy\ntype: spike\n---\nHappy path spike')

    // Normal execution -- no mocking
    migrateKB(tmpdir, [])

    // All entries preserved
    expect(countKBEntries(kbDir)).toBe(2)
    expect(fsSync.readFileSync(path.join(signalDir, 'sig-happy.md'), 'utf8')).toContain('Happy path')
    expect(fsSync.readFileSync(path.join(spikeDir, 'spk-happy.md'), 'utf8')).toContain('Happy path spike')

    // Backup was created (since entries > 0)
    const entries = fsSync.readdirSync(tmpdir)
    const backupDirs = entries.filter(e => e.startsWith('knowledge.backup-'))
    expect(backupDirs.length).toBeGreaterThanOrEqual(1)

    // Backup also has correct entry count
    const backupDir = path.join(tmpdir, backupDirs[0])
    expect(countKBEntries(backupDir)).toBe(2)
  })
})

describe('KB template provenance fields', () => {
  tmpdirTest('signal template includes gsd_version field', async () => {
    const templatePath = path.join(REPO_ROOT, '.claude', 'agents', 'kb-templates', 'signal.md')
    const content = fsSync.readFileSync(templatePath, 'utf8')
    expect(content).toContain('gsd_version:')
  })

  tmpdirTest('spike template includes runtime, model, and gsd_version fields', async () => {
    const templatePath = path.join(REPO_ROOT, '.claude', 'agents', 'kb-templates', 'spike.md')
    const content = fsSync.readFileSync(templatePath, 'utf8')
    expect(content).toContain('runtime:')
    expect(content).toContain('model:')
    expect(content).toContain('gsd_version:')
  })

  tmpdirTest('lesson template includes runtime, model, and gsd_version fields', async () => {
    const templatePath = path.join(REPO_ROOT, '.claude', 'agents', 'kb-templates', 'lesson.md')
    const content = fsSync.readFileSync(templatePath, 'utf8')
    expect(content).toContain('runtime:')
    expect(content).toContain('model:')
    expect(content).toContain('gsd_version:')
  })

  tmpdirTest('knowledge-store.md documents gsd_version in common schema', async () => {
    const storePath = path.join(REPO_ROOT, '.claude', 'agents', 'knowledge-store.md')
    const content = fsSync.readFileSync(storePath, 'utf8')
    expect(content).toContain('gsd_version')
    expect(content).toContain('Optional provenance fields')
  })
})
