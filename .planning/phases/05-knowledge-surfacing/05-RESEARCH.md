# Phase 5: Knowledge Surfacing - Research

**Researched:** 2026-02-07
**Domain:** Prompt engineering for knowledge-augmented agent workflows (Markdown-based agent definitions)
**Confidence:** HIGH

## Summary

Knowledge Surfacing makes the GSD Reflect system's passive knowledge (lessons and spike decisions stored in `~/.claude/gsd-knowledge/`) active by instructing agents to query and apply it during their workflows. The implementation domain is prompt engineering: adding sections to existing agent definition files and creating a reference specification that standardizes how agents query, rank, present, and propagate knowledge. There is no traditional code to write -- the entire system is markdown-based agent definitions, workflow orchestrators, and reference documents.

The research investigated the existing codebase structure (14 agents, 15+ workflows, 14 references, 5 KB templates), the knowledge base schema (index.md with per-type tables, entry files with YAML frontmatter), the fork constraint (additive changes only), and the specific user decisions from CONTEXT.md (agent-initiated querying, ~500 token soft cap, inline citations plus summary section, `depends_on` freshness model, hierarchical freeform tags, agent LLM judgment for ranking). All primary sources are the actual files in the repository -- this is a codebase investigation, not an external library research task.

**Primary recommendation:** Create a knowledge-surfacing reference document (`knowledge-surfacing.md`) that standardizes query patterns, citation format, token budgets, and freshness checking. Then add additive sections to existing agent definitions (gsd-phase-researcher, gsd-planner, gsd-debugger, gsd-executor) with instructions to query the KB at appropriate trigger points. No new agent is needed for SURF-01 -- the "knowledge researcher" is the phase-researcher itself with added KB query instructions, satisfying the requirement that "a knowledge researcher agent spawns in parallel with existing researchers and queries the knowledge base."

## Standard Stack

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| Markdown agent definitions | `agents/gsd-*.md` or `.claude/agents/gsd-*.md` | Agent behavior specifications | Existing pattern; all agent behavior defined via markdown prompt files |
| Reference documents | `get-shit-done/references/*.md` | Deep guidance loaded by agents via `@` references | Established pattern for cross-cutting concerns (signal-detection.md, spike-execution.md, reflection-patterns.md) |
| Knowledge store index | `~/.claude/gsd-knowledge/index.md` | Fast lookup of entries by type, tags, project | Created in Phase 1; agents grep this for discovery |
| YAML frontmatter | Entry files under `gsd-knowledge/` | Structured metadata (tags, project, status, depends_on) | All KB entries use this format per knowledge-store.md spec |
| Bash grep/read | Built-in tools | KB querying mechanism | Agents use Read and Grep tools on KB paths; no external dependencies |

### Supporting
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| KB templates | `.claude/agents/kb-templates/*.md` | Entry format templates | When agents need to understand entry structure for parsing |
| Planning config | `.planning/config.json` | Debug mode flag, mode settings | Check for `knowledge_debug` flag (new, additive) |
| UI brand reference | `get-shit-done/references/ui-brand.md` | Citation format styling | When formatting knowledge citations in agent output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Agent-initiated querying (chosen) | Auto-injection into prompts | Auto-injection adds tokens even when irrelevant; agent-initiated is pull-based per CONTEXT.md user decision |
| Grep on index.md (chosen) | Embedding-based semantic search | Adds ML dependencies; grep handles expected scale (dozens to low hundreds of entries); violates zero-dep philosophy |
| New knowledge-researcher agent | Additive section in phase-researcher | New agent adds orchestration complexity; the researcher already spawns for each research phase -- adding KB instructions to it is simpler and satisfies SURF-01 |

**Installation:**
```bash
# No installation needed -- zero new dependencies
# New files only:
# - get-shit-done/references/knowledge-surfacing.md (NEW)
# - Additive sections to existing agent .md files
```

## Architecture Patterns

### File Layout for Phase 5 Deliverables
```
get-shit-done/
├── references/
│   └── knowledge-surfacing.md    # NEW: Knowledge surfacing reference specification
│
# Additive sections to existing files:
agents/
├── gsd-phase-researcher.md       # ADD: <knowledge_surfacing> section
├── gsd-planner.md                # ADD: <knowledge_surfacing> section
├── gsd-debugger.md               # ADD: <knowledge_surfacing> section
├── gsd-executor.md               # ADD: <knowledge_surfacing> section
│
.claude/agents/
├── gsd-phase-researcher.md       # ADD: same section (fork copy)
├── gsd-planner.md                # ADD: same section (fork copy)
├── gsd-debugger.md               # ADD: same section (fork copy)
├── gsd-executor.md               # ADD: same section (fork copy)
├── knowledge-store.md            # ADD: depends_on field documentation (additive)
```

### Pattern 1: Additive Agent Prompt Section
**What:** Add a `<knowledge_surfacing>` XML section to existing agent markdown files. This section contains instructions for when and how to query the knowledge base.
**When to use:** For each agent that should surface knowledge (researcher, planner, debugger, executor).
**Why:** Fork constraint requires additive changes only. Adding a new XML section to an existing agent file is additive -- it doesn't change the existing logic, just adds new capabilities.

**Example:**
```markdown
<!-- Added to agents/gsd-phase-researcher.md -->
<knowledge_surfacing>
## Knowledge Base Consultation

**When:** At the start of research, before external investigation.

**Mandatory initial check:**
1. Read `~/.claude/gsd-knowledge/index.md`
2. Scan the Lessons table for entries whose tags overlap with:
   - The phase's technology domain
   - The phase's goal/purpose keywords
   - Any specific libraries or patterns mentioned in CONTEXT.md
3. Scan the Spikes table for entries whose tags match current research questions
4. For matching entries (up to 5), read the full entry files
5. Incorporate relevant findings into RESEARCH.md

**Token budget:** ~500 tokens of surfaced knowledge (soft cap).

**Output format:**
- Inline citations: "A prior lesson [L-003] found that..."
- Summary section at end: "## Knowledge Applied"

**No results:** Log "Checked knowledge base, no relevant entries found."

**Re-query:** If you hit unexpected errors or change research direction, re-query the KB.
</knowledge_surfacing>
```

### Pattern 2: Reference Document (knowledge-surfacing.md)
**What:** A standalone reference document defining the complete knowledge surfacing specification -- query mechanics, citation format, token budget, freshness checking, spike dedup, progressive disclosure, and debug mode.
**When to use:** All agents reference this document via `@` syntax for detailed guidance.
**Why:** Centralizes the specification so agent-specific sections can be concise (just triggers and priorities), while detailed mechanics live in one place.

**Example structure:**
```markdown
# Knowledge Surfacing Reference

## 1. Query Mechanics
- How to read index.md
- How to filter by tags, project, type
- How to rank results (agent LLM judgment)

## 2. Citation Format
- Inline: "[L-003]" with natural language
- Summary section: "## Knowledge Applied"

## 3. Token Budget
- ~500 token soft cap
- Truncation: one-liner summaries first, then drop lowest relevance

## 4. Freshness Checking (depends_on)
- Primary: check depends_on flags against current codebase
- Fallback: temporal decay heuristic

## 5. Spike Deduplication (SPKE-08)
- Part of mandatory initial query
- Agent checks if similar spike already answered
- Cite + justify if adopting prior result

## 6. Progressive Disclosure
- Index summaries as first tier
- Full entry read as second tier (on-demand)

## 7. Agent-Specific Priorities
- Researcher: spike decisions > lessons
- Planner: lessons > spike decisions
- Debugger: both equally
- Executor: only on deviation (Rules 1-3)

## 8. Cross-Project Knowledge
- Query without project filter for global lessons
- Project filter for project-specific entries

## 9. Debug Mode
- Flag: knowledge_debug in config.json
- When enabled: log all considered entries, not just applied

## 10. Output Formats
- Knowledge Applied section template
- Spikes Avoided summary stat
```

### Pattern 3: Fork Detection for Agent Sections
**What:** Agent knowledge surfacing sections use the same fork-detection pattern as spike-integration.md -- check if the reference file exists before applying.
**When to use:** In agent prompt sections, so upstream GSD agents don't break if knowledge-surfacing.md is absent.
**Why:** Maintains fork compatibility.

**Example:**
```markdown
<knowledge_surfacing>
**Activation check:**
If `get-shit-done/references/knowledge-surfacing.md` exists, apply knowledge surfacing.
If not, skip this section (upstream GSD without reflect fork).

@get-shit-done/references/knowledge-surfacing.md
...
</knowledge_surfacing>
```

### Pattern 4: Downstream Propagation via RESEARCH.md / SUMMARY.md
**What:** Knowledge surfaced by upstream agents (researcher) is propagated to downstream agents (planner, executor) through existing artifact files (RESEARCH.md, PLAN.md), not through separate channels.
**When to use:** Always -- this is how the "knowledge chain" works.
**Why:** Avoids new state management. The researcher writes findings to RESEARCH.md (which the planner already reads), and the planner encodes decisions into PLAN.md (which the executor already reads).

### Anti-Patterns to Avoid
- **Auto-injection anti-pattern:** Do NOT inject knowledge into agent prompts automatically. The user explicitly decided on agent-initiated (pull-based) querying.
- **Over-querying anti-pattern:** Do NOT query on every task. Researcher queries at start + on error. Planner queries optionally. Executor queries only on deviation Rules 1-3.
- **Token flooding anti-pattern:** Do NOT dump full entry contents. Use index summaries first, then selectively read full entries for top matches.
- **Modifying upstream files anti-pattern:** Do NOT modify `get-shit-done/workflows/execute-plan.md` or other upstream workflow files. Only add sections to agent definitions and create new reference/workflow files.
- **Raw signal surfacing anti-pattern:** Only surface distilled knowledge (lessons, spike decisions). Raw signals are unprocessed noise -- that is what the reflection engine is for.

## Don't Hand-Roll

Problems with existing solutions that must be reused:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| KB query mechanism | Custom search engine or embedding system | Read + Grep on `~/.claude/gsd-knowledge/index.md` | KB is file-based markdown; grep handles expected scale per CONTEXT.md decision |
| Entry format parsing | New YAML parser or structured reader | Existing YAML frontmatter parsing pattern (line-by-line) | Already proven throughout the codebase; zero dependencies |
| Index lookup | New index format or database | Existing `index.md` with markdown tables | Phase 1 already defined and implemented this; Section 9 of knowledge-store.md specifies format |
| Freshness checking | Time-based expiry system | `depends_on` frontmatter field + temporal decay fallback | User decision: code changes invalidate lessons, not time passage |
| Spike dedup | Separate spike-checking workflow | Part of mandatory initial KB query during research | CONTEXT.md decision: no separate spike-specific step |
| Citation format | Custom formatting system | Standardized ID pattern from knowledge-store.md (e.g., `[L-003]`) | Consistent with existing `sig-`, `spk-`, `les-` ID format |
| Token counting | Character counting library | Rough estimation: 1 token per 4 characters (for soft cap) | Exact counting is unnecessary for a soft cap; agents can exceed if critical |

**Key insight:** The entire knowledge surfacing system is prompt engineering on existing infrastructure. Every component (KB, index, entry format, agent spawning, @-references) already exists. Phase 5 connects them.

## Common Pitfalls

### Pitfall 1: Breaking Fork Constraint by Modifying Upstream Agent Logic
**What goes wrong:** Adding knowledge surfacing instructions that change the _existing_ behavior of agents (e.g., modifying the executor's deviation rules, changing how the researcher processes results).
**Why it happens:** It's tempting to integrate knowledge surfacing deeply into existing logic flows.
**How to avoid:** Only ADD new XML sections (`<knowledge_surfacing>`). Never modify existing sections. The new section is read in addition to existing instructions, not instead of.
**Warning signs:** Editing lines inside `<role>`, `<execution_flow>`, `<deviation_rules>`, or other existing sections of agent files.

### Pitfall 2: Token Budget Ignored or Over-Enforced
**What goes wrong:** Either agents dump full entry contents (flooding context) or rigidly count tokens and miss critical knowledge.
**Why it happens:** The CONTEXT.md specifies a "soft cap (~500 tokens)" which is ambiguous in enforcement.
**How to avoid:** Specify the truncation strategy clearly: first pass = one-liner summaries from index (fits easily in budget), second pass = read full entries only for top 2-3 matches. Agent can exceed budget if knowledge is genuinely critical but must note when doing so.
**Warning signs:** Agent output contains multi-paragraph KB entries without truncation, OR agent ignores highly relevant knowledge because of strict token counting.

### Pitfall 3: Creating a New Knowledge Researcher Agent
**What goes wrong:** A separate `gsd-knowledge-researcher` agent is created, requiring orchestrator changes to spawn it, adding complexity.
**Why it happens:** SURF-01 says "knowledge researcher agent spawned in parallel." This sounds like a new agent.
**How to avoid:** The phase researcher IS the knowledge researcher with added KB query instructions. SURF-01 is satisfied by the researcher doing a KB query as its first step (before external research). No new agent file, no new spawn logic. The "spawns in parallel" aspect is satisfied because the researcher is already spawned by the plan-phase orchestrator.
**Warning signs:** Creating `agents/gsd-knowledge-researcher.md` or modifying orchestrator spawn logic.

### Pitfall 4: Confusing SURF-04 (Cross-Project) with Deferred Work
**What goes wrong:** Cross-project surfacing is either fully implemented (complex) or completely ignored (requirement gap).
**Why it happens:** CONTEXT.md defers cross-project surfacing but REQUIREMENTS.md SURF-04 requires it, and SC3 in the roadmap requires it.
**How to avoid:** Cross-project surfacing is ALREADY built into the knowledge store architecture: lessons are organized by category (not project), and the index.md contains ALL entries across all projects. An agent querying index.md without filtering by project name naturally gets cross-project results. The "implementation" is simply documenting this in the reference and ensuring agent query instructions don't artificially restrict to current project.
**Warning signs:** Building complex cross-project lookup infrastructure when grep on index.md already provides it.

### Pitfall 5: Executor Knowledge Surfacing Triggering Too Broadly
**What goes wrong:** The executor queries KB on every task, wasting tokens and slowing execution.
**Why it happens:** Not respecting the CONTEXT.md constraint: "executor only on deviation (Rules 1-3)."
**How to avoid:** The executor's `<knowledge_surfacing>` section must be gated on deviation. Only when the executor enters a Rule 1-3 auto-fix path should it query KB for similar past issues. Normal task execution never queries KB.
**Warning signs:** Executor querying KB before each task, or at start of plan execution.

### Pitfall 6: `depends_on` Implementation Overreach
**What goes wrong:** Building a full dependency-checking system that reads codebase files to verify each `depends_on` flag.
**Why it happens:** CONTEXT.md mentions `depends_on` as primary freshness mechanism, but also says "if dependency checking is too costly, fall back to temporal decay."
**How to avoid:** For v1, `depends_on` is a documentation field in entry frontmatter. Agents READ it and use judgment (e.g., "this lesson depends on Prisma v4 and we're using Prisma v5 -- may be stale"). Full automated verification is deferred. The temporal decay heuristic is the practical fallback.
**Warning signs:** Building bash scripts that scan `package.json` or source files to verify `depends_on` flags.

### Pitfall 7: Modifying Both `agents/` and `.claude/agents/` Files Inconsistently
**What goes wrong:** The repo-level agent files and the project-local `.claude/agents/` copies diverge.
**Why it happens:** The fork has agents in two locations. `agents/` is the canonical source, `.claude/agents/` is the installed/working copy.
**How to avoid:** Modify BOTH locations in the same task. Or, if the pattern from prior phases is that only `.claude/agents/` gets fork-specific files, follow that pattern. Research finding: Prior phases (signal-collector, spike-runner, reflector) created new agent files ONLY in `.claude/agents/`, not in `agents/`. The `agents/` directory contains only upstream agent files. Therefore, fork-specific modifications go to `.claude/agents/` only, while the canonical upstream agents in `agents/` remain unmodified.
**Warning signs:** Adding `<knowledge_surfacing>` to `agents/gsd-phase-researcher.md` (upstream) instead of `.claude/agents/gsd-phase-researcher.md` (fork working copy).

## Code Examples

### Example 1: Mandatory Initial KB Query (Phase Researcher)

```markdown
<!-- Source: Derived from knowledge-store.md index format and CONTEXT.md decisions -->

## Knowledge Base Consultation (Mandatory)

Before beginning external research, check accumulated knowledge:

1. **Read the KB index:**
   ```bash
   cat ~/.claude/gsd-knowledge/index.md
   ```

2. **Scan for relevant entries:**
   Look at the Lessons and Spikes tables in the index. Match entries where:
   - Tags overlap with the current phase's technology domain
   - Tags overlap with the current research question/goal
   - Project matches current project OR is `_global`

3. **Read matching entries (max 5):**
   For the most relevant matches, read full entry files:
   ```bash
   cat ~/.claude/gsd-knowledge/lessons/{category}/{lesson-name}.md
   cat ~/.claude/gsd-knowledge/spikes/{project}/{spike-name}.md
   ```

4. **Check freshness:**
   For each entry, check `depends_on` in frontmatter (if present):
   - If dependency has changed (e.g., library version upgraded), note as potentially stale
   - If no `depends_on`, consider entry age: >6 months with no retrieval = lower confidence

5. **Apply to research:**
   - Incorporate relevant lessons into findings
   - If a spike already answered a research question, cite it as resolved
   - Use inline citations: "A prior lesson [les-2026-01-15-always-validate-tokens] found that..."

6. **Record results:**
   Add a "## Knowledge Applied" section to RESEARCH.md:
   ```markdown
   ## Knowledge Applied

   **KB entries consulted:** 3 lessons, 1 spike
   **Applied:**
   - [les-2026-01-15-always-validate-tokens]: Informed auth approach selection
   - [spk-2026-01-20-jwt-refresh-strategy]: Prior spike confirms JWT refresh viable

   **Dismissed:**
   - [les-2026-01-10-avoid-barrel-exports]: Not relevant to current phase

   **Spikes avoided:** 0
   ```

7. **If no relevant entries found:**
   ```markdown
   ## Knowledge Applied

   Checked knowledge base, no relevant entries found.
   ```
```

### Example 2: Executor Deviation-Triggered KB Query

```markdown
<!-- Source: CONTEXT.md executor decision + executor deviation rules -->

## Knowledge Surfacing (Deviation-Only)

**When:** ONLY when you apply deviation Rule 1, 2, or 3.

**Trigger flow:**
1. You encounter an issue requiring auto-fix (Rule 1/2/3)
2. BEFORE fixing, check KB for similar past issues:
   ```bash
   grep -i "{error-keyword}" ~/.claude/gsd-knowledge/index.md
   grep -i "{technology}" ~/.claude/gsd-knowledge/index.md
   ```
3. If a matching lesson or spike exists, read it:
   ```bash
   cat ~/.claude/gsd-knowledge/lessons/{path-from-index}.md
   ```
4. Apply knowledge to your fix (may avoid a previously-failed approach)
5. Cite in your deviation tracking:
   ```
   [Rule 1 - Bug] Fixed auth token refresh (informed by [les-2026-01-15-always-validate-tokens])
   ```

**Do NOT query KB:**
- At plan start
- Before each task
- During normal execution
- When applying Rule 4 (architectural deviation -- checkpoint to user instead)
```

### Example 3: Index Query Pattern

```markdown
<!-- Source: knowledge-store.md Section 9 (Index Format) -->

The KB index at `~/.claude/gsd-knowledge/index.md` has this structure:

## Lessons (12)

| ID | Project | Category | Tags | Date | Status |
|----|---------|----------|------|------|--------|
| les-2026-02-02-validate-tokens | _global | architecture | auth, oauth, jwt | 2026-02-02 | active |

**Query by tag:** grep for tag keywords in the Tags column
**Query by project:** filter Project column for current project name or `_global`
**Query by type:** read the relevant section (Lessons, Spikes, Signals)

**Cross-project query:** Read all sections without filtering by project. Global lessons (`_global`) plus lessons from all projects are all visible in the index.
```

### Example 4: Spike Deduplication Check

```markdown
<!-- Source: CONTEXT.md spike deduplication decisions -->

## Spike Deduplication (SPKE-08)

During the mandatory initial KB query, check if the current research question
has already been answered by a prior spike:

1. Read the Spikes table in `~/.claude/gsd-knowledge/index.md`
2. For each spike entry, check if:
   - Tags overlap with current research question
   - Hypothesis is similar to current question
   - Outcome is `confirmed` or `rejected` (not `inconclusive`)
3. If a matching spike is found:
   - Read the full spike entry for details
   - Check freshness via `depends_on` (if present)
   - If applicable: adopt the finding, cite it, note as "spike avoided"
   - Example: "Per spike [spk-2026-01-20-jwt-refresh], JWT refresh with rotation is the recommended approach -- same tech stack and constraints apply."
4. If partially applicable:
   - Adopt the answered portion
   - Note the gap that still needs investigation
5. At end of research output:
   ```
   Spikes avoided: 1 (spk-2026-01-20-jwt-refresh)
   ```
```

### Example 5: `depends_on` Freshness Check

```markdown
<!-- Source: CONTEXT.md freshness model decisions -->

## Freshness Checking

Knowledge entries may include a `depends_on` field in frontmatter:

```yaml
depends_on:
  - "prisma >= 4.0"
  - "src/lib/auth.ts exists"
  - "NOT monorepo"
```

**Checking process:**
1. Read `depends_on` from entry frontmatter
2. Use judgment to assess whether dependencies still hold:
   - Library version: check package.json if accessible
   - File existence: check if file still exists
   - Negation: check if condition is still false
3. If dependencies hold: entry is fresh, apply normally
4. If dependencies changed: entry may be stale
   - Surface with caveat: "Note: [L-003] depends on Prisma 4.x; current project uses Prisma 5.x"
   - Apply temporal decay fallback: older entries with broken deps get lower confidence

**Temporal decay fallback** (when depends_on is absent or unverifiable):
- Entries < 30 days old: full confidence
- Entries 30-90 days old: slight confidence reduction
- Entries > 90 days old: note age, lower confidence
- Never exclude solely based on age -- surface with caveat
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No knowledge reuse | KB exists but passive (Phase 1-4) | Phase 1-4 (2026-02-02 to 2026-02-05) | Knowledge stored but never automatically consulted |
| Manual spike invocation | Spike dedup check before new spike | Phase 5 (this phase) | Avoids redundant experiments |
| Agent operates without history | Agent queries KB at start | Phase 5 (this phase) | Agents informed by accumulated knowledge |

**Deprecated/outdated:**
- Nothing deprecated -- this phase builds on top of Phases 1-4 without replacing anything

## Open Questions

1. **Progressive Disclosure Implementation**
   - What we know: CONTEXT.md flags this as an OPEN DESIGN QUESTION. The knowledge store already has two tiers (index summaries and full entries). The question is whether to formalize this as an explicit protocol.
   - What's unclear: Whether agents should present a "menu" of entries and ask which to drill into, or just read the top 2-3 full entries automatically.
   - Recommendation: For v1, implement the simpler approach -- agent reads index, picks top matches, reads full entries for those. No interactive menu. This satisfies the two-tier model naturally without adding protocol complexity. Can formalize progressive disclosure in a future iteration.

2. **SURF-04 Cross-Project vs Deferred**
   - What we know: CONTEXT.md defers cross-project surfacing but REQUIREMENTS.md SURF-04 requires it, and SC3 requires it. However, cross-project is already architecturally supported -- the KB index contains ALL projects, lessons are organized by category not project, and agents can query without project filter.
   - What's unclear: Whether the user considers the existing architectural support sufficient for SURF-04, or expects additional explicit cross-project features.
   - Recommendation: Declare SURF-04 satisfied by the existing architecture. Document in the reference that agents query index.md without project filter to get cross-project results. The "automatic" aspect is that agent instructions say to query all entries (not just current project). If this doesn't satisfy the requirement, a gap closure plan can add explicit cross-project features later.

3. **knowledge_debug Config Field**
   - What we know: CONTEXT.md says "opt-in flag" for debug mode. CONTEXT.md puts naming in Claude's discretion.
   - What's unclear: Where exactly in config.json to put it and the exact field name.
   - Recommendation: Add `"knowledge_debug": false` to `.planning/config.json`. Agents check this flag and, when true, log all KB entries they considered (not just applied ones). Field added to `get-shit-done/references/planning-config.md` documentation.

4. **Where to Add `depends_on` to Knowledge Store Schema**
   - What we know: CONTEXT.md references `depends_on` as the primary freshness mechanism. Current knowledge-store.md (Phase 1) does not define `depends_on` as a frontmatter field.
   - What's unclear: Whether to add it to knowledge-store.md as an additive change or define it only in the surfacing reference.
   - Recommendation: Add `depends_on` as an optional field in knowledge-store.md's Common Base Schema (Section 3). This is an additive change -- adding a new optional field doesn't break existing entries. Define the field format in knowledge-surfacing.md reference.

## Sources

### Primary (HIGH confidence)
- `/Users/rookslog/Development/get-shit-done-reflect/.claude/agents/knowledge-store.md` -- KB schema, directory layout, index format (Phase 1 output)
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/phases/05-knowledge-surfacing/05-CONTEXT.md` -- All user decisions for this phase
- `/Users/rookslog/Development/get-shit-done-reflect/agents/gsd-phase-researcher.md` -- Current researcher agent structure (upstream)
- `/Users/rookslog/Development/get-shit-done-reflect/agents/gsd-executor.md` -- Executor deviation rules (Rules 1-4)
- `/Users/rookslog/Development/get-shit-done-reflect/agents/gsd-planner.md` -- Planner agent structure (upstream)
- `/Users/rookslog/Development/get-shit-done-reflect/agents/gsd-debugger.md` -- Debugger agent structure (upstream)
- `/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/references/spike-integration.md` -- Fork detection pattern (Phase 3 output)
- `/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/references/reflection-patterns.md` -- Reflection patterns and lesson format (Phase 4 output)
- `/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/references/signal-detection.md` -- Signal detection reference (Phase 2 output)
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/codebase/ARCHITECTURE.md` -- System architecture documentation
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/codebase/STRUCTURE.md` -- Codebase file structure

### Secondary (MEDIUM confidence)
- Prior phase patterns (01-RESEARCH.md, 04-RESEARCH.md) -- Research and planning conventions

### Tertiary (LOW confidence)
- None -- all findings derived from direct codebase investigation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are existing codebase files directly investigated
- Architecture: HIGH -- patterns derived from how prior phases (2, 3, 4) added fork capabilities
- Pitfalls: HIGH -- derived from direct analysis of fork constraint, CONTEXT.md decisions, and codebase structure

**Research date:** 2026-02-07
**Valid until:** Indefinite (codebase is the source; no external dependency versioning concerns)

---

## Appendix A: File Modification Summary

Summary of ALL files that Phase 5 plans should touch, with change type:

### New Files
| File | Purpose |
|------|---------|
| `get-shit-done/references/knowledge-surfacing.md` | Knowledge surfacing reference specification |

### Additive Modifications (fork copies only)
| File | Change |
|------|--------|
| `.claude/agents/gsd-phase-researcher.md` | Add `<knowledge_surfacing>` section |
| `.claude/agents/gsd-planner.md` | Add `<knowledge_surfacing>` section |
| `.claude/agents/gsd-debugger.md` | Add `<knowledge_surfacing>` section |
| `.claude/agents/gsd-executor.md` | Add `<knowledge_surfacing>` section |
| `.claude/agents/knowledge-store.md` | Add `depends_on` optional field to Common Base Schema (Section 3) |
| `get-shit-done/references/planning-config.md` | Add `knowledge_debug` field documentation |

### No Upstream Modifications
The `agents/` directory (top-level, upstream) is NOT modified. All agent modifications go to `.claude/agents/` (fork working copies). This follows the established pattern from Phases 2-4 where fork-specific agents (gsd-signal-collector, gsd-spike-runner, gsd-reflector) were created only in `.claude/agents/`.

## Appendix B: Requirement Traceability

| Requirement | How Satisfied | Implementation |
|-------------|---------------|----------------|
| SPKE-08 (Spike result reuse) | Mandatory KB query in researcher includes spike dedup check | `<knowledge_surfacing>` section in gsd-phase-researcher |
| SURF-01 (Knowledge researcher spawned in parallel) | Phase researcher IS the knowledge researcher with added KB instructions | Additive section in gsd-phase-researcher |
| SURF-02 (KB query filters by relevance) | Agent reads index.md, filters by tags/project/type, ranks by LLM judgment | Knowledge-surfacing.md reference + agent instructions |
| SURF-03 (Pull-based with token budget) | Agent-initiated querying with ~500 token soft cap | Agent instructions specify pull-based pattern with budget |
| SURF-04 (Cross-project surfacing) | Index.md already contains all projects; agent queries without project filter | Reference documents this as the mechanism |
| SURF-05 (Spike result surfacing) | Part of mandatory initial KB query; spike entries visible in index | Agent instructions + spike dedup pattern |

## Appendix C: Agent-Specific Query Behavior Summary

| Agent | Trigger | Query Type | Priority | Budget |
|-------|---------|------------|----------|--------|
| gsd-phase-researcher | Mandatory at start + on error/direction change | Full KB query (lessons + spikes) | Spike decisions first, then lessons | ~500 tokens |
| gsd-planner | Optional, at discretion | Lessons only | Strategic lessons (patterns, conventions) | ~500 tokens |
| gsd-debugger | Optional, at discretion | Lessons + spikes related to error | Both equally | ~500 tokens |
| gsd-executor | ONLY on deviation (Rules 1-3) | Lessons related to error pattern | Error-relevant lessons | ~200 tokens (deviation context) |
