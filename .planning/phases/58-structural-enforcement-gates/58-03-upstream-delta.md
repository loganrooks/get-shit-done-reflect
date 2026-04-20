---
phase: 58-structural-enforcement-gates
plan: 03
artifact_type: upstream_delta
gates: [GATE-08a, GATE-08b, GATE-08c, GATE-08d, GATE-08e]
upstream_sha: "ebbe74de7201fffeaa72b3b6c388203d7e9f99fc"
upstream_sha_note: "gsd-build/get-shit-done main HEAD at fetch time (via https://api.github.com/repos/gsd-build/get-shit-done/commits/main)"
upstream_line_count_assumptions: 671
upstream_line_count_analyzer: 105
fork_line_count_assumptions: 279
verification_complete: true
fetched_at: "2026-04-20T12:36:28Z"
fetch_method: "direct curl (not WebFetch — per Research Verified-Ground-Truth)"
upstream_drift_since_research: false
upstream_drift_pct: 0
codex_runtime_behavior: "applies on both runtimes — workflow file edits and agent files apply identically on Claude Code and Codex"
---

# Phase 58 Plan 03 — Upstream Delta Analysis

This artifact satisfies AT-1 for GATE-08a (current-state verification against upstream). It records a **direct live re-fetch** of upstream's `discuss-phase-assumptions.md` workflow and its companion `gsd-assumptions-analyzer.md` agent, the 6-category delta, and the fork's per-category adoption decision. Narrowing entries for categories (d) and (e) are formatted for consumption by Plan 20's ledger (GATE-09c provenance).

## Section 1 — Fetch Methodology and Verification

Per CONTEXT Q2 and Research R5 Verified-Ground-Truth finding: **WebFetch is unreliable for byte-level comparisons**; upstream must be fetched by direct `curl` against `raw.githubusercontent.com` and the commit SHA captured from the GitHub API.

### Fetch Commands (Authoritative)

```bash
# Upstream workflow
curl -s https://raw.githubusercontent.com/gsd-build/get-shit-done/main/get-shit-done/workflows/discuss-phase-assumptions.md \
  > /tmp/upstream-discuss-phase-assumptions.md
wc -l /tmp/upstream-discuss-phase-assumptions.md
# → 671

# Upstream analyzer agent
curl -s https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-assumptions-analyzer.md \
  > /tmp/upstream-assumptions-analyzer.md
wc -l /tmp/upstream-assumptions-analyzer.md
# → 105

# Upstream HEAD SHA (provenance)
curl -s https://api.github.com/repos/gsd-build/get-shit-done/commits/main \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['sha'])"
# → ebbe74de7201fffeaa72b3b6c388203d7e9f99fc
```

### Verification Outcome

| Measurement | Value | Research R5 Baseline | Delta | Within 10% Tolerance |
| --- | --- | --- | --- | --- |
| Upstream `discuss-phase-assumptions.md` lines | 671 | 671 | 0 | ✅ |
| Upstream `gsd-assumptions-analyzer.md` lines | 105 | ~105 | 0 | ✅ |
| Fork `discuss-phase-assumptions.md` lines | 279 | 279 | 0 | n/a (fork) |

**Upstream drift since research:** none. Research R5's line counts are current at fetch time. `verification_complete: true` in frontmatter.

### Diff Scope

The upstream/fork diff (`diff /tmp/upstream-discuss-phase-assumptions.md get-shit-done/workflows/discuss-phase-assumptions.md`) yields **764 diff lines** over the 671-line upstream vs 279-line fork — i.e., upstream is a ~2.4× richer superstructure. The fork is not a subset by line count alone; it is a **different workflow** that happens to share the same filename and general intent. The 6 categories below decompose what the fork gains / loses / narrows when adopting upstream.

## Section 2 — Per-Gate Codex Behavior Declaration

Per DC-4 (`58-CONTEXT.md:128`) and audit §5.3, every GATE carries an explicit Codex behavior marker.

| Gate | Substrate | Claude Code | Codex CLI | Rationale |
| --- | --- | --- | --- | --- |
| GATE-08a | filesystem artifact (`58-03-upstream-delta.md` with `verification_complete: true`) | `applies` | `applies` | Filesystem check; identical on both runtimes. |
| GATE-08b | workflow invocation of `gsdr-assumptions-analyzer` agent from `discuss-phase-assumptions.md` | `applies` | `applies` | Both runtimes dispatch agents via the same `Task()` / skill invocation surface per `references/capability-matrix.md`. |
| GATE-08c | reference doc at `docs/workflow-discuss-mode.md` (authored in Plan 11) | `applies` | `applies` | Pure documentation; no runtime divergence. |
| GATE-08d | mode-aware gate in `plan-phase.md` / `progress.md` (workflow file edits, Plan 11) | `applies` | `applies` | Workflow text is shared substrate. |
| GATE-08e | narrowing-rationale entries in `58-20-LEDGER.md` (authored in Plan 17) | `applies` | `applies` | Ledger is a YAML/markdown artifact; not runtime-dependent. |

**No `does-not-apply-with-reason` or `applies-via-workflow-step` markers needed for GATE-08a–e.** All five sub-gates are workflow/artifact edits on shared substrate.

## Section 3 — The 6 Categories (per CONTEXT Q2, audit §6.3, Research R5)

Each category carries: what it is (in upstream), what the fork has today, adopt / narrow / reject decision, and a **named rationale** for any narrowing (required by GATE-09c).

### (a) Methodology loading

**Upstream** (671-line file, `<step name="load_methodology">`, lines 189–205): Reads `.planning/METHODOLOGY.md` if present, parses named lenses and their diagnoses/recommendations/triggers, stores as internal `<active_lenses>`, passes the lens list to the analyzer agent, and appends a "Methodology" section to presented assumptions showing which lenses applied.

**Fork today** (279-line file): No methodology loading step. METHODOLOGY.md is not a recognized artifact in the fork's current discuss-phase-assumptions surface.

**Decision:** **ADOPT AS-IS.**

**Rationale:** Methodology lenses are strictly additive — the step is skip-silent when METHODOLOGY.md is absent (upstream line 204). Fork projects that never create METHODOLOGY.md see zero behavior change; fork projects that *do* create one gain the lens-driven analysis gradient. Zero risk to existing fork projects; upside is real for projects that adopt a methodology artifact later. No fork-specific concern argues against adoption.

**Plan 11 wiring:** copy the `<step name="load_methodology">` block verbatim into the fork's `discuss-phase-assumptions.md` at the same position (after `cross_reference_todos`, before `scout_codebase`).

---

### (b) Assumptions-analyzer agent

**Upstream** (105-line agent at `agents/gsd-assumptions-analyzer.md`, invoked from `discuss-phase-assumptions.md:257` via `Task(subagent_type="gsd-assumptions-analyzer", ...)`): A dedicated subagent that:
- Reads ROADMAP.md, prior CONTEXT.md files, does targeted codebase scan (5–15 source files).
- Produces structured assumptions with evidence (file paths), consequence-if-wrong, and confidence badge (Confident / Likely / Unclear).
- Runs at one of three calibration tiers (`full_maturity` / `standard` / `minimal_decisive`) that control the number of areas and alternatives.
- Returns structured output to main workflow; does NOT present to user directly.

**Fork today:** Agent does not exist in `agents/`. Fork's `discuss-phase-assumptions.md` uses inline heuristics rather than a dispatched subagent.

**Decision:** **ADOPT AS-IS (renamed to `gsdr-assumptions-analyzer`).**

**Rationale:** Agent dispatch for deep codebase analysis is a consistent fork pattern (`gsdr-phase-researcher`, `gsdr-context-checker`, `gsdr-auditor`, 20+ existing agents). A dedicated `gsdr-assumptions-analyzer` aligns with that substrate. The fork's only modification is branding (`gsd-` → `gsdr-`), executed by the installer's `replacePathsInContent` + name substitution. Zero non-branding divergence intended — any found divergence would be recorded as a GATE-09c narrowing entry.

**Ported in Task 2** (this plan): `agents/gsdr-assumptions-analyzer.md`. Wave 3 Plan 11 wires invocation into `discuss-phase-assumptions.md`.

---

### (c) Mode-aware gating (`text_mode`)

**Upstream** (line 56): `<answer_validation>` section — when `workflow.text_mode: true` in config or `--text` flag is passed, `AskUserQuestion` is replaced with plain-text numbered lists. Answer validation also retries empty responses once, then falls back to text-mode presentation.

**Fork today:** Fork config already has `workflow.text_mode` key (`.planning/config.json:14`, currently `false`). The fork's discuss-phase-assumptions.md does not contain the `<answer_validation>` block.

**Decision:** **ADOPT AS-IS.**

**Rationale:** `workflow.text_mode` is a first-class fork config surface (already shipped). Adopting upstream's answer-validation + text-mode pattern is a consistency fix — fork presently has the config key but no runtime behavior for it in this workflow. Zero narrowing; full adoption closes an existing gap. Required for parity with Codex CLI where interactive `AskUserQuestion` behavior varies (per `references/capability-matrix.md`).

**Plan 11 wiring:** copy upstream's `<answer_validation>` block verbatim; confirm Claude Code and Codex CLI both honor the `text_mode` fallback path.

---

### (d) Calibration tier (`full_maturity` / `standard` / `minimal_decisive`)

**Upstream** (lines 236–286): Reads optional `.planning/USER-PROFILE.md`, maps a user-experience / user-philosophy field to one of three calibration tiers, passes the tier to the analyzer agent which uses it to scale output (3–5 areas + 2–3 alternatives vs 3–4 areas + 2 alternatives vs 2–3 areas + single recommendation).

**Fork today:** No USER-PROFILE.md. No per-invocation calibration tier. **But**: fork has `model_profile` at `config.json:5` (currently `"quality"`), which maps every agent to a model tier (`opus` / `sonnet` / `haiku`) via `get-shit-done/bin/model-profiles.cjs` — this is the fork's calibration surface. Fork's `model_profile` controls *agent effort* (which model executes) rather than *output shape* (how many areas, how many alternatives).

**Decision:** **ADOPT NARROWED per GATE-09c.**

**Narrowing shape:**
- Drop the USER-PROFILE.md → calibration_tier mapping.
- Keep the three-tier output shape (full_maturity / standard / minimal_decisive) in the analyzer agent (so its prompt surface is upstream-compatible), but resolve tier **from `model_profile`** rather than from a parallel user-philosophy artifact.
- Mapping: `model_profile=quality` → `full_maturity`; `balanced` → `standard`; `cost`/`fast` → `minimal_decisive`.

**Named rationale (GATE-09c):** The fork already calibrates agent effort via `model_profile` (shipped in Phase 55, validated in Phase 57.2 discuss-phase deliberation). Adopting a second parallel calibration axis (user-philosophy via USER-PROFILE.md) duplicates a shipped fork surface and adds artifact complexity for a solo-user repo where the `model_profile` tier already fits the same role. Narrowing preserves upstream's analyzer prompt shape (three tiers) while rejecting the redundant artifact-introduction tier.

**Reversibility:** HIGH. USER-PROFILE.md can be added later without breaking the analyzer agent contract — the tier lookup becomes `USER-PROFILE.md ?? map(model_profile)` rather than a structural change.

**Plan 17 ledger entry:** ready in Section 4 below.

---

### (e) CONTEXT.md section mandates

**Upstream** (lines 406–449): `<step name="write_context">` mandates the "standard 6-section format": `<domain>`, `<decisions>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<deferred>`. Assumptions map 1:1 to `<decisions>` entries (D-01, D-02, …); corrections override the original assumption; folded todos land under "### Folded Todos".

**Fork today:** Fork's CONTEXT.md uses a richer typed-claim vocabulary per `get-shit-done/references/claim-types.md` (Phase 57.2, DISC-01 through DISC-10). Phase 58's own CONTEXT.md (`.planning/phases/58-structural-enforcement-gates/58-CONTEXT.md`) demonstrates 10+ sections (`<domain>`, `<working_model>`, `<constraints>`, `<guardrails>`, `<questions>`, `<dependencies>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<deferred>`, plus Acceptance Tests appendix), each entry typed with `[decided:*]`, `[assumed:*]`, `[governing:*]`, `[open]`, `[projected:*]`, `[evidenced:*]`, `[stipulated:*]` markers, with explicit claim-dependencies table. This is **strictly richer** than upstream's 6-section contract.

**Decision:** **ADOPT NARROWED per GATE-09c.**

**Narrowing shape:**
- Keep fork's richer section set and typed-claim vocabulary as the fork's CONTEXT.md contract. Do NOT collapse to upstream's 6-section form.
- Map upstream's assumption → decision pattern onto fork's `[decided:reasoned]` or `[decided:cited]` claims.
- Preserve fork's `<working_model>`, `<constraints>`, `<guardrails>`, `<questions>`, `<dependencies>` sections — these have no upstream analog.
- The analyzer agent's output shape (assumptions with evidence + confidence badge) is consumed by the fork's write-step and translated into typed claims.

**Named rationale (GATE-09c):** The fork's CONTEXT.md contract is a strict superset of upstream's. Downgrading to upstream's flatter 6-section format would erase Phase 57.2's typed-claim shipped surface (DISC-01..10), Phase 57.4's audit-informed claim-dependency table, and the `<guardrails>` / `<questions>` sections that 58-CONTEXT.md depends on. GATE-09c rejects silent narrowing — this narrowing is explicit and preserves the fork-richer surface. Upstream's "6-section format" is mapped forward into fork's typed sections (domain → `<domain>`; decisions → `<working_model>` + typed `[decided:*]` claims; canonical_refs → `<canonical_refs>`; code_context → `<code_context>`; specifics → `<specifics>`; deferred → `<deferred>`), plus the fork-specific additions are preserved.

**Reversibility:** LOW in the direction of adopting upstream's flatter contract (that would break Phase 57.2 shipped work). HIGH in the direction of upstream re-adopting the fork's superset — if upstream eventually adopts typed claims, fork's contract is already the target.

**Plan 17 ledger entry:** ready in Section 4 below.

---

### (f) Confidence badges (Confident / Likely / Unclear)

**Upstream** (analyzer agent lines 56 and 71; workflow line 282): Assumptions carry a three-level confidence badge — Confident (clear from code), Likely (reasonable inference), Unclear (could go multiple ways). Unclear items get 2–3 alternatives.

**Fork today:** Fork uses a richer typed-claim vocabulary (`[decided:*]`, `[assumed:*]`, `[governing:*]`, `[open]`, `[projected:*]`, `[evidenced:*]`, `[stipulated:*]`) per `claim-types.md`. No three-level Confident/Likely/Unclear badge ever shipped in the fork.

**Decision:** **ADOPT AS-IS AS MAPPED.**

**Mapping (for Plan 11 or Plan-11-downstream docs step):**

| Upstream confidence | Fork typed-claim equivalent | Rationale |
| --- | --- | --- |
| **Confident** (clear from code / prior decision) | `[decided:cited]` or `[evidenced:cited]` | Evidence-backed, citation-anchored. |
| **Likely** (reasonable inference, 2+ alternatives) | `[assumed:reasoned]` | Inferred but not evidence-locked. |
| **Unclear** (could go multiple ways, needs user input) | `[open]` | Unresolved, tracked in `<questions>`. |

**Rationale:** The analyzer agent receives confidence-badge outputs from upstream's prompt; fork's `discuss-phase-assumptions.md` post-processes those into typed claims via the mapping table. This preserves the upstream agent's prompt verbatim (so it returns what upstream expects) while yielding fork-compatible typed-claim output. Zero narrowing of the confidence vocabulary; the mapping is a translation layer that preserves both surfaces.

**Plan 11 wiring:** include the mapping table in the workflow's `write_context` step, downstream of where the analyzer returns output. Plan 11 (or a GATE-08c-owned doc in `docs/workflow-discuss-mode.md`) records the mapping so future readers can trace how `Confident` became `[decided:cited]`.

---

## Section 4 — Ledger Entries (Ready-to-Consume Format for Plan 20)

Per GATE-09c (`58-CONTEXT.md:85`): when the fork narrows an upstream surface, narrowing requires named rationale recorded under the ledger's `narrowing_provenance` field.

Two narrowing entries are produced by this plan: category (d) calibration-tier redundancy, and category (e) CONTEXT.md section mandates. Plan 17 / Plan 20 consume these entries when authoring `58-20-LEDGER.md`.

### Ledger Entry 1 — Category (d) Calibration Tier

```yaml
- context_claim: "Phase 58 adopts upstream's richer discuss-phase-assumptions surface (CONTEXT 58 §6, GATE-08 scope)."
  disposition: rejected_with_reason
  target_phase_if_deferred: null
  narrowing_provenance:
    originating_claim: "58-CONTEXT.md §6 [decided:cited] — upstream's richer version will be re-fetched and diffed before adoption work begins (line 75)."
    rationale: |
      Upstream's calibration_tier surface (USER-PROFILE.md → full_maturity / standard / minimal_decisive) duplicates the fork's shipped `model_profile` surface (Phase 55, .planning/config.json:5). Adopting USER-PROFILE.md introduces a parallel calibration axis and a new artifact class for a solo-user repo where the existing `model_profile` tier already serves the analyzer-effort role. Fork retains the three-tier output shape in the analyzer agent's prompt (upstream-compatible) but resolves the tier from `model_profile` (quality → full_maturity, balanced → standard, cost/fast → minimal_decisive). USER-PROFILE.md can be re-introduced additively later if the solo-user constraint changes.
    narrowing_decision: "Keep analyzer-agent three-tier prompt shape; drop USER-PROFILE.md artifact-introduction; resolve tier from existing model_profile."
  plan: "58-03"
  gate: GATE-09c
  category: "(d) calibration tier"
  reversibility: HIGH
  source_artifact: ".planning/phases/58-structural-enforcement-gates/58-03-upstream-delta.md §3(d)"
```

### Ledger Entry 2 — Category (e) CONTEXT.md Section Mandates

```yaml
- context_claim: "Phase 58 adopts upstream's richer discuss-phase-assumptions surface (CONTEXT 58 §6, GATE-08 scope)."
  disposition: rejected_with_reason
  target_phase_if_deferred: null
  narrowing_provenance:
    originating_claim: "58-CONTEXT.md §6 [governing:reasoned] — If the fork narrows the upstream richer version, the narrowing requires named rationale recorded under GATE-09c's narrowing-decision provenance rule (line 76)."
    rationale: |
      Upstream's CONTEXT.md contract is a 6-section flat format (<domain> / <decisions> / <canonical_refs> / <code_context> / <specifics> / <deferred>). The fork's contract is strictly richer: it adds <working_model> / <constraints> / <guardrails> / <questions> / <dependencies> sections and a typed-claim vocabulary (DISC-01..10 per Phase 57.2). Phase 58's own CONTEXT.md uses the full fork contract; downgrading to upstream's flatter form would erase Phase 57.2 shipped surface, Phase 57.4 audit-informed dependency tables, and the guardrails / questions sections 58-CONTEXT depends on. Upstream's section set is mapped forward onto fork's typed sections (see §3(e) mapping table). Fork-richer superset is preserved.
    narrowing_decision: "Keep fork's CONTEXT.md section set and typed-claim vocabulary; map upstream's 6-section flat format onto fork's typed sections; do not collapse downward."
  plan: "58-03"
  gate: GATE-09c
  category: "(e) CONTEXT.md section mandates"
  reversibility: LOW
  source_artifact: ".planning/phases/58-structural-enforcement-gates/58-03-upstream-delta.md §3(e)"
```

## Section 5 — Summary Table of Decisions

| # | Category | Decision | Narrowing Rationale (if narrowed) | Wave 3 Wiring Site |
| --- | --- | --- | --- | --- |
| (a) | Methodology loading | ADOPT AS-IS | — | `discuss-phase-assumptions.md` `<step name="load_methodology">` (copy verbatim) |
| (b) | Assumptions-analyzer agent | ADOPT AS-IS (renamed `gsdr-assumptions-analyzer`) | — | `agents/gsdr-assumptions-analyzer.md` (ported in Plan 03 Task 2); wired into `discuss-phase-assumptions.md:257` by Plan 11 |
| (c) | Mode-aware gating (`text_mode`) | ADOPT AS-IS | — | `discuss-phase-assumptions.md` `<answer_validation>` block |
| (d) | Calibration tier | ADOPT NARROWED | Redundant with shipped `model_profile`; adopt three-tier prompt shape but resolve tier from `model_profile`, not USER-PROFILE.md | Analyzer-agent prompt (tier shape); workflow (tier resolution) |
| (e) | CONTEXT.md section mandates | ADOPT NARROWED | Fork's contract is a strict superset (typed claims, `<guardrails>`, `<questions>`, `<dependencies>`); map upstream's 6 sections onto fork's richer sections, do not collapse | `discuss-phase-assumptions.md` `<step name="write_context">` |
| (f) | Confidence badges | ADOPT AS-IS AS MAPPED | — | Mapping table in `docs/workflow-discuss-mode.md` (Plan 11 / GATE-08c) or inline in `discuss-phase-assumptions.md` write_context |

**Adopted as-is:** 4 of 6 categories (a, b, c, f).
**Adopted narrowed with GATE-09c rationale:** 2 of 6 categories (d, e).
**Rejected without adoption:** 0 of 6.

**Total narrowing entries produced for Plan 20's ledger:** 2 (§4 above).

---

## Provenance Footer

- Plan: `58-03-PLAN.md`
- Artifact author: GSD executor (this plan's Task 1)
- Fetch timestamp: 2026-04-20T12:36:28Z
- Upstream HEAD SHA: `ebbe74de7201fffeaa72b3b6c388203d7e9f99fc`
- Upstream HEAD commit message (first line): `feat(release): publish @gsd-build/sdk alongside get-shit-done-cc in release pipeline (#2468)`
- Upstream HEAD commit date: 2026-04-20T03:13:14Z (~9 hours before fetch)
- Verification method: direct `curl` + `wc -l` + `diff`; re-run at artifact write time confirmed identical line counts (0% drift).
- GATE-08a acceptance: this artifact's existence with `verification_complete: true` in frontmatter IS the fire-event per 58-03-PLAN.md `<objective>` and 58-CONTEXT.md §6.
