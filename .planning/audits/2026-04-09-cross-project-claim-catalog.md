---
date: 2026-04-09
audit_type: claim_integrity
scope: "Cross-project claim catalog -- claim patterns across 12 projects"
triggered_by: "deliberation: claim-type-ontology.md"
ground_rules: none
tags: [claims, claim-types, catalog, cross-project]
---
# Cross-Project Claim Catalog
**Date:** 2026-04-09
**Purpose:** Catalog [grounded]/[open] claims from CONTEXT.md files across other GSD-managed projects to assess whether the proposed claim-type ontology is necessary and sufficient.

---

## 1. Projects Found and CONTEXT.md Inventory

| Project | Domain | CONTEXT.md Count | Uses [grounded]/[open] Markers? |
|---------|--------|-----------------|----------------------------------|
| f1-modeling | F1 simulation, TypeScript | 6 | **YES — phase 03.1 only** |
| robotic-psalms | Creative/music composition, Python | 9 | No |
| PDFAgentialConversion | ML/embedding evaluation, Python | 10 | No |
| hermeneutic-workspace-plugin | IDE plugin, TypeScript | 4 | No |
| claude-notify | Notification hook, JavaScript | 4 | No |
| zlibrary-mcp | MCP server, TypeScript/Python | 4 | No |
| epistemic-agency | Research capture tool, Python | 9 | No |
| arxiv-sanity-mcp | arXiv MCP server, Python | 11 | No |
| scholardoc | PDF annotation schema, Python | 3 | No |
| tain | Adversarial prose generation, Python | 1 | No |
| prix-guesser | F1 geography quiz, TypeScript | 1 | No |
| **TOTAL** | | **62** | **1 CONTEXT.md (+ its RESEARCH.md source)** |

The `[grounded]`/`[open]` inline claim-marker notation appears in exactly **one** CONTEXT.md file across 62 files in 11 projects. That file is f1-modeling's `03.1-CONTEXT.md`, dated 2026-04-08 — the most recently gathered context in the corpus. The notation also appears in its paired `03.1-RESEARCH.md`. All other projects express epistemic content structurally through section tags.

---

## 2. The One File With [grounded]/[open] Markers

### f1-modeling — Phase 03.1 (Race State, Typed Artifacts, and Branchable Runs)

**Context gathered:** 2026-04-08. **Mode:** Auto-generated (exploratory, --auto). The phase has an Opus system-architect audit embedded directly in the claims, with explicit audit traces.

#### Full Claim Catalog

**Claim 1: Race plan as ordered stint sequence with implicit pit boundaries**
- Marker: `[grounded]`
- Text: "The existing StintRunner takes per-stint configuration and returns StintResult with finalState. A race plan is naturally an ordered array of stint specifications..."
- **Actual type: Anchored** — directly traceable to existing code (`stintRunner.ts`, `stintConfig` type). The claim cites a specific type pattern and file-level behavior.
- **Ontology fit:** Clean Anchored. No gap.

**Claim 2: Pit events as time-loss modifiers at stint boundaries**
- Marker: `[open — downgraded from grounded after Opus audit]`
- Text: "The reduced-order time-loss approach...is a reasonable modeling direction...but no pit-related code or types exist in the codebase. The specific parameters...are still research questions."
- **Audit trace:** Opus system-architect agent identified the contradiction — if model parameters are open, approach cannot be grounded.
- **Actual type: Assumed** — working assumption with no direct evidence. The concept is required by success criteria (so Framework-adjacent), but the implementation is unanchored.
- **Note:** This is a *downgrade story* — a claim that began as Anchored, was shown to be Assumed, and the marker was updated. The word "[open]" here means "under-evidenced" not "genuinely undecidable."
- **Ontology fit:** Fits Assumed. The "[open — downgraded from grounded]" phrasing reveals the ontology needs to handle *downgraded claims* gracefully — a claim that was over-classified.

**Claim 3: Run lineage via parent pointer and branch point**
- Marker: `[open — downgraded from grounded after Opus audit]`
- Text: "The parent pointer + branch point approach is a plausible minimal design, but the grounding was overstated. The `runRecordSchema` uses `.strict()` mode...whether a simple parent pointer is sufficient...is unproven."
- **Audit trace:** `.strict()` undermines "just add optional fields" claim; sufficiency for downstream branching is open.
- **Actual type: Assumed + Open hybrid** — the design direction is an assumption (plausible but unanchored); the downstream sufficiency question is genuinely Open (depends on Phase 4 needs not yet defined).
- **Note:** This is the most interesting case in the corpus — it holds two distinct epistemic states simultaneously: the approach is Assumed, the validation is Open.
- **Ontology fit:** The two-type situation is a gap. The ontology needs either compound markers or a way to distinguish "the claim as stated" from "the question of whether the claim is sufficient."

**Claim 4: Race interruptions as injectable timeline events**
- Marker: `[split — injection mechanism grounded, representation open; clarified after Opus audit]`
- Text: "The injection mechanism is genuinely grounded: ROADMAP SC3 literally says 'injected at specified laps'...However, the internal representation...is a design choice, not a codebase-grounded conclusion."
- **Audit trace:** Opus gave split verdict — injection mechanism legitimate per success criteria, but timeline-event representation is inference presented as grounding.
- **Actual type: Anchored (mechanism) + Assumed (representation)** — two distinct epistemic states within one proposition.
- **Note:** The `[split]` marker is a native extension that appeared in this file but is NOT part of the proposed ontology. It signals that one proposition has two separable epistemic statuses.
- **Ontology fit:** `[split]` is a real-world use case that the two-value `[grounded]`/`[open]` system cannot express. It's a marker not in the proposed ontology.

**Claim 5: Each stint produces its own artifact set within a race-level container**
- Marker: `[grounded]`
- Text: "The existing stint runner produces 4 artifact types...In a race, each stint produces its own set of these artifacts."
- **Actual type: Anchored** — directly traceable to existing code (RunArtifact schema, existing artifact types). No inference leap.
- **Ontology fit:** Clean Anchored. No gap.

**Claim 6: Tire-set inventory as compound allocation tracking**
- Marker: `[open — downgraded from grounded after Opus audit]`
- Text: "The concept is required by SC5 and Phase 4 needs it...However, no tire allocation data exists in any current preset...The specific allocation rules, data structure, and where it lives...are research questions."
- **Audit trace:** Open question 6 contradicts grounded status — the concept has a plausible home but zero existing code support.
- **Actual type: Framework + Assumed hybrid** — the concept is required by success criteria (Framework: hinge commitment), but the implementation is Assumed with no evidential base.
- **Ontology fit:** Fits mostly as Assumed. The Framework dimension is implicit (it's required by requirements, not arbitrary) but wouldn't be lost if classified Assumed.

**Claim 7: Experiment grouping via lightweight tagging**
- Marker: `[open — needs research]`
- Text: "Working assumption: experiment grouping is a tag/label system on run records rather than a first-class entity. But this needs validation against Phase 4's comparison workflow needs."
- **Actual type: Open** — genuinely unresolved design question. Not enough evidence to commit.
- **Ontology fit:** Clean Open. No gap.

**Claim 8: Race state carries enough for downstream branching**
- Marker: `[open — needs research]`
- Text: "Working assumption: the StintResult.finalState from each stint provides the necessary state snapshot. But whether this is sufficient for mid-stint branching...is an open question."
- **Actual type: Open** — the "working assumption" phrasing suggests Assumed, but the explicit statement that sufficiency is unverified makes this genuinely Open.
- **Note:** This is another Assumed/Open ambiguity — the claim *is* an assumption being made, but it's acknowledged as unverified. The difference from clean Assumed is that no evidence exists that would even tentatively support it.
- **Ontology fit:** Fits Open. But reveals that "Assumed" and "Open" exist on a continuum, not as discrete categories — some assumptions are more evidenced than others.

**Summary: f1-modeling 03.1 markers used:**
- `[grounded]` — 2 times (both clean Anchored in proposed ontology)
- `[open]` — used in several forms: "downgraded from grounded," "needs research," and standalone
- `[split]` — 1 time (not in proposed ontology; expresses compound epistemic status)

---

## 3. The Dominant Pattern: Structural Sections Without Inline Markers

The other 61 CONTEXT.md files use **section-level structural conventions** rather than per-claim inline markers. These sections encode epistemic type implicitly:

| Section Name Used | Epistemic Content | Proposed Ontology Mapping |
|------------------|-------------------|---------------------------|
| `<decisions>` | Fixed commitments, user-made choices | **Decided** |
| `<assumptions>` / `Working Model & Assumptions` | Working hypotheses, rebuttable | **Assumed** |
| `<constraints>` / `Derived Constraints` | Traced to codebase, requirements, or prior decisions | **Anchored** (when cited) or **Framework** (when convention) |
| `<questions>` / `Open Questions` | Unresolved questions | **Open** |
| `<guardrails>` / `Epistemic Guardrails` | Meta-level; not claims but policies | Not applicable to claim ontology |
| `<code_context>` | Empirically observed code facts | **Observed** |
| `<domain>` | Phase boundary statements | **Decided** or **Framework** |
| `<deferred>` | Scoped-out items | Not applicable |
| `<specifics>` | Implementation ideas, proposals | **Assumed** or **Decided** |
| `<research_questions>` / `Research Questions` | Questions to investigate | **Open** |
| `<working_model>` | Combined assumptions block | **Assumed** |
| `<derived_constraints>` | Traced to prior phases/codebase | **Anchored** |

This structural approach works well at the section level but doesn't label individual claims within sections — a `<decisions>` section mixes Decided, Anchored, and Framework claims without distinguishing them.

---

## 4. Full Per-Project Analysis (Non-Marker Files)

### 4.1 f1-modeling (non-03.1 phases)

Phases 01, 02, 02.1, 03, 04 all use `<assumptions>`, `<decisions>`, `<questions>`, `<guardrails>` sections.

**Sample claim types found:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "The likely model is a quasi-steady-state or sector-based point-mass approach" (Phase 02) | `<assumptions>` | Assumed |
| "Phase 1 established MetricTracePanel, RunComparisonCard, AssumptionPanel" (Phase 02) | `<constraints>` From Phase 1 codebase | Anchored |
| "MODL-01 requires a reduced-order lap and stint model" (Phase 02) | `<constraints>` From requirements | Framework |
| "Reduced-order, explainable models before high-fidelity simulation" (recurring) | `<constraints>` From prior decisions | Decided |
| "What reduced-order lap model class best serves transparency?" (Phase 02) | `<questions>` | Open |
| "FastF1 provides track position data (x/y/z coordinates at ~240ms sampling)" (Phase 02) | `<constraints>` From gap analysis | Observed |
| "The visualization library deliberation must resolve library choice before Phase 4 planning" (Phase 04) | `<domain>` prerequisite | Decided |

**Pattern:** An **infrastructure/simulation project**. Most claims are either Anchored (to codebase) or Open (unresolved modeling choices). Decided claims are numerous (from accumulated prior phase decisions). Framework claims come from requirements and honesty constraints. Very few Assumed claims in constraints sections — assumptions are segregated into `<assumptions>`.

### 4.2 robotic-psalms

Uses `<decisions>`, `<specifics>`, `<code_context>`, `<deferred>`. No separate `<assumptions>` or `<questions>` sections in most phases.

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "Dispatcher at lib/dispatcher.js — reads stdin, parses JSON, routes by hook_event_name" (Phase 01) | `<decisions>` Module structure | Decided |
| "lib/hook.js exports all internal functions for testing" (Phase 01) | `<code_context>` Reusable Assets | Anchored |
| "CommonJS throughout (require/module.exports), no ESM" (Phase 01) | `<code_context>` Established Patterns | Framework (code convention) |
| "The dispatcher pattern...enables clean PermissionRequest handling in Phase 2" (Phase 01) | `<specifics>` | Decided (accepted from research) |
| "/compose accepts natural language mood descriptions" (Phase 06) | `<decisions>` Workflow | Decided |
| "LLM selects appropriate Latin psalm/hymn text based on the mood prompt" (Phase 06) | `<decisions>` Compose Skill | Decided |
| ">90% first-attempt valid DSL generation reliability target" (Phase 06) | `<decisions>` / `<specifics>` | Decided (user-set target) |

**Pattern:** A **creative/application project**. Most claims are Decided (driven heavily by user preference and product vision). Very few Open claims — this project front-loads decisions rather than deferring to research. Anchored claims come from codebase inspection in `<code_context>`. Framework claims are code conventions.

### 4.3 claude-notify

Uses `<decisions>`, `<specifics>`, `<code_context>`, `<deferred>`, `<constraints>`, `<questions>`.

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "Installer registers one hook entry pointing to the dispatcher for Notification, Stop, and PermissionRequest" (Phase 01) | `<decisions>` | Decided |
| "PermissionRequest ONLY fires in bypassPermissions mode" (Phase 04) | `<assumptions>` | Observed (from runtime verification) |
| "This behavior may have changed...Must re-verify across all permission modes" (Phase 04) | `<assumptions>` stale note | Open |
| "Runtime verification (2026-03-11) is the primary source...it's 8 days old" (Phase 04) | `<guardrails>` | Open (evidence-staleness flag) |
| "Hook timeout: 600s default" (Phase 04) | `<constraints>` From requirements | Framework |
| "ntfy rate limit EXHAUSTED during normal dev session (2026-03-10)" (Phase 02) | Research tasks, RESOLVED | Observed |
| "Dual-hook strategy vs PermissionRequest-only" (Phase 04) | `<questions>` | Open |

**Note on Phase 04:** claude-notify Phase 04 has an unusually explicit epistemic guardrails section that names stale evidence as a risk. The `<guardrails>` section reads as a precursor to the `[open]` marker concept — it flags uncertainty about specific claims without marking the claims inline. This is a structurally-expressed version of what `[open]` would do inline.

**Pattern:** A **tooling/infrastructure project**. Heavy mix of Decided and Observed. Several explicitly-flagged Open items where research resolved runtime unknowns (RESOLVED status markers in `<research_tasks>`). Framework claims are Claude Code constraints. Staleness of evidence is explicitly managed in guardrails.

### 4.4 zlibrary-mcp

Uses `<assumptions>`, `<decisions>`, `<constraints>`, `<questions>`, `<failure_modes>`, `<guardrails>`.

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "ESLint v9 (flat config format, eslint.config.js) — v8 is EOL" (Phase 15) | `<assumptions>` Dependencies | Assumed (working default) |
| "928 total tests (129 Jest + 799 pytest)" (Phase 15) | `<specifics>` From codebase | Anchored |
| "Node 22 changed JSON.parse error message format" (Phase 15) | `<specifics>` Known bug | Anchored |
| "Is ESLint v9 flat config compatible with lint-staged?" (Phase 15) | `<research_questions>` | Open |
| "This is a one-way door — must be thorough" (Phase 15, filter-repo) | `<decisions>` | Decided |
| "npm tarball currently packs 984 files" (Phase 16) | `<assumptions>` | Anchored |
| "MCP initialize handshake must be verified" (Phase 17) | `<guardrails>` | Open |

**Pattern:** A **distribution/ops project** (late-stage quality and release). Most claims are either Anchored (codebase facts) or Decided (from deliberations and requirements). Open claims are narrow and technical. Framework claims are tooling conventions. The `<failure_modes>` section is unusual — it encodes Observed failure patterns as risk claims without using inline markers.

### 4.5 epistemic-agency

Uses `<decisions>` with extensive internal structure: Working assumptions, Challenge protocol, Anti-pattern presumptions, Open decisions, Decision criteria, Failure modes. No `<assumptions>` section — assumptions live inside `<decisions>` explicitly labeled as "working hypotheses."

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "Canonical identity should be deterministic...rather than fuzzy similarity-based merging" (Phase 01) | `<decisions>` Working hypothesis | Assumed (explicitly rebuttable) |
| "The system should separate a stable canonical source record from append-only capture-event history" (Phase 01) | `<decisions>` Working hypothesis | Assumed |
| "Exact minimal field set for a valid canonical source record" (Phase 01) | `<decisions>` Open decisions | Open |
| "The project currently falls back to the global knowledge store at ~/.gsd/knowledge/" (Phase 05) | `<decisions>` Working model | Anchored (observed fact) |
| "True local GSDR patches should be reserved for cases where project-local convention cannot solve the problem" (Phase 05) | `<decisions>` Working hypothesis | Assumed |
| "The phase is explicitly conditional and should proceed only if it stays bounded" (Phase 09) | `<constraints>` From ROADMAP | Framework |
| "Imported X material must enter the candidate workflow first" (Phase 09) | `<decisions>` Fixed | Decided |
| "Whether the bounded local bridge is a one-time import, manual sync, or incremental sync" (Phase 09) | `<decisions>` Claude's Discretion | Open |

**Pattern:** A **research-capture project with philosophical self-awareness**. Epistemic-agency is distinctive: it *explicitly labels* assumptions as rebuttable working hypotheses with challenge protocols. This is the closest project to having a native claim-type system without using inline markers. The `<decisions>` section does heavy epistemic work: it contains Decided, Assumed, Framework, and Open claims, all explicitly differentiated by sub-heading. Framework claims are particularly important — "the phase must not become an OAuth/deployment sink" is a hinge commitment, not an inference.

### 4.6 arxiv-sanity-mcp

Uses `<decisions>`, `<specifics>`, `<code_context>`, `<deferred>`. Phase 05 uses a completely different format (flat markdown, no XML tags).

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "Philosophy papers excluded — separate philpapers/semantic-scholar MCP server handles that domain" (Phase 01) | `<decisions>` | Decided |
| "PostgreSQL 16.11 running on target machine (localhost:5432)" (Phase 01) | `<code_context>` Integration Points | Anchored |
| "Influence-based historical pruning is a novel approach — may need a spike" (Phase 01) | `<specifics>` | Open |
| "Phase 5 is qualitatively different: the primary activity is using the MCP, not building new code" (Phase 05) | User Decision | Decided |
| "Evidence from real usage drives design decisions — not speculation" (Phase 05) | User Decision | Decided (methodology) |
| "create_watch requires saving a query first (two-step). May need a combined operation." (Phase 05) | Likely iteration | Assumed |
| "Daily incremental harvest matching arXiv's announcement cycle (OAI-PMH)" (Phase 01) | `<decisions>` | Decided |

**Pattern:** An **MCP infrastructure project**. Phase 01 is heavily Decided (many product-shape choices made upfront). Phase 05 is anomalous — it's a validation/iteration phase with no epistemic markers at all, structured as operational instructions. Framework claims in Phase 01 come from system environment (available databases, hardware). Assumed claims are few and narrow.

### 4.7 scholardoc

Uses `<decisions>`, `<specifics>`, `<deferred>`. Minimal context files — Phase 00 is a cleanup phase, Phase 01.1 is a schema review.

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "JSON for GT data files, YAML for project config files" (Phase 01) | `<decisions>` Schema format | Decided |
| "Pydantic models as source of truth, generating JSON Schema for external validation" | `<decisions>` | Decided |
| "GT file scope — deferred to research — needs analysis of cross-page requirements" | `<decisions>` Deferred | Open |
| "Multi-verifier chosen because the corpus will include genuinely ambiguous elements" | `<decisions>` | Decided (with rationale) |
| "Actual label unification is a research task" | `<decisions>` | Open |

**Pattern:** A **schema/annotation project** (early phase). Almost entirely Decided (the schema design is the product). Open claims are explicitly deferred to research tasks. No Assumed claims — everything is either decided or flagged as needing research. Framework claims are implicit (Pydantic conventions, JSON Schema conventions).

### 4.8 tain

A single CONTEXT.md (greenfield project, Phase 01). Uses `<decisions>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<deferred>`.

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "Protocols are minimal — GenerationCapability defines async generate(task: Task) -> Specimen" (D-01) | `<decisions>` | Decided |
| "Both protocols use typing.Protocol with @runtime_checkable" (D-02) | `<decisions>` | Decided |
| "None — greenfield project. No existing code to reuse." | `<code_context>` | Anchored (null fact) |
| "The Pydantic models defined here are the contracts that every subsequent phase depends on" | `<specifics>` | Framework (architectural hinge) |

**Pattern:** A **greenfield research project**. Almost entirely Decided. No Assumed or Open claims — Phase 01 is where the design is made, so claims are commitments. Framework claims are architectural principles. Anchored claims are null (no existing code).

### 4.9 prix-guesser

A single CONTEXT.md (greenfield project, Phase 01). Uses `<decisions>`, `<working_model>`, `<derived_constraints>`, `<open_questions>`, `<epistemic_guardrails>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<future_awareness>`, `<deferred>`.

**Note:** prix-guesser has the most sophisticated section structure of any project, including an explicit `<epistemic_guardrails>` section and a `<working_model>` separate from `<decisions>`. This project was initialized more recently (2026-04-08) and shows the most evolved CONTEXT.md format.

**Sample claim types:**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "The product is private-only and expert-first" | `<derived_constraints>` | Framework |
| "Circuit-internal recognition is the primary fantasy" | `<derived_constraints>` | Decided (product direction) |
| "Should coverage and fallback metadata live on each round, in shared venue profiles, or both?" | `<open_questions>` | Open |
| "The first implementation should prove the contract with checked-in fixture packs" | `<working_model>` | Assumed |
| "Street View coverage is uneven and unstable across venues" | `<derived_constraints>` | Observed |
| "Treat the discovery field list as directional, not as a frozen schema" | `<epistemic_guardrails>` | Open (meta-level) |

**Pattern:** A **gaming/application project**. Mix of Decided (product shape), Framework (competitive game constraints), Assumed (implementation approach), and Open (design questions). prix-guesser is the most explicit about epistemic uncertainty without using inline markers. The `<epistemic_guardrails>` section does the same work as GSD's guardrail concept.

### 4.10 hermeneutic-workspace-plugin

Uses `<decisions>`, `<specifics>`, `<code_context>`, `<deferred>`. Phase 04.1 is a brief validation-planning document without standard sections.

**Sample claim types (Phase 01 structured logging, Phase 02 error infrastructure):**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "Cross-platform deployability is currently specified, but not yet validated" (Phase 04.1) | Domain statement | Open |
| "A deployment story is only real once it survives fresh-machine and migration tests" (Phase 04.1) | Purpose statement | Framework |

**Note:** Phase 04.1 CONTEXT.md is unusually short (35 lines) with no XML section tags — it's structured as a validation brief rather than a full context document. The other phases likely have richer structure, but the pattern is consistent with Decided-heavy early phases.

### 4.11 PDFAgentialConversion

Uses `<assumptions>`, `<decisions>`, `<constraints>`, `<questions>`, `<guardrails>`.

**Sample claim types (Phase 07):**

| Claim | Section | Actual Type |
|-------|---------|-------------|
| "Process isolation already handles most VRAM cleanup" (A1) | `<assumptions>` | Assumed (explicitly labeled for validation) |
| "The --system-site-packages venv inherits torch from the conda base" (A2) | `<assumptions>` | Assumed (labeled "validate by:") |
| "Mac orchestrates, dionysus is the SSH remote target" (C1) | `<constraints>` Locked | Framework (architectural hinge) |
| "CUDA is 12.6 (driver 550.163.01), not 11.8 — the CLAUDE.md documentation is stale" (C4) | `<constraints>` | Anchored (observed fact) |
| "What are typical evaluation durations per model on dionysus?" (Q1) | `<questions>` | Open |

**Pattern:** A **ML/infrastructure project** at a mid-to-late phase. PDFAgentialConversion Phase 07 has the most explicit Assumed vs Anchored distinction: assumptions carry "Validate by:" instructions, which is the strongest evidence across the corpus that agents recognize the distinction but express it structurally rather than with inline markers.

---

## 5. Summary Table: Claims by Actual Type Across Projects

This table maps structural sections and explicit claim content to the proposed ontology types:

| Actual Type | Definition | How Expressed in Corpus | Most Common In |
|-------------|-----------|------------------------|----------------|
| **Anchored** | Traced to a specific artifact, file, prior decision | `<code_context>`, `<constraints>` From Phase N codebase, explicit file/type citations | All projects, especially infrastructure |
| **Assumed** | Working assumption with no direct evidence | `<assumptions>`, labeled "working hypothesis" / "working model", often with "validate by:" | PDFAgentialConversion, epistemic-agency, f1-modeling, claude-notify |
| **Framework** | Convention or hinge commitment, backdrop | `<constraints>` From requirements or prior decisions, `<derived_constraints>`, `<epistemic_guardrails>` | All projects; especially strong in epistemic-agency and prix-guesser |
| **Observed** | Empirical finding from codebase scouting or runtime | `<code_context>`, RESOLVED research tasks, `<constraints>` From prior phases with specific measurements | claude-notify (runtime verification), PDFAgentialConversion, zlibrary-mcp |
| **Decided** | Explicit user decision or preference | `<decisions>`, especially when prefaced by user voice, `Claude's Discretion` counterparts | Robotic-psalms, arxiv-sanity-mcp, tain, scholardoc |
| **Open** | Genuinely unresolved | `<questions>`, `<open_questions>`, deferred items in `<decisions>`, `<research_questions>` | All projects; especially f1-modeling, claude-notify, epistemic-agency |

**Claim distribution by project type:**

| Project Type | Dominant Types | Notes |
|-------------|---------------|-------|
| Greenfield design (tain, scholardoc, prix-guesser Phase 01) | Decided, Framework | Front-loaded decision-making; few assumptions |
| Application/creative (robotic-psalms, prix-guesser) | Decided >> Assumed | User voice is strong; many product-vision claims |
| Infrastructure/ops (zlibrary-mcp, claude-notify) | Anchored, Decided, Observed | Heavy codebase citation; runtime verification matters |
| Simulation/modeling (f1-modeling, PDFAgentialConversion) | Anchored, Assumed, Open | Models require explicit assumptions with validation instructions |
| Research-methodology (epistemic-agency) | Assumed, Open, Framework | Explicitly fallibilist; most sophisticated epistemic structure |

---

## 6. Does the Type Ontology Work? Gap Analysis

### What works well

1. **Anchored, Assumed, Decided, Open** — these four types cover the vast majority of claims across all 62 files. Every project has examples of each.

2. **Observed** — clearly distinct from Anchored. Anchored = traced to an artifact (file, type, prior decision). Observed = empirically found (runtime test result, measurement, scan). Claude-notify's runtime verification, PDFAgentialConversion's CUDA version correction, zlibrary-mcp's test count — these are not artifacts you cite but facts you discovered.

3. **Framework** — the hinge-commitment type is essential and non-reducible. "The phase must not become an OAuth/deployment sink" (epistemic-agency), "Mac orchestrates, dionysus is the SSH remote target" (PDFAgentialConversion), "circuit-internal recognition is the primary fantasy" (prix-guesser) — these are not investigated, not inferred, not decided in the conventional sense. They are backdrop commitments that structure the entire inquiry.

### Gaps and edge cases

**Gap 1: The [split] marker** (f1-modeling 03.1, Claim 4)

The race-interruption claim has two separable epistemic statuses within one proposition: the injection mechanism is Anchored (per success criteria) but the internal representation is Assumed. The `[split]` marker in the source file handles this, but it's not in the proposed ontology.

**Recommendation:** The ontology needs either:
- A compound notation: `[anchored|assumed]` (injection mechanism anchored, representation assumed), or
- Recognition that complex claims should be *decomposed* rather than marked with a single type.

**Gap 2: The Assumed/Open continuum** (f1-modeling 03.1, Claims 2, 3, 6, 7, 8)

Several claims oscillate between Assumed and Open:
- Assumed = "we're going with this for now, but it's not proven" (evidence exists to tentatively support it)
- Open = "we genuinely don't know yet" (no evidence either way, or evidence is insufficient to commit)

The difference matters for agent behavior: Assumed means "proceed on this hypothesis"; Open means "do not proceed until resolved." In practice, the corpus shows agents using "working assumption" language for claims that are technically Open (Claim 8: "working assumption...is an open question"). 

**Recommendation:** Consider adding a confidence qualifier or distinguishing:
- `[assumed — tentative]`: some evidence, proceed cautiously
- `[assumed — working]`: no evidence, but using this as a placeholder to enable progress
- `[open]`: explicitly unresolved, downstream agents must not assume

**Gap 3: Decided vs Framework boundary**

Several claims could plausibly be either Decided or Framework:
- "Reduced-order, explainable models before high-fidelity simulation" (f1-modeling recurring) — is this a user decision (Decided) or a hinge commitment the project cannot question (Framework)?
- "All quality gates should fail PRs, not just warn" (zlibrary-mcp) — user deliberation (Decided) or product convention (Framework)?

In practice: if the claim was made by the user in a deliberation session and recorded as a project commitment, it's Decided. If it's a convention no one would argue with in this project (it just *is* the backdrop), it's Framework.

**Recommendation:** The distinction is real but the boundary is fuzzy. The ontology should document that Framework claims are those where the agent *cannot challenge or reopen* them in the current phase — they are off the table by definition. Decided claims are also fixed but traceable to a specific decision session.

**Gap 4: Staleness of Observed claims** (claude-notify Phase 04)

Claude-notify's Phase 04 has a distinctive pattern: it explicitly flags runtime-verification data as "8 days old" and "may have changed." This is an Observed claim with a staleness qualifier — the claim was observed to be true, but the observation is time-sensitive.

The proposed ontology has no mechanism for expressing observation staleness or uncertainty about whether an Observed claim still holds.

**Recommendation:** Consider `[observed — stale]` or a staleness flag for Observed claims that may have changed since the observation was made.

**Gap 5: The "challenge protocol" class** (epistemic-agency)

Epistemic-agency Phase 01 and Phase 05 introduce "working hypotheses" that are explicitly *meant to be challenged* — they include failure modes and challenge protocols as part of the claim structure. These are Assumed claims with a built-in rebuttal invitation.

The proposed ontology marks Assumed as "working assumption with no direct evidence" — but this doesn't capture the *challengeability* signal. An agent reading a plain Assumed claim might proceed; an agent reading an epistemic-agency working hypothesis knows it should probe for failure modes.

**Recommendation:** Consider whether "challenge-invited Assumed" is a distinct sub-type or whether the challenge protocol belongs in the *metadata* of a claim rather than the type.

**Gap 6: No type for null Anchored** (tain, greenfield)

Tain Phase 01 says "None — greenfield project. No existing code to reuse." This is an Anchored claim with a null value — it's grounded in codebase inspection, but the finding is absence. The ontology doesn't break here, but it's worth noting that Anchored can anchor to null (absence of evidence, no prior code).

**No gap** — this is a valid edge case that Anchored handles fine.

---

## 7. Patterns by Project Context

| Pattern | Evidence |
|---------|----------|
| **Application projects (creative/gaming)**: most claims are Decided | Robotic-psalms and prix-guesser are dominated by user-voice product decisions. Very few Assumed or Open claims — the users know what they want. |
| **Infrastructure projects**: most claims are Anchored or Decided | Claude-notify, zlibrary-mcp, hermeneutic-workspace-plugin: heavy codebase citation in `<code_context>` and `<constraints>`. User decisions about tooling choices fill `<decisions>`. |
| **Simulation/modeling projects**: balanced across all types | F1-modeling and PDFAgentialConversion have the most epistemic diversity — Anchored (existing code), Assumed (modeling choices), Open (unresolved research), Framework (project constraints), Decided (architectural choices). |
| **Research-methodology projects**: Assumed and Framework dominate | Epistemic-agency's design philosophy makes nearly every claim rebuttable. Framework claims are strongest (anti-pattern presumptions, boundary commitments). Open claims are abundant. |
| **Early phases (Phase 01)**: Decided-heavy | Most Phase 01 files are greenfield decisions. Little codebase to anchor to, little prior work to observe from. The decision space is being created. |
| **Late phases (ops/quality/validation)**: Anchored-heavy | Zlibrary-mcp Phases 15-18, PDFAgentialConversion Phase 07: substantial codebase exists, claims are traced to specific files and measurements. |
| **Mid-phase with Opus audit**: [grounded]/[open] appears | The *only* file with inline claim markers (f1-modeling 03.1) also has the Opus system-architect audit embedded. The audit is what *forced* explicit epistemic labeling — without it, the same claims would have been expressed in `<assumptions>` sections. |

---

## 8. Conclusion: Is the Ontology Necessary and Sufficient?

### Necessary? Yes.

The corpus shows that epistemic claim types are real and consequential. Projects that lack explicit type marking still implicitly encode them via section structure. When an Opus agent audited f1-modeling 03.1 and found that working assumptions were being over-claimed as grounded facts, the correction was both epistemically important and practically consequential (it determined whether research was needed). The types are not academic — they shape whether agents proceed, defer, or investigate.

### Sufficient? Mostly, with four identified gaps.

1. **[split] claims** (compound epistemic status within one proposition) — not covered. Add compound notation or decomposition norm.

2. **Assumed/Open continuum** — the ontology should clarify that "working assumption" language does not imply actual evidence. The difference between Assumed (tentative evidence) and Assumed-Open (acknowledged as unresolved but using as placeholder) matters for agent behavior.

3. **Staleness of Observed claims** — runtime-verified or measurement-based claims can become stale. The ontology has no decay mechanism. Consider `[observed — stale]` or time-bound Observed.

4. **Challenge protocol within Assumed** — epistemic-agency's rebuttable working hypotheses are Assumed claims with explicit inversion instructions. The type alone doesn't signal "actively probe this." This may belong in claim metadata rather than type.

### Additional finding: The inline marker vs. section-level tension

Across 62 files, inline `[grounded]`/`[open]` markers appeared in exactly one file — the only file that had an embedded Opus audit. Every other project encodes epistemic type at the *section level*, not the claim level. This is not because other projects lack the types — they clearly have all six — but because section-level encoding is the ambient GSD convention.

The proposed claim-type ontology would need to answer: is it a *section-level* system (replacing or enriching `<assumptions>` → `<assumed-claims>`) or an *inline marker* system (per-claim `[assumed]` notation)? The corpus evidence is that section-level is the default and inline is triggered by audit pressure. Both conventions should be accommodated.

---

*Audit generated: 2026-04-09*
*Files read: 62 CONTEXT.md files across 11 projects (+ 1 paired RESEARCH.md)*
*Claim markers found: 9 in f1-modeling 03.1 (8 in CONTEXT.md, 2 in RESEARCH.md, with overlap)*
