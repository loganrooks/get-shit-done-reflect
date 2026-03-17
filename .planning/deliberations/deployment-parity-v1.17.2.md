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
**Trigger:** GitHub Issue #15 (Codex agent TOML backslash breakage) revealed that Codex runtime receives structurally different — and broken — deployment artifacts compared to Claude. Investigation expanded to all runtimes: upstream issues #1037 (Codex config.toml pollution), #1053 (OpenCode .jsonc resolution), plus diffing upstream's converters against ours revealed functional bugs in Gemini (`${VAR}` template escaping) and OpenCode (missing agent-specific field stripping). Further comparison showed upstream has converged on shared abstractions and a unified `copyWithPathReplacement()` with per-runtime content conversion — including for workflow files — while our fork has accumulated bespoke branches without this coverage.
**Affects:** v1.17.2 patch release; v1.18 Phase 46-48 (module adoption, fork extraction, extend & verify)
**Related:**
- GitHub Issue #15 (loganrooks/get-shit-done-reflect): Codex TOML backslash breakage
- GitHub Issue #1037 (gsd-build/get-shit-done, CLOSED): Codex config.toml causing app flickering
- GitHub Issue #1053 (gsd-build/get-shit-done, CLOSED): OpenCode .json vs .jsonc
- Quick Task 22: Fixed Codex TOML generation with `'''` literal strings
- `.planning/deliberations/cross-runtime-parity-testing.md` (Adopted): Testing strategy for parity gaps
- sig-2026-03-05-multi-runtime-parity-testing-gap
- Pending TODO: Dual-install Phase 2 (separate concern — update flow UX, not deployment correctness)

## Situation

The GSD Reflect installer (`bin/install.js`, 2,834 lines) supports 4 runtimes: Claude, OpenCode, Gemini, Codex. Each runtime gets bespoke handling via scattered `if (isCodex) / else if (isOpencode)` conditionals (~35 total). Upstream now supports 6 runtimes (adding Copilot + Antigravity) at 3,084 lines and has converged on shared abstractions that our fork lacks.

Three independent issues initially exposed the pattern, but investigation revealed deployment parity gaps across **all** non-Claude runtimes:

1. **Issue #15 (fork, OPEN):** Codex agent TOML files used `"""` (basic strings) which break on backslash patterns in bash examples. Fixed by Quick Task 22 — added `convertClaudeToCodexAgentToml()` using `'''` literal strings.

2. **Issue #1037 (upstream, CLOSED without code fix):** GSD's Codex config.toml additions (`[agents]`, model pinning) caused Codex desktop app to malfunction. Upstream has since added `generateCodexConfigBlock()` and `stripGsdFromCodexConfig()` for proper config management with markers. Our fork lacks these.

3. **Issue #1053 (upstream, CLOSED with fix):** Installer hardcoded `opencode.json`, ignoring `opencode.jsonc`. Fixed upstream with `resolveOpencodeConfigPath()`. Our fork lacks this.

### Per-Runtime Gap Analysis

**Gemini gaps (2 functional bugs, 1 improvement):**
- `${VAR}` template escaping: Gemini agents with `${PHASE}`, `${PLAN}` in bash blocks throw "Missing required input parameters" because Gemini's `templateString()` treats them as template variables. **Functional bug.**
- `skills:` field stripping: Agent frontmatter with `skills:` causes Gemini CLI validation error. **Functional bug.**
- `inSkippedArrayField`: Multi-line YAML array fields not properly handled during frontmatter cleanup.

**OpenCode gaps (3 functional gaps, 1 bug fix):**
- `isAgent` parameter: Agents get command-style conversion, leaving unsupported fields (`skills:`, `color:`, `memory:`, `maxTurns:`, `permissionMode:`, `disallowedTools:`) in agent frontmatter.
- `subagent_type` remapping: `"general-purpose"` → `"general"` not happening — OpenCode agents may not spawn sub-agents correctly.
- `resolveOpencodeConfigPath()`: `.jsonc` not respected (#1053 bug).
- Path replacement in converter: Upstream explicitly replaces `~/.claude` → `~/.config/opencode` and `$HOME/.claude`; our fork defers to `replacePathsInContent()` at the call site.

**Codex gaps (3 items beyond QT22):**
- Sandbox modes: No `CODEX_AGENT_SANDBOX` per-agent permissions (`workspace-write` vs `read-only`).
- Config.toml registration: Agents not registered via `[agents.name]` sections, no GSD marker for clean uninstall.
- Workflow content conversion: `copyWithPathReplacement()` doesn't call `convertClaudeToCodexMarkdown()` for workflow/reference/template files — 59 files with Claude-specific patterns (`AskUserQuestion`, `Task(...)`, `/gsdr:command`) deployed unconverted.

**Structural/cross-runtime gaps:**
- `copyWithPathReplacement()` missing `isCommand`/`isGlobal` params and Codex content conversion path. Upstream dispatches all 6 runtimes including Codex markdown conversion.
- No parity enforcement: adding a runtime requires touching 10+ places, no test fails if you miss one. Parity is "remember to do it" convention, not structural guarantee.
- 6 separate ad-hoc frontmatter parsing sites instead of upstream's shared `extractFrontmatterAndBody()` + `extractFrontmatterField()`.

### Upstream Innovations We're Missing

| Innovation | Upstream | Fork | Impact |
|-----------|----------|------|--------|
| **Shared frontmatter helpers** | `extractFrontmatterAndBody()` + `extractFrontmatterField()` used by all converters | 6 separate ad-hoc parsing sites (lines 653, 739, 838, 885, 951, 1248) | High: reduces merge conflict surface, DRY |
| **`resolveOpencodeConfigPath()`** | Prefers `.jsonc` when it exists | Hardcoded `.json` | Medium: bug fix for OpenCode users |
| **`readSettings()` / `writeSettings()`** | Shared JSON settings helpers | Ad-hoc `JSON.parse(fs.readFileSync())` calls | Low-medium: DRY, error handling |
| **`CODEX_AGENT_SANDBOX`** | Per-agent sandbox mode config (`workspace-write` vs `read-only`) | No sandbox modes | Medium: Codex security model |
| **`generateCodexConfigBlock()`** | Registers agents in config.toml with `[agents.name]` sections + GSD marker for clean uninstall | No agent registration, only `AGENTS.md` + raw TOML files | Medium: proper Codex integration |
| **`stripGsdFromCodexConfig()`** | Clean removal of GSD sections from config.toml | No uninstall for Codex config sections | Medium: addresses #1037 pattern |
| **Gemini `${VAR}` template escaping** | Converts `${PHASE}`, `${PLAN}` → `$PHASE`, `$PLAN` in agent body | Missing — Gemini agents fail with "Missing required input parameters" | **High: functional bug** |
| **Gemini `skills:` field stripping** | Strips `skills:` from agent frontmatter | Missing — Gemini agent validation failures | Medium: functional bug |
| **Gemini `inSkippedArrayField`** | Properly skips multi-line YAML array fields | Missing — multi-line fields leak into output | Low-medium |
| **OpenCode `isAgent` parameter** | Agent-specific field stripping (skills, color, memory, maxTurns, permissionMode, disallowedTools) | Missing — agents get command-style conversion | Medium: functional gap |
| **OpenCode `subagent_type` remapping** | `"general-purpose"` → `"general"` | Missing — sub-agents may not spawn | Medium: functional gap |
| **`copyWithPathReplacement` Codex path** | Calls `convertClaudeToCodexMarkdown()` for workflow/reference/template files | Missing — 59 files deployed with Claude-specific patterns | **High: functional gap** |
| **`copyWithPathReplacement` `isCommand`/`isGlobal`** | Distinguishes command vs workflow files; passes `isGlobal` to converters | Missing — all files treated identically | High: structural gap |
| **Copilot runtime** | Full support | Missing entirely | Low (v1.18 scope) |
| **Antigravity runtime** | Full support | Missing entirely | Low (v1.18 scope) |

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `bin/install.js` grep for frontmatter parsing | 6 ad-hoc `content.indexOf('---', 3)` + `split('\n')` sites in: `convertClaudeToGeminiAgent` (655), `convertClaudeToOpencodeFrontmatter` (739), `convertClaudeToGeminiToml` (842), `convertClaudeToCodexAgentToml` (885), `convertClaudeToCodexSkill` (951), `injectVersionScope` (1249) | Yes — grep confirmed all 6 | informal |
| `bin/install.js` grep for sandbox/CODEX_AGENT_SANDBOX | Zero results — no sandbox support in fork | Yes — grep exit code 1 | informal |
| `bin/install.js` grep for resolveOpencodeConfigPath/opencode.jsonc | Zero results — no jsonc support in fork | Yes — grep exit code 1 | informal |
| Upstream `install.js` (3,084 lines, downloaded to /tmp) | Has all innovations listed above; supports 6 runtimes; shared helpers used 10+ times | Yes — read upstream source directly | informal |
| Upstream Issue #1053 closed with commit 637a3e7 | `resolveOpencodeConfigPath()` is a 7-line function preferring `.jsonc` | Yes — read commit message and function source | informal |
| Upstream Issue #1037 closed without code fix | Only comment is "I have same issue" — closed as known/wontfix | Yes — read issue comments via gh api | informal |
| Quick Task 22 implementation | Our `convertClaudeToCodexAgentToml()` generates TOML with `'''` but doesn't set sandbox modes or register in config.toml | Yes — read our function (lines 879-912), confirmed no sandbox/registry | informal |
| Diff of `convertClaudeToGeminiAgent()` upstream vs fork | Upstream adds: `inSkippedArrayField`, `skills:` stripping, `${VAR}` → `$VAR` escaping. Fork adds: tool name replacement in body text (upstream doesn't). | Yes — direct diff of both functions | informal |
| Diff of `convertClaudeToOpencodeFrontmatter()` upstream vs fork | Upstream adds: `isAgent` parameter with agent-specific field stripping, `subagent_type` remapping, explicit path replacement | Yes — read both function signatures and bodies | informal |
| Diff of `copyWithPathReplacement()` upstream vs fork | Upstream adds: `isCommand`/`isGlobal` params, Codex markdown conversion, Copilot/Antigravity paths. Fork only handles Claude/OpenCode/Gemini. | Yes — read both functions side-by-side | informal |
| `get-shit-done/` workflow file audit | 59 files with runtime-specific patterns, 19 using `AskUserQuestion`, 16 using `subagent_type` | Yes — grep -rl confirmed counts | informal |

## Framing

**Core question:** Before starting the v1.18 upstream sync, what upstream installer innovations should we adopt as a v1.17.2 patch to (a) fix known deployment bugs across all non-Claude runtimes (Gemini template escaping, OpenCode jsonc, Codex config management), (b) align our converter functions with upstream's patterns to reduce merge conflict surface, (c) bring all runtimes to deployment parity with Claude including workflow/reference/template files, and (d) make parity structurally enforced so future changes can't silently break non-Claude runtimes?

**Adjacent questions:**
- Should we adopt Copilot/Antigravity now or defer to v1.18? (Consensus: defer — new functionality, not a fix)
- Should we refactor toward a runtime registry pattern? (Consensus: not in a patch — architectural change that needs its own deliberation, but parity enforcement tests are a step in that direction)
- How do we reconcile our `convertClaudeToCodexAgentToml()` (QT22) with upstream's `generateCodexAgentToml()`?
- Is the dual-install TODO (update flow, hook awareness, version-pinned suppression) part of this? (No — it's UX for managing dual installs, not deployment correctness. Remains a separate pending TODO.)

## Analysis

### Option A: Full Parity Across All Runtimes + Enforcement (Adopted)

- **Claim:** Fix all non-Claude runtimes (Gemini, OpenCode, Codex) to deployment parity with Claude, upgrade `copyWithPathReplacement()` to convert workflow files for all runtimes, adopt shared abstractions from upstream, and add parity enforcement tests. Ship as v1.17.2.
- **Grounds:** Investigation revealed functional bugs in Gemini (template escaping, skills stripping) and OpenCode (missing agent field stripping, subagent_type remapping) in addition to the Codex issues that triggered this deliberation. 59 workflow files are deployed to Codex without content conversion. Upstream has independently solved all of these and converged on shared helpers that we can adopt. 6 quick tasks cover the full scope: shared helpers → per-runtime fixes → structural upgrade → enforcement.
- **Warrant:** The pattern of "fix one runtime, discover others are broken too" repeats across v1.14 (Phase 17), v1.17 (Phase 39), and now this investigation. Each time, the investigation revealed that non-Claude runtimes had accumulated gaps. The enforcement test (QT28) breaks this cycle — future changes that break parity will be caught by CI, not by user bug reports months later. The shared frontmatter helpers (QT23) reduce code and align function signatures with upstream. Per-runtime fixes (QT24-26) address active functional bugs. The `copyWithPathReplacement` upgrade (QT27) closes the workflow content gap. Together these make v1.18's sync significantly easier because our converter functions will already match upstream's patterns.
- **Rebuttal:** 6 quick tasks is substantial for a "patch." If any task introduces a regression, it could delay the v1.18 work. However, each task is independently valuable, testable, and shippable — a regression in QT25 doesn't block QT24. The shared helpers (QT23) should land first since all subsequent tasks benefit from them.
- **Qualifier:** This is the right scope. Each task addresses a real gap with evidence. The enforcement test prevents recurrence.

### Option B: Minimal — Only Bug Fixes (Rejected)

- **Claim:** Only fix the three user-reported bugs: Gemini template escaping, OpenCode jsonc, Codex config management. Skip shared helpers, workflow conversion, and enforcement tests.
- **Grounds:** These are the items with actual bug reports.
- **Warrant:** Minimal patches minimize risk.
- **Rebuttal:** This was the approach that created the current situation — fixing the reported bug without addressing the structural pattern underneath. The workflow content gap is arguably worse than the reported bugs (59 files with wrong syntax) but hasn't been reported because Codex users may not know what "correct" looks like. The enforcement test is the single most valuable item for long-term maintainability.
- **Qualifier:** Too conservative. We'd be back here in v1.18 fixing the same class of issue.

## Tensions

1. **Patch scope vs. v1.18 prep value:** 6 quick tasks is large for a patch, but each one reduces the v1.18 sync burden. The alternative — deferring to v1.18 — means running the sync against a codebase with known functional bugs in 3 of 4 runtimes.

2. **Our QT22 implementation vs. upstream's approach:** We just shipped `convertClaudeToCodexAgentToml()`. Upstream has `generateCodexAgentToml()` with different structure (uses `CODEX_AGENT_SANDBOX`, different function name). QT26 reconciles these.

3. **Enforcing parity vs. allowing intentional divergence:** The enforcement test must distinguish "missing converter" (bug) from "intentional skip" (e.g., Codex skips hooks). Use an explicit exception list that documents WHY each divergence exists.

4. **Workflow conversion depth:** Upstream's `convertClaudeToCodexMarkdown()` does `/gsd:` → `$gsd-` and `$ARGUMENTS` → `{{GSD_ARGS}}` but doesn't remap tool names in workflow body text. Tool names like `AskUserQuestion` in workflow instructions may still confuse non-Claude runtimes. Full semantic conversion is out of scope for a patch — the `copyWithPathReplacement` upgrade handles what upstream handles.

## Recommendation

**Adopt Option A: Full Parity Across All Runtimes + Enforcement, as v1.17.2 patch.**

Implementation as 6 quick tasks (QT23 should land first; QT24-26 are independent; QT27 depends on QT23; QT28 depends on QT24-27):

| QT# | Item | Runtime(s) | Scope |
|-----|------|-----------|-------|
| 23 | **Shared frontmatter helpers** — add `extractFrontmatterAndBody()` + `extractFrontmatterField()`, refactor all 6 ad-hoc parsing sites to use them | All | `bin/install.js`, unit tests |
| 24 | **Gemini converter parity** — `${VAR}` → `$VAR` template escaping, `skills:` field stripping, `inSkippedArrayField` handling | Gemini | `bin/install.js`, unit + integration tests |
| 25 | **OpenCode converter parity** — `isAgent` parameter with agent-specific field stripping, `subagent_type` remapping, `resolveOpencodeConfigPath()`, `readSettings()`/`writeSettings()` helpers | OpenCode | `bin/install.js`, unit + integration tests |
| 26 | **Codex deployment parity** — sandbox modes (`CODEX_AGENT_SANDBOX`), config.toml agent registration (`generateCodexConfigBlock`), clean uninstall (`stripGsdFromCodexConfig`), reconcile QT22 with upstream pattern | Codex | `bin/install.js`, unit + integration tests |
| 27 | **`copyWithPathReplacement` upgrade** — add `isCommand`/`isGlobal` params, Codex content conversion for workflow/reference/template files, runtime dispatch for all 4 runtimes | All (esp. Codex) | `bin/install.js`, unit + integration tests |
| 28 | **Parity enforcement test** — structural test that fails when a runtime is missing converter coverage, verifying agent count parity, workflow content conversion, and no runtime-specific gaps. Must have explicit exception list for intentional divergences. | All | `tests/integration/multi-runtime.test.js` |

After all 6 quick tasks: tag as `reflect-v1.17.2`, note in ROADMAP.md that deployment parity was addressed pre-v1.18.

**Note on dual-install TODO:** The pending TODO ("Dual-install Phase 2: update flow, hook awareness, and version-pinned suppression") is a separate concern about UX for managing dual local+global installs. It remains open and is not addressed by this patch.

## Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Adopting shared frontmatter helpers will reduce installer line count by 40-60 lines (6 parsing sites × ~10 lines each, replaced by single-line calls) | Diff stat after QT23 | Line count increases or stays the same |
| P2 | v1.18 Phase 46 (module adoption) will have <5 merge conflicts in converter functions because our function signatures match upstream | Merge conflict count during Phase 46 | >5 conflicts in converter functions specifically |
| P3 | Codex config.toml agent registration will prevent the #1037 flickering pattern because GSD sections are properly delimited with markers and cleanly removable | Manual test: install → uninstall → verify config.toml is clean | Config.toml retains GSD artifacts after uninstall |
| P4 | OpenCode `.jsonc` resolution will work transparently — existing `.json` users unaffected, `.jsonc` users get correct behavior | Integration test with both file types | Test failure or regression in `.json` path |
| P5 | Gemini `${VAR}` escaping will eliminate template validation errors for all agents | Install `--gemini --global`, grep for `${` in installed agents — should find 0 | Any installed Gemini agent still contains `${word}` patterns |
| P6 | The parity enforcement test (QT28) will catch at least one gap if a new feature is added for Claude without equivalent coverage for other runtimes | Run test after any future Claude-only addition — should fail | Test passes despite missing non-Claude implementation |

## Decision Record

**Decision:** Adopt Option A — 6 quick tasks (QT23-28) implementing shared frontmatter helpers, Gemini converter fixes, OpenCode converter fixes, Codex deployment parity, workflow content conversion upgrade, and parity enforcement tests. Release as v1.17.2. Defer Copilot/Antigravity and registry refactor to v1.18.
**Decided:** 2026-03-17
**Implemented via:** Quick Tasks 23, 24, 25, 26, 27, 28 (pending)
**Signals addressed:** sig-2026-03-05-multi-runtime-parity-testing-gap (addresses both the testing gaps and the structural deployment gaps that cause them)

## Evaluation

<!--
Filled when status moves to `evaluated`.
Compare predictions against actual outcomes. Explain deviations.
-->

**Evaluated:** {pending}
