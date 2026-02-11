---
phase: 13-path-abstraction-capability-matrix
verified: 2026-02-11T19:31:43Z
status: passed
score: 11/11 must-haves verified
---

# Phase 13: Path Abstraction & Capability Matrix Verification Report

**Phase Goal:** Users (and the installer) can distinguish between runtime-specific configuration paths and shared resource paths, with explicit capability declarations per runtime

**Verified:** 2026-02-11T19:31:43Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Non-Claude runtime installs transform KB paths to ~/.gsd/knowledge/ (shared), not to runtime-specific paths | ✓ VERIFIED | replacePathsInContent() Pass 1 transforms `~/.claude/gsd-knowledge` -> `~/.gsd/knowledge` (line 611) |
| 2 | Non-Claude runtime installs correctly transform runtime-specific paths to target runtime locations | ✓ VERIFIED | replacePathsInContent() Pass 2 transforms `~/.claude/` -> runtimePathPrefix with negative lookahead (line 616) |
| 3 | $HOME/.claude/ variants in bash code blocks are handled identically to tilde variants | ✓ VERIFIED | Pass 1 handles `$HOME/.claude/gsd-knowledge` (line 612), Pass 2 handles `$HOME/.claude/` for runtime paths (line 632) |
| 4 | convertClaudeToOpencodeFrontmatter no longer performs its own path replacement | ✓ VERIFIED | Line 457-458 comment confirms path replacement removed, only tool name conversion remains |
| 5 | A capability matrix declares task_tool, hooks, tool_permissions, mcp_servers for all 4 runtimes | ✓ VERIFIED | capability-matrix.md Quick Reference table (lines 9-14) declares all 4 capabilities across all 4 runtimes |
| 6 | Each runtime has documented degraded behavior | ✓ VERIFIED | Degraded Behavior Summary section (lines 79-111) covers Codex CLI, Gemini CLI, OpenCode, Claude Code |
| 7 | Orchestrator workflows contain capability_check sections for task_tool and hooks | ✓ VERIFIED | execute-phase.md has parallel_execution (line 56) and hooks_support (line 74) checks; plan-phase.md has agent_spawning check (line 56) |
| 8 | Feature detection uses has_capability() patterns, not runtime name checks | ✓ VERIFIED | execute-phase.md: 2 has_capability() calls, 0 runtime name checks; plan-phase.md: 1 has_capability() call, 0 runtime name checks |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| bin/install.js | replacePathsInContent() function | ✓ VERIFIED | Function exists (line 609), implements two-pass replacement, exported for testing (line 1813) |
| tests/unit/install.test.js | Two-pass path replacement tests | ✓ VERIFIED | 14 tests in "two-pass path replacement" describe block (line 230), all passing |
| get-shit-done/references/capability-matrix.md | Capability matrix reference doc | ✓ VERIFIED | 162 lines, Quick Reference table, 4 capability details, degraded behavior for all 4 runtimes, feature detection convention |

**Artifact Status:** 3/3 artifacts verified (exists, substantive, wired)

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| copyWithPathReplacement | replacePathsInContent | function call | ✓ WIRED | Line 721 calls replacePathsInContent(content, pathPrefix) |
| copyFlattenedCommands | replacePathsInContent | function call | ✓ WIRED | Line 680 calls replacePathsInContent(content, pathPrefix) |
| agent copy loop | replacePathsInContent | function call | ✓ WIRED | Line 1418 calls replacePathsInContent(content, pathPrefix) |
| execute-phase.md | capability-matrix.md | reference in capability_check | ✓ WIRED | Lines 54, 57 reference get-shit-done/references/capability-matrix.md |
| plan-phase.md | capability-matrix.md | reference in capability_check | ✓ WIRED | Line 57 references get-shit-done/references/capability-matrix.md |

**Wiring Status:** 5/5 key links verified

### Requirements Coverage

| Requirement | Status | Supporting Truths | Notes |
|-------------|--------|-------------------|-------|
| ABST-01: Installer splits 313+ ~/.claude/ paths into runtime-specific vs shared categories | ✓ SATISFIED | Truths 1, 2, 3 | Two-pass replacement categorizes KB paths as shared, rest as runtime-specific |
| ABST-02: Runtime capability matrix exists as first-class artifact | ✓ SATISFIED | Truth 5 | capability-matrix.md exists with all 4 capabilities across 4 runtimes |
| ABST-03: Agent specs use feature detection not runtime detection | ✓ SATISFIED | Truth 8 | Workflows use has_capability(), zero runtime name checks found |
| ABST-04: Degraded behavior documented per runtime | ✓ SATISFIED | Truth 6 | Degraded Behavior Summary documents adaptations for all 4 runtimes |

**Requirements:** 4/4 satisfied

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| - | - | - | - | No anti-patterns found |

**Anti-pattern scan:** Clean — no TODOs, FIXMEs, placeholder content, or empty implementations found in modified files.

### Success Criteria Achievement

From ROADMAP.md Phase 13 success criteria:

1. **Installer categorizes all 313+ ~/.claude/ path references into runtime-specific vs shared buckets** ✓
   - replacePathsInContent() implements two-pass system: KB paths -> shared, runtime paths -> runtime-specific
   - All 3 active call sites use centralized function
   - 14 tests verify correct categorization

2. **Runtime capability matrix artifact exists** ✓
   - capability-matrix.md declares task_tool, hooks, tool_permissions, mcp_servers for all 4 runtimes
   - Quick Reference table provides "Can I Use"-style compatibility grid
   - Capability Details section documents degraded behavior per capability

3. **Agent specs and workflows use feature detection patterns** ✓
   - execute-phase.md: 2 capability_check sections with has_capability() patterns
   - plan-phase.md: 1 capability_check section with has_capability() pattern
   - Agent specs (agents/ directory): 0 capability checks (verified)
   - Workflows reference capability-matrix.md for feature detection

4. **Each runtime has documented degraded behavior** ✓
   - Codex CLI (most constrained): 4 degraded features documented
   - Gemini CLI: 2 degraded features documented
   - OpenCode: 1 degraded feature documented
   - Claude Code: Full capability, no degradation

**All 4 success criteria met.**

## Verification Details

### Two-Pass Path Replacement Verification

**Tested:** Ran full test suite (npx vitest run tests/unit/install.test.js)
**Result:** 26 tests passed, including 14 new two-pass replacement tests

**Unit tests verified:**
- KB tilde paths -> shared location (test passes)
- KB $HOME paths -> shared location (test passes)
- Runtime-specific tilde paths -> runtime prefix (test passes)
- Runtime-specific $HOME paths -> runtime prefix (test passes)
- Mixed KB + runtime paths in same content (test passes)
- Gemini runtime transformation (test passes)
- Claude runtime KB transformation (test passes)

**Integration tests verified:**
- OpenCode install protects KB paths from runtime transformation (test passes)
- OpenCode install handles $HOME variant correctly (test passes)
- Gemini install KB path transformation (test passes)
- Claude install KB path transformation (test passes)

### Capability Matrix Completeness

**Verified:**
- All 4 runtimes present: Claude Code (7 mentions), OpenCode (8 mentions), Gemini CLI (8 mentions), Codex CLI (8 mentions)
- All 4 capabilities documented: task_tool, hooks, tool_permissions, mcp_servers
- Degraded behavior for each constrained runtime: Codex (4 adaptations), Gemini (2 adaptations), OpenCode (1 adaptation)
- Feature detection convention documented with examples

### Workflow Integration

**Verified:**
- execute-phase.md: 2 capability_check sections (parallel_execution, hooks_support)
- plan-phase.md: 1 capability_check section (agent_spawning)
- Both workflows reference capability-matrix.md
- has_capability() pattern used (3 total uses in workflows, 5 in matrix doc)
- No runtime name checks found (grep for "runtime ===" returned 0 matches)

### Call Site Refactoring

**Verified:**
- copyWithPathReplacement (line 721): calls replacePathsInContent ✓
- copyFlattenedCommands (line 680): calls replacePathsInContent ✓
- agent copy loop (line 1418): calls replacePathsInContent ✓
- convertClaudeToOpencodeFrontmatter: NO inline path replacement ✓

### Module Export

**Verified:**
- replacePathsInContent exported (line 1813) for unit testing
- require.main guard in place (prevents CLI side effects on import)
- Direct function testing enabled in test suite

## Summary

Phase 13 goal **ACHIEVED**. All must-haves verified:

**Path Abstraction (Plan 01):**
- Two-pass path replacement system implemented and tested
- KB paths correctly categorized as shared (~/.gsd/knowledge/)
- Runtime-specific paths correctly transformed to target runtime
- Both tilde and $HOME variants handled
- Double-replacement bug eliminated (convertClaudeToOpencodeFrontmatter cleaned)
- 14 tests pass, including integration tests

**Capability Matrix (Plan 02):**
- Capability matrix reference document created with all 4 runtimes
- All 4 capabilities declared: task_tool, hooks, tool_permissions, mcp_servers
- Degraded behavior documented for constrained runtimes
- Feature detection patterns added to orchestrator workflows
- has_capability() convention established, runtime name checks absent
- Agent specs remain capability-agnostic

**Requirements:** All 4 requirements satisfied (ABST-01 through ABST-04)

**Code Quality:** No anti-patterns, no TODOs/FIXMEs, all tests passing, clean wiring

**Ready for Phase 14:** Knowledge base migration can now reference the two-path system and capability matrix for shared KB path handling across runtimes.

---

_Verified: 2026-02-11T19:31:43Z_  
_Verifier: Claude (gsd-verifier)_
