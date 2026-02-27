# Pitfalls Research: Signal Lifecycle, Multi-Sensor Detection, Epistemic Rigor & Reflection Enhancement

**Domain:** Adding signal lifecycle tracking (triage, remediation, verification, recurrence), multi-sensor detection, epistemic rigor enforcement, and reflection enhancement to an existing file-based AI workflow system
**Researched:** 2026-02-27
**Confidence:** HIGH (grounded in actual system analysis -- 46 signals/1 lesson pipeline ratio, 1 spike created/0 completed, specific schema review, real token budget measurements, known confirmation bias incidents from this project)

---

## Critical Pitfalls

### Pitfall 1: Schema Expansion Breaks the Pipeline It's Supposed to Fix

**What goes wrong:**
The proposed signal schema expands from ~15 YAML frontmatter fields to ~30+ fields (adding `source.sensor`, `source.evidence`, `triage.decision`, `triage.rationale`, `triage.by`, `triage.at`, `remediation.ref`, `remediation.approach`, `remediation.expected_outcome`, `remediation.status`, `verification.status`, `verification.method`, `verification.at`, `evidence.supporting`, `evidence.counter`, `evidence.confidence`, `evidence.confidence_basis`, `recurrence_of`, `previous_remediations`). The signal collector agent already generates signals with ~1.5-2.8KB each (measured from current KB). With the expanded schema, each signal could reach 4-6KB. The reflector must read ALL active signals -- currently 46 files totaling ~95KB. At the expanded size with lifecycle fields populated across phases, this could reach 200-300KB just for signal data, consuming 10-15% of context window before the agent even starts reasoning.

More critically, the schema expansion makes signal CREATION harder. The current signal collector already has a 213-line agent spec plus ~258-line signal-detection reference. Adding mandatory counter-evidence fields, confidence basis, and source evidence tracing means the collector must do MORE WORK per signal. If the pipeline is broken at 46:1 signal-to-lesson ratio, making each signal more expensive to create does not fix the pipeline -- it makes the input side more fragile while the output side (reflection/lessons) remains the actual bottleneck.

**Why it happens:**
The deliberation document correctly identifies that "signals are write-once dead letters" -- but the proposed fix adds lifecycle metadata to signals rather than building the processing machinery that consumes them. Schema-first thinking feels like progress because it's concrete and designable, but the system's failure mode is not "signals lack metadata" -- it's "nothing reads signals and produces lessons."

**How to avoid:**
- Phase the schema expansion: Ship lifecycle fields as OPTIONAL first. Required fields stay as-is (the current ~15 fields). New fields get populated incrementally as the lifecycle machinery comes online.
- Build the processing pipeline FIRST (reflector enhancement, pattern detection, lesson distillation), THEN add richer schema fields once the pipeline proves it can consume what already exists.
- Measure: Before expanding the schema, run the reflector on the existing 46 signals and produce lessons. If it cannot produce lessons from existing data, the problem is not schema richness -- it's reflector logic.
- Schema migration: Use the pattern from v1.15 config migration -- optional fields with defaults, no breaking changes, gradual adoption. Existing signals without new fields remain valid.

**Warning signs:**
- Schema design takes more than one phase while reflector enhancement is deferred
- New required fields are added before any agent uses them
- Signal creation time increases (measurable: agent spec line count, average signal file size)
- Schema validation rejects old signals

**Phase to address:** Schema expansion should be the LAST phase, not the first. Build the consumer (reflector) before enriching the producer (collector).

---

### Pitfall 2: Multi-Sensor Orchestration Generates Noise Faster Than Reflect Can Process

**What goes wrong:**
The proposed sensor architecture adds git-sensor, log-sensor, and metrics-sensor alongside the existing artifact-sensor. The artifact sensor currently produces ~10-15 signals per phase (before trace filtering). A git-sensor analyzing commit patterns, churn, and "fix fix fix" sequences could easily double that. A log-sensor reading conversation patterns could triple it again. The per-phase signal cap is currently 10 persistent signals -- but across all sensors, candidates could number 30-50 before filtering.

The real danger: more sensors = more signals = larger KB = more context for the reflector = less reasoning room for actual pattern detection. The current reflector already has a 278-line agent spec plus ~596-line reflection-patterns reference. If it must also load 100+ active signals (expanded from 46), the context budget for actual reasoning shrinks below the ~50% quality threshold documented in agent-protocol.md Section 11.

From observability engineering: "When alerts become noise, important signals get lost." The parallel is exact. The existing 46-signal backlog already exceeds the reflector's ability to process (1 lesson from 46 signals). Adding more sensors without fixing the processing bottleneck accelerates noise accumulation.

**Why it happens:**
Sensor addition is additive and feels like progress. Each sensor individually seems valuable (git patterns ARE useful information). But the system constraint is not "insufficient detection" -- it's "insufficient synthesis." The signal collector works; the reflector doesn't. Adding more input to a broken pipeline produces a larger pile of unprocessed input, not better output.

**How to avoid:**
- MANDATORY: Fix the reflector BEFORE adding new sensors. The existing artifact-sensor produces enough signals to test the full pipeline. New sensors add value only AFTER the pipeline can process existing input.
- When sensors are added, implement a per-sensor-run budget: each sensor emits a maximum of N signal candidates (e.g., 5). The synthesizer picks the highest-severity across all sensors, subject to the existing per-phase cap of 10.
- Implement severity stratification from observability best practices: "Alert on business impact, not on every error." Git commit pattern anomalies are LOW severity unless they correlate with execution failures (MEDIUM) or verified bugs (HIGH).
- Run sensors with cheap models (the deliberation correctly identifies this -- `"git": { "model": "haiku" }`). But verify that cheap models produce useful signals before expanding sensor count.

**Warning signs:**
- Signal count per phase exceeds 20 before filtering
- Reflector load time (signal reading) exceeds 30% of its context budget
- New sensors are added before existing signal backlog is processed
- The "signal synthesis" step becomes the most expensive part of collection

**Phase to address:** Reflector enhancement MUST precede sensor expansion. Add one new sensor at a time, with measured impact on signal volume and reflector load.

---

### Pitfall 3: Epistemic Rigor Requirements Create a Compliance Tax That Kills Throughput

**What goes wrong:**
The epistemic rigor design principle requires structural counter-evidence in every signal (`evidence.counter: ["alternative explanations considered and why rejected"]`), every verification (`Evidence Against` section), and every reflector pattern assessment. This is philosophically correct -- confirmation bias is a real observed problem in this system (the tech debt dismissal incident, the .claude/ directory confusion going undetected for 23 days).

But the cost is concrete: every signal now requires the collector to generate BOTH supporting AND counter-evidence. If the collector currently spends ~30 seconds per signal, counter-evidence seeking could double that. Across a phase with 10 signals, that's an extra 5 minutes of token consumption. For the reflector analyzing 46+ signals, actively seeking counter-evidence to each emerging pattern could consume most of the context budget in falsification attempts rather than synthesis.

The proportionality principle in the deliberation is correct ("falsification effort should scale with cost of being wrong") but is vague enough that agents will either over-apply it (seeking counter-evidence for trivial signals) or under-apply it (generating formulaic "no counter-evidence found" text to satisfy the field requirement).

**Why it happens:**
Epistemic rigor is a response to real failures. But the response treats the problem as structural when it is partly behavioral. The tech debt dismissal happened because the agent took a literal workflow path, not because the signal schema lacked a counter-evidence field. The .claude/ confusion went undetected because no test existed, not because signals lacked confidence annotations. Structural requirements can enforce the form of rigor without guaranteeing the substance.

**How to avoid:**
- Make counter-evidence fields optional-but-flagged: If a signal lacks `evidence.counter`, the reflector should flag it as "unvetted" rather than preventing its creation. This preserves signal throughput while incentivizing rigor where it matters.
- Implement the proportionality principle as a concrete rule: Counter-evidence is REQUIRED only for `critical` severity signals and for pattern detection in the reflector. For `notable` signals, it is recommended. For `trace`, it is unnecessary.
- Positive signal emission should be a REFLECTOR responsibility (periodic baseline assertions), not a per-signal-creation requirement for sensors. Sensors detect deviations; baselines are a separate concern.
- Measure the actual token cost of epistemic rigor in the first phase that implements it. If signal creation time increases >50%, the implementation is too heavy.

**Warning signs:**
- Counter-evidence fields contain formulaic text ("No counter-evidence identified" copy-pasted across signals)
- Signal creation latency doubles or more
- Agents spend more context on falsification than on detection
- Users skip signal collection because it takes too long

**Phase to address:** Implement tiered rigor in the same phase as signal schema expansion. Critical = required counter-evidence. Notable = optional. Trace = none.

---

### Pitfall 4: Relaxing Signal Immutability Creates Data Integrity Nightmares

**What goes wrong:**
The deliberation proposes relaxing signal immutability: "Detection data stays frozen, but lifecycle fields (triage, remediation, verification) are mutable." This seems reasonable in isolation, but the current system architecture is built on signal immutability. The knowledge-store.md spec says explicitly: "Signals capture a moment in time" and "Only status field changes are allowed (for archival)." The deduplication system (`related_signals`, `occurrence_count`) depends on signals being stable references. The index rebuild process assumes it can re-derive the index from files at any time.

If lifecycle fields are mutable, then:
1. The index must either include lifecycle state (making it more complex and fragile) or exclude it (making it useless for lifecycle queries)
2. Concurrent agent access becomes dangerous -- two agents could update the same signal's triage field simultaneously
3. The "files are source of truth, indexes are derived" principle breaks if lifecycle state changes aren't reflected in the index
4. Signal files referenced as evidence in lessons could change after the lesson was created, invalidating the evidence chain

The current concurrency model states: "Entry files have unique IDs preventing write collisions" and "Parallel agents writing entries simultaneously write to different files." Mutable signals break this guarantee.

**Why it happens:**
The lifecycle needs mutable state somewhere. The instinct is to put it on the signal because the signal is the entity being triaged/remediated/verified. But this conflates the observation (immutable: what was detected) with the response (mutable: what was done about it).

**How to avoid:**
- Keep signals immutable. Store lifecycle state in a SEPARATE file: `{signal-id}-lifecycle.md` adjacent to the signal, or a centralized `lifecycle.yaml` per project.
- Alternative: A lightweight lifecycle index (not the main index) that maps signal IDs to their current triage/remediation/verification status. This is a derived file like the current index, but focused on lifecycle state.
- The reflector reads both the signal (what happened) and its lifecycle record (what was done). This preserves the immutability guarantee while enabling the lifecycle tracking.
- If mutable fields on signals are chosen despite the above, limit mutability to a specific YAML section (`lifecycle:`) that is clearly separated from detection data, and add a write-lock mechanism (`.lock` file or last-write-wins with timestamp checking).

**Warning signs:**
- Signals referenced in lessons have different content than when the lesson was created
- Index rebuild produces different results depending on when it runs (lifecycle state changed between rebuilds)
- Two agents update the same signal and one's changes are lost
- Debug session trying to trace "what did this signal say when the lesson was created?"

**Phase to address:** Address in the schema design phase, BEFORE any lifecycle field implementation. This is an architectural decision that affects every downstream consumer.

---

### Pitfall 5: Repeating the Spike System Mistake -- Building Infrastructure Without Usage Pressure

**What goes wrong:**
The spike system is the clearest cautionary tale in this codebase: substantial infrastructure built (agent spec, workflow, templates, integration reference, KB schema), near-zero adoption (1 spike created, stuck at "designing" status, 0 KB entries). The v1.16 deliberation proposes "spike system revisit" with a lightweight mode, proactive surfacing, config additions, and reflect integration. This risks repeating the exact pattern: designing improvements to infrastructure that has no usage pressure to validate the design.

Concrete failure modes:
- A "lightweight spike" mode is designed, implemented, and never used -- because the original spike system wasn't unused due to weight, it was unused because nothing triggers it
- Proactive surfacing is implemented, but the prompts are ignored or feel like noise -- because the system doesn't know which questions actually need empirical investigation vs. quick research
- Config additions (`spike_sensitivity` in feature manifest) are built but never tuned -- because there's no feedback loop from spike outcomes to sensitivity calibration

**Why it happens:**
The spike system has a plausible theory of value ("resolve uncertainty empirically") but no usage data to validate which parts of the theory are correct. The deliberation lists 5 hypotheses for why spikes aren't used but has not verified any of them. Designing improvements to an unused system based on hypotheses about non-usage is designing in the dark.

**How to avoid:**
- VERIFY the hypotheses FIRST. Before implementing any spike improvements:
  1. Check if spike-integration.md step 5.5 is actually wired into plan-phase.md (it probably isn't -- the deliberation suspects this)
  2. Check if any RESEARCH.md files contain "Genuine Gaps" sections (probably none exist)
  3. Check config defaults for spike_sensitivity (probably not initialized)
  4. Have the user manually try `/gsd:spike` on an actual open question from the v1.16 deliberation (e.g., "Where does Claude Code store session logs?")
- If verification shows the problem is "not wired in" (hypothesis 1), the fix is wiring -- not new features. If the problem is ceremony weight (hypothesis 2), test lightweight mode manually before implementing it formally.
- Implement the smallest possible spike improvement that addresses the verified root cause, then measure whether spikes actually get used before building more.

**Warning signs:**
- Spike improvement phase is planned before any spike usage verification
- New spike infrastructure (lightweight mode, config, surfacing) is designed without a concrete spike question to test against
- Post-milestone, spike usage count is still 0-1

**Phase to address:** Spike audit should be a SINGLE task within an early phase, not a full phase. The outcome determines whether further spike work is warranted. If verification shows the system just needs wiring, that's a 30-minute fix, not a phase.

---

### Pitfall 6: Recurrence Detection False Positives Erode Trust in the Entire System

**What goes wrong:**
The proposed verification model uses "absence of recurrence" as evidence that a fix worked: "When sensors run after a phase, they also check: is this new signal a recurrence of a previously-remediated one? If no recurrence in the relevant area, evidence toward confirmed." This creates a false-positive problem in both directions:

False confirmed: A signal is marked "verified/confirmed" because no recurrence was detected in the next 3 phases. But the root cause only manifests during specific operations (e.g., the .claude/ directory bug only manifested during installer runs, which don't happen every phase). Absence of evidence is not evidence of absence -- especially in a system where triggering conditions are phase-specific.

False recurrence: Two signals with overlapping tags (`installer`, `path-resolution`) are flagged as recurrences, but they're actually unrelated issues. The current deduplication uses "same signal_type + 2+ overlapping tags" -- this is too loose for recurrence detection. Signal `sig-2026-02-11-local-install-global-kb-model` (about KB path architecture) and `sig-2026-02-24-local-patches-false-positive-dogfooding` (about installer false positives) share tags like `installer` and `path-resolution` but are completely different bugs.

**Why it happens:**
Tag-based matching is the only semantic matching available in a zero-dependency system (no embeddings, no ML, no NLP). Tags are assigned by agent judgment, which means two semantically different signals can share surface-level tags. Recurrence detection built on tag matching inherits all the noise of tag assignment.

**How to avoid:**
- Recurrence detection should require MORE than tag overlap: same `signal_type` + 2+ overlapping tags + EXPLICIT `recurrence_of` link set by the reflector (not automatic). The reflector assesses whether signals are truly recurrences, not just tag-similar.
- "Absence of recurrence" should never produce `confirmed` status. It should produce `no-recurrence-detected` -- a weaker claim. `confirmed` requires POSITIVE evidence (test passes, behavior verified, regression test added).
- Define a recurrence window per signal type: deviation signals might recur within 3 phases; architectural signals might take 5+ phases. The window should be configurable, not hardcoded.
- Include recurrence confidence: "2 phases without recurrence" is LOW confidence. "10 phases without recurrence AND a regression test exists" is HIGH confidence.

**Warning signs:**
- Signals marked "confirmed" that later recur (the verification was wrong)
- Unrelated signals linked as recurrences (false clustering)
- The "recurrence of" chain grows long without any actual pattern (just tag coincidence)
- Users lose trust in verification status and ignore it

**Phase to address:** Verification logic should be implemented alongside sensor expansion, NOT before. It needs real signal flow to test against. Use the existing 46 signals as test data.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| All lifecycle fields on signal files (mutable) | Simple data model, everything in one place | Concurrency issues, broken immutability guarantee, evidence chain corruption | Never -- use separate lifecycle records |
| Counter-evidence as free text | Low implementation cost | Formulaic "none found" responses, no structural benefit | Only for trace-level signals |
| Per-sensor caps without cross-sensor coordination | Simple to implement per sensor | Sensors independently filter, missing cross-sensor correlations | Only in initial implementation; add synthesizer in next phase |
| Hardcoded recurrence windows | Quick to ship | Different signal types recur at different rates; false positives for slow-recurring issues | Only as initial default; must be configurable |
| Loading all signals into reflector context | Simple implementation | Context budget explosion at 100+ signals; quality degradation per agent-protocol.md Section 11 | Acceptable until ~60 signals; after that, must implement pre-filtering |
| Skip positive signal emission | Faster sensor runs | No baselines for regression detection; verification has nothing to compare against | Never for artifact sensor; acceptable to defer for git/log sensors |

## Integration Gotchas

Common mistakes when connecting lifecycle components to each other.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Signal schema migration (old signals -> new schema) | Adding required fields that break old signals | All new fields optional with explicit defaults; old signals remain valid; schema version field enables graduated processing |
| Sensor -> Synthesizer | Each sensor writes signals independently; synthesizer runs after, creating duplicates | Sensors emit CANDIDATES to synthesizer; only synthesizer writes to KB. Single write path prevents duplicates |
| Plan frontmatter `resolves_signals` -> Signal lifecycle | Plans declare which signals they resolve; nobody checks if the resolution actually worked | Add post-plan verification: after plan completes, check if resolved signals' root cause is addressed. Auto-create verification pending status |
| Reflector -> Lesson creation | Reflector creates lessons from pattern detection; lessons reference signal IDs that may be archived later | Lessons should snapshot evidence descriptions, not just IDs. If a signal is archived, the lesson's evidence section still makes sense |
| Signal collector -> Index rebuild | Collector writes signals then rebuilds index; if collector crashes mid-write, index is stale | Write all signals first, rebuild index once at end. If crash occurs, index rebuild on next run catches up (idempotent) |
| Recurrence checker -> Verification status | Checker updates verification status on old signals; violates immutability | Write a verification event/record, don't modify the original signal. The lifecycle record is the mutable entity |

## Performance Traps

Patterns that work at small scale but fail as the knowledge base grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reflector reads all signals into context | Works fine at 46 signals (~95KB) | Pre-filter by project + status + severity before loading; use index for filtering, load only relevant signal files | ~80-100 signals (~200KB+), consuming >15% of context budget |
| Index.md as full-text table | Simple grep/parse for queries | Keep index lean (ID, project, severity, tags, date, status). No lifecycle data in index. Separate lifecycle index if needed | ~200 entries (index file itself becomes unwieldy to parse) |
| Signal file per observation | Clean, immutable, one-file-per-event | Monitor total signal count per project; implement archival policy based on reflector processing (archive after lesson distilled) | ~150 signals per project; filesystem scanning slows, glob patterns become expensive |
| Counter-evidence generation per signal | Epistemic rigor | Tiered rigor: critical=full counter-evidence, notable=brief, trace=none | Immediately if applied uniformly -- token cost is O(n) per signal count |
| Cross-project pattern detection (scope: all) | Reads ALL signals across ALL projects | Only trigger cross-project mode explicitly; default to project scope | 2+ projects with 50+ signals each; index parsing and file loading exceeds budget |
| Sensor model spawning | Each sensor spawns as separate agent | Use cheap models for sensors (haiku); only reflector needs full model. But verify cheap models produce useful signals | Immediately if all sensors use opus-class model; 3 sensors x opus = 3x token cost per collection run |

## Agent Spec Bloat Trap

This is a domain-specific performance trap unique to GSD's architecture.

| Component | Current Lines | After v1.16 (estimated) | Risk |
|-----------|--------------|------------------------|------|
| gsd-signal-collector.md | 213 | 350-450 (multi-sensor orchestration, expanded schema, counter-evidence requirements) | Agent reads its own spec; larger spec = less room for actual work |
| signal-detection.md | 258 | 400-500 (new sensor rules, recurrence detection, verification checking) | Referenced by collector; loaded into same context |
| gsd-reflector.md | 278 | 400-550 (lifecycle awareness, confidence weighting, counter-evidence seeking, lesson pipeline fixes) | Already the bottleneck agent; enlarging it makes the bottleneck worse |
| reflection-patterns.md | 596 | 700-800 (confidence-weighted thresholds, recurrence verification, epistemic rigor) | Largest reference file; loaded entirely by reflector |
| knowledge-store.md | 367 | 450-550 (lifecycle schema, separate lifecycle records, expanded body templates) | Referenced by collector AND reflector |
| **Total loaded by reflector** | **~1,241** | **~1,900-2,350** | **Plus 46+ signal files. Context budget pressure is real.** |

**Prevention:** Split reference files. signal-detection.md should NOT contain recurrence logic (that's a reflector concern). lifecycle-schema.md should be a separate reference from knowledge-store.md. Each agent loads only what it needs.

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Signal schema expansion:** Often missing backward compatibility -- verify old signals parse correctly with new schema code
- [ ] **Multi-sensor collection:** Often missing synthesizer dedup -- verify that the same issue detected by artifact-sensor AND git-sensor produces 1 signal, not 2
- [ ] **Recurrence detection:** Often missing temporal context -- verify that "same tags, different root cause" is NOT flagged as recurrence
- [ ] **Reflector enhancement:** Often missing the actual lesson pipeline -- verify that running reflect on existing 46 signals PRODUCES lessons, not just pattern reports
- [ ] **Epistemic rigor:** Often missing proportionality -- verify that counter-evidence requirements don't apply to trace-level signals
- [ ] **Lifecycle tracking:** Often missing concurrency safety -- verify that two agents cannot corrupt a lifecycle record simultaneously
- [ ] **Spike improvements:** Often missing usage validation -- verify that at least one spike is COMPLETED (not just designed) using the new system
- [ ] **Verification status:** Often missing positive evidence requirement -- verify that "no recurrence" alone does NOT set status to "confirmed"
- [ ] **Source/install parity:** Often missing npm pack verification -- verify all new/modified files appear in `npm pack --dry-run` output (this exact bug has occurred THREE times in this project)
- [ ] **Index rebuild:** Often missing lifecycle state -- if lifecycle data is stored separately, verify the index or a lifecycle index reflects current state

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Schema breaks old signals | LOW | Add schema version field; processing code handles all versions; no signal files need modification |
| Sensor noise overwhelms reflector | MEDIUM | Reduce per-sensor caps; archive low-value signals; run reflector on subset (project + severity filter) |
| Epistemic rigor kills throughput | LOW | Downgrade counter-evidence from required to optional; add "rigor: light" mode to config |
| Mutable signals corrupt evidence | HIGH | If detected early: export signals, restore from git history, re-apply lifecycle state to separate records. If detected late: evidence chain is broken, lessons may reference altered signals -- requires manual audit |
| Recurrence false positives | MEDIUM | Review all "recurrence_of" links manually; tighten matching criteria (add root-cause similarity requirement); re-run reflector with stricter rules |
| Spike improvements unused | LOW | Delete unused infrastructure; keep lightweight spike as research-only flow; remove ceremony |
| Context budget exceeded | MEDIUM | Split agent specs and references; implement signal pre-filtering; reduce per-run signal load; consider two-pass reflection (first pass: index scan, second pass: load relevant signals only) |
| Source/install parity broken (again) | LOW-MEDIUM | Run `node bin/install.js --local` and diff; verify with `npm pack --dry-run`; the bug is well-understood from 3 prior occurrences |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Schema expansion breaks pipeline | Build reflector BEFORE expanding schema; schema expansion is a late phase | Run reflector on existing 46 signals; measure lesson output count > 1 |
| Sensor noise overwhelms reflector | Fix reflector first; add sensors one-at-a-time in subsequent phases | Measure signal count per phase before/after each sensor; verify reflector can process the volume |
| Epistemic rigor kills throughput | Implement tiered rigor (critical/notable/trace) in the schema design phase | Measure signal creation time before/after rigor requirements; <50% increase is acceptable |
| Signal immutability violated | Architectural decision in first phase: separate lifecycle records | Verify no signal file has been modified after creation (git log per signal file) |
| Spike system infrastructure-without-usage | Verify hypotheses in a single early task; implement only verified fixes | Post-milestone: spike usage count > 0; at least one spike completed end-to-end |
| Recurrence false positives | Implement recurrence logic after real lifecycle data exists (late phase) | Test recurrence detection against known-different signals that share tags (the installer signals are a good test case) |
| Context budget explosion | Split references; implement pre-filtering; measure agent spec sizes | Total reflector context load < 50% of window (per agent-protocol.md quality threshold) |
| Source/install parity regression | Add `npm pack --dry-run` verification to every phase that modifies agent specs or references | Automated check: file count in npm pack matches expected count; content diff between source and installed is only path prefix conversion |

---

## Phase-Specific Warnings

Detailed warnings for likely v1.16 phase topics.

### Signal Schema Design Phase

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Over-specifying lifecycle fields before pipeline exists | HIGH | Wasted design effort; schema changes needed after pipeline reveals actual requirements | Design minimal schema; mark lifecycle fields as "provisional"; iterate after reflector works |
| Breaking backward compatibility with 46 existing signals | MEDIUM | Old signals rejected; data loss or corrupted index | Schema version field; processing code handles v1 and v2; no migration of existing files |
| Nested YAML objects (source.sensor, triage.decision) cause parsing issues | MEDIUM | Agent YAML parsing is simplistic (frontmatter extraction via regex in some code paths) | Test nested YAML parsing in gsd-tools.js; if fragile, flatten to `source_sensor`, `triage_decision` |

### Reflector Enhancement Phase

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Reflector spec grows beyond context budget | HIGH | Agent reads its own spec + reflection-patterns.md + all signals; quality degrades | Split reflection-patterns.md into core (thresholds, clustering) and extended (drift, suggestions); reflector loads only core by default |
| Confidence-weighted thresholds produce no patterns | MEDIUM | If most signals are LOW confidence, thresholds are never met; no patterns = no lessons | Include a "pattern candidate" tier below threshold that is reported but not auto-distilled; ensures visibility even at low confidence |
| Counter-evidence seeking in reflector becomes circular | MEDIUM | "Is this pattern real?" leads to reading more signals for counter-evidence, consuming more context, producing less synthesis | Budget counter-evidence seeking: check up to 3 counter-examples per pattern, then decide. Bounded falsification, not exhaustive |

### Multi-Sensor Phase

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Git-sensor produces high volume of low-value signals | HIGH | "Fix fix fix" commit pattern detection generates noise for normal development iteration | Git-sensor should ONLY emit signals at notable+ severity; "fix" commit patterns are trace-level unless they correlate with verification failures |
| Log-sensor requires Claude Code session log access (unknown) | HIGH | The deliberation itself notes this is a spike candidate; building a log-sensor without knowing if logs are accessible is waste | Spike or quick research FIRST: where does Claude Code store session logs? Block log-sensor implementation on this answer |
| Sensors run in parallel but share signal namespace | MEDIUM | Two sensors detect the same issue (e.g., test failure visible in artifacts AND git history); synthesizer must dedup | Synthesizer runs AFTER all sensors; dedup by root-cause similarity (not just tag overlap); synthesizer is the single KB writer |

### Spike System Phase

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Lightweight spike mode designed but no spike question to test | HIGH | Mode is implemented in the abstract; first real use reveals design gaps | Use a concrete open question from the v1.16 deliberation as the test case during implementation |
| Integration point wired but nothing triggers it | HIGH | Same failure as original: integration exists but the conditions that trigger it never arise | Verify: does any current RESEARCH.md contain content that would trigger spike integration? If not, the trigger conditions need redesign, not just wiring |

### Verification/Recurrence Phase

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Verification runs on every collect-signals, adding latency | MEDIUM | Each collection run must check all remediated signals for recurrence; O(n) check per run | Only check signals remediated in the last 5 phases (rolling window for verification, NOT for signal retention) |
| Recurrence check requires loading remediated signals from other milestones | LOW-MEDIUM | Cross-milestone recurrence requires reading signals from v1.12-v1.15; volume increases | Only check cross-milestone recurrence during explicit reflect runs, not during per-phase collection |

---

## The Meta-Pitfall: Building a Self-Improvement System That Doesn't Improve Itself

This project has 46 signals, 1 lesson, 1 incomplete spike, and 0 completed verification cycles across 4 milestones and 85 plans. The system was designed to "never make the same mistake twice" but has not yet completed a single signal-to-lesson loop with verified remediation.

The v1.16 milestone risks adding MORE machinery (sensors, lifecycle tracking, recurrence detection, confidence weighting, counter-evidence) to a pipeline that cannot complete its EXISTING cycle. Every new component is another thing that must work for the loop to close.

**The litmus test for v1.16 success is not "did we build all the features?" It is: "Can the system now produce lessons from signals and verify that remediations work?"**

If the answer after v1.16 is still "we have infrastructure but no completed cycles," the milestone has failed regardless of how many sensors, lifecycle fields, or epistemic rigor requirements were implemented.

**Concrete success criteria:**
1. Reflector produces >5 lessons from existing 46 signals (proving the processing pipeline works)
2. At least 1 signal has a completed lifecycle: detected -> triaged -> remediated -> verified
3. At least 1 spike question is answered end-to-end (not just designed)
4. Signal-to-lesson ratio improves from 46:1 to at most 10:1

---

## Sources

- [GSD Knowledge Store specification](/Users/rookslog/Development/get-shit-done-reflect/.claude/agents/knowledge-store.md) -- immutability rules, concurrency model, schema
- [Signal detection reference](/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/references/signal-detection.md) -- current detection rules, severity classification
- [Reflection patterns reference](/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/references/reflection-patterns.md) -- threshold model, clustering, anti-patterns
- [v1.16 deliberation](/Users/rookslog/Development/get-shit-done-reflect/.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md) -- proposed architecture, schema extensions, epistemic rigor principle
- [Development workflow gaps deliberation](/Users/rookslog/Development/get-shit-done-reflect/.planning/deliberations/development-workflow-gaps.md) -- source/install confusion history, epistemic rigor gap
- [GSD Agent Protocol](/Users/rookslog/Development/get-shit-done-reflect/.claude/get-shit-done/references/agent-protocol.md) -- context budget rules (Section 11), quality degradation curve
- KB signal data: 46 active signals, ~95KB total, measured from `~/.gsd/knowledge/signals/get-shit-done-reflect/`
- KB lesson data: 1 lesson in `~/.gsd/knowledge/lessons/architecture/`
- KB spike data: 0 completed spikes; 1 spike stuck at "designing" status
- [Alert Fatigue in DevOps: Moving from Noise to Signal](https://drdroid.io/engineering-tools/alert-fatigue-in-devops-moving-from-noise-to-signal) -- observability best practices for signal-to-noise ratio
- [Cutting through the noise: Adaptive observability as antidote to alert fatigue](https://www.itrsgroup.com/blog/cutting-through-noise-why-adaptive-observability-antidote-alert-fatigue-0) -- severity stratification, dynamic thresholds
- [11 Key Observability Best Practices 2026](https://spacelift.io/blog/observability-best-practices) -- SLO-driven alerts, business impact focus
- [Data Observability Guide 2025](https://www.synq.io/blog/data-observability-guide) -- strategic testing, signal-to-noise ratio optimization

---
*Pitfalls research for: v1.16 Signal Lifecycle & Reflection Enhancement*
*Researched: 2026-02-27*
