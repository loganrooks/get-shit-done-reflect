import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const CLAUDE_SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/claude.cjs')
const DERIVED_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/derived.cjs')
const REGISTRY_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/registry.cjs')

const { loadClaude } = require(CLAUDE_SOURCE_PATH)
const derived = require(DERIVED_PATH)
const registry = require(REGISTRY_PATH)

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function writeSessionMeta(tmpdir, sessionId, fields = {}) {
  const filePath = path.join(tmpdir, 'home', '.claude', 'usage-data', 'session-meta', `${sessionId}.json`)
  await writeJson(filePath, {
    session_id: sessionId,
    project_path: tmpdir,
    start_time: '2026-04-17T06:00:00Z',
    user_message_count: 8,
    ...fields,
  })
}

async function ensureFacetsDir(tmpdir) {
  await fs.mkdir(path.join(tmpdir, 'home', '.claude', 'usage-data', 'facets'), { recursive: true })
}

async function writeFacet(tmpdir, sessionId, fields = {}) {
  const filePath = path.join(tmpdir, 'home', '.claude', 'usage-data', 'facets', `${sessionId}.json`)
  await writeJson(filePath, {
    session_id: sessionId,
    underlying_goal: 'diagnose regression',
    goal_categories: ['measurement'],
    outcome: 'mostly_achieved',
    user_satisfaction_counts: {
      likely_satisfied: 1,
      dissatisfied: 0,
    },
    claude_helpfulness: 'moderately_helpful',
    friction_counts: {
      tool_failure: 1,
    },
    primary_success: 'proxy shipped',
    brief_summary: 'Facet fixture',
    ...fields,
  })
}

function getExtractor() {
  const extractor = derived.DERIVED_EXTRACTORS.find((entry) => entry.name === 'reasoning_quality_proxy')
  if (!extractor) {
    throw new Error('Missing reasoning_quality_proxy extractor')
  }
  return extractor
}

function extractRows(tmpdir, extraContext = {}) {
  const claude = loadClaude(tmpdir, {
    homeDir: path.join(tmpdir, 'home'),
    projectFilter: tmpdir,
  })

  return getExtractor().extract({
    cwd: tmpdir,
    observed_at: '2026-04-17T20:00:00.000Z',
    claude,
    ...extraContext,
  })
}

describe('measurement reasoning-quality proxy extractor', () => {
  tmpdirTest('scores facets directly from session.facets.record and preserves proxy labelling', async ({ tmpdir }) => {
    await writeSessionMeta(tmpdir, 'sess-proxy')
    await writeFacet(tmpdir, 'sess-proxy', {
      goal_categories: ['measurement', 'debugging'],
      outcome: 'fully_achieved',
      user_satisfaction_counts: {
        likely_satisfied: 2,
        dissatisfied: 1,
      },
      claude_helpfulness: 'very_helpful',
      friction_counts: {
        tool_failure: 2,
        blocker: 1,
      },
      primary_success: 'report shipped',
    })

    const [row] = extractRows(tmpdir, {
      computedFeatures: {
        facets_semantic_summary: [
          {
            feature_name: 'facets_semantic_summary:sess-proxy',
            value: { underlying_goal: null },
          },
        ],
      },
    })

    expect(row.feature_name).toBe('reasoning_quality_proxy:sess-proxy')
    expect(row.availability_status).toBe('derived')
    expect(row.symmetry_marker).toBe('asymmetric_only')
    expect(row.reliability_tier).toBe('inferred')
    expect(row.value.proxy_mechanism).toBe('facets-substitute')
    expect(row.value.proxy_label).toBe('reasoning_quality_proxy_only')
    expect(row.value.reasoning_quality_proxy_score).toBe(3.8)
    expect(row.value.component_signals).toEqual({
      has_underlying_goal: true,
      outcome: 'fully_achieved',
      helpfulness: 'very_helpful',
      primary_success_present: true,
      likely_satisfied: 2,
      dissatisfied: 1,
      friction_total: 3,
      distinct_goal_categories: 2,
    })
    expect(row.provenance.source_read).toContain('direct, not computedFeatures')
    expect(row.provenance.parallel_to_extractor).toBe('facets_semantic_summary')
    expect(row.provenance.grader_independence).toBe('self_graded')
    expect(row.provenance.proxy_label).toBe('reasoning_quality_proxy_only')
    expect(row.notes.join(' ')).toMatch(/proxy only/i)
    expect(row.notes.join(' ')).toMatch(/Summary length is never used/i)
  })

  tmpdirTest('marks missing facet coverage as not_available instead of silently dropping the row', async ({ tmpdir }) => {
    await writeSessionMeta(tmpdir, 'sess-missing')
    await ensureFacetsDir(tmpdir)

    const [row] = extractRows(tmpdir)

    expect(row.feature_name).toBe('reasoning_quality_proxy:sess-missing')
    expect(row.availability_status).toBe('not_available')
    expect(row.reliability_tier).toBe('inferred')
    expect(row.value).toEqual({
      session_id: 'sess-missing',
      reasoning_quality_proxy_score: null,
      proxy_mechanism: 'facets-substitute',
      proxy_label: 'reasoning_quality_proxy_only',
      skip_reason: 'facets_unavailable',
    })
    expect(row.coverage.missing_sources).toContain('claude_facets')
    expect(row.provenance.grader_independence).toBe('self_graded')
    expect(row.notes.join(' ')).toMatch(/not_available/i)
  })

  it('registers reasoning_quality_proxy in derived exports and the built registry', () => {
    expect(derived.reasoning_quality_proxy).toBe(derived.reasoningQualityProxyExtractor)
    expect(derived.DERIVED_EXTRACTORS.some((entry) => entry.name === 'reasoning_quality_proxy')).toBe(true)

    const built = registry.buildRegistry().extractors.find((entry) => entry.name === 'reasoning_quality_proxy')

    expect(built).toBeDefined()
    expect(built.source_family).toBe('DERIVED')
    expect(built.reliability_tier).toBe('inferred')
    expect(built.serves_loop).toEqual(['agent_performance'])
  })
})
