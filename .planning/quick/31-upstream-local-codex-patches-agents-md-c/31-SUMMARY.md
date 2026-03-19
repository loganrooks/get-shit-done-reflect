---
phase: quick-31
plan: 01
model: claude-opus-4-6
context_used_pct: 35
subsystem: installer, workflows, references
tags: [codex, subagents, capability-matrix, signal-collection, namespace]
requires:
  - phase: spike-003
    provides: "Confirmed Codex has stable subagent support"
provides:
  - "Corrected AGENTS.md generation describing Codex subagent capabilities"
  - "Capability matrix with Codex task_tool=Y[2] and proper footnoting"
  - "Codex-native signal collection workflow with gsdr-* namespace and gpt-5.4 defaults"
  - "Multi-run comparison support in collect-signals"
affects: [codex-runtime, signal-collection, capability-matrix]
tech-stack:
  added: []
  patterns: [multi-run-comparison, built-in-sensor-fallback, reasoning-effort-escalation]
key-files:
  created: []
  modified:
    - bin/install.js
    - get-shit-done/references/capability-matrix.md
    - get-shit-done/workflows/collect-signals.md
    - tests/unit/install.test.js
key-decisions:
  - "Source files use ~/.claude/ path prefix convention; installer transforms to ./.claude/ for local and absolute paths for global/codex"
  - "collect-signals gsd-tools.js path uses ~/.claude/get-shit-done-reflect/bin/ (not get-shit-done/bin/) matching the fork's installed layout"
duration: 7min
completed: 2026-03-19
---

# Quick Task 31: Upstream Local Codex Patches Summary

**Upstream three locally-patched Codex runtime files to npm source equivalents so Codex-accurate descriptions survive reinstall**

## Performance
- **Duration:** 7min
- **Tasks:** 3/3 completed
- **Files modified:** 4

## Accomplishments
- Replaced inaccurate "No Task tool support" claim in AGENTS.md generation with description of Codex subagent/thread capabilities
- Updated capability matrix: Codex task_tool N->Y[2], renumbered all footnotes [2]->[3]->[4]->[5], added new [2] footnote for Codex subagent specifics
- Fixed gsdr-* namespace in Format Reference table (OpenCode and Gemini rows had stale gsd-* prefixes)
- Made task_tool detail section runtime-neutral: description, available-in list, degraded behavior, orchestrator adaptation
- Updated Codex CLI summary table from N/"Sequential" to Y[1]/"Use Codex subagents/threads"
- Updated capability_check example to use runtime-neutral "delegate via runtime-native child-agent mechanism"
- Upgraded collect-signals.md with full Codex-native adaptations: gsdr-* namespace, built-in sensor fallback, multi-run comparison support, gpt-5.4/reasoning_effort defaults, ENABLED_SENSOR_RUNS expansion, and corrected command references
- Updated test assertion from old claim to new accurate description
- Verified all 350 tests pass across all three task commits
- Confirmed `node bin/install.js --local` propagates source to .claude/ with correct path prefix transformation

## Task Commits
1. **Task 1: Patch install.js AGENTS.md generation and capability-matrix.md** - `6c8ff76`
2. **Task 2: Patch collect-signals.md with Codex-native workflow adaptations** - `d202a70`
3. **Task 3: Reinstall locally and verify full propagation** - (no commit needed; .claude/ files are gitignored)

## Files Created/Modified
- `bin/install.js` - Updated generateCodexAgentsMd() Runtime Capabilities section
- `get-shit-done/references/capability-matrix.md` - Codex task_tool=Y[2], renumbered footnotes, gsdr-* namespace, runtime-neutral descriptions
- `get-shit-done/workflows/collect-signals.md` - Codex-native signal collection: gsdr-* namespace, gpt-5.4 defaults, multi-run comparison, built-in sensor fallback
- `tests/unit/install.test.js` - Updated assertion from "No Task tool support" to "Task tool support is available via Codex subagents"

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All three npm source files now carry the Codex-native corrections. Runtime copies (.claude/, ~/.codex/) are downstream and will be updated on next install. The source files are the canonical versions.

## Self-Check: PASSED
