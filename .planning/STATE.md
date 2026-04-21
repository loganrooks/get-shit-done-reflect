---
gsd_state_version: 1.0
milestone: v1.20
milestone_name: Signal Infrastructure & Epistemic Rigor
status: executing
stopped_at: Completed 60-03-PLAN.md
last_updated: "2026-04-21T20:53:38.652Z"
last_activity: 2026-04-21
progress:
  total_phases: 25
  completed_phases: 17
  total_plans: 87
  completed_plans: 84
  percent: 97
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.
**Current focus:** v1.20 Phase 60 (Sensor Pipeline & Codex Parity) is active on branch `gsd/phase-60-sensor-pipeline-codex-parity`. Plans `60-01` and `60-02` are complete; Wave 1 groundwork is in place for the remaining Phase 60 plans.

## Current Position

Phase: 60 of 64 — Execution in progress on `gsd/phase-60-sensor-pipeline-codex-parity`
Plan: 3 of 6 complete
Status: Ready to execute

### Recent Phases

- Phase 59.1 (Drop Gemini and OpenCode from installer scope) — complete via commits `c9080b2a`, `02d0e194`, and `a3fb0b9e`; installer/runtime authority is now Claude/Codex-only
- Phase 58 (Structural Enforcement Gates) — complete on the baseline branch via commit `41673dc8`; verifier passed and phase closeout artifacts were tracked before the 58.1 insertion

Last activity: 2026-04-21

Progress: [█████████░] 94%

## Performance Metrics

**v1.20 Current:**

- Plans completed: 40
- 55-01: 1min, 2 tasks, 5 files
- 55-02: 9min, 2 tasks, 5 files
- 55-03: 9min, 2 tasks, 6 files
- 55-04: 6min, 2 tasks, 4 files
- 56-01: 6min, 3 tasks, 5 files
- 56-02: 5min, 2 tasks, 3 files
- 56-03: 10min, 2 tasks, 1 file
- 55.1-01: 4min, 2 tasks, 4 files
- 55.2-01: 3min, 2 tasks, 3 files
- 55.2-02: 3min, 2 tasks, 2 files
- 55.2-03: 3min, 2 tasks, 2 files
- 57.1-01: 3min, 2 tasks, 6 files
- 57.2-01: 4min, 2 tasks, 3 files
- 57.2-02: 5min, 2 tasks, 2 files
- 57.2-03: 4min, 3 tasks, 3 files
- 57-01: 5min, 2 tasks, 2 files
- 57-02: 5min, 2 tasks, 3 files
- 57.5-01: 12min, 3 tasks, 7 files
- 57.5-02: 6min, 3 tasks, 4 files
- 57.5-03: 12min, 3 tasks, 8 files
- 57.5-04: 16min, 3 tasks, 7 files
- 57.6-01: 15min, 3 tasks, 7 files
- 57.6-02: 8min, 2 tasks, 4 files
- 57.6-03: 10min, 2 tasks, 3 files
- 57.6-04: 24min, 2 tasks, 8 files
- 57.6-05: 22min, 2 tasks, 9 files
- 57.6-06: 25min, 2 tasks, 12 files
- 57.6-07: 24min, 2 tasks, 4 files
- 57.7-01: 20min, 3 tasks, 6 files
- 57.7-02: 24min, 3 tasks, 6 files
- 57.7-03: 10min, 2 tasks, 3 files
- 57.7-04: 10min, 2 tasks, 4 files
- 57.7-05: 10min, 2 tasks, 4 files
- 57.7-06: 5min, 2 tasks, 5 files
- 57.7-07: 11min, 3 tasks, 6 files
- 57.7-08: 8min, 2 tasks, 4 files
- 57.7-09: 7min, 2 tasks, 2 files
- 57.7-10: 10min, 3 tasks, 3 files
- 59-01: 16min, 2 tasks, 112 files (5 code + 107 signal repairs)
- 59-02: 7min, 2 tasks, 6 files (4 created + 2 modified)
- 59-03: 5min, 2 tasks, 4 files (1 lib + 1 test + 2 modified)
- 59-04: 13min, 2 tasks, 9 files (4 created + 5 modified)

**v1.18 Final:**

- Plans completed: 37
- See milestones/v1.18-ROADMAP.md for per-plan breakdown

*Updated after each plan completion*

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.13-v1.18 decisions archived in milestones/ directories.

Recent decisions affecting current work:

- [Phase 57.7 Plan 10 2026-04-17]: The vision-drop diagnostic revision ships as `unclassified`; 57.7 added real scope-narrowing evidence, but it did not clear the anomaly-resolution bar for a progressive revision.
- [Phase 57.7 Plan 10 2026-04-17]: The live interpretation surface still joins by `phase_57_5_live_registry_query`, so the GATE-09 pending record is keyed there rather than to the diagnostic id in order to exercise the shipped query/report path honestly.
- [Phase 57.7 Plan 10 2026-04-17]: No retrospective 57.5 `confirmed` intervention record was shipped; the closeout wave stayed with the required GATE-09 pending record under G-7's anti-success-theater rule.
- [Phase 57.7 Plan 09 2026-04-17]: `reasoning_quality_proxy` ships in `derived.cjs` as a `facets-substitute` proxy with `reliability_tier: inferred`, `proxy_label: reasoning_quality_proxy_only`, and `grader_independence: self_graded`; it reads `session.facets.record` directly rather than chaining through computed features.
- [Phase 57.7 Plan 09 2026-04-17]: Missing facet coverage remains visible in the live feature surface as `not_available` with `skip_reason: facets_unavailable`; coverage gaps are evidence, not silent row drops.
- [Phase 57.7 Plan 08 2026-04-17]: `reasoning_tokens_reconciler` ships as one unified cross-runtime axis even though the current corpus is entirely `not_available`; registering the seam and canonical skip reasons is the non-negotiable MEAS-RUNTIME-05 outcome.
- [Phase 57.7 Plan 08 2026-04-17]: Claude remains schema-only with `tokenizer_unavailable` because Spike 011 ended `FAIL: schema-only` and `production_dependency_decision: reject_top_level_dependency_schema_only`; no `js-tiktoken` dependency was added in this plan.
- [Phase 57.7 Plan 07 2026-04-17]: `queryMeasurement()` now deepens interpretations in a post-pass with a lazy registry singleton and canonical `extractFrontmatter()` joins, so the base interpretation builder stays stable while provenance remains resolution-on-demand.
- [Phase 57.7 Plan 07 2026-04-17]: The governed provenance string is the conservative four-part form (`surviving_challenge_from_* | grounded_in_*_interventions | carrying_*_tracked_anomalies | revisions=[...]`), and the report privacy line names computed content-derived features instead of only reporting a count.
- [Phase 57.7 Plan 06 2026-04-17]: Diagnostic distinguishing features live in prose, not YAML, so the audit transcribes them manually and backfills registry vocabulary additively rather than inventing a parser mid-phase
- [Phase 57.7 Plan 06 2026-04-17]: `.planning/measurement/interventions/README.md` uses existing interpretation ids (`phase_57_5_live_registry_query`, `diag-*`) as exact-match keys; no new identifier layer was introduced
- [Phase 57.7 Plan 05 2026-04-17]: `intervention_points` ships live with heuristic version `57.7-v1`; the calibrated structural marker set counts Claude's explicit `[Request interrupted by user]` placeholder as a valid interrupt signal
- [Phase 57.7 Plan 05 2026-04-17]: Q3 calibration passed with long-session fire rate `19.23%` in the 50-session sample and reviewed false-positive rate `0/13`, so schema-only shipping was unnecessary
- [Phase 57.7 Plan 04 2026-04-17]: `content_contract` is now preserved on frozen extractor entries, so downstream query/report logic can filter content-derived features directly from registry metadata
- [Phase 57.7 Plan 04 2026-04-17]: `tool_invocation_sequence` and `topic_shift_markers` ship as `derived_features_only` extractors; both are tagged for `pipeline_integrity`, with broader loop reach to `agent_performance` and `cross_session_patterns` respectively
- [Phase 57.7 Wave 1 2026-04-17]: Spike C3 failed its tokenizer thresholds (`js-tiktoken` median relative error 60.93%, `charDiv4` 51.78%), so Plan 08's Claude branch is locked to schema-only shipping with `skip_reason: tokenizer_unavailable` and `production_dependency_decision: reject_top_level_dependency_schema_only`
- [Phase 57.7 Wave 1 2026-04-17]: Spike C5 chose `facets-substitute` as the `reasoning_quality_proxy` winner (`rho=0.9484` vs `reference-density` `rho=0.4564`), but the result is explicitly qualified as `grader_independence: self_graded` and Plan 09 must preserve that provenance note
- [Phase 57.6 completion 2026-04-17]: measurement loop coverage now extends across agent_performance, signal_quality, cross_session_patterns, and cross_runtime_comparison; `measurement report <loop>` ships as the human-readable text-first interface; and two committed diagnostic artifacts demonstrate end-to-end diagnosis with explicit computed vs UNCOMPUTED distinctions
- [Roadmap/Requirements 2026-04-16]: MEAS family added (34 requirements across ARCH/RUNTIME/DERIVED/GSDR), Phases 57.5/57.6/57.7 inserted, and Phase 58 now depends on 57.7
- [Pre-57.5 governance 2026-04-16]: source families are now explicit -- `RUNTIME` (transcripts), `DERIVED` (`/insights` products), and `GSDR` (our own artifacts/config/state); session-meta is no longer treated as live runtime telemetry
- [Pre-57.5 evidence 2026-04-16]: thinking-summary length is usable for reasoning-load/emission questions only with strong gating/stratification; it is NOT a reasoning-quality proxy, so quality evaluation remains out of 57.5 scope
- [55-01]: Adopted model-profiles.cjs as-is from upstream f7549d43; plan mentioned resolveModel but upstream exports getAgentToModelMapForProfile -- file correct as upstream version
- [55-01]: Single commit for all 5 pure upstream modules per commit-per-merge-category strategy
- [Roadmap]: 10 phases (55-64) derived from 53 requirements across 9 categories
- [Roadmap]: Phase 55 (SYNC-01) must precede all other v1.20 work -- correctness substrate
- [Roadmap]: Phase 57 (telemetry baseline) must complete before Phase 58 (structural gates) -- ARCHITECTURE.md anti-pattern 4
- [Roadmap]: Phases 60 and 61 (sensors + spike methodology) can proceed in parallel -- independent workstreams
- [Roadmap]: Phase 64 (parallel execution) separately gated -- only triggered when parallel phases become regular practice
- [Roadmap]: Spike programme infrastructure (SPIKE-10a/b/c) in scope as Phase 63, after spike methodology operational
- [Roadmap]: SPIKE-08 gated on SPIKE-01 completion; auto-defers to v1.21 if SPIKE-01 ships late
- [Phase 55]: core.cjs: resolveModelInternal preserves fork gsdr- prefix normalization AND opus->inherit conversion (both fork-specific Claude Code behaviors)
- [Phase 55]: config.cjs: cmdForkConfigGet replaced with cmdConfigGetGraceful fork envelope {key,value,found} -- upstream cmdConfigGet returns raw value, fork tests require envelope
- [Phase 55]: model-profiles.cjs: 11 fork-only agents added after inline MODEL_PROFILES removed from core.cjs
- [55-03]: phase.cjs and roadmap.cjs wholesale replaced -- fork versions were simplified subsets of upstream, not extensions; no unique fork additions to re-apply
- [55-03]: complete-milestone.md C2 shell robustness guards already present in upstream v1.34.2 -- no re-application needed
- [55-03]: installer: applied 7 of 11 upstream fixes; 4 not applicable (.sh hooks, package.json); all fork extensions preserved (replacePathsInContent, dual-directory, gsdr- branding)
- [55-03]: buildLocalHookCommand: $CLAUDE_PROJECT_DIR anchor (#1906) combined with existing test -f worktree guard -- both protections active
- [55-03]: uninstall per-hook granularity: isGsdrHookCommand covers both gsdr- (current) and gsd- (legacy) namespaces
- [Phase 55-04]: gsd-tools.test.js: upstream path does not exist at f7549d43; restored fork version and added 9 correctness regression tests inline adapted from upstream atomic-write, locking, frontmatter test files
- [56-01]: KB-01 lifecycle states corrected to Phase 31 model (detected/triaged/blocked/remediated/verified/invalidated); KB-01 draft used task/issue states (proposed/in_progress) which conflicted with all existing implementation
- [56-01]: blocked added as optional lifecycle state between triaged and remediated -- compatible with Phase 31 model, useful for signals with external blockers
- [56-01]: node:sqlite lazy-required via getDbSync() in kb.cjs -- prevents gsd-tools.cjs failing on Node <22.5.0 for non-KB commands (RESEARCH.md Pitfall 7)
- [56-01]: source field deprecated in knowledge-store.md v2.1.0; detection_method + origin replace it with richer provenance semantics
- [56-01]: kb.db gitignored per KB-05 dual-write invariant -- SQLite is derived cache, files are source of truth
- [56-02]: Router case 'kb' and require('./lib/kb.cjs') were already wired during Plan 01 deviation -- Plan 02 added only the missing usage message entry
- [56-02]: package.json engines.node bumped from >=16.7.0 to >=22.5.0; CHANGELOG.md Unreleased documents breaking change per KB-11
- [56-02]: kb rebuild validated end-to-end: 200 files (199 signals + 1 spike), 0 errors, all 4 schema generations handled
- [Phase 56-03]: Task 2 migration carry-forward: migration was pre-completed in Plan 02 (183 files), Task 2 became validation-only
- [Phase 56-03]: Dual-write invariant proven on real 200-file corpus: delete kb.db + rebuild produces identical counts (199 signals, 1 spike, 0 errors)
- [55.1-01]: Extracted findCurrentMilestoneRange as internal helper (not exported) shared by extractCurrentMilestone and replaceInCurrentMilestone
- [55.1-01]: replaceInCurrentMilestone falls back to lastIndexOf heuristic when cwd omitted -- backward compatibility preserved
- [55.1-01]: resolveCurrentMilestoneVersion extracted as separate helper to avoid duplicating STATE.md reading logic
- [Phase 55.1]: Converted .gitkeep writes to atomicWriteFileSync for consistency -- negligible overhead
- [Phase 55.1]: Worktree check placed after required_reading but before process/step blocks -- earliest viable execution point
- [55.2-01]: Codex hooks detection uses regex on config.toml content rather than TOML parser -- lightweight, no new dependency
- [55.2-01]: Heuristic fallback placed inside existing try/catch else-branch after .claude/settings.json check -- no new control flow paths
- [55.2-02]: Existing "prefers .claude over agents" test updated to "merges from both" -- behavior intentionally changed from short-circuit to merge
- [55.2-02]: TOML parsing uses simple line-by-line regex for explicit top-level keys, not a full TOML parser -- sensor contract fields are not top-level TOML keys per research
- [55.2-02]: Helper functions (discoverSensorDirs, discoverSensors, parseSensorMetadata) exported for testability
- [55.2-03]: Codex hooks documented as Y (under development) [6] with feature flag gating rather than flat Y -- reflects conditional availability pending codex_hooks flag stabilization
- [55.2-03]: Living document pattern established for drift-prone references: YAML frontmatter with last_audited version, next_audit_due, and Validation Commands table with executable re-verification commands
- [57.1-01]: Installer name: field stays gsd:explore (not gsdr:explore) in installed commands -- consistent with all 30+ commands; directory rename (gsd/ -> gsdr/) handles user-facing prefix, not frontmatter rewriting
- [Phase 57.2]: claim-types.md uses 7 numbered sections: types table, verification dimension, notation syntax, non-types, dependencies, auto-progression, quick reference
- [Phase 57.2]: commit_docs guard added as conditional wrapper around existing commit command rather than restructuring git_commit step
- [Phase 57.2]: Mode-conditional write_context: exploratory uses 5 structural sections; discuss uses unchanged decisions
- [Phase 57.2]: All [grounded] references replaced with type-based auto-progression rules per claim-types.md
- [Phase 57.2]: Context template Example 4 added showing full exploratory mode output with working model, constraints, guardrails, generative questions, dependencies
- [Phase 57.2]: DISCUSSION-LOG.md augmented (not replaced) -- Gray Areas audit trail preserved as Part 1, new parts added
- [Phase 57.2]: Context-checker uses Task() dispatch, not inline step -- separately invokable agent (gsdr-context-checker)
- [Phase 57.2]: Researcher types own findings bidirectionally using same [type:verification] vocabulary from claim-types.md
- [Phase 57.3]: Ground rules framed as practices enabling rigor, not checklists defining it -- per forms-excess deliberation
- [Phase 57.3]: Audit type taxonomy uses enum-with-escape-hatch (8 named + exploratory) matching signal_type pattern from knowledge-store.md
- [Phase 57.3]: Workflow-produced audits remain in current locations; .planning/audits/ is for standalone audits only
- [Phase 57.3]: Frontmatter kept to 12 fields (3 required + 5 recommended + 4 optional) to avoid over-formalization
- [Phase 57.3]: Sub-artifact files get minimal frontmatter (date, audit_type, scope) to satisfy must_haves constraint that every migrated artifact has frontmatter
- [Phase 57.3]: JSONL session transcripts (3 root-level audits) receive frontmatter prepended without content format conversion per G-5 conservative migration
- [Phase 57-01]: loadSessionMetaCorpus returns {sessions, stats} object for single-pass corpus stats; facets fields use facet_ prefix in enrich to avoid key collision; default distributions use clean tier only with includeCaveated opt-in
- [Phase 57]: Baseline captured from main repo cwd to match session-meta project_path values (worktree resolveWorktreeRoot returns worktree path when .planning/ exists)
- [Phase 57.4 discuss-phase v2]: Restructured audit taxonomy from flat 8-type list to 3-axis model (subject × orientation × delegation) via deliberation `audit-taxonomy-three-axis-obligations.md` (open — fed forward, not concluded). Validated against 13 audit sessions in `audit-taxonomy-retrospective-analysis.md`. Obligations paradigm replaces templates for non-standard orientations, governed by hermeneutic composition principle. Three new obligations added from retrospective: chain integrity, dispatch hygiene, framework invisibility. Frame-reflexivity Rule 5 added to all orientations. I1-I4 investigatory ground rules added from REVIEW.md Part 3.
- [Phase 57.4 WF-01 pull-forward]: WF-01 (cross-model delegation) pulled from Phase 62 into Phase 57.4. Cross-model dispatch becomes an `audit_delegation` mode on `/gsdr:audit` rather than a standalone `/gsdr:cross-model-review` command. Phase 62 goal updated: "Five workflow gaps" → "Four workflow gaps". REQUIREMENTS.md WF-01 row phase column: 62 → 57.4 (pulled forward). WF-01 requirement text still names the standalone command and may need revision to reflect absorption — flagged in ROADMAP.md Phase 62 note.
- [Phase 57.4 framing correction 2026-04-10]: After context-checker ran on v2 CONTEXT.md (55 typed claims, 53 PASS / 1 WARN / 0 FAIL), post-checker review identified that v2 CONTEXT.md and first-pass ROADMAP edits were treating superseded reference files (`audit-conventions.md`, `audit-ground-rules.md`) as authoritative base rather than letting the 3-axis deliberation drive authority. The context-checker did not catch this because its verification dimension is citation integrity, not authority weighting. Signal logged as `sig-2026-04-10-discuss-phase-authority-weighting-gap` (capability-gap, severity high, first observation — needs corroboration). Corrections applied: conservative supersession banners added to both reference files + reinstall; CONTEXT.md `<domain>` rewritten as "radically rethinks the formalization" with epistemic reconstruction as primary concern and operational delivery as secondary vehicle; DC-1-5 rewritten (DC-4 retyped `[evidenced:cited]` → `[decided:reasoned]`, DC-5 retyped `[governing:cited]` → `[governing:reasoned]`); `<canonical_refs>` reordered with deliberations as primary authority; working model prose "Current state:" headings relabeled to "Superseded Phase 57.3 state"; new `<files_affected>` section added consolidating the file manifest; ROADMAP.md Phase 57.4 goal rewritten as reconstructive; Phase 57.3 bullet/detail annotated with supersession cross-reference; DISCUSSION-LOG.md appendix documenting the framing correction as a traceable follow-up.
- [Phase 57.4 CONTEXT authority direction]: Authoritative scope for the v2 audit formalization design is the deliberations (`audit-taxonomy-three-axis-obligations.md`, `audit-taxonomy-retrospective-analysis.md`, `pre-phase-archive/REVIEW.md`, `forms-excess-and-framework-becoming.md`). The reference files are partially superseded prior artifacts carrying supersession banners. When planning: read banners → deliberations → CONTEXT.md, in that order. Do NOT cite the reference files as authority for the v2 taxonomy, templates, or ground rule sets — those are to-be-rewritten by this phase.
- [Phase 57.4]: [57.4-02]: Rule 5 placed in Section 1 (core rule), NOT Section 2 (escape hatch); frame-reflexivity applies to every audit
- [Phase 57.4]: [57.4-02]: I1 wording adopts deliberation form ('start from the discrepancy') over REVIEW.md form ('start from the situation'); deliberation is operational, REVIEW.md is source
- [Phase 57.4]: [57.4-02]: Framework invisibility distinguished from I4 (auditor position) and Rule 5 (classification) via explicit 'Relationship to I4 and Rule 5' paragraph; three obligations are distinct and additive
- [Phase 57.4]: [57.4-02]: Composition Principle written as prose with 4-step hermeneutic engagement (not pseudocode, not precedence rule); Q1 untested warning carried forward explicitly
- [Phase 57.4-01]: Rewrote audit-conventions.md Section 3 as 3-axis taxonomy (subject × orientation × delegation) with 9 subjects carrying epistemic profiles; process_review and artifact_analysis added as new subjects; cross_model_review exited the subject enum (it was always delegation)
- [Phase 57.4-01]: Section 4 obligations paradigm: Population 1 (standard routine) keeps scaffolds; Population 2 (investigatory/exploratory/complex) uses composed obligations; hermeneutic distinction — obligations compose across axes, templates cannot; 'What the Obligations Didn't Capture' mandatory in every output
- [Phase 57.4-01]: Section 2 frontmatter: audit_subject (optional for investigatory/exploratory) + audit_orientation + audit_delegation replace single audit_type enum per DC-4; audit_type retained as Optional Legacy field; field count 12→15 at signal KB schema budget ceiling
- [Phase 57.4-01]: Section 5 Layer 3 updated beyond minimal edit (beyond plan's strict 'Layer 2 only' framing) to prevent silent contradiction: literal 'audit_type: exploratory' became 'audit_orientation: exploratory' after Section 2 rewrite; extended per DC-5 to note axis-level escape
- [Phase 57.4]: [57.4-03]: /gsdr:audit command ships with cross-model dispatch as experimental: --trust-cross-model opt-in required in --auto mode, warning text in interactive mode, Q2 spike TODO embedded for post-implementation validation
- [Phase 57.4]: [57.4-03]: Task spec template copies ground rules and obligations inline per DC-2 (not referenced by path); Rules 1-5 verbatim, orientation obligation placeholders with copy-verbatim instructions, cross-cutting obligations conditional on triggers, composition principle copied as prose
- [Phase 57.4]: [57.4-03]: All command logic lives inline in <process> body (deliberate.md precedent); no workflow file intermediary; 8 process steps (Mode Detection + Context Inference + Classify + Complexity + Compose + Write Task Spec + Create Dir + Dispatch + Report)
- [Phase 57.4]: [57.4-04]: Color 'pink' (not 'purple' as plan action text suggested) — purple is already used by log-sensor, research-synthesizer, roadmapper; pink is unused
- [Phase 57.4]: [57.4-04]: gsd-auditor profile values mirror gsd-spike-runner exactly (opus/sonnet/sonnet/sonnet) — both dispatch reasoning-heavy work; composition-principle engagement needs more than haiku
- [Phase 57.4]: [57.4-04]: Only standard-orientation scaffold carries a Verdict section; investigatory and exploratory scaffolds explicitly do not close on verdicts — enacts Section 3.1 orientation obligation differences from audit-ground-rules.md
- [Phase 57.4]: [57.4-04]: Framework invisibility appears as its own section in investigatory/exploratory output, distinct from I4 (auditor position) and Rule 5 (classification frame) — per audit-ground-rules.md Section 3.3 explicit distinction
- [Phase 57.4]: [57.4-04]: Task 3 precondition (agent file exists before profile entry) explicitly verified via ls — prevented creating a third ghost alongside gsd-ui-auditor and gsd-doc-verifier
- [Phase 57.4]: [57.4-05]: WF-01 rewritten as audit_delegation: cross_model:{model_id} mode on /gsdr:audit, kept [ ] partial pending Q2 reliability spike
- [Phase 57.4]: [57.4-05]: AUDIT-04..09 added (3-axis taxonomy, obligations paradigm, Rule 5, I1-I4, cross-cutting obligations, invocable audit skill); motivation citations favor deliberations/retrospective as primary authority, reference files cited only as 'Implemented in' markers
- [Phase 57.4]: [57.4-05]: WF-01 rewrite removed every mention of /gsdr:cross-model-review (not just marked deprecated) per plan verification; old command name does not live on as a conceptual anchor
- [Phase 57.4-06]: Task 1 as verification-only gate (no commit): pre-removal checks confirm Plans 01-05 landed before banners are removed; failure aborts Task 2 rather than proceeding with a half-rewritten file
- [Phase 57.4-06]: 9-subject cross-plan consistency check closes: all 9 subjects (phase_verification, milestone, codebase_forensics, requirements_review, comparative_quality, claim_integrity, adoption_compliance, process_review, artifact_analysis) present in both audit-conventions.md and audit-ground-rules.md — count distribution differs (conventions uses subjects in schema examples + taxonomy, ground-rules uses them in subject-obligations table) but all 9 names match
- [Phase 57.4-06]: Full npm test returned 502 passed / 0 failed / 4 todo; RESEARCH.md Open Question about count-based assertions breaking from new file count is resolved negatively — tests did not contain file-count assertions sensitive to adding audit.md command or gsdr-auditor agent
- [Phase 57.7]: MEAS-GSDR-06 resolved via option (b): drop signal_fts and keep ripgrep as the KB search fallback.
- [Phase 57.7]: KB schema regression tests should verify migrations through the production kb rebuild path rather than exporting kb internals.
- [Phase 58]: Phase 58-03: Upstream re-fetched via direct curl (not WebFetch per Research R5 Verified-Ground-Truth) — HEAD SHA ebbe74de72, 671/105/279 line counts confirmed, 0% drift from research baseline
- [Phase 58]: Phase 58-03: 4 of 6 GATE-08 categories adopt as-is (methodology loading, analyzer agent, text_mode, confidence badges as mapped); 2 of 6 adopt narrowed with GATE-09c rationale (calibration tier redundant with model_profile; CONTEXT.md section mandates preserved as fork superset)
- [Phase 58]: Phase 58-03: Analyzer agent ported with zero non-branding divergence (single-line diff on name: field); source-dir only per CLAUDE.md:15-27 dual-directory rule; installer + GATE-15 Plan 10 enforce byte-identical-after-transform parity
- [Phase 58-05]: Adopted 58-RESEARCH.md skeleton values for all 25 rows verbatim; plan work was finalizing rationale, substrate citations, and degradation-path encoding — not re-evaluating which gates apply where.
- [Phase 58-05]: GATE-06/07 Codex behavior encoded as conditional-degradation ('applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason') preserving both 57.9-shipped and 57.9-not-shipped execution paths; avoids matrix rewrite if 57.9 lands mid-phase.
- [Phase 58-05]: Codex-specific open risks (stale signal-detection heuristic; codex_hooks flag stability; auto-compact) surfaced as Section 5 NOT row-degrading — they affect measurement interpretation not gate firing.
- [Phase 58-05]: Ledger entry format for Codex waivers restricted to disposition: explicitly_deferred (never rejected_with_reason) — every Phase 58 Codex gap has a named downstream resolution phase.
- [Phase 58-structural-enforcement-gates]: [58-01] Squash option removed entirely from complete-milestone.md AskUserQuestion (not retained as opt-in); plan's dual constraints (explicit opt-in option + single non-squash call site per strategy) forced removal as cleanest reconciliation
- [Phase 58-structural-enforcement-gates]: [58-01] Installer-derived mirrors (.claude/, .codex/) NOT directly edited; they resync on bin/install.js run; GATE-04 (Plan 11) covers parity drift; Plan 07 CI grep scope recommended to stay on source paths only (get-shit-done/, agents/, commands/, skills/, .codex/skills/)
- [Phase 58-structural-enforcement-gates]: [58-01] Task 0 STATE.md reconciliation used actual merge commit date (2026-04-20) rather than CONTEXT DC-5's cited 2026-04-17; SHA c8a15d95 matched but commit date differed; per plan instruction to use actual SHA/date
- [Phase 58]: [58-02]: Enumeration expanded from R3's 22 grouped summary sites to 45 concrete spawn lines (unfolded grouped rows + added 5 .codex/skills/ mirrors R3 did not enumerate); Codex skill mirrors in scope to prevent GATE-05/13 bypass on Codex runtime.
- [Phase 58]: [58-02]: GATE-13 compaction-resilience lives in comment block, not runtime rebinding; literal model baked into # Model: comment via resolveModelInternal at workflow expansion time while Task() body retains {template} binding so profile overrides still propagate.
- [Phase 58]: [58-02]: general-purpose proxy mapping table added to design §3.3 — 11 spawn rows wrap canonical GSD agents via inline-prompt pattern; resolveModelInternal(general-purpose) returns sonnet fallback, so Plan 12 must resolve against the canonical agent the proxy stands in for.
- [Phase 58]: [58-04]: ledger validation uses dedicated validator branch (validateLedgerFrontmatter) because per-entry conditional logic does not fit the existing signal-schema top-level conditional hook
- [Phase 58]: [58-04]: ledger_entries uses UNIQUE(phase, context_claim) + per-file delete-then-insert idempotency; cross-file orphan sweep deferred to Plan 17+
- [Phase 58]: [58-04]: ledger discovery regex narrowed to ^\\d+(\\.\\d+[a-z]?)?-LEDGER\\.md$ so legacy UPSTREAM-DRIFT-LEDGER.md and the schema spec itself are excluded from the kb rebuild ledger pass
- [Phase 58]: [58-04]: validator exit status always 0; callers inspect JSON.valid — matches existing frontmatter validate contract for plan/summary/verification/signal schemas
- [Phase 58-structural-enforcement-gates]: [58-16] AT-1 Option B selected (explicit defer of GATE-06/07 to Phase 57.9 with GATE-09c provenance) because 57.9 phase directory does not exist at Phase 58 execution time; both ledger entries load_bearing=true, disposition=explicitly_deferred, target_phase_if_deferred='Phase 57.9', validated green against authoritative ledger schema
- [Phase 58-structural-enforcement-gates]: [58-16] Chain-integrity enforced: Plan 16 creates exactly one defer-provenance artifact; no workflow/agent/installer/config modifications; the defer is the scope (G-3 reflexive GATE-09 compliance — not manufacturing false completion via prose workflow edits)
- [Phase 58-structural-enforcement-gates]: [58-16] target_phase_if_deferred uses single 'Phase 57.9' target per ledger schema pattern constraint; GATE-07's dual-phase dependency (57.9 markers + 60.1 log-sensor live wiring) recorded in narrowing_provenance.rationale rather than splitting target field
- [Phase 58-structural-enforcement-gates]: [58-11]: Three Task() spawn points synthesized at initialize/deep_codebase_analysis/present_assumptions — upstream has only 1 literal Task() but Plan 11 GATE-08b fire-event requires >=3; added preflight availability check and scope-expanding re-analyze as semantically-justified wrappers (deviation Rule 3)
- [Phase 58-structural-enforcement-gates]: [58-11]: NARROWING DECISION comments placed at file HEAD (HTML comments) of discuss-phase-assumptions.md — categories (d) calibration tier and (e) CONTEXT.md section mandates legible before any process logic is read; cites Plan 03 delta §3 sections with reversibility ratings
- [Phase 58-structural-enforcement-gates]: [58-11]: Calibration tier resolved from model_profile (quality→full_maturity, balanced→standard, budget→minimal_decisive); USER-PROFILE.md artifact NOT adopted per Plan 03 delta §3(d) — analyzer-agent three-tier prompt shape preserved for upstream-compatibility
- [Phase 58-structural-enforcement-gates]: [58-11]: text_mode in plan-phase/progress implemented as HTML comment-note (not behaviorally-empty code branches) — both workflows are agent-driven with zero interactive prompts today; comment-note marks future-edit contract pointing to docs/workflow-discuss-mode.md §3
- [Phase 58-structural-enforcement-gates]: [58-06] Branch protection flipped 2026-04-20 via gh api PUT by orchestrator; post-flip state verified {enforce_admins: true, strict: true, contexts: ["Test"]}
- [Phase 58-structural-enforcement-gates]: [58-06] GATE-14 live-fire verified blocking: direct admin push rejected with GH006 'Protected branch update failed for refs/heads/main. Required status check Test is expected.'; re-run forbidden under one-fire-sufficient discipline
- [Phase 58-structural-enforcement-gates]: [58-06] Plan's admin:repo scope guidance was wrong — standard repo scope (default gh auth login) is sufficient to PATCH branch protection for repo owners; no gh auth refresh needed. Correction logged against 58-06-PLAN.md:229
- [Phase 58]: [58-07] CI grep patterns copy-identical to Plan 01 §1 and Plan 02 §4.1 — zero drift discipline: any CI-to-artifact divergence is a Plan 17 verifier finding, not a silent CI change
- [Phase 58]: [58-07] GATE-13 allowlist contains 16 entries (not 36 from Plan 02 §4.2) — consecutive Task() blocks share grep -A 5 context windows so only a subset of template bindings are grep-visible; Plan 12 still owes full source rewrite for all 38 bindings
- [Phase 58]: [58-07] Blank-line hazard in grep -F -f pattern files caught by synthetic-violation test: blank lines match every input line and silently disable the check; allowlist uses #-comments only, no blank separators
- [Phase 58-structural-enforcement-gates]: [58-08] Classifier library uses static MANIFEST_SOURCE_ROOTS list (5 roots: agents, commands, get-shit-done, .codex/skills, skills) mirrored from bin/install.js install() source-tree walk rather than importing install.js at runtime — CLAUDE.md dual-directory rule already enforces parity, and adding a 3354-line code-path per classification would be load-bearing
- [Phase 58-structural-enforcement-gates]: [58-08] Mixed exit code (3) triggers only when runtime-facing AND planning-authority both present in staged set; runtime-facing + pure-docs-only set exits 1 (runtime-facing) — pure-docs does not escalate severity
- [Phase 58-structural-enforcement-gates]: [58-08] GATE-03 workflow-step placed at quick.md Step 2.5 (branching decision) not Step 8 (final commit); CI post_commit_gate_03 job is the structural enforcer for bypass cases — merge-commit exemption (parents>=2) preserves branch+PR path since GATE-01 already gated it
- [Phase 58-structural-enforcement-gates]: [58-09] GATE-15 parity script chose option (b) — require('../bin/install.js') — because replacePathsInContent + injectVersionScope already exported at install.js:3354 for install.test.js; extraction to bin/lib/install-paths.cjs rejected as net-negative against upstream-sync minimal-diff discipline
- [Phase 58-structural-enforcement-gates]: [58-09] Plan's CI invocation 'HOME=$INSTALL_DIR node bin/install.js --claude --local' was semantically incorrect — --local is cwd-based per install.js:2578-2580, not HOME-based; replaced with '(cd $INSTALL_DIR && node $REPO_ROOT/bin/install.js --claude --local)' so --local resolves to tempdir
- [Phase 58-structural-enforcement-gates]: [58-09] agents/ SOURCE_ROOT walked non-recursively (recursive: false) because install.js:2733-2751 iterates entry.isFile() top-level-only and skips sub-directories like agents/kb-templates/; recursive walk would false-positive with installed_file_missing
- [Phase 58-structural-enforcement-gates]: [58-09] Dual fire-event emission (script emits result=block path=<first-diverging-file> reason=<why>; workflow emits coarse result=pass|block) is intentional — script output is detail for debuggability, workflow output is Plan 19 gate_fire_events extractor contract
- [Phase 58-structural-enforcement-gates]: [58-12] GATE-05 echo_delegation macro + GATE-13 inline DISPATCH CONTRACT applied at 22 named spawn sites across 10 core workflow files; literal model baked via resolveModelInternal under quality profile (opus→inherit for Claude Code, sonnet literal for non-opus agents); runtime Task() body retains template binding per design §2.3
- [Phase 58-structural-enforcement-gates]: [58-12] verify-work.md triple-quoted Task() placement: macro + dispatch contract placed as adjacent fenced blocks immediately above the Task() fence (design §2.4 proximity rules satisfied)
- [Phase 58-structural-enforcement-gates]: [58-12] Allowlist format defect surfaced during Task 2 verification (bare # lines match everything via grep -F -f, silently disabling check); pre-existing from Plan 07 — deferred to Plan 12a full-sweep CI grep for surfacing; not fixed this plan
- [Phase 58-structural-enforcement-gates]: [58-12] quick.md researcher spawn known discrepancy (Plan 02 §5.4): template binds {planner_model} instead of {researcher_model}; both resolve to inherit under quality so runtime-identical today; flagged inline in dispatch contract comment for future review rather than fixed under mechanical-edit discipline
- [Phase 58-structural-enforcement-gates]: [58-10] Local flat-YAML extractor used in handoff.cjs instead of frontmatter.cjs -- gate self-containment for emergency invocation; top-level scalars (session_id, last_updated) are sufficient
- [Phase 58-structural-enforcement-gates]: [58-10] Staleness predicate is OR of three sources (mtime vs STATE.last_updated, mtime vs last mainline commit, duplicate session_id in STATE.md) -- any single source is sufficient to prove obsolescence
- [Phase 58-structural-enforcement-gates]: [58-10] Exit code 4 reserved for GATE-04c ack_required / typed-token mismatch; kept distinct from GATE-04b exit 3 so callers can branch on which gate fired
- [Phase 58-structural-enforcement-gates]: [58-10] Registry parser is a line-oriented state machine (no YAML library dep); entries discovered by '- id:' lead lines; trade-off: flat-scalar values only, matches documented schema
- [Phase 58]: [58-12a] GATE-05 echo macro + GATE-13 inline DISPATCH CONTRACT applied at 18 named spawn sites across 6 remaining files (commands/gsd/audit.md, debug.md; workflows map-codebase, new-project, new-milestone, validate-phase); literal models baked via resolveModelInternal under quality profile (opus→inherit for Claude Code, sonnet literal for non-opus agents); runtime Task() body retains template binding per design §2.3
- [Phase 58]: [58-12a] CI GATE-13 grep aligned with design §2.3 via grep -v '# BAKED IN comment:' filter — recognizes compaction-survival annotation as compliance signal; Plan 12 + 12a retained-template sites pass without allowlist reliance
- [Phase 58]: [58-12a] Allowlist bare-# format defect fixed (Plan 12 pre-existing-defect retirement): 9 bare # comment lines eliminated — HEADNOTE uses # --- separators; bare # in grep -F -f was silently excluding every BAKED-IN-annotated hit
- [Phase 58]: [58-12a] Scope narrowing vs pre-existing allowlist HEADNOTE: PLAN.md files_modified manifest is authoritative (6 files); commands/gsd/research-phase.md + .codex/skills/gsdr-research-phase|gsdr-debug SKILL.md (3 files, 6 sites) deferred to follow-up plan despite being listed as Plan 12a scope in the pre-Plan-12a allowlist HEADNOTE
- [Phase 58-structural-enforcement-gates]: [58-13]: GATE-10 reconcile orchestrator invokes existing primitives via subprocess (not require-level composition) — preserves primitive lock/output contracts and stays below blast radius if signatures change; accepts ~50ms-per-primitive Node startup cost because reconcile runs at phase-close only
- [Phase 58-structural-enforcement-gates]: [58-13]: GATE-10 fire-event emits on every invocation including dry-run and block paths — alternative (emit only on reconciled) would silently undercount gate invocations in Plan 19 extractor; CONTEXT DC-1 requires measurable fire-event regardless of outcome
- [Phase 58-structural-enforcement-gates]: [58-13]: GATE-10 uses distinct exit code 5 (unreconciled blocking) so wrapper workflows branch on GATE-10 semantics without parsing JSON; stays disjoint from GATE-01 codes (1/2/3/4) and GATE-04c code 4
- [Phase 58-structural-enforcement-gates]: [58-13]: execute-phase.md GATE-10 step placed at TOP of offer_next (before push/PR creation) so STATE/ROADMAP drift is caught at earliest structural boundary; runs after the preceding update_roadmap verification step
- [Phase 58-structural-enforcement-gates]: [58-13]: complete-milestone.md per-phase reconcile loop extracts phase-id via regex on branch name (phase_branch_template convention) rather than config round-trip; stays aligned with existing PHASE_BRANCHES enumeration pattern
- [Phase 58-structural-enforcement-gates]: [58-14] GATE-12 archive root resolution: phase-scoped (.planning/phases/<N>-*/.archive/) when --phase supplied; .planning/archive/ root fallback otherwise — evidence clusters next to producing phase when possible
- [Phase 58-structural-enforcement-gates]: [58-14] GATE-12 cross-filesystem-safe move via fs.renameSync + EXDEV fallback to cpSync+rmSync (dirs) or copyFileSync+unlinkSync (files); avoids data loss when .planning/ and source path live on different mounts
- [Phase 58-structural-enforcement-gates]: [58-14] GATE-12 missing paths recorded in missing[], not errored (exit 0); errors (exit 2) reserved for actual move failures — disjoint from GATE-01 (1-4), GATE-04c (4), GATE-10 (5)
- [Phase 58-structural-enforcement-gates]: [58-14] GATE-12 no current rm/overwrite sites exist in execute-plan/research-phase/plan-phase.md; plan anticipated this — ships primitive + CLI + HEADNOTE envelopes so future dispatch edits have a fill-in-the-blank wrapper; Plan 17 checks HEADNOTE presence not wrapper count
- [Phase 58-structural-enforcement-gates]: [58-15] GATE-11 ships as gsd-tools release check CLI (get-shit-done/bin/lib/release.cjs) comparing latest reflect-v* tag to most recent phase-merge commit on main; exit 0 current / 1 lag / 2 explicit_defer; fire-event emits on every invocation
- [Phase 58-structural-enforcement-gates]: [58-15] Phase-merge detection uses git log --first-parent main --all-match --grep='Merge pull request' --grep='gsd/phase' (BRE-safe) rather than plan-specified single-pattern 'Merge pull request.*from gsd/phase-' which returned empty despite matching commits (git BRE quirk on trailing hyphen); both patterns produce identical semantic coverage
- [Phase 58-structural-enforcement-gates]: [58-15] Release-lag template located at .planning/handoff/release-lag-template.md (Plan 10 handoff-dir precedent); CLI surfaces copy-to-use command but never writes .planning/release-lag.md itself — named rationale must come from user; stale deferrals (past deferred_to) collapse to lag not continue-defer
- [Phase 58-structural-enforcement-gates]: [58-19] gate_fire_events extractor declares raw_sources as virtual keys without buildGsdrSourceSnapshots entries — registry schema is non-enforcing on source-key registration; loaders read files directly, keeping the gate-events substrate self-contained
- [Phase 58-structural-enforcement-gates]: [58-19] session-meta-postlude source wired as optional require inside try/catch suppressing MODULE_NOT_FOUND; Phase 57.9 can ship the module drop-in without extractor changes — status flips from not_available to exposed/not_emitted automatically
- [Phase 58-structural-enforcement-gates]: [58-19] every delegation-log row surfaces as implicit GATE-05 echo_delegation fire — delegation IS the fire-event record by construction; extractor normalizes to {gate: 'GATE-05', result: 'pass'} keeping count==delegation-count invariant
- [Phase 58-structural-enforcement-gates]: [58-19] extractor emits two rows per runtime (claude-code, codex-cli) with identical aggregate values to satisfy runtime_dimension symmetry-marker computation; single cross-runtime row would mark asymmetric_only
- [Phase 58-17]: GATE-09b heuristic scans BOTH CONTEXT.md and RESEARCH.md because resolutions conventionally land in RESEARCH.md for this fork
- [Phase 58-17]: GATE-09b regex uses \[open(\]|:) grouping-alternation to match both short-form [open] and typed [open:verification] per references/claim-types.md §3; initial \[open[:\]] pattern missed short-form claims (Rule 3 auto-fix)
- [Phase 58-17]: Narrowing Decisions section uses a None sentinel — absence of the section itself fails GATE-09d, so researchers/planners must explicitly populate 'None — no narrowings' when no narrowings occurred
- [Phase 58-17]: Meta-gate GATE-09e embeds inside GATE-09d's unwired_gates field rather than shipping as a standalone gate; matches CONTEXT §10 framing
- [Phase 58-17]: queryGateFireEvents returns null (not empty object) when Plan 19 extractor absent; disambiguates extractor-missing from extractor-present-no-events and prevents false-block during Plan 17/19 execution overlap
- [Phase 58-17]: Phase-introduced gates enumerated from both CONTEXT.md Requirements-in-scope line (richer; sub-letter gates) and REQUIREMENTS.md traceability table (rolled-up fallback); matches ledger-schema authority pattern
- [Phase 58-17]: Verifier exit behavior: --raw always exits 0 (inspect JSON.status); non-raw + strict + block exits 1; matches existing gsd-tools frontmatter validate contract from Plan 04
- [Phase 58]: XRT-01 planning-phase assertion uses grep heuristic on CONTEXT.md alone (not CONTEXT+RESEARCH); satisfaction vocabulary is permissive-OR of 58-05 Codex-behavior values + narrative forms
- [Phase 58]: XRT-01 closeout capability-matrix diff resolves phase-start SHA via 'git log --first-parent --reverse -- <phaseDir>'; trimEnd() normalization handles execGit stdout trimming vs fs.readFileSync newline preservation asymmetry
- [Phase 58]: XRT-01 closeout runs independently of --no-meta-gate flag (which targets GATE-09e); deadlock guards (missing matrix / no git history) return pass-with-reason to avoid false-blocking on operator-side infrastructure gaps
- [Phase 58]: Phase 58-20: Ledger entries are one-per-claim-prefix (60 unique 30-char prefixes) + 6 Q-resolutions + 2 narrowing entries + 2 pre-authored defer entries = 70 total
- [Phase 58]: Phase 58-20: Q4 (framework-invisibility) deferred to Phase 60.1 rather than collapsed; answerable only empirically from intervention-outcome measurement
- [Phase 58]: Phase 58-20: GATE-06 and GATE-07 deferred to Phase 57.9 with narrowing_provenance per 58-16 defer-provenance artifact (AT-1 Option B branch)
- [Phase 58]: Phase 58-20: AT-5 reflexive GATE-09 closed — Phase 58 runs under its own shipped discipline
- [Phase 58.1]: Accepted the existing Task 1 resolver commit after verifying its JSON contract, keeping Task 2 scoped to installer reuse plus regressions. — The resolver and CLI bridge already satisfied the plan contract, so reworking them would have broken atomic task history without improving the update seam.
- [Phase 58.1]: Codex update cache handling remains an explicit does-not-apply no-op, and the installer now shares Codex config-dir precedence with the resolver. — This keeps Phase 58.1 narrowly focused on update-routing correctness instead of inventing unsupported hook or statusline parity behavior.
- [Phase 58.1]: The user-facing update flow now always installs from `get-shit-done-reflect-cc@latest` and names the active runtime correctly on completion. — This closes the source-repo dogfooding leak and removes the stale "Restart Claude Code" wording from Codex updates.
- [Phase 58.1]: A tiny `--latest-version` bridge extension to `get-shit-done/bin/update-target.cjs` was accepted as a blocking fix so the installed workflow could remain on the shared resolver instead of duplicating target-selection policy. — The deviation stayed narrow and was covered by the new integration fixtures.
- [Phase 58.1]: Verifier status is `human_needed`, not blocked. — Automated evidence passed 5/5 truths; the remaining surface is live interactive Codex behavior against real npm/package resolution and a non-default `CODEX_CONFIG_DIR`, captured in `58.1-VERIFICATION.md`.
- [Phase 59-01]: Exit-code contract: kb rebuild exits 1 on malformed edges (hard fail per D-4); orphaned edges stay advisory (still reported in edge_integrity JSON + table) to preserve backward compatibility with existing execSync-style callers that throw on non-zero exit.
- [Phase 59-01]: Schema v2-to-v3 migration: legacy-row cleanup (DELETE FROM signal_links, signal_tags, signals) moved into initSchema BEFORE creating new FTS5 AFTER triggers, not after. The AFTER DELETE trigger on an empty signal_fts produces 'database disk image is malformed'; clearing before triggers exist avoids that entire class of failure.
- [Phase 59-01]: Edge provenance minimum (audit §7.1 #8) shipped now via additive signal_links.created_at + source_content_hash columns rather than deferred; schema v2-to-v3 bump already forces full rebuild so the incremental cost is zero and downstream forensic work stays cheap.
- [Phase 59-01]: Live repair commit (4662bce3) kept separate from Task 2 implementation commit (30305732) so the 107-file signal frontmatter cleanup is independently revertable from the verb-adding code change.
- [Phase 59]: [59-02]: Helper re-export over duplication -- kb.cjs exports getKbDir/getDbPath/getDbSync so sibling lib modules reuse path resolution + lazy sqlite gate without duplicating the guard block (no circular imports)
- [Phase 59]: [59-02]: Grep fallback for kb query + kb search; clean error (no fallback) for kb link show --inbound -- inbound relation inversion via grep is infeasible at scale, so kb.db-absence surfaces 'run kb rebuild' rather than a degraded result per research §Genuine gaps
- [Phase 59]: [59-02]: Write verbs stubbed at router (kb link create/delete emit 'Plan 04 deferred' error) so the verb namespace is discoverable this wave and Plan 04 has a clear router slot to replace
- [Phase 59]: [59-02]: Fallback output labelled explicitly as 'fallback: {engine: grep, reason: kb.db not found}' rather than silent degradation -- downstream surfacing agents need to distinguish 'fewer matches' from 'running on grep (no porter stem)' per research Pitfall C2
- [Phase 59-03]: kb health exit code is a bitmask (1=edge, 2=lifecycle, 4=dual_write; 7=all three) so CI callers discriminate failure class without re-parsing stdout; first-fail-wins would forfeit this information
- [Phase 59-03]: Check 4 depends_on_freshness ships as SUMMARY not PASS so the advisory-vs-gate distinction is legible; research Pitfall C4 / D2 ontological limit means semantic staleness is not judged
- [Phase 59-03]: Completed-plan detection uses NN-PLAN.md with matching NN-SUMMARY.md presence (execute-plan's commit convention as liveness signal); in-flight plans are out of scope
- [Phase 59-03]: discoverSignalFiles / discoverSpikeFiles / computeEdgeIntegrity promoted from test-only to public exports in kb.cjs so kb-health.cjs reuses one implementation (plan must-have #6 + research Pitfall 8: no new walkers)
- [Phase 59]: [59-04]: BEGIN IMMEDIATE + .bak sidecar dual-write -- canonical idiom for every mutating kb verb (kb transition, kb link create/delete); copy to .bak before any write, transact, on throw ROLLBACK SQL and restore file from .bak
- [Phase 59]: [59-04]: Frozen-field guard requires --force on BOTH kb link create AND kb link delete for qualified_by/superseded_by (symmetry); per knowledge-store.md §10 these are frozen post-publication
- [Phase 59]: [59-04]: reconcile-signal-lifecycle.sh deprecated with one-cycle sunset (v1.20->v1.21) + Linux guard that exits 2 with migration instructions -- chosen over silent removal so downstream macOS users have a release to migrate; Linux users get the deprecation surfaced loudly instead of silent no-op
- [Phase 59]: [59-04]: 31 live-corpus lifecycle drifts NOT retroactively remediated in this plan -- wiring exists and integration test proves it; blanket retroactive transition is a separate operator-judgment pass similar to Plan 01's live-repair commit separation
- [Phase 59]: knowledge-surfacing.md v1.0.0->v2.0.0 rewrite retires lesson-only grep-through-index path; SQLite-first signals+spikes+reflections triad with structural inbound-edge fetch via kb link show --inbound
- [Phase 59]: 59-DEFERRALS.md enumerates KB-12..KB-17 in GATE-09 ledger-consumable form; REQUIREMENTS.md adds footer cross-reference (no content duplication); KB-04b..KB-08 flipped [x] with closed-by Phase 59 Plan N annotations
- [Phase 59]: Cross-runtime parity integration test: sha256 equality for 5 kb* lib files + knowledge-surfacing.md across .claude and .codex; JSON shape parity for all new kb verbs. Phase 58.1 DC-4 held across Phase 59
- [Phase 59.1]: Installer runtime support authority now lives in get-shit-done/bin/lib/runtime-support.cjs, and bin/install.js plus installer tests consume that shared Claude/Codex-only surface directly.
- [Phase 59.1]: Legacy installer flags --gemini, --opencode, and --both now fail fast with migration guidance instead of remapping to supported runtimes.
- [Phase 59.1]: Integration suites now consume SUPPORTED_INSTALLER_RUNTIMES instead of local four-runtime constants.
- [Phase 59.1]: Shared-KB --all fixtures now assert Claude/Codex presence and Gemini/OpenCode absence before running KB checks.
- [Phase 59.1]: README and PROJECT present-tense runtime wording now advertise only the supported Claude Code and Codex CLI installer contract.
- [Phase 59.1]: The capability matrix preserves deprecated Gemini/OpenCode columns for reference, but its support language and release notes now reflect that installer access is limited to Claude/Codex and legacy flags fail with migration guidance.
- [Phase 60]: Recorded the live-audit truth of 7 response_item payload types in §1.3 because the corpus re-check contradicted the plan text that still said 5.
- [Phase 60]: Kept the install.js change strictly additive: existing exports stayed in place and only the Phase 60 consumer helpers/constants were exposed.
- [Phase 60]: Plan 60-02 treats SENS-02 as cross-runtime normalization with applies on both runtimes; SENS-03 remains the sole representability-based Claude does-not-apply row.
- [Phase 60]: Plan 60-02 enforces XRT-01 structurally: the unit test reads the real sidecar artifact and checks existence, exact 9-row count, canonical vocabulary, and non-empty does-not-apply reasons.
- [Phase 60]: Plan 60-02 keeps the DC-4 grep invariant mechanically true by avoiding the forbidden hook token literal anywhere in the sidecar file.
- [Phase 60]: Fingerprint extraction now lives in one standalone Python helper shared by Claude and Codex session normalization.
- [Phase 60]: Codex session discovery is documented as sqlite-primary with PRAGMA probing and filesystem fallback instead of a fatal hard dependency.
- [Phase 60]: Codex-only fingerprint fields stay in the normalized schema as not_available on Claude, and vocabulary drift surfaces as SENS-07 candidates.

### Roadmap Evolution

- Phase 55.1 inserted after Phase 55: Upstream Bug Patches (URGENT) — patch #2005 details-wrapped ROADMAP corruption, #1972 incomplete atomicWriteFileSync, #1981 worktree reset --soft data loss
- Phase 55.2 inserted after Phase 55.1: Codex Runtime Substrate -- runtime detection fixes, documentation drift corrections, parity smoke test. Derived from cross-model audit consensus (Claude, GPT-5.4 xhigh, Opus review, Sonnet review). Requirements: CODEX-01, CODEX-02, CODEX-05
- Gemini CLI and OpenCode deprecated as tested runtimes -- narrowing to Claude Code + Codex CLI only. Community-maintained status in capability-matrix.md. Decision documented in `.planning/deliberations/drop-gemini-opencode-focus-codex.md`
- Phase 57.2 scope refined: 10 requirements (DISC-01 through DISC-10). Typed claims (7 types from 6 exploratory audits across 12 projects), context-checker agent, DISCUSSION-LOG.md as justificatory sidecar, researcher agent update, claim dependency webs. Pipeline enrichment step deferred to backlog 999.1. Derived from 3 deliberations: `exploratory-discuss-phase-quality-regression.md`, `pipeline-enrichment-step-architecture.md`, `claim-type-ontology.md`
- Phase 57.3 inserted after Phase 57.2: Audit Workflow Infrastructure -- formalize audit conventions, task spec preservation, epistemic ground rules. Depends on 57.2. Requirements: AUDIT-01, AUDIT-02
- Execution reordered: 57.1 → 57.2 → 57.3 ship as patches before Phase 57 (telemetry). 57.2 dependency on 57 removed — regression fix ships now, effectiveness revisited post-telemetry
- Phase 57.4 inserted after Phase 57: Audit Skill & Investigatory Type — build /gsdr:audit command + gsdr-auditor agent, add investigatory audit type with frame-reflexive ground rules. Two concerns: (1) operational — invocable audit skill that 57.3 deferred, (2) epistemic — investigatory type and frame-reflexivity practice revealed as missing by Phase 57 investigation. Derived from: `sig-2026-04-09-phase-573-deferred-audit-skill-no-command`, `deliberation: phase-scope-translation-loss-audit-capability-gap.md`, quick task 260409-pz6 REVIEW.md
- Phase 57.4 scope reframed (2026-04-10) from "extension of Phase 57.3 audit infrastructure" to "**radical rethinking of the formalization of the auditing workflow**". The flat 8-type taxonomy, template-based output paradigm, and type-family ground rules from Phase 57.3 do not express the complexities of the auditing situation; Phase 57.4 supersedes these core design commitments with a 3-axis taxonomy (subject × orientation × delegation), obligations paradigm governed by a hermeneutic composition principle, frame-reflexivity Rule 5, I1-I4 investigatory ground rules, and three new obligations (chain integrity, dispatch hygiene, framework invisibility). The operational skill (command + agent) is the vehicle for the reconstruction; the rewrite of `audit-conventions.md` and `audit-ground-rules.md` is the primary deliverable, not a side effect. Derived from: `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` (open — fed forward), `audit-taxonomy-retrospective-analysis.md` (validates 3-axis model against 13 audit sessions), `forms-excess-and-framework-becoming.md`, `sig-2026-04-10-discuss-phase-authority-weighting-gap` (triggered the framing correction after context-checker ran)
- Phase 62 WF-01 pulled forward into Phase 57.4 (2026-04-10): cross-model delegation becomes an `audit_delegation` mode on `/gsdr:audit` rather than a standalone `/gsdr:cross-model-review` command. Phase 62 goal: "Five workflow gaps" → "Four workflow gaps". REQUIREMENTS.md WF-01 phase column updated. WF-01 requirement text (still names standalone command) flagged for potential revision in ROADMAP.md Phase 62 note; not yet rewritten pending 57.4 implementation settlement. Derived from: `audit-taxonomy-three-axis-obligations.md` (audits are primary cross-model use case)
- Phases 57.5/57.6/57.7 inserted after Phase 57.4 (2026-04-16): Measurement Architecture & Retroactive Foundation, Multi-Loop Coverage & Human Interface, and Content Analysis & Epistemic Deepening. Derived from `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` and the 2026-04-15 measurement signal inventory correction chain.
- Phase 57.8 inserted after Phase 57 (2026-04-17): Signal Provenance Split & Artifact Signature Blocks (URGENT). Narrow-slice telemetry→signal integration addressing audit `.planning/audits/2026-04-16-signal-provenance-audit/` Findings 1, 2, 4 & Recommendations 1-2 & 5: role-split signal provenance (about_work/detected_by/written_by), first-class signature blocks on PLAN/SUMMARY/VERIFICATION via `resolveModelInternal`, and version precedence fix. Epistemic prerequisite for Phase 58 — GATE-09's scope-translation ledger cannot attribute gate effectiveness without role-aware artifact provenance. Wider sensor-pipeline integration (reflection stratification, intervention-outcome loop extension, E2E real-agent tests) parked for later insertion after Phase 60.
- Phase 60.1 inserted after Phase 60 (2026-04-17): Telemetry-Signal Integration & E2E Chain Tests (URGENT). Wider companion to 57.8's narrow provenance fix — sensors consume `buildSessionIdentityValue` from measurement/extractors/runtime.cjs, reflection stratifies by model/profile/reasoning_effort via `measurement/stratify.cjs`, intervention-outcome loop extended to signal lifecycle transitions, and the `tests/e2e/real-agent.test.js` todos are replaced with working discuss→plan→execute→verify→collect-signals chain tests. Depends on Phase 60 (sensor pipeline must exist before sensors can be rewired). Addresses audit `.planning/audits/2026-04-16-signal-provenance-audit/` Finding 3 (partial/asymmetric work-artifact signatures) and Recommendation 3 (treat telemetry as source).
- Phase 58.1 inserted after Phase 58 (2026-04-20): Codex Update Distribution Parity (URGENT). Narrow runtime-parity fix for Codex update behavior: repo-local `.codex` mirrors must not mask stale `~/.codex` installs; scope includes installed-vs-mirror detection, runtime/scope targeting, update/cache parity, and regression coverage.
- Phase 59.1 inserted after Phase 59 (2026-04-21): Drop Gemini and OpenCode from installer scope (URGENT). Must land before v1.20.0 milestone release. Phase 59 execution surfaced that `bin/install.js:72-161` advertises `--gemini` / `--opencode` / `--all` flags and treats both runtimes as first-class install targets, despite the Gemini/OpenCode deprecation decision recorded above (line 319) and in `.planning/deliberations/drop-gemini-opencode-focus-codex.md`. The deliberation de-scoped the runtimes as tested targets but the installer was never cleaned up — untyped scope drift persisted for 58 phases. Trigger: `sig-2026-04-21-installer-advertises-gemini-opencode-unsupported`. Scope: declare canonical supported-runtimes list, strip Gemini/OpenCode from installer (flags, path resolvers, frontmatter conversion, tool-name map, help text), add regression test asserting installer targets = declared list, gitignore `.gemini/`/`.opencode/`, record breaking-change disposition for v1.20.0 release notes if any v1.19.x user exercised those flags.

### Pending Todos

8 pending (3 carried from v1.18, 5 remaining):

- [HIGH] Dual-install Phase 2: update flow, hook awareness, and version-pinned suppression (tooling)
- [HIGH] Local patch archive: versioned history instead of single-snapshot overwrite (installer)
- [HIGH] Cross-model review skill needed sooner than Phase 62 — launching Codex for review is fragile manual CLI work; /gsdr:cross-model-review is Phase 62 (WF-01) but the need is immediate. Consider pulling forward or building a minimal utility skill. (workflow)
- [MEDIUM] gsd-tools audit subcommand: encode audit type taxonomy + ground rule sets as structured data in lib/audit.cjs so the /gsdr:audit command can call `gsd-tools init audit` instead of parsing reference docs directly. Deferred per trial-before-formalize — ship command+agent first, formalize tooling once usage patterns emerge. (tooling, audit)
- [MEDIUM] Ghost agent integration: gsd-ui-auditor and gsd-doc-verifier entries in model-profiles.cjs have no agent specs — caused by upstream sync pulling profiles without corresponding specs. Needs deliberation on whether to build these agents, stub them, or remove the profiles. (upstream-sync, deliberation)
- [MEDIUM] Revisit provisional corpus grounding set (planning)
- [MEDIUM] Add `max` model profile above `quality` so Codex can persist top-end `xhigh` reasoning for executors/verifiers instead of relying on manual spawn overrides. Keep `quality` backward-compatible; update model profile mapping, Codex resolution, and profile-selection/help surfaces. (tooling)
- [MEDIUM] Track Codex auto-compact prompt handling in Phase 60 parity work so Codex/Claude comparison covers runtime continuity behavior, not just visible tool/capability parity. Decide whether compaction should explicitly restate workflow-critical norms for delegated flows. (planning)

### Blockers/Concerns

- NPM_TOKEN config (pre-existing from v1.12, not blocking)
- Gitignore friction (pre-existing from v1.12, not blocking)
- Token count reliability in session-meta (109 input_tokens for 513-minute session is implausibly low) -- validation spike required before baselines committed in Phase 57

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260408-snh | Implement v1.20 roadmap amendments: Phase 55.2, CODEX requirements, Gemini/OpenCode deprecation | 2026-04-09 | 68309db | [260408-snh](./quick/260408-snh-implement-v1-20-roadmap-amendments-inser/) |
| Phase 57.2 P01 | 4min | 2 tasks | 3 files |
| Phase 57.2 P02 | 5min | 2 tasks | 2 files |
| Phase 57.2 P03 | 4min | 3 tasks | 3 files |
| Phase 57.3 P01 | 3min | 2 tasks | 3 files |
| Phase 57.3 P02 | 4min | 2 tasks | 34 files |
| Phase 57 P02 | 5min | 2 tasks | 2 files |
| Phase 57.4 P02 | 5min | 3 tasks | 1 files |
| Phase 57.4 P01 | 7min | 3 tasks | 1 files |
| Phase 57.4 P03 | 5min | 2 tasks | 1 files |
| Phase 57.4 P04 | 6min | 3 tasks | 2 files |
| Phase 57.4 P05 | 3min | 2 tasks | 1 files |
| Phase 57.4 P06 | 3min | 3 tasks | 2 files |
| Phase 57.7 P03 | 10min | 2 tasks | 3 files |
| 260419-6uf | Fix manual gsdr-signal split provenance gap left out of 57.8 | 2026-04-19 | ddcf1232 | [260419-6uf](./quick/260419-6uf-fix-manual-gsdr-signal-split-provenance-/) |
| 260419-wjj | Patch roadmap and requirements so downstream provenance phases explicitly cover manual gsdr-signal parity | 2026-04-20 | 2a14f8df | [260419-wjj](./quick/260419-wjj-patch-roadmap-and-requirements-so-downst/) |
| Phase 58 P03 | 5min | 2 tasks | 2 files |
| Phase 58 P05 | 5min | 1 tasks | 1 files |
| Phase 58-structural-enforcement-gates P01 | 6 | 3 tasks | 5 files |
| Phase 58 P02 | 10min | 2 tasks | 2 files |
| Phase 58 P04 | 9min | 2 tasks | 3 files |
| Phase 58 P16 | 4min | 1 tasks | 1 files |
| Phase 58-structural-enforcement-gates P11 | 9min | 2 tasks | 4 files |
| Phase 58-structural-enforcement-gates P06 | 248min | 2 tasks | 4 files |
| Phase 58 P07 | 3min | 2 tasks | 3 files |
| Phase 58-structural-enforcement-gates P08 | 5min | 2 tasks | 4 files |
| Phase 58-structural-enforcement-gates P09 | 7min | 2 tasks | 3 files |
| Phase 58-structural-enforcement-gates P12 | 10 | 2 tasks | 11 files |
| Phase 58-structural-enforcement-gates P10 | 5min | 2 tasks | 4 files |
| Phase 58 P12a | 12 | 2 tasks | 8 files |
| Phase 58-structural-enforcement-gates P13 | 8min | 2 tasks | 6 files |
| Phase 58-structural-enforcement-gates P14 | 4min | 2 tasks | 5 files |
| Phase 58-structural-enforcement-gates P15 | 5min | 2 tasks | 6 files |
| Phase 58-structural-enforcement-gates P19 | 4min | 1 tasks | 5 files |
| Phase 58-structural-enforcement-gates P17 | 10min | 2 tasks | 6 files |
| Phase 58 P18 | 5min | 1 tasks | 4 files |
| Phase 58-structural-enforcement-gates P20 | 10min | 2 tasks | 3 files |
| Phase 58.1 P01 | 8min | 2 tasks | 4 files |
| Phase 58.1 P02 | 15min | 2 tasks | 5 files |
| Phase 59-kb-query-lifecycle-wiring-and-surfacing P01 | 16min | 2 tasks | 112 files |
| Phase 59 P02 | 7min | 2 tasks | 6 files |
| Phase 59 P03 | 5min | 2 tasks | 4 files |
| Phase 59 P04 | 13min | 2 tasks | 9 files |
| Phase 59 P04 | 13min | 2 tasks | 9 files |
| Phase 59 P05 | 8min | 2 tasks | 6 files |
| Phase 59.1 P01 | 8min | 2 tasks | 3 files |
| Phase 59.1 P02 | 10min | 2 tasks | 3 files |
| Phase 59.1 P03 | 7min | 2 tasks | 4 files |
| Phase 60 P01 | 5min | 2 tasks | 5 files |
| Phase 60 P02 | 4min | 2 tasks | 2 files |
| Phase 60 P03 | 8min | 3 tasks | 5 files |

### Key Artifacts

- Audit evidence base: `.planning/audits/session-log-audit-2026-04-07/` (32 reports, 100 sessions, 165 findings)
- Research documents: `.planning/research/` (9 v1.20 research docs)
- Milestone steering brief: `.planning/MILESTONE-CONTEXT.md`
- Claim type audits: `.planning/audits/2026-04-09-*claim-audit*` (6 files, 12 projects, ~85 CONTEXT.md files)
- Deliberations for 57.2: `exploratory-discuss-phase-quality-regression.md` (concluded), `pipeline-enrichment-step-architecture.md` (concluded, deferred), `claim-type-ontology.md` (concluded)
- Deliberations for 57.4 (primary authority): `audit-taxonomy-three-axis-obligations.md` (open — fed forward, NOT concluded), `audit-taxonomy-retrospective-analysis.md` (complete — validates 3-axis model against 13 audit sessions), `forms-excess-and-framework-becoming.md` (open — governing constraint; also carries the claim-type vocabulary concern surfaced during v2 discuss-phase), `phase-scope-translation-loss-audit-capability-gap.md` (triggering deliberation)
- Phase 57.4 working artifacts: `57.4-CONTEXT.md` (v2, framing-corrected 2026-04-10), `57.4-DISCUSSION-LOG.md` (includes context-checker verification log + Framing Correction appendix), `pre-phase-archive/REVIEW.md` (Rule 5 + I1-I4 source, still load-bearing), `pre-phase-archive/57.4-DISCUSSION-LOG-v1.md` (v1 verification work)
- Reference files carrying 57.4 supersession banners (to be rewritten by this phase): `get-shit-done/references/audit-conventions.md`, `get-shit-done/references/audit-ground-rules.md`
- New signals this session: `sig-2026-04-10-discuss-phase-authority-weighting-gap.md` (capability-gap, severity high; one observation, needs corroboration)
- Deliberation for 57.5 (primary authority): `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` (open — phase split and design authority)
- Phase 57.5 evidence chain: `.planning/audits/2026-04-15-measurement-signal-inventory/` (handoff, correction-and-extensions, anomaly-stress-tests, E5.8 experiment) plus spikes 009 and 010
- Phase 57.5 working artifacts: `57.5-CONTEXT.md` and `57.5-DISCUSSION-LOG.md` (captured 2026-04-16, context-checker pending)

## Session Continuity

Last session: 2026-04-21T20:53:38.599Z
Stopped at: Completed 60-03-PLAN.md
Resume artifact: `.planning/phases/58.1-codex-update-distribution-parity/58.1-VERIFICATION.md`

This session (2026-04-20):

- Reverted the earlier ad hoc Codex update edits so the work could be rerun through the repo's actual GSD workflow.
- Inserted decimal Phase `58.1` after Phase 58, wrote discuss artifacts, passed context-checker, ran research, and planned two execution waves with planner/checker validation.
- Executed `58.1-01` on branch `gsd/phase-58.1-codex-update-distribution-parity`, landing the shared Codex update-target resolver (`b70e66a5`) and the installer/test follow-up (`e38a67e0`).
- Verified `58.1-01` locally with `npx vitest run tests/unit/install.test.js`, live resolver JSON from the repo root, and a custom both-scopes-stale fixture.
- Created `58.1-01-SUMMARY.md` manually after the executor hung post-commit, keeping the landed code intact and setting the next resume point to `58.1-02-PLAN.md`.
- Closed the non-responsive wave-2 executor, rewired the update command/workflow locally, and committed the runtime-aware/published-package flow in `38fa33ac` plus the Codex parity integration regressions in `a7904470`.
- Verified `58.1-02` locally with `npx vitest run tests/integration/multi-runtime.test.js` and a fresh `npx vitest run tests/unit/install.test.js` regression pass.
- Ran the phase verifier and produced `58.1-VERIFICATION.md`; automated verification passed, and the only remaining checks are two live Codex update runs (default and non-default `CODEX_CONFIG_DIR`).
