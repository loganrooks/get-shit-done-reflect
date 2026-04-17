# Spike 010 Responses — Human-Readable Index

Generated from `per_dispatch_metrics.csv` + the 36 session JSONLs.

Each prompt gets one file. Within each file, cells are ordered by `effort → model → replicate` so matched low/high and Sonnet/Opus pairs appear adjacent.

## Files

- [`A.md`](A.md) — 12 cells
- [`B-notools.md`](B-notools.md) — 12 cells
- [`B-tools.md`](B-tools.md) — 12 cells

## Reading guide

- **Prompt A (recall)**: quick browse — no thinking content anywhere, just one-line visible responses per cell. Confirms the emission-threshold gate (recall prompts produce zero thinking).
- **Prompt B-notools (deliberation, no tools)**: most useful for H1/H2/H3 qualitative comparison. Opus at low effort on this prompt emits zero thinking (cells 19/20/R_21) — structural finding.
- **Prompt B-tools (deliberation, tools permitted)**: similar shape to B-notools but with tools allowed. Neither model actually used tools (tool_call_count=0 everywhere) — so this tests permission-only effect.

## Quick H3 qualitative-compare sample (same prompt, same effort, different models)

To compare Sonnet vs Opus reasoning *content* (not just length):
- Open `B-notools.md`, find cells in order: 16 (sonnet high r1), 17 (sonnet high r2), 18 (sonnet high r3), then 22 (opus high r1), 23 (opus high r2), 24 (opus high r3). These six cells are matched-by-prompt-and-effort across models.
- Open `B-tools.md`, similarly cells 28-30 (sonnet) vs 34, R_35, R_36 (opus) at high effort.

## Summary table

| cell | model | prompt | effort | rep | thinkChars | visChars | outTok |
|-----:|:------|:-------|:-------|:----|-----------:|---------:|-------:|
| 10 | opus | A | high | 1 | 0 | 56 | 23 |
| 11 | opus | A | high | 2 | 0 | 56 | 23 |
| R_12 | opus | A | high | 3 | 0 | 56 | 23 |
| 4 | sonnet | A | high | 1 | 0 | 118 | 27 |
| 5 | sonnet | A | high | 2 | 0 | 118 | 27 |
| 6 | sonnet | A | high | 3 | 0 | 112 | 25 |
| 7 | opus | A | low | 1 | 0 | 51 | 20 |
| 8 | opus | A | low | 2 | 0 | 51 | 20 |
| R_9 | opus | A | low | 3 | 0 | 51 | 20 |
| 1 | sonnet | A | low | 1 | 0 | 118 | 27 |
| 2 | sonnet | A | low | 2 | 0 | 112 | 25 |
| 3 | sonnet | A | low | 3 | 0 | 118 | 27 |
| 22 | opus | B-notools | high | 1 | 3848 | 3892 | 7522 |
| 23 | opus | B-notools | high | 2 | 2713 | 2682 | 5596 |
| 24 | opus | B-notools | high | 3 | 1088 | 4166 | 5448 |
| 16 | sonnet | B-notools | high | 1 | 4662 | 6690 | 5926 |
| 17 | sonnet | B-notools | high | 2 | 7848 | 9343 | 9736 |
| 18 | sonnet | B-notools | high | 3 | 10976 | 9936 | 11030 |
| 19 | opus | B-notools | low | 1 | 0 | 3906 | 1285 |
| 20 | opus | B-notools | low | 2 | 0 | 4055 | 1309 |
| R_21 | opus | B-notools | low | 3 | 0 | 3952 | 1360 |
| 13 | sonnet | B-notools | low | 1 | 5123 | 10280 | 7632 |
| 14 | sonnet | B-notools | low | 2 | 260 | 9573 | 4088 |
| 15 | sonnet | B-notools | low | 3 | 228 | 10821 | 4560 |
| 34 | opus | B-tools | high | 1 | 5441 | 5752 | 9518 |
| R_35 | opus | B-tools | high | 2 | 3087 | 6301 | 7880 |
| R_36 | opus | B-tools | high | 3 | 2842 | 5154 | 7806 |
| 28 | sonnet | B-tools | high | 1 | 7077 | 9470 | 9684 |
| 29 | sonnet | B-tools | high | 2 | 8178 | 12200 | 11984 |
| 30 | sonnet | B-tools | high | 3 | 13141 | 11259 | 13938 |
| R_31 | opus | B-tools | low | 1 | 262 | 5770 | 3994 |
| 32 | opus | B-tools | low | 2 | 2255 | 5687 | 6124 |
| 33 | opus | B-tools | low | 3 | 2691 | 4716 | 5396 |
| 25 | sonnet | B-tools | low | 1 | 4052 | 11267 | 7574 |
| 26 | sonnet | B-tools | low | 2 | 2915 | 12103 | 7010 |
| 27 | sonnet | B-tools | low | 3 | 4304 | 12309 | 7338 |
