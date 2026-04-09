---
date: 2026-04-02
audit_type: adoption_compliance
scope: "GSD Reflect adoption patterns across 6+ projects"
triggered_by: "manual: pre-milestone audit sweep"
ground_rules: none
migrated_from: .planning/cross-project-gsdr-adoption-audit-2026-04-02.md
migrated_date: 2026-04-10
tags: [adoption, cross-project, gsdr, v1.18]
---
# Cross-Project GSDR Adoption Audit (2026-04-02)

## Deviation Testimony

This artifact has no formal workflow home. It is not a signal (too analytical, too long), not a deliberation (it reports rather than deliberates), not a phase artifact (it spans the entire project ecosystem), not research (it examines internal state rather than external unknowns). It is an **audit synthesis** — a cross-cutting analysis of how GSDR is being used across projects on this machine (dionysus).

**Why it exists:** During pre-v1.19 deliberation (session 2, 2026-04-02), the user proposed that before formalizing new sensors or workflows, we should first perform the task informally — send agents to do what a sensor would do, see what returns, and treat the results as a proof-of-concept. Four exploration agents were dispatched in parallel to audit zlibrary-mcp, arxiv-sanity-mcp, f1-modeling, and epistemic-agency. Additional manual examination covered dionysus-research-platform and pdfagentialconversion signals.

**Why it's in `.planning/` root:** No formal directory exists for cross-project audit syntheses. The `.planning/` root already contains 5 other audit reports from the previous session (signal-audit, apollo-kb-audit, deliberation-usage-audit, philosophical-audit, FORK-DIVERGENCE-AUDIT) — all equally homeless. This pattern is itself evidence for Thread 21 (orphaned artifacts and deviation accountability). The rogue-files probe (HEALTH-10) will flag this file; the rogue-context probe (HEALTH-11) should now be able to read this testimony rather than merely classifying the file as "workflow-gap."

**What workflow was searched and not found:** There is no GSDR command for cross-project auditing. The closest workflows are `/gsdr:health-check` (single-project), `/gsdr:reflect` (single-project signal analysis), and `/gsdr:audit-milestone` (milestone-scoped). None operate across the project ecosystem. Thread 4 (sensor gaps) proposes a cross-project signal propagation sensor; this audit is a manual prototype of what such a sensor might eventually automate.

**What this artifact is meant to serve:** (1) Concrete evidence grounding several pre-v1.19 threads. (2) Proof-of-concept that cross-project auditing yields actionable insights. (3) A trace that future sessions can read for cross-project state as of this date.

---

## Position of Critique

### Assumptions We Bring

This audit examines GSDR adoption from within GSDR's own framework. That situatedness must be made explicit, because it shapes what we can see and what we might miss.

**Assumption 1: Signal lifecycle progression is desirable.**
We treat the fact that 63 signals across 6 projects remain in "detected" state as a *problem*. But this assumes that lifecycle progression (detected → triaged → remediated → verified) is the right shape for all signals. The epistemic-agency project suggests otherwise: its signals function as *live diagnostic instruments* driving ongoing deliberation work, not items to be resolved and closed. Marking them "remediated" might be premature closure. The zlibrary-mcp signals, by contrast, are more clearly the sort that should progress — many document specific bugs that were fixed. The lifecycle model may need to accommodate both patterns rather than treating one as failure.

**Assumption 2: Deliberation evaluation is valuable.**
We note that 0 out of 15+ concluded deliberations have been evaluated (predictions checked against outcomes). We treat this as a gap. But evaluation requires that the predictions were falsifiable in the first place, that enough time has passed for outcomes to manifest, and that the evaluation would actually change future behavior. For f1-modeling (Phase 2 of 8), it's too early to evaluate most predictions. For zlibrary-mcp (v1.2 shipped), it's the right time. The gap is real but not uniform.

**Assumption 3: The GSDR workflow structure is the right frame for all projects.**
We measure adoption against GSDR's expected patterns (phases with PLAN/SUMMARY, sensors producing signals, deliberations following the template). But the epistemic-agency project demonstrates that research work may need a fundamentally different artifact structure (traces instead of phases, findings instead of signals). The project adapted GSDR rather than conforming to it — and this adaptation produced some of the deepest insights in the ecosystem (Trace 008's cybernetic synthesis, the proletarianization gradient diagnosis). Judging this as "non-standard adoption" would miss the point.

**Assumption 4: Cross-project signal reading would be beneficial.**
We assert that the model-profiles-prefix-mismatch signal appearing in multiple projects without cross-referencing is a problem. But cross-project signal propagation introduces its own risks: noise amplification, false pattern detection, privacy concerns if projects have different stakeholders. The benefit case is strong for a single-developer ecosystem (as here), but may not generalize.

**Assumption 5: Orphaned artifacts indicate workflow gaps.**
We treat rogue files in `.planning/` as evidence that workflows don't accommodate certain artifact types. But some "orphaning" may be intentional — a developer may prefer to drop a quick analysis file in `.planning/` root rather than navigate a formal workflow for something ephemeral. The cost of formalization (friction, bureaucracy) must be weighed against the cost of informal deviation (lost context, untraceable reasoning). This audit itself is an example: writing this deviation testimony adds value but also took time and context that could have been spent elsewhere.

### What We Cannot See From Here

- **Apollo's perspective.** 117 signals on apollo are invisible. Cross-project patterns that require apollo data are inaccessible. The model-profiles signal exists on both machines but we can only see the dionysus instance.
- **User experience of adoption.** We can read artifacts but not the experience of producing them. Whether deliberation-writing felt productive or bureaucratic, whether signal capture was natural or forced — these are not recorded in the artifacts.
- **What didn't get adopted.** We can see what GSDR features were used but not which were tried and abandoned, or which were never tried because they seemed irrelevant. Absence of evidence is not evidence of absence.
- **Temporal dynamics.** We see snapshots of current state. We don't see how adoption evolved — whether a project started with heavy GSDR usage and relaxed, or started light and deepened. Git history could partially reconstruct this but our agents didn't examine adoption trajectories.

---

## Findings

### 1. Signal Lifecycle Is Universally Stuck

**Evidence:**

| Project | Runtime | Signals | In "detected" | Remediated | Verified |
|---------|---------|---------|---------------|------------|----------|
| zlibrary-mcp | Claude Code | 30 | 30 | 0 | 0 |
| arxiv-sanity-mcp | Claude Code | 14 | 14 | 0 | 0 |
| epistemic-agency | Mixed | 9 | 9 | 0 | 0 |
| dionysus-research-platform | Claude Code | 7 | 7 | 0 | 0 |
| pdfagentialconversion | Codex/GPT-5 | 2 | 2 | 0 | 0 |
| f1-modeling | Codex/GPT-5.4 | 1 | 1 | 0 | 0 |
| get-shit-done-reflect | Claude Code | ~30+ | varies | **16** | 0 |

**63 signals across 6 non-framework projects, 0 lifecycle transitions.** The only transitions ever were 16 manual remediations in get-shit-done-reflect last session.

**Root cause (from signal-lifecycle-closed-loop-gap deliberation):** Lifecycle transitions are implemented as agent instructions in workflow specs, not as programmatic automation. When the agent skips a step — routine under context pressure — the transition silently doesn't happen.

**Qualification:** Not all signals *should* progress. Arxiv-sanity-mcp's signals function as live diagnostic instruments driving ongoing work. But zlibrary-mcp's 30 signals include many documenting specific bugs that were fixed — these should have been remediated but weren't, because the machinery didn't fire.

**Proof-of-concept value:** This finding was obtainable by simply counting lifecycle states across the global KB. A cross-project health sensor could surface this in seconds. The informal audit confirms the value of cross-project signal reading.

### 2. Deliberation Predictions Are Never Evaluated

**Evidence:**

| Project | Deliberations | Concluded | Evaluated |
|---------|--------------|-----------|-----------|
| f1-modeling | 7 | 7 | 0 |
| arxiv-sanity-mcp | 5 | 0 (intentionally open) | 0 |
| get-shit-done-reflect | 32 | 7 | 0 |
| zlibrary-mcp | 1 | 1 | 0 |
| epistemic-agency | 2 | 1 | 0 |

**16 concluded deliberations across the ecosystem, 0 evaluated.**

**Qualification:** For f1-modeling (Phase 2 of 8), many predictions are too early to evaluate. For zlibrary-mcp (v1.2 shipped, deliberation reshaped phase structure), evaluation is overdue. The gap is real but its urgency varies by project maturity.

**Proof-of-concept value:** A deliberation health probe could flag "concluded deliberation with falsifiable predictions, project has since shipped N phases — evaluation overdue." This is a specific, automatable check.

### 3. Five Distinct Adoption Shapes Exist

**Evidence (summarized from individual audits):**

1. **Deliberation-first** (f1-modeling): 7 deliberations, 1 signal. Architecture decisions front-loaded. Codex/GPT-5.4 runtime with `xhigh` reasoning effort. Clean `.planning/` — no orphans. Full GSD workflow (discuss → plan → execute).

2. **Spike-driven learning** (arxiv-sanity-mcp): 4 completed spikes feeding a next-round suite. Signals emerge from spike critique, not sensor automation. Properly qualified spike conclusions ("Chosen for now" / "Open", never binary). Deliberations intentionally open as thinking tools.

3. **Execution-heavy, sensor-rich** (zlibrary-mcp): 30 signals from batch sensor run (artifact + git sensors corroborated). 18 phases, v1.2 shipped. The sensor pipeline actually worked here. 4 archival AUDIT_*.md rogue files from v1.0.

4. **Dual knowledge systems** (epistemic-agency): Research findings in `knowledge-base/INDEX.md` (47 findings, 9 interaction effects). GSDR signals capture process deviations only. Traces (9 numbered documents, 1,593 lines) are the primary intellectual output, not phases. Explicitly aware it feeds GSD Reflect design. Trace 008 prescribed 4 concrete improvements to GSD Reflect — none yet implemented.

5. **Infrastructure as project** (dionysus-research-platform): The machine itself managed via GSDR. Signals about security, disk, packages. Good patterns captured (proof-based closeout, report-first cleanup) alongside problems (verification traceability drift).

**Qualification:** This taxonomy is retrospective and descriptive, not prescriptive. Projects didn't choose these shapes intentionally — they emerged from the interaction between project needs and GSDR's affordances. A project might shift shapes over its lifetime (f1-modeling will likely become more signal-rich in later phases as subsystem complexity grows). The five shapes should not be reified into "types" that constrain future adoption.

**Proof-of-concept value:** Understanding adoption shapes helps the framework serve different projects differently. A health check or onboarding flow could ask "is this project more deliberation-first or execution-heavy?" and adjust defaults accordingly. But this requires recognizing that the shapes are fluid, not fixed.

### 4. Cross-Context Signal Blindness Is Confirmed

**Evidence:**

The `model-profiles-prefix-mismatch` signal exists in:
- `dionysus-research-platform` (sig-2026-03-09, severity: critical, runtime: claude-code)
- GitHub Issue #30 (filed from apollo, about the same bug in different projects)
- Fixed in get-shit-done-reflect quick-260402-qnh

The `codex-project-config-version-migration-gap` signal in pdfagentialconversion is the same *class* of harness bug (config migration doesn't fire properly across versions) manifesting in a Codex context.

Each project diagnosed the symptom independently. No cross-referencing exists. The KB structure (flat files, untyped `related_signals`) cannot represent "these are different manifestations of the same structural condition."

**Qualification:** Cross-project signal reading is straightforwardly valuable in a single-developer ecosystem. In a multi-developer or multi-organization context, signal propagation raises questions about privacy, noise, and authority that we haven't addressed. This audit operates in the simplest case.

**Proof-of-concept value:** Even a simple `grep` across `~/.gsd/knowledge/signals/*/` for shared tags or keywords would have surfaced the model-profiles pattern. The cross-project sensor doesn't need to be sophisticated to add value.

### 5. Sensor Adoption Is Minimal

**Evidence:**

| Project | Sensor Pipeline Used? | How Signals Are Generated |
|---------|----------------------|--------------------------|
| zlibrary-mcp | **Yes** — artifact + git sensors, batch run | 30 auto-generated signals |
| arxiv-sanity-mcp | No | Organically from deliberation/spike critique |
| f1-modeling | No — intentionally skipped (config: `skips: 2`) | 1 manual signal |
| epistemic-agency | No | Manual observations during phase work |
| dionysus-research-platform | Partial — `gsdr-signal-synthesizer` ran | 7 auto-generated signals |
| pdfagentialconversion | No | 2 manual signals |

Only 2 of 6 projects have used the sensor pipeline. The others generate signals through human observation, deliberation, or spike work.

**Qualification:** This doesn't necessarily mean the sensor pipeline is broken or unwanted. It may mean: (a) projects haven't reached the phase complexity where automatic signal detection adds value over manual observation, (b) signal collection isn't prominently surfaced in the workflow at the right moments, or (c) the sensor pipeline's batch-post-phase model doesn't match how most projects actually work. These are different diagnoses requiring different responses. We don't have enough evidence to distinguish between them.

**Proof-of-concept value:** The audit reveals that the most interesting signals in several projects (arxiv-sanity-mcp's methodology critiques, epistemic-agency's warrant-typing insight) emerged from human judgment, not automation. A sensor that could surface "you've completed 3 phases without running signal collection — would you like to?" is different from a sensor that tries to *replace* human judgment about what's signal-worthy.

### 6. Orphaned Artifacts Follow a Pattern

**Evidence:**

| Project | Rogue Files | Type | Testimony? |
|---------|-------------|------|-----------|
| get-shit-done-reflect | 5 audit reports in `.planning/` root | Cross-cutting analysis | No |
| zlibrary-mcp | 4 AUDIT_*.md files | Archival from v1.0 | No |
| arxiv-sanity-mcp | 1 duplicate phase directory | Resequencing residue | No |
| f1-modeling | 0 | — | N/A |
| epistemic-agency | 0 (research artifacts outside `.planning/` by design) | — | N/A |

Orphaned artifacts appear when projects reach maturity and encounter needs the workflow doesn't accommodate: audit reports, ecosystem commentary, foundation analyses. No project leaves deviation testimony explaining the reasoning.

**Qualification:** Not all "orphaning" is equal. The epistemic-agency project's traces and knowledge-base living outside `.planning/` is a *design choice* reflecting the fact that research output is not a workflow side-effect. The zlibrary-mcp AUDIT_*.md files are archival detritus that could be cleaned up. The get-shit-done-reflect audit reports are active reference documents with no home. These three cases call for different responses — cleanup, acceptance, and workflow extension respectively.

**Proof-of-concept value:** The rogue-files probe (HEALTH-10) would catch all of these. The rogue-context probe (HEALTH-11) would categorize them. But without deviation testimony in the artifacts themselves, the rogue-context probe can only say "workflow-gap" — it can't reconstruct the reasoning behind the deviation. This audit report, with its deviation testimony header, is a prototype of what *responsible* deviation looks like.

---

## What This Audit Is a Proof-of-Concept For

This audit informally prototyped several things that could be formalized:

1. **Cross-project signal health check** — counting lifecycle states across `~/.gsd/knowledge/signals/*/` to surface systemic patterns. Automatable as a health probe.

2. **Deliberation evaluation reminder** — flagging concluded deliberations with falsifiable predictions in projects that have shipped subsequent work. Automatable as a health probe or session-start hook.

3. **Adoption shape detection** — characterizing how a project uses GSDR (deliberation-first, spike-driven, execution-heavy, etc.) to adjust defaults and suggestions. Partially automatable by examining artifact ratios.

4. **Cross-context signal correlation** — finding signals across projects that share tags, keywords, or reference the same code/config. Automatable as a simple grep-based sensor.

5. **Deviation testimony pattern** — this document's own header demonstrates what responsible deviation from formalized workflows looks like: state what you're producing, what workflow you searched for and didn't find, and what the artifact is meant to serve.

Each of these was performed by dispatching exploration agents with specific questions and synthesizing results. The agents returned useful, detailed findings. The synthesis required human judgment — connecting patterns across projects, qualifying findings against assumptions, deciding what matters. This division of labor (agents for data gathering, human+conversation for interpretation) is itself a data point for Thread 14 (cross-model review) and Thread 2 (research-grounded evaluation).

---

## Threads Developed by This Audit

| Thread | What concrete evidence this adds |
|--------|----------------------------------|
| 4 (Sensor Gaps) | Only 2/6 projects use sensor pipeline; most signals emerge from human judgment |
| 8 (Signal Staleness) | 63 signals across 6 projects, 0 lifecycle transitions — systemic, not local |
| 9 (Deliberation Lifecycle) | 16 concluded deliberations, 0 evaluated — universal pattern |
| 12 (Unified Lifecycle) | Signal and deliberation lifecycles break at the same point (closing loop) |
| 13 (KB Bridge) | Model-profiles signal in 2 projects, unlinked; apollo 117 signals invisible |
| 19 (Signal Ontology) | Same bug produces untyped, unlinked signals across projects |
| 20 (Thread Lifecycle) | 5 adoption shapes suggest threads need flexible lifecycle, not rigid progression |
| 21 (Deviation Accountability) | This document practices what it preaches; orphaned artifacts confirmed in 3 projects |

---

## Trace References

- **Agent outputs:** 4 exploration agents dispatched 2026-04-02 session 2
  - zlibrary-mcp audit (30 signals, sensor pipeline, 1 concluded deliberation)
  - arxiv-sanity-mcp audit (fullest adoption, spike-driven learning, 5 open deliberations)
  - f1-modeling audit (deliberation-first, 7 concluded / 0 evaluated, Codex runtime)
  - epistemic-agency audit (dual knowledge systems, Trace 008 cross-project influence)
- **Manual examination:** dionysus-research-platform (7 signals), pdfagentialconversion (2 signals)
- **Pre-v1.19 threads:** `.planning/deliberations/pre-v1.19-session-capture.md` (21 threads)
- **Signal lifecycle deliberation:** `.planning/deliberations/signal-lifecycle-closed-loop-gap.md` (concluded)
- **Structural norms deliberation:** `.planning/deliberations/structural-norms-practical-judgment-and-harness-embodiment.md` (open)
- **Forms/excess deliberation:** `.planning/deliberations/forms-excess-and-framework-becoming.md` (open)
- **Rogue file infrastructure:** `get-shit-done/references/health-probes/rogue-files.md`, `rogue-context.md`

---

*Date: 2026-04-02 | Session: pre-v1.19 deliberation (session 2) | Runtime: Claude Code / claude-opus-4-6*
