---
phase: quick-260402-qnh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/bin/lib/core.cjs
  - get-shit-done/bin/lib/commands.cjs
  - tests/unit/model-resolution.test.js
autonomous: true
must_haves:
  truths:
    - "gsdr-prefixed agent names resolve to the same model as their gsd- equivalents"
    - "gsd-executor resolves to opus (inherit) under quality profile, not sonnet"
    - "Bucket 3 agents (sensors, synthesizers, reflector, advisor, checker, spike-runner) have explicit MODEL_PROFILES entries"
    - "model_overrides with gsdr- keys are checked correctly"
  artifacts:
    - path: "get-shit-done/bin/lib/core.cjs"
      provides: "Normalization in resolveModelInternal + complete MODEL_PROFILES table"
      contains: "gsdr-.*gsd-"
    - path: "get-shit-done/bin/lib/commands.cjs"
      provides: "Normalization in cmdResolveModel unknown_agent detection"
      contains: "gsdr-.*gsd-"
    - path: "tests/unit/model-resolution.test.js"
      provides: "Test coverage for prefix normalization, executor quality fix, bucket 3 agents"
      exports: ["describe"]
  key_links:
    - from: "get-shit-done/bin/lib/core.cjs:resolveModelInternal"
      to: "MODEL_PROFILES"
      via: "normalized agent name lookup"
      pattern: "normalizedType.*MODEL_PROFILES"
    - from: "get-shit-done/bin/lib/commands.cjs:cmdResolveModel"
      to: "MODEL_PROFILES"
      via: "normalized agent name for unknown_agent flag"
      pattern: "normalizedType.*MODEL_PROFILES"
---

<objective>
Fix GitHub Issue #30: Model resolver keyed on gsd-* so gsdr-* agents fall back to sonnet.

Purpose: Installed GSDR workflows call `resolve-model gsdr-planner` etc., but MODEL_PROFILES keys are `gsd-planner`. The lookup misses and falls to `return 'sonnet'`, silently downgrading quality-profile agents (planner, debugger, phase-researcher, project-researcher, roadmapper) from opus to sonnet. Additionally, `gsd-executor` quality tier is `sonnet` in the code but `opus` in the docs/design intent.

Output: Corrected model resolution for all gsdr-* agents, complete MODEL_PROFILES table, test coverage.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@get-shit-done/bin/lib/core.cjs (MODEL_PROFILES constant lines 17-33, resolveModelInternal lines 511-526)
@get-shit-done/bin/lib/commands.cjs (cmdResolveModel lines 200-214)
@get-shit-done/references/model-profiles.md (canonical profile table)
@tests/unit/sensors.test.js (test pattern reference: GSD_TOOLS CLI invocation via execSync)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix MODEL_PROFILES table, add gsdr- normalization in core.cjs and commands.cjs</name>
  <files>get-shit-done/bin/lib/core.cjs, get-shit-done/bin/lib/commands.cjs</files>
  <action>
Three changes in core.cjs:

1. **Fix gsd-executor quality tier** (line 21): Change `'gsd-executor': { quality: 'sonnet', ...}` to `{ quality: 'opus', balanced: 'sonnet', budget: 'sonnet' }` to match model-profiles.md canonical table (executor under quality should be opus, per design rationale in that doc: "Executors follow explicit PLAN.md instructions" applies to balanced/budget, but quality profile means maximum reasoning power for all decision-making).

2. **Add bucket 3 missing agents** to MODEL_PROFILES (after the existing entries). All agents from the `agents/` directory that lack entries:
   - `'gsd-advisor-researcher'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (research assistant, not primary researcher)
   - `'gsd-reflector'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (read-only analysis)
   - `'gsd-spike-runner'`: `{ quality: 'opus', balanced: 'sonnet', budget: 'sonnet' }` (runs empirical experiments, needs strong reasoning)
   - `'gsd-signal-collector'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (sensor-tier per feedback_sensor_model_sonnet.md)
   - `'gsd-signal-synthesizer'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (synthesis from collected signals)
   - `'gsd-artifact-sensor'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (sensor-tier)
   - `'gsd-ci-sensor'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (sensor-tier)
   - `'gsd-git-sensor'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (sensor-tier)
   - `'gsd-log-sensor'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (sensor-tier)
   - `'gsd-checker'`: `{ quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' }` (verification, same as plan-checker)
   - `'gsd-advisor'`: `{ quality: 'opus', balanced: 'sonnet', budget: 'sonnet' }` (advisory role needs reasoning)

3. **Add gsdr- prefix normalization in resolveModelInternal** (line 511-526): At the top of the function body, add:
   ```js
   const normalizedType = agentType.replace(/^gsdr-/, 'gsd-');
   ```
   Then replace all `agentType` usages within the function with `normalizedType`:
   - Line 515: `config.model_overrides?.[normalizedType]`
   - Line 522: `MODEL_PROFILES[normalizedType]`

One change in commands.cjs:

4. **Add gsdr- prefix normalization in cmdResolveModel** (line 200-214): At the top of the function body (after the null check), add:
   ```js
   const normalizedType = agentType.replace(/^gsdr-/, 'gsd-');
   ```
   Then use `normalizedType` for the MODEL_PROFILES lookup on line 209:
   ```js
   const agentModels = MODEL_PROFILES[normalizedType];
   ```
   Keep passing the original `agentType` to `resolveModelInternal` (which will normalize internally), or pass `normalizedType` -- either way works since both normalize. Using the original is cleaner since resolveModelInternal handles its own normalization.

   Actually, for consistency and to avoid double-normalization confusion: pass `normalizedType` to `resolveModelInternal` and use `normalizedType` for the MODEL_PROFILES lookup. This makes the function self-consistent.

IMPORTANT: Edit source files in `get-shit-done/` only (npm source). Do NOT edit `.claude/` files. After changes, run `node bin/install.js --local` to sync.
  </action>
  <verify>
  Run: `node get-shit-done/bin/gsd-tools.cjs resolve-model gsdr-planner --raw` in the project root (which has .planning/config.json). Should NOT include `unknown_agent: true`. Compare output with `node get-shit-done/bin/gsd-tools.cjs resolve-model gsd-planner --raw` -- both should match.

  Run: `node get-shit-done/bin/gsd-tools.cjs resolve-model gsdr-executor --raw` -- check the model value is `inherit` (meaning opus tier) under quality profile, not `sonnet`.

  Run: `node get-shit-done/bin/gsd-tools.cjs resolve-model gsdr-artifact-sensor --raw` -- should NOT include `unknown_agent: true`.
  </verify>
  <done>
  - All gsdr-* agent names resolve identically to their gsd-* equivalents
  - gsd-executor quality tier is opus (returned as 'inherit')
  - All 11 bucket 3 agents have MODEL_PROFILES entries
  - No `unknown_agent: true` for any agent in the agents/ directory
  </done>
</task>

<task type="auto">
  <name>Task 2: Add unit tests for model resolution normalization and completeness</name>
  <files>tests/unit/model-resolution.test.js</files>
  <action>
Create a new test file `tests/unit/model-resolution.test.js` following the established test pattern (see sensors.test.js, automation.test.js for reference: vitest imports, tmpdirTest helper, GSD_TOOLS CLI invocation).

Tests to write:

1. **gsdr- prefix resolves same as gsd- prefix**: For each of `['planner', 'executor', 'debugger', 'phase-researcher', 'roadmapper']`, create a tmp project with `.planning/config.json` containing `{ "model_profile": "quality" }`, call `resolve-model gsd-{name} --raw` and `resolve-model gsdr-{name} --raw`, parse JSON, assert `model` values are identical.

2. **executor quality tier is opus (inherit)**: Create tmp project with quality profile, call `resolve-model gsd-executor --raw`, assert `model === 'inherit'`.

3. **bucket 3 agents are known**: For each of `['artifact-sensor', 'ci-sensor', 'git-sensor', 'log-sensor', 'signal-collector', 'signal-synthesizer', 'reflector', 'spike-runner', 'checker', 'advisor', 'advisor-researcher']`, call `resolve-model gsd-{name} --raw`, parse JSON, assert `unknown_agent` is NOT present in the result object.

4. **model_overrides with gsdr- prefix**: Create tmp project with config `{ "model_profile": "balanced", "model_overrides": { "gsdr-planner": "haiku" } }`. Call `resolve-model gsdr-planner --raw`. Assert model is `haiku`. This tests that model_overrides with gsdr- keys are normalized and matched.

   Wait -- model_overrides normalization: The user writes `gsdr-planner` in their config because they think in gsdr- namespace. The code normalizes the agentType parameter, but the config key is what it is. We need to normalize BOTH the agentType AND the config key check. Actually, re-reading resolveModelInternal: it does `config.model_overrides?.[agentType]`. If we normalize agentType to `gsd-planner`, it won't match a config key of `gsdr-planner`. The fix should check both: `config.model_overrides?.[normalizedType] || config.model_overrides?.[agentType]` (check gsd- first, then original gsdr-). Actually the simpler approach: check `normalizedType` first, then if no match check the original `agentType`. This handles both gsd- and gsdr- keys in config.

   Update the Task 1 action: in resolveModelInternal, the override check should be:
   ```js
   const override = config.model_overrides?.[normalizedType] ?? config.model_overrides?.[agentType];
   ```
   This way users can write either `gsd-planner` or `gsdr-planner` in model_overrides and both work.

   Test: config has `"gsdr-executor": "haiku"`, call `resolve-model gsdr-executor --raw`, assert model is `haiku`. Also test config has `"gsd-executor": "haiku"`, call `resolve-model gsdr-executor --raw`, assert model is `haiku` (normalized key wins).

5. **Fallback for truly unknown agent**: Call `resolve-model gsd-nonexistent --raw`, assert model is `sonnet` and `unknown_agent` is `true`.

Use `tmpdirTest` helper from `tests/helpers/tmpdir.js`. Each test creates `.planning/config.json` in its tmpdir with appropriate config, then runs CLI command via execSync with `cwd: tmpdir`.
  </action>
  <verify>Run `npm test -- tests/unit/model-resolution.test.js` -- all tests pass.</verify>
  <done>
  - New test file with 5+ test cases covering: prefix normalization, executor quality fix, bucket 3 completeness, model_overrides with both prefixes, unknown agent fallback
  - All tests pass
  </done>
</task>

<task type="auto">
  <name>Task 3: Reinstall locally and verify end-to-end</name>
  <files>(no new files -- runs install and full test suite)</files>
  <action>
1. Run `node bin/install.js --local` to sync source changes to `.claude/` install target.
2. Run `npm test` to verify all 145+ existing tests still pass alongside the new tests.
3. Verify the installed core.cjs in `.claude/get-shit-done-reflect/bin/lib/core.cjs` contains the normalization and updated MODEL_PROFILES.
4. Run a representative installed-path resolve-model to confirm end-to-end: `node .claude/get-shit-done-reflect/bin/gsd-tools.cjs resolve-model gsdr-planner --raw` -- should return the correct model without unknown_agent.

Note: The task 1 action mentions checking model_overrides with both normalized and original keys. Make sure the resolveModelInternal implementation uses the `??` fallback pattern described in Task 2 action notes:
```js
const override = config.model_overrides?.[normalizedType] ?? config.model_overrides?.[agentType];
```
  </action>
  <verify>
  `npm test` passes with 0 failures. `node .claude/get-shit-done-reflect/bin/gsd-tools.cjs resolve-model gsdr-planner --raw` returns correct JSON without `unknown_agent`.
  </verify>
  <done>
  - Local install synced
  - Full test suite passes (existing + new)
  - Installed runtime resolves gsdr-* agents correctly
  </done>
</task>

</tasks>

<verification>
1. `npm test` -- all tests pass (existing + new model-resolution tests)
2. `node get-shit-done/bin/gsd-tools.cjs resolve-model gsdr-planner --raw` -- no unknown_agent, correct model
3. `node get-shit-done/bin/gsd-tools.cjs resolve-model gsdr-executor --raw` under quality profile -- model is 'inherit' (not 'sonnet')
4. `node get-shit-done/bin/gsd-tools.cjs resolve-model gsdr-artifact-sensor --raw` -- no unknown_agent
5. Every agent in `agents/gsd-*.md` has a matching `gsd-{name}` key in MODEL_PROFILES
</verification>

<success_criteria>
- All three buckets from Issue #30 are resolved
- gsdr- prefix agents resolve identically to gsd- equivalents
- gsd-executor quality tier matches model-profiles.md (opus/inherit)
- All agents in agents/ directory have MODEL_PROFILES entries
- Test coverage proves normalization works for resolve-model CLI
- Full test suite passes
- Local install synced
</success_criteria>

<output>
After completion, create `.planning/quick/260402-qnh-fix-github-issue-30-model-resolver-keyed/260402-qnh-SUMMARY.md`
</output>
