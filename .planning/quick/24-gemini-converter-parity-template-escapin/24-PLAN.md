---
phase: quick-24
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
    - "Gemini agents have no ${VAR} patterns in body text after conversion"
    - "skills: field and its array items are stripped from Gemini frontmatter"
    - "Existing color/tools conversion and body tool name replacement still work"
  artifacts:
    - path: "bin/install.js"
      provides: "convertClaudeToGeminiAgent with template escaping, skills stripping, array field handling"
      contains: "escapedBody"
    - path: "tests/unit/install.test.js"
      provides: "Unit tests for all three gap fixes"
  key_links:
    - from: "bin/install.js"
      to: "bin/install.js"
      via: "template escaping applied after tool name replacement"
      pattern: "replace.*\\$\\{.*\\$\\$\\$1"
---

<objective>
Close three gaps in `convertClaudeToGeminiAgent()` by adopting upstream improvements: template variable escaping, skills field stripping, and multi-line array field tracking.

Purpose: Fix a functional bug where Gemini CLI rejects agents containing `${PHASE}` style shell variables (treating them as unresolvable template parameters), and add defensive stripping for unsupported `skills:` fields.

Output: Updated `bin/install.js` function and comprehensive tests in `tests/unit/install.test.js`.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js (lines 684-752, the convertClaudeToGeminiAgent function)
@tests/unit/install.test.js (lines 1531-1680, existing Gemini conversion tests)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add template escaping, skills stripping, and array field tracking to convertClaudeToGeminiAgent</name>
  <files>bin/install.js</files>
  <action>
Modify `convertClaudeToGeminiAgent()` (starts at line 684) with three changes:

1. ADD `inSkippedArrayField` state variable alongside existing `inAllowedTools`:
   ```
   let inSkippedArrayField = false;
   ```

2. ADD array field skip check at the TOP of the for-loop body, BEFORE the `allowed-tools:` check (line 697). This must come first so skipped array continuation lines are caught before any other field matching:
   ```
   if (inSkippedArrayField) {
     if (!trimmed || trimmed.startsWith('- ')) {
       continue;
     }
     inSkippedArrayField = false;
   }
   ```

3. ADD `skills:` stripping AFTER the `color:` strip (line 719) and BEFORE the `inAllowedTools` collection block (line 722):
   ```
   if (trimmed.startsWith('skills:')) {
     inSkippedArrayField = true;
     continue;
   }
   ```

4. ADD template escaping to the body processing at the END of the function. Change the final return section (lines 747-751) from:
   ```
   let processedBody = stripSubTags(body);
   for (const [claudeTool, geminiTool] of Object.entries(claudeToGeminiTools)) {
     processedBody = processedBody.replace(new RegExp(`\\b${claudeTool}\\b`, 'g'), geminiTool);
   }
   return `---\n${newFrontmatter}\n---${processedBody}`;
   ```
   To:
   ```
   let processedBody = stripSubTags(body);
   for (const [claudeTool, geminiTool] of Object.entries(claudeToGeminiTools)) {
     processedBody = processedBody.replace(new RegExp(`\\b${claudeTool}\\b`, 'g'), geminiTool);
   }
   // Escape ${VAR} patterns for Gemini CLI compatibility.
   // Gemini's templateString() treats ${word} as template variables and throws
   // "Template validation failed" when they can't be resolved. Removing braces
   // ($PHASE instead of ${PHASE}) is equivalent bash syntax.
   const escapedBody = processedBody.replace(/\$\{(\w+)\}/g, '$$$1');
   return `---\n${newFrontmatter}\n---${escapedBody}`;
   ```

   Note: `$$$1` in JS regex replacement = literal `$` followed by capture group 1. So `${PHASE}` becomes `$PHASE`.

IMPORTANT: Preserve our fork-specific body tool name replacement (the for-loop over claudeToGeminiTools). Upstream does not have this. The processing order is: stripSubTags -> tool name replacement -> template escaping.
  </action>
  <verify>Run `npm test -- --reporter=verbose tests/unit/install.test.js` and confirm all existing Gemini conversion tests pass (no regressions).</verify>
  <done>Function has all three gap fixes. Existing 295 tests still pass.</done>
</task>

<task type="auto">
  <name>Task 2: Add unit tests for template escaping, skills stripping, and array field tracking</name>
  <files>tests/unit/install.test.js</files>
  <action>
Add new test cases in `tests/unit/install.test.js`. Insert them after the existing "convertClaudeToGeminiAgent() unit tests" describe block (after line 1583) and before the "Gemini agent body text tool name replacement" describe block (line 1586).

Add a new describe block: `describe('Gemini agent template escaping and field stripping', () => { ... })` with these tests:

1. **Template escaping - basic**:
   Input agent with body containing `${PHASE}`, `${PLAN}`, `${DESCRIPTION}`.
   Assert output contains `$PHASE`, `$PLAN`, `$DESCRIPTION` (no braces).
   Assert output does NOT contain `${PHASE}` or `${PLAN}`.

2. **Template escaping - preserves non-matching patterns**:
   Input agent with body containing `$SIMPLE` (no braces) and `$(command)` (subshell).
   Assert both pass through unchanged (regex only matches `${word}` pattern).

3. **Template escaping - works with tool name replacement**:
   Input agent with body containing both `Read` tool reference AND `${PHASE}` variable.
   Assert `Read` is replaced with `read_file` AND `${PHASE}` becomes `$PHASE`.
   This confirms the processing chain: tool replacement then template escaping.

4. **Skills stripping - inline value**:
   Input agent with frontmatter containing `skills: planning, research`.
   Assert output frontmatter does NOT contain `skills:` or `planning` or `research`.

5. **Skills stripping - YAML array**:
   Input agent with frontmatter:
   ```
   skills:
     - planning
     - research
   description: test agent
   ```
   Assert output does NOT contain `skills:`, `planning`, or `research`.
   Assert output DOES contain `description: test agent` (field after array is preserved).

6. **Skills stripping with color stripping combined**:
   Input agent with both `color: blue` and `skills: planning` in frontmatter.
   Assert NEITHER appears in output. Assert `tools:` and other fields are preserved.

7. **Regression - existing color and tools conversion unchanged**:
   Input agent with `color: red`, `tools: Read, Write`, and body text using `Read`.
   Assert: no `color:` in output, tools converted to YAML array with Gemini names, body text uses `read_file` not `Read`.

All tests use the exported `convertClaudeToGeminiAgent` function directly. Each test creates a full agent string with `---\n...\n---\n...body...` format.
  </action>
  <verify>Run `npm test -- --reporter=verbose tests/unit/install.test.js` and confirm all new tests pass alongside existing ones. Run `npm test` to confirm full suite (should be 295 + new tests).</verify>
  <done>Seven new test cases pass. Full test suite green. Template escaping, skills stripping, and array field tracking are all verified.</done>
</task>

</tasks>

<verification>
- `npm test` passes with all existing + new tests (no regressions)
- Spot-check: `node -e "const {convertClaudeToGeminiAgent} = require('./bin/install.js'); console.log(convertClaudeToGeminiAgent('---\ntools: Read\nskills: planning\n---\nUse \${PHASE} var'))"` outputs agent with `$PHASE` (no braces), no `skills:`, and `read_file` in body
</verification>

<success_criteria>
- convertClaudeToGeminiAgent escapes all ${VAR} patterns to $VAR in body text
- convertClaudeToGeminiAgent strips skills: field (both inline and YAML array)
- Processing chain preserved: stripSubTags -> tool name replacement -> template escaping
- All existing tests pass (no regressions)
- Seven new tests cover all three gaps plus regression
</success_criteria>

<output>
After completion, create `.planning/quick/24-gemini-converter-parity-template-escapin/24-SUMMARY.md`
</output>
