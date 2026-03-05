---
id: SIG-260223-014
date: 2026-02-23
type: deviation
severity: notable
polarity: neutral
phase: 27
source: 27-01-SUMMARY.md
status: resolved
tags: [heuristics, natural-language, complexity-detection]
---

# Bare "and" in NL heuristics needs word-boundary matching

## Signal

The complexity gate specification listed "and then" as the multi-step conjunction indicator but missed bare "and". The description "update the tests and fix the linting errors" was incorrectly classified as trivial without bare "and" detection. Adding bare "and" required word-boundary matching (`\band\b`) to avoid false positives on words like "handler", "standard", "command".

## Impact

Without bare "and", multi-concern task descriptions that use simple conjunction pass the trivial check and execute inline, potentially producing incomplete results.

## Rule

When building natural-language heuristic classifiers:
1. Include bare conjunctions ("and", "or") alongside compound forms ("and then", "as well as")
2. Always use word-boundary matching for short words to avoid substring false positives
3. Test with examples containing the target word as a substring of another word

## Resolution

Fixed in Task 2 of Plan 27-01. Word-boundary matching added for "and".
