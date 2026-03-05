---
id: sig-2026-03-02-requirements-lack-motivation-traceability
date: 2026-03-02
severity: notable
type: process-gap
tags: [requirements, traceability, signal-lifecycle, template]
project: get-shit-done-reflect
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.16.0"
status: detected
---

# Requirements Lack Motivation Traceability

## Observation

The requirements template (`get-shit-done/templates/requirements.md`) includes a Traceability section mapping requirements → phases, but has no mechanism for mapping requirements → their motivations (signals, lessons, patterns, research findings, deliberation decisions, or user requests).

## Evidence

- All v1.12–v1.16 milestone requirements were defined without citing what motivated them
- The signal lifecycle tracks signal → triage → plan (via `resolves_signals`), but there is no formal linkage at the requirement level
- During v1.17 scoping, motivation citations were added ad-hoc to each requirement — this pattern should be formalized
- The `resolves_signals` field on plans is one step removed from requirements; a requirement could exist for reasons unrelated to signals (user request, research finding, deliberation decision)

## Context

Discovered during v1.17 `/gsd:new-milestone` deliberation session. User asked: "how are we connecting these to signals or issues identified?" — revealing that the requirements definition process had no formal linkage to motivating evidence.

## Impact

- Requirements without cited motivations are harder to prioritize and may represent speculative scope creep
- Signal → remediation traceability is incomplete: signals get triaged and addressed via plans, but the requirement layer has no bidirectional linkage
- Difficult to answer "why does this requirement exist?" after the fact

## Counter-evidence

- The `resolves_signals` field on plans does provide some signal → plan linkage
- Requirements are typically defined in conversation with the user, so motivation is contextually obvious at definition time (even if not recorded)
