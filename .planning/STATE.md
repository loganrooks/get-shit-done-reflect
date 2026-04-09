---
gsd_state_version: 1.0
milestone: v1.20
milestone_name: Signal Infrastructure & Epistemic Rigor
status: executing
stopped_at: All 3 plans complete (55.2-01, 55.2-02, 55.2-03). Verification next.
last_updated: "2026-04-09T03:20:00.000Z"
last_activity: 2026-04-09 -- Phase 55.2 all plans complete
progress:
  total_phases: 12
  completed_phases: 3
  total_plans: 12
  completed_plans: 10
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.
**Current focus:** v1.20 Phase 57 -- Measurement & Telemetry Baseline (ready to plan)

## Current Position

Phase: 55.2 of 64 (Codex Runtime Substrate)
Plan: 3 of 3 (complete)
Status: Verifying
Last activity: 2026-04-09 -- All 3 plans complete, verification pending

Progress: [███.......] 33%

## Performance Metrics

**v1.20 Current:**

- Plans completed: 8
- 55-01: 1min, 2 tasks, 5 files
- 55-02: 9min, 2 tasks, 5 files
- 55-03: 9min, 2 tasks, 6 files
- 55-04: 6min, 2 tasks, 4 files
- 56-01: 6min, 3 tasks, 5 files
- 56-02: 5min, 2 tasks, 3 files
- 56-03: 10min, 2 tasks, 1 file
- 55.1-01: 4min, 2 tasks, 4 files
- 55.2-01: 3min, 2 tasks, 3 files
- 55.2-02: 3min, 2 tasks, 2 files
- 55.2-03: 3min, 2 tasks, 2 files

**v1.18 Final:**

- Plans completed: 37
- See milestones/v1.18-ROADMAP.md for per-plan breakdown

*Updated after each plan completion*

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.13-v1.18 decisions archived in milestones/ directories.

Recent decisions affecting current work:

- [55-01]: Adopted model-profiles.cjs as-is from upstream f7549d43; plan mentioned resolveModel but upstream exports getAgentToModelMapForProfile -- file correct as upstream version
- [55-01]: Single commit for all 5 pure upstream modules per commit-per-merge-category strategy
- [Roadmap]: 10 phases (55-64) derived from 53 requirements across 9 categories
- [Roadmap]: Phase 55 (SYNC-01) must precede all other v1.20 work -- correctness substrate
- [Roadmap]: Phase 57 (telemetry baseline) must complete before Phase 58 (structural gates) -- ARCHITECTURE.md anti-pattern 4
- [Roadmap]: Phases 60 and 61 (sensors + spike methodology) can proceed in parallel -- independent workstreams
- [Roadmap]: Phase 64 (parallel execution) separately gated -- only triggered when parallel phases become regular practice
- [Roadmap]: Spike programme infrastructure (SPIKE-10a/b/c) in scope as Phase 63, after spike methodology operational
- [Roadmap]: SPIKE-08 gated on SPIKE-01 completion; auto-defers to v1.21 if SPIKE-01 ships late
- [Phase 55]: core.cjs: resolveModelInternal preserves fork gsdr- prefix normalization AND opus->inherit conversion (both fork-specific Claude Code behaviors)
- [Phase 55]: config.cjs: cmdForkConfigGet replaced with cmdConfigGetGraceful fork envelope {key,value,found} -- upstream cmdConfigGet returns raw value, fork tests require envelope
- [Phase 55]: model-profiles.cjs: 11 fork-only agents added after inline MODEL_PROFILES removed from core.cjs
- [55-03]: phase.cjs and roadmap.cjs wholesale replaced -- fork versions were simplified subsets of upstream, not extensions; no unique fork additions to re-apply
- [55-03]: complete-milestone.md C2 shell robustness guards already present in upstream v1.34.2 -- no re-application needed
- [55-03]: installer: applied 7 of 11 upstream fixes; 4 not applicable (.sh hooks, package.json); all fork extensions preserved (replacePathsInContent, dual-directory, gsdr- branding)
- [55-03]: buildLocalHookCommand: $CLAUDE_PROJECT_DIR anchor (#1906) combined with existing test -f worktree guard -- both protections active
- [55-03]: uninstall per-hook granularity: isGsdrHookCommand covers both gsdr- (current) and gsd- (legacy) namespaces
- [Phase 55-04]: gsd-tools.test.js: upstream path does not exist at f7549d43; restored fork version and added 9 correctness regression tests inline adapted from upstream atomic-write, locking, frontmatter test files
- [56-01]: KB-01 lifecycle states corrected to Phase 31 model (detected/triaged/blocked/remediated/verified/invalidated); KB-01 draft used task/issue states (proposed/in_progress) which conflicted with all existing implementation
- [56-01]: blocked added as optional lifecycle state between triaged and remediated -- compatible with Phase 31 model, useful for signals with external blockers
- [56-01]: node:sqlite lazy-required via getDbSync() in kb.cjs -- prevents gsd-tools.cjs failing on Node <22.5.0 for non-KB commands (RESEARCH.md Pitfall 7)
- [56-01]: source field deprecated in knowledge-store.md v2.1.0; detection_method + origin replace it with richer provenance semantics
- [56-01]: kb.db gitignored per KB-05 dual-write invariant -- SQLite is derived cache, files are source of truth
- [56-02]: Router case 'kb' and require('./lib/kb.cjs') were already wired during Plan 01 deviation -- Plan 02 added only the missing usage message entry
- [56-02]: package.json engines.node bumped from >=16.7.0 to >=22.5.0; CHANGELOG.md Unreleased documents breaking change per KB-11
- [56-02]: kb rebuild validated end-to-end: 200 files (199 signals + 1 spike), 0 errors, all 4 schema generations handled
- [Phase 56-03]: Task 2 migration carry-forward: migration was pre-completed in Plan 02 (183 files), Task 2 became validation-only
- [Phase 56-03]: Dual-write invariant proven on real 200-file corpus: delete kb.db + rebuild produces identical counts (199 signals, 1 spike, 0 errors)
- [55.1-01]: Extracted findCurrentMilestoneRange as internal helper (not exported) shared by extractCurrentMilestone and replaceInCurrentMilestone
- [55.1-01]: replaceInCurrentMilestone falls back to lastIndexOf heuristic when cwd omitted -- backward compatibility preserved
- [55.1-01]: resolveCurrentMilestoneVersion extracted as separate helper to avoid duplicating STATE.md reading logic
- [Phase 55.1]: Converted .gitkeep writes to atomicWriteFileSync for consistency -- negligible overhead
- [Phase 55.1]: Worktree check placed after required_reading but before process/step blocks -- earliest viable execution point
- [55.2-01]: Codex hooks detection uses regex on config.toml content rather than TOML parser -- lightweight, no new dependency
- [55.2-01]: Heuristic fallback placed inside existing try/catch else-branch after .claude/settings.json check -- no new control flow paths
- [55.2-02]: Existing "prefers .claude over agents" test updated to "merges from both" -- behavior intentionally changed from short-circuit to merge
- [55.2-02]: TOML parsing uses simple line-by-line regex for explicit top-level keys, not a full TOML parser -- sensor contract fields are not top-level TOML keys per research
- [55.2-02]: Helper functions (discoverSensorDirs, discoverSensors, parseSensorMetadata) exported for testability
- [55.2-03]: Codex hooks documented as Y (under development) [6] with feature flag gating rather than flat Y -- reflects conditional availability pending codex_hooks flag stabilization
- [55.2-03]: Living document pattern established for drift-prone references: YAML frontmatter with last_audited version, next_audit_due, and Validation Commands table with executable re-verification commands

### Roadmap Evolution

- Phase 55.1 inserted after Phase 55: Upstream Bug Patches (URGENT) — patch #2005 details-wrapped ROADMAP corruption, #1972 incomplete atomicWriteFileSync, #1981 worktree reset --soft data loss
- Phase 55.2 inserted after Phase 55.1: Codex Runtime Substrate -- runtime detection fixes, documentation drift corrections, parity smoke test. Derived from cross-model audit consensus (Claude, GPT-5.4 xhigh, Opus review, Sonnet review). Requirements: CODEX-01, CODEX-02, CODEX-05
- Gemini CLI and OpenCode deprecated as tested runtimes -- narrowing to Claude Code + Codex CLI only. Community-maintained status in capability-matrix.md. Decision documented in `.planning/deliberations/drop-gemini-opencode-focus-codex.md`

### Pending Todos

3 pending (carried from v1.18):

- [HIGH] Dual-install Phase 2: update flow, hook awareness, and version-pinned suppression (tooling)
- [HIGH] Local patch archive: versioned history instead of single-snapshot overwrite (installer)
- [MEDIUM] Revisit provisional corpus grounding set (planning)

### Blockers/Concerns

- NPM_TOKEN config (pre-existing from v1.12, not blocking)
- Gitignore friction (pre-existing from v1.12, not blocking)
- Token count reliability in session-meta (109 input_tokens for 513-minute session is implausibly low) -- validation spike required before baselines committed in Phase 57

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260408-snh | Implement v1.20 roadmap amendments: Phase 55.2, CODEX requirements, Gemini/OpenCode deprecation | 2026-04-09 | 68309db | [260408-snh](./quick/260408-snh-implement-v1-20-roadmap-amendments-inser/) |

### Key Artifacts

- Audit evidence base: `.planning/audits/session-log-audit-2026-04-07/` (32 reports, 100 sessions, 165 findings)
- Research documents: `.planning/research/` (9 v1.20 research docs)
- Milestone steering brief: `.planning/MILESTONE-CONTEXT.md`

## Session Continuity

Last session: 2026-04-09T03:20:00.000Z
Stopped at: All 3 plans complete. Verification pending.
Resume file: None
