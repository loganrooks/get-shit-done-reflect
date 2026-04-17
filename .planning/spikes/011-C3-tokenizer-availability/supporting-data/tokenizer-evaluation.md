# C3 Tokenizer Evaluation

Generated: 2026-04-17T05:21:08.551Z

This evaluation uses the committed 50-record sample from `sample-sessions.json`. Each sample unit is an adjacent assistant-record pair from Claude JSONL: the first record carries a non-empty `thinking` block and the next record carries non-empty visible `text`, with matching model and output-token usage.

## Summary Statistics

| tokenizer | sample_count | median relative error | negative-delta rate | negative count | median predicted raw thinking tokens |
| --- | --- | --- | --- | --- | --- |
| js-tiktoken(cl100k_base) | 50 | 60.93% | 2.00% | 1 | 1016.50 |
| charDiv4 | 50 | 51.78% | 14.00% | 7 | 692.50 |

## Per-Model-Family Breakdown

| model | tokenizer | sample_count | median relative error | negative-delta rate | negative count | median predicted raw thinking tokens |
| --- | --- | --- | --- | --- | --- | --- |
| claude-opus-4-6 | js-tiktoken(cl100k_base) | 37 | 76.03% | 2.70% | 1 | 1041 |
| claude-opus-4-6 | charDiv4 | 37 | 70.59% | 2.70% | 1 | 968 |
| claude-sonnet-4-6 | js-tiktoken(cl100k_base) | 13 | 26.86% | 0.00% | 0 | 924 |
| claude-sonnet-4-6 | charDiv4 | 13 | 11.71% | 46.15% | 6 | 124 |

## Per-Record Results

| record_id | model | output_tokens | tok_visible_jsTiktoken | tok_thinking_jsTiktoken | predicted_raw_jsTiktoken | is_negative_jsTiktoken | tok_visible_charDiv4 | tok_thinking_charDiv4 | predicted_raw_charDiv4 | is_negative_charDiv4 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1288fda7-64c3-471a-b6e4-23e0f2dd987d:3 | claude-sonnet-4-6 | 2280 | 2017 | 40 | 223 | false | 2706 | 57 | -483 | true |
| 2e7c0ed9-67ba-4232-89f2-601401292cae:4 | claude-sonnet-4-6 | 5657 | 1935 | 1777 | 1945 | false | 2596 | 2400 | 661 | false |
| 2e914a70-e9a5-4496-a8b9-dd6b876c9bd8:5 | claude-sonnet-4-6 | 3669 | 2296 | 743 | 630 | false | 3078 | 1076 | -485 | true |
| 476825ea-02f0-4314-bf06-7a6aabc1a597:5 | claude-sonnet-4-6 | 3505 | 2303 | 546 | 656 | false | 3026 | 729 | -250 | true |
| 76c3ed82-291a-495a-abcd-209a62a8a230:3 | claude-sonnet-4-6 | 4868 | 1761 | 1490 | 1617 | false | 2336 | 1962 | 570 | false |
| 8366460a-6814-4a24-b467-32cc9d384b42:3 | claude-sonnet-4-6 | 3816 | 1964 | 929 | 923 | false | 2570 | 1281 | -35 | true |
| 88ae1496-eb9a-42cd-8840-ed8011622cbb:5 | claude-sonnet-4-6 | 4842 | 1788 | 1256 | 1798 | false | 2368 | 1770 | 704 | false |
| 8a448392-7bf0-45f1-83b2-d1d92d8a81d9:5 | claude-sonnet-4-6 | 6969 | 2140 | 2265 | 2564 | false | 2815 | 3286 | 868 | false |
| b6e1f432-43f7-4bae-b82d-be9aa0960012:3 | claude-sonnet-4-6 | 2963 | 1289 | 878 | 796 | false | 1673 | 1166 | 124 | false |
| cde236dd-a148-4fee-b2ef-a85c1be572df:5 | claude-sonnet-4-6 | 3787 | 2162 | 701 | 924 | false | 2817 | 1013 | -43 | true |
| cf0cdcc8-0d79-40df-bc41-05282f605078:5 | claude-sonnet-4-6 | 5992 | 2414 | 1501 | 2077 | false | 3050 | 2045 | 897 | false |
| e50122a4-63ee-4fd2-859c-adebb49d5888:3 | claude-sonnet-4-6 | 2044 | 1809 | 44 | 191 | false | 2394 | 65 | -415 | true |
| f2c3878a-ab11-4b44-a3f0-d781d8111bff:3 | claude-sonnet-4-6 | 5515 | 1892 | 1990 | 1633 | false | 2484 | 2744 | 287 | false |
| 01db5837-235c-4ab1-8b7d-a7960fe0f9f0:5 | claude-opus-4-6 | 25 | 6 | 131 | -112 | true | 8 | 139 | -122 | true |
| 0b797f82-88bf-4058-b1d3-33214b805efb:17 | claude-opus-4-6 | 97 | 27 | 27 | 43 | false | 25 | 31 | 41 | false |
| 0b797f82-88bf-4058-b1d3-33214b805efb:35 | claude-opus-4-6 | 710 | 240 | 207 | 263 | false | 223 | 235 | 252 | false |
| 0b797f82-88bf-4058-b1d3-33214b805efb:41 | claude-opus-4-6 | 1258 | 36 | 181 | 1041 | false | 43 | 220 | 995 | false |
| 0b797f82-88bf-4058-b1d3-33214b805efb:158 | claude-opus-4-6 | 2059 | 41 | 441 | 1577 | false | 35 | 594 | 1430 | false |
| 0b797f82-88bf-4058-b1d3-33214b805efb:172 | claude-opus-4-6 | 341 | 28 | 54 | 259 | false | 29 | 69 | 243 | false |
| 0b797f82-88bf-4058-b1d3-33214b805efb:215 | claude-opus-4-6 | 354 | 164 | 21 | 169 | false | 162 | 28 | 164 | false |
| 0faab2d4-4fe1-4bf9-b7dc-45f8e1c1c28f:5 | claude-opus-4-6 | 2698 | 960 | 480 | 1258 | false | 1179 | 673 | 846 | false |
| 12591a6e-97c9-4493-be66-f9d4e5028697:3 | claude-opus-4-6 | 2724 | 875 | 183 | 1666 | false | 1042 | 272 | 1410 | false |
| 1981645c-de8d-40bc-8337-014ddfc82c04:5 | claude-opus-4-6 | 4759 | 1196 | 1004 | 2559 | false | 1438 | 1360 | 1961 | false |
| 304b5650-ac1a-4b51-83c2-4862a8b6f555:5 | claude-opus-4-6 | 3940 | 1313 | 557 | 2070 | false | 1576 | 772 | 1592 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:26 | claude-opus-4-6 | 1761 | 328 | 441 | 992 | false | 305 | 544 | 912 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:58 | claude-opus-4-6 | 3325 | 68 | 729 | 2528 | false | 74 | 904 | 2347 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:66 | claude-opus-4-6 | 938 | 349 | 79 | 510 | false | 366 | 89 | 483 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:77 | claude-opus-4-6 | 2608 | 25 | 119 | 2464 | false | 33 | 149 | 2426 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:92 | claude-opus-4-6 | 517 | 42 | 75 | 400 | false | 40 | 96 | 381 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:114 | claude-opus-4-6 | 911 | 11 | 207 | 693 | false | 13 | 244 | 654 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:151 | claude-opus-4-6 | 873 | 252 | 146 | 475 | false | 253 | 171 | 449 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:210 | claude-opus-4-6 | 1055 | 16 | 54 | 985 | false | 20 | 67 | 968 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:228 | claude-opus-4-6 | 1823 | 13 | 55 | 1755 | false | 14 | 70 | 1739 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:253 | claude-opus-4-6 | 1310 | 298 | 158 | 854 | false | 286 | 175 | 849 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:264 | claude-opus-4-6 | 3460 | 37 | 38 | 3385 | false | 33 | 46 | 3381 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:282 | claude-opus-4-6 | 533 | 25 | 142 | 366 | false | 23 | 186 | 324 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:295 | claude-opus-4-6 | 4354 | 290 | 589 | 3475 | false | 282 | 762 | 3310 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:301 | claude-opus-4-6 | 6094 | 9 | 228 | 5857 | false | 10 | 329 | 5755 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:339 | claude-opus-4-6 | 1128 | 443 | 134 | 551 | false | 419 | 172 | 537 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:346 | claude-opus-4-6 | 1737 | 30 | 257 | 1450 | false | 44 | 327 | 1366 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:354 | claude-opus-4-6 | 2476 | 535 | 423 | 1518 | false | 626 | 574 | 1276 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:363 | claude-opus-4-6 | 5265 | 18 | 230 | 5017 | false | 23 | 304 | 4938 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:372 | claude-opus-4-6 | 1384 | 35 | 174 | 1175 | false | 43 | 217 | 1124 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:378 | claude-opus-4-6 | 5742 | 18 | 227 | 5497 | false | 24 | 330 | 5388 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:385 | claude-opus-4-6 | 259 | 13 | 34 | 212 | false | 17 | 42 | 200 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:395 | claude-opus-4-6 | 858 | 511 | 28 | 319 | false | 518 | 34 | 306 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:464 | claude-opus-4-6 | 582 | 13 | 34 | 535 | false | 14 | 45 | 523 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:484 | claude-opus-4-6 | 983 | 29 | 208 | 746 | false | 34 | 268 | 681 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:501 | claude-opus-4-6 | 2696 | 260 | 225 | 2211 | false | 253 | 269 | 2174 | false |
| 30f746db-d6c3-4814-8202-06f6a6ee5202:519 | claude-opus-4-6 | 2969 | 623 | 544 | 1802 | false | 606 | 655 | 1708 | false |
