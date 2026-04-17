import { afterEach, describe, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const REGISTRY = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/registry.cjs'))
const { buildGsdrExtractors } = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/gsdr.cjs'))
const REPO_MANIFEST_PATH = path.resolve(process.cwd(), 'get-shit-done/feature-manifest.json')

async function writeJson(filePath, data) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true })
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function setupConfig(tmpdir, config) {
  await writeJson(path.join(tmpdir, '.planning', 'config.json'), config)
}

function extractSkipReasonRows(tmpdir) {
  const extractor = buildGsdrExtractors({
    defineExtractor: REGISTRY.defineExtractor,
    buildFeatureRecord: REGISTRY.buildFeatureRecord,
  }).find(entry => entry.name === 'skip_reason_canonical')

  return extractor.extract({
    cwd: tmpdir,
    observed_at: '2026-04-16T20:00:00.000Z',
  })
}

async function withManifestFixture(tmpdir, manifestPayload, run) {
  const fixturePath = path.join(tmpdir, 'feature-manifest.json')
  if (manifestPayload !== null) {
    await writeJson(fixturePath, manifestPayload)
  }

  const originalReadFileSync = fs.readFileSync.bind(fs)
  const originalStatSync = fs.statSync.bind(fs)
  const originalExistsSync = fs.existsSync.bind(fs)

  vi.spyOn(fs, 'readFileSync').mockImplementation((filePath, ...args) => {
    if (path.resolve(String(filePath)) === REPO_MANIFEST_PATH) {
      if (manifestPayload === null) {
        const error = new Error('ENOENT')
        error.code = 'ENOENT'
        throw error
      }
      return originalReadFileSync(fixturePath, ...args)
    }
    return originalReadFileSync(filePath, ...args)
  })

  vi.spyOn(fs, 'statSync').mockImplementation((filePath, ...args) => {
    if (path.resolve(String(filePath)) === REPO_MANIFEST_PATH) {
      if (manifestPayload === null) {
        const error = new Error('ENOENT')
        error.code = 'ENOENT'
        throw error
      }
      return originalStatSync(fixturePath, ...args)
    }
    return originalStatSync(filePath, ...args)
  })

  vi.spyOn(fs, 'existsSync').mockImplementation((filePath, ...args) => {
    if (path.resolve(String(filePath)) === REPO_MANIFEST_PATH) {
      return manifestPayload !== null && originalExistsSync(fixturePath, ...args)
    }
    return originalExistsSync(filePath, ...args)
  })

  return run()
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('measurement skip_reason_canonical extractor', () => {
  tmpdirTest('marks canonical skip reasons as exposed and canonical', async ({ tmpdir }) => {
    await setupConfig(tmpdir, {
      automation: {
        stats: {
          signal_collection: {
            last_skip_reason: 'level-1',
          },
        },
      },
    })

    await withManifestFixture(tmpdir, {
      automation_skip_reasons: ['level-1', 'disabled'],
    }, async () => {
      const [row] = extractSkipReasonRows(tmpdir)

      expect(row.feature_name).toBe('skip_reason_canonical:signal_collection')
      expect(row.availability_status).toBe('exposed')
      expect(row.value.canonical).toBe(true)
      expect(row.value.canonical_match).toBe('level-1')
    })
  })

  tmpdirTest('marks non-canonical skip reasons as exposed with vocabulary drift notes', async ({ tmpdir }) => {
    await setupConfig(tmpdir, {
      automation: {
        stats: {
          signal_collection: {
            last_skip_reason: 'bogus-reason',
          },
        },
      },
    })

    await withManifestFixture(tmpdir, {
      automation_skip_reasons: ['level-1', 'disabled'],
    }, async () => {
      const [row] = extractSkipReasonRows(tmpdir)

      expect(row.availability_status).toBe('exposed')
      expect(row.value.canonical).toBe(false)
      expect(row.value.canonical_match).toBe('unknown')
      expect(row.notes[0]).toMatch(/Non-canonical skip_reason observed/i)
    })
  })

  tmpdirTest('emits a single not_emitted row when no automation stats exist', async ({ tmpdir }) => {
    await setupConfig(tmpdir, {
      automation: {
        stats: {},
      },
    })

    await withManifestFixture(tmpdir, {
      automation_skip_reasons: ['level-1', 'disabled'],
    }, async () => {
      const [row] = extractSkipReasonRows(tmpdir)

      expect(row.feature_name).toBe('skip_reason_canonical')
      expect(row.availability_status).toBe('not_emitted')
      expect(row.value.count_by_reason).toEqual({})
    })
  })

  tmpdirTest('emits not_available when the canonical manifest is missing', async ({ tmpdir }) => {
    await setupConfig(tmpdir, {
      automation: {
        stats: {
          signal_collection: {
            last_skip_reason: 'level-1',
          },
        },
      },
    })

    await withManifestFixture(tmpdir, null, async () => {
      const [row] = extractSkipReasonRows(tmpdir)

      expect(row.feature_name).toBe('skip_reason_canonical')
      expect(row.availability_status).toBe('not_available')
      expect(row.value.reason).toMatch(/feature-manifest\.automation_skip_reasons missing or empty/)
    })
  })
})
