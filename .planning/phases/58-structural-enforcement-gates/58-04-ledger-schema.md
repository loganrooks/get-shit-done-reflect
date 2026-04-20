---
phase: 58-structural-enforcement-gates
plan: 04
artifact_type: schema_specification
gate: GATE-09a
schema_version: v1
---

# GATE-09a Ledger Schema Specification (v1)

This artifact is the authoritative source of truth for the `ledger` frontmatter schema registered in `get-shit-done/bin/lib/frontmatter.cjs`. The validator and the Plan 17 GATE-09d verifier both consume this schema; no other document overrides the field set, enum vocabulary, or conditional-required logic described here.

Source of authority chain:

- `.planning/phases/58-structural-enforcement-gates/58-CONTEXT.md` §7 — GATE-09 scope-translation ledger (the decision to ship as a named artifact with a schema, not a prose convention).
- `.planning/phases/58-structural-enforcement-gates/58-RESEARCH.md` R6 — Q3 resolved as Layout 1 (standalone `NN-LEDGER.md`).
- This document — codifies the R6 schema sketch into a machine-readable specification and names the load-bearing classification rule.

Evidence role: AT-4 acceptance test ("ledger schema decided before GATE-09d verifier implementation in Plan 17 begins"). The artifact's existence + the `--schema ledger` CLI surface both exist before Plan 17's verifier implementation can depend on either.

---

## Section 1 — Motivation

The GATE-09 family (09a / 09b / 09c / 09d) asks phase planners, executors, and verifiers to report what the phase decided to do with each load-bearing CONTEXT claim: implement, defer, reject with reason, or leave open. Prose-only ledgers fragment the disposition vocabulary across summaries, verification notes, and ROADMAP edits; the verifier cannot cheaply check whether every load-bearing claim has a disposition, nor can the KB aggregate disposition trends across phases. GATE-09a closes that gap by making the ledger a named artifact with a frontmatter schema that the verifier can validate mechanically.

Scope boundary: GATE-09a is the **schema** decision. Where and when the ledger is written (plan-phase planner entries, execute-phase executor entries, verify-work verifier entries) is governed by GATE-09b / 09c / 09d and their respective workflow hooks. This spec does not constrain who writes or when — it constrains what the written form must look like.

Design precedent: the ledger inherits the dual-write invariant from PROV-05 / KB-05 (Phase 56/57.8). Files are source of truth; `kb.db` is a derived cache. `ledger_entries` is an additive KB table, not a schema-breaking migration (see Plan 04 Task 2).

---

## Section 2 — Per-gate Codex behavior

Per the Phase 58 Codex behavior table (58-RESEARCH.md §1006): **GATE-09a / 09b / 09c / 09d all `applies` on both runtimes** (Claude Code and Codex CLI). The ledger is a filesystem + KB artifact; runtime-neutral. Neither runtime holds the ledger in memory or depends on runtime-specific features for parsing.

The validator (`gsd-tools frontmatter validate --schema ledger`) and the Plan 17 verifier (GATE-09d) both run under whichever runtime the phase was planned under; the validator's own behavior does not vary across runtimes.

---

## Section 3 — Full schema definition

### 3.1 Top-level required frontmatter fields

| Field             | Type        | Constraint                                                                 |
| ----------------- | ----------- | -------------------------------------------------------------------------- |
| `phase`           | string      | Phase identifier (e.g., `58-structural-enforcement-gates`).                |
| `ledger_schema`   | string enum | Must equal `v1`. Future versions require a new spec artifact + validator branch. |
| `generated_at`    | ISO8601     | When the file (most recent write) was written.                             |
| `generator_role`  | enum        | `planner` \| `executor` \| `verifier` — role that wrote the current state. |
| `entries`         | array       | May be empty (rare; validator emits WARN, not FAIL).                       |

### 3.2 Per-entry required fields

| Field                    | Type    | Constraint                                                                                                                                                                          |
| ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context_claim`          | string  | Quoted claim text or claim ID from the phase CONTEXT.md. Free-form; no enum.                                                                                                        |
| `disposition`            | enum    | `implemented_this_phase` \| `explicitly_deferred` \| `rejected_with_reason` \| `left_open_blocking_planning`. This is the GATE-09a vocabulary; never collapsed to prose or free text. |
| `load_bearing`           | boolean | See Section 4 for the classification rule.                                                                                                                                          |
| `role_split_provenance`  | object  | See 3.3.                                                                                                                                                                            |

### 3.3 `role_split_provenance` required fields

Every entry carries provenance for who wrote that entry and when. This is the per-entry echo of the top-level `generator_role` field; because entries accumulate across planner / executor / verifier roles within a single file, the per-entry provenance is what lets downstream tools attribute a disposition to a role.

| Nested field                         | Type    | Constraint                                |
| ------------------------------------ | ------- | ----------------------------------------- |
| `role_split_provenance.written_by`   | enum    | `planner` \| `executor` \| `verifier`.    |
| `role_split_provenance.written_at`   | ISO8601 | When this specific entry was written.     |
| `role_split_provenance.session_id`   | string  | Free-form session identifier.             |

### 3.4 Full YAML template

```yaml
---
phase: 58-structural-enforcement-gates
ledger_schema: v1
generated_at: "2026-04-25T14:30:00Z"
generator_role: verifier
entries:
  - context_claim: "GATE-01 CI-based enforcement"
    disposition: implemented_this_phase
    load_bearing: true
    evidence_paths:
      - ".planning/phases/58-structural-enforcement-gates/58-02-SUMMARY.md"
      - ".github/workflows/ci.yml"
    role_split_provenance:
      written_by: executor
      written_at: "2026-04-22T10:15:00Z"
      session_id: "thread-abc123"
  - context_claim: "GATE-08d calibration tier (discuss-phase richer)"
    disposition: rejected_with_reason
    load_bearing: false
    narrowing_provenance:
      originating_claim: "CONTEXT §6 [governing:reasoned] calibration tier policy"
      rationale: "fork's model_profile already calibrates; adopting adds surface complexity"
      narrowing_decision: "keep existing model_profile; do not add GATE-08d tier"
    role_split_provenance:
      written_by: planner
      written_at: "2026-04-20T09:00:00Z"
      session_id: "thread-def456"
  - context_claim: "XRT-01 cross-runtime gate parity harness"
    disposition: explicitly_deferred
    load_bearing: true
    target_phase_if_deferred: "Phase 62"
    role_split_provenance:
      written_by: planner
      written_at: "2026-04-20T09:05:00Z"
      session_id: "thread-def456"
---
# Phase 58 Scope-Translation Ledger

Human-readable commentary on the entries above. Not authoritative — the YAML is.
```

---

## Section 4 — Load-bearing classification rule (authoritative)

A CONTEXT claim is `load_bearing: true` if **ANY** of the following clauses hold. This rule is authoritative; any cross-cutting requirement that speaks of "load-bearing claims" (GATE-09b resolution-or-defer, GATE-09c narrowing provenance, GATE-09d verification) resolves its scope against this rule.

1. Its type is `[decided:*]`, `[stipulated:*]`, or `[governing:*]`.
2. Its type is `[evidenced:*]` AND it appears in the `<constraints>` DC-table of the phase CONTEXT.md.
3. Its tag set includes `load-bearing` (author opt-in).
4. Its type is `[assumed:*]` AND another claim in the dependency table cites it as "Depends On".
5. Its type is `[projected]` AND it cross-references another phase (cross-phase projection is an implicit contract; see 58-RESEARCH.md R6 edge-case discussion).

The rule is **disjunctive**: ANY match marks the claim load-bearing. Clauses 1–3 are intrinsic to the claim; clauses 4–5 depend on the claim's position in the dependency graph or its cross-phase references.

Edge cases (from 58-RESEARCH.md R6, surfaced as `[assumed:reasoned]` — revisit if observed):

- `[open]` claims with GATE-09b resolution-or-defer obligation are load-bearing during plan-phase but may be demoted once resolved/deferred. The ledger entry captures this transition via successive writes (planner at plan-phase → executor/verifier at close) with different `role_split_provenance.written_by` values.
- Claims split across types (`[evidenced/assumed]`) are classified by the stronger type in clauses 1–5; if any component matches, the whole claim is load-bearing.

---

## Section 5 — Conditional required field logic

Entry-level required fields fire **conditionally** on `disposition`. The validator enforces these as `missing` when the disposition matches and the required field is absent or empty.

| Disposition                      | Additionally required                                                  | Notes                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `implemented_this_phase`         | `evidence_paths` (array, min 1 entry)                                  | Paths must be strings. No existence check at validation time; existence is the Plan 17 verifier's job.   |
| `explicitly_deferred`            | `target_phase_if_deferred` (string matching `^Phase \d+(\.\d+)?$`)     | Pattern restricts to `Phase 62` or `Phase 62.1` form. No range or list syntax — one target per entry.   |
| `rejected_with_reason`           | `narrowing_provenance.originating_claim` AND `narrowing_provenance.rationale` | `narrowing_provenance.narrowing_decision` is strongly recommended (validator emits WARN if missing).      |
| `left_open_blocking_planning`    | (none additional)                                                      | The disposition itself is the claim — no supplemental fields, but the entry must still carry the required fields from 3.2/3.3. |

**Why no field is required for `left_open_blocking_planning`.** The disposition signals that the claim itself is the blocker; no further evidence or target is asked for at GATE-09a level. GATE-09b downstream will ask the same question at next plan-phase and either resolve or re-defer the claim.

---

## Section 6 — Example well-formed `NN-LEDGER.md` frontmatter

This example validates green under `gsd-tools frontmatter validate <path> --schema ledger` (tested during Plan 04 Task 1 verification). Use this as a starting template for new ledger files.

```yaml
---
phase: 58-structural-enforcement-gates
ledger_schema: v1
generated_at: "2026-04-20T12:00:00Z"
generator_role: planner
entries:
  - context_claim: "GATE-01 CI-based enforcement"
    disposition: implemented_this_phase
    load_bearing: true
    evidence_paths:
      - ".github/workflows/ci.yml"
    role_split_provenance:
      written_by: planner
      written_at: "2026-04-20T12:00:00Z"
      session_id: "abc123"
---
# Phase 58 Scope-Translation Ledger
```

Three common invalid shapes (tested during Plan 04 Task 1 verification; validator returns `valid: false`):

1. **Missing disposition** — entry lacks `disposition`, `load_bearing`, `role_split_provenance.*`. Validator emits `missing: ["entries[0].disposition", ...]`.
2. **Enum violation** — `disposition: bogus` or `generator_role: bogus_role`. Validator emits `invalid: ["entries[0].disposition: must be one of implemented_this_phase|...", ...]`.
3. **Pattern violation** — `target_phase_if_deferred: "Phase foo"` on an `explicitly_deferred` entry. Validator emits `invalid: ["entries[1].target_phase_if_deferred: must match pattern ^Phase \\d+(\\.\\d+)?$", ...]`.

---

## Section 7 — Fire-event mechanism

GATE-09a fires when BOTH of the following hold:

1. `58-04-ledger-schema.md` exists with `ledger_schema: v1` registered (this artifact).
2. A `NN-LEDGER.md` file under any phase directory validates green against `gsd-tools frontmatter validate --schema ledger`.

Validator contract (CLI surface, stable across Plan 04 → Plan 17):

```
gsd-tools frontmatter validate <path-to-NN-LEDGER.md> --schema ledger
# → JSON {valid, missing, invalid, present, warnings, entry_count, schema}
```

- Exit status: always 0 (for scriptability; callers must consult `valid`). This matches the existing frontmatter validate contract for `plan`/`summary`/`verification`/`signal` schemas.
- `missing`: field paths absent or empty where required.
- `invalid`: enum/pattern/type violations.
- `warnings`: strongly-recommended-but-not-required gaps (empty entries array; missing `narrowing_decision` on `rejected_with_reason`).
- `entry_count`: number of entries in the array (0 is legal but warned).

Consumption by Plan 17 (GATE-09d verifier):

- Plan 17 will register the validator in CI (or wherever the GATE-09d verifier runs) and invoke `--schema ledger` against every `NN-LEDGER.md` discovered under `.planning/phases/*/`.
- Plan 17 may additionally check existence of every path listed in `evidence_paths` — that check is layered on top of this schema validator, not a replacement for it.
- Plan 17 may aggregate dispositions via the KB `ledger_entries` table (Plan 04 Task 2). The KB is a derived cache; authoritative state remains in the file.

Substrate shipped in Plan 04:

- `frontmatter.cjs` — validator.
- `kb.cjs` — additive `ledger_entries` table; `kb rebuild` populates from `NN-LEDGER.md` files under `.planning/phases/*/`.
- This spec — authoritative schema reference.

Plan 17 extends this substrate into a CI-invokable verifier with aggregation queries; it does not modify the schema, the validator CLI surface, or the KB table shape.
