# Philosophical Deliberation: Pragmatism

**Tradition:** American Pragmatism
**Key thinkers:** Charles Sanders Peirce, John Dewey, William James
**Created:** 2026-03-03
**Status:** Active

## Core Ideas

American Pragmatism, developed across the work of Peirce, Dewey, and James from the 1870s through the mid-twentieth century, offers a theory of knowledge that rejects foundationalism -- the claim that knowledge rests on a bedrock of self-evident or incorrigible truths -- and replaces it with a view of knowledge as the product of ongoing, self-correcting inquiry. Four ideas from this tradition matter most for the design of a self-improving system.

### Fallibilism (Peirce)

Any current belief might be mistaken. This is not skepticism (which doubts whether knowledge is possible at all), but the positive claim that knowledge-production requires the permanent possibility of revision. Peirce's "first rule of logic" -- *do not block the way of inquiry* -- follows directly: a system that treats its own conclusions as permanently settled has stopped learning. Fallibilism does not mean all beliefs are equally uncertain. Some have survived more testing than others. But none are immune from future challenge.

### Warranted Assertibility (Dewey)

Dewey replaced "truth" with "warranted assertibility" -- a proposition is warranted when it has been produced by a well-conducted inquiry and has survived attempts to undermine it. The warrant is not permanent. It expires when conditions change, when counter-evidence emerges, or when the inquiry that produced it is found to have been flawed. Knowledge, on this view, is not a static collection of facts but a continuously maintained set of claims whose warrants are renewed through use and eroded through disuse.

### Abduction (Peirce)

Peirce identified three modes of inference: deduction (from rule and case to result), induction (from case and result to rule), and abduction (from a surprising result to a hypothetical rule that would explain it). Abduction has the schema: *The surprising fact C is observed. But if A were true, C would be a matter of course. Hence, there is reason to suspect that A is true.* Abduction is the only mode of inference that introduces genuinely new ideas. It is how hypotheses are born. Critically, an abductive inference is not justified by its formation alone -- its value depends on what happens next, on whether the hypothesis it generates proves fruitful in advancing inquiry.

### The Inquiry Cycle (Dewey)

Dewey's *Logic: The Theory of Inquiry* (1938) defines inquiry as "the controlled or directed transformation of an indeterminate situation into one that is so determinate in its constituent distinctions and relations as to convert the elements of the original situation into a unified whole." The cycle runs: **indeterminate situation** (something is off) --> **problematization** (the indeterminacy is named as a problem) --> **hypothesis** (a candidate resolution is proposed) --> **reasoning/experimentation** (the hypothesis is tested) --> **warranted assertion** (the tested hypothesis becomes operational knowledge) --> **new indeterminate situation** (the resolution changes conditions, creating new tensions). This is not linear. The cycle spirals: each resolution creates the conditions for new problems. A system that completes only part of the cycle -- detecting problems but never testing solutions, or testing solutions but never checking whether they worked -- is not conducting inquiry at all.

### Cash Value of Truth (James)

James asked of any proposition: "Grant it to be true, what concrete difference will its being true make in anyone's actual life?" This is not anti-intellectualism. It is a demand that abstract claims demonstrate operational consequences. A "truth" that never affects action, prediction, or decision has no cash value and should be treated with suspicion. Applied to a knowledge system: knowledge that is stored but never retrieved, never used to change behavior, never tested against outcomes, is not functioning as knowledge regardless of how well it is structured or how confidently it is labeled.

## Relevance to GSD Reflect

GSD Reflect is, without having named it as such, an implementation of Deweyan inquiry. The signal-to-lesson pipeline (detect --> triage --> remediate --> verify --> recurrence check --> lesson) *is* the inquiry cycle. Signals are indeterminate situations made explicit. Reflection is the problematization and hypothesis-formation phase. Lessons are warranted assertions. Signal-plan linkage (resolves_signals) is the action phase. Passive verification-by-absence is the test of whether the resolution held.

But the system currently embodies pragmatism incompletely, and the gaps are precisely where it underperforms.

**The biggest gap is that lessons are treated as permanent truths.** Once a lesson is distilled with `status: active` and `confidence: high`, nothing in the system challenges, re-evaluates, or retires it. There is no mechanism for a lesson's warrant to expire. This violates fallibilism directly. A lesson produced during v1.14 development about installer path resolution may be irrelevant after v1.16's architectural changes, but the system has no way to notice this.

**Signal detection is abduction without knowing it.** When the artifact sensor observes that a SUMMARY.md references files that don't exist, it is performing abduction: the surprising fact (phantom file reference) is observed; if the executor hallucinated the path, that would explain it; hence, there is reason to suspect hallucination. Making this abductive structure explicit would improve sensor design: each sensor should be asking "what surprising observations am I looking for, and what hypotheses would explain them?"

**The inquiry cycle is currently broken at two points.** First, the cycle does not auto-trigger: signals accumulate but reflection doesn't fire automatically (the core v1.17 problem). Second, the cycle doesn't close: after a lesson is produced and a fix is built, there is no systematic check of whether the lesson's prediction holds in future development. Passive verification-by-absence is a start, but it only checks for recurrence of the *same signal*, not whether the *lesson's general principle* holds.

**The knowledge base is a community of inquiry with one member.** The KB stores entries from multiple projects and (via provenance fields) from multiple AI models. This is the embryonic form of Peirce's community of inquiry -- convergence toward truth through the aggregation of many investigations. But the system currently has no mechanism for entries from different projects to challenge or reinforce each other. Cross-project lesson surfacing retrieves relevant lessons, but it never asks: does this lesson from Project A contradict what Project B learned?

## Concept Mapping

| Framework Concept | GSD Reflect Analog | Current State | Praxis Implication |
|---|---|---|---|
| **Warranted assertibility** | Lessons in `~/.gsd/knowledge/lessons/` | Lessons have `confidence` and `durability` fields but no expiration or re-validation mechanism. Once active, always active. | Lessons need a `last_validated` timestamp and a warrant-renewal mechanism. A lesson that hasn't been surfaced, applied, or confirmed in N milestones should have its confidence automatically downgraded. |
| **Abduction** | Signal detection by sensors (artifact, git, CI) | Sensors detect surprising observations and generate signal candidates. The abductive structure (surprising fact --> explanatory hypothesis) is implicit, not explicit. | Sensor design should explicitly name: (1) what counts as a "surprising fact" for this sensor, (2) what hypotheses explain it, and (3) what evidence would disconfirm the hypothesis. This makes sensor logic auditable and improvable. |
| **Inquiry cycle** | Signal --> Reflection --> Lesson --> Action (resolves_signals) --> Verification (passive) | The full cycle exists in design but does not auto-trigger. Collection and reflection are manual. Verification is passive-only. | v1.17 automation closes the trigger gap. Beyond v1.17, active verification (does the lesson's prediction hold?) would close the cycle completely. |
| **Fallibilism** | Lesson `durability` field (convention / principle) | Durability is set at creation and never changes. No lesson has ever been downgraded or retired. | Introduce lesson lifecycle states: `active` --> `stale` (not validated recently) --> `challenged` (counter-evidence found) --> `retired` (superseded or disconfirmed). Durability should be earned through survival, not assigned at birth. |
| **Community of inquiry** | Cross-project KB with provenance (runtime, model, gsd_version) | KB is structurally cross-project but functionally per-project. Lessons are surfaced during research but never cross-validated. | Enable contradiction detection across projects: when a lesson from Project A contradicts a lesson from Project B, surface both during planning with their respective evidence. Let the inquiry resolve the tension rather than silently preferring one. |
| **Pragmatic maxim** | AUTO-06 (automation statistics: fires, skips, last_triggered) | Does not exist yet (v1.17 requirement). No feature currently tracks its own practical effects. | Every automated feature should track its own utilization and outcomes. A feature that fires but never changes behavior (zero lessons produced, zero signals resolved) has no pragmatic value and should be flagged for review. |
| **Instrumentalism** | Lessons as tools for preventing recurrence, not as descriptions of reality | Lessons are written as imperative recommendations ("do X when Y"), which is instrumentalist. But they are never evaluated for effectiveness. | After a lesson is applied (via resolves_signals linkage), track whether the predicted improvement materialized. A lesson that is applied 3 times without reducing signal recurrence is a failed instrument and should be revised or retired. |
| **"Do not block the way of inquiry"** | Extensible sensor architecture (EXT-01: auto-discovery via `gsd-*-sensor.md`) | v1.16 has hardcoded sensors. v1.17 introduces auto-discovery. | The system should never have a closed set of things it can notice. Auto-discovery is necessary but not sufficient: the system should also be able to *generate hypotheses about what new sensors would be useful* based on patterns in unresolved signals. |
| **Cash value of truth** | Knowledge surfacing during research and planning phases | Lessons are pulled into agent context during research, but there is no tracking of whether surfaced lessons actually influenced decisions. | Track whether surfaced lessons were acted upon. A lesson that is surfaced 10 times but never influences a plan has zero cash value. Either the lesson is wrong, or the surfacing mechanism is broken, or the lesson is too abstract to be actionable. |

## Concrete Examples

### Example 1: Lessons as Warranted Assertions with Expiring Warrants

Consider the lesson `les-2026-02-16-dynamic-path-resolution-for-install-context` (category: architecture). This lesson was distilled during v1.14 when the installer's path resolution was being redesigned for multi-runtime support. Its warrant rests on evidence from signals about path confusion in the installer.

Under the current system, this lesson remains `status: active` and `confidence: high` indefinitely. But its warrant should not be permanent. The warrant depends on specific conditions:

1. **The evidence is still relevant.** If the installer has been substantially rewritten since v1.14, the signals that produced this lesson may describe a codebase that no longer exists. The lesson's warrant is *temporally bounded* by the codebase state it was derived from.

2. **The lesson has been tested.** If subsequent installer work has gone smoothly without the path-confusion problems this lesson warns about, that is *positive evidence* reinforcing the warrant. But if the lesson has never been surfaced during installer work (because no installer work has happened), the warrant is neither confirmed nor disconfirmed -- it is *dormant*.

3. **No counter-evidence has appeared.** If a new signal contradicts this lesson's recommendation -- for example, if following the lesson's advice causes a different kind of path confusion -- the warrant is *challenged*.

A pragmatist warrant-management system would track these dimensions:

```yaml
warrant:
  last_validated: 2026-02-16T00:00:00Z   # when the lesson was last confirmed useful
  validation_events: 2                     # times the lesson was surfaced and confirmed
  challenge_events: 0                      # times counter-evidence appeared
  dormant_since: 2026-02-17T00:00:00Z     # no installer work since then
  warrant_status: dormant                  # active | dormant | challenged | expired
```

After 2 milestones without validation, the lesson transitions to `dormant`. After 4, it transitions to `expired`. An expired lesson is not deleted -- that would violate fallibilism by destroying the record of past inquiry -- but it is no longer surfaced during planning unless explicitly searched for. If new installer signals appear and the lesson's recommendation still applies, the warrant is renewed and the lesson returns to `active`.

This is not academic bookkeeping. It solves a real operational problem: as the KB grows, a system without warrant decay will surface increasingly irrelevant lessons, burning context budget on stale advice. Warrant management is the mechanism by which the KB stays useful at scale.

### Example 2: Signal Detection as Abduction

The CI sensor planned for v1.17 (CI-03 through CI-06) provides a clear case of abduction in system design.

Consider CI-05: detecting branch protection bypass. The abductive structure is:

- **Surprising fact (C):** A commit was pushed to a protected branch without a passing CI check.
- **Hypothesis (A):** The developer used admin privileges to bypass branch protection, suggesting either urgency (acceptable) or process breakdown (problematic).
- **If A were true, C would be a matter of course:** Admin bypass is the standard mechanism for pushing without CI approval.
- **Conclusion:** There is reason to suspect A is true -- generate a signal.

But Peirce's logic of abduction demands more than generating the hypothesis. The hypothesis must be *testable*, and its value depends on whether it *advances inquiry*. This has concrete implications for sensor design:

1. **The sensor should generate the hypothesis, not the verdict.** The signal should say "branch protection appears to have been bypassed" (hypothesis), not "developer violated process" (verdict). The verdict belongs to the triage phase (reflection), where counter-evidence can be sought.

2. **The sensor should include disconfirmation conditions.** What evidence would show the hypothesis is wrong? Perhaps the push occurred during a CI outage, or the protection rules were legitimately relaxed for a migration. Including these conditions in the signal enables the reflector to check them.

3. **The hypothesis should be ranked by explanatory economy.** Peirce emphasized that abductive hypotheses should be "economical" -- the simplest hypothesis that explains the surprising fact deserves testing first. If a commit bypasses CI and the CI was already red for 5 consecutive runs (as in the v1.16 CI failure signal), the economical hypothesis is not "developer violated process" but "developer worked around a broken pipeline." The sensor's job is to generate the economical hypothesis, not the alarming one.

This reframes sensor design: a sensor is not a rule engine that pattern-matches violations. It is an abductive reasoner that notices surprises and generates hypotheses. The quality of a sensor is measured not by how many signals it produces, but by how many of its hypotheses survive triage -- how many prove fruitful for inquiry.

### Example 3: The Inquiry Cycle in Practice

Map the v1.16 CI failure through Dewey's full inquiry cycle to see where the system currently breaks:

**1. Indeterminate situation (something is off):**
CI tests fail on 5 consecutive pushes during v1.16 development. The wiring test `wiring-validation.test.js` checks for files in `.claude/agents/` which is not present in the CI environment. The situation is indeterminate: something is wrong, but the system has not yet named the problem.

**Current system behavior:** Nothing. No sensor detects CI failures. The indeterminate situation persists for 23 days. The developer bypasses it via admin push. This is a *complete failure to enter the inquiry cycle*.

**2. Problematization (the indeterminacy is named):**
Eventually, the developer manually notices the pattern and creates signal `sig-2026-03-02-ci-failures-ignored-throughout-v116`. The surprising observation is now named: CI failures were systematically bypassed without investigation.

**Current system behavior:** This step required human intervention. The signal was created manually via `/gsd:collect-signals`, not detected automatically. The system depends entirely on the human noticing, which took 23 days.

**3. Hypothesis (a candidate resolution):**
The reflection engine (or the developer) hypothesizes: "If we had a CI sensor that detected failures and surfaced them at session start, this problem would not recur." This is abduction: the surprising fact (CI failures ignored) is explained by the hypothesis (no sensor covers CI).

**Current system behavior:** The reflection engine can detect patterns across signals but cannot generate architectural hypotheses. The hypothesis that a CI sensor is needed was produced by the developer during the v1.17 roadmap deliberation, not by the system.

**4. Experimentation (the hypothesis is tested):**
v1.17 builds the CI sensor (CI-03), the session-start CI status display (CI-02), and the automation infrastructure to trigger collection automatically (SIG-01). These are the experimental actions that test the hypothesis.

**Current system behavior:** The system has no concept of "testing a hypothesis." Building a feature is just building a feature. There is no explicit connection between the hypothesis ("CI sensor would prevent this") and the implementation, no prediction that can be checked later.

**5. Warranted assertion (the tested hypothesis becomes operational):**
After v1.17 ships, if the CI sensor successfully detects failures and prevents bypass in subsequent development, the hypothesis is confirmed: the system now has a warranted assertion that "CI failures require automated detection." This becomes a lesson.

**Current system behavior:** Passive verification-by-absence checks whether `sig-2026-03-02-ci-failures-ignored-throughout-v116` recurs within 3 phases. But it does not check whether the CI sensor *works* -- only whether the original problem *recurs*. If the CI sensor is broken but CI happens to stay green, verification passes vacuously.

**6. New indeterminate situation (the resolution creates new tensions):**
The CI sensor consumes context. Auto-triggering after every phase burns tokens. The system now has a new indeterminate situation: automation that works but costs too much. This is the seed of the next inquiry cycle.

**Current system behavior:** AUTO-04 (context-aware deferral) anticipates this, but the general pattern -- that every solution creates new problems, and the system should expect and prepare for this -- is not architecturally recognized.

**The pragmatist diagnosis:** The cycle is broken at steps 1, 3, and 5. The system cannot detect indeterminacy automatically (no CI sensor), cannot generate hypotheses from patterns (reflection detects recurrence but not architectural gaps), and cannot actively verify whether its resolutions work (verification is passive and narrow). v1.17 fixes step 1. Steps 3 and 5 remain open for future milestones.

## Tensions and Limitations

### The Circularity Problem

The most serious objection to applying pragmatism in system design is circularity. James's formulation -- "the true is whatever proves itself to be good in the way of belief" -- invites the question: good *for what*? If the answer is "good for achieving the system's goals," and the system's goals are defined by its current beliefs about what matters, then the system validates itself against its own criteria. A lesson is "true" because it prevents signal recurrence, but the definition of what counts as a signal is itself a product of prior lessons.

**Mitigation:** Ground warrant-renewal in *external outcomes*, not internal consistency. A lesson's warrant is strengthened when builds succeed, when CI passes, when the developer doesn't express frustration -- outcomes that are external to the KB's own belief structure. The `evidence_count` on a lesson should include not just the signals that produced it but the concrete outcomes that confirmed it.

### The Relativism Risk

If knowledge is "what works," then knowledge is relative to context. A lesson learned in a Node.js CLI project may not apply to a React frontend. Cross-project lesson surfacing could inject irrelevant or actively harmful advice.

**Mitigation:** Lessons should carry *scope conditions* -- explicit statements of when they apply and when they don't. The `when_this_applies` section in current lessons partially addresses this, but scope is not machine-readable. Making scope conditions structured (project type, tech stack, development phase) would enable the surfacing mechanism to filter by relevance rather than surfacing everything with a keyword match.

### The Problem of Hypothesis Generation

Peirce's abduction explains how hypotheses are generated from surprising facts, but it does not explain how a system decides *which* surprising facts to attend to. The system currently defines "surprising" through hardcoded sensor rules (deviation detection, frustration patterns, CI failure). But the most important surprises may be the ones no sensor is designed to detect. Pragmatism gives no a priori method for determining what should count as surprising -- that itself is learned through inquiry.

**Mitigation:** Track "unexplained events" -- outcomes that no current lesson predicted and no current sensor would detect. This is a meta-sensor: a sensor for the absence of sensors. When a developer manually creates a signal that no automated sensor would have caught, that is evidence of a gap in the system's abductive reach.

### The Popper Objection

Popper explicitly critiqued pragmatism for lacking a principled mechanism of falsification. Fallibilism says any belief *might* be wrong, but doesn't specify what would *show* it to be wrong. Peirce's inquiry is self-correcting, but only if the community of inquiry is honest and unbounded -- conditions a software system cannot guarantee. A single-developer system using a single AI model is a community of one, and its "self-correction" may be systematic confirmation bias.

**Mitigation:** Build explicit disconfirmation into the system. Each lesson should declare not just what evidence supports it but what evidence would *challenge* it. The reflector already seeks counter-evidence during lesson distillation (the `counter_evidence` field). Extending this to lesson maintenance -- periodically checking whether counter-evidence has appeared since the lesson was created -- would give the system a falsificationist complement to its pragmatist core. This is not replacing pragmatism with Popper; it is using Popper's insight (specify your falsifiers) as a tool within pragmatist inquiry.

### The Stalled Inquiry Problem

Dewey's inquiry cycle assumes that inquiry is *motivated* -- that an indeterminate situation creates genuine doubt that compels investigation. But an automated system can detect signals without experiencing doubt. If signals accumulate but never trigger reflection (the current state), the cycle stalls. If reflection triggers automatically but the developer ignores its output (a future risk), the cycle stalls at a different point. Automation can make the cycle run without it actually *working*.

**Mitigation:** Distinguish between inquiry that runs and inquiry that *resolves*. Track the ratio of signals detected to signals resolved. A system that detects 80 signals and resolves 10 is not conducting effective inquiry -- it is generating noise. This ratio is a health metric (connecting to HEALTH-01/02) and a meta-signal: a high signal-to-resolution ratio is itself a surprising fact that should trigger abductive reasoning about why the cycle is stalling.

## Praxis Recommendations

1. **Implement warrant decay on lessons.** Add `last_validated` timestamp and `warrant_status` (active/dormant/challenged/expired) to the lesson schema. A lesson not validated within a configurable number of milestones transitions to `dormant`. A dormant lesson is deprioritized in surfacing. An expired lesson is archived but not deleted. Warrant renewal occurs when a lesson is surfaced during planning and the developer (or a future automated check) confirms it still applies. *Cite: pragmatism/warranted-assertibility, pragmatism/fallibilism.*

2. **Make abductive structure explicit in sensor design.** Each sensor specification should declare: (a) what counts as a surprising observation for this sensor, (b) what hypotheses explain each class of surprise, and (c) what evidence would disconfirm each hypothesis. This makes sensor logic auditable, testable, and improvable. It also makes the sensor contract (EXT-02) more than a data format -- it becomes an epistemological commitment. *Cite: pragmatism/abductive-inference.*

3. **Track lesson effectiveness, not just lesson existence.** When a lesson is surfaced during planning and a plan is subsequently created, record whether the plan referenced or followed the lesson's recommendation. When the plan executes, record whether the predicted improvement materialized (fewer deviations, fewer signals of that type). A lesson with high surfacing count but zero influence has no cash value and should be flagged for revision. *Cite: pragmatism/cash-value.*

4. **Add active verification to complement passive verification.** Passive verification-by-absence (no signal recurrence in N phases) checks for the *absence of the original problem*. Active verification should check for the *presence of the predicted improvement*. If a lesson predicts "TDD-structured plans produce zero-deviation phases," actively check whether TDD-structured plans built after the lesson actually had fewer deviations than non-TDD plans. This closes the inquiry cycle at step 5. *Cite: pragmatism/inquiry-cycle.*

5. **Enable cross-project contradiction detection.** When surfacing lessons from the cross-project KB, check whether any surfaced lesson contradicts another lesson from a different project. Surface both with their evidence and let the developer (or the planner agent) resolve the tension. This moves the KB from a passive repository toward a genuine community of inquiry. *Cite: pragmatism/community-of-inquiry.*

6. **Track the signal-to-resolution ratio as a system health metric.** The ratio of signals detected to signals resolved (triaged + remediated + verified) indicates whether the inquiry cycle is actually completing. A ratio above a configurable threshold (e.g., 5:1) is itself a signal -- the system is generating observations faster than it can act on them. This meta-signal should trigger either a reflection on sensor calibration or a review of automation effectiveness. *Cite: pragmatism/inquiry-cycle, pragmatism/pragmatic-maxim.*

7. **Treat every automated feature as an experiment with a hypothesis.** When building a feature motivated by a signal or lesson (via the TMPL-01 motivation citation), explicitly record the prediction: "this feature will reduce signals of type X by Y." After N milestones, check the prediction. This transforms feature development from "build and hope" into Deweyan experimental logic -- controlled transformation of indeterminate situations with verifiable outcomes. *Cite: pragmatism/warranted-assertibility, pragmatism/inquiry-cycle.*

8. **Preserve retired knowledge; never delete.** Fallibilism demands that past inquiry be accessible even when its conclusions have been superseded. An expired or retired lesson should be archived (moved to a `retired/` subdirectory, or marked with `status: retired`), not deleted. A future inquiry might find that the retired lesson was right all along, or might need the historical record to understand how current beliefs were formed. The KB should be a palimpsest, not a clean slate. *Cite: pragmatism/fallibilism.*

## Citable Principles

- **pragmatism/warranted-assertibility**: Knowledge is not a permanent state but a maintained one. A lesson's warrant comes from the inquiry that produced it and must be renewed through continued use, validation, and absence of counter-evidence. An unvalidated lesson is not false -- it is unwarranted.

- **pragmatism/fallibilism**: Any current belief, including the system's own lessons and design principles, might be mistaken. The system must never treat its own conclusions as unrevisable. This requires not just the theoretical possibility of revision but concrete mechanisms for challenge, decay, and retirement.

- **pragmatism/abductive-inference**: Signal detection is hypothesis generation. A sensor observes a surprising fact and infers an explanatory hypothesis. The quality of a sensor is measured not by signal volume but by the proportion of its hypotheses that survive triage and advance inquiry.

- **pragmatism/inquiry-cycle**: The signal-to-lesson pipeline is an inquiry cycle that must close completely to function. A cycle that detects but doesn't analyze, analyzes but doesn't act, or acts but doesn't verify is conducting incomplete inquiry. Every break in the cycle is a design debt.

- **pragmatism/cash-value**: Knowledge that is stored but never used has no value. The practical test of a lesson is whether it changes behavior -- whether it prevents a recurrence, improves a plan, or informs a design decision. A lesson's cash value is measured by its operational impact, not its epistemic confidence.

- **pragmatism/community-of-inquiry**: The cross-project knowledge base is the system's community of inquiry. Its value comes not from aggregation (more lessons = better) but from convergence -- the process by which contradictory evidence from different projects is resolved into more robust, better-warranted knowledge.

- **pragmatism/do-not-block-inquiry**: The system should never have a closed set of things it can notice, question, or revise. Extensible sensor architecture, lesson decay, and counter-evidence seeking are all implementations of Peirce's injunction to keep the road of inquiry open.

- **pragmatism/instrumentalism**: Lessons are tools for preventing recurrence and improving workflow, not descriptions of how software development "truly is." A lesson is good insofar as it is useful. When it stops being useful -- when it no longer prevents the problems it was designed to prevent -- it should be revised or retired, not preserved out of deference to its original evidence.
