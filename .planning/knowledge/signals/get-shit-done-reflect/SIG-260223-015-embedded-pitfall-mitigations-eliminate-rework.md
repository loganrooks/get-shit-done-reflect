---
id: SIG-260223-015
date: 2026-02-23
type: positive_pattern
severity: notable
polarity: positive
phase: 27
source: 27-02-PLAN.md, 27-02-SUMMARY.md
status: resolved
tags: [planning, tdd, pitfall-mitigation]
---

# Embedded pitfall mitigations in plans eliminate rework

## Signal

Plan 27-02 included a `<pitfalls>` section that pre-audited 6 known failure modes and embedded specific mitigations directly into task instructions:
1. Error swallowing (safeFs must re-throw)
2. Console capture technique (vi.spyOn pattern)
3. ANSI escape codes (use toContain, never exact equality)
4. Path expression duplication (verify each wrapping individually)
5. Try-catch audit (confirmed 19 targets are unwrapped)
6. Regression from wrapping (thunk must return fn())

Result: zero-rework first-pass TDD execution across 73 tests (68 existing + 5 new), zero deviations reported.

## Pattern

When creating plans for code that has known pitfall categories:
1. **Audit pitfalls during planning** — not execution
2. **Embed mitigations as inline instructions** in the task action, not as separate warnings
3. **Mark critical mitigations** (e.g., "CRITICAL: must re-throw") so they cannot be overlooked
4. **Include specific code patterns** (not just descriptions) for the correct approach

This shifts pitfall handling from reactive (debug during execution) to proactive (prevent during planning).

## Evidence

Plan 27-02: 3 tasks, 5min total, 0 deviations, 73/73 tests passing. Compare to plans without pitfall sections which frequently report 1-3 auto-fixed deviations.
