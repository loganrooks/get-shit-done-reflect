# Roadmap: GSD Reflect

## Overview

GSD Reflect turns the GSD workflow engine into a self-improving system through six phases: deployment infrastructure for testing and distribution, establishing a persistent knowledge store, adding signal capture during execution, building a structured spike/experiment workflow, creating a reflection engine that distills signals into lessons, and surfacing accumulated knowledge during research phases. The critical path runs Phase 0 (required for verification) through Phase 1 through 2 through 4 through 5, with Phase 3 (Spike Runner) parallelizable alongside Phase 2.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 0: Deployment Infrastructure** (CRITICAL) - npm packaging, install scripts, isolated test environments, and CI/CD for proper verification
- [x] **Phase 1: Knowledge Store** - File-based persistent knowledge base with directory structure, file formats, indexing, and lifecycle management
- [x] **Phase 2: Signal Collector** - Automatic detection and persistence of workflow deviations, struggles, and config mismatches
- [x] **Phase 3: Spike Runner** - Structured experimentation workflow for resolving design uncertainty with decision records
- [ ] **Phase 4: Reflection Engine** - Pattern detection across signals and distillation into actionable lessons
- [ ] **Phase 5: Knowledge Surfacing** - Automatic retrieval and presentation of relevant knowledge during research phases

## Phase Details

### Phase 0: Deployment Infrastructure (CRITICAL)
**Goal**: The fork is installable via `npx get-shit-done-reflect-cc`, testable in isolated environments, and verifiable through CI/CD — enabling proper E2E verification of all subsequent phases
**Depends on**: Nothing (prerequisite for all verification)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04
**Success Criteria** (what must be TRUE):
  1. Running `npx get-shit-done-reflect-cc` installs the fork's files to `~/.claude/` correctly, handling conflicts with upstream GSD
  2. Isolated test environments (Docker or temp directory) can install fresh, run a mock project, trigger signal collection, and verify KB writes
  3. CI pipeline runs tests on every PR and blocks merge on failure
  4. npm publish workflow exists for releasing new versions
  5. Local development workflow (`npm link` or equivalent) allows testing changes without reinstalling
**Plans**: 4 plans

Plans:
- [x] 00-01-PLAN.md — Test infrastructure foundation (package.json, Vitest, helpers)
- [x] 00-02-PLAN.md — Test fixtures and unit/integration tests
- [x] 00-03-PLAN.md — CI/CD workflows and dev setup scripts
- [x] 00-04-PLAN.md — Benchmark suite with tiered costs

### Phase 1: Knowledge Store
**Goal**: A persistent, cross-project knowledge base exists at user level with defined file formats, directory structure, indexing, and lifecycle management that all subsequent components build on
**Depends on**: Nothing (first phase)
**Requirements**: KNOW-01, KNOW-02, KNOW-03, KNOW-04, KNOW-05, KNOW-06, KNOW-07
**Success Criteria** (what must be TRUE):
  1. Knowledge base directory exists at `~/.claude/gsd-knowledge/` with `signals/`, `spikes/`, and `lessons/` subdirectories
  2. Markdown files with YAML frontmatter can be written to and read from the knowledge base with structured metadata (tags, timestamps, relevance scores)
  3. Auto-generated `index.md` accurately summarizes all entries for fast agent lookup without scanning individual files
  4. Entry cap enforcement prevents knowledge base from exceeding configured limits (50 per project, 200 global) with forced ranking
  5. Decay mechanism reduces relevance scores on unretrieved entries and auto-archives stale content
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Knowledge store reference specification
- [x] 01-02-PLAN.md — Directory initialization and index rebuild scripts
- [x] 01-03-PLAN.md — Entry templates for all three types

### Phase 2: Signal Collector
**Goal**: The system automatically detects workflow deviations, debugging struggles, and config mismatches during execution and persists them as structured signal files in the knowledge base
**Depends on**: Phase 1
**Requirements**: SGNL-01, SGNL-02, SGNL-03, SGNL-04, SGNL-05, SGNL-06, SGNL-08, SGNL-09, SGNL-10
**Success Criteria** (what must be TRUE):
  1. After phase execution, signal files appear in the knowledge base when deviations occurred between PLAN.md expected behavior and SUMMARY.md actual behavior
  2. Config mismatches (e.g., model_profile says quality but wrong model spawned) are automatically detected and logged as signals
  3. Signals have severity levels (critical/notable/trace) with only critical and notable persisted, and duplicates are collapsed into single entries with counts
  4. The `/gsd:signal` command allows manual signal logging with context from the current conversation
  5. Signal capture uses a wrapper workflow pattern (no modification of upstream execute-phase files)
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Signal detection reference and collector agent
- [x] 02-02-PLAN.md — Post-execution collect-signals command and workflow
- [x] 02-03-PLAN.md — Manual /gsd:signal command

### Phase 3: Spike Runner
**Goal**: Users can translate design uncertainty into structured experiments with testable hypotheses, run isolated experiments, and produce decision records that persist in the knowledge base
**Depends on**: Phase 1 (parallel with Phase 2)
**Requirements**: SPKE-01, SPKE-02, SPKE-03, SPKE-04, SPKE-05, SPKE-06, SPKE-07, SPKE-09
**Success Criteria** (what must be TRUE):
  1. Running `/gsd:spike` creates an isolated workspace at `.planning/spikes/{name}/` with hypothesis, experiment design, and success/failure criteria defined before experimentation begins
  2. Spike execution produces a decision record (ADR-style) with mandatory decision field -- the output is a decision, not a report
  3. Iterative narrowing works: round N produces a partial answer and refined question for round N+1, with max depth of 2 enforced
  4. Completed spike results are automatically stored in the knowledge base for cross-project reuse
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Spike execution reference and spike runner agent
- [x] 03-02-PLAN.md — Spike templates (DESIGN.md and DECISION.md)
- [x] 03-03-PLAN.md — /gsd:spike command and run-spike workflow
- [x] 03-04-PLAN.md — Spike integration reference and template updates

### Phase 4: Reflection Engine
**Goal**: The system can analyze accumulated signals, detect patterns, distill actionable lessons, and store them in the knowledge base to close the self-improvement loop
**Depends on**: Phase 2
**Requirements**: SGNL-07, RFLC-01, RFLC-02, RFLC-03, RFLC-04, RFLC-05, RFLC-06
**Success Criteria** (what must be TRUE):
  1. Running `/gsd:reflect` analyzes accumulated signals and produces pattern summaries identifying recurring issues
  2. Phase-end reflection compares PLAN.md vs actual execution and identifies deviations as structured output
  3. Signal patterns are distilled into actionable lesson entries in the knowledge base with category, confidence, and supporting evidence
  4. Cross-project signal patterns are detected -- recurring issues across different projects are identified and surfaced
  5. Optional reflection step can be triggered as part of milestone completion workflow
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Knowledge Surfacing
**Goal**: Existing research workflows automatically consult accumulated knowledge (lessons, spike results) so the system never repeats mistakes or re-runs answered experiments
**Depends on**: Phase 3, Phase 4
**Requirements**: SPKE-08, SURF-01, SURF-02, SURF-03, SURF-04, SURF-05
**Success Criteria** (what must be TRUE):
  1. During research phases, a knowledge researcher agent spawns in parallel with existing researchers and queries the knowledge base
  2. KB queries filter by relevance using tags, recency, and project context via index.md, returning results within a strict 2000-token budget
  3. Lessons from project A are automatically surfaced when relevant context matches in project B
  4. Before running a new spike, the system checks if a similar question was already answered and surfaces the previous result
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phase 0 must complete first (enables verification). Then phases execute in numeric order. Phase 3 can be parallelized with Phase 2 (independent writers to different KB sections).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Deployment Infrastructure | 4/4 | Complete | 2026-02-03 |
| 1. Knowledge Store | 3/3 | Complete | 2026-02-02 |
| 2. Signal Collector | 3/3 | Complete | 2026-02-03 |
| 3. Spike Runner | 4/4 | Complete | 2026-02-05 |
| 4. Reflection Engine | 0/3 | Not started | - |
| 5. Knowledge Surfacing | 0/2 | Not started | - |
