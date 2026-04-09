# Claim Type Ontology for CONTEXT.md

Shared reference for claim type vocabulary in CONTEXT.md. This document defines the epistemic types that claims can carry, how to assign them, what the researcher should do with each type, and what justificatory expectations each type carries.

**Consuming agents:**
- **discuss-phase** -- assigns types during context gathering
- **gsd-phase-researcher** -- takes different actions per type
- **gsdr-context-checker** -- verifies type assignments and surfaces untyped claims

**Design authority:** `.planning/deliberations/claim-type-ontology.md` (concluded 2026-04-09, 6 audits across 12 projects, ~85 CONTEXT.md files)

---

## 1. The 7 Claim Types

Each type answers the question: **what should the researcher do with this claim?**

| Type | Definition | Assignment Criteria | Researcher Action | Justificatory Expectation |
|------|-----------|-------------------|-------------------|--------------------------|
| **evidenced** | Traceable to a specific artifact, measurement, incident, or ADR. Has a citation. | Assign when the claim references a concrete, verifiable source -- a file path, a measurement result, an audit finding, an ADR, or an incident report. | Verify the citation is current. Build on the finding. | **Citation integrity** -- does the cited artifact exist, is it current, does it support the claim? DISCUSSION-LOG.md should record the verification check. If the evidence was stale, record what replaced it. |
| **decided** | Explicitly chosen through deliberation. Has rationale. | Assign when the claim records a choice that was made through discussion, deliberation, or user directive. Scope boundaries are `decided` claims -- they need justification for why the boundary is drawn here rather than elsewhere. | Honor it. Research implementation, not alternatives. | **Rationale** -- why this choice over alternatives? What was considered and rejected? DISCUSSION-LOG.md should record alternatives considered, why rejected, and what the user said. |
| **assumed** | Working assumption. May have a challenge protocol. Not yet validated. | Assign when the claim is treated as true for planning purposes but has not been empirically verified. This is the most common type for load-bearing beliefs that have not been tested. | Investigate. Test. Potentially revise. This is the primary research target. | **Challenge protocol** -- what would falsify this? What evidence would change it? DISCUSSION-LOG.md should record what was checked (even if inconclusive) and why the assumption is reasonable pending research. |
| **open** | Genuinely unresolved. Named uncertainty with research delegation. | Assign when the question is explicitly unresolved and requires research before a decision can be made. The claim names the uncertainty rather than asserting a position. | Research this. Propose options. Surface tradeoffs. | **Framing** -- why is this open? What does resolution look like? What downstream decisions depend on it? DISCUSSION-LOG.md should record what has been tried, why it did not resolve, and what research would help. |
| **projected** | Current design justified by future phase needs that do not yet exist. Implicit cross-phase contract. | Assign when a claim references a future phase, a planned feature, or a roadmap item to justify current design choices. The projected need may or may not materialize. | Check whether the projected need is real. Flag if it contradicts current-phase evidence. | **Basis** -- what makes the future need plausible? Is there evidence from roadmap, requirements, or prior phases? DISCUSSION-LOG.md should record the reasoning chain from current evidence to future projection. |
| **stipulated** | Operationalized threshold, number, or criterion. Chosen, not derived from evidence. | Assign when the claim specifies a concrete number, limit, or operational definition that was picked rather than measured. These look like facts but are choices. | Note this is a choice, not a fact. Look for calibration evidence. Flag if evidence suggests a different value. | **Candor** -- acknowledge this is a choice. Is there any calibration evidence? What range would be reasonable? DISCUSSION-LOG.md should record why this number and not others, and what would indicate it needs recalibration. |
| **governing** | Normative, philosophical, or process commitment. Framework-level. | Assign when the claim expresses a value, principle, or process convention that constrains the solution space without making an empirical assertion. | Respect as framework. Do not investigate as if empirical. Note when governing claims constrain the solution space. | **Provenance** -- where does this commitment come from? Is it a project principle, a user value, a philosophical stance? DISCUSSION-LOG.md should record the source: deliberation, user statement, philosophical framework, or convention. |

---

## 2. Verification Dimension

The verification dimension cuts across all 7 types. Any claim can have or lack a recorded verification path. This is a secondary dimension independent of the claim type.

| Level | Definition | Example |
|-------|-----------|---------|
| **cited** | Names a specific file, line, measurement command, or artifact that can be independently checked. | `[evidenced:cited] 22 exception handlers found via grep -c in src/handlers.ts` |
| **reasoned** | Has stated rationale but no empirical citation. The justification is an argument, not a measurement. | `[decided:reasoned] Card layout chosen for consistency with existing Card component` |
| **bare** | No verification path recorded. The claim is asserted without supporting evidence or rationale. | `[assumed] Users prefer dark mode` |

**Guidance:**
- Encourage `cited` wherever possible -- it is the cheapest intervention for improving epistemic quality.
- The context-checker flags `bare` claims that could easily be upgraded to `reasoned` or `cited`.
- When verification level is omitted from notation, it defaults to `bare`: `[assumed]` = `[assumed:bare]`.

---

## 3. Notation Syntax

### Inline markers

Claims carry their type and verification level as inline markers at the start of the claim line, immediately after any label prefix.

| Form | Syntax | Meaning |
|------|--------|---------|
| Full form | `[decided:cited]` | Type and verification explicit |
| Short form | `[assumed]` | Type only; verification defaults to `bare` |
| Split claim | `[evidenced/assumed]` | One proposition with two separable epistemic statuses (e.g., "the mechanism is evidenced, but whether it is sufficient is assumed") |

### Placement

- Start of claim line, after any label prefix
- Example: `- **A1:** [assumed:reasoned] The bridge file format is stable`
- Example: `- [decided:cited] Use wrapper pattern for error handling`

### Regex for agent parsing

```
\[(evidenced|decided|assumed|open|projected|stipulated|governing)(?:\/(evidenced|decided|assumed|open|projected|stipulated|governing))?(?::(cited|reasoned|bare))?\]
```

This regex captures:
- Group 1: primary type (required)
- Group 2: secondary type for split claims (optional)
- Group 3: verification level (optional, defaults to `bare` if absent)

---

## 4. What Is NOT a Type

The following patterns surfaced in audits but are **not** claim types. They are either failure modes, process properties, or phenomena handled by other mechanisms.

| Pattern | Why it is not a type | How it is handled |
|---------|---------------------|-------------------|
| **Phantom** | A failure mode where a claim presents as `evidenced` but the citation does not resolve. | The context-checker catches phantom claims during verification. |
| **Invisible assumptions** | Claims doing epistemic work without any type marker. These are not a type -- they are what the checker surfaces. | The context-checker proposes types for untyped claims. |
| **Scope/boundary** | Scope claims are `decided` claims about what is in or out. The "defensive" quality is a rhetorical characteristic, not an epistemic one. | Type as `decided` with appropriate justification for the boundary. |
| **Self-correcting** | What the context-gathering process does when it discovers prior documentation is wrong. The correction produces an `evidenced` claim that supersedes a stale one. | The new claim is typed normally; the correction is a process event, not a type. |
| **Retroactive documentation** | A document-level property (CONTEXT.md written after plans), not a claim-level type. | Flagged as a process issue, not typed as a claim category. |

**Split claims** (one proposition with two separable statuses) are handled by the `[type/type]` notation, not by creating additional types. Example: `[evidenced/assumed]` means "the mechanism is evidenced, but whether it is sufficient is assumed."

---

## 5. Claim Dependencies

Claims form dependency webs where the legitimacy of one claim rests on the status of others. Recording these dependencies makes the inferential structure visible and gives the context-checker something to trace.

### Recording format

Use a table in the Claim Dependencies section of CONTEXT.md:

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| `[decided]` Exclude Windows support | `[assumed:bare]` Users are Mac/Linux developers | HIGH -- if assumption is wrong, scope decision is undermined |
| `[stipulated]` 3 retry threshold | `[assumed:reasoned]` Most transient failures resolve within 3 | MEDIUM -- threshold is only reasonable under this assumption |
| `[projected]` Phase 5 will use this corpus | `[assumed]` 4 philosophy texts represent sufficient variety | HIGH -- cross-phase contract rests on untested assessment |
| `[decided]` Use wrapper pattern for error handling | `[evidenced:cited]` 22 exception handlers in src/ | Low -- if evidence changes, decision basis changes |

### Vulnerability assessment

The vulnerability of a dependency chain is determined by the weakest link:

- `decided` depending on `assumed` = **HIGH** vulnerability (decision looks settled but rests on untested ground)
- `decided` depending on `evidenced` = **Low** vulnerability (decision has a solid empirical basis)
- `projected` depending on `assumed` = **HIGH** vulnerability (cross-phase contract built on unvalidated premise)
- `stipulated` depending on `assumed` = **MEDIUM** vulnerability (chosen value may need recalibration)

### Guiding principle

> "What else are you committed to by asserting this?"
> -- Brandom's inferential probe, operationalized

When typing a claim, note which other claims it depends on. This makes the inferential structure visible and gives the checker something to trace. The context-checker should verify not just "is this claim typed correctly?" but "are the claims this depends on themselves solid?"

---

## 6. Auto-Progression Rules

These rules determine whether a typed claim is eligible for auto-progression (replacing the former `[grounded]` gate). Auto-progression eligibility depends on claim type and verification level, not a single binary marker.

| Type | Auto-Progression Rule |
|------|----------------------|
| **evidenced** | Auto-ready if verification >= `cited` |
| **decided** | Auto-ready (decisions are resolved) |
| **assumed** | Auto-ready ONLY if verification >= `reasoned` |
| **open** | NEVER auto-ready (requires research) |
| **projected** | Auto-ready if projected phase exists in ROADMAP.md |
| **stipulated** | Auto-ready (choices are resolved) |
| **governing** | Auto-ready (framework commitments) |

**Design rationale:** The former `[grounded]` marker served as both epistemic label AND automation control token, creating a Goodhart incentive to mark everything as grounded. By making auto-progression depend on type + verification level, the epistemic labels become honest. An agent can type a claim `[assumed]` without penalty, because `[assumed:reasoned]` is auto-ready. The incentive shifts from "mark everything grounded" to "provide honest rationale for assumptions."

---

## 7. Quick Reference

### Assignment decision tree

1. Is this claim traceable to a specific artifact or measurement? -> **evidenced**
2. Was this explicitly chosen through deliberation? -> **decided**
3. Is this genuinely unresolved and needs research? -> **open**
4. Is this justified by a future phase that does not yet exist? -> **projected**
5. Is this a specific number, threshold, or criterion that was picked? -> **stipulated**
6. Is this a value, principle, or process commitment? -> **governing**
7. Otherwise, is this treated as true but not yet validated? -> **assumed**

### Type at a glance

| Type | One-word summary | Researcher stance |
|------|-----------------|-------------------|
| evidenced | Verified | Build on it |
| decided | Chosen | Honor it |
| assumed | Hypothesized | Test it |
| open | Unknown | Research it |
| projected | Anticipated | Validate it |
| stipulated | Picked | Calibrate it |
| governing | Committed | Respect it |
