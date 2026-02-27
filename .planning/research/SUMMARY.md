# Project Research Summary

**Project:** get-shit-done-reflect (v1.16 milestone)
**Domain:** Signal lifecycle management, self-improving AI development workflow tooling
**Researched:** 2026-02-27
**Confidence:** HIGH (all research grounded in existing codebase analysis, production signal data, and verified technical patterns)

## Executive Summary

GSD Reflect v1.16 addresses a single, concrete system failure: 46 signals detected across 4 milestones, 1 lesson distilled, 0 completed remediation cycles. The pipeline from detection to actionable knowledge is broken at every stage after detection. Signals are "write-once dead letters" -- nobody triages them, nothing tracks whether fixes worked, and the reflector cannot close the improvement loop. The research is unambiguous: the bottleneck is not signal detection quality; it is the absence of processing machinery to consume what already exists.

The recommended approach is a four-stage architecture build, ordered strictly by dependency. Stage one: extend the signal schema to add lifecycle fields (triage, remediation, verification, evidence) while relaxing immutability for those fields only. Stage two: refactor signal collection into a multi-sensor orchestrator with cross-sensor deduplication, preventing the noise explosion that would otherwise accompany broader detection. Stage three: overhaul the reflector to perform triage, confidence-weighted pattern detection, lesson distillation, and remediation suggestion -- the reflector is currently the bottleneck agent, not the collector. Stage four: close the loop with passive recurrence detection and verification-by-absence embedded in the normal collect-signals run.

The key risks, in priority order: building schema richness before the processing pipeline can use it; adding sensors before fixing the reflector; allowing epistemic rigor requirements to become a compliance tax that kills signal throughput; and repeating the spike system failure pattern by designing improvements to unused infrastructure without first verifying why it is unused. Every phase ordering recommendation in this summary is derived from those four risks. The success test for v1.16 is not "did we ship all features" -- it is "can the system now produce lessons from signals and verify that remediations work?"

## Key Findings

### Recommended Stack

All v1.16 capabilities are achievable with zero new npm dependencies. The constraint that shapes every technical decision: the system runs via `npx` on any Node.js installation across four runtimes and must stay zero-dependency. Git analysis uses `child_process.execSync` wrapping `git log --format` and `git log --numstat` -- git's structured output formats provide all the data needed, and the pattern already exists in gsd-tools.js at line 233. Claude Code session log parsing uses Node.js built-in `readline.createInterface` for streaming JSONL files at `~/.claude/projects/{encoded-path}/{session-id}.jsonl`. Schema validation extends `FRONTMATTER_SCHEMAS` in gsd-tools.js (line 2227) rather than adding any validation library. Signal lifecycle state management uses the existing `cmdFrontmatterSet` and `cmdFrontmatterMerge` commands.

**Core technologies:**
- Node.js >= 18.x: Runtime -- `fs`, `path`, `os`, `child_process`, `readline` built-ins cover all needs; no new packages
- Git CLI >= 2.x: Data source for git-sensor -- `--format`, `--numstat`, `--diff-filter` for structured output parseable with `String.split()`
- YAML frontmatter (existing parser): Signal storage -- extends `FRONTMATTER_SCHEMAS` and `extractFrontmatter()` already in gsd-tools.js
- Claude Code session JSONL: Log-sensor data source -- `readline` streaming of `~/.claude/projects/` files; MEDIUM confidence on format stability

**What NOT to use:** `simple-git`, `isomorphic-git`, `js-yaml`, `ajv`, `JSONStream`, or any ML/embedding library. Each violates the zero-dependency constraint without providing commensurate value over built-in equivalents.

### Expected Features

The feature research covers six capability areas. The core problem is pipeline breakage after detection, not detection gaps -- feature selection must reflect that ordering.

**Must have (P1 -- closes the signal-to-lesson gap):**
- Signal schema extensions: additive triage, remediation, verification, and evidence blocks on signal frontmatter; backward compatible
- Signal mutability relaxation: detection payload frozen; lifecycle fields (triage, remediation, verification) are mutable
- Counter-evidence fields on all new signals: `evidence.supporting`, `evidence.counter`, `confidence`, `confidence_basis` required by synthesizer
- Multi-sensor orchestrator: refactor collect-signals from single Task() to orchestrator + parallel sensors + synthesizer
- Artifact sensor: formalize existing gsd-signal-collector logic as named sensor emitting raw candidates to synthesizer
- Git sensor: detect fix-fix-fix commit patterns, file churn, scope creep via `git log --numstat`
- Cross-sensor deduplication synthesizer: single KB writer; prevents the same issue appearing as multiple signals
- Enhanced reflector: lifecycle-aware triage, confidence-weighted pattern detection, lesson distillation, remediation suggestions
- `resolves_signals` in plan frontmatter: plans declare which signals they intend to fix
- Auto remediation status update: when a plan with `resolves_signals` completes, referenced signals update automatically
- Recurrence detection and passive verification: embedded in normal collect-signals run, zero extra ceremony
- Lightweight spike mode: research-only spikes (question -> research -> decision) without BUILD/RUN phases

**Should have (P2 -- improves lifecycle quality):**
- Bulk triage by cluster in reflector
- Auto-triage in YOLO mode based on severity and recurrence count
- Triage-to-remediation bridge: triage decisions flow into plan suggestions
- Lifecycle dashboard in reflect output (N untriaged, N triaged, N verified)
- Recurrence escalation: higher severity on second and third occurrence
- Reflect-to-spike pipeline: reflector flags low-confidence patterns as spike candidates
- Spike integration wiring audit: verify step 5.5 is actually wired in plan-phase.md
- Configurable sensor enablement in feature manifest
- Positive signal emission: baselines alongside deviations

**Defer to v1.16.x or v1.17+:**
- Log sensor: blocked on spike to verify session log accessibility and format stability; ship as `enabled: false` stub only
- Epistemic layers (L0/L1/L2): after counter-evidence fields prove useful in practice
- Evidence decay tracking: after KB has enough `depends_on`-populated entries
- Metrics sensor: blocked on Claude Code exposing token usage data to CLI
- Tiered spike types: after lightweight spike proves the pattern
- Proactive spike surfacing in plan-phase: after wiring audit reveals actual root cause of non-use

**Anti-features (do not build):**
- Real-time mid-execution signal detection: violates the wrapper constraint; executor agents run in fresh contexts
- Standalone `/gsd:triage` command: triage belongs inside reflect, not as a separate command
- Numeric confidence scores (0.0-1.0): false precision; categorical (high/medium/low) + basis text is more honest
- ML-based signal classification: adds opaque dependencies; tag-based matching on structured YAML is debuggable and sufficient
- Automated remediation execution: system proposes, human approves

### Architecture Approach

The system evolves from a single-agent signal collector to a multi-agent pipeline with strict component boundaries. The existing architecture has three layers: command (thin orchestrators), workflow (markdown instruction files), and agent (Task-spawned specialists). The knowledge store at `~/.gsd/knowledge/` is file-based with YAML frontmatter and a shell-built index. The v1.16 target architecture adds a sensor layer beneath the orchestrator: parallel Task() spawns for artifact-sensor and git-sensor (following the proven `/gsd:map-codebase` pattern), feeding a new signal-synthesizer agent that is the single KB writer. The synthesizer performs dedup, correlation, cap enforcement, and index rebuild -- taking over all responsibilities that currently live in the single gsd-signal-collector agent.

**Major components:**
1. `collect-signals.md` (workflow) -- Modified: orchestrates parallel sensor spawns; single entry point preserves command interface
2. `gsd-artifact-sensor.md` (agent) -- New: extracted from gsd-signal-collector; emits raw signal candidates with epistemic fields; does NOT write to KB
3. `gsd-git-sensor.md` (agent) -- New: `git log --numstat` analysis; detects fix patterns, churn, scope creep; emits raw candidates only
4. `gsd-signal-synthesizer.md` (agent) -- New: merges sensor outputs, cross-sensor dedup, severity correlation, single KB write, index rebuild
5. `gsd-reflector.md` (agent) -- Modified: major enhancement for lifecycle awareness, triage, confidence-weighted patterns, lesson distillation
6. `gsd-planner.md` (agent) -- Modified: reads active signals, recommends `resolves_signals` in plan frontmatter
7. Signal schema (YAML frontmatter) -- Extended: adds `source`, `evidence`, `triage`, `remediation`, `verification`, `recurrence_of` blocks; additive only
8. `gsd-signal-collector.md` (agent) -- Deprecated: functionality split between artifact-sensor and synthesizer

**Sensor data flow:** Sensors emit raw candidates (not KB entries) to the synthesizer. The synthesizer is the only component that writes to `~/.gsd/knowledge/`. This single-writer pattern prevents deduplication failures and ensures cap enforcement is atomic.

**Lifecycle state flow:** active -> triaged -> remediated -> verified -> archived. Status updates use existing `cmdFrontmatterSet`. Lifecycle fields are mutable; detection payload fields are immutable. Signals without lifecycle fields (all 46 existing signals) default to: untriaged, no remediation, unverified -- no migration needed.

### Critical Pitfalls

1. **Schema expansion before the processing pipeline exists** -- Expanding from 15 to 30+ signal fields makes signal creation harder while the bottleneck is the reflector. Building schema richness before the reflector can consume it produces more elaborate dead letters. Mitigation: ship lifecycle fields as optional; build the enhanced reflector FIRST; measure whether it produces >5 lessons from existing 46 signals before requiring any new epistemic fields.

2. **Multi-sensor noise overwhelming the reflector** -- The reflector currently generates 1 lesson from 46 signals. Adding sensors without fixing the reflector produces a larger pile of unprocessed input. An artifact-sensor plus git-sensor plus log-sensor could generate 30-50 raw candidates per phase before filtering, accelerating the problem. Mitigation: fix the reflector BEFORE adding new sensors; the synthesizer implements per-sensor caps (5 candidates max per sensor per run) and cross-sensor deduplication before any signal reaches the KB.

3. **Epistemic rigor becoming a compliance tax** -- Mandatory counter-evidence on every signal could double creation time and produce formulaic "no counter-evidence found" text. The philosophical justification (real confirmation bias incidents exist) is correct but the structural enforcement can produce the form without the substance. Mitigation: tiered rigor by severity -- `critical` requires full counter-evidence (`evidence.counter` with 1+ entries); `notable` requires brief alternatives-considered; `trace` requires none. The proportionality rule must be concrete, not advisory.

4. **Signal mutability corrupting evidence chains** -- Mutable lifecycle fields on signal files create concurrency risks (two agents update simultaneously) and evidence chain corruption (lessons reference signals that later change). Mitigation: detection payload fields are permanently frozen; lifecycle fields (triage, remediation, verification) are the only mutable section, clearly separated in YAML; lessons snapshot evidence descriptions, not just signal IDs.

5. **Repeating the spike system infrastructure-without-usage failure** -- 1 spike created, 0 completed, substantial infrastructure built. The deliberation lists 5 hypotheses for non-use but has not verified any. Adding more spike infrastructure without verifying the root cause repeats the pattern. Mitigation: spike system work is a single audit task in an early phase; if the wiring is broken (most likely hypothesis), the fix is wiring -- 30 minutes of work, not a phase.

6. **Recurrence detection false positives eroding system trust** -- Tag-based matching (`signal_type + 2+ overlapping tags`) is too loose; two installer signals with shared tags may be entirely different bugs. Absence-of-recurrence is not evidence of successful remediation. Mitigation: `recurrence_of` links set by reflector explicitly, not automated; `confirmed` verification requires positive evidence; "no recurrence detected" is a weaker intermediate status, not confirmation.

## Implications for Roadmap

The research converges on a dependency-ordered phase structure. The critical path is: schema foundation -> sensor expansion -> reflector overhaul -> recurrence/verification. Epistemic rigor fields must be designed in phase 1 because all downstream components inherit the structure. The spike system is independent and can slot into any phase that has capacity.

### Phase 1: Signal Schema Foundation and Epistemic Rigor Design

**Rationale:** Everything depends on this. Triage, remediation, verification, evidence fields, and the mutability boundary are foundational decisions that every subsequent phase builds on. This is the architectural decision phase: define the immutable/mutable boundary, design lifecycle field schema, establish backward compatibility strategy, specify tiered counter-evidence rules.

**Delivers:** Extended signal schema (additive, backward compatible with 46 existing signals); updated knowledge-store.md spec; `FRONTMATTER_SCHEMAS` extension in gsd-tools.js; documented mutability boundary; tiered epistemic rigor rules (critical requires counter-evidence / notable recommends / trace exempt); updated signal template; status state expansion (active | triaged | remediated | verified | archived).

**Addresses:** Signal schema extensions, signal mutability relaxation, counter-evidence fields, confidence level requirements.

**Avoids:** Breaking backward compatibility (all new fields optional; old signals remain valid without migration); false precision in confidence (categorical + basis text, not numeric); over-specification before pipeline exists (lifecycle fields are optional in this phase; the reflector enforces them later).

**Research flag:** Standard patterns -- YAML frontmatter extension and gsd-tools.js schema addition are well-understood. No phase research needed. However: test nested YAML parsing early (PITFALLS.md flags MEDIUM risk that `extractFrontmatter()` may not handle deep nesting like `triage.decision`).

---

### Phase 2: Multi-Sensor Orchestrator and Signal Synthesizer

**Rationale:** The orchestrator pattern is proven in the codebase (map-codebase spawns 4 parallel agents). The synthesizer is the most critical new component because it prevents noise explosion from multi-sensor collection. Introduce sensors only when a coordinator can deduplicate their output. Refactoring the existing collector into the artifact-sensor is low-risk (same logic, new interface). The git-sensor adds coverage with understood implementation (`execSync` + `git log` parsing).

**Delivers:** Refactored collect-signals workflow (orchestrator pattern); gsd-artifact-sensor (extracted from gsd-signal-collector); gsd-git-sensor (new); gsd-signal-synthesizer (new, single KB writer with dedup and cap enforcement); sensor configuration in feature manifest (`artifact: enabled=true`, `git: enabled=true`, `log: enabled=false`, `metrics: enabled=false`); positive signal emission (baselines alongside deviations). Log-sensor ships as a disabled stub with spike question documented.

**Addresses:** Multi-sensor orchestrator, artifact sensor formalization, git sensor, cross-sensor deduplication synthesizer, configurable sensor enablement, positive signal emission.

**Avoids:** Noise explosion (synthesizer enforces per-sensor caps and cross-sensor dedup before any KB writes); log-sensor implemented before verifying accessibility (disabled stub only; full implementation blocked on spike outcome); gsd-tools.js modification (no changes to the upstream file; all new code in agent specs and workflow files).

**Research flag:** Run a research spike for the log-sensor before enabling it. Spike question: "What is the exact location, format stability, and accessibility of Claude Code session logs across the four supported runtimes?" STACK.md rates this MEDIUM confidence. The 30-day auto-deletion, format instability, and non-Claude-Code-runtime gaps need resolution before any log-sensor implementation beyond the stub.

---

### Phase 3: Enhanced Reflector with Triage and Lesson Distillation

**Rationale:** This is the highest-value work in the milestone and must come before recurrence/verification. The reflector currently produces 1 lesson from 46 signals. No additional signals, no richer schema, and no lifecycle tracking fixes a broken reflector. The reflector must gain: lifecycle awareness (read triage/remediation/verification state); confidence-weighted pattern thresholds (effective_count = sum of confidence_weight * signal_count, where high=1.0, medium=0.6, low=0.3); counter-evidence seeking on candidate patterns (bounded: check up to 3 counter-examples per pattern); triage proposal with cluster-level decisions; lesson distillation when patterns have sufficient weighted evidence; remediation suggestion generation.

**Delivers:** Overhauled gsd-reflector.md agent spec; confidence-weighted thresholds in reflection-patterns.md (split into core and extended to avoid spec bloat); triage proposal step in reflect workflow; lesson distillation with evidence snapshots (not just signal ID references); remediation suggestions for triaged signals; lifecycle dashboard in reflect report (N untriaged / N triaged / N verified); reflect-to-spike pipeline (reflector flags low-confidence patterns as spike candidates).

**Addresses:** Enhanced reflector with triage, confidence-weighted pattern detection, counter-evidence seeking, remediation suggestion generation, triage-to-remediation bridge, lifecycle dashboard, reflect-to-spike pipeline.

**Avoids:** Reflector spec bloat (split reflection-patterns.md into core and extended; reflector loads only core by default; context budget must stay below 50% per agent-protocol.md Section 11); context budget explosion from signal volume (pre-filter by project + status + severity before loading; implement two-pass reflection if signal count exceeds 60); circular counter-evidence seeking (bounded falsification: 3 counter-examples maximum per pattern).

**Research flag:** No phase research needed. Patterns are specified in the deliberation documents and reflection-patterns.md. The work is implementation and agent spec writing.

**Verification gate:** Run the enhanced reflector against the existing 46 signals. It must produce >5 lessons. If it cannot, the phase has not succeeded regardless of implementation completeness.

---

### Phase 4: Signal-Plan Linkage and Passive Verification

**Rationale:** Once the reflector can triage signals and suggest remediation, the tracking and verification loop must close. This phase wires reflector output into the planning workflow and adds passive recurrence checking to collection. `resolves_signals` in plan frontmatter creates the forward link. Automatic remediation status update closes the backward link. Passive verification-by-absence embedded in collect-signals requires zero extra ceremony.

**Delivers:** `resolves_signals` optional field in PLAN.md frontmatter and gsd-planner agent context; automatic remediation status update in execute-plan workflow (reads `resolves_signals` from SUMMARY.md, updates signal remediation fields); recurrence detection logic in signal synthesizer (checks new signals against remediated signals, links via `recurrence_of`); verification-by-absence (configurable N-phase window, default 3); verification failure on recurrence detection; updated signal status states (active | triaged | remediated | verified | archived); at least one complete signal lifecycle cycle.

**Addresses:** `resolves_signals` in plan frontmatter, auto remediation status update, recurrence detection, passive verification (absence-based), verification failure on recurrence, recurrence escalation.

**Avoids:** False-positive recurrence (explicit `recurrence_of` linking by reflector required, not automatic tag-matching; PITFALLS.md documents the installer signal false-positive case as a concrete test); verification overclaiming (`confirmed` requires positive evidence; "no recurrence detected" produces intermediate `no-recurrence-detected` status); O(n) verification overhead (only check signals remediated in the last 5 phases, configurable).

**Research flag:** No phase research needed. The patterns are specified in the research files. The work is wiring existing infrastructure.

**Verification gate:** At least 1 signal must complete the full lifecycle (detected -> triaged -> remediated -> verified). Signal-to-lesson ratio must improve from 46:1 to no worse than 10:1.

---

### Phase 5: Spike System Audit and Lightweight Mode

**Rationale:** The spike system has substantial infrastructure (agent spec, workflow, templates, integration reference) and near-zero adoption (1 spike created, 0 completed). This phase verifies the root cause of non-use before adding any new infrastructure. It is positioned last because: (1) it is independent of the signal lifecycle; (2) the reflect-to-spike pipeline in Phase 3 generates real spike candidates, making the audit more meaningful; (3) the lightweight spike mode can be validated against actual open questions from the v1.16 deliverables.

**Delivers:** Spike integration audit findings (is step 5.5 wired in plan-phase.md? does gsd-phase-researcher emit "Genuine Gaps"?); lightweight research spike mode (question -> research -> decision, no BUILD/RUN); `spike` section in feature manifest (`enabled`, `sensitivity`, `auto_trigger`); at least one completed spike end-to-end (not just designed); verified reflect-to-spike pipeline with real spike candidates.

**Addresses:** Lightweight spike mode, spike integration wiring audit, spike sensitivity config, reflect-to-spike pipeline (from Phase 3, tested here).

**Avoids:** Designing improvements before verifying root cause of non-use; building lightweight mode in the abstract without a concrete spike question to test against; post-milestone spike usage count still at 0-1.

**Research flag:** No phase research needed. The audit is a code inspection task (does the wiring exist?). The lightweight mode reduces existing ceremony rather than adding new infrastructure.

---

### Phase Ordering Rationale

```
Phase 1 (Schema Foundation)
    |
    +---> Phase 2 (Sensor Orchestrator + Synthesizer)
    |         |
    |         +---> [log-sensor spike runs in Phase 2]
    |
    +---> Phase 3 (Enhanced Reflector)  <-- depends on schema + richer signals from Phase 2
              |
              +---> Phase 4 (Plan Linkage + Passive Verification)
              |
              +---> Phase 5 (Spike Audit + Lightweight Mode)  <-- reflect-to-spike from Phase 3
```

- Phase 1 must come first: schema decisions propagate to all other phases
- Phase 2 before Phase 3: reflector needs lifecycle-aware signals with epistemic fields to demonstrate improved output; also, the synthesizer must enforce epistemic field requirements before sensors emit to KB
- Phase 3 before Phase 4: remediation tracking only matters after the reflector can produce triage decisions that drive plan creation
- Phase 5 last: benefits from Phase 3's reflect-to-spike pipeline; independent enough to move earlier if capacity allows

### Research Flags

**Phases needing deeper investigation before or during planning:**
- **Phase 2 (log-sensor):** Run a research spike before implementing. Spike question: "What is the exact location, format stability, and accessibility of Claude Code session logs across runtimes?" Block log-sensor implementation beyond disabled stub on spike outcome.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** YAML frontmatter extension and gsd-tools.js schema addition -- proven patterns in this codebase
- **Phase 3:** Enhanced reflector -- patterns specified in deliberation documents and reflection-patterns.md
- **Phase 4:** Plan-signal linkage and verification loop -- wiring existing infrastructure
- **Phase 5:** Code inspection audit and ceremony reduction

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All implementation patterns verified against existing gsd-tools.js code. Zero new dependencies. Git CLI output formats tested on local repository. Session log structure verified by direct inspection. Log format stability is MEDIUM confidence -- format may change between Claude Code versions. |
| Features | HIGH | Domain well-understood from 4 milestones of production usage. 46 signals and 0 completed cycles provide empirical evidence of gaps. Feature prioritization validated against observability and incident management industry practices. Anti-features clearly identified with concrete alternatives. |
| Architecture | HIGH | All components read and mapped from existing codebase. Parallel sensor pattern proven in map-codebase. Immutability/mutability boundary thoroughly analyzed. Critical path identified with dependency ordering. Single-writer synthesizer pattern derived from observed concurrency risks. |
| Pitfalls | HIGH | Grounded in actual system metrics (46:1 ratio, 1 incomplete spike, 3 prior recurrences of installer bug). Pitfalls derived from observed failures, not hypothetical risks. Phase-specific warnings concrete and actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Log-sensor format stability (Phase 2):** Claude Code JSONL format is not a documented stable API. The 30-day auto-deletion is a real operational constraint. The cross-runtime limitation (log-sensor only works for Claude Code runtime) is significant. Resolution: run a research spike in Phase 2 before any log-sensor implementation beyond the disabled stub.

- **Nested YAML parsing in existing parser (Phase 1):** The schema extension adds nested YAML objects (e.g., `triage.decision`, `remediation.ref`, `evidence.supporting`). PITFALLS.md flags MEDIUM risk that `extractFrontmatter()` may not handle deep nesting correctly in all code paths. Resolution: test nested YAML parsing in gsd-tools.js early in Phase 1 before committing to the full schema design. If fragile, flatten to `source_sensor`, `triage_decision` pattern.

- **Reflector context budget at scale (Phase 3):** If signal count grows beyond 80-100 with expanded lifecycle fields (4-6KB per signal vs current ~2KB), the reflector's context budget becomes the binding constraint. At 100 signals with lifecycle fields, signal data alone could consume 15%+ of context window before reasoning begins. Resolution: pre-filtering (project + status + severity) is a hard architectural requirement in Phase 3, not an optimization.

- **Spike root cause (Phase 5):** Five hypotheses exist for why spikes are unused; none have been verified. Resolution: the Phase 5 audit resolves this empirically by checking actual wiring, not assuming a cause. Most likely root cause: step 5.5 integration is documented but not wired into plan-phase.md.

## Sources

### Primary (HIGH confidence -- direct codebase analysis)
- `get-shit-done/bin/gsd-tools.js` (lines 124-126, 233, 2227-2244, 2248-2307) -- verified `execSync` usage, frontmatter parsing, and schema validation patterns
- `.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md` -- architectural decisions, schema proposals, epistemic rigor requirements
- `.planning/deliberations/development-workflow-gaps.md` -- source/install confusion history, epistemic rigor gap documentation
- `get-shit-done/references/signal-detection.md` -- current detection rules, severity classification, frustration patterns
- `get-shit-done/references/reflection-patterns.md` -- threshold model, clustering, anti-patterns (Section 10)
- `.claude/get-shit-done/references/agent-protocol.md` -- context budget rules (Section 11), quality degradation curve
- `.claude/agents/knowledge-store.md` -- immutability rules, concurrency model, current schema
- `~/.gsd/knowledge/signals/get-shit-done-reflect/` -- 46 active signals, ~95KB total measured empirically
- `~/.gsd/knowledge/lessons/architecture/` -- 1 lesson (empirical baseline)
- Local `~/.claude/` directory -- session log location, JSONL structure, message types verified by direct inspection
- Git CLI -- `git log --format`, `git log --numstat`, `git diff-tree --numstat` tested on local repository

### Secondary (MEDIUM confidence)
- [Claude Code session history deep dive](https://kentgigger.com/posts/claude-code-conversation-history) -- session log structure (cross-referenced with local inspection)
- [Claude Code session log auto-deletion](https://simonwillison.net/2025/Oct/22/claude-code-logs/) -- 30-day retention behavior
- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference) -- official documentation
- Observability best practices research (multiple sources) -- sensor noise reduction, severity stratification, alert fatigue patterns
- Incident management industry practices (ITIL, SOC, AIOps) -- triage and lifecycle workflow patterns

### Tertiary (LOW confidence -- needs validation)
- Claude Code JSONL format as stable API -- unverified; format observed locally but not documented as stable; validate during Phase 2 spike before enabling log-sensor

---
*Research completed: 2026-02-27*
*Ready for roadmap: yes*
