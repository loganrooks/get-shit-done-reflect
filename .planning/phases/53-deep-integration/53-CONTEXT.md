# Phase 53: Deep Integration - Context

**Gathered:** 2026-03-28
**Status:** Ready for research

<domain>
## Phase Boundary

Weave every adopted feature into the fork's signal/automation/health/reflection pipeline so that feature activity generates epistemic value -- the system learns from what these features observe. Eight requirements (INT-01 through INT-08) scope this phase.

**What this phase delivers:**
- Context-monitor bridge file data replaces wave-count estimation in automation deferral (INT-01)
- Nyquist VALIDATION.md becomes an artifact sensor scan target, validation gaps produce KB signals (INT-02, INT-03)
- Discuss-phase surfaces relevant KB knowledge during codebase scouting (INT-04)
- Cleanup workflow is guarded against deleting fork-specific directories (INT-05)
- Adopted upstream workflows verified namespace-correct under gsdr: prefix (INT-06)
- Health probe for Nyquist validation pass rate (INT-07)
- FEATURE_CAPABILITY_MAP expanded to recognize newly adopted features (INT-08)

**What this phase does NOT deliver:**
- New feature adoption (that was Phase 52)
- CI/infrastructure changes (Phase 54)
- New capabilities beyond wiring adopted features into the existing pipeline

</domain>

<assumptions>
## Working Model & Assumptions

**A1: Bridge file reading is a targeted change to automation.cjs resolve-level.**
The current context-aware deferral (lines 64-70) accepts `options.contextPct` as a pre-computed number. Phase 53 replaces this with reading `/tmp/claude-ctx-{session_id}.json` written by the context-monitor hook. The bridge file contains `{ remaining_percentage, used_pct, timestamp }`. Research should verify: (a) how session ID reaches automation.cjs from the CLI, (b) whether the bridge file is stale-safe (the hook writes it on PostToolUse, but automation might run between tool calls), and (c) whether fallback to the existing `options.contextPct` path is needed when no bridge file exists.

**A2: Artifact sensor VALIDATION.md scanning is an additive detection rule.**
The artifact sensor already scans PLAN.md, SUMMARY.md, and VERIFICATION.md. Adding VALIDATION.md as a fourth scan target requires: a new glob in Step 1 (load artifacts), a new detection rule in Step 3 (e.g., SGNL-04: validation-coverage-gap), and signal output matching the existing JSON contract. Research should determine which VALIDATION.md fields map to which signal types and severities.

**A3: KB knowledge surfacing in discuss-phase is a new step between scouting and gray-area resolution.**
The discuss-phase workflow (1050 lines) has codebase scouting at lines 299-339. KB knowledge surfacing would be a sibling step that queries `.planning/knowledge/` for lessons, spikes, and signals tagged with phase-domain keywords. Research should investigate: index format for querying, how to match phase goals to signal tags, and how to present KB context without exceeding context limits.

**A4: Cleanup exclusion may already be safe by construction.**
The cleanup workflow (153 lines) ONLY moves `.planning/phases/{dir}` to `.planning/milestones/v{X.Y}-phases/`. It does not touch `.planning/knowledge/`, `.planning/deliberations/`, or `.planning/backlog/`. INT-05 may need only a defensive guard (explicit exclusion list or a test proving it's safe) rather than new behavior. Research should verify this by reading the full workflow and confirming no code path can delete those directories.

**A5: FEATURE_CAPABILITY_MAP expansion is additive and follows the existing 4-feature pattern.**
The current map has `signal_collection`, `reflection`, `health_check`, and `ci_status` with `hook_dependent_above` and `task_tool_dependent` properties. Newly adopted features that need level-based triggering include: context_monitor (hook-based), nyquist_validation (agent-based), kb_surfacing (workflow-based). Research should determine which features genuinely need map entries vs which are always-on or controlled by other mechanisms.

**A6: Health probe for validation-coverage follows the existing 3-probe pattern.**
Health probes return `{ probe_id, checks: [{id, description, status, detail, data}], dimension_contribution }`. A validation-coverage probe would scan `.planning/phases/` for VALIDATION.md files, compute coverage percentages from frontmatter (`compliance_pct`), and report PASS/WARNING against a configurable threshold. Research should verify the VALIDATION.md frontmatter structure and determine the right threshold.

</assumptions>

<decisions>
## Implementation Decisions

### Bridge file reading fallback
- If no bridge file exists (context-monitor not installed or not yet fired), automation.cjs must fall back gracefully to `options.contextPct` if provided, or skip deferral entirely.
- **Grounding:** The context-monitor hook fires on PostToolUse. If automation resolves before any tool call in a session, no bridge file will exist yet. The existing `options.contextPct` fallback ensures backward compatibility.

### Signal pipeline flow for VALIDATION.md
- VALIDATION.md findings flow through the established sensor → synthesizer → KB pipeline, not a separate path.
- **Grounding:** The single-writer principle (synthesizer owns KB writes) and the sensor contract (JSON with delimiters) are architectural invariants from Phase 34-35. Bypassing them would violate the signal lifecycle model.

### Cleanup exclusion approach
- Add an explicit `FORK_PROTECTED_DIRS` constant or list in the cleanup workflow rather than relying on implicit safety-by-construction.
- **Grounding:** Defense in depth. The cleanup workflow is safe today but could be extended upstream in ways that break the implicit safety. An explicit guard makes the protection visible and testable.

### Claude's Discretion
- Ordering of integration work across plans
- Whether validation-coverage probe threshold defaults to 80% or 90%
- How many KB lessons to surface in discuss-phase (top N by relevance)
- Whether to add a `context_monitor` feature entry to FEATURE_CAPABILITY_MAP or treat it as always-on infrastructure

</decisions>

<constraints>
## Derived Constraints

**DC-1: Bridge file contract is fixed by Phase 52.**
Location: `/tmp/claude-ctx-{session_id}.json`. Format: `{ remaining_percentage, used_pct, timestamp }`. Written by statusline on Notification event. Read by context-monitor on PostToolUse. Phase 53 reads the same bridge file — it does not create a new contract.

**DC-2: Artifact sensor output format is a fixed contract.**
Sensors return JSON wrapped in `## SENSOR OUTPUT` / `## END SENSOR OUTPUT` delimiters with structure `{ sensor, phase, signals: [{ summary, signal_type, severity, tags, evidence, confidence, context, runtime, model }] }`. New VALIDATION.md detection rules must produce signals in this exact format.

**DC-3: FEATURE_CAPABILITY_MAP structure is established.**
Each entry has `{ hook_dependent_above: number|null, task_tool_dependent: boolean }`. New entries must follow this shape. The `resolve-level` function uses `hook_dependent_above` to cap automation level on non-hook runtimes and `task_tool_dependent` to cap on runtimes without Task() support.

**DC-4: Health probe return shape is established.**
All probes return `{ probe_id, checks: [...], dimension_contribution: { type, signals: { critical, notable, minor } } }`. New probes must match this shape.

**DC-5: 405+ tests must continue passing.**
Phase 52 established 405 passing tests. Phase 53 adds new integration but must not break existing tests.

**DC-6: Discuss-phase's steering brief model is a fork divergence that must be preserved.**
Phase 52 adopted upstream's codebase scouting but the fork's CONTEXT.md sections (Working Model, Derived Constraints, Open Questions, Epistemic Guardrails) remain intact. KB surfacing must work ALONGSIDE the steering brief model, not replace it.

**DC-7: INT-06 namespace rewriting was verified in Phase 52.**
Phase 52 verification confirmed all 4 adopted workflows + 2 agents + discuss-phase + quick.md are namespace-rewritten correctly. All command stubs install to `.claude/commands/gsdr/`. All source files use `gsd-` prefix with installer rewriting to `gsdr-`. If INT-06 requires no additional work beyond Phase 52's verification, it can be satisfied by re-running the namespace scan (TST-01 pattern) as a Phase 53 verification step.

</constraints>

<questions>
## Open Questions

### Q1: How does session ID reach automation.cjs for bridge file lookup?
- **Type:** material
- **Why it matters:** INT-01 requires automation deferral to use bridge file data instead of wave-count estimation. The bridge file path includes `{session_id}`. The current automation CLI (`gsd-tools.cjs automation resolve-level`) passes `--context-pct N` but does not pass a session ID. The calling context (execute-phase workflow, collect-signals workflow) may or may not have access to the session ID.
- **Downstream decision affected:** Whether automation.cjs receives session ID via CLI flag, environment variable, or discovers it from the bridge file glob pattern (`/tmp/claude-ctx-*.json` with most-recent heuristic)
- **Reversibility:** Medium — the session ID passing mechanism becomes part of the CLI contract
- **What research should investigate:** How upstream's context-monitor gets session ID (likely from hook input JSON). Whether `CLAUDE_SESSION_ID` is an available env var at hook/CLI time. Whether a glob-for-most-recent approach is viable as a simpler alternative.

### Q2: Which VALIDATION.md fields should trigger artifact sensor signals?
- **Type:** formal
- **Why it matters:** INT-02 requires artifact sensor to scan VALIDATION.md. The Nyquist auditor produces structured output with `compliance_pct` frontmatter, per-task verification map (status: green/yellow/red), and manual-only section. Different fields could trigger different signal types at different severities.
- **Downstream decision affected:** Signal type names, severity classification, detection rule specifics
- **Reversibility:** High — detection rules can be tuned without changing the pipeline
- **What research should investigate:** The actual VALIDATION.md produced by real nyquist auditor runs. Which fields vary most across phases. What signal_type values would be most actionable for the reflection pipeline.

### Q3: What KB querying approach works within discuss-phase's context budget?
- **Type:** efficient
- **Why it matters:** INT-04 requires discuss-phase to surface relevant KB knowledge. The KB may contain dozens of signals, multiple lessons, and several spikes. Loading all of them would overwhelm context. The surfacing must be targeted.
- **Downstream decision affected:** Whether to use index-based keyword matching, tag filtering, or recency-based selection. How many lessons/signals to surface (3? 5? 10?).
- **Reversibility:** High — the surfacing depth can be adjusted without structural changes
- **What research should investigate:** KB index format and whether it supports keyword/tag queries. Average KB size per project. Whether existing KB helper functions (health-probe.cjs's `resolveKBDir`, `collectRegimeSignals`) can be reused in a workflow context (they're CJS, the workflow would use bash/grep).

### Q4: Is INT-06 already satisfied by Phase 52?
- **Type:** efficient
- **Why it matters:** Phase 52 adopted 4 workflows, 3 agents, discuss-phase, and quick.md — all with verified namespace rewriting. INT-06 says "Adopted upstream workflows namespace-rewritten (gsdr: prefix) by installer." If Phase 52 already fulfilled this, Phase 53 only needs to re-verify (not re-implement).
- **Downstream decision affected:** Whether Phase 53 needs a plan dedicated to INT-06 or just a verification checkpoint
- **Reversibility:** High — verification is cheap
- **What research should investigate:** Whether INT-06 was intentionally placed in Phase 53 for a reason beyond adoption (e.g., integration-level namespace verification that goes deeper than file-level checks).

### Q5: Which adopted features need FEATURE_CAPABILITY_MAP entries?
- **Type:** formal
- **Why it matters:** INT-08 requires resolve-level to recognize newly adopted features. Not all adopted features need map entries — some are always-on infrastructure (context-monitor hook), some are workflow-triggered (validate-phase), some are agent-based (nyquist-auditor).
- **Downstream decision affected:** How many new entries, what their capability requirements are (hooks? Task tool? neither?)
- **Reversibility:** High — map entries are additive, can be refined later
- **What research should investigate:** For each adopted feature: (1) is it triggered by automation level? (2) does it depend on hooks? (3) does it depend on Task() tool? Only features that answer "yes" to (1) need entries. Features that are always-on or manually invoked don't need automation-level gating.

</questions>

<guardrails>
## Epistemic Guardrails

**G1: Bridge file reading must degrade gracefully.**
If the bridge file doesn't exist, is stale (timestamp too old), or is malformed, automation deferral must not crash or produce worse behavior than the current `options.contextPct` path. The fallback chain should be: bridge file → contextPct option → no deferral.

**G2: New artifact sensor detection rules must not break existing signal flow.**
The artifact sensor's output format is consumed by the signal synthesizer. New detection rules for VALIDATION.md must produce valid signal candidates in the established schema. Test by running collect-signals on a phase with VALIDATION.md and verifying synthesizer acceptance.

**G3: KB surfacing in discuss-phase must not inflate context beyond usefulness.**
Surfacing too many KB items could push the discuss-phase workflow over its context budget, causing auto-compact or degraded output. Start conservative (3-5 items) and measure actual context impact.

**G4: The cleanup exclusion guard must be tested, not just assumed.**
Even if the cleanup workflow is currently safe by construction, INT-05's success criterion requires a guarantee. Add a test that runs the cleanup workflow (or its logic) and verifies `.planning/knowledge/`, `.planning/deliberations/`, and `.planning/backlog/` are untouched.

**G5: Do not expand FEATURE_CAPABILITY_MAP with entries that serve no practical purpose.**
Only add features that genuinely need automation-level gating. Adding entries for always-on features creates maintenance burden without value. Research should justify each proposed entry.

</guardrails>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches within the constraints above.

</specifics>

<deferred>
## Deferred Ideas

- **Per-agent model overrides integration with automation framework** (FUT-05) -- which agents get which models at which automation level. Beyond INT-08's scope.
- **Signal recurrence escalation across phases** -- if validation-coverage gaps recur in phase N+1, automatically escalate severity. Beyond INT-02/INT-03's detection scope.
- **KB surfacing in other workflows beyond discuss-phase** -- plan-phase, execute-phase could also benefit from KB awareness. Out of scope for INT-04.

</deferred>

---

*Phase: 53-deep-integration*
*Context gathered: 2026-03-28*
