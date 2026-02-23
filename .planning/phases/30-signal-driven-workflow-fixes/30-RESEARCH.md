# Phase 30: Signal-Driven Workflow Fixes - Research

**Researched:** 2026-02-23
**Domain:** GSD workflow markdown files (.continue-here lifecycle, spike advisory/template)
**Confidence:** HIGH

## Summary

Phase 30 addresses 5 open signals across two clusters: .continue-here.md lifecycle gaps (3 signals) and spike workflow improvements (2 signals). All changes are markdown workflow file edits -- no library code, no runtime dependencies, no programmatic tests.

The .continue-here.md lifecycle has three concrete gaps: (1) the `execute-phase` and `complete-milestone` workflows do not clean up stale .continue-here.md files when a phase completes, (2) the `resume-project` workflow reads .continue-here.md files but never deletes them after loading context, and (3) the `resume-project` workflow only searches `.planning/phases/*/.continue-here*.md` and misses `.planning/.continue-here.md` (project-level handoffs). The `transition.md` workflow already has a `cleanup_handoff` step that serves as the pattern to replicate.

The spike workflow improvements (research-first advisory gate and DESIGN.md feasibility section) have a critical finding: **both appear already implemented**. The `run-spike.md` workflow already contains a "Research-First Advisory" at step 2, and the `spike-design.md` template already has a "Prerequisites / Feasibility" section. These were implemented during Phase 21 (Workflow Refinements, v1.14). The planner should verify these are fully satisfactory before creating new work. If they are already complete, Plan 30-02 reduces to verification-only. If the advisory needs enhancement (e.g., checking for existing RESEARCH.md artifacts rather than just classifying the question), that would be a small incremental change.

**Primary recommendation:** Focus effort on Plan 30-01 (.continue-here lifecycle fixes). Plan 30-02 may be verification-only if existing implementations satisfy the success criteria.

## Standard Stack

This phase involves no libraries, no code, and no external dependencies. All changes are to GSD's own markdown workflow files.

### Core

| Artifact | Location (Source) | Purpose | Lines |
|----------|-------------------|---------|-------|
| Execute-phase workflow | `get-shit-done/workflows/execute-phase.md` | Phase execution orchestration | 397 |
| Complete-milestone workflow | `get-shit-done/workflows/complete-milestone.md` | Milestone archival workflow | 704 |
| Resume-project workflow | `get-shit-done/workflows/resume-project.md` | Session resumption logic | 341 |
| Transition workflow | `get-shit-done/workflows/transition.md` | Phase-to-phase transition (has existing cleanup pattern) | 494 |
| Pause-work workflow | `get-shit-done/workflows/pause-work.md` | Creates .continue-here.md files | 126 |
| Continue-here template | `get-shit-done/templates/continue-here.md` | Template for handoff files | 82 |
| Run-spike workflow | `get-shit-done/workflows/run-spike.md` | Spike orchestration (already has advisory) | 239 |
| Spike design template | `.claude/agents/kb-templates/spike-design.md` | DESIGN.md template (already has feasibility) | 115 |
| Spike command | `.claude/commands/gsd/spike.md` | Entry point for /gsd:spike | 65 |

### Installation / Deployment

Source files (repo root) are the canonical edit targets. The installer copies them to runtime-specific installed locations with path prefix replacement (`~/.claude/` to `./.claude/` for Claude Code). Diffs between source and installed copies show only expected path prefix transformations -- content is in sync.

**Important:** `spike.md` and `reflect.md` command files exist only at `.claude/commands/gsd/` (installed path), NOT at `commands/gsd/` (source path). Phase 28 restored these to the installed location only. For the spike command, edits must target `.claude/commands/gsd/spike.md` directly. For workflow files (run-spike.md, execute-phase.md, etc.), edit the source copies at `get-shit-done/workflows/`.

## Architecture Patterns

### Pattern 1: Cleanup Step in Phase Completion (existing pattern from transition.md)

**What:** After verifying a phase is complete, check for and delete any lingering .continue-here.md files in the phase directory.

**Where it already exists:** `get-shit-done/workflows/transition.md`, step `cleanup_handoff` (lines 109-119):

```markdown
<step name="cleanup_handoff">

Check for lingering handoffs:

\`\`\`bash
ls .planning/phases/XX-current/.continue-here*.md 2>/dev/null
\`\`\`

If found, delete them -- phase is complete, handoffs are stale.

</step>
```

**Where it needs to be added:**
1. `execute-phase.md` -- after the `aggregate_results` step and before `verify_phase_goal`
2. `complete-milestone.md` -- during the verify_readiness step, iterate over all milestone phase directories

**Key insight:** The transition workflow is the natural phase-completion boundary and already has this pattern. The execute-phase and complete-milestone workflows are alternative completion paths that miss this cleanup.

### Pattern 2: Delete-After-Load for Resume (new pattern)

**What:** After the resume-project workflow successfully reads a .continue-here.md file and extracts its context, delete the file. The template explicitly states: "This file gets DELETED after resume -- it's not permanent storage."

**Where to add:** `resume-project.md`, in the `check_incomplete_work` step, after the .continue-here file is read and its context extracted.

**Implementation:**

```markdown
**After reading .continue-here context, delete the file:**

\`\`\`bash
rm .planning/phases/XX-name/.continue-here.md 2>/dev/null
\`\`\`

The context has been loaded into this session. The file is now stale.
If the session ends unexpectedly, the user can re-create a handoff
with /gsd:pause-work.
```

**Timing consideration:** Delete AFTER context is loaded and BEFORE presenting status. If the session crashes between reading and deleting, the file persists (safe -- will be cleaned up on next resume or by health-check STALE-01).

### Pattern 3: Expanded Search Paths for Resume (enhancement)

**What:** The resume-project workflow currently searches only `phases/*/.continue-here*.md`. It should also search `.planning/.continue-here.md` for project-level handoffs not associated with any specific phase.

**Current search (line 82 of resume-project.md):**

```bash
ls .planning/phases/*/.continue-here*.md 2>/dev/null
```

**Enhanced search:**

```bash
# Check for phase-level handoffs
ls .planning/phases/*/.continue-here*.md 2>/dev/null

# Check for project-level handoffs
ls .planning/.continue-here.md 2>/dev/null
```

**Note:** The pause-work workflow currently only creates .continue-here.md inside phase directories. A project-level `.planning/.continue-here.md` is not currently created by any workflow, but searching for it makes the resume workflow robust against future changes or manual file placement.

### Anti-Patterns to Avoid

- **Deleting .continue-here before loading context:** The deletion must happen AFTER the file is read and context extracted. Deleting first would lose the handoff data.
- **Hard failure on missing .continue-here during deletion:** Use `2>/dev/null` or `rm -f` to handle the case where the file does not exist (defensive deletion).
- **Editing only installed files:** All workflow edits go to source files. The installer redeploys to installed locations. Exception: spike.md has no source copy (edit `.claude/commands/gsd/spike.md` directly).
- **Duplicating the cleanup logic in both execute-phase and complete-milestone:** For complete-milestone, the cleanup should iterate over all phase directories in the milestone, not just one. For execute-phase, cleanup targets the specific completed phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File cleanup | Custom cleanup script or gsd-tools command | Inline bash `rm -f` in workflow | One-time deletion, not a recurring pattern worth tooling |
| Search expansion | Complex glob/find logic | Simple `ls` commands with 2>/dev/null | Only two paths to check, simplicity over cleverness |
| Research-first gate | New advisory logic | Verify existing run-spike.md step 2 | Already implemented in Phase 21 |

**Key insight:** All fixes are small, targeted markdown edits to existing workflow files. No new files, no new commands, no new tooling needed.

## Common Pitfalls

### Pitfall 1: Source vs Installed File Confusion

**What goes wrong:** Editing the installed file (`~/.claude/` or `./.claude/`) instead of the source file, causing changes to be overwritten on next install.
**Why it happens:** The files exist in both locations and the installed versions are what Claude Code actually loads.
**How to avoid:** Edit source files in `get-shit-done/workflows/`. Run the installer after edits to sync. Exception: `spike.md` command has no source copy -- edit `.claude/commands/gsd/spike.md` directly.
**Warning signs:** Changes disappearing after running update/install.

### Pitfall 2: Assuming Spike Signals Need New Work

**What goes wrong:** Creating plans to implement the research-first advisory and feasibility template section when they already exist.
**Why it happens:** The ROADMAP signals predate Phase 21 execution. The signals were recorded on 2026-02-11 but the fixes were implemented during Phase 21 (v1.14, shipped 2026-02-16).
**How to avoid:** Read the current `run-spike.md` step 2 and `spike-design.md` Prerequisites/Feasibility section. Verify they satisfy the success criteria SC4 and SC5 before planning new work.
**Warning signs:** Creating tasks that duplicate existing content.

### Pitfall 3: Race Between Resume Read and Delete

**What goes wrong:** Deleting .continue-here.md before fully extracting its context, losing handoff data.
**Why it happens:** Optimizing for cleanup speed over safety.
**How to avoid:** The resume workflow should complete its full context extraction from the file, present the status to the user, and THEN delete the file. The file deletion should be its own step, clearly sequenced after the read.
**Warning signs:** Resume workflow showing empty/missing handoff data after modification.

### Pitfall 4: Incomplete Milestone Cleanup Iteration

**What goes wrong:** The complete-milestone workflow only cleans .continue-here from one phase directory instead of all phases in the milestone.
**Why it happens:** Copy-pasting the execute-phase cleanup (single phase) without adapting for milestone scope (multiple phases).
**How to avoid:** complete-milestone cleanup should iterate over all phase directories that belong to the milestone being completed, not just one.
**Warning signs:** Stale .continue-here files persisting in earlier phases of a completed milestone.

### Pitfall 5: Missing Spike Command Source File

**What goes wrong:** Trying to edit `commands/gsd/spike.md` (source) which doesn't exist.
**Why it happens:** Phase 28 restored spike.md to `.claude/commands/gsd/` (installed) but not `commands/gsd/` (source). The source directory has 33 commands; the installed directory has 35 (spike.md and reflect.md are installed-only).
**How to avoid:** For spike.md, edit the installed copy directly. If creating a source copy is desired, that's a separate concern (not in Phase 30 scope, but worth noting).
**Warning signs:** File-not-found errors when trying to edit `commands/gsd/spike.md`.

## Code Examples

### Example 1: Cleanup Step for execute-phase.md

Add after `aggregate_results` step, before `verify_phase_goal`:

```markdown
<step name="cleanup_handoffs">
Clean up any .continue-here files from the completed phase:

\`\`\`bash
rm -f "${PHASE_DIR}/.continue-here"*.md
\`\`\`

Phase execution is complete -- any handoff files are now stale.
</step>
```

### Example 2: Cleanup in complete-milestone.md

Add during the verify_readiness step or as a separate step before archival:

```markdown
<step name="cleanup_milestone_handoffs">
Clean up .continue-here files across all phases in this milestone:

\`\`\`bash
for phase_dir in .planning/phases/*/; do
  rm -f "${phase_dir}/.continue-here"*.md
done
\`\`\`

Milestone is complete -- all phase handoffs are stale.
</step>
```

### Example 3: Delete-after-load in resume-project.md

Add after the .continue-here file is read and context extracted (in `check_incomplete_work` step):

```markdown
**After successfully loading handoff context, delete the file:**

\`\`\`bash
# Delete phase-level handoff after loading
rm -f ".planning/phases/XX-name/.continue-here.md"

# Delete project-level handoff if it was the one loaded
rm -f ".planning/.continue-here.md"
\`\`\`

Context is now in this session. File is no longer needed.
The template contract states: "This file gets DELETED after resume."
```

### Example 4: Expanded search in resume-project.md

Replace the current search in `check_incomplete_work`:

```bash
# Check for phase-level handoffs (existing)
ls .planning/phases/*/.continue-here*.md 2>/dev/null

# Check for project-level handoffs (new)
ls .planning/.continue-here.md 2>/dev/null
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| .continue-here persists after phase completion | Cleanup on completion (transition.md only) | Partial -- execute-phase and complete-milestone still miss cleanup |
| .continue-here persists after resume | Not deleted after resume | Stale files accumulate, confuse subsequent resumes |
| Resume searches phases/ only | Only phases/*/ checked | Misses project-level handoffs |
| No spike advisory gate (pre-Phase 21) | Research-first advisory exists in run-spike.md | Already resolved by Phase 21 |
| No DESIGN.md feasibility section (pre-Phase 21) | Prerequisites/Feasibility exists in spike-design.md | Already resolved by Phase 21 |

## Critical Finding: Spike Signals Already Resolved

**Both spike-related signals appear to have been resolved during Phase 21 (v1.14):**

1. **sig-2026-02-11-premature-spiking-no-research-gate**: The `run-spike.md` workflow already contains a full "Research-First Advisory" at step 2 (lines 43-85). It classifies questions as research-suitable vs spike-suitable, presents an advisory to the user in interactive mode, and auto-proceeds in yolo mode.

2. **sig-2026-02-11-spike-design-missing-feasibility**: The `spike-design.md` template already contains a "Prerequisites / Feasibility" section (lines 42-55) with environment requirements, feasibility checklist, and prerequisites-not-met guidance.

**Recommendation for planner:** Plan 30-02 should first verify these implementations satisfy SC4 and SC5. If they do, Plan 30-02 becomes a verification pass (confirm signals closed, no new edits needed). If the advisory needs enhancement (e.g., checking for existing RESEARCH.md artifacts before advising), that would be a small incremental change.

**Potential enhancement (if needed):** The current advisory classifies the question type but does not check whether prior research exists. SC4 says "checks whether research was already done before proceeding." An enhanced gate could:

```bash
# Check for existing research in linked phase
if [ -n "$PHASE" ] && ls ".planning/phases/${PHASE}-"*/*-RESEARCH.md 2>/dev/null; then
  echo "Research already exists for this phase. Review before spiking."
fi
```

This is optional -- the current implementation may already satisfy the success criteria as written.

## Open Questions

1. **Is the existing spike advisory sufficient for SC4?**
   - What we know: run-spike.md step 2 classifies questions as research-suitable vs spike-suitable and presents an advisory
   - What's unclear: Whether SC4 requires checking for existing research artifacts (RESEARCH.md files) or just classifying the question type
   - Recommendation: Planner should verify the existing implementation against SC4 wording. If the question classification is sufficient, mark as done. If artifact checking is needed, add it as a small enhancement.

2. **Should .planning/.continue-here.md creation also be added to pause-work?**
   - What we know: pause-work only creates .continue-here.md in phase directories. The resume search expansion adds `.planning/.continue-here.md` but nothing creates files there.
   - What's unclear: Whether project-level handoffs (not tied to a phase) are a real use case
   - Recommendation: Only expand the search path (defensive). Do not modify pause-work to create project-level handoffs unless explicitly requested. The search expansion makes resume robust against future changes.

3. **Should the missing spike.md source file be addressed?**
   - What we know: `spike.md` and `reflect.md` exist only in `.claude/commands/gsd/` not `commands/gsd/`. Phase 28 restored to installed path only.
   - What's unclear: Whether this is intentional or an oversight from Phase 28
   - Recommendation: Note as a minor gap but do NOT include in Phase 30 scope. It can be addressed in a future gap closure pass. Phase 30 edits to the spike workflow go to the source `get-shit-done/workflows/run-spike.md` which DOES have a source copy.

## Files Modified by This Phase

### Plan 30-01 (continue-here lifecycle)

| File (Source Path) | Change | Lines Affected |
|-------------------|--------|----------------|
| `get-shit-done/workflows/execute-phase.md` | Add `cleanup_handoffs` step after `aggregate_results` | ~5-8 lines added |
| `get-shit-done/workflows/complete-milestone.md` | Add `cleanup_milestone_handoffs` step | ~8-10 lines added |
| `get-shit-done/workflows/resume-project.md` | Add delete-after-load + expand search to include `.planning/.continue-here.md` | ~10-15 lines added/modified |

### Plan 30-02 (spike verification/enhancement)

| File (Source Path) | Change | Lines Affected |
|-------------------|--------|----------------|
| `get-shit-done/workflows/run-spike.md` | Verify existing advisory; optionally add research artifact check | 0-5 lines (if enhancement needed) |
| `.claude/agents/kb-templates/spike-design.md` | Verify existing feasibility section | 0 lines (already present) |

### Post-Edit Deployment

After source edits, the installer must be run to sync installed copies. Or, for immediate effect during this phase's own execution, the installed copies can be edited in parallel (they are identical except for path prefixes).

## Sources

### Primary (HIGH confidence)

- Direct reading of all affected source files (execute-phase.md, complete-milestone.md, resume-project.md, transition.md, pause-work.md, run-spike.md, spike-design.md, spike.md, continue-here template, continuation-format reference)
- Phase 21 research (`21-RESEARCH.md`) -- confirms spike advisory and feasibility section were designed and planned for implementation
- Diff comparison of source vs installed files -- confirms content is in sync (only path prefix differences)
- `ls commands/gsd/` and `ls .claude/commands/gsd/` -- confirms spike.md missing from source directory
- health-check reference -- confirms STALE-01 check for orphaned .continue-here files already exists as safety net

### Secondary (MEDIUM confidence)

- Signal descriptions from ROADMAP.md -- signals themselves are not stored as files (likely archived or only referenced by ID)

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Plan 30-01 (continue-here lifecycle): HIGH -- direct file analysis, all affected workflows read, existing cleanup pattern identified in transition.md
- Plan 30-02 (spike signals): HIGH -- direct verification that both implementations already exist in current source files
- Deployment: HIGH -- installer path transformation confirmed via diff analysis

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable -- internal workflow files with no external dependencies)
