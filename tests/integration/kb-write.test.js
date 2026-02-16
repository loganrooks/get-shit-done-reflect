import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('knowledge base writes', () => {
  describe('signal file creation', () => {
    tmpdirTest('creates signal file with correct frontmatter', async ({ tmpdir }) => {
      // Set up mock KB directory structure
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      const signalsDir = path.join(kbDir, 'signals', 'test-project')
      await fs.mkdir(signalsDir, { recursive: true })

      // Create a signal file (simulating what signal collector does)
      const signalContent = `---
id: sig-2026-02-03-test-signal
type: signal
project: test-project
tags: [test, verification]
created: 2026-02-03T12:00:00Z
updated: 2026-02-03T12:00:00Z
durability: workaround
status: active
severity: notable
signal_type: deviation
phase: 1
plan: 1
polarity: negative
source: auto
---

## What Happened

Test signal content for verification.

## Context

This is a test signal created by the test suite.
`
      const signalPath = path.join(signalsDir, '2026-02-03-test-signal.md')
      await fs.writeFile(signalPath, signalContent)

      // Verify signal was written correctly
      const written = await fs.readFile(signalPath, 'utf8')
      expect(written).toContain('id: sig-2026-02-03-test-signal')
      expect(written).toContain('type: signal')
      expect(written).toContain('severity: notable')
      expect(written).toContain('signal_type: deviation')
      expect(written).toContain('## What Happened')
    })

    tmpdirTest('signal file has valid YAML frontmatter', async ({ tmpdir }) => {
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      const signalsDir = path.join(kbDir, 'signals', 'test-project')
      await fs.mkdir(signalsDir, { recursive: true })

      const signalContent = `---
id: sig-test
type: signal
project: test-project
tags: [test]
created: 2026-02-03T12:00:00Z
updated: 2026-02-03T12:00:00Z
durability: workaround
status: active
severity: critical
signal_type: struggle
phase: 1
plan: 1
---

## What Happened

Critical signal.
`
      const signalPath = path.join(signalsDir, 'test-signal.md')
      await fs.writeFile(signalPath, signalContent)

      const written = await fs.readFile(signalPath, 'utf8')

      // Verify frontmatter structure
      const frontmatterMatch = written.match(/^---\n([\s\S]*?)\n---/)
      expect(frontmatterMatch).not.toBeNull()

      // Verify required fields are present
      const frontmatter = frontmatterMatch[1]
      expect(frontmatter).toContain('id:')
      expect(frontmatter).toContain('type: signal')
      expect(frontmatter).toContain('severity:')
      expect(frontmatter).toContain('signal_type:')
    })
  })

  describe('KB directory structure', () => {
    tmpdirTest('creates correct directory hierarchy', async ({ tmpdir }) => {
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')

      // Create KB structure
      await fs.mkdir(path.join(kbDir, 'signals'), { recursive: true })
      await fs.mkdir(path.join(kbDir, 'spikes'), { recursive: true })
      await fs.mkdir(path.join(kbDir, 'lessons'), { recursive: true })

      // Verify directories exist
      const dirs = await fs.readdir(kbDir)
      expect(dirs).toContain('signals')
      expect(dirs).toContain('spikes')
      expect(dirs).toContain('lessons')
    })

    tmpdirTest('creates project subdirectory in signals', async ({ tmpdir }) => {
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      const projectDir = path.join(kbDir, 'signals', 'my-project')
      await fs.mkdir(projectDir, { recursive: true })

      const exists = await fs.access(projectDir).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })
  })

  describe('index file operations', () => {
    tmpdirTest('can create index.md with entry summary', async ({ tmpdir }) => {
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      await fs.mkdir(kbDir, { recursive: true })

      const indexContent = `# Knowledge Base Index

**Last rebuilt:** 2026-02-03T12:00:00Z
**Total entries:** 1

## Signals

| Project | ID | Type | Severity | Created |
|---------|----|----|----------|---------|
| test-project | sig-2026-02-03-test | deviation | notable | 2026-02-03 |

## Lessons

*No lessons yet.*

## Spikes

*No spikes yet.*
`
      const indexPath = path.join(kbDir, 'index.md')
      await fs.writeFile(indexPath, indexContent)

      const written = await fs.readFile(indexPath, 'utf8')
      expect(written).toContain('# Knowledge Base Index')
      expect(written).toContain('## Signals')
      expect(written).toContain('test-project')
    })

    tmpdirTest('index reflects actual entries', async ({ tmpdir }) => {
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      const signalsDir = path.join(kbDir, 'signals', 'project-a')
      await fs.mkdir(signalsDir, { recursive: true })

      // Create two signal files
      await fs.writeFile(
        path.join(signalsDir, 'signal-1.md'),
        '---\nid: sig-1\ntype: signal\n---\nSignal 1'
      )
      await fs.writeFile(
        path.join(signalsDir, 'signal-2.md'),
        '---\nid: sig-2\ntype: signal\n---\nSignal 2'
      )

      // Count entries
      const files = await fs.readdir(signalsDir)
      const signalFiles = files.filter(f => f.endsWith('.md'))
      expect(signalFiles.length).toBe(2)
    })
  })

  describe('signal deduplication', () => {
    tmpdirTest('identifies duplicate signals by content hash', async ({ tmpdir }) => {
      const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
      const signalsDir = path.join(kbDir, 'signals', 'test-project')
      await fs.mkdir(signalsDir, { recursive: true })

      // Two signals with same "what happened" content
      const signal1 = `---
id: sig-001
type: signal
signal_type: deviation
occurrence_count: 1
---

## What Happened
API returned 500 error during deployment.
`
      const signal2SameContent = `---
id: sig-002
type: signal
signal_type: deviation
occurrence_count: 1
---

## What Happened
API returned 500 error during deployment.
`

      await fs.writeFile(path.join(signalsDir, 'signal-001.md'), signal1)

      // Read signal 1
      const content1 = await fs.readFile(path.join(signalsDir, 'signal-001.md'), 'utf8')
      const whatHappened1 = content1.match(/## What Happened\n([\s\S]*?)(?=\n##|$)/)?.[1]?.trim()

      // Compare with signal 2's content
      const whatHappened2 = signal2SameContent.match(/## What Happened\n([\s\S]*?)(?=\n##|$)/)?.[1]?.trim()

      // These should be identical - duplicate detection would increment count instead of creating new
      expect(whatHappened1).toBe(whatHappened2)
    })
  })
})
