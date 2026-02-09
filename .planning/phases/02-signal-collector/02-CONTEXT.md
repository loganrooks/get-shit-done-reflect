# Phase 2: Signal Collector - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Automatic detection and persistence of workflow deviations, struggles, and config mismatches during execution, plus a manual `/gsd:signal` command for user-initiated observations. Signals are stored as structured files in the Phase 1 knowledge base. Pattern analysis and lesson extraction belong to Phase 4 (Reflection Engine).

</domain>

<decisions>
## Implementation Decisions

### Detection triggers
- Capture **problems + surprises** — failures, retries, workarounds, AND unexpected additions/changes, but not minor implementation details that went fine
- **All retries are signals** — even successful retries indicate something unexpected and are worth persisting
- Debugging struggles defined as: multiple failed attempts (3+), disproportionately long tasks, AND workaround solutions (not clean fixes)
- Incomplete execution is a signal **only when the reason indicates a problem** (error, blocker, plan issue) — not when user simply paused
- **Positive deviations (happy accidents) are captured** — deviations where the outcome was better than planned are signals too
- **Verification gaps are detection sources** — compare VERIFICATION.md caveats/partial passes against success criteria
- Signals scoped at **both plan-level and phase-level** — each signal records the specific plan AND the phase, queryable at either level

### Fork maintenance constraint
- **Strict additive-only** — user does not maintain upstream repo, so no upstream file edits; wrapper pattern required for all signal collection integration
- All signal collector functionality lives in new files only

### Signal content & shape
- **Polarity field required** — signals marked as positive/negative/neutral to distinguish happy accidents from problems
- Context depth, actionability, audience, tagging, taxonomy, file naming, lifespan, and struggle detail level are all **Claude's discretion** — researcher and planner should investigate what works best with the Phase 1 KB structure

### Manual signal command (/gsd:signal)
- **Hybrid interaction** — accepts optional args (description, severity) but asks for anything missing; quick if you provide detail, guided if you don't
- **Git behavior follows GSD config** — respects `commit_planning_docs` setting from `.planning/config.json`
- Context extraction, review-before-save, usage scope, source tracking, manual+auto overlap handling, and severity flag design are **Claude's discretion**

### Duplicate collapsing
- Match criteria, collapse method, collapse timing, auto-escalation, count visibility, and cross-project dedup are all **Claude's discretion** — researcher should investigate what approach works best with the KB structure and signal volume expectations

### Severity assignment
- **Auto-assign + manual override** — detector assigns critical/notable/trace automatically; `/gsd:signal` allows user to set severity manually

### Config mismatch detection
- **Claude's discretion** on strictness — whether to flag all mismatches or only outcome-affecting ones

### Detection timing
- **Claude's discretion** — whether phase-end only or also mid-execution, based on what the wrapper pattern supports

### Default behavior (opt-in/opt-out)
- **Claude's discretion** — pick what fits the workflow design

</decisions>

<specifics>
## Specific Ideas

- User emphasized that the KB design should be treated as v1 — future phases should be open to restructuring storage/retrieval if signal volume or cross-project query patterns demand it
- Signal collection should capture data that feeds the self-improvement loop: "the system never makes the same mistake twice"
- Incomplete execution detection should understand intent — accidental stops are not signals, but errors and blockers are

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-signal-collector*
*Context gathered: 2026-02-02*
