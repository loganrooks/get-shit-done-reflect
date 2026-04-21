---
phase: 58-structural-enforcement-gates
plan: 05
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: 2026-04-20T12:42:00Z
  session_id: not_available
  provenance_status:
    role: derived
    harness: exposed
    platform: exposed
    vendor: exposed
    model: exposed
    reasoning_effort: not_available
    profile: exposed
    gsd_version: exposed
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: runtime_context
    vendor: runtime_context
    model: resolveModelInternal
    reasoning_effort: not_available
    profile: config
    gsd_version: config
    generated_at: writer_clock
    session_id: not_available
context_used_pct: 35
subsystem: planning-governance
tags:
  - codex-behavior-matrix
  - AT-3-compliance
  - cross-runtime-parity
  - gate-declarations
  - phase-58
requires:
  - phase: 58-structural-enforcement-gates (research)
    provides: "Per-gate Codex behavior table skeleton (58-RESEARCH.md §992-1015) and substrate references (cross-runtime-parity-research.md:70-80)"
  - phase: 57.8-signal-provenance
    provides: "role-split provenance (about_work / detected_by / written_by) consumed by ledger entry format in Section 6"
provides:
  - "Authoritative per-gate Codex behavior matrix (25 rows: GATE-01..15 + XRT-01)"
  - "Ledger entry format for Codex waivers (GATE-06 / GATE-07 degradation path template)"
  - "Downstream plan citation guidance (Section 7)"
  - "Single source of truth for AT-3 compliance across Wave 2 / 3 / 4 plans"
affects:
  - 58-06 through 58-20 (every Wave 2 / 3 / 4 plan cites this matrix)
  - 58-17 (verifier asserts existence + completeness + citation conformance)
  - Phase 57.9 (named as prerequisite for GATE-06 / GATE-07 Codex behavior)
  - Phase 60.1 (named as target for log-sensor live wiring risk)
tech-stack:
  added: []
  patterns:
    - "per-gate Codex behavior declaration (4-value enum: applies / applies-via-workflow-step / applies-via-installer / does-not-apply-with-reason)"
    - "runtime-neutral substrate citation (CI grep, filesystem append, branch protection, CLI subcommand, workflow markdown, agent files, installer-wired hooks)"
    - "conditional-degradation rows (codex_behavior: 'applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason')"
    - "phase-57.9-prerequisite column (depends_on_phase_57_9: boolean) for explicit dependency surfacing"
key-files:
  created:
    - ".planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md"
  modified: []
key-decisions:
  - "Adopted the 58-RESEARCH.md skeleton values for all 25 rows with finalized rationale / substrate citation per row — no value overrides from skeleton."
  - "GATE-06 and GATE-07 Codex behavior encoded as conditional-degradation ('applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason') rather than a single value, preserving both the shipped-57.9 and not-yet-shipped execution paths without requiring a Wave 4 matrix-rewrite if 57.9 lands mid-phase."
  - "Codex-specific open risks (signal-detection.md:67-76 stale heuristic; codex_hooks flag stability) surfaced as Section 5 but NOT row-degrading — they affect downstream measurement interpretation, not gate firing."
  - "Ledger entry format in Section 6 uses disposition: explicitly_deferred (never rejected_with_reason) for Codex waivers — every Codex gap has a named downstream resolution phase per Phase 58's scope promise."
  - "Matrix is NOT a live runtime capability probe; its fire-event is existence + completeness, verified by Plan 17 at phase close."
  - "Downstream plans required to cite by file path and section heading; re-derivation or override without matrix patch is rejected per Section 7."
patterns-established:
  - "Per-gate Codex behavior declaration: every gate carries an explicit 4-value marker; blanket 'Codex has no hooks' framing is structurally rejected (DC-4 / G-4 compliance)."
  - "Conditional-degradation row encoding: 'applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason' surfaces both execution paths without forcing an early choice."
  - "Ledger-entry waiver template: disposition + target_phase_if_deferred + narrowing_provenance + role_split_provenance, consumed by Plan 20 own-phase ledger and Plan 16 GATE-06/07 deferral."
duration: 5min
completed: 2026-04-20
---

# Phase 58 Plan 05: Per-Gate Codex Behavior Matrix (AT-3) Summary

**Authored `58-05-codex-behavior-matrix.md` as the authoritative AT-3 compliance artifact — 25 rows (GATE-01..15 + XRT-01) with explicit per-gate Codex behavior declarations, substrate citations, and conditional-degradation paths for hook-dependent gates.**

## Performance

- **Duration:** 5min
- **Tasks:** 1/1 completed
- **Files created:** 1
- **Files modified:** 0

## Accomplishments

- Delivered the single authoritative source for per-gate Codex behavior across Phase 58; downstream Wave 2 / Wave 3 / Wave 4 plans cite this file by path rather than re-deriving.
- Encoded all 25 requirements (GATE-01, 02, 03, 04a, 04b, 04c, 05, 06, 07, 08a, 08b, 08c, 08d, 08e, 09a, 09b, 09c, 09d, 10, 11, 12, 13, 14, 15, XRT-01) with the 4-value declaration enum, substrate citation, and `depends_on_phase_57_9` flag.
- Resolved the hook-dependent gates (GATE-06 / GATE-07) with conditional-degradation encoding that preserves both 57.9-shipped and 57.9-not-shipped execution paths.
- Authored the ledger-entry template (Section 6) for Codex waivers consumed by Plan 20 (own-phase ledger) and Plan 16 (if GATE-06/07 defer under AT-1 Option B).
- Surfaced four Codex-specific open risks (stale signal-detection heuristic, GATE-06/07 expected degradation, Codex auto-compact, codex_hooks flag stability) in Section 5 with explicit non-row-degrading framing.
- Declared this plan's own meta Codex behavior per plan `<objective>`: `applies` — matrix is a filesystem artifact, runtime-neutral.

## Task Commits

1. **Task 1: Author `58-05-codex-behavior-matrix.md` as the authoritative AT-3 artifact** — `129b92ed`

## Files Created/Modified

- **Created:** `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md` — 609 lines, 9 sections (Purpose and Authority; Methodology; Runtime Substrate References; The Matrix [25 rows + compact summary table]; Codex-Specific Open Risks; Ledger Entry Format for Codex Waivers; Downstream Plan Citation Guidance; Verification and Fire-Event; Meta — Per-Gate Codex Behavior for This Plan).

## Verification

All four plan `<verify>` criteria passed:

1. **Frontmatter valid YAML with `artifact_type: codex_behavior_matrix`** — confirmed via `head -10`.
2. **Section 4 has exactly 25 rows** matching GATE-01, 02, 03, 04a, 04b, 04c, 05, 06, 07, 08a, 08b, 08c, 08d, 08e, 09a, 09b, 09c, 09d, 10, 11, 12, 13, 14, 15, XRT-01 — confirmed via per-ID grep loop (no MISSING lines) and via `grep -c "^### GATE-\|^### XRT-01"` returning 25.
3. **No row uses blanket `N/A` or `Codex has no hooks` framing without substrate citation** — the four occurrences of the reject-framing phrases are all in Sections 1/2/8 where they are explicitly REJECTED (authority statement, non-compliance marker list, verifier assertion), never in row values.
4. **Every `applies-via-installer` row names Phase 57.9 as prerequisite** — confirmed for GATE-06 and GATE-07 rows; both carry `depends_on_phase_57_9: true` and rationale / substrate_citation referencing `ROADMAP.md:141-150` and `bin/install.js:2846-2856`.

Sanity-check grep command from plan executed clean — no `MISSING:` output.

## Decisions & Deviations

### Decisions made during authoring

- **Matrix value structure:** Used the 58-RESEARCH.md skeleton values verbatim for all 25 rows. The skeleton and this matrix converge on identical value assignments; this plan's work is to finalize rationale, substrate citations, and degradation-path encoding — not to re-evaluate which gates apply where.
- **Conditional-degradation encoding:** For GATE-06 and GATE-07, chose the inline `if codex_hooks=true else does-not-apply-with-reason` encoding in `codex_behavior` rather than two separate matrix rows or a single forced choice. Rationale: Phase 58 cannot predict at plan-05 authoring time whether Phase 57.9 will have shipped by Wave 4 execution; the conditional encoding survives either outcome and points at the ledger template in Section 6 for the deferred path.
- **Risk framing (Section 5):** The four open risks (signal-detection.md stale heuristic; GATE-06/07 expected degradation; Codex auto-compact; codex_hooks flag stability) are explicitly NOT row-degrading. They affect downstream measurement interpretation (Risk 1), authorial execution path (Risk 2 — handled via Section 6 template), GATE-13 motivating use case (Risk 3), or future API stability (Risk 4). Row values stay intact.
- **Section 6 disposition enum restriction:** Codex waivers are always `explicitly_deferred`, never `rejected_with_reason`. Rejection would imply the Codex path is permanently unachievable; every Phase 58 Codex gap has a named downstream resolution phase, so deferral is the correct disposition.

### Deviations from plan

None — plan executed exactly as written. Task 1's action prescribed the structure (frontmatter + 6 sections), verification criteria, and done condition; the authored artifact adds three additional sections (7 Downstream Plan Citation Guidance; 8 Verification and Fire-Event; 9 Meta — Per-Gate Codex Behavior for This Plan) as non-deviating extensions that directly serve the plan's stated purpose (downstream citation clarity, verifier-contract visibility, meta-reflexive Codex declaration per the plan's own `<objective>` meta-note).

No deviation rules 1–3 auto-fixes triggered. No architectural Rule-4 deviation required. No authentication gates encountered. No KB consultation needed (no auto-fix scenarios arose).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Downstream Wave 2 / Wave 3 / Wave 4 plans** can now author their per-gate Codex behavior declarations by citing `58-05-codex-behavior-matrix.md §GATE-XX` per Section 7 guidance. No plan is blocked on this deliverable.
- **Plan 16** (Wave 4, GATE-06/07 consumer registration or deferral) has the ledger-entry template (Section 6) ready for use if Phase 57.9 has not shipped at Wave 4 execution time.
- **Plan 17** (Wave 4 verifier) has the verification checklist (Section 8) and sanity-check grep command ready for the matrix existence + completeness + citation conformance assertions.
- **Plan 20** (Wave 5 own-phase ledger) has the waiver-entry format (Section 6) ready as the authoritative template for any Codex degradation entries in `58-LEDGER.md`.
- **AT-3 compliance** is now demonstrable via the existence of this artifact with all 25 rows; plan-phase entry condition AT-3 (per 58-CONTEXT.md:329) is satisfied.

## Self-Check: PASSED

Self-check verifies artifact claims by file/commit existence:

**Artifact existence:**
- FOUND: `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md` (609 lines, 25 rows + 8 supporting sections)

**Commit existence:**
- FOUND: `129b92ed` — `docs(58-05): author per-gate Codex behavior matrix (AT-3)`

**Row completeness:**
- FOUND: All 25 requirement IDs (GATE-01, 02, 03, 04a, 04b, 04c, 05, 06, 07, 08a, 08b, 08c, 08d, 08e, 09a, 09b, 09c, 09d, 10, 11, 12, 13, 14, 15, XRT-01) present as Section 4 `### {GATE-ID}` headers.

**No row value violates non-compliance rules:**
- FOUND: `blanket N/A` / `Codex has no hooks` occurrences are confined to Sections 1, 2, and 8 rejection-framing text; never appear as row values in Section 4.

All claims verifiable via `ls`, `grep`, and `git log --oneline`.
