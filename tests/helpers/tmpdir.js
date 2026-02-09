// Temp directory fixture for test isolation
// Source: https://sdorra.dev/posts/2024-02-12-vitest-tmpdir
import { test } from 'vitest'
import os from 'node:os'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Extended test that provides an isolated temp directory
 * Usage: tmpdirTest('test name', async ({ tmpdir }) => { ... })
 * The directory is automatically cleaned up after the test
 */
export const tmpdirTest = test.extend({
  tmpdir: async ({}, use) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'gsd-test-'))
    await use(directory)
    await fs.rm(directory, { recursive: true })
  }
})

/**
 * Create a mock home directory structure for testing install
 * @param {string} tmpdir - Base temp directory
 * @returns {Promise<string>} Path to mock home directory
 */
export async function createMockHome(tmpdir) {
  const mockHome = path.join(tmpdir, 'home')
  await fs.mkdir(path.join(mockHome, '.claude'), { recursive: true })
  return mockHome
}

/**
 * Create a mock .planning directory structure for testing
 * @param {string} baseDir - Directory to create .planning in
 * @returns {Promise<string>} Path to .planning directory
 */
export async function createMockPlanning(baseDir) {
  const planningDir = path.join(baseDir, '.planning')
  await fs.mkdir(path.join(planningDir, 'phases'), { recursive: true })
  return planningDir
}
