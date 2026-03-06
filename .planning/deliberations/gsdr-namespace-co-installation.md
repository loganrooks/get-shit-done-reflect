# Deliberation: GSDR Namespace for Co-Installation

**Date:** 2026-03-06
**Status:** open
**Trigger:** GSD Reflect installs into identical paths as upstream GSD (`get-shit-done/`, `commands/gsd/`, `gsd-tools.js`), making co-installation impossible -- one overwrites the other.
**Affects:** All installed users, upstream merge strategy, command UX
**Related:** FORK-STRATEGY.md, FORK-DIVERGENCES.md, dual-installation.md

<!-- Philosophical grounding:
- pragmatism/warranted-assertibility: claims are warranted through well-conducted inquiry
- falsificationism/corroboration-not-confirmation: evidence base uses "corroborated" not "verified"
- error-statistics/severity-principle: tests designed to probably detect errors if present
-->

## Situation

GSD Reflect is a fork of upstream GSD. Both install to identical paths:
- `~/.claude/get-shit-done/` (runtime: bin, references, templates, workflows)
- `~/.claude/commands/gsd/` (30+ slash commands)
- `~/.claude/agents/gsd-*.md` (20+ agent specs)

The npm source directories mirror this: `get-shit-done/`, `commands/gsd/`, `agents/gsd-*.md`.

Installing one after the other overwrites the first completely. There is no way to have both upstream GSD and GSD Reflect on the same machine.

### Scale of namespace references

| Touchpoint | Count | Scope |
|-----------|-------|-------|
| `get-shit-done/` source dir | 1 dir, 40 refs in installer | Core runtime directory |
| `commands/gsd/` | 30+ files | Command entry points |
| `agents/gsd-*.md` | 20+ files | Agent specifications |
| `gsd-tools.js`/`.cjs` refs | ~200 across codebase | CLI runtime binary |
| `~/.claude/get-shit-done/` path refs | 1,137 across 197 files | Hardcoded in agents, workflows, refs |
| `/gsd:` command prefix refs | 482 across codebase | User-facing command names |

### Existing infrastructure

The installer already has `replacePathsInContent()` that rewrites `~/.claude/` paths to runtime-specific prefixes at install time (for cross-runtime support: Claude, Gemini, OpenCode, Codex). This is the foundation for the solution.

## Evidence Base

| # | Claim | Test | Corroborated? |
|---|-------|------|---------------|
| 1 | Both install to `~/.claude/get-shit-done/` | Read installer install targets | Yes -- installer line 2055+ writes to `get-shit-done/VERSION` under target dir |
| 2 | 1,137 path references across 197 files | `grep -roh "get-shit-done" \| wc -l` | Yes -- counted via grep |
| 3 | 482 `/gsd:` command refs | `grep -roh "/gsd:" commands/ agents/ get-shit-done/ \| wc -l` | Yes -- counted via grep |
| 4 | `replacePathsInContent()` exists for path rewriting | Read installer lines 1134-1160 | Yes -- replaces `~/.claude/` with runtime-specific prefix |
| 5 | Dual-install doc addresses local-vs-global, not fork-vs-upstream | Read dual-installation.md | Yes -- exclusively about local/global scope |
| 6 | 18 modified upstream files tracked in FORK-DIVERGENCES.md | Read FORK-DIVERGENCES.md | Yes -- manifest lists exactly 18 |
| 7 | Agent subagent_type maps to filename | Checked agents/*.md and Agent tool docs | Yes -- `subagent_type="gsd-executor"` matches `agents/gsd-executor.md` |
| 8 | Non-gsd agent files exist (kb-templates/, knowledge-store.md) | `ls agents/ \| grep -v "^gsd-"` | Yes -- these don't need renaming |
| 9 | Only `subagent_type="general-purpose"` doesn't use gsd- prefix | grep across all files | Yes -- all other subagent_types are `gsd-*` |

## Framing

**Core question:** How should GSD Reflect differentiate its installed namespace from upstream GSD to allow co-installation, given that the source shares 1,137+ path references with `gsd` naming, upstream merge viability depends on source-level compatibility, and the installer already has path-rewriting infrastructure?

**Key tensions:**
1. Co-installation requires different installed paths/names
2. Source-level renames make upstream merges extremely painful (18 modified files would become 200+)
3. Command prefix changes (`/gsd:` -> `/gsdr:`) affect user muscle memory
4. The installer's path-rewriting infrastructure suggests install-time transformation is feasible

## Options Explored

### Option A: Install-Time Namespace Rewriting (SELECTED)

**Claim:** Keep source files as `gsd` (preserving upstream merge compatibility). The installer rewrites to the Reflect namespace at install time.

**Grounds:** `replacePathsInContent()` already rewrites `~/.claude/` to runtime-specific paths. Extend it to also rewrite directory names, command prefixes, agent filenames, and subagent_type values.

**Warrant:** Same pattern already proven for cross-runtime support. Source stays mergeable with upstream. Only the installer and installed output change.

**Rebuttal:** Adds complexity to the installer. Content rewriting could have false positives. Agent filename renaming is a new mechanism not yet in the installer.

### Option B: Full Source Rename (REJECTED)

Rename everything at source level. Clean, but touches 197+ files, 1,137+ references, and makes upstream merges essentially impossible. Effectively forks permanently.

### Option C: Directory-Only Namespace (REJECTED)

Only change installed directory names. Commands stay `/gsd:*` for both tools -- ambiguous autocomplete makes it unusable for co-installation.

### Option D: Command Prefix Only (REJECTED)

Only change command prefix. Doesn't solve directory collision -- only half a solution.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | Install-time rewriting (Option A) | Preserves upstream merge compatibility |
| Runtime directory name | `get-shit-done-reflect/` | Explicit, matches npm package name |
| Command prefix | `/gsdr:` (via `commands/gsdr/`) | Short, memorable, differentiates from upstream `/gsd:` |
| Agent prefix | `gsdr-*.md` (installed) | Matches command prefix, enables subagent_type resolution |
| Knowledge base root | Keep `~/.gsd/` as-is | Reflect-only feature, upstream GSD doesn't use it, no collision |
| Source files | Unchanged (`gsd` naming) | Upstream merge viability |

### Install-Time Rewrite Rules

| # | What | Source | Installed | Mechanism |
|---|------|--------|-----------|-----------|
| 1 | Runtime directory | `get-shit-done/` | `get-shit-done-reflect/` | Installer directory naming |
| 2 | Commands directory | `commands/gsd/*.md` | `commands/gsdr/*.md` | Installer directory naming |
| 3 | Agent filenames | `agents/gsd-*.md` | `agents/gsdr-*.md` | Installer file rename during copy |
| 4 | Path refs in content | `~/.claude/get-shit-done/` | `~/.claude/get-shit-done-reflect/` | Extended `replacePathsInContent()` |
| 5 | Command refs in content | `/gsd:` | `/gsdr:` | New rewrite rule in content processing |
| 6 | subagent_type refs | `"gsd-executor"` | `"gsdr-executor"` | New rewrite rule in content processing |
| 7 | gsd-tools binary refs | `get-shit-done/bin/gsd-tools.js` | `get-shit-done-reflect/bin/gsd-tools.js` | Rule #4 handles the path, filename unchanged |

**Exceptions (NOT rewritten):**
- `knowledge-store.md`, `kb-templates/` -- no `gsd-` prefix, not tool-namespace-specific
- `subagent_type="general-purpose"` -- not ours
- `~/.gsd/knowledge/` -- KB root stays shared (Reflect-only feature)
- Source files themselves -- never modified, only installed copies

## Predictions

| # | Prediction | Severe Test | Falsification Condition |
|---|-----------|-------------|------------------------|
| 1 | Co-installation works: both GSD and GSD Reflect installed simultaneously without overwriting | Install upstream GSD globally, then install GSD Reflect globally. Verify both VERSION files exist at `~/.claude/get-shit-done/VERSION` and `~/.claude/get-shit-done-reflect/VERSION` | Either VERSION file missing or containing the other tool's version |
| 2 | Upstream merges unaffected: conflict surface stays at ~18 files | `git merge --no-commit upstream/main` dry run after implementation. Count conflicting files | Conflict count increases beyond 20 (currently 18 modified upstream files) |
| 3 | All /gsdr: commands functional: no broken cross-references in installed files | Install globally, run `/gsdr:help`, then `/gsdr:health-check`. Grep installed files for stale `get-shit-done/` paths | Any "file not found" errors or stale `~/.claude/get-shit-done/` paths in installed `~/.claude/get-shit-done-reflect/` files |
| 4 | Test suite unaffected: tests pass without modification | `npm test` after implementation | Any test failure due to namespace (tests operate on source, which is unchanged) |

## Recommendation

**Implement Option A: Install-time namespace rewriting.**

The installer should be extended to:
1. Install runtime files to `get-shit-done-reflect/` instead of `get-shit-done/`
2. Install commands to `commands/gsdr/` instead of `commands/gsd/`
3. Rename agent files from `gsd-*.md` to `gsdr-*.md` during copy
4. Extend `replacePathsInContent()` with rules for path, command, and subagent_type rewriting

This is a significant change to `bin/install.js` and should be implemented as a full phase (not a quick task) with:
- Thorough test coverage for the new rewrite rules
- Smoke testing with actual co-installation
- Update to FORK-DIVERGENCES.md and dual-installation.md

**Implementation scope estimate:** Primarily `bin/install.js` changes + new/updated tests. Source files unchanged. The existing cross-runtime path rewriting pattern provides a proven template.
