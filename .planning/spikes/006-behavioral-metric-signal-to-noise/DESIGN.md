---
mode: research
status: complete
round: 1
---

# Spike Design: Behavioral Metric Signal-to-Noise

**Phase:** 57
**Type:** Exploratory
**Created:** 2026-04-09

## Open Question

Can we derive useful behavioral signals from `first_prompt` text, `message_hours[]` distribution, and `user_response_times[]` variance in session-meta data?

## Hypothesis

At least 2 of the 3 candidate metrics (first_prompt patterns, message_hours entropy, response_time variance) show distinguishable patterns across session types or outcomes.

## Success Criteria

Identify at least 2 behavioral metrics with enough signal-to-noise ratio to include in the telemetry baseline.

## Experiment Plan

Research-mode spike: analyze existing 268 session-meta files (265 parseable).

1. **first_prompt analysis** — categorize and cross-reference with outcomes
2. **message_hours[] analysis** — session fragmentation entropy
3. **user_response_times[] analysis** — frustration signatures and CV
