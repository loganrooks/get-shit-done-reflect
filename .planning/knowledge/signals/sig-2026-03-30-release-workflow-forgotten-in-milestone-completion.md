---
type: observation
severity: medium
phase: "v1.18-completion"
detected_by: human
date: 2026-03-30
status: open
tags: [release-workflow, deployment, milestone-completion, process-gap, automation-opportunity]
---

# Signal: Release Workflow Forgotten During Milestone Completion

## What Happened

During v1.18 milestone completion, three deployment steps were missed:

1. **Version bump** — `package.json` was still at `1.17.5` when the milestone was being completed. The bump to `1.18.0` only happened after the user asked about it.

2. **GitHub Release creation** — The repo has a `publish.yml` workflow that uses npm Trusted Publishing (no NPM_TOKEN needed). It triggers on GitHub Release creation from `reflect-v*` tags. Nobody remembered this workflow existed — the agent attempted `npm publish` locally, failed on auth, and reported it as a pre-existing NPM_TOKEN blocker. The actual fix was just creating a GitHub Release.

3. **Tag ordering** — The git tag was created before the version bump commit, causing the publish workflow to fail with "Version mismatch: package.json has 1.17.5 but tag is v1.18.0". The tag had to be deleted and recreated at the correct commit.

4. **Multi-runtime installation** — Codex installation wasn't updated until the user asked. The `complete-milestone` workflow has no step for reinstalling across runtimes.

## The Pattern

The `complete-milestone` workflow covers archival, PROJECT.md evolution, and git tagging, but has no steps for:
- Bumping `package.json` version
- Creating a GitHub Release (which triggers npm publish)
- Ensuring the tag is created AFTER the version bump
- Reinstalling for non-Claude runtimes (Codex, Gemini, OpenCode)
- Verifying the publish workflow succeeds

The agent also had stale knowledge — it "knew" npm publishing required NPM_TOKEN from a v1.12-era blocker, but didn't check whether the infrastructure had changed (Trusted Publishing was set up later).

## Why It Matters

- Users who install via `npx get-shit-done-reflect-cc` would get v1.17.5 instead of v1.18.0
- The fork supports 4 runtimes but the completion flow only installs for the active one
- A working CI/CD pipeline existed but was invisible to the milestone completion process
- The agent's cached assumption about NPM_TOKEN blocked discovery of the actual (working) publish mechanism

## Root Cause

1. **Workflow gap**: `complete-milestone.md` doesn't include release/deployment steps
2. **Stale assumption**: NPM_TOKEN blocker was never re-evaluated after Trusted Publishing was configured
3. **Single-runtime bias**: Completion flow assumes Claude-only installation

## Suggested Remediation

- Add a "release and deploy" step to `complete-milestone.md` or create a post-completion checklist that includes: version bump, multi-runtime install verification, GitHub Release creation, publish workflow monitoring
- The `/gsdr:release` command exists but wasn't invoked during milestone completion — consider making it part of the completion flow or at minimum surfacing it in the "offer next" step
- Ensure the tag is created AFTER the version bump (or version bump happens before tagging in the workflow)
- Add a health probe or automation check that detects when the installed version doesn't match `package.json`
