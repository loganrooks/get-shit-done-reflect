---
phase: quick-26
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
    - "CODEX_AGENT_SANDBOX maps each gsd-* agent name to correct sandbox mode (workspace-write or read-only)"
    - "convertClaudeToCodexAgentToml(content, agentName) includes sandbox_mode in TOML output between description and developer_instructions"
    - "convertClaudeToCodexAgentToml without agentName defaults sandbox_mode to read-only"
    - "generateCodexConfigBlock produces TOML with GSD_CODEX_MARKER header and [agents.name] registration entries"
    - "stripGsdFromCodexConfig removes everything from GSD_CODEX_MARKER to EOF, preserving content before marker"
    - "stripGsdFromCodexConfig returns null when file would be empty after stripping"
    - "Codex install path collects agent metadata during TOML loop and merges config block into config.toml"
    - "Codex uninstall path calls stripGsdFromCodexConfig to clean agent registrations from config.toml"
  artifacts:
    - path: bin/install.js
      provides: "CODEX_AGENT_SANDBOX constant, updated convertClaudeToCodexAgentToml, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig, GSD_CODEX_MARKER"
      contains: "CODEX_AGENT_SANDBOX"
    - path: tests/unit/install.test.js
      provides: "Unit tests for all new/modified Codex config functions"
  key_links:
    - from: bin/install.js (install Codex agents block ~line 2388)
      to: generateCodexConfigBlock
      via: "agents.push during TOML loop, then mergeCodexConfig call"
      pattern: "generateCodexConfigBlock\\(agents\\)"
    - from: bin/install.js (uninstall ~line 1667)
      to: stripGsdFromCodexConfig
      via: "read config.toml, strip, write back or delete"
      pattern: "stripGsdFromCodexConfig"
    - from: convertClaudeToCodexAgentToml
      to: CODEX_AGENT_SANDBOX
      via: "sandbox mode lookup by agent name with gsdr- prefix stripping"
      pattern: "CODEX_AGENT_SANDBOX"
---

<objective>
Add Codex deployment parity features: per-agent sandbox modes in TOML output, config.toml agent registration with marker-based idempotent management, and clean uninstall support.

Purpose: Bring Codex config management to upstream parity (matching upstream's CODEX_AGENT_SANDBOX, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig pattern) so Codex properly registers agents with correct permissions and can cleanly uninstall.

Output: Updated bin/install.js with 6 new exports + wiring, updated tests covering all new functionality.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js
@tests/unit/install.test.js
@.planning/quick/22-fix-codex-agent-toml-generation-issue-15/22-SUMMARY.md
@.planning/quick/23-shared-frontmatter-helpers-extractfrontm/23-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add CODEX_AGENT_SANDBOX, sandbox_mode to TOML, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig + wiring</name>
  <files>bin/install.js</files>
  <action>
  All changes in bin/install.js:

  **1a. Add constants near top of file (after existing color constants, before any function):**

  ```javascript
  // Codex agent config.toml marker -- distinct from MCP config marker (GSD:BEGIN)
  // Uses marker-to-EOF pattern (upstream parity) rather than BEGIN/END pairs
  const GSD_CODEX_MARKER = '# GSD Agent Configuration \u2014 managed by get-shit-done-reflect installer';

  const CODEX_AGENT_SANDBOX = {
    'gsd-executor': 'workspace-write',
    'gsd-planner': 'workspace-write',
    'gsd-phase-researcher': 'workspace-write',
    'gsd-project-researcher': 'workspace-write',
    'gsd-research-synthesizer': 'workspace-write',
    'gsd-verifier': 'workspace-write',
    'gsd-codebase-mapper': 'workspace-write',
    'gsd-roadmapper': 'workspace-write',
    'gsd-debugger': 'workspace-write',
    'gsd-plan-checker': 'read-only',
    'gsd-integration-checker': 'read-only',
  };
  ```

  Note: upstream uses em-dash (\u2014) in the marker string, matching their `GSD_CODEX_MARKER`. Use the reflect-specific suffix `get-shit-done-reflect installer` to differentiate from upstream's `get-shit-done installer`. This marker is DISTINCT from the existing MCP `# GSD:BEGIN (get-shit-done-reflect-cc)` / `# GSD:END` markers already used by `generateCodexMcpConfig`.

  **1b. Update `convertClaudeToCodexAgentToml` signature and body (currently at line 933):**

  Change signature from `function convertClaudeToCodexAgentToml(content)` to `function convertClaudeToCodexAgentToml(content, agentName)`.

  Add sandbox_mode lookup. The fork installs agents as `gsdr-*` but the CODEX_AGENT_SANDBOX map uses `gsd-*` keys. Strip `gsdr-` prefix and try `gsd-` equivalent:

  ```javascript
  // Resolve sandbox mode: strip gsdr- prefix for lookup, default to read-only
  let sandboxKey = agentName || '';
  if (sandboxKey.startsWith('gsdr-')) {
    sandboxKey = sandboxKey.replace(/^gsdr-/, 'gsd-');
  }
  const sandboxMode = CODEX_AGENT_SANDBOX[sandboxKey] || 'read-only';
  ```

  Insert `sandbox_mode = "${sandboxMode}"` line AFTER description and BEFORE developer_instructions in the TOML output. The updated build section becomes:

  ```javascript
  let toml = `description = ${JSON.stringify(description)}\n`;
  toml += `sandbox_mode = "${sandboxMode}"\n`;
  toml += `developer_instructions = '''\n${safeBody}\n'''\n`;
  ```

  **1c. Add `generateCodexConfigBlock(agents)` function (after `generateCodexMcpConfig`, around line 1211):**

  ```javascript
  function generateCodexConfigBlock(agents) {
    const lines = [
      GSD_CODEX_MARKER,
      '',
    ];
    for (const { name, description } of agents) {
      lines.push(`[agents.${name}]`);
      lines.push(`description = ${JSON.stringify(description)}`);
      lines.push(`config_file = "agents/${name}.toml"`);
      lines.push('');
    }
    return lines.join('\n');
  }
  ```

  **1d. Add `stripGsdFromCodexConfig(content)` function (after generateCodexConfigBlock):**

  ```javascript
  function stripGsdFromCodexConfig(content) {
    const markerIndex = content.indexOf(GSD_CODEX_MARKER);
    if (markerIndex !== -1) {
      let before = content.substring(0, markerIndex).trimEnd();
      return before || null;
    }
    return content;
  }
  ```

  **1e. Add `mergeCodexConfig(configPath, gsdBlock)` function (after stripGsdFromCodexConfig):**

  ```javascript
  function mergeCodexConfig(configPath, gsdBlock) {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, gsdBlock + '\n');
      return;
    }
    const existing = fs.readFileSync(configPath, 'utf8');
    const markerIndex = existing.indexOf(GSD_CODEX_MARKER);
    if (markerIndex !== -1) {
      let before = existing.substring(0, markerIndex).trimEnd();
      if (before) {
        fs.writeFileSync(configPath, before + '\n\n' + gsdBlock + '\n');
      } else {
        fs.writeFileSync(configPath, gsdBlock + '\n');
      }
      return;
    }
    const content = existing.trimEnd() + '\n\n' + gsdBlock + '\n';
    fs.writeFileSync(configPath, content);
  }
  ```

  **1f. Wire into Codex install path (around line 2388-2403):**

  In the Codex agent TOML generation loop, collect agent metadata. Currently the loop just converts and writes. Update to:

  ```javascript
  const agents = [];
  for (const entry of agentEntries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
      content = replacePathsInContent(content, pathPrefix);
      content = processAttribution(content, getCommitAttribution(runtime));
      const destName = entry.name.startsWith('gsd-')
        ? entry.name.replace(/^gsd-/, 'gsdr-').replace(/\.md$/, '.toml')
        : entry.name.replace(/\.md$/, '.toml');
      const agentBaseName = destName.replace('.toml', '');
      // Pass agent name for sandbox mode lookup
      const tomlContent = convertClaudeToCodexAgentToml(content, agentBaseName);
      fs.writeFileSync(path.join(codexAgentsDest, destName), tomlContent);
      // Collect metadata for config.toml registration
      const { frontmatter } = extractFrontmatterAndBody(content);
      const description = extractFrontmatterField(frontmatter, 'description') || '';
      agents.push({ name: agentBaseName, description });
    }
  }
  ```

  Then AFTER the agent loop and verification, BEFORE the `generateCodexAgentsMd` call (~line 2411), add:

  ```javascript
  // Register agents in config.toml
  if (agents.length > 0) {
    const configPath = path.join(targetDir, 'config.toml');
    const gsdBlock = generateCodexConfigBlock(agents);
    mergeCodexConfig(configPath, gsdBlock);
    console.log(`  ${green}+${reset} Registered ${agents.length} agents in config.toml`);
  }
  ```

  **1g. Wire into Codex uninstall path (replace existing config.toml cleanup at lines 1667-1688):**

  The existing uninstall section 3c already handles config.toml with BEGIN/END MCP markers. Replace it to use BOTH cleanup strategies -- `stripGsdFromCodexConfig` for agent registration (marker-to-EOF), and the existing BEGIN/END removal for MCP config:

  ```javascript
  // 3c. Remove GSD agent registration from config.toml (Codex only)
  if (isCodex) {
    const configTomlPath = path.join(targetDir, 'config.toml');
    if (fs.existsSync(configTomlPath)) {
      let content = fs.readFileSync(configTomlPath, 'utf8');
      // Strip agent registration (marker-to-EOF pattern)
      const cleaned = stripGsdFromCodexConfig(content);
      if (cleaned === null) {
        fs.unlinkSync(configTomlPath);
        console.log(`  ${green}✓${reset} Removed config.toml (was GSD-only)`);
        removedCount++;
      } else if (cleaned !== content) {
        // Also strip MCP config section if present
        const GSD_MCP_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
        const GSD_MCP_END = '# GSD:END (get-shit-done-reflect-cc)';
        let finalContent = cleaned;
        const mBegin = finalContent.indexOf(GSD_MCP_BEGIN);
        const mEnd = finalContent.indexOf(GSD_MCP_END);
        if (mBegin !== -1 && mEnd !== -1) {
          finalContent = finalContent.substring(0, mBegin) + finalContent.substring(mEnd + GSD_MCP_END.length);
          finalContent = finalContent.trim();
        }
        if (!finalContent) {
          fs.unlinkSync(configTomlPath);
          console.log(`  ${green}✓${reset} Removed config.toml (was GSD-only)`);
        } else {
          fs.writeFileSync(configTomlPath, finalContent + '\n');
          console.log(`  ${green}✓${reset} Cleaned GSD sections from config.toml`);
        }
        removedCount++;
      } else {
        // No agent marker found, still check MCP markers
        const GSD_MCP_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
        const GSD_MCP_END = '# GSD:END (get-shit-done-reflect-cc)';
        const mBegin = content.indexOf(GSD_MCP_BEGIN);
        const mEnd = content.indexOf(GSD_MCP_END);
        if (mBegin !== -1 && mEnd !== -1) {
          let finalContent = content.substring(0, mBegin) + content.substring(mEnd + GSD_MCP_END.length);
          finalContent = finalContent.trim();
          if (!finalContent) {
            fs.unlinkSync(configTomlPath);
          } else {
            fs.writeFileSync(configTomlPath, finalContent + '\n');
          }
          console.log(`  ${green}✓${reset} Removed GSD MCP section from config.toml`);
          removedCount++;
        }
      }
    }
  }
  ```

  **1h. Update module.exports (line 2870):**

  Add `generateCodexConfigBlock`, `stripGsdFromCodexConfig`, `mergeCodexConfig`, `CODEX_AGENT_SANDBOX`, `GSD_CODEX_MARKER` to the exports object.

  </action>
  <verify>Run `node -e "const m = require('./bin/install.js'); console.log(typeof m.CODEX_AGENT_SANDBOX, typeof m.generateCodexConfigBlock, typeof m.stripGsdFromCodexConfig, typeof m.mergeCodexConfig, typeof m.GSD_CODEX_MARKER)"` -- should print "object function function function string".</verify>
  <done>All 6 items (constant, updated function, 3 new functions, install/uninstall wiring) implemented. convertClaudeToCodexAgentToml accepts agentName and includes sandbox_mode. generateCodexConfigBlock produces TOML with marker. stripGsdFromCodexConfig strips marker-to-EOF. mergeCodexConfig handles create/update/append. Install loop collects metadata and registers agents. Uninstall cleans both agent and MCP markers.</done>
</task>

<task type="auto">
  <name>Task 2: Add unit tests for all new Codex config functions</name>
  <files>tests/unit/install.test.js</files>
  <action>
  Update the imports at the top of the test file to include new exports: `generateCodexConfigBlock`, `stripGsdFromCodexConfig`, `mergeCodexConfig`, `CODEX_AGENT_SANDBOX`, `GSD_CODEX_MARKER`.

  Add a new `describe('Codex config.toml agent registration')` block (after the existing `describe('Codex MCP config.toml generation')` block, around line 2032) with these tests:

  **CODEX_AGENT_SANDBOX tests:**

  1. `'CODEX_AGENT_SANDBOX maps executor agents to workspace-write'` -- verify gsd-executor, gsd-planner, gsd-verifier etc. are 'workspace-write'.

  2. `'CODEX_AGENT_SANDBOX maps checker agents to read-only'` -- verify gsd-plan-checker and gsd-integration-checker are 'read-only'.

  3. `'CODEX_AGENT_SANDBOX returns undefined for unknown agents (defaults handled by caller)'` -- verify `CODEX_AGENT_SANDBOX['gsd-nonexistent']` is undefined.

  **convertClaudeToCodexAgentToml with agentName tests (add to existing describe block at line 1337):**

  4. `'includes sandbox_mode when agentName provided'` -- call with content that has frontmatter and agentName='gsdr-executor'. Verify output contains `sandbox_mode = "workspace-write"` and that sandbox_mode appears BEFORE developer_instructions.

  5. `'strips gsdr- prefix for sandbox lookup'` -- call with agentName='gsdr-plan-checker'. Verify output contains `sandbox_mode = "read-only"`.

  6. `'defaults to read-only when agentName not in CODEX_AGENT_SANDBOX'` -- call with agentName='gsdr-unknown'. Verify `sandbox_mode = "read-only"`.

  7. `'defaults to read-only when agentName omitted (backward compat)'` -- call with only content (no second arg). Verify `sandbox_mode = "read-only"`.

  **generateCodexConfigBlock tests:**

  8. `'produces TOML with GSD_CODEX_MARKER and agent entries'` -- call with `[{name: 'gsdr-executor', description: 'Plan executor'}]`. Verify output contains the marker, `[agents.gsdr-executor]`, `description = "Plan executor"`, `config_file = "agents/gsdr-executor.toml"`.

  9. `'handles multiple agents'` -- call with 3 agents. Verify each gets its own `[agents.*]` section.

  10. `'escapes double quotes in description'` -- call with description containing quotes. Verify JSON.stringify handles it.

  **stripGsdFromCodexConfig tests:**

  11. `'removes GSD section from marker to EOF, preserves content before'` -- input with user content then marker then agent sections. Verify user content remains, agent sections removed.

  12. `'returns null when file is all GSD content'` -- input that starts with the marker. Verify returns null.

  13. `'returns content unchanged when no marker present'` -- input with no marker. Verify returns same content.

  **mergeCodexConfig tests (use tmpdirTest):**

  14. `'creates new config.toml when none exists'` -- call mergeCodexConfig on empty tmpdir. Verify file created with block content.

  15. `'appends to existing config.toml without marker'` -- write user content, then mergeCodexConfig. Verify user content + agent block.

  16. `'replaces existing GSD section on re-install'` -- call mergeCodexConfig twice. Verify only one marker, no duplication.

  All tests should follow existing patterns in the file (vitest, tmpdirTest for fs operations, fsSync for reads).
  </action>
  <verify>`npm test -- tests/unit/install.test.js` passes with 0 failures. New test count should be 16 higher than current.</verify>
  <done>All 16 tests pass. CODEX_AGENT_SANDBOX mapping verified. convertClaudeToCodexAgentToml with agentName verified (gsdr- prefix stripping, defaults, backward compat). generateCodexConfigBlock output validated. stripGsdFromCodexConfig handles all three cases (strip, null, passthrough). mergeCodexConfig handles create/append/replace.</done>
</task>

</tasks>

<verification>
1. `npm test` -- full suite passes, no regressions
2. `node -e "const m = require('./bin/install.js'); console.log(Object.keys(m).filter(k => k.includes('Codex') || k.includes('CODEX')))"` -- lists all new Codex exports
3. `node -e "const m = require('./bin/install.js'); const t = m.convertClaudeToCodexAgentToml('---\nname: test\ndescription: Test\n---\nBody', 'gsdr-executor'); console.log(t)"` -- output shows sandbox_mode = "workspace-write" between description and developer_instructions
4. `node -e "const m = require('./bin/install.js'); console.log(m.generateCodexConfigBlock([{name:'gsdr-exec', description:'Test'}]))"` -- shows marker + [agents.gsdr-exec] section
5. `node -e "const m = require('./bin/install.js'); console.log(m.stripGsdFromCodexConfig('user = true\\n\\n' + m.GSD_CODEX_MARKER + '\\nagent stuff'))"` -- shows "user = true\n"
</verification>

<success_criteria>
- All existing tests continue to pass (no regressions from signature change -- existing tests call convertClaudeToCodexAgentToml(content) without agentName, which should still work with default read-only)
- 16 new tests pass covering CODEX_AGENT_SANDBOX, sandbox_mode in TOML, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig
- Codex install produces config.toml with agent registrations alongside existing MCP config
- Codex uninstall cleanly removes both agent registration and MCP sections from config.toml
- All 6 new exports available: CODEX_AGENT_SANDBOX, GSD_CODEX_MARKER, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig (plus updated convertClaudeToCodexAgentToml)
</success_criteria>

<output>
After completion, create `.planning/quick/26-codex-deployment-parity-sandbox-modes-co/26-SUMMARY.md`
</output>
