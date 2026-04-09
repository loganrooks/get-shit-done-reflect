# Audit Skill Gap Analysis: What Phase 57's Planning Failure Revealed

**Date:** 2026-04-09
**Context:** Phase 57 CONTEXT.md contained a rich "Active Measurement" vision (lines 72-84) that was silently narrowed to a session-meta file reader during planning. The user wanted to run an investigatory audit to trace the causal chain. No `/gsdr:audit` command existed (57.3 gap). When we looked at the audit type taxonomy, no type matched the investigation needed.

---

## What We Actually Needed

An audit that traces **scope/vision loss across the artifact pipeline**:

```
REQUIREMENTS → CONTEXT → RESEARCH → DISCUSSION-LOG → PLAN → IMPLEMENTATION
     ↓              ↓          ↓             ↓            ↓          ↓
  "session-meta   "active     "read         silence     "read      session-meta
   reading"       measurement  session-meta  on the      session-   reader with
                  instrument"  files"        boundary    meta"      percentiles"
                                             question"
```

The investigation required:
1. Reading REQUIREMENTS to check if they were already narrow (they were)
2. Reading CONTEXT.md to see the full vision (it was excellent)
3. Reading RESEARCH.md to see if it honored or narrowed the context (it narrowed)
4. Reading DISCUSSION-LOG to check if the scope boundary question was raised (it wasn't)
5. Reading PLANs to see what was actually specified (only session-meta reading)
6. Tracing the causal chain to find WHERE the narrowing happened
7. Determining whether the narrowing was a deliberate decision or an omission
8. Identifying what specific implementations were lost

This is a **pipeline fidelity audit** — checking whether upstream intent survived translation through the artifact pipeline.

---

## What the Current Taxonomy Offers (and Why It Doesn't Fit)

| Existing Type | Why It Doesn't Match |
|---|---|
| `phase_verification` | Checks if a phase achieved its goal. Phase 57 "passed" verification — 10/10 must-haves. The problem isn't that it failed its goal, it's that the goal was wrong. |
| `codebase_forensics` | Structural understanding of code. This isn't about code — it's about the planning artifact chain. |
| `comparative_quality` | Compares quality across outputs. Closer — but it's comparing CONTEXT.md vision to PLAN scope, not comparing two implementations. |
| `requirements_review` | Checks requirements coverage. Part of the picture — but the finding is that requirements were *too narrow*, not that they were uncovered. |
| `claim_integrity` | Checks typed claims resolve. Could catch that `[open]` questions weren't answered, but the scope is much broader than claim checking. |
| `milestone` | Cross-phase integration. Wrong granularity — this is intra-phase, artifact-to-artifact. |
| `exploratory` | Open-ended, follow the question. This WORKS as an escape hatch but provides no structure for the specific thing we needed to do: trace information loss across a pipeline. |

---

## The Missing Audit Type: Pipeline Fidelity

**What it is:** An investigation into whether upstream intent (requirements, context, governing principles, open questions) was faithfully transmitted through the artifact pipeline into the implemented output.

**When to use it:**
- "The implementation doesn't match what we discussed"
- "Something was lost in translation"
- "How did this get narrowed?"
- "The plans don't reflect the context"
- "The requirements don't capture what we agreed on"
- "We had a rich discussion but the output is shallow"

**What makes it distinct from existing types:**
- It's **cross-artifact** — reads 4-6 artifacts in sequence, not one artifact type
- It's **causal** — traces which stage narrowed the scope and whether it was deliberate
- It's **about omission** — the finding is often "X was never discussed" rather than "X was wrong"
- It's **directional** — follows the pipeline from upstream (requirements/context) to downstream (plans/implementation), not the reverse (verification starts from implementation and checks against goals)

**Key investigation questions:**
1. What was the upstream intent? (Read REQUIREMENTS, CONTEXT.md governing principles)
2. At what stage was the intent narrowed? (Compare each artifact pair in the chain)
3. Was the narrowing an explicit decision or an omission? (Check DISCUSSION-LOG for decision records)
4. What specific capabilities/features were lost? (Diff upstream vision vs downstream implementation)
5. What structural pattern enabled the loss? (e.g., "planner honors requirements but not context")

**Ground rules needed (beyond core):**
- **P1: Read the full artifact chain.** Start from the earliest upstream artifact (requirements or milestone context) and read forward through every intermediate artifact to the implementation. Do not skip artifacts — the narrowing may happen at any stage.
- **P2: Distinguish explicit decisions from silence.** For each narrowing, check whether DISCUSSION-LOG records a deliberate decision. "We chose to defer X" is different from "X was never mentioned." Silence is a finding.
- **P3: Check for unanswered questions.** If CONTEXT.md contains `[open]` questions about scope boundaries, verify they were resolved in DISCUSSION-LOG or RESEARCH.md before planning proceeded. Unanswered questions are load-bearing — they silently default to the narrower interpretation.
- **P4: Don't blame the last stage.** The planner who wrote narrow PLANs may have been faithfully executing narrow REQUIREMENTS. The researcher who accepted narrow scope may have been faithfully following narrow requirements. Trace the root cause upstream.

**Body template:**

```
## Upstream Intent
[What REQUIREMENTS, CONTEXT.md, and governing principles specified]

## Artifact Pipeline Trace
[For each stage: what went in → what came out → what was lost → was loss explicit or implicit]

### Stage: Requirements → Context
[...]
### Stage: Context → Research  
[...]
### Stage: Research → Discussion
[...]
### Stage: Discussion → Plan
[...]
### Stage: Plan → Implementation
[...]

## Loss Inventory
[Specific capabilities/features/metrics lost, with upstream citation]

## Root Cause
[Which stage caused the narrowing, and what structural pattern enabled it]

## Structural Fix
[What would prevent this loss pattern from recurring]
```

---

## Implications for `/gsdr:audit` Design

### 1. Add `pipeline_fidelity` as a new audit type

Family: **epistemic** (it's about knowledge transmission, not structural verification)

Ground rules: Core + E1, E2, E3 + P1, P2, P3, P4 (pipeline-specific extensions above)

This is NOT just another `exploratory` audit — it has a specific structure (artifact chain tracing) and specific investigation questions (where was intent narrowed, was it deliberate) that the exploratory template doesn't capture.

### 2. The type inference table needs a row for this

| Context clue | Inferred type |
|---|---|
| "lost in translation", "narrowed", "doesn't match what we discussed", "vision dropped", "how did this happen", "not what I asked for" | pipeline_fidelity |

### 3. The auditor needs the artifact chain as input

For `pipeline_fidelity` audits, the task spec should include the ordered list of artifacts to trace:
```
artifacts_chain:
  - .planning/REQUIREMENTS.md (sections: TEL-01a, TEL-01b, TEL-02, TEL-04, TEL-05)
  - .planning/phases/57-*/57-CONTEXT.md
  - .planning/phases/57-*/57-RESEARCH.md
  - .planning/phases/57-*/57-DISCUSSION-LOG.md
  - .planning/phases/57-*/57-01-PLAN.md
  - .planning/phases/57-*/57-02-PLAN.md
  - get-shit-done/bin/lib/telemetry.cjs
```

The orchestrator can auto-derive this chain from the phase number + standard GSD artifact naming.

### 4. Consider whether `pipeline_fidelity` should be part of standard post-phase flow

The verifier (gsdr-verifier) checks "did the phase achieve its goal" — but the goal may itself be wrong (as in Phase 57). A pipeline fidelity check could run as an optional verification step that compares implementation not against PLAN must-haves (which the verifier does) but against CONTEXT.md governing principles (which nothing currently does).

This is architecturally different from verification: verification checks plan → implementation fidelity. Pipeline fidelity checks context → plan fidelity. Both are needed.

---

## What This Doesn't Cover (Known Limitations)

- This analysis is based on one incident (Phase 57). The `pipeline_fidelity` type may need refinement after more cases.
- The ground rules (P1-P4) are first-draft — they should be tested against the Phase 57 case and at least one other case before formalizing.
- The relationship between `pipeline_fidelity` and `comparative_quality` is fuzzy — a comparative quality audit could technically catch the same issue if scoped correctly. The distinction is that pipeline_fidelity traces a causal chain while comparative_quality compares outputs.
- Whether this should be a separate audit type or a structured variant of `exploratory` is a design question worth deliberating on after trying it.
