# Audit Conventions Reference

> **⚠️ STATUS: Partially superseded — to be rewritten by Phase 57.4**
>
> The flat 8-type taxonomy, the `audit_type` single-enum frontmatter field, and the type-aware body templates in this document **do not express the complexities of the auditing situation** and have been superseded by the v2 design. A deliberation found that what looked like "types" conflated three orthogonal concerns: *subject* (what is being audited), *orientation* (from what stance), and *delegation* (who does it). The template paradigm also cannot compose obligations across those axes.
>
> **Authoritative scope for the v2 audit formalization:**
> - `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` — 3-axis model (subject × orientation × delegation), obligations-based output paradigm, composition principle, the aporia of epistemic humility (**open — fed forward, not concluded**)
> - `.planning/deliberations/audit-taxonomy-retrospective-analysis.md` — validates the 3-axis model against 13 audit sessions; identifies three new obligations (chain integrity, dispatch hygiene, framework invisibility)
> - `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/REVIEW.md` — frame-reflexivity Rule 5, I1-I4 investigatory ground rules, the "mark the remainder" principle
>
> **Sections of this document still valid pending rewrite:**
> - Section 1 (Directory Structure) — the `YYYY-MM-DD-{slug}/` convention and naming rules survive unchanged
> - Section 2 Required fields `date` and `scope` — survive unchanged (`audit_type` is replaced by `audit_subject` + `audit_orientation` + `audit_delegation`, kept as legacy field for backward compatibility)
> - Section 2 Recommended and Optional fields — survive unchanged
>
> Anything not listed above should be checked against the deliberations before use. **Phase 57.4 will rewrite the taxonomy (Section 3), body templates (Section 4), and related sections of this document.** Until that rewrite lands, downstream agents and workflows should treat those sections as provisional and cite the deliberations as primary authority.

---

Shared reference defining the directory structure, frontmatter schema, type taxonomy, and body template guidance for all audit artifacts. This document establishes the three-layer audit schema: shared metadata (strict), type-aware body templates (structured but provisional), and escape hatch (open).

**Consuming agents and workflows:**
- Future: `gsd-verifier`, `gsd-integration-checker`, audit-milestone workflow, cross-model review workflow, `gsd-tools audit` commands
- Current: Manual audit session creators, task spec authors, migration scripts

**Design authority:**
- `deliberation: exploratory-discuss-phase-quality-regression.md` -- identified the need for audit session conventions
- `deliberation: forms-excess-and-framework-becoming.md` -- governing constraint on taxonomy openness
- `agents/knowledge-store.md` Sections 2-4 -- model for frontmatter schema and type taxonomy design

**Related references:**
- `get-shit-done/references/audit-ground-rules.md` -- epistemic ground rules for audit task specs
- `get-shit-done/references/claim-types.md` -- typed claim vocabulary used in audit artifacts

---

## 1. Directory Structure

The canonical location for standalone audit artifacts is `.planning/audits/`. This directory holds audits not produced by standard phase/milestone workflows.

```
.planning/audits/
+-- YYYY-MM-DD-{slug}/           # Multi-file audit sessions
|   +-- {slug}-task-spec.md      # Task spec given to agent
|   +-- {slug}-output.md         # Agent output
|   +-- {slug}-2-task-spec.md    # Follow-up task spec (if chain)
|   +-- {slug}-2-output.md       # Follow-up output
+-- YYYY-MM-DD-{slug}.md         # Single-file audits (lightweight)
```

### Naming conventions

- **Date-first** (`YYYY-MM-DD`) for chronological sort
- **Slug** is kebab-case descriptive name (lowercase, hyphens, max 50 characters)
- Multi-file sessions get directories; single-file audits can be bare files
- Task spec files use `-task-spec.md` suffix
- Output files use `-output.md` suffix or a descriptive name (e.g., `rigorous-comparative-audit.md`)
- Follow-up files in a chain use numeric suffixes (`-2-task-spec.md`, `-3-output.md`)

### Examples

```
.planning/audits/
+-- 2026-04-09-discuss-phase-exploration-quality/
|   +-- rigorous-comparative-audit-task-spec.md
|   +-- rigorous-comparative-audit.md
|   +-- outcome-comparison-task-spec.md
|   +-- outcome-comparison-audit.md
+-- 2026-04-08-codex-drift-audit.md
+-- 2026-04-07-session-log-audit/
|   +-- session-log-audit-task-spec.md
|   +-- session-log-audit-output.md
```

---

## 2. Frontmatter Schema

Model: `agents/knowledge-store.md` Section 3 (Common Base Schema). YAML frontmatter in every audit artifact for provenance and searchability.

### Required fields

Per DC-4 from the Phase 57.4 CONTEXT.md and the 3-axis taxonomy in Section 3, the single `audit_type` enum is replaced by three orthogonal axis fields:

| Field | Type | Description |
|-------|------|-------------|
| `date` | YYYY-MM-DD | Date the audit was conducted (NOT the migration date) |
| `audit_subject` | enum \| omitted | One of 9 subjects per Section 3.1 (`phase_verification`, `milestone`, `codebase_forensics`, `requirements_review`, `comparative_quality`, `claim_integrity`, `adoption_compliance`, `process_review`, `artifact_analysis`). **Optional** for `investigatory` / `exploratory` orientations when the investigation has not yet identified a subject. |
| `audit_orientation` | enum | `standard` (default) \| `investigatory` \| `exploratory` — per Section 3.2 |
| `audit_delegation` | enum | `self` (default) \| `cross_model:{model_id}` (e.g., `cross_model:gpt-5.4`) — per Section 3.3 |
| `scope` | string | What was audited -- concise description of the target |

### Recommended fields

| Field | Type | Description |
|-------|------|-------------|
| `auditor_model` | string | Model identifier (e.g., `claude-sonnet-4-6`, `gpt-5.4`) |
| `triggered_by` | string | What launched this audit (e.g., `deliberation: X`, `manual: user request`, `workflow: audit-milestone`) |
| `task_spec` | string | Relative path to the task spec file within the session directory |
| `ground_rules` | string | Free-form label naming the composed obligation set applied to this audit. Under the obligations paradigm (Section 4), this is a composition label like `core+standard+phase_verification`, `core+investigatory+process_review`, or `core+exploratory` when subject is omitted. The v1 labels `core+structural`, `core+epistemic`, `core+compliance` are **legacy** — they describe the v1 type-family rule-set selection idiom and do not describe the v2 composed obligation set. The field survives; its value grammar has changed. |
| `tags` | array | Searchable tags for cross-referencing |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `output_files` | array | List of output file names in the session directory |
| `predecessor_audits` | array | Prior audits on the same question (chain of inquiry) |
| `migrated_from` | string | Original path before migration (only for migrated artifacts) |
| `migrated_date` | YYYY-MM-DD | Date of migration (only for migrated artifacts) |
| `audit_type` | enum | **Legacy (v1 compatibility).** Retained for backward compatibility with pre-57.4 artifacts. Migration rule: maps to `audit_subject` with `audit_orientation: standard` and `audit_delegation: self` as defaults. New audits SHOULD populate the three v2 axis fields (`audit_subject`, `audit_orientation`, `audit_delegation`); they MAY also populate `audit_type` for compatibility with any tooling or reader that still expects it. |

### Field count rationale

Total: **5 required** (`date`, `audit_subject`, `audit_orientation`, `audit_delegation`, `scope`) + **5 recommended** + **5 optional** (including the legacy `audit_type` row) = **15 fields**. [stipulated:reasoned] The signal KB schema has ~15 total fields (most optional). This phase ships at the signal KB schema budget. **Any further frontmatter additions require deliberation** (Pitfall 6 from Phase 57.4 RESEARCH.md: backward-compat frontmatter budget drift). If a future migration removes the legacy `audit_type` field, the count drops back to 14 and headroom returns; until then, no new fields without explicit review.

### Example: minimal (v2, standard orientation)

```yaml
---
date: 2026-04-08
audit_subject: phase_verification
audit_orientation: standard
audit_delegation: self
scope: "Phase 57.4 plan 01 — rewrite audit-conventions.md for 3-axis taxonomy"
---
```

### Example: full session (composed obligations, investigatory × process_review)

```yaml
---
date: 2026-04-09
audit_subject: process_review
audit_orientation: investigatory
audit_delegation: self
auditor_model: claude-sonnet-4-6
scope: "Why do our discuss-phase outputs keep treating superseded docs as authoritative?"
triggered_by: "signal: sig-2026-04-10-discuss-phase-authority-weighting-gap"
task_spec: authority-weighting-investigation-task-spec.md
ground_rules: core+investigatory+process_review
predecessor_audits:
  - 2026-04-09-discuss-phase-exploration-quality/rigorous-comparative-audit.md
output_files:
  - authority-weighting-investigation.md
tags: [discuss-phase, authority-weighting, investigatory, process_review]
---
```

### Example: migrated artifact (v1 legacy field coexists with v2 axis fields)

```yaml
---
date: 2026-04-08
audit_subject: requirements_review
audit_orientation: standard
audit_delegation: cross_model:gpt-5.4
audit_type: requirements_review  # legacy v1 field, retained for backward compat
auditor_model: gpt-5.4
scope: "v1.20 requirements coverage, feasibility, tensions"
triggered_by: "manual: pre-milestone review"
ground_rules: core+standard+requirements_review
migrated_from: .planning/audits/v1.20-requirements-review.md
migrated_date: 2026-04-XX
tags: [requirements, v1.20, review, migrated]
---
```

---

## 3. Audit Taxonomy: Three Orthogonal Axes

The v1 flat eight-type taxonomy — inherited from `signal_type`'s enum-with-escape-hatch pattern — conflated three orthogonal concerns under a single `audit_type` enum: *what* is being audited, *from what stance*, and *who does it*. The deliberation `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` traced the conflation: `cross_model_review` was always a way of *delegating* an audit, not a kind of audit; `exploratory` was always a *stance* an auditor could take toward any subject, not a separate category alongside structural and epistemic subjects. Holding them in one enum meant any real audit that mixed subject and stance and delegation had to force itself into a category that could only name one of the three. Templates compounded the error — they cannot compose across axes, so two demands from two dimensions had no way to meet in the same body.

The reconstructive response is to decompose the single enum into three orthogonal axes — subject × orientation × delegation — and to replace templates with *obligations* that compose across the axes. A real audit situation presents a subject (or doesn't — see below), an orientation, and a delegation choice. The obligations attached to each axis compose into a flat list that the auditor addresses. This is hermeneutic composition, not algorithmic rule selection: where obligations tension, the auditor names the tension and navigates it, rather than resolving it by precedence.

**Subject is optional for `investigatory` and `exploratory` orientations.** When Phase 57 started as an investigation into "the implementation doesn't match the vision," there was no subject yet — the investigation had to discover what it was investigating. The deliberation's Phase 57 case (concrete example 4, lines 197–210) names this as the load-bearing reason to let subject be omitted: forcing a subject at dispatch time pre-decides what the investigation is allowed to find.

**The axes themselves are provisional.** Per DC-5 and G-6 from the phase CONTEXT.md, and per `.planning/deliberations/forms-excess-and-framework-becoming.md` as governing authority, the escape-hatch principle is extended from individual values to the decomposition itself. A fourth axis may be needed if practice reveals that the aporetic character of audit situations exceeds subject × orientation × delegation. The 3-axis model is an act of responsible positing that explicitly names itself as rewritable. Forms-excess names the pattern: "a formal system encounters something that exceeds its categories, and the system's response to the excess reveals something about the system itself" — and the 3-axis model is itself a formal system subject to this.

### Axis 1 — Subject (what are you auditing?)

Source: `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` lines 49–82.

| Subject | Family | What it examines |
|---|---|---|
| `phase_verification` | structural | Did the phase achieve its stated goal? |
| `milestone` | structural | Cross-phase integration and E2E flows |
| `codebase_forensics` | structural | Code structure and wiring |
| `requirements_review` | epistemic | Coverage, feasibility, tensions |
| `comparative_quality` | epistemic | Quality comparison across outputs |
| `claim_integrity` | epistemic | Typed claim verification |
| `adoption_compliance` | compliance | Practice matches documented intent |
| `process_review` | *new* | How well a process/workflow performed; methodology soundness |
| `artifact_analysis` | *new* | Patterns in a corpus of artifacts |

`process_review` and `artifact_analysis` are **new subjects** discovered by testing the decomposition against real audit sessions in `.planning/deliberations/audit-taxonomy-retrospective-analysis.md`. They did not exist in the v1 taxonomy because the template paradigm had no room for them — meta-audits of processes and corpus-pattern audits were being forced into `exploratory` as the escape hatch. Giving them names makes the obligations attached to them addressable.

`cross_model_review` has **exited the subject enum entirely**. It was never a kind of audit; it was always a way of *doing* an audit. The user's observation names it exactly: "cross_model_review doesn't seem like a type, that's more of a delegation." It now lives on Axis 3 as `audit_delegation: cross_model`. Any subject can be delegated across models; delegation is orthogonal to what is being audited.

The `Family` column (structural / epistemic / compliance) is retained as a historical label attached to each subject, not as an authoritative typology. The v1 families were an interpretive clustering, not an empirically grounded partition, and the new subjects do not fit them. Treat the column as a convenience for readers familiar with the v1 taxonomy, not as a constraint on how subjects compose.

**Each subject carries an epistemic profile** — a structured acknowledgment that every subject is oriented toward something, assumes something, and might miss something. The profile is what the orchestrator (and the auditor, and the reader of the audit output) consults when matching a situation to a subject, or when asking Rule 5's frame-reflexivity question at the close: *what would a differently-typed audit have looked for that this one didn't?*

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

The profile table is not decoration. The `might miss` column is the substance: it names what the subject's own framing hides from view, which is what Rule 5 (frame-reflexivity) and the framework-invisibility obligation press auditors to notice. A subject is a partial view of its situation; naming the partiality is how the audit stays honest to it.

**Subject is optional for `investigatory` and `exploratory` orientations.** When the orientation is investigatory or exploratory, the subject field may be omitted — the investigation discovers its subject, or the exploration has no predetermined target. Under `standard` orientation, a subject is required.

### Axis 2 — Orientation (from what stance?)

Source: `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` lines 83–92.

| Orientation | When | Key characteristic |
|---|---|---|
| `standard` (default) | You know what you're checking | Close on findings |
| `investigatory` | Something went wrong; you don't know what yet | Hold diagnosis open, competing explanations |
| `exploratory` | A question beckons; open-ended | Follow the question, don't force closure |

Orientation is orthogonal to subject: any orientation can run against any subject (or, for investigatory and exploratory, against no subject at all). A `phase_verification × standard` audit closes on verdict; a `phase_verification × investigatory` audit holds the verdict open and surfaces competing explanations for whatever it finds. Same subject, different stance — the obligations composing into each audit differ because the orientation brings its own demands.

**Investigatory and exploratory differ by occasion, not ontology.** Per CONTEXT.md G-5, the distinction is hermeneutic: `investigatory` is occasioned by *breakdown* — expectations were violated, something went wrong, diagnosis is needed. `exploratory` is occasioned by *possibility* — a question opens, curiosity beckons, no discrepancy is driving the work. Both orientations are hermeneutically circular; both hold findings loosely; both refuse forced closure. Their body structures differ because they start from different places: a discrepancy on one side, a question on the other.

The relationship between investigatory and exploratory is **deliberately left as a design choice, not ontologically settled** (G-5). They may merge, stay distinct, or evolve differently as practice reveals which grain the distinction is really cutting at. The framework does not foreclose the evolution.

### Axis 3 — Delegation (who does it?)

Source: `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` lines 93–100.

| Delegation | What it means |
|---|---|
| `self` (default) | Local `gsdr-auditor` agent dispatched via `Task()` |
| `cross_model:{model_id}` | Dispatch to another model's CLI (e.g., `cross_model:gpt-5.4`, `cross_model:gemini`) |

Delegation is orthogonal to both subject and orientation. Any subject can be audited under any orientation by any delegation mode — the orchestrator composes obligations from Axes 1 and 2 and hands the composed task spec to either the local agent or an external model invocation.

**Cross-model delegation is currently fragile.** Per the deliberation (line 100), cross-model dispatch has shown "environment setup issues, agents finishing early, instructions not properly conveyed, lots of hand-holding." Recording this factually here is not a disclaimer — it is relevant context for orchestrators and auditors reading this reference. The retrospective's dispatch-hygiene obligation (new in v2, documented in `audit-ground-rules.md`) is the direct response: cross-model prompts must be audited for framing contamination before dispatch, and confounds must be declared in the audit frontmatter.

### 3.4 The escape hatch — preserved and extended

The v1 taxonomy had an escape hatch at the value level: `audit_type: exploratory` was the legitimate way to file an audit that did not match any named type. The v2 taxonomy preserves escape at the value level but extends it to the axes themselves.

**At the value level.** A subject may be **omitted** under `investigatory` or `exploratory` orientation when no named subject from Axis 1 fits the situation. This is cleaner than the v1 convention of routing unclassified audits through `audit_type: exploratory`, because in v2 `exploratory` is primarily an orientation — the honest way to express "I don't yet know what I'm auditing, I just know I'm opening a question" is to set orientation to `exploratory` and leave `audit_subject` unset. The deliberation's concrete example 3 (`"Something about the way we handle phases feels off but I can't say what"` → no subject × exploratory × self) names this exact shape.

**At the axis level.** Per DC-5 from the phase CONTEXT.md, the escape-hatch principle is now extended from taxonomy values to the axis decomposition itself. The 3-axis model is a working hypothesis validated against 13 audit sessions in the retrospective, but it is not claimed as exhaustive. A fourth axis may be needed if the aporetic character of audit situations outruns subject × orientation × delegation — recurring use of field-mismatch workarounds, repeated "none of these fit" observations in audit outputs, or patterns the excess section (see Section 4.2) keeps surfacing are the kinds of signals that would argue for it.

Governing authority for this openness is `.planning/deliberations/forms-excess-and-framework-becoming.md`: *"a formal system encounters something that exceeds its categories, and the system's response to the excess reveals something about the system itself."* The 3-axis model is a formal system. It encounters audit situations that exceed it. How the system responds — whether it suppresses the excess, forces it into an existing axis, or opens a new axis — reveals something about the system. The escape hatch is the structural opening where that response is meant to occur.

---

## 4. Output Paradigm: Obligations and Templates

The v1 output paradigm attached a body template to each audit type. Templates work well for routine, close-ended audits where consistency and scannability matter more than flexibility — but they cannot compose across axes, and the retrospective analysis of the discuss-phase audit chain showed that the audits most at risk of producing wrong or misleading findings were exactly the ones the templates couldn't hold: investigations, explorations, cross-cutting audits that mix subjects and stances. The v2 paradigm keeps templates where they earn their keep and replaces them with composable **obligations** where they don't.

### 4.1 Two populations

`.planning/deliberations/audit-taxonomy-retrospective-analysis.md` identified three populations of audits in the 13-session corpus it analyzed. Two of them produce artifacts addressed at this reference-file level; the third (multi-agent parallel dispatch, "Population 3") is deferred per CONTEXT.md Q3 and is not treated here.

**Population 1 — Standard routine audits.** A known subject, a known comparison point, and an expectation of closure. `phase_verification × standard × self` is the paradigm case: the phase has a stated goal, the audit checks whether the goal was met, and the output reports a verdict. Templates remain as *suggested scaffolding* for these audits because consistency across many instances matters — readers of VERIFICATION.md and MILESTONE-AUDIT.md expect to find the same sections in the same order, and auditors benefit from a starting shape that the audit's question can depart from when it needs to. The canonical examples are phase VERIFICATION.md files and milestone MILESTONE-AUDIT.md files produced by the `verify-phase` and `audit-milestone` workflows.

**Population 2 — Investigatory, exploratory, and complex audits.** A subject that may not be known at dispatch time; an orientation that refuses premature closure; or obligations from multiple axes that the auditor must navigate. Templates fail here for a structural reason: two templates cannot merge, so an audit that inherits demands from both an investigatory orientation and a `process_review` subject has no way for the template paradigm to represent the compound demand. **Obligations replace templates** for this population because obligations compose — two obligation sets from two axes flatten into one list, and the composition principle (see `audit-ground-rules.md`) governs how the auditor navigates tensions between them. The deliberation's 8 concrete examples (`.planning/deliberations/audit-taxonomy-three-axis-obligations.md` lines 197–265) show what composition looks like in practice across exploratory, investigatory, and cross-cutting combinations.

The complexity assessment — whether a given audit is template territory or obligations territory — is performed at dispatch time by the orchestrator (the `/gsdr:audit` command, Plan 03), not here. This reference file describes the paradigm; the command chooses for each situation. The populations are a descriptive framing, not a dispatch gate: an audit that starts as Population 1 may accumulate obligations mid-flight and shift into Population 2 (the deliberation's example 11, `codebase_forensics × starts standard, may shift to investigatory`, is the shape of this), and the orchestrator composes accordingly rather than enforcing a rigid partition.

### 4.2 Obligations vs. templates — the difference that matters

The distinction between obligations and templates is hermeneutic, not mechanical. Per `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` lines 111–125:

- **Templates say:** "Write a *Competing Explanations* section." The auditor fills the section. Whatever counts as competing explanations lives inside a named container, and the container's presence is how the output signals that the obligation was honored.
- **Obligations say:** "You must present competing explanations." The auditor weaves competing explanations into the narrative wherever they emerge naturally. There is no section heading to fill; there is a demand that the output must answer, and the output honors it by making competing explanations visible in whatever shape the audit's reasoning takes.

Task specs written under the obligations paradigm say *"address these obligations"* — not *"fill these sections."* The shift is not cosmetic. It is the shift that lets obligations compose across axes: section headings from two templates cannot be merged without collision, but demand from two obligation sets can be held simultaneously as the auditor writes. It is also the shift that prevents compliance theater at the structural level — an auditor cannot satisfy an obligation by writing a section heading and leaving it empty, because the obligation lives in the content, not in the table of contents.

**"What the Obligations Didn't Capture" is a mandatory named section in every audit output**, under both the template paradigm and the obligations paradigm (deliberation lines 174–176). It is the structural opening for excess: the auditor records findings that do not fit any obligation, any template, any expected shape. If this section is consistently substantial for a particular kind of audit, that is empirical evidence for a new subject type, a new orientation obligation, or a missing axis entirely — the excess section feeds back into taxonomy revision. It is the mechanism by which the framework stays open to what exceeds its current decomposition.

### 4.3 Suggested scaffolding for standard-orientation audits

Subject-specific scaffolds are retained as **optional suggestions** for `standard`-orientation audits only. The v1 type-family templates survive as starting shapes for the subjects they were originally attached to, not as mandated structure. Investigatory and exploratory orientations compose obligations instead — not because the old shapes are wrong, but because a composed obligation set cannot fit inside a pre-fixed template without losing its compositional character.

**Before each scaffold below, the same caveat applies:** these are suggested structures for `standard`-orientation audits only. `investigatory` and `exploratory` orientations use obligations, not templates. If the audit accumulates obligations from non-standard orientation or from multi-subject composition, treat the scaffold as a starting shape you are free to depart from — and address the composed obligations from `audit-ground-rules.md` directly.

#### Scaffold A — for `phase_verification`, `milestone`, `codebase_forensics` under standard orientation

```markdown
## Goal and Scope

[What is being verified and why]

## Artifacts Checked

[List of files, modules, or systems inspected]

## Wiring Verification

[Import chains, route registrations, config connections traced]

## Findings

| File | Line | Issue | Severity |
|------|------|-------|----------|
| ... | ... | ... | ... |

## Gaps Summary

[Missing artifacts, broken connections, unverified claims]

## What the Obligations Didn't Capture

[Findings that don't fit any obligation. Mandatory section.]
```

#### Scaffold B — for `requirements_review`, `comparative_quality`, `claim_integrity` under standard orientation

```markdown
## Question Being Investigated

[The specific epistemic question this audit addresses]

## Methodology

[How the investigation was conducted: files read, comparisons made, criteria applied]

## Evidence Examined

[Specific artifacts with file:line citations and quoted passages]

## Findings

[Each finding with:]
1. What was found (with citation)
2. What this means (interpretation, separated from evidence)
3. What would disconfirm this interpretation (and whether it was checked)

## Limitations of This Audit

[What this audit could not see, what was outside its scope, what assumptions it made]

## What the Obligations Didn't Capture

[Findings that don't fit any obligation. Mandatory section.]
```

Note: the v1 epistemic scaffold included `cross_model_review` as a subject row. Under v2, cross-model is a *delegation mode* — any subject can be run under `cross_model` delegation. When `requirements_review × standard × cross_model` runs, it uses the scaffold above; the cross-model nature of the dispatch is recorded in the frontmatter's `audit_delegation` field and in the dispatch-hygiene obligations that cross-model audits inherit from `audit-ground-rules.md`.

#### Scaffold C — for `adoption_compliance` under standard orientation

```markdown
## Standard Being Checked

[The convention, specification, or practice being verified]

## Projects and Files Surveyed

[Scope of the compliance check]

## Compliance Matrix

| Item | Expected | Actual | Status |
|------|----------|--------|--------|
| ... | ... | ... | PASS/FAIL/PARTIAL |

## Deviations With Context

[Each deviation explained -- why it exists, whether it is intentional, what the impact is]

## Recommendations

[Suggested actions, prioritized by impact]

## What the Obligations Didn't Capture

[Findings that don't fit any obligation. Mandatory section.]
```

#### Scaffolds for `process_review` and `artifact_analysis`

Deliberately left unspecified. These subjects are new in v2, discovered by the retrospective's analysis of audit sessions that had been forced through v1 templates. Until real `process_review` and `artifact_analysis` audits run under v2, any scaffold invented here would be speculation. Per Claude's Discretion in CONTEXT.md: **scaffolds will emerge from practice.** For now, auditors running these subjects under standard orientation compose obligations from `audit-ground-rules.md` and write whatever shape the situation demands — the "What the Obligations Didn't Capture" section remains mandatory.

(The v1 exploratory body template has been absorbed into the `exploratory` orientation obligations; see `audit-ground-rules.md` — rewritten by Phase 57.4 Plan 02. `exploratory` is now an orientation, not a subject type, so its output shape is governed by the orientation obligations rather than by a template.)

### 4.4 Obligation sets live in `audit-ground-rules.md`

This reference describes *that* obligations compose. It does not describe *how*, nor does it reproduce the obligation text. The canonical home for the obligation sets and the composition principle is `get-shit-done/references/audit-ground-rules.md` (rewritten by Phase 57.4 Plan 02 in parallel with this rewrite). That file carries:

- **Core obligations** — the five rules every audit inherits (citation, disconfirmation, measure-vs-captured, escape hatch, and frame-reflexivity).
- **Orientation obligations** — standard closes-on-findings; investigatory I1–I4 (hold diagnosis open, let the investigation guide artifact selection, present competing explanations, name the position of the investigation); exploratory follow-the-question.
- **Subject obligations** — the 9-row table attaching obligations to each subject from Axis 1.
- **Cross-cutting obligations** — chain integrity (for any audit that depends on a predecessor), dispatch hygiene (for any `cross_model` delegation), framework invisibility (for any audit that can carry the reflexive weight).
- **The composition principle** — how the auditor navigates tensions between obligations from different axes, and why the navigation is hermeneutic rather than algorithmic.

When a task spec is written for a Population-2 audit, the orchestrator composes the obligation sets from the three axes and the cross-cutting rules into a flat list and copies the full text into the task spec. The auditor addresses the list. This reference file is where the reader learns that this is the shape of things; `audit-ground-rules.md` is where the actual obligations live.

---

## 5. Three-Layer Model

The audit infrastructure uses three layers with decreasing strictness:

### Layer 1: Shared frontmatter (strict)

Required for ALL audit artifacts. The YAML frontmatter schema defined in Section 2. This layer ensures all audits are findable, searchable, and comparable regardless of type. Non-negotiable.

### Layer 2: Obligations (non-standard) and suggested scaffolds (standard) — structured but provisional

Composed obligations for `investigatory`, `exploratory`, and multi-axis audits (Section 4.1–4.2); suggested body scaffolds for `standard`-orientation audits on the 7 v1 subjects that have scaffolds (Section 4.3). The obligations live in `audit-ground-rules.md` and compose across axes; the scaffolds are starting shapes the audit's question can depart from. Both are guides that capture what has worked, not rules that prescribe what must be. Provisional -- they will evolve as practice reveals better structures, and the "What the Obligations Didn't Capture" section in every audit output feeds the evolution.

### Layer 3: Escape hatch (open)

`audit_orientation: exploratory` (optionally with `audit_subject` omitted) + freeform body for audits that don't match any named subject or don't yet know what they're auditing. This layer exists because the taxonomy is provisional and the world of possible audits exceeds any fixed classification. [stipulated:bare] Per the CONTEXT.md stipulated constraint: shared metadata (strict) + obligations/scaffolds (structured but provisional) + escape hatch (for situations the current decomposition doesn't hold). Per DC-5, the escape hatch now extends to the axes themselves — not only to subject values (see Section 3.4).

Recurring use of Layer 3 reveals new subjects to formalize into Layer 2, and — in the extended form — may eventually reveal a missing axis. The system learns from its own excess.

---

## 6. Relationship to Other Audit Locations

Not all audit artifacts live in `.planning/audits/`. This convention covers standalone audits; other audit-like artifacts have established homes.

| Location | What Lives There | Convention |
|----------|-----------------|------------|
| `.planning/audits/` | Standalone audits (this convention) | Date-first naming, YAML frontmatter, type taxonomy |
| Phase directories (`VERIFICATION.md`) | Workflow-produced phase verification | Produced by `verify-phase` workflow; 63+ existing instances |
| `.planning/milestones/` (`MILESTONE-AUDIT.md`) | Workflow-produced milestone audits | Produced by `audit-milestone` workflow; 7+ existing instances |

[assumed:reasoned] Workflow-produced audits (VERIFICATION.md, MILESTONE-AUDIT.md) remain in their current locations. They are established artifacts with well-known paths. The `.planning/audits/` directory is for standalone audits not produced by standard phase/milestone workflows.

**Future integration points:**
- The `audit-milestone` workflow may adopt the frontmatter schema from Section 2 (first integration candidate)
- A cross-reference index spanning all audit locations can be built if "search all audits" becomes a real need
- Neither integration requires moving existing files

---

*Reference version: 1.0.0*
*Created: 2026-04-09*
*Design authority: Phase 57.3 (audit-workflow-infrastructure)*
*Depends on: `agents/knowledge-store.md` for schema design patterns, `get-shit-done/references/audit-ground-rules.md` for ground rule set references*
