# Upstream Changes Since Last Sync

> Agent: Upstream Analysis | Source: 244 commits on upstream/main not in fork

## Major Changes Overview

**244 upstream commits** have been merged since the fork diverged.

---

## 1. MAJOR ARCHITECTURAL REFACTOR: Code Modularization

- **`gsd-tools.js → gsd-tools.cjs` + 11 domain modules** (commits `c67ab75`, `fa2e156`)
  - Split monolithic 4,597-line `gsd-tools.js` into:
    - `lib/commands.cjs`, `lib/config.cjs`, `lib/core.cjs`
    - `lib/frontmatter.cjs`, `lib/init.cjs`, `lib/milestone.cjs`
    - `lib/phase.cjs`, `lib/roadmap.cjs`, `lib/state.cjs`
    - `lib/template.cjs`, `lib/verify.cjs`
  - Renamed from `.js` to `.cjs` to prevent ESM conflicts (commit `24b933e`)
  - 145 new comprehensive tests created across domain modules

---

## 2. NEW AGENTS & COMMANDS (8 new items)

- **New Agent**: `gsd-nyquist-auditor.md` (178 lines) — advanced AI validation layer
- **New Agent**: `gsd-integration-checker.md` (22 lines)
- **New Commands**:
  - `/gsd:add-tests` — post-phase test generation
  - `/gsd:cleanup` — phase/milestone cleanup
  - `/gsd:health` — planning directory validation
  - `/gsd:validate-phase` — comprehensive phase validation

---

## 3. WORKFLOW ENHANCEMENTS

- **`quick.md`**: +405 lines — added `--discuss` flag for lightweight pre-planning discussion
- **`discuss-phase.md`**: +328 lines — now code-aware with codebase scouting, prior context loading
- **`execute-phase.md`**: +167 lines
- **`plan-phase.md`**: +334 lines
- **New workflows**: `add-tests.md` (351 lines), `cleanup.md` (152 lines), `health.md` (159 lines), `validate-phase.md`

---

## 4. CONFIGURATION & RUNTIME IMPROVEMENTS

- **Multi-agent support**: Codex multi-agent parity (commit `cf60f47`)
  - Request user input mapping, agent role generation
- **Model overrides**: Per-agent model override support
- **Nyquist validation layer**: Hardened defaults, retroactive validation (commit `ef032bc`)
- **Configuration migration**: Auto-migration of renamed settings
- **Windows compatibility**: Fixed `@file:` protocol resolution, cross-platform path handling

---

## 5. TESTING INFRASTRUCTURE

- **145 new tests** across 12 test files:
  - `agent-frontmatter.test.cjs` (181 tests)
  - `codex-config.test.cjs` (490 tests)
  - `commands.test.cjs` (1,188 tests)
  - `config.test.cjs` (355 tests)
  - `core.test.cjs` (804 tests)
  - `dispatcher.test.cjs` (277 tests)
  - Plus tests for init, milestone, phase, roadmap, state, verify-health, verify
- **CI/CD**: GitHub Actions test workflow added (`.github/workflows/test.yml`)
- **Coverage tooling**: c8 coverage with 70% line threshold

---

## 6. HOOK IMPROVEMENTS

- **New hook**: `gsd-context-monitor.js` (141 lines) — context window monitoring with agent-side alerts
- **Hook fixes**: Stdin timeout guard, CLAUDE_CONFIG_DIR respect, statusline context scaling
- **Skills frontmatter**: Added skills examples to all agents

---

## 7. BREAKING CHANGES & DEPRECATIONS

- **`depth` → `granularity`**: Config setting renamed (commit `c298a1a`, closes issue #879)
- **Removed**: `new-project.md.bak` (1041-line leftover file, commit `ee605aa`)
- **Workflow changes**: Plan-phase description updated (removed "execution" term to fix autocomplete)

---

## 8. DOCUMENTATION & UX

- **New docs**:
  - `USER-GUIDE.md` (502 lines) — comprehensive workflow diagrams, troubleshooting, config reference
  - `context-monitor.md` (115 lines) — hook documentation
- **README updates**: v1.22.4 quick command flags
- **CHANGELOG**: 268 lines of detailed release notes across v1.19.0 → v1.22.4

---

## 9. TEMPLATE ADDITIONS

- `VALIDATION.md` — new template for phase validation
- `retrospective.md` — new template for milestone retrospectives

---

## 10. KEY BUG FIXES

- Windows path handling (dollar signs, JSON quoting, glob expansion)
- `$HOME` vs `~` path resolution to prevent MODULE_NOT_FOUND in subagents
- State field format handling (both bold and plain formats)
- Regex metacharacter escaping in field extraction
- Cache clearing on update to prevent stale config
- Skill discovery from both `.claude/skills/` and `.agents/skills/`

---

## 11. VERSION PROGRESSION

| Version | Key Changes |
|---------|-------------|
| v1.20.0 | Modular refactor, test infrastructure |
| v1.22.0 | Codex multi-agent parity |
| v1.22.3 | Nyquist hardening, `depth→granularity` |
| v1.22.4 | Windows @file: protocol fix |
