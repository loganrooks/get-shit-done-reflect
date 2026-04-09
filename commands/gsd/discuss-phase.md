---
name: gsd:discuss-phase
description: Create phase steering context before planning. Use --auto for autonomous mode. Use --chain for interactive discuss followed by automatic plan+execute.
argument-hint: "<phase> [--auto] [--chain] [--batch] [--analyze] [--text]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**Three modes** (configured via `workflow.discuss_mode` in config):
- `exploratory` (default): Preserve uncertainty, bias toward open questions, mark options as [grounded] or [open]
- `discuss`: Standard steering brief — auto picks recommended defaults decisively
- `assumptions`: Codebase-first inference with minimal user interaction

**How it works:**
1. Resolve discuss mode from config (`workflow.discuss_mode`)
2. If `assumptions` mode → route to discuss-phase-assumptions.md workflow
3. Analyze the phase to identify gray areas (UI, UX, behavior, etc.)
4. Present gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied (mode affects --auto behavior)
6. Create CONTEXT.md with decisions (discuss) or working assumptions (exploratory)

**Output:** `{phase}-CONTEXT.md` — decisions/assumptions clear enough that downstream agents can act
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/discuss-phase.md
@~/.claude/get-shit-done/workflows/discuss-phase-assumptions.md
@~/.claude/get-shit-done/templates/context.md
</execution_context>

<context>
Phase number: $ARGUMENTS (required)

**Load project state:**
@.planning/STATE.md

**Load roadmap:**
@.planning/ROADMAP.md
</context>

<process>
1. Validate phase number (error if missing or not in roadmap)
2. **Resolve discuss mode** from `workflow.discuss_mode` config (default: `exploratory`)
3. If `assumptions` mode → route to discuss-phase-assumptions.md workflow, exit
4. Check if CONTEXT.md exists (offer update/view/skip if yes)
5. **Analyze phase** — Identify domain and generate phase-specific gray areas
6. **Present gray areas** — Multi-select: which to discuss? (NO skip option)
7. **Deep-dive each area** — 4 questions per area, then offer more/next
   - In exploratory mode: options marked [grounded] or [open]; --auto only selects grounded
   - In discuss mode: standard behavior, --auto picks recommended defaults
8. **Write CONTEXT.md** — Sections match areas discussed
9. Offer next steps (research or plan)

**CRITICAL: Scope guardrail**
- Phase boundary from ROADMAP.md is FIXED
- Discussion clarifies HOW to implement, not WHETHER to add more
- If user suggests new capabilities: "That's its own phase. I'll note it for later."
- Capture deferred ideas — don't lose them, don't act on them

**Domain-aware gray areas:**
Gray areas depend on what's being built. Analyze the phase goal:
- Something users SEE → layout, density, interactions, states
- Something users CALL → responses, errors, auth, versioning
- Something users RUN → output format, flags, modes, error handling
- Something users READ → structure, tone, depth, flow
- Something being ORGANIZED → criteria, grouping, naming, exceptions

Generate 3-4 **phase-specific** gray areas, not generic categories.

**Probing depth:**
- Ask 4 questions per area before checking
- "More questions about [area], or move to next?"
- If more → ask 4 more, check again
- After all areas → "Ready to create context?"

**Do NOT ask about (Claude handles these):**
- Technical implementation
- Architecture choices
- Performance concerns
- Scope expansion
</process>

<success_criteria>
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>
