# Retrospective Analysis: Applying the 3-Axis Taxonomy to the Audit Corpus

**Date:** 2026-04-10
**Status:** Complete
**Commissioned by:** `audit-taxonomy-three-axis-obligations.md` (Step: Next Step — Retrospective Analysis)
**Agent:** claude-sonnet-4-6
**Sessions analyzed:** 13 distinct audit sessions + VERIFICATION.md pattern + MILESTONE-AUDIT.md pattern

---

## 1. Executive Summary

The 3-axis model fits most of the audit corpus well, but the stress cases are instructive. The framework's strongest performance is on sessions that were either clearly standard (fork audit, requirements review) or explicitly investigatory/exploratory (session-log audit, discuss-phase exploration quality). Its weakest performance is on three categories:

**Category 1: Hybrid-dispatch sessions** (session-log-audit, codex-drift audit) — these sessions are neither "one model does everything" nor "one model reviews another's work." They involve multi-model parallel dispatch, synthesis across models, and the delegation axis becoming plural mid-session. The framework imagines `cross_model` as a single choice made at session start; real sessions run mixed fleets.

**Category 2: Pre-subject investigatory sessions** (the 2026-04-02 cluster, the philosophical audit) — these sessions were dispatched as informal proof-of-concept probes before the audit taxonomy existed, and they discovered their subject mid-execution. The framework accommodates this ("subject is optional for investigatory/exploratory"), but the obligations model doesn't yet address what to do when a session with five parallel agents discovers its subject differently across different agents.

**Category 3: Raw session log preservation** (apollo-kb-audit, deliberation-usage-audit) — these files are not audit outputs; they are raw Claude session JSON logs misclassified as audits during migration. The 3-axis framework cannot classify these because they are not audits in any meaningful sense. This is a gap in the migration itself, not the taxonomy.

The obligations approach survives the retrospective with moderate success. For sessions conducted after ground rules were established (discuss-phase-exploration-quality), the obligations approach would have been sufficient. For sessions conducted before the infrastructure existed (the entire 2026-04-02 cluster and the fork audit), the obligations would have caught genuine quality failures — but only if they had been applied. The deeper question is not "would the framework have helped?" but "would the framework have been followed?" The evidence suggests that highly framed, informal multi-agent sessions resist obligation enforcement because there is no clear single agent to whom obligations apply.

The single most important finding: **the obligations model assumes a single auditor. When audits involve parallel agent dispatch plus synthesis, obligation enforcement requires a different mechanism** — either the orchestrator checks obligations before synthesis, or each sub-agent receives its own obligation set. The current model has no mechanism for either.

---

## 2. Per-Session Classification Table

| Session | Old Type (from frontmatter) | New 3-Axis | Subject Optional? | Fit Assessment |
|---|---|---|---|---|
| 2026-03-fork-audit | `codebase_forensics` | codebase_forensics × standard × self (10 sub-agents, but single delegation decision) | No — subject was known | Good fit; 10-agent dispatch is a structural detail, not a delegation-axis variation |
| 2026-04-02-apollo-kb-audit | `adoption_compliance` | artifact_analysis × exploratory × self | Yes (discovered: KB state and cross-machine gap) | File is a raw JSON session log, not an audit output; classification is of the research task, not the artifact |
| 2026-04-02-cross-project-adoption-audit | `adoption_compliance` | adoption_compliance × investigatory × self | Partial | Strong fit; session explicitly names assumptions and what it cannot see — already meets most investigatory obligations informally |
| 2026-04-02-deliberation-usage-audit | `adoption_compliance` | adoption_compliance × standard × self | No | File is raw JSON session log; the classification fits the task spec but not the saved artifact |
| 2026-04-02-philosophical-audit | `exploratory` | process_review × exploratory × self | Yes (partially) | Best classified as exploratory process_review of philosophical operationalization; escape hatch type was appropriate |
| 2026-04-02-signal-audit | `adoption_compliance` | adoption_compliance × standard × self | No | Clean fit; structured compliance report with clear scope and standard output |
| 2026-04-07-v1.20-requirements-review | `requirements_review` | requirements_review × standard × cross_model:gpt-5.4 | No | Clean fit and demonstrates delegation axis works — the cross-model flag is a property of the session, not the subject |
| 2026-04-07-v1.20-roadmap-restructure | `cross_model_review` | requirements_review OR process_review × standard × cross_model:sonnet | No | Old type `cross_model_review` was wrong here — this was an adversarial review of a proposal, best classified as requirements_review or comparative_quality |
| 2026-04-08-codex-drift-audit | `cross_model_review` | codebase_forensics × standard × cross_model:gpt-5.4 | No | Old type was wrong; delegation is `cross_model`, but subject is codebase forensics |
| 2026-04-09-claim-audit-batch-{1,2,3,4} + catalogs | `claim_integrity` | claim_integrity × exploratory × self | Yes (loosely) | "Exploratory" is right for the method (read and find natural groupings); "claim_integrity" is right for the subject |
| 2026-04-09-exploratory-claim-audit | `claim_integrity` | claim_integrity × exploratory × self | No (subject known) | Same session as above; "exploratory" in frontmatter was method, not subject |
| 2026-04-09-discuss-phase-exploration-quality | `comparative_quality` | comparative_quality × investigatory × self + cross_model:gpt-5.4 | No | Rich fit; the codex review sub-file adds cross-model dimension; the progression from audit 1 → audit 3 is a natural orientation escalation (standard → investigatory) |
| session-log-audit-2026-04-07 | None (implicit: exploratory) | artifact_analysis × investigatory × self+cross_model:gpt-5.4 | Partially | Hardest to classify; the session was self-describing as a "proof-of-concept" for a sensor; the audit is also research, deliberation capture, and method comparison |
| VERIFICATION.md (workflow-produced) | `phase_verification` | phase_verification × standard × self | No | Perfect fit; template-based, scope is known, single auditor, structured output |
| MILESTONE-AUDIT.md (workflow-produced) | `milestone` | milestone × standard × self | No | Good fit; structured integration check; uses template; standard orientation |

---

## 3. Detailed Analysis: Five Most Instructive Cases

### 3.1. session-log-audit-2026-04-07 — The Framework's Hardest Case

**What actually happened:** A session that began as a concern about patching problems and evolved into a 30-subagent cross-platform audit. Six parallel discovery agents (3 Sonnet, 3 GPT-5.4) found 67 negative findings; 6 positive signal agents found 98 positive findings. Dual synthesis (Opus + GPT xhigh). Model comparison experiment (10 runs, 4 models). Telemetry discovery. Deliberation capture (11 threads). Log sensor rewrite. All in one session.

**3-axis classification attempt:**
- Subject: `artifact_analysis` (session log corpus) + `process_review` (sensor design evaluation) + `codebase_forensics` (telemetry infrastructure discovery) — the session had at least 3 subjects
- Orientation: `investigatory` (started from a gap, found competing explanations for signal quality failure) + `exploratory` (telemetry discovery was pure curiosity)
- Delegation: `self` + `cross_model:gpt-5.4` + `cross_model:claude-opus-4-6` — three delegation modes simultaneously

**The framework resists.** The session is not a single audit. It is a research session with audit methodology applied to some parts. The SESSION-HANDOFF.md explicitly notes "this doesn't fit any existing GSDR workflow" — Thread 11, the workflow gap for informal research. The 3-axis model handles individual audit tasks within such a session, but the session itself is a container that holds multiple overlapping tasks with different subjects, orientations, and delegation modes simultaneously.

**What would the obligations have changed?**

The positive signal pass (98 findings after the initial negative-only pass) was corrective — the user caught systematic framing bias and demanded positive signal detection. This is precisely what the investigatory orientation's obligation I3 ("present competing explanations for each major finding") and I4 ("name the position of the investigation") would have enforced: the initial framing was adversarial (find failures), the corrective was reflexive (find what the framing made invisible). Had these obligations been applied to the synthesis step, the Opus negative synthesis might have included its own positive counterpart from the start.

**The contamination experiment** was not prompted by any obligation — it was prompted by the user noticing that agent briefings mentioned they were being compared and were given target finding counts. Obligation Rule 5 ("distinguish measure from measured") would have caught this in post-hoc review but probably not in real-time during dispatch. The obligations framework has no mechanism for real-time dispatch hygiene.

**What obligations are missing:** A "dispatch design" obligation — when running parallel agents with identical prompts, the obligation to verify that prompts are uncontaminated before synthesis. This is not currently in any obligation set.

**Template vs. obligations:** The SESSION-HANDOFF.md is the best artifact in the entire corpus. It synthesizes findings, names deliberative moments, explains why certain paths were not taken, and orients the next session. But it wasn't produced by any obligation or template — it was produced by an informal practice that this session developed. The obligations model would not have generated the forward orientation section or the "what changed in source" accounting.

**Fit assessment:** The 3-axis model can classify individual artifacts within this session but cannot classify the session as a whole. This is a genuine framework gap, not a classification failure.

---

### 3.2. 2026-04-02 Cross-Project Adoption Audit — Already Meets Investigatory Obligations

**What actually happened:** Four parallel exploration agents dispatched to four projects (zlibrary-mcp, arxiv-sanity-mcp, f1-modeling, epistemic-agency) as a "proof-of-concept" for what a cross-project sensor might do. The resulting synthesis document explicitly names its assumptions (5 listed), names what it cannot see (4 listed), exposes its situatedness (auditing adoption from within GSDR's framework), and presents findings with acknowledged blind spots.

**3-axis classification:** `adoption_compliance` × `investigatory` × `self`

**Would the investigatory obligations have changed the approach?**

Read against the obligations:
- I1 ("start from the discrepancy, not a theory"): The session started from a genuine discrepancy — the user knew signals weren't progressing but didn't know why across projects. Present.
- I2 ("let investigation guide artifact selection"): The four parallel agents each followed the evidence within their assigned project. Present.
- I3 ("present competing explanations"): The "Position of Critique" section presents the assumption that signal lifecycle progression is desirable — and then immediately challenges it with the epistemic-agency counterexample (live diagnostic instruments vs. closure candidates). Present.
- I4 ("name the position of the investigation"): Explicit section "Position of Critique" names the situatedness. Present.
- "Show what remains unknown": Section "What We Cannot See From Here" explicitly names 4 unknowns. Present.

**This audit meets all investigatory obligations without having known about them.** The quality wasn't produced by the obligation framework — it was produced by the user's deliberation practice and the specific framing given to the agents. This suggests that when the question is well-formed and the researcher is epistemically sophisticated, the obligations add nothing. They would matter most for routine audits without sophisticated framing.

**What obligations are missing:** The "Position of Critique" section reveals something the obligations framework doesn't have: an obligation to surface the constraints on the audit's interpretive horizon (what the audit framework itself makes invisible). I4 says "name the position of the investigation" — but this audit went further: it named what the investigatory framework (GSDR adoption patterns) makes invisible (research work that adapts rather than conforms to GSDR). The obligations should include: "name what your audit framework makes invisible, not just what you chose not to look at."

**Template vs. obligations:** A template would have destroyed this audit. The "Position of Critique" format is sui generis — it doesn't match epistemic, structural, or compliance templates. The obligations approach is correct here precisely because no template could have accommodated this structure.

---

### 3.3. 2026-04-09-discuss-phase-exploration-quality — The Gold Standard and Orientation Escalation

**What actually happened:** A four-audit chain within one session. Audit 1 (exploration-quality-audit.md) was standard orientation — it counted structural features and produced a comparison table. Audit 2 (outcome-comparison-audit.md) added more dimensions but still made fabricated claims. Audit 3 (audit-review-and-deepening.md) started to apply critical scrutiny. Audit 4 (rigorous-comparative-audit.md) received 7 explicit ground rules and a task spec listing specific failures in prior audits — it produced demonstrably better output.

**3-axis classification across the chain:**
- Audit 1: comparative_quality × standard × self
- Audit 2: comparative_quality × standard × self (with inadequate grounding)
- Audit 3: comparative_quality × standard → investigatory × self (orientation shifted mid-audit as correction was applied)
- Audit 4: comparative_quality × investigatory × self (explicit orientation with ground rules)
- Codex review (codex-gpt54-review.md): comparative_quality × standard × cross_model:gpt-5.4

**The orientation escalation is the key finding.** The session demonstrates a natural progression from standard to investigatory as the investigation discovered failures in prior audits. The 3-axis model doesn't have a mechanism for representing orientation escalation — the frontmatter records a single orientation, but this session shows that orientation is properly understood as a trajectory that changes as the investigation matures.

**Would the investigatory obligations have changed the approach from Audit 1?**

If Audit 1 had received investigatory obligations from the start:
- I1: The discrepancy was "Phase 57 CONTEXT.md feels thinner" — this is a discrepancy, not a theory. Present implicitly.
- I2: Audit 1 counted structural features rather than reading content. Investigatory obligation I2 ("let investigation guide artifact selection") would have demanded reading [grounded] decisions and tracing their provenance chains, not counting section headers. **This is the specific obligation failure.**
- I3: Audit 1 found "structural collapse" without presenting competing explanations (is the thin era thin because of --auto mode incentives, template limitations, or genuine epistemic regression?). Obligation I3 would have required competing explanations.
- I4: Audit 1's position was not named — it was implicitly committed to the view that "more structural sections = better epistemic practice." Naming this position would have revealed it as a theory requiring scrutiny.

**Verdict: investigatory obligations applied from Audit 1 would have caught the specific pattern of failures that required 3 more audits to correct.** This is the strongest evidence that the obligations approach works.

**What obligations are missing:**
The Codex review (Audit 5, the cross-model check) added something no obligation captures: the adversarial reviewer caught that the deliberation "imports at least one bad evidential claim from the supporting audit." This is the cross-contamination problem — audit chains where Audit N accepts claims from Audit N-1 without re-verification. A "chain integrity" obligation is needed: "when your output depends on a predecessor audit's finding, verify that finding independently before incorporating it."

---

### 3.4. 2026-04-08-codex-drift-audit — Demonstrating the Old Taxonomy's Confusion

**What actually happened:** GPT-5.4 ran a live-runtime codebase check against the GSD harness, comparing documentation against the actual Codex CLI behavior. Produced three reports (drift audit, capability matrix audit, harness audit). A Claude Sonnet review of the roadmap restructure proposal (v1.20-roadmap-restructure-review.md) was filed in the same directory.

**Old taxonomy failure:** Both the drift audit (genuinely `codebase_forensics` done by GPT-5.4) and the roadmap review (genuinely `requirements_review` / `comparative_quality` done by Sonnet) were tagged `cross_model_review`. The old taxonomy assigned `cross_model_review` based on delegation, not subject — exactly the conflation the user identified.

**New 3-axis:**
- Drift audit: codebase_forensics × standard × cross_model:gpt-5.4
- Roadmap review: (requirements_review OR comparative_quality) × standard × cross_model:sonnet (here "cross_model" is relative — it was a Claude instance reviewing a Claude-produced proposal; the adversarial function is still present even without model family difference)

**What obligations would have changed the approach?**

The drift audit is extremely well-executed. Reading it, it already meets most `codebase_forensics` obligations:
- "Examine actual code, not documentation" — it ran live commands and compared against live output.
- "Trace data flow" — it traced installer code to config file paths.
- "Identify structural patterns" — it identified the systematic documentation-reality gap.

The drift audit would have benefited from one additional obligation that isn't in the current set: **"test whether documentation was ever correct or has always been wrong"**. The drift audit tells us what's currently wrong but not when the documentation diverged from reality. This temporal dimension matters for remediation — a doc that was always wrong is different from a doc that was right until a runtime upgrade.

**The roadmap restructure review** also meets most comparative_quality / requirements_review obligations. The one obligation failure: it says "the proposal overstates the 'circular dependency'" but doesn't fully trace what the correct dependency structure should be. An obligation "for each found defect, characterize both the defect and the correct behavior" would have caught this.

**Framework stress test:** The two files in the same directory (drift audit vs. roadmap review) illustrate that a single audit session can contain multiple subjects. The directory is not a session — it's a directory. The session is the combination, and the session has two distinct audits that happen to be co-located. The directory convention can accommodate this, but the session-level frontmatter (if it existed) would have to choose one `audit_subject`.

---

### 3.5. VERIFICATION.md and MILESTONE-AUDIT.md — Template Excellence

**What actually happened:** VERIFICATION.md (Phase 39, representative sample): 10-item table with specific evidence for each item, status flags, a score, and a structured artifact checklist. MILESTONE-AUDIT.md (v1.15): YAML frontmatter scores, tech debt items with phase attribution, structured findings by category.

**3-axis classification:** Both are phase_verification or milestone × standard × self. No ambiguity.

**Would obligations have changed these?**

No. These audits are already fully meeting the phase_verification obligations:
- "Verify execution, not just existence" — the Phase 39 report checks `sensors list` output, not just the agent spec.
- "Check wiring definition → use" — checks hook registration in settings.json.
- "Compare against success criteria" — against the phase's stated goal.

**These audits demonstrate something important: for well-defined, well-scoped, well-precedented audit types, templates are better than obligations.** The VERIFICATION.md template produces consistent, comparable, searchable outputs across 63+ instances. The obligations approach would produce more flexibility but less consistency. For Phase N+1 planning, a predictable VERIFICATION.md format lets you skim across phases; an obligations-based freeform output doesn't.

**The tension:** The obligations approach is correct for complex, novel, investigatory audits. Templates are correct for routine, predictable, well-precedented audits. The deliberation's proposal — "suggested structures for agents that need scaffolding, not mandates" — is the right resolution, but it requires honest assessment of which category an audit falls into before dispatch.

**What the framework needs here:** A "complexity classifier" at the orchestration level — before choosing between template and obligations, assess: Is the subject well-defined? Is the scope bounded? Is there an established precedent for this audit type? If yes to all three, use template. If no to any, use obligations.

---

## 4. Framework Gaps — What the Retrospective Reveals

### Gap 1: Multi-Subject Sessions

The framework assumes `audit_subject` is singular. Seven of the thirteen sessions have multiple subjects (session-log-audit has at least 3; the 2026-04-02 cluster ran 4-5 subjects in parallel within a single session intent). The qualified type assignment mechanism ("fit assessment in the task spec") handles single-subject ambiguity but not genuine multi-subject sessions.

**Proposal:** Allow `audit_subject: [primary, secondary]` with an explicit "primary subject drives obligation loading, secondary subjects extend it." The fit assessment should note the multi-subject structure and explain which obligations dominate.

### Gap 2: Orientation Escalation

Sessions don't have a single orientation — they have an orientation trajectory. The discuss-phase session shows standard → investigatory as failures in prior audits were discovered. The session-log audit shows investigatory → exploratory → investigatory across different parts of the same session.

**Proposal:** Orientation is the orientation at session start, but audit reports should include a "orientation trajectory" note when it changed and why. The chain integrity obligation (see below) can trigger an orientation escalation if a prior audit's claims require re-verification.

### Gap 3: Parallel Agent Obligation Enforcement

When 6 agents run in parallel, who enforces the obligations? Each agent receives its task spec, but the obligations are checked (if at all) only at the synthesis step. Obligations that operate at the individual finding level (I2 — let investigation guide artifact selection; I3 — present competing explanations) are irreversible if missed at the discovery stage.

**Proposal:** The orchestrator should include orientation obligations in each sub-agent's task spec, not just the synthesis prompt. The synthesizer's obligations should include an obligation to check whether each sub-agent met its orientation obligations.

### Gap 4: Chain Integrity

When audit B uses audit A's finding as evidence, and audit A had a quality failure, audit B inherits the failure invisibly. This is the single most consequential failure mode in the discuss-phase session chain. No current obligation addresses it.

**Proposal:** Add a chain integrity obligation to all non-first audits in a chain: "For each finding that depends on a predecessor audit's claim, re-verify that claim independently before incorporating it. State the re-verification or state why it was not done."

### Gap 5: Dispatch Hygiene

When running model comparison experiments or multi-agent parallel dispatch, the prompts themselves can contaminate the results (the contamination experiment in the session-log audit found 50% GPT inflation from framing effects). No obligation currently addresses prompt hygiene.

**Proposal:** For `cross_model` delegation, add an obligation: "Verify that the delegation prompt does not include framing that could systematically bias findings (comparative framing, target counts, desired conclusions). If the comparison is intentional, note it explicitly in the audit frontmatter as a confound."

### Gap 6: Raw Log Files Are Not Audits

Three files in the 2026-04-02 cluster (apollo-kb-audit, deliberation-usage-audit, and partially the philosophical-audit) are raw JSON session logs — they are the session transcript, not an audit output. They were migrated into `.planning/audits/` with audit frontmatter, but they contain no synthesized findings, no epistemic judgments, no conclusions. The taxonomy correctly classifies what these sessions were trying to do, but the artifacts themselves are not what the taxonomy is for.

**Proposal:** The migration should have created a distinction between "audit session preserved as session log" and "audit session preserved as synthesized output." The former needs a `format: session_log` field in frontmatter; the latter is the normal case. This is a data hygiene issue, not a framework issue, but the framework should accommodate it.

### Gap 7: What the Audit Framework Makes Invisible

The cross-project adoption audit explicitly named what the GSDR audit framework makes invisible — it audited adoption against GSDR's own categories and caught that epistemic-agency adapted rather than conformed. The obligations have I4 ("name the position of the investigation") but nothing that specifically asks: "What does this audit's framework make invisible? What kinds of findings would not appear in this audit no matter how rigorously it was conducted?"

**Proposal:** Add to the investigatory obligation set: "Name what your audit framework cannot see — not what you chose not to look at, but what the structure of the audit makes invisible."

---

## 5. Recommendation: Does the Obligations Approach Hold Up?

**Short answer: Yes, with modifications.**

The longer answer requires distinguishing three audit populations:

**Population 1: Routine, structured, well-precedented audits** (VERIFICATION.md, MILESTONE-AUDIT.md, fork audit, requirements review)

For these, templates are better than obligations. The obligations approach introduces unnecessary flexibility where consistency serves better. The Phase 39 VERIFICATION.md is more useful than it would be if the auditor had "composed obligations" into a freeform output. The recommendation is to keep templates for standard × phase_verification, milestone, and adoption_compliance, and use obligations for everything else.

**Population 2: Complex, novel, or investigatory audits** (session-log audit, discuss-phase chain, cross-project adoption)

For these, the obligations approach is correct. The discuss-phase chain demonstrates concretely that investigatory obligations applied from Audit 1 would have caught the specific quality failure that required 3 more audits to correct. The cross-project adoption audit demonstrates that sophisticated framing independently satisfies the obligations — which means the obligations encode genuine epistemic practice, not bureaucratic overhead.

**Population 3: Multi-agent, multi-subject, multi-model sessions** (session-log audit, the 2026-04-02 cluster)

For these, neither templates nor the current obligations model is sufficient. The obligations model assumes a single auditor with a single subject in a single session. Real complex sessions violate all three assumptions simultaneously. For this population, the framework needs the four gap-closing proposals above: multi-subject frontmatter, parallel agent obligation enforcement, chain integrity, and dispatch hygiene.

**The most important gap not in the current deliberation:** The obligations approach is designed for individual auditors. The project's actual audit practice has evolved to use multi-agent parallel dispatch for complex questions. The framework needs to account for this at the orchestration level, not just the output level.

**What this implies for Phase 57.4 design:** The audit command should generate not just a single obligation set, but a dispatch plan that assigns obligations to sub-agents (if parallel) and to the synthesizer (always). The synthesizer's obligations should include chain integrity and orientation trajectory reporting. The command should also assess whether the session falls into Population 1 (template), Population 2 (obligations), or Population 3 (multi-agent obligations + dispatch hygiene), and adjust its output accordingly.

**The framework is ready for adoption with these modifications.** The retrospective confirms that the 3-axis model correctly captures the orthogonality that the flat taxonomy conflated, and the obligations approach correctly captures the epistemic demands of different orientations and subjects. The gaps are real but additive — they don't undermine the core decomposition.

---

## Appendix: Classification Notes on the 2026-04-02 Cluster

The four 2026-04-02 audits (apollo-kb-audit, deliberation-usage-audit, cross-project-adoption-audit, philosophical-audit, signal-audit) were dispatched as a "pre-v1.19 deliberation" informal research sweep — agents doing informally what a sensor would do formally. Several observations:

**Apollo-kb-audit:** File content is raw JSON session log (Claude session transcript). The actual research task was `artifact_analysis × exploratory × cross_model? (SSH to remote machine)`. The frontmatter correctly identifies the subject matter but the artifact is not an audit output. Migration classification was wrong.

**Deliberation-usage-audit:** Same format issue — raw JSON session log. The task was `adoption_compliance × standard × self`. The prompt was detailed and well-scoped. If an actual synthesized output existed, it would be a strong adoption_compliance audit. The raw log preserves the process but not the epistemic product.

**Philosophical-audit:** Tagged `exploratory` (old taxonomy escape hatch) — correct in spirit. Better classified as `process_review × exploratory × self` — examining how philosophical engagement has operationalized in harness design. The "exploratory" tag was the right call given the escape-hatch was designed for exactly this.

**Signal-audit:** The only one of the five that is a proper synthesized output (not a raw session log). `adoption_compliance × standard × self`. Executive summary format with statistics and lifecycle analysis. The frontmatter classification is correct.

**Cross-project-adoption-audit:** The strongest of the five, discussed in detail in Section 3.2. `adoption_compliance × investigatory × self`.

---

*Analysis completed: 2026-04-10*
*Source sessions: 13 distinct audit sessions in `.planning/audits/`, 1 VERIFICATION.md sample, 1 MILESTONE-AUDIT.md sample*
*Framework applied: `audit-taxonomy-three-axis-obligations.md` (open deliberation)*
