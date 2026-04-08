---
id: sig-2026-03-28-offer-next-skips-pr-workflow
type: signal
project: get-shit-done-reflect
tags:
  - git-workflow
  - phase-transition
  - offer-next
  - workflow-spec
  - devops
  - pr-workflow
created: "2026-03-28T07:15:00Z"
updated: "2026-03-28T07:15:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 53
plan: 04
polarity: negative
occurrence_count: 4
related_signals:
  - sig-2026-03-23-phase-stack-complete-but-not-integrated
  - sig-2026-03-26-active-phase-branch-not-pushed-immediately
  - sig-2026-03-03-post-merge-cleanup-not-automatic
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.17.5+dev
detection_method: manual
origin: user-observation
---

## What Happened

After Phase 53 execution completed (verification passed, 5/5 must-haves), the execute-phase workflow's `offer_next` step recommended `/gsdr:plan-phase 54` as the next action. The user expected the inter-phase workflow to follow proper git/devops conventions:

1. Create PR for the phase branch (`gsd/phase-53-deep-integration`)
2. Check CI tests pass on the PR
3. Optionally run `/gsdr:collect-signals 53`
4. Accept and merge the PR
5. Switch to main, pull latest
6. Recommend `/gsdr:discuss-phase 54` (not plan-phase) as next step

Instead, the workflow skipped the entire PR/CI/merge cycle and jumped straight to planning the next phase.

## Context

- The project uses `branching_strategy: "phase"` in config.json, meaning each phase gets its own branch
- Phase 53 created 12 commits on `gsd/phase-53-deep-integration`
- The ROADMAP.md and STATE.md were updated on the phase branch, not on main
- This is the 4th occurrence of git workflow gaps between phases (related to sig-2026-03-23 phase stacking without CI coverage)
- The `offer_next` step in execute-phase.md hardcodes the next action as `/gsdr:plan-phase {X+1}` without considering the branching strategy

## Potential Cause

The execute-phase workflow's `offer_next` step was designed for `branching_strategy: "none"` where all work happens on main. When `branching_strategy: "phase"` is active, the step should route through PR creation and merge before recommending next-phase work. The workflow spec lacks a conditional branch based on `branching_strategy` in the `offer_next` step. Additionally, `/gsdr:discuss-phase` should precede `/gsdr:plan-phase` as the default recommendation since discuss-phase gathers context and decisions that inform planning.
