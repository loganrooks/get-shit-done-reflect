// Source: upstream tests/explore-command.test.cjs, adapted to vitest ESM
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')

describe('explore command', () => {
  it('command file exists', () => {
    const p = path.join(REPO_ROOT, 'commands', 'gsd', 'explore.md')
    expect(existsSync(p)).toBe(true)
  })

  it('command file has required frontmatter', () => {
    const p = path.join(REPO_ROOT, 'commands', 'gsd', 'explore.md')
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('name: gsd:explore')
    expect(content).toContain('description:')
    expect(content).toContain('allowed-tools:')
  })

  it('workflow file exists', () => {
    const p = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'explore.md')
    expect(existsSync(p)).toBe(true)
  })

  it('workflow references questioning.md and domain-probes.md', () => {
    const p = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'explore.md')
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('questioning.md')
    expect(content).toContain('domain-probes.md')
  })

  it('workflow documents all 6 output types', () => {
    const p = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'explore.md')
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('Note')
    expect(content).toContain('Todo')
    expect(content).toContain('Seed')
    expect(content).toContain('Research question')
    expect(content).toContain('Requirement')
    expect(content.includes('New phase') || content.includes('phase')).toBe(true)
  })

  it('workflow enforces one question at a time principle', () => {
    const p = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'explore.md')
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('one question at a time')
  })

  it('workflow requires user confirmation before writing artifacts', () => {
    const p = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'explore.md')
    const content = readFileSync(p, 'utf-8')
    expect(
      content.includes('explicit user selection') || content.includes('Never write artifacts without')
    ).toBe(true)
  })

  it('workflow respects commit_docs config', () => {
    const p = path.join(REPO_ROOT, 'get-shit-done', 'workflows', 'explore.md')
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('commit_docs')
  })

  it('command references the workflow via execution_context', () => {
    const p = path.join(REPO_ROOT, 'commands', 'gsd', 'explore.md')
    const content = readFileSync(p, 'utf-8')
    expect(content).toContain('workflows/explore.md')
  })
})
