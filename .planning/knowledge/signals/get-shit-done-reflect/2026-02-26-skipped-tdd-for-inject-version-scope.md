---
id: sig-2026-02-26-skipped-tdd-for-inject-version-scope
type: signal
project: get-shit-done-reflect
tags: [tdd, testing, deviation, regex, agent-behavior]
created: 2026-02-26T20:30:00Z
updated: 2026-02-26T20:30:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: none
plan: none
polarity: negative
source: manual
occurrence_count: 2
related_signals: [sig-2026-02-23-planner-skips-tdd-baseline]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.5
---

# Signal: Skipped TDD for injectVersionScope Change

## What Happened

Modified `injectVersionScope()` regex in `bin/install.js` to drop the `local`/`global` scope from version injection (changing output from `(v1.15.5 local)` to `(v1.15.5)`). Changed the regex pattern and updated the JSDoc — but wrote zero tests before making the change. Tests were only added retroactively after the user explicitly asked "are we sure this works? did we implement a TDD approach?"

The function had no existing unit tests at all (`injectVersionScope` wasn't even exported), which made the gap less obvious but more risky — there was nothing to catch regressions.

## Context

This occurred during ad-hoc fix work between milestones. The `replacePathsInContent()` fix earlier in the same session DID include tests (3 new unit tests added alongside the regex change). But when moving to the `injectVersionScope` change, the discipline wasn't carried over. The same session, same type of change (regex modification), different testing approach.

## Potential Cause

- No existing tests for `injectVersionScope` → no red-green anchor to remind of TDD discipline
- The change felt "simple" (just removing scope from output) → false confidence
- Function wasn't exported → mental model of "internal detail, less critical" when it actually affects every installed command's autocomplete description
- Prior signal (sig-2026-02-23-planner-skips-tdd-baseline) documented same pattern in planner agents; this time it happened during direct execution, not planning
