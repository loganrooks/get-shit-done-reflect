---
date: 2026-04-09
audit_type: claim_integrity
scope: "Typed claim audit batch 2 -- cross-project CONTEXT.md claim analysis"
triggered_by: "deliberation: claim-type-ontology.md"
ground_rules: none
tags: [claims, claim-types, cross-project, batch-2]
---
# Claim Audit — Batch 2
**Date:** 2026-04-09
**Auditor:** Sonnet 4.6 (automated)
**Sources:** 24 CONTEXT.md files across 3 projects
- `/home/rookslog/workspace/projects/epistemic-agency/.planning/phases/` (phases 01–09)
- `/home/rookslog/workspace/projects/robotic-psalms/.planning/phases/` (phases 01–09)
- `/home/rookslog/workspace/projects/f1-modeling/.planning/phases/` (phases 01, 02, 02.1, 03, 03.1, 04)

---

## Method Note

No predefined claim types were imposed. Claims were read as they appeared, described in plain language, then grouped afterward. Some claims carry explicit epistemic markers (`[grounded]`, `[open]`) in the f1-modeling phase 03.1 file; all other claims are unmarked but epistemically significant. Both marked and unmarked claims are analyzed.

The groupings at the end name patterns observed across the corpus. Boundary cases are noted explicitly.

---

## Part I: Epistemic-Agency Claims

### EA-01 | Phase 01

**Claim:** "The system should separate a stable canonical source record from append-only capture-event history."

**Context:** Listed as a "rebuttable working hypothesis," not a final commitment.

**Epistemic work:** This claim establishes the architectural spine of the whole project. If wrong — if the distinction between stable record and event history is unnecessary or harmful — the schema, export model, and citation identity model all need revision. The claim is not grounded in existing code (the project is designing from scratch). It is a principled inference from how research citation works: you want a citable object that persists even as your interaction with it accumulates. The claim is aware of its own fragility; the challenge protocol around it is elaborate.

**Status:** Reasoned hypothesis. Internally motivated by design philosophy rather than observation of a prior failure. Explicitly marked as open to challenge.

---

**Claim:** "Canonical identity should be deterministic, using platform-native identity or normalized canonical URL, rather than fuzzy similarity-based merging."

**Epistemic work:** This rules out a whole design family (fuzzy merge) rather than picking among allowed options. The reasoning is implicit: fuzzy merge risks false conflation (two different papers or tweets treated as one), while deterministic identity risks duplication (same source saved twice). The file lists fuzzy auto-merge as an anti-pattern presumption with high burden of proof. So the claim does real gatekeeping work — it shapes what planning is even allowed to propose.

**Status:** Defensive assumption based on known failure mode (silent false merge). Not tested against data; argued from risk asymmetry.

---

**Claim:** "The repo packet should be a medium-grain research artifact: richer than a bookmark stub, lighter than a full operational dump."

**Epistemic work:** This is a design range claim rather than a precise specification. It rules out two extremes (too thin, too fat) without specifying the middle. It works as a decision criterion — proposals that fall outside the range are disqualified. But "medium-grain" is not operationally defined here; it becomes meaningful only through the open questions that follow (exact fields, provenance representation, etc.). The claim is actually a holding pattern that preserves optionality while asserting direction.

**Status:** Directional claim that bounds without resolving. Inherited from general research artifact norms rather than observed from a specific failure.

---

### EA-02 / EA-03 / EA-04 (shared pattern across phases 01–04, 06, 07, 07.1, 08)

**Recurring claim structure:** Each phase applies the same philosophical authority stack: Peirce (defeasible hypotheses), Popper (falsifiability), Lakatos (progressive revisions), Toulmin (claim/grounds/warrant/rebuttal), Duhem/Quine (minimal revision), Longino (independent criticism), Hacking (successful intervention), Cartwright/Simon (local adequacy). Phase 05 adds Ashby/Beer/von Foerster (variety) and Stiegler (proletarianization risk). Phase 07.1 adds Stiegler again (pharmakon framing for automation).

**Epistemic work:** This authority stack does not argue for particular design decisions. It functions as a protocol — a set of norms for how challenges, revisions, and tradeoffs should be handled. The philosophical references are not doing evidential work; they are naming virtues and naming known failure modes. Calling on Stiegler is a way of saying "automation risks de-skilling; don't forget this." Calling on Hacking is a way of saying "prefer interventions that actually change behavior, not only elegant theories." The stack is a rhetorical and normative device, not a source of design constraints.

**Status:** Meta-epistemic governance claim, not a first-order empirical or design claim. Not falsifiable directly. Functions as commitment to a process.

---

### EA-03

**Claim:** "The Phase 2 intake service and inbox remain the default operational target for Phase 3."

**Epistemic work:** This is a decision about dependency — Phase 3 builds on Phase 2 rather than replacing or bypassing it. The claim preserves an existing contract. Its importance: if Phase 3 were to silently route captures elsewhere, the "canonical inbox" guarantee would break without anyone noticing. The working hypothesis status signals awareness that Phase 3 might reveal that Phase 2's API boundary needs extension — the claim is not that Phase 2 is frozen, but that it is the anchor.

**Status:** Architectural continuity assumption. Grounded in existing design (Phase 2 was built). Not grounded in Phase 3 empirical evidence. Explicitly open to bounded revision.

---

**Claim:** "Selected-text capture should normally enrich the same canonical source record as the page or post it came from, rather than becoming a detached artifact."

**Epistemic work:** This decides a fundamental data-model question: is an excerpt a child of a source or an independent object? The claim goes against the simpler implementation (create a new record for every capture event) in favor of a more complex join (find-or-create the parent record, then append to it). If wrong — if in practice excerpts need to stand alone, or if parent record resolution fails silently — the claim damages citation integrity rather than protecting it.

**Status:** Inferred from research citation norms. Not tested against a running system. The open question on "same-source resolution" immediately below it signals awareness of the unresolved implementation problem.

---

**Claim (Phase 04):** "The main Phase 4 problem is not 'how to dump JSON into the repo.' It is how to preserve enough of what was seen when captured that later research use does not collapse back into brittle URL reopening."

**Epistemic work:** This reframes the whole phase. It shifts the success criterion from schema compliance to epistemic adequacy — can the exported artifact actually do the research work it's supposed to do? The claim is normative (about what the problem should be understood to be), not empirical. If the reframing is wrong — if JSON-in-the-repo really is sufficient, or if the actual bottleneck is elsewhere — then the phase will over-engineer fidelity at the cost of simpler wins.

**Status:** Interpretive claim about the nature of the problem. Argued from experience with research workflows. Not derived from a prior failure in this specific project (the project hasn't shipped phase 4 yet).

---

**Claim (Phase 05):** "Automate execution and structure maintenance more aggressively than judgment and evaluation."

**Epistemic work:** This is the central normative claim of the governance phase. It asserts that execution and structure are automatable in ways that judgment is not, and that confusing these is the primary failure mode. The claim could be wrong in either direction: maybe judgment is more automatable than assumed (reducing the cost of automation), or maybe execution and structure are less separable from judgment than assumed (making the distinction unworkable). The Stiegler reference names the failure mode explicitly (de-skilling).

**Status:** Principled hypothesis about the nature of cognitive labor in AI-assisted workflows. Partially grounded in the trace work referenced ("already surfaced in the repo's trace work"). Explicitly marked as challengeable.

---

**Claim (Phase 05):** "The project currently falls back to the global knowledge store at `~/.gsd/knowledge/` rather than a repo-local `.planning/knowledge/`."

**Epistemic work:** Unlike most claims in these files, this is a factual observation about current system behavior. It matters because the question of whether Phase 5 should activate a local store depends on knowing where the fallback currently points. The claim is not marked with any uncertainty hedge.

**Status:** Observed runtime fact. The only directly observable claim in this section. Could be verified by inspection.

---

**Claim (Phase 06):** "The setup surface should favor truthful observability over false certainty. It should distinguish what the system can actually observe from what it can only infer or ask the operator to confirm."

**Epistemic work:** This claim does two things: it asserts a value (truthfulness over apparent completeness), and it draws a distinction that shapes the entire setup surface design (observed vs. inferred vs. operator-confirmed). The distinction is not a technical requirement; it is an epistemological commitment carried over from the research-tool context (Phase 1's provenance distinctions). Its practical consequence is that the setup page must render categories of confidence, not just green/red.

**Status:** Normative commitment imported from the project's overall epistemic stance. Not derived from a failure in setup surface design specifically. Applied analogically from the source-record domain to the UX domain.

---

**Claim (Phase 07):** "Import should preserve source-native discrimination instead of replacing it. Safari folder path, subtree membership, import batch, observed title, and observed URL are not incidental metadata; they are part of the epistemic context of why something was saved."

**Epistemic work:** This makes a claim about what metadata means. Folder path is not just filing; it is a signal about the operator's intent and judgment at the time of saving. This claim elevates provenance to first-class status, which means any import design that flattens folder structure into a URL list fails on epistemic grounds, not only on completeness grounds. If wrong — if folder path is actually arbitrary or misleading in the operator's real workflow — then preserving it adds noise rather than signal.

**Status:** Inferred from general epistemological principles about context and intent. Not observed in a running system with real operators. Plausible but unvalidated.

---

**Claim (Phase 07.1):** "The audit did not show Phase 6 or Phase 7 to be conceptually wrong. The default response should therefore be targeted repair, not phase replay."

**Epistemic work:** This claim interprets an audit's findings and converts them into a repair strategy. It could be wrong in two ways: the audit findings might be more severe than interpreted (calling for larger redesign), or the audit's scope was too narrow to catch conceptual problems. The claim gates a whole phase's scope — it prevents the phase from expanding into a rewrite.

**Status:** Interpretive claim about audit findings. Grounded in a real audit that was conducted. But the inference from "audit did not show conceptual wrong" to "targeted repair is sufficient" involves a judgment about audit completeness that is not itself interrogated.

---

**Claim (Phase 07.1):** "Prior delegated planning confidence needs explicit caveat until re-audited. `sig-2026-03-19-codex-model-profile-mapping-missing` showed that earlier GSD delegated planning and research were not explicitly mapped to Codex-native `gpt-5.4 xhigh/high`."

**Epistemic work:** This is a meta-epistemic claim about the reliability of earlier claims. It downgrades the confidence status of prior work retroactively, based on a discovered gap in the planning infrastructure. The claim is specific: not that the earlier work was wrong, but that it was produced under unverified conditions. It does real work — it mandates re-grounding rather than inheriting confidence.

**Status:** Signal-grounded epistemic downgrade. The signal is cited and specific. The inference (prior work needs re-audit) is correct given the premise. This is one of the more epistemically rigorous moves in the corpus.

---

**Claim (Phase 08):** "'Intent-aware' should mean the system makes existing signals legible and useful... It should not mean that the system silently decides what matters."

**Epistemic work:** This defines a term. "Intent-aware" could mean many things — including autonomous ranking that acts on intent. The claim limits the term to transparency-preserving signal exposition. This matters because the implementation scope of Phase 8 depends on this definition: if intent-aware includes autonomous promotion, Phase 8 is a much larger and more risk-laden project.

**Status:** Definitional claim made as a normative constraint. Not derived from evidence about what "intent-aware" does or doesn't work. Motivated by the project's general stance against hidden judgment automation.

---

**Claim (Phase 09):** "Do not assume X bookmark access is viable just because the phase exists in the roadmap. The phase is conditional and may correctly end in deferral."

**Epistemic work:** This claim explicitly decouples plan existence from feasibility. The roadmap's inclusion of a phase is not evidence that the phase is doable — it is a placeholder pending research into X API constraints, auth burden, and maintenance cost. The claim is epistemically significant because it permits the research to conclude with a "no" rather than forcing a "yes."

**Status:** Meta-planning claim. Not a first-order claim about the world. Functions as permission structure for the researcher.

---

## Part II: Robotic-Psalms Claims

### RP-01

**Claim (Phase 01):** "Audio quality matters — espeak-ng + pedalboard may not be enough long-term."

**Epistemic work:** This is a design horizon claim. It signals that the current technical choices (espeak-ng for TTS, pedalboard for effects) are adequate for now but potentially limiting later. The claim doesn't commit to replacing them. It works to keep the language decision open (why rebuild the Python stack if the audio toolkit is already borderline?).

**Status:** Speculative concern, not an observed limitation. Grounded in general knowledge about TTS quality ceilings. Not tested against actual audio output from the system.

---

**Claim (Phase 01):** "User is genuinely open to a complete rewrite."

**Epistemic work:** This is a quoted user disposition ("can we start fresh here if we want"). It is the only first-person attestation in the RP corpus. It gates the whole phase: if the user were not open to a rewrite, the language research would be pointless. The claim grants permission rather than asserting a design fact.

**Status:** Directly quoted user statement. High reliability for the disposition it names. No inferential work required.

---

**Claim (Phase 02):** "Distinct exception types designed for programmatic consumption — the AI composer (Phase 6) needs to distinguish config validation errors from runtime processing crashes."

**Epistemic work:** This is a foresight claim: a Phase 2 decision is justified by Phase 6 requirements that don't exist yet. If Phase 6 never materializes, or if it doesn't need fine-grained exception discrimination, then the Phase 2 complexity is unnecessary overhead. The claim also assumes the AI composer will be reading exception types rather than exception messages — an assumption about the interface design of a future system.

**Status:** Forward-justified architectural claim. Coherent but speculative — it depends on Phase 6 design decisions that are not yet made. The dependency is implicit, not tracked as an assumption.

---

**Claim (Phase 02):** "Must be deployable and installable on other machines, including macOS ARM (M4 Mac)."

**Epistemic work:** This is a concrete deployment constraint, grounded in the user's explicit statement ("User wants the tool deployable on an M4 Mac they SSH from"). It is an observed requirement rather than an inferred design principle. It has downstream consequences: native dependency compatibility on ARM must be researched for pyworld, pedalboard, espeak-ng.

**Status:** Grounded in user statement. Observed requirement. Correctly flagged for follow-up research on ARM compatibility.

---

**Claim (Phase 03):** "The DSL grammar is the highest-risk decision in the entire project — 'prototype early, measure LLM generation success rate, keep YAML fallback.'"

**Epistemic work:** This is a risk prioritization claim drawn from prior research summaries ("SUMMARY.md"). It upgrades the grammar from a technical detail to a project-level risk. The claim motivates the explicit testing strategy (grammar-first TDD, prototype before formalizing). If wrong — if the grammar is actually low-risk, or if another decision is higher-risk — then the testing investment is misallocated.

**Status:** Risk assessment from project research artifacts. Not externally validated. The "highest-risk" designation is a judgment made internally to the project. Reasonable given that LLM generation reliability is unknowable without testing.

---

**Claim (Phase 03):** "The DSL is not just a notation format — it's the API surface for AI composition. Every design choice must consider: 'Can Claude reliably generate this syntax?'"

**Epistemic work:** This reframes the DSL from a user-facing format to a machine-to-machine interface. The claim has strong design consequences: it privileges machine generability over human readability (or at least requires both), and it makes LLM generation success rate a first-class evaluation criterion. If wrong — if the AI composer is unreliable regardless of syntax, or if human composers turn out to be the primary users — then the syntax design trade-offs are inverted.

**Status:** Design reframe based on project vision. Partially validated by the research comparing Alda, OMN, ABC notation, and LLM writability. Not validated against actual Claude generation attempts on the proposed syntax.

---

**Claim (Phase 03):** "The `[pitch:duration:dynamics]` triplet attached to syllables was recommended by combined analysis of Alda, OMN, ABC notation, and LLM writability research."

**Epistemic work:** This is a provenance claim — it names the basis for a specific syntax choice. The claim is important because it distinguishes this design decision from an arbitrary preference: it was derived from research. If the research was flawed or the LLM writability assessment was done informally, the confidence is overstated. The claim also doesn't say the triplet format was the best option, only that research recommended it.

**Status:** Research-derived syntax recommendation. The quality of the claim depends on the quality of the underlying research (FEATURES.md), which is not visible in this file.

---

**Claim (Phase 04):** "Default BPM if no `@tempo`: 72 (a natural adagio sacred music tempo, consistent with the Jóhannsson aesthetic)."

**Epistemic work:** This is a default value claim with aesthetic justification. The claim is doing design work: 72 BPM feels right for sacred/contemplative music in the Jóhannsson tradition, therefore it is a good default. The claim is neither empirical nor purely technical — it is an aesthetic judgment presented as a reasonable default. If the target users have different aesthetic sensibilities, the default is wrong.

**Status:** Aesthetic inference from project domain (sacred music, Jóhannsson). Low stakes as a default (overridable). Not validated against user preference.

---

**Claim (Phase 04):** "Config YAML as 'preset-like' defaults: This pattern enables a workflow where the user has a 'dark_machinery.yml' config and writes .psalm files that inherit those defaults but override specific values."

**Epistemic work:** This describes an anticipated workflow. The claim is not about what users currently do (no users yet) but about what the system will enable. It justifies the config-override design by reference to a plausible use pattern. The claim is speculative in the sense that actual users might not use this workflow, but it is coherent.

**Status:** Anticipated use pattern claim. Coherent design motivation. Unvalidated against actual user behavior.

---

**Claim (Phase 05):** "Orchestrator is the AI API: Phase 6's Claude Code /compose skill calls `orchestrator.compose()` programmatically. The orchestrator must be importable, must not print to stdout, and must return structured data. This is the critical architectural boundary."

**Epistemic work:** This treats a future integration contract as a present design constraint. The orchestrator's no-stdout, structured-return design is not about Phase 5 users; it is about Phase 6's agent. If Phase 6 is never built, or if it is built differently (e.g., via CLI subprocess rather than import), then the Phase 5 architectural constraint was unnecessary.

**Status:** Forward-justified architectural constraint. Phase 6 design decisions are documented and appear consistent. But the constraint is assumed, not negotiated with Phase 6 yet.

---

**Claim (Phase 05):** "7 bundled presets (sacred-themed, covering distinct aesthetic territories)." [followed by specific preset names and descriptions]

**Epistemic work:** The list of presets (ethereal_choir, dark_machinery, frozen_cathedral, etc.) is a design decision presented as a plan. The claim that these cover "distinct aesthetic territories" is an aesthetic judgment. The reference to "Jóhannsson reference sound" for ethereal_choir grounds the aesthetic in a named influence. This is not an epistemically weighty claim — it is a creative decision presented with light justification.

**Status:** Creative/aesthetic decision. Grounded in named aesthetic influences. Not empirically testable.

---

**Claim (Phase 06):** "Reliability target: >90% first-attempt valid DSL generation. If lower, the grammar reference and examples need improvement. Retries are a safety net, not the expected path."

**Epistemic work:** This is a threshold claim that creates a falsifiable success criterion. "90% first-attempt" is specific enough to test. The claim also implies a diagnostic: if generation fails, the grammar reference is the likely problem, not the model. This could be wrong — the model itself, prompt framing, or intrinsic DSL complexity might be the bottleneck regardless of grammar documentation quality.

**Status:** Quantified hypothesis. Testable. Falsifiable. The 90% figure appears to come from user expectation ("I feel like if it's lower than that, something is going wrong") rather than from benchmarking LLM code generation success rates.

---

**Claim (Phase 07):** "Always auto-analyze: Every render produces an analysis report alongside the audio. No opt-out — the agent always has acoustic ground truth. Adds ~1-2s per render."

**Epistemic work:** The "always" and "no opt-out" make this a strong policy claim. It is justified by the claim that the agent "always has acoustic ground truth." Two embedded assumptions: (1) audio analysis produces ground truth, and (2) the agent needs this ground truth on every render. If audio analysis is slow, unreliable, or produces misleading features, forcing it on every render is harmful. The 1-2s estimate is an inference from expected librosa performance, not a measured result.

**Status:** Policy claim justified by an assumed benefit (agent access to ground truth). Performance estimate is unverified. "Ground truth" is an overstatement — audio analysis features are proxies, not ground truth.

---

**Claim (Phase 07):** "Conservative threshold: 10 rated compositions (rated 4+) before the system starts narrowing parameter distributions."

**Epistemic work:** The 10-composition threshold is presented as conservative, but the basis for "10" is not stated. It could be too few (leading to premature convergence on early preferences) or too many (too slow to personalize). The "conservative" characterization reflects a preference for stability over responsiveness, but the threshold value is arbitrary.

**Status:** Threshold claim with weak justification. The direction (conservative/high threshold) is motivated; the specific value (10) is not. Testable in principle.

---

**Claim (Phase 08):** "Each voice gets a distinct `formant_shift_factor` offset from the base config: soprano +0.3, alto +0.1, tenor -0.1, bass -0.3."

**Epistemic work:** These are specific parameter values presented as defaults. The values presumably derive from audio production experience or musical knowledge about voice ranges. The claim does not explain why these specific values rather than others. They are presented as reasonable defaults that Claude has discretion to tune.

**Status:** Expert estimate or heuristic. Low epistemic weight — these are tunable defaults, not architectural commitments. Falsifiable in the sense that they may sound wrong in practice.

---

**Claim (Phase 09):** "Vocabulary-only refinement — No LLM dependency. Phase 7's aesthetic vocabulary (14+ terms) + taste canon interprets feedback. Works offline, zero cost, no API key required."

**Epistemic work:** This claim makes a product commitment: the TUI works entirely without an LLM. The claim is justified by pointing to Phase 7's vocabulary system. The implicit assumption is that the vocabulary is rich enough to cover most user feedback. If users regularly use terms outside the 14+ vocabulary and the mapping process is too cumbersome, the "vocabulary-only" design fails the user experience it promises.

**Status:** Design commitment with a testable failure mode. The vocabulary's adequacy is an empirical question (does 14+ terms actually cover most refinement feedback?). Not yet tested.

---

**Claim (Phase 09):** "Gradient intensity modifiers — Parse 'a little/slightly' (0.5x), 'more' (1.0x default), 'much more/very' (1.5x), 'extremely' (2.0x), 'less/reduce' (-1.0x), 'much less' (-1.5x) as multipliers on base vocabulary adjustments."

**Epistemic work:** These are specific multiplier values. The claim that "slightly" = 0.5x and "much more" = 1.5x is a quantitative specification of linguistic hedges. The values are clearly invented — there is no empirical basis for why "slightly" reduces effect by exactly half rather than by 30% or 70%. The claim is practical (the TUI needs to handle these modifiers somehow) but the specific values are arbitrary.

**Status:** Operational convention, not an empirically grounded claim. The values are arbitrary but not harmful — they provide a starting point for tuning.

---

## Part III: F1-Modeling Claims

### F1-01

**Claim (Phase 01):** "Build a local-first browser workspace backed by a numerical simulation-oriented core rather than a notebook-only or CLI-only tool."

**Epistemic work:** This is a product form decision. It rules out Jupyter notebooks and pure CLI tools and commits to a browser UI with a numerical backend. The justification is implicit: "engineering workbench" feel, inspectability, interactive visualization. If wrong — if the target users (PhD students, learners) actually work primarily in notebooks — the product form is mismatched to use patterns.

**Status:** Design commitment based on target experience goal. Not validated against user research. Coherent given the stated educational purpose.

---

**Claim (Phase 01):** "Visuals must remain honest to model support. Phase 1 should not imply trajectory fidelity, racing-line fidelity, or controller fidelity that does not yet exist."

**Epistemic work:** This is an honesty constraint. It prevents the UI from showing things the model doesn't support. The claim is normative and has clear implementation consequences: no racing-line overlays in Phase 1, no controller visualization. The constraint is motivated by the risk of misleading learners — educational software that implies more precision than the model has actively harms the learning goal.

**Status:** Normative constraint derived from educational purpose. Coherent and important. Could be challenged if users need visual placeholders for motivation even when the model is weak.

---

**Claim (Phase 02):** "The likely model is a quasi-steady-state or sector-based point-mass approach."

**Explicitly marked as working assumption requiring research.** Research should evaluate alternatives.

**Epistemic work:** This names a model family and frames research. The claim does not assert that QSS is correct; it asserts that QSS is the prior most likely to serve the transparency and intermediate-factor requirements. If research finds that QSS produces inadequate intermediate state for educational purposes, the claim should be revised. The claim is honest about its own status.

**Status:** Research-directing hypothesis. Explicitly provisional. Grounded in general knowledge of lap modeling approaches, not in project-specific data.

---

**Claim (Phase 02):** "Vehicle parameters must be labeled with provenance. Editable car parameters should indicate whether they come from regulation constraints, engineering estimates, or user overrides."

**Epistemic work:** This is a UI transparency requirement derived from the project's general epistemological stance. It requires distinguishing sources of parameter values, not just exposing the values. If implemented, it teaches users that parameter values come from different epistemological places (observed regulation, inferred engineering, personal experiment). If not implemented, the educational opportunity is lost and parameters appear equally authoritative regardless of their source.

**Status:** Derived normative constraint. Coherent with project goals. No evidence that this level of provenance display is standard in simulation UIs (it is not — this is ambitious).

---

**Claim (Phase 02):** "FastF1 provides track position data (x/y/z coordinates at ~240ms sampling) for circuits from 2018+."

**Epistemic work:** This is an empirical claim about a data source. It is specific and checkable. The claim appears in a context of deliberating about circuit data sources; its purpose is to license the use of FastF1 data for circuit geometry. If FastF1's coverage or resolution is inaccurate, the claim misleads the design.

**Status:** Empirical claim about an external data source. Origin appears to be the data-source deliberation document. Should be treated as "verified by researcher" not "verified by the author of this context file."

---

**Claim (Phase 02.1):** "The most likely approach is importing centerline data from the TUMFTM racetrack database (19 F1 circuits, ~3m spacing, GPS-derived from OSM)."

**Explicitly marked as working assumption.**

**Epistemic work:** This is a data-source hypothesis. It names a specific dataset and its properties. The claim is grounded in the data deliberation that produced specific observations: 19 circuits, CSV format, LGPL-3.0, last updated ~2020. The accuracy of these observations depends on the deliberation.

**Status:** Research-grounded assumption. More specific than the Phase 02 model assumptions because the data source properties are verifiable facts about an existing dataset.

---

**Claim (Phase 02.1):** "The curvature arrays driving the lap model physics are adequate (lap times within 6-10% of reality)."

**Epistemic work:** This is an empirical performance claim about the existing model. "6-10% of reality" is specific and implies validation against real F1 lap times. The claim is the basis for scoping Phase 2.1 as visualization-only (the physics doesn't need fixing, only the geometry). If the 6-10% figure is wrong — if the model is actually 20% off or better than 6% — the scope decision changes.

**Status:** Measured outcome from the Phase 2 implementation. Appears to be a result from regression tests mentioned elsewhere. Higher epistemic weight than most claims in this corpus because it seems to be tested, not inferred.

---

**Claim (Phase 03):** "A phenomenological tire model is appropriate for this educational platform — grip as a function of compound identity, wear state, and thermal state, with cliff thresholds per compound. Not a full Pacejka, Brush, or thermomechanical model — those are v2 fidelity."

**Epistemic work:** This scopes the tire model by naming what is excluded and why. The justification is explicit: educational transparency requires a model that can be explained, and full physics-based tire models (Pacejka, Brush) are too opaque for the learning goal. The claim rules out entire model families for principled reasons. If wrong — if learners actually need to see Pacejka behavior to understand tire dynamics — the model undershoots educational value.

**Status:** Educational philosophy claim applied to model selection. Grounded in project scope and teaching goal rather than in tire modeling literature. Appropriate given the stated audience.

---

**Claim (Phase 03):** "2026 regulations significantly increase electrical energy contribution."

**Epistemic work:** This is a factual claim about F1 technical regulations. It motivates spending a whole subsystem section on electrical dynamics that prior seasons might not have required. If the regulation claim is wrong or overstated, the modeling investment is misallocated. The claim is presented as background fact without citation.

**Status:** Regulatory fact presented without citation. Should be verifiable from FIA 2026 technical regulations. Reasonable confidence given that the 2026 regulations are a documented public domain fact.

---

**Claim (Phase 03):** "Weather transitions happen at the lap timescale as interpolated state changes rather than step functions."

**Epistemic work:** This makes a modeling resolution choice: weather evolves gradually within a session rather than switching suddenly between laps. The claim is physically motivated (real weather changes continuously), but it is also a simplification (transitions are modeled as interpolations, not as full atmospheric physics). The claim shapes how many state variables the weather model needs and how it interacts with the tire and track-surface models.

**Status:** Modeling resolution choice. Physically motivated but still a simplification. Not derived from F1 weather data or meteorological modeling practice.

---

**Claim (Phase 03.1, marked `[grounded]`):** "A race plan is naturally an ordered array of stint specifications — each specifying compound, electrical policy, and lap count."

**Epistemic work:** This is marked `[grounded]` in the source file, citing the existing `StintRunner` interface. The claim asserts that the race plan structure follows directly from the existing code structure — stints are already the unit of computation, so a race is naturally an array of stints. This is genuinely grounded: the inference from code structure to data structure is tight.

**Status:** Codebase-grounded architectural claim. High confidence. The only limitation: "natural" doesn't mean "sufficient" — the Phase 3.1 open questions include whether the array-of-stints model handles all needed scenarios.

---

**Claim (Phase 03.1, marked `[open — downgraded from grounded after Opus audit]`):** "Pit events are time-loss modifiers at stint boundaries."

**Epistemic work:** This claim was originally marked grounded but was downgraded by an Opus audit agent. The audit noted: no pit-related code exists in the codebase, so the "reduced-order time-loss approach" is an inference, not a codebase observation. The downgrade is epistemically correct.

**Status:** Contested claim. Original status (grounded) was an epistemic error — it confused a modeling direction with an existing implementation. The Opus audit's correction is a notable example of cross-agent epistemic checking working as designed.

---

**Claim (Phase 03.1, marked `[open — downgraded from grounded after Opus audit]`):** "Run lineage via parent pointer and branch point."

**Epistemic work:** Original claim asserted that adding optional fields to the run record schema would implement lineage. Opus audit noted that the schema uses `.strict()` mode, which means adding fields requires a proper schema modification, not just appending. The audit also questioned whether a simple parent pointer is sufficient for multi-level branches. The downgrade is correct — the original claim laundered a design option into an existing code fact.

**Status:** Contested claim. The Opus audit catches a category error: the claim confused schema flexibility with schema extension. Epistemically important — it shows that `[grounded]` labels can themselves be wrong.

---

**Claim (Phase 03.1, marked `[split]`):** "Race interruptions as injectable timeline events."

**Epistemic work:** The Opus audit split this: the injection mechanism is genuinely grounded (the roadmap says "injected at specified laps"), but the internal representation (timeline events vs. scenario-level configuration vs. state modifiers) is open. The split verdict is epistemically careful — it separates the observable requirement from the design choice.

**Status:** Partially grounded. The observable constraint (roadmap requirement) is firm. The implementation design is genuinely open. The split verdict is the most epistemically precise handling of any claim in this corpus.

---

**Claim (Phase 03.1, marked `[grounded]`):** "Each stint produces its own artifact set within a race-level container."

**Epistemic work:** Marked grounded based on the existing artifact system (which supports multiple named artifacts per run). The inference: if stints already produce 4 artifact types, a race would naturally produce per-stint sets plus a race-level container. This is a reasonable structural extension, but "grounded" may overstate — the race-level container doesn't exist yet.

**Status:** Reasonably grounded by analogy. The artifact system is real; the race container is the proposed extension. "Grounded" is slightly optimistic but not wrong.

---

**Claim (Phase 04):** "Hand-rolled SVG served Phases 1-3 but will not scale to strategy timelines, linked views, branch comparisons, and explanation surfaces."

**Epistemic work:** This is a technical scalability claim. It asserts that the existing visualization approach has a ceiling that Phase 4 will hit. The claim is grounded in an audit finding (mentioned as "the audit mandates a visualization library deliberation"). It does not specify exactly what "will not scale" means — is it performance, development velocity, expressiveness, or maintainability? The claim is motivating a whole architectural decision (library adoption) on the basis of an asserted ceiling.

**Status:** Audit-grounded scalability claim. The claim is reasonable given that hand-rolled SVG lacks linked views, brushing, and overlay composition. But "will not scale" is a prediction, not a measurement.

---

**Claim (Phase 04):** "The existing SensitivityWaterfall could be extended into a 'Strategy Attribution Waterfall' showing factor-by-factor contributions to total race-time delta between two strategies."

**Epistemic work:** This is an implementation suggestion about reuse. It asserts that the waterfall chart's design generalizes from single-parameter sensitivity to multi-factor race-time attribution. The claim motivates reuse rather than rebuilding. If the waterfall's design is too specific to single-lap sensitivity, the extension may require significant refactoring rather than light extension.

**Status:** Reuse hypothesis. Coherent design suggestion. Not tested against the actual waterfall implementation.

---

## Part IV: Groupings

Reading across all 24 CONTEXT.md files, six distinct epistemic functions emerge. A seventh handles boundary cases.

---

### Group 1: Working Hypotheses With Explicit Challenge Protocols

These claims are stated as provisional, carry explicit challenge conditions, and name failure modes that would require revision. They do the most epistemically virtuous work in the corpus: they hold design space open while giving downstream work concrete targets to test.

Examples:
- All epistemic-agency "rebuttable working hypotheses" (EA-01 through EA-09)
- F1-modeling model class claims ("The likely model is a quasi-steady-state approach")
- F1-modeling data source claims in Phase 02.1

Distinguishing feature: the claim's own fragility is surfaced alongside the claim. The challenge protocol is not decorative — it specifies what would count as a successful challenge and what the challenge must provide.

---

### Group 2: Boundary-Preserving Constraints (Scope Gates)

These claims don't argue for a design; they rule out designs. They work by establishing what a phase must not do, and they often carry anti-pattern lists. Their epistemic work is negative: preventing scope creep, preventing premature closure on later decisions.

Examples:
- "This phase does not include Chrome parity / repo export / multi-user sync" (EA-03)
- "Do not import the entire Safari backlog into canonical sources automatically" (EA-07)
- "Phase 3 should not add strategy comparison, explanation views, qualifying/sprint modes" (F1-04)
- "The DSL compiler (Phase 4) does not resolve `@preset` directives — Phase 5 defers this" (RP-04)

Distinguishing feature: they constrain by exclusion. The epistemic risk is a false boundary — a scope gate that closes off needed design space prematurely.

---

### Group 3: Forward-Justified Architectural Claims

These claims justify Phase N design decisions by reference to Phase N+1 requirements that haven't been built yet. They are common in robotic-psalms (exception hierarchy justified by AI composer needs; orchestrator no-stdout justified by skill import requirements) and f1-modeling (circuit format justified by Phase 5 trajectory computation).

Examples:
- "Exception types designed for programmatic consumption — the AI composer needs to distinguish error types" (RP-02)
- "Orchestrator must not print to stdout and must return structured data — Phase 6 calls it" (RP-05)
- "Circuit format chosen in Phase 2 must support Phase 5's trajectory optimization" (F1-02)
- "Phase 3.1 artifacts must carry enough state for Phase 4.1's observer layer" (F1-03.1)

Distinguishing feature: the claim's warrant is a future requirement, not current evidence. If the future phase is never built or is built differently, the constraint was unnecessary. These claims do more work in projects with tightly chained phase dependencies.

---

### Group 4: Empirical Observations (Rare)

These are claims that describe how something actually is — a tool's behavior, a dataset's properties, a model's measured performance. They are the rarest type in this corpus, appearing mainly in f1-modeling and one spot in EA-05.

Examples:
- "The project currently falls back to `~/.gsd/knowledge/`" (EA-05)
- "FastF1 provides track position data at ~240ms sampling for circuits from 2018+" (F1-02)
- "TUMFTM racetrack database: 19 F1 circuits, CSV format, ~3m spacing, LGPL-3.0, last updated ~2020" (F1-02.1)
- "Lap times within 6-10% of reality" (F1-02.1)
- Phase 03.1 `[grounded]` claims based on existing TypeScript code

Distinguishing feature: falsifiable by checking, not by argument. Most claims in these files are not in this group — they are inferences, design choices, or normative commitments. The empirical claims stand out by being the most checkable.

---

### Group 5: Normative/Epistemic Commitments

These claims assert how the project should think, not what it should build. The philosophy stack (Peirce, Popper, Lakatos, etc.) falls here. So do claims about truthfulness in UX ("the setup surface should favor truthful observability over false certainty"), claims about epistemic laundering ("clients should not smuggle inference into the raw capture payload"), and claims about automation risk ("automate execution more aggressively than judgment").

Examples:
- The Peirce/Popper/Lakatos/Toulmin authority stack (across all EA phases, F1 phases)
- "The setup surface should distinguish observed from inferred from operator-confirmed" (EA-06)
- "Capture clients should send observed source facts, not invent higher-level interpretation" (EA-03)
- "Automate execution and structure maintenance more aggressively than judgment" (EA-05)
- "Visuals must remain honest to model support" (F1-01)

Distinguishing feature: these claims are not falsifiable in the usual sense — you can't run an experiment that refutes "prefer truthful observability." They function as design virtues or project ethics. Their failure mode is not being wrong but being inconsistently applied.

---

### Group 6: Threshold and Specification Claims (Quantified But Weakly Grounded)

These claims assign specific numbers to fuzzy concepts — refinement multipliers, taste-evolution thresholds, voice formant offsets, LLM generation success rates. The numbers are specific enough to appear precise, but their justification is either absent, aesthetic, or derived from user expectation rather than measurement.

Examples:
- "Gradient intensity modifiers: 'slightly' = 0.5x, 'much more' = 1.5x" (RP-09)
- "Conservative threshold: 10 rated compositions before narrowing parameter distributions" (RP-07)
- "Soprano +0.3, alto +0.1, tenor -0.1, bass -0.3 formant offset" (RP-08)
- "Reliability target: >90% first-attempt valid DSL generation" (RP-06)
- Default BPM of 72 (RP-04)

Distinguishing feature: specific value with weak or absent warrant. These claims are not wrong to make — you need starting values — but they should be treated as provisional calibration rather than principled conclusions. The 90% reliability target is the best-grounded (it comes from an explicit user expectation). The multipliers and offsets are simply reasonable guesses.

---

### Group 7: Interpretive Claims About Prior Work

These claims don't assert design facts but interpret audit results, signals, or prior phase work. They convert external findings into phase-scoping decisions.

Examples:
- "The audit did not show Phase 6/7 to be conceptually wrong; targeted repair, not phase replay" (EA-07.1)
- "Prior delegated planning confidence needs explicit caveat" (EA-07.1, EA-08)
- The Phase 03.1 Opus audit downgrades: `[open — downgraded from grounded after Opus audit]` on pit events, run lineage, tire inventory

Distinguishing feature: the claim's warrant is a meta-level evaluation (of an audit, a signal, a prior session's work). These claims are interesting because their error mode is interpretive — the audit findings might be correctly reported but incorrectly applied.

---

## Part V: Cross-Corpus Observations

### The [grounded]/[open] System (F1-modeling Phase 03.1 only)

Only f1-modeling Phase 03.1 uses explicit epistemic markers. The Opus audit's interventions are notable: three claims were downgraded from `[grounded]` to `[open]` based on code inspection. This is the most rigorous epistemic accounting visible in the entire corpus. The EA and RP files make no such distinctions formally, relying instead on "working hypothesis" language and challenge protocols.

The system works better here than in most CONTEXT.md files because: (1) the audit is external and cross-agent, (2) it cites specific code evidence for the downgrades, (3) it produces a split verdict on the interruptions claim rather than a binary.

### Philosophical Authority as Governance vs. Argument

In EA phases 01–09 and the F1 modeling phases, the philosophy stack (Peirce, Popper, etc.) appears consistently. It never functions as evidence for a specific claim. Its function is institutional: it names the norms the project has committed to follow for challenge and revision. This is not a deficiency — it is a different kind of epistemic work (governance) — but readers should not mistake the philosophical citations for evidential support.

### Forward-Justification Load in Robotic Psalms

The RP files carry the highest density of forward-justified claims: Phase 2 decisions are justified by Phase 6 requirements, Phase 3 decisions by Phase 6's LLM generation needs, Phase 4 by Phase 6's import pattern, Phase 5 by Phase 6's programmatic API. This creates a tight dependency chain where Phase 6 failures would retroactively undermine multiple prior design decisions. The chain is coherent within the project's vision, but the vision itself has not been tested.

### Boundary Between Groups 1 and 3

Working hypotheses (Group 1) and forward-justified constraints (Group 3) overlap at the boundary: many forward-justified claims are also stated as working hypotheses. The distinction is about what the warrant is — a challenge protocol based on design criteria (Group 1) vs. a requirement from a downstream phase (Group 3). Some claims appear in both: "Orchestrator must not print to stdout" is both a hypothesis about what makes good architecture and a claim grounded in Phase 6's anticipated import pattern.

### Scarcity of Empirical Claims

Across all 24 files, empirical claims are extremely rare. The F1-modeling files have the most (lap time within 6-10%, FastF1 data properties, TUMFTM database properties). The EA and RP files have almost none. This is not unexpected — these are planning documents, not research reports — but it does mean that the vast majority of claims in these files are not checkable against evidence without implementing the system.

---

*Audit complete.*
*24 CONTEXT.md files read. All significant claims analyzed. No predefined categories imposed.*
