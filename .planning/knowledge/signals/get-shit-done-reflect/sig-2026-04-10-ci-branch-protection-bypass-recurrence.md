---
id: sig-2026-04-10-ci-branch-protection-bypass-recurrence
type: signal
project: get-shit-done-reflect
tags: [ci, branch-protection, bypass, main-branch, direct-push, recurring, admin-bypass]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: critical
signal_type: deviation
signal_category: negative
phase: "57.4"
plan: "0"
polarity: negative
source: local
occurrence_count: 3
related_signals:
  - sig-2026-03-06-branch-protection-bypass-three-commits
  - sig-2026-03-02-ci-failures-ignored-throughout-v116
recurrence_of: sig-2026-03-06-branch-protection-bypass-three-commits
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z: escalated from notable to critical per recurrence-of-remediated rule"
evidence:
  supporting:
    - "gh api repos/.../commits/d3da37ce.../check-runs returns empty array []"
    - "gh api repos/.../commits/947832bb.../check-runs returns empty array []"
    - "Branch protection config confirms required check: 'Test'"
    - "Commit d3da37ce message: 'docs(57): fix context-checker warnings...' — direct push, not PR"
    - "Commit 947832bb message: 'docs(57): adaptive telemetry architecture principle...' — direct push, not PR"
    - "Both commits dated 2026-04-09"
    - "Previous occurrence: sig-2026-03-06-branch-protection-bypass-three-commits (lifecycle_state: remediated) — this recurrence regresses that signal back to detected"
    - "Earlier root-cause pattern: sig-2026-03-02-ci-failures-ignored-throughout-v116"
  counter:
    - "enforce_admins: false — repo owner (admin) is explicitly permitted to bypass required checks"
    - "Both commits are documentation-only changes with low regression risk"
    - "Both commits are on a docs scope, not code scope"
confidence: high
confidence_basis: "Direct API query of commit check-runs endpoint confirms absence of runs; branch protection config confirms 'Test' is required but enforce_admins=false permits admin bypass. The recurrence is mechanically verifiable and matches the structural pattern of the prior remediated signal."
triage: {}
remediation: {}
verification: {}
---

## What Happened

Two commits on main branch — `d3da37ce` ("docs(57): fix context-checker warnings...") and `947832bb` ("docs(57): adaptive telemetry architecture principle...") — dated 2026-04-09 were direct pushes with no triggered check-runs. Branch protection config requires the `Test` check but `enforce_admins: false` permits the repo admin to bypass. The CI sensor confirmed via `gh api repos/.../commits/{sha}/check-runs` that both commits have empty check-runs arrays.

This is a **recurrence** of `sig-2026-03-06-branch-protection-bypass-three-commits` (which was in `remediated` state with a lifecycle log entry noting clean CI post-v1.16). The recurrence regresses that signal back to `detected` and escalates the current observation from the sensor's suggested `notable` severity to `critical` per the recurrence-of-remediated-signal rule.

## Context

- Branch: main
- CI provider: GitHub Actions
- Required check: `Test`
- Admin bypass: `enforce_admins: false` — repo owner can bypass required checks
- Two commits on 2026-04-09 with no check-runs, both documentation-only
- Prior remediated signal: `sig-2026-03-06-branch-protection-bypass-three-commits` (critical, remediated) — resolved post-v1.16 with clean CI record
- Earlier signal: `sig-2026-03-02-ci-failures-ignored-throughout-v116` — the root-cause pattern from v1.16 development

## Potential Cause

The recurrence indicates that the previous remediation was narrower than needed. The 2026-03-06 remediation was "clean CI record in v1.17+ phase execution" — which held for phase-execution commits but did not cover direct-to-main docs commits by the admin. The structural gap: `enforce_admins: false` means branch protection is advisory rather than enforced for the admin. Any direct push by the admin bypasses CI regardless of remediation status of prior signals.

Three distinct factors:

1. **Admin bypass is enabled.** The branch protection config explicitly permits admins to push directly. This is the root structural cause — any remediation that does not change the config cannot fully close the gap.

2. **Docs-scope mental model.** The admin may treat docs-only changes as low-risk and skip the PR workflow for them. This is the behavioral cause that leads to the bypass being used. The commits that bypassed are both docs-scope, matching this pattern.

3. **Prior remediation was behavioral, not structural.** The 2026-03-06 signal was remediated by "no more bypasses during phase execution" — a behavioral promise that does not prevent the admin from bypassing at other times.

The recurrence suggests two fix directions:

- **Structural:** Set `enforce_admins: true` in branch protection config. This would mechanically prevent all bypasses including admin ones. The cost is friction on legitimate direct-to-main docs work.
- **Behavioral+tooling:** Leave admin bypass enabled but add a pre-push hook or post-push detector that fires a signal every time a main-branch commit has no check-runs, so the gap cannot silently accumulate. This is already what the CI sensor is doing — so the sensor is working, but the remediation is not closing the loop.

The fact that the remediation held for 1+ month before recurring on docs-scope commits suggests the behavioral remediation does partially work. Escalating to critical flags that the remediation needs revisiting, not that the problem is unmanaged.

## Remediation

Pending. The recurrence resets the remediation state on the parent signal (`sig-2026-03-06-branch-protection-bypass-three-commits`) — that signal is being regressed from `remediated` to `detected` by this same synthesizer run.
