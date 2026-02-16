# Pitfalls Research: Multi-Runtime CLI Interop

**Domain:** Adding cross-runtime interop (Codex CLI), shared KB migration, runtime-agnostic state to existing multi-runtime CLI workflow tool
**Researched:** 2026-02-11
**Confidence:** HIGH (grounded in actual codebase analysis of 313 hardcoded path references, 4 runtime installer architectures, and verified Codex CLI documentation)

---

## Critical Pitfalls

### Pitfall 1: The 313 Hardcoded Path Pandemic

**What goes wrong:**
The codebase has 313 references to `~/.claude/` across 82+ files (76 in commands, 39 in agents, 198 in get-shit-done/). The current installer handles this with a simple regex replacement (`/~\/\.claude\//g` -> pathPrefix) at installation time. But this approach has three fatal flaws when adding a 4th runtime and migrating KB to `~/.gsd/knowledge/`:

1. **Split-path problem:** After migration, some paths must become `~/.gsd/knowledge/` (KB) while others must become `~/.codex/` or `~/.config/opencode/` (runtime config). A single regex replacement cannot distinguish between `~/.claude/gsd-knowledge/` (should become `~/.gsd/knowledge/`) and `~/.claude/get-shit-done/` (should become runtime-specific path). The current architecture assumes ALL `~/.claude/` references resolve to the same base directory.

2. **Content vs. path confusion:** Files like `knowledge-surfacing.md` contain both instructional text referencing `~/.claude/gsd-knowledge/` as documentation AND functional path references that agents execute via `cat ~/.claude/gsd-knowledge/index.md`. The regex replaces both identically, but after migration they should point to different locations.

3. **Cascading breakage:** The 276 references to `gsd-knowledge` across 62 files currently assume the KB lives under the runtime config directory. Moving it to `~/.gsd/knowledge/` means every single reference must be audited: is this a path agents execute, documentation text, or a conceptual reference?

**Why it happens:**
The original design embedded the KB under the Claude config directory (`~/.claude/gsd-knowledge/`) because Claude Code was the only runtime. When OpenCode and Gemini support was added, the installer's path replacement handled it because the KB location simply tracked the runtime directory. Moving KB to a shared location breaks this 1:1 mapping.

**How to avoid:**
- Introduce a TWO-PATH replacement system in the installer: `RUNTIME_DIR` (runtime-specific config) and `SHARED_DIR` (shared `~/.gsd/` resources)
- Before migration, audit all 276 `gsd-knowledge` references and classify each as: (a) agent-executable path, (b) documentation/example, (c) conceptual reference
- Use a distinct path token in source files: `~/.claude/gsd-knowledge/` for KB references vs `~/.claude/get-shit-done/` for runtime references, so the installer can apply different replacements
- Write a validation test that verifies no `~/.claude/gsd-knowledge/` references survive after installation for any runtime

**Warning signs:**
- After install for Codex, agents still reference `~/.codex/gsd-knowledge/` (KB path was replaced to follow the runtime dir, not the shared dir)
- After install for OpenCode, KB queries return empty because they check `~/.config/opencode/gsd-knowledge/` which does not exist
- Knowledge surfacing stops working for any non-Claude runtime
- Running `grep -r 'gsd-knowledge' ~/.codex/` after install shows paths pointing to the wrong location

**Phase to address:**
Must be the FIRST phase -- create the path abstraction layer before touching any KB migration or Codex CLI integration. Every subsequent phase depends on paths resolving correctly.

---

### Pitfall 2: The KB Migration Data Loss Window

**What goes wrong:**
Migrating from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` requires moving files from one location to another. During the migration window:

1. **Race condition with running agents:** If a GSD agent is actively writing a signal to `~/.claude/gsd-knowledge/signals/my-project/` while the migration script is moving files to `~/.gsd/knowledge/signals/my-project/`, the signal either gets written to the old location (orphaned) or fails because the directory was already moved.

2. **Index invalidation:** The KB `index.md` contains absolute-ish paths (`signals/{project}/filename.md`). The index is rebuilt by scanning directories. During migration, a partial scan (some files in old location, some in new) produces a corrupt index missing entries.

3. **Atomic rename impossibility:** `fs.rename()` only works within the same filesystem. If `~/.claude/` and `~/.gsd/` are on different partitions (rare but possible, especially with custom `CLAUDE_CONFIG_DIR`), the migration requires copy-then-delete, which is not atomic and creates a window where data exists in both places or neither.

4. **Rollback complexity:** If the user upgrades GSD, the migration runs, then they downgrade back to the previous version, the old version looks for KB in `~/.claude/gsd-knowledge/` and finds nothing. There is no rollback path built into the current system.

**Why it happens:**
File-based knowledge stores with cross-directory migration have inherently weaker atomicity guarantees than database migrations. The lack of a single transaction boundary means partial failures leave inconsistent state.

**How to avoid:**
- **Symlink bridge:** After moving files to `~/.gsd/knowledge/`, create a symlink from `~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/`. This provides backward compatibility -- old agents and old versions of GSD still find the KB at the old path. The symlink costs nothing and eliminates the rollback problem entirely.
- **Copy-then-symlink, never move-then-pray:** Copy all files to new location, verify copy integrity (file count + checksum), create symlink at old location pointing to new location, then (optionally) remove the copy at old location in a later release.
- **Lock file during migration:** Write `~/.gsd/knowledge/.migrating` during the migration process. Agents check for this file and wait/retry if present.
- **Index rebuild after migration:** Always rebuild index.md from scratch after migration completes, never try to update paths in the existing index.

**Warning signs:**
- `index.md` shows fewer entries after migration than before
- Signals written during migration appear in `~/.claude/gsd-knowledge/` instead of `~/.gsd/knowledge/`
- Users who downgrade report "knowledge base empty"
- `ls -la ~/.claude/gsd-knowledge` shows a broken symlink after migration failure

**Phase to address:**
KB migration phase -- must happen AFTER the path abstraction layer is in place and BEFORE Codex CLI integration (Codex needs to find KB at the shared path from day one).

---

### Pitfall 3: The Codex CLI Impedance Mismatch

**What goes wrong:**
Codex CLI has a fundamentally different architecture from Claude Code, OpenCode, and Gemini CLI. The existing three runtimes all share a common pattern: slash commands are Markdown files installed to a config directory, read by the runtime at invocation time. Codex CLI breaks this pattern in multiple ways:

1. **No direct slash command equivalent:** Codex CLI uses `AGENTS.md` for project-level instructions (read at session start, not invoked on-demand) and `SKILL.md` directories for task-specific capabilities. There is no Codex equivalent of putting a Markdown file in `~/.codex/commands/gsd/new-project.md` and having it show up as `/gsd:new-project`.

2. **Config format mismatch:** Codex uses TOML (`~/.codex/config.toml`), not JSON. The settings.json hook registration pattern used for Claude Code and the opencode.json permission pattern for OpenCode have no Codex equivalent.

3. **Tool name divergence:** Codex CLI does not expose named tools like `Read`, `Write`, `Bash`, `Glob`, `Grep` the way Claude Code does. Codex has a shell execution sandbox with approval policies, not a discrete tool-by-tool permission model. The `allowed-tools:` frontmatter section that GSD uses to restrict agent capabilities has no Codex counterpart.

4. **AGENTS.md vs. commands/agents architecture:** Codex reads `AGENTS.md` at session start with a byte limit (`project_doc_max_bytes` = 32KB default). GSD's entire agent system (12+ agents, 780+ lines each) cannot fit in 32KB. The GSD architecture of spawning specialized subagents via Task tool has no direct Codex equivalent.

**Why it happens:**
GSD was designed for Claude Code's architecture (slash commands, Task tool spawning, named tool permissions) and extended to OpenCode/Gemini by converting between formats. Codex CLI represents a genuinely different paradigm (AGENTS.md + Skills + approval-based sandbox) that cannot be bridged by format conversion alone.

**How to avoid:**
- **Do NOT attempt to make GSD commands work as Codex slash commands.** Instead, create a Codex-native integration layer:
  - Use `AGENTS.md` to provide GSD workflow awareness and instructions
  - Use Codex Skills (SKILL.md directories) to package GSD's key operations
  - Use `.codex/config.toml` with MCP server configuration if MCP-based integration is feasible
- **Accept capability gaps.** Codex may support 60-70% of GSD's features initially, not 100%. Features requiring Task tool spawning (parallel research, wave-based execution) may not be possible in Codex's architecture.
- **Design the installer's Codex path separately** from the Claude/OpenCode/Gemini paths. Do not try to reuse `copyWithPathReplacement()` or `convertClaudeToOpencodeFrontmatter()` for Codex -- the transformation is too different.
- **Identify the intersection of capabilities** early: file read/write, bash execution, and markdown processing are common. Build on that common ground.

**Warning signs:**
- Installer produces Codex output that looks like Claude Code commands (Markdown with YAML frontmatter in `~/.codex/commands/gsd/`)
- After install, Codex CLI does not recognize any GSD commands
- AGENTS.md exceeds 32KB and Codex silently truncates it
- GSD workflows reference Task tool which Codex does not have

**Phase to address:**
Codex CLI integration phase -- must come AFTER the runtime abstraction layer is defined, because Codex requires a genuinely different integration approach, not a format conversion.

---

### Pitfall 4: The State File Runtime Leakage

**What goes wrong:**
The `.planning/` directory is supposed to be runtime-agnostic (committed to git, shared across sessions). But state files contain runtime-specific content:

1. **`.continue-here.md` references runtime-specific paths:** The pause-work workflow writes `~/.claude/get-shit-done/bin/gsd-tools.js` directly into handoff files. When a different runtime (Codex, OpenCode) tries to resume from this handoff, the path does not exist.

2. **STATE.md records runtime-specific commands:** "Resume with: `/gsd:execute-phase 3`" -- but OpenCode uses `/gsd-execute-phase 3` and Codex uses a completely different invocation pattern. A user pausing in Claude Code and resuming in Codex sees instructions they cannot follow.

3. **PLAN.md frontmatter contains tool names:** Plans reference tool names like `Read`, `Write`, `Bash` which are Claude Code tool names. When an OpenCode executor reads the plan, it sees tool names it does not recognize. The executor might still work (it interprets semantically) but verification steps like "verify using the Read tool" become confusing.

4. **config.json stores runtime-agnostic settings alongside runtime-dependent behavior:** The `commit_docs` setting and `model_profile` setting are runtime-agnostic. But the config is read by `gsd-tools.js` which lives at a runtime-specific path. If a project is shared between a Claude Code user and a Codex user (via git), the config works for one but the tool path differs.

**Why it happens:**
The `.planning/` directory was designed for single-runtime use. Runtime-specific details leaked into "shared" state because there was no separation between "what the user should do" (runtime-specific) and "what the project state is" (runtime-agnostic).

**How to avoid:**
- **Audit all writes to `.planning/`** for runtime-specific content. Grep for: `~/.claude/`, `~/.config/opencode/`, `~/.gemini/`, `~/.codex/`, `/gsd:`, `/gsd-`, tool name references (`Read`, `Write`, `Bash`, `Glob`, `Grep`)
- **Introduce runtime-neutral command references:** Instead of `/gsd:execute-phase 3`, write `[resume command: execute-phase 3]` and let the resume workflow translate to the current runtime's syntax
- **Separate state from instructions:** `.continue-here.md` should contain WHAT state to restore, not HOW to restore it. The runtime's resume workflow handles the HOW.
- **Use gsd-tools.js path resolution:** Instead of hardcoding `~/.claude/get-shit-done/bin/gsd-tools.js` in state files, the workflow should call gsd-tools at the path appropriate for the CURRENT runtime

**Warning signs:**
- User pauses in Claude Code, switches to Codex, and `/gsd:resume-work` does not exist
- `.continue-here.md` contains paths starting with `~/.claude/` in a project used by multiple runtimes
- STATE.md shows "Last action: /gsd:execute-phase 5" but the current runtime uses different syntax
- Agent reads PLAN.md and tries to use tool names that do not exist in its runtime

**Phase to address:**
State normalization phase -- should happen early (before cross-runtime handoff feature), after the path abstraction layer is in place.

---

### Pitfall 5: The Capability Gap Denial

**What goes wrong:**
The four runtimes have genuinely different capabilities, and pretending they are equivalent causes silent failures:

| Capability | Claude Code | OpenCode | Gemini CLI | Codex CLI |
|-----------|-------------|----------|------------|-----------|
| Task tool (spawn subagent) | Yes | Yes | Auto (agents are tools) | No equivalent |
| Named tool permissions | Yes (allowed-tools) | Yes (permission) | Yes (tools array) | No (sandbox policy) |
| Slash commands | `/gsd:name` | `/gsd-name` | `/gsd:name` | No direct equivalent |
| Session hooks | settings.json hooks | No | No | Notification hooks (different format) |
| Statusline | Yes (statusLine) | No | No | TUI built-in |
| MCP servers | Yes (mcpServers) | Yes | Yes (config) | Yes (config.toml) |
| Web search | WebSearch tool | websearch | google_web_search | Built-in web search |
| File manifest | gsd-file-manifest.json | No | No | No |

When the runtime abstraction layer pretends all runtimes have the same capabilities, it either:
- **Fails silently:** Agent tries to spawn a Task subagent in Codex, nothing happens, the workflow proceeds without parallel execution
- **Crashes loudly:** Agent references a tool name that does not exist, the runtime throws an error mid-execution
- **Degrades invisibly:** Execution works but skips critical steps (verification, knowledge surfacing, signal collection) because the tool needed is not available

**Why it happens:**
The current installer maps tool NAMES between runtimes (e.g., `Read` -> `read_file` for Gemini) but does not handle capability GAPS (e.g., "Task tool does not exist in this runtime"). Name mapping is a bijection problem; capability gaps require graceful degradation logic.

**How to avoid:**
- **Create a runtime capability matrix** (like the table above) and make it a first-class artifact in the codebase. Every feature must declare which capabilities it requires.
- **Design for graceful degradation, not equivalence:** Instead of "convert Task to Codex equivalent," design "if Task unavailable, run sequentially instead of in parallel."
- **Use feature detection, not runtime detection:** Instead of `if (runtime === 'codex') { skip_subagents(); }`, check `if (!has_capability('task_tool')) { run_sequentially(); }`. This future-proofs against capability changes in any runtime.
- **Document degraded behavior explicitly:** Users should know "In Codex CLI, wave-based parallel execution runs sequentially. This is slower but produces identical results."
- **Identify the common subset:** File read/write, bash execution, and markdown processing work everywhere. Build the cross-runtime handoff feature on these universal capabilities.

**Warning signs:**
- Agent specs contain `if runtime == 'codex'` conditional logic scattered across multiple files
- A new runtime (5th, 6th) requires modifying every conditional
- Users report "it works in Claude Code but not in Codex" for features that should be universal
- Test suite only tests Claude Code paths, other runtimes are untested

**Phase to address:**
Runtime abstraction layer phase -- must happen BEFORE Codex integration. Define the capability model, then implement Codex as the first consumer of that model.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Adding Codex as another `if/else` branch in install.js | Quick to implement, familiar pattern | 5th runtime requires modifying 5+ code paths; no plugin architecture; install.js already 1500+ lines | Never -- this is the time to refactor to a runtime plugin model |
| Keeping `~/.claude/gsd-knowledge/` as the canonical KB path with symlinks from other runtimes | Zero migration needed | Every runtime needs its own symlink; path references in docs are confusing; user confusion about "why is my KB under .claude?" | Only as a temporary bridge during migration, not as permanent architecture |
| Hardcoding Codex tool name mappings like the existing `claudeToGeminiTools` object | Fast parity with existing pattern | Codex does not have 1:1 tool name mapping (capability model is different); creates false equivalence | Never -- Codex needs a different integration approach, not a mapping table |
| Skipping KB migration and just making Codex read from `~/.claude/gsd-knowledge/` | Zero migration work | Codex users must have Claude Code installed for KB to exist; violates shared resource principle; confusing UX | Only as v0 proof of concept, must migrate before release |
| Using AGENTS.md as the sole Codex integration point | Simple, single file | 32KB byte limit means most GSD content is truncated; no slash command UX; no progressive loading | As the initial integration, but must evolve to Skills-based approach |

## Integration Gotchas

Common mistakes when connecting runtime-specific systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Codex config.toml | Trying to write settings.json-style hook registration into TOML format | Codex uses `[features]` table and MCP server config, not hook arrays. Use Codex's native config patterns. |
| KB index.md across runtimes | Rebuilding index with paths relative to runtime dir | Use paths relative to KB root (`signals/project/file.md`), let each runtime resolve the KB root independently |
| OpenCode XDG path migration | Assuming `~/.config/opencode/` always exists | Check `OPENCODE_CONFIG_DIR`, `XDG_CONFIG_HOME`, fall back to default. Existing bug: old `~/.opencode/` installations are not migrated. |
| Gemini experimental agents | Assuming Gemini agent registration is stable | Gemini CLI agent support is experimental. Agent format may change. Pin to known-working Gemini CLI version in docs. |
| Codex Skills | Packaging all GSD operations as one mega-skill | Each skill should focus on one job (per Codex docs). Create separate skills for: project-init, plan, execute, resume, debug. |
| Codex AGENTS.md discovery | Putting GSD instructions only in `~/.codex/AGENTS.md` (global) | Project-level `.codex/AGENTS.md` overrides global. GSD should install project-level instructions that reference the global GSD skill set. |
| Cross-runtime resume | Storing runtime-specific tool invocations in .continue-here.md | Store semantic state (phase, task, position, decisions) not procedural commands. Let the resume workflow generate runtime-appropriate commands. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Scanning all KB entries for every agent query | Queries take seconds, not milliseconds; context window fills with index | Progressive disclosure: read index summary first, fetch full entries only for top-5 matches. Already designed this way, but verify Codex respects the pattern. | ~200+ KB entries |
| Installer regex-replacing every .md file on every install | Install takes 30+ seconds; disk I/O spikes | Cache file hashes (gsd-file-manifest.json); only replace files that changed. Upstream already added this -- ensure it works for all 4 runtimes. | ~100+ files across 4 runtimes |
| Loading full STATE.md + ROADMAP.md + PROJECT.md + config.json on resume | Context window consumed by state loading before any useful work begins | Use gsd-tools.js `init resume` to parse state into structured JSON, load only relevant fields. Verify Codex's AGENTS.md byte limit does not conflict. | Projects with 10+ completed phases |
| Full KB index rebuild on every signal write | Write latency increases linearly with KB size | Append-only writes (signal files are immutable). Rebuild index only on explicit command or periodic schedule, not on every write. Already designed this way. | ~500+ KB entries |

## Security Mistakes

Domain-specific security issues for shared cross-runtime resources.

| Mistake | Risk | Prevention |
|---------|------|------------|
| KB at `~/.gsd/knowledge/` readable by any process | Knowledge entries may contain project-specific secrets, API patterns, or vulnerability details | Set `chmod 700 ~/.gsd/` on creation. Verify installer sets correct permissions for the shared directory. |
| Symlink from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` followed by any user | Symlink target can be changed to point elsewhere (symlink attack) | Create symlink with `lchown` to current user. Verify symlink target before reading in agents. Low risk for single-user systems but worth noting. |
| AGENTS.md in project repo containing sensitive GSD configuration | Project-level `.codex/AGENTS.md` is committed to git; may contain team-specific instructions or paths | Never put sensitive configuration in AGENTS.md. Use `~/.codex/config.toml` (user-level, not committed) for API keys and sensitive settings. |
| Cross-runtime state files in `.planning/` containing runtime-specific paths | Leaking `~/.claude/` or `~/.codex/` paths reveals user's home directory structure | Normalize all paths in `.planning/` files to relative references. Never write absolute home directory paths to committed state files. |

## UX Pitfalls

Common user experience mistakes when adding multi-runtime support.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Installer asks "Which runtime?" every time, even for updates | Annoying for users who always use the same runtime | Remember last-used runtime in `~/.gsd/config.json`. Auto-detect installed runtimes and default to the one in use. |
| Different command syntax across runtimes without documentation | User switches from Claude Code to Codex and cannot find commands | Provide runtime-specific quick reference card. Include "Switching runtimes?" section in help output. |
| KB migration runs without warning on update | User loses KB entries if migration fails silently | Show migration preview: "Moving N entries from ~/.claude/gsd-knowledge/ to ~/.gsd/knowledge/. Continue? [Y/n]" |
| Codex integration requires manual AGENTS.md setup | Users must know to create .codex/ directory and write AGENTS.md themselves | Installer should create `.codex/` directory and generate AGENTS.md automatically, just like it creates `.claude/commands/gsd/` for Claude Code. |
| Resume shows instructions for wrong runtime | User pauses in Claude Code, resumes in Codex, sees "/gsd:execute-phase 3" which does not work in Codex | Resume workflow detects current runtime and renders appropriate instructions. Store semantic state, not procedural commands. |
| No indication of degraded features in non-Claude runtimes | User expects parallel execution in Codex, gets sequential without explanation | Display capability notice on first GSD use in each runtime: "Running in Codex CLI. Some features run in sequential mode." |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **KB Migration:** Files are moved but symlink bridge not created -- old GSD versions on same machine cannot find KB
- [ ] **Codex Integration:** AGENTS.md created but Skills not installed -- GSD commands not accessible as Codex skills
- [ ] **Path Abstraction:** Installer replaces paths but agent inline bash still hardcodes `~/.claude/` -- agents fail at runtime, not install time
- [ ] **Cross-Runtime Resume:** .continue-here.md written but contains runtime-specific commands -- resume works in same runtime, fails in different runtime
- [ ] **Capability Gaps:** Tool name mapping done but Task tool spawning not handled -- commands work but subagent-dependent workflows silently skip steps
- [ ] **Index Rebuild:** KB moved but index.md not rebuilt -- agents find index with stale paths, entries appear missing
- [ ] **Test Coverage:** Install test passes for Codex but no integration test for actual Codex CLI execution -- installer works but Codex does not recognize GSD
- [ ] **Config Migration:** `.planning/config.json` updated but `gsd-tools.js` not updated to handle Codex-specific settings -- gsd-tools crashes on Codex-only projects
- [ ] **Concurrent Access:** Single-user tests pass but two agents writing KB simultaneously corrupt entries -- rare in practice but possible during reflection + execution overlap
- [ ] **Rollback Path:** Migration succeeds but no mechanism to revert -- user who downgrades loses all KB access until they re-upgrade

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| P1: Path replacement breaks KB references | MEDIUM | Grep for broken paths across installed files. Run installer with `--force` to re-install all files. Verify with: `grep -r 'gsd-knowledge' ~/.codex/` should show `~/.gsd/knowledge/` paths, not `~/.codex/gsd-knowledge/`. |
| P2: KB migration data loss | HIGH | If symlink bridge was used: data still at old location, just re-run migration. If files were moved without bridge: check git history of `~/.claude/gsd-knowledge/` (if it was ever committed), or check filesystem journal. Worst case: KB entries lost, must be rebuilt from project `.planning/` artifacts. |
| P3: Codex integration not working | LOW | Codex is additive (new runtime). Existing Claude/OpenCode/Gemini installs unaffected. Re-generate Codex integration files by running installer with `--codex`. No data loss risk. |
| P4: State files contain runtime-specific content | MEDIUM | Run a state normalization script that scans `.planning/` for runtime-specific patterns and replaces with neutral references. Commit the normalized state. |
| P5: Capability gap causes silent failure | MEDIUM | Add runtime capability logging to agent output. Review SUMMARY.md files for missing sections (knowledge surfacing, signal collection). Re-run affected phases in a runtime that supports the missing capability. |
| Concurrent KB write corruption | LOW | KB entries are individual files with unique names (type-date-slug). Corruption only affects the index.md, which can be rebuilt from files: `gsd-tools.js rebuild-index`. |
| Installer fails mid-migration | MEDIUM | If symlink bridge pattern used: old location still works, just re-run migration. If not: manually check both locations, consolidate entries, rebuild index. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: 313 hardcoded paths | Phase 1: Path Abstraction Layer | `grep -r '~/.claude/' commands/ agents/ get-shit-done/` returns 0 hits (all replaced with tokens); installer test verifies 4 runtimes resolve correctly |
| P2: KB migration data loss | Phase 2: KB Migration | Before/after entry count matches; symlink at old location resolves correctly; `cat ~/.claude/gsd-knowledge/index.md` and `cat ~/.gsd/knowledge/index.md` show identical content |
| P3: Codex impedance mismatch | Phase 3: Codex Integration | Codex can read AGENTS.md with GSD instructions; at least one GSD skill (e.g., resume-work) invocable from Codex; Codex can read/write `.planning/` files |
| P4: State file runtime leakage | Phase 1: Path Abstraction (state normalization) | `grep -r '~/.claude/' .planning/` returns 0 hits; .continue-here.md contains semantic state only; STATE.md commands are runtime-neutral |
| P5: Capability gap denial | Phase 1: Runtime Abstraction (capability matrix) | Runtime capability matrix exists as code/config; agent specs include capability checks; degraded behavior documented per runtime |
| KB concurrent access | Phase 2: KB Migration | Lock file mechanism exists; write test with simulated concurrent access; index rebuild produces correct results after interrupted write |
| Cross-runtime resume | Phase 4: Cross-Runtime Handoff | Pause in Claude Code, resume in OpenCode -- state fully restored; pause in OpenCode, resume in Codex -- state fully restored with degradation notice |

## Phase Ordering Rationale

Based on pitfall dependencies:

1. **Path Abstraction Layer + Runtime Capability Matrix** (P1, P4, P5) -- Foundation. Everything else depends on paths resolving correctly and capabilities being declared.
2. **KB Migration** (P2) -- Must happen after paths are abstracted. Creates the shared `~/.gsd/` directory structure. Symlink bridge ensures backward compatibility.
3. **Codex CLI Integration** (P3) -- Must happen after path abstraction AND KB migration. Codex is the first consumer of the new shared path model.
4. **Cross-Runtime Handoff** (P4 completion) -- Must happen after Codex integration exists (need a 4th runtime to test handoff). State normalization from Phase 1 provides the foundation.

## Sources

- Direct codebase analysis of `get-shit-done-reflect` repository (primary source for all path counts and architecture findings)
- [Codex CLI Configuration Reference](https://developers.openai.com/codex/config-reference/) -- TOML config format, feature toggles, MCP servers
- [Codex CLI Slash Commands](https://developers.openai.com/codex/cli/slash-commands/) -- Built-in commands, no custom command file format
- [Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/) -- Instruction discovery, 32KB limit, override hierarchy
- [Codex Agent Skills](https://developers.openai.com/codex/skills) -- SKILL.md format, directory structure, progressive disclosure
- [Codex Advanced Configuration](https://developers.openai.com/codex/config-advanced/) -- Profiles, project-level config, MCP servers
- [Codex Basic Configuration](https://developers.openai.com/codex/config-basic/) -- Precedence order, sandbox policies, approval system
- [5 Key Trends Shaping Agentic Development in 2026 (The New Stack)](https://thenewstack.io/5-key-trends-shaping-agentic-development-in-2026/) -- MCP as standard connector layer
- [Node.js File System in Practice (TheLinuxCode)](https://thelinuxcode.com/nodejs-file-system-in-practice-a-production-grade-guide-for-2026/) -- Atomic rename, advisory locking, concurrent access patterns
- [Data Migration Checklist 2025 (Quinnox)](https://www.quinnox.com/blogs/data-migration-checklist/) -- Migration rollback strategies, testing before go-live

---
*Pitfalls research for: multi-runtime CLI interop*
*Researched: 2026-02-11*
