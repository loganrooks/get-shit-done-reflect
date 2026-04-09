---
id: sig-2026-04-09-phase-573-deferred-audit-skill-no-command
type: signal
project: get-shit-done-reflect
tags: [audit-workflow, capability-gap, phase-scope, deferred-feature, invocable-skill, planning-gap]
created: 2026-04-09T00:00:00Z
updated: 2026-04-09T00:00:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: "57.3"
plan: "02"
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.19.1
---

## What Happened

Phase 57.3 (audit-workflow-infrastructure) completed and passed 5/5 verification, but produced only reference documents and artifact migration — no `/gsdr:audit` invocable skill. When an investigatory audit was needed on Phase 57, there was no command to reach for.

## Context

The phase CONTEXT.md explicitly deferred the `gsd-tools audit` command suite and `/gsdr:cross-model-review` to "future phases" under guardrail G-3: "infrastructure only, not workflow rewrites." The scope was constrained to conventions, templates, and metadata. The verifier checked for reference docs and migrated files — not for a callable audit skill. The phase passed its own success criteria while missing the user's primary use case.

The deferred section reads: "`gsd-tools audit` command suite — a CLI for creating, searching, and managing audits. Phase 57.3 establishes conventions; tooling is a future phase." No follow-on phase was inserted to build the command. The gap was not surfaced in verification or in the roadmap.

## Potential Cause

Phase scope was defined as "infrastructure first, tooling later" — a sensible pattern in isolation but incorrect here because the user needed an invocable audit workflow before any tooling phase was ever scheduled. The deferral appeared in the CONTEXT.md deferred section but was never flagged as a roadmap gap or a pending todo. Verification confirmed what was built, not whether what was built was sufficient to meet the actual need. The verify step's success criteria did not include "user can invoke an audit from the command line."
