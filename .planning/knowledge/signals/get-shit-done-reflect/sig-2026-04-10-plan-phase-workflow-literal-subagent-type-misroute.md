---
id: sig-2026-04-10-plan-phase-workflow-literal-subagent-type-misroute
type: signal
project: get-shit-done-reflect
tags: [workflow, subagent-dispatch, plan-phase, gsdr-planner, registered-agent, misroute, dev-repo, session-log, recurring]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: "57.4"
plan: "0"
polarity: negative
source: local
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z"
evidence:
  supporting:
    - "DEVIATION.md line 17-25: plan-phase.md workflow file prescribes 'Task(prompt=... subagent_type=general-purpose ...)'. The orchestrator followed this literally and invoked subagent_type=general-purpose. But this environment (the dev repo itself) has a dedicated gsdr-planner subagent type registered."
    - "DEVIATION.md line 31-33: Workflow inadequacy — plan-phase.md does not account for environments where gsdr-planner is a registered subagent type. The subagent_type=general-purpose literal is correct for upstream installs but wrong for the dev repo."
    - "plan-phase.md workflow (installed) line 347 confirms subagent_type='general-purpose' is still hardcoded even in the installed .claude/ version"
    - ".claude/agents/gsdr-planner.md exists — confirming gsdr-planner IS a registered subagent in this environment"
    - "DEVIATION.md line 44: 'The agent was killed while starting plan 03' — partial output loss requiring archive recovery procedure"
    - "Session 486eb3f2 L144 [2026-04-10T17:40:39Z]: agent spawned with 'subagent_type': 'general-purpose' despite gsdr-planner being registered"
    - "Session 486eb3f2 L150 [2026-04-10T17:50:41Z] ASSIST: 'I used subagent_type=general-purpose following the workflow literal text, but this environment has a dedicated gsdr-planner subagent type'"
    - "Agent ran ~10 minutes producing two complete PLAN.md files before kill"
    - "Merged from log sensor signal: plan-phase.md uses literal subagent_type='general-purpose' with a role-file prompt prefix, which is correct for upstream installs but misroutes in environments where gsdr-planner is a registered subagent type"
  counter:
    - "The behavior is correct for upstream installs where gsdr-planner is not a registered subagent type"
    - "The prompt-prefix role-loading (First, read ~/.claude/agents/gsd-planner.md...) is a functional workaround in those environments"
    - "The misroute did not cause permanent data loss — output was recoverable from jsonl task log and archived in pre-phase-archive/"
    - "The agent self-corrected after user intervention"
confidence: high
confidence_basis: "DEVIATION.md provides direct testimony from the incident with agent ID, tool call trace, and explicit workflow-inadequacy analysis. The installed workflow file confirms the hardcoded literal. The registered agent file confirms the environment-specific mismatch. Log sensor provides corroborating direct agent spawn trace from session 486eb3f2. Recurrence risk is every /gsdr:plan-phase invocation in this dev repo."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During Phase 57.4 plan-phase execution (session 486eb3f2 at 2026-04-10T17:40:39Z), the orchestrator spawned a planning subagent with `subagent_type='general-purpose'` following the literal text of plan-phase.md. The agent ran for approximately 10 minutes and produced two complete PLAN.md files before being killed mid-execution. The orchestrator then acknowledged that this dev-repo environment has a dedicated `gsdr-planner` subagent type registered at `.claude/agents/gsdr-planner.md`, and the `general-purpose` literal in plan-phase.md is correct for upstream installs but wrong for the dev repo.

This signal merges evidence from the artifact sensor (DEVIATION.md testimony) and the log sensor (direct agent spawn trace from session log lines 144-150). Both sensors independently identified the same root cause: plan-phase.md hardcodes a subagent_type literal that does not account for environments where `gsdr-planner` is a registered agent.

## Context

- Phase: 57.4 (audit-skill & investigatory-type)
- Environment: dev repo for GSD Reflect itself, which has fork agents registered under `.claude/agents/`
- Workflow file: `plan-phase.md` line 347 prescribes `subagent_type='general-purpose'` with a prompt prefix that role-loads the planner spec
- Registered agents: `gsdr-planner.md` exists as an installed subagent type — the registered agent was bypassed by the literal
- Incident location: `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/killed-agent-2026-04-10-general-purpose-misroute/DEVIATION.md`

The misroute is environment-sensitive: upstream installs do not register `gsdr-planner` as a subagent type, so the `general-purpose` + prompt-prefix pattern works as a functional workaround. Only in environments with `gsdr-planner` registered (like this dev repo) does the literal misroute.

## Potential Cause

The plan-phase.md workflow was authored for the upstream install case where `gsdr-planner` is not registered as a subagent type. When the fork added `gsdr-planner.md` to the installed `.claude/agents/` directory, the plan-phase.md literal was not updated to detect and prefer the registered agent. This creates a silent misroute in any environment with both the workflow and the registered agent present — the dev repo is the clearest such environment, but any fork-adopter install that registers fork agents will hit the same issue.

The structural fix would be for plan-phase.md to detect `gsdr-planner` availability at dispatch time (e.g., via a conditional in the workflow prose or a parameterized subagent_type variable) rather than hardcoding a literal. The workaround (role-loading via prompt prefix) is inferior because it cannot supersede an actually-registered agent type, and the orchestrator has no feedback signal when the prompt-prefix approach silently fails to do what a registered agent would have done.
