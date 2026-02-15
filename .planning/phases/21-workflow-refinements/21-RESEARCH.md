# Phase 21: Workflow Refinements - Research

**Researched:** 2026-02-14
**Domain:** GSD workflow optimization (signal context reduction, spike feasibility gates)
**Confidence:** HIGH

## Summary

Phase 21 addresses three specific gaps (10-12) identified in the post-v1.14 gap analysis. All three are internal GSD workflow improvements requiring markdown file edits -- no library code, no runtime dependencies, no tests against external systems. The scope is constrained and well-defined by four knowledge base signals that document the problems in detail.

**Gap 10** (signal context bloat): The `/gsd:signal` command loads ~888 lines of reference context via three `@` imports (knowledge-store.md at 366 lines, signal-detection.md at 258 lines, signal template at 29 lines, plus the 235-line command itself). Most of this context is never needed for a single signal recording. The workflow file (`get-shit-done/workflows/signal.md`) also declares `<required_reading>` that instructs the agent to load even more files. The fix is to inline the essential rules (severity auto-assignment, dedup logic, frustration patterns, template schema) directly into the signal command/workflow and remove the `@` imports of the full reference documents.

**Gap 11** (spike feasibility): The DESIGN.md template (`kb-templates/spike-design.md`) has no section for prerequisites, infrastructure needs, or feasibility assessment. The template goes directly from Question to Hypothesis without checking whether the experiment is even possible. The fix is to add a "Prerequisites / Feasibility" section to the template between "Question" and "Hypothesis" (or between "Experiment Plan" and "Scope Boundaries").

**Gap 12** (research-first gate): The `/gsd:spike` command and `run-spike.md` workflow proceed directly from question to DESIGN.md drafting. The `spike-integration.md` reference defines a research-before-spike flow for orchestrators (plan-phase, new-project), but the standalone `/gsd:spike` command has no equivalent gate. The fix is to add an advisory step in the run-spike workflow that evaluates whether the question is better answered by research than experimentation, and surfaces the spike anti-pattern guidance before design begins.

**Primary recommendation:** Three targeted markdown edits -- (1) consolidate signal command to be self-contained at under 200 lines of reference context, (2) add Prerequisites/Feasibility section to spike-design template, (3) add research-first advisory gate to run-spike workflow.

## Standard Stack

This phase involves no libraries, no code, and no external dependencies. All changes are to GSD's own markdown workflow files and templates.

### Core

| Artifact | Location | Purpose | Lines |
|----------|----------|---------|-------|
| Signal command | `commands/gsd/signal.md` | Entry point for /gsd:signal | 235 |
| Signal workflow | `get-shit-done/workflows/signal.md` | Signal creation process | 257 |
| Signal detection ref | `get-shit-done/references/signal-detection.md` | Detection rules, severity, dedup | 258 |
| Knowledge store ref | `.claude/agents/knowledge-store.md` | KB schema, layout, lifecycle | 366 |
| Signal template | `.claude/agents/kb-templates/signal.md` | Signal entry template | 29 |
| Spike design template | `.claude/agents/kb-templates/spike-design.md` | DESIGN.md template | 99 |
| Run-spike workflow | `get-shit-done/workflows/run-spike.md` | Spike orchestration | 195 |
| Spike execution ref | `get-shit-done/references/spike-execution.md` | Spike types, phases, anti-patterns | 353 |
| Spike integration ref | `get-shit-done/references/spike-integration.md` | Spike decision point for orchestrators | 304 |
| Spike command | `commands/gsd/spike.md` | Entry point for /gsd:spike | 65 |

### Installation / Deployment

All files exist in two locations:
1. **Source** (repo root): `commands/`, `get-shit-done/`, and root-level agent specs
2. **Installed** (per-runtime): `~/.claude/commands/`, `~/.claude/get-shit-done/`, `~/.claude/agents/`

The installer copies source to installed locations with path replacement. Changes must be made to SOURCE files. The installer handles deployment. No installer changes are needed for this phase -- file names and locations remain the same.

## Architecture Patterns

### Pattern 1: Self-Contained Command (for Gap 10)

**What:** Instead of loading full reference documents via `@` imports, inline only the rules the command actually needs directly into the command/workflow file.

**When to use:** When a command loads reference docs but only uses a fraction of their content.

**Current signal command context loading:**
```
signal.md command:          235 lines (the command itself)
  @knowledge-store.md:      366 lines (only needs: KB path, filename pattern, frontmatter schema)
  @signal-detection.md:     258 lines (only needs: severity rules, dedup rules, frustration patterns, cap rules)
  @signal template:          29 lines (needs: full template)
                            ----
Total loaded:               888 lines
Actually needed:           ~150 lines of extracted rules
```

**Target architecture:**
```
signal.md command:          ~180-200 lines (self-contained)
  Inlined: signal template schema (~15 lines)
  Inlined: severity auto-assignment rules (~10 lines)
  Inlined: frustration patterns (~12 lines)
  Inlined: dedup logic (~15 lines)
  Inlined: cap enforcement (~10 lines)
  Inlined: KB path and naming conventions (~10 lines)
  @imports: NONE
                            ----
Total context:              ~200 lines (down from 888)
```

**Key insight:** The signal workflow uses FIVE specific rule sets from the references:
1. Severity auto-assignment (SGNL-04) -- 8-line table from signal-detection.md Section 6
2. Frustration patterns (SGNL-06) -- 10 patterns + threshold from signal-detection.md Section 5
3. Dedup logic (SGNL-05) -- 5-step process from signal-detection.md Section 9
4. Cap enforcement (SGNL-09) -- 6-line process from signal-detection.md Section 10
5. Signal frontmatter schema -- from knowledge-store.md Section 4 + signal template

Everything else in the referenced documents (deviation detection, config mismatch detection, struggle detection, index format, directory structure, lifecycle rules, concurrency, etc.) is consumed by OTHER agents (gsd-signal-collector, gsd-spike-runner) and is irrelevant to the signal command.

### Pattern 2: Feasibility-First Design (for Gap 11)

**What:** Add a Prerequisites/Feasibility section to the spike DESIGN.md template that forces explicit consideration of what is needed BEFORE experiments are designed.

**Where in template:** Between "Question" and "Type" sections (or between "Experiment Plan" and "Scope Boundaries"). The key insight from signal sig-2026-02-11-spike-design-missing-feasibility is that this section mirrors "materials and methods feasibility" from real experimental protocols.

**Template addition:**
```markdown
## Prerequisites / Feasibility

**Environment requirements:**
- {API keys, credentials, or accounts needed}
- {CLI tools or dependencies to install}
- {Network access or service availability}

**Feasibility assessment:**
- [ ] All prerequisites are available or obtainable
- [ ] Experiment can run in spike workspace isolation
- [ ] No production systems or data at risk

**If prerequisites are NOT met:**
- {What to do: defer spike, adjust experiment, acquire prerequisites first}
```

### Pattern 3: Advisory Gate (for Gap 12)

**What:** Add a research-first advisory step in the run-spike workflow that evaluates the question BEFORE proceeding to DESIGN.md creation.

**Where in workflow:** Between Step 1 (Parse Inputs) and Step 3 (Draft DESIGN.md), as a new Step 2 (or Step 1.5).

**Advisory logic:**
```markdown
### 2. Research-First Advisory

Before drafting DESIGN.md, assess whether the question is better suited to research or experimentation:

**Research indicators** (suggest research instead):
- Question is about capabilities, features, or documentation ("Does X support Y?")
- Answer likely exists in official docs, changelogs, or community resources
- Question is fundamentally about WHAT exists, not HOW it performs
- No empirical measurement is needed to answer

**Spike indicators** (proceed with spike):
- Question requires empirical testing ("Is X faster than Y for our use case?")
- Answer depends on specific conditions that documentation cannot address
- Performance, reliability, or compatibility under specific constraints
- Documentation is ambiguous or contradictory

**Advisory output (Interactive mode):**
```
This question appears to be [research-suitable / spike-suitable].

[If research-suitable:]
This question may be answerable through documentation research rather
than empirical testing. The spike anti-pattern "Premature Spiking" warns
against running spikes for questions that normal research could answer.

Options:
1. Proceed with spike anyway (user knows best)
2. Cancel and research first
3. Rephrase question to focus on empirical aspect

[If spike-suitable:]
This question requires empirical testing. Proceeding to design.
```

**YOLO mode:** Log the assessment but proceed automatically. Do not block.
```

### Anti-Patterns to Avoid

- **Over-condensing the signal workflow:** Do not strip out functionality (dedup, cap, frustration detection). The goal is reducing CONTEXT LOADING, not reducing CAPABILITY. All the same rules apply; they are just inlined rather than loaded from external references.
- **Making the advisory gate blocking:** The research-first gate should be ADVISORY, not a hard gate. Users invoke /gsd:spike intentionally. The gate surfaces guidance, it does not prevent execution.
- **Breaking the gsd-signal-collector agent:** The signal-detection.md reference is still consumed by gsd-signal-collector and gsd-phase-researcher. Do NOT modify or delete signal-detection.md. The signal COMMAND stops importing it, but other consumers still need it.
- **Duplicating content across command and workflow:** The signal command (`commands/gsd/signal.md`) and signal workflow (`get-shit-done/workflows/signal.md`) overlap significantly. The command should delegate to the workflow. Consolidate into ONE self-contained artifact, not two partially-self-contained ones.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Context reduction | Custom context-loading framework | Inline the rules directly | This is a one-time consolidation, not a recurring pattern |
| Question classification | ML-based question classifier | Simple keyword heuristics | The advisory gate needs to be fast and transparent, not smart |
| Reference doc splitting | Modular doc loader with selective imports | Self-contained commands | Claude Code `@` imports are all-or-nothing; no partial loading exists |

**Key insight:** Claude Code's `@` reference system loads entire files. There is no "load lines 50-80 of signal-detection.md" mechanism. The only way to reduce context is to remove the `@` import and inline the needed content. This is a fundamental constraint of the platform.

## Common Pitfalls

### Pitfall 1: Breaking Other Consumers of the Reference Docs

**What goes wrong:** Modifying or deleting signal-detection.md or knowledge-store.md to "clean up" after the signal command no longer imports them.
**Why it happens:** Natural instinct to remove unused code. But these files are not unused -- they are consumed by OTHER agents.
**How to avoid:** The signal command stops IMPORTING these references. The references themselves remain unchanged. Verify all consumers before any reference doc modification.
**Warning signs:** Grep for `@` references and `required_reading` mentions of signal-detection.md and knowledge-store.md across all agent specs, commands, and workflows.

**Known consumers of signal-detection.md:**
- `gsd-signal-collector.md` agent spec (references section)
- `commands/gsd/signal.md` command (to be REMOVED by this phase)
- `get-shit-done/workflows/signal.md` workflow (required_reading -- to be REMOVED by this phase)

**Known consumers of knowledge-store.md:**
- `gsd-signal-collector.md` agent spec (references section)
- `gsd-spike-runner.md` agent spec (references section)
- `commands/gsd/signal.md` command (to be REMOVED by this phase)
- `get-shit-done/workflows/run-spike.md` workflow (references section)

### Pitfall 2: Command vs Workflow Duplication

**What goes wrong:** Making the signal command self-contained AND also making the signal workflow self-contained, leading to two copies of the same rules that can drift.
**Why it happens:** The signal command and signal workflow currently overlap (command has 235 lines, workflow has 257 lines, both describe the same 10-step process).
**How to avoid:** Choose ONE location for the self-contained process. The command file is what Claude Code loads for `/gsd:signal`. The workflow file should either be eliminated or reduced to a thin redirect. Based on how Claude Code works: the command's `<context>` `@` imports and body define what the agent sees. The workflow is loaded via the command if explicitly referenced. Consolidate into the command.
**Warning signs:** Two files describing the same process with slightly different wording.

### Pitfall 3: Line Count Target vs Actual Context

**What goes wrong:** Achieving <200 lines in the command file but still loading 600+ lines via `@` imports that were not removed.
**Why it happens:** Forgetting that the success criterion is about REFERENCE CONTEXT loaded, not just command file length.
**How to avoid:** The success criterion states "/gsd:signal loads <200 lines of reference context." This means the `@` imports must collectively be under 200 lines, OR the command must have no `@` imports and be self-contained under 200 lines. Verify by counting ALL loaded context, not just the primary file.
**Warning signs:** `@` references remaining in the command file.

### Pitfall 4: Forgetting the Source vs Installed Distinction

**What goes wrong:** Editing only the installed files (~/.claude/) instead of the source files in the repo.
**Why it happens:** Reading from installed paths during research, then editing those same paths.
**How to avoid:** All edits go to SOURCE files: `commands/gsd/signal.md`, `get-shit-done/workflows/signal.md`, `.claude/agents/kb-templates/spike-design.md` (which IS a source file -- templates live in agent dir), `get-shit-done/workflows/run-spike.md`. The installer re-deploys these on next install.
**Warning signs:** Editing files under `~/.claude/` instead of repo root.

### Pitfall 5: Advisory Gate That Is Too Aggressive

**What goes wrong:** The research-first advisory gate becomes annoying or blocks legitimate spike usage.
**Why it happens:** Over-engineering the classification logic, creating false positives where valid spike questions get flagged as "research-suitable."
**How to avoid:** Keep the heuristic simple. Err on the side of proceeding. The advisory is informational, not blocking. In YOLO mode, it should be a brief log line, not a checkpoint.
**Warning signs:** Multiple keywords in the heuristic that could match legitimate empirical questions.

## Code Examples

### Example 1: Self-Contained Signal Command (Target State)

The signal command after consolidation. No `@` imports. All rules inlined.

```markdown
---
name: gsd:signal
description: Log a manual signal observation to the knowledge base
argument-hint: '"description" [--severity critical|notable] [--type deviation|struggle|config-mismatch|custom]'
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create a manual signal entry in the knowledge base. Write a signal markdown
file to ~/.gsd/knowledge/signals/{project}/ and rebuild the index.
</objective>

<signal_rules>
## Signal Schema

File: ~/.gsd/knowledge/signals/{project}/{YYYY-MM-DD}-{slug}.md
ID: sig-{YYYY-MM-DD}-{slug}

Frontmatter:
  id, type: signal, project, tags: [], created, updated,
  durability: {workaround|convention|principle}, status: active,
  severity: {critical|notable},
  signal_type: {deviation|struggle|config-mismatch|capability-gap|custom},
  phase, plan, polarity: {positive|negative|neutral}, source: manual,
  occurrence_count: {N}, related_signals: [],
  runtime: {detected}, model: {detected}, gsd_version: {detected}

Body: ## What Happened / ## Context / ## Potential Cause

## Severity Auto-Assignment (SGNL-04)
| Condition | Severity |
|-----------|----------|
| Verification failed, config mismatch | critical |
| Multiple issues, non-trivial problems, unexpected improvements | notable |

## Frustration Patterns (SGNL-06)
Patterns: "still not working", "this is broken", "tried everything",
"keeps failing", "doesn't work", "same error", "frustrated",
"why won't", "makes no sense", "wasting time"
Threshold: 2+ patterns in recent messages. Suggest, do not auto-create.

## Dedup (SGNL-05)
1. Read ~/.gsd/knowledge/index.md
2. Match: same signal_type + same project + 2+ shared tags
3. If match: add to related_signals, set occurrence_count = max(matches) + 1
4. Do NOT modify existing signals (immutable)

## Cap (SGNL-09)
Max 10 active signals per phase per project.
If at cap: new signal replaces lowest-severity if new >= lowest.
Archive replaced signal (set status: archived in its frontmatter).
</signal_rules>

<process>
[... 10-step process, same logic, inlined rules ...]
</process>
```

**Estimated total:** ~180-200 lines, zero `@` imports, all rules inlined.

### Example 2: Spike Design Template with Prerequisites Section

```markdown
## Prerequisites / Feasibility

**Environment requirements:**
- {API keys, credentials, or accounts needed -- or "None"}
- {CLI tools or software to install -- or "None"}
- {Network access, service availability, hardware -- or "Standard dev environment"}

**Feasibility checklist:**
- [ ] All prerequisites available or obtainable within spike timeframe
- [ ] Experiments can run in spike workspace isolation (no main project modification)
- [ ] No production systems, data, or credentials at risk

**If prerequisites NOT met:**
{Action: defer spike until prerequisites available / adjust experiments to
work within constraints / document blocker and checkpoint}
```

### Example 3: Research-First Advisory Gate in run-spike.md

```markdown
### 2. Research-First Advisory

Assess whether the question is better suited to research or experimentation.

**Research indicators** (question may not need a spike):
- Asks about capabilities, features, or API support ("Does X support Y?")
- Answer likely in official documentation or changelogs
- Asks WHAT exists rather than HOW it performs empirically
- No measurement under specific conditions is needed

**Spike indicators** (question genuinely needs experimentation):
- Requires empirical measurement ("Is X faster than Y for our workload?")
- Depends on conditions documentation cannot address
- Tests performance, reliability, or compatibility under specific constraints
- Official documentation is ambiguous or contradictory

**If mode == interactive AND question appears research-suitable:**

Present advisory:
  "This question may be answerable through documentation research
  rather than empirical experimentation. The spike workflow's
  anti-pattern list identifies 'Premature Spiking' as running spikes
  for questions that research could resolve.

  Options:
  1. Proceed with spike (you know your intent best)
  2. Cancel -- try research first
  3. Rephrase to focus on the empirical aspect"

**If mode == yolo OR question appears spike-suitable:**
Log brief assessment and proceed.
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Signal command loads full reference docs (888 lines) | Self-contained command with inlined rules (~200 lines) | 4x context reduction |
| Spike DESIGN.md has no feasibility section | Template includes Prerequisites/Feasibility | Proactive obstacle identification |
| /gsd:spike goes directly to DESIGN.md | Advisory gate evaluates research-vs-spike suitability | Reduces premature spiking |

## Open Questions

1. **Should the signal workflow file be eliminated entirely or kept as a thin redirect?**
   - What we know: The command file (`commands/gsd/signal.md`) and workflow file (`get-shit-done/workflows/signal.md`) describe the same 10-step process. Claude Code loads the command directly.
   - What is unclear: Whether any orchestrator references the workflow file independently of the command.
   - Recommendation: Check for references to the workflow file. If none exist outside the command, eliminate the workflow and make the command fully self-contained. If references exist, keep the workflow as a thin pointer to the command.

2. **Should the advisory gate also apply when spikes are triggered by orchestrators (plan-phase)?**
   - What we know: The spike-integration.md reference already defines a research-before-spike flow for orchestrators. The advisory gate is specifically for standalone /gsd:spike invocation.
   - What is unclear: Whether the orchestrator flow is sufficient or should also display the advisory.
   - Recommendation: Only add the advisory to the standalone /gsd:spike flow. Orchestrators already have the research step via spike-integration.md.

3. **Where exactly should Prerequisites/Feasibility go in the DESIGN.md template?**
   - What we know: The signal says it mirrors "materials and methods feasibility" from real experimental protocols. In scientific method, feasibility comes before experiment design.
   - What is unclear: Whether to place it before or after the Experiment Plan section.
   - Recommendation: Place it AFTER "Question" and "Type" but BEFORE "Hypothesis" and "Experiment Plan". This way, feasibility is assessed before experiments are designed -- matching the scientific protocol order.

## Sources

### Primary (HIGH confidence)

- **sig-2026-02-11-signal-workflow-context-bloat** -- Documents the 864-line context loading problem for /gsd:signal. Verified by line count: actual total is 888 lines (235 + 366 + 258 + 29).
- **sig-2026-02-11-spike-design-missing-feasibility** -- Documents the missing prerequisites section in DESIGN.md template. Identifies the reactive vs proactive design philosophy gap.
- **sig-2026-02-11-premature-spiking-no-research-gate** -- Documents the missing research-first advisory for standalone /gsd:spike. Notes that spike-integration.md has this for orchestrators but /gsd:spike does not.
- **sig-2026-02-11-agent-inline-research-context-bloat** -- Related signal about context bloat from inline research. Informs the general context reduction philosophy.
- Direct line count verification of all source files (performed during research).
- Direct reading of all affected workflow, command, reference, and template files.

### Secondary (MEDIUM confidence)

- None needed. All findings are from direct source file analysis and KB signals from this project.

### Tertiary (LOW confidence)

- None.

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-11-signal-workflow-context-bloat | signal | Signal workflow loads ~864 lines of reference context | Architecture Patterns (Pattern 1) |
| sig-2026-02-11-spike-design-missing-feasibility | signal | DESIGN.md template lacks prerequisites/feasibility section | Architecture Patterns (Pattern 2) |
| sig-2026-02-11-premature-spiking-no-research-gate | signal | /gsd:spike has no research-first advisory gate | Architecture Patterns (Pattern 3) |
| sig-2026-02-11-agent-inline-research-context-bloat | signal | Context bloat from inline research in main conversation | Common Pitfalls (context loading philosophy) |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- direct file analysis, exact line counts verified
- Architecture: HIGH -- patterns derived from KB signals with specific problem descriptions and root causes
- Pitfalls: HIGH -- identified from actual file structure and known consumer relationships

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable -- internal workflow files with no external dependencies)
