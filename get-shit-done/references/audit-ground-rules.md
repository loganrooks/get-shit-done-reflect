# Audit Ground Rules Reference

> **⚠️ STATUS: Partially superseded — to be rewritten by Phase 57.4**
>
> The **ground rule set** (Core Rules 1-4 plus type-family extensions), the **per-type rule selection model**, and the assumption that rules can be selected from a fixed family given an `audit_type` value have been superseded by the v2 design. The v2 audit formalization replaces "type families" with an **obligations-based output paradigm** composed from a 3-axis taxonomy (subject × orientation × delegation), adds **frame-reflexivity Rule 5** applicable to every audit, adds the **I1-I4 investigatory ground rules**, and introduces three new obligations from retrospective analysis: **chain integrity**, **dispatch hygiene**, **framework invisibility**. The composition of these obligations is hermeneutic, not algorithmic — governed by a composition principle that says "name the tension, navigate situationally".
>
> **Authoritative scope for the v2 audit ground rules:**
> - `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` — obligation sets per axis, composition principle, the aporia of epistemic humility (**open — fed forward, not concluded**)
> - `.planning/deliberations/audit-taxonomy-retrospective-analysis.md` — validates obligations model against 13 audit sessions; origin of chain integrity, dispatch hygiene, framework invisibility
> - `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/REVIEW.md` — Rule 5 (frame-reflexivity), I1-I4 investigatory ground rules, the "mark the remainder" principle
>
> **Sections of this document still valid pending rewrite:**
> - **Core Rules 1-3** (cite evidence, test disconfirmation, distinguish measure from measured) — survive unchanged as core obligations for every audit
> - **Rule 4** (escape hatch: "What exceeded these rules?") — survives unchanged, though it is joined by Rule 5 for frame-level excess
> - **Section 4** (meta-rule on task spec embedding: "the agent needs the rules in its context window, not a pointer to them") — survives unchanged as the copying protocol, and is in fact reinforced by the obligations model
>
> Anything not listed above — including the type-family rule selection logic, the S1-S2 / E1-E3 / C1 extension sets, and the per-type selection matrix — should be checked against the deliberations before use. **Phase 57.4 will rewrite the type-family sections, add Rule 5 and I1-I4, and restructure the document around obligation composition.** Until that rewrite lands, downstream agents and workflows should treat those sections as provisional and cite the deliberations as primary authority.

---

Shared reference defining epistemic practices for all audit types. Ground rules are starting conditions for epistemic discipline, not exhaustive descriptions of what rigor requires.

**Consuming agents and workflows:**
- Future: `gsd-verifier`, `gsd-integration-checker`, audit-milestone workflow, cross-model review workflow
- Current: Manual task spec authors writing audit task specs

**Design authority:**
- `deliberation: exploratory-discuss-phase-quality-regression.md` -- meta-observation (lines 318-326) that audit quality depends on task spec quality
- `audit: .planning/audits/2026-04-09-discuss-phase-exploration-quality/rigorous-comparative-audit-task-spec.md` -- gold-standard task spec with 7 ground rules that dramatically improved audit output
- `deliberation: forms-excess-and-framework-becoming.md` -- governing constraint on how formal systems handle what exceeds their categories

**Typed claim vocabulary:** This document uses the 7-type system from `claim-types.md`. Claim markers indicate epistemic status per that reference.

---

## 1. Core Rules (ALL Audit Types)

These three rules apply to every audit, regardless of type. They are drawn directly from the gold-standard audit task spec that proved ground rules are the highest-leverage intervention for audit quality. [evidenced:cited] The empirical basis: Audit 1 (no ground rules) produced shallow work with phantom claims. Audit 3 (7 explicit ground rules from `rigorous-comparative-audit-task-spec.md`) corrected Audit 1's errors and produced traceable findings. Same agent class, same evidence base, different task spec.

### Rule 1: Every factual claim cites file:line and quotes the relevant passage.

Do not assert what a file contains without opening it. Do not summarize without quoting.

Bad: "The plan corrected CONTEXT.md"

Good: "Plan 56-01 Task 1 (line 74) says 'Update KB-01 in REQUIREMENTS.md to replace the incorrect lifecycle states.' However, 56-CONTEXT.md line 24 says 'Working assumption: Phase 31's state model is the correct one... Researcher must verify this.' This was NOT a locked decision -- it was a working assumption with research directive."

[evidenced:cited] This example is drawn from `rigorous-comparative-audit-task-spec.md` lines 26-27, which demonstrated how a prior audit fabricated a "planner corrected CONTEXT.md" narrative without reading the actual file.

### Rule 2: For every finding, BEFORE writing it, ask "What would disconfirm this?" and CHECK.

This is not a rhetorical question. Actually look for counter-evidence before committing a finding to the output. If you cannot find disconfirming evidence, note what you searched and why you didn't find it -- not finding counter-evidence is different from there being none.

[evidenced:cited] Per `rigorous-comparative-audit-task-spec.md` line 29: "Do not write 'Research quality was high in both eras' without first asking: 'What would low research quality look like, and is there evidence of that?' Then look for it."

### Rule 3: Distinguish what you measured from what the measure captures.

Every measurement is a proxy. Name the gap between your metric and the thing you care about.

[evidenced:cited] Per `rigorous-comparative-audit-task-spec.md` line 33: "If you count deviations, say: 'I counted deviations. Deviation count measures execution divergence from plan, NOT plan quality. A plan that locks wrong decisions will have zero deviations and be a worse plan.'"

### Rule 5: Did the framing shape what you found? (Frame-reflexivity)

Rule 5 is a core rule applying to every audit — it belongs alongside Rules 1-3, not in the Section 2 escape hatch. The v2 design adds it here because the concern Rule 5 addresses is structural, not exceptional: every audit is conducted from a classification (subject × orientation × delegation), and every classification makes some findings visible while hiding others. Rule 5 asks whether the classification was the right one to hold for this situation.

[governing:cited] Per `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/REVIEW.md` Part 4 (lines 103-116): "every audit type smuggles in assumptions about the form of failure, and those assumptions shape what the auditor can find... A `phase_verification` audit assumes the phase goal is the right standard. If the goal itself is wrong, verification passes and the real problem is invisible. A `comparative_quality` audit assumes quality is the relevant axis and that comparison is the right method. If the problem is scope rather than quality, the audit finds nothing."

Rule 5 is distinct from Rule 4 and the two must not be collapsed. Per REVIEW.md lines 115-116: "This is not the same as Rule 4 (escape hatch), which asks 'what didn't fit the template.' This is more fundamental: 'was this the right template to begin with?' **Rule 4 catches excess within the frame. Rule 5 catches whether the frame itself was appropriate.**" An audit might have no Rule 4 excess — everything encountered fit within the rules — and still fail Rule 5, because the frame determined what could be encountered in the first place.

**Orientation dependence.** The weight of Rule 5 scales with orientation, per REVIEW.md line 150. For **standard** orientation, Rule 5 is a lightweight closing step — one to three sentences at the end of the audit answering "Did the choice of audit type shape what you found? What would a differently-typed audit have looked for?" For **investigatory** orientation, Rule 5 is a full section — the frame-reflexivity is not decoration but part of the investigation, because an investigation that cannot see its own orientation is one that has quietly closed on a theory without knowing it. For **exploratory** orientation, Rule 5 weaves into the exploratory obligation "name what you didn't look at" — the framing itself is part of what wasn't looked at.

**Specific grounding questions (copy these verbatim into every task spec, do not paraphrase — per RESEARCH.md Pitfall 2, generic prompts about "bias" produce compliance theater; specific questions produce engagement):**

> 1. *"If this audit had been classified as a different subject (e.g., `{alternative subject}` instead of `{current subject}`), what would it have looked for that you didn't? What findings would that audit have produced that yours doesn't?"*
> 2. *"If this audit had been classified with a different orientation (e.g., `investigatory` instead of `standard`), what would it have held open that you closed? What would it have investigated that you accepted?"*
> 3. *"What about the current classification shapes what you are prepared to notice and what you are not? Name one concrete example."*

**Anti-performativity warning.** Per REVIEW.md line 166 and the forms-excess deliberation: if your answer to Rule 5 is "nothing" or "I considered my biases" without a concrete consequence visible in the findings, **Rule 5 has not been engaged with — it has been performed**. An empty Rule 5 is not neutral. It is a signal that the frame is invisible to the auditor, which is exactly the failure mode the rule exists to catch. The auditor who cannot name what their frame hid from them is the auditor most hidden from their frame. This is compliance theater, and Rule 5 refuses it. If the specific questions above produce only empty answers after genuine engagement, write that result and name why no alternative reading surfaces — that too is a finding.

---

## 2. Escape Hatch Rule (Always Included)

Section 2 originally housed Rule 4 alone. Under v2, Rule 4 is joined by Rule 5 (in Section 1) as a paired mechanism for keeping the ground rules from becoming a ceiling on rigor: **Rule 4 catches excess within the frame, Rule 5 catches whether the frame itself was appropriate**. Rule 4 remains here — in Section 2 rather than Section 1 — because it is an escape hatch by character: it asks what the rules failed to anticipate. Rule 5, by contrast, is a core rule that every audit must address, which is why Section 1 is its home. The two are complementary, not interchangeable.

### Rule 4: What did you encounter that these ground rules didn't prepare you for?

This rule is an invitation, not enforcement. It ensures the ground rules do not become a ceiling on rigor.

[governing:cited] Per `.planning/deliberations/forms-excess-and-framework-becoming.md`: "the reviewer's checklist becomes the definition of rigor, foreclosing what rigor might require beyond it." An audit may discover that the important finding lies precisely in the territory these rules do not cover. Rule 4 creates space for the excess to leave traces.

If your answer to Rule 4 is "nothing," that may be accurate -- or it may indicate the ground rules shaped your attention so thoroughly that you didn't notice what they excluded. Consider the possibility before answering.

*See Rule 5 in Section 1 for the frame-level complement — Rule 4 asks what escaped the rules, Rule 5 asks whether the rules were the right rules.*

---

## 3. Orientation, Subject, and Cross-Cutting Obligations

The v1 type-family rule-family model (select a rule set from `audit_type`) has been replaced. [governing:cited] Per `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` lines 102-112: "When two axes both contribute templates (orientation template + subject template), they may conflict. 'Which template wins?' is the wrong question — it imposes algorithmic precedence on what should be a situated judgment." The v2 design replaces type-family extensions with **composable obligation sets** drawn from three sources: orientation (stance), subject (what is being audited, when named), and cross-cutting obligations (applicable universally or conditionally).

**Obligations are things to engage with, not sections to write.** The difference matters. "Write a Competing Explanations section" (template) is different from "you must present competing explanations" (obligation). The first dictates shape; the second dictates epistemic practice. The obligation lets the auditor weave competing explanations into the narrative wherever they emerge naturally, rather than forcing them into a pre-specified slot where they may feel performative. When two obligations tension, the auditor must engage with the tension rather than pick a winner — see Section 5 (Composition Principle).

The three sources are additive. A standard × `phase_verification` audit carries: Core Rules 1-5 + standard orientation obligations + phase_verification subject obligations. An investigatory × (no subject) audit carries: Core Rules 1-5 + investigatory orientation obligations (I1-I4 plus unknowns and tensions) + the framework-invisibility cross-cutting obligation. A `cross_model` × investigatory × `process_review` audit carries everything above plus dispatch hygiene plus chain integrity (if the audit references predecessors). This is the composition the auditor must hold.

### 3.1 Orientation Obligations

[evidenced:cited] Lifted from `audit-taxonomy-three-axis-obligations.md` lines 119-140 (standard, investigatory supplementary, exploratory) and `pre-phase-archive/REVIEW.md` lines 70-74 (I1-I4 verbatim).

#### Standard orientation

The routine case. You know what you're checking; the goal is to close on findings with evidence. Standard orientation is Population 1 in the retrospective — where templates work better than obligations, and where the auditor's job is consistency, not openness. Core Rules 1-5 still apply in full.

- **Close on findings with evidence.** Every finding lands — pass, fail, or explicit defer-with-reason. *(Why this matters: standard audits exist to produce verdicts. An inconclusive standard audit is not a finding of ambiguity; it's a signal that the orientation was wrong and the audit should have been investigatory.)*
- **Produce a clear verdict or assessment.** At the scope level: did the audited thing meet its criterion? *(Why this matters: downstream decisions — ship, block, escalate — depend on the verdict. A buried or hedged verdict shifts the cost of ambiguity to the reader.)*
- **Address all items in scope.** Don't partially address the subject. If scope is too large, the audit should narrow and state what was excluded, not silently skip. *(Why this matters: silent exclusions are the most common cause of false-pass standard audits. The reader sees "audit passed" and assumes it covered the whole scope.)*

#### Investigatory orientation

The Population 2 case from the retrospective. Something went wrong and you don't know what yet, or the form of failure is itself what's uncertain. The I1-I4 obligations come from REVIEW.md Part 3 (lines 70-74) verbatim — their phrasing is load-bearing and should not be paraphrased when copied into task specs.

- **I1 — Start from the discrepancy, not a theory.** Describe what was expected, what was delivered, and why those expectations are being treated as the standard — the choice of comparison point is already an interpretive act. *(Why this matters: investigations that start from a theory select evidence to confirm the theory. Investigations that start from the discrepancy remain open to evidence the theory is wrong. The gap between expectation and delivery is a starting orientation, not a neutral fact — name why the expectation is the expectation.)*

- **I2 — Let the investigation guide artifact selection.** Don't mandate which artifacts to read in advance. Follow the evidence — if the discrepancy points to the planning stage, read planning artifacts. If it points to requirements, read requirements. The artifact chain is a finding, not an input. *(Why this matters: a pre-specified reading list encodes a hypothesis about where the failure lies. The investigation should discover where to read from what it finds, not from what the orchestrator specified. If the orchestrator pre-selected artifacts, I2 is in tension with that pre-selection — surface the tension, don't silently honor the pre-selection.)*

- **I3 — Present competing explanations.** For each finding, offer at least two interpretations. "The research narrowed scope" could mean the researcher made an error, OR the researcher correctly applied constraints the investigator hasn't understood yet. Don't collapse to one. *(Why this matters: an investigation that presents a single explanation has stopped investigating. The criterion for closing an investigation is not "I found an explanation" but "the evidence rules out the alternatives." An explanation without ruled-out alternatives is a hypothesis, not a finding.)*

- **I4 — Name the position of the investigation.** Every investigation is conducted from somewhere — with particular attunements, particular things it's prepared to notice, particular things it isn't. This isn't about cataloguing determinate "blind spots" as if they're hidden objects waiting to be found, but about acknowledging what this particular way of looking is oriented toward and what a differently-situated investigation would attend to. *(Why this matters: every investigator is embedded. Pretending otherwise produces the illusion of neutrality, and that illusion hides the frame from both the auditor and the reader. Naming the position is the minimum epistemic hygiene of situated inquiry — and it also gives the reader the information they need to decide how far to trust the investigation's framing.)*

Plus two additional investigatory obligations:

- **Show what remains unknown.** Not everything needs resolution. Explicit unknowns are findings — they map the edge of the investigation. *(Why this matters: the temptation at the end of an investigation is to close on a story. Resisting that temptation — and naming what the story cannot yet explain — is what distinguishes an investigation from a speculation.)*
- **Show how you navigated any tensions between obligations.** When investigatory obligations tension with subject obligations or with each other, the navigation itself is a finding. See the Composition Principle in Section 5. *(Why this matters: how an investigator resolves tensions reveals their working frame. Making that resolution explicit — rather than performing a clean synthesis — gives the reader the information they need to evaluate whether the navigation was sound.)*

#### Exploratory orientation

An exploratory audit starts from a question or curiosity, not from a discrepancy. It is allowed — indeed required — to change direction when the exploration leads somewhere unexpected. It is also allowed to end with "I don't know yet" as a valid conclusion. The exploratory posture is unfamiliar to agents trained to close on findings, so each obligation below is framed with its "why."

- **State the question or curiosity that initiated the exploration.** *(Why this matters: an exploration without a stated question tends to drift toward whatever the auditor already knows. Stating the question anchors the exploration in its occasion and gives the reader something to measure the exploration against.)*
- **Follow the question wherever it leads.** Permission to change direction is not optional — it's the posture. If what you find reframes the original question, that reframing is itself a finding. *(Why this matters: exploratory audits that stay on their initial track are indistinguishable from standard audits with vague scope. The permission to depart from the plan is what makes the exploration epistemically productive.)*
- **Name what you found that you weren't looking for.** *(Why this matters: the most valuable findings of an exploratory audit are often the ones the question didn't anticipate. Naming them explicitly prevents the narrative from smoothing them into the original question's shape.)*
- **Name what the exploration opened** — new questions, possibilities, directions worth pursuing. *(Why this matters: exploration produces openings, not closures. Unnamed openings vanish; named openings become seeds for future work.)*
- **Name what you didn't look at.** Acknowledged partiality, not failure. *(Why this matters: every exploration is partial. Naming the partiality honestly is what distinguishes a useful exploration from one that implicitly claims comprehensiveness it doesn't have.)*
- **"I don't know yet" is a valid conclusion.** *(Why this matters: forcing a closure on an exploration destroys its epistemic value. An exploration that ends in "I don't know yet" but has surfaced the right questions is worth more than one that ends in a confident but premature answer.)*

### 3.2 Subject Obligations

When an audit names a subject (Axis 1), that subject contributes its own obligation set. These are additive with orientation obligations and with the core rules. Lifted verbatim from `audit-taxonomy-three-axis-obligations.md` lines 142-154.

| Subject | Obligations |
|---|---|
| `phase_verification` | Verify execution not just existence; check wiring definition→use; compare against success criteria |
| `requirements_review` | Read requirement text, assess specificity; check for missing requirements (negative space); assess feasibility |
| `process_review` | Compare execution against process spec/intent; examine methodology assumptions; check if process worked-as-designed vs. design is wrong |
| `artifact_analysis` | State corpus and why it's representative; look for patterns AND anti-patterns; note what the corpus excludes |
| `claim_integrity` | Verify claims against citations; surface untyped load-bearing assumptions; trace dependency chains |
| `codebase_forensics` | Examine actual code not documentation; trace data flow; identify structural patterns |
| `adoption_compliance` | Verify against actual practice not documented practice; survey multiple instances; classify deviations |
| `milestone` | Check cross-phase integration; verify E2E flows; check interface mismatches between phases |
| `comparative_quality` | Define comparison axis explicitly; compare like with like; note what axis makes invisible |

**Subject is optional when omitted.** For investigatory or exploratory orientations that begin without a named subject (the Phase 57 case — "something doesn't match what I expected" with no clear hypothesis about what kind of thing is wrong), the investigation discovers its subject as it proceeds. In those cases, Core + orientation obligations are the full obligation set; subject obligations come online only if and when a subject is identified mid-audit.

**Subject obligations are additive, not authoritative.** A `process_review` audit that finds something outside the process_review obligation list has not violated anything — the subject obligations describe minimum engagement, not a ceiling.

### 3.3 Cross-Cutting Obligations

[evidenced:cited] Three obligations from retrospective analysis (`audit-taxonomy-retrospective-analysis.md` Gaps 4, 5, 7) that cut across orientation and subject. Each addresses a failure mode the v1 type-family model could not catch because the failure mode was structural — it arose from how audits compose with each other, with delegation, and with their own framing, not from any single audit's type.

#### Chain integrity

[evidenced:cited] Verbatim from retrospective Gap 4 (lines 194-197):

> "When audit B uses audit A's finding as evidence, and audit A had a quality failure, audit B inherits the failure invisibly. This is the single most consequential failure mode in the discuss-phase session chain. **Obligation:** For each finding that depends on a predecessor audit's claim, re-verify that claim independently before incorporating it. State the re-verification or state why it was not done."

**Applicability:** Every non-first audit in a chain — i.e., every audit whose frontmatter populates `predecessor_audits:` or whose findings cite a prior audit's conclusion as evidence. The obligation is triggered by dependency, not by orientation or subject.

**Why this matters:** The retrospective's most consequential finding was that audit quality failures propagate invisibly through chains. A single unverified claim in Audit 1 becomes the ground truth for Audits 2, 3, and 4 — and each downstream audit is graded on its own merits, so the failure appears nowhere in any individual audit's quality signals. Chain integrity creates a gate: you may not carry forward a claim you have not independently re-verified, or you must explicitly note that you did not and why.

#### Dispatch hygiene

[evidenced:cited] Verbatim from retrospective Gap 5 (lines 199-203):

> "When running model comparison experiments or multi-agent parallel dispatch, the prompts themselves can contaminate the results (the contamination experiment in the session-log audit found 50% GPT inflation from framing effects). **Obligation:** For `cross_model` delegation, verify that the delegation prompt does not include framing that could systematically bias findings (comparative framing, target counts, desired conclusions). If the comparison is intentional, note it explicitly in the audit frontmatter as a confound."

**Applicability:** Every `cross_model` delegation (Axis 3 = `cross_model:{model_id}`). Also relevant for any multi-agent parallel dispatch, even within a single model, where the dispatch prompts themselves could systematically bias what the sub-agents find.

**Why this matters:** The session-log audit found that framing effects in the dispatch prompt produced ~50% inflation in GPT's findings relative to an unframed baseline. The audit that generated the inflation had no way to see that the framing was the cause — the contaminated findings looked exactly like honest findings. Dispatch hygiene is the obligation to audit your own prompt before trusting the output. If comparative framing is intentional (e.g., for an adversarial cross-check), that's fine — but the intention must be documented, not smuggled in.

#### Framework invisibility

[evidenced:cited] Verbatim from retrospective Gap 7 (lines 211-215):

> "The obligations have I4 ('name the position of the investigation') but nothing that specifically asks: 'What does this audit's framework make invisible? What kinds of findings would not appear in this audit no matter how rigorously it was conducted?' **Obligation:** Name what your audit framework cannot see — not what you chose not to look at, but what the structure of the audit makes invisible."

**Applicability:** Always present for investigatory and exploratory orientations (where the framework's partiality is most operative); optional but strongly encouraged for standard orientation.

**Relationship to I4 and Rule 5.** Framework invisibility is distinct from both. I4 names the investigator's position — where they're looking from. Rule 5 asks whether the audit's *classification* (subject × orientation × delegation) was the right frame. Framework invisibility asks the deepest version of the question: **what kinds of findings cannot appear in this audit at all, because of how the audit's scope was structured?** The distinction is: I4 is about the auditor, Rule 5 is about the classification, framework invisibility is about the structural edges of what the audit can see no matter how well it's conducted.

**Ground framework invisibility in a specific question (copy into task spec verbatim — generic prompts produce compliance theater):**

> *"Name a concrete finding that would not appear no matter how rigorously this audit was conducted, because of how this audit's scope was framed. If you can't name one, that's suspicious — the framework is probably hiding something from you that it's also hiding from itself."*

**Why this matters:** The retrospective's cross-project adoption audit was the only one of 13 sessions that already met this obligation — it named explicitly what the GSDR framework's own categories made invisible about how epistemic-agency had adapted rather than conformed. Every other audit in the 13-session corpus had structural edges the audit could not see. The point is not that audits can escape their framework — they cannot — but that naming the edge is the difference between an audit that knows it is partial and one that mistakes its partiality for completeness.

---

## 4. How to Reference in Task Specs

Include this snippet in audit task specs to apply the core ground rules. Copy the rules -- do not reference by URL, since the agent needs the rules in its context window, not a pointer to them.

### Core rules only (all audit types):

```markdown
## Epistemic Ground Rules

Per `get-shit-done/references/audit-ground-rules.md`, core rules:

1. **Every factual claim cites file:line and quotes the relevant passage.**
2. **For every finding, BEFORE writing it, ask: "What would disconfirm this?" and CHECK.**
3. **Distinguish what you measured from what the measure captures.**

And the escape hatch:

4. **What did you encounter that these ground rules didn't prepare you for?**
```

### With type-specific extensions (example: epistemic audit):

```markdown
## Epistemic Ground Rules

Per `get-shit-done/references/audit-ground-rules.md`, core rules:

1. **Every factual claim cites file:line and quotes the relevant passage.**
2. **For every finding, BEFORE writing it, ask: "What would disconfirm this?" and CHECK.**
3. **Distinguish what you measured from what the measure captures.**

And the escape hatch:

4. **What did you encounter that these ground rules didn't prepare you for?**

### Additional Rules for Epistemic Audits

5. **Read content, not metadata.** Do not count signals -- read 5-10 and describe content.
6. **When you don't know something, say "I don't know."** Do not hedge with qualifications as a substitute for investigation.
7. **Check whether cited artifacts still exist and support the claim.**
```

### Selecting which extensions to include:

| Audit Type | Ground Rule Set | Extensions |
|------------|----------------|------------|
| `phase_verification` | `core+structural` | Rules S1, S2 |
| `milestone` | `core+structural` | Rules S1, S2 |
| `codebase_forensics` | `core+structural` | Rules S1, S2 |
| `cross_model_review` | `core+epistemic` | Rules E1, E2, E3 |
| `requirements_review` | `core+epistemic` | Rules E1, E2, E3 |
| `comparative_quality` | `core+epistemic` | Rules E1, E2, E3 |
| `claim_integrity` | `core+epistemic` | Rules E1, E2, E3 |
| `adoption_compliance` | `core+compliance` | Rule C1 |
| `exploratory` | `core` (minimum) | Add extensions as the audit's question demands |

---

## 5. Governing Principle

Ground rules are practices that enable rigor, not checklists that define it. They should be understood as starting conditions for epistemic discipline, not exhaustive descriptions of what rigor requires.

[governing:reasoned] Per the forms-excess deliberation (open, not concluded): "a formal system encounters something that exceeds its categories, and the system's response to the excess reveals something about the system itself." These ground rules are a formal system. They will encounter audits where the important finding lies in territory the rules do not cover. Rule 4 (the escape hatch) is the mechanism for that encounter -- but the encounter itself is not guaranteed by any rule. The auditor must remain alert to what the rules cannot see.

The strongest evidence for ground rules is also the narrowest: one deliberation session, one agent class (Sonnet), one question domain (CONTEXT.md quality). [governing:reasoned] The 3-audit progression proves that ground rules dramatically improve audit quality in that context. Whether the improvement generalizes across all audit types, agent classes, and question domains is plausible but not yet demonstrated. These rules should be treated as a strong starting position, not as settled science.

---

*Reference version: 1.0.0*
*Created: 2026-04-09*
*Design authority: Phase 57.3 (audit-workflow-infrastructure)*
*Depends on: `get-shit-done/references/claim-types.md` for typed claim vocabulary*
