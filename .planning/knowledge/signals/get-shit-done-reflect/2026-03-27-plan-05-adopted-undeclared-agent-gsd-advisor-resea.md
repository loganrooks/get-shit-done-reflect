---
id: sig-2026-03-27-plan-05-adopted-undeclared-agent-gsd-advisor-resea
type: signal
project: get-shit-done-reflect
tags:
  - estimation
  - agent-spec
  - plan-accuracy
  - scope-creep
  - dependency-gap
  - adoption-workflow
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 52
plan: 5
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-03-05-undeclared-claude-dir-scope-creep-plan02
  - sig-2026-03-02-plan-scope-declaration-mismatch-35-03-and-04
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.17.5+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-03-29T08:00:00Z"
evidence:
  supporting:
    - Plan 03 adopted discuss-phase.md (upstream, 1049 lines) which @-references agents/gsd-advisor-researcher.md
    - "Fix commit 5b03e80: fix(52-05): adopt advisor-researcher agent and verify full integration"
    - Actual files in phase 52-05 commits include agents/gsd-advisor-researcher.md (not declared)
    - Dependency only surfaced when wiring-validation.test.js ran in Plan 05
    - git log for 52-04 commits shows 14 files actually modified
    - "Plan 05 declared files_modified: [bin/install.js, get-shit-done/references/model-profiles.md]"
    - Plan 04 files_modified declared 22 workflow files
    - "8 files declared but not touched: audit-milestone.md, help.md, map-codebase.md, new-milestone.md, new-project.md, set-profile.md, settings.md, update.md"
    - "Plan 03 SUMMARY: 'None - plan executed exactly as written' (gap not caught during Plan 03 execution)"
    - Plan 03 files_modified declares only get-shit-done/workflows/discuss-phase.md and quick.md — no agent dependency listed
    - "SUMMARY.md Decisions: '10 of 22 files had no informational commands needing guards — left unchanged'"
    - "SUMMARY.md: 'discuss-phase.md (adopted in Plan 03) contains @-reference to agents/gsd-advisor-researcher.md which did not exist in the fork, causing wiring-validation.test.js to fail'"
  counter:
    - SUMMARY explicitly records the decision not to touch these files, so no information was lost
    - Gap was caught and fixed within the same phase (Plan 05) with no quality impact on final output
    - Phase verification still passed 15/15 must-haves; no quality impact
    - Over-declaration is conservative planning — preferable to under-declaring and missing files
    - Upstream @-references are not always transitively visible during adoption planning
    - Wholesale-replace workflow makes deep @-reference scanning expensive at planning time
    - Extra file represents a legitimate Rule 3 (blocking) auto-fix per fork deviation rules
    - The dependency was implicit — upstream's discuss-phase.md references the agent without Plan 03 documenting the dependency
    - Executor correctly identified at runtime which files needed changes and which did not
confidence: high
confidence_basis: Direct comparison of declared files_modified in Plan 05 PLAN.md against git log --name-only for commits matching (52-05); SUMMARY.md confirms undeclared file with explicit deviation entry
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Plan 05 adopted undeclared agent (gsd-advisor-researcher.md) as auto-fix for broken @-reference introduced by Plan 03

Evidence:
- Plan 03 adopted discuss-phase.md (upstream, 1049 lines) which @-references agents/gsd-advisor-researcher.md
- Fix commit 5b03e80: fix(52-05): adopt advisor-researcher agent and verify full integration
- Actual files in phase 52-05 commits include agents/gsd-advisor-researcher.md (not declared)
- Dependency only surfaced when wiring-validation.test.js ran in Plan 05
- git log for 52-04 commits shows 14 files actually modified

## Context

Phase 52, Plan 5 (git sensor).
Merged with git signal: Plan 03 adopted discuss-phase.md without declaring its agent

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
