# Phase 52: Feature Adoption - Research

**Researched:** 2026-03-27
**Domain:** Upstream feature adoption, namespace rewriting, agent/workflow/hook integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All adopted files follow the established pattern: source files use `gsd` prefix, installer rewrites to `gsdr` at install time via `replacePathsInContent()`.
- `bin/install.js` already respects `CLAUDE_CONFIG_DIR` (lines 172-177) for the config directory resolution. ADT-04 requires extending this to all other paths that hardcode `~/.claude`.

### Claude's Discretion
- Ordering of feature adoption (which features in which plans)
- Whether discuss-phase is wholesale-replaced or incrementally merged
- Test strategy for adopted features (unit tests per feature vs integration tests)
- How to handle upstream test files that accompany adopted features

### Deferred Ideas (OUT OF SCOPE)
- Deep integration of context-monitor with automation deferral -- Phase 53 (INT-01)
- Nyquist auditor output feeding into artifact sensor -- Phase 53 (INT-02, INT-03)
- KB knowledge surfacing in discuss-phase -- Phase 53 (INT-04)
- Cleanup workflow exclusion list for fork directories -- Phase 53 (INT-05)
</user_constraints>

## Summary

Phase 52 adopts 10 upstream features into the fork. Research confirms that most features (7 of 10) are straightforward copy-and-namespace-rewrite operations following the established `replacePathsInContent()` pattern. Three features require deeper analysis: the discuss-phase merge (ADT-06) is the most complex due to a 641-line delta with conflicting structural models; the context-monitor hook (ADT-01) introduces a new inter-hook bridge file contract; and the statusline hook update (ADT-02/ADT-03) requires careful modification of an existing fork-customized file.

Key findings: (1) The fork's `resolveModelInternal()` in core.cjs already implements per-agent model overrides via `model_overrides` config key -- ADT-09 is already done in the runtime, only the reference doc needs updating. (2) The CLAUDE_CONFIG_DIR scope analysis reveals the statusline hook has 6 hardcoded `path.join(homeDir, '.claude', ...)` calls that need env-var gating. (3) The discuss-phase merge should be an incremental merge (not wholesale replace) because the upstream adds 6 new steps (`load_prior_context`, `cross_reference_todos`, `scout_codebase`, `advisor_research`, `auto_advance`, `update_state`) and restructures `write_context`/`discuss_areas` with features (batch mode, analyze mode, text mode, auto mode, discussion log) that are purely additive to the fork's simpler structure. The fork's steering brief model (Working Model, Derived Constraints, Open Questions, Epistemic Guardrails) is a CONTEXT.md output concern, not a discuss-phase workflow concern -- the upstream's richer `write_context` template adds `<canonical_refs>`, `<code_context>`, and `<folded_todos>` sections that are complementary. (4) The upstream drift clusters C2 (shell robustness) and C4 (worktree isolation) affect workflows already in the fork.

**Primary recommendation:** Wholesale-replace the discuss-phase workflow (the fork's steering brief sections live in CONTEXT.md output, not in the workflow spec), adopt context-monitor as a new hook, update statusline with CLAUDE_CONFIG_DIR + bridge file + context scaling fix, and copy-rewrite all remaining agents/workflows/commands.

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `replacePathsInContent()` | install.js | Namespace rewriting (gsd->gsdr, paths) | Established fork pattern since Phase 45; handles 4 rewrite passes |
| `copyWithPathReplacement()` | install.js | Recursive directory copy with rewriting | Pairs with replacePathsInContent for directory trees |
| `validateHookFields()` | install.js | Hook registration validation | Phase 51 established pattern |
| `ensureHook()` | install.js | Hook installation in settings.json | Standard hook registration mechanism |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `injectVersionScope()` | Add version to command description frontmatter | All adopted command files |
| CODEX_AGENT_SANDBOX map | Sandbox level per agent for Codex runtime | When adding new agents (nyquist-auditor) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Wholesale discuss-phase replace | Incremental merge | Replace is simpler and safer -- the fork's steering brief lives in CONTEXT.md output, not the workflow spec itself |
| Per-feature unit tests | Integration sweep test | Integration test catches namespace misses across all adopted files at once |

## Architecture Patterns

### Pattern 1: Copy-and-Namespace-Rewrite (ADT-05, ADT-07, ADT-08, ADT-10)

**What:** Copy upstream source file to fork's source directory with `gsd` prefix, let installer handle namespace rewriting at install time.

**When to use:** Any net-new file from upstream (agents, workflows, commands) that has no fork-specific customization.

**Procedure:**
1. Copy upstream file to fork's `agents/`, `get-shit-done/workflows/`, or `commands/gsd/` directory
2. File keeps `gsd-` prefix in source (installer rewrites to `gsdr-`)
3. File keeps `~/.claude/` paths in source (installer rewrites to `./.claude/get-shit-done-reflect/`)
4. File keeps `/gsd:` command prefixes (installer rewrites to `/gsdr:`)
5. Add agent-protocol.md reference if missing (DC-7)
6. Register in installer if needed (CODEX_AGENT_SANDBOX, hook lists, orphan cleanup)
7. Run `node bin/install.js --local` to verify rewriting
8. Verify with grep: no `gsd-` (non-tools), no `~/.claude/`, no `/gsd:` in installed output

**Example (nyquist auditor):**
```bash
# Copy from upstream
git show upstream/main:agents/gsd-nyquist-auditor.md > agents/gsd-nyquist-auditor.md

# Verify agent-protocol reference exists (DC-7)
grep -c "agent-protocol.md" agents/gsd-nyquist-auditor.md
# If 0: add @~/.claude/get-shit-done/references/agent-protocol.md

# Register in installer's CODEX_AGENT_SANDBOX
# Add: 'gsd-nyquist-auditor': 'workspace-write'

# Install locally
node bin/install.js --local

# Verify namespace rewriting in installed output
grep "gsd-" .claude/agents/gsdr-nyquist-auditor.md | grep -v "gsd-tools"
# Should return nothing (all rewritten to gsdr-)
```

### Pattern 2: Hook Adoption with Bridge File (ADT-01, ADT-02, ADT-03)

**What:** Add context-monitor hook and update statusline hook with bridge file writing, context scaling fix, and stdin timeout guard.

**Bridge File Contract:**
- **Writer:** Statusline hook (Notification event) writes to `/tmp/claude-ctx-{session_id}.json`
- **Reader:** Context-monitor hook (PostToolUse event) reads from same path
- **Schema:** `{ session_id, remaining_percentage, used_pct, timestamp }`
- **Staleness:** Reader ignores metrics older than 60 seconds
- **Failure mode:** Both sides silently fail -- never block hook execution

**Key statusline changes (from 80% to 83.5% scaling):**
```javascript
// OLD (fork): Scale to 80% limit
const used = Math.min(100, Math.round((rawUsed / 80) * 100));

// NEW (upstream): AUTO_COMPACT_BUFFER_PCT = 16.5
const AUTO_COMPACT_BUFFER_PCT = 16.5;
const usableRemaining = Math.max(0, ((remaining - AUTO_COMPACT_BUFFER_PCT) / (100 - AUTO_COMPACT_BUFFER_PCT)) * 100);
const used = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));
```

**Key statusline changes (CLAUDE_CONFIG_DIR):**
```javascript
// OLD (fork): hardcoded
const todosDir = path.join(homeDir, '.claude', 'todos');
const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');
// ... 6 total hardcoded paths

// NEW (upstream pattern):
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');
const todosDir = path.join(claudeDir, 'todos');
const cacheFile = path.join(claudeDir, 'cache', 'gsd-update-check.json');
```

**Stdin timeout guard (ADT-03):**
```javascript
// Upstream pattern -- add to ALL hooks that read stdin
const stdinTimeout = setTimeout(() => process.exit(0), 3000); // 3s for statusline
// ... or 10000 for context-monitor (longer because PostToolUse may have more data)
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  // ... normal processing
});
```

### Pattern 3: Discuss-Phase Wholesale Replace (ADT-06)

**What:** Replace fork's 408-line discuss-phase.md with upstream's 1049-line version.

**Why wholesale replace (not incremental merge):**

The fork's discuss-phase (408 lines) is structurally a subset of upstream's (1049 lines). The fork has:
- 6 steps: `initialize`, `check_existing`, `analyze_phase`, `present_gray_areas`, `discuss_areas`, `write_context`, `confirm_creation`, `git_commit`
- Simple question flow (4 questions per area)
- Basic CONTEXT.md template (domain, decisions, specifics, deferred)

The upstream ADDS (not conflicts with):
- `load_prior_context` step -- reads PROJECT.md, REQUIREMENTS.md, prior CONTEXT.md files
- `cross_reference_todos` step -- matches pending todos to phase scope
- `scout_codebase` step -- lightweight code scan for reusable assets
- `advisor_research` step -- spawns parallel research agents per gray area
- `auto_advance` step -- chains discuss -> plan -> execute in auto mode
- `update_state` step -- records session in STATE.md
- Discussion log generation (`DISCUSSION-LOG.md`)
- Batch mode (`--batch`), analyze mode (`--analyze`), text mode (`--text`), auto mode (`--auto`)
- Answer validation with retry logic
- Enhanced CONTEXT.md template with `<canonical_refs>`, `<code_context>`, `<folded_todos>`
- Prior decision annotations in gray area presentation
- Code context annotations from scout step

**The fork's steering brief model concern (DC-4):**
The fork's CONTEXT.md output sections (Working Model & Assumptions, Derived Constraints, Open Questions, Epistemic Guardrails) are NOT part of the discuss-phase workflow file. They are in the fork's custom `commands/gsdr/discuss-phase.md` command file (the `gsdr:`-prefixed version), which has its own custom prompt template. The workflow file (`get-shit-done/workflows/discuss-phase.md`) generates the base `<domain>/<decisions>/<specifics>/<deferred>` sections. The fork adds its steering brief sections on top. This means **replacing the workflow file does not lose the steering brief model** -- it lives in the fork's custom command layer.

**Verification:** After replacement, confirm the fork's `commands/gsdr/discuss-phase.md` still references the steering brief sections, and the upstream workflow's enhanced `write_context` template is compatible with the fork's additions.

### Pattern 4: Upstream Drift Integration (C2 + C4)

**What:** Apply shell robustness guards (C2) and worktree isolation (C4) to fork workflows.

**C2 - Shell robustness (commit 58c2b1f):**
- Adds `|| true` guards to informational commands (ls, grep, find, cat) that can return non-zero on "no results"
- Adds `[ -e "$var" ] || continue` guards for empty glob expansion
- Affects 17 workflow files (mostly `|| true` additions)
- Fork should adopt changes to files it already has

**C4 - Worktree isolation (commit 8380f31):**
- Adds `isolation="worktree"` to Task() dispatch sites for code-writing agents
- Affects: `execute-phase.md`, `execute-plan.md`, `quick.md`, `diagnose-issues.md`
- Fork has `execute-phase.md` and `quick.md`; `execute-plan.md` and `diagnose-issues.md` may need checking

### Anti-Patterns to Avoid
- **Editing .claude/ directly:** Always edit source (`agents/`, `get-shit-done/`, `commands/`) and reinstall. The v1.15 Phase 22 incident is the canonical example.
- **Manual namespace rewriting:** Let `replacePathsInContent()` handle it at install time. Manual rewriting causes inconsistencies.
- **Forgetting agent-protocol.md:** DC-7 requires all adopted agents reference it. Upstream agents may not have it.
- **Modifying upstream gsd-tools.cjs:** The fork convention is to never modify this file directly. The fork's core.cjs already has model_overrides support.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Namespace rewriting | Manual find-replace in files | `replacePathsInContent()` | 4-pass rewriting with safety guards; handles edge cases like gsd-tools exclusion |
| Hook registration | Manual settings.json editing | `ensureHook()` + `validateHookFields()` | Validates hook fields, handles multiple runtimes |
| Context scaling math | Custom percentage calculation | Upstream's `AUTO_COMPACT_BUFFER_PCT` formula | Empirically tuned by upstream; 16.5% buffer matches Claude Code's actual autocompact behavior |
| Bridge file format | Custom IPC format | Upstream's `/tmp/claude-ctx-{session_id}.json` | Proven contract with staleness check and silent failure |

**Key insight:** This phase is fundamentally a copy-and-integrate operation. The complexity is in understanding WHAT to copy and WHERE to register it, not in building new abstractions.

## Common Pitfalls

### Pitfall 1: Forgetting Installer Registration
**What goes wrong:** File is copied to source but not registered in installer (CODEX_AGENT_SANDBOX map, hook lists, orphan cleanup lists). File installs for Claude but not for Codex/OpenCode/Gemini, or gets orphan-cleaned on next install.
**Why it happens:** The installer has multiple registration points that are easy to miss.
**How to avoid:** For each new file type, check:
- Agents: add to `CODEX_AGENT_SANDBOX` map
- Hooks: add to `ensureHook()` calls and orphan cleanup list
- Commands: verify command stub references correct workflow path
- Workflows: no special registration needed (copied by `copyWithPathReplacement`)
**Warning signs:** File exists in `.claude/` but not in `.codex/` or `.opencode/` after `--all` install.

### Pitfall 2: Statusline Hook Has Fork Customizations
**What goes wrong:** Wholesale-replacing the fork's statusline hook with upstream's version loses the fork's CI status, health score, health check marker, dev install indicator, and automation level indicator sections.
**Why it happens:** The fork's statusline hook (189 lines) has significant fork-specific additions compared to upstream's version. Upstream has CLAUDE_CONFIG_DIR, bridge file writing, and context scaling fix. Fork has CI/health/dev/auto indicators.
**How to avoid:** Apply upstream changes surgically to fork's statusline:
1. Add stdin timeout guard (3s)
2. Update context scaling formula (80% -> 83.5%)
3. Add bridge file writing block
4. Add CLAUDE_CONFIG_DIR resolution (replace 6 hardcoded paths)
5. Keep fork's CI status, health score, health marker, dev tag, auto tag sections
**Warning signs:** After adoption, fork's statusline loses CI/health indicators.

### Pitfall 3: Discuss-Phase Steering Brief Loss
**What goes wrong:** Replacing the workflow file causes downstream CONTEXT.md to lose fork's steering brief sections.
**Why it happens:** Confusion about where the steering brief model lives. It is NOT in the workflow file.
**How to avoid:** Verify:
1. The fork's `commands/gsdr/discuss-phase.md` (the custom command) still adds steering brief sections
2. The upstream workflow's `write_context` template is compatible with the fork's custom additions
3. Test by running discuss-phase after adoption and checking CONTEXT.md output
**Warning signs:** CONTEXT.md after adoption lacks `<assumptions>`, `<constraints>`, `<questions>`, `<guardrails>` sections.

### Pitfall 4: Per-Agent Model Override Double Implementation
**What goes wrong:** Implementing ADT-09 when it is already implemented, causing confusion or code duplication.
**Why it happens:** The fork's `core.cjs` already has `model_overrides` support (lines 514-518) and the config loader parses `model_overrides` (line 144). This was ported from upstream commit `a5caf91` during a prior sync.
**How to avoid:** Verify ADT-09 is already functional:
```bash
# Check core.cjs has model_overrides
grep "model_overrides" get-shit-done/bin/lib/core.cjs
# Check reference doc mentions per-agent overrides
grep -c "model_overrides\|per-agent" get-shit-done/references/model-profiles.md
```
If the reference doc is missing the Per-Agent Overrides section, only the doc needs updating -- no code change.
**Warning signs:** Tests already pass for model_overrides behavior.

### Pitfall 5: Upstream Test Files Need Namespace Adaptation
**What goes wrong:** Copying upstream test files verbatim fails because they reference `gsd-` prefixed agents/commands that the fork rewrites to `gsdr-`.
**Why it happens:** Upstream tests use `gsd-` prefixes; fork runtime uses `gsdr-` prefixes.
**How to avoid:** Upstream tests live in the `tests/` directory which is NOT processed by `replacePathsInContent()`. Fork tests are in a separate `tests/` structure. Don't directly adopt upstream test files -- write fork-specific tests that verify the adopted features work with `gsdr-` namespace.

## Code Examples

### Adopting a New Hook (Context-Monitor)

```javascript
// Source: upstream hooks/gsd-context-monitor.js
// 1. Copy to fork source
// git show upstream/main:hooks/gsd-context-monitor.js > hooks/gsd-context-monitor.js

// 2. The file uses ~/. paths and gsd- prefix -- installer handles rewriting

// 3. Add hook version marker to build-hooks.js if applicable
// hooks/dist/ gets built versions

// 4. Register in installer's hook setup:
// In install.js, add to ensureHook() calls:
// ensureHook(settings, 'PostToolUse', 'context-monitor', hookCommand('gsd-context-monitor'));

// 5. Add to orphan cleanup list so stale versions get removed on update
```

### Updating Statusline with CLAUDE_CONFIG_DIR

```javascript
// Source: fork hooks/gsd-statusline.js
// Apply upstream's CLAUDE_CONFIG_DIR pattern:

// BEFORE (6 hardcoded paths):
const todosDir = path.join(homeDir, '.claude', 'todos');
const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');
const ciCacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-ci-status.json');
const healthCacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-health-score.json');
const healthMarkerFile = path.join(homeDir, '.claude', 'cache', 'gsd-health-check-needed');

// AFTER (single resolution, all paths use claudeDir):
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');
const todosDir = path.join(claudeDir, 'todos');
const cacheFile = path.join(claudeDir, 'cache', 'gsd-update-check.json');
const ciCacheFile = path.join(claudeDir, 'cache', 'gsd-ci-status.json');
const healthCacheFile = path.join(claudeDir, 'cache', 'gsd-health-score.json');
const healthMarkerFile = path.join(claudeDir, 'cache', 'gsd-health-check-needed');
```

### Integration-Checker Agent Update

```bash
# Fork already has agents/gsd-integration-checker.md (427 lines)
# Upstream has 443 lines (+16 delta)
# Diff and apply upstream additions:

diff <(cat agents/gsd-integration-checker.md) <(git show upstream/main:agents/gsd-integration-checker.md)

# Key difference: upstream adds CRITICAL mandatory initial read block
# and Requirements Integration Map requirement

# Add agent-protocol.md reference if missing (DC-7)
# Fork already has it at line 399 -- verify still present after update
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 80% context scaling | 83.5% (AUTO_COMPACT_BUFFER_PCT = 16.5) | Upstream 2026-03 | More accurate context usage display; aligns with Claude Code's actual autocompact buffer |
| No stdin timeout in hooks | 3s/10s timeout guards | Upstream commit 58c2b1f | Prevents hooks from hanging on pipe issues (Windows/Git Bash, slow Claude Code piping) |
| No worktree isolation | `isolation="worktree"` on code-writing agents | Upstream commit 8380f31 | Prevents branch pollution during concurrent agent work |
| Simple discuss-phase (408 lines) | Code-aware discuss-phase (1049 lines) | Upstream 2026-03 | Prior context loading, codebase scouting, advisor mode, batch/analyze/text/auto modes |
| No context-monitor hook | Bridge file + PostToolUse context warnings | Upstream 2026-03 | Agents become aware of context limits (statusline only showed users) |

**Deprecated/outdated:**
- 80% context scaling: Replaced by 83.5% (AUTO_COMPACT_BUFFER_PCT = 16.5)
- Direct stdin read (`readFileSync('/dev/stdin')`): Replaced by async stdin with timeout

## Open Questions

### Resolved
- **Q1 (Discuss-phase merge strategy):** Wholesale replace. Research confirms the fork's steering brief model lives in the custom command layer (`commands/gsdr/discuss-phase.md`), not in the workflow file. The upstream workflow's additions are purely additive. The fork's enhanced CONTEXT.md sections can coexist with upstream's new sections.
- **Q2 (Per-agent model override interaction):** Already implemented. Fork's `core.cjs` already has `model_overrides` support (lines 514-518). The resolution precedence is: per-agent override first, then profile lookup. This is complementary to the fork's model profiles. Only the reference doc may need the Per-Agent Overrides section added.
- **Q4 (Context-monitor bridge file format):** Upstream contract is: statusline writes `{ session_id, remaining_percentage, used_pct, timestamp }` to `/tmp/claude-ctx-{session_id}.json`. Context-monitor reads it with 60s staleness check. Both sides silently fail. The bridge file path does NOT use `~/.claude` (uses `os.tmpdir()`), so ADT-04 does not apply to bridge files.
- **Q5 (CLAUDE_CONFIG_DIR hardcoded path scope):** The statusline hook has 6 hardcoded `path.join(homeDir, '.claude', ...)` paths. The context-monitor hook has 0 (it uses `os.tmpdir()` and `data.cwd`). Other hooks need checking but are not adopted in this phase. Source files (agents, workflows, commands) use `~/.claude/` which is handled by `replacePathsInContent()` at install time -- those are NOT hardcoded at runtime.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Does the fork's custom `commands/gsdr/discuss-phase.md` need updating to reference the new upstream workflow features (batch mode, analyze mode, etc.)? | Medium | Inspect during planning; likely needs minor template additions |
| Does `hooks/gsd-prompt-guard.js` exist in upstream but not in fork? | Low | Not in ADT scope; defer to future adoption |

### Still Open
- **Q3 (Which upstream test files to adopt):** Partially resolved. Upstream has `tests/hook-validation.test.cjs` and `tests/windows-robustness.test.cjs` relevant to adopted features. However, fork tests are in a different directory structure (`tests/unit/`, `tests/integration/`, etc.) and use vitest, not direct cjs. Recommendation: write fork-specific tests rather than adapting upstream test files. The fork's wiring-validation tests already cover namespace checking.

## Sources

### Primary (HIGH confidence)
- Fork source code: `bin/install.js` -- `replacePathsInContent()` (lines 1337-1381), `getGlobalDir()` (lines 141-180), `CODEX_AGENT_SANDBOX` (lines 21-33)
- Fork source code: `get-shit-done/bin/lib/core.cjs` -- `resolveModelInternal()` (lines 511-526), `model_overrides` config loading (line 144)
- Fork source code: `hooks/gsd-statusline.js` -- current fork statusline (189 lines)
- Upstream main: `hooks/gsd-context-monitor.js` -- full context-monitor hook source
- Upstream main: `hooks/gsd-statusline.js` -- upstream statusline with bridge file + CLAUDE_CONFIG_DIR
- Upstream main: `get-shit-done/workflows/discuss-phase.md` -- 1049-line version with codebase scouting
- Upstream main: `agents/gsd-nyquist-auditor.md` -- full agent spec
- Upstream commit `a5caf91`: per-agent model override implementation (+8 lines in gsd-tools.js, +20 lines in model-profiles.md)
- Upstream commit `58c2b1f`: shell robustness (C2) -- 25 files, +314/-70 lines
- Upstream commit `8380f31`: worktree isolation (C4) -- 4 files, +6/-3 lines
- Fork vs upstream discuss-phase diff: 408 lines (fork) vs 1049 lines (upstream), +641 delta

### Secondary (MEDIUM confidence)
- Fork CONTEXT.md analysis for steering brief model location (verified by code inspection)

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), no relevant entries found for this phase's domain. The KB contains 136 signals and 1 spike (session log location), none related to feature adoption, namespace rewriting, or hook integration patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all patterns verified by direct code inspection of install.js, core.cjs, and upstream sources
- Architecture: HIGH -- namespace rewriting pattern well-established; discuss-phase merge analysis based on line-by-line structural comparison
- Pitfalls: HIGH -- all pitfalls derived from actual code inspection and verified prior incidents (v1.15 Phase 22 .claude/ editing, statusline fork customizations)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- these are internal fork patterns, not fast-moving external libraries)
