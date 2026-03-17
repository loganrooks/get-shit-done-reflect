# Statusline & Hook Divergence Analysis

> Agent: Hook Analysis | Source: detailed diff of statusline, context-monitor, CI/health hooks

---

## Statusline Hook Comparison

### Output Elements

| Element | Fork | Upstream |
|---------|------|----------|
| Update available indicator | Yes | Yes |
| Model name | Yes | Yes |
| Task/dirname | Yes | Yes |
| Context percentage bar | Yes (80% scaling) | Yes (83.5% scaling — **corrected**) |
| CI status indicator | **Fork addition** (CI FAIL) | No |
| Health traffic light | **Fork addition** (H/H!/H!!) | No |
| Health check needed marker | **Fork addition** (H?) | No |
| DEV install indicator | **Fork addition** (DEV) | No |
| Automation level | **Fork addition** (Auto:3) | No |

**Fork output:** 8 elements (190 lines)
**Upstream output:** 4 elements (115 lines)

---

## Critical Upstream Improvements Fork Needs

### 1. Context Scaling Fix

**Fork (outdated):**
```javascript
const rawUsed = Math.max(0, Math.min(100, 100 - rem));
const used = Math.min(100, Math.round((rawUsed / 80) * 100));
// Assumes 80% context limit — 13% too conservative
```

**Upstream (correct):**
```javascript
const AUTO_COMPACT_BUFFER_PCT = 16.5;
const usableRemaining = ((remaining - 16.5) / (100 - 16.5)) * 100;
const used = Math.round(100 - usableRemaining);
// Accounts for Claude Code's actual 16.5% autocompact buffer
```

**Impact:** Fork's progress bar triggers false-alarm warnings earlier (green at 50% real vs fork's 63% real).

### 2. Stdin Timeout Guard

**Fork:** Missing — can hang on pipe issues (Windows/Git Bash)
**Upstream:** 3-second timeout guard (fix for issue #775)

### 3. CLAUDE_CONFIG_DIR Support

**Fork:** Hardcoded `~/.claude` paths
**Upstream:** Respects `CLAUDE_CONFIG_DIR` env var (issue #870)

### 4. Bridge File for Context Monitor

**Fork:** Not written
**Upstream:** Writes `/tmp/claude-ctx-{session_id}.json` for context-monitor hook

---

## Missing Hook: gsd-context-monitor.js

**This is the most important missing feature.**

Upstream's context-monitor hook (PostToolUse):
- Reads bridge file from statusline
- Injects `additionalContext` warnings to the **agent** (not just user)
- WARNING at 35% remaining: "Agent should wrap up current task"
- CRITICAL at 25% remaining: "Agent should stop immediately and save state"
- Smart debounce: 5 tool uses between warnings
- GSD-aware: Different advisory for GSD vs non-GSD projects

**Why it matters:** Currently fork's agents receive NO warning when context is exhausted. Automated workflows could consume context without awareness.

---

## Fork-Only Hooks (Worth Keeping)

### gsd-ci-status.js (72 lines)
- SessionStart hook
- Background check of latest GitHub Actions run
- Caches result to `~/.claude/cache/gsd-ci-status.json`
- Displays `CI FAIL` in statusline if latest run failed

### gsd-health-check.js (94 lines)
- SessionStart hook
- Evaluates cached health score
- Triggers health check based on config frequency
- Writes `gsd-health-check-needed` marker if check overdue

### gsd-version-check.js
- Fork version checking at install time

---

## Merge Strategy

### Phase 1: Adopt upstream foundation
1. Update context scaling to 83.5% usable
2. Add stdin timeout guard (3s)
3. Add CLAUDE_CONFIG_DIR support
4. Write bridge file for context-monitor

### Phase 2: Adopt context-monitor hook
5. Copy `gsd-context-monitor.js` from upstream
6. Register in installer's hook list

### Phase 3: Preserve fork enhancements
7. Keep CI status indicator (non-overlapping)
8. Keep health traffic light (non-overlapping)
9. Keep automation level indicator (non-overlapping)
10. Keep DEV indicator (non-overlapping)

**All fork indicators layer cleanly on top of upstream's corrected foundation.**
