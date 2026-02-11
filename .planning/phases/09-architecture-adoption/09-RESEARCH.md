# Phase 9: Architecture Adoption & Verification - Research

**Researched:** 2026-02-10
**Domain:** Post-merge architecture verification, fork customization, CLI tooling adoption
**Confidence:** HIGH (all findings verified against actual codebase state)

## Summary

Phase 9 verifies that upstream's architectural additions (gsd-tools CLI, thin orchestrator pattern, condensed agent specs, workflow files, reference files, summary templates) function correctly with the fork's configuration and features, then fixes everything found. The research established a clean test baseline (42 fork tests + 75 gsd-tools tests all passing), inventoried every file that needs attention, identified critical compatibility gaps in gsd-tools.js config handling, and mapped all upstream references remaining in source files.

The codebase is in good shape post-merge. The most significant findings are: (1) gsd-tools.js `loadConfig()` strips fork-specific config fields, (2) two roadmap success criteria reference gsd-tools subcommands that don't exist (`--help` flag and `config get`), (3) three fork-only commands need thin orchestrator conversion, and (4) six upstream community/governance files contain upstream-specific references needing fork replacement.

**Primary recommendation:** Lead with a comprehensive automated + manual audit, produce a findings report, then execute fixes in a subsequent plan within Phase 9. The audit scope is well-defined and manageable.

## Standard Stack

This phase is a codebase audit and fix cycle, not a library-integration phase. No new libraries are needed.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `node` | >=18 | Runtime for gsd-tools.js | Already the project runtime |
| `vitest` | 3.2.4 | Fork test suite | Already installed and configured |
| `node:test` | built-in | gsd-tools test suite | Used by upstream tests |
| `grep`/`rg` | system | Automated codebase scanning | Best tool for pattern-matching audits |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `gsd-tools.js` | CLI operations (commit, state, config, template, verify) | All operations it supports |
| `jq` | Parse gsd-tools JSON output | When extracting values from `--raw` output |

## Architecture Patterns

### Current Project Structure (Post-Merge)
```
commands/gsd/           # Command stubs (thin orchestrator pattern)
  ├── help.md           # Thin stub → workflows/help.md (CONVERTED in Phase 8)
  ├── new-project.md    # Thin stub → workflows/new-project.md (CONVERTED in Phase 8)
  ├── update.md         # Thin stub → workflows/update.md (CONVERTED in Phase 8)
  ├── signal.md         # FULL INLINE LOGIC (8.5k) — needs conversion
  ├── upgrade-project.md # FULL INLINE LOGIC (4.3k) — needs conversion
  ├── join-discord.md   # Inline (396 bytes) — needs fork replacement
  ├── [15 upstream thin stubs]  # Auto-merged, already delegate to workflows
  └── [6 fork thin stubs]      # Already delegate to fork workflows

get-shit-done/
  ├── bin/
  │   ├── gsd-tools.js        # 4,597 lines — centralized CLI utility
  │   └── gsd-tools.test.js   # 2,033 lines — 75 tests (Node.js built-in test runner)
  ├── workflows/               # 34 total (28 upstream, 6 fork-only)
  ├── references/              # 22 total (4 new from upstream)
  └── templates/               # 24 total (3 new summary variants from upstream)

agents/                 # 11 upstream agent specs (9 modified by merge)
.claude/agents/         # Fork-specific agents (reflector, signal-collector, spike-runner, etc.)
```

### Pattern 1: Thin Orchestrator Stub
**What:** Commands are minimal stubs (~20-40 lines) that delegate all logic to workflow files.
**When to use:** All commands, both upstream and fork-exclusive.
**Example (from commands/gsd/help.md — already converted in Phase 8):**
```markdown
---
name: gsd:help
description: Show available GSD commands and usage guide
---
<objective>
Display the complete GSD command reference.
</objective>
<execution_context>
@~/.claude/get-shit-done/workflows/help.md
</execution_context>
<process>
Output the complete GSD command reference from @~/.claude/get-shit-done/workflows/help.md.
</process>
```

### Pattern 2: gsd-tools.js for Deterministic Operations
**What:** Use `node gsd-tools.js <command>` instead of inline bash for config reading, state updates, commits, phase lookups.
**When to use:** Any operation that gsd-tools already supports (config, state, commit, template, verify, find-phase, etc.)
**Example (from agents/gsd-executor.md):**
```bash
INIT=$(node ~/.claude/get-shit-done/bin/gsd-tools.js init execute-phase "${PHASE}")
```

### Pattern 3: Summary Template Selection
**What:** gsd-tools.js auto-selects summary template tier based on plan complexity.
**Selection logic (from gsd-tools.js lines 1530-1567):**
```
if (taskCount <= 2 && fileCount <= 3 && !hasDecisions) → minimal
elif (hasDecisions || fileCount > 6 || taskCount > 5)  → complex
else → standard
```
**When to use:** Every plan summary creation.

### Anti-Patterns to Avoid
- **Modifying gsd-tools.js directly for fork features:** Creates merge conflicts on every upstream sync. Use a separate fork-tools.js or wrapper instead.
- **Blanket identity treatment across all files:** Not every workflow file needs every fork identity layer. Judge per-file relevance.
- **Testing with live project data:** All gsd-tools testing must use isolated temp fixtures (the upstream tests already do this correctly with `createTempProject()`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config reading | Manual JSON parsing | `gsd-tools.js config-set` / `state load` | Handles nested paths, type coercion, defaults |
| Planning commits | Raw `git add` + `git commit` | `gsd-tools.js commit` | Auto-checks commit_docs config, gitignore status |
| Phase directory lookup | Manual glob + regex | `gsd-tools.js find-phase` | Handles zero-padding, decimals, returns structured JSON |
| Summary template selection | Manual if/else | `gsd-tools.js template select` | Consistent heuristics across all plans |
| Frontmatter extraction | Manual YAML parsing | `gsd-tools.js frontmatter get` | Handles edge cases, validates schemas |
| Phase numbering | Manual arithmetic | `gsd-tools.js phase next-decimal` | Handles gaps, existing decimals |

**Key insight:** gsd-tools.js replaces ~50 inline bash patterns. Every workflow and agent should use it where applicable rather than reimplementing the logic.

## Common Pitfalls

### Pitfall 1: gsd-tools loadConfig() Drops Fork Fields
**What goes wrong:** `loadConfig()` in gsd-tools.js returns a normalized object with only upstream-known fields: `model_profile`, `commit_docs`, `search_gitignored`, `branching_strategy`, `phase_branch_template`, `milestone_branch_template`, `research`, `plan_checker`, `verifier`, `parallelization`, `brave_search`. Fork-specific fields (`health_check`, `devops`, `gsd_reflect_version`) are silently dropped.
**Why it happens:** `loadConfig()` constructs a return object by extracting specific known keys, not by passing through the raw JSON.
**How to avoid:** The `config-set` command does a full read-modify-write preserving all fields. Direct JSON reads also work. The issue is only in `loadConfig()` and `state load --raw` output. For Phase 9 audit, document this gap. For fix, decide whether to modify gsd-tools.js (risk: merge friction) or document it as a known limitation and use direct JSON reads for fork fields.
**Warning signs:** Any workflow/agent reading fork config via `gsd-tools.js state load` will not see fork-specific fields.

### Pitfall 2: Success Criteria Reference Non-Existent gsd-tools Commands
**What goes wrong:** Roadmap success criteria #1 says `gsd-tools.js --help` should work — but gsd-tools.js treats `--help` as an unknown command and exits with an error. Success criteria #2 says `config get .planning/config.json depth` — but there is no `config get` subcommand.
**Why it happens:** Success criteria were written during pre-merge research based on anticipated features, not actual implementation.
**How to avoid:** The audit must reconcile success criteria against actual gsd-tools.js capabilities. Document what actually works and update the criteria.
**Warning signs:** Any plan task that literally executes `gsd-tools.js --help` or `gsd-tools.js config get` will fail.

### Pitfall 3: File Count Mismatch
**What goes wrong:** Roadmap says "19 new workflow files" but the merge report counts 18 in its table (counting the 3 already-existing ones differently). Actual total workflow files is 34 (28 from upstream, 6 fork-only).
**Why it happens:** Different counts at different stages: research estimated 19, merge found 18 new (some were modifications of existing files, not new).
**How to avoid:** The audit must count actual files and reconcile against the roadmap's ARCH-04 requirement.

### Pitfall 4: Upstream References in Unexpected Places
**What goes wrong:** Upstream-specific references hide in files that weren't part of conflict resolution.
**Where they remain (verified by grep):**
1. `commands/gsd/join-discord.md:15` — `https://discord.gg/5JJgD5svVS` (upstream Discord)
2. `bin/install.js:1546` — `https://discord.gg/5JJgD5svVS` (upstream Discord)
3. `.github/ISSUE_TEMPLATE/bug_report.yml:14` — `get-shit-done-cc` (upstream package name)
4. `.github/CODEOWNERS:2` — `@glittercowboy` (upstream maintainer)
5. `.github/FUNDING.yml:1` — `github: glittercowboy` (upstream funding)
6. `SECURITY.md:7` — `security@gsd.build`, `@glittercowboy` (upstream contact)
7. `commands/gsd/new-project.md.bak` — entire file is upstream's old backup (delete)
**How to avoid:** The automated scan portion of the audit should grep all source files (not just .planning/) for these patterns.

### Pitfall 5: Agent Spec Fork Feature Loss
**What goes wrong:** Upstream condensed 9 agent specs (60% reduction). If the fork had added fork-specific instructions in sections that upstream simplified, those instructions may have been lost during auto-merge.
**Why it happens:** Git auto-merge favors upstream changes when the fork hasn't modified the same region.
**How to avoid:** Manual review of all 9 auto-merged agent specs (gsd-executor, gsd-planner, gsd-debugger, gsd-verifier, gsd-codebase-mapper, gsd-phase-researcher, gsd-plan-checker, gsd-project-researcher, gsd-research-synthesizer). Check whether fork-specific instructions existed before the merge (the fork's agent customizations are primarily in `~/.claude/agents/`, which is separate, but some may have been in the repo's `agents/` directory).
**Warning signs:** Agent behavior that worked before the merge stops working because fork instructions were lost.

### Pitfall 6: Fork Summary Template Retirement Breaks References
**What goes wrong:** Retiring `get-shit-done/templates/summary.md` (the fork's standalone template) could break `@-references` in workflow files or agent specs that point to it.
**How to avoid:** Before retiring, grep for all references to `templates/summary.md` and update them to use the new 3-tier template system (or `template select` / `template fill` commands).

## Code Examples

### Automated Scan for Upstream References
```bash
# Scan all source files for upstream-specific references
# Exclude .planning/ (docs), node_modules/, .git/
grep -rn "get-shit-done-cc\|glittercowboy\|discord\.gg\|gsd\.build" \
  --include="*.md" --include="*.js" --include="*.yml" --include="*.json" \
  --exclude-dir=.planning --exclude-dir=node_modules --exclude-dir=.git \
  .
```

### Test Baseline Verification
```bash
# Fork tests (vitest)
npx vitest run
# Expected: 42 passed, 4 skipped (e2e), ~1s

# gsd-tools tests (Node.js built-in test runner)
node --test get-shit-done/bin/gsd-tools.test.js
# Expected: 75 pass, 0 fail, ~3.5s
```

### gsd-tools Config Compatibility Test
```bash
# Test config-set preserves fork fields (round-trip)
node get-shit-done/bin/gsd-tools.js config-set test_field "test_value"
cat .planning/config.json | jq '.health_check, .devops, .gsd_reflect_version, .test_field'
# Should show all four fields (including fork-specific ones)

# Test state load (will NOT include fork fields — known gap)
node get-shit-done/bin/gsd-tools.js state load --raw
# health_check, devops, gsd_reflect_version will be absent
```

### Thin Orchestrator Stub Pattern (for fork command conversion)
```markdown
---
name: gsd:signal
description: Log a manual signal observation to the knowledge base
argument-hint: '"description" [--severity critical|notable]'
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
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

### Summary Template Enrichment Pattern (for fork additions)
```markdown
# In summary-complex.md, add to frontmatter:
requires:
  - phase: [prior phase]
    provides: [what that phase built]
patterns-established:
  - "Pattern 1: description"

# Add after "Deviations from Plan" section:
## Deviations from Plan (Auto-fixed)
**1. [Rule X - Category] Brief description**
- **Found during:** Task [N] ([task name])
- **Issue:** [What was wrong]
- **Fix:** [What was done]
- **Verification:** [How it was verified]
- **Committed in:** [hash]

# Add to standard + complex:
## User Setup Required
[If USER-SETUP.md was generated:]
**External services require manual configuration.**
```

## State of the Art

| Area | Pre-Merge State | Post-Merge State | Impact |
|------|----------------|------------------|--------|
| Command pattern | Mix of inline logic and workflow delegation | Upstream thin orchestrator pattern is standard | Fork commands should follow same pattern |
| CLI tooling | No centralized CLI | gsd-tools.js (4,597 lines, 30+ subcommands) | Replaces ~50 inline bash patterns |
| Config handling | Direct JSON reads | gsd-tools.js `config-set`, `state load`, `config-ensure-section` | But `loadConfig()` drops fork fields |
| Summary templates | Single rich template | 3-tier adaptive (minimal/standard/complex) + selection logic | Fork's richer template retires; tiers get enriched |
| Agent specs | Fork-customized versions | Upstream condensed (60% smaller) | Need review for fork feature preservation |
| Commit protocol | Raw git operations | `gsd-tools.js commit` with auto-config-check | All workflows should migrate |

## Detailed Inventory

### Workflow File Inventory (34 total)

**Upstream-origin workflow files (28):**
add-phase, add-todo, audit-milestone, check-todos, complete-milestone, diagnose-issues, discuss-phase, execute-phase, execute-plan, help, insert-phase, map-codebase, new-milestone, new-project, pause-work, plan-milestone-gaps, plan-phase, progress, quick, remove-phase, research-phase, resume-project, set-profile, settings, transition, update, verify-phase, verify-work

**Fork-only workflow files (6):**
collect-signals, discovery-phase, health-check, list-phase-assumptions, reflect, run-spike

### Reference File Inventory (22 total)

**New from upstream (4):** decimal-phase-calculation, git-planning-commit, model-profile-resolution, phase-argument-parsing
**All reference files clean of upstream-specific references:** Verified by grep

### Summary Template Inventory (4 total)

**New from upstream (3):** summary-minimal.md, summary-standard.md, summary-complex.md
**Fork standalone (1, to be retired):** summary.md

### Commands Needing Thin Orchestrator Conversion (3)

| Command | Current Size | Has Workflow? | Conversion Complexity |
|---------|-------------|---------------|----------------------|
| `signal.md` | 8.5k (236 lines) | No | HIGH — 10 steps of inline logic, KB integration, dedup, cap checks |
| `upgrade-project.md` | 4.3k (115 lines) | No | MEDIUM — version detection, config patching, migration logging |
| `join-discord.md` | 396 bytes | No | LOW — needs fork replacement (remove upstream Discord, add fork equivalent or remove entirely) |

### Upstream Reference Cleanup Inventory (7 items)

| File | Line | Reference | Action |
|------|------|-----------|--------|
| `commands/gsd/join-discord.md` | 15 | `discord.gg/5JJgD5svVS` | Replace with fork equivalent or remove command |
| `bin/install.js` | 1546 | `discord.gg/5JJgD5svVS` | Replace with fork community link or remove |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | 14 | `get-shit-done-cc` | Replace with `get-shit-done-reflect-cc` |
| `.github/CODEOWNERS` | 2 | `@glittercowboy` | Replace with `@loganrooks` (or fork maintainer) |
| `.github/FUNDING.yml` | 1 | `github: glittercowboy` | Replace with fork maintainer or remove |
| `SECURITY.md` | 7 | `security@gsd.build`, `@glittercowboy` | Replace with fork contact info |
| `commands/gsd/new-project.md.bak` | entire file | upstream backup | Delete |

### Success Criteria Reconciliation

| Criterion | Roadmap Says | Actual State | Reconciliation |
|-----------|-------------|--------------|----------------|
| #1: `gsd-tools.js --help` | Shows commands | `--help` is unknown command; no-args shows usage | Change to: running with no args shows usage and exits |
| #2: `config get .planning/config.json depth` | Reads fork config | No `config get` subcommand exists | Change to: `config-set` round-trips fork fields; `state load` returns upstream fields; direct JSON read for fork fields |
| #3: Fork command logic migrated to workflow | Delegating to workflows | 3 converted in Phase 8; 3 fork-only need conversion | Maintain — but clarify which commands |
| #4: 19 new workflow files | 19 present | 28 upstream-origin + 6 fork-only = 34 total; 18 net-new from merge | Update count to match reality |

## Discretion Recommendations

### Fork-Only Workflow File Location
**Recommendation: Keep in same directory (`get-shit-done/workflows/`)**
- The 6 fork-only workflows (collect-signals, discovery-phase, health-check, list-phase-assumptions, reflect, run-spike) have unique names that don't collide with any upstream workflow
- A subdirectory adds path complexity to every @-reference
- No merge friction reduction from separating — upstream never creates files with these names
- Consistency matters: one directory, one pattern
**Confidence:** HIGH

### Fork Section Markers in Upstream Workflow Files
**Recommendation: Add light markers only where fork content is substantial and interleaved**
- Files like `workflows/help.md` (where fork added a GSD Reflect commands section) benefit from `<!-- FORK: GSD Reflect -->` markers
- Files with no fork modifications don't need markers
- The tracked-modifications strategy (FORK-DIVERGENCES.md) already documents which files are modified at the file level
- Markers add per-section granularity without overhead on clean files
**Confidence:** MEDIUM — depends on how many files actually need fork modifications

### Agent Spec Conflict Resolution
**Recommendation: Review each of 9 specs against pre-merge fork state**
- The fork's KB-related agents live in `~/.claude/agents/` (separate directory, no merge impact)
- The repo's `agents/` directory contains upstream agents that were auto-merged
- Key check: did any agent spec in `agents/` have fork-specific additions before the merge? If so, verify those survived
- Most likely safe: the fork primarily added new agents rather than modifying upstream ones
**Confidence:** MEDIUM — needs verification during audit

### Phase 9 Plan Count
**Recommendation: 2-3 plans (audit + 1-2 fix plans)**
- Plan 1: Comprehensive audit producing findings report
- Plan 2: Fixes derived from findings (upstream refs, template enrichment, thin orchestrator conversion, success criteria reconciliation)
- Plan 3 (conditional): If conversion of `signal.md` (8.5k of inline logic) proves complex enough to warrant separation
**Confidence:** MEDIUM — depends on audit findings volume

### gsd-tools Extension Style
**Recommendation: Separate fork-tools.js file (not modifying gsd-tools.js)**
- gsd-tools.js is 4,597 lines of upstream code — modifying it creates merge conflicts on every sync
- A separate `fork-tools.js` (or `gsd-reflect-tools.js`) can handle fork-specific operations (KB queries, signal management, health-check state)
- Fork-tools can import/wrap gsd-tools functions if needed, or operate independently
- Zero merge friction for future upstream syncs
- However, this is an assessment/flagging item for Phase 9, not necessarily implementation. Actual creation of fork-tools could be a Phase 10+ task
**Confidence:** HIGH for the approach; MEDIUM for whether it belongs in Phase 9 vs later

## Open Questions

1. **Agent spec pre-merge state**
   - What we know: 9 agent specs were auto-merged. The fork's KB agents are in a separate directory.
   - What's unclear: Whether any repo-level agent specs (`agents/gsd-*.md`) had fork-specific additions before the merge
   - Recommendation: The audit should check git history (`git diff HEAD~1 agents/` or compare with v1.12.2-pre-sync tag)

2. **References to deleted files (CONTRIBUTING.md, GSD-STYLE.md, MAINTAINERS.md)**
   - What we know: These files were deleted by upstream. Grep found references in `.planning/` documentation but NOT in source files.
   - What's unclear: Whether any runtime code path references these files (unlikely given they're community docs)
   - Recommendation: Include in the automated scan but likely a non-issue

3. **Discord link replacement**
   - What we know: Upstream Discord link appears in install.js and join-discord.md
   - What's unclear: Does the fork have its own Discord/community link?
   - Recommendation: Flag in audit report — user decides replacement value

4. **Template fill testing scope**
   - What we know: `gsd-tools.js template fill summary --phase N` generates pre-filled templates
   - What's unclear: Whether the enriched fork templates (with requires/patterns-established) will work with the template fill command or need fill logic updates
   - Recommendation: Test template fill with fork phase data during verification

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all files mentioned (gsd-tools.js, commands/, workflows/, agents/, references/, templates/)
- Test execution: `npx vitest run` (42 pass), `node --test gsd-tools.test.js` (75 pass)
- `grep` scans for upstream references across entire codebase
- Phase 8 merge report: `.planning/phases/08-core-merge/08-MERGE-REPORT.md`
- Fork divergence manifest: `.planning/FORK-DIVERGENCES.md`

### Secondary (MEDIUM confidence)
- gsd-tools.js template selection logic interpretation (reading source code, not documented behavior)
- Agent spec merge impact assessment (based on file modification dates vs fork history)

### Tertiary (LOW confidence)
- None — all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries needed; all tools already present
- Architecture: HIGH — patterns verified by reading actual converted commands and gsd-tools.js source
- Pitfalls: HIGH — all pitfalls verified with actual commands and grep scans
- Inventory: HIGH — every file counted and verified
- Discretion recommendations: MEDIUM — recommendations based on architectural judgment, not proven practice

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable — codebase won't change until Phase 9 executes)
