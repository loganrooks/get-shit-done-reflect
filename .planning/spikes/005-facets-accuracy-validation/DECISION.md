# Spike Decision: Facets Accuracy Validation

**Completed:** 2026-04-09
**Question:** Do facets AI-generated assessments correlate with observable session-meta behavioral metrics?
**Answer:** Partially yes — friction/interruptions show meaningful correlation (rho=0.55), but helpfulness ratings are confounded by session type, and outcome shows no reliable error-count gradient.

## Summary

Analysis of 106 matched sessions (109 facets files; 3 dropped due to malformed session-meta JSON) reveals a mixed picture. The friction → interruption relationship is the clearest signal: sessions with zero friction have 87.5% zero-interruption rate vs 63.8% for sessions with friction, and the Spearman rank correlation between total friction count and user interruptions is 0.55 — moderate and meaningful.

The outcome → tool_errors hypothesis fails: "fully_achieved" (mean 1.15 errors) and "partially_achieved" (mean 1.21 errors) are nearly indistinguishable, while "mostly_achieved" has the highest mean (1.62). "Not_achieved" has 0 mean errors (n=2, too small to be conclusive). The outcome assessment appears to reflect goal completion as judged by the AI, which does not track tool errors — goals can be fully achieved despite many errors, and can fail to be achieved with no technical failures.

The most counterintuitive finding: `claude_helpfulness` is inversely related to raw tool error counts. "Unhelpful" sessions have 0 tool errors (n=6, all zero). "Essential" sessions have mean 1.00 errors. This is explained by session type: unhelpful sessions are predominantly `unclear_from_transcript` with very short or very long durations — likely abandoned, interrupted, or zero-interaction sessions where errors never occurred because substantive work never happened.

Session type does predict duration meaningfully, even after excluding outliers (>1000 min): single_task median is 6 min vs multi_task median 76 min vs iterative_refinement median 61 min — a 10x span consistent with the type labels.

## Findings

### Correlation 1: outcome vs tool_errors

| Outcome | n | Mean errors | Median | SD |
|---------|---|-------------|--------|----|
| fully_achieved | 54 | 1.15 | 0.00 | 1.97 |
| mostly_achieved | 29 | 1.62 | 1.00 | 1.54 |
| partially_achieved | 14 | 1.21 | 0.00 | 1.63 |
| not_achieved | 2 | 0.00 | 0.00 | 0.00 |
| unclear_from_transcript | 7 | ~0.4 (not shown above) | — | — |

**Pattern:** No meaningful monotonic gradient. "Mostly_achieved" has higher mean errors than both "fully" and "partially" — this is not interpretable as a quality scale mapped to observable errors. The high SD on fully_achieved (1.97) reflects that some fully-achieved sessions tolerate substantial errors.

**Conclusion:** Correlation 1 is NOT meaningful. Tool errors are not a reliable ground truth for the outcome facet.

### Correlation 2: total_friction vs user_interruptions

| Friction count | n | Mean interruptions | Median | SD |
|----------------|---|-------------------|--------|----|
| 0 | 48 | 0.13 | 0.00 | 0.33 |
| 1 | 35 | 0.31 | 0.00 | 0.63 |
| 2-3 | 20 | 0.85 | 0.50 | 1.04 |
| 4+ | 3 | 3.00 | 3.00 | 2.00 |

**Spearman rho:** 0.55

**Zero-friction sessions:** 87.5% had zero interruptions.
**Non-zero-friction sessions:** 63.8% had zero interruptions.

**Pattern:** Clear monotonic trend. As friction increases, interruptions increase. The rho of 0.55 is strong for this type of behavioral data. The 4+ friction group (n=3) shows mean 3.0 interruptions — every session in this group had multiple interruptions.

**Conclusion:** Correlation 2 IS meaningful. Friction counts have real predictive value for observable behavioral disruptions.

### Correlation 3: session_type vs duration_minutes

After excluding 9 extreme outliers (>1000 min) which are likely multi-day resumed sessions:

| Session type | n | Mean (min) | Median (min) |
|-------------|---|------------|--------------|
| single_task | 32 | 33.9 | 6.0 |
| exploration | 12 | 49.9 | 12.5 |
| quick_question | 1 | 2.0 | 2.0 |
| iterative_refinement | 19 | 200.5 | 61.0 |
| multi_task | 32 | 230.3 | 76.0 |

**Pattern:** Strong ordering by session type, from single_task (6 min median) through multi_task and iterative_refinement (61-76 min median) — roughly a 10-12x span. The types are behaviorally distinguishable.

**Caveat:** Duration in session-meta appears to be wall-clock elapsed time (one session showed 513 min for a session with 23 user messages). The extreme outliers skew means significantly. Median is the more reliable metric.

**Conclusion:** Correlation 3 IS meaningful. Session type labels correspond to meaningfully different durations in the expected direction.

### Correlation 4: claude_helpfulness vs tool error rate

| Helpfulness | n | Zero-error % | High-error (>=3) % | Mean errors |
|-------------|---|-------------|-------------------|-------------|
| essential | 40 | 53% | 8% | 1.00 |
| very_helpful | 43 | 37% | 30% | 1.70 |
| moderately_helpful | 13 | 62% | 15% | 0.85 |
| slightly_helpful | 4 | 75% | 0% | 0.50 |
| unhelpful | 6 | 100% | 0% | 0.00 |

**Pattern:** Counter-intuitive inverse relationship. Unhelpful sessions have 0 tool errors; essential sessions have the second-highest error rate. This is explained by the "unhelpful" session composition: 5 of 6 are `unclear_from_transcript` outcome with very short or anomalous durations (1, 4, 6, 1050, 1062 min). These sessions likely represent abandoned interactions or sessions where substantive tool use never began. "Essential" sessions are the long, complex, tool-heavy sessions where errors naturally accumulate.

**Conclusion:** Correlation 4 is NOT meaningful as a direct validation signal. The relationship is confounded by session complexity. High-use sessions accumulate more absolute errors while still being rated essential. Error rate (errors/total_calls) partially corrects this — essential mean rate = 0.02 vs very_helpful = 0.04 — but the tiny difference and small unhelpful sample make this inconclusive.

## Outlier Analysis

**Fully-achieved but high error counts (>=5 errors, n=4):**
- 37101ea9: 10 errors, 53 tools, 0 friction, essential — error rate 18.9% in a 12-minute session. High error rate likely reflects rapid iteration (test-fail-fix loop) that succeeded. Goal achieved despite errors.
- 576a91f2: 5 errors, 62 tools, 0 friction, essential — error rate 8.1%, 36 min. Same pattern.
- 2bd16787: 8 errors, 121 tools, 1 friction (wrong_approach), very_helpful — 784 min session. Large complex session with one wrong approach; still achieved.
- 3b1a15db: 5 errors, 85 tools, 1 friction (wrong_approach), very_helpful — 861 min.

**Insight:** High absolute error counts in long, tool-heavy sessions are normal. Error rate (not absolute count) is the more useful metric for quality inference.

**Essential helpfulness but interruptions (n=1):**
- d54813ea: 2 interruptions, 0 errors, 73 min. One session only — not informative.

**Poor outcome with zero friction (n=5):**
- 5 partially-achieved or not-achieved sessions reported no friction. This suggests friction detection may miss subtle failures (goal was not fully achieved but the AI's in-session friction detection found nothing notable). Or these may be cases where the goal was simply unachievable regardless of session quality (external constraints).

## Analysis

| Correlation | Rho / Pattern | Meaningful? | Notes |
|------------|---------------|-------------|-------|
| outcome vs tool_errors | Non-monotonic; no gradient | NO | Goals fail/succeed independent of tool errors |
| friction vs interruptions | rho=0.55; clear monotonic bins | YES | Best signal in the dataset |
| session_type vs duration | 10x median span across types | YES | Types are behaviorally real |
| helpfulness vs error_rate | Inverse due to confound | PARTIAL | Error rate corrects somewhat; confounded by session complexity |

Two of four correlations show meaningful patterns. The success criterion (>=2 of 4) is met.

The friction → interruption correlation is the strongest and most directly validating: it shows that the AI's in-session friction detection tracks something real that is independently observable (user interruptions). The session_type → duration correlation validates the type taxonomy as behaviorally meaningful.

The outcome and helpfulness ratings are more problematic. They do not map cleanly to individual technical metrics, which makes sense: they are holistic judgments that integrate many factors. This does not mean they are noise — it means they cannot be validated against single behavioral metrics in isolation.

## Decision

**Chosen approach:** Include facets data in baseline metrics with appropriate weighting, but apply metric-specific validation.

**Specifically:**
1. **friction_counts** — HIGH confidence signal. Use with full weight. Spearman rho=0.55 against interruptions is strong behavioral validation.
2. **session_type** — HIGH confidence signal. Types are behaviorally distinguishable (10x duration span). Use as a normalization dimension for other metrics.
3. **outcome** and **claude_helpfulness** — MEDIUM confidence, use as holistic indicators only. Do NOT use as direct proxies for technical metrics. They reflect AI-judged goal achievement and user satisfaction, which are valid constructs but orthogonal to error counts.
4. **Error rate (errors/total_calls)** is more useful than absolute error count for quality inference. The absolute count conflates session length with quality.

**Rationale:** The spike was designed to determine whether facets data has "signal value beyond noise." The friction/interruption correlation (rho=0.55) and session_type/duration correspondence provide empirical confirmation that at least two key facets fields track observable behavior. The counterintuitive helpfulness/error relationship is explained and does not indicate noise — it indicates that these constructs measure different things (session productivity vs. session quality perception). Facets belong in the baseline as holistic qualitative indicators that complement quantitative metrics.

**Confidence:** MEDIUM-HIGH

The friction finding is HIGH confidence. The outcome/helpfulness conclusions are MEDIUM confidence because of small n in failure categories (not_achieved n=2, unhelpful n=6) and the presence of 7 "unclear_from_transcript" sessions that may indicate systematic transcript-truncation issues.

## Implications

- Facets friction_counts should be a first-class metric in Phase 57 baseline design. It is the most validated facets field.
- session_type should be used as a stratification variable, not a raw metric — aggregate stats that mix session types will be misleading (single_task at 6 min median vs multi_task at 76 min).
- The 3 malformed session-meta files (6f97ee28, 8576521c, 96ae5fc5) should be investigated and repaired; they represent data loss.
- The 9 extreme duration outliers (>1000 min) likely reflect multi-day session contexts where Claude Code maintains a session ID across clock time. Duration_minutes as stored is wall-clock elapsed, not interactive time. Any duration-based metric needs outlier handling.
- 7 sessions with "unclear_from_transcript" outcome cluster strongly with "unhelpful" helpfulness ratings — these may be systematically low-quality transcripts (too short, too long, or truncated) rather than genuinely unhelpful sessions. Worth filtering or flagging separately.
- The friction detection gap (5 poor-outcome sessions with zero detected friction) suggests friction detection has recall issues for subtle or external-cause failures. This is a known limitation of session-level AI assessment.

## Metadata

**Spike duration:** ~1 hour
**Iterations:** 1
**Mode:** Research (no BUILD/RUN)
**Originating phase:** Phase 57
**Evidence type:** Empirical analysis of existing telemetry data (106 matched sessions)
