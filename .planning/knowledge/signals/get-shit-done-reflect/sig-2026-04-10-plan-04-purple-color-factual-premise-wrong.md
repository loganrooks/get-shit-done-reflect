---
id: sig-2026-04-10-plan-04-purple-color-factual-premise-wrong
type: signal
project: get-shit-done-reflect
tags: [plan-accuracy, plan-checker, codebase-state, color-collision, second-order-check]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: "57.4"
plan: "4"
polarity: negative
source: local
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z"
evidence:
  supporting:
    - "57.4-04-PLAN.md line 131: 'Purple is unused by fork-standard agents (gsdr-context-checker is yellow, gsd-debugger is red per spot-check).'"
    - "57.4-04-SUMMARY.md line 103-105: 'Reality — Pre-existing use of color: purple at agents/gsd-log-sensor.md:5, agents/gsd-research-synthesizer.md:5, agents/gsd-roadmapper.md:5. Purple is already triple-used.'"
    - "The plan's second-order check correctly required verification (pick an unused one if purple is taken) — the plan's own check caught the error"
  counter:
    - "The plan's second-order check explicitly anticipated the possibility of collision and provided the correct fallback instruction"
    - "No functional impact — color is cosmetic in Claude Code agent display"
    - "The plan-checker's job is not to verify every factual state claim"
confidence: high
confidence_basis: "Plan 04 SUMMARY documents the discrepancy explicitly with file and line evidence."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 57.4-04 stated as a factual premise: "Purple is unused by fork-standard agents (gsdr-context-checker is yellow, gsd-debugger is red per spot-check)." This premise was false: three existing fork agents already used `color: purple` (`gsd-log-sensor.md`, `gsd-research-synthesizer.md`, `gsd-roadmapper.md`). The plan-checker passed this incorrect codebase-state claim through to execution.

The executor caught the error during implementation because Plan 04 had explicitly designed a second-order check ("pick an unused one if purple is taken") that functioned as a self-correcting fallback. The SUMMARY documented the discrepancy at L103-105.

## Context

- Phase 57.4 Plan 04 — color convention assignment for a new agent
- Plan author's premise was derived from a spot-check of two agents (`gsdr-context-checker`, `gsd-debugger`) and generalized incorrectly to "purple is unused"
- Plan-checker passed the plan despite the factual error
- The second-order check in the plan itself caught the error at execution time, no functional impact occurred

## Potential Cause

Two related gaps:

1. **Plan authoring relied on spot-check rather than exhaustive grep.** The author examined two agent files, observed they used yellow and red, and generalized to "purple is unused" without running a grep for `color: purple` across the agents/ directory. This is a lightweight inference that happened to be wrong.

2. **Plan-checker does not verify codebase-state premises.** The plan-checker's current design focuses on plan structure, dependency coherence, and second-order gaps — not on verifying every factual claim about the codebase. Adding such verification would require either LLM-driven state-reading (expensive) or a structured "codebase facts" section in plans that plan-checker could mechanically verify.

The self-correcting second-order check in the plan itself is the right pattern here — plans that anticipate their own possible errors and provide fallbacks are more robust than plans that assume every factual premise is correct. This signal is notable not as a defect but as a data point: executor-level second-order checks are catching errors that plan-checker-level validation does not. This has implications for where to invest in verification infrastructure (executor-level robustness vs plan-checker-level premise checking).
