---
id: sig-2026-04-20-publish-workflow-node20-blocked-v1195-npm
type: signal
project: get-shit-done-reflect
tags:
  - release-process
  - npm-publish
  - github-actions
  - node-version
  - ci
  - config-mismatch
  - release-boundary
created: "2026-04-20T05:41:59Z"
updated: "2026-04-20T05:41:59Z"
durability: convention
status: active
severity: critical
signal_type: config-mismatch
phase: "57.8"
plan: "0"
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-02-17-release-process-fragile-manual-steps
  - sig-2026-04-17-phase-closeout-left-state-pr-release-pending
  - sig-2026-04-20-phase-closeout-planning-state-release-lag
provenance_schema: v2_split
provenance_status: ""
about_work: []
detected_by:
  role: manual-observer
  harness: codex-cli
  platform: codex
  vendor: openai
  model: not_available
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.5+dev
  generated_at: "2026-04-20T05:41:59Z"
  session_id: 019d9aa2-7ff7-7e30-848c-bfe8f70dd8a1
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: manual_signal_contract
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: .planning/config.json:model_profile
    gsd_version: .codex/get-shit-done-reflect/VERSION
    generated_at: writer_clock
    session_id: env:CODEX_THREAD_ID
written_by:
  role: manual-writer
  harness: codex-cli
  platform: codex
  vendor: openai
  model: not_available
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.5+dev
  generated_at: "2026-04-20T05:41:59Z"
  session_id: 019d9aa2-7ff7-7e30-848c-bfe8f70dd8a1
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: manual_signal_contract
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: .planning/config.json:model_profile
    gsd_version: .codex/get-shit-done-reflect/VERSION
    generated_at: writer_clock
    session_id: env:CODEX_THREAD_ID
runtime: codex-cli
model: not_available
gsd_version: 1.19.5+dev
---

## What Happened

`reflect-v1.19.5` was published as a GitHub Release on April 17, 2026, but the npm package never advanced from `1.19.4`.

By April 20, 2026, `npm view get-shit-done-reflect-cc version dist-tags --json` still reported `version: 1.19.4` and `dist-tags.latest: 1.19.4`, while the `reflect-v1.19.5` GitHub Release and tag already existed. The release-triggered publish workflow (`run 24556352028`) fired, but it failed in `Run tests before publish` before the `npm publish --provenance --access public` step could execute.

The failure was not a generic flaky test. The publish job was still configured to run on Node `20.x`, while the package and KB tooling now require Node `>=22.5.0`. The failing workflow log repeatedly reported `Error: node:sqlite requires Node.js >= 22.5.0 (current: v20.20.2)` and `ERROR: gsd-tools.cjs kb rebuild failed; KB markdown index was updated but kb.db refresh did not complete`.

## Context

- Local source `package.json` is version `1.19.5` and declares `engines.node: >=22.5.0`.
- `.github/workflows/publish.yml` still uses `actions/setup-node@v4` with `node-version: '20.x'`.
- The failing publish workflow was triggered by the `release: published` event for `reflect-v1.19.5`.
- The release therefore looked complete from GitHub's release surface even though npm never received `1.19.5`.
- The user noticed this concretely by running the `npx` installer and still getting `1.19.4`.
- This showed up while trying to determine how to release the current 57.8/58 closeout work safely and whether `1.19.5` must be repaired before a later patch release.

## Potential Cause

The publish workflow drifted out of sync with the package runtime floor and the KB infrastructure. CI had already moved to a newer Node surface, but the release-path workflow still pinned Node `20.x`, so the release trigger launched a publish job that could no longer pass its own pre-publish tests.

That created a false release boundary: GitHub Release published, tag present, but npm still stale. There is also no structural recovery path that automatically turns a failed publish run for an already-published release into a pending remediation state, so the failure remained latent until the user checked npm directly.
