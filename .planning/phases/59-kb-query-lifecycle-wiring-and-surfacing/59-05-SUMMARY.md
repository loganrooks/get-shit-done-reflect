---
phase: 59-kb-query-lifecycle-wiring-and-surfacing
plan: "05"
signature:
  role: executor
  harness: claude-code
  platform: claude-code-cli
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.7+dev
  generated_at: "2026-04-21T05:10:00Z"
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
context_used_pct: 58
subsystem: knowledge-base
tags: [kb, knowledge-surfacing, kb-query, kb-search, kb-link, deferrals, GATE-09, cross-runtime, parity, KB-08, SC-6, SC-7, phase-59]
requires:
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "01"
    provides: "signal_fts FTS5 substrate + idx_signal_links_target + schema v3 + edge-integrity report; Plan 05's surfacing rewrite routes agents through these verbs"
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "02"
    provides: "kb query, kb search, kb link show read surface (SQL-first + grep fallback); the three verbs Plan 05 §2.1 step-by-step calls through by name"
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "03"
    provides: "kb health four-check watchdog with exit-code bitmask; cited in Plan 05 §4 freshness checking for depends_on_freshness advisory path"
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "04"
    provides: "kb transition + kb link create/delete write surface; lifecycle wiring in collect-signals workflow; deprecated bash reconcile. Plan 05's SUMMARY aggregates the seven ROADMAP SC criteria against these verbs."
  - phase: 58.1-codex-update-distribution-parity
    provides: "DC-4 cross-runtime parity invariant -- bin/install.js copyWithPathReplacement emits byte-identical lib/*.cjs to .claude and .codex. Plan 05's cross-runtime integration test is the regression gate that proves this held across the full Phase 59 kb* surface."
provides:
  - "knowledge-surfacing.md v2.0.0 rewrite: §§1, 2, 2.1, 2.2, 7, 8 retargeted from lesson-only grep-through-index to SQLite-first signals+spikes+reflections triad with grep fallback; structural inbound-edge fetch via `kb link show --inbound` per §2.1 step 2c"
  - "agents/knowledge-store.md annotation pointing to the Phase 59 surfacing rewrite; frozen-field invariant on qualified_by/superseded_by preserved untouched (D-12)"
  - "59-DEFERRALS.md: GATE-09 ledger-consumable table for KB-12..KB-17 with frontmatter disposition + load-bearing column + target-phase/milestone column + rationale. SC-7 satisfied."
  - "REQUIREMENTS.md reconciliation: cross-reference footer to 59-DEFERRALS.md under KB-12..KB-17 block; closed-by annotations + [x] on KB-04b/KB-04c/KB-04d/KB-06a/KB-06b/KB-07/KB-08; status table rows flipped Pending -> Complete."
  - "tests/integration/cross-runtime-kb.test.js: 7 new Phase 59 Plan 05 tests across 2 describe blocks -- sha256 parity for 5 kb* lib modules + knowledge-surfacing.md, JSON shape parity for kb query / kb search / kb link show / kb health / kb transition invoked from both .claude and .codex runtimes"
  - "Phase-level must_haves aggregation: T1..T15 + A1..A10 + K1..K7 enumerated in this SUMMARY (Nyquist validator consumable); all seven ROADMAP SC-1..SC-7 mapped to concrete artifacts + verification commands"
affects:
  - "Phase 59 close: SC-1..SC-7 all satisfied; phase is ready for verifier + PR"
  - "Phase 60 (sensor pipeline): inherits stable kb* surface and the knowledge-surfacing.md v2.0.0 protocol agents will use when processing detected signals"
  - "Phase 60.1 (telemetry-signal integration): Check 2 lifecycle-vs-plan drift is now measurable; KB-13 retrieval attribution deferred cleanly behind 60.1"
  - "GATE-09 (v1.20 scope translation ledger): 59-DEFERRALS.md is the direct input; ledger consumes KB-12..KB-17 rows verbatim"
  - "v1.21: KB-14 (non-signal artifact indexing) defers behind the claim-type ontology deliberation"
tech-stack:
  added: []
  patterns:
    - "SQLite-first surfacing protocol with POSIX grep fallback: fresh-clone degradation is a first-class path, not a silent fail; the fallback envelope carries `fallback: { engine, reason }` for caller discrimination"
    - "Structural inbound-edge fetch: surfacing an older immutable signal MUST fetch its inbound edges via `kb link show --inbound` — not advisory, mandatory per protocol contract (D-2 / audit §A4 Option 1)"
    - "Ledger-consumable deferrals frontmatter: YAML with `disposition: explicitly_deferred` + `gate: GATE-09` + `target_milestone_range` fields so the scope-translation ledger can parse programmatically"
    - "sha256 parity guard for cross-runtime installs: each new lib/*.cjs file hashed on both .claude and .codex post-install; equality is a hard assertion, not a spot check"
    - "JSON-shape-level parity for CLI verbs: `normalizePaths()` helper neutralizes runtime-specific path differences so the remaining comparison is pure shape"
key-files:
  created:
    - ".planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md (~80 lines) — frontmatter + deferrals table + cross-reference section + in-scope-for-contrast table + notes on load-bearing column"
    - ".planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-05-SUMMARY.md (this file)"
  modified:
    - "get-shit-done/references/knowledge-surfacing.md (rewritten 457 -> 389 lines; v1.0.0 -> v2.0.0). §1 scope replaced; §2 mechanics retargeted to SQL-first; §2.1 step-by-step fully rewritten with inbound-edge fetch as step 2c; §2.2 index format replaced with query envelope shapes; §3-§6 surgically updated (lesson -> signal references where live); §7 spike dedup de-coupled from lessons; §8 agent table rewritten with signals+spikes+reflections triad + mandatory inbound fetch for every agent row; §9-§11 preserved with surgical citation updates."
    - "agents/knowledge-store.md (+1 line) — lesson-deprecation note now cites the Phase 59 surfacing rewrite file §§1, 2, 8 as the replacement path. Frozen-field invariant on qualified_by/superseded_by (§10) untouched; §4.2 lifecycle state machine untouched; no bidirectional-writeback hints introduced."
    - ".planning/REQUIREMENTS.md (+7 lines across two locations) — `[ ]` -> `[x]` + `*Closed by:*` annotations on KB-04b/KB-04c/KB-04d/KB-06a/KB-06b/KB-07/KB-08; cross-reference footer to 59-DEFERRALS.md under the KB-12..KB-17 block; Pending -> Complete in status table rows 537-542 + KB-04d row inserted."
    - "tests/integration/cross-runtime-kb.test.js (+~210 lines; 7 new tests) — new describe block `Phase 59 Plan 05: cross-runtime kb* verb parity` with 2 sub-blocks (sha256 parity, JSON shape parity)."
key-decisions:
  - "knowledge-surfacing.md is a SIGNIFICANT REWRITE (not search-and-replace per research Pitfall 3 / R7). Each lesson occurrence was classified into historical-reference (kept as 'used to be called lessons'), live-path (replaced with signal/spike/reflection), or deletion (agent-table lesson-only rows dropped). 20 baseline `lesson` references collapsed to 4 deliberate historical callouts; 25 kb-verb references added (vs 0 baseline); 389-line rewrite vs 457-line original."
  - "Inbound-edge fetch is STRUCTURAL not advisory. §2.1 step 2c names it mandatory in bold; §8 reiterates it for every agent row. Skipping the inbound fetch is explicitly named as a protocol violation, not a best-practice miss. This is the D-2 / audit §A4 Option 1 decision operationalized."
  - "grep (NOT rg) as the fresh-clone fallback. POSIX grep is guaranteed on every platform; ripgrep is not. Per plan must-have #6 and the plan verification block's explicit 'grep (NOT rg)' phrasing, the specification standardizes on grep; agents that know rg is present may substitute locally but the spec uses grep."
  - "59-DEFERRALS.md frontmatter carries `gate: GATE-09` + `disposition: explicitly_deferred` + `scope.covers_requirements: [KB-12..KB-17]` + `scope.in_scope_for_this_phase: [...]` so the GATE-09 ledger consumer can parse the file programmatically without needing to re-classify rows. The body table uses the exact column order from research §Deferrals (ID / Deferral / Load-bearing? / Downstream phase / Rationale) so the ledger can transclude rows verbatim."
  - "REQUIREMENTS.md receives a footer cross-reference under the KB-12..KB-17 block rather than duplicating the deferral table there. Per the plan action: 'Do NOT duplicate content — cross-reference only.' The footer is a single `>` blockquote naming DEFERRALS as the authoritative reconciliation point."
  - "Phase-level must_haves aggregation lives BOTH in the plan's frontmatter must_haves block AND as an appendix in this SUMMARY. The plan's frontmatter is the planner's goal-backward enumeration; this SUMMARY's appendix is the verifier's consumable artifact. The two lists are materially equivalent (T1..T15 + A1..A10 + K1..K7)."
  - "Cross-runtime integration test extends the existing `tests/integration/cross-runtime-kb.test.js` rather than creating a new file (per plan instruction: 'If the existing cross-runtime-kb.test.js file from Phase 55+ is present, extend it rather than creating a new file'). The new describe block sits adjacent to the v1.14 release-readiness block and uses the same helpers (`tmpdirTest`, `writeSignal`)."
  - "kb-link.cjs emits `signalId` (camelCase) not `signal_id`. The test asserts `parsed.signalId || parsed.signal_id` to keep the test focused on parity rather than normalization; snake-case vs camel-case normalization is out of scope for Phase 59 Plan 05 and belongs to a later API-hygiene pass if it is done at all."
  - "kb-query.cjs + kb-link.cjs + kb-health.cjs + kb-transition.cjs are ALL inherited by .codex via bin/install.js copyWithPathReplacement with no installer edit. Phase 58.1 DC-4 made this automatic. The sha256 parity test is the regression gate that catches any future installer edit that accidentally forgets to copy one of the kb* files."
patterns-established:
  - "Deferrals as GATE-09 ledger input: new phases that explicitly defer requirements author a PHASE-DEFERRALS.md file with ledger-consumable frontmatter + ID/description/load-bearing/target/rationale table, then cross-reference it from REQUIREMENTS.md with a single blockquote footer rather than duplicating rows."
  - "Structural vs advisory protocol contracts: when a surfacing step is operationally mandatory (like inbound-edge fetch), the reference spec names it STRUCTURAL and says explicitly 'skipping violates the protocol contract' — the distinction from 'best practice' is made legible so downstream agent-prompt edits don't silently downgrade it."
  - "sha256 parity guards for cross-runtime installers: every new runtime-shipped file in a multi-runtime project gets a sha256 equality assertion in an integration test; this catches accidental denylist entries or renamed source files that break DC-4 parity."
  - "JSON shape parity with path normalization: the `normalizePaths()` helper neutralizes runtime-specific paths so the remaining comparison between .claude and .codex output is pure shape; this pattern generalizes beyond kb* to any CLI verb that embeds runtime paths in its output."
duration: 8min
completed: 2026-04-21
---

# Phase 59 Plan 05: Agent Surfacing Rewrite + Deferrals Ledger + Cross-Runtime Parity Summary

**The three closing deliverables for Phase 59: `knowledge-surfacing.md` rewritten from lesson-only grep-through-index to SQLite-first signals+spikes+reflections triad with structural inbound-edge fetch (KB-08 closure); `59-DEFERRALS.md` enumerating KB-12..KB-17 in GATE-09 ledger-consumable form (SC-7 closure); cross-runtime parity integration test proving every new kb* file and the surfacing spec are byte-identical across `.claude` and `.codex` runtimes (research R9 / Phase 58.1 XRT-01 pattern).**

## Performance

- **Duration:** 8min
- **Tasks:** 2 of 2 completed (both `type="auto"`, no checkpoints hit, no Rule 4 asks)
- **Files created:** 2 (59-DEFERRALS.md + this SUMMARY.md)
- **Files modified:** 4 (knowledge-surfacing.md, knowledge-store.md, REQUIREMENTS.md, cross-runtime-kb.test.js)
- **Tests added:** 7 (all in cross-runtime-kb.test.js; 2 sha256 parity + 5 JSON shape parity)
- **Regression cost:** 0 — full `npm test` passes at 763 tests (up from 756 baseline, +7)

## Accomplishments

### Task 1: `knowledge-surfacing.md` rewrite + `knowledge-store.md` annotation

- **v1.0.0 -> v2.0.0 rewrite.** 457 baseline lines -> 389 lines after the rewrite. Six sections (§§1, 2, 2.1, 2.2, 7, 8) substantially rewritten per research R7; five sections (§§3, 4, 5, 6, 9-11) preserved with surgical citation updates.
- **Lesson-only path retired.** 20 baseline `lesson` references collapsed to 4 deliberate historical callouts (all three in §1 explaining the deprecation + one in §7 citing "used to be called lessons" in the agent table). Zero live-surface references remain. Signals + spikes + reflections triad is now the sole active surface.
- **SQLite-first with grep fallback.** §2.1 step-by-step has a clear path gate: `if [ -f "$KB_DIR/kb.db" ]; then KB_PATH=sql; else KB_PATH=grep; fi`. SQL path names `kb query`, `kb search`, and `kb link show --inbound` as the three primary entry points. Grep path lists the concrete `grep -l "tags:.*auth"` and `grep -rli --include="*.md"` commands; explicitly names the degradation (no porter stemming, no structured AND, no inbound inversion).
- **Inbound-edge fetch is STRUCTURAL, not advisory.** §2.1 step 2c says this in bold; §8 says it for every agent row. Skipping the inbound fetch is explicitly a protocol violation. This operationalizes D-2 / audit §A4 Option 1.
- **Agent-specific table rewrite.** Every row in the §8 table now names signals + spikes + reflections explicitly (no more "lessons only" column for the Planner). Every agent sub-section (§8.1 Phase Researcher, §8.2 Planner, §8.3 Debugger, §8.4 Executor) has an explicit sentence naming the inbound-edge fetch as a required step.
- **Query output reference block** (§2.2) replaces the old index-table stub with three concrete JSON envelope examples: `kb query` → signals envelope with `query_params + results`, `kb search` → FTS5 body-hit envelope with `snippet + rank`, `kb link show --inbound` → edges envelope with `source_id + link_type + target_kind + created_at`.
- **knowledge-store.md annotation.** One-line citation added to the existing `Lessons are deprecated` note: "See Phase 59 surfacing rewrite (`get-shit-done/references/knowledge-surfacing.md` §§1, 2, 8) for the replacement signals+reflections surfacing path." §10 Mutability (frozen fields: `qualified_by`, `superseded_by`) untouched. No bidirectional-writeback hints introduced. D-12 FROZEN invariant preserved unchanged.
- **25 kb-verb references** now in knowledge-surfacing.md (vs 0 baseline); plan required >= 6.

### Task 2: `59-DEFERRALS.md` ledger + REQUIREMENTS.md reconciliation + cross-runtime parity test

- **`59-DEFERRALS.md` (new).** Frontmatter carries `gate: GATE-09`, `disposition: explicitly_deferred`, `scope.covers_requirements: [KB-12..KB-17]`, `scope.in_scope_for_this_phase: [KB-04b, KB-04c, KB-04d, KB-06a, KB-06b, KB-07, KB-08]`, `audit_anchor`, `research_anchor`, `roadmap_anchor` fields. Body has the ledger-consumable table (ID / Deferral / Load-bearing? / Downstream phase / Rationale), a cross-references section, and an in-scope-for-contrast table showing KB-04b..KB-08 as closed-by-Phase-59. The GATE-09 scope-translation ledger workflow can consume this file directly.
- **REQUIREMENTS.md reconciliation.** (i) Cross-reference footer added under the KB-12..KB-17 block pointing to 59-DEFERRALS.md. (ii) `[ ]` flipped to `[x]` with `*Closed by:*` annotations on KB-04b (Plan 02), KB-04c (Plan 02), KB-04d (Plan 01), KB-06a (Plans 02+03), KB-06b (Plan 04), KB-07 (Plan 04), KB-08 (Plan 05). (iii) Status table rows flipped Pending -> Complete for all seven Phase 59 requirements; KB-04d row inserted (was missing from the table).
- **Cross-runtime integration test.** 7 new tests in `tests/integration/cross-runtime-kb.test.js` across 2 describe sub-blocks:
  - *sha256 parity:* (a) all five kb* lib files (`kb.cjs`, `kb-query.cjs`, `kb-link.cjs`, `kb-health.cjs`, `kb-transition.cjs`) byte-identical across `.claude` and `.codex` install dirs; (b) `knowledge-surfacing.md` byte-identical across both runtimes (no runtime-specific path rewrites triggered the Phase 58.1 copyWithPathReplacement rewriter).
  - *JSON shape parity:* five tests that invoke `kb query`, `kb search`, `kb link show`, `kb health`, and `kb transition` (usage path) from both runtimes' `gsd-tools.cjs` binaries and assert the stdout is byte-equal after path normalization.
- **Phase-level must_haves aggregated.** The plan frontmatter lists T1..T15 + A1..A10 + K1..K7; this SUMMARY's appendix below repeats them for the phase verifier + Nyquist validator.

## Task Commits

1. **Task 1: Rewrite knowledge-surfacing.md for SQLite triad + annotate lesson-deprecation in knowledge-store.md** — `240d5c87`
2. **Task 2: Author 59-DEFERRALS ledger + cross-runtime kb parity test + REQUIREMENTS reconciliation** — `6fdcb68b`

## Files Created/Modified

### Created

- `.planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` (~80 lines) — ledger-consumable KB-12..KB-17 deferrals with frontmatter + table + cross-references + in-scope-for-contrast.

### Modified

- `get-shit-done/references/knowledge-surfacing.md` (rewritten 457 -> 389 lines). v1.0.0 -> v2.0.0. See Task 1 accomplishments above for section-by-section scope.
- `agents/knowledge-store.md` (+1 line annotation on the existing Lessons-are-deprecated note; frozen-field invariant preserved).
- `.planning/REQUIREMENTS.md` (+~15 lines across two locations — closed-by annotations + cross-reference footer + status table update).
- `tests/integration/cross-runtime-kb.test.js` (+~210 lines; 7 new tests in a new describe block; `sha256` helper + `invokeKb` helper + `normalizePaths` helper).

## Decisions & Deviations

### Key decisions

See `key-decisions` in frontmatter. Highlights:

- **Significant rewrite, not search-and-replace.** Research Pitfall 3 / R7 was respected: each `lesson` occurrence was classified and handled intentionally. 20 baseline occurrences collapsed to 4 historical callouts; 25 kb-verb references added.
- **Inbound-edge fetch is STRUCTURAL, not advisory.** §2.1 step 2c names it mandatory in bold; §8 repeats for every agent row. This is the D-2 / audit §A4 Option 1 operationalization.
- **grep (not rg) as fresh-clone fallback.** POSIX guarantee; the spec uses grep; agents may locally substitute if rg is present.
- **59-DEFERRALS.md is ledger-consumable.** Frontmatter + table shape match what a GATE-09 ledger workflow can parse without re-classification.
- **Footer cross-reference, not content duplication.** REQUIREMENTS.md KB-12..KB-17 rows kept as-is; a single `>` blockquote footer names DEFERRALS as authoritative.
- **sha256 parity as a regression gate.** Every new kb* lib file hashed on both .claude and .codex post-install; equality is a hard assertion.
- **kb-link.cjs emits `signalId` (camelCase).** The test accepts either shape to keep the focus on parity; snake/camel normalization is a later API-hygiene pass.

### Deviations from plan

**Minor deviation — knowledge-surfacing.md is 389 lines, not the ~500 the baseline and the plan's section-edit estimates implied.** The rewrite was tighter than the plan budgeted. Reason: §2.2 replaced 26 lines of index-table stub with 68 lines of JSON envelope examples (expanded), but §2 mechanics + §8 agent table tightened substantially (the old table had more filler prose than the new one). Net -68 lines; the architectural content is fuller. Not a Rule 1/2/3 deviation — the plan allowed for "significant rewrite" as long as the load-bearing sections are rewritten, which they are.

**Minor deviation — REQUIREMENTS.md KB-04d status row was inserted, not just updated.** The plan said "Update rows KB-04b..KB-08 per plan scope." The status table at REQUIREMENTS.md line 537+ did not have a KB-04d row (it had KB-04b, KB-04c, KB-06a, KB-06b, KB-07, KB-08). I inserted KB-04d as "Phase 59 | Complete" to match the flip pattern — KB-04d was closed by Plan 01 per the 59-01-SUMMARY.md `provides` block and the requirement absolutely belongs in the status table. This is a Rule 2 deviation (adding missing critical metadata — the status table was inconsistent with the requirement list).

**Minor test fixture deviation — kb-link parity test asserts `parsed.signalId || parsed.signal_id`.** First test run revealed kb-link.cjs emits `signalId` (camelCase) rather than the `signal_id` (snake_case) I initially guessed. Accepted either shape in the assertion so the test stays focused on the parity guarantee it exists to provide, not on an API-hygiene question that is orthogonal to Phase 59's scope. Rule 1 in the executor's deviation sense (test-authoring bug auto-fixed in-task). Documented here for legibility.

**No Rule 4 architectural asks triggered.** No authentication gates. No user intervention required.

## User Setup Required

None — no external service configuration required. All changes are in-tree code + in-tree docs + in-tree tests. The v2.0.0 surfacing spec takes effect the moment agent prompts re-reference `get-shit-done/references/knowledge-surfacing.md`; no migration step required.

## Next Phase Readiness

Phase 59 is complete. All seven ROADMAP success criteria (SC-1..SC-7) satisfied. All seven in-scope requirements (KB-04b, KB-04c, KB-04d, KB-06a, KB-06b, KB-07, KB-08) closed. All six deferrals (KB-12..KB-17) enumerated in ledger-consumable form.

- **GATE-09 (v1.20 scope-translation ledger):** can consume `.planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` directly.
- **Phase 60 (sensor pipeline):** inherits stable kb* read/write surface and the v2.0.0 surfacing protocol.
- **Phase 60.1 (telemetry-signal integration):** KB-13 retrieval attribution deferred cleanly; Check 2 lifecycle-vs-plan drift measurable via `kb health` bitmask bit 1.
- **v1.21:** KB-14 (non-signal artifact indexing) queued behind the claim-type ontology deliberation.

## Phase 59 Must-Haves (T1..T15 + A1..A10 + K1..K7) — Verifier Consumable

Derived goal-backward from ROADMAP SC-1..SC-7 + audit §7.1 #8. Each item maps to a concrete artifact or verification command. The phase verifier + Nyquist validator + GATE-09 ledger consumer check against this list.

### Truths (observable behaviors)

| ID | SC | Claim | Verify |
|----|----|-------|--------|
| T1 | SC-1a | `gsd-tools kb search "<term>"` returns hits on the live 278-signal corpus | `node get-shit-done/bin/gsd-tools.cjs kb search "recurrence_of" --limit 3` → 3 body hits |
| T2 | SC-1b | `gsd-tools kb query --lifecycle triaged` returns live-corpus triaged signals | `node get-shit-done/bin/gsd-tools.cjs kb query --lifecycle triaged --format json` → non-empty results |
| T3 | SC-1c | `gsd-tools kb rebuild` emits `edge_integrity` block with malformed/orphaned counts by link_type | `node get-shit-done/bin/gsd-tools.cjs kb rebuild --raw` → JSON contains edge_integrity object with four link types |
| T4 | SC-2a | `gsd-tools kb link show <id> --inbound` returns inbound edges | `node get-shit-done/bin/gsd-tools.cjs kb link show <sig-id> --inbound --format json` → non-error envelope |
| T5 | SC-2b | `gsd-tools kb link show <id> --outbound` returns outbound edges with target_kind | `node get-shit-done/bin/gsd-tools.cjs kb link show <sig-id> --outbound --format json` → rows carry target_kind ∈ {signal, spike, malformed, orphan} |
| T6 | SC-3a | `gsd-tools kb transition <id> <state>` updates file + SQL atomically with rollback on failure | `tests/integration/kb-lifecycle-wiring.test.js` — 5 integration tests including rollback |
| T7 | SC-3b | `gsd-tools kb link create/delete` are namespaced under the write surface, not under the read verb | Router dispatch in `get-shit-done/bin/gsd-tools.cjs` — `kb link create|delete` routed to kb-link.cjs writes, `kb link show` to reads |
| T8 | SC-4a | Completing a plan with `resolves_signals` triggers `kb transition <id> remediated` via collect-signals | `get-shit-done/workflows/collect-signals.md` §reconcile_signal_lifecycle step |
| T9 | SC-4b | `reconcile-signal-lifecycle.sh` is DEPRECATED with one-cycle sunset and Linux guard | `grep -c "DEPRECATED" get-shit-done/bin/reconcile-signal-lifecycle.sh` == 2; `bash reconcile-signal-lifecycle.sh /tmp/fake` on Linux → exit 2 |
| T10 | SC-5 | `kb health` emits four checks (edge integrity, lifecycle-vs-plan, dual-write, depends_on freshness), exit code encodes which failed | `node get-shit-done/bin/gsd-tools.cjs kb health --format json` → `checks.{edge_integrity,lifecycle_vs_plan,dual_write,depends_on_freshness}` all present |
| T11 | SC-6a | Research/planning agents surface signals+spikes+reflections via SQL, not grep-through-index | `knowledge-surfacing.md` §2.1 step 2 (SQL path) + §8 agent table |
| T12 | SC-6b | Fresh clone without kb.db degrades to grep fallback (not rg) per knowledge-surfacing.md §2.1 | `knowledge-surfacing.md` §2.1 step 3 grep path + explicit "not rg" note at §2 |
| T13 | SC-6c | knowledge-surfacing.md §§1, 2, 7, 8 no longer depend on the deprecated lesson-only path | `grep -c "^lesson\|lessons" get-shit-done/references/knowledge-surfacing.md` → 4 (historical references only; 20 baseline) |
| T14 | SC-7 | 59-DEFERRALS.md enumerates KB-12..KB-17 in GATE-09 ledger-consumable form | `grep -c "KB-1[2-7]" .planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` >= 6 (actual: 13; IDs appear in table + frontmatter + cross-refs) |
| T15 | audit §7.1 #8 | `signal_links.created_at` + `signal_links.source_content_hash` populated on every row | `sqlite3 .planning/knowledge/kb.db "SELECT COUNT(*) FROM signal_links WHERE created_at='' OR source_content_hash=''"` == 0 (verified live: 0 / 212 total) |

### Artifacts (files that must exist)

| ID | Path |
|----|------|
| A1 | `get-shit-done/bin/lib/kb.cjs` (extended Plan 01) |
| A2 | `get-shit-done/bin/lib/kb-query.cjs` (new Plan 02) |
| A3 | `get-shit-done/bin/lib/kb-link.cjs` (Plan 02 reads + Plan 04 writes) |
| A4 | `get-shit-done/bin/lib/kb-health.cjs` (new Plan 03) |
| A5 | `get-shit-done/bin/lib/kb-transition.cjs` (new Plan 04) |
| A6 | `get-shit-done/references/knowledge-surfacing.md` (rewritten Plan 05) |
| A7 | `.planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` (new Plan 05) |
| A8 | `get-shit-done/bin/reconcile-signal-lifecycle.sh` (Plan 04 deprecated w/ Linux guard) |
| A9 | `tests/unit/{kb.test.js, kb-query.test.js, kb-link.test.js, kb-link-write.test.js, kb-health.test.js, kb-transition.test.js}` (Plans 01-04) |
| A10 | `tests/integration/{kb-infrastructure.test.js, kb-lifecycle-wiring.test.js, cross-runtime-kb.test.js}` (Plans 01, 04, 05) |

### Key links (critical connections)

| ID | Link | Verified by |
|----|------|-------------|
| K1 | collect-signals workflow → `kb transition` (auto-closure of resolves_signals) | `get-shit-done/workflows/collect-signals.md` §reconcile_signal_lifecycle; `tests/integration/kb-lifecycle-wiring.test.js` |
| K2 | `kb transition` → .md + kb.db (atomic BEGIN IMMEDIATE dual-write) | `get-shit-done/bin/lib/kb-transition.cjs`; `tests/unit/kb-transition.test.js` rollback test |
| K3 | `kb link show --inbound` → idx_signal_links_target (index usage) | `tests/unit/kb-link.test.js` EXPLAIN QUERY PLAN assertion |
| K4 | `kb search` → signal_fts (FTS5 external-content contentless) | `tests/unit/kb-schema.test.js`; `tests/unit/kb-query.test.js` FTS5 tests |
| K5 | knowledge-surfacing.md §2.1 → `kb query` / `kb search` / `kb link show --inbound` (SQL-first path) | `grep -c "kb query\|kb search\|kb link show" get-shit-done/references/knowledge-surfacing.md` == 25 (>= 6 required) |
| K6 | 59-DEFERRALS.md → REQUIREMENTS.md KB-12..KB-17 (cross-reference) | `grep -n "59-DEFERRALS.md" .planning/REQUIREMENTS.md` shows footer |
| K7 | `bin/install.js` → `.claude/` + `.codex/` (Phase 58.1 DC-4 parity for all new kb* files) | `tests/integration/cross-runtime-kb.test.js` Phase 59 Plan 05 sha256 parity tests |

All nine audit §7.1 strengthenings are now covered by Phase 59 plans. SC-7 intent ("do not disappear by omission") is satisfied by the 59-DEFERRALS.md + REQUIREMENTS.md cross-reference pair.

## Self-Check: PASSED

- **Files verified to exist:**
  - `get-shit-done/references/knowledge-surfacing.md` — FOUND (modified, v2.0.0)
  - `agents/knowledge-store.md` — FOUND (modified, lesson-deprecation annotation)
  - `.planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` — FOUND (new)
  - `.planning/REQUIREMENTS.md` — FOUND (modified, cross-reference + status-flip)
  - `tests/integration/cross-runtime-kb.test.js` — FOUND (modified, +7 tests)
- **Commits verified to exist on `gsd/phase-59-kb-query-lifecycle-wiring-and-surfacing`:**
  - `240d5c87` (Task 1: knowledge-surfacing rewrite + knowledge-store annotation) — FOUND
  - `6fdcb68b` (Task 2: 59-DEFERRALS + REQUIREMENTS reconciliation + cross-runtime test) — FOUND
- **Plan verification checks (all nine):**
  - `ls .planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` — EXISTS
  - `grep -c "KB-1[2-7]" .planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` — 13 (>= 6)
  - `grep -c "kb query\|kb search\|kb link show" get-shit-done/references/knowledge-surfacing.md` — 25 (>= 6)
  - `grep -i "bidirectional writeback\|target.side mutat" agents/knowledge-store.md` — no matches (frozen invariant preserved)
  - `npx vitest run tests/integration/cross-runtime-kb.test.js` — 18 passed (11 pre-existing + 7 new)
  - `npm test` — 763 passed, 0 failed, 4 todo, 1 skipped (no regressions from 756 baseline)
  - `node bin/install.js --local --all` completes cleanly; all kb* lib files are byte-identical across `.claude/` and `.codex/` install dirs (sha256 check: 1 unique hash per file)
  - `knowledge-surfacing.md` is byte-identical across `.claude` and `.codex` post-install (sha256: `e89756d10f033010ea606c592fedbb232be071857ba9c8d5a23f64217d11c9b7`)
  - 14 of 15 phase-level must_have truths (T1..T14) verified above; T15 (edge-provenance minimum) verified live: `sqlite3 kb.db "SELECT COUNT(*) FROM signal_links WHERE created_at='' OR source_content_hash=''"` == 0 / 212 total rows
