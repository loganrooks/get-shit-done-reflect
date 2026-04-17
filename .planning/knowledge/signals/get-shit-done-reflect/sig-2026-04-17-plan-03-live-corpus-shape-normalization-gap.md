---
id: sig-2026-04-17-plan-03-live-corpus-shape-normalization-gap
type: signal
project: get-shit-done-reflect
tags: [runtime-corpus, data-shape, normalization, claude-loader]
created: "2026-04-17T01:13:15Z"
updated: "2026-04-17T01:13:15Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: "57.6"
plan: "3"
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: codex-cli
model: gpt-5.4
gsd_version: "1.18.2+dev"
provenance_schema: v1_legacy
provenance_status: legacy_mixed
detection_method: sensor-artifact
origin: local
environment:
  os: linux
  node_version: "v22.22.1"
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-17T01:13:15Z"
evidence:
  supporting:
    - "`57.6-03-SUMMARY.md` records that Claude thinking blocks in the live corpus used `content[].thinking`, requiring normalization and fallback handling."
    - "The same summary notes dispatch classification had to distinguish `parent`, `subagent`, and `headless` from live corpus signals rather than using a simpler assumed shape."
  counter:
    - "The summary also states the plan still executed as written within the owned files, kept the additive API stable, and passed rebuild/test verification."
confidence: high
confidence_basis: "The adjustment is explicitly documented as an implementation-time normalization against real corpus shape, with concrete examples in the summary."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 57.6-03 had to normalize live Claude corpus shapes that were not explicit in the plan assumptions. In particular, thinking payloads arrived under `content[].thinking`, and dispatch classification needed to separate `parent`, `subagent`, and `headless` cases based on real corpus evidence.

The plan still landed cleanly, but the implementation had to absorb data-shape variation that the plan had treated more simply.

## Context

This signal comes from `57.6-03-SUMMARY.md`, where the executor documents the adjustments required to make the loader work on the live transcript corpus. The owned files stayed stable and verification passed, so the deviation is about assumption quality rather than failed delivery.

## Potential Cause

The plan was written against a simplified mental model of the Claude corpus rather than a sufficiently exercised live sample. Once the executor hit real data, normalization logic and richer dispatch typing became necessary to preserve additive behavior.
