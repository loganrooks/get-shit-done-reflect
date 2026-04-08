# Signal Verification & Recurrence Analysis

You are a verification agent. Your job is to take the deduplicated findings from the session log audit synthesis and determine which ones have already been addressed, which persist despite supposed fixes, and which are genuinely new.

## Context

A cross-platform session log audit analyzed 100 sessions from the last 2 weeks across 2 machines (dionysus/apollo) and ~10 projects. Two synthesis reports were produced:
- `.planning/audits/session-log-audit-2026-04-07/reports/opus-synthesis.md`
- `.planning/audits/session-log-audit-2026-04-07/reports/gpt-xhigh-synthesis.md`

These contain deduplicated findings with session IDs, timestamps, and descriptions. Your job is to cross-reference each finding against:
1. The current codebase state (has the code been changed to address this?)
2. The GSDR version in play when the finding occurred vs. current version
3. The knowledge base (was this already captured as a signal?)
4. GitHub issues (was this filed?)
5. Session logs from AFTER any supposed fix (did the issue recur?)

## Inputs

### Primary
- Both synthesis reports (read both — they may have identified different findings)
- Git history: `git log --oneline --since="2026-03-01"` for recent changes
- Current GSDR version: check `package.json` and git tags
- Knowledge base: `.planning/knowledge/signals/` (project-local) and `~/.gsd/knowledge/signals/` (global)
- GitHub issues: `gh issue list --repo loganrooks/get-shit-done-reflect --state all --limit 100`

### For each finding, determine:

**1. Version context**
- What GSDR version was running when this finding occurred? Extract from the session log's version field or from the session timestamp cross-referenced against release dates.
- What model was the agent using? (Available in session fingerprints at `/scratch/audit-staging/dionysus-fingerprints.json` and `apollo-fingerprints.json` — check the `models` field)
- What reasoning level was configured? (If available in session metadata)

**2. Already addressed?**
- Search git history for commits that plausibly fix this issue (by description, file path, or related issue number)
- Search the knowledge base for existing signals covering the same issue
- Search GitHub issues for related open/closed issues
- Check if the relevant code has changed between the finding's version and current version

**3. Recurrence check**
- If a finding appears to have been addressed (commit exists, issue closed, signal remediated), check whether the SAME pattern appears in sessions that occurred AFTER the fix
- Use the session fingerprints and timestamps to determine temporal ordering
- A finding that recurs after its supposed fix is a **failed intervention** — this is the most important category to surface

**4. Classification**

For each finding, classify as one of:
- **NEW** — not previously captured in KB, issues, or commits. Genuinely novel signal.
- **KNOWN-UNADDRESSED** — already in KB or issues but no fix attempted. The audit confirms it persists.
- **ADDRESSED** — fix exists in git history or issue was closed. No evidence of recurrence.
- **RECURRED** — fix was attempted but the pattern reappeared in later sessions. The intervention failed or was incomplete.
- **PARTIALLY-ADDRESSED** — some aspect was fixed but the finding is broader than what was addressed.

## Output

Write your analysis to `.planning/audits/session-log-audit-2026-04-07/reports/verification-analysis.md`

Structure:

```markdown
# Signal Verification & Recurrence Analysis

**Date:** [today]
**Findings analyzed:** [N unique findings from synthesis]
**Classification breakdown:** NEW: N | KNOWN-UNADDRESSED: N | ADDRESSED: N | RECURRED: N | PARTIALLY-ADDRESSED: N

## Version Context Summary

[Table of GSDR versions active across the audit period, with release dates and key changes]

## Failed Interventions (RECURRED)

[These are the highest-priority items — things we thought we fixed but didn't]

### [Finding title]
- **Original occurrence:** [session, date, version]
- **Supposed fix:** [commit/PR/issue that addressed it]
- **Recurrence:** [session, date, version — AFTER the fix]
- **Why the fix failed:** [analysis if possible]
- **Implication for v1.20:** [what this means for milestone planning]

## New Signals

[Genuinely novel findings not previously captured]

## Known but Unaddressed

[Already in KB/issues, confirmed still present]

## Addressed (Verified Fixed)

[Fix exists, no recurrence observed — can be deprioritized]

## Partially Addressed

[Some aspect fixed, broader issue remains]

## Model & Version Annotations

[For each finding where version/model info was extractable, annotate it. Note any patterns — do certain findings cluster around specific versions or models?]
```

Be thorough in the git and KB searches. A finding classified as NEW when it's actually KNOWN-UNADDRESSED wastes milestone planning effort on things we already know about. A finding classified as ADDRESSED when it actually RECURRED gives false confidence.
