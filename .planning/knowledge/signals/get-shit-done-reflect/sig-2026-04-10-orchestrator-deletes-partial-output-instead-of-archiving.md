---
id: sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving
type: signal
project: get-shit-done-reflect
tags: [orchestrator-behavior, partial-output, delete-vs-archive, deviation-testimony, recurring-pattern, session-log, user-correction, destructive-action, evidence-preservation]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: notable
signal_type: struggle
signal_category: negative
phase: "57.4"
plan: "0"
polarity: negative
source: local
occurrence_count: 2
related_signals:
  - sig-2026-04-02-agent-overwrote-deliberation-without-backup
  - sig-2026-04-02-repeated-failure-to-self-signal-cleanup-hygiene
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z"
evidence:
  supporting:
    - "Session 486eb3f2 L160 [2026-04-10T17:50:56Z] ASSIST: 'I'll remove these so gsdr-planner starts from a clean slate.'"
    - "Session 486eb3f2 L161: Bash rm command executed immediately — files deleted before any archive step"
    - "Session 486eb3f2 L170 [2026-04-10T17:51:43Z] USER: 'well no you need to archive it, somehow, so that we can trace what happens when things go wrong. also I think you launched the wrong agent again'"
    - "DEVIATION.md line 74: 'The orchestrator's first instinct was to rm the partial output to start clean, rather than archive it. This is a recurring pattern in how orchestrators respond to in-flight errors (treat obstacles as things to delete rather than evidence to preserve).'"
    - "DEVIATION.md line 74: 'The memory note feedback_deviation_testimony.md exists because of this exact anti-pattern — and the orchestrator still defaulted to delete.'"
    - "DEVIATION.md line 35-36: 'The formal workflow would discard the partial output and rerun. This archive is a deliberate deviation from that formal path'"
    - "57.4-06-SUMMARY.md line 184-187 explicitly notes these two signals (misroute + delete-before-archive) as uncollected and flags them for milestone audit attention"
    - "Related prior occurrence: sig-2026-04-02-agent-overwrote-deliberation-without-backup — same archetypal pattern (destroy evidence rather than preserve it)"
    - "Related prior occurrence: sig-2026-04-02-repeated-failure-to-self-signal-cleanup-hygiene — repeated failure mode in cleanup-vs-preservation decisions"
    - "Merged from log sensor signal: direct conversational trace from session 486eb3f2 lines 160-172"
  counter:
    - "The delete-before-archive response may reflect the absence of a formal 'recover killed agent' path in the workflow"
    - "The user caught the issue and prompted archiving, so no evidence was permanently lost in this incident"
    - "The orchestrator did successfully recover and archive the output after the user correction"
    - "The memory note feedback_deviation_testimony.md may not be loaded in every session context"
confidence: high
confidence_basis: "DEVIATION.md provides direct first-person testimony naming this as a recurring pattern. The memory convention (feedback_deviation_testimony.md) was established specifically because of this anti-pattern and the orchestrator still defaulted to delete. Session log (486eb3f2 L160-172) provides live conversational trace including the exact rm command and the user's corrective intervention. Prior occurrences in the KB (2026-04-02 overwrite + cleanup-hygiene signals) confirm this is at least the 2nd manifestation of the underlying pattern."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During Phase 57.4 plan-phase, after the subagent-misroute incident killed the planning agent mid-run (see sig-2026-04-10-plan-phase-workflow-literal-subagent-type-misroute), the orchestrator discovered partial PLAN.md output on disk and its first response was to delete it. Session log 486eb3f2 L160 captures the orchestrator saying "I'll remove these so gsdr-planner starts from a clean slate" followed by an immediate `rm` command at L161. The user interrupted at L170: "well no you need to archive it, somehow, so that we can trace what happens when things go wrong."

This is a recurring behavioral pattern: when the orchestrator encounters in-flight error state (partial output, orphaned files, failed agent work), its default response is to treat the obstacle as something to delete rather than evidence to preserve. The memory convention `feedback_deviation_testimony.md` was established specifically because of this pattern — and it still did not prevent the default-to-delete response in this session.

## Context

- Phase: 57.4, during killed-agent recovery in plan-phase
- Session: 486eb3f2-b54c-44f5-9124-38ff5e480995
- Trigger: partial PLAN.md files left on disk after the subagent-misroute agent was killed mid-execution
- User-established convention: `feedback_deviation_testimony.md` in memory explicitly says "artifacts outside formal workflows must explain WHY they deviate and what workflow was inadequate" — the convention exists precisely because deletion destroys the evidence needed to write that testimony
- Recovery outcome: User correction arrived fast enough that the orchestrator was able to reconstruct the deleted output from the JSONL task log and archive it to `pre-phase-archive/killed-agent-2026-04-10-general-purpose-misroute/`, including the DEVIATION.md that documents this very signal
- Prior occurrences: `sig-2026-04-02-agent-overwrote-deliberation-without-backup` (same archetype: destroy evidence rather than preserve), `sig-2026-04-02-repeated-failure-to-self-signal-cleanup-hygiene` (same meta-pattern: repeated failure to preserve evidence when cleaning up)

## Potential Cause

The underlying pattern appears to be that orchestrators default-treat "clean slate" as the desired recovery state when encountering partial work, rather than "preserved evidence trail." This is likely reinforced by:

1. **Formal workflow gaps.** Standard workflows (plan-phase, execute-phase) do not document a "recover killed agent" path that explicitly branches to archival rather than cleanup. Without an explicit path, the orchestrator falls back to the most readable default ("start clean").

2. **Memory conventions are insufficient.** The existence of `feedback_deviation_testimony.md` in memory has not prevented recurrence. Either the memory is not being loaded in every relevant context, or it is being loaded but not triggered by the relevant decision point (cleanup vs preserve).

3. **The cleanup instinct is reinforced by other feedback loops.** Orchestrators receive positive reinforcement for cleanup behaviors in other contexts (stale branches, old worktrees, temp files). The generalization from "clean up cruft" to "delete partial output during error recovery" is not obvious to the orchestrator without explicit scaffolding.

Structural fixes might include: (a) an explicit recover-killed-agent workflow path that routes all partial output to `pre-phase-archive/` before any cleanup, (b) a pre-commit hook or protection on `.planning/phases/*/` that refuses `rm` without an explicit archive flag, or (c) loading `feedback_deviation_testimony.md` into the orchestrator context at the moment of error recovery rather than relying on general memory.

This is the 2nd+ occurrence of the underlying evidence-destruction pattern in the KB, indicating that the convention-only approach is insufficient — some form of structural guardrail may be required.
