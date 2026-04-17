---
created: 2026-04-17T00:32:14.343Z
title: Add max model profile for xhigh executors and verifiers
area: tooling
priority: MEDIUM
source: phase
status: pending
files:
  - get-shit-done/bin/lib/model-profiles.cjs
  - get-shit-done/bin/lib/config.cjs
  - .planning/config.json
  - .codex/get-shit-done-reflect/workflows/help.md
---

## Problem

The current GSD profile system tops out at `quality`, and the profile mapping only selects
symbolic model tiers (`opus` / `sonnet` / `haiku`). In Codex, there is no persisted way to say
"run critical agents at max reasoning effort" even when that is desirable for executors and
verifiers. During Phase 57.6, executor agents were forced to `xhigh` manually at spawn time to
honor repository policy, but that behavior is not represented in the shared GSD profile system.

## Solution

Add a new `max` profile above `quality` that preserves backward compatibility while giving Codex a
stronger top-end setting. Scope should include:

- extend the model-profile map to accept `max`
- define Codex resolution so `max` becomes top model selection plus `reasoning_effort: xhigh` for
  executors, verifiers, and other critical agents
- update config/profile-setting flows so `max` is selectable and persisted cleanly
- update help/docs so users understand the difference between `quality` and `max`

Keep `quality` semantics unchanged so existing projects do not silently shift behavior.
