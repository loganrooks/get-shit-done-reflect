---
name: gsd:update
description: Update GSD to latest version with changelog display
allowed-tools:
  - Bash
  - AskUserQuestion
---

<objective>
Check for GSD updates, install the latest published package if needed, and display what changed.

Routes to the update workflow which handles:
- Runtime-aware version detection (Claude local/global or Codex resolver inventory)
- npm version checking
- Changelog fetching and display
- User confirmation with clean install warning
- Published-package update execution
- Runtime-correct cache handling and restart reminder
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/update.md
</execution_context>

<process>
**Follow the update workflow** from `@~/.claude/get-shit-done/workflows/update.md`.

The workflow handles all logic including:
1. Runtime-aware installed version detection
2. Latest version checking via npm
3. Version comparison
4. Changelog fetching and extraction
5. Target selection and clean install warning display
6. User confirmation
7. Published-package update execution
8. Runtime-specific cache and post-install handling
</process>
