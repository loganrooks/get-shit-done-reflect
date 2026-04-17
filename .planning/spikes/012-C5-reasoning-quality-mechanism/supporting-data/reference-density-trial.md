# C5 Reference-Density Trial

Generated: 2026-04-17T05:25:21.349Z

This trial scans assistant text blocks for explicit project references and normalizes the match count by approximate token volume (chars / 4). It records counts only; matched text is discarded immediately after counting.

## Summary

- Sessions in rubric sample: 20
- Spearman rank correlation vs rubric composite: 0.4564
- High-score group mean (rubric >= 4.25): 12.698
- Low-score group mean (rubric <= 3.5): 5.921

## Match Families

- @.planning/
- @get-shit-done/
- phase 5x
- sig-YYYY-
- spk-YYYY-
- *.md

## Per-Session Results

| session_id | model | rubric_composite | reference_hits | approx_tokens | references_per_1k_tokens |
| --- | --- | --- | --- | --- | --- |
| aef131f1-0847-4065-bd26-fff86eb19e0c | claude-opus-4-6 | 3.25 | 1 | 1800.3 | 0.555 |
| 2ca72494-0ebc-42f2-a651-5f856b41b333 | claude-opus-4-6 | 4 | 17 | 3108 | 5.470 |
| 9af8f0ae-f2cb-4fd7-9e69-47c58190b6d4 | claude-opus-4-6 | 3.75 | 45 | 22379.3 | 2.011 |
| 483b2e97-7280-46b7-87f2-4e8f52cf6dd8 | claude-opus-4-6 | 4.25 | 15 | 1049.3 | 14.296 |
| 486eb3f2-b54c-44f5-9124-38ff5e480995 | claude-opus-4-6 | 3.50 | 31 | 2721.3 | 11.392 |
| 64db3712-008b-43ed-affe-48c95b66058e | claude-opus-4-6 | 4.25 | 37 | 1429.8 | 25.879 |
| 59dce141-003d-41c5-977e-54ea03b06739 | claude-opus-4-6 | 2.75 | 39 | 3322.5 | 11.738 |
| f4a7d632-7461-48c2-a97a-38fac1d5f42d | claude-opus-4-6 | 3.75 | 146 | 13649.5 | 10.696 |
| b84d9547-e126-4b16-a6e6-520866c70a2b | claude-sonnet-4-6 | 4 | 78 | 6036.5 | 12.921 |
| 9f036b2d-f27f-4de4-9ce1-77758d6314a1 | claude-opus-4-6 | 3.75 | 99 | 18849.5 | 5.252 |
| 01db5837-235c-4ab1-8b7d-a7960fe0f9f0 | claude-opus-4-6 | 3 | 0 | 137 | 0 |
| fc19bbd2-4a49-4f81-81da-6be316e518e1 | claude-opus-4-6 | 3.75 | 47 | 22354.5 | 2.102 |
| 15436cda-f8c5-451f-8694-c238aa5829c5 | claude-opus-4-6 | 4 | 20 | 2329.5 | 8.586 |
| 503ba6ce-c829-4922-a205-c0ff6aa5e493 | claude-opus-4-6 | 4.25 | 80 | 5224.8 | 15.312 |
| f13b8b3f-73c3-4f59-9b0d-bf538b750ed0 | claude-opus-4-6 | 3.75 | 53 | 6802.8 | 7.791 |
| f47387a9-927a-4327-aa88-2ffc9e8a86f7 | claude-opus-4-6 | 4.25 | 23 | 1993.3 | 11.539 |
| 30f746db-d6c3-4814-8202-06f6a6ee5202 | claude-opus-4-6 | 4.25 | 50 | 5785.8 | 8.642 |
| c9907162-ebd6-4245-8123-5bbbb6338ccb | claude-opus-4-6 | 4.50 | 5 | 4500.8 | 1.111 |
| e352e795-4601-4646-95de-1301f1db6754 | claude-opus-4-6 | 4.25 | 13 | 1073.8 | 12.107 |
| 0b797f82-88bf-4058-b1d3-33214b805efb | claude-opus-4-6 | 3.75 | 7 | 937.3 | 7.469 |
