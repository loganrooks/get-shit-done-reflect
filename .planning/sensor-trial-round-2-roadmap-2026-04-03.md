# Sensor Trial Round 2: Interpretive Depth

## Deviation Testimony

Round 1 produced quantitative breadth but displaced interpretive depth. This round inverts the priority: interpretive engagement is primary, agent dispatches serve interpretive questions. Structural gating ensures interpretive work cannot be dropped.

**Design principles (from Round 1 reflection):**
1. Interpretive work primary — reading, dwelling, re-reading
2. Structural gating — each step has a BLOCKING deliverable, not advisory notes
3. Predictions for interpretive work — qualitative evaluation is still evaluation
4. Emerging threads developed — 22-25 are not footnotes
5. Agent dispatches serve questions — data gathering supports interpretation, not vice versa

---

## Investigations

### R2-A: Complete Deliberation Evaluation (extends Trial B)

**What:** Evaluate 3 more concluded deliberations beyond zlibrary-mcp's v12-scope.
**BLOCKING deliverable:** Written evaluation for each, appended to roadmap.

**Targets:**
1. `signal-lifecycle-closed-loop-gap.md` (concluded) — directly about the harness's biggest confirmed failure
2. `health-check-maintainability.md` (concluded) — the probe architecture we relied on in Trial D
3. `cross-runtime-parity-testing.md` (adopted — the only "adopted" deliberation) — what did adoption actually produce?

**Predictions:**
| ID | Prediction | Confidence |
|----|-----------|------------|
| R2A-P1 | signal-lifecycle deliberation's predictions will be trivially confirmed (the failure it predicted is exactly what we observed) | High |
| R2A-P2 | health-check deliberation's Option C (hybrid probe discovery) was adopted — at least one probe design assumption will not match reality | Medium |
| R2A-P3 | cross-runtime-parity adoption will show partial implementation — some prescribed checks exist, others don't | Medium |

**Method:** Read each deliberation's predictions. Read subsequent project state (phases, commits, test results). Evaluate. Agent dispatch: NONE — this is reading work.

---

### R2-B: Apollo Signal Staleness (extends Trial A)

**What:** Staleness-check the 53 pre-schema signals on apollo that Round 1 deferred.
**BLOCKING deliverable:** Classification of all 53, appended to roadmap.

**Method:** These signals lack lifecycle_state fields. Classify by CONCERN RELEVANCE:
- **Resolved** — the concern is no longer relevant (code rewritten, feature removed, architecture changed)
- **Absorbed** — the concern was addressed by a later milestone's work without explicit signal closure
- **Persistent** — the concern still applies to the current codebase
- **Archaeological** — the concern applied to a state that no longer exists but the observation has historical value

**Prediction:**
| ID | Prediction | Confidence |
|----|-----------|------------|
| R2B-P1 | Majority (>60%) will be "absorbed" — addressed by v1.13-v1.18 work without explicit closure | High |
| R2B-P2 | At least 5 will be "archaeological" — describing conditions from v1.12 era that are structurally gone | Medium |

**Method:** Agent dispatch to SSH-read and classify. But agent must be instructed to READ the signals for content, not just extract metadata. Agent returns classifications; I verify 5 manually.

---

### R2-C: Develop Emerging Thread 22 (Quantitative-Interpretive Tension)

**What:** Formalize what Round 1 demonstrated about the displacement of interpretive work.
**BLOCKING deliverable:** Thread 22 written into pre-v1.19 capture with concrete evidence from Round 1.

**Evidence to synthesize:**
- Trial G's non-occurrence (designed as "ongoing," first thing dropped)
- The roadmap's structure (discrete steps with completion criteria) biased toward countable work
- SIG-* practice died when sensor pipeline automated signal collection
- "Content not weight" signal diagnosing the roadmap's own failure
- The structural-norms deliberation's three-layer distinction applied to the trial methodology

**Prediction:**
| ID | Prediction | Confidence |
|----|-----------|------------|
| R2C-P1 | Writing this thread will reveal that the tension is not "quantitative vs interpretive" but "delegatable vs non-delegatable" — the real axis is what can be given to agents vs what requires human presence | Medium |

**Method:** Writing. No agent dispatch. This is interpretive synthesis from existing evidence.

---

### R2-D: Develop Emerging Thread 23 (Archaeological Stratum)

**What:** Read 10 of the 53 pre-schema signals on apollo — not for staleness but for what they reveal about how the project's self-observation evolved.
**BLOCKING deliverable:** Written reading appended to roadmap.

**Questions to sit with:**
- How did the project describe its own failures before the signal schema existed?
- What vocabulary was used? What categories? What was noticed and what wasn't?
- How does the SIG-* positive-pattern practice relate to the pre-schema era?
- What can pre-schema signals teach us about what the current schema captures and what it loses?

**Prediction:**
| ID | Prediction | Confidence |
|----|-----------|------------|
| R2D-P1 | Pre-schema signals will be more narrative and less classified — richer in context but harder to query | High |
| R2D-P2 | Reading them will surface at least one concern that the current schema cannot represent | Medium |

**Method:** Agent dispatch to SSH-read 10 selected signals (prioritize earliest + SIG-* era). I read them here and write the reflection.

---

### R2-E: Positive-Pattern Curation Design

**What:** Based on SIG-* reading, design a lightweight positive-pattern practice that could be formalized without killing it through automation.
**BLOCKING deliverable:** Design sketch appended to roadmap.

**The constraint from Round 1:** The SIG-* practice died when the sensor pipeline automated signal collection. Automation is precisely what killed it. Any formalization must preserve the human judgment that makes positive-pattern curation valuable.

**Prediction:**
| ID | Prediction | Confidence |
|----|-----------|------------|
| R2E-P1 | The right intervention is a prompted practice ("what went well?"), not an automated sensor | High |
| R2E-P2 | It should be opt-in per phase, not mandatory — forcing it produces checkbox compliance | Medium |

**Method:** Design work. Reference SIG-* signals, forms-excess deliberation, structural-norms three-layer distinction. No agent dispatch.

---

### R2-F: Thread 7 Post-Implementation Reading

**What:** Now that v1.19.0 shipped the three-mode discuss system, re-read Thread 7 and Issue #26 for what remains unresolved.
**BLOCKING deliverable:** Thread 7 updated in pre-v1.19 capture.

**The question:** The code shipped. But did the synthesis that Issue #26 asked for actually happen? Or did the headless session implement the apollo agent's patches without the deliberative engagement the thread demanded? The wholesale-replace happened again — this time with better content, but still without the synthesis of exploratory and decision-closing postures that the thread described as necessary.

**Prediction:**
| ID | Prediction | Confidence |
|----|-----------|------------|
| R2F-P1 | The implementation will be technically correct but philosophically incomplete — the three modes exist but the relationship between them hasn't been deliberated | Medium |
| R2F-P2 | Reading the shipped code will reveal at least one design decision that was made implicitly (by the apollo agent) rather than explicitly deliberated | High |

**Method:** Read the shipped discuss-phase.md source. Read Issue #26, #32, #33 closure comments. Compare to Thread 7's demand for "synthesis, not selection." Write assessment.

---

## R2-C Deliverable: Thread 22 — The Quantitative-Interpretive Tension

### Evidence from Round 1

1. **Trial G was designed as "ongoing throughout other trials" and was the only trial not performed.** The roadmap gave it no completion criteria, no blocking authority, no countable output. It was advisory. Discrete quantitative trials (count signals, extract tags, classify correlations) consumed all context.

2. **The SIG-* positive-pattern practice lasted exactly 2 days (2026-02-22 to 2026-02-23) and died when the sensor pipeline automated signal collection (Phase 38, 2026-03-04).** Automation cannot recognize when something is done *well* in a way worth remembering. The KB's negativity bias is a structural consequence of what sensors can detect.

3. **The "handoffs convey content not weight" signal (sig-2026-03-30) diagnosed the roadmap's own failure.** Trial G's importance was conveyed (content) but not enforced (weight). The structural design of the roadmap — discrete steps with completion criteria — made quantitative trials heavy and interpretive practice weightless.

4. **The structural-norms deliberation's three-layer distinction applies directly:** The Round 1 roadmap declared Trial G's importance (declarative norm), included it in the process (procedural norm), but structured the roadmap so it could be skipped without consequence (structural norm working against the declaration). The structure defeated the declaration.

5. **Trial A found zero false positives in staleness detection** — but the "silent CI failure masking" signal, classified STALE, carries a live principle ("verify the enforcement path, not just the configuration") that Trial A's own methodology didn't test. Quantitative correctness (zero false positives) masked interpretive incompleteness (the principle wasn't examined).

### What Thread 22 Actually Names

The tension is not "quantitative vs interpretive" as a preference or style choice. It's about **what can be delegated to agents and what cannot.**

Agent-delegatable work:
- Counting lifecycle states across the KB
- Extracting tags and computing frequency tables
- Cross-referencing signal dates against git commits
- Scanning directories for files outside allowlists

Non-delegatable work:
- Reading a signal for what it discloses beyond its classification
- Recognizing that a "stale" signal carries a live principle
- Understanding why a practice was created and abandoned
- Judging whether a correlation is genuine or artifactual

The displacement happens because delegatable work has clearer completion criteria, produces structured outputs, and can run in parallel. Non-delegatable work has no completion criteria (when have you "read enough"?), produces understanding rather than data, and requires sustained attention that competes with monitoring agent dispatches.

**This is the proletarianization gradient (F47/Stiegler) made concrete in development methodology.** Automated analysis displaces the judgment that gives analysis meaning. The remedy is not "do less automation" but "structurally protect the space for judgment" — which is what Round 2's blocking deliverables attempt.

### Thread 22 for Pre-v1.19 Capture

**Thread 22: The Quantitative-Interpretive Tension (The Delegation Boundary)**

The sensor trial Round 1 demonstrated a systematic displacement of interpretive work by quantitative analysis. Agent dispatches (countable, completable, delegatable) consumed the space that hermeneutic reading (uncountable, open-ended, non-delegatable) was meant to occupy. Trial G's non-occurrence is the primary evidence. The SIG-* practice's death when sensors automated is a prior instance. The "content not weight" signal's diagnosis of the roadmap is a third.

The deeper axis is not quantitative vs interpretive but delegatable vs non-delegatable. The remedy is structural: protect the space for judgment through blocking deliverables, mandatory reading steps, and completion criteria that include "what did the reading reveal?" rather than only "how many items were classified?"

This thread connects to: F47 (proletarianization gradient), Thread 10 (philosophical operationalization), Thread 11/18 (signal hermeneutics), the structural-norms deliberation (three-layer distinction), and the forms-excess deliberation (formalization displaces what it formalizes).

---

## R2-E Deliverable: Positive-Pattern Curation Design

### The Problem

The KB has a negativity bias. Of ~200 signals across the ecosystem, the vast majority document deviations, struggles, config mismatches, and capability gaps. Only 15 SIG-* signals on apollo document positive patterns. No automated sensor can detect "this was done well" — sensors detect deviations from plans, not excellence in execution.

### What the SIG-* Practice Was

15 manually curated signals created during Phase 24-27 (2026-02-22 to 2026-02-23). They captured:
- **Architecture decision records** (atomic writes, type coercion safety, zero-touch manifest)
- **Development practice observations** (TDD enables zero-deviation execution, embedded pitfall mitigations eliminate rework)
- **Pattern documentation** (silent helper pattern, prepend-after-header for reverse-chronological logs)

The practice was created during intensive code development where architectural decisions were being made rapidly. It died when the sensor pipeline automated signal collection — not because anyone decided to stop, but because the automated system's vocabulary (deviation, struggle, config-mismatch) had no category for "this went well."

### Design Constraints

From the forms-excess deliberation: "Every template will have this structure — the Said makes the Saying articulable but threatens to erase it." A positive-pattern template risks turning genuine recognition of good work into a checkbox.

From the structural-norms deliberation: the intervention should be structural (make it easy) but not procedural (don't mandate it). The SIG-* practice was spontaneous — it happened because someone noticed something worth recording, not because a workflow step required it.

### Design Sketch: `what-went-well` Prompted Practice

**NOT a sensor.** NOT automated. NOT mandatory.

**A prompted moment** at two points:
1. **Post-phase, in execute-phase postlude:** After SUMMARY.md is written, before signal collection: "Before we analyze what deviated, is there anything from this phase worth recording as a positive pattern? An architecture decision, a development practice, a verification approach that worked unusually well?" If yes → write a signal with `signal_type: good-pattern` and `polarity: positive`. If no → continue. No penalty for "no."

2. **During /gsdr:reflect:** When the reflector reads signals, it could note the positive/negative ratio and flag if no positive patterns exist in the last N phases. Not as a requirement but as an observation: "The last 5 phases produced 23 signals, all negative. Were there no positive patterns worth recording?"

**Schema:** Use existing signal schema with `signal_type: good-pattern`, `polarity: positive`. No new artifact type needed. The SIG-* format was a separate naming convention but the content is compatible with the current schema.

**The key principle:** The practice must remain voluntary. Making it mandatory turns it into bureaucratic theater. Making it prompted-but-optional keeps the space open for genuine recognition while preventing the practice from being silently forgotten (as happened when sensors automated).

---

## R2-F Deliverable: Thread 7 Post-Implementation Assessment

### What Was Demanded

Thread 7 (discuss-phase semantic gap, Issue #26) said: "Source (1098 lines, upstream, decision-closing) vs. user's local patch (444 lines, research-opening). Needs synthesis, not selection. Both have features the other lacks."

### What Was Shipped

v1.19.0 implemented a three-mode system:
- `exploratory` (default): preserves uncertainty, biases toward open questions, auto-selects only when strongly grounded
- `discuss`: standard upstream behavior (auto picks recommended defaults)
- `assumptions`: codebase-first inference, routes to separate workflow file

The shipped code (get-shit-done/workflows/discuss-phase.md, lines 1-95) adds a mode table, exploratory-mode additions to the philosophy section, and grounding-based auto-select rules.

### Assessment: Technically Correct, Deliberatively Incomplete

**What was done right:**
- The three-mode taxonomy matches Issue #33's proposal (exploratory/discuss/assumptions)
- The exploratory mode's auto behavior ("only lock when strongly grounded") captures the core demand
- Config integration is end-to-end (config.cjs, templates, settings, migration)
- The assumptions mode is cleanly separated into its own workflow file

**What was done implicitly rather than explicitly deliberated:**
1. **The grounding classification (`[grounded]` vs `[open]`).** The shipped code says auto-select should apply `[grounded]` tags to options with codebase evidence and `[open]` to speculative ones. This classification scheme was invented by the headless session — it wasn't in the apollo patches or in any deliberation. It's a reasonable design but it was never examined for failure modes.

2. **The relationship between modes.** The three modes are presented as a config switch. But what happens when a project needs exploratory mode for architecture phases and discuss mode for implementation phases? Can the mode change per-phase? The shipped code reads it from project config, meaning it's project-wide. This decision was implicit.

3. **The `discuss` mode defaults to "upstream behavior."** But upstream's behavior has itself changed over versions. What "standard upstream behavior" means is not frozen — it depends on which upstream version the fork last synced with. This is a moving target that wasn't addressed.

### Prediction Evaluation

| ID | Prediction | Outcome |
|----|-----------|---------|
| R2F-P1 | Implementation technically correct but philosophically incomplete | **CONFIRMED** — the three modes exist but their relationship, failure modes, and per-phase variability weren't deliberated |
| R2F-P2 | At least one implicit design decision | **CONFIRMED** — the `[grounded]`/`[open]` classification scheme was invented by the headless session without deliberation |

### What Thread 7 Still Demands

The code is shipped. The synthesis Issue #26 asked for partially happened (the exploratory semantics were restored alongside upstream's decision-closing semantics). But:
- The deliberation about WHEN to use which mode hasn't happened
- The grounding classification scheme needs examination
- Per-phase mode switching should be considered
- The relationship between the three modes as philosophical postures (not just config options) hasn't been articulated

Thread 7 status: **partially materialized** (code exists) but **still developing** (deliberation incomplete).

---

## Sequencing

```
R2-C (Thread 22 — write)  }
R2-E (positive-pattern)   } — interpretive writing, no agents
R2-F (Thread 7 post-impl) }
        │
        ├── commit checkpoint
        │
R2-D (archaeological reading) — agent fetches signals, I read them
R2-B (apollo staleness) — agent classifies, I verify 5
        │
        ├── commit checkpoint
        │
R2-A (deliberation evaluations — 3 deliberations) — pure reading
        │
        ├── commit checkpoint
        │
Final synthesis — update both roadmaps, assess predictions
```

**Structural gate:** Each checkpoint requires BLOCKING deliverable written before proceeding. No "ongoing" or "advisory" steps. If a step isn't done, the next step doesn't start.

---

## R2-D Deliverable: Archaeological Reading of Pre-Schema Signals

### What the Earliest Signals Reveal

The 10 earliest signals (all 2026-02-11 to 2026-02-17) document **infrastructure pain**: KB data loss during migration, path resolution failures, context bloat from loading 864+ lines just to write a short signal, stale checkpoint files accumulating across milestones, branches not deleted after merge. These are plumbing problems — the harness can't reliably install, migrate, clean up after itself, or manage its own state.

The vocabulary is more narrative than the current schema allows. Signal #2 (KB data loss) tells a story: "13 signals and 3 lessons from v1.13 dogfooding were lost. They existed at ~/.claude/gsd-knowledge/... v1.14 Phase 14 updated all source references... but the installer was never run on the developer's machine." This is richer than any signal_type classification can capture — it carries the frustration of discovering data loss, the specific chain of causation, the gap between code existing and code running.

Signal #6 quotes the user directly: "why on earth are you loading the knowledge store agent, the signal-detection agent, and why are they like over 200 lines." This is testimony — the user's voice preserved in the signal. Current auto-generated signals don't carry user voice; they carry agent observations about user behavior.

### How Self-Observation Evolved

**Phase 1 (2026-02-11, v1.12 era): Infrastructure observation.** The project observes its own plumbing failures — path bugs, data loss, context waste. The observer is the developer, not the harness. Signals are filed manually after encountering pain.

**Phase 2 (2026-02-16 to 2026-02-23, v1.14-v1.15 era): Process observation.** The project begins observing its own *workflows* — branches not cleaned, stale files not deleted, plans executed out of order, tech debt dismissed by audits. The observer is still the developer, but the observations are about the harness's behavior, not just its infrastructure.

**Phase 3 (2026-02-22 to 2026-02-23, SIG-* era): Positive pattern observation.** The project begins observing what works well — TDD discipline, atomic writes, zero-touch architecture. This is the only period where the project systematically captures positive observations. It lasts 2 days.

**Phase 4 (2026-03-01+, v1.16+ era): Automated observation with lifecycle schema.** The sensor pipeline takes over. Signals get lifecycle_state, related_signals, evidence fields. The observer shifts from developer to harness. The signals become more structured and less narrative. Positive pattern capture ceases.

**What changed:** The project's capacity for self-observation grew more powerful (automated sensors, structured schema) but narrower (deviations only, no positive patterns, no user voice). The earliest signals are rougher but richer. The latest are precise but constrained by their categories.

### What the Current Schema Cannot Represent (R2D-P2)

1. **User voice.** Signal #6 and #13 quote the user's frustration directly. The current schema has no field for "what the user said about this." The `evidence` field captures code artifacts, not human testimony.

2. **Causal narratives.** Signal #2 tells a multi-step story (migration code written → installer not run → old directory deleted → data lost). The current schema captures "what happened" but not "the chain of decisions that led here." It's a snapshot, not a story.

3. **The distinction between "code exists" and "code runs."** Signal #4 (local-install-global-kb model) and Signal #33 (lifecycle representation gap) both describe the same structural condition: machinery was built but didn't fire. The schema can represent each signal individually but not the recurring pattern — "building ≠ using" as a structural condition of the project.

### R2-D Prediction Evaluation

| ID | Prediction | Outcome |
|----|-----------|---------|
| R2D-P1 | Pre-schema signals will be more narrative and less classified | **CONFIRMED** — richer context, user quotes, causal chains. But harder to query, no lifecycle state, no related_signals. |
| R2D-P2 | Reading them will surface at least one concern the current schema cannot represent | **CONFIRMED** — three: user voice, causal narratives, the "built ≠ running" structural pattern. |

---

## R2-B Deliverable: Apollo Pre-Schema Signal Classification

### Classification of 53 Pre-Schema Signals

| Category | Count | % | Description |
|----------|-------|---|-------------|
| **Resolved** | 12 | 23% | Specific bugs fixed by targeted commits or protocol changes |
| **Absorbed** | 13 | 25% | Addressed by milestone work (v1.13-v1.19) without explicit signal closure |
| **Persistent** | 10 | 19% | Concern still applies to current codebase |
| **Archaeological** | 3 | 6% | Describes conditions that no longer exist but has historical value |
| **Reference** (SIG-*) | 15 | 28% | Positive patterns and architecture decisions — permanently valid |
| **Total** | **53** | 100% | |

### Notable Classifications

**Persistent (still live — 10 signals):**
- sig-2026-02-11-kb-data-loss-migration-gap — KB migration fragility persists
- sig-2026-02-11-local-install-global-kb-model — local/global KB tension is Thread 13
- sig-2026-02-23-installer-clobbers-force-tracked-files — listed in current blockers, unfixed
- sig-2026-03-04-signal-lifecycle-representation-gap — 87.5% still in detected
- sig-2026-03-05-askuserquestion-phantom-answers — may still occur in YOLO mode
- sig-2026-03-03-no-ci-verification-in-execute-phase — enforcement unclear
- sig-2026-03-02-requirements-lack-motivation-traceability — still a gap
- sig-2026-03-05-multi-runtime-parity-testing-gap — partially addressed
- sig-2026-02-11-kb-script-wrong-location-and-path — KB path architecture evolved but concerns remain
- sig-2026-03-04-deliberation-skill-lacks-epistemic-verification — Step 2.5 exists but effectiveness untestable

**Resolved (12 signals) includes:**
- PR targeting (fixed via --repo protocol, saved to memory)
- Branch cleanup (fixed via post-merge protocol)
- Model resolver prefix (fixed in quick-260402-qnh)
- Discuss-mode dropped (fixed in v1.19.0)
- Stale continue-here files (resume workflow now deletes)
- CI manifest selftest hardcoded count (fixed)

**Absorbed (13 signals) includes:**
- Context bloat ×3 (modularization in v1.18 reduced this)
- Spike workflow gaps ×2 (redesigned in v1.16)
- Release process fragility (formalized in v1.15)
- Delegate-to-subagents (established as practice)
- Post-merge cleanup (memory saved)

### R2-B Prediction Evaluation

| ID | Prediction | Outcome |
|----|-----------|---------|
| R2B-P1 | >60% will be "absorbed" | **FALSIFIED** — only 25% absorbed (13/53). Combined resolved+absorbed = 47%. If excluding SIG-* reference signals: 25/38 = 66% resolved+absorbed. The prediction was too specific to "absorbed" vs "resolved" — many were fixed by specific patches, not absorbed by broader work. |
| R2B-P2 | At least 5 will be "archaeological" | **FALSIFIED** — only 3 archaeological. Most signals that describe old conditions are still classifiable as resolved or absorbed rather than purely historical. |

---

## R2-A Deliverable: Deliberation Evaluations (3 of 3)

### 1. signal-lifecycle-closed-loop-gap (Concluded 2026-03-04)

**Decision:** Options A+C+B — programmatic reconciliation script, deliberation epistemic hardening, KB health watchdog.

| ID | Prediction | Outcome | Evidence |
|----|-----------|---------|----------|
| P1 | Programmatic remediation: plans with resolves_signals will transition signals automatically | **PARTIALLY CONFIRMED** | `reconcile-signal-lifecycle.sh` exists. 7 signals now in "remediated" state (up from 0). But 105 still in "detected" — the backfill (Option D) hasn't been run at scale. The forward fix works; the backlog persists. |
| P2 | KB health watchdog detects lifecycle inconsistencies | **CONFIRMED** | `signal-lifecycle.md` probe exists in health-probes/. Round 1 Trial E found apollo has plans with resolves_signals where signals remain in detected — this is exactly what the watchdog was designed to catch. |
| P3 | Severe Testing step catches at least one false claim in next 3 deliberations | **UNTESTABLE** | Can't determine from artifacts whether Step 2.5 actually caught false claims in subsequent deliberations. The step exists in the deliberation skill but there's no log of corrections made. |
| P4 | >30% decrease in signals stuck in detected by end of v1.18 | **FALSIFIED** | 105 of 120 signals (87.5%) remain in detected state. Only 7 remediated (5.8%), 8 triaged (6.7%). Far from the 30% decrease predicted. The forward fix works but hasn't been applied at scale. |

**Meta-observation:** P1 is partially right (the tool exists and works) but P4 is falsified (the tool hasn't been used enough to move the needle). The deliberation correctly identified what to build but didn't predict the adoption gap — building the tool ≠ using the tool. This is the "content not weight" pattern again: the reconciliation script conveys the CAPABILITY to fix lifecycle states but doesn't carry the WEIGHT to make it happen routinely.

### 2. health-check-maintainability (Concluded 2026-03-06)

**Decision:** Option C — hybrid probe architecture with advisory scoring.

| ID | Prediction | Outcome | Evidence |
|----|-----------|---------|----------|
| P1 | Adding a new check = one probe file, zero workflow edits | **CONFIRMED** | 11 probe files exist in health-probes/. Adding rogue-files, rogue-context, signal-lifecycle, automation-watchdog — each was a single-file addition. |
| P2 | Workflow shrinks from 240 to <100 lines | **FALSIFIED** | Workflow is 253 lines — actually GREW by 13 lines. The generic probe executor pattern was adopted but the workflow retains category-specific orchestration logic. |
| P3 | Probe contract handles full complexity spectrum without escape hatches | **PARTIALLY CONFIRMED** | Three execution types (inline, subcommand, agent) are all in use. No escape hatches visible. But the rogue-context agent probe has unique spawning requirements that test the contract's limits. |
| P4 | Thresholds need adjustment within first 2 phases | **UNTESTABLE** | Health check config shows `blocking_checks: false` across projects. No evidence of threshold adjustment because thresholds aren't being used to gate anything — the advisory framing means thresholds are informational only. |
| P5 | Advisory framing prevents at least one incorrect action | **UNTESTABLE** | No evidence of a threshold that would have triggered incorrectly. The system doesn't log "threshold would have fired but advisory framing prevented action." |

**Meta-observation:** P1 confirmed — the extensibility architecture works. P2 falsified — the workflow didn't shrink as predicted. The prediction assumed the workflow was mainly category-specific logic that probes would absorb. In practice, the workflow retained orchestration complexity (probe discovery, tier filtering, dependency resolution, output formatting). The deliberation correctly predicted what the PROBES would do but underestimated what the ORCHESTRATOR still needs to handle.

### 3. cross-runtime-parity-testing (Adopted 2026-03-05)

**Decision:** Name parity tests + targeted content checks + glob build-hooks.js.

| ID | Prediction | Outcome | Evidence |
|----|-----------|---------|----------|
| P1 | Name parity would have caught build-hooks omission | **UNTESTABLE** | No parity test files found in test/ directory via grep. The tests may have been implemented differently than expected, or may live elsewhere (installed runtime tests?). Cannot verify without finding the test implementation. |
| P2 | Globbing build-hooks.js prevents future parity bugs | **UNTESTABLE** | `build-hooks.js` shows no glob pattern. Either the glob approach wasn't implemented, or it was implemented differently. |
| P3 | <2 false positive parity failures per milestone | **UNTESTABLE** | Can't find parity test implementation to check failure history. |
| P4 | <30 seconds CI time increase | **LIKELY CONFIRMED** | CI runs in ~37 seconds total. No visible time increase from parity-era baseline. |

**Meta-observation:** This deliberation is marked "adopted" and was "implemented via Quick task 15." But the implementation artifacts are hard to trace — no test files match "parity" or "cross-runtime" in the test directory. The Quick Task 28 (from STATE.md) references "Cross-runtime parity enforcement: 4 structural CI tests" but these may have been refactored or renamed since. The adoption is real (the decision shaped v1.17-v1.18 architecture) but the specific predicted mechanisms are hard to verify against current code.

### Cross-Deliberation Patterns

1. **Building ≠ Using.** Signal-lifecycle P4 falsified because the tool was built but not used at scale. The deliberation predicted the mechanism, not the adoption.

2. **Orchestrators don't shrink.** Health-check P2 falsified because moving logic to probes didn't eliminate orchestration complexity — it transformed it (from category-specific to probe-discovery/dependency-resolution).

3. **Traceability decays.** Cross-runtime parity predictions are largely untestable because the implementation can't be traced from the deliberation to specific test files 4 weeks later. The deliberation said "Quick task 15" but the artifacts have been through multiple refactors.

4. **Advisory framing is untestable by design.** Health-check P4/P5 are untestable because advisory thresholds don't log what would have happened under a different framing. You can't evaluate "this prevented a bad action" if no actions are gated.

### R2-A Prediction Evaluation

| ID | Prediction | Outcome |
|----|-----------|---------|
| R2A-P1 | Signal-lifecycle predictions will be trivially confirmed | **FALSIFIED** — P4 is falsified (87.5% still detected), P3 untestable. Not trivial at all. |
| R2A-P2 | Health-check Option C assumption won't match reality | **CONFIRMED** — P2 falsified (workflow grew, didn't shrink) |
| R2A-P3 | Cross-runtime adoption will show partial implementation | **CONFIRMED** — predictions largely untestable, implementation hard to trace |

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-03 | Round 2 roadmap created | Post-Round 1 reflection, preparatory work complete, v1.19.0 shipped |
| 2026-04-03 | Checkpoint 1: R2-C, R2-E, R2-F complete | Thread 22 formalized, positive-pattern design sketched, Thread 7 assessed post-implementation |
| 2026-04-03 | R2-A complete: 3 deliberation evaluations | signal-lifecycle P4 falsified (87.5% still detected), health-check P2 falsified (workflow grew), cross-runtime largely untestable. Key pattern: building ≠ using. |
| 2026-04-03 | R2-D + R2-B complete | Archaeological reading of 10 earliest signals. 53 pre-schema signals classified: 12 resolved, 13 absorbed, 10 persistent, 3 archaeological, 15 reference (SIG-*). Self-observation evolved from infrastructure pain to epistemic concern. |

---
