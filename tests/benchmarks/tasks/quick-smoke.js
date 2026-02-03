/**
 * Quick Smoke Test Benchmark
 *
 * Verifies basic GSD functionality works:
 * - File structure is correct
 * - Commands are accessible
 * - Basic operations don't error
 *
 * Tier: quick
 * Duration: <30 seconds
 * Token cost: minimal (no API calls)
 */

import { Benchmark } from '../framework.js'
import fs from 'node:fs/promises'
import path from 'node:path'

export default class QuickSmokeBenchmark extends Benchmark {
  constructor() {
    super({
      name: 'quick-smoke',
      description: 'Basic functionality smoke test',
      tier: 'quick',
      thresholds: {
        files_found: 5,  // Minimum required files
        structure_valid: 1  // Boolean as number
      }
    })
  }

  async setup(workDir) {
    // Create mock GSD installation structure
    this.mockClaudeDir = path.join(workDir, '.claude')
    await fs.mkdir(path.join(this.mockClaudeDir, 'commands', 'gsd'), { recursive: true })
    await fs.mkdir(path.join(this.mockClaudeDir, 'get-shit-done'), { recursive: true })
    await fs.mkdir(path.join(this.mockClaudeDir, 'agents'), { recursive: true })

    // Create mock command files
    await fs.writeFile(
      path.join(this.mockClaudeDir, 'commands', 'gsd', 'help.md'),
      '# Help\nGSD help command.'
    )
    await fs.writeFile(
      path.join(this.mockClaudeDir, 'commands', 'gsd', 'start.md'),
      '# Start\nGSD start command.'
    )

    // Create mock workflow files
    await fs.writeFile(
      path.join(this.mockClaudeDir, 'get-shit-done', 'system-prompt.md'),
      '# System Prompt\nGSD system prompt.'
    )

    // Create mock agent
    await fs.writeFile(
      path.join(this.mockClaudeDir, 'agents', 'gsd-planner.md'),
      '# GSD Planner\nPlanning agent.'
    )
  }

  async run(workDir) {
    const metrics = {
      files_found: 0,
      structure_valid: 0,
      signals_captured: 0,
      kb_entries: 0
    }

    // Check for expected directories
    const expectedDirs = [
      path.join(this.mockClaudeDir, 'commands', 'gsd'),
      path.join(this.mockClaudeDir, 'get-shit-done'),
      path.join(this.mockClaudeDir, 'agents')
    ]

    let allDirsExist = true
    for (const dir of expectedDirs) {
      const exists = await fs.access(dir).then(() => true).catch(() => false)
      if (!exists) allDirsExist = false
    }
    metrics.structure_valid = allDirsExist ? 1 : 0

    // Count files
    const countFiles = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        let count = 0
        for (const entry of entries) {
          if (entry.isFile()) count++
          if (entry.isDirectory()) {
            count += await countFiles(path.join(dir, entry.name))
          }
        }
        return count
      } catch {
        return 0
      }
    }

    metrics.files_found = await countFiles(this.mockClaudeDir)

    return metrics
  }
}
