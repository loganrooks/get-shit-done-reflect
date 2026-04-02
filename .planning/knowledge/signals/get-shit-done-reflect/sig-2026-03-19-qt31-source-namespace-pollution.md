---
id: sig-2026-03-19-qt31-source-namespace-pollution
type: signal
project: get-shit-done-reflect
tags: [namespace, dual-directory, source-pollution, ci-failure, wiring-test, collect-signals, codex, quick-task]
created: 2026-03-19T00:00:00Z
severity: critical
signal_type: deviation
phase: quick-31
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-03-02-ci-failures-ignored-throughout-v116, sig-2026-03-19-stale-platform-claims-in-source]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.17.4
updated: 2026-04-02T21:00:00Z
lifecycle_state: remediated
---

# QT31 source namespace pollution broke CI

## What Happened

QT31 ("Upstream local Codex patches") applied `gsdr-` namespace prefixes and Codex-specific model policy content directly to the **source** file `get-shit-done/workflows/collect-signals.md` instead of only the installed Codex copy. Changes included:
- `gsd-*-sensor.md` → `gsdr-*-sensor.md` (agent naming)
- `gsd-signal-synthesizer` → `gsdr-signal-synthesizer` (subagent_type)
- `/gsd:execute-phase` → `$gsdr-execute-phase` (command prefix)
- Added Codex-specific model policy ("gpt-5.4 with reasoning_effort=medium")

This broke the CI wiring validation test: `gsdr-signal-synthesizer` was referenced as a `subagent_type` but the agent source file is `agents/gsd-signal-synthesizer.md` (gsd- prefix). The installer converts `gsd-` → `gsdr-` at install time — source files must always use the `gsd-` prefix.

## Context

The CLAUDE.md dual-directory rule states: "Always edit the npm source directories, never .claude/ directly." QT31 violated this in reverse — it injected installed-state content (gsdr- prefixes, Codex-specific model names) into source files. This is the same failure class as the Phase 22 incident (editing .claude/ instead of source) but in the opposite direction and at the content level.

The CI failure was present since commit d202a70 (2026-03-19) but went unnoticed for the entire session because:
1. CI results were not checked after the QT31 commit
2. The wiring test that caught it exists and works, but its failure didn't surface as a blocking gate or signal
3. Two more commits were made on top (deliberation, QT32) before the failure was discovered

This is also a recurrence of sig-2026-03-02-ci-failures-ignored-throughout-v116: CI failures going unnoticed because results aren't checked after commits.

## Potential Cause

Three contributing factors:
1. **Conceptual confusion**: QT31's task was "upstream local Codex patches" — the intent was to bring Codex-specific content from installed files back to source. But "upstreaming" content from an installed copy requires REMOVING runtime-specific transformations (gsdr- → gsd-, $gsdr- → /gsd:), not copying verbatim. The agent didn't distinguish between "content that should be in source" and "content that was transformed at install time."
2. **No CI check after commit**: The automation framework has signal collection as a postlude to phase execution, but quick tasks don't trigger CI verification. CI failures are only visible if someone checks.
3. **Wiring test is necessary but insufficient**: The test correctly catches the naming mismatch, but its failure mode (CI red) is passive — it doesn't create a signal or block further commits. The sig-2026-03-02-ci-failures-ignored pattern persists.

## Remediation

Resolved by revert commit c521a5e (2026-03-19, same day). Phase 50 added TST-01 namespace scan and TST-09 snapshot regression tests to prevent recurrence.
