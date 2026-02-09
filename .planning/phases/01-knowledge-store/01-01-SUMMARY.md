---
phase: 01-knowledge-store
plan: 01
subsystem: knowledge-store
tags: [markdown, yaml-frontmatter, file-based-storage, knowledge-base]

# Dependency graph
requires:
  - phase: none
    provides: first phase, no dependencies
provides:
  - Complete knowledge store reference specification
  - Schema definitions for signal, spike, and lesson entry types
  - Directory layout and naming conventions
  - Index format and rebuild process
  - Lifecycle, durability, and concurrency rules
affects: [01-02, 01-03, 02-signal-collector, 03-spike-runner, 04-reflection-engine, 05-knowledge-surfacing]

# Tech tracking
tech-stack:
  added: []
  patterns: [yaml-frontmatter-schema, type-prefix-ids, atomic-index-rebuild, durability-classification]

key-files:
  created: [.claude/agents/knowledge-store.md]
  modified: []

key-decisions:
  - "Common base schema with type-specific extensions (not separate schemas per type)"
  - "Lessons organized by category subdirectory, not by project"
  - "Signals and spikes immutable; lessons update-in-place"
  - "Archival via status field, not separate directory"
  - "Retrieval tracking fields optional, for future pruning design"
  - "No lock files; unique IDs prevent write collisions"

patterns-established:
  - "Entry ID format: {type-prefix}-{YYYY-MM-DD}-{slug}"
  - "Index rebuild: scan files, write temp, atomic rename"
  - "Durability classification: workaround/convention/principle"

# Metrics
duration: 2min
completed: 2026-02-02
---

# Phase 1 Plan 1: Knowledge Store Reference Specification Summary

**Complete knowledge store spec with three entry types, YAML frontmatter schemas, directory layout, auto-generated index format, and lifecycle/durability/concurrency rules**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T00:24:58Z
- **Completed:** 2026-02-03T00:26:51Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Defined complete schema for all three knowledge base entry types (signal, spike, lesson)
- Specified directory layout with project-scoped signals/spikes and category-scoped lessons
- Established naming conventions, ID format, and seeded tag taxonomy
- Documented index format with per-type tables and atomic rebuild process
- Defined lifecycle rules (no decay, no caps, no static relevance) and durability classification

## Task Commits

Each task was committed atomically:

1. **Task 1: Create knowledge store reference document** - `341bb7e` (feat)

## Files Created/Modified
- `.claude/agents/knowledge-store.md` - Complete knowledge store reference specification (347 lines, 13 sections)

## Decisions Made
- Common base schema with type-specific extensions chosen over separate schemas -- simpler for agents, consistent frontmatter parsing
- Lessons organized by category (architecture, workflow, tooling, etc.) rather than project -- lessons transcend individual projects
- Signals and spikes are immutable after creation; lessons update-in-place with bumped `updated` timestamp
- Archival uses `status: archived` in frontmatter rather than a separate directory -- avoids broken references
- Optional `retrieval_count` and `last_retrieved` fields for future pruning design -- low overhead, provides data without locking in decisions
- No lock files needed -- unique IDs (type prefix + date + slug) prevent write collisions between parallel agents

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `.claude/` directory is gitignored; required `git add -f` to commit the new agent file. This is expected for fork-maintained files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Knowledge store specification complete and committed
- Ready for Plan 01-02 (directory initialization and index rebuild scripts)
- Ready for Plan 01-03 (entry templates for all three types)
- All downstream phases (2-5) can reference this spec for schema and conventions

---
*Phase: 01-knowledge-store*
*Completed: 2026-02-02*
