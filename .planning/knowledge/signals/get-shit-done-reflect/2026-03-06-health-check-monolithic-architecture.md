---
type: signal
signal_type: capability-gap
severity: notable
polarity: negative
confidence: high
source: deliberation-trigger
lifecycle_state: detected
status: active
tags:
  - architecture
  - health-check
  - maintainability
  - extensibility
  - monolithic
  - deliberation:health-check-maintainability
date: "2026-03-06"
phase: "41"
project: get-shit-done-reflect
---

## What Happened

The health check system is monolithic: a single workflow file (health-check.md, 240 lines) with hardcoded category execution order and early termination rules, plus a single reference file (health-check.md, 497 lines) with all check definitions, shell patterns, and repair rules inline. Adding a new check requires coordinated edits to both files.

Phase 41 adds 11 new requirements (HEALTH-01 through HEALTH-11) that significantly expand health check scope: two-dimensional health scoring, weighted signal accumulation, regime-aware metrics, automation watchdog, rogue file detection with pattern registry, and auto-triggering at multiple points. This expansion will compound the maintenance burden of the monolithic architecture.

## Context

The sensor architecture (Phase 38) solved an analogous extensibility problem for signal collection via auto-discovered sensor files with a standard contract. No similar pattern exists for health checks.

## Potential Cause

The original health check (v1.12 Phase 06) was designed as a simple workspace validator with 6 categories of binary checks. The scope was appropriate for a monolithic design at that scale. Phase 41's expansion transforms health checks from a simple validator into a multi-dimensional scoring and automation system, outgrowing the original architecture.
