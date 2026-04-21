---
phase: 59
gate: GATE-09
disposition: explicitly_deferred
target_milestone_range: "v1.20 -> v1.22+"
authored_by: planner
authored_at: "2026-04-21T05:00:00Z"
scope:
  covers_requirements: [KB-12, KB-13, KB-14, KB-15, KB-16, KB-17]
  in_scope_for_this_phase: [KB-04b, KB-04c, KB-04d, KB-06a, KB-06b, KB-07, KB-08]
audit_anchor: ".planning/audits/2026-04-20-phase-59-kb-architecture-gap-audit/phase-59-kb-architecture-gap-audit-output.md §7.2"
research_anchor: ".planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-RESEARCH.md D-10"
roadmap_anchor: "ROADMAP Phase 59 Success Criterion SC-7"
---

# Phase 59 Deferrals — KB Architecture Extensions (KB-12..KB-17)

This file enumerates the six KB-architecture extensions that Phase 59 **explicitly defers** to later phases or milestones. It is the ledger-consumable input for the GATE-09 scope-translation ledger: each row names the deferral, whether it is load-bearing for v1.20 correctness, the tentative downstream target phase, and the rationale.

Phase 59 SC-7 ("explicit deferrals, not disappear-by-omission") is satisfied exactly when every one of these deferrals is listed here and cross-referenced from `.planning/REQUIREMENTS.md` KB-12..KB-17.

## Deferrals Table

| ID | Deferral | Load-bearing? | Downstream phase (tentative) | Rationale |
|---|---|---|---|---|
| KB-12 | Edge-as-entity model (audit §3.2 Option 2) — edges become first-class KB entries with source_kind, target_kind, link_subtype, rationale, confidence, author/at provenance, and their own lifecycle; current `signal_links` becomes a derived projection | Yes | Phase 62 or v1.21 | Too large to fit Phase 59; principled fix for target-blindness, edge provenance, and heterogeneity. Option 1 (this phase, edge-provenance minimum on `signal_links.created_at` + `signal_links.source_content_hash`) gives the operational unblock while the question is unresolved. The full edge-as-entity migration requires a schema v4 bump, a new `.planning/knowledge/edges/` directory layout, and a cross-type edge vocabulary — none of which are in scope for v1.20 closure. |
| KB-13 | Retrieval attribution — KB entries record programmatic retrieval events (`retrieval_count`, `last_retrieved`, or equivalent) from a `kb surfaced` path rather than agent self-report; future telemetry integration can join retrieval events to plan/phase outcomes | Yes | Phase 60.1 or later | Depends on measurement infrastructure still stabilizing (Phase 57.7 MEAS-DERIVED discussions, Phase 60.1 telemetry-signal integration). Writing retrieval attribution now would couple the KB read surface to a telemetry substrate that is not yet committed. Defers cleanly behind Phase 60.1. |
| KB-14 | Non-signal artifact indexing — deliberations, audits, and reflections are indexed as first-class KB entries with cross-type edges rather than remaining grep-only peers outside the SQLite surface | Yes | v1.21 | Ontology question: the "claim-type ontology" deliberation (deferred) must land first to define what kinds of claims each artifact type carries, how they link, and whether reflections' principles are first-class or derived from signals. Without that ontology, indexing deliberations/audits creates an ad-hoc schema that will churn. Defers to after the ontology deliberation completes. |
| KB-15 | Federation substrate — schema and CLI preserve room for cross-project / cross-machine knowledge sharing by distinguishing local vs imported origin and carrying KB origin metadata in the storage layer (`origin_kb` column, MCP server wrap, etc.) | No | v1.22+ | Out of v1.20 scope. Existing research already rejected an MCP-first federation path for v1.20 in favor of CLI-first validation. Federation is a growth-thesis concern (see `project_federated_signal_vision` memory entry) that intersects with the wider harness roadmap, not with closing the Phase 59 scope. Deferral has no downstream unblocks inside v1.20. |
| KB-16 | Edge vocabulary extension — current four-type vocabulary (`qualified_by`, `superseded_by`, `related_signals`, `recurrence_of`) grows into richer relation kinds / qualifiers (`corroborates`, `refines`, `contradicts`, `replaces`, `improves-framing`) with explicit shallow-vs-transitive traversal rules | No | Deferred indefinitely | Names audit §5.2 / §5.3 gaps. Not load-bearing for v1.20 — the current four-type vocabulary suffices for the immediate surfacing problem (inbound-edge fetch per §2.1 step 2c, qualification/superseding surfaced on read). Extension is valuable when the corpus grows to the point where coarse edge types conflate meaningfully different relations; we are not there yet. |
| KB-17 | Contested / under-review signal lifecycle state — the KB can represent challenged signals before they are remediated or invalidated, either as an explicit lifecycle state (`contested`) or via the KB-12 edge-as-entity model with a `contested_by` edge | No | Deferred indefinitely | Audit §4.2 raised this as a gap. Not load-bearing for v1.20 — current `lifecycle_state` values + `triage.decision: investigate` cover the same operational need via a decision annotation rather than a state. If KB-12 ships (edge-as-entity), this is subsumed as a `contested_by` edge. If KB-12 does not ship, adding a seventh lifecycle state is lower-cost than a new schema bump but requires a transition table update; still not a v1.20 priority. |

## Cross-references

- **Audit:** `.planning/audits/2026-04-20-phase-59-kb-architecture-gap-audit/phase-59-kb-architecture-gap-audit-output.md §7.2` names each of KB-12..KB-17 and is the upstream source for this deferral set. The audit's "Recommendation 7.2" block is the authoritative phrasing each row condenses.
- **Research:** `.planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-RESEARCH.md D-10` decides the "operational unblock now, principled fix later" stance that motivates listing these here rather than attempting them this phase.
- **Roadmap:** `.planning/ROADMAP.md` Phase 59 Success Criterion SC-7 ("explicit deferrals; do not disappear by omission") is satisfied exactly by this file plus the cross-reference footer in `.planning/REQUIREMENTS.md`.
- **Requirements:** `.planning/REQUIREMENTS.md` rows KB-12..KB-17 (lines 87-98) each cite the audit as Motivation; this file is the ledger-consumable companion that the GATE-09 workflow consumes directly.
- **Upstream ledger:** The Phase 58 GATE-09 scope-translation ledger pattern established the table shape used here (ID / Deferral / Load-bearing / Target / Rationale). The `authored_by: planner` and `disposition: explicitly_deferred` frontmatter fields match the Phase 58 ledger consumer's expectations.

## Phase 59 in-scope requirements (for contrast)

The requirements below were IN scope for Phase 59 and are being closed this phase:

| ID | Closed in | Notes |
|---|---|---|
| KB-04b | Plan 02 | FTS5 external-content rewrite + `kb search` verb |
| KB-04c | Plan 02 | `kb link show --inbound/--outbound` read surface, idx_signal_links_target usage |
| KB-04d | Plan 01 | `kb rebuild` edge-integrity report + `kb repair --malformed-targets` verb |
| KB-06a | Plans 02+03 | Read verbs + `kb health` four-check watchdog |
| KB-06b | Plan 04 | Verb-disambiguated write surface (`kb transition`, `kb link create/delete`) with BEGIN IMMEDIATE dual-write |
| KB-07 | Plan 04 | `collect-signals` workflow reconcile_signal_lifecycle step wires `kb transition` to `resolves_signals`; bash reconcile-signal-lifecycle.sh deprecated |
| KB-08 | Plan 05 | knowledge-surfacing.md §§1, 2, 2.1, 2.2, 7, 8 rewritten for SQLite-first triad with grep fallback |

This separation (in-scope closed vs deferred) is the exact shape the GATE-09 ledger needs to record Phase 59's scope boundary.

## Notes on the "load-bearing" column

- **Yes (KB-12, KB-13, KB-14):** These deferrals materially constrain v1.20+ correctness in ways the operational unblocks cannot fully paper over. KB-12 is the principled fix for edge heterogeneity; KB-13 is the telemetry-join precondition for attributing retrieval to outcomes; KB-14 is required before deliberations/audits become first-class citizens of the KB.
- **No (KB-15, KB-16, KB-17):** These deferrals are valuable but not blocking. The existing surface remains correct without them; they add capability rather than fix gaps.

## Review status

- **2026-04-21 (Phase 59 Plan 05 authoring):** Initial enumeration — this file.
- **Pending:** GATE-09 scope-translation ledger consumes this as an input; downstream phase planners (Phase 60+) will reference the target-phase column when scoping their own work. No standalone review gate is planned; the ledger is the review surface.
