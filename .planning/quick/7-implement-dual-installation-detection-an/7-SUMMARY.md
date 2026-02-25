---
phase: quick-7
plan: 01
subsystem: tooling
tags: [dual-install, detection, installer, gsd-tools, resume]
requires:
  - phase: none
    provides: existing gsd-tools.js init infrastructure and installer copy logic
provides:
  - dual_install detection in all gsd-tools.js init commands
  - cross-scope warning during installation
  - version/scope injection into command descriptions
  - dual-installation reference documentation
  - resume workflow dual-install status surfacing
affects: [installer, gsd-tools, resume-workflow, commands]
tech-stack:
  added: []
  patterns: [dual-install detection via VERSION file comparison, scope-aware frontmatter injection]
key-files:
  created:
    - .claude/get-shit-done/references/dual-installation.md
  modified:
    - .claude/get-shit-done/bin/gsd-tools.js
    - bin/install.js
    - .claude/get-shit-done/workflows/resume-project.md
key-decisions:
  - "VERSION file comparison for detection (not package.json or feature-manifest.json) -- VERSION is the canonical source"
  - "False positive guard: skip detection when cwd IS the home dir"
  - "Non-blocking informational warning for cross-scope detection during install (not a prompt/error)"
  - "Recursive applyVersionScopeToCommands handles nested Claude/Gemini command structure"
patterns-established:
  - "Dual-install detection: compare resolved paths of local and global VERSION files, return structured object"
  - "Version scope injection: regex-based frontmatter description suffix for autocomplete differentiation"
duration: 4min
completed: 2026-02-25
---

# Quick Task 7: Dual-Installation Detection and Awareness (Phase 1 of 2) Summary

**Detect dual local+global GSD installations via VERSION file comparison, warn during cross-scope installs, inject version/scope into command descriptions, and document the topology.**

## Performance
- **Duration:** 4 minutes
- **Tasks:** 3/3 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- All four gsd-tools.js init commands (execute-phase, plan-phase, quick, resume) include `dual_install` field with detected/local/global/active_scope
- Installer prints informational warning when cross-scope installation detected (other scope already has GSD)
- Command frontmatter descriptions get `(vX.Y.Z scope)` suffix after installation to differentiate in autocomplete
- Reference doc explains topology, precedence rules, autocomplete behavior, cross-project impact, and installation guidance
- Resume workflow surfaces dual-install status with version numbers when detected
- All 145 existing tests pass (no regressions)

## Task Commits
1. **Task 1: Add dual_install detection to gsd-tools.js init commands** - `b7600d8`
2. **Task 2: Add cross-scope detection warning and version/scope injection to installer** - `0791fb9`
3. **Task 3: Surface dual-install info on resume + create reference doc** - `0346ac6`

## Files Created/Modified
- `.claude/get-shit-done/bin/gsd-tools.js` - Added `detectDualInstall(cwd)` helper + `dual_install` field in 4 init commands
- `bin/install.js` - Added cross-scope warning, `injectVersionScope()`, `applyVersionScopeToCommands()` with post-copy injection
- `.claude/get-shit-done/workflows/resume-project.md` - Added `dual_install` to init JSON parsing + status box display
- `.claude/get-shit-done/references/dual-installation.md` - New reference doc: topology, precedence, autocomplete, cross-project impact

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

None - no external service configuration required.

## Phase 2 Readiness

Phase 1 (detection/awareness) is complete. Phase 2 (deferred) covers:
- Update workflow scope choice (`/gsd:update` asks which scope to update)
- Hook awareness with scope-aware indicators
- Version-pinned suppression (suppress update prompts for pinned local installs)
- Per-scope changelog deliberation
