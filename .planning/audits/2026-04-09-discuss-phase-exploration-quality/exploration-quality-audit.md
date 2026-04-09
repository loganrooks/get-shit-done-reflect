## Comparative Quality Audit: /gsdr:discuss-phase Exploratory Mode

**Date:** 2026-04-09
**Agent:** claude-sonnet-4-6 (Explore agent)
**Triggered by:** User observation during Phase 57 discuss-phase --auto

---

## 1. CONTEXT.md Comparison Table

| Phase | Lines | Open Qs | Guardrails | Working Assumptions | Derived Constraints | [grounded] | [open] | Mode | Sections |
|-------|-------|---------|-----------|---------------------|---------------------|-----------|-------|------|----------|
| 04 Reflection Engine | 145 | 0 | 0 | 0 | 0 | 0 | 0 | Interactive (pre-schema) | domain, decisions, specifics, deferred |
| 13 Path Abstraction | 112 | 0 | 0 | 0 | 0 | 0 | 0 | Interactive (pre-schema) | domain, decisions, specifics, deferred, open Qs (table) |
| 31 Signal Schema | 161 | 0 | 0 | 0 | 0 | 0 | 0 | Interactive (pre-schema) | domain, decisions, specifics, deferred |
| 38 Sensor Architecture | 76 | 0 | 0 | 0 | 0 | 0 | 0 | Interactive (pre-schema) | domain, decisions, specifics, deferred, open Qs (table) |
| 48.1 Drift Retriage | 282 | 5 | 0 | 0 | 0 | 0 | 0 | Interactive (pre-wholesale) | domain, **assumptions**, decisions, **constraints**, **questions (typed)**, **guardrails**, specifics, deferred |
| **52 Feature Adoption** | **173** | **5** | **4** | **5** | **7** | **0** | **0** | **Interactive (pre-three-mode)** | domain, assumptions, decisions, **constraints (7)**, **questions (typed+rich)**, **guardrails (4)**, specifics, deferred |
| **53 Deep Integration** | **178** | **5** | **5** | **6** | **7** | **0** | **0** | **Interactive (pre-three-mode)** | domain, assumptions, decisions, constraints, questions, guardrails, specifics, deferred |
| **54 Sync Retrospective** | **260** | **9** | **9** | 0 | 0 | **0** | **0** | **Interactive (post-wholesale, pre-three-mode)** | domain, **assumptions**, decisions, **constraints**, **questions (9, deeply typed)**, **guardrails (9)**, specifics, deferred |
| 55 Upstream Mini-Sync | 102 | 0 | 0 | 0 | 0 | 5 | 2 | --auto exploratory | domain, decisions, specifics, deferred, open Qs (table) |
| 55.2 Codex Runtime | 110 | 0 | 0 | 0 | 0 | 14 | 0 | --auto exploratory | domain, decisions, specifics, deferred, open Qs (table) |
| 56 KB Schema/SQLite | 128 | 0 | 0 | 0 | 0 | 5 | 0 | --auto exploratory | domain, decisions (labeled "Working Assumptions"), canonical_refs, specifics, deferred, open Qs (table) |
| 57 Measurement Baseline | 107 | 0 | 0 | 0 | 0 | 19 | 2 | --auto exploratory | domain, decisions, specifics, deferred, open Qs (table) |

**Structural collapse summary:**
- Peak era (Phases 52-54): 6-9 structured sections, typed open questions with downstream decision annotations, 4-9 explicit guardrails, 5-7 working assumptions, 7+ derived constraints
- Current era (Phases 55-57): 4-5 sections, no guardrails section, no working assumptions section, no derived constraints section, open questions reduced to a flat table with 3-5 rows

---

## 2. Root Cause Analysis: Where the Regression Came From

### The critical timeline

- **March 26-28 (Phases 52-54):** Interactive discuss sessions produced the highest quality CONTEXT.md files in the project's history. These used a pre-three-mode workflow (408-line fork version after Phase 52's wholesale upstream replacement). The richness — assumptions, constraints, guardrails, typed questions — was produced by the interactive conversation itself, not by any template instruction.

- **April 2 (commit `e4ae09b0`):** Three-mode system introduced (`exploratory`/`discuss`/`assumptions`). This added the exploratory philosophy and `[grounded]`/`[open]` markers, but — critically — it did **not** update the `write_context` template to include `<assumptions>`, `<constraints>`, or `<guardrails>` sections.

- **April 8-9 (Phases 55, 55.2, 56, 57):** First phases run under the new three-mode system with `--auto`. The exploratory mode fires. `[grounded]` markers appear. But the missing template sections mean the output regresses to 4-5 sections.

### The structural gap in the current workflow

The `write_context` template in `get-shit-done/workflows/discuss-phase.md` (lines 906-1002) specifies exactly these sections:
- `<domain>` (Phase Boundary)
- `<decisions>` (Implementation Decisions)
- `<canonical_refs>` (Canonical References)
- `<code_context>` (Existing Code Insights)
- `<specifics>` (Specific Ideas)
- `<deferred>` (Deferred Ideas)

The template contains **zero** mention of:
- `<assumptions>` / Working Model & Assumptions
- `<constraints>` / Derived Constraints
- `<questions>` / Open Questions (the structured section)
- `<guardrails>` / Epistemic Guardrails

The open questions section in the current CONTEXT.md files is appended **outside** the template as an afterthought (`## Open Questions` at the bottom, after the `---` footer). It has no formal place in the template structure.

### The write_context step has no exploratory-mode branching

The `write_context` step is the same for both `discuss` mode and `exploratory` mode. The `<philosophy>` section says exploratory mode should produce "working assumptions" and "epistemic guardrails," but the output template where this would be written doesn't have sections for them. The exploratory mode modifiers apply during the discussion phase, but they don't pipe into distinct output sections at write time.

The result: the agent marks things `[grounded]` and `[open]` in its decisions, then dumps them all into `<decisions>` regardless. This treats exploratory mode as a tagging system within a single section, not as a different document structure.

---

## 3. GitHub Issue Intent vs Current Behavior Gap

**Issue #33 (closed, "first-class exploratory discuss mode")** defined exploratory mode as:
- "scout before asking"
- "preserve uncertainty deliberately"
- "`--auto` should bias toward open questions, working assumptions, and guardrails"
- distinct from "standard steering brief"

**Closing comment:** "Closed by reflect-v1.19.0 — exploratory mode is now the default discuss mode with synthesis-first purpose, context_model, synthesis_priority sections, and mode-aware auto behavior."

**What was actually delivered:** The workflow spec's exploratory mode (commit `e4ae09b0`) properly specified the discussion-phase behavior but did not specify that the output should have a different structure. The `context_model` section lists "Working Model & Assumptions," "Epistemic Guardrails," "Derived Constraints," and "Open Questions" as possible CONTEXT.md sections — but the `write_context` template doesn't include them.

**The gap:** Issue #33 described exploratory mode producing a different class of document. What shipped was exploratory mode producing the same document with different labels on some bullets. The issue's intent — preserve uncertainty as structured output, not just tagged text — was partially missed at the template level.

**Issue #26 (closed, "discuss-phase --auto semantics across runtimes")** contained the clearest statement of what was intended: the exploratory `--auto` should "open uncertainty up for research, bias toward open questions/assumptions/guardrails, avoid prematurely locking decisions." The closing comment confirms alignment. But the closing was based on the workflow spec being updated, not on CONTEXT.md output validation.

---

## 4. The "Grounded" Problem: What It Should Mean vs What It Does

### Current observed behavior

In Phase 57, there are 19 `[grounded]` claims and 2 `[open]`. Consider a sample:

- `[grounded] All 8 proposed metrics from research: tokens/session, token-to-commit ratio...` — Basis: "from research" (research section 3)
- `[grounded] Module follows lib/telemetry.cjs pattern with cmdTelemetry{Subcommand}(cwd, options, raw) signatures` — no basis cited
- `[grounded] Uses output() and error() from core.cjs, atomicWriteJson() for baseline file writes` — no basis cited
- `[grounded] Validation task (5-session comparison...) must complete before baseline.json committed` — Basis: "STATE.md blocker, Pitfall C3"

**The Pitfall C3 citation is particularly telling.** "Pitfall C3" does not appear in `57-RESEARCH.md`. The pitfalls in that research document are numbered 1-6, not coded as C1/M3/N2. These coded references appear to be invented shorthand that sounds like citation but is not traceable to any document in the planning directory. A researcher asked to verify "Pitfall C3" would find the 54-OUTSTANDING-CHANGES.md's C3 (worktree-aware planning resolution), not the token reliability concern.

### What "grounded" currently means in practice

Looking across the `[grounded]` claims in Phases 55-57:
- Some have explicit basis citations (good): "follows established gsd-tools convention," "live MCP servers configured and working," "drift survey verified"
- Many have no basis at all: a claim is labeled `[grounded]` by assertion
- A few have phantom citations (bad): coded references that don't resolve to actual documents

The workflow spec says `[grounded]` means "supported by codebase patterns, prior decisions, or established conventions." But the specification provides no verification requirement, no standard of evidence, and no challenge mechanism. The agent decides something is `[grounded]` and marks it so. There is no mechanism by which a downstream reader can ask "grounded according to what evidence?" without manually investigating.

### What "grounded" should require

A `[grounded]` claim should be traceable: it should cite a file + section, a prior decision's phase, a specific function/line, or a requirement ID. The current system allows the agent to use `[grounded]` as a confidence signal from its own inference, which is exactly what issue #33 was trying to prevent — premature closure without visible evidence chains.

The user's observation — "if I were to push on you and say, wait really how is this grounded?" — is correct. Many current `[grounded]` claims cannot survive challenge because their basis is unstated or phantom.

---

## 5. Phase 57 CONTEXT.md: Specific Critique

**What it does well:**
- The Open Questions table is good: 3 questions, each with criticality and status. The token reliability question is correctly marked "Critical, Blocked." The "hypothesis-generating, not this phase's job" disposition on the third question shows genuine epistemic positioning.
- The `[grounded]` tagging on implementation details is an improvement over unmarked decisions.
- The inline validation task is a legitimate preservation of uncertainty in the decisions themselves.
- The Deferred Ideas section is well-scoped and clearly distinguishes what's Phase 59/60 vs Phase 57.

**What it lacks:**
- **No working assumptions:** The key assumption — that session-meta token counts are unreliable (41% exact match, 40% off by >2x) — is mentioned in Specifics but not treated as a working assumption that research must test. This should be: "Working assumption: session-meta tokens are post-caching residuals and will require the inline validation task to determine actual baseline accuracy. If validation fails, the entire token-based portion of the baseline is provisional."
- **No derived constraints:** The document has no `<constraints>` section. The downstream dependency of Phase 58 on Phase 57's baseline is a critical constraint. The node:sqlite requirement is documented in decisions but should appear as a derived constraint with explicit impact on downstream work.
- **No epistemic guardrails:** With 41% facets coverage and potentially unreliable token counts, the baseline could be significantly misleading if interpreted naively. The Phase 54 CONTEXT had 9 guardrails. Phase 57 has zero. Someone using this baseline without knowing the caveats could draw wrong conclusions.
- **Phantom citations:** Pitfall C3, N2, M3 cited in Phase 57 do not resolve to any document in the planning directory. The research document's pitfalls are numbered 1-6. This looks like grounding but isn't.
- **Grey area foreclosure:** The question "which metrics are actually predictive of session quality?" is correctly marked low-criticality for Phase 57. But there's no exploration of whether the 8 proposed metrics were chosen for measurability or for predictive validity. The grounding for "All 8 proposed metrics from research" assumes the research doc's choice is authoritative, but the research doc's section 3 doesn't justify why these 8 vs others. This should be an `[open]` item with a note: "metric selection grounded in measurability; predictive validity is Phase 58+ concern."

**Grounded claim that wouldn't survive scrutiny:**
- `[grounded] Baseline reports facets coverage: "n=109 of 268 sessions have quality data"` — this is a specific expected output value. But 109/268 was the count at research time. The actual count could change before Phase 57 executes. Marking a point-in-time observation as `[grounded]` conflates "this was true during research" with "this is a fixed design constraint."

---

## 6. Was Phase 55 Sync the Regression Source?

**Not directly.** The structural weakness in the write_context template predates Phase 55. The template from the initial wholesale-replacement commit (`ef043680`, Phase 52) and the three-mode commit (`e4ae09b0`) are identical — both missing the fork-specific sections.

The real sequence:
1. Phase 52 wholesale-replaced the fork's discuss-phase with upstream's version (losing nothing because the pre-52 fork template also lacked these sections)
2. Phases 52-54 were interactive sessions where human-agent dialogue produced the rich sections organically
3. The three-mode commit added the exploratory philosophy but didn't retrofit the template
4. Phases 55+ ran `--auto` exploratory mode, which correctly applied the philosophy during discussion but wrote the same thin template

**The Phase 55 sync is not the culprit.** The culprit is the gap between the `<philosophy>` section (which correctly describes what exploratory mode should produce) and the `write_context` template (which doesn't have the output sections to receive those artifacts). This gap existed since the three-mode commit on April 2.

The pre-Phase-52 rich CONTEXT.md quality was **never encoded in the template** — it was a product of interactive sessions. When `--auto` mode became the primary path, the interactive richness disappeared because it was never systematized.

---

## 7. What the Exploratory Mode Should Be Doing Differently

### At the write_context step

The `write_context` template needs exploratory-mode branching. When `DISCUSS_MODE` is `exploratory`, the output template should include:

```
<assumptions>
## Working Model & Assumptions

[Each significant assumption with: statement, how it could be falsified, downstream impact]
- **A1:** [assumption] — *Validate by:* [what would confirm/deny this] — *Impact if wrong:* [consequence]
</assumptions>

<constraints>
## Derived Constraints

[Constraints derived from prior phases, requirements, or codebase reality — not user preferences]
- **DC-1:** [constraint] — *Source:* [where this comes from]
</constraints>

<questions>
## Open Questions

[Questions that could not be resolved and require research/planning to address]
| Question | Why It Matters | Downstream Decision | Reversibility | Criticality |
|----------|----------------|---------------------|---------------|-------------|
</questions>

<guardrails>
## Epistemic Guardrails

[Warnings about what must NOT be assumed, what must be verified before relying on this context]
- **G1:** [What must not be taken for granted, and why]
</guardrails>
```

### At the "grounded" standard

A `[grounded]` claim should require a traceable basis citation. The workflow should specify:
- `[grounded: file.md §N]` — codebase or document reference
- `[grounded: Phase N decision D-X]` — prior decision
- `[grounded: req REQ-ID]` — requirement
- `[grounded: convention pattern]` — named codebase convention

Bare `[grounded]` without a citation should be treated as `[open]` by downstream agents. The current system allows the agent to use `[grounded]` as self-certification.

### The "grounded" auto-select rule

The current rule: "only auto-select options tagged `[grounded]`." This is correct in principle but fails when the tagging itself is the agent's unverifiable assertion. The rule should be: "only auto-select options where the grounding citation can be verified against an artifact in the current repository or planning directory."

### Iterative grey area discovery

The peak-era CONTEXT.md files (52-54) exhibit something the current ones don't: typed open questions that lead to other questions. In Phase 54, Q2 ("guiding design philosophies") leads into Q2b ("feature convergence vs divergence") as a sub-question — grey areas generating more grey areas as the analysis deepens. In Phase 57, the 3 open questions are terminal: each is a standalone lookup, not a generator of further inquiry. The exploratory mode spec says "preserve genuine uncertainty" but doesn't model how uncertainty should propagate — an open question about token reliability should surface derivative questions about which metrics are affected and what the downstream interpretation policy should be.

---

## 8. Summary Assessment

**The user's concern is confirmed.** The exploratory discuss mode has a structural regression, not a philosophical one. The workflow spec's philosophy section is largely correct. The problem is that the `write_context` output template was never updated to include the sections that the exploratory philosophy requires:

- `<assumptions>` — missing from template, missing from recent CONTEXT.md files
- `<constraints>` — missing from template, missing from recent CONTEXT.md files
- `<guardrails>` — missing from template, absent from all post-three-mode CONTEXT.md files
- `<questions>` — present but as an afterthought outside the template, not structurally integrated

The `[grounded]` / `[open]` tagging system is a genuine improvement over the pre-three-mode approach, but it operates within the wrong output structure. The markers appear inside `<decisions>` when they should be distributed across a richer set of output sections.

**Recommended fix path:** Update the `write_context` step in `get-shit-done/workflows/discuss-phase.md` to provide an exploratory-mode-specific output template that includes the four missing sections, with grounding citation format requirements. The existing `<decisions>` section should remain for locked decisions, while working assumptions, derived constraints, open questions, and guardrails get their own structural homes. This is a template-level fix, not a philosophy-level fix.

**Key files:**
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/workflows/discuss-phase.md` (lines 886-1004, the `write_context` step — this is what needs updating)
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57-measurement-telemetry-baseline/57-CONTEXT.md` (current output — exhibits all described gaps)
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/52-feature-adoption/52-CONTEXT.md` and `53-deep-integration/53-CONTEXT.md` (reference implementation for peak quality)
