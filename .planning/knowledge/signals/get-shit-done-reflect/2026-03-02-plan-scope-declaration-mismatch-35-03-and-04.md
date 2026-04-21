---
id: sig-2026-03-02-plan-scope-declaration-mismatch-35-03-and-04
type: signal
project: get-shit-done-reflect
tags: [scope-creep, plan-accuracy]
created: "2026-03-02T00:00:00Z"
updated: "2026-03-02T00:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 35
plan: 0
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-02T00:00:00Z"
evidence:
  supporting:
    - feat(35-03) committed .claude/agents/gsd-phase-researcher.md (not declared in 35-03 files_modified)
    - feat(35-03) committed .claude/agents/gsd-spike-runner.md (not declared in 35-03 files_modified)
    - feat(35-03) committed .claude/get-shit-done/workflows/run-spike.md (not declared in 35-03 files_modified)
    - "35-03 files_modified declared only: .planning/spikes/002-claude-code-session-log-location/DESIGN.md and DECISION.md"
    - The 3 .claude/ files committed in 35-03 were the declared responsibility of 35-04 (installer sync plan)
    - 35-04 declared .claude/get-shit-done/workflows/plan-phase.md (no matching commit found in phase 35)
    - 35-04 declared .claude/get-shit-done/feature-manifest.json (no matching commit found)
    - 35-04 declared .claude/get-shit-done/references/spike-integration.md (no matching commit found)
    - 35-04 declared .claude/get-shit-done/references/spike-execution.md (no matching commit found)
    - docs(35-04) commit only touched .planning/STATE.md and 35-04-SUMMARY.md
  counter:
    - Extra .claude/ files in 35-03 may represent a partial installer sync run during spike validation
    - The .claude/ changes in 35-03 could be a legitimate supporting action to validate the spike against installed runtime
    - The installer may have been run for 35-04 files but content already matched (no diff), explaining absent commits
    - 3 of 7 files declared by 35-04 were already synced in feat(35-03)
confidence: medium
confidence_basis: Comparison of plan declarations against git log for all phase 35 commits; 3 extra .claude/ files in feat(35-03), 4 declared-but-uncommitted files in 35-04
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Two cross-cutting scope declaration mismatches were detected in phase 35, merged into a single signal (cross-sensor dedup: both git sensor signals shared signal_type=deviation and tags scope-creep + plan-accuracy).

Plan 35-03 committed 3 unplanned `.claude/` runtime files (`gsd-phase-researcher.md`, `gsd-spike-runner.md`, `run-spike.md`) that were not declared in its `files_modified` frontmatter and were the declared responsibility of plan 35-04.

Plan 35-04 declared 7 `.claude/` runtime files in its `files_modified` but 4 of them (`plan-phase.md`, `feature-manifest.json`, `spike-integration.md`, `spike-execution.md`) have no corresponding commits in phase 35. The docs(35-04) commit only touched STATE.md and SUMMARY.md.

## Context

Phase 35, plans 03 and 04. Plan 03 was scoped to spike 002 execution (research + decision doc). Plan 04 was the installer sync plan responsible for syncing `.claude/` runtime files from npm source. The scope boundaries between these two plans appear to have been porous in execution.

## Potential Cause

Plan 35-03 likely performed a partial installer sync as part of validating the spike work, inadvertently committing files that belonged to plan 35-04's scope. For plan 35-04, the 4 uncommitted files may reflect content-identical files (installer ran but no diff was generated), or the installer sync was incomplete. The dual-directory architecture creates inherent confusion about which plan owns sync operations.
