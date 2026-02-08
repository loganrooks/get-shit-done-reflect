import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const KB_CREATE_DIRS = path.join(REPO_ROOT, '.claude/agents/kb-create-dirs.sh')
const KB_REBUILD_INDEX = path.join(REPO_ROOT, '.claude/agents/kb-rebuild-index.sh')

/** Run a KB shell script with HOME overridden to tmpdir */
function runKbScript(script, homeDir) {
  return execSync(`bash "${script}"`, {
    env: { ...process.env, HOME: homeDir },
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

    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
    const entries = await fs.readdir(kbDir)
    expect(entries).toContain('signals')
    expect(entries).toContain('spikes')
    expect(entries).toContain('lessons')
  })

  tmpdirTest('is idempotent on repeated execution', async ({ tmpdir }) => {
    runKbScript(KB_CREATE_DIRS, tmpdir)
    runKbScript(KB_CREATE_DIRS, tmpdir)

    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
      path.join(tmpdir, '.claude', 'gsd-knowledge', 'index.md'),
      'utf8'
    )
    expect(index).toContain('# Knowledge Store Index')
    expect(index).toContain('**Total entries:** 0')
    expect(index).toContain('## Signals (0)')
    expect(index).toContain('## Spikes (0)')
    expect(index).toContain('## Lessons (0)')
  })

  tmpdirTest('single signal entry appears in Signals table', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
    runKbScript(KB_CREATE_DIRS, tmpdir)

    await writeSignal(kbDir, 'atomic-test.md')
    runKbScript(KB_REBUILD_INDEX, tmpdir)

    const files = await fs.readdir(kbDir)
    const tmpFiles = files.filter(f => f.endsWith('.tmp'))
    expect(tmpFiles).toHaveLength(0)
    expect(files).toContain('index.md')
  })

  tmpdirTest('per-type section counts accurate in headers', async ({ tmpdir }) => {
    const kbDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
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
})
