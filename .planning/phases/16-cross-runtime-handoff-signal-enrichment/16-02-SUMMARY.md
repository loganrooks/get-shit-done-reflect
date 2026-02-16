---
phase: 16-cross-runtime-handoff-signal-enrichment
plan: 02
subsystem: signal-enrichment
tags: [signals, runtime-provenance, capability-gap, cross-runtime, schema]
requires:
  - phase: 02-signal-collector
    provides: "Signal template, knowledge-store schema, signal-detection reference"
  - phase: 13-installer-path-replacement
    provides: "Two-pass path replacement enabling runtime detection from path prefix"
provides:
  - "Signal template with optional runtime/model fields"
  - "capability-gap signal type for tracking degraded execution"
  - "Runtime/model population in both automatic and manual signal collection"
  - "Capability gap signal logging in execute-phase orchestrator"
affects: [signal-collector, signal-workflow, execute-phase, reflection-engine]
tech-stack:
  added: []
  patterns: ["runtime detection via path prefix", "best-effort model self-identification", "trace-severity capability gap signals"]
key-files:
  created: []
  modified:
    - .claude/agents/kb-templates/signal.md
    - .claude/agents/knowledge-store.md
    - get-shit-done/references/signal-detection.md
    - .claude/agents/gsd-signal-collector.md
    - get-shit-done/workflows/signal.md
    - get-shit-done/workflows/execute-phase.md
key-decisions:
  - "Severity enum aligned to critical|notable (matching signal-detection.md actual usage, not legacy high|medium|low)"
  - "Runtime/model fields are optional -- existing signals remain valid without migration"
  - "Capability gap signals are trace severity by design (report-only, not persisted to KB)"
patterns-established:
  - "Runtime detection via path prefix: LLM infers runtime from workflow file paths installed per-runtime"
  - "Model self-identification: LLM reports its own model name as best-effort metadata"
  - "Capability gap signal pattern: trace-severity, neutral polarity, report-only logging in orchestrator Else branches"
duration: 4min
completed: 2026-02-11
---

# Phase 16 Plan 02: Signal Enrichment Summary

**Signal schema extended with runtime/model provenance fields and capability-gap type for cross-runtime debugging and degraded execution tracking**

## Performance
- **Duration:** 4 minutes
- **Tasks:** 3/3 completed
- **Files modified:** 6

## Accomplishments
- Extended signal template with optional `runtime:` and `model:` fields for cross-runtime provenance
- Added `capability-gap` as a valid signal_type across all schema definitions
- Aligned severity enum from `critical|high|medium|low` to `critical|notable` (matching signal-detection.md actual usage)
- Added Section 12 "Capability Gap Detection (SGNL-07)" to signal-detection.md
- Signal collector agent now detects runtime from path prefix and model from self-knowledge
- Manual signal workflow now populates runtime/model and shows them in preview
- execute-phase.md logs trace-severity capability-gap signals in both capability_check Else branches

## Task Commits
1. **Task 1: Extend signal schema with runtime/model fields and capability-gap type** - `e9b32ed`
2. **Task 2: Add runtime/model population to signal collector and manual signal workflow** - `77bfead`
3. **Task 3: Add capability gap signal logging to execute-phase workflow** - `1d74cfb`

## Files Created/Modified
- `.claude/agents/kb-templates/signal.md` - Signal template with runtime/model fields and updated enums
- `.claude/agents/knowledge-store.md` - Signal extensions table with runtime/model rows and updated signal_type enum
- `get-shit-done/references/signal-detection.md` - Section 12 capability gap detection, severity table update, schema extensions with runtime/model
- `.claude/agents/gsd-signal-collector.md` - Step 3.0 runtime/model detection, classification and writing steps updated
- `get-shit-done/workflows/signal.md` - Runtime/model detection in context extraction, template, preview, and design notes
- `get-shit-done/workflows/execute-phase.md` - Capability gap signal logging in both capability_check Else branches

## Decisions & Deviations

### Decisions Made
1. **Severity enum alignment:** Changed signal template severity from `{critical|high|medium|low}` to `{critical|notable}` to match signal-detection.md Section 6 which only uses critical/notable/trace (and trace is not persisted).
2. **Trace-only capability gaps:** Capability gap signals are trace severity by design -- they appear in collection reports but are NOT persisted to KB, preventing noise from repetitive "no task_tool in Codex" entries.
3. **Best-effort provenance:** Both runtime and model fields are omitted rather than guessed incorrectly when detection is uncertain.

### Deviations from Plan
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Signal enrichment complete (SIG-01 through SIG-04)
- Combined with Plan 16-01 (handoff), Phase 16 should be ready for verification
- The reflection engine (future) can now leverage runtime/model metadata for cross-runtime pattern analysis
- Capability gap tracking provides data for future runtime support improvements
