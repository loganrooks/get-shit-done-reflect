---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/install.js
autonomous: true

must_haves:
  truths:
    - "Running the installer shows GSD block letters with REFLECT underneath in a distinct color"
    - "The tagline reads 'GSD Reflect' with the fork description, not the upstream GSD description"
    - "Help text references 'npx get-shit-done-reflect-cc' not 'npx get-shit-done-cc'"
  artifacts:
    - path: "bin/install.js"
      provides: "Installer with GSD Reflect branding"
      contains: "REFLECT"
  key_links:
    - from: "bin/install.js"
      to: "package.json"
      via: "pkg.version reference"
      pattern: "pkg\\.version"
---

<objective>
Update the installer (bin/install.js) branding from upstream GSD to GSD Reflect.

Purpose: The installer is the first thing users see. It must reflect the fork identity -- GSD Reflect, not generic GSD.
Output: Updated bin/install.js with new ASCII art, tagline, and help text.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@bin/install.js (lines 108-153 are the primary targets)
@package.json (for name and description reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update ASCII banner, tagline, and help text in bin/install.js</name>
  <files>bin/install.js</files>
  <action>
  Modify three sections of bin/install.js:

  **1. ASCII Banner (lines 108-118):** Replace the `banner` constant with new art that has "GSD" in cyan (existing) and "REFLECT" in block letters underneath in yellow. Use the same Unicode box-drawing character style (full blocks, half blocks). The REFLECT text should be visually centered or left-aligned to match GSD. Here is the exact ASCII art to use:

  ```
     ██████╗ ███████╗██████╗
    ██╔════╝ ██╔════╝██╔══██╗
    ██║  ███╗███████╗██║  ██║
    ██║   ██║╚════██║██║  ██║
    ╚██████╔╝███████║██████╔╝
     ╚═════╝ ╚══════╝╚═════╝
    ██████╗ ███████╗███████╗██╗     ███████╗ ██████╗████████╗
    ██╔══██╗██╔════╝██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝
    ██████╔╝█████╗  █████╗  ██║     █████╗  ██║        ██║
    ██╔══██╗██╔══╝  ██╔══╝  ██║     ██╔══╝  ██║        ██║
    ██║  ██║███████╗██║     ███████╗███████╗╚██████╗   ██║
    ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚══════╝ ╚═════╝   ╚═╝
  ```

  Color scheme: "GSD" lines in cyan (existing `cyan` variable), "REFLECT" lines in yellow (existing `yellow` variable). Add `reset` after each color block.

  The banner string construction should be:
  ```javascript
  const banner = '\n' +
    cyan + '   ██████╗ ███████╗██████╗\n' +
    '  ██╔════╝ ██╔════╝██╔══██╗\n' +
    '  ██║  ███╗███████╗██║  ██║\n' +
    '  ██║   ██║╚════██║██║  ██║\n' +
    '  ╚██████╔╝███████║██████╔╝\n' +
    '   ╚═════╝ ╚══════╝╚═════╝' + reset + '\n' +
    yellow + '  ██████╗ ███████╗███████╗██╗     ███████╗ ██████╗████████╗\n' +
    '  ██╔══██╗██╔════╝██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝\n' +
    '  ██████╔╝█████╗  █████╗  ██║     █████╗  ██║        ██║\n' +
    '  ██╔══██╗██╔══╝  ██╔══╝  ██║     ██╔══╝  ██║        ██║\n' +
    '  ██║  ██║███████╗██║     ███████╗███████╗╚██████╗   ██║\n' +
    '  ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚══════╝ ╚═════╝   ╚═╝' + reset + '\n' +
    '\n' +
    '  GSD Reflect ' + dim + 'v' + pkg.version + reset + '\n' +
    '  An AI coding agent that learns from its mistakes.\n' +
    '  Built on GSD by TACHES.\n';
  ```

  **2. Help text usage line (line 152):** Replace ALL occurrences of `npx get-shit-done-cc` with `npx get-shit-done-reflect-cc` in the help text string. There are approximately 7 occurrences in the help text template literal on line 152. Search for the exact string `get-shit-done-cc` and replace with `get-shit-done-reflect-cc`. Do NOT replace occurrences of `get-shit-done` that are not part of the npx command (e.g., directory names like `get-shit-done/` should remain unchanged).

  **3. Help text description:** In the same help text block (line 152), the introductory `Usage:` line is fine as-is since it just shows the command. No other description changes needed in the help text -- the banner already displays the fork description.

  **Important:** Do NOT modify any other part of the file. The installer logic, uninstall logic, runtime detection, and all other functionality must remain exactly as-is.
  </action>
  <verify>
  Run `node bin/install.js --help` and verify:
  1. The ASCII art shows "GSD" in cyan and "REFLECT" in yellow block letters below
  2. The tagline reads "GSD Reflect v{version}"
  3. The description reads "An AI coding agent that learns from its mistakes."
  4. All example commands reference `npx get-shit-done-reflect-cc`
  5. No other functionality is broken: `node bin/install.js --help` exits cleanly with code 0
  </verify>
  <done>
  - ASCII banner displays two-tone GSD (cyan) + REFLECT (yellow) block art
  - Tagline shows "GSD Reflect" with fork-appropriate description
  - All help text examples use `npx get-shit-done-reflect-cc`
  - Installer exits cleanly with --help flag
  </done>
</task>

</tasks>

<verification>
Run `node bin/install.js --help` and visually confirm:
- Two-color ASCII art (GSD cyan, REFLECT yellow)
- "GSD Reflect v{version}" tagline
- Fork description: "An AI coding agent that learns from its mistakes."
- All npx commands reference `get-shit-done-reflect-cc`
- Exit code 0
</verification>

<success_criteria>
- The installer banner visually identifies the project as "GSD Reflect", distinct from upstream GSD
- Help text is self-consistent with the fork's package name (`get-shit-done-reflect-cc`)
- No functional changes to installer behavior (install, uninstall, runtime detection all unchanged)
</success_criteria>

<output>
After completion, create `.planning/quick/001-update-installer-branding-for-gsd-reflect/001-SUMMARY.md`
</output>
