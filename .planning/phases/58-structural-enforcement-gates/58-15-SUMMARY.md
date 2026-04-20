---
phase: 58-structural-enforcement-gates
plan: 15
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: high
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-20T18:26:15Z"
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
context_used_pct: 52
subsystem: structural-gates
tags: [gate-11, release-boundary, release-lag, gsd-tools, cli-substrate, phase-close, milestone-close]
requires:
  - phase: 58-05
    provides: per-gate Codex behavior matrix row — GATE-11 `applies` on both runtimes (CLI subcommand runtime-neutral)
  - phase: 58-13
    provides: post-merge exit-coded gate pattern (GATE-10 reconcile) — placement/semantics reused for GATE-11 in both workflows
  - phase: 58-14
    provides: gate-CLI library authoring style (pure lib + cmd entry) + fire-event-every-invocation pattern
provides:
  - gsd-tools release check subcommand with --since / --lag-threshold-days / --auto flags
  - get-shit-done/bin/lib/release.cjs exposing checkReleaseBoundary(options) for programmatic callers
  - GATE-11 fire-event emission on every invocation (::notice title=GATE-11::gate_fired=GATE-11 result=<release_current|release_lag|explicit_defer>)
  - .planning/handoff/release-lag-template.md — schema template for explicit-deferral document
  - execute-phase.md offer_next GATE-11 step (post-merge exit-coded release-boundary gate, added as step 6 after post-merge cleanup)
  - complete-milestone.md handle_branches GATE-11 step (post-merge-loop, before git_tag)
  - exit code contract: 0 current, 1 lag, 2 explicit_defer — disjoint from GATE-01 (1-4), GATE-04c (4), GATE-10 (5), GATE-12 (2 archive-error semantics live on agent subcommand)
affects: [phase-closeout, milestone-close, release-workflow, measurement-gate-fire-events]
tech-stack:
  added: []
  patterns:
    - "release-boundary-from-tags: compares latest `reflect-v*` tag commit date against last phase-merge commit date on main to detect silent release lag"
    - "deferral-doc-as-escape-hatch: `.planning/release-lag.md` with future `deferred_to` is the named substrate (CONTEXT DC-1) that converts a silent lag into a structural deferred state"
    - "fire-event-every-invocation: marker emits for current, lag, AND deferred paths so Plan 19 extractor counts gate fires structurally regardless of outcome"
    - "stale-deferral-as-lag: past-dated or missing-date deferrals collapse back to lag (exit 1) rather than passing — deferrals must be re-dated or cleared"
    - "gate-self-containment-BRE-workaround: `git log --grep` used `--all-match` with separate patterns for `Merge pull request` and `gsd/phase` to survive a basic-regex quirk where `from gsd/phase-` (with trailing hyphen) failed to match despite being present in merge commit subjects"
key-files:
  created:
    - get-shit-done/bin/lib/release.cjs
    - .planning/handoff/release-lag-template.md
    - .planning/phases/58-structural-enforcement-gates/58-15-SUMMARY.md
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/complete-milestone.md
key-decisions:
  - "Phase-merge detection uses `git log --first-parent main --all-match --grep='Merge pull request' --grep='gsd/phase'` rather than the plan's single-pattern `Merge pull request.*from gsd/phase-` — the latter returned empty despite matching commits being present; root cause is a git basic-regex quirk where `from gsd/phase-` (trailing hyphen) fails to match. `--all-match` with two substring patterns is BRE-safe and produces identical semantic coverage (Merge-pull-request AND gsd/phase substring is unique to GSD phase branches)."
  - "Exit code 2 reserved for `explicit_defer` (future-dated release-lag.md) — distinct from GATE-01 codes (1-4), GATE-04c code 4, GATE-10 code 5. Exit 0 = current, 1 = lag (covers no-tag, tag-behind-phase, past-threshold, AND stale deferral), 2 = explicit_defer. Callers branch on semantics without parsing JSON."
  - "Stale deferrals (past `deferred_to` or unparseable) collapse to lag (exit 1) rather than continuing to defer — the deferral doc is a time-bounded promise, not a permanent escape hatch. Caller must either re-date the deferral with new rationale or fire the release."
  - "Release-lag template placed at `.planning/handoff/release-lag-template.md` (per plan instruction, matches Plan 10 archive-location precedent). The CLI surfaces the copy-to-use command but NEVER writes `.planning/release-lag.md` itself — named rationale must come from the user, not mechanically generated."
  - "Fire-event emits on every invocation including the vacuous-gate case (no phase-merge commit on main) — Plan 19 extractor counts fires regardless of outcome. Vacuous case returns status=current with note='no phase-merge commit on main — gate vacuous' so downstream readers can distinguish it from genuine current."
  - "Local flat-YAML extractor (not `frontmatter.cjs`) for `release-lag.md` parsing — matches Plan 10 `handoff.cjs` gate-self-containment precedent. Supports scalar fields only, which is sufficient for the 4 required frontmatter fields (lag_reason, deferred_to, deferred_at, named_rationale) plus the 3 documented-but-optional fields."
  - "GATE-11 placed at end of `complete-milestone.md` `handle_branches` step (not `git_tag` or `offer_next`) because the milestone-close flow creates the release tag in `git_tag` and triggers publish.yml via tag push — gating BEFORE `git_tag` means user is prompted to address prior-phase release lag before the milestone release is created, preserving the deferral/release dichotomy."
  - "In `execute-phase.md`, GATE-11 placed as step 6 AFTER the post-merge cleanup (branch delete) rather than between the merge and cleanup — cleanup is a local-only operation that cannot roll back, so structurally the gate fires once the phase merge is fully committed, matching the post-merge-boundary semantic in the plan text."
patterns-established:
  - "GATE-via-CLI-subcommand: `release check` follows the `phase advance` / `phase reconcile` / `agent archive` / `handoff resolve` pattern — pure library + CLI wrapper + gsd-tools.cjs router case + fire-event-every-invocation"
  - "Deferral-doc-as-named-substrate: CONTEXT DC-1 `named_substrate` requirement satisfied by an on-disk template + frontmatter schema + exit-coded recognition — matches the ledger-entry pattern from Plan 04/16 (schema + file location + validator)"
  - "BRE-safe git subject grep: `--all-match` with multiple `--grep` substrings is preferred over `.*`-joined single patterns when the target substring ends in characters that git's basic-regex mode treats specially (hyphen at end-of-pattern being the observed failure mode)"
duration: 5min
completed: 2026-04-20
---

# Phase 58 Plan 15: GATE-11 Release-Boundary Assertion Subcommand + Workflow Wiring Summary

**GATE-11 ships as a structural CLI substrate comparing the latest `reflect-v*` tag against the most recent phase-merge commit, with an explicit `.planning/release-lag.md` deferral escape hatch and fire-event emission on every invocation; wired into `execute-phase.md` offer_next (post-merge) and `complete-milestone.md` handle_branches (pre-git_tag).**

## Performance
- **Duration:** 5min
- **Tasks:** 2 completed
- **Files modified:** 6 total (3 created: release.cjs, release-lag-template.md, this SUMMARY; 3 modified: gsd-tools.cjs, execute-phase.md, complete-milestone.md)

## Accomplishments
- `get-shit-done/bin/lib/release.cjs` implements `checkReleaseBoundary(options)` — compares latest `reflect-v*` tag commit date against the most recent `Merge pull request ... from gsd/phase-*` commit on main; returns one of three structured statuses with fire-event emission on every invocation.
- `gsd-tools release check [--since <commit>] [--lag-threshold-days N] [--auto]` CLI subcommand — exit-coded gate: 0 current, 1 lag, 2 explicitly deferred. Hint text on lag guides user to fire or defer.
- `.planning/handoff/release-lag-template.md` documents the deferral schema (YAML frontmatter with `lag_reason`, `deferred_to`, `deferred_at`, `named_rationale`, `referenced_phase_merge`, `written_by_*`) plus a multi-section narrative scaffold (Narrative / Unblock Path / Traceability) and inline usage guidance as HTML comments.
- `execute-phase.md` offer_next step 6 wires `release check --auto` as a post-merge exit-coded gate. On exit 1, workflow halts with user-facing Options A/B/C (fire release, defer explicitly, or both). Placed after post-merge cleanup (step 5) — GATE-10 at offer_next top, GATE-11 after merge, preserves temporal ordering.
- `complete-milestone.md` handle_branches tail wires the same `release check --auto` gate before `git_tag`. Catches the scenario signals document: multiple phases merged during a milestone, milestone closes, no prior releases fired.
- Fire-event `::notice title=GATE-11::gate_fired=GATE-11 result=<release_current|release_lag|explicit_defer> days=<N>` emits on every invocation (including vacuous no-phase-merge case), satisfying Plan 19 gate_fire_events extractor contract.
- Verified end-to-end dry-run against current repo: reflect-v1.19.6 tag fresher than c8a15d95 (Phase 57.8 merge) → status=current, exit 0. Lag path verified via `--lag-threshold-days 0`. Deferred path verified via temporary `.planning/release-lag.md` with `deferred_to: 2099-01-01`.
- Full `npm test` passes (650 tests passed, 4 todo, 1 skipped) — no regressions.

## Task Commits
1. **Task 1: Build release.cjs + register `gsd-tools release check` + release-lag template** — `02ec9059`
2. **Task 2: Wire `release check` into execute-phase.md post-merge + complete-milestone.md post-merge** — `7da673c7`

## Files Created/Modified
- `get-shit-done/bin/lib/release.cjs` — release-boundary check primitive + CLI entry. Exports `checkReleaseBoundary(opts)` and `cmdReleaseCheck(cwd, args, raw)`. Internal helpers exposed for tests (`_findLastPhaseMergeCommit`, `_findLatestReleaseTag`, `_parseReleaseLag`, `_parseIsoToEpoch`).
- `get-shit-done/bin/gsd-tools.cjs` — added `require('./lib/release.cjs')`; added `release` to usage banner; added `case 'release'` router branch dispatching `check` subcommand. Preserves prior subcommands (phase advance, phase reconcile, quick classify, handoff, antipatterns, agent).
- `get-shit-done/workflows/execute-phase.md` — added step 6 under "If branching strategy is phase or milestone" block with exit-coded GATE-11 case/esac branching. Prior edits preserved: GATE-10 at offer_next top (Plan 13), GATE-01 `phase advance --require-ci-green` at step 3 (Plan 06), merge-with-history semantics (Plan 01).
- `get-shit-done/workflows/complete-milestone.md` — added GATE-11 block at end of handle_branches, immediately before `<step name="git_tag">`. Prior edits preserved: GATE-10 per-phase reconcile loop at start of handle_branches (Plan 13), merge-with-history default with anti-squash rationale (Plan 01).
- `.planning/handoff/release-lag-template.md` — 2.7KB template with frontmatter schema, HTML-comment inline guidance, and three narrative sections. First file written into `.planning/handoff/` root (Plan 10 created `.planning/handoff/archive/` subdir lazily; this plan seeds the root with a shipped template).
- `.planning/phases/58-structural-enforcement-gates/58-15-SUMMARY.md` — this summary.

## Decisions & Deviations

### Deviations from Plan

**1. [Rule 1 - Bug] Phase-merge grep pattern fix**
- **Found during:** Task 1 verification (`node gsd-tools release check --auto`)
- **Issue:** Plan's specified pattern `git log --first-parent main --grep='Merge pull request.*from gsd/phase-' -1 --format='%H %ct'` returned empty despite matching commits being on main (c8a15d95 "Merge pull request #50 from loganrooks/gsd/phase-57.8-..."). Root cause: git's default basic-regex mode fails to match the full pattern when the substring `from gsd/phase-` (with trailing hyphen) is included; even `from gsd/phase` (without hyphen) fails. `gsd/phase` alone matches. Symptom: gate would vacuously pass as "current" on every phase-close because no phase-merge commit was ever detected.
- **Fix:** Switched to `--all-match --grep='Merge pull request' --grep='gsd/phase'`. Two orthogonal substring patterns AND-combined via `--all-match` are BRE-safe and produce identical semantic coverage (the combination uniquely identifies GSD phase-merge commits on main without requiring `.*` or trailing-hyphen regex literals).
- **Files modified:** `get-shit-done/bin/lib/release.cjs` (findLastPhaseMergeCommit helper + inline rationale comment).
- **Commit:** Folded into Task 1 commit `02ec9059` (single commit for Task 1 primitive + fix discovered during its own verification).
- **Impact:** None on plan semantics — the plan's intent ("find most recent phase-merge commit on main") is preserved; only the regex substrate changed.

### Other Decisions

All other decisions documented in frontmatter `key-decisions` — covers exit-code assignment, deferral semantics, template location, fire-event coverage, self-contained parsing, and step placement in both workflows.

### Authentication Gates
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness

Plan 17 (phase verifier) now has additional substrate to verify: `gsd-tools release check` return codes, fire-event emission, `.planning/handoff/release-lag-template.md` frontmatter schema integrity, workflow wiring at `execute-phase.md` step 6 and `complete-milestone.md` handle_branches tail.

Plan 18 (CI GATE-15 parity) must round-trip this plan's new files through installer dual-directory verification:
- `get-shit-done/bin/lib/release.cjs` → `.claude/get-shit-done/bin/lib/release.cjs`
- `get-shit-done/workflows/execute-phase.md` → `.claude/get-shit-done/workflows/execute-phase.md`
- `get-shit-done/workflows/complete-milestone.md` → `.claude/get-shit-done/workflows/complete-milestone.md`
- `.planning/handoff/release-lag-template.md` is project-local (not installer-managed); no parity check needed.

Plan 19 (gate_fire_events extractor) can now count `GATE-11` fires alongside GATE-01/GATE-10/GATE-12 via the same `::notice title=GATE-NN::gate_fired=GATE-NN result=<...>` marker format.

## Self-Check: PASSED
