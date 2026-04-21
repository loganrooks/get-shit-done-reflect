---
phase: 58-structural-enforcement-gates
plan: 04
signature:
  role: executor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: inherit
  reasoning_effort: xhigh
  profile: quality
  gsd_version: 1.19.4+dev
  generated_at: "2026-04-20T12:47:00Z"
  session_id: 019cfa8b-de1a-7943-97e2-65c37608bc3d
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: derived
    reasoning_effort: derived
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: resolveModelInternal
    reasoning_effort: codex_profile_resolution
    profile: config
    gsd_version: installed_harness
    generated_at: writer_clock
    session_id: "env:CODEX_THREAD_ID"
model: claude-opus-4-7
context_used_pct: 22
subsystem: frontmatter-validator-and-kb-schema
tags:
  - GATE-09a
  - ledger
  - frontmatter-schema
  - kb-migration
  - additive-table
requires:
  - phase: 57.8-signal-provenance-split-artifact-signature-blocks
    provides: role-split provenance precedent (role_split_provenance entry field mirrors signal split provenance pattern)
  - phase: 56-knowledge-store
    provides: kb.cjs schema + dual-write invariant (PROV-05 / KB-05) substrate for additive ledger_entries table
provides:
  - machine-readable ledger schema (frontmatter validate --schema ledger)
  - additive ledger_entries KB table with kb rebuild ingestion
  - authoritative schema specification artifact (58-04-ledger-schema.md)
  - load-bearing classification rule codified as 5-clause disjunction
  - CLI surface Plan 17 (GATE-09d) consumes unchanged
affects:
  - Phase 58 Plan 17 (GATE-09d verifier consumer of --schema ledger)
  - Phase 58 Plan 20 (writes the first real NN-LEDGER.md)
  - GATE-09b / 09c / 09d (downstream workflow integration)
tech-stack:
  added: []
  patterns:
    - per-array-item conditional validation (disposition-keyed required fields)
    - additive KB migration (CREATE TABLE IF NOT EXISTS; no column modifications)
    - dual-write invariant preservation (files source of truth; kb.db derived cache)
    - per-file delete-then-insert idempotency for ledger_entries
key-files:
  created:
    - .planning/phases/58-structural-enforcement-gates/58-04-ledger-schema.md
  modified:
    - get-shit-done/bin/lib/frontmatter.cjs
    - get-shit-done/bin/lib/kb.cjs
key-decisions:
  - "Ledger validation takes a dedicated validator branch in frontmatter.cjs (validateLedgerFrontmatter) because per-entry conditional logic (if disposition=X then required=Y) does not fit the top-level signal-schema conditional hook"
  - "ledger_entries uses UNIQUE(phase, context_claim) to make INSERT OR REPLACE deterministic; strategy is per-file delete-then-insert for idempotent rebuilds"
  - "Ledger discovery tightened to `^\\d+(\\.\\d+[a-z]?)?-LEDGER\\.md$` to exclude pre-GATE-09a artifacts (UPSTREAM-DRIFT-LEDGER.md from Phase 48.1) and the schema spec itself (58-04-ledger-schema.md)"
  - "Validator exit status stays 0 on invalid ledgers (callers must check `valid` in JSON) — matches existing frontmatter validate contract for plan/summary/verification/signal schemas"
  - "58-LEDGER.md creation deferred to Plan 20 per plan text; Plan 04 ships only the substrate, not a first real ledger instance"
patterns-established:
  - "Per-disposition conditional required fields: implemented_this_phase requires evidence_paths[>=1]; explicitly_deferred requires target_phase_if_deferred matching `^Phase \\d+(\\.\\d+)?$`; rejected_with_reason requires narrowing_provenance.{originating_claim, rationale}"
  - "Load-bearing classification rule: 5-clause disjunction codified in authoritative spec (Section 4 of 58-04-ledger-schema.md)"
  - "KB additive migration with phase-keyed + disposition-keyed indexes for Plan 17 aggregation queries"
duration: 9min
completed: 2026-04-20
---

# Phase 58 Plan 04: Ledger Schema + KB Migration Summary

**Shipped the GATE-09a substrate: `frontmatter validate --schema ledger` CLI surface plus additive `ledger_entries` KB table; authoritative schema spec codifies the load-bearing classification rule before Plan 17's GATE-09d verifier depends on any of it (AT-4 satisfied).**

## Performance
- **Duration:** 9min
- **Tasks:** 2/2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Registered `ledger` schema in `frontmatter.cjs` with full per-entry + disposition-conditional validation (184 lines added to the file).
- Wrote authoritative schema specification `58-04-ledger-schema.md` (7 sections, 216 lines) including the 5-clause load-bearing classification rule.
- Added additive `ledger_entries` table to `kb.cjs` (15 columns, 2 custom indexes, 1 unique constraint) without modifying any existing table or column.
- Extended `cmdKbRebuild` to discover `NN-LEDGER.md` files under `.planning/phases/*/`, parse their frontmatter, and index each entry inside the existing transaction (dual-write invariant preserved).
- Tested end-to-end: created a 3-entry test ledger, validated green, rebuilt KB, confirmed 3 rows indexed with correct disposition / load_bearing / target_phase values; then removed the test ledger before commit (per plan scope — first real `NN-LEDGER.md` is Plan 20's deliverable).
- All 629 existing tests pass; 0 regressions.

## Task Commits
1. **Task 1: Register `ledger` schema + author authoritative spec** - `b27c1882`
2. **Task 2: Add additive `ledger_entries` table + kb rebuild ingestion** - `52af5dc0`

## Files Created/Modified
- `.planning/phases/58-structural-enforcement-gates/58-04-ledger-schema.md` (CREATED) — Authoritative schema specification with 7 sections: motivation, per-gate Codex behavior, full schema definition, load-bearing classification rule (5-clause disjunction), conditional required field logic, example well-formed frontmatter, fire-event mechanism.
- `get-shit-done/bin/lib/frontmatter.cjs` (MODIFIED) — Added `LEDGER_SCHEMA` entry (with disposition enum, generator_role enum, target-phase pattern), `validateLedgerEntry`, `validateLedgerFrontmatter` helpers, and a ledger-specific branch in `cmdFrontmatterValidate`. The ledger branch short-circuits before the existing signal/plan/summary/verification plumbing because per-entry array validation does not fit the existing `conditional` hook.
- `get-shit-done/bin/lib/kb.cjs` (MODIFIED) — Added `ledger_entries` table creation + `idx_ledger_phase` / `idx_ledger_disposition` indexes in `initSchema`; added `discoverLedgerFiles(cwd)` walking `.planning/phases/*/` with tight `^\d+(\.\d+[a-z]?)?-LEDGER\.md$` regex; added `ledgerEntryToRow` mapper (tolerant of partial entries); extended `cmdKbRebuild` with a ledger-processing loop inside the transaction using per-file delete-then-insert idempotency. `meta` table now carries `ledger_entry_count` + `ledger_file_count` rows.

## Decisions & Deviations

### Key Decisions (all intentional, planned)

1. **Dedicated ledger validator branch.** The signal schema's `conditional` hook expresses top-level "if severity=critical then require evidence" — it does not express per-array-item logic ("for each entry, if disposition=X then require Y"). Rather than retrofit the signal plumbing, I added a `ledger: true` marker in the schema entry and a parallel `validateLedgerFrontmatter(fm, schema)` function that short-circuits in `cmdFrontmatterValidate`. The tiered-validation and simple-required paths for the existing schemas are untouched.

2. **`UNIQUE(phase, context_claim)` + per-file delete-then-insert.** The plan spec named `INSERT OR REPLACE` keyed by `(phase, context_claim)`. I added a `UNIQUE` constraint to make that statement deterministic rather than relying on row-id semantics. The delete-then-insert wrapper makes per-file rebuilds idempotent: if a ledger file is edited (entries added/removed/reordered), the KB converges to the file's current state without orphans from the previous version. Cross-file orphans (rows whose `source_file` no longer exists) are NOT swept — that's a Plan 17+ concern; `kb.db` is a derived cache and users rebuild on demand.

3. **Tightened discovery regex.** Initial regex `/LEDGER\.md$/` was too broad — it matched the pre-GATE-09a `UPSTREAM-DRIFT-LEDGER.md` file in Phase 48.1 (which has no YAML frontmatter and isn't a schema-conformant ledger). Narrowed to `^\d+(\.\d+[a-z]?)?-LEDGER\.md$` which matches the Phase 58 naming contract (`58-LEDGER.md`, `57.7-LEDGER.md`, `58.12a-LEDGER.md`) and excludes both the legacy drift artifact and the schema spec itself (`58-04-ledger-schema.md`).

4. **Exit-status contract.** The validator always exits 0; callers inspect `valid` in the JSON. This matches the existing `plan` / `summary` / `verification` / `signal` schema contracts and keeps the CLI scriptable from both Claude Code and Codex CLI without runtime-specific exit-code interpretation.

### Deviations from Plan

Rule 1 (auto-fix bug): None.

Rule 2 (missing critical functionality): None — the plan's scope was comprehensive.

Rule 3 (blocking issues): None.

Minor deviations:

- **`ledger_entry_count` + `ledger_file_count` in meta table.** The plan did not explicitly require these, but every other populated table writes a count to `meta` (see `signal_count`, `spike_count`); adding the two ledger counters maintains the existing pattern. Non-intrusive — just two additional `INSERT OR REPLACE` calls.
- **Test ledger creation then removal.** To prove the full ingestion path end-to-end (file → frontmatter validate → kb rebuild → ledger_entries rows), I created a 3-entry `58-LEDGER.md`, verified three rows indexed with correct dispositions / load_bearing / target_phase values, then removed the file (per plan scope boundary — Plan 20 owns the first real ledger). The local `kb.db` retained 3 stale rows (no cross-file orphan sweep implemented); a subsequent fresh-rebuild cleared them. `kb.db` is gitignored so no local-dev pollution leaks into the committed tree.
- **Schema file regex pattern string in decision log uses double backslash.** In the decision log I wrote `^\\d+...` because the file is Markdown-embedded. The actual regex in `kb.cjs` source is `/^\d+(\.\d+[a-z]?)?-LEDGER\.md$/` (single backslash in JS regex literal).

No Rule 4 (architectural) decisions needed; the plan was explicit enough that all choices above are within its stated latitude.

## User Setup Required
None — no external service configuration required. The KB lives in `.planning/knowledge/kb.db` (gitignored, regenerated on `kb rebuild`).

## Next Phase Readiness

### For Plan 17 (GATE-09d verifier, Wave 4)
- CLI surface `gsd-tools frontmatter validate <path> --schema ledger` is stable.
- JSON output shape: `{valid, missing, invalid, present, warnings, entry_count, schema}`. Plan 17 can consume `valid` + `missing` + `invalid` directly.
- KB aggregation queries available via `SELECT * FROM ledger_entries WHERE phase = ? AND disposition = ?`.
- Existence check on `evidence_paths` entries is NOT implemented here — that's Plan 17's extension; the schema carries the paths, the validator does not cross-check filesystem.

### For Plan 20 (writes first real `NN-LEDGER.md`)
- Plan 20 can copy the Section 6 template from `58-04-ledger-schema.md` verbatim.
- The file MUST be named `58-LEDGER.md` (matches discovery regex).
- Each entry's `load_bearing` is classified per the 5-clause disjunction in Section 4.

### For downstream phases
- KB schema version NOT bumped — the migration is purely additive. Existing `schema_version: 2` in `meta` remains correct. Any future breaking ledger changes would require a schema version bump and a new spec artifact (`58-04-ledger-schema.md v2`).

## Self-Check: PASSED

- [x] `get-shit-done/bin/lib/frontmatter.cjs` exists and contains `ledger` (9 hits for "ledger" token).
- [x] `get-shit-done/bin/lib/kb.cjs` exists and contains `ledger_entries` (9 hits for "ledger_entries" token).
- [x] `.planning/phases/58-structural-enforcement-gates/58-04-ledger-schema.md` exists with 7 sections and 3 hits for `ledger_schema: v1`.
- [x] Commit `b27c1882` exists (Task 1 — `feat(58-04): register ledger schema in frontmatter.cjs + author authoritative spec (GATE-09a / AT-4)`).
- [x] Commit `52af5dc0` exists (Task 2 — `feat(58-04): add additive ledger_entries table + kb rebuild ingestion (GATE-09a)`).
- [x] `gsd-tools frontmatter validate <valid> --schema ledger` returns `valid: true` on positive example.
- [x] `gsd-tools frontmatter validate <invalid> --schema ledger` returns `valid: false` with expected `missing`/`invalid` on negative examples.
- [x] `gsd-tools kb rebuild` exits 0 with ledger counters reported.
- [x] `ledger_entries` table exists in `kb.db` with all 15 columns + 3 indexes (`sqlite_autoindex_ledger_entries_1`, `idx_ledger_phase`, `idx_ledger_disposition`).
- [x] `signals` (278 rows) + `spikes` (8 rows) counts preserved after rebuild (dual-write invariant).
- [x] 629/629 tests pass (`npm test`); 0 regressions.
