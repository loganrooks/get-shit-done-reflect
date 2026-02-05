# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.
**Current focus:** Phase 3 in progress — Spike execution foundation and templates complete

## Current Position

Phase: 3 of 6 (Spike Runner)
Plan: 2 of 4 in current phase (03-01, 03-02 complete)
Status: In progress
Last activity: 2026-02-05 -- Completed 03-01-PLAN.md (Spike Execution Foundation)

Progress: [████████████░░] 12/18 (~67%)

**Next:** Execute 03-03-PLAN.md (Spike Command)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 2.3min
- Total execution time: 28min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 0. Deployment Infrastructure | 4/4 | 12min | 3.0min |
| 1. Knowledge Store | 3/3 | 7min | 2.3min |
| 2. Signal Collector | 3/3 | 3min | 1.0min |
| 3. Spike Runner | 2/4 | 6min | 3.0min |

**Recent Trend:**
- Last 5 plans: 01-02 (2min), 01-03 (2min), 03-02 (2min), 03-01 (4min)
- Trend: steady

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 5-phase structure derived from requirements -- Knowledge Store, Signal Collector, Spike Runner, Reflection Engine, Knowledge Surfacing
- [Roadmap]: Phase 3 (Spike Runner) parallelizable with Phase 2 (Signal Collector) -- independent writers to different KB sections
- [Roadmap]: Fork maintenance constraint -- changes must be additive (new files OR additive sections to existing files, not logic changes)
- [01-01]: Common base schema with type-specific extensions for all entry types
- [01-01]: Lessons organized by category, not project; signals/spikes scoped by project
- [01-01]: Signals and spikes immutable; lessons update-in-place
- [01-01]: Archival via status field, not separate directory
- [01-01]: No lock files; unique IDs prevent write collisions
- [01-03]: Templates include all optional fields for discoverability
- [01-03]: Enum placeholders use pipe syntax {option1|option2}
- [01-02]: Lesson index table uses Project+Category columns (matching spec, not plan draft's Category+Durability)
- [02-01]: Trace signals logged but not persisted to KB
- [02-01]: Dedup via related_signals cross-references (respects signal immutability)
- [02-01]: Per-phase cap of 10 signals with archival replacement
- [02-01]: Frustration detection scoped to manual /gsd:signal only (no conversation context post-execution)
- [02-01]: Signal schema extended with optional fields: polarity, source, occurrence_count, related_signals
- [02-02]: Workflow inlines artifact content before agent spawn (@ syntax doesn't cross Task boundaries)
- [02-02]: Command delegates entirely to workflow (routing-layer pattern)
- [02-03]: All manual signals persisted regardless of severity (user explicitly chose to record)
- [02-03]: Frustration detection suggestive only -- user decides inclusion
- [00-01]: Install script works unchanged with fork name - reads package.json dynamically
- [00-01]: Vitest over Jest (ESM-native, faster, simpler config)
- [00-01]: 30s test timeout for file system operations
- [00-01]: Global setup clears config env vars for test isolation
- [00-02]: E2E tests gated by RUN_REAL_AGENT_TESTS env var (skip by default)
- [00-02]: Mock fixtures include deliberate deviation for signal detection testing
- [00-04]: Three-tier benchmark system: quick (<1min), standard (5-10min), comprehensive (30+min)
- [00-04]: Threshold-based pass/fail for benchmark metrics
- [00-04]: Results stored in JSON with last 50 runs for trend analysis
- [03-CONTEXT]: Spikes produce findings, not decisions -- existing layers (CONTEXT.md, RESEARCH.md) make decisions
- [03-CONTEXT]: One spike = one question; comparative questions are one spike with multiple experiments
- [03-CONTEXT]: Open Questions flow: mark in PROJECT.md/CONTEXT.md → research verifies → spike if genuine gap
- [03-CONTEXT]: Spike sensitivity (conservative/balanced/aggressive) orthogonal to autonomy (YOLO/interactive)
- [03-CONTEXT]: Orchestrator updates RESEARCH.md after spike; planner reads RESEARCH.md as usual
- [03-CONTEXT]: Spike naming: {3-digit-index}-{slug-from-question} for uniqueness + readability
- [03-CONTEXT]: Max 2 iteration rounds per spike to prevent rabbit holes
- [03-CONTEXT]: Hybrid spike design: agent drafts DESIGN.md, user confirms (or auto-approve in YOLO)
- [03-CONTEXT]: All spikes at project level (.planning/spikes/) with metadata linking to originating phase
- [03-02]: DESIGN.md includes Iteration Log for round tracking (max 2 rounds per spike)
- [03-02]: DECISION.md has mandatory 'Chosen approach' field (cannot be TBD)
- [03-02]: Confidence levels: HIGH (empirical), MEDIUM (inference), LOW (educated guess)
- [03-01]: Design phase handled by orchestrator, not spike-runner agent
- [03-01]: Spike sensitivity derives from depth by default (quick->conservative, standard->balanced, comprehensive->aggressive)
- [03-01]: Agent references spike-execution.md and knowledge-store.md for workflow and KB schema

### Pending Todos

None yet.

### Blockers/Concerns

- None - Phases 0, 1, 2 verified complete

### Roadmap Evolution

- Phase 0 inserted before Phase 1: Deployment Infrastructure (CRITICAL) — npm packaging, install scripts, isolated test environments, CI/CD to enable proper verification of all subsequent phases

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 03-01-PLAN.md (Spike Execution Foundation)
Resume file: None
