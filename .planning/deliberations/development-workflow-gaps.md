# Deliberation: Development Workflow Gaps & Living Project Model

**Date:** 2026-02-25
**Trigger:** Discovered that v1.15 agent protocol work was developed in .claude/ (install target) instead of npm source dirs (agents/, get-shit-done/). Installer overwrote the work silently. Led to broader discussion of systemic gaps.

## Issues Discovered

### 1. Source/Install Directory Confusion (CRITICAL — fixed)

v1.15 Phase 22 created agent-protocol.md and modified 9 agent specs exclusively in `.claude/` (the install target). The npm source directories (`agents/`, `get-shit-done/references/`) were never updated. When the installer ran, it overwrote `.claude/` with the outdated source versions.

**Root cause:** No mechanism tells executors that `.claude/` is a copy, not the source of truth. No CLAUDE.md, no project rules, nothing.

**Same bug class as commit a9b1a96** (which fixed it for reflect/spike/signal-collector but not agent protocol).

### 2. Codebase Docs Are Dead (SYSTEMIC)

`.planning/codebase/` was created 2026-02-02 (Phase 0) and never updated through 30 phases:
- CONVENTIONS.md doesn't mention the dual-directory architecture
- STRUCTURE.md doesn't know about agents/ vs .claude/agents/
- The `update_codebase_map` step in execute-plan.md exists but never fires effectively
- Phase-researcher and plan-phase DON'T reference codebase docs
- Planner references them by keyword, but reads 23-day-stale fiction

### 3. Deliberation Storage Gap

`.continue-here.md` is ephemeral (deleted after load, one file, overwritten each session). 251 lines of v1.16 architectural brainstorming was overwritten by quick-7 handoff. The backlog system captures discrete items, not rich context.

**Need:** Persistent, multi-file deliberation storage that survives across sessions and gets absorbed into milestone roadmaps.

### 4. No Project-Specific Development Rules

No CLAUDE.md exists. No mechanism for project-specific rules that are always loaded. GSD's `/gsd:new-project` creates .planning/ artifacts but nothing that tells agents "this project has specific development workflow rules."

## Design Thinking

### On CLAUDE.md vs a native GSD system

Arguments against CLAUDE.md:
- Wasted tokens if loaded every session for rarely-needed rules
- GSD already has reference loading, codebase docs, agent specs
- GSD's new-project + map-codebase is more sophisticated than /init

Arguments for something native to GSD:
- Could be loaded on-demand (only when relevant) vs always-loaded
- Could be structured (separate files for conventions, rules, architecture) vs flat
- Could have a maintenance loop (verified, updated, trusted) vs write-once

**Interim decision:** Use CLAUDE.md for now (it's the only auto-loaded mechanism), replace with a proper system later.

### On prevention mechanisms

Beyond auto-loaded rules, cheap mechanisms that could have prevented the .claude/ bug:
1. **Pre-commit hook or test** asserting source/install dir parity (~10 lines)
2. **Packaging verification test** (npm pack --dry-run, inspect contents)
3. **Accurate codebase docs** that the planner would read (failed due to staleness)
4. **Codebase review phase** at milestone start that flags risks

### On the living project model

A complete project understanding system would include:
- **Current state:** Structure, conventions, concerns (existing but stale)
- **History:** Decisions, evolution, why things are (partially in PROJECT.md decisions table)
- **Future:** Plans, deferred ideas, deliberations (partially in roadmap, gap in deliberation storage)
- **Rules:** Invariants, guardrails, "never do X" (completely missing)
- **Maintenance loop:** Reliable procedures keeping docs honest (broken — update_codebase_map doesn't work)

### On convention extraction and improvement recommendations

When GSD initializes into a codebase, it should:
1. Extract current conventions (existing map-codebase does this)
2. **Recommend improvements** through a review phase (doesn't exist)
3. Formalize recommendations as actionable items (quick fix or milestone)
4. Include a questioning phase for unclear motivations / implicit decisions
5. Track recommendations through the standard signal → remediation → verify lifecycle

### On codebase docs maintenance

The current system fails because:
- update_codebase_map tries to amend commits (fragile)
- Only triggered in execute-plan, not in quick tasks
- No verification that updates actually happened
- No agent reads them except planner (and only by keyword)

A better approach:
- Codebase doc freshness check as part of health-check or phase verification
- Explicit "this doc is stale" signal if touched files don't match doc content
- Periodic refresh (per-milestone) rather than per-plan incremental updates

## Open Questions

1. How should deliberations relate to reflection? (Reflection = backward-looking, deliberation = forward-looking, but they feed each other)
2. Should codebase docs be trusted enough to skip re-reading source files? Or always treated as "hints" that need verification?
3. How to balance token efficiency (load less) with prevention (load more context = fewer mistakes)?
4. Should the living project model be a v1.16 feature alongside signal lifecycle, or a separate milestone?

## Relationship to v1.16 Candidates

This deliberation intersects with v1.16 Candidate A (signal lifecycle):
- The .claude/ bug IS a signal that the system should have detected
- Codebase doc staleness IS a signal pattern
- The prevention question connects to the remediation → verification cycle

And with v1.17 Candidate B (workflow intelligence):
- Deliberation system (B3) directly addresses the storage gap
- Workflow introspection (B1) could detect "executor edited wrong directory" patterns
- Backlog improvements (B4) relate to the item-vs-deliberation distinction
