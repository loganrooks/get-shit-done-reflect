# Roadmap: GSD Reflect

## Milestones

- <details><summary>v1.12 GSD Reflect (Phases 0-6) -- SHIPPED 2026-02-09</summary>See milestones/v1.12-ROADMAP.md</details>
- <details><summary>v1.13 Upstream Sync & Validation (Phases 7-12) -- SHIPPED 2026-02-11</summary>See milestones/v1.13-ROADMAP.md</details>
- <details><summary>v1.14 Multi-Runtime Interop (Phases 13-21) -- SHIPPED 2026-02-16</summary>See milestones/v1.14-ROADMAP.md</details>
- <details><summary>v1.15 Backlog & Update Experience (Phases 22-30) -- SHIPPED 2026-02-23</summary>See milestones/v1.15-ROADMAP.md</details>
- <details><summary>v1.16 Signal Lifecycle & Reflection (Phases 31-35) -- SHIPPED 2026-03-02</summary>See milestones/v1.16-ROADMAP.md</details>
- <details><summary>v1.17 Automation Loop (Phases 36-44) -- SHIPPED 2026-03-09</summary>See milestones/v1.17-ROADMAP.md</details>
- <details><summary>v1.18 Upstream Sync & Deep Integration (Phases 45-54 + 48.1) -- SHIPPED 2026-03-30</summary>See milestones/v1.18-ROADMAP.md</details>

## v1.20 Signal Infrastructure & Epistemic Rigor

**Milestone Goal:** Replace advisory quality controls with structural enforcement, mature the signal system from detection-only to full lifecycle management with a queryable knowledge base, overhaul spike methodology with epistemologically rigorous experimental design, and establish measurement infrastructure for evidence-based workflow improvement.

**Phases:** 21 (Phases 55-64 + 55.1, 55.2, 57.1, 57.2, 57.3, 57.4, 57.5, 57.6, 57.7, 57.8, 60.1)
**Granularity:** Fine
**Requirements:** 120 mapped (PROV-01..14 + GOV-01 added 2026-04-17)

## Phases

- [x] **Phase 55: Upstream Mini-Sync** - Integrate upstream correctness fixes (state locking, milestone safety, frontmatter, installer) before any v1.20 work begins
- [x] **Phase 56: KB Schema & SQLite Foundation** - Signal schema evolution and SQLite index creation establish the queryable knowledge base substrate
- [x] **Phase 57: Measurement & Telemetry Baseline** - Telemetry extraction tooling and baseline capture before any structural interventions ship
- [x] **Phase 57.1: Explore Skill Adoption** - Quick adopt upstream /gsd:explore as /gsdr:explore with minimal GSDR branding (completed 2026-04-09)
- [x] **Phase 57.2: Discuss-Phase Exploratory Mode Overhaul** - Typed claims (7 types + verification dimension), context-checker agent, DISCUSSION-LOG.md as justificatory sidecar, researcher update, claim dependency webs, template enrichment
- [x] **Phase 57.3: Audit Workflow Infrastructure** - Formalize audit conventions: date-first directories, task spec preservation, epistemic ground rules for audit agents *(core design commitments — flat 8-type taxonomy, template-based body structure, type-family ground rules — partially superseded by Phase 57.4 after running real audits revealed the flat taxonomy did not express the complexities of the auditing situation; see Phase 57.4 for the 3-axis reconstruction)*
- [x] **Phase 57.4: Audit Skill & Investigatory Type** - Radically rethink the formalization of the auditing workflow: the Phase 57.3 flat 8-type taxonomy + template paradigm + ground rules 1-4 do not express the complexities of the auditing situation. This phase supersedes Phase 57.3's core design commitments with a 3-axis taxonomy (subject × orientation × delegation), an obligations-based output paradigm governed by a hermeneutic composition principle, frame-reflexivity Rule 5, I1-I4 investigatory ground rules, and three new obligations from retrospective analysis (chain integrity, dispatch hygiene, framework invisibility). Deliverables: /gsdr:audit command + gsdr-auditor agent, rewritten audit-conventions.md and audit-ground-rules.md, formalized cross-model delegation (WF-01 pulled forward from Phase 62)
- [x] **Phase 57.5: Measurement Architecture & Retroactive Foundation** - Three-layer measurement architecture (raw → extractor registry → interpretation) that retroactively analyzes existing session and artifact corpora, with cross-platform schema from day one and minimum-viable post-Popperian epistemic machinery (competing interpretations, distinguishing features, anomaly register per interpretation). Covers intervention-lifecycle and pipeline-integrity loops; proves cross-platform with at least one Codex extractor (completed 2026-04-16)
- [x] **Phase 57.6: Multi-Loop Coverage & Human Interface** - Extend extractor coverage to all remaining self-improvement loops (agent-performance, signal-quality, cross-session patterns, cross-runtime comparison), add human-readable text-first visualization, and demonstrate actual use of the system to diagnose an observed pattern end-to-end (completed 2026-04-17)
- [ ] **Phase 57.7: Content Analysis & Epistemic Deepening** - Session-content extractors (structural patterns in transcripts with documented privacy model), automated distinguishing-feature suggestion, intervention-outcome tracking, interpretation revision classification (progressive vs degenerating per Lakatos), full epistemic provenance on all interpretations
- [ ] **Phase 57.8: Signal Provenance Split & Artifact Signature Blocks** - Role-aware provenance (`about_work[]` / `detected_by` / `written_by`) replacing flat `runtime/model/gsd_version` payload; uniform signature block on PLAN/SUMMARY/VERIFICATION via `resolveModelInternal`; writer-side version precedence fix; retroactive annotation of Phase 57.6 signals. Epistemic prerequisite for GATE-09 (Phase 58). Narrow audit-bounded fix per `.planning/audits/2026-04-16-signal-provenance-audit/`
- [ ] **Phase 58: Structural Enforcement Gates** - Replace advisory workflow controls with structural enforcement for the 8 most-recurred failure patterns, plus GATE-09 scope-translation ledger (meta-fix for Phase 57 scope-narrowing cascade)
- [x] **Phase 59: KB Query, Lifecycle Wiring & Surfacing** - Full-text search, relationship traversal, lifecycle automation, and agent-accessible KB queries (completed 2026-04-20)
- [ ] **Phase 60: Sensor Pipeline & Codex Parity** - Log sensor, patch sensor, and cross-runtime parity verification (can proceed in parallel with Phase 61)
- [ ] **Phase 60.1: Telemetry-Signal Integration & E2E Chain Tests** - Sensors consume `buildSessionIdentityValue` from measurement extractors, reflection stratifies by `model × profile × reasoning_effort`, intervention-outcome loop extended to signal lifecycle, E2E real-agent chain tests. Research-gated scope expansion via PROV-09 under GOV-01 extraction contract
- [ ] **Phase 61: Spike Methodology Overhaul** - Three-level confidence, cross-model design reviewer, template revisions, and findings verification (can proceed in parallel with Phase 60)
- [ ] **Phase 62: Workflow Commands** - Five commands closing workflow gaps identified by audit and deliberation
- [ ] **Phase 63: Spike Programme Infrastructure** - Programme-level spike management with Lakatosian progressiveness assessment
- [ ] **Phase 64: Parallel Execution** - Per-worktree state files and overlap detection for parallel phase execution (separately gated)

## Phase Details

### Phase 55: Upstream Mini-Sync
**Goal**: v1.20 builds on a correct substrate -- upstream TOCTOU, milestone safety, frontmatter, and installer fixes integrated before any new work begins
**Depends on**: Nothing (must precede all other v1.20 work)
**Requirements**: SYNC-01
**Success Criteria** (what must be TRUE):
  1. `gsd-tools` state operations use atomic writes that prevent TOCTOU race conditions
  2. Milestone safety preserves 999.x backlog items during transitions without data loss
  3. Frontmatter parsing handles quoted-comma values correctly
  4. Installer reliability fixes applied and validated by existing test suite (628 tests pass)
**Plans:** 4 plans
Plans:
- [x] 55-01-PLAN.md -- Adopt model-profiles.cjs and wholesale-replace 4 pure upstream modules
- [x] 55-02-PLAN.md -- Hybrid-merge core.cjs, frontmatter.cjs, and config.cjs
- [x] 55-03-PLAN.md -- Replace phase.cjs/roadmap.cjs with re-adjustments, hybrid-merge installer
- [x] 55-04-PLAN.md -- Update router, adopt upstream tests, validate all 3 suites, run installer

### Phase 55.1: Upstream Bug Patches (INSERTED)

**Goal:** Patch three upstream-reported bugs that affect ROADMAP integrity (#2005 details-wrapped corruption), file write safety (#1972 incomplete atomicWriteFileSync), and worktree data loss (#1981 reset --soft)
**Requirements**: SYNC-01 (continuation)
**Depends on:** Phase 55
**Plans:** 2 plans

Plans:
- [x] 55.1-01-PLAN.md -- Fix ROADMAP corruption when milestone wrapped in details (#2005)
- [x] 55.1-02-PLAN.md -- Extend atomicWriteFileSync to 3 modules (#1972) and add worktree_branch_check (#1981)

### Phase 55.2: Codex Runtime Substrate (INSERTED)

**Goal:** The harness correctly detects, adapts to, and verifies Codex CLI capabilities -- runtime detection is code-level accurate, agent/sensor discovery works across formats, and parity monitoring prevents silent drift.
**Depends on:** Phase 55.1 (upstream bugs patched first)
**Requirements:** CODEX-01, CODEX-02, CODEX-05
**Success Criteria** (what must be TRUE):
  1. Runtime capability resolver (`automation.cjs`) correctly identifies `codex-cli` capabilities without falling back to "constrained" heuristic
  2. Agent and sensor discovery handles both `.md` (Claude Code) and `.toml` (Codex) formats in both `.claude/` and `.codex/` paths
  3. Brownfield detection excludes `.codex/` directory from false-positive triggers
  4. Documentation in capability-matrix.md accurately reflects live Codex CLI runtime behavior (config.toml not codex.toml, hooks under development, SKILL.md format, agents/*.toml registration)
  5. `cross-runtime-parity-research.md` exists as living document recording last-audited Codex version and validation commands
**Plans:** 3 plans

Plans:
- [x] 55.2-01-PLAN.md -- Runtime capability resolver, brownfield exclusion, agent TOML detection
- [x] 55.2-02-PLAN.md -- Multi-directory multi-format sensor discovery
- [x] 55.2-03-PLAN.md -- Capability matrix corrections and parity living document




### Phase 56: KB Schema & SQLite Foundation
**Goal**: Signal files support full lifecycle tracking, and a SQLite index makes the knowledge base queryable by structured fields
**Depends on**: Phase 55
**Requirements**: KB-01, KB-02, KB-03, KB-04a, KB-05, KB-09, KB-10, KB-11
**Success Criteria** (what must be TRUE):
  1. `gsd-tools kb rebuild` processes the existing 198-signal corpus without errors, producing a SQLite index with all frontmatter fields indexed
  2. Signal files support lifecycle states (detected/triaged/blocked/remediated/verified/invalidated), polarity (negative/positive/mixed), response disposition (fix/formalize/monitor/investigate), and qualification links (qualified_by/superseded_by)
  3. Existing signal files with old schema parse successfully -- new fields default gracefully when absent, `source` field resolved to `detection_method` + `origin` via migration script
  4. kb.db is gitignored and rebuildable from files at any time -- SQLite is a derived cache, files remain source of truth
  5. package.json engines.node updated to >=22.5.0 with actionable error message on older Node versions
**Plans**: 3 plans
Plans:
- [x] 56-01-PLAN.md -- Create kb.cjs module with SQLite schema, rebuild, stats, migrate + align KB-01 lifecycle states
- [x] 56-02-PLAN.md -- Wire router, update package.json engines, gitignore kb.db, validate on real corpus
- [x] 56-03-PLAN.md -- KB test suite + run source field migration on 199-signal corpus

### Phase 57: Measurement & Telemetry Baseline
**Goal**: Telemetry extraction tooling captures a pre-intervention baseline so that structural changes in subsequent phases can be attributed to specific interventions
**Depends on**: Phase 56
**Requirements**: TEL-01a, TEL-01b, TEL-02, TEL-04, TEL-05
**Success Criteria** (what must be TRUE):
  1. `gsd-tools telemetry summary` shows session overview, `telemetry session` shows single session detail, and `telemetry phase` shows sessions within a phase time window
  2. `gsd-tools telemetry baseline` produces `.planning/baseline.json` with statistical computation from session-meta data
  3. `.planning/baseline.json` is committed before any Phase 58 structural gates are deployed
  4. Facets data (AI-generated session quality assessments) joined with session-meta by session_id, with all facets-derived fields annotated as AI-generated estimates with unknown accuracy
**Plans**: 2 plans
Plans:
- [x] 57-01-PLAN.md -- Implement telemetry.cjs module and wire gsd-tools.cjs router (TEL-01a, TEL-01b, TEL-04, TEL-05)
- [x] 57-02-PLAN.md -- Tests for telemetry.cjs and capture .planning/baseline.json (TEL-02)

### Phase 57.8: Signal Provenance Split & Artifact Signature Blocks (INSERTED)

**Goal:** Signals and workflow artifacts (PLAN, SUMMARY, VERIFICATION) carry role-aware provenance that can attribute mistakes to planner, executor, verifier, or harness — not one flat `runtime/model/gsd_version` payload that mixes detector, writer, and work-artifact identity. This includes both auto-collected signal surfaces and the manual `/gsdr:signal` command / installed-skill path. This phase is the **narrow audit-bounded fix** for the `.planning/audits/2026-04-16-signal-provenance-audit/` findings; the wider telemetry-to-signal integration is deferred to Phase 60.1. Epistemic prerequisite for Phase 58 — GATE-09's scope-translation ledger requires role-aware artifact provenance to evaluate gate effectiveness (currently a signal about a Plan 06 mistake can implicate planner, executor, verifier, and harness simultaneously, and the flat schema cannot attribute which).
**Depends on:** Phase 57.7 (measurement substrate — `buildSessionIdentityValue` and `resolveModelInternal` exist and are canonical sources for the role-split fields this phase persists)
**Requirements:** PROV-01, PROV-02, PROV-03, PROV-04, PROV-05, PROV-06, PROV-07, PROV-08
**Success Criteria** (what must be TRUE):
  1. Signal schema supports role-split provenance (`about_work[]`, `detected_by`, `written_by`) as declarative fields for both auto-collected and manual signals, with array semantics for `about_work[]` and `provenance_status` markers on every field (PROV-01)
  2. Every newly-created PLAN.md, SUMMARY.md, and VERIFICATION.md carries a uniform signature block (role, harness, platform, vendor, model, reasoning_effort, profile, gsd_version, generated_at, session_id, provenance_status-per-field) populated via `resolveModelInternal` at orchestration time; `frontmatter.cjs` validates the block as required (PROV-02)
  3. `gsdr-signal-synthesizer` writer-side `gsd_version` precedence, and the matching manual `/gsdr:signal` write guidance, prefer installed harness + config over stale repo-local mirror; every persisted version field carries a provenance marker identifying source (PROV-03)
  4. Sensor task specs and `collect-signals.md` workflow stamp role-split provenance fields (not flat payload), and the manual `/gsdr:signal` command / installed skill surfaces teach the same split-provenance contract; auto-collected and manual signal outputs conform to PROV-01 schema (PROV-04)
  5. Signal schema migration is additive — pre-57.8 signals parse with `provenance_schema: v1_legacy`; `kb.db` columns extended; KB rebuild processes both schemas without error; dual-write invariant maintained per KB-05 (PROV-05)
  6. The nine committed Phase 57.6 signals carry `provenance_status: legacy_mixed` annotation; substantive content preserved; audit Recommendation 4 closed (PROV-06)
  7. `signal-detection.md`, `knowledge-store.md`, and the manual signal command / skill docs document role-split semantics; current schema text ambiguity (audit cites `signal-detection.md:183-187`) and manual-surface drift are resolved together (PROV-07)
  8. Legacy flat `runtime`/`model`/`gsd_version` fields readable and writable by legacy consumers; deprecation notice + v1.21 removal schedule recorded (PROV-08)
Authority: `.planning/audits/2026-04-16-signal-provenance-audit/signal-provenance-audit-output.md` (audit is primary source; Findings 1, 2, 3 and Recommendations 1, 2, 4, 5)
Derived from: audit Findings 1-3 + Recommendations 1, 2, 4, 5. Wider integration (Finding 4, Recommendation 3) split to Phase 60.1 because it depends on the sensor pipeline (Phase 60) existing first. Open design questions (array vs. graph, migration strategy, reflection-consumer coupling) carried into 57.8-CONTEXT.md as typed open claims per GOV-01 discipline.
**Plans:** 0/TBD (run `/gsdr:discuss-phase 57.8` then `/gsdr:plan-phase 57.8`)

### Phase 57.9: Hook & Closeout Substrate (INSERTED)

**Goal:** The installer and runtime substrate provide the closeout / incident hook surfaces that Phase 58 depends on, instead of letting structural gates stand on missing infrastructure. This narrow prerequisite wires SessionStop / closeout hooks for Claude Code, integrates the available Codex hook surface when supported, and exposes the session-level closeout / incident markers needed by GATE-06 and GATE-07.
**Depends on:** Phase 57.8 (role-aware provenance is already the epistemic prerequisite for Phase 58; this phase closes the operational prerequisite)
**Requirements:** HOOK-01, HOOK-02, HOOK-03
**Success Criteria** (what must be TRUE):
  1. Installer writes the Claude Code SessionStop / closeout hook surface from source, with tests proving the hook lands in the installed runtime
  2. Installer detects Codex hook support and either writes the required Codex hook surface or records an explicit degradation / waiver path rather than silently assuming parity
  3. Closeout / incident hook substrate exposes canonical markers or counters for "postlude fired" and the incident conditions Phase 58 needs (error-rate / direction-change / destructive-event, or explicit `not_available`)
**Plans**: TBD

### Phase 57.4: Audit Skill & Investigatory Type (INSERTED)

**Goal:** This phase **radically rethinks the formalization of the auditing workflow**. Phase 57.3 produced the first formal audit infrastructure: a flat 8-type taxonomy, body templates per type, ground rules 1-4, type-family rule extensions, and the supporting reference files. After 57.3 shipped, the work of actually running audits (13 sessions plus 6 exploratory audits of audit quality) revealed that this formalization **does not express the complexities of the auditing situation**. What looked like "types" conflated three orthogonal concerns under one enum. Templates could not compose obligations across axes. Frame-reflexivity was absent. Chain integrity, dispatch hygiene, and framework invisibility were not enforced by any rule.

This phase is the **reconstructive response**, not an extension. It **supersedes** core design commitments of Phase 57.3 while preserving compatible meta-rules (directory conventions, rule-copying protocol, core rules 1-4, escape-hatch principle). The reconstruction, authoritatively specified in `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` (open — fed forward) and validated in `audit-taxonomy-retrospective-analysis.md`, comprises:

- **3-axis taxonomy** replacing the flat 8-type list: **subject** (9 subject types including 2 new — `process_review`, `artifact_analysis`), **orientation** (`standard` | `investigatory` | `exploratory`), **delegation** (`self` | `cross_model:{model_id}`).
- **Obligations-based output paradigm** for non-standard orientations (templates remain for standard routine audits — the retrospective identified 3 populations: template / obligations / multi-agent). Obligations are things the audit must *address*, not sections it must *write*.
- **Hermeneutic composition principle** governing how obligations from different axes interact: "name the tension, navigate situationally." Not an algorithm — a practice.
- **Frame-reflexivity Rule 5** added to all orientations: "Did the framing shape what you found?" Distinct from Rule 4 (escape hatch within the frame) because Rule 5 catches whether the frame was the right one.
- **I1-I4 investigatory ground rules** from the REVIEW.md analysis: start from discrepancy not theory; let investigation guide artifact selection; present competing explanations; name the position of the investigation.
- **Three new obligations from retrospective analysis**: **chain integrity** (predecessor audit claims re-verified when inherited), **dispatch hygiene** (parallel agent prompts checked for framing bias), **framework invisibility** (audits must name what their framework cannot see).

The phase ships the reconstructed formalization along three deliverable vehicles:

1. **`/gsdr:audit` command + `gsdr-auditor` agent** — invocable skill dispatching under the 3-axis model, composing obligations per situation, handling session directories, copying ground rules into task specs, supporting cross-model delegation. This is the operational skill Phase 57.3 deferred.
2. **Rewritten `audit-conventions.md` and `audit-ground-rules.md`** — replacing the flat taxonomy (Section 3 of audit-conventions.md), per-type body templates (Section 4), and type-family rule sets (S1-S2, E1-E3, C1 in audit-ground-rules.md) with the 3-axis model, obligations paradigm, Rule 5, I1-I4, and composition principle. Both files currently carry supersession banners pointing at the deliberations as primary authority pending this rewrite.
3. **Formalized cross-model delegation (WF-01, pulled forward from Phase 62)** — cross-model dispatch as an `audit_delegation` mode rather than a standalone `/gsdr:cross-model-review` command. The audit command is the natural home since audits are the primary cross-model use case.

**Two concerns held together without collapsing one into the other:** (1) **epistemic reconstruction (primary)** — the 3-axis model, obligations paradigm, Rule 5, I1-I4, and composition principle replace core design commitments of 57.3, not decorate them; (2) **operational delivery (secondary, instrumental)** — the skill is the vehicle by which the reconstruction enters practice.

**Requirements**: AUDIT-01, AUDIT-02 (forward compliance — the skill enforces what 57.3 established *as reconstructed*); WF-01 (cross-model delegation, pulled forward from Phase 62 — now an `audit_delegation` mode); plus new requirements TBD for the 3-axis taxonomy, obligations paradigm, Rule 5, I1-I4, and three new obligations (these supersede the v1 "AUDIT-04" placeholder, which was a flat-taxonomy artifact that no longer describes the work).
**Depends on:** Phase 57.3 (base infrastructure — directory conventions, frontmatter meta-schema, rule-copying protocol — must exist to be partially preserved and partially rewritten).
**Scope authority:** `.planning/phases/57.4-audit-skill-investigatory-type/57.4-CONTEXT.md` (v2, post-deliberation restructuring, framing-corrected 2026-04-10). When this roadmap summary and CONTEXT.md diverge, **CONTEXT.md is authoritative**. For the audit formalization design itself (taxonomy, obligations, rules), **the deliberations are authoritative** — not the reference files, which are partially superseded and carry supersession banners.
Derived from: `sig-2026-04-09-phase-573-deferred-audit-skill-no-command`, `sig-2026-04-10-discuss-phase-authority-weighting-gap` (signal that triggered the framing correction of this roadmap entry), `.planning/deliberations/phase-scope-translation-loss-audit-capability-gap.md` (triggering deliberation), `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` (**open — fed forward, not concluded**; primary design source for v2), `.planning/deliberations/audit-taxonomy-retrospective-analysis.md` (validates 3-axis model against 13 audit sessions), `.planning/deliberations/forms-excess-and-framework-becoming.md` (governing constraint on how formal systems handle excess — also carries the claim-type vocabulary concern surfaced during v2 discuss-phase), `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/REVIEW.md` (original philosophical deconstruction, Rule 5 and I1-I4 source, still load-bearing).
**Plans:** 6 plans

Plans:
- [ ] 57.4-01-PLAN.md — Rewrite audit-conventions.md (3-axis taxonomy, obligations paradigm, v2 frontmatter)
- [ ] 57.4-02-PLAN.md — Rewrite audit-ground-rules.md (Rule 5, I1-I4, subject/orientation/cross-cutting obligations, composition principle)
- [ ] 57.4-03-PLAN.md — Create /gsdr:audit command (commands/gsd/audit.md) with cross-model experimental dispatch
- [ ] 57.4-04-PLAN.md — Create gsdr-auditor agent (agents/gsdr-auditor.md) + gsd-auditor model-profiles entry
- [ ] 57.4-05-PLAN.md — Rewrite REQUIREMENTS.md WF-01 + add new AUDIT requirements for 3-axis model
- [ ] 57.4-06-PLAN.md — Remove supersession banners, run installer sync, full verification suite

### Phase 57.2: Discuss-Phase Exploratory Mode Overhaul (INSERTED)

**Goal:** CONTEXT.md becomes a rich research-guiding artifact with typed claims, dependency webs, and justificatory sidecar — not a shallow locked-down spec. The researcher gets a mandate to investigate assumptions, explore open questions, and check forward projections. A context-checker agent verifies claim integrity before planning begins.
**Depends on:** Phase 55.2 (runtime substrate complete). Effectiveness revisited post-Phase 57 (telemetry baseline provides metrics to evaluate whether interventions helped)
**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08, DISC-09, DISC-10
**Success Criteria** (what must be TRUE):
  1. Exploratory-mode `write_context` template includes structural sections for working assumptions, derived constraints, epistemic guardrails, and structured open questions (DISC-01)
  2. 7 typed claim states (evidenced, decided, assumed, open, projected, stipulated, governing) + 3-level verification dimension (cited, reasoned, bare) replace bare [grounded]/[open]. Shared reference doc `references/claim-types.md` defines the ontology (DISC-02)
  3. DISCUSSION-LOG.md enhanced as justificatory sidecar: per-claim justification meeting type-specific demands, claim dependency chains, context-checker verification log (DISC-03, DISC-08)
  4. Context-checker agent runs post-discuss, pre-plan: verifies type assignments, surfaces untyped claims, checks citations, traces dependency chains, fixes CONTEXT.md in-place (DISC-04)
  5. Upstream --chain flag merged and CONTEXT.md committed when `commit_docs: true` (DISC-05)
  6. Main exploratory section renamed from "Implementation Decisions" to research-guiding framing (DISC-06)
  7. Research questions use generative format specifying research program, downstream decisions, reversibility (DISC-07)
  8. Researcher agent updated with type-to-action mapping consuming typed claims (DISC-09)
  9. CONTEXT.md includes claim dependency section; decided claims resting on assumed claims flagged as vulnerabilities (DISC-10)
Derived from: `.planning/deliberations/exploratory-discuss-phase-quality-regression.md`, `.planning/deliberations/pipeline-enrichment-step-architecture.md`, `.planning/deliberations/claim-type-ontology.md`
Audit evidence: `.planning/audits/2026-04-09-discuss-phase-exploration-quality/` (7 artifacts), `.planning/audits/2026-04-09-*claim-audit*` (6 exploratory audits, 12 projects, ~85 CONTEXT.md files)
**Plans:** 3 plans

Plans:
- [x] 57.2-01-PLAN.md -- Create claim-types.md reference doc, cherry-pick upstream --chain flag, fix CONTEXT.md commit
- [x] 57.2-02-PLAN.md -- Restructure discuss-phase.md write_context template, update context.md template examples
- [x] 57.2-03-PLAN.md -- DISCUSSION-LOG.md justificatory sidecar, context-checker agent, researcher 7-type update

### Phase 57.3: Audit Workflow Infrastructure (INSERTED)

**⚠️ Retrospective note (added 2026-04-10):** This phase completed its goal as originally scoped, but subsequent audit work revealed that its core design commitments — the flat 8-type taxonomy (`audit-conventions.md` Section 3), the template-based body structure (Section 4), and the type-family ground rule extensions (`audit-ground-rules.md` S1-S2, E1-E3, C1) — did not express the complexities of the auditing situation. Phase 57.4 **radically rethinks** this formalization: the flat taxonomy is restructured into a 3-axis model (subject × orientation × delegation), templates are replaced with an obligations paradigm for non-standard orientations, and frame-reflexivity Rule 5 + I1-I4 investigatory ground rules + three new obligations are added. The meta-rules established by 57.3 (directory conventions, frontmatter meta-schema, rule-copying protocol, core rules 1-4) **survive the rewrite** and are preserved as the base 57.4 builds on. See Phase 57.4 and `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` (open — fed forward) for the reconstruction. `audit-conventions.md` and `audit-ground-rules.md` currently carry supersession banners pending the 57.4 rewrite. This note does not invalidate Phase 57.3 — the phase shipped what it intended to ship, and the limits were only discoverable by actually running audits under the conventions it established.

**Goal:** Audit sessions have proper infrastructure — date-first directories, task specs preserved alongside agent outputs, provenance metadata, epistemic ground rules for audit agents — so that audit findings are traceable, reproducible, and epistemically reliable.
**Depends on:** Phase 57.2 (typed claim vocabulary and provenance format inform audit spec standards)
**Requirements:** AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):
  1. Audit sessions produce date-first directories with task specs alongside agent outputs and provenance metadata
  2. Audit task specs include explicit epistemic ground rules (cite file:line, test disconfirming evidence, distinguish measure from measured)
Derived from: `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` (meta-observation: three audits during deliberation exhibited the epistemic failures being investigated)
**Plans:** 2 plans

Plans:
- [x] 57.3-01-PLAN.md -- Create audit ground rules and conventions reference documents, add AUDIT-03 to REQUIREMENTS.md
- [x] 57.3-02-PLAN.md -- Migrate ~43 existing scattered audit artifacts to new conventions

### Phase 57.1: Explore Skill Adoption (INSERTED)

**Goal:** The `/gsdr:explore` command exists and provides Socratic ideation sessions that route outputs to GSD artifacts (notes, todos, seeds, requirements, phases)
**Depends on:** Nothing (standalone skill adoption, can proceed after any completed phase)
**Requirements:** WF-05a
**Success Criteria** (what must be TRUE):
  1. `/gsdr:explore` command, workflow, and reference files (questioning.md, domain-probes.md) are synced from upstream and installed locally
  2. The skill launches a Socratic conversation, offers mid-session research, and routes crystallized outputs to appropriate artifacts
  3. Existing upstream tests (if any) pass; manual verification of one explore session
**Plans:** 1/1 plans complete
Plans:
- [x] 57.1-01-PLAN.md -- Adopt upstream explore skill files, create vitest test, verify installer

### Phase 57.5: Measurement Architecture & Retroactive Foundation (INSERTED)

**Goal:** A three-layer measurement architecture (raw → extractor registry → interpretation) that retroactively analyzes existing session and artifact corpora, with cross-platform schema from day one and minimum-viable post-Popperian epistemic machinery (competing interpretations, distinguishing features, anomaly register per interpretation). Covers the intervention-lifecycle and pipeline-integrity feedback loops. This phase is the **particular fix** for the Phase 57 vision-drop audit's Finding A (requirements-anchoring trap) and Finding B (research-phase summary reframing).
**Depends on:** Phase 57 (baseline extraction tooling exists to build on), Phase 56 (SQLite foundation for indexed queries)
**Requirements:** MEAS-ARCH-01 through MEAS-ARCH-07, MEAS-ARCH-10, MEAS-RUNTIME-02, MEAS-RUNTIME-03, MEAS-RUNTIME-04, MEAS-RUNTIME-09, MEAS-RUNTIME-10, MEAS-DERIVED-01, MEAS-DERIVED-05, MEAS-DERIVED-06, MEAS-GSDR-01, MEAS-GSDR-02, MEAS-GSDR-04, MEAS-GSDR-05
**Success Criteria** (what must be TRUE):
  1. Three-layer separation (raw / extractor / interpretation) is implemented in code with the extractor registry as the extensibility point — adding an extractor requires writing a pure function and registering it, no core code changes
  2. Extractor registry contains ~10-12 extractors covering the intervention-lifecycle and pipeline-integrity loops across all three subfamilies (MEAS-RUNTIME + MEAS-DERIVED + MEAS-GSDR), with at least one Codex extractor proving the cross-platform architecture works
  3. Retroactive demonstration: all extractors run over the existing session corpus and GSD artifacts (SUMMARY.md, VERIFICATION.md, signal files, git log) without re-collection
  4. CLI query interface returns JSON (agent-consumable) with runtime dimension model and four-class symmetry markers (`exposed` / `derived` / `not_available` / `not_applicable`)
  5. Post-Popperian epistemic machinery v1: interpretations carry competing alternatives, distinguishing features, and anomaly registers; the query layer warns when distinguishing features aren't computed and surfaces anomaly accumulation
  6. Metadata richness: model ID, GSD version, profile (quality/balanced/budget), runtime identity captured per session
  7. kb.db freshness automation fix lands (MEAS-GSDR-05) — workflow call sites either unified through `kb-rebuild-index.sh` or migrated to `gsd-tools.cjs kb rebuild`
Authority: `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` §3-§5 (Design Principles, Architectural Commitments, Phase Breakdown)
Derived from: `.planning/audits/2026-04-10-phase-57-vision-drop-investigation/` (dual-dispatch audit identifying scope-narrowing cascade), `.planning/audits/2026-04-15-measurement-signal-inventory/` (4-lane signal inventory + correction-and-extensions + anomaly-stress-tests E1-E6 + E5.8), `.planning/spikes/009-thinking-summary-as-reasoning-proxy/`, `.planning/spikes/010-parent-session-thinking-summary-proxy/`, signal `sig-2026-04-09-phase57-active-measurement-vision-dropped-at-planning`
**Plans:** 57.5-01 through 57.5-04 completed and verified 2026-04-16 (`57.5-VERIFICATION.md`: passed 6/6 after one registry-parity gap closure)

### Phase 57.6: Multi-Loop Coverage & Human Interface (INSERTED)

**Goal:** Extend extractor coverage to all identified self-improvement loops (agent-performance, signal-quality, cross-session patterns, cross-runtime comparison), add human-readable text-first visualization, and demonstrate actual use of the system to diagnose at least one observed pattern end-to-end.
**Depends on:** Phase 57.5
**Requirements:** MEAS-ARCH-08, MEAS-RUNTIME-01, MEAS-RUNTIME-06, MEAS-RUNTIME-07, MEAS-RUNTIME-08, MEAS-DERIVED-02, MEAS-DERIVED-03, MEAS-DERIVED-04, MEAS-GSDR-03
**Success Criteria** (what must be TRUE):
  1. Extractors shipped for agent-performance, signal-quality, cross-session-patterns, and cross-runtime-comparison loops
  2. Text-first human visualization: markdown tables, ASCII charts, terminal renderer, pre-built common reports per loop
  3. Exploratory query interface (CLI, potentially REPL-style) for humans to investigate patterns interactively
  4. Practical demonstration: the system is applied to diagnose at least one observed pattern, with the diagnosis documented as an interpretation object with competing readings, distinguishing features, and anomaly register
  5. Expanded Codex coverage beyond the single proof-of-concept extractor from 57.5 (compaction extractor is a natural cross-runtime bridge)
  6. Facets (MEAS-DERIVED-02) adopted with mandatory coverage-stratification clause on every aggregate analysis — stratify by session size
Authority: `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` §5 Phase 57.6 scope
**Plans:** 7/7 plans complete and verified 2026-04-17 (`57.6-VERIFICATION.md`: passed 6/6)

Plans:
- [x] 57.6-01-PLAN.md — Layered serves_loop tag edits on 9 existing extractors (close 57.5 residual tech debt)
- [x] 57.6-02-PLAN.md — Stratification helper + canonical skip_reason enum in feature-manifest.json
- [x] 57.6-03-PLAN.md — Source loader extensions (thinking/clear/compaction scans in claude.cjs + codex.cjs)
- [x] 57.6-04-PLAN.md — Runtime + Codex extractors (thinking, marker density, clear invocation, compaction cross-runtime)
- [x] 57.6-05-PLAN.md — Derived + GSDR extractors (facets semantic, write-path provenance, insights mass-rewrite, skip-reason canonical) + automation warn-validation
- [x] 57.6-06-PLAN.md — Text-first report layer (primitives + dispatch + 6 per-loop templates + router)
- [x] 57.6-07-PLAN.md — Two committed diagnostic artifacts (vision-drop + facets coverage asymmetry)

### Phase 57.7: Content Analysis & Epistemic Deepening (INSERTED)

**Goal:** Extend the measurement system to session-content features and deepen the post-Popperian epistemic machinery — automated distinguishing-feature suggestion, intervention-outcome tracking, interpretation revision classification (progressive vs degenerating per Lakatos).
**Depends on:** Phase 57.6
**Requirements:** MEAS-ARCH-09, MEAS-RUNTIME-05, MEAS-RUNTIME-11, MEAS-GSDR-06
**Success Criteria** (what must be TRUE):
  1. Session-content extractors (structural patterns in transcripts — tool invocation sequences, intervention points, topic shifts) with documented privacy/storage model; no raw content re-exposure
  2. Automated distinguishing-feature suggestion: when competing interpretations are presented, the system proposes uncomputed features that would discriminate between them
  3. Intervention-outcome tracking: when an interpretation is acted on (e.g., GATE shipped), record the intervention, predicted outcome, and actual outcome; surface this as the strongest epistemic status available
  4. Interpretation revision classification: track whether revisions to interpretations are progressive (generate new predictions) or degenerating (ad hoc accommodation of anomalies)
  5. Full epistemic provenance on all interpretations (challenge survival count, anomaly register, intervention history, revision classification)
  6. Reasoning-quality measurement operational — candidate mechanism selected from spike C5 (reference-density, concept-diversity, LLM-as-judge, or facets-based) and shipped for the Agent Performance loop
  7. Phantom-thinking-token reconciler operational after spike C3 confirms real tokenizer; FTS5 resolved per MEAS-GSDR-06
Authority: `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` §5 Phase 57.7 scope
**Plans:** 10 plans across 5 waves (serialized to avoid merge conflicts on shared mutable files runtime.cjs + registry.cjs + sources/claude.cjs)
**Wave structure (revised per plan-checker iteration 1):**
- Wave 1 (parallel): Plan 01 (C3 spike), Plan 02 (C5 spike), Plan 03 (FTS5 drop) — independent, no shared mutable files
- Wave 2: Plan 04 — content extractors + defineExtractor content_contract preservation fix; owns runtime.cjs + registry.cjs + sources/claude.cjs edits
- Wave 3 (parallel): Plan 05 (intervention_points depends_on ['04']), Plan 06 (distinguishes audit + PRIVACY.md + interventions/README.md depends_on ['04'])
- Wave 4 (parallel): Plan 07 (interpretation-layer deepening depends_on ['04','05','06']), Plan 08 (reasoning-tokens reconciler depends_on ['01']), Plan 09 (reasoning-quality proxy depends_on ['02'])
- Wave 5: Plan 10 (demonstration artifacts depends_on ['04','05','06','07','08','09'])
Plans:
- [ ] 57.7-01-PLAN.md -- [wave 1] Spike C3: tokenizer availability (Q1) — DESIGN, BUILD, RUN, DECISION incl. production_dependency_decision field
- [ ] 57.7-02-PLAN.md -- [wave 1] Spike C5: reasoning-quality mechanism selection (Q2) — DESIGN, BUILD, RUN, DECISION incl. grader_independence field
- [ ] 57.7-03-PLAN.md -- [wave 1] MEAS-GSDR-06 FTS5 drop (schema migration + regression test)
- [ ] 57.7-04-PLAN.md -- [wave 2] Content extractors: tool_invocation_sequence + topic_shift_markers + defineExtractor content_contract fix
- [ ] 57.7-05-PLAN.md -- [wave 3, depends_on 04] Content extractor: intervention_points with Q3 calibration (live or skip-gated)
- [ ] 57.7-06-PLAN.md -- [wave 3, depends_on 04] Distinguishes-metadata audit + PRIVACY.md + interventions/README.md (preconditions for Plan 07)
- [ ] 57.7-07-PLAN.md -- [wave 4, depends_on 04+05+06] Interpretation-layer deepening: suggester + intervention-outcome loader + revision history + provenance summary
- [ ] 57.7-08-PLAN.md -- [wave 4, depends_on 01] MEAS-RUNTIME-05 phantom-thinking-token reconciler (ship mode per Plan 01 verdict + production_dependency_decision)
- [ ] 57.7-09-PLAN.md -- [wave 4, depends_on 02] MEAS-RUNTIME-11 reasoning-quality proxy (mechanism per Plan 02 verdict; DC-4/G-5 labelling + grader_independence)
- [ ] 57.7-10-PLAN.md -- [wave 5, depends_on 04+05+06+07+08+09] Demonstration artifacts: revised vision-drop diagnostic + GATE-09 pending intervention record + DEMO-REPORT.md

### Phase 58: Structural Enforcement Gates
**Goal**: High-recurrence advisory, closeout, and dispatch-drift failure patterns are replaced with structural enforcement that emits measurable fire-events, applies across the workflows that could bypass it, and declares per-gate Codex behavior instead of assuming blanket degradation. GATE-09 remains the meta-fix for scope-translation loss, but the phase also owns the newly-evidenced closeout seam (state / PR / release / archive drift) surfaced by the 2026-04-20 audits.
**Depends on**: Phase 57.7 (measurement substrate for gate fire-events), Phase 57.8 (role-aware provenance for GATE-09 attribution), Phase 57.9 (hook / closeout substrate for GATE-06 and GATE-07)
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04a, GATE-04b, GATE-04c, GATE-05, GATE-06, GATE-07, GATE-08a, GATE-08b, GATE-08c, GATE-08d, GATE-08e, GATE-09a, GATE-09b, GATE-09c, GATE-09d, GATE-10, GATE-11, GATE-12, GATE-13, GATE-14, GATE-15, XRT-01
**Success Criteria** (what must be TRUE):
  1. Every GATE declares its substrate and per-gate Codex behavior, and every shipped gate emits a measurable fire-event or explicit waiver marker that downstream measurement can count
  2. Phase advancement blocks until PR / CI gates pass, `gh pr merge` surfaces use `--merge` structurally, quick tasks detect runtime-facing changes with an explicit rule, and direct pushes / CI bypass paths are structurally blocked
  3. `.continue-here` lifecycle and hard-stop severity gates ship as separate structural behaviors: consumed-on-read archival, stale-file hard stop, and blocking/advisory anti-pattern checks with mandatory understanding for blocking items
  4. Automation postlude and incident self-signal prompts fire structurally from installed hook / closeout substrate rather than agent discretion
  5. Discuss-phase richer mode adoption lands as a multi-surface closeout: current-state verification, assumptions-analyzer agent, discuss-mode docs, downstream mode-aware gates, and explicit upstream-narrowing rationale where applicable
  6. GATE-09 ships as a real ledger contract: named artifact/schema, planning gate for unresolved scope-boundary questions, narrowing-decision provenance, and verifier enforcement against silent disappearance
  7. Phase closeout is structural: planning-authority files reconcile, failed/interrupted agent output is archived, release-boundary lag is surfaced, and source-vs-installed mirrors are checked after runtime-facing changes
  8. Every hook-dependent v1.20 feature specifies its per-runtime substrate and Codex degradation / waiver path in phase CONTEXT.md before implementation begins, and capability-matrix.md is updated when the feature ships
**Plans:** 21 plans

Plans:
- [x] 58-01-PLAN.md — GATE-02 enumeration + fix `complete-milestone.md` squash default + STATE.md AT-6 reconcile
- [x] 58-02-PLAN.md — GATE-05 named-site enumeration + GATE-13 dispatch-contract design
- [x] 58-03-PLAN.md — GATE-08a upstream fetch/delta + port `gsdr-assumptions-analyzer` agent
- [x] 58-04-PLAN.md — GATE-09a ledger schema in `frontmatter.cjs` + `ledger_entries` KB migration
- [x] 58-05-PLAN.md — Per-gate Codex behavior matrix (AT-3 compliance)
- [x] 58-06-PLAN.md — GATE-01 / GATE-14 CI emission + branch-protection flip (human action required)
- [x] 58-07-PLAN.md — GATE-02 / GATE-13 CI grep jobs + bootstrap allowlist
- [x] 58-08-PLAN.md — GATE-03 quick-classify CLI + workflow gate + CI post-commit backstop
- [x] 58-09-PLAN.md — GATE-15 source/install parity CI check
- [x] 58-10-PLAN.md — GATE-04a/b/c `.continue-here` archive + staleness + severity framework
- [x] 58-11-PLAN.md — GATE-08a-e discuss-phase-assumptions port + analyzer wiring + mode docs
- [x] 58-12-PLAN.md — GATE-05 / GATE-13 workflow edits at 10 core workflow files + partial allowlist retirement
- [x] 58-12a-PLAN.md — GATE-05 / GATE-13 workflow edits at remaining 6 files (commands + map-codebase + new-project + new-milestone + validate-phase) + full allowlist retirement
- [x] 58-13-PLAN.md — GATE-10 `gsd-tools phase reconcile` subcommand + wiring
- [x] 58-14-PLAN.md — GATE-12 `gsd-tools agent archive` + envelope in dispatch workflows
- [x] 58-15-PLAN.md — GATE-11 `gsd-tools release check` + release-lag template
- [x] 58-16-PLAN.md — GATE-06 / GATE-07 defer-provenance (AT-1 Option B, 57.9 prerequisite)
- [x] 58-17-PLAN.md — GATE-09b/c/d + meta-gate (GATE-09e) verifier contract
- [x] 58-18-PLAN.md — XRT-01 planning-phase assertion + capability-matrix closeout diff
- [x] 58-19-PLAN.md — `gate_fire_events` extractor registration
- [x] 58-20-PLAN.md — Phase 58 `58-LEDGER.md` (reflexive GATE-09) + ROADMAP update

### Phase 58.1: Codex Update Distribution Parity (INSERTED)

**Goal:** Codex update surfaces stop hiding stale installs: installed-version detection enumerates project-local and active global Codex scopes correctly, update execution targets the intended runtime/config-dir/scope, and shared update indicators no longer assume Claude-only layout.
**Requirements**: Runtime-parity narrow fix derived from the v1.20 cross-runtime distribution gap target in PROJECT.md (no separate REQUIREMENTS row; phase governed by the inserted ROADMAP goal and its approved PLAN artifacts)
**Depends on:** Phase 58
**Success Criteria** (what must be TRUE):
  1. `gsdr-update` on Codex can distinguish project-local and active global Codex installs, and a repo-local `.codex` mirror in the source repo cannot mask a stale global install
  2. The selected update command includes runtime-correct targeting (`--codex` plus correct local/global/config-dir scope) instead of reusing Claude-oriented defaults
  3. Any update-indicator cache or command surface touched by the phase is aligned with Codex/runtime-aware semantics rather than a hard-coded `.claude` path
  4. Targeted regression tests cover divergent local/global Codex versions and runtime-correct update routing
**Plans:** 2 plans

Plans:
- [x] 58.1-01-PLAN.md — Shared Codex update-target resolver seam, installer helper reuse, and unit regressions
- [x] 58.1-02-PLAN.md — Runtime-aware update workflow wiring, published-package execution, and Codex integration regressions

### Phase 59: KB Query, Lifecycle Wiring & Surfacing
**Goal**: The knowledge base is fully queryable on the current file+SQLite architecture, lifecycle transitions are automated with an explicit path relative to the existing bash fallback, and agent surfacing stops being one-way by exposing inbound edge context. The phase stays focused on query/lifecycle/surfacing on the current schema, while explicitly naming the deeper edge-as-entity and retrieval-feedback architecture as downstream work instead of silently omitting it.
**Depends on**: Phase 56 (SQLite index must exist)
**Requirements**: KB-04b, KB-04c, KB-04d, KB-06a, KB-06b, KB-07, KB-08
**Success Criteria** (what must be TRUE):
  1. `gsd-tools kb search` and `gsd-tools kb query` operate on the current live corpus (267 signals as of 2026-04-20, re-verified against the live count at implementation time), and `kb rebuild` reports edge-integrity counts by link type plus malformed/orphaned targets
  2. KB link verbs are disambiguated into read vs write surfaces, and read surfaces expose both inbound and outbound traversal so newer related signals can be seen from older immutable entries
  3. `gsd-tools kb transition` updates both the .md frontmatter AND the SQLite row atomically (dual-write invariant per KB-05), and mutating edge operations do not hide behind a read-only verb
  4. When a plan with `resolves_signals` completes, collect-signals auto-transitions matching signals to remediated state, and the phase explicitly states whether this replaces, complements, or deprecates `reconcile-signal-lifecycle.sh`
  5. `kb health` has a concrete contract: edge integrity, lifecycle-vs-plan consistency, dual-write verification, and `depends_on` freshness summary
  6. Research and planning agents use SQLite queries for relevant signal/spike/reflection retrieval, with graceful fallback to grep when `kb.db` does not exist, and the surfacing protocol no longer depends on the deprecated lesson-only path
  7. Phase 59 records explicit downstream deferrals for the deeper KB architecture (`KB-12` through `KB-17`) so edge-as-entity, retrieval attribution, artifact indexing, federation, vocabulary extension, and contested-state support do not disappear by omission
**Plans**: 5 plans

Plans:
- [x] 59-01-PLAN.md — Wave 1: extractLinks uniform guard + idx_signal_links_target + FTS5 external-content rewrite + edge-integrity report + kb repair --malformed-targets + live-corpus regression
- [x] 59-02-PLAN.md — Wave 2: kb query + kb search (FTS5 MATCH) + kb link show --outbound/--inbound/--both (read surface, grep fallback on fresh clone)
- [x] 59-03-PLAN.md — Wave 2: kb health four-check contract (edge integrity + lifecycle-vs-plan + dual-write + depends_on freshness), exit-code bitmask
- [x] 59-04-PLAN.md — Wave 3: kb transition + kb link create/delete (BEGIN IMMEDIATE dual-write) + collect-signals auto-transition + reconcile-signal-lifecycle.sh deprecation with one-cycle sunset and Linux guard
- [x] 59-05-PLAN.md — Wave 4: knowledge-surfacing.md SQLite-first rewrite + KB-12..KB-17 deferrals ledger (59-DEFERRALS.md) + cross-runtime parity integration test + phase-level must_haves aggregation
**Deferred Children To Name In Phase 59 CONTEXT/PLAN**: KB-12, KB-13, KB-14, KB-15, KB-16, KB-17

### Phase 59.1: Drop Gemini and OpenCode from installer scope (INSERTED)

**Goal:** [Urgent work - to be planned]
**Requirements**: TBD
**Depends on:** Phase 59
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 59.1 to break down)

### Phase 60: Sensor Pipeline & Codex Parity
**Goal**: Log sensor and patch sensor are operational across Claude Code and Codex CLI, with automated parity verification after installation
**Depends on**: Phase 58 (structural gates provide enforcement context for sensors)
**Requirements**: SENS-01, SENS-02, SENS-03, SENS-04, SENS-05, SENS-06, SENS-07, XRT-02
**Success Criteria** (what must be TRUE):
  1. Log sensor integrates into collect-signals with progressive deepening (structural fingerprinting, intelligent triage, selective context expansion, signal construction) and reports parse failures as warnings rather than crashing
  2. Log sensor cross-runtime adapter normalizes Claude Code JSONL and Codex JSONL to a common fingerprint schema, with Codex session discovery using state_5.sqlite
  3. Patch sensor detects source-vs-installed file divergence using installer manifest SHA256, classifies divergences (bug/stale/customization/format-drift/feature-gap), and produces a developer-facing report
  4. Post-install cross-runtime parity verification runs automatically after `node bin/install.js`, comparing installed files across detected runtimes
  5. Patch compatibility checking validates patches against target runtime before cross-runtime application
**Plans**: TBD
**Note**: Can proceed in parallel with Phase 61 after Phase 58 completes -- independent workstreams with no shared dependencies

### Phase 60.1: Telemetry-Signal Integration & E2E Chain Tests (INSERTED)

**Goal:** The measurement telemetry substrate (Phases 57.5–57.7) becomes load-bearing for the signal system, reflection, and workflow attribution — not just a sidecar that exposes identity fields nobody consumes. This phase is the **wide companion** to Phase 57.8's narrow provenance fix: sensors stop self-stamping identity and read it from the canonical measurement extractors; reflection stratifies aggregates by `model × profile × reasoning_effort`; the intervention-outcome loop from Phase 57.7 Plan 07 extends to signal lifecycle transitions with predicted/actual outcomes; the full discuss→plan→execute→verify→collect-signals chain gains automated E2E coverage with live agents; and manual `/gsdr:signal` parity is treated as an explicit downstream provenance surface rather than assumed collateral. Where the integration surface exceeds what was explicit in the audit, PROV-09 investigates first and produces child requirements under the GOV-01 extraction contract.
**Depends on:** Phase 60 (sensor pipeline must exist before sensors can be rewired; cross-runtime Codex adapter provides the substrate for PROV-14 parity). Phase 57.8 is a logical prerequisite for Stage-1 research (PROV-09 surveys integration around the role-split schema, not the legacy flat one)
**Requirements:** GOV-01 (governance — extraction contract applies), PROV-09 (research-gated, requirement-producing), PROV-10, PROV-11, PROV-12, PROV-13, PROV-14, plus Stage-2 children produced by PROV-09
**Success Criteria** (what must be TRUE):
  1. PROV-09 closes under GOV-01 — `.planning/research/provenance-integration-surface.md` exists AND every viable integration point, including manual `/gsdr:signal` and install-generated command / skill surfaces when they materially transform provenance behavior, has become either a declarative child requirement (`PROV-09.1`, `PROV-09.2`, ...) or is explicitly deferred to v1.21 with a named reason. Document existence alone does not satisfy
  2. Log sensor and artifact sensor consume `buildSessionIdentityValue()` and the Codex equivalent from `measurement/extractors/` rather than self-stamping; provenance derives from live telemetry where exposed, orchestration-time signing where logs are silent (PROV-10)
  3. Reflection (`gsdr-reflector` + `reflect` workflow) stratifies signal aggregates by `model × profile × reasoning_effort` via `measurement/stratify.cjs`; agent-performance signal counts attribute by role × model × profile (PROV-11)
  4. Intervention-outcome schema carries `predicted_outcome` alongside `outcome_status`; signal lifecycle transitions (`triaged → remediated → verified`) join as measured interventions; `phase_57_5_live_registry_query` report surface shows a non-zero `grounded_in_*_interventions` count when at least one signal-lifecycle intervention has a confirmed outcome (PROV-12)
  5. `tests/e2e/real-agent.test.js` `it.todo()` stubs replaced with working chain tests; opt-in via `RUN_REAL_AGENT_TESTS=true`; CI runs on release tags; coverage asserts role-split provenance, signature-block persistence, cross-runtime parity, and explicit downstream regression coverage for manual `/gsdr:signal` parity so the manual path cannot drift while `collect-signals` stays green (PROV-13)
  6. Cross-runtime provenance parity — `measurement report cross_runtime_comparison` surfaces role-split provenance from both Claude and Codex chains; asymmetries marked explicitly via MEAS-ARCH-04 four-class symmetry markers, not coincidentally-aligned values masquerading as parity (PROV-14)
  7. Every Stage-2 child requirement produced by PROV-09 is either shipped or explicitly deferred; GOV-01 extraction contract closed
Authority: `.planning/audits/2026-04-16-signal-provenance-audit/signal-provenance-audit-output.md` Finding 4 + Recommendation 3. Stage-1 research (PROV-09) authoritatively widens scope beyond the audit's explicit enumeration per GOV-01.
Derived from: the signal-provenance audit surfaced telemetry-as-latent-source but did not enumerate the full integration surface; PROV-09 closes that gap before declarative commitments lock. Split from Phase 57.8 because the wider integration depends on the sensor pipeline existing (Phase 60).
**Plans:** 0/TBD (run `/gsdr:discuss-phase 60.1` after Phase 60 ships)

### Phase 61: Spike Methodology Overhaul
**Goal**: Spike experimental design is epistemologically rigorous -- designs are reviewed cross-model before execution, confidence is multi-dimensional, and findings are verified against evidence
**Depends on**: Phase 58 (structural enforcement patterns inform reviewer agent design)
**Requirements**: SPIKE-01, SPIKE-02, SPIKE-03, SPIKE-04, SPIKE-05, SPIKE-06, SPIKE-07, SPIKE-08, SPIKE-09, SPIKE-12
**Success Criteria** (what must be TRUE):
  1. Spike design reviewer agent (cross-model, different model from designer) evaluates experimental design before execution and produces CRITIQUE.md, not a pass/fail verdict
  2. DECISION.md supports decided/provisional/deferred outcome types with three-level confidence (measurement validity, interpretation validity, extrapolation validity)
  3. DESIGN.md includes auxiliary hypothesis register (Duhem-Quine), metric limitation documentation, and sample design section with representativeness argument
  4. Cross-spike qualification mechanism appends qualification notes when spike N qualifies or invalidates spike M, with KB qualified_by links
  5. After 3 spikes complete under new methodology, an evaluation assesses whether premature closure decreased and DECISION.md quality improved -- if formalization shows compliance theater, simplify
**Plans**: TBD
**Note**: Can proceed in parallel with Phase 60 after Phase 58 completes -- independent workstreams with no shared dependencies. SPIKE-08 (protocol adherence checkpoints) is gated on SPIKE-01 completion; auto-defers to v1.21 if SPIKE-01 ships late in this phase

### Phase 62: Workflow Commands
**Goal**: Four workflow gaps identified by audit and deliberation are closed with commands that integrate into existing GSD patterns. (WF-01 cross-model delegation was pulled forward to Phase 57.4 per `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` — cross-model dispatch is now an `audit_delegation` mode on `/gsdr:audit` rather than a standalone `/gsdr:cross-model-review` command. The WF-01 requirement text in REQUIREMENTS.md may need revision to reflect this absorption.)
**Depends on**: Phase 59 (KB query layer enables structured retrieval in research and explore commands)
**Requirements**: WF-02, WF-03, WF-04, WF-05b (WF-01 pulled forward to Phase 57.4)
**Success Criteria** (what must be TRUE):
  1. `/gsdr:revise-phase-scope` performs mid-phase scope changes with ROADMAP.md and REQUIREMENTS.md update, commit, and re-discuss
  2. `/gsdr:research` produces committed knowledge artifacts in `.planning/research/` with source citations, per-finding confidence levels, and stated limitations -- no code changes or spike overhead
  3. `/gsdr:discuss-milestone` produces MILESTONE-CONTEXT.md with structured steering brief (working assumptions, open questions, epistemic guardrails, derived constraints, deferred ideas)
  4. `/gsdr:explore` enhanced with GSDR-specific questioning.md (epistemic practice probes, assumption-surfacing), signal-aware exploration (KB queries during sessions), and "no artifact" as valid outcome
**Plans**: TBD

### Phase 63: Spike Programme Infrastructure
**Goal**: Multi-spike research programmes have proper infrastructure -- shared assets, cross-spike tracking, and Lakatosian progressiveness assessment
**Depends on**: Phase 61 (spike methodology must be operational)
**Requirements**: SPIKE-10a, SPIKE-10b, SPIKE-10c
**Success Criteria** (what must be TRUE):
  1. Spike programmes have a directory structure with programme ROADMAP.md, shared data asset references, and programme-level metadata
  2. Cross-spike tracking within programmes supports qualification links and progressive refinement without the 2-round per-spike limit applying at programme level
  3. Programme lifecycle includes progressiveness assessment (Lakatosian ledger: is this programme progressive or degenerating?) and programme-level DECISION.md for overall conclusions
**Plans**: TBD

### Phase 64: Parallel Execution (Separately Gated)
**Goal**: Non-overlapping phases can execute in parallel on separate worktrees without STATE.md merge conflicts
**Depends on**: Phase 59 (state management infrastructure must be stable)
**Requirements**: PAR-01, PAR-02, PAR-03
**Success Criteria** (what must be TRUE):
  1. Per-worktree state files (`.planning/state/{worktree-name}.json`) eliminate STATE.md merge conflicts, with upstream's orchestrator-owns-writes pattern adopted for intra-phase parallelism
  2. `gsd-tools state` provides a composite view across worktree state files showing aggregated progress and per-worktree status
  3. Phases with non-overlapping file scopes can execute in parallel on separate worktrees, with overlapping file scope detected and blocked before parallel dispatch
**Plans**: TBD
**Note**: Separately gated -- only triggered when parallel phase execution becomes a regular workflow pattern. Not automatically scheduled after Phase 63

## Progress

**Execution Order:**
Phases execute sequentially 55 through 55.2, then 57.1 → 57.2 → 57.3 → 57.4 (patch releases), then 57 → 57.5 → 57.6 → 57.7 → 57.8 → 58-59, then 60 and 61 can proceed in parallel, 60.1 after 60, then 62 through 64 sequentially. Phase 64 is separately gated. Phase 57.1 can proceed after any completed phase (no blocking dependencies). Phase 57.2 ships before Phase 57 as a patch (regression fix); effectiveness revisited post-telemetry. Phase 57.3 depends on Phase 57.2. Phase 57.4 depends on Phase 57.3. Phases 57.5/57.6/57.7 build the measurement infrastructure that Phase 58 (particularly GATE-09) depends on for evaluating gate effectiveness. Phase 57.8 narrows the signal provenance fix pre-58 so GATE-09 has role-aware attribution; Phase 60.1 widens telemetry→signal integration post-60 once the sensor pipeline exists as substrate.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 55. Upstream Mini-Sync | 4/4 | Complete | 2026-04-08 |
| 55.1. Upstream Bug Patches | 2/2 | Complete | 2026-04-09 |
| 55.2. Codex Runtime Substrate | 3/3 | Complete | 2026-04-09 |
| 56. KB Schema & SQLite Foundation | 3/3 | Complete | 2026-04-08 |
| 57. Measurement & Telemetry Baseline | 2/2 | Complete | 2026-04-09 |
| 57.1. Explore Skill Adoption | 1/1 | Complete   | 2026-04-09 |
| 57.2. Discuss-Phase Exploratory Mode Overhaul | 3/3 | Complete | 2026-04-09 |
| 57.3. Audit Workflow Infrastructure | 2/2 | Complete | 2026-04-09 |
| 57.4. Audit Skill & Investigatory Type | 6/6 | Complete | 2026-04-10 |
| 57.5. Measurement Architecture & Retroactive Foundation | 0/TBD | Not started | - |
| 57.6. Multi-Loop Coverage & Human Interface | 0/TBD | Not started | - |
| 57.7. Content Analysis & Epistemic Deepening | 0/TBD | Not started | - |
| 57.8. Signal Provenance Split & Artifact Signature Blocks | 0/TBD | Not started | - |
| 58. Structural Enforcement Gates | 0/TBD | Not started | - |
| 59. KB Query, Lifecycle Wiring & Surfacing | 0/TBD | Not started | - |
| 60. Sensor Pipeline & Codex Parity | 0/TBD | Not started | - |
| 60.1. Telemetry-Signal Integration & E2E Chain Tests | 0/TBD | Not started | - |
| 61. Spike Methodology Overhaul | 0/TBD | Not started | - |
| 62. Workflow Commands | 0/TBD | Not started | - |
| 63. Spike Programme Infrastructure | 0/TBD | Not started | - |
| 64. Parallel Execution | 0/TBD | Not started | - |

## Overall Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.12 GSD Reflect | 0-6 | 25 | Complete | 2026-02-09 |
| v1.13 Upstream Sync | 7-12 | 18 | Complete | 2026-02-11 |
| v1.14 Multi-Runtime | 13-21 | 18 | Complete | 2026-02-16 |
| v1.15 Backlog & Update | 22-30 | 24 | Complete | 2026-02-23 |
| v1.16 Signal Lifecycle | 31-35 | 20 | Complete | 2026-03-02 |
| v1.17 Automation Loop | 36-44 | 24 | Complete | 2026-03-09 |
| v1.18 Upstream Sync & Deep Integration | 45-54 + 48.1 | 37 | Complete | 2026-03-30 |
| v1.20 Signal Infrastructure & Epistemic Rigor | 55-64 + 55.1, 55.2, 57.1-57.8, 60.1 | TBD | In progress | - |

**Totals:** 8 milestones, 72 phases (58 complete, 14 in progress), 179 plans completed

## Backlog

### Phase 999.1: Pipeline Enrichment Step Between Discuss and Plan (BACKLOG)

**Goal:** Fork-specific pipeline stage between discuss-phase and plan-phase that produces EXPLORATION.md with epistemic challenges, working assumptions, and investigation mandates for the researcher/planner. Separates fork epistemic work from upstream discuss-phase workflow.
**Trigger:** Post-telemetry evaluation — quality regression deliberation P4 tests whether discuss-phase modification alone achieves Phase-52-level quality. If not, this becomes urgent.
**Derived from:** `.planning/deliberations/pipeline-enrichment-step-architecture.md` (concluded), `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` (concluded)
**Connected to:** epistemic-health Prescription 2 (adversarial deliberation), plan-phase "Decisions = LOCKED" contract rethink, adaptive harness design (complexity-responsive exploration depth)
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
