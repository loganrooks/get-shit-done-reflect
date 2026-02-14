---
phase: 18-capability-matrix-installer-corrections
plan: 01
subsystem: capability-matrix
tags: [capability-matrix, runtime-capabilities, mcp, tool-permissions, gemini, codex]
requires:
  - phase: 13-path-abstraction-capability-matrix
    provides: "Initial capability matrix reference document"
provides:
  - "Corrected capability matrix with 4 updated cells and annotations"
  - "Internally consistent prose across Quick Reference, Capability Details, and Degraded Behavior Summary"
affects: [18-02-installer-corrections, orchestrator-workflows, installer-format-conversion]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - get-shit-done/references/capability-matrix.md
key-decisions:
  - "Gemini CLI task_tool annotated as Y [1] (experimental/sequential) rather than plain Y"
  - "All 4 runtimes now support MCP -- mcp_servers degraded section retained as informational"
  - "Gemini CLI degraded summary reduced to single task_tool caveat (near-full capability)"
  - "Codex CLI degraded summary updated: MCP now Y, only task_tool and hooks remain N"
patterns-established:
  - "Annotated capability cells: Y [N] with blockquote footnotes for nuanced capability status"
duration: 2min
completed: 2026-02-14
---

# Phase 18 Plan 01: Capability Matrix Corrections Summary

**Corrected 4 stale Quick Reference cells (Gemini mcp/tool_permissions/task_tool, Codex mcp) with annotated footnotes and updated all prose sections for internal consistency**

## Performance
- **Duration:** 2min
- **Tasks:** 2/2 completed
- **Files modified:** 1

## Accomplishments
- Updated Quick Reference table: Gemini task_tool Y [1], tool_permissions Y [2], mcp_servers Y [3]; Codex mcp_servers Y [4]
- Added footnotes [1]-[4] with transport details and limitation annotations
- Updated Capability Details sections for task_tool, tool_permissions, and mcp_servers to reflect corrected values
- Updated Degraded Behavior Summary for both Codex CLI and Gemini CLI
- Gemini CLI elevated to near-full capability (only sequential task_tool caveat remains)
- Codex CLI MCP status corrected from N to Y with STDIO and Streamable HTTP
- Verified zero contradictions across all document sections via grep validation

## Task Commits
1. **Task 1: Update Quick Reference table with corrected cells and annotations** - `0f1b8f4`
2. **Task 2: Update Capability Details prose and Degraded Behavior Summary sections** - `880e105`

## Files Created/Modified
- `get-shit-done/references/capability-matrix.md` - Corrected runtime capability matrix (4 cells updated, prose sections aligned, degraded behavior summaries revised)

## Decisions & Deviations
None - plan executed exactly as written. All 4 cell corrections and prose updates followed the plan specification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
The corrected capability matrix is ready for Plan 18-02 (installer function corrections). The matrix now accurately reflects that:
- Gemini CLI supports MCP servers, tool_permissions, and experimental task_tool
- Codex CLI supports MCP servers
- Plan 18-02 will fix the installer functions (convertGeminiToolName, convertClaudeToGeminiAgent) that currently strip content based on the now-stale capability assumptions
