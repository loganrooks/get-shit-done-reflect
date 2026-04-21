---
phase: 59-kb-query-lifecycle-wiring-and-surfacing
plan: "02"
signature:
  role: executor
  harness: claude-code
  platform: claude-code-cli
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.7+dev
  generated_at: "2026-04-21T04:27:16Z"
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
context_used_pct: 55
subsystem: knowledge-base
tags: [kb, kb-query, kb-search, kb-link, fts5, read-surface, grep-fallback, non-mutating, phase-59]
requires:
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "01"
    provides: signal_fts FTS5 external-content substrate; idx_signal_links_target; signals.title/body columns; cleaned edge corpus (0 malformed); getKbDir/getDbPath/getDbSync now exported from kb.cjs for sibling lib modules
  - phase: 58.1-codex-update-distribution-parity
    provides: DC-4 cross-runtime parity invariant -- new lib/kb-query.cjs and lib/kb-link.cjs install identically to .claude and .codex without installer edits
provides:
  - cmdKbQuery(cwd, options, raw) -- structured AND filter (severity, lifecycle, project, tag, since) with --limit (default 50), --format json, grep fallback on kb.db absence
  - cmdKbSearch(cwd, query, options, raw) -- FTS5 MATCH over signal_fts joined to signals, snippet() context excerpts, --limit (default 25), --format json, grep fallback
  - cmdKbLinkShow(cwd, signalId, options, raw) -- read-only traversal with --outbound / --inbound / --both (default --both); outbound rows carry target_kind (signal/spike/malformed/orphan); inbound queries use idx_signal_links_target
  - parseKbQueryOptions / parseKbLinkOptions -- reusable option parsers for the new subverbs
  - Router dispatch in gsd-tools.cjs case 'kb': query, search, link show wired; link create / link delete stubbed with explicit "Plan 04" deferral error so the verb namespace is discoverable
  - Grep fallback paths (fallbackGrepQuery, fallbackGrepSearch) clearly label output as `fallback: { engine: 'grep', reason: 'kb.db not found' }` so callers can distinguish first-class SQL results from the fresh-clone path
  - Non-mutating contract empirically verified -- read verbs leave .md files and kb.db byte-identical
affects:
  - Phase 59 Plan 03 (kb health) -- can consume cmdKbQuery / signal_fts directly for edge-integrity and lifecycle-vs-plan checks
  - Phase 59 Plan 04 (kb transition, kb link create/delete) -- write surface adds onto the existing router; the Plan 04 stub slots already print the deferral contract
  - Phase 59 Plan 05 (agent surfacing rewrite KB-08) -- knowledge-surfacing.md §2/§8 rewrite can route through kb query / kb search / kb link show --inbound instead of grep-through-index
tech-stack:
  added:
    - grep (POSIX) as first-class fresh-clone fallback engine, invoked via execFileSync('grep', [...]) to avoid shell re-entry on user-supplied queries
  patterns:
    - Module-boundary helper re-export: kb.cjs now exports getKbDir / getDbPath / getDbSync so sibling lib modules can reuse path resolution and the node:sqlite gate without duplicating the guard block (no circular import)
    - Directional read API with target_kind: single CASE-WHEN-EXISTS query classifies each outbound target (signal/spike/malformed/orphan) in one pass
    - Fallback labelling as explicit JSON field (`fallback: { engine, reason }`) rather than a silent degraded result
    - Write-verb stubbing at router level: kb link create / kb link delete emit a Plan-04-deferred error so the verb namespace is discoverable but not yet functional
    - Signal-absence vs edge-absence distinction: kb link show on a nonexistent signal-id errors non-zero; kb link show on an existing signal with no edges prints "(none)" under the relevant section
key-files:
  created:
    - get-shit-done/bin/lib/kb-query.cjs (~345 lines) -- cmdKbQuery + cmdKbSearch + grep fallbacks + parseKbQueryOptions
    - get-shit-done/bin/lib/kb-link.cjs (~155 lines) -- cmdKbLinkShow + Plan 04 stub verb + parseKbLinkOptions
    - tests/unit/kb-query.test.js (~285 lines, 15 test cases) -- structured filter combinations, FTS5 MATCH, porter stemming, JSON shape, grep fallback activation
    - tests/unit/kb-link.test.js (~255 lines, 14 test cases) -- direction modes, target_kind classification (including malformed SQL-inject test), error surfaces, JSON shape, EXPLAIN QUERY PLAN index assertion, write-verb stub
  modified:
    - get-shit-done/bin/gsd-tools.cjs (+25 lines) -- require kb-query.cjs and kb-link.cjs; dispatch query / search / link show / link create-or-delete subverbs; usage string extended to include query|search|link
    - get-shit-done/bin/lib/kb.cjs (+9 lines) -- re-export getKbDir / getDbPath / getDbSync for sibling lib modules
key-decisions:
  - "Helper re-export over duplication. kb-query.cjs and kb-link.cjs reuse kb.cjs's path resolution + lazy sqlite gate via a single `require('./kb.cjs')` call. Duplicating the guard block would pass lint but would cause drift if Node's sqlite gate changes. No circular import risk because kb.cjs does not import either sibling."
  - "Grep fallback for query/search, clean error for link show. Structured filters and FTS5 search degrade to POSIX grep-over-markdown when kb.db is absent (research R2). Inbound link traversal has no tractable grep fallback (would require reading every file to invert the relation); per research §Genuine gaps we surface a clean 'kb.db required; run kb rebuild' error instead. Documenting this intent in kb-link.cjs header so future maintainers do not add a fake fallback."
  - "Write verbs stubbed at router. kb link create / kb link delete emit a 'Plan 04' deferred error rather than being absent from the router. This makes the full verb namespace discoverable via `gsd-tools kb link` usage scan this wave, and gives Plan 04 a clear slot to replace."
  - "Fallback output labelling is load-bearing. Every fallback response carries `fallback: { engine: 'grep', reason: 'kb.db not found' }` as an explicit JSON field. Agents downstream (Plan 05 surfacing) need this to distinguish 'I got fewer results because there were fewer matches' from 'I got fewer results because I was running on grep, which doesn't stem'. Silent degradation would violate research Pitfall C2."
  - "Malformed target_kind test uses post-rebuild SQL injection. After Plan 01's extractLinks guard, the rebuild path cannot produce '[object Object]' target_ids from fresh markdown -- so the malformed branch of the CASE-WHEN cannot be exercised via fixture alone. The test injects a synthetic malformed row into signal_links after rebuild to cover the classification branch. Signal that if the guard ever regresses (Rule 1 territory for future phases), the malformed branch still has test coverage."
  - "Non-mutating contract explicitly verified. A tmpdir smoke test computes sha256 of the .md file and kb.db before and after running all five read verbs (kb query, kb search, kb link show --outbound/--inbound/--both). Both hashes stable == no writes. This is SC-6 in the plan verification block and the key invariant that keeps KB-05 dual-write trivially preserved."
patterns-established:
  - "Fallback-as-explicit-field: degraded paths never silently pretend to be first-class. `fallback: {engine, reason}` is the contract."
  - "Write-verb stubbing at router level: unimplemented verbs land in the router with a 'deferred to Plan NN' error so the verb namespace is discoverable in this wave."
  - "Directional read API with target_kind classification: one SQL pass produces a ready-to-display row with human-legible kind labels rather than requiring callers to re-query for classification."
  - "Post-rebuild SQL injection for regression-proof branch coverage: tests that cover branches the guard eliminates from the happy path inject the bad state directly into SQL so the CASE-WHEN branch stays tested even when the upstream guard prevents the condition from occurring."
duration: 7min
completed: 2026-04-21
---

# Phase 59 Plan 02: KB Query, Search, and Link Show (Read Surface) Summary

**The read half of the Phase 59 verb surface is live: `kb query` filters structurally, `kb search` does FTS5 MATCH with porter stemming, and `kb link show` traverses inbound + outbound edges -- all non-mutating, all gracefully degrading to grep on fresh-clone, with the write verbs stubbed at the router level as explicit "Plan 04" slots.**

## Performance

- **Duration:** 7min
- **Tasks:** 2 of 2 completed (both `type="auto"`, no checkpoints hit)
- **Files created:** 4 (2 lib modules + 2 unit test files)
- **Files modified:** 2 (gsd-tools.cjs router, kb.cjs helper re-exports)
- **Tests added:** 29 (15 kb-query + 14 kb-link)
- **Regression cost:** 0 -- full `npm test` suite passes at 718 tests (up from 689)

## Accomplishments

- **`kb query`** ships as a structured AND-filter over signals with five supported flags (`--severity`, `--lifecycle`, `--project`, `--tag`, `--since`) plus `--limit` and `--format json`. Tag filter JOINs `signal_tags` with DISTINCT; other filters are equality on the corresponding indexed column. Default limit 50, sort by `created DESC, id ASC`. Boolean operators on filters are explicitly deferred to KB-16 per research §Genuine gaps.
- **`kb search`** implements the FTS5 MATCH query from research Example 1 exactly: `SELECT ... FROM signal_fts JOIN signals ON s.rowid = signal_fts.rowid WHERE signal_fts MATCH ? ORDER BY rank LIMIT ?`. Default limit 25. `snippet()` produces a 32-word-window context excerpt with `[...]` delimiters. Porter stemming verified empirically: `kb search rotating` matches bodies containing "rotation" and "rotated". Malformed FTS5 queries surface a clean error (not a stack trace).
- **`kb link show`** ships the read half of the `kb link` verb split (research R3, audit §7.1 #2). Three direction modes: `--outbound`, `--inbound`, `--both` (default). Outbound rows carry `target_kind` as one of `signal / spike / malformed / orphan`, computed by a single CASE-WHEN-EXISTS query joining `signals.id` and `spikes.id`. Inbound rows use `idx_signal_links_target` (EXPLAIN QUERY PLAN asserted). Nonexistent signal-id errors non-zero with "signal not found" rather than returning silent empty (research Pitfall 8).
- **Grep fallback** on kb.db absence is a first-class path for query and search, explicitly labelled as `fallback: { engine: 'grep', reason: 'kb.db not found' }` in every JSON response. Query fallback re-parses frontmatter per file to apply filters; search fallback shells out to POSIX `grep -rlI --include=*.md` via `execFileSync` (not `rg` -- not guaranteed on $PATH). Link traversal intentionally has no fallback -- inbound inversion via grep is infeasible at scale, so the error ("kb.db required; run kb rebuild") is the contract.
- **Write-verb stubbing.** `kb link create` and `kb link delete` land in the router right now, both emitting `error: 'kb link create' not yet implemented -- deferred to Phase 59 Plan 04`. Makes the full verb namespace discoverable via `gsd-tools kb` this wave so agents can plan around it, and gives Plan 04 a clear router slot to replace.
- **Helper re-export pattern.** `kb.cjs` now exports `getKbDir`, `getDbPath`, `getDbSync` so sibling lib modules (`kb-query.cjs`, `kb-link.cjs`, and forthcoming `kb-health.cjs` / `kb-transition.cjs`) can reuse path resolution + the lazy node:sqlite gate without duplicating the guard block. No circular import -- kb.cjs does not import either sibling.
- **Non-mutating contract verified.** An out-of-band smoke test in `/tmp/kb-mutation-test` computed sha256 of a signal .md file and kb.db before running all five read verbs, then again after; both hashes stable. This empirically satisfies SC-6 (no writes on these paths) and means KB-05 dual-write is trivially preserved.

## Task Commits

1. **Task 1: Add `kb query` + `kb search` read verbs with grep fallback** -- `37be5dc3`
2. **Task 2: Add `kb link show` read-only traversal with outbound/inbound/both** -- `9af34755`

## Files Created/Modified

### Created

- **`get-shit-done/bin/lib/kb-query.cjs`** (~345 lines). Exports: `cmdKbQuery`, `cmdKbSearch`, `parseKbQueryOptions`, `__testOnly_fallbackGrepQuery`, `__testOnly_fallbackGrepSearch`. Lazy-requires sibling helpers from `./kb.cjs` rather than duplicating them.
- **`get-shit-done/bin/lib/kb-link.cjs`** (~155 lines). Exports: `cmdKbLinkShow`, `parseKbLinkOptions`, `stubWriteVerb`. Uses the same kb.cjs helper re-export pattern.
- **`tests/unit/kb-query.test.js`** (~285 lines, 15 test cases grouped in 4 describeIf blocks):
  - `kb query: structured AND filters` (5 tests)
  - `kb search: FTS5 MATCH + porter stemming` (5 tests)
  - `fresh-clone fallback: grep when kb.db absent` (4 tests)
  - `router smoke: kb query / kb search appear in usage` (1 test)
- **`tests/unit/kb-link.test.js`** (~255 lines, 14 test cases grouped in 6 describeIf blocks):
  - `kb link show: direction modes` (4 tests)
  - `kb link show: target_kind classification` (3 tests including malformed SQL-inject)
  - `kb link show: error surfaces` (3 tests: nonexistent, missing arg, kb.db absent)
  - `kb link show: JSON shape stability` (1 test)
  - `kb link show: index usage` (1 test -- EXPLAIN QUERY PLAN)
  - `kb link create / delete: Plan 04 stub` (2 tests)

### Modified

- **`get-shit-done/bin/gsd-tools.cjs`** (+25 lines). Imports: `const kbQuery = require('./lib/kb-query.cjs'); const kbLink = require('./lib/kb-link.cjs');`. Router `case 'kb'` block extended with branches for `query`, `search`, and `link {show|create|delete}`. Usage string: `gsd-tools kb <rebuild|stats|migrate|repair|query|search|link>`.
- **`get-shit-done/bin/lib/kb.cjs`** (+9 lines). `module.exports` gains three helpers (`getKbDir`, `getDbPath`, `getDbSync`) with a comment explaining the Wave 2 re-use pattern.

## Decisions & Deviations

### Key decisions

See `key-decisions` in frontmatter.

### Deviations from plan

**Minor -- `query` / `search` option parser consolidated.** The plan (Task 1 action) allowed `parseKbQueryOptions(args)` to live "in a shared place; keep it simple, no yargs dependency." I put the parser in `kb-query.cjs` and re-use it for both `kb query` and `kb search` -- the flag set is nearly identical, so a single parser is cleaner than two. The link-show verb has its own `parseKbLinkOptions` in `kb-link.cjs` because its flag set is disjoint.

**Minor -- kb-query.cjs helper re-exports.** The plan noted: "this lib should re-import [getDbSync] from `./kb.cjs` if possible, or duplicate the small guard block if circular imports cause issues." Re-import worked cleanly (no circular, verified by test pass), so I also re-exported `getKbDir` and `getDbPath` while I was there -- the same re-use applies to link-show and (forthcoming) health. Documented in the kb.cjs export block.

**No Rule 1/2/3 auto-fixes needed and no Rule 4 architectural asks triggered.** The Plan 01 substrate was clean enough that nothing required fixing mid-plan. Only one test failure during development (fallback test initially used the wrong tmpdir shape, catching `getKbDir`'s global fallback behaviour) -- fixed by adjusting the test to seed the local `.planning/knowledge` directory before the assertion. Not a deviation, just a test-authoring correction.

## User Setup Required

None. No new npm dependencies. Works on Node >= 22.5.0 (same gate as Plan 01). Cross-runtime parity inherited via `bin/install.js` -- `lib/kb-query.cjs` and `lib/kb-link.cjs` copy identically into `.claude/get-shit-done/bin/lib/` and `.codex/get-shit-done-reflect/bin/lib/`.

## Next Phase Readiness

Wave 2 of Phase 59 is split across Plan 02 (this plan) and Plan 03 (kb health) running in parallel. With Plan 02 complete:

- **Plan 03 (`kb health`)** can now query via `cmdKbQuery` or directly via `signal_fts` / `signal_links`. The only router overlap point is `gsd-tools.cjs` `case 'kb'` -- Plan 03 will add a `kb health` branch next to the existing ones and the usage string should be extended once both plans land.
- **Plan 04 (`kb transition`, `kb link create`, `kb link delete`)** has a ready-made router slot: `kbLink.stubWriteVerb('create', raw)` / `...'delete', raw)` will be replaced with real dual-write implementations. The verb namespace is already discoverable.
- **Plan 05 (KB-08 knowledge-surfacing.md rewrite)** has the read verbs it needs to route away from the deprecated lesson-only path. `kb query --severity critical --lifecycle detected` and `kb search "<topic>"` are the primary entry points; `kb link show --inbound` supports the "inbound edge context" goal that rewrites the one-way surfacing into two-way.

No blockers on any downstream plan.

## Self-Check: PASSED

- **Files verified to exist:**
  - `get-shit-done/bin/lib/kb-query.cjs` -- FOUND
  - `get-shit-done/bin/lib/kb-link.cjs` -- FOUND
  - `tests/unit/kb-query.test.js` -- FOUND
  - `tests/unit/kb-link.test.js` -- FOUND
  - `get-shit-done/bin/gsd-tools.cjs` -- FOUND (modified)
  - `get-shit-done/bin/lib/kb.cjs` -- FOUND (modified, helper re-exports)
- **Commits verified to exist on `gsd/phase-59-kb-query-lifecycle-wiring-and-surfacing`:**
  - `37be5dc3` (Task 1, kb query + kb search) -- FOUND
  - `9af34755` (Task 2, kb link show) -- FOUND
- **Plan verification checks (all seven):**
  - `npx vitest run tests/unit/kb-query.test.js tests/unit/kb-link.test.js` -- 29 passed (15 + 14), 0 failed
  - `node get-shit-done/bin/gsd-tools.cjs kb query --lifecycle remediated --format json` -- returned 15 results (matches research ground truth)
  - `node get-shit-done/bin/gsd-tools.cjs kb search "recurrence_of" --limit 3` -- returned 3 body-hit matches on the live corpus
  - `node get-shit-done/bin/gsd-tools.cjs kb link show sig-2026-04-20-plan-578-02-undeclared-signal-template-file --both` -- printed Outbound section with 9 related_to edges (all target_kind=signal) and empty Inbound section
  - `ls get-shit-done/bin/lib/kb-query.cjs get-shit-done/bin/lib/kb-link.cjs` -- both exist
  - `grep -n "subcommand === 'query'\\|subcommand === 'search'\\|linkVerb === 'show'" get-shit-done/bin/gsd-tools.cjs` -- shows the three dispatch branches at lines 742, 747, 758
  - `npm test` -- 718 passed, 0 failed, 4 todo (no regressions)
- **Success criteria verification:**
  - Non-mutating contract: tmpdir smoke test confirmed .md hash and kb.db hash both byte-stable across all five read verb invocations. YES
  - Grep fallback on fresh clone: verified via three fallback tests in kb-query.test.js (query, search, tag-filtered query) all returning `fallback: { engine: 'grep' }`. YES
