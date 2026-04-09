# Deliberation: Claim Type Ontology for CONTEXT.md

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation -> problematization -> hypothesis -> test -> warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open -> concluded -> adopted -> evaluated -> superseded
-->

**Date:** 2026-04-09
**Status:** Concluded (auto-deliberated)
**Trigger:** Phase 57.2 scoping requires a claim type ontology to replace bare [grounded]/[open] binary (DISC-02). Six exploratory audits across 12 projects and ~85 CONTEXT.md files produced empirical data about what kinds of epistemic work claims actually do. The ontology must serve both the discuss-phase (producing typed claims) and the researcher (knowing what to do with each type).
**Affects:** Phase 57.2 scope (DISC-02), discuss-phase.md template, gsdr-phase-researcher.md, references/claim-types.md (new), context-checker agent design
**Related:**
- `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` (concluded)
- `.planning/deliberations/pipeline-enrichment-step-architecture.md` (concluded, deferred)
- `.planning/audits/2026-04-09-exploratory-claim-audit.md` (this-repo, 106 claims, 8 groups)
- `.planning/audits/2026-04-09-claim-audit-batch-1.md` (arxiv + PDFAgential, 55 claims, 10 groups)
- `.planning/audits/2026-04-09-claim-audit-batch-2.md` (epistemic + robotic + f1, 24 files, 7 groups)
- `.planning/audits/2026-04-09-claim-audit-batch-3.md` (hermeneutic + claude-notify + zlibrary, 12 files, 8 groups)
- `.planning/audits/2026-04-09-claim-audit-batch-4.md` (scholardoc + tain + prix, 5 files, 7 groups)
- `.planning/audits/2026-04-09-context-claim-catalog.md` (predefined-category baseline, 64 claims)
- sig-2026-04-09-exploratory-mode-epistemic-quality-regression

## Situation

### The empirical base

Six independent audits examined CONTEXT.md files across 12 projects. The first audit (context-claim-catalog.md) used predefined categories and confirmed that [grounded]/[open] is insufficient. The five exploratory audits were instructed to let categories emerge from the data without predefined types. They discovered a total of 40 named groupings across the 5 audits. These groupings converge into 7-8 recurrent patterns, with important boundary cases and secondary dimensions.

### Cross-audit convergence

Categories that appeared independently in 3+ audits (strong empirical signal):

| Pattern | Audits where found | Description |
|---------|-------------------|-------------|
| **Traceable evidence claims** | this-repo (E), batch-1 (Groups 1,3), batch-2 (Group 4), batch-3 (Groups 1,3) | Claims with specific citations to artifacts, measurements, ADRs, or incidents. The key within-group distinction is whether the verification method is recorded. |
| **Invisible load-bearing assumptions** | this-repo (B), batch-1 (Groups 4,5), batch-3 (Groups 2,4), batch-4 (Group 1) | Claims doing heavy architectural work while appearing invisible/unmarked. The most dangerous epistemic state — identified as the #1 blind spot across all audits. |
| **Forward projections** | batch-1 (Group 6), batch-2 (Group 3), batch-4 (Group 2) | Phase N design justified by Phase N+1 needs that don't yet exist. Universal across projects. Implicit cross-phase contracts that break silently. |
| **Chosen thresholds / operational definitions** | this-repo (C), batch-1 (Group 9), batch-2 (Group 6) | Numbers that were picked, not derived from evidence. Look like facts but are choices. Fragile under different conditions. |
| **Scope/boundary claims** | this-repo (G), batch-2 (Group 2), batch-3 (Group 7), batch-4 (Group 3) | What's in/out of phase. Universal. Never evidence-derived. Defensive. |
| **Open/deferred questions** | this-repo (D,F), batch-1 (Group 2), batch-2 (Group 1), batch-4 (Group 4) | Named uncertainties with resolution conditions. The healthiest epistemic state. Varies from low-stakes to critical-path. |
| **Normative/governance/theory claims** | this-repo (H), batch-2 (Group 5), batch-3 (Group 8), batch-4 (Group 7) | Philosophy, values, process commitments. Categorically different from factual claims. |
| **Explicit decisions** | this-repo (A), batch-1 (Group 3 partially), batch-4 (DECIDED markers) | Things deliberately chosen through discussion with visible rationale. |

### Categories that appeared in fewer audits but are important

- **Self-aware temporal** (batch-3 only): Claims recording their own age. Rare but the only defense against staleness.
- **Self-correcting observations** (batch-1 only): Claims that actively correct prior docs. "The most epistemically productive" — 3 instances in 21 files.
- **Interpretive claims about prior work** (batch-2): Converting external findings into scope decisions. A distinct epistemic move.
- **Split claims** (cross-project catalog): One proposition with two separable epistemic statuses.
- **Retroactive documentation** (batch-1): CONTEXT.md written after plans — inverts the expected epistemic order.

### Key insight from the this-repo audit's honest assessment

> "A typing system can make the gaps visible, but it can't eliminate them — the underlying design choices have to be made, and making them explicit requires intentional discipline, not just a schema."

And:

> "The Group B (invisible assumed defaults) problem requires a specific intervention, not just a better schema. You can't type what you can't see."

This means the ontology has two jobs:
1. **Type visible claims** — give named categories to claims that appear in CONTEXT.md
2. **Enable the checker to surface invisible claims** — the checker's job is to find claims doing epistemic work without types and propose types for them

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| 6 audit files, ~85 CONTEXT.md files, 12 projects | 40 named groupings converging on 7-8 recurrent patterns | Yes — independent audits found the same patterns | informal |
| this-repo exploratory audit (106 claims) | 8 natural groups; 5 boundary cases; 4 marker misfits | Yes — individual claims read and analyzed | informal |
| batch-3 empirical-with/without-method distinction | Verification method recording is a secondary dimension cutting across all types | Yes — specific examples quoted with and without methods | informal |
| batch-4 "Assumption-as-Decision" as most common type | Unexamined assumptions are the dominant claim type in greenfield projects | Yes — found independently in 4 of 5 audits | informal |
| batch-1 "Self-Correcting Observations" (3 in 21 files) | Context-gathering occasionally functions as audit but not systematically | Yes — specific corrections identified and verified | informal |

## Framing

**Core question:** What claim type ontology should CONTEXT.md use to replace bare [grounded]/[open], given empirical evidence from 85 CONTEXT.md files across 12 projects about what epistemic work claims actually do — and given that this ontology must serve both the discuss-phase (producing typed claims), the context-checker (verifying them), and the researcher (knowing what to do with each type)?

**Design constraints:**
- Must be learnable: agents need to consistently assign the right type
- Must be actionable: the researcher must know what to DO differently for each type
- Must be auditable: the checker must be able to verify type assignments
- Must handle the invisible assumptions problem: not just a schema, but an intervention
- Will live in a shared reference doc (`references/claim-types.md`) consumed by both discuss-phase and researcher workflows

## Analysis

### The convergence suggests 7 primary types

The 40 named groupings from 5 independent audits converge on these recurrent patterns. Each type answers the question: **what should the researcher do with this claim?**

| Type | What it means | Researcher action | Audit evidence (where found) |
|------|--------------|-------------------|------------------------------|
| **evidenced** | Traceable to specific artifact, measurement, incident, or ADR. Has a citation. | Verify the citation is current. Build on the finding. | this-repo E, batch-1 Groups 1/3, batch-2 Group 4, batch-3 Groups 1/3 |
| **decided** | Explicitly chosen through deliberation. Has rationale. | Honor it. Research implementation, not alternatives. | this-repo A, batch-1 Group 3 (partial), batch-4 DECIDED markers |
| **assumed** | Working assumption. May have challenge protocol. Not yet validated. | Investigate. Test. Potentially revise. This is the primary research target. | this-repo D, batch-1 Group 2, batch-2 Group 1, batch-4 Group 4 |
| **open** | Genuinely unresolved. Named uncertainty with research delegation. | Research this. Propose options. Surface tradeoffs. | this-repo F, batch-1 Group 2, batch-4 Group 4 |
| **projected** | Current design justified by future phase needs that don't yet exist. Implicit cross-phase contract. | Check whether the projected need is real. Flag if it contradicts current-phase evidence. | batch-1 Group 6, batch-2 Group 3, batch-4 Group 2 |
| **stipulated** | Operationalized threshold, number, or criterion. Chosen, not derived. | Note this is a choice, not a fact. Look for calibration evidence. Flag if evidence suggests a different value. | this-repo C, batch-1 Group 9, batch-2 Group 6 |
| **governing** | Normative, philosophical, or process commitment. Framework-level. | Respect as framework. Don't investigate as if empirical. Note when governing claims constrain the solution space. | this-repo H, batch-2 Group 5, batch-3 Group 8, batch-4 Group 7 |

### Secondary dimension: verification method

Batch-3's distinction between "empirical with method" and "empirical without method" emerged as important across multiple audits. This cuts across types — any claim can have or lack a recorded verification path.

| Level | Meaning | Example |
|-------|---------|---------|
| **cited** | Names specific file, line, measurement command, or artifact | `[evidenced: grep -c shows 22 in src/handlers.ts]` |
| **reasoned** | Has stated rationale but no empirical citation | `[decided: card layout — consistent with existing Card component]` |
| **bare** | No verification path recorded | `[assumed]` with no further context |

The discuss-phase template should encourage `cited` level where possible. The context-checker flags `bare` claims that could easily be upgraded.

### Justificatory expectations by type

Each type carries different justificatory demands. The DISCUSSION-LOG.md (the justificatory sidecar) records the probing work behind each claim. The depth of justification can be measured by the number of probing questions the justification responds to — not "how many words" but "how many challenges does this answer?"

| Type | Justificatory demand | What DISCUSSION-LOG.md should record |
|------|---------------------|--------------------------------------|
| **evidenced** | Citation integrity — does the cited artifact exist, is it current, does it support the claim? | The verification check. If the evidence was stale, what replaced it. |
| **decided** | Rationale — why this choice over alternatives? What was considered and rejected? Scope boundaries are `decided` claims and are NOT exempt — they need justification for why the boundary is drawn here rather than elsewhere. | Alternatives considered, why rejected, what the user said. |
| **assumed** | Challenge protocol — what would falsify this? What evidence would change it? | What was checked (even if inconclusive), why assumption is reasonable pending research. |
| **open** | Framing — why is this open? What resolution looks like? What downstream decisions depend on it? | What's been tried, why it didn't resolve, what research would help. |
| **projected** | Basis — what makes the future need plausible? Is there evidence from roadmap, requirements, or prior phases? | The reasoning chain from current evidence to future projection. |
| **stipulated** | Candor — acknowledge this is a choice. Is there any calibration evidence? What range would be reasonable? | Why this number and not others. What would indicate it needs recalibration. |
| **governing** | Provenance — where does this commitment come from? Is it a project principle, a user value, a philosophical stance? | The source: deliberation, user statement, philosophical framework, convention. |

The checker doesn't just verify types — it checks whether each claim's justification in DISCUSSION-LOG.md meets the demand for its type. An `evidenced` claim with no citation in the log is suspicious. A `decided` claim with no alternatives-considered is under-justified.

### What types are NOT in the ontology and why

**Phantom** is not a type — it's a failure mode where a claim presents as `evidenced` but the citation doesn't resolve. The checker catches this.

**Invisible assumptions** are not a type — they're what the checker surfaces. Claims doing epistemic work without any type marker. The checker proposes types for them.

**Scope/boundary** is not a separate type — scope claims are `decided` claims about what's in/out. The "defensive" quality the audits identified is a rhetorical characteristic, not an epistemic one.

**Self-correcting** is not a type — it's what the context-gathering process does when it discovers prior documentation is wrong. The correction produces an `evidenced` claim that supersedes a stale one.

**Retroactive documentation** is a document-level property, not a claim-level type. A CONTEXT.md written after plans is a process issue, not an epistemic type.

**Split claims** (one proposition with two separable statuses) are handled by tagging a claim with two types: `[evidenced/assumed]` — "the mechanism is evidenced, but whether it's sufficient is assumed."

### Claim dependencies: the inferential web

Claims don't exist in isolation — they form dependency webs where the legitimacy of one claim rests on the status of others. This applies broadly, not just to scope claims:

- A `decided` scope boundary ("exclude Windows") depends on an `assumed` condition ("users are Mac/Linux developers"). If the assumption falls, the decision is undermined.
- A `stipulated` threshold ("3 retry threshold") depends on an `assumed` premise ("most transient failures resolve within 3"). The threshold is only reasonable under that assumption.
- A `projected` cross-phase contract ("Phase 5 will use this corpus") depends on an `assumed` assessment ("4 philosophy texts represent sufficient variety").
- An `evidenced` claim ("22 exception handlers in src/") may support a `decided` claim ("use wrapper pattern for error handling"). If the evidence changes, the decision's basis changes.

This is Brandom's inferential probe operationalized: "What else are you committed to by asserting this?" Each claim has inferential connections to other claims that determine whether its justification is legitimate.

**Design implication:** The DISCUSSION-LOG.md should record dependency chains — which claims support which other claims. The context-checker should trace these: not just "is this claim typed correctly?" but "are the claims this depends on themselves solid?" An `evidenced` claim supporting a `decided` claim is strong. An `assumed` claim supporting a `decided` claim is a vulnerability — the decision looks settled but rests on untested ground.

The reference doc (`references/claim-types.md`) should include guidance on recording dependencies: "When typing a claim, note which other claims it depends on. This makes the inferential structure visible and gives the checker something to trace."

## Tensions

1. **7 types vs learnability**: 7 types is more than [grounded]/[open] but may be too many for agents to consistently assign. The audits suggest it's the right number — fewer loses important distinctions. But the proof is in execution.

2. **Type assignment is itself epistemic work**: Deciding whether a claim is `evidenced` vs `assumed` requires judgment. The context-checker can verify after the fact, but the initial typing depends on the discuss-phase agent's epistemic sensitivity. This is the same recursive problem the quality regression deliberation identified.

3. **"Governing" claims resist typing**: The batch-2 audit noted that philosophical commitments "name virtues, not warrants" — they function as governance, not evidence. Some users may feel typing them as `governing` diminishes them. But the type doesn't judge — it describes the epistemic work the claim does.

4. **"Projected" may be too specialized**: Forward projections were prominent in the audits (found in 3 of 5), but they could arguably be `assumed` claims about future phases. Making them a separate type surfaces the cross-phase contract risk. Merging them loses that signal.

## Recommendation

**Conclusion: 7 primary types + 3-level verification dimension, implemented as a shared reference doc.**

The 7 types (evidenced, decided, assumed, open, projected, stipulated, governing) are grounded in convergent evidence from 5 independent exploratory audits across 12 projects. Each type has a distinct researcher action. The verification dimension (cited/reasoned/bare) cuts across all types and is the cheapest intervention for improving epistemic quality.

**Implementation:**
1. `references/claim-types.md` — shared reference doc defining each type, assignment criteria, researcher actions, and examples from real CONTEXT.md files (drawn from the audit corpus)
2. discuss-phase.md `write_context` template — require typed claims in exploratory mode
3. gsdr-phase-researcher.md — updated `<upstream_input>` table mapping each type to researcher behavior
4. Context-checker agent — verifies type assignments, surfaces untyped claims, checks citations

**The critical design insight from the audits:** The ontology works on two levels:
- **For typed claims:** the type tells the researcher what to do
- **For untyped claims:** the checker uses the ontology to propose types, making invisible assumptions visible

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Agents will consistently assign the same type to similar claims (inter-rater agreement >80%) when given the reference doc | First 3 CONTEXT.md files produced with typed claims | Type assignments are inconsistent or random across similar claims |
| P2 | The researcher will produce different research for `assumed` vs `decided` claims — investigating assumptions and honoring decisions | First 3 RESEARCH.md files after researcher update | Researcher treats all types identically (ignores types) |
| P3 | The context-checker will find at least 2 untyped claims per CONTEXT.md doing significant epistemic work (the invisible assumptions) | First 5 checker runs | Checker finds 0 untyped significant claims (suggesting all significant claims are already typed, which contradicts audit findings) |
| P4 | `stipulated` and `projected` types will be the most common claims reclassified by the checker — they are currently invisible and load-bearing | First 5 checker runs | These types are rarely assigned or reclassified |
| P5 | The verification dimension (cited/reasoned/bare) will improve citation quality — the percentage of `bare` claims will decrease over 5 phases as the template nudges toward `cited` | Phases 58-62 | Bare claim percentage stays constant or increases |

## Decision Record

**Decision:** 7 primary types (evidenced, decided, assumed, open, projected, stipulated, governing) + 3-level verification dimension (cited, reasoned, bare). Implemented via shared reference doc consumed by discuss-phase and researcher workflows.
**Decided:** 2026-04-09 (auto-deliberated)
**Implemented via:** Phase 57.2
**Signals addressed:** sig-2026-04-09-exploratory-mode-epistemic-quality-regression

## Evaluation

**Evaluated:** --
**Evaluation method:** --

## Supersession

**Superseded by:** --
**Reason:** --
