<!-- GATE-12 (Phase 58 Plan 14): Failed / interrupted researcher output MUST be
     archived via `gsd-tools agent archive` before any rm or overwrite of a
     redispatch target. No current sites in this workflow delete a prior
     RESEARCH.md — this HEADNOTE enforces the convention for future edits. See
     `.planning/phases/58-structural-enforcement-gates/58-14-SUMMARY.md` for the
     envelope pattern; resolves
     `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving`.

     Envelope template for future redispatch / retry logic:

         if [ -f "$RESEARCH_PATH" ]; then
           node ~/.claude/get-shit-done/bin/gsd-tools.cjs agent archive \
             --session-id "${SESSION_ID:-${AGENT_SESSION_ID:-unknown}}" \
             --reason "failed_redispatch_researcher" \
             --phase "$PHASE_NUMBER" \
             --paths "$RESEARCH_PATH" \
             || echo "[warn] GATE-12: archive failed — proceeding with rm as fallback (evidence loss risk)"
         fi
-->

<purpose>
Research how to implement a phase. Spawns gsd-phase-researcher with phase context.

Standalone research command. For most workflows, use `/gsd:plan-phase` which integrates research automatically.
</purpose>

<process>

## Step 0: Resolve Model Profile

@~/.claude/get-shit-done/references/model-profile-resolution.md

Resolve model for:
- `gsd-phase-researcher`

## Step 1: Normalize and Validate Phase

@~/.claude/get-shit-done/references/phase-argument-parsing.md

```bash
PHASE_INFO=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs roadmap get-phase "${PHASE}")
```

If `found` is false: Error and exit.

## Step 2: Check Existing Research

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null || true
```

If exists: Offer update/view/skip options.

## Step 3: Gather Phase Context

```bash
# Phase section from roadmap (already loaded in PHASE_INFO)
echo "$PHASE_INFO" | jq -r '.section'
cat .planning/REQUIREMENTS.md 2>/dev/null || true
cat .planning/phases/${PHASE}-*/*-CONTEXT.md 2>/dev/null || true
# Decisions from state-snapshot (structured JSON)
node ~/.claude/get-shit-done/bin/gsd-tools.cjs state-snapshot | jq '.decisions'
```

## Step 4: Spawn Researcher

Before spawning, run the GATE-05 echo_delegation macro:

```bash
# GATE-05: echo delegation before spawn
# Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
SUBAGENT_TYPE="gsd-phase-researcher"
MODEL="{researcher_model}"
REASONING_EFFORT="${REASONING_EFFORT:-default}"
ISOLATION="none"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="get-shit-done/workflows/research-phase.md"
WORKFLOW_STEP="spawn_researcher"
RUNTIME="${GSD_RUNTIME:-claude-code}"

echo "[DELEGATION] agent=${SUBAGENT_TYPE} model=${MODEL} reasoning_effort=${REASONING_EFFORT} isolation=${ISOLATION:-none} session=${SESSION_ID}"

mkdir -p .planning 2>/dev/null || true
printf '{"ts":"%s","agent":"%s","model":"%s","reasoning_effort":"%s","isolation":"%s","session_id":"%s","workflow_file":"%s","workflow_step":"%s","runtime":"%s"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SUBAGENT_TYPE}" \
  "${MODEL}" \
  "${REASONING_EFFORT}" \
  "${ISOLATION:-none}" \
  "${SESSION_ID}" \
  "${WORKFLOW_FILE}" \
  "${WORKFLOW_STEP}" \
  "${RUNTIME}" \
  >> .planning/delegation-log.jsonl || true
```

```
# DISPATCH CONTRACT (restated inline per GATE-13 — compaction-resilient)
# Agent: gsd-phase-researcher
# Model: inherit          (resolved from {researcher_model} via resolveModelInternal under model_profile=quality; fork maps opus alias → inherit for Claude Code compatibility)
# Reasoning effort: default (agent-profile default; may be set via template override)
# Isolation: none
# Required inputs:
#   - Phase description, requirements, prior decisions, phase context (passed inline)
#   - .planning/phases/${PHASE}-{slug}/${PHASE}-CONTEXT.md (if exists)
# Output path: .planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md
# Codex behavior: applies-via-workflow-step
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
# Originating signal: sig-2026-04-10-researcher-model-override-leak-third-occurrence
Task(
  prompt="<objective>
Research implementation approach for Phase {phase}: {name}
</objective>

<context>
Phase description: {description}
Requirements: {requirements}
Prior decisions: {decisions}
Phase context: {context_md}
</context>

<output>
Write to: .planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md
</output>",
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}"   # BAKED IN comment: inherit (was template at authorship — 2026-04-20)
)
```

## Step 5: Handle Return

- `## RESEARCH COMPLETE` — Display summary, offer: Plan/Dig deeper/Review/Done
- `## CHECKPOINT REACHED` — Present to user, spawn continuation
- `## RESEARCH INCONCLUSIVE` — Show attempts, offer: Add context/Try different mode/Manual

</process>
