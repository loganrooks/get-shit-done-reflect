import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

const {
  asciiBar,
  headerBlock,
  mdTable,
} = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/report/primitives.cjs'))

describe('measurement report primitives', () => {
  it('renders a no-data row when a markdown table has no rows', () => {
    const out = mdTable(['Feature', 'Runtime'], [])

    expect(out).toContain('| Feature | Runtime |')
    expect(out).toContain('| (no data) | (no data) |')
  })

  it('escapes pipes and newlines in markdown table cells', () => {
    const out = mdTable(['Value'], [['left|right\nnext line']])

    expect(out).toContain('left\\|right next line')
  })

  it('respects alignment markers in the separator row', () => {
    const out = mdTable(['Left', 'Right', 'Center'], [['a', '1', 'b']], {
      alignments: ['left', 'right', 'center'],
    })

    expect(out.split('\n')[1]).toBe('| --- | ---: | :---: |')
  })

  it('renders a fixed-width bar area for asciiBar', () => {
    const out = asciiBar('load', 5, 10, 12)
    const parts = out.split(' | ')

    expect(parts[1]).toHaveLength(12)
    expect(parts[2]).toBe('5')
  })

  it('renders an empty bar for zero values', () => {
    const out = asciiBar('idle', 0, 10, 8)
    const parts = out.split(' | ')

    expect(parts[1]).toBe('        ')
    expect(parts[2]).toBe('0')
  })

  it('clamps bars to full width when value exceeds max', () => {
    const out = asciiBar('full', 20, 10, 6)
    const parts = out.split(' | ')

    expect(parts[1]).toBe('######')
    expect(parts[2]).toBe('20')
  })

  it('surfaces the required header block fields', () => {
    const out = headerBlock({
      title: 'Signal Quality',
      observed_at: '2026-04-16T21:00:00.000Z',
      provenance: {
        live_overlay: { extractor_count: 26 },
      },
      coverage: {
        feature_row_count: 12,
        by_source_family: {
          DERIVED: {
            missing_sources: ['insights_products'],
            stale_sources: [],
            unknown_sources: ['insights_products'],
          },
          RUNTIME: {
            missing_sources: [],
            stale_sources: ['codex_sessions'],
            unknown_sources: [],
          },
        },
      },
      reliability: { overall_tier: 'artifact_derived' },
      anomaly_count: 3,
    })

    expect(out).toContain('observed_at: 2026-04-16T21:00:00.000Z')
    expect(out).toContain('extractor_registry_size: 26')
    expect(out).toContain('feature_row_count: 12')
    expect(out).toContain('coverage.by_source_family.missing_sources:')
    expect(out).toContain('coverage.by_source_family.stale_sources:')
    expect(out).toContain('coverage.by_source_family.unknown_sources:')
    expect(out).toContain('reliability.overall_tier: artifact_derived')
    expect(out).toContain('anomaly_count: 3')
  })

  it('renders caveats as a bullet list when provided', () => {
    const out = headerBlock({
      title: 'Agent Performance',
      observed_at: '2026-04-16T21:00:00.000Z',
      provenance: {},
      coverage: { by_source_family: {} },
      reliability: {},
      anomaly_count: 0,
      caveats: ['first caveat', 'second caveat'],
    })

    expect(out).toContain('caveats:')
    expect(out).toContain('  - first caveat')
    expect(out).toContain('  - second caveat')
  })
})
