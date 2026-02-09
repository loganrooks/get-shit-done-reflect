# Codebase Concerns

**Analysis Date:** 2026-02-02

## Tech Debt

**Manual npm Publish Workflow:**
- Issue: Switched from GitHub Actions CI/CD to manual npm publish (v1.9.11). Releases now rely on manual steps.
- Files: `MAINTAINERS.md`, `.github/workflows/`
- Impact: Risk of human error in release process, inconsistent versioning, manual coordination required
- Fix approach: Document release checklist thoroughly in MAINTAINERS.md, consider re-automating when team expands

**File-based State Management:**
- Issue: Project state (phase progress, decisions, blockers) stored in `.planning/STATE.md` as markdown files rather than structured data
- Files: `get-shit-done/workflows/execute-phase.md`, `commands/gsd/progress.md`
- Impact: Parsing state requires regex/bash fragile parsing; no schema validation; edge cases with formatting drift
- Fix approach: Consider lightweight JSON state store alongside markdown for programmatic access; improve parsing robustness with explicit schema

**Path Replacement Regex Patterns:**
- Issue: Multiple hardcoded path replacement patterns (`~/.claude/`, `~/.opencode/`, `~/.gemini/`) scattered throughout install.js with string replacement via regex
- Files: `bin/install.js` (lines 624-626, 663-666, 1148-1149)
- Impact: Brittle approach; if someone uses similar paths that don't match exactly, they get missed; path format changes require multiple edits
- Fix approach: Consolidate into centralized path translation function; use object mapping instead of multiple regex calls

**Large Monolithic Agent Files:**
- Issue: Agent files are very large (gsd-planner: 1386 lines, gsd-debugger: 1203 lines, gsd-executor: 784 lines)
- Files: `agents/gsd-planner.md`, `agents/gsd-debugger.md`, `agents/gsd-executor.md`
- Impact: Difficult to locate specific logic; context consumption high for subagents; editing becomes cumbersome; reuse of patterns requires searching large files
- Fix approach: Extract common patterns into shared reference files; split largest agents into specialization-specific sections; cross-reference liberally

**No Runtime Type Safety:**
- Issue: Runtime selection (`claude`, `opencode`, `gemini`) passed as strings throughout codebase with manual validation
- Files: `bin/install.js` (getDirName, getGlobalDir, getCommitAttribution functions)
- Impact: Typos in runtime names silently fail or create wrong directories; no compile-time checking; difficult to add new runtimes
- Fix approach: Define runtime as TypeScript enum or explicit type; validate at entry points

**Attribution Setting Cache Logic Complexity:**
- Issue: getCommitAttribution function has three different paths (OpenCode disables via opencode.json, Gemini via settings.json, Claude via settings.json) with subtle differences
- Files: `bin/install.js` (lines 205-241)
- Impact: Easy to introduce bugs when modifying attribution logic; inconsistent behavior between runtimes not obvious; cache invalidation not tested
- Fix approach: Document expected behavior per runtime explicitly; unify settings schema; add integration tests for each runtime's path

## Known Bugs

**OpenCode Configuration Path Migration:**
- Symptoms: Users upgrading from older versions with OpenCode configs in `~/.opencode/` won't see migration to new XDG location `~/.config/opencode/`
- Files: `bin/install.js` (getOpencodeGlobalDir function lines 53-71)
- Trigger: Upgrading from v1.9.5 (or earlier) to v1.9.7+ with OpenCode installed
- Workaround: Users can manually move `~/.opencode/` to `~/.config/opencode/` and update hooks; GSD will then detect the new location
- Fix approach: Add migration logic in install.js to detect old location and copy/move to new location

**Orphaned Hook Registration Cleanup Race Condition:**
- Symptoms: If install fails mid-process (e.g., network interrupt), orphaned entries remain in settings.json hooks array
- Files: `bin/install.js` (cleanup functions lines 692-748)
- Trigger: Interrupted install during cleanupOrphanedHooks() but after settings.hooks is already populated
- Workaround: Manual edit of settings.json to remove problematic entries
- Fix approach: Perform cleanup as atomic operation; save backup before modification

**Context Window Quality Degradation Not Enforced:**
- Symptoms: Planner agent creates plans that may complete in 60-70%+ context, degrading quality
- Files: `agents/gsd-planner.md` (quality degradation curve at lines 49-62)
- Trigger: Complex phases or documentation-heavy plans can exceed 50% context threshold
- Workaround: Manual review of plan size before execution; user reduces phase scope
- Fix approach: Add automatic context usage estimation to planner; reject plans exceeding 50% threshold with restructuring suggestion

## Security Considerations

**Unvalidated JSON Parsing in OpenCode Config:**
- Risk: opencode.json parsed without schema validation; malformed JSON silently ignored with warning
- Files: `bin/install.js` (configureOpencodePermissions lines 967-972)
- Current mitigation: Try-catch logs warning but continues with blank config
- Recommendations: Validate against OpenCode's JSON schema; preserve original config if parsing fails; add rollback on write error

**Attribution String Injection via Co-Authored-By:**
- Risk: Custom attribution setting (line 258) replaced via regex with user input; malicious `$` characters could inject backreferences
- Files: `bin/install.js` (processAttribution function lines 249-260)
- Current mitigation: Escapes `$` to `$$$$` before replacement
- Recommendations: Audit regex replacement for other injection vectors; consider using string.replace with function parameter instead of regex

**Path Traversal in Config Directory:**
- Risk: `--config-dir` argument not validated for path traversal (e.g., `--config-dir ../../sensitive/path`)
- Files: `bin/install.js` (parseConfigDirArg lines 121-143, expandTilde lines 159-164)
- Current mitigation: None - arbitrary paths accepted
- Recommendations: Normalize and validate config directory path; ensure it's inside home directory or whitelisted locations; check permissions before use

**Hook Command Injection:**
- Risk: buildHookCommand (lines 170-174) constructs node commands that are stored in settings files; if settings files are compromised, arbitrary code execution
- Files: `bin/install.js`, `hooks/` directory
- Current mitigation: GSD controls hook creation; users shouldn't edit manually
- Recommendations: Sign hooks to detect tampering; validate hook existence before registration; consider hook sandboxing

## Performance Bottlenecks

**Recursive Directory Copy with File Reading:**
- Problem: copyWithPathReplacement recursively reads and processes all .md files, replacing paths sequentially
- Files: `bin/install.js` (copyWithPathReplacement lines 644-687)
- Cause: For each .md file, reads entire content, runs multiple regex replacements, writes back - O(n*m) where n=files, m=file size
- Improvement path: Batch regex operations; parallelize file I/O; pre-compile regexes outside loop; use faster string replacement library for large files

**Flattened Command Structure Regex Complexity:**
- Problem: copyFlattenedCommands processes nested directories and flattens names with complex prefix building (lines 614-616)
- Files: `bin/install.js` (copyFlattenedCommands lines 589-634)
- Cause: Recursive calls with string concatenation for prefixes; O(depth) string operations per file
- Improvement path: Pre-calculate flatten map before recursion; use template strings for prefix building

**State Parsing in Workflows:**
- Problem: Workflows parse STATE.md, ROADMAP.md, REQUIREMENTS.md, config.json using grep/sed/cut repeatedly
- Files: `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/verify-phase.md`
- Cause: Each workflow independently parses same files with different regex patterns; no caching between steps
- Improvement path: Orchestrator should parse once, pass structured context to subagents; create JSON companion files for faster parsing

## Fragile Areas

**Phase Directory Naming Ambiguity:**
- Files: `get-shit-done/workflows/execute-phase.md` (line 32-33)
- Why fragile: Both zero-padded (`05-auth`) and unpadded (`5-auth`) directory names supported; regex tries both with fallback logic that's error-prone
- Safe modification: Add explicit phase number standardization at project creation time; validate naming in roadmap generation
- Test coverage: No automated test for both naming patterns; manual testing only

**Frontmatter Conversion for OpenCode/Gemini:**
- Files: `bin/install.js` (convertClaudeToOpencodeFrontmatter lines 440-500, convertClaudeToGeminiToml lines 303-374)
- Why fragile: Manual YAML parsing line-by-line without proper parser; multiple stateful flags (inAllowedTools); edge cases with tool name mapping
- Safe modification: Use proper YAML/TOML parser library instead of string manipulation
- Test coverage: Only integration tested during install; no unit tests for edge cases (tools with special chars, malformed frontmatter)

**Orphaned File Cleanup Logic:**
- Files: `bin/install.js` (cleanupOrphanedHooks lines 710-748)
- Why fragile: Hardcoded list of patterns to remove; logic depends on exact hook command format; new patterns must be manually added for each deprecated hook
- Safe modification: Move orphan list to external configuration; add migration version tracking to know which cleanup to run
- Test coverage: Cleanup tested only in live installs; no mock tests for edge cases

**Hook Registration in settings.json:**
- Files: `bin/install.js` (registerHook lines 1250+), all hook registration
- Why fragile: Assumes specific settings.json structure (hooks.SessionStart array exists); if user has manually edited settings.json, structure could differ
- Safe modification: Use merge-on-write pattern instead of direct mutation; validate structure before modification; add rollback on error
- Test coverage: No unit tests for hook registration; relies on end-to-end install testing

**Plan Dependency Wave Calculation:**
- Files: `get-shit-done/workflows/execute-phase.md` (dependency analysis section)
- Why fragile: Parallel execution depends on accurate dependency graph parsing from PLAN frontmatter; circular dependencies not detected; missing dependencies silently treated as independent
- Safe modification: Add explicit circular dependency detection; validate all referenced dependencies exist; log dependency graph for debugging
- Test coverage: Dependency logic not exposed as testable function; only verified through successful execution

**Context Window Monitoring in Plans:**
- Files: `agents/gsd-planner.md` (lines 49-62)
- Why fragile: Context usage estimation is heuristic-based; no actual measurement; planner warns about context but doesn't enforce limits
- Safe modification: Measure actual context usage during execution; correlate with quality; feed back to planner; enforce hard limits
- Test coverage: No metrics on actual quality degradation at different context levels; assumption based on observation

## Scaling Limits

**Markdown File-Based Knowledge:**
- Current capacity: GSD system documented in ~22k lines of markdown across 28+ files
- Limit: As knowledge grows beyond current size, parsing complexity increases; future contributors face increasingly difficult navigation
- Scaling path: Extract patterns into reference library; create index/search capability; migrate to lightweight knowledge base with structured queries

**Single-Phase Execution:**
- Current capacity: execute-phase orchestrates up to ~10-15 parallel plans per phase before context becomes constrained
- Limit: Milestone with 50+ phases becomes unwieldy; orchestrator must load all phase context upfront
- Scaling path: Implement lazy loading of phase context; stream results instead of collecting all upfront; consider phase grouping/batching

**Installation Target Flexibility:**
- Current capacity: Supports 3 runtimes (Claude, OpenCode, Gemini) with individual path/config schemes
- Limit: Adding 4th runtime requires modifying install.js in 5+ places; no plugin architecture
- Scaling path: Define runtime as plugin interface; externalize runtime-specific config to runtime.json; allow custom runtime registration

## Dependencies at Risk

**No Direct Dependencies (By Design):**
- Risk: While avoiding dependencies (package.json shows zero dependencies, only devDependency: esbuild), this means:
  - Cannot update to benefit from bug fixes in third-party libraries
  - Custom implementations of standard utilities (path handling, YAML parsing) may diverge from standards
  - Shell script execution relies on system tools (bash, grep, sed) which vary by OS
- Impact: Windows/Mac/Linux compatibility issues; parsing edge cases not covered by battle-tested libraries
- Migration plan: Consider adding minimal deps (e.g., js-yaml for config parsing, node-glob for cross-platform glob) when scale justifies; keep core system dependency-free

**Deprecated ISSUES.md System:**
- Risk: Removed in favor of phase-scoped UAT issues (v1.8.0+); any user-created ISSUES.md files are now ignored
- Impact: Users with existing ISSUES.md workflows see silent failure; no migration guidance provided
- Migration plan: Document in CONTRIBUTING.md how to migrate old ISSUES.md to phase-scoped format; consider automated migration script

**Reliance on Specific Bash Features:**
- Risk: Workflows use advanced bash (printf with field width, process substitution, regex) that may not work in sh/dash/zsh
- Impact: Documented as "Works on Mac, Windows, and Linux" but bash features differ across shells
- Migration plan: Test workflows with shellcheck; document shell version requirements; use POSIX subset where possible

## Missing Critical Features

**No Plan Validation Before Execution:**
- Problem: Plans execute as-is from planner; no schema validation that plan follows required format
- Blocks: Catching malformed plans early; preventing executor from failing due to missing sections
- Recommendation: Implement plan schema validator; run as gate before executor starts; provide clear error messages on violations

**No Context Window Usage Measurement:**
- Problem: Planner estimates context usage heuristically; actual measurement only available from user's runtime (Claude API)
- Blocks: Enforcing context limits; correlating actual quality degradation with context usage; data-driven optimization
- Recommendation: Capture actual token usage from executor; log and aggregate per phase; provide visibility dashboard

**No Rollback/Undo for Phase Execution:**
- Problem: Once phase completes, cannot revert to pre-phase state cleanly
- Blocks: Experimentation with alternate implementations; recovery from unintended changes
- Recommendation: Implement git-based checkpoints; snapshot project state before phase; offer "undo phase" command

**No Multi-User Conflict Detection:**
- Problem: GSD assumes solo developer; no locking for .planning/ directory
- Blocks: Collaborative development; CI/CD that runs phases in parallel
- Recommendation: Add advisory locking on .planning/ directory; detect concurrent modifications; provide merge strategies

## Test Coverage Gaps

**Install Script Edge Cases Not Tested:**
- What's not tested: Permission errors during install, disk full conditions, symlink handling, Windows UNC paths, locale-specific characters in paths
- Files: `bin/install.js`
- Risk: Silent failures or cryptic errors in edge cases; user experience suffers on non-standard systems
- Priority: High - install is first impression; should work reliably everywhere

**Hook Registration Edge Cases:**
- What's not tested: Duplicate hook registration, hook ordering when multiple GSD versions installed, hook command format validation, settings.json corruption recovery
- Files: `bin/install.js` (registerHook and related functions)
- Risk: Hooks silently fail or cause system instability
- Priority: High - hooks affect every session

**Workflow Bash Parsing:**
- What's not tested: Malformed config.json (invalid JSON), missing required fields, ROADMAP.md format variations, phase directories with spaces in names
- Files: `get-shit-done/workflows/*.md`
- Risk: Workflows exit silently or proceed with wrong values
- Priority: Medium - workflow errors should be obvious

**OpenCode/Gemini Path Conversions:**
- What's not tested: Permission issues after conversion, symlinks in config paths, spaces in paths, command-line argument injection via paths
- Files: `bin/install.js` (convertClaudeToOpencodeFrontmatter, convertClaudeToGeminiToml)
- Risk: Converted files have broken paths or invalid syntax; users of these runtimes have degraded experience
- Priority: Medium - currently affects growing user base

**Plan Execution Wave Ordering:**
- What's not tested: Plans with circular dependencies, missing dependency references, dependency on non-existent plans, edge cases in topological sort
- Files: `get-shit-done/workflows/execute-phase.md` (dependency analysis)
- Risk: Plans execute out of order causing failures; subtle data corruption if dependencies not respected
- Priority: High - affects core workflow reliability

---

*Concerns audit: 2026-02-02*
