---
date: 2026-04-16
audit_subject: process_review
audit_orientation: investigatory
audit_delegation: self
auditor_model: gpt-5
scope: "Why phase 57.6 signal collection misattributed provenance and version, and what signature split is required"
triggered_by: "manual: user request after $gsdr-collect-signals 57.6"
task_spec: signal-provenance-audit-task-spec.md
ground_rules: core+investigatory+process_review
output_files:
  - signal-provenance-audit-output.md
tags: [signals, provenance, telemetry, phase-57.6, process-review, investigatory]
---

# Audit Task Spec: signal-provenance-audit

**Date:** 2026-04-16  
**Classification:** `process_review × investigatory × self`  
**Fit assessment:** The user is not asking whether one signal is true in isolation; they are asking why the signal-writing process cannot answer "who did the work?" and why the recorded version/provenance fields are misleading in a mixed-vendor, mixed-model workflow. This is `process_review` because the failure is methodological: the signal collection workflow and schema encode provenance incorrectly. It is `investigatory` because something concrete went wrong and the audit must hold open whether the problem is schema design, source precedence, missing artifact signatures, or all three. If the inquiry discovers that the corpus pattern itself matters more than the workflow, the audit may lean into `artifact_analysis`, but process review is the right starting frame.

## Epistemic Ground Rules

### Core Rules (every audit)

1. **Every factual claim cites file:line and quotes the relevant passage.** Do not assert what a file contains without opening it. Do not summarize without quoting.
2. **For every finding, BEFORE writing it, ask "What would disconfirm this?" and CHECK.** This is not rhetorical. Actually look for counter-evidence before committing the finding.
3. **Distinguish what you measured from what the measure captures.** Every measurement is a proxy. Name the gap between your metric and the thing you care about.
4. **Rule 4 (escape hatch): What did you encounter that these ground rules didn't prepare you for?** If the answer is "nothing," consider whether the rules shaped your attention so thoroughly that you didn't notice what they excluded.
5. **Rule 5 (frame-reflexivity): Did the framing shape what you found?**

   Specific grounding questions to answer:
   1. "If this audit had been classified as a different subject (e.g., `artifact_analysis` instead of `process_review`), what would it have looked for that you didn't? What findings would that audit have produced that yours doesn't?"
   2. "If this audit had been classified with a different orientation (e.g., `standard` instead of `investigatory`), what would it have held open that you closed? What would it have investigated that you accepted?"
   3. "What about the current classification shapes what you are prepared to notice and what you are not? Name one concrete example."

   If the answers are empty or merely perform concern without a concrete consequence in the findings, Rule 5 has not been engaged with.

### Orientation Obligations (investigatory)

- **I1 — Start from the discrepancy, not a theory.** Describe what was expected, what was delivered, and why those expectations are being treated as the standard.
- **I2 — Let the investigation guide artifact selection.** Follow the evidence; the artifact chain is a finding, not an input.
- **I3 — Present competing explanations.** For each finding, offer at least two interpretations and do not collapse to one prematurely.
- **I4 — Name the position of the investigation.** Acknowledge what this investigation is oriented toward and what a differently-situated investigation would attend to.
- **Show what remains unknown.** Explicit unknowns are findings.
- **Show how you navigated any tensions between obligations.** If process-review expectations tension with investigatory openness, surface the tension rather than smoothing it away.

### Subject Obligations (process_review)

Compare execution against process spec/intent; examine methodology assumptions; check if process worked-as-designed vs. design is wrong.

### Cross-Cutting Obligations

**Framework invisibility:** Name what this audit framework cannot see, not merely what it chose not to inspect.

Grounding question:

> "Name a concrete finding that would not appear no matter how rigorously this audit was conducted, because of how this audit's scope was framed. If you can't name one, that's suspicious — the framework is probably hiding something from you that it's also hiding from itself."

## The Situation

The immediate trigger is phase `57.6` signal collection. Nine signals were written and committed, but the user observed that the frontmatter makes them look as if they were authored under the wrong harness/version and, more importantly, does not preserve the distinction between:

- who did the work being judged,
- who detected the signal, and
- who wrote the signal entry.

The user further clarified that "who" is not just a model string. It needs the surrounding signature: harness, platform, vendor, model, reasoning configuration, and related runtime context. The user also suggested that chat-log telemetry may already expose some of this and should be used where available.

## What Must Appear in the Output

- Findings first, ordered by severity.
- Direct quotes with file:line references for every factual claim.
- Explicit distinction between artifact/work provenance, detector provenance, and writer provenance.
- A judgment on whether the current `57.6` signals can be safely used to reason about planner/executor/verifier mistakes.
- Concrete remediation guidance for schema, artifact signatures, and telemetry plumbing.
- A "What the Obligations Didn't Capture" section.
- A Rule 5 closing section with the three grounding questions answered concretely.

## Output File

Write the audit output to:
`.planning/audits/2026-04-16-signal-provenance-audit/signal-provenance-audit-output.md`
