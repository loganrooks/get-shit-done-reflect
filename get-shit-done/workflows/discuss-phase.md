<purpose>
Create `CONTEXT.md` as a phase steering brief that downstream research, planning, execution, and checking can rely on.

You are not just interviewing for preferences. Your job is to reduce avoidable ambiguity before planning by capturing boundary, assumptions, locked decisions, derived constraints, open questions, epistemic guardrails, discretion areas, and deferred ideas. Do not do full research or full planning here; create the steering artifact those stages need.

In interactive mode, you are also a thinking partner. The user is the visionary — you are the builder. Your job is to surface the decisions that matter while doing your own synthesis work first.

**Three discuss modes** (configured via `workflow.discuss_mode` in `.planning/config.json`):

| Mode | Default | Behavior |
|------|---------|----------|
| `exploratory` | Yes | Preserve uncertainty. Bias toward open questions. `--auto` uses type-based progression rules per `references/claim-types.md` — `[open]` claims are never auto-ready and go to downstream agents for investigation. Template uses `<working_model>` sections with typed claims, constraints, guardrails, and generative open questions. |
| `discuss` | No | Standard steering brief. `--auto` picks recommended defaults decisively. Current upstream behavior. |
| `assumptions` | No | Codebase-first inference with minimal user interaction. Routes to `discuss-phase-assumptions.md` workflow. |
</purpose>

<downstream_awareness>
**CONTEXT.md feeds into:**

1. **gsd-phase-researcher** — Reads CONTEXT.md to know WHAT to research
   - "User wants card-based layout" → researcher investigates card component patterns
   - "Infinite scroll decided" → researcher looks into virtualization libraries

2. **gsd-planner** — Reads CONTEXT.md to know WHAT decisions are locked
   - "Pull-to-refresh on mobile" → planner includes that in task specs
   - "Claude's Discretion: loading skeleton" → planner can decide approach

**Your job:** Produce context strong enough that downstream stages do not need to reopen avoidable ambiguity.

**Not your job:** Do exhaustive technical research or break the work into executable tasks.
</downstream_awareness>

<philosophy>
**User = founder/visionary. Claude = builder.**

The user knows:
- How they imagine it working
- What it should look/feel like
- What's essential vs nice-to-have
- Specific behaviors or references they have in mind

The user doesn't know (and shouldn't be asked):
- Codebase patterns (researcher reads the code)
- Technical risks (researcher identifies these)
- Implementation approach (planner figures this out)
- Success metrics (inferred from the work)

But CONTEXT.md is broader than user taste. It can also hold:
- working assumptions that research must test
- constraints derived from requirements, prior phases, signals, or code reality
- open questions that should steer research
- epistemic guardrails and verification standards

Default to doing synthesis work yourself before asking anything. Ask only when a high-leverage ambiguity remains unresolved after scouting and derivation.

**Exploratory mode additions** (active when `DISCUSS_MODE` is `exploratory`):

These additions modify the discussion posture without changing the step structure:

- **Typed claims, not bare markers:** Every claim in CONTEXT.md carries a type and optional verification level using `[type:verification]` notation (see `references/claim-types.md`). The 7 types are: evidenced, decided, assumed, open, projected, stipulated, governing. The 3 verification levels are: cited, reasoned, bare.
- **Working model, not locked decisions:** Frame captured choices as part of a working model. `<working_model>` replaces `<decisions>` in exploratory mode. Language should signal "current understanding" rather than "locked choice."
- **Preserve genuine uncertainty:** If the user says "I'm not sure" or "either could work," record as `[open]` -- a legitimate outcome. Downstream agents (researcher, planner) investigate further.
- **Epistemic guardrails and constraints:** Derive constraints from requirements, prior phases, and codebase. Record guardrails that bound investigation. These are structural sections, not optional.
- **Auto-select by type rules:** With `--auto` in exploratory mode, auto-progression eligibility is determined by claim type (see `references/claim-types.md` Auto-Progression Rules), NOT by a single binary grounded/open marker. Specifically:
  - `[evidenced:cited]`, `[decided]`, `[stipulated]`, `[governing]` -> auto-ready
  - `[assumed:reasoned]` or `[assumed:cited]` -> auto-ready (honest rationale provided)
  - `[assumed:bare]` -> NOT auto-ready (needs at minimum a stated rationale)
  - `[open]` -> NEVER auto-ready (requires research)
  - `[projected]` -> auto-ready if the projected phase exists in ROADMAP.md
  For claims that cannot auto-progress, record in the Open Questions section with generative format.
</philosophy>

<context_model>
Treat CONTEXT.md as a phase steering brief. Section availability depends on discuss mode:

**Common sections (all modes):**
- Phase Boundary
- Canonical References
- Code Context
- Specific Ideas
- Deferred Ideas

**Exploratory mode sections** (replace `<decisions>` when `DISCUSS_MODE` is `exploratory`):
- Working Model & Assumptions (`<working_model>`) -- typed claims using `references/claim-types.md` vocabulary
- Derived Constraints (`<constraints>`)
- Epistemic Guardrails (`<guardrails>`)
- Open Questions (`<questions>`) -- generative format with research program, downstream decisions, reversibility
- Claim Dependencies (`<dependencies>`) -- table recording inferential web

**Discuss mode sections** (standard behavior):
- Implementation Decisions (`<decisions>`)
- Open Questions (table format)

Only include sections that have content. Reference: `@get-shit-done/references/claim-types.md` for type vocabulary.
</context_model>

<synthesis_priority>
1. Scout before asking
2. Derive before reopening
3. Prioritize by leverage
4. Respect uncertainty
</synthesis_priority>

<scope_guardrail>
**CRITICAL: No scope creep.**

The phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement what's scoped, never WHETHER to add new capabilities.

**Allowed (clarifying ambiguity):**
- "How should posts be displayed?" (layout, density, info shown)
- "What happens on empty state?" (within the feature)
- "Pull to refresh or manual?" (behavior choice)

**Not allowed (scope creep):**
- "Should we also add comments?" (new capability)
- "What about search/filtering?" (new capability)
- "Maybe include bookmarking?" (new capability)

**The heuristic:** Does this clarify how we implement what's already in the phase, or does it add a new capability that could be its own phase?

**When user suggests scope creep:**
```
"[Feature X] would be a new capability — that's its own phase.
Want me to note it for the roadmap backlog?

For now, let's focus on [phase domain]."
```

Capture the idea in a "Deferred Ideas" section. Don't lose it, don't act on it.
</scope_guardrail>

<gray_area_identification>
Gray areas are **implementation decisions the user cares about** — things that could go multiple ways and would change the result.

**How to identify gray areas:**

1. **Read the phase goal** from ROADMAP.md
2. **Understand the domain** — What kind of thing is being built?
   - Something users SEE → visual presentation, interactions, states matter
   - Something users CALL → interface contracts, responses, errors matter
   - Something users RUN → invocation, output, behavior modes matter
   - Something users READ → structure, tone, depth, flow matter
   - Something being ORGANIZED → criteria, grouping, handling exceptions matter
3. **Generate phase-specific gray areas** — Not generic categories, but concrete decisions for THIS phase

**Don't use generic category labels** (UI, UX, Behavior). Generate specific gray areas:

```
Phase: "User authentication"
→ Session handling, Error responses, Multi-device policy, Recovery flow

Phase: "Organize photo library"
→ Grouping criteria, Duplicate handling, Naming convention, Folder structure

Phase: "CLI for database backups"
→ Output format, Flag design, Progress reporting, Error recovery

Phase: "API documentation"
→ Structure/navigation, Code examples depth, Versioning approach, Interactive elements
```

**The key question:** What decisions would change the outcome that the user should weigh in on?

**Claude handles these (don't ask):**
- Technical implementation details
- Architecture patterns
- Performance optimization
- Scope (roadmap defines this)
</gray_area_identification>

<answer_validation>
**IMPORTANT: Answer validation** — After every AskUserQuestion call, check if the response is empty or whitespace-only. If so:
1. Retry the question once with the same parameters
2. If still empty, present the options as a plain-text numbered list and ask the user to type their choice number
Never proceed with an empty answer.

**Text mode (`workflow.text_mode: true` in config or `--text` flag):**
When text mode is active, **do not use AskUserQuestion at all**. Instead, present every
question as a plain-text numbered list and ask the user to type their choice number.
This is required for Claude Code remote sessions (`/rc` mode) where the Claude App
cannot forward TUI menu selections back to the host.

Enable text mode:
- Per-session: pass `--text` flag to any command (e.g., `/gsd:discuss-phase --text`)
- Per-project: `gsd-tools config-set workflow.text_mode true`

Text mode applies to ALL workflows in the session, not just discuss-phase.
</answer_validation>

<process>

**Express path available:** If you already have a PRD or acceptance criteria document, use `/gsd:plan-phase {phase} --prd path/to/prd.md` to skip this discussion and go straight to planning.

<step name="initialize" priority="first">
Phase number from argument (required).

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS_ADVISOR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-advisor 2>/dev/null)
```

Parse JSON for: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`, `plan_count`, `roadmap_exists`, `planning_exists`.

**If `phase_found` is false:**
```
Phase [X] not found in roadmap.

Use /gsd:progress ${GSD_WS} to see available phases.
```
Exit workflow.

**If `phase_found` is true:** Continue to mode_routing.

**Auto mode** — If `--auto` is present in ARGUMENTS:
- In `check_existing`: auto-load existing context as a revision pass, or continue without prompting
- In `load_prior_context`, `scout_codebase`, and related scouting steps: proceed automatically
- In `present_gray_areas`: auto-select all material gray areas without asking
- In downstream synthesis: bias toward open questions, working assumptions, and guardrails rather than collapsing uncertainty into recommended defaults
- After discussion completes, auto-advance to plan-phase only after writing a research-ready steering brief

**Chain mode** -- If `--chain` is present in ARGUMENTS:
- Discussion is fully interactive (questions, gray area selection -- same as default mode)
- After discussion completes, auto-advance to plan-phase -> execute-phase (same as `--auto`)
- This is the middle ground: user controls the discuss decisions, then plan+execute run autonomously
</step>

<step name="mode_routing">
Resolve the discuss mode and route accordingly.

```bash
DISCUSS_MODE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.discuss_mode 2>/dev/null || echo "exploratory")
```

**Validate mode value:** If `DISCUSS_MODE` is not one of `exploratory`, `discuss`, `assumptions`, default to `exploratory`.

**Route by mode:**

1. **If `DISCUSS_MODE` is `assumptions`:**
   Route to the assumptions workflow entirely. Do NOT continue with this workflow's remaining steps.

   Display:
   ```
   Discuss mode: assumptions — routing to codebase-first inference workflow.
   ```

   Follow the workflow defined in `discuss-phase-assumptions.md` instead. That workflow handles its own init, analysis, context writing, and commit.

   Exit this workflow after the assumptions workflow completes.

2. **If `DISCUSS_MODE` is `discuss`:**
   Standard behavior — proceed to `check_existing` with no modifications. `--auto` picks recommended defaults decisively.

   Display (only if `--auto` is present):
   ```
   Discuss mode: discuss — standard steering brief with decisive auto-selection.
   ```

3. **If `DISCUSS_MODE` is `exploratory`:**
   Proceed to `check_existing` with exploratory modifications active:
   - Template uses `<working_model>` sections with typed claims (see philosophy additions and write_context template)
   - `--auto` behavior modified: auto-progression by type rules per references/claim-types.md
   - Gray area presentation includes typed claim markers

   Display (only if `--auto` is present):
   ```
   Discuss mode: exploratory — preserving uncertainty, auto-progression by type rules.
   ```

Continue to `check_existing`.
</step>

<step name="check_existing">
Check if CONTEXT.md already exists using `has_context` from init.

```bash
ls ${phase_dir}/*-CONTEXT.md 2>/dev/null || true
```

**If exists:**

**If `--auto`:** Auto-select "Update it" — load existing context and continue to analyze_phase. Log: `[auto] Context exists — updating with auto-selected decisions.`

**Otherwise:** Use AskUserQuestion:
- header: "Context"
- question: "Phase [X] already has context. What do you want to do?"
- options:
  - "Update it" — Review and revise existing context
  - "View it" — Show me what's there
  - "Skip" — Use existing context as-is

If "Update": Load existing, continue to analyze_phase
If "View": Display CONTEXT.md, then offer update/skip
If "Skip": Exit workflow

**If doesn't exist:**

Check `has_plans` and `plan_count` from init. **If `has_plans` is true:**

**If `--auto`:** Auto-select "Continue and replan after". Log: `[auto] Plans exist — continuing with context capture, will replan after.`

**Otherwise:** Use AskUserQuestion:
- header: "Plans exist"
- question: "Phase [X] already has {plan_count} plan(s) created without user context. Your decisions here won't affect existing plans unless you replan."
- options:
  - "Continue and replan after" — Capture context, then run /gsd:plan-phase {X} ${GSD_WS} to replan
  - "View existing plans" — Show plans before deciding
  - "Cancel" — Skip discuss-phase

If "Continue and replan after": Continue to analyze_phase.
If "View existing plans": Display plan files, then offer "Continue" / "Cancel".
If "Cancel": Exit workflow.

**If `has_plans` is false:** Continue to load_prior_context.
</step>

<step name="load_prior_context">
Read project-level and prior phase context to avoid re-asking decided questions and maintain consistency.

**Step 1: Read project-level files**
```bash
# Core project files
cat .planning/PROJECT.md 2>/dev/null || true
cat .planning/REQUIREMENTS.md 2>/dev/null || true
cat .planning/STATE.md 2>/dev/null || true
```

Extract from these:
- **PROJECT.md** — Vision, principles, non-negotiables, user preferences
- **REQUIREMENTS.md** — Acceptance criteria, constraints, must-haves vs nice-to-haves
- **STATE.md** — Current progress, any flags or session notes

**Step 2: Read all prior CONTEXT.md files**
```bash
# Find all CONTEXT.md files from phases before current
(find .planning/phases -name "*-CONTEXT.md" 2>/dev/null || true) | sort
```

For each CONTEXT.md where phase number < current phase:
- Read the `<decisions>` section — these are locked preferences
- Read `<specifics>` — particular references or "I want it like X" moments
- Note any patterns (e.g., "user consistently prefers minimal UI", "user rejected single-key shortcuts")

**Step 3: Build internal `<prior_decisions>` context**

Structure the extracted information:
```
<prior_decisions>
## Project-Level
- [Key principle or constraint from PROJECT.md]
- [Requirement that affects this phase from REQUIREMENTS.md]

## From Prior Phases
### Phase N: [Name]
- [Decision that may be relevant to current phase]
- [Preference that establishes a pattern]

### Phase M: [Name]
- [Another relevant decision]
</prior_decisions>
```

**Usage in subsequent steps:**
- `analyze_phase`: Skip gray areas already decided in prior phases
- `present_gray_areas`: Annotate options with prior decisions ("You chose X in Phase 5")
- `discuss_areas`: Pre-fill answers or flag conflicts ("This contradicts Phase 3 — same here or different?")

**If no prior context exists:** Continue without — this is expected for early phases.
</step>

<step name="cross_reference_todos">
Check if any pending todos are relevant to this phase's scope. Surfaces backlog items that might otherwise be missed.

**Load and match todos:**
```bash
TODO_MATCHES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" todo match-phase "${PHASE_NUMBER}")
```

Parse JSON for: `todo_count`, `matches[]` (each with `file`, `title`, `area`, `score`, `reasons`).

**If `todo_count` is 0 or `matches` is empty:** Skip silently — no workflow slowdown.

**If matches found:**

Present matched todos to the user. Show each match with its title, area, and why it matched:

```
📋 Found {N} pending todo(s) that may be relevant to Phase {X}:

{For each match:}
- **{title}** (area: {area}, relevance: {score}) — matched on {reasons}
```

Use AskUserQuestion (multiSelect) asking which todos to fold into this phase's scope:

```
Which of these todos should be folded into Phase {X} scope?
(Select any that apply, or none to skip)
```

**For selected (folded) todos:**
- Store internally as `<folded_todos>` for inclusion in CONTEXT.md `<decisions>` section
- These become additional scope items that downstream agents (researcher, planner) will see

**For unselected (reviewed but not folded) todos:**
- Store internally as `<reviewed_todos>` for inclusion in CONTEXT.md `<deferred>` section
- This prevents future phases from re-surfacing the same todos as "missed"

**Auto mode (`--auto`):** Fold all todos with score >= 0.4 automatically. Log the selection.
</step>

<step name="scout_codebase">
Lightweight scan of existing code to inform gray area identification and discussion. Uses ~10% context — acceptable for an interactive session.

**Step 1: Check for existing codebase maps**
```bash
ls .planning/codebase/*.md 2>/dev/null || true
```

**If codebase maps exist:** Read the most relevant ones (CONVENTIONS.md, STRUCTURE.md, STACK.md based on phase type). Extract:
- Reusable components/hooks/utilities
- Established patterns (state management, styling, data fetching)
- Integration points (where new code would connect)

Skip to Step 3 below.

**Step 2: If no codebase maps, do targeted grep**

Extract key terms from the phase goal (e.g., "feed" → "post", "card", "list"; "auth" → "login", "session", "token").

```bash
# Find files related to phase goal terms
grep -rl "{term1}\|{term2}" src/ app/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -10 || true

# Find existing components/hooks
ls src/components/ 2>/dev/null || true
ls src/hooks/ 2>/dev/null || true
ls src/lib/ src/utils/ 2>/dev/null || true
```

Read the 3-5 most relevant files to understand existing patterns.

**Step 3: Build internal codebase_context**

From the scan, identify:
- **Reusable assets** — existing components, hooks, utilities that could be used in this phase
- **Established patterns** — how the codebase does state management, styling, data fetching
- **Integration points** — where new code would connect (routes, nav, providers)
- **Creative options** — approaches the existing architecture enables or constrains

Store as internal `<codebase_context>` for use in analyze_phase and present_gray_areas. This is NOT written to a file — it's used within this session only.
</step>

<step name="surface_kb_knowledge">
Check for relevant knowledge base entries that might inform gray area identification and discussion.

**Step 1: Locate KB index**
```bash
KB_DIR=""
if [ -d ".planning/knowledge" ]; then
  KB_DIR=".planning/knowledge"
elif [ -d "$HOME/.gsd/knowledge" ]; then
  KB_DIR="$HOME/.gsd/knowledge"
fi
if [ -n "$KB_DIR" ]; then
  cat "$KB_DIR/index.md" 2>/dev/null || true
fi
```

If no KB directory exists or index.md is missing: skip this step silently. No workflow slowdown for projects without a knowledge base.

**Step 2: Extract phase keywords**
From the phase goal in ROADMAP.md (already loaded), identify 3-5 domain keywords relevant to this phase's scope. For example, a phase about "authentication" yields keywords like "auth", "login", "session", "JWT".

**Step 3: Scan index for matches**
Grep the index for entries whose tags overlap with phase keywords. Use LLM judgment for semantic relevance -- exact substring match is not required. Prioritize:
- Lessons (les-*) over signals (sig-*) -- lessons are refined knowledge
- Spikes (spk-*) with resolved status -- spikes answer uncertainty
- Signals with severity >= notable -- skip minor/trace signals

**Step 4: Read top matches (max 5)**
For the top 5 matching entries by relevance, read the full entry files from `$KB_DIR/signals/` or `$KB_DIR/spikes/` or `$KB_DIR/lessons/`.

**Step 5: Build internal kb_context**
If matches were found, build an internal context block:

```
<kb_context>
## Relevant KB Entries

- [entry-id]: One-line summary of finding relevant to this phase
- [entry-id]: One-line summary of finding relevant to this phase
</kb_context>
```

Cap at 3-5 items (per guardrail G3). Each item is a one-liner, not the full entry content. Total KB context should stay under ~500 tokens.

If no relevant entries found: set `<kb_context>` to empty. Do not slow down the workflow.

Store as internal variable for use in `analyze_phase` step alongside `codebase_context` and `prior_decisions`.
</step>

<step name="analyze_phase">
Analyze the phase to identify gray areas worth discussing. **Use `prior_decisions`, `codebase_context`, and `kb_context` to ground the analysis.**

**Read the phase description from ROADMAP.md and determine:**

1. **Domain boundary** — What capability is this phase delivering? State it clearly.

1b. **Initialize canonical refs accumulator** — Start building the `<canonical_refs>` list for CONTEXT.md. This accumulates throughout the entire discussion, not just this step.

   **Source 1 (now):** Copy `Canonical refs:` from ROADMAP.md for this phase. Expand each to a full relative path.
   **Source 2 (now):** Check REQUIREMENTS.md and PROJECT.md for any specs/ADRs referenced for this phase.
   **Source 3 (scout_codebase):** If existing code references docs (e.g., comments citing ADRs), add those.
   **Source 4 (discuss_areas):** When the user says "read X", "check Y", or references any doc/spec/ADR during discussion — add it immediately. These are often the MOST important refs because they represent docs the user specifically wants followed.

   This list is MANDATORY in CONTEXT.md. Every ref must have a full relative path so downstream agents can read it directly. If no external docs exist, note that explicitly.

2. **Check prior decisions** — Before generating gray areas, check if any were already decided:
   - Scan `<prior_decisions>` for relevant choices (e.g., "Ctrl+C only, no single-key shortcuts")
   - These are **pre-answered** — don't re-ask unless this phase has conflicting needs
   - Note applicable prior decisions for use in presentation

3. **Gray areas by category** — For each relevant category (UI, UX, Behavior, Empty States, Content), identify 1-2 specific ambiguities that would change implementation. **Annotate with code context where relevant** (e.g., "You already have a Card component" or "No existing pattern for this").

4. **Skip assessment** — If no meaningful gray areas exist (pure infrastructure, clear-cut implementation, or all already decided in prior phases), the phase may not need discussion.

**Advisor Mode Detection:**

Check if advisor mode should activate:

1. Check for USER-PROFILE.md:
   ```bash
   PROFILE_PATH="$HOME/.claude/get-shit-done/USER-PROFILE.md"
   ```
   ADVISOR_MODE = file exists at PROFILE_PATH → true, otherwise → false

2. If ADVISOR_MODE is true, resolve vendor_philosophy calibration tier:
   - Priority 1: Read config.json > preferences.vendor_philosophy (project-level override)
   - Priority 2: Read USER-PROFILE.md Vendor Choices/Philosophy rating (global)
   - Priority 3: Default to "standard" if neither has a value or value is UNSCORED

   Map to calibration tier:
   - conservative OR thorough-evaluator → full_maturity
   - opinionated → minimal_decisive
   - pragmatic-fast OR any other value OR empty → standard

3. Resolve model for advisor agents:
   ```bash
   ADVISOR_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-advisor-researcher --raw)
   ```

If ADVISOR_MODE is false, skip all advisor-specific steps — workflow proceeds with existing conversational flow unchanged.

**Output your analysis internally, then present to user.**

Example analysis for "Post Feed" phase (with code and prior context):
```
Domain: Displaying posts from followed users
Existing: Card component (src/components/ui/Card.tsx), useInfiniteQuery hook, Tailwind CSS
Prior decisions: "Minimal UI preferred" (Phase 2), "No pagination — always infinite scroll" (Phase 4)
Gray areas:
- UI: Layout style (cards vs timeline vs grid) — Card component exists with shadow/rounded variants
- UI: Information density (full posts vs previews) — no existing density patterns
- Behavior: Loading pattern — ALREADY DECIDED: infinite scroll (Phase 4)
- Empty State: What shows when no posts exist — EmptyState component exists in ui/
- Content: What metadata displays (time, author, reactions count)
```
</step>

<step name="present_gray_areas">
Present the domain boundary, prior decisions, and gray areas to user.

**First, state the boundary and any prior decisions that apply:**
```
Phase [X]: [Name]
Domain: [What this phase delivers — from your analysis]

We'll clarify HOW to implement this.
(New capabilities belong in other phases.)

[If prior decisions apply:]
**Carrying forward from earlier phases:**
- [Decision from Phase N that applies here]
- [Decision from Phase M that applies here]
```

**If `--auto`:** Auto-select ALL gray areas. Log: `[auto] Selected all gray areas: [list area names].` Skip the AskUserQuestion below and continue directly to discuss_areas with all areas selected.

**Otherwise, use AskUserQuestion (multiSelect: true):**
- header: "Discuss"
- question: "Which areas do you want to discuss for [phase name]?"
- options: Generate 3-4 phase-specific gray areas, each with:
  - "[Specific area]" (label) — concrete, not generic
  - [1-2 questions this covers + code context annotation] (description)
  - **Highlight the recommended choice with brief explanation why**

**Prior decision annotations:** When a gray area was already decided in a prior phase, annotate it:
```
☐ Exit shortcuts — How should users quit?
  (You decided "Ctrl+C only, no single-key shortcuts" in Phase 5 — revisit or keep?)
```

**Code context annotations:** When the scout found relevant existing code, annotate the gray area description:
```
☐ Layout style — Cards vs list vs timeline?
  (You already have a Card component with shadow/rounded variants. Reusing it keeps the app consistent.)
```

**Combining both:** When both prior decisions and code context apply:
```
☐ Loading behavior — Infinite scroll or pagination?
  (You chose infinite scroll in Phase 4. useInfiniteQuery hook already set up.)
```

**Do NOT include a "skip" or "you decide" option.** User ran this command to discuss — give them real choices.

**Examples by domain (with code context):**

For "Post Feed" (visual feature):
```
☐ Layout style — Cards vs list vs timeline? (Card component exists with variants)
☐ Loading behavior — Infinite scroll or pagination? (useInfiniteQuery hook available)
☐ Content ordering — Chronological, algorithmic, or user choice?
☐ Post metadata — What info per post? Timestamps, reactions, author?
```

For "Database backup CLI" (command-line tool):
```
☐ Output format — JSON, table, or plain text? Verbosity levels?
☐ Flag design — Short flags, long flags, or both? Required vs optional?
☐ Progress reporting — Silent, progress bar, or verbose logging?
☐ Error recovery — Fail fast, retry, or prompt for action?
```

For "Organize photo library" (organization task):
```
☐ Grouping criteria — By date, location, faces, or events?
☐ Duplicate handling — Keep best, keep all, or prompt each time?
☐ Naming convention — Original names, dates, or descriptive?
☐ Folder structure — Flat, nested by year, or by category?
```

Continue to discuss_areas with selected areas (or advisor_research if ADVISOR_MODE is true).
</step>

<step name="advisor_research">
**Advisor Research** (only when ADVISOR_MODE is true)

After user selects gray areas in present_gray_areas, spawn parallel research agents.

1. Display brief status: "Researching {N} areas..."

2. For EACH user-selected gray area, spawn a Task() in parallel.

   Before each spawn, run the GATE-05 echo_delegation macro:

   ```bash
   # GATE-05: echo delegation before spawn
   # Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
   SUBAGENT_TYPE="general-purpose"   # Proxy for gsd-advisor-researcher via inline-prompt pattern
   MODEL="{ADVISOR_MODEL}"
   REASONING_EFFORT="default"
   ISOLATION="none"
   SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
   WORKFLOW_FILE="get-shit-done/workflows/discuss-phase.md"
   WORKFLOW_STEP="advisor_research"
   RUNTIME="${GSD_RUNTIME:-claude-code}"

   echo "[DELEGATION] agent=${SUBAGENT_TYPE}(proxy:gsd-advisor-researcher) model=${MODEL} reasoning_effort=${REASONING_EFFORT} isolation=${ISOLATION:-none} session=${SESSION_ID}"

   mkdir -p .planning 2>/dev/null || true
   printf '{"ts":"%s","agent":"%s","model":"%s","reasoning_effort":"%s","isolation":"%s","session_id":"%s","workflow_file":"%s","workflow_step":"%s","runtime":"%s"}\n' \
     "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
     "${SUBAGENT_TYPE}(proxy:gsd-advisor-researcher)" \
     "${MODEL}" \
     "${REASONING_EFFORT}" \
     "${ISOLATION:-none}" \
     "${SESSION_ID}" \
     "${WORKFLOW_FILE}" \
     "${WORKFLOW_STEP}" \
     "${RUNTIME}" \
     >> .planning/delegation-log.jsonl || true
   ```

   # DISPATCH CONTRACT (restated inline per GATE-13 — compaction-resilient)
   # Agent: general-purpose (proxy for gsd-advisor-researcher via inline-prompt pattern)
   # Model: sonnet  (resolved from {ADVISOR_MODEL} via resolveModelInternal(cwd, "gsd-advisor-researcher") under model_profile=quality; alias mode)
   # Reasoning effort: default
   # Isolation: none
   # Required inputs:
   #   - {area_name} + {area_description} from gray area identification
   #   - {phase_goal} and {description} from ROADMAP.md
   #   - {project_context} from PROJECT.md
   #   - {calibration_tier} (full_maturity | standard | minimal_decisive)
   #   - ~/.claude/agents/gsd-advisor-researcher.md (role instructions read by proxy)
   # Output path: N/A (inline structured comparison table returned to orchestrator)
   # Codex behavior: applies-via-workflow-step
   # Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
   Task(
     prompt="First, read @~/.claude/agents/gsd-advisor-researcher.md for your role and instructions.

     <gray_area>{area_name}: {area_description from gray area identification}</gray_area>
     <phase_context>{phase_goal and description from ROADMAP.md}</phase_context>
     <project_context>{project name and brief description from PROJECT.md}</project_context>
     <calibration_tier>{resolved calibration tier: full_maturity | standard | minimal_decisive}</calibration_tier>

     Research this gray area and return a structured comparison table with rationale.
     ${AGENT_SKILLS_ADVISOR}",
     subagent_type="general-purpose",
     model="{ADVISOR_MODEL}",   # BAKED IN comment: sonnet (was template at authorship — 2026-04-20; resolved against canonical gsd-advisor-researcher)
     description="Research: {area_name}"
   )

   All Task() calls spawn simultaneously — do NOT wait for one before starting the next.

3. After ALL agents return, SYNTHESIZE results before presenting:
   For each agent's return:
   a. Parse the markdown comparison table and rationale paragraph
   b. Verify all 5 columns present (Option | Pros | Cons | Complexity | Recommendation) — fill any missing columns rather than showing broken table
   c. Verify option count matches calibration tier:
      - full_maturity: 3-5 options acceptable
      - standard: 2-4 options acceptable
      - minimal_decisive: 1-2 options acceptable
      If agent returned too many, trim least viable. If too few, accept as-is.
   d. Rewrite rationale paragraph to weave in project context and ongoing discussion context that the agent did not have access to
   e. If agent returned only 1 option, convert from table format to direct recommendation: "Standard approach for {area}: {option}. {rationale}"

4. Store synthesized tables for use in discuss_areas.

**If ADVISOR_MODE is false:** Skip this step entirely — proceed directly from present_gray_areas to discuss_areas.
</step>

<step name="discuss_areas">
Discuss each selected area with the user. Flow depends on advisor mode.

**If ADVISOR_MODE is true:**

Table-first discussion flow — present research-backed comparison tables, then capture user picks.

**For each selected area:**

1. **Present the synthesized comparison table + rationale paragraph** (from advisor_research step)

2. **Use AskUserQuestion:**
   - header: "{area_name}"
   - question: "Which approach for {area_name}?"
   - options: Extract from the table's Option column (AskUserQuestion adds "Other" automatically)

3. **Record the user's selection:**
   - If user picks from table options → record as locked decision for that area
   - If user picks "Other" → receive their input, reflect it back for confirmation, record

4. **After recording pick, Claude decides whether follow-up questions are needed:**
   - If the pick has ambiguity that would affect downstream planning → ask 1-2 targeted follow-up questions using AskUserQuestion
   - If the pick is clear and self-contained → move to next area
   - Do NOT ask the standard 4 questions — the table already provided the context

5. **After all areas processed:**
   - header: "Done"
   - question: "That covers [list areas]. Ready to create context?"
   - options: "Create context" / "Revisit an area"

**Scope creep handling (advisor mode):**
If user mentions something outside the phase domain:
```
"[Feature] sounds like a new capability — that belongs in its own phase.
I'll note it as a deferred idea.

Back to [current area]: [return to current question]"
```

Track deferred ideas internally.

---

**If ADVISOR_MODE is false:**

For each selected area, conduct a focused discussion loop.

**Research-before-questions mode:** Check if `workflow.research_before_questions` is enabled in config (from init context or `.planning/config.json`). When enabled, before presenting questions for each area:
1. Do a brief web search for best practices related to the area topic
2. Summarize the top findings in 2-3 bullet points
3. Present the research alongside the question so the user can make a more informed decision

Example with research enabled:
```
Let's talk about [Authentication Strategy].

📊 Best practices research:
• OAuth 2.0 + PKCE is the current standard for SPAs (replaces implicit flow)
• Session tokens with httpOnly cookies preferred over localStorage for XSS protection
• Consider passkey/WebAuthn support — adoption is accelerating in 2025-2026

With that context: How should users authenticate?
```

When disabled (default), skip the research and present questions directly as before.

**Text mode support:** Parse optional `--text` from `$ARGUMENTS`.
- Accept `--text` flag OR read `workflow.text_mode` from config (from init context)
- When active, replace ALL `AskUserQuestion` calls with plain-text numbered lists
- User types a number to select, or types free text for "Other"
- This is required for Claude Code remote sessions (`/rc` mode) where TUI menus
  don't work through the Claude App

**Batch mode support:** Parse optional `--batch` from `$ARGUMENTS`.
- Accept `--batch`, `--batch=N`, or `--batch N`

**Analyze mode support:** Parse optional `--analyze` from `$ARGUMENTS`.
When `--analyze` is active, before presenting each question (or question group in batch mode), provide a brief **trade-off analysis** for the decision:
- 2-3 options with pros/cons based on codebase context and common patterns
- A recommended approach with reasoning
- Known pitfalls or constraints from prior phases

Example with `--analyze`:
```
**Trade-off analysis: Authentication strategy**

| Approach | Pros | Cons |
|----------|------|------|
| Session cookies | Simple, httpOnly prevents XSS | Requires CSRF protection, sticky sessions |
| JWT (stateless) | Scalable, no server state | Token size, revocation complexity |
| OAuth 2.0 + PKCE | Industry standard for SPAs | More setup, redirect flow UX |

💡 Recommended: OAuth 2.0 + PKCE — your app has social login in requirements (REQ-04) and this aligns with the existing NextAuth setup in `src/lib/auth.ts`.

How should users authenticate?
```

This gives the user context to make informed decisions without extra prompting. When `--analyze` is absent, present questions directly as before.
- Accept `--batch`, `--batch=N`, or `--batch N`
- Default to 4 questions per batch when no number is provided
- Clamp explicit sizes to 2-5 so a batch stays answerable
- If `--batch` is absent, keep the existing one-question-at-a-time flow

**Philosophy:** stay adaptive, but let the user choose the pacing.
- Default mode: 4 single-question turns, then check whether to continue
- `--batch` mode: 1 grouped turn with 2-5 numbered questions, then check whether to continue

Each answer (or answer set, in batch mode) should reveal the next question or next batch.

**Auto mode (`--auto`):** Behavior depends on `DISCUSS_MODE`:

- **`discuss` mode (standard):** For each area, Claude selects the recommended option (first option, or the one explicitly marked "recommended") for every question without using AskUserQuestion. Log each auto-selected choice:
  ```
  [auto] [Area] — Q: "[question text]" → Selected: "[chosen option]" (recommended default)
  ```

- **`exploratory` mode:** For each area, Claude assigns a claim type per `references/claim-types.md` and evaluates auto-progression eligibility by type rules. Auto-select claims that are auto-ready:
  ```
  [auto] [Area] — Q: "[question text]" → Selected: "[chosen option]" [decided:reasoned] or [assumed:reasoned]
  ```
  For claims that are NOT auto-ready (`[assumed:bare]`, `[open]`):
  ```
  [auto] [Area] — Q: "[question text]" → Open question ([open] — requires research)
  ```
  Open questions are recorded in CONTEXT.md's `<questions>` section with generative format (research program, downstream decisions, reversibility).

After all areas are auto-resolved, skip the "Explore more gray areas" prompt and proceed directly to write_context.

**Interactive mode (no `--auto`):**

**For each area:**

1. **Announce the area:**
   ```
   Let's talk about [Area].
   ```

2. **Ask questions using the selected pacing:**

   **Default (no `--batch`): Ask 4 questions using AskUserQuestion**
   - header: "[Area]" (max 12 chars — abbreviate if needed)
   - question: Specific decision for this area
   - options: 2-3 concrete choices (AskUserQuestion adds "Other" automatically), with the recommended choice highlighted and brief explanation why
   - **Annotate options with code context** when relevant:
     ```
     "How should posts be displayed?"
     - Cards (reuses existing Card component — consistent with Messages)
     - List (simpler, would be a new pattern)
     - Timeline (needs new Timeline component — none exists yet)
     ```
   - Include "You decide" as an option when reasonable — captures Claude discretion
   - **Context7 for library choices:** When a gray area involves library selection (e.g., "magic links" → query next-auth docs) or API approach decisions, use `mcp__context7__*` tools to fetch current documentation and inform the options. Don't use Context7 for every question — only when library-specific knowledge improves the options.

   **Batch mode (`--batch`): Ask 2-5 numbered questions in one plain-text turn**
   - Group closely related questions for the current area into a single message
   - Keep each question concrete and answerable in one reply
   - When options are helpful, include short inline choices per question rather than a separate AskUserQuestion for every item
   - After the user replies, reflect back the captured decisions, note any unanswered items, and ask only the minimum follow-up needed before moving on
   - Preserve adaptiveness between batches: use the full set of answers to decide the next batch or whether the area is sufficiently clear

3. **After the current set of questions, check:**
   - header: "[Area]" (max 12 chars)
   - question: "More questions about [area], or move to next? (Remaining: [list other unvisited areas])"
   - options: "More questions" / "Next area"

   When building the question text, list the remaining unvisited areas so the user knows what's ahead. For example: "More questions about Layout, or move to next? (Remaining: Loading behavior, Content ordering)"

   If "More questions" → ask another 4 single questions, or another 2-5 question batch when `--batch` is active, then check again
   If "Next area" → proceed to next selected area
   If "Other" (free text) → interpret intent: continuation phrases ("chat more", "keep going", "yes", "more") map to "More questions"; advancement phrases ("done", "move on", "next", "skip") map to "Next area". If ambiguous, ask: "Continue with more questions about [area], or move to the next area?"

4. **After all initially-selected areas complete:**
   - Summarize what was captured from the discussion so far
   - AskUserQuestion:
     - header: "Done"
     - question: "We've discussed [list areas]. Which gray areas remain unclear?"
     - options: "Explore more gray areas" / "I'm ready for context"
   - If "Explore more gray areas":
     - Identify 2-4 additional gray areas based on what was learned
     - Return to present_gray_areas logic with these new areas
     - Loop: discuss new areas, then prompt again
   - If "I'm ready for context": Proceed to write_context

**Canonical ref accumulation during discussion:**
When the user references a doc, spec, or ADR during any answer — e.g., "read adr-014", "check the MCP spec", "per browse-spec.md" — immediately:
1. Read the referenced doc (or confirm it exists)
2. Add it to the canonical refs accumulator with full relative path
3. Use what you learned from the doc to inform subsequent questions

These user-referenced docs are often MORE important than ROADMAP.md refs because they represent docs the user specifically wants downstream agents to follow. Never drop them.

**Question design:**
- Options should be concrete, not abstract ("Cards" not "Option A")
- Each answer should inform the next question or next batch
- If user picks "Other" to provide freeform input (e.g., "let me describe it", "something else", or an open-ended reply), ask your follow-up as plain text — NOT another AskUserQuestion. Wait for them to type at the normal prompt, then reflect their input back and confirm before resuming AskUserQuestion or the next numbered batch.

**Scope creep handling:**
If user mentions something outside the phase domain:
```
"[Feature] sounds like a new capability — that belongs in its own phase.
I'll note it as a deferred idea.

Back to [current area]: [return to current question]"
```

Track deferred ideas internally.

**Track discussion log data internally:**
For each question asked, accumulate:
- Area name
- All options presented (label + description)
- Which option the user selected (or their free-text response)
- Any follow-up notes or clarifications the user provided
This data is used to generate DISCUSSION-LOG.md in the `write_context` step.
</step>

<step name="write_context">
Create CONTEXT.md capturing decisions made.

**Also generate DISCUSSION-LOG.md** — a justificatory sidecar consumed by the
gsdr-context-checker for claim verification. Also serves as human-readable audit trail
of discuss-phase decisions.

**Find or create phase directory:**

Use values from init: `phase_dir`, `phase_slug`, `padded_phase`.

If `phase_dir` is null (phase exists in roadmap but no directory):
```bash
mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
```

**File location:** `${phase_dir}/${padded_phase}-CONTEXT.md`

**Structure the content by what was discussed:**

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning
**Mode:** [Exploratory|Discuss] [--auto] [--chain] -- [brief mode description]

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — the scope anchor]

</domain>

<!-- MODE-CONDITIONAL: exploratory mode uses working_model sections, discuss mode uses decisions -->

<!-- IF DISCUSS_MODE == exploratory -->
<working_model>
## Working Model & Assumptions

### [Topic area 1 that was discussed]

**Current state:** [Brief description of what exists now relevant to this topic]

- [type:verification] Claim text
- [type:verification] Another claim

### [Topic area 2 that was discussed]

**Current state:** [Brief description]

- [type:verification] Claim text

### Claude's Discretion
[Areas where Claude has flexibility during planning/implementation]

</working_model>

<constraints>
## Derived Constraints

[Constraints derived from requirements, prior phases, signals, or code reality.
Each constraint cites its derivation source.]

- **DC-1:** [type:verification] Constraint text -- derived from [source]
- **DC-2:** [type:verification] Constraint text -- derived from [source]

</constraints>

<guardrails>
## Epistemic Guardrails

[Bounds on investigation and implementation. What must NOT be assumed.
Verification standards. Quality thresholds.]

- **G-1:** [type:verification] Guardrail text
- **G-2:** [type:verification] Guardrail text

</guardrails>

<questions>
## Open Questions

[Research questions in generative format. NOT binary yes/no.
Each question specifies methodology, not just asks a question.]

### Q1: [Question title]
**Research program:** [How to investigate -- methodology, sources, experiments]
**Downstream decisions affected:** [What depends on the answer]
**Reversibility:** [Cost of getting this wrong -- HIGH/MEDIUM/LOW with explanation]

### Q2: [Question title]
**Research program:** [How to investigate]
**Downstream decisions affected:** [What depends on the answer]
**Reversibility:** [Cost of getting this wrong]

</questions>

<dependencies>
## Claim Dependencies

[Which claims depend on which. A decided claim resting on an assumed claim is a vulnerability.]

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| [ref to claim] | [ref to supporting claim] | [HIGH/MEDIUM/LOW -- why] |

</dependencies>

<!-- ELSE IF DISCUSS_MODE == discuss -->
<decisions>
## Implementation Decisions

### [Category 1 that was discussed]
- **D-01:** [Decision or preference captured]
- **D-02:** [Another decision if applicable]

### [Category 2 that was discussed]
- **D-03:** [Decision or preference captured]

### Claude's Discretion
[Areas where user said "you decide" — note that Claude has flexibility here]

### Folded Todos
[If any todos were folded into scope from the cross_reference_todos step, list them here.
Each entry should include the todo title, original problem, and how it fits this phase's scope.
If no todos were folded: omit this subsection entirely.]

</decisions>
<!-- ENDIF -->

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

[MANDATORY section. Write the FULL accumulated canonical refs list here.
Sources: ROADMAP.md refs + REQUIREMENTS.md refs + user-referenced docs during
discussion + any docs discovered during codebase scout. Group by topic area.
Every entry needs a full relative path — not just a name.]

### [Topic area 1]
- `path/to/adr-or-spec.md` — [What it decides/defines that's relevant]
- `path/to/doc.md` §N — [Specific section reference]

### [Topic area 2]
- `path/to/feature-doc.md` — [What this doc defines]

[If no external specs: "No external specs — requirements fully captured in decisions above"]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [Component/hook/utility]: [How it could be used in this phase]

### Established Patterns
- [Pattern]: [How it constrains/enables this phase]

### Integration Points
- [Where new code connects to existing system]

</code_context>

<specifics>
## Specific Ideas

[Any particular references, examples, or "I want it like X" moments from discussion]

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<deferred>
## Deferred Ideas

[Ideas that came up but belong in other phases. Don't lose them.]

### Reviewed Todos (not folded)
[If any todos were reviewed in cross_reference_todos but not folded into scope,
list them here so future phases know they were considered.
Each entry: todo title + reason it was deferred (out of scope, belongs in Phase Y, etc.)
If no reviewed-but-deferred todos: omit this subsection entirely.]

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
```

Write file.
</step>

<step name="confirm_creation">
Present summary and next steps:

```
Created: .planning/phases/${PADDED_PHASE}-${SLUG}/${PADDED_PHASE}-CONTEXT.md

## Decisions Captured

### [Category]
- [Key decision]

### [Category]
- [Key decision]

[If deferred ideas exist:]
## Noted for Later
- [Deferred idea] — future phase

---

## ▶ Next Up

**Phase ${PHASE}: [Name]** — [Goal from ROADMAP.md]

`/gsd:plan-phase ${PHASE} ${GSD_WS}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/gsd:discuss-phase ${PHASE} --chain ${GSD_WS}` — re-run with auto plan+execute after
- `/gsd:plan-phase ${PHASE} --skip-research ${GSD_WS}` — plan without research
- `/gsd:ui-phase ${PHASE} ${GSD_WS}` — generate UI design contract before planning (if phase has frontend work)
- Review/edit CONTEXT.md before continuing

---
```
</step>

<step name="git_commit">
**Write DISCUSSION-LOG.md before committing:**

**File location:** `${phase_dir}/${padded_phase}-DISCUSSION-LOG.md`

The DISCUSSION-LOG.md is a **justificatory sidecar** with three parts. It preserves the human-readable audit trail (Part 1) and adds machine-verifiable claim provenance (Part 2) and a placeholder for context-checker output (Part 3).

```markdown
# Phase [X]: [Name] - Discussion Log

> **Justificatory sidecar.** Consumed by gsdr-context-checker for claim verification.
> Also serves as human-readable audit trail of discuss-phase decisions.

**Date:** [ISO date]
**Phase:** [phase number]-[phase name]
**Mode:** [discuss|exploratory] [--auto] [--chain]
**Areas discussed:** [comma-separated list]

***

## Gray Areas (Audit Trail)

[For each gray area discussed:]

### [Area Name]

| Option | Description | Selected |
|--------|-------------|----------|
| [Option 1] | [Description from AskUserQuestion] | |
| [Option 2] | [Description] | ✓ |
| [Option 3] | [Description] | |

**User's choice:** [Selected option or free-text response]
**Notes:** [Any clarifications, follow-up context, or rationale the user provided]

[Repeat for each area]

### Claude's Discretion

[List areas where user said "you decide" or deferred to Claude]

### Deferred Ideas

[Ideas mentioned during discussion that were noted for future phases]

***

## Claim Justifications

For each typed claim in CONTEXT.md, record the type-specific justification.
Group by topic area matching Working Model / Decisions sections.
See `references/claim-types.md` for justificatory expectations per type.

### [Topic area 1]

**[evidenced:cited] Claim text**
- **Citation:** [file path, line, measurement, or artifact]
- **Verification:** [how it was checked; current/stale status]

**[decided:reasoned] Claim text**
- **Alternatives considered:** [list of alternatives]
- **Why rejected:** [rationale for each rejected alternative]
- **User said:** [user's statement or directive, if any]

**[assumed:reasoned] Claim text**
- **Challenge protocol:** [what would falsify this]
- **Evidence checked:** [what was checked, even if inconclusive]
- **Why reasonable:** [rationale pending research]

**[open] Claim text**
- **What's been tried:** [investigation attempts so far]
- **Why unresolved:** [what prevents resolution now]
- **Research delegation:** [what the researcher should investigate]

**[projected:reasoned] Claim text**
- **Basis:** [evidence chain from current state to future need]
- **Future phase:** [which phase/roadmap item this projects toward]

**[stipulated:bare] Claim text**
- **Acknowledged as choice:** [yes -- this is picked, not derived]
- **Calibration evidence:** [any evidence for or against this value]
- **Reasonable range:** [what values would also be defensible]

**[governing:reasoned] Claim text**
- **Source:** [deliberation, user value, philosophical framework, convention]
- **Scope of governance:** [what this principle constrains]

### [Topic area 2]

[Repeat per-claim entries for each topic area]

### Claim Dependencies

[Replicate the dependency table from CONTEXT.md <dependencies> section]

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| [ref to claim] | [ref to supporting claim] | [HIGH/MEDIUM/LOW -- why] |

***

## Context-Checker Verification Log

This section is populated by the gsdr-context-checker agent after it runs.
Leave this header and a placeholder line when first writing the file.

*Awaiting context-checker run.*
```

Write file.

**Check commit_docs config** (from init context):
If `commit_docs` is true, commit the files. If false, skip commit but still write the files.

```bash
if [ "$commit_docs" = "true" ]; then
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): capture phase context" --files "${phase_dir}/${padded_phase}-CONTEXT.md" "${phase_dir}/${padded_phase}-DISCUSSION-LOG.md"
fi
```

Confirm: "Committed: docs(${padded_phase}): capture phase context" (or "Skipped commit — commit_docs is false" if not committing).
</step>

<step name="check_context">
**Mode guard:** If `DISCUSS_MODE` is NOT `exploratory`, skip this step entirely and proceed to `update_state` (or `auto_advance`/`confirm_creation`).

**Spawn the context-checker agent** to verify CONTEXT.md claim integrity:

The gsdr-context-checker reads CONTEXT.md and DISCUSSION-LOG.md, verifies typed claims, surfaces untyped load-bearing assumptions, and appends a verification log to DISCUSSION-LOG.md.

Provide the checker with:
- **CONTEXT.md path:** `${phase_dir}/${padded_phase}-CONTEXT.md`
- **DISCUSSION-LOG.md path:** `${phase_dir}/${padded_phase}-DISCUSSION-LOG.md`
- **Reference doc:** `get-shit-done/references/claim-types.md`

```
Task(agent="gsdr-context-checker", input="Verify claim integrity for Phase ${PHASE}. CONTEXT.md: ${phase_dir}/${padded_phase}-CONTEXT.md, DISCUSSION-LOG.md: ${phase_dir}/${padded_phase}-DISCUSSION-LOG.md, Reference: get-shit-done/references/claim-types.md")
```

**After checker completes:** Read the checker's severity verdict from the verification log it appended to DISCUSSION-LOG.md.

**Severity-to-action mapping:**

- **PASS or INFO:** Continue to `auto_advance` (or `confirm_creation`).
- **WARN:** Log warnings in output, continue to `auto_advance` (or `confirm_creation`).
- **FAIL:** Display failures to user. If `--chain` or `--auto`, BLOCK auto-advance and show:
  ```
  Context-checker found blocking issues. Fix CONTEXT.md and re-run discuss-phase,
  or continue manually with /gsdr:plan-phase.
  ```
  If interactive, show failures and offer to continue or fix.

**Commit updated files** (checker may have modified CONTEXT.md and appended to DISCUSSION-LOG.md):

```bash
if [ "$commit_docs" = "true" ]; then
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): context-checker verification" --files "${phase_dir}/${padded_phase}-CONTEXT.md" "${phase_dir}/${padded_phase}-DISCUSSION-LOG.md"
fi
```
</step>

<step name="update_state">
Update STATE.md with session info:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Phase ${PHASE} context gathered" \
  --resume-file "${phase_dir}/${padded_phase}-CONTEXT.md"
```

Commit STATE.md:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(state): record phase ${PHASE} context session" --files .planning/STATE.md
```
</step>

<step name="auto_advance">
Check for auto-advance trigger:

1. Parse `--auto` and `--chain` flags from $ARGUMENTS
2. **Sync chain flag with intent** — if user invoked manually (no `--auto` and no `--chain`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This does NOT touch `workflow.auto_advance` (the user's persistent settings preference):
   ```bash
   if [[ ! "$ARGUMENTS" =~ --auto ]] && [[ ! "$ARGUMENTS" =~ --chain ]]; then
     node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
   fi
   ```
3. Read both the chain flag and user preference:
   ```bash
   AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
   AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
   ```

**If `--auto` or `--chain` flag present AND `AUTO_CHAIN` is not true:** Persist chain flag to config (handles direct `--auto` or `--chain` usage without new-project):
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active true
```

**If `--auto` flag present OR `--chain` flag present OR `AUTO_CHAIN` is true OR `AUTO_CFG` is true:**

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTO-ADVANCING TO PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context captured. Launching plan-phase...
```

Launch plan-phase using the Skill tool to avoid nested Task sessions (which cause runtime freezes due to deep agent nesting — see #686):
```
Skill(skill="gsd:plan-phase", args="${PHASE} --auto ${GSD_WS}")
```

This keeps the auto-advance chain flat — discuss, plan, and execute all run at the same nesting level rather than spawning increasingly deep Task agents.

**Handle plan-phase return:**
- **PHASE COMPLETE** → Full chain succeeded. Display:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSD ► PHASE ${PHASE} COMPLETE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Auto-advance pipeline finished: discuss → plan → execute

  Next: /gsd:discuss-phase ${NEXT_PHASE} ${WAS_CHAIN ? "--chain" : "--auto"} ${GSD_WS}
  <sub>/clear first → fresh context window</sub>
  ```
- **PLANNING COMPLETE** → Planning done, execution didn't complete:
  ```
  Auto-advance partial: Planning complete, execution did not finish.
  Continue: /gsd:execute-phase ${PHASE} ${GSD_WS}
  ```
- **PLANNING INCONCLUSIVE / CHECKPOINT** → Stop chain:
  ```
  Auto-advance stopped: Planning needs input.
  Continue: /gsd:plan-phase ${PHASE} ${GSD_WS}
  ```
- **GAPS FOUND** → Stop chain:
  ```
  Auto-advance stopped: Gaps found during execution.
  Continue: /gsd:plan-phase ${PHASE} --gaps ${GSD_WS}
  ```

**If none of `--auto`, `--chain`, nor config enabled:**
Route to `confirm_creation` step (existing behavior — show manual next steps).
</step>

</process>

<success_criteria>
- Phase validated against roadmap
- Discuss mode resolved from config (`workflow.discuss_mode`) — defaults to `exploratory`
- If `assumptions` mode: routed to discuss-phase-assumptions.md workflow
- Prior context loaded (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
- Already-decided questions not re-asked (carried forward from prior phases)
- Codebase scouted for reusable assets, patterns, and integration points
- Gray areas identified through intelligent analysis with code and prior decision annotations
- User selected which areas to discuss
- Each selected area explored until user satisfied (with code-informed and prior-decision-informed options)
- In exploratory mode: claims carry typed markers per references/claim-types.md; uncertainty preserved rather than resolved
- In exploratory --auto: auto-progression by type rules per references/claim-types.md; open questions recorded as such
- Scope creep redirected to deferred ideas
- CONTEXT.md captures actual decisions (discuss mode) or working assumptions (exploratory mode)
- `--chain` triggers interactive discuss followed by auto plan+execute (no auto-answering)
- `--chain` and `--auto` both persist chain flag and auto-advance to plan-phase
- CONTEXT.md includes canonical_refs section with full file paths to every spec/ADR/doc downstream agents need (MANDATORY — never omit)
- CONTEXT.md includes code_context section with reusable assets and patterns
- Deferred ideas preserved for future phases
- STATE.md updated with session info
- User knows next steps
</success_criteria>
