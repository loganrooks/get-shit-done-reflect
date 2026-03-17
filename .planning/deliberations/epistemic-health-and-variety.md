# Deliberation: Epistemic Health Probes, Warrant Typing, and Variety Metrics

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation -> problematization -> hypothesis -> test -> warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open -> concluded -> adopted -> evaluated -> superseded
-->

**Date:** 2026-03-16
**Status:** Open
**Trigger:** Cross-project synthesis between epistemic-agency knowledge base (154 papers, 47 findings) and GSD Reflect usage data (218 sessions, 1,869 messages). The epistemic-agency project produced four concrete prescriptions for GSD Reflect grounded in literature + philosophy + empirical usage patterns. See ~/workspace/projects/epistemic-agency/traces/008-cybernetic-synthesis.md.
**Affects:** Health check probe architecture (Phase 41+), signal schema, deliberation/discuss workflows, future milestone scope (M-C)
**Related:**
- ~/workspace/projects/epistemic-agency/traces/008-cybernetic-synthesis.md (source analysis)
- ~/workspace/projects/epistemic-agency/knowledge-base/INDEX.md (findings F45-F47, interactions I08-I09)
- .planning/deliberations/health-check-maintainability.md (concluded — probe architecture is the extensibility mechanism)
- .planning/deliberations/deliberative-council-and-epistemic-framework.md (open — adversarial deliberation is a lighter version of the council)
- .planning/deliberations/philosophy/cybernetics.md (requisite variety, viable system model, levels of learning)
- .planning/deliberations/philosophy/philosophy-of-technology.md (proletarianization, pharmacology, tertiary retention)
- philosophy: cybernetics/requisite-variety
- philosophy: stiegler/proletarianization
- philosophy: stiegler/pharmacology
- philosophy: cybernetics/autopoietic-categories

## Situation

### The Cross-Project Synthesis

The epistemic-agency project at ~/workspace/projects/epistemic-agency/ maintains a knowledge base built from 154 papers on agentic AI, processed through epistemological lenses (Goldman, Lakatos, Lipton, Peirce/Dewey, Goldman/Longino, Bayesian, van Fraassen). In session 3, a Claude Code usage insights report (218 sessions analyzed) was synthesized with this literature and with a deep examination of GSD Reflect's architecture.

The synthesis produced three new findings and two new interaction effects:

| ID | Finding | Source | Status |
|----|---------|--------|--------|
| F45 | Premature convergence is a cybernetic variety problem, not a behavioral defect to correct through instruction | Usage data (218 sessions, 45 "wrong approach" incidents) + Ashby's Law | QUALIFIED |
| F46 | Signal systems suffer the MAPE blind spot — detect plan-conformance deviations, miss planning failures themselves | MAPE Data Flywheel (2510.27051): 91.5% of production feedback outside monitored categories | RAW |
| F47 | Automation exists on a proletarianization gradient — execution-safe, judgment-dangerous | Stiegler + Usage data patterns | RAW |
| I08 | Tertiary retention x Path dependency = constitutive lock-in (externalized memory pre-selects thinkable futures) | Stiegler + I07 | — |
| I09 | Variety amplification x Hallucination Barrier = human architecturally necessary as independent noise distribution | Ashby + F02 (GVU Operator, 2512.02731) | — |

These produced four concrete prescriptions for GSD Reflect:
1. **Epistemic health probes** — Check epistemic quality, not just infrastructure integrity
2. **Adversarial deliberation** — Mandatory adversarial step after initial convergence in discuss/plan phases
3. **Warrant typing for signals** — OBSERVER/COMPUTATION/GENERATOR classification on signal schema
4. **Requisite variety metrics** — Track explore-to-converge ratio during deliberation phases

### Why This Matters for GSD Reflect

The existing philosophy docs (cybernetics.md, philosophy-of-technology.md) established the theoretical foundations:
- `cybernetics/requisite-variety` predicts that sensor variety must match problem variety
- `stiegler/proletarianization` warns that automating judgment risks the user losing understanding
- `cybernetics/autopoietic-categories` identifies structurally invisible problems

What trace 008 adds is **OBSERVER-class empirical evidence** for these theoretical predictions:
- The 45 premature-convergence incidents are Ashby's law failing in practice (not hypothetically)
- The MAPE paper's 91.5% "other" category is the autopoietic blindness quantified empirically
- The usage data shows the proletarianization gradient in action: structured GSD sessions hit ~90% success while the report simultaneously recommends fully autonomous execution (the proletarianization vector)

The theoretical frameworks predicted exactly what the empirical data shows. The question is what to build.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| Claude Code insights report (218 sessions) | 45 "wrong approach" incidents dominate all friction; premature convergence is #1 category | Yes — OBSERVER data (aggregated session metadata) | informal |
| MAPE Data Flywheel (2510.27051) | 91.5% of negative feedback fell into "other" — outside monitored categories | Yes — published empirical result from production system | informal |
| GVU Operator (2512.02731) | Self-evaluation degenerates when generator and evaluator share noise distributions (Theorem 4.1) | Yes — mathematical proof + limited empirical validation | informal |
| Co-Sight (2510.21557) | Conservative/radical expert pairs + meta-verifier produce super-additive verification (6.2% + 2.4% = 8.6%) | Yes — published benchmark results | informal |
| ENGRAM (2511.12960) | Typed memory (episodic/semantic/procedural) with per-type retrieval; 31-point accuracy collapse without typing | Yes — published ablation study | informal |
| GSD Reflect signal taxonomy | 8 signal types; no epistemic warrant classification on signals | Yes — read signal-detection.md schema | informal |
| GSD Reflect health probes | Probe architecture established (health-check-maintainability.md); probes check infrastructure, not epistemic quality | Yes — read health-check-maintainability.md conclusion (Option C adopted) | informal |
| cybernetics.md praxis recommendations | Blind spot audits, regime tracking, requisite variety expansion all recommended | Yes — read the file | informal |

## Framing

**Core question:** How should GSD Reflect operationalize the epistemic-agency findings — specifically F45 (variety starvation), F46 (MAPE blind spot), F47 (proletarianization gradient), and the Co-Sight/ENGRAM evidence — within its existing architecture (probe system, signal schema, deliberation workflows, automation levels)?

**Adjacent questions:**
- Do epistemic health probes fit within the existing probe architecture (health-check-maintainability.md Option C), or do they require a different mechanism?
- Does warrant typing on signals require a schema migration, and does it affect the existing 125 signals?
- Is adversarial deliberation a lightweight form of the deliberative council (deliberative-council-and-epistemic-framework.md), or a distinct mechanism?
- How does the execution/judgment distinction (F47) map onto the existing 4-level automation system?

## Analysis

### Prescription 1: Epistemic Health Probes

#### Option 1A: New Probes in Existing Architecture

- **Claim:** Add epistemic quality probes to the existing `references/health-probes/` directory, using the probe contract (inline/subcommand/agent execution types) established in health-check-maintainability.md.
- **Grounds:** The probe architecture was specifically designed for extensibility — "adding a check = adding files, zero workflow/scorer edits" (P1 prediction). Epistemic probes are probes about a different dimension (epistemic quality vs. infrastructure integrity) but use the same execution model.
- **Warrant:** The architectural investment in probe extensibility was made precisely for this case — new kinds of checks that weren't foreseen when the architecture was designed. Using it validates the architecture.
- **Rebuttal:** Epistemic probes are qualitatively different from infrastructure probes. "Did the plan consider multiple options?" requires reading CONTEXT.md or discuss output and making a judgment — this is `execution: agent` level complexity, which is heavier than most infrastructure probes. The judgment itself is GENERATOR-sourced (an LLM deciding whether another LLM explored enough variety), which means F01 (semantic laundering) applies to the probe itself.
- **Qualifier:** Probably — the architecture fits, but the epistemic quality of the probes is self-limiting (F01/F02 recursion).

Proposed probes:

| Probe | What it checks | Execution type | Dimension |
|-------|---------------|----------------|-----------|
| `variety-check` | Count distinct approaches in CONTEXT.md or discuss output before convergence | `agent` | workflow |
| `warrant-source` | Do verification criteria in PLAN.md reference OBSERVER sources (tests, CI) or only GENERATOR self-assessment? | `inline` (grep for test/CI references) | workflow |
| `signal-coverage-gap` | What % of recent friction (from user corrections, conversation context) falls outside the signal taxonomy's 8 types? | `agent` | workflow |

#### Option 1B: Separate Epistemic Quality System

- **Claim:** Build epistemic probes as a distinct system, not within the health check infrastructure.
- **Grounds:** Health checks are infrastructure validation — "does the system work?" Epistemic probes ask "is the system thinking well?" These are different questions with different consumers (infrastructure checks gate execution; epistemic checks inform the user's judgment).
- **Warrant:** Mixing structural and epistemic concerns in one traffic-light display conflates "the system is broken" with "the system is reasoning poorly," which are different kinds of problems requiring different responses.
- **Rebuttal:** A separate system adds architectural complexity, another command, another file structure. The probe architecture already has `dimension: infrastructure | workflow` — epistemic quality is a workflow dimension, not a new kind of system.
- **Qualifier:** Presumably not — the existing architecture already has the dimension distinction.

**Leaning: 1A.** The probe architecture was built for this. Add an `epistemic` dimension alongside `infrastructure` and `workflow`, or classify epistemic probes under `workflow` (since they measure the quality of the work process, not the quality of the infrastructure).

### Prescription 2: Adversarial Deliberation

#### Option 2A: Lightweight Adversarial Step in Discuss/Plan Workflows

- **Claim:** After initial convergence in `/gsdr:discuss-phase` or `/gsdr:plan-phase`, spawn a single adversarial subagent mandated to argue against the conclusion. Integrate into existing workflow, not a new system.
- **Grounds:** Co-Sight's empirical evidence (2510.21557) shows conservative/radical pair verification produces super-additive improvements. The usage data shows premature convergence as the #1 friction source. Longino's social epistemology: knowledge is warranted only after surviving critical scrutiny from genuinely different perspectives.
- **Warrant:** The structural fix for premature convergence (F45) is not instruction ("don't converge early" — GENERATOR-on-GENERATOR) but architecture (a step that structurally requires variety before convergence). An adversarial agent provides the independent noise distribution that F02 says is needed.
- **Rebuttal:** The adversarial agent is itself an LLM — does it really provide an independent noise distribution, or is it the same model arguing with itself (F02 recursion)? The pharmacological risk: adversarial steps add latency, and may become ritualistic (the adversarial step always produces pro-forma objections that get overridden, adding cost without value).
- **Qualifier:** Probably — but with pharmacological awareness: if the adversarial step becomes routine rather than genuinely challenging, it has become toxic (ritual compliance without epistemic engagement).

#### Option 2B: Full Deliberative Council (from deliberative-council-and-epistemic-framework.md)

- **Claim:** Implement the multi-agent council with specialized perspectives (engineer, researcher, philosopher) as the adversarial mechanism.
- **Grounds:** The council proposal in deliberative-council-and-epistemic-framework.md provides richer adversarial structure — not just "argue against" but "argue from a different epistemic stance." Co-Sight uses domain-specific experts, not generic contrarians.
- **Warrant:** Longino's point is that productive criticism comes from genuinely different perspectives, not from devil's advocacy. A council with structured roles (engineer: "technically infeasible?", philosopher: "what are we not seeing?", researcher: "what does the literature say?") produces richer variety than a single adversarial agent.
- **Rebuttal:** Massively more complex to build. The deliberative council is M-C scope — a full milestone theme. Implementing it now would delay v1.18's modularization work. The simpler adversarial step gets 80% of the value at 20% of the cost.
- **Qualifier:** Eventually — but not as the first step. The lightweight adversarial step (2A) is the pragmatic starting point.

**Leaning: 2A as immediate implementation, with 2B as the mature form.** The adversarial step is a stepping stone toward the full council — it tests the core hypothesis (does structural adversarialism reduce premature convergence?) without the full council's complexity.

### Prescription 3: Warrant Typing for Signals

#### Option 3A: Add `warrant_source` Field to Signal Schema

- **Claim:** Add a `warrant_source: observer | computation | generator` field to the signal frontmatter schema.
- **Grounds:** ENGRAM's 31-point accuracy collapse without memory typing (2511.12960). Currently all signals are treated as equal inputs to pattern detection — a CI failure (OBSERVER) has the same weight as an agent self-report "struggled with X" (GENERATOR). The epistemic-agency finding F01 (semantic laundering) predicts that mixing warrant levels degrades the system's ability to use any of them well.
- **Warrant:** Typed classification enables differentiated processing: OBSERVER signals drive automated responses, COMPUTATION signals inform analysis, GENERATOR signals surface possibilities but don't drive decisions. This is the architectural response to F01 — instead of pretending all signals have equal warrant, make warrant visible in the data model.
- **Rebuttal:** Adds complexity to the signal schema. Existing 125 signals would need classification (or a migration default). The typing is itself a judgment call — who decides whether a signal is OBSERVER or GENERATOR? If the sensor decides, the sensor's judgment is GENERATOR. This doesn't escape F01 so much as push it one level deeper.
- **Qualifier:** Probably — the ENGRAM evidence is strong, and the typing is not arbitrary (CI failures are unambiguously OBSERVER; agent self-reports are unambiguously GENERATOR). The gray areas exist but are a minority.

#### Option 3B: Warrant as Derived Property, Not Schema Field

- **Claim:** Instead of adding a field, derive warrant from the signal's source and detection method. A signal from the CI sensor with evidence from `gh run view` is OBSERVER by derivation. A signal from the artifact sensor with evidence from plan-vs-summary comparison is COMPUTATION by derivation.
- **Grounds:** The warrant type is not independent of the source — it IS a property of the source. Making it a separate field creates a denormalization that can go stale (a signal's `warrant_source` says OBSERVER but its evidence is actually GENERATOR text).
- **Warrant:** Derivation keeps the single source of truth (the signal's source/evidence chain) rather than adding a parallel classification that can diverge.
- **Rebuttal:** Derivation requires the reflection system to understand which sources confer which warrant — adding logic to the consumer rather than metadata to the producer. This is harder to audit and harder to surface in the index.
- **Qualifier:** Possibly — cleaner data model but harder to operationalize in the reflection pipeline.

**Leaning: 3A with validation.** A `warrant_source` field in the schema is more immediately useful and auditable. Validate it against the source chain during signal synthesis (the synthesizer already deduplicates and filters — adding a warrant-source consistency check is incremental).

### Prescription 4: Requisite Variety Metrics

#### Option 4A: Explore-to-Converge Ratio as a Health Probe

- **Claim:** Track the number of distinct approaches considered before convergence in discuss and plan outputs, and surface it as a health probe.
- **Grounds:** F45 (premature convergence is variety starvation). The usage data shows this as the #1 friction source. Ashby's Law: the controller must have as much variety as the system being controlled. If the discuss phase considers only 1 approach, variety is zero.
- **Warrant:** Making variety visible creates awareness without creating rigidity. The metric is a nudge ("you explored 1 option — consider more?"), not a gate ("you must explore N options before proceeding").
- **Rebuttal:** Counting "distinct approaches" requires judgment — is a slight variant of Option A a new approach or the same one? LLMs are prone to generating superficially distinct options that are structurally identical. The metric may measure surface variety, not genuine epistemic variety.
- **Qualifier:** Presumably — useful as an attention guide (per health-check-maintainability.md's "scores as attention guides, not decision gates" principle) despite measurement imprecision.

#### Option 4B: Post-Hoc Variety Assessment in Signal Collection

- **Claim:** Instead of measuring variety during planning, assess it after execution — did premature convergence lead to problems? If a phase required gap closure or rework, check whether the plan explored alternatives.
- **Grounds:** Post-hoc assessment uses OBSERVER data (did rework actually happen?) rather than GENERATOR assessment (did the plan "really" explore enough options?). This is epistemically stronger per F01.
- **Warrant:** Measuring outcomes (rework required: yes/no) is more reliable than measuring process quality (variety explored: high/low). The artifact sensor already detects plan-vs-summary deviations — this extends that to assess whether deviations correlate with low variety in the planning phase.
- **Rebuttal:** Post-hoc assessment only helps future planning, not current planning. The user might want real-time feedback during a discuss phase, not a retrospective after the damage is done.
- **Qualifier:** Probably as a signal source — but insufficient alone. A probe (4A) provides real-time awareness; a signal (4B) provides retrospective evidence. Both are needed.

**Leaning: Both 4A and 4B.** A health probe provides the real-time nudge. A signal detection rule provides the retrospective evidence. Together they close the loop: the probe prevents low variety; the signal detects when low variety caused problems despite the probe.

## Tensions

### 1. F01 Recursion: Epistemic Probes Are GENERATOR Assessments of GENERATOR Quality

The most fundamental tension: epistemic health probes that check whether "genuine reasoning occurred" are themselves GENERATOR outputs. An LLM judging whether another LLM's reasoning was genuine is F01 (semantic laundering) applied at the meta-level. The probe's assessment has no more epistemic warrant than the reasoning it evaluates.

**Mitigation, not resolution:** Use OBSERVER-grounded probes where possible (warrant-source probe can grep for test references — that's COMPUTATION, not GENERATOR). Where GENERATOR assessment is unavoidable (variety-check), mark the probe's output as advisory, not diagnostic. Per health-check-maintainability.md: "scores as attention guides, not decision gates."

### 2. Pharmacology of the Adversarial Step

The adversarial deliberation step is a pharmakon:
- **Cure:** Forces variety into the deliberation process, preventing the most common failure mode
- **Poison:** May become ritualistic (pro-forma objections that get routinely overridden), adding cost without value. May slow down phases that genuinely don't need adversarial challenge (trivial mechanical changes).

**Mitigation:** Automation-level integration. The adversarial step runs at automation level 1 (nudge: "consider running adversarial check?") for simple phases, level 2 (prompt: runs unless user declines) for complex phases. The user calibrates based on experience. Track whether adversarial objections ever change outcomes — if they never do, the step has become ritual (degenerating programme per Lakatos).

### 3. Schema Migration for Warrant Typing

Adding `warrant_source` to the signal schema affects 125 existing signals. Options:
- **Default migration:** Set all existing signals to `generator` (safe default — assumes lowest warrant unless proven otherwise)
- **Retrospective classification:** Classify existing signals by examining their source sensor and evidence
- **Leave unclassified:** Add the field as optional, only populate for new signals

The retrospective classification is the most informative but most labor-intensive. The safe default is honest (most existing signals are GENERATOR-sourced artifact analysis). Leaning toward safe default with prospective typing for new signals.

### 4. Deweyan Loop Closure Problem

This deliberation is itself part of the Deweyan loop: trace 008 generated prescriptions, this deliberation designs their implementation, the implementation will (eventually) produce outcomes that can be measured against predictions. But the loop has no guaranteed closure mechanism — there's no deadline, no sprint, no forcing function that ensures implementation happens.

**Mitigation:** Link this deliberation's conclusions directly to phase planning. When concluded, the recommendations should map to specific phases in the v1.18+ roadmap (or to a new milestone). The decision record should include phase references.

## Recommendation

**Current leaning:** Implement all four prescriptions incrementally:

1. **Epistemic health probes** (Option 1A) — 2-3 new probe files in the existing architecture. `warrant-source` probe (inline/COMPUTATION) is simplest and most epistemically sound. `variety-check` probe (agent/GENERATOR) is useful but self-limiting. Classify under `workflow` dimension.

2. **Adversarial deliberation** (Option 2A) — Lightweight adversarial step in discuss-phase and plan-phase workflows. Not a new system; a subagent spawn at a specific point in the existing workflow. Automation-level aware (configurable). Stepping stone toward the full deliberative council (2B/M-C).

3. **Warrant typing** (Option 3A) — New `warrant_source` field in signal schema. Safe default migration for existing signals. Validation in synthesizer. Enables differentiated processing in reflection.

4. **Variety metrics** (Both 4A and 4B) — Health probe for real-time awareness during planning. Signal detection rule for retrospective evidence after execution.

**Open questions blocking conclusion:**
1. Should these be part of v1.18 (as additional phases 55-58) or deferred to a subsequent milestone?
2. Does the adversarial step belong in the discuss-phase workflow, the plan-check agent, or both?
3. What is the migration strategy for warrant typing on 125 existing signals — safe default or retrospective classification?

## Predictions

<!--
Predictions make the deliberation falsifiable (Lakatos). If adopted, what should we
observe? If we don't observe it, the deliberation's reasoning was flawed.
Record predictions BEFORE implementation so they can't be retrofitted.
-->

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | The `warrant-source` health probe (grep for OBSERVER references in verification criteria) will find that >50% of current PLAN.md files use only GENERATOR self-assessment for verification — no tests, no CI, no runtime checks | Running the probe on existing .planning/phases/ PLAN.md files | <30% of plans lack OBSERVER verification references (would mean the problem is less severe than F01 predicts) |
| P2 | Adding `warrant_source` to the signal schema will change how the reflector weights signals — OBSERVER signals will produce higher-confidence pattern matches than GENERATOR signals, improving lesson quality | Next reflection run after implementation | Reflector produces identical patterns regardless of warrant typing (would mean the typing distinction doesn't matter for pattern detection) |
| P3 | The adversarial deliberation step will surface at least one substantive objection that changes the plan outcome in its first 5 invocations | After 5 discuss-phase or plan-phase runs with adversarial step | All 5 adversarial runs produce pro-forma objections that are overridden without plan changes (would confirm the pharmacological risk: the step is ritual, not substantive) |
| P4 | The variety-check probe will show that phases requiring gap closure or rework had lower variety scores in their planning phase than phases that executed cleanly | Retrospective analysis after 10+ phases with variety scoring | No correlation between variety score and rework requirement (would mean premature convergence isn't actually the cause of rework) |
| P5 | The explore-to-converge ratio will initially be very low (1-2 options per plan), increase after the probe is visible, and stabilize at 3-5 options for complex phases | After 15+ phases with variety tracking | Ratio stays at 1-2 despite visibility, or increases but doesn't correlate with outcome quality |

## Decision Record

<!--
Filled when status moves to `concluded` or `adopted`.
Links the deliberation to the intervention that implements it.
-->

**Decision:** PENDING
**Decided:** —
**Implemented via:** —
**Signals addressed:** —

## Evaluation

<!--
Filled when status moves to `evaluated`.
Compare predictions against actual outcomes. Explain deviations.
This section is what makes deliberation a learning mechanism, not just a decision log.
-->

**Evaluated:** —

## Supersession

<!-- Filled when status moves to `superseded`. -->
