---
probe_id: signal-metrics
category: Signal Resolution Metrics
tier: default
dimension: workflow
execution: subcommand
depends_on: [kb-integrity]
---

# Signal Resolution Metrics Probe

Measures the signal-to-resolution ratio within the current observation regime (HEALTH-08).

## Purpose

Tracks whether detected signals are being resolved at a sustainable rate. A high ratio of unresolved-to-resolved signals indicates workflow friction or neglected maintenance.

## Execution

This probe runs via gsd-tools.cjs subcommand:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs health-probe signal-metrics --raw
```

## Computation

1. Resolve KB directory (project-local primary, user-global fallback)
2. Find latest `type: regime_change` entry to determine regime boundary
3. Count signals within current regime, categorized by lifecycle state:
   - **Detected:** `lifecycle_state: detected` or `triaged`
   - **Resolved:** `lifecycle_state: remediated`, `verified`, or `closed`
4. Compute ratio: detected / resolved
5. Compare against `health_check.resolution_ratio_threshold` (default: 5.0)

## Check Output

| Check ID | Description | Pass Condition |
|----------|-------------|----------------|
| SIG-RATIO-01 | Signal-to-resolution ratio within current regime | ratio <= threshold |

## Edge Cases

- No regime_change entries: all signal history is treated as one regime
- No signals at all: ratio is 0, status PASS
- No resolved signals but some detected: ratio is Infinity, status WARNING
- Unparseable signal files: skipped silently
