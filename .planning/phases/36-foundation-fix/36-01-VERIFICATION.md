---
phase: 36-foundation-fix
plan: 01
verified: 2026-03-03T13:46:39Z
status: gaps_found
score: 4/5 must-haves verified
re_verification: false
gaps:
  - truth: "npm test passes with zero failures"
    status: partial
    reason: "All 156 tests pass locally (5 test files, 0 failures), but the fix commits (07b7dd1, 632fd18) have not been pushed to origin/main. CI has not run on these changes. The 'CI green on main' component of the phase goal is unconfirmed."
    artifacts:
      - path: "tests/integration/wiring-validation.test.js"
        issue: "Commits not pushed to remote; CI run on origin/main still reflects pre-fix state (c7b7c1f)"
    missing:
      - "Push commits 07b7dd1, 632fd18 (and others) to origin/main so CI runs on the fixed tests"
---

# Phase 36: Foundation Fix Verification Report

**Phase Goal:** CI pipeline is trustworthy -- tests check the right directories, a meta-test prevents path recurrence, and CI is green on main
**Verified:** 2026-03-03T13:46:39Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | `wiring-validation.test.js` reads agent files from `agents/` (npm source), not `.claude/agents/` | VERIFIED | Line 145: `readMdFiles('agents')`. Line 175: `'agents'` in dirs array. All `readMdFiles(...)` calls use `commands/gsd`, `get-shit-done/workflows`, `agents`, `get-shit-done/templates`. No `readMdFiles('.claude/...')` assertion paths. |
| 2  | `wiring-validation.test.js` reads KB templates from `agents/kb-templates/`, not `.claude/agents/kb-templates/` | VERIFIED | Lines 222, 231, 240, 251, 259, 267: all six KB template `path.join` calls use `agents/kb-templates/`. Line 387: `pathExists('agents/kb-templates/signal.md')`. Zero `.claude/agents/kb` references in the file. |
| 3  | A meta-test scans all test files and fails if any introduces `.claude/` as a primary assertion path | VERIFIED | Lines 407-457: `describe('test hygiene')` block with `it('no test file uses .claude/ as a primary assertion path')`. Three `PRIMARY_ASSERTION_PATTERNS` (readMdFiles, path.join(REPO_ROOT, ...), pathExists). Four EXEMPT_FILES. Confirmed present and passing (156 tests pass). |
| 4  | reflect/spike command tests read directly from `commands/gsd/` without `.claude/` fallback | VERIFIED | Lines 283-297: `reflect.md` test reads directly from `path.join(REPO_ROOT, 'commands/gsd/reflect.md')`. Lines 291-297: `spike.md` test reads directly from `path.join(REPO_ROOT, 'commands/gsd/spike.md')`. No try/catch fallback to `.claude/commands/gsd/` remains. |
| 5  | npm test passes with zero failures | PARTIAL | All 156 tests pass locally (5 files, 4 todo). Fix commits (07b7dd1, 632fd18) are local-only -- not pushed to origin/main. CI has not run on these changes. `origin/main` is 6 commits behind local `main`. The CI green component of the phase goal is unconfirmed. |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/integration/wiring-validation.test.js` | All wiring assertions target npm source; meta-test prevents recurrence | VERIFIED | File exists, 458 lines. Contains `readMdFiles('agents')` at line 145, `agents/kb-templates/` at 6 KB template path.join calls, `describe('test hygiene')` meta-test block at line 407. Key contains pattern: `readMdFiles('agents')` confirmed at line 145. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `wiring-validation.test.js` | `agents/` | `readMdFiles` and `path.join` assertions | WIRED | `readMdFiles('agents')` at line 145; `'agents'` in dirs array at line 175 |
| `wiring-validation.test.js` | `agents/kb-templates/` | `path.join(REPO_ROOT, 'agents/kb-templates/...')` | WIRED | Six KB template path.join calls (lines 222, 231, 240, 251, 259, 267) all use `agents/kb-templates/` |
| `refToRepoPath` function | `agents/` | `~/.claude/agents/ -> agents/` mapping | WIRED | Line 48-49: `ref.replace('~/.claude/agents/', 'agents/')` -- maps agent @-references to npm source, not install target |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| CI-01 (CI pipeline passes on main without admin bypass) | PARTIAL | Tests pass locally; commits not yet on remote main; CI run not yet triggered |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/integration/wiring-validation.test.js` | 204 | `.claude/agents/` fallback in subagent_type test | INFO | Legitimate: npm source checked first (line 203), `.claude/` is secondary fallback for CI. Excluded from meta-test EXEMPT_FILES because it does not match any PRIMARY_ASSERTION_PATTERNS (pattern uses `path.join(REPO_ROOT, '.claude', ...)` not `path.join(REPO_ROOT, '.claude/...')`). Passes meta-test. |

No blocker anti-patterns found in `wiring-validation.test.js`.

### Human Verification Required

None for code correctness. The CI status gap is a deployment action, not a human judgment call.

### Gaps Summary

Four of five truths are fully verified in the codebase. The code changes are correct and complete:

- `readMdFiles` no longer reads from `.claude/agents/`
- `refToRepoPath` correctly maps `~/.claude/agents/` to `agents/`
- All KB template paths use `agents/kb-templates/`
- reflect/spike command tests have no `.claude/` fallback
- The meta-test `describe('test hygiene')` is present with the correct three patterns and four exempt files

The single gap is operational, not a code defect: the fix commits exist locally but have not been pushed to `origin/main`. The phase goal includes "CI is green on main" which requires the commits to be on the remote branch and a CI run to complete. The last CI run on `origin/main` was against commit `c7b7c1f` (pre-fix). Locally, `npm test` passes with 156 tests and 0 failures, confirming the code changes are correct.

**To close the gap:** Push the 6 local commits to `origin/main` (includes the roadmap, research, plan, two fix commits, and summary). CI will run on push and confirm green.

---

_Verified: 2026-03-03T13:46:39Z_
_Verifier: Claude (gsd-verifier)_
