---
phase: 58-structural-enforcement-gates
plan: 14
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-20T18:14:41Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: not_available
    profile: exposed
    gsd_version: exposed
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
    gsd_version: config
    generated_at: writer_clock
    session_id: not_available
subsystem: structural-gates
tags: [gate-12, archive, evidence-preservation, agent-dispatch, filesystem]
requires:
  - phase: 58-05
    provides: Codex behavior matrix — declares GATE-12 `applies` on both runtimes (filesystem mv is runtime-neutral)
  - phase: 58-10
    provides: Archive-rather-than-rm precedent + `::notice::` fire-event style (GATE-04a `.continue-here` archival)
  - phase: 58-12
    provides: GATE-05 echo_delegation macro + GATE-13 DISPATCH CONTRACT blocks in execute-plan / research-phase / plan-phase workflows (preserved intact)
  - phase: 58-13
    provides: CLI subcommand registration pattern (phase reconcile router case) reused for agent archive
provides:
  - get-shit-done/bin/lib/archive.cjs exporting archiveAgentOutput(opts) for programmatic callers
  - gsd-tools agent archive subcommand (CLI) with --session-id / --reason / --phase / --dry-run / --metadata / --paths flags
  - GATE-12 fire-event declaration on every invocation
  - GATE-12 HEADNOTE + envelope template in execute-plan.md, research-phase.md, plan-phase.md (convention enforcement for future edits)
affects: [phase-58-structural-enforcement, evidence-preservation, agent-dispatch-workflows]
tech-stack:
  added: []
  patterns:
    - "Archive primitive + CLI + workflow envelope (mirrors GATE-04a handoff archival; cross-filesystem-safe mv via renameSync with EXDEV copy+unlink fallback)"
    - "Gate HEADNOTE convention — markdown comment at workflow HEAD carrying envelope template, referenced by Plan 17 verifier greps"
    - "Fire-event marker `::notice title=GATE-NN::gate_fired=GATE-NN result=<outcome> ...` on every invocation (aligned with GATE-10/11 style — emits on all code paths, not only success)"
key-files:
  created:
    - "get-shit-done/bin/lib/archive.cjs"
    - ".planning/phases/58-structural-enforcement-gates/58-14-SUMMARY.md"
  modified:
    - "get-shit-done/bin/gsd-tools.cjs (added `const archive = require('./lib/archive.cjs')` + `case 'agent':` router; usage string extended with `agent` command — all prior subcommands preserved: phase advance, phase reconcile, quick classify, handoff, antipatterns)"
    - "get-shit-done/workflows/execute-plan.md (GATE-12 HEADNOTE + envelope template prepended before <purpose>)"
    - "get-shit-done/workflows/research-phase.md (GATE-12 HEADNOTE + envelope template prepended before <purpose>)"
    - "get-shit-done/workflows/plan-phase.md (GATE-12 HEADNOTE + envelope template appended alongside prior text_mode HEADNOTE; both preserved)"
key-decisions:
  - "Archive-root resolution: prefer `.planning/phases/<N>-*/.archive/` when --phase supplied; fallback `.planning/archive/`. Evidence lives next to the phase that produced it when possible; root fallback keeps the primitive usable outside phase contexts."
  - "Cross-filesystem-safe move via `fs.renameSync` with EXDEV fallback to `fs.cpSync` + `fs.rmSync` / `fs.copyFileSync` + `fs.unlinkSync`. Avoids silent data loss when `.planning/` and a source path live on different mounts (observed on workstations with `/scratch` on SSD and `/home` on NVMe)."
  - "Missing paths are recorded in `missing[]` and NOT treated as errors — paths may have been deleted before archive was invoked. Errors (exit 2) are reserved for actual move failures."
  - "No `.meta.json` is written unless the caller explicitly passes `--metadata <json>`. Keeps archive directories transparent by default (cp/ls-friendly); callers that need provenance annotation opt in."
  - "Per-gate Codex behavior: `applies` on both runtimes per `58-05-codex-behavior-matrix.md` — filesystem `mv` is runtime-neutral. No runtime-specific branching needed."
  - "No current `rm` or overwrite sites exist in execute-plan.md / research-phase.md / plan-phase.md. Plan explicitly anticipated this outcome; this plan ships the primitive + CLI + HEADNOTE envelopes. Any future wrapping of new dispatch logic becomes a simple find-and-wrap task following the HEADNOTE template."
  - "Fire-event format follows GATE-10/GATE-11 style: `::notice title=GATE-12::...` (with title= clause) for consistency with reconcile.cjs and Plan 19 extractor contract."
patterns-established:
  - "Deviation-free mechanical rollout: scan for `rm`/overwrite sites → wrap with archive primitive → add HEADNOTE at file HEAD. Plan 17 verifier enforces HEADNOTE presence via grep."
  - "Exit-code disjointness preserved across Phase 58 gates: GATE-12 uses 2 (partial move failure); stays disjoint from GATE-01 (1/2/3/4), GATE-04c (4), GATE-10 (5)."
duration: 4min
completed: 2026-04-20
---

# Phase 58 Plan 14: GATE-12 Archive Partial Output Summary

**Ships GATE-12 as a named structural substrate: `archive.cjs` library + `gsd-tools agent archive` CLI + HEADNOTE envelopes in the three dispatch workflows, so failed or interrupted agent output is moved to timestamped archive directories rather than deleted — preserving the debugging evidence that `rm`-based redispatch was destroying.**

## Performance

- **Duration:** 4 min
- **Tasks:** 2 / 2
- **Files created:** 2 (archive.cjs + SUMMARY)
- **Files modified:** 4 (gsd-tools.cjs + 3 workflows)
- **Fire-event declared:** `::notice title=GATE-12::gate_fired=GATE-12 result=archived path=<archive_dir> reason=<reason>`

## Accomplishments

1. **Archive primitive** (`get-shit-done/bin/lib/archive.cjs`):
   - Exports `archiveAgentOutput({ sessionId, reason, paths, phaseNumber, dryRun, metadata, cwd, now })`.
   - Phase-scoped archive root resolution with root fallback.
   - Cross-filesystem-safe move (renameSync + EXDEV fallback).
   - Missing paths recorded (not errored).
   - Optional `.meta.json` sidecar on explicit caller opt-in.
   - Emits GATE-12 fire-event on every invocation.

2. **CLI subcommand** (`gsd-tools agent archive`):
   - Flags: `--session-id`, `--reason`, `--phase`, `--dry-run`, `--metadata <json>`, `--paths <p>...`.
   - Exit codes: 0 success, 2 partial move failure, 1 usage error.
   - JSON output to stdout: `{ archive_dir, archived[], missing[], errors[], dry_run }`.

3. **Workflow HEADNOTEs** (execute-plan / research-phase / plan-phase):
   - GATE-12 HEADNOTE at file HEAD with envelope template for future edits.
   - No current `rm` or overwrite of agent output paths exists in any of the three files — HEADNOTE is the enforcement mechanism for future dispatch logic.
   - Plan 17 verifier will grep `GATE-12` and `agent archive` markers — each file has 4 hits.

## Task Commits

1. **Task 1: Build archive.cjs + register `agent archive` subcommand** — `339f8839`
2. **Task 2: Wire GATE-12 HEADNOTEs into dispatch workflows** — `fe19aee4`

## Files Created/Modified

**Created:**

- `get-shit-done/bin/lib/archive.cjs` — archive primitive + CLI entry. 264 lines. No new dependencies.
- `.planning/phases/58-structural-enforcement-gates/58-14-SUMMARY.md` — this file.

**Modified:**

- `get-shit-done/bin/gsd-tools.cjs` — added `const archive = require('./lib/archive.cjs')` (line 60); added `case 'agent':` router block (lines 785-798) with `archive` subcommand; extended usage string to include `agent`. All prior subcommands preserved: `phase advance`, `phase reconcile`, `quick classify`, `handoff resolve`, `antipatterns check`.
- `get-shit-done/workflows/execute-plan.md` — prepended GATE-12 HEADNOTE with envelope template before `<purpose>`. 20 lines added. All prior content intact (init_context, checkpoint_protocol, task_commit, Pattern A/B/C dispatch, etc.).
- `get-shit-done/workflows/research-phase.md` — prepended GATE-12 HEADNOTE with envelope template before `<purpose>`. 20 lines added. All prior Plan 12 content intact (GATE-05 echo_delegation macro, GATE-13 DISPATCH CONTRACT block, BAKED IN comment).
- `get-shit-done/workflows/plan-phase.md` — appended GATE-12 HEADNOTE with envelope template after the prior `text_mode` HEADNOTE (Plan 11 GATE-08d). 22 lines added. All prior content preserved: GATE-05 echo_delegation macros (3 spawn points: researcher / planner / checker), GATE-13 DISPATCH CONTRACT blocks, BAKED IN comments, revision loop, spike decision point.

## Decisions & Deviations

**Key decisions:**

- Archive root: phase-scoped (`.planning/phases/<N>-*/.archive/`) preferred; `.planning/archive/` root fallback when `--phase` absent or phase directory not found. Evidence clusters next to the phase that produced it.
- Cross-filesystem safety: `fs.renameSync` with EXDEV → `fs.cpSync` + `fs.rmSync` fallback (directories) or `fs.copyFileSync` + `fs.unlinkSync` (files). Tested interactively during Task 1 verify.
- Missing paths are not errors (exit 0 with `missing[]` populated); move failures are exit 2. Disjoint from GATE-01 (1/2/3/4), GATE-04c (4), GATE-10 (5).
- Metadata sidecar (`.meta.json`) is opt-in only via `--metadata <json>`. Archive directories stay transparent by default.

**Deviations from Plan:**

### Auto-fixed Issues

**1. [Rule 1 - Bug] Block-comment `*/` sequence in JSDoc prematurely closed a comment**

- **Found during:** Task 1 verification (first test invocation failed with `SyntaxError: Unexpected token '.'` at archive.cjs:74)
- **Issue:** A JSDoc line read `return `.planning/phases/<N>-*/.archive/`.` — the literal `*/` inside the block comment closed the comment early, leaving the rest of the line as invalid JavaScript.
- **Fix:** Rewrote the two affected lines to use `<N>-<slug>` placeholder tokens instead of a glob with `*`, avoiding the `*/` sequence entirely. Documentation meaning preserved.
- **Files modified:** `get-shit-done/bin/lib/archive.cjs` (lines 73-74)
- **Verification:** `node -e "require(...)"` returns `syntax ok`; CLI invocation then completed successfully with expected output.
- **Commit:** Folded into Task 1 commit `339f8839` (pre-commit fix).

**Total deviations:** 1 auto-fixed (Rule 1 bug). **Impact:** Zero behavioral — documentation-only fix made during the task; final commit includes the corrected text.

## Authentication Gates

None — this plan does no network work.

## User Setup Required

None — no external service configuration required.

## Signal Resolution

**Resolved:** `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving` (2 occurrences).

**Root cause addressed:** orchestrator workflows previously had no evidence-preservation step between failed output and redispatch. GATE-12 primitive + CLI + HEADNOTE envelope now provide the canonical path. Three workflows that could plausibly have added destructive rewrite logic (execute-plan, research-phase, plan-phase) carry the HEADNOTE template so any future redispatch edit has a fill-in-the-blank envelope to wrap the destructive operation.

**Important qualifier:** no `rm` or overwrite-of-agent-output sites exist in those three files today (confirmed via `grep -n "rm -f .*SUMMARY\|rm -f .*RESEARCH\|rm -f .*PLAN"` returning zero hits). This is explicit plan-anticipated outcome, not verifier failure. Plan 17 checks HEADNOTE presence rather than wrapper-count.

## Per-Gate Codex Behavior

GATE-12: `applies` on both runtimes per `58-05-codex-behavior-matrix.md`. Filesystem `mv` is runtime-neutral; fire-event `::notice::` marker is runtime-neutral; CLI is runtime-neutral. No runtime-specific branching.

## Next Phase Readiness

- GATE-12 structurally available as a named substrate (primitive + CLI + fire-event + convention marker).
- Ready for Plan 15 (GATE-11 run-spike cadence warning — independent of GATE-12).
- Plan 17 verifier can query:
  - `gsd-tools agent archive --dry-run --session-id ci --reason ci_check --paths <nonexistent>` (should emit fire-event, exit 0, empty `archived`/`missing` both).
  - `grep -c "GATE-12\|agent archive" get-shit-done/workflows/{execute-plan,research-phase,plan-phase}.md` (should be ≥ 1 per file; currently 4 per file).
  - `grep -n "rm -f .*SUMMARY\|rm -f .*RESEARCH\|rm -f .*PLAN" get-shit-done/workflows/{execute-plan,research-phase,plan-phase}.md` (should be 0).
- Plan 19 gate_fire_events extractor can count GATE-12 invocations by regex `::notice title=GATE-12::gate_fired=GATE-12` in CI logs and stored stdout.

## Self-Check: PASSED

- [x] All 6 declared files exist on disk (`archive.cjs`, modified `gsd-tools.cjs`, 3 workflows, this SUMMARY).
- [x] Both task commits present in git log (`339f8839` Task 1, `fe19aee4` Task 2).
- [x] CLI smoke-test green: `gsd-tools agent archive --dry-run` emits fire-event, returns JSON with `dry_run: true` and empty `errors[]`, exits 0.
