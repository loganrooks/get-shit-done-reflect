---
phase: 31-signal-schema-foundation
verified: 2026-02-28T10:45:56Z
re_verified: 2026-02-28T18:15:00Z
status: passed
score: 15/15 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 14/15
  gaps_closed:
    - "Existing date-slug format signals (all 6 previously-failing critical signals) now pass schema validation with valid: true -- backward_compat: { field: lifecycle_state } downgrades conditional evidence requirement to a warning when lifecycle_state is absent"
  gaps_remaining: []
  regressions: []
---

# Phase 31: Signal Schema Foundation Verification Report

**Phase Goal:** Signals carry the metadata needed for a complete lifecycle -- triage state, remediation tracking, verification status, and epistemic evidence -- while all 46 existing signals remain valid without migration.
**Verified:** 2026-02-28T10:45:56Z (initial)
**Re-verified:** 2026-02-28T18:15:00Z (after 31-04 gap closure)
**Status:** passed
**Re-verification:** Yes -- after 31-04 backward compatibility gap closure

---

## Re-Verification Report (31-04 Gap Closure)

### Prior Gap Status

Initial verification (2026-02-28T10:45:56Z) found score 14/15. One gap:

- Truth 15 FAILED: 6 pre-existing critical signals (severity: critical, no evidence field, no lifecycle_state) returned `valid: false, missing: [evidence]` because the conditional requirement made evidence mandatory for critical severity without scoping the rule to new signals only.

### Gap Closure Verification

Plan 31-04 added `backward_compat: { field: 'lifecycle_state' }` to `FRONTMATTER_SCHEMAS.signal`. When `lifecycle_state` is absent (pre-Phase 31 signals), `cmdFrontmatterValidate` downgrades conditional `require` fields to warnings prefixed `backward_compat:` rather than hard failures.

**All 6 previously-failing signals verified to now pass:**

| Signal | Before 31-04 | After 31-04 |
|--------|-------------|-------------|
| 2026-02-11-kb-data-loss-migration-gap | `valid: false, missing: [evidence]` | `valid: true, warnings: [backward_compat: evidence, ...]` |
| 2026-02-11-kb-script-wrong-location-and-path | `valid: false` | `valid: true` |
| 2026-02-11-local-install-global-kb-model | `valid: false` | `valid: true` |
| 2026-02-18-task-tool-model-enum-no-sonnet-46 | `valid: false` | `valid: true` |
| 2026-02-22-codebase-mapper-deleted-during-extraction | `valid: false` | `valid: true` |
| 2026-02-22-knowledge-surfacing-silently-removed | `valid: false` | `valid: true` |

Sample output for `2026-02-11-kb-data-loss-migration-gap.md`:
```json
{
  "valid": true,
  "missing": [],
  "present": ["id","type","project","tags","created","severity","signal_type"],
  "warnings": ["backward_compat: evidence","confidence","confidence_basis","recommended: lifecycle_state","recommended: signal_category","recommended: confidence","recommended: confidence_basis"],
  "schema": "signal"
}
```

**Strict enforcement preserved for new signals:** New critical signals WITH `lifecycle_state: detected` still fail validation if evidence is absent or empty. Tests confirm this boundary.

**Evidence content validation added:** Empty evidence objects (`evidence: {}` or `evidence: { supporting: [], counter: [] }`) fail validation for new critical signals. Empty evidence is structurally present but epistemically empty.

### Test Suite Verification

**npm test (vitest, fork-specific):** 155 tests pass, 4 todo, 0 fail.

**npm run test:upstream (node --test, gsd-tools.js):** 174 tests pass, 0 fail.

Signal frontmatter validation block expanded from 7 tests (31-03) to 11 tests (after 31-04):

| Test | Purpose | Result |
|------|---------|--------|
| valid critical signal with all fields | Baseline critical pass | pass |
| valid notable signal without evidence produces warnings | Notable warning-only | pass |
| valid minor signal with minimal fields | Minimal required fields | pass |
| invalid signal missing required field signal_type | Required field enforcement | pass |
| invalid critical signal without evidence | Strict enforcement (new signal) | pass |
| backward compatibility with date-slug format signal | Date-slug format compat | pass |
| backward compat: critical signal without lifecycle_state downgrades evidence to warning | Core backward compat | pass |
| new critical signal with lifecycle_state but no evidence fails | Boundary: once lifecycle_state present, strict | pass |
| new critical signal with empty evidence object fails | Evidence content validation | pass |
| backward compat mode does NOT apply when lifecycle_state is present | Exemption boundary | pass |
| warnings for missing recommended fields | Recommended warnings | pass |

### 31-04 Deliverables Confirmed

| Artifact | Status | Evidence |
|----------|--------|----------|
| `get-shit-done/bin/gsd-tools.js` -- backward_compat schema field | VERIFIED | Line 2248: `backward_compat: { field: 'lifecycle_state' }`; Lines 2273-2284: downgrade logic |
| `get-shit-done/bin/gsd-tools.js` -- evidence content validation | VERIFIED | Lines 2298-2314: empty evidence check on `supporting.length > 0` |
| `get-shit-done/bin/gsd-tools.test.js` -- 4 new tests | VERIFIED | Tests at lines 4418, 4445, 4469, 4498 added; total 11 signal tests |
| `agents/knowledge-store.md` -- backward_compat documented | VERIFIED | Lines 195-199: backward_compat behavior and Phase 33 constraint documented in Section 4.2 |
| `.planning/FORK-DIVERGENCES.md` -- entry updated | VERIFIED | Line 61: backward_compat and evidence content validation noted in gsd-tools.js entry |

---

## Original Verification Report (2026-02-28T10:45:56Z)

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | knowledge-store.md Section 4 Signal Extensions defines lifecycle_state, triage, remediation, verification, evidence, confidence, confidence_basis, signal_category, and recurrence_of fields | VERIFIED | Lines 115-136: full extensions table present with all specified fields |
| 2 | knowledge-store.md Section 10 documents the mutability boundary with explicit frozen/mutable field lists | VERIFIED | Lines 434-456: FROZEN fields list and MUTABLE fields list both present |
| 3 | knowledge-store.md defines the lifecycle state machine with all transitions, skip rules, regression paths, and invalidation | VERIFIED | Lines 149-193: Section 4.2 with state diagram, transition table, skip rules, regression paths |
| 4 | knowledge-store.md documents tiered epistemic rigor requirements by severity | VERIFIED | Lines 199-228: Section 4.3 with five epistemic principles and tiered rigor table |
| 5 | knowledge-store.md documents positive signal support with signal_category field | VERIFIED | Lines 116, 229-249: signal_category field defined as authoritative, Section 4.4 positive signals |
| 6 | signal.md template includes lifecycle fields with sensible defaults | VERIFIED | Lines 22-33: lifecycle_state, evidence, confidence, confidence_basis, triage, remediation, verification, recurrence_of all present with defaults |
| 7 | feature-manifest.json contains signal_lifecycle settings with all five project settings | VERIFIED | 5 settings confirmed: lifecycle_strictness, manual_signal_trust, rigor_enforcement, severity_conflict_handling, recurrence_escalation |
| 8 | gsd-reflector.md and gsd-signal-collector.md immutability guidelines updated to reference mutability boundary | VERIFIED | Both files contain "mutability boundary" at relevant lines; "signals are immutable" absent from both |
| 9 | signal-detection.md severity table includes four tiers with updated rigor descriptions | VERIFIED | Lines 127-150: four-tier table with per-tier persistence and rigor rules |
| 10 | signal-detection.md documents signal_category field and positive signal detection rules | VERIFIED | Lines 41-53, 181: positive signal types and signal_category field defined |
| 11 | reflection-patterns.md severity-weighted thresholds use the four-tier model | VERIFIED | Lines 42-58: critical/notable/minor/trace in table and pseudocode |
| 12 | FRONTMATTER_SCHEMAS in gsd-tools.js includes a signal schema with required, conditional, and recommended field validation | VERIFIED | Lines 2231-2249: signal schema with required (7 fields), conditional (2 rules), recommended (4 fields), optional (15 fields) |
| 13 | cmdFrontmatterValidate handles the signal schema including conditional requirements | VERIFIED | Lines 2265-2300: conditional and recommended checking implemented |
| 14 | Tests cover signal schema validation for all four severity tiers, backward compatibility, and conditional evidence requirements | VERIFIED | Lines 4258-4548: 11 tests present covering all cases; 155 vitest + 174 upstream tests pass |
| 15 | Existing date-slug format signals pass schema validation | VERIFIED | All 6 previously-failing critical signals return valid: true after 31-04; backward_compat mechanism confirmed working |

**Score:** 15/15 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `agents/knowledge-store.md` | Authoritative signal schema with lifecycle, epistemic, mutability, positive signal specs | VERIFIED | 514+ lines; Sections 4.2, 4.3, 4.4 added; Section 10 updated; backward_compat documented |
| `agents/kb-templates/signal.md` | Updated signal template with lifecycle and epistemic fields | VERIFIED | Contains lifecycle_state: detected, evidence, confidence, triage, remediation, verification, recurrence_of |
| `get-shit-done/feature-manifest.json` | Project settings for signal lifecycle | VERIFIED | signal_lifecycle entry with 5 schema settings, valid JSON |
| `agents/gsd-signal-collector.md` | Signal collector with updated mutability guidelines | VERIFIED | Contains "mutability boundary" at line 203; "signals are immutable" absent |
| `agents/gsd-reflector.md` | Reflector with updated mutability guidelines | VERIFIED | Contains "mutability boundary" at lines 262-264; "signals are immutable" absent |
| `get-shit-done/references/signal-detection.md` | Detection rules updated for four-tier severity, positive signals | VERIFIED | Version 1.2.0; signal_category, minor, epistemic-gap, baseline all present |
| `get-shit-done/references/reflection-patterns.md` | Pattern detection updated for four-tier severity and lifecycle-aware confidence | VERIFIED | Version 1.1.0; critical/notable/minor/trace; lifecycle in anti-patterns section |
| `get-shit-done/bin/gsd-tools.js` | Signal schema in FRONTMATTER_SCHEMAS with tiered validation including backward_compat | VERIFIED | Line 2248: signal schema with backward_compat; Lines 2298-2314: evidence content validation |
| `get-shit-done/bin/gsd-tools.test.js` | Tests for signal frontmatter validation | VERIFIED | 11 tests in "signal frontmatter validation" describe block |
| `.claude/agents/kb-rebuild-index.sh` | Index with lifecycle_state column | VERIFIED | Lines 60-61, 147: lifecycle_state extracted with "detected" default; Lifecycle column header present |
| `.planning/FORK-DIVERGENCES.md` | Fork divergence tracking for gsd-tools.js signal schema | VERIFIED | Line 61: signal entry with backward_compat noted, keep-fork merge stance |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| agents/kb-templates/signal.md | agents/knowledge-store.md | Template implements schema -- lifecycle_state: detected present | WIRED | signal.md line 22: `lifecycle_state: detected` |
| agents/knowledge-store.md | get-shit-done/feature-manifest.json | lifecycle_strictness referenced in spec, defined in manifest | WIRED | knowledge-store.md line 187: lifecycle_strictness; manifest line 164 ff: all 5 settings |
| agents/gsd-signal-collector.md | agents/knowledge-store.md | Agent references Section 10 for mutability boundary | WIRED | Line 203: "mutability boundary in knowledge-store.md Section 10" |
| agents/gsd-reflector.md | agents/knowledge-store.md | Agent references Section 10 for mutability boundary | WIRED | Lines 262, 264: "mutability boundary in knowledge-store.md Section 10" |
| get-shit-done/references/signal-detection.md | agents/knowledge-store.md | Schema extensions reference authoritative schema | WIRED | Lines 147, 175, 188-189: "knowledge-store.md" referenced |
| get-shit-done/references/reflection-patterns.md | get-shit-done/references/signal-detection.md | Pattern detection uses four severity tiers from detection reference | WIRED | Lines 42-58: critical/notable/minor/trace as four distinct entries |
| get-shit-done/bin/gsd-tools.js | agents/knowledge-store.md | FRONTMATTER_SCHEMAS.signal enforces schema defined in knowledge-store.md | WIRED | Lines 2231-2249: signal schema with required id/type/project/tags/created/severity/signal_type |
| get-shit-done/bin/gsd-tools.test.js | get-shit-done/bin/gsd-tools.js | Tests exercise cmdFrontmatterValidate with signal schema | WIRED | 11 tests calling `frontmatter validate <file> --schema signal` |
| .claude/agents/kb-rebuild-index.sh | ~/.gsd/knowledge/index.md | Script generates index with lifecycle_state Lifecycle column | WIRED | Lines 60-61, 147: extraction and column header |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | - | - | - | No TODO/FIXME/placeholder/empty-implementation anti-patterns detected in modified files |

### Plans Completed

| Plan | Description | Status |
|------|-------------|--------|
| 31-01 | Schema specification: knowledge-store.md lifecycle/epistemic/mutability extensions, signal template, feature manifest settings | Complete |
| 31-02 | Reference docs: signal-detection.md and reflection-patterns.md updated for four-tier severity and positive signals | Complete |
| 31-03 | Code implementation: FRONTMATTER_SCHEMAS signal validation in gsd-tools.js, 7 tests, kb-rebuild-index.sh lifecycle column | Complete |
| 31-04 | Gap closure: backward_compat for pre-existing critical signals without evidence | Complete |

### Final Summary

Phase 31 goal achieved in full. All 4 plans completed. All 15 must-have truths verified:

- Signal schema with lifecycle fields, mutability boundary, tiered epistemic rigor, and positive signal support is defined in `agents/knowledge-store.md`
- Machine-enforceable validation in `get-shit-done/bin/gsd-tools.js` with required/conditional/recommended tiers
- All 46 existing signals remain valid without migration -- pre-Phase 31 signals without `lifecycle_state` receive backward-compat downgrade from hard failure to warning
- New signals from the Phase 31 template (which always include `lifecycle_state: detected`) receive full strict enforcement
- 155 vitest tests and 174 upstream tests pass with no failures
- Phase 33 triage constraint documented in code, spec, and tests: when bulk triage adds `lifecycle_state` to existing critical signals, it must also add `evidence` before doing so

---

_Initial verification: 2026-02-28T10:45:56Z_
_Re-verification: 2026-02-28T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
