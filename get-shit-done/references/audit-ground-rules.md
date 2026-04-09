# Audit Ground Rules Reference

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

---

## 2. Escape Hatch Rule (Always Included)

### Rule 4: What did you encounter that these ground rules didn't prepare you for?

This rule is an invitation, not enforcement. It ensures the ground rules do not become a ceiling on rigor.

[governing:cited] Per `.planning/deliberations/forms-excess-and-framework-becoming.md`: "the reviewer's checklist becomes the definition of rigor, foreclosing what rigor might require beyond it." An audit may discover that the important finding lies precisely in the territory these rules do not cover. Rule 4 creates space for the excess to leave traces.

If your answer to Rule 4 is "nothing," that may be accurate -- or it may indicate the ground rules shaped your attention so thoroughly that you didn't notice what they excluded. Consider the possibility before answering.

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
