## Root Cause Investigation: Missing Auto-Progression in /gsdr:discuss-phase

**Date:** 2026-04-09
**Agent:** claude-sonnet-4-6 (Explore agent)
**Triggered by:** User observation during Phase 57 discuss-phase --auto

---

### 1. Are the two discuss-phase files identical?

**No — but the differences are entirely namespace-level, not logic-level.**

The diff between the two files (85 lines of diff output) consists exclusively of:
- Namespace substitutions: `gsdr` vs `gsd`, `/gsdr:` vs `/gsd:`, `gsdr-planner` vs `gsd-planner`, `gsdr-advisor` vs `gsd-advisor`
- Binary path substitutions: `$HOME/./.claude/get-shit-done-reflect/bin/gsd-tools.cjs` vs `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs`
- Agent path substitutions: `@./.claude/agents/gsdr-advisor-researcher.md` vs `@~/.claude/agents/gsd-advisor-researcher.md`

Both files are **1208 lines** and have **identical logic structure**. The installed runtime version at `.claude/get-shit-done-reflect/workflows/discuss-phase.md` was produced by a namespace-substitution pass on the source at `get-shit-done/workflows/discuss-phase.md`.

### 2. Does discuss-phase have auto-progression logic?

**Yes — but it only triggers with `--auto`, `--chain`, or `workflow.auto_advance: true` in config.**

Both files have an `<step name="auto_advance">` section (lines 1116–1185) and a `<step name="confirm_creation">` section (lines 1007–1044).

The `confirm_creation` step is what runs in normal (no flag) invocations. It outputs a "Next Up" block with a suggested command — a **suggestion only, not auto-execution.**

### 3. The `--chain` flag: present in git history, missing from both working files

This is the core of the issue. Commit `5e88db95` (merged as PR #1445 on 2026-04-01) added a `--chain` flag specifically to address this:

> "Discussion is fully interactive (user answers questions). After context is captured, auto-advances to plan -> execute."

The commit changed 7 critical lines in the `auto_advance` step:

| What changed | Before | After (commit 5e88db95) |
|---|---|---|
| Parse line | `Parse '--auto' flag from $ARGUMENTS` | `Parse '--auto' and '--chain' flags from $ARGUMENTS` |
| Chain clear condition | `if [[ ! "$ARGUMENTS" =~ --auto ]]` | `if [[ ! "$ARGUMENTS" =~ --auto ]] && [[ ! "$ARGUMENTS" =~ --chain ]]` |
| Trigger condition | `If '--auto' flag OR AUTO_CHAIN OR AUTO_CFG` | `If '--auto' OR '--chain' OR AUTO_CHAIN OR AUTO_CFG` |

**Crucially: `5e88db95` is NOT an ancestor of the fork's current `HEAD`.** The commit exists in git history (it was pulled into the local repo as a remote reference) but was never merged into the fork's main branch.

### 4. Git timeline

- **2026-03-27**: Fork's `feat(52-03)` commit (`ef043680`) does a "wholesale-replace" of `get-shit-done/workflows/discuss-phase.md` with the upstream version
- **2026-04-01**: Upstream PR #1445 (`5e88db95`) adds `--chain` flag — NOT merged into fork
- **2026-04-02**: Fork adds three-mode discuss system (`e4ae09b0`)
- **2026-04-08**: Fork's Phase 55 upstream mini-sync (`368fd725`) syncs binary/runtime modules but does NOT touch discuss-phase.md (it's a "Hybrid merge" file per FORK-DIVERGENCES.md)

### 5. Root Cause

**Fork sync gap.** The `--chain` feature landed in upstream on 2026-04-01. The fork's last sync (Phase 55, 2026-04-08) synced binary/runtime modules but explicitly did NOT re-sync the discuss-phase workflow file, because it's categorized as a "Hybrid merge" file requiring manual integration.

**To fix:** Cherry-pick the 6 changed lines from commit `5e88db95` into `get-shit-done/workflows/discuss-phase.md`, then re-propagate to `.claude/get-shit-done-reflect/workflows/discuss-phase.md` via the fork's namespace-substitution install process.

### 6. Config state

The user's config has:
- `workflow.auto_advance: false` — this would need to be `true` for config-based auto-progression
- `workflow._auto_chain_active: true` — this is a runtime flag, set during chain execution, but meaningless without the `--chain` code path
