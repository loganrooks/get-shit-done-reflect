# Phase 12: Release & Dogfooding - Research

**Researched:** 2026-02-11
**Domain:** Dogfooding (signal collection, reflection, KB validation) + Release engineering (versioning, changelog, tagging, PR)
**Confidence:** HIGH

## Summary

This phase has two distinct work streams: (1) dogfooding the gsd-reflect knowledge base system by collecting signals from Phases 8-11, generating lessons, running reflection, and writing a KB comparison document; (2) preparing the v1.13.0 release with version bumps, changelog, git tag, and PR to main.

The standard approach is well-defined because all the tools already exist in the codebase. Signal collection uses `/gsd:collect-signals` (automated) and `/gsd:signal` (manual). Lesson generation uses `/gsd:reflect`. The release flow follows established conventions from prior versions (v1.12.x). The key challenge is not building anything new -- it is exercising existing features correctly and producing quality content.

The execution order is dogfooding-first, then release. This matters because the dogfooding content (signal counts, lesson counts, reflection insights) informs the changelog narrative and demonstrates the KB system's value. The user has requested a signal review gate between collection and lesson generation.

**Primary recommendation:** Split into 2-3 plans: dogfooding (signal collection + review gate + reflection), KB comparison document, and release preparation (version bump + changelog + tag + PR). The review gate between signal collection and lesson generation is a natural plan boundary.

## Standard Stack

This phase uses no external libraries. All tools are internal GSD commands and shell operations.

### Core
| Tool | Location | Purpose | Why Standard |
|------|----------|---------|--------------|
| `/gsd:collect-signals` | `.claude/commands/gsd/collect-signals.md` | Automated signal detection from phase artifacts | Built-in GSD reflect command; reads PLAN/SUMMARY/VERIFICATION artifacts |
| `/gsd:signal` | `.claude/commands/gsd/signal.md` | Manual signal creation for strategic insights | Built-in GSD reflect command; captures observations not detectable from artifacts |
| `/gsd:reflect` | `.claude/commands/gsd/reflect.md` | Pattern detection and lesson distillation from accumulated signals | Built-in GSD reflect command; closes the self-improvement loop |
| `kb-rebuild-index.sh` | `.claude/agents/kb-rebuild-index.sh` | Atomic index regeneration from KB entry files | Built-in script; handles signals/spikes/lessons with frontmatter parsing |
| `gh` CLI | System | PR creation, release management | GitHub's official CLI; already used in project workflows |
| `git tag` | System | Version tagging | Standard git operation |

### Supporting
| Tool | Location | Purpose | When to Use |
|------|----------|---------|-------------|
| `gsd-signal-collector` agent | `.claude/agents/gsd-signal-collector.md` | Spawned by collect-signals workflow | Automatic -- workflow spawns it |
| `gsd-reflector` agent | `.claude/agents/gsd-reflector.md` | Spawned by reflect workflow | Automatic -- workflow spawns it |
| `kb-templates/signal.md` | `.claude/agents/kb-templates/signal.md` | Signal entry format template | When creating manual signals |
| `kb-templates/lesson.md` | `.claude/agents/kb-templates/lesson.md` | Lesson entry format template | When reflect creates lessons |

### No Alternatives Needed
This phase uses only internal tooling. There are no library choices to make.

## Architecture Patterns

### Signal Collection Flow (Phases 8-11)

The automated collector reads execution artifacts and produces signals. The manual approach captures strategic observations.

```
Phase 8-11 artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md)
       |
       v
/gsd:collect-signals {phase}  ──> gsd-signal-collector agent
       |                            |
       |                   Reads artifacts, detects:
       |                   - Deviations (plan vs summary)
       |                   - Config mismatches
       |                   - Struggles (issues encountered)
       |                            |
       v                            v
Signal files written to:    ~/.claude/gsd-knowledge/signals/get-shit-done-reflect/
       |
       v
kb-rebuild-index.sh  ──> Updated index.md
```

For manual signals:
```
/gsd:signal "description" --severity notable --type custom
       |
       v
Preview shown to user ──> User confirms ──> Signal file written
       |
       v
kb-rebuild-index.sh  ──> Updated index.md
```

### Dogfooding Execution Order (Locked Decision)

```
1. Collect signals (automated per phase: 8, 9, 10, 11)
2. Create manual signals (strategic insights)
3. Present all signals to user for review  <<<< USER REVIEW GATE
4. User approves/edits signals
5. Run /gsd:reflect to detect patterns and distill lessons
6. Write KB-COMPARISON.md
```

### Release Execution Order (Locked Decision)

```
1. Version bump: package.json, package-lock.json, config.json template
2. Write CHANGELOG.md entry for v1.13.0
3. Commit version + changelog
4. Create git tag v1.13.0
5. Create PR from sync/v1.13-upstream -> main
6. (After merge, manual CI trigger for npm publish -- OUT OF SCOPE)
```

### Project Namespace for KB Entries

**IMPORTANT:** The project name derived from the working directory basename is `get-shit-done-reflect`. This is the namespace for all signal and lesson files created in this phase.

The two existing signals are under the `prostagma` project namespace (from a different project). They will NOT be found when `/gsd:collect-signals` scans for this project's signals. They exist in the KB but belong to a different project context.

Signal files for this phase go to: `~/.claude/gsd-knowledge/signals/get-shit-done-reflect/`
Lesson files go to: `~/.claude/gsd-knowledge/lessons/{category}/`

### KB Comparison Document Structure

Location: `.planning/phases/12-release-dogfooding/KB-COMPARISON.md`

Per the locked decision, the comparison must cover:
- Persistence model (file-based Markdown vs MCP server with TypeScript)
- Portability (files travel with user vs MCP server dependency)
- Tooling requirements (shell script + grep vs MCP server + QMD search)
- Context window impact (lazy-load index + on-demand reads vs MCP tool calls)
- Actual utility during this milestone (cite signal/lesson counts, specific patterns detected)
- Failure modes (what went wrong or could go wrong with each approach)
- Maintenance burden (file-based simplicity vs MCP server upkeep)

Key data points for the comparison from this project:
- Upstream tried GSD Memory in v1.11.2, reverted in v1.11.3 ("writes but doesn't query", setup friction)
- Upstream reversion commits: `af7a057` (added), `cc3c6ac` (reverted)
- Our KB was shipped in v1.8.0, has been running since then, 2 signals already exist (from prostagma project)
- The kb-rebuild-index.sh script was missing initially (sig-2026-02-10-missing-kb-rebuild-index-script) but has since been created

### Changelog Structure (Locked Decision)

The existing CHANGELOG.md format uses `## [version] - date` headers with `### Added`, `### Changed`, `### Fixed` subsections.

For v1.13.0, the required structure:
```markdown
## [1.13.0] - 2026-02-11

### Added
- Synced with upstream GSD v1.18.0 (70 commits merged)
- [List adopted upstream features]
- Signal tracking validated through production use (X signals, Y lessons)

### Changed
- [Architecture adoption: thin orchestrator, gsd-tools integration]
- [Fork-specific changes]

### Fixed
- [Upstream bug fixes adopted, grouped by category]
```

### Version Bump Locations (Locked Decision)

Four files must be updated:
1. `package.json` -- `"version": "1.13.0"` (currently `"1.12.2"`)
2. `package-lock.json` -- `"version": "1.13.0"` (currently `"1.12.2"`)
3. `get-shit-done/templates/config.json` -- `"gsd_reflect_version": "1.13.0"` (currently `"1.12.0"`)
4. `CHANGELOG.md` -- New `## [1.13.0]` entry (currently `## [Unreleased]` is empty)

Note: The project's own `.planning/config.json` has `"gsd_reflect_version": "1.12.2"` -- this is the running project config, not the template. The template is what new projects get initialized with.

### Git Tag and PR Flow

The publish workflow triggers on GitHub release events (`on: release: types: [published]`). The workflow:
1. Checks out code
2. Verifies `package.json` version matches tag (`v1.13.0` -> `1.13.0`)
3. Extracts release notes from CHANGELOG.md (parses between version headers)
4. Runs all tests (vitest, upstream, fork)
5. Publishes to npm with `--provenance --access public`

Therefore:
- Tag must be `v1.13.0` (matching the `TAG_VERSION=${GITHUB_REF#refs/tags/v}` extraction)
- CHANGELOG entry must use `## [1.13.0]` format (matching the awk extraction pattern)
- The PR goes from `sync/v1.13-upstream` to `main` (114 commits ahead)
- After PR merge on GitHub, a release is created manually which triggers publish

### Tag Convention

Existing tags follow `v{major}.{minor}.{patch}` pattern: `v1.12.0`, `v1.12.1`, `v1.12.2-pre-sync`. The tag for this release should be `v1.13.0`.

The user's decision says "prepare only" -- so we create the tag but the GitHub Release (which triggers npm publish) is done manually after the PR is merged.

**Annotated vs lightweight tag:** Use annotated tag. Annotated tags store tagger info and date, which is better for releases. This is Claude's discretion per the context.

```bash
git tag -a v1.13.0 -m "v1.13.0: Synced with upstream GSD v1.18.0"
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signal detection from artifacts | Custom artifact parsing | `/gsd:collect-signals` command | Already handles PLAN/SUMMARY/VERIFICATION comparison, severity classification, dedup, cap enforcement |
| Index rebuilding | Manual index.md editing | `kb-rebuild-index.sh` | Atomic write (temp + rename), handles all entry types, parses frontmatter |
| Pattern detection | Custom signal grouping | `/gsd:reflect` command | Already implements severity-weighted thresholds, cross-project detection |
| Lesson creation | Manual lesson file writing | `gsd-reflector` agent (spawned by reflect) | Handles template, frontmatter, scope determination, confidence |
| CHANGELOG extraction for release notes | Custom changelog parser | publish.yml's awk command | Already tested in CI, parses `## [version]` format correctly |
| Version match verification | Manual checking | publish.yml's version check step | Already compares package.json version against tag |

**Key insight:** This phase exercises existing tools. The risk is not in building anything but in exercising the tools correctly and producing quality content from them.

## Common Pitfalls

### Pitfall 1: Wrong Project Namespace in Signal Files
**What goes wrong:** Signals get written to the wrong project directory (e.g., `prostagma` instead of `get-shit-done-reflect`) or with the wrong project field in frontmatter.
**Why it happens:** The project name is derived from `basename $(pwd)` converted to kebab-case. If the working directory or derivation logic changes, signals go to the wrong namespace.
**How to avoid:** Verify the derived project name is `get-shit-done-reflect` before running any signal collection. The two existing signals under `prostagma` are from a different project and should not be mixed.
**Warning signs:** Signals appearing in `~/.claude/gsd-knowledge/signals/prostagma/` instead of `~/.claude/gsd-knowledge/signals/get-shit-done-reflect/`.

### Pitfall 2: Insufficient Signals for Pattern Detection
**What goes wrong:** `/gsd:reflect` finds no patterns because there aren't enough signals meeting the severity-weighted thresholds (critical needs 2+, notable needs 2+).
**Why it happens:** Automated collection may produce mostly trace-level signals (which are NOT persisted). The target is 10-15 total signals, but if most are trace, too few get persisted.
**How to avoid:** Supplement automated collection with manual `/gsd:signal` entries covering the strategic themes identified in CONTEXT.md: merge strategy decisions, conflict prediction accuracy, architecture adoption patterns, testing strategy choices. Manual signals are always persisted regardless of severity.
**Warning signs:** After running `/gsd:collect-signals` for all 4 phases, having fewer than 6 persisted signals total.

### Pitfall 3: Missing Phase Artifacts for Automated Collection
**What goes wrong:** `/gsd:collect-signals {phase}` reports "No completed plans to analyze" or finds fewer artifacts than expected.
**Why it happens:** The collector looks for `*-SUMMARY.md` files in the phase directory. If a plan was executed but no summary was written, the collector skips it.
**How to avoid:** Before running collect-signals, verify each phase directory has the expected PLAN + SUMMARY pairs. All four target phases (8-11) have complete artifact sets (verified during research: 08 has 4 plan/summary pairs, 09 has 3, 10 has 3, 11 has 3 = 13 total plans with summaries).
**Warning signs:** Collector reporting fewer plans than expected for a phase.

### Pitfall 4: kb-rebuild-index.sh Path Confusion
**What goes wrong:** The index doesn't update after signal/lesson writes because the script path is wrong.
**Why it happens:** The script exists at `.claude/agents/kb-rebuild-index.sh` (project-local, relative) but workflows reference it as `~/.claude/agents/kb-rebuild-index.sh` (user home). Since this is an npm-installed package, the installed location matters. The project repo has it at the project-local path.
**How to avoid:** Use the project-local path: `.claude/agents/kb-rebuild-index.sh`. The existing signal (sig-2026-02-10-missing-kb-rebuild-index-script) documented this exact issue, but the script has since been created at the project-local path. Verify the script exists before running collect-signals.
**Warning signs:** Exit code 127 from kb-rebuild-index.sh invocations.

### Pitfall 5: Version Mismatch Between package.json and Tag
**What goes wrong:** The publish workflow fails with "Version mismatch" error.
**Why it happens:** The tag is `v1.13.0` but package.json still says `1.12.2`, or vice versa.
**How to avoid:** Update ALL four version locations (package.json, package-lock.json, config.json template, CHANGELOG.md) in a single commit BEFORE creating the tag. Verify with: `node -p "require('./package.json').version"` should output `1.13.0`.
**Warning signs:** Any of the four files showing a different version than `1.13.0` after the bump.

### Pitfall 6: Changelog Format Breaking Release Notes Extraction
**What goes wrong:** The publish workflow extracts empty release notes from CHANGELOG.md.
**Why it happens:** The awk extraction pattern expects `## [X.Y.Z]` format. If the entry uses a different format (e.g., extra spaces, missing brackets, wrong delimiter), extraction fails silently.
**How to avoid:** Follow the exact format used in existing entries. The pattern is: `## [1.13.0] - 2026-02-11` (brackets around version, space-dash-space, ISO date). Compare against the existing `## [1.12.2] - 2026-02-10` entry.
**Warning signs:** Inconsistent header formatting in the new changelog entry.

### Pitfall 7: PR From Sync Branch Has 114 Commits
**What goes wrong:** The PR is overwhelmingly large, making review impractical.
**Why it happens:** The sync/v1.13-upstream branch has 114 commits ahead of main, covering 6 phases of work plus the upstream merge itself.
**How to avoid:** This is expected and acceptable. The PR serves as documentation of the full v1.13 work (per the locked decision "PR to main -- documents the full v1.13 work in a reviewable record"). The PR description should provide a clear summary with links to key artifacts (MERGE-REPORT.md, VERIFICATION.md files, etc.).
**Warning signs:** None -- this is working as intended.

### Pitfall 8: Reflect Finds No Patterns With Low Signal Count
**What goes wrong:** With only 10-15 signals, pattern detection thresholds (critical: 2+, notable: 4+) may not be met, producing zero lessons.
**Why it happens:** Pattern detection requires recurring signals (same signal_type + 2+ overlapping tags). With a small set, uniqueness is more likely than repetition.
**How to avoid:** When creating manual signals, deliberately use consistent tags for related observations. For example, all merge-related signals should share tags like `upstream-sync`, `merge`, `conflict-resolution`. This increases clustering probability. Also: the CONTEXT.md requires "at least one lesson about the upstream sync process" -- this may need to be manually crafted if reflect doesn't produce it.
**Warning signs:** `/gsd:reflect` reporting "no recurring patterns detected" despite having 10+ signals.

## Code Examples

### Signal File Format (for manual creation)
```yaml
# Source: .claude/agents/kb-templates/signal.md
---
id: sig-2026-02-11-conflict-prediction-accuracy
type: signal
project: get-shit-done-reflect
tags: [upstream-sync, merge, conflict-prediction, risk-assessment]
created: 2026-02-11T12:00:00Z
updated: 2026-02-11T12:00:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 08
plan: 01
polarity: positive
source: manual
occurrence_count: 1
related_signals: []
---

## What Happened

Pre-merge analysis predicted 11 conflicts but git merge produced only 8.
Three predicted HIGH/MEDIUM risk files auto-resolved because fork and
upstream changes were in non-overlapping code regions.

## Context

Phase 08-01 executed `git merge upstream/main` merging 70 upstream commits.
The conflict prediction was based on Phase 7 research analyzing which files
both fork and upstream had modified.

## Potential Cause

The risk assessment treated same-file modifications as conflict indicators,
but git's 3-way merge can resolve changes in different regions of the same
file. Actual conflict risk correlates with same-LINE edits, not same-FILE edits.
```

### Lesson File Format (for reference)
```yaml
# Source: .claude/agents/kb-templates/lesson.md
---
id: les-2026-02-11-conflict-risk-same-line-not-same-file
type: lesson
project: _global
tags: [upstream-sync, merge, conflict-prediction, git, fork-maintenance]
created: 2026-02-11T12:00:00Z
updated: 2026-02-11T12:00:00Z
durability: principle
status: active
category: workflow
evidence_count: 2
evidence: [sig-2026-02-11-conflict-prediction-accuracy, sig-2026-02-11-risk-recalibration]
confidence: medium
---

## Lesson

Conflict risk during upstream merges correlates with same-line edits, not
same-file edits -- git's 3-way merge resolves non-overlapping changes automatically.

## When This Applies

When planning fork synchronization with upstream and predicting which files
will conflict during `git merge`.

## Recommendation

During pre-merge analysis, classify conflict risk by examining whether fork
and upstream changes affect the same code regions (functions, sections),
not just the same files. Files where both sides made significant but
spatially separated changes should be rated LOW risk, not HIGH.

## Evidence

- sig-conflict-prediction-accuracy: 8 actual vs 11 predicted conflicts
- sig-risk-recalibration: Post-merge risk levels reassessed
```

### Version Bump Commands
```bash
# Update package.json version
npm version 1.13.0 --no-git-tag-version

# Verify package-lock.json was updated too
node -p "require('./package-lock.json').version"
# Expected: 1.13.0

# Update config.json template
# Edit get-shit-done/templates/config.json:
# "gsd_reflect_version": "1.13.0"

# Verify all locations
node -p "require('./package.json').version"         # 1.13.0
node -p "require('./package-lock.json').version"     # 1.13.0
grep gsd_reflect_version get-shit-done/templates/config.json  # "1.13.0"
```

### Git Tag Creation
```bash
# Annotated tag (recommended for releases)
git tag -a v1.13.0 -m "v1.13.0: Synced with upstream GSD v1.18.0

Merged 70 upstream commits, adopted thin orchestrator pattern,
validated gsd-reflect knowledge base through production dogfooding."
```

### PR Creation
```bash
gh pr create \
  --base main \
  --head sync/v1.13-upstream \
  --title "v1.13.0: Sync with upstream GSD v1.18.0" \
  --body "$(cat <<'EOF'
## Summary

- Merged 70 upstream commits (v1.11.2 to v1.18.0)
- Resolved 8 merge conflicts with principled strategy
- Adopted thin orchestrator pattern and gsd-tools CLI
- Validated gsd-reflect KB through production dogfooding
- All tests passing (53 vitest + 75 upstream + 7 fork)

## Key Artifacts

- [Merge Report](.planning/phases/08-core-merge/08-MERGE-REPORT.md)
- [Architecture Audit](.planning/phases/09-architecture-adoption/09-AUDIT-REPORT.md)
- [KB Comparison](.planning/phases/12-release-dogfooding/KB-COMPARISON.md)

## Test Plan

- [ ] CI passes (all 3 test suites)
- [ ] Version is 1.13.0 in package.json, package-lock.json, config template
- [ ] CHANGELOG.md has v1.13.0 entry
- [ ] Tag v1.13.0 exists

Generated with Claude Code
EOF
)"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MCP-based GSD Memory (upstream v1.11.2) | Reverted in upstream v1.11.3 | Jan 2026 | "Writes but doesn't query", setup friction. Upstream abandoned approach. |
| File-based KB (gsd-reflect v1.8.0+) | Still current | Feb 2026 | Shell scripts + Markdown + YAML frontmatter. No MCP dependency. |
| Inline command logic | Thin orchestrator pattern | Upstream v1.14+ | Commands delegate to workflow files. Fork adopted in Phase 9. |
| Manual bash git operations | gsd-tools.js CLI | Upstream v1.14+ | Centralized Node.js tool for commits, state, config. Fork adopted in Phase 9. |

## Open Questions

1. **Will automated collection produce enough persisted (non-trace) signals?**
   - What we know: Each phase has 2-4 plan/summary pairs. Automated detection focuses on deviations, config mismatches, and struggles. Phases 8-11 had clean executions with few issues.
   - What's unclear: Whether "clean execution" translates to "few/no persisted signals" (trace signals are not persisted).
   - Recommendation: Plan for heavy manual signal supplementation. The strategic insights about merge strategy, conflict prediction, and architecture adoption are the most valuable content and are only capturable manually.

2. **Can `/gsd:reflect` produce lessons with a small, thematically-coherent signal set?**
   - What we know: Pattern detection requires 2+ occurrences for critical/notable signals with same signal_type + 2+ overlapping tags. With 10-15 signals across 4 phases, clusters may be small.
   - What's unclear: Whether the reflection engine will find qualifying patterns, especially the required "upstream sync process" lesson.
   - Recommendation: Tag signals deliberately to create clusters. If reflect cannot produce the required sync lesson, create it manually as a lesson entry (the planner should account for this fallback).

3. **Should the tag be created before or after the PR?**
   - What we know: The publish workflow triggers on GitHub Release events (which use tags). The tag should point to the final release commit (version bump + changelog).
   - What's unclear: Whether to tag before creating the PR (tag on sync branch), or after merge (tag on main).
   - Recommendation: Tag on the sync branch before creating the PR. The tag points to the specific commit with the version bump. After PR merge (fast-forward or merge commit), the tagged commit will be an ancestor of main. If the merge creates a new commit, the tag still correctly identifies the source.

## Sources

### Primary (HIGH confidence)
- Project-local files: All workflow, command, reference, and template files read directly from the codebase
- `.claude/agents/kb-rebuild-index.sh` -- verified exists and functional (167 lines)
- `.claude/commands/gsd/collect-signals.md` -- signal collection command spec
- `.claude/commands/gsd/signal.md` -- manual signal command spec
- `.claude/commands/gsd/reflect.md` -- reflection command spec
- `get-shit-done/workflows/collect-signals.md` -- signal collection workflow
- `get-shit-done/workflows/reflect.md` -- reflection workflow
- `get-shit-done/references/reflection-patterns.md` -- pattern detection rules
- `get-shit-done/references/signal-detection.md` -- signal detection rules
- `.github/workflows/publish.yml` -- npm publish workflow (OIDC-based)
- `package.json` v1.12.2, `package-lock.json` v1.12.2
- `CHANGELOG.md` -- existing format verified
- `~/.claude/gsd-knowledge/index.md` -- 2 signals, 0 spikes, 0 lessons
- Phase 8-11 directories -- all have complete PLAN + SUMMARY + VERIFICATION artifacts

### Secondary (MEDIUM confidence)
- PROJECT.md documentation on upstream GSD Memory reversion ("writes but doesn't query", setup friction)
- FEATURES.md documentation on MCP Memory commits (af7a057 added, cc3c6ac reverted)

### Tertiary (LOW confidence)
- None

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-10-missing-kb-rebuild-index-script | signal | kb-rebuild-index.sh was missing, now created | Common Pitfalls (Pitfall 4) |
| sig-2026-02-10-onboarding-missing-config-sections | signal | Config template has more settings than onboarding exposes | Not directly applicable to this phase |

Checked knowledge base (`~/.claude/gsd-knowledge/index.md`). Two signals found, one directly relevant (kb-rebuild-index script issue now resolved). No spikes or lessons exist yet (this phase creates the first lessons).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools are project-internal, verified by reading source files
- Architecture: HIGH -- execution flows traced through command -> workflow -> agent specs
- Pitfalls: HIGH -- pitfalls derived from actual codebase state (artifact inventory, namespace derivation, version file locations)

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days -- stable domain, internal tooling)
