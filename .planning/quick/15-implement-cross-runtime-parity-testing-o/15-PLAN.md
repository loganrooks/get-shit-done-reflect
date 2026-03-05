---
phase: quick-15
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/build-hooks.js
  - tests/integration/multi-runtime.test.js
  - .planning/deliberations/cross-runtime-parity-testing.md
autonomous: true
resolves_signals:
  - sig-2026-03-05-multi-runtime-parity-testing-gap

must_haves:
  truths:
    - "build-hooks.js automatically discovers new gsd-*.js hooks without manual list updates"
    - "hooks/dist/ contains all 4 hooks after running build:hooks"
    - "Name parity test catches missing files across runtimes"
    - "Gemini tool name check covers ALL agents, not just gsd-planner.md"
    - "Hook registration sync test catches mismatch between settings.json and actual hook files"
  artifacts:
    - path: "scripts/build-hooks.js"
      provides: "Glob-based hook discovery"
      contains: "readdirSync"
    - path: "tests/integration/multi-runtime.test.js"
      provides: "Parity tests for names, tool names, hook sync"
    - path: "hooks/dist/gsd-ci-status.js"
      provides: "Previously missing hook in dist"
  key_links:
    - from: "scripts/build-hooks.js"
      to: "hooks/*.js"
      via: "glob/readdir for gsd-*.js"
      pattern: "readdirSync.*filter.*gsd-"
    - from: "tests/integration/multi-runtime.test.js"
      to: "bin/install.js"
      via: "--all --global install then compare file sets"
---

<objective>
Implement cross-runtime parity testing (Options B+C+D from deliberation) and fix the build-hooks.js bug that caused gsd-ci-status.js to be missing from hooks/dist/.

Purpose: Prevent silent feature gaps across runtimes when new hooks, agents, or commands are added. The immediate bug (gsd-ci-status.js missing from dist/) is fixed structurally by replacing the hardcoded list with a glob.
Output: Fixed build-hooks.js, 3 new test categories in multi-runtime.test.js, updated deliberation status.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary-standard.md
</execution_context>

<context>
@scripts/build-hooks.js
@tests/integration/multi-runtime.test.js
@bin/install.js (lines ~1546, ~2260-2330 for hook registration)
@.planning/deliberations/cross-runtime-parity-testing.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix build-hooks.js glob and add parity tests</name>
  <files>scripts/build-hooks.js, tests/integration/multi-runtime.test.js</files>
  <action>
**Part A: Fix build-hooks.js (Option D)**

Replace the hardcoded `HOOKS_TO_COPY` array with dynamic discovery:
```javascript
const allFiles = fs.readdirSync(HOOKS_DIR);
const hooksToCopy = allFiles.filter(f => f.startsWith('gsd-') && f.endsWith('.js'));
```
This automatically picks up any `gsd-*.js` file in `hooks/` without needing manual list maintenance. The `dist/` subdirectory is not returned by `readdirSync` with this filter since it has no `.js` extension. Remove the old `HOOKS_TO_COPY` constant entirely. Keep the rest of the build() function logic the same (mkdir dist, copy loop, warnings).

After editing, run `npm run build:hooks` to rebuild dist/ -- verify gsd-ci-status.js now appears in hooks/dist/.

**Part B: Add name parity test (Option B)**

In multi-runtime.test.js, inside the `VALID-03: Multi-runtime --all install` describe block, add a new test:

`--all install: file name parity across runtimes per category`

After running `--all --global` install to tmpdir:
1. Collect file names per category per runtime into sets (strip extensions for comparison):
   - **agents**: Claude `.claude/agents/gsd-*.md`, OpenCode `opencode/agents/gsd-*.md`, Gemini `.gemini/agents/gsd-*.md` -- Codex excluded (uses AGENTS.md composite, no individual agent files)
   - **commands**: Claude `.claude/commands/gsd/*.md`, OpenCode `opencode/command/gsd-*.md`, Gemini `.gemini/commands/gsd/*.toml`, Codex `.codex/skills/gsd-*/` (dir names)
   - **workflows**: Claude `.claude/get-shit-done/workflows/*.md`, OpenCode `opencode/get-shit-done/workflows/*.md`, Gemini `.gemini/get-shit-done/workflows/*.md`, Codex `.codex/get-shit-done/workflows/*.md`
   - **hooks**: Claude `.claude/hooks/gsd-*.js`, Gemini `.gemini/hooks/gsd-*.js`, OpenCode `opencode/hooks/gsd-*.js` -- Codex excluded (no hooks)

2. For each category, compare extension-stripped name sets. Assert they are equal across applicable runtimes. Use a documented exceptions object for known intentional divergences (currently none expected for agents/workflows; commands may have minor format-driven name differences).

3. Use helper function `getNameSet(dir, pattern)` that reads dir, filters by pattern, strips extensions, returns a Set.

**Part C: Extend Gemini tool name check to ALL agents (Option C targeted)**

Add a new test in the `VALID-02: Gemini installation` describe block:

`Gemini: ALL agent body text uses Gemini-native tool names`

After running `--gemini --global` install:
1. Read ALL files in `.gemini/agents/` matching `gsd-*.md`
2. For each agent file, split on `---` to get body (parts.slice(2).join('---'))
3. Assert body does NOT contain `\bRead\b`, `\bBash\b`, `\bWrite\b`, `\bGlob\b`, `\bGrep\b` (word-boundary regex)
4. This extends the existing single-agent test to cover all agents. Keep the existing single-agent test as-is (it also checks MCP tool preservation which is fine to keep focused).

**Part D: Hook registration sync test (Option C targeted)**

Add a new test in `VALID-03: Multi-runtime --all install` describe block:

`--all install: hook files match hook registrations in settings.json`

After running `--all --global` install:
1. For Claude and Gemini (the two runtimes with settings.json + hooks):
   - Read settings.json, parse JSON
   - Extract hook filenames from all hook commands (match `gsd-*.js` in command strings)
   - Read hooks/ directory, collect actual `gsd-*.js` files
   - Assert: every registered hook has a corresponding file, every hook file has a registration
   - This catches exactly the class of bug where install.js registers a hook but build-hooks.js didn't copy it

Note: OpenCode hooks are copied to `opencode/hooks/` but registered differently (not in settings.json). Skip OpenCode for the registration sync test -- the name parity test covers it.
  </action>
  <verify>
Run `npm run build:hooks` -- should show 4 hooks copied (including gsd-ci-status.js).
Run `ls hooks/dist/` -- should show 4 files.
Run `npm test -- tests/integration/multi-runtime.test.js` -- all existing + new tests pass.
  </verify>
  <done>
- hooks/dist/ contains all 4 gsd-*.js files after build
- Name parity test asserts exact file name sets match across runtimes per category
- Gemini tool name test covers ALL agents (not just planner)
- Hook registration sync test validates settings.json entries match actual hook files
- All multi-runtime tests pass (0 failures)
  </done>
</task>

<task type="auto">
  <name>Task 2: Update deliberation status to concluded/adopted</name>
  <files>.planning/deliberations/cross-runtime-parity-testing.md</files>
  <action>
Update the deliberation file:
1. Change `**Status:** Open` to `**Status:** Adopted`
2. Fill in the Decision Record section:
   - **Decision:** Adopt Option B (name parity) + targeted Option C (all-agent Gemini tool check, hook registration sync) + Option D (glob build-hooks.js). This matches the recommendation section.
   - **Decided:** 2026-03-05
   - **Implemented via:** Quick task 15 (cross-runtime parity testing)
   - **Signals addressed:** sig-2026-03-05-multi-runtime-parity-testing-gap
  </action>
  <verify>Read the deliberation file and confirm Status is Adopted and Decision Record is filled in.</verify>
  <done>Deliberation status is Adopted with complete decision record linking to this implementation.</done>
</task>

</tasks>

<verification>
1. `npm run build:hooks` copies 4 hooks (not 3)
2. `npm test -- tests/integration/multi-runtime.test.js` -- all tests pass including new parity tests
3. `npm test` -- full suite passes (no regressions)
</verification>

<success_criteria>
- build-hooks.js uses glob discovery, no hardcoded hook list
- hooks/dist/ has 4 files (gsd-check-update.js, gsd-statusline.js, gsd-version-check.js, gsd-ci-status.js)
- Name parity test covers agents, commands, workflows, hooks across all applicable runtimes
- Gemini tool name check covers ALL gsd-*.md agents
- Hook registration sync test validates settings.json vs actual files for Claude and Gemini
- Deliberation marked as Adopted
</success_criteria>

<output>
After completion, create `.planning/quick/15-implement-cross-runtime-parity-testing-o/15-SUMMARY.md`
</output>
