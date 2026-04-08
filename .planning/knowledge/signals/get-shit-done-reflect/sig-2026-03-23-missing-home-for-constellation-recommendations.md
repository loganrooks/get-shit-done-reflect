---
id: sig-2026-03-23-missing-home-for-constellation-recommendations
type: signal
project: get-shit-done-reflect
tags:
  - deliberations
  - governance
  - roadmap
  - workflow-gap
  - artifact-home
  - planning-routing
created: "2026-03-23T07:00:00Z"
updated: "2026-03-23T07:00:00Z"
durability: convention
status: active
severity: notable
signal_type: custom
phase: 48
plan: null
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-03-06-planner-deliberation-auto-reference-gap]
runtime: codex-cli
model: gpt-5.4
gsd_version: 1.17.5+dev
detection_method: manual
origin: user-observation
---

## What Happened

While trying to turn a reviewed deliberation constellation into concrete
project guidance, it became clear that GSDR does not currently have a
first-class home or workflow step for an artifact that sits between
deliberation/review and direct roadmap modification.

The work naturally wanted an artifact that:

- brings multiple deliberations together without false harmony
- sorts recommendations by readiness and force
- distinguishes "modify roadmap routing now" from "next-milestone candidate"
  and "keep open"
- remains traceable to the deliberations and reviews that support it

Existing homes all fit awkwardly:

- `deliberations/` implies ongoing inquiry more than routed recommendation
- `research/` is usable but semantically weak for governance-facing guidance
- `ROADMAP.md` is too downstream and decision-adjacent
- `todos/` is too light for a multi-artifact recommendation layer

## Context

This surfaced after:

- five deliberations were reviewed
- the reviews were critiqued and revised
- the deliberations were revised from the stabilized review set

At that point, the next rational artifact was neither another deliberation nor
yet a roadmap patch. The repo needed a recommendation layer that could route
the reviewed constellation into later roadmap changes with clearer traceability.

The immediate local response was to create:

- `.planning/governance/recommendations/`

and place the first recommendation memo there. But this is an improvised local
solution, not yet a recognized GSDR workflow stage or artifact class.

## Potential Cause

GSDR currently has clearer homes for:

- open inquiry (`deliberations/`)
- evidence gathering and analysis (`research/`)
- adopted planning structure (`ROADMAP.md`, phases, context)

but it does not clearly model the intermediate step:

- reviewed constellation -> governance-facing recommendation -> roadmap routing

This leaves teams to improvise location, naming, and usage each time, which
risks inconsistent traceability and premature direct editing of the roadmap from
raw deliberation material.
