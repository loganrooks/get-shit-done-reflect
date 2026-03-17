# Fork Divergence Audit Report

> **Date:** 2026-03-10
> **Fork:** `loganrooks/get-shit-done-reflect` (v1.17.1)
> **Upstream:** `gsd-build/get-shit-done` (v1.22.4)
> **Last sync:** 2026-02-10 (v1.18.0 merge, commit f97291a)
> **Scope:** Comprehensive analysis of divergence extent, nature, and design rationale

---

## 1. Quantitative Overview

| Metric | Value |
|--------|-------|
| Fork commits ahead of upstream | 748 |
| Upstream commits not in fork | 244 |
| Modified upstream files | 18 |
| Fork-only files added | 738 |
| Fork version | v1.17.1 |
| Upstream version | v1.22.4 |
| Version gap | 5 minor versions (v1.18→v1.22) |
| Fork point | `2347fca` (upstream v1.11.1) |

---

## 2. Upstream Changes Since Last Sync (244 commits)

### 2.1 Breaking Architectural Change: Code Modularization

**This is the single most significant upstream change.** The monolithic `gsd-tools.js` (4,597 lines) has been:

1. **Renamed** from `.js` to `.cjs` (ESM conflict prevention)
2. **Split** into 11 domain modules under `lib/`:
   - `commands.cjs`, `config.cjs`, `core.cjs`, `frontmatter.cjs`
   - `init.cjs`, `milestone.cjs`, `phase.cjs`, `roadmap.cjs`
   - `state.cjs`, `template.cjs`, `verify.cjs`
3. **145 new tests** created across 12 test files for the modules

**Fork impact:** Our `gsd-tools.js` (6,651 lines with fork additions) still uses the old monolithic structure. This is the hardest divergence to reconcile — it's not a simple merge but an architectural migration.

### 2.2 New Upstream Features

| Feature | Description | Fork Overlap? |
|---------|-------------|---------------|
| Codex multi-agent parity | Agent role generation, input mapping | Fork has Codex support in installer but different approach |
| Nyquist validation layer | AI output quality auditor agent | No overlap — fork doesn't have this |
| Context monitor hook | Real-time token usage warnings | No overlap |
| `/gsd:add-tests` command | Post-phase test generation | No overlap |
| `/gsd:cleanup` command | Phase/milestone cleanup | No overlap |
| `/gsd:health` command | Planning directory validation | Fork has `/gsdr:health-check` — similar intent, different implementation |
| `/gsd:validate-phase` command | Comprehensive phase validation | No overlap |
| `discuss-phase` code-awareness | Codebase scouting before discussion | No overlap |
| `quick --discuss` flag | Lightweight pre-planning discussion | No overlap |
| Per-agent model overrides | Override model per agent type | No overlap |
| Config migration system | Auto-migration of renamed settings | Fork has migration system in feature-manifest |
| Windows compatibility fixes | Path handling, glob expansion, JSON quoting | N/A (fork targets Linux) |

### 2.3 Upstream Breaking Changes

| Change | Impact on Fork |
|--------|---------------|
| `depth` → `granularity` config rename | Must adopt to stay compatible |
| `.js` → `.cjs` extension rename | Major — affects imports, test setup, build scripts |
| Modular `lib/` structure | Major — fork's gsd-tools.js additions need to be relocated |

### 2.4 Upstream Version Progression

| Version | Key Changes |
|---------|-------------|
| v1.19.0 | Modular refactor begins |
| v1.20.0 | Test infrastructure (c8, node:test) |
| v1.22.0 | Codex multi-agent parity |
| v1.22.3 | Nyquist hardening, `depth→granularity` |
| v1.22.4 | Windows @file: protocol fix |

---

## 3. Fork-Only Additions (738 files)

### 3.1 Core Feature Systems

The fork implements a **closed-loop self-improvement system** that upstream does not have:

```
Upstream GSD:     Plan → Execute → Done
Fork adds:        Detect (signals) → Triage → Remediate → Verify → Learn
```

#### Signal Detection & Collection
- **Multi-sensor architecture:** Artifact sensor + Git sensor + CI sensor + Log sensor
- **Synthesizer:** Single KB writer with deduplication, epistemic rigor enforcement, per-phase caps
- **Storage:** Project-local `.planning/knowledge/` with `~/.gsd/knowledge/` cross-project store
- **Lifecycle:** `detected → triaged → remediated → verified → invalidated` state machine
- **Schema validation:** Tiered (required/conditional/recommended) in gsd-tools.js

#### Reflection Engine
- **Pattern detection:** Confidence-weighted scoring on signal clusters
- **Counter-evidence seeking:** Actively validates patterns before proposing lessons
- **Lesson distillation:** Converts patterns into scope-conditional actionable knowledge
- **Semantic drift tracking:** Detects workflow quality regression over phases

#### Spike Workflow
- **Structured experiments:** DESIGN.md → BUILD/RUN → DECISION.md
- **KB persistence:** ADR-style entries for future reference
- **Iteration support:** Max 2 rounds with auto-narrowing

#### Health Check System
- **Probe-based architecture:** 11 modular probe specs in reference docs
- **Two-dimensional scoring:** Infrastructure (binary) + Workflow (continuous)
- **Advisory thresholds:** Scores guide attention, never gate decisions
- **Auto-repair:** `--fix` flag for repairable issues

#### Automation Framework
- **4-level system:** manual (0) / nudge (1) / prompt (2) / auto (3)
- **Per-feature overrides** with context-aware deferral
- **Trigger points:** Post-phase signal collection, session-start health check, threshold-based reflection
- **Runtime capability capping:** Features degrade gracefully when hooks unavailable

#### Feature Manifest System
- **Declarative schema** (`feature-manifest.json`) for 7 feature areas
- **Init prompts, auto-detection, validation rules** per feature
- **No upstream equivalent** — upstream embeds config in runtime code

### 3.2 File Inventory by Category

| Category | Files | Key Contents |
|----------|-------|-------------|
| Phase execution history | 379 | PLAN.md, SUMMARY.md, VERIFICATION.md per phase |
| Knowledge base entries | 129 | 70+ signals, 3+ spikes, 10+ reflections |
| Deliberations | 35 | Design decisions, philosophical frameworks |
| Reference docs | 37 | Signal detection, lifecycle, health probes, patterns |
| Agent specs | 14 | Reflector, spike-runner, sensors, synthesizer |
| Commands | 9 | reflect, signal, spike, health-check, deliberate, release, etc. |
| Tests | 31 | 277 vitest tests + smoke + benchmarks |
| Codebase docs | 7 | Architecture, concerns, conventions, stack |
| Hooks | 3 | CI status, health check, version check |
| Build/scripts | 6 | Dev setup, stamp-version, benchmark tooling |
| CI workflows | 3 | ci.yml, publish.yml, smoke-test.yml |
| Quick tasks | 46 | Incremental fix documentation |
| Strategy docs | 9 | Fork strategy, divergences, project, roadmap |

### 3.3 Namespace Isolation System

The fork implements complete namespace rewriting during installation to allow co-existence with upstream GSD:

| Pass | Transformation | Purpose |
|------|---------------|---------|
| 3a | `get-shit-done/` → `get-shit-done-reflect/` | Directory references |
| 3b | `/gsd:` → `/gsdr:` | Command prefix |
| 3c | `gsd-` → `gsdr-` (with `gsd-tools` exemption) | Agent/hook prefix |
| 3d | `GSD >` → `GSDR >` | UI banners |

---

## 4. Modified Upstream Files (18 files)

### 4.1 By Risk Category

**MEDIUM risk (need manual merge):**

| File | Nature of Changes | Merge Complexity |
|------|-------------------|-----------------|
| `package.json` | Name, repo URLs, vitest deps, 10 npm scripts | Hybrid merge — combine deps, keep fork identity |
| `get-shit-done/templates/config.json` | Added `gsd_reflect_version`, `health_check`, `devops` sections | Section merge |

**LOW risk (auto-resolvable or fork-wins):**

| File | Nature of Changes |
|------|-------------------|
| `README.md` | Complete rewrite (fork wins) |
| `CHANGELOG.md` | Fork-specific (fork wins) |
| `package-lock.json` | Generated (regenerate) |
| `bin/install.js` | +1,147 lines: namespace isolation, KB migration, Codex support, error handling |
| `hooks/gsd-check-update.js` | Package name change only |
| `commands/gsd/help.md` | Thin orchestrator + fork section |
| `commands/gsd/new-project.md` | Thin orchestrator + fork DevOps context |
| `commands/gsd/update.md` | Thin orchestrator + fork branding |
| `get-shit-done/references/planning-config.md` | Added knowledge_debug, knowledge_surfacing_config |
| `get-shit-done/templates/context.md` | Added open_questions section |
| `get-shit-done/templates/project.md` | Added open_questions section |
| `get-shit-done/templates/research.md` | Enhanced open_questions structure |
| `get-shit-done/templates/codebase/concerns.md` | Added DevOps Gaps section |
| `scripts/build-hooks.js` | Changed from static whitelist to dynamic glob discovery |
| `.gitignore` | Added benchmark results, lockfiles, .vscode |

### 4.2 Critical Modification: `get-shit-done/bin/gsd-tools.js`

**Key finding:** This file is effectively **fork-original**, not a modified upstream file.

- Upstream renamed to `gsd-tools.cjs` and split into 11 modules
- Fork kept the old monolithic structure and added 2,126 lines across 27 commits
- Fork additions span Phases 23–42: manifest system, backlog CRUD, signal validation, automation framework, sensor architecture, health probes, reflection counter
- **No merge conflict with upstream** (upstream's file is now `.cjs` in a different structure)
- **But:** Fork additions need to be migrated into upstream's modular structure to adopt the refactor

### 4.3 Critical Modification: `bin/install.js`

- +1,147 lines / -136 lines across 65 commits
- Major additions: namespace isolation (4 rewrite passes), KB migration system, Codex runtime support, `safeFs()` error wrapper, dynamic hook discovery
- Changes are in **non-overlapping regions** with upstream (confirmed by v1.18.0 merge experience)
- Installer is the most commit-heavy fork file (65 commits) — reflects iterative refinement

---

## 5. Dependency Analysis

### 5.1 Package Dependencies

| Dependency | Fork | Upstream | Notes |
|------------|------|----------|-------|
| `vitest` | ^3.0.0 | — | Fork test framework |
| `vite` | ^6.4.1 | — | Required by vitest |
| `@vitest/coverage-v8` | ^3.0.0 | — | Coverage plugin |
| `c8` | — | ^11.0.0 | Upstream coverage |
| `esbuild` | — | present | Upstream build tool |

**Analysis:** Fork and upstream use completely different test toolchains. Fork chose vitest (ESM-native, modern); upstream uses node:test + c8 (zero-dependency, CommonJS). These are philosophically different choices — vitest enables richer assertions and watch mode at the cost of a dependency; node:test is zero-dep but more verbose.

### 5.2 npm Scripts Comparison

**Fork (10 scripts):**
```
test, test:watch, test:coverage, test:infra, test:smoke,
test:smoke:quick, test:smoke:full, test:upstream, test:upstream:fork,
build:hooks
```

**Upstream (4 scripts):**
```
test, test:coverage, build:hooks (implied), postinstall (implied)
```

Fork has a **multi-tier testing strategy** (unit → integration → smoke → e2e → benchmark) that upstream lacks.

### 5.3 Feature Configuration

**Fork has `feature-manifest.json`** defining 7 feature areas with schemas:
1. `health_check` (v1.12.0)
2. `devops` (v1.12.0)
3. `release` (v1.15.0)
4. `signal_lifecycle` (v1.16.0)
5. `signal_collection` (v1.16.0)
6. `spike` (v1.16.0)
7. `automation` (v1.17.0)

**Upstream:** No feature manifest — configuration embedded in runtime code.

---

## 6. Design Rationale & Decision Records

### 6.1 Deliberation Documents

The fork maintains 35 deliberation files in `.planning/deliberations/`, including philosophical foundations. Key deliberations:

| Document | Decision Made |
|----------|--------------|
| `v1.17-plus-roadmap-deliberation.md` | 5-milestone vision (M-A through M-E); v1.17 Automation Loop is foundational |
| `signal-lifecycle-closed-loop-gap.md` | Agent instructions unreliable for state transitions → use programmatic scripts/hooks instead |
| `health-check-maintainability.md` | Hybrid probe architecture chosen (mirrors sensor precedent); scores are attention guides, not decision gates |
| `deliberation-system-design.md` | Deliberation must be human-led, not automated multi-agent; system surfaces context, human decides |
| `reflection-output-ontology.md` | Lessons are fallible outputs with confidence, not certainties; earned through corroboration |
| `contradictions-in-v17-requirements.md` | Identifies tensions between automation goals and epistemic humility |

### 6.2 Philosophical Foundations

The fork applies 18 philosophical frameworks to engineering decisions (documented in `.planning/deliberations/philosophy/`):

| Framework | Fork Application |
|-----------|-----------------|
| **Popper (Falsificationism)** | Predictions before implementation; passive verification-by-absence as weak test |
| **Dewey (Pragmatism)** | Lessons are fallible; confidence earned through corroboration, never assumed |
| **Lakatos (Research Programs)** | Monitor whether improvements create more problems than they solve |
| **Ashby/von Foerster (Cybernetics)** | Self-observation risks observer effect; health scores are guides not verdicts |
| **Hegel (Dialectics)** | Each fix generates new contradictions (determination-negation); tracked explicitly |
| **Toulmin (Argumentation)** | Deliberations must state claim + grounds + warrant + rebuttal |
| **Habermas (Discourse Ethics)** | Multi-agent deliberation is simulation, not genuine discourse; cap at advisory level |
| **Gadamer (Hermeneutics)** | Cross-project lesson surfacing requires fusion of horizons, not naive keyword matching |
| **Aristotle (Phronesis)** | Excellence in deliberation cannot be fully formalized; thresholds start conservative |
| **Cartwright (Capacities)** | Lessons are scope-conditional capacity statements, not universal laws |

### 6.3 Spike Results (Empirical Decisions)

| Spike | Hypothesis Tested | Outcome |
|-------|-------------------|---------|
| Signal lifecycle hooks | Can programmatic hooks reliably transition signal states? | Confirmed — deterministic vs. agent instructions |
| KB migration paths | Can KB migrate safely between directory structures? | Confirmed — backup+verify+symlink approach works |
| Namespace isolation | Can fork co-exist with upstream GSD? | Confirmed — 4-pass rewrite system works |

### 6.4 Documented Trade-Offs

| Decision | Cost | Benefit |
|----------|------|---------|
| Advisory thresholds (not automated gates) | Requires user calibration | Avoids false-positive automation; respects phronesis |
| Multi-sensor architecture | More coordination complexity | Extensible — new sensors = new files, no workflow edits |
| File-based KB (not database) | Less performant at scale | Zero-dependency; auditable via VCS; matches GSD philosophy |
| Project-local KB | Breaks cross-project learning by default | Solves remote execution problem; knowledge versioned with code |
| Programmatic state transitions | More code to maintain | Reliable — doesn't depend on agent behavior; deterministic |
| Tracked modifications (not additive-only) | More merge complexity | Enables branding, features, deeper integration |
| 4-level automation + per-feature overrides | Complex configuration surface | Handles full spectrum (manual for edge cases, auto for stable paths) |
| Vitest over node:test | Adds devDependencies | Richer assertions, watch mode, ESM-native, v8 coverage |

---

## 7. Test & Build Infrastructure Comparison

### 7.1 Test Suites

| Aspect | Fork | Upstream |
|--------|------|----------|
| Framework | vitest ^3.0.0 | node:test (built-in) |
| Test count | 277 tests across 8 files | ~145 tests across 12 .cjs files |
| Coverage tool | @vitest/coverage-v8 | c8 |
| Coverage threshold | Not enforced | 70% line coverage |
| Module format | ESM | CommonJS (.cjs) |
| Smoke tests | Yes (bash, tiered: quick/standard/full) | No |
| Benchmarks | Yes (framework + runner + tasks) | No |
| E2E | Placeholder (real-agent.test.js, skipped) | No |

### 7.2 Test Coverage Areas

**Fork-unique test areas:**
- Dual-namespace verification (gsd→gsdr rewrite correctness)
- Multi-runtime path handling (Claude, Gemini, Codex, OpenCode)
- KB infrastructure (directory creation, index rebuild, migration safety)
- Content wiring validation (agent @-refs resolve to valid files)
- Automation system (level resolution, feature overrides, deferral, capability capping)
- Signal schema validation (tiered frontmatter requirements)

**Upstream-unique test areas:**
- Modular domain tests (commands, config, core, frontmatter, init, milestone, phase, roadmap, state, verify)
- Dispatcher tests
- Codex config tests
- Verify-health tests

### 7.3 Hook Comparison

| Hook | Fork | Upstream |
|------|------|----------|
| `gsd-check-update.js` | Yes (modified: package name) | Yes |
| `gsd-statusline.js` | Yes (enhanced: CI indicator, health traffic light, automation level, DEV marker) | Yes |
| `gsd-context-monitor.js` | Not present | Yes (new) |
| `gsd-ci-status.js` | Yes (fork addition) | No |
| `gsd-health-check.js` | Yes (fork addition) | No |
| `gsd-version-check.js` | Yes (fork addition) | No |

**Hook discovery:** Fork changed from upstream's static whitelist to dynamic glob (`*.js` matching), allowing new hooks to ship without modifying build-hooks.js.

### 7.4 CI/CD

| Aspect | Fork | Upstream |
|--------|------|----------|
| CI platform | GitHub Actions | GitHub Actions |
| CI workflows | 3 (ci.yml, publish.yml, smoke-test.yml) | 1 (test.yml) |
| Registry | npm (get-shit-done-reflect-cc) | npm (get-shit-done-cc) |
| Release process | `/gsdr:release` command + stamp-version.js | Manual |

---

## 8. Structural Divergence Map

### 8.1 Where Fork and Upstream Align

- Overall GSD workflow: plan → execute → verify cycle
- Agent/command/workflow specification pattern (markdown with frontmatter)
- Template-based project initialization
- State management via STATE.md
- Phase-based milestone tracking
- Git-integrated workflow with atomic commits

### 8.2 Where Fork Extends Upstream

```
UPSTREAM LAYER                    FORK EXTENSION
─────────────────────────────     ─────────────────────────────
Planning & Execution              + Signal detection after execution
                                  + Reflection on accumulated signals
                                  + Spike experiments for uncertainty
                                  + Health monitoring of workflow state
                                  + Automation of feedback loop

Agent Specifications              + 14 fork-specific agents
                                    (reflector, sensors, synthesizer,
                                     spike-runner, etc.)

Commands                          + 9 fork-specific commands
                                    (reflect, signal, spike,
                                     health-check, deliberate, etc.)

Templates & References            + 37 reference docs
                                    (signal detection, lifecycle,
                                     health probes, patterns, etc.)

Configuration                     + Feature manifest system
                                  + Project-scoped config.json
                                  + 4-level automation framework

Testing                           + vitest infrastructure
                                  + Smoke tests
                                  + Benchmark framework

Installation                      + Namespace isolation (gsdr)
                                  + KB migration system
                                  + Multi-runtime support
```

### 8.3 Where Fork and Upstream Have Diverged Incompatibly

| Area | Fork State | Upstream State | Reconciliation Difficulty |
|------|-----------|----------------|--------------------------|
| **Runtime structure** | Monolithic `gsd-tools.js` (6,651 lines) | Modular `gsd-tools.cjs` + 11 `lib/*.cjs` modules | **HIGH** — fork additions must be redistributed across modules |
| **Module format** | ESM (.js) | CommonJS (.cjs) | **MEDIUM** — rename + adjust imports |
| **Test framework** | vitest (ESM) | node:test (CJS) | **LOW** — can run both; different concerns |
| **Config setting name** | `depth` | `granularity` | **LOW** — simple rename |
| **Context monitor hook** | Missing | Present | **LOW** — additive adoption |
| **Statusline hook** | Enhanced with CI/health/automation indicators | Basic with context scaling | **MEDIUM** — merge enhancements onto new base |

---

## 9. Dependency Graph: What Depends on What

### 9.1 Fork Feature Dependencies

```
Feature Manifest ──────────────────────────────────────────────┐
  │                                                            │
  ├── Signal Collection ──► Artifact Sensor                    │
  │       │                 Git Sensor                         │
  │       │                 CI Sensor                          │
  │       │                 ──► Signal Synthesizer ──► KB      │
  │       │                                                    │
  ├── Signal Lifecycle ──► Schema Validation (gsd-tools.js)    │
  │       │                Lifecycle Scripts                   │
  │       │                                                    │
  ├── Reflection ──────► Pattern Detection                     │
  │       │              Counter-evidence Seeking              │
  │       │              Lesson Distillation ──► KB            │
  │       │                                                    │
  ├── Health Check ─────► 11 Health Probes                     │
  │       │               Health Scoring (gsd-tools.js)        │
  │       │               Health Hook (session-start)          │
  │       │                                                    │
  ├── Spike ────────────► Spike Runner Agent                   │
  │       │               KB Persistence                       │
  │       │                                                    │
  └── Automation ───────► Level Resolution (gsd-tools.js)      │
          │               Event Tracking (gsd-tools.js)        │
          │               Lock System (gsd-tools.js)           │
          │               Trigger Points (workflows)           │
          │                                                    │
          └───────────────────────────────────────────────────-┘
```

### 9.2 gsd-tools.js Fork Additions by Feature

| Feature | Functions Added | Lines |
|---------|----------------|-------|
| Manifest system | `cmdManifest*` (4 functions), `loadManifest()`, `loadProjectConfig()` | ~400 |
| Backlog system | `cmdBacklog*` (7 functions), `readBacklogItems()`, `resolveBacklogDir()` | ~600 |
| Signal validation | `signal` schema in FRONTMATTER_SCHEMAS, extended `cmdFrontmatterValidate()` | ~200 |
| Automation framework | `cmdAutomation*` (6 functions), `FEATURE_CAPABILITY_MAP` | ~400 |
| Sensor architecture | `cmdSensorsList()`, `cmdSensorsBlindSpots()` | ~100 |
| Health probes | `cmdHealthProbe*` (3 functions) | ~493 |
| Reflection counter | `cmdAutomationReflectionCounter()` | ~50 |
| **Total fork additions** | **~24 functions** | **~2,126 lines** |

### 9.3 install.js Fork Additions by Feature

| Feature | Functions/Changes | Lines |
|---------|-------------------|-------|
| Namespace isolation | 4-pass rewrite system | ~200 |
| KB migration | `migrateKB()`, integrity verification, symlinks | ~300 |
| Codex runtime | SKILL.md conversion, tool translation, AGENTS.md | ~250 |
| Error handling | `safeFs()` wrapper | ~100 |
| Hook system | Dynamic glob discovery, version-check registration | ~100 |
| Branding | Banner, help text, package name refs | ~100 |
| **Total fork additions** | | **~1,147 lines** |

---

## 10. Risk Assessment

### 10.1 Next Upstream Sync Risks

| Risk | Severity | Description |
|------|----------|-------------|
| gsd-tools.js modularization | **CRITICAL** | Fork's 2,126 lines of additions are in a file that no longer exists upstream. Must redistribute across 11 modules. |
| .js → .cjs rename | **HIGH** | All imports, test configurations, and build scripts reference .js extension. |
| Statusline hook divergence | **MEDIUM** | Fork enhanced statusline significantly; upstream also changed it. Must merge both sets of changes. |
| Missing context-monitor hook | **LOW** | Upstream added new hook fork doesn't have. Simple adoption. |
| `depth` → `granularity` rename | **LOW** | Config setting rename. Simple find-and-replace. |

### 10.2 Feature Maintenance Risks

| Risk | Severity | Description |
|------|----------|-------------|
| gsd-tools.js monolith growth | **HIGH** | At 6,651 lines with 24 fork functions, maintenance burden increases with each feature. Upstream's modularization solves this but requires migration. |
| Installer complexity | **MEDIUM** | At 1,783 lines (+66% from upstream), the installer is becoming a maintenance bottleneck. 65 commits = heavy iterative rework. |
| Feature manifest drift | **LOW** | As upstream adds features, fork's manifest schema may need updates to accommodate. |
| Test framework divergence | **LOW** | Fork uses vitest, upstream uses node:test. Can run both, but maintaining two test suites adds burden. |

---

## 11. Summary of Findings

### What the Fork Is

GSD Reflect is a **philosophically-grounded self-improvement layer** on top of upstream GSD. It adds a complete epistemic feedback loop (detect → triage → remediate → verify → learn) that upstream lacks. The fork's design decisions are:

1. **Explicitly deliberated** — 35 deliberation documents with philosophical citations
2. **Empirically tested** — Spike experiments validate uncertain designs before implementation
3. **Architecturally coherent** — Multi-sensor → synthesizer → KB → reflection → lessons pipeline
4. **Epistemically humble** — Scores guide attention, lessons are provisional, confidence is earned

### What Upstream Has Done

Upstream has made a **major structural improvement** (code modularization) and added **operational features** (Nyquist validation, context monitoring, Codex multi-agent parity, Windows support) that complement but don't overlap with the fork's self-improvement focus.

### The Central Tension

The fork's most valuable additions (2,126 lines of runtime code in gsd-tools.js) are embedded in a file structure that upstream has fundamentally reorganized. Reconciling these requires:

1. Redistributing fork functions across upstream's 11 domain modules
2. Migrating from .js to .cjs module format
3. Ensuring fork's vitest tests work alongside upstream's node:test tests
4. Adopting upstream's new features (context monitor, Nyquist, config renames) without breaking fork features

This is not a simple merge — it's an architectural migration with feature preservation.

---

*Generated by fork divergence audit, 2026-03-10*
*Sources: git diff analysis, 6 parallel research agents, internal deliberation documents*
