---
type: observation
severity: medium
phase: "29"
detected_by: human
date: 2026-02-23
status: open
tags: [plan-quality, tdd, race-condition, human-intervention, workflow-improvement]
---

# Signal: Plan Review Caught Missing TDD Pattern and Race Condition

## What Happened

During Phase 29 plan-phase workflow, the user manually reviewed plans after plan-checker passed and identified two issues the automated checker missed:

1. **Missing TDD RED phase**: Both Plan 01 (test fixes) and Plan 02 (installer deploy) went straight to applying fixes without first confirming the broken state. Plan 01 should run tests to confirm exactly 2 failures (RED) before fixing them (GREEN). Plan 02 should verify hash mismatch exists before running the installer.

2. **Parallel execution race condition**: Both plans were wave 1 with no dependencies. Plan 01 modifies `get-shit-done/bin/gsd-tools.test.js` (source), while Plan 02 runs the installer which copies ALL of `get-shit-done/` to `.claude/get-shit-done/`. Running in parallel could deploy the pre-fix test file.

3. **Latent isolation audit missing**: Plan only fixed the 2 known failures without auditing whether other backlog test calls had the same GSD_HOME isolation gap.

## Why It Matters

- The plan-checker agent validated structure, coverage, and key-links but did not check for TDD methodology compliance or cross-plan execution safety
- This is a recurring pattern: the human catches agentic best-practice gaps that automated checkers don't test for
- TDD RED-before-GREEN is especially important for agentic execution because agents can't visually confirm they're editing the right code -- the RED phase provides programmatic proof

## User's Meta-Observation

The user raised a broader question: should these kinds of checks be automated? Specifically:
1. **Should the plan-checker automatically enforce TDD patterns?** (RED before GREEN for test-related plans, "before state" verification for deployment plans)
2. **Should repeated human interventions be detected as patterns?** When a user repeatedly catches the same class of issue, the system should surface it as a signal
3. **Should intervention patterns feed back into workflow improvements?** Similar to signal collection, but for meta-workflow observations
4. **Which patterns should be automated vs remain human judgment?** Not all interventions should become rules -- some require contextual judgment that automation would over-simplify

## Suggested Actions

- [ ] Add TDD compliance check to gsd-plan-checker agent (check for RED/before-state tasks in test-fix and deployment plans)
- [ ] Add cross-plan execution safety check to gsd-plan-checker (detect file overlap between parallel wave plans)
- [ ] Consider a "human intervention signal" mechanism that auto-detects when users repeatedly modify plan-checker output
- [ ] Discuss which plan-quality checks should be baked into automation vs remain advisory

## Context

- Plans were revised successfully after user feedback (iteration 1/3 of revision loop)
- All 4 issues addressed in revision: TDD Plan 01, TDD Plan 02, wave dependency, latent audit
- Plan-checker re-verification pending
