# Exploratory Epistemic Claim Audit
**Date:** 2026-04-09
**Scope:** All CONTEXT.md files in `.planning/phases/`
**Method:** Read every file, extract epistemically significant claims, describe what work each claim does, then look for natural groupings

---

## Part I: Individual Claim Analysis

The following are claims that have explicit epistemic markers (`[grounded]`, `[open]`, `[working assumption]`), plus claims that are doing significant epistemic work even without markers — strong assertions, design commitments, inherited assumptions, things taken for granted that shape subsequent work.

---

### Phase 00 — Deployment Infrastructure

**Claim 1 (00):** "Install works exactly like upstream GSD (overwrite files in ~/.claude/)"
*Epistemic work:* This is a design mandate stated as settled fact. It forecloses alternatives (differential installs, conflict detection) before they are considered. Someone decided this; it's not discovered from the domain. If it's wrong — if users actually want conflict handling — the entire install story changes. This is a design decision wearing the clothes of a description.

**Claim 2 (00):** "Both mock tests (fast, deterministic) AND real agent tests (actual API calls)"
*Epistemic work:* A dual-mode testing philosophy stated as a resolved choice. The rationale ("tests serve dual purpose: catch regressions AND document behavior") is explicit but brief. The claim is doing the work of constraining subsequent implementation — it rules out test-only-mocks and test-only-real. Someone thought this through; it's a decided position.

**Claim 3 (00):** "Mac/Linux only — Windows support not required for dev workflow"
*Epistemic work:* An explicit scope exclusion. This is an empirical bet (Windows users won't need dev workflow) or a deliberate prioritization. The claim removes a whole class of future problems from the planning horizon. If it's wrong, nothing explodes immediately, but tech debt accumulates. Interestingly, no justification is given — it's stated as clean fact.

---

### Phase 01 — Knowledge Store

**Claim 4 (01):** "No time-based decay — time is a poor heuristic for relevance. A principle is just as relevant after 6 months; a workaround becomes irrelevant when the bug is fixed, not when time passes"
*Epistemic work:* This is a philosophical stance masquerading as a design decision. It encodes a theory of knowledge — what makes a belief stale — and uses that theory to reject a common implementation pattern. The claim is doing heavy epistemic lifting: it defines relevance as contextual and contingency-based rather than temporal. If this theory is wrong (if time IS a useful proxy for staleness in practice), the entire KB lifecycle model needs rethinking. The claim is confident, clearly deliberated, and philosophically grounded, but it's still a bet.

**Claim 5 (01):** "No hard caps — no 50/200 entry limits. If the KB outgrows flat-file storage, evolve the storage layer"
*Epistemic work:* A bet about future growth trajectories combined with a commitment to technological evolvability. The implicit assumption is that storage migration is easier than losing knowledge prematurely. This assumption is plausible but not validated. The claim is doing the work of deferring a hard problem (pruning) while keeping optionality.

**Claim 6 (01):** "Relevance is contextual — an entry's relevance depends on the current query/situation, not the entry itself. Static relevance scores are not stored on entries"
*Epistemic work:* A theoretical claim about the nature of relevance that has direct implementation consequences. It rules out a whole class of approaches (pre-computed scores, TF-IDF on write). The claim is doing architectural reasoning from epistemological premises. Importantly, this is not observed — it's a philosophical commitment.

**Claim 7 (01):** "Open design problem: pruning model — when entries eventually need pruning, the right heuristic is unknown. Candidates include retrieval frequency, cross-project usage, durability class, demonstrated value. Deferred until real data exists"
*Epistemic work:* Explicit acknowledgment of an open question. This claim is notably honest: it names the problem, lists candidate solutions, explains why none are chosen, and gives a condition for resolution. This is epistemic humility in action.

**Claim 8 (01):** "The store is a dumb-but-well-organized filing cabinet. The intelligence lives in the agents that read from it."
*Epistemic work:* An architectural metaphor that functions as a design constraint. It's doing the work of preventing scope creep — keeping the KB "dumb" means any clever retrieval logic must live elsewhere. The claim is a heuristic for future decisions, not an empirical finding.

---

### Phase 02 — Signal Collector

**Claim 9 (02):** "All retries are signals — even successful retries indicate something unexpected and are worth persisting"
*Epistemic work:* A detection policy that encodes a theory: the occurrence of retrying, not just failure, is informative. This is a non-obvious position. If it's too sensitive (generates noise), signal collection loses signal-to-noise ratio. The rationale is implicit — "something unexpected" — but the theory is clear.

**Claim 10 (02):** "Debugging struggles defined as: multiple failed attempts (3+), disproportionately long tasks, AND workaround solutions (not clean fixes)"
*Epistemic work:* An operational definition that translates a fuzzy concept ("struggle") into measurable criteria. The "3+" threshold is an arbitrary but necessary choice — 2? 5? The claim is doing definitional work, converting a qualitative observation into a quantifiable trigger. The number itself is not derived from evidence.

**Claim 11 (02):** "Incomplete execution is a signal only when the reason indicates a problem — not when user simply paused"
*Epistemic work:* A distinction that requires agent judgment about intent. The claim assumes agents can reliably distinguish "paused" from "blocked" — an assumption about agent capability that is not validated. If agents can't make this distinction, the policy produces noise or misses signals.

**Claim 12 (02):** "Strict additive-only — user does not maintain upstream repo, so no upstream file edits; wrapper pattern required"
*Epistemic work:* A constraint derived from a factual claim ("user does not maintain upstream repo") but treated as absolute. It shapes all of Phase 2's design. The claim is doing architectural work: all signal collector functionality must flow through it. It's not empirically questionable — it reflects a project constraint — but it's a very strong rule.

---

### Phase 03 — Spike Runner

**Claim 13 (03):** "Spikes produce FINDINGS, not DECISIONS. Existing GSD layers (CONTEXT.md for user decisions, RESEARCH.md for technical recommendations) make decisions based on spike findings."
*Epistemic work:* A separation of concerns stated with intensity (capitals). This is an architectural principle that divides epistemic labor: empirical investigation is separated from normative judgment. If spikes bleed into decisions, the workflow becomes muddy. The claim is doing boundary-work.

**Claim 14 (03):** "Maximum 2 rounds per spike (prevents rabbit holes)"
*Epistemic work:* An anti-scope-creep mechanism encoded as a rule. The number 2 is arbitrary but necessary — why not 3? The rationale "prevents rabbit holes" is practical but not evidence-based. The claim is a commitment device that sacrifices optimality (maybe round 3 would have found the answer) for tractability.

**Claim 15 (03):** "One spike = one question. Comparative questions (A vs B vs C) are one spike with multiple experiments, not multiple spikes."
*Epistemic work:* An ontological claim about spike individuation — what makes a spike one spike vs many. The rule prevents proliferation but introduces ambiguity (when does a question become multiple questions?). The claim is doing definitional work.

**Claim 16 (03):** "If still inconclusive after Round 2: Document honestly: 'No clear winner.' Proceed with default/simplest approach. Still valuable — learned there's no empirical differentiator."
*Epistemic work:* A remarkable epistemic move: the claim reframes inconclusive results as positive information. "Learned there's no empirical differentiator" converts failure into finding. This is a healthy epistemic stance — it prevents endless investigation while preserving value.

---

### Phase 04 — Reflection Engine

**Claim 17 (04):** "Severity-weighted thresholds — not a single number. Critical/high-severity signals: 2 occurrences enough to surface pattern; Lower-severity signals: 5+ occurrences needed"
*Epistemic work:* The numbers 2 and 5 are chosen, not derived. The rationale is stated ("can't risk missing something dangerous," "filter noise") but the specific thresholds are arbitrary. This claim is doing the work of operationalizing "important" — converting severity into detection sensitivity. If the numbers are wrong, critical patterns get missed or noise floods the reflector.

**Claim 18 (04):** "No simple rolling window — too simplistic for real-world patterns. Must handle infrequent but persistent issues"
*Epistemic work:* A rejection based on a theoretical deficiency rather than empirical evidence of failure. The claim argues that time windows can't capture patterns that recur across versions over months. The reasoning is sound but the claim is still a design assertion, not an observed fact. If the patterns in practice are actually time-bounded, a rolling window would have sufficed.

**Claim 19 (04):** "The system should never make the same mistake twice — that's the core value proposition"
*Epistemic work:* This is the mission statement masquerading as a design constraint. It functions as a regulative ideal — a standard that decisions are measured against. It's not strictly falsifiable (how do you know you've made the same mistake twice?), but it focuses effort. The claim is aspirational more than descriptive.

**Claim 20 (04):** "Signals start project-scoped, scope determined at lesson distillation when we understand the pattern. Global scope indicated by: references named library/framework, root cause is external, would affect any project using similar tech stack"
*Epistemic work:* A classification theory for scope assignment. The heuristics are stated with confidence but they're rules of thumb. A signal about "npm has bug X" feels like it should be global — but what if it's only a bug in the version this project uses? The heuristics can misfire. The claim is doing the work of operationalizing "global."

---

### Phase 05 — Knowledge Surfacing

**Claim 21 (05):** "Mechanism: Agent-initiated (USER DECISION). Agents explicitly query the knowledge base using Read/Grep on knowledge base paths. No auto-injection into agent prompts."
*Epistemic work:* A design decision labeled as USER DECISION — which is a strong marker that this was contested or deliberated. The claim encodes a philosophical stance: agents should actively seek knowledge rather than have it thrust upon them. The alternative (auto-injection) is explicitly rejected. If agents fail to query the KB, knowledge surfacing fails silently — the USER DECISION label acknowledges this is a risk the user accepted.

**Claim 22 (05):** "Freshness model: NOT time-based. Knowledge entries have depends_on flags that track what could invalidate the entry. Core principle: code changes invalidate lessons, not the passage of time (USER INSIGHT)."
*Epistemic work:* The "(USER INSIGHT)" marker is the strongest epistemic flag in the document — it labels this as a non-obvious observation someone made, not a design choice. The claim is doing the same work as Claim 4 (Phase 01) but with more intensity. The theory is: relevance is about logical dependency, not temporal distance. If this theory fails in practice (if time IS a useful proxy because dependencies are hard to track), the KB surfacing model breaks.

**Claim 23 (05):** "What gets surfaced: Only distilled knowledge (lessons from reflection, spike decisions). Raw signals are NOT surfaced — they're unprocessed noise. That's what the reflection engine is for."
*Epistemic work:* A sharp boundary between raw and processed knowledge. The claim does the work of protecting agents from signal noise, but it also means agents can't see recent signals that haven't yet been reflected upon. The claim is a bet that distilled knowledge is more useful than raw signals — a plausible bet, but one that could fail for very recent, time-sensitive issues.

**Claim 24 (05):** "Progressive disclosure (OPEN DESIGN QUESTION): Should surfacing use an explicit two-tier model?"
*Epistemic work:* An honest acknowledgment of an open design question. The parenthetical marks the boundary of decided vs undecided. The claim preserves optionality while naming the uncertainty.

**Claim 25 (05):** "Ranking method: Agent LLM judgment. Agent reads one-liner summaries from the index and uses judgment to rank. Tag overlap count is brittle — LLMs are better at semantic relevance."
*Epistemic work:* A claim about LLM capability that is asserted with confidence but not validated. The claim rules out algorithmic ranking in favor of learned judgment. If LLM ranking is systematically biased or inaccurate for this task, the surfacing degrades. The assertion "LLMs are better at semantic relevance" is probably true but is not tested here — it's inherited from the broader ML conversation.

---

### Phase 06 — Production Readiness

**Claim 26 (06):** "Health check frequency is configurable via initialization questions: milestone-only (default), on-resume, every-phase, or explicit-only"
*Epistemic work:* A design decision about defaults. "Milestone-only" as default reflects a judgment about the right tradeoff between noise and coverage. If projects typically encounter workspace health issues mid-phase, the default is wrong. The claim is a calibration decision.

**Claim 27 (06):** "Version check is NOT part of health check — update checking stays in /gsd:update"
*Epistemic work:* A scope decision that keeps two concerns separate. The claim is doing architectural boundary work — preventing feature creep of the health check system. Reasonable, but the decision was made on principle rather than user research about how users actually encounter version mismatches.

**Claim 28 (06):** "Identity: 'An AI coding agent that learns from its mistakes' — the learning loop is the core value prop"
*Epistemic work:* A brand claim that doubles as a philosophical commitment. It defines what the fork IS, which constrains what it should and shouldn't do. The claim is doing identity work that shapes scope decisions downstream.

---

### Phase 07 — Fork Strategy Pre-Merge Setup

**Claim 29 (07):** "Default merge stance is case-by-case: no blanket 'upstream wins' or 'fork wins' rule"
*Epistemic work:* A meta-policy about how to handle merge conflicts. It's a principled rejection of simpler policies (which would be easier to execute but less accurate). The claim requires ongoing judgment, which means it's more demanding — and more likely to be violated when time pressure exists.

**Claim 30 (07):** "Lean towards preserving everything fork-specific, but with pragmatism: 'there are ways to harmonize and we may choose to adapt because their implementation is better'"
*Epistemic work:* A default preference with an override condition. The claim is doing tiebreaker work — when the case-by-case judgment is genuinely unclear, preserve fork-specific. The embedded quote marks "their implementation is better" as contested — better according to what standard? This is an acknowledged ambiguity.

---

### Phase 08 — Core Merge

**Claim 31 (08):** "Fork package names are inviolable: Any reference to package names, URLs, or install commands must use fork identity. Never let upstream names slip through in any file."
*Epistemic work:* A hard constraint stated with intensity ("inviolable," "Never"). This is a value commitment, not a preference — it treats identity preservation as non-negotiable. If upstream names slip through, users get confused or install the wrong thing. The claim is doing integrity work.

**Claim 32 (08):** "Ghost reference cleanup: expected to find nothing (upstream reverted their memory system)"
*Epistemic work:* A factual prediction about what the grep will find. The claim is doing preparatory work — setting expectations so that finding nothing is a success signal, not a failure to check. If it's wrong and ghost references exist, the prediction correctly frames them as problems rather than noise.

**Claim 33 (08):** "FORK-DIVERGENCES.md estimates 12 conflicting files, but the actual count depends on what upstream changed in overlapping regions" (Open Question)
*Epistemic work:* Explicit acknowledgment that the estimate is a projection with real uncertainty. The claim doesn't pretend to know the answer — it names the unknown and defers resolution to execution. Honest, and properly calibrated.

---

### Phase 09 — Architecture Adoption

**Claim 34 (09):** "Proactive migration: Review all upstream-originated workflow files and proactively add fork customizations where relevant, not just fix-on-failure."
*Epistemic work:* A policy that anticipates future integration problems. It's more expensive than fix-on-failure but reduces technical debt. The rationale is engineering judgment about tradeoffs, not empirical data about how often reactive fixes cause problems.

**Claim 35 (09):** "'Replace with fork equivalents' — upstream references don't just get stripped, they get replaced. The fork should feel like its own product, not a partially-de-branded upstream."
*Epistemic work:* An identity-preservation principle that shapes what "correct" means for reference replacement. The claim is doing quality criteria work — defining the standard for completeness. If the standard is wrong (if partial de-branding is actually fine for users), effort is wasted. But if it's right, consistency builds trust.

**Claim 36 (09):** "Fork-only commands should follow the same thin orchestrator architecture as upstream commands — consistency matters even though they weren't affected by the merge."
*Epistemic work:* A consistency principle that extends upstream architectural patterns to fork-specific code. The rationale is implicit: consistency reduces cognitive load. The claim is doing normative work — defining what "good" architecture looks like for the fork.

---

### Phase 10 — Upstream Feature Verification

**Claim 37 (10):** "All user-visible output must show GSD Reflect branding — upstream branding leaking through is a bug"
*Epistemic work:* A definitional claim that reframes a quality issue as a defect. By calling it "a bug," the claim elevates branding consistency to the same priority as functional correctness. This is a value commitment dressed as a quality standard.

**Claim 38 (10):** "User trusts Claude to determine appropriate polish/adaptation level per feature rather than rigid equal standard"
*Epistemic work:* An explicit delegation of judgment. The claim records the scope of autonomy granted. It's important because it prevents over-interpretation — Claude shouldn't apply maximum polish everywhere just to be safe. The claim calibrates effort expectations.

---

### Phase 11 — Test Suite Repair

**Claim 39 (11):** "Test count target (42+): coverage quality matters more than raw count; okay to drop below 42 if equivalent coverage exists via updated/upstream tests"
*Epistemic work:* A principle that subordinates a metric (count) to a value (coverage quality). It's a healthy epistemic move — metrics that become targets lose validity. The claim explicitly names this principle. But "equivalent coverage" is itself difficult to measure — the principle may be harder to apply than it sounds.

**Claim 40 (11):** "All 63 upstream gsd-tools tests are required, not advisory — Upstream test failures: must all pass"
*Epistemic work:* A hard constraint that elevates upstream tests to blocking status. The claim does the work of setting a completion criterion. The implicit reasoning: if upstream tests fail, the upstream architecture wasn't correctly adopted.

---

### Phase 12 — Release and Dogfooding

**Claim 41 (12):** "The merge prediction accuracy (8 actual vs 11 predicted conflicts) is a particularly valuable signal — captures how risk assessment calibrated during execution"
*Epistemic work:* A meta-observation about prediction quality. The claim treats the gap between prediction and reality as information about the quality of risk assessment processes, not just as an incidental outcome. This is genuinely reflective — using the sync experience to evaluate the quality of planning methodology.

**Claim 42 (12):** "Objective tone — acknowledge tradeoffs of both approaches, not advocacy for our choice" (about KB comparison document)
*Epistemic work:* A methodological commitment for a specific artifact. The claim is trying to prevent motivated reasoning in the comparison document. Whether the comparison is actually objective is a separate question — but the aspiration is explicitly named and constrains the writing.

**Claim 43 (12):** "Two signals already exist from earlier work... these are from the 'prostagma' project namespace"
*Epistemic work:* A factual grounding claim — there is existing evidence to build on. The claim situates the work in a larger context and prevents duplication. It's doing continuity work.

---

### Phase 13 — Path Abstraction & Capability Matrix

**Claim 44 (13):** "Feature detection via textual has_capability(feature) patterns in workflow prose, NOT programmatic function calls — agents are markdown read by LLMs, not executable code"
*Epistemic work:* A claim about the fundamental nature of the system — workflows are text interpreted by LLMs, not programs. This ontological claim shapes the entire capability detection design. If LLMs misinterpret the has_capability pattern, feature detection fails silently. The claim is doing foundational work.

**Claim 45 (13):** "Capability branching goes in workflow orchestrators, NOT in agent specs. Agent specs stay clean and capability-agnostic — they describe WHAT to do, not WHETHER to do it"
*Epistemic work:* An architectural separation that keeps agent specs simpler. The claim is doing design principle work — defining the proper location for capability checks. The justification is clarity and separation of concerns, not empirical evidence about where errors are more likely.

**Claim 46 (13):** "Degraded paths are functional, not error states — the system works correctly, just differently"
*Epistemic work:* A framing claim that shapes how degradation is presented to users. By calling it "functional," the claim prevents users from treating degraded mode as broken. This is user experience philosophy embedded in a design document.

---

### Phase 22 — Agent Boilerplate Extraction

**Claim 47 (22):** "The test: 'Does this define what the agent IS, or how it OPERATES?' Identity stays. Operations extract."
*Epistemic work:* A decision criterion stated as a test. The claim gives the implementer a question to ask about each section of each agent spec. The criterion is philosophically motivated (IS vs DOES) but may be hard to apply consistently — some sections blend identity and operation.

**Claim 48 (22):** "This leverages Claude's natural instruction priority: specific (agent) overrides general (protocol). No annotation syntax or explicit override blocks needed — positional priority is sufficient."
*Epistemic work:* A claim about LLM behavior that is asserted with confidence. The claim assumes Claude processes instruction position consistently — that "specific before general" is a reliable feature, not an emergent pattern that might change with model updates. If this assumption is wrong, agent overrides may not work.

**Claim 49 (22):** "Single monolithic references/agent-protocol.md file (not split into multiple files). Rationale: ~600 lines is manageable in one file; splitting adds file management overhead for minimal benefit; can split later if maintenance burden grows"
*Epistemic work:* A tradeoff claim with explicit rationale and deferral condition. "~600 lines is manageable" is an intuition, not a measured threshold. The claim is doing scope-limiting work while naming the condition under which the decision should be revisited.

---

### Phase 31 — Signal Schema Foundation

**Claim 50 (31):** "Five epistemic principles (governing all rigor decisions): Proportional rigor, Epistemic humility, Evidence independence, Mandatory counter-evidence, Meta-epistemic reflection"
*Epistemic work:* A formal philosophical framework stated as design governance. These principles are ambitious — they import epistemological theory into a software design document. The claim is doing foundational work: these five principles constrain all subsequent design decisions in signal schema. If any principle proves impractical to implement, the whole schema is under-constrained.

**Claim 51 (31):** "Counter-evidence is a hard requirement for critical signals — system refuses to save critical signal without counter-evidence"
*Epistemic work:* A strong enforcement mechanism derived from Principle 4 (Mandatory counter-evidence). The claim goes beyond advisory guidance to system-level enforcement. The practical consequence: if a user finds a critical issue in a hurry, they must also find counter-evidence before it gets saved. This is epistemic friction by design.

**Claim 52 (31):** "Evidence independence matters — same observation cited by multiple signals is NOT multiple independent pieces of evidence"
*Epistemic work:* An epistemological principle about what counts as corroboration. The claim prevents a specific failure mode (echoing the same source to create false confidence). It's grounded in philosophy of science. If it's right, it prevents systematic overconfidence. If it's too strict, it makes corroboration artificially hard.

**Claim 53 (31):** "The system should reflect on the epistemic rigor of our processes and whether they are able to reliably produce justified true belief"
*Epistemic work:* An aspiration that invokes JTB (justified true belief) from epistemology. The claim is ambitious — it asks the system to evaluate its own reasoning quality. This is meta-epistemics built into design. Whether the system can actually do this depends on capabilities not yet specified.

**Claim 54 (31):** "Epistemic gap signals — system explicitly acknowledges blind spots. These flag when the system suspects something but lacks tools/evidence to confirm"
*Epistemic work:* A category designed to capture known unknowns. The claim institutionalizes epistemic humility — instead of silence when evidence is absent, the system records the gap. This is philosophically sophisticated.

---

### Phase 38 — Extensible Sensor Architecture

**Claim 55 (38):** "Sensor contract should include a blind_spots declaration inspired by the philosophical motivation: 'every sensor embodies a theory about what counts as a problem; documenting blind spots makes theory-ladenness visible'"
*Epistemic work:* A claim that explicitly names the philosophy of science principle being applied (theory-ladenness). The claim does more than propose a feature — it articulates WHY sensors have blind spots and why documenting them matters. This is unusually philosophically explicit for a software design document.

**Claim 56 (38):** "No retry on failure — sensors analyze static local artifacts, retrying produces the same result"
*Epistemic work:* A causal claim: the output is deterministic, so retry is futile. The claim justifies a design decision by reasoning about the sensor's relationship to its input. If the assumption of determinism is wrong (e.g., file locks), the no-retry policy causes silent failures.

**Claim 57 (38):** "Collection continues with remaining sensors — only fail workflow if ALL sensors fail"
*Epistemic work:* A resilience policy that treats sensor failure as partial rather than total. The claim reflects a theory about what degraded operation looks like — it's better to have incomplete sensor coverage than no execution. This is a failure mode design principle.

---

### Phase 38.1 — Project-Local Knowledge Base

**Claim 58 (38.1):** "KB is 524K total (trivially fits in VCS)"
*Epistemic work:* An empirical observation that justifies a design choice (committing the KB to git). The claim has a size threshold implicit: "trivially fits" means the current size is far below any threshold. The claim could become false if KB grows substantially. It's a present-tense empirical claim doing future-justification work.

**Claim 59 (38.1):** "SHOULD: Structural Clarity — Lessons Deprecation. Existing 7 lessons remain at ~/.gsd/knowledge/lessons/ as historical artifacts (not migrated)"
*Epistemic work:* The "SHOULD" modal is doing priority work — this is less mandatory than MUST but more than COULD. The lessons deprecation is a significant structural change treated with explicit lesser weight. The rationale (lessons should live in agent specs, not KB) is argued in the referenced deliberation, but here it's stated as a SHOULD, preserving optionality.

**Claim 60 (38.1):** "Cross-project signal sharing is the FUTURE use case driving schema enrichment; Phase 38.1 lays the foundation without building the mechanism"
*Epistemic work:* A claim about design motivation — the present work is justified by a future need. This is forward-looking epistemic work: the schema enrichment wouldn't be done now if the future weren't anticipated. The claim is asserting that the future need is real enough to shape present design.

---

### Phase 45 — CJS Rename

**Claim 61 (45):** "This rename is the single most dangerous operation and should be done first, before any functional changes, so failures are attributable to the rename alone"
*Epistemic work:* A causal reasoning strategy: isolate the rename to make attribution possible. The claim is doing risk management work — it constrains sequencing to preserve diagnostic clarity. If something breaks during the rename, you know it was the rename.

**Claim 62 (45):** "Three signals establish that 'tests pass' is insufficient verification for this project"
*Epistemic work:* A generalization from signal history to a verification standard. The claim is using accumulated evidence (3 signals) to justify a stricter verification protocol. It's doing the work of raising the quality bar based on demonstrated past failures. This is one of the most explicitly evidence-grounded design claims in the corpus.

**Claim 63 (45):** "Every plan assertion about installer behavior must cite the specific function and line number. 'The installer does X' claims require evidence from code reading, not from documentation"
*Epistemic work:* A standard of evidence stated as an explicit epistemic guardrail. The claim requires code-level verification, not documentation-level. This directly addresses a failure mode identified in signal history. It's trying to prevent a specific type of epistemic error (trusting descriptions over code).

---

### Phase 46 — Upstream Module Adoption

**Claim 64 (46) — marked [A1]:** "Upstream modules are adoptable wholesale."
*Epistemic work:* Explicitly marked as an assumption with a validation condition and falsification condition. The claim knows it might be wrong and says how you'd find out. This is a well-structured assumption — it's not hiding behind confidence.

**Claim 65 (46) — marked [A3]:** "Tests are insulated from the refactoring — all fork tests invoke gsd-tools.cjs as a subprocess via execSync. They never require() modules directly."
*Epistemic work:* An assumption about test architecture that, if wrong, means the refactoring is not transparent to the test suite. The falsification condition ("Any test directly imports from the monolith") is concrete and checkable.

**Claim 66 (46):** "Behavioral equivalence is the primary gate, not structural correctness"
*Epistemic work:* A quality criterion that prioritizes what the system does over how it does it. The claim does methodological work — it says what success means. It prevents over-engineering (making the structure perfect while breaking behavior).

---

### Phase 47 — Fork Module Extraction

**Claim 67 (47) — marked [A2]:** "Frontmatter helpers in gsd-tools.cjs are duplicates of frontmatter.cjs exports."
*Epistemic work:* An assumption with a validation instruction ("Diff the two implementations to confirm they are identical or functionally equivalent"). The falsification condition is explicit. This is correct assumption-management.

**Claim 68 (47):** "Do not extract fork init overrides or fork command overrides. These belong to Phase 48. Extracting them now would violate phase boundary. They stay inline in gsd-tools.cjs even though it would be 'cleaner' to move them."
*Epistemic work:* A scope constraint that acknowledges the tension between cleanliness and boundary discipline. The "even though it would be 'cleaner'" acknowledgment is epistemically honest — it names the temptation and explicitly resists it. This is unusual: a design document that acknowledges its own constraints are somewhat arbitrary.

---

### Phase 48 — Module Extensions & Verification

**Claim 69 (48):** "The requirements reference '278 vitest tests' but actual baseline is 534 total (350 vitest + 174 upstream + 10 fork)"
*Epistemic work:* A fact-checking correction embedded in the constraints section. The claim is doing consistency maintenance — catching stale data in requirements before it misleads planners. This is the kind of ground-truth verification that prevents compounding errors.

**Claim 70 (48) — guardrail 3:** "Run all 534 tests after each extraction, not just after the final change. Phase 46's gap closure was needed because init routing was deferred. Extract + verify in tight loops, not big-bang."
*Epistemic work:* A lesson-applied verification discipline. The claim names a specific past failure (Phase 46 gap closure) as the justification for frequent testing. This is historical grounding — using evidence of what went wrong to justify a different process.

---

### Phase 48.1 — Post-Audit Upstream Drift Retriage

**Claim 71 (48.1) — marked [A1]:** "A bounded retriage is sufficient; a full new fork audit is probably not."
*Epistemic work:* An assumption that constrains scope. The word "probably" is doing epistemic work — it acknowledges this could be wrong. The falsification condition ("important current-phase implications found outside that filtered surface") is explicit.

**Claim 72 (48.1):** "Do not let 48.1 collapse into a second full fork audit. This phase is about targeted retriage and explicit routing."
*Epistemic work:* A scope discipline guardrail. The claim is protecting against a failure mode: letting a governance task expand into a research task. This is self-referential — the CONTEXT document is warning about a scope creep pattern that could undermine the CONTEXT document's own purpose.

**Claim 73 (48.1):** "If a change is deferred, record the reason for deferment explicitly; omission is not a valid defer strategy."
*Epistemic work:* An epistemic accountability requirement. The claim requires that silence be distinguished from explicit deferral. If something isn't listed, it wasn't considered — that's different from being explicitly deferred. The claim is trying to make the epistemic space legible.

---

### Phase 51 — Update System Hardening

**Claim 74 (51):** "The cross-runtime-upgrade deliberation is OPEN, not concluded. Phase 51 should NOT implement the full authority layer."
*Epistemic work:* A guardrail against implementing a design before the design is decided. The claim explicitly separates implementation from deliberation. It's doing scope-management work: preventing action based on an unresolved design question.

**Claim 75 (51):** "Additive-only migration principle still holds. Config migrations must remain additive. The controlled exception for field renames was already established in Phase 49 and must not be expanded without explicit justification."
*Epistemic work:* A principle that constrains future decisions. The claim preserves an architectural commitment while acknowledging one exception already exists. By naming the exception explicitly, the claim prevents silent exception-proliferation.

---

### Phase 52 — Feature Adoption

**Claim 76 (52):** "The fork's discuss-phase has been customized with the steering brief model... The upstream version adds codebase scouting but uses a different context model. The merge must preserve the fork's steering brief sections while adding upstream's codebase scouting capability."
*Epistemic work:* A mandatory constraint that protects a fork-specific contribution. The claim is doing identity preservation work — ensuring that adoption doesn't erase the fork's design contributions. The steering brief model is treated as non-negotiable.

**Claim 77 (52) — guardrail G1:** "Do not modify fork's steering brief model in discuss-phase without explicit grounding. Upstream's codebase scouting should be ADDED, not used to REPLACE the fork's context model."
*Epistemic work:* An anti-corruption guardrail. The claim is defending against a subtle form of drift — where adoption logic gradually erases fork-specific contributions. It requires positive justification to change, not just absence of objection.

**Claim 78 (52):** "If an adopted feature writes to paths, generates artifacts, or triggers behaviors that conflict with the fork's signal/KB/reflection system, flag it for Phase 53 deep integration rather than trying to resolve it here."
*Epistemic work:* A routing rule that preserves phase boundaries under complexity. The claim is doing conflict resolution: when adoption creates unexpected complexity, defer to the designated phase rather than solving it inline. This prevents Phase 52 from absorbing Phase 53's scope.

---

### Phase 53 — Deep Integration

**Claim 79 (53):** "Signal pipeline flow for VALIDATION.md findings flows through the established sensor → synthesizer → KB pipeline, not a separate path. The single-writer principle and the sensor contract are architectural invariants from Phase 34-35. Bypassing them would violate the signal lifecycle model."
*Epistemic work:* A claim about architectural invariants. The claim is doing preservation work: ensuring new features don't create parallel paths that would fragment the system's coherence. "Architectural invariant" is a strong term — it means the principle cannot be violated, only extended.

**Claim 80 (53):** "Add an explicit FORK_PROTECTED_DIRS constant or list in the cleanup workflow rather than relying on implicit safety-by-construction. Defense in depth. The cleanup workflow is safe today but could be extended upstream in ways that break the implicit safety."
*Epistemic work:* A risk reasoning claim. The cleanup workflow is currently safe, but the claim argues that present safety is insufficient because future upstream changes could break it. This is forward-looking defensive reasoning — protecting against a failure mode that hasn't happened yet.

**Claim 81 (53) — guardrail G3:** "KB surfacing in discuss-phase must not inflate context beyond usefulness. Surfacing too many KB items could push the discuss-phase workflow over its context budget, causing auto-compact or degraded output. Start conservative (3-5 items) and measure actual context impact."
*Epistemic work:* A precautionary principle derived from understanding LLM context window constraints. The "3-5 items" is a conservative estimate, not a validated threshold. The claim acknowledges the uncertainty by saying "start conservative... and measure."

---

### Phase 54 — Sync Retrospective & Governance

**Claim 82 (54):** "Governance artifacts should emerge from genuine analysis, not be written as standalone updates"
*Epistemic work:* A methodological principle for artifact generation. The claim insists that FORK-STRATEGY.md and FORK-DIVERGENCES.md should be outputs of analysis, not documents filled in mechanically. This is an epistemic ordering constraint: understand first, then document.

**Claim 83 (54) — question Q2:** "The fork (GSD Reflect) is built around epistemic self-improvement — 'the system never makes the same mistake twice.' Upstream GSD's philosophy is less explicit but visible in its choices. Understanding each project's design orientation is essential for classifying feature gaps as 'behind' vs 'intentionally different'."
*Epistemic work:* A claim about the relationship between design philosophy and feature gap analysis. This is meta-level: you can't correctly classify gaps without understanding the philosophical frames that generate different design choices. This is philosophically sophisticated framing.

**Claim 84 (54) — assumption:** "Feature Overlap Likely Exists. Cross-runtime support: upstream added Windsurf; we have Gemini/OpenCode/Codex converters. Model profiles: upstream has model-profiles.cjs; we have cross-runtime model profile logic. The assumption of overlap is provisional."
*Epistemic work:* An assumption clearly labeled provisional. The claim maps concrete suspected overlaps while flagging that the assumption needs verification. This is honest assumption-flagging at the project-planning level.

**Claim 85 (54) — guardrail 9:** "Upstream trajectory analysis is not adoption advocacy — understanding where upstream is heading helps inform policy, but the analysis should be descriptive and evaluative, not a recommendation to adopt everything new."
*Epistemic work:* A neutrality requirement for an analysis task. The claim is trying to prevent motivated reasoning in the direction of upstream adoption. It distinguishes description/evaluation from advocacy. This is methodological rigor about how to conduct analysis.

---

### Phase 55 — Upstream Mini-Sync

**Claim 86 (55) — marked [grounded]:** "Sync scope: In scope: Drift survey Areas 1, 2, 4, and frontmatter fix — four clusters named in SYNC-01"
*Epistemic work:* A scope declaration explicitly marked as grounded. The "grounded" marker means this isn't a proposal — it's a settled decision with evidence. The scope is locked to named clusters from a named research document.

**Claim 87 (55) — marked [grounded]:** "Pure upstream modules (state.cjs, milestone.cjs, template.cjs, verify.cjs): Wholesale replace from upstream v1.34.2. These have zero fork diff per FORK-DIVERGENCES.md."
*Epistemic work:* A factual claim about current divergence state used to justify a replacement strategy. "Zero fork diff per FORK-DIVERGENCES.md" is grounded in an existing artifact. If FORK-DIVERGENCES.md is wrong about these modules, wholesale replacement could destroy fork-specific changes. The grounding here is document-level, not code-level.

**Claim 88 (55) — marked [open]:** "Performance fixes (Area 3, 4 commits): These are low-risk, touch already-in-scope files, but SYNC-01 says 'correctness fixes' not 'performance fixes.' Researcher should assess whether to bundle or defer."
*Epistemic work:* An acknowledged open question with a research delegation. The "open" marker is honest — the decision hasn't been made and the reasoning why it hasn't (definitional ambiguity about "correctness" vs "performance") is stated.

**Claim 89 (55):** "core.cjs merge: atomicWriteFileSync (upstream) and atomicWriteJson (fork) are complementary — both should exist in the merged file."
*Epistemic work:* A substantive technical claim about function complementarity. The claim prevents one function from being treated as a duplicate of the other. The reasoning (different function signatures, different use cases) is stated but not proven — it's an assertion that requires verification during execution.

---

### Phase 55.1 — Upstream Bug Patches

**Claim 90 (55.1) — marked [grounded]:** "Root cause identified: stripShippedMilestones() at core.cjs:1103 uses /<details>[\s\S]*?<\/details>/gi which strips ALL <details> blocks — including the current milestone if an agent wraps it in <details>."
*Epistemic work:* A root cause claim marked grounded, with a specific line number. This is as close to fully grounded as a claim gets — it names a specific line, a specific regex pattern, and describes the failure mode. The grounding is code-level.

**Claim 91 (55.1):** "All three issues are OPEN in upstream with no merged fixes as of 2026-04-09. Upstream has a branch fix/2005-phase-complete-silently-skips-roadmap-up but it contains zero fix commits beyond v1.34.2 baseline."
*Epistemic work:* A factual claim about upstream state at a specific date. The datestamp is doing epistemic work — it marks this as a snapshot that could change. If upstream merges a fix, this claim becomes stale. The claim is properly time-bounded.

**Claim 92 (55.1) — marked [open]:** "Bug #1981: worktree reset --soft data loss — fix could be reset --hard (destructive — loses any worktree-local changes), checkout HEAD -- . (restores working tree from HEAD), or restructuring EnterWorktree."
*Epistemic work:* An open question about the correct fix, with candidate approaches. The claim doesn't pretend to know the answer — it names options and routes to research. Correctly labeled [open].

---

### Phase 55.2 — Codex Runtime Substrate

**Claim 93 (55.2) — marked [grounded]:** "Codex has task_tool — codex features list confirms multi_agent stable true (drift audit verified)"
*Epistemic work:* A factual claim grounded in a specific command output, cross-referenced to a named audit document. This is evidence-based grounding — the claim is backed by a specific verification step.

**Claim 94 (55.2) — marked [working assumption]:** "Codex hooks status is 'under development' per codex features list — treat as conditionally available. Researcher should verify current hook shape."
*Epistemic work:* An assumption correctly labeled "working assumption" because it's uncertain and needs verification. The "under development" quote is cited from a specific source. The claim delegates verification to research rather than treating the assumption as settled.

**Claim 95 (55.2) — marked [grounded]:** "codex.toml → config.toml everywhere in capability-matrix.md (live CLI confirms ~/.codex/config.toml)"
*Epistemic work:* A correction grounded in live CLI verification. The claim is repairing documentation drift with empirical evidence. The specific path (`~/.codex/config.toml`) is cited.

**Claim 96 (55.2):** "Feature detection, not runtime detection (capability-matrix.md design principle 7) — the automation.cjs fix should add Codex capabilities to the feature detection system, not add if runtime === 'codex' branches"
*Epistemic work:* A design principle enforced as a constraint on the fix. The claim routes the implementer toward a specific architectural approach by naming an existing principle. It's doing normative architectural work.

---

### Phase 56 — KB Schema & SQLite Foundation

**Claim 97 (56) — marked [open — critical conflict]:** "KB-01 requirement specifies proposed → in_progress → blocked → verified → remediated. Existing implementation uses detected → triaged → remediated → verified → invalidated. Working assumption: Phase 31's state model is the correct one — KB-01's states read like task/issue states and likely represent a requirements drafting error."
*Epistemic work:* A conflict between a requirements document and an implemented model, acknowledged as a "critical conflict" with the "open" marker. The working assumption is labeled as provisional and comes with a hypothesis about why the requirements are wrong ("requirements drafting error"). This is well-calibrated uncertainty: the claim names the conflict, offers a hypothesis, and routes it to research for resolution.

**Claim 98 (56) — marked [grounded]:** "Built-in SQLite: Uses node:sqlite (available in Node >=22.5.0, no external dependencies). KB-11 requires engines.node >=22.5.0 with actionable error message."
*Epistemic work:* A technical grounding claim — `node:sqlite` exists at a specific Node version, and that version becomes a hard requirement. The claim is doing dependency-management work.

**Claim 99 (56):** "kb.db location: .planning/knowledge/kb.db — gitignored, rebuildable from files at any time (KB-05 invariant)"
*Epistemic work:* A design principle stated as an invariant. "Rebuildable from files at any time" is the foundational guarantee of the dual-write model — SQLite is cache, files are source of truth. The claim is doing architectural guarantee work.

**Claim 100 (56):** "Signal files at .planning/knowledge/signals/ include files in BOTH project subdirectory and root-level (legacy signals before Phase 38.1 migration) — kb rebuild must handle both locations"
*Epistemic work:* A factual observation about corpus structure that generates an implementation requirement. The claim is doing discovery work — it names an edge case that arose from historical migration that kb rebuild must handle.

---

### Phase 57 — Measurement & Telemetry Baseline

**Claim 101 (57) — marked [grounded]:** "Validation task (5-session comparison of session-meta tokens vs JSONL-aggregated tokens) must complete before baseline.json is committed"
*Epistemic work:* A hard gate on the baseline commitment, grounded in a named concern (STATE.md blocker "validation spike required"). The claim prevents premature commitment of potentially unreliable data. It's doing epistemic quality control.

**Claim 102 (57) — marked [grounded]:** "Facets-based metrics annotated as 'AI-generated estimate with unknown accuracy' in both human-readable and raw output"
*Epistemic work:* A transparency requirement. The claim doesn't discard uncertain data — it surfaces the uncertainty in the output. This is epistemic honesty encoded into interface design.

**Claim 103 (57) — open question:** "Are session-meta token counts post-caching residuals or gross counts? Determines whether baseline token metrics are meaningful"
*Epistemic work:* A critical open question that could invalidate the entire baseline if token counts are residuals rather than gross. The claim correctly identifies this as blocking and puts it in the open questions table. The stakes are named clearly.

---

### Phase 57.1 — Explore Skill Adoption

**Claim 104 (57.1) — marked [grounded]:** "D-01: Standard GSDR adoption pattern: gsd:explore → gsdr:explore, path replacement via replacePathsInContent() in installer [grounded: established pattern in Phases 55/55.1/55.2]"
*Epistemic work:* A decision grounded in established precedent. The "[grounded: established pattern]" citation names the source of confidence. This is pattern-reuse as epistemic support.

**Claim 105 (57.1) — marked [grounded]:** "D-02: Upstream domain-probes.md adopted as-is. Web-app-focused probes ship unchanged — they're still useful for non-harness projects. GSDR-specific probes deferred to Phase 62 / WF-05b [grounded: deliberation Open Question 1 resolved by WF-05a/WF-05b split]"
*Epistemic work:* A decision grounded in a specific deliberation resolution. The grounding is document-level — a deliberation that resolved a question. The claim is doing scope-management work while anchoring the decision to a prior reasoning process.

**Claim 106 (57.1):** "Two-stage approach was deliberately chosen in the deliberation to avoid 'trying to do philosophical design work as a quick task' — keep Stage 1 simple"
*Epistemic work:* A rationale-preservation claim. The embedded quote names the danger that the two-stage approach protects against. The claim is doing methodological justification work — explaining why scope restraint is the right epistemic stance.

---

## Part II: Natural Groupings

After working through 106 claims across 33 files, I can see several natural groupings. These names are mine — I didn't import them from anywhere.

---

### Group A: Settled Commitments (locked by deliberation or explicit decision)

These are claims that were deliberated and are now done — they function as invariants for downstream work.

Examples: Claim 4 (no time-based decay), Claim 6 (relevance is contextual), Claim 12 (additive-only), Claim 13 (spikes produce findings not decisions), Claim 31 (package names inviolable), Claim 50 (five epistemic principles), Claim 75 (additive-only migration), Claim 79 (single-writer principle).

What distinguishes them: they're stated with the authority of a decision, their rationale is explicit, they resist revision unless conditions change. They're not hypotheses — they're architectural law for the project. Many have visible deliberation trails.

---

### Group B: Assumed Defaults (taken for granted without marking)

These are claims that aren't flagged as decisions or assumptions but are doing significant constraining work invisibly.

Examples: Claim 3 (Mac/Linux only, no justification), Claim 8 (KB is "dumb filing cabinet"), Claim 19 (system should never make same mistake twice), Claim 25 (LLMs are better at semantic relevance), Claim 35 (fork should feel like own product), Claim 44 (agents are markdown read by LLMs).

What distinguishes them: they're unstated axioms — beliefs the system operates on without being examined. Some are probably fine (Claim 8 is a useful heuristic). Others carry real risk if wrong (Claim 25 assumes LLM ranking quality that hasn't been validated for this specific task).

---

### Group C: Operational Definitions (converting vague concepts to measurable criteria)

These are claims that do the definitional work of making fuzzy concepts concrete enough to implement.

Examples: Claim 10 (debugging struggles = 3+ failures AND workaround AND long duration), Claim 17 (2 occurrences for critical patterns, 5+ for lower severity), Claim 20 (heuristics for global vs project scope), Claim 47 (IS vs DOES test for agent extraction).

What distinguishes them: the numbers and criteria in these claims are chosen, not derived. They're necessary choices — you can't implement without them — but they carry the risk of being miscalibrated. They're often stated without justification because justification is unavailable (no data). Later phases can be sensitive to these definitional choices in ways that aren't tracked.

---

### Group D: Well-Structured Assumptions (labeled, with validation conditions)

These are claims in phases 46-48, 55-57 where the format shifted to explicit `[A#]` assumption markers with falsification conditions.

Examples: Claims 64, 65, 67, 71, 84, 87, 88, 94.

What distinguishes them: they know they're assumptions, they know how they could be wrong, and they route verification to research. This is the most epistemically responsible format in the corpus. The presence of this format tracks closely with the more technical modularization phases and the later exploratory phases — it appears to be a learned practice.

---

### Group E: Historical Evidence Claims (grounded in specific signals, incidents, or artifacts)

These are claims justified by citing concrete past events, usually from the signal KB.

Examples: Claim 62 (three signals establish verification insufficiency), Claim 63 (every installer assertion must cite code), Claim 70 (Phase 46 gap closure justifies tight test loops), Claim 90 (root cause with line number), Claim 95 (capability matrix correction from live CLI).

What distinguishes them: they have epistemic receipts — specific signals, specific events, specific line numbers. They're the most evidentially grounded claims in the corpus. The prevalence of this group increases in later phases, suggesting growing trust in the signal KB as evidence.

---

### Group F: Open Questions (named uncertainties with research delegation)

These are claims that are explicitly known to be unresolved.

Examples: Claim 7 (pruning model unknown), Claim 24 (progressive disclosure), Claim 33 (actual conflict count pending), Claim 88 (performance fixes — open), Claim 92 (worktree fix strategy — open), Claim 97 (KB state model conflict — critical open), Claim 103 (token count reliability — critical open).

What distinguishes them: they're honest about their incompleteness and don't pretend resolution. They range from low-stakes (Claim 7) to critical-path blockers (Claims 97, 103). The distinction between low-stakes open questions and critical open questions matters but isn't always structurally visible in the format.

---

### Group G: Scope and Boundary Enforcement Claims

These claims do the work of preventing one phase from absorbing another's territory.

Examples: Claim 68 (don't extract fork init overrides — Phase 48 boundary), Claim 72 (don't let 48.1 collapse into full audit), Claim 74 (cross-runtime-upgrade deliberation is OPEN — don't implement), Claim 78 (route conflicts to Phase 53, not here), Claims about what each phase does NOT include.

What distinguishes them: they're defensive — they protect the design from itself. The project seems aware that work expands to fill phases and that scope discipline requires explicit enforcement. These claims are everywhere in the later phases.

---

### Group H: Theory Claims (philosophical or theoretical positions that shape design)

These are claims grounded in epistemology, philosophy of science, or theoretical frameworks rather than evidence or convention.

Examples: Claim 4 (theory of relevance as contextual), Claim 6 (static scores miss contextual relevance), Claim 19 (aspirational system learning), Claim 50 (JTB-grounded five principles), Claim 52 (evidence independence principle), Claim 53 (meta-epistemic reflection aspiration), Claim 55 (theory-ladenness of sensors), Claim 83 (design philosophy gap analysis).

What distinguishes them: their justification is philosophical, not empirical or conventional. They import concepts from epistemology, philosophy of science, and learning theory into a software design context. This is a distinctive feature of this codebase — it's unusual for a project to deliberately ground design choices in epistemological theory.

---

## Part III: Boundary Cases and Misfits

Some claims resist clean categorization or blur the boundary between groups.

---

**Boundary Case 1: Claim 22 (USER INSIGHT marker on freshness model)**

This claim sits between Group A (Settled Commitment) and Group H (Theory Claim). It's marked with unusual intensity "(USER INSIGHT)" — stronger than a decision, closer to a revelation. The claim has the authority of a settled commitment but the content of a theoretical stance. It's the only claim in the corpus using the "(USER INSIGHT)" marker. It might represent a category of its own: *breakthrough insight* — a moment where someone saw something clearly that was previously fuzzy. Settled commitments can be revisited under pressure; breakthrough insights tend to resist revision more stubbornly.

---

**Boundary Case 2: Claims 50-54 (Phase 31 epistemic principles)**

These cluster together but the principles do different work. Claim 50 (proportional rigor) is a Group A commitment. Claim 51 (counter-evidence as hard requirement) is a Group C operational definition that implements Claim 50. Claim 52 (evidence independence) is a Group H theory claim. Claim 53 (meta-epistemic reflection aspiration) is arguably a Group F open question masquerading as a goal. The phase presents them as a unified framework, but they're doing very different things.

---

**Boundary Case 3: Claims 86-88 (Phase 55 [grounded] vs [open] markers)**

In Phase 55, the `[grounded]` and `[open]` markers appear explicitly for the first time. This is the most mature epistemic marking system in the corpus. But Claim 87 ("zero fork diff per FORK-DIVERGENCES.md") is grounded in a document that was last updated 2026-02-10 — before Phase 45-48 modularization. The grounding is document-level, but the document may be stale. The marker says "grounded" but the evidence has questionable freshness. This is a case where the marker feels over-confident relative to the actual epistemic situation.

---

**Boundary Case 4: Claim 97 (Phase 56 lifecycle state conflict)**

This is labeled "open — critical conflict" in a CONTEXT.md document that's otherwise populated with grounded decisions. It's the only claim in the corpus that has both markers (open AND critical) with evidence of internal inconsistency (requirements document disagrees with implementation). The working assumption offered ("requirements drafting error") is reasonable but undecided. This claim doesn't fit neatly into any group — it's a known conflict awaiting resolution that survived into a ready-for-planning phase.

---

**Boundary Case 5: Claim 66 ("behavioral equivalence is the primary gate")**

This appears across multiple phases (46, 47, 48) in slightly varying forms. It's becoming a project-wide principle through repetition — a Group A Settled Commitment — but it was never formally established as one. It emerged from the modularization phases and kept being restated. The epistemic mechanism is interesting: repetition-as-settlement, where a claim accretes authority by reappearing rather than by being formally decided.

---

**Claim that Fits No Group: Claim 43 (signals from 'prostagma' project namespace)**

"Two signals already exist from earlier work... from the 'prostagma' project namespace" — this is a specific piece of historical context that doesn't fit any of the groups. It's not a decision, not an assumption, not an open question, not a theory. It's continuity evidence — a reminder that the project existed before the planning docs and that prior work has artifacts worth referencing. It's orphaned from any epistemic category.

---

## Part IV: Marker Misfits — Where the Label Feels Wrong

---

**Misfit 1: Claim 87 marked [grounded], grounding is from stale document**

The claim that "state.cjs, milestone.cjs, template.cjs, verify.cjs have zero fork diff per FORK-DIVERGENCES.md" is marked `[grounded]`, but FORK-DIVERGENCES.md was last updated February 2026, before the major modularization work in phases 45-48. The grounding exists, but the document it's grounded in may not reflect the current state. The `[grounded]` label is technically accurate but functionally overconfident. A more honest marker would be `[grounded: as of 2026-02-10 — verify against current code]`.

---

**Misfit 2: Claims about thresholds in Group C are often unmarked**

Claims 10, 17, 20 establish specific numbers (3 retries, 2 occurrences for critical, 5 for lower severity) without any epistemic marker. These numbers are the most fragile facts in the design — they're made up to be usable, not derived from evidence. They should probably carry an `[open]` or `[assumed]` marker to signal that calibration evidence is missing. Instead they sit in `<decisions>` sections with the authority of decided design, invisible as choices that could be recalibrated.

---

**Misfit 3: Claim 25 (LLMs are better at semantic relevance) is stated as fact**

This claim appears in the surfacing decisions section of Phase 05 with no marker. It rules out algorithmic ranking by asserting LLM superiority at semantic tasks. But "LLMs are better at semantic relevance" for this specific task (ranking KB entries for a given query) has not been demonstrated — it's an inheritance from the broader discourse about LLMs. In a codebase that emphasizes epistemic rigor, this claim should probably carry an `[assumed]` or `[working assumption]` marker. It's doing significant architectural work while appearing to be a simple fact.

---

**Misfit 4: Claim 53 (meta-epistemic reflection aspiration) appears in `<decisions>`**

"The system should reflect on the epistemic rigor of our processes and whether they are able to reliably produce justified true belief" is listed in the specifics section of Phase 31, which is populated by confirmed design directions. But this claim is more aspiration than decision — it's a vision for what the system might someday do, not a commitment being made in Phase 31. It should be in `<deferred>` or in an open question, not in specifics. The placement gives it false confidence.

---

**Misfit 5: Claim 19 (system should never make same mistake twice) appears everywhere as if decided**

This claim appears explicitly in Phase 04 and implicitly throughout the corpus as a justification for design choices. But it's a mission aspiration, not a decision. It can't be implemented or verified directly — you can't tell if you've made "the same mistake" unless you've defined what that means. The claim functions as a regulative ideal (something you approach but can't fully achieve), but it's treated throughout the corpus as if it were a concrete design specification. This creates invisible confusion: is a piece of functionality meeting this standard if it reduces repetition of some mistakes? All mistakes? Which definition of "same"?

---

## Part V: Can a Small Set of Types Capture This?

My honest assessment: no, not cleanly.

The 8 groups I named cover most of the claims, but the boundary cases reveal that categories blur in important ways:

1. **Group A (Settled Commitments) and Group H (Theory Claims) often merge.** Many of the most consequential design commitments are grounded in theoretical positions rather than evidence or convention. Separating them is analytically useful but the distinction is often thin.

2. **Group C (Operational Definitions) is doing the most unexamined work.** The numbers, thresholds, and criteria in these claims are everywhere and almost entirely unmarked. A typing system that made these visible would be valuable — but they're currently invisible because they live in `<decisions>` sections alongside evidence-backed choices.

3. **Group E (Historical Evidence Claims) is the most epistemically mature.** These are well-grounded and increasing in frequency as the project matures. They represent learning from the signal KB working as intended.

4. **Groups D (Well-Structured Assumptions) and F (Open Questions) are the most honest.** They know what they are. The problem is they appear mainly in the later, more technical phases — there's a gradient, with early phases relying more on Group A and B claims and later phases introducing more D and F structure.

5. **Groups G (Scope Enforcement) and Group A overlap heavily.** Scope decisions are settled commitments about what this phase is. The only difference is directionality: Group A commits to something being true, Group G commits to something being out of scope.

If forced to a minimum viable typology, I'd say there are really four deep distinctions:

- **Settled** (deliberated, authoritative, constraining) — Groups A + G
- **Theoretical** (philosophical, framework-level, non-empirical) — Group H
- **Operational** (definitional choices, thresholds, criteria) — Group C
- **Uncertain** (open questions, assumptions, working models) — Groups D + F

With a fifth class for historical-evidence claims (Group E) that are different in kind from all the above — they're not beliefs, they're receipts.

But this 5-type scheme would miss the Group B (Assumed Defaults) problem, which is arguably the most important epistemic issue in the corpus: claims that are doing significant work while appearing invisible.

**The honest conclusion:** The epistemic work done by claims in these documents is genuinely diverse. Some of that diversity is healthy (the project uses different epistemic tools for different purposes). Some of it is a gap (operationalized thresholds and assumed defaults are under-marked). A typing system can make the gaps visible, but it can't eliminate them — the underlying design choices have to be made, and making them explicit requires intentional discipline, not just a schema.

---

## Appendix: Phases Without Explicit Markers (Earliest Phases)

Phases 00-06 use no explicit epistemic markers (`[grounded]`, `[open]`, `[working assumption]`). They use section headers (`<decisions>`, `<deferred>`) to organize epistemic status, but within `<decisions>` sections, all claims appear equally settled. The marker vocabulary appears to be a learned practice — it emerges in phase 07 with Open Questions tables, develops into formal assumption documentation in phases 45-48, and reaches its most mature form (explicit `[grounded]` vs `[open]` vs `[working assumption]`) in phases 55-57.

This progression is itself informative: the project is learning to be more epistemically explicit over time. The earlier phases are not necessarily less rigorous in how they were decided — they may have been just as carefully thought through — but the thinking is less legible from the documents. Phase 57 is significantly more epistemically transparent than Phase 00, not necessarily because Phase 57's decisions are better, but because Phase 57's documentation discipline is more developed.

---

*Audit completed: 2026-04-09*
*Files examined: 33 CONTEXT.md files across phases 00-57.1*
*Claims analyzed in depth: 106*
*Groups discovered: 8 (A through H)*
*Boundary cases: 5*
*Marker misfits: 5*
