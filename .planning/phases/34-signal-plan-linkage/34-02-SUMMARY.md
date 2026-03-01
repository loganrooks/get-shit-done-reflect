---
phase: 34-signal-plan-linkage
plan: 02
subsystem: planner-workflow
tags: [signal-awareness, resolves_signals, triaged-signals, plan-phase-workflow]
requires:
  - phase: 34-signal-plan-linkage
    provides: "resolves_signals field documentation, verification_window config (Plan 01)"
provides:
  - "Signal awareness section in gsd-planner agent for resolves_signals recommendation"
  - "Triaged signal loading step (7b) in plan-phase workflow"
  - "Triaged signals context passed to planner in planning_context prompt"
affects: [34-03-PLAN, 34-04-PLAN, gsd-planner, plan-phase-workflow]
tech-stack:
  added: []
  patterns: ["signal-context-injection", "conditional-workflow-step"]
key-files:
  created: []
  modified:
    - agents/gsd-planner.md
    - get-shit-done/workflows/plan-phase.md
key-decisions:
  - "Signal awareness section placed after knowledge_surfacing, before required_reading in planner agent"
  - "Triaged signal loading skipped for --gaps mode (gap closure does not use signal awareness)"
  - "Signal context capped at 10 files prioritized by severity (critical > notable > minor)"
  - "Triaged signals passed inline in planning_context block, not as separate prompt section"
patterns-established:
  - "Signal context injection: workflow loads signals from KB and passes to agent as structured context block"
  - "Conditional workflow step: step 7b skips when KB index missing or --gaps flag set"
duration: 2min
completed: 2026-03-01
---

# Phase 34 Plan 02: Signal Awareness in Planner and Workflow Summary

**Planner agent gets signal_awareness section for resolves_signals recommendation, plan-phase workflow loads triaged signals from KB and passes them as planner context**

## Performance
- **Duration:** 2min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Added `<signal_awareness>` XML section to gsd-planner.md with rules for recommending resolves_signals (no force-fitting, max 5 per plan, address-only signals, KB validation)
- Added `resolves_signals` as optional field in plan format frontmatter template and fields table
- Added step 7b "Load Triaged Signals" to plan-phase.md workflow between context loading (step 7) and planner spawn (step 8)
- Step 7b reads KB index, filters for project-specific triaged signals with decision "address", reads up to 10 signal files, and formats as `<triaged_signals>` context block
- Updated planner prompt in step 8 to include `{TRIAGED_SIGNALS}` in planning_context

## Task Commits
1. **Task 1: Add signal_awareness section to gsd-planner.md** - `97edcfd`
2. **Task 2: Add triaged signal loading step to plan-phase.md workflow** - `65aadff`

## Files Created/Modified
- `agents/gsd-planner.md` - Added signal_awareness section, resolves_signals in frontmatter template and fields table
- `get-shit-done/workflows/plan-phase.md` - Added step 7b for triaged signal loading, updated planner prompt with triaged signals context

## Deviations from Plan

None -- plan executed exactly as written.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness
- Plan 03 (Executor Lifecycle Transitions) can implement resolves_signals consumption during execution, transitioning signals from triaged to remediated
- Plan 04 (Verification and Recurrence) can implement the synthesizer logic for verification_window tracking
- The signal awareness chain is now: KB signals -> plan-phase workflow (load) -> planner agent (recommend) -> PLAN.md frontmatter (declare)

## Self-Check: PASSED
