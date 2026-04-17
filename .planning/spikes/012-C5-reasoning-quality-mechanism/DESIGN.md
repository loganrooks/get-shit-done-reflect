---
spike: 012
status: planned
generated: 2026-04-17
type: exploratory
question_id: Q2
---

# Spike 012: Reasoning-Quality Mechanism (C5) Design

## 0. Research Question

"Which MEAS-RUNTIME-11 candidate mechanism (reference-density / concept-diversity / LLM-as-judge / facets substitute) survives the C5 spike and ships as the reasoning-quality proxy in 57.7?"

This spike answers Q2 for Phase 57.7. Exactly one mechanism is allowed to inform Plan 09, and whatever survives must still ship as a proxy rather than as validated truth.

## 1. Why This Matters

MEAS-RUNTIME-11 is still unresolved after 57.6. Spike 010 ruled out summary length as a reasoning-quality signal, so 57.7 needs a different mechanism before Plan 09 can land the `reasoning_quality_proxy` extractor. This spike therefore decides whether Plan 09 reuses existing derived facets, adds a new JSONL-scanning heuristic, or ships placeholder-only because no candidate cleared validity.

## 2. Candidates

### (a) Facets-substitute

Reuse 57.6 `facets_semantic_summary` output from `get-shit-done/bin/lib/measurement/extractors/derived.cjs` and wrap selected fields under a future `reasoning_quality_proxy:<session_id>` feature surface. The score prototype will use `underlying_goal`, `goal_categories`, `outcome`, `user_satisfaction_counts`, `claude_helpfulness`, `friction_counts`, `friction_detail`, and `primary_success`. Expected implementation size for Plan 09 is small because it mostly derives from already-computed features.

### (b) Reference-density

Prototype a new scorer over `session.parent_jsonl.records` that counts references to source files, deliberations, prior phases, and existing project artifacts per 1k tokens. The spike implementation is a throwaway Node scanner, not the production extractor. Expected Plan 09 implementation size is moderate and requires no new dependency.

### (c) Concept-diversity

Prototype a lexical-diversity heuristic such as type-token ratio over non-stop tokens in thinking summaries. This remains a plausible candidate, but it is known noisy per the plan's NLP-literature caution and is therefore lower priority than the zero-cost baseline and the direct reference-density alternative.

### (d) LLM-as-judge

LLM-as-judge is included only as a theoretical comparator. It is pre-emptively deferred and NOT shipped in 57.7 because CONTEXT.md already rejects a per-session judging call before the project has trialed that mechanism. It will not be evaluated empirically in this spike.

## 3. Validity Criteria

The spike uses a dual-axis validity test.

### Convergent validity

Does the candidate correlate with independent quality markers?

- Primary marker: a hand-graded 20-session rubric committed in `supporting-data/rubric-sample.md`
- Secondary marker: phase-outcome quality, especially whether the session led to committed-and-verified planning or execution artifacts

### Discriminant validity

Does the candidate distinguish sessions where independent evidence suggests different reasoning quality?

- Primary contrast: same-phase or near-same-problem Sonnet vs Opus sessions when present in the sample
- Fallback contrast: profile-level variation across stronger and weaker sessions in the same project period

## 4. Rubric Construction

The rubric sample uses 20 sessions from `/home/rookslog/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/`.

Sampling commitments:

- At least 5 sessions from the recent v1.20 timeframe
- At least 5 sessions from older pre-v1.20 work
- At least 5 planning-oriented sessions
- At least 5 execution-oriented sessions

Rubric axes:

1. `explicit_assumptions` - does the session expose operative assumptions or framing choices?
2. `source_grounding` - are claims tied to files, evidence, prior work, or concrete observations?
3. `constraint_awareness` - does the session respect workflow guardrails, scope limits, and project constraints?
4. `outcome_fidelity` - does the delivered output match the stated goal?

The committed rubric table records:

`{session_id, model, phase, era, mode, explicit_assumptions, source_grounding, constraint_awareness, outcome_fidelity, composite_score, grading_notes}`

### Grader-independence disclosure

This spike is self-graded. The same executor implementing the candidate heuristics is also judging the rubric sample. That is a known validity limitation, not a hidden one. PASS verdicts from this self-graded spike are subject to future independent-grader validation and are NOT final epistemic closure for MEAS-RUNTIME-11 quality claims.

## 5. Trial Plan

### Facets-substitute trial

- Read the selected sessions from `.planning/measurement/measurement.db` when `facets_semantic_summary` is available
- Compose a proxy score from the presence and polarity of the existing facet fields
- Map that score onto a 1-5 scale so it can be ranked directly against the rubric composite
- Treat missing facet coverage as a validity problem and document it explicitly

### Reference-density trial

- Scan assistant text blocks in the selected session JSONL files
- Count matches for:
  - `@\\.planning/`
  - `@get-shit-done/`
  - `[a-z0-9-]+\\.md`
  - `phase 5[0-9]`
  - `sig-[0-9]{4}`
  - `spk-[0-9]{4}`
- Normalize by an approximate token count using character-count-divided-by-4
- Record counts only; discard matched text immediately after counting

### Concept-diversity

Concept-diversity is optional in this spike. If time does not justify a third empirical run, the trial may be skipped and documented as skipped in `DECISION.md`, with the risk accepted explicitly.

### LLM-as-judge

LLM-as-judge remains theoretical only in this spike and is not run.

## 6. Acceptance Decision Rule

The decision rule is fixed before running the trials.

- Compute a composite validity score per candidate
- Weight convergent validity at `0.6`
- Weight discriminant validity at `0.4`
- Prefer the candidate with the highest composite validity score
- If no candidate exceeds a minimal convergent-validity threshold of `rank-correlation > 0.3`, declare `PLACEHOLDER-ONLY: no mechanism cleared validity`
- If two candidates are effectively tied, the simpler implementation wins

Exactly one winner is allowed.

## 7. Governing Guardrails

These guardrails are copied forward as binding constraints for the spike and for Plan 09.

- DC-4 / G-5: Whatever ships is labelled `reasoning_quality_proxy_only`, tier `inferred`. No exception.
- Spike 010 Finding #6: summary length is not a quality proxy even when model-stratified. It is a disqualified candidate and will not be reintroduced as a fifth option.
- Grader-independence limitation: PASS from self-grading does not equal validated truth.

## 8. Reversibility

The choice is low-reversibility once it ships in Plan 09, so the spike keeps all supporting-data committed for later re-evaluation. If this round only clears a weak proxy, the proxy still ships with explicit qualifications and alternatives remain documented for future promotion under stronger grading conditions.

## 9. Operational Notes

- `.gitignore` already covers `node_modules/`; verified before the trial run
- No new production dependency is allowed for the spike
- `LLM-as-judge` stays theoretical only
- `reasoning_quality_proxy_only` and the `inferred` tier remain mandatory even for the winning candidate
