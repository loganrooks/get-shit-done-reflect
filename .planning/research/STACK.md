# Technology Stack

**Project:** GSD Self-Improving Extensions (Signals, Spikes, Knowledge Base)
**Researched:** 2026-02-02
**Overall confidence:** HIGH (patterns are well-established; constraint narrows choices clearly)

## Constraint Recap

- Zero runtime dependencies (Node.js built-ins only)
- File-based storage only (no SQLite, no external services)
- Additive-only changes (fork of upstream, no modifying existing files)
- Consumed by AI runtimes (Claude, etc.) that read Markdown natively

---

## Recommended Stack

### Signal Tracking (Observability)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| JSONL (`.jsonl`) via `fs.appendFileSync` | Node.js built-in | Append-only structured event log | Append-only by nature, corruption-resistant (bad line doesn't break file), streamable, zero deps. Industry standard for structured logging. | HIGH |
| Markdown summary rollups | N/A | Human/AI-readable signal digests | AI runtimes consume Markdown natively. JSONL is for machines; Markdown rollups are for agents to reason over. | HIGH |

**Storage pattern:** `signals/<project-id>/events.jsonl` for raw events, `signals/<project-id>/summary.md` for rolled-up digests.

**Event schema (JSONL line):**
```json
{"ts":"2026-02-02T10:00:00Z","event":"task_complete","phase":"implementation","duration_ms":45000,"meta":{"file_count":3}}
```

**Why JSONL over JSON arrays:** A JSON array requires rewriting the entire file to append. JSONL is `fs.appendFileSync(path, JSON.stringify(event) + '\n')` — one line, atomic on most filesystems, zero parsing of existing content. If a line is corrupted, every other line remains valid. This is the same reason production logging systems (Pino, Bunyan, fluentd) all emit JSONL.

**Why not structured Markdown for raw signals:** Markdown requires parsing to extract structured data. Signals need to be queryable (filter by event type, aggregate durations). JSONL lines are `JSON.parse()` per line — zero dependencies.

### Spike/Experiment Workflow

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Markdown with YAML frontmatter | N/A | Experiment definition and results | Frontmatter provides structured metadata (hypothesis, status, outcome). Body provides rich prose context. AI runtimes read it directly. | HIGH |
| Directory-per-spike convention | N/A | Isolate experiment artifacts | Each spike gets a folder with `spike.md` (definition/results) plus any supporting files (code samples, benchmarks). Clean separation. | HIGH |

**Storage pattern:**
```
spikes/
  2026-02-02-caching-strategy/
    spike.md          # Frontmatter: hypothesis, status, outcome, confidence
    benchmark.jsonl   # Optional: raw data
    notes.md          # Optional: working notes
```

**Spike frontmatter schema:**
```yaml
---
id: 2026-02-02-caching-strategy
hypothesis: "LRU cache with 100-entry limit reduces repeat file reads by 60%"
status: complete        # proposed | active | complete | abandoned
outcome: validated      # validated | invalidated | inconclusive
confidence: high        # high | medium | low
decision: "Implement LRU cache in file reader module"
tags: [performance, caching]
created: 2026-02-02
completed: 2026-02-02
---
```

**Why Markdown+frontmatter over pure JSON:** Experiments need narrative context (why we tried this, what we learned, nuances). JSON can hold structured fields but is hostile to prose. Markdown body is prose-native. YAML frontmatter gives you the structured fields for programmatic access. This is the same pattern used by Hugo, Astro, Obsidian, and the mdbase specification — it is the dominant file-based structured content format.

**Why directory-per-spike over single file:** Experiments produce artifacts (code, benchmarks, screenshots). A directory naturally contains them. A single file cannot.

### Knowledge Base (Persistent Memory)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Markdown with YAML frontmatter | N/A | Knowledge entries (lessons, patterns, decisions) | Same rationale as spikes. AI-readable, human-editable, structured+prose. | HIGH |
| Tag-based indexing via frontmatter | N/A | Cross-project discovery | Tags in frontmatter (`tags: [error-handling, node]`) enable grep-based filtering. No index file needed — `grep -r "tags:.*node" kb/` works. | HIGH |
| Generated index file (`index.md`) | N/A | Precomputed navigation for AI agents | A generated Markdown file listing all entries with their frontmatter summaries. Disposable, regenerated on demand. Avoids agents scanning every file. | MEDIUM |

**Storage pattern:**
```
kb/
  index.md                    # Generated: list of all entries with tags/summaries
  lessons/
    avoid-recursive-glob.md   # Individual lesson
    prefer-jsonl-logging.md
  patterns/
    markdown-frontmatter.md   # Reusable pattern documentation
  decisions/
    no-sqlite.md              # Architectural decision records
```

**Knowledge entry frontmatter:**
```yaml
---
title: "Prefer JSONL for append-only structured data"
tags: [logging, file-io, patterns]
source_project: gsd-reflect
confidence: high
created: 2026-02-02
last_validated: 2026-02-02
---
```

**Why tag-based over directory-based categorization:** A lesson can belong to multiple categories. Tags are multi-valued; directories are single-parent. Tags in frontmatter are greppable without tooling.

**Why a generated index.md:** AI agents have context window limits. Scanning 50 individual files to find relevant knowledge is expensive. A single index file with titles, tags, and one-line summaries lets an agent find what it needs in one read, then fetch the full entry. This is the same pattern as a static site generator's content index.

**Why NOT vector search / embeddings:** Requires external dependencies (FAISS, embedding models). The knowledge base will have tens to low hundreds of entries, not millions. Grep over frontmatter tags and titles is sufficient and zero-dependency. If scale demands it later, a generated JSON index with TF-IDF scores could be added — still zero deps.

---

## Format Decision Matrix

| Data Type | Format | Rationale |
|-----------|--------|-----------|
| Raw events/signals | JSONL | Append-only, line-level atomicity, machine-parseable |
| Summaries/digests | Markdown | AI-native consumption, human-readable |
| Experiment definitions | Markdown + YAML frontmatter | Structured metadata + narrative prose |
| Experiment raw data | JSONL | Same as signals — structured, appendable |
| Knowledge entries | Markdown + YAML frontmatter | Structured metadata + rich content |
| Indexes/caches | Generated Markdown or JSON | Disposable, regenerated from source files |
| Configuration | YAML | Consistent with frontmatter; human-editable |

---

## What NOT to Use (and Why)

### Do NOT use SQLite
- Adds a native binary dependency (better-sqlite3) or a WASM dependency
- Breaks the zero-dependency constraint
- Overkill for the data volumes involved (hundreds of entries, not millions)
- Files in git provide versioning for free; SQLite databases don't diff well

### Do NOT use external services (Datadog, PostHog, etc.)
- Breaks the zero-dependency and file-based constraints
- Adds network dependency to a CLI tool
- Privacy concerns for development workflow data

### Do NOT use JSON arrays for append-only data
- Must read+parse+modify+rewrite entire file to append one entry
- Corruption of any character breaks the entire file
- No streaming read capability
- JSONL solves all these problems

### Do NOT use pure Markdown for structured data extraction
- Parsing Markdown headings/tables to extract structured fields is fragile
- YAML frontmatter provides reliable structured access
- Body content remains free-form Markdown for prose

### Do NOT use a custom query language
- Maintenance burden for marginal benefit
- `grep` over frontmatter + `JSON.parse()` per JSONL line covers all needed queries
- Node.js `readline` interface handles streaming JSONL with zero deps

### Do NOT use vector databases or embeddings
- Requires ML model dependencies (sentence-transformers, FAISS, etc.)
- Knowledge base scale (tens to hundreds of entries) doesn't warrant semantic search
- Tag-based + title grep is sufficient and zero-dependency
- Can revisit if scale reaches thousands of entries (unlikely for dev workflow memory)

### Do NOT use mdbase-spec or MarkdownDB
- mdbase-spec is interesting but draft (v0.1.0) and adds a dependency
- MarkdownDB uses SQLite internally — violates constraint
- The patterns they validate (frontmatter + filesystem = database) are exactly right, but implement them directly with Node.js built-ins rather than taking a dependency

---

## Implementation Primitives (Zero Dependencies)

Every capability needed can be built from these Node.js built-ins:

| Need | Node.js Built-in | Usage |
|------|-------------------|-------|
| Append structured event | `fs.appendFileSync` | Write JSONL line |
| Read structured events | `fs.createReadStream` + `readline` | Stream JSONL lines |
| Parse frontmatter | String split on `---` + `JSON.parse` of a YAML-subset | Or: regex extraction of key-value pairs from simple YAML |
| Write Markdown files | `fs.writeFileSync` | Template literals for frontmatter + body |
| Search by tag/title | `fs.readdirSync` + `fs.readFileSync` + string matching | Scan frontmatter fields |
| Generate index | Read all entries, extract frontmatter, write `index.md` | Run on-demand, output is disposable |
| Timestamps | `new Date().toISOString()` | ISO 8601 everywhere |
| File paths | `path.join`, `path.resolve` | Cross-platform paths |

**YAML frontmatter parsing note:** Full YAML parsing without dependencies is non-trivial (anchors, flow collections, multi-line strings). However, GSD frontmatter only needs simple key-value pairs, arrays, and strings. A ~50 line parser handling `key: value`, `key: [a, b, c]`, and `key: "quoted string"` covers 100% of use cases. Do not attempt to implement full YAML spec.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Signal storage | JSONL files | SQLite | Native dep, no git diffing, overkill |
| Signal storage | JSONL files | CSV | No nested data, quoting hell, no standard for arrays |
| Signal storage | JSONL files | Markdown tables | Can't append without parsing, not machine-friendly |
| Knowledge format | Markdown + frontmatter | JSON files | Hostile to prose, AI runtimes prefer Markdown |
| Knowledge format | Markdown + frontmatter | Obsidian vault | Adds tool dependency, wikilink syntax non-standard |
| Indexing | Generated index.md + grep | SQLite FTS | Dependency; grep is sufficient at this scale |
| Indexing | Generated index.md + grep | Lunr.js / FlexSearch | Runtime dependency |
| Experiment format | Directory + spike.md | Single JSON file | Can't hold artifacts, poor prose support |
| Config | YAML subset | TOML | Another format to parse; YAML already used in frontmatter |

---

## Sources

- [JSONL for Log Processing](https://jsonl.help/use-cases/log-processing/) — JSONL append-only patterns and corruption resilience
- [JSONL vs JSON: When to Use JSON Lines](https://superjson.ai/blog/2025-09-07-jsonl-vs-json-data-processing/) — Format comparison for data processing
- [mdbase Specification](https://mdbase.dev/spec.html) — File-first typed Markdown collections spec (validates the frontmatter+filesystem pattern)
- [mdbase GitHub](https://github.com/callumalpass/mdbase-spec) — Spec source and design principles
- [MarkdownDB](https://markdowndb.com/) — Markdown-to-queryable-index approach (uses SQLite, validates pattern but not dependency choice)
- [Pervane](https://hakanu.github.io/pervane/) — File-based knowledge base with filesystem-as-truth approach
- [Git Repo as Knowledge Base](https://dev.to/adam_b/a-personal-git-repo-as-a-knowledge-base-wiki-j51) — DIY file+git knowledge management pattern
- [Kiro CLI Knowledge Management](https://kiro.dev/docs/cli/experimental/knowledge-management/) — File indexing in AI dev tooling context
- [LogTape](https://logtape.org/manual/struct) — Zero-dependency structured logging (validates zero-dep logging is viable)
