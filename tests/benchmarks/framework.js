/**
 * GSD Reflect Benchmark Framework
 *
 * Tiered benchmarks with different token costs:
 * - quick: Smoke tests, basic functionality (<1 min, minimal tokens)
 * - standard: Normal validation (5-10 min, moderate tokens)
 * - comprehensive: Full evaluation (30+ min, significant tokens)
 *
 * Metrics tracked:
 * - signals_captured: Number of signals detected and persisted
 * - kb_entries: Knowledge base entries created/modified
 * - deviation_handling: How well deviations are detected and reported
 * - execution_time: Wall clock time for the benchmark
 */

import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Benchmark tiers with expected characteristics
 */
export const TIERS = {
  quick: {
    name: 'Quick',
    description: 'Smoke test, basic functionality',
    maxDuration: 60000,  // 1 minute
    tokenBudget: 'minimal'
  },
  standard: {
    name: 'Standard',
    description: 'Normal validation',
    maxDuration: 600000,  // 10 minutes
    tokenBudget: 'moderate'
  },
  comprehensive: {
    name: 'Comprehensive',
    description: 'Full evaluation',
    maxDuration: 1800000,  // 30 minutes
    tokenBudget: 'significant'
  }
}

/**
 * Benchmark result structure
 */
export class BenchmarkResult {
  constructor(benchmark, metrics) {
    this.name = benchmark.name
    this.tier = benchmark.tier
    this.timestamp = new Date().toISOString()
    this.metrics = metrics
    this.passed = this.evaluatePass(benchmark)
  }

  evaluatePass(benchmark) {
    // Check if all required metrics meet thresholds
    for (const [key, threshold] of Object.entries(benchmark.thresholds || {})) {
      if (this.metrics[key] < threshold) {
        return false
      }
    }
    return true
  }

  toJSON() {
    return {
      name: this.name,
      tier: this.tier,
      timestamp: this.timestamp,
      metrics: this.metrics,
      passed: this.passed
    }
  }
}

/**
 * Base class for all benchmarks
 */
export class Benchmark {
  constructor(options) {
    this.name = options.name
    this.description = options.description
    this.tier = options.tier || 'standard'
    this.thresholds = options.thresholds || {}
  }

  /**
   * Setup method - override to prepare test environment
   * @param {string} workDir - Working directory for this benchmark
   */
  async setup(workDir) {
    // Default: no-op
  }

  /**
   * Run the benchmark
   * @param {string} workDir - Working directory for this benchmark
   * @returns {Promise<object>} Metrics object
   */
  async run(workDir) {
    throw new Error('Benchmark.run() must be implemented by subclass')
  }

  /**
   * Teardown method - override to clean up
   * @param {string} workDir - Working directory for this benchmark
   */
  async teardown(workDir) {
    // Default: no-op
  }

  /**
   * Execute the full benchmark lifecycle
   * @param {string} workDir - Working directory for this benchmark
   * @returns {Promise<BenchmarkResult>}
   */
  async execute(workDir) {
    const startTime = Date.now()

    try {
      await this.setup(workDir)
      const metrics = await this.run(workDir)
      metrics.execution_time = Date.now() - startTime
      return new BenchmarkResult(this, metrics)
    } finally {
      await this.teardown(workDir)
    }
  }
}

/**
 * Benchmark suite - collection of benchmarks
 */
export class BenchmarkSuite {
  constructor(name) {
    this.name = name
    this.benchmarks = []
  }

  add(benchmark) {
    this.benchmarks.push(benchmark)
    return this
  }

  /**
   * Get benchmarks filtered by tier
   * @param {string|string[]} tiers - Tier(s) to include
   */
  getByTier(tiers) {
    const tierList = Array.isArray(tiers) ? tiers : [tiers]
    return this.benchmarks.filter(b => tierList.includes(b.tier))
  }

  /**
   * Run all benchmarks in the suite
   * @param {string} baseDir - Base directory for benchmark work directories
   * @param {object} options - Run options
   * @returns {Promise<object[]>} Array of BenchmarkResult objects
   */
  async runAll(baseDir, options = {}) {
    const { tiers = ['quick', 'standard', 'comprehensive'] } = options
    const benchmarks = this.getByTier(tiers)
    const results = []

    for (const benchmark of benchmarks) {
      const workDir = path.join(baseDir, `benchmark-${benchmark.name}-${Date.now()}`)
      await fs.mkdir(workDir, { recursive: true })

      console.log(`Running benchmark: ${benchmark.name} (${benchmark.tier})`)
      const result = await benchmark.execute(workDir)
      results.push(result)

      // Clean up work directory unless debugging
      if (!options.keepWorkDir) {
        await fs.rm(workDir, { recursive: true })
      }
    }

    return results
  }
}

/**
 * Store benchmark results to file
 * @param {BenchmarkResult[]} results - Results to store
 * @param {string} outputPath - Path to results file
 */
export async function storeResults(results, outputPath) {
  const existing = await loadResults(outputPath)

  const run = {
    timestamp: new Date().toISOString(),
    results: results.map(r => r.toJSON())
  }

  existing.runs.push(run)

  // Keep only last 50 runs
  if (existing.runs.length > 50) {
    existing.runs = existing.runs.slice(-50)
  }

  await fs.writeFile(outputPath, JSON.stringify(existing, null, 2))
}

/**
 * Load existing benchmark results
 * @param {string} outputPath - Path to results file
 * @returns {Promise<object>} Results history
 */
export async function loadResults(outputPath) {
  try {
    const content = await fs.readFile(outputPath, 'utf8')
    return JSON.parse(content)
  } catch {
    return { runs: [] }
  }
}

/**
 * Compare two benchmark runs
 * @param {object} baseline - Baseline run
 * @param {object} current - Current run
 * @returns {object} Comparison summary
 */
export function compareRuns(baseline, current) {
  const comparison = {
    improved: [],
    regressed: [],
    unchanged: []
  }

  const baselineByName = Object.fromEntries(
    baseline.results.map(r => [r.name, r])
  )

  for (const result of current.results) {
    const base = baselineByName[result.name]
    if (!base) {
      comparison.unchanged.push({ name: result.name, note: 'no baseline' })
      continue
    }

    // Compare key metrics
    const metricsToCompare = ['signals_captured', 'kb_entries', 'execution_time']
    let improved = false
    let regressed = false

    for (const metric of metricsToCompare) {
      if (result.metrics[metric] > base.metrics[metric]) {
        improved = true
      } else if (result.metrics[metric] < base.metrics[metric]) {
        regressed = true
      }
    }

    if (improved && !regressed) {
      comparison.improved.push(result.name)
    } else if (regressed && !improved) {
      comparison.regressed.push(result.name)
    } else {
      comparison.unchanged.push({ name: result.name })
    }
  }

  return comparison
}
