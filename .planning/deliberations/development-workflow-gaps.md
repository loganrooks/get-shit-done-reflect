# Deliberation: Development Workflow Gaps & Living Project Model

**Date:** 2026-02-25
**Last updated:** 2026-02-27
**Trigger:** Discovered that v1.15 agent protocol work was developed in .claude/ (install target) instead of npm source dirs (agents/, get-shit-done/). Installer overwrote the work silently. Led to broader discussion of systemic gaps.
**Related:** `v1.16-signal-lifecycle-and-beyond.md` — the primary v1.16 scoping document. This deliberation feeds into v1.16 design (epistemic rigor, sensor design) and v1.17+ design (deliberation system, codebase docs, living project model).

## Issues Discovered

### 1. Source/Install Directory Confusion (CRITICAL — REMEDIATED)

v1.15 Phase 22 created agent-protocol.md and modified 9 agent specs exclusively in `.claude/` (the install target). The npm source directories (`agents/`, `get-shit-done/references/`) were never updated. When the installer ran, it overwrote `.claude/` with the outdated source versions.

**Root cause (at the time):** No mechanism told executors that `.claude/` is a copy, not the source of truth. No CLAUDE.md, no project rules existed.

**Same bug class as commit a9b1a96** (which fixed it for reflect/spike/signal-collector but not agent protocol).

**Remediation status (verified 2026-02-27):**
- CLAUDE.md now exists with explicit "always edit npm source, never .claude/" rule — addresses root cause
- Quick-8 recovered lost code (reflect.md, spike.md, knowledge-store.md, dual-install in resume-project.md) to npm source
- Verified: `commands/gsd/reflect.md` and `commands/gsd/spike.md` content-match installed versions (only diff is expected version injection)
- Verified: `npm pack --dry-run` confirms both files included in package (35/35 commands present)
- Verified: Phase 30 deployment gap (4 workflow files) closed — diffs show only expected `~/` → `./` path prefix conversion, zero substantive content differences
- **Residual risk:** No automated test prevents recurrence. Prevention mechanism #1 (pre-commit hook asserting source/install parity) and #2 (packaging verification test) still not implemented.

### 2. Codebase Docs Are Dead (SYSTEMIC — UNADDRESSED)

`.planning/codebase/` was created 2026-02-02 (Phase 0) and never updated through 30 phases:
- CONVENTIONS.md doesn't mention the dual-directory architecture
- STRUCTURE.md doesn't know about agents/ vs .claude/agents/
- The `update_codebase_map` step in execute-plan.md exists but never fires effectively
- Phase-researcher and plan-phase DON'T reference codebase docs
- Planner references them by keyword, but reads 23-day-stale fiction

**2026-02-27 note:** This is an instance of the broader epistemic problem — documents record beliefs at time T, the codebase changes, nobody re-verifies. See v1.16 deliberation "Epistemic Rigor" design principle for structural approach.

### 3. Deliberation Storage Gap (PARTIALLY ADDRESSED)

`.continue-here.md` was ephemeral (deleted after load, one file, overwritten each session). v1.16 architectural brainstorming was overwritten by quick-7 handoff. The backlog system captures discrete items, not rich context.

**Need:** Persistent, multi-file deliberation storage that survives across sessions and gets absorbed into milestone roadmaps.

**Remediation status (verified 2026-02-27):**
- `.planning/deliberations/` directory now exists with 2 persistent deliberation documents
- Documents have survived across multiple sessions (created 2026-02-25, updated 2026-02-27)
- **Remaining gap:** No formal integration with `/gsd:new-milestone` — deliberations are read manually, not automatically surfaced during milestone scoping. No schema, no index, no freshness tracking.

### 4. No Project-Specific Development Rules (REMEDIATED)

At the time of discovery, no CLAUDE.md existed. No mechanism for project-specific rules that were always loaded. GSD's `/gsd:new-project` creates .planning/ artifacts but nothing that told agents "this project has specific development workflow rules."

**Remediation status (verified 2026-02-27):**
- CLAUDE.md now exists with dual-directory architecture rules, build/test commands, project structure, and fork conventions
- Auto-loaded every session (verified: it appears in system context)
- **Remaining concern:** CLAUDE.md is a flat file with no maintenance loop. Its claims are not verifiable or timestamped. As the project evolves, CLAUDE.md will drift from reality with no detection mechanism — the same staleness problem as codebase docs, just slower because CLAUDE.md changes less frequently.

### 5. Epistemic Rigor Gap (NEW — 2026-02-27)

**Trigger:** During tech debt re-verification, discovered that previous claims about tech debt status were based on shallow evidence. The v1.15 audit itself contained imprecise characterizations (claimed "inline protocol" for agents with no protocol at all). Claims were repeated without verification across sessions.

**Root cause:** The system's belief-producing processes (verification, diagnosis, auditing) use confirmation-oriented methodology — find one supporting datum and stop. No null hypothesis discipline, no falsification attempts, no confidence tracking.

**Specific failures observed:**
1. Claimed "reflect.md fixed" based on file presence alone (didn't check content or npm pack inclusion)
2. Claimed "Phase 30 deployment gap likely fixed" — "likely" masked zero evidence gathered
3. Repeated audit's "3 agents have inline protocol" — audit was wrong (gsd-reflector has NO protocol, not inline protocol)
4. No positive signals tracked (installer path conversion works, all 35 commands in npm pack) — baselines absent

**This is not a documentation problem — it's a methodology problem.** Better docs help, but the underlying issue is that the processes for producing, recording, and re-verifying beliefs lack structural safeguards against confirmation bias.

**Detailed structural remediation proposals captured in:** `v1.16-signal-lifecycle-and-beyond.md` → "DESIGN PRINCIPLE: Epistemic Rigor"

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

**2026-02-27 update:** CLAUDE.md is in place and working. The concern about token waste hasn't materialized — the file is concise. The concern about staleness is real but slower-moving than codebase docs. The "replace with proper system later" decision stands but is lower priority now that the interim solution works.

### On prevention mechanisms

Beyond auto-loaded rules, cheap mechanisms that could have prevented the .claude/ bug:
1. **Pre-commit hook or test** asserting source/install dir parity (~10 lines) — NOT IMPLEMENTED
2. **Packaging verification test** (npm pack --dry-run, inspect contents) — NOT AUTOMATED (manually verified 2026-02-27: 35/35 commands present in npm pack output)
3. **Accurate codebase docs** that the planner would read — STILL BROKEN (docs stale since 2026-02-02)
4. **Codebase review phase** at milestone start that flags risks — NOT IMPLEMENTED

### On the living project model

A complete project understanding system would include:
- **Current state:** Structure, conventions, concerns (existing but stale)
- **History:** Decisions, evolution, why things are (partially in PROJECT.md decisions table)
- **Future:** Plans, deferred ideas, deliberations (partially in roadmap; deliberations directory now exists but not integrated)
- **Rules:** Invariants, guardrails, "never do X" (partially addressed — CLAUDE.md has key rules, but no structured system)
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
   - **2026-02-27 lean:** Treat as hints. The epistemic rigor principle suggests documents should never be trusted without re-verification proportional to the cost of being wrong.
3. How to balance token efficiency (load less) with prevention (load more context = fewer mistakes)?
   - **2026-02-27 lean:** Proportional falsification — cheap checks always run, expensive checks scale with consequence of error.
4. Should the living project model be a v1.16 feature alongside signal lifecycle, or a separate milestone?
   - **2026-02-27 lean:** The epistemic rigor design principle in v1.16 partially addresses this (document claim verifiability, health-check belief verification). Full living project model remains v1.17+.
5. (NEW) How should prevention mechanisms (pre-commit hooks, packaging tests) relate to the signal lifecycle? Are they a form of "automated sensor" or a separate concern?
6. (NEW) The v1.15 audit itself contained inaccurate beliefs. Should audits be re-verifiable? Should audit claims be structured like signal claims (with confidence, counter-evidence)?

## Relationship to v1.16 Candidates

This deliberation intersects with v1.16 Candidate A (signal lifecycle):
- The .claude/ bug IS a signal that the system should have detected
- Codebase doc staleness IS a signal pattern
- The prevention question connects to the remediation → verification cycle
- **(NEW)** The epistemic rigor gap connects directly to sensor design — sensors that confirm rather than falsify produce unreliable signals
- **(NEW)** Positive signal tracking (baselines) connects to codebase doc freshness — a "docs match reality" positive signal enables drift detection

And with v1.17+ Candidate B (workflow intelligence):
- Deliberation system (B3) directly addresses the storage gap
- Workflow introspection (B1) could detect "executor edited wrong directory" patterns
- Backlog improvements (B4) relate to the item-vs-deliberation distinction

## Remediation Tracking

| Issue | Status | Verified | Residual Risk |
|-------|--------|----------|---------------|
| 1. Source/install confusion | Remediated | 2026-02-27 | No automated prevention test |
| 2. Codebase docs dead | Unaddressed | 2026-02-27 | Stale docs read as truth |
| 3. Deliberation storage | Partially addressed | 2026-02-27 | No milestone integration |
| 4. No project rules | Remediated | 2026-02-27 | CLAUDE.md staleness unmonitored |
| 5. Epistemic rigor gap | Identified, designed | 2026-02-27 | No structural changes yet — design in v1.16 deliberation |
