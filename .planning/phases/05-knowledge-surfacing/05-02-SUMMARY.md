---
phase: 05-knowledge-surfacing
plan: 02
subsystem: knowledge-surfacing
tags: [knowledge-base, agent-prompts, researcher, planner, kb-query, citations, spike-dedup]

# Dependency graph
requires:
  - phase: 05-knowledge-surfacing
    provides: Knowledge surfacing reference specification (knowledge-surfacing.md)
provides:
  - Mandatory KB consultation in phase researcher agent
  - Optional KB consultation in planner agent
  - Spike deduplication (SPKE-08) via researcher initial query
  - Cross-project knowledge surfacing via unfiltered index queries
affects: [05-03 (executor agent sections)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive XML section pattern: <knowledge_surfacing> appended to agent files"
    - "Fork activation check: file existence gate before applying section"
    - "Knowledge chain: KB -> researcher -> RESEARCH.md -> planner -> PLAN.md -> executor"

key-files:
  created: []
  modified:
    - .claude/agents/gsd-phase-researcher.md
    - .claude/agents/gsd-planner.md

key-decisions:
  - "Researcher KB query is mandatory (before external research); planner KB query is optional (at discretion)"
  - "Researcher handles both lessons and spikes; planner handles lessons only"
  - "Planner checks RESEARCH.md Knowledge Applied section before querying KB to avoid redundancy"
  - "Knowledge chain propagation: planner embeds KB findings into PLAN.md task instructions"

patterns-established:
  - "Additive agent modification: append <knowledge_surfacing> XML section, never modify existing sections"
  - "Fork detection via file existence check on reference spec"
  - "RESEARCH.md as primary knowledge conduit to downstream agents"

# Metrics
duration: 3min
completed: 2026-02-07
---

# Phase 5 Plan 2: Agent Knowledge Surfacing Sections Summary

**Mandatory KB consultation in researcher (lessons + spikes + dedup) and optional lessons-only consultation in planner, with fork activation gates and cross-project surfacing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T21:27:53Z
- **Completed:** 2026-02-07T21:36:39Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added 121-line `<knowledge_surfacing>` section to gsd-phase-researcher.md with mandatory initial KB query, spike deduplication (SPKE-08), cross-project surfacing (SURF-04), re-query triggers, token budget, priority ordering, citation format, and debug mode
- Added 50-line `<knowledge_surfacing>` section to gsd-planner.md with optional KB consultation, lessons-only focus, RESEARCH.md check-first pattern, inline citations, and downstream propagation documentation
- Both sections include fork activation check (knowledge-surfacing.md existence) and @ reference to the specification

## Task Commits

Each task was committed atomically:

1. **Task 1: Add knowledge_surfacing section to gsd-phase-researcher.md** - `9a215c2` (feat)
2. **Task 2: Add knowledge_surfacing section to gsd-planner.md** - `f9c0901` (feat)

## Files Created/Modified
- `.claude/agents/gsd-phase-researcher.md` - Appended `<knowledge_surfacing>` section (121 lines) with mandatory KB query, spike dedup, cross-project surfacing
- `.claude/agents/gsd-planner.md` - Appended `<knowledge_surfacing>` section (50 lines) with optional lessons-only KB consultation

## Decisions Made
- Researcher query is mandatory (before any external research); planner query is optional (at discretion) -- aligns with knowledge chain where researcher is primary consumer
- Planner queries lessons only, not spikes -- spike decisions are the researcher's domain and already reflected in RESEARCH.md
- Planner checks RESEARCH.md "Knowledge Applied" section before querying KB independently to avoid redundant work
- Both sections use identical fork detection pattern (check reference file existence)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `.claude/agents/` directory is gitignored; required `git add -f` to stage both agent files (consistent with all prior phases)
- Planner file had two `</success_criteria>` tags (standard mode and gap closure mode), requiring more specific string matching for the append location

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both researcher and planner agents now have knowledge surfacing capabilities
- Plan 05-03 can add knowledge surfacing sections to remaining agents (executor, etc.)
- No blockers for Plan 03

---
*Phase: 05-knowledge-surfacing*
*Completed: 2026-02-07*
