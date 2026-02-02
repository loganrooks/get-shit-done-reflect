# Testing Patterns

**Analysis Date:** 2026-02-02

## Overview

This codebase does not have a traditional test suite. Instead, testing is performed through:
- **Specification-driven verification** (plans include `<verify>` sections)
- **Human checkpoints** in workflows (gate-blocking verification)
- **Integration testing via CLI** (installation and command execution)
- **Manual testing protocols** (UAT and DEBUG templates provided)

The system is designed for AI agent execution in Claude Code, OpenCode, and Gemini environments — not automated test runners.

## Test Framework

**No automated test runner:**
- No Jest, Vitest, Mocha, or similar
- No test scripts in `package.json`
- Tests are narrative specifications embedded in workflows and plans

**Testing approach:**
- Plans include `<verification>` sections with exact steps
- Manual verification commands are documented inline
- Checkpoint gates require explicit user verification

## Manual Testing and Verification

**Template files for testing:**

**UAT Template (`get-shit-done/templates/UAT.md`):**
- User acceptance testing checklist
- Manual verification steps for new features
- Included in plans when human verification is needed

**DEBUG Template (`get-shit-done/templates/DEBUG.md`):**
- Diagnostic procedures for troubleshooting
- Called via `/gsd:debug` command
- Covers common failure scenarios

## Test Structure in Plans

**Plans contain verification procedures:**

Each phase plan (`PLAN.md` files) includes:

```markdown
<verification>
## Verification Steps

1. [Command to run]
2. [Expected output]
3. [Alternative check]
</verification>

<success_criteria>
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
</success_criteria>
```

**Example from execution flow (agents/gsd-executor.md):**
```markdown
<step name="execute_tasks">
  - Check if task has `tdd="true"` attribute → follow TDD execution flow
  - Work toward task completion
  - Run the verification
  - Confirm done criteria met
</step>
```

## Checkpoint Types and Verification

**Human verification checkpoints (`type="checkpoint:human-verify"`):**
```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Description of implementation</what-built>
  <how-to-verify>
    1. Step one
    2. Step two
    3. Step three
  </how-to-verify>
  <resume-signal>Text telling user how to continue</resume-signal>
</task>
```

**Decision checkpoints (`type="checkpoint:decision"`):**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>What needs deciding</decision>
  <context>Why this matters</context>
  <options>
    <option id="identifier">
      <name>Option Name</name>
      <pros>Benefits</pros>
      <cons>Tradeoffs</cons>
    </option>
  </options>
  <resume-signal>Selection instruction</resume-signal>
</task>
```

## JavaScript Verification Patterns

**CLI installation and hook testing:**

**Hook execution verification (`hooks/gsd-statusline.js`):**
- Reads JSON from stdin
- Parses and validates input
- Fails silently on parse errors (line 84-86):
  ```javascript
  } catch (e) {
    // Silent fail - don't break statusline on parse errors
  }
  ```

**Update check verification (`hooks/gsd-check-update.js`):**
- Compares installed version with latest from npm
- Writes result to cache file
- Graceful error handling:
  ```javascript
  let latest = null;
  try {
    latest = execSync('npm view get-shit-done-cc version',
      { encoding: 'utf8', timeout: 10000, windowsHide: true }).trim();
  } catch (e) {}
  ```

**Installation verification (`bin/install.js`):**
Two explicit verification functions:

1. `verifyInstalled(dirPath, description)` (line 1019)
   - Checks if installation directory exists
   - Returns true/false

2. `verifyFileInstalled(filePath, description)` (line 1040)
   - Checks if specific file exists in installation
   - Returns true/false

**Usage pattern in install flow (bin/install.js lines 1040+):**
```javascript
function verifyFileInstalled(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`  ${red}✗${reset} ${description} not found at ${filePath}`);
    return false;
  }
  console.log(`  ${green}✓${reset} ${description} installed`);
  return true;
}
```

## Test Data and Fixtures

**Settings and configuration fixtures:**

**Settings handling (bin/install.js lines 177-195):**
```javascript
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};  // Return empty on parse error
    }
  }
  return {};  // Return empty if file missing
}

function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}
```

**Configuration test scenarios:**
- Attribution settings (null = remove, undefined = keep default, string = custom)
- Tool mapping conversions (Claude → OpenCode, Claude → Gemini)
- Path expansion for tilde (`~/path/to/file`)

## Mock/Stub Patterns

**Not applicable** — this codebase doesn't use mocking frameworks.

**What is tested:**
- File I/O operations with fallback returns
- Path manipulation and expansion
- YAML frontmatter parsing and conversion
- Version number comparisons
- Environment variable reading

**What is NOT tested with code:**
- Runtime behavior is verified manually
- Integration between commands and agents is verified in workflows
- State management is verified through checkpoint execution

## Workflow-Based Testing Patterns

**State verification (`agents/gsd-executor.md` step "load_project_state"):**
```markdown
Read project state:
```bash
cat .planning/STATE.md 2>/dev/null
```

If file exists: Parse and internalize...
If file missing but .planning/ exists: Options...
If .planning/ doesn't exist: Error - project not initialized.
```

**Deviation handling tests (agents/gsd-executor.md lines 143+):**
- Plan specifies deviation rules
- Executor follows rules automatically
- Deviations documented in SUMMARY.md
- Verification confirms success criteria met

**Recovery testing:**
- Checkpoints gate execution
- Fresh agents resume from completion markers
- State.md ensures context continuity

## Test Commands and Verification Steps

**Installation verification:**
```bash
# Verify GSD is installed and available
npx get-shit-done-cc --help

# Verify hook installation
cat ~/.claude/hooks/gsd-statusline.js  # File should exist

# Verify version is current
cat ~/.claude/get-shit-done/VERSION
```

**Command execution tests:**
```bash
# Test slash command availability
/gsd:help                    # Should show command list
/gsd:execute-phase          # Should prompt for phase selection
/gsd:plan-phase [PHASE]     # Should create phase plan
```

**Hook functionality tests:**
```bash
# Test statusline hook (with JSON input)
echo '{"model":{"display_name":"Claude 3.5"},"workspace":{"current_dir":"/path"},"context_window":{"remaining_percentage":50}}' | node hooks/gsd-statusline.js

# Test update check (background process)
node hooks/gsd-check-update.js  # Should write cache to ~/.claude/cache/gsd-update-check.json
```

## Coverage

**Requirements:** Not enforced

**Areas covered by manual verification:**
- Installation to all supported runtimes (Claude Code, OpenCode, Gemini)
- Command invocation and argument parsing
- File I/O and configuration management
- Agent execution and checkpoint handling
- State persistence and recovery

**Areas requiring manual testing:**
- Cross-platform path handling (Windows, macOS, Linux)
- Environment variable resolution priorities
- Frontmatter conversion accuracy
- Hook integration with runtime environments

## Test Types and Scope

**Manual Integration Tests:**
- Run `/gsd:new-project` in new directory
- Complete all phases through `/gsd:execute-phase`
- Verify checkpoint gates pause correctly
- Verify state persists across sessions

**Functionality Tests:**
- Test install script with `--global`, `--local`, `--opencode`, `--claude`, `--gemini` flags
- Test uninstall with `--uninstall` flag
- Test config directory override with `--config-dir`
- Verify files are placed in correct locations per runtime

**Regression Tests:**
- Test attribution handling (null, undefined, custom strings)
- Test frontmatter conversion (Claude → OpenCode → Gemini)
- Test tool name mappings for each runtime
- Test path expansion with tilde and environment variables

## Testing Markdown Files

**No automated parsing**, but manual verification of:

**Frontmatter validation (all commands and agents):**
- Required fields: name, description, tools
- Color field exists and matches valid ANSI color names
- Tool names are valid (Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, etc.)

**XML structure validation:**
- Opening and closing tags match
- Semantic tags used (no generic `<section>`, `<item>`)
- Task types are valid (auto, checkpoint:human-verify, checkpoint:decision)

**Link validation:**
- @-references point to existing files
- Conditional references have `(if exists)` notation
- No broken markdown header cross-references

## Common Test Scenarios

**Scenario: Installation to global Claude Code config**
```bash
npx get-shit-done-cc --claude --global
# Verify files in ~/.claude/
ls ~/.claude/commands/gsd/
ls ~/.claude/agents/
ls ~/.claude/hooks/dist/
```

**Scenario: Installation to local project**
```bash
cd my-project
npx get-shit-done-cc --claude --local
# Verify files in ./.claude/
ls ./.claude/commands/gsd/
ls ./.claude/agents/
```

**Scenario: Gemini CLI conversion**
```bash
# Install for Gemini
npx get-shit-done-cc --gemini --global
# Verify YAML converted (tools as array, tool names in snake_case)
cat ~/.gemini/agents/gsd-executor.md
# Should show: tools:\n  - read_file\n  - write_file
```

**Scenario: Update available notification**
```bash
# Check if update cache was created
cat ~/.claude/cache/gsd-update-check.json
# Should show: {"update_available":true,"installed":"1.11.0","latest":"1.11.1"}
```

## Verification Checklist Template

Used when manual verification is required (see `UAT.md`):

```markdown
## Acceptance Criteria

- [ ] [Criterion one]
- [ ] [Criterion two]
- [ ] [Criterion three]

## How to Verify

1. [Step 1: What command or action]
2. [Step 2: What to expect]
3. [Step 3: How to confirm]

## Sign-Off

- Verified by: [Name]
- Date: [ISO date]
- Notes: [Any observations]
```

---

*Testing analysis: 2026-02-02*
