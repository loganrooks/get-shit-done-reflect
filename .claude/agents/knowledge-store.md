---
name: knowledge-store
description: Complete reference specification for the GSD persistent knowledge store. Defines file formats, directory layout, schemas, naming conventions, indexing, lifecycle, and concurrency for all knowledge base operations.
version: 1.0.0
---

# Knowledge Store Reference

## 1. Overview

The GSD Knowledge Store is a persistent, cross-project knowledge base at `~/.gsd/knowledge/`. It stores signals (workflow deviations and struggles), spikes (structured experiments and decisions), and lessons (distilled wisdom from patterns).

**Consumers:** GSD-internal agents only. No external tool integration required.

**Philosophy:** The store is a dumb-but-well-organized filing cabinet. Intelligence lives in the agents that read from it. The store provides structure and conventions; agents provide interpretation and relevance judgment.

**Design principles:**
- Agent-first, human-readable -- optimized for LLM consumption but still legible if a human opens a file
- Zero runtime dependencies -- pure Markdown files with YAML frontmatter
- Files are source of truth -- indexes and caches are derived, never authoritative

## 2. Directory Structure

```
~/.gsd/knowledge/
├── signals/
│   └── {project-name}/
│       └── {YYYY-MM-DD}-{slug}.md
├── spikes/
│   └── {project-name}/
│       └── {spike-name}.md
├── lessons/
│   └── {category}/
│       └── {lesson-name}.md
└── index.md
```

**Project scoping:**
- Signals and spikes are stored under project subdirectories within their type directory
- Project name is derived from the project's root directory name (kebab-case)
- Global entries (not tied to a specific project) use `_global/` as the project subdirectory name
- Lessons are organized by category subdirectory, not by project (lessons transcend individual projects)

**Directory creation:**
- Parent directories are created on first write (mkdir -p)
- Empty directories are not pre-created

## 3. Common Base Schema

All entry types share this YAML frontmatter base:

```yaml
---
id: {type-prefix}-{YYYY-MM-DD}-{slug}
type: signal | spike | lesson
project: {project-name} | _global
tags: [tag1, tag2, tag3]
created: 2026-02-02T14:30:00Z
updated: 2026-02-02T14:30:00Z
durability: workaround | convention | principle
status: active | archived
# depends_on: ["prisma >= 4.0", "src/lib/auth.ts exists"]
---
```

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier: `{type-prefix}-{YYYY-MM-DD}-{slug}` |
| `type` | enum | Entry type: `signal`, `spike`, or `lesson` |
| `project` | string | Project name or `_global` for cross-project entries |
| `tags` | array | Searchable tags from seeded taxonomy + freeform |
| `created` | ISO-8601 | Creation timestamp |
| `updated` | ISO-8601 | Last modification timestamp (same as created for immutable types) |
| `durability` | enum | Knowledge durability class: `workaround`, `convention`, or `principle` |
| `status` | enum | Lifecycle status: `active` or `archived` |

**Optional tracking fields (updated on read):**

| Field | Type | Description |
|-------|------|-------------|
| `retrieval_count` | number | Times this entry has been retrieved by agents |
| `last_retrieved` | ISO-8601 | Last time an agent read this entry |

These fields support future pruning design. Agents should increment `retrieval_count` and update `last_retrieved` when reading an entry for decision-making. Do NOT use these fields for automated decisions yet.

**Optional freshness fields:**

| Field | Type | Description |
|-------|------|-------------|
| `depends_on` | array | Conditions that could invalidate this entry. Each element is a human-readable string describing a dependency (e.g., `"prisma >= 4.0"`, `"src/lib/auth.ts exists"`, `"NOT monorepo"`). Agents read these and use judgment to assess whether the entry is still valid. |

The `depends_on` field supports the knowledge surfacing system's freshness model. When agents retrieve an entry, they check `depends_on` conditions against the current codebase. If conditions no longer hold, the entry is surfaced with a staleness caveat. If `depends_on` is absent, agents fall back to temporal decay heuristics. See `get-shit-done/references/knowledge-surfacing.md` Section 4 for the full freshness checking specification.

## 4. Type-Specific Extensions

### Signal Extensions

Added to frontmatter alongside common base fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `severity` | enum | yes | `critical` or `notable` |
| `signal_type` | enum | yes | `deviation`, `struggle`, `config-mismatch`, `capability-gap`, or `custom` |
| `phase` | number | no | Phase number where signal was captured |
| `plan` | number | no | Plan number where signal was captured |
| `runtime` | enum | no | Runtime that generated this signal: `claude-code`, `opencode`, `gemini-cli`, or `codex-cli` |
| `model` | string | no | LLM model identifier (e.g., `claude-opus-4-6`, `o3`) |

### Spike Extensions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hypothesis` | string | yes | The testable claim being investigated |
| `outcome` | enum | yes | `confirmed`, `rejected`, `partial`, or `inconclusive` |
| `rounds` | number | no | Number of iteration rounds conducted |

### Lesson Extensions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | enum | yes | `architecture`, `workflow`, `tooling`, `testing`, `debugging`, `performance`, or `other` |
| `evidence_count` | number | yes | Number of supporting signals/spikes |
| `evidence` | array | no | List of entry IDs that support this lesson |

## 5. Body Templates

### Signal Body

```markdown
## What Happened

[Factual description of the observed deviation, struggle, or mismatch]

## Context

[Phase, task, and environmental context surrounding the signal]

## Potential Cause

[Agent's assessment of why this happened -- root cause hypothesis]
```

### Spike Body

```markdown
## Hypothesis

[Full statement of the testable claim]

## Experiment

[What was tested, how, and under what conditions]

## Results

[Observed outcomes with data where applicable]

## Decision

[The decision made based on results -- this is the primary output]

## Consequences

[Known tradeoffs, follow-up work, or risks of this decision]
```

### Lesson Body

```markdown
## Lesson

[Concise statement of the learned principle or pattern]

## When This Applies

[Conditions, contexts, or triggers where this lesson is relevant]

## Recommendation

[Actionable guidance for agents encountering similar situations]

## Evidence

[References to supporting signals and spikes by file path or ID]
```

## 6. Seeded Tag Taxonomy

Initial tags organized by concern. Agents may create new tags freely; these provide consistency starting points.

**Type-of-issue:**
- `auth` -- authentication and authorization issues
- `config` -- configuration and environment issues
- `performance` -- speed, memory, or resource issues
- `error-handling` -- missing or incorrect error handling
- `data` -- data integrity, validation, or transformation issues
- `ui` -- user interface and display issues
- `testing` -- test coverage, reliability, or infrastructure issues

**Workflow:**
- `frustration` -- user expressed frustration or confusion
- `deviation` -- plan deviated from expected execution
- `retry` -- repeated attempts to accomplish a task
- `workaround` -- temporary fix for an underlying issue
- `blocked` -- task was blocked by an external dependency

**Domain:**
- Freeform -- agents create domain-specific tags as needed (e.g., `oauth`, `prisma`, `next-auth`, `rate-limiting`)

## 7. Naming Conventions

| Entry Type | Filename Pattern | Example |
|------------|-----------------|---------|
| Signal | `{YYYY-MM-DD}-{slug}.md` | `2026-02-02-auth-retry-loop.md` |
| Spike | `{spike-name}.md` | `jwt-refresh-strategy.md` |
| Lesson | `{lesson-name}.md` | `always-validate-refresh-tokens.md` |

**Slug rules:**
- Kebab-case (lowercase, hyphens between words)
- Derived from entry title or key concept
- Maximum 50 characters
- No special characters beyond hyphens
- Descriptive enough to identify content without opening file

## 8. ID Format

**Pattern:** `{type-prefix}-{YYYY-MM-DD}-{slug}`

**Type prefixes:**

| Type | Prefix | Example |
|------|--------|---------|
| Signal | `sig-` | `sig-2026-02-02-auth-retry-loop` |
| Spike | `spk-` | `spk-2026-01-28-jwt-refresh-strategy` |
| Lesson | `les-` | `les-2026-02-02-always-validate-refresh-tokens` |

**Uniqueness:** IDs are unique across the entire knowledge store. The combination of type prefix, date, and descriptive slug ensures uniqueness. In the unlikely event of a collision, append a numeric suffix (e.g., `-2`).

## 9. Index Format

The index at `~/.gsd/knowledge/index.md` is auto-generated and never hand-edited.

```markdown
# Knowledge Store Index

**Generated:** 2026-02-02T15:00:00Z
**Total entries:** 47

## Signals (23)

| ID | Project | Severity | Tags | Date | Status |
|----|---------|----------|------|------|--------|
| sig-2026-02-02-auth-retry-loop | my-app | high | auth, retry | 2026-02-02 | active |

## Spikes (12)

| ID | Project | Outcome | Tags | Date | Status |
|----|---------|---------|------|------|--------|
| spk-2026-01-28-jwt-refresh-strategy | my-app | confirmed | auth, jwt | 2026-01-28 | active |

## Lessons (12)

| ID | Project | Category | Tags | Date | Status |
|----|---------|----------|------|------|--------|
| les-2026-02-02-always-validate-refresh-tokens | _global | architecture | auth, oauth | 2026-02-02 | active |
```

**Index properties:**
- Header includes generation timestamp and total entry count
- Per-type sections with entry counts in section headers
- One markdown table per type with one row per entry
- Signal key field: Severity
- Spike key field: Outcome
- Lesson key field: Category
- Archived entries (status: archived) are excluded from index
- Files are source of truth; index is a derived cache

**Rebuild process:**
1. Scan all `.md` files under `signals/`, `spikes/`, and `lessons/`
2. Parse frontmatter from each file
3. Skip entries with `status: archived`
4. Write complete index to temporary file (`index.md.tmp`)
5. Rename temporary file to `index.md` (atomic replacement)

## 10. Lifecycle Rules

**No time-based decay.** Time is a poor heuristic for relevance. A principle is just as relevant after 6 months; a workaround becomes irrelevant when the bug is fixed, not when time passes.

**No hard entry caps.** No 50/200 entry limits. If the knowledge base outgrows flat-file storage, evolve the storage layer (sqlite, embeddings) rather than throwing away knowledge.

**No static relevance scores.** Relevance is contextual -- it depends on the current query/situation, not the entry itself.

**Mutability by type:**

| Type | Mutability | Rationale |
|------|-----------|-----------|
| Signal | Immutable after creation | Signals capture a moment in time |
| Spike | Immutable after creation | Spikes capture an experiment and its outcome |
| Lesson | Update-in-place | Lessons represent current knowledge; update `updated` timestamp on modification |

**Archival:**
- Set `status: archived` in frontmatter
- Archived entries remain in their original location (no file moves)
- Archived entries are excluded from the index
- Archival is manual (agent or user decision), not automated

**Retrieval tracking (optional):**
- `retrieval_count` and `last_retrieved` may be updated when agents read entries
- These fields exist for future pruning design -- no automated decisions based on them yet

## 11. Durability Classes

| Class | Durability | Description | Example |
|-------|-----------|-------------|---------|
| `workaround` | Fragile | Tied to external bugs or limitations; likely to become irrelevant when the underlying issue is fixed | "Use --legacy-peer-deps because npm 9.x has a resolution bug" |
| `convention` | Durable | Project-specific patterns; relevant while the project exists and follows this approach | "This project uses barrel exports for all module directories" |
| `principle` | Highly durable | General wisdom applicable across projects and time | "Always validate both access and refresh token expiry before attempting token refresh" |

**Selection guidance for agents:**
- If the knowledge is tied to a specific version, bug, or external limitation: `workaround`
- If the knowledge is a team/project pattern or convention: `convention`
- If the knowledge would apply to any project in any context: `principle`

## 12. Concurrency

**Write safety:**
- Entry files have unique IDs (type prefix + date + slug) preventing write collisions
- Parallel agents writing entries simultaneously write to different files
- No lock files are needed for entry creation

**Index safety:**
- Index rebuild writes to a temporary file first, then renames atomically
- If two agents rebuild the index simultaneously, last-write-wins (both produce valid indexes)
- Index is idempotent -- rebuilding from the same files always produces the same result

**Read safety:**
- Reading entries is always safe (files are immutable or update-in-place with atomic writes)
- Retrieval tracking updates are best-effort -- a missed increment is acceptable

## 13. Promotion Model

**Project to global promotion:**
1. Change `project` field in frontmatter from `{project-name}` to `_global`
2. Move the file from `{type}/{project-name}/` to `{type}/_global/`
3. Rebuild index to reflect the change

**Global entry availability:**
- Global entries (`project: _global`) are available to all projects
- Agents query the index filtering by project name OR `_global` to find relevant entries
- Cross-project queries omit the project filter to search all entries

---

*Specification version: 1.0.0*
*Created: 2026-02-02*
*Phase: 01-knowledge-store*
