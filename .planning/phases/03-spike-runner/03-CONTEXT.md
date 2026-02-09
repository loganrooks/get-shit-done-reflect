# Phase 3: Spike Runner - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

---

## Phase Boundary

**What this phase delivers:** A structured experimentation workflow that translates design uncertainty into empirically-grounded decisions through testable hypotheses, controlled experiments, and documented findings.

**Core principle:** Spikes produce FINDINGS, not DECISIONS. Existing GSD layers (CONTEXT.md for user decisions, RESEARCH.md for technical recommendations) make decisions based on spike findings.

**What this phase does NOT deliver:**
- Knowledge Base persistence (Phase 1 schema exists, surfacing is Phase 5)
- Signal integration (Phase 2)
- Cross-project spike querying (Phase 5)

---

## The Open Questions Flow

### Overview

Uncertainties flow through existing artifacts, get verified by research, and trigger spikes only for genuine gaps.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPEN QUESTIONS LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────────────┘

MARK (during Q&A or discuss-phase)
       │
       │  User or system identifies uncertainty:
       │  "I'm not sure if X is feasible"
       │  "Should we use A or B approach?"
       │
       ▼
┌──────────────────────────────────────┐
│ PROJECT.md or CONTEXT.md             │
│                                      │
│ ## Open Questions                    │
│ | Question | Why It Matters | Status │
│ | X feasible? | Core feature | Pending │
└──────────────────────────────────────┘
       │
       ▼
VERIFY (during research)
       │
       │  Researcher reads Open Questions
       │  Attempts to resolve through normal research
       │  Reports outcome in RESEARCH.md
       │
       ▼
┌──────────────────────────────────────┐
│ RESEARCH.md                          │
│                                      │
│ ## Open Questions                    │
│                                      │
│ ### Resolved                         │
│ - X feasible: Yes, standard approach │
│                                      │
│ ### Genuine Gaps                     │
│ | Question | Criticality | Rec |     │
│ | A or B? | Critical | Spike |       │
└──────────────────────────────────────┘
       │
       ▼
DECIDE (after research)
       │
       │  Orchestrator checks: Genuine gaps exist?
       │  Apply sensitivity filter
       │  Apply autonomy mode
       │
       ▼
┌──────────────────────────────────────┐
│ Spike Decision Matrix                │
│                                      │
│ sensitivity × autonomy → action      │
│                                      │
│ YOLO + aggressive: Auto-spike all    │
│ YOLO + conservative: Auto-spike crit │
│ Interactive + any: Ask user          │
└──────────────────────────────────────┘
       │
       ▼
SPIKE (if approved)
       │
       │  Design → Build → Run → Document
       │
       ▼
┌──────────────────────────────────────┐
│ .planning/spikes/001-slug/           │
│ └── DECISION.md                      │
│                                      │
│ Orchestrator updates RESEARCH.md:    │
│ ### Resolved by Spike                │
│ - A or B: Use B (spike finding)      │
└──────────────────────────────────────┘
       │
       ▼
PLAN (planner reads updated RESEARCH.md)
```

### Sources of Open Questions

| Source | Artifact | Who Identifies |
|--------|----------|----------------|
| Project initialization Q&A | PROJECT.md ## Open Questions | User + Claude |
| Phase discussion | CONTEXT.md ## Open Questions | User + Claude |
| Research discovery | RESEARCH.md ## Open Questions | Researcher agent |

All sources converge at RESEARCH.md, which reports the status of each question.

### Open Question Schema

```markdown
## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| [Clear question] | [Impact if wrong] | Critical/Medium/Low | Pending |
```

**Criticality assessment:**
- **Critical:** Blocks architecture decisions, affects multiple phases, no reasonable default
- **Medium:** Affects implementation approach, has reasonable default but suboptimal
- **Low:** Isolated to one task, easy to change later, clear default exists

---

## Spike Workflow

### Spike Types

| Type | When to Use | Success Criteria |
|------|-------------|------------------|
| **Binary** | Yes/no feasibility questions | Clear threshold defined upfront |
| **Comparative** | Choose between known options | Metrics to compare, winner criteria |
| **Exploratory** | Understand a space | Learning goals, can refine during |
| **Open Inquiry** | Questions that don't fit above | Flexible, Claude's discretion on structure |

One spike = one question. Comparative questions (A vs B vs C) are one spike with multiple experiments, not multiple spikes.

### Spike Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SPIKE WORKFLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. DESIGN (cognitive)
   │
   │  Input: Open Question from RESEARCH.md
   │  Process: Define hypothesis, success criteria, experiment plan
   │  Output: DESIGN.md
   │  Mode: Hybrid — agent drafts, user confirms (interactive) or auto-approve (YOLO)
   │
   ▼
2. BUILD (implementation)
   │
   │  Input: DESIGN.md experiment plan
   │  Process: Implement experiment scaffolding, test harness, variations
   │  Output: Working experiment code
   │  Mode: Agent-driven (gsd-spike-runner)
   │
   ▼
3. RUN (execution)
   │
   │  Input: Built experiments
   │  Process: Execute experiments, gather data, measure against criteria
   │  Output: FINDINGS.md (optional, for complex spikes)
   │  Mode: Agent-driven (gsd-spike-runner)
   │
   ▼
4. DOCUMENT (synthesis)
   │
   │  Input: Experiment results
   │  Process: Analyze findings, form conclusion, document decision
   │  Output: DECISION.md
   │  Mode: Agent-driven (gsd-spike-runner)
```

### Iteration / Narrowing

- Maximum 2 rounds per spike (prevents rabbit holes)
- After Round 1, if inconclusive:
  - Agent proposes narrowed hypothesis
  - User confirms (interactive) or auto-proceeds (YOLO)
- If still inconclusive after Round 2:
  - Document honestly: "No clear winner"
  - Proceed with default/simplest approach
  - Still valuable — learned there's no empirical differentiator

---

## Spike Artifacts

### Directory Structure

```
.planning/spikes/
├── 001-ocr-library-handwritten/
│   ├── DESIGN.md
│   ├── FINDINGS.md    (optional, for complex spikes)
│   └── DECISION.md
├── 002-realtime-processing-mobile/
│   ├── DESIGN.md
│   └── DECISION.md
└── ...
```

**Naming convention:** `{3-digit-index}-{slug-from-question}`
- Index: Sequential, provides uniqueness and chronological ordering
- Slug: Auto-generated from Open Question text, user can adjust in interactive mode

### DESIGN.md Schema

```markdown
# Spike: {Name}

**Created:** {date}
**Status:** {designing | building | running | complete | inconclusive}
**Originating phase:** {phase number, or "project-level"}
**Depends on:** {spike IDs, or "none"}

## Question

{The Open Question being investigated}

## Type

{Binary | Comparative | Exploratory | Open Inquiry}

## Hypothesis

{What we think might be true / what we're testing}

## Success Criteria

{How we'll know if we have an answer}

- [ ] Criterion 1: {measurable}
- [ ] Criterion 2: {measurable}

## Experiment Plan

### Experiment 1: {name}
- **What:** {what we'll build/test}
- **Measures:** {what we'll measure}
- **Expected outcome:** {hypothesis for this experiment}

### Experiment 2: {name}
...

## Scope Boundaries

**In scope:**
- {what we'll investigate}

**Out of scope:**
- {what we explicitly won't investigate}

## Time Estimate

{Rough estimate — not enforced, for user awareness}
```

### DECISION.md Schema

```markdown
# Spike Decision: {Name}

**Completed:** {date}
**Question:** {The Open Question}
**Answer:** {One-line decision}

## Summary

{2-3 paragraph executive summary}

## Findings

### Experiment 1: {name}

**Result:** {what happened}
**Data:**
{measurements, observations}

### Experiment 2: {name}
...

## Analysis

{How findings inform the decision}

| Option | Pros | Cons | Spike Evidence |
|--------|------|------|----------------|
| A | ... | ... | {data from experiments} |
| B | ... | ... | {data from experiments} |

## Decision

**Chosen approach:** {the decision}

**Rationale:** {why, based on evidence}

**Confidence:** {HIGH | MEDIUM | LOW}

## Implications

{What this means for downstream work}

- {Implication 1}
- {Implication 2}

## Metadata

**Spike duration:** {actual time}
**Iterations:** {1 or 2}
**Originating phase:** {phase}
**Related requirements:** {REQ-IDs if applicable}
```

---

## Configuration

### New Config Settings

```json
{
  "mode": "yolo | interactive",
  "depth": "quick | standard | comprehensive",
  "spike_sensitivity": "conservative | balanced | aggressive",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

### Spike Sensitivity

| Setting | What Gets Spiked | Use Case |
|---------|------------------|----------|
| **Conservative** | Only Critical gaps | Ship fast, spike only blockers |
| **Balanced** | Critical + Medium gaps | Default, reasonable coverage |
| **Aggressive** | Any genuine gap | Thorough validation, frontier work |

**Derivation option:** Could derive from `depth` instead of separate setting:
- quick → conservative
- standard → balanced
- comprehensive → aggressive

### Spike Decision Matrix

| Sensitivity | Autonomy | Behavior |
|-------------|----------|----------|
| Conservative | YOLO | Auto-spike Critical only |
| Conservative | Interactive | Ask only for Critical |
| Balanced | YOLO | Auto-spike Critical + Medium |
| Balanced | Interactive | Ask for Critical + Medium |
| Aggressive | YOLO | Auto-spike all genuine gaps |
| Aggressive | Interactive | Ask for all genuine gaps |

---

## Integration Points

### Project Initialization (new-project.md)

```
Q&A with User
     │
     ▼
PROJECT.md (with ## Open Questions)    ◄── TEMPLATE UPDATE
     │
     ▼
Research (4 parallel agents)
     │
     │  Researchers read PROJECT.md
     │  Attempt to resolve Open Questions
     │
     ▼
SUMMARY.md (with Open Question status)
     │
     ▼
┌─────────────────────────────────┐
│ SPIKE DECISION POINT            │    ◄── NEW STEP (additive)
│                                 │
│ IF genuine gaps:                │
│   Apply sensitivity + autonomy  │
│   Run spikes if approved        │
│   Update with resolutions       │
└─────────────────────────────────┘
     │
     ▼
Requirements Definition
     │
     ▼
Roadmap Creation
```

### Phase Planning (plan-phase.md)

```
plan-phase starts
     │
     ▼
CONTEXT.md (with ## Open Questions)    ◄── TEMPLATE UPDATE (if discuss-phase ran)
     │
     ▼
Research runs
     │
     │  Researcher reads CONTEXT.md (if exists)
     │  Attempts to resolve Open Questions
     │  Discovers additional Open Questions
     │
     ▼
RESEARCH.md (with ## Open Questions section)
     │
     ▼
┌─────────────────────────────────┐
│ SPIKE DECISION POINT            │    ◄── NEW STEP (additive)
│                                 │
│ IF genuine gaps:                │
│   Apply sensitivity + autonomy  │
│   Run spikes if approved        │
│   Update RESEARCH.md with       │
│   resolutions                   │
└─────────────────────────────────┘
     │
     ▼
Planner runs (reads updated RESEARCH.md)
     │
     ▼
PLAN.md
```

### Without discuss-phase

Plan-phase can run directly without discuss-phase:
- No CONTEXT.md exists
- Researcher discovers Open Questions during research (not pre-marked)
- Same spike decision point after research
- Flow converges at RESEARCH.md

---

## Artifact Integration

### How Spike Results Reach the Planner

1. **Spike completes** → produces `.planning/spikes/{id}/DECISION.md`

2. **Orchestrator updates RESEARCH.md:**
```markdown
## Open Questions

### Resolved by Spike

1. **{Question}**
   - Decision: {one-line answer}
   - Evidence: {brief summary}
   - Full analysis: .planning/spikes/{id}/DECISION.md
   - Confidence: HIGH (empirical)

### Genuine Gaps (Not Spiked)

{Questions user chose not to spike — proceeding with assumptions}

### Still Open

{Questions that couldn't be resolved — flagged for attention}
```

3. **Planner reads RESEARCH.md** — sees resolved questions, treats spike resolutions as locked decisions (same weight as CONTEXT.md user decisions)

### Planner Instruction Addition

```markdown
## Inputs

### RESEARCH.md

**Spike Resolutions:** If RESEARCH.md contains "Resolved by Spike" entries,
treat these as locked decisions (same as CONTEXT.md user decisions).
Spikes produced empirical evidence — don't second-guess them.
```

### Plan-Checker Addition

```markdown
## Verification Dimensions

### Spike Decision Compliance

If spike decisions exist for this phase:
- [ ] Plan uses approaches chosen by spikes
- [ ] No contradiction with empirical conclusions
- [ ] Spike decisions referenced where relevant

Flag: "Plan uses Library A, but spike finding chose Library B"
```

---

## Agents

### New Agents

| Agent | Role | Spawned By |
|-------|------|------------|
| **gsd-spike-runner** | Executes Build → Run → Document phases | plan-phase.md orchestrator, new-project.md orchestrator, /gsd:spike command |

**Note:** Spike design is handled by the orchestrator interactively (or auto-approved in YOLO mode), not a separate agent. This matches the discuss-phase pattern.

### gsd-spike-runner Responsibilities

- Read DESIGN.md for experiment plan
- Build experiment scaffolding (using executor patterns: atomic commits, checkpoints)
- Run experiments, gather data
- Analyze results against success criteria
- Produce DECISION.md
- Handle iteration if Round 1 inconclusive (max 2 rounds)
- Return structured result to orchestrator

### Executor Pattern Reuse

gsd-spike-runner borrows patterns from gsd-executor:
- Atomic commits per significant step
- Checkpoint on deviation (experiment doesn't work as planned)
- State persistence (can resume if interrupted)

But NOT the full executor machinery (waves, plan dependencies, etc.) — spikes are focused single tasks.

---

## New Command

### /gsd:spike

**Purpose:** Standalone spike invocation (escape hatch when user recognizes uncertainty outside normal flow)

**Usage:**
```
/gsd:spike "Which OCR library performs best on handwritten text?"
/gsd:spike                    # Interactive: asks for question
/gsd:spike --phase 3          # Links spike to specific phase
```

**Flow:**
1. Create spike directory with next index
2. Interactive design (or auto-design in YOLO mode)
3. User confirms DESIGN.md
4. Spawn gsd-spike-runner
5. On completion, report findings
6. If phase context exists, offer to update RESEARCH.md

**Note:** Most spikes will be triggered through the normal flow (research identifies gap → orchestrator offers spike). /gsd:spike is for manual invocation when user knows they need a spike.

---

## Fork Maintenance

### Files to Modify (Additive Changes)

| File | Change | Nature | Conflict Risk |
|------|--------|--------|---------------|
| **new-project.md** | Add spike decision step after research | New step between existing steps | Low |
| **plan-phase.md** | Add spike decision step after research | New step between existing steps | Low |
| **plan-phase.md** | Add RESEARCH.md update after spike | New step | Low |
| **gsd-planner.md** | Add spike resolution instruction | New paragraph in Inputs section | Low |
| **gsd-plan-checker.md** | Add spike compliance dimension | New verification dimension | Low |
| **gsd-phase-researcher.md** | Read CONTEXT.md Open Questions | New input instruction | Low |
| **gsd-project-researcher.md** | Read PROJECT.md Open Questions | New input instruction | Low |

### Templates to Update

| Template | Change |
|----------|--------|
| **project.md** | Add ## Open Questions section |
| **context.md** | Add ## Open Questions section |
| **research.md** (phase) | Add Open Questions subsections (Resolved, Resolved by Spike, Genuine Gaps, Still Open) |
| **research-project/SUMMARY.md** | Add Open Questions status section |

### New Files (No Conflict)

| File | Purpose |
|------|---------|
| `/gsd:spike` command | Standalone spike invocation |
| `gsd-spike-runner.md` agent | Execute spike Build → Run → Document |
| `spike-design.md` template | DESIGN.md schema |
| `spike-decision.md` template | DECISION.md schema |

### Merge Strategy

All upstream modifications are **additive**:
- New steps inserted between existing steps
- New sections added to existing documents
- New verification dimensions added to existing checklists

Git handles additive changes well. Typical conflict: "Both added content at line X" — resolution is to keep both.

**Estimated maintenance:** ~1-2 merge conflicts/month, 5-10 minutes each.

---

## Spike Dependencies

Spikes can depend on other spikes:

```markdown
# In DESIGN.md

**Depends on:** 001-framework-choice

{This spike can't be designed until we know which framework from spike 001}
```

**Orchestrator behavior:**
- If dependencies exist, run dependent spikes first
- Sequential execution for dependent spikes
- Independent spikes could run in parallel (future optimization)

**Guidance:** If dependency chains are complex, it's probably one bigger spike with multiple experiments, not multiple dependent spikes.

---

## Edge Cases

### Spike Produces Inconclusive Result

**Scenario:** All approaches performed similarly, or couldn't get reliable data.

**Handling:**
- Document honestly in DECISION.md
- Decision becomes: "No clear empirical winner — proceeding with {default/simplest} based on {other factors: simplicity, familiarity, community support}"
- Still valuable: We learned there's no empirical differentiator
- RESEARCH.md updated: "Resolved by Spike (inconclusive — using default)"

### User Declines All Spikes

**Scenario:** Interactive mode, user says "no" to all suggested spikes.

**Handling:**
- Document in RESEARCH.md: "Genuine Gaps (Not Spiked) — proceeding with assumptions"
- Planner sees these as unresolved questions
- User accepted the risk of proceeding without empirical data

### Multiple Gaps, Some Critical

**Scenario:** Research finds 3 gaps: 1 Critical, 2 Medium.

**Handling (by sensitivity):**
- Conservative: Only offer/auto-spike the Critical one
- Balanced: Offer/auto-spike Critical + Medium
- Aggressive: Offer/auto-spike all

User can always decline in interactive mode.

### Spike Reveals Larger Problem

**Scenario:** During spike, discover the whole approach is flawed.

**Handling:**
- Spike runner hits checkpoint (deviation from plan)
- Reports finding to orchestrator
- In interactive mode: Present to user, may need to revisit phase scope
- In YOLO mode: Document finding, flag for attention, continue with best available approach

---

## Implementation Decisions

### Confirmed Decisions

| Decision | Rationale |
|----------|-----------|
| Spikes produce findings, not decisions | Existing layers (CONTEXT.md, RESEARCH.md) make decisions |
| One spike = one question | Comparative questions are one spike with multiple experiments |
| Hybrid design (agent drafts, user confirms) | Balances efficiency with user control |
| Orchestrator updates RESEARCH.md | Keeps agents focused, integration logic in one place |
| Max 2 iteration rounds | Prevents rabbit holes while allowing refinement |
| Indexed + slug naming | Uniqueness + readability + chronological ordering |
| Sensitivity separate from autonomy | Orthogonal concerns, more control |
| All spikes at project level | Simpler structure, metadata links to phase |

### Claude's Discretion

| Area | Guidance |
|------|----------|
| Spike internal structure for Open Inquiry type | Flexible based on question nature |
| Experiment design depth | Scale to question complexity |
| When to create FINDINGS.md | Only for complex spikes with lots of data |
| Artifact retention after completion | Keep all by default, user can clean up |
| Iteration narrowing approach | Agent proposes based on Round 1 learnings |

---

## Success Criteria for Phase 3

1. [ ] /gsd:spike command works standalone
2. [ ] Spike decision point integrated into plan-phase
3. [ ] Spike decision point integrated into new-project
4. [ ] gsd-spike-runner agent executes Build → Run → Document
5. [ ] DESIGN.md and DECISION.md schemas implemented
6. [ ] Open Questions flow works end-to-end (mark → verify → spike → resolve)
7. [ ] RESEARCH.md updates correctly with spike resolutions
8. [ ] Planner treats spike resolutions as locked decisions
9. [ ] Plan-checker verifies spike decision compliance
10. [ ] Sensitivity and autonomy settings control spike behavior
11. [ ] Iteration/narrowing works for inconclusive Round 1
12. [ ] Spike dependencies respected (sequential execution)
13. [ ] All upstream modifications are additive (easy merge)

---

## Deferred to Future Phases

| Item | Phase | Rationale |
|------|-------|-----------|
| KB persistence of DECISION.md | Phase 5 | Schema exists, surfacing is later |
| Cross-project spike querying | Phase 5 | Part of Knowledge Surfacing |
| "Don't re-spike" based on KB | Phase 5 | Requires KB query infrastructure |
| Parallel spike execution | Future | Optimize later if needed |
| Spike analytics/patterns | Phase 4 | Part of Reflection Engine |

---

*Phase: 03-spike-runner*
*Context gathered: 2026-02-04*
