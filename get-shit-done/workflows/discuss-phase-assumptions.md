<purpose>
Codebase-first inference mode for discuss-phase. Generates phase context by analyzing existing code patterns, conventions, and prior decisions with minimal user interaction.

This workflow is invoked when `workflow.discuss_mode` is set to `assumptions` in `.planning/config.json`. It replaces the interactive gray-area discussion with automated codebase analysis, producing CONTEXT.md with inferred working assumptions.

**When to use:** Projects with established codebases where patterns are clear and the user trusts Claude to infer reasonable defaults. Best for phases that extend existing features rather than introducing novel capabilities.

**When NOT to use:** Greenfield phases, phases with significant UX decisions, or when the user wants to actively steer implementation direction. Use `exploratory` or `discuss` mode instead.
</purpose>

<process>

<step name="initialize" priority="first">
Phase number from argument (required).

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_context`, `has_plans`, `roadmap_exists`.

**If `phase_found` is false:**
```
Phase [X] not found in roadmap.

Use /gsd:progress to see available phases.
```
Exit workflow.

**If `has_context` is true:**
```
Phase [X] already has context (CONTEXT.md exists).
Assumptions mode generates fresh context — existing context would be overwritten.
```

Use AskUserQuestion:
- header: "Context exists"
- question: "Overwrite existing context with codebase-inferred assumptions?"
- options: "Overwrite" / "Cancel"

If "Cancel": Exit workflow.

**If `has_context` is false:** Continue.
</step>

<step name="scan_codebase">
Deep scan of existing codebase to build inference foundation.

**Step 1: Read project-level files**
```bash
cat .planning/PROJECT.md 2>/dev/null || true
cat .planning/REQUIREMENTS.md 2>/dev/null || true
cat .planning/ROADMAP.md 2>/dev/null || true
```

**Step 2: Read all prior CONTEXT.md files**
```bash
(find .planning/phases -name "*-CONTEXT.md" 2>/dev/null || true) | sort
```

For each CONTEXT.md where phase number < current phase, extract locked decisions and patterns.

**Step 3: Targeted codebase scan**

Extract key terms from the phase goal and scan for existing patterns:
```bash
# Find files related to phase goal terms
grep -rl "{term1}\|{term2}" src/ app/ lib/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" 2>/dev/null | head -20 || true

# Check for existing patterns
ls src/components/ src/hooks/ src/lib/ src/utils/ 2>/dev/null || true
```

Read the 5-10 most relevant files to understand existing patterns deeply.

**Step 4: Check for codebase maps**
```bash
ls .planning/codebase/*.md 2>/dev/null || true
```

If available, read CONVENTIONS.md, STRUCTURE.md, STACK.md for established patterns.
</step>

<step name="infer_assumptions">
Based on codebase scan, generate assumptions across the phase's gray areas.

For each potential gray area the phase introduces:

1. **Check codebase precedent:** Is there an existing pattern that clearly applies?
   - If yes → mark as `[grounded]` with file path evidence
   - If no → mark as `[inferred]` with reasoning

2. **Check prior decisions:** Was this decided in an earlier phase?
   - If yes → carry forward with citation
   - If no → generate best-fit assumption from codebase conventions

3. **Confidence assessment:** Rate each assumption:
   - **Strong** — Direct codebase precedent exists (same pattern used elsewhere)
   - **Moderate** — Convention is clear but this is a new application of it
   - **Weak** — No direct precedent; assumption based on general best practices

Aim for 4-8 assumptions covering the phase's key implementation questions.
</step>

<step name="present_assumptions">
Present the inferred assumptions to the user for review.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ASSUMPTIONS MODE — Phase ${PHASE}: ${PHASE_NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on codebase analysis, here are my working assumptions:

[For each assumption:]
{N}. **{Area}:** {Assumption statement}
   Confidence: {Strong/Moderate/Weak}
   Evidence: {file path or reasoning}

---

Review these assumptions. You can:
1. Accept all — generate context and proceed
2. Correct specific items — tell me which numbers to change
3. Switch to interactive — run /gsd:discuss-phase with exploratory mode instead
```

Use AskUserQuestion:
- header: "Assumptions"
- question: "How do these assumptions look?"
- options: "Accept all" / "Correct specific items" / "Switch to interactive"

If "Accept all": Continue to write_context.
If "Correct specific items": Prompt for corrections, update assumptions, re-present.
If "Switch to interactive": Exit and suggest `/gsd:discuss-phase ${PHASE}` with exploratory mode.
</step>

<step name="write_context">
Generate CONTEXT.md from accepted assumptions.

**File location:** `${phase_dir}/${padded_phase}-CONTEXT.md`

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning
**Mode:** Assumptions (codebase-first inference)

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — from ROADMAP.md]

</domain>

<decisions>
## Working Assumptions

> These assumptions were inferred from codebase analysis with minimal user interaction.
> Downstream agents should treat these as starting points, not locked decisions.
> When implementation reveals a better approach, deviate and note the deviation.

### [Category 1]
- **A-01:** [Assumption] — Confidence: {Strong/Moderate/Weak}. Evidence: {source}
- **A-02:** [Assumption] — Confidence: {Strong/Moderate/Weak}. Evidence: {source}

### [Category 2]
- **A-03:** [Assumption] — Confidence: {Strong/Moderate/Weak}. Evidence: {source}

### Low-Confidence Areas
[Areas where no codebase precedent exists — flagged for researcher/planner attention]

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

[Accumulated refs from ROADMAP.md, REQUIREMENTS.md, and codebase scan]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [Component/hook/utility]: [How it applies to this phase]

### Established Patterns
- [Pattern]: [How it constrains/enables this phase]

### Integration Points
- [Where new code connects to existing system]

</code_context>

<specifics>
## Specific Ideas

No specific user requirements — assumptions derived from codebase analysis.

</specifics>

<deferred>
## Deferred Ideas

None — assumptions mode does not surface scope expansion.

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
*Mode: assumptions (codebase-first inference)*
```

Write file.
</step>

<step name="git_commit">
Commit the context file:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): capture phase context (assumptions mode)" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
```
</step>

<step name="update_state">
Update STATE.md:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Phase ${PHASE} context gathered (assumptions mode)" \
  --resume-file "${phase_dir}/${padded_phase}-CONTEXT.md"
```

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(state): record phase ${PHASE} context session" --files .planning/STATE.md
```
</step>

<step name="next_steps">
Present next steps:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CONTEXT CAPTURED (Assumptions Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created: ${phase_dir}/${padded_phase}-CONTEXT.md

Assumptions are working hypotheses — researcher and planner
will validate against the codebase during their analysis.

## Next Up

/gsd:plan-phase ${PHASE}

<sub>/clear first → fresh context window</sub>
```
</step>

</process>

<success_criteria>
- Phase validated against roadmap
- Codebase deeply scanned for patterns, conventions, and prior decisions
- 4-8 working assumptions generated with confidence levels and evidence
- Assumptions presented to user for review
- User accepted or corrected assumptions
- CONTEXT.md written with assumptions clearly marked as working hypotheses
- CONTEXT.md includes canonical_refs and code_context sections
- STATE.md updated
- User knows next steps
</success_criteria>
