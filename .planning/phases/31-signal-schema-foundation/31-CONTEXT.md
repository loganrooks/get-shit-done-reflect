# Phase 31: Signal Schema Foundation - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the signal schema with lifecycle fields, epistemic rigor fields, mutability boundary, positive signal support, and severity tiers — while all 46 existing signals remain valid without migration. This phase defines the data model; downstream phases (32-35) build behavior on top of it.

</domain>

<decisions>
## Implementation Decisions

### Lifecycle semantics
- Four core states: detected → triaged → remediated → verified
- **Stage skipping is a project setting** — configurable per-project whether stages can be skipped
- Skip rules are context-dependent: Claude designs rules factoring in severity, transition type, and context
- **Signals can regress** — a remediated signal that recurs moves back to 'detected'
- **Invalidation state** — signals can be invalidated with audit trail when counter-evidence overwhelms supporting evidence (terminal state)
- **Dismissed/won't-fix** — Claude's discretion on whether to add a dismissed state or rely on triage priority
- Existing 46 signals default to 'detected' state; **bulk triage planned for Phase 33**
- **Verification rigor scales with severity** — naive temporal absence ("no recurrence for N phases") is insufficient for critical signals; critical signals require active evidence that conditions were re-tested; tiered approach (Claude's discretion on exact design)
- **Lifecycle transition audit trail** — Claude's discretion on whether to use structured lifecycle log in YAML or rely on git history
- **Transition actors** — Claude's discretion on which agents can trigger which transitions
- **Recurrence escalation depends on original severity** — critical signal recurring is escalated more aggressively than trace signal recurring

### Lifecycle + lessons connection
- Signals at any lifecycle state can contribute to lesson distillation
- **Multi-factor qualification system** — a signal's weight in lesson creation depends on multiple factors (lifecycle state, severity, recurrence count, confidence), not just one dimension
- The system is flexible, not rigidly weighted — reflector considers the full picture
- **Bidirectional signal-lesson linkage** — Claude's discretion on whether signals track which lessons they fed into

### Lifecycle + plans connection (schema groundwork)
- Whether to include plan-linkage fields (resolved_by_plan) now in Phase 31 or defer to Phase 34: Claude's discretion
- Plan-to-signal remediation confirmation flow: Claude's discretion
- Signal-plan cardinality (many-to-many vs constrained): Claude's discretion
- Whether signals inform plan creation (not just resolution): Claude's discretion

### Evidence & rigor philosophy

**Five epistemic principles (governing all rigor decisions):**
1. **Proportional rigor** — stakes determine evidence requirements
2. **Epistemic humility** — acknowledge what the system can't see
3. **Evidence independence** — don't conflate repetition with corroboration
4. **Mandatory counter-evidence** — critical claims must be challenged
5. **Meta-epistemic reflection** — the system evaluates its own reasoning quality

**Specific decisions:**
- Evidence format (structured refs vs narrative): Claude's discretion
- **Counter-evidence is a hard requirement for critical signals** — system refuses to save critical signal without counter-evidence
- Confidence representation (numeric vs tiered): Claude's discretion
- Confidence_basis format: Claude's discretion
- Evidence mutability rules (frozen vs mutable, split by type): Claude's discretion
- **Invalidation with audit** — signals can be invalidated but the decision is recorded as a lifecycle event
- Rigor tier requirements (what notable and trace signals require): Claude's discretion
- Confidence auto-adjustment vs manual-only: Claude's discretion

### Evidence types & validation
- Evidence types are extensible (core set + custom types)
- **Validation depth scales with signal criticality and evidence source reliability**
- System maintains priors about evidence source reliability that update over time
- Evidence source reliability is tracked multi-dimensionally (not a single score) — could include accuracy, coverage, false positive rate, or qualitative assessments
- Custom evidence types can have custom validation, context-dependent
- **Manual signal rigor is a project setting** — configurable based on user self-assessed skill/capacity

### Epistemic gap signals
- **The system explicitly acknowledges blind spots** — epistemic gap signals flag when the system suspects something but lacks tools/evidence to confirm
- Epistemic gaps lean toward full signals (signal_type: 'epistemic-gap') with same lifecycle — Claude's discretion on final design
- Examples: missing sensor coverage, unverifiable causes, indirect evidence for key claims

### Meta-evidence & self-evaluation
- **System annotates evidence quality** — signals include self-evaluation of evidence strength
- Schema should enable meta-epistemic reflection (Phase 33 reflector uses these fields to evaluate its own reasoning processes)
- Goal: system can assess whether its processes produce justified true belief

### Evidence aggregation
- **Evidence independence matters** — same observation cited by multiple signals is NOT multiple independent pieces of evidence
- Independent observations converging = genuine corroboration; repeated citations of same fact ≠ corroboration
- Claude designs aggregation rules with epistemic rigor as prime consideration

### Evidence sufficiency & decay
- Sufficiency model: Claude's discretion (likely context-dependent, factoring severity and claim type)
- Evidence decay/temporal relevance: Claude's discretion, with epistemic rigor as prime design consideration
- Falsifiability conditions: Claude's discretion on whether/how signals declare conditions under which they'd be proven wrong

### Rigor enforcement
- Enforcement behavior for violations: Claude's discretion (reject, accept as draft, etc.)
- Configurability boundary (universal vs configurable rules): Claude's discretion
- Override mechanism: Claude's discretion
- **Rigor calibration guardrails are a project setting** — what gets warned, how strictly

### Practical rigor balance
- **Severity-dependent ceremony** — trace signals: capture fast, low ceremony; critical signals: full rigor, accept overhead
- System should warn when rigor investment is miscalibrated (too much on traces, too little on critical)
- Automated vs manual signal rigor differences: configurable via project setting

### Positive signal vision
- **Three types of positive signals:** baselines (normal/healthy state), improvements (better than before), good patterns (practices worth repeating)
- Positive signal lifecycle: Claude's discretion on whether to use same states with different semantics or a distinct lifecycle
- Detection approach (active vs passive): Claude's discretion
- **Positive signals as counter-evidence** for negative signals: Claude's discretion
- Positive signal rigor: Claude's discretion (principles apply, but proportional rigor may mean less evidence needed)
- **Positive signals serve triple purpose:** lesson inputs (what to repeat), regression guards (define good state), cross-project transfer (patterns that work)
- Baseline establishment (auto-derived vs explicit): Claude's discretion
- Positive signal decay/invalidation: Claude's discretion

### Signal severity tiers
- Tier system design (how many tiers, names): Claude's discretion
- Severity assignment (who sets it, when): Claude's discretion
- Severity mutability over time: Claude's discretion
- Migration of existing 46 signals' severity: Claude's discretion (likely re-classified during Phase 33 bulk triage)
- Severity classification criteria: Claude's discretion (multi-factor)
- **Severity affects downstream behavior** — surfacing, urgency, auto-actions: Claude's discretion
- **Severity disagreements recorded** — when sensor and triage disagree, both assessments are recorded; investigation into discrepancy may be triggered
- **Severity conflict handling is a project setting** — how far triage can adjust, whether investigation is automatic

### Project settings identified
1. **Lifecycle strictness** — whether stages can be skipped
2. **Manual signal trust level** — rigor expected from user-submitted signals
3. **Rigor calibration guardrails** — what gets warned, enforcement strictness
4. **Severity conflict handling** — adjustment bounds, investigation triggers
5. **Recurrence escalation rules** — how recurrence affects severity based on original level

### Claude's Discretion
Claude has broad discretion on implementation details across all areas. Key areas of discretion:
- Lifecycle: audit trail format, transition actors, dismissed state, stage skip rules
- Evidence: format, mutability, confidence representation, aggregation rules, sufficiency model, decay
- Positive signals: lifecycle fit, detection approach, rigor levels, counter-evidence interaction
- Severity: tier design, assignment flow, classification criteria, downstream behavior
- All implementation/architecture decisions

</decisions>

<specifics>
## Specific Ideas

- "Lifecycle strictness should be a project setting" — user explicitly wants configurability, not one-size-fits-all
- "Epistemic rigor as the prime design consideration" — user emphasized this multiple times; rigor is not optional
- "We should have epistemic rigor when declaring anything 'verified', especially for critical signals" — pure temporal absence is insufficient for verification
- "The system should reflect on the epistemic rigor of our processes and whether they are able to reliably produce justified true belief" — philosophical grounding in epistemology (JTB)
- "Evidence source reliability should be multi-dimensional, not a single score" — richer than a number
- "Recurrence escalation depends on how significant or critical the signal was" — different levels of response for different stakes
- "Invalidation with audit" — signals can die but the death is documented
- "Positive signals serve as lesson inputs, regression guards, and cross-project transfer"
- Five epistemic principles articulated and confirmed as the governing framework

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 31-signal-schema-foundation*
*Context gathered: 2026-02-27*
