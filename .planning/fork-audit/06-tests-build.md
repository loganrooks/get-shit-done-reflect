# Test Suite & Build Infrastructure

> Agent: Testing Analysis | Source: test files, CI workflows, hooks, build scripts

---

## 1. Test Suite Comparison

| Aspect | Fork | Upstream |
|--------|------|----------|
| Framework | vitest ^3.0.0 | node:test (built-in) |
| Test count | 277 across 8 files | ~145 across 12 .cjs files |
| Coverage tool | @vitest/coverage-v8 | c8 (70% line threshold) |
| Module format | ESM | CommonJS (.cjs) |
| Smoke tests | Yes (bash, tiered) | No |
| Benchmarks | Yes (framework + runner) | No |
| E2E | Placeholder (skipped) | No |
| CI | 3 GitHub Actions workflows | 1 workflow |

---

## 2. Fork Test Files

### Unit Tests (3 files, ~3,155 LOC)

| File | LOC | Tests |
|------|-----|-------|
| `sensors.test.js` | 207 | CLI sensor agent management |
| `install.test.js` | 1,954 | Installer: path replacement, KB migration, namespace rewrites |
| `automation.test.js` | 994 | Automation levels, feature overrides, event tracking, locking, regime changes |

### Integration Tests (4 files, ~2,169 LOC)

| File | LOC | Tests |
|------|-----|-------|
| `kb-infrastructure.test.js` | 522 | KB directory creation, index rebuilding, migration, template provenance |
| `wiring-validation.test.js` | 469 | Path reference validation across agents/workflows/commands |
| `multi-runtime.test.js` | 766 | Cross-runtime KB path handling (Claude, Gemini, Codex, OpenCode) |
| `cross-runtime-kb.test.js` | 412 | KB behavior across runtimes |

### E2E (1 file, 51 LOC)
- `real-agent.test.js` — placeholder for real Claude agent spawning (skipped by default)

### Upstream-Ported Tests
- `gsd-tools.test.js` (4,551 LOC) — upstream test suite ported to fork
- `gsd-tools-fork.test.js` (473 LOC) — fork-specific extensions:
  - Config set/get with fork custom fields (health_check.*, devops.*)
  - Signal triage with populated lifecycle objects
  - Backward compatibility constraints

---

## 3. Smoke Tests

Bash-based orchestration with tiers:
- **quick**: init + plan + execute + manual signal + collect
- **standard**: + regression + reflect features
- **full**: + spike testing

Tests real `claude` CLI integration. Isolates KB entries by RUN_ID, cleans up post-test.

---

## 4. Benchmark Framework

- `tests/benchmarks/framework.js` — Performance assessment framework
- `tests/benchmarks/runner.js` — Execution engine
- `tests/benchmarks/tasks/` — Tiered tasks (quick-smoke, standard-signal)
- Tracks: signals_captured, kb_entries, deviation_detected, execution_time
- Results in `tests/benchmarks/results.json` (gitignored)

---

## 5. Hook Comparison

| Hook | Fork | Upstream | Notes |
|------|------|----------|-------|
| `gsd-check-update.js` | Modified (pkg name) | Yes | Fork: `get-shit-done-reflect-cc` |
| `gsd-statusline.js` | Enhanced | Yes | Fork adds: CI indicator, health traffic light, automation level, DEV marker |
| `gsd-context-monitor.js` | **Missing** | Yes (new) | Token usage warnings — fork should adopt |
| `gsd-ci-status.js` | Fork addition | No | SessionStart: GitHub Actions CI check, background, cached |
| `gsd-health-check.js` | Fork addition | No | SessionStart: health score evaluation, config-based frequency |
| `gsd-version-check.js` | Fork addition | No | Version check at install |

### Hook Discovery
- **Upstream**: Static whitelist in build-hooks.js
- **Fork**: Dynamic glob (`*.js` matching) — new hooks ship without build script changes

---

## 6. Build Scripts

| Script | Fork | Upstream |
|--------|------|----------|
| `build-hooks.js` | Modified (glob discovery) | Static whitelist |
| `dev-setup.sh` | Fork addition | No |
| `dev-teardown.sh` | Fork addition | No |
| `stamp-version.js` | Fork addition | No |
| `run-tests.cjs` | No | Upstream addition (test orchestrator) |

---

## 7. CI/CD Workflows

| Workflow | Fork | Upstream |
|----------|------|----------|
| `ci.yml` | Vitest suite | No |
| `publish.yml` | npm `get-shit-done-reflect-cc` | No |
| `smoke-test.yml` | E2E with Claude CLI | No |
| `test.yml` | No | node:test + c8 |

---

## 8. Fork-Unique Test Coverage Areas

1. **Dual-namespace verification** — gsd→gsdr rewrite correctness
2. **Multi-runtime path handling** — Claude, Gemini, Codex, OpenCode
3. **KB infrastructure** — directory creation, index rebuild, migration safety
4. **Content wiring validation** — agent @-refs resolve to valid files
5. **Automation system** — level resolution, feature overrides, deferral, capability capping
6. **Signal schema validation** — tiered frontmatter requirements

---

## 9. Vitest Configuration

```js
// vitest.config.js
{
  test: {
    timeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['tests/helpers/setup.js'],
    coverage: {
      exclude: ['node_modules', 'tests', 'hooks/dist']
    }
  }
}
```
