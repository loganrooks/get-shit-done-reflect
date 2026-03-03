# Domain Pitfalls: v1.17 Automation Loop

**Domain:** Adding CI sensors, hook-based auto-triggering, auto-reflection, health check hooks, and plan checker semantic validation to an existing agentic workflow system (GSD Reflect)
**Researched:** 2026-03-02
**Confidence:** HIGH (grounded in codebase analysis of 329 tests, 79 KB signals, 5 completed milestones, known failure patterns from v1.16 CI bypass, wiring-validation.test.js false failures, and dual-directory architecture incidents)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or system instability. Each of these has occurred in analogous systems or has a direct precedent in this codebase.

---

### Pitfall 1: Auto-Triggering Creates Feedback Loops That Consume Infinite Context

**What goes wrong:**
Signal collection auto-triggers after phase execution. Reflection auto-triggers after N phases. But reflection can GENERATE signals (it creates lessons, triages signals, persists reports). If reflection output triggers collect-signals (because a new artifact was written), which triggers reflection (because N signals accumulated), the system enters an infinite loop: execute -> collect-signals -> reflect -> collect-signals -> reflect -> ...

In the current architecture, each of these operations spawns subagents via Task(). Each subagent consumes tokens and time. A feedback loop does not crash the system -- it silently burns through context budget, token quotas, and wall-clock time until the user notices or the context window fills.

The specific chain: (1) execute-phase completes, writes SUMMARY.md, (2) PostToolUse hook detects SUMMARY.md write, triggers collect-signals, (3) collect-signals writes signal files to `~/.gsd/knowledge/signals/`, (4) if reflection auto-triggers on signal accumulation, it reads signals, writes lessons/triage updates to KB, (5) KB writes could trigger another collect-signals (new artifacts detected), (6) loop.

**Why it happens:**
Event-driven systems without loop guards are a known anti-pattern in distributed systems. The browser event model solved this decades ago: event handlers that execute synchronously cannot re-trigger themselves during execution. But GSD's hook system is asynchronous (background processes via hooks), and the signal/reflection system has no reentrancy guard.

The v1.17 deliberation identifies this risk ("Auto-triggering reflection could cause feedback loops if reflection generates signals which trigger more reflection") but does not specify the prevention mechanism.

**Consequences:**
- Context window fills with auto-triggered operations, degrading quality per agent-protocol.md Section 11 quality curve
- Token costs spike without user awareness (background operations burning quota)
- If auto-collect-signals and auto-reflect both run unguarded, they can race against each other modifying the same KB files
- User loses control of when expensive operations run

**Prevention:**
1. **Reentrancy guard via lockfile:** Before any auto-triggered operation, check for `~/.gsd/.auto-trigger.lock`. If present, skip. Create the lockfile at start, remove at end. This prevents collect-signals from triggering during reflection and vice versa.
2. **Source tagging on triggers:** Every auto-triggered operation carries a `trigger_source` tag. Signal collection triggered by "phase-completion" is allowed. Signal collection triggered by "reflection-output" is NOT allowed. Reflection triggered by "phase-count" is allowed. Reflection triggered by "signal-collection" is NOT allowed. This creates a directed acyclic graph of allowed trigger chains.
3. **Cooldown period:** After any auto-triggered operation completes, enforce a minimum cooldown (e.g., "no auto-trigger within the same session if one already ran"). This is the "Zeno behavior prevention" approach from event-triggered control theory.
4. **Explicit trigger whitelist in config:** Only allow auto-triggering from specific events, not from any file write. The config should enumerate: `auto_trigger_sources: ["phase-completion", "milestone-boundary"]` -- not pattern-match on file system events.

**Detection:**
- Context usage spikes unexpectedly during what should be a simple phase execution
- Multiple collect-signals or reflect operations in git log without user invocation
- Lockfile left behind from crashed auto-trigger (stale `.auto-trigger.lock`)
- Signal count jumps by large amounts between phases without corresponding execution activity

---

### Pitfall 2: CI Sensor Assumes `gh` CLI Authentication That Does Not Exist

**What goes wrong:**
The CI sensor uses `gh` CLI to detect failed GitHub Actions, bypassed branch protection, and test regressions. But `gh` CLI requires authentication (`gh auth login` or `GITHUB_TOKEN` env var). In several common scenarios, authentication is absent:

1. **First-time users:** `gh` may not be installed at all. The command fails silently or with an unhelpful error.
2. **CI environment itself:** If the CI sensor runs as part of a GitHub Actions workflow, it needs a `GITHUB_TOKEN` with appropriate scopes. The default `GITHUB_TOKEN` may lack `actions:read` or `checks:read` permissions.
3. **Private repos:** `gh` requires repo-scoped tokens for private repositories. A user may have `gh` authenticated for public repos but not for the current private repo.
4. **Token expiration:** Personal access tokens expire. A CI sensor that worked last month may silently fail today.
5. **Cross-runtime degradation:** On OpenCode or Codex CLI (which lack hooks), the CI sensor cannot auto-trigger at SessionStart. It must be invoked explicitly. But explicit invocation still requires `gh` auth.

The v1.17 deliberation says "CI sensor -- detect failed GitHub Actions, bypassed branch protection, test regressions (uses `gh` CLI)" but does not address the authentication prerequisite.

**Why it happens:**
Developers building CI integrations test with their own authenticated `gh` CLI. The "happy path" always works in development. The failure modes (no auth, expired token, insufficient scopes) only surface in other environments or after time passes.

**Consequences:**
- CI sensor fails on first use for most users, creating a bad first impression of the feature
- Silent failure means the sensor reports "no CI issues" when it actually could not check
- If the sensor is auto-triggered at SessionStart, a `gh` auth failure could block or delay session start
- Error messages from `gh` CLI are not GSD-formatted, confusing users

**Prevention:**
1. **Pre-flight check:** Before running any `gh` command, execute `gh auth status` (non-interactive). If it fails, emit a `notable` severity signal about missing CI sensor capability and skip gracefully. Do NOT block execution.
2. **Graceful degradation config:** Add `devops.ci_sensor_enabled` (default: false, auto-set to true if `gh auth status` passes during `/gsd:new-project` or first CI sensor invocation). The sensor only runs when explicitly enabled.
3. **Scope validation:** The sensor should check specific `gh` command feasibility: `gh run list --limit 1` will fail with "insufficient permissions" if token lacks `actions:read`. Test this once and cache the result.
4. **Offline mode:** If `gh` is unavailable, the sensor can still check local CI config (`.github/workflows/*.yml` exist, branch protection rules in `gh api` cache). Degrade to local-only analysis rather than failing entirely.
5. **Error formatting:** Wrap all `gh` CLI calls in error handlers that translate `gh` errors into GSD-formatted messages. "gh: not logged in" becomes "CI sensor skipped: GitHub CLI not authenticated. Run `gh auth login` to enable CI monitoring."

**Detection:**
- CI sensor reports zero findings but user knows CI has been failing (the v1.16 pattern: 5 CI failures, zero detection)
- `gh auth status` in session shows "not logged in"
- CI sensor hook takes >5 seconds at SessionStart (network timeout trying to auth)

---

### Pitfall 3: Wiring Validation Tests Check the Wrong Directory (Known Recurring Bug)

**What goes wrong:**
The wiring-validation.test.js has a specific known issue: tests for agent `@-references` check `.claude/agents/` (line 144-146: `const allAgents = await readMdFiles('.claude/agents')`), but in CI `.claude/` does not exist because it is gitignored and populated by the installer at runtime. The subagent_type test (line 170-209) was already fixed to check `agents/` (npm source) first, falling back to `.claude/agents/`. But the `@-references in agents` test still reads from `.claude/agents/` directly.

This is not hypothetical -- this exact pattern caused CI failures throughout v1.16 that were bypassed via admin push. Signal `sig-2026-03-02-ci-failures-ignored-throughout-v116` documents 5 consecutive failures, all ignored.

**Why it happens:**
The dual-directory architecture (agents/ = npm source, .claude/agents/ = install target) creates a cognitive trap. When writing tests, the natural instinct is to test the installed location (`.claude/`) because that is what the runtime reads. But CI does not run the installer -- it runs tests against the source. The CLAUDE.md file warns about this ("Always edit the npm source directories") but the warning applies to test assertions too, not just edits.

This is now a three-time recurrence:
1. v1.15 Phase 22: agent-protocol.md edited in `.claude/agents/` instead of `agents/`, not caught for 23 days
2. v1.16: wiring-validation.test.js checking `.claude/agents/` causes CI false failures
3. v1.17 risk: Any NEW test that checks `.claude/` paths will fail in CI

**Consequences:**
- CI runs fail, developers push via admin bypass (as happened 5 times in v1.16)
- False failures erode trust in the test suite -- developers stop investigating CI failures
- Real failures get masked by expected false failures ("CI always fails, just push it")
- Signal about CI failures was captured but never acted on (the system failed to improve itself)

**Prevention:**
1. **Fix the existing test FIRST:** The `@-references in agents` test must check `agents/` (npm source) as primary, `.claude/agents/` as fallback. This matches the pattern already used in the subagent_type test (lines 200-208).
2. **Add a CI-specific assertion:** A test that verifies NO test file contains `.claude/` as a primary (non-fallback) path assertion. This prevents future recurrence.
3. **Test the tests in CI:** Before adding v1.17 features, run CI and verify all 329+ tests pass. If they do not, fix them first. Do not proceed with new features on a broken test suite.
4. **Codify the rule:** Add a comment block at the top of wiring-validation.test.js: "In CI, only agents/ and get-shit-done/ exist. .claude/ is populated by installer at runtime. All assertions MUST use npm source paths as primary."

**Detection:**
- CI fails on `@-references in agents resolve` test
- `gh run list` shows failing runs on main branch
- New tests added in v1.17 that reference `.claude/` paths

---

### Pitfall 4: Hook-Based Auto-Triggers Silently Fail on 2 of 4 Supported Runtimes

**What goes wrong:**
The v1.17 plan relies heavily on hooks for auto-triggering:
- **SessionStart hook:** CI status warning, health check (on-resume), auto-collect-signals
- **PostToolUse hook:** Detect SUMMARY.md writes for auto-collect-signals trigger
- **execute-phase postlude:** Auto-reflection trigger after N phases

But per the capability matrix, hooks are available ONLY in Claude Code and Gemini CLI. OpenCode and Codex CLI have NO hook support. This means:
- OpenCode users get zero auto-triggering (no SessionStart, no PostToolUse)
- Codex CLI users get zero auto-triggering AND no parallel execution (no task_tool)
- Half of the supported runtimes silently lack the headline v1.17 feature

The current capability_check pattern in execute-phase.md handles this for hooks ("Skip hook configuration. Note: Update checks will run on GSD command invocation instead of session start.") but this pattern has NOT been extended to cover auto-triggering of signals, reflection, or health checks. Adding auto-trigger hooks without adding fallback paths creates a feature that only works on Claude Code.

**Why it happens:**
Development and testing happen on Claude Code (full capability). The capability matrix is documented but capability checks are only added when someone remembers. The execute-phase workflow has 2 capability_check blocks. But collect-signals, reflect, and health-check workflows have zero capability_check blocks -- they were built assuming manual invocation, not hook-triggered automation.

**Consequences:**
- OpenCode and Codex users do not get auto-triggering but have no way to know they are missing it
- Feature parity claims in capability-matrix.md become incorrect
- Users who switch runtimes lose auto-triggering silently
- Tests pass on all runtimes (because tests do not test hook execution, only file wiring)

**Prevention:**
1. **Capability audit for every auto-trigger:** For each auto-trigger added, document the degraded behavior explicitly. "On runtimes without hooks, auto-collect-signals does not run. Users should invoke `/gsd:collect-signals` manually after phase execution."
2. **Command-invocation fallback:** For runtimes without hooks, add auto-trigger logic to the COMMAND invocation path. When a user runs `/gsd:execute-phase`, the command itself checks "should I auto-collect-signals?" after phase completion. This works on ALL runtimes because it is in the workflow, not in hooks.
3. **Health check frequency adaptation:** The feature manifest has `health_check.frequency` with values `on-resume`, `every-phase`, etc. For hook-less runtimes, `on-resume` should trigger on `/gsd:resume-project` command invocation, not on SessionStart hook. Map each frequency value to both a hook trigger AND a command trigger.
4. **Runtime-aware documentation:** The help text for auto-triggering features should include "Automatic on Claude Code and Gemini CLI. Manual on OpenCode and Codex CLI."
5. **Test the degraded path:** Add tests that verify the manual invocation fallback path works. Do not only test the hook path.

**Detection:**
- OpenCode user reports that signals are never collected automatically
- health_check.frequency is set to "on-resume" but health checks never run on OpenCode
- Capability matrix documentation does not mention auto-trigger limitations

---

### Pitfall 5: Plan Checker Semantic Validation Causes False Rejections That Block Execution

**What goes wrong:**
The plan checker currently validates structural dimensions (requirement coverage, task completeness, dependency correctness, key links, scope sanity, verification derivation, context compliance). v1.17 proposes adding SEMANTIC validation: verify tool API existence, config key validity, directory existence, cross-plan dependencies.

Semantic validation has a false positive problem that structural validation does not. Structural checks are deterministic: "does this YAML field exist?" has a clear yes/no answer. Semantic checks are probabilistic: "does this gsd-tools subcommand exist?" requires the checker to query the actual tool, which may change between plan creation and plan execution.

Specific false rejection scenarios:
1. **Tool API existence:** Plan references `node .claude/get-shit-done/bin/gsd-tools.js frontmatter get` -- checker runs the command to verify it exists. But the command may require arguments that the checker does not have. Checker gets an error → false rejection.
2. **Config key validity:** Plan references `config.signal_collection.sensors.ci.enabled` -- checker verifies this against feature-manifest.json. But the CI sensor is a v1.17 addition. If the plan checker runs BEFORE the sensor config is added to the manifest, it rejects a valid plan.
3. **Directory existence:** Plan references `.planning/phases/36-ci-sensor/`. The directory does not exist yet (it will be created by the roadmapper). Checker rejects because directory is missing.
4. **Cross-plan dependencies:** Plan 02 depends on plan 01 creating a file. Checker verifies the file exists. Plan 01 has not run yet. Checker rejects plan 02.

Signal `sig-2026-03-01-plan-checker-misses-tool-api-assumptions` and `sig-2026-03-01-plan-checker-misses-second-order-effects` document the CURRENT problem (checker misses things). But the fix (semantic validation) creates the OPPOSITE problem (checker rejects valid plans).

**Why it happens:**
The plan checker operates in a pre-execution environment. Plans describe future state. Semantic validation checks CURRENT state. This temporal mismatch means the checker can only validate things that exist RIGHT NOW, not things that WILL exist after execution.

**Consequences:**
- Plans that would succeed get rejected, requiring manual override or weakened checker
- Developers learn to ignore checker warnings (boy who cried wolf effect)
- The planner-checker-planner revision loop burns context on false issues
- Semantic checks that are sometimes wrong are worse than no semantic checks (they add cost without reliable value)

**Prevention:**
1. **Advisory mode only:** Semantic validation findings should be classified as `info` severity, not `blocker`. The checker reports "could not verify config key exists" as advisory, not as a rejection.
2. **Temporal awareness:** Semantic checks must distinguish between "does not exist now" and "will not exist after execution." If a plan's task 1 creates a directory and task 2 references it, the checker should recognize the intra-plan dependency. Cross-plan: if plan 01 creates a file and plan 02 references it, the checker should recognize the execution-order dependency.
3. **Allowlist for known-valid patterns:** Maintain a list of known GSD tool subcommands, config keys, and directory patterns. The checker validates AGAINST THE ALLOWLIST, not against the live filesystem/tool. The allowlist is updated when tools change. This makes validation deterministic.
4. **Progressive rollout:** Ship semantic validation as a reporting feature first (shows findings in checker output but does not affect pass/fail status). After 1-2 milestones of observation, promote reliable checks to warning/blocker severity.
5. **The "plan checker misses things" signals should be addressed separately:** The fix for "checker misses wrong subcommands" is a curated subcommand allowlist, not dynamic tool invocation. The fix for "checker misses non-existent config keys" is a config key registry derived from feature-manifest.json, not runtime config validation.

**Detection:**
- Plan checker rejects plans that would succeed
- User overrides checker findings repeatedly
- Checker blocker count increases but actual execution failures do not decrease
- Planner enters revision loops trying to satisfy checker's false findings

---

### Pitfall 6: Context Bloat from Auto-Generated Automation Artifacts

**What goes wrong:**
v1.17 adds several new automatic outputs:
- CI sensor reports (per-session CI status)
- Auto-collected signal files (per-phase)
- Auto-reflection reports (per N phases)
- Health check reports (per frequency setting)
- CI status warnings at SessionStart

Each of these generates artifacts that agents may need to read. The current system already has a context bloat history: signal-detection.md was 888 lines before a 7.6x reduction (to ~120 lines). The reflector loads index.md + all signal files + reflection-patterns.md + its own spec. Adding auto-generated CI reports, health check results, and more frequent reflection reports increases the amount of content competing for the agent's context budget.

The specific danger: auto-triggering means MORE operations run per session, and each operation leaves artifacts. Over time, the knowledge base grows faster. The index.md file grows. The reflector's context load increases. Quality degrades per the documented quality curve (agent-protocol.md Section 11: 50-70% = DEGRADING, 70%+ = POOR).

Anthropic's own context engineering guidance says: "Good context engineering means finding the smallest possible set of high-signal tokens." Auto-generated content directly opposes this principle by increasing token count without human curation of signal quality.

**Why it happens:**
Automation is additive by nature. Each auto-trigger adds output. Nobody removes output. The system has an "append everything" architecture (signals are files, reflections are files, health checks are reports). There is no garbage collection, no archival policy for auto-generated content, no automatic cleanup of stale CI reports.

**Consequences:**
- Reflector context load exceeds 50% budget threshold, entering quality degradation zone
- SessionStart hook takes longer as more checks run (CI status + health check + version check)
- KB index.md grows large enough that parsing it becomes expensive
- Auto-generated artifacts crowd out human-authored artifacts in relevance

**Prevention:**
1. **Token budget per auto-operation:** Each auto-triggered operation has a maximum output size. CI sensor report: max 500 tokens. Health check: max 200 tokens. Auto-collected signals: subject to existing per-phase cap of 10.
2. **TTL on auto-generated artifacts:** CI status reports expire after 24 hours (or next session). Health check results expire after the stale_threshold_days config value. Auto-reflection reports are overwritten daily (current behavior, good).
3. **Progressive disclosure for auto-content:** Auto-generated content should be accessible via command (e.g., `/gsd:ci-status`) but NOT auto-loaded into agent context. The CI sensor writes a summary file; agents read it only when relevant.
4. **Index pruning:** Implement archival policy for signals: signals in `verified` or `invalidated` lifecycle state are moved to an `archived/` directory after 10 phases. Archived signals are excluded from reflector loading but preserved for historical analysis.
5. **Measure before expanding:** Before adding auto-triggering, measure the current reflector context load (how many tokens does it consume reading 79 signals?). Set a ceiling: auto-triggering cannot increase reflector load beyond 40% of context budget. If it does, reduce auto-trigger frequency or archive old signals first.

**Detection:**
- Reflector agent's context usage exceeds 50% before it starts reasoning
- SessionStart takes >10 seconds due to accumulated hook operations
- KB index.md exceeds 500 lines
- Signal count per project exceeds 150 without archival

---

## Moderate Pitfalls

---

### Pitfall 7: Hook Process Races Between Auto-Trigger and User Commands

**What goes wrong:**
Auto-triggered operations (collect-signals, health-check, CI sensor) run as background processes via hooks. If a user invokes a GSD command while an auto-triggered operation is still running, they can collide:
- Two processes writing to the KB simultaneously (signal collection + manual `/gsd:signal`)
- Health check reading config.json while execute-phase is updating STATE.md
- CI sensor running `gh` commands while user runs `gh pr create`
- Index rebuild triggered by auto-collect-signals overlaps with index rebuild triggered by manual reflect

The existing concern from CONCERNS.md: "Orphaned Hook Registration Cleanup Race Condition" -- if install fails mid-process, orphaned entries remain. The same pattern applies to auto-triggered operations that crash mid-execution.

**What goes wrong:**
Race conditions in file-based systems are subtle. Two processes can both check if a file exists, both see it does not, and both attempt to create it. The knowledge-store.md says "Entry files have unique IDs preventing write collisions" -- but this only prevents two NEW signals from colliding. It does not prevent a signal write and an index rebuild from colliding.

**Prevention:**
1. **Advisory lockfile for KB operations:** `~/.gsd/.kb-operation.lock` created before any KB write, removed after. Other operations check the lock and retry or skip.
2. **Background hooks should be non-destructive:** Auto-triggered hooks should READ and REPORT but not WRITE. The actual KB writes happen when the user explicitly confirms or when the session is interactive. This prevents background writes from racing with foreground operations.
3. **Queue pattern instead of parallel execution:** If multiple auto-triggers fire in sequence (SessionStart triggers CI check AND health check AND version check), they should run SEQUENTIALLY, not in parallel. The hook system should chain them, not fan them out.
4. **Idempotent operations:** All auto-triggered operations should be idempotent. Running collect-signals twice for the same phase should produce the same result. Running health-check twice should not create duplicate signals.

**Detection:**
- Corrupted index.md (missing entries, duplicate entries)
- Signal files partially written (truncated YAML frontmatter)
- Health check and collect-signals run simultaneously and produce conflicting reports
- Git status shows unexpected unstaged files from background operations

---

### Pitfall 8: CI Sensor Interprets Bypassed Branch Protection as Always-Wrong

**What goes wrong:**
The CI sensor is designed to detect "bypassed branch protection" as a signal. But in this project, admin push bypass has been the NORMAL workflow for months (5 consecutive bypasses during v1.16 alone). If the sensor treats every admin bypass as a negative signal, it will generate constant noise for a pattern that the team has accepted as a workflow.

More broadly, the CI sensor needs to distinguish between:
- **Legitimate bypass:** Hotfix pushed directly to main, admin merge for known-failing CI (the v1.16 pattern where CI was broken by a test bug, not by bad code)
- **Problematic bypass:** Code pushed without review, skipping failing tests that indicate real bugs
- **Expected CI failure:** CI fails because tests check `.claude/` which does not exist in CI (a test bug, not a code bug)

Without this distinction, the CI sensor produces signals that say "CI was bypassed" without context about WHY it was bypassed. These signals clutter the KB and erode trust in the sensor.

**Prevention:**
1. **Configurable bypass policy:** `devops.bypass_policy: ["annotated-ok", "hotfix-ok", "never"]`. If "annotated-ok", bypasses with commit messages containing `[bypass: reason]` are classified as trace (not persisted). Only unexplained bypasses generate notable+ signals.
2. **CI failure classification:** Before reporting "CI failed," the sensor should check: is the failure in a known-broken test? Is it a new failure? Is it a regression? Only new failures and regressions should generate notable+ signals.
3. **Rolling CI health window:** The sensor should track CI pass/fail trend over the last N runs, not just the most recent. "CI has been failing for 5 runs" is more informative than "CI failed" repeated 5 times.
4. **Pair with the wiring test fix:** Fix the `.claude/` test directory issue BEFORE enabling the CI sensor. Otherwise, the sensor's first output will be "CI is failing" -- because of the test bug it was supposed to help detect.

**Detection:**
- CI sensor generates 5+ identical signals about the same CI failure
- Bypass signals without actionable information (just "branch protection was bypassed")
- Team ignores CI sensor output because it is always reporting the same known issue

---

### Pitfall 9: Health Check Hook Frequency Mismatch with Config Expectations

**What goes wrong:**
The health_check feature manifest defines frequency values: `milestone-only`, `on-resume`, `every-phase`, `explicit-only`. v1.17 proposes implementing `on-resume` via SessionStart hook and `every-phase` via execute-phase workflow postlude.

The mismatch: SessionStart fires at the beginning of every Claude Code session, not just when resuming a project. If a user opens Claude Code to do non-GSD work, the health check still runs. If a user opens multiple sessions (e.g., one for code, one for research), both trigger health checks. The "on-resume" semantic implies "when returning to the project after absence" but SessionStart fires on EVERY session start.

Additionally, "every-phase" as an execute-phase postlude means the health check runs AFTER execution but BEFORE the user can act on the results. If the health check finds issues, the user is informed after their phase is already complete -- not before execution when they could have fixed it.

**Prevention:**
1. **Session dedup for on-resume:** Check if a health check has already run in the last N hours (configurable, default: 4 hours). If so, skip. This prevents multiple sessions from running redundant checks.
2. **Pre-execution health check for every-phase:** If frequency is "every-phase", run the health check BEFORE execute-phase, not after. This lets the user address issues before committing to execution.
3. **Non-GSD session detection:** If `.planning/` does not exist in the current directory, skip health check entirely. This prevents health checks from running in non-project directories.
4. **Lightweight SessionStart check:** The SessionStart hook should run a MINIMAL health check (KB exists? Config valid?), not the full check suite. Full checks run on explicit invocation or at the appropriate frequency trigger.

**Detection:**
- Health checks running in non-GSD project directories
- Duplicate health check signals from multiple sessions on the same day
- "Every-phase" health check findings that arrive too late to be actionable

---

## Minor Pitfalls

---

### Pitfall 10: New Hook Scripts Not Built Before Testing

**What goes wrong:**
Hooks in this project use a build step (`npm run build:hooks` compiles `hooks/*.js` to `hooks/dist/*.js`). New hook scripts added for CI sensor or auto-triggering must also be built. If a developer adds a hook source file but forgets to update the build script and CI workflow, the hook works locally (source is used) but fails in CI or after `npm install` (dist is expected).

**Prevention:**
- Add any new hook to the `build:hooks` script in package.json
- CI already runs `npm run build:hooks` before tests (line 30 of ci.yml) -- verify new hooks are included
- Test with `npm run build:hooks && diff hooks/src.js hooks/dist/src.js` pattern

---

### Pitfall 11: Auto-Trigger Config Not Reflected in Feature Manifest

**What goes wrong:**
New auto-trigger config keys (e.g., `auto_collect_signals: true`, `reflection_frequency: "every-3-phases"`, `ci_sensor_enabled: true`) must be added to both:
1. `get-shit-done/feature-manifest.json` (schema, defaults, init_prompts)
2. `.planning/config.json` template (runtime config)

If config keys are added to the code but not the manifest, `/gsd:new-project` will not prompt for them, `/gsd:settings` will not show them, and the plan checker cannot validate them. This is the same pattern as the v1.16 tech debt item: "Config key inconsistency: spike_sensitivity (flat) vs spike.sensitivity (nested)."

**Prevention:**
- For every new config key, add to feature-manifest.json FIRST, then reference from code
- The manifest is the schema of truth for all config keys
- Add a wiring test: "all config keys referenced in workflows exist in feature-manifest.json"

---

### Pitfall 12: `npm pack --dry-run` Misses New Agent/Reference Files

**What goes wrong:**
This is a three-time recurring bug in this project. New files added to `agents/`, `get-shit-done/references/`, or `hooks/` may not be included in the npm package if the `files` field in package.json does not cover them. The installer then copies nothing for those files, and `.claude/` has stale or missing content.

v1.17 will likely add: a CI sensor agent (`agents/gsd-ci-sensor.md`), new hook scripts, new references, and possibly new workflow files. Each must be covered by package.json `files` patterns.

**Prevention:**
- After adding any new file to `agents/`, `get-shit-done/`, or `hooks/`, run `npm pack --dry-run` and verify the file appears
- Add this check to the verification step of every phase that creates new files
- Consider adding a test: "all .md files in agents/ appear in npm pack output"

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| CI wiring test fix | Fix is trivial but testing it requires CI run | Push fix first, verify CI passes BEFORE starting other phases | Blocker if skipped |
| CI sensor implementation | `gh` auth missing in user environments | Pre-flight auth check + graceful degradation config | Critical -- first-use experience |
| Auto-collect-signals hook | Feedback loop with reflection | Reentrancy guard lockfile + source tagging on triggers | Critical -- can burn token quota |
| Auto-reflection trigger | Runs reflection in wrong context (no signals to analyze) | Check signal count threshold before triggering | Moderate -- wasted tokens |
| Health check SessionStart hook | Runs in non-GSD directories, runs redundantly | Directory check + session dedup | Moderate -- user annoyance |
| Plan checker semantic validation | False rejections block valid plans | Advisory mode only, allowlist-based validation | Critical -- blocks execution |
| Hook cross-runtime degradation | Features silently missing on OpenCode/Codex | Command-invocation fallback paths for all auto-triggers | Moderate -- feature parity |
| New hook build step | Hook source not compiled to dist | Update build:hooks script, verify in CI | Minor -- caught by CI |
| Config key additions | Keys not in feature manifest, inconsistent naming | Manifest-first development, naming convention check | Minor -- but compounds |
| npm pack coverage | New files missing from package | npm pack --dry-run verification per phase | Minor -- but three-time recurrence |

---

## Integration Risk Matrix

How v1.17 components interact and where integration bugs are most likely.

| Component A | Component B | Risk | Specific Concern |
|-------------|-------------|------|------------------|
| Auto-collect-signals | Auto-reflect | HIGH | Feedback loop: collect triggers reflect triggers collect |
| CI sensor | SessionStart hook | MEDIUM | Auth failure blocks session start; timeout on network |
| Health check hook | execute-phase | MEDIUM | Running order: health check should be PRE-execution, not post |
| Plan checker semantic | feature-manifest | MEDIUM | Checker validates against manifest; manifest must be updated first |
| Any auto-trigger | OpenCode/Codex | MEDIUM | Silent degradation; no hook system available |
| CI sensor | wiring-validation tests | HIGH | If CI is broken when sensor is added, sensor immediately generates noise |
| Auto-collect-signals | KB index | MEDIUM | Concurrent writes during auto-collection can corrupt index |
| Multiple SessionStart hooks | User experience | LOW | Cumulative latency: version check + CI check + health check |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in v1.17 but are missing critical pieces.

- [ ] **Auto-collect-signals hook:** Often missing reentrancy guard -- verify that reflection output cannot re-trigger collection
- [ ] **CI sensor:** Often missing `gh` auth pre-flight check -- verify sensor degrades gracefully without authentication
- [ ] **Wiring test fix:** Often only fixes one test but not the pattern -- verify NO test in the suite uses `.claude/` as primary assertion path
- [ ] **Health check hook:** Often missing session dedup -- verify health check does not run multiple times per day on same project
- [ ] **Plan checker semantic validation:** Often missing temporal awareness -- verify checker does not reject plans referencing files that will be created during execution
- [ ] **Cross-runtime fallback:** Often missing fallback path for hookless runtimes -- verify every auto-trigger has a command-invocation equivalent
- [ ] **Config additions:** Often missing from feature-manifest.json -- verify every new config key has manifest entry with schema, default, and init_prompt
- [ ] **npm pack coverage:** Often missing new files -- verify `npm pack --dry-run` includes all new agents, references, hooks, and workflows
- [ ] **Build step for new hooks:** Often missing from build:hooks script -- verify new hook .js files are compiled to hooks/dist/
- [ ] **Lockfile cleanup:** Often missing cleanup on crash -- verify `.auto-trigger.lock` has a staleness check (remove if older than 30 minutes)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Feedback loop burns context | LOW | Kill the session. Remove `.auto-trigger.lock` if stale. Add reentrancy guard. Restart. |
| CI sensor auth failure | LOW | Add `gh auth login` to setup docs. Set `ci_sensor_enabled: false` as stopgap. |
| Wiring test false failure in CI | LOW | Fix test to use `agents/` path. Push fix. Verify CI passes. Known pattern -- 10 minute fix. |
| Hook-based feature missing on OpenCode | MEDIUM | Add command-invocation fallback. Requires workflow modifications to all auto-triggered features. |
| Plan checker false rejections | LOW | Downgrade semantic checks from blocker to info severity. Restore checker to structural-only mode. |
| Context bloat from auto-artifacts | MEDIUM | Implement archival policy. Move old signals to `archived/`. Reduce auto-trigger frequency. Prune index. |
| Hook race condition corrupts KB | MEDIUM-HIGH | Restore KB from git history. Add lockfile mechanism. Make all auto-triggers idempotent. |
| Config key not in manifest | LOW | Add key to feature-manifest.json. Run `node bin/install.js --local`. 5-minute fix. |
| npm pack missing files | LOW | Add file patterns to package.json `files`. Run `npm pack --dry-run`. Known three-time recurrence -- well-understood fix. |

---

## The Meta-Pitfall: Automating a System That Cannot Observe Its Own Failures

The v1.16 CI failure pattern is the defining cautionary tale for v1.17. The system had tests. The tests failed. CI ran the tests. CI reported failures. Nobody looked. The system's own signals (designed to detect process failures) did not detect the CI failure because signal collection is manual. The fix (auto-triggering) only works if the auto-trigger mechanism itself is monitored.

**The recursive problem:** Who monitors the auto-trigger? If the CI sensor detects "CI is failing" but the auto-trigger mechanism itself is broken (hook not registered, auth expired, lockfile stale), the sensor never runs. The system that was built to prevent unobserved failures has an unobserved failure mode.

**Concrete mitigation:** The FIRST auto-trigger to implement should be the simplest, most observable one: a SessionStart message that says "Last CI run: [PASS/FAIL/UNKNOWN]." This does not require `gh` auth (it can read a cached file from the last `gh run list`). It does not write to the KB. It does not trigger anything else. It just INFORMS. If this simple observable mechanism works reliably, build more complex auto-triggers on top of it. If it does not work reliably, debug it before adding complexity.

**Litmus test for v1.17 success:**
1. CI is green on main branch (the wiring test fix worked)
2. The CI sensor detects at least one CI issue that would have gone unnoticed without it
3. Auto-collect-signals runs after at least one phase WITHOUT triggering a feedback loop
4. Health check runs at the configured frequency on Claude Code AND degrades gracefully on OpenCode
5. Plan checker semantic validation produces zero false rejections across all v1.17 phases

---

## Sources

- [Event-driven architecture patterns and anti-patterns](https://www.growin.com/blog/event-driven-architecture-scale-systems-2025/) -- loop prevention, event handler isolation [MEDIUM confidence -- industry patterns]
- [Web browser event loop design](https://www.bennadel.com/blog/2075-learning-event-driven-programming-best-practices-from-web-browsers.htm) -- reentrancy prevention in event handlers [HIGH confidence -- established pattern]
- [GitHub Agentic Workflows authentication](https://github.github.com/gh-aw/reference/auth/) -- `gh` CLI auth requirements for CI integration [HIGH confidence -- official documentation]
- [GitHub Agentic Workflows security](https://www.theregister.com/2026/02/17/github_previews_agentic_workflows/) -- risks of giving AI agents repository access [MEDIUM confidence -- industry reporting]
- [Multi-agent workflow failure modes](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) -- error propagation, schema drift, typed contracts [HIGH confidence -- GitHub Engineering blog]
- [Anthropic context engineering guide](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) -- progressive disclosure, context isolation, token-efficient tools [HIGH confidence -- Anthropic official]
- [Context bloat and compression strategies](https://arxiv.org/abs/2601.07190) -- active context compression, autonomous memory management [MEDIUM confidence -- arxiv preprint]
- [Sherlock: Reliable agentic workflow execution](https://arxiv.org/pdf/2511.00330) -- verification-aware planning, error propagation in multi-step agents [MEDIUM confidence -- arxiv paper]
- Existing codebase analysis: wiring-validation.test.js, capability-matrix.md, execute-phase.md, collect-signals.md, reflect.md, health-check.md, feature-manifest.json, install.js, gsd-plan-checker.md [HIGH confidence -- primary source]
- Signal `sig-2026-03-02-ci-failures-ignored-throughout-v116` -- 5 consecutive CI failures bypassed via admin push [HIGH confidence -- internal signal]
- Signal `sig-2026-03-01-plan-checker-misses-tool-api-assumptions` -- plan checker passes plans with wrong tool subcommands [HIGH confidence -- internal signal]
- Signal `sig-2026-03-01-plan-checker-misses-second-order-effects` -- plan checker misses semantic errors [HIGH confidence -- internal signal]
- v1.17 deliberation document -- proposed features, dependency graph, open questions [HIGH confidence -- primary planning source]
- CLAUDE.md dual-directory architecture warning -- three-time recurrence of source/install parity bugs [HIGH confidence -- documented pattern]

---

*Pitfalls research for: v1.17 Automation Loop*
*Researched: 2026-03-02*
