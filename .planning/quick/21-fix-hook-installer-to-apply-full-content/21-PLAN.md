---
phase: quick-21
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/install.js
  - tests/unit/install.test.js
autonomous: true
must_haves:
  truths:
    - "Installed hooks have 'get-shit-done-reflect' in VERSION path.join args, not 'get-shit-done'"
    - "Installed hooks have /gsdr: command prefix, not /gsd:"
    - "get-shit-done-reflect-cc npm package name is NOT double-transformed"
  artifacts:
    - path: "bin/install.js"
      provides: "Hook content transformation with 4 regex passes"
      contains: "'/gsdr:'"
    - path: "tests/unit/install.test.js"
      provides: "Tests verifying new hook content transforms"
  key_links:
    - from: "bin/install.js"
      to: ".claude/hooks/gsdr-*.js"
      via: "hook installation content transforms"
      pattern: "content\\.replace"
---

<objective>
Fix the hook installer in bin/install.js to apply two missing content transformations when copying hook files: (1) quoted `'get-shit-done'` path.join arguments to `'get-shit-done-reflect'`, and (2) `/gsd:` command prefix to `/gsdr:`.

Purpose: Without these transforms, installed hooks reference wrong VERSION file paths and wrong slash commands, causing version checks and update prompts to fail silently.

Output: Updated installer with 4 content transforms for hooks, tests proving correctness, and reinstalled local hooks.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js (lines 2330-2352 — hook installation block)
@tests/unit/install.test.js (lines 1795-1897 — hook-related tests)
@hooks/gsd-check-update.js (source hook — has 'get-shit-done' in path.join at lines 16-17)
@hooks/gsd-version-check.js (source hook — has 'get-shit-done' in path.join at lines 17-18)
@hooks/gsd-statusline.js (source hook — has 'get-shit-done' at line 135, /gsd:update at line 76)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add missing content transforms to hook installer</name>
  <files>bin/install.js</files>
  <action>
In bin/install.js, locate the hook content transformation block (around lines 2342-2343). After the two existing regex replacements, add two more:

```javascript
// Existing transforms (do not modify):
content = content.replace(/get-shit-done\//g, 'get-shit-done-reflect/');
content = content.replace(/\bgsd-(?!tools)/g, 'gsdr-');
// New transforms:
content = content.replace(/\/gsd:/g, '/gsdr:');                            // Pass 3b: command prefix
content = content.replace(/'get-shit-done'/g, "'get-shit-done-reflect'");   // Hook-specific: quoted path.join args
```

Order matters: the quoted-string regex `'get-shit-done'` uses single-quote delimiters so it will NOT match `get-shit-done-reflect-cc` (the npm package name on check-update.js line 45) or any path with a trailing slash (already handled by the first regex).

Do NOT modify replacePathsInContent() — these are hook-specific transforms that run in the hook copy loop only.
  </action>
  <verify>
Run: `node -e "const c = require('fs').readFileSync('bin/install.js','utf8'); const m = c.match(/content = content\\.replace/g); console.log('Transform count:', m.length);"` — should show 4 transforms in the hook block.
  </verify>
  <done>Hook installer applies 4 content transforms: get-shit-done/ paths, gsd- prefix, /gsd: commands, and quoted 'get-shit-done' path.join args.</done>
</task>

<task type="auto">
  <name>Task 2: Add tests for new hook content transforms</name>
  <files>tests/unit/install.test.js</files>
  <action>
In tests/unit/install.test.js, find the existing hook test block "installed hooks have gsdr- prefix and correct paths" (around line 1795). After the existing test that checks for stale `get-shit-done/` refs (line 1810-1813), add new tests in the same describe block:

1. **Test: installed hooks transform quoted 'get-shit-done' to 'get-shit-done-reflect'**
   - Use the same tmpdirTest pattern with `--claude --global` install
   - Read each installed gsdr-*.js hook file
   - Assert: no hook contains the literal string `'get-shit-done'` (single-quoted, no slash)
   - Use regex `/(?<!\w)'get-shit-done'(?!\w)/` or string match to avoid matching `'get-shit-done-reflect'`
   - Specifically check gsdr-check-update.js, gsdr-version-check.js, gsdr-statusline.js

2. **Test: installed hooks transform /gsd: to /gsdr: command prefix**
   - Same tmpdirTest pattern
   - Read installed gsdr-statusline.js content
   - Assert: content does NOT contain `/gsd:` (but may contain `/gsdr:`)
   - Assert: content DOES contain `/gsdr:update` (proving the transform happened, not just absence)

3. **Test: get-shit-done-reflect-cc is NOT double-transformed**
   - Same tmpdirTest pattern
   - Read installed gsdr-check-update.js content
   - Assert: content contains `get-shit-done-reflect-cc` (the npm package name survives)
   - Assert: content does NOT contain `get-shit-done-reflect-reflect-cc` (no double-transform)

Use the same `tmpdirTest` helper and `execSync` install pattern used by surrounding tests. Follow the existing test style (no async/await beyond what tmpdirTest provides).
  </action>
  <verify>
Run: `cd /home/rookslog/workspace/projects/get-shit-done-reflect && npx vitest run tests/unit/install.test.js --reporter=verbose 2>&1 | tail -30` — all tests pass including the new ones.
  </verify>
  <done>Three new tests verify: (1) quoted path.join args are transformed, (2) /gsd: command prefix is transformed to /gsdr:, (3) get-shit-done-reflect-cc is not double-transformed.</done>
</task>

<task type="auto">
  <name>Task 3: Reinstall locally and verify installed hooks</name>
  <files>.claude/hooks/gsdr-check-update.js, .claude/hooks/gsdr-version-check.js, .claude/hooks/gsdr-statusline.js</files>
  <action>
Run `node bin/install.js --local` from the project root to reinstall hooks with the fixed transforms.

Then verify the installed hooks:
1. Check `.claude/hooks/gsdr-check-update.js` — should contain `'get-shit-done-reflect'` in path.join calls, NOT `'get-shit-done'`
2. Check `.claude/hooks/gsdr-version-check.js` — same path.join verification
3. Check `.claude/hooks/gsdr-statusline.js` — should contain `'get-shit-done-reflect'` in path.join AND `/gsdr:update` (not `/gsd:update`)
4. Check `.claude/hooks/gsdr-check-update.js` — should still contain `get-shit-done-reflect-cc` (npm package name intact)

Use grep to confirm presence/absence of patterns in each installed file.
  </action>
  <verify>
Run: `grep -n "get-shit-done'" .claude/hooks/gsdr-*.js` — should return NO matches (all quoted refs transformed).
Run: `grep -n "/gsd:" .claude/hooks/gsdr-*.js` — should return NO matches (all command prefixes transformed).
Run: `grep -c "get-shit-done-reflect-cc" .claude/hooks/gsdr-check-update.js` — should return 1 (npm name preserved).
  </verify>
  <done>All installed hooks under .claude/hooks/ have correct 'get-shit-done-reflect' paths, /gsdr: command prefixes, and preserved npm package name.</done>
</task>

</tasks>

<verification>
1. `npx vitest run tests/unit/install.test.js` — all tests pass (existing + 3 new)
2. `grep "'get-shit-done'" .claude/hooks/gsdr-*.js` — no matches (all transformed)
3. `grep "/gsd:" .claude/hooks/gsdr-*.js` — no matches (all transformed)
4. `grep "get-shit-done-reflect-cc" .claude/hooks/gsdr-check-update.js` — 1 match (preserved)
</verification>

<success_criteria>
- bin/install.js hook copy block has 4 content transforms (2 existing + 2 new)
- All installed hooks reference 'get-shit-done-reflect' in path.join args
- All installed hooks use /gsdr: command prefix
- npm package name get-shit-done-reflect-cc is NOT double-transformed
- All install.test.js tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/21-fix-hook-installer-to-apply-full-content/21-SUMMARY.md`
</output>
