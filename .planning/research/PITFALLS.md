# Domain Pitfalls

**Domain:** Agentic workflow harness — adding queryable KB layers, spike methodology frameworks, telemetry infrastructure, and structural enforcement to an existing 7-milestone system
**Researched:** 2026-04-08
**Evidence base:** Five custom research documents, 100-session cross-platform audit, 198-signal KB, 4-spike empirical corpus from arxiv-sanity-mcp, epistemic-agency repo findings

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or milestone-scale failure.

---

### Pitfall C1: SQLite Index Treated as Source of Truth

**What goes wrong:** The SQLite KB index (`kb.db`) accumulates state that diverges from the Markdown files it indexes. Write operations that only update SQLite without updating the corresponding `.md` frontmatter create a hidden second source of truth. When the index is eventually rebuilt, those writes are lost.

**Why it happens:** The convenience of writing to SQLite via CLI (`kb transition <id> in_progress`) is much lower friction than editing YAML frontmatter. Without an enforced invariant, developers take the easy path.

**Consequences:** Lifecycle state changes (remediated, verified, blocked) are silently erased on next `kb rebuild`. Data loss is silent and discovered late. The pattern mirrors the KB data loss incident that created `sig-2026-02-11-kb-data-loss-migration-gap`.

**Prevention:** Every write operation (`kb transition`, `kb link`) must update BOTH the `.md` frontmatter AND the SQLite row in the same transaction. The `kb.db` file must be in `.gitignore` to make clear it is derived. Add a test that rebuilds the index and asserts it matches the prior state after a roundtrip write.

**Detection:** Checksum the SQLite state against file-derived state after every write. Divergence is a bug, not drift.

**Phase warning:** Any phase implementing `gsd-tools kb transition` or lifecycle state changes.

---

### Pitfall C2: Lifecycle State Machine Wired Without Transition Tests

**What goes wrong:** The signal lifecycle transitions (`detected → proposed → in_progress → remediated → verified`) are wired to workflows (`collect-signals` reads `resolves_signals` from completed plans), but the wiring is never tested end-to-end. The 0% remediation tracking rate that motivated this work (audit finding R11) persists because the wiring silently does nothing.

**Why it happens:** Unit tests cover individual functions; integration paths through workflow → state machine → KB write span three separate systems and are easy to skip. The `resolves_signals` field already exists in plan frontmatter since v1.16 Phase 34 and has never been read by anything — this is the direct historical precedent for the failure mode.

**Consequences:** The schema and wiring exist but the lifecycle stays frozen at `detected` for all signals. The tracking infrastructure is shipped but not used, creating false confidence that the 0% remediation problem is fixed.

**Prevention:** Write an integration test that: (1) creates a mock signal with lifecycle `detected`, (2) creates a mock completed plan SUMMARY.md with a `resolves_signals` reference, (3) runs `collect-signals`, (4) asserts the signal lifecycle advanced to `remediated`. Do not ship the wiring until this test passes.

**Detection:** After the phase completes, run `gsd-tools kb stats` — if all 198+ signals still show `lifecycle: detected`, the wiring is broken.

**Phase warning:** The phase implementing `collect-signals` workflow reading `resolves_signals`.

---

### Pitfall C3: Token Count Reliability Used Without Validation

**What goes wrong:** Session-meta `input_tokens`/`output_tokens` values are used as ground truth for baselines and cost estimates. But the observed value of 109 input tokens for a 23-message/84-assistant-message session across 513 minutes is implausibly low. If session-meta token counts are post-caching residuals rather than gross counts, all telemetry baselines are measuring the wrong thing.

**Why it happens:** The field names suggest gross counts but the values suggest otherwise. Without explicit documentation of accounting method, the natural assumption is wrong.

**Consequences:** Baselines built on these values produce comparisons that are internally consistent but don't reflect actual model cost. Phase predictions claiming "this change reduces token usage by X%" are measuring noise. Downstream spike validation that uses telemetry as evidence inherits the unreliability.

**Prevention:** Before using session-meta tokens for any baseline, run a validation spike: pick 5 sessions, aggregate per-message JSONL token counts for the same sessions, compare. Document which accounting method each data source uses. The telemetry module should annotate outputs with the data source and its known limitations.

**Detection:** Any session with many tool calls but single-digit or double-digit token counts in session-meta is a reliability signal. Flag these automatically in `telemetry baseline` output.

**Phase warning:** Any phase implementing telemetry baselines or token cost reporting.

---

### Pitfall C4: Hook-Dependent v1.20 Features Silently Degrade on Codex

**What goes wrong:** A v1.20 feature is designed assuming hook availability (SessionStart, PostToolUse) and ships to Claude Code. On Codex CLI v0.118.0, where no hook mechanism exists (confirmed by direct inspection of `config.toml`), the feature silently does nothing. The developer doesn't notice because they primarily work in Claude Code.

**Why it happens:** The five new v1.20 hook-dependent features (automation postlude, `.continue-here` consumption, offer_next PR/CI gate, quick task branch detection, context monitor) each need explicit Codex degradation paths. Only offer_next and `.continue-here` lifecycle have fully specified degradation strategies in the cross-runtime research.

**Consequences:** The cross-runtime distribution gap (R3 from verification analysis) that let the discuss-phase fix miss Codex for multiple milestones repeats. Features that work structurally on Claude Code become advisory text on Codex, undermining the audit's central finding that advisory text consistently fails.

**Prevention:** For every v1.20 feature, specify both the hook-based implementation AND the Codex degradation strategy before writing any code. The cross-runtime parity research provides the degradation map. Add a CI check that verifies each new feature has an entry in the parity capability matrix.

**Detection:** Run `gsd-tools distribution-check` (Approach C from cross-runtime research) after each phase to surface divergence between Claude and Codex installed files.

**Phase warning:** Any phase implementing structural gates via hooks.

---

### Pitfall C5: Spike Design Reviewer Becomes a Checklist Agent

**What goes wrong:** The spike design reviewer agent is implemented as a checklist runner — it checks 9 dimensions, produces pass/fail verdicts, and auto-approves designs when all boxes are checked. Within two spikes, agents learn to write designs that pass the checklist without being methodologically sound.

**Why it happens:** Checklists are easy to implement and test. Genuine critique is harder to specify and evaluate. Under time pressure, the implementation defaults to what is verifiable.

**Consequences:** Pattern 4 (self-awareness without enforcement) — the failure the reviewer is designed to fix — is reproduced at the reviewer level. The SPIKE-DESIGN-REVIEW-SPEC.md from arxiv-sanity-mcp prescribes 9 dimensions; turning them into a checklist loses the judgment they require. The design reviewer becomes procedural theater.

**Prevention:** The design reviewer must produce a **critique document**, not a pass/fail verdict. The designer responds to the critique; both the critique and the response are recorded as artifacts. The reviewer must be a different model from the designer (Longino's diversity requirement: same-model review shares blind spots, confirmed by epistemic-agency F02). The reviewer's context must include the METHODOLOGY.md lenses (6 epistemic perspectives), not just a dimension checklist.

**Detection:** If spike DECISION.md quality does not improve after the reviewer is introduced (compare before/after on premature closure rate, metric reification rate), the reviewer is a rubber stamp.

**Phase warning:** The phase implementing the spike design reviewer agent.

---

### Pitfall C6: Over-Formalization Kills the Cross-Model Review Pattern

**What goes wrong:** Cross-model review — the audit's single strongest positive pattern across all 35 positive findings — is formalized into a rigid protocol with required review dimensions, fixed output format, and mandatory invocation gates. After formalization, usage drops because the overhead exceeds the perceived value for small decisions.

**Why it happens:** The natural instinct when formalizing a successful practice is to capture every element of what made it successful, producing over-specification. The audit's central lesson (advisory text fails, structural enforcement required) creates additional pressure to enforce.

**Consequences:** The harness loses its highest-quality feedback mechanism. Cross-model review provided — across 35 documented patterns — catching assumption structures, identifying blindspots, and providing the independent noise distribution that same-model review cannot. Once the practice degrades under protocol overhead, it does not recover in-milestone.

**Prevention:** The `/gsdr:cross-model-review` command must remain opt-in and flexible. It should provide protocol guidance without enforcing it. Use case triggers (high-stakes design decisions, apparent pattern mismatch, anomalous results) should be recommendations, not gates. "Flexible protocol" is not a cop-out — it is the implementation requirement derived from evidence.

**Detection:** Monitor cross-model review invocation frequency. If usage drops post-formalization, the protocol is too heavy.

**Phase warning:** The phase implementing `/gsdr:cross-model-review`.

---

## Moderate Pitfalls

### Pitfall M1: STATE.md Concurrent Write Race Not Solved by Locking

**What goes wrong:** Parallel phase execution is implemented using the existing `automation lock/unlock/check-lock` infrastructure from `automation.cjs` to prevent STATE.md conflicts. The locking prevents concurrent in-process writes but does not prevent cross-worktree git merge conflicts, because git worktrees have independent working directories. Lock files in `.planning/` within worktree A are invisible to worktree B.

**Why it happens:** The lock infrastructure is visible and working; it is natural to reach for it. The measurement infrastructure research explicitly labels this approach (Approach 2) as "fundamentally mismatched to the problem."

**Consequences:** STATE.md merge conflicts on every parallel worktree merge. The developer reverts to sequential execution, defeating the purpose of parallel infrastructure.

**Prevention:** Use Approach 1 from the research: per-worktree state files (`state/{worktree-name}.json`), with `resolveWorktreeRoot()` routing state writes. This exists already in `core.cjs`; it needs to be wired to `writeStateMd()`.

**Phase warning:** Any phase implementing parallel worktree execution.

---

### Pitfall M2: Signal Schema Migration Breaks Old Signal Reads

**What goes wrong:** New fields (`lifecycle`, `disposition`, `qualified_by`, `remediation`) are added to signal frontmatter schema but the index rebuild script, agent references, and knowledge-surfacing patterns assume the old schema. Old signals without the new fields cause parsing errors or silent omissions in queries.

**Why it happens:** The migration is framed as "additive, backward-compatible" but the SQLite schema expects `lifecycle TEXT DEFAULT 'detected'` — if the YAML parser returns `null` for missing fields and the SQL column has a default, things work. If the parser throws on unexpected fields in old signals, or the query logic assumes all fields are present, silent failures occur.

**Prevention:** Test `kb rebuild` on a sample of old signals before shipping. All new query paths must handle `null`/missing field values gracefully, treating them as the default value, not as errors. Add schema validation to the rebuild that reports missing fields rather than failing silently.

**Phase warning:** The phase implementing the new signal schema fields.

---

### Pitfall M3: Facets Data Used as Ground Truth for Quality

**What goes wrong:** Facets data (`~/.claude/usage-data/facets/*.json`) provides `outcome`, `satisfaction`, and `friction_counts` fields for 109 of 268 sessions. These are used as quality ground truth for training telemetry baselines and correlating session metrics with outcomes. But facets data is AI-generated, not human-annotated. Its accuracy is unknown.

**Why it happens:** Structured labels that map cleanly to "quality" are rare. The temptation to use what's available as-is is high.

**Consequences:** Metric-to-quality correlations derived from facets data may measure what the AI labels as quality, not what the user experiences as quality. Any "proof" that an intervention improved quality based on facets correlations is actually proof that the intervention changed how the AI assessed quality — not that quality actually improved.

**Prevention:** Facets fields should be labeled as "AI-generated quality estimates" in all telemetry outputs. Correlations should be treated as hypothesis-generating, not hypothesis-confirming. Validation against user-provided quality signals (explicit feedback, interruptions as a behavioral proxy) is required before claiming facets-based quality measurement is reliable.

**Phase warning:** Any phase implementing telemetry-based quality baselines.

---

### Pitfall M4: Spike Programme Infrastructure Over-Engineered for Simple Spikes

**What goes wrong:** The Lakatosian spike programme concept — hard core declaration, protective belt tracking, progressiveness ledger, backward propagation mechanism — is built as mandatory overhead that applies to all spikes, including simple binary spikes that need only a DESIGN.md and DECISION.md.

**Why it happens:** The programme concept is well-evidenced (from the arxiv-sanity-mcp 4-spike corpus). The natural implementation impulse is to build the full system once.

**Consequences:** Simple one-off spikes require declaring a programme, writing a progressiveness ledger, and tracking backward propagation for a question with a yes/no answer. Usage drops. The complexity tax exceeds the benefit for the majority of actual spike usage.

**Prevention:** Programme infrastructure is optional scaffolding, activated by explicit declaration, not automatic overhead. A spike that does not declare a programme runs exactly as today. A spike that declares a programme gets the additional infrastructure. The 2-round limit continues to apply per-spike; the programme itself has no round limit.

**Phase warning:** The phase implementing spike programme infrastructure.

---

### Pitfall M5: DECISION.md Template Revision Reproduces Premature Closure

**What goes wrong:** The new DECISION.md template with `decided/provisional/deferred` outcome types is implemented such that `provisional` or `deferred` becomes the new default for all decisions, or conversely that agents mark decisions as `decided` when evidence is incomplete to avoid accountability. The original premature closure problem is reproduced at one step removed.

**Why it happens:** Renaming outcome categories doesn't remove the structural pressure to close. Pattern 1 (premature closure under completion pressure) shows the pressure comes from the template rewarding completion, not from the category names.

**Prevention:** The `deferred` outcome type must require a concrete specification: what question must be answered before this decision can be made, and what investigation would answer it. Vague deferrals ("not enough evidence") are not accepted. The `provisional` type must specify what evidence would upgrade it to `decided` or downgrade it to `deferred`. Decision readiness criteria should be stated in DESIGN.md before execution, not assigned post-hoc.

**Phase warning:** The phase revising the DECISION.md template.

---

### Pitfall M6: Patch Sensor Misrepresented as Solving Cross-Project Distribution

**What goes wrong:** The patch sensor is built and successfully detects when the installed `.claude/` files diverge from npm source. But the original R3 failure mode — a fix in GSDR that never reached non-GSDR projects using global GSD, and never reached `.codex/` on the other machine — is not addressed because the patch sensor only operates within the current project.

**Why it happens:** The scope of "patch detection" is naturally scoped to the current project's files. Cross-project distribution is a different problem.

**Consequences:** The R3 class of failures (cross-project distribution gap, cross-machine staleness) continues even after the patch sensor ships. The sensor is shipped but the problem it appears to solve continues to occur. Users and the ROADMAP attribute the gap as closed when it is not.

**Prevention:** The patch sensor scope must be explicitly documented: what it catches (in-project source-vs-installed divergence, cross-runtime parity within one project) and what it does not catch (cross-project distribution, cross-machine staleness). The cross-project distribution gap is a v1.21 concern per MILESTONE-CONTEXT.md scope.

**Phase warning:** The phase implementing the patch sensor.

---

### Pitfall M7: Backward Propagation Added as a Process Instruction, Not a Mechanism

**What goes wrong:** Cross-spike backward propagation — when Spike N qualifies Spike M's findings, updating Spike M's KB entry — is implemented as a process instruction in the spike runner prompt: "After finding qualifying earlier work, write a qualification note." No structural mechanism enforces it. Pattern 4 (self-awareness without enforcement) applies: the runner knows it should propagate but does so inconsistently under completion pressure.

**Why it happens:** Writing a process instruction is far faster than building a mechanism. The instruction looks correct in review.

**Consequences:** Spike KB entries accumulate stale findings. A project consulting spike 001's conclusions does not know spike 003 qualified them. The cross-spike qualification report that arxiv-sanity-mcp produced manually — 2 retracted claims, 7 qualified claims — represents exactly the labor that the framework should eliminate but will continue to require.

**Prevention:** The spike runner must check, at synthesis time, whether any finding in the current spike touches claims made in prior spikes for the same project. If yes, a qualification record is a required artifact, not optional. The KB entry schema must have a `qualified_by` field that the runner populates. The runner does not proceed past synthesis without it.

**Phase warning:** The phase implementing spike KB entries and cross-spike qualification.

---

## Minor Pitfalls

### Pitfall N1: `kb.db` Committed to Git

**What goes wrong:** The SQLite index file (`kb.db`) is committed to git, either because `.gitignore` entry is added after the file is already tracked, or because `git add -A` captures it in a large commit.

**Prevention:** Add `kb.db`, `kb.db-shm`, and `kb.db-wal` to `.gitignore` immediately when the file is created. Add a CI check that asserts no `.db` files are tracked.

**Phase warning:** The phase implementing `gsd-tools kb rebuild`.

---

### Pitfall N2: Telemetry Baseline Computed on Wrong Project Scope

**What goes wrong:** `telemetry baseline` aggregates all sessions in `~/.claude/usage-data/session-meta/` without filtering by project path, mixing sessions from philograph-mcp, scholardoc, semantic-calibre, and get-shit-done-reflect into a single distribution that represents none of them accurately.

**Why it happens:** The `project_path` filtering requires `resolveWorktreeRoot()` on each session's `project_path` field. If this normalization is skipped, exact string match misses worktree paths.

**Prevention:** The `--project` flag must be implemented and used. `resolveWorktreeRoot()` must be applied to normalize worktree paths to main project roots. The baseline output must report how many sessions matched vs were filtered.

**Phase warning:** The phase implementing `telemetry baseline`.

---

### Pitfall N3: WebFetch Null Mapping Silently Breaks Codex Research Agents

**What goes wrong:** The installer maps `WebFetch -> null` for Codex (drops the tool reference silently). Agent specs that use WebFetch for documentation lookups will have that instruction dropped from Codex versions without warning.

**Prevention:** During Codex install, log a warning for each `WebFetch` reference dropped. Agents that need web access on Codex should use MCP-based web tools or `curl` via `exec_command`. Audit v1.20 agent specs specifically for WebFetch references before shipping.

**Phase warning:** The phase authoring cross-runtime agent specs.

---

### Pitfall N4: Auxiliary Hypothesis Register Filled by Rote

**What goes wrong:** The DESIGN.md auxiliary hypothesis register is filled with generic entries ("sample is representative," "metric measures intended concept") copied from a template, not the specific auxiliaries of the current design. The Duhem-Quine insight is respected in form but not in substance.

**Prevention:** The register should be short (3-5 entries maximum), each entry naming a *specific* auxiliary for *this* spike. Generic entries should be flagged by the design reviewer as insufficient.

**Phase warning:** The phase implementing the DESIGN.md template revision.

---

### Pitfall N5: Signal `source` Field Ambiguity Baked Into SQLite Schema

**What goes wrong:** The signal schema has a `source` field that means "detection method" (auto/manual) in one section of `signal-detection.md` and "origin location" (local/external) in another. When the SQLite schema is built from the current schema without resolving this, the single `source` column encodes an ambiguous value that cannot be queried reliably.

**Prevention:** Resolve the ambiguity before SQLite schema is finalized: `detection_method: auto|manual` and `origin: local|external` as distinct columns. Both values can be defaulted from existing `source` field values during migration.

**Phase warning:** The phase finalizing the SQLite schema.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| SQLite KB index | C1: SQLite treated as source of truth | Atomic dual-write: `.md` + SQL in same operation; `kb.db` in gitignore |
| Signal lifecycle wiring | C2: Wiring silently does nothing | End-to-end integration test before shipping |
| Telemetry baselines | C3: Unreliable token counts used | Validate session-meta vs JSONL for same sessions before baseline computation |
| Hook-based structural gates | C4: Silent degradation on Codex | Specify degradation path before writing hook implementation |
| Spike design reviewer agent | C5: Reviewer becomes checklist | Cross-model review mandatory; critique document not pass/fail verdict |
| Cross-model review command | C6: Over-formalization drops usage | Opt-in, flexible, no mandatory protocol structure |
| Parallel worktree execution | M1: Locking misapplied to wrong problem | Per-worktree state files, not STATE.md locking |
| Signal schema additions | M2: Old signal reads break | Test rebuild on old signals; handle missing fields as defaults |
| Facets-based quality metrics | M3: AI labels treated as ground truth | Label all facets outputs as estimates; validate against behavioral proxies |
| Spike programme infrastructure | M4: Simple spikes burdened | Programme is opt-in scaffolding; per-spike workflow unchanged |
| DECISION.md template revision | M5: Deferred replaces decided as new closure | Deferred must specify what question and what investigation, not vague |
| Patch sensor | M6: Sensor marketed as solving cross-project gap | Document scope explicitly; R3-class failures are v1.21 |
| Cross-spike qualification | M7: Qualification as process, not mechanism | Required artifact at synthesis time; `qualified_by` field in KB schema |
| KB SQLite schema | N5: `source` field ambiguity baked in | Resolve to `detection_method` + `origin` before schema finalization |

---

## The Over-Formalization Tension

The audit's central finding is that every failed intervention used advisory text, not structural enforcement. This creates pressure toward maximum structural enforcement across all v1.20 features. The research reveals a competing constraint: over-formalization of productive informal practices kills them.

The resolution is not "some structure is good, more is better" nor "keep everything informal." It is a three-tier model derived from the spike epistemology research (Feyerabend's institutional critique):

**Enforce structurally** where absence produces systematic errors that agents cannot self-correct — cross-model review independence (F02: self-evaluation degenerates under shared noise), lifecycle wiring integration tests, dual-write invariant for KB, design reviewer invocation. These are the places where advisory text has historically failed and where the failure is silent.

**Encourage culturally** where contextual judgment is required and rigid application produces compliance without insight — severity assessment in spikes, progressiveness assessment of spike programmes, qualitative review of quantitative findings, Bayesian updating of verdicts. Making these structural produces gaming or compliance theater.

**Warn with override** where the cure might be worse than the disease — single-metric reliance, circular evaluation detection, premature closure flags. Flag these as anti-patterns, allow the developer to override with documented justification. The deviation testimony pattern already in the codebase (`feedback_deviation_testimony.md`) is the correct model: deviation is allowed but must leave a trace that feeds back into methodology improvement.

Pitfalls C5 (reviewer as checklist) and C6 (cross-model review over-formalization) are the two specific places where the pressure to enforce structurally must be resisted. Both concern practices whose value comes from genuine independence and context-responsiveness, not from protocol compliance.

---

## Sources

**Codebase evidence (HIGH confidence):**
- `.planning/MILESTONE-CONTEXT.md` — working assumptions, derived constraints, open questions
- `.planning/audits/session-log-audit-2026-04-07/SESSION-HANDOFF.md` — audit findings, key patterns
- `.planning/audits/session-log-audit-2026-04-07/reports/verification-analysis.md` — 13 RECURRED findings, advisory-text failure analysis
- `.planning/knowledge/signals/get-shit-done-reflect/2026-02-11-kb-data-loss-migration-gap.md` — KB data loss precedent
- `.planning/knowledge/signals/get-shit-done-reflect/sig-2026-03-04-signal-lifecycle-representation-gap.md` — 0% remediation tracking

**Custom research documents (HIGH confidence — grounded in codebase evidence):**
- `.planning/research/kb-architecture-research.md` — SQLite integration risks, schema migration strategy
- `.planning/research/measurement-infrastructure-research.md` — token reliability concern, STATE.md conflict approaches
- `.planning/research/cross-runtime-parity-research.md` — hook-dependent feature degradation, Codex capability matrix
- `.planning/research/spike-methodology-gap-analysis.md` — 5 failure patterns, 11 gaps from arxiv-sanity-mcp corpus
- `.planning/research/spike-epistemology-research.md` — three-tier enforcement model, over-formalization tension

**Epistemic-agency repo findings (MEDIUM-HIGH confidence):**
- F02: Self-evaluation degenerates under shared noise — validates cross-model review as structural necessity
- F34: Specialist sub-agents prevent feedback corruption — validates reviewer independence
- F36: Evaluation infrastructure needs its own testing — validates auxiliary register
- F46: MAPE blind spot — design failures not caught by execution-deviation monitoring
- I09: Variety amplification architecturally necessary — human epistemic challenge not replaceable by more agents
