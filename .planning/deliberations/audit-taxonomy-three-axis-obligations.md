# Deliberation: Audit Taxonomy — Three-Axis Model with Obligations

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation -> problematization -> hypothesis -> test -> warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open -> concluded -> adopted -> evaluated -> superseded
-->

**Date:** 2026-04-10
**Status:** Open
**Trigger:** User observation during Phase 57.4 discuss-phase: "`cross_model_review` doesn't seem like a type, that's more of a delegation. Is it not? Like I could get GPT 5.4 from Claude to try to do an investigatory audit, or I can get it to do another type." This revealed that the flat 8-type taxonomy conflates three orthogonal concerns.
**Affects:** audit-conventions.md (type taxonomy), audit-ground-rules.md (ground rule selection), Phase 57.4 scope (command + agent design), Phase 62 WF-01 (cross-model review — may be pulled into 57.4), all future audit sessions
**Related:**
- `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/REVIEW.md` — REVIEW.md Part 4 warned that audit types smuggle assumptions about the form of failure
- `.planning/deliberations/forms-excess-and-framework-becoming.md` (open) — governing: how formal systems handle what exceeds their categories
- `.planning/phases/57.3-audit-workflow-infrastructure/57.3-CONTEXT.md` — the original 8-type taxonomy with [open] question on enum vs. open tagging
- `.planning/phases/57.3-audit-workflow-infrastructure/57.3-RESEARCH.md` — the audit landscape survey (8 agents, ~10 projects, 8 observed types, 9 failure patterns)
- `get-shit-done/references/audit-conventions.md` — current type taxonomy (8 named + exploratory)
- `get-shit-done/references/audit-ground-rules.md` — current ground rule selection table

## Situation

Phase 57.4 was about to add `investigatory` as a 9th named type in the flat audit taxonomy. The user observed that `cross_model_review` is not a *type* of audit — it's a *delegation strategy*. You can do any type of audit cross-model. This observation revealed that the flat taxonomy conflates three orthogonal concerns: what you're auditing (subject), from what stance (orientation), and who does it (delegation).

The REVIEW.md had already warned about this — Part 5 asked whether investigatory was better understood as a type, a family, or a mode. The user's observation sharpens the concern: the flat type list smuggles not just assumptions about failure forms, but assumptions about which axes matter.

## The Problem

The current flat taxonomy in audit-conventions.md Section 3:

8 named types in 3 families:
- **Structural:** phase_verification, milestone, codebase_forensics
- **Epistemic:** cross_model_review, requirements_review, comparative_quality, claim_integrity
- **Compliance:** adoption_compliance
- **Escape hatch:** exploratory

This conflates:
1. `cross_model_review` is a delegation strategy, not a subject type — you can get GPT 5.4 to do ANY type of audit
2. `exploratory` is an epistemic orientation, not a subject type — you can explore any domain
3. `investigatory` (proposed) is also an orientation — you can investigate any domain
4. The other 7 are genuine subject types — they describe WHAT is being audited

## Proposed Decomposition: Three-Axis Model

### Axis 1: Subject (what are you auditing?)

7 genuine subject types from the original taxonomy, minus `cross_model_review`, plus 2 new subjects discovered by testing the decomposition against real audit cases:

| Subject | Family | What it examines |
|---|---|---|
| `phase_verification` | structural | Did the phase achieve its stated goal? |
| `milestone` | structural | Cross-phase integration and E2E flows |
| `codebase_forensics` | structural | Code structure and wiring |
| `requirements_review` | epistemic | Coverage, feasibility, tensions |
| `comparative_quality` | epistemic | Quality comparison across outputs |
| `claim_integrity` | epistemic | Typed claim verification |
| `adoption_compliance` | compliance | Practice matches documented intent |
| `process_review` | NEW | How well a process/workflow performed; methodology soundness |
| `artifact_analysis` | NEW | Patterns in a corpus of artifacts |

Subject is **optional** for investigatory and exploratory orientations. When you don't know what you're investigating yet (the Phase 57 case), the investigation discovers its subject.

Each subject carries an **epistemic profile** — what it's oriented toward, what it assumes, what it might miss:

| Subject | Oriented toward | Assumes | Might miss |
|---|---|---|---|
| `phase_verification` | Structural completeness | Phase goal is the right standard | Goal itself being wrong; quality within passing criteria |
| `requirements_review` | Coverage and feasibility | Requirements are the authoritative scope | Requirements that should exist but don't |
| `process_review` | Methodology soundness | Process has a spec or expected behavior | Process working as designed but design is wrong |
| `artifact_analysis` | Patterns in data | Corpus is representative; patterns are meaningful | What the corpus excludes; patterns that only appear across corpora |
| `claim_integrity` | Claim warrant | Typed claim vocabulary captures the relevant distinctions | Claims that don't fit the vocabulary |
| `codebase_forensics` | Code structure | Code is the ground truth | Documentation that should override code; design intent behind structure |
| `comparative_quality` | Quality comparison | Comparison axis is meaningful | What the axis makes invisible; confounding variables |
| `milestone` | Integration completeness | Phases should connect | Whether they should connect differently |
| `adoption_compliance` | Practice matches intent | Intent is documented and correct | Intent that should change; undocumented reasonable deviations |

The orchestrator reads these profiles when matching situation to subject. If the situation has features that every subject's "might miss" column would miss, that's a signal for investigatory-without-subject.

### Axis 2: Orientation (from what stance?)

| Orientation | When | Key characteristic |
|---|---|---|
| `standard` (default) | You know what you're checking | Close on findings |
| `investigatory` | Something went wrong; you don't know what yet | Hold diagnosis open, competing explanations |
| `exploratory` | A question beckons; open-ended | Follow the question, don't force closure |

Orientation determines the epistemic posture. It's orthogonal to subject — you can investigate any domain, explore any domain, or verify any domain.

### Axis 3: Delegation (who does it?)

| Delegation | What it means |
|---|---|
| `self` (default) | Local gsdr-auditor agent |
| `cross_model` | Dispatch to another model (GPT 5.4, Gemini, etc.) |

Delegation is orthogonal to both subject and orientation. Any subject x orientation combination can be run cross-model. The cross-model infrastructure involves robust CLI dispatch, environment setup, instruction framing — currently fragile, to be formalized.

## Output Paradigm: Obligations, Not Templates

### The problem with templates

When two axes both contribute templates (orientation template + subject template), they may conflict. "Which template wins?" is the wrong question — it imposes algorithmic precedence on what should be a situated judgment.

### The obligations approach

Replace templates with **composable obligation sets**. Each axis contributes obligations — things the audit must *address*, not sections it must *write*.

The difference: "write a Competing Explanations section" (template) vs. "you must present competing explanations" (obligation). The second lets the auditor weave competing explanations into the narrative wherever they emerge naturally.

**Core obligations (every audit):**
- Ground rules 1-3 (cite evidence, test disconfirmation, distinguish measure from measured)
- Rule 4: What exceeded these obligations?
- Rule 5: Did the framing shape what you found?

**Orientation obligations:**

Standard:
- Close on findings with evidence
- Produce a clear verdict or assessment
- Address all items in scope

Investigatory:
- Start from the discrepancy, not a theory (I1)
- Let investigation guide artifact selection (I2)
- Present competing explanations for each major finding (I3)
- Name the position of the investigation (I4)
- Show what remains unknown
- Show how you navigated any tensions between obligations

Exploratory:
- State the question/curiosity that initiated the exploration
- Follow the question wherever it leads — permission to change direction
- Name what you found that you weren't looking for
- Name what the exploration opened (new questions, possibilities)
- Name what you didn't look at (acknowledged partiality, not failure)
- "I don't know yet" is a valid conclusion

**Subject obligations:**

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

### Composition and tension

Obligations from different axes compose into a flat list. When obligations tension against each other (e.g., I2 "follow the evidence freely" vs. S1 "run the test"), the auditor must:
1. Name the tension
2. Name what about the situation creates it
3. Show how they navigated it — responsive to both demands
4. The resolution emerges from engagement with the situation, not from a precedence rule

This is a hermeneutic principle, not an algorithmic one: "If you find yourself cleanly ignoring one obligation in favor of another, you've likely stopped engaging with the tension."

### Suggested structures (scaffolding, not mandate)

For agents that need scaffolding, suggested output structures remain available per orientation. But they are suggestions, not mandates. The obligations are what's checked. A suggested structure for standard audits provides consistency across routine verification. A suggested structure for investigatory audits provides starting points. But the auditor can depart from the suggestion when the investigation demands it.

### Qualified type assignment

For situations that don't fit neatly, the orchestrator writes a **fit assessment** in the task spec: "This audit is classified as process_review × investigatory because the concern is about methodology failure. However, the situation may also involve scope evolution. The auditor should expand beyond process_review obligations where the investigation leads."

### Template excess section

All audit output includes: **"What the Obligations Didn't Capture"** — a named section for findings that don't fit any obligation. If this section is consistently substantial for a particular kind of audit, that's evidence for a new subject type or new obligations.

## Frontmatter Schema Changes

Current: `audit_type: phase_verification` (single field)

Proposed:
- `audit_subject: phase_verification` (optional for investigatory/exploratory)
- `audit_orientation: standard | investigatory | exploratory`
- `audit_delegation: self | cross_model:{model_id}`

Backward compatibility: existing artifacts have `audit_type`. Migration adds the new 3 fields; `audit_type` maps to `audit_subject` with `audit_orientation: standard` and `audit_delegation: self` as defaults. Legacy field preserved for backward compat.

## Cross-Model Delegation (WF-01 Pull-Forward)

User directed pulling Phase 62 WF-01 (cross-model review) into Phase 57.4. The audit command is the natural home for cross-model dispatch since audits are the primary cross-model use case.

Current state: cross-model dispatch works but is fragile — the agent calls Codex CLI from Claude or Claude from Codex. Known problems: environment setup issues, agents finishing early, instructions not properly conveyed, lots of hand-holding.

Phase 57.4 should formalize best practices for cross-model dispatch within the audit command. The command generates the task spec (ground rules, obligations, scope, fit assessment), then dispatches to the target model's CLI with proper environment setup and instruction framing.

## Concrete Examples (from discussion)

### Exploratory
- "Curious about signal corpus evolution" → artifact_analysis × exploratory × self
- "What patterns in how we write CONTEXT.md?" → process_review × exploratory × self
- "Something about phases feels off" → no subject × exploratory × self

### Investigatory
- Phase 57 case: "Implementation doesn't match vision" → no subject × investigatory × self
- "Why do plans keep missing requirements?" → process_review × investigatory × self
- "Get GPT 5.4 to investigate Phase 57" → no subject × investigatory × cross_model

### Standard
- "Did Phase 57.4 achieve its goal?" → phase_verification × standard × self
- "Have GPT 5.4 check our claim types" → claim_integrity × standard × cross_model

### Tension cases
- "Check codebase and investigate anything surprising" → codebase_forensics × standard→investigatory (orientation shifts as surprises found)
- "Explore whether our audit taxonomy works" → process_review × exploratory × self (meta-audit)

## Open Questions

1. **Template precedence fully replaced by obligations?** Or should standard orientation retain full templates for consistency? The hybrid approach (templates for standard, obligations for investigatory/exploratory) is pragmatically safer but introduces two paradigms.

2. **How do epistemic profiles get exposed to the orchestrator?** Do they live in audit-conventions.md as a table? In the agent spec? In a separate reference doc?

3. **Does the obligations approach work for weaker agents?** The gold-standard audit was produced with ground rules but minimal template. But that was one case, one agent class. The retrospective analysis (below) should test this.

4. **Family assignment for new subjects:** `process_review` and `artifact_analysis` don't fit neatly into structural/epistemic/compliance. Is "process" a 4th family? Or do families become less important in the obligations model (since ground rules compose by subject, not family)?

## Next Step: Retrospective Analysis

Dispatch a sonnet agent to apply this 3-axis + obligations framework retrospectively to the audit corpus. For each audit in `.planning/audits/` and the audit-like artifacts in phase directories, classify under the new taxonomy and assess:

1. What subject × orientation × delegation would this audit be?
2. What obligations would have applied?
3. Would the obligations have changed the approach or output?
4. Where does the framework NOT fit — what does it make hard to express?

**Source materials for the retrospective:**
- `.planning/phases/57.3-audit-workflow-infrastructure/57.3-RESEARCH.md` — the original audit landscape survey
- `.planning/phases/57.3-audit-workflow-infrastructure/57.3-CONTEXT.md` — the 8-type taxonomy with failure patterns
- `.planning/audits/` — the actual audit artifacts (43 files migrated in 57.3)
- `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/REVIEW.md` — the Phase 57 investigation that triggered this

---

*Deliberation opened: 2026-04-10*
*Lifecycle: open*
