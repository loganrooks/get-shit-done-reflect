---
id: spk-2026-04-09-facets-accuracy-validation
type: spike
project: get-shit-done-reflect
tags: [telemetry, facets, data-quality, correlation]
created: "2026-04-09T00:00:00Z"
updated: "2026-04-09T00:00:00Z"
durability: convention
status: active
hypothesis: "Facets outcome and friction_counts correlate meaningfully with session-meta tool_errors and user_interruptions, suggesting facets data has signal value beyond noise."
outcome: partial
rounds: 1
phase: 57
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
---

## Hypothesis

Facets `outcome` and `friction_counts` correlate meaningfully with session-meta `tool_errors` and `user_interruptions`, suggesting facets data has signal value beyond noise.

## Experiment

Research-mode analysis of 106 matched sessions from `~/.claude/usage-data/facets/` (109 files; 3 dropped due to malformed JSON) cross-referenced with `~/.claude/usage-data/session-meta/`. Four cross-correlations analyzed: outcome vs tool_errors, friction_counts vs user_interruptions, session_type vs duration_minutes, claude_helpfulness vs tool error rate.

## Results

Two of four correlations showed meaningful patterns (success criterion met):

1. **friction_counts vs user_interruptions** — Spearman rho=0.55. Zero-friction sessions had 87.5% zero-interruption rate vs 63.8% for non-zero-friction. Clear monotonic progression: friction=0 mean 0.13 interruptions → friction=4+ mean 3.0 interruptions.

2. **session_type vs duration_minutes** — 10x span in median duration across types (single_task 6 min median vs multi_task 76 min), consistent with type labels. Valid stratification variable.

3. **outcome vs tool_errors** — No gradient. Fully_achieved and partially_achieved have nearly identical mean errors (1.15 vs 1.21). Outcome reflects holistic goal achievement, not error count.

4. **claude_helpfulness vs error_rate** — Counterintuitive inverse: unhelpful sessions have 0 errors because they are abandoned/unclear sessions with no substantive tool use. Confounded by session complexity. Partial signal from error_rate (essential 0.02 vs very_helpful 0.04) but small difference.

Notable: 7 "unclear_from_transcript" sessions cluster with "unhelpful" ratings — likely truncated or anomalous sessions. 9 sessions with duration >1000 min are likely multi-day resumed contexts; wall-clock duration is not interactive time.

## Decision

Include facets data in Phase 57 baseline with field-specific weighting:
- **friction_counts**: HIGH confidence, use with full weight (empirically validated against interruptions)
- **session_type**: HIGH confidence, use as stratification dimension (behaviorally distinguishable)
- **outcome / claude_helpfulness**: MEDIUM confidence, use as holistic qualitative indicators only — do not use as proxies for technical metrics

Error rate (errors/total_calls) is more useful than absolute error count for quality inference.

## Consequences

- Friction is the most reliable facets signal for baseline construction; weight it accordingly.
- Session_type must be used as a normalization dimension — aggregate stats mixing types will obscure signal (single_task vs multi_task represent fundamentally different work patterns).
- The 3 malformed session-meta files represent unrecovered data loss; worth investigating and repairing.
- Absolute tool_errors conflate session length with quality; always normalize by total tool calls when using as a quality metric.
- The "unclear_from_transcript" + "unhelpful" cluster (7 sessions) may indicate a systematic issue with very short or truncated session contexts; consider filtering or separate tracking.
