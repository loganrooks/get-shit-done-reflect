---
id: sig-2026-03-26-installer-never-run-after-phase-completion-claude
type: signal
project: get-shit-done-reflect
tags: [plan-gap, depth-rename, install, dual-directory, config-migration, ownership, runtime-mismatch, deferred-step]
created: 2026-03-29T08:00:00Z
updated: 2026-03-29T08:00:00Z
durability: convention
status: active
severity: critical
signal_type: deviation
signal_category: negative
phase: 49
plan: 2
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
    - "VERIFICATION.md gap summary: 'one runtime-neutral authority model goal is not achieved because the guidance documents Claude actually reads still describe the old split behavior'"
    - "VERIFICATION.md identifies 5 orphaned .claude/ artifacts: reflect.md, config-validity.md, version-migration.md, feature-manifest.json, manifest.cjs"
    - "49-02-SUMMARY.md explicitly defers install: 'The installed .claude/ copies will need updating via node bin/install.js --local after all source changes are complete'"
    - 49-03-SUMMARY.md and 49-04-SUMMARY.md do not mention running the installer
    - "49-02-SUMMARY.md 'Next Phase Readiness' states: 'The installed .claude/ copies will need updating via node bin/install.js --local after all source changes are complete' — acknowledging the need but not claiming it was done"
    - "VERIFICATION.md gap summary: 'The fix is a single command: node bin/install.js --local from the project root' — confirming it was never run"
    - "Anti-patterns table in VERIFICATION.md marks .claude/workflows/reflect.md and .claude/references/health-probes/config-validity.md as 'Blocker' severity"
    - This is a known pattern in this project (CLAUDE.md notes the v1.15 Phase 22 incident where .claude/ edits instead of npm source went undetected for 23 days)
    - No subsequent SUMMARY.md records that the install was executed
    - "VERIFICATION.md status: gaps_found, score 8/10 — 2 truths failed"
  counter:
    - "A final 'install and verify' step was arguably implicit in the phase design"
    - gsd-tools.cjs binary runs from get-shit-done/bin/ (not .claude/) so migration processing itself works correctly at runtime
    - The deferred-until-all-changes-complete strategy is reasonable to avoid redundant installs mid-phase
    - "The fix is a single command: node bin/install.js --local"
    - npm source is fully correct and all 533 tests pass — the functional implementation is complete
confidence: high
confidence_basis: VERIFICATION.md explicitly identifies the gap, traces it to the deferred install step, and names all affected files. Direct observation of artifacts.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

installer never run after phase completion — .claude/ runtime copies are orphaned with stale depth terminology and old schema

Evidence:
- VERIFICATION.md gap summary: 'one runtime-neutral authority model goal is not achieved because the guidance documents Claude actually reads still describe the old split behavior'
- VERIFICATION.md identifies 5 orphaned .claude/ artifacts: reflect.md, config-validity.md, version-migration.md, feature-manifest.json, manifest.cjs
- 49-02-SUMMARY.md explicitly defers install: 'The installed .claude/ copies will need updating via node bin/install.js --local after all source changes are complete'
- 49-03-SUMMARY.md and 49-04-SUMMARY.md do not mention running the installer
- 49-02-SUMMARY.md 'Next Phase Readiness' states: 'The installed .claude/ copies will need updating via node bin/install.js --local after all source changes are complete' — acknowledging the need but not claiming it was done

## Context

Phase 49, Plan 2 (artifact sensor).
Source artifact: .planning/phases/49-config-migration/49-VERIFICATION.md
Merged with artifact signal: 49-02 deferred the install step to after 'all source changes

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
