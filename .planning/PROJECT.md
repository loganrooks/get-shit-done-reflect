# GSD Reflect

## What This Is

An enhancement to the GSD (Get Shit Done) workflow system that adds signal tracking, a spike/experiment workflow, and a persistent cross-project knowledge base. The goal is to turn GSD from a stateless workflow engine into a self-improving, adaptive system that learns from its own performance, remembers lessons across projects and sessions, and supports empirical design decisions through structured experimentation.

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

### Active

- [ ] Signal tracking: automatic detection of workflow deviations (e.g., config says Opus but Sonnet spawned)
- [ ] Signal tracking: implicit signal capture from user frustration without explicit invocation
- [ ] Signal tracking: self-reflection on agent performance (debugging struggles, repeated rewrites, plan deviations)
- [ ] Signal tracking: informative trace logging that enables root cause diagnosis
- [ ] Spike workflow: translate design uncertainty into testable hypotheses
- [ ] Spike workflow: structured experimental design with defined metrics and comparison criteria
- [ ] Spike workflow: iterative narrowing support (multiple rounds of experimentation)
- [ ] Spike workflow: produce decision records with methodology, data, and conclusions
- [ ] Knowledge base: persistent store of signals, spike results, and distilled lessons
- [ ] Knowledge base: automatic querying during research phases (alongside web search)
- [ ] Knowledge base: cross-project lesson surfacing (lessons from project A available in project B)
- [ ] Knowledge base: spike result reuse (don't repeat experiments when similar decisions arise)
- [ ] Self-improvement loop: system actively reflects on its own performance after phases
- [ ] Self-improvement loop: pattern detection across accumulated signals
- [ ] Self-improvement loop: iterative improvement of GSD workflows based on signal patterns

### Out of Scope

- User-facing dashboard or web UI — GSD is CLI-native, signals are file-based
- Real-time telemetry or metrics collection — this is reflection, not monitoring
- Multi-user collaboration on shared knowledge base — start with per-user, consider later
- Automated code fixes based on signals — signals inform humans/agents, don't auto-patch

## Context

GSD is a command orchestration system built entirely in Markdown and JavaScript. Commands are thin wrappers that delegate to workflow files, which spawn specialized agents for research, planning, execution, and verification. The system has no runtime dependencies — it's pure Node.js built-ins plus Markdown specifications consumed by AI runtimes.

The current system is stateless across projects and sessions. Every `/clear` is amnesia. Every new project starts from zero. This means:
- The same mistakes recur across projects (e.g., library-specific gotchas)
- Design decisions aren't empirically grounded when web research fails (frontier work)
- System issues (like model profile bugs) persist because there's no feedback loop
- User frustration has no channel to become actionable improvement

The codebase follows a layered architecture: Commands → Workflows → Templates/References → Agents, with a Runtime layer (Node.js) for installation and hooks.

Existing state management (.planning/ directory with STATE.md, ROADMAP.md, etc.) provides the pattern for how new persistent artifacts should work.

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
| File-based knowledge base (not database) | Matches GSD's zero-dependency, Markdown-native architecture | — Pending |
| Per-user knowledge base location (~/.claude/ or similar) | Knowledge should travel with user across projects | — Pending |
| Implicit signal capture (not just explicit) | Users express frustration without invoking commands; system should notice | — Pending |
| Spike as first-class workflow (/gsd:spike) | Experimentation needs structure to avoid derailing the main workflow | — Pending |
| Knowledge base queried during research phase | Most natural integration point; researchers already search for context | — Pending |
| Additive-only changes (no upstream file edits) | Fork maintenance — upstream merges must stay clean | — Pending |

---
*Last updated: 2026-02-02 after initialization*
