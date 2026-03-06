# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-02)

**Core value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.
**Current focus:** v1.17 Automation Loop -- Phase 40 complete, Phase 41 next

## Current Position

Phase: 40 of 43 (Signal Collection Automation)
Plan: 2 of 2 in current phase
Status: Phase Complete
Last activity: 2026-03-06 - Completed 40-02: Auto-collection postlude integration

Progress: [█████████░] 90%

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
| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 31 | 01 | 4min | 3 | 5 |
| 31 | 02 | 4min | 2 | 2 |
| 31 | 03 | 6min | 2 | 4 |
| 31 | 04 | 4min | 4 | 4 |
| 32 | 01 | 4min | 2 | 6 |
| 32 | 03 | 2min | 1 | 1 |
| 32 | 02 | 4min | 2 | 1 |
| 32 | 04 | 4min | 2 | 2 |
| 33 | 02 | 2min | 2 | 2 |
| 33 | 01 | 4min | 2 | 1 |
| 33 | 03 | 4min | 1 | 1 |
| 33 | 04 | 2min | 1 | 4 |
| 34 | 01 | 2min | 2 | 2 |
| 34 | 02 | 2min | 2 | 2 |
| 34 | 03 | 3min | 2 | 2 |
| 34 | 04 | 5min | 3 | 7 |
| 35 | 02 | 2min | 2 | 3 |
| 35 | 01 | 3min | 2 | 4 |
| 35 | 03 | 4min | 2 | 4 |
| 35 | 04 | 2min | 2 | 7 |

**v1.17:**
| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 36 | 01 | 3min | 2 | 1 |
| 37 | 01 | 3min | 2 | 2 |
| 37 | 02 | 3min | 2 | 2 |
| 37 | 03 | 4min | 3 | 3 |
| 38 | 01 | 3min | 2 | 2 |
| 38 | 02 | 3min | 2 | 5 |
| 38.1 | 01 | 3min | 2 | 20 |
| 38.1 | 02 | 7min | 3 | 10 |
| 38.1 | 03 | 2min | 1 | 2 |
| 39 | 01 | 3min | 1 | 1 |
| 39 | 02 | 4min | 2 | 3 |
| 40 | 01 | 8min | 3 | 4 |
| 40 | 02 | 4min | 2 | 3 |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.13-v1.16 decisions archived in milestones/ directories.

Recent decisions affecting current work:
v1.17: Automation Loop selected as first of 5 post-v1.16 milestones. See .planning/deliberations/v1.17-plus-roadmap-deliberation.md for full multi-milestone roadmap.
v1.17: Philosophical foundations established (6 frameworks, 8 documents, ~65 citable principles). `philosophy:` added as motivation type. 6 new requirements from cross-framework convergence. 5 tagged interventions with falsifiable predictions for empirical evaluation.
v1.17: Roadmap created with 8 phases (36-43), 49 requirements mapped, diverging from research's 6-phase recommendation to separate automation framework (Phase 37) and extensible sensor architecture (Phase 38) as distinct foundational phases.
v1.17 P36: Three specific regex patterns for meta-test detection (readMdFiles, path.join, pathExists) rather than broad .claude/ grep. Four exempt files (install, multi-runtime, cross-runtime-kb, kb-infrastructure).
- [Phase 37]: Automation feature uses manifest config_key detection (not KNOWN_TOP_LEVEL_KEYS), consistent with all other manifest features
- [Phase 37]: Resolution chain order: override BEFORE deferral BEFORE runtime cap
- [Phase 37]: Statistics tracking: 4 lightweight fields per feature (fires, skips, last_triggered, last_skip_reason) -- no arrays or event logs
- [Phase 38]: File system is sole source of truth for sensor existence; config provides overrides only (sensors default to enabled)
- [Phase 38]: Sensor contract: input (phase, dir, project, model_profile), output (JSON in SENSOR OUTPUT delimiters), timeout via frontmatter, config_schema optional
- [Phase 38]: Sensor discovery tries .claude/agents/ first, falls back to agents/ for dev environments
- [Phase 38.1]: KB path fallback pattern: .planning/knowledge/ primary, ~/.gsd/knowledge/ fallback. Lessons deprecated; KB is 3-type (signals, reflections, spikes)
- [Phase 38.1]: kb-rebuild-index.sh conditionally omits Lessons section when lessons/ dir does not exist
- [Phase 38.1]: Signal enrichment uses origin: local naming to avoid collision with existing source: auto|manual detection-method field
- [Phase 39]: CI sensor is first with non-null config_schema (repo + workflow overrides), validating Phase 38 extensibility
- [Phase 39]: Pre-flight checks return degraded:true with warning, never clean empty signals (CI-04)
- [Phase 39]: Test regression detection marked LOW confidence due to log-parsing fragility
- [Phase 39]: CI status hook uses background spawn + cache file pattern (matching gsd-check-update.js), never blocks session start
- [Phase 39]: Cache staleness threshold 1 hour; only show CI FAIL for conclusion=failure (not cancelled/skipped)
- [Phase 40]: Lock stale detection uses file mtime comparison, single JSON output per invocation
- [Phase 40]: Postlude pattern (workflow step) instead of hook-based triggering for cross-runtime signal auto-collection

### Pending Todos

1 pending:
- [HIGH] Dual-install Phase 2: update flow, hook awareness, and version-pinned suppression (tooling)

Note: "Feature manifest system" TODO moved to done -- fully built in v1.15/v1.16.

### Blockers/Concerns

- NPM_TOKEN config (pre-existing from v1.12, not blocking)
- Gitignore friction (pre-existing from v1.12, not blocking)
- 12 tech debt items from v1.16 audit (0 blockers) -- see milestones/v1.16-MILESTONE-AUDIT.md
- Config key inconsistency: spike_sensitivity (flat) vs spike.sensitivity (nested) -- advisory only
- Research flags: Phase 40 (reentrancy lockfile) and Phase 42 (Stop hook counter) need deeper design during planning

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Update installer branding for GSD Reflect | 2026-02-09 | c82ce23 | [001-update-installer-branding-for-gsd-reflect](./quick/001-update-installer-branding-for-gsd-reflect/) |
| 002 | Fix 2 failing install.test.js tests (signal.md -> reflect.md) | 2026-02-15 | ac3f385 | [2-fix-the-2-failing-install-test-js-tests](./quick/2-fix-the-2-failing-install-test-js-tests/) |
| 003 | Fix 6 critical PR#4 bugs (migrateKB collision, dangling symlink, Codex regex, 3 capability guards) | 2026-02-16 | 509936e | [3-fix-6-critical-pr4-bugs-migratekb-collis](./quick/3-fix-6-critical-pr4-bugs-migratekb-collis/) |
| 004 | Create /gsd:release command for automated version bump, changelog, tag, and GitHub Release | 2026-02-16 | 7902519 | [4-create-gsd-release-command-for-automated](./quick/4-create-gsd-release-command-for-automated/) |
| 005 | Remove C7-C10 self-fulfilling tests (15 tests removed, suite now 140 passing) | 2026-02-16 | 001e7aa | [5-rewrite-c7-c10-self-fulfilling-tests-to-](./quick/5-rewrite-c7-c10-self-fulfilling-tests-to-/) |
| 006 | Release v1.15.0 to npm with reflect- tag prefix | 2026-02-24 | 7fc4a7c | [6-release-v1-15-0-to-npm-with-reflect-tag-](./quick/6-release-v1-15-0-to-npm-with-reflect-tag-/) |
| 007 | Dual-install detection/awareness (Phase 1): VERSION comparison, cross-scope warning, description injection, reference doc | 2026-02-25 | 0346ac6 | [7-implement-dual-installation-detection-an](./quick/7-implement-dual-installation-detection-an/) |
| 008 | Recover lost code: knowledge-store.md + dual-install in resume-project.md to npm source | 2026-02-26 | 9c7e7a9 | [8-recover-lost-code-from-deleted-local-pat](./quick/8-recover-lost-code-from-deleted-local-pat/) |
| 009 | Fix installer local patch detection false positives (pruneRedundantPatches) | 2026-02-26 | b979680 | [9-fix-installer-local-patch-detection-to-a](./quick/9-fix-installer-local-patch-detection-to-a/) |
| 010 | Fix pre-v1.16 tech debt: add agent-protocol refs to 5 agents, copy kb-templates to npm source | 2026-02-27 | 824c6c1 | [10-fix-pre-v1-16-tech-debt-add-agent-protoc](./quick/10-fix-pre-v1-16-tech-debt-add-agent-protoc/) |
| 011 | Add DEV indicator for local dev installs (VERSION+dev suffix, statusline tag, version check fix) | 2026-03-01 | be5a1e4 | [11-add-dev-indicator-to-statusline-when-usi](./quick/11-add-dev-indicator-to-statusline-when-usi/) |
| 012 | Persist reflection reports to ~/.gsd/knowledge/reflections/ | 2026-03-01 | ea9a758 | [12-add-persistent-report-file-output-to-ref](./quick/12-add-persistent-report-file-output-to-ref/) |
| 013 | Signal lifecycle reconciliation script, health check watchdog, design principle | 2026-03-04 | bb26acc | [13-implement-signal-lifecycle-deliberation-](./quick/13-implement-signal-lifecycle-deliberation-/) |
| 014 | Update collect-signals.md rebuild_index to use project-local kb-rebuild-index.sh | 2026-03-05 | ae40d86 | [14-update-collect-signals-md-to-use-plannin](./quick/14-update-collect-signals-md-to-use-plannin/) |
| 015 | Cross-runtime parity testing: glob hook discovery, name parity, Gemini tool names, hook registration sync | 2026-03-05 | d1f2e2f | [15-implement-cross-runtime-parity-testing-o](./quick/15-implement-cross-runtime-parity-testing-o/) |
| 016 | Auto-run hooks build in installer if hooks/dist/ missing | 2026-03-06 | 76c0175 | [16-auto-run-hooks-build-in-installer-if-hoo](./quick/16-auto-run-hooks-build-in-installer-if-hoo/) |

### Roadmap Evolution

v1.12 complete (Phases 0-6). v1.13 complete (Phases 7-12). v1.14 complete (Phases 13-21). v1.15 complete (Phases 22-30). v1.16 complete (Phases 31-35). All 5 milestones shipped, 105 plans completed. v1.17 roadmap created (Phases 36-43, 18 plans estimated).

### Key Artifacts

- Tag `reflect-v1.12.2-pre-sync` -- immutable rollback point on main
- Tag `reflect-v1.13.0` -- annotated release tag on commit d6a250b
- Tag `reflect-v1.14.0` -- annotated release tag for multi-runtime interop
- Tag `reflect-v1.15.0` -- annotated release tag for backlog & update experience
- Tag `reflect-v1.16.0` -- annotated release tag for signal lifecycle & reflection
- **Tag convention:** Fork tags use `reflect-v*` prefix to avoid collision with upstream tags. Upstream remote configured with `--no-tags`.
- PR #3 -- sync/v1.13-upstream to main (https://github.com/loganrooks/get-shit-done-reflect/pull/3)
- `.planning/FORK-STRATEGY.md` -- conflict resolution runbook + Merge Decision Log
- `.planning/FORK-DIVERGENCES.md` -- per-file merge stances, post-merge risk recalibration

## Session Continuity

Last session: 2026-03-06
Stopped at: Phase 40 executed and verified (7/7 must-haves). Next: Phase 41.
Resume file: None
Deliberation context: .planning/deliberations/project-local-knowledge-base.md (Phase 38.1), .planning/deliberations/deliberation-system-design.md (affects Phase 38+ planning)
