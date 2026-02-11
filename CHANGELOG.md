# Changelog

All notable changes to GSD Reflect will be documented in this file.

For upstream GSD changelog, see [GSD Changelog](https://github.com/glittercowboy/get-shit-done/blob/main/CHANGELOG.md).

## [Unreleased]

## [1.13.0] - 2026-02-11

### Added
- Synced with upstream GSD v1.18.0 (70 commits merged from v1.11.2)
- Adopted upstream features: --auto mode, --include flag, reapply-patches, JSONC config parsing, update detection (global vs local), parallel research, new-milestone config persistence
- Adopted thin orchestrator pattern (commands delegate to workflow files)
- Adopted gsd-tools.js CLI for commits, config, state management
- Signal tracking validated through production use (13 signals collected, 3 lessons generated from v1.13 milestone)
- KB comparison document: file-based knowledge base vs upstream's reverted MCP Memory approach

### Changed
- 6 commands converted to thin orchestrator pattern (new-project, help, update, signal, upgrade-project, community)
- Fork divergences now tracked explicitly in FORK-DIVERGENCES.md with per-file merge stances
- Config template updated with v1.13.0 version default
- CI/CD workflows updated with upstream and fork test steps

### Fixed
- Adopted 11 upstream bug fixes including:
  - Executor verification improvements (prevent false completions)
  - Context fidelity enforcement (accurate file references)
  - API key prevention in committed code
  - Commit docs config flag support
  - Auto-create config directory on first run
  - Statusline crash prevention
  - Subagent type configuration
- Test suite repaired after architectural migration (135 total tests: 53 vitest + 75 upstream + 7 fork)

## [1.12.2] - 2026-02-10

### Fixed
- Publish workflow switched to npm Trusted Publishing (OIDC) — removes NPM_TOKEN dependency
- Removed `registry-url` from setup-node to allow native OIDC auth (was forcing token-based auth)

## [1.12.1] - 2026-02-09

### Fixed
- GitHub repository URLs corrected from `rookslog` to `loganrooks` in package.json, README, update command, and publish workflow
- CI lint job removed (unused, caused workflow parse failures)
- Wiring validation test allowlists upstream GSD agents installed at runtime

## [1.12.0] - 2026-02-09

### Added
- `/gsd:health-check` command for workspace validation (KB integrity, config validity, stale artifacts)
- `/gsd:upgrade-project` command for seamless version migration with mini-onboarding
- DevOps context capture during `/gsd:new-project` initialization
- DevOps Gaps detection in codebase mapping
- Version tracking via `gsd_reflect_version` in config.json
- Health check configuration (frequency, staleness threshold, blocking behavior)
- Migration log for tracking version upgrades
- Fork-specific README.md and CHANGELOG.md

### Changed
- Config template updated with health_check and devops sections
- Help command updated with new commands
- package.json updated with fork-specific description and keywords

## [1.11.1] - 2026-02-08

### Added
- Knowledge surfacing system (Phase 5) -- automatic retrieval of lessons and spike results during research
- Debugger and executor KB integration
- Researcher and planner agent KB integration
- Knowledge surfacing reference specification

## [1.11.0] - 2026-02-07

### Added
- Reflection engine (Phase 4) -- pattern detection and lesson distillation
- `/gsd:reflect` command for signal analysis
- Milestone reflection integration
- Reflection patterns reference specification

## [1.10.0] - 2026-02-05

### Added
- Spike runner (Phase 3) -- structured experimentation workflow
- `/gsd:spike` command for running experiments
- Spike execution reference and templates
- Spike integration for orchestrator detection

## [1.9.0] - 2026-02-03

### Added
- Signal collector (Phase 2) -- automatic deviation detection
- `/gsd:collect-signals` command for phase analysis
- `/gsd:signal` command for manual signal logging
- Signal detection reference specification

## [1.8.0] - 2026-02-02

### Added
- Knowledge store (Phase 1) -- persistent cross-project knowledge base
- Knowledge store reference specification
- KB directory initialization and index rebuild scripts
- Entry templates for signals, spikes, and lessons

## [1.7.0] - 2026-02-01

### Added
- Deployment infrastructure (Phase 0)
- npm packaging and install scripts
- Vitest test infrastructure
- CI/CD workflows
- Benchmark suite
- Smoke test suite

---

*GSD Reflect is built on top of [GSD](https://github.com/glittercowboy/get-shit-done). See upstream changelog for base system changes.*
