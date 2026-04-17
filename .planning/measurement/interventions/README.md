# Measurement Intervention Records

This directory is the file-first store for intervention-outcome records introduced in 57.7.

There is no SQL write path for these records. Query-time readers consume committed markdown files directly.

## Naming convention

- One record per file
- Filename shape: `YYYY-MM-DD-<slug>.md`

Example:

- `2026-04-17-gate-09-scope-translation-ledger.md`

## Interpretation-id shape

Verified against `get-shit-done/bin/lib/measurement/query.cjs`:

- `buildInterpretations()` currently returns a stable live-query interpretation id: `phase_57_5_live_registry_query`
- Diagnostic artifacts already carry stable ids such as `diag-2026-04-17-phase-57-vision-drop`

`interpretation_id` in an intervention record must match one of those exact strings.

Accepted forms in 57.7:

- live query interpretation ids, e.g. `phase_57_5_live_registry_query`
- diagnostic ids, e.g. `diag-2026-04-17-phase-57-vision-drop`

The reader matches by exact string equality. Do not invent a separate foreign-key scheme.

## Frontmatter schema

Required fields:

- `intervention_id`
- `interpretation_id`
- `intervention_description`
- `intervention_artifact`
- `predicted_outcome`
- `actual_outcome`
- `outcome_status`

Recommended fields:

- `evaluation_date`

### `intervention_id`

- string
- local unique identifier for the intervention record
- preferred shape: `int-YYYY-MM-DD-<slug>`

### `interpretation_id`

- string
- exact interpretation id or diagnostic id that this intervention acts on

### `intervention_description`

- string or folded markdown scalar
- brief description of what changed

### `intervention_artifact`

- mapping object
- expected keys when known:
  - `phase`
  - `plan`
  - `requirement`
  - `commit`

### `predicted_outcome`

- mapping object
- expected keys:
  - `summary`
  - `measurable_in_terms_of`
  - `evaluation_horizon`

### `actual_outcome`

- mapping object
- expected keys:
  - `summary`
  - `evidence_paths`

Use `null` or empty arrays when the outcome is still pending.

### `outcome_status`

Enum:

- `pending`
- `confirmed`
- `disconfirmed`
- `mixed`

No other value is canonical in 57.7. There is intentionally no `presumed_successful` branch.

### `evaluation_date`

- string date or `null`
- populate when the intervention has been materially re-evaluated

## Example

```markdown
---
intervention_id: int-2026-04-17-gate-09-scope-translation-ledger
interpretation_id: diag-2026-04-17-phase-57-vision-drop
intervention_description: >
  GATE-09 scope-translation ledger shipped as the remediation for the Phase 57
  scope-narrowing cascade.
intervention_artifact:
  phase: 58
  requirement: GATE-09
  commit: <commit-sha>
predicted_outcome:
  summary: >
    Later planning phases should stop silently dropping load-bearing CONTEXT
    claims.
  measurable_in_terms_of:
    - intervention_points on post-58 planning sessions
    - context-checker outputs
    - rerun of the vision-drop diagnostic
  evaluation_horizon: after_at_least_one_post_gate_09_phase_closes
actual_outcome:
  summary: null
  evidence_paths: []
outcome_status: pending
evaluation_date: null
---
```

## Authoring rules

- Keep intervention records honest to the available evidence
- If no closed post-intervention phase exists yet, use `pending`
- Prefer evidence paths pointing at committed diagnostics, summaries, or measurement artifacts
- Do not store speculative success claims in `actual_outcome`
