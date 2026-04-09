---
date: 2026-03-30
audit_type: codebase_forensics
scope: "Complete fork divergence analysis: upstream vs fork across all modules"
triggered_by: "manual: pre-v1.20 fork status assessment"
ground_rules: none
output_files: [01-upstream-changes.md, 02-fork-additions.md, 03-dependencies-config.md, 04-design-rationale.md, 05-runtime-modifications.md, 06-tests-build.md, 07-module-mapping.md, 08-feature-overlap.md, 09-statusline-hooks.md, 10-workflow-divergence.md]
migrated_from: .planning/fork-audit/
migrated_date: 2026-04-10
tags: [fork, upstream, codebase-analysis, v1.18]
---
# Fork Divergence Audit — Synthesis

> **Date:** 2026-03-10
> **Research agents:** 10 (6 broad + 4 deep-dive)
> **Artifacts produced:** 10 detailed reports + this synthesis

---

## The Big Picture

GSD Reflect (v1.17.1) is **748 commits ahead** and **244 commits behind** upstream GSD (v1.22.4). The divergence is not random drift — it's two projects evolving in different directions from a common base, each making valuable improvements the other lacks.

**Upstream built better architecture.** Modularized the monolithic runtime into 11 focused modules, added 145 tests, improved cross-platform compatibility, and added operational features (Nyquist validation, context monitoring, Codex multi-agent parity).

**Fork built better domain logic.** Created a complete epistemic feedback loop (signals → reflection → lessons), a sophisticated automation framework, health monitoring, spike experimentation, and philosophical grounding for design decisions.

Neither supersedes the other. The path forward requires combining them.

---

## Artifact Index

| # | File | Contents |
|---|------|----------|
| 01 | [upstream-changes.md](./01-upstream-changes.md) | 244 upstream commits: modularization, new agents/commands, breaking changes |
| 02 | [fork-additions.md](./02-fork-additions.md) | 738 fork-only files: signals, reflection, spikes, automation, health |
| 03 | [dependencies-config.md](./03-dependencies-config.md) | Package.json, feature manifest, dependency analysis |
| 04 | [design-rationale.md](./04-design-rationale.md) | Deliberations, philosophical foundations, documented trade-offs |
| 05 | [runtime-modifications.md](./05-runtime-modifications.md) | gsd-tools.js (fork-original, 2,126 lines) + install.js (+1,147 lines) |
| 06 | [tests-build.md](./06-tests-build.md) | Test suites, hooks, CI/CD, build scripts |
| 07 | [module-mapping.md](./07-module-mapping.md) | Fork's 25 functions mapped to upstream's 11 modules + 5 new modules |
| 08 | [feature-overlap.md](./08-feature-overlap.md) | 6 feature pair comparisons: overlap, supersession, complementarity |
| 09 | [statusline-hooks.md](./09-statusline-hooks.md) | Statusline divergence, context-monitor gap, hook ecosystem |
| 10 | [workflow-divergence.md](./10-workflow-divergence.md) | 5 workflow diffs: execute-phase, plan-phase, quick, new-project, discuss |

---

## Key Findings

### 1. The Modularization Question (CRITICAL)

Upstream split `gsd-tools.js` into 11 modules. Fork added 2,126 lines to the old monolith. These changes are **architecturally incompatible** — not in the sense of code conflict (the file was renamed to `.cjs`), but in the sense that the fork must eventually choose:

- **Option A:** Adopt upstream's modular structure and redistribute fork's 25 functions across 5 new modules + 2 modified modules. Estimated 16-22 hours. Clean result.
- **Option B:** Keep the monolith. Increasingly painful to maintain as upstream evolves its modules independently.

**9 of 11 upstream modules need zero modification.** Fork's additions are cleanly separable into new domain modules (`backlog.cjs`, `manifest.cjs`, `automation.cjs`, `sensors.cjs`, `health-probe.cjs`).

### 2. Feature Complementarity (Good News)

Most fork and upstream features are **complementary, not competing**:

| Fork Feature | Upstream Feature | Relationship |
|-------------|-----------------|-------------|
| Health-check (11 probes, scoring) | Health (directory validation) | Fork is superset |
| Signal schema validation (write-time) | Nyquist auditor (post-phase) | Orthogonal |
| Feature-manifest migration (declarative) | Config auto-migration (hardcoded) | Fork approach is better |
| Vitest tests (277, domain features) | Node:test tests (145, modular arch) | Complementary |
| Codex installer support | Codex multi-agent parity | Different layers |
| Discuss-phase (unchanged) | Discuss-phase (code-aware) | Upstream is better |

### 3. What Fork Should Adopt from Upstream

| Feature | Why | Difficulty |
|---------|-----|-----------|
| Code-aware discuss-phase | Pure improvement, no conflict | LOW |
| Context-monitor hook | Agent-side context awareness (fork agents get no warnings) | LOW |
| Context scaling fix (83.5% vs 80%) | Fork's progress bar is 13% too conservative | LOW |
| Stdin timeout guard | Prevents pipe hangs | TRIVIAL |
| CLAUDE_CONFIG_DIR support | Respects custom config paths | LOW |
| Nyquist auditor agent | Fork lacks phase-completion auditing | LOW |
| `depth` → `granularity` rename | Breaking change, must adopt | TRIVIAL |
| Upstream's 4 new workflows | add-tests, cleanup, health, validate-phase | LOW |

### 4. What Fork Should Keep

Everything in the self-improvement loop:
- Signal detection, collection, lifecycle, validation
- Reflection engine (pattern detection, counter-evidence, lesson distillation)
- Spike workflow (structured experiments)
- Health check system (probe-based, two-dimensional scoring)
- Automation framework (4-level, per-feature, context-aware)
- Feature manifest system (declarative config evolution)
- Namespace isolation (gsdr co-existence)
- 5 fork-specific hooks (CI status, health check, version check, enhanced statusline)
- All 14 fork-specific agents
- All 9 fork-specific commands
- All 37 fork-specific reference docs
- Philosophical deliberation framework

### 5. What's Actually Broken Right Now

| Issue | Severity | Description |
|-------|----------|-------------|
| Context scaling | MEDIUM | Fork's statusline shows 13% more conservative than reality |
| No context-monitor | MEDIUM | Fork agents get zero warning when context exhausts |
| Missing stdin timeout | LOW | Hook can hang on pipe issues |
| Hardcoded config paths | LOW | Won't work with custom CLAUDE_CONFIG_DIR |
| Stale discuss-phase | LOW | Missing code-aware scouting |

### 6. The Installer Question

`bin/install.js` has grown to 1,783 lines (+66% from upstream) across 65 commits. It handles:
- Standard GSD installation
- Namespace isolation (4-pass rewrite)
- KB migration with backup/verify
- Codex runtime support
- Error handling with `safeFs()`
- Dynamic hook discovery

This is becoming a maintenance bottleneck. The namespace isolation alone is ~200 lines of regex rewriting. Worth considering whether this complexity is sustainable or if a cleaner architecture is needed.

---

## Divergence Dimensions

### Structural Divergence (Architecture)
```
                    UPSTREAM                    FORK
Runtime:           11 modules (.cjs)            1 monolith (.js)
Tests:             node:test + c8               vitest + v8
Hook discovery:    static whitelist             dynamic glob
Config evolution:  hardcoded point-fixes        declarative manifest
```

### Feature Divergence (Capabilities)
```
                    UPSTREAM ONLY               FORK ONLY
Agents:            Nyquist auditor              Reflector, sensors,
                   Integration checker           synthesizer, spike-runner
Commands:          add-tests, cleanup,          reflect, signal, spike,
                   health, validate-phase        health-check, deliberate,
                                                 release, community, upgrade
Hooks:             context-monitor              CI status, health check,
                                                 version check
Workflows:         add-tests, cleanup,          collect-signals, health-check,
                   health, validate-phase        reflect, run-spike, signal,
                                                 release, upgrade-project
```

### Philosophical Divergence (Intent)
```
UPSTREAM: Operational excellence — better architecture, more platforms, cleaner code
FORK:     Epistemic excellence — self-improvement, learning from mistakes, philosophical rigor
```

These are complementary orientations. The ideal system has both.

---

## Risk Map

### If We Sync Upstream Now
| Risk | Severity | Mitigation |
|------|----------|-----------|
| gsd-tools.js modularization | CRITICAL | Must redistribute 25 functions across modules |
| .js → .cjs rename | HIGH | Update all imports, test configs, build scripts |
| Statusline divergence | MEDIUM | Merge fork indicators onto upstream's corrected base |
| quick.md branching | MEDIUM | Careful insertion of complexity gate into new base |
| Config rename (depth→granularity) | LOW | Find-and-replace |
| New upstream workflows | LOW | Additive adoption |

### If We Don't Sync
| Risk | Severity | Description |
|------|----------|-------------|
| Growing version gap | HIGH | Currently 5 versions behind, gap widens |
| Missing context-monitor | MEDIUM | Agents exhaust context without awareness |
| Missing Nyquist auditor | LOW | No phase-completion quality auditing |
| Stale context scaling | MEDIUM | Progress bar is inaccurate |

---

*This synthesis covers 10 research artifacts produced by 10 parallel investigation agents on 2026-03-10.*
*All artifacts saved to `.planning/fork-audit/`.*
