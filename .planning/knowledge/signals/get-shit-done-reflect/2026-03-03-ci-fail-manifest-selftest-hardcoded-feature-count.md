---
id: sig-2026-03-03-ci-fail-manifest-selftest-hardcoded-feature-count
type: signal
project: get-shit-done-reflect
tags: [ci, testing, deviation, manifest, test-suite-gap, verify-step]
created: 2026-03-03T18:30:00Z
updated: 2026-04-02T20:00:00Z
durability: convention
status: remediated
severity: critical
signal_type: deviation
phase: 37
plan: "01-03"
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-03-03-ci-green-unconfirmed-fix-commits-local-only, sig-2026-03-02-ci-failures-ignored-throughout-v116]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
---

## What Happened

Phase 37 (Automation Framework) added the `automation` feature to `feature-manifest.json`, bringing the total feature count from 6 to 7. The manifest self-test in `gsd-tools.test.js:2416` hardcodes `assert.strictEqual(featureNames.length, 6, ...)`. This test runs under `npm run test:upstream` (node:test runner), NOT under `npm test` (vitest). All three plan executors ran `npm test` as their verify step and saw green — but CI, which runs both test suites, caught the mismatch.

The fix was trivial (update 6→7, add automation assertion) but the detection gap is structural.

## Context

- Plan verify steps specify `npm test` — this runs vitest (tests/unit/*.test.js) but NOT the upstream gsd-tools tests (get-shit-done/bin/gsd-tools.test.js)
- CI runs 4 test targets: `npm test`, infrastructure tests, upstream gsd-tools tests, fork gsd-tools tests
- The executor agent has no awareness of CI configuration or which test suites exist beyond what the plan tells it to run
- This is the second CI-related signal in v1.17 (the first was sig-2026-03-03-ci-green-unconfirmed-fix-commits-local-only from Phase 36)

User's key question: What should the distribution of responsibilities be? Should execute-phase auto-run CI checks post-execution, or should this be a separate concern? This depends on:
1. Whether the project has CI configured (not all do)
2. Phase dependencies and recommended settings
3. The automation framework itself (what level triggers automatic CI checks)
4. Phase 39 (CI Awareness) and Phase 40 (Signal Collection Automation) are designed to close exactly this gap

## Potential Cause

1. **Plan verify steps are too narrow**: Plans specify `npm test` but the project has multiple test suites. The plan author (planner agent) doesn't inspect CI config to discover all test targets.
2. **No post-execution CI gate**: execute-phase verifies via SUMMARY.md spot-checks (file existence, git commits) but doesn't trigger or monitor CI. This is by design — CI awareness is Phase 39's scope.
3. **Hardcoded assertion is brittle**: The manifest self-test uses an exact count instead of a minimum or a known-feature-list pattern. Adding any feature breaks it.
4. **Test suite fragmentation**: Having tests in two runners (vitest + node:test) with different invocation commands creates a coverage gap that's invisible to agents told to run only one.

## Remediation

Resolved during Phase 37 (2026-03-03). Test assertion updated from 6 to 7 features, matching current feature-manifest.json.
