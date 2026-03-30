---
id: sig-2026-03-28-ci-cache-cross-project-pollution-bug-inf-01
type: signal
project: get-shit-done-reflect
tags: [blocked, deviation, workaround, ci, config]
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 54
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
    - 54-05-PLAN.md context explicitly requires covering v1.29.0 and v1.30.0
    - "54-04-SUMMARY.md: 'creating outstanding changes assessment (INF-09) extending Phase 48.1 drift ledger with 3 new clusters (C12 Windsurf+skills, C13 SDK/headless, C14 i18n)'"
    - "54-RETROSPECTIVE.md 'What Didn't Work: Drift Management Between Ledger Snapshots': 'The drift ledger (Phase 48.1) was a point-in-time snapshot at v1.28.0. By Phase 54, upstream reached v1.30.0 with 40 additional commits. The ledger became partially stale within 4 days.'"
    - "54-01-SUMMARY.md Accomplishments: 'Fixed cross-project CI cache pollution (INF-01): both writer and reader now derive repo name from git remote get-url origin and branch from git branch --show-current, producing scoped filenames like gsd-ci-status--get-shit-done-reflect--main.json'"
    - "VERIFICATION.md SC-1: 'Scoped pattern verified in all 4 hook files (source + dist). No legacy hardcoded filename remains.'"
    - "54-01-PLAN.md Task 1 action: 'Currently line 11 of hooks/gsd-ci-status.js writes to a single global gsd-ci-status.json file. When multiple projects are open, one project's CI status overwrites another's.'"
  counter:
    - The baseline-freeze + retriage pattern formalized in FORK-STRATEGY.md explicitly includes a rule to budget for post-baseline drift
    - The fix was planned and executed cleanly in this phase, so the defect is now remediated
    - Bug only manifests when multiple projects are open simultaneously — may not affect single-project workflows
    - The stale ledger was handled by the planned ledger extension in Plan 04 — the process accommodated for this
    - Upstream releasing 2 versions in 4 days during an active sync is a known risk that the governance policy now addresses
confidence: high
confidence_basis: Bug clearly described in plan with specific line reference; fix verified in VERIFICATION.md
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

CI cache cross-project pollution bug (INF-01) was a pre-existing infrastructure defect where gsd-ci-status.json wrote to a single global file, causing one project's CI status to overwrite another's across concurrent sessions

Evidence:
- 54-05-PLAN.md context explicitly requires covering v1.29.0 and v1.30.0
- 54-04-SUMMARY.md: 'creating outstanding changes assessment (INF-09) extending Phase 48.1 drift ledger with 3 new clusters (C12 Windsurf+skills, C13 SDK/headless, C14 i18n)'
- 54-RETROSPECTIVE.md 'What Didn't Work: Drift Management Between Ledger Snapshots': 'The drift ledger (Phase 48.1) was a point-in-time snapshot at v1.28.0. By Phase 54, upstream reached v1.30.0 with 40 additional commits. The ledger became partially stale within 4 days.'
- 54-01-SUMMARY.md Accomplishments: 'Fixed cross-project CI cache pollution (INF-01): both writer and reader now derive repo name from git remote get-url origin and branch from git branch --show-current, producing scoped filenames like gsd-ci-status--get-shit-done-reflect--main.json'
- VERIFICATION.md SC-1: 'Scoped pattern verified in all 4 hook files (source + dist). No legacy hardcoded filename remains.'

## Context

Phase 54, Plan 1 (artifact sensor).
Source artifact: .planning/phases/54-sync-retrospective-governance/54-01-PLAN.md
Merged with artifact signal: Drift ledger produced in Phase 48.1 became partially stale w

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
