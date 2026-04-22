# Deliberation: Phase 57.9 Hook & Closeout Substrate Closure

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-04-21
**Status:** Concluded
**Trigger:** Conversation observation after Phase 60 completion and release. The roadmap analyzer still points at Phase 57.9 as the next unresolved prerequisite even though later phases shipped. User question: was Phase 57.9 a mistake to skip, and how do we ensure the issue it was created to address is actually closed without shortcuts, even if that requires roadmap changes?
**Affects:** Phase 57.9, Phase 58 GATE-06/GATE-07 closure, Phase 60.1 scope, ROADMAP.md, REQUIREMENTS.md, `bin/install.js`, `get-shit-done/references/capability-matrix.md`, `get-shit-done/bin/lib/measurement/extractors/gsdr.cjs`
**Related:**
- `.planning/phases/58-structural-enforcement-gates/58-16-gate-06-07-defer-provenance.md`
- `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md`
- `.planning/deliberations/phase-scope-translation-loss-audit-capability-gap.md`
- `.planning/deliberations/cross-runtime-parity-testing.md`
- `philosophy: falsificationism/severe-tests`
- `philosophy: cartwright/scope-conditions`
- `philosophy: schon/reframing`

## Situation

Phase 57.9 was inserted as a narrow prerequisite because Phase 58's structural gates depended on closeout / incident hook substrate that did not actually exist. The key point is that Phase 58 did **not** manufacture completion: it explicitly deferred GATE-06 and GATE-07 to Phase 57.9 with named provenance and ledger entries.

The present problem is therefore not "was the defer dishonest?" It was honest. The problem is that the surrounding roadmap and implementation surface drifted afterward:

1. The original substrate gap is still real. Claude install code still does not write `SessionStop`, and the Codex installer path still exits before any hook installation logic runs.
2. Later phases prepared around the missing substrate instead of closing it. The measurement extractor already has a graceful fallback for a future `session_meta_postlude` source, but that source file does not yet exist.
3. Ownership drift appeared in planning artifacts. Some artifacts still say Codex hook installation was deferred to Phase 60, while Phase 60 later explicitly prohibited introducing new Codex hook substrate.

This means the live question is no longer "should we simply execute the original text of 57.9?" The real question is how to close the unresolved substrate dependency in a way that preserves traceability from Phase 58's defer-provenance and prevents shortcut completion.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `.planning/ROADMAP.md` + `.planning/REQUIREMENTS.md` | Phase 57.9 is the named owner of HOOK-01/02/03, and Phase 58 still depends on it for GATE-06/GATE-07 | Yes — read files | informal |
| `.planning/phases/58-structural-enforcement-gates/58-16-gate-06-07-defer-provenance.md` | Phase 58 explicitly deferred GATE-06/GATE-07 to Phase 57.9 and rejected fake completion; "non-delivery is the delivery" | Yes — read file | informal |
| `bin/install.js` Claude hook registration path | Claude install configures SessionStart hooks and PostToolUse context monitoring, but no SessionStop closeout hook is installed | Yes — read code | informal |
| `bin/install.js` Codex install branch | Codex path returns before settings/hook installation logic, so no Codex `hooks.json` substrate is installed today | Yes — read code | informal |
| `get-shit-done/bin/lib/measurement/extractors/gsdr.cjs` + filesystem check | The extractor is already wired to consume `session_meta_postlude` if Phase 57.9 ships it, but the source file is currently missing | Yes — read code and checked file absence | informal |
| `get-shit-done/references/capability-matrix.md` + Phase 60 CONTEXT | Capability matrix still says Codex hook installation was deferred to Phase 60, while Phase 60 later declared "no new Codex hook substrate introduction" | Yes — read both artifacts | informal |
| Current conversation | User explicitly requires that the underlying issue be addressed fully, with no shortcuts, regardless of roadmap cost | Yes — direct observation | informal |

## Framing

The first framing, "Was skipping 57.9 a big mistake?", is too blunt. The defer itself was not the mistake. The sharper question is whether the current roadmap still gives the unresolved hook-substrate problem an honest and sufficient owner.

**Core question:** What roadmap and phase shape closes the real Phase 57.9 substrate gap completely, while preserving the traceability and no-shortcuts discipline established by Phase 58's defer-provenance?

**Adjacent questions:**
- Is Phase 57.9 itself still the right container, or is the issue better handled by renaming/replacing it while preserving the defer chain?
- Which unresolved items are true substrate obligations, and which belong to downstream consumer or live-wiring phases such as 60.1?
- If Codex hook support remains conditional, what explicit waiver/fallback counts as honest closure rather than disguised non-delivery?

## Analysis

### Option A: Execute Phase 57.9 exactly as originally imagined

- **Claim:** Keep Phase 57.9 exactly as written and simply plan/execute it now.
- **Grounds:** The roadmap, requirements, Phase 58 matrix, and defer artifact already point to 57.9 as the owner. Reusing the original phase minimizes churn.
- **Warrant:** A named unresolved prerequisite should usually be completed rather than re-opened conceptually; otherwise the roadmap becomes unstable.
- **Rebuttal:** The original text now carries drift. It bundles substrate with some downstream implications, and later artifacts introduced contradictory ownership claims around Codex hooks and Phase 60. Executing the old text literally risks importing stale assumptions rather than closing the actual gap.
- **Qualifier:** Possibly acceptable, but only if the phase is re-read critically during planning rather than treated as frozen truth.

### Option B: Rewrite 57.9 as a strict closure phase for the unshipped substrate

- **Claim:** Keep the Phase 57.9 slot, but rewrite it narrowly around closure of the unresolved substrate contract: Claude `SessionStop`, Codex hook-or-waiver behavior, session-meta postlude markers/source, and artifact alignment.
- **Grounds:** Phase 58's own re-entry conditions already define the closure test: HOOK-01/02/03 verified, `SessionStop` actually written, Codex hook surface or explicit waiver present, and marker substrate shipped. The measurement extractor is already waiting for a `session_meta_postlude` source, so the codebase itself reflects this narrower substrate boundary.
- **Warrant:** This preserves historical continuity and defer traceability while updating the phase boundary to current reality. It closes the true dependency without claiming that later phases already absorbed it. It also respects `cartwright/scope-conditions`: the problem is local and specific, so the intervention should be scoped to the actual missing capacities.
- **Rebuttal:** This is effectively a rewrite of the phase's practical meaning. If handled sloppily, it can look like changing history after the fact. It also forces roadmap and capability-matrix cleanup work instead of just "building the hook."
- **Qualifier:** Probably the best option.

### Option C: Retire 57.9 and redistribute the work into 60.1 or a new successor phase

- **Claim:** Drop or supersede 57.9 entirely and move the remaining work into 60.1 or a fresh later phase.
- **Grounds:** Later phases already touched adjacent surfaces: Phase 58 installed the graceful fallback, and Phase 60/60.1 own sensor/live-wiring concerns. Consolidation could reduce the number of partially-overlapping phase labels.
- **Warrant:** If phase numbering has become misleading, replacement can be clearer than patching a stale inserted phase.
- **Rebuttal:** This weakens the integrity of the existing defer-provenance chain. Phase 58 explicitly deferred to 57.9, not vaguely to "later work." Retiring the target without a careful supersession path would create new ambiguity about whether the defer was ever actually resolved. It also invites the very shortcut the user is worried about: relabel the issue instead of closing it.
- **Qualifier:** Only defensible if the supersession is explicit, ledger-aware, and at least as strict as Option B.

## Tensions

- **Historical continuity vs. present accuracy:** Keeping 57.9 unchanged preserves history but risks stale scope. Rewriting it improves accuracy but must not erase the original defer logic.
- **Substrate closure vs. feature momentum:** Shipping later features is tempting, but GATE-06/GATE-07 still bottom out on substrate that is absent. Momentum cannot substitute for closure.
- **Codex ambition vs. honest conditionality:** Codex hooks exist behind `codex_hooks`, but that does not mean full parity should be promised. Honest closure may require explicit waiver state rather than optimistic pseudo-parity.
- **Phase ownership vs. downstream consumption:** The substrate phase should ship the hook/marker surfaces; downstream phases should consume them. Mixing these produces the kind of scope drift that created the current confusion.

## Recommendation

Phase 57.9 was **not** a mistake. Skipping it was acceptable because the skip was explicit, bounded, and recorded with named provenance. The actual problem is unresolved planned debt plus drift in how later artifacts describe its ownership.

**Current leaning:** Adopt Option B.

Phase 57.9 should be rewritten as a **strict closure phase** for the unresolved hook/closeout substrate, with the following contract:

1. **Claude closure substrate:** installer writes and tests `SessionStop` / closeout wiring from source.
2. **Codex closure substrate:** installer either writes the required `hooks.json` surface when `codex_hooks=true`, or writes an explicit waiver/degradation marker when the substrate is unavailable. Silent skip is forbidden.
3. **Session-meta closure substrate:** ship the `session_meta_postlude` source contract expected by the measurement extractor, producing canonical marker records or explicit `not_available` values for the conditions GATE-06/GATE-07 need.
4. **Artifact alignment:** ROADMAP, REQUIREMENTS, capability-matrix, and any Phase 60/60.1 references must agree on who owns substrate vs. downstream live wiring.
5. **No false retirement of defer entries:** GATE-06/GATE-07 remain `explicitly_deferred` until the Phase 58 re-entry conditions are satisfied with real evidence.

**Open questions blocking conclusion:**
1. None at the deliberation level. The remaining questions are planning questions, not framing questions.

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | The roadmap and capability artifacts will stop naming contradictory owners for Codex hook installation | Post-change grep across ROADMAP, capability-matrix, and phase CONTEXT files | A later artifact still says Phase 60 owns Codex hook installation while another says it is out of scope |
| P2 | A planned/executed 57.9 (or explicit superseding replacement) will produce a real `session_meta_postlude` source instead of the current graceful-missing path | File exists and extractor reports `exposed` or `not_emitted`, not permanent `not_available` | The phase claims closure but the source file is still missing |
| P3 | GATE-06 and GATE-07 will only leave `explicitly_deferred` state after the six re-entry conditions already named by Phase 58 are satisfied | Post-57.9 verification and ledger follow-up | The defer entries are retired without HOOK-01/02/03 evidence |
| P4 | Treating 57.9 as "already absorbed" would recreate the same scope-translation failure pattern seen elsewhere in the roadmap | Future planning or verification artifacts would rely on substrate that still has no owner | The work is redistributed without ambiguity and with equal or stronger traceability than the existing 57.9 defer chain |

## Decision Record

**Decision:** Preserve the existence of Phase 57.9, but rewrite it as a strict substrate-closure phase. Do not shortcut by claiming later phases absorbed it. If the roadmap needs a renamed successor instead of the literal 57.9 label, that supersession must explicitly preserve the Phase 58 defer linkage and re-entry conditions.
**Decided:** 2026-04-21
**Implemented via:** not yet implemented
**Signals addressed:** informal

## Evaluation

**Evaluated:** pending
**Evaluation method:** After planning/execution of 57.9 or its explicit successor, compare the shipped artifacts against the predictions above and check whether GATE-06/GATE-07 defer entries were retired only with the required evidence.

| Prediction | Outcome | Match? | Explanation |
|-----------|---------|--------|-------------|
| P1: Artifact owners align | pending | pending | pending |
| P2: `session_meta_postlude` ships | pending | pending | pending |
| P3: GATE-06/07 re-entry remains strict | pending | pending | pending |
| P4: No shortcut absorption recurrence | pending | pending | pending |

**Was this progressive or degenerating?** (Lakatos)
Pending.

**Lessons for future deliberations:**
The honest defer in Phase 58 was a strength, not a weakness. The failure mode came afterward, when later artifacts allowed ownership drift to accumulate around an unresolved prerequisite. Future deliberations should distinguish between "defer was wrong" and "defer was right, but later scope drift obscured the closure path."

## Supersession

**Superseded by:** pending
**Reason:** pending
