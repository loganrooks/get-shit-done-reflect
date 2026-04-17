---
id: sig-2026-04-17-codex-auto-compact-prompt-parity-gap
type: signal
project: get-shit-done-reflect
tags: [codex, claude, platform-parity, auto-compact, compaction, delegation-policy, workflow-behavior]
created: "2026-04-17T06:23:16Z"
updated: "2026-04-17T06:23:16Z"
durability: principle
status: active
severity: notable
signal_type: capability-gap
phase: "57.7"
plan: "10"
polarity: negative
source: manual
occurrence_count: 3
related_signals: [sig-2026-03-24-codex-delegation-policy-hidden-from-config]
runtime: codex-cli
model: gpt-5.4
gsd_version: "1.19.4+dev"
detection_method: manual
origin: user-observation
---

## What Happened

During the Phase 57.7 execute-phase conversation, the user surfaced a follow-on
parity concern: Codex has an auto-compact prompt setting, and the
Codex-versus-Claude platform parity work may need to treat that as a real
workflow concern rather than an incidental runtime detail.

The immediate issue was that delegated execution expectations were not carried
cleanly by the effective runtime behavior. The existing parity signal already
covered the hidden delegation-policy mismatch. This conversation adds a more
specific concern: if Codex can inject an auto-compact prompt, that mechanism may
need to restate workflow-critical execution norms such as delegated
`$gsdr-execute-phase` behavior, or the same mismatch can recur after context
compression or handoff.

## Context

The local GSD skill and workflow for `$gsdr-execute-phase` explicitly describe a
lean orchestrator that spawns subagents. At the same time, Codex behavior in
this session was shaped by a higher-priority runtime rule that was not visible
in repo files. The user then asked whether the Codex auto-compact prompt should
be considered as part of the Codex/Claude platform parity phase so this class
of mismatch does not keep recurring.

This is not a claim that auto-compaction itself caused the delegation miss in
this exact moment. It is a narrower design observation: parity currently tracks
visible capability surfaces better than it tracks runtime-specific continuity
mechanisms that can preserve or erase workflow intent across compression,
handoff, or resumed execution.

## Potential Cause

1. Platform parity currently models visible tool capability better than hidden
   policy or continuity behavior.
2. The repo tracks delegation expectations in skills and workflows, but not the
   runtime-specific mechanisms that may be needed to preserve those expectations
   after compaction.
3. Codex has runtime-specific behavior and settings that Claude-oriented
   workflows do not currently account for explicitly.
4. The capability matrix and config surface do not currently expose a concept
   like "auto-compact prompt required to preserve workflow-critical norms" for
   cross-runtime execution.
