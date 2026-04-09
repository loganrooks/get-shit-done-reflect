---
id: sig-2026-04-09-shared-reference-doc-convergence-pattern
type: good-pattern
severity: notable
phase: "57.2"
detected_by: artifact-sensor
detection_method: artifact-analysis
origin: phase-execution
date: 2026-04-09
lifecycle: detected
polarity: positive
tags: [shared-reference, convergence-point, agent-vocabulary, single-source-of-truth, claim-types]
---

# Signal: Shared Reference Doc Pattern Eliminates Agent Vocabulary Drift

## What Happened

Phase 57.2 created `get-shit-done/references/claim-types.md` as a single shared ontology consumed by 3 downstream agents (discuss-phase, researcher, context-checker) via explicit path references. All 5 wiring points were verified as connected.

## Why It Matters

When multiple agents need a shared vocabulary (here: 7 claim types + 3 verification levels), having each agent define its own version leads to drift. A single reference doc with explicit `@get-shit-done/references/claim-types.md` path references creates a convergence point that agents read at runtime.

## Evidence

- `claim-types.md` referenced in discuss-phase.md (12 references), gsdr-context-checker.md (upstream_input), gsd-phase-researcher.md (upstream_input)
- VERIFICATION.md Key Link table: all 5 wiring points marked WIRED
- Pattern was intentionally designed (PLAN.md frontmatter key_links) and explicitly named in SUMMARY.md

## Limitations

- Depends on agents actually reading the referenced file at runtime — if path resolution fails or context window exhausted, drift can still occur
- Creates a coupling point: changes to claim-types.md require coordinated updates across all 3 consumers
- Not yet validated at runtime — spec references exist but live consumption is untested
