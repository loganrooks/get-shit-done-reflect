---
phase: QT-27
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
    - "copyWithPathReplacement accepts isCommand and isGlobal parameters"
    - "Codex runtime applies convertClaudeToCodexMarkdown content conversion on workflow/reference/template files"
    - "Gemini runtime only converts to TOML when isCommand=true; workflow/reference files stay as .md"
    - "Claude and OpenCode behavior is unchanged"
  artifacts:
    - path: "bin/install.js"
      provides: "convertClaudeToCodexMarkdown function, upgraded copyWithPathReplacement"
      contains: "convertClaudeToCodexMarkdown"
    - path: "tests/unit/install.test.js"
      provides: "Tests for new function and upgraded behavior"
  key_links:
    - from: "bin/install.js (install function)"
      to: "copyWithPathReplacement"
      via: "call sites pass isCommand=true for commands, isCommand=false for workflows"
      pattern: "copyWithPathReplacement\\(.*true.*isGlobal|copyWithPathReplacement\\(.*false.*isGlobal"
---

<objective>
Upgrade copyWithPathReplacement() to accept isCommand and isGlobal parameters, add Codex content conversion via a new convertClaudeToCodexMarkdown() function, and fix Gemini to only TOML-convert command files (not workflow/reference files).

Purpose: Align the shared copy function with upstream's signature and fix incorrect Gemini behavior where workflow .md files were being converted to .toml.
Output: Updated bin/install.js with new function + upgraded signature, updated tests.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js (lines 945-1020 for existing Codex converters, lines 1470-1519 for copyWithPathReplacement, lines 2410-2435 for call sites, line 3000 for module.exports)
@tests/unit/install.test.js (lines 1-13 for imports, lines 1179-1466 for existing Codex tests)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add convertClaudeToCodexMarkdown and upgrade copyWithPathReplacement signature</name>
  <files>bin/install.js</files>
  <action>
1. Create `convertClaudeToCodexMarkdown(content)` function near the other Codex converters (around line 950 area, before `convertClaudeToCodexAgentToml`). Implementation:

```javascript
function convertClaudeToCodexMarkdown(content) {
  let converted = content;
  // Replace /gsdr:command-name with $gsdr-command-name for Codex skill mention syntax
  converted = converted.replace(/\/gsdr:([a-z0-9-]+)/gi, '\\$gsdr-$1');
  // Replace $ARGUMENTS with Codex argument placeholder
  converted = converted.replace(/\$ARGUMENTS\b/g, '{{GSD_ARGS}}');
  return converted;
}
```

Note: The `\\$` in the replacement string produces a literal `$` in the output. The regex uses `/gi` to catch case variations. This function handles ONLY the two content-level Codex conversions needed for workflow/reference/template files (NOT the full skill conversion which is `convertClaudeToCodexSkill`).

2. Update `copyWithPathReplacement` signature from `(srcDir, destDir, pathPrefix, runtime)` to `(srcDir, destDir, pathPrefix, runtime, isCommand = false, isGlobal = false)`. Update the JSDoc to document the new params.

3. Update the recursive call on line 1494 to pass through `isCommand` and `isGlobal`:
   `copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime, isCommand, isGlobal);`

4. Add Codex branch in the runtime conditional (after the Gemini branch, before the else/Claude branch):
```javascript
} else if (runtime === 'codex') {
  content = convertClaudeToCodexMarkdown(content);
  fs.writeFileSync(destPath, content);
}
```

5. Fix Gemini branch to respect isCommand flag:
```javascript
} else if (runtime === 'gemini') {
  if (isCommand) {
    // Only commands get TOML conversion
    content = stripSubTags(content);
    const tomlContent = convertClaudeToGeminiToml(content);
    const tomlPath = destPath.replace(/\.md$/, '.toml');
    fs.writeFileSync(tomlPath, tomlContent);
  } else {
    // Workflow/reference/template files stay as markdown
    fs.writeFileSync(destPath, content);
  }
}
```

6. Update the two call sites in `install()`:
   - Line ~2416 (commands copy): `copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix, runtime, true, isGlobal)`
   - Line ~2429 (workflows/references/templates copy): `copyWithPathReplacement(skillSrc, skillDest, pathPrefix, runtime, false, isGlobal)`

7. Add `convertClaudeToCodexMarkdown` to the `module.exports` object on line 3000.
  </action>
  <verify>Run `node -e "const m = require('./bin/install.js'); console.log(typeof m.convertClaudeToCodexMarkdown)"` -- should print "function". Visually confirm the function signature, Gemini branching, Codex branch, and call sites are correct.</verify>
  <done>convertClaudeToCodexMarkdown is exported, copyWithPathReplacement has 6-param signature with defaults, Codex branch applies content conversion, Gemini branch gates TOML on isCommand, both call sites pass correct flags, recursive call propagates flags.</done>
</task>

<task type="auto">
  <name>Task 2: Add tests for convertClaudeToCodexMarkdown and upgraded copyWithPathReplacement</name>
  <files>tests/unit/install.test.js</files>
  <action>
1. Add `convertClaudeToCodexMarkdown` to the destructured import on line 13.

2. Add a new describe block `convertClaudeToCodexMarkdown() unit tests` inside the existing `Codex CLI integration` describe (after the `convertClaudeToCodexAgentToml()` tests, around line 1466). Tests:

   a. `/gsdr:help` becomes `$gsdr-help`:
      - Input: `Use /gsdr:help to see commands`
      - Expect result to contain `$gsdr-help`
      - Expect result NOT to contain `/gsdr:help`

   b. `$ARGUMENTS` becomes `{{GSD_ARGS}}`:
      - Input: `Pass $ARGUMENTS to the command`
      - Expect result to contain `{{GSD_ARGS}}`
      - Expect result NOT to contain `$ARGUMENTS`

   c. Mixed content with both patterns:
      - Input: `Run /gsdr:execute-phase with $ARGUMENTS for the phase`
      - Expect result to contain `$gsdr-execute-phase`
      - Expect result to contain `{{GSD_ARGS}}`

   d. Content with no patterns passes through unchanged:
      - Input: `Just some regular markdown content`
      - Expect result to equal input exactly

   e. Multiple command references in one string:
      - Input: `Use /gsdr:plan-phase then /gsdr:execute-phase`
      - Expect result to contain `$gsdr-plan-phase`
      - Expect result to contain `$gsdr-execute-phase`

3. Add a new describe block `copyWithPathReplacement isCommand/isGlobal behavior` (can be placed after the Codex CLI integration section or as a new top-level describe). Use `tmpdirTest` pattern from existing tests. Tests:

   a. Codex runtime applies convertClaudeToCodexMarkdown:
      - Create a temp srcDir with a file containing `/gsdr:test-command` and `$ARGUMENTS`
      - Call `copyWithPathReplacement(srcDir, destDir, '~/.codex/', 'codex', false, false)` (note: copyWithPathReplacement is NOT in module.exports so test via subprocess or by importing the function -- check if it is exported; if not, test indirectly through the convertClaudeToCodexMarkdown unit tests and integration install tests)

   b. Gemini with isCommand=true produces .toml:
      - Similar tmpdir setup, call with runtime='gemini', isCommand=true
      - Verify .toml file exists, .md does NOT exist

   c. Gemini with isCommand=false keeps .md:
      - Call with runtime='gemini', isCommand=false
      - Verify .md file exists, .toml does NOT exist

   IMPORTANT: `copyWithPathReplacement` is NOT currently in module.exports. Since it is an internal function, the preferred approach is:
   - Add `copyWithPathReplacement` to module.exports (append to the exports object on line 3000)
   - Then test it directly via import

   If adding to exports, also add it to the destructured require on line 13 of the test file.

   d. Regression: Claude runtime still writes .md as-is (no conversion applied beyond path replacement):
      - Create temp srcDir with a .md file containing `/gsdr:test`
      - Call with runtime='claude'
      - Verify output still contains `/gsdr:test` (Claude does NOT convert command syntax)

   e. Regression: OpenCode runtime still applies frontmatter conversion:
      - Create temp srcDir with a .md file containing YAML frontmatter
      - Call with runtime='opencode'
      - Verify output contains OpenCode frontmatter format

4. Run full test suite: `npm test`
  </action>
  <verify>`npm test` passes with all existing 333+ tests plus the new tests. Specifically verify: `npx vitest run tests/unit/install.test.js` passes.</verify>
  <done>All new tests pass: convertClaudeToCodexMarkdown handles command syntax replacement, argument placeholder replacement, mixed content, passthrough; copyWithPathReplacement correctly branches by runtime and isCommand flag; regression tests confirm Claude/OpenCode unchanged. Total test count increases by ~10-12 tests.</done>
</task>

</tasks>

<verification>
- `npm test` passes with no regressions
- `node -e "const m = require('./bin/install.js'); console.log(typeof m.convertClaudeToCodexMarkdown)"` prints "function"
- `node -e "const m = require('./bin/install.js'); console.log(m.convertClaudeToCodexMarkdown('Use /gsdr:help with $ARGUMENTS'))"` prints `Use $gsdr-help with {{GSD_ARGS}}`
- `node -e "const m = require('./bin/install.js'); console.log(typeof m.copyWithPathReplacement)"` prints "function" (if exported)
</verification>

<success_criteria>
- copyWithPathReplacement signature matches upstream: (srcDir, destDir, pathPrefix, runtime, isCommand=false, isGlobal=false)
- Codex runtime in copyWithPathReplacement applies convertClaudeToCodexMarkdown
- Gemini runtime in copyWithPathReplacement only TOML-converts when isCommand=true
- Claude and OpenCode behavior unchanged (regression verified)
- Both call sites in install() pass correct flags
- Recursive directory traversal propagates isCommand and isGlobal
- convertClaudeToCodexMarkdown exported and tested
- All tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/27-copywithpathreplacement-upgrade-iscomman/27-SUMMARY.md`
</output>
