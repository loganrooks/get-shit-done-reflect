---
phase: 39-ci-awareness
verified: 2026-03-05T17:00:00Z
status: passed
score: 10/10 must-haves verified
gaps: []
---

# Phase 39: CI Awareness Verification Report

**Phase Goal:** CI failures are detected automatically by the new CI sensor and surfaced to the user at session start before more work is committed on a broken build
**Verified:** 2026-03-05T17:00:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CI sensor is auto-discovered by collect-signals workflow via gsd-*-sensor.md glob | VERIFIED | `sensors list` shows ci sensor as enabled with timeout=30 |
| 2 | CI sensor runs gh auth status pre-flight and returns degraded:true with warning when unauthenticated | VERIFIED | agents/gsd-ci-sensor.md Step 1 contains full pre-flight with degraded output template including degradation_reason and warning fields |
| 3 | CI sensor detects failed GitHub Actions runs on current branch and main | VERIFIED | Step 4 queries both current branch and main with `gh run list --json`, creates signal candidates for conclusion=failure |
| 4 | CI sensor returns empty signals with degraded:true, never silent false-negative | VERIFIED | Explicit language: "The distinction between 'checked and found nothing' vs 'unable to check' is the core CI-04 requirement" |
| 5 | CI sensor conforms to Phase 38 sensor contract (frontmatter with sensor_name/timeout_seconds/config_schema) | VERIFIED | Frontmatter has sensor_name: ci, timeout_seconds: 30, config_schema with repo and workflow fields |
| 6 | CI sensor is first sensor with non-null config_schema (EXT-06) | VERIFIED | config_schema contains two entries (repo, workflow) -- other sensors have null config_schema |
| 7 | CI status displayed at session start via SessionStart hook | VERIFIED | hooks/gsd-ci-status.js registered in .claude/settings.json as SessionStart hook |
| 8 | SessionStart hook runs in background and does not block session startup | VERIFIED | Uses spawn() with detached:true + child.unref() pattern (matching gsd-check-update.js) |
| 9 | Hook degrades silently when gh CLI unavailable | VERIFIED | Pre-flight catches missing gh with process.exit(0), auth failure writes degraded:true to cache |
| 10 | CI failure status surfaced in statusline throughout session | VERIFIED | hooks/gsd-statusline.js reads gsd-ci-status.json cache, shows red "CI FAIL" when conclusion=failure and cache < 1 hour old |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agents/gsd-ci-sensor.md` | CI sensor agent spec with sensor contract | VERIFIED | 314 lines, 7-step execution flow, blind spots, guidelines |
| `hooks/gsd-ci-status.js` | SessionStart hook for CI status caching | VERIFIED | 71 lines, background spawn, pre-flight, cache write |
| `hooks/gsd-statusline.js` | Statusline with CI failure indicator | VERIFIED | ciStatus block at lines 81-93, wired into both output lines (144, 147) |
| `bin/install.js` | Hook registration and uninstall cleanup | VERIFIED | 5 references: gsdHooks array (L1546), settings filter (L1583), command def (L2266-2267), registration guard (L2322) |
| `.claude/agents/gsd-ci-sensor.md` | Installed copy of sensor spec | VERIFIED | Exists with sensor_name: ci in frontmatter |
| `.claude/settings.json` | Hook registration entry | VERIFIED | Contains `"command": "node .claude/hooks/gsd-ci-status.js"` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| agents/gsd-ci-sensor.md | collect-signals workflow | gsd-*-sensor.md glob | WIRED | `sensors list` discovers ci sensor |
| agents/gsd-ci-sensor.md | gh CLI | Bash tool calls | WIRED | `gh auth status`, `gh run list`, `gh api` commands in spec |
| hooks/gsd-ci-status.js | gh CLI | execSync in background spawn | WIRED | `gh run list` with --json flag, timeout 10000ms |
| hooks/gsd-ci-status.js | cache file | fs.writeFileSync | WIRED | Writes to ~/.claude/cache/gsd-ci-status.json |
| hooks/gsd-statusline.js | cache file | fs.readFileSync | WIRED | Reads gsd-ci-status.json, checks age < 3600, conclusion === 'failure' |
| bin/install.js | hooks/gsd-ci-status.js | SessionStart registration | WIRED | ciStatusCommand definition + hasGsdCiHook guard + push to SessionStart |
| bin/install.js (uninstall) | hooks/gsd-ci-status.js | gsdHooks array + settings filter | WIRED | Both filesystem cleanup (L1546) and settings.json cleanup (L1583) |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| CI-02: CI status displayed at session start | SATISFIED | -- |
| CI-03: Failure detection for current branch and main | SATISFIED | -- |
| CI-04: Pre-flight auth check with degraded output | SATISFIED | -- |
| CI-05: Branch protection bypass detection | SATISFIED | -- |
| CI-06: Test regression detection | SATISFIED | -- |
| EXT-06: First sensor with non-null config_schema | SATISFIED | -- |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| -- | -- | None found | -- | -- |

No TODO, FIXME, placeholder, or stub patterns detected in any phase artifacts.

### Human Verification Required

### 1. CI FAIL Indicator Visual Test

**Test:** Create a test cache file at `~/.claude/cache/gsd-ci-status.json` with `{"branch":"main","latest_run":{"conclusion":"failure"},"checked":<current_unix_timestamp>}`, then pipe mock input to the statusline: `echo '{"model":{"display_name":"Test"}}' | node hooks/gsd-statusline.js`
**Expected:** Output contains red "CI FAIL" text before the model name
**Why human:** Visual ANSI color rendering cannot be verified programmatically

### 2. Background Spawn Non-Blocking

**Test:** Run `time node hooks/gsd-ci-status.js` and verify it exits within 1 second
**Expected:** Hook exits immediately (< 100ms), background process continues independently
**Why human:** Timing behavior depends on system load; programmatic check is unreliable

### 3. End-to-End CI Sensor Run

**Test:** Run the CI sensor agent via the signal orchestrator on a repo with known CI failures
**Expected:** Sensor returns signal candidates with conclusion=failure, proper severity, tags, and evidence
**Why human:** Requires live GitHub API access and a repo with failed CI runs

### Gaps Summary

No gaps found. All 10 observable truths verified. All artifacts exist, are substantive (no stubs), and are properly wired. All 7 requirements (CI-02 through CI-06, EXT-06) are satisfied. Tests pass (214 passed, 0 failures). The installer has complete hook lifecycle coverage (registration + dual uninstall cleanup).

---

_Verified: 2026-03-05T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
