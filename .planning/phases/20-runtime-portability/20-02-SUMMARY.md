---
phase: 20-runtime-portability
plan: 02
subsystem: installer
tags: [codex, mcp, config-toml, marker-based-sections]
requires:
  - phase: 20-runtime-portability
    plan: 01
    provides: Gemini body text tool name replacement
  - phase: 15-codex-runtime
    provides: Codex CLI installer integration, AGENTS.md marker pattern
provides:
  - generateCodexMcpConfig() function for Codex config.toml MCP server generation
  - Marker-based section management for idempotent config.toml updates
  - Uninstall cleanup for config.toml GSD section
  - Unit and integration tests for Codex MCP config
affects: [21-workflow-refinements]
tech-stack:
  added: []
  patterns: [marker-based TOML section management for Codex config.toml]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
    - tests/integration/multi-runtime.test.js
key-decisions:
  - "Static gsdMcpServers mapping (no auto-discovery from tool names)"
  - "TOML generated via string templates (no TOML parser dependency)"
  - "No required = true in generated TOML (avoid blocking Codex startup if MCP server unavailable)"
  - "Marker-based sections (# GSD:BEGIN / # GSD:END) for idempotent updates, matching AGENTS.md pattern"
patterns-established:
  - "Codex config.toml marker-based section management follows same pattern as AGENTS.md"
duration: 3min
completed: 2026-02-14
---

# Phase 20 Plan 02: Codex MCP Config Generator Summary

**generateCodexMcpConfig() creates config.toml with [mcp_servers.context7] TOML section using marker-based management for idempotent create/update/uninstall**

## Performance
- **Duration:** 3min
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments
- New `generateCodexMcpConfig()` function creates/updates `~/.codex/config.toml` with MCP server entries
- Uses `# GSD:BEGIN` / `# GSD:END` markers for idempotent section management (same pattern as AGENTS.md)
- Preserves existing user config.toml content when merging GSD MCP section
- Integrated into Codex install path (called after AGENTS.md generation)
- Uninstall cleanup removes GSD section from config.toml, deletes file if empty
- 5 new tests added (4 unit + 1 integration), total suite at 155 passing tests
- Zero regressions across all 155 tests

## Task Commits
1. **Task 1: Implement generateCodexMcpConfig() with install and uninstall integration** - `3907c02`
2. **Task 2: Add unit and integration tests for Codex MCP config generation** - `95f0d3c`

## Files Created/Modified
- `bin/install.js` - Added gsdMcpServers constant, generateCodexMcpConfig() function, install call, uninstall cleanup, export (71 lines added)
- `tests/unit/install.test.js` - 4 new unit tests: create config.toml, merge with existing, idempotent update, no required=true
- `tests/integration/multi-runtime.test.js` - 1 new integration test: verifies Codex install generates config.toml with correct MCP server entries

## Decisions & Deviations
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Gap 9 (Codex MCP config generation) is now closed
- All v1.14 gap closure work for Phase 20 (Runtime Portability) is complete
- Ready for Phase 21 (Workflow Refinements) if planned
