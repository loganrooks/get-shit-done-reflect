---
title: "Cross-runtime CI compatibility testing — install verification + adaptive parity checks"
priority: HIGH
area: devops, testing, cross-runtime
created: 2026-04-09
context: "Phase 55.1 post-execution discussion — user identified gap between audit-level compatibility verification and what CI can catch"
---

# Cross-Runtime CI Compatibility Testing

## The Problem

We currently have NO CI verification that the installer produces correct output for both Claude Code and Codex CLI. The Codex compatibility audit (GPT-5.4, 2026-04-08) found 6+ substrate-level gaps that went undetected because nothing tests installed artifacts.

## Three Layers of Testing Needed

### Layer 1: Deterministic — "Does it install without errors?"
- GitHub Actions matrix: `node bin/install.js --claude` and `node bin/install.js --codex`
- Assert exit code 0, no stderr
- Assert expected file counts in output directories
- Assert manifest.json created with expected shape
- **This is straightforward and should be done first.**

### Layer 2: Deterministic — "Are known compatibility invariants preserved?"
- Assert `capability-matrix.md` installed and contains expected runtime entries
- Assert no `reset --soft` in workflow files (regression for #1981)
- Assert `atomicWriteFileSync` used everywhere (regression for #1972)
- Assert agent/sensor discovery patterns work for both `.md` and `.toml` (CODEX-02)
- Assert `config.toml` (not `codex.toml`) referenced correctly
- **Problem:** These checks encode current knowledge of what matters. When Codex/Claude runtimes change, the checks go stale silently.

### Layer 3: Adaptive — "Is the installed harness actually compatible?"
This is the hard problem. The 2026-04-08 audit used AI models (GPT-5.4, Claude Sonnet, Opus) to reason about compatibility — something static tests can't do. Options explored:

**Option A: AI-triggered review in CI**
- Use GitHub Copilot / Codex API to run audit-like questions against installed artifacts
- Questions like: "Does this capability-matrix.md accurately describe the current Codex CLI features?"
- Pro: Adapts as runtimes change. Con: Non-deterministic, costs money per CI run, may be flaky.
- Open question: Is GitHub Copilot's CI integration mature enough for this? Can you trigger a structured code review with specific questions?

**Option B: Living parity document + diff-based alerts**
- `cross-runtime-parity-research.md` (CODEX-05) records last-audited state
- CI checks: "has the installed output changed since the parity doc was last updated?"
- If drift detected: fail CI with "parity document may be stale — re-audit needed"
- Pro: Deterministic. Con: Only catches staleness, not correctness.

**Option C: Periodic AI audit (not CI, but scheduled)**
- Use `/gsdr:schedule` or cron to periodically run a Codex compatibility audit
- Compare results to previous audit, flag regressions
- Pro: Thorough, adapts to runtime changes. Con: Not in CI path, could miss regressions between audits.

**Option D: Hybrid — deterministic CI + periodic AI audit**
- Layer 1+2 in CI (fast, deterministic, catches regressions)
- Layer 3 via scheduled audit (thorough, adaptive, catches drift)
- Parity document bridges them: CI checks for staleness, audit updates the document
- **This is probably the right approach.**

## Relationship to Existing Requirements

- **CODEX-05 (Phase 55.2):** Creates the parity document and post-install smoke test — Layer 2 foundation
- **SENS-06 (Phase 60):** Post-install parity verification — Layer 2 automation
- **This todo extends beyond both:** Layer 3 (adaptive AI audit) is not in any current requirement

## Suggested Phasing

1. **Now (Phase 55.2):** CODEX-05 creates the parity doc and basic smoke test
2. **Phase 60:** SENS-06 adds post-install parity verification
3. **v1.21 or backlog:** Layer 3 — explore GitHub Copilot CI integration or scheduled AI audit
4. **Quick win:** Add Layer 1 to existing GitHub Actions workflow (matrix install test)

## Additional Design Space

- **Change-scoped review depth:** Different levels of testing depending on what changed (runtime code vs docs vs workflows) and whether upstream Codex/Claude have released new versions. Lightweight checks on most PRs, extensive audit triggered when runtime-touching files change.
- **PR-triggered audit:** More extensive compatibility review as part of PR review workflow, not just CI. Could use AI-assisted review with structured questions.
- **Runtime version tracking:** Detect when Codex CLI or Claude Code versions change and trigger deeper compatibility checks.

## Key Insight

The fundamental tension: deterministic checks go stale as runtimes evolve, AI-driven audits adapt but aren't reproducible. The design space is wide — don't foreclose on approach yet. Capture the need, explore solutions as we gain more Codex deployment experience through Phase 55.2 and beyond.
