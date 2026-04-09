---
status: designed
round: 0
mode: full
type: comparative
---

# Spike Design: Cross-Runtime OTel & Bridge Validation

**Phase:** 57
**Created:** 2026-04-09
**Designed by:** Orchestrator (pre-execution review)
**Combines:** Original Spike B (OTel data quality) + Spike F (statusline bridge extension) + Codex OTel gap

## Open Question

What do Claude Code's OTel export and Codex CLI's OTel export actually produce? How do they compare to each other and to session-meta? Does the statusline payload actually include cost and rate limit fields?

## Why This Matters

Phase 57 CONTEXT.md references Claude Code OTel (8 metrics, 5 events) and Codex OTel (5 metrics, 8 events) based on documentation. But documentation describes the API — we haven't verified what a real session actually emits. The telemetry-research-claude.md noted some statusline payload fields as "reportedly" existing. If the OTel or statusline data is richer/sparser/differently structured than documented, our normalization schema assumptions may be wrong. Additionally, Codex telemetry has been researched from session JSONL but never from OTel output — a gap in our cross-runtime picture.

## Type

Comparative — characterize what each runtime actually produces, then compare.

## Hypotheses

- **H1:** Claude Code OTel console output matches the documented 8 metrics and 5 event types, providing a superset of session-meta data for going-forward collection.
- **H2:** Codex CLI OTel console output matches the documented 5 metrics and 8 event types, providing token-level data comparable to its JSONL turn_context.
- **H3:** The Claude Code statusline payload includes `cost.total_cost_usd` and `rate_limits.*` as documented in telemetry-research-claude.md, making bridge file extension feasible.

## Alternative Hypotheses

- **H-alt-1:** OTel output is sparser than documented — some metrics/events may be behind feature flags, require specific plan tiers (Pro/Max), or only emit under certain conditions (e.g., api_error only on failures).
- **H-alt-2:** OTel output includes fields NOT in documentation — undocumented attributes, internal telemetry, or debug data that could be valuable.
- **H-alt-3:** Codex OTel produces fundamentally different event structure than Claude Code OTel despite both being "OTel" — the normalization assumption may not hold.
- **H-alt-4:** Statusline cost/rate_limit fields are plan-tier-dependent — Max plan may include them while Pro/free does not.

## Scope Boundaries

**In scope:**
- Claude Code OTel: enable console exporter, run a short session with tool use, capture and catalog all emitted metrics and events
- Codex CLI OTel: configure TOML console exporter, run a short exec session, capture and catalog all emitted metrics and events
- Statusline bridge: read the actual statusline payload during a Claude Code session, document which fields are present vs absent
- Cross-comparison: which fields overlap between Claude OTel, Codex OTel, and session-meta? What's unique to each?
- Evaluate whether OTel data could replace or supplement session-meta for going-forward collection

**Out of scope:**
- Building OTel collectors or exporters (this is observation, not implementation)
- OTLP endpoint setup (console exporter only — no external infrastructure)
- Codex session JSONL analysis (already done in telemetry-research-codex.md)
- Cost calculation from OTel data (deferred per DC-4)

## Failure Modes

- **FM-1:** If Claude Code OTel requires a paid plan feature we don't have, we can't test it. Check error output.
- **FM-2:** If console exporter produces too much output to parse (high-frequency metric emission), we may need to filter. Use `OTEL_METRIC_EXPORT_INTERVAL` to control cadence.
- **FM-3:** If Codex OTel config syntax has changed since the docs we fetched, the TOML may be rejected. Check Codex stderr.
- **FM-4:** The test sessions are short and may not trigger all event types (e.g., api_error requires an actual API failure, PreCompact requires context pressure). Document what was NOT triggered.

## What Inconclusive Looks Like

- If either runtime silently drops OTel output without error, we can't distinguish "no data available" from "misconfigured." Check that at least SOME output appears.
- If the comparison shows completely disjoint schemas (zero overlap between Claude and Codex OTel), the "common OTel normalization" assumption fails and needs rethinking — that's a valuable negative result, not an inconclusive one.

## Success Criteria (Multi-Level)

| Level | Finding | Implication |
|-------|---------|-------------|
| Strong | Both runtimes emit documented metrics/events, significant overlap, statusline has cost+rate_limits | OTel is viable going-forward data source; bridge extension is feasible; normalization schema has empirical grounding |
| Moderate | One runtime works well, other is sparse; partial statusline fields | OTel viable for one runtime; the other needs JSONL fallback; bridge partially extendable |
| Weak | Both OTel outputs are sparse or undocumented-only; statusline lacks cost/limits | OTel is not ready for our use case; session-meta + JSONL remain primary; bridge stays as-is |
| Negative (valuable) | OTel schemas are fundamentally incompatible across runtimes | The "common OTel normalization" assumption in CONTEXT.md Q1 is falsified — design needs different approach |

## Experiment Plan

**This is a full-mode spike** — requires actual execution, not just data analysis.

### Part 1: Claude Code OTel (Build + Run)

**Build:**
The env var `CLAUDE_CODE_ENABLE_TELEMETRY=1` has been set in `~/.env`. Additionally:

```bash
# For the test session, also set:
export OTEL_METRICS_EXPORTER=console
export OTEL_LOGS_EXPORTER=console
export OTEL_METRIC_EXPORT_INTERVAL=10000  # 10s intervals for faster feedback
export OTEL_LOG_TOOL_DETAILS=1            # include tool names and args
# Optional (privacy-sensitive, enable only for spike):
# export OTEL_LOG_USER_PROMPTS=1
```

**Run:** In a NEW terminal with those env vars set, launch `claude` and:
1. Ask a simple question (triggers api_request event + token.usage metric)
2. Run a Bash command (triggers tool_result event)
3. Edit a file (triggers code_edit_tool.decision metric)
4. Check `/cost` output
5. Exit session

**Capture:** Redirect console OTel output to a file for analysis:
```bash
claude 2>&1 | tee /tmp/claude-otel-spike.log
```

### Part 2: Codex CLI OTel (Build + Run)

**Build:** Add to `~/.codex/config.toml`:
```toml
[otel]
environment = "spike-test"
exporter = "console"
log_user_prompt = false
```

**Run:** Execute a short task:
```bash
codex exec "List the files in the current directory" 2>&1 | tee /tmp/codex-otel-spike.log
```

**Capture:** Console output includes OTel events inline.

### Part 3: Statusline Bridge Validation (Run)

**Run:** During the Claude Code session from Part 1, also inspect:
1. The live bridge file: `cat /tmp/claude-ctx-*.json`
2. The statusline hook source: `cat ~/.claude/hooks/statusline/gsdr-statusline.js`
3. What the statusline hook actually receives vs what it writes

### Part 4: Document (Analysis)

For each runtime's OTel output:
1. Catalog every metric name, type, and attributes observed
2. Catalog every event name and attributes observed
3. Compare against documentation (what's present, what's missing, what's undocumented)
4. Cross-compare Claude vs Codex: overlap matrix

For statusline:
1. Document all fields present in the payload
2. Confirm or deny: cost.total_cost_usd, rate_limits.five_hour, rate_limits.seven_day
3. Document what gsdr-statusline.js currently writes vs what it could write

## Evidence Sources

- Claude Code OTel docs: https://code.claude.com/docs/en/monitoring-usage
- Codex CLI OTel docs: https://developers.openai.com/codex/config-advanced#observability-and-telemetry
- Existing statusline analysis: .planning/audits/session-log-audit-2026-04-07/reports/telemetry-research-claude.md §Statusline
- Current bridge file: /tmp/claude-ctx-*.json
- Current statusline hook: ~/.claude/hooks/statusline/gsdr-statusline.js

## Epistemic Guardrails

- A single test session per runtime is a sample of 1. Document what WAS triggered and what was NOT (e.g., api_error requires failure conditions). Do not claim comprehensive coverage.
- Console exporter output format may differ from OTLP wire format — findings about field presence apply to console output, which may not fully represent what an OTLP collector receives.
- Codex OTel is configured via TOML; if the config is silently ignored, check Codex version compatibility.
- The statusline payload may be plan-tier-dependent. Our findings reflect the current plan tier (Max), not all tiers.
