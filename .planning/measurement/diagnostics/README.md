# Measurement Diagnostics

This directory holds interpretation-object artifacts produced by running the
measurement substrate against real observed patterns. Each diagnostic is a
committed markdown artifact, not ephemeral shell output, so later phases can
inspect the exact reading space that was available at diagnosis time.

## Artifact Schema

Every diagnostic is a markdown file with frontmatter plus these required body
sections.

### Frontmatter

- `diagnostic_id`: `diag-YYYY-MM-DD-<slug>`
- `subject`: the observed pattern under diagnosis
- `produced_by`: rebuild/query/report commands plus manual synthesis steps
- `observed_at`: measurement rebuild timestamp used as the diagnostic snapshot
- `measurement_store_rebuild_id`: rebuild run id from `measurement rebuild --raw`
- `extractor_registry_size_at_diagnosis`: registry count at that rebuild
- `loops_exercised`: loop keys used in the artifact

### Body Sections

1. `## Summary` - one paragraph framing the pattern
2. `## Evidence` - extractor-backed evidence with actual values
3. `## Competing Readings` - at least 3 readings, each with source, evidence
   weight, claim, distinguishing feature, and computed status
4. `## Anomaly Register` - query/report anomalies, even when the register is
   empty
5. `## Interpretation Revision Classification` - explicit status, with 57.6
   diagnostics deferring Lakatos classification to 57.7
6. `## Provenance` - rebuild id, registry size, extractors consulted,
   report/query commands, and uncomputed gaps

## Authoring Rules

- Keep the diagnostic honest to the live substrate. If a draft reading is not
  supported, mark it `UNCOMPUTED` or `NOT_OBSERVED`.
- Preserve asymmetry, freshness gaps, and unknown buckets instead of flattening
  them away.
- Append verbatim `measurement report` output so the artifact is readable
  without a local rebuild.
- Do not treat behavioral improvement as a success criterion in 57.6.
  Intervention-outcome tracking lands in 57.7.

## Index of Diagnostics

| Diagnostic | Subject | Primary Loops | Status |
| --- | --- | --- | --- |
| `2026-04-17-phase-57-vision-drop.md` | Phase 57 vision-drop cascade | `intervention_lifecycle`, `pipeline_integrity` | committed (57.6-07) |
| `2026-04-17-facets-coverage-asymmetry.md` | Facets coverage asymmetry as agent-performance confound | `signal_quality`, `agent_performance` | committed (57.6-07) |

## Non-Goals

- Not a dashboard
- Not behavioral-change measurement
- Not success theater
