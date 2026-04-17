---
phase: XX-name
plan: YY
signature:
  role: executor
  harness: "[codex-cli|claude-code|not_available]"
  platform: "[codex|claude|not_available]"
  vendor: "[openai|anthropic|not_available]"
  model: "[model-identifier|not_available]"
  reasoning_effort: "[xhigh|high|medium|not_available]"
  profile: "[quality|balanced|budget|not_available]"
  gsd_version: "[version|not_available]"
  generated_at: "YYYY-MM-DDTHH:MM:SSZ"
  session_id: "[runtime-session-id|not_available]"
  provenance_status:
    role: derived
    harness: "[exposed|derived|not_available]"
    platform: "[exposed|derived|not_available]"
    vendor: "[exposed|derived|not_available]"
    model: "[exposed|derived|not_available]"
    reasoning_effort: "[exposed|derived|not_available]"
    profile: "[exposed|derived|not_available]"
    gsd_version: "[exposed|derived|not_available]"
    generated_at: exposed
    session_id: "[exposed|derived|not_available]"
  provenance_source:
    role: artifact_role
    harness: "[runtime_context|derived_from_harness|not_available]"
    platform: "[runtime_context|derived_from_harness|not_available]"
    vendor: "[runtime_context|derived_from_harness|not_available]"
    model: "[codex_state_store|resolveModelInternal|not_available]"
    reasoning_effort: "[codex_state_store|codex_profile_resolution|not_available]"
    profile: "[config|not_available]"
    gsd_version: "[installed_harness|config|repo_mirror|not_available]"
    generated_at: writer_clock
    session_id: "[env:CODEX_THREAD_ID|env:CLAUDE_SESSION_ID|not_available]"
subsystem: [primary category]
tags: [searchable tech]
requires:
  - phase: [prior phase identifier]
    provides: [what that phase established that this plan needed]
provides:
  - [bullet list of what was built/delivered]
affects: [list of phase names or keywords]
tech-stack:
  added: [libraries/tools]
  patterns: [architectural/code patterns]
key-files:
  created: [important files created]
  modified: [important files modified]
key-decisions: []
patterns-established:
  - "[Pattern name]: [brief description]"
duration: Xmin
completed: YYYY-MM-DD
---

# Phase [X]: [Name] Summary (Minimal)

**[Substantive one-liner describing outcome]**

## Performance
- **Duration:** [time]
- **Tasks:** [count]
- **Files modified:** [count]

## Accomplishments
- [Most important outcome]
- [Second key accomplishment]

## Task Commits
1. **Task 1: [task name]** - `hash`
2. **Task 2: [task name]** - `hash`

## Files Created/Modified
- `path/to/file.ts` - What it does

## Next Phase Readiness
[Ready for next phase]
