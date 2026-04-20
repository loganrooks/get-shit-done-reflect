---
date: 2026-04-20
audit_subject: requirements_review
audit_orientation: investigatory
audit_delegation: cross_model:claude-opus-4-7
auditor_model: claude-opus-4-7
scope: "Phase 59 (KB Query, Lifecycle Wiring & Surfacing): architectural gaps, missed capabilities, relation-model weaknesses, and stronger designs that still fit the phase or should become explicit downstream requirements"
ground_rules: core+investigatory+requirements_review+dispatch+framework-invisibility
inputs_read:
  - .planning/ROADMAP.md (Phase 59 entry and dependency context)
  - .planning/REQUIREMENTS.md (KB-01..KB-11, PROV-05, SPIKE-07 rows)
  - agents/knowledge-store.md (v2.1.0 canonical spec)
  - .planning/research/kb-architecture-research.md (v1.20 architecture research)
  - .planning/research/PITFALLS.md (C1–C6, M1–M7, N1–N5)
  - get-shit-done/bin/lib/kb.cjs (current SQLite implementation, 813 LOC)
  - get-shit-done/bin/reconcile-signal-lifecycle.sh (2026-03-04 deliberation output)
  - get-shit-done/references/knowledge-surfacing.md (agent query protocol)
  - .planning/deliberations/signal-lifecycle-closed-loop-gap.md
  - .planning/deliberations/reflection-output-ontology.md
  - .planning/knowledge/kb.db (live SQLite: 267 signals, 292 edges)
---

# Phase 59 KB Architecture Gap Audit

## 0. Classification Preamble

**Subject × orientation × delegation:** `requirements_review` × `investigatory` × `cross_model:claude-opus-4-7`.

**Fit re-assessment (after reading).** `requirements_review` stayed appropriate — the primary object under scrutiny is the declarative Phase 59 surface and what that surface admits. `Investigatory` also held: the user's "one-way relation / immutable node" worry is a concrete architectural discrepancy, not a diffuse exploration. But the investigation repeatedly pulled toward artifact-analysis territory (live KB state revealed data-integrity issues) and process-review territory (lifecycle automation exists but rarely fires). Per composition principle, I let the investigation follow the evidence into those territories when the requirements text alone could not ground a finding, and I flag each crossing explicitly.

**Cross-model dispatch hygiene.** The task spec did not mention the Claude-authored corpus, did not supply competing proposals, did not set target counts, and did not pre-commit to a verdict ("keep", "expand", "split"). The only priming was the user's articulated unease and a checklist of sections the output must contain. That checklist is procedural (one-way-relation treatment, feedback workflows, relation semantics, recommendation form). I note it as a confound only because the "treat the one-way relation problem" instruction arguably primes the finding it requests — I have tried to compensate by naming counter-explanations where the one-way framing is not load-bearing (see Finding 2, competing-explanation C).

## 1. Situation

### 1.1 What Phase 59 is (ground truth)

From `.planning/ROADMAP.md:317-327`:

> "### Phase 59: KB Query, Lifecycle Wiring & Surfacing
> **Goal**: The knowledge base is fully queryable, signal lifecycle transitions are automated, and research/planning agents use structured queries instead of grep
> **Depends on**: Phase 56 (SQLite index must exist)
> **Requirements**: KB-04b, KB-04c, KB-06a, KB-06b, KB-07, KB-08
> **Success Criteria** (what must be TRUE):
>   1. `gsd-tools kb search` performs FTS5 full-text search across signal content, and `gsd-tools kb query` filters by lifecycle state and other structured fields
>   2. `gsd-tools kb link` traverses qualified_by/superseded_by relationships between signals and spikes
>   3. `gsd-tools kb transition` updates both the .md frontmatter AND the SQLite row atomically (dual-write invariant per KB-05)
>   4. When a plan with `resolves_signals` completes, collect-signals auto-transitions matching signals to remediated state
>   5. Research and planning agents use SQLite queries for KB retrieval, with graceful fallback to grep when kb.db does not exist"

Six requirements back this phase (`.planning/REQUIREMENTS.md:51-73`):

> "- [ ] **KB-04b**: FTS5 full-text search across signal content and lifecycle state queries via `gsd-tools kb query/search`
> - [ ] **KB-04c**: Relationship traversal for qualified_by/superseded_by links via `gsd-tools kb link`
> - [ ] **KB-06a**: `gsd-tools kb` read operations: query, search, stats, health, rebuild
> - [ ] **KB-06b**: `gsd-tools kb` write operations: transition, link -- with dual-write invariant enforced per KB-05
> - [ ] **KB-07**: Signal lifecycle wiring completes the v1.16 `resolves_signals` feature -- collect-signals reads resolves_signals from completed plan frontmatter and auto-transitions matching signals to remediated
> - [ ] **KB-08**: KB surfacing in research/planning agents uses SQLite queries instead of grep-through-index for relevant signal/spike/lesson retrieval. Graceful fallback to grep when kb.db does not exist (fresh clone, first run)"

### 1.2 What was expected (discrepancy frame per I1)

The expectation embedded in the user's unease — and in the KB research document at `.planning/research/kb-architecture-research.md:148-156` — was that Option A (file + SQLite index) would deliver a *relational* query capability that a graph database would otherwise provide, "without the operational burden." The research document's own words: "SQLite FTS5 + explicit `signal_links` table provides the relational query capability that graph databases would offer, without the operational burden." That is a specific promise: the `signal_links` table is supposed to carry the graph semantics.

The user's concern is that Phase 59 as currently drafted settles for much less. Older signals remain immutable nodes; new signals assert edges *from* themselves to older signals via frontmatter fields (`qualified_by`, `superseded_by`, `recurrence_of`, `related_signals`); the `signal_links` table derives these edges from the source-frontmatter side only; the target node has no awareness that something now qualifies or supersedes it, and no CLI surface is committed to exposing the reverse direction.

### 1.3 What was delivered / is currently live (ground truth from kb.db, 2026-04-20)

The corpus has grown past the numbers cited in Phase 59 planning material:

| Metric | Phase 59 planning assumption | Live value (2026-04-20 kb.db) |
|---|---|---|
| Signal count (for rebuild/migration promises) | "198-signal corpus" (KB-09, KB-10) | **267 signals** |
| Lifecycle distribution | "0 remediated, 0 verified" (2026-03-04 deliberation) | detected: 244, triaged: 8, **remediated: 15**, verified: 0 |
| `signal_links` edge count | Undeclared | **292 edges** |
| `qualified_by` edges | Promised by KB-03 (complete) + traversed by Phase 59 SC#2 | **0** |
| `superseded_by` edges | Promised by KB-03 (complete) + traversed by Phase 59 SC#2 | **0** |
| `related_to` edges | Not required | 183 |
| `recurrence_of` edges | Not required | 109 |
| Edges whose target resolves to a signal | — | 180 / 292 (62 %) |
| Edges whose target resolves to a spike | — | 0 / 292 |
| Edges whose target is the literal string `[object Object]` | — | **107 / 292 (37 %)** |
| Edges whose target is neither signal nor spike nor `[object Object]` | — | 5 (legitimate-looking signal IDs that no longer exist) |

(Queries: `SELECT link_type, COUNT(*) FROM signal_links GROUP BY link_type;`, integrity join against `signals`/`spikes`, both against `.planning/knowledge/kb.db`.)

These numbers are load-bearing for almost every finding that follows, so I record them here before drawing inferences. They were obtained by direct `sqlite3` queries against the committed-but-gitignored live database on 2026-04-20.

### 1.4 Corpus drift

Between `.planning/research/kb-architecture-research.md` (2026-04-08) and today (2026-04-20), the signal corpus grew from 199 to 267 (a 34 % increase in twelve days). KB-09 and KB-10 are marked complete *against the 198-count*; whether they still hold for the 267 corpus is not asserted anywhere. Disconfirmation check (Rule 2): I tried to find a phase or signal that re-verified migration success against the current corpus. The only evidence was a `kb rebuild` that succeeded when I spot-ran it (signal_count metadata updated). Migration semantics have not been re-exercised; latent failure is plausible but unobserved.

## 2. Findings

Each finding follows I3 (present competing explanations), includes a disconfirmation check (Rule 2, core), and a measurement-vs-measured note (Rule 3, core) where applicable. Findings are grouped by theme rather than numbered linearly, so the report stays navigable.

### Theme A: Edge model is under-specified and under-evidenced

#### Finding A1 — The `signal_links` table is already carrying 107 malformed edges, and Phase 59 promises to traverse it without any integrity contract

**Evidence.** `SELECT source_id, link_type, target_id FROM signal_links WHERE target_id = '[object Object]'` returns 107 rows, all `link_type='recurrence_of'`. Sampling confirms the source files carry `recurrence_of:` as a bare YAML key (e.g. `.planning/knowledge/signals/get-shit-done-reflect/2026-02-28-cross-plan-test-count-not-updated.md:` line `recurrence_of:` with no value). The frontmatter parser converts bare-empty YAML keys into an empty-object sentinel; `extractLinks()` in `get-shit-done/bin/lib/kb.cjs:428-430` then guards the push only on truthiness plus `String(fm.recurrence_of).trim()`:

```js
if (fm.recurrence_of && String(fm.recurrence_of).trim()) {
  links.push({ source_id: signalId, target_id: String(fm.recurrence_of).trim(), link_type: 'recurrence_of' });
}
```

`String({}).trim()` returns the literal `"[object Object]"` — truthy, non-empty, and stored as target. A second, smaller pool of edges (5) point at signal IDs that no longer exist in the corpus (e.g. `2026-02-17-resume-work-misses-non-phase-handoffs` — a slug that resembles the file naming convention but is not present in `signals(id)`).

**Inference.** Phase 59 Success Criterion 2 — "`gsd-tools kb link` traverses qualified_by/superseded_by relationships between signals and spikes" — is silent on what happens when the `signal_links` table contains edges that cannot be resolved. Traversal across garbage edges is undefined behavior today; any agent that later consumes `kb link` output will encounter records like `target_id=[object Object]`. The integrity check is implicit in the schema (FOREIGN KEY on `source_id`) but absent on `target_id`. The research document's own Pitfall M2 (`.planning/research/PITFALLS.md:127-135`) flagged the migration risk but did not anticipate this *parsing* failure mode — the risk was framed as "old signals without new fields," not "new fields whose YAML shape is inconsistent."

**Competing explanations.**
- (C1a) *Bug in `extractLinks`, not an architectural problem.* A one-line guard (`typeof fm.recurrence_of === 'string'` before `String(...).trim()`) would fix 107 rows. Phase 59 could simply assert data cleanliness as a prerequisite.
- (C1b) *YAML frontmatter parser too permissive.* The underlying parser treats bare `key:` as an empty object rather than null. Fixing the parser is upstream of Phase 59; KB-06b (dual-write) should not be layered over a schema that silently coerces null to `{}`.
- (C1c) *Architectural signal.* The fact that 107 malformed edges accumulated undetected is evidence that the system has *no edge quality check*. This reflects a deeper architectural gap — edges are created but never validated, and never re-examined — that Phase 59 does not address even if the specific bug is fixed.

**Disconfirmation attempt.** I searched for any CI check, test, or workflow that would catch edges with non-signal targets. `get-shit-done/bin/gsd-tools.test.js` has no assertion on `signal_links` integrity. `kb stats` groups by severity, lifecycle, polarity, project, signal_category, detection_method, provenance_schema, and provenance_status (`get-shit-done/bin/lib/kb.cjs:655-662`) but **does not count edges or group by link_type**. There is no CLI surface today from which an operator would notice 107 corrupted edges. I did not find counter-evidence.

**Measurement vs measured.** What I measured: target-string literal equality to `"[object Object]"`. What that measure captures: edges where the source-side frontmatter parser returned a non-string truthy value. What it does *not* capture: edges whose target is a well-formed but *wrong* signal ID (e.g. renamed signals, typos), or edges whose link_type is *semantically* wrong (e.g. `related_to` where `superseded_by` was intended).

#### Finding A2 — `signal_links` cannot express a heterogeneous graph

**Evidence.** Schema at `get-shit-done/bin/lib/kb.cjs:98-103`:

```sql
CREATE TABLE IF NOT EXISTS signal_links (
  source_id TEXT NOT NULL REFERENCES signals(id),
  target_id TEXT NOT NULL,
  link_type TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id, link_type)
);
```

`source_id` is constrained to `signals(id)`. `target_id` carries no type column and no foreign key. Spike files exist in the `spikes` table but there is no `spike_links` (zero references across `kb.cjs`). KB-03 (complete) states that qualification links support "cross-signal and cross-spike references" (`.planning/REQUIREMENTS.md:49-50`), and `agents/knowledge-store.md:158` asserts "`qualified_by` … Array of signal or spike IDs that qualify this signal's interpretation." The schema permits such edges only from the signal side; there is no reciprocal mechanism for a spike to declare that it qualifies or supersedes a signal, and no `spike_links` table to hold the inverse.

Phase 61 (Spike Methodology Overhaul, `.planning/ROADMAP.md:367`) SC#4 says "Cross-spike qualification mechanism appends qualification notes when spike N qualifies or invalidates spike M, with KB qualified_by links." SPIKE-07 in REQUIREMENTS.md:242 commits to "qualified_by link" on the spike entry. Phase 59 as written does not specify a spike-side edge table, and Phase 61 Success Criterion #4 would require extending what Phase 59 leaves implicit.

**Inference.** The declarative phase boundary is unclear. Either Phase 59 must materialize a polymorphic edge model that Phase 61 can ride on, or Phase 61 must extend the schema, or both phases silently over-specify and a late requirement triage becomes necessary. The current framing of KB-04c ("qualified_by/superseded_by links via `gsd-tools kb link`") is ambiguous about whether those edges span types.

**Competing explanations.**
- (C2a) *Intentional simplification.* The research document chose signals as the primary entity; spike-side edges may be deferred without semantic loss.
- (C2b) *Latent incompleteness.* Phase 61's SPIKE-07 assumes Phase 59 built the edge machinery. If Phase 59 ships signal-only edges, SPIKE-07 either blocks or prompts a schema revision mid-phase.
- (C2c) *Node-type erasure.* The architectural move that collapses "signal or spike" into a single `target_id TEXT` field is exactly the one that makes heterogeneity hard. A minimally richer schema (`target_kind TEXT CHECK (target_kind IN ('signal','spike','lesson','deliberation','audit','reflection','phase','plan'))`) would keep polymorphism honest at the cost of one migration.

**Disconfirmation attempt.** I looked for a spike that points at signals via `qualified_by` or for any `signal_links` row where `target_id` resolves to a spike. Zero rows matched. This matches the claim: the cross-type edges are rhetorically promised by KB-03 but structurally absent.

**Measurement vs measured.** I counted `target_id IN spikes.id`, which is a structural test. It does not capture whether the absence reflects "model permits it but corpus hasn't exercised it" vs "model prohibits it." For the former, Phase 59 should ship a test; for the latter, a schema migration is required.

#### Finding A3 — Zero qualified_by and superseded_by edges exist despite KB-03 being marked complete

**Evidence.** `SELECT COUNT(*) FROM signal_links WHERE link_type='qualified_by';` returns 0. Same for `superseded_by`. KB-03 is checked complete (`.planning/REQUIREMENTS.md:49`). The schema supports both types (`get-shit-done/bin/lib/kb.cjs:405-417`).

**Inference.** Schema presence without edge presence is consistent with either: (a) no agent has yet had the affordance to write such edges because no CLI exists (the `kb link` write command is still Phase 59, KB-06b), or (b) the schema is there but the semantic conditions for creating these edges have never been met in 267 signals. Both readings are plausible. Phase 59's SC#2 ("`gsd-tools kb link` traverses…") presumes there will be edges to traverse. The phase does not specify how edges will *arrive*.

If reading (a), Phase 59 is actually two phases — (i) a write path for creating edges, and (ii) a traverse path for reading them. The requirement text conflates them into one `kb link` verb without specifying which verbs are in scope.

**Competing explanations.**
- (C3a) *Feature not yet used.* Agents have not had reason to assert qualification.
- (C3b) *Affordance gap.* No workflow step (reflect, collect-signals, synthesizer) currently outputs `qualified_by`/`superseded_by` into a signal's frontmatter; the fields stay empty by default.
- (C3c) *Ontology mismatch.* Qualification links require judgment that current sensors and the reflector do not perform. This would mean Phase 59 shipping traversal without a producer side produces a dead feature.

**Disconfirmation attempt.** I searched for *any* file that writes `qualified_by` or `superseded_by` into a signal file. `rg "qualified_by" agents/ get-shit-done/` returns spec references only; no workflow step writes it. The reflector instructions mention "qualification" in the signal schema sense but don't commit to producing edges. The executor's `update_resolved_signals` path (`.claude/commands/execute-plan.md`) touches `lifecycle_state` and remediation fields, not `superseded_by`. This corroborates reading (b)+(c): affordance gap and ontology gap.

**Measurement vs measured.** I measured edge presence in the live DB. I did not measure whether the judgment "X supersedes Y" would ever arise in workflow semantics independent of being explicitly asked.

#### Finding A4 — The one-way relation problem, stated precisely

This is the finding the user asked to surface. I state it in schema-level terms first, then in workflow terms, then in knowledge-modeling terms.

**Schema-level.** The edge record `(source_id, target_id, link_type)` is stored in SQLite and is bidirectionally queryable *in SQL*. `SELECT source_id FROM signal_links WHERE target_id = ? AND link_type = 'superseded_by'` is a lookup that would surface "what things supersede this signal." But the edge is also *mirrored* in a per-signal frontmatter field on the source side (`qualified_by: [...]`, `superseded_by: "..."`, `recurrence_of: "..."`). It is **not** mirrored on the target side. When you read the target signal file — or the target signal's row in SQLite — neither carries any indication that an edge points *into* it. The source of truth (the `.md` file) is structurally source-centric, and the SQLite derivation inherits that asymmetry for everything except raw SQL queries that no agent currently runs.

**Workflow-level.** The surfacing protocol at `get-shit-done/references/knowledge-surfacing.md:35-45` instructs agents to "read the KB index" (which only lists the node, not edges) and then "read full entry files" (which carry only outbound edges). Agents never see inbound edges when they surface an older signal. If a newer signal supersedes an older one, an agent reading the older signal to inform a plan gets the old interpretation with no banner, no note, no "this interpretation was revised." The frozen immutability of the signal's detection payload (`agents/knowledge-store.md:555-567`) makes this a principled immutability, not an oversight — but there is no structural mechanism to carry inbound context alongside the frozen payload.

**Knowledge-modeling-level.** The deeper issue is that edges are modeled as **properties of nodes** rather than **first-class entities**. A signal's `superseded_by` field is a claim — "this signal is superseded by that signal" — but the claim itself has no author, no date, no rationale, no confidence, no provenance. If two agents disagree about whether X supersedes Y (say, one sees it as qualification, another as supersession), the last write wins and the disagreement vanishes. If the claim turns out to be wrong, there is no audit trail to revisit the judgment. And because the claim lives on the source side, the target side cannot hold the disagreement even if it wanted to.

Three separate problems travel together here: (i) target-blindness at the file layer, (ii) absence of edge provenance, (iii) collapse of disagreement. All three are consequences of modeling edges as node properties.

**Competing explanations of the problem's significance.**
- (C4a) *Overstated concern.* At 267 signals and 292 edges the corpus is still small; the reverse-lookup cost is negligible, so the absence of inbound visibility is manageable by surfacing-layer tooling alone (Option 6 below).
- (C4b) *Scale threat.* As the corpus grows, reverse-lookups via SQL are cheap but only if agents *know to run them*. The affordance gap between "can be queried" and "is queried" is likely to widen, not close, because surfacing instructions are advisory text and Pitfall C2 (`.planning/research/PITFALLS.md:31-43`) has already demonstrated that advisory text fails silently.
- (C4c) *Ontological concern, not a scale concern.* Even at tiny scale, the collapse of disagreement and the absence of edge provenance are epistemic defects. A KB that cannot represent "two readers disagree about whether this supersedes that, here's the argument" has no room for the deliberative practice the project is building elsewhere (see `.planning/deliberations/claim-type-ontology.md`, which treats claims — not nodes — as the basic unit).

I find (C4c) most consistent with the broader project direction (the deliberation skill, the audit taxonomy, the claim-type ontology). Phase 59 as framed cannot host this concern; it is operating one ontological layer below.

**Disconfirmation attempt.** I looked for any existing treatment of edges-as-claims in the corpus. The closest is `.planning/deliberations/claim-type-ontology.md` (which treats deliberation claims, not KB edges), and `agents/knowledge-store.md §4.6 Verification by Absence` (which is about passive state transitions on nodes, not edges). No prior treatment of edge provenance exists.

**Measurement vs measured.** I measured the *absence* of target-side writeback, edge provenance, and surfacing of inbound edges. What I measured does not capture: whether agents, in practice, produce better decisions when inbound context is missing (this is unmeasured; the F21 dual-memory literature suggests they do not, but the finding is indirect).

### Theme B: Lifecycle wiring is half-implemented and orthogonal to Phase 59's surface

#### Finding B1 — The lifecycle-closed-loop deliberation already shipped a bash fallback; Phase 59 does not acknowledge it

**Evidence.** `.planning/deliberations/signal-lifecycle-closed-loop-gap.md:162-185` concluded Options A + C + B in sequence (2026-03-04). Option A produced `get-shit-done/bin/reconcile-signal-lifecycle.sh` — a bash script that extracts `resolves_signals` from PLAN.md files and rewrites signal lifecycle via `gsd-tools frontmatter`. Option B (KB health watchdog) appears as a pending quick task. Phase 59 KB-07 says (`.planning/REQUIREMENTS.md:68-70`):

> "**KB-07**: Signal lifecycle wiring completes the v1.16 `resolves_signals` feature -- collect-signals reads resolves_signals from completed plan frontmatter and auto-transitions matching signals to remediated
>   - *Motivation:* `research: PITFALLS.md C2 -- resolves_signals has existed since Phase 34 and has never been read by anything`"

The ROADMAP Success Criterion #4 ("When a plan with `resolves_signals` completes, collect-signals auto-transitions matching signals to remediated state") reads as if the problem is newly to be solved. But the 2026-03-04 deliberation's Option A is already shipped: `reconcile-signal-lifecycle.sh` exists, and the live DB shows **15 remediated signals** (vs the deliberation's "0 remediated" baseline). Whether those 15 came from the shell script or from later synthesizer runs is unrecorded, but the wiring is partially present and fires *outside* `collect-signals`.

**Inference.** Phase 59's KB-07 framing treats lifecycle wiring as if it is greenfield. Two costs follow:
1. The bash fallback (`reconcile-signal-lifecycle.sh`) and the proposed Phase 59 `kb transition` command will coexist in the same install, plausibly producing two code paths for the same transition — one via bash+gsd-tools frontmatter, one via node:sqlite dual-write. Divergence between them is the textbook failure Pitfall C1 warns against.
2. The deliberation explicitly names the root cause: "Lifecycle transitions are implemented as **agent instructions in workflow specs**, not as programmatic automation … Critical state transitions should not depend on the most unreliable component in the system (agent instruction following)" (`.planning/deliberations/signal-lifecycle-closed-loop-gap.md:100-109`). Phase 59 KB-07's "collect-signals reads resolves_signals … and auto-transitions" is *again* an agent-instruction path in the `collect-signals` workflow. The same failure mode the deliberation diagnosed is re-authorized by Phase 59's framing.

**Competing explanations.**
- (B1a) *Phase 59 intends to replace the bash fallback.* If so, it should say so, and retire `reconcile-signal-lifecycle.sh` as a deprecated path with a migration plan.
- (B1b) *The bash fallback is a stopgap that Phase 59 will supersede.* Same logical outcome — plus a one-line explicit deprecation.
- (B1c) *The two paths are complementary.* Bash for phase boundaries, node:sqlite for other triggers. This requires explicit scope separation in Phase 59.
- (B1d) *Agent-instruction vs programmatic gap is unrecognized.* This would mean Phase 59 repeats the Option A failure at one step removed (collect-signals is a workflow document of ~N steps; step K might be skipped under context pressure, same as execute-phase step 12-of-15 that motivated the 2026-03-04 deliberation).

**Disconfirmation attempt.** I looked for any reference in Phase 59 material to the 2026-03-04 deliberation or to `reconcile-signal-lifecycle.sh`. I grepped `.planning/research/kb-architecture-research.md`, the ROADMAP Phase 59 entry, and the KB-07 motivation. None cite the deliberation. This reinforces the finding: the two bodies of work are parallel but mutually unaware.

**Measurement vs measured.** "15 remediated signals" is a count, not a provenance attribution. I did not measure which reconciliation path produced each transition; some may be hand-edited. If all 15 came via `reconcile-signal-lifecycle.sh`, the bash fallback is load-bearing today.

#### Finding B2 — The lifecycle state enum is descriptively rich but workflow-poorly-exercised

**Evidence.** The spec at `agents/knowledge-store.md:188-246` defines six states (`detected`, `triaged`, `blocked`, `remediated`, `verified`, `invalidated`) and describes a lifecycle strictness setting (`strict`/`flexible`/`minimal`). The live distribution: 244 detected, 8 triaged, 15 remediated, 0 verified, 0 invalidated. The verification mechanism (absence-of-recurrence over N phases, `agents/knowledge-store.md:333-351`) requires the synthesizer to run regularly; it has not run enough to move *any* remediated signal to verified.

**Inference.** The lifecycle machinery models states the corpus has not exercised. Phase 59 SC#1 queries by `lifecycle_state`, but 91 % of signals are in one state. The differentiating power of a lifecycle query today is extremely limited, and will remain limited until the transitions themselves fire reliably. This is not a Phase 59 blocker — it is an observation that KB-04b's "filters by lifecycle state" delivers value only in proportion to the rate at which lifecycle transitions actually occur, and that rate is governed by Phase 59 KB-07 plus the external reconcile script plus the synthesizer.

**Competing explanations.**
- (B2a) *Ordering issue.* Once KB-07 ships, transitions will catch up, and lifecycle queries become useful.
- (B2b) *State design is too fine-grained for the actual practice.* The deliberation `.planning/deliberations/reflection-output-ontology.md` raises this concern from the side of reflection output: the pipeline models states it doesn't materialize.
- (B2c) *Passive verification is an artifact of signal modeling.* Verification-by-absence assumes signals are *prescriptive failures* that should stop recurring. But many recent signals (positive patterns, baselines) do not fit that shape. For positive signals, "verified by absence" is incoherent. The schema gestures at this (`agents/knowledge-store.md:295-300`: "Positive signals follow the same four-state lifecycle with adjusted semantics"), but "baseline reinforced" and "improvement sustained" are not behavioural states the synthesizer can test for.

**Disconfirmation.** I looked for any positive signal that reached `verified`. Zero. The mechanism is state-machine-blind to positive polarity today.

**Measurement vs measured.** Counting states is structural; whether the low utilization means "state model wrong" or "machinery not yet fired" is interpretive. Phase 59 should not decide this, but it should acknowledge the ambiguity — right now it does not.

### Theme C: The corpus is much richer than signals+spikes, and Phase 59 indexes only two types

#### Finding C1 — Reflections, deliberations, audits, plans, and phases are all KB-adjacent artifacts that the SQLite index ignores

**Evidence.** `kb.cjs:183-228` walks `signals/` and `spikes/` under `.planning/knowledge/`. The `reflections/` directory also exists under `.planning/knowledge/` (confirmed by `ls .planning/knowledge/` returning `reflections`, `signals`, `spikes`, `index.md`, `kb.db`). There is no `reflections` table in `kb.db` (confirmed: `SELECT name FROM sqlite_master WHERE type='table';` returns six tables — signals, signal_tags, signal_links, spikes, spike_tags, meta — and nothing else). `agents/knowledge-store.md:35-37` explicitly includes `reflections/` in the directory structure. The index.md probably lists them (confirmed: `agents/knowledge-store.md:13` mentions lessons (deprecated) but reflections as first-class).

Meanwhile `.planning/deliberations/` (44 files including `signal-lifecycle-closed-loop-gap.md`) and `.planning/audits/` (including this audit) are entirely outside `.planning/knowledge/` and therefore outside the KB's view. The deliberation skill produces artifacts that carry rich claim structure (claim/grounds/warrant/rebuttal/qualifier) but they cannot be queried, linked to signals, or surfaced alongside them.

**Inference.** Phase 59 SC#1 says "agents use SQLite queries for KB retrieval, with graceful fallback to grep." If agents need to find relevant deliberations, reflections, or audits, they still grep `.planning/`. If KB-08 is intended to route "relevant signal/spike/lesson retrieval" through SQLite, the deliberation and audit corpora are excluded by silence. This is the biggest invisible ceiling in Phase 59: the KB definition was frozen before deliberations and audits were first-class knowledge products, and the phase inherits that freeze.

**Competing explanations.**
- (C1a) *Scope discipline.* Keeping Phase 59 narrow is a virtue. Deliberations/audits can be indexed in a later phase.
- (C1b) *Accidental scope drift elsewhere.* The reflection/deliberation/audit artifacts already accumulated to the point where not indexing them *is* the architectural decision. Phase 59 is currently making that decision by omission.
- (C1c) *Ontology question unanswered.* The claim-type ontology deliberation hasn't landed yet; until it does, expanding the KB to hold deliberation/audit content risks premature commitment. Scoping Phase 59 narrow waits for that resolution.

I cannot settle between (C1a/b/c) with the evidence I have. The important move is to make the choice *explicit* in the phase goal or to surface it as a deferred requirement (see Recommendations §5.2).

**Disconfirmation.** I looked for any agent spec that would consume deliberations via the KB. None does. The deliberation skill cross-references deliberations by file path in markdown, not via a query layer.

**Measurement vs measured.** "Not indexed" is a structural fact. It does not measure whether indexing would help agents — that depends on how agents actually consume deliberations. The surfacing audit (`knowledge-surfacing.md`) already scopes to lessons + spikes, so reflection/deliberation surfacing would require agent-side changes too.

#### Finding C2 — The "lesson" entry type is a dead fourth ontology still cluttering the spec

**Evidence.** `agents/knowledge-store.md:13` says "Lessons are deprecated" but the same file still describes a Lesson Extensions schema (§4 Type-Specific Extensions). `knowledge-surfacing.md:14` says surfacing "is scoped to lessons (from reflection) and spike decisions only. Raw signals are NOT surfaced." So the authoritative surfacing protocol targets the deprecated type and *excludes* the raw data the KB spent Phase 56 formalizing. The reflection ontology deliberation confirms zero lessons exist today (`.planning/deliberations/reflection-output-ontology.md:52`).

**Inference.** Phase 59 KB-08 says "signal/spike/lesson retrieval" — still naming the deprecated type. Agents following `knowledge-surfacing.md` will query for lessons, find none, and either (a) return "no results" or (b) quietly reinterpret the instruction to cover signals. Both outcomes degrade the feedback loop. Phase 59 should either formally retire the lesson concept in the surfacing path (use signals + spikes + reflections as the surfacing triad) or reinstate lessons with a producer commitment.

**Competing explanations.**
- (C2a) *Dead code, low cost.* The deprecation banner is enough; agents will figure it out.
- (C2b) *Active confusion.* The Phase 59 text re-authorizes the dead type. Requirement text matters — a downstream author reading KB-08 today will assume lessons are live.
- (C2c) *Different concept, same label.* "Lessons" in the old sense were reflections' distilled principles. The current pipeline produces reflections; maybe "lesson" should be retired and `reflections` promoted to the surfacing path.

**Disconfirmation.** I looked for any recent lesson production. The latest reflection (`~/.claude/… / reflections/…`) contains "lesson candidates" as prose sections, but `lessons_created: 0` per the reflection ontology deliberation. Dead type is corroborated.

### Theme D: Feedback workflows are absent or advisory

#### Finding D1 — The KB has no "was this surfaced entry useful?" loop

**Evidence.** `agents/knowledge-store.md:109-115` defines optional tracking fields `retrieval_count` and `last_retrieved`:

> "These fields support future pruning design. Agents should increment `retrieval_count` and update `last_retrieved` when reading an entry for decision-making. Do NOT use these fields for automated decisions yet."

`knowledge-surfacing.md:217-233` describes a "Knowledge Applied" output section that agents are instructed to include. There is no mechanism by which the KB *reads* that section, reverse-attributes the surface event to an entry, or updates `retrieval_count`/`last_retrieved` on that entry. The tracking fields are declared but no subsystem maintains them. I grepped: `rg "retrieval_count" agents/ get-shit-done/ .planning/research/kb-architecture-research.md` returns only the agents/knowledge-store.md spec; no code or workflow writes these fields.

**Inference.** The KB is a write-once-read-many store with no learning signal from retrieval. An entry that helps 50 agents avoid a mistake looks identical (in SQL and in `index.md`) to an entry that has never helped anyone. This is a *structural* feedback gap, not merely a missing feature.

Phase 59 makes this worse rather than better. KB-04b/KB-08 channel more queries through SQLite, potentially yielding more retrieval events, but the queries are read-only with no writeback of retrieval attribution.

**Competing explanations.**
- (D1a) *Deferred deliberately.* F37 (memory intervention > model scaling) in the research doc makes KB quality valuable; but Phase 59 chose to ship the read path first.
- (D1b) *Measurement-first missing.* Phase 57.5–57.7 built measurement substrate; the signal-lifecycle intervention-outcome loop (PROV-12, Phase 60.1) extends measured interventions to lifecycle. Retrieval attribution is a peer of that intervention loop and is not scheduled anywhere.
- (D1c) *Epistemologically load-bearing gap.* Per Millikan (cited in the reflection ontology deliberation), output without consumption is semantically empty. A KB that does not know which of its entries are actually used cannot learn what to preserve, what to invalidate, what to promote to `_global`.

**Disconfirmation.** I looked for PROV-15 or MEAS-* that would cover retrieval attribution. PROV-09–14 cover telemetry-signal integration; no PROV covers retrieval outcomes. The feedback loop for surfacing is unrepresented across the roadmap.

**Measurement vs measured.** Counting retrieval events in code is straightforward; counting them *per entry* and closing the loop is not. I measured the *absence of code paths*, not the hypothetical value of adding them. The value is speculative but grounded in F21/F37.

#### Finding D2 — `depends_on` freshness is advisory; agents cannot be relied on to check it

**Evidence.** `agents/knowledge-store.md:121-123`:

> "Agents read these and use judgment to assess whether the entry is still valid … See `get-shit-done/references/knowledge-surfacing.md` Section 4 for the full freshness checking specification."

`knowledge-surfacing.md:142-161` describes the checking process as agent judgment ("Use judgment to assess whether dependencies still hold: Library version: check package.json if accessible …"). The 2026-03-04 deliberation's central diagnosis — agent-instruction-based steps are unreliable — applies in full force to `depends_on` checking. The research-phase pitfall C4 (`.planning/research/PITFALLS.md:63-75`) makes the same structural point for hook-dependent features. There is no automated staleness detector.

**Inference.** KB-08 as drafted will not cause `depends_on` checks to fire any more reliably than today. Phase 59 could add `kb health --freshness` (a programmatic staleness walker that checks simple conditions against the file system or package.json) for small cost. It is not in the current requirement.

**Competing explanations.**
- (D2a) *Out of scope.* Freshness is a v1.21 concern.
- (D2b) *Low corpus has simple dependencies.* The 15 remediated signals are likely too recent for staleness to bite.
- (D2c) *Ceiling on surfacing quality.* Without programmatic freshness, surfacing quality is capped by agent vigilance — which Pitfall C2 already shows to be unreliable.

**Disconfirmation.** None of the 267 signals in the live DB carry a populated `depends_on` field that I can see via spot sampling. This is suggestive but not conclusive.

### Theme E: Federation and cross-project concerns are entirely outside Phase 59

#### Finding E1 — The user's stated growth thesis (federated signals across projects, machines, users) has no Phase 59 handhold

**Evidence.** Memory `project_federated_signal_vision.md` (referenced in `MEMORY.md`) names "cross-project, cross-machine, multi-user signal federation as growth thesis for the harness." Phase 59 operates on local `.planning/knowledge/` with fallback to `~/.gsd/knowledge/`. The KB research architecture document at `kb-architecture-research.md:106-134` recommends Option C (CLI now, MCP later) with MCP server deferred. There is no requirement in KB-04b/04c/06a/06b/07/08 that would preserve compatibility with a federated layer, and no provenance fields on edges that would permit distinguishing "your machine's claim" from "my machine's claim" if federation arrives.

**Inference.** The current schema may or may not accommodate federation. `source_id` and `target_id` are strings; they could be prefixed with project/machine identifiers. But nothing in Phase 59 forces that discipline or names the design choice. Add federated growth thesis later = schema migration.

**Competing explanations.**
- (E1a) *Premature.* Federation is v1.22+; no need to shape Phase 59 around it.
- (E1b) *Cheap design-forward move.* Adding a single `origin_kb TEXT DEFAULT ''` column to signals and signal_links costs little and preserves a clean federation substrate.
- (E1c) *Orthogonal.* Federation is an MCP/transport concern, not a schema concern.

**Disconfirmation.** I looked for any federation-thinking in Phase 59 material. None. The ROADMAP does not cite the federation memory.

**Measurement vs measured.** I measured presence/absence in requirement text. I did not measure the cost of retrofitting federation into a non-federation-shaped schema. Precedent from KB-09 (source→detection_method+origin migration) suggests schema migrations are painful but feasible.

### Theme F: CLI surface is one verb away from over-loading

#### Finding F1 — `kb link` is ambiguous: create, read, traverse, delete?

**Evidence.** Phase 59 SC#2: "`gsd-tools kb link` traverses qualified_by/superseded_by relationships between signals and spikes." KB-06b: "`gsd-tools kb` write operations: transition, link -- with dual-write invariant enforced per KB-05." The two specifications disagree: SC#2 is read-only ("traverses"), KB-06b is a write operation ("link"). KB-04c: "Relationship traversal for qualified_by/superseded_by links via `gsd-tools kb link`" is also read-only. The CLI verb is doing double duty.

**Inference.** Whether `kb link` creates edges or traverses them is unsettled. If it does both (like `git branch`), the dual-write invariant has to apply to edge creation as it does to transitions — which means creating an edge writes into the source signal's frontmatter AND the SQLite row in the same transaction. Target-side writeback is not specified.

If `kb link CREATE` writes only to source frontmatter + SQL, Finding A4's one-way problem is codified by the CLI design. If it writes to source AND target frontmatter, the mutability boundary (`agents/knowledge-store.md:555-567`) is violated — `qualified_by` and `superseded_by` are in the FROZEN field list.

**Competing explanations.**
- (F1a) *Intentional ambiguity.* `kb link` is a command namespace; subcommands (`kb link create`, `kb link traverse`) disambiguate. This is fine but needs to be written down.
- (F1b) *Drafting oversight.* Two authors wrote SC#2 and KB-06b without reconciling the verb.
- (F1c) *Deep modeling issue.* The mutability boundary wants edges to be part of the frozen payload (`qualified_by`, `superseded_by` are frozen per §10); Phase 59 wants to create edges post-creation, which contradicts frozenness. Either the mutability boundary moves, or edges live outside signal frontmatter entirely (see Recommendation R2 on edge-as-entity).

**Disconfirmation.** I looked for a CLI spec that reconciles verbs. There is none; `kb.cjs` today implements `cmdKbRebuild`, `cmdKbStats`, `cmdKbMigrate` — no `link` verb yet.

## 3. The One-Way Relation / Immutable Node Problem — Design Options

The user asked for direct treatment of this. Finding A4 states the problem; this section names the design options I could find or derive, their costs, and which fit inside Phase 59's current scope.

### 3.1 Option 1 — Surface-only reverse-lookup (minimal)

**Move.** Keep schema as is. Add `kb links --inbound <id>` and `kb links --outbound <id>` as SQL reverse queries. Update `knowledge-surfacing.md` to instruct agents to run `kb links --inbound` after reading any entry and prepend an "inbound edges" section to surfaced context.

**Cost.** Small. No schema change. One CLI subcommand.
**What it solves.** Target-blindness in surfacing; agents see inbound context when they retrieve.
**What it does not solve.** Target-blindness at the file layer (reading the file directly still misses inbound edges); edge provenance; collapse of disagreement.
**Fits Phase 59?** Yes, if KB-06a/KB-06b gets `kb link --inbound` added. Minor requirement expansion.

### 3.2 Option 2 — Edge-as-entity (clean)

**Move.** Introduce `.planning/knowledge/edges/` as a first-class entry type. Each edge file has frontmatter `{source, target, link_type, confidence, rationale, provenance: {author, at, tool}, lifecycle_state}` and a body (1–3 sentences of justification). SQLite indexes edges separately from node frontmatter. Node frontmatter edge fields (`qualified_by`, `superseded_by`, `related_signals`, `recurrence_of`) become read-derived for backward compatibility — on `kb rebuild` they are regenerated from the edge registry.

**Cost.** Significant. New entry type, new schema table (`edges` with source_kind/target_kind columns), migration of existing 292 (really 180 good) edges into edge files, update surfacing, update `knowledge-store.md` spec.
**What it solves.** Target-blindness (reverse-query is trivial); edge provenance (each edge is a file); disagreement (multiple edge files can express competing claims); heterogeneity (source_kind/target_kind are first-class); polymorphism (spike→signal, deliberation→signal, audit→signal edges all allowed).
**What it does not solve.** Concurrency (two authors creating competing edges still need resolution); edge lifecycle (new states needed: proposed, accepted, rejected).
**Fits Phase 59?** Not as framed. This is a materially larger phase or a split (Phase 59a = query/lifecycle/surfacing on current schema; Phase 59b = edge-as-entity). But the design question should be *named in Phase 59* so that 59b or a later KB-12/13 can pick it up without another schema migration.

### 3.3 Option 3 — Bidirectional frontmatter writeback (violates immutability)

**Move.** When `kb link A --superseded-by B` fires, write `superseded_by: B` into A's frontmatter AND `supersedes: [A, ...]` into B's frontmatter.

**Cost.** Low code, high semantic cost. Breaks the frozen-field discipline for signals.
**What it solves.** Target-blindness at the file layer.
**What it does not solve.** Edge provenance (edges remain node properties without author/confidence); collapse of disagreement; heterogeneity.
**Fits Phase 59?** Fits the text but damages the mutability spec. I do not recommend.

### 3.4 Option 4 — Mutable annotations on frozen signals (middle path)

**Move.** Add an `annotations` array to signal frontmatter as a mutable field (extending the mutability boundary). Each annotation: `{at, by, kind, body, target_link?}`. Inbound edges append annotations to target; the annotation is a statement *about* the target by an author, not a change to the target's detection payload.

**Cost.** Moderate. Schema extension, mutability boundary amendment, dual-write contract extended.
**What it solves.** Target-blindness (annotations render when entry is read); edge provenance (annotation carries who/when); collapse of disagreement (multiple annotations can disagree).
**What it does not solve.** Heterogeneity across types (annotations live on signals; spikes/deliberations need parallel mechanisms); retrieval attribution (annotations are not retrieval events).
**Fits Phase 59?** Ambitious fit. If Phase 59 scope is stretched, this is the minimum path that gets edge provenance without introducing a new entity type.

### 3.5 Option 5 — Overlay/sidecar files (git-notes style)

**Move.** Target signal's `.md` stays untouched. A sidecar `{target-id}.notes.md` accumulates inbound annotations under the same project directory. Surfacing layer merges sidecar into display; SQLite indexes notes for query.

**Cost.** Moderate. New file convention; precedent is git notes.
**What it solves.** Target-blindness at display time; edge provenance; node immutability preserved.
**What it does not solve.** The sidecar is still per-target; cross-cutting edge queries (find all edges of kind X) need the edge registry approach.
**Fits Phase 59?** Fits in principle; requires spec extension not currently in KB-04b/04c.

### 3.6 Recommendation within this section

Option 1 (inbound CLI) should land in Phase 59 regardless of anything else — it is a small move that returns outsized information. Option 2 (edge-as-entity) should be introduced as a **named downstream requirement** (Phase 59 reserves vocabulary and adds a comment in the schema; implementation is Phase 59b or a new KB-12). Options 3–5 are alternatives for the same target; pick one if Option 2 is deferred indefinitely.

## 4. Feedback Workflow Gaps

Per the task spec's explicit request for a feedback-workflow section:

### 4.1 Retrieval-to-value loop is open (D1)

Already covered in Finding D1. Recommendation: at least a passive `kb surfaced <id> --phase <n> --agent <name>` CLI that appends retrieval events to a log table, even without reading them for decisions. This is the "raw layer" of MEAS-ARCH-01 (`.planning/REQUIREMENTS.md:111-112`) for the KB surfacing dimension — cheap to collect, extraction deferred.

### 4.2 Signal-to-signal challenge loop is not instrumented

**Evidence.** When an audit or reflection challenges a signal's interpretation, there is no mechanism to mark the signal as "contested" without invalidating it. The `invalidated` state exists but it is terminal. There is no intermediate "contested" or "under review" state, and no mechanism for the challenge itself to be recorded as a first-class artifact.

**Competing explanations.**
- Scope: may be v1.21.
- Ontology: the claim-type ontology deliberation hasn't landed.
- Affordance: `triage.decision: investigate` partially covers this but only as a triage verdict.

**Recommendation.** Name a downstream requirement for "contested" or "under review" state, or commit to edge-as-entity (Option 2) and use an edge `contested_by` to avoid new node states.

### 4.3 Plan→signal resolution loop is asymmetric

**Evidence.** A plan declaring `resolves_signals: [sig-X]` updates sig-X's `lifecycle_state`. But sig-X's frontmatter does not carry a reciprocal `resolved_by_plan` field *as a first-class edge* with provenance. The `remediation.resolved_by_plan` field exists (`agents/knowledge-store.md:167-168`) but it is a nested string, not an edge node; if the plan is later retroactively retracted (phase undo), the field remains.

**Recommendation.** Either elevate `resolves_signals` to a first-class edge (`resolves`/`resolved_by`) with rollback semantics, or add a lifecycle regression step when plan is undone.

### 4.4 Reflection outputs don't feed back into signal quality

**Evidence.** `.planning/deliberations/reflection-output-ontology.md:52-54` — reflection reports contain "lesson candidates" in prose but `lessons_created: 0`. The prose does not link back to source signals via structured edges; an agent reading a signal cannot see which reflections cited it. This is the dual-memory gap (F21) restated in structural terms.

**Recommendation.** If reflections were indexed (Finding C1), they could carry `cites_signals: [...]` and `cites_spikes: [...]` edges into the graph, producing a bidirectional layer. Phase 59 could at minimum add reflection indexing as a deferred child requirement.

## 5. Relation Provenance and Relation Semantics

Per the task spec's explicit request for a relation-semantics section:

### 5.1 Relation provenance is absent

As noted in Finding A4 and A1, edges carry no author, no date, no rationale, no confidence. The concrete consequences are:
- 107 malformed edges accumulated undetected.
- If a reflector re-classifies an edge (e.g. `recurrence_of` → `superseded_by`), there is no audit trail.
- Cross-model review of edge claims is impossible without auxiliary records.
- Edge deletion on rebuild (`DELETE FROM signal_links WHERE source_id = ?` in `kb.cjs:469`) wipes any derived annotations each time an edited signal is re-indexed.

**Recommendation.** At minimum, capture `created_at` and `source_revision` (the source file's content hash at edge-creation time) on `signal_links`. This is cheap and preserves enough provenance that forensics is possible. Full provenance needs Option 2 (edge-as-entity).

### 5.2 Relation-type vocabulary is under-specified

**Evidence.** `agents/knowledge-store.md` defines `qualified_by`, `superseded_by`, `related_signals`, `recurrence_of`. These are enumerated in `kb.cjs:403-431`. But:
- `qualified_by` collapses: corroborates / refines / restricts / contradicts. All four semantically distinct relations map to the same edge type.
- `related_signals` is a catch-all with no semantics beyond "there is a relation."
- `superseded_by` does not distinguish "strict replacement" from "improved framing of the same observation."
- `recurrence_of` is the only type with downstream behaviour (severity escalation, `agents/knowledge-store.md:369-373`).

**Recommendation.** Either refine the vocabulary (introduce subtypes: `corroborates`, `refines`, `restricts`, `contradicts`, `replaces`, `improves-framing`) now, or lock the current set as v1 and commit to an extension mechanism (`link_kind` + `link_qualifier`) for v2. Phase 59 should at minimum flag this as a known under-specification.

### 5.3 Relation transitivity is undefined

If A `superseded_by` B and B `superseded_by` C, is A superseded by C? Undefined. Phase 59 traversal (SC#2) must make a choice or explicitly decline. Without a choice, two agents running `kb link` may see different answers depending on implementation.

**Recommendation.** Phase 59 should specify shallow vs. transitive traversal defaults for each link type.

## 6. Direct Assessment of Phase 59 Scope

### 6.1 Is Phase 59 currently scoped too narrowly?

**Yes, but in a specific sense.** The phase is scoped narrowly relative to the *infrastructure* the KB actually needs (Findings C1, C2, D1, D2, E1), but scoped reasonably given the work-unit conventions this project uses. The trouble is that the phase's scope-narrowing is *implicit*: deliberations and audits are out-of-scope by omission, retrieval attribution is out-of-scope by omission, edge provenance is out-of-scope by omission, federation is out-of-scope by omission. None of these omissions is documented as a deliberate deferral with a downstream requirement name.

**Consequences.** Without explicit deferral:
1. A future auditor will find the same gaps with no record of a decision.
2. A Phase 62 (Workflow Commands) or 63 (Spike Programme Infrastructure) author may assume edges carry provenance and build on a false affordance.
3. The GATE-09 scope-translation-ledger (Phase 58) cannot record what Phase 59 "explicitly deferred" because Phase 59's CONTEXT does not yet enumerate it.

### 6.2 What the requirements text says vs. what Phase 59 would actually accomplish

| Requirement text | What would actually ship if taken literally |
|---|---|
| KB-04b: FTS5 full-text search | FTS5 not yet wired; `signal_fts` virtual table was explicitly dropped in Phase 57.7 (`kb.cjs:146-158`). Re-entry must be contentless rewrite, not canonical-row expansion. The requirement does not acknowledge this. |
| KB-04c: qualified_by/superseded_by traversal | No edges of these types exist; CLI would traverse empty sets. |
| KB-06a: read ops (query, search, stats, health, rebuild) | `stats` and `rebuild` exist today; `query`, `search`, `health` do not. Scope-sized reasonably. |
| KB-06b: write ops (transition, link) with dual-write | Dual-write invariant is sound; `link` verb is ambiguous (§F1). |
| KB-07: lifecycle wiring auto-transitions on plan completion | Parallel bash path already exists; potential for divergence (§B1). |
| KB-08: agents use SQLite queries | `knowledge-surfacing.md` targets deprecated lessons (§C2); must be updated. |

Each requirement is doing real work, but five out of six have a latent issue the current text does not acknowledge.

### 6.3 Is the deeper issue ontology or infrastructure?

**Both, with ontology being the harder layer.** Infrastructure gaps (edge provenance, retrieval attribution, reflection/audit indexing, federation-readiness) can be solved by requirement additions. Ontology gaps (are edges properties of nodes or first-class entities? is the lesson type alive or dead? are positive signals really the same lifecycle as negative? are deliberations/audits KB entries or peer artifacts?) need resolution *before* infrastructure commits.

Phase 59 as currently written treats these as settled; they are not.

## 7. Recommendation

Per the task spec's instruction, I must choose among: (a) keep 59 mostly intact with targeted strengthening, (b) materially expand 59, (c) split 59, (d) keep 59 focused but add explicit downstream child requirements.

**My recommendation: (d) keep 59 focused + (a) targeted strengthening + named downstream child requirements.**

Rationale: expanding Phase 59 to cover edge-as-entity, retrieval attribution, reflection/audit indexing, and federation substrate would produce a phase the project cannot reasonably land in one cycle. Splitting would produce a Phase 59a/59b pair that reproduces Phase 57.x's decimal-phase sprawl without clear epistemic payoff. The right move is to keep the phase focused on the six requirements it names, land *targeted* strengthening, and commit *now* to downstream children so the GATE-09 translation ledger can record the deliberate deferrals.

### 7.1 Targeted strengthening to add inside Phase 59

1. **Edge integrity baseline.** Add a requirement (KB-04d or extend KB-04c) that `kb rebuild` must report edge integrity — count of edges whose target resolves to a known signal/spike vs. orphaned, count by link_type, count of `[object Object]` malformed targets — and fail with non-zero exit if malformed edges are detected after migration. Ship a one-time repair migration for the existing 107 `[object Object]` rows. (Fixes Finding A1.)
2. **Inbound edge CLI.** Add `kb links --inbound <id>` and `kb links --outbound <id>` subcommands. Update `knowledge-surfacing.md` surfacing protocol to fetch inbound edges alongside outbound. (Fixes surface-level one-way problem per §3.1.)
3. **`kb link` verb disambiguation.** Split into `kb link create`, `kb link delete`, `kb link show` (or equivalent). Specify which mutate node frontmatter and which are read-only. (Fixes §F1.)
4. **Edge integrity in CI.** Add a test that asserts no `signal_links` row has a target unresolved against signals/spikes/{deferred: lessons/deliberations/audits}. (Operationalizes Pitfall C1.)
5. **Retire lesson-centric surfacing.** Update `knowledge-surfacing.md` to target signals + spikes + reflections; remove lesson references from KB-08 or explicitly scope KB-08 to the non-deprecated types. (Fixes §C2.)
6. **Lifecycle path reconciliation.** Phase 59 must state whether `kb transition` replaces `reconcile-signal-lifecycle.sh`, complements it, or deprecates it. Add one sentence to KB-07 motivation that cites `.planning/deliberations/signal-lifecycle-closed-loop-gap.md` and the existing bash fallback. (Fixes §B1.)
7. **`kb health` concrete contract.** KB-06a mentions `health` but does not specify what it checks. Minimum: edge integrity, lifecycle-vs-plan consistency (Option B from the 2026-03-04 deliberation), dual-write-invariant verification, `depends_on` freshness summary. (Fixes §D2 partially.)
8. **Edge provenance minimum.** Add `created_at TEXT` and `source_content_hash TEXT` columns to `signal_links`. Populated on insert. No backfill required. (Enables future forensic work cheaply.)
9. **Corpus-drift re-verification.** Add a Success Criterion that `kb rebuild` succeeds against the current 267 corpus (not 198). Re-run KB-09/KB-10 gates against live corpus. (Fixes §1.4.)

These nine additions strengthen Phase 59 without exploding its surface. Several map to existing pitfalls and deliberations with no new authoring burden.

### 7.2 Downstream child requirements to name now

For the GATE-09 scope-translation ledger (Phase 58) and for project coherence, Phase 59's CONTEXT.md (when it is written during `/gsdr:discuss-phase 59`) should enumerate these as explicit deferrals with child requirement IDs:

- **KB-12 (deferred to Phase 62 or v1.21): Edge-as-entity model.** Edges become first-class entries at `.planning/knowledge/edges/`. Schema carries source_kind/target_kind/link_subtype, author/at/confidence/rationale, lifecycle. Current `signal_links` table becomes a derived projection. Migration path from current signal-frontmatter edge fields specified.
- **KB-13 (deferred to Phase 62 or v1.21): Retrieval attribution.** `retrieval_count` / `last_retrieved` fields are populated by a programmatic `kb surfaced` call (not agent self-report). Surfacing protocol updated to call it on every retrieval; measurement-substrate integration via PROV-15 (new) to track which retrievals correlate with successful plan/phase outcomes.
- **KB-14 (deferred to v1.21): Non-signal artifact indexing.** Deliberations, audits, reflections indexed as first-class KB entries. Cross-type edges enabled (deliberation cites signal, audit references reflection).
- **KB-15 (deferred to v1.22+): Federation substrate.** `origin_kb` column on signals and signal_links (or the KB-12 edges table) distinguishes local vs. imported knowledge. MCP server wraps `kb` CLI for cross-machine access. Signal ID namespace extended to include KB origin.
- **KB-16 (deferred): Edge vocabulary extension.** `link_kind` + `link_qualifier` support richer semantics (corroborates / refines / restricts / contradicts / replaces / improves-framing). Transitivity rules per link_type specified.
- **KB-17 (deferred): Contested/under-review state for signals.** Intermediate lifecycle state for signals being challenged before invalidation vs. remediation is decided. Alternative: subsumed by KB-12 edge-as-entity via `contested_by` edges.

Declaring these explicitly costs ~15 minutes of REQUIREMENTS.md authoring. It converts Finding C1 / D1 / E1 / A4 / C2 / B2 from "invisible Phase 59 decisions" into "enumerated deferrals."

### 7.3 What Phase 59 should NOT try to pull in now

- Full edge-as-entity materialization (KB-12): too big, deserves dedicated phase.
- Federation substrate (KB-15): out of v1.20 scope; premature work.
- Retrieval attribution (KB-13): depends on measurement infrastructure that Phase 60.1 is still stabilizing.

## 8. Rule 2 Disconfirmation Notes (consolidated)

For each finding that makes a positive claim, I noted what disconfirmation I attempted. The biggest unresolved attempts:

- Finding A1: the disconfirmation "no CI check exists" is *absence of evidence*; a weaker disconfirmation than I would prefer. I grepped the test suite and CLI stats output, which is not exhaustive.
- Finding B1: the claim that "the two paths will diverge" is speculative — they coexist but have not yet collided. Disconfirmation would require waiting for divergence to manifest or for the merge to happen cleanly.
- Finding C1 (the non-indexed artifact classes claim) may overstate the harm. Agents may be fine with grep for deliberations today; I did not measure their actual retrieval success on deliberations.

## 9. Rule 3 Measurement-vs-Measured Notes (consolidated)

Key proxies:
- Edge count by link_type measures *structural edge inventory*, not *semantic edge validity*.
- Lifecycle distribution measures *field values*, not *actual remediation quality*.
- "Zero `qualified_by` edges" measures *edge absence*, not *absence of qualification judgments* (the judgments may exist in prose without being structured).
- "107 `[object Object]` edges" measures *literal string-level corruption*, not *the set of all corrupted edges* (others may have well-formed but wrong targets and be invisible).
- "No retrieval attribution" measures *code path absence*, not *value of retrieval attribution* (the value is grounded in F21/F37 but not measured directly).

## 10. Rule 4 Escape Hatch — What the ground rules did not prepare me for

The ground rules prepared me well for *discrepancy-driven investigation* and *requirements specificity review*. They did not prepare me for two things:

**(1) The artifact-live-state asymmetry.** The most vivid findings (107 malformed edges; 15 remediated signals despite roadmap saying zero; 267-signal corpus vs. 198 in research doc) came from querying `.planning/knowledge/kb.db` directly. The ground rules emphasize "file:line and quote the relevant passage." Quoting a SQLite row is not file:line; it is a live-state measurement. I handled this by explicitly labeling such claims as database queries and recording the queries I ran, but the ground rules' default assumption is that evidence is textual. An "evidence grounded in live state" obligation would help.

**(2) The ontology-vs-infrastructure tension that refuses to stay on one side.** The rules let me classify this as `requirements_review`, but the most important findings (A4 edge-as-node-property, C2 lesson-type-dead, D1 feedback-gap) are ontology-shaped: they are claims about *what the KB's basic entities should be*, not about whether a particular requirement is specific enough. The composition principle says I should name tension; I have, but I note that the taxonomy of subjects (requirements_review, artifact_analysis, process_review) may be missing an "ontology review" mode that was the right subject for half of this audit.

## 11. Rule 5 Frame-Reflexivity

### 11.1 Counterfactual subject: what would `artifact_analysis` have looked for?

An artifact-analysis audit would have walked the 267-signal corpus and cataloged patterns: which signals have `qualified_by` populated, which reflections cite which signals, what retrieval patterns exist in the reflections, how `related_signals` is actually used (83 % of `related_to` edges point at corroboration-adjacent signals, for instance — I did not measure this but an artifact audit would have). It would have produced a distribution-shaped finding set: "here is what the corpus actually looks like," not "here is what the requirement text admits." My audit leans toward text-level review; I corrected this partly by querying `kb.db`, but an artifact audit would have gone much further into per-signal content patterns.

### 11.2 Counterfactual orientation: what would `exploratory` have held open?

An exploratory audit would have refused to commit to "KB architecture" as the level of analysis. It would have asked: *should the KB exist in this form at all?* It would have considered whether signals/spikes/reflections should merge into a single `claim` type parameterized by structure (which the claim-type ontology deliberation is already working toward). It would have asked whether the file-first invariant is a premature commitment. It would have opened the question of whether the KB is a knowledge store or a memory substrate (F21). I closed these questions by treating Phase 59's architectural frame as given and auditing its completeness within that frame.

### 11.3 Concrete example of frame-shaped attention

The `requirements_review` × `investigatory` framing trained my attention on *what the six requirements say and what the code/corpus do or don't do in response*. It trained my attention *away* from questions like "is the lifecycle enum the right shape for the actual practice?" (§B2 edge case noted but not developed) and "is the signal concept itself the right basic unit?" (deferred). The most distinctive example: I noticed `lessons_created: 0` only because it appeared in a deliberation document I read for adjacent context, not because my frame prompted me to check it. A frame-reflexive practice would have *started* with "what does the actual knowledge-production pipeline produce, and what happens to those products?" and only then moved to requirement text.

## 12. Framework Invisibility

**Concrete finding that would not appear no matter how rigorously this audit was conducted, because of how this audit's scope was framed:**

*Whether Phase 59 should exist at all, in its current decomposition, given that the KB's deepest problem — the reflection pipeline produces prose that doesn't materialize into behavioral change (`.planning/deliberations/reflection-output-ontology.md:52-93`) — is not addressed by any of the six KB requirements, and may be the actual load-bearing gap in the "KB Query, Lifecycle Wiring & Surfacing" problem statement.*

This audit's scope is "expose architectural gaps in Phase 59." It cannot raise the possibility that Phase 59 is *the wrong phase to fix what is actually broken*. The reflection output ontology deliberation names an open problem that cuts through every KB requirement — signals aren't being distilled into actionable knowledge; lessons aren't being produced; the self-improvement loop is not closing even when wired. Phase 59 works on query/lifecycle/surfacing, which are all *substrate* for that loop. Improving the substrate when the loop itself is broken is Pitfall C1's twin: shipping infrastructure that appears to fix the problem while the actual problem continues. The framework (requirements_review of Phase 59) keeps me from naming this.

I name it here under framework invisibility, not as a Phase 59 finding.

## 13. Unknowns (per I5)

Explicit unknowns I could not resolve:

- Whether the 15 `remediated` signals were transitioned by `reconcile-signal-lifecycle.sh`, the bash fallback, manual editing, or by the synthesizer. (Would require git log archaeology against each signal file.)
- Whether agents *would* run `kb links --inbound` consistently even if the CLI shipped. (Pitfall C2 precedent suggests they may not.)
- Whether the 107 `[object Object]` edges are the only silent corruption, or whether similar-shaped bugs exist for `superseded_by` / `qualified_by` on source files whose authors used object-shaped YAML by mistake. (Requires corpus-wide YAML validation.)
- Whether the deferred requirements (KB-12..17) should live in v1.20 or v1.21; depends on milestone pacing decisions outside my frame.
- Whether the 267 corpus includes signals that would fail `kb rebuild` today — I did not run a rebuild; I inspected the live DB state assuming the last rebuild succeeded.
- How Phase 60.1 (PROV-09 integration surface) intersects Phase 59's KB-08 (agents use SQLite queries) — both touch agent-side KB consumption patterns and could compete for the same surface.

## 14. Completion Note

**Recommendation summary:** Keep Phase 59 scoped to its six current requirements, strengthen it with nine targeted additions (§7.1), and name six downstream child requirements (§7.2) that convert the current implicit deferrals into explicit ones. This preserves Phase 59's deliverability, honors the 2026-03-04 deliberation's structural-over-advisory lesson, and makes the GATE-09 scope-translation ledger tractable at phase close.

**Biggest architectural claim:** The "one-way relation / immutable node" unease is not a bug in Phase 59 — it is a consequence of modeling edges as *properties of nodes* rather than *first-class entities*. Option 2 (edge-as-entity, §3.2) is the principled fix. It is too big for Phase 59 but should be named as KB-12 so the project commits to the direction.

**Biggest findings in the live corpus:** 107 edges with literal `[object Object]` target strings (Finding A1); zero `qualified_by` / `superseded_by` edges despite KB-03 marking those fields supported (Finding A3); `signal_fts` virtual table already explicitly dropped in Phase 57.7 and Phase 59's FTS5 promise must be a contentless rewrite (unstated in requirement text).

**Output path:** `.planning/audits/2026-04-20-phase-59-kb-architecture-gap-audit/phase-59-kb-architecture-gap-audit-output.md`

— end of audit output —
