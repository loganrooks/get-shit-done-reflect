---
phase: 58-structural-enforcement-gates
plan: 12a
type: execute
wave: 6
depends_on: ['02', '05', '07', '11', '12']
files_modified:
  - get-shit-done/workflows/map-codebase.md
  - get-shit-done/workflows/validate-phase.md
  - get-shit-done/workflows/new-project.md
  - get-shit-done/workflows/new-milestone.md
  - commands/gsd/audit.md
  - commands/gsd/debug.md
  - .github/gate-13-allowlist.txt
autonomous: true
resolves_signals:
  - sig-2026-04-10-researcher-model-override-leak-third-occurrence
  - sig-2026-04-17-codex-auto-compact-prompt-parity-gap
must_haves:
  truths:
    - "Every remaining named delegation site enumerated in `58-02-gate05-enumeration.md` (the 6 files outside Plan 12's scope: `commands/gsd/audit.md`, `commands/gsd/debug.md`, `map-codebase.md`, `new-project.md`, `new-milestone.md`, `validate-phase.md`) has the echo_delegation macro + GATE-13 inline dispatch contract + literal model value baked in."
    - "`.github/gate-13-allowlist.txt` is either deleted OR contains only a retirement comment after Plan 12a lands — the full GATE-13 CI grep run in Plan 07 returns zero violations without reliance on the allowlist."
    - "Every spawn adds a line to `.planning/delegation-log.jsonl` per the macro spec — verified by the same unit test Plan 12 spawns (no duplication)."
    - "Per-gate Codex behavior for GATE-05 and GATE-13 declared `applies` on both runtimes per `58-05-codex-behavior-matrix.md` (identical to Plan 12)."
  artifacts:
    - path: "commands/gsd/audit.md"
      provides: "Audit command spawn site with echo macro + inline dispatch contract"
      contains: "DISPATCH CONTRACT"
    - path: "commands/gsd/debug.md"
      provides: "Debug command spawn sites with macro + contracts"
      contains: "DISPATCH CONTRACT"
    - path: "get-shit-done/workflows/map-codebase.md"
      provides: "Codebase-mapper spawn sites (5) with macro + contracts"
      contains: "DISPATCH CONTRACT"
    - path: "get-shit-done/workflows/new-project.md"
      provides: "New-project spawn sites with macro + contracts"
      contains: "DISPATCH CONTRACT"
    - path: "get-shit-done/workflows/new-milestone.md"
      provides: "New-milestone spawn sites (3) with macro + contracts"
      contains: "DISPATCH CONTRACT"
    - path: "get-shit-done/workflows/validate-phase.md"
      provides: "Nyquist-auditor spawn site with macro + contract"
      contains: "DISPATCH CONTRACT"
    - path: ".github/gate-13-allowlist.txt"
      provides: "Empty or retirement-commented after this plan lands"
      contains: ""
  key_links:
    - from: "commands/gsd/audit.md"
      to: ".planning/delegation-log.jsonl"
      via: "echo_delegation macro appends one line per spawn (same as Plan 12)"
      pattern: "delegation-log.jsonl"
    - from: ".github/gate-13-allowlist.txt"
      to: ".github/workflows/ci.yml"
      via: "GATE-13 CI step consults allowlist; Plan 12a retires the final entries Plan 12 left"
      pattern: "gate-13-allowlist"
---

<objective>
Complete the GATE-05 + GATE-13 rollout started by Plan 12. Apply the echo_delegation macro + inline dispatch contract at the remaining 6 named spawn sites (2 command files + 4 workflow files) from `58-02-gate05-enumeration.md`. Retire the bootstrap allowlist.

Purpose: Plan 12 covered the 10 core workflow files under 2 tasks within context budget. Plan 12a covers the 6 remaining files (split per checker M5 — 17 files in Plan 12 exceeded batch-work thresholds). Same transformation pattern; same gate semantics. After this plan lands, the allowlist is retired and the full-sweep GATE-13 CI grep returns zero violations.

Output: echo macro + dispatch contract at the 6 remaining files; allowlist emptied or deleted with retirement comment.

Per-gate Codex behavior: GATE-05 `applies` both; GATE-13 `applies` both (Codex auto-compact is the motivating runtime scenario per `58-05-codex-behavior-matrix.md`).

Fire-events (identical to Plan 12):
- GATE-05: `.planning/delegation-log.jsonl` append per spawn.
- GATE-13: full-sweep CI grep after this plan returns 0 hits → `gate_fired=GATE-13 result=pass`.

Signals addressed (same as Plan 12, completed here):
- `sig-2026-04-10-researcher-model-override-leak-third-occurrence`: every spawn now echoes model pre-spawn.
- `sig-2026-04-17-codex-auto-compact-prompt-parity-gap`: inline dispatch contracts survive auto-compact.

Note on dependencies: `depends_on: ['02','05','07','11','12']` — inherits Plan 12's constraints (enumeration + matrix + CI step + upstream port) AND adds Plan 12 itself (allowlist partial retirement must happen before this plan's full retirement; both touch the allowlist sequentially).
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/58-structural-enforcement-gates/58-CONTEXT.md
@.planning/phases/58-structural-enforcement-gates/58-RESEARCH.md
@.planning/phases/58-structural-enforcement-gates/58-02-gate05-enumeration.md
@.planning/phases/58-structural-enforcement-gates/58-02-gate13-dispatch-contract-design.md
@.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md
@.planning/phases/58-structural-enforcement-gates/58-12-SUMMARY.md

@commands/gsd/audit.md
@commands/gsd/debug.md
@get-shit-done/workflows/map-codebase.md
@get-shit-done/workflows/new-project.md
@get-shit-done/workflows/new-milestone.md
@get-shit-done/workflows/validate-phase.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Insert echo_delegation macro + inline dispatch contract at the 6 remaining files (commands + map-codebase + new-project + new-milestone + validate-phase)</name>
  <files>commands/gsd/audit.md, commands/gsd/debug.md, get-shit-done/workflows/map-codebase.md, get-shit-done/workflows/new-project.md, get-shit-done/workflows/new-milestone.md, get-shit-done/workflows/validate-phase.md</files>
  <action>
Apply the SAME transformation Plan 12 Task 1 specifies (echo_delegation macro + inline GATE-13 dispatch contract with literal model values baked in) at every site enumerated in `58-02-gate05-enumeration.md` within these 6 files.

**Reuse pattern (copy identically from Plan 12 / `58-02-gate13-dispatch-contract-design.md`):**

For each enumerated site:

1. Read the enumeration row to confirm `agent_type` and `model_source`.
2. Insert the echo_delegation macro BEFORE the spawn block:

```bash
# GATE-05: echo delegation before spawn
mkdir -p .planning/
echo "[DELEGATION] agent=${SUBAGENT_TYPE} model=${MODEL} reasoning_effort=${REASONING_EFFORT} isolation=${ISOLATION:-none} session=${SESSION_ID}"
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"agent\":\"${SUBAGENT_TYPE}\",\"model\":\"${MODEL}\",\"reasoning_effort\":\"${REASONING_EFFORT}\",\"isolation\":\"${ISOLATION:-none}\",\"session_id\":\"${SESSION_ID}\",\"workflow_file\":\"${BASH_SOURCE[0]##*/}\",\"workflow_step\":\"${STEP_NAME}\"}" \
  >> .planning/delegation-log.jsonl || true
```

3. Insert the GATE-13 DISPATCH CONTRACT comment block immediately before the `Task(...)` call, resolving the literal model value at authoring time via `model-profiles.cjs` (quality profile as authoring-time default).

**Specific sites (from `58-02-gate05-enumeration.md` — Research R3 confirmed locations):**

- `commands/gsd/audit.md:260` — `gsdr-auditor` spawn (also referenced by `/gsdr:audit` skill)
- `commands/gsd/debug.md:95, 148` — `gsd-debugger` spawns (2 sites)
- `map-codebase.md:87, 95, 118, 141, 164` — 5 `gsd-codebase-mapper` sites
- `new-project.md:473, 513, 553, 593, 617, 824, 902` — researcher / synthesizer / roadmapper sites (7 sites)
- `new-milestone.md:175, 199, 348` — 3 sites
- `validate-phase.md:101-102` — nyquist-auditor spawn

For each: apply the macro + dispatch-contract per Plan 12 Task 1's template. Line numbers are from the enumeration at authoring time; re-read the enumeration fresh before editing since Plan 12's macro insertions may have shifted line numbers in workflow files it modified. The command files (audit.md, debug.md) and this plan's 4 workflow files are NOT touched by Plan 12, so their line numbers should be stable.

**Idempotency guard:** before editing each site, grep for `GATE-05: echo delegation before spawn` in the file — if the sentinel is present at that site, skip (no-op). Same pattern Plan 12 uses.

This task addresses the same two signals Plan 12 addresses; the partition is pure file-ownership — same root cause.
  </action>
  <verify>
Grep for macro presence in each file:
```
for f in commands/gsd/audit.md commands/gsd/debug.md get-shit-done/workflows/map-codebase.md get-shit-done/workflows/new-project.md get-shit-done/workflows/new-milestone.md get-shit-done/workflows/validate-phase.md; do
  echo "=== $f ==="
  grep -c "GATE-05: echo delegation before spawn" "$f"
done
```
Expected: per-file count matches enumeration site count (audit: 1; debug: 2; map-codebase: 5; new-project: 7; new-milestone: 3; validate-phase: 1) — totaling ~19 sites.

Grep for DISPATCH CONTRACT comment block:
```
grep -rln "DISPATCH CONTRACT" commands/gsd/audit.md commands/gsd/debug.md get-shit-done/workflows/map-codebase.md get-shit-done/workflows/new-project.md get-shit-done/workflows/new-milestone.md get-shit-done/workflows/validate-phase.md | wc -l
```
Expected: 6 (all six files carry at least one contract block).

Confirm no template-variable bindings remain at `model=` in these files:
```
grep -rn -A 5 'Task(' commands/gsd/audit.md commands/gsd/debug.md get-shit-done/workflows/map-codebase.md get-shit-done/workflows/new-project.md get-shit-done/workflows/new-milestone.md get-shit-done/workflows/validate-phase.md 2>/dev/null \
  | grep -E 'model\s*=\s*"\{[^}]+\}"' \
  | wc -l
```
Expected: 0 lines (every binding is literal).
  </verify>
  <done>
All 6 remaining files have echo macro + inline dispatch contracts; sites in Plan 12a scope carry GATE-05 + GATE-13 structural enforcement.
  </done>
</task>

<task type="auto">
  <name>Task 2: Retire `.github/gate-13-allowlist.txt` + run full-sweep verification</name>
  <files>.github/gate-13-allowlist.txt</files>
  <action>
After Task 1 has completed the macro+contract rollout across the remaining 6 files, retire the bootstrap allowlist.

**Option A (preferred):** replace `.github/gate-13-allowlist.txt` content with a single retirement-comment file:

```
# Allowlist retired in Phase 58 Plan 12a (2026-04-NN).
# Plan 12 retired the 10 core workflow entries; Plan 12a retires the remaining command + workflow entries.
# GATE-13 CI grep in `.github/workflows/ci.yml` no longer filters through this allowlist — all Task(...)
# dispatch blocks must carry literal model values (no `{...}` template bindings).
# If a future dispatch site genuinely needs a template binding (e.g., model resolution requires runtime
# context), re-add an entry here WITH a rationale comment AND update Plan 07's CI grep to continue
# consulting the allowlist (currently bypassed when the file contains only comments).
```

**Option B (alternative):** delete the file entirely. Update Plan 07's CI grep step to handle missing allowlist gracefully (fall back to empty exclusion filter).

**Preference:** Option A keeps the file as a legible re-entry point if future bindings must be allowlisted; Option B is cleaner but requires touching Plan 07's CI logic. Choose Option A unless Option B is mechanically simpler at execution time.

**Full-sweep verification (same as Plan 07's CI step):**

```bash
# Run the full GATE-13 CI grep exactly as ci.yml does
MATCHES=$(grep -rn -A 5 'Task(' agents/ get-shit-done/workflows/ commands/ --include='*.md' 2>/dev/null \
    | grep -E 'model\s*=\s*"\{[^}]+\}"' \
    | grep -v -F -f .github/gate-13-allowlist.txt 2>/dev/null \
    || true)
if [ -n "$MATCHES" ]; then
  echo "::error::GATE-13: violations remain after Plan 12a — allowlist retirement premature"
  echo "$MATCHES"
  exit 1
fi
echo "::notice::gate_fired=GATE-13 result=pass — allowlist retired"
```

If violations remain, identify the file+site and address before retiring the allowlist. DO NOT retire the allowlist if ANY site still has a template binding — that defeats GATE-13's point.

**Edge case:** if `discuss-phase-assumptions.md` (Plan 11 scope) has template bindings at its three analyzer spawn points that Plan 11 didn't resolve to literals, coordinate with Plan 11's outputs. Plan 11's SUMMARY should confirm literal values were baked in — if not, file a signal and flag this as follow-up; DO NOT silently leave violations under allowlist cover.
  </action>
  <verify>
```
cat .github/gate-13-allowlist.txt
```
Expected: contains only retirement-comment lines (or file does not exist if Option B was taken).

Run the full-sweep GATE-13 grep as Plan 07's CI step does:
```
grep -rn -A 5 'Task(' agents/ get-shit-done/workflows/ commands/ --include='*.md' 2>/dev/null \
  | grep -E 'model\s*=\s*"\{[^}]+\}"' \
  | grep -v -F -f .github/gate-13-allowlist.txt 2>/dev/null \
  | tee /tmp/gate-13-full-sweep.txt
wc -l /tmp/gate-13-full-sweep.txt
```
Expected: 0 lines.

Echo-macro presence across ALL files Plan 12 + Plan 12a touched:
```
grep -rn "GATE-05: echo delegation before spawn" get-shit-done/workflows/ commands/ agents/ --include='*.md' | wc -l
```
Expected: matches the full enumeration count from `58-02-gate05-enumeration.md` (Plan 12 scope + Plan 12a scope, minus the 3 sites Plan 11 owns in discuss-phase-assumptions.md). Expect ~22-25 total.
  </verify>
  <done>
Allowlist retired (Option A or B); full-sweep GATE-13 grep returns 0 violations; GATE-05 + GATE-13 structurally enforced at every named site across the phase.
  </done>
</task>

</tasks>

<verification>
- All 6 files in Plan 12a scope have echo macro + inline dispatch contracts.
- `.github/gate-13-allowlist.txt` is retired (content = retirement comment, or file deleted).
- Full-sweep Plan 07 CI grep returns 0 lines.
- Running this plan twice is idempotent.
- No template-variable model bindings remain anywhere in `agents/`, `get-shit-done/workflows/`, `commands/`.
</verification>

<success_criteria>
- GATE-05 structurally enforced at every remaining named site.
- GATE-13 structurally enforced — compaction-resilient across all remaining sites.
- Bootstrap allowlist retired with legible audit trail.
- Signals addressed end-to-end (Plan 12 + 12a complete the rollout).
- Per-gate Codex behavior matches matrix.
</success_criteria>

<output>
After completion, create `.planning/phases/58-structural-enforcement-gates/58-12a-SUMMARY.md`
</output>
</content>
</invoke>