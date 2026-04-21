---
phase: 58-structural-enforcement-gates
plan: 10
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: not_available
  generated_at: 2026-04-20T17:47:00Z
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: not_available
    profile: derived
    gsd_version: not_available
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: derived_from_harness
    platform: derived_from_harness
    vendor: derived_from_harness
    model: self_reported
    reasoning_effort: not_available
    profile: config
    gsd_version: not_available
    generated_at: writer_clock
    session_id: not_available
context_used_pct: 38
subsystem: structural-gates
tags: [handoff, antipatterns, GATE-04a, GATE-04b, GATE-04c, resume, staleness, severity-framework]
requires:
  - phase: 58-structural-enforcement-gates
    provides: resolveModelInternal + gsd-tools CLI host; `quick classify` and `phase advance` siblings; 58-CONTEXT.md DC-1..DC-9 framing
provides:
  - resolveHandoff library implementing GATE-04a (consumed-on-read archival) and GATE-04b (staleness hard-stop)
  - gsd-tools handoff resolve subcommand with exit-coded gate contract (0=loaded/archived, 3=hard_stop, 1=error)
  - Severity-tagged antipattern registry at get-shit-done/references/antipatterns.md (6 blocking + 1 advisory)
  - gsd-tools antipatterns check subcommand enforcing mandatory-understanding for blocking items (GATE-04c)
  - resume-project.md workflow wired to the structural gate (rm -f replaced)
  - Fire-event contract declared and emitted for GATE-04a/04b/04c
affects: [resume-project, pause-work, handoff, antipatterns, Phase 58-11, Phase 58-17]
tech-stack:
  added: [readline prompt for mandatory-understanding]
  patterns: [consumed-on-read archival, staleness predicate via triple-source check (mtime vs frontmatter vs mainline commit vs duplicate session_id), severity-tagged registry with typed-token gate]
key-files:
  created:
    - get-shit-done/bin/lib/handoff.cjs
    - get-shit-done/references/antipatterns.md
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/workflows/resume-project.md
key-decisions:
  - "Parse .continue-here and STATE.md frontmatter with a lightweight in-module flat-YAML extractor (extractFlatFrontmatter) rather than pulling frontmatter.cjs as a dependency -- handoff only needs top-level scalars (session_id, last_updated), and a local parser keeps the gate self-contained for emergency invocation even if the shared parser were broken"
  - "Staleness predicate is OR of three sources -- mtime vs STATE.last_updated, mtime vs last mainline commit touching STATE.md, and duplicate session_id already in STATE.md -- because any one is sufficient to prove the handoff is obsolete; the three sources cover respectively user edits, automated commits, and session_id reuse across resumes"
  - "Archive timestamp format 'YYYYMMDDT HHMMSS-{session_id}' UTC; idempotency suffix '-1', '-2', ... appended if an identical archive path already exists (extremely unlikely but cheap to guard)"
  - "Severity 'advisory' passes silently with a stderr warning; severity 'blocking' requires interactive typed-token OR --auto + --acknowledge-blocking <id>; unknown severity downgrades to advisory with a warning (forgiving default so registry additions do not break callers)"
  - "Exit codes kept distinct per gate family: 3 for GATE-04b hard_stop (matches plan contract), 4 for GATE-04c ack_required / typed-token mismatch (distinct from GATE-04b so callers can branch on which gate fired)"
  - "Registry parser is a line-oriented state machine rather than a YAML library dependency; entries are discovered by `- id: <value>` lead lines and fields flattened into flat objects; array-literal syntax `[a, b]` split into JS arrays"
patterns-established:
  - "Archive-instead-of-delete: working-path artifacts move to `.planning/handoff/archive/` on consumption; pattern applies beyond .continue-here to any consumed-on-read state"
  - "Triple-source staleness: authoritative update time is MAX(frontmatter last_updated, last_commit_touching_mtime, duplicate-id evidence); no single source is sufficient on its own"
  - "Severity-tagged enforcement: `blocking` / `advisory` frontmatter drives CLI behavior (prompt vs warn); `--auto` mode requires explicit ack flag to prevent silent bypass"
  - "Fire-event notices: `::notice::gate_fired=GATE-<id> result=<r> ...` on stdout is the canonical substrate marker consumed by Plan 19 extractors and operator-facing resume displays"
duration: 5min
completed: 2026-04-20
---

# Phase 58 Plan 10: Handoff Archive + Staleness + Antipattern Severity Summary

**Shipped three co-landed structural gates (GATE-04a/04b/04c) at the resume-handoff surface: consumed-on-read archival replaces `rm -f`, staleness hard-stop blocks obsolete handoff reuse, and severity-tagged antipattern registry enforces mandatory-understanding for blocking items.**

## Performance
- **Duration:** 5 min
- **Tasks:** 2 / 2
- **Files modified:** 4 (2 created, 2 edited)

## Accomplishments
- `get-shit-done/bin/lib/handoff.cjs` exports `resolveHandoff(options)`; implements GATE-04a (archive via `mv` to `.planning/handoff/archive/YYYYMMDDTHHMMSS-{session_id}.continue-here.md`) and GATE-04b (staleness predicate over mtime vs STATE.last_updated + last mainline commit + duplicate session_id).
- `get-shit-done/bin/lib/handoff.cjs` exports `checkAntipatterns(options)` and a line-oriented registry parser; enforces GATE-04c mandatory-understanding semantics (typed-token interactive OR `--acknowledge-blocking <id>` in `--auto`).
- `get-shit-done/bin/gsd-tools.cjs` router registers `handoff resolve` (exit 0/3/1) and `antipatterns check` (exit 0/4/1) subcommands alongside pre-existing `phase advance` (58-06) and `quick classify` (58-08) — all prior Phase 58 subcommands preserved.
- `get-shit-done/workflows/resume-project.md` replaces the `rm -f "$CONTINUE_HERE_PATH"` line with an exit-coded `handoff resolve` invocation, surfaces hard-stop reasons to the operator, and documents the archive path contract in the surrounding prose.
- `get-shit-done/references/antipatterns.md` seeds 6 blocking entries (stale-continue-here, squash-merge-default, direct-to-main-runtime, model-dispatch-drift, rm-partial-output, branch-protection-admin-bypass) and 1 advisory entry (advisory-workflow-prose — the meta-pattern the whole phase targets).

## Task Commits
1. **Task 1: handoff.cjs archive + staleness library + CLI wiring** — `631615b7`
2. **Task 2: antipattern severity registry + GATE-04c enforcement** — `f2266016`

## Files Created / Modified
- `get-shit-done/bin/lib/handoff.cjs` — new; ~520 lines; resolveHandoff, checkAntipatterns, CLI handlers, shared helpers (extractFlatFrontmatter, emitNotice, lastCommitTouchingStateEpoch).
- `get-shit-done/bin/gsd-tools.cjs` — edited; added `require('./lib/handoff.cjs')`, `handoff` case, `antipatterns` case, updated usage string. `phase advance` and `quick classify` cases preserved verbatim.
- `get-shit-done/workflows/resume-project.md` — edited; replaced `rm -f "$CONTINUE_HERE_PATH"` block with `handoff resolve` invocation block, hard-stop handler, and updated trailing prose describing archival semantics.
- `get-shit-done/references/antipatterns.md` — new; severity-tagged registry with frontmatter (doc_type: antipattern_registry, schema_version: v1), 7 entries, schema documentation, fire-event contract, and wiring guidance for future plans.

## Fire-event Declarations

All three gate markers confirmed emitted during verification:

```
::notice::gate_fired=GATE-04a result=archived path=<archive_path>
  — emitted from handoff.cjs:resolveHandoff after successful `mv` to archive
  — verified: /tmp/gsd-test-handoff synthetic case archived
    path=.planning/handoff/archive/20260420T174249-test-session-002.continue-here.md

::notice::gate_fired=GATE-04b result=hard_stop reason=<stale|newer_state|duplicate_session>
  — emitted from handoff.cjs:resolveHandoff before exit 3
  — verified: synthetic cases `reason=stale` (mtime=2000 vs STATE=now) and
    `reason=duplicate_session` (session_id grepped in STATE.md) both fire correctly

::notice::gate_fired=GATE-04c result=<pass|ack_required|block> pattern=<id>
  — emitted from handoff.cjs:checkAntipatterns per entry evaluated
  — verified: advisory entry emits result=pass pattern=ap-advisory-workflow-prose;
    blocking entry with --acknowledge-blocking emits result=pass (pass_acknowledged);
    blocking entry under --auto without ack emits result=ack_required with exit 4
```

## Verification Run

- `rm -f "$CONTINUE_HERE_PATH"` absent from resume-project.md: confirmed (grep hits = 0).
- `handoff resolve` wired in resume-project.md: confirmed (grep hits = 2 — invocation + failure-message).
- `handoff.cjs` exports archive + staleness: confirmed (`resolveHandoff` + fire-event markers = 9 code references).
- `antipatterns.md` ≥ 6 severity-tagged entries: confirmed (7 entries with `severity:` field, plus 1 schema example = 8 `severity:` matches).
- `gsd-tools antipatterns check` fails on unacked blocking in `--auto`: confirmed (exit 4 with `gate_fired=GATE-04c result=ack_required pattern=ap-stale-continue-here`).
- Full npm test suite: 645 passed / 0 failed / 4 todo (no regressions from this plan).

## Decisions & Deviations

### Auto-fixed Issues

None. Plan executed exactly as written; the spec was unusually complete on contract surfaces (exit codes, fire-event format, archive path shape, severity semantics, idempotency rule), so the executor work was implementation-mechanical rather than discovery-driven.

### Notable Implementation Choices (tracked as decisions in frontmatter, not deviations)

- Chose a local flat-YAML extractor over `require('./frontmatter.cjs')` for handoff frontmatter reading (rationale: gate self-containment for emergency use; top-level scalars are sufficient; avoids coupling resume-handoff failure mode to the heavier shared parser).
- Exit code 4 reserved for GATE-04c ack_required / block; kept distinct from GATE-04b's exit 3 so downstream callers can branch by which gate fired, not merely "did a gate fire."
- Anti-pattern registry parser is line-oriented (no YAML library dep). Trade-off accepted: entries must use the `- id:` lead-line convention and flat-scalar values; this matches the documented schema and keeps the runtime dependency-free.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness

- GATE-04a, GATE-04b, GATE-04c are live in the CLI substrate. Downstream plans can register `antipatterns check` calls at workflow preconditions (pause-work, plan-phase, execute-phase) without rediscovering the substrate; wiring each is ad-hoc per-workflow work, not in this plan's scope.
- Plan 58-11 CI grep enforcement (gate_fire_events extractor, Plan 19) will find the GATE-04a/04b/04c markers exactly once each in handoff.cjs source and can assert presence structurally.
- `.planning/handoff/archive/` is expected to accumulate evidence across sessions; no retention policy shipped in this plan -- subsequent observation can inform whether sweep tooling is warranted.
- Signals `sig-2026-02-16-stale-continue-here-files-not-cleaned` and `sig-2026-02-17-continue-here-not-deleted-after-resume` are now covered by structural substrate; their lifecycle can move from `triaged` to `remediated` once Plan 58-17 verifier confirms the resume workflow exercises the gate end-to-end.

## Self-Check: PASSED

Verified artifacts:
- FOUND: get-shit-done/bin/lib/handoff.cjs
- FOUND: get-shit-done/references/antipatterns.md
- FOUND: get-shit-done/bin/gsd-tools.cjs
- FOUND: get-shit-done/workflows/resume-project.md
- FOUND: .planning/phases/58-structural-enforcement-gates/58-10-SUMMARY.md

Verified commits:
- FOUND: 631615b7 (Task 1 — handoff resolver + GATE-04a/04b)
- FOUND: f2266016 (Task 2 — antipattern registry seed)
