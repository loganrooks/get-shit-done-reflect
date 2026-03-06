# Deliberation: Phase 40 Plan Gap Remediation

**Date:** 2026-03-05
**Status:** Concluded
**Trigger:** Pre-execution deep analysis of Phase 40 plans revealed 2 bugs and 3 gaps
**Affects:** Phase 40 plans (40-01-PLAN.md, 40-02-PLAN.md)
**Related:**
- sig-2026-03-05-phase40-plan-gaps-pre-execution-review
- .planning/phases/40-signal-collection-automation/40-RESEARCH.md

## Situation

Deep analysis of Phase 40 plans identified issues ranging from silent-failure bugs to convention violations. The plan checker passed (structural validation), but semantic analysis of the proposed code revealed problems the checker can't detect.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| Plan 02 steps 5-6 both call `track-event fire` | Double increment makes first-run detection fail | Yes (read cmdAutomationTrackEvent at line 5211 -- fires++ is unconditional) | sig-2026-03-05-phase40-plan-gaps-pre-execution-review |
| Plan 01 cmdAutomationLock stale path | output() called twice on stdout | Yes (output() is JSON writer, no dedup or exit) | same |
| Plan 02 context estimate hardcoded 40 | 40 < 60 threshold always, SIG-05 dead | Yes (resolve-level checks contextPct > threshold) | same |
| automation.test.js has 628 lines for 2 commands | 4 new commands get 0 test lines | Yes (grep for lock/unlock/check-lock/regime-change in test files: 0 hits) | same |
| .gitignore has no .planning/.*.lock pattern | Stale locks visible in git status | Yes (read .gitignore, no such pattern) | same |

## Framing

**Core question:** How do we fix these plan gaps with minimal plan revision while preserving the overall architecture?

## Analysis

### Option A: Rerun Planner

- **Claim:** Respawn the planner with gap notes
- **Grounds:** Planner has full context, would produce clean plans
- **Warrant:** Fresh generation avoids inconsistency from patching
- **Rebuttal:** Wastes ~5 min, may change things that don't need changing, planner context doesn't include the specific bug analysis
- **Qualifier:** Probably unnecessary

### Option B: Surgical Plan Revision

- **Claim:** Edit the 2 plan files to fix the 5 specific issues
- **Grounds:** Issues are localized, fixes are well-understood, architecture is sound
- **Warrant:** Targeted fixes preserve the verified plan structure while correcting specific bugs
- **Rebuttal:** Risk of introducing inconsistency between plan sections (must update verify/done/must_haves too)
- **Qualifier:** Certainly the right approach for well-understood bugs

## Tensions

- Pre-execution review vs plan-as-designed: The plan checker passed, but deeper analysis found bugs. This validates the user's instinct to challenge "VERIFICATION PASSED."
- Testing convention vs plan scope: Adding tests would make Plan 01 a 3-task plan. But skipping tests breaks the project pattern established over 5 milestones.

## Recommendation

**Option B: Surgical revision** of both plans with these specific fixes:

1. **Bug 1 (double-fire):** Remove the duplicate `track-event fire` from step 6. Use the return value from step 5's `track-event` to check `fires`. If fires === 1, write regime change.
2. **Bug 2 (double output):** Remove the intermediate `output()` for stale removal. Combine into a single output: `{ acquired: true, stale_removed: true, stale_age_seconds: N }`.
3. **Gap 3 (context estimate):** Change default from 40 to 55. Add a note that this is approximate and will underestimate for complex phases. Consider wave count as proxy: `min(40 + (waves_completed * 10), 80)`.
4. **Gap 4 (no tests):** Add a Task 3 to Plan 01 for automated tests of lock/unlock/check-lock/regime-change. Follow the automation.test.js pattern.
5. **Gap 5 (gitignore):** Add `.planning/.*.lock` to .gitignore as part of Plan 01 Task 1.

## Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Regime change entry written on first auto-collection | Check KB after first `/gsd:execute-phase` with auto_collect enabled | No regime-* file in signals dir after first fire |
| P2 | Lock/unlock/check-lock have regression safety | Run `npm test` after any future gsd-tools.js refactor | New lock-related tests fail silently |
| P3 | Context deferral triggers on multi-wave phases | Execute a 3+ wave phase with auto_collect at level 3 | Auto-collection proceeds without nudge on high-context phases |

## Decision Record

**Decision:** Surgical plan revision (Option B) with all 5 fixes
**Decided:** 2026-03-05
**Implemented via:** Direct plan file edits before Phase 40 execution
**Signals addressed:** sig-2026-03-05-phase40-plan-gaps-pre-execution-review
