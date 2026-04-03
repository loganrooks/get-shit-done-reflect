# Sensor Prototype Trial Roadmap

## Deviation Testimony

This artifact is an exploratory roadmap for informal sensor trials — dispatching agents to perform tasks that future sensors might automate, to see whether the *kind* of finding produced justifies building infrastructure. It has no formal GSDR workflow home; it is not a ROADMAP.md (that's the project roadmap), not a PLAN.md (those belong to phases), not a deliberation (it plans action rather than deliberating design). It is closest to a spike DESIGN.md but the trials are observational rather than experimental.

**Why it exists:** During pre-v1.19 session 2, the user proposed that we trial sensor concepts informally before formalizing them, treating each dispatch as a proof-of-concept. This document structures that approach so that: (a) trials are traceable, (b) predictions are recorded and evaluable, (c) findings feed back into the roadmap, and (d) the whole process is legible to future readers displaced from this moment.

**Where it sits in the broader work:** This is part of pre-v1.19 deliberation. The 21 threads in `pre-v1.19-session-capture.md` are being developed with concrete evidence. The `cross-project-gsdr-adoption-audit-2026-04-02.md` was the first informal trial (cross-project health). This roadmap structures what comes next.

---

## Situational Context

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

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-02 | Initial roadmap created | Pre-v1.19 sensor trial planning, session 2 |

---

*This document is a living artifact. Changes are additive (new sections, updated predictions, evaluation notes) rather than destructive. The change log records what changed and why. Git history preserves the full trace.*
