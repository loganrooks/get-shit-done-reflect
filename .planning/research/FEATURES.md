# Feature Research

**Domain:** Signal lifecycle, self-improving reflection, epistemic rigor for AI-assisted development workflow system
**Researched:** 2026-02-27
**Confidence:** HIGH (domain well-understood from 4 milestones of production usage, 46 signals providing empirical evidence of gaps, architecture designed in deliberation documents, patterns validated against observability and incident management industry practices)

## Feature Landscape

This research covers six capability areas for the v1.16 milestone. Each area is analyzed independently, then feature interactions are mapped across areas. The core problem: 46 signals detected across 4 milestones, 1 lesson distilled. The pipeline from detection to actionable knowledge is broken at every stage after detection.

### Capability Area 1: Multi-Sensor Signal Detection with Deduplication

#### Table Stakes

| Feature | Why Expected | Complexity | Notes | Depends On |
|---------|--------------|------------|-------|------------|
| Orchestrator pattern for collect-signals | Current single-sensor approach misses entire categories of signals (git patterns, conversation struggles). An orchestrator spawning specialized sensors follows the existing `/gsd:map-codebase` pattern. | MEDIUM | Refactor `/gsd:collect-signals` from single-agent to orchestrator + N sensors. Preserves existing command interface. | Nothing new (existing infrastructure) |
| Artifact sensor (existing, formalize) | PLAN vs SUMMARY diff analysis already works. Formalizing it as one sensor among many establishes the pattern. | LOW | Extract current gsd-signal-collector logic into artifact-sensor identity. Mostly a naming/interface change. | Orchestrator pattern |
| Git sensor | Commit patterns reveal struggles invisible to artifact analysis: "fix fix fix" sequences, scope creep (commit touches 3x planned files), churn on same files. Git history is always available. | MEDIUM | Parse `git log` output for the phase's commits. Detect patterns: repeated fix commits, file churn, scope delta vs plan. | Orchestrator pattern |
| Cross-sensor deduplication | Multiple sensors detecting the same underlying issue must produce one signal, not three. Without dedup, the 46-signal problem becomes a 150-signal problem. | MEDIUM | Signal synthesizer merges raw sensor outputs. Match on: same phase + overlapping file references + compatible signal_type. Merge strategy: highest severity wins, evidence arrays concatenate. | Orchestrator pattern, all sensors |
| Configurable sensor enablement | Users must be able to disable sensors that produce noise in their context. Some projects may not want git analysis (e.g., monorepos with unrelated churn). | LOW | `signal_collection.sensors.{name}.enabled` in config.json. Feature manifest declares defaults. | Feature manifest (exists from v1.15) |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes | Depends On |
|---------|-------------------|------------|-------|------------|
| Log sensor (conversation analysis) | Detects struggles invisible to artifact or git analysis: repeated attempts, frustration patterns, undetected issues discussed but not captured. No other self-improving workflow system mines conversation context. | HIGH | Requires access to Claude Code session logs. Location uncertain -- needs spike. If logs unavailable, this sensor degrades to "manual signal suggestion" mode using in-session context only. | Orchestrator pattern; spike on log accessibility |
| Positive signal emission | Sensors emit what went RIGHT, not just what went wrong. Establishes baselines ("all 35 commands in npm pack") that enable regression detection. Current system is failure-biased -- cannot detect when a previously-working thing breaks. | MEDIUM | Each sensor emits both positive and negative findings. Positive signals use `polarity: positive` (field exists but never used). Positive signals stored as baselines, not noise. | Orchestrator pattern |
| Per-sensor model assignment | Expensive sensors (artifact, log) use capable models; cheap sensors (git, metrics) use fast/cheap models. Optimizes token spend without sacrificing detection quality. | LOW | `signal_collection.sensors.{name}.model` in config.json. Default: "auto" (inherits session model). Override: specific model ID. | Configurable sensor enablement |
| Sensor gap meta-detection | When a user manually creates a signal for something collect-signals missed, the system detects the blind spot and flags which sensor should have caught it. Self-improving detection. | LOW | Compare manual signals (source: manual) against recent automated collection. If manual signal tags overlap with no auto-detected signals in same phase, emit a meta-signal about sensor coverage gap. | Manual signal command (exists), deduplication |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time mid-execution signal detection | Catch problems AS they happen, not after | Violates the wrapper constraint (cannot modify executor agents, which are upstream). Mid-execution hooks add complexity, latency, and create race conditions with file writes. Executor agents run in fresh contexts. | Post-execution analysis is by design. If mid-execution detection is needed, it belongs in executor agent specs (upstream concern), not the reflect system. |
| Metrics sensor (token tracking) | Token usage per phase reveals efficiency patterns | Claude Code does not currently expose token usage data to hooks or CLI tools (needs verification). Building infrastructure for unavailable data wastes effort. | Defer to v1.17+ when Claude Code API exposure is better understood. Add the sensor interface now so it slots in later. |
| Continuous background monitoring | Run signal collection continuously, not just post-phase | File-based system with no daemon. Background processes conflict with the zero-dependency design. Creates stale-state risks when multiple sessions interact. | Event-driven: collect-signals runs when invoked (post-phase, post-milestone, on-demand). Frequency is user-controlled. |
| ML-based signal classification | Use embeddings or trained models for smarter signal detection | Adds opaque dependencies. Current structured frontmatter with tag-based matching is debuggable, explainable, and sufficient. ML classification creates "why did it flag this?" confusion. | String matching on structured YAML frontmatter. Explicit tags and types. Debuggable by reading the signal file. |

---

### Capability Area 2: Signal Triage Workflows

#### Table Stakes

| Feature | Why Expected | Complexity | Notes | Depends On |
|---------|--------------|------------|-------|------------|
| Triage metadata on signals | Every incident management system (ITIL, SOC, AIOps) has triage as a distinct lifecycle stage. Signals without triage decisions are dead letters -- the 46:1 ratio proves this. | LOW | Add `triage` block to signal schema: `decision` (address/defer/dismiss/investigate/needs-data), `rationale`, `by` (human/reflect), `at` (timestamp). | Signal schema extension |
| Triage as part of reflect | When `/gsd:reflect` runs, untriaged signals are presented for triage decisions. The reflector proposes decisions; user confirms or overrides. Without this, triage is a manual burden nobody performs. | MEDIUM | Reflector step: load signals, identify untriaged, cluster by theme, propose triage decisions with rationale. In interactive mode: present each cluster for approval. In YOLO mode: auto-triage based on severity + recurrence count. | Enhanced reflector agent |
| Bulk triage by cluster | Triaging 46 signals one-by-one is prohibitive. Clustering related signals and triaging the cluster ("all 8 installer signals: address") is the only scalable approach. | LOW | Reflector clusters signals (existing capability), presents cluster-level triage decision. All signals in cluster get same triage decision. | Triage metadata, signal clustering (exists) |
| Dismiss with rationale | Some signals are noise. The ability to dismiss with a recorded reason ("false positive: test environment artifact") prevents re-detection and provides audit trail. | LOW | `triage.decision: dismiss` with required `triage.rationale`. Dismissed signals excluded from pattern detection but preserved in KB for audit. | Triage metadata |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes | Depends On |
|---------|-------------------|------------|-------|------------|
| Auto-triage in YOLO mode | Critical signals with 3+ recurrences auto-triage to "address". First-occurrence trace-level signals auto-triage to "defer". Removes human bottleneck for obvious decisions while preserving human judgment for ambiguous ones. | MEDIUM | Decision matrix: severity x recurrence_count x polarity -> triage decision. Conservative defaults (err toward "investigate" not "dismiss"). User can override any auto-decision. | Triage metadata, YOLO mode (exists) |
| Triage-to-remediation bridge | When a signal is triaged as "address", the system prompts: "Create a phase/plan to fix this?" Triage decision flows into planning, not just marking. This closes the gap between "acknowledged" and "fixed". | MEDIUM | When `/gsd:reflect` produces "address" decisions, output includes: remediation suggestions, candidate phase descriptions, and `resolves_signals` references for plan frontmatter. | Triage metadata, remediation tracking |
| Signal lifecycle dashboard in reflect output | Reflect report shows lifecycle distribution: N untriaged, N addressed, N deferred, N verified, N dismissed. Makes the health of the improvement loop visible at a glance. | LOW | Aggregate triage.decision values across all active signals. Display in reflect report header. | Triage metadata |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Standalone /gsd:triage command | Dedicated command for triage feels clean | Adds yet another command to an already large command surface (35 commands). Triage is a step within reflection, not a standalone activity. A separate command fragments the workflow. | Triage integrated into `/gsd:reflect`. The reflect command already reads signals and proposes actions -- triage is a natural step, not a separate concern. |
| SLA/deadline-based auto-escalation | "If untriaged for 7 days, escalate to critical" | Time pressure on a self-improvement system creates busywork. The system should improve proportionally to development activity, not calendar time. A project on hiatus for 2 weeks shouldn't generate escalation noise. | Use recurrence count and severity, not elapsed time. Signals escalate when they recur, not when a timer expires. |

---

### Capability Area 3: Remediation-to-Verification Tracking

#### Table Stakes

| Feature | Why Expected | Complexity | Notes | Depends On |
|---------|--------------|------------|-------|------------|
| Remediation metadata on signals | Without tracking what was done to fix a signal, verification is impossible and recurrence detection has no baseline. Every incident management system tracks remediation. | LOW | Add `remediation` block: `ref` (milestone/phase/plan/commit), `approach` (why this fix), `expected_outcome` (what success looks like), `status` (planned/in-progress/completed/failed). | Signal schema extension |
| resolves_signals in plan frontmatter | Plans should declare which signals they intend to fix. This creates the forward link from plan -> signal. When the plan executes, the signal's remediation fields update. | LOW | New optional frontmatter field in PLAN.md: `resolves_signals: [sig-id-1, sig-id-2]`. Planner populates this when creating plans from reflected/triaged signals. | Remediation metadata |
| Automatic remediation status update | When a plan with `resolves_signals` completes (SUMMARY.md written), referenced signals' remediation status updates to "completed". Manual tracking would never happen. | MEDIUM | Post-execution hook in execute-phase or collect-signals: read SUMMARY.md, check for `resolves_signals`, update referenced signal remediation blocks. This is the ONE exception to signal immutability beyond archival -- remediation lifecycle fields are mutable. | resolves_signals field, signal mutability relaxation |
| Verification metadata on signals | After remediation, "did it actually work?" must be tracked. Without verification, the cycle cannot close. | LOW | Add `verification` block: `status` (pending/confirmed/failed/inconclusive), `method` (manual/automated/absence-of-recurrence), `at` (timestamp). | Signal schema extension |
| Signal mutability relaxation for lifecycle fields | Current signals are fully immutable except archival. Lifecycle fields (triage, remediation, verification) MUST be mutable for the cycle to work. Detection data stays frozen. | LOW | Document the immutability boundary: detection fields (What Happened, Context, Potential Cause, evidence) are immutable. Lifecycle fields (triage, remediation, verification) are mutable. Update knowledge-store.md accordingly. | Knowledge store spec update |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes | Depends On |
|---------|-------------------|------------|-------|------------|
| Remediation quality assessment | Not just "was it addressed?" but "was it addressed well?" Compare the remediation approach against the signal's root cause hypothesis. Shallow fixes (treating symptoms not causes) get flagged. | MEDIUM | When verification runs, reflector compares: signal's `Potential Cause` -> remediation's `approach` -> recurrence status. If cause was "wrong directory" but fix was "add file to right place" (not "prevent wrong directory edits"), flag as shallow remediation. | Remediation metadata, verification metadata, enhanced reflector |
| Remediation suggestion generation | When triaging signals as "address", the reflector proposes specific remediation approaches based on the signal's root cause and similar past remediations. Reduces the cognitive load of going from "problem identified" to "fix designed". | MEDIUM | Pattern-match signal context against past remediation approaches in KB. If similar signals were remediated successfully, suggest the same approach. If unsuccessfully, suggest alternatives. | Triage, remediation metadata, KB history |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Automated remediation execution | System detects signal, auto-generates fix, auto-applies | Self-modifying code without human oversight is dangerous. The system should PROPOSE fixes, not APPLY them. Automated remediation works in narrow domains (rollback a deploy) but not for structural issues (architecture decisions). | Remediation suggestions flow into plan frontmatter. Human reviews and approves via normal plan-phase flow. The system accelerates remediation, not replaces judgment. |
| Remediation SLA tracking | "Signal X must be remediated within 2 sprints" | GSD is not a project management tool. Deadline tracking belongs in external systems. Adding timeline pressure to self-improvement creates perverse incentives (rush fixes to meet SLA). | Severity + recurrence count naturally prioritize. Critical signals with 5 recurrences get attention organically because they keep appearing. |

---

### Capability Area 4: Recurrence Detection Patterns

#### Table Stakes

| Feature | Why Expected | Complexity | Notes | Depends On |
|---------|--------------|------------|-------|------------|
| Recurrence linking between signals | When a new signal matches a previously-remediated signal, the new signal should link back: `recurrence_of: sig-id-of-original`. This is how the system detects that fixes didn't work. | MEDIUM | During sensor runs, after dedup, check: does new signal match (signal_type + 2+ tags) an existing signal with `remediation.status: completed`? If yes, mark as recurrence. | Cross-sensor dedup, remediation metadata |
| Verification-by-absence | If a signal was remediated and N subsequent phases pass without recurrence in the relevant area, verification status becomes "confirmed" (absence-of-recurrence). The cheapest and most reliable verification method. | MEDIUM | During collect-signals, check remediated signals: if original signal's tags/type don't match any new signals in the last N phases (configurable, default 3), set `verification.status: confirmed, verification.method: absence-of-recurrence`. | Verification metadata, recurrence linking |
| Verification failure on recurrence | If a remediated signal recurs, the original signal's verification status becomes "failed". The recurrence IS the verification -- empirical evidence that the fix didn't work. | LOW | When recurrence is detected (recurrence linking), update original signal: `verification.status: failed`. New signal gets `recurrence_of: [original-id]`. | Recurrence linking, verification metadata |
| Previous remediation tracking on recurrences | When a signal recurs, it should carry context about what was previously tried: `previous_remediations: [{sig-id: what was tried}]`. Prevents repeating failed approaches. | LOW | New recurrence signal includes `previous_remediations` array with references to past remediation approaches. The reflector reads this when suggesting new remediation. | Recurrence linking, remediation metadata |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes | Depends On |
|---------|-------------------|------------|-------|------------|
| Passive verification inside collect-signals | Verification doesn't need its own command. When sensors run after each phase, they automatically check: "is this new signal a recurrence of something we fixed?" If yes -> verification failed. If no recurrence in relevant area -> evidence toward confirmed. Verification happens as a side-effect of normal signal collection. | MEDIUM | Integrate recurrence checking into the signal synthesizer step of collect-signals. No new command, no extra invocation. Zero ceremony for verification. | Recurrence linking, signal synthesizer |
| Recurrence escalation | First occurrence: notable. Second occurrence after remediation: critical. Third occurrence: critical + auto-triage to "address" + lesson candidate. Recurrence inherently increases severity because it means remediation failed. | LOW | Severity adjustment formula: `base_severity + (recurrence_count * escalation_factor)`. Cap at critical. Third recurrence auto-qualifies for lesson distillation regardless of normal thresholds. | Recurrence linking, triage metadata |
| Root cause evolution tracking | When a signal recurs after remediation, the root cause hypothesis should evolve: "We thought it was X, tried fixing X, it came back. Updated hypothesis: Y." Builds institutional memory about hard problems. | MEDIUM | Recurrence signal's "Potential Cause" section includes: "Previous hypothesis: [from original]. Previous remediation: [approach]. Why it recurred: [updated analysis]." Reflector synthesizes across recurrence chain. | Recurrence linking, previous remediation tracking |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Time-based recurrence windows | "Only count as recurrence if it happens within 30 days" | Time-based windows lose infrequent but persistent issues. A library bug recurring across versions over months is still a recurrence. The reflection-patterns.md reference explicitly warns against this anti-pattern. | Use tag/type matching regardless of time elapsed. Recency affects display priority, not recurrence detection. |
| Automatic root cause analysis | ML-powered "why did this recur?" analysis | Root causes for workflow issues are contextual and require understanding the fix that was attempted. Automated root cause analysis in narrow domains (monitoring) works because failure modes are constrained. Workflow issues have unbounded causes. | Reflector drafts hypotheses based on structured evidence. Human validates. The structured evidence (previous remediations, what changed) makes hypothesis generation tractable without ML. |

---

### Capability Area 5: Epistemic Rigor (Counter-Evidence, Confidence Calibration)

#### Table Stakes

| Feature | Why Expected | Complexity | Notes | Depends On |
|---------|--------------|------------|-------|------------|
| Counter-evidence fields in signal schema | Sensors cannot emit a signal without documenting alternative explanations considered. Without this, every detection is confirmation-biased. The v1.15 audit incident (claiming "fixed" without verification) demonstrates the real cost. | LOW | Required `evidence` block: `supporting` (array of data points), `counter` (alternatives considered and why rejected), `confidence` (high/medium/low), `confidence_basis` (what confidence is based on). Schema validation rejects signals missing these fields. | Signal schema extension |
| Confidence level on all signals | Every signal is a belief. Beliefs without confidence levels are indistinguishable from facts. The system conflated "file exists" (low confidence that content is correct) with "file contains correct content" (high confidence). | LOW | `confidence` field already partially exists (categorical high/medium/low). Make it required, not optional. Add `confidence_basis` to prevent empty-calorie confidence ("high" because the sensor said so). | Signal schema extension |
| Evidence-for AND evidence-against in verification | Verification reports that only contain confirming evidence are structurally incomplete. The v1.15 audit said "reflect.md fixed" based on file presence alone. Requiring counter-evidence fields catches this. | LOW | Verification output template requires both sections. A report with only "Evidence For" is flagged as incomplete. "No counter-evidence sought" is itself a flag. | Verification metadata, template update |
| Confidence-weighted pattern thresholds | Current pattern detection: "3 signals = pattern" (count only). 3 low-confidence signals should NOT equal a pattern. 2 high-confidence signals with corroborating evidence may. Confidence must factor into threshold calculations. | MEDIUM | Weighted threshold: `effective_count = sum(confidence_weight * signal_count)` where high=1.0, medium=0.6, low=0.3. Apply existing severity-weighted thresholds to effective_count. | Counter-evidence fields, confidence levels, enhanced reflector |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes | Depends On |
|---------|-------------------|------------|-------|------------|
| Counter-evidence seeking in pattern detection | The reflector actively seeks evidence AGAINST its emerging patterns: "Are these truly same root cause, or superficially similar?" This catches false patterns that waste remediation effort. No self-improving system in the current landscape does structural falsification. | MEDIUM | When reflector identifies a candidate pattern, it generates: (1) the pattern hypothesis, (2) counter-evidence that would disprove it, (3) assessment of whether counter-evidence exists in the signal data. Patterns with strong counter-evidence are downgraded. | Confidence-weighted thresholds, enhanced reflector |
| Epistemic layers for claims | Claims progress through verification stages: L0 (conjecture -- unverified hypothesis), L1 (substantiated -- logically supported), L2 (validated -- empirically confirmed). Prevents unverified sensor output from being treated as established fact. Inspired by architectural decision tracking research. | MEDIUM | Each signal's evidence block includes `epistemic_level: L0|L1|L2`. Sensors emit at L0. Corroboration by multiple sensors promotes to L1. Verification by remediation outcome promotes to L2. Pattern detection weighs by epistemic level. | Counter-evidence fields, multi-sensor correlation |
| Evidence decay tracking | Evidence has a shelf life. An architectural claim verified 2 months ago may no longer hold after 30 phases of development. Claims carry `valid_until` or `depends_on` conditions that trigger re-verification. Research shows 20-25% of architectural decisions have stale evidence within 2 months. | HIGH | `depends_on` field (already exists in KB schema) gets active checking. During reflect, sample claims from recent lessons/signals, verify `depends_on` conditions still hold. Flag stale claims. | KB schema (exists), health-check enhancement |
| Verifiable claims in STATE.md | Claims in STATE.md and audits carry structured verification metadata: the claim text, a command to verify it, last-verified timestamp, and confidence. Health-check can spot-check these mechanically. | MEDIUM | New claim structure embedded in STATE.md or a companion file. Proportional spot-checking during `/gsd:health-check` to detect claim drift. | Health-check enhancement |
| Proportional falsification budgeting | Not all claims deserve equal scrutiny. Cost-of-being-wrong determines falsification effort: cheap checks for high-consequence claims (npm pack verification) always run; expensive checks for low-consequence claims scale down. | LOW | Design principle documented in agent protocol. Sensor and reflector specs include guidance on falsification proportionality. Not code -- methodology. | Agent protocol update |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Numeric confidence scores (0.0-1.0) | More precise than categorical high/medium/low | False precision. Agents cannot meaningfully distinguish 0.72 from 0.68 confidence. Numeric scores invite computation that obscures judgment. Categorical levels with basis text are more honest and actionable. | Categorical: high/medium/low with required `confidence_basis` text explaining what the level is based on. The basis text IS the precision. |
| Mandatory falsification for every claim | Every signal, every claim, every assertion must have counter-evidence | Disproportionate token cost. Some claims are self-evident ("file exists" verified by ls). Mandatory falsification for trivial claims wastes tokens. | Proportional falsification: effort scales with consequence of being wrong. Cheap checks always run; expensive falsification reserved for high-consequence beliefs. |
| Formal proof requirements (F3 formality) | Mathematical proof of correctness for architectural decisions | Academic formality inappropriate for a development workflow system. F0-F2 (informal through tested) covers practical needs. F3 formality belongs in safety-critical systems, not task planning. | F0-F2 epistemic layers: conjecture, substantiated, validated. Sufficient for development workflow decisions. |

---

### Capability Area 6: Lightweight Experiment/Spike Modes

#### Table Stakes

| Feature | Why Expected | Complexity | Notes | Depends On |
|---------|--------------|------------|-------|------------|
| Lightweight spike mode (research-only) | Current spike flow requires DESIGN.md -> BUILD -> RUN -> DOCUMENT. For questions like "which library?" or "does Claude Code expose logs?", you just need research + decision. The heavyweight flow discourages use -- only 1 spike ever created, stuck at "designing". | MEDIUM | New spike type: "research spike". Skips BUILD and RUN phases. Flow: QUESTION -> RESEARCH -> DECISION. Creates DECISION.md and KB entry. No experiment scaffolding, no code. | Spike command (exists) |
| Spike integration wiring audit | spike-integration.md describes a step 5.5 in plan-phase for auto-triggering spikes from RESEARCH.md "Genuine Gaps". But the current plan-phase workflow may not contain this step. The integration may be documented but not wired. | LOW | Verify: does plan-phase.md reference spike-integration.md? Does gsd-phase-researcher emit "Genuine Gaps"? Fix the wiring if broken. | Existing spike infrastructure |
| spike_sensitivity in feature manifest | Config for spike behavior not initialized in projects. Without config, sensitivity defaults may suppress triggers. Projects should be able to configure spike sensitivity. | LOW | Add `spike` section to feature manifest: `{ "enabled": true, "sensitivity": "medium", "auto_trigger": true }`. Default: enabled, medium sensitivity, auto-trigger on. | Feature manifest (exists) |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes | Depends On |
|---------|-------------------|------------|-------|------------|
| Reflect-to-spike pipeline | When reflect identifies patterns with uncertainty ("is this a real pattern or coincidence?"), it suggests spikes. The reflector becomes a spike source, not just a lesson distiller. | LOW | Reflector output includes "Spike Candidates" section: patterns where confidence is LOW or evidence is mixed. Suggests spike question, type, and scope. | Enhanced reflector, lightweight spike mode |
| Proactive spike surfacing | When open questions appear in CONTEXT.md, RESEARCH.md, or deliberations, the system suggests `/gsd:spike` rather than waiting for the user to know it exists. Currently, spikes are invisible -- the user must know to invoke them. | MEDIUM | Phase researcher and planner check for unresolved questions. If questions match spike-integration.md criteria, surface suggestion: "This looks like a spike candidate. Run `/gsd:spike` to investigate." | Spike integration wiring |
| Tiered spike types | Three tiers: (1) Research spike (question -> research -> decision), (2) Prototype spike (existing BUILD -> RUN -> DOCUMENT), (3) Comparative spike (test A vs B with measurements). Each tier has appropriate ceremony level. | MEDIUM | `spike_type` in DESIGN.md: `research`, `prototype`, `comparative`. Different flows for each. Research: ~5 min. Prototype: ~30 min. Comparative: ~60 min. | Lightweight spike mode |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| A/B testing framework | Run production A/B tests from spike infrastructure | GSD is a development workflow tool, not a production testing platform. A/B testing has specific infrastructure requirements (traffic splitting, statistical significance) that are out of scope. | Comparative spikes compare approaches in development context. Production A/B testing is an application-level concern, not a workflow concern. |
| Spike templates library | Pre-built spike templates for common questions | Templates for spikes risk cargo-culting. The value of a spike is the specific question and hypothesis, not the format. Templates make spikes feel heavyweight. | Minimal DESIGN.md structure (question, hypothesis, success criteria) generated by the spike command. Less ceremony, more thinking. |
| Automated spike scheduling | System auto-schedules spikes for unresolved questions | Spikes require focused attention and fresh context windows. Auto-scheduling creates context-switching overhead and may investigate questions that resolved naturally. | Surface spike candidates in reflect output. User decides when to investigate. Nudge, don't automate. |

---

## Feature Dependencies

```
[Signal Schema Extensions (triage, remediation, verification, evidence)]
    |
    +--enables--> [Triage metadata]
    |                 |
    |                 +--enables--> [Triage in reflect]
    |                 |                 |
    |                 |                 +--enables--> [Auto-triage YOLO mode]
    |                 |                 |
    |                 |                 +--enables--> [Triage-to-remediation bridge]
    |                 |
    |                 +--enables--> [Signal lifecycle dashboard]
    |
    +--enables--> [Remediation metadata]
    |                 |
    |                 +--enables--> [resolves_signals in PLAN.md]
    |                 |                 |
    |                 |                 +--enables--> [Auto remediation status update]
    |                 |
    |                 +--enables--> [Recurrence linking]
    |                                   |
    |                                   +--enables--> [Verification-by-absence]
    |                                   |
    |                                   +--enables--> [Verification failure on recurrence]
    |                                   |
    |                                   +--enables--> [Recurrence escalation]
    |                                   |
    |                                   +--enables--> [Root cause evolution tracking]
    |
    +--enables--> [Counter-evidence fields]
    |                 |
    |                 +--enables--> [Confidence-weighted thresholds]
    |                 |                 |
    |                 |                 +--enables--> [Counter-evidence seeking in patterns]
    |                 |
    |                 +--enables--> [Epistemic layers (L0/L1/L2)]
    |
    +--enables--> [Signal mutability relaxation]

[Multi-Sensor Orchestrator]
    |
    +--enables--> [Artifact sensor (formalized)]
    |
    +--enables--> [Git sensor]
    |
    +--enables--> [Log sensor] (needs spike for log accessibility)
    |
    +--enables--> [Positive signal emission]
    |
    +--enables--> [Cross-sensor dedup / synthesizer]
    |                 |
    |                 +--enables--> [Passive verification inside collect-signals]
    |
    +--enables--> [Sensor gap meta-detection]

[Enhanced Reflector]
    |
    +--requires--> [Signal schema extensions]
    +--requires--> [Multi-sensor orchestrator]
    |
    +--enables--> [Triage in reflect]
    +--enables--> [Confidence-weighted thresholds]
    +--enables--> [Counter-evidence seeking]
    +--enables--> [Remediation suggestions]
    +--enables--> [Reflect-to-spike pipeline]
    +--enables--> [Lifecycle dashboard]

[Lightweight Spike Mode]
    |
    +--independent of signal lifecycle (can be built in any order)
    |
    +--enhanced-by--> [Reflect-to-spike pipeline]
    +--enhanced-by--> [Proactive spike surfacing]

[Feature Manifest Extensions]
    |
    +--enables--> [Configurable sensor enablement]
    +--enables--> [spike_sensitivity config]
```

### Dependency Notes

- **Signal schema extensions are the foundation.** Triage, remediation, verification, and evidence blocks all live in the signal schema. Everything depends on defining these extensions first.
- **Multi-sensor orchestrator is parallel-buildable.** The orchestrator pattern and sensors can be built independently of (and concurrently with) the schema extensions and reflector enhancement.
- **Enhanced reflector depends on BOTH schema extensions AND orchestrator.** The reflector needs lifecycle-aware signals (schema) and richer signal sources (sensors) to do meaningful work.
- **Recurrence detection depends on remediation metadata.** Cannot detect recurrence of a remediated issue if there's no remediation tracking. This creates a natural ordering: schema -> remediation -> recurrence.
- **Passive verification depends on recurrence detection.** Verification-by-absence only works if the system can detect recurrence (to know absence is meaningful).
- **Lightweight spike is independent.** Can be built in any order. No dependencies on the signal lifecycle. Enhanced by reflect-to-spike pipeline but works standalone.
- **Epistemic rigor is cross-cutting.** Counter-evidence fields affect sensor design, reflector methodology, and verification templates. Should be designed early, applied throughout.

### Critical Path

The minimal viable signal lifecycle requires this ordering:
1. Signal schema extensions (foundation)
2. Signal mutability relaxation (enables lifecycle)
3. Multi-sensor orchestrator + sensors (better detection)
4. Cross-sensor dedup/synthesizer (prevents noise explosion)
5. Enhanced reflector with triage + remediation (closes the loop)
6. Recurrence detection + passive verification (validates fixes)

Epistemic rigor fields should be included in step 1 (schema) so all downstream components inherit the structure.

---

## MVP Definition

### Launch With (v1.16)

Minimum features to close the signal-to-lesson gap. Focused on completing the lifecycle, not perfecting each stage.

- [ ] **Signal schema extensions** -- Add triage, remediation, verification, and evidence blocks to signal frontmatter. Relax immutability for lifecycle fields. Update knowledge-store.md.
- [ ] **Counter-evidence fields as schema requirement** -- All new signals must have `evidence.supporting`, `evidence.counter`, `confidence`, `confidence_basis`. Sensors cannot emit without these fields.
- [ ] **Multi-sensor orchestrator** -- Refactor collect-signals from single-agent to orchestrator pattern. Start with artifact-sensor (existing) + git-sensor (new). Log sensor deferred pending spike on log accessibility.
- [ ] **Cross-sensor deduplication** -- Signal synthesizer merges raw sensor outputs. Prevents noise multiplication from multi-sensor approach.
- [ ] **Enhanced reflector with triage** -- Reflector reads lifecycle metadata, proposes triage decisions, generates remediation suggestions, creates lessons from completed cycles.
- [ ] **Confidence-weighted pattern detection** -- Pattern thresholds factor in signal confidence, not just count. Counter-evidence seeking on candidate patterns.
- [ ] **resolves_signals in plan frontmatter** -- Plans declare which signals they fix. Auto-update remediation status on plan completion.
- [ ] **Recurrence detection + passive verification** -- Sensors check for recurrence of remediated signals. Verification-by-absence after N phases without recurrence.
- [ ] **Lightweight spike mode** -- Research-only spikes (question -> research -> decision) without BUILD/RUN phases.
- [ ] **Positive signal emission** -- Sensors emit what went right (baselines) alongside what went wrong.

### Add After Validation (v1.16.x)

Features to add once the core lifecycle proves itself. Trigger: at least one full cycle (detect -> triage -> remediate -> verify) completed.

- [ ] **Log sensor** -- Requires spike on Claude Code session log accessibility. Add once log location/format confirmed.
- [ ] **Remediation quality assessment** -- "Was it addressed well?" comparison of fix approach vs root cause. Trigger: multiple remediation cycles provide comparison data.
- [ ] **Epistemic layers (L0/L1/L2)** -- Formal claim progression through verification stages. Trigger: after counter-evidence fields prove useful in practice.
- [ ] **Evidence decay tracking** -- Active checking of `depends_on` conditions on KB entries. Trigger: KB has enough entries with `depends_on` populated to justify the check.
- [ ] **Verifiable claims in STATE.md** -- Structured claim metadata with verification commands. Trigger: after health-check enhanced with belief verification.
- [ ] **Tiered spike types** -- Research/prototype/comparative tiers. Trigger: after lightweight spike proves the pattern and users request more structure for complex investigations.

### Future Consideration (v1.17+)

- [ ] **Metrics sensor (token tracking)** -- Requires Claude Code to expose usage data. Defer: data source unavailable.
- [ ] **Sensor gap meta-detection** -- Detecting blind spots in sensor coverage. Defer: needs substantial signal history to distinguish "sensor missed it" from "nothing to detect."
- [ ] **Recurrence escalation with auto-lesson** -- Third recurrence auto-distills lesson. Defer: needs proven recurrence detection first.
- [ ] **Proactive spike surfacing in plan-phase** -- Auto-suggesting spikes from research gaps. Defer: needs spike integration wiring audit first, which may reveal the wiring already exists or is trivially fixable.
- [ ] **External feedback sensor** -- Signals from deployed users. Defer: different domain (network infrastructure), needs own design thinking. Sensor interface designed for extensibility.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Area |
|---------|------------|---------------------|----------|------|
| Signal schema extensions (all lifecycle blocks) | HIGH | LOW | P1 | Schema |
| Counter-evidence fields as schema requirement | HIGH | LOW | P1 | Epistemic |
| Signal mutability relaxation | HIGH | LOW | P1 | Schema |
| Multi-sensor orchestrator pattern | HIGH | MEDIUM | P1 | Detection |
| Artifact sensor formalization | MEDIUM | LOW | P1 | Detection |
| Git sensor | HIGH | MEDIUM | P1 | Detection |
| Cross-sensor deduplication | HIGH | MEDIUM | P1 | Detection |
| Enhanced reflector with triage | HIGH | HIGH | P1 | Reflection |
| Confidence-weighted pattern detection | HIGH | MEDIUM | P1 | Epistemic |
| resolves_signals in plan frontmatter | HIGH | LOW | P1 | Remediation |
| Auto remediation status update | MEDIUM | MEDIUM | P1 | Remediation |
| Recurrence detection | HIGH | MEDIUM | P1 | Verification |
| Passive verification (absence-based) | HIGH | MEDIUM | P1 | Verification |
| Positive signal emission | MEDIUM | MEDIUM | P1 | Epistemic |
| Lightweight spike mode | MEDIUM | MEDIUM | P1 | Spike |
| Bulk triage by cluster | MEDIUM | LOW | P2 | Triage |
| Auto-triage YOLO mode | MEDIUM | MEDIUM | P2 | Triage |
| Triage-to-remediation bridge | MEDIUM | MEDIUM | P2 | Triage |
| Lifecycle dashboard in reflect | LOW | LOW | P2 | Triage |
| Recurrence escalation | MEDIUM | LOW | P2 | Verification |
| Reflect-to-spike pipeline | MEDIUM | LOW | P2 | Spike |
| Spike integration wiring audit | LOW | LOW | P2 | Spike |
| spike_sensitivity config | LOW | LOW | P2 | Spike |
| Configurable sensor enablement | LOW | LOW | P2 | Detection |
| Per-sensor model assignment | LOW | LOW | P3 | Detection |
| Log sensor | HIGH | HIGH | P3 (blocked) | Detection |
| Remediation quality assessment | MEDIUM | MEDIUM | P3 | Remediation |
| Epistemic layers (L0/L1/L2) | MEDIUM | MEDIUM | P3 | Epistemic |
| Evidence decay tracking | MEDIUM | HIGH | P3 | Epistemic |
| Verifiable claims | MEDIUM | MEDIUM | P3 | Epistemic |
| Root cause evolution tracking | MEDIUM | MEDIUM | P3 | Verification |

**Priority key:**
- P1: Must have for v1.16 launch -- closes the signal-to-lesson gap
- P2: Should have -- improves quality of each lifecycle stage
- P3: Nice to have or blocked -- defer to v1.16.x or v1.17+

---

## Feature Interaction Map

How the six capability areas feed each other in the completed system:

```
                         +-------------------+
                         |  MULTI-SENSOR     |
                         |  DETECTION        |
                         |  (Area 1)         |
                         +--------+----------+
                                  |
                    raw signals with evidence
                    (supporting + counter)
                                  |
                                  v
                    +-------------------+
                    |  DEDUP &          |
                    |  SYNTHESIS        |
                    |  (Area 1)         |
                    +--------+----------+
                             |
               deduplicated, enriched signals
                             |
                +------------+------------+
                |                         |
                v                         v
    +-------------------+     +-------------------+
    |  RECURRENCE       |     |  TRIAGE           |
    |  CHECK            |     |  (Area 2)         |
    |  (Area 4)         |     +--------+----------+
    +--------+----------+              |
             |                    triage decisions
    verification updates          (address/defer/dismiss)
    (confirmed/failed)                 |
             |                         v
             |            +-------------------+
             +----------> |  REMEDIATION      |
                          |  TRACKING         |
                          |  (Area 3)         |
                          +--------+----------+
                                   |
                          remediation outcomes
                                   |
                                   v
                          +-------------------+
                          |  ENHANCED         |
                          |  REFLECTOR        |
                          |  (Area 2+5)       |
                          +--------+----------+
                                   |
                      +------------+------------+
                      |            |            |
                      v            v            v
                  LESSONS    SPIKE         REMEDIATION
                  (KB)       CANDIDATES    SUGGESTIONS
                             (Area 6)      (Area 3)
```

**Key interactions:**

1. **Detection -> Triage:** Sensors produce signals; reflector triages them. Without quality detection (Area 1), triage is noise management. Without triage (Area 2), detection produces dead letters.

2. **Triage -> Remediation:** "Address" decisions flow into plan creation via `resolves_signals`. Without this bridge, triage is acknowledgment without action.

3. **Remediation -> Verification -> Recurrence:** Completed remediations get verified by subsequent sensor runs checking for recurrence. This is the self-correcting loop -- the system learns whether its fixes actually work.

4. **Recurrence -> Escalation -> Lessons:** Recurring issues (verification failed) escalate in severity and become prime lesson candidates. The system preferentially learns from persistent problems.

5. **Epistemic Rigor (Area 5) permeates everything:** Counter-evidence requirements in sensors prevent false detections. Confidence weighting in the reflector prevents false patterns. Evidence decay in KB prevents stale lessons. This is not a separate stage -- it's a quality attribute of every stage.

6. **Spikes (Area 6) resolve uncertainty:** When the reflector encounters low-confidence patterns, it suggests spikes. Spike decisions feed back into the knowledge base, improving future reflection quality.

---

## Existing System Gap Analysis

What exists vs. what's needed, identifying the delta per component.

### Signal Schema (knowledge-store.md)

**Current:** Base schema with signal extensions (severity, signal_type, phase, plan). Optional: polarity, source, occurrence_count, related_signals, runtime, model. Signals are immutable except archival.

**Needed:** Add triage, remediation, verification, and evidence blocks. Relax immutability for lifecycle fields. Add recurrence_of, previous_remediations fields.

**Gap:** Schema definition (LOW), immutability policy update (LOW), template updates (LOW). Backward compatible -- new fields optional on existing signals.

### Signal Collector (gsd-signal-collector.md)

**Current:** Single-agent that reads PLAN/SUMMARY/VERIFICATION artifacts. Detects deviations, config mismatches, struggles. Writes signals with dedup.

**Needed:** Becomes one sensor (artifact-sensor) within a multi-sensor orchestrator. Add evidence structure to output. Add recurrence checking.

**Gap:** Refactor to sensor identity (MEDIUM), add evidence fields (LOW), add recurrence check step (MEDIUM).

### Reflector (gsd-reflector.md)

**Current:** Reads signals, clusters by tag/type, applies severity-weighted thresholds, compares PLAN vs SUMMARY, distills lessons. Has NO agent-protocol reference (tech debt). Does not read or update lifecycle metadata.

**Needed:** Add triage step, remediation suggestion generation, confidence-weighted pattern detection with counter-evidence seeking, lifecycle dashboard output. Fix agent-protocol reference.

**Gap:** Significant enhancement (HIGH). The reflector is the component with the most new responsibility. Multiple new steps in execution flow.

### Spike System (gsd-spike-runner.md)

**Current:** Full DESIGN -> BUILD -> RUN -> DOCUMENT flow. Only 1 spike created, stuck at designing. Integration with plan-phase may not be wired.

**Needed:** Add lightweight research-only mode. Audit and fix integration wiring. Add spike_sensitivity to feature manifest.

**Gap:** New spike type (MEDIUM), wiring audit (LOW), config addition (LOW).

### Collect-Signals Command (collect-signals.md)

**Current:** Single workflow spawning single agent.

**Needed:** Orchestrator spawning multiple sensors + synthesizer. Passive verification as side-effect.

**Gap:** Command interface unchanged. Workflow becomes orchestrator (MEDIUM). New agents added (git-sensor: MEDIUM).

### Plan.md Template

**Current:** No `resolves_signals` field.

**Needed:** Optional `resolves_signals` array in frontmatter. Planner populates when creating plans from triaged signals.

**Gap:** Template addition (LOW), planner awareness of signal references (MEDIUM).

---

## Sources

- [Incident Management Lifecycle (InvGate)](https://blog.invgate.com/incident-management-lifecycle) -- Triage, remediation, verification, closure phases [MEDIUM confidence -- practitioner resource]
- [SOC Alert Lifecycle (Expel)](https://expel.com/cyberspeak/what-does-the-soc-alert-lifecycle-look-like/) -- Alert triage workflow patterns [MEDIUM confidence -- security domain]
- [AIOps Intelligent Correlation (Datadog)](https://www.datadoghq.com/blog/aiops-intelligent-correlation/) -- Cross-signal dedup, noise reduction (70-85% compression), enrichment patterns [MEDIUM confidence -- vendor but domain-authoritative]
- [AIOps Explained (Splunk)](https://www.splunk.com/en_us/blog/learn/aiops.html) -- Aggregation, dedup, normalization, correlation pipeline [MEDIUM confidence -- vendor but well-documented]
- [AI-Assisted Engineering Epistemic Status Tracking (arxiv 2601.21116)](https://arxiv.org/html/2601.21116) -- Epistemic layers (L0-L2), evidence decay (20-25% stale within 2 months), conservative assurance aggregation [HIGH confidence -- peer-reviewed research]
- [Triage in Software Engineering (arxiv 2511.08607)](https://arxiv.org/html/2511.08607v1) -- Systematic review of triage practices in software engineering [HIGH confidence -- systematic review]
- [Spikes in SAFe (Scaled Agile Framework)](https://framework.scaledagile.com/spikes/) -- Technical vs functional spikes, time-boxing, acceptance criteria [HIGH confidence -- established framework]
- [ICLR 2026 Workshop on AI with Recursive Self-Improvement](https://openreview.net/pdf?id=OsPQ6zTQXV) -- Self-improving AI systems, feedback loops [MEDIUM confidence -- workshop proceedings]
- [Self-Healing ML Pipelines (preprints.org)](https://www.preprints.org/manuscript/202510.2522) -- Drift detection, automated remediation, feedback loop integration [MEDIUM confidence -- preprint]
- [Rigor in AI (arxiv 2506.14652)](https://arxiv.org/abs/2506.14652) -- Broader conceptions of rigor: epistemic, normative, conceptual, reporting, interpretative [HIGH confidence -- peer-reviewed]
- Existing GSD codebase analysis: signal-detection.md, reflection-patterns.md, knowledge-store.md, gsd-signal-collector.md, gsd-reflector.md, gsd-spike-runner.md, deliberation documents [HIGH confidence -- primary source]
- GSD v1.16 deliberation document: `.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md` [HIGH confidence -- primary source, project owner authored]

---
*Feature research for: Signal lifecycle, self-improving reflection, epistemic rigor*
*Researched: 2026-02-27*
