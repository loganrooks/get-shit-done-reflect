---
probe_id: signal-density
category: Signal Density Trend
tier: default
dimension: workflow
execution: subcommand
depends_on: [kb-integrity]
---

# Signal Density Trend Probe

Tracks signal accumulation rate per phase within the current observation regime (HEALTH-09).

## Purpose

Detects whether signal density is increasing across phases, which may indicate growing technical debt, process friction, or insufficient resolution of recurring issues.

## Execution

This probe runs via gsd-tools.cjs subcommand:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs health-probe signal-density --raw
```

## Computation

1. Resolve KB directory and regime boundary (same as signal-metrics)
2. Collect all signals within current regime
3. Group signals by phase (from frontmatter `phase:` field)
4. Sort phases numerically and compute per-phase counts
5. Determine trend from last 3 phases:
   - **Increasing:** last 3 phase counts are strictly ascending
   - **Decreasing:** last 3 phase counts are strictly descending
   - **Stable:** all other patterns, or fewer than 3 phases

## Check Output

| Check ID | Description | Pass Condition |
|----------|-------------|----------------|
| SIG-DENSITY-01 | Signal density trend within current regime | trend is "stable" or "decreasing" |

## Edge Cases

- Fewer than 3 phases with signals: trend is always "stable"
- No regime_change entries: all signal history is treated as one regime
- Unparseable signal files: skipped silently
