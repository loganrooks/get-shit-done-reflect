---
id: sig-2026-04-21-installer-advertises-gemini-opencode-unsupported
type: signal
project: get-shit-done-reflect
tags: [scope-drift, installer, cross-runtime, untyped-assumption, governance, v1.20, gate-09]
created: "2026-04-21T06:33:31Z"
updated: "2026-04-21T06:33:31Z"
durability: convention
status: active
severity: notable
signal_type: config-mismatch
phase: "59"
plan: ""
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
provenance_schema: v2_split
provenance_status: ""
about_work: []
detected_by:
  role: detector
  harness: claude-code
  platform: linux
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: "1.19.6+dev"
  generated_at: "2026-04-21T06:33:31Z"
  session_id: not_available
  provenance_status: ""
  provenance_source: manual
written_by:
  role: writer
  harness: claude-code
  platform: linux
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: "1.19.6+dev"
  generated_at: "2026-04-21T06:33:31Z"
  session_id: not_available
  provenance_status: ""
  provenance_source: manual
runtime: claude-code
model: claude-opus-4-7
gsd_version: "1.19.6+dev"
---

## What Happened

During Phase 59 execution, Plan 59-05's `bin/install.js --local` run created untracked `.gemini/` and `.opencode/` directories locally. Investigation revealed that `bin/install.js:72-161` accepts `--gemini`, `--opencode`, and `--all` flags and treats Gemini + OpenCode as first-class runtime targets — despite the project scope being Claude Code + Codex CLI only. The installer's help text advertises these flags to end users. This scope drift went undetected through 58 phases, multiple milestone audits, the v1.19.x release train, and Phase 58.1's explicit cross-runtime distribution-parity work (which only covered Claude ↔ Codex).

## Context

- `bin/install.js:83` default-`--all` expands to `['claude', 'opencode', 'gemini', 'codex']`
- `bin/install.js:85` auto-detect default expands to `['claude', 'opencode']` (Gemini absent here, OpenCode still first-class)
- `bin/install.js:95-96, 141-161` include path-resolution and config-dir helpers for both runtimes
- `bin/install.js:558-900` includes a full OpenCode frontmatter/command converter (name: stripping, color→hex, `/gsd:cmd` → `/gsd-cmd` flattening, Claude → Gemini tool-name translation)
- Phase 58.1 XRT-01 cross-runtime parity pattern (merged 2026-04-20) covers Claude ↔ Codex only
- Phase 59's new `tests/integration/cross-runtime-kb.test.js` (added this phase) sha256-compares `.claude/get-shit-done-reflect/` ↔ `.codex/get-shit-done-reflect/` only — no Gemini or OpenCode coverage
- `.gitignore` excludes `.claude/` and `.codex/` but not `.gemini/` or `.opencode/` — indicating the exclusion list was maintained with awareness of only two runtimes, yet the installer kept writing to four
- No `feature-manifest.json` entry, no test, and no documentation audit checks the set of runtimes the installer targets against a declared "supported runtimes" list

Surfaced in conversation immediately after the Phase 59 PR merge (PR #54, merge commit 7751cc8b), before any v1.20-milestone release.

## Potential Cause

Untyped scope assumption. The project has no machine-checkable declaration of "supported runtimes" that installer code, tests, and feature-manifest entries can all reference. Supported-runtime scope lives only in the implicit understanding of humans making local decisions about each change — the installer retains Gemini/OpenCode support by inertia from earlier experimentation, and nothing in the CI, plan-checker, verifier, or milestone-audit loop compares the installer's advertised targets against a canonical scope list. This is a structural analog of the v1.16 lifecycle-representation gap (`sig-2026-03-04-signal-lifecycle-representation-gap`): an invariant the humans believe is true but that no machine check enforces.

Remediation should be an inserted Phase 59.1 that (1) declares a canonical supported-runtimes list in a load-bearing config/manifest location, (2) strips Gemini/OpenCode flags, path resolution, frontmatter conversion, and help text from the installer, (3) updates `.gitignore` to cover `.gemini/`/`.opencode/` (defensive), (4) adds a test that asserts the installer's target-runtime set equals the declared supported-runtimes list, and (5) records the drop in REQUIREMENTS.md + ROADMAP before the v1.20.0 milestone release so it isn't a surprise for downstream users of the v1.19.x flags. Related to the v1.20 governance theme around explicit scope ledgers (GATE-09).
