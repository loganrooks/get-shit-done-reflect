---
doc_type: workflow_reference
schema_version: v1
applies_to: [discuss-phase, plan-phase, progress]
phase: 58-structural-enforcement-gates
plan: 11
gate: GATE-08c
last_updated: 2026-04-20
---

# Discuss Mode — Canonical Workflow Reference

This document is the canonical reference for the three discuss modes supported by
`/gsdr:discuss-phase` and the `text_mode` rendering option that crosscuts the discuss-phase,
plan-phase, and progress workflows.

GATE-08c enforcement artifact: Plan 17's verifier greps for this file's existence and for
the confidence-badge → typed-claim mapping table in §4.

---

## 1. Purpose

GSD Reflect's `/gsdr:discuss-phase` workflow has three modes that trade off user interaction
depth against automation depth. Selecting the right mode protects the CONTEXT.md quality
surface while respecting the user's available attention budget.

The three modes are:

1. **`exploratory`** (default) — standard interactive mode. The workflow surfaces gray
   areas (typed claims with `[open]` / `[assumed:*]` markers) and asks the user to steer each
   one before committing CONTEXT.md. Highest-fidelity output; highest interaction cost.
2. **`assumptions`** (richer-adoption / codebase-first) — routes to
   `discuss-phase-assumptions.md`, which dispatches `gsdr-assumptions-analyzer` to infer
   assumptions from the codebase directly. User reviews and corrects a small set of
   confident inferences rather than answering open questions.
3. **`--auto` exploratory** — same structure as `exploratory` but auto-selects recommended
   defaults at interaction points. Used inside `--chain` flows and headless sessions.

Mode selection happens in `discuss-phase.md:mode_routing` based on the `workflow.discuss_mode`
config key. Once the mode is resolved, one of the three execution paths above runs to
completion.

The `text_mode` option (see §3) is **orthogonal** to the mode selection — it changes how
interactive prompts render but does not change which workflow runs.

---

## 2. Mode Matrix

| Mode | When to use | What user sees | What agent does | Typical interactions |
|---|---|---|---|---|
| `exploratory` (default) | Novel phases, phases with significant UX decisions, early project phases, user wants to actively steer | Gray areas surfaced one-by-one, `AskUserQuestion` calls with `[open]` claim prompts | Lightweight codebase scout + prior-context load, then interactive steering | ~10-20 questions |
| `assumptions` | Established codebases with clear patterns, user trusts Claude to infer, extensions of existing features | Assumption list with Confidence badges (Confident/Likely/Unclear) + evidence citations; user confirms or corrects | Spawns `gsdr-assumptions-analyzer` (dedicated subagent) to read 5-15 source files, returns structured assumptions | ~2-4 corrections |
| `--auto` exploratory | `--chain` flows, headless execution, research-ready steering brief generation | Recommended defaults logged inline; no interactive prompts | Same as `exploratory` but biases toward open questions + working assumptions + guardrails rather than collapsing uncertainty | 0 (auto-select) |

**Mode resolution:** `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.discuss_mode`
(defaults to `exploratory` if unset).

**Mode routing site:** `get-shit-done/workflows/discuss-phase.md:mode_routing` step.

**Mode invocation:** `/gsdr:discuss-phase {N}` (reads config), or force mode via
`node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow.discuss_mode assumptions`.

---

## 3. `text_mode` Semantics

**Purpose:** Replace interactive `AskUserQuestion` rendering with plain-text numbered lists
when the invoking environment cannot or should not render interactive pickers.

**When it applies:**

- `workflow.text_mode: true` in `.planning/config.json` → applies project-wide
- `--text` flag passed on command invocation → applies to the single invocation
- Default: `workflow.text_mode: false` → interactive `AskUserQuestion` rendering

**Activation site (discuss-phase-assumptions):** `<answer_validation>` block near the top of
`get-shit-done/workflows/discuss-phase-assumptions.md`. When text_mode is active:

1. `AskUserQuestion` calls are replaced with plain-text numbered list presentations
2. Empty answers are retried once, then fall back to text-mode presentation
3. `readline`-style prompts (`read -p`) are used to capture user choice number

**Mode-aware presentation swap points** (per upstream parity):

| Workflow step | Interactive (default) | text_mode |
|---|---|---|
| `initialize` | `AskUserQuestion: "Overwrite existing context?"` | Numbered list + `read -p "Select (1-N): "` |
| `check_existing` | `AskUserQuestion: "What do you want to do?"` | Numbered list prompt |
| `present_assumptions` | `AskUserQuestion: "These all look right?"` | Numbered list prompt |
| `correct_assumptions` | `AskUserQuestion (multiSelect)` + per-correction `AskUserQuestion` | Numbered list + `read -p` for comma-separated selections |
| `auto_advance` | No user prompt (either triggers or doesn't) | No change — no prompt exists |

**Rendering shape (canonical form):**

```bash
if [ "${WORKFLOW_TEXT_MODE:-false}" = "true" ]; then
  # Plain-text numbered rendering
  echo "1) Option A"
  echo "2) Option B"
  echo ""
  read -p "Select (1-N): " choice
  # Map choice to option
else
  # Existing AskUserQuestion / interactive path
  ...
fi
```

**Detection:** At workflow entry, resolve `WORKFLOW_TEXT_MODE` via:

```bash
TEXT_MODE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.text_mode 2>/dev/null || echo "false")
```

Or from `$ARGUMENTS` if `--text` is present.

**Integration with plan-phase.md and progress.md:**

Both `plan-phase.md` and `progress.md` are primarily agent-driven (Task() dispatch flows) and
currently have no user-facing `AskUserQuestion` / `readline` interactive points. The
text_mode property applies to both files by way of documented future-edit contract (see
Comment-Note form in `plan-phase.md` and `progress.md` heads) — when interactive points are
added, they MUST honor the `WORKFLOW_TEXT_MODE` branch pattern above.

The GATE-08d verification (Plan 17) greps for `text_mode` in both workflow files; the
comment-note form satisfies the grep without introducing behaviorally-empty code branches.

---

## 4. Confidence Badge → Typed Claim Mapping

The `gsdr-assumptions-analyzer` agent returns assumptions tagged with upstream-compatible
confidence badges (`Confident` / `Likely` / `Unclear`). The fork's CONTEXT.md uses a richer
typed-claim vocabulary (per `get-shit-done/references/claim-types.md`, shipped Phase 57.2
DISC-01..10). This section defines the mapping.

**Authoritative mapping table:**

| Upstream Confidence Badge | Fork Typed Claim | CONTEXT.md Section | Rationale |
|---|---|---|---|
| **Confident** (clear from code / prior decision) | `[evidenced:cited]` — when citation anchor present and in-code; or `[decided:cited]` — when user has locked it as a decision | `<working_model>` or `<decisions>` (D-N under typed area) | Evidence-backed, citation-anchored. Highest strength. |
| **Confident** (clear from code but no external citation) | `[evidenced:reasoned]` | `<working_model>` | Evidenced-without-citation; stronger than assumed. |
| **Likely** (reasonable inference, 2+ alternatives) | `[assumed:reasoned]` — when alternatives are evaluated explicitly; or `[decided:reasoned]` — when user confirms choice among alternatives | `<working_model>` or `<decisions>` | Inferred but not evidence-locked; alternatives documented. |
| **Unclear** (could go multiple ways, needs user input) | `[open]` — tracked in `<questions>`; or `[assumed:reasoned]` with bare verification — if user accepts "Claude's discretion" | `<questions>` (open claim) or `<decisions>` (Claude's Discretion area) | Unresolved; either tracked for planner/researcher or explicitly deferred as Claude's call. |

**Mapping rules (from upstream delta §3(f)):**

1. **Preserve analyzer prompt verbatim.** The analyzer returns `Confident` / `Likely` /
   `Unclear` as per upstream's prompt. The mapping is a **post-processing translation**
   performed by the workflow in `write_context` — the agent does NOT know about fork typed
   claims.
2. **Default mappings** (when the workflow cannot differentiate):
   - Confident → `[evidenced:cited]` (when agent cited file paths) or `[decided:cited]`
     (when the assumption matches a prior locked decision)
   - Likely → `[assumed:reasoned]`
   - Unclear → `[open]`
3. **User corrections upgrade the claim type.** If the user confirms an assumption via
   `correct_assumptions`, promote the claim from `[assumed:reasoned]` to `[decided:reasoned]`
   or `[decided:cited]` depending on the presence of citation in the original assumption.

**Example transformations:**

- Analyzer returns `Assumption: "Use zustand for state management. Confidence: Confident.
  Why this way: src/store/*.ts uses zustand already."` →
  CONTEXT.md `<working_model>`: `[evidenced:cited] State management uses zustand, per
  src/store/*.ts established pattern.`
- Analyzer returns `Assumption: "Cache TTL of 60s. Confidence: Likely."` with no citation →
  CONTEXT.md `<working_model>`: `[assumed:reasoned] Cache TTL set to 60s based on typical
  API refresh cadence; reversible if profiling reveals a better value.`
- Analyzer returns `Assumption: "Error format choice: JSON:API vs Problem Details.
  Confidence: Unclear."` →
  CONTEXT.md `<questions>`: `[open] Error response format — JSON:API vs Problem Details.
  Needs planner decision based on client compatibility.`

---

## 5. Integration Points

**Workflows that invoke / delegate to `discuss-phase-assumptions`:**

- `get-shit-done/workflows/discuss-phase.md:mode_routing` — routes to
  `discuss-phase-assumptions.md` when `workflow.discuss_mode == "assumptions"`
- `/gsdr:discuss-phase {N}` command — entry point from user

**Workflows where `text_mode` applies / is documented:**

- `get-shit-done/workflows/discuss-phase-assumptions.md` (primary — `<answer_validation>` block)
- `get-shit-done/workflows/discuss-phase.md` (interactive exploratory — honors text_mode)
- `get-shit-done/workflows/plan-phase.md` (agent-driven — comment-note; future user-prompt
  points must honor `WORKFLOW_TEXT_MODE`)
- `get-shit-done/workflows/progress.md` (agent-driven — comment-note; same contract)

**Agents invoked by these workflows:**

- `agents/gsdr-assumptions-analyzer.md` — dispatched from
  `discuss-phase-assumptions.md:deep_codebase_analysis` (and on re-analysis from
  `present_assumptions`)
- `agents/gsdr-phase-researcher.md` — dispatched from `plan-phase.md` for research step
- `agents/gsdr-planner.md` — dispatched from `plan-phase.md` for planning step

**Config keys (`.planning/config.json`):**

- `workflow.discuss_mode`: `exploratory` | `discuss` | `assumptions` (default: `exploratory`)
- `workflow.text_mode`: boolean (default: `false`)
- `workflow.auto_advance`: boolean (default: `false`)
- `workflow._auto_chain_active`: internal chain-state flag used by `--auto` handshake
- `model_profile`: `quality` | `balanced` | `budget` | `adaptive` — governs the calibration
  tier for `gsdr-assumptions-analyzer` output shape per Plan 03 delta §3(d) narrowing

---

## 6. Cross-References

**Authoritative adoption history:**

- `.planning/phases/58-structural-enforcement-gates/58-03-upstream-delta.md` §3 — the 6
  categories (methodology loading, analyzer agent, text_mode, calibration tier, CONTEXT.md
  sections, confidence badges) with per-category ADOPT / NARROW / REJECT decisions
- `.planning/phases/58-structural-enforcement-gates/58-03-upstream-delta.md` §4 — ledger
  entries for narrowed categories (d) and (e), consumed by Plan 20 `58-20-LEDGER.md`

**Parity / provenance:**

- `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md` §GATE-08a..e
  — per-gate Codex CLI behavior (all five sub-gates `applies` on both runtimes)
- `.planning/phases/58-structural-enforcement-gates/58-CONTEXT.md` §6 — GATE-08 split into
  five enumerated sub-requirements
- `agents/gsdr-assumptions-analyzer.md` — ported agent spec (Plan 03 Task 2)

**Related references:**

- `get-shit-done/references/claim-types.md` — canonical typed-claim vocabulary (DISC-01..10,
  Phase 57.2 shipped surface)
- `get-shit-done/references/capability-matrix.md` — runtime capability declarations; drives
  `AskUserQuestion` vs text_mode availability per runtime
- `get-shit-done/references/model-profiles.md` — `model_profile` tier definitions

**Signals addressed:**

- `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop` — 3 closed issues that
  masked missing adoption work; this doc + Plan 11 workflow port structurally close that
  drift window

---

## Appendix — `text_mode` Quick Reference

**Set project-wide:**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow.text_mode true
```

**Revert to interactive:**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow.text_mode false
```

**One-shot override (when `--text` flag is supported on the command):**
```
/gsdr:discuss-phase 42 --text
```

**Expected text_mode behavior in discuss-phase-assumptions:**

```
## Phase 42: payments-integration — Assumptions

Based on codebase analysis, here's what I'd go with:

### Technical Approach
Confident — Use Stripe SDK v14+ for payment intent flow
↳ Evidence: src/billing/*.ts uses Stripe v13 patterns
↳ If wrong: Would need rollback to webhook-based flow

### State Management
Likely — Persist intent state in Redux
↳ Evidence: src/store/ pattern, no Zustand usage
↳ If wrong: Could migrate to React Query

These all look right?
1) Yes, proceed
2) Let me correct some

Select (1-N): _
```
