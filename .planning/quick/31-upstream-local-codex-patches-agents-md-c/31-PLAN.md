---
phase: quick-31
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/install.js
  - get-shit-done/references/capability-matrix.md
  - get-shit-done/workflows/collect-signals.md
  - tests/unit/install.test.js
autonomous: true

must_haves:
  truths:
    - "AGENTS.md generation describes Codex subagent support accurately (not 'No Task tool support')"
    - "Capability matrix marks Codex task_tool as Y [2] with correct footnote"
    - "collect-signals uses gsdr-* namespace and Codex-native model policy"
    - "All 350 tests pass after changes"
    - "`node bin/install.js --local` propagates source to .claude/ without error"
  artifacts:
    - path: "bin/install.js"
      provides: "Corrected generateCodexAgentsMd() Runtime Capabilities section"
      contains: "Task tool support is available via Codex subagents"
    - path: "get-shit-done/references/capability-matrix.md"
      provides: "Updated capability matrix with Codex task_tool=Y"
      contains: "Y [2]"
    - path: "get-shit-done/workflows/collect-signals.md"
      provides: "Codex-native signal collection workflow"
      contains: "gsdr-*-sensor.md"
    - path: "tests/unit/install.test.js"
      provides: "Updated test assertion matching new AGENTS.md content"
      contains: "Task tool support is available"
  key_links:
    - from: "bin/install.js"
      to: ".claude/ runtime copies"
      via: "node bin/install.js --local"
      pattern: "generateCodexAgentsMd"
---

<objective>
Upstream three locally-patched Codex runtime files to their npm source equivalents so changes survive reinstall.

Purpose: Spike 003 confirmed Codex has stable subagent support. The local runtime files (~/.codex/) were patched to reflect this, but those patches get overwritten on reinstall. The npm source files must carry the corrections.

Output: Three source files updated, one test updated, all tests green.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js (lines 1140-1192: generateCodexAgentsMd function)
@get-shit-done/references/capability-matrix.md
@get-shit-done/workflows/collect-signals.md
@tests/unit/install.test.js (lines 1512-1573: generateCodexAgentsMd tests)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Patch install.js AGENTS.md generation and capability-matrix.md</name>
  <files>
    bin/install.js
    get-shit-done/references/capability-matrix.md
    tests/unit/install.test.js
  </files>
  <action>
**bin/install.js** -- In `generateCodexAgentsMd()` (line ~1173-1178), replace the Runtime Capabilities section:

REPLACE lines 1173-1178:
```
## Runtime Capabilities

This runtime operates with limited capabilities compared to Claude Code:
- **No Task tool support** -- Codex cannot spawn sub-agents, so all execution is sequential within a single context
- **No hooks support** -- pre-commit hooks and other lifecycle hooks are unavailable in Codex
- **No tool restrictions** -- Codex does not support allowed-tools filtering, so all tools are always available to skills
```

WITH:
```
## Runtime Capabilities

This runtime differs from Claude Code in a few important ways:
- **Task tool support is available via Codex subagents/threads** -- Codex can delegate bounded subtasks and run them in parallel, but the control surface differs from Claude's \`Task()\`-style spawning. Some GSD workflows may still fall back to sequential execution until they are adapted to Codex-native delegation patterns.
- **No hooks support** -- pre-commit hooks and other lifecycle hooks are unavailable in Codex
- **No tool restrictions** -- Codex does not support allowed-tools filtering, so all tools are always available to skills
```

Note: The file uses template literal with escaped backticks (`\`...\``). Ensure the `Task()` reference uses `\`Task()\`` to match the existing escaping convention in the template string.

**get-shit-done/references/capability-matrix.md** -- Apply all changes to match the patched ~/.codex/ version:

1. Quick Reference table (line 11): Change `|     N     |` to `|   Y [2]   |` for Codex task_tool
2. Renumber footnotes: existing [2] becomes [3], [3] becomes [4], [4] becomes [5]
3. Add new footnote [2] after [1]: `> [2] Stable multi-agent support via Codex subagents/threads. The capability exists, but the runtime-native interface differs from Claude's \`Task()\`-style spawning and needs Codex-specific orchestration patterns.`
4. Update tool_permissions row (line 13): `Y [2]` becomes `Y [3]`
5. Update mcp_servers row (line 14): `Y [3]` becomes `Y [4]`, `Y [4]` becomes `Y [5]`
6. Update footnotes [2]-[4] text to become [3]-[5]
7. Format Reference table (line 26-28): Fix namespace -- `command/gsd-*.md` becomes `command/gsdr-*.md`, `agents/gsd-*.md` becomes `agents/gsdr-*.md` (both OpenCode and Gemini rows that still use old namespace)
8. task_tool detail section (line 34-35): Replace description with runtime-neutral version: "Can delegate bounded subtasks to child agents for parallel execution. The exact mechanism is runtime-specific: Claude/OpenCode use explicit task-style spawning, while Codex uses native subagent workflows and agent threads."
9. task_tool Available in (line 36-37): Change from `**Available in:** Claude Code, OpenCode, Gemini CLI [1]` + `**Missing in:** Codex CLI` to `**Available in:** Claude Code, OpenCode, Gemini CLI [1], Codex CLI [2]` and remove the "Missing in" line. Add footnote [2] for Codex specifics.
10. Update degraded behavior (line 42): `gsd-executor` becomes `gsdr-executor`
11. How orchestrators adapt (line 45-46): Replace Claude-specific `Task()` mention with runtime-neutral "delegate via the runtime-native child-agent mechanism"
12. Codex CLI summary table (lines 96-103): Update task_tool row from `N` / "Sequential plan execution" to `Y [1]` / "Use Codex subagents/threads rather than Claude-style Task() spawning". Add footnote. Rewrite the summary paragraph to reflect that Codex now has delegation capability.
13. capability_check example (line 154): Replace `Spawn gsd-executor via Task()` with `Delegate each plan in the wave via the runtime-native child-agent mechanism.`

Use the patched ~/.codex/ version as the ground truth for the final state.

**tests/unit/install.test.js** -- Line 1526: Change assertion from `expect(content).toContain('No Task tool support')` to `expect(content).toContain('Task tool support is available via Codex subagents')`.
  </action>
  <verify>
Run `npm test -- --reporter=dot` and confirm 350 tests pass with 0 failures. Specifically check that the `generateCodexAgentsMd()` test suite passes (the test at line ~1526 with the updated assertion, plus the 4KB size limit test at line ~1560).
  </verify>
  <done>
install.js generates AGENTS.md with accurate Codex subagent description. Capability matrix shows Codex task_tool as Y[2] with proper footnoting. All namespace references use gsdr-* prefix. Test assertion updated and passes.
  </done>
</task>

<task type="auto">
  <name>Task 2: Patch collect-signals.md with Codex-native workflow adaptations</name>
  <files>
    get-shit-done/workflows/collect-signals.md
  </files>
  <action>
Apply all changes to match the patched ~/.codex/ version. The diffs are extensive but well-defined:

**Architecture comment block (lines 17-31):**
1. Line 17: `gsd-*-sensor.md` becomes `gsdr-*-sensor.md`
2. Line 19: `gsd-{name}-sensor.md` becomes `gsdr-{name}-sensor.md`
3. After line 21 (auto-discovery section), add fallback line: "If no file-backed sensor specs exist, fall back to built-in runtime roles when available (currently `gsdr-artifact-sensor` and `gsdr-git-sensor`)."
4. Replace the sensor model selection comment (line about "auto = derive from model_profile") with Codex-native model policy block:
   ```
   - Sensor model policy in Codex runtimes:
     - Default single-pass run: `gpt-5.4` with `reasoning_effort=medium`
     - Optional comparison run: add `gpt-5.4-mini` with `reasoning_effort=medium` when calibrating a new sensor, checking disagreement, or validating a high-stakes phase
     - Escalation path: use `gpt-5.4` with `reasoning_effort=high` only when the phase was messy or cross-run disagreement materially changes synthesis judgment
     - Do NOT hardcode legacy `quality -> opus` / `balanced -> sonnet` mappings in Codex-native workflows
   ```

**required_reading (line ~36-37):** Add `and any \`signal_collection\` overrides` to the config.json line.

**check_prerequisites step (line 86):** `/gsd:execute-phase` becomes `$gsdr-execute-phase`

**load_config step:** After `Store MODEL_PROFILE...` line, add: `If \`signal_collection\` is absent, use the workflow defaults documented below.`

**discover_sensors step (lines 108-146):**
1. Step description (line 109): `gsd-*-sensor.md` becomes `gsdr-*-sensor.md`. Add sentence about fallback.
2. `ls` path (line 113): Pattern changes from `~/.claude/agents/gsd-*-sensor.md` to the runtime-appropriate path for `gsdr-*-sensor.md` files. NOTE: since this is the npm SOURCE file (which uses `~/` prefix convention), use the path that the installer will transform. The installed Codex version uses `/home/rookslog/.codex/agents/gsdr-*-sensor.md` but the source should use a path-prefix-aware pattern.
3. Empty sensor handling (lines 115-119): Instead of erroring immediately, fall back to built-in runtime sensors. Change the if-block to set `DISCOVERED_SENSORS` to built-in artifact and git sensors.
4. Sensor name extraction (line 124): `gsd-` prefix becomes `gsdr-` prefix in sed
5. Remove `HAS_CONFIG_SCHEMA` extraction (unused)
6. Post-discovery text (line 144): "name, spec_path_or_role, timeout_seconds" (add "or_role")
7. Frontmatter failure text: "file-backed sensor" specificity

**load_sensor_config step (lines 148-231):**
1. Add introduction about multi-run comparison support
2. `SYNTHESIZER_MODEL` default: `'auto'` becomes `'gpt-5.4'`
3. Add `SYNTHESIZER_REASONING_EFFORT` config reading (default `'medium'`)
4. Add `SENSOR_RUNS` config reading with default `[{label:'primary', model:'gpt-5.4', reasoning_effort:'medium', enabled:true}]`
5. Add recommended config shape JSON block showing the multi-run structure
6. Add prose about when to enable comparison mode
7. Replace `ENABLED_SENSORS` variable with `ENABLED_SENSOR_RUNS` that expands sensors across run profiles
8. Remove per-sensor `SENSOR_MODEL` extraction (replaced by run profiles)
9. Update the resolve_model function removal -- model is now carried per-run, not derived from MODEL_PROFILE
10. Update `ENABLED_NAMES` output to show `sensor@run_label` format
11. Add note about MODEL_PROFILE not overriding Codex defaults

**spawn_sensors step (lines 233-268):**
1. Loop over `ENABLED_SENSOR_RUNS` instead of `ENABLED_SENSORS`
2. Add `RUN_LABEL`, `REASONING_EFFORT` fields
3. Sensor agent type: handle `builtin:` prefix for fallback sensors
4. Add `reasoning_effort=REASONING_EFFORT` to Task() spawn
5. Update description to include `({NAME}@{RUN_LABEL})`
6. Add `Run label`, `Model`, `Reasoning effort` to prompt
7. Update tracking paragraph to include run labels and model metadata

**collect_sensor_outputs step (lines 270-309):**
1. gsd-tools.js path: `~/.claude/get-shit-done/bin/gsd-tools.js` becomes the runtime-appropriate path (source uses `get-shit-done-reflect/bin/gsd-tools.js` prefix)
2. Add metadata preservation note for cross-run convergence
3. Add `COMPARISON_DISAGREEMENTS` to tracked counts
4. Add comparison mode logic: primary vs comparison output comparison, escalation on material disagreement

**spawn_synthesizer step (lines 331-354):**
1. Agent type: `gsd-signal-synthesizer` becomes `gsdr-signal-synthesizer`
2. Add `reasoning_effort="{synthesizer_reasoning_effort}"` parameter
3. KB script path: `get-shit-done/bin/kb-rebuild-index.sh` becomes `get-shit-done-reflect/bin/kb-rebuild-index.sh`
4. Update synthesizer model defaults paragraph to reference gpt-5.4 and reasoning_effort
5. Add escalation guidance for messy phases

**present_results step (lines 356-399):**
1. Table header: `Sensor` becomes `Sensor@Run`
2. Table row: add `@{run_label}` to name column
3. Add "Comparison mode:" line to header section
4. Add "### Model Comparison" section for multi-run results
5. Add comparison disagreement warning to health notes

**error_handling section (lines 440-453):**
1. "No sensors discovered" error: trigger only after BOTH discovery paths fail
2. `/gsd:signal` references become `$gsdr-signal`

Use the patched ~/.codex/ version as the ground truth. The source file should be identical in content structure, differing only in path prefixes (source uses `~/` prefix, not absolute paths).
  </action>
  <verify>
Diff the updated source file against the patched ~/.codex/ version to confirm structural alignment (paths will differ due to prefix conventions, but content/logic must match). Then run `npm test -- --reporter=dot` to confirm no regressions.
  </verify>
  <done>
collect-signals.md source file carries all Codex-native adaptations: gsdr-* namespace, Codex model policy (gpt-5.4 defaults, reasoning_effort, comparison runs), built-in sensor fallback, multi-run support, and corrected command/path references.
  </done>
</task>

<task type="auto">
  <name>Task 3: Reinstall locally and verify full propagation</name>
  <files>
    .claude/get-shit-done-reflect/references/capability-matrix.md
    .claude/get-shit-done-reflect/workflows/collect-signals.md
  </files>
  <action>
Run `node bin/install.js --local` to propagate source changes to the `.claude/` installed copies.

After install, verify propagation by checking key content in the installed copies:
1. `.claude/get-shit-done-reflect/references/capability-matrix.md` contains `Y [2]` for Codex task_tool
2. `.claude/get-shit-done-reflect/workflows/collect-signals.md` contains `gsdr-*-sensor.md` and Codex model policy
3. Path prefixes in installed copies use `./.claude/` (not `~/`) per the installer's `replacePathsInContent()` behavior

Run `npm test -- --reporter=dot` one final time to confirm all 350 tests still pass.

Do NOT touch ~/.codex/ files -- those are runtime copies updated by `--codex --global`, not `--local`.
  </action>
  <verify>
`node bin/install.js --local` exits 0. `npm test -- --reporter=dot` shows 350 passed, 0 failed. Grep `.claude/get-shit-done-reflect/references/capability-matrix.md` for `Y [2]` confirms propagation.
  </verify>
  <done>
Source edits propagated to .claude/ installed copies. All tests pass. Source files are the canonical versions -- runtime copies (.claude/, ~/.codex/) are downstream.
  </done>
</task>

</tasks>

<verification>
1. `npm test -- --reporter=dot` passes all 350 tests
2. `grep 'Task tool support is available' bin/install.js` returns a match
3. `grep 'Y \[2\]' get-shit-done/references/capability-matrix.md` returns matches for Codex task_tool
4. `grep 'gsdr-\*-sensor' get-shit-done/workflows/collect-signals.md` returns matches
5. `grep 'gpt-5.4' get-shit-done/workflows/collect-signals.md` returns matches for Codex model policy
6. `grep 'No Task tool support' bin/install.js` returns NO matches (old claim removed)
7. `.claude/` copies reflect source changes after `--local` install
</verification>

<success_criteria>
- Three npm source files updated to match their patched ~/.codex/ counterparts
- Test assertion updated from old claim to new accurate description
- All 350 tests pass
- `node bin/install.js --local` propagates without error
- No references to "No Task tool support" remain in source
- Codex task_tool correctly shown as Y[2] in capability matrix
- collect-signals uses gsdr-* namespace and Codex-native model defaults throughout
</success_criteria>

<output>
After completion, create `.planning/quick/31-upstream-local-codex-patches-agents-md-c/31-SUMMARY.md`
</output>
