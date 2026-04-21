---
phase: 58-structural-enforcement-gates
plan: 01
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-20T12:42:25Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: derived
    reasoning_effort: not_available
    profile: exposed
    gsd_version: exposed
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: runtime_context
    vendor: runtime_context
    model: resolveModelInternal
    reasoning_effort: not_available
    profile: config
    gsd_version: config
    generated_at: writer_clock
    session_id: not_available
model: claude-opus-4-7
context_used_pct: 28
subsystem: workflows
tags: [gate-02, merge-strategy, complete-milestone, squash-default-removal, signal-closure]
requires:
  - phase: 57.8
    provides: "Role-aware signal provenance + first-class signature blocks (AT-6 prerequisite — STATE.md reconciliation)"
provides:
  - "GATE-02 substrate: zero `git merge --squash` invocations in source tree (down from 2 invocations + 1 prose row)"
  - "AskUserQuestion default in `complete-milestone.md` flipped to `Merge with history (Recommended)`; squash option removed entirely"
  - "`.planning/phases/58-structural-enforcement-gates/58-01-gate02-enumeration.md` — authoritative merge-surface enumeration feeding Wave 2 Plan 07"
  - "Per-gate Codex behavior declared for GATE-02 (applies on both Claude Code and Codex; CI grep is runtime-neutral)"
  - "AT-6 closed at Phase 58 plan-phase entry: STATE.md reconciled with Phase 57.8 merge (c8a15d95)"
affects: [plan-07-ci-grep-check, plan-11-installer-parity-gate-04, wave-2, phase-close]
tech-stack:
  added: []
  patterns: [structural-default-inversion, signal-driven-workflow-fix, source-truth-vs-installer-mirror-separation]
key-files:
  created:
    - ".planning/phases/58-structural-enforcement-gates/58-01-gate02-enumeration.md"
    - ".planning/phases/58-structural-enforcement-gates/58-01-SUMMARY.md"
  modified:
    - "get-shit-done/workflows/complete-milestone.md"
    - "get-shit-done/references/planning-config.md"
    - ".planning/STATE.md"
key-decisions:
  - "Squash merge option removed ENTIRELY from AskUserQuestion (not kept as opt-in). Plan language said 'Squash becomes an explicit opt-in option, not the default' AND 'consolidate so both the default and the explicit opt-in reach the same non-squash invocation. Do NOT duplicate work across branches — one `git merge --no-ff --no-commit` call site per strategy.' Those two constraints together force the cleanest interpretation: remove squash entirely because any explicit opt-in would either duplicate the invocation or route to non-squash — at which point listing squash as an option is misleading. Squash remains available via manual git CLI if ever needed; it is no longer a workflow-surfaced path."
  - "Installer-derived mirrors (`.claude/`, `.codex/`) not directly edited. They will resync on next `bin/install.js --local` run; GATE-04 (Plan 11) covers parity drift there instead of duplicating the GATE-02 check across mirrors. Plan 07's CI grep scope is recommended to stay on source paths only (`get-shit-done/`, `agents/`, `commands/`, `skills/`, `.codex/skills/`) matching `58-RESEARCH.md:741` scope."
  - "`planning-config.md:179` prose reference updated to remove `git merge --squash` surface entirely rather than rewriting as historical-marker comment. Reason: the table describes what options exist at complete-milestone; squash no longer exists there, so the row is removed. The rationale prose now cites the motivating signal and user preference directly."
  - "Task 0 STATE.md reconciliation used actual merge commit date (2026-04-20) rather than CONTEXT's cited date (2026-04-17). Plan explicitly instructed: 'If the SHA doesn't match c8a15d95 exactly (CONTEXT DC-5 cites it), use the actual merge commit SHA found via git log ... Update the narrative with whatever the actual SHA is.' The SHA matched but the date did not; treated the date the same way per the instruction's spirit."
patterns-established:
  - "Source-truth vs installer-mirror separation for GATE checks: source edits are authoritative; mirrors resync on install; parity-drift is a separate gate (GATE-04)."
  - "Substrate-first wave ordering: Plan 01 (substrate: fix workflow + enumerate sites) feeds forward to Plan 07 (emission: CI grep) — separation of what-to-check from how-to-check-it."
  - "AT-6 entry-condition reconciliation: phase-boundary STATE.md reconciliation runs at plan-phase entry when the prior phase closed without in-workflow reconcile tooling; Plan 13 will later automate this for future phases."
duration: 6min
completed: 2026-04-20
---

# Phase 58 Plan 01: GATE-02 Substrate — Squash Default Removal + Merge-Surface Enumeration Summary

**Eliminated the `git merge --squash` default from `complete-milestone.md` and produced the authoritative GATE-02 merge-surface enumeration that Wave 2 Plan 07 will consume to author the CI grep check; simultaneously reconciled STATE.md with Phase 57.8's merge as AT-6 entry condition.**

## Performance

- **Duration:** 6 minutes
- **Tasks:** 3 of 3 completed
- **Files modified:** 3 (STATE.md, complete-milestone.md, planning-config.md)
- **Files created:** 2 (58-01-gate02-enumeration.md, this SUMMARY)

## Accomplishments

- **Signal `sig-2026-03-28-squash-merge-destroys-commit-history` root cause eliminated** at the workflow-default level. `complete-milestone.md:603` no longer defaults AskUserQuestion to squash; both the phase-strategy and milestone-strategy merge code paths use `git merge --no-ff --no-commit` exclusively.
- **Zero `git merge --squash` invocations or prose hits in source tree** (verified by `grep -rn "git merge --squash" get-shit-done/` returning no matches). The 3 non-conforming sites identified at plan start (complete-milestone.md:613, :623, planning-config.md:179) are all fixed.
- **GATE-02 authoritative enumeration artifact** (`58-01-gate02-enumeration.md`) lists all 21 merge-surface sites (3 source + 18 derived mirrors or prose references), classifies each as conforming / non-conforming, and records the fix applied where needed. Includes Plan 07 CI-grep-scope recommendation.
- **Per-gate Codex behavior declared for GATE-02**: `applies` on both Claude Code and Codex runtimes — CI grep is runtime-neutral.
- **Fire-event mechanism specified**: `::notice::gate_fired=GATE-02 result=block` marker will be emitted by the CI grep step authored by Wave 2 Plan 07.
- **AT-6 closed at plan-phase entry**: STATE.md's `stopped_at`, `status`, `last_activity`, Current Position section, and Session Continuity section all reference Phase 57.8 as closed (merged 2026-04-20 via c8a15d95) and Phase 58 as in-progress.

## Task Commits

1. **Task 0: Reconcile STATE.md with Phase 57.8 merge** — `8a645a07` (`docs(58-01): reconcile STATE.md with Phase 57.8 merge (AT-6 entry condition)`)
2. **Task 1: Enumerate every merge-surface site** — `a6bc22b5` (`docs(58-01): add GATE-02 enumeration artifact for Wave 2 Plan 07`)
3. **Task 2: Fix complete-milestone.md squash default** — `442d6b30` (committed by plan 58-02's concurrent executor; see "Parallelization Deviation" below). Edits staged and verified by this executor.

## Files Created/Modified

- `.planning/phases/58-structural-enforcement-gates/58-01-gate02-enumeration.md` (created) — authoritative GATE-02 merge-surface enumeration; 21 sites across 3 patterns (`gh pr merge`, `git merge --squash`, `git merge --no-ff`) classified conforming / non-conforming; Codex behavior + fire-event marker + Plan 07 grep-scope recommendation.
- `get-shit-done/workflows/complete-milestone.md` (modified) — AskUserQuestion default flipped; both `git merge --squash` invocations removed; consolidated under single "Merge with history" block; rationale blockquote citing motivating signal and user preference added.
- `get-shit-done/references/planning-config.md` (modified) — merge-options reference table updated; squash row removed; recommended-option prose rewritten to cite signal + GATE-02 enforcement + user preference.
- `.planning/STATE.md` (modified) — `status`, `stopped_at`, `last_updated`, `last_activity`, `Current Position` section (with new `Recent Phases` sub-section), `Session Continuity` all reconciled with Phase 57.8 merge.

## Decisions & Deviations

### Key Decisions

See frontmatter `key-decisions`. The most significant:

- **Squash option removed entirely, not retained as opt-in.** The plan's language created a genuine interpretive choice: "Squash becomes an explicit opt-in option" vs. "one `git merge --no-ff --no-commit` call site per strategy — do NOT duplicate work." Retaining squash as opt-in while enforcing a single non-squash call site would have required either (a) a second `git merge --squash` call site (violating the zero-squash verification) or (b) listing "Squash merge" as an option that routes to non-squash code (misleading users). Removal is the cleanest reconciliation and matches the structural-default spirit of GATE-02.

### Deviations from Plan

**1. [Rule 3 - Parallelization Blocker] Task 2 commit attributed to plan 58-02 due to concurrent executor on shared branch**

- **Found during:** Task 2 commit
- **Issue:** After editing `complete-milestone.md` and `planning-config.md` for Task 2, the executor for Plan 58-02 (which ran concurrently on the same phase branch `gsd/phase-58-structural-enforcement-gates`) staged my unstaged working-tree changes along with its own enumeration file and created commit `442d6b30 docs(58-02): enumerate all 45 delegation spawn sites for GATE-05`. That commit now carries my Task 2 edits, attributed to the 58-02 commit message rather than a dedicated 58-01 Task 2 commit.
- **Fix:** Verification re-run confirms the Task 2 edits are correctly landed in the tree (`git merge --squash`: zero hits; `Merge with history (Recommended)`: on line 603; `git merge --no-ff --no-commit`: 2 hits). The work is complete; only the commit-attribution mechanics differ from the plan's expectation of a separate Task 2 commit.
- **Files affected by attribution mismatch:** `get-shit-done/workflows/complete-milestone.md`, `get-shit-done/references/planning-config.md`.
- **Commit containing Task 2 edits:** `442d6b30` (not a new commit; plan 58-02's commit accidentally absorbed my work).
- **Root cause:** Multiple plan executors running in parallel on the same phase branch with `git status` -> `git add <file>` sequences will race when working-tree files overlap. Plan 58-02's executor grabbed all modified files under `get-shit-done/` into its stage set via some form of `git add -u` or `git add <files>` broader than its own enumeration artifact alone.
- **Workflow implication (signal-worthy):** Parallel wave-1 execution on a shared branch needs stage-set discipline: executors should stage ONLY files they own (by plan scope), never `git add -A` or `git add -u`. This pattern has not been explicitly flagged before in this repo; worth surfacing as a sensor-detectable signal for sig-sensor-log or sig-sensor-git.
- **KB consulted:** Not applicable — the deviation is a mechanical race-condition in commit assembly, not a technical fix requiring prior lesson consultation.

### Minor Observations

- STATE.md's `progress.total_phases`, `completed_phases`, `total_plans`, `completed_plans`, `percent` values predate the insertion of Phase 57.8 and Phase 60.1 — they show `percent: 100` despite Phase 58 being in progress, which is inconsistent with new work underway. Not fixed in this plan because Plan 13's `state update-progress` primitive will recalculate from disk state and that is the authoritative path; fixing this plan's frontmatter alone would be throwaway work. STATE.md's narrative sections are the authoritative honesty surface for this plan's AT-6 requirement, and those are reconciled correctly.
- An `get-shit-done/bin/lib/frontmatter.cjs` modification and `58-04-ledger-schema.md` untracked file remain in the working tree at plan close; those belong to plans 58-04/58-17 (Ledger schema work) and are not in this plan's scope. Leaving them untouched for those executors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Wave 2 Plan 07 has everything it needs:**

- Authoritative enumeration artifact at `.planning/phases/58-structural-enforcement-gates/58-01-gate02-enumeration.md`.
- Zero non-conforming sites remaining in source — Plan 07's CI grep check will pass on first run against current tree.
- Per-gate Codex behavior and fire-event marker spec both declared in the enumeration; Plan 07 can copy these verbatim into its CI step and emission block.
- Scope recommendation spelled out (Section 5.3): grep on source paths only; rely on GATE-04 (Plan 11) for installer-mirror parity.

**Installer-mirror sync reminder:** `.claude/get-shit-done-reflect/workflows/complete-milestone.md` and `.codex/get-shit-done-reflect/workflows/complete-milestone.md` still carry the old squash invocations (verified at enumeration time). Running `node bin/install.js --local` after Plan 01 lands on main will regenerate these from source; GATE-04 will catch if they drift again.

**Signal closure:** `sig-2026-03-28-squash-merge-destroys-commit-history` root cause is eliminated. Signal lifecycle transition (open → remediated) can be recorded at phase close when the full GATE-02 stack (substrate + CI grep from Plan 07 + installer parity from Plan 11) is landed.

## Self-Check: PASSED

**Files verified:**

- FOUND: `.planning/phases/58-structural-enforcement-gates/58-01-gate02-enumeration.md`
- FOUND: `.planning/phases/58-structural-enforcement-gates/58-01-SUMMARY.md`
- FOUND (modified): `get-shit-done/workflows/complete-milestone.md` (zero `git merge --squash` hits, `Merge with history (Recommended)` on line 603, 2 `git merge --no-ff --no-commit` invocations)
- FOUND (modified): `get-shit-done/references/planning-config.md` (zero `git merge --squash` hits)
- FOUND (modified): `.planning/STATE.md` (references c8a15d95 and Phase 57.8 as closed, Phase 58 as in-progress)

**Commits verified:**

- FOUND: `8a645a07` — Task 0 (STATE.md reconciliation)
- FOUND: `a6bc22b5` — Task 1 (enumeration artifact)
- FOUND: `442d6b30` — Task 2 (squash-default fix, attributed to plan 58-02 due to parallelization race; documented as deviation)

**Verification predicates:**

- `grep -rn "git merge --squash" get-shit-done/` → exit 1 (no matches) — PASS
- `grep -n "git merge --squash" get-shit-done/workflows/complete-milestone.md` → zero hits — PASS
- `grep -n "Squash merge (Recommended)" get-shit-done/workflows/complete-milestone.md` → zero hits — PASS
- `grep -cn "git merge --no-ff --no-commit" get-shit-done/workflows/complete-milestone.md` → 2 — PASS
- `grep -E "c8a15d95|57\.8" .planning/STATE.md` → multiple hits confirming reconciliation — PASS
- Enumeration artifact contains `GATE-02 Enumeration` marker — PASS
- Enumeration artifact contains Per-gate Codex Behavior section declaring `applies` on both runtimes — PASS
- Enumeration artifact contains Fire-Event Mechanism section — PASS
