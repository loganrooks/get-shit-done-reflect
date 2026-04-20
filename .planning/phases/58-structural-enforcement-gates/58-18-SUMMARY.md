---
phase: 58-structural-enforcement-gates
plan: 18
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-20T18:52:00Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: not_available
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: resolveModelInternal
    reasoning_effort: not_available
    profile: config
    gsd_version: repo_mirror
    generated_at: writer_clock
    session_id: not_available
model: claude-opus-4-7
context_used_pct: 55
subsystem: structural-gates
tags: [XRT-01, cross-runtime, capability-matrix, planning-gate, closeout-verifier, codex-substrate]
requires:
  - phase: 58-structural-enforcement-gates
    provides: Plan 05 per-gate Codex behavior matrix (satisfaction vocabulary for XRT-01 plan-phase assertion)
  - phase: 58-structural-enforcement-gates
    provides: Plan 17 cmdVerifyLedger + GATE-09b planning-gate (XRT-01 closeout wires into Plan 17 CLI surface; planning assertion follows GATE-09b step)
  - phase: 58-structural-enforcement-gates
    provides: Plans 11/12/12a/14 preserved workflow edits (text_mode markers, echo_delegation macros + dispatch contracts, GATE-12 HEADNOTE)
provides:
  - XRT-01 planning-phase assertion (plan-phase.md Step 4.6)
  - XRT-01 closeout capability-matrix diff (verify.cjs verifyCapabilityMatrix)
  - capability-matrix.md XRT-01 discipline HEADNOTE
  - XRT-01 fire-event on both planning-time and verify-time invocations
affects:
  - plan-phase.md
  - gsd-tools verify ledger subcommand (XRT-01 check folded in)
  - capability-matrix.md (discipline HEADNOTE; content untouched per plan spec)
tech-stack:
  added: []
  patterns:
    - planning-gate-as-grep-heuristic-with-permissive-satisfaction (XRT-01 plan-phase assertion mirrors GATE-09b grep shape)
    - phase-start-sha-via-first-parent-log (earliest commit touching phase dir = approximate phase-start anchor for diff)
    - execGit-stdout-trim-normalization (trimEnd both sides of diff compare to absorb core.cjs .trim() vs fs.readFileSync newline asymmetry)
    - capability-touch-heuristic-superset (XRT-01 closeout scans a superset of planning-gate keywords to avoid false-negatives on capability-surface-touching phases)
    - deadlock-guard-via-warning-pass (missing matrix file / missing git history → pass-with-reason rather than block, matches Plan 17 queryGateFireEvents null-return pattern)
key-files:
  created:
    - tests/unit/verify-xrt-01-capability-matrix.test.js (5 tests, all pass)
    - .planning/phases/58-structural-enforcement-gates/58-18-SUMMARY.md
  modified:
    - get-shit-done/workflows/plan-phase.md (Step 4.6 XRT-01 assertion + HEADNOTE + fire-event)
    - get-shit-done/bin/lib/verify.cjs (verifyCapabilityMatrix helper + wired into cmdVerifyLedger after meta-gate; module export)
    - get-shit-done/references/capability-matrix.md (XRT-01 discipline HEADNOTE at top; content rows unchanged)
key-decisions:
  - "Planning-gate heuristic is a grep against CONTEXT.md alone (not CONTEXT.md + RESEARCH.md like GATE-09b). Rationale: XRT-01 specifically targets CONTEXT-time omissions per audit Finding 2.10; RESEARCH.md is downstream of CONTEXT and the GATE-09b dual-file scan already catches open/deferral dynamics. Scanning RESEARCH.md here would risk missing the planning-time failure mode the gate exists to prevent."
  - "Satisfaction vocabulary for XRT-01 is permissive-OR (Codex behavior | does-not-apply-with-reason | applies-via-workflow-step | applies-via-installer | Codex degradation | waiver path | XRT-01 itself). Rationale: any author who has authored any form of Codex-behavior declaration has satisfied the structural obligation; the verifier in closeout checks substantive correctness via the capability-matrix diff."
  - "Closeout capability-touch heuristic uses a SUPERSET of the planning-gate keywords (adds SessionStart, PreToolUse, PostToolUse, capability-matrix, has_capability, task_tool, tool_permissions, mcp_servers). Rationale: a phase might update the matrix without any CONTEXT-time hook keyword if the capability being surfaced is non-hook (task_tool parity, tool_permissions, mcp_servers transport support). Matching the matrix's own row labels prevents false-negatives."
  - "Phase-start SHA resolution uses `git log --first-parent --reverse -- <phaseDir>` and takes the earliest SHA. This is approximate — a phase branch that rebases before closeout will reset the anchor — but robust against per-phase branching (`gsd/phase-NN-*`). The `--first-parent` flag means merge commits from other branches don't falsely anchor the diff."
  - "execGit stdout-vs-fs.readFileSync newline asymmetry caught during test development (pre-commit): core.cjs execGit .trim()s stdout; fs.readFileSync preserves trailing newlines. Without normalization, EVERY phase with an unmodified matrix would false-block with reason=capability_matrix_unreviewed because a single trailing newline would differ. Fixed via trimEnd() on both sides of the equality check with HEADNOTE comment citing the root cause."
  - "XRT-01 closeout runs INDEPENDENTLY of --no-meta-gate flag. Rationale: --no-meta-gate targets GATE-09e (phase-introduced-gates-fire-at-least-once); XRT-01 is cross-runtime substrate discipline and should not be bypassed by the meta-gate escape hatch. Implementation folds the XRT-01 block into missing_claims so a single `verify ledger` call surfaces both GATE-09d and XRT-01 status, but the fire-event is emitted on its own XRT-01-titled notice line for Plan 19 extractor clarity."
  - "Deadlock guards mirror Plan 17 queryGateFireEvents null-return pattern: matrix file missing → pass with reason=capability_matrix_file_missing; no git history for phase dir → pass with reason=matrix_start_not_resolvable. Rationale: refusing to block on operator-side infrastructure gaps (missing file, fresh worktree) follows the Plan 17 precedent and prevents XRT-01 from becoming a false gate on bootstrap / test-fixture paths."
patterns-established:
  - "Planning-gate + closeout-check paired discipline: one gate, two enforcement points on the same commitment, with fire-events keyed to the same gate_id. XRT-01 is the reference implementation — the assertion catches CONTEXT-time omissions; the closeout check catches phase-end drift from the capability surface."
  - "Permissive-OR satisfaction pattern for planning-time assertions: any structural declaration in the author's hand counts as satisfaction; substantive correctness is verified at closeout. Prevents the planning gate from becoming a vocabulary-enforcement obstacle while keeping the closeout teeth."
  - "Diff-against-phase-start-SHA pattern for closeout checks: resolves phase-start as earliest commit touching phase dir via `git log --first-parent --reverse`. Reusable for any cross-phase artifact-diff discipline (e.g., future REQUIREMENTS.md diff / ROADMAP.md diff checks)."
duration: 5min
completed: 2026-04-20
---

# Phase 58 Plan 18: XRT-01 Cross-Runtime Substrate Discipline Summary

**Wire XRT-01 as paired planning-gate + closeout-verifier: CONTEXT.md with hook-dependent commitment must declare a Codex path before `/gsd:plan-phase` proceeds; capability-matrix.md must be updated when the phase ships a capability-touching feature.**

## Performance

- **Duration:** ~5min
- **Tasks:** 1 of 1 complete (plan specifies one three-part task: A planning assertion + B verifier extension + C matrix HEADNOTE)
- **Files modified:** 3 source files + 1 new test file + 1 summary

## Accomplishments

- **XRT-01 planning-phase assertion** (Part A): `get-shit-done/workflows/plan-phase.md` Step 4.6 greps `<phase>-CONTEXT.md` for hook-dependent keywords (`hook|SessionStop|postlude|codex_hooks|session-meta`); if present, requires at least one Codex-path declaration per 58-05-codex-behavior-matrix.md vocabulary (`applies | applies-via-workflow-step | applies-via-installer | does-not-apply-with-reason | Codex behavior | Codex degradation | waiver path | XRT-01`). Missing declaration = exit 1 with remediation banner. Fire-event `::notice title=XRT-01::gate_fired=XRT-01 result=<pass|block> reason=<str>` emits on every invocation. No CONTEXT.md → skip-shaped pass with `reason=no_context_md`.
- **XRT-01 closeout verifier** (Part B): `get-shit-done/bin/lib/verify.cjs` `verifyCapabilityMatrix` helper wires into `cmdVerifyLedger` after the meta-gate check. Detects capability-touch by scanning phase SUMMARY.md + CONTEXT.md for the matrix's own row labels (superset of planning-gate keywords). Resolves phase-start SHA via `git log --first-parent --reverse -- <phaseDir>` and diffs matrix content at that SHA against working tree (with `trimEnd()` normalization for `execGit` stdout trimming). Missing matrix / missing history → deadlock-guarded pass-with-reason. XRT-01 block rolls into `cmdVerifyLedger` `missing_claims` but emits its own dedicated fire-event line on `XRT-01` notice title.
- **Capability-matrix HEADNOTE** (Part C): `get-shit-done/references/capability-matrix.md` gains a top-of-file HTML comment documenting the XRT-01 closeout discipline, citing REQUIREMENTS.md:419, the verifier function, and the companion plan-phase assertion. Content rows unchanged per plan scope.
- **Unit tests** (developed alongside Part B): 5 tests in `tests/unit/verify-xrt-01-capability-matrix.test.js` cover the five result paths — `no_capability_touch` (phase doesn't touch surface → pass), `matrix_updated` (phase touches + matrix modified → pass), `capability_matrix_unreviewed` (phase touches + matrix unchanged → block), `capability_matrix_file_missing` (no matrix file → pass with warning), `matrix_start_not_resolvable` (no git history → pass with warning). All 5 pass. Plan 17's 7 existing verify-ledger tests still pass. Full suite: 662 passed, 4 todo, 0 regressions (up from 657 pre-plan).

## Task Commits

1. **Task 1: XRT-01 planning assertion + closeout verifier + matrix HEADNOTE** — `b4d661da`

## Files Created/Modified

- `get-shit-done/workflows/plan-phase.md` — Step 4.6 XRT-01 assertion (11 XRT-01 hits). Prior Plan 11/12/12a/14/17 edits preserved byte-identical (verified via grep count: 29 `GATE-09b|GATE-12|text_mode|echo_delegation|DISPATCH CONTRACT|GATE-05` hits unchanged pre/post edit).
- `get-shit-done/bin/lib/verify.cjs` — `verifyCapabilityMatrix` helper + wiring in `cmdVerifyLedger` + module export. Prior Plan 17 `cmdVerifyLedger` / `parseContextClaims` / `extractPhaseGates` / `queryGateFireEvents` preserved; new check runs additively.
- `get-shit-done/references/capability-matrix.md` — top-of-file HTML-comment HEADNOTE (10 lines). Content rows unchanged.
- `tests/unit/verify-xrt-01-capability-matrix.test.js` — 5 tests covering the five result paths.

## Fire-Event Declarations

Plan 19's `gate_fire_events` extractor reads these markers from stdout during workflow runs and (once CI writes them) from `.planning/measurement/gate-events/*.jsonl`:

- **XRT-01 (planning-time)**: `::notice title=XRT-01::gate_fired=XRT-01 result=<pass|block> reason=<hook_commitment_no_codex_path|codex_path_declared|no_hook_commitments|no_context_md>` — emitted once per `/gsd:plan-phase` invocation from `plan-phase.md` Step 4.6. Source: `get-shit-done/workflows/plan-phase.md`.
- **XRT-01 (verify-time / closeout)**: `::notice title=XRT-01::gate_fired=XRT-01 result=<pass|block> reason=<no_capability_touch|matrix_updated|capability_matrix_unreviewed|capability_matrix_file_missing|matrix_start_not_resolvable|phase_directory_not_found>` — emitted once per `gsd-tools verify ledger <phase>` invocation from `cmdVerifyLedger`'s call to `verifyCapabilityMatrix`. Always fires regardless of pass/block outcome so the Plan 19 extractor can count denominators. Source: `get-shit-done/bin/lib/verify.cjs`.

## Decisions & Deviations

### Deviations from Plan

**Rule 1 — Auto-fix bug during test development**

1. **[Rule 1 — Bug] `execGit` stdout trimming vs `fs.readFileSync` newline preservation false-positive.** The plan's exemplar compared `matrixCurrent !== matrixStart` directly. In practice, `core.cjs`'s `execGit` helper `.trim()`s stdout while `fs.readFileSync` preserves trailing newlines — so a phase with an unmodified matrix would false-block with `reason=capability_matrix_unreviewed` on any file that terminates with a newline (which every well-formed file does). Caught during unit test iteration (Test 2 `matrix_updated` passed trivially because the edit added a line; Test 3 `capability_matrix_unreviewed` failed unexpectedly). Fixed by normalizing both sides with `.trimEnd()` before compare, with HEADNOTE comment citing the root cause for future readers. Tracked as a surface bug, not architectural — the diff-based approach is sound; only the byte-level comparison needed normalization.

### Key Decisions (detail)

- **Planning-gate scans CONTEXT.md alone, not CONTEXT+RESEARCH.md.** GATE-09b's dual-file scan catches `[open]` claim resolutions that land in RESEARCH.md. XRT-01's failure mode is different — it's about CONTEXT-time omission of cross-runtime substrate declarations. A phase that authored CONTEXT.md without Codex behavior but added one to RESEARCH.md later still has the CONTEXT-time problem XRT-01 exists to prevent (downstream planners/executors read CONTEXT.md first). Scanning RESEARCH.md here would allow the failure mode through.

- **Satisfaction vocabulary is permissive-OR.** Any authored form of Codex-behavior declaration satisfies the structural check: the exact 58-05 vocabulary values (`applies`, `applies-via-workflow-step`, `applies-via-installer`, `does-not-apply-with-reason`), or narrative forms (`Codex behavior`, `Codex degradation`, `waiver path`), or the XRT-01 gate label itself. Rationale: the planning gate enforces structural presence; substantive correctness (does the declaration match the capability-matrix row?) is the closeout verifier's job. Permissive-OR keeps the gate from becoming a vocabulary-enforcement obstacle.

- **Closeout capability-touch heuristic uses a superset of planning-gate keywords.** Planning-gate scans hook-specific terms (`hook|SessionStop|postlude|codex_hooks|session-meta`). Closeout adds the capability-matrix row labels (`SessionStart|PreToolUse|PostToolUse|capability-matrix|has_capability|task_tool|tool_permissions|mcp_servers`). Rationale: a phase could update the matrix for a non-hook capability (task_tool parity changes, new mcp_servers transport, tool_permissions semantic shift) without any hook keyword in the CONTEXT; matching the matrix's own row labels catches that category. False-positives are acceptable because the matrix-diff check is the teeth — if the phase touched capability AND updated the matrix, it passes; the keyword-scan only determines whether the diff check is enforced at all.

- **Phase-start SHA via `git log --first-parent --reverse -- <phaseDir>`.** Takes the earliest commit that introduced any file under the phase directory. `--first-parent` means merge commits from sibling branches don't falsely anchor. This is approximate — a phase branch that rebases before closeout resets the anchor, and a phase that creates the dir in its first commit anchors AT the first commit (matrix-at-that-SHA = matrix in that commit, which may already include phase edits). Accepted as a known limitation in exchange for robustness against the fork's per-phase branching strategy. Documented in verify.cjs inline comments.

- **XRT-01 closeout runs independently of `--no-meta-gate`.** The `--no-meta-gate` flag targets GATE-09e (phase-introduced-gates fire-at-least-once). XRT-01 is cross-runtime substrate discipline — a different concern. Folding them together would allow operators to bypass XRT-01 via a flag intended for a different purpose. Implementation keeps XRT-01's fire-event on its own titled notice line so Plan 19's extractor can count XRT-01 independently of GATE-09d.

- **Deadlock guards return pass-with-reason, not block.** Missing matrix file (`capability_matrix_file_missing`) and missing phase git history (`matrix_start_not_resolvable`) both pass with distinct reasons rather than block. Matches Plan 17's `queryGateFireEvents → null` precedent: operator-side infrastructure gaps should not false-block gate work. The reason strings are observable via the fire-event so Plan 19's extractor can surface frequency as a measurement signal if these paths become common.

### Cross-Plan Preservation Confirmation

Per orchestration brief, files edited by this plan had prior edits that must survive. Confirmed:

- **`plan-phase.md`** — Plan 11 (text_mode HEADNOTE), Plan 12 (echo_delegation macros + 4 dispatch contract blocks at researcher / planner / checker / planner-revise sites), Plan 12a (refinements to those), Plan 14 (GATE-12 HEADNOTE), Plan 17 (GATE-09b Step 4.5 + narrowing-decisions section reference in planner prompt). All intact: pre-edit grep count for `GATE-09b|GATE-12|text_mode|echo_delegation|DISPATCH CONTRACT|GATE-05` was 29; post-edit count is 29. New XRT-01 Step 4.6 is additive, inserted between Step 4.5 and the `<capability_check name="agent_spawning">` block.
- **`verify.cjs`** — Plan 17 `cmdVerifyLedger` + helpers (`parseContextClaims`, `extractPhaseGates`, `findPhaseLedger`, `queryGateFireEvents`). All intact: `verifyCapabilityMatrix` is a new top-level helper; the wire-in point is additive (new call between the existing meta-gate emission block and the existing `blockReasons` summation). All 7 Plan 17 tests still pass.
- **`capability-matrix.md`** — content rows unchanged per plan Part C scope statement ("This plan does NOT modify capability-matrix.md content — it only wires the verifier to diff it"). HEADNOTE added at file top as a self-contained HTML comment; no row / table / section changes.

### Dispatch Parallelism Notes

Plan 20 runs after Plan 18 (wave 11 → wave 12). No concurrent-file-edit conflicts observed. Plan 19 (ran during Plan 17 per Plan 17 SUMMARY observations) did not edit any Plan 18 files; `queryGateFireEvents` integration from Plan 17 is unchanged by Plan 18.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- XRT-01 is now structurally enforced at planning-time AND closeout. Future phases that ship hook-dependent or cross-runtime features will be gated by the planning assertion (CONTEXT.md authoring forcing function) and the closeout diff (phase-end substrate reconciliation).
- **Known follow-up surface** (not Plan 18 scope): if a phase's first commit CREATES both the phase dir and the phase work, the phase-start SHA resolves to the work commit and matrix-at-SHA equals matrix-now → no diff → false-pass. Acceptable for v1.20 but worth a Phase 60+ refinement to a more precise phase-start boundary (e.g., branch-point SHA for `gsd/phase-NN-*` branches). Documented inline for future reference.
- Plan 20 (Phase 58 ledger author) can cite Plan 18 in its own ledger entry; the XRT-01 closeout check will verify Plan 20's ledger entries when `verify ledger 58` runs at Phase 58 close — including the self-referential fact that Phase 58 itself touched capability-matrix.md (via this plan's HEADNOTE) so the diff passes.

## Self-Check: PASSED

- [x] All files referenced in key-files exist:
  - `get-shit-done/workflows/plan-phase.md` — FOUND (`grep -c XRT-01` = 11)
  - `get-shit-done/bin/lib/verify.cjs` — FOUND (contains `verifyCapabilityMatrix` exported + wired into `cmdVerifyLedger`)
  - `get-shit-done/references/capability-matrix.md` — FOUND (HEADNOTE `grep -c XRT-01` on first 20 lines = 2)
  - `tests/unit/verify-xrt-01-capability-matrix.test.js` — FOUND (5 tests pass)
  - `.planning/phases/58-structural-enforcement-gates/58-18-SUMMARY.md` — THIS FILE
- [x] Task commits exist in git:
  - `b4d661da` — FOUND (`feat(58-18): add XRT-01 cross-runtime substrate discipline (plan + closeout)`)
- [x] Fire-event markers emit:
  - Planning-time: grep `::notice title=XRT-01` in plan-phase.md shows 4 emission points (block / codex_path_declared / no_hook_commitments / no_context_md).
  - Verify-time: live `node get-shit-done/bin/gsd-tools.cjs verify ledger 58 --no-meta-gate --raw` emits `::notice title=XRT-01::gate_fired=XRT-01 result=pass reason=matrix_updated` (expected — this plan's HEADNOTE edit counts as a matrix modification since Phase 58 start).
- [x] Prior plan edits preserved (verified via grep count invariance for plan-phase.md; additive-only change to verify.cjs).
- [x] Full test suite: 662 passed, 4 todo, 0 regressions (5 new XRT-01 tests + 7 Plan 17 tests all pass).
