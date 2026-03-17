---
phase: quick-22
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
    - "Codex install produces agent .toml files in ~/.codex/agents/"
    - "Agent .toml files use TOML literal multi-line strings (''') for developer_instructions"
    - "All 12 agent .toml files parse without TOML errors despite backslash patterns in content"
    - "Agent parity test includes Codex agents alongside Claude/OpenCode/Gemini"
    - "AGENTS.md summary is still generated (not replaced)"
  artifacts:
    - path: "bin/install.js"
      provides: "convertClaudeToCodexAgentToml() function + wiring into agent install block"
      exports: ["convertClaudeToCodexAgentToml"]
    - path: "tests/unit/install.test.js"
      provides: "Unit tests for convertClaudeToCodexAgentToml()"
    - path: "tests/integration/multi-runtime.test.js"
      provides: "Updated layout verification + agent parity for Codex"
  key_links:
    - from: "bin/install.js (agent install block ~line 2248)"
      to: "convertClaudeToCodexAgentToml()"
      via: "called for each agent .md when isCodex is true"
      pattern: "convertClaudeToCodexAgentToml"
    - from: "bin/install.js (module.exports)"
      to: "tests/unit/install.test.js"
      via: "exported function for unit testing"
      pattern: "convertClaudeToCodexAgentToml"
---

<objective>
Fix GitHub Issue #15: Codex agent TOML files break on backslash patterns in bash examples.

Purpose: The Codex CLI generates agent `.toml` files using TOML basic multi-line strings (`"""`), which interpret backslash sequences as escapes. Agent definitions contain bash/grep code with `\|`, `\.`, `\[`, `\{`, `` \` ``, `\w` patterns that are invalid TOML escapes, breaking all GSD agent invocations on Codex. The fix adds TOML generation to the installer using literal multi-line strings (`'''`) which pass backslashes through verbatim.

Output: Working `convertClaudeToCodexAgentToml()` function in `bin/install.js`, wired into the Codex install path, with unit and integration tests.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js
@tests/unit/install.test.js
@tests/integration/multi-runtime.test.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create convertClaudeToCodexAgentToml() and wire into installer</name>
  <files>bin/install.js</files>
  <action>
1. Create `convertClaudeToCodexAgentToml(content)` function near the existing `convertClaudeToCodexSkill()` (around line 880). The function should:
   - Parse YAML frontmatter to extract `description` and `name` fields (same parsing pattern as `convertClaudeToGeminiToml()` lines 836-870)
   - Extract the body (everything after the closing `---`)
   - Generate valid TOML output using TOML **literal multi-line strings** (`'''`) for the `developer_instructions` field, which do NOT process escape sequences
   - Also emit `description = "..."` using `JSON.stringify()` (same as Gemini TOML pattern -- description is short, no backslashes)
   - Handle edge case: if the body contains `'''` itself, replace those occurrences with `' ' '` (space-separated single quotes) to avoid premature TOML string termination. This is extremely unlikely in agent content but must be handled for correctness.
   - Format:
     ```toml
     description = "Agent description here"
     developer_instructions = '''
     <role>
     ...body content with \| and \. preserved verbatim...
     </role>
     '''
     ```

2. Modify the agent installation block (around line 2246-2297). Currently the block has `if (fs.existsSync(agentsSrc) && !isCodex)` which skips Codex entirely. Change the logic so that:
   - For Claude/OpenCode/Gemini: behavior is UNCHANGED (existing code path)
   - For Codex: iterate the same agent `.md` sources, apply `replacePathsInContent()` + `processAttribution()` (same transforms as other runtimes), then call `convertClaudeToCodexAgentToml()` on the result, and write to `~/.codex/agents/{agentName}.toml` (using the gsdr- renamed name, e.g., `gsdr-planner.toml`)
   - Create the `~/.codex/agents/` directory with `{ recursive: true }`
   - The existing AGENTS.md generation (lines 2291-2297) MUST remain -- it provides useful workflow summary to Codex. The new agent TOML files supplement it, not replace it.

3. Add `convertClaudeToCodexAgentToml` to the `module.exports` object (line 2750) for unit testing.

Implementation notes:
- The `.toml` extension is required -- Codex CLI looks for `*.toml` in `~/.codex/agents/`
- Agent filenames: source `gsd-planner.md` becomes `gsdr-planner.toml` (apply the same gsd- to gsdr- rename as other runtimes)
- The `developer_instructions` field name comes from the Codex agent TOML schema (seen in the error messages in Issue #15)
- Do NOT use `JSON.stringify()` for developer_instructions -- that produces basic strings with `"` which would have the same backslash escape problem as `"""`. The whole point is using `'''` literal strings.
  </action>
  <verify>
Run `node -e "const {convertClaudeToCodexAgentToml} = require('./bin/install.js'); const md = '---\nname: test\ndescription: Test agent\n---\nContent with \\| and \\. and \\[ patterns'; const toml = convertClaudeToCodexAgentToml(md); console.log(toml); if (!toml.includes(\"'''\")) throw new Error('Missing literal string delimiters'); if (toml.includes('\"\"\"')) throw new Error('Used basic string delimiters'); console.log('PASS');"` -- should output valid TOML with `'''` delimiters and print PASS.
  </verify>
  <done>
`convertClaudeToCodexAgentToml()` exists, is exported, generates valid TOML with literal multi-line strings. The installer's agent block generates `.toml` files for Codex while preserving all other runtime behavior and the AGENTS.md generation.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add unit tests for convertClaudeToCodexAgentToml()</name>
  <files>tests/unit/install.test.js</files>
  <action>
1. Add import of `convertClaudeToCodexAgentToml` to the destructured require at line 13.

2. Add a new `describe('convertClaudeToCodexAgentToml() unit tests', ...)` block near the existing `convertClaudeToCodexSkill()` tests (around line 964). Include these test cases:

   a. **Basic conversion with frontmatter** -- input with `---\nname: gsd-test\ndescription: A test agent\n---\nBody content here` should produce TOML with `description = "A test agent"` and `developer_instructions = '''\nBody content here\n'''`

   b. **Backslash patterns preserved** -- the critical test. Input body containing `grep -r "import\.stripe\|import\.supabase" src/` and `pattern: "prisma\\.message\\.(find\|create)"` and `` \`backtick\` `` patterns. Verify the output contains these patterns VERBATIM (character-for-character identical), not escaped.

   c. **No frontmatter** -- input without `---` delimiters should still produce valid TOML with just `developer_instructions = '''...'''` and a generic description.

   d. **Content containing triple single quotes** -- input body with `'''` should have those replaced to avoid TOML parse errors. Verify the output is still valid (does not contain unescaped `'''` inside the literal string).

   e. **Empty description fallback** -- frontmatter with no description field should produce a reasonable default description (e.g., the agent name or a generic string).

   f. **Real agent content test** -- take the first ~20 lines of the gsd-verifier agent (which has the highest backslash count at 30) as a realistic integration-style unit test. Read the actual content from `agents/gsd-verifier.md`, truncate, convert, and verify no TOML parse issues by checking that `'''` delimiters are used and content is between them.
  </action>
  <verify>
`npm test -- tests/unit/install.test.js --reporter=verbose 2>&1 | grep -E "convertClaudeToCodexAgentToml|PASS|FAIL"` -- all new tests pass.
  </verify>
  <done>
At least 5 unit tests for `convertClaudeToCodexAgentToml()` pass, covering basic conversion, backslash preservation, edge cases, and realistic agent content.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update integration tests for Codex agent TOML layout and parity</name>
  <files>tests/integration/multi-runtime.test.js</files>
  <action>
1. Update `verifyRuntimeLayout()` for the `codex` branch (line 93-103):
   - ADD: `await dirHasGlobFiles(path.join(base, 'agents'), 'gsdr-*.toml', 1)` to verify agent TOML files are installed
   - REMOVE: `await fileNotExists(path.join(base, 'agents'))` since agents/ directory now DOES exist for Codex
   - Keep all other existing checks (skills, AGENTS.md, VERSION, no hooks, no settings.json)

2. Update the agent parity test (line 622-628). Currently it says "Codex excluded -- uses AGENTS.md composite". Change to:
   - Add: `const codexAgents = getNameSet(path.join(tmpdir, '.codex', 'agents'), 'gsdr-', '.toml')` (note: `.toml` extension, not `.md`)
   - Add parity assertion: `expect([...claudeAgents].sort(), 'Agent parity: Claude vs Codex').toEqual([...codexAgents].sort())`
   - Update the comment to reflect that Codex now has individual agent files (AND AGENTS.md)

3. Add a focused test case within the Codex section: "Codex agent TOML files use literal strings for backslash safety". After a `--codex --global` install:
   - Read one of the generated `.toml` files (e.g., `gsdr-verifier.toml` which has the most backslash patterns)
   - Assert it contains `developer_instructions = '''` (literal string delimiter)
   - Assert it does NOT contain `developer_instructions = """` (basic string delimiter)
   - Assert it contains at least one backslash pattern from the known set (e.g., `\.` or `\|`) to confirm content was actually written
  </action>
  <verify>
`npm test -- tests/integration/multi-runtime.test.js --reporter=verbose 2>&1 | tail -30` -- all tests pass including new Codex agent TOML checks and updated parity assertions.
  </verify>
  <done>
Integration tests verify: (1) Codex install produces agent `.toml` files in `agents/` directory, (2) agent file set matches Claude/OpenCode/Gemini parity, (3) TOML files use literal multi-line strings (`'''`) not basic strings (`"""`), (4) all existing tests still pass.
  </done>
</task>

</tasks>

<verification>
1. `npm test` -- full test suite passes (145+ tests, now with additional Codex TOML tests)
2. Manual verification: `node bin/install.js --codex --global` installs to `~/.codex/agents/gsdr-*.toml` files alongside existing AGENTS.md
3. Spot-check: `head -5 ~/.codex/agents/gsdr-verifier.toml` shows `developer_instructions = '''` (not `"""`)
4. Spot-check: `grep '\\\\|' ~/.codex/agents/gsdr-codebase-mapper.toml` finds backslash-pipe patterns preserved verbatim
</verification>

<success_criteria>
- convertClaudeToCodexAgentToml() generates valid TOML with literal multi-line strings
- All 12 agent sources produce .toml files during Codex install
- Backslash patterns (\|, \., \[, \{, \`, \w) are preserved verbatim in output
- AGENTS.md generation is unaffected
- All existing tests pass; new unit + integration tests pass
- Issue #15 root cause (TOML escape processing of backslashes) is resolved
</success_criteria>

<output>
After completion, create `.planning/quick/22-fix-codex-agent-toml-generation-issue-15/22-SUMMARY.md`
</output>
