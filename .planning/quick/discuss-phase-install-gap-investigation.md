# discuss-phase Install Gap Investigation (Revised)

**Date:** 2026-04-02
**Status:** Source-install semantic gap documented -- source does NOT have exploratory features
**Related:** GitHub Issue #26 (cross-runtime semantic divergence)

## Critical Finding

The npm source (`get-shit-done/workflows/discuss-phase.md`, 1098 lines) contains **upstream decision-closing semantics** where `--auto` picks recommended defaults and locks them. The user's locally modified install at `~/.claude/` (444 lines, now backed up to `gsd-local-patches/`) changed `--auto` to be **exploratory** -- opening uncertainty for research and avoiding premature decision closure.

**A previous agent session ran `node bin/install.js --global`, which overwrote the user's preferred exploratory version with the upstream decision-closing version.** This is the exact hazard documented in Issue #26.

## Version Map (Current State)

| Location | Lines | Semantics | Status |
|----------|-------|-----------|--------|
| Source (`get-shit-done/workflows/discuss-phase.md`) | 1098 | **Decision-closing** (upstream) | Active in npm source |
| Global install (`~/.claude/get-shit-done-reflect/workflows/discuss-phase.md`) | 1098 | **Decision-closing** (upstream) | Overwrote exploratory version |
| Local patches (`~/.claude/gsd-local-patches/get-shit-done-reflect/workflows/discuss-phase.md`) | 444 | **Exploratory** (user's version) | Backup only -- no longer active |
| Local patches (`~/.claude/gsd-local-patches/get-shit-done/workflows/discuss-phase.md`) | 444 | **Exploratory** (pre-namespace) | Backup only |
| Project-local (`.claude/get-shit-done-reflect/workflows/discuss-phase.md`) | 1098 | **Decision-closing** (upstream) | Installed from source |

## What `--auto` Means in Each Version

### Source (1098 lines): Decision-Closing

`--auto` in the source version means: "run without asking the user, pick recommended defaults."

Specific behaviors:
- `check_existing`: Auto-select "Update it" if context exists, "Continue and replan after" if plans exist
- `present_gray_areas`: Auto-select ALL gray areas
- `discuss_areas`: For each question, **choose the recommended option** (first option or one marked "recommended") without using AskUserQuestion
- `auto_advance`: Chain into plan-phase and execute-phase automatically
- Logs each auto-selected choice inline

The fundamental posture: resolve ambiguity by making choices. When `--auto` runs, gray areas get answered, decisions get locked, and the pipeline advances.

### User's Exploratory Version (444 lines): Research-Opening

`--auto` in the user's version means: "run without asking the user, but bias toward keeping uncertainty open."

Specific behaviors:
- No gray area identification step at all
- No AskUserQuestion multi-select flow
- `analyze_phase`: In auto mode, "do not ask even if ambiguity remains; default unresolved areas into Open Questions"
- `resolve_unresolved`: Uses explicit precedence order biased toward Open Questions:
  1. Derived Constraints (only when already fixed)
  2. Deferred Ideas (out of scope)
  3. **Open Questions (default home for unresolved gray areas)**
  4. Working Model & Assumptions (provisional scaffolding only)
  5. Claude's Discretion (reversible, low-blast-radius only)
  6. Implementation Decisions (only when directly entailed)
- "Bias strongly toward Open Questions, not locked decisions"
- "Never lock a decision merely to make the document feel complete"
- If unresolved `final` ambiguity remains: mark status as "Needs clarification" or "Ready for research with intent risk"

The fundamental posture: preserve uncertainty for downstream research. When `--auto` runs, most gray areas become open questions, assumptions stay provisional, and the output is a research-ready steering brief rather than a locked decision document.

## Detailed Semantic Differences

### 1. Process Architecture

| Aspect | Source (1098) | User's Version (444) |
|--------|---------------|----------------------|
| Steps | 12 steps (init, check, load_prior, cross_ref_todos, scout, KB, analyze, present, advisor, discuss, write, auto_advance) | 7 steps (init, check, analyze, resolve, write, confirm, commit) |
| Interactive flow | Gray area multi-select, 4 questions per area, more/next loop | 1-3 batched high-leverage prompts max |
| Subagent spawning | Advisor-researcher agents per gray area | None |
| Codebase integration | Scout step, code context in output | None (pure reasoning) |
| KB integration | Scans knowledge base index | None |
| Todo cross-reference | Surfaces relevant todos | None |
| Discussion log | DISCUSSION-LOG.md audit trail | None |

### 2. CONTEXT.md Output Structure

| Section | Source (1098) | User's Version (444) |
|---------|---------------|----------------------|
| Phase Boundary | Yes | Yes |
| Working Model & Assumptions | **No** | Yes |
| Implementation Decisions | Yes | Yes (rare, grounded only) |
| Derived Constraints | **No** | Yes |
| Open Questions | **No** (in write_context template) | Yes (default home) |
| Epistemic Guardrails | **No** | Yes |
| Canonical References | Yes | **No** |
| Code Context | Yes | **No** |
| Specific Ideas | Yes | Yes |
| Deferred Ideas | Yes | Yes |

### 3. Philosophy

| Principle | Source (1098) | User's Version (444) |
|-----------|---------------|----------------------|
| Core identity | "Thinking partner -- user is visionary, Claude is builder" | "Reduce avoidable ambiguity before planning" |
| What Claude asks about | Vision and implementation choices | Only high-leverage ambiguity after derivation |
| What Claude does NOT ask about | Technical implementation, architecture, performance | Anything already settled by roadmap/requirements/code |
| Uncertainty handling | Resolve by choosing recommended option | Classify (material/formal/efficient/final) and preserve as open question |
| Status states | "Ready for planning" | "Ready for research", "Ready for planning", "Ready for research with intent risk", "Needs clarification" |

### 4. `--auto` Behavior (The Core Divergence)

| Behavior | Source (1098) | User's Version (444) |
|----------|---------------|----------------------|
| Gray area handling | Select all, answer all | No gray areas -- analyze and classify |
| Decision making | Pick recommended option for each | Place unresolved items in Open Questions |
| Locking posture | Lock decisions, log choices | "Never lock a decision merely to make the document feel complete" |
| Completion signal | Auto-advance to plan-phase | "Ready for research" or "Ready for research with intent risk" |
| Final cause ambiguity | Infer and lock | "Do not freeze intent from inference alone" |
| Pipeline behavior | Chain: discuss -> plan -> execute | Stop at context; next step is research |

### 5. Command Wrapper Differences

| Aspect | Source (`commands/gsd/discuss-phase.md`, 86 lines) | User's Patch (`gsd-local-patches/commands/gsdr/discuss-phase.md`, 78 lines) |
|--------|------|------|
| Description | "Gather phase context through adaptive questioning before planning" | "Create phase steering context before planning (v1.17.5+dev)" |
| Argument hint | `<phase>` | `<phase> [--auto]` |
| Objective | "Extract implementation decisions" via gray areas | "Create CONTEXT.md as a phase steering brief" |
| Auto mode doc | Not mentioned in command | Explicitly documented: "bias toward opening uncertainty up for research" |

### 6. Context Template Differences

| Aspect | Source (`templates/context.md`, 314 lines) | User's Patch (`gsd-local-patches/get-shit-done-reflect/templates/context.md`, 358 lines) |
|--------|------|------|
| Purpose framing | "Document decisions downstream agents need" | "Document the steering context downstream agents need" |
| Template sections | domain, decisions, specifics, deferred | domain, assumptions, decisions, constraints, questions, guardrails, specifics, deferred |
| Downstream consumer description | Researcher "reads decisions to focus research" | Researcher "reads decisions, constraints, open questions, assumptions, and guardrails to focus research" |
| Open Questions | Appended as a separate guideline section | Integrated into the main template with type classification |

## What the Source Does NOT Have

The following concepts from the user's exploratory version have no equivalent in the 1098-line source:

1. **Working Model & Assumptions** -- hypotheses that research must verify, explicitly provisional
2. **Derived Constraints** -- binding context inherited from requirements, prior decisions, signals, code realities, or local patches
3. **Epistemic Guardrails** -- what downstream stages must verify, not assume
4. **Four-cause classification** of unresolved areas (material, formal, efficient, final)
5. **Status states beyond "Ready for planning"** -- "Ready for research", "Ready for research with intent risk", "Needs clarification"
6. **Synthesis priority rules** -- explicit precedence order for where to place unresolved items
7. **"Derive before reopening" principle** -- record derivations instead of re-asking
8. **"Respect uncertainty" principle** -- uncertainty may become assumption, open question, discretion area, or deferred idea; never fake certainty
9. **resolve_unresolved step** -- structured resolution with grounding precedence
10. **Context model taxonomy** -- explicit table mapping section to purpose

## What the User's Version Does NOT Have

The source has features the user's version lacks. These may or may not be desirable:

1. Gray area identification and interactive selection
2. Prior context loading from PROJECT.md, REQUIREMENTS.md, prior CONTEXT.md files
3. Todo cross-referencing
4. Codebase scouting
5. KB knowledge surfacing
6. Advisor-researcher subagent spawning
7. Discussion log generation
8. Auto-advance chaining (discuss -> plan -> execute)
9. Canonical references accumulation
10. Batch mode, analyze mode, text mode, research-before-questions mode
11. Context7 integration for library choices
12. Code context section in CONTEXT.md

## Damage Assessment

The previous investigation ran `node bin/install.js --global`, which:
1. Overwrote the user's active exploratory workflow with the source's decision-closing workflow
2. Backed up the exploratory version to `~/.claude/gsd-local-patches/get-shit-done-reflect/workflows/discuss-phase.md`
3. Updated the command wrapper to the source version
4. Updated the context template to the source version

The exploratory version is NOT lost -- it exists in `gsd-local-patches/` -- but it is no longer active. Running `discuss-phase --auto` now uses decision-closing semantics instead of the user's preferred exploratory semantics.

## Recommended Actions

1. **Do NOT run the installer again** until the semantic question from Issue #26 is resolved
2. **The source needs to incorporate the exploratory `--auto` semantics** if the user's intent is the intended direction -- this is a source change, not an install change
3. **The `gsd-local-patches` backup is the recovery point** if the user needs the exploratory version restored to active use immediately
4. **Issue #26 is the authoritative tracker** for resolving which `--auto` semantics should be canonical

## File Paths Reference

- Source workflow: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/workflows/discuss-phase.md`
- Source command: `/home/rookslog/workspace/projects/get-shit-done-reflect/commands/gsd/discuss-phase.md`
- Source template: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/templates/context.md`
- Exploratory workflow backup: `/home/rookslog/.claude/gsd-local-patches/get-shit-done-reflect/workflows/discuss-phase.md`
- Exploratory command backup: `/home/rookslog/.claude/gsd-local-patches/commands/gsdr/discuss-phase.md`
- Exploratory template backup: `/home/rookslog/.claude/gsd-local-patches/get-shit-done-reflect/templates/context.md`
- Backup metadata: `/home/rookslog/.claude/gsd-local-patches/backup-meta.json`
- GitHub Issue #26: `loganrooks/get-shit-done-reflect#26`
