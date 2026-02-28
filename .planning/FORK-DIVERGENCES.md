# Fork Divergence Manifest

## Summary

| Metric | Value |
|--------|-------|
| Modified upstream files | 18 |
| Added fork-only files | 166 |
| Fork point | `2347fca` (upstream v1.11.1) |
| Last sync | 2026-02-10 (v1.18.0 via merge commit f97291a) |
| Fork version | v1.12.2 |
| Upstream version | v1.18.0 |

See [FORK-STRATEGY.md](./FORK-STRATEGY.md) for the overall fork maintenance approach, merge strategy, and conflict resolution runbook.

## Modified Upstream Files

These 17 files exist in upstream and have been modified by the fork. They are the files that may produce merge conflicts during upstream sync. Source: `git diff --diff-filter=M --name-only upstream/main...HEAD`.

### Identity (6 files)

Files related to fork branding, naming, and package identity.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `README.md` | Complete rewrite for GSD Reflect branding, feature descriptions, learning loop documentation | Fork identity | Fork wins | LOW (confirmed: fork-wins, no issues) |
| `CHANGELOG.md` | Fork-specific changelog replacing upstream history | Fork identity | Fork wins | LOW (confirmed: fork-wins, no issues) |
| `package.json` | Name (`get-shit-done-reflect-cc`), repo URLs, description, npm scripts, devDependencies (vitest) | Fork identity + extensions | Hybrid merge | MEDIUM (was HIGH; hybrid merge straightforward in practice) |
| `package-lock.json` | Generated from fork's package.json | N/A (generated file) | Regenerate | N/A (regenerate always works) |
| `bin/install.js` | REFLECT ASCII banner, package name refs, help text, version-check hook registration, uninstall hook list | Fork branding + fork features | Hybrid merge | LOW (was HIGH; auto-resolved -- non-overlapping regions) |
| `hooks/gsd-check-update.js` | npm package name changed to `get-shit-done-reflect-cc` | Fork identity | Fork wins | LOW (confirmed: auto-resolved) |

### Commands (3 files)

Modifications to GSD command specification files.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `commands/gsd/help.md` | Thin orchestrator stub (upstream pattern adopted); fork GSD Reflect section in workflows/help.md | Fork branding + fork features | Adopt upstream stub + fork novelty in workflow | LOW (thin orchestrator adoption resolved cleanly) |
| `commands/gsd/new-project.md` | Thin orchestrator stub (upstream pattern adopted); fork DevOps Context in workflows/new-project.md | Fork feature addition | Adopt upstream stub + fork novelty in workflow | LOW (thin orchestrator adoption resolved cleanly) |
| `commands/gsd/update.md` | Thin orchestrator stub (upstream pattern adopted); fork branding in workflows/update.md | Fork branding | Adopt upstream stub + fork branding in workflow | LOW (thin orchestrator adoption resolved cleanly) |

### Templates & References (5 files)

Changes to template files and reference documentation.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `get-shit-done/references/planning-config.md` | Added `knowledge_debug` config, `knowledge_surfacing_config` section | Fork feature config | Hybrid merge | LOW (was MEDIUM; auto-resolved -- non-overlapping sections) |
| `get-shit-done/templates/config.json` | Added `gsd_reflect_version`, `health_check`, `devops` sections | Fork feature config | Hybrid merge | MEDIUM |
| `get-shit-done/templates/context.md` | Added `open_questions` section | Fork enhancement | Case-by-case | LOW |
| `get-shit-done/templates/project.md` | Added `open_questions` section | Fork enhancement | Case-by-case | LOW |
| `get-shit-done/templates/research.md` | Enhanced `open_questions` with resolved/gaps/spike/still-open structure | Fork enhancement | Case-by-case | LOW (confirmed: auto-resolved) |

### Runtime (1 file)

Files modifying gsd-tools.js runtime behavior.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `get-shit-done/bin/gsd-tools.js` | Added `signal` key to FRONTMATTER_SCHEMAS with required/conditional/recommended tiered validation; extended `cmdFrontmatterValidate` with conditional requirement, recommended field, backward_compat (lifecycle_state indicator), and evidence content validation | Signal schema enforcement (Phase 31) | keep-fork -- upstream has no signal schema | LOW (additive -- new schema entry and extended function, no upstream overlap) |

### Build & Config (3 files)

Build scripts, tooling, and project configuration.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `get-shit-done/templates/codebase/concerns.md` | Added DevOps Gaps section to template and example | Fork addition | Case-by-case | LOW |
| `scripts/build-hooks.js` | Added `gsd-version-check.js` to `HOOKS_TO_COPY` array | Fork addition | Case-by-case | LOW |
| `.gitignore` | Added benchmark results exclusion + upstream reports/ and RAILROAD_ARCHITECTURE.md | Fork addition | Combine both sides | LOW (confirmed: trivial additive merge) |

## Fork-Only Additions

The fork has added 166 files that do not exist in upstream. These files are never in conflict during upstream merges because upstream has no version of them. Key additions include:

- **`.planning/`** -- Project state, roadmap, phase documentation, and strategy files
- **`tests/`** -- Vitest test suite (8 unit, 34 integration tests)
- **`.claude/agents/gsd-*.md`** -- Fork-specific agent specifications (debugger, executor, planner, researcher)
- **`.claude/commands/gsd/*.md`** -- Fork-specific commands (health-check, reflect, signal, spike, etc.)
- **`get-shit-done/references/`** -- Fork reference docs (knowledge surfacing, signal classification, devops detection)
- **`hooks/gsd-version-check.js`** -- Fork version check hook
- **`scripts/benchmark.js`** -- Fork benchmark tooling

No detailed listing needed -- git tracks these files and they merge cleanly (no conflicts possible).

## Conflict Risk Summary

Updated after v1.18.0 sync (2026-02-10). Risk levels reflect actual merge experience.

| Risk Level | Count | Files |
|------------|-------|-------|
| **MEDIUM** | 1 | `package.json` (hybrid merge required but straightforward) |
| **LOW** | 15 | All others -- auto-resolved, fork-wins, combine, or regenerate |
| **N/A** | 1 | `package-lock.json` (always regenerated) |

**Post-merge insight:** Pre-merge predictions overestimated risk. Of 3 files predicted HIGH, only package.json required manual hybrid work. install.js auto-resolved (non-overlapping regions), and the 3 command files adopted upstream's thin orchestrator cleanly. For future syncs, conflict risk correlates with whether fork and upstream modify the *same lines*, not just the same file.

**Previous predictions vs actuals (v1.18.0 sync):**

| Predicted | Actual Conflicts | Auto-Resolved |
|-----------|-----------------|---------------|
| 11 conflicts | 8 conflicts | 3 predicted conflicts auto-resolved |
| 3 HIGH risk | 1 required manual hybrid merge | 2 auto-resolved |
| 4 MEDIUM risk | 2 adopted thin orchestrator | 2 auto-resolved |

---
*Manifest source: `git diff --diff-filter=M --name-only upstream/main...HEAD`*
*Last updated: 2026-02-10 (post v1.18.0 merge -- risk levels updated from actual experience)*
