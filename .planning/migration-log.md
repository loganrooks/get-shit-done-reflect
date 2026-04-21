# Migration Log

## 1.19.4+dev -> 1.19.6+dev (2026-04-20T11:56:39.672Z)

### Changes Applied

---

## 1.19.1 -> 1.19.4+dev (2026-04-11T00:10:22.519Z)

### Changes Applied
- Added `health_check.workflow_thresholds`
- Added `health_check.resolution_ratio_threshold`
- Added `health_check.reactive_threshold`
- Added `health_check.cache_staleness_hours`
- Added `signal_lifecycle` section
- Added `signal_collection` section
- Added `spike` section
- Added `automation.level`
- Added `automation.overrides`
- Added `automation.context_threshold_pct`
- Updated `gsd_reflect_version`: `1.19.1` -> `1.19.4+dev`
- Updated manifest_version: 1 -> 2

---

Tracks version upgrades applied to this project.

## 0.0.0 -> 1.12.2 (2026-02-09T00:00:00Z)

### Changes Applied
- Added `health_check` section to config.json (frequency: milestone-only, stale_threshold_days: 7, blocking_checks: false)
- Added `devops` section to config.json (ci_provider: github-actions, deploy_target: none, commit_convention: conventional, environments: [])
- Added `gsd_reflect_version: "1.12.2"` to config.json

### User Choices
- Health check frequency: milestone-only (default)
- Health check blocking: false (default)
- DevOps CI provider: github-actions (inferred from project)
- DevOps deploy target: none (default)
- DevOps commit convention: conventional (inferred from project)

---

*Log is append-only. Each migration is recorded when applied.*
