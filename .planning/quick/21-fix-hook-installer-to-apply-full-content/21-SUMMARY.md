---
phase: quick-21
plan: 01
model: claude-opus-4-6
context_used_pct: 15
subsystem: installer
tags: [hooks, namespace, content-transform]
requires:
  - phase: "44"
    provides: "Hook installation with 2-pass content transform"
provides:
  - "4-pass content transformation for hook files during install"
  - "Tests verifying command prefix, quoted path.join args, and no double-transform"
affects: [installer, hooks]
tech-stack:
  added: []
  patterns: ["ordered regex chain with negative lookahead protection"]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
key-decisions:
  - "Transform order: slash-path first, prefix second, command-prefix third, quoted-string last"
duration: 2min
completed: 2026-03-09
---

# Quick Task 21: Fix Hook Installer to Apply Full Content Transforms

**Added 2 missing content transforms to hook installer: /gsd: command prefix and quoted 'get-shit-done' path.join arguments, with tests and no double-transform of npm package name.**

## Performance
- **Duration:** 2min
- **Tasks:** 3/3 completed
- **Files modified:** 2

## Accomplishments
- Hook installer now applies 4 content transforms (was 2): trailing-slash paths, gsd- prefix, /gsd: command prefix, and quoted 'get-shit-done' path.join args
- Installed hooks now correctly reference 'get-shit-done-reflect' VERSION paths and /gsdr:update command
- npm package name `get-shit-done-reflect-cc` is protected from double-transformation
- 3 new tests verify all transform behaviors (128 total tests, all passing)

## Task Commits
1. **Task 1: Add missing content transforms to hook installer** - `5ce01d6`
2. **Task 2: Add tests for new hook content transforms** - `1c4608c`
3. **Task 3: Reinstall locally and verify installed hooks** - (no file changes; verification-only task)

## Files Created/Modified
- `bin/install.js` - Added 2 new regex transforms in hook copy loop (lines 2344-2345)
- `tests/unit/install.test.js` - Added 3 new tests: quoted path.join transform, /gsd: command prefix transform, no double-transform of npm name

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Hook content transforms are complete. All installed hooks now have correct namespace references. No follow-up work needed.

## Self-Check: PASSED
