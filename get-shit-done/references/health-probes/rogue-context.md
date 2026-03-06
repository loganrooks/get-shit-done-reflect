---
probe_id: rogue-context
category: Rogue File Context
tier: full
dimension: workflow
execution: agent
depends_on: [rogue-files]
---

# Rogue File Context Extraction Probe

## Purpose

When the rogue-files probe detects unexpected files, this probe extracts creation context for each rogue file via git log and categorizes it as either:

1. **Agent-ignorance**: The system has a formal place for this file, but the creating agent didn't know about it. Example: a debug log placed at .planning/debug.md when .planning/debug/ exists.

2. **Workflow-gap**: No formal place exists for this type of artifact. The file represents a genuine gap in the workflow structure. Example: a brainstorm file with no corresponding workflow step.

## Execution

This probe runs as a subagent. The health check workflow spawns this probe as a Task() when rogue-files returned any WARNING findings.

### Input

The executing agent receives the list of rogue files from the rogue-files probe results (passed as context by the workflow executor).

### Process

For each rogue file:

1. **Extract creation context via git log:**
```bash
# When was this file first added?
git log --diff-filter=A --format="%H %ai %s" -- "{filepath}" 2>/dev/null | tail -1
```

2. **Determine the creating commit's phase context:**
```bash
# What phase was active when this file was created?
git log --diff-filter=A --format="%H" -- "{filepath}" 2>/dev/null | tail -1 | xargs -I{} git show {}:.planning/STATE.md 2>/dev/null | head -5
```

3. **Categorize:**
   - Check if the file's content type has a formal home in the workflow:
     - `.md` files: check if content matches a known template (PLAN, SUMMARY, CONTEXT, RESEARCH, deliberation, signal, spike)
     - Config/JSON files: check if it belongs in .planning/config.json or a known config location
     - Script files: check if it belongs in a bin/ or scripts/ directory
   - If formal home exists but file is misplaced: **agent-ignorance**
   - If no formal home exists: **workflow-gap**

### Output

Produce structured output within SENSOR OUTPUT delimiters:

```
## SENSOR OUTPUT
{
  "probe_id": "rogue-context",
  "checks": [
    {
      "id": "ROGUE-CTX-01",
      "description": "Rogue file categorization for {filepath}",
      "status": "WARNING",
      "detail": "agent-ignorance: file should be in .planning/debug/ (created by phase 12 commit abc123)",
      "data": {
        "filepath": "{path}",
        "category": "agent-ignorance|workflow-gap",
        "created_by": "{commit hash}",
        "created_at": "{date}",
        "creating_phase": "{phase or unknown}",
        "suggested_location": "{path or null}"
      }
    }
  ],
  "dimension_contribution": {
    "type": "workflow",
    "signals": { "critical": 0, "notable": N, "minor": 0 }
  }
}
## END SENSOR OUTPUT
```

### Categorization Heuristics

- File in `.planning/` root that looks like a phase artifact (contains "Phase" or "Plan" in name) --> agent-ignorance (should be in phases/)
- File in `.planning/` root that looks like a deliberation (contains "deliberation" in name) --> agent-ignorance (should be in deliberations/)
- File with no recognizable pattern --> workflow-gap
- Empty or near-empty files --> workflow-gap (likely abandoned scratch work)
- Files with timestamps in name --> likely temporary, workflow-gap

## Dependency Behavior

This probe only runs when `tier: full` is active (--full flag) AND when rogue-files found WARNINGs. The `depends_on: [rogue-files]` field ensures the workflow skips this probe if rogue-files found no issues (no WARNINGs or FAILs = all dependencies "passed" cleanly).

## Workflow Integration

The health check workflow (refactored in Plan 02) handles `execution: agent` by spawning a Task() with the probe file as the agent spec, passing the rogue file list as context. The agent runs the git commands, reasons about categorization, and outputs within SENSOR OUTPUT delimiters.
