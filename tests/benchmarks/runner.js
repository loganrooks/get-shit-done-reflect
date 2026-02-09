#!/usr/bin/env node
/**
 * GSD Reflect Benchmark Runner
 *
 * Usage:
 *   node tests/benchmarks/runner.js [options]
 *
 * Options:
 *   --tier <tier>     Run only specified tier (quick, standard, comprehensive)
 *   --output <path>   Path to store results (default: tests/benchmarks/results.json)
 *   --compare         Compare with previous run
 *   --keep-work-dir   Don't clean up work directories (for debugging)
 *
 * Examples:
 *   node tests/benchmarks/runner.js --tier quick
 *   node tests/benchmarks/runner.js --compare
 */

import { BenchmarkSuite, storeResults, loadResults, compareRuns } from './framework.js'
import { benchmarkTasks } from './tasks/index.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  tier: null,
  output: 'tests/benchmarks/results.json',
  compare: false,
  keepWorkDir: false
}

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--tier':
      options.tier = args[++i]
      break
    case '--output':
      options.output = args[++i]
      break
    case '--compare':
      options.compare = true
      break
    case '--keep-work-dir':
      options.keepWorkDir = true
      break
    case '--help':
      console.log(`
GSD Reflect Benchmark Runner

Usage:
  node tests/benchmarks/runner.js [options]

Options:
  --tier <tier>     Run only specified tier (quick, standard, comprehensive)
  --output <path>   Path to store results (default: tests/benchmarks/results.json)
  --compare         Compare with previous run
  --keep-work-dir   Don't clean up work directories (for debugging)
  --help            Show this help message

Examples:
  node tests/benchmarks/runner.js --tier quick
  node tests/benchmarks/runner.js --tier standard --compare
  node tests/benchmarks/runner.js  # runs all tiers
`)
      process.exit(0)
  }
}

async function main() {
  console.log('GSD Reflect Benchmark Runner')
  console.log('============================')
  console.log('')

  // Create benchmark suite
  const suite = new BenchmarkSuite('GSD Reflect')
  for (const task of benchmarkTasks) {
    suite.add(task)
  }

  // Determine which tiers to run
  const tiers = options.tier
    ? [options.tier]
    : ['quick', 'standard', 'comprehensive']

  console.log(`Running tiers: ${tiers.join(', ')}`)
  console.log(`Benchmarks: ${suite.getByTier(tiers).length}`)
  console.log('')

  // Create temp directory for benchmark work
  const baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gsd-benchmark-'))

  try {
    // Run benchmarks
    const results = await suite.runAll(baseDir, {
      tiers,
      keepWorkDir: options.keepWorkDir
    })

    // Display results
    console.log('')
    console.log('Results')
    console.log('-------')
    for (const result of results) {
      const status = result.passed ? 'PASS' : 'FAIL'
      console.log(`[${status}] ${result.name} (${result.tier})`)
      console.log(`       Metrics: ${JSON.stringify(result.metrics)}`)
    }

    // Store results
    await storeResults(results, options.output)
    console.log('')
    console.log(`Results stored: ${options.output}`)

    // Compare with previous if requested
    if (options.compare) {
      const history = await loadResults(options.output)
      if (history.runs.length >= 2) {
        const previous = history.runs[history.runs.length - 2]
        const current = history.runs[history.runs.length - 1]
        const comparison = compareRuns(previous, current)

        console.log('')
        console.log('Comparison with previous run:')
        console.log(`  Improved: ${comparison.improved.length}`)
        console.log(`  Regressed: ${comparison.regressed.length}`)
        console.log(`  Unchanged: ${comparison.unchanged.length}`)

        if (comparison.regressed.length > 0) {
          console.log('')
          console.log('Regressions:')
          for (const name of comparison.regressed) {
            console.log(`  - ${name}`)
          }
        }
      } else {
        console.log('')
        console.log('Not enough runs for comparison (need at least 2)')
      }
    }

    // Exit with appropriate code
    const failed = results.filter(r => !r.passed)
    if (failed.length > 0) {
      console.log('')
      console.log(`${failed.length} benchmark(s) failed`)
      process.exit(1)
    }

  } finally {
    // Clean up base directory
    if (!options.keepWorkDir) {
      await fs.rm(baseDir, { recursive: true })
    }
  }

  console.log('')
  console.log('Done!')
}

main().catch(err => {
  console.error('Benchmark runner error:', err)
  process.exit(1)
})
