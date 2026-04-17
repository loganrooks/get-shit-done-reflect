# C5 Facets-Substitute Trial

Generated: 2026-04-17T05:25:21.348Z

This trial scores the 20-session rubric sample by reading Claude facets directly from the existing measurement substrate. It remains a self-graded validity probe, not final epistemic closure.

## Summary

- Sessions in rubric sample: 20
- Sessions with matched facets coverage: 18/20
- Spearman rank correlation vs rubric composite: 0.9484
- High-score group mean (rubric >= 4.25): 4.379
- Low-score group mean (rubric <= 3.5): 2.333

## Method

Proxy score formula:

- base score 1.0
- +0.25 if underlying_goal present
- + outcome_weight (fully_achieved=1.5, mostly_achieved=1.0, partially_achieved=0.5, not_achieved=0)
- + helpfulness_weight (very_helpful=1.25, moderately_helpful=0.75, slightly_helpful=0.25, not_helpful=0)
- +0.25 if primary_success present
- +0.15 * likely_satisfied capped at 0.5
- -0.25 * dissatisfied capped at 1.0
- -0.2 * friction_total capped at 1.25
- +0.05 * distinct_goal_categories capped at 0.25
- clamp final score to 1..5

Coverage gaps remain part of the evidence. Sessions without matched facets are not dropped from the rubric sample; they are recorded as unavailable and count against the mechanism's practical coverage.

## Per-Session Results

| session_id | model | rubric_composite | facets_proxy_score | availability | outcome | helpfulness | friction_total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| aef131f1-0847-4065-bd26-fff86eb19e0c | claude-opus-4-6 | 3.25 | 2.35 | derived | partially_achieved | moderately_helpful | 1 |
| 2ca72494-0ebc-42f2-a651-5f856b41b333 | claude-opus-4-6 | 4 | n/a | not_available | n/a | n/a | 0 |
| 9af8f0ae-f2cb-4fd7-9e69-47c58190b6d4 | claude-opus-4-6 | 3.75 | 3.15 | derived | mostly_achieved | very_helpful | 4 |
| 483b2e97-7280-46b7-87f2-4e8f52cf6dd8 | claude-opus-4-6 | 4.25 | 4 | derived | fully_achieved | very_helpful | 1 |
| 486eb3f2-b54c-44f5-9124-38ff5e480995 | claude-opus-4-6 | 3.50 | 2.70 | derived | mostly_achieved | moderately_helpful | 2 |
| 64db3712-008b-43ed-affe-48c95b66058e | claude-opus-4-6 | 4.25 | 4.30 | derived | fully_achieved | very_helpful | 1 |
| 59dce141-003d-41c5-977e-54ea03b06739 | claude-opus-4-6 | 2.75 | 1.95 | derived | mostly_achieved | moderately_helpful | 5 |
| f4a7d632-7461-48c2-a97a-38fac1d5f42d | claude-opus-4-6 | 3.75 | 3.85 | derived | mostly_achieved | very_helpful | 1 |
| b84d9547-e126-4b16-a6e6-520866c70a2b | claude-sonnet-4-6 | 4 | 3.90 | derived | fully_achieved | very_helpful | 3 |
| 9f036b2d-f27f-4de4-9ce1-77758d6314a1 | claude-opus-4-6 | 3.75 | 3.20 | derived | mostly_achieved | very_helpful | 4 |
| 01db5837-235c-4ab1-8b7d-a7960fe0f9f0 | claude-opus-4-6 | 3 | n/a | not_available | n/a | n/a | 0 |
| fc19bbd2-4a49-4f81-81da-6be316e518e1 | claude-opus-4-6 | 3.75 | 3.80 | derived | mostly_achieved | very_helpful | 2 |
| 15436cda-f8c5-451f-8694-c238aa5829c5 | claude-opus-4-6 | 4 | 3.75 | derived | fully_achieved | very_helpful | 3 |
| 503ba6ce-c829-4922-a205-c0ff6aa5e493 | claude-opus-4-6 | 4.25 | 4.45 | derived | fully_achieved | very_helpful | 1 |
| f13b8b3f-73c3-4f59-9b0d-bf538b750ed0 | claude-opus-4-6 | 3.75 | 3.70 | derived | fully_achieved | very_helpful | 4 |
| f47387a9-927a-4327-aa88-2ffc9e8a86f7 | claude-opus-4-6 | 4.25 | 4.30 | derived | fully_achieved | very_helpful | 2 |
| 30f746db-d6c3-4814-8202-06f6a6ee5202 | claude-opus-4-6 | 4.25 | 4.40 | derived | fully_achieved | very_helpful | 3 |
| c9907162-ebd6-4245-8123-5bbbb6338ccb | claude-opus-4-6 | 4.50 | 4.75 | derived | fully_achieved | very_helpful | 1 |
| e352e795-4601-4646-95de-1301f1db6754 | claude-opus-4-6 | 4.25 | 4.45 | derived | fully_achieved | very_helpful | 0 |
| 0b797f82-88bf-4058-b1d3-33214b805efb | claude-opus-4-6 | 3.75 | 3.70 | derived | partially_achieved | very_helpful | 0 |
