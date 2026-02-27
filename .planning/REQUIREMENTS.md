# Requirements: GSD Reflect

**Defined:** 2026-02-27
**Core Value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

## v1.16 Requirements

Requirements for Signal Lifecycle & Reflection milestone. Each maps to roadmap phases.

### Schema & Epistemic Foundation

- [ ] **SCHEMA-01**: Signal schema extended with lifecycle fields (triage, remediation, verification) as additive optional YAML frontmatter
- [ ] **SCHEMA-02**: Mutability boundary defined and enforced -- detection payload frozen, lifecycle fields mutable
- [ ] **SCHEMA-03**: Signal status expanded to support full lifecycle (active | triaged | remediated | verified | archived)
- [ ] **SCHEMA-04**: Backward compatibility preserved -- all 46 existing signals remain valid without migration
- [ ] **SCHEMA-05**: Counter-evidence fields required in signal schema (evidence.supporting, evidence.counter, confidence, confidence_basis)
- [ ] **SCHEMA-06**: Tiered epistemic rigor enforced by severity -- critical requires counter-evidence, notable recommends, trace exempt
- [ ] **SCHEMA-07**: Positive signal emission supported -- sensors can emit baselines alongside deviations
- [ ] **SCHEMA-08**: FRONTMATTER_SCHEMAS extended in gsd-tools.js to validate new lifecycle and epistemic fields
- [ ] **SCHEMA-09**: Knowledge-store.md spec updated to document lifecycle fields, mutability boundary, and epistemic requirements

### Multi-Sensor Detection

- [ ] **SENSOR-01**: Collect-signals refactored from single-agent to multi-sensor orchestrator pattern (parallel Task spawns)
- [ ] **SENSOR-02**: Artifact sensor extracted from existing gsd-signal-collector into standalone sensor agent
- [ ] **SENSOR-03**: Git sensor implemented -- detects fix-fix-fix commit patterns, file churn, and scope creep via git log analysis
- [ ] **SENSOR-04**: Signal synthesizer agent created -- single KB writer with cross-sensor deduplication and per-sensor caps
- [ ] **SENSOR-05**: Synthesizer enforces epistemic rigor fields before writing signals to KB
- [ ] **SENSOR-06**: Sensor configuration available in feature manifest (per-sensor enabled/disabled, model assignment)
- [ ] **SENSOR-07**: Log sensor ships as disabled stub with spike question documented (full implementation deferred)

### Reflection & Triage

- [ ] **REFLECT-01**: Reflector enhanced with lifecycle awareness -- reads triage, remediation, verification state from signals
- [ ] **REFLECT-02**: Confidence-weighted pattern detection replaces raw count thresholds
- [ ] **REFLECT-03**: Counter-evidence seeking on candidate patterns (bounded: up to 3 counter-examples per pattern)
- [ ] **REFLECT-04**: Lesson distillation from signals with sufficient weighted evidence, including evidence snapshots
- [ ] **REFLECT-05**: Triage proposals with cluster-level decisions for user approval
- [ ] **REFLECT-06**: Remediation suggestions generated for triaged signals
- [ ] **REFLECT-07**: Lifecycle dashboard in reflect output (N untriaged / N triaged / N remediated / N verified)
- [ ] **REFLECT-08**: Reflect-to-spike pipeline -- reflector flags low-confidence patterns as spike candidates

### Signal-Plan Linkage & Verification

- [ ] **LIFECYCLE-01**: Plans can declare `resolves_signals` in PLAN.md frontmatter linking to signal IDs
- [ ] **LIFECYCLE-02**: Planner agent reads active triaged signals and recommends resolves_signals in plans
- [ ] **LIFECYCLE-03**: Automatic remediation status update when plan with resolves_signals completes execution
- [ ] **LIFECYCLE-04**: Recurrence detection in synthesizer -- new signals checked against remediated signals and linked via recurrence_of
- [ ] **LIFECYCLE-05**: Passive verification-by-absence -- configurable N-phase window (default 3) for no-recurrence confirmation
- [ ] **LIFECYCLE-06**: Recurrence escalation -- severity increases on second and third occurrence of remediated signal
- [ ] **LIFECYCLE-07**: At least one signal completes the full lifecycle (detected -> triaged -> remediated -> verified) end-to-end

### Spike System

- [ ] **SPIKE-01**: Spike integration wiring audited -- verify step 5.5 exists in plan-phase.md, researcher emits Genuine Gaps
- [ ] **SPIKE-02**: Lightweight research spike mode implemented (question -> research -> decision, no BUILD/RUN phases)
- [ ] **SPIKE-03**: Spike section added to feature manifest (enabled, sensitivity, auto_trigger config)
- [ ] **SPIKE-04**: At least one spike completed end-to-end (not just designed)
- [ ] **SPIKE-05**: Reflect-to-spike pipeline verified with real spike candidates from enhanced reflector

## Future Requirements

Deferred to v1.16.x or v1.17+.

### Log Sensor (blocked on spike)

- **LOG-01**: Log sensor reads Claude Code session JSONL files for conversation pattern analysis
- **LOG-02**: Log sensor handles 30-day auto-deletion gracefully
- **LOG-03**: Cross-runtime log sensor support (OpenCode, Gemini CLI, Codex CLI log formats)

### Advanced Epistemic Rigor

- **EPIST-01**: Epistemic layers (L0/L1/L2) for graduated rigor based on claim importance
- **EPIST-02**: Evidence decay tracking -- document claims with verifiability metadata and re-check schedule
- **EPIST-03**: Health-check includes belief verification via spot-checking claims from audits and STATE.md

### Workflow Intelligence (v1.17+)

- **WORKFLOW-01**: Workflow introspection and adaptive customization based on usage patterns
- **WORKFLOW-02**: Token/metrics tracking per phase, plan, and command
- **WORKFLOW-03**: Deliberation system with formal pre-milestone thinking phase
- **WORKFLOW-04**: Codebase docs maintenance loop with freshness checking

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time mid-execution signal detection | Violates wrapper constraint; executor agents run in fresh contexts |
| Standalone /gsd:triage command | Triage belongs inside reflect, not as separate command |
| Numeric confidence scores (0.0-1.0) | False precision; categorical + basis text is more honest |
| ML-based signal classification | Opaque dependencies; tag-based matching on structured YAML is debuggable |
| Automated remediation execution | System proposes, human approves -- always |
| Metrics sensor | Blocked on Claude Code exposing token usage data to CLI |
| Log sensor full implementation | Blocked on spike verifying format stability; ships as disabled stub only |
| Tiered spike types beyond lightweight | Validate lightweight mode first, then consider |
| Proactive spike surfacing in plan-phase | After wiring audit reveals actual root cause of non-use |
| Codebase docs refresh system | Deferred to v1.17+ living project model |
| Pre-commit parity hooks | Useful but orthogonal to signal lifecycle -- future quick task |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 31 | Pending |
| SCHEMA-02 | Phase 31 | Pending |
| SCHEMA-03 | Phase 31 | Pending |
| SCHEMA-04 | Phase 31 | Pending |
| SCHEMA-05 | Phase 31 | Pending |
| SCHEMA-06 | Phase 31 | Pending |
| SCHEMA-07 | Phase 31 | Pending |
| SCHEMA-08 | Phase 31 | Pending |
| SCHEMA-09 | Phase 31 | Pending |
| SENSOR-01 | Phase 32 | Pending |
| SENSOR-02 | Phase 32 | Pending |
| SENSOR-03 | Phase 32 | Pending |
| SENSOR-04 | Phase 32 | Pending |
| SENSOR-05 | Phase 32 | Pending |
| SENSOR-06 | Phase 32 | Pending |
| SENSOR-07 | Phase 32 | Pending |
| REFLECT-01 | Phase 33 | Pending |
| REFLECT-02 | Phase 33 | Pending |
| REFLECT-03 | Phase 33 | Pending |
| REFLECT-04 | Phase 33 | Pending |
| REFLECT-05 | Phase 33 | Pending |
| REFLECT-06 | Phase 33 | Pending |
| REFLECT-07 | Phase 33 | Pending |
| REFLECT-08 | Phase 33 | Pending |
| LIFECYCLE-01 | Phase 34 | Pending |
| LIFECYCLE-02 | Phase 34 | Pending |
| LIFECYCLE-03 | Phase 34 | Pending |
| LIFECYCLE-04 | Phase 34 | Pending |
| LIFECYCLE-05 | Phase 34 | Pending |
| LIFECYCLE-06 | Phase 34 | Pending |
| LIFECYCLE-07 | Phase 34 | Pending |
| SPIKE-01 | Phase 35 | Pending |
| SPIKE-02 | Phase 35 | Pending |
| SPIKE-03 | Phase 35 | Pending |
| SPIKE-04 | Phase 35 | Pending |
| SPIKE-05 | Phase 35 | Pending |

**Coverage:**
- v1.16 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after roadmap creation*
