---
status: complete
round: 1
mode: research
---

# Spike Design: Facets Accuracy Validation

## Open Question

Do facets AI-generated assessments correlate with observable session-meta behavioral metrics?

## Type

Exploratory

## Hypothesis

Facets `outcome` and `friction_counts` correlate meaningfully with session-meta `tool_errors` and `user_interruptions`, suggesting facets data has signal value beyond noise.

## Success Criteria

At least 2 of the 4 cross-correlations show a statistically meaningful pattern (not necessarily linear correlation — could be categorical association).

## Experiment Plan

1. Read all 109 facets files from `~/.claude/usage-data/facets/`. Extract: `session_id`, `outcome`, `friction_counts`, `session_type`, `user_satisfaction_counts`, `claude_helpfulness`.

2. For each facets `session_id`, find the corresponding session-meta file at `~/.claude/usage-data/session-meta/{session_id}.json`. Extract: `tool_errors`, `user_interruptions`, `duration_minutes`, `tool_counts`, `user_message_count`, `assistant_message_count`.

3. Cross-correlate:
   - `outcome` categories vs mean `tool_errors` per category
   - `friction_counts` (sum of all friction types) vs `user_interruptions`
   - `session_type` vs `duration_minutes`
   - `claude_helpfulness` vs tool error rate (tool_errors / total_tool_calls)

4. Report patterns, sample sizes, and whether association looks meaningful or noisy.

5. Note surprising outliers.

## Mode

Research — analyze existing data only. No BUILD or RUN phases.
