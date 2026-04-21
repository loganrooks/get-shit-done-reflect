---
phase: 58-structural-enforcement-gates
plan: 13
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: high
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-20T18:06:30Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: derived
    reasoning_effort: derived
    profile: derived
    gsd_version: exposed
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: derived_from_harness
    platform: derived_from_harness
    vendor: derived_from_harness
    model: resolveModelInternal
    reasoning_effort: codex_profile_resolution
    profile: config
    gsd_version: repo_mirror
    generated_at: writer_clock
    session_id: not_available
model: claude-opus-4-7
context_used_pct: 48
subsystem: structural-gates
tags: [gate-10, phase-reconcile, gsd-tools, cli-substrate, closeout-seam, composition]
requires:
  - phase: 58-05
    provides: per-gate Codex behavior matrix row for GATE-10 (applies on both runtimes)
  - phase: 58-10
    provides: handoff + state-primitive patterns reused in reconcile orchestrator
  - phase: 58-12
    provides: dispatch-contract pattern for workflow-step wiring
provides:
  - gsd-tools phase reconcile <N> subcommand with --dry-run / --auto-commit / --auto flags
  - get-shit-done/bin/lib/reconcile.cjs orchestrator composing state + roadmap primitives
  - GATE-10 fire-event emission on every invocation (::notice title=GATE-10::gate_fired=GATE-10 result=... fields=...)
  - execute-phase.md offer_next GATE-10 structural step (replaces advisory prose)
  - complete-milestone.md handle_branches per-phase GATE-10 loop (before merge)
affects: [phase-closeout, state-drift, roadmap-drift, measurement-gate-fire-events]
tech-stack:
  added: []
  patterns:
    - "composition-over-replacement: orchestrator invokes existing state/roadmap CLI primitives via subprocess rather than re-exporting their internals"
    - "exit-code-as-gate: exit 5 for unreconciled fields so callers can branch on gate outcome without parsing JSON"
    - "fire-event-every-invocation: GitHub Actions notice marker emitted in dry-run + block + reconciled paths so Plan 19 extractor can count structurally"
key-files:
  created:
    - get-shit-done/bin/lib/reconcile.cjs
    - tests/unit/reconcile.test.js
    - .planning/phases/58-structural-enforcement-gates/58-13-SUMMARY.md
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/complete-milestone.md
key-decisions:
  - "Orchestrator invokes existing primitives (roadmap update-plan-progress, state update-progress, state record-session) via subprocess, not by cross-importing their internals — preserves composition-over-replacement and stays below the blast radius if primitive signatures change"
  - "Unreconciled-case exit code is 5 (distinct from GATE-01 exit codes 1/2/3/4) so callers can branch specifically on GATE-10 block; fire-event still emits in block path so Plan 19 extractor counts structurally even when blocked"
  - "Fire-event emits on every invocation including dry-run (not just reconciled path) — counting gate invocations structurally requires the marker to land regardless of outcome, otherwise Plan 19 undercounts"
  - "execute-phase.md GATE-10 step placed at TOP of offer_next (before push/PR creation) so STATE/ROADMAP drift is caught at the earliest structural boundary — runs after phase-completion verification in update_roadmap step that precedes it"
  - "complete-milestone.md reconcile uses per-branch phase-id extraction regex rather than requiring planner to pass phase list — branch-naming convention (`<prefix>/phase-<N>-...`) is already structural per phase_branch_template in config"
  - "touched_planning_files enumeration is best-effort (git merge-base fallback origin/main → local main → skip) — non-blocking when git context unavailable; keeps reconcile usable in CI/detached contexts"
patterns-established:
  - "GATE orchestrator via subprocess composition: new gate substrate invokes existing primitives through `node gsd-tools.cjs <cmd>` rather than require()-ing their functions — decouples gate from primitive internals"
  - "Fire-event-on-every-invocation: downstream measurement (Plan 19) counts gate fires regardless of outcome; dry-run, block, and success paths all emit the marker"
  - "Exit-code branching for gate outcomes: distinct exit codes per gate (1=GATE-01 block, 4=GATE-04c ack-mismatch, 5=GATE-10 unreconciled) so wrapper workflows can handle each gate's semantics without parsing output"
duration: 8min
completed: 2026-04-20
---

# Phase 58 Plan 13: GATE-10 Phase Reconcile Subcommand + Workflow Wiring Summary

**GATE-10 ships as a structural CLI substrate composing existing state/roadmap primitives, wired into `execute-phase.md` offer_next and `complete-milestone.md` merge-loop with exit-coded gating and universal fire-event emission.**

## Performance
- **Duration:** 8min
- **Tasks:** 2 / 2 completed
- **Files modified:** 3 (gsd-tools.cjs, execute-phase.md, complete-milestone.md)
- **Files created:** 3 (reconcile.cjs, reconcile.test.js, this SUMMARY.md)

## Accomplishments

- Added `gsd-tools phase reconcile <N> [--dry-run] [--auto-commit] [--auto]` subcommand as a new named CLI substrate for phase-closeout reconciliation.
- Implemented `get-shit-done/bin/lib/reconcile.cjs` — 400+ lines, composes existing primitives (roadmap `update-plan-progress`, state `update-progress`, state `record-session`) via subprocess invocation rather than cross-importing internals.
- Orchestrator snapshots STATE.md + ROADMAP.md, computes expected vs current drift across (a) plan checkboxes, (b) phase-row plan counts, (c) progress percent, (d) stopped_at, (e) touched planning-authority files via `git diff --name-only <base>...HEAD`, (f) per-plan SUMMARY/VERIFICATION presence.
- Emits `::notice title=GATE-10::gate_fired=GATE-10 result=<reconciled|block> fields=<count>` on every invocation including dry-run and block paths so Plan 19 `gate_fire_events` extractor counts structurally.
- Exit codes: 0 reconciled/noop, 5 unreconciled (distinct from GATE-01's 1/2/3/4 family).
- Added 5 unit tests in `tests/unit/reconcile.test.js`: structured JSON output, fire-event emission, CLI registration, missing-phase blocking, fully-reconciled dry-run.
- Wired `execute-phase.md` offer_next: GATE-10 step placed as first sub-step, ahead of the existing GATE-01 CI gate (Plan 06) and squash-removed merge flow (Plan 01). Prose reconciliation requests replaced with exit-coded call.
- Wired `complete-milestone.md` handle_branches: per-phase reconcile loop placed before the merge loop, using regex-based phase-id extraction from branch names (structural — relies on existing `phase_branch_template` convention). Each phase's reconcile is idempotent.
- Full test suite: 650 passed, 4 todo, 1 skipped — no regressions.

## Task Commits

1. **Task 1: Build reconcile.cjs + register `phase reconcile` subcommand** — `750f29a6`
2. **Task 2: Wire `phase reconcile` into execute-phase.md offer_next + complete-milestone.md phase-close** — `01e09170`

## Files Created/Modified

- `get-shit-done/bin/lib/reconcile.cjs` (new, ~400 lines) — GATE-10 orchestrator; exports `reconcilePhase`, `cmdPhaseReconcile`, `emitFireEvent`; composes existing state/roadmap primitives via subprocess; emits fire-event on every invocation.
- `get-shit-done/bin/gsd-tools.cjs` (modified, +4 lines) — registered `reconcile` under the `phase` subcommand router; added `require('./lib/reconcile.cjs')`; updated usage message.
- `tests/unit/reconcile.test.js` (new, ~135 lines) — 5 vitest cases covering dry-run JSON shape, fire-event marker, CLI registration, missing-phase blocking, fully-summarized phase behavior.
- `get-shit-done/workflows/execute-phase.md` (modified, +33 lines) — inserted GATE-10 step at head of offer_next, with structured exit-code handling and cited signal provenance.
- `get-shit-done/workflows/complete-milestone.md` (modified, +36 lines) — inserted per-phase GATE-10 reconcile loop before the merge loop, with regex-based phase-id extraction from branch name.
- `.planning/phases/58-structural-enforcement-gates/58-13-SUMMARY.md` (new, this file).

## Decisions & Deviations

### Decisions Made

- **Subprocess composition over require-level composition.** The orchestrator invokes `gsd-tools roadmap update-plan-progress` and `gsd-tools state update-progress` via `child_process.spawnSync` rather than directly calling `roadmap.cmdRoadmapUpdatePlanProgress()` from `reconcile.cjs`. Rationale: primitives internally call `output()` and manage their own lock semantics; subprocess invocation preserves that contract. Trade-off: incurs one Node startup per primitive (~50ms each). Accepted because reconcile runs at phase-close only, not on hot paths.
- **Exit code 5 for unreconciled case.** Distinct from phase advance's 1/2/3/4 codes (GATE-01) and from GATE-04c's 4 (ack-mismatch). Lets wrapper workflows branch on specifically "GATE-10 unreconciled" vs general failure without parsing JSON.
- **Fire-event emits on every invocation including dry-run.** The alternative (emit only on reconciled path) would silently undercount gate invocations in the Plan 19 extractor. Per CONTEXT DC-1 ("measurable fire-event"), the substrate must emit regardless of outcome.
- **`touched_planning_files` enumeration is advisory.** If `git merge-base` fails (detached HEAD, CI without full refs), reconcile proceeds without it rather than blocking. The field still appears in `changes[]` with a file list when git context resolves; downstream staging respects the list only in `--auto-commit` mode.
- **Per-phase loop in complete-milestone.md uses branch-name regex, not config lookup.** The `phase_branch_template` already encodes the branch-naming convention structurally. Parsing the phase id from branch name is a 1-line sed rather than a config-load round-trip — simpler, stays aligned with the existing `PHASE_BRANCHES` enumeration earlier in the step.
- **Unreconciled-plans detection is thresholded.** A phase with `>50%` summaries but missing VERIFICATION.md flags missing-SUMMARY plans as unreconciled; phases below that threshold are treated as ordinary in-progress (not drift). Prevents the gate from false-positive-blocking a phase mid-plan-execution.

### Deviations from Plan

**None that require Rule 4 architectural decision.** All deviations fit Rule 3 (fix blocking integration issues) and are documented above:

- **Rule 3 — Exit code on unreconciled dry-run.** Plan text §Task 1 says "exits 0 (dry-run doesn't apply changes)" but also says "if some fields can't be auto-reconciled...exit with code 5". In the mid-phase case these conflict. Resolved by making exit-code purely outcome-driven (reconciled/noop = 0, unreconciled = 5) regardless of dry-run flag. Dry-run affects *writes* (suppresses them), not the gate outcome classification. This matches the plan's broader design intent (gate fires per invocation; exit code reflects state).

- **Rule 3 — Phase-id extraction in complete-milestone.md.** Plan text §Task 2 Part B says "with the specific phase number for each completing phase. If the milestone close closes multiple phases, loop over them" but doesn't specify how to derive the phase number. Added a regex-based extraction from branch names per the existing `phase_branch_template` convention. Non-architectural — follows the surrounding workflow's enumeration pattern.

### Auth Gates

None.

### KB Consulted

Knowledge base not consulted; all deviations were Rule 3 resolutions with clear structural precedent in the existing gate orchestrators (phase advance pattern in `phase.cjs` lines 1099-1108).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- GATE-10 substrate ready for Plan 19 (`gate_fire_events` extractor registration) to count `::notice title=GATE-10::` markers from measurement corpora.
- GATE-11 (Plan 15 — `gsd-tools release check` + release-lag template) can reuse the same composition pattern (subprocess orchestrator) and exit-code-as-gate discipline.
- GATE-12 (Plan 14 — `gsd-tools agent archive`) can reuse the fire-event-on-every-invocation convention.
- Phase 58 reflexive reconcile: Plan 20 (`58-LEDGER.md` + ROADMAP update) can now invoke `phase reconcile 58` itself to validate the structural property that Phase 58 is structurally reconciled before it merges.

## Self-Check

Verification performed:

- `[ -f get-shit-done/bin/lib/reconcile.cjs ]` → FOUND
- `[ -f tests/unit/reconcile.test.js ]` → FOUND
- `git log --oneline | grep 750f29a6` → FOUND (Task 1 commit)
- `git log --oneline | grep 01e09170` → FOUND (Task 2 commit)
- `grep "phase reconcile" get-shit-done/workflows/execute-phase.md` → FOUND (line 860)
- `grep "phase reconcile" get-shit-done/workflows/complete-milestone.md` → FOUND (lines 619, 638)
- `grep "gate_fired=GATE-10" get-shit-done/workflows/execute-phase.md` → FOUND (line 857)
- `grep "gate_fired=GATE-10" get-shit-done/workflows/complete-milestone.md` → FOUND (line 624)
- `node get-shit-done/bin/gsd-tools.cjs phase reconcile 58 --dry-run | grep GATE-10` → FOUND (`::notice title=GATE-10::gate_fired=GATE-10 result=block fields=18`)
- `npm test` → 650 passed, 4 todo, 1 skipped, 0 failures

## Self-Check: PASSED
