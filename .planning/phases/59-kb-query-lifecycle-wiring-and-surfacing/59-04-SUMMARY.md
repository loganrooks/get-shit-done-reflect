---
phase: 59-kb-query-lifecycle-wiring-and-surfacing
plan: "04"
signature:
  role: executor
  harness: claude-code
  platform: claude-code-cli
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.7+dev
  generated_at: "2026-04-21T04:55:30Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived_from_harness
    vendor: derived_from_harness
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
    model: runtime_env
    reasoning_effort: claude_not_exposed
    profile: config
    gsd_version: installed_harness
    generated_at: writer_clock
    session_id: claude_not_exposed
context_used_pct: 60
subsystem: knowledge-base
tags: [kb, kb-transition, kb-link, lifecycle, dual-write, BEGIN-IMMEDIATE, deprecation, KB-06b, KB-07, phase-59]
requires:
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "01"
    provides: "extractLinks guard; idx_signal_links_target; signals.title/body + signal_links.created_at/source_content_hash columns; schema v3 clean substrate"
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "02"
    provides: "router stubs for kb link create/delete (Plan 04 slot); cmdKbLinkShow pattern; kb.cjs helper re-exports (getKbDir/getDbPath/getDbSync/discoverSignalFiles)"
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "03"
    provides: "kb health Check 2 (lifecycle_vs_plan) — the regression gate that proves this plan's wiring works; drift_count == 0 on fixture after wiring runs"
  - phase: 34-signal-lifecycle-reconciliation
    provides: "originally-scoped bash reconcile-signal-lifecycle.sh that this plan deprecates with one-cycle sunset (Pitfall 2: sed -i '' is BSD-only, silently broken on Linux)"
  - phase: 58.1-codex-update-distribution-parity
    provides: "DC-4 cross-runtime parity invariant — kb-transition.cjs ships to both .claude and .codex runtimes via bin/install.js copyWithPathReplacement with no installer edit"
provides:
  - "cmdKbTransition(cwd, signalId, newState, options, raw): BEGIN IMMEDIATE dual-write with .bak sidecar rollback; assertLegalTransition helper honors strict/flexible/minimal strictness per knowledge-store.md:213-225"
  - "cmdKbLinkCreate / cmdKbLinkDelete: source-side-only writes with frozen-field guard on qualified_by/superseded_by (requires --force); dual-write atomic with created_at + source_content_hash provenance columns populated on INSERT"
  - "Router dispatch for kb transition and real kb link create/delete verbs; Plan 02 stubs replaced"
  - "collect-signals.md reconcile_signal_lifecycle step: walks completed plans (PLAN.md + SUMMARY.md pair), extracts resolves_signals via `gsd-tools frontmatter get --raw`, invokes `kb transition <sig> remediated --resolved-by-plan <plan>` per id; idempotent"
  - "reconcile-signal-lifecycle.sh: DEPRECATED banner with v1.20->v1.21 sunset; Linux guard exits 2 on GNU sed with migration instructions instead of silently no-op'ing"
  - "execute-phase.md reconcile_signal_lifecycle step: rewritten to explicitly NOT invoke the deprecated bash path; lifecycle flow cited as collect-signals->kb transition"
  - "Integration regression: 5-test end-to-end covering file+SQL dual-write atomicity, idempotency, noop path, kb health Check 2 green-transition, and Linux bash guard"
affects:
  - "Phase 59 Plan 05 (KB-08 knowledge-surfacing rewrite) — the kb transition verb is now a first-class write surface to reference in the surfacing protocol"
  - "Phase 60 (sensor pipeline) — lifecycle transitions on sensor-detected signals flow through this verb; signal_links INSERT provenance captures who wrote what and when"
  - "v1.21 — the bash reconcile script will be removed; the Linux guard already surfaces the deprecation so no silent breakage"
  - "Retrospective cleanup of 31 live-corpus lifecycle drifts (deliberately NOT applied in this plan — see Decisions below)"
tech-stack:
  added: []
  patterns:
    - "BEGIN IMMEDIATE + .bak sidecar dual-write: copy file to .bak BEFORE any write, transact file-write->SQL-update->COMMIT, on any throw ROLLBACK SQL and restore from .bak. Idempotent cleanup of .bak on success."
    - "Idempotent state machine: if current state == target state, return {noop: true} with exit 0; prevents duplicate lifecycle_log entries when the same wiring runs twice."
    - "Frozen-field guard at the verb level: qualified_by/superseded_by can only be mutated with --force because knowledge-store.md §10 declares them frozen post-publication."
    - "Deprecation with runtime guard: bash script keeps the deprecation banner AND a uname-based Linux guard that exits non-zero with migration instructions. No silent no-op."
key-files:
  created:
    - "get-shit-done/bin/lib/kb-transition.cjs (~280 lines) — cmdKbTransition + assertLegalTransition + parseKbTransitionOptions + findSignalFile + ensureLifecycleLogColumn; __testOnly_* exports for direct invocation"
    - "tests/unit/kb-transition.test.js (~260 lines, 12 test cases) — valid transitions, strict-mode rejection, terminal-state refusal, error surfaces, assertLegalTransition table verification"
    - "tests/unit/kb-link-write.test.js (~280 lines, 12 test cases) — create/delete for related_to, frozen-field guard for qualified_by, source-file-only invariant, idempotency, dry-run, applyLinkCreate/Delete helper tests"
    - "tests/integration/kb-lifecycle-wiring.test.js (~250 lines, 5 test cases) — full closed-loop regression: plan complete -> collect-signals reconcile step -> kb transition -> assert file + SQL match; kb health Check 2 flip from FAIL to PASS; Linux bash guard"
  modified:
    - "get-shit-done/bin/lib/kb-link.cjs (+~220 lines) — cmdKbLinkCreate, cmdKbLinkDelete, applyLinkCreate/Delete, cmdKbLinkWrite, parseKbLinkWriteOptions, sourceContentHash, findSignalFile; stubWriteVerb retained as back-compat shim"
    - "get-shit-done/bin/gsd-tools.cjs (+~24 lines) — imported kb-transition.cjs; wired kb link create/delete to real verbs; added kb transition dispatch; extended usage string to include transition"
    - "get-shit-done/workflows/collect-signals.md (+~70 lines) — added reconcile_signal_lifecycle step invoking kb transition per completed plan's resolves_signals"
    - "get-shit-done/workflows/execute-phase.md (+13 -7 lines) — rewrote reconcile_signal_lifecycle step to document the new flow and explicitly NOT invoke the deprecated bash path"
    - "get-shit-done/bin/reconcile-signal-lifecycle.sh (+33 lines) — DEPRECATED banner + one-cycle sunset notice + Linux guard exiting 2 with migration instructions"
    - "tests/unit/kb-link.test.js (replaced 2 Plan 02 stub tests with real-verb dispatch assertions)"
key-decisions:
  - "detected->remediated is in the flexible-mode legal table (not just a minimal-mode escape). Knowledge-store.md:237 names this 'fix without formal triage' as explicitly allowed under flexible strictness; the state table now includes it as a canonical transition with strict-mode rejection preserved for 'must triage first' enforcement."
  - "Frozen-field guard requires --force on kb link create AND kb link delete for qualified_by/superseded_by. Research and plan both called for --force on create; I extended it to delete too because deleting a frozen edge is equally a spec violation. The symmetry is legible; if a future plan needs asymmetric handling, it can relax one side."
  - "stubWriteVerb retained as back-compat shim rather than removed. Phase 59 Plan 02 exported it; downstream callers may still import it. It now emits a 'router should dispatch to real verb' error rather than being silently deleted. One-release deprecation mirrors the bash script's sunset pattern."
  - "lifecycle_log column added via ensureColumn on first kb transition invocation rather than bumping schema v3 -> v4. The column is an additive TEXT DEFAULT '', so idempotent ALTER TABLE suffices. Avoids a full migration cycle for a single column."
  - "31 live-corpus lifecycle drifts from historical phases are NOT retroactively remediated in this plan. Rationale: the wiring exists and is proven via integration test, but applying a blanket remediated transition to 31 signals from phases 57.4 through 58 would assert 'these signals were remediated by those plans' without verifying each signal's current state warrants it. This is a separate operator-judgment call (similar to Plan 01's deliberate separation of the live repair commit from the code change). `kb health` Check 2 continues to FAIL on the live corpus with drift_count=31 and will stay that way until a dedicated retroactive cleanup pass runs."
  - "No installer edits. kb-transition.cjs and the extended kb-link.cjs inherit Codex parity via bin/install.js copyWithPathReplacement per Phase 58.1 DC-4. Verified: `.claude/get-shit-done-reflect/bin/lib/kb-transition.cjs` sha256 matches source post-install."
patterns-established:
  - "BEGIN IMMEDIATE + .bak sidecar rollback: the canonical dual-write idiom for every mutating kb verb. kb transition, kb link create, and kb link delete all follow the same shape; future write verbs (kb stats update, kb repair, etc.) should reuse it."
  - "Idempotent verbs with explicit noop=true JSON field: callers (especially workflow scripts) can check result.noop to distinguish 'nothing to do' from 'did something' without re-parsing state."
  - "Deprecation with Linux-guard exit: for cross-platform bash scripts, add a `uname -s` guard that exits non-zero with migration instructions on the broken platform, rather than relying on `set -euo pipefail` to catch per-command failures that may happen inside swallowed-error pipelines."
duration: 13min
completed: 2026-04-21
---

# Phase 59 Plan 04: KB Transition + KB Link Write + Lifecycle Wiring Summary

**Shipped the write half of the Phase 59 verb surface (`kb transition` and real `kb link create`/`delete`), closed the v1.16 KB-07 lifecycle wiring gap by wiring `kb transition` into the collect-signals workflow for completed plans' `resolves_signals`, and deprecated the broken-on-Linux `reconcile-signal-lifecycle.sh` with a Linux guard and one-cycle sunset.**

## Performance

- **Duration:** 13min
- **Tasks:** 2 of 2 completed (both `type="auto"`, no checkpoints hit, no Rule 4 asks)
- **Files created:** 4 (1 lib + 3 test files)
- **Files modified:** 5 (1 lib extended, 1 router, 2 workflows, 1 bash script)
- **Tests added:** 29 (12 kb-transition + 12 kb-link-write + 5 integration)
- **Regression cost:** 0 — full `npm test` suite 756 passed, 0 failed, 4 todo (up from 727)

## Accomplishments

- **`kb transition` is live with the full dual-write contract.** BEGIN IMMEDIATE transaction wraps the file-write (via `spliceFrontmatter`) and the `UPDATE signals SET lifecycle_state=?, updated=?, lifecycle_log=? WHERE id=?`. Before any write, the signal .md is copied to `<file>.bak`; on any throw inside the try block, SQL rolls back and the file is restored from .bak, then .bak is unlinked. On success, COMMIT fires and .bak is unlinked. `lifecycle_log` is JSON-serialized on the SQL side; an `ensureColumn` check adds the TEXT column on first invocation so the plan does not require a schema v4 bump.
- **`assertLegalTransition` enforces the state machine table.** Canonical transitions from `knowledge-store.md:213-225` encoded directly: `detected -> triaged|blocked|invalidated|remediated`, `triaged -> {blocked|remediated|invalidated|detected-regression}`, `blocked -> {triaged|remediated|invalidated}`, `remediated -> {verified|detected-regression|invalidated}`, `verified -> {detected-regression|invalidated}`, `invalidated -> ()` (terminal). Strictness gating: `strict` rejects `detected->remediated|verified` and `triaged->verified`; `flexible` (default) allows detected->remediated (the "fix without formal triage" path per knowledge-store.md:237); `minimal` allows anything. Any state can always transition to `invalidated` under every strictness.
- **`kb link create` / `kb link delete` are source-side-only, atomic, provenance-populated.** For `related_to`, the source file's `fm.related_signals[]` is mutated; `recurrence_of` is a scalar overwrite; `qualified_by`/`superseded_by` are frozen and require `--force` per knowledge-store.md §10. Every INSERT populates `signal_links.created_at` (ISO-8601) and `signal_links.source_content_hash` (sha256 of post-splice body) for the Plan 01 edge-provenance minimum. Target file is NEVER touched — verified by reading byte-identical target content before and after in the unit test.
- **collect-signals workflow now owns lifecycle reconciliation.** A new `reconcile_signal_lifecycle` step walks each `-PLAN.md` in the phase directory whose matching `-SUMMARY.md` exists, extracts `resolves_signals` via `gsd-tools frontmatter get --raw`, and invokes `gsd-tools kb transition <sig> remediated --reason "completed by <plan>" --resolved-by-plan <plan>` per id. Idempotent: `kb transition` returns `noop: true` when the signal is already in `remediated`, so re-running the wiring does NOT duplicate `lifecycle_log` entries. This closes `sig-2026-03-04-signal-lifecycle-representation-gap` (KB-07), open since Phase 34.
- **`reconcile-signal-lifecycle.sh` is deprecated, not removed.** Added a `DEPRECATED` banner with v1.20 -> v1.21 sunset notice and a Linux guard that checks `uname -s` and exits 2 with the message `Replacement: gsd-tools kb transition ...` plus a pointer to the collect-signals workflow. On macOS the script still runs (BSD sed works); on Linux it now loudly surfaces the deprecation instead of silently no-op'ing as it did in v1.16-v1.19 — which is the audit §3.7 "silent-fail is worse than loud-fail" rule operationalized.
- **`execute-phase.md` routes lifecycle through collect-signals.** The previous reconcile_signal_lifecycle step's active invocation of the bash script is replaced with a documentation block explaining that lifecycle reconciliation now flows through the `auto_collect_signals` step's collect-signals workflow. The bash script is explicitly called out as NOT invoked in v1.20.
- **Integration test proves the closed loop end-to-end.** A fixture phase directory with one PLAN.md + SUMMARY.md + signal file seeds the state; the test invokes the wiring mirror (`gsd-tools frontmatter get` + per-id `kb transition`), then asserts: (i) signal .md frontmatter shows `lifecycle_state: remediated`; (ii) SQL signals row matches; (iii) lifecycle_log has one structured entry with `event: remediated`, `from: triaged`, `resolved_by_plan: 59-04-PLAN.md`; (iv) re-running is idempotent (log length stays at 1); (v) alternate path (already remediated before wiring) is a noop; (vi) **kb health Check 2 flips from FAIL to PASS** after the wiring runs; (vii) Linux bash guard exits 2 with migration guidance.
- **Codex parity inherited automatically.** `bin/install.js --local` copies `kb-transition.cjs`, the extended `kb-link.cjs`, the updated workflows, and the deprecated bash script to `.claude/get-shit-done-reflect/bin/` with byte-identical content (sha256 verified). Codex users inherit the same surface on next `gsdr-update` via the Phase 58.1 DC-4 invariant.

## Task Commits

1. **Task 1: Implement kb transition + kb link create/delete with BEGIN IMMEDIATE dual-write + assertLegalTransition** — `5197366a`
2. **Task 2: Wire collect-signals auto-transition + deprecate reconcile-signal-lifecycle.sh + update execute-phase + integration regression** — `cbcb1086`

## Files Created/Modified

### Created

- `get-shit-done/bin/lib/kb-transition.cjs` — 280 lines. Exports `cmdKbTransition`, `parseKbTransitionOptions`, plus `__testOnly_assertLegalTransition` and `__testOnly_findSignalFile`. Full dual-write contract with .bak sidecar rollback.
- `tests/unit/kb-transition.test.js` — 12 tests across 5 describe blocks: valid transitions (4), strict-mode rejection (3), error surfaces (3), assertLegalTransition table verification (1), rollback shape (1).
- `tests/unit/kb-link-write.test.js` — 12 tests across 5 describe blocks: create related_to (4), frozen-field guard (2), delete (2), error surfaces (3), applyLinkCreate/Delete helper test (1).
- `tests/integration/kb-lifecycle-wiring.test.js` — 5 tests: closed-loop regression, idempotency, already-remediated noop, kb health Check 2 green-transition, Linux bash guard.

### Modified

- `get-shit-done/bin/lib/kb-link.cjs` — +~220 lines. New functions: `parseKbLinkWriteOptions`, `findSignalFile`, `sourceContentHash`, `applyLinkCreate`, `applyLinkDelete`, `cmdKbLinkCreate`, `cmdKbLinkDelete`, `cmdKbLinkWrite`. `stubWriteVerb` retained as back-compat shim. Module docstring rewritten to describe both read and write halves.
- `get-shit-done/bin/gsd-tools.cjs` — +24 lines. Required `kb-transition.cjs`; replaced Plan 02 stub with real dispatch for `kb link create|delete` (parsing `srcId`, `tgtId`, and `--type` flags); added new `kb transition` subverb dispatch; extended the error-usage string to include `transition`.
- `get-shit-done/workflows/collect-signals.md` — +70 lines. New `<step name="reconcile_signal_lifecycle">` block after `<step name="rebuild_index">`. Reads `resolves_signals` from each completed plan's frontmatter and invokes `kb transition` per id.
- `get-shit-done/workflows/execute-phase.md` — +13 / −7 lines. Rewrote `<step name="reconcile_signal_lifecycle">` to document the v1.20 flow and the v1.21 sunset.
- `get-shit-done/bin/reconcile-signal-lifecycle.sh` — +33 lines. Deprecation banner after the shebang (explains BSD-sed incompatibility, cites replacement verb and workflow, states one-cycle sunset). Linux guard (`if [ "$(uname -s)" = "Linux" ]`) exits 2 with migration instructions.
- `tests/unit/kb-link.test.js` — 2 Plan 02 stub-test cases replaced with real-dispatch assertions (the stub is now absent; the router routes directly to `cmdKbLinkCreate/Delete`).

## Decisions & Deviations

### Key decisions

See `key-decisions` in frontmatter. Highlights:

- **detected->remediated is canonical under flexible strictness** (per knowledge-store.md:237, not an exception path).
- **--force gates both create AND delete** for frozen link types (symmetry).
- **stubWriteVerb retained** as back-compat shim with a new error message rather than removed; one-release deprecation.
- **lifecycle_log via ensureColumn** on first kb transition call rather than schema v4 bump.
- **31 live-corpus lifecycle drifts NOT retroactively remediated** in this plan. The wiring exists and the integration test proves it works; applying a blanket remediated transition to 31 historical signals would assert they were actually remediated by past plans without inspecting each signal's current state. This is a separate operator-judgment cleanup pass.
- **No installer edits.** Codex parity inherits via Phase 58.1 DC-4.

### Deviations from plan

**None of the Rule 1/2/3 auto-fix variety.** The plan implemented cleanly. Two small test-authoring corrections during development:

1. **`applyLinkDelete` absence-check bug** caught by the initial `applyLinkCreate / applyLinkDelete return {fm, changed}` helper test: when fm.related_signals is absent entirely, my first implementation still created an empty array and flagged changed=true. Rule 1 auto-fix applied in-task — the delete path now explicitly returns `{changed: false}` when the target field is absent OR when the filter leaves the array unchanged. KB consulted, no prior entries found on this specific failure mode.
2. **Plan 02 stub tests regressed** by Task 1. The Plan 02 test file `tests/unit/kb-link.test.js` had two cases asserting `kb link create` / `kb link delete` emit a "Plan 04" deferral error. Task 1 replaced the stub with real verbs, so those tests became obsolete. Rule 1 auto-fix applied: rewrote the two cases to assert real-verb dispatch (the "missing source signal" error confirms the router landed on `cmdKbLinkCreate/Delete`, not the stub). Test logic intent preserved (validating the router dispatches to the Plan 04 surface), just updated to the new contract.

No Rule 4 architectural asks triggered.

### Live-corpus Check 2 status (documented non-closure)

Plan's success criterion says "`kb health` lifecycle drift check goes GREEN on live corpus after this plan **(or confirms why not)**." `kb health` on the live corpus still reports Check 2 FAIL with 31 drifts distributed across Phase 57.4 through 58 plans. The wiring proves correct on fixture (integration test); applying it retroactively to 31 live signals would create 31 `remediated` transitions with reason "completed by <historical plan>" without the file/signal state verification each transition implies. That is a separate, deliberate operator-judgment pass (similar to Plan 01's live-corpus repair commit being kept separate from the code change). The plan thus satisfies the success criterion via the "or confirms why not" clause.

## User Setup Required

None — no external service configuration required. All changes are in-tree code + workflow edits + an in-tree bash script banner. The `lifecycle_log` column is added idempotently via `ensureColumn` on first `kb transition` invocation; no explicit migration step.

## Next Phase Readiness

Wave 3 (this plan) is complete. Plan 05 (KB-08 knowledge-surfacing.md rewrite) now has the full verb surface to reference:

- **Read surface (Plan 02):** `kb query`, `kb search`, `kb link show --inbound|--outbound`.
- **Write surface (Plan 04):** `kb transition`, `kb link create`, `kb link delete`.
- **Watchdog (Plan 03):** `kb health` exit-code bitmask for pre-surfacing freshness checks.

Plan 05 should rewrite `knowledge-surfacing.md` §1, §2, §8 to route agents through `kb query` / `kb search` / `kb link show --inbound` instead of grep-through-index, retire the lesson-only surfacing path per audit §7.1 #5 / D-8, and enumerate the KB-12..KB-17 deferrals in the Phase 58 GATE-09 scope-translation ledger format per D-10.

No blockers for Plan 05.

## Self-Check: PASSED

- **Files verified to exist:**
  - `get-shit-done/bin/lib/kb-transition.cjs` — FOUND
  - `get-shit-done/bin/lib/kb-link.cjs` — FOUND (modified)
  - `get-shit-done/bin/gsd-tools.cjs` — FOUND (modified)
  - `get-shit-done/workflows/collect-signals.md` — FOUND (modified)
  - `get-shit-done/workflows/execute-phase.md` — FOUND (modified)
  - `get-shit-done/bin/reconcile-signal-lifecycle.sh` — FOUND (modified)
  - `tests/unit/kb-transition.test.js` — FOUND
  - `tests/unit/kb-link-write.test.js` — FOUND
  - `tests/integration/kb-lifecycle-wiring.test.js` — FOUND
- **Commits verified to exist on `gsd/phase-59-kb-query-lifecycle-wiring-and-surfacing`:**
  - `5197366a` (Task 1: kb transition + kb link create/delete + BEGIN IMMEDIATE dual-write) — FOUND
  - `cbcb1086` (Task 2: collect-signals wiring + bash deprecation + integration regression) — FOUND
- **Plan verification checks:**
  - `npx vitest run tests/unit/kb-transition.test.js tests/unit/kb-link-write.test.js tests/integration/kb-lifecycle-wiring.test.js` — 29 passed, 0 failed
  - `npm test` — 756 passed, 0 failed, 4 todo, 1 skipped (no regressions from 727 baseline)
  - `node get-shit-done/bin/gsd-tools.cjs kb transition` (no args) prints usage with `--reason` flag
  - `bash get-shit-done/bin/reconcile-signal-lifecycle.sh /tmp/fake` on Linux exits 2 with `DEPRECATED...v1.21` and `kb transition` in stderr
  - `grep -c 'BEGIN IMMEDIATE' get-shit-done/bin/lib/kb-transition.cjs get-shit-done/bin/lib/kb-link.cjs` — 3 + 2 = 5 (>= 2)
  - `grep -c 'DEPRECATED' get-shit-done/bin/reconcile-signal-lifecycle.sh` — 2 (>= 1)
  - `grep -n 'kb transition' get-shit-done/workflows/collect-signals.md` — 7 references
  - `grep -n 'reconcile-signal-lifecycle' get-shit-done/workflows/execute-phase.md` — 2 references (deprecation citation, not active invocation)
  - `sha256sum get-shit-done/bin/lib/kb-transition.cjs .claude/get-shit-done-reflect/bin/lib/kb-transition.cjs` — identical hashes after `bin/install.js --local`
  - `kb health` on live corpus: Check 1 PASS, Check 2 FAIL with 31 drifts (documented non-closure above), Check 3 FAIL (pre-existing, unrelated to this plan), Check 4 SUMMARY. Integration test proves the wiring flips Check 2 from FAIL to PASS on fixture data — which is the plan's actual closure criterion per the "or confirms why not" clause.
