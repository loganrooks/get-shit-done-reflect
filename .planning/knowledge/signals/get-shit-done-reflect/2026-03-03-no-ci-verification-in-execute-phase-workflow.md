---
id: sig-2026-03-03-no-ci-verification-in-execute-phase-workflow
type: signal
project: get-shit-done-reflect
tags: [ci, workflow-gap, execute-phase, verification, automation, signal-collection, architecture]
created: 2026-03-03T18:35:00Z
updated: 2026-03-03T18:35:00Z
durability: principle
status: active
severity: critical
signal_type: deviation
phase: 37
plan: "01-03"
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-03-03-ci-fail-manifest-selftest-hardcoded-feature-count, sig-2026-03-03-ci-green-unconfirmed-fix-commits-local-only, sig-2026-03-02-ci-failures-ignored-throughout-v116]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
---

## What Happened

After Phase 37 execution completed and passed verification (12/12 must-haves), CI failed on the PR. The execute-phase workflow has no step that triggers CI, waits for CI results, or treats CI as a verification gate. CI is also a rich source of signals (test failures, coverage changes, build issues) that the signal collection system has no access to during or after execution. The user identified this as an architectural gap: CI checking is neither well-integrated into the execution workflow nor automatable.

## Context

The execute-phase workflow currently verifies via:
1. SUMMARY.md spot-checks (file existence, git commits present, no Self-Check: FAILED)
2. Verifier agent checking must-haves against codebase (static analysis)

Neither of these exercises CI. The workflow has no concept of:
- Pushing to remote and triggering CI as a verification step
- Waiting for CI results before declaring phase complete
- Collecting CI output as a signal source (failed tests, new warnings, coverage deltas)
- Automation levels for CI checking (should it auto-trigger? prompt? nudge?)

This creates two gaps:
1. **Verification gap**: Phase can be marked "complete" while CI is red
2. **Signal collection gap**: CI failures are a signal source that's invisible to the automation loop

The user's question about responsibility distribution:
- Should this be part of execute-phase (post-wave CI gate)?
- Should it be a separate verify-work step?
- Should it be subsumed under signal collection (CI sensor)?
- What are the dependencies? (CI setup existence, branching strategy, automation level)

Phases 39 (CI Awareness) and 40 (Signal Collection Automation) address parts of this, but the integration into execute-phase as a verification gate and signal source isn't explicitly covered in the current roadmap. The CI sensor detects failures after the fact; it doesn't prevent marking a phase complete while CI is red.

## Potential Cause

1. **execute-phase was designed for local verification**: The workflow assumes verification means "codebase matches must-haves" not "CI pipeline passes"
2. **CI is treated as external**: The roadmap positions CI awareness (Phase 39) as a session-start notification, not as an execution gate
3. **No automation knob for CI checking**: The automation framework (Phase 37) defines levels for features like signal collection and reflection, but there's no `ci_check` feature in the automation config that would control whether/when CI is consulted during execution
4. **Dependency complexity**: Not all projects have CI, branching strategies affect when CI runs, and some phases may not push until the end — making CI integration non-trivial to generalize
