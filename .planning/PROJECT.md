# GSD Reflect

## What This Is

A self-improving enhancement to the GSD (Get Shit Done) workflow system. Adds signal tracking (automatic detection of workflow deviations, config mismatches, debugging struggles), a structured spike/experiment workflow for resolving design uncertainty empirically, a persistent cross-project knowledge base, a reflection engine that distills signals into actionable lessons, and knowledge surfacing that automatically retrieves relevant lessons during research and planning. Includes production tooling: workspace health checks, version migration, and DevOps context capture.

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

### Active

**Current Milestone: v1.13 Upstream Sync & Validation**

**Goal:** Sync fork with upstream GSD (70 commits, v1.11.2→v1.18.0), selectively adopt bug fixes and evaluate architectural changes (gsd-tools), while exercising gsd-reflect's signal tracking and knowledge base in production to validate v1.12 features.

**Target features:**
- Evaluate and selectively adopt upstream bug fixes (executor completion verification, context fidelity, parallelization config, commit_docs respect, Windows compat)
- Evaluate upstream gsd-tools CLI refactor (thin orchestrator pattern) for adoption or adaptation
- Evaluate upstream feature additions (Brave Search, --auto flag, --include flag, frontmatter CRUD, patch preservation)
- Resolve 12 overlapping files between fork and upstream
- Exercise signal tracking, knowledge surfacing, and reflection on real work (validating v1.12 features)
- Run /gsd:reflect to distill lessons from the sync experience
- Address v1.12 tech debt: signal pipeline unexercised, knowledge surfacing unexercised in production

### Out of Scope

- User-facing dashboard or web UI — GSD is CLI-native, signals are file-based
- Real-time telemetry or metrics collection — this is reflection, not monitoring
- Multi-user collaboration on shared knowledge base — start with per-user, consider later
- Automated code fixes based on signals — signals inform humans/agents, don't auto-patch
- ML-based signal classification — heuristic rules are sufficient and debuggable
- Database for knowledge base — file-based with index is sufficient at expected scale
- Continuous background monitoring — event-driven checkpoints instead

## Context

Shipped v1.12 with 74,137 LOC across Markdown, JavaScript, Shell, and JSON.
Tech stack: Node.js, Markdown specifications, YAML frontmatter, shell scripts.
Architecture: Commands → Workflows → Templates/References → Agents, with Runtime layer (Node.js) for installation and hooks.
Knowledge base: `~/.claude/gsd-knowledge/` with `signals/`, `spikes/`, `lessons/` subdirectories and auto-generated `index.md`.
Test suite: 42 tests (8 unit, 34 integration), CI/CD via GitHub Actions with branch protection.
6 tech debt items accepted (no critical blockers): NPM_TOKEN config, gitignore friction, signal pipeline unexercised, command location inconsistency, milestone reflection unwired, knowledge surfacing unexercised in production.

**Upstream divergence (v1.13 context):**
- 70 upstream commits since fork point (2347fca)
- Upstream now at v1.18.0; fork at v1.12.2
- Major upstream change: gsd-tools CLI (4597 lines) extracting bash into Node.js + thin orchestrator pattern
- Upstream tried GSD Memory (MCP server, TypeScript, QMD search) in v1.11.2, reverted in v1.11.3 ("writes but doesn't query", setup friction)
- Our fork's file-based knowledge base shipped but is unvalidated in production
- 12 files modified by both fork and upstream: .gitignore, install.js, CHANGELOG.md, help.md, new-project.md, update.md, planning-config.md, research.md template, hooks, package.json/lock

## Constraints

- **Architecture**: Must follow existing GSD patterns (Markdown commands, XML workflows, agent specs) — no new runtime dependencies
- **Storage**: Knowledge base must be file-based (no databases) to maintain GSD's zero-dependency philosophy
- **Compatibility**: Must work across Claude Code, OpenCode, and Gemini CLI runtimes
- **Context**: Signal logging and knowledge base queries must not bloat agent context windows — lazy loading is critical
- **Non-invasive**: Signal tracking must not slow down or interrupt normal workflow execution
- **Fork maintenance**: This is a fork of GSD upstream — new features must be additive (new files, new commands) rather than modifying existing upstream files, to keep merging upstream changes easy

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| File-based knowledge base (not database) | Matches GSD's zero-dependency, Markdown-native architecture | ✓ Good — `~/.claude/gsd-knowledge/` with Markdown + YAML frontmatter |
| Per-user knowledge base location (~/.claude/) | Knowledge should travel with user across projects | ✓ Good — cross-project surfacing works via unfiltered index queries |
| Implicit signal capture (not just explicit) | Users express frustration without invoking commands; system should notice | ✓ Good — frustration detection via pattern matching in /gsd:signal |
| Spike as first-class workflow (/gsd:spike) | Experimentation needs structure to avoid derailing the main workflow | ✓ Good — isolated workspace with ADR-style decision output |
| Knowledge base queried during research phase | Most natural integration point; researchers already search for context | ✓ Good — all 4 agents (researcher, planner, debugger, executor) query KB |
| Additive-only changes (no upstream file edits) | Fork maintenance — upstream merges must stay clean | ✓ Good — all changes are new files or additive sections |
| Vitest over Jest | ESM-native, faster, simpler config | ✓ Good — 42 tests running cleanly |
| Three-tier benchmark system | Different cost profiles for different validation depths | ✓ Good — quick/standard/comprehensive tiers |
| Spikes produce findings, not decisions | Existing layers (CONTEXT.md, RESEARCH.md) make decisions | ✓ Good — clean separation of concerns |
| Max 2 iteration rounds per spike | Prevents rabbit holes while allowing refinement | ✓ Good — convergence constraint |
| Severity-weighted pattern detection for reflection | Critical signals surface faster than trace | ✓ Good — threshold-based with categorical confidence |
| Pull-based KB retrieval with token budget | Prevents context bloat in agents | ✓ Good — ~500 tokens researcher/debugger, ~200 executor |
| Health check purely mechanical | No subjective quality assessment | ✓ Good — actionable pass/warning/fail results |
| Migrations always additive | Never remove or modify existing config fields | ✓ Good — backward compatible upgrades |

---
*Last updated: 2026-02-09 after v1.13 milestone start*
