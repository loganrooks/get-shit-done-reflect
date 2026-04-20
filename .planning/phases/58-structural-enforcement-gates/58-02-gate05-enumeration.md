---
phase: 58-structural-enforcement-gates
plan: 02
artifact_type: gate_enumeration
gate: GATE-05
generated: 2026-04-20
scope: agents/, commands/, get-shit-done/workflows/, skills/, .codex/skills/
exclusions: .sonnet-run-archive/, node_modules/, get-shit-done/templates/, get-shit-done/references/
codex_behavior: applies
fire_event: .planning/delegation-log.jsonl line-append per spawn
resolves_signals:
  - sig-2026-04-10-researcher-model-override-leak-third-occurrence
---

# GATE-05 Enumeration: Named Delegation Sites

This artifact enumerates every named delegation spawn site in the repo so Wave 3
Plan 12 can drop the `echo_delegation` macro into each site without guessing.
Research R3 produced a 22-site summary; this enumeration re-verifies and
expands the table with the per-site metadata Plan 12 needs.

---

## 1. Scope and Methodology

### 1.1 Grep commands

Re-verify by running (from repo root):

```bash
# subagent_type= anywhere in workflows / commands / agents / skills / codex skills
grep -rn --include='*.md' 'subagent_type\s*=' \
  agents/ commands/ get-shit-done/ skills/ .codex/skills/ 2>/dev/null

# Literal Task( blocks (to cross-reference surrounding context)
grep -rn --include='*.md' 'Task(' \
  agents/ commands/ get-shit-done/ skills/ .codex/skills/ 2>/dev/null
```

### 1.2 Exclusions

- `.sonnet-run-archive/` — frozen historical session archive.
- `node_modules/` — third-party.
- `get-shit-done/templates/debug-subagent-prompt.md` and
  `get-shit-done/templates/planner-subagent-prompt.md` — these are prompt
  templates consumed by a live dispatch site, not dispatch sites themselves
  (the live site is what spawns them).
- `get-shit-done/references/model-profile-resolution.md` — documentation example,
  not a live dispatch.
- `get-shit-done/references/audit-conventions.md`,
  `capability-matrix.md`, `health-probes/rogue-context.md` — prose mentions of
  `Task()` as discussed concept; no live spawn.
- `skills/` — empty of `subagent_type=` at enumeration time (confirmed by grep:
  "No matches found").
- `.codex/skills/` — **NOT empty.** Three Codex skill files contain live
  dispatch sites (`gsdr-research-phase/SKILL.md`, `gsdr-audit/SKILL.md`,
  `gsdr-debug/SKILL.md`). These are Codex-runtime mirrors of the Claude
  workflow / command dispatches and MUST receive the same echo macro and
  dispatch-contract treatment under GATE-05 / GATE-13. Included as rows 41–45.
- `get-shit-done/workflows/execute-plan.md:103` — contains the string
  `Task(subagent_type="gsd-executor", ...)` as a Pattern-A **prose description**,
  not a live spawn (the pattern is invoked from elsewhere). Excluded.

### 1.3 Methodology

For each hit:

1. Read the surrounding 10 lines before the `Task(` block (or the
   `subagent_type=` line if it's inside a `Task(` block) to determine whether
   the block is preceded by a `echo "Model: ..."` / `echo "[DELEGATION]..."` /
   equivalent print-to-user statement.
2. Classify `model_source` as (a) a template variable reference like
   `{researcher_model}`, (b) a loop-variable like `MODEL` populated by the
   enclosing loop, or (c) a literal model string, or (d) absent.
3. Classify `reasoning_effort_source` analogously.
4. Tag the pattern category per the enum in Section 4.2.

### 1.4 Authority chain

- 58-RESEARCH.md §R3 (the authoritative enumeration source).
- 58-CONTEXT.md `<working_model>` §4 (locks GATE-05 named sites).
- Raw `grep` output re-run 2026-04-20 against commit `e32eb265`.

---

## 2. Per-Gate Codex Behavior

**GATE-05 Codex behavior:** `applies`.

The fire-event is `.planning/delegation-log.jsonl` line-append, which works
identically across Claude Code and Codex runtimes — both can shell out to
`echo` and redirect to a JSONL file. No runtime-specific substrate is required.

**Attribution hook:** the `runtime` field on each log line distinguishes
`claude-code` from `codex-cli` via an environment marker set by the workflow
prelude (future-facing — Wave 3 Plan 12 adds this).

---

## 3. Fire-Event Mechanism

**Substrate:** `.planning/delegation-log.jsonl`.

Each spawn appends one line with the canonical schema:

```json
{
  "ts": "2026-04-20T12:30:00Z",
  "agent": "gsd-phase-researcher",
  "model": "claude-opus-4-6",
  "reasoning_effort": "high",
  "isolation": "none",
  "session_id": "abc123",
  "workflow_file": "get-shit-done/workflows/research-phase.md",
  "workflow_step": "Spawn Researcher",
  "runtime": "claude-code"
}
```

The file is parseable JSONL. Phase 57.5's extractor registry picks it up via
the GSDR family (Plan 19 registers a `delegation_log` extractor against this
file). One line == one fire event.

---

## 4. Sites Table

### 4.1 Legend

- `file:line` — path and 1-indexed line number of the `subagent_type=` attribute
  (or of the `Task(` start if `subagent_type` is dynamic or on a non-first line).
- `agent_type` — the literal string passed to `subagent_type=`, or the runtime
  variable name if dynamic.
- `model_source` — what populates `model=` in the spawn (`template:{name}` /
  `loop_var:NAME` / `literal` / `absent`).
- `reasoning_effort_source` — what populates `reasoning_effort=` (`template:{name}` /
  `loop_var:NAME` / `literal` / `absent`).
- `echoes_model_pre_spawn` — `yes` if there is an explicit `echo "Model: ..."`
  or equivalent print-to-user BEFORE the `Task(` block; `no` otherwise. A
  `grep` confirmed **zero** spawn sites echo model pre-spawn today.
- `pattern_category` — one of:
  `sensor_dispatch`, `research_dispatch`, `planner_dispatch`, `verifier_dispatch`,
  `executor_dispatch`, `audit_dispatch`, `advisor_dispatch`, `reflector_dispatch`,
  `other`.

### 4.2 Sites

| # | file:line | agent_type | model_source | reasoning_effort_source | echoes_model_pre_spawn | pattern_category |
|---|-----------|------------|--------------|-------------------------|------------------------|------------------|
| 1  | `get-shit-done/workflows/collect-signals.md:276` | `SENSOR_AGENT_TYPE` (loop var; one of `gsd-<name>-sensor` or builtin) | `loop_var:MODEL` | `loop_var:REASONING_EFFORT` | no | sensor_dispatch |
| 2  | `get-shit-done/workflows/collect-signals.md:377` | `gsd-signal-synthesizer` | `template:{synthesizer_model}` | `template:{synthesizer_reasoning_effort}` | no | sensor_dispatch |
| 3  | `get-shit-done/workflows/research-phase.md:63` | `gsd-phase-researcher` | `template:{researcher_model}` | absent | no | research_dispatch |
| 4  | `get-shit-done/workflows/explore.md:65` | `gsd-phase-researcher` | absent | absent | no | research_dispatch |
| 5  | `get-shit-done/workflows/quick.md:382` | `gsd-phase-researcher` | `template:{planner_model}` (⚠ name mismatch — researcher spawn receiving planner-model binding) | absent | no | research_dispatch |
| 6  | `get-shit-done/workflows/quick.md:438` | `gsd-planner` | `template:{planner_model}` | absent | no | planner_dispatch |
| 7  | `get-shit-done/workflows/quick.md:502` | `gsd-plan-checker` | `template:{checker_model}` | absent | no | planner_dispatch |
| 8  | `get-shit-done/workflows/quick.md:547` | `gsd-planner` | `template:{planner_model}` | absent | no | planner_dispatch |
| 9  | `get-shit-done/workflows/quick.md:588` | `gsd-executor` | `template:{executor_model}` | absent | no | executor_dispatch |
| 10 | `get-shit-done/workflows/quick.md:634` | `gsd-verifier` | `template:{verifier_model}` | absent | no | verifier_dispatch |
| 11 | `get-shit-done/workflows/plan-phase.md:128` | `general-purpose` (proxy for `gsd-phase-researcher` via inline-prompt pattern) | `template:{researcher_model}` | absent | no | research_dispatch |
| 12 | `get-shit-done/workflows/plan-phase.md:347` | `general-purpose` (proxy for `gsd-planner`) | `template:{planner_model}` | absent | no | planner_dispatch |
| 13 | `get-shit-done/workflows/plan-phase.md:402` | `gsd-plan-checker` | `template:{checker_model}` | absent | no | planner_dispatch |
| 14 | `get-shit-done/workflows/plan-phase.md:450` | `general-purpose` (proxy for `gsd-planner` — revision) | `template:{planner_model}` | absent | no | planner_dispatch |
| 15 | `get-shit-done/workflows/execute-phase.md:190` | `gsd-executor` | `template:{executor_model}` | absent | no | executor_dispatch |
| 16 | `get-shit-done/workflows/execute-phase.md:335` | `gsd-verifier` | `template:{verifier_model}` | absent | no | verifier_dispatch |
| 17 | `get-shit-done/workflows/verify-work.md:384` | `gsd-planner` | `template:{planner_model}` | absent | no | planner_dispatch |
| 18 | `get-shit-done/workflows/verify-work.md:430` | `gsd-plan-checker` | `template:{checker_model}` | absent | no | planner_dispatch |
| 19 | `get-shit-done/workflows/verify-work.md:471` | `gsd-planner` (revision loop) | `template:{planner_model}` | absent | no | planner_dispatch |
| 20 | `commands/gsd/audit.md:260` | `gsdr-auditor` | absent (relies on agent-profile default) | absent | no | audit_dispatch |
| 21 | `get-shit-done/workflows/audit-milestone.md:68` | `gsd-integration-checker` | `template:{integration_checker_model}` | absent | no | audit_dispatch |
| 22 | `get-shit-done/workflows/discuss-phase.md:666` | `general-purpose` (proxy for `gsd-advisor-researcher`) | `template:{ADVISOR_MODEL}` | absent | no | advisor_dispatch |
| 23 | `commands/gsd/debug.md:95` | `gsd-debugger` | `template:{debugger_model}` | absent | no | other |
| 24 | `commands/gsd/debug.md:148` | `gsd-debugger` (continuation) | `template:{debugger_model}` | absent | no | other |
| 25 | `get-shit-done/workflows/map-codebase.md:87` | `gsd-codebase-mapper` | `template:{mapper_model}` | absent | no | other |
| 26 | `get-shit-done/workflows/validate-phase.md:101` | `gsd-nyquist-auditor` | `template:{AUDITOR_MODEL}` | absent | no | audit_dispatch |
| 27 | `get-shit-done/workflows/new-project.md:473` | `general-purpose` (project researcher, stack) | `template:{researcher_model}` | absent | no | research_dispatch |
| 28 | `get-shit-done/workflows/new-project.md:513` | `general-purpose` (project researcher, features) | `template:{researcher_model}` | absent | no | research_dispatch |
| 29 | `get-shit-done/workflows/new-project.md:553` | `general-purpose` (project researcher, architecture) | `template:{researcher_model}` | absent | no | research_dispatch |
| 30 | `get-shit-done/workflows/new-project.md:593` | `general-purpose` (project researcher, pitfalls) | `template:{researcher_model}` | absent | no | research_dispatch |
| 31 | `get-shit-done/workflows/new-project.md:617` | `gsd-research-synthesizer` | `template:{synthesizer_model}` | absent | no | research_dispatch |
| 32 | `get-shit-done/workflows/new-project.md:824` | `gsd-roadmapper` | `template:{roadmapper_model}` | absent | no | planner_dispatch |
| 33 | `get-shit-done/workflows/new-project.md:902` | `gsd-roadmapper` (revision) | `template:{roadmapper_model}` | absent | no | planner_dispatch |
| 34 | `get-shit-done/workflows/new-milestone.md:175` | `gsd-project-researcher` (parameterized by DIMENSION) | `template:{researcher_model}` | absent | no | research_dispatch |
| 35 | `get-shit-done/workflows/new-milestone.md:199` | `gsd-research-synthesizer` | `template:{synthesizer_model}` | absent | no | research_dispatch |
| 36 | `get-shit-done/workflows/new-milestone.md:348` | `gsd-roadmapper` | `template:{roadmapper_model}` | absent | no | planner_dispatch |
| 37 | `get-shit-done/workflows/reflect.md:369` | `gsd-reflector` | absent (relies on agent-profile default) | absent | no | reflector_dispatch |
| 38 | `get-shit-done/workflows/diagnose-issues.md:111` | `general-purpose` | absent (inline prompt only — no model attribute) | absent | no | other |
| 39 | `commands/gsd/research-phase.md:139` | `general-purpose` (proxy for `gsd-phase-researcher`) | absent (inline prompt only) | absent | no | research_dispatch |
| 40 | `commands/gsd/research-phase.md:173` | `general-purpose` (iteration) | absent (inline prompt only) | absent | no | research_dispatch |
| 41 | `.codex/skills/gsdr-research-phase/SKILL.md:134` | `general-purpose` (proxy for `gsdr-phase-researcher`, Codex mirror of `plan-phase.md:128`) | `template:{researcher_model}` | absent | no | research_dispatch |
| 42 | `.codex/skills/gsdr-research-phase/SKILL.md:168` | `general-purpose` (Codex continuation researcher) | `template:{researcher_model}` | absent | no | research_dispatch |
| 43 | `.codex/skills/gsdr-audit/SKILL.md:250` | `gsdr-auditor` (Codex mirror of `commands/gsd/audit.md:260`) | absent (relies on agent-profile default) | absent | no | audit_dispatch |
| 44 | `.codex/skills/gsdr-debug/SKILL.md:89` | `gsdr-debugger` (Codex mirror of `commands/gsd/debug.md:95`) | `template:{debugger_model}` | absent | no | other |
| 45 | `.codex/skills/gsdr-debug/SKILL.md:142` | `gsdr-debugger` (Codex continuation — mirror of `commands/gsd/debug.md:148`) | `template:{debugger_model}` | absent | no | other |

### 4.3 Cross-reference to plan's named sites

The `<verify>` block in `58-02-PLAN.md` names 22 sites from R3's summary table.
Row 4 of R3's table lumps `verify-work.md:384-385, 430-431, 471-472` into one
row (three separate spawns); this enumeration unfolds them into rows 17/18/19.
R3's row on `quick.md:383, 439, 503, 548, 589, 635` lumps six spawns into one
row; this enumeration unfolds them into rows 5/6/7/8/9/10. Rows 27–36 above
expand `new-project.md:824` / `new-milestone.md:348` / `new-milestone.md:175` /
`new-milestone.md:199` / `new-project.md:473,513,553,593,617,902` which R3
accounts for via the project-researcher / research-synthesizer / roadmapper
row-groups (§R3 "All `subagent_type=` / `model=` sites" table rows for new-project
and new-milestone).

Expansion of the R3 group-rows yields **40 concrete spawn lines across 14
workflow / command files** (rows 1–40 above) plus **5 Codex-skill mirrors**
across 3 `.codex/skills/*/SKILL.md` files (rows 41–45). R3's §R3 did NOT
enumerate the Codex skill mirrors; this enumeration corrects that gap because
Wave 3 Plan 12 must apply the echo macro and dispatch-contract treatment to
Codex mirrors too (or GATE-05 / GATE-13 are bypassable on the Codex runtime).
Total: **45 concrete spawn lines across 17 files**. The plan's `<verify>` step
requires "at minimum the 22 sites Research R3 named"; all 22 are present by
line number (see mapping below).

### 4.4 Verification mapping: plan's `<verify>` spot-check against rows

| Plan `<verify>` named site | Row(s) in §4.2 |
|----------------------------|-----------------|
| collect-signals.md:276-277 | 1 |
| collect-signals.md:377-378 | 2 |
| research-phase.md:63-64 | 3 |
| explore.md:65 | 4 |
| quick.md:382-383 | 5 |
| plan-phase.md:347-348 | 12 |
| plan-phase.md:402-403 | 13 |
| plan-phase.md:450-451 | 14 |
| execute-phase.md:335-336 | 16 |
| execute-phase.md:190-191 | 15 |
| verify-work.md:384-385 | 17 |
| verify-work.md:430-431 | 18 |
| verify-work.md:471-472 | 19 |
| commands/gsd/audit.md:260 | 20 |
| audit-milestone.md:68-69 | 21 |
| discuss-phase.md:666-667 | 22 |
| commands/gsd/debug.md:95 | 23 |
| map-codebase.md:87 | 25 |
| validate-phase.md:101-102 | 26 |
| new-project.md:824 | 32 |
| new-milestone.md:348 | 36 |
| reflect.md:369 | 37 |

All 22 plan-named sites are present. Zero have `echoes_model_pre_spawn=yes`.

---

## 5. Summary Counts

### 5.1 Totals

- **Total named delegation sites:** 45 concrete spawn lines.
- **Sites with pre-spawn model echo (today):** 0 (Research R3 finding confirmed).
- **Sites using template-variable `model=` binding:** 36 (adds 4 Codex-mirror
  rows 41, 42, 44, 45).
- **Sites using loop-variable `model=` binding:** 1 (sensor dispatch, row 1).
- **Sites with absent `model=` (relies on agent-profile default):** 8 (rows 4,
  20, 37, 38, 39, 40, 43 — plus any future default-only additions).
- **Sites using template-variable `reasoning_effort=` binding:** 1 (row 2).
- **Sites with absent `reasoning_effort=`:** 44.

### 5.2 By pattern category

| pattern_category | count | rows |
|------------------|-------|------|
| sensor_dispatch | 2 | 1, 2 |
| research_dispatch | 15 | 3, 4, 5, 11, 27, 28, 29, 30, 31, 34, 35, 39, 40, 41, 42 |
| planner_dispatch | 12 | 6, 7, 8, 12, 13, 14, 17, 18, 19, 32, 33, 36 |
| executor_dispatch | 2 | 9, 15 |
| verifier_dispatch | 2 | 10, 16 |
| audit_dispatch | 4 | 20, 21, 26, 43 |
| advisor_dispatch | 1 | 22 |
| reflector_dispatch | 1 | 37 |
| other | 6 | 23, 24, 25, 38, 44, 45 |

*(planner_dispatch includes roadmapper rows 32/33/36 — the roadmapper
produces the first plan artifact and so is classified under planner_dispatch.)*

### 5.3 By file

| File | Spawn lines |
|------|-------------|
| get-shit-done/workflows/collect-signals.md | 2 |
| get-shit-done/workflows/research-phase.md | 1 |
| get-shit-done/workflows/explore.md | 1 |
| get-shit-done/workflows/quick.md | 6 |
| get-shit-done/workflows/plan-phase.md | 4 |
| get-shit-done/workflows/execute-phase.md | 2 |
| get-shit-done/workflows/verify-work.md | 3 |
| commands/gsd/audit.md | 1 |
| get-shit-done/workflows/audit-milestone.md | 1 |
| get-shit-done/workflows/discuss-phase.md | 1 |
| commands/gsd/debug.md | 2 |
| get-shit-done/workflows/map-codebase.md | 1 |
| get-shit-done/workflows/validate-phase.md | 1 |
| get-shit-done/workflows/new-project.md | 7 |
| get-shit-done/workflows/new-milestone.md | 3 |
| get-shit-done/workflows/reflect.md | 1 |
| get-shit-done/workflows/diagnose-issues.md | 1 |
| commands/gsd/research-phase.md | 2 |
| .codex/skills/gsdr-research-phase/SKILL.md | 2 |
| .codex/skills/gsdr-audit/SKILL.md | 1 |
| .codex/skills/gsdr-debug/SKILL.md | 2 |
| **Total** | **45** |

### 5.4 Known discrepancies surfaced

- `quick.md:383` — researcher agent spawned with `{planner_model}` template
  binding instead of `{researcher_model}`. Plan 12's mechanical edit will bake
  in the literal planner-model value; if this is a bug, surface it under Rule
  1 or 2 in Plan 12's deviation tracking. Flagged for planner review.
- `explore.md:65`, `commands/gsd/audit.md:260`, `reflect.md:369` — no `model=`
  attribute. Plan 12 inserts the GATE-13 dispatch-contract comment using the
  `resolveModelInternal(cwd, agent_type)` result as the literal; downstream
  runtime still relies on agent-profile default, and the comment block makes
  that explicit.
- `diagnose-issues.md:111`, `commands/gsd/research-phase.md:139,173` — these
  sites were NOT in the plan's `<verify>` named-22 but are in scope per the
  grep methodology. Plan 12 should treat them as optional / noted: they use
  `general-purpose` with inline-prompt-only, no `model=` to echo. Plan 12's
  deviation tracking should record whether they get the macro (recommended —
  still adds delegation-log line) or are skipped with explicit rationale.
- `commands/gsd/debug.md:95` appeared in R3's summary but not in the plan's
  `<verify>` named-22 (the plan cites line 95 in a different context). Row 23
  is present.

---

## 6. Wave 3 Plan 12 Consumption Contract

Plan 12 reads this table and, for each row, inserts immediately before the
`Task(` block:

1. The `echo_delegation` shell macro (see `58-02-gate13-dispatch-contract-design.md`
   Section 1).
2. The GATE-13 dispatch-contract comment block (see
   `58-02-gate13-dispatch-contract-design.md` Section 2).

For rows where `model_source = template:{X}`, Plan 12 resolves the literal via
`resolveModelInternal(cwd, <agent_type_from_column>)` at edit time and bakes
the result into the `model=` line of the dispatch-contract comment. The
runtime `Task()` call retains the template variable so the runtime can
re-resolve (cosmetic: the comment is what survives compaction). See the
dispatch-contract-design doc Section 3 for the fallback when `resolve_model_ids=omit`.
