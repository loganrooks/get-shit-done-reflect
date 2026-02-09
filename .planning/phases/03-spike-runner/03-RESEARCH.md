# Phase 3: Spike Runner - Research

**Researched:** 2026-02-04
**Domain:** Structured experimentation workflow with hypothesis-driven development and decision records
**Confidence:** HIGH

## Summary

The Spike Runner phase implements a structured experimentation workflow for resolving design uncertainty through testable hypotheses, controlled experiments, and documented findings. This is fundamentally about bringing the scientific method to software development decisions that cannot be resolved through research alone.

The implementation builds on three established patterns: **Spike Solutions** from Extreme Programming (time-boxed exploration to reduce technical risk), **Architecture Decision Records (ADRs)** for structured decision documentation, and **Hypothesis-Driven Development (HDD)** for empirical validation of assumptions. The key insight from CONTEXT.md is that spikes produce FINDINGS, not DECISIONS -- existing GSD layers (CONTEXT.md for user decisions, RESEARCH.md for technical recommendations) make decisions based on spike findings.

The implementation requires: a `/gsd:spike` command for manual invocation, a `gsd-spike-runner` agent that executes Build/Run/Document phases, DESIGN.md and DECISION.md schemas following ADR-influenced structure, integration points with plan-phase and new-project orchestrators at the "spike decision point" after research, and Open Questions flow from mark through verify to spike to resolve.

**Primary recommendation:** Build the spike workflow as three new files (command, agent, reference) plus two templates (DESIGN.md, DECISION.md), following the exact patterns established by Phase 2 Signal Collector. All modifications to existing orchestrators are additive (new steps, new sections) to maintain fork compatibility.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | built-in | File operations for spike workspace | Zero dependencies, existing pattern |
| Markdown + YAML frontmatter | N/A | DESIGN.md and DECISION.md schemas | Native to GSD, agent-first, human-readable |
| Bash | built-in | Directory creation, index operations | Agent tool, no runtime dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Date (ISO-8601) | built-in | Timestamps in spike artifacts | All spike creation/completion timestamps |
| Glob patterns | built-in | Spike directory enumeration | Finding existing spikes, next index |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sequential index (001, 002) | UUID | Index provides chronology and human readability; UUID is less scannable |
| Markdown decision records | JSON decision format | Markdown is agent-readable in context, human-readable in files; JSON is less ergonomic |
| Single DECISION.md | Split FINDINGS.md + DECISION.md | CONTEXT.md allows FINDINGS.md as optional for complex spikes; keep simple default |

**Installation:**
```bash
# No installation needed -- zero new dependencies
# Directory creation on spike invocation:
mkdir -p .planning/spikes/{index}-{slug}/
```

## Architecture Patterns

### Recommended Directory Structure
```
.planning/spikes/
├── 001-ocr-library-handwritten/
│   ├── DESIGN.md          # Hypothesis + experiment plan (before)
│   ├── FINDINGS.md        # Optional: raw data for complex spikes
│   └── DECISION.md        # Results + decision (after)
├── 002-realtime-processing-mobile/
│   ├── DESIGN.md
│   └── DECISION.md
└── ...
```

**Key structural decisions from CONTEXT.md:**
- All spikes at project level (`.planning/spikes/`), not phase-level
- Indexed naming (`{3-digit-index}-{slug}`) for uniqueness and chronological ordering
- FINDINGS.md is optional, only for complex spikes with lots of data
- DECISION.md is mandatory -- the output is always a decision, not a report

### Pattern 1: Spike Types with Different Success Criteria
**What:** Four spike types that determine how success is measured and how experiments are structured.
**When to use:** Classify at DESIGN.md creation based on the nature of the question.

| Type | When to Use | Success Criteria Pattern |
|------|-------------|-------------------------|
| Binary | Yes/no feasibility questions | Clear threshold defined upfront ("latency < 100ms") |
| Comparative | Choose between known options | Metrics to compare, winner criteria defined |
| Exploratory | Understand a space | Learning goals, can refine during spike |
| Open Inquiry | Questions that don't fit above | Flexible, Claude's discretion on structure |

**One spike = one question.** Comparative questions (A vs B vs C) are one spike with multiple experiments, not multiple spikes.

### Pattern 2: Four-Phase Spike Workflow
**What:** Design -> Build -> Run -> Document phases with different modes.
**When to use:** Every spike follows this flow.

```
1. DESIGN (cognitive)
   - Input: Open Question from RESEARCH.md
   - Process: Define hypothesis, success criteria, experiment plan
   - Output: DESIGN.md
   - Mode: Hybrid -- agent drafts, user confirms (interactive) or auto-approve (YOLO)

2. BUILD (implementation)
   - Input: DESIGN.md experiment plan
   - Process: Implement experiment scaffolding, test harness, variations
   - Output: Working experiment code
   - Mode: Agent-driven (gsd-spike-runner)

3. RUN (execution)
   - Input: Built experiments
   - Process: Execute experiments, gather data, measure against criteria
   - Output: FINDINGS.md (optional, for complex spikes)
   - Mode: Agent-driven (gsd-spike-runner)

4. DOCUMENT (synthesis)
   - Input: Experiment results
   - Process: Analyze findings, form conclusion, document decision
   - Output: DECISION.md
   - Mode: Agent-driven (gsd-spike-runner)
```

### Pattern 3: Iterative Narrowing (Max 2 Rounds)
**What:** When Round 1 is inconclusive, refine hypothesis and run Round 2.
**When to use:** When initial results don't provide clear answer.

```markdown
Round 1 Result: Inconclusive
- Observation: [what was found]
- Why inconclusive: [missing data, wrong metrics, etc.]

Narrowed Hypothesis for Round 2:
- Original: "Library A vs B for image processing"
- Refined: "Library A vs B for JPEG compression specifically"

Round 2 proceeds with focused scope.
```

**Hard limit:** Maximum 2 rounds per spike. If still inconclusive after Round 2:
- Document honestly: "No clear winner"
- Proceed with default/simplest approach
- Still valuable: learned there's no empirical differentiator

### Pattern 4: Open Questions Flow Integration
**What:** How uncertainties flow through existing artifacts, get verified by research, and trigger spikes only for genuine gaps.
**When to use:** All spike triggering from orchestrators (plan-phase, new-project).

```
MARK (during Q&A or discuss-phase)
  -> Open Question captured in PROJECT.md or CONTEXT.md
VERIFY (during research)
  -> Researcher attempts to resolve through normal research
  -> Reports outcome in RESEARCH.md (Resolved / Genuine Gaps)
DECIDE (after research)
  -> Apply sensitivity filter (conservative/balanced/aggressive)
  -> Apply autonomy mode (interactive asks, YOLO auto-spikes)
SPIKE (if approved)
  -> Design -> Build -> Run -> Document
  -> Orchestrator updates RESEARCH.md with resolution
PLAN (planner reads updated RESEARCH.md)
```

### Anti-Patterns to Avoid
- **Scope creep:** Spikes that try to answer multiple unrelated questions. Split into separate spikes.
- **Analysis paralysis:** More than 2 iteration rounds. Force a decision.
- **Gold plating:** Over-engineering experiment infrastructure. Keep it minimal, throwaway code is fine.
- **Missing decision:** DECISION.md that reads like a report without a clear "Chosen approach" section. Always commit to a decision.
- **Modifying existing files:** All Phase 3 work must be NEW files (fork constraint). Integration is additive.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decision record format | Custom prose format | ADR-influenced DECISION.md schema | ADRs are proven, provide context/alternatives/consequences structure |
| Spike workflow orchestration | Ad-hoc execution | Four-phase (Design/Build/Run/Document) | Structured phases ensure design-before-execution discipline |
| Unique spike IDs | Random IDs | Sequential index + slug | Provides chronology, human readability, and uniqueness |
| Success criteria definition | Vague goals | Measurable criteria checklist in DESIGN.md | Forces upfront clarity, prevents "I'll know it when I see it" |
| Integration with plan-phase | Modify existing orchestrator | Additive steps between existing steps | Fork maintenance, clean upstream merges |

**Key insight:** The spike workflow is primarily documentation structure + agent instructions, not runtime code. The value is in the schemas and the discipline they enforce.

## Common Pitfalls

### Pitfall 1: Unbounded Spikes
**What goes wrong:** Spike takes days instead of hours, explores tangential questions, never converges.
**Why it happens:** No time estimate, no iteration limit, scope not bounded in DESIGN.md.
**How to avoid:** DESIGN.md requires explicit scope boundaries ("In scope" and "Out of scope") and time estimate. Max 2 rounds enforced.
**Warning signs:** Round 1 produces more questions than answers. Experiment plan has 5+ experiments.

### Pitfall 2: Premature Spiking
**What goes wrong:** Spike created for questions that normal research could have answered.
**Why it happens:** Skipping the VERIFY step in Open Questions flow. Not reading existing documentation.
**How to avoid:** Sensitivity filter (conservative only spikes Critical gaps). Researcher MUST attempt resolution first.
**Warning signs:** RESEARCH.md has "Genuine Gaps" for questions that 5 minutes of Context7/docs would answer.

### Pitfall 3: Decision Aversion
**What goes wrong:** DECISION.md documents findings but avoids committing to a choice.
**Why it happens:** Fear of being wrong, perfectionism, wanting more data.
**How to avoid:** DECISION.md schema has mandatory "Chosen approach" and "Rationale" fields. "No clear winner, using default" IS a valid decision.
**Warning signs:** Decision section says "more investigation needed" or "TBD".

### Pitfall 4: Orphaned Spike Results
**What goes wrong:** Spike completes but results don't flow back to RESEARCH.md or the planner.
**Why it happens:** Orchestrator doesn't update RESEARCH.md after spike completes.
**How to avoid:** Orchestrator (not spike-runner agent) is responsible for updating RESEARCH.md with "Resolved by Spike" section.
**Warning signs:** Planner asks questions that a completed spike already answered.

### Pitfall 5: Breaking Fork Constraint
**What goes wrong:** Implementation modifies existing GSD files instead of creating new ones.
**Why it happens:** Natural impulse to add hooks directly into existing workflows.
**How to avoid:** All deliverables are NEW files. Integration into orchestrators is additive (new steps between existing steps).
**Warning signs:** `git diff` shows changes to files from upstream GSD (not the fork's own files).

## Code Examples

### DESIGN.md Schema
```markdown
# Spike: {Name}

**Created:** {date}
**Status:** {designing | building | running | complete | inconclusive}
**Originating phase:** {phase number, or "project-level"}
**Depends on:** {spike IDs, or "none"}

## Question

{The Open Question being investigated}

## Type

{Binary | Comparative | Exploratory | Open Inquiry}

## Hypothesis

{What we think might be true / what we're testing}

## Success Criteria

{How we'll know if we have an answer}

- [ ] Criterion 1: {measurable}
- [ ] Criterion 2: {measurable}

## Experiment Plan

### Experiment 1: {name}
- **What:** {what we'll build/test}
- **Measures:** {what we'll measure}
- **Expected outcome:** {hypothesis for this experiment}

### Experiment 2: {name}
...

## Scope Boundaries

**In scope:**
- {what we'll investigate}

**Out of scope:**
- {what we explicitly won't investigate}

## Time Estimate

{Rough estimate -- not enforced, for user awareness}
```

### DECISION.md Schema (ADR-Influenced)
```markdown
# Spike Decision: {Name}

**Completed:** {date}
**Question:** {The Open Question}
**Answer:** {One-line decision}

## Summary

{2-3 paragraph executive summary}

## Findings

### Experiment 1: {name}

**Result:** {what happened}
**Data:**
{measurements, observations}

### Experiment 2: {name}
...

## Analysis

{How findings inform the decision}

| Option | Pros | Cons | Spike Evidence |
|--------|------|------|----------------|
| A | ... | ... | {data from experiments} |
| B | ... | ... | {data from experiments} |

## Decision

**Chosen approach:** {the decision}

**Rationale:** {why, based on evidence}

**Confidence:** {HIGH | MEDIUM | LOW}

## Implications

{What this means for downstream work}

- {Implication 1}
- {Implication 2}

## Metadata

**Spike duration:** {actual time}
**Iterations:** {1 or 2}
**Originating phase:** {phase}
**Related requirements:** {REQ-IDs if applicable}
```

### gsd-spike-runner Agent Pattern
```markdown
---
name: gsd-spike-runner
description: Executes spike Build -> Run -> Document phases from DESIGN.md
tools: Read, Write, Bash, Glob, Grep
color: cyan
---

<role>
Spike execution agent. Spawned by /gsd:spike command or plan-phase orchestrator.
Reads DESIGN.md, executes experiments, produces DECISION.md.
</role>

<references>
@get-shit-done/references/spike-execution.md
@.claude/agents/knowledge-store.md
</references>

<execution_flow>
1. Load DESIGN.md from spike directory
2. BUILD: Implement experiment scaffolding per experiment plan
3. RUN: Execute each experiment, capture metrics
4. DOCUMENT: Create DECISION.md with findings and decision
5. If inconclusive and rounds < 2: Propose narrowed hypothesis, checkpoint for approval
6. Persist to KB: Write spike entry to ~/.claude/gsd-knowledge/spikes/
7. Return structured result to orchestrator
</execution_flow>
```

### Spike Decision Point Integration (Additive)
```markdown
# In plan-phase.md orchestrator (NEW STEP, not replacement)

## 5.5. Handle Spike Decision Point

**After research completes, before planning:**

```bash
# Check for genuine gaps requiring spikes
GAPS=$(grep -A100 "### Genuine Gaps" "${PHASE_DIR}"/*-RESEARCH.md | grep "Critical\|Medium")
```

**If gaps found:**
1. Apply sensitivity filter from config (conservative/balanced/aggressive)
2. Apply autonomy mode (interactive: ask user; yolo: auto-spike)
3. For each approved spike:
   - Create spike directory with next index
   - Draft DESIGN.md
   - User confirms (interactive) or auto-approve (YOLO)
   - Spawn gsd-spike-runner
4. After spike completes:
   - Update RESEARCH.md with "Resolved by Spike" section
5. Proceed to planning with updated RESEARCH.md
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ad-hoc experimentation | Structured spike solutions (XP) | 1999 (Extreme Programming) | Time-boxed, focused exploration |
| Undocumented decisions | Architecture Decision Records (ADR) | 2011 (Michael Nygard) | Context, alternatives, consequences tracked |
| Build-and-hope | Hypothesis-Driven Development | 2015+ (feature flags era) | Empirical validation before commitment |
| Gut-feel design choices | Spike-driven uncertainty resolution | Current best practice | Evidence-based decision making |

**Current state:**
- MADR 4.0.0 (September 2024) is the latest ADR template format
- HDD typically uses feature flags for production testing; our spike workflow adapts this for pre-production design decisions
- Spike solutions remain XP's approach for technical risk reduction, now commonly used beyond strict XP

## Open Questions

1. **Spike result reuse before re-spiking (SPKE-08)**
   - What we know: CONTEXT.md defers this to Phase 5 (Knowledge Surfacing)
   - What's unclear: Will Phase 3 need any preparation for this?
   - Recommendation: Store spike metadata in KB (Phase 3 does this). Query before spiking is Phase 5 responsibility.

2. **Parallel spike execution**
   - What we know: CONTEXT.md lists this as "Future" optimization
   - What's unclear: Whether current design prevents it
   - Recommendation: Design assumes sequential. Independence (no `depends_on`) enables future parallelization.

3. **Spike artifact retention**
   - What we know: CONTEXT.md says "Keep all by default, user can clean up"
   - What's unclear: Whether experiment code (Build phase output) should persist or be cleaned up
   - Recommendation: Keep experiment code in spike directory. It's evidence for the decision. User can delete manually.

4. **Frustration-triggered spikes**
   - What we know: Phase 2 has frustration detection. CONTEXT.md doesn't mention frustration -> spike flow.
   - What's unclear: Should frustration signals ever trigger spike suggestion?
   - Recommendation: Not in Phase 3. Frustration -> Signal -> Lesson (Phase 4) -> Future behavior change. Spikes are for design uncertainty, not frustration.

## Sources

### Primary (HIGH confidence)
- Phase 3 CONTEXT.md - Detailed design decisions, schemas, integration points
- Phase 1 knowledge-store.md - KB schema for spike entries
- Phase 2 02-01-PLAN.md - Agent and reference doc patterns to follow
- Existing GSD agent specs - Agent structure, tool patterns, execution flow format

### Secondary (MEDIUM confidence)
- [MADR GitHub Repository](https://github.com/adr/madr) - ADR template structure, MADR 4.0.0 format
- [AWS ADR Best Practices](https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/) - Review process, team collaboration patterns
- [Mountain Goat Software - Spikes](https://www.mountaingoatsoftware.com/blog/spikes) - XP spike solution methodology
- [Scaled Agile Framework - Spikes](https://framework.scaledagile.com/spikes) - Enterprise spike patterns, timeboxing
- [LaunchDarkly HDD](https://launchdarkly.com/blog/hypothesis-driven-development-for-software-engineers/) - Hypothesis-driven development workflow

### Tertiary (LOW confidence)
- None - All findings verified against primary sources (CONTEXT.md decisions) or authoritative secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies; uses existing GSD patterns (agents, commands, references)
- Architecture: HIGH - Directly specified in CONTEXT.md with detailed schemas and flows
- Pitfalls: HIGH - Derived from ADR/spike/HDD literature and GSD fork constraints

**Research date:** 2026-02-04
**Valid until:** 2026-04-04 (stable domain - experimentation workflows are not fast-moving)
