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

**Phases:** 19 (Phases 55-64 + 55.1, 55.2, 57.1, 57.2, 57.3, 57.4, 57.5, 57.6, 57.7)
**Granularity:** Fine
**Requirements:** 105 mapped

## Phases

- [x] **Phase 55: Upstream Mini-Sync** - Integrate upstream correctness fixes (state locking, milestone safety, frontmatter, installer) before any v1.20 work begins
- [x] **Phase 56: KB Schema & SQLite Foundation** - Signal schema evolution and SQLite index creation establish the queryable knowledge base substrate
- [x] **Phase 57: Measurement & Telemetry Baseline** - Telemetry extraction tooling and baseline capture before any structural interventions ship
- [x] **Phase 57.1: Explore Skill Adoption** - Quick adopt upstream /gsd:explore as /gsdr:explore with minimal GSDR branding (completed 2026-04-09)
- [x] **Phase 57.2: Discuss-Phase Exploratory Mode Overhaul** - Typed claims (7 types + verification dimension), context-checker agent, DISCUSSION-LOG.md as justificatory sidecar, researcher update, claim dependency webs, template enrichment
- [x] **Phase 57.3: Audit Workflow Infrastructure** - Formalize audit conventions: date-first directories, task spec preservation, epistemic ground rules for audit agents *(core design commitments — flat 8-type taxonomy, template-based body structure, type-family ground rules — partially superseded by Phase 57.4 after running real audits revealed the flat taxonomy did not express the complexities of the auditing situation; see Phase 57.4 for the 3-axis reconstruction)*
- [x] **Phase 57.4: Audit Skill & Investigatory Type** - Radically rethink the formalization of the auditing workflow: the Phase 57.3 flat 8-type taxonomy + template paradigm + ground rules 1-4 do not express the complexities of the auditing situation. This phase supersedes Phase 57.3's core design commitments with a 3-axis taxonomy (subject × orientation × delegation), an obligations-based output paradigm governed by a hermeneutic composition principle, frame-reflexivity Rule 5, I1-I4 investigatory ground rules, and three new obligations from retrospective analysis (chain integrity, dispatch hygiene, framework invisibility). Deliverables: /gsdr:audit command + gsdr-auditor agent, rewritten audit-conventions.md and audit-ground-rules.md, formalized cross-model delegation (WF-01 pulled forward from Phase 62)
- [x] **Phase 57.5: Measurement Architecture & Retroactive Foundation** - Three-layer measurement architecture (raw → extractor registry → interpretation) that retroactively analyzes existing session and artifact corpora, with cross-platform schema from day one and minimum-viable post-Popperian epistemic machinery (competing interpretations, distinguishing features, anomaly register per interpretation). Covers intervention-lifecycle and pipeline-integrity loops; proves cross-platform with at least one Codex extractor (completed 2026-04-16)
- [ ] **Phase 57.6: Multi-Loop Coverage & Human Interface** - Extend extractor coverage to all remaining self-improvement loops (agent-performance, signal-quality, cross-session patterns, cross-runtime comparison), add human-readable text-first visualization, and demonstrate actual use of the system to diagnose an observed pattern end-to-end
- [ ] **Phase 57.7: Content Analysis & Epistemic Deepening** - Session-content extractors (structural patterns in transcripts with documented privacy model), automated distinguishing-feature suggestion, intervention-outcome tracking, interpretation revision classification (progressive vs degenerating per Lakatos), full epistemic provenance on all interpretations
- [ ] **Phase 58: Structural Enforcement Gates** - Replace advisory workflow controls with structural enforcement for the 8 most-recurred failure patterns, plus GATE-09 scope-translation ledger (meta-fix for Phase 57 scope-narrowing cascade)
- [ ] **Phase 59: KB Query, Lifecycle Wiring & Surfacing** - Full-text search, relationship traversal, lifecycle automation, and agent-accessible KB queries
- [ ] **Phase 60: Sensor Pipeline & Codex Parity** - Log sensor, patch sensor, and cross-runtime parity verification (can proceed in parallel with Phase 61)
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
**Plans:** 7 plans

Plans:
- [ ] 57.6-01-PLAN.md — Layered serves_loop tag edits on 9 existing extractors (close 57.5 residual tech debt)
- [ ] 57.6-02-PLAN.md — Stratification helper + canonical skip_reason enum in feature-manifest.json
- [ ] 57.6-03-PLAN.md — Source loader extensions (thinking/clear/compaction scans in claude.cjs + codex.cjs)
- [ ] 57.6-04-PLAN.md — Runtime + Codex extractors (thinking, marker density, clear invocation, compaction cross-runtime)
- [ ] 57.6-05-PLAN.md — Derived + GSDR extractors (facets semantic, write-path provenance, insights mass-rewrite, skip-reason canonical) + automation warn-validation
- [ ] 57.6-06-PLAN.md — Text-first report layer (primitives + dispatch + 6 per-loop templates + router)
- [ ] 57.6-07-PLAN.md — Two committed diagnostic artifacts (vision-drop + facets coverage asymmetry)

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
**Plans:** TBD (requires /gsdr:discuss-phase 57.7)

### Phase 58: Structural Enforcement Gates
**Goal**: The 8 most-recurred advisory failure patterns are replaced with structural enforcement that cannot be circumvented by agent discretion, plus GATE-09 scope-translation ledger as the meta-fix for the Phase 57 scope-narrowing cascade
**Depends on**: Phase 57.7 (measurement substrate needed for evaluating gate effectiveness; GATE-09 coordinates with measurement system to surface CONTEXT-claim deferrals)
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, GATE-08, GATE-09, XRT-01
**Success Criteria** (what must be TRUE):
  1. Phase advancement via offer_next blocks until PR is created and CI passes -- user can override with documented justification logged to session
  2. `gh pr merge` invocations pass `--merge` explicitly as the structural default, and quick task detects runtime code changes requiring branch+PR flow
  3. `.continue-here` files are consumed on read and archived after session start, with staleness checks and upstream-adopted hard stop safety gates
  4. Automation postlude fires structurally (SessionStop hook on Claude Code, workflow-enforced step on Codex) rather than by agent discretion
  5. Every hook-dependent v1.20 feature specifies its Codex CLI degradation path in phase CONTEXT.md before implementation begins, and capability-matrix.md is updated
  6. GATE-09 scope-translation ledger enforces that every load-bearing CONTEXT claim is mapped at phase close (implemented / explicitly deferred / rejected / left-open-blocking-planning); RESEARCH and PLAN scope narrowing relative to CONTEXT is cited with the originating claim and recorded as a decision; verification confirms CONTEXT commitments were explicitly deferred rather than silently disappearing
**Plans**: TBD

### Phase 59: KB Query, Lifecycle Wiring & Surfacing
**Goal**: The knowledge base is fully queryable, signal lifecycle transitions are automated, and research/planning agents use structured queries instead of grep
**Depends on**: Phase 56 (SQLite index must exist)
**Requirements**: KB-04b, KB-04c, KB-06a, KB-06b, KB-07, KB-08
**Success Criteria** (what must be TRUE):
  1. `gsd-tools kb search` performs FTS5 full-text search across signal content, and `gsd-tools kb query` filters by lifecycle state and other structured fields
  2. `gsd-tools kb link` traverses qualified_by/superseded_by relationships between signals and spikes
  3. `gsd-tools kb transition` updates both the .md frontmatter AND the SQLite row atomically (dual-write invariant per KB-05)
  4. When a plan with `resolves_signals` completes, collect-signals auto-transitions matching signals to remediated state
  5. Research and planning agents use SQLite queries for KB retrieval, with graceful fallback to grep when kb.db does not exist
**Plans**: TBD

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
Phases execute sequentially 55 through 55.2, then 57.1 → 57.2 → 57.3 → 57.4 (patch releases), then 57 → 57.5 → 57.6 → 57.7 → 58-59, then 60 and 61 can proceed in parallel, then 62 through 64 sequentially. Phase 64 is separately gated. Phase 57.1 can proceed after any completed phase (no blocking dependencies). Phase 57.2 ships before Phase 57 as a patch (regression fix); effectiveness revisited post-telemetry. Phase 57.3 depends on Phase 57.2. Phase 57.4 depends on Phase 57.3. Phases 57.5/57.6/57.7 build the measurement infrastructure that Phase 58 (particularly GATE-09) depends on for evaluating gate effectiveness.

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
| 58. Structural Enforcement Gates | 0/TBD | Not started | - |
| 59. KB Query, Lifecycle Wiring & Surfacing | 0/TBD | Not started | - |
| 60. Sensor Pipeline & Codex Parity | 0/TBD | Not started | - |
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
| v1.20 Signal Infrastructure & Epistemic Rigor | 55-64 + 55.1, 55.2, 57.1-57.7 | TBD | In progress | - |

**Totals:** 8 milestones, 70 phases (58 complete, 12 in progress), 179 plans completed

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
