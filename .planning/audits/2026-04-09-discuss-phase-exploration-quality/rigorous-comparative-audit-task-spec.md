# Task Spec: Rigorous Comparative Audit — CONTEXT.md Quality and Downstream Effects

**Date:** 2026-04-09
**Agent:** claude-sonnet-4-6 (1M context)
**Output target:** rigorous-comparative-audit.md (same directory)
**Predecessor audits:** outcome-comparison-audit.md, audit-review-and-deepening.md (both in this directory — read them to understand what went wrong)

---

## Why This Audit Exists

Three prior audits of this question produced findings that failed under scrutiny:
- The first audit counted signals without reading them, measured plan quality by technical detail rather than decision quality, and treated verification pass rates as evidence of plan quality when they can't distinguish a good plan from a bad one perfectly executed.
- The second audit claimed pre-work artifacts were "normal automated workflow products" without checking whether the workflows it attributed them to actually exist.
- The second audit claimed "Phase 56 planner corrected CONTEXT.md" without reading the actual CONTEXT.md — which had the lifecycle question as a working assumption with "Researcher must verify," not a locked decision.

These failures share a pattern: **asserting claims that sound plausible without verifying them against the actual artifacts.** This audit must not repeat that pattern.

---

## Epistemic Ground Rules

**YOU MUST FOLLOW THESE. They are not suggestions.**

### 1. Every factual claim must cite a specific file, line number, and quote the relevant passage.
Bad: "The plan corrected CONTEXT.md"
Good: "Plan 56-01 Task 1 (line 74) says 'Update KB-01 in REQUIREMENTS.md to replace the incorrect lifecycle states.' However, 56-CONTEXT.md line 24 says 'Working assumption: Phase 31's state model is the correct one... Researcher must verify this.' This was NOT a locked decision — it was a working assumption with research directive. The plan implemented a research finding, not a correction."

### 2. For every finding, BEFORE writing it, ask: "What would disconfirm this?" and CHECK.
Do not write "Research quality was high in both eras" without first asking: "What would 'low research quality' look like, and is there evidence of that?" Then look for it.

### 3. Distinguish what you measured from what the measure captures.
If you count deviations, say: "I counted deviations. Deviation count measures execution divergence from plan, NOT plan quality. A plan that locks wrong decisions will have zero deviations and be a worse plan."

### 4. Read content, not metadata. 
Do not say "28 signals generated." Read 5-10 signals and describe what they contain. Do not say "RESEARCH.md resolved all questions." Read the questions and assess whether they were generative or confirmatory.

### 5. When you don't know something, say "I don't know" and explain what investigation would resolve it.
Do not hedge with qualifications as a substitute for investigation. Do not say "this could be explained by X" unless you've checked whether X is actually the case.

### 6. Question your own framing.
After writing each section, ask: "Am I framing this to support a narrative I've already committed to?" If yes, rewrite it.

### 7. Be specific about examples.
When you say "the questions were more generative," quote the actual questions side by side. When you say "the plan shows architectural awareness," quote the passage that demonstrates it.

---

## What to Investigate

### A. Did the thin-era CONTEXT.md foreclose questions that should have been open?

For each [grounded] decision in Phase 57 CONTEXT.md (`.planning/phases/57-measurement-telemetry-baseline/57-CONTEXT.md`):
1. Quote the decision and its claimed basis
2. Is the basis traceable? Does the cited artifact actually support the claim?
3. Could this have been a working assumption instead? What would opening it as a question have enabled the researcher to investigate?
4. Would a working assumption framing have changed what the research produced?

Do the same for at least 3 [grounded] decisions from Phase 55 CONTEXT.md and Phase 56 CONTEXT.md.

Compare with Phase 52-54 CONTEXT.md: for the comparable decisions (implementation approach, scope boundaries, architectural choices), were they framed as working assumptions or locked decisions? Quote both.

### B. Research question quality comparison

Read the RESEARCH.md files for Phases 52, 53, 54, 55, 55.1, 55.2, and 56. For each:
1. List the open questions from CONTEXT.md that research addressed
2. Quote the question as formulated in CONTEXT.md
3. Classify: Was the question **generative** (specifying a research program, opening multiple possible answers) or **confirmatory** (asking for yes/no validation of an existing assumption)?
4. What did research find? Was it a surprise or a confirmation?
5. Did research ask any questions that CONTEXT.md didn't surface? If so, what prompted them?

Present this as a side-by-side comparison table with QUOTED text, not summaries.

### C. The invisible cost: questions never asked

This is the hardest dimension and the most important.

For Phase 57 specifically:
- The CONTEXT.md locked "all 8 proposed metrics from research" as [grounded]. Read the research doc (`.planning/research/measurement-infrastructure-research.md` section 4) and assess: does the research justify WHY these 8 and not others? Were alternatives considered? What question would a working assumption have opened?
- The CONTEXT.md locked "--raw flag for JSON output; default is human-readable tables" as [grounded]. Is this actually investigated or is it just a convention assertion? What would exploring this have surfaced?
- Pick 3 more [grounded] decisions and do the same analysis.

For Phase 52 or 53, find comparable decisions and check: were they framed as working assumptions? If so, did research investigate them and find something the thin era missed?

### D. Signal content comparison (properly done this time)

Read at least 5 signal files from each era. Not counting — READING.

For each signal:
- Quote the "What Happened" and "Potential Cause" sections
- Classify: Is this an architectural insight, a process observation, a technical discovery, or an execution event?
- Was this the kind of observation that requires reflective epistemic practice (guardrails, assumption-surfacing) or would any competent executor notice it?
- Check `detection_method` and `source`/`origin` fields — was this auto-collected or manually observed?

Also: Was collect-signals invoked for each era? Check SUMMARY.md files for explicit mention of collect-signals invocation. Check STATE.md automation stats. Be specific about what you find and quote the evidence.

### E. Pre-work provenance (properly verified this time)

For each pre-work artifact referenced by thin-era CONTEXT.md files:
1. Name the exact file path
2. Read the file header for provenance information
3. Check `git log --oneline -1 -- <filepath>` for commit context
4. Check the commit message and surrounding commits for session context
5. Is there any evidence about WHO initiated this work and WHY?
6. Does the workflow described in the header ACTUALLY EXIST as a harness workflow? Check: is there a `/gsdr:drift-survey` command? Is there an automated drift survey workflow? If the audit claims "this is a normal workflow product," VERIFY that the workflow exists.

Do NOT claim these are "automated workflow products" or "user-initiated compensation" without evidence. If the evidence is insufficient to determine provenance, say so explicitly.

### F. What "plan quality" should actually mean

The prior audits measured technical detail (code snippets, line references, verification commands) and called it quality. This is a category error.

Instead, for 2 plans from each era:
1. Read the CONTEXT.md decisions that informed the plan
2. Read the plan
3. Ask: Does the plan implement decisions that were genuinely investigated, or decisions that were asserted as [grounded] without investigation?
4. Are there points where the plan SHOULD have questioned a CONTEXT.md decision but didn't because it was marked [grounded]?
5. Are there points where the plan DID question a CONTEXT.md framing? Quote the passage.

This is not about whether the plan is detailed. It's about whether the plan is building on sound foundations or on unexamined assumptions.

---

## Output Format

Write to: `.planning/audits/2026-04-09-discuss-phase-exploration-quality/rigorous-comparative-audit.md`

Structure each section as:
1. **What I investigated** (files read, what I looked for)
2. **What I found** (with quoted evidence and file:line citations)
3. **What this means** (interpretation, clearly separated from evidence)
4. **What would disconfirm this interpretation** (and whether I checked)
5. **What I couldn't determine** (with what investigation would resolve it)

End with:
- **Findings that survived scrutiny** (with evidence chains)
- **Findings that are genuinely uncertain** (with what's missing)
- **Corrections to prior audits** (specific passages that were wrong and why)

---

## Anti-Patterns to Avoid (from prior audit failures)

| Anti-Pattern | Example from prior audits | What to do instead |
|---|---|---|
| Count without reading | "28 signals vs 2 signals" | Read 5+ signals per era, describe content |
| Measure the wrong thing | "Both eras passed verification" → "quality is comparable" | State what verification measures and what it doesn't |
| Ungrounded provenance claims | "These are automated workflow products" | Check if the workflow actually exists |
| Fabricated correction narratives | "Planner corrected CONTEXT.md" | Read the CONTEXT.md and verify what it actually said |
| Hedging as avoidance | "This could be explained by X" without checking X | Check X, then report what you found |
| Confirmatory framing | Finding evidence that supports thesis, stopping | For each finding, seek disconfirming evidence first |
| Vague references | "The plan shows architectural awareness" | Quote the specific passage |
