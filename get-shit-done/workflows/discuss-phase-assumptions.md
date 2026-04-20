<!-- NARROWING DECISION (category d — calibration tier) -->
<!-- Upstream's USER-PROFILE.md → calibration_tier mapping is NOT adopted in the fork. -->
<!-- Per Plan 03 delta §3(d), the fork's shipped `model_profile` (config.json:5) already -->
<!-- calibrates analyzer effort; adopting USER-PROFILE.md would duplicate that axis for a -->
<!-- solo-user repo. The analyzer-agent prompt retains upstream's three tiers -->
<!-- (full_maturity / standard / minimal_decisive) so its output shape is upstream-compatible, -->
<!-- but the tier is resolved FROM model_profile (quality→full_maturity, balanced→standard, -->
<!-- cost/fast→minimal_decisive) rather than from a parallel artifact. -->
<!-- GATE-09c narrowing provenance recorded in 58-03-upstream-delta.md §4 Entry 1. -->
<!-- Reversibility: HIGH — USER-PROFILE.md can be added later; tier lookup becomes -->
<!-- (USER-PROFILE.md ?? map(model_profile)) without structural change. -->

<!-- NARROWING DECISION (category e — CONTEXT.md section mandates) -->
<!-- Upstream's 6-section CONTEXT.md contract (<domain>/<decisions>/<canonical_refs>/ -->
<!-- <code_context>/<specifics>/<deferred>) is preserved as a SUBSET of the fork's richer -->
<!-- typed-claim contract (DISC-01..10 per Phase 57.2: <working_model>/<constraints>/ -->
<!-- <guardrails>/<questions>/<dependencies> plus typed [decided:*]/[assumed:*]/[governing:*]/ -->
<!-- [open]/[projected:*]/[evidenced:*]/[stipulated:*] markers). -->
<!-- Per Plan 03 delta §3(e), this is a narrowing UPWARD — the fork's contract is a strict -->
<!-- superset. Upstream's section list maps forward into fork's typed sections; the fork does -->
<!-- NOT collapse downward to the flatter 6-section form (doing so would erase Phase 57.2 -->
<!-- typed-claim surface and Phase 57.4 audit-informed dependency tables). -->
<!-- GATE-09c narrowing provenance recorded in 58-03-upstream-delta.md §4 Entry 2. -->
<!-- Reversibility: LOW (downward); HIGH (upstream adopting fork's superset). -->

<purpose>
Extract implementation decisions that downstream agents need — using codebase-first analysis
and assumption surfacing instead of interview-style questioning.

You are a thinking partner, not an interviewer. Analyze the codebase deeply, surface what you
believe based on evidence, and ask the user only to correct what's wrong.
</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsdr-assumptions-analyzer — Analyzes codebase to surface implementation assumptions
</available_agent_types>

<downstream_awareness>
**CONTEXT.md feeds into:**

1. **gsdr-phase-researcher** — Reads CONTEXT.md to know WHAT to research
2. **gsdr-planner** — Reads CONTEXT.md to know WHAT decisions are locked

**Your job:** Capture decisions clearly enough that downstream agents can act on them
without asking the user again. Output uses the fork's typed-claim CONTEXT.md format
(see `get-shit-done/references/claim-types.md`); the upstream 6-section set is preserved
as a subset within it (see NARROWING DECISION comments above).
</downstream_awareness>

<philosophy>
**Assumptions mode philosophy:**

The user is a visionary, not a codebase archaeologist. They need enough context to evaluate
whether your assumptions match their intent — not to answer questions you could figure out
by reading the code.

- Read the codebase FIRST, form opinions SECOND, ask ONLY about what's genuinely unclear
- Every assumption must cite evidence (file paths, patterns found)
- Every assumption must state consequences if wrong
- Minimize user interactions: ~2-4 corrections vs ~15-20 questions
</philosophy>

<scope_guardrail>
**CRITICAL: No scope creep.**

The phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement
what's scoped, never WHETHER to add new capabilities.

When user suggests scope creep:
"[Feature X] would be a new capability — that's its own phase.
Want me to note it for the roadmap backlog? For now, let's focus on [phase domain]."

Capture the idea in "Deferred Ideas". Don't lose it, don't act on it.
</scope_guardrail>

<answer_validation>
**IMPORTANT: Answer validation** — After every AskUserQuestion call, check if the response
is empty or whitespace-only. If so:
1. Retry the question once with the same parameters
2. If still empty, present the options as a plain-text numbered list

**Text mode (`workflow.text_mode: true` in config or `--text` flag):**
When text mode is active, do not use AskUserQuestion at all. Present every question as a
plain-text numbered list and ask the user to type their choice number. See
`docs/workflow-discuss-mode.md` §3 for full text_mode semantics.
</answer_validation>

<confidence_badge_mapping>
**Confidence badges → fork typed-claim vocabulary.**

The analyzer agent returns assumptions with upstream-compatible confidence badges
(`Confident` / `Likely` / `Unclear`). When writing CONTEXT.md in the fork's typed-claim
format, map these to typed claims per `docs/workflow-discuss-mode.md` §4:

| Upstream badge | Fork typed-claim |
|---|---|
| Confident | `[decided:cited]` or `[evidenced:cited]` |
| Likely | `[assumed:reasoned]` |
| Unclear | `[open]` (tracked in `<questions>`) |

This preserves upstream's analyzer prompt verbatim (so it returns what upstream expects)
while yielding fork-compatible typed-claim CONTEXT.md.
</confidence_badge_mapping>

<process>

<step name="initialize" priority="first">
Phase number from argument (required).

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS_ANALYZER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-assumptions-analyzer 2>/dev/null)
```

Parse JSON for: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`,
`phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`,
`plan_count`, `roadmap_exists`, `planning_exists`.

**If `phase_found` is false:**
```
Phase [X] not found in roadmap.

Use /gsdr:progress to see available phases.
```
Exit workflow.

**If `phase_found` is true:** Continue to check_existing.

**Auto mode** — If `--auto` is present in ARGUMENTS:
- In `check_existing`: auto-select "Update it" (if context exists) or continue without prompting
- In `present_assumptions`: skip confirmation gate, proceed directly to write CONTEXT.md
- In `correct_assumptions`: auto-select recommended option for each correction
- Log each auto-selected choice inline
- After completion, auto-advance to plan-phase
</step>

<step name="check_existing">
Check if CONTEXT.md already exists using `has_context` from init.

```bash
ls ${phase_dir}/*-CONTEXT.md 2>/dev/null || true
```

**If exists:**

**If `--auto`:** Auto-select "Update it". Log: `[auto] Context exists — updating with assumption-based analysis.`

**Otherwise:** Use AskUserQuestion:
- header: "Context"
- question: "Phase [X] already has context. What do you want to do?"
- options:
  - "Update it" — Re-analyze codebase and refresh assumptions
  - "View it" — Show me what's there
  - "Skip" — Use existing context as-is

If "Update": Load existing, continue to load_prior_context
If "View": Display CONTEXT.md, then offer update/skip
If "Skip": Exit workflow

**If doesn't exist:**

Check `has_plans` and `plan_count` from init. **If `has_plans` is true:**

**If `--auto`:** Auto-select "Continue and replan after". Log: `[auto] Plans exist — continuing with assumption analysis, will replan after.`

**Otherwise:** Use AskUserQuestion:
- header: "Plans exist"
- question: "Phase [X] already has {plan_count} plan(s) created without user context. Your decisions here won't affect existing plans unless you replan."
- options:
  - "Continue and replan after"
  - "View existing plans"
  - "Cancel"

If "Continue and replan after": Continue to load_prior_context.
If "View existing plans": Display plan files, then offer "Continue" / "Cancel".
If "Cancel": Exit workflow.

**If `has_plans` is false:** Continue to load_prior_context.
</step>

<step name="load_prior_context">
Read project-level and prior phase context to avoid re-asking decided questions.

**Step 1: Read project-level files**
```bash
cat .planning/PROJECT.md 2>/dev/null || true
cat .planning/REQUIREMENTS.md 2>/dev/null || true
cat .planning/STATE.md 2>/dev/null || true
```

Extract from these:
- **PROJECT.md** — Vision, principles, non-negotiables, user preferences
- **REQUIREMENTS.md** — Acceptance criteria, constraints
- **STATE.md** — Current progress, any flags

**Step 2: Read all prior CONTEXT.md files**
```bash
(find .planning/phases -name "*-CONTEXT.md" 2>/dev/null || true) | sort
```

For each CONTEXT.md where phase number < current phase:
- Read the `<decisions>` section AND (if present) `<working_model>`, `<constraints>`,
  `<guardrails>`, `<dependencies>` — these are locked preferences and governing claims
  under the fork's typed-claim contract
- Read `<specifics>` — particular references or "I want it like X" moments
- Note patterns (e.g., "user consistently prefers minimal UI")

**Step 3: Build internal `<prior_decisions>` context**

Structure the extracted information for use in assumption generation.

**If no prior context exists:** Continue without — expected for early phases.
</step>

<step name="cross_reference_todos">
Check if any pending todos are relevant to this phase's scope.

```bash
TODO_MATCHES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" todo match-phase "${PHASE_NUMBER}" 2>/dev/null)
```

Parse JSON for: `todo_count`, `matches[]`.

**If `todo_count` is 0:** Skip silently.

**If matches found:** Present matched todos, use AskUserQuestion (multiSelect) to fold relevant ones into scope.

**For selected (folded) todos:** Store as `<folded_todos>` for CONTEXT.md `<decisions>` section.
**For unselected:** Store as `<reviewed_todos>` for CONTEXT.md `<deferred>` section.

**Auto mode (`--auto`):** Fold all todos with score >= 0.4 automatically. Log the selection.
</step>

<step name="load_methodology">
Read the project-level methodology file if it exists. This must happen before assumption analysis
so that active lenses shape how assumptions are generated and evaluated.

```bash
cat .planning/METHODOLOGY.md 2>/dev/null || true
```

**If METHODOLOGY.md exists:**
- Parse each named lens: its diagnoses, recommendations, and triggering conditions
- Store as internal `<active_lenses>` for use in deep_codebase_analysis and present_assumptions
- When spawning the gsdr-assumptions-analyzer, pass the lens list so it can flag which lenses apply
- When presenting assumptions, append a "Methodology" section showing which lenses were applied
  and what they flagged (if anything)

**If METHODOLOGY.md does not exist:** Skip silently. This artifact is optional.
</step>

<step name="scout_codebase">
Lightweight scan of existing code to inform assumption generation.

**Step 1: Check for existing codebase maps**
```bash
ls .planning/codebase/*.md 2>/dev/null || true
```

**If codebase maps exist:** Read relevant ones (CONVENTIONS.md, STRUCTURE.md, STACK.md). Extract reusable components, patterns, integration points. Skip to Step 3.

**Step 2: If no codebase maps, do targeted grep**

Extract key terms from phase goal, search for related files.

```bash
grep -rl "{term1}\|{term2}" src/ app/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
```

Read the 3-5 most relevant files.

**Step 3: Build internal `<codebase_context>`**

Identify reusable assets, established patterns, integration points, and creative options. Store internally for use in deep_codebase_analysis.
</step>

<step name="deep_codebase_analysis">
Spawn a `gsdr-assumptions-analyzer` agent to deeply analyze the codebase for this phase. This
keeps raw file contents out of the main context window, protecting token budget.

**Resolve calibration tier (per NARROWING DECISION category d — resolve from `model_profile`):**

Per Plan 03 delta §3(d), the fork does NOT adopt USER-PROFILE.md. The analyzer-agent output
shape still uses upstream's three tiers (`full_maturity` / `standard` / `minimal_decisive`),
but the tier is resolved from the shipped `model_profile` (`config.json:5`).

```bash
MODEL_PROFILE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get model_profile 2>/dev/null || echo "balanced")
```

Map `model_profile` to calibration tier:
- `quality` → `full_maturity` (more alternatives, detailed evidence)
- `balanced` or `adaptive` → `standard` (default)
- `budget` or `cost` or `fast` → `minimal_decisive` (decisive single recommendations)

If `model_profile` is unset or unrecognized: `calibration_tier = "standard"`.

**Spawn Explore subagent:**

```bash
# GATE-05 echo_delegation macro — prints to user + appends to delegation log.
# Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
SUBAGENT_TYPE="gsdr-assumptions-analyzer"
MODEL="inherit"                   # literal from resolveModelInternal(cwd, 'gsdr-assumptions-analyzer') at edit time; analyzer tier = gsd-phase-researcher class per Plan 11 Task 1 action
REASONING_EFFORT="default"
ISOLATION="none"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="get-shit-done/workflows/discuss-phase-assumptions.md"
WORKFLOW_STEP="deep_codebase_analysis"
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
# Agent: gsdr-assumptions-analyzer
# Model: inherit          (resolved from gsdr-assumptions-analyzer via resolveModelInternal at edit time; analyzer agent is not in MODEL_PROFILES, falls back to gsd-phase-researcher class per Plan 11 Task 1 guidance — quality profile → inherit)
# Reasoning effort: default
# Isolation: none
# Required inputs:
#   - @.planning/ROADMAP.md
#   - @.planning/phases/{PHASE}-*/*-CONTEXT.md (prior phases)
#   - Codebase scout hints from scout_codebase step
#   - Calibration tier (resolved from model_profile per NARROWING DECISION d)
# Output path: structured assumptions returned to main workflow (no filesystem write)
# Codex behavior: applies
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
Task(subagent_type="gsdr-assumptions-analyzer", model="inherit", prompt="""
Analyze the codebase for Phase {PHASE}: {phase_name}.

Phase goal: {roadmap_description}
Prior decisions: {prior_decisions_summary}
Codebase scout hints: {codebase_context_summary}
Calibration: {calibration_tier}

Your job:
1. Read ROADMAP.md phase {PHASE} description
2. Read any prior CONTEXT.md files from earlier phases
3. Glob/Grep for files related to: {phase_relevant_terms}
4. Read 5-15 most relevant source files
5. Return structured assumptions

## Output Format

Return EXACTLY this structure:

## Assumptions

### [Area Name] (e.g., "Technical Approach")
- **Assumption:** [Decision statement]
  - **Why this way:** [Evidence from codebase — cite file paths]
  - **If wrong:** [Concrete consequence of this being wrong]
  - **Confidence:** Confident | Likely | Unclear

(3-5 areas, calibrated by tier:
- full_maturity: 3-5 areas, 2-3 alternatives per Likely/Unclear item
- standard: 3-4 areas, 2 alternatives per Likely/Unclear item
- minimal_decisive: 2-3 areas, decisive single recommendation per item)

## Needs External Research
[Topics where codebase alone is insufficient — library version compatibility,
ecosystem best practices, etc. Leave empty if codebase provides enough evidence.]

${AGENT_SKILLS_ANALYZER}
""")
```

Parse the subagent's response. Extract:
- `assumptions[]` — each with area, statement, evidence, consequence, confidence
- `needs_research[]` — topics requiring external research (may be empty)

**Initialize canonical refs accumulator:**
- Source 1: Copy `Canonical refs:` from ROADMAP.md for this phase, expand to full paths
- Source 2: Check REQUIREMENTS.md and PROJECT.md for specs/ADRs referenced
- Source 3: Add any docs referenced in codebase scout results
</step>

<step name="external_research">
**Skip if:** `needs_research` from deep_codebase_analysis is empty.

If research topics were flagged, spawn a general-purpose research agent:

```bash
# GATE-05 echo_delegation macro — external research delegation.
SUBAGENT_TYPE="general-purpose"
MODEL="sonnet"                    # general-purpose proxy for gsd-phase-researcher per 58-02 §3.3; gsd-phase-researcher at quality → inherit, but general-purpose proxy defaults to sonnet; literal baked here for GATE-13 parity
REASONING_EFFORT="default"
ISOLATION="none"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="get-shit-done/workflows/discuss-phase-assumptions.md"
WORKFLOW_STEP="external_research"
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
# Agent: general-purpose (proxy for gsd-phase-researcher per 58-02 §3.3 — research topics flagged by analyzer)
# Model: sonnet          (general-purpose resolveModelInternal default; canonical class gsd-phase-researcher resolves to inherit at quality but Task() general-purpose binds to sonnet fallback)
# Reasoning effort: default
# Isolation: none
# Required inputs:
#   - needs_research topics from deep_codebase_analysis
#   - Phase name and phase number
# Output path: research findings merged back into assumptions in-memory
# Codex behavior: applies
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
Task(subagent_type="general-purpose", model="sonnet", prompt="""
Research the following topics for Phase {PHASE}: {phase_name}.

Topics needing research:
{needs_research_content}

For each topic, return:
- **Finding:** [What you learned]
- **Source:** [URL or library docs reference]
- **Confidence impact:** [Which assumption this resolves and to what confidence level]

Use Context7 (resolve-library-id then query-docs) for library-specific questions.
Use WebSearch for ecosystem/best-practice questions.
""")
```

Merge findings back into assumptions:
- Update confidence levels where research resolves ambiguity
- Add source attribution to affected assumptions
- Store research findings for DISCUSSION-LOG.md

**If no gaps flagged:** Skip entirely. Most phases will skip this step.
</step>

<step name="present_assumptions">
Display all assumptions grouped by area with confidence badges.

**Format for display:**

```
## Phase {PHASE}: {phase_name} — Assumptions

Based on codebase analysis, here's what I'd go with:

### {Area Name}
{Confidence badge} **{Assumption statement}**
↳ Evidence: {file paths cited}
↳ If wrong: {consequence}

### {Area Name 2}
...

[If external research was done:]
### External Research Applied
- {Topic}: {Finding} (Source: {URL})

[If METHODOLOGY.md was loaded:]
### Methodology
- {Lens name}: {what it flagged, or "no flag"}
```

**If `--auto`:**
- If all assumptions are Confident or Likely: log assumptions, skip to write_context.
  Log: `[auto] All assumptions Confident/Likely — proceeding to context capture.`
- If any assumptions are Unclear: log a warning, auto-select recommended alternative for
  each Unclear item. Log: `[auto] {N} Unclear assumptions auto-resolved with recommended defaults.`
  Proceed to write_context.

**Otherwise:** Use AskUserQuestion:
- header: "Assumptions"
- question: "These all look right?"
- options:
  - "Yes, proceed" — Write CONTEXT.md with these assumptions as decisions
  - "Let me correct some" — Select which assumptions to change

**If "Yes, proceed":** Skip to write_context.
**If "Let me correct some":** Continue to correct_assumptions.

**Spawn note (analyzer re-dispatch for re-analysis):**

If the user requests a re-analysis (e.g., after providing additional scope context), the
workflow may re-dispatch the analyzer agent. When it does, the SAME dispatch contract from
the `deep_codebase_analysis` step applies verbatim — same agent name, same model literal,
same fire-event. For grep-reference completeness the analyzer agent name appears here as
well: `gsdr-assumptions-analyzer` (so the three upstream spawn points per CONTEXT 58 §6
are detectable via grep without duplicating the full dispatch block).
</step>

<step name="correct_assumptions">
The assumptions are already displayed above from present_assumptions.

Present a multiSelect where each option's label is the assumption statement and description
is the "If wrong" consequence:

Use AskUserQuestion (multiSelect):
- header: "Corrections"
- question: "Which assumptions need correcting?"
- options: [one per assumption, label = assumption statement, description = "If wrong: {consequence}"]

For each selected correction, ask ONE focused question:

Use AskUserQuestion:
- header: "{Area Name}"
- question: "What should we do instead for: {assumption statement}?"
- options: [2-3 concrete alternatives describing user-visible outcomes, recommended option first]

Record each correction:
- Original assumption
- User's chosen alternative
- Reason (if provided via "Other" free text)

After all corrections processed, continue to write_context with updated assumptions.

**Auto mode:** Should not reach this step (--auto skips from present_assumptions).
</step>

<step name="write_context">
Create phase directory if needed. Write CONTEXT.md using the fork's typed-claim contract.

**File:** `${phase_dir}/${padded_phase}-CONTEXT.md`

**Section contract** (per NARROWING DECISION category e — fork superset preserved):

The fork's CONTEXT.md uses a richer section set than upstream's 6-section flat format.
Fork sections include: `<domain>`, `<working_model>`, `<constraints>`, `<guardrails>`,
`<questions>`, `<dependencies>`, `<canonical_refs>`, `<code_context>`, `<specifics>`,
`<deferred>`, plus Acceptance Tests appendix where relevant. Entries are typed per
`get-shit-done/references/claim-types.md` with `[decided:*]`, `[assumed:*]`,
`[governing:*]`, `[open]`, `[projected:*]`, `[evidenced:*]`, `[stipulated:*]` markers.

Upstream's 6 sections map into fork's typed sections:
- upstream `<domain>` → fork `<domain>`
- upstream `<decisions>` → fork `<working_model>` + typed `[decided:*]` claims
- upstream `<canonical_refs>` → fork `<canonical_refs>`
- upstream `<code_context>` → fork `<code_context>`
- upstream `<specifics>` → fork `<specifics>`
- upstream `<deferred>` → fork `<deferred>`

Map analyzer output to CONTEXT.md sections (per confidence_badge_mapping above):
- `Confident` assumptions → `[decided:cited]` / `[evidenced:cited]` claims under
  `<working_model>` or `<decisions>` (D-01, D-02, etc.)
- `Likely` assumptions → `[assumed:reasoned]` claims with alternatives documented
- `Unclear` assumptions → `[open]` claims tracked in `<questions>`
- User corrections → override the original assumption
- Folded todos → `<decisions>` under "### Folded Todos"

```markdown
# Phase {PHASE}: {phase_name} - Context

**Gathered:** {date} (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

{Domain boundary from ROADMAP.md — clear statement of scope anchor}
</domain>

<working_model>
## Working Model

{High-level approach derived from Confident/Likely assumptions. Typed claims
with [decided:*] / [assumed:*] / [evidenced:*] markers per claim-types.md.}
</working_model>

<decisions>
## Implementation Decisions

### {Area Name 1}
- **D-01:** [decided:cited] {Decision — from Confident assumption or correction}
- **D-02:** [decided:reasoned] {Decision}

### {Area Name 2}
- **D-03:** [assumed:reasoned] {Decision with Likely confidence}

### Claude's Discretion
{Any assumptions where the user confirmed "you decide" or left as-is with Likely confidence}

### Folded Todos
{If any todos were folded into scope}
</decisions>

<constraints>
## Constraints

{[governing:cited] / [governing:reasoned] — hard boundaries from PROJECT.md,
REQUIREMENTS.md, active methodology lenses. If none: "No constraints surfaced
by analyzer — phase operates within project defaults."}
</constraints>

<guardrails>
## Guardrails

{Per-phase anti-patterns or scope risks surfaced by analyzer / methodology lenses.
If none: "No guardrails flagged — analyzer did not surface scope risks in this pass."}
</guardrails>

<questions>
## Open Questions

{[open] claims from Unclear assumptions — tracked here for planner/researcher
attention. If none: "No open questions — all assumptions reached Confident or Likely."}
</questions>

<dependencies>
## Dependencies

{Claim-dependency edges: which D-N depends on which prior-phase decision or
current-phase claim. If none: "No cross-claim dependencies surfaced."}
</dependencies>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

{Accumulated canonical refs from analyze step — full relative paths}

[If no external specs: "No external specs — requirements fully captured in decisions above"]
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
{From codebase scout + Explore subagent findings}

### Established Patterns
{Patterns that constrain/enable this phase}

### Integration Points
{Where new code connects to existing system}
</code_context>

<specifics>
## Specific Ideas

{Any particular references from corrections or user input}

[If none: "No specific requirements — open to standard approaches"]
</specifics>

<deferred>
## Deferred Ideas

{Ideas mentioned during corrections that are out of scope}

### Reviewed Todos (not folded)
{Todos reviewed but not folded — with reason}

[If none: "None — analysis stayed within phase scope"]
</deferred>
```

Write file.
</step>

<step name="write_discussion_log">
Write audit trail of assumptions and corrections.

**File:** `${phase_dir}/${padded_phase}-DISCUSSION-LOG.md`

```markdown
# Phase {PHASE}: {phase_name} - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** {ISO date}
**Phase:** {padded_phase}-{phase_name}
**Mode:** assumptions
**Calibration tier:** {full_maturity | standard | minimal_decisive} (resolved from model_profile={quality|balanced|budget|adaptive})
**Areas analyzed:** {comma-separated area names}

## Assumptions Presented

### {Area Name}
| Assumption | Confidence | Typed Claim | Evidence |
|------------|-----------|-------------|----------|
| {Statement} | {Confident/Likely/Unclear} | {[decided:cited]/[assumed:reasoned]/[open]} | {file paths} |

{Repeat for each area}

## Corrections Made

{If corrections were made:}

### {Area Name}
- **Original assumption:** {what Claude assumed}
- **User correction:** {what the user chose instead}
- **Reason:** {user's rationale, if provided}

{If no corrections: "No corrections — all assumptions confirmed."}

## Auto-Resolved

{If --auto and Unclear items existed:}
- {Assumption}: auto-selected {recommended option}

{If not applicable: omit this section}

## External Research

{If research was performed:}
- {Topic}: {Finding} (Source: {URL})

{If no research: omit this section}

## Methodology Lenses Applied

{If METHODOLOGY.md loaded:}
- {Lens name}: {flag or "no flag"}

{If no METHODOLOGY.md: omit this section}
```

Write file.
</step>

<step name="git_commit">
Commit phase context and discussion log:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): capture phase context (assumptions mode)" --files "${phase_dir}/${padded_phase}-CONTEXT.md" "${phase_dir}/${padded_phase}-DISCUSSION-LOG.md"
```

Confirm: "Committed: docs(${padded_phase}): capture phase context (assumptions mode)"
</step>

<step name="update_state">
Update STATE.md with session info:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Phase ${PHASE} context gathered (assumptions mode)" \
  --resume-file "${phase_dir}/${padded_phase}-CONTEXT.md"
```

Commit STATE.md:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(state): record phase ${PHASE} context session" --files .planning/STATE.md
```
</step>

<step name="confirm_creation">
Present summary and next steps:

```
Created: .planning/phases/${PADDED_PHASE}-${SLUG}/${PADDED_PHASE}-CONTEXT.md

## Decisions Captured (Assumptions Mode)

### {Area Name}
- {Key decision} (from assumption / corrected)

{Repeat per area}

[If corrections were made:]
## Corrections Applied
- {Area}: {original} → {corrected}

[If deferred ideas exist:]
## Noted for Later
- {Deferred idea} — future phase

---

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

**Phase ${PHASE}: {phase_name}** — {Goal from ROADMAP.md}

`/clear` then:

`/gsdr:plan-phase ${PHASE}`

---

**Also available:**
- `/gsdr:plan-phase ${PHASE} --skip-research` — plan without research
- `/gsdr:ui-phase ${PHASE}` — generate UI design contract (if frontend work)
- Review/edit CONTEXT.md before continuing

---
```
</step>

<step name="auto_advance">
Check for auto-advance trigger:

1. Parse `--auto` flag from $ARGUMENTS
2. Sync chain flag:
   ```bash
   if [[ ! "$ARGUMENTS" =~ --auto ]]; then
     node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
   fi
   ```
3. Read chain flag and user preference:
   ```bash
   AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
   AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
   ```

**If `--auto` flag present AND `AUTO_CHAIN` is not true:**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active true
```

**If `--auto` flag present OR `AUTO_CHAIN` is true OR `AUTO_CFG` is true:**

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTO-ADVANCING TO PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context captured (assumptions mode). Launching plan-phase...
```

Launch: `Skill(skill="gsdr-plan-phase", args="${PHASE} --auto")`

Handle return: PHASE COMPLETE / PLANNING COMPLETE / INCONCLUSIVE / GAPS FOUND
(identical handling to discuss-phase.md auto_advance step)

**If neither `--auto` nor config enabled:**
Route to confirm_creation step.
</step>

</process>

<success_criteria>
- Phase validated against roadmap
- Prior context loaded (no re-asking decided questions)
- Codebase deeply analyzed via gsdr-assumptions-analyzer subagent (5-15 files read)
- Assumptions surfaced with evidence and confidence levels
- User confirmed or corrected assumptions (~2-4 interactions max)
- Scope creep redirected to deferred ideas
- CONTEXT.md captures actual decisions in fork's typed-claim format (per claim-types.md)
- CONTEXT.md includes canonical_refs with full file paths (MANDATORY)
- CONTEXT.md includes code_context from codebase analysis
- DISCUSSION-LOG.md records assumptions and corrections as audit trail
- STATE.md updated with session info
- User knows next steps
</success_criteria>
