<purpose>
Interactive configuration of GSD workflow agents (research, plan_check, verifier, discuss_mode) and model profile selection via multi-question prompt. Updates .planning/config.json with user preferences.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="ensure_and_load_config">
Ensure config exists and load current state:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs config-ensure-section
INIT=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs state load)
```

Creates `.planning/config.json` with defaults if missing and loads current config values.
</step>

<step name="read_current">
```bash
cat .planning/config.json
```

Parse current values (default to `true` if not present):
- `workflow.research` — spawn researcher during plan-phase
- `workflow.plan_check` — spawn plan checker during plan-phase
- `workflow.verifier` — spawn verifier during execute-phase
- `workflow.auto_advance` (default: `false`)
- `workflow.nyquist_validation` (default: `true`)
- `workflow.discuss_mode` — `exploratory` | `discuss` | `assumptions` (default: `exploratory`)
- `workflow.research_before_questions` (default: `false`)
- `workflow.text_mode` (default: `false`)
- `model_profile` — which model each agent uses (default: `balanced`)
- `git.branching_strategy` — branching approach (default: `"none"`)
</step>

<step name="present_settings">
Use AskUserQuestion with current values pre-selected:

```
AskUserQuestion([
  {
    question: "Which model profile for agents?",
    header: "Model",
    multiSelect: false,
    options: [
      { label: "Quality", description: "Opus-tier for all decision-making agents (highest cost)" },
      { label: "Balanced (Recommended)", description: "Opus-tier for planning, sonnet-tier for execution/verification" },
      { label: "Budget", description: "Sonnet-tier for writing, haiku-tier for research/verification (lowest cost)" }
    ]
  },
  {
    question: "Spawn Plan Researcher? (researches domain before planning)",
    header: "Research",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Research phase goals before planning" },
      { label: "No", description: "Skip research, plan directly" }
    ]
  },
  {
    question: "Spawn Plan Checker? (verifies plans before execution)",
    header: "Plan Check",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Verify plans meet phase goals" },
      { label: "No", description: "Skip plan verification" }
    ]
  },
  {
    question: "Spawn Execution Verifier? (verifies phase completion)",
    header: "Verifier",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Verify must-haves after execution" },
      { label: "No", description: "Skip post-execution verification" }
    ]
  },
  {
    question: "Auto-advance after discuss/plan? (chains discuss → plan → execute)",
    header: "Auto-advance",
    multiSelect: false,
    options: [
      { label: "No (Recommended)", description: "Manual progression between stages" },
      { label: "Yes", description: "Automatically chain discuss → plan → execute" }
    ]
  },
  {
    question: "Nyquist validation? (validates phase requirements coverage)",
    header: "Nyquist",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "Validate requirements coverage after execution" },
      { label: "No", description: "Skip Nyquist validation" }
    ]
  },
  {
    question: "Git branching strategy?",
    header: "Branching",
    multiSelect: false,
    options: [
      { label: "None (Recommended)", description: "Commit directly to current branch" },
      { label: "Per Phase", description: "Create branch for each phase (gsd/phase-{N}-{name})" },
      { label: "Per Milestone", description: "Create branch for entire milestone (gsd/{version}-{name})" }
    ]
  },
  {
    question: "Discuss-phase mode? Controls how /gsd:discuss-phase gathers context.",
    header: "Discuss Mode",
    multiSelect: false,
    options: [
      { label: "Exploratory (Recommended)", description: "Preserve uncertainty, bias toward open questions, auto-select only when strongly grounded" },
      { label: "Discuss", description: "Standard steering brief — auto picks recommended defaults" },
      { label: "Assumptions", description: "Codebase-first inference, minimal user interaction — route to assumptions workflow" }
    ]
  },
  {
    question: "Research before discuss questions? (web search for best practices before each area)",
    header: "Research",
    multiSelect: false,
    options: [
      { label: "No (Recommended)", description: "Ask questions directly without prior research" },
      { label: "Yes", description: "Search for best practices before presenting options" }
    ]
  },
  {
    question: "Text mode? (plain-text menus instead of TUI selections)",
    header: "Text Mode",
    multiSelect: false,
    options: [
      { label: "No (Recommended)", description: "Use TUI menu selections (requires terminal support)" },
      { label: "Yes", description: "Plain-text numbered lists (required for remote/rc sessions)" }
    ]
  }
])
```
</step>

<step name="update_config">
Merge new settings into existing config.json:

```json
{
  ...existing_config,
  "model_profile": "quality" | "balanced" | "budget",
  "workflow": {
    "research": true/false,
    "plan_check": true/false,
    "verifier": true/false,
    "discuss_mode": "exploratory" | "discuss" | "assumptions"
  },
  "git": {
    "branching_strategy": "none" | "phase" | "milestone"
  }
}
```

Write updated config to `.planning/config.json`.
</step>

<step name="confirm">
Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SETTINGS UPDATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Setting              | Value |
|----------------------|-------|
| Model Profile        | {quality/balanced/budget} |
| Plan Researcher      | {On/Off} |
| Plan Checker         | {On/Off} |
| Execution Verifier   | {On/Off} |
| Git Branching        | {None/Per Phase/Per Milestone} |
| Discuss Mode         | {Exploratory/Discuss/Assumptions} |

These settings apply to future /gsd:plan-phase, /gsd:execute-phase, and /gsd:discuss-phase runs.

Quick commands:
- /gsd:set-profile <profile> — switch model profile
- /gsd:plan-phase --research — force research
- /gsd:plan-phase --skip-research — skip research
- /gsd:plan-phase --skip-verify — skip plan check
```
</step>

</process>

<success_criteria>
- [ ] Current config read
- [ ] User presented with 6 settings (profile + 3 workflow toggles + git branching + discuss mode)
- [ ] Config updated with model_profile, workflow, and git sections
- [ ] Changes confirmed to user
</success_criteria>
