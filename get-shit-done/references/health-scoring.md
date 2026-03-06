# Health Scoring Reference

Defines the two-dimensional scoring model for workspace health assessment. Scores are computed from probe results and cached for reactive threshold evaluation.

## 1. Overview

The health score system operates on two independent dimensions:

1. **Infrastructure Health** -- Binary state derived from infrastructure probe results
2. **Workflow Health** -- Continuous score derived from workflow signal accumulation

These two dimensions combine into a **composite traffic light** (GREEN/YELLOW/RED) that provides an at-a-glance workspace health assessment.

**Design principles (LOCKED):**

- Scores are **attention guides**, not decision gates. They indicate where a user's attention may be needed, but never block execution autonomously.
- **Standing caveat:** "Health checks measure known categories. Absence of findings does not mean absence of problems." This caveat must accompany any health report that shows a clean score.

## 2. Infrastructure Score

Binary dimension computed from all probes with `dimension: infrastructure`.

**Scoring rules:**

| State | Condition | Meaning |
|-------|-----------|---------|
| HEALTHY | Zero FAILs, zero WARNINGs across all infrastructure probes | All checked infrastructure is sound |
| DEGRADED | At least one WARNING, zero FAILs | Non-critical issues detected |
| UNHEALTHY | Any FAIL in any infrastructure probe | Critical infrastructure issue detected |

**Computation:**

1. Run all applicable infrastructure probes (respecting tier and depends_on)
2. Collect all check results (PASS, WARNING, FAIL)
3. Apply worst-case aggregation:
   - Any FAIL anywhere -> UNHEALTHY
   - Any WARNING (no FAILs) -> DEGRADED
   - All PASS -> HEALTHY

Each probe contributes independently to the infrastructure dimension. A single FAIL in any probe makes the entire infrastructure score UNHEALTHY.

## 3. Workflow Score

Continuous dimension computed from probes with `dimension: workflow`.

**Signal weighting (LOCKED):** critical=1.0, notable=0.3, minor=0.1

| Signal Severity | Weight |
|----------------|--------|
| critical | 1.0 |
| notable | 0.3 |
| minor | 0.1 |

**Computation:**

1. Collect all active (non-archived) signals from the knowledge base
2. **Deduplicate by pattern:** Signals with identical tags are counted once before weighting. This prevents a single recurring issue from inflating the score.
3. Apply severity weights to deduplicated signals
4. Sum weighted values to get `weighted_sum`

**Level thresholds (configurable via `health_check.workflow_thresholds`):**

| Level | Condition (defaults) | Meaning |
|-------|---------------------|---------|
| LOW | weighted_sum < 2.0 | Minimal signal noise |
| MED | 2.0 <= weighted_sum < 5.0 | Moderate signal accumulation |
| HIGH | weighted_sum >= 5.0 | Significant signal density |

Threshold values are configurable:
- `workflow_thresholds.low` -- Upper bound for LOW (default: 2.0)
- `workflow_thresholds.high` -- Lower bound for HIGH (default: 5.0)
- MED is implicitly the range between low and high

## 4. Composite Traffic Light

Maps the two dimensions into a single GREEN/YELLOW/RED indicator.

**3x3 composite matrix:**

```
              | Workflow LOW | Workflow MED | Workflow HIGH |
  HEALTHY     | GREEN        | YELLOW       | RED           |
  DEGRADED    | YELLOW       | YELLOW       | RED           |
  UNHEALTHY   | RED          | RED          | RED           |
```

**Reading the matrix:**

- **GREEN** -- Infrastructure healthy AND workflow signals low. No attention needed.
- **YELLOW** -- Either infrastructure has warnings OR workflow signals are moderate. Worth reviewing.
- **RED** -- Infrastructure has failures OR workflow signals are high OR both. Attention recommended.

## 5. Cache Format

Health scores are cached to enable reactive threshold evaluation without re-running all probes.

**Location:** `~/.claude/cache/gsd-health-score.json`

**Schema:**

```json
{
  "infrastructure": "HEALTHY|DEGRADED|UNHEALTHY",
  "workflow": "LOW|MED|HIGH",
  "composite": "GREEN|YELLOW|RED",
  "weighted_sum": 0.0,
  "signal_count": {
    "critical": 0,
    "notable": 0,
    "minor": 0
  },
  "resolution_ratio": 0.0,
  "density_trend": "increasing|stable|decreasing",
  "checked": 1709827200,
  "phase": 41,
  "regime_id": null
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `infrastructure` | string | Current infrastructure health state |
| `workflow` | string | Current workflow health level |
| `composite` | string | Composite traffic light color |
| `weighted_sum` | number | Raw weighted sum from workflow computation |
| `signal_count` | object | Count of signals by severity after deduplication |
| `resolution_ratio` | number | Ratio of total signals to resolved signals |
| `density_trend` | string | Whether signal density is increasing, stable, or decreasing compared to previous check |
| `checked` | number | Unix timestamp of when the check was performed |
| `phase` | number | Phase number at time of check |
| `regime_id` | string/null | Active regime identifier if applicable |

**Cache staleness:** Configurable via `health_check.cache_staleness_hours` (default: 24 hours). A cached score older than this threshold is considered stale and will be refreshed on next access.

## 6. Reactive Threshold

When the cached composite score meets or exceeds the configured `reactive_threshold`, a session-start event triggers a fresh health check automatically.

**Configuration:** `health_check.reactive_threshold`

| Value | Behavior |
|-------|----------|
| `RED` (default) | Only trigger reactive check when composite is RED |
| `YELLOW` | Trigger on YELLOW or RED |
| `GREEN` | Always trigger (effectively runs health check every session) |
| `disabled` | Never trigger reactive checks |

**Comparison order:** RED > YELLOW > GREEN. A composite score "meets or exceeds" the threshold when it is equal to or more severe than the configured level.

**Reactive check flow:**

1. On session start, read cached health score
2. If cache is stale (older than `cache_staleness_hours`), score is treated as unknown -- no reactive trigger
3. If composite >= reactive_threshold, trigger a fresh health check
4. Update cache with new results
5. If new composite is still >= threshold, surface findings in session status

---

*Reference version: 1.0.0*
*Created: 2026-03-06*
*Phase: 41-health-score-automation*
