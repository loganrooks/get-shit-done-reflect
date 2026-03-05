---
id: sig-2026-02-28-sh-script-path-not-in-agents-dir
type: signal
project: get-shit-done-reflect
tags: [deviation, plan-accuracy, path-resolution, installer, dual-directory]
created: 2026-02-28T18:30:00Z
updated: 2026-02-28T18:30:00Z
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 31
plan: 3
polarity: negative
source: auto
occurrence_count: 2
related_signals: [SIG-20260222-loadmanifest-source-repo-path-gap]
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.15.6
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-collector at 2026-02-28T18:30:00Z"
evidence:
  supporting:
    - "31-03-PLAN.md listed 'agents/kb-rebuild-index.sh' as the file to modify under files_modified"
    - "31-03-SUMMARY.md auto-fix #1: 'Plan references agents/kb-rebuild-index.sh but the file only exists at .claude/agents/kb-rebuild-index.sh. The installer comment (line 369) documents that .claude/agents/ is the source of truth for .sh scripts'"
    - "The installer explicitly documents that .sh scripts live in .claude/agents/ (not agents/), unlike .md agent specs which live in agents/. This is a dual-directory architecture exception that the plan did not account for."
  counter:
    - "The CLAUDE.md rule about always editing npm source directories is clear for .md files but the exception for .sh scripts is documented only in an installer comment -- this is an easy omission to make"
    - "SIG-20260222-loadmanifest-source-repo-path-gap was already in the KB documenting a similar path-resolution issue; the pattern is known but not yet captured in a planning checklist"
confidence: high
confidence_basis: "Auto-fix was logged explicitly in SUMMARY.md with the reason. The plan's files_modified list directly shows the incorrect path. High confidence in both detection and cause."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 31-03 listed `agents/kb-rebuild-index.sh` in its `files_modified` frontmatter and in the task action, but this file does not exist at that path. The canonical source of truth for `.sh` scripts is `.claude/agents/kb-rebuild-index.sh` -- unlike `.md` agent specs which live in `agents/` (npm source), shell scripts reside in `.claude/agents/` directly. The executor discovered this discrepancy during Task 2 and applied a blocking (Rule 3) auto-fix by editing `.claude/agents/kb-rebuild-index.sh` instead.

## Context

Phase 31, Plan 03, Task 2 -- adding lifecycle_state column to the kb-rebuild-index.sh script. The CLAUDE.md dual-directory architecture rule clearly documents that `.md` agent specs are edited in `agents/` (npm source), but the exception for `.sh` scripts is documented only in an installer comment on line 369 of `bin/install.js`. The planner did not consult the installer source to verify which file type goes where.

This is the second recorded instance of path resolution confusion in plan specs for this project. The first (SIG-20260222-loadmanifest-source-repo-path-gap, Phase 23) involved a function that missed the source-repo resolution context. Both stem from the same root cause: the dual-directory/multi-context architecture is complex and plan specs frequently omit or mis-specify file paths.

## Potential Cause

The CLAUDE.md rule about editing npm source directories applies cleanly to `.md` files but the exception for `.sh` scripts is buried in installer code comments rather than in CLAUDE.md itself. The planner followed the documented convention for `.md` files and applied it to `.sh` files without verifying the exception. A planning checklist or CLAUDE.md note about `.sh` script locations would prevent this recurrence.
