# Sensor Prototype Trial Roadmap

## Deviation Testimony

This artifact is an exploratory roadmap for informal sensor trials — dispatching agents to perform tasks that future sensors might automate, to see whether the *kind* of finding produced justifies building infrastructure. It has no formal GSDR workflow home; it is not a ROADMAP.md (that's the project roadmap), not a PLAN.md (those belong to phases), not a deliberation (it plans action rather than deliberating design). It is closest to a spike DESIGN.md but the trials are observational rather than experimental.

**Why it exists:** During pre-v1.19 session 2, the user proposed that we trial sensor concepts informally before formalizing them, treating each dispatch as a proof-of-concept. This document structures that approach so that: (a) trials are traceable, (b) predictions are recorded and evaluable, (c) findings feed back into the roadmap, and (d) the whole process is legible to future readers displaced from this moment.

**Where it sits in the broader work:** This is part of pre-v1.19 deliberation. The 21 threads in `pre-v1.19-session-capture.md` are being developed with concrete evidence. The `cross-project-gsdr-adoption-audit-2026-04-02.md` was the first informal trial (cross-project health). This roadmap structures what comes next.

---

## Situational Context

### Framework Provenance Notice

**CRITICAL DISTINCTION:** Projects in this ecosystem use a mixture of **GSD Reflect** (our fork, npm: get-shit-done-reflect-cc) and **upstream GSD** (gsd-build/get-shit-done). Some projects also use a mixture of **Claude Code** and **Codex CLI** runtimes, and some have no persistent runtime installation (signals were produced during sessions but the runtime directory wasn't retained).

The fork adds: signal lifecycle machinery, philosophical deliberation template (Dewey/Toulmin/Lakatos/Peirce), sensor pipeline (artifact + git sensors), structured KB architecture, health probes, automation levels, and the reflection/spike/signal knowledge types. Upstream GSD has its own features (some shared, some divergent — see `.planning/FORK-DIVERGENCES.md`). Signals from upstream-GSD projects tell us about adoption patterns but may not use fork-specific schema fields or lifecycle states.

| Project | Machine | Framework | Version | Runtime(s) | Notes |
|---------|---------|-----------|---------|------------|-------|
| **get-shit-done-reflect** | both | **GSDR fork** | apollo: 1.16.0+dev, dionysus: 1.18.2+dev | Claude Code, Codex | The framework itself; apollo copy is stale (pre-v1.17) |
| **prostagma** | apollo | **GSDR fork** | 1.12.2 | Claude Code | Early fork version, early-stage project |
| **scholardoc-ocr** | apollo | **GSDR fork** | 1.14.2 | Claude Code + Codex (dual) | Same fork version on both runtimes |
| **scholardoc** | both | **Mixed** | apollo: upstream 1.20.5, dionysus: fork 1.16.0+dev | Claude Code | Different framework on each machine! |
| **zlibrary-mcp** | dionysus | **GSDR fork** (probable) | 1.13.0 | Claude Code | Pre-namespace dir name; signal richness suggests fork |
| **arxiv-sanity-mcp** | dionysus | **Upstream GSD** | 1.22.4 | Claude Code | Upstream version; rich deliberations may use upstream template |
| **robotic-psalms** | dionysus | **Upstream GSD** | 1.22.4 | Claude Code | Upstream version |
| **tain** | dionysus | **Upstream GSD** | 1.30.0 | Claude Code | Latest upstream; signals/deliberations reflect upstream patterns |
| **f1-modeling** | dionysus | **Codex sessions** | — | Codex CLI (GPT-5.4) | No persistent install; 7 deliberations from Codex sessions |
| **epistemic-agency** | dionysus | **Mixed sessions** | — | Claude + Codex | No persistent install; signals from both runtimes |
| **blackhole-animation** | apollo | **Codex sessions** | — | Codex CLI (GPT-5) | No persistent install; 6 signals from Codex |
| **vigil** | apollo | **No runtime** | — | Unknown | Has STATE.md but no signals; HANDOFF.json present |
| **PDFAgentialConversion** | both | **Codex sessions** | — | Codex CLI (GPT-5) | No persistent install; signals on both machines, non-overlapping |
| **claude-notify** | dionysus | **No runtime** | — | — | v0.1 completed, 2 deliberations, no persistent GSD install |
| **hermeneutic-workspace-plugin** | dionysus | **No runtime** | — | — | 1 deliberation, no persistent install |

**Limitations this introduces:**
- Signals from upstream GSD projects (arxiv-sanity-mcp, tain, robotic-psalms) may use different schema, different signal types, and different lifecycle conventions. Cross-project comparisons must account for this.
- Projects with no persistent runtime (f1-modeling, epistemic-agency, blackhole-animation, PDFAgentialConversion) produced signals during sessions but the framework installation wasn't retained. Their signals' `gsd_version` field reflects the session's framework, not a persistent install.
- Scholardoc has *different frameworks on different machines* — upstream on apollo, fork on dionysus. Any cross-machine comparison for this project compares two different toolchains.
- Codex CLI sessions don't persist runtime directories the same way Claude Code does. The absence of `.codex/` doesn't mean Codex wasn't used — check signal `runtime` fields.

**How to read findings given this:** Findings about adoption patterns, signal quality, and development workflow practices are valid across both frameworks — they tell us about how developers use structured planning tools. Findings about lifecycle transitions, sensor pipeline usage, and fork-specific features apply only to GSDR fork projects. When a finding crosses this boundary, it will be marked.

### What We Know

- **v1.18 shipped.** The framework is stable. We're in deliberation, not development.
- **21 threads surfaced.** Covering sensor gaps, signal lifecycle, deliberation lifecycle, KB bridges, deviation accountability, thread lifecycle, and philosophical operationalization.
- **Cross-project audit completed.** 6 dionysus projects audited. Key findings: signal lifecycle universally stuck at "detected" (63/63 across non-framework projects), deliberation predictions never evaluated (16/16 concluded, 0 evaluated), 5 adoption shapes identified, orphaned artifacts confirmed in 3 projects.
- **Apollo is reachable.** 7 GSDR projects, 118 signals in global KB (105 from get-shit-done-reflect alone), 8 deliberations in get-shit-done-reflect. Never integrated with dionysus.
- **Combined ecosystem:** 18 GSDR-managed projects across 2 machines, ~181 signals total.

### What We Don't Know

- What's in apollo's 105 get-shit-done-reflect signals. We've never read them.
- Whether the 8 deliberations on apollo overlap with or differ from dionysus's 32.
- Whether cross-project signal correlation reveals genuine patterns or noise.
- Whether deliberation predictions are specific enough to evaluate at all.
- Whether signal staleness detection via git history works in practice.
- Whether the "adoption shapes" we identified are real patterns or artifacts of our framing.

### Our Position

We are examining the GSDR framework from within it, using its own tools and assumptions. This is necessarily an immanent critique — we judge the system against its own stated values (epistemic rigor, lifecycle completion, responsible deviation) rather than an external standard. The risk is that we reproduce the system's blind spots. The mitigation is to be explicit about assumptions and open to findings that challenge them.

We are also positioned temporally: between milestones, with accumulated experience of what worked and what didn't across 7 milestones. The threads were surfaced in extended deliberation sessions where failures happened live (5 cascade failures in session 1). This is not detached evaluation but situated reflection on practice.

---

## Trials

### Trial E: Apollo KB Reading

**What:** Read the 105 signals and 8 deliberations in get-shit-done-reflect on apollo. Produce a structured summary of what's there.

**Why first:** This unlocks context for all subsequent trials. Cross-project correlation (Trial C) is incomplete without apollo's signals. The apollo KB represents a parallel development history — same framework, different machine, different runtime contexts (Codex sessions produced some signals), different projects (blackhole-animation, vigil, prostagma don't exist on dionysus). Understanding what's there reshapes what other trials can find.

**Connects to threads:** 13 (KB bridge), 8 (signal staleness), 19 (signal ontology), 14 (cross-model review — apollo has Codex-generated signals)

**Predictions:**

| ID | Prediction | Confidence | Falsification Criteria |
|----|-----------|------------|----------------------|
| E-P1 | The majority of apollo's 105 signals will be in "detected" lifecycle state, matching the dionysus pattern | High | >20% of signals have progressed past "detected" |
| E-P2 | At least some apollo signals will reference the same harness bugs found on dionysus (model-profile mismatch, config migration) | Medium | Zero overlapping concerns between apollo and dionysus signal sets |
| E-P3 | The 8 deliberations on apollo will include at least 2 that don't exist on dionysus (different development contexts produce different design questions) | Medium | All 8 are duplicates of dionysus deliberations |
| E-P4 | Apollo's signal volume (105) vs dionysus's (~30) reflects more active GSDR development on apollo, not just more problems | Low-Medium | Apollo signals are overwhelmingly negative/problem signals with no positive patterns or design insights |
| E-P5 | We will find signals about Codex-specific behaviors that have no Claude Code equivalent — cross-runtime insights invisible to either machine alone | Medium | All signals are runtime-agnostic |

**Assumptions to expose:**
- We assume reading signals from another machine yields insights not available locally. This seems obviously true given 105 vs 30, but the *kind* of insight matters — 105 trivial "file was underdeclared in plan" signals would add volume without depth.
- We assume the apollo KB's format is compatible with what we're reading here. Version drift between machines could make signals hard to compare.
- We assume SSH access gives us sufficient read capability. We cannot run GSDR commands on apollo from here.

**Method:** Dispatch exploration agent via SSH. Agent reads signal files, deliberation files, categorizes, summarizes. Agent is briefed on what we already know from dionysus to avoid redundant description.

**Output:** Findings appended to Trial E section below. Predictions evaluated inline.

---

### Trial A: Signal Staleness Detection

**What:** For each signal across all projects (both machines), cross-reference the signal's `tags`, referenced files, and described concerns against git commits made after the signal's creation date. Flag signals where the underlying issue appears to have been addressed.

**Why:** Thread 8 (signal staleness) was surfaced when last session's patch triage found all 4 "patch-worthy" signals were already resolved. If we can detect staleness across the ecosystem, we know whether building a git-aware staleness sensor is worthwhile.

**Connects to threads:** 8 (staleness), 12 (unified lifecycle), 11/18 (hermeneutic re-reading — staleness detection is a reading practice)

**Predictions:**

| ID | Prediction | Confidence | Falsification Criteria |
|----|-----------|------------|----------------------|
| A-P1 | At least 30% of signals across the ecosystem will have stale references (tagged files changed, referenced bugs fixed) | Medium | <10% show any staleness indicators |
| A-P2 | zlibrary-mcp will have the highest staleness rate (v1.2 shipped, many signals about v1.0-era issues) | High | Another project has higher staleness |
| A-P3 | Git-based staleness detection will produce both true positives (genuinely stale) and false positives (file changed but concern persists) | High | All detections are unambiguous |
| A-P4 | The false positive rate will be high enough to require human judgment, suggesting a staleness *flag* rather than automatic remediation | Medium | False positive rate <10% |

**Assumptions to expose:**
- We assume git commit history is a meaningful proxy for whether a signal's concern has been addressed. But a commit that modifies a file referenced by a signal might not address the signal's actual concern — the file could change for unrelated reasons.
- We assume staleness is detectable from artifact analysis alone. Some signals describe structural conditions (e.g., "signal systems suffer MAPE blind spot") that cannot be stale — they're descriptions of system architecture, not bug reports.

**Method:** Agent examines each signal's tags, referenced files, and description. For each, checks git log for relevant commits after signal creation date. Categorizes as: stale (likely fixed), ambiguous (file changed, unclear if concern addressed), live (no relevant changes), or structural (not the kind of thing that can be "fixed"). Report includes false-positive analysis.

---

### Trial D: Rogue File Census

**What:** Run rogue-file detection (HEALTH-10 pattern) across all 18 GSDR-managed projects on both machines. For each rogue file found, check whether it carries any deviation testimony or context about why it was created.

**Why:** Thread 21 (deviation accountability) proposes that deviations from formalized workflows should carry testimony. The cross-project audit confirmed orphaned artifacts in 3 projects but only examined 6. A full census tells us the scale of the problem and whether any project has organically developed the testimony pattern.

**Connects to threads:** 21 (deviation accountability), 20 (thread lifecycle — threads themselves may be "rogue" relative to the deliberation system)

**Predictions:**

| ID | Prediction | Confidence | Falsification Criteria |
|----|-----------|------------|----------------------|
| D-P1 | Projects in active development (vigil, tain, robotic-psalms) will have fewer rogue files than mature projects (zlibrary-mcp, get-shit-done-reflect) | Medium | Active projects have equal or more rogue files |
| D-P2 | Zero rogue files across all projects will carry explicit deviation testimony | High | Any project has a rogue file with structured explanation of why it's there |
| D-P3 | The most common rogue file type will be audit/analysis reports (matching get-shit-done-reflect and zlibrary-mcp pattern) | Medium | A different file type dominates |
| D-P4 | Apollo projects will show similar rogue patterns to dionysus projects | Medium | Apollo has fundamentally different rogue file patterns |

**Assumptions to expose:**
- We assume the rogue-files probe's allowlist (EXPECTED_FILES, EXPECTED_DIRS) is correct. If the allowlist is too narrow, we'll get false positives. If too broad, we'll miss real orphans.
- We assume rogue files are *problems* to be solved. But as noted in the audit synthesis, some orphaning may be intentional informality.

**Method:** Agent runs rogue-files detection pattern against each project's .planning/ directory. For rogue files found, reads the file's first 20 lines looking for any structured context/testimony, then checks git log for creation context. Reports per-project and cross-project summary.

---

### Trial C: Cross-Project Signal Correlation

**What:** After Trials E, A, D complete, grep all signals across both machines' KBs for shared tags, keywords, referenced config keys, error patterns, and agent names. Identify clusters of signals that appear to describe the same or related concerns across projects.

**Connects to threads:** 13 (KB bridge), 19 (signal ontology — what *kind* of relationship exists between correlated signals?)

**Predictions:**

| ID | Prediction | Confidence | Falsification Criteria |
|----|-----------|------------|----------------------|
| C-P1 | "model-profile" and "config-mismatch" tags will cluster signals across 3+ projects | High | These tags appear in <2 projects |
| C-P2 | We will find at least one pattern visible only in cross-project view (not detectable within any single project) | Medium | All patterns were already visible within individual projects |
| C-P3 | The correlation will produce both genuine patterns and noise (generic tags like "deviation" matching unrelated concerns) | High | All correlations are unambiguously meaningful |
| C-P4 | Harness bugs will show the strongest cross-project signal (same framework bug manifesting in different projects) | High | Project-specific concerns dominate cross-project patterns |

**Assumptions to expose:**
- Lexical similarity (shared tags/keywords) is a crude proxy for meaningful relationship. Typed signal edges (Thread 19) would be more precise.
- We're looking at the ecosystem of a single developer. Patterns here may not generalize to multi-developer contexts.

**Method:** Extract all tags, signal_types, and key phrases from every signal. Build frequency tables. Identify tags/phrases appearing across 2+ projects. For clusters found, read the signals and assess whether the correlation is genuine (same concern), thematic (related concerns), or spurious (generic tag overlap). Report includes relationship-type classification per Thread 19's proposed taxonomy (analytical, thematic, causal, temporal).

---

### Trial B: Deliberation Evaluation

**What:** Pick the single most evaluable concluded deliberation (one with specific, falsifiable predictions and enough elapsed time for outcomes to manifest). Attempt to evaluate its predictions against what actually happened.

**Connects to threads:** 9 (deliberation lifecycle — 0 evaluations ever performed), 2 (research-grounded evaluation)

**Predictions:**

| ID | Prediction | Confidence | Falsification Criteria |
|----|-----------|------------|----------------------|
| B-P1 | The most evaluable deliberation will be zlibrary-mcp's v12-scope-and-priorities (concluded, 6 predictions, v1.2 shipped, outcomes observable) | High | Another deliberation is more evaluable |
| B-P2 | At least 2 of its predictions will be clearly confirmed or falsified | Medium | All predictions are too vague to evaluate |
| B-P3 | The evaluation process will reveal that the prediction template encourages predictions that are too vague or too broad to meaningfully evaluate | Medium | All predictions are precise and evaluable |
| B-P4 | The evaluation will be valuable even if predictions were wrong — understanding *why* they were wrong teaches more than confirmation | Low-Medium | Predictions were trivially correct and the evaluation teaches nothing |

**Assumptions to expose:**
- We assume one evaluation is enough to prototype the practice. But one sample can't tell us whether evaluation is systematically valuable or whether this case was unusually clean/messy.
- We assume we can evaluate predictions from outside the project. The evaluator (us) doesn't have the lived experience of working in that project.
- The most interesting evaluation outcome may be neither "predictions held" nor "predictions failed" but "predictions asked the wrong question" — which would be a finding about the deliberation template itself.

**Method:** Read the concluded deliberation's predictions. For each, identify the observable outcome and falsification criteria. Read project state (STATE.md, subsequent phase artifacts, git history) for evidence. Assess each prediction as: confirmed, falsified, ambiguous (evidence points both ways), untestable (prediction was too vague), or premature (not enough time/phases elapsed). Write up evaluation with methodology notes.

---

### Trial G: Hermeneutic Re-Reading (Ongoing)

**What:** Re-read signals marked "remediated" in get-shit-done-reflect and signals marked "stale" by Trial A. Read them not for their immediate fix but for what they might still disclose about structural conditions, recurring patterns, or concerns that the fix didn't address.

**Why this is different:** Trials A-F are quasi-empirical — they produce data that can be counted and compared. Trial G is interpretive. It asks: what do these signals *say* when read within the constellation of everything we've surfaced? This is Thread 11/18's practice of hermeneutic re-reading.

**This trial is NOT delegated to agents.** It requires interpretive judgment that should happen in conversation. It is ongoing throughout the other trials, not a discrete step. Whenever another trial surfaces a signal worth re-reading, we pause and read it.

**Connects to threads:** 11 (signal hermeneutics), 18 (contextual interpretation), 20 (thread lifecycle — re-reading is how threads develop)

**No predictions for this trial.** Predictions would impose an expectation structure that forecloses the kind of open reading we're trying to practice. The point is to see what we see, not to confirm what we expect.

---

## Sequencing

```
Trial E (apollo KB reading)
    │
    ├── findings deliberated, roadmap updated if needed
    │
    ▼
Trials A + D (staleness + rogue census) — in parallel
    │
    ├── findings deliberated, roadmap updated if needed
    │
    ▼
Trial C (cross-project correlation) — needs full KB context
    │
    ├── findings deliberated, roadmap updated if needed
    │
    ▼
Trial B (deliberation evaluation) — careful, interpretive
    │
    ├── findings deliberated, roadmap updated if needed
    │
    ▼
Synthesis — update this roadmap with outcomes vs predictions
```

Trial G (hermeneutic re-reading) runs continuously — whenever a trial surfaces something worth reading more carefully, we pause and read.

**Between each trial:** Deliberate on findings before proceeding. Ask: should the roadmap change? Are our assumptions holding? Did we learn something that makes the next trial more or less valuable? Record any changes as addenda below, never destructive edits.

---

## Evaluation Protocol

After all trials complete, evaluate this roadmap itself:

1. **Prediction accuracy:** For each prediction, record outcome (confirmed/falsified/ambiguous/untestable/premature).
2. **Assumption stability:** Which assumptions held? Which were challenged? Which were irrelevant?
3. **Value assessment:** For each trial, was the *kind* of finding produced worth formalizing into a sensor? Rate as: definitely formalize / promising but needs refinement / not worth automating / question was wrong.
4. **Epistemic gaps exposed:** What did we fail to anticipate? What surprised us? What couldn't we see from our position?
5. **Thread development:** Which threads gained the most concrete grounding? Which remained abstract?

---

## Trial E Findings (Partial — Supplementary Agent Complete, Main Agent In Progress)

### Apollo Other-Project Signals (Supplementary Agent)

**Date completed:** 2026-04-02, session 2

**Key findings:**

1. **Blackhole-animation (Codex/GPT-5, 6 signals, 12 rogue files):** Workflow chaos during initialization — delegation discipline failures, config mismatches (2 critical: reasoning effort misreported, wrong model used for research pass), research lineage confusion. 12 rogue files in `.planning/` root are active deliberation artifacts from the struggle, not orphaned detritus. This is Thread 21's most acute case: the rogue files carry context the signals can't hold, but without testimony or structure.

2. **PDFAgentialConversion non-overlapping perspectives:** Apollo has 7 signals (testing, quality gates, capability gaps from phases 02-05). Dionysus has 2 signals (config mismatch, version migration from phase 08). Zero overlap. Different machines see different concerns from the same project — direct evidence for Thread 13 (KB bridge) and prediction E-P5.

3. **Vigil's silence as signal:** Active project paused 6 days with blockers and methodology innovations, zero signals generated. HANDOFF.json properly maintained but KB empty. The absence of signals is a capture gap, not an absence of knowledge.

4. **Scholardoc-ocr dual-runtime inert:** Both `.claude/` and `.codex/` on stale v1.14.2, zero signals in either. Most architecturally interesting configuration produces no observations.

5. **Self-referential signal schema gap:** PDFAgentialConversion signal `sig-2026-03-15-signal-metadata-needs-provenance-and-escalation` flags that signal schema is missing creator-side metadata, model provenance, and reasoning-effort fields. The signal system flagging its own incompleteness.

6. **Rogue file patterns:** blackhole-animation has 12 (active chaos artifacts), vigil has 1 legitimate HANDOFF.json, all others clean. No project carries deviation testimony.

### Apollo Main KB (Main Agent — 106 signals, 8 deliberations)

**Date completed:** 2026-04-02, session 2

**Key findings:**

1. **Lifecycle distribution:** 41 detected, 10 triaged, 53 with NO lifecycle_state field (pre-schema signals from v1.12-v1.15 era), 0 remediated, 0 verified. Contrasts with dionysus which has 16 remediated (from last session's manual transitions). The pre-schema signals are effectively frozen — they predate the lifecycle machinery entirely.

2. **Positive pattern capture is an apollo-specific practice:** 12 `good-pattern` signals + 15 manually curated `SIG-*` files documenting positive observations (TDD discipline, clean plan execution, doc-only plan structure). This is a distinct practice not present on dionysus. The SIG-* format appears to be a separate category for distilled lessons outside the automatic sensor stream.

3. **Temporal clustering:** Heavy signal density in late Feb 2026 (v1.12-v1.15 migration challenges) and early March (v1.16 phase escalation). A 28-day gap (2026-03-05 to 2026-04-02) covers the entire v1.17-v1.18 development period — suggesting development shifted to dionysus for those milestones.

4. **Critical extraction quality cluster:** 5 critical signals on a single day (2026-02-22) documenting Phase 22 content loss — codebase-mapper deleted, knowledge surfacing removed, webfetch best practices lost, fabricated provenance in protocol section, unauthorized scope creep. All caused by Sonnet 4.5 treating ambiguous KEEP lists as delete authorization.

5. **CI pipeline as major blind spot:** 6 critical signals about CI failures being silently bypassed, PRs created against upstream instead of fork, and no CI verification in execute-phase workflow. Phase 39 (CI Awareness) was designed to address this.

6. **AskUserQuestion phantom responses:** Critical UX bug — tool auto-resolves without UI in YOLO mode, silently producing garbage. Discovered live during /gsdr:discuss-phase.

7. **Config version field drastically stale:** config.json says version 1.12.2 despite signals referencing 1.15.6+, 1.16.0+, 1.18.1. Config migration doesn't update this field automatically.

8. **All 8 deliberations are a subset of dionysus's 32.** No unique deliberations on apollo. Dionysus has 25 deliberations apollo doesn't have — most created during the philosophical deliberation work (structural-norms, forms-excess, responsibility-alterity, etc.) and the v1.17-v1.18 design period. This confirms development shifted machines.

9. **Only 1 reflection and 1 spike in entire KB.** Despite 106 signals, the distillation pipeline (signal → reflection → lesson) has barely fired. The system collects observations but doesn't synthesize them.

10. **3 Codex-cli signals from 2026-04-02:** Active cross-runtime testing on apollo. One is the model-resolver issue (same as Issue #30, now fixed in quick-260402-qnh). The others are about discuss-mode config being dropped during clean update.

### Full Prediction Evaluation

| ID | Prediction | Confidence | Outcome | Notes |
|----|-----------|------------|---------|-------|
| E-P1 | Majority of apollo's signals will be in "detected" lifecycle state | High | **CONFIRMED** | 41 detected + 53 pre-schema (no lifecycle_state field) = 94/106 in detected-equivalent state. 10 triaged, 0 remediated/verified. |
| E-P2 | At least some apollo signals will reference the same harness bugs | Medium | **CONFIRMED** | Model-profile mismatch, signal lifecycle stuck, KB path issues, installer friction, config migration — all present on both machines. |
| E-P3 | At least 2 apollo deliberations won't exist on dionysus | Medium | **FALSIFIED** | All 8 apollo deliberations are a strict subset of dionysus's 32. Dionysus has 25 unique deliberations. Development shifted from apollo to dionysus for v1.17+. |
| E-P4 | Apollo's signal volume reflects more active development, not just more problems | Low-Medium | **PARTIALLY CONFIRMED** | 12 good-pattern + 15 SIG-* positive signals confirm quality capture. But the temporal pattern suggests apollo was primary for v1.12-v1.16 and dionysus for v1.17-v1.18 — the volume split is temporal, not qualitative. |
| E-P5 | Cross-runtime insights invisible to either machine alone | Medium | **CONFIRMED** | Apollo has CI pipeline blindspot signals (6 critical), AskUserQuestion phantom responses, extraction quality cluster, and SIG-* positive pattern practice — none visible on dionysus. Supplementary: PDFAgentialConversion non-overlapping perspectives, blackhole-animation Codex-specific delegation failures. |

### Epistemic Gaps Revealed by Trial E

1. **We assumed apollo was a parallel development environment.** It's actually a *temporal predecessor* — primary for v1.12-v1.16, then development shifted to dionysus for v1.17-v1.18. The two KBs are not parallel views of the same work but sequential phases of a migration.

2. **We didn't predict the SIG-* curated pattern practice.** Apollo has 15 manually distilled positive-pattern signals in a separate naming format. This practice was abandoned or never migrated to dionysus. It represents a knowledge capture approach (explicit positive observation) that the current workflow doesn't formalize.

3. **The pre-schema signal problem.** 53 signals lack lifecycle_state fields entirely because they predate the schema. These aren't just "detected" — they're structurally excluded from the lifecycle system. Any staleness detection (Trial A) must account for this.

4. **The reflection gap is more severe than expected.** Only 1 reflection in 106 signals. The signal-to-reflection pipeline has effectively never operated at scale on either machine.

### Roadmap Implications

**Trial A (staleness detection) needs adjustment:** The 53 pre-schema signals on apollo require special handling — they can't be evaluated by lifecycle state. The staleness detection should classify signals into: (a) signals with lifecycle_state (evaluate by state vs git history), (b) pre-schema signals (evaluate by concern relevance to current codebase), and (c) SIG-* curated patterns (evaluate by whether the pattern still holds).

**Trial C (cross-project correlation) is now richer than expected:** 106 apollo + ~30 dionysus signals for get-shit-done-reflect, plus signals from 10+ other projects. The temporal split (apollo = v1.12-v1.16 era, dionysus = v1.17-v1.18 era) means cross-machine correlation is partly *historical* — tracing how concerns evolved across milestones.

**Trial D (rogue files) partially complete for apollo:** The supplementary agent already scanned apollo projects. We still need dionysus projects.

**New observation worth noting:** The SIG-* curated positive-pattern practice on apollo is a distinct knowledge capture approach that deserves examination. It's not a sensor trial but it informs Thread 11 (signal hermeneutics) — someone was reading signals and distilling positive patterns manually. Why was this practice abandoned?

---

## Trial D Findings: Rogue File Census

**Date completed:** 2026-04-02, session 2. Covers all dionysus projects + partial apollo (blackhole-animation, vigil already covered in Trial E supplementary).

### Summary

| Metric | Count |
|--------|-------|
| Projects scanned | 12 (9 dionysus + 3 apollo already done) |
| Total rogue files | 15 (13 tracked, 2 untracked) |
| Total rogue directories | 5 (foundation-audit, governance ×2, fork-audit, plus today's work) |
| Files with deviation testimony | **15 of 15 (100%)** |
| Clean projects (no rogue files) | 5 (claude-notify, hermeneutic-workspace-plugin, robotic-psalms, tain, prostagma) |

### Prediction Evaluation

| ID | Prediction | Confidence | Outcome | Notes |
|----|-----------|------------|---------|-------|
| D-P1 | Active projects will have fewer rogues than mature projects | Medium | **CONFIRMED** | Active projects (vigil, tain, robotic-psalms) = clean. Mature projects (zlibrary-mcp, get-shit-done-reflect, arxiv-sanity-mcp) have rogues. |
| D-P2 | Zero rogue files will carry explicit deviation testimony | High | **FALSIFIED** | 100% carry testimony. Every rogue file has opening documentation explaining its purpose. |
| D-P3 | Most common rogue type will be audit/analysis reports | Medium | **CONFIRMED** | 11 of 15 rogue files are audit/review artifacts (AUDIT_*, MILESTONE-AUDIT, gap-analysis, ECOSYSTEM-COMMENTARY, etc.) |
| D-P4 | Apollo will show similar patterns to dionysus | Medium | **CONFIRMED** | Both machines produce audit artifacts as primary rogue type; governance dirs appear on both. |

### The D-P2 Falsification — What It Means for Thread 21

**This is the most important finding from Trial D.** We predicted zero testimony; we found 100%. But this needs careful interpretation.

**What the testimony IS:** Each rogue file explains *what it is* and *when it was created*. Examples:
- ECOSYSTEM-COMMENTARY.md: "Written 2026-03-11 from cross-project analysis session, before Phase 04.1 execution"
- governance/POLICY.md: "Phase 5 makes GSDR an explicit outer governance layer for this repo"
- gap-analysis-2026-03-26.md: "Comprehensive gap analysis" with 8 requirements and 3 deliberation references

**What the testimony is NOT:** None explains *why the file is in .planning/ root instead of a structured directory*. The testimony says "I am an audit report" but not "I searched for a workflow to produce audit reports and found none, so I created this here." The *purpose* is documented; the *placement decision* is not.

This refines Thread 21: the problem isn't that deviations lack justification entirely — it's that the justification is incomplete. Artifacts explain their content but not their structural placement. A human reader can understand the file; the rogue-context probe (HEALTH-11) still can't read *why it's rogue* because the placement reasoning isn't structured.

**Thread 21 update:** The deviation-testimony pattern should focus on the *structural placement decision* ("why here instead of where the workflow expects"), not content documentation (which already happens organically). The gap is narrower than we thought but more specific.

### Framework Provenance Patterns

| Framework | Projects with rogues | Rogue type | Notes |
|-----------|---------------------|------------|-------|
| GSDR fork | 3 of 5 | Audit reports + governance dirs | governance/ is fork-specific pattern |
| Upstream GSD | 2 of 4 | Audit/review reports | No governance pattern |
| Codex sessions | 1 of 1 | Gap analysis | Single comprehensive analysis file |
| No runtime | 0 of 3 | — | Too early-stage for rogues |

**Notable:** Governance directories (governance/POLICY.md, governance/recommendations/) appear ONLY in GSDR fork projects (epistemic-agency, get-shit-done-reflect). This may be a fork-specific practice emerging organically — projects using the fork develop governance needs that upstream GSD projects don't encounter. Worth noting for Thread 12 (unified lifecycle) — governance artifacts may need their own place in the workflow.

### Provenance Correction

Trial D found that epistemic-agency has GSDR fork v1.17.3 installed (not "no runtime" as previously assumed). The provenance table in the Situational Context section should be updated.

---

## Trial A Findings: Signal Staleness Detection

**Date completed:** 2026-04-02, session 2. Examined 39 signals across zlibrary-mcp (30) and get-shit-done-reflect on dionysus (9).

### Classification Results

| Category | zlibrary-mcp | get-shit-done-reflect | Total | % |
|----------|-------------|----------------------|-------|---|
| **STALE** (concern addressed) | 5 | 0 | 5 | 12.8% |
| **LIVE** (concern persists) | 7 | 8 | 15 | 38.5% |
| **POSITIVE/BASELINE** | 7 | 0 | 7 | 17.9% |
| **PROCESS/CHARACTERIZATION** | 11 | 1 | 12 | 30.8% |
| **Total** | 30 | 9 | 39 | 100% |

### Prediction Evaluation

| ID | Prediction | Confidence | Outcome | Notes |
|----|-----------|------------|---------|-------|
| A-P1 | At least 30% of signals will have stale references | Medium | **FALSIFIED** | Only 5/39 = 12.8% stale. Most signals describe structural/process concerns, not fixable code bugs. |
| A-P2 | zlibrary-mcp will have highest staleness rate | High | **CONFIRMED** | 16.7% (5/30) vs 0% (0/9). zlibrary-mcp had shipped v1.2, so code bugs had been addressed. |
| A-P3 | Will produce both true positives and false positives | High | **PARTIALLY FALSIFIED** | True positives found (5 stale), but zero false positives. The detector was more accurate than expected. |
| A-P4 | False positive rate will be high enough to require human judgment | Medium | **FALSIFIED** | Zero false positives. Semantic signal classification (code-bug vs structural vs process) disambiguated cleanly. |

### The Key Insight: Signal Types Determine Staleness Behavior

The most important finding is that **staleness detection requires semantic signal classification before checking git history**:

1. **Code-bug signals** (5 found, all in zlibrary-mcp): These DO become stale when the bug is fixed. All 5 were addressed in a single commit (7e20480) on the same day as signal creation. Git-based staleness detection works well for this type.

2. **Architectural/structural signals** (7 found): Remain LIVE indefinitely because they describe permanent constraints (Alpine musl incompatibility, credential-gated tests), not bugs. The "fix" is graceful degradation, which was already implemented. A staleness detector would correctly identify these as LIVE — no false positive risk.

3. **Process/capability signals** (12 found, including all 8 LIVE in get-shit-done-reflect): Only become stale through workflow/harness changes, not code commits. A git-based detector checking source code would never flag these as stale because the relevant changes would be in workflow spec files, not project code.

4. **Positive/characterization signals** (19 found): Document patterns and baselines. Cannot be "stale" — they're observations, not problems. A detector needs to skip these entirely.

**Implication for sensor formalization:** A staleness sensor is worth building but ONLY for code-bug signals. For the other three types, staleness is either meaningless (positive/characterization), inapplicable (process/capability), or architecturally permanent (structural). The sensor should classify first, then detect — not detect-then-classify.

### Notable Finding: zlibrary-mcp Stale Signals Were All Fixed Same-Day

All 5 stale signals were addressed in commit 7e20480 (2026-03-20), the same date the signals were created. This suggests the signals were detected during post-phase audit work that *also* triggered the fixes — meaning the signal-to-remediation loop worked, but the lifecycle state was never updated. The machinery exists but doesn't fire, confirming the signal-lifecycle-closed-loop-gap diagnosis.

### What This Means for Remaining Trials

**Trial C (cross-project correlation) should incorporate signal type classification.** When correlating signals across projects, a code-bug correlation (same bug in two projects) has different implications than a structural correlation (same architectural constraint in two projects) or a process correlation (same workflow gap in two projects). The type determines what the correlation *means*.

**Trial B (deliberation evaluation) is unaffected** — deliberation predictions are about design decisions, not signal types.

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-02 | Initial roadmap created | Pre-v1.19 sensor trial planning, session 2 |
| 2026-04-02 | Trial E supplementary findings added | Apollo other-project agent completed; main KB agent still in progress |
| 2026-04-02 | Trial E complete — all predictions evaluated | Main KB agent completed. E-P3 falsified (deliberations are subset, not unique). Temporal split discovered (apollo=v1.12-v1.16, dionysus=v1.17-v1.18). Trial A adjusted for pre-schema signals. |
| 2026-04-02 | Trial D complete — D-P2 falsified (100% testimony) | Rogue file census found all artifacts carry content testimony, but none explain structural placement. Thread 21 refined: gap is narrower but more specific. Governance dirs are fork-specific pattern. epistemic-agency provenance corrected to GSDR fork 1.17.3. |
| 2026-04-02 | Trial A complete — A-P1, A-P3, A-P4 falsified | Only 12.8% stale (not 30%+). Zero false positives (not "high rate"). Key insight: staleness detection requires semantic signal classification. Code-bug signals become stale; structural/process/positive signals don't. |

---

*This document is a living artifact. Changes are additive (new sections, updated predictions, evaluation notes) rather than destructive. The change log records what changed and why. Git history preserves the full trace.*
