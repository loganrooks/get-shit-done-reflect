---
id: sig-2026-03-27-wholesale-workflow-adoption-did-not-include-a-depe
type: signal
project: get-shit-done-reflect
tags:
  - dependency-scan
  - upstream-adoption
  - at-reference
  - planning-gap
  - workflow-adoption
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: notable
signal_type: epistemic-gap
signal_category: negative
phase: 52
plan: 3
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.17.5+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-03-29T08:00:00Z"
evidence:
  supporting:
    - Plan 03 wholesale-replaced discuss-phase.md without verifying all @-references in the new file resolve to existing fork source files
    - The advisor-researcher gap was detected only at test-suite time (Plan 05), not at adoption time (Plan 03)
    - 52-RESEARCH.md contained detailed analysis of file line counts and delta structure but no @-reference dependency graph
  counter:
    - The test suite (wiring-validation.test.js) successfully caught this gap before it reached production
    - The adoption pattern documentation (copy-and-namespace-rewrite) does not currently specify a dependency-scan step
confidence: medium
confidence_basis: The gap is inferred from the pattern of missing dependency detection; a single observed instance is sufficient to flag the gap but not to confirm it is systematic
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Wholesale workflow adoption did not include a dependency scan for @-references in adopted files, creating a repeatable gap pattern for upstream adoption plans

Evidence:
- Plan 03 wholesale-replaced discuss-phase.md without verifying all @-references in the new file resolve to existing fork source files
- The advisor-researcher gap was detected only at test-suite time (Plan 05), not at adoption time (Plan 03)
- 52-RESEARCH.md contained detailed analysis of file line counts and delta structure but no @-reference dependency graph

## Context

Phase 52, Plan 3 (artifact sensor).
Source artifact: .planning/phases/52-feature-adoption/52-03-PLAN.md

## Potential Cause

Blind spot in current observability — the system lacks sensors or tooling to directly verify this domain.
