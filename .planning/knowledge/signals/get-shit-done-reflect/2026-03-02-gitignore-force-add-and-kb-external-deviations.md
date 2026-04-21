---
id: sig-2026-03-02-gitignore-force-add-and-kb-external-deviations
type: signal
project: get-shit-done-reflect
tags: [deviation, workaround, config]
created: "2026-03-02T00:00:00Z"
updated: "2026-03-02T00:00:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 34
plan: 4
polarity: negative
occurrence_count: 1
related_signals: []
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-02T00:00:00Z"
evidence:
  supporting:
    - "34-04-SUMMARY.md Deviations section: 'Auto-fixed Issue 1 - .claude/ files are gitignored, required -f flag for git add'"
    - "Fix description: 'Used git add -f for the .claude/ files that were already tracked'"
    - Classified as [Rule 3 - Blocking] in the summary indicating it blocked normal execution flow
    - "34-04-SUMMARY.md Task Commits: Task 3 shows 'N/A (KB files are external to repo at ~/.gsd/knowledge/)'"
    - "34-04-SUMMARY.md Deviations: Auto-fixed Issue 2 describes KB signal file as outside git repo -- 'No fix needed -- this is by design'"
    - VERIFICATION.md item 5 relies on external KB state
  counter:
    - The force-add fix was straightforward and non-destructive; no data was lost
    - These are expected behaviors for this project architecture -- gitignored-but-force-tracked files and KB outside repo are both intentional
    - The executor adapted correctly in both cases without human intervention
confidence: high
confidence_basis: Both deviations are explicitly documented as auto-fixes in the 34-04-SUMMARY.md deviations section with exact commands and rationale. Merged from two candidates with same signal_type and 3 overlapping tags (deviation, config, workaround).
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Plan 04 of Phase 34 encountered two auto-fixed deviations that were explicitly documented in the SUMMARY.md deviations section. First, staging `.claude/` files required `git add -f` because these files are gitignored but force-tracked in the project repo, blocking normal `git add` flow. Second, the KB signal lifecycle demonstration (Task 3) produced no git commit because signal files live outside the project repo at `~/.gsd/knowledge/`, making lifecycle changes unverifiable via standard git history.

## Context

Phase 34 focused on the signal lifecycle pipeline -- plan-signal linkage, recurrence detection, and passive verification-by-absence. Plan 04 was the capstone plan implementing and demonstrating the lifecycle. The two deviations surfaced in the Deviations section of 34-04-SUMMARY.md as auto-fixed items, both classified as Rule 3 (Blocking) for the first and resolved by design for the second.

## Potential Cause

Both issues stem from architectural decisions: the `.claude/` directory is force-tracked in git while also being gitignored (requiring `-f` for staging), and the knowledge base lives at `~/.gsd/knowledge/` outside any project repo (cross-project design). The workflow lacks explicit step-level guidance for executors encountering these known friction points -- each executor must re-discover and re-apply the workarounds without documented precedent in the plan templates.
