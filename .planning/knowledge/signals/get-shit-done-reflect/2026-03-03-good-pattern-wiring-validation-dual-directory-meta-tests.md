---
id: sig-2026-03-03-good-pattern-wiring-validation-dual-directory-meta-tests
type: signal
project: get-shit-done-reflect
tags:
  - testing
  - wiring-validation
  - ci
  - dual-directory
created: "2026-03-03T00:00:00Z"
updated: "2026-03-03T00:00:00Z"
durability: convention
status: active
severity: notable
signal_type: good-pattern
signal_category: positive
phase: 36
plan: 1
polarity: positive
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-03T00:00:00Z"
evidence:
  supporting:
    - Meta-test uses three targeted regex patterns rather than broad grep
    - Four exempt files identified and documented
    - "VERIFICATION.md confirms truth #3 VERIFIED"
    - Pattern directly addresses root cause of 5 consecutive CI failures in v1.16
    - 13 assertion paths corrected systematically
    - refToRepoPath now maps ~/.claude/agents/ -> agents/
    - "VERIFICATION.md verifies truths #1 and #2 fully"
  counter:
    - Meta-test effectiveness is prospective -- has not yet caught a real recurrence
    - Exempt file list requires maintenance
    - Requires developer awareness of dual-directory architecture
    - Only enforced for three specific regex patterns
confidence: high
confidence_basis: VERIFICATION.md records explicit verification of multiple related truths
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Phase 36 established two complementary patterns for preventing anti-pattern test paths from re-entering the codebase. First, a meta-test recurrence guard uses three targeted regex patterns to detect prohibited test assertion paths, with four exempt files identified and documented. Second, the npm-source-first assertion pattern was enforced systematically: 13 assertion paths were corrected, and `refToRepoPath` was updated to map `~/.claude/agents/` references to their canonical `agents/` source counterparts. Together these patterns directly address the root cause of 5 consecutive CI failures in v1.16.

Note: Merged from two artifact sensor signals covering the meta-test guard and the npm-source-first assertion pattern, which share all four tags and represent a unified dual-directory test hygiene approach.

## Context

Phase 36 (foundation-fix) targeted wiring-validation test correctness. The dual-directory architecture means tests that assert against `.claude/agents/` (the installed derived copy) rather than `agents/` (the npm source) produce false stability: they pass against the installed copy but don't validate the source being shipped. The meta-test and source-first assertion correction close this gap structurally.

## Potential Cause

The v1.16 CI failures traced to test assertions pointing at `.claude/agents/` paths. The fix required both correcting the existing 13 paths and adding a guard against future reintroduction. The use of targeted regex patterns rather than broad grep reduces false positives and makes the exempt file list tractable to maintain.
