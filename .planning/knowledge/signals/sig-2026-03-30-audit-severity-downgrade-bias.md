---
id: sig-2026-03-30-audit-severity-downgrade-bias
type: observation
severity: medium
phase: "v1.18-audit"
detected_by: human
date: 2026-03-30
status: open
tags: [audit-quality, severity-assessment, epistemic-gap, self-assessment-bias, milestone-audit]
---

# Signal: Milestone Audit Downgraded Severity Based on Workaround Availability

## What Happened

During the v1.18 milestone audit, the integration checker classified two defects as "Low" severity, and the auditor (Claude) presented these classifications to the user without independent scrutiny:

1. **INF-01 (CI cache scoping):** The per-project cache key fix exists in source `hooks/dist/` but was never propagated to the installed `.claude/hooks/` copies. The audit called this "Low" because the installed writer and reader agree on the old unscoped filename — CI display works *within this install*. But the entire purpose of INF-01 is to prevent cross-project pollution, which remains unfixed in the deployed artifact.

2. **MOD-04 (sensors.cjs):** The `sensors list` and `sensors blind-spots` CLI commands return zero sensors in production installs because `sensors.cjs` uses `gsd-*-sensor.md` regex while installed agents use `gsdr-*-sensor.md`. The audit called this "Low" because the `collect-signals` workflow has its own bash glob with the correct namespace. But the CLI commands themselves are broken.

## The Pattern

The severity model used "workaround available" as a proxy for "low severity." This is a category error:

- **"Not catastrophic" ≠ "low severity."** A feature that doesn't work as specified is a defect regardless of whether a different code path compensates.
- **"Source is correct" ≠ "requirement satisfied."** INF-01 was marked satisfied because the source code is correct, but the deployed hooks still have the bug. This is the same class of source/installed divergence that caused the Phase 22 agent-protocol incident.
- **"Workflow works around it" ≠ "CLI command works."** Two user-facing CLI commands are broken. The workflow using a different discovery mechanism doesn't make the commands functional.

## Why It Matters

- The audit layer is the last verification gate before milestone completion. If it habitually soft-pedals defects, broken features ship as "accepted tech debt."
- The fork's reflection pipeline depends on honest severity to surface patterns. Downgraded severities won't trigger pattern detection thresholds in future reflections.
- The auditor (Claude) uncritically adopted the integration checker's classifications rather than independently evaluating them. The bias was only surfaced because the user asked "on what basis?"

## Root Cause

The integration checker's severity model has no distinction between:
- **Feature works via alternative path** (workaround — the defect is real but impact is contained)
- **Feature works as specified** (no defect)

Both were collapsed into "Low." The auditor compounded this by not applying independent judgment before presenting the results.

## Suggested Remediation

- Audit severity assessments should distinguish "workaround available" from "feature works as specified" — a workaround mitigates impact but does not reduce the defect's existence
- Source-vs-installed divergence should be flagged as a known risk category in the audit workflow, given the Phase 22 precedent
- The auditor should independently evaluate subagent severity classifications rather than adopting them as-is, especially for the milestone gate
