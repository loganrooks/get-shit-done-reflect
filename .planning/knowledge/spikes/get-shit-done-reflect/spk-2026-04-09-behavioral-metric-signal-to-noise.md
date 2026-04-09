---
id: spk-2026-04-09-behavioral-metric-signal-to-noise
type: spike
project: get-shit-done-reflect
tags: [telemetry, behavioral-metrics, session-meta, signal-analysis]
created: "2026-04-09T00:00:00Z"
updated: "2026-04-09T00:00:00Z"
durability: convention
status: active
hypothesis: "At least 2 of the 3 candidate metrics (first_prompt patterns, message_hours entropy, response_time variance) show distinguishable patterns across session types or outcomes."
outcome: confirmed
rounds: 1
phase: 57
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
---

## Hypothesis

At least 2 of the 3 candidate metrics (first_prompt patterns, message_hours entropy, response_time variance) show distinguishable patterns across session types or outcomes sufficient for inclusion in the telemetry baseline.

## Experiment

Research-mode empirical analysis of 265 parseable session-meta files from `~/.claude/usage-data/session-meta/`. Three metrics analyzed: (1) first_prompt text categorization cross-referenced with tool_errors, user_interruptions, and duration_minutes; (2) message_hours[] entropy as a session fragmentation measure correlated with outcomes; (3) user_response_times[] CV, rapid-fire detection, and walk-away detection cross-referenced with interruptions.

## Results

Two metrics confirmed as strong signals:

1. **first_prompt category**: GSD-commanded sessions average 1.14 tool errors vs 2.26 for ad-hoc sessions (53% difference). 64.4% of gsd_execute sessions have zero errors vs 41.9% of ad-hoc. GSD sessions have 47% fewer interruptions. The `question` category is a distinct high-friction signal (avg 3.64 errors, 11 sessions).

2. **message_hours entropy**: Pearson r=0.48 vs tool_errors, r=0.45 vs user_interruptions (both N=264). Fragmented sessions (6+ unique hours) average 3.79 tool errors vs 0.68 for focused sessions — 5.6x ratio. Coverage: 99.6%.

Third metric inconclusive:

3. **response_time CV**: r=0.33 vs interruptions (N=91). Only 45.7% coverage. High-CV (>2) cases are nearly absent (1/91 sessions). Rapid-fire flag shows signal but N=9 is too small. Walk-away events (>300s) present in 63% of sessions — common, not pathological.

## Decision

Include `session_type` (derived from first_prompt: gsd_execute | gsd_plan | gsd_discuss | gsd_other | ad_hoc | no_prompt) and `focus_level` (derived from message_hours entropy: focused | extended | fragmented) as computed fields in the Phase 57 telemetry baseline. Defer response_time CV until coverage gaps are fixed.

## Consequences

- Phase 57 schema needs two new computed fields: `session_type` and `focus_level`
- These fields should be used as conditioning/stratification variables for all other baseline metrics
- The `gsd_other` category (resume-work, quick, deliberate) has normal median outcomes but extreme duration outliers; needs separate monitoring
- Response-time collection gap (54% missing) is a collector data quality issue; does not block baseline work
- Duration mean is unreliable due to a confirmed 19,996-minute artifact; always use median for duration metrics
- The `question` first_prompt pattern may warrant a dedicated high-friction signal
