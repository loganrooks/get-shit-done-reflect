---
id: sig-2026-03-06-phase42-plan-gaps-pre-execution-review
type: signal
project: get-shit-done-reflect
tags:
  - plan-accuracy
  - pre-execution-review
  - plan-checker
  - second-order-effects
  - assumption-verification
  - capability-gap
  - phase-42
created: "2026-03-06T21:15:00Z"
updated: "2026-03-06T21:15:00Z"
durability: convention
status: active
severity: notable
signal_type: capability-gap
signal_category: negative
phase: 42
plan: pre-execution
polarity: negative
occurrence_count: 3
related_signals:
  - sig-2026-03-05-phase40-plan-gaps-pre-execution-review
  - sig-2026-03-01-plan-checker-misses-second-order-effects
confidence: high
confidence_basis: Third occurrence of same pattern across Phases 40, 42, and prior plan checker analysis
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
detection_method: manual
origin: user-observation
---

## What Happened

Plan checker (gsd-plan-checker agent) passed Phase 42 plans with "VERIFICATION PASSED" — all checks green. Manual critical analysis immediately afterward found 7 gaps ranging from data-dependent bugs to missing guardrails:

1. **Signal count grep not column-aware (MEDIUM):** The untriaged signal threshold check uses `grep "^| sig-" index.md | grep -c "detected"` which matches "detected" anywhere in the line, not specifically in the Lifecycle column. A signal slug containing "detected" (e.g., `sig-2026-04-01-rogue-files-detected-late`) with lifecycle `triaged` would be falsely counted. Currently 0 signals trigger this, but it's a time bomb.

2. **Same-day report collision (MEDIUM):** Reflection reports use `reflect-$(date +%Y-%m-%d).md` filename. Phase 42 introduces auto-reflection, creating a new source of report generation. If auto-reflect and manual `/gsd:reflect` run the same day, the second overwrites the first, destroying confidence_history entries. Pre-existing issue in reflect.md but Phase 42 significantly increases collision probability.

3. **No stale-signal guard (LOW-MEDIUM):** The auto_reflect postlude doesn't check whether auto_collect_signals actually ran. If signal collection was deferred (context too high), reflection fires on stale signals without any indication to the user that the analysis may be incomplete.

4. **Context estimation stale for 3rd postlude (LOW):** The formula `min(40 + (WAVES_COMPLETED * 10), 80)` was designed for 2 postludes. Adding a 3rd (reflection, the most expensive one) means actual context usage exceeds the estimate. Context deferral decisions use the estimate, not actual usage.

5. **Double counter reset (COSMETIC):** Both reflect.md and the execute-phase postlude reset the counter. Harmless (idempotent) but redundant — the `last_reflect_at` timestamp gets written twice.

6. **No new automated tests (LOW-MEDIUM):** Plan 42-01 adds a new gsd-tools.js subcommand (`reflection-counter`) but doesn't add tests to `tests/unit/automation.test.js`. Prior phases (37, 40) added tests for their subcommands. The automation.test.js file already tests `track-event reflection` and `resolve-level reflection`, so the pattern exists.

7. **Markdown confidence_history parsing fragility (LOW):** REFL-05 confidence_history lives as markdown tables in reflection reports. The next reflector must parse markdown from the previous report. No structured format (JSON/YAML) — relies on LLM parsing consistency across reflections.

## Context

This is the third occurrence of the "plan checker passes but manual review finds gaps" pattern:
- Phase 40 (sig-2026-03-05): 8 gaps found including double-fire bug, context estimation issues
- Plan checker capability analysis (sig-2026-03-01): identified structural inability to catch second-order effects
- Phase 42 (this signal): 7 gaps found including grep fragility, report collision, missing guardrails

The plan checker validates: requirement coverage, frontmatter correctness, task completeness, dependency graphs, scope assessment, must_haves derivation. It does NOT validate: data-dependent correctness of bash commands, interaction effects between workflow steps, assumption robustness under different data conditions, cross-feature side effects, test coverage expectations.

## Potential Cause

The plan checker operates at the structural level — it verifies plans are well-formed, cover requirements, and wire dependencies correctly. It cannot reason about:

1. **Data-dependent correctness:** Whether a grep pattern is column-aware requires understanding the data format. The checker sees the grep command but doesn't simulate its behavior against the actual index.md format.

2. **Cross-feature interaction:** The stale-signal guard gap requires reasoning about what happens when one postlude step (signal collection) is skipped and a subsequent step (reflection) proceeds. The checker verifies each step's internal logic but not inter-step dependencies.

3. **Historical pattern matching:** The "no new tests" gap requires knowing that prior phases added tests for similar subcommands. The checker doesn't compare against historical patterns.

4. **Pre-existing issue amplification:** The report collision issue exists in reflect.md today. Phase 42 amplifies it by adding a new trigger source. The checker evaluates the plan in isolation, not its interaction with pre-existing issues.

This suggests a structural limitation: the plan checker is a single-pass structural validator, not a multi-pass analytical tool. Addressing this may require either (a) expanding the checker's scope (Phase 43 PLAN-01 through PLAN-05 partially addresses this) or (b) formalizing the "pre-execution critical review" as a separate workflow step with different evaluation criteria.
