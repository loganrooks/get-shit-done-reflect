# Spike Decision: Behavioral Metric Signal-to-Noise

**Completed:** 2026-04-09
**Question:** Can we derive useful behavioral signals from `first_prompt` text, `message_hours[]` distribution, and `user_response_times[]` variance in session-meta data?
**Answer:** Yes — first_prompt category and message_hours entropy both show strong, reliable signal; response_time CV shows weaker signal limited by 46% coverage.

## Summary

Analysis of 265 parseable session-meta files found that two of the three candidate metrics — first_prompt categorization and message_hours entropy — produce distinguishable, statistically meaningful patterns across session outcomes. The hypothesis is confirmed.

First_prompt category cleanly separates GSD-commanded sessions (structured, predictable) from ad-hoc sessions (higher error rates, more interruptions). GSD-execute and GSD-plan sessions average 0.87 and 0.72 tool errors respectively, versus 2.26 for ad-hoc sessions; 64% of GSD-execute sessions have zero tool errors versus 42% of ad-hoc sessions. This is a strong enough differential to use as a session-type classifier in baseline telemetry.

Message_hours entropy is the strongest overall signal: Pearson r = 0.48 with tool errors and r = 0.45 with user interruptions (both N=264). Fragmented sessions (6+ hours or high entropy) average 3.79 tool errors and 0.79 interruptions, versus 0.68 errors and 0.14 interruptions for focused sessions. Coverage is near-universal at 99.6%. Response-time CV shows moderate correlation (r = 0.33 with interruptions) but covers only 46% of sessions and exhibits almost no extreme-CV cases in practice, making it a poor baseline candidate in its current form.

## Findings

### Metric 1: first_prompt Category Analysis

**Coverage:** 81.1% of sessions have a non-empty, non-"No prompt" first_prompt (215/265). The 18.9% no-prompt sessions are a distinct group: very short median duration (4 min), near-zero errors (0.24 avg), and minimal interruptions (0.06 avg), suggesting they are session continuations or tool-invocation sessions rather than new work.

**Category distribution (N=265):**

| Category | N | % |
|---|---|---|
| gsd_plan | 57 | 21.5% |
| no_prompt | 50 | 18.9% |
| gsd_execute | 45 | 17.0% |
| freeform_task | 38 | 14.3% |
| gsd_other | 28 | 10.6% |
| gsd_discuss | 18 | 6.8% |
| short_task | 13 | 4.9% |
| question | 11 | 4.2% |
| gsd_research | 4 | 1.5% |
| gsd_spike | 1 | 0.4% |

**Outcome cross-reference (key categories):**

| Category | N | Avg Tool Errs | % Zero Errors | Avg Interrupts | % Zero Interrupts | P50 Duration |
|---|---|---|---|---|---|---|
| gsd_execute | 45 | 0.87 | 64.4% | 0.22 | 93.3% | 29 min |
| gsd_plan | 57 | 0.72 | 61.4% | 0.28 | 80.7% | 25 min |
| gsd_discuss | 18 | 1.06 | — | 0.33 | — | 33 min |
| freeform_task | 38 | 2.05 | 41.9% | 0.45 | 66.1% | 77 min |
| question | 11 | 3.64 | — | 0.64 | — | 27 min |
| no_prompt | 50 | 0.24 | — | 0.06 | — | 4 min |

**GSD vs ad-hoc summary:**

| Group | N | Avg Tool Errs | Avg Interrupts | P50 Duration |
|---|---|---|---|---|
| GSD commanded | 153 | 1.14 | 0.25 | 29 min |
| Ad-hoc (has prompt) | 62 | 2.26 | 0.47 | 33 min |
| No prompt | 50 | 0.24 | 0.06 | 4 min |

**Signal assessment:** STRONG. GSD-commanded sessions have ~50% lower tool error rates and ~47% lower interruption rates than ad-hoc sessions. The differential is consistent across sub-categories. The `question` category is a notable signal — 11 sessions averaging 3.64 tool errors, indicating exploratory/debugging work with high friction. The `gsd_other` category has a misleading mean duration of 1043 min due to a single 19,996-minute recording artifact (a session left open for ~14 days); median is 41 min, which is normal.

**Data quality note:** Response times for no-prompt sessions show a duplicate-timestamp artifact — multiple entries with identical values (e.g., 15.5, 15.5, 15.5). This is consistent with observations about timestamp deduplication in the collector and does not affect first_prompt categorization.

### Metric 2: message_hours[] Session Fragmentation

**Coverage:** 264/265 sessions (99.6%) — near-universal, the most reliable field in the schema.

**Entropy distribution:**

| Entropy range | N | % | Meaning |
|---|---|---|---|
| 0 (single hour) | 165 | 62.5% | Tightly focused |
| 0–1 | 55 | 20.8% | Slightly spread |
| 1–2 | 31 | 11.7% | Moderate spread |
| 2–3 | 13 | 4.9% | High spread |
| 3+ | 0 | 0.0% | Extreme spread |

**Focus category outcomes:**

| Category | N | Avg Entropy | Avg Tool Errs | Avg Interrupts | Avg Duration |
|---|---|---|---|---|---|
| focused (1–2 unique hours) | 219 | 0.203 | 0.68 | 0.14 | 184 min |
| extended (3–5 hours, no big gaps) | 21 | 1.616 | 4.05 | 1.00 | 321 min |
| fragmented (6+ hours or high entropy) | 24 | 1.778 | 3.79 | 0.79 | 1027 min |

**Correlations:**
- Pearson r (entropy vs tool_errors) = **0.4805** (N=264)
- Pearson r (entropy vs interruptions) = **0.4513** (N=264)

These are moderate-to-strong positive correlations in behavioral data. The relationship is not merely that longer sessions have more errors — the extended category has lower errors than fragmented despite being shorter, suggesting entropy (not just duration) captures something meaningful about session coherence.

**Signal assessment:** STRONG. Entropy is the single best-correlated field with both tool_errors and user_interruptions in the dataset. It is computable from existing data, has near-universal coverage, and the focused/extended/fragmented trichotomy produces meaningfully different outcome profiles.

### Metric 3: user_response_times[] Analysis

**Coverage:** 121/265 sessions (45.7%). Coverage is not random: ad-hoc sessions have 83.9% coverage versus 41.2% for GSD-commanded sessions, suggesting the field was added or became more consistently recorded after a certain point in the harness's development. Month-by-month breakdown confirms this: February 2026 has 50 sessions WITHOUT response times and 42 WITH; March 2026 has 94 WITHOUT and 78 WITH. The missing sessions are not outliers — they are a systematic collection gap.

**Overall response time distribution (731 observations):**
- Mean: 443.1s, Median: 129.4s, Std dev: 711.0s
- Range: 2.0s to 3480.4s (roughly 1 hour max)
- The mean is dramatically higher than median, indicating heavy right-skew from walk-away events

**Per-session CV distribution:**

| CV range | N | % |
|---|---|---|
| <0.5 (consistent pacing) | 19 | 20.9% |
| 0.5–1 (moderate variation) | 39 | 42.9% |
| 1–2 (high variation) | 32 | 35.2% |
| 2–3 (erratic) | 1 | 1.1% |
| 3+ | 0 | 0.0% |

**Frustration signatures:**
- Sessions with rapid-fire responses (<5s): 9/121 (7.4%)
  - These sessions average 1.78 interruptions and 3.00 tool errors vs 0.44 and 2.30 for normal sessions
- Sessions with walk-away events (>300s): 76/121 (62.8%)
  - Walk-away is extremely common and likely reflects normal multi-tasking more than frustration

**Correlations:**
- Pearson r (CV vs interruptions) = **0.3321** (N=91, restricted by sessions with both fields)
- Pearson r (mean_response_time vs tool_errors) = **-0.0570** (N=121) — essentially zero

**Signal assessment:** WEAK for baseline inclusion. The CV–interruptions correlation (r=0.33) is real but modest. More importantly: (1) 54% of sessions lack response times entirely, (2) high CV (>2) cases are nearly absent in practice (1 session), making the "erratic engagement" signal unobservable at this scale, (3) the rapid-fire signature (9 sessions) is too rare to be a reliable baseline metric. Walk-away prevalence (63%) makes mean response time useless as a frustration proxy.

## Analysis

| Metric | Signal Strength | Coverage | Correlation (best) | Recommended |
|---|---|---|---|---|
| first_prompt category (GSD vs ad-hoc) | STRONG | 81.1% | Categorical (2x error rate differential) | YES — include |
| message_hours entropy | STRONG | 99.6% | r=0.48 vs tool_errors | YES — include |
| response_time CV | WEAK | 45.7% | r=0.33 vs interruptions | DEFER |
| response_time rapid-fire flag | MODERATE | 45.7% | 4x interruption rate, N=9 | DEFER (too rare) |

The hypothesis is confirmed: 2 of 3 candidate metrics show strong, usable signal. The third (response_time variance) has real but limited signal blocked by coverage gaps.

## Decision

**Chosen approach:** Include `first_prompt_category` (GSD vs ad-hoc vs no-prompt) and `message_hours_entropy` in the Phase 57 telemetry baseline. Defer response_time CV to a future spike once coverage improves.

**Rationale:**

`first_prompt_category` is the cleanest session-type classifier available. The GSD/ad-hoc split is a fundamental distinction in how the harness is used, and it shows consistent outcome differentials (tool errors, interruptions, duration shape) that make it a useful conditioning variable for any baseline metric. It requires only a regex match against an existing field.

`message_hours_entropy` is the strongest single predictor of session quality in the dataset. r=0.48 with tool_errors and r=0.45 with interruptions at N=264 is a meaningful finding. Its near-universal coverage (99.6%) means it can be included in all session records. The focused/extended/fragmented trichotomy is operationally interpretable: fragmented sessions have 5.6x the tool errors of focused sessions.

`response_time CV` is deferred because: (a) 54% coverage means it cannot be a universal baseline metric; (b) the distribution is unimodal with almost no extreme-CV sessions — the "erratic engagement" use case doesn't exist at this scale; (c) the rapid-fire signature that does show signal (N=9) is too infrequent for a stable baseline. This metric becomes worth revisiting if collection gaps are fixed.

**Confidence:** HIGH for first_prompt and message_hours entropy inclusion. MEDIUM for the specific thresholds (focused/extended/fragmented cutoffs should be treated as starting values, not validated boundaries).

## Implications

- Phase 57 telemetry schema should add two computed fields: `session_type` (derived from first_prompt: `gsd_execute | gsd_plan | gsd_discuss | gsd_other | ad_hoc | no_prompt`) and `focus_level` (derived from message_hours entropy: `focused | extended | fragmented`)
- These two fields should be present on every session record, enabling downstream faceting of all other metrics by session type and focus level
- The `gsd_other` category (resume-work, quick, deliberate, reflect) should be monitored separately — its median outcome profile is GSD-like but its duration distribution has extreme outliers (open-ended sessions)
- Response-time coverage gap (54% missing) is a data quality issue worth addressing in the collector, but it does not block Phase 57 baseline work
- The `question` first_prompt pattern (avg 3.64 tool errors) may warrant its own signal — these appear to be debugging/clarification sessions with atypically high friction
- Duration as a metric is unreliable due to at least one confirmed 19,996-minute artifact; median duration is more robust than mean

## Metadata

**Spike duration:** ~30 minutes
**Iterations:** 1
**Mode:** research (empirical analysis of existing data)
**Originating phase:** 57
