---
id: sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade
type: signal
project: get-shit-done-reflect
tags: [meta-signal, signal-awareness, capability-gap, self-monitoring, epistemic-gap, agent-behavior]
created: 2026-04-02T17:00:00Z
updated: 2026-04-02T17:00:00Z
durability: principle
status: active
severity: critical
signal_type: capability-gap
phase: between-milestones
plan: 0
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install, sig-2026-03-04-deliberation-skill-lacks-epistemic-verification]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.0
---

## What Happened

After a background agent broke 91 global workflow files and the orchestrator applied an untested emergency fix, the orchestrator did not create a signal. The user had to explicitly ask: "Shouldn't this be considered a signal? And I think the fact that a gap in your workflow did not register automatically as a need for a signal is also worrisome."

The orchestrator had just spent an hour discussing signal systems, failure attribution, research-grounded evaluation, and the importance of capturing traces of failures. It then experienced a significant failure cascade and did not recognize it as signal-worthy until prompted.

## Context

This meta-signal captures two interrelated gaps:

1. **Agent signal awareness gap**: The orchestrator has no procedural trigger that says "when something goes significantly wrong, create a signal." Signal creation is purely voluntary — the agent must choose to invoke `/gsdr:signal`. During emergency response (fixing broken files), the agent's attention is consumed by the fix, not by meta-reflection on the failure.

2. **Structural absence of self-monitoring**: The harness has sensors for artifacts, git history, and CI — but no sensor for the conversation itself. The user's earlier message in this session proposed a "chat history sensor" that would detect implicit signals from dialogue patterns (frustration, repeated intervention, failure cascades). This incident is a concrete example of why such a sensor is needed: the most significant failure in the session was invisible to every existing sensor.

The user connected this to their broader concern: "I always find myself in situations when I fear that the formalized workflows fail to respond adequately to a given situation, to a given demand, and I never know how to mark it in a way that such a signal won't be lost, especially when say the signal system itself is failing to respond to a certain demand."

## Potential Cause

1. **No conversation-level sensor**: Existing sensors analyze files (artifacts), commits (git), and CI runs. None analyzes the conversation itself. Failure cascades that happen in dialogue — not in committed code — are invisible to the signal system.
2. **Signal creation is voluntary, not triggered**: Unlike signal collection (which has a postlude trigger after phase execution, even though it currently has a 100% skip rate), there is no trigger that prompts signal creation after failures. The agent must recognize the need independently.
3. **Emergency response crowds out meta-reflection**: When something breaks, the agent focuses on fixing it. The cognitive pattern is "fix → report fixed" not "fix → reflect on what happened → signal → report." This is structurally similar to how production incident response teams often skip post-mortems unless structurally required.
4. **F47 (proletarianization gradient) applies**: The agent automated the response (fix the files) but failed at the judgment (recognize this as signal-worthy). The judgment layer has no structural support — it depends entirely on the agent's attention and priorities in the moment.
