import { afterEach, describe, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const automation = require(path.resolve(process.cwd(), 'get-shit-done/bin/lib/automation.cjs'))
const REPO_MANIFEST_PATH = path.resolve(process.cwd(), 'get-shit-done/feature-manifest.json')

async function writeJson(filePath, data) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true })
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function setupProject(tmpdir) {
  await writeJson(path.join(tmpdir, '.planning', 'config.json'), {
    automation: {
      stats: {},
    },
  })
}

async function readConfig(tmpdir) {
  return JSON.parse(await fsp.readFile(path.join(tmpdir, '.planning', 'config.json'), 'utf8'))
}

async function withManifestFixture(tmpdir, manifestPayload, run) {
  const fixturePath = path.join(tmpdir, 'feature-manifest.json')
  if (manifestPayload !== null) {
    await writeJson(fixturePath, manifestPayload)
  }

  const originalReadFileSync = fs.readFileSync.bind(fs)

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

  return run()
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('automation skip_reason warning behavior', () => {
  tmpdirTest('writes canonical skip reasons without warning and updates config.json', async ({ tmpdir }) => {
    await setupProject(tmpdir)

    await withManifestFixture(tmpdir, {
      automation_skip_reasons: ['level-1', 'disabled'],
    }, async () => {
      const stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(fs, 'writeSync').mockImplementation(() => 0)

      automation.cmdAutomationTrackEvent(tmpdir, 'signal_collection', 'skip', 'level-1', true)

      const config = await readConfig(tmpdir)
      expect(stderrSpy).not.toHaveBeenCalled()
      expect(config.automation.stats.signal_collection.last_skip_reason).toBe('level-1')
      expect(config.automation.stats.signal_collection.skips).toBe(1)
    })
  })

  tmpdirTest('warns on non-canonical skip reasons but still writes them', async ({ tmpdir }) => {
    await setupProject(tmpdir)

    await withManifestFixture(tmpdir, {
      automation_skip_reasons: ['level-1', 'disabled'],
    }, async () => {
      const stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(fs, 'writeSync').mockImplementation(() => 0)

      automation.cmdAutomationTrackEvent(tmpdir, 'signal_collection', 'skip', 'bogus-reason', true)

      const config = await readConfig(tmpdir)
      expect(stderrSpy).toHaveBeenCalledTimes(1)
      expect(stderrSpy.mock.calls[0][0]).toMatch(/non-canonical skip_reason/i)
      expect(config.automation.stats.signal_collection.last_skip_reason).toBe('bogus-reason')
      expect(config.automation.stats.signal_collection.skips).toBe(1)
    })
  })

  tmpdirTest('skips validation gracefully when feature-manifest.json is missing', async ({ tmpdir }) => {
    await setupProject(tmpdir)

    await withManifestFixture(tmpdir, null, async () => {
      const stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(fs, 'writeSync').mockImplementation(() => 0)

      automation.cmdAutomationTrackEvent(tmpdir, 'signal_collection', 'skip', 'bogus-reason', true)

      const config = await readConfig(tmpdir)
      expect(stderrSpy).not.toHaveBeenCalled()
      expect(config.automation.stats.signal_collection.last_skip_reason).toBe('bogus-reason')
      expect(config.automation.stats.signal_collection.skips).toBe(1)
    })
  })
})
