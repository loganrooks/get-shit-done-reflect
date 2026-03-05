---
id: sig-2026-03-01-plan-checker-misses-second-order-effects
type: signal
project: get-shit-done-reflect
tags: [plan-checker, second-order-effects, review-gap, planning, assumption-verification, capability-gap]
created: 2026-03-01T19:15:00Z
updated: 2026-03-02T18:50:00Z
durability: principle
status: active
severity: critical
signal_type: capability-gap
phase: 35
plan: planning
polarity: negative
source: manual
occurrence_count: 2
related_signals: [sig-2026-03-01-plan-checker-misses-tool-api-assumptions]
runtime: claude-code
model: claude-opus-4-6
signal_category: negative
lifecycle_state: triaged
lifecycle_log:
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: address -- critical capability gap, clear enhancement path for plan checker"
evidence:
  supporting:
    - "Human review of Phase 35 plans discovered 6 gaps, 3 unvetted assumptions, 3 second-order effects that plan checker did not catch"
    - "Config key mismatch: spike_sensitivity (flat) vs spike.sensitivity (nested) would have created conflicting schemas"
    - "Missing directory creation: KB spikes directory does not exist, plan would fail at write time"
    - "Plan checker passed all 4 plans as PASSED without catching any of these issues"
  counter:
    - "Plan checker successfully validates structural dimensions (requirement coverage, dependency DAG, file ownership)"
    - "Second-order effect analysis may require codebase grounding that exceeds plan checker's current mandate"
triage:
  decision: address
  rationale: "Critical capability gap in plan checker. Human review catches issues that automated checker misses. Clear enhancement path: add semantic validation for file paths, tool commands, and config keys."
  priority: high
  by: reflector
  at: "2026-03-02T18:50:00Z"
---

## What Happened

Manual human-prompted review of Phase 35 plans discovered 6 gaps, 3 unvetted assumptions, 3 second-order effects, and 1 parallelization issue that the automated plan checker (gsd-plan-checker) did not catch. The plan checker passed plans that had:

1. **Config key mismatches** -- spike-integration.md references `spike_sensitivity` (flat) but the manifest uses `spike.sensitivity` (nested). Plans would have created conflicting config schemas.
2. **Missing directory creation** -- KB spikes directory doesn't exist; plan would fail at write time.
3. **Reference doc staleness** -- spike-execution.md and spike-integration.md not updated alongside the code they describe.
4. **Undeclared cross-plan dependencies** -- Plan 04's human checkpoint checks Plan 03's deliverables but didn't depend on it.
5. **Skip condition gap** -- step 5.5 skips for `--gaps` but not `--skip-research`, which would leave it parsing a non-existent RESEARCH.md.
6. **No integration testing** -- the lightweight mode was built (Plan 02) but never exercised (Plan 03 creates files manually).

This is the second occurrence of the plan checker missing substantive issues. The first (sig-2026-03-01-plan-checker-misses-tool-api-assumptions) caught tool/API assumption gaps. This instance catches broader categories: config consistency, directory prerequisites, reference doc freshness, implicit dependencies, and second-order effects.

## Context

The plan checker currently evaluates plans against 5 dimensions: requirement coverage, task completeness, dependency graph, scope sanity, and context compliance. The issues found by manual review fall outside these dimensions:

- **Assumption vetting**: Do the plans assume things about the codebase that haven't been verified? (e.g., directory existence, config key format, script capabilities)
- **Second-order effects**: What happens downstream when these changes land? (e.g., researcher format change affects all projects, step 5.5 is inert by default)
- **Reference doc consistency**: When code changes, do the reference docs that describe that code also get updated?
- **Integration testing analog**: Are the things we build actually exercised, or just structurally present?

The user specifically asked: "shouldn't this be automated or integrated into plan checker?" This suggests the manual review step should not be ad-hoc but a systematic part of the planning workflow.

## Potential Cause

The plan checker's 5 dimensions are structural/syntactic — they verify that plans are well-formed and cover requirements. They don't verify that plans are *correct* in the broader sense:

1. **No codebase grounding**: The checker doesn't read source files to verify assumptions made in plans (e.g., "this directory exists", "this config key format matches").
2. **No cross-artifact consistency check**: The checker doesn't verify that reference docs are updated when the code they describe changes.
3. **No second-order effect analysis**: The checker doesn't ask "what else changes when we do this?"
4. **No feedback loop verification**: The checker doesn't ask "will we actually test what we build?"

Adding these dimensions to the plan checker (or as a separate pre-execution gate) would catch the class of issues found by manual review. The TDD analogy is apt: the planning system lacks the equivalent of "write the test first" — verifying that built artifacts will be exercised, not just created.
