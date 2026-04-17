import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs/promises'
import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)
const QUERY_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/query.cjs')
const query = require(QUERY_PATH)

describe('measurement interpretation-layer helpers', () => {
  it('suggests overlapping extractors that are registered but not computed', () => {
    const interpretation = {
      distinguishing_features: ['tool_invocation_sequence'],
    }
    const registryExtractors = [
      { name: 'tool_invocation_sequence', distinguishes: ['scope_narrowing_cascade_candidate'] },
      { name: 'intervention_points', distinguishes: ['scope_narrowing_cascade_candidate'] },
      { name: 'marker_density', distinguishes: ['model_effort_stratification'] },
    ]
    const computedFeatures = [
      { feature: 'tool_invocation_sequence:sess-1', extractor: 'tool_invocation_sequence' },
    ]

    expect(query.suggestDistinguishingFeatures(interpretation, registryExtractors, computedFeatures)).toEqual([
      {
        extractor: 'intervention_points',
        distinguishes: ['scope_narrowing_cascade_candidate'],
        reason: 'registered_but_not_computed_for_current_scope',
      },
    ])
  })

  it('returns an empty suggestion list when no distinguishing features exist', () => {
    expect(query.suggestDistinguishingFeatures({ distinguishing_features: [] }, [], [])).toEqual([])
  })

  it('returns an empty suggestion list when nothing overlaps', () => {
    const interpretation = { distinguishing_features: ['topic_shift_markers'] }
    const registryExtractors = [
      { name: 'intervention_points', distinguishes: ['scope_narrowing_cascade_candidate'] },
    ]
    const computedFeatures = [
      { feature: 'topic_shift_markers:sess-1', extractor: 'topic_shift_markers' },
    ]

    expect(query.suggestDistinguishingFeatures(interpretation, registryExtractors, computedFeatures)).toEqual([])
  })

  tmpdirTest('loads intervention outcomes from markdown frontmatter with nested objects intact', async ({ tmpdir }) => {
    const dir = path.join(tmpdir, '.planning', 'measurement', 'interventions')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(
      path.join(dir, '2026-04-17-test.md'),
      `---\nintervention_id: int-1\ninterpretation_id: interp-1\nintervention_artifact:\n  phase: 58\n  commit: abc123\npredicted_outcome:\n  summary: test\n  measurable_in_terms_of:\n    - intervention_points\nactual_outcome:\n  summary: null\n  evidence_paths: []\noutcome_status: pending\nevaluation_date: null\n---\n\n# Test\n`
    )

    const [record] = query.loadInterventionOutcomes(tmpdir, 'interp-1')
    expect(record.intervention_id).toBe('int-1')
    expect(record.intervention_artifact.phase).toBe('58')
    expect(record.intervention_artifact.commit).toBe('abc123')
    expect(record.predicted_outcome.summary).toBe('test')
    expect(record.outcome_status).toBe('pending')
    expect(query.loadInterventionOutcomes(tmpdir, 'missing')).toEqual([])
  })

  tmpdirTest('returns an empty outcomes list when the interventions directory is missing', ({ tmpdir }) => {
    expect(query.loadInterventionOutcomes(tmpdir, 'interp-1')).toEqual([])
  })

  tmpdirTest('aggregates revision history from diagnostic frontmatter', async ({ tmpdir }) => {
    const dir = path.join(tmpdir, '.planning', 'measurement', 'diagnostics')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(
      path.join(dir, '2026-04-17-a.md'),
      `---\ndiagnostic_id: diag-a\nrevises: phase_57_5_live_registry_query\nrevision_classification: progressive\nrevised_at: 2026-04-17T00:00:00Z\n---\n\n# A\n`
    )
    await fs.writeFile(
      path.join(dir, '2026-04-18-b.md'),
      `---\ndiagnostic_id: diag-b\nrevises: phase_57_5_live_registry_query\nrevision_classification: degenerating\nrevised_at: 2026-04-18T00:00:00Z\n---\n\n# B\n`
    )

    const history = query.aggregateRevisionHistory(tmpdir, 'phase_57_5_live_registry_query')
    expect(history.distribution).toEqual({ progressive: 1, degenerating: 1 })
    expect(history.revisions).toHaveLength(2)
  })

  it('composes governed provenance summaries without forbidden phrasing', () => {
    const summary = query.composeProvenanceSummary(
      { competing_readings: ['a', 'b'] },
      [{ outcome_status: 'confirmed' }, { outcome_status: 'pending' }],
      { progressive: 1 },
      2
    )

    expect(summary).toContain('surviving_challenge_from_2_perspectives')
    expect(summary).toContain('grounded_in_1_interventions')
    expect(summary).toContain('carrying_2_tracked_anomalies')
    expect(summary).toContain('revisions=[progressive=1]')
    expect(summary).not.toContain('verified')
    expect(summary).not.toContain('confirmed to be true')
  })
})
