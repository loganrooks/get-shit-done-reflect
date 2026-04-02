---
id: sig-2026-03-26-plan-01-underspecified-upstream-runtime-file-exclu
type: signal
project: get-shit-done-reflect
tags: [namespace-scan, automation, FEATURE_CAPABILITY_MAP, replacePathsInContent, upstream-runtime, snapshot-regression, plan-underspecification, auto-fix]
created: 2026-03-29T08:00:00Z
updated: 2026-03-29T08:00:00Z
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 50
plan: 1
polarity: negative
source: auto
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
    - "50-04-SUMMARY.md Auto-fix 1: 'Plan specified max_level (number) and requires (array) properties for FEATURE_CAPABILITY_MAP entries, but actual code uses hook_dependent_above (number|null) and task_tool_dependent (boolean)'"
    - "50-01-SUMMARY.md Auto-fix 1: 'Plan's regex patterns matched legitimate upstream references in bin/lib/*.cjs (upstream module code), settings.json (gsd-test permission patterns), and CHANGELOG.md (historical version entries). These files are intentionally NOT rewritten by replacePathsInContent.'"
    - Fix required adding isUpstreamRuntime() exclusion function and extra assertions to distinguish rewritten vs upstream file populations
    - "50-01-SUMMARY.md Auto-fix 2: 'Plan specified quoted path.join args (get-shit-done) as hook corpus input, but replacePathsInContent does NOT rewrite quoted strings without trailing slash -- that transformation is done by the hook installer's inline regex.'"
    - Snapshot expectation was wrong and had to be corrected to use get-shit-done/ paths (with trailing slash)
    - "Assertions had to be rewritten against actual structure instead of plan's assumed structure"
  counter:
    - The fix was discovered during Task 2 verification and corrected immediately
    - The correction produced correct behavior and the fix was self-contained
    - This was caught and corrected within the same plan execution with no regressions
    - This is a subtle API boundary distinction; the plan author may not have had access to the exact regex logic when writing the plan
    - The intent of the test (verifying FEATURE_CAPABILITY_MAP completeness) was preserved
    - The exclusion logic (isUpstreamRuntime) is arguably a correct design decision regardless of whether the plan specified it
confidence: high
confidence_basis: Directly documented in SUMMARY auto-fix section with explicit issue description and remediation
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 01 underspecified upstream runtime file exclusions, causing TST-01 scan to flag legitimate references in bin/lib/*.cjs, settings.json, and CHANGELOG.md

Evidence:
- 50-04-SUMMARY.md Auto-fix 1: 'Plan specified max_level (number) and requires (array) properties for FEATURE_CAPABILITY_MAP entries, but actual code uses hook_dependent_above (number|null) and task_tool_dependent (boolean)'
- 50-01-SUMMARY.md Auto-fix 1: 'Plan's regex patterns matched legitimate upstream references in bin/lib/*.cjs (upstream module code), settings.json (gsd-test permission patterns), and CHANGELOG.md (historical version entries). These files are intentionally NOT rewritten by replacePathsInContent.'
- Fix required adding isUpstreamRuntime() exclusion function and extra assertions to distinguish rewritten vs upstream file populations
- 50-01-SUMMARY.md Auto-fix 2: 'Plan specified quoted path.join args (get-shit-done) as hook corpus input, but replacePathsInContent does NOT rewrite quoted strings without trailing slash -- that transformation is done by the hook installer's inline regex.'
- Snapshot expectation was wrong and had to be corrected to use get-shit-done/ paths (with trailing slash)

## Context

Phase 50, Plan 1 (artifact sensor).
Source artifact: .planning/phases/50-migration-test-hardening/50-01-SUMMARY.md
Merged with artifact signal: Plan 04 assumed wrong FEATURE_CAPABILITY_MAP property names

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
