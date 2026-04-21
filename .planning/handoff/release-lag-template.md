---
doc_type: release_lag
schema_version: v1
lag_reason: "<short machine-friendly reason token; e.g. 'batching_v120_phases'>"
deferred_to: "<ISO8601 date when release is expected; e.g. 2026-05-15>"
deferred_at: "<ISO8601 timestamp when this doc was written; e.g. 2026-04-20T18:30:00Z>"
named_rationale: "<one-line rationale; expand in body below>"
referenced_phase_merge: "<commit SHA of phase merge that triggered this deferral>"
written_by_role: "planner|executor|verifier|user"
written_by_at: "<ISO8601>"
written_by_session_id: "<session id if available; else 'not_available'>"
---

# Release Lag Deferral

<!--
  USAGE: copy this template to `.planning/release-lag.md`, edit the frontmatter
  values to reflect the concrete deferral decision, and write a multi-paragraph
  narrative below explaining:

    1. Why this phase merge is NOT releasing now (named rationale, not vibes).
       Examples:
         - "Batching v1.20 completion phases so the release notes capture the
            whole milestone in one shot rather than five patch releases."
         - "Publish CI is broken on secret rotation (see sig-2026-XX-YY-...).
            Deferring until the rotation cycle completes."
         - "Runtime parity regression discovered in Codex sensor path; not
            safe to ship until Phase 60 lands the fix."

    2. What the unblock path is. What event or date makes `deferred_to`
       actionable? Who owns it? What will happen if `deferred_to` passes
       without a release?

    3. Traceability. If this deferral was triggered by a named signal,
       audit, or deliberation, cite it by path/id.

  GATE-11 SEMANTICS:
    - If this file exists with a FUTURE `deferred_to`, `gsd-tools release check`
      returns exit 2 (explicit_defer). The phase-close / milestone-close flows
      accept that as a passing boundary.
    - If `deferred_to` is in the past or unparseable, the file is treated as a
      STALE deferral: `release check` returns exit 1 (release_lag) with a
      `note` explaining why. At that point the deferral has expired and either
      the release must fire or this doc must be re-dated with new rationale.
    - When the release does fire, delete `.planning/release-lag.md`. Evidence
      is preserved in git history; the working tree stays clean so a future
      phase-close does not see a stale deferral.

  DO NOT leave this file in the repo after a release ships — delete it.
-->

## Narrative

<!-- Expand on named_rationale here — why NOT releasing now, in prose. -->

## Unblock Path

<!-- What event / date / owner makes `deferred_to` actionable? -->

## Traceability

<!-- Cite signals, audits, deliberations, or plans that justify this deferral. -->
