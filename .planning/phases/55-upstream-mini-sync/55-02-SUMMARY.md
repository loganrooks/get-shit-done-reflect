---
phase: 55-upstream-mini-sync
plan: 02
model: claude-sonnet-4-6
context_used_pct: 42
subsystem: upstream-sync
tags: [upstream, core-merge, frontmatter, config, atomic-writes, locking, signal-schema]
requires:
  - phase: 55-upstream-mini-sync
    plan: 01
    provides: model-profiles.cjs adopted; pure upstream modules at v1.34.2
provides:
  - core.cjs at v1.34.2 + fork extensions: atomicWriteFileSync, withPlanningLock, normalizeMd,
    workstream-aware planningDir/planningPaths, session workstream helpers, MODEL_PROFILES
    re-exported; fork: parseIncludeFlag, loadManifest, loadProjectConfig, atomicWriteJson
    delegating to atomicWriteFileSync, gsdr- prefix normalization in resolveModelInternal
  - frontmatter.cjs at v1.34.2 + fork signal schema: splitInlineArray quoted-comma fix,
    CRLF tolerance, improved parseMustHavesBlock, FORK_SIGNAL_SCHEMA tiered validation
  - config.cjs at v1.34.2 + fork keys: isValidConfigKey with dynamic patterns, withPlanningLock,
    atomicWriteFileSync, cmdConfigSetModelProfile, fork config namespaces recognized
  - model-profiles.cjs: extended with 11 fork-specific agents
affects: [55-upstream-mini-sync, Plans 03-04 (installer, phase/roadmap modules)]
tech-stack:
  added: []
  patterns: [atomic-write-delegation (atomicWriteJson -> atomicWriteFileSync), graceful-config-get envelope, dynamic-key-pattern validation]
key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/core.cjs
    - get-shit-done/bin/lib/frontmatter.cjs
    - get-shit-done/bin/lib/config.cjs
    - get-shit-done/bin/lib/model-profiles.cjs
    - get-shit-done/bin/gsd-tools.cjs
key-decisions:
  - "core.cjs: resolveModelInternal preserves fork gsdr- prefix normalization AND opus->inherit conversion (both fork-specific Claude Code behaviors)"
  - "model-profiles.cjs: 11 fork-only agents added (advisor-researcher, reflector, spike-runner, sensors, checker, advisor) -- inline MODEL_PROFILES removal forced this"
  - "config.cjs: cmdForkConfigGet replaced with cmdConfigGetGraceful (fork envelope {key,value,found}) -- upstream cmdConfigGet returns raw value, fork tests require envelope"
  - "config.cjs: health_check.* and devops.* added as dynamic pattern namespaces in isValidConfigKey -- fork tests use these sub-keys"
  - "gsd-tools.cjs router: config-set routed to upstream cmdConfigSet, config-get routed to cmdConfigGetGraceful"
duration: 9min
completed: 2026-04-08
---

# Phase 55 Plan 02: Upstream Mini-Sync Hybrid Modules Summary

**Hybrid-merged core.cjs (725 -> 1627 lines), frontmatter.cjs (387 -> 471 lines), and config.cjs (270 -> 520 lines) with upstream v1.34.2 additions, preserving all fork-specific extensions and passing all 652 tests.**

## Performance

- **Duration:** ~9 minutes
- **Tasks:** 2/2 completed
- **Files modified:** 5 (core.cjs, frontmatter.cjs, config.cjs, model-profiles.cjs, gsd-tools.cjs)

## Accomplishments

### Task 1: core.cjs hybrid merge

- Replaced fork's 725-line core.cjs with upstream v1.34.2 base (1587 lines)
- Removed inline MODEL_PROFILES table (now from model-profiles.cjs via require)
- Preserved and adapted fork extensions:
  - `resolveModelInternal`: gsdr- prefix normalization + opus->inherit conversion retained
  - `parseIncludeFlag`, `loadManifest`, `loadProjectConfig` copied after main exports block
  - `atomicWriteJson` refactored to delegate to upstream's `atomicWriteFileSync` (no more own tmp/rename pattern)
  - `MODEL_PROFILES` re-exported for commands.cjs backward compatibility
- Upstream additions gained: `atomicWriteFileSync` (PID-scoped tmp), `withPlanningLock`, `normalizeMd`, workstream-aware `planningDir`/`planningPaths`/`planningRoot`, session-scoped workstream detection, `CONFIG_DEFAULTS`, `detectSubRepos`, `reapStaleTempFiles`, `checkAgentsInstalled`, `extractCurrentMilestone`

### Task 2: frontmatter.cjs + config.cjs hybrid merge

**frontmatter.cjs:**
- Upstream base: `splitInlineArray` (quoted-comma fix, Area 18), CRLF tolerance in parsing, null byte guards, `normalizeMd` at write points, improved `parseMustHavesBlock` with dynamic indent detection and empty-block warning
- Fork preserved: `FORK_SIGNAL_SCHEMA`, tiered validation in `cmdFrontmatterValidate` (conditional/recommended fields, backward_compat handling, evidence content check)

**config.cjs:**
- Upstream base: `isValidConfigKey` with dynamic patterns (`agent_skills.*`, `features.*`), `withPlanningLock` for atomic config writes, `atomicWriteFileSync`, `buildNewProjectConfig`, `ensureConfigFile`, `setConfigValue`, `cmdConfigSetModelProfile`, `cmdConfigNewProject`, `--default` flag in `cmdConfigGet`
- Removed `cmdForkConfigSet`/`cmdForkConfigGet` -- upstream now natively handles their capabilities
- Added `cmdConfigGetGraceful` -- fork envelope `{key, value, found}` required by fork tests and workflows
- Fork config keys recognized: `gsd_reflect_version`, `health_check`, `health_check.*`, `knowledge_debug`, `devops.*`

## Task Commits

1. **Task 1: core.cjs hybrid merge** - `4d0e8e1f`
2. **Task 2: frontmatter.cjs + config.cjs + deviation fixes** - `f74ca0a9`

## Files Created/Modified

- `get-shit-done/bin/lib/core.cjs` - 725 -> 1627 lines; upstream v1.34.2 base + fork extensions
- `get-shit-done/bin/lib/frontmatter.cjs` - 387 -> 471 lines; splitInlineArray + fork signal schema
- `get-shit-done/bin/lib/config.cjs` - 270 -> 520 lines; upstream validation + fork keys/graceful-get
- `get-shit-done/bin/lib/model-profiles.cjs` - 71 -> 84 lines; 11 fork-specific agents added
- `get-shit-done/bin/gsd-tools.cjs` - router: cmdForkConfigSet/Get -> cmdConfigSet/cmdConfigGetGraceful

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fork-specific agents missing from model-profiles.cjs**
- **Found during:** Task 1 verification (model-resolution tests failed)
- **Issue:** Upstream model-profiles.cjs has 17 agents; fork's inline MODEL_PROFILES had 28. After removing the inline table and importing from model-profiles.cjs, 11 fork-only agents (signal-collector, signal-synthesizer, artifact-sensor, ci-sensor, git-sensor, log-sensor, reflector, spike-runner, checker, advisor, advisor-researcher) were missing, causing `unknown_agent: true` in test assertions.
- **Fix:** Added all 11 fork-specific agents to model-profiles.cjs with appropriate profile tiers
- **Files modified:** `get-shit-done/bin/lib/model-profiles.cjs`
- **Commit:** `f74ca0a9`

**2. [Rule 1 - Bug] resolveModelInternal opus->inherit conversion missing**
- **Found during:** Task 1 verification (model-resolution quality tier tests failed)
- **Issue:** Upstream's `resolveModelInternal` returns `'opus'` directly. Fork's tests expect `'inherit'` when alias is `'opus'` (Claude Code compatibility requirement).
- **Fix:** Added `alias === 'opus' ? 'inherit' : alias` conversion in the non-resolve_model_ids path
- **Files modified:** `get-shit-done/bin/lib/core.cjs`
- **Commit:** `f74ca0a9`

**3. [Rule 3 - Blocking] gsd-tools.cjs router called removed functions**
- **Found during:** Task 2 verification (fork tests failed with TypeError)
- **Issue:** Router at lines 288/293 still called `config.cmdForkConfigSet` and `config.cmdForkConfigGet` which no longer exist. Fork tests all failed.
- **Fix:** Routed `config-set` -> `cmdConfigSet` (upstream); `config-get` -> `cmdConfigGetGraceful` (fork envelope wrapper)
- **Files modified:** `get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/bin/lib/config.cjs`
- **Commit:** `f74ca0a9`

**4. [Rule 1 - Bug] config.cjs missing health_check.* and devops.* dynamic key patterns**
- **Found during:** Task 2 verification (fork config tests failed)
- **Issue:** Fork tests set `health_check.frequency`, `health_check.stale_threshold_days`, `devops.ci_provider`, `devops.commit_convention` but only a few specific sub-keys were in VALID_CONFIG_KEYS.
- **Fix:** Added `health_check.*` and `devops.*` as dynamic namespace patterns in `isValidConfigKey`
- **Files modified:** `get-shit-done/bin/lib/config.cjs`
- **Commit:** `f74ca0a9`

**5. [Rule 1 - Bug] config-get envelope format mismatch**
- **Found during:** Task 2 verification (fork config test: "config-get produces output via router")
- **Issue:** Upstream `cmdConfigGet` returns raw value directly; fork tests expect `{key, value, found}` envelope. Old `cmdForkConfigGet` returned this envelope.
- **Fix:** Added `cmdConfigGetGraceful` to config.cjs; routes `config-get` through it
- **Files modified:** `get-shit-done/bin/lib/config.cjs`, `get-shit-done/bin/gsd-tools.cjs`
- **Commit:** `f74ca0a9`

## Self-Check: PASSED

- `get-shit-done/bin/lib/core.cjs` - FOUND (1627 lines, atomicWriteFileSync + fork extensions confirmed)
- `get-shit-done/bin/lib/frontmatter.cjs` - FOUND (471 lines, splitInlineArray + FORK_SIGNAL_SCHEMA confirmed)
- `get-shit-done/bin/lib/config.cjs` - FOUND (520 lines, isValidConfigKey + fork keys confirmed)
- `get-shit-done/bin/lib/model-profiles.cjs` - FOUND (84 lines, 11 fork agents added confirmed)
- `get-shit-done/bin/gsd-tools.cjs` - FOUND (router updated: cmdConfigSet + cmdConfigGetGraceful)
- Commit `4d0e8e1f` - FOUND (feat(55-02): hybrid-merge core.cjs)
- Commit `f74ca0a9` - FOUND (feat(55-02): hybrid-merge frontmatter.cjs and config.cjs)
- All 652 tests pass: 443 vitest + 191 upstream node:test + 18 fork node:test
