# Model Profiles

Model profiles control which model tier each GSD agent uses. Tiers use symbolic class names (`opus`, `sonnet`, `haiku`) that resolve to runtime-native models.

## Profile Definitions

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| gsd-planner | opus | opus | sonnet |
| gsd-roadmapper | opus | sonnet | sonnet |
| gsd-executor | opus | sonnet | sonnet |
| gsd-phase-researcher | opus | sonnet | haiku |
| gsd-project-researcher | opus | sonnet | haiku |
| gsd-research-synthesizer | sonnet | sonnet | haiku |
| gsd-debugger | opus | sonnet | sonnet |
| gsd-codebase-mapper | sonnet | haiku | haiku |
| gsd-verifier | sonnet | sonnet | haiku |
| gsd-plan-checker | sonnet | sonnet | haiku |
| gsd-integration-checker | sonnet | sonnet | haiku |

## Per-Runtime Resolution

Symbolic tiers resolve to runtime-native models:

| Runtime | `opus` | `sonnet` | `haiku` |
|---------|--------|----------|---------|
| **Claude Code** | `opus` (auto-resolves to latest) | `sonnet` (auto-resolves) | `haiku` (auto-resolves) |
| **Codex CLI** | User's default model + `reasoning_effort: xhigh` | User's default model + `reasoning_effort: high` | `gpt-5.4-mini` + `reasoning_effort: medium` |
| **Gemini CLI** | Auto (selects best model) | Auto (selects best model) | Auto (selects best model) |
| **OpenCode** | Provider default | Provider default | Provider default |

**Claude Code** symbolic names are inherently adaptive — they always resolve to the latest model in that tier. No maintenance needed.

**Codex CLI** requires explicit model names + separate `model_reasoning_effort` parameter. The haiku tier uses a smaller model (`gpt-5.4-mini`) rather than just lower effort on the same model.

**Gemini CLI** has "Auto" modes that auto-select the best model for the task.

## Profile Philosophy

**quality** - Maximum reasoning power
- Opus-tier for all decision-making agents
- Sonnet-tier for read-only verification
- Use when: quota available, critical architecture work

**balanced** (default) - Smart allocation
- Opus-tier only for planning (where architecture decisions happen)
- Sonnet-tier for execution and research (follows explicit instructions)
- Sonnet-tier for verification (needs reasoning, not just pattern matching)
- Use when: normal development, good balance of quality and cost

**budget** - Minimal top-tier usage
- Sonnet-tier for anything that writes code
- Haiku-tier for research and verification
- Use when: conserving quota, high-volume work, less critical phases

## Resolution Logic

Orchestrators resolve model before spawning:

```
1. Read .planning/config.json
2. Get model_profile (default: "balanced")
3. Look up agent in table above
4. Pass model parameter to Task call
```

## Switching Profiles

Runtime: `/gsd:set-profile <profile>`

Per-project default: Set in `.planning/config.json`:
```json
{
  "model_profile": "balanced"
}
```

## Design Rationale

**Why opus-tier for gsd-planner?**
Planning involves architecture decisions, goal decomposition, and task design. This is where model quality has the highest impact.

**Why sonnet-tier for gsd-executor?**
Executors follow explicit PLAN.md instructions. The plan already contains the reasoning; execution is implementation.

**Why sonnet-tier (not haiku) for verifiers in balanced?**
Verification requires goal-backward reasoning — checking if code *delivers* what the phase promised, not just pattern matching. Sonnet-tier handles this well; haiku-tier may miss subtle gaps.

**Why haiku-tier for gsd-codebase-mapper?**
Read-only exploration and pattern extraction. No deep reasoning required, just structured output from file contents.
