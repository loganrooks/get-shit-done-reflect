import { describe, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const CLAUDE_SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/claude.cjs')
const DERIVED_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/derived.cjs')

const { loadClaude } = require(CLAUDE_SOURCE_PATH)
const derived = require(DERIVED_PATH)

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function writeSessionMeta(tmpdir, sessionId, fields = {}) {
  const filePath = path.join(tmpdir, 'home', '.claude', 'usage-data', 'session-meta', `${sessionId}.json`)
  await writeJson(filePath, {
    session_id: sessionId,
    project_path: tmpdir,
    start_time: '2026-04-16T10:00:00Z',
    user_message_count: 8,
    ...fields,
  })
}

async function writeFacet(tmpdir, sessionId, fields = {}) {
  const filePath = path.join(tmpdir, 'home', '.claude', 'usage-data', 'facets', `${sessionId}.json`)
  await writeJson(filePath, {
    session_id: sessionId,
    underlying_goal: 'diagnose regression',
    goal_categories: ['measurement'],
    outcome: 'fully_achieved',
    brief_summary: 'Facet fixture',
    ...fields,
  })
}

function extractFacetRows(tmpdir) {
  const claude = loadClaude(tmpdir, {
    homeDir: path.join(tmpdir, 'home'),
    projectFilter: tmpdir,
  })
  const extractor = derived.DERIVED_EXTRACTORS.find(entry => entry.name === 'facets_semantic_summary')
  return extractor.extract({
    cwd: tmpdir,
    observed_at: '2026-04-16T20:00:00.000Z',
    claude,
  })
}

describe('measurement facets semantic summary extractor', () => {
  tmpdirTest('emits derived and not_emitted rows with mandatory stratification on every row', async ({ tmpdir }) => {
    await writeSessionMeta(tmpdir, 'sess-with', { user_message_count: 3 })
    await writeSessionMeta(tmpdir, 'sess-without', { user_message_count: 14 })
    await writeFacet(tmpdir, 'sess-with', {
      friction_counts: { tool_failure: 1 },
      session_type: 'debugging',
    })

    const rows = extractFacetRows(tmpdir)

    expect(rows).toHaveLength(2)

    for (const row of rows) {
      expect(row.value.stratification).toBeDefined()
      expect(Object.keys(row.value.stratification).sort()).toEqual([
        'cluster_id',
        'facets_coverage_class',
        'size_bucket',
        'user_message_count',
        'write_path',
      ])
      expect(row.value.stratification.write_path).toBe('single')
    }

    const withFacet = rows.find(row => row.feature_name === 'facets_semantic_summary:sess-with')
    const withoutFacet = rows.find(row => row.feature_name === 'facets_semantic_summary:sess-without')

    expect(withFacet.availability_status).toBe('derived')
    expect(withFacet.value.underlying_goal).toBe('diagnose regression')
    expect(withFacet.value.goal_categories).toEqual(['measurement'])
    expect(withFacet.value.stratification.facets_coverage_class).toBe('with')

    expect(withoutFacet.availability_status).toBe('not_emitted')
    expect(Object.keys(withoutFacet.value).sort()).toEqual(['session_id', 'stratification'])
    expect(withoutFacet.value.stratification.facets_coverage_class).toBe('without')
  })
})
