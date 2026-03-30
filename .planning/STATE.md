---
gsd_state_version: 1.0
milestone: v1.18
milestone_name: Upstream Sync & Deep Integration
status: complete
stopped_at: Completed 54-05-PLAN.md -- FORK-STRATEGY.md durable sync policy (INF-04) and Phase 54 final verification. v1.18 milestone complete.
last_updated: "2026-03-28T21:35:00.000Z"
last_activity: 2026-03-28 -- Phase 54-05 complete (INF-04 sync policy, all 9 INF requirements verified)
progress:
  total_phases: 11
  completed_phases: 11
  total_plans: 37
  completed_plans: 37
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.
**Current focus:** v1.18 shipped. Planning next milestone.

## Current Position

Phase: 54 of 54 (Sync Retrospective & Governance)
Plan: 5 of 5
Status: complete
Last activity: 2026-03-30 -- Completed quick task 260326: sensors.cjs namespace fix + hook propagation

Progress: [████████████████████] 100%

## Performance Metrics

**v1.12 Final:**
- Total plans completed: 25
- Average duration: 2.8min
- Total execution time: 70min

**v1.13 Final:**
- Total plans completed: 18
- Average duration: ~4.4min
- Total execution time: ~70min

**v1.14 Final (initial + gap closure):**
- Plans completed: 18 (10 initial + 8 gap closure + 1 quick fix)
- Duration: ~75min (46min initial + 29min gap closure)

**v1.15 Final (initial + gap closure):**
- Plans completed: 24 (18 initial + 6 gap closure)
- Timeline: 13 days (2026-02-11 -> 2026-02-23)

**v1.16:**
- Plans completed: 20
- Total execution time: ~67min

**v1.17:**
- Plans completed: 24
- See STATE.md archive for per-plan breakdown

**v1.18:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 45-01 | 3min | 2 | 58 |
| 45-02 | 5min | 2 | 7 |
| 46-01 | 2min | 2 | 12 |

*Updated after each plan completion*
| Phase 46 P02 | 20min | 2 tasks | 1 files |
| Phase 46 P03 | 5min | 2 tasks | 0 files |
| Phase 46 P04 | 3min | 2 tasks | 1 files |
| Phase 47 P01 | 13min | 2 tasks | 5 files |
| Phase 47 P02 | 11min | 2 tasks | 4 files |
| Phase 48 P01 | 9min | 2 tasks | 3 files |
| Phase 48 P02 | 6min | 2 tasks | 3 files |
| Phase 48.1 P01 | 4min | 2 tasks | 4 files |
| Phase 49 P01 | 2min | 1 tasks | 2 files |
| Phase 49 P02 | 5min | 2 tasks | 11 files |
| Phase 49 P03 | 5min | 2 tasks | 2 files |
| Phase 49 P04 | 4min | 2 tasks | 1 files |
| Phase 50 P01 | 6min | 2 tasks | 1 files |
| Phase 50 P02 | 3min | 2 tasks | 1 files |
| Phase 50 P03 | 2min | 2 tasks | 1 files |
| Phase 50 P05 | 7min | 2 tasks | 2 files |
| Phase 50 P04 | 3min | 2 tasks | 1 files |
| Phase 51 P01 | 5min | 2 tasks | 3 files |
| Phase 51 P02 | 4min | 2 tasks | 2 files |
| Phase 51 P03 | 5min | 2 tasks | 1 files |
| Phase 52 P01 | 5min | 2 tasks | 2 files |
| Phase 52 P02 | 2min | 2 tasks | 10 files |
| Phase 52 P03 | 2min | 2 tasks | 2 files |
| Phase 52 P04 | 8min | 2 tasks | 14 files |
| Phase 52 P05 | 5min | 2 tasks | 3 files |
| Phase 53 P03 | 2min | 2 tasks | 2 files |
| Phase 53 P02 | 3min | 2 tasks | 4 files |
| Phase 53 P04 | 2min | 2 tasks | 1 files |
| Phase 53 P01 | 4min | 2 tasks | 3 files |
| Phase 54 P01 | 4min | 2 tasks | 4 files |
| Phase 54 P02 | 5min | 2 tasks | 2 files |
| Phase 54 P03 | 6min | 2 tasks | 2 files |
| Phase 54 P04 | 5min | 2 tasks | 2 files |
| Phase 54 P05 | 4min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.13-v1.17 decisions archived in milestones/ directories.

Recent decisions affecting current work:
- v1.18 roadmap: Modularization split into 4 phases (45-48) following research's incremental strategy: rename -> adopt modules -> extract fork modules -> extend & verify
- v1.18 roadmap: Config migration (Phase 49) placed after modularization because upstream workflows reference `granularity` not `depth`
- v1.18 roadmap: Migration test hardening (Phase 50) placed before feature adoption to catch namespace/migration regressions before they compound
- v1.18 roadmap: Update System Hardening (Phase 51) added after migration test hardening to ensure robust upgrade paths before feature adoption
- v1.18 roadmap: Infrastructure (Phase 54) placed last; technically independent of Phases 49-53 but benefits from stable final state
- [Phase quick-22]: Used TOML literal strings (''') for Codex agent files to preserve backslash patterns verbatim
- [Phase 45]: install.test.js prose test (lines 307-311) correctly left unchanged -- uses extensionless gsd-tools not gsd-tools.js
- [Phase 46]: Used module.exports.funcName extension pattern to add fork helpers to core.cjs without modifying upstream exports block
- [Phase 46]: loadManifest __dirname path adjusted to two levels up from bin/lib/ for correct feature-manifest.json resolution
- [Phase 46]: Fork overrides added for list-todos, config-set/get, frontmatter validate signal where upstream modules diverge from fork behavior
- [Phase 46]: Behavioral equivalence verified across all 6 command categories; no code changes needed post-dispatcher-rewire
- [Phase 46]: cmdInitTodos remains inline as sole init fork override; 8 other init subcommands routed through init.cjs
- [Phase 47]: FEATURE_CAPABILITY_MAP exported from automation.cjs per MOD-07 for Phase 53 deep integration consumers
- [Phase 47]: gsd-tools.cjs reduced from 3,200 to 1,239 lines (61% reduction); retains only fork init overrides, fork command overrides, and CLI router
- [Phase 48]: Tiered validation detection by schema properties (conditional/recommended), not schema name — future-proof for new tiered schemas
- [Phase 48]: Merge strategy: edit upstream function bodies in-place (add includes param + content loading block), never wholesale-replace
- [Phase 48]: Fork extension pattern: module.exports.funcName appended after main exports block — consistent with frontmatter.cjs and init.cjs approach
- [Phase 48]: gsd-tools.cjs is now a pure CLI router with zero inline function definitions — all command logic lives in lib/*.cjs
- [Quick 34]: v1.18 scope is explicitly frozen to the audited upstream `v1.22.4` baseline; later upstream changes require explicit triage instead of silent milestone expansion
- [Quick 34]: Phases 49-51 and 54 now reference the relevant open deliberations as planning input, not adopted policy
- [Quick 34]: Shadow fork CLI guidance is retired for v1.18; active strategy is upstream substrate with fork-specific epistemic behavior layered into the modular runtime
- [Roadmap 2026-03-24]: Inserted Phase 48.1 so the live upstream drift after the audit baseline becomes an explicit planning gate, not an implicit background concern
- [Phase 48.1]: Zero must-integrate-now items; all 9 fold-into clusters (C1-C9) route to Phases 49-52 per `UPSTREAM-DRIFT-LEDGER.md`; no Phase 45-48 reopening needed
- [Phase 48.1]: Comparison target is `v1.28.0` (released) with `upstream/main` as watchlist; ledger valid until ~2026-04-07
- [Phase 49]: manifest_version bumped from 1 to 2 to signal migrations[] availability
- [Phase 49]: Both-keys-present edge case handled by always deleting old key when it exists (partial migration safety)
- [Phase 49]: discovery-phase.md and discuss-phase.md correctly excluded from depth rename -- their "depth" usage is workflow parameters and content concepts, not config fields
- [Phase 49]: version-migration.md retains "depth" in historical example as documentation of the old field being renamed
- [Phase 49]: C6 resolve_model_ids behavioral change deferred to Phase 51 -- conflicts with fork's cross-runtime model handling (Quick 32)
- [Phase 49]: Adopted upstream workstream-aware signatures for planningPaths/planningDir for forward compatibility
- [Phase 49]: createManifestTestEnv extended with optional migrations parameter for reusable migration test setup
- [Phase 49]: Multi-version upgrade chain test uses real production manifest from disk for maximum fidelity
- [Phase 50]: TST-05 renameSync test documents that test-reachable code path does not invoke renameSync (old KB path depends on os.homedir); verifies data safety through the non-rename path
- [Phase 50]: fs mocking uses direct property replacement with try/finally restore rather than vitest.spyOn, matching CJS module interop pattern
- [Phase 50]: N-run idempotency (TST-02) tested with N=5 to catch metadata accumulation bugs invisible to 2-run tests
- [Phase 50]: Feature reconciliation idempotency tested with partial health_check config (missing fields added on run 1, stable on runs 2-5)
- [Phase 50]: TST-01 excludes upstream runtime files (bin/, settings.json, CHANGELOG.md) from namespace scan -- these are intentionally not rewritten by replacePathsInContent
- [Phase 50]: TST-08 adapted FEATURE_CAPABILITY_MAP assertions to actual structure (hook_dependent_above/task_tool_dependent) instead of plan's assumed max_level/requires
- [Phase 50]: findProjectRoot subdirectory test expects parent resolution when .planning/ and .git/ coexist at ancestor -- matches upstream .git heuristic behavior
- [Phase 51]: Migration specs stored as JSON in get-shit-done/migrations/ per version, matching existing data format conventions
- [Phase 51]: MIGRATION-GUIDE.md is installer-generated (works across all 4 runtimes), upgrade-project remains companion for config migration action
- [Phase 51]: Fresh-vs-upgrade detection via VERSION file presence; no guide generated for fresh installs (UPD-04)
- [Phase 51]: C6 resolve_model_ids "omit" adopted for non-Claude runtimes -- complementary to fork's core.cjs MODEL_PROFILES (separate code paths)
- [Phase 51]: C7 validateHookFields() adopted from upstream -- strips invalid hook entries before writeSettings() to prevent silent settings.json rejection
- [Phase 51]: E2E upgrade test uses VERSION=1.16.0 (not 1.17.5) because package.json is still at v1.17.5 -- the migration spec range filter needs previousVersion < currentVersion
- [Phase 51]: Migration guide uses action callouts (automatic vs run-upgrade-project) mapped from spec JSON action field -- human-readable rendering, not raw field values
- [Phase 51]: Version comparison uses dot-split numeric approach without semver dependency, strips +dev suffix before comparison
- [Phase 51]: validateHookFields uses two-pass approach (filter then prune) to avoid mutation during iteration; wired at both settings load and finishInstall write
- [Phase 51]: C6 resolve_model_ids placed after hook registration in install(), complementary to fork's core.cjs MODEL_PROFILES
- [Phase 51]: C5 pathPrefix uses path.basename(targetDir) with $HOME prefix for shell compatibility in global installs
- [Phase 51]: Upgrade e2e test uses VERSION=1.16.0 to trigger isUpgrade when package.json version is 1.17.5; guide generation tested separately with matching spec range
- [Phase 51]: All 6 UPD requirements verified with test coverage: 29 new tests total (15+14+4) above 376 baseline
- [Phase 52]: Wholesale-replaced integration-checker with upstream then re-added agent-protocol ref (clean diff, no conflicting sections)
- [Phase 52]: All adopted files use gsd- prefix source convention; installer handles rewriting to gsdr- at install time
- [Phase 52]: Upstream wholesale replace verified safe for discuss-phase.md and quick.md -- fork's steering brief model lives in command layer, not workflow file
- [Phase 52]: Upstream files use $HOME/.claude/get-shit-done/ paths which installer's replacePathsInContent() handles at install time
- [Phase 52]: Context-monitor uses direct push to PostToolUse (not ensureHook which is SessionStart-only); AfterTool for Gemini/Antigravity
- [Phase 52]: Advisor-researcher agent adopted from upstream to satisfy discuss-phase.md @-reference (Rule 3 deviation)
- [Phase 52]: Model-profiles.md adopts upstream inherit profile, per-agent model_overrides, non-Claude runtime docs
- [Phase 53]: KB surfacing reads project-local .planning/knowledge/ first, falls back to ~/.gsd/knowledge/
- [Phase 53]: FORK_PROTECTED_DIRS uses relative basenames for portability across install locations
- [Phase 53]: KB context capped at 3-5 items per guardrail G3, stored as internal variable not written to files
- [Phase 53]: SGNL-04/SGNL-05 flow through established sensor->synthesizer->KB pipeline per DC-2
- [Phase 53]: validation-coverage probe follows DC-4 probe shape with configurable threshold (default 80%)
- [Phase 53]: Bridge file staleness threshold is 120 seconds; nyquist_validation uses task_tool_dependent=true
- [Phase 53]: Resolve-level tests that assert empty reasons[] pass --context-pct 0 to isolate from host bridge files
- [Phase 54]: Post-drift-ledger changes classified into C12 (Windsurf+skills, candidate-next-milestone), C13 (SDK/headless, defer), C14 (i18n, defer)
- [Phase 54]: Fork-upstream relationship characterized as complementary divergence -- shared substrate, different higher-level concerns
- [Phase 54]: 6-disposition classification framework for feature overlap: converging, complementary, redundant, divergent, behind, not-applicable
- [Phase 54]: 4 behind gaps identified (security, UAT, cross-phase regression, requirements coverage gate) and 6 intentionally different features
- [Phase 54]: Signal cross-reference uses theme-level comparison (not entry-level) due to category mismatch between proactive signals and reactive issues
- [Phase 54]: Retrospective identifies 5 sync-round issues needing future attention (scope revision protocol, squash merge, PR workflow, deliberation tracking, quick task sprawl)
- [Phase 54]: Security hardening identified as genuine fork blind spot (not philosophical difference) -- recommended for future action
- [Phase 54]: FORK-DIVERGENCES.md rewritten in-place for 16-module post-modularization architecture (not versioned, per user locked decision)
- [Phase 54]: Security hardening (C10) recommended as top P1 priority for next sync cycle based on convergent evidence from 3 analyses
- [Phase 54]: 9 of 11 original drift ledger clusters (C1-C9) confirmed fully addressed by Phases 49-52; C10 remains strongest outstanding candidate
- [Phase 54]: Durable sync policy formalized in FORK-STRATEGY.md: trigger-based cadence, baseline-freeze (4 rules from 48.1), what-to-adopt criteria (5-class gap taxonomy), integration depth standard (from Phase 53)

### Roadmap Evolution

- 2026-03-24: Phase 48.1 inserted after Phase 48 — Post-audit upstream drift retriage and roadmap reconciliation (URGENT)

### Pending Todos

3 pending:
- [HIGH] Dual-install Phase 2: update flow, hook awareness, and version-pinned suppression (tooling)
- [HIGH] Local patch archive: versioned history instead of single-snapshot overwrite (installer)
- [MEDIUM] Revisit provisional corpus grounding set (planning)

### Blockers/Concerns

- NPM_TOKEN config (pre-existing from v1.12, not blocking)
- Gitignore friction (pre-existing from v1.12, not blocking)
- Live upstream drift after audit baseline: ADDRESSED by Phase 48.1 -- 372 commits triaged into 11 clusters, 9 fold-into + 1 candidate-next-milestone + 1 defer; routing recorded in ROADMAP.md and `UPSTREAM-DRIFT-LEDGER.md`
- Research flag: upstream function drift -- resolved in 46-01 (wholesale module adoption, no reconciliation needed)
- Research flag: init function signature compatibility -- resolved in 48-01 (merged with includes param, all upstream fields preserved)
- Research flag: context% bridge file lifecycle (stale files, concurrent sessions) needs investigation during Phase 51/52

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 22 | Fix Codex agent TOML generation - Issue #15 | 2026-03-17 | a7539ed | [22-fix-codex-agent-toml-generation-issue-15](./quick/22-fix-codex-agent-toml-generation-issue-15/) |
| 23 | Shared frontmatter helpers (extractFrontmatterAndBody/extractFrontmatterField) | 2026-03-17 | 4802023 | [23-shared-frontmatter-helpers-extractfrontm](./quick/23-shared-frontmatter-helpers-extractfrontm/) |
| 24 | Gemini converter parity: template escaping, skills stripping, array field tracking | 2026-03-17 | 5e52804 | [24-gemini-converter-parity-template-escapin](./quick/24-gemini-converter-parity-template-escapin/) |
| 25 | OpenCode converter parity: isAgent param, subagent_type remap, jsonc resolver, settings refactor | 2026-03-17 | 461e7d6 | [25-opencode-converter-parity-isagent-param-](./quick/25-opencode-converter-parity-isagent-param-/) |
| 26 | Codex deployment parity: sandbox modes, config.toml registration, clean uninstall | 2026-03-17 | f3cddea | [26-codex-deployment-parity-sandbox-modes-co](./quick/26-codex-deployment-parity-sandbox-modes-co/) |
| 27 | copyWithPathReplacement upgrade: isCommand/isGlobal params, Codex markdown conversion, Gemini isCommand gating | 2026-03-17 | eec0ae1 | [27-copywithpathreplacement-upgrade-iscomman](./quick/27-copywithpathreplacement-upgrade-iscomman/) |
| 28 | Cross-runtime parity enforcement: 4 structural CI tests (count, names, content quality, new runtime detection) | 2026-03-17 | b3aab25 | [28-parity-enforcement-test-structural-ci-te](./quick/28-parity-enforcement-test-structural-ci-te/) |
| 29 | Fix Codex agent TOML description field (REVERTED ec54886 - validated against wrong schema) | 2026-03-17 | 425903d | [29-fix-codex-agent-toml-description-field-a](./quick/29-fix-codex-agent-toml-description-field-a/) |
| 30 | Platform change detection scripts + QT29 retrospective + monitoring reference | 2026-03-19 | a59b5d5 | [30-platform-change-detection-scripts-qt29-r](./quick/30-platform-change-detection-scripts-qt29-r/) |
| 31 | Upstream local Codex patches: AGENTS.md gen, capability matrix, collect-signals | 2026-03-19 | d202a70 | [31-upstream-local-codex-patches-agents-md-c](./quick/31-upstream-local-codex-patches-agents-md-c/) |
| 32 | Cross-runtime model profile language and per-runtime resolution | 2026-03-19 | c8db983 | [32-upstream-cross-runtime-model-profile-pat](./quick/32-upstream-cross-runtime-model-profile-pat/) |
| 33 | Reconcile stacked phases 45-48 into a PR to main with CI gating | 2026-03-24 | 61b8bf4 | [33-reconcile-stacked-phases-45-48-into-a-pr](./quick/33-reconcile-stacked-phases-45-48-into-a-pr/) |
| 34 | Apply stage-relevant deliberation review recommendations to roadmap and project docs | 2026-03-24 | ce7b306 | [34-apply-stage-relevant-deliberation-review](./quick/34-apply-stage-relevant-deliberation-review/) |
| 260324-1nf | Repair 48.1 branch lineage, restore proper PR flow, and clean stale local phase branches | 2026-03-24 | 1afa649 | [260324-1nf-repair-48-1-branch-lineage-restore-prope](./quick/260324-1nf-repair-48-1-branch-lineage-restore-prope/) |
| 260325 | Clean leftover local worktree refs | 2026-03-24 | n/a | [260325-clean-leftover-local-worktree-refs](./quick/260325-clean-leftover-local-worktree-refs/) |
| 260326 | Fix sensors.cjs namespace-aware discovery (gsdr? regex) + hook propagation | 2026-03-30 | 813b73e | [260326-fix-audit-tech-debt-sensors-cjs-namespac](./quick/260326-fix-audit-tech-debt-sensors-cjs-namespac/) |

### Key Artifacts

- Fork audit reports: `.planning/fork-audit/` (10 reports informing v1.18 scope)
- Research: `.planning/research/` (4 detailed analysis files: modular-migration, config-migration, migration-testing, integration-pitfalls)
- Governance recommendation memo: `.planning/governance/recommendations/2026-03-23-deliberation-constellation-recommendations.md`
- Phase 48.1 drift ledger: `.planning/phases/48.1-post-audit-upstream-drift-retriage-and-roadmap-reconciliation/UPSTREAM-DRIFT-LEDGER.md`
- Deliberation context: `.planning/deliberations/upstream-drift-retriage-and-roadmap-authority.md`, `.planning/deliberations/v1.17-plus-roadmap-deliberation.md`, `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md`, `.planning/deliberations/deliberation-frontmatter-provenance-and-workflow-consumption.md`, `.planning/deliberations/deliberation-revision-lineage-and-citation-stability.md`

## Session Continuity

Last session: 2026-03-30T12:25:00.000Z
Stopped at: Completed quick task 260326 -- sensors.cjs namespace fix + hook propagation.
Resume file: None
