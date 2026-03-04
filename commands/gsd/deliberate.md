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

Deliberations are the structured thinking between "we detected a problem" and "here's what we'll do about it." They link signals to interventions, record falsifiable predictions, and enable meta-evaluation of whether our design decisions actually worked.

**How it integrates with the pipeline:**
```
Signals (detect) → Deliberation (think) → Planning (plan) → Execution (build) → Verification (check) → Signal Collection (observe) → Evaluation (compare predictions vs outcomes)
```

Deliberations sit between signal collection and planning. They consume signals and produce design decisions that planning consumes.
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

**New mode** (topic string or no arguments):
1. If no arguments, ask: "What design question or observation do you want to deliberate on?"
2. Continue to Step 1

## Step 1: Surface Context

Before creating the file, gather relevant context automatically:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DELIBERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Scan for related signals:**
- Read `~/.gsd/knowledge/index.md`
- Search for signals related to the topic (keyword match against signal summaries)
- List top 5 related active signals with IDs

**Scan for prior deliberations:**
- `ls .planning/deliberations/*.md` (exclude philosophy/ subdirectory)
- Check if any existing deliberation covers overlapping territory

**Scan for relevant philosophy:**
- Read `.planning/deliberations/philosophy/INDEX.md` if it exists
- List 2-3 most relevant philosophical principles for the topic

Present findings:

```
## Related Context

### Active Signals ({N} related)
{Table: ID | Severity | Summary}

### Prior Deliberations
{List: filename | status | relevance}

### Philosophical Principles
{List: cite key | principle | relevance}
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
- Signal collection reveals recurring patterns with no existing response
- User conversation surfaces a design question
- Phase verification finds gaps that need design thinking before gap closure
- Reflection produces lessons that suggest architectural changes

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
