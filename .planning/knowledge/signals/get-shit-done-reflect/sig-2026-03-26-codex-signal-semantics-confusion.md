---
id: sig-2026-03-26-codex-signal-semantics-confusion
type: signal
project: get-shit-done-reflect
tags:
  - codex
  - signal-semantics
  - knowledge-model
  - terminology
  - traceability
created: "2026-03-26T22:05:43Z"
updated: "2026-03-26T22:05:43Z"
durability: principle
status: active
severity: notable
signal_type: custom
phase: 49
plan: null
polarity: negative
occurrence_count: 1
related_signals: []
runtime: codex-cli
model: gpt-5.4
gsd_version: 1.17.5+dev
detection_method: manual
origin: user-observation
---

## What Happened

While discussing whether the unpublished active phase branch should be recorded
as a signal, Codex initially framed signals too much as "lessons" or as the
stable guidance itself. The user had to correct that framing and restate the
intended role: signals are descriptive records of what happened, which can later
justify lessons, requirements, or workflow changes.

The confusion did not corrupt project state, but it did show that Codex was not
fully aligned with the repository's own knowledge model when reasoning about why
to record a signal.

## Context

- the conversation was about whether a branch-publication workflow gap should be
  logged as a signal
- the user explicitly pointed out that a signal matters because it can later be
  cited as the reason for a requirement or milestone decision
- repository docs consistently describe signals as capturing what went wrong,
  while lessons are distilled later through reflection
- Codex corrected course once challenged, but only after initially using a
  blurrier "signals are lessons" framing

This should be treated as a Codex-side semantic mismatch, not as evidence that
the project's signal model is wrong.

## Potential Cause

Codex fell back to a generic intuitive framing of knowledge artifacts instead of
staying grounded in this repository's explicit signal/lesson split.

Likely contributing factors:

1. the signal/lesson distinction is distributed across multiple docs rather than
   summarized in one short always-loaded definition
2. generic assistant intuition can collapse "recorded observation" and
   "distilled guidance" unless the project model is re-anchored
3. the repository's own terminology is precise, but that precision is easy to
   lose during conversational reasoning if the relevant docs are not checked
