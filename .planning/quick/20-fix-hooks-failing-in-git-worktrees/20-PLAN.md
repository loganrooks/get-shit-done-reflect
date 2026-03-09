---
phase: 20-fix-hooks-failing-in-git-worktrees
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/install.js
  - tests/unit/install.test.js
autonomous: true
requirements: [QUICK-20]

must_haves:
  truths:
    - "Hooks exit 0 silently when run from a git worktree that lacks .claude/"
    - "Hooks execute normally when .claude/hooks/ exists (standard project root)"
    - "All 5 hook commands in settings.json include existence guards after reinstall"
  artifacts:
    - path: "bin/install.js"
      provides: "Shell-guarded hook command generation for local installs"
      contains: "test -f"
    - path: "tests/unit/install.test.js"
      provides: "Tests for worktree-safe hook commands"
  key_links:
    - from: "bin/install.js"
      to: ".claude/settings.json"
      via: "hook command generation in install()"
      pattern: "test -f.*&&.*node"
---

<objective>
Fix GSD hooks failing when Claude Code spawns agents in git worktrees.

Purpose: When Claude Code uses `isolation: "worktree"`, the worktree does not contain `.claude/` (it is in `.gitignore`). Hook commands like `node .claude/hooks/gsdr-statusline.js` fail because the script files do not exist. The fix wraps local-install hook commands with `test -f` shell guards so they exit 0 silently when the hook script is absent.

Output: Updated installer that generates worktree-safe hook commands; reinstall updates settings.json.
</objective>

<execution_context>
@/home/rookslog/.claude/get-shit-done/workflows/execute-plan.md
@/home/rookslog/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@bin/install.js (lines 73-78: getDirName, lines 418-426: buildHookCommand, lines 2373-2391: local hook command generation)
@.claude/settings.json (current installed hook commands)
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add shell existence guards to local hook command generation</name>
  <files>bin/install.js, tests/unit/install.test.js</files>
  <behavior>
    - Test: Local install hook commands include `test -f` guard before `node` invocation
    - Test: Global install hook commands remain unchanged (use buildHookCommand with absolute paths)
    - Test: All 5 hooks (statusline, check-update, version-check, ci-status, health-check) are guarded
    - Test: Guard pattern is `test -f {path} && node {path} || true` to ensure exit 0 on missing file
  </behavior>
  <action>
In `bin/install.js`, modify the local hook command generation at lines 2377-2391. Currently the local commands are:

```js
: 'node ' + dirName + '/hooks/gsdr-statusline.js';
```

Change to wrap with shell existence guards:

```js
: 'test -f ' + dirName + '/hooks/gsdr-statusline.js && node ' + dirName + '/hooks/gsdr-statusline.js || true';
```

Apply this pattern to all 5 local hook command variables:
- `statuslineCommand` (line 2379)
- `updateCheckCommand` (line 2382)
- `versionCheckCommand` (line 2385)
- `ciStatusCommand` (line 2388)
- `healthCheckCommand` (line 2391)

To keep it DRY, extract a helper function `buildLocalHookCommand(dirName, hookName)` that returns the guarded command string. Place it near the existing `buildHookCommand` function (line 422). Pattern:

```js
function buildLocalHookCommand(dirName, hookName) {
  const hookPath = dirName + '/hooks/' + hookName;
  return 'test -f ' + hookPath + ' && node ' + hookPath + ' || true';
}
```

Then replace the 5 local ternary branches to use `buildLocalHookCommand(dirName, 'gsdr-statusline.js')` etc.

Do NOT change the global (isGlobal) paths -- those use `buildHookCommand` with absolute paths and always exist.

Add tests in `tests/unit/install.test.js` that verify:
1. `buildLocalHookCommand` returns the expected guarded string
2. The guard pattern includes `test -f`, `&&`, and `|| true`

Note: `buildHookCommand` and `buildLocalHookCommand` are not currently exported from install.js. Rather than modifying exports, test the behavior indirectly by importing and calling the functions if they are accessible, OR add a focused describe block that tests the pattern string directly (construct expected output and match).

If `install.js` does not export these functions, add a minimal export at the bottom gated by `process.env.NODE_ENV === 'test'` or simply test the string pattern logic inline in the test file.
  </action>
  <verify>
    <automated>cd /home/rookslog/workspace/projects/get-shit-done-reflect && npm test 2>&1 | tail -20</automated>
  </verify>
  <done>All 5 local hook commands use `test -f ... && node ... || true` pattern. Existing tests pass. New tests verify guard pattern.</done>
</task>

<task type="auto">
  <name>Task 2: Reinstall locally and verify settings.json updated</name>
  <files>.claude/settings.json</files>
  <action>
Run `node bin/install.js --local` to regenerate `.claude/settings.json` with the guarded hook commands.

After install, verify `.claude/settings.json` contains the `test -f` guard pattern in:
1. `statusLine.command`
2. All 4 `hooks.SessionStart` entries' `command` fields

If the settings still show old unguarded commands, the installer's "already exists" detection may be skipping the update. In that case, the hooks are detected by checking for `gsdr-check-update` etc. in existing commands. Since the new commands still contain those substrings, the dedup check will match and skip re-adding. The fix is: the installer must also UPDATE existing hook commands if they lack the guard. However, the simpler approach is: use `--force-statusline` flag and check if hooks need updating.

If existing hook detection prevents update, modify the installer's dedup checks (lines 2413-2466) to also detect and replace unguarded commands with guarded ones. Specifically, after the "has hook" check, add logic: if the hook exists but does NOT contain `test -f`, remove the old entry and re-add with the guarded command.

Verify by reading `.claude/settings.json` after install and confirming all commands contain `test -f`.
  </action>
  <verify>
    <automated>cd /home/rookslog/workspace/projects/get-shit-done-reflect && node bin/install.js --local 2>&1 && grep -c "test -f" .claude/settings.json</automated>
  </verify>
  <done>`.claude/settings.json` shows all 5 hook commands with `test -f` guards. Count of `test -f` occurrences is 5 (one per hook).</done>
</task>

</tasks>

<verification>
1. `npm test` passes (all existing + new tests)
2. `.claude/settings.json` contains `test -f` in all 5 hook commands
3. Running `bash -c "test -f nonexistent && node nonexistent || true"; echo $?` returns 0 (confirms guard exits cleanly)
</verification>

<success_criteria>
- Hook commands in settings.json use `test -f {path} && node {path} || true` pattern for local installs
- Hooks silently succeed (exit 0) when executed in worktrees without .claude/
- Hooks execute normally in standard project directories with .claude/
- All tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/20-fix-hooks-failing-in-git-worktrees/20-SUMMARY.md`
</output>
