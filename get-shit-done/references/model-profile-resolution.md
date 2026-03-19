# Model Profile Resolution

Resolve model profile once at orchestration start, then use it for all agent spawns.

## Resolution Pattern

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default: `balanced` if not set or config missing.

## Lookup Table

@~/.claude/get-shit-done/references/model-profiles.md

Look up the agent in the profile table. The table returns a symbolic tier (`opus`, `sonnet`, `haiku`). Pass this to agent spawns — the runtime resolves it to the native model.

## Per-Runtime Resolution

After looking up the symbolic tier, resolve to runtime-native parameters:

| Runtime | How symbolic tiers resolve |
|---------|--------------------------|
| **Claude Code** | Pass directly as `model` parameter (auto-resolves to latest) |
| **Codex CLI** | Map to concrete model + `reasoning_effort` (see model-profiles.md Per-Runtime Resolution table) |
| **Gemini CLI** | Use Auto mode (auto-selects best model) |
| **OpenCode** | Pass to provider default |

### Claude Code Example

```
Task(
  prompt="...",
  subagent_type="gsd-planner",
  model="{resolved_tier}"  # e.g., "opus" for quality profile
)
```

### Codex CLI Example

For Codex, both model and reasoning effort must be specified:

```
spawn_agent(
  agent="gsdr-planner",
  model="{codex_model}",
  reasoning_effort="{codex_effort}"
)
```

## Usage

1. Resolve once at orchestration start
2. Store the profile value
3. Look up each agent's symbolic tier from the table when spawning
4. Translate tier to runtime-native parameters
