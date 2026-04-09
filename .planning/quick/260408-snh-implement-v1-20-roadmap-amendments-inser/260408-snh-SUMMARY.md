---
phase: quick
plan: 260408-snh
model: claude-opus-4-6
context_used_pct: 15
subsystem: planning
tags: [roadmap, requirements, codex, deprecation, capability-matrix]
dependency_graph:
  requires: [v1.20-roadmap-amendments-finalized.md]
  provides: [Phase 55.2 in ROADMAP, CODEX-01/02/05 in REQUIREMENTS, Gemini/OpenCode deprecation in capability-matrix]
  affects: [ROADMAP.md, REQUIREMENTS.md, STATE.md, capability-matrix.md]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md
    - get-shit-done/references/capability-matrix.md
decisions:
  - "Phase 55.2 inserted as separate phase (not folded into 55.1) per Opus reviewer consensus"
  - "Gemini CLI and OpenCode deprecated to community-maintained status per deliberation document"
  - "CODEX-03/04 reserved for v1.21 (adapter blocks and behavioral guardrails deferred)"
  - "Progress table: 55.1 row added alongside 55.2 since neither existed in progress table"
metrics:
  duration: 3min
  completed: 2026-04-09
---

# Quick Task 260408-snh: Implement v1.20 Roadmap Amendments Summary

Finalized v1.20 roadmap amendments applied across 4 planning/reference documents -- Phase 55.2 (Codex Runtime Substrate) inserted, 3 CODEX requirements added, Gemini CLI and OpenCode deprecated to community-maintained status.

## What Changed

### Task 1: ROADMAP.md and REQUIREMENTS.md (0e46dcc2)

**ROADMAP.md:**
- Header counts updated: 11 phases (was 10), 60 requirements (was 57)
- Phase 55.2 (Codex Runtime Substrate) inserted between 55.1 and 56 with full goal, requirements, success criteria
- Phase 60 renamed from "Sensor Pipeline & Cross-Runtime Adaptation" to "Sensor Pipeline & Codex Parity"
- Progress table: rows added for 55.1 and 55.2 (both were missing)
- Overall Progress table: v1.20 row updated to include 55.1, 55.2

**REQUIREMENTS.md:**
- New "Codex Substrate" section added between "Upstream Mini-Sync" and "KB Infrastructure"
- CODEX-01 (runtime capability resolver), CODEX-02 (agent/sensor discovery), CODEX-05 (parity living document) -- exact text from amendments
- XRT-02 narrowed to reference "Codex CLI target runtime" specifically
- 3 traceability rows added (CODEX-01/02/05 -> Phase 55.2)
- Coverage counts updated to 60 total / 60 mapped

### Task 2: STATE.md and capability-matrix.md (1b37726a)

**STATE.md:**
- `total_phases` updated from 10 to 11
- Two roadmap evolution entries: Phase 55.2 insertion and Gemini/OpenCode deprecation decision

**capability-matrix.md (npm source):**
- Deprecation notice block added after opening blockquote
- [D] markers on OpenCode and Gemini CLI column headers
- [D] footnote added after existing footnotes
- Per-runtime deprecation notices in Gemini CLI and OpenCode summary sections

## Deviations from Plan

### Minor Adjustments

**1. Progress table 55.1 row added**
- Plan said "add both if 55.1 is not in the progress table" -- it was not present, so both 55.1 and 55.2 rows were added
- This follows the plan's explicit contingency instruction

No other deviations. Plan executed as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 0e46dcc2 | docs(v1.20): insert Phase 55.2 and CODEX requirements into ROADMAP and REQUIREMENTS |
| 2 | 1b37726a | docs(v1.20): add roadmap evolution entries and deprecate Gemini/OpenCode in capability matrix |

## Self-Check: PASSED

All 4 modified files exist. Both commits verified (0e46dcc2, 1b37726a).
Content verification: Phase 55.2 (5 refs in ROADMAP), CODEX-01/02/05 (2 refs each in REQUIREMENTS),
total_phases: 11 in STATE, 3 deprecation references in capability-matrix.
