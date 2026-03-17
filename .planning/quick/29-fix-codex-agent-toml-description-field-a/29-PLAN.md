---
phase: quick-29
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/install.js
  - tests/unit/install.test.js
  - tests/integration/multi-runtime.test.js
autonomous: true
must_haves:
  truths:
    - "Codex agent TOML files contain only sandbox_mode and developer_instructions at the top level (no description field)"
    - "config.toml [agents.NAME] blocks still carry the description (no information lost)"
    - "All existing and new tests pass"
    - "Integration test validates generated agent TOMLs have no unexpected top-level fields"
  artifacts:
    - path: "bin/install.js"
      provides: "convertClaudeToCodexAgentToml without description line"
      contains: "sandbox_mode"
    - path: "tests/unit/install.test.js"
      provides: "Updated unit tests asserting description is NOT in agent TOML"
    - path: "tests/integration/multi-runtime.test.js"
      provides: "Schema-like validation test for agent TOML structure"
  key_links:
    - from: "bin/install.js:convertClaudeToCodexAgentToml"
      to: "bin/install.js:generateCodexConfigBlock"
      via: "description lives in config.toml [agents.NAME], not in agent TOML"
      pattern: "generateCodexConfigBlock.*description"
---

<objective>
Remove the `description` field from Codex agent TOML output and add structural validation to prevent regression.

Purpose: The Codex config schema specifies `additionalProperties: false` at the top level of agent TOML files. Our `description` field causes schema validation failure. The description is already present in `config.toml` via `generateCodexConfigBlock()`, so removing it from the agent TOML loses nothing.

Output: Fixed installer, updated unit tests, new integration test for TOML structure validation.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js (lines 970-1004: convertClaudeToCodexAgentToml function)
@tests/unit/install.test.js (lines 1337-1466: Codex agent TOML unit tests)
@tests/integration/multi-runtime.test.js (lines 426-443: Codex agent TOML literal string safety test, lines 1005-1014: content quality checks)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove description from agent TOML output and update unit tests</name>
  <files>bin/install.js, tests/unit/install.test.js</files>
  <action>
In `bin/install.js`, function `convertClaudeToCodexAgentToml()` (line 970-1004):

1. Remove the description-related logic:
   - Remove `let description = '';` (line 971)
   - Remove the `description = extractFrontmatterField(...)` assignment (line 979)
   - Remove the fallback description block (lines 983-986)
   - Remove line 999: `let toml = 'description = ' + JSON.stringify(description) + '\n';`
   - Change the TOML building to start with sandbox_mode directly:
     ```javascript
     let toml = `sandbox_mode = "${sandboxMode}"\n`;
     toml += `developer_instructions = '''\n${safeBody}\n'''\n`;
     return toml;
     ```
   - Keep `name` extraction (line 980) ONLY if it is used elsewhere in the function. Check: `name` is not used after description removal, so remove `let name = '';` and the `name = extractFrontmatterField(...)` line too.

2. In `tests/unit/install.test.js`, update the `convertClaudeToCodexAgentToml() unit tests` block (starting line 1337):

   - Test "basic conversion with frontmatter produces TOML..." (line 1338):
     - REMOVE: `expect(result).toContain('description = "A test agent"')`
     - ADD: `expect(result).not.toContain('description =')`
     - Keep existing assertions for `developer_instructions` and body content

   - Test "handles input without frontmatter" (line 1378):
     - REMOVE: `expect(result).toContain('description = "GSD agent"')`
     - ADD: `expect(result).not.toContain('description =')`

   - Test "falls back to a reasonable description..." (line 1408):
     - REMOVE this entire test (it tests description fallback logic that no longer exists)

   - Test "handles real agent content with high backslash density" (line 1421):
     - REMOVE: `expect(result).toContain('description = ')`
     - ADD: `expect(result).not.toContain('description =')`
     - Keep: the assertion that "verif" appears in content (it will be in developer_instructions body)

   - Add a NEW test: "does not include description field in output" that explicitly confirms no description line for various inputs (with description in frontmatter, without, with name only).
  </action>
  <verify>Run `npm test -- tests/unit/install.test.js` and confirm all Codex agent TOML tests pass. Specifically check that no test asserts `description =` is present in agent TOML output.</verify>
  <done>convertClaudeToCodexAgentToml() outputs only `sandbox_mode` and `developer_instructions` fields. All unit tests pass. No description field in agent TOML output.</done>
</task>

<task type="auto">
  <name>Task 2: Add integration test validating agent TOML structure against allowed fields</name>
  <files>tests/integration/multi-runtime.test.js</files>
  <action>
In `tests/integration/multi-runtime.test.js`, add a new test in the "Codex agent TOML literal string safety" describe block (after the existing test around line 443), OR create a new describe block "Codex agent TOML schema compliance" nearby.

The test should:

1. Run `node bin/install.js --codex --global` to a temp dir (same pattern as existing tests in this file)
2. Read all `gsdr-*.toml` files from `{tmpdir}/.codex/agents/`
3. For EACH agent TOML file, validate its structure:
   - Extract all top-level key names using regex: match lines that look like `key_name = ` at position 0 (not indented, not inside the `'''` block)
   - Implementation approach: Split on `'''` to isolate the parts outside the literal string block. In those parts, match `/^(\w+)\s*=/gm` to find top-level keys.
   - Assert that every found key is in the ALLOWED set: `['sandbox_mode', 'developer_instructions', 'model']`
   - Specifically assert that `description` is NOT among the found keys
   - Assert that `sandbox_mode` IS present
   - Assert that `developer_instructions` IS present

4. Also update the existing "content quality" test (around line 1005-1014) which checks `sandbox_mode =` presence in Codex agent TOMLs. Add an assertion there that `description =` is NOT present in any agent TOML file:
   ```javascript
   expect(content, `Codex ${agentFile}: should NOT contain description =`).not.toContain('description =')
   ```

The allowed fields list comes from the Codex config schema's top-level properties. Currently the known valid top-level config properties are: `model`, `model_reasoning_effort`, `sandbox_mode`, `developer_instructions`, `disable_response_storage`, `notify`, `approval_mode`, `full_auto_error_mode`, `history`. Our agent TOMLs only use `sandbox_mode` and `developer_instructions`. Using a small allowlist (`sandbox_mode`, `developer_instructions`, `model`) is sufficient for catching unexpected fields like `description`.
  </action>
  <verify>Run `npm test -- tests/integration/multi-runtime.test.js` and confirm all tests pass, including the new schema compliance test. The test should find at least 1 agent TOML file and validate each one.</verify>
  <done>Integration test validates that every generated Codex agent TOML contains only allowed top-level fields. Specifically, `description` is confirmed absent. Test passes on current codebase after Task 1 fix.</done>
</task>

</tasks>

<verification>
1. `npm test` -- all tests pass (unit + integration)
2. Manual spot check: `node bin/install.js --codex --global` to a temp dir, inspect any `gsdr-*.toml` file -- should contain only `sandbox_mode =` and `developer_instructions = '''...'''`, no `description =` line
3. Confirm `config.toml` still has `description = "..."` in `[agents.gsdr-*]` blocks (this is generated by `generateCodexConfigBlock()` which we are NOT modifying)
</verification>

<success_criteria>
- convertClaudeToCodexAgentToml() no longer emits `description` field
- All existing unit tests updated and passing
- New integration test catches any future addition of unauthorized top-level fields to agent TOMLs
- config.toml agent blocks still carry descriptions (no functional regression)
- `npm test` passes fully (all ~350 tests)
</success_criteria>

<output>
After completion, create `.planning/quick/29-fix-codex-agent-toml-description-field-a/29-SUMMARY.md`
</output>
