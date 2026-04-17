---
status: complete
completed: 2026-04-17
spike: 012
question_id: Q2
verdict: CHOSEN: facets-substitute
grader_independence: self_graded
---

# Spike Decision: Reasoning-Quality Mechanism (C5)

**Completed:** 2026-04-17  
**Question:** Which MEAS-RUNTIME-11 candidate mechanism survives the C5 spike and ships as the reasoning-quality proxy in 57.7?  
**Verdict:** `CHOSEN: facets-substitute`  
**grader_independence:** `self_graded`

## Summary

`facets-substitute` is the only empirically evaluated candidate that clearly clears the spike's validity floor. Its Spearman rank correlation with the rubric composite is `0.9484` across the 18 rubric sessions with matched facet coverage. `reference-density` remains directionally useful, but its rank correlation is only `0.4564`, which is materially weaker and noisier on the same sample.

This does not elevate the mechanism into a truth-tracking quality metric. It only means `facets-substitute` is the strongest currently available proxy. The feature must still ship as `reasoning_quality_proxy_only`, with reliability tier `inferred`, and with explicit provenance that the spike was self-graded.

## Evidence

### Highest convergent validity

- `facets-substitute`: Spearman rank correlation `0.9484`; coverage `18/20`; high-rubric group mean `4.379`; low-rubric group mean `2.333`
- `reference-density`: Spearman rank correlation `0.4564`; coverage `20/20`; high-rubric group mean `12.698`; low-rubric group mean `5.921`

`facets-substitute` is the highest convergent-validity candidate by a wide margin.

### Best discriminant validity

The rubric sample is weak for formal discriminant testing because it contains 19 Opus sessions and only 1 Sonnet session. Within that limitation, `facets-substitute` still performed better in practice:

- It pushed clearly weaker sessions to the bottom of the scale: `59dce141...` scored `1.95`, `aef131f1...` scored `2.35`, `486eb3f2...` scored `2.70`
- It preserved strong sessions near the top: `c9907162...` scored `4.75`, `503ba6ce...` scored `4.45`, `e352e795...` scored `4.45`
- `reference-density` was noisier on the same sample; the strongest rubric session (`c9907162...`, rubric `4.50`) only scored `1.111` references per 1k tokens

So the best available discriminant evidence also favors `facets-substitute`, albeit with a weaker warrant than the convergent-validity result.

## Implementability Check

`facets-substitute` can ship without any new production dependency. Plan 09 can implement it in `extractors/derived.cjs` by reading `session.facets.record` directly from the loaded Claude dataset rather than chaining through `context.computedFeatures`.

That direct read matters because it avoids ordering fragility in a single-pass rebuild. The extractor can parallel the existing `facets_semantic_summary` logic instead of depending on it having already executed.

## Downstream Effect on Plan 09

Plan 09 ships `reasoning_quality_proxy` in `get-shit-done/bin/lib/measurement/extractors/derived.cjs`. The feature reads `session.facets.record` directly, emits the label `reasoning_quality_proxy_only`, uses `reliability_tier: inferred`, and carries provenance with `grader_independence: self_graded`.

The provenance note must explicitly say that this PASS verdict is subject to future independent-grader validation and does not constitute final epistemic closure for reasoning-quality claims.

## Alternatives Considered

### `reference-density`

This remained the strongest alternate. It is attractive because it requires no facet coverage and no new dependency. It lost because the empirical ranking was much noisier (`0.4564` vs `0.9484`) and it mis-ranked at least one of the strongest rubric sessions. A future phase could promote it if a larger corpus or a better pattern set materially improves its validity.

### `concept-diversity`

This was documented in DESIGN.md but not run empirically in 57.7. The plan allowed skipping it because the NLP-literature caution already marked it as noisy, and the two higher-priority candidates were sufficient to answer Q2. It remains a future-promotion candidate only if someone can justify a concrete formula and show it beats the current winner under independent grading.

### `LLM-as-judge`

This remains explicitly deferred, not rejected forever. It was not evaluated in 57.7 because it violates the phase's trial-before-formalize posture and would couple the measurement substrate to live per-session judging calls too early.

### `PLACEHOLDER-ONLY`

This fallback is not needed in 57.7 because at least one candidate exceeded the minimal validity floor (`rank-correlation > 0.3`). If future independent grading materially undercuts the facets result, placeholder-only remains a legitimate reversion path.

## Governing Guardrail Confirmation

- DC-4 / G-5: the chosen mechanism ships as `reasoning_quality_proxy_only`, tier `inferred`. Confirmed.
- Spike 010 Finding #6: the chosen mechanism is not summary-length-based. Confirmed.
- Grader-independence limitation: both DESIGN.md and this DECISION.md disclose `grader_independence: self_graded`. Confirmed.

## Qualification of the Verdict

This is a scoped 57.7 decision, not a timeless closure. The same agent implemented the scoring heuristics and judged the rubric, so the winner must be treated as "best current proxy under self-grading" rather than "validated measure of reasoning quality."

That qualification is load-bearing. Plan 09 must preserve it in extractor provenance instead of flattening the decision into a generic success story.

## Signal Candidates for Phase Close

- `sig-2026-04-17-reasoning-quality-self-graded-57-7` — meta-signal, pending future independent-grader validation

