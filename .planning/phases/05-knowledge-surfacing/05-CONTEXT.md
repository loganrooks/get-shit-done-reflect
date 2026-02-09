# Phase 5: Knowledge Surfacing - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Existing research workflows automatically consult accumulated knowledge (lessons, spike results) so the system never repeats mistakes or re-runs answered experiments. This phase makes passive knowledge (stored in the knowledge base) active (surfaced when relevant to current work).

</domain>

<decisions>
## Implementation Decisions

### Surfacing triggers

**Which agents surface knowledge:**
- Phase researcher: mandatory check at start of research
- Planner: optional, can query when making decisions
- Debugger: optional, can query when investigating
- Executor: only on deviation (when auto-fixing via Rules 1-3, can query for prior experience with similar issues)

**Mechanism:** Agent-initiated (USER DECISION). Agents explicitly query the knowledge base using Read/Grep on knowledge base paths. No auto-injection into agent prompts. Agent prompts include instructions on how to query.

**Query timing:** Start + on-demand. Researcher does a mandatory initial check, then any agent can re-query mid-workflow when hitting errors or changing direction.

**Re-query cues:** Error patterns (encountering errors triggers knowledge lookup for similar past errors) + agent discretion (agents re-query whenever they judge it helpful).

**Scope:** Full project history. No artificial narrowing -- relevance matching handles filtering.

**Overflow:** Categorize by type (lessons, spike decisions) and pick top entries per category. Preserves diversity of knowledge types.

**What gets surfaced:** Only distilled knowledge (lessons from reflection, spike decisions). Raw signals are NOT surfaced -- they're unprocessed noise. That's what the reflection engine is for.

**Contradictions with current plan:** Agent judgment. Plans may have intentionally chosen a previously-failed approach with mitigations. The agent evaluates whether the contradiction is relevant to the current context.

**No results behavior:** Log explicitly -- "checked knowledge base, no relevant entries found." Helps trace what was/wasn't available.

**Freshness model:** NOT time-based. Knowledge entries have `depends_on` flags that track what could invalidate the entry (specific code patterns, configurations, library versions). If dependency checking is too costly, fall back to a temporal decay heuristic. Core principle: code changes invalidate lessons, not the passage of time (USER INSIGHT).

**Failed phase knowledge:** Include with flag. "We tried X and it failed" is valuable. Flag the entry as from a failed/abandoned phase so agents have context.

### Result presentation

**Visibility:** Both inline citations AND a summary section. Agents cite knowledge inline when applying it ("Based on lesson [L-003], avoiding approach X...") AND include a "Knowledge Applied" section at the end of their output.

**Citation format:** Standardized ID + natural language. Example: "A prior lesson [L-003] found that..." -- grepable but readable.

**Verbosity:** Summary + link. Show the conclusion/recommendation with a file path to the full entry. Agents can drill down if they need rationale.

**Token budget:** Soft cap (~500 tokens of surfaced knowledge). Agents can exceed if the knowledge is genuinely critical, but this prevents context flooding.

**Truncation strategy:** Trim all entries to one-liner summaries first (preserves breadth), then drop lowest relevance entries if still over budget.

**Ordering:** By relevance to the current query. Agent LLM judgment determines ranking.

**Progressive disclosure (OPEN DESIGN QUESTION):** Should surfacing use an explicit two-tier model — present summarized entries as a menu first, then allow drill-in to full entries on demand? The knowledge store already has this layering (index.md summaries → full entry files). Open questions: who drives the drill-in (knowledge researcher agent vs consuming agent), whether to include 1-2 full highest-relevance entries alongside the summary list (hybrid), and how this interacts with the token budget (summaries-only tier vs full-entry tier).

**Unused entries:** Include dismissed entries ONLY if they contradicted the chosen approach. Provides audit trail for when agents actively chose against prior knowledge.

**Knowledge chain (downstream propagation):** Propagate + supplement. Downstream agents see what upstream agents found (no redundant lookups) AND can query for additional knowledge relevant to their specific concerns.

**Propagation form:** Upstream's interpretation. Downstream agents get the conclusion ("Researcher found that approach X failed per [L-003], recommending Y instead"). If they need the original entry, they can query themselves.

**Consistent format:** Consistent core, flexible detail. Same header/ID format across all agent types, but detail level varies (researchers include more context, executors just need the conclusion).

**Debug mode:** Yes, opt-in flag. User can enable verbose knowledge retrieval logging to see all entries that were considered.

**Unverifiable depends_on:** Surface with caveat + temporal decay fallback. If `depends_on` can't be verified, apply a decay heuristic -- older entries with unverifiable dependencies get lower confidence.

**Spike efficiency stat:** At the end of research output, show "Spikes avoided: N (S-002, S-005)" -- clean summary of efficiency gains.

### Relevance matching

**Match strategy:** Hybrid -- index file + tags. A knowledge index maps topics/tags to entry file paths for quick lookup. Entries also have inline tags for filtering. Agents read the index first, then fetch relevant entries.

**Tag granularity:** Hierarchical freeform. No fixed vocabulary, but encourage nesting (e.g., `auth/jwt`, `database/prisma/migrations`). Grep handles partial matching naturally (`grep "auth"` catches both `auth` and `auth/jwt`).

**Stack awareness:** Agent includes stack in query. No magical auto-boost. Agent prompts instruct them to include relevant technologies when querying.

**Partial matches:** Include with lower rank. A lesson about "React performance" is still potentially useful when researching "React state management."

**Ranking method:** Agent LLM judgment. Agent reads one-liner summaries from the index and uses judgment to rank. Tag overlap count is brittle -- LLMs are better at semantic relevance.

**Index maintenance:** Auto-update on write. When the reflector or spike runner writes a new knowledge entry, it updates the index in the same commit.

**Scale:** Trust grep. Realistic project knowledge bases have dozens to low hundreds of entries -- grep on markdown handles this trivially.

**Index richness:** Tags + path + one-liner. Agents can pre-filter from the index without reading every entry.

**Type priority:** Context-dependent by agent role:
- Researchers prefer spike decisions (empirical proof)
- Planners prefer lessons (strategic patterns)
- Debuggers prefer both equally

**Negative tags:** Via depends_on mechanism. `depends_on: NOT monorepo` uses the existing invalidation system. No new concept needed.

**Conflicting entries:** Surface both, flag the conflict. Agent resolves with context. Auto-preferring by recency or confidence is too blunt.

**Query formulation:** Agent instructions, no rigid template. Agents are told what to query for (phase goal, relevant tech, current problem) but formulate queries naturally.

**Cross-domain entries:** Surface for either domain, boost if both match. Entry tagged `auth + database` appears when querying `auth` alone, ranks higher when query touches both.

### Spike deduplication

**Discovery:** Part of the mandatory initial knowledge query. The knowledge index categorizes entries by type, so spike decisions are naturally visible alongside lessons during the initial check. No separate spike-specific step.

**Decision maker:** Agent with guidelines. Agent decides if a spike result applies, but prompts include criteria: same technology, same constraints, same scale, no significant codebase changes since the spike.

**Justification:** Cite + brief justification. "Per spike S-002, using approach X -- same tech stack and constraints apply." Traceability without verbosity.

**Partial match:** Adopt the answered part, note the gap. Let the researcher decide if the unanswered portion warrants a new spike. Avoids both waste (full re-run) and risk (ignoring gaps).

**Confidence threshold:** Surface spike confidence level. Show whether the spike was conclusive or inconclusive. Agent decides whether to adopt or re-run. Inconclusive results still have value but shouldn't be blindly adopted.

**Codebase drift:** depends_on handles this. If depends_on flags hold, the spike is valid regardless of other codebase changes. Agent can apply additional judgment if something feels off.

**Staleness nudge:** Flag but don't suggest. Mark entries that might be stale (unverifiable depends_on + temporal decay). Don't tell agents what to do -- they have the context.

**Superseding:** When a new spike covers the same ground as an old one, new result replaces old in the index (prevents confusion) but links back to old one for historical context.

**Composite answers:** Agent synthesizes from multiple spikes but explicitly flags "composite from S-002, S-005 -- not directly tested as a unit." Avoids unnecessary re-runs while being honest about confidence.

**Incidental answers:** Adopt with lower confidence. If a spike incidentally answered the current question (different hypothesis), use the finding but note it wasn't the primary hypothesis.

### Claude's Discretion
- Tool shape implementation details (how the prompt-injected helper works in practice)
- Exact query formulation patterns per agent type
- Knowledge index file format and structure
- Token counting/estimation approach for the soft cap
- Debug mode flag naming and placement in settings
- How to implement the "Spikes avoided" summary stat
- Temporal decay heuristic formula (when depends_on verification is too costly)

</decisions>

<specifics>
## Specific Ideas

- Freshness is NOT about time -- it's about whether the codebase has changed in ways that invalidate the lesson. `depends_on` flags are the primary mechanism. Temporal decay is the fallback, not the default. (User was emphatic about this distinction)
- The system already has `depends_on` concepts discussed in prior phases -- this phase should leverage that existing mechanism rather than inventing something new
- The executor's existing 4-rule deviation system (auto-fix bugs, add missing critical, fix blocking, ask about architectural) should be preserved. Knowledge surfacing for the executor only activates when Rules 1-3 trigger, giving it additional context for auto-fixes

</specifics>

<deferred>
## Deferred Ideas

- Cross-project knowledge surfacing (lessons from project A surfaced in project B) -- noted for future milestone. NOTE: SC3 in the roadmap requires this; may need roadmap success criteria adjustment or inclusion in this phase during planning.

</deferred>

---

*Phase: 05-knowledge-surfacing*
*Context gathered: 2026-02-06*
