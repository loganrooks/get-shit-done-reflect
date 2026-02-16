---
phase: 20-runtime-portability
plan: 01
subsystem: installer
tags: [gemini, tool-names, body-text, agent-converter]
requires:
  - phase: 18-capability-matrix-installer-corrections
    provides: MCP tool preservation in Gemini agent frontmatter
  - phase: 15-codex-runtime
    provides: Body text tool name replacement pattern (convertClaudeToCodexSkill)
provides:
  - Body text tool name replacement in convertClaudeToGeminiAgent()
  - Unit tests for Gemini body text tool name replacement
  - Integration test for installed Gemini agent body content
affects: [21-workflow-refinements]
tech-stack:
  added: []
  patterns: [word-boundary regex tool name replacement in body text]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
    - tests/integration/multi-runtime.test.js
key-decisions:
  - "Reuse claudeToGeminiTools mapping for body text replacement (same as frontmatter)"
  - "Word-boundary regex safely preserves MCP tool references (underscores are word characters)"
patterns-established:
  - "Gemini body text conversion: same word-boundary regex pattern as Codex converter"
duration: 2min
completed: 2026-02-14
---

# Phase 20 Plan 01: Gemini Agent Body Text Tool Name Replacement Summary

**Body text tool name replacement added to convertClaudeToGeminiAgent() using claudeToGeminiTools mapping with word-boundary regex, matching Codex converter pattern**

## Performance
- **Duration:** 2min
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments
- convertClaudeToGeminiAgent() now replaces all 10 Claude tool names (Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, TodoWrite, AskUserQuestion) with Gemini-native equivalents in body text
- MCP tool references (mcp__*) preserved safely due to word-boundary regex matching
- 5 new tests added (4 unit + 1 integration), total suite at 150 passing tests
- Zero regressions across all 150 tests

## Task Commits
1. **Task 1: Add body text tool name replacement to convertClaudeToGeminiAgent()** - `a0699ac`
2. **Task 2: Add unit and integration tests for Gemini body text tool name replacement** - `2a2daab`

## Files Created/Modified
- `bin/install.js` - Added body text tool name replacement loop to convertClaudeToGeminiAgent() (6 lines added, 1 removed)
- `tests/unit/install.test.js` - 4 new unit tests: basic replacement, MCP preservation, all mapped tools, frontmatter+body combined
- `tests/integration/multi-runtime.test.js` - 1 new integration test: verifies installed Gemini agents have Gemini-native tool names in body

## Decisions & Deviations
None - plan executed exactly as written. The implementation follows the established Codex converter pattern (convertClaudeToCodexSkill lines 792-797) applied to the Gemini converter.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Gap 7 (agent spec body content accessibility) is now closed for Gemini runtime
- Gap 8 (Gemini tools mapping verification) confirmed complete -- all 10 mapped tools verified by unit test
- Ready for Phase 20 Plan 02 (Codex MCP config generator, Gap 9) if planned
- Ready for Phase 21 (Workflow Refinements)
