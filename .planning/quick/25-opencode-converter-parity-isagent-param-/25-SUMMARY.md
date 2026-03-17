---
phase: quick-25
plan: 01
model: claude-opus-4-6
context_used_pct: 22
subsystem: installer
tags: [opencode, converter, frontmatter, isAgent, jsonc, settings]
requires:
  - phase: quick-24
    provides: "extractFrontmatterAndBody/extractFrontmatterField shared helpers, inSkippedArrayField pattern"
provides:
  - "isAgent parameter for agent-specific field stripping in OpenCode converter"
  - "subagent_type general-purpose -> general remapping"
  - "resolveOpencodeConfigPath with .jsonc preference"
  - "readSettings/writeSettings exports for external use"
  - "convertClaudeToOpencodeFrontmatter export for testing"
affects: [installer, opencode-runtime]
tech-stack:
  added: []
  patterns: ["options-object parameter pattern for converter functions", "jsonc-preference resolution"]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
key-decisions:
  - "isAgent defaults to false to preserve backward compatibility at command/workflow call sites"
  - "resolveOpencodeConfigPath uses existsSync for .jsonc detection rather than trying both paths"
  - "Uninstall cleanup refactored to readSettings (equivalent error handling to prior JSON.parse + catch)"
duration: 10min
completed: 2026-03-17
---

# Quick Task 25: OpenCode Converter Parity (isAgent param) Summary

**Four OpenCode converter gaps closed: isAgent field stripping, subagent_type remapping, .jsonc config resolution, and settings helper refactoring with 15 new tests.**

## Performance
- **Duration:** 10min
- **Tasks:** 3/3 completed
- **Files modified:** 2

## Accomplishments
- `convertClaudeToOpencodeFrontmatter` now accepts `{ isAgent }` option that strips agent-only fields (skills, color, memory, maxTurns, permissionMode, disallowedTools) and skips comment lines when true
- `subagent_type="general-purpose"` remapped to `"general"` for all OpenCode-converted content
- New `resolveOpencodeConfigPath()` prefers `.jsonc` when it exists, falls back to `.json` -- used at all three config read/write sites
- `configureOpencodePermissions` and uninstall cleanup refactored to use `resolveOpencodeConfigPath` and `readSettings`
- Four new exports added: `convertClaudeToOpencodeFrontmatter`, `resolveOpencodeConfigPath`, `readSettings`, `writeSettings`
- 15 new unit tests added (302 -> 317 total)

## Task Commits
1. **Task 1: Add isAgent parameter and subagent_type remap** - `cd30f29`
2. **Task 2: Add resolveOpencodeConfigPath and refactor config handling** - `1a2f66a`
3. **Task 3: Add unit tests for all four gaps** - `461e7d6`

## Files Created/Modified
- `bin/install.js` - isAgent param, subagent_type remap, resolveOpencodeConfigPath, config refactoring, new exports
- `tests/unit/install.test.js` - 15 new tests across 5 describe blocks

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All four OpenCode converter parity gaps identified in the fork audit are now closed. The converter function is fully testable via exports. Ready for Phase 45 (CJS Rename) or further quick tasks.

## Self-Check: PASSED
