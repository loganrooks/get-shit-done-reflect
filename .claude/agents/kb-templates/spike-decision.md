<!--
Spike Decision Template

Notes:
- DECISION.md is the primary output of a spike - the output is a DECISION, not a report
- "Chosen approach" field is MANDATORY and cannot be "TBD" or deferred
- "No clear winner, using default" IS a valid decision
- ADR-influenced structure: Context (via Summary) -> Options (via Analysis table) -> Decision -> Consequences (via Implications)
- Lives in spike workspace, condensed version persisted to KB
-->
---
# Spike Decision Template
# Location: .planning/spikes/{index}-{slug}/DECISION.md

# Required frontmatter
completed: {YYYY-MM-DDTHH:MM:SSZ}
question: {The Open Question - one line}
answer: {One-line decision}
outcome: {confirmed|rejected|partial|inconclusive}
confidence: {HIGH|MEDIUM|LOW}

# Optional frontmatter
originating_phase: {phase number|project-level}
related_requirements: {REQ-IDs if applicable}
spike_duration: {actual time spent}
iterations: {1|2}
---

# Spike Decision: {Name}

## Summary

{2-3 paragraph executive summary. What was the question? What did we learn? What did we decide?}

## Findings

### Experiment 1: {name}

**Result:** {what happened}

**Data:**
{measurements, observations, code output, benchmarks - whatever evidence was gathered}

### Experiment 2: {name}

**Result:** {what happened}

**Data:**
{measurements, observations, code output, benchmarks}

{Add sections for each experiment from DESIGN.md}

## Analysis

{How findings inform the decision. Connect experiment results to the original question.}

| Option | Pros | Cons | Spike Evidence |
|--------|------|------|----------------|
| {Option A} | {benefits} | {drawbacks} | {data from experiments} |
| {Option B} | {benefits} | {drawbacks} | {data from experiments} |

{Table optional for Binary/Exploratory spikes, useful for Comparative}

## Decision

**Chosen approach:** {the decision - REQUIRED, cannot be empty or "TBD"}

**Rationale:** {why, based on evidence from experiments}

**Confidence:** {HIGH|MEDIUM|LOW}

- HIGH: Strong empirical evidence, clear winner
- MEDIUM: Some evidence supports decision, some inference required
- LOW: Limited data, educated guess, or "no clear winner - using default"

## Implications

{What this decision means for downstream work}

- {Implication 1: what changes or actions follow from this decision}
- {Implication 2: any constraints or considerations for future work}
- {Implication 3: risks or tradeoffs accepted}

## Metadata

**Spike duration:** {actual time spent}
**Iterations:** {1 or 2}
**Originating phase:** {phase number or "project-level"}
**Related requirements:** {REQ-IDs if applicable}
**DESIGN.md:** {relative path to DESIGN.md}

---

## KB Entry Reference

{After spike completes, the spike-runner agent creates a KB entry at:}
{~/.gsd/knowledge/spikes/{project}/{spike-name}.md}

{The KB entry contains a condensed version of this decision for cross-project querying.}
