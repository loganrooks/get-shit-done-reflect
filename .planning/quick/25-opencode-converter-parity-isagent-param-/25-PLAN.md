---
phase: quick-25
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
    - "convertClaudeToOpencodeFrontmatter with isAgent:true strips skills, color, memory, maxTurns, permissionMode, disallowedTools fields and skips comment lines"
    - "convertClaudeToOpencodeFrontmatter with isAgent:false (default) preserves color field unchanged from prior behavior"
    - "subagent_type general-purpose is remapped to general in converted content"
    - "resolveOpencodeConfigPath prefers .jsonc when it exists, falls back to .json"
    - "readSettings and writeSettings are used instead of ad-hoc JSON parse/write in configureOpencodePermissions and uninstall cleanup"
  artifacts:
    - path: "bin/install.js"
      provides: "isAgent param, subagent remap, jsonc resolver, settings helper refactor"
    - path: "tests/unit/install.test.js"
      provides: "Unit tests for all four gaps"
  key_links:
    - from: "agent install call site (~line 2321)"
      to: "convertClaudeToOpencodeFrontmatter"
      via: "passes { isAgent: true }"
      pattern: "convertClaudeToOpencodeFrontmatter\\(content, \\{ isAgent: true \\}\\)"
    - from: "configureOpencodePermissions"
      to: "resolveOpencodeConfigPath"
      via: "function call for config path resolution"
      pattern: "resolveOpencodeConfigPath"
---

<objective>
Bring four OpenCode converter features to parity with upstream: isAgent parameter for agent-specific field stripping, subagent_type remapping, .jsonc config resolution, and settings helper refactoring.

Purpose: Close converter gaps identified in upstream sync audit so agent installation correctly strips agent-only fields, subagent types map correctly, and config file handling is robust.
Output: Updated bin/install.js with all four gaps closed, updated tests/unit/install.test.js with regression and new feature tests.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js
@tests/unit/install.test.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add isAgent parameter and subagent_type remap to convertClaudeToOpencodeFrontmatter</name>
  <files>bin/install.js</files>
  <action>
  Modify `convertClaudeToOpencodeFrontmatter` (line 774) to accept an options parameter:

  1. Change signature from `function convertClaudeToOpencodeFrontmatter(content)` to `function convertClaudeToOpencodeFrontmatter(content, { isAgent = false } = {})`.

  2. In the content replacement section (after line 781, alongside the existing AskUserQuestion/SlashCommand/TodoWrite/gsd: replacements), add subagent_type remapping:
     ```javascript
     convertedContent = convertedContent.replace(/subagent_type="general-purpose"/g, 'subagent_type="general"');
     ```

  3. In the frontmatter line-by-line loop (inside `for (const line of lines)`), add two new blocks BEFORE the existing `allowed-tools:` check:

     a. Skip commented lines when isAgent:
     ```javascript
     if (isAgent && trimmed.startsWith('#')) {
       continue;
     }
     ```

     b. Strip agent-only fields with multi-line array handling (same `inSkippedArrayField` pattern used in QT24 Gemini fix). Add a new tracking variable `let inSkippedArrayField = false;` alongside the existing `let inAllowedTools = false;`. Then before the `allowed-tools:` detection:
     ```javascript
     if (isAgent && /^(skills|color|memory|maxTurns|permissionMode|disallowedTools):/.test(trimmed)) {
       inSkippedArrayField = true;
       continue;
     }
     if (inSkippedArrayField) {
       if (trimmed.startsWith('- ')) {
         continue;
       }
       inSkippedArrayField = false;
       // Fall through to process this line normally
     }
     ```

  4. Update the agent installation call site (line ~2321 area) from:
     ```javascript
     content = convertClaudeToOpencodeFrontmatter(content);
     ```
     to:
     ```javascript
     content = convertClaudeToOpencodeFrontmatter(content, { isAgent: true });
     ```

  5. Do NOT change the two other call sites (line ~1340 in copyFlattenedCommands and line ~1381 in copyWithPathReplacement) -- those handle commands and workflow/reference files, not agents, so they keep the default `isAgent: false`.
  </action>
  <verify>Run `npm test` -- all 302+ existing tests pass. Manually inspect the three call sites to confirm only the agent path passes isAgent:true.</verify>
  <done>convertClaudeToOpencodeFrontmatter accepts isAgent option, strips agent-only fields when true, preserves them when false, remaps subagent_type, and agent install call site passes isAgent:true.</done>
</task>

<task type="auto">
  <name>Task 2: Add resolveOpencodeConfigPath and refactor configureOpencodePermissions to use it plus readSettings/writeSettings</name>
  <files>bin/install.js</files>
  <action>
  1. Add `resolveOpencodeConfigPath` function near `getOpencodeGlobalDir()` (after line ~103):
     ```javascript
     function resolveOpencodeConfigPath(configDir) {
       const jsoncPath = path.join(configDir, 'opencode.jsonc');
       if (fs.existsSync(jsoncPath)) {
         return jsoncPath;
       }
       return path.join(configDir, 'opencode.json');
     }
     ```

  2. Refactor `configureOpencodePermissions()` (line ~1846):
     - Replace the hardcoded `path.join(opencodeConfigDir, 'opencode.json')` with `resolveOpencodeConfigPath(opencodeConfigDir)`.
     - The function already uses `parseJsonc` for reading, which handles both .json and .jsonc content, so reading logic stays the same.
     - The write at line ~1906 (`fs.writeFileSync(configPath, ...)`) can stay as-is since it writes to whichever path was resolved.

  3. Refactor the uninstall cleanup path (line ~1732 area):
     - Replace `const configPath = path.join(opencodeConfigDir, 'opencode.json');` with `const configPath = resolveOpencodeConfigPath(opencodeConfigDir);`.
     - Replace the ad-hoc `JSON.parse(fs.readFileSync(configPath, 'utf8'))` (line ~1735) with `readSettings(configPath)` -- note: readSettings uses JSON.parse which doesn't handle JSONC comments. However, the uninstall path currently uses raw JSON.parse too, so this is equivalent. If the file is .jsonc with comments, it will hit the catch block and silently skip, same as current behavior.

  4. Refactor the `getCommitAttribution` call for opencode (line ~476):
     - Replace `readSettings(path.join(getGlobalDir('opencode', null), 'opencode.json'))` with `readSettings(resolveOpencodeConfigPath(getGlobalDir('opencode', null)))`.

  5. Add to module.exports: `resolveOpencodeConfigPath`, `readSettings`, `writeSettings`. The exports line (line ~2836) becomes:
     ```javascript
     module.exports = { replacePathsInContent, injectVersionScope, getGsdHome, migrateKB, countKBEntries, installKBScripts, createProjectLocalKB, convertClaudeToCodexSkill, convertClaudeToCodexAgentToml, copyCodexSkills, generateCodexAgentsMd, generateCodexMcpConfig, convertClaudeToGeminiAgent, safeFs, buildLocalHookCommand, extractFrontmatterAndBody, extractFrontmatterField, resolveOpencodeConfigPath, readSettings, writeSettings };
     ```

  6. Update the import in tests/unit/install.test.js (line ~13) to destructure the three new exports.
  </action>
  <verify>Run `npm test` -- all tests pass. Grep for remaining hardcoded `opencode.json` references in bin/install.js -- only the comment strings and console.log messages should remain, not path.join constructions.</verify>
  <done>resolveOpencodeConfigPath exists and is used at all config read/write sites. readSettings/writeSettings are exported. No functional hardcoded opencode.json path.join calls remain.</done>
</task>

<task type="auto">
  <name>Task 3: Add unit tests for all four gaps</name>
  <files>tests/unit/install.test.js</files>
  <action>
  Add a new `describe` block in tests/unit/install.test.js (after the existing `extractFrontmatterField unit tests` block, around line ~600 area). Import `convertClaudeToOpencodeFrontmatter` (not currently in the destructured imports -- Task 2 does not add it since it is already exported; check the exports line and add to the test import if missing).

  Wait -- check: `convertClaudeToOpencodeFrontmatter` is NOT in the current exports (line 2836). It needs to be added to module.exports in Task 2's step 5. Update Task 2's exports line to also include `convertClaudeToOpencodeFrontmatter`.

  Tests to add:

  ```javascript
  describe('convertClaudeToOpencodeFrontmatter', () => {
    describe('isAgent parameter', () => {
      it('strips skills field with array items when isAgent is true', () => {
        const input = '---\ndescription: test\nskills:\n  - skill1\n  - skill2\ncolor: blue\n---\nbody'
        const result = convertClaudeToOpencodeFrontmatter(input, { isAgent: true })
        expect(result).not.toContain('skills:')
        expect(result).not.toContain('skill1')
        expect(result).not.toContain('color:')
        expect(result).toContain('description: test')
      })

      it('strips memory, maxTurns, permissionMode, disallowedTools when isAgent is true', () => {
        const input = '---\ndescription: test\nmemory: true\nmaxTurns: 5\npermissionMode: auto\ndisallowedTools:\n  - Write\n  - Edit\n---\nbody'
        const result = convertClaudeToOpencodeFrontmatter(input, { isAgent: true })
        expect(result).not.toContain('memory:')
        expect(result).not.toContain('maxTurns:')
        expect(result).not.toContain('permissionMode:')
        expect(result).not.toContain('disallowedTools:')
        expect(result).not.toContain('Write')
        expect(result).toContain('description: test')
      })

      it('skips commented lines when isAgent is true', () => {
        const input = '---\ndescription: test\n# hooks:\n#   pre-tool-use: check.sh\n---\nbody'
        const result = convertClaudeToOpencodeFrontmatter(input, { isAgent: true })
        expect(result).not.toContain('hooks:')
        expect(result).not.toContain('check.sh')
        expect(result).toContain('description: test')
      })

      it('preserves color field when isAgent is false (default)', () => {
        const input = '---\ncolor: blue\ndescription: test\n---\nbody'
        const result = convertClaudeToOpencodeFrontmatter(input)
        // color: blue gets converted to hex by the color converter
        expect(result).toContain('color:')
        expect(result).toContain('description: test')
      })

      it('preserves color field when isAgent is explicitly false', () => {
        const input = '---\ncolor: blue\ndescription: test\n---\nbody'
        const result = convertClaudeToOpencodeFrontmatter(input, { isAgent: false })
        expect(result).toContain('color:')
      })
    })

    describe('subagent_type remapping', () => {
      it('remaps subagent_type="general-purpose" to "general"', () => {
        const input = '---\ndescription: test\n---\nUse subagent_type="general-purpose" for tasks'
        const result = convertClaudeToOpencodeFrontmatter(input)
        expect(result).toContain('subagent_type="general"')
        expect(result).not.toContain('general-purpose')
      })

      it('does not remap other subagent_type values', () => {
        const input = '---\ndescription: test\n---\nUse subagent_type="specialist" here'
        const result = convertClaudeToOpencodeFrontmatter(input)
        expect(result).toContain('subagent_type="specialist"')
      })
    })

    describe('existing behavior preserved', () => {
      it('replaces tool names (AskUserQuestion, SlashCommand, TodoWrite)', () => {
        const input = '---\ndescription: test\n---\nUse AskUserQuestion and SlashCommand and TodoWrite'
        const result = convertClaudeToOpencodeFrontmatter(input)
        expect(result).toContain('question')
        expect(result).toContain('skill')
        expect(result).toContain('todowrite')
        expect(result).not.toContain('AskUserQuestion')
      })

      it('converts allowed-tools to tools object', () => {
        const input = '---\nallowed-tools:\n  - Read\n  - Write\n---\nbody'
        const result = convertClaudeToOpencodeFrontmatter(input)
        expect(result).toContain('tools:')
        expect(result).toContain('read: true')
        expect(result).toContain('write: true')
      })
    })
  })

  describe('resolveOpencodeConfigPath', () => {
    it('prefers .jsonc when it exists', () => {
      const tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'))
      try {
        fsSync.writeFileSync(path.join(tmpDir, 'opencode.json'), '{}')
        fsSync.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), '{}')
        const result = resolveOpencodeConfigPath(tmpDir)
        expect(result).toBe(path.join(tmpDir, 'opencode.jsonc'))
      } finally {
        fsSync.rmSync(tmpDir, { recursive: true })
      }
    })

    it('falls back to .json when .jsonc does not exist', () => {
      const tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'))
      try {
        const result = resolveOpencodeConfigPath(tmpDir)
        expect(result).toBe(path.join(tmpDir, 'opencode.json'))
      } finally {
        fsSync.rmSync(tmpDir, { recursive: true })
      }
    })
  })

  describe('readSettings and writeSettings', () => {
    it('readSettings returns empty object for missing file', () => {
      const result = readSettings('/nonexistent/path/settings.json')
      expect(result).toEqual({})
    })

    it('readSettings returns empty object for invalid JSON', () => {
      const tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'))
      const filePath = path.join(tmpDir, 'bad.json')
      try {
        fsSync.writeFileSync(filePath, 'not json{{{')
        const result = readSettings(filePath)
        expect(result).toEqual({})
      } finally {
        fsSync.rmSync(tmpDir, { recursive: true })
      }
    })

    it('readSettings parses valid JSON', () => {
      const tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'))
      const filePath = path.join(tmpDir, 'good.json')
      try {
        fsSync.writeFileSync(filePath, '{"key": "value"}')
        const result = readSettings(filePath)
        expect(result).toEqual({ key: 'value' })
      } finally {
        fsSync.rmSync(tmpDir, { recursive: true })
      }
    })

    it('writeSettings produces formatted JSON with trailing newline', () => {
      const tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'))
      const filePath = path.join(tmpDir, 'out.json')
      try {
        writeSettings(filePath, { a: 1, b: 'two' })
        const content = fsSync.readFileSync(filePath, 'utf8')
        expect(content).toBe(JSON.stringify({ a: 1, b: 'two' }, null, 2) + '\n')
      } finally {
        fsSync.rmSync(tmpDir, { recursive: true })
      }
    })
  })
  ```

  Also update the import destructuring at line ~13 to include the new exports:
  `convertClaudeToOpencodeFrontmatter, resolveOpencodeConfigPath, readSettings, writeSettings`
  </action>
  <verify>Run `npm test` -- all tests pass including the new ones. Count should increase from 302 to ~317+.</verify>
  <done>All four gaps have dedicated test coverage: isAgent stripping (5 tests), subagent_type remap (2 tests), resolveOpencodeConfigPath (2 tests), readSettings/writeSettings (4 tests), regression (2 tests).</done>
</task>

</tasks>

<verification>
1. `npm test` passes with all existing + new tests
2. `grep -n 'convertClaudeToOpencodeFrontmatter' bin/install.js` shows three call sites, only the agent one passes `{ isAgent: true }`
3. `grep -n "path.join.*'opencode.json'" bin/install.js` shows zero functional path construction (only comments/logs)
4. Module exports include: `resolveOpencodeConfigPath`, `readSettings`, `writeSettings`, `convertClaudeToOpencodeFrontmatter`
</verification>

<success_criteria>
- convertClaudeToOpencodeFrontmatter accepts { isAgent } option and strips agent-only fields when true
- subagent_type="general-purpose" remapped to "general" in all converted content
- resolveOpencodeConfigPath prefers .jsonc over .json at all OpenCode config read sites
- configureOpencodePermissions and uninstall cleanup use resolveOpencodeConfigPath
- readSettings/writeSettings exported for external use
- All existing tests pass (regression), 15+ new tests added
</success_criteria>

<output>
After completion, create `.planning/quick/25-opencode-converter-parity-isagent-param-/25-SUMMARY.md`
</output>
