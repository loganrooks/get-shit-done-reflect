# Phase Context Template

Template for `.planning/phases/XX-name/{phase}-CONTEXT.md` - captures phase steering context. In discuss mode, captures implementation decisions. In exploratory mode, captures a working model with typed claims, constraints, guardrails, and generative open questions.

**Purpose:** Document decisions (discuss mode) or working model with typed claims (exploratory mode) that downstream agents need. Researcher uses this to know WHAT to investigate. Planner uses this to know WHAT choices are locked vs flexible.

**Key principle:** Categories are NOT predefined. They emerge from what was actually discussed for THIS phase. A CLI phase has CLI-relevant sections, a UI phase has UI-relevant sections.

**Downstream consumers:**
- `gsd-phase-researcher` — Reads decisions to focus research (e.g., "card layout" → research card component patterns)
- `gsd-planner` — Reads decisions to create specific tasks (e.g., "infinite scroll" → task includes virtualization)

---

## File Template

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — the scope anchor. This comes from ROADMAP.md and is fixed. Discussion clarifies implementation within this boundary.]

</domain>

<decisions>
## Implementation Decisions

### [Area 1 that was discussed]
- [Specific decision made]
- [Another decision if applicable]

### [Area 2 that was discussed]
- [Specific decision made]

### [Area 3 that was discussed]
- [Specific decision made]

### Claude's Discretion
[Areas where user explicitly said "you decide" — Claude has flexibility here during planning/implementation]

</decisions>

<specifics>
## Specific Ideas

[Any particular references, examples, or "I want it like X" moments from discussion. Product references, specific behaviors, interaction patterns.]

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<deferred>
## Deferred Ideas

[Ideas that came up during discussion but belong in other phases. Captured here so they're not lost, but explicitly out of scope for this phase.]

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
```

**Note:** The template above shows the discuss-mode variant. In exploratory mode (`workflow.discuss_mode = exploratory`), the `<decisions>` section is replaced with: `<working_model>`, `<constraints>`, `<guardrails>`, `<questions>`, `<dependencies>`. See discuss-phase.md workflow for the full exploratory template. Claims use `[type:verification]` notation per `references/claim-types.md`.

<good_examples>

**Example 1: Visual feature (Post Feed)**

```markdown
# Phase 3: Post Feed - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Display posts from followed users in a scrollable feed. Users can view posts and see engagement counts. Creating posts and interactions are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Layout style
- [decided:reasoned] Card-based layout, not timeline or list -- consistent with existing Card component
- [decided:reasoned] Each card shows: author avatar, name, timestamp, full post content, reaction counts
- [decided:bare] Cards have subtle shadows, rounded corners -- modern feel

### Loading behavior
- [decided:reasoned] Infinite scroll, not pagination -- matches user expectation for social feeds
- [decided:reasoned] Pull-to-refresh on mobile
- [decided:reasoned] New posts indicator at top ("3 new posts") rather than auto-inserting

### Empty state
- [decided:bare] Friendly illustration + "Follow people to see posts here"
- [decided:bare] Suggest 3-5 accounts to follow based on interests

### Claude's Discretion
- Loading skeleton design
- Exact spacing and typography
- Error state handling

</decisions>

<specifics>
## Specific Ideas

- "I like how Twitter shows the new posts indicator without disrupting your scroll position"
- Cards should feel like Linear's issue cards — clean, not cluttered

</specifics>

<deferred>
## Deferred Ideas

- Commenting on posts — Phase 5
- Bookmarking posts — add to backlog

</deferred>

---

*Phase: 03-post-feed*
*Context gathered: 2025-01-20*
```

**Example 2: CLI tool (Database backup)**

```markdown
# Phase 2: Backup Command - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI command to backup database to local file or S3. Supports full and incremental backups. Restore command is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Output format
- [decided:reasoned] JSON for programmatic use, table format for humans -- matches pg_dump convention
- [decided:reasoned] Default to table, --json flag for JSON
- [decided:bare] Verbose mode (-v) shows progress, silent by default

### Flag design
- [decided:reasoned] Short flags for common options: -o (output), -v (verbose), -f (force)
- [decided:reasoned] Long flags for clarity: --incremental, --compress, --encrypt
- [decided:reasoned] Required: database connection string (positional or --db)

### Error recovery
- [decided:reasoned] Retry 3 times on network failure, then fail with clear message
- [decided:bare] --no-retry flag to fail fast
- [decided:reasoned] Partial backups are deleted on failure (no corrupt files)

### Claude's Discretion
- Exact progress bar implementation
- Compression algorithm choice
- Temp file handling

</decisions>

<specifics>
## Specific Ideas

- "I want it to feel like pg_dump — familiar to database people"
- Should work in CI pipelines (exit codes, no interactive prompts)

</specifics>

<deferred>
## Deferred Ideas

- Scheduled backups — separate phase
- Backup rotation/retention — add to backlog

</deferred>

---

*Phase: 02-backup-command*
*Context gathered: 2025-01-20*
```

**Example 3: Organization task (Photo library)**

```markdown
# Phase 1: Photo Organization - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Organize existing photo library into structured folders. Handle duplicates and apply consistent naming. Tagging and search are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Grouping criteria
- [decided:reasoned] Primary grouping by year, then by month -- natural temporal navigation
- [decided:reasoned] Events detected by time clustering (photos within 2 hours = same event)
- [decided:bare] Event folders named by date + location if available

### Duplicate handling
- [decided:reasoned] Keep highest resolution version
- [decided:reasoned] Move duplicates to _duplicates folder (don't delete) -- reversible approach
- [decided:bare] Log all duplicate decisions for review

### Naming convention
- [decided:reasoned] Format: YYYY-MM-DD_HH-MM-SS_originalname.ext -- sortable and searchable
- [decided:reasoned] Preserve original filename as suffix for searchability
- [decided:bare] Handle name collisions with incrementing suffix

### Claude's Discretion
- Exact clustering algorithm
- How to handle photos with no EXIF data
- Folder emoji usage

</decisions>

<specifics>
## Specific Ideas

- "I want to be able to find photos by roughly when they were taken"
- Don't delete anything — worst case, move to a review folder

</specifics>

<deferred>
## Deferred Ideas

- Face detection grouping — future phase
- Cloud sync — out of scope for now

</deferred>

---

*Phase: 01-photo-organization*
*Context gathered: 2025-01-20*
```

**Example 4: Exploratory mode (Search feature)**

```markdown
# Phase 8: Search & Indexing - Context

**Gathered:** 2025-02-15
**Status:** Ready for planning
**Mode:** Exploratory --auto -- preserving uncertainty for researcher

<domain>
## Phase Boundary

Full-text search across documents with relevance ranking. Users can search by content, metadata, and tags. Advanced query syntax is a separate phase.

</domain>

<working_model>
## Working Model & Assumptions

### Indexing approach
**Current state:** Documents stored as markdown in /data/docs/. No existing search infrastructure.

- [assumed:reasoned] Full-text indexing is preferable to grep-based search -- document corpus is ~10K files, grep would be too slow for interactive use
- [open] Choice of search backend: SQLite FTS5 vs Elasticsearch vs Typesense. Depends on deployment constraints and query complexity needs
- [decided:cited] Documents are UTF-8 markdown -- confirmed by `file --mime data/docs/* | grep -c utf-8` returning 100%

### Relevance ranking
- [assumed:bare] TF-IDF is sufficient for initial ranking -- no user feedback data exists yet for learning-to-rank
- [projected:reasoned] Phase 12 will add user feedback signals for ranking refinement -- current ranking must be extensible
- [stipulated:bare] Top-20 results displayed per query -- chosen as default, not derived from evidence

### Claude's Discretion
- Index update strategy (real-time vs batch)
- Result snippet generation approach
- Cache invalidation policy

</working_model>

<constraints>
## Derived Constraints

- **DC-1:** [evidenced:cited] Must work offline -- deployment target has no internet access (requirements.md line 14)
- **DC-2:** [governing:reasoned] No external SaaS dependencies -- project principle from Phase 1 decisions

</constraints>

<guardrails>
## Epistemic Guardrails

- **G-1:** [governing:reasoned] Do not assume corpus size will stay at 10K -- design for 100K as upper bound
- **G-2:** [stipulated:bare] Acceptable search latency: < 200ms p95 for single-term queries

</guardrails>

<questions>
## Open Questions

### Q1: Which search backend fits deployment constraints?
**Research program:** Compare SQLite FTS5, Elasticsearch, and Typesense on: deployment footprint, query capability, index size for 10K-100K markdown docs. Test FTS5 locally with representative corpus subset.
**Downstream decisions affected:** Infrastructure requirements, dependency footprint, query syntax complexity
**Reversibility:** LOW -- search backend is a foundational choice affecting index format, query API, and all downstream features

### Q2: Is TF-IDF ranking sufficient without user signals?
**Research program:** Index 1K representative docs with FTS5, run 20 test queries, evaluate result quality subjectively. Compare with BM25 if available.
**Downstream decisions affected:** Whether Phase 12 ranking refinement is needed sooner
**Reversibility:** MEDIUM -- ranking algorithm is swappable but affects user-facing quality from day one

</questions>

<dependencies>
## Claim Dependencies

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| [stipulated] Top-20 results | [assumed] TF-IDF sufficient | MEDIUM -- if ranking is poor, showing 20 results amplifies bad ordering |
| [projected] Phase 12 feedback signals | [assumed] TF-IDF sufficient for now | LOW -- if TF-IDF is insufficient, Phase 12 becomes urgent but current work is not wasted |
| [decided] UTF-8 markdown | [evidenced] file --mime check | LOW -- if evidence is current, decision is solid |

</dependencies>

<canonical_refs>
## Canonical References

No external specs -- requirements fully captured in working model above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing search infrastructure to build on

### Established Patterns
- Markdown processing utilities in src/lib/markdown.ts

### Integration Points
- Document store in /data/docs/ -- read-only access for indexing

</code_context>

<specifics>
## Specific Ideas

- "Search should feel instant -- like Spotlight on macOS"
- Results should show context snippets with highlighted matches

</specifics>

<deferred>
## Deferred Ideas

- Advanced query syntax (boolean operators, field-specific search) -- Phase 10
- Search analytics dashboard -- add to backlog

</deferred>

---

*Phase: 08-search-indexing*
*Context gathered: 2025-02-15*
```

</good_examples>

<guidelines>
**This template captures DECISIONS for downstream agents.**

The output should answer: "What does the researcher need to investigate? What choices are locked for the planner?"

**Good content (concrete decisions):**
- "Card-based layout, not timeline"
- "Retry 3 times on network failure, then fail"
- "Group by year, then by month"
- "JSON for programmatic use, table for humans"

**Good typed claims (exploratory mode):**
- "[assumed:reasoned] TF-IDF is sufficient -- no user feedback data exists yet"
- "[decided:cited] Card layout -- consistent with existing Card component in src/components/"
- "[open] Choice of search backend -- depends on deployment constraints"
- "[stipulated:bare] 3 retry threshold -- chosen as default"

**Bad typed claims:**
- "[evidenced] It works well" (no citation for evidenced claim)
- "[decided] Modern approach" (too vague, no rationale)
- "[assumed] Standard practice" (no challenge protocol or reasoning)

**Bad content (too vague):**
- "Should feel modern and clean"
- "Good user experience"
- "Fast and responsive"
- "Easy to use"

**After creation:**
- File lives in phase directory: `.planning/phases/XX-name/{phase}-CONTEXT.md`
- `gsd-phase-researcher` uses decisions to focus investigation
- `gsd-planner` uses decisions + research to create executable tasks
- Downstream agents should NOT need to ask the user again about captured decisions
</guidelines>

<open_questions>

## Open Questions

Add to CONTEXT.md during phase discussion:

```markdown
## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| {Question from phase discussion} | {Impact on this phase} | {Critical/Medium/Low} | Pending |

Capture uncertainties during phase discussion. Phase research will attempt to resolve these.
```

**Purpose:** Questions identified during discuss-phase that need investigation before planning. Research agent reads these and either resolves them or flags them as genuine gaps.

**When to add questions:**
- User expresses uncertainty about an approach
- Implementation choice depends on unknown factors
- Technology selection needs validation

**Flow:**
1. Captured here during discuss-phase
2. Research attempts to resolve
3. Unresolved critical questions may trigger spikes
4. Resolved questions inform planning

**Exploratory mode format** (replaces table above when `DISCUSS_MODE` is `exploratory`):

Each question uses generative format specifying how to investigate, not just what to ask:

### QN: [Question title]
**Research program:** [Methodology -- what to read, test, compare]
**Downstream decisions affected:** [What depends on the answer]
**Reversibility:** [HIGH/MEDIUM/LOW -- cost of getting this wrong]

</open_questions>
