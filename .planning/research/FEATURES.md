# Feature Landscape: Upstream Changes for Adoption

**Domain:** Fork sync -- evaluating 70 upstream commits (v1.11.2 to v1.18.0) for adoption into GSD Reflect
**Researched:** 2026-02-09
**Overall confidence:** HIGH -- all analysis based on direct git diff examination of actual commit contents
**Fork point:** `2347fca35ead5b4bf93b238afdf30a0f91947391` (v1.11.2)

## Executive Summary

Upstream GSD underwent a massive architectural transformation since our fork point. The dominant change is the **gsd-tools CLI extraction** -- a 4,597-line Node.js utility that centralizes repetitive bash patterns from 50+ markdown files into deterministic code. This refactoring touched every agent, command, and workflow file in the system. Alongside this, there are 11 bug fixes, 6 new features, and several community-specific changes. Our fork's files overlap primarily in `bin/install.js`; the agent files in `.claude/agents/` are fork-local copies, not the canonical `agents/` directory that upstream modified.

---

## Table Stakes: Must Adopt

Bug fixes that affect correctness. Missing these means our fork has known defects.

### 1. Executor Completion Verification (Prevents Hallucinated Success)

| Field | Value |
|-------|-------|
| **Commit** | `f380275` |
| **Files** | `agents/gsd-executor.md`, `commands/gsd/execute-phase.md`, `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/execute-plan.md` |
| **Priority** | CRITICAL |
| **Applies to fork** | YES -- our fork uses the same executor pattern |
| **Conflict risk** | LOW -- our `.claude/agents/gsd-executor.md` is a separate file from `agents/gsd-executor.md` |

**What it fixes:** After an executor writes SUMMARY.md, it now verifies its own claims -- checking that `key-files.created` entries actually exist on disk and that commit hashes referenced actually exist in git log. The orchestrator also spot-checks SUMMARY claims before trusting them. Without this, the system can report success when files were not actually created or commits were not made.

**Why must-adopt:** This is the single most impactful correctness fix. Hallucinated success cascades -- downstream phases build on nonexistent foundations. This is not a theoretical risk; it was reported as issue #315 by a community contributor.

**Adoption notes:** The self-check logic is additive (new `<self_check>` section in executor agent). Apply to both `agents/gsd-executor.md` AND our `.claude/agents/gsd-executor.md`.

### 2. Context Fidelity Enforcement in Planning Pipeline

| Field | Value |
|-------|-------|
| **Commit** | `ecbc692` |
| **Files** | `agents/gsd-phase-researcher.md`, `agents/gsd-planner.md`, `get-shit-done/templates/research.md` |
| **Priority** | CRITICAL |
| **Applies to fork** | YES -- we use the same research-to-plan pipeline |
| **Conflict risk** | LOW -- additive changes to existing agent sections |

**What it fixes:** User decisions from CONTEXT.md (locked decisions, deferred ideas, Claude's discretion areas) were available to the planner but not enforced. The planner could ignore locked decisions or plan deferred features. Three specific issues: #326, #216, #206.

**Changes:**
- Researcher: New `## User Constraints` section is FIRST in RESEARCH.md, copying CONTEXT.md decisions verbatim so the planner sees them even if it only skims
- Planner: New `<context_fidelity>` section requiring agents to honor locked decisions before creating tasks, with self-check checklist
- Template: `research.md` template gets `<user_constraints>` section

**Why must-adopt:** Without this, user decisions are advisory rather than binding. Users specify "use library X" but the planner may choose library Y based on its own research. This undermines user trust in the system.

### 3. Respect parallelization Config Setting

| Field | Value |
|-------|-------|
| **Commit** | `4267c6c` |
| **Files** | `get-shit-done/workflows/execute-phase.md` |
| **Priority** | HIGH |
| **Applies to fork** | YES -- our config.json has `"parallelization": true` |
| **Conflict risk** | LOW -- additive changes to workflow |

**What it fixes:** The `parallelization` config setting in `config.json` was ignored. Agents always ran in parallel regardless of the setting. When set to `false`, plans within a wave should execute sequentially.

**Why must-adopt:** Users who set `parallelization: false` (to avoid concurrent file modifications, test interference, etc.) get parallel execution anyway, causing hard-to-debug failures.

### 4. Researcher Always Writes RESEARCH.md Regardless of commit_docs

| Field | Value |
|-------|-------|
| **Commit** | `161aa61` |
| **Files** | `agents/gsd-phase-researcher.md` |
| **Priority** | HIGH |
| **Applies to fork** | YES |
| **Conflict risk** | LOW |

**What it fixes:** The researcher agent misinterpreted `commit_docs=false` as "skip file write" when it should only skip git commit operations. Research files were silently not written, causing downstream planner failures.

**Why must-adopt:** With `commit_docs=false` (which some users use when .planning/ is gitignored), research results vanish. The planner then has nothing to work with.

### 5. Respect commit_docs=false in All .planning Commit Paths

| Field | Value |
|-------|-------|
| **Commit** | `01c9115` |
| **Files** | `agents/gsd-debugger.md`, `get-shit-done/bin/gsd-tools.js`, `get-shit-done/references/git-integration.md`, `get-shit-done/references/git-planning-commit.md`, `get-shit-done/references/planning-config.md`, `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/execute-plan.md` |
| **Priority** | HIGH |
| **Applies to fork** | YES -- our config has `commit_docs: true` but the fix also addresses context bloat from `--include` |
| **Conflict risk** | MEDIUM -- touches many files, depends on gsd-tools.js existing |

**What it fixes:** Two issues combined: (1) The `--include` flag from `fa81821` caused orchestrator context bloat by reading files into the orchestrator's context, consuming 50-60% before execution. Fix: pass file paths, let subagents read in their own context. (2) Two code paths (`execute-plan.md` codebase map step and `gsd-debugger.md` using `git add -A`) bypassed the `commit_docs` check.

**Why must-adopt:** Context bloat is a real performance issue. The `git add -A` bypass could commit planning files that should be excluded.

**Dependency:** Requires gsd-tools.js to be present for the `gsd-tools.js commit` routing.

### 6. Auto-create config.json When Missing

| Field | Value |
|-------|-------|
| **Commit** | `4dff989` |
| **Files** | `commands/gsd/set-profile.md`, `commands/gsd/settings.md` |
| **Priority** | MEDIUM |
| **Applies to fork** | YES |
| **Conflict risk** | LOW |

**What it fixes:** `set-profile` and `settings` commands hard-errored when `.planning/config.json` didn't exist, blocking users from changing model profile before running `new-project`.

**Why must-adopt:** Hard crash on a reasonable user action. Creates config.json with balanced defaults when missing.

### 7. Statusline Crash Handling

| Field | Value |
|-------|-------|
| **Commit** | `9d7ea9c` |
| **Files** | `hooks/gsd-statusline.js`, `bin/install.js`, `commands/gsd/execute-phase.md` |
| **Priority** | MEDIUM |
| **Applies to fork** | YES |
| **Conflict risk** | MEDIUM -- our install.js has branding changes |

**What it fixes:** Three bugs: (1) statusline.js crashes on file system permission errors or race conditions during directory reading, (2) install.js accepts invalid hex color values, (3) execute-phase.md uses `git add -u` violating stated git rules.

**Why must-adopt:** Statusline crash breaks the user's terminal experience silently. The git staging fix prevents accidental file inclusion.

### 8. Statusline Reference Update During Install

| Field | Value |
|-------|-------|
| **Commit** | `074b2bc` |
| **Files** | `bin/install.js` |
| **Priority** | MEDIUM |
| **Applies to fork** | YES |
| **Conflict risk** | MEDIUM -- overlaps with our install.js branding changes |

**What it fixes:** When updating GSD, the installer renames `statusline.js` to `gsd-statusline.js` but didn't update existing `settings.json` references. Users with old config see their status line disappear.

### 9. Prevent API Keys from Being Committed via map-codebase

| Field | Value |
|-------|-------|
| **Commit** | `f53011c` |
| **Files** | `agents/gsd-codebase-mapper.md`, `get-shit-done/workflows/map-codebase.md`, `README.md` |
| **Priority** | MEDIUM (security) |
| **Applies to fork** | YES |
| **Conflict risk** | LOW |

**What it fixes:** Defense-in-depth against API key leakage: (1) `<forbidden_files>` section in codebase mapper prohibiting reading .env/credentials, (2) `scan_for_secrets` step before commit with regex patterns, (3) Halts if secrets detected.

**Why must-adopt:** Security fix. Our fork is more likely to have secrets (CI tokens, npm tokens) given our publishing setup.

### 10. Persist Research Decision from new-milestone to Config

| Field | Value |
|-------|-------|
| **Commit** | `767bef6` |
| **Files** | `get-shit-done/bin/gsd-tools.js`, `get-shit-done/workflows/new-milestone.md` |
| **Priority** | MEDIUM |
| **Applies to fork** | YES |
| **Conflict risk** | LOW -- requires gsd-tools.js |

**What it fixes:** When user selects "Skip research" during `/gsd:new-milestone`, the choice was not saved to config.json. Later, `/gsd:plan-phase` reads the default (`research: true`) and spawns researchers anyway, wasting tokens.

**Dependency:** Requires `config-set` command in gsd-tools.js.

### 11. Prevent Installer from Deleting opencode.json on Parse Errors

| Field | Value |
|-------|-------|
| **Commit** | `6cf4a4e` |
| **Files** | `bin/install.js` |
| **Priority** | MEDIUM |
| **Applies to fork** | PARTIAL -- we may not use OpenCode, but the JSON parsing fix is good defensive coding |
| **Conflict risk** | MEDIUM -- overlaps with our install.js |

**What it fixes:** Installer used `JSON.parse()` which fails on JSONC (JSON with Comments). Parse failure would reset config to `{}` and overwrite user's file, causing data loss. Now adds `parseJsonc()` handler.

---

## Should Adopt: Valuable Features

Improvements with clear value for our fork. Not bugs, but meaningfully improve the system.

### 12. Executor Subagent Type Specification

| Field | Value |
|-------|-------|
| **Commit** | `4249506` |
| **Files** | `get-shit-done/workflows/execute-phase.md` |
| **Priority** | HIGH |
| **Applies to fork** | YES |

**What it fixes:** The workflow showed Task() prompt content but didn't specify `subagent_type="gsd-executor"`. This caused the orchestrator to spawn generic task agents instead of the specialized executor. This is functionally a bug, categorized here because it may or may not manifest depending on Claude Code version.

### 13. classifyHandoffIfNeeded Bug Workaround

| Field | Value |
|-------|-------|
| **Commit** | `4072fd2` |
| **Files** | `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/execute-plan.md`, `get-shit-done/workflows/quick.md` |
| **Priority** | HIGH (if using Claude Code v2.1.27+) |
| **Applies to fork** | YES |
| **Conflict risk** | LOW -- additive spot-check logic |

**What it does:** Claude Code v2.1.27+ has a bug where all Task tool agents report "failed" due to `classifyHandoffIfNeeded is not defined`. The actual work completes fine. This workaround adds spot-check fallback: when an agent reports this specific failure, verify artifacts on disk and treat as successful if spot-checks pass.

**Why should-adopt:** Without this, every execution appears to fail on affected Claude Code versions, causing unnecessary user intervention. Tracked upstream as `anthropics/claude-code#24181`.

### 14. Update Command Respects Local vs Global Install

| Field | Value |
|-------|-------|
| **Commit** | `8384575` |
| **Files** | `commands/gsd/update.md` |
| **Priority** | MEDIUM |
| **Applies to fork** | YES -- but our update.md already has branding changes |
| **Conflict risk** | MEDIUM -- our update.md uses `get-shit-done-reflect-cc` |

**What it does:** The update command was hardcoded to `--global`, converting local installations to global during updates. Now detects install type and uses appropriate flag.

### 15. Preserve Local Patches Across GSD Updates

| Field | Value |
|-------|-------|
| **Commit** | `ca03a06` |
| **Files** | `bin/install.js`, `commands/gsd/reapply-patches.md`, `get-shit-done/workflows/update.md` |
| **Priority** | MEDIUM |
| **Applies to fork** | HIGHLY RELEVANT -- we are a fork that patches upstream files |
| **Conflict risk** | MEDIUM -- touches install.js |

**What it does:** When users modify GSD workflow files, those changes get wiped on every `/gsd:update`. This adds: (1) SHA256 manifest of installed files (`gsd-file-manifest.json`), (2) before update, detects user modifications and backs them up to `gsd-local-patches/`, (3) new `/gsd:reapply-patches` command for guided merge.

**Why should-adopt:** This is directly relevant to our fork's use case. Our users' local modifications survive updates. Also useful for our own development -- understanding which upstream files users have modified.

### 16. --auto Flag for Unattended Project Initialization

| Field | Value |
|-------|-------|
| **Commit** | `7f49083` |
| **Files** | `commands/gsd/new-project.md`, `get-shit-done/workflows/new-project.md` |
| **Priority** | LOW-MEDIUM |
| **Applies to fork** | YES |

**What it does:** Runs research, requirements, and roadmap automatically after config questions. Requires idea document via `@` reference. Auto-includes table stakes features.

**Why should-adopt:** Useful for experienced users who don't want interactive prompting. Nice-to-have, not essential.

### 17. --include Flag for Eliminating Redundant File Reads

| Field | Value |
|-------|-------|
| **Commit** | `fa81821` |
| **Files** | `get-shit-done/bin/gsd-tools.js`, `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/execute-plan.md`, `get-shit-done/workflows/plan-phase.md`, `get-shit-done/workflows/progress.md` |
| **Priority** | MEDIUM |
| **Applies to fork** | YES |
| **Note** | Partially reverted by `01c9115` which changed from content-inlining to path-passing |

**What it does:** Init commands return all context a workflow needs in one call, replacing 6+ separate `cat` calls. Saves 5,000-10,000 tokens per plan-phase execution.

**Important:** The initial implementation caused context bloat (inlined file contents in orchestrator). Commit `01c9115` fixed this by passing paths instead. Both commits should be adopted together.

### 18. Brave Search Integration for Researchers

| Field | Value |
|-------|-------|
| **Commit** | `60ccba9` |
| **Files** | `agents/gsd-phase-researcher.md`, `agents/gsd-project-researcher.md`, `get-shit-done/bin/gsd-tools.js` |
| **Priority** | LOW |
| **Applies to fork** | YES, if user has BRAVE_API_KEY |

**What it does:** Adds Brave Search API as an alternative to built-in WebSearch. Detects API key from env var or `~/.gsd/brave_api_key`. Persists setting to config. Graceful degradation when unavailable.

**Why should-adopt:** Provides better search results for technical queries. Low cost to adopt -- gracefully falls back to existing WebSearch.

---

## Evaluate: Architectural Changes Needing Deeper Analysis

These changes are large or structural. They provide value but require careful integration planning.

### 19. gsd-tools.js CLI (THE BIG ONE)

| Field | Value |
|-------|-------|
| **Commits** | `01ae939`, `246d542`, `1b317de`, `6c53737`, `36f5bb3`, `6a2d1f1`, `767bef6`, `60ccba9` (8 commits) |
| **Files** | `get-shit-done/bin/gsd-tools.js` (4,597 lines), `get-shit-done/bin/gsd-tools.test.js` (2,033 lines) |
| **Priority** | ARCHITECTURAL DECISION -- everything else depends on this |
| **Applies to fork** | YES -- this file did not exist at our fork point |
| **Conflict risk** | NONE for the file itself (new), but HIGH for all downstream files that now reference it |

**What it is:** A comprehensive Node.js CLI that replaces repetitive bash patterns across the entire GSD system. Contains:
- State management: `state load`, `state get`, `state patch`, `state advance-plan`, `state update-progress`, `state record-metric`, `state add-decision`, `state record-session`
- Init commands: `init execute-phase`, `init plan-phase`, `init new-project`, `init new-milestone`, `init quick`, etc. (10+ compound init commands)
- Phase operations: `phases list`, `phase add`, `phase insert`, `phase remove`, `phase complete`, `phase next-decimal`
- Roadmap operations: `roadmap get-phase`, `roadmap analyze`
- Parsing: `phase-plan-index`, `state-snapshot`, `summary-extract`, `history-digest`
- Templates: `template fill summary/plan/verification`
- Verification: `verify plan-structure/phase-completeness/references/commits/artifacts/key-links`
- Frontmatter: `frontmatter get/set/merge/validate`
- Git: `commit` (with commit_docs check built in), `commit --amend`
- Config: `config-set` (for nested config values)
- Brave Search: `websearch` (with API key management)
- Utilities: `resolve-model`, `find-phase`, `generate-slug`, `current-timestamp`, `list-todos`, `verify-path-exists`, `scaffold`, `progress`, `milestone complete`, `validate consistency`, `todo complete`

**Why it matters:** This is the foundation of upstream's v1.12-v1.18 architecture. Almost every other change depends on it. Every agent, command, and workflow file now calls `gsd-tools.js` instead of inline bash.

**Adoption strategy options:**
1. **Full adoption** -- Take gsd-tools.js as-is, then layer our fork's additions on top. Cleanest long-term, largest short-term effort.
2. **Selective adoption** -- Only take gsd-tools.js commands that bug fixes depend on (commit, config-set). Smaller effort, but creates drift.
3. **Full adoption + fork extensions** -- Take it all, then add our fork's commands (signals, KB ops, reflection triggers) as new gsd-tools.js commands. Best of both worlds.

**Recommendation:** Option 3. gsd-tools.js is the right architectural direction. Fighting it means every future upstream sync is painful. Our fork's additions (signals, KB, spikes, reflection) should become gsd-tools.js commands too.

### 20. Thin Orchestrator Refactoring

| Field | Value |
|-------|-------|
| **Commits** | `d44c7dc`, `d2623e0`, `8f26bfa` |
| **Files** | 44 files changed (every agent, every command, most workflows) |
| **Priority** | ARCHITECTURAL -- bundled with gsd-tools adoption |
| **Conflict risk** | HIGH for overlapping files |

**What it does:** Commands become thin orchestrators that delegate to workflows, which delegate to gsd-tools. Token savings: ~22k chars (75.6% reduction in affected sections). Pattern:

```
Command (thin: parse args, load config)
  --> Workflow (orchestration logic, agent spawning)
    --> gsd-tools.js (deterministic operations)
```

**Why evaluate:** This touches every file that both upstream and our fork modify. The architectural pattern is sound (deterministic operations should not burn LLM tokens), but the merge is the single largest piece of work in the sync.

**Impact on fork files:**
- `agents/gsd-executor.md` -- upstream heavily modified; our `.claude/agents/gsd-executor.md` is separate
- `agents/gsd-debugger.md` -- same situation
- `agents/gsd-phase-researcher.md` -- same
- `agents/gsd-planner.md` -- same
- `commands/gsd/help.md` -- our fork has branding additions; upstream completely restructured
- `commands/gsd/update.md` -- our fork has package name changes; upstream restructured
- `commands/gsd/new-project.md` -- our fork added content; upstream completely restructured
- `bin/install.js` -- our fork has branding; upstream has major changes (patch preservation, JSONC parsing, etc.)

### 21. Frontmatter CRUD, Verification Suite, Template Fill, State Progression

| Field | Value |
|-------|-------|
| **Commit** | `6a2d1f1` |
| **Files** | `agents/gsd-executor.md`, `agents/gsd-plan-checker.md`, `agents/gsd-planner.md`, `agents/gsd-verifier.md`, `get-shit-done/bin/gsd-tools.js`, `get-shit-done/workflows/execute-plan.md`, `get-shit-done/workflows/verify-phase.md` |
| **Priority** | MEDIUM-HIGH |

**What it does:** Delegates deterministic document operations from AI agents to code: safe YAML frontmatter manipulation, structural verification checks, pre-filled document templates, automated STATE.md arithmetic. 1,037 new lines in gsd-tools.js.

**Why evaluate:** These replace manual agent operations that were error-prone. Verification suite is particularly valuable -- agents previously burned context on structural checks. But this is deeply integrated with the gsd-tools architecture.

### 22. Context-Optimizing Parsing Commands

| Field | Value |
|-------|-------|
| **Commit** | `6c53737` |
| **Files** | `get-shit-done/bin/gsd-tools.js`, workflows |
| **Priority** | MEDIUM |

**What it does:** Three new commands that return parsed structured data instead of raw file content: `phase-plan-index`, `state-snapshot`, `summary-extract`. Reduces context usage by returning only the fields agents actually need.

---

## Skip: Do Not Adopt

Changes that are community-specific, already handled by our fork, or would conflict.

### 23. GSD Memory System (Added then Reverted)

| Field | Value |
|-------|-------|
| **Commits** | `af7a057` (added), `cc3c6ac` (reverted) |
| **Why skip** | Net-zero change. Added then removed. Our fork has its own knowledge system that is more mature. |

### 24. Community GitHub Infrastructure

| Field | Value |
|-------|-------|
| **Commits** | `b85247a` (auto-label issues), `392742e` (SECURITY.md), `279f3bc` (feature request template), `a4626b5` (bug report template), `f7511db` (CODEOWNERS for @glittercowboy) |
| **Why skip** | Upstream community management files. Our fork has its own GitHub infrastructure (.github/workflows/ci.yml, publish.yml, smoke-test.yml). The CODEOWNERS file specifically names the upstream maintainer. |

**Exception:** SECURITY.md could be adopted with our fork's contact info if we want a security policy.

### 25. README Badge Changes

| Field | Value |
|-------|-------|
| **Commits** | `90f1f66`, `d80e4ef`, `19568d6`, `8d2651d` |
| **Why skip** | Upstream-specific: Discord badges, X/Twitter badges, Dexscreener $GSD token badge, broken gemini link removal. Our fork has its own README. |

### 26. Changelog/Version Bump Commits

| Field | Value |
|-------|-------|
| **Commits** | `7c42763`, `75fb063`, `ddc736e`, `e92e64c`, `3e3f81e`, `64373a8`, `c9aea44`, `ecba990`, `1fbffcf`, `9ad7903`, `63d99df`, `ea0204b`, `2a4e0b1`, `06399ec`, `5a2f5fa`, `9adb09f`, `fac1217`, `cbb4aa1` |
| **Why skip** | Version bumps and changelog entries for upstream releases. Our fork maintains its own versioning and changelog. |

### 27. Removed Files (CONTRIBUTING.md, GSD-STYLE.md, MAINTAINERS.md, old planning files)

| Field | Value |
|-------|-------|
| **Commits** | `3f5ab10`, `a52248c`, `56b487a` |
| **Why skip** | Cleanup of files that either don't exist in our fork or are fork-specific. We have our own CONTRIBUTING.md if needed. |

### 28. Windows-Specific Fixes

| Field | Value |
|-------|-------|
| **Commits** | `1344bd8` (detached:true for SessionStart hook), `ced41d7` (HEREDOC to literal newlines), `1c6a35f` (normalize backslashes in gsd-tools paths), `dac502f` (Windows gsd-tools merge) |
| **Why skip for now** | Our fork targets macOS/Linux (darwin platform per environment). These are good fixes that do no harm, but they are low priority for our users. |

**Revisit if:** We receive Windows user reports or want to expand platform support.

---

## Feature Dependencies

```
gsd-tools.js (FOUNDATION - everything below depends on this)
  |
  +--> Thin orchestrator refactoring (all commands/workflows restructured)
  |      |
  |      +--> --include flag optimization (uses init commands)
  |      +--> commit_docs fix routing through gsd-tools.js commit
  |      +--> Research decision persistence (uses config-set command)
  |      +--> Brave Search integration (uses websearch command)
  |
  +--> Frontmatter CRUD / verification suite
  +--> Context-optimizing parsing commands
  +--> Deterministic workflow delegation

Bug fixes (can be adopted independently):
  executor completion verification (additive, no gsd-tools dependency)
  context fidelity enforcement (additive, no gsd-tools dependency)
  parallelization config respect (additive, no gsd-tools dependency)
  researcher always writes RESEARCH.md (additive, no gsd-tools dependency)
  auto-create config.json (additive, no gsd-tools dependency)
  statusline crash handling (additive, no gsd-tools dependency)
  API key prevention (additive, no gsd-tools dependency)
  classifyHandoffIfNeeded workaround (additive, no gsd-tools dependency)
  subagent_type specification (additive, no gsd-tools dependency)

Bug fixes that DEPEND on gsd-tools.js:
  commit_docs=false in all paths (routes through gsd-tools.js commit)
  persist research decision (uses gsd-tools.js config-set)
```

---

## Overlap Analysis: Fork Files vs Upstream Changes

### Files Our Fork Modified (from fork point)

| File | Our Changes | Upstream Changes | Conflict Risk |
|------|-------------|-----------------|---------------|
| `bin/install.js` | Branding (banner, package name, help text, version-check hook) | Patch preservation, JSONC parsing, hex validation, statusline reference, Windows path normalization | **HIGH** -- both modified extensively, different areas but same file |
| `commands/gsd/help.md` | Added GSD Reflect commands section, package name | Complete restructuring to thin orchestrator | **HIGH** -- upstream rewrote the file |
| `commands/gsd/update.md` | Package name changes (`get-shit-done-reflect-cc`) | Local vs global detection, thin orchestrator restructuring | **HIGH** -- both modified same sections |
| `commands/gsd/new-project.md` | Minor additions | Complete restructuring to thin orchestrator | **MEDIUM** -- upstream rewrote, our changes are small |
| `get-shit-done/references/planning-config.md` | Added fork-specific config fields | Updated for gsd-tools CLI patterns | **LOW** -- different sections |
| `get-shit-done/templates/config.json` | Added health_check, devops sections | No upstream changes to this file | **NONE** |
| `get-shit-done/templates/research.md` | No changes | Added user_constraints section | **NONE** -- clean upstream merge |
| `hooks/gsd-check-update.js` | No changes from fork | Added `detached: true` for Windows | **NONE** |

### Files Only Our Fork Has (no upstream equivalent)

These are safe -- no conflict possible:
- `.claude/agents/gsd-reflector.md`
- `.claude/agents/gsd-signal-collector.md`
- `.claude/agents/gsd-spike-runner.md`
- `.claude/agents/knowledge-store.md`
- `.claude/commands/gsd/reflect.md`
- `.claude/commands/gsd/spike.md`
- `commands/gsd/collect-signals.md`
- `commands/gsd/health-check.md`
- `commands/gsd/signal.md`
- `commands/gsd/upgrade-project.md`
- `get-shit-done/references/devops-detection.md`
- `get-shit-done/references/health-check.md`
- `get-shit-done/references/knowledge-surfacing.md`
- `get-shit-done/references/milestone-reflection.md`
- `get-shit-done/references/reflection-patterns.md`
- `get-shit-done/references/signal-detection.md`
- `get-shit-done/references/spike-execution.md`
- `get-shit-done/references/spike-integration.md`
- `get-shit-done/references/version-migration.md`
- `get-shit-done/workflows/collect-signals.md`
- `get-shit-done/workflows/health-check.md`
- `get-shit-done/workflows/reflect.md`
- `get-shit-done/workflows/run-spike.md`
- `hooks/gsd-version-check.js`
- All test files in `tests/`

### Files Only Upstream Has (new since fork point)

These can be adopted cleanly:
- `get-shit-done/bin/gsd-tools.js` (NEW -- 4,597 lines)
- `get-shit-done/bin/gsd-tools.test.js` (NEW -- 2,033 lines)
- `commands/gsd/reapply-patches.md` (NEW)
- `get-shit-done/workflows/add-phase.md` (NEW)
- `get-shit-done/workflows/add-todo.md` (NEW)
- `get-shit-done/workflows/audit-milestone.md` (NEW)
- `get-shit-done/workflows/check-todos.md` (NEW)
- `get-shit-done/workflows/help.md` (NEW)
- `get-shit-done/workflows/insert-phase.md` (NEW)
- `get-shit-done/workflows/new-milestone.md` (NEW)
- `get-shit-done/workflows/new-project.md` (NEW)
- `get-shit-done/workflows/pause-work.md` (NEW)
- `get-shit-done/workflows/plan-milestone-gaps.md` (NEW)
- `get-shit-done/workflows/plan-phase.md` (NEW)
- `get-shit-done/workflows/progress.md` (NEW)
- `get-shit-done/workflows/quick.md` (NEW)
- `get-shit-done/workflows/remove-phase.md` (NEW)
- `get-shit-done/workflows/research-phase.md` (NEW)
- `get-shit-done/workflows/set-profile.md` (NEW)
- `get-shit-done/workflows/settings.md` (NEW)
- `get-shit-done/workflows/update.md` (NEW)
- `get-shit-done/templates/summary-complex.md` (NEW)
- `get-shit-done/templates/summary-minimal.md` (NEW)
- `get-shit-done/templates/summary-standard.md` (NEW)
- `get-shit-done/references/decimal-phase-calculation.md` (NEW)
- `get-shit-done/references/git-planning-commit.md` (NEW)
- `get-shit-done/references/model-profile-resolution.md` (NEW)
- `get-shit-done/references/phase-argument-parsing.md` (NEW)
- `SECURITY.md` (NEW)

---

## Recommended Adoption Order

### Wave 1: Independent Bug Fixes (no gsd-tools dependency)

Apply these cherry-picks or manual patches first. They are additive and have no dependencies:

1. `f380275` -- Executor completion verification
2. `ecbc692` -- Context fidelity enforcement in planning
3. `4267c6c` -- Respect parallelization config
4. `161aa61` -- Researcher always writes RESEARCH.md
5. `4dff989` -- Auto-create config.json when missing
6. `4072fd2` -- classifyHandoffIfNeeded workaround
7. `4249506` -- Executor subagent_type specification
8. `f53011c` -- API key prevention in map-codebase

**Estimated effort:** MEDIUM -- these are surgical additions to existing files, but must be applied to our fork's file versions (not clean cherry-picks since upstream context differs).

### Wave 2: gsd-tools.js Foundation

Adopt the complete gsd-tools.js and its test suite:

1. `01ae939` -- Initial gsd-tools.js CLI
2. `246d542` -- Compound init commands
3. `1b317de` -- Repetitive bash pattern extraction (phases, roadmap, phase next-decimal)
4. `6c53737` -- Context-optimizing parsing commands
5. `36f5bb3` -- Deterministic workflow delegation (phase add/insert/remove/complete, etc.)
6. `6a2d1f1` -- Frontmatter CRUD, verification suite, template fill, state progression
7. `767bef6` -- Config-set command + research decision persistence
8. `60ccba9` -- Brave Search integration
9. `01c9115` -- commit_docs fix routing through gsd-tools.js

**Estimated effort:** LOW for the file itself (it's new, no conflicts), HIGH for wiring into existing files.

### Wave 3: Thin Orchestrator Migration

Apply the full command/workflow restructuring:

1. `d2623e0` + `8f26bfa` -- Extract first batch of thin orchestrators
2. `d44c7dc` -- Update all remaining commands/workflows/agents for gsd-tools integration

**This is the hard part.** Our fork's modifications to `commands/gsd/help.md`, `commands/gsd/update.md`, `commands/gsd/new-project.md`, and `bin/install.js` must be reconciled with upstream's complete restructuring.

**Estimated effort:** HIGH -- requires file-by-file merge for overlapping files.

### Wave 4: Feature Additions

After the architecture is aligned:

1. `fa81821` + `01c9115` -- --include flag (with the context bloat fix)
2. `7f49083` -- --auto flag for new-project
3. `ca03a06` -- Preserve local patches across updates
4. `9d7ea9c` -- Statusline crash handling + hex validation + git staging fix
5. `074b2bc` -- Statusline reference update during install
6. `6cf4a4e` -- JSONC parsing in installer
7. `8384575` -- Local vs global install detection

### Wave 5: Fork-Specific Rebranding

After upstream alignment, reapply our fork-specific changes:

1. Reinstall.js branding (banner, package name, help text)
2. Re-add version-check hook registration
3. Re-add GSD Reflect commands to help.md
4. Re-add package name changes in update.md
5. Verify all fork-only features (signals, KB, reflection, spikes) still work

---

## Commit-by-Commit Reference Table

| Commit | Category | Priority | Description | Dependencies |
|--------|----------|----------|-------------|--------------|
| `f380275` | Must adopt | CRITICAL | Executor completion verification | None |
| `ecbc692` | Must adopt | CRITICAL | Context fidelity in planning | None |
| `4267c6c` | Must adopt | HIGH | Respect parallelization config | None |
| `161aa61` | Must adopt | HIGH | Researcher always writes RESEARCH.md | None |
| `01c9115` | Must adopt | HIGH | commit_docs=false in all paths | gsd-tools.js |
| `4dff989` | Must adopt | MEDIUM | Auto-create config.json | None |
| `9d7ea9c` | Must adopt | MEDIUM | Statusline crash handling | None |
| `074b2bc` | Must adopt | MEDIUM | Statusline reference update | None |
| `f53011c` | Must adopt | MEDIUM | API key prevention | None |
| `767bef6` | Must adopt | MEDIUM | Persist research decision | gsd-tools.js |
| `6cf4a4e` | Must adopt | MEDIUM | JSONC parsing in installer | None |
| `4249506` | Should adopt | HIGH | Executor subagent_type | None |
| `4072fd2` | Should adopt | HIGH | classifyHandoffIfNeeded workaround | None |
| `8384575` | Should adopt | MEDIUM | Local vs global install | None |
| `ca03a06` | Should adopt | MEDIUM | Preserve local patches | None |
| `7f49083` | Should adopt | LOW-MED | --auto flag | gsd-tools.js |
| `fa81821` | Should adopt | MEDIUM | --include flag | gsd-tools.js |
| `60ccba9` | Should adopt | LOW | Brave Search integration | gsd-tools.js |
| `01ae939` | Evaluate | ARCH | gsd-tools.js foundation | None (new file) |
| `246d542` | Evaluate | ARCH | Compound init commands | gsd-tools.js |
| `1b317de` | Evaluate | ARCH | Bash pattern extraction | gsd-tools.js |
| `6c53737` | Evaluate | ARCH | Context-optimizing parsing | gsd-tools.js |
| `36f5bb3` | Evaluate | ARCH | Deterministic delegation | gsd-tools.js |
| `6a2d1f1` | Evaluate | ARCH | Frontmatter/verification/templates | gsd-tools.js |
| `d44c7dc` | Evaluate | ARCH | Full thin orchestrator migration | gsd-tools.js + init commands |
| `d2623e0` | Evaluate | ARCH | Thin orchestrators batch 1 | gsd-tools.js |
| `8f26bfa` | Evaluate | ARCH | Thin orchestrators batch 2 | gsd-tools.js |
| `af7a057` | Skip | - | GSD Memory (reverted) | - |
| `cc3c6ac` | Skip | - | Revert GSD Memory | - |
| `b85247a` | Skip | - | Auto-label issues | - |
| `392742e` | Skip | - | SECURITY.md | - |
| `279f3bc` | Skip | - | Feature request template | - |
| `a4626b5` | Skip | - | Bug report template | - |
| `f7511db` | Skip | - | CODEOWNERS | - |
| `90f1f66` | Skip | - | Discord badge | - |
| `d80e4ef` | Skip | - | X/Dexscreener badges | - |
| `19568d6` | Skip | - | @latest in install commands | - |
| `8d2651d` | Skip | - | Remove broken gemini link | - |
| `3f5ab10` | Skip | - | Remove CONTRIBUTING/GSD-STYLE | - |
| `a52248c` | Skip | - | Remove planning files | - |
| `56b487a` | Skip | - | Tidy up old files | - |
| `1344bd8` | Skip (for now) | - | Windows detached:true | - |
| `ced41d7` | Skip (for now) | - | Windows HEREDOC fix | - |
| `1c6a35f` | Skip (for now) | - | Windows backslash normalization | - |
| Version bumps | Skip | - | 18 changelog/version commits | - |

---

## Sources

All analysis based on direct examination of:
- `git log --oneline 2347fca..upstream/main` (70 commits)
- `git diff --stat` for each significant commit
- `git diff` (full diff) for all commits categorized as must-adopt or should-adopt
- `git diff HEAD upstream/main --name-only` for overlap analysis
- `git diff 2347fca..HEAD --name-only` for fork modification tracking
- Commit messages and linked issue numbers for context

Confidence: HIGH -- all findings are from direct code examination, not external sources.
