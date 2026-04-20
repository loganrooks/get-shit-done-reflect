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
  - phase: [prior phase]
    provides: [what that phase built]
provides:
  - [bullet list of what was built/delivered]
affects: [list of phase names or keywords]
tech-stack:
  added: [libraries/tools]
  patterns: [architectural/code patterns]
key-files:
  created: [important files created]
  modified: [important files modified]
key-decisions:
  - "Decision 1"
patterns-established:
  - "Pattern 1: description"
duration: Xmin
completed: YYYY-MM-DD
---

# Phase [X]: [Name] Summary (Complex)

**[Substantive one-liner describing outcome]**

## Performance
- **Duration:** [time]
- **Tasks:** [count completed]
- **Files modified:** [count]

## Accomplishments
- [Key outcome 1]
- [Key outcome 2]

## Task Commits
1. **Task 1: [task name]** - `hash`
2. **Task 2: [task name]** - `hash`
3. **Task 3: [task name]** - `hash`

## Files Created/Modified
- `path/to/file.ts` - What it does
- `path/to/another.ts` - What it does

## Decisions Made
[Key decisions with brief rationale]

## Deviations from Plan (Auto-fixed)

[If no deviations: "None - plan executed exactly as written."]

[If deviations occurred:]

**1. [Rule X - Category] Brief description**
- **Found during:** Task [N] ([task name])
- **Issue:** [What was wrong]
- **Fix:** [What was done]
- **Verification:** [How it was verified]
- **Committed in:** [commit hash]

---

**Total deviations:** [N] auto-fixed ([breakdown by rule])
**Impact on plan:** [Brief assessment]

## Issues Encountered
[Problems during planned work and resolutions]

## User Setup Required
<!-- If USER-SETUP.md was generated during execution: -->
<!-- **External services require manual configuration.** -->
<!-- See `USER-SETUP.md` in the phase directory for details. -->
<!-- If no USER-SETUP.md: -->
None - no external service configuration required.

## Next Phase Readiness
[What's ready for next phase]
[Blockers or concerns]
