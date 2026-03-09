# Deliberation: Health Check Maintainability & Extensibility

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation -> problematization -> hypothesis -> test -> warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open -> concluded -> adopted -> evaluated -> superseded
-->

**Date:** 2026-03-06
**Status:** Concluded
**Trigger:** Design question -- how to architect the health check system for maintainability and extensibility as GSD workflows grow in complexity. Phase 41 adds 11 requirements (HEALTH-01 through HEALTH-11) onto a monolithic base designed for simple workspace validation.
**Affects:** Phase 41 (Health Score & Automation), all future phases that add health checks
**Related:**
- sig-2026-03-06-health-check-monolithic-architecture (deliberation trigger)
- .planning/deliberations/philosophy/contradictions-in-v17-requirements.md (Contradiction #3: Health as Totalizing Concept)
- Phase 38 sensor auto-discovery pattern (analogous extensibility solution)
- `philosophy: contradictions/health-is-instrument`
- `philosophy: cybernetics/requisite-variety`
- `philosophy: contradictions/measure-with-humility`
- `philosophy: aristotle/phronesis`

## Situation

The health check system was designed in v1.12 Phase 06 as a simple workspace validator. It consists of three files:

1. **Command** (`commands/gsd/health-check.md`) -- 47 lines, entry point that delegates to workflow
2. **Workflow** (`get-shit-done/workflows/health-check.md`) -- 240 lines, hardcoded orchestration with category execution order, early termination rules, and repair logic
3. **Reference** (`get-shit-done/references/health-check.md`) -- 497 lines, all check definitions with inline shell patterns, severity levels, repair rules, and configuration

Adding a new check requires coordinated edits to both the workflow (execution order, early termination) and the reference (check definition, shell pattern, repair rule). Adding a new category requires edits to both plus the command's scope determination logic.

Phase 41 transforms health checks from a simple validator (6 categories, ~20 binary checks) into a multi-dimensional scoring and automation system:
- Two-dimensional health score (infrastructure + workflow) with weighted signal accumulation (HEALTH-01, HEALTH-02)
- Statusline traffic light display with standing epistemic caveat (HEALTH-03)
- Auto-triggering at session start and per-phase execution (HEALTH-04, HEALTH-05)
- Reactive threshold-based triggers (HEALTH-06)
- Automation system watchdog via timestamp checking (HEALTH-07)
- Signal-to-resolution ratio with regime-aware accumulation windows (HEALTH-08)
- Signal density trend within observation regimes (HEALTH-09)
- Rogue file detection with pattern registry and lifecycle awareness (HEALTH-10)
- Rogue file context extraction with agent-ignorance vs workflow-gap categorization (HEALTH-11)

The sensor architecture (Phase 38) solved an analogous extensibility problem: sensors went from hardcoded spawning to auto-discovered `gsd-*-sensor.md` files with a standard contract. Adding a new sensor is now a single-file operation.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| health-check.md workflow (240 lines) | Hardcoded category names, execution order, early termination rules | Yes (read the file) | sig-2026-03-06-health-check-monolithic-architecture |
| health-check.md reference (497 lines) | All 20+ checks defined inline with shell patterns | Yes (read the file) | sig-2026-03-06-health-check-monolithic-architecture |
| REQUIREMENTS.md HEALTH-01 through HEALTH-11 | 11 new requirements adding scoring, metrics, automation, rogue detection | Yes (grepped REQUIREMENTS.md) | informal |
| Phase 38 sensor auto-discovery | Extensible sensor architecture via file naming convention + contract | Yes (read collect-signals.md) | informal |
| Contradiction #3 analysis | Health as instrument, not totalizing claim -- warns against green = safe | Yes (read philosophy doc) | informal |

## Framing

**Core question:** How should the health check architecture be restructured so that adding new checks, check categories, and scoring dimensions is a single-file operation -- mirroring the sensor extensibility pattern -- while keeping the scoring model (HEALTH-01/02), auto-trigger wiring (HEALTH-04/05/06), and regime-aware metrics (HEALTH-08/09) composable rather than monolithic?

**Adjacent questions:**
- Should health check "probes" follow the same auto-discovery pattern as sensors?
- How do binary infrastructure checks and weighted signal metrics coexist in a unified scoring model?
- Where does rogue file detection (HEALTH-10/11) fit -- is it a health check probe or a separate sensor?

## Analysis

### Option A: Modular Probe Files (Data-Driven Discovery)

- **Claim:** Restructure checks as individual probe definition files in `references/health-probes/` that the workflow discovers and executes dynamically.
- **Grounds:** Sensor auto-discovery (Phase 38) proved file-based discovery works. Current maintenance burden is coordinated edits across workflow + reference.
- **Warrant:** If check definitions are self-contained files, the workflow becomes a generic executor that doesn't need to know about specific checks. Same principle that made sensors extensible.
- **Rebuttal:** Health checks are lightweight shell commands, not heavyweight agents. File parsing overhead may exceed maintenance savings. Inter-check dependencies (early termination) are hard to express in a flat data-driven model.
- **Qualifier:** Probably -- most natural pattern given sensor precedent, but mismatch in check complexity needs resolution.

### Option B: Layered Architecture (Checks / Scoring / Triggers)

- **Claim:** Separate the three orthogonal concerns -- check execution, score computation, and trigger wiring -- into distinct layers.
- **Grounds:** HEALTH-01 through HEALTH-11 decompose naturally into three layers: HEALTH-01/02/03 are scoring, HEALTH-04/05/06 are triggers, HEALTH-07/08/09 are metrics, HEALTH-10/11 are checks.
- **Warrant:** Separation of concerns reduces blast radius. Adding a check doesn't affect scoring. Changing scoring doesn't affect triggers.
- **Rebuttal:** Three documents that must be kept in sync is arguably worse than one monolith. Interfaces between layers become implicit.
- **Qualifier:** Presumably -- addresses concern tangling but doesn't fully solve check extensibility.

### Option C: Hybrid -- Probe Discovery + Scoring Layer (Selected)

- **Claim:** Combine probe-based auto-discovery for check extensibility with a separate scoring layer for concern separation, using graduated complexity for the probe execution model.
- **Grounds:** Probes handle the extensibility requirement (adding checks = adding files). The scoring layer handles the concern separation requirement (scoring logic isolated from check logic). Graduated execution (inline bash / gsd-tools.js subcommand / agent spec) handles the complexity spectrum from trivial binary checks to multi-step reasoning.
- **Warrant:** Each concern changes independently. Adding a check = one new probe file, zero workflow/scorer edits. Changing the scoring model = one file edit. Trigger wiring stays thin in existing workflows. The probe contract's `execution` field and `depends_on` declarations replace hardcoded early termination logic.
- **Rebuttal:** Most complex architecturally. Probe contract must handle huge complexity range. 9+ probe files may be harder to overview than one reference document (mitigated by health-scoring.md serving as the overview/registry).
- **Qualifier:** Probably -- most future-proof but requires most upfront design investment.

#### Probe Contract

Each probe file lives in `references/health-probes/` and contains:

```yaml
---
probe_id: kb-integrity
category: KB Integrity
tier: default              # default | full
dimension: infrastructure  # infrastructure | workflow
execution: inline          # inline | subcommand | agent
depends_on: []             # other probe IDs this needs to run after
---
```

**Execution types (graduated complexity):**
- `inline` -- Probe contains bash commands. Claude reads and runs them via Bash tool. For simple binary checks (file exists, JSON parses, count matches).
- `subcommand` -- Probe declares a `gsd-tools.js health-probe <name>` command. Logic lives in tested JavaScript. For complex computation (signal metrics, regime-aware ratios).
- `agent` -- Probe references an agent spec. Workflow spawns a subagent. For reasoning-heavy analysis (rogue file categorization as agent-ignorance vs workflow-gap).

**Inter-check dependencies:** The `depends_on` field replaces hardcoded early termination. If `signal-metrics` depends on `kb-integrity`, the workflow runs KB probes first and skips signal-metrics if KB is unhealthy. Individual checks within a probe use a `blocks` field (e.g., KB-01 failure blocks KB-02 through KB-06).

#### Scoring Model

**Two independent dimensions:**

1. **Infrastructure Health** (binary aggregate of `dimension: infrastructure` probes):
   - HEALTHY: zero FAILs
   - DEGRADED: WARNINGs but no FAILs
   - UNHEALTHY: any FAIL

2. **Workflow Health** (continuous metrics from `dimension: workflow` probes):
   - Weighted signal accumulation: critical=1.0, notable=0.3, minor=0.1 (HEALTH-02)
   - Pattern deduplication before weighting
   - Signal-to-resolution ratio with regime-aware windows (HEALTH-08)
   - Signal density trend within current regime (HEALTH-09)

**Composite mapping to traffic light:**

|              | Infra HEALTHY | Infra DEGRADED | Infra UNHEALTHY |
|--------------|--------------|----------------|-----------------|
| Workflow LOW | GREEN        | YELLOW         | RED             |
| Workflow MED | YELLOW       | YELLOW         | RED             |
| Workflow HIGH| YELLOW       | RED            | RED             |

**Standing caveat (always displayed per HEALTH-03):**
> Health checks measure known categories. Absence of findings does not mean absence of problems.

#### Design Principle: Scores as Attention Guides, Not Decision Gates

**Thresholds are advisory, not authoritative.** Per `philosophy: aristotle/phronesis`, practical judgment cannot be fully formalized into mechanical rules. Per `philosophy: contradictions/health-is-instrument`, health metrics are instruments for decision-making, not verdicts.

Concretely:
1. Thresholds are configurable defaults that start conservative -- the user adjusts based on experience
2. Health output always shows underlying data alongside the color, enabling contextual judgment
3. No automated action is triggered by the score alone -- even reactive triggers (HEALTH-06) only trigger more information gathering (a health check), never automated remediation
4. Thresholds should be expected to need adjustment within the first 2 phases of use (prediction P4)

#### Trigger Wiring

Trigger logic stays thin in existing workflows (not in the health check system itself):
- **`execute-phase.md`** -- health check step after phase completion (HEALTH-05)
- **Session-start hook** -- checks cached score timestamp, triggers if `on-resume` frequency (HEALTH-04)
- **Reactive trigger** -- session-start hook checks cached score, triggers full check if below threshold (HEALTH-06)

The health check workflow is trigger-agnostic -- runs the same whether invoked by user, execute-phase, or session-start hook.

## Tensions

1. **Probe Complexity Spectrum:** Probes range from trivial (file exists?) to complex (compute regime-aware signal density trends). The graduated execution model (`inline`/`subcommand`/`agent`) addresses this but adds architectural complexity.

2. **Overview vs Modularity:** 9+ probe files spread across a directory are harder to scan than one reference document. Mitigated by health-scoring.md serving as the registry/overview that lists all probes and their contributions.

3. **Formalized Metrics vs Practical Judgment:** Mechanical thresholds risk becoming false authorities. Mitigated by the "scores as attention guides" design principle, the standing epistemic caveat, and showing underlying data alongside the composite score. Per `contradictions/measure-with-humility`: all self-measurement is imperfect.

4. **Regime Awareness Complexity:** HEALTH-08 and HEALTH-09 require tracking regime boundaries (SIG-06) to avoid conflating detection improvement with resolution degradation. This adds state management complexity but is necessary for metric honesty after automation changes.

## Recommendation

**Recommendation:** Adopt the hybrid probe architecture (Option C) with advisory scoring.

**Rationale:** This approach:
- Makes check extensibility a single-file operation (matching sensor precedent)
- Separates check definitions, scoring logic, and trigger wiring as independent concerns
- Handles the complexity spectrum via graduated execution types
- Treats health scores as attention guides per philosophical foundations
- Embeds epistemic humility via standing caveat and underlying data display

## Predictions

<!--
Predictions make the deliberation falsifiable (Lakatos). If adopted, what should we
observe? If we don't observe it, the deliberation's reasoning was flawed.
Record predictions BEFORE implementation so they can't be retrofitted.
-->

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Adding a new check category requires creating one probe file and zero edits to the workflow or scoring reference | Next time a check category is added (Phase 42+ or future milestone) | The workflow or scoring reference must be edited to accommodate the new probe |
| P2 | The health check workflow file shrinks from 240 lines to <100 lines (becomes a generic probe executor) | After Phase 41 implementation | Workflow remains >150 lines with category-specific logic |
| P3 | The probe contract handles the full complexity spectrum (binary KB checks through multi-step signal metrics) without needing escape hatches or special cases in the workflow | Phase 41 implementation completes all 11 HEALTH requirements | Any probe requires workflow modifications to execute correctly |
| P4 | Threshold values will need adjustment within the first 2 phases after deployment -- initial defaults will be too sensitive or too insensitive | Phase 42-43 execution + user feedback | Defaults work perfectly with no adjustment needed (would suggest luck, not good design) |
| P5 | The advisory framing (scores as attention guides, not decision gates) prevents at least one instance where a mechanical threshold would have triggered an incorrect action | Observable during v1.17 execution when health scores are displayed | Every threshold trigger leads to a genuine issue (thresholds are perfectly calibrated -- unlikely per P4) |

## Decision Record

**Decision:** Adopt hybrid probe architecture with auto-discovered probe files, separated scoring layer, thin trigger wiring, graduated execution complexity (inline/subcommand/agent), and advisory scoring principle (thresholds as attention guides, not decision gates).
**Decided:** 2026-03-06
**Implemented via:** Phase 41 plans (41-01 through 41-04)
**Signals addressed:** sig-2026-03-06-health-check-monolithic-architecture

## Evaluation

<!--
Filled when status moves to `evaluated`.
Compare predictions against actual outcomes. Explain deviations.
-->

*To be filled after Phase 41 implementation.*
