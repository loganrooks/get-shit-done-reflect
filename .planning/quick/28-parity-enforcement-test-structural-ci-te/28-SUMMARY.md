---
phase: quick-28
plan: 01
model: claude-opus-4-6
context_used_pct: 22
subsystem: testing
tags: [parity, cross-runtime, CI, integration-test, vitest]
requires:
  - phase: quick-22 through quick-27
    provides: "Runtime parity infrastructure (Codex TOML, Gemini escaping, OpenCode skills stripping, etc.)"
provides:
  - "Cross-runtime parity enforcement test block (4 tests)"
  - "SUPPORTED_RUNTIMES constant documenting all tracked runtimes"
  - "INTENTIONAL_DIVERGENCES constant documenting all known runtime differences"
affects: [multi-runtime.test.js, CI pipeline]
tech-stack:
  added: []
  patterns: [structural-CI-enforcement, intentional-divergence-documentation]
key-files:
  created: []
  modified: [tests/integration/multi-runtime.test.js]
key-decisions:
  - "Exclude fenced code blocks from Gemini ${} template variable check -- bash ${ARRAY[@]} in code examples is intentional syntax"
  - "Check /gsdr: as command invocation pattern (/gsdr:verb-name) not bare string -- prose references documenting other runtimes are intentional"
  - "INTENTIONAL_DIVERGENCES and SUPPORTED_RUNTIMES scoped to describe block, not module-level, to avoid polluting existing test namespace"
patterns-established:
  - "Parity enforcement via CI: structural invariants enforced by test automation rather than human vigilance"
  - "Intentional divergence documentation: INTENTIONAL_DIVERGENCES constant records and explains all known runtime differences"
duration: 5min
completed: 2026-03-17
---

# Quick Task 28: Parity Enforcement Test Summary

**Cross-runtime parity enforcement via 4 structural CI tests covering artifact counts, agent names, content transformations, and new runtime detection**

## Performance
- **Duration:** 5min
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments
- Added `describe('Cross-runtime parity enforcement')` block with 4 `tmpdirTest` tests inside the existing `multi-runtime validation` suite
- Test 1 (artifact count parity): verifies agents, workflows, references, and templates have identical file counts across all 4 runtimes
- Test 2 (agent name set equivalence): extracts agent base names (stripping runtime-specific extensions), asserts identical sorted sets
- Test 3 (content quality): verifies Gemini has no `${}` template leaks in body text, Codex has no `/gsdr:` command invocations, OpenCode has no `skills:` in frontmatter, and all Codex agent TOMLs contain `sandbox_mode =`
- Test 4 (new runtime detection): flags unexpected hidden directories matching plausible future runtime patterns (`.copilot/`, `.cursor/`, `.windsurf/`, `.agent/`, `.aide/`) or directories with runtime-like structure
- Documented all known runtime differences in `INTENTIONAL_DIVERGENCES` constant with inline WHY comments
- Total test count: 350 (was 346, added 4)

## Task Commits
1. **Task 1: Add cross-runtime parity enforcement test block** - `b3aab25`

## Files Created/Modified
- `tests/integration/multi-runtime.test.js` - Added 271 lines: `SUPPORTED_RUNTIMES` constant, `INTENTIONAL_DIVERGENCES` constant, and 4 `tmpdirTest` enforcement tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Refined Gemini template variable check to exclude code blocks**
- **Found during:** Task 1 (initial test run)
- **Issue:** `${DECISIONS[@]}` in gsdr-executor.md body is bash array expansion inside a fenced code block, not a leaked template variable. The regex `/\$\{[^}]+\}/` matched it incorrectly.
- **Fix:** Strip fenced code blocks (```` ```...``` ````) from body text before checking for template variable patterns.
- **Files modified:** tests/integration/multi-runtime.test.js
- **Commit:** b3aab25

**2. [Rule 1 - Bug] Refined Codex /gsdr: check to match command invocations only**
- **Found during:** Task 1 (second test run)
- **Issue:** Codex workflows pause-work.md and resume-project.md contain `/gsdr:` in prose text documenting other runtimes' command syntax (e.g., "command prefix: /gsdr:"). These are documentation references, not command invocations that should have been converted.
- **Fix:** Changed assertion from "content does NOT contain `/gsdr:`" to "content does NOT match `/gsdr:[a-z][\w-]*/`" (actual command invocation pattern like `/gsdr:plan-phase`).
- **Files modified:** tests/integration/multi-runtime.test.js
- **Commit:** b3aab25

## User Setup Required
None - no external service configuration required.

## What These Tests Catch
Adding a new agent to one runtime but not others, shipping Gemini files with unescaped `${}` template syntax in body text, shipping Codex workflows with `/gsdr:` command invocations instead of `$gsdr-`, shipping OpenCode agents with `skills:` in frontmatter, shipping Codex agent TOMLs without `sandbox_mode`, and introducing a new runtime directory without updating parity coverage.

## Self-Check: PASSED
- FOUND: tests/integration/multi-runtime.test.js
- FOUND: commit b3aab25
- FOUND: 28-SUMMARY.md
