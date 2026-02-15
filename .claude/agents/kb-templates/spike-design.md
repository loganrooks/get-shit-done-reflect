<!--
Spike Design Template

Notes:
- Include all fields for discoverability (Phase 1 decision: templates include all optional fields)
- Use pipe syntax for enum placeholders: {option1|option2}
- DESIGN.md lives in spike workspace (.planning/spikes/{index}-{slug}/), NOT in kb-templates
- This template is for reference; spike-runner and /gsd:spike use it to create DESIGN.md files
- Sections: Question, Type, Prerequisites/Feasibility, Hypothesis, Success Criteria, Experiment Plan, Scope Boundaries, Time Estimate, Iteration Log
-->
---
# Spike Design Template
# Location: .planning/spikes/{index}-{slug}/DESIGN.md

# Required frontmatter
created: {YYYY-MM-DDTHH:MM:SSZ}
status: {designing|building|running|complete|inconclusive}
originating_phase: {phase number|project-level}
depends_on: {spike IDs|none}
round: {1|2}

# Optional frontmatter
time_estimate: {rough estimate}
---

# Spike: {Name}

## Question

{The Open Question being investigated - copy from RESEARCH.md or user input}

## Type

{Binary|Comparative|Exploratory|Open Inquiry}

**Type guidance:**
- Binary: Yes/no feasibility questions with clear threshold
- Comparative: Choose between known options with defined metrics
- Exploratory: Understand a space, learning goals can refine
- Open Inquiry: Flexible structure at Claude's discretion

## Prerequisites / Feasibility

**Environment requirements:**
- {API keys, credentials, or accounts needed -- or "None"}
- {CLI tools or software to install -- or "None"}
- {Network access, service availability, hardware -- or "Standard dev environment"}

**Feasibility checklist:**
- [ ] All prerequisites available or obtainable within spike timeframe
- [ ] Experiments can run in spike workspace isolation (no main project modification)
- [ ] No production systems, data, or credentials at risk

**If prerequisites NOT met:**
{Action: defer spike until prerequisites available / adjust experiments to work within constraints / document blocker and checkpoint}

## Hypothesis

{What we think might be true / what we're testing}

## Success Criteria

{How we'll know if we have an answer - MUST be measurable}

- [ ] Criterion 1: {measurable condition}
- [ ] Criterion 2: {measurable condition}
- [ ] Criterion 3: {measurable condition if needed}

## Experiment Plan

### Experiment 1: {name}

- **What:** {what we'll build/test}
- **Measures:** {what we'll measure}
- **Expected outcome:** {hypothesis for this experiment}

### Experiment 2: {name}

- **What:** {what we'll build/test}
- **Measures:** {what we'll measure}
- **Expected outcome:** {hypothesis for this experiment}

{Add more experiments as needed - keep minimal, 2-3 experiments typical}

## Scope Boundaries

**In scope:**
- {what we'll investigate}
- {what we'll investigate}

**Out of scope:**
- {what we explicitly won't investigate}
- {what we explicitly won't investigate}

## Time Estimate

{Rough estimate - not enforced, for user awareness. Examples: "~1 hour", "~30 minutes", "~2 hours"}

---

## Iteration Log

{Updated by spike-runner agent if iteration occurs}

### Round 1

**Status:** {pending|complete|inconclusive}
**Summary:** {brief outcome}

### Round 2 (if needed)

**Narrowed hypothesis:** {refined question based on Round 1 learnings}
**Status:** {pending|complete|inconclusive}
**Summary:** {brief outcome}
