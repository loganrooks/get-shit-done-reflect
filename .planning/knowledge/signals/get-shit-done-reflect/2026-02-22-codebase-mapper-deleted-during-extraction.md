---
id: sig-2026-02-22-codebase-mapper-deleted-during-extraction
type: signal
project: get-shit-done-reflect
tags: [extraction, quality, agent-specs, file-deletion, critical-loss]
created: 2026-02-22T00:00:00Z
updated: 2026-04-02T21:00:00Z
durability: convention
status: remediated
severity: critical
signal_type: quality-issue
phase: 22
plan: 4
polarity: negative
source: automated
occurrence_count: 1
related_signals: [sig-2026-02-22-knowledge-surfacing-silently-removed]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
lifecycle_state: remediated
lifecycle_log:
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: dismiss -- addressed by les-2026-02-28-extraction-plans-need-exhaustive-keep-lists, no recurrence since Phase 22"
evidence:
  supporting:
    - "gsd-codebase-mapper.md completely deleted during Phase 22 extraction and absent from repository for 3 days"
    - "Commit 022d068 claims to modify codebase-mapper but diff shows only gsd-debugger.md changes"
    - "Fix commit af34ff3 shows file as addition (743 insertions) indicating recreation from scratch"
  counter:
    - "File was restored in fix commit af34ff3; no recurrence of file deletion in subsequent phases"
triage:
  decision: dismiss
  rationale: "Addressed by existing lesson les-2026-02-28-extraction-plans-need-exhaustive-keep-lists. File restored in fix commit. No recurrence since Phase 22."
  priority: low
  by: reflector
  at: "2026-03-02T18:50:00Z"
---

## What Happened

`gsd-codebase-mapper.md` was completely deleted from the repository during Phase 22 extraction. The file existed before Phase 22 (created 2026-01-15, commit 411b5a3) but was not present in any commit between 022d068 (Feb 18) and af34ff3 (Feb 21). The fix commit on Feb 21 shows gsd-codebase-mapper.md as an addition (`diff-filter=A`) with 743 insertions — indicating it was recreated from scratch, not restored from git history.

The commit labeled for this work (022d068, "extract boilerplate from plan-checker, codebase-mapper, research-synthesizer") only shows `gsd-debugger.md` in its diff. The codebase-mapper, plan-checker, and research-synthesizer changes referenced in that commit message do not appear in the git diff at all.

## Context

Plan 22-04 Task 1 was supposed to add `<required_reading>` to plan-checker, codebase-mapper, and research-synthesizer. Instead, commit 022d068 only modified gsd-debugger.md (85 lines changed). The codebase-mapper was absent from the git-tracked working tree between Feb 18 and Feb 21, a 3-day window where any agent or user invoking gsd-codebase-mapper would have found it missing.

## Potential Cause

The executor agent likely deleted or failed to write gsd-codebase-mapper.md during the extraction process. Possible scenarios: (1) the agent read the file, attempted to write a modified version, but failed silently; (2) the agent's write tool call was interrupted; (3) the file was staged for deletion rather than modification. The commit message mismatch (claiming to have edited codebase-mapper but not showing it in the diff) suggests the agent may have encountered an error mid-task but did not surface it as a deviation.

## Remediation

Resolved by fix commit af34ff3 (2026-02-21). File restored to agents/gsd-codebase-mapper.md. Lesson les-2026-02-28-extraction-plans-need-exhaustive-keep-lists captures the root cause.
