# Changelog

All notable changes to GSD Reflect will be documented in this file.

For upstream GSD changelog, see [GSD Changelog](https://github.com/glittercowboy/get-shit-done/blob/main/CHANGELOG.md).

## [Unreleased]

## [1.17.5] - 2026-03-19

### Fixed
- **Source namespace pollution from QT31**: reverted `gsdr-` prefixes and Codex-specific content incorrectly applied to source `collect-signals.md` — source files must use `gsd-` prefix (installer converts at install time); fixes CI wiring test failure
- **Cross-runtime model profile language** (QT32): source files used Claude-specific model names ("Opus everywhere", "Sonnet for execution"); updated to runtime-agnostic symbolic tier language with per-runtime resolution table

### Added
- **Per-runtime model resolution table** (QT32): `model-profiles.md` now documents how symbolic tiers (`opus`/`sonnet`/`haiku`) resolve per platform — Claude auto-resolves, Codex uses model+reasoning_effort pairs, Gemini uses Auto mode
- **Codex resolution examples** (QT32): `model-profile-resolution.md` includes Codex spawn pattern with `model` and `reasoning_effort` parameters
- **Deliberation**: self-improvement pipeline design concluded (patch traceability, epistemic rigor, per-platform model resolution)

### Changed
- `model-profiles.md`, `model-profile-resolution.md`, `set-profile.md`, `settings.md`, `help.md` updated from Claude-specific to cross-runtime language
- `collect-signals.md` sensor model policy simplified to reference `model-profiles.md` Per-Runtime Resolution table

## [1.17.4] - 2026-03-19

### Fixed
- **Codex AGENTS.md false capability claim** (QT31): "Codex cannot spawn sub-agents" → accurate description of Codex subagent/thread support (stable since v0.115.0, validated by spike 003)
- **Capability matrix Codex task_tool** (QT31): changed from `N` to `Y [2]` with footnote about stable multi-agent support
- **QT29 revert**: restored `description` field in Codex agent TOML — the published JSON Schema (`config.schema.json`) describes `config.toml`, not agent role files; the actual agent role file schema (`RawAgentRoleFileToml` in Codex source) explicitly accepts `description`

### Added
- **Platform change detection script** (QT30): `scripts/detect-platform-changes.sh` with `--upstream` (GSD installer diff) and `--codex-schema` (Codex config schema diff) modes for proactive platform monitoring
- **Platform monitoring reference** (QT30): `references/platform-monitoring.md` documenting the two-layer monitoring strategy and the QT29 false positive lesson
- **Spike 003**: Codex agent integration validated end-to-end — all 20 agent roles load, are discoverable, and spawn correctly as sub-agents via `spawn_agent`/`wait_agent`

### Changed
- Deliberation: platform change monitoring concluded with two-layer strategy (change detection + integration testing)

## [1.17.3] - 2026-03-17

### Added
- **Shared frontmatter helpers** (QT23): `extractFrontmatterAndBody()` and `extractFrontmatterField()` replace 6 ad-hoc parsing sites across all converter functions — aligns with upstream function signatures, reduces code by 18 lines
- **OpenCode `.jsonc` resolution** (QT25): `resolveOpencodeConfigPath()` prefers `opencode.jsonc` when present, fixing upstream issue #1053
- **OpenCode `isAgent` parameter** (QT25): `convertClaudeToOpencodeFrontmatter()` now strips unsupported agent fields (`skills:`, `color:`, `memory:`, `maxTurns:`, `permissionMode:`, `disallowedTools:`) when converting agents
- **OpenCode `subagent_type` remapping** (QT25): `"general-purpose"` → `"general"` for correct sub-agent spawning
- **Shared settings helpers** (QT25): `readSettings()` / `writeSettings()` replace ad-hoc JSON settings I/O throughout installer
- **Codex agent sandbox modes** (QT26): `CODEX_AGENT_SANDBOX` config with per-agent `workspace-write` / `read-only` permissions in generated `.toml` files
- **Codex config.toml agent registration** (QT26): `generateCodexConfigBlock()` registers agents with `[agents.name]` sections and GSD marker for idempotent replacement
- **Codex clean uninstall** (QT26): `stripGsdFromCodexConfig()` removes GSD sections from `config.toml` on uninstall — addresses upstream issue #1037 pattern
- **Codex workflow content conversion** (QT27): `convertClaudeToCodexMarkdown()` converts `/gsdr:` → `$gsdr-` and `$ARGUMENTS` → `{{GSD_ARGS}}` in workflow/reference/template files
- **Cross-runtime parity enforcement test** (QT28): structural test verifying all 4 runtimes get equivalent deployment treatment — agent parity, content quality assertions, `INTENTIONAL_DIVERGENCES` documentation, fails if a new runtime is added without full converter coverage

### Fixed
- **Gemini template escaping** (QT24): `${VAR}` patterns in agent body text (e.g., `${PHASE}`, `${PLAN}`) escaped to `$VAR` — prevents Gemini CLI "Missing required input parameters" error
- **Gemini `skills:` field stripping** (QT24): removes `skills:` from agent frontmatter which caused Gemini CLI validation error
- **Gemini multi-line field handling** (QT24): `inSkippedArrayField` properly skips continuation lines of stripped YAML array fields
- **Gemini workflow TOML gating** (QT27): `copyWithPathReplacement()` `isCommand` flag ensures only commands get TOML conversion — workflow/reference/template files now correctly stay as `.md`

### Changed
- `copyWithPathReplacement()` upgraded with `isCommand` and `isGlobal` parameters matching upstream signature
- 66 new tests added across QT23-28 (284 → 350 total)

## [1.17.2] - 2026-03-17

### Fixed
- **Codex agent TOML generation** (Issue #15): Added `convertClaudeToCodexAgentToml()` using TOML literal multi-line strings (`'''`) that preserve backslash patterns in bash/regex content verbatim — fixes all GSD agent invocations failing on Codex with TOML parse errors
- Codex install now generates individual agent `.toml` files alongside existing `AGENTS.md` summary (previously relied on Codex CLI's broken `"""` string generation)

### Added
- Agent parity test: Codex agents now included in cross-runtime name parity assertions
- 6 unit tests for `convertClaudeToCodexAgentToml()` covering backslash preservation, edge cases, and real agent content
- Integration test verifying Codex agent TOML files use literal strings (`'''`) not basic strings (`"""`)
- Deliberation: cross-platform deployment parity analysis for v1.17.3 prep (identifies Gemini, OpenCode, and Codex converter gaps vs upstream)

## [1.17.1] - 2026-03-09

### Fixed
- Hook installer now applies full content transformation to hook files: added `/gsd:` → `/gsdr:` command prefix transform and `'get-shit-done'` → `'get-shit-done-reflect'` quoted path.join argument transform — fixes installed hooks reading wrong VERSION file paths and showing wrong update command in statusline

## [1.17.0] - 2026-03-09

### Added
- **Automation framework** (Phase 37): `resolve-level` and `track-event` subcommands with manifest-driven config detection, `FEATURE_CAPABILITY_MAP`, resolution chain (override → deferral → runtime cap), per-feature statistics tracking, and automation level statusline indicator
- **Extensible sensor architecture** (Phase 38): file-system-based sensor discovery, sensor contract (`input`/`output`/`timeout` via frontmatter), config_schema support, `.claude/agents/` primary with `agents/` fallback for dev environments
- **Project-local knowledge base** (Phase 38.1): `.planning/knowledge/` primary with `~/.gsd/knowledge/` fallback, `kb-rebuild-index.sh` for project-local index, signal schema enrichment fields for cross-project readiness, lessons deprecated in favor of 3-type KB (signals, reflections, spikes)
- **CI sensor** (Phase 39): `gsdr-ci-sensor` agent spec with `gh` CLI integration, SessionStart hook for CI status caching (background spawn, 1hr staleness), statusline CI indicator, pre-flight degraded mode
- **Signal collection automation** (Phase 40): lock stale detection via file mtime, postlude-based triggering in execute-phase workflow
- **Health score system** (Phase 41): two-dimensional scoring model (`health-scoring.md`), 6 infrastructure probes, `health-probe` subcommand with signal-metrics/signal-density/automation-watchdog, SessionStart health check hook with traffic light statusline indicator, rogue-files probe with pattern registry, rogue-context agent probe
- **Reflection automation** (Phase 42): `reflection-counter` subcommand and manifest schema, auto-reflect postlude step in execute-phase, lesson confidence evolution schema, counter reset in reflect workflow
- **Plan intelligence & templates** (Phase 43): semantic validation Dimensions 8-11 in plan checker, advisory severity policy, requirement linkage in reflector/reflect workflow, model and context_used_pct in summary templates and executor spec
- **GSDR namespace co-installation** (Phase 44): install-time namespace rewriting via `replacePathsInContent()` Pass 3a-3d, `(?!tools)` lookahead protects gsd-tools.js, uninstall handles both `gsdr-*` and `gsd-*` patterns, upgrade path cleanup
- Meta-test detection with targeted regex patterns and exempt file list (Phase 36)
- Worktree-safe hook commands with `test -f` shell guards for local installs (Quick 20)
- Co-installation namespace safety: preserve upstream GSD during Reflect install/uninstall (Quick 19)
- Auto-build hooks when `hooks/dist/` missing during install (Quick 16)
- Stamp-version.js automation for config template version (Quick 17)
- `+dev` suffix for git repo installs (Quick 18)
- Signal lifecycle reconciliation script and execute-phase integration (Quick 13)
- Cross-runtime parity testing with glob-based hook discovery (Quick 15)

### Changed
- Health-check workflow refactored to generic probe executor pattern
- Collect-signals `rebuild_index` updated to use project-local `kb-rebuild-index.sh`
- Manifest self-test updated for 7 features (automation added)

### Fixed
- Co-installation: upstream GSD namespace preserved during Reflect install/uninstall
- CI install verification updated for gsdr namespace paths
- `+dev` suffix applies to git repo installs, not just `--local`
- Config template version stamped automatically during release
- Plan checker feedback integration for Phases 37, 38.1, 41
- Node 20 compatibility: replaced `node:fs` `globSync` with `readdirSync` in wiring tests
- Wiring tests target `agents/` (npm source) instead of `.claude/agents/` (install target)

## [1.16.0] - 2026-03-02

### Added
- Signal schema foundation with lifecycle fields (`status`, `severity`, `verified_by`, `verification_window`), four-tier severity, positive signal support, and epistemic gap tracking (Phase 31)
- Signal schema validation with tiered validation in `FRONTMATTER_SCHEMAS` and `backward_compat` field for cross-version interop (Phase 31)
- Multi-sensor signal collection architecture: artifact sensor, git sensor (fix-fix chains, file churn hotspots, scope creep detection), and signal synthesizer agent replace monolithic collector (Phase 32)
- Enhanced reflector: lifecycle-aware `gsd-reflector` rewritten with all 8 REFLECT capabilities, confidence-weighted detection rules, counter-evidence seeking, and reflect-to-spike pipeline (Phase 33)
- Lifecycle dashboard, triage UX, and remediation output in `/gsd:reflect` workflow (Phase 33)
- Evidence snapshots and confidence fields in lesson template (Phase 33)
- Signal-plan linkage: `signal_awareness` section in planner agent, triaged signal loading in plan-phase workflow, post-completion signal remediation in execute-plan, recurrence detection and passive verification in synthesizer (Phase 34)
- Spike audit and lightweight mode: research-only spike execution path, spike decision point (step 5.5) in plan-phase, researcher format wiring to spike manifest config (Phase 35)
- Reflection reports persisted to `~/.gsd/knowledge/reflections/`
- DEV indicator for local dev installs with `+dev` version propagation to command descriptions

### Changed
- `/gsd:collect-signals` refactored from monolithic signal-collector to multi-sensor orchestrator (artifact + git sensors → synthesizer)
- `gsd-reflector` rewritten as lifecycle-aware agent with all 8 REFLECT capabilities
- Signal detection reference updated with four-tier severity, positive signals, and epistemic gaps
- Reflection patterns reference updated with lifecycle-aware confidence scoring
- `signal-collector` agent deprecated in favor of multi-sensor architecture
- Mutability boundary references added to agent specs

### Fixed
- CI wiring validation now checks `agents/` npm source directory
- Manifest test updated for 6 features (spike feature added in v1.16)
- `+dev` version propagated to command descriptions in autocomplete
- Agent-protocol references added to 5 agents, kb-templates copied to npm source
- `@reference` paths corrected in artifact and log sensor agents

## [1.15.6] - 2026-02-26

### Changed
- Version injection in command descriptions now shows `(v1.15.6)` instead of `(v1.15.6 local)` — Claude Code already discriminates by path, scope was redundant

### Added
- Unit tests for `injectVersionScope()` (7 tests covering new format, old format stripping, edge cases)

## [1.15.5] - 2026-02-26

### Fixed
- `replacePathsInContent()` regex now preserves documentation-style path references (where the path is followed by a space) instead of corrupting them into runtime paths — eliminates false-positive patches on every update for 4 affected agent/reference files
- Reworded `dual-installation.md` topology descriptions to avoid ambiguous path patterns that looked identical to functional path references

## [1.15.4] - 2026-02-26

### Fixed
- Installer local patch detection: added `pruneRedundantPatches()` to eliminate false positives where backed-up files are identical to newly installed files (common in dev repos with frequent local installs)

## [1.15.3] - 2026-02-26

### Fixed
- Recovered `knowledge-store.md` agent spec to npm source directory (366-line spec existed only in `.claude/` install target since v1.12 Phase 1)
- Synced dual-install detection to npm source `resume-project.md` (quick-7 changes were only in `.claude/` copy)

## [1.15.2] - 2026-02-26

### Added
- Dual-installation detection: `detectDualInstall()` in gsd-tools.js reports local/global installs in all init commands
- Cross-scope installer warning when installing at a scope where the other scope already has GSD
- Version and scope injection into command descriptions for autocomplete differentiation (e.g., "v1.15.2 local")
- Dual-install status surfaced in `/gsd:resume-work` status box
- `references/dual-installation.md` documenting topology, precedence, and cross-project impact
- `CLAUDE.md` with project-specific development rules (dual-directory architecture)
- `.planning/deliberations/` for persistent design thinking across sessions

### Fixed
- Synced agent-protocol.md and KB surfacing sections to npm source directories — v1.15 Phase 22 work was developed exclusively in `.claude/` (install target) and never propagated to `agents/` and `get-shit-done/references/` (npm source), causing installer to overwrite protocol-enhanced agents with old versions
- Recovered 251-line v1.16 brainstorming from overwritten `.continue-here.md`

## [1.15.1] - 2026-02-25

### Fixed
- Restore `/gsd:reflect`, `/gsd:spike` commands and `gsd-reflector`, `gsd-signal-collector`, `gsd-spike-runner` agent specs that were missing from the npm package despite being committed in Phase 28
- Updated `gsd-reflector` lesson category taxonomy to match v1.15 schema (`architecture|workflow|tooling|testing|debugging|performance|other`)

## [1.15.0] - 2026-02-24

### Added
- Shared `agent-protocol.md` extracted from 11 agent specs — single-edit propagation for all agents (Phase 22)
- Feature manifest system (`feature-manifest.json`) with typed config schemas, `manifest diff-config`, `manifest validate`, `manifest get-prompts` CLI commands (Phase 23)
- Manifest-driven config migration: `upgrade-project`, `new-project`, and `update` workflows consume manifest for config gap detection with lenient validation (Phase 24)
- Backlog system with two-tier storage (per-project + global `~/.gsd/backlog/`), Markdown+YAML items, 7 CLI subcommands (`add`, `list`, `group`, `update`, `promote`, `stats`, `index`) (Phase 25)
- Backlog workflow integration: milestone scoping in `/gsd:new-milestone`, todo promotion in `/gsd:check-todos`, backlog review in `/gsd:complete-milestone` (Phase 26)
- `/gsd:quick` complexity gate: trivial tasks execute inline, complex tasks use full planner+executor (Phase 27)
- `safeFs()` wrapper for installer file operations with descriptive error messages (Phase 27)
- Restored `/gsd:reflect`, `/gsd:spike`, `/gsd:collect-signals` commands and 3 agent specs deleted by f664984 (Phase 28)
- `.continue-here.md` lifecycle management: delete-after-load in resume, cleanup in execute-phase and complete-milestone (Phase 30)
- Spike research-first advisory gate with RESEARCH.md artifact existence check (Phase 30)

### Changed
- Fork tags migrated to `reflect-v*` namespace (e.g., `reflect-v1.15.0`) to avoid upstream tag collision
- Upstream remote configured with `--no-tags` to prevent tag re-import on fetch
- Release workflow and publish.yml updated to use `reflect-v*` tag prefix
- Test suite: 256 tests passing (163 gsd-tools + 73 install + 20 wiring)
- Shell scripts use portable constructs: `${GSD_HOME:-$HOME/.gsd}`, portable `mktemp`, `set -o pipefail` (Phase 27)
- `/gsd:resume-work` searches both `.planning/phases/*/` and `.planning/` for handoff files (Phase 30)

### Fixed
- Backlog stats test isolation via `GSD_HOME` env override (Phase 29)
- Wiring validation tests pass after restoring deleted agent specs (Phase 28-29)
- Installer binary redeployed to match source (875-line gap closed) (Phase 29)

## [1.14.2] - 2026-02-17

### Added
- `/gsd:release [patch|minor|major]` command for automated version bump, changelog, tag, and GitHub Release
- Release command registered in `/gsd:help` reference

### Fixed
- Removed 15 self-fulfilling tests (C7-C10 from PR #4 review): tests that tested Node.js stdlib instead of application code
- Rewrote `real-agent.test.js` as honest `.todo()` scaffold instead of fake-passing tests
- Made `/gsd:release` workflow project-agnostic (dynamic repo URL instead of hardcoded)

### Changed
- Test suite: 140 passing + 4 todo (down from 155 passing — honest count after removing inflated tests)

## [1.14.1] - 2026-02-16

### Added
- 4 runtimes supported: Claude Code, OpenCode, Gemini CLI, OpenAI Codex CLI
- Runtime-agnostic knowledge base at `~/.gsd/knowledge/` with backward-compatible symlink bridge
- Cross-runtime pause/resume with semantic handoff files and runtime detection
- Runtime capability matrix with `has_capability()` pattern for graceful degradation
- OpenAI Codex CLI support: Skills format, AGENTS.md, MCP config.toml generation
- Signal provenance fields (runtime, model, gsd_version) in all KB entry types
- Gemini/Codex format converters for agent body text and MCP configuration
- KB management scripts copied to `~/.gsd/bin/` for runtime-agnostic access
- Pre-migration backup before KB migration with integrity verification
- Capability guards on collect-signals, reflect, and run-spike workflows
- Spike workflow enhanced with feasibility section and research-first advisory gate
- 54 new tests for multi-runtime support (155 total)

### Changed
- Knowledge base migrated from legacy per-runtime location to `~/.gsd/knowledge/`
- Installer uses two-pass path replacement (KB paths → shared, runtime paths → per-runtime)
- Signal command context reduced 7.6x (888 → 116 lines) with self-contained pattern
- Signal cap changed from per-phase/10 to per-project/100
- `convertClaudeToCodexSkill()` uses dynamic regex for absolute path support

### Fixed
- migrateKB: backup collision check (appends timestamp if `.migration-backup` exists)
- migrateKB: dangling symlink detection and cleanup via `lstatSync`
- Codex `@` file reference regex now handles absolute paths in global installs

## [1.13.0] - 2026-02-11

### Added
- Synced with upstream GSD v1.18.0 (70 commits merged from v1.11.2)
- Adopted upstream features: --auto mode, --include flag, reapply-patches, JSONC config parsing, update detection (global vs local), parallel research, new-milestone config persistence
- Adopted thin orchestrator pattern (commands delegate to workflow files)
- Adopted gsd-tools.js CLI for commits, config, state management
- Signal tracking validated through production use (13 signals collected, 3 lessons generated from v1.13 milestone)
- KB comparison document: file-based knowledge base vs upstream's reverted MCP Memory approach

### Changed
- 6 commands converted to thin orchestrator pattern (new-project, help, update, signal, upgrade-project, community)
- Fork divergences now tracked explicitly in FORK-DIVERGENCES.md with per-file merge stances
- Config template updated with v1.13.0 version default
- CI/CD workflows updated with upstream and fork test steps

### Fixed
- Adopted 11 upstream bug fixes including:
  - Executor verification improvements (prevent false completions)
  - Context fidelity enforcement (accurate file references)
  - API key prevention in committed code
  - Commit docs config flag support
  - Auto-create config directory on first run
  - Statusline crash prevention
  - Subagent type configuration
- Test suite repaired after architectural migration (135 total tests: 53 vitest + 75 upstream + 7 fork)

## [1.12.2] - 2026-02-10

### Fixed
- Publish workflow switched to npm Trusted Publishing (OIDC) — removes NPM_TOKEN dependency
- Removed `registry-url` from setup-node to allow native OIDC auth (was forcing token-based auth)

## [1.12.1] - 2026-02-09

### Fixed
- GitHub repository URLs corrected from `rookslog` to `loganrooks` in package.json, README, update command, and publish workflow
- CI lint job removed (unused, caused workflow parse failures)
- Wiring validation test allowlists upstream GSD agents installed at runtime

## [1.12.0] - 2026-02-09

### Added
- `/gsd:health-check` command for workspace validation (KB integrity, config validity, stale artifacts)
- `/gsd:upgrade-project` command for seamless version migration with mini-onboarding
- DevOps context capture during `/gsd:new-project` initialization
- DevOps Gaps detection in codebase mapping
- Version tracking via `gsd_reflect_version` in config.json
- Health check configuration (frequency, staleness threshold, blocking behavior)
- Migration log for tracking version upgrades
- Fork-specific README.md and CHANGELOG.md

### Changed
- Config template updated with health_check and devops sections
- Help command updated with new commands
- package.json updated with fork-specific description and keywords

## [1.11.1] - 2026-02-08

### Added
- Knowledge surfacing system (Phase 5) -- automatic retrieval of lessons and spike results during research
- Debugger and executor KB integration
- Researcher and planner agent KB integration
- Knowledge surfacing reference specification

## [1.11.0] - 2026-02-07

### Added
- Reflection engine (Phase 4) -- pattern detection and lesson distillation
- `/gsd:reflect` command for signal analysis
- Milestone reflection integration
- Reflection patterns reference specification

## [1.10.0] - 2026-02-05

### Added
- Spike runner (Phase 3) -- structured experimentation workflow
- `/gsd:spike` command for running experiments
- Spike execution reference and templates
- Spike integration for orchestrator detection

## [1.9.0] - 2026-02-03

### Added
- Signal collector (Phase 2) -- automatic deviation detection
- `/gsd:collect-signals` command for phase analysis
- `/gsd:signal` command for manual signal logging
- Signal detection reference specification

## [1.8.0] - 2026-02-02

### Added
- Knowledge store (Phase 1) -- persistent cross-project knowledge base
- Knowledge store reference specification
- KB directory initialization and index rebuild scripts
- Entry templates for signals, spikes, and lessons

## [1.7.0] - 2026-02-01

### Added
- Deployment infrastructure (Phase 0)
- npm packaging and install scripts
- Vitest test infrastructure
- CI/CD workflows
- Benchmark suite
- Smoke test suite

---

*GSD Reflect is built on top of [GSD](https://github.com/glittercowboy/get-shit-done). See upstream changelog for base system changes.*
