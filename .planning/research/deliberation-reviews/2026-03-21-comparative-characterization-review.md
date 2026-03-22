# Review: Comparative Characterization and Non-Additive Evaluation Praxis

**Date:** 2026-03-21
**Artifact under review:** `comparative-characterization-and-nonadditive-evaluation-praxis.md`
**Review status:** Provisional
**Current caution:** This review is reading a project-specific methodological deliberation for both its local value and its framework implications. That may overstate how portable some of its proposals are beyond the `arxiv-sanity-mcp` evaluation program.

## 1. Scope and evidence reviewed

This review uses:

- The deliberation itself, especially:
  - source-project and intent framing at `comparative-characterization-and-nonadditive-evaluation-praxis.md:20-50`
  - situation and core question at `comparative-characterization-and-nonadditive-evaluation-praxis.md:52-100`
  - option analysis at `comparative-characterization-and-nonadditive-evaluation-praxis.md:102-151`
  - concrete operational proposal at `comparative-characterization-and-nonadditive-evaluation-praxis.md:176-365`
  - meta-reflection on workflow fit at `comparative-characterization-and-nonadditive-evaluation-praxis.md:391-455`
- The prior spike review and constellation work:
  - `2026-03-21-spike-epistemic-rigor-review.md`
  - `2026-03-21-deliberation-constellation-map.md`
- Directly relevant arxiv-sanity artifacts and signals:
  - `sig-2026-03-20-jaccard-screening-methodology.md`
  - `sig-2026-03-20-spike-experimental-design-rigor.md`
  - `sig-2026-03-20-premature-spike-decisions.md`
  - `sig-2026-03-19-spike-framework-scope-gap.md`
  - `2026-03-19-circular-evaluation-bias.md`
  - `2026-03-21-codex-design-review.md`
  - `docs/08-evaluation-and-experiments.md`
  - `docs/10-open-questions.md`

## 1A. Corpus grounding and interpretive criteria

This review is now also being read against the `epistemic-agency` corpus, but
only as **partial external grounding**.

That phrase matters. The corpus can support analogies for:

- finer claim units
- condition-local evaluation
- diagnostic characterization over winner-picking compression
- non-destructive supersession and lifecycle-aware archives

It does **not** yet validate the full claim-card proposal, nor does it settle
where those claims should live in GSD’s artifact system.

The papers below were chosen for direct methodological relevance, not because
they all strongly agree with the deliberation. Citation signal is used weakly:
[TRAIL](/home/rookslog/workspace/projects/epistemic-agency/corpus/paper-analyses/2505.08638.json)
has better maturity than the newer papers here, but fit and limitations remain
more important than citation count alone.

| Paper | Why it was included | Claim domain and support strength | Why it remains limited |
|-------|----------------------|-----------------------------------|------------------------|
| [AutoLibra](/home/rookslog/workspace/projects/epistemic-agency/corpus/paper-analyses/2505.02820.json) | Best support for moving from whole-run verdicts toward behavior-level evaluative units | `claim units / iterative metric refinement` — `medium-to-strong` support | LLM-as-judge circularity, small samples, and induced metrics are not the same as stable cross-spike claim cards |
| [Capable but Unreliable](/home/rookslog/workspace/projects/epistemic-agency/corpus/paper-analyses/2602.19008.json) | Best support for condition-local claims over global winner narratives; same model-task pair can alternate between success and failure | `condition-local evaluation / reliability vs capability` — `strong` support | Toolathlon-specific, canonical paths may be benchmark-artifact-sensitive, and proposed interventions remain only partly validated |
| [TRAIL](/home/rookslog/workspace/projects/epistemic-agency/corpus/paper-analyses/2505.08638.json) | Best support for benchmarking as characterization rather than leaderboard compression | `diagnostic benchmarking / trace taxonomies` — `strong` for taxonomy, `moderate` for archive transfer | Small trace set, hard benchmark, and no direct claim-archive design |
| [ARIA](/home/rookslog/workspace/projects/epistemic-agency/corpus/paper-analyses/2507.17131.json) | Closest analogue for retained-but-qualified knowledge via explicit validity statuses and supersession semantics | `archive / claim-lifecycle analogue` — `moderate` support | Proprietary production setting, weak reproducibility, and the managed objects are operational knowledge items, not research claims |
| [Beyond Task Completion](/home/rookslog/workspace/projects/epistemic-agency/corpus/paper-analyses/2603.03116.json) | Strong support for decomposing success into distinct integrity dimensions rather than collapsing everything into outcome-only success | `multi-dimensional evaluation / benchmarking vs characterization` — `medium-to-strong` support | Gating still collapses dimensions back toward a single disqualifying score; domain fit remains partial |

### What this corpus pass currently changes

The corpus gives the review stronger external support for a narrower claim:
winner-picking benchmarks are inadequate, while taxonomic and
multi-dimensional benchmarking can still be rigorous if they expose conditions,
failure signatures, and integrity dimensions rather than only final scores.

It also gives partial support for lifecycle-aware archives, but only by analogy.

### What this corpus pass does not justify

- It does not validate claim cards as a mature, portable best practice.
- It does not establish a settled archive design, status ontology, or GSD home
  for non-additive claims.
- It does not show direct transfer from tool-use or customer-service settings
  into `arxiv-sanity-mcp` comparative characterization without further
  translation.
- It does not remove the need for substantial human calibration and judgment.

## 2. What this deliberation adds that the current set did not yet provide

### A. It changes the level of specificity

The earlier spike deliberation was strongest on diagnosis:

- premature closure
- weak challenge structure
- false certification risk
- reflexivity and non-closure

This new deliberation is stronger on methodological construction.

It asks a more concrete question:

- what is the epistemic unit of knowledge in this evaluation program?

And it gives a concrete answer:

- not a spike-level winner verdict
- not a single benchmark score
- but condition-local, revisable claim units with explicit supersession and qualification semantics

That is a substantial addition. It turns a broad methodological critique into a proposed artifact and archive model.

### B. It reframes the benchmark dispute more cleanly

One of the best contributions here is the refusal of the false binary:

- benchmark rigor
- versus anti-benchmark looseness

The deliberation makes a stronger and more technically useful distinction:

- narrow winner-picking benchmark logic is not the same thing as rigor
- repeatable, condition-sensitive comparative characterization can be more rigorous than a conventional benchmark while also being less reductive

That is an important challenge to any reading of the earlier spike deliberation that might drift toward "the answer is just more openness and less benchmark structure."

### C. It supplies concrete artifact proposals the earlier spike deliberation lacked

The most important are:

- claim cards
- condition matrices
- two-layer execution: screening plus deep characterization
- explicit non-additive claim lifecycle
- constrained architecture-implication vocabulary

Those are not minor embellishments. They answer a question the earlier review left open:

- if the framework should support qualified, revisable inquiry, what should the artifacts actually look like?

This new deliberation gives the first serious answer.

### D. It improves governance clarity relative to the earlier spike deliberation

The explicit source-project context at `comparative-characterization-and-nonadditive-evaluation-praxis.md:22-35` is an improvement over the source-of-truth ambiguity in `spike-epistemic-rigor-and-framework-reflexivity.md`.

That matters because it makes a cleaner distinction between:

- the project-local methodological problem in `arxiv-sanity-mcp`
- the framework-level reflection opportunity in `get-shit-done-reflect`

So this artifact is not only more concrete methodologically. It is also better behaved as a cross-project reflection object.

### E. It gives the forms/excess deliberation more operational traction

The appended workflow-fit section is important. It does not just repeat "conversation mattered." It names specific kinds of residue:

- conversational turning points
- rejected framings
- dialogue as a constitutive mechanism
- claim genealogy
- meta-methodological yield

That makes the forms/excess concern more actionable. It suggests concrete trace classes rather than only a general concern about excess.

## 3. What it challenges or corrects in the current set

### A. It challenges the idea that the next spike redesign question is only about review loops

The earlier spike review leaned toward:

- better challenge loops
- qualified outcomes
- maybe a program/campaign concept later

This new deliberation suggests that may still be too abstract. It implies that spike redesign cannot be settled only at the reviewer/workflow level. It also requires deciding:

- what the output unit is
- how claims persist
- how later work qualifies earlier work
- how architecture implications are kept downstream of characterization

That is a real challenge to the previous framing. It suggests the next spike-methodology phase may need to co-design review loops and claim/archive structure together.

### B. It narrows the meaning of "non-additive"

The earlier set treated non-additivity mostly as:

- later critique can revise earlier findings
- not everything accumulates monotonically

This new deliberation sharpens that considerably. It says non-additivity should be made first-class through:

- stable claim identifiers
- explicit claim status transitions
- split, narrowed, qualified, and superseded claims

That is a stronger operational reading than the earlier set had.

### C. It partially challenges the community deliberation's timing, but not enough to reverse it

The appended meta-reflection again shows that dialogical inquiry is productive. That reinforces the community deliberation's point.

But it does not yet justify moving community pathway work earlier. If anything, it suggests the opposite:

- the framework should first learn how to preserve turning points, rejected framings, and claim genealogy internally
- only then is it ready to invite more of that kind of input from outside

So it sharpens the community question, but does not make it more urgent than the internal artifact and spike-methodology work.

### D. It gives the responsibility/praxis deliberation a more technical translation

The earlier orientation about excluded cases and scope becomes more concrete here through:

- condition-local claims
- explicit extrapolation confidence
- architecture implications separated from characterization
- calibration rather than authoritative human review

So this new deliberation does not displace the responsibility artifact. It gives it a better procedural landing zone.

## 4. What seems strongest in this deliberation

### A. The core reframing is strong

The shift from:

- "which model wins?"

to:

- "what comparative behavioral profile is warranted under which conditions?"

is one of the clearest and most useful methodological advances in the whole deliberation set.

It is also strongly supported by the signal field:

- `sig-2026-03-20-jaccard-screening-methodology.md`
- `2026-03-19-circular-evaluation-bias.md`
- `sig-2026-03-20-premature-spike-decisions.md`

All of those show that winner-picking logic over-compressed the epistemic object.

### B. Claim cards are a serious proposal, not just a metaphor

This is probably the most practically important addition in the artifact.

Why it seems promising:

- it creates a stable unit for later qualification or supersession
- it separates claims from whole-spike narrative drift
- it allows multiple claims from one spike to have different confidence and status
- it supports non-additive learning without forcing the whole archive into chaos

This is much more concrete than the original spike deliberation's generic call for qualified outcomes.

### C. The condition-matrix move is also strong

This proposal directly answers several earlier problems:

- hidden scope assumptions
- overly broad architectural inference
- narrow profile sampling
- drift between protocol rigor and qualitative richness

The matrix is not only about better experiment design. It is also about making the scope boundary visible enough that later revision has a stable target.

### D. The two-layer execution model is disciplined

The split between:

- broad repeatable screening
- targeted deep characterization

is one of the best parts of the artifact because it avoids two bad extremes:

- pretending thin metrics are enough
- making the whole program exhaustively qualitative and unrepeatable

## 5. Main gaps, underdeveloped areas, and risks

### A. It may still be too project-specific to lift directly into GSDR

This is the central portability caution.

Claim cards and condition matrices are compelling in `arxiv-sanity-mcp`, where the evaluation object is clearly multi-dimensional and later work already revises earlier claims.

But it is not yet established that all spike families need the same machinery. Some spikes may still be closer to:

- feasibility checks
- binary go/no-go investigations
- performance tradeoff tests

So the artifact may be best read as:

- a strong candidate pattern for characterization-heavy spike programs

not yet:

- the universal future of all spikes

### B. The archive model is not yet fully integrated with existing GSD artifact types

The deliberation asks the right question at `comparative-characterization-and-nonadditive-evaluation-praxis.md:367-379`: where do claim cards live and how do they relate to other artifacts?

That is still unresolved.

The missing integration questions are:

- Are claim cards part of a spike, or a cross-spike asset?
- Are they closer to findings, signals, ADR inputs, or a new artifact class?
- How do they interact with current KB and deliberation infrastructure?
- How is supersession surfaced without creating a second opaque archive?

Until that is answered, the proposal is promising but not yet framework-ready.

### C. It still risks replacing one over-authoritative form with another

This is where the earlier spike deliberation still matters.

Claim cards, condition matrices, and confidence partitions are powerful. They can also become a new authority theater if treated too rigidly:

- a claim card can still overstate
- a matrix can still hide the wrong dimensions
- a supersession status can still make inquiry look cleaner than it really was

So the earlier spike deliberation's warning about certification and domesticated critique still applies directly here.

### D. Human calibration is still thinly specified

The artifact is right to avoid pretending human review is gold truth. But the current specification is still light:

- one human reviewer may be enough for now
- only some cells require calibration

That is sensible, but it remains operationally thin. The artifact does not yet specify enough to know whether calibration would be:

- consistent
- affordable
- actually decision-relevant

### E. It may alter the sequencing of future framework work

This is not exactly a weakness, but it is a real challenge to the current roadmap reading.

The earlier constellation placed:

1. deliberation contract
2. trace/overflow
3. spike challenge and qualified outcomes
4. then maybe campaign/program concepts

This new deliberation suggests that step 3 may be too coarse. Within the spike redesign track, we may need:

- claim/unit-of-knowledge design
- qualified outcome design
- challenge-loop design

and they may need to be co-designed rather than done one after another.

## 6. How this changes the current constellation reading

### A. The earlier spike deliberation remains the stronger framework diagnosis

It is still better on:

- naming the pathology
- distinguishing causal hypotheses
- warning against false certification
- keeping open the relation between critique and apparatus

### B. This new deliberation is stronger on methodological concretization

It is better on:

- defining the epistemic object
- proposing concrete artifact shapes
- specifying how non-additive learning could be recorded
- separating characterization from architecture pressure

### C. Together they form a better pair than either alone

The earlier spike deliberation without this one risks staying too diagnostic.

This one without the earlier spike deliberation risks becoming an attractive but overly self-confident design program.

Their productive relation seems to be:

- spike epistemic-rigor: "why the current inquiry form fails and what kinds of safeguards are needed"
- comparative characterization: "what the redesigned inquiry object and artifact model might actually look like"

That is a real improvement in the constellation.

## 7. Roadmap implications and dependency map

### Current v1.18

My current reading is still:

- do not add this as a new current-milestone implementation phase in `get-shit-done-reflect`

Reasons:

- it is still largely an `arxiv-sanity-mcp` methodological artifact
- current v1.18 is occupied by migration/authority/update concerns
- the framework-level implications are real, but they still need one more translation step before they become a bounded GSD phase

### Next milestone impact

This does change the next-milestone spike picture.

The earlier recommended spike work should now probably be understood as two subproblems, not one:

1. Spike review and challenge loops
2. Claim-level, non-additive knowledge and supersession support

Those may need to be designed together.

### Revised dependency sketch

My current best reading is:

1. Deliberation artifact contract and discovery
2. Trace/overflow and process-turn tracking
3. Spike-methodology redesign, split into:
   - spike type differentiation
   - challenge/review loop
   - claim cards / claim genealogy / supersession support
4. Only then consider whether a full campaign/program layer is needed
5. Community pathways later

That is a subtle but real change from the earlier review set.

## 8. What this deliberation is still missing

The most useful next revision would add:

- a clearer statement about what is intended as project-specific versus framework-portable
- a more explicit relation between claim cards and current GSD artifact taxonomy
- one or two low-cost pilot versions of the proposal, so the design can be tested without full adoption
- a clearer description of failure modes for claim cards and condition matrices

## 9. Current provisional judgment

This is a valuable addition to the deliberation set.

It does not replace the original spike deliberation. It sharpens and partially corrects it.

The short version is:

- the original spike deliberation is still the better framework diagnosis
- this new deliberation is the better concrete proposal for what a characterization-heavy spike program should look like
- taken together, they suggest that future spike redesign work needs to address both review structure and claim/archive structure, not only one or the other
