# Phase 28: Restore Deleted Commands & Fix Dangling References - Research

**Researched:** 2026-02-23
**Domain:** Git history restoration, file wiring validation
**Confidence:** HIGH

## Summary

Commit `f664984` ("refactor: remove legacy agent specs and fix workflow KB paths") deleted 5 files totaling 1,112 lines of agent and command logic under the false premise that "logic moved to workflow orchestrators." In fact, no migration occurred -- the workflow files still reference these agents via `subagent_type` and `@`-reference syntax, and the commands were the sole entry points for `/gsd:reflect` and `/gsd:spike`. The commit also made legitimate changes: fixing KB paths from `.claude/gsd-knowledge/` to `~/.gsd/knowledge/` in three workflow files and adding a research-first advisory step to `run-spike.md`. These valid changes are already applied and should be kept.

The fix is straightforward: restore the 5 deleted files from git history (pre-deletion content at `f664984^` already has correct KB paths from Phases 14 and 19), then verify that all wiring tests pass. No reference docs or workflow files need modification -- they already reference the agents correctly (the agents just need to exist again).

**Primary recommendation:** Use `git show f664984^:<path>` to restore each file's pre-deletion content verbatim. The pre-deletion content already incorporates all valid KB path migrations (Phases 14, 19) and provenance field additions (Phase 19). No content modification is needed.

## Standard Stack

Not applicable -- this phase involves no new libraries or dependencies. It is a pure git restoration task using existing project infrastructure.

### Tools Used
| Tool | Purpose | Why |
|------|---------|-----|
| `git show f664984^:<path>` | Extract pre-deletion file content | Precise restoration from known-good commit |
| `git add -f` | Stage files in gitignored `.claude/` directory | `.claude/` is in `.gitignore` line 9 |
| `npx vitest run tests/integration/wiring-validation.test.js` | Verify wiring | Existing 20-test suite catches all known breakages |

## Architecture Patterns

### File Organization

The deleted files belong in two locations:

```
.claude/
├── agents/
│   ├── gsd-reflector.md           # 278 lines - reflection/pattern detection agent
│   ├── gsd-signal-collector.md    # 209 lines - post-execution signal detection agent
│   └── gsd-spike-runner.md        # 474 lines - spike execution agent (Build/Run/Document)
└── commands/gsd/
    ├── reflect.md                 # 87 lines - /gsd:reflect command entry point
    └── spike.md                   # 64 lines - /gsd:spike command entry point
```

### Wiring Pattern: Command -> Workflow -> Agent

Each deleted file participates in a three-layer delegation chain:

```
/gsd:reflect command (.claude/commands/gsd/reflect.md)
  -> reflect workflow (get-shit-done/workflows/reflect.md)
    -> gsd-reflector agent (.claude/agents/gsd-reflector.md)
       via Task(subagent_type="gsd-reflector") at line 226

/gsd:spike command (.claude/commands/gsd/spike.md)
  -> run-spike workflow (get-shit-done/workflows/run-spike.md)
    -> gsd-spike-runner agent (.claude/agents/gsd-spike-runner.md)
       via @-references at lines 8 and 164

/gsd:collect-signals command (commands/gsd/collect-signals.md)  [NOT deleted]
  -> collect-signals workflow (get-shit-done/workflows/collect-signals.md)
    -> gsd-signal-collector agent (.claude/agents/gsd-signal-collector.md)
       via Task(subagent_type="gsd-signal-collector") at line 129
```

### Anti-Patterns to Avoid
- **Modifying workflow files to remove agent references:** The workflows are correct -- the agents were supposed to exist. Restore the agents, not modify the workflows.
- **Creating new/different agent content:** The pre-deletion content is the authoritative version with all migrations already applied. Do not rewrite from scratch.
- **Committing without `git add -f`:** The `.claude/` directory is gitignored (`.gitignore` line 9). Normal `git add` will silently skip these files. Must use `git add -f`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Extracting pre-deletion content | Manual reconstruction | `git show f664984^:<path>` | Exact content, zero risk of omission |
| Verifying wiring | Manual inspection | `npx vitest run tests/integration/wiring-validation.test.js` | 20 existing tests cover all 4 failure modes |

**Key insight:** The pre-deletion content at `f664984^` is the exact content we want. Phases 14 (KB migration) and 19 (provenance fields, KB script path) had already been applied to these files. The content needs zero modification.

## Common Pitfalls

### Pitfall 1: Forgetting `git add -f` for `.claude/` files
**What goes wrong:** Files are restored on disk but `git add .` or `git add .claude/agents/gsd-reflector.md` silently skips them because `.claude/` is gitignored.
**Why it happens:** `.gitignore` line 9 contains `.claude/`.
**How to avoid:** Always use `git add -f .claude/agents/gsd-reflector.md` (etc.) for files under `.claude/`.
**Warning signs:** `git status` shows "nothing to commit" after writing files.

### Pitfall 2: Restoring from wrong commit
**What goes wrong:** Content might have stale KB paths (`.claude/gsd-knowledge/` instead of `~/.gsd/knowledge/`).
**Why it happens:** Using a commit before Phases 14/19 applied KB path fixes.
**How to avoid:** Restore from `f664984^` (the commit immediately before deletion). This commit has all prior migrations applied.
**Warning signs:** Grep for `.claude/gsd-knowledge/` in restored content.

### Pitfall 3: Thinking workflow files need changes
**What goes wrong:** Editing workflow files that are already correct, introducing new bugs.
**Why it happens:** The commit message for f664984 claims "logic moved to workflow orchestrators" but this is false.
**How to avoid:** The fix is purely additive (restore 5 files). The 3 workflow files modified by f664984 received legitimate KB path fixes and a research-first advisory that should be kept.
**Warning signs:** Any edits to `get-shit-done/workflows/*.md` during this phase.

### Pitfall 4: Missing that commands belong in `.claude/commands/gsd/` not `commands/gsd/`
**What goes wrong:** Restoring to the wrong directory, or creating duplicates.
**Why it happens:** There are two command directories -- upstream (`commands/gsd/`) and fork-specific (`.claude/commands/gsd/`). The reflect and spike commands are fork additions.
**How to avoid:** The test checks `commands/gsd/reflect.md` first, then falls back to `.claude/commands/gsd/reflect.md`. The original location was `.claude/commands/gsd/`. Restore there.
**Warning signs:** Files appearing in upstream `commands/gsd/` directory.

## Detailed Findings

### 1. Exact Test Failures (4 of 20)

Running `npx vitest run tests/integration/wiring-validation.test.js` produces exactly 4 failures:

| # | Test | Failure | Root Cause |
|---|------|---------|------------|
| 1 | `@-references in workflows resolve` | `run-spike.md: @.claude/agents/gsd-spike-runner.md` broken (2 refs) | `gsd-spike-runner.md` deleted |
| 2 | `subagent_type values match agent files` | `gsd-signal-collector` and `gsd-reflector` have no matching agent files | `gsd-signal-collector.md` and `gsd-reflector.md` deleted |
| 3 | `reflect command exists` | ENOENT for both `commands/gsd/reflect.md` and `.claude/commands/gsd/reflect.md` | `reflect.md` command deleted |
| 4 | `spike command exists` | ENOENT for both `commands/gsd/spike.md` and `.claude/commands/gsd/spike.md` | `spike.md` command deleted |

### 2. Pre-Deletion Content Analysis

All 5 files at `f664984^` already have:
- Correct KB paths: `~/.gsd/knowledge/` (from Phase 14 migration)
- Correct KB rebuild script path: `~/.gsd/bin/kb-rebuild-index.sh` (from Phase 19)
- Provenance field instructions: `runtime`, `model`, `gsd_version` (from Phase 19)
- No stale `.claude/gsd-knowledge/` references

File sizes at pre-deletion:
| File | Lines | Size Description |
|------|-------|-----------------|
| `gsd-reflector.md` | 278 | Reflection agent: pattern detection, phase-end comparison, lesson distillation, drift analysis |
| `gsd-signal-collector.md` | 209 | Signal collection agent: deviation, config mismatch, struggle detection |
| `gsd-spike-runner.md` | 474 | Spike execution agent: Build/Run/Document phases, DECISION.md, KB persistence |
| `reflect.md` (command) | 87 | Command entry point routing to reflect workflow |
| `spike.md` (command) | 64 | Command entry point routing to run-spike workflow |

### 3. Valid Changes from f664984 to Keep

The commit made legitimate changes to 3 workflow files that should NOT be reverted:

**`collect-signals.md`:**
- Fixed KB path: `.claude/gsd-knowledge/` -> `~/.gsd/knowledge/` (3 occurrences)
- Removed inline runtime capability check (handled by capability matrix)

**`reflect.md`:**
- Fixed KB path: `$HOME/.claude/gsd-knowledge` -> `$HOME/.gsd/knowledge` (1 occurrence)
- Fixed KB path: `.claude/gsd-knowledge/` -> `~/.gsd/knowledge/` (3 occurrences)
- Removed inline runtime capability check

**`run-spike.md`:**
- Added research-first advisory step (Step 2, ~45 lines)
- Renumbered subsequent steps (2->3, 3->4, etc.)
- Removed inline runtime capability check

These changes are already in the current codebase and are correct.

### 4. Dangling References in Active Source Files (Non-`.planning/`)

| File | Line(s) | Reference | Type | Fix |
|------|---------|-----------|------|-----|
| `get-shit-done/workflows/run-spike.md` | 8, 164 | `@.claude/agents/gsd-spike-runner.md` | @-reference | Restore agent file |
| `get-shit-done/workflows/run-spike.md` | 162 | `gsd-spike-runner` (text reference) | Narrative | Restore agent file |
| `get-shit-done/workflows/collect-signals.md` | 85, 129 | `gsd-signal-collector` | subagent_type + text | Restore agent file |
| `get-shit-done/workflows/reflect.md` | 184, 226 | `gsd-reflector` | subagent_type + text | Restore agent file |
| `get-shit-done/workflows/signal.md` | 19 | `gsd-signal-collector`, `gsd-spike-runner` | Text reference | Restore agent files |
| `get-shit-done/references/spike-execution.md` | 12, 66, 84, 99 | `gsd-spike-runner` | Text reference | Restore agent file |
| `get-shit-done/references/signal-detection.md` | 8, 107 | `gsd-signal-collector` | Text reference | Restore agent file |
| `commands/gsd/collect-signals.md` | 38 | `gsd-signal-collector` | Text reference | Restore agent file |
| `commands/gsd/signal.md` | 182 | `gsd-signal-collector` | Text reference | Restore agent file |

**All dangling references are resolved by restoring the 3 agent spec files.** No reference docs, workflow files, or command files need modification.

### 5. The `.planning/` References (Not Actionable)

Dozens of references exist in `.planning/` phase artifacts (PLANs, SUMMARYs, VERIFICATIONs, RESEARCHs). These are historical records and are NOT actionable. The wiring validation test explicitly skips `.planning/` references (line 37: `if (ref.includes('.planning')) continue`).

## Open Questions

None. This phase has no ambiguity:
- The commit that caused damage is identified (`f664984`)
- The pre-deletion content is available via `git show f664984^:<path>`
- The pre-deletion content already has all KB path fixes applied
- The test suite (`wiring-validation.test.js`) validates all 4 failure modes
- The fix is purely additive (restore 5 files, verify tests pass)

## Sources

### Primary (HIGH confidence)
- `git show f664984` -- commit diff showing exact deletions and modifications
- `git show f664984^:<path>` for all 5 deleted files -- verified pre-deletion content
- `tests/integration/wiring-validation.test.js` -- 20 tests, 4 currently failing
- `npx vitest run` output -- confirmed exact failure messages and root causes
- `.gitignore` line 9 -- confirmed `.claude/` is gitignored requiring `git add -f`
- Direct file reads of all 3 workflow files showing current dangling references
- Direct file reads of reference docs showing agent mentions

## Metadata

**Confidence breakdown:**
- File restoration approach: HIGH -- git history is deterministic, pre-deletion content verified
- KB path correctness: HIGH -- grep confirmed `~/.gsd/knowledge/` and `~/.gsd/bin/` in pre-deletion content
- Test coverage: HIGH -- all 4 failures traced to specific root causes, all fixable by file restoration
- No workflow changes needed: HIGH -- diff of f664984 confirms workflow changes were KB path fixes (keep) + runtime check removal (keep) + advisory addition (keep)

**Research date:** 2026-02-23
**Valid until:** Indefinite (git history does not expire)
