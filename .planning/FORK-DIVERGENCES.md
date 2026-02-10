# Fork Divergence Manifest

## Summary

| Metric | Value |
|--------|-------|
| Modified upstream files | 17 |
| Added fork-only files | 166 |
| Fork point | `2347fca` (upstream v1.11.1) |
| Last sync | N/A (first sync pending) |
| Fork version | v1.12.2 |
| Upstream version | v1.18.0 |

See [FORK-STRATEGY.md](./FORK-STRATEGY.md) for the overall fork maintenance approach, merge strategy, and conflict resolution runbook.

## Modified Upstream Files

These 17 files exist in upstream and have been modified by the fork. They are the files that may produce merge conflicts during upstream sync. Source: `git diff --diff-filter=M --name-only upstream/main...HEAD`.

### Identity (6 files)

Files related to fork branding, naming, and package identity.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `README.md` | Complete rewrite for GSD Reflect branding, feature descriptions, learning loop documentation | Fork identity | Fork wins | LOW |
| `CHANGELOG.md` | Fork-specific changelog replacing upstream history | Fork identity | Fork wins | LOW |
| `package.json` | Name (`get-shit-done-reflect-cc`), repo URLs, description, npm scripts, devDependencies (vitest) | Fork identity + extensions | Hybrid merge | HIGH |
| `package-lock.json` | Generated from fork's package.json | N/A (generated file) | Regenerate | N/A |
| `bin/install.js` | REFLECT ASCII banner, package name refs, help text, version-check hook registration, uninstall hook list | Fork branding + fork features | Hybrid merge | HIGH |
| `hooks/gsd-check-update.js` | npm package name changed to `get-shit-done-reflect-cc` | Fork identity | Fork wins | LOW |

### Commands (3 files)

Modifications to GSD command specification files.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `commands/gsd/help.md` | Package name refs, install command, GSD Reflect section with reflect-specific commands | Fork branding + fork features | Hybrid merge | MEDIUM |
| `commands/gsd/new-project.md` | Added Phase 5.7 DevOps Context section, devops-detection.md reference | Fork feature addition | Hybrid merge | HIGH |
| `commands/gsd/update.md` | Package name refs (5 occurrences), changelog URL | Fork branding | Hybrid merge | MEDIUM |

### Templates & References (5 files)

Changes to template files and reference documentation.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `get-shit-done/references/planning-config.md` | Added `knowledge_debug` config, `knowledge_surfacing_config` section | Fork feature config | Hybrid merge | MEDIUM |
| `get-shit-done/templates/config.json` | Added `gsd_reflect_version`, `health_check`, `devops` sections | Fork feature config | Hybrid merge | MEDIUM |
| `get-shit-done/templates/context.md` | Added `open_questions` section | Fork enhancement | Case-by-case | LOW |
| `get-shit-done/templates/project.md` | Added `open_questions` section | Fork enhancement | Case-by-case | LOW |
| `get-shit-done/templates/research.md` | Enhanced `open_questions` with resolved/gaps/spike/still-open structure | Fork enhancement | Case-by-case | LOW |

### Build & Config (3 files)

Build scripts, tooling, and project configuration.

| File | What Changed | Why | Merge Stance | Conflict Risk |
|------|-------------|-----|--------------|---------------|
| `get-shit-done/templates/codebase/concerns.md` | Added DevOps Gaps section to template and example | Fork addition | Case-by-case | LOW |
| `scripts/build-hooks.js` | Added `gsd-version-check.js` to `HOOKS_TO_COPY` array | Fork addition | Case-by-case | LOW |
| `.gitignore` | Added benchmark results exclusion | Fork addition | Case-by-case | LOW |

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

| Risk Level | Count | Files |
|------------|-------|-------|
| **HIGH** | 3 | `bin/install.js`, `package.json`, `commands/gsd/new-project.md` |
| **MEDIUM** | 4 | `commands/gsd/help.md`, `commands/gsd/update.md`, `get-shit-done/templates/config.json`, `get-shit-done/references/planning-config.md` |
| **LOW** | 9 | `README.md`, `CHANGELOG.md`, `hooks/gsd-check-update.js`, `get-shit-done/templates/context.md`, `get-shit-done/templates/project.md`, `get-shit-done/templates/research.md`, `get-shit-done/templates/codebase/concerns.md`, `scripts/build-hooks.js`, `.gitignore` |
| **N/A** | 1 | `package-lock.json` (regenerated) |

**HIGH risk** means both fork and upstream made significant changes to the same file. These require careful manual resolution during merge.

**MEDIUM risk** means both sides made additive changes that are likely compatible but need verification during merge.

**LOW risk** means the fork change is dominant (fork wins) or the upstream has minimal overlap with the fork's modification.

---
*Manifest source: `git diff --diff-filter=M --name-only upstream/main...HEAD`*
*Last updated: 2026-02-10*
