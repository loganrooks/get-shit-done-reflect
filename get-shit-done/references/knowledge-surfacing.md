# Knowledge Surfacing Reference

Reference specification for how agents query, rank, cite, and propagate knowledge from the GSD Knowledge Store. This document is consumed by all agent types via `@get-shit-done/references/knowledge-surfacing.md` references in their `<knowledge_surfacing>` sections.

**Version:** 2.0.0
**Phase:** 59-kb-query-lifecycle-wiring-and-surfacing (Plan 05 rewrite)

---

## 1. Overview

Knowledge surfacing makes passive knowledge active by instructing agents to query and apply it during their workflows. Phase 59 retired the legacy lesson-only surfacing path; the current surface is the **signals + spikes + reflections triad**:

- **Signals** (the signal lifecycle: `detected` -> `triaged` -> `remediated` -> `verified`, with `blocked` and `invalidated` branches) carry lesson-equivalent content in their `remediation.approach`, `lifecycle_log`, and body text. The detected-remediated-verified arc is the authoritative record of what went wrong and how it was fixed.
- **Spikes** carry the outcomes of structured experiments (`hypothesis` + `decision`) and are the durable record of technical decisions the project has already made.
- **Reflections** carry distilled principles and phase-level observations written by the reflection engine; they are the nearest modern analogue to what used to be called lessons.

**Lessons as a distinct entry type were deprecated in v1.19.** Any surviving `les-*` files in `~/.gsd/knowledge/lessons/` remain readable as historical artifacts but are NOT active surface area. New knowledge is captured in the triad above; no new lesson files are created.

**Dual-directory architecture:** The knowledge base is project-local by default (`.planning/knowledge/`, version-controlled) with a user-global fallback (`~/.gsd/knowledge/`). Both locations share the same schema. Agents prefer project-local when present; fall back to user-global otherwise.

**Mechanism:** Agent-initiated (pull-based). Agents explicitly query the knowledge base using the `gsd-tools kb` CLI verbs against the local SQLite index (`kb.db`). No auto-injection into agent prompts. Agent prompt sections instruct when and how to query.

**Fork compatibility:** Agents check if this file exists before applying knowledge surfacing instructions. If `get-shit-done/references/knowledge-surfacing.md` does not exist (upstream GSD without the reflect fork), agents skip knowledge surfacing entirely.

```bash
# Fork detection pattern (used in agent <knowledge_surfacing> sections)
if [ -f "get-shit-done/references/knowledge-surfacing.md" ]; then
  # Apply knowledge surfacing
else
  # Skip -- upstream GSD without reflect fork
fi
```

---

## 2. Query Mechanics

Agents query the KB via **`gsd-tools kb` CLI verbs** against the project-local `kb.db` SQLite index. Fresh clones without a populated `kb.db` (first-run, or corpus that has not yet been rebuilt) fall back to `grep` over markdown files. The grep path is the *fresh-clone fallback* — degraded, but still correct.

The SQL path is always preferred: it supports structured filters, FTS5 full-text search with porter stemming, and index-backed inbound-edge traversal. The grep path exists only so that an agent on a fresh clone does not silently return zero results.

**Why not `rg` in the fallback?** POSIX `grep` is guaranteed on every supported platform (Linux, macOS, BSD). `rg` (ripgrep) is faster but not always installed. Phase 59 standardizes on `grep` for the fresh-clone path; agents that know `rg` is present may substitute locally but the specification uses `grep`.

### 2.1 Step-by-Step Query Process

1. **Determine the query path:**
   ```bash
   # KB path resolution -- project-local primary, user-global fallback
   if [ -d ".planning/knowledge" ]; then
     KB_DIR=".planning/knowledge"
   else
     KB_DIR="$HOME/.gsd/knowledge"
   fi

   # If kb.db exists in KB_DIR, use the SQL path. Otherwise fall back to grep.
   if [ -f "$KB_DIR/kb.db" ]; then
     KB_PATH=sql
   else
     KB_PATH=grep
   fi
   ```

2. **SQL path (preferred):**
   ```bash
   # Structured filter (AND-combined: severity, lifecycle, project, tag, since):
   gsd-tools kb query --tags "auth,jwt" --severity critical --format json

   # Full-text search over signals.title + signals.body (FTS5, porter stemming):
   gsd-tools kb search "refresh token rotation" --format json

   # For every surfaced signal, fetch inbound context (STRUCTURAL, not advisory):
   gsd-tools kb link show <signal-id> --inbound --format json
   ```

   **Step 2c is mandatory, not optional.** When an agent surfaces an older immutable signal, it MUST also fetch the newer signals that qualify or supersede it via `kb link show --inbound`. Skipping the inbound-edge fetch violates the protocol contract — it presents a stale view of an entry whose downstream qualifications have already been recorded. The outbound `related_signals` / `qualified_by` / `superseded_by` fields on the surfaced entry show what IT points to; the inbound edges show what points AT IT. Both directions are required for correct context.

3. **Grep path (fallback — kb.db absent):**
   ```bash
   if [ -d ".planning/knowledge" ]; then KB_DIR=".planning/knowledge"
   else KB_DIR="$HOME/.gsd/knowledge"; fi

   # Tag-based filter via grep over signal frontmatter:
   grep -l "tags:.*auth" "$KB_DIR/signals/"**/*.md

   # Full-text search via grep over body content:
   grep -rli --include="*.md" "refresh token" "$KB_DIR/signals/" "$KB_DIR/spikes/" "$KB_DIR/reflections/"
   ```

   The grep fallback does NOT support porter stemming, structured AND filters, or inbound-edge traversal. Inbound traversal in particular has no tractable grep implementation — it would require re-reading every file in the corpus to invert the edge relation. Agents on the grep path should note this degradation explicitly (`fallback: { engine: 'grep', reason: 'kb.db not found' }` is the JSON shape the SQL verbs emit; grep-path agents should synthesize the same annotation).

4. **Apply relevance matching (§3), freshness (§4), citation (§6), and write the "Knowledge Applied" section (§6.2).**

See `get-shit-done/bin/lib/kb-query.cjs`, `kb-link.cjs`, and `kb-health.cjs` for the authoritative CLI API. The router dispatch lives in `get-shit-done/bin/gsd-tools.cjs` case `'kb'`.

### 2.2 Query Output Reference

The SQL path emits stable JSON envelopes. Signals, spikes, and reflections each have their own shape; `kb query` emits signals, `kb search` emits body-hit matches across signals (FTS5 scope), and `kb link show` emits edges.

**`kb query --format json` envelope (signals):**

```json
{
  "query_params": {
    "tags": ["auth", "jwt"],
    "severity": "critical",
    "lifecycle": null,
    "project": null,
    "since": null,
    "limit": 50
  },
  "results": [
    {
      "id": "sig-2026-02-15-auth-retry-loop",
      "severity": "critical",
      "lifecycle_state": "remediated",
      "project": "my-app",
      "created": "2026-02-15T10:00:00Z",
      "tags": ["auth", "jwt", "retry"]
    }
  ]
}
```

**`kb search --format json` envelope (FTS5 body hits):**

```json
{
  "query": "refresh token rotation",
  "limit": 25,
  "results": [
    {
      "id": "sig-2026-01-28-jwt-refresh",
      "title": "JWT refresh token rotation failure",
      "snippet": "[...] refresh tokens must be rotated [...] on every session [...]",
      "rank": -3.7,
      "lifecycle_state": "verified"
    }
  ]
}
```

**`kb link show --inbound --format json` envelope (edges):**

```json
{
  "signal_id": "sig-2026-01-28-jwt-refresh",
  "direction": "inbound",
  "results": [
    {
      "source_id": "sig-2026-03-04-token-provider-migration",
      "link_type": "qualified_by",
      "target_kind": "signal",
      "created_at": "2026-03-04T14:12:00Z"
    }
  ]
}
```

**Grep-fallback envelope:** same shape as the SQL envelope with an added `fallback: { engine: "grep", reason: "kb.db not found" }` field so callers can distinguish degraded from first-class results.

The index file (`.planning/knowledge/index.md` or `~/.gsd/knowledge/index.md`) remains present for human browsing and for the grep fallback's per-file frontmatter re-parse, but it is NOT the authoritative query surface in v1.20. See `get-shit-done/bin/lib/kb-query.cjs` for the authoritative API.

### 2.3 Cross-Project Querying (SURF-04)

Cross-project knowledge surfacing is architecturally built-in. `kb query` without a `--project` filter returns entries across all projects; `kb query --project <name>` filters to the named project; `kb query --project _global` returns only entries promoted to global scope.

Default behavior: agents query without a project filter so all potentially relevant knowledge surfaces, regardless of originating project.

---

## 3. Relevance Matching

### 3.1 Matching Strategy

Hybrid: structured filter + full-text search + agent judgment. The SQL verbs return candidate entries; the agent ranks final relevance by semantic judgment.

### 3.2 Tag Format

Hierarchical freeform tags with no fixed vocabulary. Nesting is encouraged:
- `auth/jwt`, `auth/oauth`, `auth/sessions`
- `database/prisma/migrations`, `database/postgres`
- `testing/vitest`, `testing/fixtures`

`kb query --tags auth` matches any entry whose tags array contains `auth`; hierarchical matching (`auth/jwt` also matching on `auth`) is agent-judgment territory, not a structured filter feature.

### 3.3 Stack Awareness

Agents include relevant technologies in their query context. No magical auto-boost -- the agent prompt instructs them to consider the current stack (from package.json, CONTEXT.md, RESEARCH.md) when assessing relevance.

### 3.4 Partial Matches

Include with lower rank. A signal about "React performance" is still potentially useful when researching "React state management." Agents use judgment to assess partial relevance.

### 3.5 Ranking Method

Agent LLM judgment. FTS5 produces a rank score (`kb search` sorts by `rank`), but the agent is the final arbiter of which surfaced entries are actually relevant. Rank is a hint, not a mandate.

### 3.6 Conflicting Entries

Surface both, flag the conflict. The agent resolves with full context of the current situation. Auto-preferring by recency or confidence is too blunt -- the older entry may be more applicable to the current case. When a signal is `qualified_by` or `superseded_by` a newer entry, the inbound-edge fetch (§2.1 step 2c) will surface the qualification.

### 3.7 Cross-Domain Entries

An entry tagged `auth + database` appears when querying `auth` alone. It ranks higher when the query touches both domains.

---

## 4. Freshness Checking (depends_on)

### 4.1 Primary Mechanism: depends_on

Knowledge entries may include a `depends_on` field in frontmatter:

```yaml
depends_on:
  - "prisma >= 4.0"
  - "src/lib/auth.ts exists"
  - "NOT monorepo"
```

The `depends_on` field is a documentation field -- agents READ it and use judgment to assess whether conditions still hold. This is NOT an automated verification system.

**Checking process:**
1. Read `depends_on` from entry frontmatter
2. Use judgment to assess whether dependencies still hold:
   - Library version: check package.json if accessible
   - File existence: check if file still exists
   - Negation: check if condition is still false
3. If dependencies hold: entry is fresh, apply normally
4. If dependencies changed: surface with caveat noting the change
   - Example: "Note: [sig-2026-01-15-validate-tokens] depends on Prisma 4.x; current project uses Prisma 5.x -- may need re-evaluation"

The `kb health` verb's Check 4 (`depends_on_freshness`) scans the corpus for populated `depends_on` fields and classifies them into path-resolving / path-dangling / non-path (human-readable conditions). Check 4 is advisory — it never trips the exit-code bitmask — because the ontological limit of "does this condition still hold" cannot be judged programmatically. Agents surface staleness caveats based on their own reading of the `depends_on` list.

### 4.2 Temporal Decay Fallback

When `depends_on` is absent or unverifiable, fall back to temporal decay heuristics:

| Entry Age | Confidence | Treatment |
|-----------|------------|-----------|
| < 30 days | Full confidence | Apply normally |
| 30-90 days | Slight reduction | Apply with minor age note |
| > 90 days | Lower confidence | Apply with age caveat, lower ranking |

**Critical rule:** Never exclude an entry solely based on age. Old knowledge may still be perfectly valid. Surface with caveat rather than suppress.

### 4.3 Failed Phase Knowledge

Include entries from failed or abandoned phases, flagged as such. "We tried X and it failed" is valuable knowledge -- it prevents repeating failed approaches. Signals with `lifecycle_state: invalidated` are the canonical record of "we thought this was a problem but it wasn't"; spikes with `outcome: rejected` are the canonical record of "we tried this approach and it did not work."

---

## 5. Token Budget and Truncation

### 5.1 Budget

**Soft cap:** ~500 tokens of surfaced knowledge. Agents can exceed if knowledge is genuinely critical, but this prevents context flooding.

**Executor exception:** ~200 tokens (deviation context only). Executors have a tighter budget because they only surface knowledge during auto-fix deviations.

### 5.2 Token Estimation

Rough estimation: ~1 token per 4 characters. This is adequate for a soft cap -- exact counting is unnecessary when agents can exceed the cap for critical knowledge.

### 5.3 Truncation Strategy

When surfaced knowledge exceeds the budget:

1. **First pass:** Trim all entries to one-liner summaries (preserves breadth over depth)
2. **Second pass:** If still over budget, drop lowest-relevance entries
3. **Exception:** Agent can exceed budget and note it if knowledge is genuinely critical to the current task

---

## 6. Citation Format and Output

### 6.1 Inline Citations

Use entry IDs in natural language -- grepable and readable:

```
A prior signal [sig-2026-01-15-validate-tokens] (remediated) found that refresh tokens must be validated server-side.
```

```
Per spike [spk-2026-01-20-jwt-refresh-strategy], JWT refresh with rotation is the recommended approach.
```

```
Reflection [reflect-2026-02-01] distilled the principle: "Always verify both access and refresh token expiry before attempting token refresh."
```

### 6.2 Knowledge Applied Summary Section

Include at the end of agent output:

```markdown
## Knowledge Applied

**KB entries consulted:** 3 signals, 1 spike, 1 reflection
**Applied:**
- [sig-2026-01-15-validate-tokens]: Informed auth approach selection
- [spk-2026-01-20-jwt-refresh-strategy]: Prior spike confirms JWT refresh viable
- [reflect-2026-02-01]: Principle cited verbatim in planning

**Dismissed:**
- [sig-2026-01-10-barrel-exports]: Not relevant to current phase

**Spikes avoided:** 1 (spk-2026-01-20-jwt-refresh-strategy)
```

### 6.3 No Results

When no relevant entries are found:

```markdown
## Knowledge Applied

Checked knowledge base, no relevant entries found.
```

### 6.4 Verbosity

Summary + file path link to full entry. Agents show the conclusion/recommendation with a path to the full entry file. Consuming agents can drill down if they need full rationale.

---

## 7. Spike Deduplication (SPKE-08)

Spike deduplication is part of the mandatory initial KB query -- not a separate step. The spike path does NOT interact with signals or reflections; it only queries and compares against existing spikes.

### 7.1 Detection Process

During the initial KB query:

1. Query the spike corpus directly:
   ```bash
   # SQL path:
   gsd-tools kb query --tags "<current-research-tags>" --format json  # returns signals, not spikes
   # For spikes specifically, grep the spikes subdirectory:
   grep -l "tags:.*<tag>" "$KB_DIR/spikes/"**/*.md
   ```
   (A dedicated `kb query --type spike` form is tracked in the Phase 59 deferral ledger under KB-14 / KB-16.)
2. For each spike entry matching the current research question, check if:
   - Tags overlap with current research question or technology
   - `hypothesis` is similar to current question
3. If a matching spike is found, read the full spike entry

### 7.2 Matching Criteria

A prior spike applies when:
- **Same technology** (e.g., both about JWT refresh)
- **Same constraints** (e.g., same framework, same scale requirements)
- **Same scale** (e.g., both targeting similar user counts)
- **No significant codebase changes** that would invalidate the finding (check `depends_on`)

### 7.3 Adopting Spike Results

**Full match:** Adopt the finding, cite it, note as "spike avoided."
```
Per spike [spk-2026-01-20-jwt-refresh], JWT refresh with rotation is the recommended approach -- same tech stack and constraints apply.
```

**Partial match:** Adopt the answered portion, note the gap that still needs investigation.
```
Spike [spk-2026-01-20-jwt-refresh] confirms JWT refresh viability, but didn't test with our specific auth provider. Gap: provider-specific token format.
```

### 7.4 Confidence Levels

Surface the spike's confidence level:
- **confirmed/rejected:** High confidence -- adopt unless `depends_on` flags indicate staleness
- **partial:** Medium confidence -- adopt answered portion, note limitations
- **inconclusive:** Low confidence -- surface as reference, do not adopt blindly

### 7.5 Composite Answers

When multiple spikes together answer a question: synthesize from all applicable spikes, but flag as composite.
```
Composite from [spk-001] and [spk-002] -- not directly tested as a unit.
```

### 7.6 Incidental Answers

When a spike incidentally answered the current question (different primary hypothesis): adopt with lower confidence, noting it was not the spike's primary focus.

### 7.7 End-of-Research Stat

At the end of research output, include:
```
Spikes avoided: N (spk-xxx, spk-yyy)
```

---

## 8. Agent-Specific Behavior

| Agent | Trigger | Query Type | Priority | Budget |
|-------|---------|------------|----------|--------|
| Phase researcher | Mandatory at start + on error/direction change | Signals + spikes + reflections | Spike decisions first, then signals by severity, then reflections | ~500 tokens |
| Planner | Optional, at discretion | Signals + reflections (spikes already in RESEARCH.md) | Strategic signals and distilled principles | ~500 tokens |
| Debugger | Optional, at discretion | Signals + spikes related to error | Both equally | ~500 tokens |
| Executor | ONLY on deviation Rules 1-3 | Signals related to error | Error-relevant signals | ~200 tokens |

**Every agent row includes the same structural step:** after surfacing any candidate signal, fetch its inbound edges via `kb link show <id> --inbound` before citing or applying it. This is mandatory, not advisory (§2.1 step 2c). Skipping the inbound fetch presents a stale view of entries whose downstream qualifications have been recorded.

### 8.1 Phase Researcher

**Mandatory initial check** before beginning external research:
1. Query the KB via `gsd-tools kb query` and `gsd-tools kb search` (SQL path) or grep fallback (fresh clone) for tag overlap with phase technology domain, goal keywords, and specific libraries from CONTEXT.md
2. For each candidate signal, fetch inbound edges via `gsd-tools kb link show <id> --inbound` — mandatory per §2.1 step 2c
3. For matching entries (max 5), read full entry files from `.planning/knowledge/{signals,spikes,reflections}/`
4. Check spike deduplication (Section 7)
5. Incorporate relevant findings into RESEARCH.md
6. Include "Knowledge Applied" section

**Re-query:** On unexpected errors or direction changes during research.

### 8.2 Planner

**Optional querying** at the planner's discretion. Useful when:
- Making technology choices that past signals/reflections may inform
- Structuring tasks where past patterns suggest pitfalls
- Planning for areas where prior spikes resolved uncertainty

Queries **signals + reflections** (the distilled-principles corpus); consults spikes for decided technical questions already addressed by earlier research. Fetches inbound edges via `kb link show --inbound` for every surfaced signal.

### 8.3 Debugger

**Optional querying** at the debugger's discretion. Useful when:
- Investigating errors that may have occurred before
- Debugging issues in technology areas with known quirks

Queries both signals and spikes equally -- prior experiments and distilled signal-history are both relevant for debugging. Fetches inbound edges via `kb link show --inbound` for every surfaced signal.

### 8.4 Executor

**ONLY on deviation (Rules 1-3).** When the executor enters an auto-fix path:
1. Before fixing, check KB for similar past issues:
   ```bash
   # KB path resolution -- project-local primary, user-global fallback
   if [ -d ".planning/knowledge" ]; then KB_DIR=".planning/knowledge"; else KB_DIR="$HOME/.gsd/knowledge"; fi

   # SQL path (preferred):
   gsd-tools kb search "<error-keyword>" --format json
   gsd-tools kb query --tags "<technology>" --format json

   # Grep fallback (kb.db absent):
   grep -i "<error-keyword>" "$KB_DIR/index.md"
   ```
2. If a matching signal exists, fetch its inbound edges via `kb link show --inbound` before applying, then read the full entry
3. Cite in deviation tracking:
   ```
   [Rule 1 - Bug] Fixed auth token refresh (informed by [sig-2026-01-15-validate-tokens])
   ```

**Do NOT query KB:** At plan start, before each task, during normal execution, or when applying Rule 4 (architectural deviation -- checkpoint to user instead).

---

## 9. Knowledge Chain (Downstream Propagation)

### 9.1 Propagation Model

Upstream agents write their KB findings to existing artifacts (RESEARCH.md, PLAN.md). Downstream agents see upstream findings naturally through the standard artifact reading flow:

```
Researcher queries KB
       |
       v
Findings written to RESEARCH.md
       |
       v
Planner reads RESEARCH.md (includes KB findings)
       |
       v
Plan decisions written to PLAN.md
       |
       v
Executor reads PLAN.md (includes KB-informed decisions)
```

### 9.2 Downstream Supplementation

Downstream agents CAN query the KB for additional knowledge relevant to their specific concerns. The researcher's query covers broad relevance; downstream agents may need knowledge specific to their narrower task.

### 9.3 Propagation Form

Upstream agents propagate their interpretation (conclusion, not raw entry). Downstream agents receive: "Researcher found that approach X failed per [sig-003], recommending Y instead." If they need the original entry, they can query directly.

---

## 10. Progressive Disclosure

### 10.1 Two-Tier Model

The knowledge store has progressive disclosure built in:

- **Tier 1: Query envelopes** (`kb query` / `kb search` JSON results) -- compact one-row-per-entry summaries with ID, severity, lifecycle_state, tags, date. Always start here.
- **Tier 2: Full entry files** (individual `.md` files under `.planning/knowledge/{signals,spikes,reflections}/`) -- complete frontmatter, body text, lifecycle_log, evidence. Read on-demand for top matches only.

### 10.2 Agent Flow

For v1.20, agents use this flow:
1. Query via `kb query` / `kb search` (Tier 1)
2. Pick top matches by LLM judgment on the envelope summaries
3. Fetch inbound edges via `kb link show --inbound` for each top match
4. Read full entries for those matches (Tier 2)

No interactive menu or formal drill-in protocol. The two-tier model is applied naturally by reading the envelope first and selectively reading full entries.

---

## 11. Debug Mode

### 11.1 Configuration

Flag: `knowledge_debug` in `.planning/config.json` (default: `false`).

**Checking the config:**
```bash
KNOWLEDGE_DEBUG=$(cat .planning/config.json 2>/dev/null | grep -o '"knowledge_debug"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```

### 11.2 When Enabled (knowledge_debug: true)

Agents include a **"## KB Debug Log"** section listing ALL entries they considered from `kb query` / `kb search` results:

```markdown
## KB Debug Log

| ID | Tags | Relevance | Freshness | Action |
|----|------|-----------|-----------|--------|
| sig-2026-01-15-validate-tokens | auth, jwt | HIGH -- direct tag match | Fresh (depends_on holds) | Applied |
| sig-2026-01-10-barrel-exports | architecture, imports | LOW -- no domain overlap | Fresh | Excluded |
| spk-2026-01-20-jwt-refresh | auth, jwt | HIGH -- same technology | Fresh | Applied (spike avoided) |
```

This section is in addition to the standard "## Knowledge Applied" section.

### 11.3 When Disabled (knowledge_debug: false)

Standard behavior: only the "## Knowledge Applied" section with applied and dismissed entries. No debug logging overhead.

---

*Reference version: 2.0.0*
*Created: 2026-02-07 (v1.0.0); rewritten 2026-04-21 (v2.0.0, Phase 59 Plan 05)*
*Phase: 05-knowledge-surfacing (original), 59-kb-query-lifecycle-wiring-and-surfacing (rewrite)*
