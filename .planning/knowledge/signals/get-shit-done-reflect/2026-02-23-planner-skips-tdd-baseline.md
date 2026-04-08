---
id: sig-2026-02-23-planner-skips-tdd-baseline
type: signal
project: get-shit-done-reflect
tags:
  - planner
  - tdd
  - plan-quality
  - user-review
  - agent-behavior
  - gap-closure
created: "2026-02-23T18:00:00Z"
updated: "2026-02-23T18:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 28
plan: 0
polarity: negative
detection_method: manual
origin: user-observation
---

# Signal: Planner Agent Skips TDD RED Baseline Step

## What Happened

During Phase 28 planning (Restore Deleted Commands), the gsd-planner agent generated a plan that went straight to restoration (GREEN) without first confirming the failing test baseline (RED). The user caught this during plan review and requested a revision.

## Expected Behavior

For phases where failing tests already exist (a textbook TDD scenario), the planner should structure tasks as:
1. **RED**: Run tests to confirm expected failures, capture baseline
2. **GREEN**: Make changes, run tests to confirm all pass
3. **REFACTOR**: Clean up if needed

This pattern was successfully used in Phases 25 and 26 (per user instruction during Phase 24 planning), but the planner did not apply it to Phase 28 despite the scenario being even more naturally suited to TDD (existing test failures as the starting point).

## Additional Gap Found

The user also identified that the plan did not note the Phase 22 agent-protocol.md consistency debt -- the 3 restored agents have inline protocol sections because they were deleted before Phase 22 extracted shared protocol. This is known debt that should be tracked, not a bug.

## Impact

- Without RED baseline, the executing agent cannot prove the before/after delta
- False positives could go undetected (e.g., if tests already passed for unexpected reasons)
- Partial restorations by other means would not be detected

## Resolution

Plan revised with:
1. Task 1 (RED): Confirm exactly 4 failures with specific test names before any changes
2. Task 2 (GREEN): Restore + verify 20/20 + commit
3. `known_debt` frontmatter field added for Phase 22 inline protocol inconsistency
4. `key_links` line numbers corrected per checker feedback (226->228, 129->130)

Commit: 76fa5d1

## Lesson

When existing tests fail and the phase goal is to make them pass, the planner should automatically structure the plan as TDD (RED -> GREEN). The planner agent spec may need a heuristic: "If wiring/integration tests currently fail and the phase goal includes making them pass, use TDD task structure."
