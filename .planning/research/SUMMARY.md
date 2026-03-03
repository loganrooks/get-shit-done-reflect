# Project Research Summary

**Project:** GSD Reflect v1.17 — Automation Loop
**Domain:** Agentic workflow automation — CI integration, hook-based lifecycle triggers, intelligent plan validation, automated reflection scheduling
**Researched:** 2026-03-02
**Confidence:** HIGH (all four research areas grounded in official docs, verified CLI behavior, and codebase analysis of the existing system)

## Executive Summary

GSD Reflect v1.17 closes the automation gap left by v1.16: everything the signal lifecycle can detect still requires a human to invoke collection, reflection, and health checks. The defining failure case is five consecutive CI failures that went unnoticed during v1.16 development because signal collection was never triggered. The v1.17 Automation Loop addresses this through four interlocking mechanisms: a CI sensor that queries GitHub Actions via the already-installed `gh` CLI, auto-trigger of signal collection as a workflow postlude in execute-phase, counter-based auto-reflection scheduling, and hook-level health check nudges at session start. Every capability is achievable with zero new npm dependencies — Claude Code's expanded hooks API (PostToolUse, Stop, SessionStart with matchers and decision control), the `gh` CLI, and additive extensions to gsd-tools.js are sufficient.

The recommended architecture draws a clear boundary: hooks handle lightweight, fast, side-effect-only operations (CI status display, health check nudge, session metrics), while workflow postlude steps handle heavyweight orchestration (signal collection, reflection). This boundary exists because hooks run synchronously in the main agent context, lack phase-level information, and cannot reliably orchestrate multi-agent workflows. The PostToolUse + Stop hook pattern documented in STACK.md is architecturally sound for state-flagging but should not be used to spawn signal collection directly — that path leads to feedback loops and context exhaustion.

The dominant risk for v1.17 is automated feedback loops: auto-collect-signals can trigger auto-reflect, which produces artifacts, which can re-trigger collection, silently burning through the context budget. This is addressed by a reentrancy lockfile (`~/.gsd/.auto-trigger.lock`), source-tagged triggers (only "phase-completion" sources allow collection, not "reflection-output"), and conservative defaults (`auto_reflect` defaults to false, threshold-gated). The second-order risk is that hooks are Claude Code-specific — OpenCode and Codex CLI users get zero auto-triggering without explicit command-invocation fallback paths. Every auto-trigger feature must ship with a workflow-level fallback that works on all runtimes.

## Key Findings

### Recommended Stack

The technology stack for v1.17 requires zero new npm dependencies. The entire feature set is achievable through Claude Code's hooks API (PostToolUse with Write matcher, Stop with blocking decision control, SessionStart with source discrimination), Node.js standard library for hook scripts, the `gh` CLI (v2.86.0 verified installed) for CI data, and additive subcommands in gsd-tools.js for semantic validation. The dual-directory architecture constraint (edit `hooks/` and `agents/` source, never `.claude/`) applies to all new files.

**Core technologies:**
- `gh` CLI (v2.86.0): CI data source — pre-installed, authenticated, returns structured JSON via `--json` flag, zero npm dependency
- Claude Code PostToolUse hook (Write matcher): SUMMARY.md detection — fires after every Write, lightweight file-path check only, sets state flag for Stop hook to read
- Claude Code Stop hook (blocking decision): Phase completion gate — checks state flags, blocks stop with `decision: "block"` + reason, must check `stop_hook_active` to prevent infinite loops
- Claude Code SessionStart hook (source field): Session-start CI warning — discriminates "startup" vs "resume", spawns background `gh run list` check, writes cache file, non-blocking
- Node.js `child_process` + `fs`: All hook scripts — existing pattern from `gsd-check-update.js`, no new APIs needed
- gsd-tools.js (extended): Plan checker semantic validation — new `verify tool-refs`, `verify config-refs`, `verify file-refs` subcommands, additive to existing `verify` pattern

### Expected Features

The FEATURES.md analysis distinguishes seven table-stakes items from differentiators and explicit anti-features. The wave dependency structure maps directly to a phase order.

**Must have (table stakes):**
- TS-7: Fix CI wiring test — `wiring-validation.test.js` checks `.claude/agents/` in CI (which does not exist); must check `agents/` source dir; must be first to unblock CI green
- TS-3: CI status at session start — SessionStart hook, highest user visibility, lowest complexity, makes CI failure visible before more work is committed
- TS-2: CI sensor (GitHub Actions) — new `gsd-ci-sensor.md` agent following artifact-sensor/git-sensor pattern; uses `gh run list`; requires `gh` auth pre-flight with graceful degradation
- TS-1: Auto-trigger signal collection — execute-phase workflow postlude step, respects `signal_collection.auto_collect` config (default: true)
- TS-4: Health check auto-trigger — SessionStart hook with session dedup; execute-phase workflow step for `every-phase` frequency; nudge pattern (`additionalContext`), not forced execution
- TS-5 + TS-6: Plan checker semantic validation — tool subcommand existence (Dimension 8), config key validity (Dimension 9); advisory mode only to prevent false rejections

**Should have (differentiators):**
- D-1: Auto-trigger reflection after N phases — counter in config.json, checked by Stop hook, threshold-gated (default: 3 phases), opt-in (`auto_reflect: false` default)
- D-6: Configurable auto-trigger opt-out — `auto_collect`, `auto_reflect`, `ci_sensor_enabled` config keys; respects existing `explicit-only` frequency pattern
- D-4: Plan checker directory existence validation — advisory only, temporal awareness required (do not reject paths that will be created by plan execution)

**Defer to later phases within milestone (or v1.18):**
- D-2 (branch protection bypass detection): Extension of CI sensor, secondary priority; bypass policy config needs design before implementation
- D-3 (test regression detection): Requires parsing CI run logs, medium complexity
- D-5 (cross-plan signal validation): Requires signal KB index access during plan-phase
- D-7, D-8 (hook-based triggering alternatives): Workflow postlude is simpler and recommended over PostToolUse-based orchestration

**Explicitly out of scope (anti-features):**
- Real-time CI webhook listener (requires server process — GSD is a CLI tool)
- Auto-remediation without human judgment (premature automation, risks masking root causes)
- Log sensor, metrics sensor (M-B milestone scope, require separate spikes)
- Plan checker code quality assessment (CI's job, not plan checker's)
- Continuous background CI monitoring during sessions (marginal value, API rate limit cost)

### Architecture Approach

The architecture preserves the existing layered structure (Command -> Workflow -> Agent -> Knowledge Store, with Hook Layer operating alongside) and adds automation at the workflow layer, not the hook layer. Signal collection and reflection remain multi-agent orchestrations invoked as `Task()` calls within workflows. Hooks remain lightweight side-effect scripts. The CI sensor slots into the existing parallel-sensor pattern in `collect-signals.md` alongside artifact-sensor and git-sensor. Plan checker gains three new dimensions (8: Tool API Validity, 9: Config Key Validity, 10: Signal Awareness) but remains a single agent spec.

**Major components:**
1. `gsd-ci-sensor.md` (new agent) — CI/CD signal detection via `gh run list`; returns structured JSON with `## SENSOR OUTPUT` delimiters; follows existing sensor pattern strictly; writes nothing to KB; gracefully degrades when `gh` unavailable
2. `gsd-ci-check.js` / `gsd-auto-collect.js` / `gsd-stop-gate.js` (new hooks) — lightweight SessionStart background CI check, PostToolUse SUMMARY.md detection flag-setter, Stop gate checking pending flags; all < 50ms; all silent-fail on errors
3. `execute-phase.md` (modified workflow) — new `auto_collect_signals` step between `verify_phase_goal` and `update_roadmap`; spawns collect-signals workflow as `Task()` if `auto_collect: true`; command-invocation fallback for non-hook runtimes
4. `collect-signals.md` (modified workflow) — adds CI sensor to parallel spawn list; adds `auto_reflect` step at end if threshold met; both changes are config-guarded
5. `gsd-plan-checker.md` (modified agent) — Dimensions 8-10 added after existing 7 structural dimensions; receives triaged signals context from `plan-phase.md`; all new semantic findings are advisory severity (not blocker)

**Data flow for complete automation loop:**
```
Phase execution complete
  -> verify_phase_goal
  -> auto_collect_signals (if signal_collection.auto_collect: true)
      -> parallel: artifact-sensor, git-sensor, ci-sensor (NEW)
      -> gsd-signal-synthesizer (single KB writer, unchanged)
      -> auto_reflect (if auto_reflect: true AND signals >= threshold)
          -> gsd-reflector (existing)
  -> update_roadmap
  -> offer_next

Session start (parallel, non-blocking)
  -> gsd-ci-check.js (NEW — background CI status cache)
  -> gsd-health-check-quick.js (NEW — if frequency allows, nudge only)
  -> gsd-check-update.js (existing)
  -> gsd-version-check.js (existing)
```

### Critical Pitfalls

1. **Auto-triggering feedback loop** — Auto-collect fires after phase completion, auto-reflect fires after N signals, reflection produces artifacts that could re-trigger collection creating an infinite loop that silently burns context budget. Prevention: reentrancy lockfile at `~/.gsd/.auto-trigger.lock`; source-tagged triggers (only "phase-completion" sources may initiate collection, not "reflection-output"); `auto_reflect: false` default; session-scoped cooldown (one auto-reflect per session maximum); validate lockfile design before coding Phase 5.

2. **CI sensor assumes `gh` auth that does not exist** — `gh` requires authentication; first-time users, CI environments, and private repos will fail silently and report "no CI issues" when unable to check. The v1.16 pattern (5 failures undetected) will repeat for the detector itself. Prevention: `gh auth status` pre-flight before any sensor invocation; graceful degradation to empty signals with human-readable warning; `ci_sensor_enabled: false` default until auth is confirmed; never block session on `gh` failure.

3. **Wiring validation tests check wrong directory (known three-time recurrence)** — `wiring-validation.test.js` checks `.claude/agents/` which does not exist in CI (gitignored, installer-populated). This exact bug caused the 5 admin-bypassed failures in v1.16. Prevention: Fix this test FIRST before any other v1.17 work; change assertion to use `agents/` (npm source) as primary; add meta-test that no test file uses `.claude/` as primary assertion path; codify the rule in the test file header comment.

4. **Hook-based auto-triggers silently missing on OpenCode and Codex CLI** — PostToolUse, Stop, and SessionStart hooks are Claude Code-specific. OpenCode and Codex users get zero auto-triggering with no indication it is missing. Prevention: For every auto-trigger hook, add a command-invocation fallback in the corresponding workflow; map health_check frequency values to both hook triggers AND command triggers; document degradation explicitly in capability-matrix.md; test the degraded path explicitly.

5. **Plan checker semantic validation causes false rejections** — Semantic checks operate on current state, plans describe future state. A plan referencing a directory created during execution gets rejected because the directory does not exist yet. Prevention: Advisory mode only (info severity, not blocker) for all new semantic dimensions; allowlist-based validation (check against known subcommands/keys, not live filesystem); temporal awareness for intra-plan dependencies (task 1 creates, task 2 references is valid).

## Implications for Roadmap

The wave structure from FEATURES.md dependency analysis maps to phases. The principle: fix the broken foundation first, build independent capabilities next (can parallelize within waves), integrate them, then add the most expensive automation last.

### Phase 1: Foundation Fix — CI Test Wiring

**Rationale:** Five consecutive CI bypasses occurred because the test suite was broken and developers stopped trusting CI output. Any new code built on a broken CI foundation continues the pattern. This is a single-file fix with a known solution. PITFALLS.md rates this as "Blocker if skipped."
**Delivers:** Green CI on main branch; trust restored in test suite; admin bypass pressure removed; meta-test that prevents future test-path recurrence
**Addresses:** TS-7 (CI wiring test fix)
**Avoids:** Pitfall 3 (wiring tests checking wrong directory — three-time recurrence)
**Research flag:** No additional research needed. Known fix pattern, approximately 10-minute implementation, but must include the meta-test to prevent recurrence.

### Phase 2: CI Awareness — Session Start Hook + CI Sensor

**Rationale:** The two CI-facing features are logically grouped and partially independent. The SessionStart hook (TS-3) has no dependencies and delivers the highest-visibility, lowest-complexity win. The CI sensor (TS-2) has moderate complexity and requires `gh` auth pre-flight design. Building them together lets the statusline leverage the sensor's cache output and validates the `gh` CLI integration before it is embedded deeper in the automation loop.
**Delivers:** CI status visible at every session start before additional work is committed; CI sensor available for manual `/gsd:collect-signals` invocation and independent testing before Phase 5 wires it into auto-collection
**Addresses:** TS-2 (CI sensor), TS-3 (CI status at session start)
**Avoids:** Pitfall 2 (gh auth assumptions — sensor must ship with auth pre-flight and graceful degradation as first-class requirements, not afterthoughts)
**Stack uses:** `gh run list --json`, SessionStart hook with background spawn pattern identical to `gsd-check-update.js`, `gsd-statusline.js` CI indicator from cache file
**Research flag:** Standard patterns for hook scripts and sensor agent spec — no additional research needed. One design decision to resolve at planning time: confirm bypass policy design (D-2) is out of scope for this phase, defer to later phases or v1.18.

### Phase 3: Plan Intelligence — Semantic Validation

**Rationale:** Plan checker enhancements (TS-5, TS-6, D-4) are independent of the automation loop and can ship in parallel with CI work. Fixing the plan checker before auto-triggering is important: if auto-collect-signals reveals issues from bad plans, the plan checker should already catch them before execution burns context on plan errors.
**Delivers:** Plans referencing invalid tool subcommands or non-existent config keys surface as advisory findings at plan-check time without blocking valid plans; temporal awareness prevents false rejections for paths created during execution
**Addresses:** TS-5 (tool subcommand existence), TS-6 (config key validity), D-4 (directory existence, advisory)
**Avoids:** Pitfall 5 (semantic validation false rejections — must ship in advisory mode; allowlist-based not live-query)
**Architecture component:** Modified `gsd-plan-checker.md` with Dimensions 8-10; `plan-phase.md` passes triaged signals context to checker
**Research flag:** Standard patterns — additive changes to existing agent spec. Key implementation decision: allowlist-based vs live-query for tool subcommand validation. Recommendation confirmed by research: allowlist derived from gsd-tools.js source at validation time (deterministic, no subprocess needed).

### Phase 4: Health Check Wiring

**Rationale:** Health check automation (TS-4) requires hook infrastructure changes (new `gsd-health-check-quick.js` script) and workflow modifications. It is independent of both the CI sensor and plan checker. Placing it after Phase 3 means all structural changes are complete before adding new hook scripts, reducing the risk of dual-directory architecture errors propagating across multiple new files.
**Delivers:** Health issues surface at session start (nudge via `additionalContext`) and before phase execution (`every-phase` frequency as workflow step), instead of only on explicit invocation; session dedup prevents redundant checks across multiple simultaneous sessions
**Addresses:** TS-4 (health check auto-trigger)
**Avoids:** Pitfall 9 (session frequency mismatch — must implement session dedup via timestamp in config, and non-GSD directory check, before shipping)
**Stack uses:** SessionStart hook with `source` field discrimination ("startup" vs "resume" vs "clear"), `additionalContext` output JSON pattern, session dedup via last-run timestamp in `.planning/config.json`
**Research flag:** Standard hook patterns. Key design confirmed: nudge (`additionalContext`) for SessionStart, workflow step (inline execution) for `every-phase`. The lightweight hook script runs only KB-exists, config-valid, stale-artifact checks — not the full check suite.

### Phase 5: Auto-Collection Loop — Execute-Phase Postlude

**Rationale:** This is the primary automation feature. It depends on the CI sensor (Phase 2) being available so collection includes CI signals. It benefits from the plan checker (Phase 3) being accurate so signals reflect real execution issues, not plan errors. The reentrancy lockfile design must be resolved before coding because it has non-obvious edge cases.
**Delivers:** Signal collection runs automatically after every phase execution without manual `/gsd:collect-signals`; CI sensor output included; `auto_collect` config key (default: true) respects user opt-out; command-invocation fallback for OpenCode and Codex CLI runtimes
**Addresses:** TS-1 (auto-trigger signal collection)
**Avoids:** Pitfall 1 (feedback loop — auto-collect must NOT trigger reflection directly; that is Phase 6's responsibility with its own guards); Pitfall 4 (cross-runtime — workflow postlude approach works on all runtimes, unlike hook-only approach)
**Architecture component:** New `auto_collect_signals` step in `execute-phase.md`; CI sensor added to `collect-signals.md` parallel spawn list; both config-guarded
**Research flag:** Reentrancy lockfile design has non-obvious edge cases (stale locks on crash, location for multi-project setups, atomic creation on different OS implementations). Recommend explicit design decision in phase planning before coding: where does the lock live, how stale is "stale" (recommendation: 30-minute TTL), what happens on concurrent session starts.

### Phase 6: Auto-Reflection and Opt-Out Configuration

**Rationale:** Auto-reflection (D-1) must come last because it depends on auto-collection working correctly (Phase 5). Bundling configurable opt-out (D-6) in the same phase avoids a partial implementation where reflection auto-triggers but cannot be disabled. The Stop hook counter interaction needs explicit state machine design before coding to prevent the `stop_hook_active` infinite-loop risk.
**Delivers:** Reflection triggers automatically after N completed phases (configurable threshold, default 3, opt-in with `auto_reflect: false` default); all automation features have explicit config guards and opt-out mechanisms; capability-matrix.md updated with accurate runtime degradation documentation for all new features
**Addresses:** D-1 (auto-trigger reflection), D-6 (configurable opt-out)
**Avoids:** Pitfall 1 (feedback loop — auto-reflect must NOT trigger from KB artifact writes, only from the phase counter incrementing in execute-phase postlude); Pitfall 6 (context bloat — reflection is threshold-gated at minimum 3 signals, not per-phase)
**Architecture component:** Counter increment in execute-phase.md postlude after auto-collect-signals; Stop hook (`gsd-stop-gate.js`) checks counter vs threshold and blocks with reason; counter resets after reflection runs; `auto_reflect_threshold` config key in feature-manifest.json
**Research flag:** Counter persistence and Stop hook state interaction needs explicit state machine design. Resolve at planning time: (1) where does `phases_since_last_reflect` live (recommendation: `.planning/config.json` automation section); (2) exact Stop hook logic for `stop_hook_active: true` case (must exit 0 immediately to prevent infinite loop); (3) what happens if Stop gate fires but user is on OpenCode (no hooks, must degrade gracefully).

### Phase Ordering Rationale

- **Fix first (Phase 1):** The broken test suite eroded trust and caused 5 admin bypasses. Everything built afterward on a green CI has higher integrity and can be verified by CI automatically.
- **Independent features can parallelize (Phases 2-4):** CI awareness (Phase 2), plan intelligence (Phase 3), and health check wiring (Phase 4) are fully independent. In the plan wave structure, these can be executed as parallel waves within a milestone if resources allow.
- **Integration after components (Phase 5):** Auto-collection integrates the CI sensor into a workflow loop. Building it after the sensor exists means it can be tested with real CI data against real sensor output, not mocks.
- **Most expensive last (Phase 6):** Auto-reflection is the costliest operation (full reflector agent, KB reads, triage proposals, lesson distillation). Putting it last ensures the automation loop is proven stable before adding the highest-cost tier.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 5 (Auto-Collection Loop):** The reentrancy lockfile design has non-obvious edge cases. Recommend explicit design decision or a pre-phase spike on lockfile implementation before coding begins. The PostToolUse + Stop hook state flag passing also needs careful sequencing design to avoid the flag being checked before it is set.
- **Phase 6 (Auto-Reflection):** Counter persistence location and Stop hook blocking behavior have interaction effects that need an explicit state machine before coding. The `stop_hook_active` guard is documented but the trigger condition sequence (when does the counter increment? when does the gate check?) is not specified in the research.

Phases with standard patterns (skip research-phase):

- **Phase 1 (CI Test Fix):** Single known fix, well-understood pattern (check `agents/` not `.claude/agents/`), no new architecture. Run CI to confirm fix, then done.
- **Phase 2 (CI Awareness):** SessionStart hook pattern is verbatim copy of `gsd-check-update.js`. Sensor agent spec follows gsd-artifact-sensor.md and gsd-git-sensor.md patterns exactly. `gh` CLI commands are verified against real repo output.
- **Phase 3 (Plan Checker):** Additive changes to existing agent spec. Allowlist derivation from gsd-tools.js is mechanical. No new infrastructure, no new hook scripts.
- **Phase 4 (Health Check Wiring):** Hook script follows existing pattern. Key design decision (nudge vs force) already resolved by research. Session dedup logic is simple timestamp comparison.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `gh` CLI v2.86.0 installed and tested against real repo with actual JSON output verified. Claude Code hooks API verified against official docs (code.claude.com/docs/en/hooks, March 2026): all 17 hook events, JSON schemas, decision control, `stop_hook_active` behavior confirmed. Existing hook scripts (`gsd-check-update.js`, `gsd-statusline.js`) read directly from source as implementation templates. |
| Features | HIGH | Feature set grounded in concrete failure signals (5 CI bypasses, plan checker misses documented in KB signals), existing config schema (`health_check.frequency` already defined in feature-manifest.json), and hook capability constraints verified against official docs. Wave structure dependency graph validated against actual workflow code. |
| Architecture | HIGH | All existing components read directly from source. Integration points verified. Hook design principles derived from official docs and existing hook scripts. Data flow validated against `collect-signals.md` and `execute-phase.md` actual workflow code. Sensor pattern confirmed by reading `gsd-artifact-sensor.md` and `gsd-git-sensor.md`. |
| Pitfalls | HIGH | Six critical pitfalls grounded in actual incidents: wiring test is a three-time recurrence with specific test line numbers identified; CI bypass is a documented KB signal with run count and dates. Feedback loop risk grounded in event-driven systems literature and the specific architecture's trigger chains. Recovery strategies verified against codebase recovery paths. |

**Overall confidence:** HIGH

### Gaps to Address

- **Reentrancy lockfile design:** The exact implementation of `~/.gsd/.auto-trigger.lock` — staleness detection (30-minute TTL recommended), location for multi-project use (global `~/.gsd/` vs per-project `.planning/`), atomic creation — is identified as a risk but not fully specified. Resolve during Phase 5 planning or via a pre-phase design spike.

- **Stop hook counter interaction:** The state machine for "when does the Stop hook block (reflection pending) vs pass through (collection just ran)" needs explicit design before Phase 6 coding. The `stop_hook_active` guard is documented but the counter-reset logic sequence is not — specifically whether the counter resets before or after the Stop hook fires.

- **Health check quick-check scope:** ARCHITECTURE.md proposes specific checks (KB-exists, config-valid, stale-artifacts) for the SessionStart hook but the exact check list is not enumerated. Define during Phase 4 planning which health check dimensions run in the lightweight hook vs the full `/gsd:health-check` invocation, with explicit context budget estimates for the hook.

- **`gh` auth in CI itself:** If the CI sensor is invoked during the project's own GitHub Actions CI run (not just local sessions), it needs a `GITHUB_TOKEN` with `actions:read` scope. The default `GITHUB_TOKEN` may lack this. Design decision needed during Phase 2 planning: does the sensor ever run in CI context, or only in local sessions?

- **Configurable bypass policy design:** PITFALLS.md identifies that branch protection bypass detection (D-2) needs context to distinguish hotfixes from bad practice. The `devops.bypass_policy` config key is proposed but not yet in the feature manifest. Design decision needed before adding bypass detection: either include with context-aware classification in Phase 2, or explicitly defer to v1.18.

## Sources

### Primary (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — All 17 hook events, JSON input/output schemas, decision control patterns, `stop_hook_active` behavior; verified March 2026
- [GitHub CLI `gh run list`](https://cli.github.com/manual/gh_run_list) — JSON output fields, filtering flags; tested locally against `loganrooks/get-shit-done-reflect` repo and returned actual run data
- Existing codebase: `hooks/gsd-check-update.js`, `hooks/gsd-statusline.js`, `.claude/settings.json`, `agents/gsd-artifact-sensor.md`, `agents/gsd-git-sensor.md`, `get-shit-done/workflows/collect-signals.md`, `get-shit-done/workflows/execute-phase.md`, `agents/gsd-plan-checker.md`, `get-shit-done/feature-manifest.json`, `tests/integration/wiring-validation.test.js` — all read directly from source as primary evidence
- Internal signals: `sig-2026-03-02-ci-failures-ignored-throughout-v116`, `sig-2026-03-01-plan-checker-misses-tool-api-assumptions`, `sig-2026-03-01-plan-checker-misses-second-order-effects` — empirical failure documentation
- [Anthropic context engineering guide](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — context budget constraints, progressive disclosure patterns for auto-generated content

### Secondary (MEDIUM confidence)
- [Multi-agent workflow failure modes](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) — error propagation, typed contracts in sensor chains
- [Event-driven architecture patterns](https://www.growin.com/blog/event-driven-architecture-scale-systems-2025/) — feedback loop prevention, reentrancy patterns in event-driven systems
- [Claude Code Hooks Guide](https://claude.com/blog/how-to-configure-hooks) — Anthropic blog (treated as secondary vs official docs reference)

### Tertiary (LOW confidence)
- [Context bloat and compression strategies](https://arxiv.org/abs/2601.07190) — arxiv preprint on autonomous memory management; supports KB archival design but not validated against GSD's specific architecture

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*
