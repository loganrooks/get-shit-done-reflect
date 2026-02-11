# Phase 11: Test Suite Repair & CI/CD Validation - Research

**Researched:** 2026-02-11
**Domain:** Test infrastructure (vitest, node:test), CI/CD (GitHub Actions), wiring validation
**Confidence:** HIGH

## Summary

This phase's primary domain is test suite health and CI/CD pipeline validation after the Phases 7-10 upstream merge and architecture migration. Research focused on discovering the current state of all test suites, CI workflows, the thin orchestrator pattern, and identifying what actually needs repair versus what already works.

The key finding is that the test suites are in significantly better shape than anticipated. All 42 vitest tests pass (plus 4 skipped e2e tests). All 75 upstream gsd-tools tests pass (note: the actual count is 75, not 63 as stated in prior planning documents -- the test file grew during Phase 10 with init --include flag and other new command tests). The wiring validation test already validates @-references, subagent_type mappings, KB templates, and reflect-specific commands. However, it does not yet validate the thin orchestrator pattern (commands delegating to workflows), which is the core requirement for TEST-03.

**Primary recommendation:** Focus this phase on (1) updating wiring validation for thin orchestrator delegation, (2) adding fork-specific gsd-tools tests for custom config fields, (3) validating CI/CD workflows run correctly on the sync branch, and (4) updating the install test to cover merged installer behavior. The test repair work is much smaller than initially scoped.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^3.0.0 (installed: 3.2.4) | Fork test runner | Already configured, all tests passing |
| node:test | built-in (Node 25.2.1) | Upstream gsd-tools test runner | Zero-dependency, upstream convention |
| @vitest/coverage-v8 | ^3.0.0 | Coverage reporting | Already configured in CI for PRs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| esbuild | ^0.24.0 | Hook building (build:hooks script) | Pre-publish step, CI prerequisite |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keep dual test idiom (vitest + node:test) | Migrate upstream to vitest | Lower merge friction with dual idiom; migration adds risk and time for no functional benefit |

**Installation:** No new dependencies needed. Everything is already in devDependencies.

## Architecture Patterns

### Test Suite Layout
```
tests/
├── unit/
│   └── install.test.js          # Install script validation (8 tests)
├── integration/
│   ├── kb-write.test.js         # KB write operations (7 tests)
│   ├── kb-infrastructure.test.js # KB shell scripts (14 tests)
│   └── wiring-validation.test.js # Wiring validation (13 tests)
├── e2e/
│   └── real-agent.test.js       # Real agent tests (4 tests, skipped by default)
├── helpers/
│   ├── tmpdir.js                # Temp directory fixture (vitest extend)
│   └── setup.js                 # Global env setup
└── smoke/
    ├── run-smoke.sh             # Smoke test orchestrator
    ├── verify-kb.sh             # KB assertion helpers
    └── fixtures/                # Smoke test project fixtures

get-shit-done/bin/
├── gsd-tools.js                 # Upstream CLI utility (4597 lines)
└── gsd-tools.test.js            # Upstream tests (2033 lines, 75 tests, node:test)
```

### Pattern 1: Thin Orchestrator Command Structure
**What:** Commands in `commands/gsd/*.md` are thin shells that delegate to workflow files in `get-shit-done/workflows/*.md`. Commands define metadata (name, description, allowed-tools, agent) and reference a workflow via `@~/.claude/get-shit-done/workflows/{name}.md`.
**When to use:** Understanding this pattern is critical for TEST-03 (wiring validation must validate delegation).

Commands follow this structure:
```markdown
---
name: gsd:{command}
description: ...
allowed-tools: [...]
---
<objective>...</objective>
<execution_context>
@~/.claude/get-shit-done/workflows/{workflow}.md
</execution_context>
<process>
Execute the {workflow} workflow from @~/.claude/get-shit-done/workflows/{workflow}.md
</process>
```

32 commands exist in `commands/gsd/`, 36 workflows exist in `get-shit-done/workflows/`.

### Pattern 2: tmpdirTest Fixture
**What:** Custom vitest fixture that provides isolated temp directories with automatic cleanup.
**When to use:** All tests that create files. Already used consistently across all test files.
```javascript
import { tmpdirTest } from '../helpers/tmpdir.js'

tmpdirTest('test name', async ({ tmpdir }) => {
  // tmpdir is an isolated temp directory
  // automatically cleaned up after test
})
```

### Pattern 3: Upstream Test Helper Pattern
**What:** gsd-tools.test.js uses `runGsdTools()` helper to spawn subprocess and capture JSON output.
```javascript
function runGsdTools(args, cwd = process.cwd()) {
  try {
    const result = execSync(`node "${TOOLS_PATH}" ${args}`, {
      cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return { success: false, output: err.stdout?.toString().trim() || '',
             error: err.stderr?.toString().trim() || err.message };
  }
}
```
Fork-specific tests should follow this same pattern for consistency.

### Anti-Patterns to Avoid
- **Duplicating tests across vitest and node:test:** If a behavior is already tested in gsd-tools.test.js, do not re-test it in vitest. The two suites have different scopes.
- **Modifying upstream test patterns:** gsd-tools.test.js follows upstream conventions (node:test, assert, subprocess). Adding fork tests should extend, not restructure.
- **Testing command file contents as strings:** The wiring validation should test structural properties (references resolve, delegation exists), not brittle content matching.

## Current State Discovery (Critical Findings)

### Fork Vitest Tests: ALL PASSING
- **42 tests pass**, 4 e2e tests skipped (require ANTHROPIC_API_KEY)
- Breakdown: install (8), kb-write (7), wiring-validation (13), kb-infrastructure (14)
- Duration: ~1 second
- **No repair work needed for existing vitest tests**

### Upstream gsd-tools Tests: ALL PASSING
- **75 tests pass** (not 63 as stated in CONTEXT.md -- count grew during Phase 10)
- 18 describe blocks covering: history-digest, phases list, roadmap get-phase, phase next-decimal, phase-plan-index, state-snapshot, summary-extract, init --include, roadmap analyze, phase add/insert/remove/complete, milestone complete, validate consistency, progress, todo complete, scaffold
- Duration: ~3.5 seconds
- **No fork-adaptation needed** -- all test outputs are JSON, no user-visible branding strings
- Tests use brand-agnostic assertions (no package name, URL, or branding checks)

### Wiring Validation: PASSING BUT NEEDS EXTENSION
- 13 tests in 7 describe blocks
- Currently validates: @-references in commands/workflows/agents, subagent_type->agent file mapping, KB template frontmatter, KB template body sections, reflect command->workflow references
- **Missing:** Thin orchestrator delegation validation (commands->workflows), command count validation, fork-specific file existence checks
- The `builtinTypes` set lists upstream agents that are installed at runtime -- this may need updating

### CI/CD Workflows: 4 WORKFLOWS EXIST
1. **ci.yml:** Runs on push/PR to main. Steps: checkout, Node 20.x, npm ci, build:hooks, npm test, npm run test:infra, install verification, coverage (PR only). **Does NOT run upstream tests (`npm run test:upstream`).**
2. **publish.yml:** Triggered on release published. OIDC configured (`id-token: write`). Steps: checkout, Node 20.x, npm latest, npm ci, build:hooks, version tag verification, changelog extraction, release notes update, npm test, npm publish with provenance. **Does NOT run upstream tests.**
3. **smoke-test.yml:** Manual dispatch only (workflow_dispatch). Tier selection (quick/full). Steps: checkout, Node 20.x, npm ci, build:hooks, auth check, tier 1 smoke (no auth), tier 2+3 smoke (with auth). Requires ANTHROPIC_API_KEY secret.
4. **auto-label-issues.yml:** Adds "needs-triage" label to new issues. No relevance to test/CI repair.

### CODEOWNERS: EXISTS AND SIMPLE
- `.github/CODEOWNERS` contains: `* @loganrooks`
- Single owner, all files. Will not block PRs as long as @loganrooks is the one merging.

### Test Scripts in package.json
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:infra": "vitest run tests/integration/kb-infrastructure.test.js tests/integration/wiring-validation.test.js",
  "test:smoke": "bash tests/smoke/run-smoke.sh",
  "test:upstream": "node --test get-shit-done/bin/gsd-tools.test.js"
}
```
- `npm test` runs vitest (fork tests only)
- `npm run test:upstream` runs gsd-tools tests
- CI currently runs `npm test` and `npm run test:infra` but NOT `npm run test:upstream`

### Config Structure (Fork Extensions)
The fork's `config.json` includes fields not in upstream defaults:
```json
{
  "health_check": { "frequency": "milestone-only", "stale_threshold_days": 7, "blocking_checks": false },
  "devops": { "ci_provider": "github-actions", "deploy_target": "none", "commit_convention": "conventional", "environments": [] },
  "gsd_reflect_version": "1.12.2"
}
```
These fields are NOT in `config-ensure-section`'s defaults (which creates upstream-style config). The `config-set` command supports arbitrary dot-notation keys and would work for these fields. No tests currently verify fork config field round-tripping.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test isolation (temp dirs) | Custom temp dir management | `tmpdirTest` fixture from `tests/helpers/tmpdir.js` | Already handles creation and cleanup |
| gsd-tools test execution | Custom test harness | `runGsdTools()` helper in gsd-tools.test.js | Established pattern, subprocess isolation |
| CI workflow validation | Manual curl/gh API testing | Push to sync branch, check GitHub Actions tab | Real environment is the only reliable validator |
| Coverage reporting | Custom coverage scripts | `vitest run --coverage` with @vitest/coverage-v8 | Already configured |

**Key insight:** The test infrastructure is mature and well-structured. The phase is about extending and updating tests, not building test infrastructure from scratch.

## Common Pitfalls

### Pitfall 1: Over-Scoping Repair Work
**What goes wrong:** Treating this as a "fix everything" phase when most tests already pass.
**Why it happens:** The CONTEXT.md was written before running the tests, assuming significant breakage.
**How to avoid:** Run tests first, triage actual failures, scope work to actual gaps.
**Warning signs:** Plan has 8+ tasks for "fixing broken tests" when there are none broken.

### Pitfall 2: Wrong Test Count Expectation
**What goes wrong:** Expecting 63 upstream tests when there are actually 75.
**Why it happens:** The 63 count is from an earlier version; Phase 10 added init --include tests.
**How to avoid:** Use actual `node --test` output (75 tests, 18 suites) as the baseline.
**Warning signs:** Success criteria checking for exactly 63 tests.

### Pitfall 3: Unnecessary Branding Adaptation in Upstream Tests
**What goes wrong:** Spending time fork-adapting upstream tests for branding.
**Why it happens:** CONTEXT.md says "fork-adapt upstream tests to use fork branding where they test user-visible output."
**How to avoid:** The upstream tests output JSON and use no branding strings. There is nothing to adapt. Fork-specific tests for custom config fields are the right approach instead.
**Warning signs:** Searching gsd-tools.test.js for branding strings to replace (there are none).

### Pitfall 4: CI Workflow Trigger Mismatch
**What goes wrong:** CI workflows only trigger on push/PR to `main`, but work is on `sync/v1.13-upstream` branch.
**Why it happens:** ci.yml is configured for `branches: [main]` only.
**How to avoid:** Either (a) temporarily add sync branch to CI triggers, (b) validate by merging to main, or (c) do a dry-run by pushing to a PR targeting main.
**Warning signs:** Pushing to sync branch and wondering why CI doesn't run.

### Pitfall 5: Smoke Test Requires External Dependencies
**What goes wrong:** Trying to run smoke tests in CI without ANTHROPIC_API_KEY.
**Why it happens:** Smoke tests require authenticated claude CLI.
**How to avoid:** Smoke test CI is correctly gated behind auth check. Tier 1 (quick) can run without auth. Full tier requires the secret.
**Warning signs:** Smoke test failures due to missing API key.

### Pitfall 6: Wiring Test Brittleness with Hardcoded Counts
**What goes wrong:** Hardcoding command count (e.g., "expect 32 commands") breaks when commands are added/removed.
**Why it happens:** Desire for regression detection.
**How to avoid:** Use dynamic discovery (read commands/gsd/ directory) and validate structural properties (each command has a workflow reference) rather than counts.
**Warning signs:** Test fails after legitimate command addition.

## Code Examples

### Adding Fork-Specific gsd-tools Tests (node:test)
```javascript
// Append to get-shit-done/bin/gsd-tools.test.js or create separate file
// Source: Follows existing runGsdTools pattern from gsd-tools.test.js

describe('config-set command (fork custom fields)', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => { cleanup(tmpDir); });

  test('sets nested fork config field health_check.frequency', () => {
    // Create initial config
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ mode: 'yolo' })
    );
    const result = runGsdTools('config-set health_check.frequency milestone-only', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf8')
    );
    assert.strictEqual(config.health_check.frequency, 'milestone-only');
  });

  test('sets fork config field gsd_reflect_version', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({})
    );
    const result = runGsdTools('config-set gsd_reflect_version 1.12.2', tmpDir);
    assert.ok(result.success);
    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf8')
    );
    // Note: config-set parses numbers, so "1.12.2" stays string (has dots)
    assert.strictEqual(config.gsd_reflect_version, '1.12.2');
  });
});
```

### Thin Orchestrator Wiring Validation (vitest)
```javascript
// Source: Pattern derived from existing wiring-validation.test.js

describe('thin orchestrator delegation', () => {
  it('every command with execution_context references an existing workflow', async () => {
    const commandFiles = await readMdFiles('commands/gsd')
    const broken = []

    for (const file of commandFiles) {
      // Extract workflow references from execution_context
      const execContextMatch = file.content.match(
        /<execution_context>([\s\S]*?)<\/execution_context>/
      )
      if (!execContextMatch) continue

      // Find workflow @-references
      const workflowRefs = execContextMatch[1].match(
        /@~\/\.claude\/get-shit-done\/workflows\/([^\s]+\.md)/g
      )
      if (!workflowRefs) continue

      for (const ref of workflowRefs) {
        const workflowPath = ref
          .replace('@~/.claude/get-shit-done/', 'get-shit-done/')
        const exists = await pathExists(workflowPath)
        if (!exists) {
          broken.push({ command: file.name, workflow: workflowPath })
        }
      }
    }

    if (broken.length > 0) {
      const details = broken
        .map(b => `  ${b.command} -> ${b.workflow}`)
        .join('\n')
      expect.fail(`Commands reference non-existent workflows:\n${details}`)
    }
  })

  it('commands with <process> sections reference their workflow', async () => {
    const commandFiles = await readMdFiles('commands/gsd')
    const missingDelegation = []

    for (const file of commandFiles) {
      const hasExecutionContext = file.content.includes('<execution_context>')
      const hasWorkflowRef = file.content.includes('get-shit-done/workflows/')

      // Commands should either delegate to a workflow or be self-contained
      // Those with execution_context MUST have a valid workflow reference
      if (hasExecutionContext && !hasWorkflowRef) {
        missingDelegation.push(file.name)
      }
    }

    if (missingDelegation.length > 0) {
      expect.fail(
        `Commands with execution_context but no workflow reference:\n  ${missingDelegation.join('\n  ')}`
      )
    }
  })
})
```

### CI Workflow Update for Upstream Tests
```yaml
# Addition to .github/workflows/ci.yml after "Run tests" step
      - name: Run upstream gsd-tools tests
        run: npm run test:upstream
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline command logic (Phase 7-8) | Thin orchestrator pattern (Phase 9) | Phase 9 | Wiring validation must check delegation, not inline logic |
| 63 upstream tests | 75 upstream tests | Phase 10 | Updated baseline for success criteria |
| Fork tests only in CI | Fork + upstream tests needed | Phase 11 | CI needs `npm run test:upstream` step |

**Deprecated/outdated:**
- The "63 upstream tests" count from CONTEXT.md: actual count is 75 after Phase 10 additions
- Old wiring validation checking inline command logic: needs to validate thin orchestrator delegation pattern instead

## Recommendations (Claude's Discretion Areas)

### Test Framework Decision: Keep Dual Idiom
**Recommendation:** Keep node:test for upstream gsd-tools.test.js, vitest for fork tests.
**Rationale:** (1) Zero merge friction when pulling upstream updates, (2) both already work and pass, (3) migration effort has no functional benefit, (4) `npm run test:upstream` already provides a clean separation.

### Test Repair Order
**Recommendation:** Order by dependency chain:
1. Update wiring validation (foundational -- validates all command/workflow/agent connections)
2. Add thin orchestrator delegation tests
3. Add fork-specific gsd-tools config tests
4. Update CI workflows to run upstream tests
5. Validate CI by pushing to sync branch (or PR to main)
6. Update install test if needed (check current install.js behavior)

### CI Workflow Changes
**Recommendation:** Minimal changes:
1. Add `npm run test:upstream` step to ci.yml (between "Run tests" and "Verify install script")
2. Optionally add sync branch to ci.yml triggers temporarily: `branches: [main, 'sync/*']`
3. No changes needed to publish.yml or smoke-test.yml for this phase
4. publish.yml already runs `npm test` before publish -- consider adding `npm run test:upstream` there too

### Wiring Test Design
**Recommendation:** Extend existing `wiring-validation.test.js` with new describe blocks:
- `thin orchestrator delegation` -- validates command->workflow references resolve
- `fork-specific files` -- validates fork files (reflect templates, KB scripts) exist
- Keep dynamic discovery (glob directories, not hardcoded counts)
- Use structural validation (patterns exist, references resolve) not content matching

### Commit Organization
**Recommendation:** Group by logical unit:
1. "test: update wiring validation for thin orchestrator pattern"
2. "test: add fork-specific gsd-tools config tests"
3. "ci: add upstream test step to CI workflow"
4. "ci: validate all workflows on sync branch" (if trigger changes needed)

### Push Timing
**Recommendation:** Local-first. Run all tests locally before pushing. The sync branch does not trigger CI (ci.yml only triggers on main push/PR). Options:
- Option A: Open a PR from sync to main, which triggers CI
- Option B: Temporarily add sync branch to CI triggers
- Option C: Run tests locally, merge to main, verify CI on main
Option A is safest -- it validates CI without merging.

### Node.js Version in CI
**Recommendation:** Keep Node 20.x in CI. The package.json `engines` field says `>=16.7.0` but CI uses 20.x which is the current LTS. Local dev uses 25.2.1 (current). Node 20.x is the right CI target for broad compatibility.

### CODEOWNERS Impact
**Recommendation:** No changes needed. CODEOWNERS requires @loganrooks review, which is the project owner. This is a feature, not a blocker.

### Branding in Upstream Tests
**Recommendation:** No fork-adaptation needed. The gsd-tools.test.js contains zero branding strings -- all outputs are JSON with no package name, URL, or user-visible branding. Fork-specific behavior is better tested via separate fork config tests.

### Smoke Test Branding Check
**Recommendation:** Not worth adding to smoke test. The smoke test validates real installation and workflow execution. Branding is covered by the install script behavior and unit tests.

## Open Questions

1. **Does `npm run build:hooks` succeed on the sync branch?**
   - What we know: CI requires this step. The script copies 3 hook files to dist/.
   - What's unclear: Whether the hook source files exist on the current branch.
   - Recommendation: Run `npm run build:hooks` as first validation step.

2. **Will the CI install verification step work with merged installer?**
   - What we know: CI runs `HOME="$INSTALL_DIR" node bin/install.js --claude` and checks for expected directories.
   - What's unclear: Whether the merged installer (supporting claude, opencode, gemini) behaves identically with `--claude` flag.
   - Recommendation: Run the CI install verification locally before pushing.

3. **Are there commands not yet converted to thin orchestrator?**
   - What we know: 32 commands exist in `commands/gsd/`, most follow the thin orchestrator pattern.
   - What's unclear: Whether ALL commands follow the pattern or some still have inline logic.
   - Recommendation: The wiring test should detect commands without workflow delegation and classify them (some may legitimately be self-contained).

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: All test files read and executed locally
- `npx vitest run`: 42 tests pass, 4 skipped (real execution)
- `node --test gsd-tools.test.js`: 75 tests pass (real execution)
- CI workflow files: All 4 read directly from `.github/workflows/`
- Package.json: Version 1.12.2, all scripts verified

### Secondary (MEDIUM confidence)
- Thin orchestrator pattern derived from reading 3 command files and cross-referencing with workflow directory listing
- CI trigger behavior based on workflow YAML configuration (not live-tested)

### Tertiary (LOW confidence)
- None -- all findings are from direct codebase inspection and test execution

## Knowledge Applied

Checked knowledge base (`~/.claude/gsd-knowledge/index.md`). Found 2 entries (both signals from prostagma project):
- `sig-2026-02-10-onboarding-missing-config-sections`: About missing config sections during new project onboarding. Marginally relevant -- confirms config.json structure matters but is about a different project.
- `sig-2026-02-10-missing-kb-rebuild-index-script`: About missing KB rebuild script. Not relevant to this phase.

No lessons or spikes in the knowledge base. No entries directly applicable to test suite repair or CI/CD validation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - direct codebase inspection, no external dependencies to verify
- Architecture: HIGH - all patterns derived from reading actual code and running actual tests
- Pitfalls: HIGH - discovered through actual test execution revealing discrepancies with CONTEXT.md expectations
- Wiring validation: HIGH - read existing test file completely, understand exactly what exists and what's missing
- CI/CD: HIGH - read all workflow files, identified exact gaps

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days -- stable domain, no external dependencies changing)
