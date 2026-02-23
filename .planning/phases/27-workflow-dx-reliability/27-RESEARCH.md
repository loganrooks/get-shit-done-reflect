# Phase 27: Workflow DX & Reliability - Research

**Researched:** 2026-02-23
**Domain:** Developer experience, installer reliability, shell script portability
**Confidence:** HIGH

## Summary

Phase 27 addresses four distinct improvement areas that share a common theme: making GSD faster for trivial work, more informative when things go wrong, and more portable across environments. The phase has no external library dependencies -- all four requirements involve modifying existing GSD-authored files (workflow markdown, installer JavaScript, shell scripts).

The `/gsd:quick` workflow currently always spawns a planner agent (gsd-planner) and then an executor agent (gsd-executor) via the `Task()` tool, even for trivial one-line tasks like "fix a typo in README". DX-01/DX-02 require adding a complexity detection gate in the quick workflow (`get-shit-done/workflows/quick.md`) that short-circuits to inline execution for trivial tasks. The installer (`bin/install.js`) performs ~50 distinct `fs.*Sync` file operations, most without try-catch, meaning a single permission error produces an unhelpful stack trace. DX-03 requires wrapping the three critical operations (`mkdirSync`, `cpSync`, `renameSync`) in error handlers. The four shell scripts have minor portability gaps: missing `set -o pipefail`, one hardcoded `$HOME/.gsd` path (should use `${GSD_HOME:-$HOME/.gsd}`), and a non-portable `mktemp -t` flag.

**Primary recommendation:** Implement as three independent work streams -- (1) quick workflow complexity gate in the workflow markdown, (2) installer try-catch wrappers in install.js, (3) shell script portability fixes across four `.sh` files.

## Standard Stack

### Core

No new libraries needed. All changes are to existing files:

| File | Purpose | Change Type |
|------|---------|-------------|
| `get-shit-done/workflows/quick.md` | Quick task workflow definition | Add complexity detection logic in Step 5 |
| `commands/gsd/quick.md` | Quick command definition | Possibly update description |
| `bin/install.js` | Installer script | Wrap file ops in try-catch |
| `scripts/dev-setup.sh` | Dev symlink setup | Add pipefail, use env bash |
| `scripts/dev-teardown.sh` | Dev symlink teardown | Add pipefail, use env bash |
| `tests/smoke/run-smoke.sh` | Smoke test runner | Fix GSD_HOME, fix mktemp |
| `.claude/agents/kb-rebuild-index.sh` | KB index builder | Add pipefail |
| `tests/smoke/verify-kb.sh` | KB test helpers | No changes needed (sourced, not executed) |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| vitest | Existing test framework | Testing installer error handling |
| tests/helpers/tmpdir.js | Temp directory test helper | Existing pattern for installer tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Workflow-level complexity detection | gsd-tools.js `init quick` returning a `trivial` flag | Would centralize logic in JS but the workflow markdown is the orchestrator -- it needs to branch. Better to keep detection in the workflow and have gsd-tools.js return metadata the workflow can evaluate. |
| Inline execution in quick workflow | Dedicated lightweight agent (gsd-quick-executor) | Adds another agent to maintain. The whole point of DX-01 is to avoid spawning agents at all for trivial tasks. |
| Per-operation try-catch in installer | Global process.on('uncaughtException') handler | Loses operation context. The requirement specifically says "descriptive error messages identifying the operation, source path, and destination path." |

## Architecture Patterns

### Pattern 1: Complexity Gate in Quick Workflow

**What:** Before spawning the planner agent in Step 5 of `quick.md`, evaluate the task description to determine if it is trivial. If trivial, skip Steps 5-6 (planner + executor spawn) and execute inline.

**When to use:** Every `/gsd:quick` invocation.

**Current flow:**
```
Step 1: Get description -> Step 2: Init -> Step 3-4: Create dirs -> Step 5: Spawn planner -> Step 6: Spawn executor -> Step 7-8: State + commit
```

**Proposed flow:**
```
Step 1: Get description -> Step 2: Init -> Step 3-4: Create dirs ->
  IF trivial:
    Step 5a: Execute inline (no agent spawn) -> Step 7-8: State + commit
  ELSE:
    Step 5: Spawn planner -> Step 6: Spawn executor -> Step 7-8: State + commit
```

**Trivial task heuristics (all must be true):**
- Description length < ~100 characters (approximately 15-20 words)
- Single concern: no "and", "then", "also", or numbered lists suggesting multiple steps
- No multi-file indicators: no mention of "files", "across", "multiple", "several"
- No complex domain keywords: no "refactor", "migrate", "integrate", "architecture"

**Key insight:** The complexity gate is a heuristic -- it should err on the side of caution (fall back to full flow if uncertain). False negatives (treating complex as trivial) waste context; false positives (treating trivial as complex) only waste a planner spawn.

### Pattern 2: Descriptive Error Wrapper for File Operations

**What:** A helper function that wraps `fs.*Sync` calls with try-catch, producing error messages that identify the operation, source, and destination.

**Example implementation pattern:**
```javascript
/**
 * Safe wrapper for fs operations with descriptive error messages.
 * @param {string} operation - Name of the operation (e.g., 'mkdirSync', 'cpSync')
 * @param {Function} fn - The fs function to call
 * @param {string} src - Source path (or target for mkdir)
 * @param {string} [dest] - Destination path (for copy/rename)
 */
function safeFs(operation, fn, src, dest) {
  try {
    return fn();
  } catch (err) {
    const destMsg = dest ? ` -> ${dest}` : '';
    console.error(`  ${yellow}!${reset} ${operation} failed: ${src}${destMsg}`);
    console.error(`    Error: ${err.message}`);
    if (err.code === 'EACCES') {
      console.error(`    Check: file/directory permissions`);
    } else if (err.code === 'ENOSPC') {
      console.error(`    Check: disk space`);
    } else if (err.code === 'ENOENT') {
      console.error(`    Check: source path exists`);
    }
    throw err;  // Re-throw to let caller handle
  }
}

// Usage:
safeFs('mkdirSync', () => fs.mkdirSync(dir, { recursive: true }), dir);
safeFs('cpSync', () => fs.cpSync(src, dest, { recursive: true }), src, dest);
safeFs('renameSync', () => fs.renameSync(src, dest), src, dest);
```

**Key insight:** The success criteria says "wrapped in try-catch blocks that produce descriptive error messages identifying the operation, source path, and destination path." A centralized `safeFs()` helper achieves this without bloating every call site.

### Pattern 3: Shell Script Portability Fixes

**What:** Three targeted fixes across shell scripts.

**Fix 1 -- `set -o pipefail`:**
Currently `kb-rebuild-index.sh` and `kb-create-dirs.sh` have neither `set -e` nor `set -o pipefail`. The `run-smoke.sh` has `set -uo pipefail` but intentionally omits `-e`. The dev scripts have `set -e` but not pipefail.

Scripts that should add `set -o pipefail`:
- `kb-rebuild-index.sh` -- uses pipelines (`grep ... | head -1 | sed ...`) where errors in early commands would be swallowed
- `dev-setup.sh` -- add `set -o pipefail` alongside existing `set -e`
- `dev-teardown.sh` -- add `set -o pipefail` alongside existing `set -e`
- `kb-create-dirs.sh` -- minimal (no pipelines), but add for consistency

**Fix 2 -- `GSD_HOME` in `run-smoke.sh`:**
Line 31: `KB_DIR="$HOME/.gsd/knowledge"` should become `KB_DIR="${GSD_HOME:-$HOME/.gsd}/knowledge"`

**Fix 3 -- Portable `mktemp`:**
Line 65 in `run-smoke.sh`: `mktemp -d -t gsd-smoke-XXXXXX`
The `-t` flag is a BSD/macOS extension. On Linux, `mktemp -d` with a template suffix is more portable: `mktemp -d /tmp/gsd-smoke-XXXXXX` or simply `mktemp -d` (template in TMPDIR).

Most portable form: `mktemp -d "${TMPDIR:-/tmp}/gsd-smoke-XXXXXX"` -- though `mktemp -d` alone works on both GNU and BSD mktemp implementations.

**Fix 4 -- Shebang portability:**
`dev-setup.sh` and `dev-teardown.sh` use `#!/bin/bash`. The more portable form is `#!/usr/bin/env bash` (used by the other scripts already). This is a minor improvement.

### Anti-Patterns to Avoid

- **Over-engineering complexity detection:** Don't use NLP/LLM classification for trivial vs complex. Simple heuristics on string length and keyword presence are sufficient and instant.
- **Swallowing errors in installer:** The `safeFs()` wrapper should log AND re-throw. Silently continuing after a failed `renameSync` corrupts state.
- **Changing shell script behavior:** Adding `set -o pipefail` could surface previously-hidden errors. Each script should be tested after the change to ensure no regressions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Task complexity classification | ML model or LLM call | Simple string heuristics | Adding latency/cost defeats the purpose. A 10-line heuristic is fast, deterministic, and testable. |
| Error message formatting | Custom error class hierarchy | Template string in `safeFs()` | The requirement is for descriptive console output, not programmatic error handling. |
| Shell portability testing | Custom CI matrix | Manual testing + `shellcheck` | Only 4 scripts, each < 200 lines. ShellCheck catches most portability issues statically. |

**Key insight:** This phase is about small, targeted improvements to existing code -- not building new systems.

## Common Pitfalls

### Pitfall 1: Complexity Gate Too Aggressive (False Negatives)

**What goes wrong:** Trivial heuristic marks complex tasks as trivial, leading to incomplete execution without planning.
**Why it happens:** Threshold too high (e.g., 200 chars instead of 100), missing keyword checks.
**How to avoid:** Start conservative (low character threshold, many exclusion keywords). It's better to unnecessarily spawn a planner than to botch a complex task.
**Warning signs:** Tasks with multiple implicit steps ("update the tests and fix the linting errors") classified as trivial.

### Pitfall 2: Inline Execution Missing Artifacts

**What goes wrong:** When trivial tasks skip the planner/executor, the expected artifacts (PLAN.md, SUMMARY.md) don't get created, breaking STATE.md tracking.
**Why it happens:** The quick workflow Steps 7-8 expect plan and summary files to exist.
**How to avoid:** The inline execution path must still create a minimal PLAN.md and SUMMARY.md (can be generated by the orchestrating agent itself rather than a spawned agent). Alternatively, the state update step can be adapted for inline tasks.
**Warning signs:** STATE.md "Quick Tasks Completed" table has empty Commit or Directory columns.

### Pitfall 3: Installer Error Wrapper Changes Behavior

**What goes wrong:** Adding try-catch changes the control flow -- previously a thrown error would crash immediately, now it might continue past the error.
**Why it happens:** Wrapping in try-catch without re-throwing.
**How to avoid:** Always re-throw after logging. The wrapper is for better error messages, not error suppression.
**Warning signs:** `failures` array at end of install doesn't grow when operations fail.

### Pitfall 4: `set -o pipefail` Surfacing Hidden Errors

**What goes wrong:** Adding pipefail to `kb-rebuild-index.sh` causes it to fail on empty KB (when `grep` returns exit code 1 for "no match").
**Why it happens:** `grep` returns exit 1 when no match found; without pipefail this is swallowed.
**How to avoid:** Audit each pipeline after adding pipefail. Use `grep ... || true` for expected-empty cases, or `grep ... 2>/dev/null` patterns already present.
**Warning signs:** `kb-rebuild-index.sh` exits with error on fresh installs with empty knowledge base.

## Code Examples

### Example 1: Trivial Task Detection Heuristic

```markdown
<!-- In quick.md workflow, between Step 4 and Step 5 -->

**Step 4b: Assess task complexity**

Evaluate `$DESCRIPTION` for complexity signals:

```
isTrivial = true  IF ALL of:
  - length(DESCRIPTION) < 100 characters
  - DESCRIPTION does not contain: "and then", "also", "multiple", "several", "across", "refactor", "migrate", "integrate"
  - DESCRIPTION does not contain numbered steps (1. 2. 3. or bullet lists)
  - DESCRIPTION is a single sentence (no newlines, no semicolons separating clauses)

isTrivial = false  OTHERWISE (fall back to planner+executor)
```

If `isTrivial`:
  - Skip Steps 5-6 entirely
  - Execute the task directly inline (the current orchestrating agent does the work)
  - Create minimal PLAN.md: single task, description from user
  - Create minimal SUMMARY.md: task completed, commit hash
  - Continue to Step 7 (state update)
```

### Example 2: Installer safeFs Wrapper

Source: Derived from Node.js fs error codes documentation.

```javascript
function safeFs(operation, fn, src, dest) {
  try {
    return fn();
  } catch (err) {
    const destMsg = dest ? ` -> ${dest}` : '';
    const hint = {
      EACCES: 'Check file/directory permissions',
      ENOSPC: 'Check available disk space',
      ENOENT: 'Source path does not exist',
      EPERM: 'Operation not permitted (check ownership)',
      EEXIST: 'Destination already exists',
    }[err.code] || '';
    console.error(`  ${yellow}!${reset} ${operation} failed: ${src}${destMsg}`);
    console.error(`    Error: ${err.message}`);
    if (hint) console.error(`    Hint: ${hint}`);
    throw err;
  }
}
```

### Example 3: Shell Script Fixes

**kb-rebuild-index.sh -- add pipefail:**
```bash
#!/usr/bin/env bash
set -o pipefail
# ... rest of script
```

**run-smoke.sh -- fix GSD_HOME and mktemp:**
```bash
KB_DIR="${GSD_HOME:-$HOME/.gsd}/knowledge"
# ...
WORK_DIR=$(mktemp -d)
```

**dev-setup.sh / dev-teardown.sh -- add pipefail, use env bash:**
```bash
#!/usr/bin/env bash
set -eo pipefail
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `/gsd:quick` always spawns planner+executor | Phase 27 adds trivial task bypass | This phase | Faster simple tasks, same quality for complex |
| Installer `fs.*Sync` calls unprotected | `safeFs()` wrapper with descriptive errors | This phase | Users see actionable error messages on failure |
| Shell scripts use `set -e` only | `set -eo pipefail` | This phase | Pipeline errors no longer silently swallowed |

**Deprecated/outdated:**
- The `-t` flag in `mktemp` for template prefix is a BSD extension; GNU coreutils deprecated it in favor of the `--tmpdir` long option. Use positional template argument instead.

## Open Questions

1. **Inline execution artifact format**
   - What we know: The full flow creates `{num}-PLAN.md` and `{num}-SUMMARY.md`. STATE.md tracks both.
   - What's unclear: Should the inline path create minimal stubs of these files for tracking consistency, or should the state update be adapted to work without them?
   - Recommendation: Create minimal stubs. Keeps the tracking system consistent. The overhead is trivial (two small file writes).

2. **Complexity threshold tuning**
   - What we know: The milestone candidate suggests "< N tokens." Success criteria says "short, single concern."
   - What's unclear: Exact character/word threshold. 100 chars? 150 chars? 50 words?
   - Recommendation: Start with 100 characters AND fewer than 20 words. This is conservative -- most trivial tasks ("fix typo in README", "update version to 1.5.0", "add .gitignore entry") are under 50 characters. Can be tuned later based on experience.

3. **Which `fs.*Sync` calls to wrap**
   - What we know: Success criteria specifies `fs.mkdirSync`, `fs.cpSync`, `fs.renameSync`. The installer has ~50 distinct `fs.*Sync` calls total.
   - What's unclear: Should ALL file operations be wrapped, or only the three named ones?
   - Recommendation: Wrap at minimum the three named operations. Also wrap `fs.rmSync` (5 calls, destructive operation). Leave `fs.writeFileSync`, `fs.copyFileSync`, `fs.readFileSync` as-is for now since they already have decent Node.js error messages.

## Existing Code Inventory

### Quick Workflow Files (DX-01, DX-02)

| File | Location | Lines | Purpose |
|------|----------|-------|---------|
| `quick.md` (workflow) | `get-shit-done/workflows/quick.md` | 231 | Main workflow logic (Steps 1-8) |
| `quick.md` (command - installed) | `commands/gsd/quick.md` | 39 | Command entry point (refs workflow) |
| `quick.md` (command - source) | `.claude/commands/gsd/quick.md` | 39 | Same, source copy |
| `gsd-tools.js init quick` | `get-shit-done/bin/gsd-tools.js:4267-4312` | 46 | Init function for quick workflow |
| `gsd-planner.md` | `.claude/agents/gsd-planner.md` | 1210 | Planner agent spawned by Step 5 |
| `gsd-executor.md` | `.claude/agents/gsd-executor.md` | 458 | Executor agent spawned by Step 6 |

### Installer Files (DX-03)

| File | Location | Lines | fs.*Sync calls |
|------|----------|-------|----------------|
| `install.js` | `bin/install.js` | ~2100 | ~50 total |

Breakdown of the three named operations:
- `fs.mkdirSync`: 14 calls (lines 257-259, 329, 346, 913, 929, 1133, 1180, 1626, 1808, 1899, 1913, 1927, 1961, 2029)
- `fs.cpSync`: 2 calls (lines 243, 300)
- `fs.renameSync`: 1 call (line 319)

Also relevant:
- `fs.rmSync`: 5 calls (lines 909, 1178, 1334, 1359, 1368)
- `fs.writeFileSync`: 14 calls (various)
- `fs.unlinkSync`: 7 calls (various)
- `fs.copyFileSync`: 3 calls (lines 358, 2008, 2035)

### Shell Scripts (DX-04)

| File | Location | Lines | Issues |
|------|----------|-------|--------|
| `kb-rebuild-index.sh` | `.claude/agents/kb-rebuild-index.sh` | 168 | Missing `set -o pipefail`, uses many pipelines |
| `kb-create-dirs.sh` | `.claude/agents/kb-create-dirs.sh` | 15 | Missing `set -o pipefail` (minor -- no pipelines) |
| `run-smoke.sh` | `tests/smoke/run-smoke.sh` | 576 | Hardcoded `$HOME/.gsd`, non-portable `mktemp -t` |
| `verify-kb.sh` | `tests/smoke/verify-kb.sh` | 178 | Sourced helper, no issues |
| `dev-setup.sh` | `scripts/dev-setup.sh` | 58 | `#!/bin/bash` (prefer `#!/usr/bin/env bash`), missing pipefail |
| `dev-teardown.sh` | `scripts/dev-teardown.sh` | 40 | `#!/bin/bash` (prefer `#!/usr/bin/env bash`), missing pipefail |

### Existing Test Coverage

| Test File | Framework | Coverage Area |
|-----------|-----------|---------------|
| `tests/unit/install.test.js` | vitest | Installer paths, KB migration, Codex/Gemini conversion |
| `tests/integration/multi-runtime.test.js` | vitest | Multi-runtime installer integration |
| `tests/smoke/run-smoke.sh` | bash | End-to-end GSD workflow regression |

New tests needed:
- Installer error handling: test that `safeFs()` produces descriptive messages for EACCES, ENOENT, ENOSPC
- Quick workflow complexity detection: unit test for trivial/complex classification (could be in gsd-tools.js if heuristic is centralized there)

## Sources

### Primary (HIGH confidence)

- **Codebase inspection** -- Direct reading of all files listed above
- `.planning/ROADMAP.md` lines 110-120 -- Phase 27 definition and success criteria
- `.planning/REQUIREMENTS.md` lines 55-58 -- DX-01 through DX-04 specifications
- `.planning/milestones/v1.15-CANDIDATE.md` lines 83-133 -- Original design notes for this work
- `get-shit-done/workflows/quick.md` -- Full current quick workflow (231 lines)
- `bin/install.js` -- Full installer source (all fs.*Sync calls audited)
- All `.sh` files in the repository (6 files audited for portability)

### Secondary (MEDIUM confidence)

- Node.js `fs` module error codes -- `EACCES`, `ENOENT`, `ENOSPC`, `EPERM`, `EEXIST` are standard across Node.js versions
- `mktemp` portability -- GNU coreutils vs BSD behavior differences are well-documented; the `-t` flag deprecated in GNU coreutils man page

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies, all changes to existing files
- Architecture: HIGH -- Patterns are straightforward (conditional branch, try-catch wrapper, shell flags)
- Pitfalls: HIGH -- All pitfalls identified from direct code inspection of affected files
- Complexity detection heuristic: MEDIUM -- Threshold values need tuning through real-world usage

**Research date:** 2026-02-23
**Valid until:** Indefinite (internal codebase changes only, no external dependencies)
