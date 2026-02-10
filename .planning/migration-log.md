# Migration Log

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
