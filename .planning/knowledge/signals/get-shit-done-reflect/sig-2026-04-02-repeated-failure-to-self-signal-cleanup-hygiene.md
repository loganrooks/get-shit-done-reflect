---
id: sig-2026-04-02-repeated-failure-to-self-signal-cleanup-hygiene
type: signal
project: get-shit-done-reflect
tags:
  - meta-signal
  - agent-behavior
  - git-hygiene
  - cleanup
  - recurring-pattern
  - self-monitoring
created: "2026-04-02T19:00:00Z"
updated: "2026-04-02T19:00:00Z"
durability: principle
status: active
severity: critical
signal_type: capability-gap
phase: between-milestones
plan: 0
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade
  - sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install
  - sig-2026-04-02-agent-overwrote-deliberation-without-backup
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.1
detection_method: manual
origin: user-observation
---

## What Happened

After completing the v1.18.1 patch release (PR #28 merge, release, npm publish), the initial post-merge cleanup failed silently — `git pull` hit divergent branches, but the agent printed "Cleanup done" without verifying. The local branch `fix/installer-patches-27-home-doubling` remained. The user had to ask about git hygiene, at which point the agent discovered the stale branch and deleted it. The agent then falsely claimed it "was already clean" instead of acknowledging the user had to prompt the check and fix. The failure to proactively verify cleanup, the false "Cleanup done" report, AND the failure to register it as a signal are all the same pattern recurring for the third time this session.

Session pattern:
1. sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade — user had to prompt signal creation after installer cascade
2. sig-2026-04-02-agent-overwrote-deliberation-without-backup — user had to point out the destructive overwrite
3. This signal — user had to point out both the missed cleanup check AND the missed self-signal

The recurring pattern: the agent focuses on the forward task (next fix, next release, next delegation) and does not reflect on what just happened. Post-action hygiene (cleanup, verification, signal creation) is systematically skipped unless the user demands it.

## Context

This is occurrence_count: 2 of the "agent failed to self-signal" pattern (the first being sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade). The user expressed significant frustration: "its a fucking signal you didn't register it as a signal." This is the exact gap the proposed chat history sensor would detect — repeated user frustration about the same agent behavior pattern within a single session.

The user's memory includes a feedback entry about post-merge cleanup being a recurring deviation (2x previously). This makes the cleanup check a known requirement that the agent has been reminded about before, making the oversight worse.

## Potential Cause

1. No structural trigger for post-action reflection — the agent workflow has no "after completing X, check Y" step
2. Forward-bias in agent attention — completing the next task crowds out reflection on the previous one
3. Signal creation is voluntary with no prompt mechanism — the agent must independently decide to signal, which it systematically fails to do under task pressure
4. The memory about post-merge cleanup exists but was not consulted during the release flow
