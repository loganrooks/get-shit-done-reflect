# Coding Conventions

**Analysis Date:** 2026-02-02

## Overview

This codebase is a meta-prompting and specification-driven development system for Claude Code, OpenCode, and Gemini. It consists primarily of:
- **Markdown files** with YAML frontmatter (agents, commands, workflows, templates, references)
- **JavaScript/Node.js files** for CLI installation and hooks
- Minimal actual source code — the system is specification-focused

All conventions are documented comprehensively in `GSD-STYLE.md`.

## Naming Patterns

**Markdown Files:**
- kebab-case for all files: `execute-phase.md`, `gsd-executor.md`, `plan-phase.md`
- Organized by category: `commands/gsd/`, `agents/`, `get-shit-done/workflows/`, etc.

**Commands (slash commands):**
- Format: `gsd:kebab-case` (e.g., `/gsd:execute-phase`, `/gsd:plan-phase`)
- Defined in `commands/gsd/*.md` with YAML frontmatter

**XML Tags:**
- kebab-case: `<execution_context>`, `<success_criteria>`, `<step>`
- Semantic purpose-driven (not generic `<section>`, `<item>`, `<content>`)

**JavaScript Functions/Variables:**
- Functions: camelCase, descriptive (e.g., `getGlobalDir`, `expandTilde`, `parseConfigDirArg`)
- Constants: CAPS_UNDERSCORES for bash variables only (e.g., `PLAN_START_TIME`, `COMMIT_PLANNING_DOCS`)
- Object keys: camelCase (e.g., `selected_runtimes`, `update_available`)

**Step Names (in workflows):**
- snake_case: `name="load_project_state"`, `name="execute_tasks"`, `name="record_start_time"`

## Code Style

**JavaScript Files:**
- Style: Imperative, direct instruction
- No TypeScript — uses vanilla Node.js
- Use of JSDoc comments for complex functions:
  ```javascript
  /**
   * Get the global config directory for a runtime
   * @param {string} runtime - 'claude', 'opencode', or 'gemini'
   * @param {string|null} explicitDir - Explicit directory from --config-dir flag
   */
  function getGlobalDir(runtime, explicitDir = null) {
    // implementation
  }
  ```

**Markdown Files:**
- **No frontmatter in workflows** — only in commands and agents
- **Commands and agents have YAML frontmatter:**
  ```yaml
  ---
  name: gsd:command-name
  description: One-line description
  tools: Read, Write, Bash, Glob, Grep
  color: cyan
  ---
  ```

## Error Handling

**Pattern (JavaScript):**
- Try/catch blocks with graceful fallback:
  ```javascript
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    return {};  // Return sensible default on error
  }
  ```
- Silent failures for non-critical operations (see `gsd-statusline.js` line 84-86)
- Exit codes for critical errors:
  ```javascript
  console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
  process.exit(1);
  ```

**Pattern (Markdown/Instructions):**
- Use `@-references` for conditional includes: `@.planning/DISCOVERY.md (if exists)`
- Document decision points and error recovery in `<step>` blocks
- Mention "if file exists", "if missing", etc. explicitly

## Logging

**JavaScript:**
- Use console.log for normal output, console.error for errors
- ANSI color codes for terminal output (see `bin/install.js` line 8-13):
  ```javascript
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const reset = '\x1b[0m';
  ```
- Progress indicators and status messages use colors
- Silent mode on errors (e.g., `stdio: 'ignore'` for background processes)

**Markdown Workflows:**
- Document assumptions and decision points in `<step>` blocks
- Use explicit "check if file exists" patterns
- Include verification commands inline

## Comments

**When to Comment:**
- JSDoc for complex functions with parameters and return types
- Inline comments for non-obvious logic (see `bin/install.js` line 49-66 for priority comments)
- Comments explaining tool name mappings (see `bin/install.js` lines 285-293)

**Style:**
- Single-line: `// Comment`
- Multi-line: `/** JSDoc style */` for functions
- Explain the "why", not the "what"

## Function Design

**Size Guidelines:**
- Functions focus on a single responsibility
- Helper functions are extracted for reuse (e.g., `expandTilde`, `readSettings`, `writeSettings`)

**Parameters:**
- Use named parameters when count > 2
- Default parameters for optional values:
  ```javascript
  function getGlobalDir(runtime, explicitDir = null) { ... }
  function uninstall(isGlobal, runtime = 'claude') { ... }
  ```

**Return Values:**
- Explicit null/undefined for missing values:
  ```javascript
  // null = remove, undefined = keep default, string = custom
  ```
- Map return types in comments (see attribution handling, line 200-203)

## Module Design

**JavaScript:**
- Node.js CommonJS style: `require()`, no ES modules
- Single responsibility per file
- Utility functions grouped logically:
  - `expandTilde`, `buildHookCommand` - path utilities
  - `readSettings`, `writeSettings` - config I/O
  - `convertToolName`, `convertGeminiToolName` - tool mapping

**Markdown Workflows:**
- One workflow per file
- No barrel files or re-exports
- Self-contained: all context loaded via `@-references`

## Import Organization

**JavaScript (require statements):**
```javascript
// Built-in modules first
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

// Package requires second
const pkg = require('../package.json');
```

**Markdown @-references:**
- Static (always load): `@.planning/PROJECT.md`
- Conditional (if exists): `@.planning/DISCOVERY.md (if exists)`
- Lazy loading signals — references are loaded by consumers, not pre-loaded

## XML Tag Semantics

**Semantic purpose-driven tags only:**
- `<objective>` - What to accomplish
- `<execution_context>` - @-file references and setup
- `<context>` - Dynamic content
- `<process>` - Container for steps
- `<step>` - Individual execution step with `name` attribute
- `<success_criteria>` - Measurable completion checklist
- `<task>` - Work unit with `type` attribute

**Task types:**
- `type="auto"` — autonomous execution
- `type="checkpoint:human-verify"` — user verification needed
- `type="checkpoint:decision"` — user decision required

## Tone and Language

**Requirements:**
- Imperative voice: "Execute", "Read", "Create" (not passive)
- No filler: "Let me", "Just", "Simply", "Basically"
- No sycophancy: No "Great!", "Awesome!", "I'd love to help"
- Direct, factual, technical precision

**Character Preservation:**
- ALWAYS preserve diacritics: ą, ę, ć, ź, ż, ó, ł, ń, ś, ü, ö, ä, ß, é, è, ê, ç
- Never strip or replace special characters in user content

**Example Good:**
"JWT auth with refresh rotation using jose library"

**Example Bad:**
"Phase complete" or "Authentication implemented"

## Bash Variable Conventions

**In markdown workflows:**
- CAPS_UNDERSCORES: `PLAN_START_TIME`, `COMMIT_PLANNING_DOCS`, `PHASE_ARG`
- Store execution metadata:
  ```bash
  PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  PLAN_START_EPOCH=$(date +%s)
  ```

## Path Specifications

**Always include file paths with context:**
- Relative to project root: `bin/install.js`, `commands/gsd/execute-phase.md`
- Home directory shortcuts: `~/.claude`, `~/.config/opencode`
- Environment-based paths in comments:
  ```javascript
  // Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
  ```

## Configuration and Documentation

**Frontmatter fields:**
- `name`: Command identifier
- `description`: One-line summary
- `tools`: Comma-separated tool names (Read, Write, Bash, Grep, Glob, etc.)
- `color`: Terminal color for display
- `argument-hint`: Parameter specification (required or optional)

**File locations:**
- Config: `.planning/config.json`, `settings.json` in runtimes' config directories
- Cache: `~/.claude/cache/`, `~/.config/opencode/cache/`
- Workflows: `get-shit-done/workflows/`
- Templates: `get-shit-done/templates/`
- Commands: `commands/gsd/`

## Anti-Patterns to Avoid

**DO NOT use:**
- Enterprise patterns (story points, sprints, RACI matrices)
- Temporal language in implementation docs ("Previously", "Changed to", "Instead of")
- Generic XML tags (`<section>`, `<item>`, `<content>`)
- Vague tasks (missing file paths, unclear verify/done criteria)
- Human time estimates in plans
- `git add .` (always stage specific files)
- Force operations without explicit user request (`git reset --hard`, `git push --force`)

---

*Convention analysis: 2026-02-02*
