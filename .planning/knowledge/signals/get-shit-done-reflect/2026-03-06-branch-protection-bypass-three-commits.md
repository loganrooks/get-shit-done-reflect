---
id: sig-2026-03-06-branch-protection-bypass-three-commits
type: signal
project: get-shit-done-reflect
tags: [ci, branch-protection, bypass, main-branch, test-failure]
created: 2026-03-06T23:30:00Z
updated: 2026-03-06T23:30:00Z
durability: convention
status: active
severity: critical
signal_type: deviation
signal_category: negative
phase: 42
polarity: negative
source: auto
occurrence_count: 2
related_signals: [sig-2026-03-02-ci-failures-ignored-throughout-v116]
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.16.0+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-06T23:30:00Z"
evidence:
  supporting:
    - "Commit 6aaa7c1 on main has failed required check 'Test' (gh api confirms conclusion=failure)"
    - "Commit a33117f on main missing required check 'Test'"
    - "Commit 468f40f on main missing required check 'Test'"
    - "Merged with ci signal: CI run 'CI' failed on main (commit 6aaa7c1) -- test failure on required check"
  counter:
    - "Failure was resolved in subsequent commits -- main is currently green"
    - "These three commits appear to be sequential pushes from the same work session -- likely a single direct push to main"
confidence: high
confidence_basis: "GitHub API confirms check status for all three commits. Direct observation, not inference."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Three commits on main bypassed branch protection: commit 6aaa7c1 had a failed required 'Test' check, and commits a33117f and 468f40f were missing the required 'Test' check entirely. This indicates code was pushed directly to main without passing CI, or that branch protection rules were not enforced for these pushes.

## Context

This is the second occurrence of the branch-protection bypass pattern. The previous signal (sig-2026-03-02-ci-failures-ignored-throughout-v116) documented CI failures being ignored throughout v1.16 development. The current observation covers a different set of commits but the same systemic issue -- code reaching main without passing required checks.

## Potential Cause

Most likely a direct push to main bypassing the PR workflow. The three commits appear sequential from the same work session, suggesting a single `git push origin main` rather than three separate bypasses. Branch protection may not be configured to block force-pushes or admin pushes, or the pushes were made with admin privileges that override protection rules.
