---
phase: 27-workflow-dx-reliability
plan: 03
subsystem: shell-scripts
tags: [portability, pipefail, shebang, GSD_HOME, mktemp]
requires:
  - phase: 27-RESEARCH
    provides: DX-04 shell portability audit identifying 5 scripts with issues
provides:
  - Portable #!/usr/bin/env bash shebangs across dev scripts
  - Pipeline error propagation via set -o pipefail in all 5 scripts
  - GSD_HOME-aware KB path in smoke tests
  - Portable mktemp without BSD-specific -t flag
affects: [dev-setup, dev-teardown, smoke-tests, knowledge-base]
tech-stack:
  added: []
  patterns: [portable-shebang, pipefail-error-propagation, GSD_HOME-env-override]
key-files:
  created: []
  modified:
    - scripts/dev-setup.sh
    - scripts/dev-teardown.sh
    - tests/smoke/run-smoke.sh
    - .claude/agents/kb-rebuild-index.sh
    - .claude/agents/kb-create-dirs.sh
key-decisions:
  - "kb-rebuild-index.sh pipefail is safe without grep || true guards -- get_field/get_tags called via command substitution, exit codes captured by assignment not shell error handling"
patterns-established:
  - "Portable shebang: #!/usr/bin/env bash instead of #!/bin/bash for NixOS/custom-path compatibility"
  - "Portable mktemp: use ${TMPDIR:-/tmp}/template instead of -t flag for GNU/BSD cross-compatibility"
duration: 2min
completed: 2026-02-23
---

# Phase 27 Plan 03: Shell Script Portability Fixes Summary

**Portable shebangs, pipefail error propagation, GSD_HOME-aware paths, and portable mktemp across 5 shell scripts**

## Performance
- **Duration:** 2min
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments
- Added `#!/usr/bin/env bash` portable shebang to dev-setup.sh and dev-teardown.sh (replacing `#!/bin/bash`)
- Added `set -eo pipefail` to dev-setup.sh and dev-teardown.sh (replacing `set -e`)
- Fixed hardcoded `$HOME/.gsd` to `${GSD_HOME:-$HOME/.gsd}` in run-smoke.sh KB_DIR
- Replaced BSD-specific `mktemp -d -t` with portable `mktemp -d "${TMPDIR:-/tmp}/..."` in run-smoke.sh
- Added `set -o pipefail` to kb-rebuild-index.sh and kb-create-dirs.sh
- Verified kb-rebuild-index.sh with empty knowledge base does not error with pipefail enabled

## Task Commits
1. **Task 1: Fix shebangs and add pipefail to dev scripts** - `4760902`
2. **Task 2: Fix GSD_HOME, mktemp, and pipefail in smoke and KB scripts** - `9096d48`

## Files Created/Modified
- `scripts/dev-setup.sh` - Portable shebang + pipefail error propagation
- `scripts/dev-teardown.sh` - Portable shebang + pipefail error propagation
- `tests/smoke/run-smoke.sh` - GSD_HOME-aware KB_DIR + portable mktemp
- `.claude/agents/kb-rebuild-index.sh` - Pipeline error propagation via pipefail
- `.claude/agents/kb-create-dirs.sh` - Pipeline error propagation via pipefail

## Decisions & Deviations
None - plan executed exactly as written.

Key analysis confirmed: kb-rebuild-index.sh's `get_field()` and `get_tags()` grep pipelines are safe with pipefail because they are called via command substitution (`$(get_field ...)`), so pipeline exit codes are captured by variable assignment rather than triggering shell error handling. The existing `2>/dev/null` on grep suppresses stderr. Empty KB tested and confirmed working.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 5 shell scripts now use portable constructs. Phase 27 (Workflow DX & Reliability) portability work is complete.

## Self-Check: PASSED
- All 5 modified files exist on disk
- Both task commits (4760902, 9096d48) found in git history
- 27-03-SUMMARY.md created
