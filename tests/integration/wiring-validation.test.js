import { describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs/promises'
import { globSync } from 'node:fs'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')

/** Read all .md files from a directory (non-recursive) */
async function readMdFiles(dir) {
  const absDir = path.join(REPO_ROOT, dir)
  let entries
  try {
    entries = await fs.readdir(absDir)
  } catch {
    return []
  }
  const mdFiles = entries.filter(f => f.endsWith('.md'))
  const results = []
  for (const f of mdFiles) {
    const filePath = path.join(absDir, f)
    const content = await fs.readFile(filePath, 'utf8')
    results.push({ name: f, path: filePath, relDir: dir, content })
  }
  return results
}

/** Extract @-references from file content (skip @.planning/* which are runtime-dependent) */
function extractAtRefs(content) {
  // Match patterns like @~/.claude/..., @.claude/..., @get-shit-done/...
  const pattern = /@(~\/\.claude\/[^\s)>"]+|\.claude\/[^\s)>"]+|get-shit-done\/[^\s)>"]+)/g
  const refs = []
  let match
  while ((match = pattern.exec(content)) !== null) {
    // Strip trailing markdown punctuation (backticks, periods, commas, colons)
    const ref = match[1].replace(/[`.,;:]+$/, '')
    // Skip .planning references (runtime-dependent)
    if (ref.includes('.planning')) continue
    refs.push(ref)
  }
  return refs
}

/** Map an @-reference to a repo-relative path */
function refToRepoPath(ref) {
  if (ref.startsWith('~/.claude/get-shit-done/')) {
    return ref.replace('~/.claude/get-shit-done/', 'get-shit-done/')
  }
  if (ref.startsWith('~/.claude/agents/')) {
    return ref.replace('~/.claude/agents/', '.claude/agents/')
  }
  if (ref.startsWith('~/.claude/')) {
    // Other ~/.claude/ paths - map based on content
    return ref.replace('~/.claude/', '')
  }
  if (ref.startsWith('.claude/')) {
    return ref
  }
  if (ref.startsWith('get-shit-done/')) {
    return ref
  }
  return ref
}

/** Check if a repo-relative path exists */
async function pathExists(repoRelPath) {
  try {
    await fs.access(path.join(REPO_ROOT, repoRelPath))
    return true
  } catch {
    return false
  }
}

/** Extract subagent_type values from content */
function extractSubagentTypes(content) {
  const types = new Set()
  // Match subagent_type="value" and subagent_type: "value"
  const patterns = [
    /subagent_type="([^"]+)"/g,
    /subagent_type:\s*"([^"]+)"/g,
    /subagent_type:\s*([a-zA-Z0-9-]+)/g,
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      types.add(match[1])
    }
  }
  return [...types]
}

describe('wiring validation', () => {
  describe('@-references in commands resolve', () => {
    it('all @-references in commands/gsd/*.md resolve to existing files', async () => {
      const files = await readMdFiles('commands/gsd')
      const broken = []

      for (const file of files) {
        const refs = extractAtRefs(file.content)
        for (const ref of refs) {
          const repoPath = refToRepoPath(ref)
          const exists = await pathExists(repoPath)
          if (!exists) {
            broken.push({ file: file.name, ref, resolvedTo: repoPath })
          }
        }
      }

      if (broken.length > 0) {
        const details = broken
          .map(b => `  ${b.file}: @${b.ref} -> ${b.resolvedTo}`)
          .join('\n')
        expect.fail(`Broken @-references in commands:\n${details}`)
      }
    })
  })

  describe('@-references in workflows resolve', () => {
    it('all @-references in get-shit-done/workflows/*.md resolve', async () => {
      const files = await readMdFiles('get-shit-done/workflows')
      const broken = []

      for (const file of files) {
        const refs = extractAtRefs(file.content)
        for (const ref of refs) {
          const repoPath = refToRepoPath(ref)
          const exists = await pathExists(repoPath)
          if (!exists) {
            broken.push({ file: file.name, ref, resolvedTo: repoPath })
          }
        }
      }

      if (broken.length > 0) {
        const details = broken
          .map(b => `  ${b.file}: @${b.ref} -> ${b.resolvedTo}`)
          .join('\n')
        expect.fail(`Broken @-references in workflows:\n${details}`)
      }
    })
  })

  describe('@-references in agents resolve', () => {
    it('all @-references in .claude/agents/gsd-*.md resolve', async () => {
      const allAgents = await readMdFiles('.claude/agents')
      const gsdAgents = allAgents.filter(f => f.name.startsWith('gsd-'))
      const broken = []

      for (const file of gsdAgents) {
        const refs = extractAtRefs(file.content)
        for (const ref of refs) {
          const repoPath = refToRepoPath(ref)
          const exists = await pathExists(repoPath)
          if (!exists) {
            broken.push({ file: file.name, ref, resolvedTo: repoPath })
          }
        }
      }

      if (broken.length > 0) {
        const details = broken
          .map(b => `  ${b.file}: @${b.ref} -> ${b.resolvedTo}`)
          .join('\n')
        expect.fail(`Broken @-references in agents:\n${details}`)
      }
    })
  })

  describe('subagent_type values match agent files', () => {
    it('all subagent_type values map to .claude/agents/{value}.md', async () => {
      // Collect all subagent_type values from all .md files
      const dirs = [
        'commands/gsd',
        'get-shit-done/workflows',
        '.claude/agents',
        'get-shit-done/templates',
      ]

      const allTypes = new Set()
      for (const dir of dirs) {
        const files = await readMdFiles(dir)
        for (const file of files) {
          for (const t of extractSubagentTypes(file.content)) {
            allTypes.add(t)
          }
        }
      }

      // "general-purpose" is built-in to Claude Code, not a file
      // Upstream GSD agents are installed at runtime via install.js, not shipped in repo
      const builtinTypes = new Set([
        'general-purpose', 'Explore', 'Plan',
        'gsd-integration-checker', 'gsd-project-researcher',
        'gsd-research-synthesizer', 'gsd-roadmapper',
        'gsd-plan-checker', 'gsd-verifier', 'gsd-codebase-mapper'
      ])

      const broken = []
      for (const agentType of allTypes) {
        if (builtinTypes.has(agentType)) continue
        const agentFile = path.join(REPO_ROOT, '.claude', 'agents', `${agentType}.md`)
        try {
          await fs.access(agentFile)
        } catch {
          broken.push(agentType)
        }
      }

      if (broken.length > 0) {
        expect.fail(
          `subagent_type values with no matching agent file:\n  ${broken.join('\n  ')}`
        )
      }
    })
  })

  describe('KB templates have required frontmatter fields', () => {
    it('signal template has severity and signal_type', async () => {
      const content = await fs.readFile(
        path.join(REPO_ROOT, '.claude/agents/kb-templates/signal.md'),
        'utf8'
      )
      expect(content).toContain('severity:')
      expect(content).toContain('signal_type:')
    })

    it('spike template has hypothesis and outcome', async () => {
      const content = await fs.readFile(
        path.join(REPO_ROOT, '.claude/agents/kb-templates/spike.md'),
        'utf8'
      )
      expect(content).toContain('hypothesis:')
      expect(content).toContain('outcome:')
    })

    it('lesson template has category and evidence', async () => {
      const content = await fs.readFile(
        path.join(REPO_ROOT, '.claude/agents/kb-templates/lesson.md'),
        'utf8'
      )
      expect(content).toContain('category:')
      expect(content).toContain('evidence:')
    })
  })

  describe('KB templates have required body sections', () => {
    it('signal template has "What Happened" section', async () => {
      const content = await fs.readFile(
        path.join(REPO_ROOT, '.claude/agents/kb-templates/signal.md'),
        'utf8'
      )
      expect(content).toContain('## What Happened')
    })

    it('spike template has "Decision" section', async () => {
      const content = await fs.readFile(
        path.join(REPO_ROOT, '.claude/agents/kb-templates/spike.md'),
        'utf8'
      )
      expect(content).toContain('## Decision')
    })

    it('lesson template has "Recommendation" section', async () => {
      const content = await fs.readFile(
        path.join(REPO_ROOT, '.claude/agents/kb-templates/lesson.md'),
        'utf8'
      )
      expect(content).toContain('## Recommendation')
    })
  })

  describe('reflect commands reference correct workflows', () => {
    it('collect-signals command references collect-signals workflow', async () => {
      const content = await fs.readFile(
        path.join(REPO_ROOT, 'commands/gsd/collect-signals.md'),
        'utf8'
      )
      expect(content).toMatch(/collect-signals/)
    })

    it('reflect command exists and references reflect workflow', async () => {
      // reflect command may be in .claude/commands/gsd/ (the fork addition)
      let content
      try {
        content = await fs.readFile(
          path.join(REPO_ROOT, 'commands/gsd/reflect.md'),
          'utf8'
        )
      } catch {
        content = await fs.readFile(
          path.join(REPO_ROOT, '.claude/commands/gsd/reflect.md'),
          'utf8'
        )
      }
      expect(content).toMatch(/reflect/)
    })

    it('spike command exists and references run-spike workflow', async () => {
      let content
      try {
        content = await fs.readFile(
          path.join(REPO_ROOT, 'commands/gsd/spike.md'),
          'utf8'
        )
      } catch {
        content = await fs.readFile(
          path.join(REPO_ROOT, '.claude/commands/gsd/spike.md'),
          'utf8'
        )
      }
      expect(content).toMatch(/spike/)
    })
  })
})
