# Architecture: Signal Tracking, Spikes, and Knowledge Base

**Domain:** Self-improving AI dev tooling (Markdown-based orchestration)
**Researched:** 2026-02-02
**Overall confidence:** HIGH (domain is well-understood; this is internal architecture design, not external ecosystem research)

## Recommended Architecture

```
                         ┌─────────────────────────────────────┐
                         │        EXISTING GSD SYSTEM           │
                         │                                     │
                         │  Commands → Workflows → Agents      │
                         │        .planning/ state              │
                         └──────────┬──────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
              │  SIGNAL    │  │   SPIKE   │  │ KNOWLEDGE │
              │ COLLECTOR  │  │  RUNNER   │  │   STORE   │
              └─────┬──────┘  └─────┬─────┘  └─────┬─────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                           ┌────────▼────────┐
                           │   REFLECTION    │
                           │    ENGINE       │
                           └─────────────────┘
```

### Component Boundaries

| Component | Responsibility | Location | Communicates With |
|-----------|---------------|----------|-------------------|
| Signal Collector | Captures workflow events, deviations, frustration signals during execution | New workflow steps + new agent | Knowledge Store (writes signals) |
| Spike Runner | Manages isolated experiment lifecycle: hypothesis → test → decision record | New command + workflow + agent + `.planning/spikes/` workspace | Knowledge Store (writes spike results) |
| Knowledge Store | Persistent file-based store for signals, spike results, distilled lessons | `~/.claude/gsd-knowledge/` (user-level, cross-project) | All components (read/write) |
| Reflection Engine | Aggregates signals into patterns, distills lessons, surfaces relevant knowledge | New workflow + agent | Knowledge Store (reads signals, writes lessons); existing research workflows (surfaces lessons) |

### Data Flow

```
CAPTURE                    STORAGE                  DISTILLATION              SURFACING
───────                    ───────                  ────────────              ─────────

Workflow execution ──→ Signal file (.signal.md)
  - deviation detected     written to
  - user frustration       ~/.claude/gsd-knowledge/  ──→ Reflection engine
  - agent struggle         signals/{project}/{date}/     reads signals,
  - config mismatch                                      detects patterns ──→ Lesson file (.lesson.md)
                                                                              written to
Spike completion ────→ Decision record (.spike.md)                            ~/.claude/gsd-knowledge/
  - hypothesis tested      written to                                         lessons/
  - data collected         ~/.claude/gsd-knowledge/
  - conclusion reached     spikes/{project}/                                 Research phase ←── reads lessons
                                                                              & spike results
                                                                              before web search
```

**Direction is strictly left-to-right:** Capture → Store → Distill → Surface. No component writes upstream.

## Component Details

### 1. Signal Collector

**What it is:** A lightweight capture mechanism that logs notable events during workflow execution without interrupting flow.

**Boundary:** The collector does NOT analyze or act on signals. It writes structured Markdown files and moves on. Analysis happens later in the Reflection Engine.

**Signal types:**
- **Deviation signals** — plan said X, execution did Y (detected by comparing PLAN.md to SUMMARY.md)
- **Frustration signals** — user expresses frustration, repeats themselves, or contradicts agent output (detected by pattern matching in orchestrator)
- **Struggle signals** — agent retries, rewrites, or takes unusually long (detected by executor self-report)
- **Config signals** — runtime behavior doesn't match config (e.g., wrong model spawned)

**Signal file format:**
```markdown
---
type: deviation | frustration | struggle | config
severity: low | medium | high
project: {project-name}
phase: {phase-number}
plan: {plan-number}
timestamp: {ISO-8601}
---

## What Happened
{description}

## Context
{relevant state at time of signal}

## Potential Cause
{agent's best guess, if any}
```

**Integration point:** Signal capture hooks into the execute-phase workflow at wave completion (after each wave, not after each task — keeps overhead minimal). A new `capture-signals` step runs between `execute_waves` iterations. This is a NEW workflow file, not an edit to execute-phase.md.

**Fork-friendly approach:** Create a new workflow `execute-phase-reflect.md` that wraps the existing `execute-phase.md` and adds signal capture before/after. The reflect command `/gsd:execute-phase` in the fork delegates to this wrapper instead of the upstream workflow. Upstream `execute-phase.md` stays untouched.

### 2. Spike Runner

**What it is:** An isolated experiment workflow that translates design uncertainty into testable hypotheses, runs them, and produces decision records.

**Boundary:** Spikes operate in their own workspace (`.planning/spikes/{spike-name}/`) and never modify main project files. A spike produces a decision record that gets stored in the Knowledge Store. The main workflow can then reference that decision.

**Spike lifecycle:**
```
/gsd:spike "Should we use X or Y for Z?"
  │
  ├── 1. Hypothesis formation (agent drafts testable hypothesis)
  ├── 2. Experiment design (what to build, what to measure, success criteria)
  ├── 3. Execution (isolated in .planning/spikes/{name}/, may create temp code)
  ├── 4. Data collection (measurements against criteria)
  ├── 5. Conclusion (decision record with methodology + data + recommendation)
  └── 6. Storage (decision record → ~/.claude/gsd-knowledge/spikes/)
```

**Spike workspace structure:**
```
.planning/spikes/{spike-name}/
  HYPOTHESIS.md       # What we're testing
  EXPERIMENT.md       # How we're testing it
  results/            # Raw experiment outputs
  DECISION.md         # Final decision record (also copied to knowledge store)
```

**Integration point:** New command `/gsd:spike` + new workflow `spike.md` + new agent `gsd-spike-runner.md`. Completely additive. The spike command is independent of the phase execution pipeline — users invoke it when they hit uncertainty during planning or execution.

**Key design decision:** Spikes do NOT pause the main workflow. They run in a separate invocation. If a user hits uncertainty during `/gsd:execute-phase`, they can `/gsd:pause-work`, run the spike separately, then `/gsd:resume-work` with the decision record informing the resumed execution.

### 3. Knowledge Store

**What it is:** A file-based persistent store at `~/.claude/gsd-knowledge/` that holds signals, spike results, and distilled lessons across projects and sessions.

**Boundary:** The Knowledge Store is a passive file system. It has no logic — it's just an agreed-upon directory structure with Markdown files. Components write to it; the Reflection Engine and Research workflows read from it.

**Directory structure:**
```
~/.claude/gsd-knowledge/
  signals/
    {project-name}/
      {YYYY-MM-DD}/
        {timestamp}-{type}.signal.md
  spikes/
    {project-name}/
      {spike-name}/
        DECISION.md
  lessons/
    {category}/
      {lesson-name}.lesson.md
  index.md                          # Auto-generated index for quick lookup
```

**Why `~/.claude/`:** This is where Claude Code stores user-level config. Knowledge that travels with the user across projects belongs here. Project-specific signals also get a copy in `.planning/signals/` for project context, but the canonical store is user-level.

**Why not a database:** GSD's zero-dependency philosophy. Markdown files are readable, diffable, greppable, and work everywhere. An index.md file with frontmatter-based metadata enables fast lookup without any runtime.

**Integration point:** The Knowledge Store is referenced by:
- Signal Collector (writes signals)
- Spike Runner (writes decision records)
- Reflection Engine (reads signals, writes lessons)
- Research workflows (reads lessons and spike results before web search)

### 4. Reflection Engine

**What it is:** A periodic analysis process that reads accumulated signals, detects patterns, and distills actionable lessons.

**Boundary:** The Reflection Engine does NOT run during normal workflow execution. It runs on explicit invocation (`/gsd:reflect`) or at natural boundaries (milestone completion, phase completion). It reads from the Knowledge Store and writes lessons back to it.

**Reflection process:**
```
1. Gather: Read all unprocessed signals from knowledge store
2. Cluster: Group signals by type, project, phase, pattern
3. Detect: Identify recurring patterns (same issue across projects, same struggle in similar phases)
4. Distill: Convert patterns into lessons with:
   - When this applies (trigger conditions)
   - What to do (actionable recommendation)
   - Evidence (which signals support this)
5. Store: Write lesson files to ~/.claude/gsd-knowledge/lessons/
6. Mark signals as processed
```

**Lesson file format:**
```markdown
---
category: library | architecture | workflow | tooling
confidence: low | medium | high
evidence_count: {N}
last_updated: {ISO-8601}
tags: [tag1, tag2]
---

## Lesson
{One-sentence lesson}

## When This Applies
{Trigger conditions — when should this lesson be surfaced?}

## Recommendation
{What to do}

## Evidence
- Signal: {path} — {summary}
- Signal: {path} — {summary}
```

**Integration point:** New command `/gsd:reflect` + new workflow `reflect.md` + new agent `gsd-reflector.md`. Also hooks into `complete-milestone` workflow as an optional final step. Completely additive.

**Surfacing integration:** The existing `gsd-phase-researcher` and `gsd-project-researcher` agents get a new sibling — a `gsd-knowledge-researcher` agent that queries the Knowledge Store before or alongside web research. This agent is spawned in parallel with existing researchers during the research phase. No modification to existing researcher agents needed.

## Patterns to Follow

### Pattern 1: Wrapper Workflows (Fork-Friendly Extension)
**What:** Instead of editing upstream workflow files, create new workflow files that wrap and extend them.
**When:** Adding behavior to existing workflows (signal capture during execution, reflection after milestone completion).
**Example:**
```
# execute-phase-reflect.md (NEW file)
# Wraps execute-phase.md, adds signal capture

<step name="pre_execution_snapshot">
  Capture baseline state for deviation detection
</step>

<step name="execute">
  Delegate to existing execute-phase.md workflow
</step>

<step name="post_execution_signals">
  Compare results to plan, capture deviation signals
</step>
```

### Pattern 2: Parallel Research Agents (Knowledge Surfacing)
**What:** Add a knowledge-base researcher as a parallel agent alongside existing researchers, rather than modifying existing research agents.
**When:** Surfacing lessons during research phases.
**Example:**
```
# During research phase, spawn in parallel:
# 1. gsd-project-researcher (existing — web search)
# 2. gsd-phase-researcher (existing — domain-specific)
# 3. gsd-knowledge-researcher (NEW — queries ~/.claude/gsd-knowledge/)
```

### Pattern 3: Passive Capture, Deferred Analysis
**What:** Signal capture is cheap and immediate; analysis is expensive and deferred.
**When:** Any signal capture during workflow execution.
**Why:** Keeps execution fast. Signals are just file writes. Pattern detection and lesson distillation happen later during explicit reflection.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Analysis During Execution
**What:** Running reflection or pattern detection during phase execution.
**Why bad:** Bloats context window, slows execution, creates coupling between execution and analysis.
**Instead:** Write signal files during execution. Run reflection separately.

### Anti-Pattern 2: Editing Upstream Files
**What:** Modifying existing GSD workflow/agent/command files to add reflection hooks.
**Why bad:** Creates merge conflicts when pulling upstream changes. Defeats fork strategy.
**Instead:** Create wrapper workflows and parallel agents. Use the command layer (which is already forked) to route to new workflows.

### Anti-Pattern 3: Monolithic Knowledge Store
**What:** One giant file for all knowledge.
**Why bad:** Context window bloat when loading. Hard to query. Grows unbounded.
**Instead:** Many small files with frontmatter metadata. Index file for quick lookup. Grep-based querying.

### Anti-Pattern 4: Blocking Spikes
**What:** Pausing main workflow execution to run a spike inline.
**Why bad:** Loses execution state, confuses the orchestrator, mixes experiment code with production code.
**Instead:** Spikes are separate invocations. User pauses work, runs spike, resumes with knowledge.

## Build Order

Components have dependencies that dictate build order:

```
Phase 1: Knowledge Store (foundation)
  └── Directory structure, file formats, index generation
  └── No dependencies on other new components
  └── Everything else writes to or reads from this

Phase 2: Signal Collector (first writer)
  └── Depends on: Knowledge Store (writes signals there)
  └── Signal file format, capture hooks, wrapper workflow
  └── Can test immediately: run phase, check signal files appear

Phase 3: Spike Runner (second writer)
  └── Depends on: Knowledge Store (writes decision records there)
  └── Spike command, workflow, agent, workspace management
  └── Independent of Signal Collector — can parallelize with Phase 2

Phase 4: Reflection Engine (first reader + writer)
  └── Depends on: Knowledge Store + signals existing to analyze
  └── Pattern detection, lesson distillation, lesson file format
  └── Needs accumulated signals to be useful

Phase 5: Knowledge Surfacing (integration)
  └── Depends on: Knowledge Store + lessons existing to surface
  └── gsd-knowledge-researcher agent, research phase integration
  └── The payoff — existing workflows get smarter
```

**Critical path:** Phase 1 → Phase 2 → Phase 4 → Phase 5. Spike Runner (Phase 3) is off the critical path and can be built in parallel with Phase 2.

**Why this order:**
- Knowledge Store first because every other component depends on its file format and directory structure.
- Signal Collector second because it's the primary data source for the Reflection Engine.
- Spike Runner can be parallel because it writes to Knowledge Store but doesn't depend on signals.
- Reflection Engine needs signals to exist before it's useful.
- Knowledge Surfacing is last because it needs lessons to exist before it adds value.

## Fork Maintenance Strategy

**Principle:** New features live in new files. Existing upstream files are never modified.

| Layer | Upstream Files (DO NOT EDIT) | Fork Files (NEW) |
|-------|------------------------------|-------------------|
| Commands | `commands/gsd/*.md` | `commands/gsd/spike.md`, `commands/gsd/reflect.md`, `commands/gsd/knowledge.md` |
| Workflows | `get-shit-done/workflows/*.md` | `get-shit-done/workflows/spike.md`, `get-shit-done/workflows/reflect.md`, `get-shit-done/workflows/execute-phase-reflect.md`, `get-shit-done/workflows/capture-signals.md` |
| Agents | `agents/gsd-*.md` | `agents/gsd-spike-runner.md`, `agents/gsd-reflector.md`, `agents/gsd-knowledge-researcher.md`, `agents/gsd-signal-collector.md` |
| Templates | `get-shit-done/templates/*.md` | `get-shit-done/templates/signal.md`, `get-shit-done/templates/lesson.md`, `get-shit-done/templates/spike/*.md` |
| References | `get-shit-done/references/*.md` | `get-shit-done/references/knowledge-store.md`, `get-shit-done/references/signal-types.md` |
| User-level | — | `~/.claude/gsd-knowledge/` (entirely new) |

**The one exception:** The `.claude/commands/gsd/` directory (the installed command copies) may need the fork's commands to override upstream routing. This is already how the fork works — commands are installed per-user and can point to fork-specific workflows. No upstream file editing needed.

**Merge strategy:** `git merge upstream/main` should be conflict-free because fork changes are all in new files. If upstream adds a file with the same name as a fork file (unlikely but possible), resolve by renaming the fork file.

## Sources

- HIGH confidence: Direct analysis of existing GSD codebase structure (commands, workflows, agents, templates, references)
- HIGH confidence: PROJECT.md requirements and constraints
- HIGH confidence: execute-phase.md workflow (primary integration target for signal capture)
- MEDIUM confidence: `~/.claude/` as knowledge store location (convention from Claude Code, but may need validation for OpenCode/Gemini CLI compatibility)

## Open Questions

1. **Cross-runtime knowledge store path:** `~/.claude/gsd-knowledge/` works for Claude Code. Does OpenCode or Gemini CLI use a different user config directory? May need a configurable path.
2. **Signal volume management:** Over time, thousands of signal files could accumulate. Need a pruning/archival strategy (possibly part of Reflection Engine — archive signals after lesson distillation).
3. **Implicit frustration detection:** Pattern matching for user frustration in orchestrator context is technically feasible but may have false positives. Needs experimentation (a spike candidate itself).
4. **Index generation performance:** For large knowledge stores, generating index.md on every write may be slow. Consider lazy index regeneration or append-only index updates.
