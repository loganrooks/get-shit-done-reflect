---
phase: 58-structural-enforcement-gates
plan: 06
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: "1.19.6+dev"
  generated_at: "2026-04-20T17:04:40Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: not_available
    profile: derived
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
subsystem: ci-enforcement
tags: [gate-01, gate-14, branch-protection, ci-gate, phase-advance, fire-event, enforce-admins]
requires:
  - phase: 58-05-codex-behavior-matrix
    provides: per-gate Codex behavior declarations for GATE-01 (applies-via-workflow-step on both runtimes) and GATE-14 (applies on both runtimes); grounds the runtime-neutral substrate claim
  - phase: sig-2026-04-10-ci-branch-protection-bypass-recurrence
    provides: critical signal (3 occurrences) motivating structural fix — admin-bypass direct-pushes kept happening while `enforce_admins: false`
provides:
  - GATE-01 workflow-step fire-event marker emitted by `.github/workflows/ci.yml` on every PR run (result=pass | result=block)
  - `gsd-tools phase advance --require-ci-green` exit-coded subcommand that polls `gh pr checks --required --watch` and replaces the prior advisory `[y/n]`
  - Branch protection on `main` flipped to `enforce_admins: true` AND `required_status_checks.strict: true` (server-side GitHub state — no repo file)
  - GATE-14 live-fire evidence: direct admin push to main rejected with `GH006: Protected branch update failed`
  - Resolution of signal `sig-2026-04-10-ci-branch-protection-bypass-recurrence` grounded in observable `enforce_admins: true` state
affects: [phase-58-wave-3, phase-58-plan-19-fire-event-extractor, execute-phase-workflow, ci-pipeline, repo-governance]
tech-stack:
  added: []
  patterns:
    - "Fire-event emission: GitHub Actions `::notice title=GATE-XX::gate_fired=GATE-XX result=<pass|block>` stdout markers — parseable by Plan 19 `gate_fire_events` extractor"
    - "Exit-coded phase advancement: advisory `[y/n]` demoted to UX layer; structural enforcement moves to `gh pr checks --required --watch` exit codes (0 pass / 1 block / 2 no-PR / 3 pending / 4 environment)"
    - "Shared-substrate gate pair: GATE-01 (CI status) + GATE-14 (direct-push prevention) ship together because both live on the same branch-protection API surface"
key-files:
  created:
    - .planning/phases/58-structural-enforcement-gates/58-06-SUMMARY.md
  modified:
    - .github/workflows/ci.yml
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/bin/lib/phase.cjs
    - get-shit-done/workflows/execute-phase.md
key-decisions:
  - "Branch protection flipped 2026-04-20 via orchestrator-run `gh api PUT` (evidence: post-flip state `{enforce_admins: true, strict: true, contexts: [\"Test\"]}`)"
  - "GATE-14 live-fire verified blocking: direct admin push to main rejected with `remote: error: GH006: Protected branch update failed for refs/heads/main. - Required status check \"Test\" is expected.`"
  - "Plan's `admin:repo` scope guidance was WRONG: the existing `repo` scope was sufficient to PATCH branch protection; no `gh auth refresh -s admin:repo` was needed (correction to plan text)"
  - "GATE-01 CLI exit discipline: exit 0 pass, exit 1 block/timeout, exit 2 no-PR-or-no-branch, exit 3 `--auto` still-pending, exit 4 gh-CLI-unavailable — richer than plan's 1/2/3 spec to distinguish environmental failures from gate failures (deviation Rule 2)"
  - "One-fire-sufficient discipline: re-verified protection state only; did NOT re-run the direct-push live-fire test per continuation instructions — one fire is sufficient evidence and re-running creates noise"
  - "Execute-phase wiring: advisory `[y/n]` retained as UX layer AFTER the structural CLI check (offer_next step re-numbered from 3→4, 4→5); structural enforcement is the exit code, not the prompt"
patterns-established:
  - "Runtime-neutral structural gate: GATE-01 and GATE-14 both `applies-via-workflow-step` (CI) / `applies` (branch protection) on both Claude Code AND Codex CLI because the substrate is GitHub server-side state, not agent-runtime behavior"
  - "Human-action checkpoint for server-state changes: when a gate requires flipping third-party service settings (GitHub branch protection), the plan uses `type=\"checkpoint:human-action\"` with exact `gh api` commands and a resume-signal; the executor does NOT attempt to perform the flip via CLI (token-scope concerns) but WILL re-verify post-flip state and live-fire evidence"
  - "Fire-event marker convention: `::notice title=GATE-XX::gate_fired=GATE-XX result=<pass|block> phase=<ref>` — consumable by Plan 19's extractor; `if: always()` ensures emission on failure too"
duration: 248min
completed: 2026-04-20
---

# Phase 58 Plan 06: GATE-01 + GATE-14 (CI Gate + Branch Protection) Summary

**Shipped GATE-01 (CI-green blocking phase advancement) and GATE-14 (direct-push prevention) as a single shared-substrate enforcement unit: CI workflow emits structural fire-events, `gsd-tools phase advance --require-ci-green` exit-codes on required-check state, branch protection on main now enforces `enforce_admins: true` + `strict: true` — closing the `sig-2026-04-10-ci-branch-protection-bypass-recurrence` critical signal whose root cause was `enforce_admins: false`.**

## Performance

- **Duration:** 248min (plan-start 2026-04-20T08:56 → SUMMARY commit 2026-04-20T17:04, straddling a human-action checkpoint; active executor work ~15min across Task 1 implementation + post-flip verification)
- **Tasks:** 2 completed (Task 1 auto; Task 2 human-action checkpoint performed by orchestrator on behalf of user, then re-verified by this continuation agent)
- **Files modified:** 4 repo files + 1 summary created + 1 server-side GitHub API state change

## Accomplishments

- **Task 1 (CI emission marker + CLI + workflow wire-up)** committed at `d898fc53` — three coordinated edits across four files that make GATE-01 structurally enforced:
  - `.github/workflows/ci.yml`: 16-line step `GATE-01 emission marker` added with `if: always()` guard, `job.status` inspection, `::notice title=GATE-01::gate_fired=GATE-01 result=<pass|block> phase=<ref>` stdout emission, and `exit 1` on block path. Placed AFTER `Run tests with coverage` so the step observes the outcome of all preceding test + install-verify steps.
  - `get-shit-done/bin/lib/phase.cjs`: 179-line addition introducing `requireCiGreen()` + `cmdPhaseAdvance()` exports. The function (a) resolves current branch via `git rev-parse --abbrev-ref HEAD`, (b) finds open PR via `gh pr view --json number,state,statusCheckRollup,headRefName`, (c) polls `gh pr checks <n> --required --watch` (or single-poll in `--auto` mode), (d) emits machine-readable JSON `{gate, result, pr, branch, ...}` on pass/block, (e) exit-codes 0/1/2/3/4 to distinguish pass / block / no-PR / pending-in-auto / environment-unavailable.
  - `get-shit-done/bin/gsd-tools.cjs`: router adds `phase advance` subcommand case delegating to `phase.cmdPhaseAdvance`; usage line updated with `advance` in available-subcommands enumeration.
  - `get-shit-done/workflows/execute-phase.md`: offer_next step re-ordered from 3→5 with new GATE-01 structural step inserted at position 3 (exit-coded CLI check) and prompt text updated from `PR created. Merge now?` to `PR created and CI green. Merge now?` — advisory layer retained AFTER structural check.
- **Task 2 (branch protection flip — human-action checkpoint)** performed by orchestrator on 2026-04-20 via documented `gh api PUT` commands. Continuation agent re-verified the post-flip state independently:
  ```json
  {
    "enforce_admins": true,
    "strict": true,
    "contexts": ["Test"]
  }
  ```
  (executed `gh api repos/loganrooks/get-shit-done-reflect/branches/main/protection | jq '{enforce_admins: .enforce_admins.enabled, strict: .required_status_checks.strict, contexts: .required_status_checks.contexts}'` at 2026-04-20T17:04Z — both booleans `true`, required context `Test` enforced).

## Task Commits

1. **Task 1: GATE-01 emission marker + `phase advance --require-ci-green` CLI + `execute-phase.md` wire-up** — `d898fc53` (commit on `gsd/phase-58-structural-enforcement-gates`; 216 insertions, 4 deletions across 4 files)
2. **Task 2: Branch protection flip on main — human-action checkpoint** — no repo commit (server-side GitHub state change via `gh api PUT`, performed 2026-04-20 by orchestrator; evidence section below)

## Files Created/Modified

- `.github/workflows/ci.yml` (modified) — GATE-01 fire-event emission step appended after test steps. Emits `::notice title=GATE-01::gate_fired=GATE-01 result=pass phase=<ref>` on success, `::notice ... result=block ...` + `::error::GATE-01 blocks phase advancement` + `exit 1` on failure. `if: always()` so emission fires on both branches.
- `get-shit-done/bin/lib/phase.cjs` (modified) — `requireCiGreen()` and `cmdPhaseAdvance()` added. Imports `spawnSync` from `child_process`. Shells out to `git`, `gh --version`, `gh pr view`, `gh pr checks --required [--watch]`. Supports `--dry-run` (exit 0 with dry-run message for CI smoke tests), `--auto` (single poll instead of watch), default mode (30-min watch timeout). Uses canonical `output(result, raw, prose)` helper for machine-readable + human-readable dual output.
- `get-shit-done/bin/gsd-tools.cjs` (modified) — router case `subcommand === 'advance'` routes to `phase.cmdPhaseAdvance`; usage enumeration extended with `advance`.
- `get-shit-done/workflows/execute-phase.md` (modified) — offer_next step 3 rewritten as structural GATE-01 call (`if ! node ~/.claude/get-shit-done/bin/gsd-tools.cjs phase advance --require-ci-green; then exit 1; fi`), steps 3/4 renumbered to 4/5, merge prompt updated to reference CI-green state.
- `.planning/phases/58-structural-enforcement-gates/58-06-SUMMARY.md` (created — this file) — plan summary with fire-event declarations, human-action evidence, and self-check.

## Fire-Event Declarations

Per the plan's fire-event clause: this plan declares the following structural fire-events, consumable by Phase 58 Plan 19's `gate_fire_events` extractor.

**GATE-01 fire-event:**
- **Emission locus:** `.github/workflows/ci.yml` step `GATE-01 emission marker`
- **Emission format:** `::notice title=GATE-01::gate_fired=GATE-01 result=<pass|block> phase=<base_ref|ref_name>`
- **Secondary fire-event:** `gsd-tools phase advance --require-ci-green` exit code (0=pass, 1=block, 2=no-PR, 3=pending, 4=env-unavailable)
- **Applies on both runtimes:** `applies-via-workflow-step` on Claude Code AND Codex CLI (CI is runtime-neutral per `58-05-codex-behavior-matrix.md`)
- **First fire:** will occur on the next PR run after this branch lands — by construction, every subsequent PR emits exactly one GATE-01 marker on completion

**GATE-14 fire-event:**
- **Emission locus:** GitHub server-side branch-protection API state
- **Emission format:** structural — `gh api repos/loganrooks/get-shit-done-reflect/branches/main/protection | jq '.enforce_admins.enabled'` returns `true`
- **Live-fire evidence (captured once at flip time, per one-fire-sufficient discipline):**
  ```
  remote: error: GH006: Protected branch update failed for refs/heads/main.
  remote: - Required status check "Test" is expected.
   ! [remote rejected]   HEAD -> main (protected branch hook declined)
  exit code: 1
  ```
  Throwaway branch used for the live-fire test was deleted post-verification; working tree returned clean on `gsd/phase-58-structural-enforcement-gates`.
- **Applies on both runtimes:** `applies` on Claude Code AND Codex CLI (branch protection is server-side, runtime-neutral)
- **Re-verification discipline:** continuation agents re-verify the `enforce_admins: true` + `strict: true` state only; they do NOT re-run the direct-push live-fire test (one fire is sufficient evidence; re-running creates noise in git history and refs)

## Decisions & Deviations

**Decisions:**

- **Branch protection flipped 2026-04-20** by the orchestrator running the plan's documented `gh api PUT` commands directly. The `admin:repo` scope mentioned in the plan turned out to be invalid — the existing `repo` scope was sufficient. **Correction logged**: plan text at `58-06-PLAN.md:229` ("If the flip fails due to token scope (403), run `gh auth refresh -s admin:repo` first") is misleading; `repo` scope (standard `gh auth login` default) is sufficient to PATCH branch protection for repository owners.
- **GATE-14 live-fire verified blocking**: direct admin push rejected with `GH006: Protected branch update failed` + required-status-check enforcement. This is the structural proof that `enforce_admins: true` is operational, not merely configured.
- **One-fire-sufficient discipline**: continuation agent re-verified only the API state, did NOT re-run the throwaway-branch direct-push test. The live-fire evidence captured at flip time (quoted in Fire-Event Declarations section) is canonical; re-firing would add noise without adding epistemic value.

**Deviations from plan as written:**

- **[Rule 2 — Critical functionality]** CLI exit codes expanded from plan's `{0 pass, 1 block/fail, 2 no-PR, 3 auto-pending}` to `{0, 1, 2, 3, 4}` adding exit 4 for gh-CLI-unavailable / unauthenticated. Rationale: plan's exit-code schema conflated environmental pre-req failure (gh missing) with gate failure (checks failing), which would cause callers to treat an unauthenticated environment as a block. Distinguishing exit 4 lets `execute-phase.md` surface a remediable environmental error differently from an actual CI failure.
- **[Plan text correction]** `admin:repo` scope recommendation in plan was unnecessary. Documented in Decisions above.

**No Rule 4 (architectural) deviations.** No auth-gate checkpoints beyond the declared Task 2 human-action.

## Authentication Gates

- **Task 2 (planned gate):** GitHub `gh api PUT` requires repo admin authority. Plan specified `admin:repo` scope; actual operation succeeded with standard `repo` scope (correction above). No scope-refresh needed.

## User Setup Required

**External service state change applied at plan completion.** Branch protection on `main` of `loganrooks/get-shit-done-reflect` was flipped to `enforce_admins: true` + `required_status_checks.strict: true` with `contexts: ["Test"]`. Future operations on this repo inherit this protection; admin bypass for direct pushes to main is now disabled.

No ongoing configuration is required. If at any point branch protection is reverted, the signal `sig-2026-04-10-ci-branch-protection-bypass-recurrence` should be re-opened.

## Next Phase Readiness

- **Plan 19 (fire-event extractor):** GATE-01 workflow-step marker is emitted on every PR run; Plan 19's `gate_fire_events` extractor can parse `::notice title=GATE-01::gate_fired=GATE-01 result=<pass|block> phase=<ref>` from GitHub Actions run logs. Marker format is stable across pass/block paths.
- **Plan 20 (own-phase ledger):** GATE-01 and GATE-14 entries can claim `status: delivered`, not `explicitly_deferred`. Both gates have structural evidence (API state + live-fire output) and workflow-step fire-event emission committed.
- **Phase 58 Wave 3+:** remaining gates (GATE-02..13, -15) can proceed knowing GATE-01/14 substrate is operational; direct pushes to main will now fail fast rather than accumulating as silent bypasses.
- **Downstream execute-phase workflow:** next time `/gsdr:execute-phase` reaches `offer_next`, the structural `phase advance --require-ci-green` call will block progression on real CI state rather than agent discretion.

## Self-Check: PASSED

Verified all claims independently:

- **File: `.planning/phases/58-structural-enforcement-gates/58-06-SUMMARY.md`** — FOUND (this file).
- **Commit `d898fc53`** — FOUND in `git log --oneline --all`; message `feat(58-06): add GATE-01 CI gate substrate (emission marker + phase advance CLI)`; 4 files touched (ci.yml, gsd-tools.cjs, phase.cjs, execute-phase.md); 216 insertions / 4 deletions.
- **CI fire-event emission** — `grep -n "gate_fired=GATE-01" .github/workflows/ci.yml` returned 2 hits (lines 95 pass-path, 97 block-path) — matches plan's expected 2 hits.
- **execute-phase wire-up** — `grep -n "phase advance --require-ci-green" get-shit-done/workflows/execute-phase.md` returned 1 hit at line 795 — matches plan's "at least 1 hit" expectation.
- **Branch protection state** — `gh api .../branches/main/protection | jq '{enforce_admins: .enforce_admins.enabled, strict: .required_status_checks.strict, contexts: .required_status_checks.contexts}'` returned `{enforce_admins: true, strict: true, contexts: ["Test"]}` — matches GATE-14 done criterion.
- **GATE-14 live-fire evidence** — captured at flip time (quoted in Fire-Event Declarations), not re-run per one-fire-sufficient discipline. Evidence is `GH006: Protected branch update failed for refs/heads/main` + required-context-enforcement error.
- **Working tree cleanliness** — `git status --short` returned empty before and after self-check (SUMMARY + STATE.md to be staged by final commit only).

All claimed files, commits, and structural state verified. No missing items.
