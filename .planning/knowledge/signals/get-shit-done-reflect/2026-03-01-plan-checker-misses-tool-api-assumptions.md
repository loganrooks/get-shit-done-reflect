---
id: sig-2026-03-01-plan-checker-misses-tool-api-assumptions
type: signal
project: get-shit-done-reflect
tags: [plan-checker, assumption-verification, second-order-effects, review-gap, planning]
created: 2026-03-01T22:00:00Z
updated: 2026-03-02T18:50:00Z
durability: convention
status: active
severity: notable
signal_type: capability-gap
signal_category: negative
phase: 34
plan: 0
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.6
lifecycle_state: triaged
lifecycle_log:
  - "created -> detected by human at 2026-03-01T22:00:00Z: manual signal during Phase 34 planning"
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: address -- part of plan checker capability gap cluster"
evidence:
  supporting:
    - "Plan 34-03 Task 1 uses `frontmatter extract` subcommand which does not exist in gsd-tools.js (only get/set/merge/validate exist)"
    - "Field-not-found from `frontmatter get --field` returns error JSON that passes emptiness checks, would affect every future plan execution"
    - "Plan checker verified all 4 plans as PASSED without catching either issue"
    - "No second-order analysis performed by plan checker (triage-remediate-recur loops, context budget pressure, step ordering fragility)"
  counter:
    - "Plan checker focuses on structural validation (requirement coverage, dependency DAG, file ownership) which it does well"
    - "Tool API verification may be out of scope for a plan checker that doesn't execute code"
confidence: high
confidence_basis: "Directly observed during manual review -- both the wrong subcommand and the error JSON handling gap were confirmed against actual gsd-tools.js source code"
triage:
  decision: address
  rationale: "Part of plan checker capability gap cluster. Tool API assumptions are verifiable without execution (grep for command in tool source). Clear enhancement path."
  priority: high
  by: reflector
  at: "2026-03-02T18:50:00Z"
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During Phase 34 planning, the plan checker (gsd-plan-checker) verified all 4 plans as PASSED. A subsequent manual review by the user found multiple issues:

1. **Critical bug:** Plan 34-03 Task 1 uses `node gsd-tools.js frontmatter extract` which doesn't exist. The correct subcommand is `frontmatter get`. The `2>/dev/null` in the bash code would silently swallow the error, meaning signals would never get remediated -- the core feature of Phase 34.

2. **Notable bug:** Even with the correct subcommand, `frontmatter get --field resolves_signals` returns `{"error":"Field not found","field":"resolves_signals"}` when the field is absent. The plan's emptiness check (`!= "null"` and `!= "[]"`) doesn't catch this, meaning every plan without resolves_signals would trigger false-positive processing.

3. **Missing analysis:** No second-order effects were considered by the plan checker -- signal regression loops, planner context budget pressure, synthesizer step ordering fragility.

## Context

The plan checker focuses on structural dimensions: requirement coverage, task completeness, dependency correctness, key links, scope sanity, and verification derivation. It does not verify tool API assumptions (e.g., whether a gsd-tools.js subcommand actually exists) or analyze second-order effects of the changes being planned.

The user had to manually request "evaluate your plan for any possible gaps" to surface these issues. This suggests either (1) the plan checker should be enhanced with API/assumption verification, or (2) a separate review step should exist between planning and execution.

## Potential Cause

The plan checker operates at the specification level -- it reads plan text and validates structure, coverage, and dependencies. It does not have a mechanism to:
- Cross-reference tool invocations against actual tool implementations
- Simulate error paths (what happens when a field is missing?)
- Analyze second-order effects (what cascading behaviors does this change introduce?)

These are fundamentally different verification dimensions than what the plan checker currently targets. Adding them may require either enhancing the plan checker's mandate or creating a separate "assumption verifier" step in the planning workflow.
