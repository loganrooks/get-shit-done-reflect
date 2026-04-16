import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const stratify = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/stratify.cjs'))

const {
  classifySessionSize,
  clusterByMtime,
  classifyWritePath,
  buildStratificationObject,
  SESSION_SIZE_THRESHOLDS,
} = stratify

describe('measurement stratify helper', () => {
  describe('classifySessionSize', () => {
    it('classifies small sessions from deduped_message_count', () => {
      expect(classifySessionSize({ jsonl_usage: { deduped_message_count: 3 } })).toEqual({ bucket: 'small', count: 3 })
      expect(classifySessionSize({ jsonl_usage: { deduped_message_count: SESSION_SIZE_THRESHOLDS.small_max } })).toEqual({ bucket: 'small', count: 5 })
    })

    it('classifies medium sessions from deduped_message_count', () => {
      expect(classifySessionSize({ jsonl_usage: { deduped_message_count: 6 } })).toEqual({ bucket: 'medium', count: 6 })
      expect(classifySessionSize({ jsonl_usage: { deduped_message_count: SESSION_SIZE_THRESHOLDS.medium_max } })).toEqual({ bucket: 'medium', count: 20 })
    })

    it('classifies large sessions from deduped_message_count', () => {
      expect(classifySessionSize({ jsonl_usage: { deduped_message_count: 50 } })).toEqual({ bucket: 'large', count: 50 })
    })

    it('falls back to user_message_count and returns unknown when no count exists', () => {
      expect(classifySessionSize({ user_message_count: 8 })).toEqual({ bucket: 'medium', count: 8 })
      expect(classifySessionSize({})).toEqual({ bucket: 'unknown', count: null })
    })
  })

  describe('clusterByMtime', () => {
    it('groups >=5 files inside the default 2-second window into one cluster', () => {
      const base = Date.UTC(2026, 3, 16, 15, 6, 46)
      const files = Array.from({ length: 6 }, (_, index) => ({ path: `/bulk/${index}.json`, mtime: base + (index * 200) }))
      const map = clusterByMtime(files)

      expect(map.size).toBe(1)
      const [cluster] = map.values()
      expect(cluster.size).toBe(6)
      expect(cluster.window_seconds).toBeLessThanOrEqual(2)
      expect(cluster.files).toEqual(files.map(file => file.path))
    })

    it('does not cluster fewer than 5 files even when their mtimes are close', () => {
      const base = Date.UTC(2026, 3, 16, 15, 6, 46)
      const files = [
        { path: '/a.md', mtime: base },
        { path: '/b.md', mtime: base + 500 },
        { path: '/c.md', mtime: base + 1000 },
        { path: '/d.md', mtime: base + 1200 },
      ]

      expect(clusterByMtime(files).size).toBe(0)
    })

    it('splits clusters when the gap exceeds the window and handles mixed mtime input types', () => {
      const base = Date.UTC(2026, 3, 16, 15, 6, 46)
      const files = [
        { path: '/group-a-1.json', mtime: new Date(base) },
        { path: '/group-a-2.json', mtime: new Date(base + 200) },
        { path: '/group-a-3.json', mtime: new Date(base + 400).toISOString() },
        { path: '/group-a-4.json', mtime: base + 600 },
        { path: '/group-a-5.json', mtime: base + 800 },
        { path: '/ignore-me.json', mtime: 'not-a-date' },
        { path: '/group-b-1.json', mtime: base + 10000 },
        { path: '/group-b-2.json', mtime: base + 10200 },
        { path: '/group-b-3.json', mtime: base + 10400 },
        { path: '/group-b-4.json', mtime: base + 10600 },
        { path: '/group-b-5.json', mtime: base + 10800 },
      ]

      const map = clusterByMtime(files)

      expect(map.size).toBe(2)
      const clusters = [...map.values()]
      expect(clusters[0].files).toEqual([
        '/group-a-1.json',
        '/group-a-2.json',
        '/group-a-3.json',
        '/group-a-4.json',
        '/group-a-5.json',
      ])
      expect(clusters[1].files).toEqual([
        '/group-b-1.json',
        '/group-b-2.json',
        '/group-b-3.json',
        '/group-b-4.json',
        '/group-b-5.json',
      ])
    })

    it('returns an empty map for empty or invalid input', () => {
      expect(clusterByMtime([]).size).toBe(0)
      expect(clusterByMtime(null).size).toBe(0)
      expect(clusterByMtime([{ path: '/bad.json', mtime: 'invalid' }]).size).toBe(0)
    })
  })

  describe('classifyWritePath', () => {
    it('returns bulk classification when a file is part of a cluster', () => {
      const base = Date.UTC(2026, 3, 16, 15, 6, 46)
      const files = Array.from({ length: 5 }, (_, index) => ({ path: `/cluster/${index}.json`, mtime: base + (index * 100) }))
      const map = clusterByMtime(files)
      const classification = classifyWritePath('/cluster/0.json', map)

      expect(classification.write_path).toBe('bulk')
      expect(classification.cluster_id).toMatch(/^cluster_/)
      expect(classification.cluster_size).toBe(5)
    })

    it('returns single classification when the file is not in a cluster map', () => {
      expect(classifyWritePath('/isolated.json', clusterByMtime([]))).toEqual({
        write_path: 'single',
        cluster_id: null,
        cluster_size: null,
      })
    })
  })

  describe('buildStratificationObject', () => {
    it('composes size, write_path, coverage class, and cluster id for a clustered session', () => {
      const base = Date.UTC(2026, 3, 16, 15, 6, 46)
      const clusterMap = clusterByMtime(Array.from({ length: 5 }, (_, index) => ({
        path: `/session/${index}.json`,
        mtime: base + (index * 100),
      })))

      expect(buildStratificationObject({
        session: { jsonl_usage: { deduped_message_count: 10 } },
        cluster_map: clusterMap,
        session_meta_path: '/session/0.json',
        has_facet: true,
      })).toEqual({
        write_path: 'bulk',
        facets_coverage_class: 'with',
        size_bucket: 'medium',
        cluster_id: [...clusterMap.keys()][0],
        user_message_count: 10,
      })
    })

    it('falls back to single/without when no facet or session_meta_path is supplied', () => {
      expect(buildStratificationObject({
        session: {},
        cluster_map: new Map(),
        session_meta_path: null,
        has_facet: false,
      })).toEqual({
        write_path: 'single',
        facets_coverage_class: 'without',
        size_bucket: 'unknown',
        cluster_id: null,
        user_message_count: null,
      })
    })
  })
})
