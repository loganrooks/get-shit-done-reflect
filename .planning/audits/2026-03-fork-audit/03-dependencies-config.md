# Dependency & Configuration Analysis

> Agent: Dependency Analysis | Source: package.json, feature-manifest.json, config files

---

## 1. Package Identity

| Aspect | Fork | Upstream |
|--------|------|----------|
| Package name | `get-shit-done-reflect-cc` | `get-shit-done-cc` |
| Version | `1.17.1` | `1.22.4` |
| Description | "A self-improving AI coding system that learns from its mistakes" | "A meta-prompting, context engineering and spec-driven development system..." |
| Repository | `loganrooks/get-shit-done-reflect` | `glittercowboy/get-shit-done` |

---

## 2. DevDependencies

**Fork adds:**
- `vitest@^3.0.0` — Modern test framework with v8 coverage
- `vite@^6.4.1` — Build tool (vitest dependency)
- `@vitest/coverage-v8@^3.0.0` — Coverage plugin

**Upstream uses:**
- `c8@^11.0.0` — Legacy coverage reporter
- `esbuild` — Build tool

**Philosophy divergence:** Fork chose vitest (ESM-native, rich features, dependencies) vs upstream's node:test (zero-dep, CommonJS, minimal).

---

## 3. npm Scripts

**Fork (10 scripts):**
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:infra": "vitest run tests/integration/kb-infrastructure.test.js...",
  "test:smoke": "bash tests/smoke/run-smoke.sh",
  "test:smoke:quick": "SMOKE_TIER=quick bash tests/smoke/run-smoke.sh",
  "test:smoke:full": "SMOKE_TIER=full bash tests/smoke/run-smoke.sh",
  "test:upstream": "node --test get-shit-done/bin/gsd-tools.test.js",
  "test:upstream:fork": "node --test get-shit-done/bin/gsd-tools-fork.test.js",
  "build:hooks": "node scripts/build-hooks.js"
}
```

**Upstream (4 scripts):**
```json
{
  "test": "node scripts/run-tests.cjs",
  "test:coverage": "c8 --check-coverage --lines 70 ..."
}
```

---

## 4. Feature Manifest (Fork-Only)

`get-shit-done/feature-manifest.json` — 7 feature areas with schemas:

| Feature | Since | Purpose |
|---------|-------|---------|
| `health_check` | v1.12.0 | Artifact staleness, workflow thresholds, reactive triggers |
| `devops` | v1.12.0 | CI/CD providers, deploy targets, commit conventions |
| `release` | v1.15.0 | Version tracking, changelog, registry management |
| `signal_lifecycle` | v1.16.0 | State strictness, triage rigor, recurrence escalation |
| `signal_collection` | v1.16.0 | Per-sensor overrides, synthesizer model, auto-collection |
| `spike` | v1.16.0 | Experiment system with sensitivity levels |
| `automation` | v1.17.0 | Global automation levels (0-3), per-feature overrides |

**Upstream has no feature manifest.** Configuration embedded in runtime code.

---

## 5. Project Configuration (Fork-Only)

`.planning/config.json`:
- Mode: `yolo` (aggressive)
- Parallelization: enabled
- Model profile: `quality`
- Health check frequency: `milestone-only`
- CI provider: `github-actions`
- Automation stats and reflection settings (auto-managed)

---

## 6. .gitignore Differences

Fork adds:
```
tests/benchmarks/results.json
.planning/.*.lock
.vscode/
```

---

## 7. Version Alignment

Fork is **5 minor versions behind** upstream (v1.17.1 vs v1.22.4). This gap represents the 244 upstream commits not yet merged.
