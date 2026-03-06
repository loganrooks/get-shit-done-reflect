# Phase 44: GSDR Namespace Co-Installation - Research

**Researched:** 2026-03-06
**Domain:** Install-time namespace rewriting / co-installation isolation
**Confidence:** HIGH

## Summary

This phase modifies the GSD Reflect installer (`bin/install.js`) to rewrite namespace references at install time, enabling GSD and GSD Reflect to coexist on the same machine without overwriting each other. The approach extends the existing `replacePathsInContent()` infrastructure -- which already rewrites `~/.claude/` paths for cross-runtime support (OpenCode, Gemini, Codex) -- with additional rewrite rules for directory names, command prefixes, agent filenames, hook filenames, and subagent_type values.

The primary complexity is in the **number of touchpoints** (7 rewrite rules across 5 file categories) rather than algorithmic difficulty. The deliberation document thoroughly analyzed double-replacement safety and confirmed all string replacements are naturally safe: `gsd-` only matches when followed by `-`, so it never matches inside `gsdr-`. Source files remain unchanged, preserving the 18-file upstream merge surface.

Hooks are a special concern: they are JavaScript files (not Markdown), so `replacePathsInContent()` does not process them. Hook files contain hardcoded `~/.claude/get-shit-done/` paths that must be handled separately -- either by extending the path replacement to also process `.js` files during hook copy, or by making hooks resolve their paths dynamically.

**Primary recommendation:** Extend the installer's content rewriting pipeline with 3 new string replacement rules (command prefix, agent prefix, subagent_type) alongside the existing path replacement. Handle hooks via filename renaming during copy plus path replacement in hook JavaScript content. Handle the uninstall function with the `gsdr-` prefix. Implement in 2-3 focused plans.

<user_constraints>
## User Constraints (from Deliberation Document)

### Locked Decisions
- **Approach:** Install-time rewriting -- keep source as `gsd`, rewrite to `gsdr` at install time
- **Runtime directory:** `get-shit-done/` source installs to `get-shit-done-reflect/` target
- **Command prefix:** `/gsdr:` via `commands/gsdr/` (from source `commands/gsd/`)
- **Agent prefix:** `gsdr-*.md` installed filenames (from `gsd-*.md` source)
- **Knowledge base root:** Keep `~/.gsd/` as-is (no collision, Reflect-only feature)
- **Source files:** Unchanged (preserve upstream merge compatibility)
- **Hook filenames:** 4 files renamed `gsd-*` to `gsdr-*` at install time
- **GSD_HOME env var:** Keep as-is, support GSDR_HOME as alias
- **gsd_reflect_version config key:** Keep as-is (already Reflect-specific)
- **KB scripts at ~/.gsd/bin/:** Keep at `~/.gsd/` (Reflect-only)
- **Test path assertions:** Tests operate on source (unchanged)
- **String replacement safety:** Confirmed no double-replacement risk

### Rewrite Rules (All Locked)
| # | What | Source | Installed | Mechanism |
|---|------|--------|-----------|-----------|
| 1 | Runtime directory | `get-shit-done/` | `get-shit-done-reflect/` | Installer directory naming |
| 2 | Commands directory | `commands/gsd/*.md` | `commands/gsdr/*.md` | Installer directory naming |
| 3 | Agent filenames | `agents/gsd-*.md` | `agents/gsdr-*.md` | Installer file rename during copy |
| 4 | Path refs in content | `~/.claude/get-shit-done/` | `~/.claude/get-shit-done-reflect/` | Extended `replacePathsInContent()` |
| 5 | Command refs in content | `/gsd:` | `/gsdr:` | New rewrite rule in content processing |
| 6 | subagent_type refs | `"gsd-executor"` | `"gsdr-executor"` | New rewrite rule in content processing |
| 7 | gsd-tools binary refs | path handled by rule #4, filename unchanged | Rule #4 covers it | No separate rule needed |

### Exceptions (NOT Rewritten)
- `knowledge-store.md`, `kb-templates/` -- no `gsd-` prefix
- `subagent_type="general-purpose"` -- not ours
- `~/.gsd/knowledge/` -- KB root stays shared
- Source files -- never modified

### Deferred Ideas (OUT OF SCOPE)
- Renaming source files (breaks upstream merge)
- Changing `~/.gsd/` KB root
- Renaming `gsd-tools.js` binary filename
- `GSD_HOME` env var deprecation
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` | Built-in | File copy/rename/write during install | Already used throughout installer |
| Node.js `path` | Built-in | Path construction for renamed outputs | Already used throughout installer |
| `String.prototype.replace` | Built-in | Content rewriting (regex) | Existing `replacePathsInContent()` pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | ^3.0.5 | Test suite for rewrite rules | All new unit and integration tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple string replace | AST-based rewriting | Overkill -- content is markdown/text, not code. String replace is proven safe (deliberation analysis). |
| Inline hook path fixes | Dynamic path resolution in hooks | Would require changing hook architecture; simpler to replace paths during copy |

**Installation:**
No new dependencies needed. All changes are internal to the installer.

## Architecture Patterns

### Recommended Change Structure
```
bin/install.js
  replacePathsInContent()     # Add 3 new replacement passes
  install()                    # Change destination dirs + filenames
  uninstall()                  # Change cleanup targets
  writeManifest()              # Change manifest paths
  cleanupOrphanedFiles()       # Update orphan list
  buildHookCommand()           # Update hook names
  settings.json registration   # Update hook command names
  configureOpencodePermissions() # Update path pattern
  finishInstall()              # Update completion message

hooks/                         # Hooks need path replacement in JS content
  gsd-check-update.js          # Has hardcoded ~/.claude/get-shit-done/ paths
  gsd-version-check.js         # Has hardcoded ~/.claude/get-shit-done/ paths
  gsd-statusline.js            # Has hardcoded ~/.claude/get-shit-done/ paths
  gsd-ci-status.js             # Has hardcoded ~/.claude/ paths

scripts/build-hooks.js         # Discovers gsd-*.js dynamically -- unchanged
```

### Pattern 1: Extended replacePathsInContent()
**What:** Add 3 new replacement passes after existing path replacement.
**When to use:** All content rewriting during install.
**Example:**
```javascript
// Current (existing code, lines 1134-1160):
function replacePathsInContent(content, runtimePathPrefix) {
  // Pass 1: Replace shared KB paths
  let result = content.replace(/~\/\.claude\/gsd-knowledge/g, '~/.gsd/knowledge');
  result = result.replace(/\$HOME\/\.claude\/gsd-knowledge/g, '$HOME/.gsd/knowledge');
  // Pass 2: Replace runtime-specific paths
  result = result.replace(/~\/\.claude\/(?!gsd-knowledge)(?! )/g, runtimePathPrefix);
  // ... $HOME variant ...
  return result;
}

// Extended (new passes added):
function replacePathsInContent(content, runtimePathPrefix) {
  // Pass 1: Replace shared KB paths (UNCHANGED)
  let result = content.replace(/~\/\.claude\/gsd-knowledge/g, '~/.gsd/knowledge');
  result = result.replace(/\$HOME\/\.claude\/gsd-knowledge/g, '$HOME/.gsd/knowledge');

  // Pass 2: Replace runtime-specific paths (UNCHANGED)
  result = result.replace(/~\/\.claude\/(?!gsd-knowledge)(?! )/g, runtimePathPrefix);
  // ... $HOME variant ...

  // Pass 3: GSDR namespace rewriting (NEW)
  // Rule 4: Runtime directory in remaining path refs
  result = result.replace(/get-shit-done\//g, 'get-shit-done-reflect/');
  // Rule 5: Command prefix
  result = result.replace(/\/gsd:/g, '/gsdr:');
  // Rule 6: subagent_type and agent filename prefix
  result = result.replace(/gsd-/g, 'gsdr-');

  return result;
}
```

**CRITICAL ORDERING:** Pass 2 (runtime path replacement) must run BEFORE Pass 3 (namespace rewriting). Pass 2 replaces `~/.claude/` with `runtimePathPrefix`. If Pass 3 ran first and changed `get-shit-done/` to `get-shit-done-reflect/`, then the path `~/.claude/get-shit-done-reflect/` would NOT match the Pass 2 regex `~/.claude/`, leaving stale tilde paths. Current ordering is correct.

**WAIT -- Re-analysis of ordering:** Actually, Pass 2 replaces `~/.claude/` leaving everything after it intact. So `~/.claude/get-shit-done/foo` becomes `~/.config/opencode/get-shit-done/foo`. Then Pass 3 replaces `get-shit-done/` with `get-shit-done-reflect/`, yielding `~/.config/opencode/get-shit-done-reflect/foo`. This is correct. The order Pass 2 then Pass 3 is right.

**Double-replacement safety (confirmed by deliberation):**
- `gsd-` followed by next char: In `gsdr-executor`, char after `gsd` is `r`, not `-`. No match.
- `get-shit-done/` followed by next char: In `get-shit-done-reflect/`, char after `get-shit-done` is `-`, not `/`. No match.
- `/gsd:` followed by next char: In `/gsdr:`, char after `gsd` is `r`, not `:`. No match.

### Pattern 2: Agent Filename Renaming During Copy
**What:** When copying agent .md files from source to destination, rename `gsd-*.md` to `gsdr-*.md`.
**When to use:** In the agent copy loop (install.js line ~2169-2182).
**Example:**
```javascript
// Current:
fs.writeFileSync(path.join(agentsDest, entry.name), content);

// Changed:
const destName = entry.name.startsWith('gsd-')
  ? entry.name.replace(/^gsd-/, 'gsdr-')
  : entry.name;
fs.writeFileSync(path.join(agentsDest, destName), content);
```

### Pattern 3: Hook Filename Renaming and Content Replacement
**What:** Hooks are JS files. They need both filename renaming AND internal path replacement.
**When to use:** In the hook copy loop (install.js line ~2231-2241).
**Example:**
```javascript
// Current (copies hooks verbatim):
for (const entry of hookEntries) {
  const srcFile = path.join(hooksSrc, entry);
  if (fs.statSync(srcFile).isFile()) {
    const destFile = path.join(hooksDest, entry);
    fs.copyFileSync(srcFile, destFile);
  }
}

// Changed (rename + content replace):
for (const entry of hookEntries) {
  const srcFile = path.join(hooksSrc, entry);
  if (fs.statSync(srcFile).isFile()) {
    // Rename gsd-* to gsdr-*
    const destName = entry.startsWith('gsd-')
      ? entry.replace(/^gsd-/, 'gsdr-')
      : entry;
    const destFile = path.join(hooksDest, destName);

    // Replace hardcoded paths in hook JS content
    let content = fs.readFileSync(srcFile, 'utf8');
    content = content.replace(/get-shit-done/g, 'get-shit-done-reflect');
    // Note: hooks reference ~/.claude/ which is correct for Claude runtime
    // The runtimePathPrefix handling already covers this via hook command paths
    fs.writeFileSync(destFile, content);
  }
}
```

### Pattern 4: Destination Directory Naming
**What:** Change the destination directory names used in `install()`.
**When to use:** All directory targets in `install()`.
**Example:**
```javascript
// Current:
const gsdDest = path.join(commandsDir, 'gsd');     // commands/gsd/
const skillDest = path.join(targetDir, 'get-shit-done');  // get-shit-done/

// Changed:
const gsdDest = path.join(commandsDir, 'gsdr');    // commands/gsdr/
const skillDest = path.join(targetDir, 'get-shit-done-reflect');  // get-shit-done-reflect/
```

### Anti-Patterns to Avoid
- **Modifying source files:** Never change files in `agents/`, `commands/gsd/`, `get-shit-done/` -- source must stay `gsd` for upstream merge compatibility.
- **Forgetting uninstall:** Every install path change must have a corresponding uninstall cleanup change. The uninstall function has hardcoded `gsd-` prefixes for agent cleanup, `commands/gsd` for command cleanup, `get-shit-done` for runtime cleanup, and specific hook names for hook cleanup.
- **Forgetting manifest:** The `writeManifest()` function hardcodes `get-shit-done/`, `commands/gsd/`, and `gsd-` agent prefix. These must all update.
- **Forgetting OpenCode/Codex/Gemini runtimes:** The installer has 4 runtime-specific code paths. All must update destination directories.
- **Partially updating hook references:** Settings.json hook registration builds commands like `node .claude/hooks/gsd-statusline.js`. Both the filename AND the matching check (e.g., `h.command.includes('gsd-check-update')`) must update.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content rewriting | Custom AST parser | Extend `replacePathsInContent()` with string.replace() | Proven safe by deliberation analysis, existing pattern works |
| Path resolution | New path resolution framework | Existing `pathPrefix` variable + string replacement | The installer already has the infrastructure |
| Hook path management | Dynamic path resolution hooks | String replacement during copy | Hooks are simple JS files, path constants are easily replaceable |

**Key insight:** The installer already solves the same class of problem (rewriting paths for different runtimes). This phase extends the existing mechanism rather than inventing a new one.

## Common Pitfalls

### Pitfall 1: Forgetting the Uninstall Function
**What goes wrong:** Install writes to new paths, but uninstall still cleans old paths. Leaves orphaned files on disk after uninstall.
**Why it happens:** Uninstall is a separate function with independently hardcoded paths (lines 1404-1600).
**How to avoid:** Update every hardcoded path/prefix in `uninstall()`: `commands/gsd` -> `commands/gsdr`, `get-shit-done` -> `get-shit-done-reflect`, `gsd-` agent prefix -> `gsdr-`, hook names `gsd-statusline.js` -> `gsdr-statusline.js`, settings.json hook matching patterns.
**Warning signs:** Uninstall test fails to find files, or manual uninstall leaves directories behind.

### Pitfall 2: Forgetting Non-Claude Runtime Paths
**What goes wrong:** Claude runtime works but OpenCode/Codex/Gemini installs still use `gsd` naming.
**Why it happens:** The installer has 4 separate code paths: Claude nested commands, OpenCode flattened commands, Codex skills, Gemini TOML conversion. Each has independent logic.
**How to avoid:** Trace ALL code paths through install.js. Key functions: `copyCodexSkills()` (line 955), `copyFlattenedCommands()` (line 1227), `copyWithPathReplacement()` (line 1279), agent copy loop (line 2169), hook copy (line 2231).
**Warning signs:** Tests for OpenCode/Codex runtimes fail with stale `gsd-` prefixes.

### Pitfall 3: Hook Content Has Hardcoded Paths
**What goes wrong:** Hooks are JS files, not markdown. `replacePathsInContent()` is only called for `.md` files. Hooks copied verbatim contain `~/.claude/get-shit-done/` paths.
**Why it happens:** Hooks are currently copied via `fs.copyFileSync()` (line 2239), bypassing content replacement.
**How to avoid:** Add content replacement for hook JS files during the copy loop. Replace `get-shit-done` with `get-shit-done-reflect` in hook content.
**Warning signs:** Hooks fail to find VERSION file at runtime. Cache file paths reference wrong directory.

### Pitfall 4: Manifest and Local Patches Paths
**What goes wrong:** File manifest (`gsd-file-manifest.json`) stores relative paths like `get-shit-done/VERSION` and `commands/gsd/help.md`. After renaming, the manifest checks wrong paths, causing false-positive "modified files" detection.
**Why it happens:** `writeManifest()` (line 1867) hardcodes `get-shit-done/`, `commands/gsd/`, and `gsd-` agent prefixes.
**How to avoid:** Update all path prefixes in `writeManifest()`. Also update `saveLocalPatches()` and `pruneRedundantPatches()` if they reference these paths.
**Warning signs:** Every reinstall reports "modified files" for files that weren't actually changed.

### Pitfall 5: Cross-Scope VERSION Detection
**What goes wrong:** The cross-scope detection at line 2054 checks `get-shit-done/VERSION` to warn about dual installations. After renaming, the path changes.
**Why it happens:** `otherScopeVersionPath` is hardcoded with `get-shit-done/VERSION`.
**How to avoid:** Update to `get-shit-done-reflect/VERSION`.
**Warning signs:** No dual-install warning when both scopes are installed.

### Pitfall 6: OpenCode Permission Configuration
**What goes wrong:** `configureOpencodePermissions()` (line 1727) adds read permission for `get-shit-done/*`. After renaming, the path is wrong.
**Why it happens:** The function builds a `gsdPath` variable with `get-shit-done/*`.
**How to avoid:** Update to `get-shit-done-reflect/*`.
**Warning signs:** OpenCode prompts for permission to read GSD docs.

### Pitfall 7: Settings.json Hook Matching
**What goes wrong:** Hook registration checks like `h.command.includes('gsd-check-update')` still match old hook names after renaming. This could cause duplicate hooks or fail to detect existing hooks.
**Why it happens:** The `includes()` check strings are hardcoded throughout install.js.
**How to avoid:** Update ALL hook name checks: `gsd-check-update` -> `gsdr-check-update`, `gsd-statusline` -> `gsdr-statusline`, `gsd-version-check` -> `gsdr-version-check`, `gsd-ci-status` -> `gsdr-ci-status`.
**Warning signs:** Duplicate hooks in settings.json after reinstall.

### Pitfall 8: Existing Tests Assert Old Paths (sig-2026-02-23)
**What goes wrong:** Integration tests in `tests/unit/install.test.js` assert `commands/gsd`, `get-shit-done`, and `gsd-` prefixes. These tests will fail.
**Why it happens:** Tests verify installed output. Since installed output changes, assertions must change.
**How to avoid:** Update test assertions to expect `commands/gsdr`, `get-shit-done-reflect`, and `gsdr-` prefixes.
**Warning signs:** Test suite fails immediately after implementation.

## Code Examples

### Example 1: Extended replacePathsInContent()
```javascript
// Source: bin/install.js lines 1134-1160 (current) + new passes
function replacePathsInContent(content, runtimePathPrefix) {
  // Pass 1: Replace shared KB paths (UNCHANGED)
  let result = content.replace(/~\/\.claude\/gsd-knowledge/g, '~/.gsd/knowledge');
  result = result.replace(/\$HOME\/\.claude\/gsd-knowledge/g, '$HOME/.gsd/knowledge');

  // Pass 2: Replace remaining runtime-specific paths (UNCHANGED)
  result = result.replace(/~\/\.claude\/(?!gsd-knowledge)(?! )/g, runtimePathPrefix);
  let runtimeSuffix;
  if (runtimePathPrefix.startsWith('~/')) {
    runtimeSuffix = runtimePathPrefix.slice(2);
  } else if (runtimePathPrefix.startsWith(os.homedir())) {
    runtimeSuffix = runtimePathPrefix.slice(os.homedir().length + 1);
  } else {
    runtimeSuffix = runtimePathPrefix;
  }
  result = result.replace(/\$HOME\/\.claude\/(?!gsd-knowledge)(?! )/g, '$HOME/' + runtimeSuffix);

  // Pass 3: GSDR namespace rewriting (NEW)
  // Order matters: get-shit-done/ BEFORE gsd- to avoid partial matches
  result = result.replace(/get-shit-done\//g, 'get-shit-done-reflect/');
  result = result.replace(/\/gsd:/g, '/gsdr:');
  result = result.replace(/\bgsd-/g, 'gsdr-');

  return result;
}
```

### Example 2: Agent File Rename During Copy
```javascript
// Source: bin/install.js lines 2169-2182 (modified)
const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
for (const entry of agentEntries) {
  if (entry.isFile() && entry.name.endsWith('.md')) {
    let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
    content = replacePathsInContent(content, pathPrefix);
    content = processAttribution(content, getCommitAttribution(runtime));
    if (isOpencode) {
      content = convertClaudeToOpencodeFrontmatter(content);
    } else if (isGemini) {
      content = convertClaudeToGeminiAgent(content);
    }
    // Rename gsd-*.md -> gsdr-*.md (NEW)
    const destName = entry.name.startsWith('gsd-')
      ? entry.name.replace(/^gsd-/, 'gsdr-')
      : entry.name;  // Preserves knowledge-store.md, kb-templates/
    fs.writeFileSync(path.join(agentsDest, destName), content);
  }
}
```

### Example 3: Updated Uninstall Cleanup
```javascript
// Source: bin/install.js lines 1462-1494 (modified)
// Claude Code & Gemini: remove commands/gsdr/ directory
const gsdrCommandsDir = path.join(targetDir, 'commands', 'gsdr');
if (fs.existsSync(gsdrCommandsDir)) {
  fs.rmSync(gsdrCommandsDir, { recursive: true });
  removedCount++;
  console.log(`  ${green}+${reset} Removed commands/gsdr/`);
}

// Remove get-shit-done-reflect directory
const gsdDir = path.join(targetDir, 'get-shit-done-reflect');
if (fs.existsSync(gsdDir)) {
  fs.rmSync(gsdDir, { recursive: true });
  removedCount++;
  console.log(`  ${green}+${reset} Removed get-shit-done-reflect/`);
}

// Remove GSD agents (gsdr-*.md files only)
const agentsDir = path.join(targetDir, 'agents');
if (fs.existsSync(agentsDir) && !isCodex) {
  const files = fs.readdirSync(agentsDir);
  let agentCount = 0;
  for (const file of files) {
    if (file.startsWith('gsdr-') && file.endsWith('.md')) {
      fs.unlinkSync(path.join(agentsDir, file));
      agentCount++;
    }
  }
  // Also clean up knowledge-store.md (our file, no prefix)
  // ...
}
```

### Example 4: Hook Copy with Rename and Content Replace
```javascript
// Source: bin/install.js lines 2231-2241 (modified)
if (fs.existsSync(hooksSrc) && !isCodex) {
  const hooksDest = path.join(targetDir, 'hooks');
  safeFs('mkdirSync', () => fs.mkdirSync(hooksDest, { recursive: true }), hooksDest);
  const hookEntries = fs.readdirSync(hooksSrc);
  for (const entry of hookEntries) {
    const srcFile = path.join(hooksSrc, entry);
    if (fs.statSync(srcFile).isFile()) {
      // Rename gsd-*.js -> gsdr-*.js
      const destName = entry.startsWith('gsd-')
        ? entry.replace(/^gsd-/, 'gsdr-')
        : entry;
      const destFile = path.join(hooksDest, destName);

      // Replace paths in hook JS content
      let content = fs.readFileSync(srcFile, 'utf8');
      content = content.replace(/get-shit-done/g, 'get-shit-done-reflect');
      fs.writeFileSync(destFile, content);
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Source rename (Option B) | Install-time rewriting (Option A) | 2026-03-06 deliberation | Preserves upstream merge surface at 18 files |
| No co-installation support | Namespace-isolated installation | Phase 44 | Enables GSD + GSD Reflect on same machine |

## Open Questions

### Resolved
- **Is double-replacement a risk?** No. Deliberation proved all replacement patterns are naturally safe. `gsd-` only matches when followed by `-`, so `gsdr-` is never matched. Same for `get-shit-done/` vs `get-shit-done-reflect/` and `/gsd:` vs `/gsdr:`.
- **Should `~/.gsd/` KB root change?** No. It's Reflect-only, no collision with upstream GSD.
- **What about `gsd-tools.js` filename?** Unchanged. The path to it (`get-shit-done/bin/gsd-tools.js`) is handled by the directory rename rule (rule #4).
- **What about the OpenCode `/gsd-` command prefix?** OpenCode uses `convertClaudeToOpencodeFrontmatter()` which replaces `/gsd:` with `/gsd-`. After our rule changes `/gsd:` to `/gsdr:`, OpenCode conversion will produce `/gsdr-`. This is correct.
- **What about Codex `$gsd-` skill mentions?** Codex conversion replaces `/gsd:command` with `$gsd-command`. After our rule changes `/gsd:` to `/gsdr:`, Codex conversion will produce `$gsdr-command`. This is correct.
- **Are hooks processed by replacePathsInContent()?** No. Hooks are `.js` files and are currently copied with `fs.copyFileSync()` (line 2239). They need separate handling.
- **Does build-hooks.js need changes?** No. It discovers hooks dynamically via `fs.readdirSync(HOOKS_DIR).filter(f => f.startsWith('gsd-'))`. Source hooks remain `gsd-*`. The rename happens during install, not build.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Do OpenCode/Codex conversion functions also need `gsd-` to `gsdr-` updates? | Medium | Yes -- `copyCodexSkills()` line 955 uses `prefix` param for skill naming. Currently hardcoded to `'gsd'`. Must change to `'gsdr'`. Same for `copyFlattenedCommands()` which uses `prefix` for command naming. |
| Should `gsd-local-patches` and `gsd-file-manifest.json` names change? | Low | Recommend yes for consistency, but these are internal installer artifacts, not user-facing. Could defer. |
| Does the `\bgsd-` word boundary regex match inside URLs or package names? | Medium | The package name `get-shit-done-reflect-cc` does NOT contain `gsd-`. The npm package `get-shit-done-cc` contains `get-shit-done` but NOT `gsd-`. In hook JS, `npm view get-shit-done-reflect-cc version` is safe because `gsd-` doesn't appear. However, need to verify no false matches in markdown content referencing package names. Accept risk -- the content corpus is known. |

### Still Open
- Exact behavior when BOTH upstream GSD and GSD Reflect are installed: does the user need to run `/gsdr:help` explicitly, or does autocomplete differentiate clearly?

## Inventory of All Required Changes

### bin/install.js Functions to Modify

| Function | Line | What Changes | Why |
|----------|------|-------------|-----|
| `replacePathsInContent()` | 1134 | Add 3 new replacement passes (get-shit-done/, /gsd:, gsd-) | Core content rewriting |
| `install()` | 2023 | Change dest dirs: get-shit-done->get-shit-done-reflect, gsd->gsdr | Install targets |
| `install()` agent loop | 2169 | Rename gsd-*.md -> gsdr-*.md during copy | Agent filename mapping |
| `install()` hook loop | 2231 | Rename gsd-*.js -> gsdr-*.js + content replace | Hook filename + paths |
| `install()` VERSION path | 2213 | get-shit-done/VERSION -> get-shit-done-reflect/VERSION | Version file location |
| `install()` cross-scope | 2054 | get-shit-done/VERSION -> get-shit-done-reflect/VERSION | Dual-install detection |
| `install()` skillDest | 2136-2137 | get-shit-done -> get-shit-done-reflect | Runtime dir |
| `install()` gsdDest | 2124 | gsd -> gsdr | Command dir |
| `install()` CHANGELOG | 2202 | get-shit-done/CHANGELOG.md -> get-shit-done-reflect/CHANGELOG.md | Changelog location |
| `install()` OpenCode commands | 2107-2109 | prefix 'gsd' -> 'gsdr' | Flattened command names |
| `install()` Codex skills | 2090-2091 | prefix 'gsd' -> 'gsdr' | Skill names |
| `install()` agent cleanup | 2160-2165 | `gsd-` -> `gsdr-` prefix for old agent removal | Clean install |
| `install()` hook commands | 2267-2278 | gsd-*.js -> gsdr-*.js in hook command names | Settings.json hooks |
| `install()` hook matching | 2300-2346 | `gsd-check-update` -> `gsdr-check-update` etc. | Duplicate detection |
| `uninstall()` | 1404 | All path references: gsd->gsdr, get-shit-done->get-shit-done-reflect | Cleanup targets |
| `uninstall()` hook names | 1547 | gsd-*.js -> gsdr-*.js | Hook cleanup |
| `uninstall()` settings hooks | 1583-1584 | gsd-* -> gsdr-* in includes() checks | Settings cleanup |
| `writeManifest()` | 1867 | get-shit-done/ -> get-shit-done-reflect/, commands/gsd/ -> commands/gsdr/, gsd- -> gsdr- | Manifest paths |
| `configureOpencodePermissions()` | 1727 | get-shit-done/* -> get-shit-done-reflect/* | Permission config |
| `finishInstall()` | 2365 | /gsd:help -> /gsdr:help, /gsd-help -> /gsdr-help | Completion message |
| `cleanupOrphanedFiles()` | 1326 | No change needed (orphan list refers to old file names already gone) | N/A |
| `cleanupOrphanedHooks()` | 1344 | gsd-statusline -> gsdr-statusline etc. in orphan patterns | Hook cleanup patterns |
| `copyCodexSkills()` | 955 | Caller passes 'gsdr' prefix instead of 'gsd' | Codex skill naming |
| `copyFlattenedCommands()` | 1227 | Caller passes 'gsdr' prefix instead of 'gsd' | OpenCode command naming |

### Other Files to Update (Non-Source)

| File | What Changes |
|------|-------------|
| `tests/unit/install.test.js` | Update assertions for new paths and prefixes |
| `tests/integration/wiring-validation.test.js` | Update expected subagent_type patterns and path resolution |
| `tests/integration/multi-runtime.test.js` | Update expected directory and file names |
| `.planning/FORK-DIVERGENCES.md` | Document install.js as modified |

### Files NOT Changed (Confirmed)
- All files in `agents/` (source stays gsd-)
- All files in `commands/gsd/` (source stays gsd)
- All files in `get-shit-done/` (source stays get-shit-done)
- `hooks/gsd-*.js` source files (unchanged, renamed at install time)
- `scripts/build-hooks.js` (discovers hooks dynamically)
- `get-shit-done/bin/gsd-tools.js` (upstream file, never modify)

## Sources

### Primary (HIGH confidence)
- `bin/install.js` lines 1134-1160 -- `replacePathsInContent()` implementation read directly
- `bin/install.js` lines 2023-2360 -- `install()` function read directly
- `bin/install.js` lines 1404-1600 -- `uninstall()` function read directly
- `bin/install.js` lines 1867-1893 -- `writeManifest()` function read directly
- `.planning/deliberations/gsdr-namespace-co-installation.md` -- full deliberation document
- `hooks/gsd-check-update.js`, `gsd-version-check.js`, `gsd-statusline.js`, `gsd-ci-status.js` -- hook source files read directly
- `tests/unit/install.test.js` -- existing test assertions read directly
- `tests/integration/wiring-validation.test.js` -- wiring validation patterns read directly

### Secondary (MEDIUM confidence)
- `.planning/FORK-DIVERGENCES.md` -- upstream merge surface analysis

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-11-local-install-global-kb-model | signal | Installer path resolution assumes global install; local install breaks path refs | Architecture Patterns (confirmed `replacePathsInContent()` already handles local vs global paths, same mechanism we extend) |
| sig-2026-02-23-installer-clobbers-force-tracked-files | signal | Installer removes+recreates agent directories during install, can lose force-tracked files | Common Pitfalls (Pitfall 8: test assertions must account for the full directory wipe-and-recreate pattern) |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, extends existing patterns
- Architecture: HIGH - installer code read directly, all functions mapped, deliberation provided exhaustive analysis
- Pitfalls: HIGH - 8 pitfalls identified from direct code reading, cross-referenced with KB signals
- Code examples: HIGH - based on actual code lines with verified line numbers

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- installer changes rarely)
