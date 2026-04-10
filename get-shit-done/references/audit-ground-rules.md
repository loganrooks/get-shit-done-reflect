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

## 3. Type-Family Extensions

Additional rules for specific audit families, derived from the 9 failure patterns cataloged during the audit-of-audits research. [assumed:reasoned] These families cluster observed audit types by what they verify: structural (does X exist and wire correctly), epistemic (are claims warranted and traceable), compliance (does practice match intent). The clustering is interpretive, not observed -- it may need revision as new audit types emerge.

### 3.1 Structural Audits

**Applies to:** `phase_verification`, `milestone`, `codebase_forensics`

**Rule S1: Run the test, don't just read it.**

Verification must execute, not inspect. A test file that exists but fails is worse than no test file -- it provides false assurance. Run the command. Read the output. Report what happened.

[assumed:reasoned] Derived from failure pattern 7 (verification checking structure not function): audits that confirmed "test file exists" without running the test missed failures that execution would have caught.

**Rule S2: Check wiring, not just existence.**

A file that exists but isn't connected is not complete. An export that exists but isn't imported is dead code. A route that exists but isn't registered is unreachable. Trace the connection from definition to use.

[assumed:reasoned] Derived from failure pattern 8 (plan-checker structural blindness): structural audits that confirmed file existence without checking import chains missed broken wiring.

### 3.2 Epistemic Audits

**Applies to:** `cross_model_review`, `requirements_review`, `comparative_quality`, `claim_integrity`

**Rule E1: Read content, not metadata.**

Do not count signals -- read 5-10 and describe their content. Do not count requirements -- read the requirement text and assess whether it specifies what it claims to specify. Do not count tests -- read the assertions and assess whether they test what matters.

[evidenced:cited] Per `rigorous-comparative-audit-task-spec.md` line 36: "Do not say '28 signals generated.' Read 5-10 signals and describe what they contain."

**Rule E2: When you don't know something, say "I don't know."**

Do not hedge with qualifications as a substitute for investigation. Do not write "this could be explained by X" unless you have checked whether X is actually the case. Admitting uncertainty is more honest and more useful than speculative hedging.

[evidenced:cited] Per `rigorous-comparative-audit-task-spec.md` line 39: "Do not hedge with qualifications as a substitute for investigation."

**Rule E3: Check whether cited artifacts still exist and support the claim.**

Citations go stale. Files move. Content changes. A `[evidenced:cited]` claim whose citation no longer resolves is a phantom claim -- it looks warranted but isn't. Verify that the artifact exists, that the line number is approximately correct, and that the quoted passage supports the claim being made.

[assumed:reasoned] Derived from failure pattern 2 (fabricated/phantom citations) and the context-checker's design (`gsdr-context-checker.md`), which treats phantom citations as FAIL-level severity.

### 3.3 Compliance Audits

**Applies to:** `adoption_compliance`

**Rule C1: Verify against actual practice, not documented practice.**

Check what the code does, not what the README says. Check what the agent actually writes, not what the agent spec says it should write. Check what the workflow produces, not what the template defines. Documentation describes intent; practice reveals reality. When they diverge, practice is the ground truth for a compliance audit.

[assumed:reasoned] Derived from failure pattern 5 (invented automated workflow narratives): a prior audit claimed artifacts were "normal automated workflow products" without checking whether the workflows it attributed them to actually exist.

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
