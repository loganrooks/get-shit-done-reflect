# Quick Task 012: Persist reflection reports

**Date:** 2026-03-01
**Commit:** ea9a758

## What Changed

- `get-shit-done/workflows/reflect.md`: Added `persist_report` step between `report_completion` and `commit_lessons`. Writes full reflection output (dashboard, patterns, triage, lessons, remediation, spikes, drift) to `~/.gsd/knowledge/reflections/{project}/reflect-{date}.md`. Updated `commit_lessons` to also stage the report file.
- `agents/knowledge-store.md`: Added `reflections/` to the KB directory structure documentation.

## Why

The reflect workflow's analytical output (pattern detection, weighted scores, triage decisions, spike candidates) was console-only and lost when the session ended. Lessons and triage writes persist, but the reasoning context behind them didn't. Now the full report is preserved for reference in future planning, decision-making, and cross-session analysis.

## Design Decisions

- **Per-project, per-day**: `reflections/{project}/reflect-{date}.md` — same-day runs overwrite
- **Not indexed**: Reflection reports are NOT KB entries (not in `index.md`). They're historical records.
- **Frontmatter included**: Reports have YAML frontmatter with counts for quick scanning
- **Always committed**: Report is staged in the commit step alongside lessons
