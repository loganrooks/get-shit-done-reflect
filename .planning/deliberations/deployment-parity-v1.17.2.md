# Deliberation: Cross-Platform Deployment Parity (v1.17.2 Patch)

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-17
**Status:** Concluded
**Trigger:** GitHub Issue #15 (Codex agent TOML backslash breakage) revealed that Codex runtime receives structurally different — and broken — deployment artifacts compared to Claude. Investigation of upstream issues #1037 (Codex config.toml pollution) and #1053 (OpenCode .jsonc resolution) showed this is a cross-platform pattern, not a Codex-specific bug. Further comparison with upstream's current installer revealed that upstream has independently solved several of the same problems AND added 2 new runtimes (Copilot, Antigravity), while our fork has accumulated bespoke branches without shared abstractions.
**Affects:** v1.17.2 patch release; v1.18 Phase 46-48 (module adoption, fork extraction, extend & verify)
**Related:**
- GitHub Issue #15 (loganrooks/get-shit-done-reflect): Codex TOML backslash breakage
- GitHub Issue #1037 (gsd-build/get-shit-done, CLOSED): Codex config.toml causing app flickering
- GitHub Issue #1053 (gsd-build/get-shit-done, CLOSED): OpenCode .json vs .jsonc
- Quick Task 22: Fixed Codex TOML generation with `'''` literal strings
- `.planning/deliberations/cross-runtime-parity-testing.md` (Adopted): Testing strategy for parity gaps
- sig-2026-03-05-multi-runtime-parity-testing-gap

## Situation

The GSD Reflect installer (`bin/install.js`, 2,834 lines) supports 4 runtimes: Claude, OpenCode, Gemini, Codex. Each runtime gets bespoke handling via scattered `if (isCodex) / else if (isOpencode)` conditionals (~35 total). Upstream now supports 6 runtimes (adding Copilot + Antigravity) at 3,084 lines and has converged on shared abstractions that our fork lacks.

Three independent issues exposed deployment parity gaps:

1. **Issue #15 (fork, OPEN):** Codex agent TOML files used `"""` (basic strings) which break on backslash patterns in bash examples. Fixed by Quick Task 22 — added `convertClaudeToCodexAgentToml()` using `'''` literal strings.

2. **Issue #1037 (upstream, CLOSED without code fix):** GSD's Codex config.toml additions (`[agents]`, model pinning) caused Codex desktop app to malfunction. Upstream has since added `generateCodexConfigBlock()` and `stripGsdFromCodexConfig()` for proper config management with markers. Our fork lacks these.

3. **Issue #1053 (upstream, CLOSED with fix):** Installer hardcoded `opencode.json`, ignoring `opencode.jsonc`. Fixed upstream with `resolveOpencodeConfigPath()`. Our fork lacks this.

### Upstream Innovations We're Missing

Comparison of upstream's current `install.js` (commit ~637a3e7) vs our fork:

| Innovation | Upstream | Fork | Impact |
|-----------|----------|------|--------|
| **Shared frontmatter helpers** | `extractFrontmatterAndBody()` + `extractFrontmatterField()` used by all converters | 6 separate ad-hoc parsing sites (lines 653, 739, 838, 885, 951, 1248) | High: reduces merge conflict surface, DRY |
| **`resolveOpencodeConfigPath()`** | Prefers `.jsonc` when it exists | Hardcoded `.json` | Medium: bug fix for OpenCode users |
| **`readSettings()` / `writeSettings()`** | Shared JSON settings helpers | Ad-hoc `JSON.parse(fs.readFileSync())` calls | Low-medium: DRY, error handling |
| **`CODEX_AGENT_SANDBOX`** | Per-agent sandbox mode config (`workspace-write` vs `read-only`) | No sandbox modes | Medium: Codex security model |
| **`generateCodexConfigBlock()`** | Registers agents in config.toml with `[agents.name]` sections + GSD marker for clean uninstall | No agent registration, only `AGENTS.md` + raw TOML files | Medium: proper Codex integration |
| **`stripGsdFromCodexConfig()`** | Clean removal of GSD sections from config.toml | No uninstall for Codex config sections | Medium: addresses #1037 pattern |
| **Copilot runtime** | Full support: agents (.agent.md), skills (SKILL.md), tool mapping | Missing entirely | Low (v1.18 scope) |
| **Antigravity runtime** | Full support: agents, skills, Gemini tool reuse | Missing entirely | Low (v1.18 scope) |

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `bin/install.js` grep for frontmatter parsing | 6 ad-hoc `content.indexOf('---', 3)` + `split('\n')` sites in: `convertClaudeToGeminiAgent` (655), `convertClaudeToOpencodeFrontmatter` (739), `convertClaudeToGeminiToml` (842), `convertClaudeToCodexAgentToml` (885), `convertClaudeToCodexSkill` (951), `injectVersionScope` (1249) | Yes — grep confirmed all 6 | informal |
| `bin/install.js` grep for sandbox/CODEX_AGENT_SANDBOX | Zero results — no sandbox support in fork | Yes — grep exit code 1 | informal |
| `bin/install.js` grep for resolveOpencodeConfigPath/opencode.jsonc | Zero results — no jsonc support in fork | Yes — grep exit code 1 | informal |
| Upstream `install.js` (3,084 lines, downloaded) | Has all 6 innovations listed above; supports 6 runtimes; `extractFrontmatterAndBody()` used 10+ times across all converters | Yes — read upstream source directly | informal |
| Upstream Issue #1053 closed with commit 637a3e7 | `resolveOpencodeConfigPath()` is a 7-line function preferring `.jsonc` | Yes — read commit message and function source | informal |
| Upstream Issue #1037 closed without code fix | Only comment is "I have same issue" — closed as known/wontfix | Yes — read issue comments via gh api | informal |
| Quick Task 22 implementation | Our `convertClaudeToCodexAgentToml()` generates TOML with `'''` but doesn't set sandbox modes or register in config.toml | Yes — read our function (lines 879-912), confirmed no sandbox/registry | informal |

## Framing

**Core question:** Before starting the v1.18 upstream sync, what upstream installer innovations should we adopt as a v1.17.2 patch to (a) fix known deployment bugs across all runtimes, (b) align our installer's abstractions with upstream's patterns to reduce merge conflict surface, and (c) bring Codex deployment to parity with Claude/OpenCode/Gemini?

**Adjacent questions:**
- Should we adopt Copilot/Antigravity now or defer to v1.18? (Consensus: defer — new functionality, not a fix)
- Should we refactor toward a runtime registry pattern? (Consensus: not in a patch — architectural change that needs its own deliberation)
- How do we reconcile our `convertClaudeToCodexAgentToml()` (QT22) with upstream's `generateCodexAgentToml()`?

## Analysis

### Option A: Targeted Upstream Cherry-Pick (4 items)

- **Claim:** Adopt 4 specific upstream innovations as a v1.17.2 patch: (1) shared frontmatter helpers, (2) `resolveOpencodeConfigPath()`, (3) Codex sandbox modes + config.toml agent registration, (4) `readSettings()`/`writeSettings()` helpers. Defer Copilot/Antigravity and registry refactor to v1.18.
- **Grounds:** These 4 items fix known bugs (#1053 OpenCode, #1037 pattern for Codex config), eliminate 6 duplicate parsing sites, and align our converter functions with the signatures upstream expects — reducing merge conflicts during v1.18 Phase 46-48. Total estimated effort: 2-3 quick tasks. New runtimes (Copilot, Antigravity) require new test infrastructure and flag handling that belongs in the modularization phases.
- **Warrant:** A patch should fix bugs and reduce technical debt, not add features. These 4 items are all bug-fixes or DRY improvements. Adopting upstream's function signatures now means v1.18's module adoption phase (46) can focus on modular structure, not on reconciling different helper function interfaces. The shared frontmatter helpers alone touch every converter — adopting them now means those converters will have the same call sites as upstream when we sync.
- **Rebuttal:** Cherry-picking piecemeal creates a hybrid state where some upstream patterns are adopted but the overall structure still differs. If v1.18 changes these same functions again, we've done work twice. However, the frontmatter helpers are stable (used by 10+ call sites upstream — unlikely to change), and the Codex config management directly addresses user-reported issues.
- **Qualifier:** Probably the right scope. Low risk, high alignment value.

### Option B: Full Parity Push (include Copilot + Antigravity)

- **Claim:** Adopt all upstream innovations including Copilot and Antigravity runtime support, making our fork fully runtime-equivalent with upstream before the v1.18 sync.
- **Grounds:** Upstream's 6-runtime support is already working. The conversion functions follow consistent patterns (`convertClaudeTo{Runtime}Content` → `convertClaudeCommandTo{Runtime}Skill` → `convertClaudeAgentTo{Runtime}Agent`). Adding them now means v1.18 doesn't need to add new runtimes, only refactor existing ones.
- **Warrant:** Completeness reduces the cognitive load of the v1.18 sync — every runtime would already exist, and the sync becomes purely structural (monolith → modules) rather than structural + functional.
- **Rebuttal:** Copilot and Antigravity are untested on our fork. We'd need new tests, new flags (`--copilot`, `--antigravity`), and potentially new CI configurations. That's feature work, not a patch. It also means we're adding runtime support that diverges from upstream's implementation before we sync — we'd be creating MORE merge conflicts, not fewer. The namespace isolation alone (gsd → gsdr for 2 new runtimes) needs careful testing.
- **Qualifier:** Probably too much scope for a patch release. Better to let v1.18 handle this with proper planning.

### Option C: Minimal — Only Bug Fixes

- **Claim:** Only adopt `resolveOpencodeConfigPath()` (#1053 fix) and Codex config.toml management (#1037 pattern). Skip the shared helpers and settings helpers.
- **Grounds:** These are the only items that fix user-reported bugs. The shared frontmatter helpers are a refactor (DRY improvement) not a bug fix.
- **Warrant:** Patches should be minimal. The DRY improvements, while valuable, change internal structure without fixing user-visible issues.
- **Rebuttal:** The frontmatter helpers are the highest-value item for v1.18 prep — they touch every converter and aligning them now saves significant merge conflict resolution later. Skipping them means the v1.18 sync has to reconcile 6 different ad-hoc parsers with the shared helper pattern, which is the most error-prone part of the merge.
- **Qualifier:** Too conservative. The merge conflict reduction alone justifies the shared helpers.

## Tensions

1. **Patch scope vs. v1.18 prep value:** A patch should be small and focused, but the shared helpers are high-value prep work that makes v1.18 dramatically easier. Resolution: include them — they're a refactor that reduces code, not a feature that adds it.

2. **Our QT22 implementation vs. upstream's approach:** We just shipped `convertClaudeToCodexAgentToml()` which generates TOML. Upstream has `generateCodexAgentToml()` which does the same thing differently (uses `CODEX_AGENT_SANDBOX` config, different function name). Reconciliation needed — either adopt upstream's version (discarding QT22's function) or bridge them. Given v1.18 will sync anyway, adopting upstream's approach now is cleaner.

3. **Parity as a goal vs. parity as emergent:** We can't test Copilot/Antigravity because we don't have those runtimes installed. Upstream presumably tests them. Shipping untested runtime support is worse than not shipping it.

## Recommendation

**Adopt Option A: Targeted Upstream Cherry-Pick (4 items), scoped as v1.17.2 patch.**

Implementation as quick tasks:

| QT# | Item | Scope | Est. |
|-----|------|-------|------|
| 23 | Shared frontmatter helpers (`extractFrontmatterAndBody`, `extractFrontmatterField`) — add functions, refactor all 6 parsing sites to use them | `bin/install.js`, unit tests | Medium |
| 24 | OpenCode `.jsonc` resolution (`resolveOpencodeConfigPath`) + settings helpers (`readSettings`/`writeSettings`) | `bin/install.js`, unit + integration tests | Small |
| 25 | Codex deployment parity: sandbox modes (`CODEX_AGENT_SANDBOX`), config.toml agent registration (`generateCodexConfigBlock`), clean uninstall (`stripGsdFromCodexConfig`), reconcile QT22 with upstream pattern | `bin/install.js`, unit + integration tests | Medium |

After all 3 quick tasks: tag as `reflect-v1.17.2`, note in roadmap that deployment parity was addressed pre-v1.18.

## Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Adopting shared frontmatter helpers will reduce installer line count by 40-60 lines (6 parsing sites × ~10 lines each, replaced by single-line calls) | Diff stat after QT23 | Line count increases or stays the same |
| P2 | v1.18 Phase 46 (module adoption) will have <5 merge conflicts in converter functions because our function signatures match upstream | Merge conflict count during Phase 46 | >5 conflicts in converter functions specifically |
| P3 | Codex config.toml agent registration will prevent the #1037 flickering pattern because GSD sections are properly delimited with markers and cleanly removable | Manual test: install → uninstall → verify config.toml is clean | Config.toml retains GSD artifacts after uninstall |
| P4 | OpenCode `.jsonc` resolution will work transparently — existing `.json` users unaffected, `.jsonc` users get correct behavior | Integration test with both file types | Test failure or regression in `.json` path |

## Decision Record

**Decision:** Adopt Option A — 3 quick tasks (QT23-25) implementing shared frontmatter helpers, OpenCode jsonc fix, and Codex deployment parity. Release as v1.17.2. Defer Copilot/Antigravity and registry refactor to v1.18.
**Decided:** 2026-03-17
**Implemented via:** Quick Tasks 23, 24, 25 (pending)
**Signals addressed:** sig-2026-03-05-multi-runtime-parity-testing-gap (partially — addresses the structural gaps that parity tests would catch)

## Evaluation

<!--
Filled when status moves to `evaluated`.
Compare predictions against actual outcomes. Explain deviations.
-->

**Evaluated:** {pending}
