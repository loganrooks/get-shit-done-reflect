/**
 * Benchmark tasks index
 * Add new benchmark tasks here to include them in the suite
 */

import QuickSmokeBenchmark from './quick-smoke.js'
import StandardSignalBenchmark from './standard-signal.js'

export const benchmarkTasks = [
  new QuickSmokeBenchmark(),
  new StandardSignalBenchmark()
]

export { QuickSmokeBenchmark, StandardSignalBenchmark }
