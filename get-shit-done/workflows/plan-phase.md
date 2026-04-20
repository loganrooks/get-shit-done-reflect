<!-- text_mode: this workflow is primarily agent-driven (Task() dispatch to
     gsd-phase-researcher / gsd-planner / gsd-plan-checker). No user-facing
     AskUserQuestion or readline prompts exist at this time, so the
     workflow.text_mode config flag is a documented no-op here.
     GATE-08d contract: future user-prompt additions MUST honor the
     WORKFLOW_TEXT_MODE branching pattern defined in
     docs/workflow-discuss-mode.md §3. Plan 17 verifier greps this comment. -->

<!-- GATE-12 (Phase 58 Plan 14): Failed / interrupted planner or plan-checker
     output MUST be archived via `gsd-tools agent archive` before any rm or
     overwrite of a redispatch target. The revision loop in Step 12 updates
     PLAN.md files in place (see research R3 notation for plan-phase.md:450-451
     "Planner (iterate)"); if future edits add explicit delete-then-rewrite
     logic, wrap with the envelope below first. See
     `.planning/phases/58-structural-enforcement-gates/58-14-SUMMARY.md` for the
     envelope pattern; resolves
     `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving`.

     Envelope template for future redispatch / retry logic:

         if [ -f "$PLAN_PATH" ]; then
           node ~/.claude/get-shit-done/bin/gsd-tools.cjs agent archive \
             --session-id "${SESSION_ID:-${AGENT_SESSION_ID:-unknown}}" \
             --reason "failed_redispatch_planner" \
             --phase "$PHASE_NUMBER" \
             --paths "$PLAN_PATH" \
             || echo "[warn] GATE-12: archive failed — proceeding with rm as fallback (evidence loss risk)"
         fi
-->

<purpose>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents with a revision loop (max 3 iterations).
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 1. Initialize

Load all context in one call (include file contents to avoid redundant reads):

```bash
INIT=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs init plan-phase "$PHASE" --include state,roadmap,requirements,context,research,verification,uat)
```

Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`.

**File contents (from --include):** `state_content`, `roadmap_content`, `requirements_content`, `context_content`, `research_content`, `verification_content`, `uat_content`. These are null if files don't exist.

**If `planning_exists` is false:** Error — run `/gsd:new-project` first.

## 2. Parse and Normalize Arguments

Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--gaps`, `--skip-verify`).

**If no phase number:** Detect next unplanned phase from roadmap.

**If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create the directory using `phase_slug` and `padded_phase` from init:
```bash
mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
```

**Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.

## 3. Validate Phase

```bash
PHASE_INFO=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs roadmap get-phase "${PHASE}")
```

**If `found` is false:** Error with available phases. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.

## 4. Load CONTEXT.md

Use `context_content` from init JSON (already loaded via `--include context`).

**CRITICAL:** Use `context_content` from INIT — pass to researcher, planner, checker, and revision agents.

If `context_content` is not null, display: `Using phase context from: ${PHASE_DIR}/*-CONTEXT.md`

## 4.5. GATE-09b: Planning-gate check for unresolved `[open]` scope-boundary claims

<!-- GATE-09b (Phase 58 Plan 17): any `[open]` scope-boundary claim in
     <phase>-CONTEXT.md that affects what the phase builds must resolve or
     defer to a named downstream phase before plan-phase proceeds. This step
     is a coarse grep heuristic -- exact claim-type parsing would require a
     YAML/markdown claim parser (references/claim-types.md §3 regex). The
     heuristic counts `[open]` markers in BOTH CONTEXT.md and RESEARCH.md
     (research-time resolutions live in RESEARCH.md for this fork, per
     research-phase.md contract) and subtracts markers paired with the
     words "resolved" or "deferred to Phase". Net positive = block.

     Fire-event: `::notice::gate_fired=GATE-09b result=<pass|block>
     unresolved_claims=<N>` on every invocation (Plan 19 extractor contract).
     Codex behavior: applies-via-workflow-step (see 58-05-codex-behavior-matrix.md).
-->

```bash
# GATE-09b: planning-gate check for unresolved [open] scope-boundary claims
# Scans both CONTEXT.md and RESEARCH.md because resolutions/defers live in
# RESEARCH.md after research-phase completes (fork convention).
padded_phase="${padded_phase:-$(printf '%02d' "${PHASE%%.*}")}"
CONTEXT_FILE=$(ls "${phase_dir}"/*-CONTEXT.md 2>/dev/null | head -1)
RESEARCH_FILE=$(ls "${phase_dir}"/*-RESEARCH.md 2>/dev/null | head -1)

if [ -n "$CONTEXT_FILE" ] && [ -f "$CONTEXT_FILE" ]; then
  # Count [open] markers across both files (RESEARCH.md may be absent).
  # Pattern `\[open(\]|:)` matches both short-form `[open]` and typed
  # `[open:...]` per references/claim-types.md §3 notation syntax.
  FILES_TO_SCAN="$CONTEXT_FILE"
  [ -n "$RESEARCH_FILE" ] && [ -f "$RESEARCH_FILE" ] && FILES_TO_SCAN="$FILES_TO_SCAN $RESEARCH_FILE"

  # shellcheck disable=SC2086
  OPEN_TOTAL=$(grep -hcE '\[open(\]|:)' $FILES_TO_SCAN 2>/dev/null | awk '{s+=$1} END {print s+0}')
  # shellcheck disable=SC2086
  OPEN_RESOLVED=$(grep -hcE '\[open(\]|:).*(resolved|deferred to Phase)' $FILES_TO_SCAN 2>/dev/null | awk '{s+=$1} END {print s+0}')
  UNRESOLVED=$((OPEN_TOTAL - OPEN_RESOLVED))

  if [ "$UNRESOLVED" -gt 0 ]; then
    echo "::notice title=GATE-09b::gate_fired=GATE-09b result=block unresolved_claims=$UNRESOLVED"
    echo "GATE-09b: $UNRESOLVED [open] scope-boundary claim(s) remain unresolved in CONTEXT.md / RESEARCH.md."
    echo ""
    echo "Unresolved markers (first 20):"
    # shellcheck disable=SC2086
    grep -nE '\[open(\]|:)' $FILES_TO_SCAN 2>/dev/null | head -20
    echo ""
    echo "Each [open] claim must either:"
    echo "  (a) Resolve -- e.g., append 'resolved: <answer>' on the same line, OR"
    echo "  (b) Defer  -- e.g., append 'deferred to Phase <NN or NN.N>: <reason>'"
    echo ""
    echo "Re-run /gsd:plan-phase after resolving or deferring the claims above."
    exit 1
  fi
  echo "::notice title=GATE-09b::gate_fired=GATE-09b result=pass unresolved_claims=0"
else
  # No CONTEXT.md -- emit skip-shaped fire-event so Plan 19 extractor can count
  # "phases entering plan-phase without CONTEXT.md" as a distinct bucket.
  echo "::notice title=GATE-09b::gate_fired=GATE-09b result=pass unresolved_claims=0 note=no_context_md"
fi
```

<capability_check name="agent_spawning">
Check the runtime capability matrix (get-shit-done/references/capability-matrix.md):

If has_capability("task_tool"):
  Spawn gsd-phase-researcher and gsd-planner via Task() as designed in steps 5 and 8.

Else:
  Note (first occurrence): "Note: Running without parallel agents -- research and planning happen sequentially in this context."
  Instead of spawning agents:
  1. Read the researcher agent spec and perform research inline
  2. Read the planner agent spec and perform planning inline
  3. Continue with plan creation in the same context
</capability_check>

## 5. Handle Research

**Skip if:** `--gaps` flag, `--skip-research` flag, or `research_enabled` is false (from init) without `--research` override.

**If `has_research` is true (from init) AND no `--research` flag:** Use existing, skip to step 6.

**If RESEARCH.md missing OR `--research` flag:**

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► RESEARCHING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning researcher...
```

### Spawn gsd-phase-researcher

```bash
PHASE_DESC=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs roadmap get-phase "${PHASE}" | jq -r '.section')
# Use requirements_content from INIT (already loaded via --include requirements)
REQUIREMENTS=$(echo "$INIT" | jq -r '.requirements_content // empty' | grep -A100 "## Requirements" | head -50)
STATE_SNAP=$(node ~/.claude/get-shit-done/bin/gsd-tools.cjs state-snapshot)
# Extract decisions from state-snapshot JSON: jq '.decisions[] | "\(.phase): \(.summary) - \(.rationale)"'
```

Research prompt:

```markdown
<objective>
Research how to implement Phase {phase_number}: {phase_name}
Answer: "What do I need to know to PLAN this phase well?"
</objective>

<phase_context>
IMPORTANT: If CONTEXT.md exists below, it contains user decisions from /gsd:discuss-phase.
- **Decisions** = Locked — research THESE deeply, no alternatives
- **Claude's Discretion** = Freedom areas — research options, recommend
- **Deferred Ideas** = Out of scope — ignore

{context_content}
</phase_context>

<additional_context>
**Phase description:** {phase_description}
**Requirements:** {requirements}
**Prior decisions:** {decisions}
</additional_context>

<output>
Write to: {phase_dir}/{phase}-RESEARCH.md
</output>
```

Before spawning, run the GATE-05 echo_delegation macro:

```bash
# GATE-05: echo delegation before spawn
# Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
SUBAGENT_TYPE="general-purpose"   # Proxy for gsd-phase-researcher via inline-prompt pattern
MODEL="{researcher_model}"
REASONING_EFFORT="default"
ISOLATION="none"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="get-shit-done/workflows/plan-phase.md"
WORKFLOW_STEP="spawn_researcher"
RUNTIME="${GSD_RUNTIME:-claude-code}"

echo "[DELEGATION] agent=${SUBAGENT_TYPE}(proxy:gsd-phase-researcher) model=${MODEL} reasoning_effort=${REASONING_EFFORT} isolation=${ISOLATION:-none} session=${SESSION_ID}"

mkdir -p .planning 2>/dev/null || true
printf '{"ts":"%s","agent":"%s","model":"%s","reasoning_effort":"%s","isolation":"%s","session_id":"%s","workflow_file":"%s","workflow_step":"%s","runtime":"%s"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SUBAGENT_TYPE}(proxy:gsd-phase-researcher)" \
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
# Agent: general-purpose (proxy for gsd-phase-researcher via inline-prompt pattern)
# Model: inherit          (resolved from {researcher_model} via resolveModelInternal(cwd, "gsd-phase-researcher") under model_profile=quality; fork maps opus alias → inherit)
# Reasoning effort: default
# Isolation: none
# Required inputs:
#   - research_prompt (built in prior step from phase description/requirements/decisions/context)
#   - ~/.claude/agents/gsd-phase-researcher.md (role-and-instructions file read by proxy)
# Output path: {phase_dir}/{phase}-RESEARCH.md
# Codex behavior: applies-via-workflow-step
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
# Originating signal: sig-2026-04-10-researcher-model-override-leak-third-occurrence
Task(
  prompt="First, read ~/.claude/agents/gsd-phase-researcher.md for your role and instructions.\n\n" + research_prompt,
  subagent_type="general-purpose",
  model="{researcher_model}",   # BAKED IN comment: inherit (was template at authorship — 2026-04-20; resolved against canonical gsd-phase-researcher)
  description="Research Phase {phase}"
)
```

### Handle Researcher Return

- **`## RESEARCH COMPLETE`:** Display confirmation, continue to step 5.5
- **`## RESEARCH BLOCKED`:** Display blocker, offer: 1) Provide context, 2) Skip research, 3) Abort

## 5.5. Handle Spike Decision Point

**Skip if:** `--gaps` flag is set (gap closure mode does not use spike integration) OR `--skip-research` flag is set (no RESEARCH.md to parse for gaps).

**Fork-compatibility guard:** Check if `get-shit-done/references/spike-integration.md` exists. If not (upstream GSD), skip this step entirely and proceed to step 6.

```bash
if [ ! -f "get-shit-done/references/spike-integration.md" ]; then
  # Upstream GSD -- skip spike decision point
  # Proceed to step 6
fi
```

**Check for genuine gaps:**

Read `{PHASE_DIR}/*-RESEARCH.md`. Look for a "### Genuine Gaps" section.

If no Genuine Gaps section or section is empty: proceed to step 6.

If Genuine Gaps exist:

1. **Parse gaps from the table:**
   ```
   For each gap in Genuine Gaps table:
     - question: the question text
     - criticality: Critical | Medium | Low
     - recommendation: Spike | Defer | Accept-risk
   ```

2. **Read spike config from `.planning/config.json`:**
   ```
   spike.enabled    (default: true)   -- whether the spike system is active
   spike.sensitivity (default: "balanced") -- which criticalities trigger spikes
   spike.auto_trigger (default: false)  -- whether to auto-trigger or advise only
   ```

   If `spike.enabled` is false: skip spike processing, proceed to step 6.

3. **Apply sensitivity filter:**
   ```
   sensitivity = config.spike.sensitivity OR derive from config.granularity:
     - granularity: coarse    -> conservative
     - granularity: standard  -> balanced
     - granularity: fine      -> aggressive

   Explicit spike.sensitivity overrides derivation.

   - conservative: only process Critical gaps with Spike recommendation
   - balanced: process Critical + Medium gaps with Spike recommendation
   - aggressive: process all gaps with Spike recommendation
   ```

4. **Apply auto_trigger setting:**

   If `spike.auto_trigger` is **false** (default): Present gaps as advisory only.
   ```
   Display filtered gaps and suggest:
   "These gaps could benefit from a spike investigation via /gsd:spike"
   ```
   Do NOT auto-execute spikes. Proceed to step 6.

   If `spike.auto_trigger` is **true**: Apply autonomy mode:
   ```
   mode = config.mode

   - interactive: present filtered gaps, ask user which to spike
   - yolo: auto-spike all filtered gaps
   ```

   For each approved spike, invoke `get-shit-done/workflows/run-spike.md` with:
   - question: gap.question
   - phase: current phase number

5. **Proceed to step 6** with RESEARCH.md updated (if spikes were run, "Resolved by Spike" entries added).

## 6. Check Existing Plans

```bash
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null || true
```

**If exists:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.

## 7. Use Context Files from INIT

All file contents are already loaded via `--include` in step 1 (`@` syntax doesn't work across Task() boundaries):

```bash
# Extract from INIT JSON (no need to re-read files)
STATE_CONTENT=$(echo "$INIT" | jq -r '.state_content // empty')
ROADMAP_CONTENT=$(echo "$INIT" | jq -r '.roadmap_content // empty')
REQUIREMENTS_CONTENT=$(echo "$INIT" | jq -r '.requirements_content // empty')
RESEARCH_CONTENT=$(echo "$INIT" | jq -r '.research_content // empty')
VERIFICATION_CONTENT=$(echo "$INIT" | jq -r '.verification_content // empty')
UAT_CONTENT=$(echo "$INIT" | jq -r '.uat_content // empty')
CONTEXT_CONTENT=$(echo "$INIT" | jq -r '.context_content // empty')
```

## 7b. Load Triaged Signals

**Skip if:** `--gaps` flag is set (gap closure mode does not use signal awareness).

**Skip if:** KB index does not exist (`.planning/knowledge/index.md` and `~/.gsd/knowledge/index.md` both missing -- project may not have run signal collection yet). Set `TRIAGED_SIGNALS=""` and continue.

Load active triaged signals for the current project to pass to the planner:

```bash
# Read KB index and filter for triaged "address" signals
# Guard against missing KB -- not all projects use signal collection
# KB path resolution -- project-local primary, user-global fallback
if [ -d ".planning/knowledge" ]; then KB_DIR=".planning/knowledge"; else KB_DIR="$HOME/.gsd/knowledge"; fi
KB_INDEX=$(cat $KB_DIR/index.md 2>/dev/null)
if [ -z "$KB_INDEX" ]; then
  TRIAGED_SIGNALS=""
  # Skip signal loading -- no KB index exists
else
  PROJECT_NAME=$(basename "$(pwd)")
  # ... continue with filtering
fi
```

1. Parse the KB index table for signals matching:
   - Project = current project name
   - Lifecycle = "triaged"
   - Status = "active"
2. For matching signals, read the full signal files (max 10, prioritized by severity: critical > notable > minor):
   ```bash
   # Example: read top signal files
   cat $KB_DIR/signals/{project}/{date}-{slug}.md
   ```
3. From each signal file, extract: `id`, `severity`, `signal_type`, `tags`, `triage.decision`, `triage.remediation_suggestion`
4. Filter to signals with `triage.decision: address` only (skip dismiss/defer/investigate)
5. Format as `<triaged_signals>` context block:
   ```markdown
   <triaged_signals>
   {N} triaged signals with decision "address" for project {project_name}:

   - **{sig-id}** ({severity}): {summary}
     Root cause: {from triage or evidence}
     Remediation suggestion: {triage.remediation_suggestion}
     Tags: {tags}
   ...
   </triaged_signals>
   ```

**If no matching signals:** Set `TRIAGED_SIGNALS=""` (empty). The planner will omit resolves_signals.

**Context budget note:** Reading 10 signal files costs ~5-10% context. This is acceptable because signal loading replaces the need for the planner to independently discover these issues.

## 8. Spawn gsd-planner Agent

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PLANNING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning planner...
```

Planner prompt:

```markdown
<planning_context>
**Phase:** {phase_number}
**Mode:** {standard | gap_closure}

**Project State:** {state_content}
**Roadmap:** {roadmap_content}
**Requirements:** {requirements_content}

**Phase Context:**
IMPORTANT: If context exists below, it contains USER DECISIONS from /gsd:discuss-phase.
- **Decisions** = LOCKED — honor exactly, do not revisit
- **Claude's Discretion** = Freedom — make implementation choices
- **Deferred Ideas** = Out of scope — do NOT include

{context_content}

**Research:** {research_content}

**Triaged Signals:**
{TRIAGED_SIGNALS}

**Gap Closure (if --gaps):** {verification_content} {uat_content}
</planning_context>

<downstream_consumer>
Output consumed by /gsd:execute-phase. Plans need:
- Frontmatter (wave, depends_on, files_modified, autonomous)
- Tasks in XML format
- Verification criteria
- must_haves for goal-backward verification
</downstream_consumer>

<quality_gate>
- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from phase goal
</quality_gate>

### Narrowing Decisions (GATE-09c)

If during planning you narrow scope relative to CONTEXT.md (e.g., reject a decided-claim, defer an assumed claim, split a requirement without complete coverage, or decline to implement a load-bearing CONTEXT obligation), record the narrowing in the Narrowing Decisions section of the PLAN.md with:
- Originating CONTEXT claim (quoted or claim-ID)
- What was narrowed
- Rationale
- Target phase if deferred

The phase verifier (Plan 17 GATE-09d) reads both RESEARCH.md and PLAN.md for these narrowings and rolls them into the NN-LEDGER.md at phase close. Silent narrowing fails verification.
```

Before spawning, run the GATE-05 echo_delegation macro:

```bash
# GATE-05: echo delegation before spawn
# Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
SUBAGENT_TYPE="general-purpose"   # Proxy for gsd-planner via inline-prompt pattern
MODEL="{planner_model}"
REASONING_EFFORT="default"
ISOLATION="none"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="get-shit-done/workflows/plan-phase.md"
WORKFLOW_STEP="spawn_planner"
RUNTIME="${GSD_RUNTIME:-claude-code}"

echo "[DELEGATION] agent=${SUBAGENT_TYPE}(proxy:gsd-planner) model=${MODEL} reasoning_effort=${REASONING_EFFORT} isolation=${ISOLATION:-none} session=${SESSION_ID}"

mkdir -p .planning 2>/dev/null || true
printf '{"ts":"%s","agent":"%s","model":"%s","reasoning_effort":"%s","isolation":"%s","session_id":"%s","workflow_file":"%s","workflow_step":"%s","runtime":"%s"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SUBAGENT_TYPE}(proxy:gsd-planner)" \
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
# Agent: general-purpose (proxy for gsd-planner via inline-prompt pattern)
# Model: inherit          (resolved from {planner_model} via resolveModelInternal(cwd, "gsd-planner") under model_profile=quality; fork maps opus alias → inherit)
# Reasoning effort: default
# Isolation: none
# Required inputs:
#   - filled_prompt (built in prior step from planning_context/downstream_consumer/quality_gate)
#   - ~/.claude/agents/gsd-planner.md (role-and-instructions file read by proxy)
# Output path: {phase_dir}/*-PLAN.md
# Codex behavior: applies-via-workflow-step
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
Task(
  prompt="First, read ~/.claude/agents/gsd-planner.md for your role and instructions.\n\n" + filled_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",   # BAKED IN comment: inherit (was template at authorship — 2026-04-20; resolved against canonical gsd-planner)
  description="Plan Phase {phase}"
)
```

## 9. Handle Planner Return

- **`## PLANNING COMPLETE`:** Display plan count. If `--skip-verify` or `plan_checker_enabled` is false (from init): skip to step 13. Otherwise: step 10.
- **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation (step 12)
- **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual

## 10. Spawn gsd-plan-checker Agent

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► VERIFYING PLANS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning plan checker...
```

```bash
PLANS_CONTENT=$(cat "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)
```

Checker prompt:

```markdown
<verification_context>
**Phase:** {phase_number}
**Phase Goal:** {goal from ROADMAP}

**Plans to verify:** {plans_content}
**Requirements:** {requirements_content}

**Phase Context:**
IMPORTANT: Plans MUST honor user decisions. Flag as issue if plans contradict.
- **Decisions** = LOCKED — plans must implement exactly
- **Claude's Discretion** = Freedom areas — plans can choose approach
- **Deferred Ideas** = Out of scope — plans must NOT include

{context_content}
</verification_context>

<expected_output>
- ## VERIFICATION PASSED — all checks pass
- ## ISSUES FOUND — structured issue list
</expected_output>
```

Before spawning, run the GATE-05 echo_delegation macro:

```bash
# GATE-05: echo delegation before spawn
# Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
SUBAGENT_TYPE="gsd-plan-checker"
MODEL="{checker_model}"
REASONING_EFFORT="default"
ISOLATION="none"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="get-shit-done/workflows/plan-phase.md"
WORKFLOW_STEP="spawn_plan_checker"
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
# Agent: gsd-plan-checker
# Model: sonnet          (resolved from {checker_model} via resolveModelInternal under model_profile=quality; alias mode)
# Reasoning effort: default
# Isolation: none
# Required inputs:
#   - checker_prompt (built with verification_context + plans_content + requirements_content + phase context)
#   - {phase_dir}/*-PLAN.md (plans to verify)
# Output path: N/A (inline verification verdict)
# Codex behavior: applies-via-workflow-step
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  model="{checker_model}",   # BAKED IN comment: sonnet (was template at authorship — 2026-04-20)
  description="Verify Phase {phase} plans"
)
```

## 11. Handle Checker Return

- **`## VERIFICATION PASSED`:** Display confirmation, proceed to step 13.
- **`## ISSUES FOUND`:** Display issues, check iteration count, proceed to step 12.

## 12. Revision Loop (Max 3 Iterations)

Track `iteration_count` (starts at 1 after initial plan + check).

**If iteration_count < 3:**

Display: `Sending back to planner for revision... (iteration {N}/3)`

```bash
PLANS_CONTENT=$(cat "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)
```

Revision prompt:

```markdown
<revision_context>
**Phase:** {phase_number}
**Mode:** revision

**Existing plans:** {plans_content}
**Checker issues:** {structured_issues_from_checker}

**Phase Context:**
Revisions MUST still honor user decisions.
{context_content}
</revision_context>

<instructions>
Make targeted updates to address checker issues.
Do NOT replan from scratch unless issues are fundamental.
Return what changed.
</instructions>
```

Before spawning, run the GATE-05 echo_delegation macro:

```bash
# GATE-05: echo delegation before spawn
# Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
SUBAGENT_TYPE="general-purpose"   # Proxy for gsd-planner (revision loop) via inline-prompt pattern
MODEL="{planner_model}"
REASONING_EFFORT="default"
ISOLATION="none"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="get-shit-done/workflows/plan-phase.md"
WORKFLOW_STEP="spawn_planner_revise"
RUNTIME="${GSD_RUNTIME:-claude-code}"

echo "[DELEGATION] agent=${SUBAGENT_TYPE}(proxy:gsd-planner;revision) model=${MODEL} reasoning_effort=${REASONING_EFFORT} isolation=${ISOLATION:-none} session=${SESSION_ID}"

mkdir -p .planning 2>/dev/null || true
printf '{"ts":"%s","agent":"%s","model":"%s","reasoning_effort":"%s","isolation":"%s","session_id":"%s","workflow_file":"%s","workflow_step":"%s","runtime":"%s"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SUBAGENT_TYPE}(proxy:gsd-planner;revision)" \
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
# Agent: general-purpose (proxy for gsd-planner — revision loop — via inline-prompt pattern)
# Model: inherit          (resolved from {planner_model} via resolveModelInternal(cwd, "gsd-planner") under model_profile=quality; fork maps opus alias → inherit)
# Reasoning effort: default
# Isolation: none
# Required inputs:
#   - revision_prompt (built with revision_context + existing plans + checker issues + phase context)
#   - ~/.claude/agents/gsd-planner.md
# Output path: {phase_dir}/*-PLAN.md (revised in place)
# Codex behavior: applies-via-workflow-step
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
Task(
  prompt="First, read ~/.claude/agents/gsd-planner.md for your role and instructions.\n\n" + revision_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",   # BAKED IN comment: inherit (was template at authorship — 2026-04-20; resolved against canonical gsd-planner)
  description="Revise Phase {phase} plans"
)
```

After planner returns -> spawn checker again (step 10), increment iteration_count.

**If iteration_count >= 3:**

Display: `Max iterations reached. {N} issues remain:` + issue list

Offer: 1) Force proceed, 2) Provide guidance and retry, 3) Abandon

## 13. Present Final Status

Route to `<offer_next>`.

</process>

<offer_next>
Output this markdown directly (not as a code block):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PHASE {X} PLANNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {X}: {Name}** — {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | 01, 02 | [objectives] |
| 2    | 03     | [objective]  |

Research: {Completed | Used existing | Skipped}
Verification: {Passed | Passed with override | Skipped}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute Phase {X}** — run all {N} plans

/gsd:execute-phase {X}

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat .planning/phases/{phase-dir}/*-PLAN.md — review plans
- /gsd:plan-phase {X} --research — re-research first

───────────────────────────────────────────────────────────────
</offer_next>

<success_criteria>
- [ ] .planning/ directory validated
- [ ] Phase validated against roadmap
- [ ] Phase directory created if needed
- [ ] CONTEXT.md loaded early (step 4) and passed to ALL agents
- [ ] Research completed (unless --skip-research or --gaps or exists)
- [ ] gsd-phase-researcher spawned with CONTEXT.md
- [ ] Spike decision point evaluated (step 5.5) if spike-integration.md exists
- [ ] Existing plans checked
- [ ] gsd-planner spawned with CONTEXT.md + RESEARCH.md
- [ ] Plans created (PLANNING COMPLETE or CHECKPOINT handled)
- [ ] gsd-plan-checker spawned with CONTEXT.md
- [ ] Verification passed OR user override OR max iterations with user decision
- [ ] User sees status between agent spawns
- [ ] User knows next steps
</success_criteria>
