# Phase 9: Architecture Audit Report

**Date:** 2026-02-10
**Branch:** sync/v1.13-upstream
**Test Baseline:** Fork tests: 42 pass / 4 skip (e2e) | Upstream tests: 75 pass / 0 skip
**Overall Assessment:** ISSUES FOUND -- 16 items across 5 severity categories. Core architecture is sound; issues are identity cleanup, config compatibility, and conversion gaps.

---

## Summary Issue Table

| # | File | Issue Type | Severity | Description | Suggested Fix | Plan |
|---|------|-----------|----------|-------------|---------------|------|
| 1 | `get-shit-done/bin/gsd-tools.js` | Config compatibility | HIGH | `loadConfig()` returns hardcoded upstream fields only; fork fields (`health_check`, `devops`, `gsd_reflect_version`) silently dropped | Do NOT modify gsd-tools.js (merge friction). Document as known limitation. Fork workflows use direct JSON reads for fork fields. | 02 |
| 2 | `.github/CODEOWNERS` | Upstream identity | HIGH | References `@glittercowboy` (upstream maintainer) -- blocks fork PRs | Replace with `@loganrooks` | 02 |
| 3 | `SECURITY.md` | Upstream identity | HIGH | References `security@gsd.build` and `@glittercowboy` | Replace with fork contact info | 02 |
| 4 | `.github/FUNDING.yml` | Upstream identity | HIGH | References `github: glittercowboy` | Replace with `github: loganrooks` | 02 |
| 5 | `.github/ISSUE_TEMPLATE/bug_report.yml` | Upstream identity | HIGH | Version check says `npm list -g get-shit-done-cc` | Replace with `get-shit-done-reflect-cc` | 02 |
| 6 | `bin/install.js` | Upstream identity | MEDIUM | Discord link `discord.gg/5JJgD5svVS` at line 1546 | Replace with fork community link or GitHub Discussions URL | 02 |
| 7 | `commands/gsd/join-discord.md` | Upstream identity | MEDIUM | Entire command displays upstream Discord link | Replace content with fork community link, or remove command | 02 |
| 8 | `commands/gsd/new-project.md.bak` | Cleanup | MEDIUM | 1,041-line upstream backup file, no fork value | Delete | 02 |
| 9 | `commands/gsd/signal.md` | Architecture | MEDIUM | 235 lines inline logic, needs thin orchestrator conversion | Convert: stub + `workflows/signal.md` | 03 |
| 10 | `commands/gsd/upgrade-project.md` | Architecture | MEDIUM | 114 lines inline logic, needs thin orchestrator conversion | Convert: stub + `workflows/upgrade-project.md` | 03 |
| 11 | `commands/gsd/join-discord.md` | Architecture | LOW | 18 lines inline, but needs content replacement first (see #7) | Convert after content fix | 02 |
| 12 | `commands/gsd/debug.md` | Architecture note | LOW | 162 lines inline (upstream pattern, not fork issue) | Not a fork task -- upstream may convert later | N/A |
| 13 | `commands/gsd/research-phase.md` | Architecture note | LOW | 187 lines inline (upstream pattern, not fork issue) | Not a fork task -- upstream may convert later | N/A |
| 14 | `commands/gsd/reapply-patches.md` | Architecture note | LOW | 110 lines inline (upstream pattern, not fork issue) | Not a fork task -- upstream may convert later | N/A |
| 15 | Summary template references | Template migration | MEDIUM | 5 active source files reference `templates/summary.md` (to be retired) | Update references during template enrichment | 02 |
| 16 | `get-shit-done/bin/gsd-tools.js` | Template select | LOW | `template select --tasks N --files N` flag syntax does not work; requires plan-path positional arg | Use positional arg pattern: `template select <plan-path>` | N/A (document only) |

---

## 1. gsd-tools.js Verification

### What Passed

All 14 documented subcommands were exercised and produced correct output:

| Subcommand | Test Input | Exit Code | Result |
|-----------|-----------|-----------|--------|
| `state load --raw` | (project STATE.md) | 0 | Returns key=value pairs for upstream config fields |
| `resolve-model` | (no args -- needs agent-type) | 1 | Correct error: "agent-type required" |
| `find-phase 9` | Phase 9 | 0 | Found `09-architecture-adoption`, lists 3 plans, 0 summaries |
| `commit` | (no args) | 1 | Correct error: "commit message required" |
| `verify plan-structure` | 09-01-PLAN.md | 0 | Valid: 2 tasks, all have required sections |
| `verify phase-completeness` | Phase 9 | 0 | Correct: incomplete (0/3 summaries) |
| `verify references` | 09-01-PLAN.md | 0 | Found 7 valid refs, 9 missing (expected -- points to future files) |
| `frontmatter get` | 09-01-PLAN.md | 0 | Extracts all frontmatter fields including `must_haves` |
| `template select` | 09-01-PLAN.md (positional) | 0 | Returns `summary-standard` (0 tasks parsed from positional, 6 files) |
| `template fill summary` | --phase 9 | 0 | Creates pre-filled SUMMARY.md (note: writes to project dir) |
| `phase next-decimal` | Phase 9 | 0 | Returns `09.1` (no existing decimals) |
| `generate-slug` | "Architecture Adoption Phase" | 0 | Returns `architecture-adoption-phase` |
| `current-timestamp` | (none) | 0 | Returns ISO-8601 timestamp |
| `list-todos` | (none) | 0 | Returns `count: 0, todos: []` |
| `verify-path-exists` | .planning/STATE.md | 0 | Returns `exists: true, type: file` |
| `config-set` | test_field=test_value (temp dir) | 0 | Round-trip preserves ALL fields including fork custom fields |
| `config-ensure-section` | test_section (temp dir) | 0 | Returns `already_exists` for existing sections |
| `init execute-phase` | Phase 9 | 0 | Returns full phase context with model resolution |
| `init plan-phase` | Phase 9 | 0 | Returns researcher/planner/checker config + phase status |

**Key positive findings:**
- All subcommands exit cleanly (no crashes, no unhandled exceptions)
- JSON output is well-formed and parseable
- Phase discovery works correctly with fork's directory structure
- Plan structure validation catches all required sections
- `config-set` does full read-modify-write preserving ALL fields (fork fields survive)
- `config-ensure-section` correctly detects existing sections
- `init` commands return comprehensive phase context

### Issues Found

**Issue 1: `template select` flag syntax broken (LOW)**
Running `template select --tasks 3 --files 5` treats `--tasks` as a file path argument, producing an ENOENT error. The command requires a positional plan-path argument instead: `template select <plan-path>`. This is not a bug per se -- the documentation/research assumed flag-based input, but the actual API uses positional args. The error is non-blocking (it still returns a result) but misleading.

**Issue 2: `template fill` writes to project directory (INFO)**
Running `template fill summary --phase 9` creates a SUMMARY.md file in the project directory. This is by design (it scaffolds files), but needs care during read-only audits. Cleaned up during this audit.

### Config Compatibility

**Round-trip test results (conducted in isolated /tmp directory):**

1. Copied `.planning/config.json` to `/tmp/gsd-audit-config/.planning/config.json`
2. Ran `config-set test_field "test_value"`
3. Verified output JSON contains ALL original fields:
   - `health_check` section: PRESERVED (all 3 sub-fields intact)
   - `devops` section: PRESERVED (all 4 sub-fields intact)
   - `gsd_reflect_version`: PRESERVED ("1.12.2")
   - `test_field`: ADDED ("test_value")
   - All `workflow` sub-fields: PRESERVED

**`loadConfig()` field stripping (CONFIRMED):**

The `loadConfig()` function (lines 157-208 of gsd-tools.js) constructs a return object with only these hardcoded fields:
- `model_profile`, `commit_docs`, `search_gitignored`, `branching_strategy`
- `phase_branch_template`, `milestone_branch_template`
- `research`, `plan_checker`, `verifier`, `parallelization`, `brave_search`

Fork-specific fields NOT returned by `loadConfig()`:
- `health_check` (entire section)
- `devops` (entire section)
- `gsd_reflect_version`
- `mode`
- `depth`

**Impact:** Any code path using `loadConfig()` (called 15+ times across gsd-tools.js) will not see fork config. The `state load` command uses `loadConfig()` and therefore also strips fork fields.

**Recommendation:** Do NOT modify gsd-tools.js (creates merge friction). Fork workflows that need fork-specific config should read `.planning/config.json` directly via `jq` or `node -e "..."`.

### State Compatibility

`state load --raw` output:
```
model_profile=quality
commit_docs=true
branching_strategy=none
phase_branch_template=gsd/phase-{phase}-{slug}
milestone_branch_template=gsd/{milestone}-{slug}
parallelization=true
research=true
plan_checker=true
verifier=true
config_exists=true
roadmap_exists=true
state_exists=true
```

**Missing from output:** Fork's extended STATE.md sections (Performance Metrics, Quick Tasks, Roadmap Evolution) are not extracted by `state load`. The `state-snapshot` command (tested via upstream test suite) extracts basic fields, decisions, blockers, and session continuity -- but not fork-custom sections.

**Impact:** LOW. Fork workflows that need performance metrics or quick tasks can read STATE.md directly. The core state operations (position tracking, decisions, blockers) work correctly.

### Performance Baseline

All operations sub-60ms (median of 3 runs):

| Operation | Run 1 | Run 2 | Run 3 | Median |
|-----------|-------|-------|-------|--------|
| `find-phase 9` | 50ms | 47ms | 47ms | 47ms |
| `template select <plan>` | 46ms | 51ms | 47ms | 47ms |
| `state load --raw` | 50ms | 47ms | 47ms | 47ms |

Node.js cold start dominates these times (~40ms). The actual gsd-tools logic adds <10ms per operation. This is well within acceptable limits for CLI invocations during plan execution.

---

## 2. Thin Orchestrator Verification

### Structural Check Results

All 32 command files in `commands/gsd/` were analyzed for the thin orchestrator pattern:

| Category | Count | Files |
|----------|-------|-------|
| **Thin stub (proper)** | 22 | add-phase (39), add-todo (42), audit-milestone (42), check-todos (41), collect-signals (41), discuss-phase (86), execute-phase (42), health-check (46), help (22), insert-phase (33), list-phase-assumptions (50), map-codebase (71), new-milestone (51), new-project (43), pause-work (35), plan-milestone-gaps (40), plan-phase (44), progress (24), quick (38), remove-phase (32), set-profile (34), settings (36) |
| **Thin stub (larger)** | 4 | complete-milestone (136), resume-work (40), update (37), verify-work (39) |
| **Inline logic (upstream)** | 3 | debug (162), research-phase (187), reapply-patches (110) |
| **Inline logic (fork, needs conversion)** | 2 | signal (235), upgrade-project (114) |
| **Inline content (fork, needs replacement)** | 1 | join-discord (18) |

**Notes on "inline logic (upstream)" commands:**
- `debug.md` (162 lines) -- No `execution_context`, no workflow reference. Upstream pattern, not a fork issue.
- `research-phase.md` (187 lines) -- No `execution_context`, but spawns `gsd-phase-researcher` agent directly. Has a corresponding `workflows/research-phase.md` but does not delegate to it.
- `reapply-patches.md` (110 lines) -- No `execution_context`, inline LLM-guided patch restoration logic. New upstream command from v1.18.0.

These 3 upstream-inline commands are NOT fork issues. If upstream converts them in a future release, the fork picks up the change automatically.

### Conversion Assessment

#### signal.md (235 lines) -- MEDIUM-HIGH complexity

**Current structure:**
- Frontmatter: 12 lines (name, description, argument-hint, allowed-tools)
- Objective: 5 lines
- Context: 7 lines (3 `@` references)
- Process: 10 steps of inline logic (215 lines)
- Design notes: 6 lines

**Thin stub would be (~25 lines):**
```markdown
---
name: gsd:signal
description: Log a manual signal observation to the knowledge base
argument-hint: '"description" [--severity critical|notable]'
allowed-tools: [Read, Write, Bash, Glob, Grep, AskUserQuestion]
---
<objective>
Create a manual signal entry in the knowledge base.
</objective>
<execution_context>
@~/.claude/get-shit-done/workflows/signal.md
@~/.claude/agents/knowledge-store.md
@~/.claude/get-shit-done/references/signal-detection.md
@~/.claude/agents/kb-templates/signal.md
</execution_context>
<process>
Execute the signal workflow from @~/.claude/get-shit-done/workflows/signal.md end-to-end.
</process>
```

**Workflow file would be (~230 lines):**
All 10 steps move to `workflows/signal.md`. The `@` context references move to `<execution_context>` in the stub.

**Tricky parts:**
- Step 5 (deduplication) reads KB index -- workflow needs `@knowledge-store.md` reference
- Step 6 (per-phase cap) modifies existing signal files -- needs Write permission
- Step 8 (index rebuild) calls `kb-rebuild-index.sh` -- needs Bash permission
- Step 9 (git commit) checks `commit_planning_docs` config -- can use `gsd-tools.js commit` instead

#### upgrade-project.md (114 lines) -- MEDIUM complexity

**Current structure:**
- Frontmatter: 12 lines
- Objective: 4 lines
- Execution context: 3 lines (2 `@` references)
- Context: 3 lines
- Process: 7 steps of inline logic (90 lines)

**Thin stub would be (~20 lines):**
```markdown
---
name: gsd:upgrade-project
description: Migrate project to current GSD Reflect version
argument-hint: "[--auto]"
allowed-tools: [Read, Write, Bash, Glob, Grep, AskUserQuestion]
---
<objective>
Migrate project configuration to match installed GSD Reflect version.
</objective>
<execution_context>
@~/.claude/get-shit-done/workflows/upgrade-project.md
@~/.claude/get-shit-done/references/version-migration.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>
<process>
Execute the upgrade workflow from @~/.claude/get-shit-done/workflows/upgrade-project.md.
</process>
```

**Workflow file would be (~100 lines):**
All 7 steps move to `workflows/upgrade-project.md`.

**Tricky parts:**
- Step 1 (version detection) reads VERSION file from either local or global install path
- Step 5 (config patching) must preserve ALL existing fields (uses direct JSON read-modify-write, not `loadConfig()`)
- Step 6 (migration log) creates/appends to `.planning/migration-log.md`

#### join-discord.md (18 lines) -- LOW complexity

**Current state:** Pure static content displaying upstream Discord link.

**Recommended approach:** Replace content with fork community link (GitHub Discussions or fork Discord if one exists). The command is simple enough to stay inline (18 lines). No workflow conversion needed.

**Alternative:** Remove the command entirely if the fork has no community channel.

---

## 3. Workflow File Verification

### Automated Scan Results

All 34 workflow files scanned for upstream-specific references:

| Pattern | Source File Hits | Details |
|---------|-----------------|---------|
| `get-shit-done-cc` (not -reflect) | **0** | Clean across all workflow files |
| `glittercowboy` | **0** | Clean across all workflow files |
| `discord.gg` | **0** | Clean across all workflow files |
| `gsd.build` | **0** | Clean across all workflow files |

**All 34 workflow files are clean of upstream-specific references.**

### Manual Review Findings

**Fork-only workflows (6 files) -- all follow conventions:**
- `collect-signals.md` (200 lines) -- Follows upstream patterns, has raw `git add`/`git commit` (see commit migration section)
- `discovery-phase.md` -- Clean, follows conventions
- `health-check.md` (211 lines) -- Contains KB reference (`gsd-knowledge`), properly wired
- `list-phase-assumptions.md` -- Clean, follows conventions
- `reflect.md` (440 lines) -- Contains KB references (`gsd-knowledge`), raw `git add`/`git commit`, properly wired
- `run-spike.md` -- Clean, follows conventions

**Upstream-origin workflows (28 files) -- no fork customization needed:**
The 28 upstream workflow files contain no upstream-specific identifiers. They use generic patterns (`gsd-tools.js`, relative paths, project-agnostic logic) that work identically for the fork.

### Fork Customization Opportunities

No upstream workflow files need fork customization at this time. The fork's identity layers (branding, KB integration, DevOps detection) are already handled in:
- Fork-only workflow files (6 files)
- Fork-specific agent files (`.claude/agents/`)
- Fork-modified command stubs (Phase 8 conversions)

---

## 4. Agent Spec Review

### Per-Spec Findings

9 agent specs were modified by the upstream merge (60% reduction in size). The fork's pre-merge agents directory was checked for fork-specific additions.

**Critical finding:** The fork did NOT add fork-specific instructions to any repo-level agent spec in `agents/`. All fork agent customizations live in `.claude/agents/` (separate directory, unaffected by merge). The commits in the fork's history touching `agents/` are all upstream-origin commits that landed on the fork branch.

| Agent Spec | Lines Removed | Lines Now | Fork Content Lost | Assessment |
|-----------|--------------|-----------|-------------------|------------|
| `gsd-executor.md` | -537 | 403 | None | SAFE -- upstream condensed; fork executor customizations in `.claude/agents/` |
| `gsd-planner.md` | -473 | 1,157 | None | SAFE -- upstream condensed |
| `gsd-verifier.md` | -375 | 523 | None | SAFE -- upstream condensed |
| `gsd-project-researcher.md` | -343 | 618 | None | SAFE -- upstream condensed |
| `gsd-plan-checker.md` | -271 | 622 | None | SAFE -- upstream condensed |
| `gsd-phase-researcher.md` | -260 | 469 | None | SAFE -- upstream condensed |
| `gsd-debugger.md` | -14 | 1,198 | None | SAFE -- minimal change |
| `gsd-research-synthesizer.md` | -22 | 236 | None | SAFE -- minor trim |
| `gsd-codebase-mapper.md` | +26/-3 | 761 | None | SAFE -- upstream ADDED content |
| `gsd-integration-checker.md` | 0 | 423 | N/A | UNCHANGED |
| `gsd-roadmapper.md` | 0 | 605 | N/A | UNCHANGED |

**Conclusion:** Zero fork content was lost in agent spec merges. The fork's architecture of placing KB agents in `.claude/agents/` (outside the merge path) proved effective.

---

## 5. Knowledge Base Wiring

### Integration Points Verified

All KB integration points were audited across the codebase:

| Integration Point | File(s) | Status |
|------------------|---------|--------|
| KB directory `~/.claude/gsd-knowledge/` | workflows/collect-signals.md, workflows/reflect.md, workflows/health-check.md, references/knowledge-surfacing.md, references/spike-execution.md, tests/e2e/real-agent.test.js | INTACT |
| Signal path `gsd-knowledge/signals/` | workflows/collect-signals.md (line 190), tests/e2e/real-agent.test.js (line 136) | INTACT |
| Lesson path `gsd-knowledge/lessons/` | workflows/reflect.md (line 405) | INTACT |
| Index path `gsd-knowledge/index.md` | workflows/collect-signals.md (line 194), workflows/reflect.md (lines 405-409), references/knowledge-surfacing.md (lines 39, 62) | INTACT |
| Signal collector agent | workflows/collect-signals.md (line 127: `subagent_type="gsd-signal-collector"`) | INTACT |
| Reflector agent | workflows/reflect.md (references `gsd-reflector`) | INTACT |
| Knowledge surfacing reference | references/knowledge-surfacing.md (257 lines) | INTACT |
| Spike execution reference | references/spike-execution.md | INTACT |

### Issues Found

**None.** All KB wiring is intact post-merge. The KB system lives entirely in fork-only files (workflows, references, agents, tests) that were not touched by the upstream merge.

---

## 6. Reference Files

### Compatibility Check

All 4 new upstream reference files verified for fork compatibility:

| File | Lines | Upstream Refs | Fork Config Conflicts | Assessment |
|------|-------|--------------|----------------------|------------|
| `decimal-phase-calculation.md` | -- | 0 | None | COMPATIBLE |
| `git-planning-commit.md` | -- | 0 | None | COMPATIBLE |
| `model-profile-resolution.md` | -- | 0 | None | COMPATIBLE |
| `phase-argument-parsing.md` | -- | 0 | None | COMPATIBLE |

All 4 files use generic patterns (relative paths, `gsd-tools.js` commands, project-agnostic logic). No upstream package names, URLs, or maintainer references found. No assumptions that conflict with the fork's configuration or directory structure.

---

## 7. Summary Templates

### Current State

| Template | Source | Lines | Purpose |
|----------|--------|-------|---------|
| `summary.md` | Fork (standalone) | Rich | Fork's original template with detailed frontmatter, deviation format |
| `summary-minimal.md` | Upstream (new) | Lean | For small plans (<=2 tasks, <=3 files, no decisions) |
| `summary-standard.md` | Upstream (new) | Medium | Default tier for most plans |
| `summary-complex.md` | Upstream (new) | Full | For plans with decisions, many files, or many tasks |

**Template selection logic** (`gsd-tools.js` lines ~1530-1567):
```
if (taskCount <= 2 && fileCount <= 3 && !hasDecisions) -> minimal
elif (hasDecisions || fileCount > 6 || taskCount > 5) -> complex
else -> standard
```

**Active references to `templates/summary.md`** (the fork's standalone template, to be retired):

| File | Type | Reference Style |
|------|------|----------------|
| `get-shit-done/templates/phase-prompt.md` | Template | `@~/.claude/get-shit-done/templates/summary.md` (2 occurrences) |
| `agents/gsd-planner.md` | Agent spec | `@~/.claude/get-shit-done/templates/summary.md` |
| `agents/gsd-executor.md` | Agent spec | `@~/.claude/get-shit-done/templates/summary.md` |
| `get-shit-done/workflows/execute-phase.md` | Workflow | `@~/.claude/get-shit-done/templates/summary.md` |
| `get-shit-done/workflows/execute-plan.md` | Workflow | `~/.claude/get-shit-done/templates/summary.md` |

**Plus 30+ references in `.planning/` (historical plan files) -- these do NOT need updating.**

### Enrichment Plan

The 3 upstream tiers need these fork additions before the standalone template can be retired:

- **All tiers:** Add `requires`/`patterns-established` frontmatter fields for dependency scanning
- **Standard + Complex:** Add "User Setup Required" section
- **Complex:** Add the fork's detailed deviation auto-fix format (structured per-fix records)

After enrichment, update the 5 active source references above, then `git rm` the standalone template.

---

## 8. Upstream Artifact Cleanup

### Fork Identity Sweep Results

**Source files with upstream-specific references (excluding `.planning/`):**

| File | Line(s) | Reference | Severity | Action |
|------|---------|-----------|----------|--------|
| `.github/CODEOWNERS` | 2 | `@glittercowboy` | HIGH | Replace with `@loganrooks` |
| `.github/FUNDING.yml` | 1 | `github: glittercowboy` | HIGH | Replace with `github: loganrooks` |
| `SECURITY.md` | 7 | `security@gsd.build`, `@glittercowboy` | HIGH | Replace with fork contact |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | 14 | `get-shit-done-cc` | HIGH | Replace with `get-shit-done-reflect-cc` |
| `bin/install.js` | 1546 | `discord.gg/5JJgD5svVS` | MEDIUM | Replace with fork community link |
| `commands/gsd/join-discord.md` | 15 | `discord.gg/5JJgD5svVS` | MEDIUM | Replace content or remove command |
| `README.md` | 7, 27, 155, 194 | `glittercowboy` (upstream credit) | NONE | Intentional -- proper attribution |
| `CHANGELOG.md` | 5, 91 | `glittercowboy` (upstream credit) | NONE | Intentional -- proper attribution |

**Note:** README.md and CHANGELOG.md references to `glittercowboy` are intentional upstream attribution and should NOT be changed.

### Broken Reference Check

Grep for references to deleted files (`CONTRIBUTING.md`, `GSD-STYLE.md`, `MAINTAINERS.md`) in source files (excluding `.planning/`):

**Result: ZERO hits in source files.** All references are in `.planning/` documentation only (historical research notes). No runtime code references these deleted files.

### Files to Delete/Modify

| File | Action | Reason |
|------|--------|--------|
| `commands/gsd/new-project.md.bak` | DELETE | 1,041-line upstream backup of old inline command; thin stub replacement exists |
| `assets/gsd-logo-2000-transparent.png` | FLAG | Upstream logo; fork logo needed (Phase 12 or quick task) |
| `assets/gsd-logo-2000-transparent.svg` | FLAG | Upstream logo; fork logo needed (Phase 12 or quick task) |

---

## 9. Fork Surface Area

### gsd-tools.js Dependency Map

| Function/Section | What It Does | Fork Dependency | Merge Friction Risk |
|-----------------|-------------|-----------------|---------------------|
| `loadConfig()` | Returns upstream config fields only | CRITICAL -- called 15+ times, but drops fork fields | HIGH if modified, NONE if left alone |
| `cmdConfigSet()` | Full read-modify-write of config.json | CRITICAL -- preserves fork fields correctly | LOW (no modification needed) |
| `cmdConfigEnsureSection()` | Adds section if missing | MODERATE -- used for initializing new sections | LOW |
| `cmdCommit()` | Git commit with config-aware behavior | CRITICAL -- should replace raw git in fork workflows | LOW |
| `cmdStateLoad()` | Reads STATE.md + config, outputs key=value | MODERATE -- fork uses for upstream fields; direct reads for fork fields | LOW |
| `cmdFindPhase()` | Locates phase directory by number | CRITICAL -- all phase operations depend on this | LOW |
| `cmdTemplateSelect()` | Selects summary template tier | MODERATE -- fork will use after template enrichment | LOW |
| `cmdTemplateFill()` | Scaffolds summary from template | MODERATE -- fork will use after template enrichment | LOW |
| `cmdFrontmatterGet()` | Extracts YAML frontmatter from plan files | MODERATE -- used by plan verification | LOW |
| `cmdPhaseNextDecimal()` | Calculates next decimal phase number | LOW -- fork uses same numbering scheme | LOW |
| `cmdVerify*()` | Plan structure, phase completeness, references | MODERATE -- verification operations | LOW |
| `cmdInit*()` | Bootstraps agent context for phase/plan | CRITICAL -- executor and planner depend on this | LOW |
| `cmdGenerateSlug()` | Converts title to kebab-case slug | LOW -- utility function | LOW |
| `cmdCurrentTimestamp()` | Returns ISO-8601 timestamp | LOW -- utility function | LOW |

**Summary:** The fork depends critically on `config-set`, `commit`, `find-phase`, and `init` commands. The `loadConfig()` field-stripping is the only friction point, and the recommended approach (do not modify, use direct JSON reads for fork fields) eliminates merge risk entirely.

### Extension Recommendation

**Recommended approach: Separate `fork-tools.js` file (do NOT modify gsd-tools.js)**

Rationale:
- gsd-tools.js is 4,597 lines of upstream code; any modification creates merge conflicts on every sync
- Fork-specific operations (KB queries, signal management, health-check state, fork config reads) can live in a separate `get-shit-done/bin/fork-tools.js`
- `fork-tools.js` can import/wrap gsd-tools functions if needed, or operate independently
- Zero merge friction for future upstream syncs

**However:** This is an assessment, not an implementation task. Creation of `fork-tools.js` belongs in Phase 10 (Features) or later, after the immediate Phase 9 fixes are complete. For now, fork workflows can use direct JSON reads for fork-specific config.

### Commit Migration Opportunities

Workflow files using raw `git add`/`git commit` that could use `gsd-tools.js commit` instead:

| File | Lines | Current Pattern | Migration Notes |
|------|-------|-----------------|-----------------|
| `workflows/collect-signals.md` | 191-195 | `git add` + `git commit` for signal files | KB files are outside project dir; `gsd-tools commit` may not apply |
| `workflows/reflect.md` | 406-410 | `git add` + `git commit` for lesson files | Same -- KB files are in `~/.claude/gsd-knowledge/` |
| `workflows/complete-milestone.md` | 483-489 | `git commit` for milestone branch | Upstream workflow; leave for upstream to migrate |

**Assessment:** The 2 fork workflows (`collect-signals.md`, `reflect.md`) use raw git for KB files that live outside the project directory (`~/.claude/gsd-knowledge/`). Since `gsd-tools.js commit` is designed for project-scoped commits (`.planning/`), these raw git patterns are appropriate. No migration needed.

---

## 10. Success Criteria Reconciliation

The roadmap defined 4 success criteria for Phase 9 (ARCH-01 through ARCH-04). Here is the reconciliation against actual state:

| Criterion | Roadmap Statement | Actual State | Reconciliation |
|-----------|------------------|--------------|----------------|
| ARCH-01 | `gsd-tools.js --help` shows available commands | Running with no args shows usage and 14 commands. `--help` flag is treated as unknown command (exits with error). | **PARTIAL PASS.** Change criterion to: "running `gsd-tools.js` with no arguments shows usage and lists available commands" |
| ARCH-02 | `config get .planning/config.json depth` reads fork config | No `config get` subcommand exists. `config-set` round-trips fork fields correctly. `state load` returns upstream fields only. | **PARTIAL PASS.** Change criterion to: "`config-set` preserves fork custom fields on round-trip; fork config readable via direct JSON reads" |
| ARCH-03 | Fork command logic migrated to workflow files, delegating via thin stubs | 3 converted in Phase 8 (help, new-project, update). 2 fork-only commands need conversion (signal, upgrade-project). join-discord needs content replacement. | **IN PROGRESS.** Plan 03 handles signal.md and upgrade-project.md conversion. |
| ARCH-04 | 19 new workflow files present and functional | 28 upstream-origin + 6 fork-only = 34 total workflow files present. 18 were net-new from the merge (research counted 19, actual is 18 because one was a modification). | **PASS with count correction.** Update to: "34 total workflow files present (28 upstream, 6 fork-only); 18 net-new from merge" |

---

## Appendix A: esbuild Pipeline Verification

| Hook | Bundle Result | Size | Time |
|------|-------------|------|------|
| `hooks/gsd-check-update.js` | SUCCESS | 1.7kb | 2ms |
| `hooks/gsd-statusline.js` | SUCCESS | 2.6kb | 1ms |

esbuild version: 0.24.2. Both fork hooks bundle successfully with `--platform=node --external:node:*`. No warnings or errors.

## Appendix B: Test Baseline Detail

### Fork Tests (vitest)
```
Test Files  4 passed | 1 skipped (5)
     Tests  42 passed | 4 skipped (46)
  Duration  1.03s

Breakdown:
  tests/unit/install.test.js         8 tests   18ms
  tests/integration/kb-write.test.js 7 tests   18ms
  tests/integration/wiring-validation.test.js  13 tests  54ms
  tests/integration/kb-infrastructure.test.js  14 tests  753ms
  tests/e2e/real-agent.test.js       4 skipped (require API keys)
```

### Upstream Tests (gsd-tools.test.js)
```
Suites: 18
Tests:  75 pass, 0 fail
Duration: 3.49s

Suite breakdown:
  history-digest (6), phases list (6), roadmap get-phase (5),
  phase next-decimal (5), phase-plan-index (6), state-snapshot (6),
  summary-extract (5), init commands (7), roadmap analyze (3),
  phase add (2), phase insert (3), phase remove (4),
  phase complete (2), milestone complete (2),
  validate consistency (3), progress (3),
  todo complete (2), scaffold (5)
```

## Appendix C: Commands Without Workflow Files

These commands have no corresponding workflow file. Some are inline by design (upstream pattern), others need conversion:

| Command | Lines | Has Workflow? | Category |
|---------|-------|--------------|----------|
| `debug.md` | 162 | No | Upstream inline (not fork issue) |
| `research-phase.md` | 187 | Has `workflows/research-phase.md` but does not delegate to it | Upstream pattern mismatch |
| `reapply-patches.md` | 110 | No | Upstream inline (new in v1.18.0) |
| `signal.md` | 235 | No | Fork -- needs conversion (Plan 03) |
| `upgrade-project.md` | 114 | No | Fork -- needs conversion (Plan 03) |
| `join-discord.md` | 18 | No | Fork -- needs content replacement (Plan 02) |

---

*Generated: 2026-02-10*
*Phase: 09-architecture-adoption*
*Plan: 09-01 (Architecture Audit)*
