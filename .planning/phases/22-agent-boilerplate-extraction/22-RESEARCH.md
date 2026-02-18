# Phase 22: Agent Boilerplate Extraction - Research

**Researched:** 2026-02-18
**Domain:** Agent spec architecture / shared protocol extraction
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Extraction boundary (HOW/WHAT split):**
  - Protocol (shared): HOW to operate -- git safety, commit format, tool conventions, structured returns, state file path conventions, deviation handling rules
  - Agent spec (stays): WHAT you are -- role definition, philosophy, user/Claude relationship framing, domain methodology, execution steps
  - The test: "Does this define what the agent IS, or how it OPERATES?" Identity stays. Operations extract.
- **Protocol structure:** Single monolithic `references/agent-protocol.md` file (not split into multiple files). Rationale: ~600 lines is manageable in one file; splitting adds file management overhead for minimal benefit; can split later if maintenance burden grows. Agents load via `<required_reading>` which pulls the entire file before execution.
- **Override mechanism:** Agent-specific content appears ABOVE the `<required_reading>` protocol reference in each spec. This leverages Claude's natural instruction priority: specific (agent) overrides general (protocol). No annotation syntax or explicit override blocks needed -- positional priority is sufficient.
- **Post-extraction agent spec format:** Minimal skeleton after extraction: frontmatter, role, philosophy, execution steps, required_reading reference. No inline summaries of protocol content -- protocol is loaded in full via required_reading, Claude has complete context.

### Claude's Discretion
- Extraction registry format and level of detail
- Which 3 agents to use for before/after verification (suggest: executor, planner, and one lighter agent like verifier)
- Exact ordering of sections within the shared protocol
- How to handle edge cases where a section is 90% shared but 10% agent-specific (likely: keep full section in agent spec if it has meaningful customization)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Summary

This phase extracts shared operational conventions from 11 GSD agent specs into a single `references/agent-protocol.md` file. The codebase currently has 11 `gsd-*` agent specs in `.claude/agents/` totaling 7,015 lines (excluding `knowledge-store.md` which is a reference specification, not an agent). After thorough analysis of all 11 agents, the extractable operational content falls into clear categories: git safety and commit conventions, tool strategy patterns (especially shared between researchers), state file path conventions, the gsd-tools.js usage patterns, and quality/context budget guidance.

The `<required_reading>` pattern is already well-established in GSD workflows (26+ workflow files use it to reference `.claude/get-shit-done/references/*.md` files). The agent protocol file will follow this exact mechanism. The existing `references/` directory at `.claude/get-shit-done/references/` already holds 23 reference files, so `agent-protocol.md` fits naturally into this structure.

The primary challenge is not technical but editorial: deciding what crosses the "IS vs OPERATES" boundary for each section in each agent, then ensuring the extracted protocol is complete enough that no agent loses behavioral fidelity. The 90/10 edge cases (sections that are mostly shared but have agent-specific tweaks) require careful per-section judgment.

**Primary recommendation:** Extract in bottom-up order -- start by cataloguing every shared pattern across all 11 agents, build the protocol from the catalogue, then surgically remove extracted content from each agent spec while preserving identity sections above the `<required_reading>` tag.

## Standard Stack

Not applicable -- this phase modifies Markdown documentation files only. No libraries, frameworks, or code dependencies are involved.

## Architecture Patterns

### Current Agent Spec Structure

All 11 GSD agents follow a consistent structural pattern:

```
---
name: gsd-{name}
description: {description}
tools: {tool list}
color: {color}
---

<role>...</role>             # IDENTITY: What the agent IS
<philosophy>...</philosophy> # IDENTITY: How the agent thinks (varies per agent)
<{domain sections}>          # MIXED: Some operational, some identity
<execution_flow>...</execution_flow>  # MIXED: Steps are identity, conventions are operational
<structured_returns>...</structured_returns>  # IDENTITY: Return formats are domain-specific
<success_criteria>...</success_criteria>      # IDENTITY: Criteria are domain-specific
```

### The 11 Agents and Their Sizes

| Agent | Lines | Primary Role | Key Shared Patterns |
|-------|-------|-------------|---------------------|
| `gsd-codebase-mapper` | 761 | Explore codebase, write analysis docs | forbidden_files rules, write patterns |
| `gsd-debugger` | 1,198 | Investigate bugs via scientific method | git safety, commit format, gsd-tools.js commit |
| `gsd-executor` | 403 | Execute PLAN.md files atomically | git safety, commit format, state updates, gsd-tools.js init/commit |
| `gsd-integration-checker` | 423 | Verify cross-phase integration | structured return pattern |
| `gsd-phase-researcher` | 469 | Research phase implementation | tool strategy, source hierarchy, verification protocol, gsd-tools.js init/commit |
| `gsd-plan-checker` | 622 | Verify plans will achieve goal | gsd-tools.js init, context budget references |
| `gsd-planner` | 1,157 | Create executable phase plans | quality degradation curve, context budget, gsd-tools.js init/commit |
| `gsd-project-researcher` | 618 | Research project domain | tool strategy, source hierarchy, verification protocol (near-identical to phase-researcher) |
| `gsd-research-synthesizer` | 236 | Synthesize parallel research outputs | gsd-tools.js commit |
| `gsd-roadmapper` | 605 | Create project roadmaps | philosophy overlap (solo dev + Claude) |
| `gsd-verifier` | 523 | Verify phase goal achievement | gsd-tools.js verify commands |

**Total agent lines:** 7,015
**knowledge-store.md** (366 lines) is a reference specification, NOT an agent -- it has a `version` field instead of `tools`/`color`, and documents a data format rather than defining agent behavior. It is excluded from the 11.

### Post-Extraction Target Structure

Each agent spec becomes:

```markdown
---
name: gsd-{name}
description: {description}
tools: {tool list}
color: {color}
---

<role>...</role>                    # STAYS: Identity
<philosophy>...</philosophy>        # STAYS: Identity (where present)
<{agent-specific overrides}>        # STAYS: Any operational overrides ABOVE required_reading
<{domain methodology}>              # STAYS: Domain-specific sections

<required_reading>
@./.claude/get-shit-done/references/agent-protocol.md
</required_reading>

<execution_flow>...</execution_flow>        # STAYS: Domain-specific steps
<structured_returns>...</structured_returns> # STAYS: Agent-specific formats
<success_criteria>...</success_criteria>     # STAYS: Agent-specific criteria
```

### Existing `<required_reading>` Pattern

The `<required_reading>` mechanism is already used in 26+ workflow files. Pattern:

```markdown
<required_reading>
@./.claude/get-shit-done/references/{reference-file}.md
</required_reading>
```

Files are loaded using the `@` prefix which Claude Code resolves to file content. The entire referenced file is read into context before the agent begins execution. No agents currently use `<required_reading>` -- this will be the first adoption in agent specs.

### Protocol File Location

**Full path:** `.claude/get-shit-done/references/agent-protocol.md`

This follows the existing convention: all 23 current reference files live at `.claude/get-shit-done/references/`. The requirement text says `references/agent-protocol.md` which maps to this location.

### Recommended Protocol Section Ordering

```markdown
# Agent Execution Protocol

## 1. Git Safety Rules
## 2. File Staging Conventions
## 3. Commit Format & Types
## 4. gsd-tools.js Commit Pattern
## 5. commit_docs Configuration
## 6. State File Conventions
## 7. gsd-tools.js Init Pattern
## 8. Tool Conventions (Context7 / WebSearch / Brave)
## 9. Source Hierarchy & Confidence Levels
## 10. Research Verification Protocol
## 11. Quality & Context Budget
## 12. Structured Return Conventions
```

**Ordering rationale:** Flows from most-universal (git safety applies to all committing agents) to most-specific (research protocol only applies to researcher agents). An agent that only commits reads sections 1-5 and stops. A researcher reads all 12.

## Extraction Catalogue

### Category 1: Git Safety Rules (HIGH duplication)

**Currently duplicated in:** gsd-executor, gsd-debugger (explicit), all committing agents (implicit)

**Content:**
- NEVER use `git add .` or `git add -A`
- Stage files individually by name
- Each file staged explicitly in separate `git add` commands

**Source specimens:**
- `gsd-executor.md` line 246: `Stage task-related files individually (NEVER git add . or git add -A)`
- `gsd-debugger.md` line 991: `Stage and commit code changes (NEVER git add -A or git add .)`

**Extraction verdict:** FULL EXTRACT. Identical across agents.

### Category 2: Commit Format Conventions (HIGH duplication)

**Currently duplicated in:** gsd-executor (detailed), gsd-debugger (abbreviated), git-integration.md reference (canonical)

**Content:**
- Commit type table: feat, fix, test, refactor, chore, perf
- Format: `{type}({phase}-{plan}): {description}` with bullet-point body
- Docs commit format via gsd-tools.js

**Source specimens:**
- `gsd-executor.md` lines 253-271: Full commit type table + format
- `gsd-debugger.md` lines 991-998: Abbreviated commit format
- `git-integration.md` lines 59-111: Canonical reference (already exists as reference!)

**Extraction verdict:** FULL EXTRACT. Note that `git-integration.md` already exists as a reference. The protocol can reference or incorporate this. However, agent-level repetition should be extracted to the protocol.

### Category 3: gsd-tools.js Commit Pattern (HIGH duplication)

**Currently duplicated in:** gsd-executor, gsd-planner, gsd-phase-researcher, gsd-debugger, gsd-research-synthesizer (5 agents)

**Content:**
```bash
node ./.claude/get-shit-done/bin/gsd-tools.js commit "{message}" --files {paths}
```

**Extraction verdict:** FULL EXTRACT. Pattern is identical; only the message and file paths vary.

### Category 4: commit_docs Configuration (MEDIUM duplication)

**Currently referenced in:** gsd-executor, gsd-planner, gsd-phase-researcher, gsd-debugger (4 agents)

**Content:**
- `commit_docs` controls git operations only, NOT file writing
- Always write files first, then check commit_docs
- gsd-tools.js commit respects commit_docs automatically

**Extraction verdict:** FULL EXTRACT. Convention is identical.

### Category 5: gsd-tools.js Init Pattern (MEDIUM duplication)

**Currently duplicated in:** gsd-executor, gsd-planner, gsd-phase-researcher, gsd-plan-checker, gsd-debugger (5 agents)

**Content:**
```bash
INIT=$(node ./.claude/get-shit-done/bin/gsd-tools.js init {subcommand} "${PHASE}")
```
Each agent uses a different init subcommand (`execute-phase`, `plan-phase`, `phase-op`, `state load`).

**Extraction verdict:** EXTRACT PATTERN, LEAVE SPECIFICS. The protocol defines the general pattern and available subcommands. Each agent retains its specific init call in its execution_flow steps since the subcommand and extracted fields are agent-specific.

### Category 6: Tool Strategy (HIGH duplication between researchers)

**Currently duplicated in:** gsd-phase-researcher, gsd-project-researcher (near-identical, ~80 lines each)

**Content:**
- Context7 flow: resolve-library-id then query-docs
- WebSearch tips: include current year, multiple variations
- Brave Search API via gsd-tools.js websearch
- Verification protocol: Context7 > Official Docs > WebSearch
- Source hierarchy table (HIGH/MEDIUM/LOW confidence)
- Known research pitfalls (Config Scope Blindness, Deprecated Features, Negative Claims, Single Source Reliance)
- Pre-submission checklist

**Source specimens:**
- `gsd-phase-researcher.md` lines 84-175: tool_strategy + source_hierarchy + verification_protocol (~90 lines)
- `gsd-project-researcher.md` lines 63-166: Functionally identical content (~100 lines)

**Extraction verdict:** FULL EXTRACT. This is the single largest duplication between any two agents. ~90 lines duplicated verbatim. After extraction, each researcher retains only its unique `<execution_flow>` and output format.

### Category 7: Quality Degradation Curve (MEDIUM duplication)

**Currently duplicated in:** gsd-planner (inline), gsd-plan-checker (referenced)

**Content:**
| Context Usage | Quality | Claude's State |
|0-30%|PEAK|Thorough|
|30-50%|GOOD|Confident|
|50-70%|DEGRADING|Efficiency mode|
|70%+|POOR|Rushed|

**Extraction verdict:** EXTRACT as operational guidance. Both agents reference this table. Planner uses it for planning; checker uses it for verification. Same table, different consumer perspective.

### Category 8: State File Path Conventions (LOW explicit duplication, HIGH implicit)

**Referenced across:** gsd-executor, gsd-planner, gsd-verifier, gsd-plan-checker, gsd-phase-researcher

**Content:**
- `.planning/` directory root
- `.planning/STATE.md` location
- `.planning/phases/XX-name/` phase directory pattern
- `.planning/debug/` debug directory
- `.planning/research/` research directory
- `.planning/codebase/` codebase map directory

**Extraction verdict:** EXTRACT as convention reference. Not heavily duplicated as text, but standardized conventions that new agents need to know. Supports the "one edit, not 11" maintenance goal.

### Category 9: Structured Return Format Pattern (LOW duplication)

**Present in:** All 11 agents have `<structured_returns>` sections, but content is unique per agent.

**Shared conventions:**
- Markdown format with `## STATUS KEYWORD` header
- Key metadata fields (Phase, Status, etc.)
- Consistent use of tables for structured data

**Extraction verdict:** EXTRACT CONVENTIONS ONLY. The structural pattern and formatting rules belong in the protocol. The actual return types and content stay in each agent. Example: "All structured returns must start with `## {STATUS KEYWORD}` and include Phase/Status metadata" goes in protocol. The actual `## PLAN COMPLETE` content stays in executor.

### Edge Case Analysis: 90/10 Sections

| Section | % Shared | Agent-Specific Part | Recommendation |
|---------|----------|---------------------|----------------|
| Philosophy (solo dev + Claude) | ~70% | Planner adds "Plans are Prompts", Roadmapper adds "Anti-Enterprise" | KEEP IN AGENT. Each philosophy is identity. |
| Deviation rules | ~0% | Entirely executor-specific | KEEP IN EXECUTOR. Not shared. |
| Checkpoint protocol | ~0% | Executor + Planner have different perspectives | KEEP IN AGENTS. Domain methodology. |
| Hypothesis testing | ~0% | Entirely debugger-specific | KEEP IN DEBUGGER. Domain methodology. |
| Goal-backward | ~0% | Planner + Verifier have different applications | KEEP IN AGENTS. Domain methodology. |
| forbidden_files | ~100% | Only in codebase-mapper currently | EXTRACT. Should apply to ALL agents. |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section-by-section diff between agent specs | Manual comparison | Systematic grep/diff across all agents | 11 files with different structures make manual comparison error-prone |
| Testing behavior equivalence | Manual spot-checking | Before/after agent runs on representative tasks | Only way to verify no behavior regression |
| Tracking what was extracted from where | Memory/notes | Extraction registry artifact | Audit trail required by AGENT-04 |

## Common Pitfalls

### Pitfall 1: Over-Extraction (Extracting Identity as Operations)
**What goes wrong:** Extracting philosophy, domain methodology, or success criteria into the shared protocol, making agents feel generic and losing their specialized effectiveness.
**Why it happens:** The boundary between "how to operate" and "what you are" is fuzzy for some sections. The Quality Degradation Curve, for example, is operational guidance BUT the planner uses it differently (to size plans) than the checker (to flag scope issues).
**How to avoid:** Apply the decision's test rigorously: "Does this define what the agent IS, or how it OPERATES?" When in doubt, keep it in the agent spec. Over-extraction is harder to fix than under-extraction.
**Warning signs:** Agent responses become more generic after extraction. Agent loses domain-specific nuance.

### Pitfall 2: Under-Extraction (Leaving Duplicates)
**What goes wrong:** Protocol is created but significant duplication remains because some shared content was missed or deemed "too different to extract."
**Why it happens:** Each agent states the same convention slightly differently, making it look unique when it's semantically identical (e.g., "NEVER use git add ." vs "NEVER use git add -A or git add .").
**How to avoid:** Compare semantically, not textually. Two agents saying "stage files individually" and "never batch-stage" are expressing the same rule.
**Warning signs:** Future convention changes still require editing multiple agents.

### Pitfall 3: Breaking Agent Load Order
**What goes wrong:** Placing `<required_reading>` at the wrong position in agent specs causes protocol conventions to override agent-specific overrides.
**Why it happens:** Misunderstanding Claude's attention/priority model. The decision specifies agent-specific content ABOVE the required_reading tag so it gets stronger positional attention.
**How to avoid:** Place `<required_reading>` AFTER all agent-specific content that might conflict with protocol conventions. The protocol should be "defaults" that agents can override.
**Warning signs:** Agent stops following its own specific commit format or tool preferences.

### Pitfall 4: Protocol Becomes Stale
**What goes wrong:** New conventions are added to individual agent specs instead of the protocol, re-introducing duplication over time.
**Why it happens:** Contributors (human or Claude) edit the agent they're working with rather than the protocol.
**How to avoid:** The protocol should include a clear note: "Convention changes go HERE, not in individual agent specs." The extraction registry documents the relationship.
**Warning signs:** Agents start diverging in operational conventions again.

### Pitfall 5: Incomplete Verification
**What goes wrong:** Extraction changes agent behavior subtly -- e.g., a debugger that used to follow its own commit format now follows the generic protocol format, losing the `fix:` prefix convention.
**Why it happens:** Before/after comparison is skipped or only done for 1 agent instead of 3+.
**How to avoid:** Run representative tasks through at least 3 agents (executor, planner, verifier recommended) and compare output quality/format against pre-extraction baseline.
**Warning signs:** Tests pass but output format or conventions shift.

## Code Examples

### Pattern 1: Agent Spec with required_reading (Post-Extraction)

```markdown
---
name: gsd-phase-researcher
description: Researches how to implement a phase...
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
color: cyan
---

<role>
You are a GSD phase researcher...
[Identity content stays]
</role>

<upstream_input>
[Agent-specific content stays]
</upstream_input>

<downstream_consumer>
[Agent-specific content stays]
</downstream_consumer>

<philosophy>
[Agent-specific content stays -- this is identity]
</philosophy>

<required_reading>
@./.claude/get-shit-done/references/agent-protocol.md
</required_reading>

<execution_flow>
[Agent-specific steps stay, minus operational conventions now in protocol]
</execution_flow>

<structured_returns>
[Agent-specific return formats stay]
</structured_returns>

<success_criteria>
[Agent-specific criteria stay]
</success_criteria>
```

### Pattern 2: Protocol Reference Structure

```markdown
# Agent Execution Protocol

> Shared operational conventions for all GSD agents.
> Convention changes go HERE, not in individual agent specs.
> Agent-specific overrides should appear ABOVE the <required_reading> tag in agent specs.

## Git Safety

**NEVER use `git add .` or `git add -A`.** Stage files individually:

```bash
git add src/path/to/file1.ts
git add src/path/to/file2.ts
```

**Rationale:** Batch staging risks committing unintended files (.env, credentials, large binaries).

## Commit Format
...
```

### Pattern 3: Extraction Registry Entry

```markdown
## Extraction Registry

| Section | Source Agent(s) | Protocol Section | Lines Removed | Notes |
|---------|----------------|------------------|---------------|-------|
| Git safety rules | gsd-executor (L246), gsd-debugger (L991) | Git Safety | ~5 per agent | Identical across agents |
| Commit type table | gsd-executor (L253-260) | Commit Format | ~10 | Was only in executor; now universal |
| Tool strategy | gsd-phase-researcher (L84-130), gsd-project-researcher (L63-134) | Tool Conventions | ~80 per agent | Near-identical; largest single extraction |
| Source hierarchy | gsd-phase-researcher (L132-142), gsd-project-researcher (L124-133) | Source Hierarchy | ~12 per agent | Identical tables |
| Verification protocol | gsd-phase-researcher (L144-175), gsd-project-researcher (L136-166) | Research Verification | ~30 per agent | Identical checklists and pitfalls |
```

## Recommendations for Discretion Areas

### Extraction Registry Format
**Recommendation:** Simple markdown table in a `22-EXTRACTION-REGISTRY.md` file alongside the phase planning artifacts at `.planning/phases/22-agent-boilerplate-extraction/`. Columns: Section, Source Agent(s) with line numbers, Protocol Section it maps to, Lines Removed, Notes. This is lightweight and auditable.

### Verification Agents (3 for before/after)
**Recommendation:** gsd-executor, gsd-planner, gsd-verifier.

| Agent | Why Selected | Verification Approach |
|-------|-------------|----------------------|
| gsd-executor | Heaviest git/commit usage, most operational content | Compare commit behavior on a mock plan execution |
| gsd-planner | Largest agent (1,157 lines), most sections, uses quality degradation curve | Compare plan output quality on a representative phase |
| gsd-verifier | Lighter agent, tests protocol's impact on focused specs | Compare verification report format on a mock phase |

This covers: heavy operational agent (executor), largest/most complex agent (planner), and a focused/lighter agent (verifier). Better coverage than executor + planner + verifier because it tests three different interaction patterns with the protocol.

### Section Ordering
**Recommendation:** See "Recommended Protocol Section Ordering" in Architecture Patterns above. Universal conventions first (git safety), specialized conventions last (research protocol). This means an agent that only needs commit conventions reads the first ~40% of the protocol.

### 90/10 Edge Cases
**Recommendation:** If a section has meaningful agent-specific customization (even 10%), keep the FULL section in the agent spec. The protocol provides the default; the agent overrides it positionally. Specific cases:
- **Quality Degradation Curve:** Extract to protocol. Both planner and checker reference the same table with no customization.
- **Philosophy sections:** Keep in agents. Each is unique identity content even when they share a theme ("solo dev + Claude" appears in planner and roadmapper but with different framing).
- **forbidden_files:** Extract to protocol. Currently only in codebase-mapper but should apply to ALL agents.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Agent specs are standalone | Agents will reference shared protocol | This phase | Convention changes propagate via one edit |
| Workflows use `<required_reading>` | Agents will also use `<required_reading>` | This phase | Consistent pattern across workflows AND agents |

## Open Questions

1. **knowledge-store.md status**
   - What we know: It lives in `.claude/agents/` but has `version: 1.0.0` frontmatter instead of `tools`/`color`, and functions as a reference specification for the knowledge store format rather than defining agent behavior
   - What's unclear: Whether it counts as one of the "11 agent specs" in the requirement
   - Recommendation: Exclude it from this phase. It doesn't follow the agent pattern and wouldn't benefit from the protocol extraction. If the count is meant to include it, it needs separate handling.

2. **git-integration.md overlap**
   - What we know: `.claude/get-shit-done/references/git-integration.md` (249 lines) already defines canonical commit formats, commit points, and anti-patterns. Some of this content is duplicated in executor and debugger specs.
   - What's unclear: Should the agent protocol incorporate git-integration.md content directly, or reference it? Having two overlapping reference files could cause drift.
   - Recommendation: The agent protocol should reference git-integration.md rather than duplicating it: "For full commit format reference, see git-integration.md. Key rules for agents:" followed by the agent-specific subset. This avoids creating a third source of truth for commit conventions.

3. **Deleted agents in working tree**
   - What we know: git status shows `gsd-reflector.md`, `gsd-signal-collector.md`, and `gsd-spike-runner.md` as deleted. These exist in the last commit but not on disk.
   - What's unclear: Are these being removed permanently as part of another change, or are they in flux?
   - Recommendation: Plan against the 11 agents currently on disk. If the deleted agents return, they can adopt the protocol at that time. Do not include them in the extraction registry or before/after verification.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all 11 agent specs in `.claude/agents/gsd-*.md`
- Direct codebase analysis of 23 reference files in `.claude/get-shit-done/references/`
- Direct codebase analysis of 26+ workflow files in `.claude/get-shit-done/workflows/`
- `gsd-file-manifest.json` for agent inventory confirmation

### Secondary (MEDIUM confidence)
- Line count measurements via `wc -l` for size estimates
- Grep-based pattern matching for duplication analysis (text-level, not semantic)

### Tertiary (LOW confidence)
- Estimated protocol size (~400-600 lines) based on aggregation of identified shared content. Actual size will depend on editorial decisions during extraction.

## Metadata

**Confidence breakdown:**
- Agent inventory: HIGH - Direct file analysis, all 11 agents read in full
- Shared pattern identification: HIGH - Grep + manual analysis across all specs
- Extraction boundary decisions: HIGH - Clear user decisions from CONTEXT.md
- Protocol size estimate: MEDIUM - Aggregation of identified patterns, actual size TBD
- Behavior equivalence risk: MEDIUM - Positional attention model is well-understood but edge cases possible

**Research date:** 2026-02-18
**Valid until:** No expiration (internal architecture, not external dependency)
