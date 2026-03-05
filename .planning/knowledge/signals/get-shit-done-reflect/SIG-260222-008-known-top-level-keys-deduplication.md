---
id: SIG-260222-008-known-top-level-keys-deduplication
type: positive-pattern
severity: notable
polarity: positive
phase: 24
plan: "01"
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [deduplication, constants, refactor, drift-prevention, module-level]
---

# Module-Level Constants Prevent Drift Between Multiple Users of the Same Data

## Observation

Before Phase 24-01, `gsd-tools.js` had two inline copies of `knownTopLevel = new Set([...])` — one inside `cmdManifestDiffConfig` and one inside `cmdManifestValidate`. Plan 24-01 Task 2 extracted these into a single module-level `KNOWN_TOP_LEVEL_KEYS` constant. Post-extraction, `grep -c 'knownTopLevel'` returns 0 (no local copies remain); `grep -c 'KNOWN_TOP_LEVEL_KEYS'` returns 3+ (1 declaration, 2+ usages).

## Context

The duplication was pre-existing from Phase 23. When both consumers (diff-config and validate) used inline sets, updating one and forgetting the other would cause them to diverge — a class of silent correctness bug where validation accepted a key that diff-config reported as unknown. The extraction was listed as "Part A" of Plan 24-01 Task 2, and verified explicitly in the plan's verify steps.

## Impact

Any future top-level config key additions now require a single-point update: add the key to `KNOWN_TOP_LEVEL_KEYS` and both diff-config and validate automatically pick it up. Drift between the two commands is now structurally impossible (they share the same Set object). The verification step `grep -c 'knownTopLevel'` returns 0 makes the deduplication testable in CI.

## Recommendation

When adding new concepts that are referenced in multiple functions in gsd-tools.js, define them as module-level constants rather than inline duplicates. As a general rule: if the same Set, array, or object literal appears in two or more places, it should be a named constant. The `KNOWN_TOP_LEVEL_KEYS` deduplication is the reference example. Plan specs for similar refactors should include a `grep -c 'oldName'` returns 0 verify step to confirm the deduplication is complete.
