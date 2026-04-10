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

| Field | Type | Description |
|-------|------|-------------|
| `date` | YYYY-MM-DD | Date the audit was conducted (NOT the migration date) |
| `audit_type` | enum | See type taxonomy in Section 3 |
| `scope` | string | What was audited -- concise description of the target |

### Recommended fields

| Field | Type | Description |
|-------|------|-------------|
| `auditor_model` | string | Model identifier (e.g., `claude-sonnet-4-6`, `gpt-5.4`) |
| `triggered_by` | string | What launched this audit (e.g., `deliberation: X`, `manual: user request`, `workflow: audit-milestone`) |
| `task_spec` | string | Relative path to the task spec file within the session directory |
| `ground_rules` | string | Which ground rule set was applied: `core`, `core+structural`, `core+epistemic`, `core+compliance`, `core+custom`, or `none` (for pre-infrastructure audits) |
| `tags` | array | Searchable tags for cross-referencing |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `output_files` | array | List of output file names in the session directory |
| `predecessor_audits` | array | Prior audits on the same question (chain of inquiry) |
| `migrated_from` | string | Original path before migration (only for migrated artifacts) |
| `migrated_date` | YYYY-MM-DD | Date of migration (only for migrated artifacts) |

### Field count rationale

Total: 3 required + 5 recommended + 4 optional = 12 fields. [stipulated:reasoned] The signal KB schema has ~15 total fields (most optional). Keeping audit frontmatter to ~12 avoids over-formalization (Pitfall 1 from RESEARCH.md: "if frontmatter has more fields than the signal KB schema, something is wrong").

### Example: minimal

```yaml
---
date: 2026-04-08
audit_type: cross_model_review
scope: "GSD harness drift analysis -- installer, capability-matrix, cross-runtime parity"
---
```

### Example: full session

```yaml
---
date: 2026-04-09
audit_type: comparative_quality
auditor_model: claude-sonnet-4-6
scope: "CONTEXT.md quality regression: rich era (52-54) vs thin era (55-57)"
triggered_by: "deliberation: exploratory-discuss-phase-quality-regression.md"
task_spec: rigorous-comparative-audit-task-spec.md
ground_rules: core+custom
predecessor_audits:
  - exploration-quality-audit.md
  - outcome-comparison-audit.md
  - audit-review-and-deepening.md
output_files:
  - rigorous-comparative-audit.md
tags: [discuss-phase, context-quality, epistemic-rigor, comparative]
---
```

### Example: migrated artifact

```yaml
---
date: 2026-04-08
audit_type: requirements_review
auditor_model: gpt-5.4
scope: "v1.20 requirements coverage, feasibility, tensions"
triggered_by: "manual: pre-milestone review"
ground_rules: none
migrated_from: .planning/audits/v1.20-requirements-review.md
migrated_date: 2026-04-XX
tags: [requirements, v1.20, review]
---
```

---

## 3. Audit Type Taxonomy

Enum with escape hatch, matching the `signal_type` pattern from `knowledge-store.md`. [evidenced:cited] In 216 signals, the `custom` escape hatch was used 4 times (1.9%) -- all for genuinely novel observations, not as a dumping ground. This validates the enum-with-escape-hatch pattern.

| Type | Family | Description |
|------|--------|-------------|
| `phase_verification` | structural | Checking code exists and works |
| `milestone` | structural | Cross-phase integration |
| `codebase_forensics` | structural | Structural understanding of codebase |
| `cross_model_review` | epistemic | External perspective from different model |
| `requirements_review` | epistemic | Coverage, feasibility, tensions |
| `comparative_quality` | epistemic | Investigating a specific quality question |
| `claim_integrity` | epistemic | Typed claim verification |
| `adoption_compliance` | compliance | How X is used across projects |
| `exploratory` | (escape hatch) | Does not match any existing type |

[governing:reasoned] This taxonomy is provisional and empirically derived from ~10 projects over ~2 months of practice. New types WILL emerge. Recurring use of `exploratory` signals a new type to formalize. Per constraint G-1 from CONTEXT.md: "Do not treat the 8-type taxonomy as exhaustive or final."

### Family groupings

The 8 named types cluster into 3 families by what they verify:

- **Structural:** Does X exist and wire correctly? (`phase_verification`, `milestone`, `codebase_forensics`)
- **Epistemic:** Are claims warranted and traceable? (`cross_model_review`, `requirements_review`, `comparative_quality`, `claim_integrity`)
- **Compliance:** Does practice match intent? (`adoption_compliance`)

[assumed:reasoned] These families are interpretive, not observed. The clustering suggests different ground-rule emphasis (see `audit-ground-rules.md` Section 3) but may need revision as new types emerge.

### The escape hatch

`audit_type: exploratory` is the legitimate way to create an audit that does not match any existing type. These audits are first-class citizens:

- They use the same frontmatter schema (date, scope, and all other fields)
- They use the core ground rules from `audit-ground-rules.md`
- Their body format is freeform (see Section 4, Exploratory template)
- If a particular `exploratory` pattern recurs, it should be formalized as a new named type

---

## 4. Type-Aware Body Templates

Suggested (not required) body structures for each audit family. The frontmatter is the strict layer; the body is the flexible layer. If the audit demands a different structure, use a different structure.

### 4.1 Structural audits

**Applies to:** `phase_verification`, `milestone`, `codebase_forensics`

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
```

### 4.2 Epistemic audits

**Applies to:** `cross_model_review`, `requirements_review`, `comparative_quality`, `claim_integrity`

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
```

### 4.3 Compliance audits

**Applies to:** `adoption_compliance`

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
```

### 4.4 Exploratory audits

**Applies to:** `exploratory` (the escape hatch type)

```markdown
## Question or Motivation

[Why this audit exists -- what prompted it]

## What Was Examined

[Artifacts, code, signals, or other evidence reviewed]

## What Was Found

[Observations, with citations where possible]

## What This Might Mean

[Tentative interpretation -- clearly marked as provisional]

## What Follow-Up Is Needed

[Whether this should become a formalized audit type, what further investigation would clarify]
```

### Body template design note

These templates are guides, not straitjackets. The escape hatch for body format is simply: write whatever the audit demands. A structural audit that discovers an epistemic issue should include epistemic-style analysis. A compliance audit that uncovers a structural gap should trace the wiring. The templates provide starting structure; the audit's question determines the final shape.

---

## 5. Three-Layer Model

The audit infrastructure uses three layers with decreasing strictness:

### Layer 1: Shared frontmatter (strict)

Required for ALL audit artifacts. The YAML frontmatter schema defined in Section 2. This layer ensures all audits are findable, searchable, and comparable regardless of type. Non-negotiable.

### Layer 2: Type-aware body templates (structured but provisional)

Suggested body structures per audit family (Section 4). These templates encode the epistemic practices appropriate to each family. They are guides that capture what has worked, not rules that prescribe what must be. Provisional -- they will evolve as practice reveals better structures.

### Layer 3: Escape hatch (open)

`audit_type: exploratory` + freeform body for audits that don't match any existing type. This layer exists because the taxonomy is provisional and the world of possible audits exceeds any fixed classification. [stipulated:bare] Per the CONTEXT.md stipulated constraint: shared metadata (strict) + type-aware body templates (structured but provisional) + escape hatch (for types that don't exist yet).

Recurring use of Layer 3 reveals new types to formalize into Layer 2. The system learns from its own excess.

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
