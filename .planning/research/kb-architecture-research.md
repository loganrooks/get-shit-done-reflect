# KB Architecture & Signal Schema Research for v1.20

**Date:** 2026-04-08
**Mode:** Custom research (KB architecture, signal schema evolution, query layer design)
**Overall confidence:** MEDIUM-HIGH (architecture options well-grounded in codebase evidence and ecosystem patterns; schema recommendations grounded in audit data)

## Executive Summary

The GSD Reflect knowledge base is a file-based system of ~199 entries (198 signals, 1 spike) stored as YAML-frontmatter markdown files in `.planning/knowledge/`. Queries currently work through a shell-script-generated `index.md` that agents read and grep. This system has fundamental limitations: no relational queries across signals, no lifecycle state transitions wired to workflows, no cross-machine discovery, and a flat index that scales linearly. The v1.20 milestone needs to evolve this system without violating the zero-dependency philosophy (no external database servers), without closing doors on v1.21's signal/issue ontology, and without breaking the "files as source of truth" invariant established in MILESTONE-CONTEXT.md.

Three architecture options emerged from research: (A) File + SQLite Index, (B) MCP Server wrapping File + SQLite, and (C) File + SQLite + MCP Server as separate concerns. Option C is recommended. The signal schema should add lifecycle state machine fields, a `disposition` field for response routing, and `qualified_by`/`superseded_by` links -- but must NOT merge signal and issue concepts (that is v1.21 territory).

The epistemic-agency repo provides three directly applicable findings: F21 (dual memory prevents error cycles -- operational + lesson), F32 (progressive abstraction outperforms RAG on raw data), and F37 (memory intervention > model scaling). These support a tiered storage model and the importance of investing in the KB layer rather than just throwing more context at agents.

## Part 1: Architecture Options

### Option A: File + SQLite Index (Recommended for v1.20)

**What it is:** Markdown files remain the canonical store. A SQLite database (`.planning/knowledge/kb.db`) acts as a derived index, rebuilt from files on demand. The existing `kb-rebuild-index.sh` evolves into `gsd-tools kb rebuild` which parses all YAML frontmatter and populates a SQLite database with normalized tables. Queries run against SQLite via `gsd-tools kb query` subcommands.

**Schema sketch:**

```sql
-- Core signal table (one row per signal file)
CREATE TABLE signals (
  id TEXT PRIMARY KEY,         -- sig-2026-04-02-...
  file_path TEXT NOT NULL,     -- relative path to .md file
  project TEXT NOT NULL,
  severity TEXT NOT NULL,      -- critical/notable/minor/trace
  lifecycle TEXT DEFAULT 'detected',
  polarity TEXT DEFAULT 'negative',
  disposition TEXT,            -- fix/formalize/monitor/investigate
  signal_type TEXT,
  created TEXT NOT NULL,       -- ISO timestamp
  updated TEXT,
  phase TEXT,
  plan TEXT,
  runtime TEXT,
  model TEXT,
  gsd_version TEXT,
  occurrence_count INTEGER DEFAULT 1,
  content_hash TEXT            -- for change detection
);

-- Tags (many-to-many)
CREATE TABLE signal_tags (
  signal_id TEXT REFERENCES signals(id),
  tag TEXT NOT NULL,
  PRIMARY KEY (signal_id, tag)
);

-- Qualification links (cross-references)
CREATE TABLE signal_links (
  source_id TEXT REFERENCES signals(id),
  target_id TEXT,              -- can reference signals, spikes, issues
  link_type TEXT NOT NULL,     -- qualified-by, superseded-by, related-to
  PRIMARY KEY (source_id, target_id, link_type)
);

-- Spikes table (similar structure)
CREATE TABLE spikes (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  project TEXT,
  outcome TEXT,                -- confirmed/rejected/partial/inconclusive
  hypothesis TEXT,
  created TEXT,
  status TEXT DEFAULT 'active'
);

-- FTS5 for full-text search over signal bodies
CREATE VIRTUAL TABLE signal_fts USING fts5(id, body, content=signals);
```

**What becomes easy:**
- Relational queries: "show all critical signals with lifecycle=detected, sorted by date"
- Tag-based filtering: "signals tagged `workflow-gap` AND `recurring`"
- Cross-reference traversal: "what signals qualify this one?"
- Lifecycle state reports: "how many signals in each lifecycle state?"
- Occurrence counting: "which signal patterns have occurrence_count > 3?"
- Full-text search across signal bodies (not just frontmatter)
- KB health dashboard: `gsd-tools kb stats` outputs counts by severity, lifecycle, polarity
- Agent queries without reading 199 files: agents read SQLite via CLI, not the filesystem

**What becomes hard:**
- Nothing, because files remain the source of truth
- Minor: rebuild step required after manual file edits (mitigated by hooks or watcher)

**Dependencies:**
- SQLite3 (already available on every platform Claude Code runs on)
- Node.js `better-sqlite3` (one npm dependency) or shell `sqlite3` command

**Risk:** Index drift if files are edited without rebuilding. Mitigated by content hashing -- index rebuild detects changes via hash comparison and only reindexes changed files.

**Precedent:** This is exactly the pattern used by MarkdownDB (npm `mddb` package, 1.5K+ GitHub stars), Palinode (git-native memory with SQLite-vec + FTS5), and sqlite-memory (Markdown-based AI agent memory). All three use markdown files as source of truth with SQLite as derived queryable index. This is a well-validated pattern in the ecosystem.

### Option B: MCP Server (Remote Query Layer)

**What it is:** A dedicated MCP server (`gsd-kb-server`) that exposes KB query tools to Claude Code and Codex CLI. The MCP server reads from the file-based KB (possibly via SQLite index) and provides tools like `kb_search`, `kb_lifecycle_update`, `kb_stats`.

**What becomes easy:**
- Cross-machine queries (MCP servers can run on any machine in the Tailscale mesh)
- Agent-native queries (MCP tools are first-class in Claude Code / Codex)
- Write operations (lifecycle transitions, disposition updates) through validated tool calls
- Future: dashboard via MCP resources

**What becomes hard:**
- Configuration overhead: another MCP server to configure in `~/.claude.json` per machine
- Process management: MCP server needs to be running
- Testing: MCP tool calls harder to test than CLI commands
- Deployment: needs to be deployed to every machine (though Tailscale remote access is an option)
- Offline operation: queries fail if server is down

**Dependencies:**
- MCP SDK (TypeScript or Python)
- Server process management (systemd, docker, or per-session startup)

**Risk:** Over-engineering for current scale (199 entries). MCP server is valuable for cross-machine access, but the single-machine use case is served by CLI. Adding a server to a 199-entry KB introduces operational complexity that doesn't pay back until cross-machine access is genuinely needed.

**Precedent:** Anthropic's own knowledge-graph-memory MCP server uses JSONL files with entity/relation/observation model. The `mcp-knowledge-graph` fork adds project-local `.aim/` directories with global fallback -- same priority pattern as GSD's `.planning/knowledge/` vs `~/.gsd/knowledge/`.

### Option C: File + SQLite Index + MCP Server as Separate Concerns (Recommended Architecture)

**What it is:** Build Option A first (file + SQLite index + CLI). Design the SQLite schema and CLI interface such that an MCP server can wrap it later without redesign. The MCP server becomes a thin wrapper around the same query functions the CLI uses.

**Phase decomposition:**
1. **v1.20:** SQLite index + `gsd-tools kb` CLI subcommands. All agent queries go through CLI.
2. **v1.21 or later:** MCP server wraps the same query functions. Cross-machine access becomes possible. Agent queries can use either CLI or MCP tools.

**Why this ordering:**
- CLI is testable, debuggable, zero-config, works offline
- MCP server adds value only when cross-machine access is needed (currently signals scattered across machines is a problem, but the audit shows 117 of those are on apollo -- a migration/staging problem, not a live query problem)
- CLI-first means the query API is validated before adding server infrastructure
- MCP server wrapper is ~200 lines once CLI functions exist

**What becomes easy:**
- Everything from Option A immediately
- MCP server later without redesign (just wraps CLI functions)
- Progressive capability: CLI now, MCP when cross-machine access is needed

**What becomes hard:**
- Nothing additional beyond Option A
- Slight discipline: CLI functions must be designed as a clean internal API, not shell-script spaghetti

**This is the recommended approach** because it delivers immediate value (queryable index), respects zero-dependency philosophy (SQLite only), and leaves the door open for MCP server without premature complexity.

### Option D: Graph Database (Rejected)

**What it is:** Use Neo4j, ArangoDB, or similar for the KB, modeling signals/spikes/issues as graph nodes with typed edges.

**Why rejected:**
- Violates zero-dependency philosophy (requires running database server)
- Massive over-engineering for 199 entries that grow ~50/milestone
- philograph-mcp learned this lesson: PostgreSQL + pgvector requires Docker, connection management, migration scripts, async session handling. For a project-local KB that an LLM agent reads during workflow execution, this is orders of magnitude too heavy.
- SQLite FTS5 + explicit `signal_links` table provides the relational query capability that graph databases would offer, without the operational burden
- At 10K+ entries, re-evaluate (but that is years away at current growth rate)

## Part 2: Signal Schema Evolution

### Current Schema (from signal-detection.md and existing signal files)

Current signal frontmatter fields:

```yaml
---
id: sig-YYYY-MM-DD-slug
type: signal
project: project-name
tags: [tag1, tag2]
created: ISO-timestamp
updated: ISO-timestamp
durability: workaround|convention|principle
status: active|archived
severity: critical|notable|minor|trace
signal_type: deviation|struggle|config-mismatch|capability-gap|epistemic-gap|baseline|improvement|good-pattern|custom
phase: phase-number
plan: plan-number
polarity: negative|positive|neutral
source: auto|manual
occurrence_count: integer
related_signals: [signal-ids]
runtime: claude-code|opencode|gemini-cli|codex-cli
model: model-identifier
gsd_version: version-string
---
```

### Problems with Current Schema

1. **No lifecycle state machine.** `status: active|archived` is binary. The audit found 0% remediation tracking across 198 signals. The `lifecycle_state` field exists in signal-detection.md spec but most signals use the old `status` field, and no workflow wires transitions.

2. **No positive signal polarity.** `polarity` exists but is `negative|positive|neutral` -- not `mixed`. Audit found 35 positive patterns that need recording; some observations are genuinely mixed (a failure that led to a better outcome).

3. **No disposition routing.** When a signal is detected, what should happen next? Currently nothing -- the signal sits in KB forever. No field captures whether the response should be "fix this in code," "formalize into a convention," "monitor for recurrence," or "investigate deeper."

4. **No qualification links.** Signals exist in isolation. The `related_signals` array provides dedup cross-references but not semantic relationships. A signal can't express "this supersedes that" or "this is qualified by spike X."

5. **Dual naming collision.** `source` field means both "detection method" (auto/manual) and "origin location" (local/external), solved by using `origin` for the latter, but this is messy.

### Recommended Schema Additions for v1.20

**New fields (additive, backward-compatible):**

```yaml
---
# Lifecycle state machine (replaces binary status)
lifecycle: detected|proposed|in_progress|blocked|remediated|verified|invalidated

# Response disposition (what should happen with this signal?)
disposition: fix|formalize|monitor|investigate|defer

# Qualification links (structured cross-references)
qualified_by: []    # IDs of signals/spikes that contextualize this one
superseded_by: ""   # ID of signal that replaces this one (makes this one stale)

# Extended polarity
polarity: negative|positive|mixed|neutral

# Remediation tracking (when lifecycle reaches remediated)
remediation:
  phase: ""         # phase where remediation occurred
  commit: ""        # commit hash of fix
  method: ""        # code-fix|workflow-change|convention|config
  date: ""          # when remediated
  verified: false   # whether remediation was confirmed effective

# Future-proofing for signal-to-issue promotion (v1.21)
# NOT implemented now, but reserved field name
# promoted_to: ""  # issue ID if this signal was promoted
---
```

**Field-by-field justification:**

| Field | Justification | Source |
|-------|---------------|--------|
| `lifecycle` | Audit found 0% remediation tracking (R11). 5-state machine was designed in v1.16 Phase 34 but never wired to workflows. States: detected->proposed->in_progress->blocked->remediated->verified->invalidated. | sig-2026-03-04-signal-lifecycle-representation-gap, MILESTONE-CONTEXT.md |
| `disposition` | Anticipates signal-to-issue promotion (v1.21) without building the full mechanism. Captures the response routing decision: should this be fixed, formalized, monitored, or investigated? | MILESTONE-CONTEXT.md working assumption |
| `qualified_by` | Enables cross-signal and cross-spike references. A signal about "recurring plan accuracy failures" can be qualified by a spike that investigated plan-checker limitations. | MILESTONE-CONTEXT.md working assumption |
| `superseded_by` | When a newer signal captures the same pattern better or when a fix resolves the underlying issue, the old signal should point forward. | Dedup analysis in current signal-detection.md |
| `polarity: mixed` | Audit's positive signal pass found that "failure modes and success modes are not separate." Some observations are genuinely mixed: a failure that led to a productive deviation. | SESSION-HANDOFF.md positive signal analysis |
| `remediation` | Structured tracking of when, how, and whether a remediation was verified. Currently zero signals track this. | sig-2026-03-04-signal-lifecycle-representation-gap |

**What this schema does NOT include (intentionally deferred to v1.21):**

- `promoted_to` -- signal-to-issue promotion mechanism
- `issue_type` -- whether this is a bug, opportunity, or enhancement
- Issue entity type -- a separate entity with its own lifecycle
- KB organization/pruning fields -- how to archive at scale
- Philosophical memory model fields -- tertiary retention, habit vs pure memory

**Why these deferrals matter (Derrida via Thread 6):** The schema IS the system's horizon of possible memory. Adding issue-type fields now would prematurely merge the signal and issue concepts that Thread 1 of pre-v1.20-session-capture.md carefully distinguishes. Signals are observations (indeterminate situations). Issues are problem statements (problematic situations that have been named, bounded, and made investigable). The v1.20 schema should support the transition between these concepts without collapsing the distinction.

### Lifecycle State Machine

```
detected ─────→ proposed ─────→ in_progress ─────→ remediated ─────→ verified
    │               │                │                   │
    │               │                │                   └──→ invalidated
    │               │                └──→ blocked ────────→ (back to proposed)
    │               └──→ defer ─────→ (stays proposed)
    └──→ invalidated (false positive)
```

**Transition triggers (what wires the state machine):**

| Transition | Trigger | Who |
|------------|---------|-----|
| detected -> proposed | Human triage or `/gsdr:reflect` | Manual or reflection engine |
| proposed -> in_progress | Phase plan references signal in `resolves_signals` | Planner (existing field) |
| in_progress -> remediated | Phase completes, plan's SUMMARY.md reports fix | Signal collector post-execution |
| remediated -> verified | Follow-up observation confirms fix holds | Log sensor or manual |
| any -> invalidated | False positive identified | Human or cross-model review |
| in_progress -> blocked | Dependency or blocker identified | Human or executor deviation |

**Critical gap this addresses:** The `resolves_signals` field already exists in plan frontmatter (since v1.16 Phase 34). Nothing currently reads this field post-execution to update signal lifecycle. The simplest wiring: `collect-signals` workflow checks completed plans for `resolves_signals` references and transitions matching signals to `remediated`.

## Part 3: Query Layer Design

### gsd-tools kb Subcommands

The existing `gsd-tools.cjs` (~5,400 lines) is the CLI runtime. KB subcommands would be added as a new command group.

**Recommended subcommands:**

```bash
# Index management
gsd-tools kb rebuild           # Parse all .md files, populate SQLite
gsd-tools kb status            # Show index freshness, entry counts

# Queries
gsd-tools kb query --severity critical --lifecycle detected
gsd-tools kb query --tags "workflow-gap,recurring" --project get-shit-done-reflect
gsd-tools kb query --polarity positive --since 2026-03-01
gsd-tools kb search "plan accuracy"   # FTS5 full-text search

# Stats/Dashboard
gsd-tools kb stats             # Counts by severity, lifecycle, polarity, project
gsd-tools kb health            # KB health: stale signals, missing fields, orphan links

# Lifecycle management
gsd-tools kb transition <signal-id> <new-state> [--reason "..."]
gsd-tools kb link <source-id> <target-id> --type qualified-by
```

**Agent integration:** Agents currently use `grep` on `index.md` per knowledge-surfacing.md. With SQLite, agents would use `gsd-tools kb query --tags "..." --format json` to get structured results. The knowledge-surfacing reference would be updated to prefer `gsd-tools kb query` when available, falling back to `grep` on `index.md` when SQLite is not yet built.

**Output formats:**
- `--format table` (default, human-readable)
- `--format json` (machine-readable, for agent consumption)
- `--format markdown` (for writing to artifacts like RESEARCH.md)

### SQLite as Cache, Not Source

**Critical invariant:** SQLite is a derived artifact. The canonical store is always the `.md` files. This means:

1. `kb.db` can be deleted and rebuilt from files without data loss
2. `kb.db` should be in `.gitignore` (derived artifact)
3. Write operations (lifecycle transitions) update both the `.md` file frontmatter AND the SQLite row
4. Index rebuild is idempotent -- running it twice produces the same result
5. Content hashing detects when files changed since last index -- incremental rebuild

**Why this matters:** The KB data loss incident (sig-2026-02-11-kb-data-loss-migration-gap) happened because KB data lived outside git with no backup. Files in `.planning/knowledge/` are committed to git. SQLite index is derived and reconstructable. No new data loss vector.

## Part 4: Epistemic-Agency Findings Applied

### F21: Dual Memory (Operational + Lesson) Prevents Error Cycles

**Source:** A-MemGuard (2510.02373), HIGH confidence

**Finding:** Maintaining a separate "lesson memory" of failure patterns alongside operational memory prevents the agent from repeating the same errors. The lesson memory is a separate store that the agent consults before acting.

**Application to GSD KB:** The existing KB already has this structure:
- **Signals** = operational memory (what happened)
- **Lessons** = lesson memory (what we learned)
- **Spikes** = empirical memory (what we tested)

But lessons are currently empty (0 entries after v1.13 data loss). The reflection engine (which distills signals into lessons) exists but rarely runs. v1.20 should ensure the reflection pipeline produces lessons from signal patterns -- this is the "lesson memory" that F21 shows prevents error cycles.

**Schema implication:** The `disposition: formalize` value is the promotion path from signal to lesson. When a signal pattern is well-understood enough to become a convention, `disposition: formalize` triggers lesson creation via reflection.

### F32: Progressive Abstraction (Raw -> Analyzed -> Abstracted)

**Source:** (2510.21903), HIGH confidence

**Finding:** Progressive abstraction vastly outperforms RAG on raw data. The hierarchy: raw observations -> analyzed patterns -> abstracted principles. Each level is stored and queryable, but agents are served the appropriate abstraction level for their task.

**Application to GSD KB:** This maps directly to the existing entry types:
- **Raw:** Signal entries (individual observations)
- **Analyzed:** Reflection outputs (pattern detection across signals)
- **Abstracted:** Lessons (distilled principles from patterns)

The current knowledge-surfacing.md already specifies that agents consume lessons (abstracted), not raw signals. But the middle layer (analyzed patterns from reflection) is not persisted -- reflections produce lessons directly. v1.20 could add a "reflection summary" artifact type that captures the analysis without requiring full lesson formalization.

### F37: Memory Intervention > Model Scaling

**Source:** (2603.07670), MED-HIGH confidence

**Finding:** Improving memory architecture produces better capability gains than scaling to larger models. Relevant to the model profile system -- the quality profile uses Opus, but if the KB is better organized and surfaced, even Sonnet-class models could achieve comparable outcomes.

**Application to v1.20:** Prioritize KB queryability improvements (SQLite index, structured surfacing) over model selection optimizations. This aligns with the audit finding that the strongest positive pattern (cross-model review) works through information quality, not model capability.

### F46: MAPE Blind Spot

**Source:** (2510.27051 + GSD-Reflect), MED confidence

**Finding:** Signal systems suffer the MAPE blind spot -- they detect plan-conformance deviations but miss planning failures. The signal collector detects execution deviations but cannot detect that the plan itself was flawed.

**Application to v1.20:** The `disposition` field helps here. Signals about plan accuracy failures should have `disposition: investigate` rather than `disposition: fix`, because the fix is in the planning process, not the execution. The schema should support routing signals to different response mechanisms based on where the problem originates.

## Part 5: Downstream Effect Analysis

### Effect Matrix

| Capability | Option A (File+SQLite) | Option B (MCP Server) | Option C (CLI now, MCP later) |
|-----------|------------------------|----------------------|-------------------------------|
| Local queries | Immediate, fast | Requires server running | Same as A, immediately |
| Cross-machine | Not supported | Supported via Tailscale | Deferred, designed for |
| Agent integration | CLI tool calls | MCP tool calls (native) | CLI now, MCP option later |
| Write operations | CLI commands | MCP tools | CLI now, MCP option later |
| Offline operation | Always works | Fails if server down | Always works (CLI path) |
| Testing | Unit tests on functions | Integration tests on MCP | Unit tests now, integration later |
| Configuration | Zero config (SQLite auto-created) | ~/.claude.json entry per machine | Zero config now |
| Deployment | npm package includes it | Separate server deployment | Incremental |
| KB health monitoring | CLI dashboard | MCP resources | CLI now, MCP dashboard later |
| Index freshness | Hook or manual rebuild | Server watches files | Hook or manual (same as A) |

### What Each Option Makes Easy / Hard for v1.21

| v1.21 Feature | Option A | Option B | Option C |
|---------------|----------|----------|----------|
| Signal-to-issue promotion | SQL schema migration + CLI commands | MCP tool additions | SQL migration + CLI, MCP wrapper later |
| Cross-machine KB sync | Not possible without new infra | Already works | Add MCP server when ready |
| Issue entity type | New SQLite table | New MCP tools | New table + optional MCP |
| KB pruning/archiving | SQL queries to identify candidates | Same, via server | Same as A |
| Automation loop | CLI in hook scripts | MCP in agent specs | CLI in hooks now |

## Part 6: Implementation Recommendations

### What to Build in v1.20

1. **SQLite index schema** -- tables for signals, spikes, tags, links (see Part 2 schema sketch)
2. **`gsd-tools kb rebuild`** -- replaces `kb-rebuild-index.sh` with Node.js that parses YAML frontmatter into SQLite
3. **`gsd-tools kb query`** -- structured queries against SQLite with JSON output
4. **`gsd-tools kb stats`** -- dashboard output for KB health
5. **`gsd-tools kb transition`** -- lifecycle state changes that update both `.md` frontmatter and SQLite
6. **Signal schema additions** -- `lifecycle`, `disposition`, `qualified_by`, `superseded_by`, `polarity: mixed`, `remediation` object
7. **Lifecycle wiring** -- `collect-signals` reads `resolves_signals` from completed plan SUMMARY.md, transitions matching signals to `remediated`
8. **FTS5 full-text index** on signal bodies for `gsd-tools kb search`
9. **Updated knowledge-surfacing.md** -- agents prefer `gsd-tools kb query` when available

### What to Defer

1. **MCP server** -- until cross-machine access is genuinely needed (v1.21+)
2. **Vector embeddings** -- semantic similarity search is not needed at 199 entries; FTS5 + tag matching suffices
3. **Signal-to-issue promotion** -- v1.21 (schema reserves field name but doesn't implement)
4. **KB organization at scale** -- v1.21 (pruning, archiving, re-reading mechanisms)
5. **Continental philosophy grounding** -- v1.22+ (Stiegler, Ricoeur, Bergson, Derrida)
6. **Graph visualization** -- not needed until relationship density warrants it

### Migration Strategy

1. Existing `kb-rebuild-index.sh` continues to work (backward compatibility)
2. New `gsd-tools kb rebuild` produces both `index.md` (for backward compat) AND `kb.db` (new)
3. Existing signal files need no migration -- new fields have defaults
4. New signals written with extended schema; old signals upgraded incrementally (when touched by lifecycle transitions)
5. `kb.db` added to `.gitignore`

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Architecture (File+SQLite) | HIGH | Three open-source precedents (MarkdownDB, Palinode, sqlite-memory), validated pattern, SQLite universally available |
| Signal schema extensions | HIGH | Grounded in audit data (0% remediation), existing spec gaps documented in signal-detection.md |
| Lifecycle state machine | MEDIUM-HIGH | States grounded in audit, but transition triggers need validation against actual workflow execution patterns |
| CLI subcommands | MEDIUM | Design is sound but API surface needs user validation (what queries do agents actually need?) |
| MCP deferral | MEDIUM | Cross-machine access IS a real problem (117 signals on apollo), but staging/migration may be sufficient for v1.20 |
| Schema forward-compatibility | MEDIUM | The signal/issue distinction is well-articulated (Thread 1), but the promotion mechanism is still open |

## Beyond Formal Scope

### Observation 1: The KB Index Script is a Scalability Ceiling

The current `kb-rebuild-index.sh` (198 lines of bash) reads every `.md` file via `grep`, extracts fields line-by-line, and concatenates into a markdown table. At 199 entries this takes ~2 seconds. At 1000 entries it will take ~10 seconds. At 5000 entries it will be unusable. The SQLite migration solves this permanently -- index rebuild with content hashing and incremental updates will be O(changed files), not O(all files).

### Observation 2: The Reflection Pipeline is the Missing Link

The epistemic-agency F21 finding (dual memory) suggests the most impactful v1.20 improvement isn't schema or indexing -- it's ensuring the reflection engine actually runs and produces lessons. Currently: 198 signals, 0 lessons. The reflection engine exists but is never triggered automatically. The signal schema improvements enable lifecycle tracking, but the actual learning loop requires reflection to distill signals into lessons. This should be a v1.20 priority alongside the KB infrastructure.

### Observation 3: Palinode's Hybrid Search is Worth Watching

Palinode (git-native memory for AI agents) uses BM25 + vector search merged with Reciprocal Rank Fusion, with a configurable hybrid weight. For GSD KB at current scale, FTS5 keyword search is sufficient. But if the KB grows and semantic search becomes valuable, Palinode's architecture (same SQLite file, add sqlite-vec extension) provides a migration path without changing the storage model.

### Observation 4: The MCP Knowledge Graph Pattern

Anthropic's knowledge-graph-memory MCP server uses JSONL files with entity/relation/observation triples, project-local `.aim/` directories with global fallback, and semantic search. This is architecturally similar to what GSD KB does (project-local `.planning/knowledge/` with global `~/.gsd/knowledge/` fallback). The key difference: the MCP KG server separates entities from observations (facts about entities accumulate over time). This pattern could inform the v1.21 issue entity type -- an issue is an entity that accumulates signal observations.

### Observation 5: Content Hashing for Change Detection

Both sqlite-memory and Palinode use content hashing to detect changed files and skip re-indexing unchanged ones. This pattern should be adopted for the KB index rebuild -- store the hash of each file's content in SQLite, and on rebuild, only reparse files whose hash changed. This makes incremental rebuild fast even at scale.

### Observation 6: Signal Schema Already Has Naming Collisions

The `source` field means "detection method" (auto/manual) in the signal extension schema (Section 8 of signal-detection.md) but "origin location" (local/external) in the enrichment schema (Section 8.1). The current workaround is using `origin` for the enrichment field. v1.20 should clean this up: `detection_method: auto|manual` and `origin: local|external` as distinct fields. Breaking change, but backward-compatible if the migration defaults `detection_method` from old `source` values.

### Observation 7: philograph-mcp as Anti-Pattern for This Use Case

philograph-mcp uses PostgreSQL + pgvector + Redis + async SQLAlchemy + Docker. This is appropriate for a scholarly research tool with vector similarity search over philosophical texts. It is categorically wrong for a 199-entry project knowledge base queried by shell scripts and agent prompts. The lesson: match infrastructure to scale. SQLite is the right answer for a KB that grows ~50 entries per milestone.

## Sources

**Codebase evidence:**
- `.planning/MILESTONE-CONTEXT.md` -- working assumptions, open questions, derived constraints
- `.planning/knowledge/index.md` -- current 199-entry KB structure
- `get-shit-done/references/signal-detection.md` -- current signal schema spec
- `get-shit-done/references/knowledge-surfacing.md` -- current agent query patterns
- `get-shit-done/bin/kb-rebuild-index.sh` -- current index rebuild implementation
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-04-signal-lifecycle-representation-gap.md` -- 0% lifecycle tracking
- `.planning/knowledge/signals/get-shit-done-reflect/2026-02-11-kb-data-loss-migration-gap.md` -- KB data loss incident
- `.planning/deliberations/pre-v1.20-session-capture.md` -- 11 deliberation threads
- `.planning/audits/session-log-audit-2026-04-07/SESSION-HANDOFF.md` -- audit evidence and design constraints
- `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-survey.md` -- data source inventory

**Epistemic-agency findings:**
- F21: Dual memory (operational + lesson) prevents error cycles (2510.02373, HIGH confidence)
- F32: Progressive abstraction (raw->analyzed->abstracted) outperforms RAG on raw (2510.21903, HIGH confidence)
- F37: Memory intervention > model scaling for capability (2603.07670, MED-HIGH confidence)
- F46: MAPE blind spot -- signal systems miss planning failures (2510.27051, MED confidence)

**Ecosystem references (MEDIUM confidence -- WebSearch verified):**
- [MarkdownDB](https://github.com/datopian/markdowndb) -- Markdown to SQLite index, npm mddb package
- [Palinode](https://github.com/Paul-Kyle/palinode) -- Git-native memory with SQLite-vec + FTS5 + MCP server
- [sqlite-memory](https://github.com/sqliteai/sqlite-memory) -- Markdown-based AI agent memory with hybrid search
- [MCP Knowledge Graph](https://github.com/shaneholloman/mcp-knowledge-graph) -- JSONL entity/relation/observation model with project-local + global fallback
- [Anthropic Knowledge Graph Memory MCP](https://www.pulsemcp.com/servers/modelcontextprotocol-knowledge-graph-memory) -- Official pattern reference

**philograph-mcp (codebase -- anti-pattern for this scale):**
- `src/infrastructure/database/models.py` -- PostgreSQL + pgvector schema
- `src/infrastructure/database/connection.py` -- async connection pooling
- `docs/ARCHITECTURE.md` -- full system architecture (PostgreSQL, Redis, Vertex AI)
