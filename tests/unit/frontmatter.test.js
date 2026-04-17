import { describe, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { reconstructFrontmatter, extractFrontmatter } = require('../../get-shit-done/bin/lib/frontmatter.cjs')
const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

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

describe('frontmatter split provenance support', () => {
  tmpdirTest('round-trips object-array and nested signature provenance without corruption', async () => {
    const frontmatter = {
      id: 'sig-test',
      type: 'signal',
      project: 'test-project',
      tags: ['provenance'],
      created: '2026-04-17T00:00:00Z',
      severity: 'notable',
      signal_type: 'deviation',
      about_work: [makeSignature('planner')],
      detected_by: makeSignature('sensor'),
      written_by: makeSignature('synthesizer'),
    }

    const yaml = reconstructFrontmatter(frontmatter)
    const parsed = extractFrontmatter(`---\n${yaml}\n---\n`)

    expect(Array.isArray(parsed.about_work)).toBe(true)
    expect(parsed.about_work[0]).toMatchObject({
      role: 'planner',
      harness: 'codex-cli',
      model: 'gpt-5.4',
    })
    expect(parsed.detected_by.role).toBe('sensor')
    expect(parsed.written_by.role).toBe('synthesizer')
    expect(parsed.about_work[0].provenance_status.session_id).toBe('exposed')
    expect(yaml).not.toContain('[object Object]')
  })

  tmpdirTest('plan validation rejects empty signature blocks and accepts complete ones', async ({ tmpdir }) => {
    const invalidPath = path.join(tmpdir, 'invalid-plan.md')
    await fs.writeFile(
      invalidPath,
      `---\nphase: 57.8-test\nplan: 01\ntype: execute\nwave: 1\ndepends_on: []\nfiles_modified: []\nautonomous: true\nmust_haves:\n  truths: []\n  artifacts: []\n  key_links: []\nsignature: {}\n---\n`,
      'utf8'
    )

    const invalid = JSON.parse(
      execSync(`node "${GSD_TOOLS}" frontmatter validate "${invalidPath}" --schema plan`, {
        cwd: process.cwd(),
        encoding: 'utf8',
      })
    )

    expect(invalid.valid).toBe(false)
    expect(invalid.missing).toContain('signature.role')
    expect(invalid.missing).toContain('signature.provenance_status.session_id')
    expect(invalid.missing).toContain('signature.provenance_source.gsd_version')

    const validPath = path.join(tmpdir, 'valid-plan.md')
    const validFrontmatter = {
      phase: '57.8-test',
      plan: '01',
      type: 'execute',
      wave: 1,
      depends_on: [],
      files_modified: [],
      autonomous: true,
      must_haves: { truths: [], artifacts: [], key_links: [] },
      signature: makeSignature('planner'),
    }

    await fs.writeFile(validPath, `---\n${reconstructFrontmatter(validFrontmatter)}\n---\n`, 'utf8')

    const valid = execSync(`node "${GSD_TOOLS}" frontmatter validate "${validPath}" --schema plan --raw`, {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim()

    expect(valid).toBe('valid')
  })
})
