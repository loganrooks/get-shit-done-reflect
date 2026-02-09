# GSD Reflect Benchmarks

Benchmark suite for evaluating GSD Reflect versions. Measures process quality (signals captured, KB usage, deviation handling) not just functional correctness.

## Tiers

Benchmarks are organized into tiers with different token costs:

| Tier | Duration | Token Cost | Purpose |
|------|----------|------------|---------|
| quick | <1 min | minimal | Smoke tests, basic sanity |
| standard | 5-10 min | moderate | Normal validation |
| comprehensive | 30+ min | significant | Full evaluation |

## Running Benchmarks

### Quick (recommended for CI)

```bash
node tests/benchmarks/runner.js --tier quick
```

### Standard (recommended for releases)

```bash
node tests/benchmarks/runner.js --tier standard
```

### All Tiers

```bash
node tests/benchmarks/runner.js
```

### With Comparison

```bash
node tests/benchmarks/runner.js --compare
```

## Metrics

Each benchmark reports metrics that assess process quality:

- **signals_captured**: Number of signals detected and persisted
- **kb_entries**: Knowledge base entries created/modified
- **deviation_detected**: Whether plan vs actual deviations were caught
- **execution_time**: Wall clock time in milliseconds

## Adding New Benchmarks

1. Create a new file in `tests/benchmarks/tasks/`
2. Extend the `Benchmark` base class
3. Implement `setup()`, `run()`, and optionally `teardown()`
4. Add the benchmark to `tasks/index.js`

Example:

```javascript
import { Benchmark } from '../framework.js'

export default class MyBenchmark extends Benchmark {
  constructor() {
    super({
      name: 'my-benchmark',
      description: 'Description of what this tests',
      tier: 'standard',  // quick | standard | comprehensive
      thresholds: {
        some_metric: 10  // Minimum value to pass
      }
    })
  }

  async run(workDir) {
    // Perform benchmark operations
    return {
      some_metric: 15,
      // ... other metrics
    }
  }
}
```

## Results

Results are stored in `tests/benchmarks/results.json` (gitignored by default).

The runner keeps the last 50 runs and supports comparison between runs to detect regressions.

## Interpretation

Per CONTEXT.md: benchmark evaluation requires human judgment. A regression in one area may be acceptable if there's progress in a more important area.

Key principles:
- Context-dependent evaluation
- Process quality matters as much as output correctness
- Track trends over time
- Human in the loop for interpreting results
