---
name: gsd:deliberate
description: Start or continue a structured deliberation about a design question, grounded in signals and philosophical principles
argument-hint: '"topic" | --continue <filename>'
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

<objective>
Create or continue a structured deliberation document in `.planning/deliberations/`.

Deliberations are the structured thinking between "something seems off" and "here's what we'll do about it." They can be triggered by formal signals, but equally by conversation observations, user questions, or intuitions that haven't yet crystallized into named problems.

**How it integrates with the pipeline:**
```
Observation (any source) → Deliberation (think) → Planning (plan) → Execution (build) →
Verification (check) → Signal Collection (observe) → Evaluation (compare predictions vs outcomes)
```

Deliberations can enter the pipeline at any point — they don't require upstream signals. A user noticing "why are all signals active?" is a valid trigger, even though no signal says "signals are all active." The deliberation process itself may discover or create signals as a byproduct.
</objective>

<execution_context>
@~/.claude/get-shit-done/templates/deliberation.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Arguments: $ARGUMENTS

@.planning/STATE.md
@.planning/config.json
</context>

<process>

## Mode Detection

Parse arguments to determine mode:

**Continue mode** (`--continue <filename>` or `--continue <slug>`):
1. Find the deliberation file in `.planning/deliberations/`
2. Read its current state
3. Route based on status:
   - `open` → resume analysis, present current state, continue deliberation
   - `concluded` → offer to move to `adopted` (link implementation) or revise
   - `adopted` → offer to move to `evaluated` (check predictions) or revise
   - `evaluated` → present evaluation, offer supersession or closure
4. Skip to Step 6 (the conversational loop)

**New mode** (topic string, no arguments, or mid-conversation):
1. If no arguments: check the current conversation for context first. The user may have been discussing something that naturally led here. Summarize what you understand the topic to be and confirm.
2. If arguments provided: use the topic string as the starting point.
3. Continue to Step 1.

## Step 1: Identify the Trigger

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DELIBERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Deliberations can be triggered by many things. Identify which applies:

| Trigger Type | Example | How to handle |
|-------------|---------|---------------|
| **Conversation observation** | "Why are all signals active?" / "I noticed X seems odd" | Extract the observation from conversation context. The deliberation IS the investigation. |
| **Formal signal** | "Signal sig-2026-03-04-X needs a design response" | Link signal IDs directly. |
| **Question about the system** | "How does X work? Should it work differently?" | The deliberation explores current state and whether change is warranted. |
| **Post-execution reflection** | "Phase N revealed that our approach to X isn't working" | Ground in execution artifacts. |
| **Intuition or unease** | "Something feels wrong about how we handle Y" | Valid trigger. Name the unease, then investigate. |

**Capture the trigger** as a 1-2 sentence statement. This goes into the template's Trigger field.

If the trigger came from conversation (not explicit arguments), summarize what the conversation revealed and confirm with the user: "It sounds like the deliberation topic is: {summary}. Is that right?"

## Step 1.5: Signal Gate

**Purpose:** Observations that trigger deliberations are often signal-worthy themselves. Capturing them as formal signals before deliberating makes them traceable, referenceable by ID, and measurable for recurrence after intervention.

**When this gate fires:** Trigger types: conversation observation, question about the system, intuition, or post-execution reflection. Skip for formal signal triggers (signals already exist).

**How it works:**

1. After the trigger is identified and (if applicable) verified against data in Step 2, assess whether the observation is signal-worthy. An observation is signal-worthy if it:
   - Reveals a systemic gap (not a one-off issue)
   - Would be valuable to track for recurrence after intervention
   - Could be missed by existing sensors (the user noticed it, the system didn't)

2. If signal-worthy, offer to capture it:

   "This observation is worth tracking formally. Creating a signal makes it:
   - **Traceable** — future sessions can find it by ID
   - **Referenceable** — the deliberation links to it, not to ephemeral conversation
   - **Measurable** — we can check if it recurs after we address it

   Create signal for: *'{observation summary}'*?"

3. If yes:
   - Write the signal file directly to `~/.gsd/knowledge/signals/{project}/` using the standard signal schema
   - Use `source: deliberation-trigger` to distinguish from sensor-detected or manual signals
   - Use appropriate `signal_type`: `capability-gap`, `epistemic-gap`, `deviation`, etc.
   - Rebuild index: `bash ~/.gsd/bin/kb-rebuild-index.sh`
   - Reference the signal ID in the deliberation's Evidence Base table (Signal ID column)

4. If no: proceed with informal reference. Note `informal` in the Evidence Base Signal ID column.

**During deliberation** (not just at entry):
As the investigation in Steps 2-4 reveals additional findings, offer to capture those too. The deliberation process often discovers things the sensors missed. Batch if multiple: "Investigation uncovered {N} additional findings worth tracking. Want me to create signals for them?"

Each signal created during deliberation gets `source: deliberation-trigger` and a tag linking it to the deliberation slug (e.g., `deliberation:signal-lifecycle-gap`).

## Step 2: Surface Related Context

Gather relevant context — but treat each source as optional. Not every deliberation has related signals, prior deliberations, or relevant philosophy.

**Scan for related signals** (best-effort):
- Read `~/.gsd/knowledge/index.md` if it exists
- Search for signals related to the topic (keyword match against signal summaries)
- If matches found: list top 5. If none: report "No directly related signals found" and move on.
- **Important:** The absence of signals can itself be informative. If the user noticed a systemic issue that no sensor detected, that's an epistemic gap worth noting.

**Scan for prior deliberations** (best-effort):
- `ls .planning/deliberations/*.md` (exclude philosophy/ subdirectory)
- Check if any existing deliberation covers overlapping territory
- If none: move on.

**Scan for relevant philosophy** (best-effort):
- Read `.planning/deliberations/philosophy/INDEX.md` if it exists
- List 2-3 most relevant philosophical principles. If no philosophy files exist: skip entirely.

**Investigate the observation** (when trigger is conversation/intuition):
- If the user observed something about the system's state (e.g., "all signals are active"), verify it. Run queries, read files, count things. Ground the observation in data before deliberating about it.
- Present what you found: "You noticed X. I checked, and here's what the data shows: {findings}"

Present findings (only sections that have content):

```
## Related Context

{### Observation Verified — if trigger was conversation/intuition}
{What was checked and what the data shows}

{### Active Signals ({N} related) — if any found}
{Table: ID | Severity | Summary}

{### Prior Deliberations — if any found}
{List: filename | status | relevance}

{### Philosophical Principles — if any found}
{List: cite key | principle | relevance}

{### Epistemic Note — if no signals/deliberations found}
{Note what the absence means: "No sensors have detected this pattern, suggesting it falls outside current sensor coverage."}
```

## Step 2: Frame the Question

Ask the user to refine the framing:

"Based on the context above, here's how I'd frame the core question:

**{Draft core question}**

Is this the right framing, or is there a deeper question underneath?"

Use AskUserQuestion with options:
- "That framing works" (proceed)
- "The real question is..." (refine)
- "Let me explain more context first" (gather more)

## Step 3: Create the File

Generate the deliberation file from the template:
- **Filename:** `.planning/deliberations/{slug}.md` where slug is kebab-case from topic
- **Populate:** Date, trigger (from conversation context), affects (from related phases/requirements), related (from context scan)
- **Fill Situation section** with the evidence base from Step 1
- **Fill Framing section** with the agreed core question

Write the file. Report:
```
Created: .planning/deliberations/{slug}.md
Status: Open
```

## Step 4: Explore the Design Space

This is the core deliberation loop. For each option worth considering:

1. **Present the option** with Toulmin structure (claim, grounds, warrant, rebuttal)
2. **Ask the user** to react — agree, challenge, propose alternative
3. **Record tensions** — where do options conflict? What trade-offs exist?

Use AskUserQuestion for structured choices. Use open conversation for nuanced discussion.

**Important:** Do NOT converge too quickly. The value of deliberation is exploring the space, not rushing to a conclusion. Present at least 2 substantively different options before asking which direction to take.

## Step 5: Record Predictions

Before concluding, record falsifiable predictions:

"If we go with Option {X}, what should we observe? Let me propose some predictions — tell me which are right and what I'm missing."

Present 2-4 candidate predictions with:
- What should happen
- When/how we'd check
- What would prove the prediction wrong

## Step 6: Conclude or Leave Open

Ask the user:
- "Ready to conclude with a recommendation?" → Fill Recommendation section, set status to `concluded`
- "Leave open for more thinking" → Save current state, status stays `open`
- "Need to investigate further first" → Note open questions, suggest next steps (spike, research, etc.)

## Step 7: Link to Pipeline

If concluded, offer integration points:

"This deliberation is concluded. To connect it to the pipeline:"

- **Reference in planning:** "When running `/gsd:plan-phase`, mention this deliberation — the planner will read it"
- **Capture as requirement:** "Should any conclusions become formal requirements in REQUIREMENTS.md?"
- **Link signals:** "Should I update STATE.md to note which signals this addresses?"

If the deliberation responds to specific signals, note the signal IDs in the Decision Record section.

## Step 8: Save and Report

Update the file with all content from the conversation. Commit if `commit_docs` is true:

```bash
COMMIT_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_DOCS=false
```

If commit: `git add .planning/deliberations/{file} && git commit -m "docs(deliberation): {slug}"`

Report:
```
───────────────────────────────────────────────────────────────

## Deliberation: {Title}

**Status:** {open|concluded}
**File:** .planning/deliberations/{slug}.md
**Signals referenced:** {N}
**Predictions recorded:** {N}

───────────────────────────────────────────────────────────────
```

</process>

<evaluation_mode>

## Evaluating a Previous Deliberation

When continuing a deliberation in `adopted` status (implementation exists):

1. **Read the predictions** from the Predictions section
2. **Check each prediction** against current codebase state:
   - Search for signal recurrence (related signals in KB post-implementation)
   - Check verification reports for the implementing phase
   - Read SUMMARY.md files from implementing plans
3. **Fill the Evaluation section:**
   - Match predictions against outcomes
   - Assess progressive vs degenerating (Lakatos)
   - Record lessons for future deliberations
4. **Set status to `evaluated`**
5. **Optionally create a signal** if the evaluation reveals something surprising (positive or negative)

This closes the loop: signals → deliberation → intervention → prediction → evaluation → new signals.

</evaluation_mode>

<workflow_integration>

## Where Deliberation Fits in GSD Workflows

**Upstream consumers (who reads deliberations):**
- `/gsd:plan-phase` — planner reads deliberations referenced in CONTEXT.md or ROADMAP.md
- `/gsd:discuss-phase` — creates CONTEXT.md which can reference deliberation conclusions
- `/gsd:reflect` — reflector can reference deliberation predictions when evaluating signal patterns

**Downstream triggers (what triggers deliberation):**
- **Conversation observation:** User notices something odd, asks a question, or expresses unease about system behavior — no formal signal required
- **Signal accumulation:** Signal collection reveals recurring patterns with no existing response
- **Verification gaps:** Phase verification finds gaps that need design thinking before gap closure
- **Reflection output:** Reflector produces lessons that suggest architectural changes
- **Intuition:** "Something feels wrong about X" — valid trigger, investigation happens during deliberation
- **Post-execution:** Phase outcomes reveal that an approach isn't working as expected

**State tracking:**
- STATE.md `Deliberation context:` field links to active deliberations
- ROADMAP.md phase details can reference deliberations in their description
- CONTEXT.md per-phase can include pointers to relevant concluded deliberations

</workflow_integration>

<design_notes>
- Deliberations are human-driven, system-supported (per deliberation-system-design.md)
- The system surfaces context and structures conversation; the human deliberates
- Template sections map to philosophical frameworks (noted in HTML comments)
- Predictions are the key innovation: they make deliberations falsifiable
- Evaluation mode enables meta-learning about deliberation quality itself
- This is v1 — deliberately minimal. The convention will evolve through use.
</design_notes>
