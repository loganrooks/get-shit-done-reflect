---
phase: 58-structural-enforcement-gates
plan: 07
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: "1.19.6+dev"
  generated_at: "2026-04-20T17:12:18Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: not_available
    profile: derived
    gsd_version: exposed
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: runtime_context
    vendor: runtime_context
    model: resolveModelInternal
    reasoning_effort: not_available
    profile: config
    gsd_version: config
    generated_at: writer_clock
    session_id: not_available
subsystem: ci-enforcement
tags: [gate-02, gate-13, merge-strategy, dispatch-contract, ci-grep, fire-event, allowlist, template-variable, compaction-resilience]
requires:
  - phase: 58-01-gate02-enumeration
    provides: authoritative enumeration of every `gh pr merge` / `git merge --squash` site with scope exclusions (provenance for Task 1's GATE-02 grep patterns)
  - phase: 58-02-gate13-dispatch-contract-design
    provides: exact CI grep specification (§4.1) + allowlist format (§4.2) + scope rationale (§4.3); Codex `applies` declaration (§5.2)
  - phase: 58-02-gate05-enumeration
    provides: 45-row enumeration of `Task()` spawn sites with `model_source` classification — substrate for the bootstrap allowlist in Task 2
  - phase: 58-05-codex-behavior-matrix
    provides: per-gate Codex behavior declarations — GATE-02 `applies` both runtimes (CI grep runtime-neutral); GATE-13 `applies` both with Codex auto-compact as motivating scenario
  - phase: 58-06
    provides: GATE-01 emission step in `.github/workflows/ci.yml` (this plan places GATE-02 and GATE-13 BEFORE it so GATE-01 still fires with `result=block` on downstream gate failure)
provides:
  - GATE-02 merge-strategy conformance CI step in `.github/workflows/ci.yml` — two greps (02a no-`gh pr merge`-without-`--merge`; 02b no-`git merge --squash`-outside-historical) with exit-1 on violation and `::notice title=GATE-02::gate_fired=GATE-02 result=<pass|block>` markers
  - GATE-13 dispatch-contract restatement CI step — `-A 5` windowed grep for `model="{...}"` inside `Task(` scope with bootstrap-allowlist exclusion; exit-1 on violation and `::notice title=GATE-13::gate_fired=GATE-13 result=<pass|block>` markers
  - `.github/gate-13-allowlist.txt` — 16-entry known-debt tracker covering the template-variable bindings visible to the CI grep at Plan 07 authoring time; Plan 12 retires entries, Plan 12a deletes the file
  - Structural prevention of the regression chain from `sig-2026-03-28-squash-merge-destroys-commit-history` (squash merge) and `sig-2026-04-17-codex-auto-compact-prompt-parity-gap` (template-variable drop under compaction)
affects: [phase-58-wave-3, plan-12-spawn-site-rewrite, plan-12a-allowlist-retire, plan-17-drift-verifier, plan-19-fire-event-extractor, ci-pipeline]
tech-stack:
  added: []
  patterns:
    - "CI-grep structural enforcement: shell `grep -rn ... | grep -v ... | grep -v '# historical'` as runtime-neutral fire-event source"
    - "Bootstrap allowlist as known-debt tracker: `grep -v -F -f <allowlist>` excludes transitional violations; each line = one Plan 12 TODO; file deletion = Plan 12a closure"
    - "Grep-context prefix format discipline: `grep -A N` emits `path-lineno-` (dash separator) while `grep` without context emits `path:lineno:` (colon separator); allowlist entries must match the actual separator the CI grep produces"
    - "Fire-event emission co-ordinated across siblings: GATE-02 and GATE-13 placed BEFORE GATE-01 marker so GATE-01's `if: always()` step still runs with `result=block` when a downstream gate fires"
key-files:
  created:
    - .github/gate-13-allowlist.txt
    - .planning/phases/58-structural-enforcement-gates/58-07-SUMMARY.md
  modified:
    - .github/workflows/ci.yml
key-decisions:
  - "CI grep patterns copy-identical to Plan 01 §1 and Plan 02 §4.1 (no second-order drift): any divergence is a Plan 17 verifier finding, not a silent CI change"
  - "GATE-02a grep scope = `agents/ get-shit-done/ commands/ .codex/skills/` (source-only); `.claude/` derived mirrors excluded per Plan 01 §5.3 recommendation to avoid duplicate enforcement that GATE-04 covers"
  - "GATE-02b grep scope = `get-shit-done/ agents/ commands/ .codex/skills/` (same rationale; `skills/` referenced in plan but does not exist at authoring time — harmless)"
  - "GATE-13 grep scope = `agents/ get-shit-done/workflows/ commands/ .codex/skills/` per Plan 02 §4.3 (excludes `get-shit-done/templates/` prompt templates and `get-shit-done/references/` documentation examples)"
  - "Allowlist exclusion wrapped in `[ -f .github/gate-13-allowlist.txt ] && grep -v -F -f ... || cat` so the CI step continues to work once Plan 12a deletes the file (exit criterion: empty entries → file removed → naked grep authoritative)"
  - "Bootstrap exemption scope = 16 entries, NOT all 36 template-variable bindings from Plan 02 §4.2: consecutive `Task(` blocks share `-A 5` context windows, so grep only reports 16 of the 38 actual bindings. Plan 12 still retires all 38 source-level bindings; the allowlist shrinks as Plan 12 edits visible-to-grep sites [Rule 3 — verified by local re-run]"
  - "Blank-line hazard in `grep -F -f` pattern file documented inline: empty lines match every input line, silently disabling the check. Allowlist uses only comment (`#...`) and entry lines; regeneration command in file header includes `perl -pe 's/^(.+?\\.md-\\d+-).*/$1/'` prefix extractor"
  - "Fire-event marker format `::notice title=GATE-XX::gate_fired=GATE-XX result=<pass|block> reason=<short-code>` matches Plan 06 GATE-01 convention; Plan 19's `gate_fire_events` extractor parses on `gate_fired=GATE-` prefix (gate-agnostic regex)"
patterns-established:
  - "Structural CI grep + bootstrap allowlist: when a structural invariant must land BEFORE the mass edit that would make the invariant true, ship the grep + allowlist together. Allowlist = explicit known-debt tracker; each retired entry = one unit of the downstream edit plan"
  - "Gate placement discipline in multi-gate CI: downstream structural gates run BEFORE the `if: always()` fire-event marker so the marker's `result=block` path is reachable on downstream gate failure (enables Plan 19 to count real block events, not just test-suite pass/fail)"
  - "Runtime-neutral gate substrate: both GATE-02 and GATE-13 use CI shell grep — works identically under Claude Code and Codex CLI because the substrate is the source tree, not agent-runtime behavior (matches 58-05-codex-behavior-matrix `applies` declarations for both gates)"
duration: 3min
completed: 2026-04-20
---

# Phase 58 Plan 07: GATE-02 + GATE-13 CI Enforcement Summary

**CI jobs added for GATE-02 (merge-strategy conformance) and GATE-13 (dispatch-contract restatement) with exit-1 on violation and fire-event markers; a 16-entry bootstrap allowlist tracks the template-variable bindings Wave 3 Plan 12 will retire.**

## Performance

- **Duration:** 3min
- **Tasks:** 2 / 2
- **Files modified:** 1 (`.github/workflows/ci.yml`)
- **Files created:** 2 (`.github/gate-13-allowlist.txt`, this SUMMARY)
- **Commits:** 2 per-task + 1 metadata

## Accomplishments

1. **GATE-02 merge-strategy conformance wired into CI.** Two greps (02a: `gh pr merge` without `--merge`; 02b: `git merge --squash` outside historical comments) run on every push/PR; fail with `::error::GATE-02: ...` + `exit 1` on violation; emit `::notice title=GATE-02::gate_fired=GATE-02 result=<pass|block>` for Plan 19's extractor.

2. **GATE-13 dispatch-contract restatement wired into CI.** Grep pattern `-A 5 'Task(' | grep -E 'model\s*=\s*"\{[^}]+\}"'` fires on any template-variable binding at `model=`; allowlist exclusion wraps the pipeline so transitional bindings don't fail CI until Plan 12 rewrites them; emits `gate_fired=GATE-13 result=<pass|block>` marker.

3. **Bootstrap allowlist created** (`.github/gate-13-allowlist.txt`) — 16 entries covering the template-variable bindings visible to the CI grep today. Documents the lifecycle (Plan 12 retires entries, Plan 12a deletes the file), the blank-line hazard in `grep -F -f` pattern files, and the regeneration command.

4. **GATE-01 emission step preserved** at its original position (end of job, `if: always()`). Both new steps run BEFORE it, so GATE-01's `result=block` marker fires correctly when GATE-02 or GATE-13 fails — meaning Plan 19 sees coherent fire-event streams.

5. **Verified local clean state:** GATE-02a returns zero hits (Plan 01 removed all non-conforming sites); GATE-02b returns zero hits; GATE-13 allowlist covers all 16 visible violations; a synthetic new violation (`foo.md-999-  model="{new_fake_binding}"`) correctly escapes the allowlist and would trigger the gate.

## Task Commits

1. **Task 1: Add GATE-02 + GATE-13 CI jobs** — `53ea07d0`
2. **Task 2: Create GATE-13 bootstrap allowlist** — `82a96f08`

## Files Created/Modified

- `.github/workflows/ci.yml` (modified) — two new steps (`GATE-02 merge-strategy conformance`, `GATE-13 dispatch-contract restatement`) placed between `Run tests with coverage` and `GATE-01 emission marker`. No existing steps reordered or rewritten.
- `.github/gate-13-allowlist.txt` (created) — 16 `path-lineno-` substring entries + comment-only metadata (purpose, lifecycle, exit criterion, format, regeneration command, enumeration provenance).
- `.planning/phases/58-structural-enforcement-gates/58-07-SUMMARY.md` (created) — this document.

## Fire-Event Declarations

| Gate | Marker | Emitted by | Consumed by | Block condition |
|------|--------|------------|-------------|-----------------|
| GATE-02 | `::notice title=GATE-02::gate_fired=GATE-02 result=<pass\|block> [reason=<gh_pr_merge_without_merge_flag\|git_merge_squash_found>]` | `ci.yml` step `GATE-02 merge-strategy conformance` | Plan 19 `gate_fire_events` extractor | `gh pr merge` without `--merge` OR `git merge --squash` outside `# historical` |
| GATE-13 | `::notice title=GATE-13::gate_fired=GATE-13 result=<pass\|block> [reason=template_variable_in_dispatch_contract]` | `ci.yml` step `GATE-13 dispatch-contract restatement` | Plan 19 `gate_fire_events` extractor | Any `Task(` spawn with `model="{...}"` not in `.github/gate-13-allowlist.txt` |

**Per-gate Codex behavior (both):** `applies` on both Claude Code AND Codex CLI. The CI grep is a source-tree invariant check — runtime-neutral. GATE-13 has Codex auto-compact as the motivating scenario (`sig-2026-04-17`, 3 occurrences), but the fix is a CI substrate that enforces on both runtimes.

## Decisions & Deviations

### Key Decisions

See frontmatter `key-decisions` for the full list. Most consequential:

- **Allowlist entry-count is 16, not 36.** The enumeration at Plan 02 §4.2 lists 36 template-variable bindings across 38 sites; the `-A 5` CI grep only reports 16 because consecutive `Task(` blocks share context windows and mutually consume each other's output lines. Plan 12 still owes the full source rewrite (all 38 bindings); the allowlist only documents the subset visible to the specific grep in use. Verified by local re-run of the exact CI grep.
- **Blank-line hazard explicitly documented** in the allowlist header (blank lines in `grep -F -f` patterns match every input line, silently disabling the check). All comments use `#...` prefix; no blank separator lines.

### Deviations

**[Rule 3 — blocking issue] Allowlist entry count mismatch with plan example.**

- **Found during:** Task 2.
- **Issue:** Plan 07 Task 2 `<action>` shows an example format using `:` separator (`get-shit-done/workflows/collect-signals.md:277:`) derived from a non-`-A` grep. The actual CI step in Task 1 uses `grep -A 5` which emits `-` separator (`get-shit-done/workflows/collect-signals.md-278-`). An allowlist written with `:` separators would fail to match — the entire allowlist would be ineffective and the CI step would block on every current binding.
- **Fix:** Extracted the correct prefix format via `perl -pe 's/^(.+?\.md-\d+-).*/$1/'` directly from live CI-equivalent grep output; allowlist entries use `path-lineno-` format matching what the CI step sees. Regeneration command preserved in the allowlist header for future authors.
- **Files modified:** `.github/gate-13-allowlist.txt`.
- **KB consulted, no relevant entries.**

**[Rule 3 — blocking issue] Blank-line behaviour in `grep -F -f` pattern files.**

- **Found during:** Task 2 first-pass verification.
- **Issue:** Initial allowlist used blank lines between grouped entries for readability. `grep -F -f` treats a blank line as a pattern matching EVERY line of input; `grep -v -F` therefore suppresses ALL output, silently rendering the CI check useless. Initial "PASS: allowlist covers all current violations" was actually "PASS: every line is swallowed regardless of content" — a false green.
- **Fix:** Rewrote the allowlist with comment-only separators (`#...`) instead of blank lines. Verified the fix by injecting a synthetic fake violation (`foo.md-999-  model="{new_fake_binding}"`) and confirming it was NOT swallowed by the allowlist.
- **Files modified:** `.github/gate-13-allowlist.txt`.
- **KB consulted, no relevant entries.**

**[Rule 3 — blocking issue] CI step defensiveness against missing allowlist file.**

- **Found during:** Task 1 authoring (plan example used naked `grep -v -F -f` without fallback).
- **Issue:** Plan 07 Task 1 example shows `| grep -v -F -f .github/gate-13-allowlist.txt 2>/dev/null || true` but this pattern treats a missing allowlist file as a hard error on some grep versions — and Plan 12a is supposed to DELETE the allowlist when empty, after which the CI step must continue to function.
- **Fix:** Wrapped the allowlist exclusion in `{ if [ -f .github/gate-13-allowlist.txt ]; then grep -v -F -f .github/gate-13-allowlist.txt; else cat; fi; }` so the step gracefully falls through to the naked grep once Plan 12a ships. This matches the exit-criterion documented in `58-02-gate13-dispatch-contract-design.md` §4.2 without requiring ANOTHER CI edit when Plan 12a lands.
- **Files modified:** `.github/workflows/ci.yml`.
- **KB consulted, no relevant entries.**

No Rule 1 (code bugs), no Rule 2 (missing critical functionality), no Rule 4 (architectural) deviations. No authentication gates.

## User Setup Required

None — GATE-02 and GATE-13 fire automatically on every push / PR once this branch merges to `main`.

## Next Phase Readiness

**For Plan 12 (Wave 3 — spawn-site rewrite):**
- Allowlist entries are Plan 12's atomic work list: each line = one `Task()` site to rewrite with the GATE-05 echo macro + GATE-13 dispatch-contract comment block.
- Plan 12 retires entries as each site is edited (delete the line in the same commit that adds the comment block).
- Exit criterion for Plan 12: allowlist file contains only comment lines (no entries).

**For Plan 12a (Wave 3 — allowlist retire):**
- Delete `.github/gate-13-allowlist.txt` once Plan 12 completes.
- CI step's `[ -f ... ]` guard falls through to naked grep — no CI edit needed.
- Verify: CI emits `gate_fired=GATE-13 result=pass` on a clean-tree PR.

**For Plan 17 (Wave 4 — drift verifier):**
- Grep patterns in `ci.yml` lines 86–146 are load-bearing and MUST match the enumeration/design artifacts byte-exactly. Plan 17 should `diff` the CI step's inline grep expressions against `58-01-gate02-enumeration.md` §1 and `58-02-gate13-dispatch-contract-design.md` §4.1.

**For Plan 19 (Wave 4 — fire-event extractor):**
- Two new fire-event markers (`gate_fired=GATE-02`, `gate_fired=GATE-13`) join `gate_fired=GATE-01` in the CI log surface. Extractor can scan GitHub Actions logs via `gh run view --log` and filter on `gate_fired=GATE-` prefix.
- `reason=<short-code>` suffix provides per-block diagnostic attribution.

## Self-Check: PASSED

Verified post-write:

- `.github/workflows/ci.yml` exists and contains both `gate_fired=GATE-02` and `gate_fired=GATE-13` emission markers (grep confirmed 5 marker mentions total).
- `.github/gate-13-allowlist.txt` exists, contains 16 non-comment entries, is blank-line-free.
- Commit `53ea07d0` present in `git log` (Task 1).
- Commit `82a96f08` present in `git log` (Task 2).
- Local re-run of CI equivalents: GATE-02a zero hits, GATE-02b zero hits, GATE-13 allowlist-covered (PASS).
- Synthetic-violation test: fake `foo.md-999-  model="{new_fake_binding}"` correctly NOT swallowed by allowlist.
