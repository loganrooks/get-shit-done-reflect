# Phase 13: Path Abstraction & Capability Matrix - Research

**Researched:** 2026-02-11
**Domain:** Installer path transformation, runtime capability declaration, feature detection patterns
**Confidence:** HIGH

## Summary

Phase 13 transforms the GSD installer from a single-regex path replacement system into a two-pass replacement that correctly distinguishes runtime-specific paths (commands, agents, workflows, references) from shared paths (knowledge base). It also introduces a capability matrix reference document and feature detection patterns in workflow orchestrators.

The codebase currently has **~313 `~/.claude/` path references across 87 installable files** (commands/, get-shit-done/, agents/). Of these, **~32 references across 9 files** point to the knowledge base (`~/.claude/gsd-knowledge/`) and need to be treated as shared paths. The remaining **~281 references** are runtime-specific. The installer currently has **four separate code paths** that perform blind `~/.claude/` replacement -- all four must be updated to use the two-pass approach.

Additionally, some files use `$HOME/.claude/gsd-knowledge` (shell variable expansion) which the tilde-based regex does NOT catch. The two-pass system must handle both patterns.

**Primary recommendation:** Implement negative lookahead regex in all four replacement points to protect KB paths from runtime-specific transformation. Create the capability matrix as a structured markdown reference doc. Add `has_capability()` prose patterns to execute-phase.md and plan-phase.md orchestrators.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Path Categorization

- All 313+ `~/.claude/` path references split into two buckets:
  - **Runtime-specific**: Paths to commands, agents, workflows, references, templates, bin tools -- things that get installed per-runtime with path transformation (e.g., `~/.claude/get-shit-done/workflows/` becomes `~/.config/opencode/get-shit-done/workflows/`)
  - **Shared**: Knowledge base paths (`~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/`) and any future cross-runtime resources -- accessible identically from all runtimes
- The installer's existing single regex (`/~\/\.claude\//g`) currently catches both categories, breaking KB access in non-Claude runtimes. Phase 13 fixes this with a two-pass replacement:
  1. First pass: Replace shared paths (KB references) with `~/.gsd/knowledge/` (the future-state path from Phase 14)
  2. Second pass: Replace remaining runtime-specific paths with the target runtime's path
- This ordering prevents shared paths from being incorrectly transformed to runtime-specific locations
- Planning docs (`.planning/`) are NOT transformed -- they're project-local and stay as-is

#### Capability Detection Model

- Static capability matrix as a **reference document** (`get-shit-done/references/capability-matrix.md`) that ships with installation
- Matrix declares per-runtime availability of key features at meaningful granularity:
  - `task_tool` -- Can spawn subagent processes (Claude Code: yes, OpenCode: yes, Gemini: yes, Codex: no)
  - `hooks` -- Pre/post tool execution hooks (Claude Code: yes, OpenCode: no, Gemini: yes, Codex: no)
  - `tool_permissions` -- Granular tool allow/deny lists (Claude Code: yes, OpenCode: yes, Gemini: no, Codex: no)
  - `mcp_servers` -- MCP server integration (Claude Code: yes, OpenCode: yes, Gemini: no, Codex: no)
  - `frontmatter_format` -- Config format (Claude: YAML, OpenCode: YAML-variant, Gemini: TOML, Codex: SKILL.md)
  - `nested_commands` -- Subdirectory command structure (Claude: yes, OpenCode: no/flat, Gemini: no/flat, Codex: no/skills)
- Matrix is human-readable markdown (users can understand what works where) with a structured format that workflows can reference
- Feature detection via textual `has_capability(feature)` patterns in workflow prose, NOT programmatic function calls -- agents are markdown read by LLMs, not executable code

#### Capability Checks Location

- Capability branching goes in **workflow orchestrators** (execute-phase, plan-phase, etc.), NOT in agent specs
- Agent specs stay clean and capability-agnostic -- they describe WHAT to do, not WHETHER to do it
- Orchestrator workflows check capabilities and adjust their behavior:
  - If no `task_tool`: run agents sequentially instead of spawning parallel subagents
  - If no `hooks`: skip hook-dependent steps (pre-commit validation, etc.)
  - If no `tool_permissions`: skip permission setup, document manual setup needed
- The installer already handles format-level differences (YAML->TOML, tool name mapping) -- capability checks handle behavioral differences at runtime

#### Degraded Behavior Strategy

- **Inform once, then adapt silently** -- First time a missing capability is hit in a session, workflows emit a brief note (e.g., "Note: Running sequentially -- this runtime doesn't support parallel agents"). Subsequent occurrences adapt without comment.
- Each runtime's degraded behavior documented in the capability matrix reference doc:
  - **Codex CLI** (most constrained): No parallel agents (sequential execution), no hooks (skip hook-dependent features), no tool permissions (all tools available), no MCP (skip MCP-dependent features)
  - **Gemini CLI**: No tool permissions (document manual setup), no MCP servers (skip MCP features)
  - **OpenCode**: No hooks (skip hook-dependent features)
  - **Claude Code**: Full capability (no degradation)
- Degraded paths are functional, not error states -- the system works correctly, just differently

#### Installer Integration

- Extend `copyWithPathReplacement()` in `bin/install.js` with the two-pass replacement system
- Add capability matrix generation during install: the matrix reference doc is installed alongside other reference docs
- No new CLI flags needed for Phase 13 -- the `--codex` flag comes in Phase 15
- Path categorization logic lives in the installer, not in a separate config file -- the installer knows which paths are runtime-specific vs shared based on path patterns (anything matching `gsd-knowledge` is shared, everything else is runtime-specific)

### Claude's Discretion

- Exact regex patterns for the two-pass replacement (negative lookahead vs sequential replacement)
- Whether to create a path categorization manifest/enum or keep it as inline logic in the installer
- Internal structure of the capability matrix reference doc (table format, section organization)
- How to handle edge cases: paths in comments, paths in code examples within docs
- Test strategy for verifying path replacement correctness

### Deferred Ideas (OUT OF SCOPE)

- Actual KB file migration to `~/.gsd/knowledge/` -- Phase 14
- Symlink from old KB path to new -- Phase 14
- `GSD_HOME` env var override -- Phase 14
- Codex Skills format conversion and `--codex` installer flag -- Phase 15
- `AGENTS.md` generation for Codex -- Phase 15
- Cross-runtime handoff (`/gsd:pause-work` -> resume in different runtime) -- Phase 16
- Signal entries with `runtime:` and `model:` fields -- Phase 16

</user_constraints>

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js | 18+ | Installer runtime (bin/install.js) | Already used, CommonJS module |
| Vitest | Current | Test framework | Already configured in project (vitest.config.js) |
| Regular expressions | N/A | Path pattern matching and replacement | JavaScript built-in, no dependencies |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `execSync` | Subprocess install testing | Tests that run full installer with flags |
| `fs/promises` | File system operations in tests | Test verification of installed files |
| `crypto` (built-in) | File hashing for manifests | Already used in installer for patch detection |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline regex logic | Config file/manifest for path categories | Config adds a file to maintain; inline is simpler for 2 categories |
| Negative lookahead regex | Sequential two-pass replacement | Negative lookahead is one operation but harder to debug; sequential is clearer |

**Recommendation:** Use sequential two-pass replacement (clearer, easier to test) with inline pattern matching (no config file needed for just 2 categories).

## Architecture Patterns

### Current Installer Path Replacement Architecture

```
bin/install.js
├── copyWithPathReplacement()     # Main copy function for get-shit-done/ and commands/gsd/ (Claude/Gemini)
│   └── /~\/\.claude\//g          # Single regex, replaces ALL ~/.claude/ with pathPrefix
├── copyFlattenedCommands()       # OpenCode flat command structure
│   └── /~\/\.claude\//g          # Same single regex
│   └── /~\/\.opencode\//g        # Also catches opencode paths
├── convertClaudeToOpencodeFrontmatter()  # OpenCode frontmatter + body conversion
│   └── /~\/\.claude\b/g          # Word boundary variant (no trailing slash)
└── Agent copy loop (lines 1369-1384)  # Separate code path for agents/
    └── /~\/\.claude\//g          # Same single regex
```

**Key insight:** There are FOUR separate code paths that replace `~/.claude/` paths. All four must be updated.

### Proposed Two-Pass Architecture

```
bin/install.js
├── replacePathsInContent(content, runtimePathPrefix)   # NEW: centralized two-pass function
│   ├── Pass 1: Protect shared paths
│   │   └── /~\/\.claude\/gsd-knowledge/g → UNCHANGED (leave for Phase 14)
│   │   └── /\$HOME\/\.claude\/gsd-knowledge/g → UNCHANGED (leave for Phase 14)
│   ├── Pass 2: Transform runtime-specific paths
│   │   └── /~\/\.claude\//g → runtimePathPrefix
│   │   └── /\$HOME\/\.claude\//g → $HOME + runtimePathPrefix
│   └── Returns: transformed content
├── copyWithPathReplacement() → calls replacePathsInContent()
├── copyFlattenedCommands() → calls replacePathsInContent()
├── convertClaudeToOpencodeFrontmatter() → delegates path replacement
└── Agent copy loop → calls replacePathsInContent()

get-shit-done/references/capability-matrix.md   # NEW: ships with install
get-shit-done/workflows/execute-phase.md         # MODIFIED: adds capability checks
get-shit-done/workflows/plan-phase.md            # MODIFIED: adds capability checks
```

### Pattern 1: Two-Pass Path Replacement

**What:** Centralized function that handles path replacement with shared-path protection
**When to use:** Every point where markdown content is processed during installation

```javascript
/**
 * Replace ~/.claude/ paths with runtime-specific paths,
 * while protecting shared paths (gsd-knowledge) from transformation.
 *
 * Phase 13: Shared paths are LEFT UNTOUCHED (still point to ~/.claude/gsd-knowledge/).
 * Phase 14: Source files will be updated to ~/.gsd/knowledge/, at which point
 *           they no longer match ~/.claude/ and need no protection.
 *
 * @param {string} content - File content to process
 * @param {string} runtimePathPrefix - Target runtime path (e.g., "~/.config/opencode/")
 * @returns {string} Content with runtime-specific paths replaced
 */
function replacePathsInContent(content, runtimePathPrefix) {
  // Pass 1: Replace runtime-specific ~/.claude/ paths only
  // Negative lookahead excludes gsd-knowledge paths
  let result = content.replace(/~\/\.claude\/(?!gsd-knowledge)/g, runtimePathPrefix);

  // Pass 2: Handle $HOME/.claude/ variant (used in bash code blocks)
  // Same negative lookahead for gsd-knowledge
  result = result.replace(/\$HOME\/\.claude\/(?!gsd-knowledge)/g, '$HOME/' + runtimePathPrefix.replace(/^~\//, ''));

  return result;
}
```

**Source:** Codebase analysis of `bin/install.js` lines 655-698 (copyWithPathReplacement), 603-645 (copyFlattenedCommands), 447-549 (convertClaudeToOpencodeFrontmatter), 1369-1384 (agent copy loop).

### Pattern 2: Capability Matrix Reference Document

**What:** Static markdown document declaring what each runtime can and cannot do
**When to use:** Installed alongside other reference docs; read by orchestrator workflows

```markdown
# Runtime Capability Matrix

> Reference document for GSD workflow orchestrators. Declares which features
> are available in each supported runtime. Workflows use `has_capability()`
> patterns to branch behavior based on this matrix.

## Quick Reference

| Capability | Claude Code | OpenCode | Gemini CLI | Codex CLI |
|------------|:-----------:|:--------:|:----------:|:---------:|
| task_tool | Y | Y | Y | N |
| hooks | Y | N | Y | N |
| tool_permissions | Y | Y | N | N |
| mcp_servers | Y | Y | N | N |
| frontmatter_format | YAML | YAML | TOML | SKILL.md |
| nested_commands | Y | N (flat) | Y | N (skills) |

## Capability Details

### task_tool
**What:** Can spawn subagent processes via Task() calls
**Impact when missing:** Cannot run parallel agents. Workflows must execute
plans sequentially in the main context instead of spawning gsd-executor agents.
...

## Degraded Behavior by Runtime

### Codex CLI (most constrained)
- **task_tool: N** -- Run agents sequentially instead of spawning parallel
  subagents. All plan execution happens in the main context.
- **hooks: N** -- Skip hook-dependent features (update checks, statusline).
  Version checking happens on explicit GSD command invocation.
...
```

### Pattern 3: Feature Detection in Workflow Orchestrators

**What:** Prose-based capability checks that LLMs interpret at runtime
**When to use:** In orchestrator workflows (execute-phase, plan-phase) where behavior must adapt

```markdown
<capability_check>
Before spawning agents, check the runtime capability matrix
(get-shit-done/references/capability-matrix.md):

If has_capability("task_tool"):
  Spawn gsd-executor via Task() for each plan in the wave (parallel execution).
Else:
  Note: "Running sequentially -- this runtime doesn't support parallel agents."
  Execute each plan's tasks directly in this context, one at a time.
  After each plan, create SUMMARY.md and commit as usual.
</capability_check>
```

### Anti-Patterns to Avoid

- **Runtime name checks:** `if runtime === 'codex'` -- brittle, breaks when new runtimes are added. Use capability detection instead.
- **Hardcoded path branches:** `if opencode then use this path` -- the installer handles path differences at install time, not at runtime.
- **Capability checks in agent specs:** Agent specs describe WHAT to do. Orchestrators decide WHETHER and HOW based on capabilities.
- **Transforming shared paths:** KB paths must be identical across all runtimes. Never apply runtime-specific path prefix to `gsd-knowledge` references.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path categorization | Complex AST parsing of markdown | Simple regex pattern matching (`gsd-knowledge` substring check) | Only 2 categories needed; complexity isn't justified |
| Capability detection | Runtime introspection API | Static reference doc + prose patterns | LLMs read markdown, not APIs; agents aren't executable code |
| YAML/TOML conversion | Custom parser | Existing `convertClaudeToGeminiToml()` and `convertClaudeToOpencodeFrontmatter()` | Already battle-tested in installer |
| Test infrastructure | New test harness | Existing `tmpdirTest` + `createMockHome` from `tests/helpers/tmpdir.js` | Already provides temp HOME directories for install testing |

**Key insight:** This phase is primarily about splitting an existing single-pass operation into a two-pass operation, and adding a reference document + prose patterns. The complexity is in getting the regex right and updating all four replacement points consistently -- not in building new infrastructure.

## Common Pitfalls

### Pitfall 1: Missing Replacement Points

**What goes wrong:** Updating `copyWithPathReplacement()` but forgetting the other three code paths (copyFlattenedCommands, convertClaudeToOpencodeFrontmatter, agent copy loop)
**Why it happens:** The installer has grown organically with four separate places that do path replacement
**How to avoid:** Extract path replacement into a single function (`replacePathsInContent()`) called from all four points. Test each code path independently.
**Warning signs:** OpenCode install has different KB paths than Claude install

### Pitfall 2: $HOME/.claude/ Not Caught by Tilde Regex

**What goes wrong:** The regex `~/.claude/` doesn't match `$HOME/.claude/` used in bash code blocks within workflow/reference files
**Why it happens:** Bash scripts in markdown use `$HOME` expansion, not `~`
**How to avoid:** The two-pass function must handle BOTH patterns: `~/.claude/` and `$HOME/.claude/`
**Warning signs:** health-check.md, reflect.md, reflection-patterns.md have `$HOME/.claude/gsd-knowledge` that would be incorrectly transformed

**Files with `$HOME/.claude/gsd-knowledge` pattern (must be protected):**
- `get-shit-done/workflows/reflect.md` (line 116: `KB_DIR="$HOME/.claude/gsd-knowledge"`)
- `get-shit-done/references/health-check.md` (line 47: `KB_DIR="$HOME/.claude/gsd-knowledge"`)
- `get-shit-done/references/reflection-patterns.md` (line 327: `KB_INDEX="$HOME/.claude/gsd-knowledge/index.md"`)

**Files with `$HOME/.claude/get-shit-done/` pattern (must be transformed):**
- `get-shit-done/references/health-check.md` (lines 239, 251: `$HOME/.claude/get-shit-done/`)

### Pitfall 3: convertClaudeToOpencodeFrontmatter Double-Replacement

**What goes wrong:** This function uses `~/.claude\b` (word boundary, no trailing slash) which has different matching behavior than the `/~\/\.claude\//g` used elsewhere. It also does its OWN path replacement PLUS the caller does path replacement, potentially double-transforming.
**Why it happens:** The OpenCode converter was designed as an all-in-one function that handles both frontmatter conversion AND path replacement
**How to avoid:** Refactor so path replacement happens in ONE place (the centralized function), and convertClaudeToOpencodeFrontmatter only handles frontmatter structure conversion
**Warning signs:** Paths like `~/.claude-config` being accidentally caught by `\b` boundary

**Current problematic code (install.js line 456):**
```javascript
convertedContent = convertedContent.replace(/~\/\.claude\b/g, '~/.config/opencode');
```
This replaces `~/.claude` even without trailing slash, catching edge cases differently than other replacement points.

### Pitfall 4: KB Path References in Agent Specs

**What goes wrong:** `~/.claude/agents/kb-rebuild-index.sh` gets transformed to `~/.config/opencode/agents/kb-rebuild-index.sh` -- this is correct (it's a runtime-specific agent file), but the script OPERATES on the KB which is shared
**Why it happens:** The file lives in agents/ (runtime-specific location) but its function is KB-related
**How to avoid:** The script path itself IS runtime-specific and should be transformed. The KB paths INSIDE the script should be protected. This is already handled correctly if the script's content uses `~/.claude/gsd-knowledge/` (protected by negative lookahead).
**Warning signs:** This file is referenced but doesn't exist in the repo as an agent -- verify it exists or is created by a different mechanism

### Pitfall 5: @~/.claude/ File Include Syntax

**What goes wrong:** The `@~/.claude/get-shit-done/...` syntax (Claude Code file includes) must also be transformed for non-Claude runtimes
**Why it happens:** The `@` prefix is part of Claude Code's file reference syntax, and the path after it needs transformation
**How to avoid:** The existing regex `~/.claude/` already matches within `@~/.claude/...` because `@` is not part of the match. Verify this in tests.
**Warning signs:** File include references not resolving in non-Claude runtimes

### Pitfall 6: Premature KB Path Update

**What goes wrong:** Updating source files to reference `~/.gsd/knowledge/` in Phase 13 before Phase 14 creates the directory
**Why it happens:** Phase 13 context mentions replacing KB paths with `~/.gsd/knowledge/` (the future-state path)
**How to avoid:** Phase 13 should PROTECT KB paths (leave them unchanged), not transform them. Phase 14 updates source files and creates the directory. See "KB Path Transition" in Open Questions.
**Warning signs:** Non-Claude runtime users can't access KB because `~/.gsd/knowledge/` doesn't exist yet

## Code Examples

### Example 1: Centralized Path Replacement Function

```javascript
// Source: Analysis of bin/install.js - proposed refactoring

/**
 * Replace path references in file content.
 * Two-pass: protect shared paths (KB), then transform runtime-specific paths.
 *
 * Phase 13 behavior: KB paths (~/.claude/gsd-knowledge/) are LEFT UNTOUCHED.
 * Phase 14 will update source files to use ~/.gsd/knowledge/, after which
 * these paths no longer match ~/.claude/ and need no special handling.
 */
function replacePathsInContent(content, runtimePathPrefix) {
  // For Claude runtime, no transformation needed (source is already Claude paths)
  // This check is optional but avoids unnecessary regex processing
  if (runtimePathPrefix === `${os.homedir().replace(/\\/g, '/')}/.claude/`
      || runtimePathPrefix === '~/.claude/') {
    return content;
  }

  // Tilde form: ~/.claude/X → runtimePathPrefix + X
  // Negative lookahead protects gsd-knowledge paths
  let result = content.replace(/~\/\.claude\/(?!gsd-knowledge)/g, runtimePathPrefix);

  // $HOME form: $HOME/.claude/X → $HOME/runtimeSuffix + X
  // Extract the path part after ~/ for $HOME substitution
  const runtimeSuffix = runtimePathPrefix.replace(/^~\//, '');
  result = result.replace(/\$HOME\/\.claude\/(?!gsd-knowledge)/g, '$HOME/' + runtimeSuffix);

  return result;
}
```

### Example 2: Updated copyWithPathReplacement

```javascript
// Source: Refactored from bin/install.js lines 655-698

function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime) {
  // ... existing directory setup code ...

  for (const entry of entries) {
    // ... existing directory/file detection ...

    if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');

      // Two-pass path replacement (centralized)
      content = replacePathsInContent(content, pathPrefix);

      // Attribution processing (unchanged)
      content = processAttribution(content, getCommitAttribution(runtime));

      // Runtime-specific format conversion (unchanged)
      if (runtime === 'opencode') {
        content = convertClaudeToOpencodeFrontmatter(content);
        fs.writeFileSync(destPath, content);
      } else if (runtime === 'gemini') {
        content = stripSubTags(content);
        const tomlContent = convertClaudeToGeminiToml(content);
        fs.writeFileSync(destPath.replace(/\.md$/, '.toml'), tomlContent);
      } else {
        fs.writeFileSync(destPath, content);
      }
    }
    // ... existing non-md file handling ...
  }
}
```

### Example 3: Feature Detection in execute-phase.md

```markdown
<!-- Source: Proposed addition to get-shit-done/workflows/execute-phase.md -->

<capability_adaptation>
## Runtime Capability Adaptation

Before spawning executor agents, check the capability matrix
(read get-shit-done/references/capability-matrix.md if not already loaded).

### Parallel Execution (task_tool)

If has_capability("task_tool"):
  Execute waves as designed -- spawn gsd-executor via Task() for each plan.

Else (no task_tool -- e.g., Codex CLI):
  Note to user (first occurrence only):
  "Note: Running sequentially -- this runtime doesn't support parallel agents."

  For each plan in execution order:
  1. Read the plan file directly
  2. Execute each task in sequence (follow execute-plan.md flow)
  3. Create SUMMARY.md after all tasks complete
  4. Commit task artifacts
  5. Proceed to next plan

  Skip: wave grouping, parallel spawning, agent tracking (init_agent_tracking)

### Hooks (hooks capability)

If has_capability("hooks"):
  Configure SessionStart hooks as normal (update check, version check).

Else (no hooks -- e.g., OpenCode, Codex):
  Skip hook configuration during install.
  Note: "Update checks will run on GSD command invocation instead of session start."

</capability_adaptation>
```

### Example 4: Path Replacement Test

```javascript
// Source: Proposed test for tests/unit/install.test.js

describe('two-pass path replacement', () => {
  tmpdirTest('protects gsd-knowledge paths from runtime transformation', async ({ tmpdir }) => {
    const mockHome = await createMockHome(tmpdir);

    execSync(`node "${installScript}" --opencode --global`, {
      env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: path.join(tmpdir, '.config') },
      cwd: tmpdir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000
    });

    // Read a workflow file that contains both runtime-specific and KB paths
    const signalWorkflow = path.join(tmpdir, '.config', 'opencode', 'get-shit-done', 'workflows', 'signal.md');
    const content = await fs.readFile(signalWorkflow, 'utf8');

    // KB paths should NOT be transformed to OpenCode paths
    expect(content).not.toContain('~/.config/opencode/gsd-knowledge');

    // KB paths should remain as ~/.claude/gsd-knowledge
    // (Phase 14 will update source to ~/.gsd/knowledge/)
    expect(content).toContain('~/.claude/gsd-knowledge');

    // Runtime-specific paths SHOULD be transformed
    expect(content).toContain('~/.config/opencode/get-shit-done');
    expect(content).not.toContain('~/.claude/get-shit-done');
  });

  tmpdirTest('handles $HOME variant in bash code blocks', async ({ tmpdir }) => {
    const mockHome = await createMockHome(tmpdir);

    execSync(`node "${installScript}" --opencode --global`, {
      env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: path.join(tmpdir, '.config') },
      cwd: tmpdir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000
    });

    const reflectWorkflow = path.join(tmpdir, '.config', 'opencode', 'get-shit-done', 'workflows', 'reflect.md');
    const content = await fs.readFile(reflectWorkflow, 'utf8');

    // $HOME/.claude/gsd-knowledge should NOT be transformed
    expect(content).toContain('$HOME/.claude/gsd-knowledge');

    // $HOME/.claude/get-shit-done should be transformed
    expect(content).not.toContain('$HOME/.claude/get-shit-done');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single regex for all paths | Two-pass with shared path protection | Phase 13 (this phase) | Enables multi-runtime KB access |
| No capability documentation | Static capability matrix | Phase 13 (this phase) | Enables feature detection in workflows |
| Implicit Claude-only behavior | Explicit capability branching | Phase 13 (this phase) | Workflows adapt to runtime limitations |

## Path Reference Audit

### Quantitative Breakdown

**Installable files (files that go through path replacement):**

| Directory | Total `~/.claude/` refs | KB refs (`gsd-knowledge`) | Runtime-specific refs | Files |
|-----------|------------------------|--------------------------|----------------------|-------|
| get-shit-done/workflows/ | ~120 | 13 | ~107 | 36 |
| get-shit-done/references/ | ~46 | 19 | ~27 | 22 |
| get-shit-done/templates/ | ~13 | 0 | ~13 | 2 |
| commands/gsd/ | ~76 | 0 | ~76 | 30 |
| agents/ | ~39 | 0 | ~39 | 9 |
| **TOTAL** | **~313** | **~32** | **~281** | **87** |

### Files with KB (Shared) Path References

These 9 files contain `~/.claude/gsd-knowledge/` references that must be protected:

| File | KB refs | Also has runtime-specific refs? |
|------|---------|-------------------------------|
| `get-shit-done/workflows/signal.md` | 5 | Yes (1 non-KB) |
| `get-shit-done/workflows/reflect.md` | 3 + `$HOME` variant | Yes (1 non-KB) |
| `get-shit-done/workflows/collect-signals.md` | 3 | No |
| `get-shit-done/workflows/health-check.md` | 1 | Yes (3 non-KB) |
| `get-shit-done/references/knowledge-surfacing.md` | 10 | No |
| `get-shit-done/references/reflection-patterns.md` | 4 + `$HOME` variant | Yes (2 non-KB) |
| `get-shit-done/references/signal-detection.md` | 2 | No |
| `get-shit-done/references/health-check.md` | 3 + `$HOME` variant | Yes (`$HOME/.claude/get-shit-done/`) |
| `get-shit-done/references/spike-execution.md` | 1 | Yes (1 non-KB) |

### Dynamic Path Patterns (`$HOME` variant)

Three files use `$HOME/.claude/gsd-knowledge` in bash code blocks:

1. **reflect.md** (line 116): `KB_DIR="$HOME/.claude/gsd-knowledge"`
2. **health-check.md** (line 47): `KB_DIR="$HOME/.claude/gsd-knowledge"`
3. **reflection-patterns.md** (line 327): `KB_INDEX="$HOME/.claude/gsd-knowledge/index.md"`

Two files use `$HOME/.claude/get-shit-done/` (runtime-specific, SHOULD be transformed):

1. **health-check.md** (line 239): `TEMPLATE="$HOME/.claude/get-shit-done/templates/config.json"`
2. **health-check.md** (line 251): `INSTALLED=$(cat "$HOME/.claude/get-shit-done/VERSION")`

### Installer Replacement Points (All 4)

| # | Function | Line | Pattern Used | Path Types Affected |
|---|----------|------|--------------|---------------------|
| 1 | `copyWithPathReplacement()` | 676 | `/~\/\.claude\//g` | get-shit-done/, commands/gsd/ (Claude/Gemini) |
| 2 | `copyFlattenedCommands()` | 635-638 | `/~\/\.claude\//g` + `/~\/\.opencode\//g` | commands/ (OpenCode) |
| 3 | `convertClaudeToOpencodeFrontmatter()` | 456 | `/~\/\.claude\b/g` | All OpenCode files (body text) |
| 4 | Agent copy loop | 1374 | `/~\/\.claude\//g` | agents/*.md |

**Critical note on #3:** `convertClaudeToOpencodeFrontmatter()` uses `\b` (word boundary) instead of `/` (trailing slash). This means it matches `~/.claude` at end of line or before non-word characters. The centralized function should standardize this.

### Agent-Referenced Paths

Agent spec files reference `~/.claude/agents/` for cross-agent delegation:

| Agent | Reference to other agents | Reference type |
|-------|--------------------------|----------------|
| plan-phase.md | `~/.claude/agents/gsd-phase-researcher.md` | Task() prompt |
| plan-phase.md | `~/.claude/agents/gsd-planner.md` | Task() prompt |
| new-project.md | `~/.claude/agents/gsd-project-researcher.md` | Task() prompt |
| reflect.md | `~/.claude/agents/kb-rebuild-index.sh` | bash command |
| signal.md | `~/.claude/agents/kb-rebuild-index.sh` | bash command |
| health-check.md | `~/.claude/agents/kb-rebuild-index.sh` | bash reference |
| spike-execution.md | `~/.claude/agents/kb-rebuild-index.sh` | bash reference |

These are ALL runtime-specific paths (they point to agent files installed per-runtime) and should be transformed normally.

## Capability Matrix Design

### Recommended Structure

```markdown
# Runtime Capability Matrix

## Quick Reference

| Capability | Claude Code | OpenCode | Gemini CLI | Codex CLI | Impact When Missing |
|------------|:-----------:|:--------:|:----------:|:---------:|---------------------|
| task_tool  |      Y      |    Y     |     Y      |     N     | Sequential execution |
| hooks      |      Y      |    N     |     Y      |     N     | Skip hook features   |
| tool_permissions | Y     |    Y     |     N      |     N     | All tools available  |
| mcp_servers|      Y      |    Y     |     N      |     N     | Skip MCP features    |

## Format Reference

| Property | Claude Code | OpenCode | Gemini CLI | Codex CLI |
|----------|-------------|----------|------------|-----------|
| frontmatter | YAML | YAML (tools as map) | TOML | SKILL.md |
| commands | commands/gsd/*.md | command/gsd-*.md | commands/gsd/*.toml | skills/*.md |
| agents | agents/gsd-*.md | agents/gsd-*.md | agents/gsd-*.md | (via AGENTS.md) |
| config | settings.json | opencode.json | settings.json | config.toml |

## Capability Details

### task_tool
Can spawn subagent processes via Task() calls for parallel execution.

**Available in:** Claude Code, OpenCode, Gemini CLI
**Missing in:** Codex CLI

**Degraded behavior:** Execute plans sequentially in the main context.
Orchestrator reads plan files directly and executes tasks one at a time
instead of spawning gsd-executor agents per wave.

### hooks
Pre/post tool execution hooks (SessionStart, Stop, etc.).

**Available in:** Claude Code, Gemini CLI
**Missing in:** OpenCode, Codex CLI

**Degraded behavior:** Skip hook-dependent features.
- No automatic update checks at session start
- No statusline integration
- Version checking happens on explicit GSD command invocation

### tool_permissions
Granular tool allow/deny lists in agent/command frontmatter.

**Available in:** Claude Code (allowed-tools), OpenCode (permission map)
**Missing in:** Gemini CLI, Codex CLI

**Degraded behavior:** All tools are available to all agents.
Document in install output: "Gemini/Codex: All tools are available to agents.
Restrict tool access manually if needed."

### mcp_servers
MCP (Model Context Protocol) server integration.

**Available in:** Claude Code, OpenCode
**Missing in:** Gemini CLI, Codex CLI

**Degraded behavior:** Skip MCP-dependent features.
MCP tool references in agent specs are excluded during format conversion
(already handled by convertGeminiToolName returning null for mcp__ tools).

## Degraded Behavior Summary

### Codex CLI (most constrained)
| Feature | Status | Adaptation |
|---------|--------|------------|
| Parallel agents | N | Sequential plan execution |
| Hooks | N | Manual update checks |
| Tool permissions | N | All tools available |
| MCP servers | N | MCP features skipped |

### Gemini CLI
| Feature | Status | Adaptation |
|---------|--------|------------|
| Tool permissions | N | All tools available |
| MCP servers | N | MCP features skipped |

### OpenCode
| Feature | Status | Adaptation |
|---------|--------|------------|
| Hooks | N | Manual update checks |

### Claude Code
Full capability -- no degradation.
```

### Feature Detection Pattern Conventions

Workflows should use this prose pattern for capability branching:

```markdown
<capability_check name="parallel_execution">
Check capability matrix for task_tool:

If has_capability("task_tool"):
  [Standard parallel behavior -- Task() calls, wave execution]

Else:
  [First occurrence] Note: "Running sequentially -- this runtime doesn't support parallel agents."
  [Degraded behavior -- sequential execution in main context]
</capability_check>
```

**Key design principles:**
1. Always wrap in `<capability_check>` XML tags for grep-ability
2. Include the capability name in the `name` attribute
3. Standard behavior first (if/else, not else/if)
4. One-time notification on first degraded hit
5. Degraded path must be functionally complete (not an error)

## Open Questions

1. **KB Path Transition: Now or Phase 14?**
   - What we know: The context says "First pass: Replace shared paths (KB references) with `~/.gsd/knowledge/`" but this would create references to a path that doesn't exist until Phase 14.
   - What's unclear: Whether the two-pass should actually TRANSFORM KB paths in Phase 13 or just PROTECT them.
   - **Recommendation:** Phase 13 should PROTECT KB paths (leave as `~/.claude/gsd-knowledge/`), NOT transform them. Use negative lookahead to skip KB paths during runtime-specific replacement. Phase 14 updates source files to `~/.gsd/knowledge/` and creates the directory. This avoids the gap where non-Claude runtimes would reference a nonexistent path. The "two-pass" system is still in place -- it just protects rather than transforms in Phase 13.
   - **Rationale:** The decision says "First pass: Replace shared paths with `~/.gsd/knowledge/`" but this creates a dependency on Phase 14 being complete. Since Phase 13 says "Depends on: Nothing" and Phase 14 says "Depends on: Phase 13", the safer approach is protect-then-transform across the two phases.

2. **OpenCode XDG and `~/.gsd/` Path**
   - What we know: OpenCode uses `~/.config/opencode/` (XDG compliant). The `~/.gsd/` path is NOT XDG compliant (`~/.local/share/gsd/` would be).
   - What's unclear: Whether this matters for Phase 13.
   - Recommendation: NOT a Phase 13 concern. User locked `~/.gsd/` as the shared path in Phase 14 decisions. Phase 13 just protects KB paths.

3. **kb-rebuild-index.sh Location**
   - What we know: Referenced from 6+ workflow/reference files as `~/.claude/agents/kb-rebuild-index.sh`, but no such file exists in the repo's `agents/` directory.
   - What's unclear: Whether this file was removed, never created, or lives elsewhere.
   - Recommendation: Investigate during planning. If the file doesn't exist, the references are dead and should be noted but not blocked by Phase 13 work.

4. **convertClaudeToOpencodeFrontmatter Path Replacement Overlap**
   - What we know: This function does its OWN `~/.claude` replacement (line 456) with a different regex pattern (`\b` vs `/`), AND the caller (copyWithPathReplacement/copyFlattenedCommands) also does path replacement.
   - What's unclear: Whether there's currently double-replacement happening.
   - Recommendation: Refactor so path replacement happens ONCE via the centralized function, and convertClaudeToOpencodeFrontmatter handles only frontmatter structure. Remove the inline path replacement from convertClaudeToOpencodeFrontmatter. This eliminates the double-replacement risk and the inconsistent regex patterns.

## Sources

### Primary (HIGH confidence)
- `bin/install.js` -- Direct codebase analysis of all 4 replacement points
- `get-shit-done/workflows/*.md` -- Direct audit of all 36 workflow files
- `get-shit-done/references/*.md` -- Direct audit of all 22 reference files
- `commands/gsd/*.md` -- Direct audit of all 30 command files
- `agents/*.md` -- Direct audit of all 9 agent files
- `tests/unit/install.test.js` -- Existing test patterns for installer

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` -- Phase dependency chain and success criteria
- `.planning/REQUIREMENTS.md` -- ABST-01 through ABST-04 specifications
- `.planning/research/SUMMARY.md` -- Prior research on multi-runtime architecture

### Tertiary (LOW confidence)
- None. All findings verified against actual codebase.

## Metadata

**Confidence breakdown:**
- Path audit: HIGH -- direct file counting and grep analysis across all source files
- Installer architecture: HIGH -- complete read and analysis of all 1764 lines of install.js
- Capability matrix: HIGH -- verified against existing converter functions and installer logic
- Feature detection patterns: MEDIUM -- prose patterns are convention, not code; LLM interpretation may vary
- KB path transition: MEDIUM -- recommendation is sound but the context decision is ambiguous on timing

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable -- no external dependency changes expected)
