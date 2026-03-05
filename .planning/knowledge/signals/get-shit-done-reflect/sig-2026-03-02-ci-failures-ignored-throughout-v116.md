---
id: sig-2026-03-02-ci-failures-ignored-throughout-v116
type: signal
project: get-shit-done-reflect
tags: [ci, branch-protection, workflow-bypass, wiring-test, dual-directory, critical-process-failure]
created: 2026-03-02T21:00:00Z
updated: 2026-03-02T21:00:00Z
severity: critical
signal_type: deviation
signal_category: negative
lifecycle_state: detected
confidence: high
confidence_basis: "5 consecutive CI failures visible in gh run list, all showing same wiring-validation.test.js failure"
evidence:
  supporting:
    - "5 consecutive failures from 2026-03-01 to 2026-03-02 (test(33) through chore(v1.16 milestone))"
    - "Branch protection bypass messages in every push: 'Bypassed rule violations for refs/heads/main'"
    - "Root cause: wiring-validation.test.js checks .claude/agents/ which doesn't exist in CI"
    - "Last successful CI was v1.15.6 release on 2026-02-26"
  counter: []
phase: 35
source: manual
---

## CI Failures Ignored Throughout v1.16 Milestone

5 consecutive CI failures on the fork (loganrooks/get-shit-done-reflect) from 2026-03-01 through 2026-03-02, spanning Phases 33-35 and milestone completion. All failures were bypassed via admin push to main, with no investigation.

### Root Cause

`tests/integration/wiring-validation.test.js` checks `.claude/agents/{value}.md` for agent file existence. CI environment has no `.claude/` directory (gitignored, populated only by installer). The 4 new v1.16 sensor agents (artifact-sensor, git-sensor, log-sensor, signal-synthesizer) are referenced as subagent_type in workflows but the test can't resolve them at the `.claude/` path.

### Impact

- CI was red for the entire second half of v1.16 (3 days, 5 pushes)
- Branch protection was bypassed 5 times
- The wiring validation test was doing its job correctly — it detected the issue
- Nobody (human or agent) investigated the CI failures
- The self-improvement system failed to catch its own process failure

### Systemic Issue

This is not just a test bug — it's a workflow failure. The GSD execution workflow pushes directly to main after each plan, bypassing the PR workflow that would surface CI failures. The branch protection rules exist but are overridden by admin access.
