# Task Spec: Audit Review + Deepening of Outcome Comparison

**Date:** 2026-04-09
**Agent:** claude-sonnet-4-6 (1M context, Explore agent)
**Launched by:** Claude Opus 4.6 during deliberation session
**Output target:** audit-review-and-deepening.md (same directory)
**Triggered by:** User critique that the outcome comparison audit may have been shallow — counting without reading, finding confirmatory evidence without questioning findings (verificationism)

---

## Prompt Given to Agent

You have TWO jobs:

### Job 1: Audit the audit

Read the outcome comparison audit at `.planning/audits/2026-04-09-discuss-phase-exploration-quality/outcome-comparison-audit.md`.

For each major finding, assess:
- Did the auditor actually READ the artifacts it claims to have examined, or did it summarize from metadata/counts?
- Did the auditor question its own findings, or did it find one interpretation and stop?
- Did the auditor follow leads (e.g., when it found 10x signal drop, did it investigate WHY, or just note it)?
- Are the "qualifications" genuine epistemic humility or just hedging language on shallow investigation?
- Did it commit verificationism — finding evidence that confirms a hypothesis without looking for disconfirming evidence?

Be specific. Quote passages from the audit that demonstrate shallow vs. thorough investigation.

### Job 2: Deepen the audit

Go deeper on the dimensions the original audit handled superficially. Specifically:

**A. Signal content comparison (not just counts):**
- Read actual signal files from Phases 52-54. They're in `.planning/knowledge/signals/get-shit-done-reflect/`. Filter by looking at the `phase:` frontmatter field or by date (Phase 52-54 signals are from late March 2026, roughly 2026-03-26 through 2026-03-30).
- Read actual signal files from Phases 55-57 (roughly 2026-04-08 through 2026-04-09).
- Compare: What kinds of observations were captured? Were they architectural insights, process gaps, positive patterns, scope issues? 
- Was signal collection even invoked in both eras? Check for evidence in SUMMARY.md files or STATE.md of when collect-signals was run.

**B. Research quality comparison (not just "questions resolved"):**
- Read the RESEARCH.md files for Phases 52, 53, 54 AND 55, 55.1, 55.2, 56 side by side.
- Compare: Were the questions asked in the rich-CONTEXT era more generative? Did they open up the solution space or just confirm existing assumptions?
- Were there questions the thin-era research SHOULD have asked but didn't, because the CONTEXT didn't surface them?
- Did the rich-era research produce architectural insights that changed the approach, vs. the thin-era research producing confirmations of already-decided approaches?

**C. Plan quality comparison (not just deviation counts):**
- Read PLAN.md files from both eras.
- Compare: Do the plans from the rich-CONTEXT era show more nuanced task decomposition? More awareness of edge cases? More explicit handling of assumptions?
- Do the thin-era plans show signs of mechanical task decomposition that just implements what CONTEXT.md decided, without questioning whether those decisions were well-grounded?

**D. The user's pre-work compensation hypothesis:**
- The user claims they personally produced richer pre-work (drift surveys, external audits) for the thin era BECAUSE they were worried the discuss-phase wasn't doing its job.
- Check: Is there evidence of this in the artifacts? Do the thin-era phases reference pre-work artifacts that were user-initiated rather than workflow-generated? Is there evidence that the rich-era discuss-phase produced its own depth without requiring user-initiated pre-work?

**E. Question every finding:**
For EACH finding you produce, explicitly ask: "What would disconfirm this interpretation?" and check for that disconfirming evidence. Do not stop at the first plausible interpretation.

## Methodological instructions

- DO NOT count things and report counts. READ things and report what you found in the content.
- DO NOT hedge with qualifications as a substitute for investigation. Investigate first, qualify only what genuinely remains uncertain after investigation.
- DO NOT commit verificationism. For every claim, look for disconfirming evidence FIRST.
- Follow leads. If something is surprising, investigate it rather than noting it and moving on.
- Be honest about what the evidence shows, even if it complicates the narrative.
- When you find the evidence is genuinely ambiguous, say so — but distinguish "I looked and it's ambiguous" from "I didn't look deep enough."

## Output

Write to: `.planning/audits/2026-04-09-discuss-phase-exploration-quality/audit-review-and-deepening.md`

Structure:
1. Audit of the audit (Job 1) — specific passages critiqued
2. Deepened findings per dimension (A through E)
3. Revised assessment — what do we actually know after going deeper?
4. What remains genuinely uncertain vs. what was just under-investigated?
