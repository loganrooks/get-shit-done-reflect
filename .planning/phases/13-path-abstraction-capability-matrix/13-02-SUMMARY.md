---
phase: 13-path-abstraction-capability-matrix
plan: 02
subsystem: runtime-abstraction
tags: [capability-matrix, feature-detection, multi-runtime, workflow-orchestration]
requires:
  - phase: none
    provides: standalone reference document and workflow additions
provides:
  - Runtime capability matrix reference document (capability-matrix.md)
  - Feature detection patterns (has_capability, capability_check) in orchestrator workflows
  - Degraded behavior documentation for all 4 runtimes
affects: [14-shared-knowledge-base, 15-codex-cli-support, 16-cross-runtime-handoff]
tech-stack:
  added: []
  patterns: [capability-matrix-reference, has_capability-prose-pattern, capability_check-xml-tag, inform-once-then-adapt]
key-files:
  created:
    - get-shit-done/references/capability-matrix.md
  modified:
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/plan-phase.md
key-decisions:
  - "Capability matrix as static markdown reference doc, not config file"
  - "Feature detection via has_capability() prose pattern, not runtime name checks"
  - "Capability checks in orchestrator workflows only, agent specs stay clean"
  - "Inform once then adapt silently strategy for degraded behavior"
patterns-established:
  - "capability_check XML tag: Wraps feature detection in workflows for grep-ability"
  - "has_capability() prose pattern: LLM-readable feature branching convention"
  - "Standard-first if/else: Full capability path always presented before degraded path"
duration: 8min
completed: 2026-02-11
---

# Phase 13 Plan 02: Capability Matrix & Feature Detection Summary

**Static capability matrix reference doc declaring per-runtime tool availability for 4 runtimes, with has_capability() feature detection patterns added to execute-phase.md and plan-phase.md orchestrators**

## Performance
- **Duration:** 8min
- **Tasks:** 2/2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Created capability-matrix.md with "Can I Use"-style Quick Reference table covering task_tool, hooks, tool_permissions, mcp_servers across Claude Code, OpenCode, Gemini CLI, and Codex CLI
- Added Format Reference section documenting per-runtime frontmatter, command structure, agent format, and config format
- Documented detailed Capability Details for all 4 capabilities with degraded behavior descriptions
- Created Degraded Behavior Summary tables for all 4 runtimes (Codex CLI most constrained, Claude Code full capability)
- Documented Feature Detection Convention including has_capability() pattern and capability_check XML tag
- Added capability_adaptation section to execute-phase.md with parallel_execution and hooks_support checks
- Added agent_spawning capability_check to plan-phase.md before agent spawning logic

## Task Commits
1. **Task 1: Create the runtime capability matrix reference document** - `b27b0d9`
2. **Task 2: Add capability_check sections to orchestrator workflows** - `7fb8ea6`

## Files Created/Modified
- `get-shit-done/references/capability-matrix.md` - New reference doc declaring runtime capabilities, degraded behavior, and feature detection conventions
- `get-shit-done/workflows/execute-phase.md` - Added capability_adaptation section with parallel_execution and hooks_support checks
- `get-shit-done/workflows/plan-phase.md` - Added agent_spawning capability_check before research/planning agent spawning

## Decisions & Deviations
None - plan executed exactly as written. All structure and content aligned with locked decisions from CONTEXT.md and research recommendations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Capability matrix is in place for Phase 14 (shared knowledge base) to reference when documenting KB path behavior
- Feature detection patterns established for Phase 15 (Codex CLI support) to add Codex-specific degraded behaviors
- Orchestrator workflows are capability-aware and will adapt behavior based on runtime when installed to non-Claude runtimes
