# Phase 43: Plan Intelligence & Templates - Research

**Researched:** 2026-03-06
**Domain:** Plan validation semantics, template traceability, internal tooling
**Confidence:** HIGH

## Summary

Phase 43 adds four semantic validation dimensions to the plan checker agent (`gsd-plan-checker.md`) and enhances several templates to close traceability loops. The plan checker currently validates 7 structural dimensions (requirement coverage, task completeness, dependency correctness, key links, scope sanity, verification derivation, context compliance). This phase adds PLAN-01 through PLAN-05: tool subcommand validation, config key validation, directory existence validation, signal reference validation -- all as advisory findings with typed IDs.

The template work (TMPL-01 through TMPL-05) spans four artifacts: the requirements template (`requirements.md`), the summary templates (`summary-standard.md`, `summary-complex.md`, `summary-minimal.md`), the reflection workflow (`reflect.md`) and reflector agent (`gsd-reflector.md`), and the feature research template (`research-project/FEATURES.md`). These are markdown template files consumed by LLM agents, not executable code -- changes are spec/template text additions, not code modifications.

**Primary recommendation:** Implement plan checker semantic dimensions as new sections in the `gsd-plan-checker.md` agent spec (Dimension 8-11), with an allowlist data structure for tool subcommands embedded directly in the agent spec. Template changes are straightforward text additions to existing template files. All validation findings use advisory severity to avoid false rejections for plans describing future state.

## Standard Stack

### Core

This phase modifies agent specs, workflow specs, and template files -- no new runtime dependencies.

| File | Current Location | Purpose | Change Scope |
|------|-----------------|---------|--------------|
| `agents/gsd-plan-checker.md` | npm source dir | Plan verification agent spec | Add Dimensions 8-11 (semantic validation) |
| `get-shit-done/templates/requirements.md` | npm source dir | Requirements template | Motivation field already present (TMPL-01 done in template) |
| `get-shit-done/templates/summary-*.md` | npm source dir | Summary templates (3 files) | Add `model` and `context_used_pct` frontmatter fields |
| `get-shit-done/workflows/reflect.md` | npm source dir | Reflection workflow | Add requirement linkage instructions (TMPL-04) |
| `agents/gsd-reflector.md` | npm source dir | Reflector agent spec | Add requirement linkage output section (TMPL-04) |
| `get-shit-done/templates/research-project/FEATURES.md` | npm source dir | Feature spec template | Add Internal Tensions section (TMPL-05) |

### Supporting

| Artifact | Purpose | How Used |
|----------|---------|----------|
| `get-shit-done/feature-manifest.json` | Config schema source of truth | PLAN-02 reads this to validate config key references |
| `.planning/knowledge/index.md` | KB signal index | PLAN-04 reads this to validate `resolves_signals` references |
| `get-shit-done/bin/gsd-tools.js` | CLI tool source | PLAN-01 extracts allowlist from its case statements |

### No Installation Required

This phase modifies only markdown spec files and templates. No npm packages, no new code, no build steps.

## Architecture Patterns

### Pattern 1: Advisory Semantic Dimension (PLAN-05 Core Pattern)

**What:** Each new validation dimension follows the same structure -- extract references from plan text, validate against a source of truth, report findings as advisory (not blocker) with typed IDs.

**When to use:** All four new dimensions (PLAN-01 through PLAN-04).

**Structure per dimension:**

```markdown
## Dimension N: [Name]

**Question:** [What is being validated?]
**Severity:** advisory (never blocker -- plans may describe future state)

**Process:**
1. Extract [references] from plan `<action>` blocks
2. Validate each against [source of truth]
3. Report findings with typed IDs

**Extraction pattern:** [regex or parsing approach]

**Validation source:** [what file/data to check against]

**Finding format:**
issue:
  plan: "43-01"
  dimension: "[dimension_name]"
  severity: advisory
  finding_id: "[TYPE]-[NNN]"
  description: "..."
  resolution_hint: "..."
```

**Why advisory:** Plans often reference entities that will be created by earlier tasks in the same plan or by dependency plans. A plan that creates a new directory in Task 1 and references it in Task 2 would fail a strict directory-existence check at plan-check time. Advisory findings surface the information without blocking execution. Typed IDs (e.g., `TOOL-001`, `CFG-001`, `DIR-001`, `SIG-001`) enable future correlation with execution signals. This was explicitly motivated by the FEATURES.md research finding (PITFALLS.md #5) and the philosophical analysis of premature synthesis.

### Pattern 2: Allowlist Extraction for Tool Subcommands (PLAN-01)

**What:** An embedded allowlist of valid gsd-tools.js subcommands and their sub-subcommands, maintained in the plan checker agent spec.

**Current tool command tree** (verified from gsd-tools.js source):

```
Top-level commands:
  state, resolve-model, find-phase, commit, verify-summary, template,
  frontmatter, verify, generate-slug, current-timestamp, list-todos,
  verify-path-exists, config-ensure-section, config-set, history-digest,
  phases, roadmap, phase, milestone, validate, progress, todo, scaffold,
  init, phase-plan-index, state-snapshot, summary-extract, websearch,
  manifest, backlog, automation, sensors, health-probe

Subcommand trees:
  frontmatter: get, set, merge, validate
  verify: plan-structure, phase-completeness, references, commits, artifacts, key-links
  automation: resolve-level, track-event, lock, unlock, check-lock, regime-change, reflection-counter
  sensors: list, blind-spots
  health-probe: signal-metrics, signal-density, automation-watchdog
  init: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress
  template: (accepts template name arg)
  roadmap: (get-phase subcommand)
  manifest: (selftest, describe, etc.)
```

**Maintenance concern:** This allowlist must be updated when gsd-tools.js adds new subcommands. The plan checker should note when it encounters an unrecognized top-level command (as a finding), but the allowlist itself lives in the agent spec, not in gsd-tools.js. Prior signal [sig-2026-03-01-plan-checker-misses-tool-api-assumptions] documented a case where `frontmatter extract` was used instead of `frontmatter get` -- an allowlist would have caught this.

### Pattern 3: Config Key Validation Against Feature Manifest (PLAN-02)

**What:** Extract config key references from plan `<action>` text, validate each dotted path against the feature-manifest.json schema.

**How config keys appear in plans:**
- Direct references: `config.json automation.level`, `automation.stats.signal_collection`
- In gsd-tools.js invocations: `config-set automation.level 3`
- In markdown descriptions: "set `signal_collection.auto_collect` to true"

**Validation approach:**
1. Parse feature-manifest.json to build a flat set of valid config key paths
2. Extract all dotted-path references from plan `<action>` blocks
3. Validate each against the flat set
4. Advisory finding for unrecognized keys

**Valid config key path construction from manifest:**
```
For each feature in manifest.features:
  config_key = feature.config_key (e.g., "automation")
  For each field in feature.schema:
    valid_path = config_key + "." + field_name (e.g., "automation.level")
    For nested objects:
      valid_path = config_key + "." + field + "." + nested_field (e.g., "automation.reflection.auto_reflect")
```

Prior signal [sig-2026-03-01-plan-checker-misses-second-order-effects] documented `spike_sensitivity` (flat) vs `spike.sensitivity` (nested) confusion. This validation would catch such mismatches.

### Pattern 4: Directory Existence with Temporal Awareness (PLAN-03)

**What:** Check that `files_modified` paths in plan frontmatter have valid parent directories, with awareness that earlier tasks in the same plan may create those directories.

**Temporal awareness logic:**
1. Parse all tasks in order within a plan
2. Build a "will exist" set: directories that tasks explicitly create (via `mkdir -p` in `<action>` or listed in `<files>` as directories)
3. For each `files_modified` path, check: does the parent directory exist on disk OR appear in the "will exist" set?
4. For multi-plan dependencies: if plan 02 depends on plan 01, plan 01's created directories are assumed to exist for plan 02's checks

**Advisory finding for missing directories** -- the directory may be created by a step not captured in the `<files>` element.

### Pattern 5: Signal Reference Validation (PLAN-04)

**What:** Validate `resolves_signals` IDs in plan frontmatter against the KB signal index.

**Process:**
1. Parse `resolves_signals` from plan frontmatter (YAML list of signal IDs)
2. Read `.planning/knowledge/index.md` (or `~/.gsd/knowledge/index.md` fallback)
3. Extract all signal IDs from the index (both `sig-*` and legacy `SIG-*` format)
4. For each `resolves_signals` ID, check if it appears in the index
5. Advisory finding for unmatched IDs -- signal may not yet have been collected

**Depends on Phase 38** which established the sensor contract and KB infrastructure that PLAN-04 reads from.

### Pattern 6: Template Enhancement (Non-Code Changes)

**What:** Template files are markdown consumed by LLM agents. Changes are additions of fields/sections, not code modifications.

**TMPL-01 (Requirements motivation field):** Already present in the current `requirements.md` template -- the `*Motivation:* [type]: [citation]` line exists. The current REQUIREMENTS.md already uses this format extensively. TMPL-01 is effectively already satisfied by the template. Research confirms the template already includes motivation types line: "Motivation types: `signal:` KB signal ID | `pattern:` reflection pattern | `lesson:` KB lesson ID | `research:` research finding | `deliberation:` design decision | `user:` direct user request"

**TMPL-02 (model field):** Add `model:` to the YAML frontmatter of all three summary templates. The model value comes from the executor's self-identification. Signal [sig-2026-03-04-summary-md-no-executor-model-epistemic-gap-phase38] documented this gap.

**TMPL-03 (context_used_pct field):** Add `context_used_pct:` to summary frontmatter. This is an integer percentage estimated at plan completion. Signal [sig-2026-03-02-summary-md-lacks-executor-model-provenance] partially motivated this.

**TMPL-04 (Reflection-to-requirement linkage):** Modify the reflector agent spec and reflect workflow to include a section in reflection reports that maps findings to requirement IDs. The reflector already produces structured output; adding a `## Requirement Linkage` section maps pattern findings and triage proposals to the requirement IDs they relate to (e.g., a pattern about "plan checker gaps" maps to PLAN-01 through PLAN-05).

**TMPL-05 (Internal Tensions section):** Add an "Internal Tensions" section template to the FEATURES.md research template. This section is selective -- only for architecturally significant features, not wiring/infrastructure. The v1.17 REQUIREMENTS.md already practices this informally (the "Structural Tensions" section at the bottom). TMPL-05 formalizes it as a template section.

### Recommended File Modification Plan

```
agents/gsd-plan-checker.md
  Add: Dimension 8 (Tool Subcommand Validation) -- PLAN-01
  Add: Dimension 9 (Config Key Validation) -- PLAN-02
  Add: Dimension 10 (Directory Existence Validation) -- PLAN-03
  Add: Dimension 11 (Signal Reference Validation) -- PLAN-04
  Add: Advisory Severity Policy section -- PLAN-05
  Add: Finding ID schema section -- PLAN-05

get-shit-done/templates/summary-standard.md
  Add: model: [model-identifier] to frontmatter -- TMPL-02
  Add: context_used_pct: [0-100] to frontmatter -- TMPL-03

get-shit-done/templates/summary-complex.md
  Add: model: [model-identifier] to frontmatter -- TMPL-02
  Add: context_used_pct: [0-100] to frontmatter -- TMPL-03

get-shit-done/templates/summary-minimal.md
  Add: model: [model-identifier] to frontmatter -- TMPL-02
  Add: context_used_pct: [0-100] to frontmatter -- TMPL-03

agents/gsd-reflector.md
  Add: ## Requirement Linkage section in output format -- TMPL-04

get-shit-done/workflows/reflect.md
  Add: instruction to spawn_reflector step for req linkage -- TMPL-04

get-shit-done/templates/research-project/FEATURES.md
  Add: Internal Tensions section template -- TMPL-05

get-shit-done/templates/requirements.md
  Verify: motivation field already present -- TMPL-01 (no change needed)
```

### Anti-Patterns to Avoid

- **Making semantic findings blocker severity:** Plans describe future state; a plan that creates dir X in Task 1 and references it in Task 2 should NOT fail directory validation. Advisory severity is essential.
- **Hardcoding the tool allowlist in gsd-tools.js:** The allowlist belongs in the agent spec, not the tool itself. The plan checker is an LLM agent that reads specs, not executable code.
- **Over-parsing plan action text:** Regex extraction from natural language plan descriptions will have false positives and negatives. Use simple patterns (e.g., `gsd-tools\.js\s+(\S+)\s+(\S+)` for tool invocations) and accept imperfect extraction.
- **Editing `.claude/` directly instead of npm source:** Per CLAUDE.md, always edit `agents/`, `get-shit-done/`, `commands/` -- the npm source directories. Then run `node bin/install.js --local` to update `.claude/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config key schema flattening | Custom config parser | Walk `feature-manifest.json` structure | Manifest is the single source of truth; parsing config.json directly misses schema information |
| Signal ID lookup | Custom KB index parser | Read index.md and grep for signal IDs | Index is already a well-structured markdown table; no need for JSON parsing |
| Tool subcommand discovery at runtime | Dynamic parsing of gsd-tools.js source | Static allowlist in plan checker spec | Plan checker is an LLM agent reading specs, not executing code; dynamic discovery would require code execution |
| YAML frontmatter parsing in plan checker | Custom YAML parser | The plan checker already reads frontmatter via `gsd-tools.js frontmatter get` | Existing infrastructure handles this |

**Key insight:** The plan checker is a specification-reading LLM agent, not executable code. "Implementation" means writing precise instructions in the agent spec, not writing JavaScript. The allowlists, extraction patterns, and validation logic are all spec text that guides the agent's reasoning.

## Common Pitfalls

### Pitfall 1: False Rejections from Temporal Ignorance
**What goes wrong:** Directory validation fails because the plan creates the directory in an earlier task, but the checker doesn't track intra-plan state.
**Why it happens:** Naive directory check looks at disk state at plan-check time, not at planned execution state.
**How to avoid:** Temporal awareness: build "will exist" set from task `<files>` and `<action>` blocks before checking later tasks.
**Warning signs:** Advisory findings for directories that appear in the plan's own file lists.

### Pitfall 2: Stale Tool Allowlist
**What goes wrong:** New gsd-tools.js subcommands are added but the plan checker allowlist is not updated, causing false advisory findings.
**Why it happens:** The allowlist is in a separate file (agent spec) from the tool source.
**How to avoid:** Include a maintenance note in the plan checker spec reminding editors to update the allowlist when adding subcommands. Optionally add a wiring test that compares the allowlist against actual gsd-tools.js case statements.
**Warning signs:** Advisory findings for subcommands that definitely exist.

### Pitfall 3: Over-Extraction of Config Keys
**What goes wrong:** Regex extracts dotted paths from plan text that are not config key references (e.g., "v1.17.0" or "path.to.file.ts").
**Why it happens:** Dotted paths are ambiguous in natural language text.
**How to avoid:** Narrow extraction to context where config is being discussed: near "config", "config.json", "config-set", "feature-manifest", or within `<action>` blocks that reference configuration operations.
**Warning signs:** Findings flagging version numbers or file paths as invalid config keys.

### Pitfall 4: Incomplete requirements.md Template Check
**What goes wrong:** TMPL-01 is assumed to require changes but the template already has the motivation field.
**Why it happens:** Not reading the current template before planning changes.
**How to avoid:** Verify current state first. Research confirms `requirements.md` already includes `*Motivation:* [type]: [citation]` and motivation types documentation. TMPL-01 may be satisfied -- verify during planning and document as "already implemented in template" if so.
**Warning signs:** Plan creates duplicate motivation fields.

### Pitfall 5: Dual-Directory Edit Mistake
**What goes wrong:** Changes are made to `.claude/agents/` or `.claude/get-shit-done/` instead of the npm source directories.
**Why it happens:** The project has two copies (see CLAUDE.md critical warning). This exact mistake happened in Phase 22 and was undetected for 23 days.
**How to avoid:** Always edit `agents/`, `get-shit-done/`, `commands/`. Run `node bin/install.js --local` after changes to sync.
**Warning signs:** `git diff` shows changes only in `.claude/` paths.

### Pitfall 6: Reflection Report Format Incompatibility
**What goes wrong:** TMPL-04 requirement linkage section is added to the reflector output format but the reflect workflow's `receive_report` step doesn't pass it through.
**Why it happens:** The reflect workflow orchestrates the reflector agent; both need updates in tandem.
**How to avoid:** Update both `agents/gsd-reflector.md` (output format) and `get-shit-done/workflows/reflect.md` (present_results step) together.
**Warning signs:** Requirement linkage appears in reflector output but not in persisted reports.

## Code Examples

These are agent spec patterns, not executable code.

### Tool Subcommand Validation Dimension (PLAN-01)

```markdown
## Dimension 8: Tool Subcommand Validation

**Question:** Do plan actions reference valid gsd-tools.js subcommands?
**Severity:** advisory

**Process:**
1. Scan all `<action>` blocks for patterns matching:
   `gsd-tools.js <command> [<subcommand>]`
   `node .*/gsd-tools.js <command> [<subcommand>]`
2. For each match, check <command> against the top-level allowlist
3. If command has subcommands, check <subcommand> against the subcommand allowlist
4. Report unmatched commands/subcommands as advisory findings

**Tool command allowlist:**
<!-- Verified against gsd-tools.js source 2026-03-06 -->
[embedded allowlist from Architecture Pattern 2 above]

**Finding format:**
issue:
  dimension: tool_subcommand
  severity: advisory
  finding_id: "TOOL-001"
  description: "Plan references 'frontmatter extract' -- valid subcommands are: get, set, merge, validate"
  plan: "43-01"
  task: 1
  resolution_hint: "Did you mean 'frontmatter get'?"
```

### Config Key Validation Dimension (PLAN-02)

```markdown
## Dimension 9: Config Key Validation

**Question:** Do plan actions reference valid config keys from feature-manifest.json?
**Severity:** advisory

**Process:**
1. Read `get-shit-done/feature-manifest.json`
2. Build valid key set by walking schema:
   For each feature: config_key + "." + schema_field
   For nested objects: config_key + "." + field + "." + nested_field
3. Scan `<action>` blocks for config key references:
   - After 'config-set' commands
   - Dotted paths near 'config', 'config.json', 'feature-manifest' context
4. Validate extracted keys against valid set
5. Report unmatched keys as advisory findings

**Finding format:**
issue:
  dimension: config_key
  severity: advisory
  finding_id: "CFG-001"
  description: "Plan references 'spike_sensitivity' -- valid key is 'spike.sensitivity'"
  plan: "35-02"
  resolution_hint: "Check feature-manifest.json for correct key path"
```

### Summary Template Frontmatter Addition (TMPL-02, TMPL-03)

```yaml
---
phase: XX-name
plan: YY
model: [model-identifier]          # TMPL-02: e.g., "claude-opus-4-6", "claude-sonnet-4-20250514"
context_used_pct: [0-100]          # TMPL-03: estimated context usage at plan completion
subsystem: [primary category]
tags: [searchable tech]
# ... rest of existing frontmatter
---
```

### Internal Tensions Template Section (TMPL-05)

```markdown
## Internal Tensions

<!-- Include for architecturally significant features only.
     Skip for wiring, infrastructure, or straightforward requirements.
     If a tension resists template capture, record it in a deliberation document instead. -->

| Feature | Tension Introduced | Constraint Mechanism | Residual Risk |
|---------|--------------------|---------------------|---------------|
| [Feature name] | [What contradiction or new problem does this feature create?] | [What constraint addresses it?] | [What remains unresolved?] |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Plan checker: 7 structural dimensions only | 7 structural + 4 semantic dimensions | Phase 43 | Catches tool/config/directory/signal reference errors before execution |
| Summary templates: no provenance fields | model + context_used_pct in frontmatter | Phase 43 | Enables model-quality and context-efficiency correlation |
| Reflection reports: no requirement linkage | Findings mapped to requirement IDs | Phase 43 | Closes signal -> reflection -> requirement traceability loop |
| Feature specs: tensions informal | Internal Tensions section in template | Phase 43 | Makes contradictions explicit and auditable |

**Key context:** The plan checker has been identified across three separate signal occurrences (phases 34, 35, 42) as having a structural capability gap. Phase 43 is the systematic response to this recurring pattern, addressing the four specific validation dimensions that were most commonly missed in manual reviews.

## Open Questions

### Resolved

- **Is TMPL-01 already satisfied?** Yes -- the current `requirements.md` template already includes `*Motivation:* [type]: [citation]` lines and a motivation types reference. The v1.17 REQUIREMENTS.md uses this extensively. TMPL-01 may only need verification that the template is correct, not new implementation.
- **Where does the tool allowlist live?** In the plan checker agent spec (`agents/gsd-plan-checker.md`), not in gsd-tools.js. The plan checker is an LLM agent that reads instructions.
- **Should findings be blocker or advisory?** Advisory, per PLAN-05. Plans describe future state; strict validation would false-reject valid plans.
- **How do typed finding IDs work?** Format: `[TYPE]-[NNN]` where TYPE is TOOL, CFG, DIR, or SIG. These IDs enable future correlation with execution signals (e.g., "the plan checker warned about TOOL-001 and then execution failed on the same invocation").

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Should the tool allowlist be automatically tested against gsd-tools.js source? | Low | Defer -- a wiring test could compare allowlist entries against actual case statements, but this is a nice-to-have for a future phase |
| How does the executor know its own model identifier for TMPL-02? | Medium | The executor agent should self-identify using its known model name; alternatively the orchestrator could pass it via init context |
| How does the executor estimate context_used_pct for TMPL-03? | Medium | Accept-risk -- this is inherently an estimate; the executor reports its best guess; no reliable programmatic way to query exact context usage |

### Still Open

- How will TMPL-04 (requirement linkage) interact with the existing reflection report frontmatter? The report already has a YAML header; the linkage section should be a body section, not frontmatter.

## Sources

### Primary (HIGH confidence)

- `agents/gsd-plan-checker.md` -- current plan checker spec with 7 existing dimensions
- `get-shit-done/bin/gsd-tools.js` -- verified all subcommand case statements for PLAN-01 allowlist
- `get-shit-done/feature-manifest.json` -- verified complete config schema for PLAN-02 validation
- `get-shit-done/templates/requirements.md` -- confirmed motivation field already present (TMPL-01)
- `get-shit-done/templates/summary-*.md` -- confirmed current frontmatter lacks model/context_used_pct
- `.planning/REQUIREMENTS.md` -- full requirement text for PLAN-01 through TMPL-05
- `get-shit-done/workflows/reflect.md` -- current reflection workflow for TMPL-04 integration point
- `agents/gsd-reflector.md` -- current reflector output format for TMPL-04

### Secondary (MEDIUM confidence)

- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-01-plan-checker-misses-tool-api-assumptions.md` -- motivating signal for PLAN-01
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-01-plan-checker-misses-second-order-effects.md` -- motivating signal for PLAN-02
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-06-phase42-plan-gaps-pre-execution-review.md` -- third occurrence of plan checker gap pattern
- `.planning/knowledge/signals/get-shit-done-reflect/sig-2026-03-02-requirements-lack-motivation-traceability.md` -- motivating signal for TMPL-01
- `.planning/research/FEATURES.md` -- original feature landscape analysis (TS-5, TS-6, D-4, D-5)

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-03-01-plan-checker-misses-tool-api-assumptions | signal | Plan 34-03 used `frontmatter extract` (nonexistent); plan checker missed it | Architecture Pattern 2 (PLAN-01 allowlist design) |
| sig-2026-03-01-plan-checker-misses-second-order-effects | signal | Plans referenced nonexistent config keys (spike_sensitivity vs spike.sensitivity) | Architecture Pattern 3 (PLAN-02 manifest validation) |
| sig-2026-03-06-phase42-plan-gaps-pre-execution-review | signal | Third occurrence of plan checker gap pattern across phases 34, 35, 42 | Summary (pattern recurrence justification) |
| sig-2026-03-02-requirements-lack-motivation-traceability | signal | Requirements had no formal linkage to motivating evidence | Pattern 6 (TMPL-01 already-satisfied finding) |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all artifacts are internal project files, fully inspected
- Architecture: HIGH -- patterns derived from existing plan checker structure and motivating signals
- Pitfalls: HIGH -- based on documented incidents (signals) and known project conventions (dual-directory)

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days -- internal tooling, stable domain)
