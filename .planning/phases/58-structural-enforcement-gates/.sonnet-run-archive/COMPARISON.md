---
date: 2026-04-20
compared_files:
  sonnet_run: ".planning/phases/58-structural-enforcement-gates/.sonnet-run-archive/RESEARCH.md"
  opus_run:   ".planning/phases/58-structural-enforcement-gates/58-RESEARCH.md"
sonnet_length: 806
opus_length:   940
unified_diff_size: 1519
models:
  sonnet: claude-sonnet-4-6
  opus:   claude-opus-4-7 (inherited via unspecified model param, 1M context)
authored_by: orchestrator (claude-opus-4-7, post-hoc comparison)
audit_note: |
  Sonnet run was dispatched in error — the orchestrator over-applied the "always use sonnet for subagents" memory
  pattern (which was only meant for sensors and explore) to the researcher. Researcher-model config was `inherit`,
  which should have resolved to opus. The independent opus re-run was spawned with strict "do not read the sonnet
  archive" instructions to preserve comparative integrity.
---

# Phase 58 RESEARCH.md — Comparative Evaluation (Sonnet vs Opus)

## 1. Methodology

- Sonnet run (`claude-sonnet-4-6`, committed `d71454f0`, archived at `7bb0abc0`) executed the same research prompt as the opus re-run.
- Opus run (`claude-opus-4-7` 1M, committed `cd737ab9`) was explicitly forbidden from reading any path containing the sonnet archive.
- Both runs had access to: `58-CONTEXT.md`, `58-DISCUSSION-LOG.md`, the 2026-04-20 Phase 58 gap audit, `REQUIREMENTS.md`, `ROADMAP.md`, and the repo substrate.
- This comparison document was authored post-hoc by the orchestrator (opus 4.7 1M) with direct ground-truthing of disputed facts via `curl`.

Ground-truth verification run after both research passes:

| Disputed fact | Sonnet claim | Opus claim | Ground truth (curl 2026-04-20) |
|---|---|---|---|
| Upstream `discuss-phase-assumptions.md` line count | 536 lines | ~750 lines | **671 lines** (matches REQUIREMENTS.md:236 literally; neither run was correct) |
| Upstream filename is `gsd-assume-phase.md`? | Did not claim | Speculated "may be" | **False** — 404 on raw.githubusercontent; the file is `discuss-phase-assumptions.md`, as the fork and REQUIREMENTS.md name it |
| Upstream `gsd-assumptions-analyzer.md` agent exists? | Not independently verified (flagged as "Low confidence open") | Verified via GitHub API, cited SHA `5531fc4a97…` + size 4.5 KB | **True** (HTTP 200, 105 lines) — opus was right |

## 2. Structural differences

Both runs cover R1–R11 from the research program and produce a Genuine Gaps table (R12). The organizational deltas:

| Section | Sonnet | Opus |
|---|---|---|
| Upstream line count authority | Asserts 536 with specific number | Asserts ~750, notes REQUIREMENTS.md:236's 671 is stale |
| `Architecture Patterns` (4 patterns) | Present | Absent (folded into per-section recommendations) |
| `Common Pitfalls` (5 pitfalls) | Present | Absent (some folded into R1 Critical Finding) |
| `Load-bearing classification rule` (R6 operational) | Brief 2-sentence rule | Full 4-clause rule with edge-case guidance for `[projected]` / `[open]` |
| `Per-gate Codex behavior table` (for AT-3) | Absent | Present (18-row skeleton) |
| GATE-09 schema detail | 8 fields | 9 fields (adds `evidence_paths`, `role_split_provenance` per PROV-01 from 57.8) |
| Wave structure granularity | 6 plans in two waves (A1-A3 / B1-B6) | 20 plans in 4 waves (P1-P20), with file-scope table |
| Metadata section | Absent | Present |

## 3. Substantive findings — where they agree

The following findings agree between the two runs:

1. **Branch protection gap:** Both verified `enforce_admins: false` and `strict: false` via `gh api`. Both diagnose this as the GATE-01 + GATE-14 substrate gap.
2. **CI workflow already exists** with `Test` context on both push and PR; no grep / parity / emission infrastructure yet.
3. **Only one conforming `gh pr merge --merge`** invocation at `execute-phase.md:793`.
4. **`dist/MANIFEST` does not exist** at repo root.
5. **Path-prefix substitution** in installer (`get-shit-done/` → `get-shit-done-reflect/`, `gsd-` → `gsdr-`) means naive byte-diff is wrong; GATE-15 needs transformation-aware comparison.
6. **Q3 ledger location → standalone `NN-LEDGER.md`** (both runs reach the same conclusion, with identical KB/verifier reasoning).
7. **Q5 meta-gate is cheap** — existing extractor registry accepts gate fire-events (sonnet calls it GATE-99, opus calls it GATE-09e; same mechanism).
8. **Q6 → new `gsd-tools phase reconcile` subcommand** is required (existing primitives cannot compose atomically).
9. **Phase 57.9 non-existence** is the hard AT-1 blocker at plan-phase entry.
10. **`signal-detection.md:67-76` Codex heuristic is still stale.** Out of Phase 58 scope; noted as open risk.

## 4. Substantive findings — where opus adds material that sonnet missed

### 4.1 `complete-milestone.md` defaults to `git merge --squash` (critical new finding)

Opus: Found `git merge --squash "$branch"` at `complete-milestone.md:613` and `:623`, with "Squash merge (Recommended)" as the default AskUserQuestion option at `:603`. Cites motivating signal `sig-2026-03-28-squash-merge-destroys-commit-history.md` (severity critical).

Sonnet: Reports `complete-milestone.md:721` has no `gh pr merge` invocation at all, concluding "the milestone workflow displays a completion banner but does not structurally invoke a merge." Sonnet did not grep for `git merge --squash` (the underlying git surface) — only for `gh pr merge`.

**Implication:** Sonnet's GATE-02 plan would leave a `--squash` default live in the milestone workflow. The audit itself also missed this (§Finding 2.2 asserts "No `--squash` anywhere"). Opus's finding is a direct addendum to the audit.

### 4.2 `gsd-assumptions-analyzer.md` agent verification (Q2 / GATE-08b)

Opus: Verified via GitHub API — agent exists upstream (4.5 KB, SHA `5531fc4a97…`). Recommends port to `gsdr-assumptions-analyzer` via `replacePathsInContent` with path transformation.

Sonnet: Left this as an open question ("Not independently verified in this research pass; GATE-08a explicit verification step") with a "Low confidence open question" flag in its Genuine Gaps table.

**Implication:** Opus closes the question; sonnet would have re-dispatched agent existence verification during planning.

### 4.3 Fork diverges UPWARD from upstream in some areas (R5 category breakdown)

Opus adds **categories (e) CONTEXT.md section mandates** and **(f) confidence badges** that sonnet's 5-category table does not cover:
- **(e):** Fork has `<working_model>`, `<constraints>`, `<guardrails>`, `<questions>`, `<dependencies>`, typed claims per DISC-02. Upstream has the 6-section contract plus confidence badges but not typed claims. Fork is richer here; GATE-08e "narrowing" runs the other direction.
- **(f):** Upstream's Confident / Likely / Unclear badges map onto typed-claim dimensions (`Confident` ↔ `[evidenced:*]`, `Likely` ↔ `[decided:*] / [assumed:*]`, `Unclear` ↔ `[open] / [assumed:reasoned]`). Opus calls for a mapping document in GATE-08c.

Sonnet covers (a)-(e) without this analysis of divergence-direction.

**Implication:** Sonnet's plan would uniformly treat "adopt upstream" as the pattern; opus's plan correctly identifies that some fork divergences should be preserved with GATE-09c narrowing rationale.

### 4.4 `role_split_provenance` in GATE-09 schema (ties GATE-09 to Phase 57.8 PROV-01)

Opus GATE-09 schema adds `role_split_provenance: {written_by: planner | executor | verifier, written_at, session_id}` per PROV-01. Rationale: "planner's narrowing-decision entries (GATE-09c) go in at plan-phase time; executor's implementation-vs-defer entries go in at execute-phase close; verifier's final disposition comes at verify-work. Standalone file is naturally append-only across roles. Collapsing into SUMMARY or VERIFICATION erases that."

Sonnet schema has no role-split provenance — just `generated_at` and the `claim_type` / `disposition` fields.

**Implication:** Opus's schema honors the Phase 57.8 PROV-01 contract; sonnet's schema is flat and would regress on attribution.

### 4.5 Load-bearing operational rule covers edge cases

Opus's R6 load-bearing rule has 4 clauses plus explicit edge-case guidance for `[projected]` (load-bearing when cross-phase) and `[open]` (load-bearing during plan-phase but not verification).

Sonnet's rule is 2 clauses and does not address edge cases.

**Implication:** Without the edge-case handling, verifier behavior on `[projected:reasoned]` and `[open]` claims (which Phase 58's own CONTEXT has several of) is ambiguous.

### 4.6 Per-gate Codex behavior table pre-authored for AT-3

Opus delivers a 18-row skeleton already mapping each GATE to Claude Code + Codex behaviors, satisfying Phase 58 Acceptance Test AT-3 as a plan-entry precondition.

Sonnet does not produce this table.

**Implication:** Opus's planner has AT-3 ready; sonnet's planner would have to write the table before advancing.

### 4.7 GATE-15 parity check schema

Opus recommends running installer into temp dir, then comparing source → expected-installed using the installer's own `replacePathsInContent()` transformation.

Sonnet recommends SHA256-based post-install manifest generated by `bin/install.js` as new code.

**Implication:** Opus's approach reuses existing installer code (lower new-code risk); sonnet's approach adds a parallel manifest system.

## 5. Substantive findings — where sonnet has content opus dropped

### 5.1 Explicit "Architecture Patterns" section (4 patterns)

Sonnet has a dedicated `## Architecture Patterns` section with four reusable patterns:
- Pattern 1: CI-as-Structural-Gate
- Pattern 2: Workflow-Level Exit-Coded Gate
- Pattern 3: Dispatch Contract Restatement (GATE-13)
- Pattern 4: Gate Fire-Event Drop-File

Opus folds these considerations into individual R-sections but does not synthesize them as reusable patterns.

**Value:** Planner gets a vocabulary for consistent gate implementations.

### 5.2 Explicit "Common Pitfalls" section (5 pitfalls)

Sonnet enumerates pitfalls independent of the audit:
- Pitfall 1: Structural Gate That Is Still Advisory
- Pitfall 2: Advisory-by-Composition
- Pitfall 3: GATE-09 Collapses to Prose
- Pitfall 4: Phase 57.9 Completion Incorrectly Assumed
- Pitfall 5: `enforce_admins: false` Left Unclosed

Opus covers the substance within the regular sections but without the pitfall framing.

**Value:** Pitfall framing is easier for a plan-checker to match against.

### 5.3 Smaller wave structure (6 plans vs 20)

Sonnet's wave structure is coarser (6 plans in 2 waves) where opus's is finer (20 plans in 4 waves). Both identify the same file-scope overlaps (`execute-phase.md`, `plan-phase.md`, `ci.yml` as hotspots).

Whether 6 or 20 is "right" depends on granularity preference. Opus's 20-plan structure is too fine if phase granularity is coarse; sonnet's 6-plan structure serializes too aggressively on `plan-phase.md`.

## 6. Substantive findings — where both were WRONG

### 6.1 Upstream `discuss-phase-assumptions.md` line count (Q2)

- **Sonnet:** 536 lines (undercount by 135).
- **Opus:** ~750 lines (overcount by ~80).
- **Ground truth:** 671 lines — which matches REQUIREMENTS.md:236 literally.

Both runs used WebFetch; both got different numbers, neither correct. The REQUIREMENTS.md:236 value `671` is **not stale** — it is accurate as of 2026-04-20. Both runs' dispute of the 671 figure is itself a factual error.

Implication for planning: planners should treat the REQUIREMENTS.md:236 number as correct and confirm via direct fetch before the GATE-08a delta artifact is produced. WebFetch's content-trimming behavior is not reliable for line-count verification.

### 6.2 Spurious upstream filename (opus only)

Opus speculates "Upstream filename may actually be `gsd-assume-phase.md`" — this file does not exist upstream (404). The correct filename is `discuss-phase-assumptions.md` as the fork uses.

## 7. Overall assessment

| Dimension | Winner | Notes |
|---|---|---|
| Depth of substrate inspection | **Opus** | Direct `gh api` JSON quote; found `git merge --squash` that audit missed; verified upstream agent existence |
| Breadth of pattern-level synthesis | **Sonnet** | Architecture Patterns + Common Pitfalls sections are reusable frames opus didn't produce |
| GATE-09 schema fidelity to Phase 57.8 | **Opus** | Role-split provenance; load-bearing edge cases; honors PROV-01 |
| Upstream discuss-phase analysis | **Opus** | Category (e) and (f) — divergence-direction analysis; agent verification |
| AT-3 readiness (per-gate Codex table) | **Opus** | Delivered skeleton; sonnet did not |
| Wave structure granularity | Tie / preference | Opus 4×5 = 20 plans; sonnet 2 waves × 6 plans. Opus more parallelizable but requires finer plan-phase plan-checker attention |
| Factual accuracy on upstream line count | Neither | Both wrong; REQUIREMENTS.md:236's 671 is correct |
| Honest declaration of unknowns | **Both** | Both flag confidence levels; sonnet flags more "open questions", opus closes more via verification |

**Net:** The opus run contains material the sonnet run did not (complete-milestone squash, role-split provenance in GATE-09, per-gate Codex table, `gsdr-assumptions-analyzer` verification). The sonnet run has valuable pattern/pitfall framing the opus run does not. The safest posture for the planner is to use the opus run as canonical and consult the sonnet archive for the Architecture Patterns + Common Pitfalls sections specifically.

## 8. Recommendations for planner

1. **Use the opus run (`58-RESEARCH.md`) as canonical research input.**
2. **Treat the sonnet `Architecture Patterns` and `Common Pitfalls` sections as supplementary** — they are structurally valuable even though their substantive findings are superseded.
3. **Do not re-dispute REQUIREMENTS.md:236's line count** — 671 is ground-truth-correct.
4. **Fold the `git merge --squash` fix into GATE-02 scope** (Plan P1 in opus's Wave 1, or Plan A1 in sonnet's Wave A). This is now a hard requirement, not deferred chore.
5. **Honor the per-gate Codex behavior skeleton from opus** — it's a ready-made AT-3 artifact.
6. **Verify Phase 57.9 status at plan-phase entry (AT-1)** — this is the blocking decision for GATE-06/07 disposition.

## 9. Methodological note — what this tells us about model choice for research

The research task was framework-heavy (25 requirements across substrate / CI / workflow / agent / ledger / measurement domains), reference-heavy (1 audit + 5 predecessor audits + 2 deliberations + 10 substrate files + git history + WebFetch), and required cross-domain synthesis (GATE-09 ties to Phase 57.8 PROV-01; GATE-02 ties to `complete-milestone.md` un-audited surfaces; meta-gate ties to Phase 57.5 extractor registry).

Opus 4.7 1M outperformed Sonnet 4.6 on substantive domain findings (§4) while underperforming on synthesized pattern frames (§5). For research tasks this dense, both costs are visible — neither is a clean win. The right resolution is probably to dispatch opus for substrate investigation and have a separate sonnet (or haiku) pass for pattern-frame synthesis, rather than a single-agent run. That is a workflow change, not a model choice.

Neither run was factually accurate on the upstream line count; both were misled by the same WebFetch tool behavior. This is an independent observability gap — research agents should cross-verify WebFetch results with direct curl / gh api calls when a line count or byte count is load-bearing.
