---
date: 2026-04-09
audit_type: claim_integrity
scope: "Typed claim audit batch 4 -- cross-project CONTEXT.md claim analysis"
triggered_by: "deliberation: claim-type-ontology.md"
ground_rules: none
tags: [claims, claim-types, cross-project, batch-4]
---
# Claim Audit — Batch 4: CONTEXT.md Files
**Date:** 2026-04-09
**Auditor:** Claude (Sonnet 4.6)
**Method:** Exploratory epistemic audit — no predefined categories; types emerge from data

## Files Examined

1. `scholardoc/.planning/phases/00-clean-up-workspace-and-organize-git-backlog/00-CONTEXT.md` (gathered 2026-02-18)
2. `scholardoc/.planning/phases/01-universal-gt-schema/01-CONTEXT.md` (gathered 2026-02-18)
3. `scholardoc/.planning/phases/01.1-schema-taxonomy-review-revision/01.1-CONTEXT.md` (gathered 2026-02-18)
4. `tain/.planning/phases/01-foundation-types-and-llm-client/01-CONTEXT.md` (gathered 2026-03-27)
5. `prix-guesser/.planning/phases/01-authored-round-contract/01-CONTEXT.md` (gathered 2026-04-08)

---

## File-by-File Claim Analysis

---

### FILE 1: scholardoc/00-CONTEXT.md — Workspace Cleanup

This file is narrow: it records decisions about how to organize existing artifacts before design work begins. Almost every claim is about the *disposition of known objects*, not about design or system behavior. The epistemic stakes are low but the claims carry forward assumptions about what prior work is worth keeping.

---

**Claim 1.1**
> "Keep schema work (SCHEMA.md, schema_v4_comprehensive.json) as prior art — directly informs Phase 1"

What it does: Asserts that existing schema artifacts are relevant to future work, specifically that schema_v4_comprehensive.json is informative rather than obsolete.

What kind of claim: A relevance judgment made before Phase 1 design has begun. Whoever gathered this context decided the prior schema would save time or ground decisions rather than mislead them.

What if wrong: Phase 1 might over-inherit design choices from v3/v4 that should be discarded. The framing "prior art" suggests it will be consulted but not necessarily followed — but if Phase 1 agents treat it as authoritative, old structural problems could propagate.

How it arrived here: Decided during context gathering, not investigated. No analysis of what the schema contains or which parts are healthy vs. problematic is recorded here. It is a disposition judgment ("keep, it's relevant") rather than a substantive verdict on quality.

---

**Claim 1.2**
> "Sample PDFs are scholarly philosophy texts (Derrida, Heidegger, Kant, Plato) that form the test corpus for Phase 5 validation"

What it does: Declares both the composition of the corpus and its intended downstream purpose in the same sentence.

What kind of claim: Dual-function — it's a fact about what currently exists (the PDFs are there) and a planning projection (they will be the Phase 5 corpus). The factual half appears observed; the projection half is assumed.

What if wrong: Phase 5 validation may need a different or larger corpus, or different authors/genres. The narrow selection of four canonical philosophers may not represent difficulties the pipeline will encounter in production (e.g., 19th-century printed texts, scientific philosophy, bilingual editions).

How it arrived here: The composition is observed (the files are present). The Phase 5 role is projected based on planning context, not explicitly decided through requirements analysis.

---

**Claim 1.3**
> "Branch archive tags preserve commit references — no work is lost during cleanup"

What it does: Reassures that archiving branches is nondestructive.

What kind of claim: A factual claim about git semantics — lightweight tags pointing to commits do preserve history. This is technically correct and verifiable against git documentation. It functions rhetorically to authorize the cleanup decision without resistance.

What if wrong: Not seriously wrong in terms of git mechanics. However, "no work is lost" conflates preserving commit hashes with preserving *accessibility* — archived branches become harder to discover or understand without documentation. The claim may understate what is practically lost.

How it arrived here: General git knowledge, not project-specific investigation. Stated as reassurance, not as a tested outcome.

---

**Claim 1.4**
> "Planning docs superseded by the roadmap (DIAGNOSTIC_PLAN.md, IMPLEMENTATION_PLAN.md, README.md) should be noted as superseded but committed for reference"

What it does: Makes a judgment that these specific documents are superseded, and that they are worth keeping despite being superseded.

What kind of claim: A relevance-and-disposition judgment. Asserts that the current roadmap supersedes these docs and that future reference value justifies committing them rather than discarding them.

What if wrong: If the supersession judgment is wrong — if these docs contain decisions or rationale not captured in the roadmap — then treating them as merely historical may cause reasoning gaps later.

How it arrived here: Decided during context gathering, presumably based on the gatherer reading both the docs and the roadmap. No explanation of why specifically these three are superseded while others (SCHEMA.md) are "prior art."

---

### FILE 2: scholardoc/01-CONTEXT.md — Universal GT Schema

This file is significantly richer. It records design decisions about a novel annotation schema, including points where design was explicitly deferred to research. The epistemic texture is varied: some claims are settled design choices, others are open questions explicitly flagged as needing investigation.

---

**Claim 2.1**
> "Design a universal, extensible ground truth annotation schema that unifies ScholarDoc (v3/v4 spatial/extraction focus) and CryptOfCogito (v0.3.1 semantic/philosophical focus) capabilities."

What it does: Defines the scope of the problem by asserting that two distinct projects' schemas should be unified into one, and that this unification is both feasible and desirable.

What kind of claim: A design direction that encodes a strategic judgment — that unification serves these projects better than maintaining separate schemas with converters between them. This is not a neutral description of a problem but a chosen solution frame.

What if wrong: The two schemas may reflect genuinely different ontological commitments (spatial vs. semantic) that do not unify cleanly. Forcing unification may produce a schema that does neither task well. The alternative — schema translators — is mentioned later in 01.1 as viable but rejected at this stage without stated reasoning.

How it arrived here: This is the founding premise of Phase 1, not a conclusion reached through comparative analysis. The claim is inherited from the project design session, not derived from schema analysis.

---

**Claim 2.2**
> "Pydantic models as source of truth, generating JSON Schema for external validation"

What it does: Establishes a source-of-truth hierarchy where Python implementation drives the schema contract, not the other way around. This has significant downstream implications — whoever changes a Pydantic model is changing the schema.

What kind of claim: An architectural decision that embeds an assumption about where schema authority should live. It assumes the Python implementation will be primary, and that external validation (e.g., third-party tools, other language clients) is secondary.

What if wrong: If the schema needs to be a stable contract consumed by non-Python tools (annotation UIs, external validators, third parties), having the Python implementation be the source of truth creates coupling problems. Schema changes require Python changes first, which may not always be appropriate.

How it arrived here: Decided during context gathering. Stated without comparative evaluation of alternatives (e.g., JSON Schema as source of truth, generating Pydantic from it).

---

**Claim 2.3**
> "A region can be spatially 'text_block' and semantically 'footnote' — these are independent dimensions"

What it does: Asserts that spatial and semantic annotations are orthogonal and can be assigned independently to the same region.

What kind of claim: A design claim that embeds an ontological assumption — that the spatial character of a region does not constrain its semantic character, and vice versa. This is a strong claim: it says the dimensions never interact in ways that make some combinations impossible or meaningless.

What if wrong: Some combinations may be semantically incoherent (e.g., a "figure" spatially can probably not be a "footnote" semantically). If there are cross-dimensional constraints, the independence claim will lead to a validation model that cannot enforce them, allowing nonsensical annotations.

How it arrived here: Stated as a design principle. There is no analysis of which combinations are actually possible or which produce tension.

---

**Claim 2.4**
> "GT file scope — Deferred to research — needs analysis of cross-page requirements before deciding"

What it does: Explicitly withholds a design decision and delegates it to a research task. This is a rare and epistemically honest move — the file acknowledges uncertainty rather than resolving it by assumption.

What kind of claim: A metacognitive marker. It signals that the decision-makers recognized they lacked sufficient information and deliberately left the question open.

How it arrived here: Explicit deliberation. The options listed (per-page files, per-document files, hybrid) show that alternatives were considered before deferral.

---

**Claim 2.5**
> "Multi-verifier chosen because the corpus will include genuinely ambiguous elements (cross-page footnotes, ToC parsing) where inter-annotator agreement matters"

What it does: Justifies a data model choice (array of verification records per element) by predicting that certain elements will be genuinely ambiguous and will benefit from multiple reviewers.

What kind of claim: A prediction about future annotation difficulty, used to justify a current design decision. The prediction is grounded in the nature of the problem (cross-page elements are inherently ambiguous) but is not based on empirical evidence from annotation trials.

What if wrong: If most elements prove unambiguous (annotators consistently agree), the multi-verifier model adds overhead without benefit. If the ambiguity patterns differ from what's predicted (e.g., table structure rather than footnote continuations), the schema's verification design may not target the actual disagreement sources.

How it arrived here: Reasoned from problem domain knowledge, not from annotation data. It is an anticipatory design choice, not an empirically validated one.

---

**Claim 2.6**
> "The user envisions a corpus larger than the Phase 5 minimum of 10-20 pages, with stratified difficulty"

What it does: Records an aspiration held by the user — that the final corpus will exceed the Phase 5 minimum. This is explicitly marked as a deferred idea.

What kind of claim: A planning projection attributed to a specific actor ("the user"). It is not a decision or a commitment; it is a recorded intention.

How it arrived here: Reported from discussion, placed explicitly in <deferred>. Properly scoped as future work, not current obligation.

---

**Claim 2.7**
> "Difficulty selection should be measurable through metrics, not just subjective — this informs how evaluation metrics (Phase 3) and corpus creation (Phase 5) are designed"

What it does: Asserts that objective difficulty metrics are preferable to subjective assessment, and projects that this preference will shape future phases.

What kind of claim: A methodological value commitment. It encodes a preference for quantifiable criteria and links it forward to later phases.

What if wrong: Some difficulty dimensions may be inherently subjective or require expert judgment that metrics cannot capture (e.g., philosophical semantic difficulty vs. layout parsing difficulty). Insisting on measurability may produce metrics that track easily-measured proxies rather than actual difficulty.

How it arrived here: Stated as a design principle during context gathering. Not examined critically.

---

### FILE 3: scholardoc/01.1-CONTEXT.md — Schema Taxonomy Review & Revision

This is the richest file in the batch. It covers deep schema design with explicit decision-status markers (DECIDED / RECOMMENDED / RESEARCH). These markers make the epistemic structure unusually transparent — the file distinguishes between claims locked by discussion, claims that are preliminary, and claims explicitly awaiting investigation.

---

**Claim 3.1**
> "The schema serves MULTIPLE consumers (not just ScholarDoc): layout detection, OCR quality evaluation, citation extraction, spellcheck calibration, terminology extraction, document structure analysis, annotator training, and active learning pipelines."

What it does: Expands the schema's scope beyond the immediate project to serve a large family of downstream consumers. This significantly raises the design bar — the schema must be general enough for all of them.

What kind of claim: A scope-defining assertion that arrived as a correction or clarification during analysis. It appears in the domain description, not in decisions, suggesting it was recognized as a constraint rather than chosen as a goal.

What if wrong: Designing for all these consumers simultaneously may produce a schema that is too complex, too heavy, or that compromises on the needs of each consumer. Some consumers may have conflicting requirements (e.g., layout detection wants spatial labels; spellcheck calibration wants vocabulary marking at character level).

How it arrived here: Emerged during analysis as a recognition of what the schema must accommodate. Not investigated for whether all consumers' needs are actually compatible.

---

**Claim 3.2** [DECIDED]
> "The differences between footnotes and endnotes are PROPERTIES (placement, scope, numbering) not TYPES. Consolidation simplifies Phase 2 extractors, Phase 3 evaluation (stratify by property), and Phase 4 annotation UI."

What it does: Makes an ontological claim about the nature of footnotes vs. endnotes (property difference, not type difference) and uses it to justify a modeling choice (single Note model with differentiating properties).

What kind of claim: An ontological argument applied to a design decision. The claim is explicitly marked DECIDED, meaning it survived discussion. The rationale lists three concrete downstream benefits.

What if wrong: If footnotes and endnotes require fundamentally different extraction logic in Phase 2 (not just different property values), the unified model may complicate extractors rather than simplify them. The claim assumes extractor simplification, which has not been verified against Phase 2 requirements.

How it arrived here: Decided through explicit discussion with the user. The rationale is stated but the counter-argument (that type-level distinction might reflect processing differences) is not engaged.

---

**Claim 3.3** [DECIDED]
> "Design for clarity first, create adapters for external model interoperability. We do NOT need to match DocLayNet/PubLayNet label sets — we can create translators between their output schemas and ours."

What it does: Rejects a constraint that would have forced the schema to conform to existing external model output formats. Instead, it asserts that translation layers are preferable.

What kind of claim: A strategic design choice that has significant engineering implications. It asserts that building adapters/translators is a better investment than conforming to external conventions.

What if wrong: Translators between label systems are non-trivial to build and maintain. If external models use fundamentally different spatial ontologies (e.g., non-hierarchical, different bbox conventions), translation may be lossy or ambiguous. The claim assumes translation will work well, without analyzing what would be lost.

How it arrived here: Decided through discussion. The claim is stated as a principle without examination of how much translation work existing schemas would actually require.

---

**Claim 3.4** [DECIDED]
> "Explicit continuation modeling at region level + page-level dependency metadata. Pages are self-describing for partial GT annotation (page sampling). When annotating page 46 in isolation, the metadata tells you 'this page depends on page 45' before you discover it from the content."

What it does: Justifies a data design choice (continuation flags + page-level dependency metadata) by describing a use case (partial annotation in isolation). The annotation-tool use case is invoked as primary motivation.

What kind of claim: A design decision justified by a projected use case. The use case itself ("annotating page 46 in isolation") is stated as if it will definitely occur, but corpus annotation workflows have not been designed yet.

What if wrong: If annotation turns out to be document-sequential rather than page-sampled, the self-describing page design adds significant overhead for a use case that rarely arises. The metadata required (unresolved_markers, orphan_continuations) must be maintained and validated, which adds burden to annotators and validators.

How it arrived here: Decided based on anticipated annotation workflow. Not yet verified against actual annotation process design.

---

**Claim 3.5** [DECIDED]
> "Lightweight section_context on PageGT. Each page carries its hierarchical section path. Canonical section hierarchy lives in DocumentGT. Page-level context is denormalized for self-describing pages."

What it does: Accepts data denormalization as a design feature, justified by the same "self-describing page" argument. This is a deliberate violation of a normalization norm for the sake of the use case.

What kind of claim: A design decision with an explicit tradeoff acknowledged (denormalization). The tradeoff is not fully analyzed — what happens when DocumentGT section hierarchy changes and PageGT section_context becomes stale?

What if wrong: Denormalized data requires synchronization. If section hierarchy in DocumentGT is revised after pages are annotated, PageGT section_context records will be wrong and require re-processing. The claim that denormalization is acceptable does not address this maintenance burden.

How it arrived here: Decided during discussion. The synchronization problem is not mentioned.

---

**Claim 3.6** [DECIDED]
> "Commentary is fundamentally different from notes: organized by passage reference, not by markers"

What it does: Asserts an ontological difference between commentary and notes that motivates giving commentary its own model.

What kind of claim: An ontological claim about a text-structural phenomenon. It is stated as settled ("fundamentally different"), though this depends on the definition of "organized by" — some commentary traditions use marker-like systems (e.g., verse numbers as markers in Talmudic commentary).

What if wrong: If some commentary conventions do use markers (numbered annotations keyed to specific pages), the Commentary model's "reference_system" approach may not accommodate them cleanly. The claim may overgeneralize from a subset of commentary types.

How it arrived here: Decided through discussion, apparently influenced by knowledge of specific traditions (Talmud, critical editions). The claim generalizes from known cases without surveying edge cases.

---

**Claim 3.7** [RECOMMENDED]
> "Preliminary recommendation: Keep most labels, rename for visual clarity, research borderline cases."

What it does: Expresses a conservative default (keep what exists, rename, research the unclear cases) for spatial label restructuring.

What kind of claim: An explicitly provisional recommendation, appropriately marked. The epistemic status is honest — this is a starting position for research, not a settled decision.

How it arrived here: Derived from analysis of current tensions (named in the surrounding section). Properly labeled as needing research validation.

---

**Claim 3.8** [RECOMMENDED]
> "Decompose [CitationType] into three orthogonal axes: CitationFormat (per-citation appearance), ReferenceSystem (coordinates), Citation style (per-document level)."

What it does: Proposes a specific decomposition of a conflated type system into orthogonal dimensions. The claim that the three axes are orthogonal is doing significant work — it implies any combination of values across axes is valid.

What kind of claim: A preliminary design proposal with an unstated orthogonality assumption. "Orthogonal" means no axis constrains another, but this may not hold — certain ReferenceSystem values (e.g., STEPHANUS) may only be valid for specific citation styles or formats.

What if wrong: If the axes interact (some CitationFormat values only appear with certain ReferenceSystem values), the orthogonal decomposition will allow invalid combinations and complicate validation. The research task identified is specifically about completing the inventory of reference systems, not testing orthogonality.

How it arrived here: Preliminary recommendation from analysis. The orthogonality assumption is stated without examination.

---

**Claim 3.9** [RESEARCH]
> "SousRature is a semantic element but uses char_offset/char_length like formatting. Must distinguish regular strikethrough (editor's deletion) from sous rature (Derridean philosophical gesture). Suggests formatting alone is insufficient — need semantic annotation on formatting."

What it does: Introduces a domain-specific phenomenon (sous rature as a philosophical practice) as evidence for a general design need (semantic layer on formatting). The argument moves from a particular case to a structural conclusion.

What kind of claim: An argument from a specific example to a general design requirement. It is appropriately placed in RESEARCH, meaning the design has not locked a solution.

What if wrong: The prevalence of sous rature and similar "semantically loaded formatting" in the actual corpus is unknown. If only a handful of pages out of thousands contain sous rature, the added modeling complexity may not be worth the effort. The claim treats a philosophical edge case as if it justifies system-wide architectural change.

How it arrived here: Recognized during analysis as a tension. Placed in RESEARCH, which is appropriate. The upstream question of corpus prevalence is not addressed.

---

**Claim 3.10** [RESEARCH]
> "Language annotation at the text span level is NOT optional — it's essential for practical pipeline evaluation."

What it does: Upgrades language annotation from optional to required by asserting that downstream tasks (spellcheck calibration, OCR escalation, language-stratified evaluation) depend on it.

What kind of claim: A requirements escalation — something that might have been a nice-to-have is declared essential. The supporting argument lists five concrete use cases.

What if wrong: The five use cases are genuine but may not all apply to the first version of the pipeline. Treating language annotation as essential from the start adds annotator burden and schema complexity. If the corpus is predominantly English with occasional Greek/Latin insertions, automated language detection might be sufficient for early evaluation without GT-level language spans.

How it arrived here: Derived from listing downstream use cases. Placed in RESEARCH, but the framing ("NOT optional") is stronger than a research question — it has already reached a conclusion.

---

**Claim 3.11** (tension table, row 9)
> "Standardize cross-page patterns (currently inconsistent: ContentSpan.is_continuation vs Section.page_start/page_end) — Use is_continuation/continues_to_next flags consistently on Region"

What it does: Identifies an existing inconsistency in the schema and proposes a standardization direction.

What kind of claim: An empirical observation (there is current inconsistency) plus a prescription (standardize on flags). The observation is presumably grounded in reading the actual schema code. The prescription is a design choice.

What if wrong: The two current approaches (continuation flags vs. page range fields) may serve genuinely different use cases — one might be more appropriate for regions, the other for document-level constructs. Standardizing away from page_start/page_end may lose information that was intentionally encoded.

How it arrived here: Appears in a tension-identification table. Presumably identified through schema review.

---

### FILE 4: tain/01-CONTEXT.md — Foundation Types and LLM Client

This file is technically focused — it records protocol interface and infrastructure decisions for a multi-agent adversarial prose generation system. Claims are mostly implementation decisions with explicit identifiers (D-01 through D-16). Epistemic texture is different from scholardoc: most claims are design choices, fewer are factual assertions.

---

**Claim 4.1**
> "The open topology principle is non-negotiable — the architecture must NEVER assume a fixed number of participants in any functional role. This was a correction during project initialization."

What it does: Elevates a design principle to an architectural constraint with historical justification ("correction during project initialization"). The capital NEVER is unusual — few design principles are stated this absolutely.

What kind of claim: A constraint claim with rhetorical force added by its history (someone got this wrong before, it was corrected, now it's locked). The note "correction during project initialization" signals that the previous version violated this principle.

What if wrong: The principle may be right for the research use case (variable multi-agent topology) but could overcomplicate production deployment if the system ultimately runs with a fixed topology in practice. "Non-negotiable" constraints in early design sometimes prevent sensible simplification later.

How it arrived here: Through correction of a prior mistake, not through prior analysis. The claim has the backing of a lesson learned, but the lesson is not described in enough detail to know what specifically was wrong before.

---

**Claim 4.2** [D-02]
> "Both protocols use typing.Protocol with @runtime_checkable (PEP 544 structural subtyping). Implementations satisfy the protocol by shape, not by inheriting a base class."

What it does: Chooses structural subtyping over nominal subtyping for the core protocols. This is a Python-specific architectural choice with significant implications for type checking, runtime behavior, and extensibility.

What kind of claim: An implementation decision grounded in a specific Python feature (PEP 544). Technically defensible — structural typing does enable the open topology principle by allowing third-party implementations without inheriting from a base class.

What if wrong: Runtime_checkable protocols in Python do not check method signatures at runtime — they only check that the method exists. This means a class with a `generate` method of the wrong signature will pass runtime protocol checks but fail at call time. The decision assumes this tradeoff is acceptable.

How it arrived here: Design decision recorded without noting the runtime_checkable limitation. Assumed rather than analyzed.

---

**Claim 4.3** [D-05]
> "Verdict.critiques is a list[Critique] because discrimination may be performed by a panel of specialized critics — the data model accommodates variable topology from day one."

What it does: Justifies a data model choice (list rather than single value) by invoking the open topology principle. The future capability (panel of critics) drives a present design choice.

What kind of claim: A forward-projection claim. The "variable topology" use case is anticipated, not yet real. The decision embeds a future architecture into a current type definition.

What if wrong: If discrimination always ends up being performed by a single LLM call, the list[Critique] structure adds indirection without benefit. More significantly, it may make the common case (single discriminator) more awkward to write and read.

How it arrived here: Derived from the open topology principle, applied to data modeling. The single-discriminator common case is not assessed.

---

**Claim 4.4** [D-13]
> "Thin wrapper around the Anthropic SDK (AsyncAnthropic) — not a multi-provider abstraction."

What it does: Deliberately constrains scope — the LLM client will not abstract over providers, only wrap Anthropic. This is explicitly paired with D-14's note that a protocol interface makes future swapping possible.

What kind of claim: A scope limitation stated as a design choice. It is honest about what is being built, combined with D-14's pragmatic hedge.

What if wrong: If the research requires comparing generations from different model families (e.g., comparing Anthropic vs. OpenAI discriminators), the Anthropic-specific wrapper will not be sufficient. The scope limitation is deliberate but depends on the assumption that Anthropic will be the only provider for this research.

How it arrived here: Stated as a deliberate simplification. The assumption that Anthropic-only is sufficient for the research is not questioned.

---

**Claim 4.5** [D-15]
> "Structured output via Anthropic's native .parse() with Pydantic models. No instructor, no custom JSON extraction."

What it does: Rules out two alternative approaches (instructor library, custom JSON extraction) in favor of Anthropic's native structured output. This is stated as a resolved choice, not a tentative preference.

What kind of claim: An implementation decision that eliminates alternatives without explaining why those alternatives were rejected beyond implying that native is simpler.

What if wrong: Anthropic's native .parse() may have limitations (model-specific behaviors, constraints on schema complexity, edge case handling) that instructor was designed to address. Ruling out instructor without evaluating its specific advantages may cause problems when complex structured outputs fail.

How it arrived here: Decided during context gathering. The elimination of instructor appears to be a simplicity preference, not a comparison.

---

**Claim 4.6** [D-16]
> "Budget warnings are configurable thresholds that log warnings but do not halt execution (halting is a session-level decision)."

What it does: Decides that cost overrun warnings are advisory rather than hard stops. This encodes a policy about how the system relates to costs — human oversight decides whether to halt, not the system itself.

What kind of claim: A behavioral policy decision with implicit assumptions about the deployment context. The claim assumes there is always a human session-level observer who can decide to halt based on warnings.

What if wrong: In automated or overnight research runs, there may be no human observing warnings. Budget warnings that do not halt execution in automated contexts can produce unexpectedly large API bills.

How it arrived here: Decided as a design principle. The automated run scenario is not addressed.

---

**Claim 4.7**
> "The Pydantic models defined here are the contracts that every subsequent phase depends on. Getting the types right is more important than getting the implementation right."

What it does: Establishes a priority ordering — type correctness above implementation correctness. This is standard for interface-first design, but states it emphatically to direct future agent behavior.

What kind of claim: A priority claim that anticipates how future agents should reason about tradeoffs. It is a meta-instruction embedded in a context document.

What if wrong: If the Pydantic types turn out to need significant revision after Phase 1 (because Phase 2 or 3 exposes unanticipated requirements), the emphasis on "getting types right" creates pressure to treat the Phase 1 types as stable contracts even when they should change. The priority claim may inadvertently discourage necessary refactoring.

How it arrived here: Stated as a methodological principle in the specifics section. Not qualified by any acknowledgment of fallibility.

---

### FILE 5: prix-guesser/01-CONTEXT.md — Authored Round Contract

This file is the most structurally sophisticated in the batch. It includes sections not present in the others: `<working_model>`, `<derived_constraints>`, `<open_questions>`, `<epistemic_guardrails>`, and `<future_awareness>`. The explicit epistemic_guardrails section is a notable feature — it directly names ways the reader might misread the context. This is the only file in the batch that actively tries to constrain its own misuse.

---

**Claim 5.1** [D-01]
> "Model rounds as authored semantic objects, not thin lat/lng + pano records."

What it does: Rejects a simpler data model (bare coordinates and panorama IDs) in favor of a richer semantic model. The distinction is named as a core design decision.

What kind of claim: A design decision that encodes a philosophical stance about what a round *is*. It rejects the thin model by naming it ("lat/lng + pano records") as something to avoid.

What if wrong: The richer semantic model is harder to author, validate, and maintain. If the initial corpus of rounds proves difficult to produce under the rich model (because content authors don't have the required metadata), the project may face a supply problem.

How it arrived here: Explicitly derived from a discovery artifact (`discovery/10-critical-inheritance-geoguessr-core.md`). The rejection of thin records is traced to a specific earlier analysis.

---

**Claim 5.2** [D-02]
> "Packs are not treated as random point buckets or public UGC primitives."

What it does: Explicitly rules out two alternative pack models — the Geoguessr-style point bucket and user-generated content. This is a product philosophy decision about who creates content and how.

What kind of claim: A negative definition — the product is defined partly by what it is not. This is a common strategy when there's a dominant competitor model to differentiate from (Geoguessr in this case).

What if wrong: If the private expert-authored model proves too slow to produce enough content for a compelling initial product, the product may fail from insufficient content before the quality advantage of expert authoring becomes visible.

How it arrived here: Derived from product design principles. The supply-side risk is not addressed.

---

**Claim 5.3** [D-05]
> "Treat Street View as an optional clue family, not the mandatory product substrate. The core round contract must not become Google-specific."

What it does: Decouples the product from Google Street View dependency, motivated by coverage instability.

What kind of claim: A risk-mitigation design decision. The derived constraint section makes the motivation explicit: "Street View coverage is uneven and unstable across venues."

What if wrong: If Street View is not just unstable but actually the primary experience that makes the product compelling to users, decoupling it architecturally may produce a technically cleaner schema that describes a less compelling product.

How it arrived here: Derived from the coverage audit (`discovery/11-circuit-coverage-audit.md`). The coverage instability is evidenced by the audit, not assumed.

---

**Claim 5.4** (derived_constraints)
> "The product is private-only and expert-first, so authored fidelity and fan-legible reveal logic matter more than generic quiz simplification."

What it does: Asserts an audience-product fit claim — that the specific audience (private, expert, fan-literate) means quality and fidelity outweigh accessibility. This drives many other decisions.

What kind of claim: A product positioning claim that functions as a constraint. It rules out design choices appropriate for a mass audience.

What if wrong: If the target audience is smaller than expected or harder to monetize than anticipated, the "expert-first" positioning may limit the product's viability. The claim assumes the expert F1 fan audience is large enough and committed enough to sustain the product.

How it arrived here: Stated as a derived constraint (derived from product positioning decisions made earlier in planning). Not investigated empirically.

---

**Claim 5.5** (epistemic_guardrails)
> "Treat the discovery field list as directional, not as a frozen schema. Validate the contract against multiple fixture round families before treating it as settled."

What it does: Explicitly tells future readers not to over-trust the field list. This is a self-limiting claim — the context document warns against treating itself as definitive.

What kind of claim: A metacognitive epistemic constraint on the document itself. Rare in planning documents; most documents do not include explicit instructions about their own uncertainty.

How it arrived here: Deliberately included in a named section (`<epistemic_guardrails>`). This suggests the author was aware that planning context can be mistaken for settled design.

---

**Claim 5.6** (epistemic_guardrails)
> "Treat the coverage audit as venue-strategy guidance, not proof that specific coordinates or panorama IDs are production-safe."

What it does: Limits the authority of a prior research artifact — the coverage audit describes patterns but does not certify specific data points.

What kind of claim: A bound on the authority of evidence. The coverage audit is real research, but the guardrail prevents it from being treated as stronger than it is.

What if wrong: If implementers do need production-safe coordinate data and the coverage audit is the only available source, the guardrail creates a gap — it says the audit is insufficient without providing a path to sufficient evidence.

How it arrived here: Deliberate inclusion in epistemic_guardrails. The gap it creates is not addressed.

---

**Claim 5.7** (future_awareness)
> "The live-room runtime choice stays open until Phase 3 planning; Phase 1 should not couple content contracts to Colyseus, PartyKit, or any other transport-specific runtime."

What it does: Explicitly holds a major architectural decision open and builds the current phase to not foreclose it.

What kind of claim: A purposeful non-decision that names the options being kept open. This is architecturally sound — decoupling content from transport — and is grounded in the recognition that the runtime choice hasn't been made.

How it arrived here: Deliberate design. The specific runtimes named (Colyseus, PartyKit) suggest they were actively considered and deliberately held at arm's length.

---

**Claim 5.8** (open_questions — explicitly unresolved)
> "How granular should the first scoring-profile vocabulary be in Phase 1: simple presets, fully parameterized rules, or a hybrid?"

What it does: Names a genuine decision that has not been made. The three options are stated but not resolved.

What kind of claim: An honestly open question. Unlike most open questions that are resolved before context is finalized, this one is left open and explicitly flagged.

How it arrived here: Preserved from earlier discussion. Placed in `<open_questions>` rather than `<decisions>`, which is appropriate.

---

## Natural Groupings

After reading all claims across all files, the following groupings emerged. They are named to describe what the claims *do*, not what they are about.

---

### Group A: Assumption-as-Decision

Claims where a design choice is made but the underlying assumption is not examined. The assumption does the real epistemic work, but it is not flagged as uncertain.

- 2.1 (unification as the frame for the problem)
- 2.3 (spatial and semantic labels are fully independent)
- 2.7 (difficulty is measurable)
- 3.2 (footnote/endnote consolidation simplifies Phase 2)
- 3.3 (translators between schemas will work cleanly)
- 3.8 (the three citation axes are genuinely orthogonal)
- 4.3 (single discriminator is not the common case)

What characterizes this group: The claim is stated as a decision, but it rests on an assumption that, if wrong, invalidates the decision. The assumption is not surfaced or examined.

---

### Group B: Forward-Projected Justification

Claims where a design choice is justified by a future use case or future state that has not yet arrived and may not.

- 2.5 (multi-verifier design justified by predicted annotation ambiguity)
- 3.4 (page-level dependency metadata justified by projected partial-annotation workflow)
- 3.10 (language annotation "essential" based on downstream use cases not yet built)
- 4.1 (open topology principle justified by future variable-participant scenarios)
- 4.3 (list[Critique] justified by future panel-of-critics use case)

What characterizes this group: The future state is real in the sense that it might occur, but the design is committed before the future state is confirmed. If the future state does not materialize, the design adds complexity for no benefit.

---

### Group C: Scope Limiting by Naming What's Excluded

Claims that define the design space by naming alternatives that are rejected. The rejection is the content of the claim.

- 2.2 (Pydantic as source of truth, not JSON Schema or other formats)
- 3.3 (no conforming to DocLayNet/PubLayNet — translators instead)
- 4.4 (Anthropic-only, not multi-provider)
- 4.5 (native .parse(), not instructor or custom extraction)
- 5.1 (semantic objects, not lat/lng + pano records)
- 5.2 (not a random point bucket or UGC primitive)
- 5.3 (Street View optional, not mandatory substrate)

What characterizes this group: These claims are intellectually honest about what they are doing — they name the alternatives they reject. The weakness is that rejection is often underjustified: alternatives are named and dismissed without analysis of what specifically makes them unsuitable.

---

### Group D: Explicitly Held-Open Decisions

Claims that acknowledge a decision has not been made and commit to not making it prematurely.

- 2.4 (GT file scope explicitly deferred to research)
- 5.7 (live-room runtime held open until Phase 3)
- 5.8 (scoring-profile granularity left as an open question)
- 4.4's D-14 pairing (protocol interface hedges Anthropic-only scope)

What characterizes this group: These are epistemically the most honest claims in the batch. They resist premature closure and name what information would be needed to resolve them.

---

### Group E: Metacognitive Self-Limiting Claims

Claims about how the document itself should be read, or about the limits of evidence cited in the document. Only prix-guesser/01-CONTEXT.md has a dedicated section for these.

- 5.5 (discovery field list is directional, not frozen)
- 5.6 (coverage audit is venue-strategy guidance, not production-safe data)
- 4.7 (priority claim that tells future agents what to weight — though this one misfires; it may discourage necessary refactoring)

What characterizes this group: The document speaks about itself. It either warns against over-reading its own content or tells future readers how to reason about it. This is rare and valuable — most planning documents do not include their own misuse warnings.

---

### Group F: Observed Facts Carrying Design Weight

Claims that report something already true (a file exists, a pattern was observed, a schema has a specific problem) but use that observation to license a design direction.

- 1.2 (the PDFs exist and are philosophy texts — projected to become Phase 5 corpus)
- 1.3 (git archive tags preserve commit references — used to justify cleanup approach)
- 1.4 (planning docs are superseded by roadmap)
- 3.11 (current cross-page patterns are inconsistent — used to justify standardization)
- 2.1's embedding of the phrase "v3/v4 spatial/extraction focus" and "v0.3.1 semantic/philosophical focus" — describes the current state of two systems as if this characterization is fixed

What characterizes this group: The observation itself may be accurate, but the inference from observation to design direction is often a jump. The PDF corpus observation is accurate, but projecting those specific PDFs as the Phase 5 corpus is an additional claim that the observation does not support on its own.

---

### Group G: Ontological Claims About Domain Structure

Claims that assert something about the fundamental nature of the domain being modeled — not just design choices, but claims about what things *are*.

- 2.3 (spatial and semantic labels are independent — ontological claim about text)
- 3.2 (footnotes and endnotes differ by properties, not type — ontological claim about scholarly apparatus)
- 3.6 (commentary is fundamentally different from notes — organized by passage reference, not markers — ontological claim about commentary traditions)
- 3.9 (sous rature is semantic, not merely formatting — ontological claim about Derridean practice)
- 5.4 (expert-first positioning — what matters to the audience — ontological claim about users)

What characterizes this group: These claims are doing the most fundamental epistemic work. They define what the domain *is*, which constrains all design choices downstream. They are rarely labeled as assumptions because they feel like descriptions of reality. But they are at least partially theory-laden and culture-specific (scholarly commentary traditions are not uniform; what counts as a "type" vs. a "property" depends on the modeling framework).

---

## Boundary Cases

**3.10 (language annotation "NOT optional")**: This claim is placed in a RESEARCH section but uses the language of a settled decision ("NOT optional — it's essential"). It straddles Group B (forward-projected justification) and what might be called a premature resolution inside an unresolved research question. It is the sharpest epistemic mismatch in the batch — the section says RESEARCH, the language says DECIDED.

**4.7 (types matter more than implementation)**: This is partly Group E (metacognitive, directing future agent reasoning) and partly Group B (projecting a priority into future work that may not serve that work). Unlike the prix-guesser guardrails, this one has a potential misfire — it may create social pressure against revising Phase 1 types when Phase 2 or 3 needs reveal their limitations.

**1.3 (no work is lost in branch archiving)**: This is partly Group F (observed fact: git preserves hashes) and partly a rhetorical move — "no work is lost" overstates what the archive strategy preserves (the hashes are preserved; discovery and comprehension of archived work are not).

**3.8 (citation axes are orthogonal)**: This appears in RECOMMENDED, which is appropriately provisional. But the orthogonality assumption is stated as a property of the proposed decomposition, not as something the research task is asked to verify. The research task is defined as "complete the inventory of reference systems" — it doesn't include "verify that CitationFormat and ReferenceSystem are genuinely independent." The assumption does hidden work inside a provisionally-marked claim.

---

## Cross-File Patterns

**The DECIDED/RECOMMENDED/RESEARCH taxonomy (scholardoc/01.1)** is the most epistemically sophisticated marker system in the batch. It is not shared across the other files, which use a uniform "decisions" section without status differentiation. The absence of this taxonomy in other files makes it harder to tell which claims are settled and which are provisional.

**prix-guesser/01 is structurally the most self-aware.** The `<epistemic_guardrails>` section has no equivalent in any other file. It is the only document that actively tries to prevent its own misreading. This may reflect project maturity differences (prix-guesser was gathered most recently, 2026-04-08) or may reflect the author having developed the practice through prior planning work.

**Forward-projection is ubiquitous across all projects.** Every file justifies at least one design choice by invoking a future state (future phases, future tools, future annotation workflows, future research). This is structurally unavoidable in phase planning — Phase 1 must anticipate Phase 2 — but the projections vary in how explicitly they are flagged as projections vs. stated as facts.

**Greenfield declarations carry hidden risk.** Both tain (D-00: "None — greenfield project. No existing code to reuse") and prix-guesser ("There is no existing application code yet, so this phase establishes the first reusable domain boundary") use the greenfield status as a contextual fact. But greenfield status means the design has no empirical feedback yet — all design claims are made without any implementation evidence. This is structurally different from claims made in mature projects where at least some predictions have been tested against reality.

---

*Audit completed 2026-04-09. All files read in full. No claims were pre-categorized; groupings emerged from analysis.*
