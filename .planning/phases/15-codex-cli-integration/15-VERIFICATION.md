---
phase: 15-codex-cli-integration
verified: 2026-02-11T16:36:00Z
status: passed
score: 10/10 must-haves verified
---

# Phase 15: Codex CLI Integration Verification Report

**Phase Goal:** Users can install GSD into Codex CLI and use GSD commands (as Skills) to run projects, with graceful degradation for missing capabilities

**Verified:** 2026-02-11T16:36:00Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running --codex flag installs GSD commands as Codex Skills in ~/.codex/skills/ with SKILL.md directory structure | ✓ VERIFIED | copyCodexSkills() creates directory-per-skill structure, integration test verifies gsd-help/, gsd-new-project/, gsd-plan-phase/ directories exist with SKILL.md files |
| 2 | Running --codex generates ~/.codex/AGENTS.md with GSD workflow instructions | ✓ VERIFIED | generateCodexAgentsMd() creates AGENTS.md with GSD markers, integration test verifies markers and capability limitations content |
| 3 | Running --codex installs reference docs to ~/.codex/get-shit-done/ with ~/.claude/ paths converted to ~/.codex/ | ✓ VERIFIED | install() calls copyWithPathReplacement() for get-shit-done/, integration test verifies directory exists and paths are replaced |
| 4 | Running --all includes Codex as 4th runtime alongside Claude, OpenCode, and Gemini | ✓ VERIFIED | selectedRuntimes = ['claude', 'opencode', 'gemini', 'codex'] on line 34, integration test verifies all 4 runtimes install correctly |
| 5 | Running --codex --uninstall removes Skills directories and GSD section from AGENTS.md | ✓ VERIFIED | uninstall() removes gsd-* skill directories (lines 1203-1216) and strips GSD section from AGENTS.md (lines 1266-1286), integration test verifies cleanup |
| 6 | Codex capability limitations are documented (no Task tool, no hooks, no tool restrictions) | ✓ VERIFIED | AGENTS.md content includes "No Task tool support", "No hooks support", "No tool restrictions" (lines 904-906), references capability-matrix.md |
| 7 | codex exec non-interactive mode is documented for scripted/CI usage | ✓ VERIFIED | AGENTS.md contains "Non-interactive Usage (codex exec)" section with examples (lines 910-919) |
| 8 | convertClaudeToCodexSkill strips disallowed frontmatter fields and produces valid SKILL.md format | ✓ VERIFIED | Function keeps only name + description, strips allowed-tools/argument-hint/color (lines 787-793), 8 unit tests verify behavior |
| 9 | Path replacement converts ~/.claude/ to ~/.codex/ in installed Codex files | ✓ VERIFIED | replacePathsInContent() called before convertClaudeToCodexSkill (line 852), integration test verifies no ~/.claude/ in installed SKILL.md files |
| 10 | All 64 tests pass (46 existing + 18 new Codex tests) with zero regressions | ✓ VERIFIED | npx vitest run tests/unit/install.test.js shows 64/64 passing |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `bin/install.js` | Codex adapter functions + CLI integration | ✓ VERIFIED | claudeToCodexTools constant (line 445), convertClaudeToCodexSkill (line 746), copyCodexSkills (line 822), generateCodexAgentsMd (line 868) all exist and substantive |
| `tests/unit/install.test.js` | Codex test suite | ✓ VERIFIED | 18 new tests in "Codex CLI integration" describe block (line 749): 8 unit for convertClaudeToCodexSkill, 5 unit for generateCodexAgentsMd, 4 integration, 1 path verification |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| convertClaudeToCodexSkill() | copyCodexSkills() | called per command during skill copy | ✓ WIRED | Line 854: content = convertClaudeToCodexSkill(content, skillName) inside copyCodexSkills loop |
| copyCodexSkills() | install() | called in Codex install path | ✓ WIRED | Line 1753: copyCodexSkills(gsdSrc, skillsDir, 'gsd', pathPrefix) inside if (isCodex) block |
| generateCodexAgentsMd() | install() | called after skill install | ✓ WIRED | Line 1842: generateCodexAgentsMd(targetDir, pathPrefix) inside if (isCodex) block |
| --codex flag | selectedRuntimes | CLI arg parsing | ✓ WIRED | Line 26: hasCodex = args.includes('--codex'), line 41: if (hasCodex) selectedRuntimes.push('codex') |
| --all flag | codex in runtimes array | selectedRuntimes includes codex | ✓ WIRED | Line 34: selectedRuntimes = ['claude', 'opencode', 'gemini', 'codex'] when hasAll |
| replacePathsInContent() | convertClaudeToCodexSkill() | called before conversion to ensure paths already replaced | ✓ WIRED | Line 852: content = replacePathsInContent(content, pathPrefix) BEFORE line 854: content = convertClaudeToCodexSkill(content, skillName) |
| uninstall() Codex path | skill directory removal | removes gsd-* directories | ✓ WIRED | Lines 1203-1216: isCodex block removes skill directories, lines 1266-1286: removes GSD section from AGENTS.md |
| Interactive prompt | Codex option | Option 4 maps to ['codex'] | ✓ WIRED | Line 2084: "4) Codex CLI (~/.codex)", line 2094-2095: choice '4' -> callback(['codex']) |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| CODEX-01: Installer accepts --codex flag and installs GSD commands as Codex Skills | ✓ SATISFIED | --codex flag parsed (line 26), copyCodexSkills() creates directory-per-skill structure in ~/.codex/skills/ (lines 822-859) |
| CODEX-02: Installer generates ~/.codex/AGENTS.md with GSD workflow instructions | ✓ SATISFIED | generateCodexAgentsMd() creates AGENTS.md with workflow conventions (lines 868-939) |
| CODEX-03: Installer installs reference docs to ~/.codex/get-shit-done/ | ✓ SATISFIED | copyWithPathReplacement() installs get-shit-done/ (lines 1792-1799) |
| CODEX-04: Path replacement converts ~/.claude/ to ~/.codex/ in Codex-installed files | ✓ SATISFIED | replacePathsInContent() called with pathPrefix='~/.codex/' (line 852), integration test verifies no ~/.claude/ in output |
| CODEX-05: --all flag includes Codex as 4th runtime | ✓ SATISFIED | Line 34: selectedRuntimes includes 'codex' when hasAll, integration test verifies 4 runtimes install |
| CODEX-06: Codex capability limitations documented | ✓ SATISFIED | AGENTS.md content explicitly lists no Task tool, no hooks, no tool restrictions (lines 904-906), references capability-matrix.md (line 908) |
| CODEX-07: codex exec non-interactive mode supported | ✓ SATISFIED | AGENTS.md includes "Non-interactive Usage (codex exec)" section with examples (lines 910-919) |

### Anti-Patterns Found

**None detected.**

Scan of modified files (bin/install.js, tests/unit/install.test.js) found:
- No TODO/FIXME comments
- No placeholder content
- No empty implementations
- No console.log-only handlers
- All functions are substantive and wired correctly

### Human Verification Required

None. All must-haves verified programmatically through code inspection and automated test execution.

---

## Verification Details

### Level 1: Existence Checks

All required artifacts exist:
- ✓ bin/install.js (modified, 2250 lines)
- ✓ tests/unit/install.test.js (modified, includes Codex test suite)
- ✓ claudeToCodexTools constant (line 445)
- ✓ convertClaudeToCodexSkill function (line 746)
- ✓ copyCodexSkills function (line 822)
- ✓ generateCodexAgentsMd function (line 868)

### Level 2: Substantive Checks

**claudeToCodexTools constant:**
- 11 tool mappings defined (Read->read_file, Write->apply_patch, Bash->shell, etc.)
- Null mappings for unavailable tools (WebFetch, Task, SlashCommand)
- Pattern matches existing claudeToGeminiTools and claudeToOpencodeTools

**convertClaudeToCodexSkill (line 746, 64 lines):**
- Tool name replacement using word-boundary regex (lines 749-752)
- /gsd:command to $gsd-command conversion (line 755)
- @~/.codex/ file reference conversion (line 759)
- Frontmatter parsing with field filtering (lines 787-793)
- Description truncation to 1024 chars (line 804)
- Angle bracket stripping (line 804)
- Empty description fallback (lines 805-807)
- NO stub patterns (no TODO, no console.log, no placeholder)

**copyCodexSkills (line 822, 38 lines):**
- Cleans existing GSD skills before copying (lines 826-831)
- Recursively processes directories, building compound skill names (lines 842-843)
- Calls replacePathsInContent BEFORE convertClaudeToCodexSkill (lines 852-854) ensuring @ references see already-replaced ~/.codex/ paths
- Creates directory-per-skill structure (line 849, 856)
- NO stub patterns

**generateCodexAgentsMd (line 868, 72 lines):**
- Creates AGENTS.md with distinctive GSD markers (lines 870-871)
- Content under 4KB (52 lines of content)
- Includes command table, workflow conventions, runtime capabilities, codex exec examples (lines 873-920)
- Capability limitations section: "No Task tool support", "No hooks support", "No tool restrictions" (lines 904-906)
- References capability-matrix.md (line 908)
- Idempotent section replacement logic (lines 927-930)
- Append logic for new files or existing without markers (lines 932-938)
- NO stub patterns

**CLI integration:**
- --codex flag parsing (line 26)
- --all includes codex (line 34)
- getDirName('codex') -> '.codex' (line 48)
- getGlobalDir supports CODEX_CONFIG_DIR (lines 107-108)
- Interactive prompt option 4 for Codex (line 2084, 2094-2095)
- Help text shows --codex flag (line 174)

**install() Codex path (lines 1749-1761, 1840-1843):**
- Creates skills/ directory (line 1750-1751)
- Calls copyCodexSkills with gsd prefix (line 1753)
- Verifies installation and reports count (lines 1754-1758)
- Generates AGENTS.md (line 1842)
- Skips agents directory (line 1803: !isCodex guard)
- Skips hooks (line 1868: !isCodex guard)
- NO stub patterns

**uninstall() Codex path (lines 1203-1216, 1266-1286):**
- Removes gsd-* skill directories (lines 1207-1211)
- Removes GSD section from AGENTS.md (lines 1269-1282)
- Deletes AGENTS.md if empty after removal (lines 1277-1278)
- Skips agents cleanup (line 1250: !isCodex guard)
- Skips hooks cleanup (line 1289: !isCodex guard)
- NO stub patterns

**Test coverage (18 new tests, lines 749-1115):**
- 8 unit tests for convertClaudeToCodexSkill: frontmatter stripping, tool mapping, /gsd: conversion, @ conversion, no-frontmatter wrapping, empty description, angle brackets, truncation
- 5 unit tests for generateCodexAgentsMd: new file creation, append, idempotent replace, size limit, capability matrix reference
- 4 integration tests: --codex --global full layout, --codex --uninstall cleanup, --all multi-runtime, path replacement verification
- All 64 tests passing (46 existing + 18 new)

### Level 3: Wiring Checks

**Module exports (line 2250):**
- convertClaudeToCodexSkill: exported ✓
- copyCodexSkills: exported ✓
- generateCodexAgentsMd: exported ✓

**Function call chain:**
1. CLI parsing: --codex flag -> hasCodex -> selectedRuntimes.push('codex') ✓
2. install() detects runtime: runtime === 'codex' -> isCodex ✓
3. install() creates skills: isCodex -> copyCodexSkills(gsdSrc, skillsDir, 'gsd', pathPrefix) ✓
4. copyCodexSkills processes files: for each .md -> replacePathsInContent -> convertClaudeToCodexSkill -> write SKILL.md ✓
5. install() generates AGENTS.md: isCodex -> generateCodexAgentsMd(targetDir, pathPrefix) ✓
6. uninstall() removes skills: isCodex -> remove gsd-* directories ✓
7. uninstall() cleans AGENTS.md: isCodex -> strip GSD section ✓

**Import/usage verification:**
- tests/unit/install.test.js imports all 3 Codex functions (line 13) ✓
- Tests call convertClaudeToCodexSkill directly (8 tests) ✓
- Tests call generateCodexAgentsMd directly (5 tests) ✓
- Integration tests invoke installer with --codex flag (4 tests) ✓

### CODEX-06 Capability Limitations Verification

Required content in AGENTS.md:
- ✓ "No Task tool support -- Codex cannot spawn sub-agents, so all execution is sequential within a single context" (line 904)
- ✓ "No hooks support -- pre-commit hooks and other lifecycle hooks are unavailable in Codex" (line 905)
- ✓ "No tool restrictions -- Codex does not support allowed-tools filtering, so all tools are always available to skills" (line 906)
- ✓ "For full runtime comparison, read the file at `~/.codex/get-shit-done/references/capability-matrix.md`" (line 908)

### CODEX-07 Non-interactive Usage Verification

Required content in AGENTS.md:
- ✓ "## Non-interactive Usage (codex exec)" section header (line 910)
- ✓ "For scripted or CI environments, use `codex exec` to run GSD skills non-interactively:" (line 912)
- ✓ Example: `codex exec "Run $gsd-progress to show current project status"` (line 915)
- ✓ Example: `codex exec "Run $gsd-execute-phase 3"` (line 916)
- ✓ "This bypasses the interactive prompt and executes directly." (line 919)

---

_Verified: 2026-02-11T16:36:00Z_
_Verifier: Claude (gsd-verifier)_
