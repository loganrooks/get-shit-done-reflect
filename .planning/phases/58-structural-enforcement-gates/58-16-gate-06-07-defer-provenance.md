---
phase: 58-structural-enforcement-gates
plan: 16
artifact_type: defer_provenance
gates: [GATE-06, GATE-07]
defer_target_phase: "Phase 57.9"
defer_verified_at: "2026-04-20T12:53:32Z"
prerequisite_status: "not_started"
---

# GATE-06 / GATE-07 Defer-Provenance Artifact (GATE-09c)

> **Scope.** This artifact records the explicit deferral of GATE-06 (automation postlude fire-event) and GATE-07 (session-level incident self-signal) to post-Phase-57.9. It is the AT-1 Option B witness and carries two ready-to-consume ledger entries for Plan 20's phase ledger per GATE-09a schema.
>
> **Authority.** `58-CONTEXT.md` DC-6 (Phase 58 does not duplicate 57.9 work) + AT-1 (prerequisite sequencing acknowledged) + AT-5 (reflexive GATE-09 applied to Phase 58's own `[projected]` CONTEXT claims) + `58-05-codex-behavior-matrix.md` Section 5 Risk 2.
>
> **Non-delivery is the delivery.** No substrate code is shipped under GATE-06 / GATE-07 in Phase 58. The defer itself is the legible artifact — GATE-09c discipline applied reflexively.

---

## Section 1 — Status verification (AT-1 witness)

### Commands run at artifact authoring time

```bash
ls -d .planning/phases/57.9-*/ 2>/dev/null
# (no output — exit status 2)

ls .planning/phases/57.9-*/*-PLAN.md 2>/dev/null
# (no output — exit status 2)
```

### Interpretation

Both commands returned empty output. The Phase 57.9 phase directory does **not** exist at `.planning/phases/57.9-*/`, and no Phase 57.9 plans exist at `.planning/phases/57.9-*/*-PLAN.md`. Phase 57.9 has `prerequisite_status: not_started` at Phase 58 execution time.

This matches the expectation recorded in `58-05-codex-behavior-matrix.md` Section 5 Risk 2 ("GATE-06 / GATE-07 Codex degradation expected at Phase 58 execution time"): Phase 57.9 is the prerequisite that delivers Claude Code installer-wired `SessionStop`, the Codex hook surface under `codex_hooks`, and the session-level canonical markers (`postlude-fired`, `error-rate`, `direction-change`, `destructive-event`) that Phase 58 Wave 4 consumer plans would register extractors against.

### Authority citations

- `58-CONTEXT.md` DC-6 — "Phase 58 does not duplicate 57.9 work. Consumer plans register extractors against delivered markers; do not re-ship hook surfaces."
- `.planning/ROADMAP.md:141-150` — Phase 57.9 entry:
  > **Goal:** The installer and runtime substrate provide the closeout / incident hook surfaces that Phase 58 depends on … This narrow prerequisite wires SessionStop / closeout hooks for Claude Code, integrates the available Codex hook surface when supported, and exposes the session-level closeout / incident markers needed by GATE-06 and GATE-07.
  > **Depends on:** Phase 57.8 … **Requirements:** HOOK-01, HOOK-02, HOOK-03 … **Plans**: TBD
- `58-CONTEXT.md` AT-1 — "Prerequisite sequencing acknowledged: Phase 57.9 is complete OR GATE-06/07 are explicitly deferred with GATE-09c provenance."

### AT-1 branch selection

Because 57.9 is `not_started`, AT-1 **Option B** (explicit defer) is the only legible path. Option A (57.9 complete, consume as Wave 4 plans) is unavailable. This artifact is the Option B witness.

### Re-verification at execute time

If 57.9 ships between plan-phase and Phase 58 Wave 4 execute-phase (unlikely given wave sequencing), this plan's Task 1 instructions direct the executor to STOP and re-plan GATE-06/07 as consumer plans per AT-1 Option A, recording the new status in `58-16-SUMMARY.md`. At this artifact's authoring time, the status remains `not_started`.

---

## Section 2 — Per-gate Codex behavior declaration

Per `58-05-codex-behavior-matrix.md` §GATE-06 and §GATE-07, the Codex behavior is a conditional-degradation construction that survives the two expected states of the `codex_hooks` feature flag.

### GATE-06 — Automation postlude session-end fire-event

| Field | Value |
|---|---|
| `claude_code_behavior` | `applies-via-installer` |
| `codex_behavior` | `applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason` |
| `depends_on_phase_57_9` | `true` |
| `substrate_citation` | `58-05-codex-behavior-matrix.md §GATE-06` (rows 181-188); `ROADMAP.md:141-150`; `bin/install.js:2846-2856`; `.planning/research/cross-runtime-parity-research.md:70-80` |

**Declaration.** On Claude Code, GATE-06 applies via installer-wired `SessionStop` (Phase 57.9 delivery). On Codex, GATE-06 applies via installer-wired `<repo>/.codex/hooks.json` with `SessionStop` entry when `codex_hooks=true` (Phase 57.9 delivery); when `codex_hooks=false` or the flag is unavailable, GATE-06 `does-not-apply-with-reason` with `target_phase: "Phase 57.9 (flag enablement) or Phase 60.1 (workflow-step fallback)"`. Both states are Phase 57.9 scope, not Phase 58 scope.

### GATE-07 — Session-level incident self-signal

| Field | Value |
|---|---|
| `claude_code_behavior` | `applies-via-installer` |
| `codex_behavior` | `applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason` |
| `depends_on_phase_57_9` | `true` |
| `substrate_citation` | `58-05-codex-behavior-matrix.md §GATE-07` (rows 193-200); `ROADMAP.md:141-150` (Phase 57.9 markers); R4 §Required-prerequisites-from-57.9 table; `<deferred>` ("Log-sensor live incident-detection wiring for GATE-07 — Phase 60 + 60.1") |

**Declaration.** Same conditional pattern as GATE-06: Phase 57.9 ships the `session-meta` fields (`error-rate`, `direction-change`, `destructive-event` structured records); Phase 58 would have registered extractors against those fields. In the degraded state, `target_phase: "Phase 57.9 (markers) + Phase 60.1 (log-sensor live wiring)"`. The dual-phase dependency is intentional: 57.9 ships the markers, 60.1 wires the log-sensor live incident-detection path.

### Matrix row integrity

Both GATE-06 and GATE-07 carry `depends_on_phase_57_9: true` in the matrix — the only two rows in the 25-row matrix with that property. This artifact's defer is the expected downstream consequence of those two rows at Phase 58 execution time.

---

## Section 3 — Ready-to-consume ledger entries (for Plan 20)

These YAML blocks are the authoritative ledger entries Plan 20 copies into `58-LEDGER.md` verbatim. Both validate green against the `ledger` schema registered in `get-shit-done/bin/lib/frontmatter.cjs` (Plan 04 delivery, commit `b27c1882`).

### Entry 1 — GATE-06 defer

```yaml
- context_claim: "GATE-06 automation postlude fires structurally via installed hook substrate"
  disposition: explicitly_deferred
  load_bearing: true
  target_phase_if_deferred: "Phase 57.9"
  narrowing_provenance:
    narrowing_decision: "Phase 58 does not implement GATE-06 substrate; consumes HOOK-01/02/03 output from Phase 57.9"
    originating_claim: "CONTEXT §5 [projected:reasoned] Phase 57.9 delivers installer-wired SessionStop + Codex hook surface + session-level markers"
    rationale: "DC-6 forbids Phase 58 from duplicating 57.9 work; 57.9 phase directory does not exist at Phase 58 planning time (AT-1 Option B); honest structural enforcement requires the substrate that 57.9 owns. Codex degradation path declared per Plan 05 matrix: applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason."
  role_split_provenance:
    written_by: planner
    written_at: "2026-04-20T12:53:32Z"
    session_id: "planning-session-58-16"
```

### Entry 2 — GATE-07 defer

```yaml
- context_claim: "GATE-07 session-level incident self-signal fires via installed substrate and consumed markers"
  disposition: explicitly_deferred
  load_bearing: true
  target_phase_if_deferred: "Phase 57.9"
  narrowing_provenance:
    narrowing_decision: "Phase 58 does not implement GATE-07 substrate; consumes HOOK-01/02/03 markers from Phase 57.9 and downstream Phase 60.1 log-sensor live wiring for incident-detection"
    originating_claim: "CONTEXT §5 [projected:reasoned] Phase 57.9 delivers session-level canonical markers (error-rate / direction-change / destructive-event) consumable by Phase 57.5 extractors"
    rationale: "DC-6 forbids Phase 58 from duplicating 57.9 work; 57.9 phase directory does not exist at Phase 58 planning time (AT-1 Option B); the incident-signal chain requires dual prerequisites — 57.9 ships the markers and 60.1 wires the log-sensor live path per the <deferred> section. Codex degradation path declared per Plan 05 matrix: applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason."
  role_split_provenance:
    written_by: planner
    written_at: "2026-04-20T12:53:32Z"
    session_id: "planning-session-58-16"
```

### Schema compliance note

Both entries use `disposition: explicitly_deferred` per `58-05-codex-behavior-matrix.md` Section 6 ("Codex waivers are **always** `explicitly_deferred`, never `rejected_with_reason`. Rejection would mean the gate's Codex behavior is permanently unachievable; deferral means the substrate is not yet delivered but is tracked"). Both entries satisfy the conditional-required fields for `explicitly_deferred`: `target_phase_if_deferred: "Phase 57.9"` matches the authoritative pattern `^Phase \d+(\.\d+)?$` in the ledger validator.

Both entries carry `load_bearing: true` because the originating claim is a `[projected:reasoned]` cross-phase projection (clause 5 of the Plan 04 load-bearing rule: "Its type is `[projected]` AND it cross-references another phase").

---

## Section 4 — Re-entry conditions (when the defer can be un-deferred)

GATE-06 and GATE-07 can exit deferred state and be implemented as consumer plans in a post-57.9 continuation phase (Phase 58.x or a renamed successor phase named by Plan 20) when **all** of the following conditions hold:

1. **Phase 57.9 phase directory exists with plans.** `.planning/phases/57.9-*/` is populated with at least one `NN-PLAN.md` at `ready_to_execute` or `complete` status.

2. **HOOK-01 verified in Phase 57.9 VERIFICATION.md.** The Claude Code `SessionStop` / closeout hook surface lands in the installed runtime, as proven by tests in `bin/install.js` `--local` mode with explicit test assertions on `.claude/settings.json` entries.

3. **HOOK-02 verified in Phase 57.9 VERIFICATION.md.** The installer either writes the Codex hook surface (when `codex_hooks=true`) or records an explicit degradation / waiver path in `.planning/config.json` (when flag unavailable). The degradation path must be a named `codex_hooks_waived: true` marker (not a silent skip).

4. **HOOK-03 verified in Phase 57.9 VERIFICATION.md.** The session-meta closeout / incident hook surface exposes canonical markers or counters for "postlude fired" and the incident conditions Phase 58 needs (`error-rate`, `direction-change`, `destructive-event`) OR explicit `not_available` tags (not silent absence).

5. **`bin/install.js` writes `SessionStop` entry to `.claude/settings.json` on install.** Verifiable by running `bin/install.js --local` into a scratch directory and asserting the written settings.json contains the SessionStop hook config.

6. **Codex hook surface either written under `codex_hooks=true` OR `.planning/config.json` has `codex_hooks_waived: true` marker.** This is the resolution of GATE-06 / GATE-07 Codex behavior: either the hooks land or the waiver is explicit, but never silent.

When all six conditions hold, Plan 20 of a post-57.9 continuation phase MAY retire these two ledger entries by writing new entries with `disposition: implemented_this_phase` + `evidence_paths` pointing to the Phase 57.9 VERIFICATION.md and the consumer-plan SUMMARY.md where the extractors are registered. Until then, the entries stay `explicitly_deferred`.

### Non-substitutable conditions

The six conditions above are conjunctive. None can be substituted for another:

- HOOK-01 does not imply HOOK-02 (Claude Code hooks do not guarantee Codex hooks).
- HOOK-02 does not imply HOOK-03 (Codex surface can exist without session-meta markers).
- Installer changes (condition 5) do not imply marker emission (condition 3).

The Plan 17 verifier that reads this artifact in Phase 58's own closeout will NOT treat any partial fulfillment as a re-entry trigger; the full conjunction is required.

---

## Section 5 — Chain-integrity note

### What this plan modifies

This plan creates exactly one file: `58-16-gate-06-07-defer-provenance.md` (this artifact). No other source file, workflow, agent spec, installer path, or configuration is modified.

### What this plan does not modify

- No workflow markdown files in `get-shit-done/workflows/` or `get-shit-done/commands/`.
- No agent specs in `agents/` or `.codex/prompts/`.
- No installer code in `bin/install.js`.
- No CI configuration in `.github/workflows/ci.yml`.
- No `session-meta/*` extractor registration (that is the consumer plan's job, post-57.9).
- No `.claude/settings.json` or `<repo>/.codex/hooks.json` write.

### Why chain integrity matters here

A common failure mode — explicitly named in `58-CONTEXT.md` G-3 (reflexive GATE-09) — is shipping "GATE-06 done" via a prose workflow edit that does nothing structurally. This plan rejects that pattern: the defer is the scope, and the artifact says so unambiguously. Plan 17's verifier reads this artifact + the Phase 58 ledger to confirm the defer is legible, and Plan 20 consumes the two entries above when writing `58-LEDGER.md`.

### Downstream consumers

- **Plan 17 (GATE-09d verifier).** Reads this artifact and validates the two ledger entries against the `ledger` schema. Confirms `defer_target_phase: "Phase 57.9"` in the frontmatter. Fails if the artifact is missing or the entries disappear silently.
- **Plan 20 (own-phase ledger).** Copies both entries verbatim into `58-LEDGER.md`. Does not re-derive or re-author the ledger entries — this artifact is canonical.

### G-3 reflexive GATE-09 compliance

Phase 58's CONTEXT §5 claim "GATE-06/07 depend on 57.9 substrate" was a `[projected:reasoned]` cross-phase projection. Under AT-5, such claims must either be resolved in-phase or deferred with named provenance. This artifact resolves the projection via the deferral path, making the non-delivery legible rather than silent.

---

## Section 6 — Philosophical note

The GATE-09 family exists because prose-only scope-translation notes fragment across summaries, verification notes, and ROADMAP edits — the verifier cannot cheaply check whether every load-bearing claim has a disposition, nor can the KB aggregate disposition trends across phases. GATE-09c is the specific discipline that makes narrowing decisions legible: every time a phase narrows upstream scope or defers a `[projected]` commitment, the narrowing must be recorded with named provenance pointing back to the originating CONTEXT claim.

Applied reflexively to Phase 58's own CONTEXT, GATE-09c says: if Phase 58 cannot ship GATE-06/07 because 57.9 has not shipped, Phase 58 must say so explicitly, not silently drop the gates from the fire-event inventory. This plan is that explicit statement.

The alternative — shipping "GATE-06 done" as a workflow-edit that adds a SessionStop marker without the installer-wired hook substrate — would manufacture false completion. Plan 17's GATE-09d verifier would eventually catch the forgery (no fire-event in the measurement corpus), but the remediation cost would be substantially higher than the defer cost. Authentic deferral at Phase 58 planning time is cheaper and more honest than manufactured completion followed by remediation.

This is the GATE-09c discipline internalized: the narrowing-provenance entry is not paperwork, it is the truth-preserving move that keeps the ledger's disposition vocabulary meaningful.
