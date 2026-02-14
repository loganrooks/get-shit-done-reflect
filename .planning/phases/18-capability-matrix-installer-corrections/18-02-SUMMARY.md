---
phase: 18-capability-matrix-installer-corrections
plan: 02
subsystem: installer
tags: [gemini, codex, mcp, tool-preservation, installer-fix]
requires:
  - phase: 15-codex-cli-integration
    provides: "Codex CLI installer with convertClaudeToCodexSkill()"
  - phase: 17-multi-runtime-validation
    provides: "Gemini installer with convertClaudeToGeminiAgent() and 127 passing tests"
provides:
  - "Fixed Gemini agent conversion to preserve MCP tool references"
  - "Exported convertClaudeToGeminiAgent for direct unit testing"
  - "5 new tests proving MCP preservation in both Gemini and Codex pipelines"
affects: [18-capability-matrix-installer-corrections]
tech-stack:
  added: []
  patterns: [mcp-tool-passthrough]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
    - tests/integration/multi-runtime.test.js
key-decisions:
  - "MCP tools preserved as-is in Gemini agent conversion (not mapped to Gemini built-in names)"
  - "Task tool exclusion unchanged (agents auto-register in Gemini)"
patterns-established:
  - "MCP tool passthrough: mcp__* prefixed tools pass through converter functions unchanged"
duration: 2min
completed: 2026-02-14
---

# Phase 18 Plan 02: Gemini MCP Tool Preservation Fix Summary

**Fixed convertGeminiToolName() to return MCP tool names instead of null, with 5 tests proving both Gemini and Codex preserve MCP references**

## Performance
- **Duration:** 2min
- **Tasks:** 2/2 completed
- **Files modified:** 3

## Accomplishments
- Fixed the MCP stripping bug in `convertGeminiToolName()` -- was returning `null` for `mcp__*` tools, now returns the tool name as-is
- Updated JSDoc to reflect that Gemini CLI supports MCP servers
- Exported `convertClaudeToGeminiAgent` in module.exports for direct unit testing
- Added 3 unit tests for Gemini MCP tool preservation (inline tools, YAML array, multiple MCP tools)
- Added 1 unit test proving Codex skill conversion preserves MCP body text references
- Added 1 integration test proving Gemini install retains MCP tools in installed agent files
- Total test count: 132 (was 127)

## Task Commits
1. **Task 1: Fix convertGeminiToolName() and export convertClaudeToGeminiAgent()** - `32243c1`
2. **Task 2: Add unit and integration tests for Gemini and Codex MCP tool preservation** - `d9d9ffc`

## Files Created/Modified
- `bin/install.js` - Fixed MCP tool passthrough in convertGeminiToolName(), updated JSDoc, added export
- `tests/unit/install.test.js` - Added 4 new unit tests (3 Gemini MCP, 1 Codex MCP body text)
- `tests/integration/multi-runtime.test.js` - Added 1 integration test for Gemini MCP retention

## Decisions & Deviations
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 132 tests pass across 7 test files
- MCP tools are now preserved in both Gemini agent conversion and Codex skill conversion
- Phase 18 plan 01 (capability matrix) can proceed independently
