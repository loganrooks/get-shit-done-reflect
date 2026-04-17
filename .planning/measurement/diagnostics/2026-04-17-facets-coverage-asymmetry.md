---
diagnostic_id: diag-2026-04-17-facets-coverage-asymmetry
subject: Does facets coverage asymmetry explain apparent agent-performance drift?
produced_by:
  - node get-shit-done/bin/gsd-tools.cjs measurement rebuild --raw
  - node get-shit-done/bin/gsd-tools.cjs measurement report signal_quality
  - node get-shit-done/bin/gsd-tools.cjs measurement report agent_performance
  - node get-shit-done/bin/gsd-tools.cjs measurement query "signal quality" --raw
  - node get-shit-done/bin/gsd-tools.cjs measurement query "agent performance" --raw
  - manual synthesis against E5.8 RESULTS.md Finding C
observed_at: 2026-04-17T00:37:14.006Z
measurement_store_rebuild_id: 14
extractor_registry_size_at_diagnosis: 26
loops_exercised:
  - signal_quality
  - agent_performance
---

# Diagnostic: Facets Coverage Asymmetry as Agent-Performance Confound

competing_readings: 3
stratification: required

## Summary

Run `14` confirms that facets coverage is not evenly distributed across the
current corpus. The default signal-quality report shows `large` sessions at
`31 with / 20 without` coverage (`60.8%`), `medium` at `2 / 5` (`28.6%`),
`small` at `3 / 52` (`5.5%`), and an `unknown` bucket at `25 / 5`
(`83.3%`). That distribution preserves E5.8 Finding C's direction: small
sessions are strongly underrepresented in facets-backed data. Any
agent-performance narrative built only on facets-covered sessions therefore
confounds session size with performance unless it stays stratified.

## Evidence

- **`facets_semantic_summary` (extractor: `derived.cjs`)**: the loop view holds
  `143` total rows, split `61` derived / `82` not_emitted across the corpus.
  The stratification object retains `size_bucket` and
  `facets_coverage_class` on every row, including `not_emitted` rows.
- **Coverage table from the run-14 raw query**:

| Size Bucket | Sessions With Facet | Sessions Without Facet | Coverage % |
| --- | ---: | ---: | ---: |
| large | 31 | 20 | 60.8% |
| medium | 2 | 5 | 28.6% |
| small | 3 | 52 | 5.5% |
| unknown | 25 | 5 | 83.3% |

- **with-facet samples**: session `09422ed4` is `large/with` and carries goal
  categories including `resume_project_context`,
  `execute_partial_workflow_steps`, `reframe_phase_scope`,
  `update_project_documentation`, and `verify_consistency_across_files`; session
  `15436cda` is `large/with` with `execute_phase`, `collect_signals`, and
  `release_flow`; session `1c4bcd36` is `large/with` and records
  `milestone_initialization` plus `phase_planning`.
- **without-facet samples**: sessions `01db5837`, `04200ac9`, `051040b0`, and
  `07949a87` are all `small/without`. The omitted slice is not randomly
  distributed across size buckets.
- **`derived_write_path_provenance` (extractor: `derived.cjs`)**: current
  session-meta artifacts point at `write_path: bulk` with
  `mtime_cluster_id: cluster_1776352006748_108` and `cluster_size: 108`,
  tying the present coverage snapshot to one `/insights` batch rather than a
  uniform per-session refresh path.
- **`insights_mass_rewrite_boundary` (extractor: `derived.cjs`)**: three batch
  clusters are visible. `cluster_1773000520211_14` (`2026-03-08`) is not stale;
  `cluster_1773612170898_15` (`2026-03-15`) and `cluster_1776352006748_108`
  (`2026-04-16`) are both flagged `stale_analysis_detected=true`.
- **`runtime_session_identity` / `claude_settings_at_start`**: runtime context
  still exists for uncovered sessions, but their facets-derived outcome and goal
  categories do not. The substrate can see who ran the session, not the missing
  evaluation layer.
- **`measurement report agent_performance`**: the report carries the literal
  caveat that marker density and summary length are effort tracking, not
  reasoning quality. Uncovered short sessions therefore cannot be backfilled
  with a bogus quality proxy.

## Competing Readings

### Reading A — Coverage Bias Explains Apparent Drift
**Source:** E5.8 `RESULTS.md` Finding C and the run-14 stratified
signal-quality report.
**Evidence weight:** strong.
**Claim:** Apparent agent-performance drift in facets-backed data is largely a
coverage artifact: the sessions most likely to lack facets are small sessions,
so aggregate comparisons tilt toward larger, richer interactions.

**Distinguishing feature:** size-bucket coverage should be substantially lower
for `small` than `large`.
**Computed status:** (computed — `small` coverage is `3/55 = 5.5%`, while
`large` coverage is `31/51 = 60.8%`)

### Reading B — Short Sessions Are Genuinely Lower Quality
**Source:** null hypothesis / anti-confound challenge.
**Evidence weight:** weak.
**Claim:** The short sessions missing facets are genuinely worse interactions,
and the facets layer is excluding them for quality-relevant reasons rather than
coverage bias.

**Distinguishing feature:** within the `small` bucket, compare outcome /
goal-quality distributions for covered versus uncovered sessions.
**Computed status:** (UNCOMPUTED — uncovered sessions have no facets-derived
outcome fields, and 57.6 does not provide a non-facets quality proxy for them)

### Reading C — Batch Staleness, Not Size, Drives the Bias
**Source:** `insights_mass_rewrite_boundary` and MEAS-DERIVED-04.
**Evidence weight:** medium.
**Claim:** Some of the apparent drift comes from mixing fresh and stale
`/insights` batches; sessions tied to stale batches carry older analysis, so
cross-batch aggregation compounds the size bias.

**Distinguishing feature:** batch membership should expose stale-analysis flags
on the cohorts being aggregated.
**Computed status:** (computed — the March 15 and April 16 clusters are both
flagged `stale_analysis_detected=true`)

## Anomaly Register

- `source_freshness`: `codex_sessions`, `knowledge_signals`, and
  `planning_config` are stale.
- `source_missing`: `insights_products` is missing / unknown.
- `feature_availability_gap`: `facets_semantic_summary:*` contributes `82`
  `not_emitted` gaps, which is the core asymmetry this diagnostic is about.
- `feature_availability_gap`: `automation_signal_yield` contributes `1`
  `not_emitted` gap.
- `feature_availability_gap`: `skip_reason_canonical:*` contributes `4`
  `not_emitted` gaps.

## Interpretation Revision Classification

**DEFERRED to Phase 57.7.** This artifact documents the confound and the
outstanding distinguishing features. It does not claim that any performance
warning or coverage intervention has already changed outcomes.

## Provenance

- Measurement store rebuild id: `14`
- Rebuild timestamp (`observed_at`): `2026-04-17T00:37:14.006Z`
- Extractor registry size at diagnosis: `26`
- Extractors consulted: `facets_semantic_summary`,
  `derived_write_path_provenance`, `insights_mass_rewrite_boundary`,
  `runtime_session_identity`, `claude_settings_at_start`
- Reports consulted: `measurement report signal_quality`,
  `measurement report agent_performance`
- Raw queries consulted: `measurement query "signal quality" --raw`,
  `measurement query "agent performance" --raw`
- External evidence: `e5.8-insights-experiment/RESULTS.md` Finding C
- Reading illumination map:
  - Reading A: `facets_semantic_summary` stratification table plus sample
    with/without rows
  - Reading B: `facets_semantic_summary` gap surface plus the
    agent-performance caveat
  - Reading C: `insights_mass_rewrite_boundary` and
    `derived_write_path_provenance`
- UNCOMPUTED in 57.6 / deferred to 57.7:
  - within-bucket quality comparison for uncovered small sessions
  - automated distinguishing-feature suggestion / low-coverage warnings
  - intervention-outcome tracking for whether future warnings reduce
    confounded readings

## Appendix: Live Report Output

````markdown
# Signal Quality Report

```
title: Signal Quality
observed_at: 2026-04-17T00:39:51.805Z
extractor_registry_size: 26
feature_row_count: 501
coverage.by_source_family.missing_sources: DERIVED=3, GSDR=0, RUNTIME=0 (total=3)
coverage.by_source_family.stale_sources: DERIVED=0, GSDR=2, RUNTIME=1 (total=3)
coverage.by_source_family.unknown_sources: DERIVED=1, GSDR=0, RUNTIME=0 (total=1)
reliability.overall_tier: artifact_derived
anomaly_count: 91
caveats:
  - Absence is data: facets coverage asymmetry remains visible instead of being averaged away (G-2).
```

## Feature Summary
| Feature | Runtime | Availability | Symmetry | Reliability | Rows |
| --- | --- | --- | --- | --- | --- |
| kb_signal_stats | project | derived | symmetric_available | artifact_derived | 1 |
| automation_signal_yield | project | not_emitted | symmetric_unavailable | direct_observation | 1 |
| session_meta_provenance | claude-code | derived | asymmetric_derived | artifact_derived | 143 |
| facets_semantic_summary | claude-code | derived, not_emitted | asymmetric_only | artifact_derived | 143 |
| insights_mass_rewrite_boundary | claude-code | derived | asymmetric_only | artifact_derived | 3 |
| skip_reason_canonical | project | exposed, not_emitted | asymmetric_only | direct_observation | 6 |

## Facets Coverage - Stratified by Size Bucket (DEFAULT)
| Size Bucket | Sessions With Facet | Sessions Without Facet |
| --- | ---: | ---: |
| large | 31 | 20 |
| medium | 2 | 5 |
| small | 3 | 52 |
| unknown | 25 | 5 |

## Skip Reason Canonicity
```
canonical | ######################## | 2
non_canonical |                          | 0
```

## Interpretations
| ID | Summary | Reliability | Competing Readings |
| --- | --- | --- | --- |
| phase_57_5_live_registry_query | The measurement query is operating in overview mode across runtime, derived, and GSDR extractor families. | artifact_derived | Observed asymmetry can reflect real runtime capability differences across Claude, Codex, and project-local GSDR sources. / Observed asymmetry can also reflect corpus incompleteness or sources that were never emitted for a given runtime or loop. |
````
