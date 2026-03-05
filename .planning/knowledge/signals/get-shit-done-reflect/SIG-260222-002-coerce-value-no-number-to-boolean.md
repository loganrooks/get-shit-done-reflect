---
id: SIG-260222-002-coerce-value-no-number-to-boolean
type: architecture
severity: notable
polarity: positive
phase: 24
plan: "01"
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [type-coercion, config-migration, architecture, correctness, numbers]
---

# coerceValue Deliberately Avoids Number-to-Boolean Coercion

## Observation

The `coerceValue` helper in `gsd-tools.js` does NOT coerce numbers to booleans. This is an explicit design decision documented in the plan spec and captured in the summary as a key decision. The function handles string->boolean, string->number, boolean->string, number->string, and single-value->array coercions — but treats `0` as the number zero, not as `false`.

## Context

During Phase 24 Plan 01, the `apply-migration` command needed type coercion for config values read from `config.json`. A common JavaScript pattern treats `0` as falsy. However, in config migration context, `0` is a valid numeric value (e.g., `stale_threshold_days: 0` means "zero days threshold", not "disabled"). If `0` were coerced to `false`, it would silently corrupt any numeric config field that happened to be zero.

The plan spec stated explicitly: "Do NOT coerce numbers to booleans (0 could mean 'zero days threshold', not 'false')."

## Impact

Prevents silent data corruption in config migration. Any future modification to `coerceValue` must preserve this constraint. Future features that have numeric config fields with `0` as a valid value are protected.

## Recommendation

Any type coercion system for config values should treat numbers as numbers. Do not rely on JavaScript's truthy/falsy semantics for configuration values. Document this explicitly in the `coerceValue` function via a comment. When reviewing or extending the coercion logic, verify that number-to-boolean coercion is still absent.
