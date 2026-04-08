---
id: sig-2026-03-07-plan-checker-misses-producer-consumer-gaps
type: signal
signal_type: capability-gap
project: get-shit-done-reflect
severity: notable
lifecycle: detected
tags:
  - plan-checker
  - producer-consumer
  - cross-workflow
  - implicit-dependencies
  - second-order-effects
  - template-consumer-gap
created: "2026-03-07T12:00:00Z"
updated: "2026-03-07T12:00:00Z"
durability: principle
status: active
phase: 43
plan: planning
polarity: negative
occurrence_count: 3
related_signals:
  - sig-2026-03-06-plan-verification-misses-architectural-gaps
  - sig-2026-03-01-plan-checker-misses-second-order-effects
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
detection_method: manual
origin: user-observation
---

# Plan Checker Misses Producer-Consumer Gaps in Phase 43

## What Happened

Phase 43 plans passed plan-checker verification (VERIFICATION PASSED, all 7 structural dimensions clean) yet contained two producer-consumer gaps identified only through manual deep analysis:

1. **TMPL-02/03 (summary template fields without executor update):** Plan 43-02 Task 1 adds `model:` and `context_used_pct:` fields to all three summary templates (`summary-standard.md`, `summary-complex.md`, `summary-minimal.md`). However, no plan updates `agents/gsd-executor.md`'s `<summary_creation>` section to instruct the executor to fill these fields. The executor's current instruction set lists specific frontmatter fields (phase, plan, subsystem, tags, dependency graph, tech-stack, key-files, decisions, metrics) — `model` and `context_used_pct` are not mentioned. The template has placeholder text but the executor follows its spec, not template placeholders.

2. **TMPL-04 (reflector needs REQUIREMENTS.md but workflow doesn't pass it):** Plan 43-02 Task 2 adds a Step 9.5 to `agents/gsd-reflector.md` that reads `.planning/REQUIREMENTS.md`. But `get-shit-done/workflows/reflect.md`'s `prepare_context` step does not load or pass REQUIREMENTS.md to the reflector agent's Task() prompt. The workflow itself notes (line 217) that `@` syntax doesn't work across Task() boundaries, which is why all file contents are pre-loaded — but REQUIREMENTS.md is not in that pre-load list.

Additionally, `agents/gsd-executor.md` is not listed in Plan 43-02's `files_modified` frontmatter, meaning even if the gap were noticed during execution, the verifier would not check for changes to that file.

## Context

The plan checker's key_links analysis (Dimension 4) verified wiring *within* each plan and noted the reflector-to-workflow tandem update (citing Pitfall 6 from research). However, it analyzed key links as *connections between artifacts listed in the plan*, not as *producer-consumer relationships across the full workflow chain*. The summary template -> executor relationship was listed as a key_link in Plan 43-02 frontmatter (`from: summary templates, to: executor agent, via: model and context_used_pct filled during execution`) but the checker accepted this at face value without verifying that the executor agent spec would actually be updated.

This is the third occurrence of the plan checker missing cross-workflow integration dependencies:
- **Occurrence 1** (Phase 34-35): Plans referenced nonexistent tool subcommands and config keys — the checker verified plan structure but not semantic validity of references
- **Occurrence 2** (Phase 41): New hook file created but installer hook registration block not planned — the checker verified requirement coverage but not installer integration
- **Occurrence 3** (Phase 43): Template fields added but producer agent not updated — the checker verified artifact creation but not consumer-producer chains

## Potential Cause

The plan checker's verification dimensions operate at the plan-artifact level, not the workflow-chain level. Specifically:

1. **Dimension 4 (Key Links)** checks that artifacts listed in `must_haves.key_links` are wired together by task actions. But it trusts the key_link declarations — if a plan declares `summary templates -> executor agent` as a key link, the checker verifies that a task *mentions* this connection, not that the task *actually updates the executor spec*.

2. **Template vs producer asymmetry:** Adding a field to a template is a *structural change*. Making something *fill* that field is a *behavioral change* to a different file. The plan checker has no concept of "this template field needs a producer" — it treats templates as passive artifacts.

3. **Cross-file dependency inference is not in scope:** The checker would need to understand that `summary-standard.md` is consumed by `gsd-executor.md` (via the `@` reference in the executor's `<summary_creation>` section) and that adding fields to the template requires updating the consumer's instructions. This is implicit domain knowledge, not something derivable from plan structure alone.

The Phase 43 PLAN-01 through PLAN-05 semantic dimensions (tool refs, config keys, directory existence, signal refs) address a different class of gap — they validate *references within plans* against external sources of truth. They do not address *producer-consumer completeness across workflow chains*.
