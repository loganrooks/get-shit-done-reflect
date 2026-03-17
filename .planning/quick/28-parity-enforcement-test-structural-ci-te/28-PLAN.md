---
phase: quick-28
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/integration/multi-runtime.test.js
autonomous: true
must_haves:
  truths:
    - "Adding a new runtime without updating the parity test causes CI failure"
    - "Removing an agent from one runtime but not others causes CI failure"
    - "Shipping a Gemini agent with unescaped ${} template syntax causes CI failure"
    - "Shipping a Codex workflow with /gsdr: instead of $gsdr- causes CI failure"
    - "Shipping an OpenCode agent with skills: in frontmatter causes CI failure"
    - "Shipping a Codex agent TOML without sandbox_mode causes CI failure"
  artifacts:
    - path: "tests/integration/multi-runtime.test.js"
      provides: "Cross-runtime parity enforcement test block"
      contains: "Cross-runtime parity enforcement"
  key_links:
    - from: "tests/integration/multi-runtime.test.js"
      to: "bin/install.js"
      via: "execSync spawns installer with --all --global"
      pattern: "execSync.*install.js.*--all.*--global"
---

<objective>
Add a `describe('Cross-runtime parity enforcement')` block to the existing multi-runtime integration test that enforces deployment equivalence across all four runtimes (Claude, OpenCode, Gemini, Codex) via CI. This makes parity a structural invariant enforced by test automation rather than human vigilance.

Purpose: Capstone enforcement test for the QT22-27 parity work. After this, adding/removing/misconfiguring any runtime artifact breaks CI automatically.
Output: New test block in tests/integration/multi-runtime.test.js with 4 sub-tests, all passing.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@tests/integration/multi-runtime.test.js
@tests/helpers/tmpdir.js
@bin/install.js (lines 68-80 for runtime selection, 945-960 for Codex markdown conversion, 726-764 for OpenCode skills stripping, 795-803 for Gemini template escaping, 985-1002 for Codex TOML sandbox_mode)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add cross-runtime parity enforcement test block</name>
  <files>tests/integration/multi-runtime.test.js</files>
  <action>
Add a new `describe('Cross-runtime parity enforcement')` block INSIDE the existing `describe('multi-runtime validation')` block, after the VALID-03 section. This block reuses the `tmpdirTest` fixture, `runInstaller` is NOT available (each test uses inline `execSync`), and the existing helpers (`dirHasFiles`, `getNameSet`, etc.) are available.

The block should contain 4 `tmpdirTest` tests. Each test runs its own `--all --global` install to a tmpdir (matching the pattern used throughout the file).

**Test 1: `'artifact count parity across runtimes'`**

Count files per runtime per category and assert equal counts:

```javascript
const SUPPORTED_RUNTIMES = ['claude', 'opencode', 'gemini', 'codex'];

// Define paths for each runtime's artifact categories
const runtimePaths = {
  claude: {
    agents: path.join(tmpdir, '.claude', 'agents'),
    workflows: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'workflows'),
    references: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'references'),
    templates: path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'templates'),
  },
  opencode: {
    agents: path.join(configHome, 'opencode', 'agents'),
    workflows: path.join(configHome, 'opencode', 'get-shit-done-reflect', 'workflows'),
    references: path.join(configHome, 'opencode', 'get-shit-done-reflect', 'references'),
    templates: path.join(configHome, 'opencode', 'get-shit-done-reflect', 'templates'),
  },
  gemini: {
    agents: path.join(tmpdir, '.gemini', 'agents'),
    workflows: path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'workflows'),
    references: path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'references'),
    templates: path.join(tmpdir, '.gemini', 'get-shit-done-reflect', 'templates'),
  },
  codex: {
    agents: path.join(tmpdir, '.codex', 'agents'),
    workflows: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'workflows'),
    references: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'references'),
    templates: path.join(tmpdir, '.codex', 'get-shit-done-reflect', 'templates'),
  },
};
```

For each shared category (workflows, references, templates), count `.md` files and assert all 4 runtimes have the same count. For agents, count `gsdr-*.md` for Claude/OpenCode/Gemini and `gsdr-*.toml` for Codex, assert same count.

NOTE: The existing `--all install: file name parity across runtimes per category` test (line 609) already checks NAME parity for agents, commands, workflows, hooks. This new test adds COUNT parity for references and templates (categories not yet covered), and serves as the single entry point for the INTENTIONAL_DIVERGENCES documentation.

**Test 2: `'agent name set equivalence across runtimes'`**

Extract agent names (strip runtime-specific extension), assert identical sorted sets. Use the same `getNameSet` approach from the existing test but wrap it in the `INTENTIONAL_DIVERGENCES` constant for documentation:

```javascript
const INTENTIONAL_DIVERGENCES = {
  agentExtensions: {
    claude: '.md', opencode: '.md', gemini: '.md', codex: '.toml',
    // WHY: Codex uses TOML config files for agents, others use markdown
  },
  commandStructure: {
    claude: { dir: 'commands/gsdr', nested: true },
    opencode: { dir: 'command', nested: false },
    gemini: { dir: 'commands/gsdr', nested: true },
    codex: { dir: 'skills', nested: false },
    // WHY: Each runtime has its own command/skill format
  },
  hooksSupport: {
    claude: true, opencode: false, gemini: true, codex: false,
    // WHY: OpenCode has no settings.json hook system, Codex has no hook support
  },
  codexAgentsMd: true,
  // WHY: Codex benefits from a consolidated AGENTS.md alongside individual .toml files
};
```

Define `INTENTIONAL_DIVERGENCES` at the top of the describe block so all 4 tests can reference it. Use `INTENTIONAL_DIVERGENCES.agentExtensions[runtime]` to select which extension to look for per runtime.

**Test 3: `'content quality: runtime-specific transformations applied'`**

Read actual installed file content and assert transformations were applied:

1. **Gemini agents: no `${` patterns.** Read all `gsdr-*.md` files from Gemini agents dir. For each, separate frontmatter from body (split on `---`), check body does NOT match `/\$\{[^}]+\}/` (template variables should have braces removed, becoming `$PHASE` not `${PHASE}`).

2. **Codex workflows: contain `$gsdr-` not `/gsdr:`.** Read all `.md` files from Codex workflows dir. For each, assert content does NOT contain `/gsdr:` and DOES contain either `$gsdr-` or no command references at all (some workflows may not reference commands).

3. **OpenCode agents: no `skills:` in frontmatter.** Read all `gsdr-*.md` from OpenCode agents dir. For each, extract frontmatter (content between first and second `---`), assert frontmatter does NOT contain `skills:`.

4. **Codex agent TOMLs: contain `sandbox_mode =`.** Read all `gsdr-*.toml` from Codex agents dir. For each, assert content contains `sandbox_mode =`.

**Test 4: `'new runtime detection: unknown runtime directories flagged'`**

After install, scan tmpdir for directories matching known runtime patterns that are NOT in SUPPORTED_RUNTIMES. Check for:
- `.copilot/`, `.cursor/`, `.windsurf/`, `.agent/`, `.aide/`

These are plausible future runtime dirs. If any exist after install (meaning the installer started producing them), fail with a message like: "Detected runtime directory .copilot/ not in SUPPORTED_RUNTIMES -- add parity coverage".

Implementation: list entries in tmpdir, filter to hidden directories (start with `.`), exclude known ones (`.claude`, `.codex`, `.gemini`, `.config`, `.gsd`, `.npm`, `.node_modules`), check remaining against a pattern list.

**Important implementation details:**
- Place `SUPPORTED_RUNTIMES` and `INTENTIONAL_DIVERGENCES` as constants inside the new describe block (not module-level, to avoid polluting the existing test namespace)
- Each tmpdirTest runs `execSync(node "${installScript}" --all --global, ...)` with configHome set, matching the existing pattern
- Use `fsSync.existsSync` and `fsSync.readdirSync` for synchronous helpers (already imported as `fsSync` at line 5)
- Use async `fs.readFile` for content reads
- Timeout for install: 30000 (matching existing --all tests)
  </action>
  <verify>
Run `npm test -- tests/integration/multi-runtime.test.js --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|parity enforcement|artifact count|agent name|content quality|runtime detection)"` and confirm all 4 new tests pass. Then run full `npm test` to confirm no regressions (346+ tests pass).
  </verify>
  <done>
4 new tests pass inside `describe('Cross-runtime parity enforcement')`. Full test suite passes with 350+ tests. The tests enforce: (1) artifact count equivalence, (2) agent name set equivalence, (3) content quality transformations, (4) new runtime detection. Adding/removing an agent or shipping a mis-transformed file now breaks CI.
  </done>
</task>

</tasks>

<verification>
- `npm test -- tests/integration/multi-runtime.test.js` passes with all existing + new tests
- `npm test` full suite passes (346+ tests, no regressions)
- Manually verify the INTENTIONAL_DIVERGENCES constant documents all known runtime differences
</verification>

<success_criteria>
- 4 new tmpdirTest tests in Cross-runtime parity enforcement block
- All 4 pass on current codebase (green baseline)
- Tests would fail if: an agent is added to one runtime but not others, Gemini ships with ${} templates, Codex ships with /gsdr: instead of $gsdr-, OpenCode ships with skills: in agent frontmatter, Codex TOML lacks sandbox_mode
- SUPPORTED_RUNTIMES and INTENTIONAL_DIVERGENCES constants are documented inline
- Total test count increases by 4 (350+)
</success_criteria>

<output>
After completion, create `.planning/quick/28-parity-enforcement-test-structural-ci-te/28-SUMMARY.md`
</output>
