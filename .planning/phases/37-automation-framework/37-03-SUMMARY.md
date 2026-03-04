---
phase: 37-automation-framework
plan: 03
subsystem: automation
tags: [automation, track-event, statusline, statistics, atomic-write, observability]
requires:
  - phase: 37-02
    provides: full 4-step resolve-level resolution chain with FEATURE_CAPABILITY_MAP
provides:
  - automation track-event subcommand for recording fire/skip events per feature
  - atomic config writes (tmp + rename) for statistics persistence
  - statusline Auto:N / Auto:N(M) indicator with runtime cap awareness
  - 12 comprehensive track-event tests covering all scenarios
affects: [38-extensible-sensors, 39-trigger-engine, 40-reentrancy-guard]
tech-stack:
  added: []
  patterns: [atomic-write-tmp-rename, statistics-tracking-per-feature, statusline-runtime-heuristic]
key-files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.js
    - hooks/gsd-statusline.js
    - tests/unit/automation.test.js
key-decisions:
  - "Statistics are lightweight: 4 fields per feature (fires, skips, last_triggered, last_skip_reason) -- no arrays, no event logs per research pitfall 4"
  - "Atomic write uses tmp file + rename per existing codebase pattern"
  - "Statusline runtime cap heuristic is simplified: if hooks absent and configured > 2, cap at 2 -- full resolution happens in gsd-tools.js resolve-level"
patterns-established:
  - "Atomic config write: tmp file + rename for safe read-modify-write cycles"
  - "Statistics tracking: lightweight per-feature counters in config.json automation.stats section"
  - "Statusline extensibility: new indicators added between devTag/gsdUpdate and model name"
duration: 4min
completed: 2026-03-03
---

# Phase 37 Plan 03: Track-Event and Statusline Indicator Summary

**Automation statistics tracking via track-event subcommand with atomic config writes, plus statusline Auto:N(M) indicator showing configured and runtime-capped automation level**

## Performance
- **Duration:** 4min
- **Tasks:** 3/3 completed
- **Files modified:** 3

## Accomplishments
- Implemented `cmdAutomationTrackEvent` function that records fire/skip events per feature with atomic config persistence (tmp file + rename)
- Fire events increment fires counter and update last_triggered ISO timestamp; skip events increment skips counter and record last_skip_reason
- Statistics auto-create automation.stats section in config.json if not present, with per-feature isolation
- Feature name normalization consistent with resolve-level (hyphens to underscores)
- Added statusline automation level indicator: `Auto:N` when configured equals effective, `Auto:N(M)` when runtime-capped
- Statusline runtime cap heuristic checks .claude/settings.json hooks key presence
- Indicator displays in cyan to match existing statusline aesthetic
- Added 12 comprehensive tests covering fire events, skip events, atomic persistence, feature independence, name normalization, and error cases
- Total automation test suite now at 39 tests (27 resolve-level + 12 track-event)

## Task Commits
1. **Task 1: Implement automation track-event subcommand with atomic config writes** - `a9a7b06`
2. **Task 2: Add automation level indicator to statusline hook** - `499a7ed`
3. **Task 3: Add tests for track-event and extend automation test suite** - `1a45f79`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added cmdAutomationTrackEvent function and wired into automation dispatcher with track-event subcommand
- `hooks/gsd-statusline.js` - Added autoTag section showing Auto:N or Auto:N(M) indicator in cyan, positioned after devTag/gsdUpdate and before model name
- `tests/unit/automation.test.js` - 12 new track-event tests covering fire/skip events, atomic persistence, feature independence, normalization, and error cases

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 37 (Automation Framework) is now complete: all 3 plans delivered
- Consuming phases (38-43) can call `automation resolve-level <feature>` for level resolution and `automation track-event <feature> <fire|skip> [reason]` for statistics tracking
- Statusline provides real-time visibility into automation configuration
- Statistics section in config.json ready for downstream workflow instrumentation

## Self-Check: PASSED

All files verified present. All commits verified in git log.
