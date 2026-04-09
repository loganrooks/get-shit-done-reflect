# Epistemic Claim Audit — Batch 1

**Date:** 2026-04-09
**Agent:** claude-sonnet-4-6
**Scope:** All CONTEXT.md files in two projects:
- `arxiv-sanity-mcp` — 11 files (phases 01–10, with 04.1)
- `PDFAgentialConversion` — 10 files (phases 01–10, from main `.planning/`)
**Method:** No predefined categories. Read each file, quote every epistemically significant claim, describe what it does, then find natural groupings after the fact.
**Note:** Neither project uses `[grounded]`/`[open]` inline markers. All claims are unmarked. Epistemic work must be inferred from content, structure, and context.

---

## Part I: Claim-by-Claim Analysis

### arxiv-sanity-mcp

---

#### Phase 01 — Metadata Substrate (`01-CONTEXT.md`)

**ARXIV-01-01**
> "Greenfield project, no existing code"

*What it does:* Establishes scope for the codebase assumptions section. Rules out any dependency on inherited patterns — everything built in Phase 1 becomes canonical.
*Epistemic character:* This is a flat declaration that was true at the time of writing. It does no inferential work; it blocks inferential work (prevents the planner from looking for reusable assets). If wrong, the entire `code_context` section collapses.
*How it was established:* Stated without investigation. The correctness is trivially verifiable (check the repo), but the claim was not cross-checked against any file listing. It is self-evident to the author, not derived.

---

**ARXIV-01-02**
> "Philosophy papers excluded — separate philpapers/semantic-scholar MCP server handles that domain"

*What it does:* Carves out a category exclusion from scope. The exclusion is not justified by technical constraints — it is a product division.
*Epistemic character:* This is a design decision masquerading as a factual statement. The phrase "handles that domain" asserts that the other server actually exists and is functional. That assertion is not investigated here.
*What if wrong:* If the other server doesn't exist or is incomplete, the exclusion leaves a gap with no fallback. The claim forecloses asking "should we include philosophy papers?"
*How it was established:* Assumed from project context. The existence and adequacy of `philpapers/semantic-scholar MCP server` is treated as given.

---

**ARXIV-01-03**
> "NOT a simple date cutoff — use recency-weighted influence threshold... Exact thresholds are empirical — design the system to support configurable tiers, then tune"

*What it does:* Specifies the historical depth strategy as a deferred empirical question. It commits the architecture to support tiered thresholds while refusing to commit to specific values.
*Epistemic character:* The architectural commitment (support configurable tiers) is a decided choice. The threshold values are explicitly flagged as not-yet-known, requiring a future experiment. This is honest and structurally transparent.
*What if wrong:* If influence-based pruning doesn't work well in practice, the architecture still exists to support it. The claim is careful enough that wrongness only affects tuning, not structure.
*How it was established:* Derived from a design principle (recency-weighted relevance is more correct than hard cutoff). The principle is asserted, not argued.

---

**ARXIV-01-04**
> "Spike needed: measure influence-based pruning effectiveness across category sets to determine how broadly to set default categories"

*What it does:* Explicitly marks an unresolved empirical question and defers it. This is the one claim in Phase 1 that openly flags its own unknownness.
*Epistemic character:* Honest deferral. The claim does not pretend to know what it doesn't know. It names the risk and the needed action.
*What if wrong:* If the spike never happens, the default category set may be badly calibrated. The whole historical depth strategy depends on this empirical validation.

---

**ARXIV-01-05**
> "Daily incremental harvest matching arXiv's announcement cycle (OAI-PMH updates nightly)"

*What it does:* Commits the update frequency to OAI-PMH's cadence. This is a claim about arXiv infrastructure behavior.
*Epistemic character:* Inherited from external documentation. The claim is almost certainly correct (OAI-PMH nightly updates is well-known), but it was not investigated — it's carried in as common knowledge.
*What if wrong:* If arXiv's OAI-PMH update frequency changed, the harvest strategy would be misspecified.

---

#### Phase 02 — Workflow State (`02-CONTEXT.md`)

**ARXIV-02-01**
> "Global per-paper (not per-collection) — a paper has one triage state across the system"

*What it does:* Commits the data model to a simpler design. This choice has cascading implications: joining triage to collections requires global state, not per-collection state.
*Epistemic character:* This is a resolved design decision. It could be grounded in user need (consistency across collections) or in implementation simplicity. The rationale is not stated.
*What if wrong:* Users who want to triage the same paper differently in two different collections (common in multi-project research workflows) cannot do so.
*How it was established:* Stated as a decision, with no visible deliberation trail in the context.

---

**ARXIV-02-02**
> "Six fixed states: unseen, shortlisted, dismissed, read, cite-later, archived... States are NOT extensible (fixed enum)"

*What it does:* Commits to a closed vocabulary of triage states. The prohibition on extensibility is notable — it is a strong design choice that forecloses future user customization.
*Epistemic character:* Decided. The rationale is not stated in this file. Phase 04.1 will later contradict this partially (PREMCP-02 restores "seen" that was "dropped"), showing this claim was not fully stable at writing time.
*Internal tension:* Phase 04.1 CONTEXT reveals PREMCP-02: "seen" was intended by WKFL-03 but dropped. That means the "six fixed states" claim in Phase 2 was either wrong when written or reflected an intermediate decision that wasn't visible in this file.

---

**ARXIV-02-03**
> "Watch cadence hint stored (daily, weekly) — not enforced, advisory for external schedulers/agents"

*What it does:* Defines a field as intentionally non-enforcing. The advisory nature is a deliberate design decision — the system stores a preference but does not act on it autonomously.
*Epistemic character:* This is a design principle application (demand-driven, not autonomous). The claim is coherent with ADR-0002 (lazy enrichment, demand-driven) even though that ADR is not explicitly cited here.
*What if wrong:* If users expect cadence hints to trigger automated behavior, they will be surprised. The advisory nature is a quiet constraint that needs documentation visibility.

---

**ARXIV-02-04**
> "Phase 3 anticipation: every workflow action generates data that becomes an interest signal (triage = relevance, saved queries = focus areas, collection composition = topical clusters)"

*What it does:* Projects forward into Phase 3, asserting that Phase 2 artifacts will naturally become Phase 3 inputs. This is a design goal statement, not a description of existing behavior.
*Epistemic character:* Aspirational. The claim assumes that triage transitions will be in a form suitable as interest signals, that saved query usage will be trackable, and that collection membership will be analyzable as topical clusters. These are not verified — they are intentions built into the data model.
*What if wrong:* If the signal derivation logic in Phase 3 finds the workflow data too noisy or underspecified, the "anticipation" generates false confidence in the Phase 2 design.

---

#### Phase 03 — Interest Modeling & Ranking (`03-CONTEXT.md`)

**ARXIV-03-01**
> "Source: Inferred from Phase 1-2 context, ADRs, codebase patterns, and project principles"

*What it does:* Announces the epistemic provenance of the entire document. This is a meta-claim: the Phase 3 context was not gathered through user interviews or direct requirements elicitation but through inference.
*Epistemic character:* Unusually honest self-description. The author flags that Phase 3's context is second-order (inferred, not observed). This should lower the confidence weight on every claim in this file compared to contexts marked "gathered" from actual decisions.
*What if wrong:* If the inference chain has a gap, the entire Phase 3 architecture rests on a logical construction rather than a requirement.

---

**ARXIV-03-02**
> "Negative examples are soft demotions, not hard filters — papers similar to negatives get score penalties but are never fully hidden. Rationale: hard exclusion violates exploration-first (ADR-0001)"

*What it does:* A design decision justified by appeal to an ADR. This is one of the few claims in the corpus where the rationale is stated and traceable to a named document.
*Epistemic character:* Decided and grounded. The ADR-0001 citation is real and the derivation is valid: exploration-first means never fully hiding results.
*What if wrong:* If users want hard exclusion (e.g., they have already read a paper and never want to see it again), the soft demotion model may feel leaky. The ADR contains a value judgment (exploration > efficiency) that not all users share.

---

**ARXIV-03-03**
> "Author following via name strings (not entity table) accepts the reality that arXiv has no canonical author ID. Normalization can improve over time without schema changes."

*What it does:* Justifies a schema simplification by appealing to an external constraint (arXiv's lack of canonical author IDs) and a design principle (evolution over time without breaking changes).
*Epistemic character:* The external constraint (arXiv has no canonical author ID) is a factual claim about arXiv's data model. This is almost certainly correct but is not cited to any documentation. The design principle (names as strings, normalize later) is a decision.
*What if wrong:* If arXiv has (or gains) a canonical author ID system, the name-string approach foregoes a cleaner data model. OpenAlex provides author disambiguation — mentioned later as a future refinement, which somewhat hedges this.

---

**ARXIV-03-04**
> "Target hardware (Dionysus): Xeon W-2125 (4c/8t), 32GB RAM, GTX 1080 Ti (11GB VRAM), CUDA 11.8, Ubuntu 24.04... Phase 3 ranking is entirely CPU-bound and PostgreSQL-bound — no GPU, no embeddings, no external API calls needed"

*What it does:* Two claims bundled. First: hardware specs (factual, inherited from the machine's known configuration). Second: Phase 3 compute profile (a design assertion about what Phase 3 will not require).
*Epistemic character:* The hardware spec is inherited common knowledge, accurate at time of writing. The "entirely CPU-bound" claim is a design assertion — it holds only as long as ranking stays lexical-and-metadata-only. Phase 3's explicit deferral of semantic/vector ranking makes this self-consistent.
*What if wrong:* The CUDA version listed (11.8) is inconsistent with Phase 07's derived constraint C4 ("CUDA is 12.6 (driver 550.163.01), not 11.8. The CLAUDE.md documentation is stale."). This is an inherited stale fact propagated from CLAUDE.md without verification.

---

**ARXIV-03-05**
> "The 'explain' capability is the product's core differentiator from opaque recommendation systems — every ranking decision is inspectable and traceable back to specific profile signals."

*What it does:* Makes a market positioning claim — "core differentiator" relative to other systems.
*Epistemic character:* This is an assertion about the competitive landscape that is not investigated. No other systems are named, no comparison is made. The claim functions as motivation (why transparency matters) but would not survive scrutiny as a product claim without evidence.
*How it was established:* Stated as if obvious. It is a design value (transparency) dressed in competitive language.

---

#### Phase 04 — Enrichment Adapters (`04-CONTEXT.md`)

**ARXIV-04-01**
> "OpenAlex is the primary (and only Phase 4) enrichment source — answers Open Question Q4: 'Should OpenAlex be considered core? Yes.'"

*What it does:* Closes a previously open question. The claim cites a prior open question (Q4) and marks it resolved.
*Epistemic character:* Decided. The decision is correctly framed as the resolution of an open question. What's interesting is that the claim doesn't show the reasoning for why OpenAlex was chosen over Semantic Scholar — the answer is just "Yes." The reasoning must exist elsewhere (design docs).
*What if wrong:* If OpenAlex data coverage is poor for the user's specific subfields, the enrichment provides less value than expected. OpenAlex is known to have good coverage of CS/ML papers but variable coverage of newer preprints.

---

**ARXIV-04-02**
> "Enrichment is triggered explicitly by user or agent, never by the system autonomously — direct application of ADR-0002"

*What it does:* Grounds the demand-driven design in a named ADR. One of the cleanest grounding moves in the corpus.
*Epistemic character:* Grounded (ADR-0002 cites real design reasons). The derivation is clean: ADR says lazy enrichment, therefore no autonomous triggering.
*What if wrong:* If demand-driven enrichment means popular papers never get enriched (users forget to trigger it), the ranking pipeline in Phase 3 will have sparse enrichment data.

---

**ARXIV-04-03**
> "Polite pool as default: include `mailto` parameter in all requests → 10 req/s rate limit (vs 1 req/s without)"

*What it does:* States OpenAlex API rate limits as fact.
*Epistemic character:* Inherited from OpenAlex documentation. This is external technical documentation carried in as common knowledge. The numbers (10 req/s with email, 1 req/s without) are correct per OpenAlex's published documentation at the time but could change.
*What if wrong:* If OpenAlex changes their rate limits, the implementation may need adjustment.

---

**ARXIV-04-04**
> "At 5 req/s rate limit and 50 papers per batch request, one batch call enriches 50 papers in 0.2 seconds"

*What it does:* Provides a performance estimate for collection-scoped enrichment.
*Epistemic character:* This is arithmetic (50 papers / (5 req/s × 50 papers per request) = 0.2s), not empirical. The calculation is correct given the premises, but the premises (network latency, OpenAlex response time) are not measured — they are ignored. Real latency to api.openalex.org from dionysus would add significantly to this.
*What if wrong:* If network round-trips add 200-500ms per request, "0.2 seconds" becomes 0.2-0.7 seconds. The estimate is misleading because it ignores I/O time.

---

**ARXIV-04-05**
> "arXiv should remain the authoritative source... If OpenAlex title/authors differ from arXiv (they sometimes do), log a warning but keep arXiv data as canonical"

*What it does:* Establishes data provenance hierarchy. The parenthetical "(they sometimes do)" acknowledges that OpenAlex and arXiv data diverge in practice.
*Epistemic character:* The policy is a decided design choice. The empirical observation ("they sometimes do") is stated as common knowledge — it's true (OpenAlex normalizes author names, which can differ from arXiv's raw strings) but is not cited to evidence.

---

#### Phase 04.1 — MCP v1 (`04.1-CONTEXT.md`)

**ARXIV-041-01**
> "Category Jaccard is computed 3 times... Effective category weight: 0.375 (intended: 0.15). Fix: Remove redundant Jaccard from score_seed_relation and score_profile_match."

*What it does:* Names a specific implementation bug with numerical precision. The claim is a code inspection finding.
*Epistemic character:* Observed — derived from reading `interest/ranking.py`. This is one of the few empirically grounded claims in the corpus: someone actually looked at the code and found the triple-counting. The arithmetic is shown.
*What if wrong:* If the arithmetic is wrong, the bug description is wrong. But the claim is specific enough to verify by re-reading the code.

---

**ARXIV-041-02**
> "Count: 9 tools (within MCP-07's 5-10 range)"

*What it does:* Validates the tool count against a documented requirement (MCP-07).
*Epistemic character:* Anchored to a requirement (MCP-07). The count is verifiable; the requirement is traceable. This is clean grounding.
*Internal evolution:* Phase 5 calls the surface "10-tool + 4-resource + 3-prompt" (different count); Phase 7 says "11 tools after Phase 5"; Phase 9 says "10 MCP tools, 4 resources, 3 prompts." The count drifts across phases as tools are added, and Phase 04.1's "9 tools" becomes a historical artifact rather than a stable claim.

---

**ARXIV-041-03**
> "Prompt design requires real usage to validate. Phase 04.1 ships tools + resources only. Phase 5 adds prompts based on what workflows emerge."

*What it does:* Defers prompt design to empirical validation. Commits to a practice-first epistemology for this one component.
*Epistemic character:* Methodologically honest. It names the reason for deferral (prompts can't be designed by speculation) and specifies what evidence would resolve the deferral (real workflows from Phase 5).
*What if wrong:* If Phase 5 validation is cursory or the workflows don't generalize, the prompts will be under-informed by evidence.

---

#### Phase 05 — MCP Validation & Iteration (`05-CONTEXT.md`)

**ARXIV-05-01**
> "Phase 5 Is Qualitatively Different From Prior Phases... The primary activity is using the MCP, not building new code"

*What it does:* Frames Phase 5 as an empirical validation phase, not a construction phase. This is a meta-claim about the nature of the work.
*Epistemic character:* Methodological declaration. It establishes a standard for what counts as evidence in Phase 5 (real usage, not speculation).
*What if wrong:* If Phase 5 is used to build new code instead of validate, the empirical basis for Phase 6 design is foregone.

---

**ARXIV-05-02**
> "The arxiv-scan pipeline (/scratch/arxiv-scan/) produced data that should bootstrap the first real MCP usage: 154 analyzed papers, 10 tension definitions, 1,211 triage decisions, 4 known false negatives"

*What it does:* Identifies a specific existing dataset as the validation corpus.
*Epistemic character:* Anchored to a real artifact (`/scratch/arxiv-scan/`). The file paths and counts are stated as facts about an existing pipeline, not fabricated. These claims are verifiable.
*What if wrong:* If the arxiv-scan pipeline's output format doesn't match what the import script expects, or if the files have moved, the bootstrap plan fails. The claim treats `/scratch/arxiv-scan/` as stable — scratch directories are by convention temporary.

---

**ARXIV-05-03**
> "These are hypotheses. Real workflows may diverge. The point is to try them and see what sticks."

*What it does:* Explicitly labels the three prompt candidates (literature-review-session, daily-digest, triage-shortlist) as hypotheses.
*Epistemic character:* Unusually explicit epistemic humility. This claim prevents the reader from treating the prompt designs as commitments.
*What if wrong:* Nothing goes wrong if the hypotheses are wrong — that's what validation is for. The risk is that the hypotheses are too narrow and real workflows require prompts that weren't even considered.

---

**ARXIV-05-04**
> "'At least one real literature review session through MCP' — This means: connect Claude Code (or another MCP client) to the server with a real PostgreSQL database containing real arXiv papers"

*What it does:* Operationalizes a success criterion. Converts an abstract ("real literature review") into a concrete test.
*Epistemic character:* Definitional. The claim is a specification of what counts as success, not an empirical claim about the world.
*What if wrong:* If this operationalization is too narrow (e.g., it counts a session with only 5 papers as "real"), the success criterion is satisfied without the intended validation happening.

---

#### Phase 06 — Content Normalization (`06-CONTEXT.md`)

**ARXIV-06-01**
> "abstracts were sufficient for the Phase 5 literature review — full text is for deep reading, not discovery"

*What it does:* Grounds Phase 6's scope in Phase 5 evidence. The claim uses Phase 5 validation output to justify the ordering of Phase 6 work.
*Epistemic character:* Empirically grounded — derived from Phase 5's actual usage observations. This is one of the strongest epistemic anchors in the corpus: prior phase evidence feeding forward.
*What if wrong:* If Phase 5's "sufficiency" finding was idiosyncratic (the specific papers used had unusually informative abstracts), the Phase 6 deprioritization of full-text may be wrong for other corpora.

---

**ARXIV-06-02**
> "arXiv HTML is the highest-quality full-text source when available, and its coverage is expanding rapidly"

*What it does:* Makes two claims: HTML is highest quality, and coverage is expanding.
*Epistemic character:* The quality claim is plausible (HTML preserves math, structure) but is stated without benchmark comparison to source-derived extraction. The "expanding rapidly" claim is a temporal trend assertion — true as of early 2024 when ar5iv began aggressively converting, but the rate is not quantified.
*How it was established:* Referenced to "docs/07 §10, ecosystem analysis" — so there is a citation, but it's internal documentation rather than primary evidence.

---

**ARXIV-06-03**
> "arXiv has been converting papers to HTML5 since December 2023 (ar5iv project). Available at https://arxiv.org/html/{arxiv_id}. Not all papers have HTML — need to handle 404 gracefully"

*What it does:* States a factual claim about arXiv's HTML conversion program.
*Epistemic character:* Factual, from external knowledge. The December 2023 date and URL pattern are correct. The "not all papers" caveat is honest. The 60% coverage estimate elsewhere in the file is stated without a source.

---

**ARXIV-06-04**
> "For a local-only deployment (Logan's setup), rights-gating is simpler: local caching of conversions for personal use is generally permissible."

*What it does:* Makes a legal claim to justify a less restrictive implementation for the local deployment mode.
*Epistemic character:* This is a legal interpretation carried in as common knowledge, not legal advice or verified against a specific jurisdiction's fair use doctrine. "Generally permissible" is doing significant epistemic work without support.
*What if wrong:* The legal analysis may not hold in all jurisdictions or for all license types. arXiv's non-exclusive-distrib license does not explicitly grant personal-use caching. The claim is a working assumption with real-world consequences if wrong.

---

**ARXIV-06-05**
> "126 papers × ~50KB average markdown ≈ 6MB. Even at 1000 papers, this is negligible. TEXT column in PostgreSQL is fine."

*What it does:* A storage estimate used to justify a design choice (TEXT column over filesystem).
*Epistemic character:* The 50KB average is an estimate without stated basis. The arithmetic is correct given the premise. The conclusion ("TEXT column is fine") is a design decision justified by the estimate.
*What if wrong:* If scholarly papers average 200KB of markdown (a reasonable estimate for papers with many equations), 1000 papers = 200MB. That is still manageable in PostgreSQL but no longer "negligible." The estimate is optimistic.

---

#### Phase 07 — MCP Surface Parity (`07-CONTEXT.md`)

**ARXIV-07-01**
> "Source: Auto-generated from codebase analysis, ROADMAP.md success criteria, and Phase 04.1/05 patterns"

*What it does:* Discloses that Phase 7 context was generated automatically (presumably by a Claude agent) rather than gathered through a user design session.
*Epistemic character:* Honest provenance disclosure. This is the only CONTEXT.md in the arxiv corpus to flag auto-generation. It signals that the claims should be treated as agent inferences, not user decisions.

---

**ARXIV-07-02**
> "Phase 7 closes the gap between CLI capabilities and MCP tool surface... This is a wiring phase, not a feature phase."

*What it does:* Frames Phase 7 as gap closure. The "wiring phase" framing actively constrains what work is permitted — no new business logic.
*Epistemic character:* Definitional. The claim establishes scope by naming what the phase is and what it isn't. The claim that the gap exists is an observation from codebase analysis (supported by the table of services not yet in AppContext).

---

**ARXIV-07-03**
> "Phase 04.1 shipped 9 tools, Phase 5 added 2 (content + batch_signals) for 11 total. Phase 7 adds 2 new tools (create_profile, suggest_signals)... Final count: 13 tools"

*What it does:* Tracks tool count evolution and projects forward.
*Epistemic character:* This is arithmetic grounded in prior phases. But the claim that "Phase 5 added... batch_signals" conflicts with Phase 5's own CONTEXT.md, which doesn't mention a `batch_signals` tool explicitly. The count may be correct, but its derivation is traced through memory/inference rather than re-verification.

---

#### Phase 08 — Infrastructure Fixes (`08-CONTEXT.md`)

**ARXIV-08-01**
> "The enrichment service is broken against the live database... Quick Task 1 (2026-03-11) changed the code to expect a composite PK (arxiv_id, source_api) on paper_enrichments, but migration 006 may not have been applied to the live database."

*What it does:* Names a specific defect with traceable cause (Quick Task 1, a code change on 2026-03-11).
*Epistemic character:* Observed — derived from comparing code expectations to database state. The word "may not have been applied" is honest uncertainty about the live state.
*What if wrong:* If migration 006 was already applied, this is a false alarm. The "may" hedges appropriately.

---

**ARXIV-08-02**
> "No human checkpoint — research confirmed existing data is safe (all rows have source_api='openalex' server_default, arxiv_id was previously unique, no duplicate composite keys possible)"

*What it does:* Justifies automated migration without manual review by stating that the data integrity analysis was done.
*Epistemic character:* Anchored to a research finding (the analysis was performed). The three premises (server_default exists, arxiv_id was unique, no duplicates) are stated as confirmed but the confirming evidence is not shown in this file.
*What if wrong:* If any of the three premises is wrong, running `alembic upgrade head` without a human checkpoint could corrupt live data.

---

**ARXIV-08-03**
> "Context generated via 6-layer epistemic analysis: assumptions, grey area identification (material/formal/efficient/final), prioritization by reversibility, dialectical consistency check, failure mode analysis, and iterative convergence."

*What it does:* Announces the methodology used to generate the Phase 8 context itself.
*Epistemic character:* Meta-methodological claim. Notably, this is the only CONTEXT.md in either corpus that explicitly describes its own generation method. The "6-layer" framing references an Aristotelian causal schema (material/formal/efficient/final causes) — applied to software planning.
*What if wrong:* The methodology claim is unfalsifiable from within the document. The quality of the output is what can be assessed, not the process.

---

#### Phase 09 — Release Packaging (`09-CONTEXT.md`)

**ARXIV-09-01**
> "MIT chosen for maximum adoption — standard for Python tools, no copyleft, compatible with all downstream use"

*What it does:* Justifies license selection with three stated reasons.
*Epistemic character:* Decided, with reasoning stated. "Standard for Python tools" is a cultural observation (true). "No copyleft" is a factual property of MIT. "Compatible with all downstream use" is a simplification — MIT is compatible with most licenses but not compatible with all (some strong copyleft licenses have interaction issues).
*How it was established:* Author reasoning, not deliberation against alternatives.

---

**ARXIV-09-02**
> "No existing remote configured — repo must be created fresh and history pushed"

*What it does:* States the current Git repository state.
*Epistemic character:* Observed at time of writing. A factual claim about the repo's git remote configuration, verifiable with `git remote -v`.

---

**ARXIV-09-03**
> "Feature overview should highlight: 10 MCP tools, 4 resources, 3 prompts, 493 tests passing"

*What it does:* Specifies what the README should claim about the system's capabilities at release.
*Epistemic character:* This is a target state claim — it describes what should be true when the README is written, not what is currently true. The 493 test count is a specific number that was presumably verified at Phase 8 completion, then carried forward as a target.
*What if wrong:* If Phase 8 infrastructure fixes broke or added tests, the count may be wrong by release. The number is presented as fixed when it is actually a moving target.

---

**ARXIV-09-04**
> "Installation requires: Python 3.13+, PostgreSQL running, database user created, .env configured, alembic upgrade head, then CLI/MCP server. Five steps before anything works."

*What it does:* Characterizes the user installation experience as high-friction ("Five steps before anything works").
*Epistemic character:* Observational — someone counted the required steps and labeled them "five." This is an honest self-assessment of the product's onboarding friction.
*What if wrong:* If a future Docker image reduces this to one step, the claim about friction becomes outdated. But at time of writing it is accurate.

---

#### Phase 10 — Agent Integration Test (`10-CONTEXT.md`)

**ARXIV-10-01**
> "Claude Code on this machine (dionysus) — the only available MCP client (Claude Desktop is Mac-only; no other MCP clients installed)"

*What it does:* Establishes the validation environment by scoping available MCP clients.
*Epistemic character:* Observed — a factual claim about the installed software on dionysus. "Claude Desktop is Mac-only" is an accurate description of Claude Desktop's availability at this time.
*What if wrong:* If another MCP client is installed but overlooked, the scoping is wrong but the consequence is minor (more options, not fewer).

---

**ARXIV-10-02**
> "The arxiv-scan corpus includes papers on consciousness, phenomenology, and philosophy of mind — these are Logan's actual research interests, making this a genuine validation not a synthetic test"

*What it does:* Claims that the validation is "genuine" because the data matches real research interests.
*Epistemic character:* This claim mixes a factual assertion (the corpus topics) with a methodological one (real interests = genuine validation). The methodological claim is debatable — even real interests with a convenient pre-imported corpus can produce an atypical validation experience.
*What if wrong:* The validation may still be synthetic in an important sense: it uses a corpus that was shaped by a specific earlier analysis pipeline rather than raw arXiv queries. Real production use would start differently.

---

**ARXIV-10-03**
> "If the agent struggles to use a tool, that's signal about tool description quality, not about the tool's functionality (which is already tested by 493 tests)"

*What it does:* Makes a categorical separation between tool description quality (Phase 10 concern) and tool functionality (pre-tested).
*Epistemic character:* This is a diagnostic heuristic — a rule for interpreting Phase 10 failures. The claim is sound as a heuristic but overstated: agent failure could also indicate tool functionality bugs that unit tests didn't catch, or tool design issues (correct functionality, wrong interface).

---

### PDFAgentialConversion

---

#### Phases 01–06 (thin CONTEXT.md files)

The first six PDFAgentialConversion CONTEXT.md files are essentially stubs — each is 4-8 lines long, stating only a phase goal and acceptance criteria. They contain almost no claims in the epistemological sense. What's present is:

**PDF-01-01 through PDF-06-01** (pattern repeated across phases 01–06):

> Phase 01: "Formalize the repo as a Git + GSD workspace with a canonical local operator surface and runtime-output policy."
> Phase 02: "Preserve wrapper CLI compatibility while moving reusable logic under src/pdfmd/."
> Phase 03: "Make project health visible at a glance and harden runtime diagnostics for the local gate."
> Phase 04: "Restore why-ethics to the frozen gate baselines before accepting further extractor heuristics."
> Phase 05: "Close the remaining Of Grammatology and Otherwise than Being defects without regressing Specters of Marx."
> Phase 06: "Resume and finish the deferred why-comment chapter-5 inset-quote fixes after the foundation and cross-book gates are stable."

*What these do:* Each states a phase goal and implies an ordering constraint (Phase 04 must come before more extractor heuristics; Phase 05 must not regress Phase 03's work; Phase 06 depends on Phase 05 stability). The acceptance criteria in Phase 01 are the only substantive epistemic content in phases 01-06.
*Epistemic character:* These are task specifications, not epistemic claims. They assert ordering dependencies (Phase 06's "after the foundation and cross-book gates are stable" implies Phase 06 shouldn't begin until Phases 03-05 are done) but don't argue for the ordering.
*What if wrong:* The ordering dependencies are the most vulnerable: if Phase 05 is declared "done" without full defect closure, Phase 06 inherits instability. The CONTEXT files offer no independent verification mechanism.

---

#### Phase 07 — Infrastructure Alignment and Live Pipeline (`07-CONTEXT.md`)

**PDF-07-01**
> "A1: Process isolation already handles most VRAM cleanup. Each remote model evaluation is a separate SSH command launching a new Python process... When the process exits, VRAM is freed by the OS/driver."

*What it does:* States an assumption about OS-level GPU memory management that justifies not implementing in-process VRAM cleanup.
*Epistemic character:* Working assumption, explicitly labeled as such ("A1:"). The claim is grounded in general OS behavior (process exit frees resources) but explicitly deferred for validation: "*Validate by:* confirming that nvidia-smi shows clean VRAM between sequential SSH evaluation commands."
*What if wrong:* If GPU memory doesn't fully clear on process exit (CUDA driver bugs, zombie processes), subsequent models may OOM.

---

**PDF-07-02**
> "A2: The --system-site-packages venv inherits torch from the conda base. Since dionysus has torch 2.9.1+cu126 in the base environment, the pinned torch==2.4.1 in remote-embedding-requirements.txt is never installed."

*What it does:* Explains why a version pin is effectively dead code. This is an assumption about Python environment behavior.
*Epistemic character:* Working assumption with validation action specified. The claim is plausible (--system-site-packages with a newer system version would shadow the pin) but relies on the premise that torch 2.9.1+cu126 is actually in the conda base. The premise is stated as fact.
*Internal tension:* The Phase 07 context was gathered on 2026-03-20. The CLAUDE.md global environment description (which lists system specs) says "CUDA: 11.8" — but Phase 07's constraint C4 says "CUDA is 12.6 (driver 550.163.01), not 11.8. The CLAUDE.md documentation is stale." This is the same stale CLAUDE.md information flagged in arxiv-sanity-mcp Phase 03. The torch version (2.9.1+cu126) implies CUDA 12.6 is correct.

---

**PDF-07-03**
> "A3: The evaluator script works on the remote host despite the hardcoded Mac path. embedding_space.py:20 has PROJECT_ROOT = Path('/Users/rookslog/Projects/PDFAgentialConversion') but this is only used for DEFAULT_APPLE_HELPER... which is irrelevant when running with --embedding-backend sentence_transformers on the remote host."

*What it does:* Defends against a potential code path bug by asserting the hardcoded Mac path is never reached during remote execution.
*Epistemic character:* Working assumption with validation action specified. The claim is a code analysis finding — someone read line 20 of embedding_space.py and traced where PROJECT_ROOT is used.
*What if wrong:* If PROJECT_ROOT is used in another code path that runs during sentence_transformers evaluation (e.g., a shared utility function), the hardcoded path would cause a failure on dionysus.

---

**PDF-07-04**
> "C4: CUDA is 12.6 (driver 550.163.01), not 11.8. The CLAUDE.md documentation is stale."

*What it does:* Explicitly corrects a stale fact from the project's own global documentation (CLAUDE.md). This is a self-audit finding.
*Epistemic character:* Observed — derived from inspecting the actual system or runtime evidence. This is notable: the CONTEXT.md is more accurate than the project's primary documentation.
*Consequence:* Other phases that inherit from CLAUDE.md carry the wrong CUDA version. The arxiv-sanity-mcp Phase 03 CONTEXT repeated the wrong version (11.8) without correction. The correction only appears in PDFAgentialConversion Phase 07.

---

**PDF-07-05**
> "G1: Do not assume the existing dry-run tests cover live execution paths. The comparison harness has if dry_run: return runtime early exits throughout. Research should identify what code paths are untested when --dry-run is False."

*What it does:* Epistemic guardrail — a warning about a testing gap.
*Epistemic character:* Observed code structure finding. The guardrail is a flag about what is not yet known (the live execution paths). It functions as a directive to future researchers: "don't assume safety here."

---

#### Phase 08 — Expanded Embedding Evaluation (`08-CONTEXT.md`)

**PDF-08-01**
> "A1: Phase 07 pipeline is stable and proven. Live metrics from all 3 models (bge-small, bge-base, e5-base) returned successfully via the Mac → SSH → dionysus path... Validate by: Phase 07 completion status in STATE.md (confirmed 2026-03-20)."

*What it does:* Treats Phase 07's completion as evidence for Phase 08 assumptions. Cites STATE.md as the verification source.
*Epistemic character:* Anchored — the validation source is named (STATE.md, 2026-03-20). This is one of the cleanest grounding moves in the PDFAgentialConversion corpus: prior phase completion, verified in an artifact, used as a foundation for the next phase's assumptions.

---

**PDF-08-02**
> "A2: All 5 new models fit in 11GB VRAM with conservative batch sizes. Research estimates: bge-large ~2.5GB at batch=8, e5-large ~2.5GB at batch=8, gte-large ~3.0GB at batch=8, bge-m3 ~4.0GB at batch=4, nomic-embed ~1.5GB at batch=16."

*What it does:* Provides VRAM consumption estimates for models not yet run.
*Epistemic character:* Stated as "research estimates" — derived from HuggingFace model cards and community reports, not empirical measurement. The qualification is present: "*Validate by:* first live run with VRAM safety threshold catching any OOM before model load." The estimates are labeled as estimates.
*What if wrong:* The guardrail G1 directly addresses this: "Do not assume research VRAM estimates are accurate." The CONTEXT is self-aware about the estimate's epistemic status.

---

**PDF-08-03**
> "A3: The 600s per-model evaluation timeout is sufficient for larger models. Phase 07 showed ~7s for bge-small (33M), ~29s for base-size models (109M). Larger models (335M-568M) should complete within 600s even at lower batch sizes."

*What it does:* Extrapolates from Phase 07 measurements to Phase 08 model sizes.
*Epistemic character:* Grounded in Phase 07 empirical data (7s for 33M, 29s for 109M), then extrapolated. The extrapolation is stated as an assumption, not a certainty. The timeout is noted as "CLI-configurable if adjustment is needed" — reversibility is acknowledged.
*What if wrong:* If large models (bge-m3 at 568M) take >600s (e.g., due to slow model download, first-time compilation), they will time out. Phase 08 will later measure bge-m3 at 332s, confirming the estimate was safe.

---

**PDF-08-04**
> "Q3: Will scholarly retrieval metrics meaningfully differentiate between models, or will all large models cluster near the ceiling?"

*What it does:* Names an open epistemic question that Phase 08 is designed to answer.
*Epistemic character:* Explicitly open. The question acknowledges that the data may be uninformative in the expected way ("all score >0.99"). Phase 08 will later confirm that clustering near the ceiling is exactly what happens (all top models at ~0.99+ hit@1).
*Forward validation:* Phase 10's context refers to "bge-m3 is the current winner (hit@1=0.9964, MRR=0.9973)" — the ceiling clustering did occur, and the question was answered empirically.

---

**PDF-08-05**
> "C7: The plans already exist (08-01, 08-02, 08-03). Written before this context document. This CONTEXT.md retroactively documents the steering brief the plans embody."

*What it does:* Admits that the CONTEXT.md was written after the plans, not before.
*Epistemic character:* Honest about inversion of the expected workflow. Normally, CONTEXT precedes PLAN. Here, PLAN preceded CONTEXT. The CONTEXT is therefore a post-hoc rationalization of already-made decisions, not a decision-guiding brief.
*Consequence:* The "decisions" in this file are not decisions — they are descriptions of choices already made. The epistemic status of the entire Phase 08 CONTEXT document is retroactive documentation, not prospective guidance.

---

**PDF-08-06**
> "G2: Do not assume MTEB rankings predict scholarly text performance. The evaluator's domain-specific corpora (why-ethics, commentary-dense and multi-column layouts) test something different from generic retrieval benchmarks."

*What it does:* Guards against over-reliance on public benchmark data for model selection.
*Epistemic character:* Methodological principle. The claim that domain-specific evaluation is different from MTEB benchmarks is a general truth about evaluation — stated without citation but well-supported by the ML evaluation literature.

---

#### Phase 09 — GLM-OCR Exploration (`09-CONTEXT.md`)

**PDF-09-01**
> "Model: zai-org/GLM-OCR (0.9B parameter vision-language model)... Expected speed: ~30-60s per page on GTX 1080 Ti at fp16. VRAM: ~4-6 GB (0.9B model + inference buffers)"

*What it does:* Provides performance estimates for a model not yet run on this hardware.
*Epistemic character:* Research-derived estimates. The ranges (30-60s, 4-6GB) suggest uncertainty about exact values. Unlike Phase 08's VRAM estimates, these are stated without an explicit "validate by" action, though the phase goal is to "prove it works end-to-end with live GPU metrics."

---

**PDF-09-02**
> "Transformers version conflict: Embedding stack uses transformers 4.51.3; GLM-OCR requires >= 5.3.0. Must use separate venv WITHOUT --system-site-packages."

*What it does:* States a concrete technical constraint derived from inspecting actual dependency requirements.
*Epistemic character:* Observed. The version conflict was discovered by checking GLM-OCR's requirements against the existing stack. This is a code inspection finding, not an assumption.
*What if wrong:* If GLM-OCR actually works with a backport or if 4.51.3 is newer than expected (given the unusual version numbering), the isolation requirement may be unnecessarily strict.

---

**PDF-09-03**
> "Alternative fallback: olmOCR-2-7B-FP8 (too large for 11GB without quantization)"

*What it does:* Rules out an alternative model based on VRAM constraints.
*Epistemic character:* Research estimate. The 7B model at FP8 precision would require approximately 7GB for weights alone, leaving insufficient buffer for inference — the ruling-out is plausible arithmetic, but "without quantization" acknowledges the constraint can be changed.

---

**PDF-09-04**
> "Running from dionysus: Phase 08 established a localhost SSH workaround. Phase 09 can use direct local execution since we're ON dionysus."

*What it does:* Makes a workflow decision based on execution context (being physically on the machine).
*Epistemic character:* This is a situational fact (the operator is running Phase 09 from dionysus directly) used to justify simplifying the execution path. The claim that Phase 08 established a "localhost SSH workaround" is an anchored reference to prior phase context.

---

#### Phase 10 — Inference Optimization (`10-CONTEXT.md`)

**PDF-10-01**
> "A1: Phase 08 baselines are the optimization reference. All 8 models have measured runtime_seconds, hit@1, MRR, and twin cosine from at least 2 independent runs. bge-m3 is the current winner (hit@1=0.9964, MRR=0.9973, 332s)."

*What it does:* States empirical results from Phase 08 as the reference baseline for Phase 10.
*Epistemic character:* Anchored to real measurement artifacts (`comparison-summary.json` files named in `canonical_refs`). The specific numbers (0.9964, 0.9973, 332s) are verifiable from the artifacts.
*Validate by:* "Confirming comparison-summary.json artifacts exist under generated/embedding-backend-comparison/ with complete metrics for all 8 models." The validation step is named.

---

**PDF-10-02**
> "A2: Top-5 cluster is the natural optimization candidate set. Models with hit@1 >= 0.9928 form a quality tier."

*What it does:* Proposes a threshold (0.9928) for defining the optimization candidate set.
*Epistemic character:* Derived from Phase 08 data, but the threshold is chosen to include a specific set of 5 models. The reasoning ("natural clustering") is circular — the threshold is set where the desired cluster boundary is, then justified as "natural." Question Q3 directly challenges this: "A fixed hit@1 >= 0.99 captures 2 models; hit@1 >= 0.9928 captures 5. The choice changes how many optimization runs are needed."
*What if wrong:* The "natural" framing obscures that this is a design choice about how many models to optimize. The threshold is arbitrary in the sense that other reasonable thresholds would produce different candidate sets.

---

**PDF-10-03**
> "A3: INT8 dynamic quantization, ONNX Runtime, torch.compile, and batch size sweeps are the candidate optimization techniques."

*What it does:* Names four optimization approaches as the candidate space.
*Epistemic character:* Working assumption explicitly labeled as needing validation: "Whether all four are viable on GTX 1080 Ti compute 6.1 with sentence-transformers is an open empirical question." Q1 and Q2 directly address the viability question.
*What if wrong:* If INT8 dynamic quantization causes significant accuracy degradation on this hardware/framework combination, or if ONNX Runtime GPU requires a higher compute capability, the candidate set may shrink. The document is upfront about this uncertainty.

---

**PDF-10-04**
> "The roadmap's key insight is correct: 'Optimization response varies per model — a slightly lower-quality model may become dramatically faster under quantization while a higher-quality model gains little.'"

*What it does:* Endorses a ROADMAP claim as a "key insight" to guide Phase 10.
*Epistemic character:* This endorses a design principle as empirically established when it is actually a hypothesis. The statement "optimization response varies per model" is a well-known general truth in ML engineering, but whether it applies to THIS specific model set is still unknown. The word "correct" imports more certainty than the context warrants.

---

**PDF-10-05**
> "G5: Do not assume the Pareto frontier has a clear winner. The roadmap's key insight is correct: 'optimization response varies per model.' The output may reveal that no single model dominates on both quality and speed, requiring an explicit trade-off decision."

*What it does:* Guards against premature closure — warns that the Pareto analysis may produce ambiguity, not a clear answer.
*Epistemic character:* Epistemically modest. The guardrail names a possible outcome (no dominant model) and frames it as a legitimate result, not a failure. This prevents the implicit assumption that optimization will produce a "winner."

---

## Part II: Natural Groupings

After reading all 21 CONTEXT.md files and the claims above, the following groupings emerge from the data. These are not imposed categories — they are patterns that recur across files.

---

### Group 1: Anchored-and-Validated

Claims that cite a specific artifact, measurement, or prior phase result, and also specify how to validate the citation.

Examples: PDF-07-01 (validate VRAM by nvidia-smi), PDF-07-02 (validate by inspecting bootstrap script), PDF-07-03 (validate by confirming code path), PDF-08-01 (validate by STATE.md), PDF-10-01 (validate by comparison-summary.json).

**Character:** These claims do two things: cite a source AND name a validation action. They are epistemically the most rigorous in the corpus. They're concentrated in PDFAgentialConversion phases 07-10, which use an explicit `<assumptions>` section with "validate by" phrasing.

**Boundary case:** ARXIV-08-02 (migration data safety) claims research was done but doesn't show the evidence. It is anchored to a research finding but doesn't name a validation action — it's anchored without a verification loop.

---

### Group 2: Openly Deferred

Claims that explicitly name their own unknownness and specify what would resolve the uncertainty. These are not failures of rigor — they are successful epistemic management.

Examples: ARXIV-01-04 (spike needed for pruning effectiveness), ARXIV-04-02 (demand-driven confirmed by ADR but gap risk named), ARXIV-05-03 (prompt designs as hypotheses), PDF-08-04 (Q3: ceiling clustering open question), PDF-10-03 (optimization technique viability open empirical question).

**Character:** These claims function as forward-pointing markers: "here is what we don't know, here is what would resolve it." The resolution action is specific (run a spike, use validation session, run live evaluation).

**Boundary case:** ARXIV-06-04 (legal interpretation of local caching) is not labeled as open but should be. It behaves like a decided claim but rests on an unexamined legal premise.

---

### Group 3: ADR-grounded Decisions

Claims explicitly citing an ADR (Architecture Decision Record) as the justification for a design choice.

Examples: ARXIV-03-02 (negative examples as soft demotions, citing ADR-0001), ARXIV-04-02 (demand-driven enrichment, citing ADR-0002), ARXIV-04-05 (arXiv as authoritative source, citing doc 07 §1), ARXIV-06-01 (full text deferred, citing Phase 5 findings).

**Character:** These are the most traceable claims in the arxiv corpus. The ADR system provides a named, stable citation target. Where the ADR is cited, the derivation is usually clean. Where the ADR is referenced by number only (without stating the ADR's content), the grounding is incomplete for a reader who doesn't have the ADRs open.

**Boundary case:** Some claims invoke ADR principles without citing the ADR number: ARXIV-02-03 (advisory cadence aligns with demand-driven principle from ADR-0002) and ARXIV-01-03 (configurable tiers align with ADR-0001's exploration-first) are implicitly ADR-grounded but don't say so.

---

### Group 4: Inherited Common Knowledge

Claims that assert facts about external systems (arXiv API behavior, OpenAlex rate limits, CUDA specifications, Python packaging conventions) without citing primary sources. These are carried in as things "everyone knows."

Examples: ARXIV-01-05 (OAI-PMH updates nightly), ARXIV-04-03 (OpenAlex polite pool rate limits), ARXIV-06-03 (arXiv HTML since December 2023), ARXIV-09-01 (MIT standard for Python tools), PDF-09-02 (transformer version conflict from inspecting requirements).

**Character:** Most of these claims are correct but uncheckable from within the document. They are the epistemic bedrock the planning rests on. Their failure mode is quiet — they can become wrong as external systems change, but there's no mechanism in the CONTEXT files to detect this.

**Distinct subtype:** Some inherited-knowledge claims are about physical infrastructure (machine specs, installed software, file locations). These are typically more stable but can become stale: ARXIV-03-04 (CUDA 11.8) turned out to be stale, as PDF-07-04 corrects.

---

### Group 5: Design Decisions Without Visible Deliberation

Claims that state implementation choices as resolved without showing the deliberation that produced them. These differ from ADR-grounded decisions in that no deliberation artifact is cited.

Examples: ARXIV-02-01 (triage state is global per-paper, not per-collection), ARXIV-02-02 (six fixed states, not extensible), ARXIV-09-01 (MIT license), ARXIV-01-02 (philosophy papers excluded).

**Character:** These decisions are real — they're in the code. But the CONTEXT files present them as settled without explaining why the alternative was rejected. The reader cannot reconstruct the decision from the document. They are decisions with hidden premises.

**Risk:** These are vulnerable to silent reversal. ARXIV-02-02 demonstrates this: "six fixed states, not extensible" was partially reversed in Phase 04.1 (PREMCP-02 adds "seen"), but the Phase 02 CONTEXT was not updated. The claim remains in Phase 02 as if settled.

---

### Group 6: Forward Projections

Claims about what future phases will use, need, or be able to do — made from the perspective of an earlier phase.

Examples: ARXIV-01-03 (Phase 1 schema anticipates multi-tier processing; Phase 3-4 concern), ARXIV-02-04 (Phase 3 will use workflow data as interest signals), ARXIV-03-04 (Phase 3 is solidly "Bronze" compute, future semantic features for v2), ARXIV-04-05 (data model ranking-ready for Phase 3 extension), ARXIV-08-04 (Phase 10 depends on Phase 08 speed rankings).

**Character:** These are design intentions that span phase boundaries. They function as implicit contracts between phases: "Phase 1 will leave this ready for Phase 4." The problem is that they are one-sided contracts — the receiving phase (Phase 3, Phase 4) doesn't know it is supposed to receive something specific until it reads the earlier phase's context.

**Risk:** If the receiving phase's plan doesn't align with the projection (because the planner didn't read Phase 1's context), the contract is broken silently. ARXIV-07-02 demonstrates this: Phase 7's auto-generated context notes that `ProfileRankingService` is "not in AppContext" — a forward projection from earlier phases that wasn't automatically enforced.

---

### Group 7: Self-Correcting Observations

Claims that actively correct prior documentation or inherited information.

Examples: PDF-07-04 (CUDA is 12.6, not 11.8 as CLAUDE.md says), ARXIV-08-01 (migration may not have been applied — discovering a gap between code and database), ARXIV-041-01 (Jaccard triple-counting bug found by reading the code).

**Character:** These are the most epistemically productive claims in the corpus. They represent moments where the context-gathering process discovered something wrong with prior knowledge. They are rare: three instances across 21 files.

**Significance:** The existence of self-correcting claims suggests that context-gathering sometimes functions as a de facto audit. But the rarity (three out of hundreds of claims) suggests this function is not systematically exercised.

---

### Group 8: Retroactive Documentation

Claims in CONTEXT.md files that describe decisions already made rather than guiding decisions to be made.

Examples: PDF-08-05 (explicit: "CONTEXT.md retroactively documents the steering brief the plans embody"), ARXIV-07-01 (auto-generated from codebase, not user decisions), the entire Phase 08 PDFAgentialConversion document structure.

**Character:** These CONTEXT.md files are written after the plans they're supposed to guide. This inverts the expected epistemic order. The document is a description of what happened, presented in the future tense as if it were a guide to what will happen.

**Consequence:** The epistemic work done by retroactive CONTEXT files is different: they are records, not guides. Claims in them describe the world as it is, not as it should be made. This makes them more reliable as factual records but less useful as planning constraints.

---

### Group 9: Performance Estimates Without Measurement

Claims stating specific numbers (storage sizes, timing, bandwidth) derived from arithmetic rather than empirical measurement.

Examples: ARXIV-04-04 (50 papers in 0.2 seconds — ignores network latency), ARXIV-06-05 (126 papers × ~50KB = 6MB — optimistic size estimate), PDF-08-02 (VRAM estimates from model cards, not measurement), PDF-10-01 (332s runtime — this one IS measured, from Phase 08).

**Character:** Most performance estimates in the corpus are arithmetic from stated premises, not empirical measurements. The premises are often generous (ignoring network overhead, using best-case average sizes). The estimates are used to justify design decisions (TEXT column vs filesystem, single-node computation).

**Boundary case:** PDF-10-01's 332s figure is an empirical measurement from Phase 08 artifacts. It is distinguished from the other performance estimates by having been actually measured.

---

### Group 10: Legal and Ethical Assertions

Claims about legal permissions, rights, or compliance that are stated as facts rather than analyzed positions.

Examples: ARXIV-06-04 (local caching "generally permissible" for personal use), ARXIV-09-01 (MIT "compatible with all downstream use").

**Character:** These claims carry significant stakes (legal risk, compliance) but are stated without citation to legal analysis, jurisdiction, or professional advice. They are working assumptions presented as facts.

**Why this is notable:** The legal claims appear in the same register as technical claims (factual statements without hedging). A reader would not know they need special scrutiny unless they already knew the topic was legally uncertain.

---

## Part III: Boundary Cases and Cross-Cutting Notes

### The Stale CLAUDE.md Propagation

The CUDA version error (11.8 vs 12.6) appears in ARXIV-03-04 (inherited uncritically from CLAUDE.md) and is corrected in PDF-07-04 (derived from runtime evidence). Both projects share the same CLAUDE.md. The error propagated across projects because the CONTEXT.md files inherit from a common documentation source without independently verifying it. This is a systemic vulnerability: CLAUDE.md functions as authoritative but its currency is not maintained.

### The Thin vs. Thick CONTEXT Spectrum

PDFAgentialConversion phases 01-06 are 4-8 line stubs; phases 07-10 are full documents with sections for assumptions, decisions, constraints, questions, and guardrails. The arxiv-sanity-mcp files are thick throughout. This spectrum reveals that CONTEXT.md quality is not uniform even within a project. The thin files do almost no epistemic work; the thick files contain an explicit epistemology (the `<assumptions>` + `*Validate by:*` structure in PDFAgentialConversion 07+).

### The Inversion Pattern (Plans Before Context)

PDFAgentialConversion Phase 08 explicitly admits plans were written before the CONTEXT. This is the most honest admission in the corpus. But it is likely not unique — ARXIV-07-01 ("auto-generated from codebase analysis") suggests the arxiv Phase 07 context was also generated after-the-fact, just less explicitly. The convention that CONTEXT precedes PLAN is routinely violated.

### The Tool Count Drift

The MCP tool count in arxiv-sanity-mcp drifts: Phase 04.1 says 9, Phase 05 implies 10 (after adding batch_signals — unclear), Phase 07 says 11, Phase 9 target is 13. Each CONTEXT.md carries the count of its moment but doesn't backfill earlier files. A reader tracing the counts across all phases would find inconsistencies that are not errors but temporal snapshots. This is a documentation maintenance problem: the count in Phase 04.1 will always read "9" even after Phase 09, making early-phase CONTEXT files misleading to a reader who doesn't know the history.

### The "Current Winner" Claim

PDF-10-01 states "bge-m3 is the current winner (hit@1=0.9964, MRR=0.9973, 332s)." This is a factual claim about Phase 08 results, but Phase 10 may revise it if optimization changes the ranking. The word "current" does appropriate hedging — it acknowledges the claim's temporality. Phase 10 is designed to potentially change which model is the winner.

---

## Part IV: Summary Statistics and Observations

**Claims catalogued:** ~55 across 21 files (excluding the 6 thin PDFAgentialConversion files which contain no claims in the epistemological sense).

**Group distribution:**

| Group | Count | Concentration |
|-------|-------|--------------|
| Anchored-and-Validated | 7 | Mostly PDF phases 07-10 |
| Openly Deferred | 8 | Both projects, thick files |
| ADR-grounded Decisions | 5 | arxiv only (has ADR system) |
| Inherited Common Knowledge | 8 | Both projects, throughout |
| Design Decisions Without Visible Deliberation | 6 | arxiv phases 01-04 |
| Forward Projections | 6 | Both projects |
| Self-Correcting Observations | 3 | Both projects, rare |
| Retroactive Documentation | 3 | PDF-08, arxiv-07 |
| Performance Estimates Without Measurement | 5 | Both projects |
| Legal/Ethical Assertions | 2 | arxiv phases 06, 09 |

**Key finding:** The two projects have different epistemic cultures despite sharing a harness. PDFAgentialConversion phases 07-10 have an explicit validation contract (every assumption names its validation action). arxiv-sanity-mcp relies more on ADR citations and design principles but does not systematically require validation actions. Both have blind spots — arxiv's ADR system makes some decisions legible but creates an assumption that ADR-grounded decisions don't need empirical validation; PDF's validation contract is only present in the later phases.

**Most trustworthy claims:** Anchored-and-Validated (PDFAgentialConversion 07-10), Self-Correcting Observations, ADR-grounded Decisions with stated rationale.

**Least trustworthy claims:** Performance Estimates Without Measurement, Legal/Ethical Assertions, Design Decisions Without Visible Deliberation, and any claim inherited from CLAUDE.md without independent verification.

**The one claim type conspicuously absent:** In neither project does a CONTEXT.md file say "we considered this alternative and rejected it because..." The choice alternatives are invisible. The deliberation is private. Readers see only the path taken.

---

*Audit completed: 2026-04-09*
*Files read: 21 CONTEXT.md files across 2 projects*
*Agent: claude-sonnet-4-6*
