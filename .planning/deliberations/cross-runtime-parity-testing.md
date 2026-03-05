# Deliberation: Cross-Runtime Parity Testing Strategy

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-05
**Status:** Adopted
**Trigger:** Conversation observation during Phase 39 CI awareness execution. While reviewing CI test coverage, investigation revealed multi-runtime tests verify installation layout and path transformation but use low assertion bars that wouldn't catch silent feature gaps across runtimes. Further investigation uncovered a real shipping bug (gsd-ci-status.js missing from build-hooks.js hardcoded list).
**Affects:** All future phases that add hooks, agents, workflows, or commands; multi-runtime test infrastructure
**Related:**
- sig-2026-03-05-multi-runtime-parity-testing-gap
- tests/integration/multi-runtime.test.js (Phase 17, v1.14)
- tests/integration/cross-runtime-kb.test.js (Phase 17, v1.14)
- scripts/build-hooks.js (hardcoded HOOKS_TO_COPY array)

## Situation

GSD Reflect supports 4 runtimes: Claude, OpenCode, Gemini, and Codex. The installer (`bin/install.js`) handles path transformation, command format conversion (.md → .toml for Gemini, SKILL.md for Codex), tool name remapping (Read → read_file for Gemini), and runtime-specific exclusions (no hooks for Codex, AGENTS.md composite instead of individual agent files for Codex).

Existing tests (built in Phase 17, v1.14) verify:
- Directory layout after install (correct dirs exist)
- Path transformation (no leaked ~/.claude/ in non-Claude runtimes)
- Command format conversion (Claude .md, OpenCode flat .md, Gemini .toml, Codex SKILL.md)
- KB accessibility (shared ~/.gsd/knowledge/, Claude symlink, cross-runtime signals)
- VERSION consistency across runtimes

But they use low assertion thresholds: `>= 1` for agents, `>= 3` for commands. A new agent or hook could be added for Claude and silently not ship for other runtimes, and all tests would still pass.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| multi-runtime.test.js assertions | Uses `dirHasGlobFiles(..., 1)` and `toBeGreaterThanOrEqual(3)` — wouldn't detect missing agents or commands | Yes (read test file) | sig-2026-03-05-multi-runtime-parity-testing-gap |
| `--all --global` install to temp dir | Actual parity is good: agents 19/19/19/0(codex), workflows 37 all, refs 25 all, templates 24 all, commands 36 all | Yes (ran install, counted) | informal |
| hooks/dist/ contents | Only 3 hooks in dist (check-update, statusline, version-check). gsd-ci-status.js missing despite being in hooks/ source | Yes (ls hooks/dist/) | **immediate fix needed** |
| scripts/build-hooks.js | Hardcoded `HOOKS_TO_COPY` array — new hooks must be manually added | Yes (read file) | informal |
| OpenCode hooks after install | OpenCode gets 3 hooks (same as Claude, Gemini). Only Codex has 0. | Yes (installed, checked) | informal — corrects earlier assumption |
| No cross-runtime workflow/reference count test | No test compares file counts across runtimes | Yes (grep'd test files for count comparisons) | informal |

### Bug Found During Investigation

`scripts/build-hooks.js` has a hardcoded `HOOKS_TO_COPY` array:
```javascript
const HOOKS_TO_COPY = [
  'gsd-check-update.js',
  'gsd-statusline.js',
  'gsd-version-check.js'
];
```

The new `gsd-ci-status.js` hook (Phase 39-02) is NOT in this list. The installer's `configureSettings()` registers the hook in settings.json, but `build-hooks.js` never copies the file to `hooks/dist/`, so it never gets installed for global installs. This means:
- **Global installs:** settings.json references a hook file that doesn't exist → error on every session start
- **Local installs (`--local`):** hooks are copied from source `hooks/` dir directly, so they work fine
- **This is exactly the class of bug that parity tests should catch**

Root cause: two independent lists that must stay in sync — `HOOKS_TO_COPY` in build-hooks.js and the hook registration in install.js `configureSettings()`. No test validates they agree.

## Framing

**Core question:** What testing strategy gives genuine confidence that all runtimes receive functionally equivalent capabilities — without creating a brittle test suite that breaks on every intentional runtime divergence?

**Adjacent questions:**
- Should `build-hooks.js` use a glob instead of a hardcoded list (eliminate the sync problem)?
- What's the right abstraction level for parity tests — file counts, file names, content hashes, or semantic equivalence?
- How do we handle intentional divergences (Codex no agents/ dir, Gemini .toml) without making tests that ignore real gaps?
- Should hooks have a parity test that validates build-hooks.js output matches what configureSettings() registers?

## Analysis

### Option A: Count Parity (lightweight)

- **Claim:** Add a single test that installs `--all`, counts files per category per runtime, and asserts counts match (with documented exceptions for intentional divergences like Codex agents)
- **Grounds:** The actual parity investigation showed counts already match (19/37/25/24/36). A count assertion would catch the most common failure mode: "added a file for Claude, forgot to make it available for others." The gsd-ci-status.js bug would be caught by "Claude hooks: 4, OpenCode hooks: 3 → FAIL"
- **Warrant:** Most parity failures are omission errors (forgot to add/copy), not transformation errors. Count checks are cheap, stable, and only break when something is genuinely wrong. Low maintenance burden.
- **Rebuttal:** Counts don't catch content issues. A hook file could be copied but contain Claude-specific paths. Also doesn't catch the build-hooks.js sync problem directly (local installs would still show correct counts). Would need to test from `hooks/dist/` specifically.
- **Qualifier:** Probably sufficient for the current scale. Would catch 80%+ of real parity bugs.

### Option B: Name Parity (medium)

- **Claim:** Compare file names (extension-stripped) across all runtimes per category. Assert exact same set of names with an explicit exception list for intentional divergences.
- **Grounds:** Goes beyond count — catches cases where the count matches but a file was renamed or replaced in one runtime. Extension stripping handles the .md/.toml divergence naturally.
- **Warrant:** Name parity subsumes count parity and catches substitution errors (wrong file shipped) in addition to omission errors. The exception list documents intentional divergences explicitly.
- **Rebuttal:** Slightly more brittle — adding a runtime-specific file requires updating the exception list. But this is arguably a feature: it forces you to think about whether a new file should be runtime-specific or universal. Doesn't catch content-level issues (Claude tool names in Gemini files).
- **Qualifier:** Probably the best cost/benefit sweet spot. Catches real bugs, low false positive rate, documents divergences.

### Option C: Content Parity + Semantic Checks (heavyweight)

- **Claim:** Beyond name parity, add content assertions: no Claude tool names (Read, Bash, Write) in Gemini body text, no ~/.claude/ paths in non-Claude files, hook registration matches hook file existence.
- **Grounds:** The existing `verifyNoLeakedPaths()` already does path checking. Tool name transformation is tested for one agent (gsd-planner.md) but not systematically. The build-hooks.js sync bug is a content/registration mismatch that name parity alone wouldn't catch.
- **Warrant:** These are the bugs that cause runtime failures — a file exists but contains wrong content. They're harder to detect manually and higher-impact when they ship. The Gemini tool name test already exists for one file; extending it to all agents is straightforward.
- **Rebuttal:** Risk of false positives if tool names appear in documentation/comments (e.g., "similar to the Read tool in Claude Code"). Maintenance overhead if tool name mapping changes. Hook registration sync test is specific to one bug — may be over-fitting.
- **Qualifier:** The tool name and path checks are high-value. The hook registration sync is targeted but prevents a specific class of bug. Worth doing selectively, not exhaustively.

### Option D: Eliminate Sync Points (structural)

- **Claim:** Instead of testing that hardcoded lists stay in sync, eliminate the hardcoded lists. Make `build-hooks.js` glob for `gsd-*.js` in `hooks/`. Make hook registration dynamic (discover which hooks exist in dist/ and register them).
- **Grounds:** The root cause of the gsd-ci-status.js bug is two lists that must agree. Tests can catch the disagreement, but eliminating the sync point prevents the entire class of bug. Similar to how sensor discovery uses a glob (`gsd-*-sensor.md`) instead of a hardcoded list.
- **Warrant:** Structural prevention > testing for detection. If new hooks are automatically built and registered, adding a hook is a single-file change instead of a 3-file change (hook source + build list + settings registration).
- **Rebuttal:** Auto-discovery of hooks is risky — a test file or WIP hook in the hooks/ directory could accidentally get built and registered. The hardcoded list acts as an explicit "ship this" gate. Could mitigate with a naming convention (gsd-*.js = ship) and a .wip suffix for in-progress hooks.
- **Qualifier:** Presumably the right long-term direction, but requires care to avoid shipping unfinished hooks.

## Tensions

1. **Explicit control vs. automatic discovery:** Hardcoded lists prevent accidental shipping but create sync bugs. Globs prevent sync bugs but risk shipping WIP. The sensor architecture already chose globs (EXT-06) — hooks could follow the same pattern.

2. **Test depth vs. maintenance cost:** Deeper tests catch more bugs but break more often on intentional changes. The sweet spot depends on how often parity bugs actually occur vs. how often the test suite needs updating.

3. **Testing the build vs. testing the install:** The gsd-ci-status.js bug exists in the build step (hooks/dist/), not the install step. A test that installs locally would pass (hooks copied from source). A test that checks hooks/dist/ specifically would catch it. This means parity tests need to test the **published artifact**, not just the local dev path.

4. **Prescriptive exceptions vs. descriptive:** Option B requires an explicit exception list. This is documentation-as-code but requires maintenance. Alternatively, exceptions could be derived from installer config (e.g., "Codex skips agents → don't assert agents for Codex").

## Recommendation

**Current leaning:** Option B (Name Parity) + targeted parts of Option C (tool name check for all Gemini agents, hook registration-vs-existence sync) + Option D for build-hooks.js specifically (glob instead of hardcoded list).

This gives:
- **Name parity** catches omission/substitution across all runtimes
- **Tool name check** catches the most impactful content bug (Claude tool names in Gemini)
- **Hook build glob** eliminates the specific sync point that caused the Phase 39 bug
- **Hook registration sync test** catches mismatches between settings.json and actual files

**Open questions blocking conclusion:**
1. Is the build-hooks.js glob approach safe given the hooks/ directory structure (has dist/ subdir, dist/ is gitignored)?
2. Should the parity test run against `hooks/dist/` (build output) or installed output (which includes local-install path)?
3. Is there value in testing parity for local (`--local`) installs separately from global (`--global`) installs?

## Predictions

<!--
Predictions make the deliberation falsifiable (Lakatos). If adopted, what should we
observe? If we don't observe it, the deliberation's reasoning was flawed.
Record predictions BEFORE implementation so they can't be retrofitted.
-->

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Name parity tests would have caught the gsd-ci-status.js build-hooks omission if they existed before Phase 39 | Simulate: run parity test against current hooks/dist/ — it should fail (3 in dist vs 4 in source) | Test passes despite the known discrepancy |
| P2 | Globbing build-hooks.js will prevent future hook-addition parity bugs | Next phase that adds a hook: the hook should appear in dist/ automatically without modifying build-hooks.js | A new hook is added and build-hooks.js must still be manually updated |
| P3 | Name parity tests will have < 2 false positive failures per milestone | Track over v1.17 remaining phases (39-43) | More than 2 test failures caused by intentional runtime divergences (not real bugs) |
| P4 | The combined test additions will add < 30 seconds to CI runtime | Measure CI time before and after | CI time increases by > 30 seconds |

## Decision Record

<!--
Filled when status moves to `concluded` or `adopted`.
Links the deliberation to the intervention that implements it.
-->

**Decision:** Adopt Option B (name parity) + targeted Option C (all-agent Gemini tool check, hook registration sync) + Option D (glob build-hooks.js). This combination eliminates the hardcoded hook list sync point, adds structural parity tests across all runtimes, and extends Gemini tool name validation to all agents.
**Decided:** 2026-03-05
**Implemented via:** Quick task 15 (cross-runtime parity testing)
**Signals addressed:** sig-2026-03-05-multi-runtime-parity-testing-gap

## Evaluation

<!--
Filled when status moves to `evaluated`.
Compare predictions against actual outcomes. Explain deviations.
-->

**Evaluated:** {pending}
