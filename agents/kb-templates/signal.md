---
id: sig-{YYYY-MM-DD}-{slug}
type: signal
project: {project-name}
tags: [{tag1}, {tag2}]
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
durability: {workaround|convention|principle}
status: active
severity: {critical|notable|minor|trace}
signal_type: {deviation|struggle|config-mismatch|capability-gap|epistemic-gap|baseline|improvement|good-pattern|custom}
signal_category: {positive|negative}
phase: {phase-number}
plan: {plan-number}
polarity: {positive|negative|neutral}
source: {auto|manual}
occurrence_count: 1
related_signals: []
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-identifier}
gsd_version: {version-string}
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by {agent} at {YYYY-MM-DDTHH:MM:SSZ}"
evidence:
  supporting: []
  counter: []
confidence: medium
confidence_basis: ""
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

<!-- Field requirements by severity:
  critical: evidence.supporting REQUIRED, evidence.counter REQUIRED, confidence_basis REQUIRED
  notable: evidence RECOMMENDED, confidence RECOMMENDED
  minor: evidence OPTIONAL
  trace: not persisted to KB (collection report only)
-->

## What Happened

{Describe the deviation, struggle, or mismatch observed}

## Context

{Where and when this occurred -- phase, plan, task, what was being attempted}

## Potential Cause

{Best understanding of why this happened}
