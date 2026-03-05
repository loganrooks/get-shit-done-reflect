# Phase 39: CI Awareness - Research

**Researched:** 2026-03-05 (re-research; original 2026-03-04)
**Domain:** GitHub Actions CI integration, sensor architecture conformance, SessionStart hooks
**Confidence:** HIGH

## Summary

Phase 39 builds the first new sensor under Phase 38's extensible architecture, proving that the "drop a file" promise works. The CI sensor (`gsd-ci-sensor.md`) uses the `gh` CLI to detect failed GitHub Actions runs, branch protection bypasses, and test regressions. It follows the exact sensor contract established in Phase 38: frontmatter with `sensor_name`, `timeout_seconds`, `config_schema`; delimited JSON output (`## SENSOR OUTPUT` / `## END SENSOR OUTPUT`); empty array on failure. The key differentiator from existing sensors (artifact, git) is that the CI sensor calls an external API (`gh` CLI) rather than analyzing local files, making authentication pre-flight (CI-04) and graceful degradation critical.

The SessionStart hook (CI-02) is a separate deliverable: a Node.js script registered in settings.json under `hooks.SessionStart` that runs `gh run list --limit 1 --json conclusion,displayTitle,headBranch` for the current branch, caches the result, and writes a human-readable status line. This follows the exact pattern of `gsd-check-update.js` and `gsd-version-check.js` which are already registered as SessionStart hooks. The hook spawns a background child process, writes results to a cache file, and the statusline or next session reads the cache.

The `config_schema` field -- declared null for all three existing sensors -- should be the first non-null usage, declaring optional `repo` and `workflow` filter overrides. This validates the Phase 38 contract's config extensibility prediction.

**Primary recommendation:** Build in two plans: (1) CI sensor agent spec with gh auth pre-flight, failure detection, and graceful degradation conforming to the Phase 38 sensor contract; (2) Branch protection bypass detection, test regression detection, and SessionStart hook for CI status display.

## Standard Stack

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| `gh` CLI | System binary | GitHub Actions API queries | Official GitHub CLI; already used by project for PR/issue management; supports `--json` structured output with fields: `attempt, conclusion, createdAt, databaseId, displayTitle, event, headBranch, headSha, name, number, startedAt, status, updatedAt, url, workflowDatabaseId, workflowName` |
| Sensor contract (Phase 38) | `collect-signals.md` architecture notes | Input/output format, timeout, error handling | CI sensor MUST conform to this exact contract -- it validates EXT-06 |
| SessionStart hooks | `settings.json` `hooks.SessionStart` | Background checks at session start | Existing pattern used by `gsd-check-update.js` and `gsd-version-check.js` |

### Supporting
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| `gh api` | `gh` CLI subcommand | Commit check-run status queries | For branch protection bypass detection (CI-05) |
| `gh run view --log-failed` | `gh` CLI subcommand | Failed test output extraction | For test regression detection (CI-06) |
| automation track-event | `gsd-tools.js` | Per-sensor stats | Automatically handled by collect-signals orchestrator |
| feature-manifest.json | `get-shit-done/feature-manifest.json` | Config schema for CI sensor | Optional: if adding CI-sensor-specific config knobs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `gh` CLI | GitHub REST API via `curl` | `gh` handles auth, pagination, repo resolution automatically; `curl` requires manual token management |
| SessionStart hook | Statusline integration | Hook fires once at session start (efficient); statusline fires on every tool use (wasteful for API calls) |
| Log parsing for test count | GitHub Check Annotations API | Log parsing is simpler but fragile; Annotations API is structured but requires workflow to publish annotations |

**No installation needed** -- `gh` CLI is a runtime dependency (checked via pre-flight). No new npm packages.

## Architecture Patterns

### Sensor File Structure
```
agents/
  gsd-ci-sensor.md          # NEW: CI sensor agent spec (the only sensor file to create)
hooks/
  gsd-ci-status.js           # NEW: SessionStart hook for CI status display
```

Phase 38 auto-discovery means NO modifications to `collect-signals.md`, `feature-manifest.json`, or any other file for sensor registration. The CI sensor is discovered automatically by the `gsd-*-sensor.md` glob. Per 38-01-SUMMARY.md: "Config now provides overrides only; file system is the sole source of truth for sensor existence."

Per 38-02-SUMMARY.md: "Sensor discovery tries .claude/agents/ first, falls back to agents/ for dev environments." So creating `agents/gsd-ci-sensor.md` (npm source) and running `node bin/install.js --local` will make it discoverable.

### Pattern 1: Sensor Contract Frontmatter (CI-specific)
**What:** CI sensor declares its contract including the first non-null `config_schema`
**When to use:** In `agents/gsd-ci-sensor.md` frontmatter

```yaml
---
name: gsd-ci-sensor
description: Detects failed GitHub Actions runs, branch protection bypasses, and test regressions via gh CLI
tools: Read, Bash, Grep
color: red
# === Sensor Contract (EXT-02) ===
sensor_name: ci
timeout_seconds: 30
config_schema:
  repo:
    type: string
    description: "GitHub repo in OWNER/REPO format (default: auto-detect from git remote)"
    default: null
  workflow:
    type: string
    description: "Filter to specific workflow name (default: all workflows)"
    default: null
---
```

**Verified from existing sensors (2026-03-05):**
- `gsd-artifact-sensor.md`: `sensor_name: artifact`, `timeout_seconds: 45`, `config_schema: null`
- `gsd-git-sensor.md`: `sensor_name: git`, `timeout_seconds: 30`, `config_schema: null`
- Both use `tools: Read, Bash, Glob, Grep` and have `<blind_spots>` sections

### Pattern 2: gh Auth Pre-Flight (CI-04)
**What:** Check `gh auth status` before any API calls; on failure, return empty signals with warning
**When to use:** First step of CI sensor execution
**Why critical:** The sensor MUST distinguish "checked and found nothing" from "unable to check" (Duhem-Quine problem cited in CI-04 motivation)

```bash
# Pre-flight: verify gh CLI is available and authenticated
if ! command -v gh &>/dev/null; then
  echo "WARNING: gh CLI not installed. CI sensor cannot check GitHub Actions status."
  echo "Install: https://cli.github.com/"
  return_empty_signals "gh-not-installed"
  exit 0
fi

GH_AUTH=$(gh auth status 2>&1)
if [ $? -ne 0 ]; then
  echo "WARNING: gh CLI not authenticated. CI sensor cannot check GitHub Actions status."
  echo "Run: gh auth login"
  return_empty_signals "gh-not-authenticated"
  exit 0
fi
```

**Critical behavior:** Empty signals + human-readable warning, NEVER a silent false-negative. The sensor wraps the warning in the standard sensor output format so the orchestrator's collect_sensor_outputs step can parse it.

### Pattern 3: Failure Detection (CI-03)
**What:** Query recent workflow runs for failures
**When to use:** After pre-flight passes

```bash
# Get recent runs for the current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Verified JSON fields available (2026-03-05):
# attempt, conclusion, createdAt, databaseId, displayTitle, event, headBranch,
# headSha, name, number, startedAt, status, updatedAt, url, workflowDatabaseId, workflowName
gh run list --branch "$BRANCH" --limit 5 \
  --json conclusion,displayTitle,headSha,createdAt,name,status,event \
  2>/dev/null
```

**Verified output from actual repo (2026-03-05):**
```json
[{"conclusion":"success","createdAt":"2026-03-05T18:46:47Z","displayTitle":"Merge pull request #8...","event":"push","headSha":"cdc5632e...","name":"CI","status":"completed"}]
```

**Detection rules:**
- `conclusion: "failure"` on any workflow for the current branch = signal candidate
- `conclusion: "failure"` on main branch = higher severity (critical) since it affects all developers
- Multiple consecutive failures = escalated severity

### Pattern 4: Branch Protection Bypass Detection (CI-05)
**What:** Detect commits pushed to main without passing required CI checks
**When to use:** As part of CI sensor analysis

```bash
# Verified API response format (2026-03-05):
# Required checks: {"contexts":["Test"],"checks":[{"context":"Test","app_id":null}]}
REQUIRED_CHECKS=$(gh api "repos/$REPO/branches/main/protection/required_status_checks" \
  --jq '.contexts[]' 2>/dev/null)

# Get recent main commits
COMMITS=$(gh api "repos/$REPO/commits?sha=main&per_page=5" \
  --jq '.[].sha' 2>/dev/null)

# For each commit, verify required checks passed
# Verified response: [{"conclusion":"success","name":"Test"}]
for SHA in $COMMITS; do
  CHECKS=$(gh api "repos/$REPO/commits/$SHA/check-runs" \
    --jq '[.check_runs[] | {name: .name, conclusion: .conclusion}]' 2>/dev/null)
  # Compare against required checks
done
```

**Verified from actual API (2026-03-05):** The fork has branch protection requiring "Test" check with `enforce_admins: false`. This means admin pushes bypass protection -- exactly the pattern that caused sig-2026-03-02-ci-failures-ignored-throughout-v116.

### Pattern 5: Test Regression Detection (CI-06)
**What:** Compare test counts between consecutive runs to detect drops
**When to use:** When CI runs use vitest/jest with standard output

```bash
# Get IDs of last 2 completed runs
RUN_IDS=$(gh run list --workflow "CI" --limit 2 --status completed \
  --json databaseId --jq '.[].databaseId')

# Extract test counts from logs (vitest format: "Tests  N passed")
for RUN_ID in $RUN_IDS; do
  LOGS=$(gh run view "$RUN_ID" --log 2>/dev/null)
  TEST_COUNT=$(echo "$LOGS" | grep -oE '[0-9]+ passed' | head -1 | grep -oE '[0-9]+')
done

# Compare: if newer count < older count, flag as regression
```

**Limitation:** Test count extraction is log-format-dependent. Vitest outputs "Tests  N passed (N)" but format varies by runner and configuration. This is a MEDIUM confidence detection -- log parsing is inherently fragile.

### Pattern 6: SessionStart Hook (CI-02)
**What:** Node.js script that checks CI status at session start and caches result
**When to use:** Registered in settings.json under `hooks.SessionStart`

**Verified hook registration pattern (2026-03-05) from actual settings.json:**
```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-check-update.js" }] },
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-version-check.js" }] }
    ]
  }
}
```

The CI status hook follows this exact structure:

```javascript
// hooks/gsd-ci-status.js
// Called by SessionStart hook - runs once per session
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const homeDir = os.homedir();
const cacheDir = path.join(homeDir, '.claude', 'cache');
const cacheFile = path.join(cacheDir, 'gsd-ci-status.json');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Run check in background (same pattern as gsd-check-update.js)
const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const { execSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};

  // Pre-flight: check gh auth
  try { execSync('gh auth status', { stdio: 'ignore', timeout: 5000 }); }
  catch {
    fs.writeFileSync(cacheFile, JSON.stringify({ degraded: true, reason: 'gh-not-authenticated', checked: Math.floor(Date.now() / 1000) }));
    process.exit(0);
  }

  // Get current branch
  let branch;
  try { branch = execSync('git branch --show-current', { encoding: 'utf8', timeout: 5000 }).trim(); }
  catch { process.exit(0); }

  // Get latest run
  try {
    const runs = JSON.parse(execSync(
      'gh run list --branch "' + branch + '" --limit 1 --json conclusion,displayTitle,name,createdAt,headSha',
      { encoding: 'utf8', timeout: 10000 }
    ));

    const result = {
      branch,
      latest_run: runs[0] || null,
      checked: Math.floor(Date.now() / 1000)
    };

    fs.writeFileSync(cacheFile, JSON.stringify(result));
  } catch { process.exit(0); }
`], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true
});
child.unref();
```

**Installer registration (from install.js lines 2278-2317 pattern):**
```javascript
const ciStatusCommand = isGlobal
  ? buildHookCommand(targetDir, 'gsd-ci-status.js')
  : 'node ' + dirName + '/hooks/gsd-ci-status.js';

const hasGsdCiHook = settings.hooks.SessionStart.some(entry =>
  entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-ci-status'))
);

if (!hasGsdCiHook) {
  settings.hooks.SessionStart.push({
    hooks: [{ type: 'command', command: ciStatusCommand }]
  });
}
```

### Anti-Patterns to Avoid
- **Calling gh API synchronously in the sensor without timeout:** `gh` API calls can hang on network issues. Always use `timeout` parameter on `execSync` and declare a reasonable `timeout_seconds` in the contract.
- **Parsing gh output as plain text:** Always use `--json` flag and `--jq` for structured output. Plain text output changes between gh versions.
- **Hardcoding repo name:** Use `gh repo view --json nameWithOwner --jq '.nameWithOwner'` for auto-detection. The CI sensor should work in any repo, not just this one.
- **Reporting "no CI failures" when gh auth fails:** This is the core CI-04 requirement. Empty signals from auth failure MUST include a warning, not a clean bill of health.
- **Editing .claude/ directly:** Per CLAUDE.md and lesson [les-2026-02-16-dynamic-path-resolution-for-install-context], always edit npm source directories (`agents/`, `hooks/`), then run `node bin/install.js --local`.
- **Using ~/.gsd/knowledge/ as sole KB path:** Per Phase 38.1, all new code must use `.planning/knowledge/` primary with `~/.gsd/knowledge/` fallback pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub API authentication | Custom token management | `gh auth status` + `gh` CLI | Handles token storage, refresh, keyring integration |
| Repo/owner detection | Parse git remote URL manually | `gh repo view --json nameWithOwner --jq '.nameWithOwner'` | Handles SSH/HTTPS URLs, forks, configured defaults |
| JSON API responses | curl + manual parsing | `gh api` with `--jq` | Built-in pagination, auth, error handling |
| CI status caching | Custom file-based cache | Follow `gsd-check-update.js` pattern | Proven pattern with background process + cache file at `~/.claude/cache/` |
| Sensor auto-discovery | Registration/config changes | Drop file matching `gsd-*-sensor.md` glob | Phase 38 auto-discovery handles everything |

**Key insight:** The `gh` CLI is both the data source and the auth layer. Every `gh` subcommand inherits authentication state, repo context, and error handling. Using `curl` against the GitHub API directly would require reimplementing all of this.

## Common Pitfalls

### Pitfall 1: gh CLI Not Installed or Not Authenticated
**What goes wrong:** CI sensor runs `gh run list` without checking auth. Command fails with unhelpful error. Sensor returns empty signals -- user sees "no CI issues" when the sensor was unable to check at all.
**Why it happens:** Most developers have `gh` installed, but not all. Token expiration is common. CI environments need explicit `GITHUB_TOKEN` scoping.
**How to avoid:** Pre-flight check BEFORE any `gh` command. Return empty signals with explicit warning message including `degraded: true` and `degradation_reason`. The warning appears in the collect-signals output and `sensors list` status.
**Warning signs:** `sensors list` shows ci sensor with 0 signals and status "success" when CI is actually failing.

### Pitfall 2: Rate Limiting on gh API Calls
**What goes wrong:** CI sensor makes multiple API calls (run list, commit checks, log downloads). GitHub rate limits authenticated requests to 5000/hour, but gh CLI uses conditional requests. Heavy sensor usage could hit limits.
**Why it happens:** Branch protection bypass detection queries check-runs for each recent commit (up to 5 commits = 5 API calls). Test regression downloads full logs (large responses).
**How to avoid:** Limit commit check queries to 5 most recent main commits. Use `--limit` on all `gh run list` calls. Set sensor timeout to 30s to prevent runaway API calls.
**Warning signs:** gh CLI returns 403 errors or empty responses.

### Pitfall 3: Test Count Parsing Fragility
**What goes wrong:** Test regression detection parses vitest/jest output from CI logs. Different test runners, configurations, and output formats produce different log patterns. The regex fails silently.
**Why it happens:** There is no standardized test result format in GitHub Actions logs. Vitest outputs "Tests  N passed (N)", Jest outputs "Tests:  N passed, N total", and other runners have other formats.
**How to avoid:** Make test count extraction best-effort with LOW confidence. If parsing fails, skip test regression detection rather than reporting false data. Document this as a blind spot.
**Warning signs:** Test regression never detected even when tests are actually removed.

### Pitfall 4: Dual-Directory Drift (Sensor Spec)
**What goes wrong:** CI sensor created in `.claude/agents/` instead of `agents/`. Works locally but missing from npm package.
**Why it happens:** Same Phase 22 incident pattern documented in CLAUDE.md. Per lesson [les-2026-02-16-dynamic-path-resolution-for-install-context], path resolution must account for install context.
**How to avoid:** Create `agents/gsd-ci-sensor.md` (npm source). Run `node bin/install.js --local` to copy to `.claude/agents/`.
**Warning signs:** Sensor works in dev but not after `npx get-shit-done-reflect-cc` install.

### Pitfall 5: Dual-Directory Drift (Hook Script)
**What goes wrong:** SessionStart hook script created in `.claude/hooks/` instead of `hooks/`. Same issue as sensor spec.
**Why it happens:** Existing hooks (`gsd-check-update.js`, `gsd-version-check.js`) live in `hooks/` (npm source) and get installed to `.claude/hooks/` by the installer.
**How to avoid:** Create `hooks/gsd-ci-status.js` (npm source). Add installer logic to copy it and register the hook.
**Warning signs:** Hook works after local dev install but not for npm users.

### Pitfall 6: SessionStart Hook Blocks Session
**What goes wrong:** The CI status hook makes a synchronous `gh` API call that takes 5+ seconds, delaying session start noticeably.
**Why it happens:** Network latency + gh CLI startup time. The `gh run list` command takes 1-3 seconds normally, longer on slow networks.
**How to avoid:** Run the `gh` command in a detached background child process (same pattern as `gsd-check-update.js`). Write results to cache file. The statusline or next session reads the cache.
**Warning signs:** Users report slow session start times after installing CI awareness.

### Pitfall 7: KB Path Hardcoding (Post-Phase 38.1)
**What goes wrong:** New sensor or workflow code references `~/.gsd/knowledge/` without the project-local fallback pattern.
**Why it happens:** Phase 38.1 (completed 2026-03-05) migrated all 20 files to use `.planning/knowledge/` as primary with `~/.gsd/knowledge/` fallback. New code might not follow this pattern.
**How to avoid:** Any KB references in the CI sensor should use the fallback pattern: `.planning/knowledge/` primary, `~/.gsd/knowledge/` fallback.
**Warning signs:** KB operations fail in project-local KB setups.

## Code Examples

### Example 1: Complete Pre-Flight and Failure Detection
```bash
# Source: Verified against gh CLI on loganrooks/get-shit-done-reflect (2026-03-05)

# Step 1: Pre-flight
if ! command -v gh &>/dev/null; then
  echo "WARNING: gh CLI not installed"
  # ... return empty signals with degradation warning
fi

AUTH_STATUS=$(gh auth status 2>&1)
if [ $? -ne 0 ]; then
  echo "WARNING: Not authenticated to GitHub"
  # ... return empty signals with degradation warning
fi

# Step 2: Auto-detect repo
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)
if [ -z "$REPO" ]; then
  echo "WARNING: Could not determine repository"
  # ... return empty signals
fi

# Step 3: Get current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Step 4: Check recent runs
RUNS=$(gh run list --branch "$BRANCH" --limit 5 \
  --json conclusion,displayTitle,headSha,createdAt,name,status \
  2>/dev/null)

# Step 5: Detect failures
FAILURES=$(echo "$RUNS" | node -e "
  const runs = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const failures = runs.filter(r => r.conclusion === 'failure');
  console.log(JSON.stringify(failures));
")
```

### Example 2: Branch Protection Bypass Detection
```bash
# Source: Verified against GitHub API on loganrooks/get-shit-done-reflect (2026-03-05)
# Required checks response: {"strict":true,"contexts":["Test"],...}
# Check-runs response: [{"conclusion":"success","name":"Test"}]

REQUIRED_CHECKS=$(gh api "repos/$REPO/branches/main/protection/required_status_checks" \
  --jq '.contexts[]' 2>/dev/null)

COMMITS=$(gh api "repos/$REPO/commits?sha=main&per_page=5" \
  --jq '.[].sha' 2>/dev/null)

for SHA in $COMMITS; do
  CHECKS=$(gh api "repos/$REPO/commits/$SHA/check-runs" \
    --jq '[.check_runs[] | {name: .name, conclusion: .conclusion}]' 2>/dev/null)

  for REQUIRED in $REQUIRED_CHECKS; do
    FOUND=$(echo "$CHECKS" | node -e "
      const checks = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      const match = checks.find(c => c.name === '$REQUIRED');
      console.log(match ? match.conclusion : 'missing');
    ")
    if [ "$FOUND" != "success" ]; then
      echo "BYPASS: Commit $SHA missing/failed required check '$REQUIRED'"
    fi
  done
done
```

### Example 3: Sensor Output (Conforming to Phase 38 Contract)
```json
{
  "sensor": "ci",
  "phase": 38,
  "signals": [
    {
      "summary": "CI run 'Tests' failed on branch main (commit 01a292a)",
      "signal_type": "deviation",
      "signal_category": "negative",
      "severity": "critical",
      "tags": ["ci", "workflow-failure", "branch-protection"],
      "evidence": {
        "supporting": ["gh run list shows conclusion=failure for run #22693856209"],
        "counter": ["Failure may be transient (infrastructure issue, flaky test)"]
      },
      "confidence": "high",
      "confidence_basis": "Direct API query of GitHub Actions run status",
      "context": {
        "phase": 38,
        "source": "github-actions",
        "run_id": 22693856209,
        "runtime": "claude-code",
        "model": "claude-opus-4-6"
      }
    }
  ]
}
```

### Example 4: Degraded Sensor Output (Auth Failure)
```json
{
  "sensor": "ci",
  "phase": 38,
  "signals": [],
  "degraded": true,
  "degradation_reason": "gh CLI not authenticated. Run 'gh auth login' to enable CI monitoring.",
  "warning": "CI sensor returned 0 signals due to authentication failure, NOT because CI is passing."
}
```

### Example 5: SessionStart Hook Cache Output
```json
{
  "branch": "main",
  "latest_run": {
    "conclusion": "success",
    "displayTitle": "Merge pull request #8...",
    "name": "CI",
    "createdAt": "2026-03-05T18:46:47Z",
    "headSha": "cdc5632e..."
  },
  "checked": 1741200000
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No CI visibility in GSD | CI sensor + SessionStart hook | Phase 39 (this phase) | CI failures visible before more work is committed |
| 5 bypassed CI failures (v1.16) | Branch protection bypass detection | Phase 39 (this phase) | Admin pushes without CI flagged as signals |
| Manual `gh run list` checking | Automated sensor + session hook | Phase 39 (this phase) | Zero manual effort to see CI status |
| `~/.gsd/knowledge/` hardcoded KB | `.planning/knowledge/` primary + fallback | Phase 38.1 (2026-03-05) | New code must use fallback pattern |
| Hardcoded 3-sensor spawning | Auto-discovery via glob | Phase 38 (2026-03-04) | New sensors need only a file drop |

**Context from sig-2026-03-02-ci-failures-ignored-throughout-v116:** 5 consecutive CI failures were bypassed via admin push throughout v1.16. The system had no mechanism to surface CI failures. This phase closes that gap.

## Open Questions

### Resolved
- **Does `gh` CLI provide structured JSON output?** YES -- all `gh` commands support `--json` and `--jq` flags. Verified with `gh run list`, `gh api`, `gh repo view`. Available JSON fields for `gh run list`: `attempt, conclusion, createdAt, databaseId, displayTitle, event, headBranch, headSha, name, number, startedAt, status, updatedAt, url, workflowDatabaseId, workflowName`.
- **Can we detect branch protection bypass via API?** YES -- `gh api repos/{owner}/{repo}/commits/{sha}/check-runs` returns check status per commit. Cross-referenced with `repos/{owner}/{repo}/branches/main/protection/required_status_checks` gives required checks. Verified on fork (2026-03-05): required check is "Test", `strict: true`, `enforce_admins: false`.
- **What workflows exist on the fork?** CI, Auto-label new issues, Publish to npm, Smoke Tests (Manual). The "CI" workflow is the primary target. Required check is "Test".
- **How do existing SessionStart hooks work?** Node.js scripts spawning background processes that write to `~/.claude/cache/` files. Registered via installer in `settings.json` under `hooks.SessionStart[].hooks[].command`. Verified actual structure: each hook is an object with `hooks` array containing `{type: "command", command: "node .claude/hooks/<script>.js"}`.
- **Did Phase 38.1 change any paths relevant to CI sensor?** YES -- all KB references now use `.planning/knowledge/` primary with `~/.gsd/knowledge/` fallback. The CI sensor itself does not write to KB (sensors return JSON to orchestrator), but any KB-related code must use the new fallback pattern. Phase 38.1 also deprecated lesson writing in the reflector.
- **What is the hook command format for local installs?** `'node ' + dirName + '/hooks/<script>.js'` where dirName is `.claude` for local installs. Verified from install.js lines 2257-2264.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| How to reliably extract test counts from CI logs across different test runners? | Medium | Best-effort regex matching for vitest format; document as LOW confidence detection; blind spot for non-vitest runners |
| Should the CI sensor query the upstream repo (gsd-build/get-shit-done) in addition to the fork? | Low | Default to current repo only; config_schema allows override. Cross-repo checking is scope creep. |
| How should the SessionStart hook display CI status to the user? | Medium | Write to cache file; statusline reads and displays it. Follow existing gsd-version-check.js + gsd-statusline.js pattern. |

### Still Open
- Test count extraction reliability across different CI configurations needs empirical validation. A spike could determine the most common vitest output formats, but the LOW confidence designation and blind spot documentation may be sufficient for v1 launch.

## Sources

### Primary (HIGH confidence)
- `agents/gsd-artifact-sensor.md` -- verified sensor contract frontmatter format (sensor_name, timeout_seconds, config_schema: null), output protocol (## SENSOR OUTPUT delimiters), blind_spots section
- `agents/gsd-git-sensor.md` -- verified sensor contract pattern, detection rule structure, timeout_seconds: 30
- `get-shit-done/workflows/collect-signals.md` -- verified auto-discovery mechanism (gsd-*-sensor.md glob), spawning protocol (dynamic FOR EACH loop), and orchestrator behavior (delimiter extraction, timeout enforcement)
- `hooks/gsd-check-update.js` -- verified SessionStart hook pattern: background spawn via `spawn(process.execPath, ['-e', ...])`, `stdio: 'ignore'`, `windowsHide: true`, `detached: true`, `.unref()`, cache to `~/.claude/cache/`
- `hooks/gsd-version-check.js` -- verified same pattern, project-local version detection
- `hooks/gsd-statusline.js` -- verified statusline reads `~/.claude/cache/gsd-update-check.json` for update indicator
- `bin/install.js` -- verified hook registration pattern at lines 2278-2317: `buildHookCommand()` for global, `'node ' + dirName + '/hooks/<name>.js'` for local, idempotent check via `.some(entry => entry.hooks && entry.hooks.some(...))`
- `.claude/settings.json` -- verified actual structure: `hooks.SessionStart` is array of `{hooks: [{type: "command", command: "..."}]}` objects
- `gh run list --json` -- verified against fork repo (2026-03-05), confirmed all documented JSON fields work
- `gh api repos/.../branches/main/protection/required_status_checks` -- verified: `{"strict":true,"contexts":["Test"]}`
- `gh api repos/.../commits/{sha}/check-runs` -- verified: returns `[{"conclusion":"success","name":"Test"}]`
- `.planning/phases/38-extensible-sensor-architecture/38-01-SUMMARY.md` -- verified auto-discovery, default-enabled semantics, contract spec
- `.planning/phases/38-extensible-sensor-architecture/38-02-SUMMARY.md` -- verified frontmatter retrofit on all 3 sensors, CLI observability commands, discovery path resolution
- `.planning/phases/38.1-project-local-knowledge-base/38.1-01-SUMMARY.md` -- verified KB path migration to project-local primary with fallback

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- CI-02 through CI-06, EXT-06 requirement definitions with motivations

### Tertiary (LOW confidence)
- Test count extraction from CI logs -- format-dependent regex parsing, not verified across multiple CI configurations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- gh CLI verified directly against repo, sensor contract verified from Phase 38 artifacts, hook pattern verified from actual settings.json and install.js
- Architecture: HIGH -- patterns derived from reading existing sensors and hooks, verified against running system. Phase 38.1 KB path changes accounted for.
- Pitfalls: HIGH -- auth pitfall documented in research PITFALLS.md; dual-directory lesson from KB; rate limiting from gh CLI docs; KB path pitfall from Phase 38.1
- Code examples: HIGH for gh CLI usage (verified 2026-03-05), MEDIUM for test regression parsing (format-dependent)

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days -- gh CLI and GitHub API are stable; sensor contract from Phase 38 is internal)

**Changes from original research (2026-03-04):**
- Verified all gh CLI commands against actual repo (re-confirmed JSON fields, API responses)
- Added Phase 38.1 KB path migration awareness (Pitfall 7)
- Verified actual settings.json hook structure (was described correctly in original)
- Added installer hook registration code pattern with exact line references
- Added SessionStart hook cache output example (Example 5)
- Confirmed no structural changes to sensor contract or collect-signals.md since original research
- Added `workflowName` to documented JSON fields (was available but not listed)

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| les-2026-02-16-dynamic-path-resolution-for-install-context | lesson | Path resolution must account for local vs global install context; never hardcode ~/.claude/ as assumed root | Common Pitfalls (Pitfall 4, 5), Anti-Patterns |
| sig-2026-03-02-ci-failures-ignored-throughout-v116 | signal | 5 consecutive CI failures bypassed via admin push during v1.16 | Architecture Patterns (branch protection bypass detection rationale), State of the Art |
| sig-2026-03-03-no-ci-verification-in-execute-phase-workflow | signal | No CI verification in execute-phase pipeline | Summary (motivating context) |
| sig-2026-03-05-phase381-clean-execution-zero-deviations | signal | Phase 38.1 completed cleanly, KB path migration done | Pitfall 7 (new), State of the Art |

Checked knowledge base (`.planning/knowledge/index.md` and `~/.gsd/knowledge/index.md`). 4 entries relevant out of ~108 signals + 1 spike + 7 lessons. Applied lesson for path resolution pitfalls and 3 CI/KB-related signals for motivating context and path awareness. No spikes matched the CI sensor domain.

Spikes avoided: 0 (no existing spikes cover GitHub Actions integration or gh CLI usage patterns)
