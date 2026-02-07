# Requirements: GSD Reflect

**Defined:** 2026-02-02
**Core Value:** The system never makes the same mistake twice — signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Knowledge Store

- [x] **KNOW-01**: Knowledge base stored at user level (`~/.claude/gsd-knowledge/`) accessible across all projects
- [x] **KNOW-02**: Entries use Markdown with YAML frontmatter for structured metadata + prose content
- [x] **KNOW-03**: Tag-based categorization in frontmatter for cross-cutting discovery
- [x] **KNOW-04**: Auto-generated index file (`index.md`) summarizing all entries for fast agent lookup
- [x] **KNOW-05**: Directory structure separates signals, spikes, and lessons (`signals/`, `spikes/`, `lessons/`)
- [x] **KNOW-06**: Decay/expiry mechanism — excluded by design (time is poor heuristic; retrieval tracking included for future pruning)
- [x] **KNOW-07**: Entry cap with forced ranking — excluded by design (evolve storage layer instead of capping)

### Signal Tracking

- [x] **SGNL-01**: Detect workflow deviations by comparing PLAN.md expected behavior vs SUMMARY.md actual behavior
- [x] **SGNL-02**: Detect config mismatches (e.g., model_profile says quality but agent spawned with wrong model)
- [x] **SGNL-03**: Detect debugging struggles (excessive retries, repeated rewrites, long error-fix cycles)
- [x] **SGNL-04**: Signal files written with severity levels (critical/notable/trace), only critical+notable persisted
- [x] **SGNL-05**: Signal deduplication — repeated identical signals become one entry with count
- [x] **SGNL-06**: Implicit frustration detection — pattern match user messages for frustration signals without explicit invocation
- [x] **SGNL-07**: Cross-project signal pattern detection — identify recurring issues across different projects
- [x] **SGNL-08**: Signal capture via wrapper workflow (fork-friendly, no modification of upstream execute-phase)
- [x] **SGNL-09**: Per-phase signal cap (max 10 persistent signals per phase) to prevent noise
- [x] **SGNL-10**: `/gsd:signal` command for explicit manual signal logging with context from current conversation

### Spike Workflow

- [x] **SPKE-01**: `/gsd:spike` command that translates design uncertainty into testable hypotheses
- [x] **SPKE-02**: Hypothesis definition with explicit success/failure criteria required before experimentation
- [x] **SPKE-03**: Structured experiment design with defined metrics and comparison criteria
- [x] **SPKE-04**: Isolated spike workspace (`.planning/spikes/{name}/`) that doesn't derail main workflow
- [x] **SPKE-05**: Decision record output (ADR-style: context, alternatives, experiment results, decision, consequences)
- [x] **SPKE-06**: Convergence constraints — timeboxes, max depth of 2, mandatory decision field
- [x] **SPKE-07**: Iterative spike narrowing — round N produces partial answer + refined question for round N+1
- [x] **SPKE-08**: Spike result reuse — query knowledge base before running new spike to check if similar question already answered
- [x] **SPKE-09**: Spike results stored in knowledge base for cross-project reuse

### Reflection

- [x] **RFLC-01**: Phase-end self-reflection comparing plan vs actual execution, identifying deviations
- [x] **RFLC-02**: Lesson distillation — convert accumulated signal patterns into actionable knowledge base lessons
- [x] **RFLC-03**: `/gsd:reflect` command for explicit reflection on accumulated signals
- [x] **RFLC-04**: Optional reflection step integrated into milestone completion workflow
- [x] **RFLC-05**: Workflow improvement suggestions based on recurring signal patterns
- [x] **RFLC-06**: Semantic drift detection — track whether agent output quality degrades over time

### Knowledge Surfacing

- [x] **SURF-01**: Knowledge researcher agent spawned in parallel with existing researchers during research phases
- [x] **SURF-02**: KB query filters by relevance (tags, recency, project context) using index.md
- [x] **SURF-03**: Pull-based retrieval with strict token budget (max 2000 tokens knowledge per agent spawn)
- [x] **SURF-04**: Cross-project lesson surfacing — lessons from project A automatically available when relevant in project B
- [x] **SURF-05**: Spike result surfacing — previous experiment findings surfaced when similar design decisions arise

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Signals

- **SGNL-V2-01**: Proactive lesson push — system alerts user to relevant lessons without being queried
- **SGNL-V2-02**: Signal-based workflow auto-modification (suggest changes, never auto-apply)

### Multi-User

- **MULTI-01**: Shared knowledge base across users (community lessons)
- **MULTI-02**: Anonymized signal aggregation for ecosystem-wide improvement

### Integration

- **INTG-01**: Export signals/lessons to external formats (JSON, CSV) for analysis
- **INTG-02**: Knowledge base seeding from external sources (documentation, post-mortems)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time metrics dashboard | GSD is CLI-native and file-based; web UI contradicts architecture |
| ML-based signal classification | Adds model dependencies and opacity; heuristic rules are sufficient and debuggable |
| Database for knowledge base | Breaks zero-dependency philosophy; file-based with index is sufficient at expected scale |
| Continuous background monitoring | Adds overhead and runtime dependencies; use event-driven checkpoints instead |
| Automated code patching from signals | Signals inform decisions, don't auto-modify code |
| Integration with external observability platforms | Serves different audience (ops teams vs individual devs) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KNOW-01 | Phase 1 | Complete |
| KNOW-02 | Phase 1 | Complete |
| KNOW-03 | Phase 1 | Complete |
| KNOW-04 | Phase 1 | Complete |
| KNOW-05 | Phase 1 | Complete |
| KNOW-06 | Phase 1 | Complete (excluded by design) |
| KNOW-07 | Phase 1 | Complete (excluded by design) |
| SGNL-01 | Phase 2 | Complete |
| SGNL-02 | Phase 2 | Complete |
| SGNL-03 | Phase 2 | Complete |
| SGNL-04 | Phase 2 | Complete |
| SGNL-05 | Phase 2 | Complete |
| SGNL-06 | Phase 2 | Complete |
| SGNL-07 | Phase 4 | Complete |
| SGNL-08 | Phase 2 | Complete |
| SGNL-09 | Phase 2 | Complete |
| SGNL-10 | Phase 2 | Complete |
| SPKE-01 | Phase 3 | Complete |
| SPKE-02 | Phase 3 | Complete |
| SPKE-03 | Phase 3 | Complete |
| SPKE-04 | Phase 3 | Complete |
| SPKE-05 | Phase 3 | Complete |
| SPKE-06 | Phase 3 | Complete |
| SPKE-07 | Phase 3 | Complete |
| SPKE-08 | Phase 5 | Complete |
| SPKE-09 | Phase 3 | Complete |
| RFLC-01 | Phase 4 | Complete |
| RFLC-02 | Phase 4 | Complete |
| RFLC-03 | Phase 4 | Complete |
| RFLC-04 | Phase 4 | Complete |
| RFLC-05 | Phase 4 | Complete |
| RFLC-06 | Phase 4 | Complete |
| SURF-01 | Phase 5 | Complete |
| SURF-02 | Phase 5 | Complete |
| SURF-03 | Phase 5 | Complete |
| SURF-04 | Phase 5 | Complete |
| SURF-05 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-07 after Phase 5 completion — ALL REQUIREMENTS COMPLETE*
