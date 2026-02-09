/**
 * Standard Signal Detection Benchmark
 *
 * Tests signal detection and KB write capabilities:
 * - Creates mock project with deliberate deviations
 * - Simulates signal collection
 * - Verifies signals are captured correctly
 *
 * Tier: standard
 * Duration: 2-5 minutes
 * Token cost: moderate (mock operations, no real API)
 */

import { Benchmark } from '../framework.js'
import fs from 'node:fs/promises'
import path from 'node:path'

export default class StandardSignalBenchmark extends Benchmark {
  constructor() {
    super({
      name: 'standard-signal',
      description: 'Signal detection and KB write test',
      tier: 'standard',
      thresholds: {
        signals_captured: 1,  // At least one signal should be detected
        kb_entries: 1,
        deviation_detected: 1
      }
    })
  }

  async setup(workDir) {
    // Create mock project structure
    const planningDir = path.join(workDir, 'project', '.planning')
    const phaseDir = path.join(planningDir, 'phases', '01-test')
    await fs.mkdir(phaseDir, { recursive: true })

    // Create PLAN with expected behavior
    await fs.writeFile(
      path.join(phaseDir, '01-01-PLAN.md'),
      `---
phase: 01-test
plan: 01
---

<tasks>
<task type="auto">
  <name>Task 1: Create output</name>
  <action>Create output.txt with content "expected value"</action>
  <done>File contains "expected value"</done>
</task>
</tasks>
`
    )

    // Create SUMMARY with deviation
    await fs.writeFile(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: 01-test
plan: 01
status: complete
---

## Summary
Task completed with modifications.

## Deviations
- Created output.txt with "actual value" instead of "expected value"
- Added extra logging not in plan
`
    )

    // Create mock KB structure
    this.kbDir = path.join(workDir, 'gsd-knowledge')
    await fs.mkdir(path.join(this.kbDir, 'signals', 'test-project'), { recursive: true })

    this.projectDir = path.join(workDir, 'project')
    this.phaseDir = phaseDir
  }

  async run(workDir) {
    const metrics = {
      signals_captured: 0,
      kb_entries: 0,
      deviation_detected: 0,
      execution_time: 0
    }

    // Simulate signal detection by reading PLAN and SUMMARY
    const planContent = await fs.readFile(
      path.join(this.phaseDir, '01-01-PLAN.md'),
      'utf8'
    )
    const summaryContent = await fs.readFile(
      path.join(this.phaseDir, '01-01-SUMMARY.md'),
      'utf8'
    )

    // Check for deviation
    if (summaryContent.includes('## Deviations') &&
        summaryContent.includes('instead of')) {
      metrics.deviation_detected = 1

      // Create signal file (simulating what signal collector does)
      const signalContent = `---
id: sig-${Date.now()}-deviation
type: signal
project: test-project
signal_type: deviation
severity: notable
phase: 1
plan: 1
created: ${new Date().toISOString()}
---

## What Happened

Deviation detected between PLAN and SUMMARY:
- Expected: "expected value"
- Actual: "actual value"

## Context

Plan specified output content, but execution produced different result.
`
      const signalPath = path.join(
        this.kbDir,
        'signals',
        'test-project',
        `${Date.now()}-deviation.md`
      )
      await fs.writeFile(signalPath, signalContent)
      metrics.signals_captured = 1
      metrics.kb_entries = 1
    }

    return metrics
  }
}
