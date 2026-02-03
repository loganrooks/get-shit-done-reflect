# Phase 1: Knowledge Store - Research

**Researched:** 2026-02-02
**Domain:** File-based persistent knowledge store (Markdown + YAML frontmatter)
**Confidence:** HIGH

## Summary

The Knowledge Store is a file-based storage layer at `~/.claude/gsd-knowledge/` that holds signals, spikes, and lessons as Markdown files with YAML frontmatter. The domain is well-understood because the existing GSD codebase already uses this exact pattern -- agents read and write Markdown files with YAML frontmatter, parsed line-by-line without external libraries. The entire system runs on zero npm production dependencies.

The implementation requires: directory structure creation, frontmatter schema design for three entry types, an auto-generated index for fast agent lookup, and foundational lifecycle metadata. No time-based decay, no hard caps, no static relevance scores (per CONTEXT.md decisions). The store is a "dumb-but-well-organized filing cabinet" -- intelligence lives in the agents that read from it.

**Primary recommendation:** Build the knowledge store as pure Markdown files with YAML frontmatter, using the same manual line-by-line parsing pattern the existing codebase uses (no new dependencies). Create a reference document (`knowledge-store.md`) that defines the schema, directory layout, and conventions all downstream agents must follow.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | built-in | File read/write operations | Already used throughout GSD; zero dependencies |
| YAML frontmatter (manual parsing) | N/A | Metadata extraction from Markdown | Existing pattern in `bin/install.js` -- line-by-line parsing, no library |
| Markdown | N/A | Entry body content | Native to GSD; agent-first, human-readable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Bash (grep/find) | built-in | Index generation, tag querying | Agent-driven querying via Bash/Grep tools |
| Date (ISO-8601) | built-in | Timestamps in frontmatter | All entry creation/update timestamps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual YAML parsing | gray-matter npm package | Adds production dependency; violates zero-dep philosophy; manual parsing is already proven in codebase |
| Flat Markdown files | SQLite | Adds binary dependency; overkill for expected scale; deferred per CONTEXT.md |
| File-based index | JSON index | JSON is less human-readable; Markdown index can be read by agents directly in context window |

**Installation:**
```bash
# No installation needed -- zero new dependencies
# Directory creation only:
mkdir -p ~/.claude/gsd-knowledge/signals ~/.claude/gsd-knowledge/spikes ~/.claude/gsd-knowledge/lessons
```

## Architecture Patterns

### Recommended Directory Structure
```
~/.claude/gsd-knowledge/
├── signals/
│   └── {project-name}/
│       └── {YYYY-MM-DD}-{slug}.md
├── spikes/
│   └── {project-name}/
│       └── {spike-name}.md
├── lessons/
│   └── {category}/
│       └── {lesson-name}.md
└── index.md                    # Auto-generated, never hand-edited
```

### Pattern 1: Common Base Schema with Type Extensions
**What:** All entry types share a common frontmatter base (id, type, project, tags, created, updated, durability) with type-specific extensions.
**When to use:** Every knowledge store entry.
**Example:**
```markdown
---
# Common base (all types)
id: sig-2026-02-02-auth-retry
type: signal
project: my-app
tags: [auth, retry, frustration]
created: 2026-02-02T14:30:00Z
updated: 2026-02-02T14:30:00Z
durability: workaround
status: active

# Type-specific extensions (signal)
severity: high
signal_type: struggle
phase: 3
plan: 2
---

## What Happened
Authentication retry loop detected during OAuth integration...
```

### Pattern 2: Per-Type Indexes with Unified Summary
**What:** Generate per-type index sections within a single `index.md` file. The index contains one line per entry with key metadata for fast scanning.
**When to use:** After every write operation to the knowledge store.
**Example:**
```markdown
# Knowledge Store Index

**Generated:** 2026-02-02T15:00:00Z
**Total entries:** 47

## Signals (23)

| ID | Project | Severity | Tags | Date | Status |
|----|---------|----------|------|------|--------|
| sig-2026-02-02-auth-retry | my-app | high | auth, retry | 2026-02-02 | active |
| sig-2026-02-01-wrong-model | my-app | medium | config | 2026-02-01 | active |

## Spikes (12)

| ID | Project | Tags | Date | Status |
|----|---------|------|------|--------|
| spk-should-use-jwt | my-app | auth, jwt | 2026-01-28 | active |

## Lessons (12)

| ID | Category | Tags | Durability | Date | Status |
|----|----------|------|------------|------|--------|
| les-always-check-model-profile | workflow | config, model | convention | 2026-02-01 | active |
```

### Pattern 3: Project-Scoped vs Global Entries
**What:** Entries are always stored globally at `~/.claude/gsd-knowledge/` but carry a `project` field in frontmatter. Global entries use `project: _global`. Cross-project querying is done by filtering on project field.
**When to use:** All entries. Promotion from project to global is done by changing the project field to `_global`.
**Why:** Single canonical store avoids stale duplicates. Agents query with or without project filter.

### Pattern 4: Files Are Source of Truth, Index Is Derived
**What:** If index.md and actual files disagree, files win. Index rebuild scans all files and regenerates from scratch.
**When to use:** On any suspicion of drift, or on periodic rebuild.
**Why:** Avoids corruption propagation. Index is a cache, not authoritative.

### Anti-Patterns to Avoid
- **Monolithic knowledge file:** One giant file bloats context window. Use many small files with index for lookup.
- **Editing upstream files:** All changes must be new files. Never modify existing GSD workflows, agents, or commands.
- **Static relevance scores on entries:** Per CONTEXT.md -- relevance is contextual, not intrinsic. Do not store relevance numbers.
- **Time-based decay:** Per CONTEXT.md -- time is a poor heuristic. Workarounds become irrelevant when bugs are fixed, not when time passes.
- **Hard entry caps:** Per CONTEXT.md -- no 50/200 limits. Evolve storage layer instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Full YAML parser | Line-by-line string parsing (existing pattern in `bin/install.js`) | Full parser adds dependency; line-by-line handles the simple key-value frontmatter used in GSD |
| Unique ID generation | UUID library | `{type-prefix}-{date}-{slug}` convention | Human-readable, sortable, no dependency |
| File watching for index updates | fs.watch / chokidar | Regenerate index on write | Agents control all writes; no external mutation to watch for |
| Tag taxonomy enforcement | Schema validation library | Seeded tag list in reference doc + freeform extension | Agents read the reference doc; validation is soft, not enforced by code |
| Concurrency control | Lock files / mutex | Last-write-wins for entries; full rebuild for index | Claude agents are single-threaded per session; parallel agents write different files |

**Key insight:** The knowledge store has zero runtime code. It is a file format specification + directory convention + index generation script. Agents are the "runtime" -- they read the reference doc and follow the conventions. This means the deliverables are primarily Markdown specification documents, not executable code.

## Common Pitfalls

### Pitfall 1: Over-Engineering the Schema
**What goes wrong:** Designing an elaborate schema with many required fields, nested structures, and strict validation that makes it hard for agents to write entries correctly.
**Why it happens:** Treating the knowledge store like a database instead of a file system.
**How to avoid:** Minimal required fields (id, type, project, tags, created, durability, status). Everything else optional. Agents can add freeform fields.
**Warning signs:** More than 10 required frontmatter fields; validation rejecting agent-written entries.

### Pitfall 2: Index Bloat
**What goes wrong:** Index grows too large for a single context window read, defeating its purpose.
**Why it happens:** Including too much detail per entry in the index (full descriptions, all metadata).
**How to avoid:** Index contains only: ID, project, type-specific key field (severity for signals, category for lessons), tags, date, status. One line per entry. Body content stays in individual files.
**Warning signs:** Index exceeds 500 lines; agents start truncating index reads.

### Pitfall 3: Inconsistent File Naming
**What goes wrong:** Files accumulate with inconsistent naming, making grep/glob unreliable.
**Why it happens:** No enforced naming convention; different agents use different patterns.
**How to avoid:** Define naming convention in reference doc: `{YYYY-MM-DD}-{slug}.md` for signals, `{spike-name}.md` for spikes, `{lesson-name}.md` for lessons. Slug derived from entry title, kebab-case.
**Warning signs:** Files with spaces, mixed case, or no date prefix.

### Pitfall 4: Orphaned Project Directories
**What goes wrong:** Project directories accumulate in the knowledge store for projects that no longer exist.
**Why it happens:** No cleanup mechanism when projects are deleted.
**How to avoid:** This is acceptable for Phase 1. Pruning is an open design problem deferred per CONTEXT.md. Track project names in index for visibility.
**Warning signs:** Not a concern yet -- defer to Phase 4.

### Pitfall 5: Forgetting the Fork Constraint
**What goes wrong:** Implementation modifies existing GSD files instead of creating new ones.
**Why it happens:** Natural impulse to add hooks into existing workflows.
**How to avoid:** Every deliverable must be a NEW file. The reference doc and templates are new files. The index generation can be a new script or a new workflow step. No existing file modifications.
**Warning signs:** `git diff` shows changes to files that existed before the fork.

## Code Examples

Verified patterns from the existing codebase:

### Manual YAML Frontmatter Parsing (Existing Pattern)
```javascript
// Source: bin/install.js lines 373-380 (existing GSD pattern)
// This is how the codebase already parses frontmatter -- no library needed
const content = fs.readFileSync(filePath, 'utf8');
if (!content.startsWith('---')) return null;

const endIndex = content.indexOf('---', 3);
if (endIndex === -1) return null;

const frontmatter = content.substring(3, endIndex).trim();
const body = content.substring(endIndex + 3);

const lines = frontmatter.split('\n');
const data = {};
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) continue; // skip comments
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex === -1) continue;
  const key = trimmed.substring(0, colonIndex).trim();
  const value = trimmed.substring(colonIndex + 1).trim();
  // Handle arrays: [tag1, tag2]
  if (value.startsWith('[') && value.endsWith(']')) {
    data[key] = value.slice(1, -1).split(',').map(s => s.trim());
  } else {
    data[key] = value;
  }
}
```

### Entry File Template (Signal)
```markdown
---
id: sig-2026-02-02-auth-retry-loop
type: signal
project: my-app
tags: [auth, retry, error-handling]
created: 2026-02-02T14:30:00Z
updated: 2026-02-02T14:30:00Z
durability: workaround
status: active
severity: high
signal_type: struggle
phase: 3
plan: 2
---

## What Happened

OAuth token refresh logic entered infinite retry loop when refresh token expired.

## Context

During Phase 3 execution of auth integration, the executor attempted token refresh 7 times before the task timed out.

## Potential Cause

Missing check for refresh token expiry -- only access token expiry was handled.
```

### Entry File Template (Lesson)
```markdown
---
id: les-always-validate-refresh-tokens
type: lesson
project: _global
tags: [auth, oauth, token-management]
created: 2026-02-02T16:00:00Z
updated: 2026-02-02T16:00:00Z
durability: convention
status: active
category: architecture
evidence_count: 3
---

## Lesson

Always validate both access token AND refresh token expiry before attempting token refresh.

## When This Applies

Any OAuth or JWT refresh token implementation.

## Recommendation

Check refresh token expiry first. If expired, redirect to re-authentication rather than attempting refresh. Log a clear error distinguishing "access token expired" from "refresh token expired".

## Evidence

- Signal: signals/my-app/2026-02-02-auth-retry-loop.md -- infinite retry on expired refresh token
- Signal: signals/other-project/2026-01-15-token-confusion.md -- similar pattern
- Spike: spikes/my-app/jwt-refresh-strategy.md -- validated approach
```

### Entry File Template (Spike)
```markdown
---
id: spk-jwt-refresh-strategy
type: spike
project: my-app
tags: [auth, jwt, token-management]
created: 2026-01-28T10:00:00Z
updated: 2026-01-28T14:00:00Z
durability: principle
status: active
hypothesis: "Sliding window refresh with short-lived access tokens provides better UX than fixed expiry"
outcome: confirmed
---

## Hypothesis

Sliding window refresh (extend refresh token on use) with 15-minute access tokens provides better UX than fixed 24-hour refresh tokens.

## Experiment

Tested both approaches in isolated spike workspace with simulated user sessions.

## Results

Sliding window reduced re-authentication events by 85% in simulated 8-hour sessions.

## Decision

Use sliding window refresh with 15-minute access tokens and 7-day refresh tokens (extended on use).

## Consequences

- Refresh token storage must handle concurrent updates (multiple tabs)
- Need clear invalidation path for security events (password change)
```

### Index Generation (Bash-based)
```bash
#!/bin/bash
# Generate index.md from all knowledge store entries
# Run after any write to the knowledge store

KB_DIR="$HOME/.claude/gsd-knowledge"
INDEX="$KB_DIR/index.md"

echo "# Knowledge Store Index" > "$INDEX"
echo "" >> "$INDEX"
echo "**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$INDEX"

# Count entries
SIGNAL_COUNT=$(find "$KB_DIR/signals" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
SPIKE_COUNT=$(find "$KB_DIR/spikes" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
LESSON_COUNT=$(find "$KB_DIR/lessons" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
TOTAL=$((SIGNAL_COUNT + SPIKE_COUNT + LESSON_COUNT))

echo "**Total entries:** $TOTAL" >> "$INDEX"
echo "" >> "$INDEX"

# Generate signals section
echo "## Signals ($SIGNAL_COUNT)" >> "$INDEX"
echo "" >> "$INDEX"
echo "| ID | Project | Severity | Tags | Date | Status |" >> "$INDEX"
echo "|----|---------|----------|------|------|--------|" >> "$INDEX"

find "$KB_DIR/signals" -name "*.md" -type f 2>/dev/null | sort -r | while read -r file; do
  # Extract frontmatter fields with simple grep
  id=$(grep "^id:" "$file" | head -1 | sed 's/^id:[[:space:]]*//')
  project=$(grep "^project:" "$file" | head -1 | sed 's/^project:[[:space:]]*//')
  severity=$(grep "^severity:" "$file" | head -1 | sed 's/^severity:[[:space:]]*//')
  tags=$(grep "^tags:" "$file" | head -1 | sed 's/^tags:[[:space:]]*//' | tr -d '[]')
  created=$(grep "^created:" "$file" | head -1 | sed 's/^created:[[:space:]]*//' | cut -c1-10)
  status=$(grep "^status:" "$file" | head -1 | sed 's/^status:[[:space:]]*//')
  echo "| $id | $project | $severity | $tags | $created | $status |" >> "$INDEX"
done

# Similar for spikes and lessons sections...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Database-backed knowledge stores | File-based with Markdown + frontmatter | 2024-2025 (AI agent era) | Zero dependencies; readable by LLMs natively; works in any environment |
| JSON metadata files | YAML frontmatter in Markdown | N/A (convention since Jekyll) | Human-readable metadata + prose in single file |
| Centralized index databases | Auto-generated index files | N/A (static site generator pattern) | No query runtime needed; grep-based search |

**Deprecated/outdated:**
- Static relevance scores: Per CONTEXT.md, relevance is contextual. Not stored on entries.
- Time-based decay: Per CONTEXT.md, replaced by durability classification.
- Hard entry caps: Per CONTEXT.md, replaced by evolutionary storage approach.

## Open Questions

1. **Retrieval metadata tracking**
   - What we know: CONTEXT.md marks this as Claude's discretion -- whether to track retrieval counts/dates from day one
   - What's unclear: Whether the overhead of updating entries on read is worth it without a defined pruning model
   - Recommendation: Track retrieval count and last-retrieved date in frontmatter. Low overhead (one file update per read), provides data for future pruning design. Do NOT use it for automated decisions yet.

2. **Entry versioning strategy**
   - What we know: CONTEXT.md marks this as Claude's discretion -- new entry vs update-in-place
   - What's unclear: Whether lessons should be versioned or simply updated
   - Recommendation: Update-in-place for lessons (they represent current knowledge). Signals are immutable (they capture a moment in time). Spikes are immutable (they capture an experiment). Track `updated` timestamp separately from `created`.

3. **Archival model**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: How to handle entries that are no longer active
   - Recommendation: Use `status: archived` in frontmatter rather than a separate directory. Archived entries stay in place but are excluded from index by default. Simpler than moving files; no broken references.

4. **Concurrency between parallel agents**
   - What we know: GSD spawns parallel agents (e.g., multiple executors per wave)
   - What's unclear: Whether two agents might write to the same file simultaneously
   - Recommendation: Design for no collisions. Entry files have unique IDs (date + slug). Index rebuild is atomic (write to temp file, rename). If two agents write entries simultaneously, they write different files. Index rebuild is idempotent.

5. **Cross-runtime path compatibility**
   - What we know: Claude Code uses `~/.claude/`, OpenCode uses `~/.config/opencode/`, Gemini uses `~/.gemini/`
   - What's unclear: Whether `~/.claude/gsd-knowledge/` is appropriate for all runtimes
   - Recommendation: Use `~/.claude/gsd-knowledge/` as the canonical path for Phase 1 (all runtimes share it). The install.js already handles path remapping. If runtime-specific paths are needed later, add a `knowledge_dir` config option.

## Sources

### Primary (HIGH confidence)
- Existing GSD codebase analysis: `bin/install.js` YAML frontmatter parsing pattern (lines 373-380, 452-466)
- `.planning/codebase/ARCHITECTURE.md` -- multi-layer architecture with command/workflow/agent/template/reference layers
- `.planning/codebase/CONVENTIONS.md` -- naming conventions, zero-dependency philosophy, manual YAML parsing
- `.planning/codebase/STACK.md` -- zero production npm dependencies confirmed
- `.planning/research/ARCHITECTURE.md` -- knowledge store design from project research phase
- `.planning/phases/01-knowledge-store/01-CONTEXT.md` -- user decisions constraining implementation

### Secondary (MEDIUM confidence)
- [gray-matter npm package](https://github.com/jonschlinkert/gray-matter) -- confirmed as standard for YAML frontmatter parsing, but NOT recommended due to zero-dep constraint
- [Basic Memory Knowledge Format](https://docs.basicmemory.com/guides/knowledge-format/) -- validated pattern of YAML frontmatter + categorized observations in Markdown
- [Categorizing Markdown Files for a Scalable Knowledge Base](https://dev.to/hexshift/categorizing-markdown-files-for-a-scalable-knowledge-base-2g4m) -- folder-based organization with frontmatter metadata
- [frontmatter-format convention](https://github.com/jlevy/frontmatter-format) -- generalized YAML frontmatter for CLI tools and AI agents

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; uses existing codebase patterns exclusively
- Architecture: HIGH -- directory structure and file format directly specified by CONTEXT.md and project research
- Pitfalls: HIGH -- derived from concrete codebase constraints (fork-friendly, zero-dep, agent-first)

**Research date:** 2026-02-02
**Valid until:** 2026-04-02 (stable domain -- file-based storage patterns are not fast-moving)
