# Phase 22: Agent Boilerplate Extraction - Extraction Registry

**Created:** 2026-02-18
**Phase:** 22-agent-boilerplate-extraction
**Purpose:** Audit trail documenting what was extracted from which agents to the shared protocol

## Overview

This registry maps every section extracted from the 11 GSD agent specs to the shared `agent-protocol.md` file. It provides line number references to original source locations and classifies the extraction type.

**Total agents processed:** 11
**Protocol sections created:** 13
**Estimated lines extracted:** ~600 lines across all agents

## Extraction Categories

### Category 1: Git Safety Rules

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Git Safety Rules | gsd-executor.md | L246 | Section 1 | FULL EXTRACT | "NEVER git add . or git add -A" |
| Git Safety Rules | gsd-debugger.md | L991 | Section 1 | FULL EXTRACT | Identical wording |

**Content:** NEVER use `git add .` or `git add -A`, stage files individually by name

**Rationale:** Identical across agents, prevents unintended commits of sensitive files

---

### Category 2: File Staging Conventions

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| File Staging | gsd-executor.md | L244-250 | Section 2 | FULL EXTRACT | Explicit staging per file, git status check |

**Content:** `git status --short` check before staging, each file staged individually

---

### Category 3: Commit Format Conventions

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Commit Type Table | gsd-executor.md | L253-260 | Section 3 | EXTRACT AS REFERENCE | References git-integration.md as canonical |
| Commit Format | gsd-debugger.md | L991-998 | Section 3 | EXTRACT AS REFERENCE | Abbreviated format |

**Content:** Commit format is `{type}({phase}-{plan}): {description}` with bullet-point body. Full reference to git-integration.md for canonical commit type table.

**Note:** Protocol references git-integration.md rather than duplicating it, avoiding third source of truth.

---

### Category 4: gsd-tools.js Commit Pattern

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| gsd-tools commit | gsd-executor.md | L368 | Section 4 | FULL EXTRACT | Pattern for planning artifacts |
| gsd-tools commit | gsd-planner.md | L1058 | Section 4 | FULL EXTRACT | Same pattern |
| gsd-tools commit | gsd-phase-researcher.md | L386-387 | Section 4 | FULL EXTRACT | Same pattern |
| gsd-tools commit | gsd-debugger.md | L1001-1002 | Section 4 | FULL EXTRACT | Same pattern |
| gsd-tools commit | gsd-research-synthesizer.md | (commit step) | Section 4 | FULL EXTRACT | Same pattern |

**Content:** `node ./.claude/get-shit-done/bin/gsd-tools.js commit "{message}" --files {paths}`

**When to use:** After task completion, after creating docs (PLAN, SUMMARY, RESEARCH, DEBUG)

---

### Category 5: commit_docs Configuration

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| commit_docs | gsd-executor.md | (implicit) | Section 5 | EXTRACT CONVENTIONS | Controls git only, not writes |
| commit_docs | gsd-planner.md | (state updates) | Section 5 | EXTRACT CONVENTIONS | Same rule |
| commit_docs | gsd-phase-researcher.md | L382-383 | Section 5 | EXTRACT CONVENTIONS | Explicit: "controls git only" |
| commit_docs | gsd-debugger.md | L982-987 | Section 5 | EXTRACT CONVENTIONS | Check config before commit |

**Content:** `commit_docs` controls git operations only, NOT file writing. Always write files first, then check commit_docs. gsd-tools.js commit respects commit_docs automatically.

---

### Category 6: State File Path Conventions

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| State paths | gsd-executor.md | L29 (STATE.md) | Section 6 | EXTRACT CONVENTIONS | Referenced across 5+ agents |
| State paths | gsd-planner.md | (multiple refs) | Section 6 | EXTRACT CONVENTIONS | Phase directories, PLAN/SUMMARY naming |
| State paths | gsd-verifier.md | (verification paths) | Section 6 | EXTRACT CONVENTIONS | VERIFICATION.md pattern |
| State paths | gsd-plan-checker.md | (state loading) | Section 6 | EXTRACT CONVENTIONS | Uses state paths |
| State paths | gsd-phase-researcher.md | L380 (RESEARCH.md path) | Section 6 | EXTRACT CONVENTIONS | Phase file patterns |

**Content:**
- `.planning/` root
- `.planning/STATE.md`, `.planning/ROADMAP.md`
- `.planning/phases/XX-name/` pattern
- `.planning/debug/`, `.planning/research/`, `.planning/codebase/`
- File naming: `{phase}-CONTEXT.md`, `{phase}-{plan}-PLAN.md`, etc.

---

### Category 7: gsd-tools.js Init Pattern

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| gsd-tools init | gsd-executor.md | L22 | Section 7 | EXTRACT PATTERN | `init execute-phase` |
| gsd-tools init | gsd-planner.md | L836 | Section 7 | EXTRACT PATTERN | `init plan-phase` |
| gsd-tools init | gsd-phase-researcher.md | L314 | Section 7 | EXTRACT PATTERN | `init phase-op` |
| gsd-tools init | gsd-plan-checker.md | (init usage) | Section 7 | EXTRACT PATTERN | Various subcommands |
| gsd-tools init | gsd-debugger.md | L985 | Section 7 | EXTRACT PATTERN | `state load` |

**Content:** General pattern `INIT=$(node ./.claude/get-shit-done/bin/gsd-tools.js init {subcommand} "${PHASE}")`. Lists available subcommands. Specific invocations remain in agent specs (agent-specific).

**Extraction type:** EXTRACT PATTERN — protocol documents the pattern, agents retain their specific subcommand usage.

---

### Category 8: Tool Strategy (Context7, WebSearch, Brave)

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Tool Priority | gsd-phase-researcher.md | L84-99 | Section 8 | FULL EXTRACT | Context7 > WebFetch > WebSearch |
| Context7 Flow | gsd-phase-researcher.md | L70-75 | Section 8 | FULL EXTRACT | resolve-library-id then query-docs |
| WebSearch Tips | gsd-phase-researcher.md | L91-98 | Section 8 | FULL EXTRACT | Include year, multiple variations |
| Brave Search API | gsd-phase-researcher.md | L100-114 | Section 8 | FULL EXTRACT | gsd-tools.js websearch pattern |
| Tool Priority | gsd-project-researcher.md | L63-75 | Section 8 | FULL EXTRACT | Near-identical to phase-researcher |
| Brave Search | gsd-project-researcher.md | L95-108 | Section 8 | FULL EXTRACT | Same pattern |

**Content:** ~90 lines covering tool priority table, Context7 workflow, WebSearch best practices, Brave Search API usage via gsd-tools.js

**Note:** Largest single duplication between any two agents (phase-researcher and project-researcher had near-identical ~80-90 line sections)

---

### Category 9: Source Hierarchy & Confidence Levels

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Confidence Levels | gsd-phase-researcher.md | L132-142 | Section 9 | FULL EXTRACT | HIGH/MEDIUM/LOW table |
| Source Priority | gsd-phase-researcher.md | L140 | Section 9 | FULL EXTRACT | Context7 > Docs > GitHub > WebSearch |
| Confidence Levels | gsd-project-researcher.md | L124-133 | Section 9 | FULL EXTRACT | Identical table |

**Content:** HIGH/MEDIUM/LOW confidence table with source types, source priority chain

---

### Category 10: Research Verification Protocol

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Verification Flow | gsd-phase-researcher.md | L144-150 | Section 10 | FULL EXTRACT | Context7 > official docs > multiple sources |
| Known Pitfalls | gsd-phase-researcher.md | L144-175 | Section 10 | FULL EXTRACT | Config Scope Blindness, Deprecated Features, etc. |
| Pre-Submission Checklist | gsd-phase-researcher.md | L164-173 | Section 10 | FULL EXTRACT | Research quality checklist |
| Verification Flow | gsd-project-researcher.md | L136-150 | Section 10 | FULL EXTRACT | Identical to phase-researcher |
| Known Pitfalls | gsd-project-researcher.md | L139-155 | Section 10 | FULL EXTRACT | Same 4 pitfalls |
| Pre-Submission Checklist | gsd-project-researcher.md | L156-165 | Section 10 | FULL EXTRACT | Identical checklist |

**Content:** Verification flow, known pitfalls (Configuration Scope Blindness, Deprecated Features, Negative Claims, Single Source Reliance), pre-submission checklist

**Note:** ~30 lines per agent, functionally identical between phase-researcher and project-researcher

---

### Category 11: Quality Degradation Curve & Context Budget

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Quality Curve Table | gsd-planner.md | L76-83 | Section 11 | FULL EXTRACT | 0-30% PEAK, 30-50% GOOD, etc. |
| Context Budget Rule | gsd-planner.md | L82 | Section 11 | FULL EXTRACT | Plans should complete within ~50% |
| Quality Curve | gsd-plan-checker.md | (references planner) | Section 11 | FULL EXTRACT | Uses same table for verification |

**Content:** Quality Degradation Curve table (Context Usage vs Quality vs Claude's State), context budget rule (~50% target for plans, ~40% for TDD)

**Note:** Both planner and checker reference the same table with no customization — pure shared operational guidance

---

### Category 12: Structured Return Format Pattern

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Return Pattern | All 11 agents | (various) | Section 12 | EXTRACT CONVENTIONS ONLY | All use `## {STATUS}` header |
| Metadata Fields | All 11 agents | (various) | Section 12 | EXTRACT CONVENTIONS ONLY | Phase, Status in all returns |
| Table Usage | All 11 agents | (various) | Section 12 | EXTRACT CONVENTIONS ONLY | Tables for structured data |

**Content:** Structural conventions only — all returns use `## {STATUS KEYWORD}` header, include Phase/Status metadata, use tables for structured data

**Note:** Actual return types and content STAY in each agent. Protocol defines formatting standards only.

---

### Category 13: Forbidden Files

| Section Name | Source Agent(s) | Line Numbers | Protocol Section | Extraction Type | Notes |
|--------------|----------------|--------------|------------------|-----------------|-------|
| Forbidden Files | gsd-codebase-mapper.md | (implicit in process) | Section 13 | FULL EXTRACT | Rules about files agents must not modify |

**Content:**
- Sensitive files (.env, credentials.json)
- System files (.git/, node_modules/)
- Build artifacts (dist/, .next/)

**Note:** Currently only in codebase-mapper but should apply to ALL agents — extracted to protocol as universal rule

---

## Summary Statistics

**Total sections extracted:** 13
**Agents with most extraction:**
1. gsd-phase-researcher: ~150 lines (tool strategy + verification protocol)
2. gsd-project-researcher: ~150 lines (near-identical to phase-researcher)
3. gsd-executor: ~60 lines (git safety, commit format, state updates)
4. gsd-planner: ~40 lines (quality curve, context budget)
5. gsd-debugger: ~30 lines (git safety, commit format, state)

**Estimated lines removed across all agents:** ~600 lines total

**Agents with light extraction:**
- gsd-verifier: ~10 lines (state paths only)
- gsd-roadmapper: ~5 lines (state paths only)
- gsd-integration-checker: ~5 lines (structured returns only)

## Sections That STAYED in Agents

For completeness, these sections remain agent-specific (not extracted):

**Identity sections (ALL agents):**
- `<role>` — What the agent is and who spawns it
- `<philosophy>` — Agent-specific mental models and principles
- Domain methodology sections (hypothesis testing, goal-backward, research modes, etc.)

**Domain-specific execution (varies by agent):**
- `<execution_flow>` — Agent-specific execution steps
- `<structured_returns>` — Actual return content (not formatting conventions)
- `<success_criteria>` — Agent-specific completion criteria

**Agent-unique sections:**
- Deviation rules (executor only)
- Checkpoint protocol details (executor, planner)
- Hypothesis testing framework (debugger only)
- Goal-backward methodology (planner, verifier — different applications)
- Discovery levels (planner only)
- TDD integration (planner, executor)
- Gap closure mode (planner only)
- Debug file protocol (debugger only)

**The test applied:** "Does this define what the agent IS, or how it OPERATES?"
- Identity stayed in agents
- Operations moved to protocol

---

## Final Line Counts

### Modified Agents (Existed Pre-Extraction)

| Agent | Pre-Extraction | Post-Extraction | Lines Removed | % Reduction |
|-------|---------------|-----------------|---------------|-------------|
| gsd-executor | 842 | 457 | 385 | 46% |
| gsd-planner | 1,437 | 1,209 | 228 | 16% |
| gsd-debugger | 1,260 | 1,252 | 8 | 1% |
| gsd-phase-researcher | 763 | 503 | 260 | 34% |
| **Subtotal (modified)** | **4,302** | **3,421** | **881** | **20%** |

### New Agents (Created During Extraction)

These agents were created as new standalone specs during Plans 03-04. They did not exist as separate agent files before Phase 22 -- their functionality was previously embedded in orchestrator workflows and commands.

| Agent | Lines | Created In |
|-------|-------|------------|
| gsd-codebase-mapper | 743 | Plan 04 (022d068) |
| gsd-integration-checker | 427 | Plan 04 (c369df3) |
| gsd-plan-checker | 626 | Plan 04 (022d068) |
| gsd-project-researcher | 517 | Plan 03 (0b51f15) |
| gsd-research-synthesizer | 240 | Plan 04 (022d068) |
| gsd-roadmapper | 609 | Plan 04 (c369df3) |
| gsd-verifier | 527 | Plan 04 (c369df3) |
| **Subtotal (new)** | **3,689** | |

### Retired Agents (Not Part of Extraction)

These agents still exist in git history but are no longer in active use (deleted from working tree separately from Phase 22).

| Agent | Lines (Last Known) |
|-------|-------------------|
| gsd-reflector | 278 |
| gsd-signal-collector | 209 |
| gsd-spike-runner | 474 |
| **Subtotal (retired)** | **961** |

### Totals

| Metric | Value |
|--------|-------|
| **Pre-extraction agent lines** (4 modified) | 4,302 |
| **Post-extraction agent lines** (11 active) | 7,110 |
| **Protocol file** (agent-protocol.md) | 540 lines |
| **Lines removed from modified agents** | 881 |
| **New agent lines added** | 3,689 |
| **Net agent line change** | +2,808 (4,302 -> 7,110) |

**Note:** The net increase in total agent lines reflects the CREATION of 7 new standalone agent specs that previously had no dedicated files. The extraction goal was not to reduce total lines, but to:
1. Eliminate duplicated operational content across agents (achieved: 881 lines removed from 4 agents)
2. Centralize operational conventions in one protocol file (achieved: 540-line protocol with 13 sections)
3. Enable single-file convention maintenance (achieved: all 11 agents reference protocol via `<required_reading>`)

The actual deduplication benefit is best measured by the 881 lines removed from the 4 agents that had inline operational content, versus the 540-line protocol that replaces it -- a net reduction of 341 lines of duplicated content.

---

## Verification Results

See: [22-VERIFICATION.md](./22-VERIFICATION.md)

- **Agents verified:** gsd-executor, gsd-planner, gsd-verifier
- **Overall verdict:** PASS
- **Content coverage:** 100% -- all pre-extraction content accounted for
- **Regressions found:** 0
- **Enhancements added during extraction:** 3 (executor: self_check; planner: context_fidelity, validate_plan)
- **Quality fix applied:** Commit af34ff3 restored knowledge_surfacing to 4 agents

---

**Registry Complete**

This extraction enables single-file convention maintenance: changing an operational convention requires editing `agent-protocol.md` once, not 11 agent specs. All 11 active GSD agents now reference the shared protocol via `<required_reading>` tags.
