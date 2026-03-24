---
probe_id: automation-watchdog
category: Automation System Health
tier: default
dimension: infrastructure
execution: subcommand
depends_on: [config-validity]
---

# Automation Watchdog Probe

Verifies automation features are firing at expected cadence by checking `last_triggered` timestamps against configured frequency (HEALTH-07).

## Purpose

Detects automation features that have gone silent -- either because they are misconfigured, because their triggers are not being invoked, or because the project has been dormant beyond expected cadence.

## Execution

This probe runs via gsd-tools.cjs subcommand:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs health-probe automation-watchdog --raw
```

## Computation

1. Read `.planning/config.json` for `automation.stats` (per-feature timestamps and fire counts)
2. Read `feature-manifest.json` for features with `frequency` schema fields
3. For each feature with a configured frequency:
   - Derive expected cadence: `every-phase` = 6h, `on-resume` = 24h, `milestone-only` = 7d
   - Skip `explicit-only` features (no cadence expectation)
   - Check if `last_triggered` is missing or stale beyond 3x expected cadence
4. Report per-feature status

## Check Output

| Check ID Pattern | Description | Pass Condition |
|-----------------|-------------|----------------|
| WATCHDOG-{FEATURE} | Automation cadence for {feature} | last_triggered within 3x expected cadence |
| WATCHDOG-NONE | No features with cadence expectations | Always PASS (informational) |

## Edge Cases

- No `automation.stats` in config: all features with frequency report WARNING (never triggered)
- Feature has no `frequency` in schema: skipped (no cadence expectation)
- `explicit-only` frequency: skipped (user-triggered only)
