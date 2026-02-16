---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/unit/install.test.js
autonomous: true

must_haves:
  truths:
    - "All tests in install.test.js pass"
    - "KB path preservation tests still verify the same path-rewriting behavior"
  artifacts:
    - path: "tests/unit/install.test.js"
      provides: "Working install test suite"
  key_links:
    - from: "tests/unit/install.test.js"
      to: "get-shit-done/workflows/reflect.md"
      via: "file read in integration test"
      pattern: "workflows.*reflect\\.md"
---

<objective>
Fix 2 failing integration tests in install.test.js that read `workflows/signal.md` expecting `~/.gsd/knowledge` paths. Phase 21-01 reduced signal.md to a thin redirect with no KB paths. Both tests should read `workflows/reflect.md` instead, which still contains `~/.gsd/knowledge` references and exercises the same path preservation behavior.

Purpose: Restore green test suite after Phase 21 signal.md refactor
Output: All install.test.js tests passing
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@tests/unit/install.test.js
@get-shit-done/workflows/reflect.md (contains ~/.gsd/knowledge — the paths tests assert on)
@get-shit-done/workflows/signal.md (thin redirect, no longer has KB paths)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update both failing tests to read reflect.md instead of signal.md</name>
  <files>tests/unit/install.test.js</files>
  <action>
  Make these targeted edits in `tests/unit/install.test.js`:

  **Test 1 — "OpenCode install preserves already-migrated KB paths" (lines 348-368):**
  - Line 358: Change comment from `// Read signal.md which contains KB paths (already ~/.gsd/knowledge/ in source)` to `// Read reflect.md which contains KB paths (already ~/.gsd/knowledge/ in source)`
  - Line 359: Change variable name from `signalWorkflow` to `reflectWorkflow`
  - Line 359: Change path segment from `'workflows', 'signal.md'` to `'workflows', 'reflect.md'`
  - Line 360: Change `signalWorkflow` to `reflectWorkflow` in the `fs.readFile` call
  - Keep all 3 `expect` assertions exactly as-is (lines 363-367) — they test path behavior, not file-specific content

  **Test 2 — "Claude install preserves already-migrated KB paths" (lines 412-427):**
  - Line 420: Change comment from `// Read signal.md from Claude install` to `// Read reflect.md from Claude install`
  - Line 421: Change variable name from `signalWorkflow` to `reflectWorkflow`
  - Line 421: Change path segment from `'workflows', 'signal.md'` to `'workflows', 'reflect.md'`
  - Line 422: Change `signalWorkflow` to `reflectWorkflow` in the `fs.readFile` call
  - Keep both `expect` assertions exactly as-is (lines 425-426)

  Do NOT touch any other tests. The adjacent tests (lines 370-390, 392-410) already use `reflect.md` or other files and are passing.
  </action>
  <verify>
  Run the full install test suite:
  ```
  npx vitest run tests/unit/install.test.js
  ```
  All tests must pass, including:
  - "OpenCode install preserves already-migrated KB paths"
  - "Claude install preserves already-migrated KB paths"
  </verify>
  <done>Both previously-failing tests pass. No other tests broken. The tests now read reflect.md which contains ~/.gsd/knowledge paths, validating the same path preservation behavior as before.</done>
</task>

</tasks>

<verification>
```bash
npx vitest run tests/unit/install.test.js
```
Expected: All tests pass (0 failures)
</verification>

<success_criteria>
- Both "preserves already-migrated KB paths" tests pass
- No regressions in any other install.test.js tests
- Tests still verify that ~/.gsd/knowledge paths are preserved and legacy paths are absent
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-the-2-failing-install-test-js-tests/2-SUMMARY.md`
</output>
