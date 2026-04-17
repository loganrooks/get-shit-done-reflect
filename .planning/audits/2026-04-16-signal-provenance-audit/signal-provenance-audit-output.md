---
date: 2026-04-16
audit_subject: process_review
audit_orientation: investigatory
audit_delegation: self
auditor_model: gpt-5
scope: "Why phase 57.6 signal collection misattributed provenance and version, and what signature split is required"
triggered_by: "manual: user request after $gsdr-collect-signals 57.6"
task_spec: signal-provenance-audit-task-spec.md
ground_rules: core+investigatory+process_review
output_files:
  - signal-provenance-audit-output.md
tags: [signals, provenance, telemetry, phase-57.6, process-review, investigatory]
---

# Audit Output: signal-provenance-audit

## Findings

### 1. The current signal provenance payload is a hybrid of different actors, so it cannot answer either "who did the work?" or cleanly "who wrote this signal?"

The signal schema defines `runtime` and `model` as signal-generation fields, not artifact-under-judgment fields. In [signal-detection.md](/home/rookslog/.codex/get-shit-done-reflect/references/signal-detection.md:183), the schema says:

> "`source` | enum: auto, manual | auto | Whether the signal was detected automatically or created manually"

and then in [signal-detection.md](/home/rookslog/.codex/get-shit-done-reflect/references/signal-detection.md:186):

> "`runtime` | ... | Runtime that generated this signal. Inferred from workflow file path prefix."

and in [signal-detection.md](/home/rookslog/.codex/get-shit-done-reflect/references/signal-detection.md:187):

> "`model` | string | (omitted) | LLM model identifier. Self-reported by the executing model."

The artifact sensor is explicitly instructed to stamp its own runtime/model into all candidates. [gsdr-artifact-sensor.toml](/home/rookslog/.codex/agents/gsdr-artifact-sensor.toml:53) says:

> "Before detecting signals, determine the runtime and model context"

and [gsdr-artifact-sensor.toml](/home/rookslog/.codex/agents/gsdr-artifact-sensor.toml:65) says:

> "Store both values for inclusion in all signal candidates created during this run."

The synthesizer then mixes in additional provenance from itself. [gsdr-signal-synthesizer.toml](/home/rookslog/.codex/agents/gsdr-signal-synthesizer.toml:252) says:

> "**Provenance fields:**"

with [gsdr-signal-synthesizer.toml](/home/rookslog/.codex/agents/gsdr-signal-synthesizer.toml:253):

> "`runtime` -- from sensor output if available"

and [gsdr-signal-synthesizer.toml](/home/rookslog/.codex/agents/gsdr-signal-synthesizer.toml:255):

> "`gsd_version` -- read from `$HOME/.codex/get-shit-done-reflect/VERSION` file; if not found, read from `.planning/config.json` `gsd_reflect_version` field"

Meanwhile the collect-signals workflow adds environment enrichment from the current writer environment. [collect-signals.md](/home/rookslog/.codex/get-shit-done-reflect/workflows/collect-signals.md:353) says:

> "**Enrichment fields for new signals:**"

and [collect-signals.md](/home/rookslog/.codex/get-shit-done-reflect/workflows/collect-signals.md:357):

> "`environment:`"

with [collect-signals.md](/home/rookslog/.codex/get-shit-done-reflect/workflows/collect-signals.md:360):

> "`config_profile: ... model_profile ...`"

The resulting frontmatter is visibly mixed. The committed signal [sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/knowledge/signals/get-shit-done-reflect/sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit.md:19) records:

> "`runtime: codex-cli`"

then [same file](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/knowledge/signals/get-shit-done-reflect/sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit.md:20):

> "`model: gpt-5.4`"

then [same file](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/knowledge/signals/get-shit-done-reflect/sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit.md:21):

> "`gsd_version: \"1.18.2+dev\"`"

and [same file](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/knowledge/signals/get-shit-done-reflect/sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit.md:24):

> "`environment:`"

This is not one provenance story. It is detector runtime/model, writer version lookup, and writer environment in one flat record.

What would disconfirm this finding? A spec showing that all three fields are intentionally defined as one role, or a signal file that separately records work provenance, detector provenance, and writer provenance. I found neither. The closest counter-evidence is that detector and writer were aligned in this run, so the hybrid payload did not visibly contradict itself on `runtime/model`. That does not solve the user's problem: it still says nothing reliable about the planner, executor, or verifier who produced the artifact under judgment.

### 2. The recorded `gsd_version` for the 57.6 signals is materially wrong for this workspace because source precedence favors a stale local tree over the installed harness and config

The signal frontmatter says [sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/knowledge/signals/get-shit-done-reflect/sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit.md:21):

> "`gsd_version: \"1.18.2+dev\"`"

That value matches the repo-local VERSION file, not the installed harness or config. The local checked-in copy says [.codex/get-shit-done-reflect/VERSION](/home/rookslog/workspace/projects/get-shit-done-reflect/.codex/get-shit-done-reflect/VERSION:1):

> "`1.18.2+dev`"

The installed Codex harness says [/home/rookslog/.codex/get-shit-done-reflect/VERSION](/home/rookslog/.codex/get-shit-done-reflect/VERSION:1):

> "`1.19.4`"

and project config says [.planning/config.json](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/config.json:39):

> `"gsd_reflect_version": "1.19.4+dev",`

The synthesizer spec hard-codes the precedence that caused this. [gsdr-signal-synthesizer.toml](/home/rookslog/.codex/agents/gsdr-signal-synthesizer.toml:255) says:

> "`gsd_version` -- read from `$HOME/.codex/get-shit-done-reflect/VERSION` file; if not found, read from `.planning/config.json` `gsd_reflect_version` field"

The runtime instruction is itself oriented toward "the harness that wrote the signal," not "the harness that produced the artifact being judged." Even on its own terms, the resulting value is wrong for this workspace because the writer used the stale repo-local mirror instead of the installed harness and the config fallback that already existed.

What would disconfirm this finding? Evidence that the local `.codex` tree is intentionally authoritative for this project and that signals are supposed to report repo-mirror version rather than installed-harness version. I found no such statement. The counter-evidence is only procedural: the system behaved according to its current precedence rule. That makes the result explainable, not correct.

### 3. Work-artifact signatures are partial and asymmetric, so mistakes cannot be tied reliably to planner, executor, verifier, or harness today

Execution summaries do record a model, but only partially. The summary template [summary-standard.md](/home/rookslog/.codex/get-shit-done-reflect/templates/summary-standard.md:1) begins:

> `---`

and [summary-standard.md](/home/rookslog/.codex/get-shit-done-reflect/templates/summary-standard.md:4) includes:

> "`model: [model-identifier]`"

That field appears in the real `57.6` summaries. For example [57.6-06-SUMMARY.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.6-multi-loop-coverage-human-interface-inserted/57.6-06-SUMMARY.md:4) says:

> "`model: gpt-5-codex`"

and [57.6-03-SUMMARY.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.6-multi-loop-coverage-human-interface-inserted/57.6-03-SUMMARY.md:4) says:

> "`model: gpt-5`"

But plan artifacts do not carry an equivalent planner signature. The phase prompt template [phase-prompt.md](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/templates/phase-prompt.md:16) starts:

> "`phase: XX-name`"

and [phase-prompt.md](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/templates/phase-prompt.md:18) continues:

> "`type: execute`"

There is no planner `model`, `vendor`, `reasoning`, or harness field in the plan frontmatter. The real plan reflects that absence: [57.6-04-PLAN.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.6-multi-loop-coverage-human-interface-inserted/57.6-04-PLAN.md:1) begins:

> "`---`"

and [57.6-04-PLAN.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.6-multi-loop-coverage-human-interface-inserted/57.6-04-PLAN.md:4) is already:

> "`type: execute`"

The plan schema confirms this omission is structural rather than accidental. [frontmatter.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/frontmatter.cjs:329) says:

> "`plan: { required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'] }`"

while [frontmatter.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/frontmatter.cjs:330) says:

> "`summary: { required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed'] }`"

So the summary `model` field exists by template convention, not by schema requirement, and the plan has no equivalent signature at all.

Verification is even looser. The verifier report only says [57.6-VERIFICATION.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.6-multi-loop-coverage-human-interface-inserted/57.6-VERIFICATION.md:94):

> "`_Verifier: Claude (gsdr-verifier)_`"

This tells the reader neither exact model nor reasoning configuration.

The missing data is not entirely unknowable. At orchestration time the system resolves role-level models. [init.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/init.cjs:333) says:

> "`planner_model: resolveModelInternal(cwd, 'gsd-planner'),`"

and [init.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/init.cjs:334) says:

> "`executor_model: resolveModelInternal(cwd, 'gsd-executor'),`"

with [init.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/init.cjs:336):

> "`verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),`"

So the problem is not merely unavailable information. It is failure to persist a durable, role-aware signature onto the artifacts.

What would disconfirm this finding? A uniform artifact signature block already present across PLAN, SUMMARY, VERIFICATION, and related workflow outputs. I did not find one. The only meaningful counter-evidence is that chat logs and commit history may sometimes let a human reconstruct provenance after the fact. That is forensic recovery, not stable artifact semantics.

### 4. Telemetry already exposes much of the desired signature data, so the main gap is canonicalization and persistence, not total observability

The measurement telemetry layer already knows how to carry provenance-rich identity fields from runtime logs. The Claude runtime identity extractor [runtime.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/runtime.cjs:208) builds:

> "`function buildSessionIdentityValue(claude, session) {`"

and then [runtime.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/runtime.cjs:211) records:

> "`runtime: 'claude-code',`"

with [runtime.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/runtime.cjs:214):

> "`model: exposedField(`"

and [runtime.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/runtime.cjs:230):

> "`gsd_version: derivedField(`"

plus [runtime.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/runtime.cjs:236):

> "`profile: derivedField(`"

The Codex runtime metadata extractor does the same kind of work. [codex.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/codex.cjs:202) records:

> "`gsd_version: derivedField(`"

then [codex.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/codex.cjs:208):

> "`profile: derivedField(`"

and [codex.cjs](/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/measurement/extractors/codex.cjs:229):

> "`// agent_performance: reasoning_effort + sandbox_policy ARE reasoning-effort stratification`"

The phase itself already interpreted these as provenance-bearing fields. In [57.6-01-TAG-JUSTIFICATION.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.6-multi-loop-coverage-human-interface-inserted/57.6-01-TAG-JUSTIFICATION.md:9) the justification says:

> "`value.model` and derived `value.profile` already carry the model/profile provenance axis this loop needs for attribution."

and in [57.6-01-TAG-JUSTIFICATION.md](/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.6-multi-loop-coverage-human-interface-inserted/57.6-01-TAG-JUSTIFICATION.md:17):

> "`reasoning_effort`, `sandbox_policy`, `model`, and derived `profile` provide the Codex runtime stratification variables for agent-performance attribution."

So the user's hope is well grounded: telemetry probably can expose a large fraction of the signature the user wants. The gap is that the workflow does not yet normalize that telemetry into artifact signatures or split signal provenance into separate roles.

What would disconfirm this finding? Proof that runtime logs do not actually expose usable model/reasoning/version data in practice. The counter-evidence here is partial: telemetry coverage is runtime-specific and asymmetric, and artifact signatures like planner provenance may still be absent unless captured at orchestration time. That limits what can be recovered from logs alone.

## Position of the Investigation

This investigation was conducted from inside the workflow implementation, with a bias toward durable schema semantics rather than ad hoc human reconstruction. That means it attended strongly to frontmatter definitions, workflow instructions, and existing telemetry structures. A differently-situated investigation might focus more on the actual raw session corpora first and ask what provenance is empirically extractable before recommending schema change. I judged the workflow/spec layer first because the user's complaint was that the committed signals themselves tell the wrong story.

## Competing Explanations

Two explanations remained live throughout the audit:

1. The signals are "wrong" because the schema was always intended to describe detector/writer provenance, and the user's expectation of work-artifact provenance exceeds the current design.
2. The signals are "wrong" because even within the current design they mix incompatible provenance sources and choose bad source precedence, so they fail on their own stated terms.

The evidence supports both, but not equally. Explanation 1 is true at the design level: the schema text does define `runtime/model` as signal-generation provenance. Explanation 2 is also true and more operationally damaging: the written records combine detector runtime/model, writer version lookup, and writer environment into one flat payload, so even the signal-generation story is internally mixed.

## What Remains Unknown

- Whether Claude and Codex chat logs can provide a uniform, canonical signature for every workflow role, especially planners and verifiers, or whether some roles will still require orchestration-time signing.
- Whether the correct unit of "work provenance" for a signal should be a single block or an array of implicated artifact signatures. A signal about Plan 06 may need planner provenance, executor provenance, and verifier provenance simultaneously.
- Whether existing reflection/dedup consumers assume `runtime/model/gsd_version` mean one coherent thing. If they do, splitting the field set may require coordinated migration rather than additive extension only.

## Recommendations

1. **Split signal provenance into explicit roles.** A signal should carry at least:
   - `about_work[]`: signatures for the artifacts or workflow roles being judged
   - `detected_by`: the sensor/runtime/model/vendor/harness/reasoning that detected the signal
   - `written_by`: the synthesizer/runtime/model/vendor/harness/reasoning that persisted the signal

2. **Promote artifact signatures to first-class frontmatter across workflow artifacts.** PLAN, SUMMARY, VERIFICATION, and other authoritative artifacts should each carry a canonical signature block, not a lone `model:` field. The minimum useful shape is:
   - `role`
   - `harness`
   - `platform`
   - `vendor`
   - `model`
   - `reasoning_effort` or equivalent
   - `profile`
   - `gsd_version`
   - `generated_at`
   - `session_id` / `thread_id` / `agent_id` when available
   - `provenance_status` or per-field `exposed/derived/not_available`

3. **Treat telemetry as a source, not the whole answer.** Reuse runtime telemetry for fields the logs actually expose, but keep the existing `exposed/derived/not_available` discipline. Where logs are silent, sign at orchestration time instead of fabricating certainty later.

4. **Do not treat the current 57.6 signal frontmatter as evidence about who made the underlying mistakes.** The nine committed signals may still contain useful substantive observations, but their `runtime/model/gsd_version` fields are not reliable for attributing planner/executor/verifier responsibility.

5. **Fix version precedence separately from provenance splitting.** Even after role-splitting, the writer-side version lookup should prefer the active installed harness or explicit config over a stale repo-local mirror when the goal is to say what harness actually wrote the record.

## What the Obligations Didn't Capture

The obligations were well suited to the workflow/schema failure, but they do not themselves force a design choice about the unit of attribution. The most important excess here is not merely "wrong provenance" but "ambiguous object of provenance." A signal can be about a plan flaw introduced by one model, executed by another model, detected by a third component, and written by a fourth. The obligations helped surface the mismatch, but they do not tell us whether the right representation is one signature per artifact, one per workflow role, or a graph of signatures. That is a follow-on design problem, not something this audit can settle by epistemic discipline alone.

## Rule 5: Did the Framing Shape What I Found?

If this had been framed as `artifact_analysis` instead of `process_review`, I would have spent more time clustering all nine signal files and less time inspecting the workflow instructions that produced them. That alternate audit would likely have produced a stronger statement about recurring corpus shape, but a weaker explanation of why the wrong fields were written in the first place.

If this had been framed as `standard` instead of `investigatory`, I would have closed too quickly on "the signals are wrong because `gsd_version` is stale." The investigatory frame kept open the more important finding that the current payload is structurally mixed even before the version bug is considered.

What the current classification made me prepared to notice was methodology drift between schema text, sensor prompts, and synthesizer behavior. What it made me less prepared to notice was the full richness of what raw telemetry might already expose in practice. A telemetry-first audit could still add something important here, especially around which signature facets are already recoverable from chat logs without new artifact fields.
