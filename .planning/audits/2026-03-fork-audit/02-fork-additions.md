# Fork-Only Additions Inventory

> Agent: Fork Additions Analysis | Source: 738 files added by fork, not in upstream

## Overview

- **Total fork-only files:** 738
- **Core innovation:** Closed-loop self-improvement system (detect → triage → remediate → verify → learn)

---

## 1. Project Planning & State (628 files — 85%)

### Phase Documentation (379 files)
- 42+ completed phases with structured artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md, RESEARCH.md, CONTEXT.md)
- Each phase has multiple plans with execution records

### Knowledge Base (129 files)
- **Signals (70+):** Detected workflow deviations, struggles, config mismatches with severity/confidence/lifecycle metadata
- **Spikes (3+):** Structured experiments with hypothesis, findings, decision records
- **Reflections (10+):** Pattern analysis reports from phase-end reflection runs
- **Structure:** `signals/`, `spikes/`, `reflections/`, `index.md`

### Deliberations (35 files)
- Strategic thinking across philosophy, architecture, and design decisions
- Subdirectories: `philosophy/` (18 frameworks), root deliberations (cross-platform parity, framework design)

### Codebase Documentation (7 files)
- ARCHITECTURE.md, CONCERNS.md, CONVENTIONS.md, INTEGRATIONS.md, STACK.md, STRUCTURE.md, TESTING.md

### Quick Tasks & Milestones (46 files)
- `.planning/quick/` — incremental task documentation
- `.planning/milestones/` — milestone-level planning and completion records

### Strategy & Configuration (9 files)
- FORK-DIVERGENCES.md, FORK-STRATEGY.md, PROJECT.md, ROADMAP.md, MILESTONES.md, STATE.md, config.json, migration-log.md

---

## 2. Agent Specifications (14 files)

| Agent | Lines | Purpose |
|-------|-------|---------|
| `gsd-reflector.md` | 630 | Signal pattern analysis, lesson distillation, semantic drift detection |
| `gsd-spike-runner.md` | 517 | Execute spikes (BUILD → RUN → DOCUMENT), produce DECISION.md |
| `gsd-artifact-sensor.md` | ~200 | Detect signals from PLAN/SUMMARY/VERIFICATION artifacts |
| `gsd-signal-synthesizer.md` | ~400 | KB writer with dedup, rigor enforcement, trace filtering, cap management |
| `gsd-signal-collector.md` | 47 | Deprecation notice; superseded by multi-sensor architecture |
| `gsd-ci-sensor.md` | 360 | Detect signals from CI/CD failures (GitHub Actions) |
| `gsd-git-sensor.md` | 300 | Detect signals from git history (branch mismatches, stale branches) |
| `gsd-log-sensor.md` | 75 | Detect signals from diagnostic logs |
| 5 KB-related files | — | Knowledge store templates and scripts |

---

## 3. Commands (9 files)

| Command | Purpose |
|---------|---------|
| `reflect.md` | Analyze signals and distill patterns into lessons |
| `collect-signals.md` | Trigger signal collection from phase artifacts |
| `signal.md` | Manually log an observation to the KB |
| `spike.md` | Execute structured experiments to resolve design uncertainty |
| `health-check.md` | Workspace validation with probe-based architecture |
| `deliberate.md` | Engage knowledge base in deliberation |
| `release.md` | Manage release versioning |
| `community.md` | Link to GitHub Discussions |
| `upgrade-project.md` | Upgrade project to latest GSDR |

---

## 4. Reference Documentation (37 files)

| Reference | Purpose |
|-----------|---------|
| `agent-protocol.md` | Shared operational conventions for all agents |
| `reflection-patterns.md` | Pattern detection rules, confidence-weighted scoring, semantic drift |
| `signal-detection.md` | Deviation/struggle/config-mismatch detection, deduplication rules |
| `signal-lifecycle.md` | Signal state machine, triage fields, remediation tracking |
| `health-check.md` | Output format, repair rules, check categories |
| `health-scoring.md` | Two-dimensional scoring model |
| 11 Health Probes | Modular checks: automation-watchdog, config-drift, kb-integrity, signal-density, etc. |
| `knowledge-surfacing.md` | KB query patterns during research/planning/execution |
| `spike-execution.md` | Spike workflow phases, iteration rules, KB integration |
| `capability-matrix.md` | Per-runtime tool availability |
| `devops-detection.md` | GitHub Actions CI/CD pattern detection |
| `dual-installation.md` | GSDR namespace co-installation alongside upstream GSD |
| `model-profiles.md` | Quality vs balanced executor profiles |
| 13 additional reference docs | Continuation format, phase parsing, config validation, etc. |

---

## 5. Hooks (3 files)

| Hook | Purpose |
|------|---------|
| `gsd-ci-status.js` | SessionStart: check GitHub Actions CI status, cache result |
| `gsd-health-check.js` | SessionStart: evaluate cached health score, trigger checks |
| `gsd-version-check.js` | Version checking at install time |

---

## 6. Testing Infrastructure (31 files)

### Unit Tests (3 files, ~3,155 LOC)
- `sensors.test.js` — CLI sensor agent management
- `install.test.js` — Installer including path replacement, KB migration, namespace rewrites
- `automation.test.js` — Automation levels, feature overrides, event tracking, locking

### Integration Tests (4 files, ~2,169 LOC)
- `kb-infrastructure.test.js` — KB directory creation, index rebuilding, migration, templates
- `wiring-validation.test.js` — Path reference validation across agents/workflows/commands
- `multi-runtime.test.js` — Cross-runtime KB path handling
- `cross-runtime-kb.test.js` — KB behavior across runtimes

### Other
- `real-agent.test.js` — E2E placeholder (skipped by default)
- Smoke tests (bash-based, tiered: quick/standard/full)
- Benchmarks (framework + runner + tasks)
- Fixtures (mock projects with full `.planning/`)

---

## 7. Build & CI (9 files)

- `scripts/dev-setup.sh`, `dev-teardown.sh` — Dev environment management
- `scripts/stamp-version.js` — Version stamping
- `.github/workflows/ci.yml` — Vitest suite
- `.github/workflows/publish.yml` — npm publishing
- `.github/workflows/smoke-test.yml` — E2E smoke tests
- `vitest.config.js` — Test runner config

---

## Architectural Summary

```
Signal Detection → Multi-Sensor Orchestrator → Synthesizer → Knowledge Base
                                                                    ↓
Health Check ← Probe Architecture ← Scoring Model          Reflection Engine
                                                                    ↓
Automation Framework ← Feature Manifest ← Config           Lesson Distillation
```
