# Phase 1: Knowledge Store - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

A file-based persistent knowledge base at `~/.claude/gsd-knowledge/` with directory structure (`signals/`, `spikes/`, `lessons/`), structured markdown files with YAML frontmatter, auto-generated indexing, and entry lifecycle support. This is the storage layer all subsequent phases build on. No relevance ranking, no curation logic, no surfacing — just well-organized, rich storage that agents can read and write to.

</domain>

<decisions>
## Implementation Decisions

### File format & metadata
- Schema design: Claude's discretion — common base with type-specific extensions vs separate schemas
- Tags: Seeded taxonomy with freeform extension — start with common tags, allow agents to create new ones
- Scope: Both project-scoped and global entries with linking/promotion between them
- Body structure: Claude's discretion — required sections per type vs freeform (optimize for downstream agent consumption)
- File location: Claude's discretion — decide where project-scoped vs global entries live given the fork constraint (additive only, new files)
- Promotion model: Claude's discretion — how project entries get promoted to global (avoid stale duplicates)
- Naming: Claude's discretion — human-readable vs ID-based filenames
- Readability: Agent-first, human-readable — optimized for agent consumption but still readable if a human opens a file
- Durability classification: Entries carry a durability class (e.g., workaround/convention/principle) indicating how likely they are to become stale, plus rich context about WHY the knowledge exists
- Staleness hints: Claude's discretion — whether fragile entries carry "check this" pointers for validation
- Inter-entry relationships: Claude's discretion — explicit links vs tag-based implicit connections
- Validation on write: Claude's discretion
- Consumers: GSD-internal only — no need to support external tools

### Lifecycle & relevance model
- **No time-based decay** — time is a poor heuristic for relevance. A principle is just as relevant after 6 months; a workaround becomes irrelevant when the bug is fixed, not when time passes
- **No hard caps** — no 50/200 entry limits. If the KB outgrows flat-file storage, evolve the storage layer (sqlite, embeddings) rather than throwing away knowledge
- **Relevance is contextual** — an entry's relevance depends on the current query/situation, not the entry itself. Static relevance scores are not stored on entries
- **Open design problem: pruning model** — when entries eventually need pruning, the right heuristic is unknown. Candidates include retrieval frequency, cross-project usage, durability class, demonstrated value. Deferred until real data exists to test against (spike or Phase 4 planning)
- **Retrieval metadata tracking**: Claude's discretion — whether to track retrieval counts/dates from day one for future pruning design
- Archival model: Claude's discretion — how stale entries get archived (separate directory vs frontmatter flag)
- Entry versioning: Claude's discretion — new entry vs update-in-place when knowledge evolves

### Index design
- Content per entry: Claude's discretion — minimal vs summary vs rich metadata in index
- Rebuild strategy: Claude's discretion — on every write vs on demand
- Structure: Claude's discretion — single index vs per-type indexes
- Format: Claude's discretion — markdown vs YAML/JSON (consistent with agent-first, human-readable principle)
- Scope handling: Claude's discretion — unified vs separate project/global indexes
- Usage stats in index: Claude's discretion
- Concurrency: Claude's discretion — handle parallel agents writing entries (per-type indexes, lockfile, or last-write-wins)
- Integrity: Claude's discretion — how to handle index/file drift (files are source of truth)
- Abstraction layer: Claude's discretion — whether to build read/write/query abstraction for future storage migration or keep it simple
- Query patterns to support: tag/project search, signal pattern scanning, spike dedup checking, cross-project queries, timeline queries
- Token budget awareness: Claude's discretion — whether index is designed for partial reads or kept compact for full reads
- Grouping: Claude's discretion — how entries are organized beyond type
- Index size management: Claude's discretion — strategy for keeping index useful as entries grow

### Curation strategy
- No curation logic in Phase 1 vs basic utilities: Claude's discretion — scope what belongs here vs Phase 4
- Entry merging (duplicate signals): Claude's discretion — merge on write vs keep separate for reflection engine
- Quality control: Claude's discretion — trust agents vs severity threshold vs approval gates
- Cross-project dedup: Claude's discretion — auto-merge vs flag similarity
- Manual KB management commands: Claude's discretion — whether Phase 1 includes any user-facing KB commands

### Claude's Discretion
All items marked "Claude's discretion" above — Claude has full flexibility during research and planning. The user's key constraints are:
1. No time-based decay
2. No hard entry caps
3. Seeded + freeform tags
4. Both project + global scope with linking
5. Agent-first, human-readable
6. GSD-internal only
7. Durability classification on entries
8. Relevance is contextual, not stored statically
9. Relevance/pruning model is an open design problem — don't lock it in

</decisions>

<specifics>
## Specific Ideas

- "What if instead of capping, if we end up needing more entries, we could migrate to a better storage and lookup system" — the storage layer should be designed knowing it may be replaced, not made permanent
- Relevance discussion surfaced a key distinction: **query relevance** (contextual, per-request) vs **intrinsic/demonstrated value** (cumulative, could be tracked). The right pruning heuristic needs real data to validate
- Durability classes emerged from thinking about what makes knowledge stale: workarounds are fragile (tied to external bugs), conventions are durable (project-specific), principles are durable (general wisdom)
- "The store is a dumb-but-well-organized filing cabinet. The intelligence lives in the agents that read from it."

</specifics>

<deferred>
## Deferred Ideas

- Relevance ranking model — open design problem, defer to spike or Phase 4/5 planning when real data exists
- Storage migration (sqlite, embeddings) — future evolution when flat files are outgrown
- Semantic search / embedding-based retrieval — Phase 5 or beyond

</deferred>

---

*Phase: 01-knowledge-store*
*Context gathered: 2026-02-02*
