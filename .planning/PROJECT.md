# GSD Reflect

## What This Is

A self-improving enhancement to the GSD (Get Shit Done) workflow system. Adds signal tracking (automatic detection of workflow deviations, config mismatches, debugging struggles), a structured spike/experiment workflow for resolving design uncertainty empirically, a persistent cross-project knowledge base, a reflection engine that distills signals into actionable lessons, and knowledge surfacing that automatically retrieves relevant lessons during research and planning. Now synchronized with upstream GSD v1.18.0 including the gsd-tools CLI, thin orchestrator architecture, and 11 bug fixes. Includes production tooling: workspace health checks, version migration, and DevOps context capture.

## Core Value

The system never makes the same mistake twice — signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

## Requirements

### Validated

- ✓ Command orchestration with multi-agent subagent pattern — existing
- ✓ Parallel research, planning, and execution workflows — existing
- ✓ State management via .planning/ directory (STATE.md, ROADMAP.md, config.json) — existing
- ✓ Atomic commits per task with session recovery — existing
- ✓ Multi-runtime support (Claude Code, OpenCode, Gemini CLI) — existing
- ✓ Checkpoint-based deviation handling — existing
- ✓ Codebase mapping for brownfield projects — existing
- ✓ Signal tracking: automatic detection of workflow deviations — v1.12
- ✓ Signal tracking: implicit signal capture from user frustration — v1.12
- ✓ Signal tracking: self-reflection on agent performance (debugging struggles, plan deviations) — v1.12
- ✓ Signal tracking: informative trace logging that enables root cause diagnosis — v1.12
- ✓ Spike workflow: translate design uncertainty into testable hypotheses — v1.12
- ✓ Spike workflow: structured experimental design with defined metrics — v1.12
- ✓ Spike workflow: iterative narrowing support (max 2 rounds) — v1.12
- ✓ Spike workflow: produce ADR-style decision records — v1.12
- ✓ Knowledge base: persistent store of signals, spike results, and distilled lessons — v1.12
- ✓ Knowledge base: automatic querying during research phases — v1.12
- ✓ Knowledge base: cross-project lesson surfacing — v1.12
- ✓ Knowledge base: spike result reuse — v1.12
- ✓ Self-improvement loop: system reflects on performance after phases — v1.12
- ✓ Self-improvement loop: pattern detection across accumulated signals — v1.12
- ✓ Self-improvement loop: workflow improvement suggestions from signal patterns — v1.12
- ✓ Production: workspace health check command — v1.12
- ✓ Production: version migration and upgrade-project command — v1.12
- ✓ Production: DevOps context capture during project initialization — v1.12
- ✓ Production: fork-specific README and CHANGELOG — v1.12
- ✓ Fork strategy: tracked-modifications with documented divergences — v1.13
- ✓ Upstream sync: 70 commits merged (v1.11.2→v1.18.0) with 8 conflicts resolved — v1.13
- ✓ Architecture: gsd-tools CLI adopted with thin orchestrator pattern across 29 commands — v1.13
- ✓ Bug fixes: 11 upstream fixes applied (executor verification, context fidelity, parallelization, commit_docs, etc.) — v1.13
- ✓ Features: 7 upstream features adopted (--auto, --include, Brave Search, reapply-patches, JSONC, update detection, config persistence) — v1.13
- ✓ Testing: 135 tests passing (53 fork vitest + 75 upstream gsd-tools + 7 fork gsd-tools) — v1.13
- ✓ Dogfooding: knowledge base validated in production (13 signals, 3 lessons, KB comparison) — v1.13

### Active

(No active milestone — use `/gsd:new-milestone` to start next)

### Out of Scope

- User-facing dashboard or web UI — GSD is CLI-native, signals are file-based
- Real-time telemetry or metrics collection — this is reflection, not monitoring
- Multi-user collaboration on shared knowledge base — start with per-user, consider later
- Automated code fixes based on signals — signals inform humans/agents, don't auto-patch
- ML-based signal classification — heuristic rules are sufficient and debuggable
- Database for knowledge base — file-based with index is sufficient at expected scale
- Continuous background monitoring — event-driven checkpoints instead
- Modifying gsd-tools.js directly — upstream file, fork extensions go in separate gsd-reflect-tools.js

## Context

Shipped v1.13 synchronized with upstream GSD v1.18.0.
Tech stack: Node.js, Markdown specifications, YAML frontmatter, shell scripts, gsd-tools.js CLI (4,597 lines).
Architecture: Commands (thin orchestrators) → Workflows → Templates/References → Agents, with Runtime layer (Node.js) for installation and hooks.
Knowledge base: `~/.claude/gsd-knowledge/` with `signals/`, `spikes/`, `lessons/` subdirectories and auto-generated `index.md`. Validated in production during v1.13: 13 signals collected, 3 lessons distilled.
Test suite: 135 tests (53 fork vitest + 75 upstream gsd-tools + 7 fork gsd-tools), CI/CD via GitHub Actions with branch protection.
2 tech debt items remaining (no critical blockers): NPM_TOKEN config, gitignore friction. 4 items resolved by v1.13 (signal pipeline, command location, milestone reflection, knowledge surfacing).

**Fork status (post v1.13 sync):**
- Fork at v1.13.0, upstream at v1.18.0 (fully synchronized)
- Tracked-modifications strategy with FORK-DIVERGENCES.md documenting per-file merge stances
- Upstream's reverted GSD Memory vs fork's file-based KB: fork approach validated in production (see KB-COMPARISON.md)

## Constraints

- **Architecture**: Must follow existing GSD patterns (Markdown commands, XML workflows, agent specs) — no new runtime dependencies
- **Storage**: Knowledge base must be file-based (no databases) to maintain GSD's zero-dependency philosophy
- **Compatibility**: Must work across Claude Code, OpenCode, and Gemini CLI runtimes
- **Context**: Signal logging and knowledge base queries must not bloat agent context windows — lazy loading is critical
- **Non-invasive**: Signal tracking must not slow down or interrupt normal workflow execution
- **Fork maintenance**: This is a fork of GSD upstream — divergences from upstream files are tracked in FORK-DIVERGENCES.md with explicit category, rationale, and merge stance. See FORK-STRATEGY.md for the full maintenance approach

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| File-based knowledge base (not database) | Matches GSD's zero-dependency, Markdown-native architecture | ✓ Good — `~/.claude/gsd-knowledge/` with Markdown + YAML frontmatter |
| Per-user knowledge base location (~/.claude/) | Knowledge should travel with user across projects | ✓ Good — cross-project surfacing works via unfiltered index queries |
| Implicit signal capture (not just explicit) | Users express frustration without invoking commands; system should notice | ✓ Good — frustration detection via pattern matching in /gsd:signal |
| Spike as first-class workflow (/gsd:spike) | Experimentation needs structure to avoid derailing the main workflow | ✓ Good — isolated workspace with ADR-style decision output |
| Knowledge base queried during research phase | Most natural integration point; researchers already search for context | ✓ Good — all 4 agents (researcher, planner, debugger, executor) query KB |
| Tracked-modifications fork strategy (supersedes additive-only) | Additive-only kept merges clean but became impractical as fork needed branding, behavior changes, and deeper integration. Tracked-modifications explicitly records all divergences with merge stances. | Evolved v1.13 -- see FORK-STRATEGY.md and FORK-DIVERGENCES.md |
| Vitest over Jest | ESM-native, faster, simpler config | ✓ Good — 42 tests running cleanly |
| Three-tier benchmark system | Different cost profiles for different validation depths | ✓ Good — quick/standard/comprehensive tiers |
| Spikes produce findings, not decisions | Existing layers (CONTEXT.md, RESEARCH.md) make decisions | ✓ Good — clean separation of concerns |
| Max 2 iteration rounds per spike | Prevents rabbit holes while allowing refinement | ✓ Good — convergence constraint |
| Severity-weighted pattern detection for reflection | Critical signals surface faster than trace | ✓ Good — threshold-based with categorical confidence |
| Pull-based KB retrieval with token budget | Prevents context bloat in agents | ✓ Good — ~500 tokens researcher/debugger, ~200 executor |
| Health check purely mechanical | No subjective quality assessment | ✓ Good — actionable pass/warning/fail results |
| Migrations always additive | Never remove or modify existing config fields | ✓ Good — backward compatible upgrades |
| Tracked-modifications fork strategy | Additive-only became impractical; explicit divergence tracking with merge stances | ✓ Good — FORK-STRATEGY.md + FORK-DIVERGENCES.md govern all merges |
| Traditional merge over rebase for sync | 145 fork commits + 17 modified files makes rebase painful | ✓ Good — single merge commit f97291a |
| Adopt gsd-tools.js as-is (no fork modifications) | 4,597-line upstream file; any change creates merge conflicts | ✓ Good — fork uses separate gsd-reflect-tools.js (future) |
| Thin orchestrator pattern for all commands | Upstream architecture: commands delegate to workflows | ✓ Good — 29 commands converted, cleaner separation |
| Separate fork-tools.js over modifying gsd-tools.js | Zero merge conflict risk for fork-specific CLI operations | — Pending — recommended but not yet created |
| GitHub Discussions as fork community link | No fork Discord; GitHub Discussions is built-in and zero-setup | ✓ Good — replaced join-discord with community command |
| File-based KB over upstream's reverted MCP Memory | Production data confirms: file-based approach has lower friction, works cross-project | ✓ Good — KB-COMPARISON.md documents evidence |

---
*Last updated: 2026-02-11 after v1.13 milestone*
