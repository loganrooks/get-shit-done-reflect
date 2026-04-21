---
phase: 58-structural-enforcement-gates
plan: 08
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: high
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-20T17:20:55Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: exposed
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
    reasoning_effort: config
    profile: config
    gsd_version: repo_mirror
    generated_at: writer_clock
    session_id: not_available
subsystem: structural-enforcement
tags: [gate-03, classifier, quick-workflow, ci-backstop, runtime-facing, planning-authority, direct-to-main]
requires:
  - phase: 58-structural-enforcement-gates/05
    provides: "Codex behavior matrix row for GATE-03 = applies-via-workflow-step on both runtimes"
  - phase: 58-structural-enforcement-gates/06
    provides: "GATE-01 CI status gate (preserved alongside this plan's additions)"
  - phase: 58-structural-enforcement-gates/07
    provides: "GATE-02 merge-strategy conformance + GATE-13 dispatch-contract CI steps (preserved)"
provides:
  - "GATE-03 structural enforcement: exit-coded classifier + workflow pre-commit gate + CI post-commit backstop"
  - "`gsd-tools quick classify [--files <path...>]` CLI subcommand (exit 0|1|2|3)"
  - "classifyQuickFiles() exported from get-shit-done/bin/lib/quick.cjs"
  - "post_commit_gate_03 CI job with merge-commit exemption for PR-path commits"
  - "DC-8 `.codex/skills/**/*.md` correctly classified as runtime-facing"
  - "DC-9 `.planning/{ROADMAP,REQUIREMENTS,STATE}.md` correctly classified as planning-authority"
affects: [quick-workflow, ci, structural-gates, phase-58, phase-19-fire-events]
tech-stack:
  added: []
  patterns:
    - "diff-based primary + manifest cross-check composition (Research R12 Q1)"
    - "exit-coded classifier CLI (per-class exit code communicates remediation path)"
    - "CI post-commit backstop with merge-commit exemption (parents >=2 => came via PR)"
    - "workflow-step gate + CI backstop belt-and-braces"
key-files:
  created:
    - "get-shit-done/bin/lib/quick.cjs"
    - ".planning/phases/58-structural-enforcement-gates/58-08-SUMMARY.md"
  modified:
    - "get-shit-done/bin/gsd-tools.cjs"
    - "get-shit-done/workflows/quick.md"
    - ".github/workflows/ci.yml"
key-decisions:
  - "Classifier rules lifted verbatim from Plan 58-08 Task 1 authoritative spec: 11 runtime-facing prefixes, 4 exact-match runtime files, 3 planning-authority files (DC-9), 5 manifest cross-check source roots."
  - "Exit codes 0/1/2/3 encode `pure-docs / runtime-facing / planning-authority / mixed` so downstream callers (workflow-step + CI backstop) can distinguish block reasons without re-parsing JSON."
  - "Mixed classification (exit 3) fires only when BOTH runtime-facing AND planning-authority are present; a set with runtime-facing + pure-docs still exits 1 because only runtime-facing is blocking (pure-docs does not elevate severity)."
  - "CI post-commit backstop is a SEPARATE job with `if: push && refs/heads/main` guard — PR events skip it (already gated by GATE-01); merge commits (parents >= 2) are exempt because they came through the gated PR path."
  - "Workflow-step gate placed at quick.md Step 2.5 (branching decision area) rather than Step 8 (final commit). Per-commit enforcement on executor-authored commits is out of scope for a prose workflow gate; the CI post-commit backstop is the structural enforcer for commits that bypass the workflow-step."
  - "Manifest cross-check implemented as static source-root allowlist (agents, commands, get-shit-done, .codex/skills, skills) rather than importing bin/install.js at runtime — install.js is 3354 lines and loading it for each classification would be load-bearing. Static list is copied from install.js's source-tree walk in install() (lines 2653-2700) and is maintained alongside it (CLAUDE.md dual-directory rule already enforces this parity)."
  - "Staged-files fallback (`git diff --name-only --cached`) used when --files omitted, matching plan contract; workflow-step's explicit file list path is the intended production invocation."
patterns-established:
  - "Per-gate fire-event: `::notice title=GATE-03::gate_fired=GATE-03 result=<pass|block|post_commit_block> classification=<...>` — emitted at 3 distinct points (workflow-step pass/block + CI backstop pass/post_commit_block/merge_exempt/no_files)."
  - "CLI exit-code-as-severity: 0=safe, 1/2=single-class block, 3=multi-class block; allows `[ $EXIT -ne 0 ]` shell pattern in workflow + CI to treat any non-zero as block."
duration: 5min
completed: 2026-04-20
---

# Phase 58 Plan 08: GATE-03 Direct-to-Main Classifier Summary

**Diff-based + manifest cross-check classifier now structurally blocks direct-to-main commits for runtime-facing and planning-authority files; quick.md workflow-step enforces at pre-commit; CI post-commit backstop catches any bypass.**

## Performance
- **Duration:** 5min
- **Tasks:** 2 / 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Created `get-shit-done/bin/lib/quick.cjs` exporting `classifyQuickFiles()` with 3-layer precedence (planning-authority → runtime-facing prefix/file/manifest → pure-docs fallback).
- Registered `gsd-tools quick classify [--files <path...>]` subcommand — exit 0 (pure-docs), 1 (runtime-facing), 2 (planning-authority), 3 (mixed).
- Wired quick.md Step 2.5 to invoke classifier before branching decision; blocks direct-to-main with a remediation hint (branch+PR flow).
- Added `post_commit_gate_03` CI job: on `push` + `refs/heads/main` only, classifies HEAD commit diff, exempts merge commits (parents >= 2 = came via PR), emits `gate_fired=GATE-03` fire-event notices.
- Verified all 6 test cases from Plan 58-08 Task 1 (pure-docs, runtime-facing, planning-authority, DC-8 `.codex/skills/*.md`, mixed runtime+pure, mixed runtime+planning) + staged-files fallback.
- Preserved all prior-phase CI steps (GATE-01 emission marker, GATE-02 merge-strategy conformance, GATE-13 dispatch-contract restatement) and `phase advance` subcommand.
- Signal `sig-2026-04-17-gsdr-quick-bypassed-then-backfilled` addressed: workflow bypass now fails the post-commit backstop.

## Task Commits

1. **Task 1: `quick classify` library + CLI subcommand** — `d0fbb4bc`
2. **Task 2: quick.md workflow gate + CI post-commit backstop** — `c77c81ab`

## Files Created/Modified

- `get-shit-done/bin/lib/quick.cjs` (created) — Classifier library exporting `classifyQuickFiles()` and `cmdQuickClassify()`; 11 runtime-facing prefixes + 4 exact files + 3 planning-authority files + 5 manifest cross-check source roots; exit-coded CLI handler.
- `get-shit-done/bin/gsd-tools.cjs` (modified) — Added `const quick = require('./lib/quick.cjs')`; registered `case 'quick':` with `classify` subcommand; appended `quick` to usage banner; preserved all existing routes including `phase advance`.
- `get-shit-done/workflows/quick.md` (modified) — Added GATE-03 block at Step 2.5 before branching logic; classifier runs on staged files (no-op when none); non-zero exit emits `gate_fired=GATE-03 result=block classification=<...>` notice + remediation hint + `exit 1`.
- `.github/workflows/ci.yml` (modified) — Added new top-level job `post_commit_gate_03` guarded to `push` + `refs/heads/main`; checks out with `fetch-depth: 2`; runs classifier on HEAD diff; emits `result=pass reason=merge_commit_from_pr` / `result=pass reason=no_files_changed` / `result=post_commit_block` / `result=pass` markers depending on branch path. Existing `test` job (GATE-01 + GATE-02 + GATE-13) preserved unchanged.

## Decisions & Deviations

**Decisions made during execution:**

- Classifier library uses static prefix/file lists rather than dynamic install.js traversal. This is the pragmatic manifest cross-check: install.js's source-tree walk (install() function, lines 2653-2700) copies `commands/gsd`, `get-shit-done/`, `agents/`, `.codex/skills/`, `skills/` — those roots are duplicated verbatim in `MANIFEST_SOURCE_ROOTS`. The CLAUDE.md dual-directory rule already requires these stay in sync; adding a runtime import of install.js would introduce a new 3354-line code-path for every classifier invocation.
- Mixed exit code (3) is triggered only when runtime-facing AND planning-authority both appear in the same staged set. A set with only runtime-facing + pure-docs exits 1 (runtime-facing) — pure-docs does not escalate severity, it's benign.
- Workflow-step gate placement at Step 2.5 (not Step 8) because Step 2.5 is the `branch_name`-decision moment; the CI post-commit backstop is the structural enforcer for commits that bypass the workflow entirely.

**Deviations from plan:**

None - plan executed as written. All 6 Task 1 test cases pass exactly as specified, both grep verifications pass (≥2 GATE-03 markers in ci.yml, ≥1 `quick classify` in quick.md), and prior-phase CI jobs + `phase advance` subcommand are preserved intact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09 and downstream waves can reference `gsd-tools quick classify` from any workflow or hook that needs direct-to-main classification.
- Plan 19 `gate_fire_events` extractor can pattern-match on `gate_fired=GATE-03 result=<...>` from CI logs (4 distinct result values: pass, post_commit_block, pass+reason=merge_commit_from_pr, pass+reason=no_files_changed).
- Per-gate Codex behavior row for GATE-03 in `58-05-codex-behavior-matrix.md` (`applies-via-workflow-step` on both runtimes) is now satisfied: quick.md's structural block is the workflow-step, and the CI post-commit backstop fires regardless of runtime.

## Self-Check: PASSED

- `get-shit-done/bin/lib/quick.cjs` — FOUND
- `get-shit-done/bin/gsd-tools.cjs` — FOUND (quick route + phase advance both present)
- `get-shit-done/workflows/quick.md` — FOUND (GATE-03 block at Step 2.5)
- `.github/workflows/ci.yml` — FOUND (post_commit_gate_03 job added; GATE-01/02/13 preserved, 9 `gate_fired=GATE-0[1-3]` markers total)
- `.planning/phases/58-structural-enforcement-gates/58-08-SUMMARY.md` — FOUND
- Commit `d0fbb4bc` (Task 1) — FOUND
- Commit `c77c81ab` (Task 2) — FOUND
- `phase advance` subcommand preserved at gsd-tools.cjs line 375 (Plan 58-06 provenance comment intact)
- Smoke test: `.codex/skills/gsdr-signal/SKILL.md` classifies as `runtime-facing` with `exit_code: 1` (DC-8 regression coverage confirmed)
- 629 tests pass (no regressions)

