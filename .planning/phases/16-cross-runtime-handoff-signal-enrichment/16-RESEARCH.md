# Phase 16: Cross-Runtime Handoff & Signal Enrichment - Research

**Researched:** 2026-02-11
**Domain:** Cross-runtime state portability, signal metadata enrichment
**Confidence:** HIGH

## Summary

Phase 16 has two distinct workstreams: (1) making the pause/resume workflow runtime-agnostic so users can pause in one runtime (e.g., Claude Code) and seamlessly resume in another (e.g., Codex CLI), and (2) enriching signal entries with runtime provenance metadata (`runtime:` and `model:` fields) for cross-runtime debugging.

The handoff workstream is primarily a file format and workflow refactoring problem. The existing `.continue-here.md` files currently embed runtime-specific command references like `/gsd:resume-work` (Claude Code syntax). The fix involves: (a) making `.continue-here.md` store only semantic state -- no command syntax at all, and (b) making the resume-project.md workflow detect which runtime it is executing in and render runtime-appropriate command instructions at display time. The signal enrichment workstream adds two new optional fields to the signal YAML schema, updates the signal template, and adds a new signal type for capability gap events.

Both workstreams build on infrastructure already completed in Phases 13-15: the two-pass path replacement system (Phase 13), the shared KB at `~/.gsd/knowledge/` (Phase 14), and Codex CLI as a functioning 4th runtime (Phase 15). The capability matrix (`get-shit-done/references/capability-matrix.md`) already declares per-runtime features and establishes the `has_capability()` pattern. This phase extends that foundation to state files and signals.

**Primary recommendation:** Split into two plans -- Plan 16-01 for handoff (HAND-01 through HAND-04) and Plan 16-02 for signal enrichment (SIG-01 through SIG-04). The handoff plan is the larger effort; signal enrichment is relatively mechanical.

## Standard Stack

This phase does not introduce new libraries. It modifies existing Markdown workflow files, YAML frontmatter schemas, and the pause/resume workflow logic.

### Core (existing project infrastructure used)
| Component | Location | Purpose | Relevance to Phase 16 |
|-----------|----------|---------|----------------------|
| `pause-work.md` workflow | `get-shit-done/workflows/pause-work.md` | Creates `.continue-here.md` | HAND-01, HAND-02: must produce runtime-agnostic output |
| `resume-project.md` workflow | `get-shit-done/workflows/resume-project.md` | Reads `.continue-here.md` and STATE.md | HAND-01, HAND-03: must detect runtime and render commands |
| `continue-here.md` template | `get-shit-done/templates/continue-here.md` | Template for handoff files | HAND-02: must be updated to semantic-only format |
| `continuation-format.md` ref | `get-shit-done/references/continuation-format.md` | Standard for presenting next steps | HAND-03: all examples use `/gsd:` syntax, needs runtime adaptation |
| Signal template | `.claude/agents/kb-templates/signal.md` | Template for signal entries | SIG-01, SIG-02, SIG-03: must add runtime/model fields |
| `signal-detection.md` ref | `get-shit-done/references/signal-detection.md` | Detection rules and schema extensions | SIG-04: must add capability_gap signal type |
| `capability-matrix.md` ref | `get-shit-done/references/capability-matrix.md` | Per-runtime capability declarations | HAND-03: used for runtime detection |
| `gsd-signal-collector.md` agent | `.claude/agents/gsd-signal-collector.md` | Automatic signal collection | SIG-01, SIG-02: must populate runtime/model fields |
| `signal.md` workflow | `get-shit-done/workflows/signal.md` | Manual signal creation | SIG-01, SIG-02: must populate runtime/model fields |
| `knowledge-store.md` agent | `.claude/agents/knowledge-store.md` | KB schema reference | SIG-01, SIG-02: schema extension documentation |
| `install.js` | `bin/install.js` | Installer with path replacement | Provides the runtime path prefix that enables runtime detection |
| STATE.md template | `get-shit-done/templates/state.md` | State tracking template | HAND-04: verify no runtime-specific content |

### Supporting
| Tool | Location | Purpose | When Used |
|------|----------|---------|-----------|
| `gsd-tools.js` | `get-shit-done/bin/gsd-tools.js` | CLI utilities | `current-timestamp`, `commit`, `init` commands |
| `kb-rebuild-index.sh` | `.claude/agents/kb-rebuild-index.sh` | Rebuilds KB index | After signal template changes |

## Architecture Patterns

### Pattern 1: Semantic State in `.continue-here.md` (HAND-02)

**What:** The `.continue-here.md` file stores ONLY semantic state -- phase, task, decisions, context. It NEVER stores runtime-specific command syntax (no `/gsd:`, no `$gsd-`, no `/gsd-`).

**Current problem (from codebase analysis):**

Existing `.continue-here.md` files contain hardcoded Claude Code commands:
- Phase 00: `Resume with /gsd:resume-work`, `/gsd:audit-milestone`, `/gsd:add-phase`, `/gsd:discuss-phase`
- Phase 08: `Command to resume: /gsd:resume-work`

The `<next_action>` section in both files contains `/gsd:` command syntax, making them unresumable in Codex CLI (where commands are `$gsd-command-name`) or OpenCode (where commands are `/gsd-command-name`).

**Solution architecture:**

The `.continue-here.md` template's `<next_action>` section must express intent, not commands:
```markdown
<next_action>
Resume from task 3 of plan 08-03. The remaining conflicts (.gitignore,
README.md, CHANGELOG.md) are straightforward fork-wins resolutions.

Intent: Execute the remaining tasks of plan 08-03, then proceed to plan 08-04
for validation and merge commit.
</next_action>
```

The resume-project.md workflow is responsible for translating semantic intent into runtime-appropriate commands at display time.

**Source:** Direct analysis of `.planning/phases/08-core-merge/.continue-here.md` and `.planning/phases/00-deployment-infrastructure/.continue-here.md`

### Pattern 2: Runtime Detection via Path Prefix (HAND-03)

**What:** The LLM detects which runtime it is executing in by examining the path prefix in the workflow files it is reading.

**How it works:** The installer's `replacePathsInContent()` function (line 956 of `bin/install.js`) transforms `~/.claude/` references to the runtime-specific prefix:
- Claude Code: `~/.claude/`
- OpenCode: `~/.config/opencode/` (or custom via env vars)
- Gemini CLI: `~/.gemini/`
- Codex CLI: `~/.codex/`

When a workflow file references `~/.claude/get-shit-done/bin/gsd-tools.js`, that path has already been transformed to the correct runtime prefix by the installer. The LLM can infer the runtime from this path.

**Runtime detection heuristic (for use in resume-project.md):**

```markdown
Detect current runtime by examining the path prefix in this workflow file:
- If paths reference ~/.claude/ -> Claude Code (commands: /gsd:command)
- If paths reference ~/.config/opencode/ -> OpenCode (commands: /gsd-command)
- If paths reference ~/.gemini/ -> Gemini CLI (commands: /gsd:command)
- If paths reference ~/.codex/ -> Codex CLI (commands: $gsd-command)
```

This follows the existing design principle: "Feature detection, not runtime detection" from capability-matrix.md. However, for command rendering specifically, we DO need to know which command syntax to use. This is a presentation concern, not a capability concern, so it is acceptable.

**Source:** `bin/install.js` lines 956-982 (`replacePathsInContent`), capability-matrix.md Format Reference table

### Pattern 3: Command Syntax Mapping Table

**What:** A reference mapping from semantic command names to runtime-specific invocation syntax.

The installer already performs these transformations at install time:
- Claude Code: `/gsd:command-name` (source format, unchanged)
- OpenCode: `/gsd-command-name` (line 597 of install.js: `replace(/\/gsd:/g, '/gsd-')`)
- Gemini CLI: `/gsd:command-name` (same as Claude Code)
- Codex CLI: `$gsd-command-name` (line 755: `replace(/\/gsd:([a-z0-9-]+)/g, '\\$gsd-$1')`)

For the resume workflow to render commands correctly, it needs this same mapping applied at display time.

**Implementation approach:**

Add a command rendering helper to the resume-project.md workflow that maps semantic command names to the correct syntax based on detected runtime:

```markdown
To render a GSD command reference for the current runtime:
1. Detect runtime (Pattern 2 above)
2. Apply command syntax:
   - Claude Code / Gemini CLI: /gsd:{command-name}
   - OpenCode: /gsd-{command-name}
   - Codex CLI: $gsd-{command-name}
```

**Source:** `bin/install.js` lines 596-597, 754-755

### Pattern 4: Signal Schema Extension (SIG-01, SIG-02, SIG-03)

**What:** Add `runtime:` and `model:` optional fields to the signal YAML frontmatter.

**Current signal schema** (from `knowledge-store.md` Section 4 and `kb-templates/signal.md`):
```yaml
---
id: sig-{YYYY-MM-DD}-{slug}
type: signal
project: {project-name}
tags: [tag1, tag2]
created: {timestamp}
updated: {timestamp}
durability: {workaround|convention|principle}
status: active
severity: {critical|notable}
signal_type: {deviation|struggle|config-mismatch|custom}
phase: {phase-number}
plan: {plan-number}
---
```

**Extended schema** (adding runtime provenance):
```yaml
---
# ... all existing fields ...
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-id}
# Phase 2 extension fields (already exist):
polarity: {positive|negative|neutral}
source: {auto|manual}
occurrence_count: 1
related_signals: []
---
```

The `runtime:` field identifies which runtime generated the signal. The `model:` field captures the LLM model identifier (e.g., `claude-opus-4-6`, `claude-sonnet-4-20250514`, `o3`).

**Where runtime/model info comes from:**
- **Automatic signals (gsd-signal-collector):** The collector runs in a specific runtime context. Runtime can be inferred from the path prefix (same as Pattern 2). Model can be inferred from the agent's own awareness of which model it is.
- **Manual signals (/gsd:signal):** Same inference -- the LLM executing the workflow knows its own model name and can detect runtime from path prefix.

**Compatibility:** These are optional fields. Existing signals without them are still valid. The index rebuild script processes all frontmatter fields without filtering (per signal-detection.md Section 8).

**Source:** `.claude/agents/knowledge-store.md` Section 4, `.claude/agents/kb-templates/signal.md`, `get-shit-done/references/signal-detection.md` Section 8

### Pattern 5: Capability Gap Signals (SIG-04)

**What:** When a runtime lacks a required capability, log it as a signal with `signal_type: capability-gap`.

**Current capability gap handling** (from capability-matrix.md): "Inform once then adapt silently." When `has_capability("task_tool")` is false, the orchestrator notes "Running sequentially -- this runtime doesn't support parallel agents" and adapts.

**Enhancement:** In addition to informing the user, the orchestrator logs a signal:
```yaml
---
severity: trace
signal_type: capability-gap
runtime: codex-cli
# ...
---

## What Happened

Runtime capability `task_tool` not available. Degraded to sequential execution.

## Context

Phase 5, Plan 1 execution in Codex CLI. Parallel wave execution unavailable.

## Potential Cause

Codex CLI does not support the Task tool. This is a known runtime limitation, not an error.
```

**Important design constraint:** Per signal-detection.md Section 6, `trace` signals are NOT persisted to the KB -- they are logged in collection report output only. Capability gap events are `trace` severity by default because they are expected, known limitations. Only if a capability gap causes an actual problem (e.g., execution failure) should it be elevated to `notable`.

**Placement:** Capability gap signal logging happens in the orchestrator workflow (`execute-phase.md`) inside `<capability_check>` blocks, in the `Else` branch.

**Source:** `get-shit-done/references/capability-matrix.md` Section "Feature Detection Convention", `get-shit-done/references/signal-detection.md` Section 6

### Pattern 6: Continuation Format Runtime Adaptation (HAND-03)

**What:** The continuation-format.md reference shows commands using `/gsd:` syntax throughout. The resume-project.md workflow already reads this reference. The workflow must render runtime-appropriate commands when presenting "Next Up" boxes.

**Current continuation format** (from `get-shit-done/references/continuation-format.md`):
```markdown
## Next Up

**Phase 2: Authentication** -- JWT login flow with refresh tokens

`/gsd:plan-phase 2`
```

**Runtime-adapted format:**
```markdown
## Next Up

**Phase 2: Authentication** -- JWT login flow with refresh tokens

`{runtime-appropriate-command}:plan-phase 2`
```

The continuation-format.md itself does NOT need to change -- it is a reference document that the installer already transforms via `replacePathsInContent()`. The workflows reading it will naturally see runtime-appropriate commands.

**However:** The `pause-work.md` workflow currently hardcodes `/gsd:resume-work` in its confirmation output (line 110). This IS a problem because the workflow source files are installed per-runtime, so this line would already be transformed. But the template content it generates for `.continue-here.md` must be semantic, not procedural.

**Source:** `get-shit-done/references/continuation-format.md`, `get-shit-done/workflows/pause-work.md` line 110

### Anti-Patterns to Avoid

- **Runtime name checks instead of feature detection:** Never use `if runtime === "codex"`. Always use `has_capability("feature")` for capability questions. Only use runtime detection for COMMAND SYNTAX rendering, which is a presentation concern, not a capability concern.
- **Storing command syntax in `.continue-here.md`:** The next_action section must describe WHAT to do, not HOW to invoke it. Command rendering is the resume workflow's job.
- **Adding runtime/model detection to every agent:** Only the signal-producing agents (gsd-signal-collector, /gsd:signal workflow) and the resume workflow need runtime awareness. Do not add runtime detection to executor, planner, researcher, or other agents.
- **Modifying existing signal files to add runtime/model:** Signals are immutable after creation (Phase 1 lifecycle rules from knowledge-store.md). Only new signals get the new fields.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime detection | Custom shell scripts or env var probing | Path prefix inspection from installed workflow files | The installer already sets up the correct paths; detection is reading what's already there |
| Command syntax mapping | Lookup tables in every workflow | Single rendering helper in resume-project.md + installer's existing transformation | The installer already handles command syntax conversion; workflows only need it at display time |
| Model identification | External API calls or process inspection | The LLM's self-knowledge of its model name | Claude models know they are `claude-opus-4-6` etc.; Codex knows it is running a specific model |
| Signal schema migration | Migration scripts for existing signals | Optional fields with backward compatibility | Existing signals without runtime/model fields are still valid; no migration needed |

**Key insight:** The installer already does 90% of the heavy lifting. It transforms paths and command syntax at install time. Phase 16's job is to ensure the remaining 10% -- state files and signal metadata -- follow the same runtime-agnostic principles.

## Common Pitfalls

### Pitfall 1: Over-Engineering Runtime Detection
**What goes wrong:** Building an elaborate runtime detection system when a simple path prefix check suffices.
**Why it happens:** Temptation to create a formal API, environment variable protocol, or configuration-based detection.
**How to avoid:** The runtime is already encoded in the installed workflow paths. When the LLM reads `~/.codex/get-shit-done/bin/gsd-tools.js` in its workflow file, it knows it's Codex CLI. No additional infrastructure needed.
**Warning signs:** Creating new files, new configuration entries, or new gsd-tools.js commands for runtime detection.

### Pitfall 2: Forgetting the Installer Transformation
**What goes wrong:** Modifying source workflow files with runtime-conditional logic like "if this is Codex, show X." The installer already transforms the source files per-runtime.
**Why it happens:** Not realizing that the workflow files the LLM reads at runtime have already been path-replaced by the installer.
**How to avoid:** Modify SOURCE files (in `get-shit-done/`) with `~/.claude/` paths. The installer transforms them. Only add runtime-conditional logic where the SAME file must behave differently post-transformation (e.g., command syntax rendering in resume-project.md).
**Warning signs:** Multiple if-else blocks in source files checking for different path prefixes.

### Pitfall 3: Breaking Existing `.continue-here.md` Files
**What goes wrong:** Changing the template format without ensuring backward compatibility with existing `.continue-here.md` files.
**Why it happens:** There are currently 2 `.continue-here.md` files with `/gsd:` command references (phases 00 and 08). The resume workflow must handle both old-format and new-format files.
**How to avoid:** The resume workflow should gracefully handle `.continue-here.md` files with or without runtime-specific commands. Old files with `/gsd:` syntax are valid -- they just might show Claude Code commands when resumed in another runtime.
**Warning signs:** Resume workflow crashes or shows confusing output when reading old-format files.

### Pitfall 4: Signal Template Compatibility Break
**What goes wrong:** Making `runtime:` and `model:` required fields, which breaks existing signal files.
**Why it happens:** Overzealous schema enforcement.
**How to avoid:** Keep these as OPTIONAL fields. The knowledge-store.md schema already supports optional fields. The index rebuild script processes all frontmatter without filtering (signal-detection.md Section 8).
**Warning signs:** Index rebuild fails, signal collector errors on old signals, validation errors.

### Pitfall 5: Logging Capability Gaps as High-Severity Signals
**What goes wrong:** Every time Codex runs without task_tool, a `notable` or `critical` signal is created, flooding the KB with noise.
**Why it happens:** Treating known limitations as unexpected deviations.
**How to avoid:** Capability gap events are `trace` severity by default -- logged in collection reports only, NOT persisted to KB. Only escalate if the gap causes an actual execution failure.
**Warning signs:** KB fills with repetitive "no task_tool in Codex" signals after every phase execution.

### Pitfall 6: Modifying .planning/ Files Instead of Source Templates
**What goes wrong:** Editing the existing `.continue-here.md` files in `.planning/phases/` to remove `/gsd:` commands, instead of fixing the source template and workflow that generates them.
**Why it happens:** Confusing the project's planning artifacts with the GSD framework's source templates.
**How to avoid:** Phase 16 modifies FILES in `get-shit-done/` (templates, workflows, references) and `.claude/agents/` (signal collector, knowledge-store, signal template). It does NOT modify existing `.planning/` artifacts. HAND-04's requirement is about STATE.md and `.planning/` files generated GOING FORWARD, not retroactive cleanup.
**Warning signs:** Tasks that edit `.planning/STATE.md` or `.planning/phases/*/` directly.

## Code Examples

### Example 1: Semantic `.continue-here.md` (HAND-02)

Current problematic format:
```markdown
<next_action>
Command to resume: `/gsd:resume-work`
</next_action>
```

New semantic format:
```markdown
<next_action>
Resume from task 3 of plan 08-03. Three straightforward conflicts remain:
1. .gitignore -- combine fork + upstream entries
2. README.md -- fork-wins
3. CHANGELOG.md -- fork-wins

After resolving: write 08-03-SUMMARY.md, then proceed to plan 08-04
(validate, commit, report).
</next_action>
```

The resume workflow reads this and presents:
```
Resume from checkpoint: Phase 08, Plan 03, Task 3

To continue: `/gsd:execute-phase 8`  (or $gsd-execute-phase 8 in Codex)
```

### Example 2: Runtime Detection in Resume Workflow (HAND-03)

Add to resume-project.md after the initialize step:
```markdown
<step name="detect_runtime">
Detect which runtime this workflow is executing in by examining the path
prefix used in this file. The installer replaces ~/.claude/ with the
target runtime's path prefix during installation.

Runtime detection:
- ~/.claude/ paths -> Claude Code (command prefix: /gsd:)
- ~/.config/opencode/ paths -> OpenCode (command prefix: /gsd-)
- ~/.gemini/ paths -> Gemini CLI (command prefix: /gsd:)
- ~/.codex/ paths -> Codex CLI (command prefix: $gsd-)

Store the detected runtime name and command prefix for use when
rendering command suggestions to the user.
</step>
```

### Example 3: Extended Signal Template (SIG-01, SIG-02, SIG-03)

Updated `kb-templates/signal.md`:
```yaml
---
id: sig-{YYYY-MM-DD}-{slug}
type: signal
project: {project-name}
tags: [{tag1}, {tag2}]
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
durability: {workaround|convention|principle}
status: active
severity: {critical|notable}
signal_type: {deviation|struggle|config-mismatch|capability-gap|custom}
phase: {phase-number}
plan: {plan-number}
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-identifier}
---
```

### Example 4: Capability Gap Signal (SIG-04)

In execute-phase.md, inside the Else branch of a capability_check:
```markdown
<capability_check name="parallel_execution">
If has_capability("task_tool"):
  Spawn gsd-executor via Task() for each plan in the wave.

Else:
  Note to user (first occurrence only): "Note: Running sequentially --
  this runtime doesn't support parallel agents."

  Log capability gap signal:
  - signal_type: capability-gap
  - severity: trace
  - runtime: {detected runtime}
  - description: "task_tool unavailable, degraded to sequential execution"

  Execute plans sequentially per the degraded behavior specification.
</capability_check>
```

### Example 5: Updated Pause-Work Confirmation (HAND-01)

Current (line 110 of pause-work.md):
```
To resume: /gsd:resume-work
```

Updated (semantic):
```
To resume: start a new session in any supported runtime and use
the resume-work command.
```

The installer will transform this per-runtime. But more importantly, the `.continue-here.md` file itself has no command syntax -- only the workflow confirmation message mentions it.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-runtime assumption | 4 runtimes (Claude Code, OpenCode, Gemini CLI, Codex CLI) | Phase 13-15 (v1.14) | All state files must be runtime-agnostic |
| KB at `~/.claude/gsd-knowledge/` | KB at `~/.gsd/knowledge/` (shared) | Phase 14 | Signals accessible from all runtimes |
| Signals have no provenance | Signals will track runtime + model | Phase 16 (this phase) | Cross-runtime debugging possible |
| `.continue-here.md` has `/gsd:` commands | Will store semantic state only | Phase 16 (this phase) | Handoff works across runtimes |

## Open Questions

1. **Model name detection accuracy**
   - What we know: Claude models self-report their model name accurately. The Opus 4.6 model knows it is `claude-opus-4-6`.
   - What's unclear: How OpenAI models (running in Codex CLI) or Gemini models (running in Gemini CLI) report their model names. Each LLM may have a different self-identification mechanism.
   - Recommendation: Use best-effort model identification. If the LLM knows its model name, include it. If uncertain, use "unknown" or omit the field. This is an optional field precisely for this reason.

2. **Existing `.continue-here.md` backward compatibility**
   - What we know: There are 2 existing `.continue-here.md` files (phases 00 and 08) with `/gsd:` command syntax.
   - What's unclear: Whether these files will ever be resumed. Phase 08 is on the current working branch; Phase 00 is from v1.12.
   - Recommendation: Do not modify existing files. The resume workflow should handle old-format files gracefully -- if it encounters `/gsd:` syntax in `<next_action>`, it displays it as-is (which is fine if resuming in Claude Code).

3. **Gemini CLI command syntax confirmation**
   - What we know: From install.js, Gemini CLI uses the same `/gsd:command` syntax as Claude Code (the installer does not apply the `/gsd:` -> `/gsd-` transformation for Gemini).
   - What's unclear: Whether Gemini CLI's actual command invocation at runtime matches this. LOW confidence -- based only on installer code, not official Gemini CLI docs.
   - Recommendation: Trust the installer logic. If Gemini CLI uses `commands/gsd/*.toml` (same nested structure as Claude Code), then `/gsd:command` syntax is correct.

4. **Capability gap signal persistence**
   - What we know: trace-severity signals are NOT persisted to the KB (signal-detection.md Section 6). Capability gaps are trace by default.
   - What's unclear: Whether the user or reflection engine would ever want to see capability gap patterns across time.
   - Recommendation: Keep capability gaps as trace (not persisted) for v1. If cross-runtime analytics become important in a future milestone, the severity can be elevated or a separate tracking mechanism introduced.

## Files to Modify

### Handoff Workstream (HAND-01 through HAND-04)

| File | Change | Requirement |
|------|--------|-------------|
| `get-shit-done/templates/continue-here.md` | Remove `/gsd:` from `<next_action>` example; add guidance for semantic-only content | HAND-02 |
| `get-shit-done/workflows/pause-work.md` | Update `<next_action>` generation to be semantic-only; update confirmation output | HAND-01, HAND-02 |
| `get-shit-done/workflows/resume-project.md` | Add runtime detection step; render runtime-appropriate commands in status display and next-action suggestions | HAND-01, HAND-03 |
| `get-shit-done/references/continuation-format.md` | Add note about runtime-appropriate command rendering (the reference itself is already transformed by installer) | HAND-03 |
| Audit scan of `.planning/` templates | Verify STATE.md template and other templates have no `/gsd:` hardcoded commands | HAND-04 |

### Signal Enrichment Workstream (SIG-01 through SIG-04)

| File | Change | Requirement |
|------|--------|-------------|
| `.claude/agents/kb-templates/signal.md` | Add `runtime:` and `model:` fields to frontmatter | SIG-03 |
| `.claude/agents/knowledge-store.md` | Add `runtime` and `model` to Signal Extensions table (Section 4) | SIG-01, SIG-02 |
| `get-shit-done/references/signal-detection.md` | Add `capability-gap` to signal_type enum; document runtime/model field population; add Section for capability gap detection | SIG-01, SIG-02, SIG-04 |
| `.claude/agents/gsd-signal-collector.md` | Add runtime/model population to signal creation steps | SIG-01, SIG-02 |
| `get-shit-done/workflows/signal.md` | Add runtime/model population to manual signal creation | SIG-01, SIG-02 |
| `get-shit-done/workflows/execute-phase.md` | Add capability gap signal logging in capability_check Else branches | SIG-04 |
| `get-shit-done/workflows/collect-signals.md` | No changes needed (orchestrator delegates to signal collector agent) | -- |

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `bin/install.js` (lines 596-597, 754-755, 956-982) -- runtime command syntax transformations and path replacement
- Direct codebase analysis of `get-shit-done/workflows/pause-work.md` -- current handoff format
- Direct codebase analysis of `get-shit-done/workflows/resume-project.md` -- current resume flow
- Direct codebase analysis of `.planning/phases/08-core-merge/.continue-here.md` and `.planning/phases/00-deployment-infrastructure/.continue-here.md` -- real examples of runtime-specific content in handoff files
- `get-shit-done/references/capability-matrix.md` -- feature detection pattern, format reference table
- `get-shit-done/references/signal-detection.md` -- signal schema, severity rules, detection rules
- `.claude/agents/knowledge-store.md` -- KB schema and signal extensions
- `.claude/agents/kb-templates/signal.md` -- current signal template (no runtime/model fields)
- `.claude/agents/gsd-signal-collector.md` -- automatic signal collection flow
- `get-shit-done/workflows/signal.md` -- manual signal creation flow
- `.planning/REQUIREMENTS.md` -- HAND-01 through HAND-04, SIG-01 through SIG-04 definitions
- `.planning/ROADMAP.md` -- Phase 16 success criteria
- `.planning/phases/15-codex-cli-integration/15-VERIFICATION.md` -- Phase 15 completion confirmation

### Secondary (MEDIUM confidence)
- `get-shit-done/templates/continue-here.md` -- template for handoff files (may need further analysis of guidelines section)
- `get-shit-done/references/continuation-format.md` -- standard for next-step presentation (already transformed by installer, but rendering logic needs verification)

### Tertiary (LOW confidence)
- Gemini CLI command invocation syntax -- inferred from installer code, not verified against official Gemini CLI documentation
- Non-Claude model self-identification -- assumes other LLMs can report their model name, not verified

## Knowledge Applied

Checked knowledge base (`~/.gsd/knowledge/index.md`), no KB directory found at `~/.gsd/knowledge/`. KB not yet populated at this path on this machine (migration may not have run). No relevant entries to surface.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are existing project files, directly analyzed
- Architecture: HIGH -- patterns derived from direct codebase analysis, not external sources
- Pitfalls: HIGH -- identified from real examples in the codebase (existing `.continue-here.md` files)
- Signal enrichment: HIGH -- straightforward schema extension following established patterns
- Capability gap signals: MEDIUM -- trace severity design follows existing rules, but integration into execute-phase.md is a new pattern

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable -- internal codebase analysis, no external dependency versioning concerns)
