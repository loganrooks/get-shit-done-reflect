# Philosophical Deliberation: Error Statistics and Severe Testing

**Tradition:** Post-Popperian Philosophy of Experiment
**Key thinkers:** Deborah Mayo, Aris Spanos
**Created:** 2026-03-04
**Status:** Active
**Relationship to other frameworks:** Extends falsificationism (Popper) by operationalizing "severe tests" with error-statistical methods. Draws on pragmatist inquiry (Dewey) for its emphasis on learning from error. Complements Bayesian epistemology by providing a frequentist alternative for evidence evaluation.

## Core Ideas

Deborah Mayo's error-statistical philosophy, developed in *Error and the Growth of Experimental Knowledge* (1996) and *Statistical Inference as Severe Testing* (2018), attempts to cash out what Popper meant by "severe tests" — but in doing so, goes substantially beyond Popper in ways that matter for a self-improving system.

### Severity as the Central Concept

A claim is **severely tested** to the extent it has been subjected to and passed a test that probably would have found flaws, were they present. The severity of a test depends not on its logical structure (as Popper emphasized) but on its **error probabilities** — the probabilities of the test procedure leading to erroneous conclusions.

The severity principle: **We have evidence for a claim C just to the extent that C has been subjected to and passes a severe test — one where, with very high probability, the test would have produced a result that accords less well with C, if C were false.**

This is more precise than Popper's notion and more useful for practice. Popper says "subject your conjectures to severe tests" but never adequately explains what makes a test severe beyond the intuition that it should "try hard" to refute. Mayo formalizes this: a test is severe when the probability of passing it, given that the claim is false, is low.

### Learning from Error (not just Falsification)

Where Popper's framework is binary — a claim is either falsified or corroborated — Mayo's is graduated. A test result can provide:
- **Strong evidence for** a claim (the test was severe and the claim passed)
- **Weak evidence for** a claim (the test was not very severe — the claim would probably have passed even if false)
- **Evidence against** a claim (the claim failed a test)
- **No evidence either way** (the test was not probative)

This four-way distinction is absent from Popper. It matters because many of the "tests" a self-improving system performs are weak: "the signal didn't recur" is compatible with the fix working, but also with the conditions changing, the sensor drifting, or the relevant code not being touched. Mayo would say this test has low severity — the signal would probably not recur even if the fix were ineffective, because many other factors suppress recurrence.

### Content-Increasing Inference

In marked contrast with Popper, who deemed deductive inference to be the only legitimate form of inference, Mayo stresses the importance of **inductive, content-increasing inference**. You can learn genuinely new things from tests — not just that a conjecture survived, but *what the data tell you about the source of the results*. This is closer to Dewey's inquiry than to Popper's hypothetico-deductivism.

For a self-improving system, this means: when you check a claim against the codebase, the result teaches you something regardless of whether the claim survives. Finding the `update_resolved_signals` step doesn't just falsify "no automation exists" — it tells you the automation exists as agent instructions rather than programmatic code, which is a new and more precise understanding that neither the original claim nor its simple negation captures.

### Error Probabilities vs. Posterior Probabilities

Mayo explicitly distinguishes her approach from Bayesian epistemology. Bayesians ask: "Given the evidence, what should my degree of belief be?" Mayo asks: "Given the test procedure, would it have detected the error if present?" The first requires specifying prior probabilities (which is often arbitrary). The second requires understanding the test's error characteristics (which is empirically assessable).

For our purposes, both perspectives are useful. Bayesian updating is appropriate when we have meaningful priors (e.g., "agents usually follow long instruction sequences imperfectly"). Error-statistical severity is appropriate when we're assessing whether a specific test actually probes the claim we think it probes (e.g., "does grepping for `resolves_signals` actually test whether the automation fires?").

## Relevance to GSD Reflect

Mayo's framework addresses a specific problem that Popperian falsificationism leaves open: **how to evaluate the quality of a test, not just its outcome.** GSD Reflect performs many "tests" — verification-by-absence, signal recurrence checks, plan-vs-summary comparisons — but has no mechanism for assessing whether these tests are severe.

### The Severity Gradient

Different tests in the system have different severity levels:

| Test | What it checks | Severity | Why |
|------|---------------|----------|-----|
| Passive verification (no recurrence in N phases) | Did the fix prevent recurrence? | Low | Signal might not recur for many reasons unrelated to the fix |
| Signal recurrence detection (same pattern after fix) | Did the fix fail? | High | Recurrence despite fix is strong evidence of failure |
| Plan-vs-SUMMARY comparison | Did execution match the plan? | Medium | Deviations are detected, but not all deviations are failures |
| Code search for feature existence | Does the code exist? | Medium | Code existing doesn't mean it executes; code absent doesn't mean the function doesn't exist elsewhere |
| Agent instruction execution check | Did the agent follow the step? | High if checked against output artifacts | Agent skipping a step is directly detectable from missing artifacts |

The system currently treats all tests as equally probative. A severity-aware system would weight conclusions by the severity of the test that produced them.

### Operationalizing Severity for Deliberation

When the deliberation skill performs its "Severe Testing" step (checking claims against the codebase), Mayo's framework provides guidance on test quality:

1. **Ask: if this claim were false, would my test probably detect it?** If I search for `resolves_signals` and find nothing, that's a reasonably severe test (the feature would likely use that name). But if I search for "lifecycle update" and find nothing, that's less severe (the feature might use different terminology).

2. **Design tests that probe the claim's weakest point.** The claim "no automation exists" has a clear weakest point: the codebase might contain automation code. Searching for it is a severe test. The claim "the automation fires reliably" has a different weakest point: the agent might skip the step. Checking whether signals were actually updated is more severe than checking whether the code exists.

3. **Distinguish passing a severe test from passing a weak test.** A claim that passed a severe test (code was read, behavior was traced, output artifacts were checked) deserves higher confidence than one that passed a weak test (one grep returned no results).

## Concept Mapping

| Framework Concept | GSD Reflect Analog | Current State | Praxis Implication |
|---|---|---|---|
| **Severity** | Test quality in verification, deliberation claim-checking, signal recurrence | Not measured. All tests treated as equally probative. | Track test severity alongside test results. A verification "pass" after a weak test should carry lower confidence than one after a severe test. |
| **Error probabilities** | False positive/negative rates of sensors and verification | Not tracked. No sensor reports its error characteristics. | Sensors should declare their expected error profile: what they're good at detecting, what they miss, what false positives they generate. |
| **Content-increasing inference** | Learning from test results beyond binary pass/fail | Tests are binary: claim holds or doesn't. What was learned from the test is not captured. | When a claim is falsified (or corroborated), record what was learned beyond the binary outcome. The test may reveal more precise understanding. |
| **Minimal severity requirement** | Threshold below which a test result is not evidential | No threshold exists. Any test result is treated as evidence. | Establish a minimum severity standard: claims in the Evidence Base must survive at least one test where the error would probably have been detected. |

## Citable Principles

- `error-statistics/severity-principle` — Evidence for a claim requires that the test would probably have detected the error if present
- `error-statistics/test-severity-gradient` — Different tests have different probative value; weight conclusions accordingly
- `error-statistics/content-increasing-inference` — Tests teach you something regardless of outcome; capture what was learned, not just pass/fail
- `error-statistics/error-probability-awareness` — Tests have false positive and false negative rates; being aware of them improves interpretation
- `error-statistics/minimal-severity-threshold` — Below a certain severity, a test result is not evidence; don't treat it as such
- `error-statistics/probe-the-weakest-point` — Design tests that target where the claim is most likely to fail

## Relationship to Other Frameworks

**Complements falsificationism:** Mayo operationalizes what Popper meant by "severe tests" but adds the crucial ingredient Popper lacked — a method for assessing test severity. Where Popper says "try to falsify," Mayo says "here's how to tell if your test was actually trying."

**Extends pragmatist inquiry:** Dewey's inquiry cycle requires testing hypotheses, but doesn't specify what makes a good test. Mayo's severity concept provides the quality criterion for Deweyan experimentation.

**Contrasts with Bayesian epistemology:** Bayesians assess evidence through prior-to-posterior updating. Mayo assesses evidence through error probabilities. Both are useful; they answer different questions ("how much should I believe?" vs. "how probative was my test?").

**Connects to cybernetics:** A system that doesn't assess the severity of its own tests has a meta-observability gap — it doesn't know whether its observation apparatus is working. Mayo's framework enables second-order observation (observing the quality of observation).
