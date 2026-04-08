# Phase 56: KB Schema & SQLite Foundation - Context

**Gathered:** 2026-04-08
**Mode:** Exploratory (--auto: grounded selections only)
**Status:** Ready for planning

<domain>
## Phase Boundary

Signal files support full lifecycle tracking, and a SQLite index makes the knowledge base queryable by structured fields. This phase creates the data substrate — schema evolution, SQLite index creation, migration tooling. Query commands (FTS5, relationship traversal) and lifecycle wiring are Phase 59.

**Requirements:** KB-01, KB-02, KB-03, KB-04a, KB-05, KB-09, KB-10, KB-11
**Depends on:** Phase 55 (complete — upstream correctness substrate merged)

</domain>

<decisions>
## Working Assumptions

### Lifecycle state model [open — critical conflict]
- **KB-01 requirement** specifies: `proposed → in_progress → blocked → verified → remediated`
- **Existing implementation** (knowledge-store.md v2.0.0, Phase 31 decisions, actual signal files) uses: `detected → triaged → remediated → verified → invalidated`
- **Codebase evidence**: 198 signals, those with lifecycle_state use `detected` or `triaged`. The reflector, reconcile-signal-lifecycle.sh, and collect-signals workflow all reference Phase 31 states.
- **Working assumption:** Phase 31's state model (`detected/triaged/remediated/verified/invalidated`) is the correct one — it was explicitly designed for signal lifecycle semantics. KB-01's states (`proposed/in_progress/blocked/verified/remediated`) read like task/issue states and likely represent a requirements drafting error. Researcher must verify this by checking REQUIREMENTS.md authoring context and reconcile with MILESTONE-CONTEXT.md.
- **If confirmed:** Update REQUIREMENTS.md to align KB-01 with existing states. Add `blocked` as a valid state (from KB-01, genuinely useful) if it doesn't conflict with the existing model.

### Schema field evolution [grounded]
- **Current canonical schema:** knowledge-store.md v2.0.0 (agents/knowledge-store.md, lines 80-159)
- **Fields already implemented:** severity, signal_type, polarity, source, lifecycle_state, lifecycle_log, evidence, confidence, confidence_basis, triage, remediation, verification, occurrence_count, related_signals, runtime, model, gsd_version
- **New fields for KB-02 (polarity + disposition):**
  - `signal_category` already in spec (positive/negative) — `polarity` retained for backward compat
  - `response_disposition` (fix/formalize/monitor/investigate) — some signals already have this field (e.g., sig-2026-04-08-no-discuss-milestone-workflow has `response_disposition: formalize`)
- **New fields for KB-03 (qualification links):**
  - `qualified_by` (array of signal/spike IDs) — new field
  - `superseded_by` (string, single signal ID) — new field
  - These enable cross-signal and cross-spike references that Phase 59's traversal commands will query
- **`source` field migration for KB-09:**
  - Current: `source: manual` or `source: automated` (also `auto` in some files)
  - Target: `detection_method` (manual/automated/sensor-artifact/sensor-git/sensor-ci/sensor-log) + `origin` (e.g., "gsdr-artifact-sensor", "user-observation", "reflector")
  - Migration: `source: manual` → `detection_method: manual, origin: user-observation`; `source: automated` / `source: auto` → `detection_method: automated, origin: collect-signals`
  - Old `source` field retained for backward compatibility during migration, removed in a later sweep

### SQLite module structure [grounded]
- **New module:** `get-shit-done/bin/lib/kb.cjs` — follows existing gsd-tools pattern (state.cjs, milestone.cjs, phase.cjs each own their domain)
- **Built-in SQLite:** Uses `node:sqlite` (available in Node >=22.5.0, no external dependencies). KB-11 requires engines.node >=22.5.0 with actionable error message.
- **Schema from research:** kb-architecture-research.md provides a complete SQL schema sketch (signals table, signal_tags, signal_links, spikes table, signal_fts virtual table)
- **Subcommands for Phase 56:** `gsd-tools kb rebuild` (full rebuild from files), `gsd-tools kb stats` (corpus statistics). Query commands (search, query, link, transition) are Phase 59.
- **kb.db location:** `.planning/knowledge/kb.db` — gitignored, rebuildable from files at any time (KB-05 invariant)
- **Router integration:** gsd-tools.cjs routes `kb *` commands to kb.cjs module

### Migration strategy [grounded]
- **198 signals with mixed schemas:** Some have Phase 31 fields (lifecycle_state, lifecycle_log, triage), many don't. Some use `sig-` prefix naming, some use legacy date-only naming.
- **KB-10 requirement:** `kb rebuild` succeeds against current corpus WITHOUT file modification. New fields default gracefully when absent.
- **Two-phase approach:**
  1. `kb rebuild` handles missing fields by applying defaults at index-build time (not by modifying source files). Missing `lifecycle_state` → defaults to `detected`. Missing `polarity` → defaults to `negative`.
  2. Separate `gsd-tools kb migrate` script resolves `source` → `detection_method` + `origin` by modifying source files (KB-09 one-time migration). This IS a file modification — run once, commit results.
- **Error handling:** Malformed signals produce warnings (not crashes). `kb rebuild` reports parse failures per file but continues processing remaining signals.

### Node version requirement [grounded]
- KB-11: `package.json` engines.node updated to `>=22.5.0`
- `kb.cjs` includes version guard at module load: if node:sqlite unavailable, throw actionable error message
- CHANGELOG documents the breaking change
- This is a hard requirement — node:sqlite doesn't exist before 22.5.0

### Dual-write invariant foundation [grounded]
- KB-05: SQLite is a derived cache, files remain source of truth
- Phase 56 establishes the invariant: kb.db can be deleted and rebuilt at any time without data loss
- The actual dual-write enforcement (update both .md frontmatter AND SQLite row on lifecycle transitions) is Phase 59's `kb transition` command
- Phase 56's `kb rebuild` is the "reset" path that proves the invariant holds

### Claude's Discretion
- SQLite table naming and exact column types
- Whether to use WAL mode or default journal mode
- `kb rebuild` CLI output format (summary counts, verbose mode flag)
- Whether `kb stats` shows a table or JSON output
- Index creation strategy (CREATE INDEX vs rebuild-time computation)
- Whether to parse signal body markdown into separate content field or just store file_path

</decisions>

<canonical_refs>
## Canonical References

- `.planning/research/kb-architecture-research.md` — SQLite schema sketch, architecture options analysis
- `agents/knowledge-store.md` — Knowledge store v2.0.0 spec (canonical schema definition)
- `.planning/phases/31-signal-schema-foundation/31-CONTEXT.md` — Phase 31 lifecycle/epistemic decisions
- `.planning/phases/38.1-project-local-knowledge-base/38.1-CONTEXT.md` — KB location migration decisions
- `.planning/MILESTONE-CONTEXT.md` — v1.20 steering brief
- `.planning/REQUIREMENTS.md` lines 24-60 — KB-01 through KB-11 requirements

</canonical_refs>

<specifics>
## Specific Ideas

- The research doc (kb-architecture-research.md) recommends Option A (File + SQLite Index) for v1.20 and Option C (File + SQLite + MCP) for v1.21 — Phase 56 implements Option A
- The epistemic-agency repo finding F37 ("memory intervention > model scaling") supports investing in the KB query layer rather than just throwing more context at agents
- Signal files at `.planning/knowledge/signals/` include files in BOTH project subdirectory (`get-shit-done-reflect/`) AND root-level (legacy signals before Phase 38.1 migration) — `kb rebuild` must handle both locations
- Some signals use `sig-` prefix naming (newer), some use date-only naming (older, e.g., `2026-02-22-scope-creep-unauthorized-new-sections.md`) — both are valid signal files

</specifics>

<deferred>
## Deferred Ideas

- **FTS5 full-text search** (KB-04b) — Phase 59, depends on SQLite index existing
- **Relationship traversal** (KB-04c) — Phase 59, `kb link` command
- **Lifecycle transition command** (KB-06b) — Phase 59, `kb transition` with dual-write
- **Agent KB retrieval** (KB-08) — Phase 59, research/planning agents use SQLite queries
- **MCP server for KB** — v1.21 candidate (Option C from research)
- **Signal/issue ontology merge** — v1.21 territory per research doc

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| Should Phase 56 align KB-01 lifecycle states with Phase 31's existing model? | KB-01 says proposed/in_progress/blocked/verified/remediated; implementation uses detected/triaged/remediated/verified/invalidated. Different state semantics affect ALL downstream phases. | Critical | Pending — researcher must reconcile |
| Should `blocked` (from KB-01) be added as a new state to the Phase 31 model? | `blocked` is a useful state not in the current model. Could be added without disrupting existing transitions. | Medium | Pending |
| Should `kb rebuild` parse signal body markdown for FTS5 indexing now, or defer FTS5 to Phase 59? | Phase 56's success criteria says "all frontmatter fields indexed" — body content indexing is Phase 59's FTS5 work. But the table structure affects both. | Medium | Pending |
| How should the 7 root-level legacy signals (not in project subdirectory) be handled? | They exist at `.planning/knowledge/signals/sig-*.md` outside any project directory. Need to be indexed correctly. | Low | Pending |

---

*Phase: 56-kb-schema-sqlite-foundation*
*Context gathered: 2026-04-08*
*Mode: Exploratory (--auto, grounded-only selections)*
