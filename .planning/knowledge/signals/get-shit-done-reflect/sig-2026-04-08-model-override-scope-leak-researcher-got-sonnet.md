---
id: sig-2026-04-08-model-override-scope-leak-researcher-got-sonnet
type: signal
project: get-shit-done-reflect
tags: [model-override, agent-dispatch, orchestrator-error, scope-leak, researcher]
created: 2026-04-08T22:30:00Z
updated: 2026-04-08T22:30:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 56
plan: 0
polarity: negative
detection_method: manual
origin: user-observation
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.0
lifecycle_state: detected
lifecycle_log:
  - "detected by user at 2026-04-08T22:30:00Z: user asked 'why are you using sonnet for phase researcher?'"
---

## What Happened

User said "use sonnet for executor (override)" before Phase 55 execution. During Phase 56's plan-phase workflow, the orchestrator applied the Sonnet override to the gsdr-phase-researcher agent, which should have used its configured model (inherit = Opus). The init JSON clearly showed `researcher_model: "inherit"` but the orchestrator passed `model="sonnet"` to the researcher agent spawn.

## Why It Matters

Model overrides are scope-specific — "use X for Y" means only agent type Y gets the override. Applying it broadly degrades research quality (Sonnet vs Opus for domain analysis) and violates the user's intent. The user caught it before the researcher completed and had to interrupt to correct.

## Context

The orchestrator correctly used Sonnet for executor agents in Phase 55 (4 waves) and Phase 56 (3 waves), and correctly used Sonnet for the verifier (configured as `verifier_model: "sonnet"`). The leak only occurred for the researcher spawn in plan-phase, suggesting the orchestrator conflated "user said Sonnet" with "use Sonnet everywhere" rather than checking the init JSON per-agent.
