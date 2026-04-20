---
phase: quick-260419-wjj
plan: 01
quick_id: 260419-wjj
description: Patch roadmap and requirements so downstream provenance phases explicitly cover manual gsdr-signal parity
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/ROADMAP.md
  - .planning/REQUIREMENTS.md
autonomous: true
signature:
  role: planner
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5
  reasoning_effort: xhigh
  profile: quality
  gsd_version: 1.19.4+dev
  generated_at: "2026-04-20T03:28:19.000Z"
  session_id: 019da8ec-90e4-7fb1-998a-19d20efcd8b4
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: derived
    reasoning_effort: derived
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: system_identity
    reasoning_effort: repo_planner_policy
    profile: config
    gsd_version: config
    generated_at: writer_clock
    session_id: env:CODEX_THREAD_ID
must_haves:
  truths:
    - "Phase 57.8's declarative scope explicitly names the manual `/gsdr-signal` command and installed-skill/manual authoring surface as part of the provenance contract that was missed, rather than implying only automated sensor and synthesizer paths."
    - "Downstream provenance declarations explicitly require manual-signal parity and regression coverage so later provenance work cannot treat the manual path as out of scope or incidentally covered."
    - "The quick-task summary and later `STATE.md` row can cite the exact 57.8, 60.1, and PROV entries that were tightened."
  artifacts:
    - path: ".planning/ROADMAP.md"
      provides: "Phase-level declarations for 57.8 and 60.1 that explicitly cover the missed manual signal surface and downstream parity/regression ownership"
      contains: "gsdr-signal"
    - path: ".planning/REQUIREMENTS.md"
      provides: "Matching PROV requirement text that names manual `/gsdr-signal` parity and regression obligations"
      contains: "PROV-04"
  key_links:
    - from: ".planning/ROADMAP.md"
      to: ".planning/REQUIREMENTS.md"
      via: "57.8 phase text aligned to PROV-04 and PROV-07 wording"
      pattern: "PROV-04|PROV-07|gsdr-signal"
    - from: ".planning/ROADMAP.md"
      to: ".planning/REQUIREMENTS.md"
      via: "60.1 phase text aligned to PROV-09, PROV-13, and PROV-14 downstream parity coverage"
      pattern: "PROV-09|PROV-13|PROV-14|manual"
---

<objective>
Patch the declarative planning surfaces so the missed manual `/gsdr-signal` provenance surface is explicit in both the 57.8 narrative and the downstream provenance requirements.

Purpose: Quick task `260419-6uf` fixed the source command and Codex install path, but the roadmap and requirement text still describe 57.8 and 60.1 as if automated sensor/synthesizer surfaces were the only provenance contract that mattered. This plan closes that documentation-level scope gap without reopening 57.8 or broadly replanning 60.1.
Output: narrowed roadmap/requirements wording updates only.
</objective>

<execution_context>
@./.codex/get-shit-done-reflect/workflows/quick.md
</execution_context>

<context>
@.planning/STATE.md
@AGENTS.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/57.8-signal-provenance-split-artifact-signature-blocks/57.8-CONTEXT.md
@.planning/quick/260419-6uf-fix-manual-gsdr-signal-split-provenance-/260419-6uf-SUMMARY.md
@commands/gsd/signal.md
@.codex/skills/gsdr-signal/SKILL.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Tighten Phase 57.8 declarations to name the missed manual signal surface</name>
  <files>.planning/ROADMAP.md, .planning/REQUIREMENTS.md</files>
  <action>Patch the Phase 57.8 section in `ROADMAP.md` and the matching 57.8 provenance requirements in `REQUIREMENTS.md` so the declarative scope explicitly names the manual `/gsdr-signal` command and installed-skill/manual authoring surface that was missed. Use the concrete gap evidenced by `.planning/quick/260419-6uf-fix-manual-gsdr-signal-split-provenance-/260419-6uf-SUMMARY.md`: the manual command and regenerated Codex skill were still teaching flat provenance after 57.8's code-level fix. The wording change should answer "where should 57.8 have said this?" by tightening the 57.8 phase goal/success criteria in `ROADMAP.md` and the adjacent PROV entries that currently only mention sensor task specs, `collect-signals.md`, and reference docs. Keep the phase narrow and retrospective: this is a declarative clarification of the existing provenance contract, not a reopen of telemetry integration, no new plans, and no broad re-scope of 57.8.</action>
  <verify>`rg -n "57\\.8|gsdr-signal|manual signal|installed skill|PROV-04|PROV-07" .planning/ROADMAP.md .planning/REQUIREMENTS.md` shows Phase 57.8 and the matching PROV entries now explicitly naming the manual `/gsdr-signal` surface.</verify>
  <done>The 57.8 roadmap and requirement text plainly identify the missed manual-signal surface instead of leaving it implicit inside generic sensor/spec wording.</done>
</task>

<task type="auto">
  <name>Task 2: Make downstream provenance phases own manual-signal parity and regression coverage</name>
  <files>.planning/ROADMAP.md, .planning/REQUIREMENTS.md</files>
  <action>Patch the downstream provenance declarations so later work explicitly owns manual-signal parity and regression prevention. In `ROADMAP.md`, tighten the Phase 60.1 goal/success criteria/derived notes so the wide integration phase clearly includes manual `/gsdr-signal` parity or companion regression coverage, not just sensor telemetry and reflection surfaces. In `REQUIREMENTS.md`, tighten the matching downstream PROV entries so the survey (`PROV-09`) explicitly enumerates manual command/installed-skill surfaces, and the downstream verification/parity requirements (`PROV-13`, `PROV-14`, plus adjacent wording if needed) require manual-signal parity or regression checks when provenance changes propagate across Claude and Codex. Keep this narrow: no new phase, no new numbered requirement family, and no broad replan of 60.1. The goal is to make future provenance work responsible for not regressing the manual path again.</action>
  <verify>`rg -n "60\\.1|PROV-09|PROV-13|PROV-14|gsdr-signal|manual" .planning/ROADMAP.md .planning/REQUIREMENTS.md` shows downstream provenance text explicitly covering manual-signal parity or regressions.</verify>
  <done>Later provenance planning surfaces now say who owns manual `/gsdr-signal` parity and regression coverage, instead of assuming it is covered incidentally.</done>
</task>

</tasks>

<verification>
- [ ] Phase 57.8 text in `ROADMAP.md` and `REQUIREMENTS.md` explicitly names the manual `/gsdr-signal` surface as the missed provenance seam
- [ ] Downstream 60.1 / PROV text explicitly covers manual-signal parity or regression prevention
- [ ] No new phases, plans, or broad scope changes were introduced; this remains a roadmap/requirements patch only
- [ ] The resulting summary can name the exact roadmap/requirement entries changed so the quick-task row in `STATE.md` is truthful
</verification>

<success_criteria>
- The plan answers where 57.8 text should be tightened by pointing execution at the 57.8 roadmap section and matching PROV wording that currently omit the manual signal surface.
- The plan answers where later provenance work should cover manual-signal parity by pointing execution at Phase 60.1 and downstream PROV requirements.
- Execution stays narrow: only `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are modified.
</success_criteria>

<output>
After completion, create `.planning/quick/260419-wjj-patch-roadmap-and-requirements-so-downst/260419-wjj-SUMMARY.md`.

Quick-workflow closeout must then append the completion row to `.planning/STATE.md` under `### Quick Tasks Completed` and update `Last activity`, with the row and summary explicitly naming which 57.8 / 60.1 / PROV entries were tightened for manual `/gsdr-signal` parity. Do not broaden the postlude into unrelated roadmap or requirement changes.
</output>
