---
phase: 05-knowledge-surfacing
plan: 01
subsystem: knowledge-surfacing
tags: [knowledge-base, freshness, depends_on, citations, spike-dedup, progressive-disclosure, debug-mode]

# Dependency graph
requires:
  - phase: 01-knowledge-store
    provides: KB schema, directory layout, index format
  - phase: 04-reflection-engine
    provides: Lesson distillation patterns, reflection workflow
provides:
  - Central knowledge surfacing reference specification (knowledge-surfacing.md)
  - depends_on freshness field in KB common base schema
  - knowledge_debug config option documentation
affects: [05-02 (agent prompt sections), 05-03 (agent prompt sections)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fork detection: check reference file existence before applying knowledge surfacing"
    - "Agent-initiated (pull-based) KB querying via Read/Grep on index.md"
    - "depends_on freshness model with temporal decay fallback"
    - "Inline citation format: [entry-id] in natural language"

key-files:
  created:
    - get-shit-done/references/knowledge-surfacing.md
  modified:
    - .claude/agents/knowledge-store.md
    - get-shit-done/references/planning-config.md

key-decisions:
  - "Cross-project surfacing (SURF-04) satisfied by existing architecture -- agents query index.md without project filter"
  - "depends_on is a documentation field, not an automated verification system -- agents use judgment"
  - "Progressive disclosure uses existing two-tier model (index summaries + full entries) with no interactive menu"
  - "knowledge_debug config flag at top level of config.json (not nested under planning)"

patterns-established:
  - "Knowledge surfacing reference as centralized spec consumed by agent <knowledge_surfacing> sections via @ syntax"
  - "Soft token cap (~500 tokens, ~200 executor) with truncation strategy"
  - "KB Debug Log section for verbose knowledge retrieval logging"

# Metrics
duration: 4min
completed: 2026-02-07
---

# Phase 5 Plan 1: Knowledge Surfacing Reference Summary

**Central knowledge surfacing specification with depends_on freshness model, ~500 token budget, spike deduplication, and knowledge_debug config**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-07T21:20:58Z
- **Completed:** 2026-02-07T21:25:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created comprehensive knowledge-surfacing.md reference (453 lines, 11 sections) covering query mechanics, relevance matching, freshness checking, token budget, citation format, spike deduplication, agent-specific behavior, knowledge chain, progressive disclosure, and debug mode
- Added depends_on optional freshness field to knowledge-store.md Common Base Schema with documentation and YAML example
- Added knowledge_debug config option to planning-config.md with schema entry, options table entry, and dedicated behavior section

## Task Commits

Each task was committed atomically:

1. **Task 1: Create knowledge-surfacing.md reference specification** - `1d07e13` (feat)
2. **Task 2: Update knowledge-store.md and planning-config.md with new fields** - `f202ab7` (feat)

## Files Created/Modified
- `get-shit-done/references/knowledge-surfacing.md` - Central knowledge surfacing specification (NEW, 453 lines)
- `.claude/agents/knowledge-store.md` - Added depends_on optional freshness field to Section 3 Common Base Schema
- `get-shit-done/references/planning-config.md` - Added knowledge_debug to config schema, options table, and new knowledge_surfacing_config section

## Decisions Made
- Cross-project surfacing (SURF-04) satisfied by existing KB architecture -- agents query index.md without project filter to get all entries across all projects
- depends_on is a documentation field for agent judgment, not an automated verification system -- keeps v1 simple
- Progressive disclosure uses the simpler approach for v1 (agent reads index, picks top matches, reads full entries) with no interactive menu
- knowledge_debug config flag placed at top level of config.json (alongside mode, depth, etc.) rather than nested under a sub-object

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `.claude/agents/` directory is gitignored; required `git add -f` to stage knowledge-store.md changes (consistent with prior phases 01-04 which used the same approach)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- knowledge-surfacing.md is ready to be referenced by agent `<knowledge_surfacing>` sections via @ syntax (Plans 02 and 03)
- depends_on field documented and ready for use by agents during freshness checking
- knowledge_debug config documented and ready for agents to check
- No blockers for Plans 02 or 03

---
*Phase: 05-knowledge-surfacing*
*Completed: 2026-02-07*
