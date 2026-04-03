# Fork Divergence Manifest

## Summary

| Metric | Value |
|--------|-------|
| Fork point | `2347fca` (upstream v1.11.1) |
| Last upstream sync baseline | v1.22.4 (2026-03-10 fork audit freeze) |
| Current upstream | v1.30.0 (2026-03-27) |
| Fork version | v1.17.5 |
| Runtime architecture | gsd-tools.cjs (676-line thin router) + 16 lib/*.cjs modules (8,148 lines total) |
| Fork-only modules | 5 (health-probe, automation, manifest, backlog, sensors) |
| Hybrid modules (fork extensions on upstream base) | 6 (core, init, commands, config, frontmatter, + phase/roadmap) |
| Pure/mostly upstream modules | 5 (milestone, state, template, verify, + phase/roadmap) |
| Upstream-only modules (not in fork) | 6 (workstream, security, model-profiles, profile-output, profile-pipeline, uat) |
| Modified upstream files (non-module) | ~30 (identity, commands, templates, hooks, build) |
| Fork-only additions | ~956 files (agents, commands, workflows, hooks, references, tests, planning) |

See [FORK-STRATEGY.md](./FORK-STRATEGY.md) for the overall fork maintenance approach, merge strategy, and conflict resolution runbook.

## Module Divergence Matrix

The runtime was decomposed during v1.18 Phases 45-48. The monolithic `gsd-tools.cjs` (formerly 3,200+ lines) was reduced to a thin CLI router (676 lines) plus 16 `lib/*.cjs` modules. Each module has a category based on its relationship to upstream and a merge stance governing how upstream changes are handled.

### Module Inventory

| Module | Lines | Category | Diff Lines vs v1.22.4 | Fork Content Summary | Merge Stance |
|--------|-------|----------|----------------------|---------------------|--------------|
| health-probe.cjs | 644 | Fork-only | 644 (new file) | Signal-density, automation-watchdog, validation-coverage probes; cached traffic-light score; KB helpers | keep-fork |
| automation.cjs | 465 | Fork-only | 465 (new file) | FEATURE_CAPABILITY_MAP, level-based triggering, automation stats, deferral logic | keep-fork |
| manifest.cjs | 457 | Fork-only | 457 (new file) | Feature manifest loading, migration specs, self-test, manifest_version 2 validation | keep-fork |
| backlog.cjs | 353 | Fork-only | 353 (new file) | Fork backlog management, signal operations, KB integration | keep-fork |
| sensors.cjs | 148 | Fork-only | 148 (new file) | CI, artifact, git sensors for signal pipeline | keep-fork |
| core.cjs | 713 | Hybrid | +223 | parseIncludeFlag, loadManifest, loadProjectConfig, atomicWriteJson, MODEL_PROFILES added to upstream base | hybrid |
| init.cjs | 790 | Hybrid | +144/-42 | Fork-specific init overrides, --include flag, fork init subcommand routing | hybrid |
| commands.cjs | 710 | Hybrid | +162 | Fork command routing additions (signal, health-probe, backlog, automation, manifest) | hybrid |
| config.cjs | 264 | Hybrid | +97 | Fork config handling, gsd_reflect_version, health_check section, workflow.discuss_mode | hybrid |
| frontmatter.cjs | 387 | Hybrid | +88 | Signal schema validation, tiered validation (conditional/recommended), backward_compat | hybrid |
| phase.cjs | 908 | Mostly upstream | +17/-1 | Minor fork adjustments to phase handling | adopt-upstream |
| roadmap.cjs | 305 | Mostly upstream | +15/-1 | Minor fork adjustments to roadmap handling | adopt-upstream |
| milestone.cjs | 241 | Pure upstream | 0 | No fork changes -- adopted wholesale | adopt-upstream |
| state.cjs | 721 | Pure upstream | 0 | No fork changes -- adopted wholesale | adopt-upstream |
| template.cjs | 222 | Pure upstream | 0 | No fork changes -- adopted wholesale | adopt-upstream |
| verify.cjs | 820 | Pure upstream | 0 | No fork changes -- adopted wholesale | adopt-upstream |

### Merge Stance Definitions

| Stance | Meaning | Applied To | Count |
|--------|---------|-----------|-------|
| keep-fork | Module is fork-only; upstream has no version. Upstream changes to overlapping concerns are evaluated but fork version takes priority. | Fork-only modules | 5 |
| hybrid | Module has upstream base with fork extensions. Merge: take upstream changes, then re-apply fork extensions (appended via `module.exports.funcName` pattern). | Hybrid modules | 6 |
| adopt-upstream | Module is unmodified from upstream or has only trivial adjustments. Take upstream version directly on sync. | Pure/mostly upstream modules | 5 |

### Module Relationship Summary

```
gsd-tools.cjs (thin router, 676 lines)
  |
  +-- Pure upstream: milestone, state, template, verify (zero fork diff)
  +-- Mostly upstream: phase, roadmap (trivial fork adjustments)
  +-- Hybrid: core, init, commands, config, frontmatter (upstream base + fork extensions)
  +-- Fork-only: automation, backlog, health-probe, manifest, sensors (no upstream equivalent)
```

Post-modularization insight: Most sync risk is concentrated in the 6 hybrid modules where fork extensions overlay upstream code. The 5 pure/mostly-upstream modules sync trivially. The 5 fork-only modules have zero upstream-side conflict risk.

## Modified Upstream Files (Non-Module)

These files outside `lib/*.cjs` have fork modifications. Source: `git diff v1.22.4 --diff-filter=M --name-only HEAD`.

### Identity

| File | What Changed | Merge Stance |
|------|-------------|--------------|
| README.md | Complete rewrite for GSD Reflect branding and feature descriptions | Fork wins |
| CHANGELOG.md | Fork-specific changelog | Fork wins |
| package.json | Name (`get-shit-done-reflect-cc`), repo URLs, description, npm scripts, devDependencies (vitest) | Hybrid merge |
| package-lock.json | Generated from fork's package.json | Regenerate |
| SECURITY.md | Fork security contact | Fork wins |

### Installer & Hooks

| File | What Changed | Merge Stance |
|------|-------------|--------------|
| bin/install.js | REFLECT banner, fork features, version-check hook, migration guide generation (Phase 51), stale cleanup, C1/C5/C6/C7 upstream adoptions | Hybrid merge |
| hooks/gsd-check-update.js | Package name changed to `get-shit-done-reflect-cc` | Fork wins |
| hooks/gsd-ci-status.js | Project-scoped cache (v1.18 Phase 52) | Hybrid merge |
| hooks/gsd-statusline.js | Project-scoped cache reader + fork health/bridge display | Hybrid merge |
| hooks/gsd-context-monitor.js | Direct push to PostToolUse, AfterTool for Gemini/Antigravity (Phase 52) | Hybrid merge |
| scripts/build-hooks.js | Fork hook additions (gsd-version-check.js) | Case-by-case |

### Agents (modified from upstream base)

| File | What Changed | Merge Stance |
|------|-------------|--------------|
| agents/gsd-integration-checker.md | Agent-protocol reference added | Hybrid merge |
| agents/gsd-nyquist-auditor.md | Fork integration points | Hybrid merge |
| agents/gsd-codebase-mapper.md | Fork-specific mapping rules | Hybrid merge |

### Commands & Workflows (modified upstream files)

| File | What Changed | Merge Stance |
|------|-------------|--------------|
| commands/gsd/discuss-phase.md | Thin orchestrator + fork context | Hybrid merge |
| commands/gsd/new-project.md | Thin orchestrator + fork DevOps Context | Hybrid merge |
| commands/gsd/quick.md | Thin orchestrator + fork additions | Hybrid merge |
| get-shit-done/workflows/discuss-phase.md | Code-aware scouting + KB surfacing (Phase 52) + three-mode discuss system (v1.19: exploratory/discuss/assumptions with workflow.discuss_mode config) | Hybrid merge |
| get-shit-done/workflows/cleanup.md | FORK_PROTECTED_DIRS (Phase 53) | Hybrid merge |

### Templates & References

| File | What Changed | Merge Stance |
|------|-------------|--------------|
| get-shit-done/references/planning-config.md | Fork config sections (knowledge_debug, knowledge_surfacing_config) | Hybrid merge |
| get-shit-done/references/model-profiles.md | Upstream inherit profile, per-agent model_overrides, non-Claude docs (Phase 52) | Hybrid merge |
| get-shit-done/templates/config.json | Fork sections (gsd_reflect_version, health_check, devops, automation) | Hybrid merge |
| get-shit-done/templates/context.md | Added open_questions section | Case-by-case |
| get-shit-done/templates/project.md | Added open_questions section | Case-by-case |
| get-shit-done/templates/research.md | Enhanced open_questions structure | Case-by-case |
| get-shit-done/templates/codebase/concerns.md | DevOps Gaps section | Case-by-case |

### Build & Config

| File | What Changed | Merge Stance |
|------|-------------|--------------|
| .gitignore | Benchmark results, upstream reports/ exclusion | Combine both |
| .github/CODEOWNERS | Fork ownership | Fork wins |
| .github/FUNDING.yml | Fork sponsorship | Fork wins |

### Runtime

| File | What Changed | Merge Stance |
|------|-------------|--------------|
| get-shit-done/bin/gsd-tools.cjs | Thin CLI router with fork init overrides, fork command overrides (Phase 46-48 modularization reduced from 3,200 to 676 lines) | Hybrid merge |

## Fork-Only Additions

~954 files added by the fork that do not exist in upstream. These are never in conflict during merges.

| Category | Count | Key Examples |
|----------|-------|-------------|
| Agents (fork-specific) | 15 | gsdr-executor.md, gsdr-planner.md, gsdr-researcher.md, advisor-researcher.md |
| Commands (fork-specific) | 9 | health-check, reflect, signal, spike, discuss-phase |
| Workflows (fork-specific) | 8 | execute-plan.md, knowledge-surfacing.md, signal workflows, discuss-phase-assumptions.md |
| Hooks (fork-specific) | 3 | gsd-version-check.js, gsd-health-check.js |
| References (fork-specific) | 25 | agent-protocol.md, signal-classification.md, knowledge-surfacing.md, checkpoints.md |
| Templates (fork-specific) | 1 | summary-standard.md and variants |
| Fork lib modules | 5 | automation.cjs, backlog.cjs, health-probe.cjs, manifest.cjs, sensors.cjs |
| Tests | 32 | Vitest suite (unit + integration) |
| Planning artifacts | 832 | STATE.md, ROADMAP.md, phases/, knowledge/, deliberations/ |
| Migrations | 2 | get-shit-done/migrations/ |
| Other | 24 | .github, SECURITY.md, benchmark scripts, etc. |

## Upstream Modules Not Yet In Fork

These modules exist in upstream's `lib/` directory but have not been adopted by the fork. Assessment based on 54-FEATURE-OVERLAP.md disposition analysis.

| Module | Lines | Purpose | Fork Equivalent | Disposition | Assessment |
|--------|-------|---------|----------------|-------------|------------|
| security.cjs | 382 | Prompt injection guards, path traversal prevention, input validation | None | **Behind** | Genuine fork blind spot. Security hardening is universally needed regardless of threat model. Candidate for next milestone. |
| model-profiles.cjs | 68 | Model alias/profile helpers | core.cjs MODEL_PROFILES (QT32) | **Converging** | Fork has partial equivalent. Reconciliation needed -- likely keep fork's compact approach, incorporate upstream improvements. |
| uat.cjs | 282 | Per-phase verification debt tracking | Health probes (partial overlap) | **Behind (complementary)** | Fork tracks epistemic health but not structured verification debt. Would complement health-probe.cjs. |
| workstream.cjs | 491 | Parallel milestone/workstream namespacing for multi-project | None | **Not applicable** | Fork is single-project, single-user. Multi-project workstreams are irrelevant. |
| profile-output.cjs | 952 | Developer profiling output formatting | None | **Not applicable** | Developer profiling serves multi-user adoption. Single-user scholarly tool has no need. |
| profile-pipeline.cjs | 539 | Developer profiling processing pipeline | None | **Not applicable** | Same rationale as profile-output.cjs. |

See [54-FEATURE-OVERLAP.md](phases/54-sync-retrospective-governance/54-FEATURE-OVERLAP.md) for detailed disposition analysis including the worked health-check example and behind/intentionally-different classification.

## Conflict Risk Assessment

Updated for post-modularization (v1.18) architecture.

| Risk Level | Count | Files |
|------------|-------|-------|
| MEDIUM | 2 | package.json, bin/install.js (hybrid merge with non-overlapping regions) |
| LOW | ~28 | All other modified upstream files -- auto-resolved, fork-wins, combine, or case-by-case |
| NONE (fork-only) | 5 modules + 954 files | Fork-only modules and additions -- no upstream-side conflict possible |
| NONE (pure upstream) | 4 modules | milestone.cjs, state.cjs, template.cjs, verify.cjs -- take upstream directly |

### Post-Modularization Risk Analysis

The modular architecture (Phases 45-48) significantly reduced per-sync merge surface compared to the pre-modularization monolith:

- **Before (v1.17.5):** A single 3,200-line `gsd-tools.js` file contained all fork additions interleaved with upstream code. Every upstream change to any function risked textual conflict.
- **After (v1.18):** Fork additions are isolated in 5 fork-only modules (zero conflict risk), 6 hybrid modules (localized conflict surface), and 5 pure upstream modules (trivial sync). The thin router (676 lines) contains only fork command dispatch.

Risk correlates with whether fork and upstream modify the **same lines** within hybrid modules, not just the same file. The v1.18 sync experience (2026-02-10 baseline) confirmed that non-overlapping region edits auto-resolve cleanly.

### Previous Predictions vs Actuals (v1.18.0 sync, pre-modularization)

| Predicted | Actual Conflicts | Auto-Resolved |
|-----------|-----------------|---------------|
| 11 conflicts | 8 conflicts | 3 predicted conflicts auto-resolved |
| 3 HIGH risk | 1 required manual hybrid merge | 2 auto-resolved |
| 4 MEDIUM risk | 2 adopted thin orchestrator | 2 auto-resolved |

## Historical Context

This manifest was originally created 2026-02-10 documenting a pre-modularization monolith with 18 modified upstream files. The v1.18 milestone (Phases 45-53, 2026-03-10 to 2026-03-28) transformed the runtime from a monolithic `gsd-tools.js` into 16 modular `lib/*.cjs` files. This rewrite reflects the post-modularization state as of 2026-03-28.

Key v1.18 phases affecting this manifest:
- **Phases 45-48:** CJS rename, upstream module adoption, fork module extraction, module extensions
- **Phase 48.1:** Drift retriage classifying 372 post-baseline upstream commits
- **Phases 49-51:** Config migration, test hardening, update system hardening
- **Phases 52-53:** Feature adoption and deep integration

See [54-RETROSPECTIVE.md](phases/54-sync-retrospective-governance/54-RETROSPECTIVE.md) for the full v1.18 sync retrospective and [54-UPSTREAM-ANALYSIS.md](phases/54-sync-retrospective-governance/54-UPSTREAM-ANALYSIS.md) for upstream trajectory analysis including design philosophy comparison.

---
*Manifest source: `git diff v1.22.4 --stat -- get-shit-done/bin/lib/` and `git diff v1.22.4 --diff-filter=M --name-only HEAD`*
*Last updated: 2026-03-28 (post v1.18 modularization -- rewritten for 16-module architecture)*
