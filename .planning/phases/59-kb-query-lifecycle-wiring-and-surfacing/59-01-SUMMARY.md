---
phase: 59-kb-query-lifecycle-wiring-and-surfacing
plan: "01"
signature:
  role: executor
  harness: claude-code
  platform: claude-code-cli
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.7+dev
  generated_at: "2026-04-21T04:15:11Z"
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
context_used_pct: 45
subsystem: knowledge-base
tags: [kb, sqlite, fts5, extractLinks, signal_links, edge_integrity, schema-migration, repair-verb]
requires:
  - phase: 56-knowledge-base-lifecycle
    provides: node:sqlite substrate (kb rebuild / kb stats / kb migrate); signal_links + signals + spikes + meta tables
  - phase: 57.7-content-analysis-and-epistemic-deepening
    provides: signal_fts drop in kb.cjs:172-185 (MEAS-GSDR-06) that this plan reverses correctly (external-content contentless rewrite, not canonical-row expansion)
  - phase: 57.8-signal-provenance-role-aware-backfill
    provides: live-upgrade-verification-pattern that Plan 59-01 Task 2 live-corpus regression implements
  - phase: 58.1-codex-update-distribution-parity
    provides: DC-4 cross-runtime parity invariant -- gsd-tools.cjs installs identically to .claude and .codex, so the new `kb repair` verb gains Codex parity without any installer edit
provides:
  - extractLinks() uniform typeof-string guard across all four link types (qualified_by, superseded_by, related_signals, recurrence_of) -- structurally eliminates the [object Object] malformed-target bug class
  - idx_signal_links_target(target_id, link_type) -- inbound-edge lookups plan as SEARCH USING INDEX, not SCAN (KB-04c substrate)
  - signal_fts as FTS5 external-content contentless rewrite over signals.title + signals.body with porter+unicode61 tokenizer and three AFTER triggers (KB-04b substrate)
  - signal_links.created_at + signal_links.source_content_hash columns (audit §7.1 #8 edge provenance minimum) populated on every INSERT
  - signals.title + signals.body columns derived during rebuild (first-H2 + post-frontmatter body)
  - schema_version 2 -> 3 migration that cleanly drops old signal_fts + triggers, clears legacy rows, and rebuilds everything via the new INSERT path
  - cmdKbRebuild edge-integrity report: five-column table + edge_integrity JSON blob + exit 1 on malformed
  - cmdKbRepair(cwd, raw, {malformedTargets}) verb: walks signal .md files, strips non-string link-type frontmatter fields, re-runs rebuild, exits 0 iff post-rebuild malformed==0
  - Router wires `gsd-tools kb repair --malformed-targets` under case 'kb'
  - Live corpus repair landed: 107 signal files stripped of bare recurrence_of frontmatter keys; kb.db malformed edges 107 -> 0
affects:
  - Phase 59 Wave 2 (kb search, kb link show --inbound, kb query) -- unblocked; substrate now clean
  - Phase 60 (sensor pipeline) -- can rely on edge_integrity in kb rebuild for freshness assertions
  - Phase 60.1 (telemetry-signal integration) -- cleaner signal_links for any intervention-outcome loop queries
tech-stack:
  added:
    - FTS5 external-content contentless rewrite (already bundled with node:sqlite; no new npm dep)
  patterns:
    - typeof-string guard on YAML-parsed frontmatter values (R12)
    - FTS5 external-content + AFTER-triggers coherence pattern (Pattern 1)
    - v<N schema migration via drop-and-clear-then-recreate (avoids FTS5 "malformed disk image" on trigger/delete race)
    - Edge-integrity classifier (Pattern 3): resolves / orphaned / malformed per link_type with exit-code semantics on malformed only
    - One-shot repair verb (file-side + SQL-side + re-rebuild) per Pitfall 5
    - Test-only module exports (__testOnly_*) for direct invocation without subprocess round-trip
key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/kb.cjs (+347 lines across two commits: extractLinks guard, signal_links + signals column additions, FTS5 re-entry, schema v3 migration, cmdKbRebuild edge-integrity report, cmdKbRepair verb, test-only exports)
    - get-shit-done/bin/gsd-tools.cjs (+8 lines: route `kb repair --malformed-targets` subverb; usage string updated)
    - tests/unit/kb.test.js (+574 lines: 17 new Phase 59 test cases across groups 10-15)
    - tests/unit/kb-schema.test.js (+44 lines: Phase 57.7 drop-assertion rewritten as Phase 59 re-entry assertion with external-content shape check)
    - tests/integration/kb-infrastructure.test.js (+99 lines: live-corpus regression implementing 57.8 live-upgrade-verification-pattern)
    - .planning/knowledge/signals/**/*.md (107 files: bare recurrence_of frontmatter keys stripped)
key-decisions:
  - "Exit-code contract downgraded orphaned from exit 2 to advisory (still reported in table + JSON). Research Pattern 3 called for exit 2 on orphaned-only but that would break every existing `kb rebuild` caller with an execSync-style throw-on-nonzero pattern, including 2 pre-existing tests in this file. Malformed stays exit 1 (the hard-fail contract per D-4 is preserved); orphaned is informational."
  - "Schema v2 -> v3 migration performs the data clear (DELETE FROM signal_links; signal_tags; signals) INSIDE initSchema BEFORE creating the new AFTER triggers, not inside cmdKbRebuild after trigger creation. Reason: the AFTER DELETE trigger fires INSERT INTO signal_fts VALUES('delete',...) which errors with 'database disk image is malformed' when signal_fts is empty. Clearing before the triggers exist avoids that entire class of failure."
  - "Edge-integrity classification implemented as a single CASE-WHEN grouped SELECT with EXISTS joins on signals.id and spikes.id (spikes can legitimately be recurrence_of/related_to targets). Single query replaces the multi-pass approach."
  - "Live repair commit (4662bce3) kept separate from the Task 2 implementation commit (30305732) so the code change and the data change are independently revertable. Audit §7.1 #1 explicitly called for the one-time repair migration, so landing the edits on the phase branch is in-scope."
  - "Test helper runKbCapture() added to handle exit-code-based tests. The pre-existing runKb() throws on non-zero (execSync default), which made it unusable for malformed-detection tests that need to assert code === 1."
  - "Test-only exports prefixed with __testOnly_ (extractLinks, computeEdgeIntegrity) kept legibly separate from the public surface. Not part of the module contract; may be renamed/removed in a later phase without a deprecation window."
  - "No installer edits -- new `kb repair` verb gains Codex parity automatically via Phase 58.1 DC-4 (both runtimes share gsd-tools.cjs). No knowledge-surfacing.md or agent-spec changes in this plan -- those belong to KB-08 (Wave 2+)."
patterns-established:
  - "Typeof-string guard discipline: any YAML-parsed field coerced to String() must be typeof-checked first, because bare keys become `{}` and stringify to '[object Object]'."
  - "FTS5 migration cleanup-before-recreate: drop triggers and FTS table + clear source rows BEFORE recreating the FTS substrate, then rely on AFTER INSERT triggers to repopulate as the rebuild loop runs."
  - "Edge-integrity as a first-class output of rebuild: every `kb rebuild` prints the classifier table and echoes edge_integrity in --raw so downstream tests can assert invariants without ad-hoc SQL."
duration: 16min
completed: 2026-04-21
---

# Phase 59 Plan 01: KB Substrate Repair and FTS5 Re-entry Summary

**Cleaned the ground before Wave 2: `[object Object]` bug class structurally eliminated, FTS5 contentless rewrite shipped, edge-integrity report wired into `kb rebuild`, and the 107 malformed edges on the live corpus physically cleaned via the new `kb repair --malformed-targets` verb.**

## Performance

- **Duration:** 16min
- **Tasks:** 2 of 2 completed (both `type="auto"`, no checkpoints hit)
- **Files modified:** 5 code files + 107 data files = 112 total

## Accomplishments

- **Structural elimination of `[object Object]` bug class.** `extractLinks()` now guards every link-type value with a `typeof === 'string'` check before `String().trim()` coercion. The YAML parser coerces bare keys (e.g. `recurrence_of:` with no value) to `{}`; pre-guard, `String({}).trim()` produced `"[object Object]"` — truthy, non-empty — and got inserted as a malformed target_id. Guard covers all four link types (qualified_by, superseded_by, related_signals, recurrence_of).
- **`idx_signal_links_target`** added. Inbound-edge lookups (`SELECT source_id FROM signal_links WHERE target_id = ?`) plan as `SEARCH ... USING INDEX idx_signal_links_target`, not `SCAN`. Unblocks KB-04c inbound-edge traversal for Wave 2's `kb link show --inbound`.
- **FTS5 external-content contentless rewrite shipped** as `signal_fts` over `signals.title` + `signals.body` with `porter+unicode61` tokenizer and three AFTER triggers (ai/ad/au). Phase 57.7 dropped the broken canonical-row expansion; Phase 59 re-enters the correct shape per Pattern 1. Verified on live corpus: 278 signals indexed, porter stemming confirmed (`verify` and `verified` match identically).
- **Edge-provenance minimum shipped** (audit §7.1 #8). `signal_links.created_at` (ISO timestamp) and `signal_links.source_content_hash` (sha256 hex of source signal file body) now populated on every INSERT. Enables forensic queries cheaply without the full edge-as-entity migration KB-12 defers.
- **Schema v2 → v3 migration** lands cleanly on existing kb.db files. Drops old signal_fts + triggers, clears legacy rows (FK-ordered: links → tags → signals), then the rebuild loop re-inserts everything through the new INSERT path with signals_ai firing row-by-row to populate signal_fts. Verified: one migration run on the 278-signal corpus, 0 errors.
- **`kb rebuild` edge-integrity report.** Five-column table (link_type, total, resolves, orphaned, malformed) + matching `edge_integrity` JSON under `--raw`. Exit 1 on any malformed (D-4 hard-fail). Orphaned is advisory (not a failure) so existing callers aren't broken.
- **`kb repair --malformed-targets` verb.** Walks `signals/*/*.md`, strips non-string link-type frontmatter fields via `spliceFrontmatter`, writes atomically, then re-runs `cmdKbRebuild` internally. Exit 0 iff post-rebuild malformed == 0.
- **Live repair landed.** 107 signal files stripped of bare `recurrence_of:` frontmatter keys. Live `kb.db`: malformed edges 107 → 0. Repair is idempotent (re-running produces 0 additional edits). Committed separately (`4662bce3`) so the data change is independently revertable from the code change.
- **Live-corpus regression test** implements the Phase 57.8 live-upgrade-verification-pattern: copies `.planning/knowledge/signals/` into tmpdir (snapshot, not mutation), runs rebuild → repair → rebuild, asserts `edge_integrity.*.malformed === 0` across all four link types.

## Task Commits

1. **Task 1: Apply uniform extractLinks guard, add idx_signal_links_target, introduce FTS5 external-content rewrite with triggers + schema v3 bump** — `4237da8d`
2. **Task 2: Extend `kb rebuild` with edge-integrity report, introduce `kb repair --malformed-targets` verb, wire router, ship live-corpus regression** — `30305732`
3. **Live repair landing (audit §7.1 #1)** — `4662bce3` — physically applies Task 2's verb to the live corpus, stripping 107 malformed frontmatter fields. Not a plan-defined task per se; rather the load-bearing output of `kb repair --malformed-targets` executed on real data, committed separately by plan instruction.

## Files Created/Modified

### Modified (code)

- `get-shit-done/bin/lib/kb.cjs` — extractLinks guard (uniform typeof-string); initSchema gains idx_signal_links_target, signals.title/body + signal_links.created_at/source_content_hash columns, v2→v3 migration (drop-clear-recreate), FTS5 external-content rewrite + three triggers; signalToRow derives title/body from raw content; cmdKbRebuild's INSERT OR REPLACE statement updated to the new column list; insertSignalLink now takes created_at + source_content_hash; schema_version bump 2→3; `INSERT INTO signal_fts(signal_fts) VALUES('rebuild')` finalizer; post-rebuild computeEdgeIntegrity + renderEdgeIntegrityTable + process.exitCode classification; cmdKbRepair(cwd, raw, {malformedTargets}) new verb; test-only exports (extractLinks, computeEdgeIntegrity).
- `get-shit-done/bin/gsd-tools.cjs` — case 'kb' router dispatches `repair` when `--malformed-targets` flag is present; usage string updated to `kb <rebuild|stats|migrate|repair>`.
- `tests/unit/kb.test.js` — 17 new Phase 59 test cases across six groups (extractLinks guard, FTS5, idx_signal_links_target, edge_integrity, edge_integrity malformed detection, repair verb). Added `runKbCapture` helper for exit-code-based assertions.
- `tests/unit/kb-schema.test.js` — Phase 57.7 drop-assertion rewritten as Phase 59 re-entry assertion (external-content shape check).
- `tests/integration/kb-infrastructure.test.js` — live-corpus regression test (snapshot-into-tmpdir pattern, no side effects on real corpus).

### Modified (data)

- `.planning/knowledge/signals/**/*.md` — 107 files stripped of bare `recurrence_of:` frontmatter keys. Diff: −157 / +43 lines across 107 files. No semantic change; only the empty frontmatter field was removed.

## Decisions & Deviations

### Key decisions (promoted to frontmatter for discoverability)

See `key-decisions` in frontmatter.

### Deviations from plan

**Rule 3 deviation (blocking issue auto-fix) — schema migration ordering.**

- **Found during:** Task 1 live-corpus rebuild.
- **Issue:** First attempt at `kb rebuild` on a v2 kb.db failed with "database disk image is malformed". Root cause: the AFTER DELETE / AFTER UPDATE triggers on `signals` try to `INSERT INTO signal_fts VALUES('delete', ...)`; when signal_fts is empty (just created via `IF NOT EXISTS`) this errors and corrupts the DB. The plan's Task 1 action did not specify the migration ordering.
- **Fix:** Moved the legacy-row cleanup (`DELETE FROM signal_links; signal_tags; signals`) INSIDE `initSchema` on v<3 detection, BEFORE creating the AFTER triggers. Triggers don't exist yet → deletes are bare SQL → no FTS5 side effects. The rebuild loop then re-inserts everything fresh, firing the signals_ai AFTER INSERT trigger row-by-row.
- **Files modified:** `get-shit-done/bin/lib/kb.cjs` (initSchema v<3 migration block).
- **Commit:** included in `4237da8d`.

**Rule 1 deviation (bug fix) — exit-code contract for orphaned.**

- **Found during:** Task 2 unit test run, after wiring the research-Pattern-3 exit-code contract into `cmdKbRebuild`.
- **Issue:** Research Pattern 3 specified exit 2 on orphaned-only as a "warning (downgradable)". Implementing it literally (`process.exitCode = 2` when orphaned>0) broke the pre-existing test `qualified_by and related_signals -> signal_links table has entries with correct link_types` because its fixture produced orphaned edges and the test's `runKb` helper uses `execSync` which throws on any non-zero exit.
- **Fix:** Downgraded orphaned from exit 2 to advisory (still printed in the table + emitted in edge_integrity JSON, but does not set process.exitCode). Exit 1 on malformed stays (D-4 hard-fail contract preserved). Orphaned footer text updated from "Exit code: 2 (orphaned targets detected; warning)" to "Note: N orphaned target(s) reference signals or spikes that do not exist locally (advisory; not a failure)."
- **Files modified:** `get-shit-done/bin/lib/kb.cjs` (`cmdKbRebuild` exit-code block + `renderEdgeIntegrityTable`).
- **Commit:** included in `30305732`.
- **Documented in frontmatter key-decisions** because it alters the public exit-code contract from what research Pattern 3 prescribed.

No other deviations. No Rule 4 architectural asks were triggered.

## User Setup Required

None — no external service configuration required. All changes are in-tree code + in-tree data (signal frontmatter cleanup). The v2→v3 kb.db schema migration runs automatically on next `kb rebuild` for any user on this branch.

## Next Phase Readiness

The substrate is clean and Wave 2 can proceed:

- **KB-04b (`kb search`)** — signal_fts is populated, porter+unicode61 tokenizer verified. Wave 2 can build `cmdKbSearch` on top of `SELECT ... FROM signal_fts WHERE signal_fts MATCH ?`.
- **KB-04c (`kb link show --inbound`)** — idx_signal_links_target is present and used. Inbound traversal is O(log N).
- **KB-04d (`kb rebuild` integrity)** — done this plan.
- **KB-06a / KB-06b (`kb query` + `kb link show` read/write surfaces)** — substrate is stable; schema v3 is the planning target.
- **KB-07 (`kb transition`)** — no direct dependency but benefits from the guaranteed-clean signal_links.
- **KB-08 (knowledge-surfacing.md rewrite)** — waits for the read-verb surface (Wave 2).

No blockers for Wave 2 planning/execution.

## Self-Check: PASSED

- **Files verified to exist:**
  - `get-shit-done/bin/lib/kb.cjs` — FOUND
  - `get-shit-done/bin/gsd-tools.cjs` — FOUND
  - `tests/unit/kb.test.js` — FOUND
  - `tests/unit/kb-schema.test.js` — FOUND
  - `tests/integration/kb-infrastructure.test.js` — FOUND
- **Commits verified to exist on `gsd/phase-59-kb-query-lifecycle-wiring-and-surfacing`:**
  - `4237da8d` (Task 1) — FOUND
  - `30305732` (Task 2) — FOUND
  - `4662bce3` (live repair) — FOUND
- **Plan verification checks:**
  - `npx vitest run tests/unit/kb.test.js` — 44 passed, 0 failed
  - `npx vitest run tests/integration/kb-infrastructure.test.js` — 40 passed, 0 failed (incl. live-corpus regression)
  - `npm test` — 689 passed, 0 failed, 4 todo
  - `node get-shit-done/bin/gsd-tools.cjs kb rebuild --raw` → `edge_integrity.total.malformed === 0`, exit 0
  - `sqlite3 .planning/knowledge/kb.db "SELECT value FROM meta WHERE key='schema_version'"` → `3`
  - `EXPLAIN QUERY PLAN SELECT source_id FROM signal_links WHERE target_id=?` → `SEARCH signal_links USING INDEX idx_signal_links_target (target_id=?)`
  - `SELECT COUNT(*) FROM signal_fts` === `SELECT COUNT(*) FROM signals` → `278 === 278`
  - `SELECT COUNT(*) FROM signal_links WHERE created_at='' OR source_content_hash=''` → `0`
