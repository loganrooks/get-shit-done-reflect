# discuss-phase Global Install Gap Investigation

**Date:** 2026-04-02
**Investigated by:** Agent (claude-opus-4-6)
**Status:** Resolved (global install updated) + follow-up items identified

## Summary

The global install at `~/.claude/get-shit-done-reflect/workflows/discuss-phase.md` was running a 444-line "steering brief" version while the source (`get-shit-done/workflows/discuss-phase.md`) had evolved to a 1098-line version with significantly more capabilities. Running `node bin/install.js --global` fixed the version mismatch. Two follow-up issues were discovered.

## Version Map Before Fix

| Location | Lines | Version | Content |
|----------|-------|---------|---------|
| Source (`get-shit-done/workflows/discuss-phase.md`) | 1098 | v1.18 upstream-adopted | Full: gray areas, adaptive questioning, KB surfacing, advisor-researcher, codebase scouting, todo cross-ref, discussion log |
| Global (`~/.claude/get-shit-done-reflect/workflows/discuss-phase.md`) | 444 | Steering brief model | Reduced: synthesis-first, hybrid/auto modes, no gray area identification, no advisor-researcher, no codebase scout, no KB surfacing, no todo cross-ref |
| Project-local (`.claude/get-shit-done-reflect/workflows/discuss-phase.md`) | 1098 | Matches source | Full (with `./.claude/` path prefix) |
| Codex (`~/.codex/get-shit-done-reflect/workflows/discuss-phase.md`) | 1098 | Matches source | Full |
| Local patches (`~/.claude/gsd-local-patches/get-shit-done/workflows/discuss-phase.md`) | 444 | Pre-v1.18 patch | Old steering brief (pre-namespace-migration `get-shit-done/` paths) |

## What Was Different (Old 444-Line vs New 1098-Line)

### Features Missing from Global Install (Present in Source)

1. **Gray area identification** (`<gray_area_identification>` section) -- Domain-aware analysis of what implementation decisions the user should weigh in on, with specific examples by phase type

2. **Answer validation** (`<answer_validation>` section) -- Empty response handling, text mode for remote sessions (`--text` flag)

3. **Prior context loading** (`load_prior_context` step) -- Reading PROJECT.md, REQUIREMENTS.md, STATE.md, and all prior CONTEXT.md files to avoid re-asking settled questions

4. **Todo cross-referencing** (`cross_reference_todos` step) -- Surfaces relevant pending todos from the backlog for potential folding into phase scope

5. **Codebase scouting** (`scout_codebase` step) -- Lightweight scan of existing code for reusable assets, patterns, and integration points

6. **KB knowledge surfacing** (`surface_kb_knowledge` step) -- Scanning knowledge base index for lessons, spikes, and signals relevant to the phase

7. **Advisor mode with researcher agents** (`advisor_research` step) -- USER-PROFILE.md-driven advisor mode that spawns parallel Task() agents per gray area with calibration tiers (full_maturity / standard / minimal_decisive)

8. **Rich discussion flow** (`discuss_areas` step) -- Full conversation loop with batch mode (`--batch`), analyze mode (`--analyze`), research-before-questions mode, canonical ref accumulation during discussion, Context7 integration for library choices

9. **DISCUSSION-LOG.md generation** -- Audit trail of Q&A for compliance/review

10. **Auto-advance chain** (`auto_advance` step) -- Chains discuss -> plan -> execute with `--auto` flag

11. **Canonical refs accumulator** -- MANDATORY section in CONTEXT.md linking all specs/ADRs/docs for downstream agents

12. **Code context in CONTEXT.md** -- Reusable assets, established patterns, integration points

### What the Old 444-Line Version Had

The "steering brief" model was a philosophically different approach:
- **Synthesis-first** -- Claude derives constraints before asking anything
- **Minimal questioning** -- 1-3 high-leverage prompts max in hybrid mode
- **Auto mode that does not ask** -- Defaults unresolved areas to Open Questions
- **Richer CONTEXT.md structure** -- Working Model & Assumptions, Derived Constraints, Open Questions, Epistemic Guardrails sections
- **No interactive gray area selection** -- No AskUserQuestion multi-select flow
- **No subagent spawning** -- No advisor-researcher agents
- **No codebase/KB integration** -- Pure reasoning from roadmap/requirements

## Local Patches Analysis

### Pre-v1.18 Patches (`~/.claude/gsd-local-patches/get-shit-done/workflows/discuss-phase.md`)

This 444-line file uses `get-shit-done/` namespace paths (pre-Phase-44 migration) and contains the steering brief model. It was backed up from v1.13.0 and represents the fork's exploratory "steering brief" discuss-phase that was developed as a local patch to the global install.

### Post-Install Patches (`~/.claude/gsd-local-patches/get-shit-done-reflect/workflows/discuss-phase.md`)

After the global install was updated, the installer backed up the old 444-line version as a new patch under the `get-shit-done-reflect/` namespace. This is the same content as above, just with `gsdr` namespace paths applied.

### Were Exploratory Features Lost?

**Yes, partially.** The steering brief model introduced concepts that the v1.18 source does not have:

1. **Working Model & Assumptions section** in CONTEXT.md -- hypotheses research must verify
2. **Derived Constraints section** -- binding context from requirements, prior decisions, signals, code realities
3. **Open Questions section** -- default home for unresolved gray areas (with type classification: material/formal/efficient/final)
4. **Epistemic Guardrails section** -- what downstream stages must verify, not assume
5. **Four-cause classification** of unresolved areas (material/formal/efficient/final)
6. **Status states** -- "Ready for research with intent risk" and "Needs clarification"
7. **Synthesis priority rules** -- explicit precedence order for where to place unresolved items

The v1.18 source has some of these concepts in its `write_context` step template (it includes `<domain>`, `<decisions>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<deferred>` sections) but **does NOT include**: `<assumptions>`, `<constraints>`, `<questions>`, `<guardrails>`.

**The context.md template** was also patched (358 lines vs 314 in source) to include these steering brief sections. The source template was NOT updated to match during v1.18.

## Command Layer Analysis

The source command (`commands/gsd/discuss-phase.md`, 86 lines) and installed command (`~/.claude/commands/gsdr/discuss-phase.md`, 78 lines) were also different:

| Aspect | Source Command (86 lines) | Installed Command (78 lines) |
|--------|--------------------------|------------------------------|
| Description | "Gather phase context through adaptive questioning" | "Create phase steering context before planning (v1.17.5+dev)" |
| Argument hint | `<phase>` | `<phase> [--auto]` |
| Objective | Decision extraction via gray areas | Steering brief creation |
| Process | 7-step gray area flow | 7-step synthesis-first flow |
| Success criteria | Gray areas + user discussion | Context scouting + high-leverage questions |

**Phase 52 claim verified:** "Fork's steering brief model lives in command layer" -- the installed command DID reference the steering brief approach, but so did the workflow it pointed to. Both were the old version.

After the global install, the command now matches source (86 lines, gray area approach, v1.18.0+dev version tag).

## What the Installer Fixed

Running `node bin/install.js --global` from the repo:

1. **Backed up** the old 444-line workflow, old 78-line command, and old 358-line context template as local patches
2. **Installed** the current 1098-line workflow, 86-line command, and 314-line context template
3. **Updated** the file manifest to v1.18.0
4. **Removed** orphaned files (hooks/gsd-context-monitor.js, get-shit-done-reflect/bin/gsd-tools.js)
5. **Generated** migration guide (1.17.5 -> 1.18.0)

## Follow-Up Issues

### Issue 1: `$HOME/$HOME` Path Rewriting Bug (HIGH)

The global install has a path doubling bug. Every workflow file in `~/.claude/get-shit-done-reflect/workflows/` has `$HOME/$HOME/.claude/` instead of `$HOME/.claude/`. This affects ALL 36 workflow files, not just discuss-phase.

**Example:**
- Source: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}"`
- Global install: `node "$HOME/$HOME/.claude/get-shit-done-reflect/bin/gsd-tools.cjs" init phase-op "${PHASE}"`

This would cause `gsd-tools.cjs` to not be found at runtime in the global install. The local install does NOT have this bug (it uses `$HOME/./.claude/` which resolves correctly).

**Root cause:** The installer's `replacePathsInContent()` is doing two passes -- one for namespace (`get-shit-done` -> `get-shit-done-reflect`) and one for path prefix -- and the `$HOME/` prefix is being applied twice for global installs.

**Impact:** For projects using this repo, the local install takes precedence (per dual-installation rules), so these broken global paths are currently masked. For OTHER projects using the global install, this would break all gsd-tools.cjs invocations.

**Action needed:** Fix `replacePathsInContent()` in `bin/install.js`. This is a source file change and needs a separate phase/PR.

### Issue 2: Steering Brief Sections Not in Source Template (LOW)

The context.md template (`get-shit-done/templates/context.md`) does not include the steering brief sections that were developed as local patches:
- Working Model & Assumptions
- Derived Constraints
- Open Questions
- Epistemic Guardrails

The workflow's `write_context` step defines its own template inline, so this is not a functional gap -- the workflow produces the correct output regardless. But the template file (used as a reference) is out of sync with what the workflow actually generates.

**Action needed:** Decide whether to port the steering brief template sections into the source template, or leave the workflow's inline template as the canonical definition. Needs deliberation since it touches the fundamental philosophy of what CONTEXT.md should be.

## Conclusion

The immediate gap is fixed: the global install now matches the source. The steering brief features from local patches represent a philosophical fork that was partially superseded by v1.18's upstream adoption but introduced concepts (open questions, assumptions, guardrails, four-cause classification) that have no equivalent in the current source. These should be evaluated in a separate deliberation for potential integration.

The `$HOME/$HOME` path rewriting bug is a separate, higher-priority issue affecting all global workflow installs and should be filed as its own fix.
