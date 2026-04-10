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

### Exploratory combinations

**"I'm curious about how our signal corpus has evolved"**
→ `artifact_analysis` × `exploratory` × `self`

Obligations: core + exploratory (follow the curiosity, name what wasn't looked at, don't force closure) + artifact_analysis (state corpus, look for patterns, note exclusions). The auditor reads the signal corpus, follows threads of interest — maybe they notice severity has been trending down, or that certain tag clusters never get triaged. They report what they found and what questions opened. No verdict required. "I noticed X but I'm not sure what it means yet" is fine.

**"What patterns exist in how we write CONTEXT.md files?"**
→ `process_review` × `exploratory` × `self`

Obligations: core + exploratory + process_review (compare against the discuss-phase spec, examine methodology assumptions). The auditor reads a sample of CONTEXT.md files, follows observations. Maybe they notice exploratory mode produces richer output than discuss mode. Maybe they notice certain sections are consistently shallow. They report patterns, don't force a verdict, name what they didn't look at (e.g., "I only read 10 of 85 files — this is a sample, not a census").

**"Something about the way we handle phases feels off but I can't say what"**
→ no subject × `exploratory` × `self`

Obligations: core + exploratory only. No domain obligations. Maximum freedom. The auditor follows the curiosity wherever it leads — might end up in the roadmap, the signal corpus, the session logs. The obligation to "name what you found that you weren't looking for" is key here — the whole audit is about discovering what you weren't looking for.

### Investigatory combinations

**The Phase 57 case: "The implementation doesn't match the vision"**
→ no subject × `investigatory` × `self`

Obligations: core + investigatory (I1-I4, competing explanations, what remains unknown). No subject obligations — the investigation discovers the subject. It turned out to be about scope narrowing through the artifact pipeline, which is closest to process_review territory — but the investigation didn't know that at the start. The competing explanations obligation (I3) is what makes this different from a standard audit that would have closed on the first plausible explanation ("the researcher narrowed scope").

**"Why do our plans keep missing requirements?"**
→ `process_review` × `investigatory` × `self`

Obligations: core + investigatory + process_review (compare against spec, examine methodology). The auditor starts with process_review domain knowledge (check the plan-phase workflow, check how requirements flow into plans) but holds diagnosis open per I1. Maybe the issue IS the planning process — or maybe it's upstream in requirements writing, or downstream in how "missing" is defined. Competing explanations (I3) are essential here. The process_review obligations (compare against spec) and investigatory obligations (competing explanations) may tension — "compare against spec" implies the spec is the standard, but the investigation might discover the spec itself is the problem. The auditor navigates this tension per the composition principle.

**"Get GPT 5.4 to investigate what happened with Phase 57"**
→ no subject × `investigatory` × `cross_model`

Obligations: core + investigatory. The task spec goes to GPT 5.4 with all obligations embedded. Interesting because GPT 5.4 brings a genuinely different "position" (I4) — it hasn't been part of the project, hasn't been socialized into our conventions, might notice things we've become blind to. The I4 obligation ("name the position of the investigation") is especially rich here — the external model can honestly say "I'm approaching this without having been part of the decisions that led here."

**"Something went wrong with the cross-model audit last time — have GPT 5.4 investigate"**
→ `process_review` × `investigatory` × `cross_model`

All three axes active. Subject: process (something in the cross-model workflow broke). Orientation: investigatory (hold diagnosis open). Delegation: cross-model (the reviewing model investigates). Obligations: core + investigatory (I1-I4) + process_review (compare against spec, examine methodology). The external model gets all of this in its task spec. I4 is especially rich here — GPT 5.4 naming its own position as an external model investigating a process it wasn't part of.

### Standard combinations

**"Did Phase 57.4 achieve its goal?"**
→ `phase_verification` × `standard` × `self`

Obligations: core + standard (close on findings, clear verdict) + phase_verification (run tests, check wiring, compare against success criteria). This is the routine case. The auditor checks each success criterion, runs verification commands, produces a clear PASS/FAIL. Suggested template available as scaffolding — Goal → Artifacts Checked → Findings → Verdict. For standard orientation, the suggested template is genuinely useful: it ensures consistency across routine verifications and makes outputs scannable.

**"Are our requirements well-specified?"**
→ `requirements_review` × `standard` × `self`

Obligations: core + standard + requirements_review (read requirement text and assess specificity, check for missing requirements, assess feasibility). The auditor reads each requirement, assesses whether it specifies what it claims to. The "check for missing requirements" obligation is particularly valuable — it forces the auditor to look at negative space, not just check what's there.

**"Have GPT 5.4 check our claim types"**
→ `claim_integrity` × `standard` × `cross_model`

Obligations: core + standard + claim_integrity (verify claims against citations, surface untyped assumptions, trace dependency chains). Task spec goes to GPT 5.4 with all obligations embedded. The external model checks each typed claim, verifies citations, flags phantom claims. Standard orientation because we know exactly what we're checking — the external perspective adds independence, not investigatory openness.

### Tension and transition cases

**"Check the codebase and investigate anything surprising"**
→ `codebase_forensics` × starts `standard`, may shift to `investigatory`

This is where the obligations model shines over templates. The auditor starts with standard + codebase_forensics obligations (examine code, trace data flow, close on findings). If something surprising appears, the investigatory obligations become relevant — present competing explanations for the surprise, name what remains unknown. Under the obligations model, this shift is natural: you accumulate obligations as the situation demands. No "switching templates." The composition principle says: name the tension ("I started verifying structure but found something that demands investigation"), show how you navigated it.

**"Explore whether our audit taxonomy is doing what we think"**
→ `process_review` × `exploratory` × `self`

This is a meta-audit — auditing our own audit process. Exploratory because we're wondering, not investigating a breakdown. Process_review because the domain is our own methodology. The auditor reads audit-conventions.md, reads recent audit outputs, follows threads. Maybe they discover that the taxonomy is shaping what auditors find (exactly the REVIEW.md concern). The exploratory obligation "name what you found that you weren't looking for" is essential for meta-audits — the most important finding may be something the audit framework itself makes invisible.

## Retrospective Analysis

Completed: `.planning/deliberations/audit-taxonomy-retrospective-analysis.md`

13 distinct audit sessions analyzed. Key findings:

**The framework enables better responses to situations.** The test is not "does our taxonomy classify better" but "does our framework help the person respond better to what they're facing?" Evidence:
- **Discuss-phase chain:** Investigatory obligations from Audit 1 would have caught the specific quality failures that required 3 more audits to correct. One audit instead of four.
- **Session-log audit:** I3 (competing explanations) and framework invisibility would have caught framing bias before the user had to manually intervene.
- **Cross-project adoption:** Already met all investigatory obligations without knowing about them — the framework makes that quality reproducible rather than dependent on sophisticated framing.
- **Raw log files:** The command + task spec + obligations would have produced an actual audit response where there was only a session dump.
- **Codex drift audit:** Already excellent; the 3-axis model correctly reclassifies it from `cross_model_review` to `codebase_forensics × standard × cross_model:gpt-5.4`, enabling future situational retrieval.

**The framework's value is twofold:**
1. Raises the floor — for situations where the response would have been poor, obligations catch specific failures
2. Makes the ceiling reproducible — for situations where the response was already good, the framework encodes those practices for anyone facing a similar situation

**Three populations confirmed:** Templates for routine standard audits (Population 1). Obligations for complex/investigatory/exploratory (Population 2). Multi-agent sessions need additional mechanisms (Population 3).

**Seven gaps identified → six dissolve with formalization.** Most gaps (raw logs, dispatch hygiene, parallel enforcement, orientation escalation, multi-subject, dispatch hygiene) are symptoms of the absence of formalization, not framework design problems. Two genuinely persist: chain integrity (audit B inheriting audit A's fabricated claims) and framework invisibility (what the audit framework itself can't see). Both added as new obligations.

## Resolved Open Questions

1. **Templates vs. obligations:** Retrospective resolves it empirically. Templates for standard × routine subjects. Obligations for investigatory/exploratory. Hybrid approach (Approach D from discussion).

2. **Epistemic profiles:** Live in audit-conventions.md as a table the orchestrator reads during type inference. Each subject type has: oriented_toward, assumes, might_miss.

3. **Obligations with weaker agents:** The gold-standard audit and the cross-project adoption audit both demonstrate that well-framed obligations produce quality output. Suggested templates remain available as scaffolding for agents that need structural support.

4. **Family assignment:** Families become less important in the obligations model. Ground rules compose by subject, not family. `process_review` and `artifact_analysis` don't need a family assignment — they contribute their own obligation sets directly.

## Open Questions (remaining)

5. **Ground rule composition conflicts:** When subject obligations and orientation obligations tension, the resolution is hermeneutic, not algorithmic. The auditor names the tension, names what about the situation creates it, shows how they navigated it responsive to both demands. Not a precedence rule but a practice. The composition principle is written but untested — first real investigatory audits will reveal whether agents can actually engage with it or whether they collapse to ignoring one side.

6. **Cross-model delegation mechanics:** WF-01 pulled into 57.4. The audit command generates task specs for cross-model dispatch. Robust CLI invocation patterns, environment detection, instruction framing, output collection. Specific failure modes (agents finishing early, env misconfig, instruction degradation) need investigation during research.

7. **The aporia of epistemic humility:** The framework cannot pre-emptively account for its own limitations without that accounting becoming performative. A "Known Limits" section would be exactly the performative confession that discharges the obligation to remain attentive. Instead, the framework creates structural openings (Rule 4, Rule 5, framework invisibility obligation, excess section) where limits are encountered in practice. Whether these function as genuine openings or performative gestures depends on the practice of the agents who use them — which is not something the framework can guarantee.

   The practical stance: no "Known Limits" section. The operative mechanisms remain structural openings. When those mechanisms produce genuine encounters with the framework's edges, the signal-deliberation-revision loop is the response — not as resolution, but as continuation. The framework is never done encountering its limits because each revision creates new limits.

   This question is deliberately left open. The aporia is not a problem to solve but a condition of the framework's existence. Attempts to resolve it (including this paragraph) risk becoming the performative gesture they describe. The deliberation acknowledges this recursion without claiming to have escaped it.

---

*Deliberation opened: 2026-04-10*
*Lifecycle: open — paused, not concluded*
*Paused: 2026-04-10 — user directed pause due to time constraints, not because the deliberation has concluded*
