# Spike Methodology Gap Analysis

**Date:** 2026-04-08
**Purpose:** Inform v1.20 milestone scoping with evidence-based assessment of spike workflow gaps
**Scope:** All projects using GSD Reflect spikes (arxiv-sanity-mcp primary; vigil and blackhole-animation checked but contain no spike artifacts)
**Method:** Direct examination of spike DESIGN.md, FINDINGS.md, DECISION.md, knowledge base signals, cross-spike qualification reports, deliberations, and workflow audit artifacts

---

## 1. Projects Examined

| Project | Spikes | Artifacts Examined |
|---------|--------|-------------------|
| arxiv-sanity-mcp | 001-008 (4 complete, 4 drafted) | 4 DESIGN.md, 3 DECISION.md, 3 FINDINGS.md, 8 signals, 1 cross-spike qualification report, 2 methodology docs, 1 design review spec, 1 workflow audit, 4 deliberations |
| vigil | 0 | No `.planning/` directory exists |
| blackhole-animation | 0 | No `.planning/` directory exists |
| get-shit-done-reflect | n/a (framework itself) | run-spike.md, gsd-spike-runner.md, spike-execution.md, spike-integration.md, 1 signal |

arxiv-sanity-mcp is the only project with spike usage. Its 4 completed spikes (001-004) represent the entire empirical corpus for evaluating the spike workflow. This is a narrow evidence base, but the depth of self-criticism within those spikes is extraordinary -- the project produced its own methodology documents, design review spec, and cross-spike qualification report, all identifying framework gaps from within.

---

## 2. Concrete Gaps Found

### 2.1 No Design Review Gate

**Evidence:**
- `sig-2026-03-30-spike-design-lacks-independent-critique-gate` (global KB): "The spike-runner workflow has no independent design review step. The same agent that writes DESIGN.md proceeds to execute it."
- `gsdr_spike_workflow_audit.md` Section 4: "GSD Reflect has a rigorous gate-keeping architecture for implementation work: `PLAN.md --> [plan-checker: 11 dimensions] --> EXECUTION --> [verifier: 3-level check]`. But for experimental work (spikes), the architecture is: `DESIGN.md --> [user review in interactive / auto-approve in YOLO] --> EXECUTION --> [nothing]`"
- Spike 004 Codex review caught 4 blockers and 2 major issues in the design. This was ad-hoc, not part of the workflow. The arxiv-sanity-mcp project created its own `SPIKE-DESIGN-REVIEW-SPEC.md` as a workaround.

**What the current workflow does:** run-spike.md Step 5 presents DESIGN.md to the user in interactive mode with options to approve, edit, or cancel. In YOLO mode, DESIGN.md is auto-approved.

**What it does NOT do:** No agent evaluates whether the experimental design is methodologically sound. The user review checks intent ("is this the question I want answered?"), not methodology ("will this experiment actually answer the question?").

### 2.2 Metrics Not Challenged Before Use

**Evidence:**
- `sig-2026-03-20-jaccard-screening-methodology`: Jaccard was used as the sole decision criterion for rejecting Voyage AI embeddings. Six specific limitations documented: binary threshold artifact, all disagreements treated equally, nature of divergence invisible, narrow sample, invalid baseline calibration, overlap not equal to redundancy.
- Cross-spike qualification report Part 3.1: "Jaccard was used across all three spikes as if it provided quality information, but it only provides overlap information."
- `gsdr_spike_workflow_audit.md` Gap 3: "No requirement to document what each metric measures, what it cannot measure, or its known failure modes."

**What the current workflow does:** spike-execution.md Section 2 defines success criteria patterns per spike type. The DECISION.md template has a "Data: {measurements, observations}" field.

**What it does NOT do:** No requirement to document metric limitations before use. No requirement to use multiple complementary metrics. No vocabulary for distinguishing what a metric detects from what it evaluates.

### 2.3 Sample Representativeness Not Validated

**Evidence:**
- `sig-2026-03-20-spike-experimental-design-rigor` Section 1: "The Voyage embedding screening used a 100-paper pool with 20% selectivity (top-20 from 100). At this pool size, models are forced to agree -- there aren't enough alternatives for meaningful divergence. The real-world selectivity would be 0.1% (top-20 from 19K)."
- Spike 001 B2 enriched only 460 of 19,252 papers. Claims about signal importance were based on this 2.4% sample without stating representativeness assumptions.
- Spike 003 bibliographic coupling: discrimination measured on 95 papers (0.5% of corpus) with inflated effect size from selection.

**What the current workflow does:** Nothing. No sample design section in any template. No guidance on when a sample is too small.

### 2.4 DECISION.md Pressures Closure

**Evidence:**
- `sig-2026-03-20-premature-spike-decisions`: "The DECISION.md template has a 'Decision' section that structurally pressures closure. There is no concept of a partially-decided spike or a spike that defers its decision to a follow-up spike."
- Spike 003 DECISION.md: Made concrete architecture decisions (drop SPECTER2, two views not three, MiniLM as primary) while Section 8 "systematically undermines the evidence base for those decisions."
- spike-execution.md Section 6: "DECISION.md is the primary output of every spike. It must contain a decision, not just a report." Mandatory fields include "Chosen approach" and "Answer."

**What the current workflow does:** spike-execution.md Section 5 allows "inconclusive" as a status. Section 6 says "No clear winner, using default" is valid.

**What it does NOT do:** No concept of partial decisions (some findings decisive, others deferred). No concept of decision readiness criteria. No "deferred" as a first-class outcome category distinct from "inconclusive." The template structurally requires a "Chosen approach" even when evidence does not support one.

### 2.5 No Cross-Spike Dependency Propagation

**Evidence:**
- Spike 001 DECISION.md: "SPECTER2 captures discovery potential." Spike 003 W5.4: "SPECTER2 is qualitatively redundant with MiniLM." The correction propagated only because the same project happened to run Spike 003. No mechanism in the framework ensures that when Spike N invalidates Spike M's claims, Spike M's artifacts get updated.
- Cross-spike qualification report: 2 claims retracted, 7 claims qualified across Spikes 001-002 by Spike 003 findings. This report was created ad-hoc by the project, not by the framework.
- Spike 001 used SPECTER2 without the proximity adapter across ALL experiments. This was only discovered in Spike 003 W0.1. No mechanism flagged the dependency or propagated the fix.

**What the current workflow does:** spike-execution.md Section 9 defines `depends_on` syntax. The orchestrator enforces sequential execution for dependent spikes.

**What it does NOT do:** Dependencies are forward-only (Spike N depends on Spike M). No backward propagation: when Spike N's findings qualify or invalidate Spike M's claims, no mechanism updates Spike M's DECISION.md, KB entry, or downstream consumers. The `depends_on` field is about execution order, not epistemic validity chains.

### 2.6 No Structured Limitations Section

**Evidence:**
- `gsdr_spike_workflow_audit.md` Gap 5: "No requirement to distinguish measurement validity from interpretation validity from extrapolation validity when reporting confidence levels."
- Spike 003 DECISION.md Section 8 contains extensive epistemic qualifications. This was the spike author's addition, not a template requirement.
- spike-execution.md Section 6 confidence definitions: "HIGH: Strong empirical evidence, clear winner, reproducible results." This conflates three distinct epistemic claims into one label.

**What the current workflow does:** Three confidence levels (HIGH/MEDIUM/LOW) defined as a single undifferentiated dimension.

**What it does NOT do:** No three-level confidence framework (measurement / interpretation / extrapolation). No required limitations section in DECISION.md template. No requirement to state conditions under which findings hold vs conditions where extrapolation is uncertain.

### 2.7 No Spike Program / Campaign Concept

**Evidence:**
- `sig-2026-03-19-spike-framework-scope-gap`: "The spike execution framework assumes contained experiments: one question, max 2 rounds, single agent spawn. Spike 003 requires 5 waves across 7+ sessions with branch points that change subsequent wave design."
- arxiv-sanity-mcp created its own spike ROADMAP.md, METHODOLOGY.md, SPIKE-DESIGN-PRINCIPLES.md (26 principles), SPIKE-DESIGN-REVIEW-SPEC.md, and cross-spike qualification reports. None of these are supported by the framework.
- Spikes 001-004 share a corpus (19K papers), embeddings (multiple models), enrichment data (OpenAlex), interest profiles, and evaluation infrastructure. The framework has no concept of shared data assets across spikes.

**What the current workflow does:** Individual spike workspaces with sequential numbering. `depends_on` for ordering.

**What it does NOT do:** No shared infrastructure across spikes. No spike roadmap template. No cross-spike qualification mechanism. No concept of progressive refinement where each spike's methodology improves based on lessons from prior spikes.

### 2.8 Qualitative Review Not Required or Enforced

**Evidence:**
- `sig-2026-03-20-spike-experimental-design-rigor` Section 3: "Prescribed qualitative checkpoints skipped. The DESIGN.md specified four qualitative review checkpoints (W1, W3, W4.1, W5.4). Only W1 was executed in the initial session."
- `gsdr_spike_workflow_audit.md` Gap 1: "No mention of qualitative review anywhere in the spike workflow documentation. The entire framework assumes quantitative success criteria with measurable thresholds."
- Spike 003's most important methodological finding: "three of four prescribed qualitative review checkpoints were initially skipped. When performed, they contradicted quantitative conclusions in multiple cases."

**What the current workflow does:** spike-execution.md defines success criteria as "measurable thresholds." The spike runner's checkpoint triggers are deviation-based (unexpected results), not protocol-adherence-based.

**What it does NOT do:** No concept of qualitative review as a mandatory gate. No enforcement that prescribed checkpoints in DESIGN.md are actually performed before synthesis. No protocol-adherence checkpoint between experiment waves.

### 2.9 No Post-Execution Findings Review

**Evidence:**
- `gsdr_spike_workflow_audit.md` Section 4: The plan-checker verifies plans before execution and the verifier validates after execution. No equivalent exists for spikes.
- `sig-2026-03-20-premature-spike-decisions`: "No equivalent exists to verify that a spike's evidence actually supports its stated decisions before the DECISION.md is finalized."
- `sig-2026-03-18-premature-spike002-closure`: Spike 002 was declared complete with 5 methodological gaps from its own DESIGN.md unaddressed.

**What the current workflow does:** The spike runner produces DECISION.md and persists to KB. The orchestrator updates RESEARCH.md.

**What it does NOT do:** No agent verifies that conclusions follow from evidence. No check that prescribed methodology was followed. No verification that DESIGN.md checklist items were completed before declaring the spike complete.

### 2.10 Extension Experiments Bypass Design Rigor

**Evidence:**
- `sig-2026-03-20-spike-experimental-design-rigor` Section 4: "Extension experiments (gap-fills) were designed ad-hoc without the rigor of the core DESIGN.md."
- Spike 001 grew from 3 phases (A, B, C) to 3 rounds with experiments C1-R1 through C1-R16. Each extension was added inline during execution without design review.
- SPIKE-DESIGN-PRINCIPLES.md Principle 17: "Extensions get the same design rigor as core experiments."

**What the current workflow does:** The max-2-rounds rule (spike-execution.md Section 5) limits iteration. Exploratory spikes "can refine during spike as understanding grows."

**What it does NOT do:** No mechanism ensures that when scope expands during execution, the new experiments receive the same design scrutiny as the original ones.

### 2.11 Missing KB Templates

**Evidence:**
- `sig-2026-03-19-spike-framework-scope-gap`: "The spike runner agent references `@kb-templates/spike-design.md` and `spike-decision.md` -- these files do not exist."
- The templates exist at `agents/kb-templates/spike-design.md` and `agents/kb-templates/spike-decision.md` as files, but the spike runner references them as `@~/.claude/agents/kb-templates/spike-design.md` and `spike-decision.md` in its references section. This is a path reference, not a content issue -- the templates exist but the runner may be looking for them in the wrong location depending on install state.

---

## 3. Patterns of Spike Failure (Methodological, Not Execution)

### Pattern 1: Premature Closure Under Completion Pressure

**Occurrences:** 3 (Spike 001 "SQLite is sufficient," Spike 002 declared complete with 5 gaps, Spike 003 DECISION.md making decisions its qualifications retract)

**Mechanism:** After substantial experimental work, there is pressure to produce a concrete decision. The DECISION.md template reinforces this with mandatory "Chosen approach" and "Answer" fields. The result is overclaiming-then-overqualifying: a Decision section that states X, followed by a Qualifications section that effectively retracts X. A naive reader takes the Decision; a careful reader sees the contradiction.

**Root cause:** The framework treats "inconclusive" as a failure mode (max 2 rounds, then force a decision) rather than as information. The template structurally pressures closure even when the evidence does not warrant it.

### Pattern 2: Metric Reification

**Occurrences:** 4 (Jaccard as sole criterion for Voyage, Jaccard for FTS5-vs-tsvector quality claim, MRR as quality measure when evaluation framework is circular, coverage against near-zero citation proxy)

**Mechanism:** A metric is selected, computed, and treated as answering a question it cannot answer. Jaccard measures overlap but is treated as measuring redundancy. MRR measures ranking agreement but is treated as measuring quality. The metric becomes the reality rather than a partial detector of reality.

**Root cause:** No requirement to document what each metric measures vs what it cannot measure before use. No requirement for multiple complementary metrics. The DESIGN.md template has "Success Criteria" but no "Metric Limitations" section.

### Pattern 3: Evaluation Framework Entanglement

**Occurrences:** 3+ (MiniLM clusters evaluating MiniLM, category co-membership favoring metadata strategies, near-zero citation proxy invalidating all coverage measurements)

**Mechanism:** The evaluation framework is built using one of the approaches being evaluated. This creates circular advantage: the approach that shaped the evaluation framework looks better by construction. The circularity is sometimes noted in the DESIGN.md but not mitigated in execution.

**Root cause:** No requirement to identify evaluation framework dependencies before execution. No requirement for at least one framework-independent evaluation. The spike workflow has no "circular evaluation" anti-pattern in Section 10.

### Pattern 4: Self-Awareness Without Enforcement (Pattern A)

**Occurrences:** 4+ (Spike 003 identified MiniLM entanglement but hub-and-spoke comparison remained, Spike 004 noted Jaccard limitations but synthesis led with Jaccard, DESIGN.md prescribed 4 qualitative checkpoints but 3 were skipped, Spike 004 PROTOCOL.md added TF-IDF but synthesis never answered the TF-IDF comparison question)

**Mechanism:** The spike author identifies a methodological concern in DESIGN.md. This concern is not operationalized as a mandatory step. During execution, the concern is forgotten or deprioritized. The DESIGN.md looks epistemically rigorous; the execution does not match.

**Root cause:** Policy documents without enforcement. The spike runner has no mechanism to verify that DESIGN.md-prescribed methodology was actually followed. Checkpoint triggers are deviation-based (unexpected results), not adherence-based (did you do what you said you'd do?).

### Pattern 5: Forward Dependency Without Backward Propagation

**Occurrences:** 3 (SPECTER2 adapter misconfiguration propagating from Spike 001 through all SPECTER2 comparisons, Spike 001 bibliographic coupling ranked as top-5 signal without enrichment coverage caveat, Spike 002 H1 "falsified" framing carried into deliberation despite Spike 003 Jaccard critique)

**Mechanism:** Spike N makes a finding. Spike N+1 or N+2 discovers the finding was based on flawed methodology, a misconfigured model, or an insufficient sample. The original finding persists in its artifacts, KB entry, and downstream documents. Correction requires manual effort that may not happen.

**Root cause:** No backward propagation mechanism. `depends_on` is about execution order, not epistemic validity. No concept of "this finding has been qualified/retracted by later work." The cross-spike qualification report in arxiv-sanity-mcp was a heroic manual effort, not a framework feature.

---

## 4. What the Current Workflow DOES Address vs DOES NOT

### Addressed

| Concern | Where | How |
|---------|-------|-----|
| Premature spiking (questions research could answer) | run-spike.md Step 2 | Research-first advisory with 4 options |
| Spike type selection | spike-execution.md Section 2 | 4 types with success criteria patterns |
| Workspace isolation | spike-execution.md Section 4, runner constraints | All code in spike workspace, no main project modification |
| Iteration limits | spike-execution.md Section 5 | Max 2 rounds with narrowing protocol |
| Decision documentation | spike-execution.md Section 6 | Mandatory DECISION.md fields |
| KB persistence | spike-execution.md Section 8, runner Step 6 | Structured KB entry with template |
| Forward dependencies | spike-execution.md Section 9 | `depends_on` with sequential enforcement |
| Anti-patterns | spike-execution.md Section 10 | 6 named anti-patterns |
| Checkpoint on deviation | runner checkpoint_triggers | 4 trigger categories |
| Research-mode spikes | run-spike.md Step 5b | Lightweight path skipping BUILD/RUN |
| Sensitivity settings | spike-execution.md Section 7 | Conservative/balanced/aggressive triggering |

### NOT Addressed

| Concern | Impact | Evidence |
|---------|--------|----------|
| Design review before execution | Flawed designs execute undetected | Gaps 2.1, Pattern 4 |
| Metric selection and limitation | Metrics reified as reality | Gaps 2.2, Pattern 2 |
| Sample representativeness | Conclusions from unrepresentative samples | Gap 2.3 |
| Structured limitations | Overconfident findings | Gap 2.6 |
| Decision deferral | Premature closure | Gap 2.4, Pattern 1 |
| Cross-spike propagation | Stale/invalidated findings persist | Gap 2.5, Pattern 5 |
| Spike programs/campaigns | Multi-spike investigations unsupported | Gap 2.7 |
| Qualitative review requirement | Quantitative conclusions unchecked | Gap 2.8 |
| Post-execution findings review | DECISION.md unverified | Gap 2.9 |
| Extension experiment rigor | Ad-hoc additions bypass design | Gap 2.10 |
| Evaluation framework independence | Circular evaluation undetected | Pattern 3 |
| Protocol adherence enforcement | DESIGN.md bypassed during execution | Pattern 4 |
| Three-level confidence | Conflated epistemic dimensions | Gap 2.6 |

---

## 5. Proactive Risks

These have not caused failures yet but are structurally enabled by the current workflow.

### 5.1 YOLO Mode + No Design Review = Silent Methodology Failures

In YOLO mode, DESIGN.md is auto-approved (run-spike.md Step 5). If a design review agent is never added, YOLO-mode spikes will execute flawed designs without any check. Every gap listed in Section 2 is amplified in YOLO mode.

### 5.2 KB Entries Without Qualification Decay

Spike KB entries (`spk-{date}-{slug}`) have `status: active` and `outcome: confirmed|rejected|partial|inconclusive`. There is no `qualified-by` or `superseded-by` field. A KB entry from an early spike may be consulted by a future project without awareness that later spikes qualified or retracted its claims. As the knowledge base grows, the ratio of unqualified-but-stale entries to current-and-reliable entries will increase.

### 5.3 Spike Workflow Used for Non-Spike Questions

The "research" mode (run-spike.md Step 5b) creates DESIGN.md and DECISION.md for questions answered through documentation research, not experimentation. This is useful but creates artifacts that look like empirical spike results. A future reader may not distinguish a research-mode spike from a full-mode spike. The `mode: research` flag in DESIGN.md frontmatter is the only signal, and it's in metadata, not in the document body.

### 5.4 Cross-Project Spike Reuse Without Methodology Context

The KB persists spike results to `~/.gsd/knowledge/spikes/{project}/`. A spike from Project A may be consulted when planning Project B. If Project A's spikes used a sophisticated methodology (as arxiv-sanity-mcp did), but the KB entry is a summary, the methodology context is lost. Project B receives the conclusion without the qualifications.

### 5.5 Confirmatory-to-Exploratory Transition Not Supported

`sig-2026-03-20-premature-spike-decisions`: "Experiments conducted in a confirmatory or profiling mode may uncover results that challenge prior assumptions. The workflow should accommodate pivoting to further exploratory work when this happens." The current workflow has no mechanism for a spike that starts as confirmatory (testing predictions) and discovers it needs to become exploratory (following anomalies). The 2-round limit discourages this transition.

---

## 6. Assessment of Proposed Improvements

### 6.1 Reference Design Survey

**Proposed:** Before spike execution, survey how reference systems solve the same problem.

**Would it help?** Partially. Spike 002 included a reference design comparison (Dimension 7) in its DESIGN.md but skipped it in Round 1 (`sig-2026-03-18-premature-spike002-closure`). When it was performed in Round 2, it provided critical context: "All our operations are 20-100x faster than external APIs users actually use." This reframed every latency comparison. Reference designs are valuable but only if enforced.

**Verdict:** Useful as a DESIGN.md requirement for comparative spikes. Must be enforced, not advisory. The arxiv-sanity-mcp experience shows it will be skipped under completion pressure unless it is a blocking gate.

### 6.2 Falsification Challenge

**Proposed:** Require each spike to state what would falsify its hypothesis and to test the null hypothesis.

**Would it help?** Yes, but with caveats. Spike 002 pre-registered falsification criteria for each dimension ("Average Jaccard below 0.5 means backends retrieve materially different papers") -- and this worked well. Spike 004 pre-registered predictions with falsification criteria. The problem was not absence of falsification criteria but absence of mechanisms to prevent overclaiming when the criterion was met. The Jaccard was below 0.5, so H1 was "FALSIFIED" -- but this binary verdict threw away nuance.

**Verdict:** Falsification criteria are valuable. The improvement should be paired with Bayesian updating (probability shifts, not binary verdicts) as recommended in SPIKE-DESIGN-PRINCIPLES.md Principle 13 and METHODOLOGY.md Lens 1.

### 6.3 Epistemic Qualification

**Proposed:** Require structured limitations sections with three-level confidence (measurement / interpretation / extrapolation).

**Would it help?** Yes. This is the single most well-evidenced improvement. The three-level confidence framework was independently derived in three places:
1. `sig-2026-03-20-spike-experimental-design-rigor` Section 5
2. `gsdr_spike_workflow_audit.md` Recommendation 5.3
3. SPIKE-DESIGN-PRINCIPLES.md Principle 14

The current single-dimension confidence (HIGH/MEDIUM/LOW) conflates "the numbers are accurate" with "the numbers mean what we say" with "the findings generalize." Spike 003 had HIGH measurement confidence but LOW interpretation confidence for several findings, and the framework had no vocabulary to express this.

**Verdict:** Implement. This is the most straightforward improvement with the clearest evidence base.

### 6.4 Cross-Spike Propagation

**Proposed:** When Spike N qualifies Spike M's findings, propagate the qualification to Spike M's artifacts.

**Would it help?** Yes. The cross-spike qualification report in arxiv-sanity-mcp documents 2 retracted claims and 7 qualified claims across Spikes 001-002. This report was created manually. Without it, downstream consumers of those spikes would encounter unqualified findings.

**Implementation risk:** The propagation mechanism must be lightweight. If qualifying an earlier spike requires rewriting its DECISION.md, it won't happen. A qualification note appended to the earlier spike's artifacts (as the cross-spike report recommends) is more realistic than rewriting.

**Verdict:** Implement as qualification notes, not as rewrites. Add a `qualified-by` field to KB entries. The spike runner should check whether the current spike's findings qualify any prior spike's KB entries and prompt for qualification notes if so.

### 6.5 Reusable Infrastructure

**Proposed:** Support shared data assets, evaluation harnesses, and methodology across spike programs.

**Would it help?** For projects that need multi-spike investigations, yes. arxiv-sanity-mcp built substantial shared infrastructure: a 19K-paper corpus, embeddings for 6 models, 8 interest profiles, an evaluation harness with LOO-MRR and qualitative review protocols, and methodology documents. None of this was supported by the framework.

**Implementation risk:** Most GSD projects will never need multi-spike programs. The overhead of a "spike program" concept must not burden simple single-spike usage.

**Verdict:** Implement as optional scaffolding. A spike program is a directory with a ROADMAP.md, shared data assets, and cross-spike qualification tracking. The framework should recognize it when it exists but not require it. The 2-round limit should not apply to spike programs (individual spikes within the program can have 2 rounds, but the program itself can have unlimited spikes).

---

## 7. Additional Improvements the Evidence Suggests

### 7.1 Spike Design Reviewer Agent

**Evidence strength:** Very high. Independently recommended in:
- `gsdr_spike_workflow_audit.md` Section 5.1 (9 verification dimensions specified)
- `sig-2026-03-30-spike-design-lacks-independent-critique-gate` (with evidence from Pattern A)
- SPIKE-DESIGN-PRINCIPLES.md Principle 4
- SPIKE-DESIGN-REVIEW-SPEC.md (full review spec already written by the project)

The plan-checker analogy is precise: the same reasoning that justified `gsdr-plan-checker` (plan completeness does not equal goal achievement) applies to spike design (experimental design completeness does not equal methodological soundness).

**Recommended dimensions** (from the audit):
1. Sample representativeness
2. Metric coverage and limitation documentation
3. Evaluation independence / circular evaluation risk
4. Qualitative review planning
5. Epistemic hazard inventory
6. Assumption tracking with falsification criteria
7. Bias mitigation
8. Baseline calibration
9. Confidence decomposition (measurement / interpretation / extrapolation)

### 7.2 Spike Findings Reviewer Agent

**Evidence strength:** High. Recommended in `gsdr_spike_workflow_audit.md` Section 5.6. Analogous to `gsdr-verifier`.

Should verify:
- Conclusions follow from evidence
- Prescribed methodology was followed (protocol adherence)
- Confidence levels justified by data
- Metric limitations acknowledged in interpretation
- DESIGN.md checklist items completed

### 7.3 Protocol Adherence Checkpoints

**Evidence strength:** High. The specific failure where Spike 003's DESIGN.md prescribed 4 qualitative reviews and 3 were skipped demonstrates that design rigor without enforcement produces wrong conclusions.

The spike runner's checkpoint triggers are deviation-based (unexpected results). Add adherence-based triggers: after each experiment wave, verify that prescribed checkpoints were performed before allowing synthesis to proceed.

### 7.4 Decision Readiness Assessment

**Evidence strength:** Moderate-to-high. `sig-2026-03-20-premature-spike-decisions` identifies the need for "decision readiness criteria (what evidence would be sufficient to decide?)."

Before DECISION.md is finalized, the spike should explicitly assess: for each decision being stated, is the evidence sufficient? If not, the decision should be marked as "provisional" or "deferred" rather than being forced into the template.

This pairs with a revision to the DECISION.md template to support three outcome types:
- **Decided:** Evidence supports a clear answer
- **Provisional:** Pragmatic default chosen, evidence incomplete, subject to revision
- **Deferred:** Evidence insufficient, follow-up spike needed, question reframed

### 7.5 Metric Limitation Documentation Template

**Evidence strength:** High. Recommended in `gsdr_spike_workflow_audit.md` Section 5.5. Required for each metric used in a spike:

| Field | Content |
|-------|---------|
| What it measures | The phenomenon the metric detects |
| What it cannot measure | Aspects of the question the metric does not address |
| Known failure modes | Conditions under which the metric misleads |
| When it misleads | Scenarios where the metric gives correct numbers but wrong conclusions |

### 7.6 Sample Design Section in DESIGN.md

**Evidence strength:** High. Recommended in `gsdr_spike_workflow_audit.md` Section 5.4. Required for any experiment involving sampling:

| Parameter | Content |
|-----------|---------|
| Population size | Full dataset |
| Sample size | With justification |
| Selectivity at sample vs deployment scale | With ratio |
| Representativeness argument | How sample represents population |

### 7.7 Bayesian Updating Instead of Binary Verdicts

**Evidence strength:** Moderate. Recommended in METHODOLOGY.md Lens 1, SPIKE-DESIGN-PRINCIPLES.md Principle 13. Evidence: Spike 002 stated "H1 FALSIFIED" based on Jaccard < 0.5, then the DECISION.md qualified this to "backends disagree, not one is better." The binary verdict was misleading; a probability update ("credence that backends return similar results dropped from 0.7 to 0.3; evidence: Jaccard 0.39 with ranking-function-driven divergence") would have been more informative.

**Implementation risk:** This requires a mindset shift from binary to probabilistic reporting. It may be too heavy for simple binary spikes where the answer genuinely is yes or no.

**Verdict:** Recommend for comparative and exploratory spikes. Binary spikes can retain their binary verdicts.

### 7.8 Circular Evaluation Anti-Pattern

**Evidence strength:** High. `gsdr_spike_workflow_audit.md` Section 5.7 recommends adding to spike-execution.md Section 10:

> **Circular Evaluation.** Symptom: Evaluation framework uses the same model/method/representation as the strategy being evaluated. Fix: Require evaluation on at least one framework independent of the strategy being tested.

---

## 8. Summary: Gap Severity and Improvement Priority

### Priority 1 (High impact, well-evidenced, addresses multiple patterns)

| Improvement | Patterns Addressed | Evidence Strength |
|-------------|-------------------|-------------------|
| Spike design reviewer agent | 2, 3, 4 | Very high (4 independent sources) |
| Three-level confidence framework | 1, 2 | Very high (3 independent derivations) |
| DECISION.md template revision (decided/provisional/deferred) | 1 | High (2 signals, 1 audit) |
| Cross-spike qualification mechanism | 5 | High (1 full cross-spike report as evidence) |

### Priority 2 (Clear value, moderate implementation)

| Improvement | Patterns Addressed | Evidence Strength |
|-------------|-------------------|-------------------|
| Spike findings reviewer agent | 1, 4 | High (1 audit, 1 signal) |
| Protocol adherence checkpoints | 4 | High (Spike 003 qualitative review skipping) |
| Metric limitation documentation | 2 | High (Jaccard across 3 spikes) |
| Sample design section | 2, 3 | High (Voyage screening) |
| Circular evaluation anti-pattern | 3 | High (MiniLM entanglement) |

### Priority 3 (Valuable for advanced usage, optional scaffolding)

| Improvement | Patterns Addressed | Evidence Strength |
|-------------|-------------------|-------------------|
| Spike program concept | All (at scale) | Moderate (1 project's experience) |
| Bayesian updating for verdicts | 1, 2 | Moderate (theoretical + 1 instance) |
| Reference design survey requirement | 2 | Moderate (1 instance of value, 1 of skipping) |
| Confirmatory-to-exploratory transition | 1 | Moderate (1 signal) |

---

## 9. Key Files Referenced

### GSD Reflect (current framework)
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/workflows/run-spike.md`
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/spike-execution.md`
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/spike-integration.md`
- `/home/rookslog/workspace/projects/get-shit-done-reflect/agents/gsd-spike-runner.md`

### arxiv-sanity-mcp (spike evidence)
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/001-volume-filtering-scoring-landscape/DESIGN.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/001-volume-filtering-scoring-landscape/DECISION.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/002-backend-comparison/DESIGN.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/002-backend-comparison/DECISION.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/003-strategy-profiling/DESIGN.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/003-strategy-profiling/DECISION.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/004-embedding-model-evaluation/DESIGN.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/004-embedding-model-evaluation/DECISION.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/004-embedding-model-evaluation/PROTOCOL.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/004-embedding-model-evaluation/OPEN-QUESTIONS.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/SPIKE-DESIGN-PRINCIPLES.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/METHODOLOGY.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/SPIKE-DESIGN-REVIEW-SPEC.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/ROADMAP.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/003-strategy-profiling/experiments/reviews/cross_spike_qualifications.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/spikes/003-strategy-profiling/experiments/reviews/gsdr_spike_workflow_audit.md`

### Knowledge base signals
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/knowledge/signals/arxiv-mcp/sig-2026-03-19-spike-framework-scope-gap.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/knowledge/signals/arxiv-mcp/sig-2026-03-20-jaccard-screening-methodology.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/knowledge/signals/arxiv-mcp/sig-2026-03-20-premature-spike-decisions.md`
- `/home/rookslog/workspace/projects/arxiv-sanity-mcp/.planning/knowledge/signals/arxiv-mcp/sig-2026-03-20-spike-experimental-design-rigor.md`
- `/home/rookslog/.gsd/knowledge/signals/arxiv-sanity-mcp/2026-03-18-premature-spike002-closure.md`
- `/home/rookslog/.gsd/knowledge/signals/get-shit-done-reflect/sig-2026-03-30-spike-design-lacks-independent-critique-gate.md`
