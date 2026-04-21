---
id: sig-2026-03-26-plan-51-01-files-modified-omits-tests-unit
type: signal
project: get-shit-done-reflect
tags: [scope-creep, plan-accuracy]
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 51
plan: 51-01
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-03-05-undeclared-claude-dir-scope-creep-plan02
  - sig-2026-03-02-plan-scope-declaration-mismatch-35-03-and-04
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.17.5+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-03-29T08:00:00Z"
evidence:
  supporting:
    - "51-01-PLAN.md files_modified declares only: get-shit-done/migrations/v1.18.0.json, bin/install.js"
    - "test(51-01): add 15 tests for migration guide, version comparison, and stale file cleanup — touched tests/unit/install.test.js"
    - tests/unit/install.test.js appears in 51-01 commit output but not in frontmatter declaration
  counter:
    - Extra file is the test file for the same plan — a natural companion artifact, not architectural drift
    - Plans 51-02 and 51-03 correctly declare tests/unit/install.test.js in their frontmatter, showing the pattern is understood
confidence: 0.85
confidence_basis: Direct comparison of PLAN.md files_modified frontmatter against git log --name-only for 51-01 commits; 1 extra non-planning file confirmed
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Plan 51-01 files_modified omits tests/unit/install.test.js despite test commit in same plan

Evidence:
- 51-01-PLAN.md files_modified declares only: get-shit-done/migrations/v1.18.0.json, bin/install.js
- test(51-01): add 15 tests for migration guide, version comparison, and stale file cleanup — touched tests/unit/install.test.js
- tests/unit/install.test.js appears in 51-01 commit output but not in frontmatter declaration

## Context

Phase 51, Plan 51-01 (git sensor).

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
