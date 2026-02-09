# Changelog

All notable changes to GSD Reflect will be documented in this file.

For upstream GSD changelog, see [GSD Changelog](https://github.com/glittercowboy/get-shit-done/blob/main/CHANGELOG.md).

## [Unreleased]

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
