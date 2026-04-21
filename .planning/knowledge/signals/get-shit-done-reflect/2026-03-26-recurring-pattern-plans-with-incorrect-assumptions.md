---
id: sig-2026-03-26-recurring-pattern-plans-with-incorrect-assumptions
type: signal
project: get-shit-done-reflect
tags:
  - plan-underspecification
  - implementation-visibility
  - auto-fix
  - recurring-pattern
  - API-boundary
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: notable
signal_type: struggle
signal_category: negative
phase: 50
plan: {}
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
    - "Plan 01: Hook corpus snapshot expected replacePathsInContent to rewrite quoted path.join args — it does not; fix required changing corpus input"
    - "Plan 01: TST-01 scan regex matched upstream runtime files not intended to be rewritten — exclusion function required"
    - "Plan 04: FEATURE_CAPABILITY_MAP assumed max_level/requires structure; actual is hook_dependent_above/task_tool_dependent"
    - 3 of 5 plans (01, 04, 05) had deviations requiring mid-execution adaptation
  counter:
    - Plans 02 and 03 executed exactly as written with zero deviations, suggesting the pattern is not universal
    - All deviations were caught and corrected within the same plan execution without escalation
    - The fork's internal module structure is complex and not fully documented in plans
confidence: medium
confidence_basis: Pattern observed across 3 of 5 plans; consistent theme of incorrect internal structure assumptions requiring runtime adaptation
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Recurring pattern: plans with incorrect assumptions about internal module structure (FEATURE_CAPABILITY_MAP, replacePathsInContent scope) require auto-fixes — plan authors lack visibility into exact implementation details

Evidence:
- Plan 01: Hook corpus snapshot expected replacePathsInContent to rewrite quoted path.join args — it does not; fix required changing corpus input
- Plan 01: TST-01 scan regex matched upstream runtime files not intended to be rewritten — exclusion function required
- Plan 04: FEATURE_CAPABILITY_MAP assumed max_level/requires structure; actual is hook_dependent_above/task_tool_dependent
- 3 of 5 plans (01, 04, 05) had deviations requiring mid-execution adaptation

## Context

Phase 50 (artifact sensor).
Source artifact: .planning/phases/50-migration-test-hardening/

## Potential Cause

Implementation complexity exceeded plan assumptions, requiring adaptive solutions or workarounds.
