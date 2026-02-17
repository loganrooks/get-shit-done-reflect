---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/unit/install.test.js
  - tests/integration/kb-write.test.js
  - tests/e2e/real-agent.test.js
autonomous: true

must_haves:
  truths:
    - "No test in the suite creates a thing and then asserts it exists without invoking application code"
    - "Test count decreases honestly (self-fulfilling tests removed, not replaced with equivalent fakes)"
    - "All remaining tests pass"
  artifacts:
    - path: "tests/unit/install.test.js"
      provides: "Real unit and integration tests only (lines 18-137 deleted)"
      contains: "merged installer flags"
    - path: "tests/e2e/real-agent.test.js"
      provides: "Honest scaffold with .todo() or skip+fail pattern"
      contains: "Not yet implemented"
  key_links:
    - from: "tests/unit/install.test.js"
      to: "bin/install.js"
      via: "import and direct function calls"
      pattern: "replacePathsInContent|migrateKB|countKBEntries"
---

<objective>
Remove self-fulfilling tests (C7-C10) that test Node.js stdlib instead of application code.

Purpose: These tests inflate the count by asserting things they themselves created (mkdir then check exists, writeFile then readFile). They provide zero regression protection. Removing them makes the test suite honest.

Output: Cleaner test files, reduced test count, all remaining tests pass.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Current state: 155 passing tests, 4 skipped (159 total).

The three files to modify:
@tests/unit/install.test.js
@tests/integration/kb-write.test.js
@tests/e2e/real-agent.test.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Delete self-fulfilling tests from install.test.js and delete kb-write.test.js</name>
  <files>tests/unit/install.test.js, tests/integration/kb-write.test.js</files>
  <action>
  In `tests/unit/install.test.js`:
  - DELETE the four describe blocks from lines 18-137:
    - `directory structure` (lines 19-58): creates dirs with fs.mkdir then asserts they exist
    - `file copying` (lines 60-85): does string replace inline then asserts result, and writes a file then checks chmod -- never calls replacePathsInContent
    - `settings.json handling` (lines 87-122): writes JSON with fs.writeFile then reads it back
    - `version management` (lines 124-137): writes a file then reads it back
  - Keep the outer `describe('install script', () => {` wrapper intact
  - Keep EVERYTHING from line 139 onward (`merged installer flags`, `two-pass path replacement`, `KB migration`, `Codex CLI integration`, `Gemini CLI MCP tool preservation`, etc.) -- these are GOOD tests that invoke real application code
  - Keep all imports at the top of the file unchanged (they are used by the remaining tests)

  DELETE the entire file `tests/integration/kb-write.test.js`:
  - Every test in this file writes with fs.writeFile and reads with fs.readFile
  - No application function is ever imported or invoked
  - The "deduplication" test (C10) just compares two identical strings
  - There are no KB write functions exported to test against
  </action>
  <verify>
  Run `npm test -- --run` and confirm:
  1. No test failures
  2. Test count decreased (was 155 passing; should drop by ~8 from install.test.js lines 18-137 and ~6 from kb-write.test.js = ~14 fewer tests, so roughly 141 passing)
  3. `grep -n "creates commands/gsd directory\|preserves file permissions\|creates settings.json\|writes VERSION file" tests/unit/install.test.js` returns nothing
  4. `ls tests/integration/kb-write.test.js` returns "No such file"
  </verify>
  <done>
  Self-fulfilling tests in install.test.js lines 18-137 are gone. kb-write.test.js is deleted. All remaining tests pass. Test count is honestly lower.
  </done>
</task>

<task type="auto">
  <name>Task 2: Rewrite real-agent.test.js as honest scaffold</name>
  <files>tests/e2e/real-agent.test.js</files>
  <action>
  Rewrite `tests/e2e/real-agent.test.js` to be an honest test scaffold:

  1. Keep the file header comment explaining purpose, run modes, and environment requirements
  2. Keep the `SKIP_REAL_AGENT_TESTS` guard and `describe.skipIf(...)` wrapper
  3. Keep the `beforeAll` block that checks for Claude CLI and ANTHROPIC_API_KEY
  4. Replace the three describe blocks with `.todo()` tests that clearly state what they WILL test:

  ```javascript
  describe('signal collection chain', () => {
    it.todo('collects signals from completed plan execution — requires spawning real Claude agent')
    it.todo('handles agent failure gracefully — requires spawning real Claude agent')
  })

  describe('API interaction', () => {
    it.todo('can make authenticated API request — requires real ANTHROPIC_API_KEY usage')
  })

  describe('signal verification', () => {
    it.todo('verifies signal file format after real agent collection — requires real agent output')
  })
  ```

  5. Remove all `tmpdirTest` wrappers (no longer needed -- .todo() tests have no body)
  6. Remove all self-fulfilling assertions (file existence checks on files the test created)
  7. Keep imports minimal: only `describe, it, expect, beforeAll` from vitest, and `execSync` from child_process (for the beforeAll CLI check)
  8. Remove unused imports: `tmpdirTest`, `spawn`, `path`, `fs`
  </action>
  <verify>
  Run `npm test -- --run` and confirm:
  1. All tests pass
  2. The e2e file shows todo tests in output (not fake passing tests)
  3. `grep -n "planExists\|hasPlanning\|hasApiKey.*true\|mockSignal" tests/e2e/real-agent.test.js` returns nothing (no self-fulfilling assertions)
  4. `grep -n "\.todo(" tests/e2e/real-agent.test.js` returns 4 matches
  </verify>
  <done>
  real-agent.test.js is an honest scaffold: it declares what tests WILL do when implemented, without pretending to test anything now. No self-fulfilling assertions remain.
  </done>
</task>

</tasks>

<verification>
After both tasks:

1. `npm test -- --run` passes with zero failures
2. New test count is lower than 155 (honest reduction, not inflated replacement)
3. No test in the suite creates a filesystem artifact and then asserts it exists without invoking application code
4. `tests/integration/kb-write.test.js` does not exist
5. `tests/e2e/real-agent.test.js` contains only `.todo()` test cases behind the skip guard

Record the final test count (passing + skipped + todo) for the summary.
</verification>

<success_criteria>
- C7: 8 self-fulfilling tests in install.test.js lines 18-137 deleted
- C8: kb-write.test.js deleted entirely (all 6 tests were self-fulfilling)
- C9: real-agent.test.js rewritten as honest .todo() scaffold
- C10: Resolved by C8 (dedup test was in kb-write.test.js)
- All remaining tests pass
- Test count honestly decreased
</success_criteria>

<output>
After completion, report the before/after test counts and confirm all 4 issues (C7-C10) are resolved.
</output>
