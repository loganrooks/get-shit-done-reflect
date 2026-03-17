# Feature Overlap & Supersession Analysis

> Agent: Feature Overlap | Source: comparative analysis of 6 feature pairs

---

## Summary Table

| Pair | Overlap? | One Better? | Complementary? | Conflict? | Action |
|------|----------|------------|----------------|-----------|--------|
| Health commands | YES | NO | YES | LOW | Keep both — fork is superset |
| Validation systems | NO | NO | YES | NONE | Keep both — orthogonal |
| Config migration | YES | Fork wins | YES | MEDIUM | Adopt fork's manifest approach |
| Testing | PARTIAL | NO | YES | MEDIUM | Adopt upstream modular arch |
| Codex support | YES | TBD | PARTIAL | MEDIUM | Monitor upstream |
| Discuss-phase | YES | Upstream wins | NO | NONE | Adopt upstream's code-aware version |

---

## 1. Health Commands: `/gsdr:health-check` vs `/gsd:health`

**Fork:** Probe-based discovery (11 modular probes), two-dimensional scoring (infrastructure binary + workflow continuous), caching, reactive session-start triggers, `--fix` auto-repair.

**Upstream:** Simple `.planning/` directory validation. Missing files, invalid configs, inconsistent state. `--repair` flag.

**Verdict: COMPLEMENTARY** — Fork's health-check is a superset. Upstream's is lightweight for minimal workflows. No code conflict (different prefixes).

---

## 2. Signal Schema Validation vs Nyquist Auditor

**Fork:** Input validation — enforces signal frontmatter structure at KB write-time. Tiered (required/conditional/recommended), backward compat.

**Upstream:** Output validation — post-phase auditor that generates behavioral tests for phase requirements, verifies coverage, audits agent work quality.

**Verdict: ORTHOGONAL** — Signal validation catches bad data at source; Nyquist catches incomplete work post-phase. Different execution points, different purposes.

**Action:** Adopt Nyquist auditor — fork lacks phase-completion auditing.

---

## 3. Config Migration: Feature-Manifest vs Point-Fix

**Fork (declarative):**
```javascript
// Schema in feature-manifest.json drives migration
for (const [feature, def] of Object.entries(manifest.features)) {
  if (!config[key]) config[key] = applyDefaults(def.schema);
}
```

**Upstream (hardcoded):**
```javascript
// One-off fix per change
if ('depth' in config && !('granularity' in config)) {
  config.granularity = depthToGranularity[config.depth];
  delete config.depth;
}
```

**Verdict: FORK'S APPROACH IS BETTER** — Declarative, maintainable, extensible. Upstream's approach doesn't scale.

---

## 4. Testing: Vitest (277 tests) vs Node:test (145 tests)

**Fork tests:** Signal collection, sensor management, automation levels, KB infrastructure, multi-runtime wiring, installer namespace rewrites.

**Upstream tests:** Modular lib/ unit tests (config, state, verify, frontmatter, phase, roadmap, milestone, init, commands, codex-config, dispatcher, agent-frontmatter).

**Verdict: COMPLEMENTARY** — Fork tests domain features; upstream tests architectural modules. Both needed.

**Critical issue:** Fork tests a 6,651-line monolith; upstream tests 11 focused modules. Fork must adopt modular structure or maintenance diverges permanently.

---

## 5. Codex Support: Installer vs Multi-Agent Parity

**Fork:** Install-time conversion (commands → SKILL.md, tool name translation, AGENTS.md generation). Sequential execution only (no sub-agents).

**Upstream:** Evolving multi-agent execution flow (agent role generation, user input mapping). Still in active development.

**Verdict: MONITOR** — Fork's approach works but is limited. If upstream achieves multi-agent parity, worth adopting.

---

## 6. Discuss-Phase: Fork (unchanged) vs Upstream (code-aware)

**Fork:** Inherited from upstream, unmodified.

**Upstream:** Same base + code-aware scouting (codebase scan before gray area identification, prior context loading).

**Verdict: UPSTREAM IS BETTER** — Code-awareness is a pure improvement. +328 lines, low risk, no conflict.

**Action:** Adopt immediately.
