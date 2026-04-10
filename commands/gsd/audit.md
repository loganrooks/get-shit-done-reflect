---
name: gsd:audit
description: Dispatch a 3-axis audit (subject × orientation × delegation) with composed obligations. Reads conversation context, infers classification, writes task spec, dispatches gsdr-auditor or cross-model.
argument-hint: '"topic" [--auto] [--subject X] [--orientation Y] [--delegation Z] [--continue <session>]'
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
Create, classify, and dispatch an audit. **This command IS the orchestrator** — the same pattern `commands/gsd/audit-milestone.md` line 16 names verbatim: "This command IS the orchestrator." It does discovery, classification, obligation composition, task spec writing, session directory creation, and dispatch. It does not delegate the thinking to a workflow file or to a sub-agent layer; all logic lives inline here, following the `deliberate.md` precedent of keeping rich mode detection and context inference in the command body itself.

The command reads conversation history for context clues, proposes a 3-axis classification — subject × orientation × delegation — and asks 0–2 clarifying questions if the classification is ambiguous. It then composes obligations from the axis contributions per the rewritten `audit-ground-rules.md` (Core Rules 1–5, orientation obligations for the chosen stance, subject obligations when a subject is named, and cross-cutting obligations triggered by chain predecessors, cross-model delegation, or non-standard orientation). It creates a session directory per the naming convention in `audit-conventions.md` Section 1, writes a fully-formed task spec with **every composed obligation copied in verbatim** (per DC-2 — "the agent needs the rules in its context window, not a pointer to them"), and dispatches either the `gsdr-auditor` agent via `Task()` (self delegation, recommended) or `codex exec` (cross_model delegation, experimental).

The agent — or the external model — receives a fully-formed spec and runs the audit. This is the spike-runner pattern applied to audits: the orchestrator does the framing work once so the executor can focus entirely on the situated inquiry. The command's philosophical character is worth naming: the 3-axis model is a hermeneutic reconstruction of what audits actually are, not a rigid schema. Context inference is deliberately light — it reads the situation, not a state machine. When the situation exceeds the current decomposition, that excess is itself a finding, captured by the mandatory "What the Obligations Didn't Capture" section in every audit output and by the axis-level escape hatch documented in `audit-conventions.md` Section 3.4.
</objective>

<execution_context>
@~/.claude/get-shit-done/references/audit-conventions.md
@~/.claude/get-shit-done/references/audit-ground-rules.md
</execution_context>

<context>
Arguments: $ARGUMENTS

**State and configuration:**
@.planning/STATE.md
@.planning/config.json

**Authority for the 3-axis model (read when designing the classification for an ambiguous situation):**
@.planning/deliberations/audit-taxonomy-three-axis-obligations.md
@.planning/deliberations/audit-taxonomy-retrospective-analysis.md

**Canonical precedent for cross-model dispatch:**
@.planning/audits/2026-04-09-discuss-phase-exploration-quality/codex-review-task-spec.md
</context>

<process>

## Mode Detection

Parse `$ARGUMENTS`:

- **`--continue <session-slug>`** — resume an existing session. Find the session directory at `.planning/audits/YYYY-MM-DD-{session-slug}/` (search by slug; if multiple dates match, pick the most recent). Read the existing task spec file. If an `{slug}-output.md` already exists, present it and ask whether to re-dispatch (overwriting) or report status only. If no output exists, re-dispatch using the existing task spec verbatim — do NOT re-derive classification.
- **Free-text topic** (e.g., `"something went wrong with Phase 57 — the plans keep missing requirements"`) — new audit; use the topic as the starting point for context inference (Step 1).
- **No arguments** — check the current conversation for context clues. Summarize what you understand the audit topic to be and confirm with the user. This is the `deliberate.md` Step 1 lines 55–62 pattern: "If no arguments: check the current conversation for context first. The user may have been discussing something that naturally led here. Summarize what you understand the topic to be and confirm."
- **Flags** that may accompany a topic:
  - `--auto` — non-interactive mode. No clarifying questions. If classification is ambiguous, proceed with the highest-confidence draft and record the ambiguity in the fit assessment.
  - `--subject <name>` — explicit subject override (skip Step 1's subject inference).
  - `--orientation <standard|investigatory|exploratory>` — explicit orientation override.
  - `--delegation <self|cross_model:{model_id}>` — explicit delegation override.
  - `--trust-cross-model` — required for `--auto` + `cross_model` delegation per Step 7 Path B (experimental opt-in).

Argument parsing is deliberately flexible per CONTEXT.md "Claude's Discretion." Do not build a rigid parser — read the arguments and route appropriately.

## Step 1: Context Inference

If the mode is "new audit" and the user has not provided all three axes via explicit flags, read the current conversation history for clues and produce a draft classification.

**Clue → classification mapping** (adapted from RESEARCH.md §"Pattern 5: Context inference"):

| Context clue | Suggested classification |
|---|---|
| "what happened", "how did we end up here", "something went wrong", "doesn't match what I expected", "I want to understand before fixing" | `investigatory` orientation; subject often optional |
| "I'm curious", "I wonder", "what patterns exist" | `exploratory` orientation; subject may or may not be known |
| "did Phase N achieve its goal", "verify", "check whether", "pass or fail" | `standard` orientation |
| "run tests", "check wiring", phase number | `phase_verification` subject |
| "requirements coverage", "requirement specificity", "missing requirements" | `requirements_review` subject |
| "quality comparison", "across outputs", "better than", "which is higher quality" | `comparative_quality` subject |
| "get GPT/Codex/another model to" | `cross_model` delegation |
| Patterns across many artifacts without code focus | `artifact_analysis` subject |
| Methodology or workflow concern | `process_review` subject |
| "how claims hold up", "what's cited properly" | `claim_integrity` subject |
| "does practice match the docs", "is everyone following" | `adoption_compliance` subject |
| "cross-phase integration", "end-to-end" | `milestone` subject |
| "the code is doing X" (no docs frame) | `codebase_forensics` subject |

Read `.planning/STATE.md` to anchor the situation in current phase, current milestone, any active blockers, and recent decisions. If the user's topic references a phase or milestone explicitly, that anchor is high-signal for the subject axis.

Produce a draft classification as a tuple: `(subject, orientation, delegation)`. For investigatory or exploratory orientations, the subject may be `null` (omitted) when no named subject cleanly fits — per `audit-conventions.md` Section 3.1 "Subject is optional for `investigatory` and `exploratory` orientations," the investigation discovers its subject.

Default delegation is `self` unless the user explicitly invokes a cross-model path.

## Step 2: Classify with 0-2 Clarifying Questions

If the draft classification is confident — all three axes clearly grounded in conversation or explicit flags — proceed directly to Step 3 without asking anything.

If ambiguous, ask 0-2 clarifying questions via `AskUserQuestion`. **Do NOT ask more than 2** — per CONTEXT.md "Claude's Discretion: how many clarifying questions (0-2 based on context sufficiency)." Questions should target the single most load-bearing ambiguity: is this investigatory (something broke) or standard (routine check)? Is there a specific subject or is this subject-less exploration? Is the user specifically asking for a second model's perspective?

In `--auto` mode, skip clarifying questions entirely. Proceed with the highest-confidence draft and note the unresolved ambiguity in the fit assessment below.

Produce a final classification. If the classification doesn't cleanly map to the 9 subjects in `audit-conventions.md` Section 3.1, consider omitting the subject axis and marking `audit_orientation: investigatory` or `exploratory`. Forcing a subject that doesn't fit is the v1 failure mode the 3-axis model was reconstructed to avoid.

Write a **fit assessment** — a brief paragraph (2-4 sentences) explaining why this classification was chosen, what about the situation led to each axis, and where the auditor should feel free to expand or depart from the classification if the investigation warrants. The fit assessment goes into the task spec body (Step 5) and gives the auditor an honest starting orientation rather than a rigid dispatch. This is where the orchestrator's reading of the situation becomes visible to the executor.

## Step 3: Complexity Assessment (template territory vs. obligations territory)

Read the classification from Step 2 and assess complexity. Per `audit-conventions.md` Section 4.1, audits fall into three populations:

- **Population 1 — standard routine audits.** A known subject, a known comparison point, and an expectation of closure. `phase_verification × standard × self` is the paradigm case. Template territory: the suggested scaffolds from `audit-conventions.md` Section 4.3 are available and appropriate. The obligations still apply (obligations compose under templates too), but the body can start from a scaffold the auditor is free to depart from.

- **Population 2 — investigatory, exploratory, or multi-axis audits.** A subject that may not be known at dispatch time; an orientation that refuses premature closure; or obligations from multiple axes that the auditor must navigate. Templates fail here structurally — two templates cannot merge, so obligations replace them. Task spec (Step 5) says "address these obligations" not "fill these sections."

- **Population 3 — multi-agent parallel dispatch.** Deferred per CONTEXT.md Q3. If the user's situation looks like Population 3 (e.g., "run three separate audits in parallel and compare"), warn them that obligation enforcement at the sub-agent level is not yet implemented, and offer to proceed with self-delegation single-agent instead.

This assessment is light. **Do NOT build a state machine or scoring rubric.** Read the classification, note which population it falls into, and carry that into Step 5 (template territory gets scaffold hints; obligations territory gets the flat obligation list). An audit can shift populations mid-flight — a `codebase_forensics × standard` audit that uncovers something unexpected may become investigatory; the orchestrator doesn't enforce a partition, it just hints at the starting shape.

## Step 4: Compose Obligations

Read `audit-ground-rules.md` (already rewritten by Plan 02 — the v2 Section 3 is the source). Compose the obligation set for this audit by walking each source and adding its contributions to a flat list:

- **Core obligations (always applied, no conditions):** Rules 1–5 from Section 1. Rule 1 (cite evidence), Rule 2 (test disconfirmation), Rule 3 (distinguish measure from measured), Rule 4 (escape hatch — Section 2), Rule 5 (frame-reflexivity — Section 1). Rule 5 carries three specific grounding questions that must be copied verbatim into the task spec; do not paraphrase them, and do not omit them when orientation is `standard` (Rule 5 is a core rule, not an investigatory extension).

- **Orientation obligations:** one of the three sets from Section 3.1:
  - `standard` → the three closure obligations ("close on findings with evidence," "produce a clear verdict," "address all items in scope").
  - `investigatory` → I1, I2, I3, I4 verbatim from Section 3.1's investigatory block (the phrasing is load-bearing per `audit-ground-rules.md` — do not paraphrase), plus the two additional investigatory obligations ("show what remains unknown," "show how you navigated any tensions between obligations").
  - `exploratory` → all six exploratory obligations (state the question; follow it; name what you found you weren't looking for; name what the exploration opened; name what you didn't look at; "I don't know yet" is valid).

- **Subject obligations:** if a subject is named, pick the matching row from `audit-ground-rules.md` Section 3.2 (9-subject table). Copy the obligations text from that row in full. If the subject is omitted (investigatory / exploratory without a named subject), skip this source entirely — subject obligations come online only if a subject is identified mid-audit.

- **Cross-cutting obligations** (conditional):
  - **Chain integrity** (Section 3.3) — include if the user's topic references a prior audit's finding, OR if `predecessor_audits:` will be populated in the frontmatter. Triggered by dependency, not by orientation or subject.
  - **Dispatch hygiene** (Section 3.3) — include if `audit_delegation` is `cross_model:{model_id}`. Also include if the audit will involve multi-agent parallel dispatch (relevant even within a single model).
  - **Framework invisibility** (Section 3.3) — include if orientation is `investigatory` or `exploratory`. Strongly encouraged but not required for `standard`. When included, the specific grounding question must be copied verbatim into the task spec ("Name a concrete finding that would not appear no matter how rigorously this audit was conducted, because of how this audit's scope was framed...").

The composed obligation set is a **flat list**. Per the Section 3 opening prose of `audit-ground-rules.md`: "These do not form a hierarchy. They form a set the auditor must engage with." When the set lands in the task spec (Step 5), include the composition principle (Section 5) too — the auditor may encounter tensions between obligations and must navigate them per the hermeneutic principle rather than by a precedence rule.

## Step 5: Write Task Spec

Create the task spec file at `$SESSION_DIR/{slug}-task-spec.md` (the session directory is created in Step 6 — file writing uses the same path; Steps 5 and 6 are ordered as "compose content → create dir → write file" in practice).

**Required task spec structure** — follows the shape from RESEARCH.md §"Pattern 3: Rule copying" and `audit-ground-rules.md` Section 4 (the surviving meta-rule "Copy the rules — do not reference by URL, since the agent needs the rules in its context window, not a pointer to them"):

```markdown
---
date: YYYY-MM-DD
audit_subject: {subject or omitted when null}
audit_orientation: {standard|investigatory|exploratory}
audit_delegation: {self|cross_model:{model_id}}
scope: "{user's topic, verbatim or near-verbatim}"
auditor_model: {sonnet for self delegation, {model_id} for cross_model}
triggered_by: "user: /gsdr:audit invoked with {arguments}"
task_spec: {slug}-task-spec.md
ground_rules: "core+{orientation}+{subject if named}{+chain|+dispatch|+framework-invisibility as triggered}"
predecessor_audits: {list if chain integrity is triggered, else omit}
tags: [{slug-derived tags}]
output_files:
  - {slug}-output.md
---

# Audit Task Spec: {slug}

**Date:** YYYY-MM-DD
**Classification:** {subject} × {orientation} × {delegation}
**Fit assessment:** {Step 2's paragraph — why this classification, where the auditor should feel free to expand}

## Epistemic Ground Rules

### Core Rules (every audit)

1. **Every factual claim cites file:line and quotes the relevant passage.** Do not assert what a file contains without opening it. Do not summarize without quoting.

2. **For every finding, BEFORE writing it, ask "What would disconfirm this?" and CHECK.** This is not a rhetorical question. Actually look for counter-evidence before committing the finding. If you cannot find disconfirming evidence, note what you searched and why you didn't find it — not finding counter-evidence is different from there being none.

3. **Distinguish what you measured from what the measure captures.** Every measurement is a proxy. Name the gap between your metric and the thing you care about.

4. **Rule 4 (escape hatch): What did you encounter that these ground rules didn't prepare you for?** This rule is an invitation, not enforcement. It ensures the ground rules do not become a ceiling on rigor. If your answer to Rule 4 is "nothing," that may be accurate — or it may indicate the ground rules shaped your attention so thoroughly that you didn't notice what they excluded. Consider the possibility before answering.

5. **Rule 5 (frame-reflexivity): Did the framing shape what you found?** [Lightweight closing step for `standard` orientation — 1–3 sentences. Full section for `investigatory`. Woven into "name what you didn't look at" for `exploratory`.]

   *Specific grounding questions to answer (copy verbatim — generic prompts about "bias" produce compliance theater):*
   1. "If this audit had been classified as a different subject (e.g., `{alternative subject}` instead of `{current subject}`), what would it have looked for that you didn't? What findings would that audit have produced that yours doesn't?"
   2. "If this audit had been classified with a different orientation (e.g., `investigatory` instead of `standard`), what would it have held open that you closed? What would it have investigated that you accepted?"
   3. "What about the current classification shapes what you are prepared to notice and what you are not? Name one concrete example."

   **Anti-performativity warning:** If your answer to Rule 5 is "nothing" or "I considered my biases" without a concrete consequence visible in the findings, **Rule 5 has not been engaged with — it has been performed**. An empty Rule 5 is not neutral. It is a signal that the frame is invisible to the auditor, which is exactly the failure mode the rule exists to catch. If the specific questions above produce only empty answers after genuine engagement, write that result and name why no alternative reading surfaces — that too is a finding.

### Orientation Obligations ({orientation})

[Copy the orientation obligations from `audit-ground-rules.md` Section 3.1 in full. For `investigatory`: copy I1–I4 verbatim (phrasing is load-bearing), plus "show what remains unknown" and "show how you navigated any tensions between obligations." For `exploratory`: all six exploratory obligations with their "why this matters" paragraphs. For `standard`: the three closure obligations with their "why this matters" paragraphs.]

### Subject Obligations ({subject})

[If subject is named: copy the matching row from `audit-ground-rules.md` Section 3.2 in full. If subject is omitted (investigatory/exploratory with no named subject), skip this block entirely and note in a short paragraph: "No subject is named for this audit. Core + orientation obligations are the full obligation set. If a subject is identified mid-audit, apply its obligations from that point forward and note the identification as a finding."]

### Cross-cutting Obligations

[Include each of the following only if triggered by Step 4's composition:]

[**Chain integrity** — if triggered: copy the full obligation text from `audit-ground-rules.md` Section 3.3 — "For each finding that depends on a predecessor audit's claim, re-verify that claim independently before incorporating it. State the re-verification or state why it was not done." Include the "why this matters" paragraph about propagation of quality failures through chains.]

[**Dispatch hygiene** — if `audit_delegation: cross_model:*` or multi-agent parallel: copy the full obligation text from Section 3.3 — "For `cross_model` delegation, verify that the delegation prompt does not include framing that could systematically bias findings (comparative framing, target counts, desired conclusions). If the comparison is intentional, note it explicitly in the audit frontmatter as a confound." Include the "why this matters" paragraph about the session-log audit's ~50% framing-effect inflation finding.]

[**Framework invisibility** — if orientation is investigatory or exploratory (or optionally for standard): copy the full obligation text from Section 3.3, including the specific grounding question verbatim: *"Name a concrete finding that would not appear no matter how rigorously this audit was conducted, because of how this audit's scope was framed. If you can't name one, that's suspicious — the framework is probably hiding something from you that it's also hiding from itself."* Include the relationship paragraph distinguishing framework invisibility from I4 and Rule 5 (I4 is about the auditor, Rule 5 is about the classification, framework invisibility is about the structural edges of what the audit can see).]

## The Situation

[What the user asked — verbatim or near-verbatim topic. What the command inferred from conversation context. Why this classification was chosen (duplicates fit assessment for emphasis at the point of engagement). Any relevant anchor from STATE.md — current phase, current milestone, active blockers. If the audit has predecessor audits, list them here and note that chain integrity applies.]

## What Must Appear in the Output

- **All obligations addressed.** Not necessarily as named sections — obligations are things to engage with, not containers to fill. The auditor weaves them into the narrative wherever they emerge naturally.
- **"What the Obligations Didn't Capture" section** — mandatory in every audit output per `audit-conventions.md` Section 4.2. This is the structural opening for excess: findings that do not fit any obligation, any template, any expected shape. If this section is consistently substantial for a kind of audit, that is empirical evidence for a new subject, orientation obligation, or missing axis.
- **Rule 5 frame-reflexivity closing step.** Lightweight (1–3 sentences) for `standard` orientation, full section for `investigatory`, woven into "name what you didn't look at" for `exploratory`. The specific grounding questions above must be answered with concrete examples, not performatively.
- **For `investigatory`:** a "Position of the Investigation" section engaging I4 — name where the investigation is conducted from, what it is prepared to notice, what a differently-situated investigation would attend to.
- **For `investigatory` or cross-axis audits:** if tensions emerged between obligations during the audit, a "How I navigated tensions" section per the composition principle below. If no tensions emerged, that itself is a note worth making (and a red flag per RESEARCH.md Pitfall 3 — tensions collapsing to clean resolution is the failure mode).

## Composition Principle (read if tensions emerge)

Obligations from different axes compose into a flat list. They do not form a hierarchy. When obligations tension against each other, the auditor must not pick a winner. The auditor must:

1. **Name the tension.** Say what the two (or more) obligations are and how they pull differently *in this situation*. Not abstractly — concretely. Example: "I2 says follow the evidence, S-process-review says compare against spec, and the spec is what I suspect is wrong, so obeying S would close off what I1 asks me to hold open."

2. **Name what about the situation creates it.** The tension is not abstract; it is occasioned by particulars. What about *this* audit makes the obligations tension? Another investigation in the same subject might have no tension at all.

3. **Show how you navigated it.** Responsive to both demands, not cleanly picking one side. The navigation is part of the finding — the reader needs to see both the reasoning and the fact that the reasoning was not a clean resolution.

4. **The resolution emerges from engagement** with the situation, not from a precedence rule applied in advance. If you can write down in advance what would resolve every tension between these obligations, you haven't understood the principle — or the obligations can be collapsed to one, which is evidence that the framework is over-specified.

This is a **hermeneutic principle, not an algorithmic one.** Per `audit-taxonomy-three-axis-obligations.md` line 164: "If you find yourself cleanly ignoring one obligation in favor of another, you've likely stopped engaging with the tension." The sign of engaged composition is not a clean resolution — it is a navigated one, where both obligations leave traces in the finding.

## Output File

Write the audit output as a markdown file to: `$SESSION_DIR/{slug}-output.md`

Do not ask for confirmation. Write the file, then report completion.
```

**Critical DC-2 rule:** copy the ground rules and obligations into the task spec body verbatim. Do NOT write `See audit-ground-rules.md Section X`. The agent (or Codex session) needs the rules in its context window, not a pointer. Under the obligations paradigm, the composition is the thing that lands in the executor's context — not a template for the composition.

## Step 6: Create Session Directory

Per `audit-conventions.md` Section 1 (Directory Structure — surviving content), the canonical location is `.planning/audits/YYYY-MM-DD-{slug}/`. Slug is kebab-case (lowercase, hyphens, max 50 characters), derived from the audit topic.

```bash
SLUG=$(echo "{audit topic summary}" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | cut -c1-50)
DATE=$(date +%Y-%m-%d)
SESSION_DIR=".planning/audits/${DATE}-${SLUG}"
mkdir -p "$SESSION_DIR"
```

Then write the task spec composed in Step 5 to `$SESSION_DIR/${SLUG}-task-spec.md` using the Write tool. The frontmatter uses the v2 schema from `audit-conventions.md` Section 2 (audit_subject, audit_orientation, audit_delegation, not audit_type). The `audit_type` legacy field is not set for new audits (it exists only for backward compatibility with migrated v1 artifacts).

## Step 7: Dispatch

Two paths based on `audit_delegation`:

### Path A: Self delegation (default, recommended)

Dispatch the `gsdr-auditor` agent via the Task tool. The prompt is the full task spec contents — read the file with the Read tool, then pass its contents as the prompt:

```
Task(
  subagent_type="gsdr-auditor",
  prompt="<full contents of ${SESSION_DIR}/${SLUG}-task-spec.md>",
  description="Run {orientation} audit: {scope}"
)
```

The agent receives the composed obligations, the fit assessment, the situation description, and the output file path as one coherent spec. It executes the audit and writes the output file at the path specified in the task spec's "Output File" section. Self delegation is the recommended path — it has been the working pattern for all GSD agent dispatches and does not carry the experimental risk of cross-model.

### Path B: Cross-model delegation (experimental — warn user)

**BEFORE dispatching cross_model, present this warning to the user:**

> **Cross-model dispatch is experimental.** Known problems include environment setup issues, agents finishing early, instructions not properly conveyed, and output files not being written. This codebase has **zero automated precedent** for `codex exec` dispatch from a command (verified in RESEARCH.md §Q2) — only manual invocations documented in audit artifacts and one working shell script in `.planning/spikes/008-cross-runtime-otel-and-bridge-validation/run-codex-otel.sh`. The dispatch ships as experimental pending a post-implementation spike that validates reliability across realistic task-spec sizes. We recommend `--auto` is **NOT** used for cross_model until that spike lands. Continue? [y/N]

In **interactive mode**, present the warning and wait for user confirmation before proceeding.

In **`--auto` mode**, require an explicit `--trust-cross-model` flag. If the flag is absent when both `--auto` and `audit_delegation: cross_model:*` are set, **abort** with a message:

> `/gsdr:audit` aborted: `--auto` with `cross_model` delegation requires `--trust-cross-model` (experimental opt-in). Either run interactively so the warning can be acknowledged, or pass `--trust-cross-model` if you understand the experimental status. See RESEARCH.md §Q2.

If the user confirms (or `--trust-cross-model` is set in `--auto` mode), dispatch via `codex exec` following the pattern from RESEARCH.md §"Example 5: Cross-model dispatch invocation":

```bash
TASK_SPEC_PATH="${SESSION_DIR}/${SLUG}-task-spec.md"
OUTPUT_PATH="${SESSION_DIR}/${SLUG}-output.md"
LOG_PATH="${SESSION_DIR}/codex-dispatch.log"

# Build the prompt: inline the full task spec contents (not a file path), state the
# working directory explicitly, specify the output path, refuse conversational return.
PROMPT=$(cat <<EOF
You are executing an audit task. Read your full task spec below, then perform the audit.

Working directory: $(pwd)

Task spec contents (follow these instructions to the letter):
---
$(cat "$TASK_SPEC_PATH")
---

When you are done, write your audit output as a markdown file to:
$OUTPUT_PATH

Do not ask for confirmation. Do not provide a summary on stdout. Write the file, then exit.
EOF
)

codex exec "$PROMPT" 2>&1 | tee "$LOG_PATH"

if [ -f "$OUTPUT_PATH" ]; then
  echo "Cross-model audit complete: $OUTPUT_PATH"
else
  echo "FAIL: Codex did not write output file. See $LOG_PATH for diagnostics."
  echo "This is a known failure mode for experimental cross_model dispatch. See RESEARCH.md §Q2."
  exit 1
fi
```

**Why these specific safeguards** (per RESEARCH.md Pitfall 4 — cross-model dispatch failure modes):

1. **Inline task spec as prompt, not a file path.** Isolates dispatch from any "did Codex read the file correctly?" failure mode.
2. **Explicit working directory in the prompt.** Codex may default to a different cwd than the Claude Code session.
3. **Explicit absolute output path.** Prevents Codex from writing to an unexpected location or not writing at all.
4. **Tee stdout to a dispatch log.** If dispatch fails, the log is the only diagnostic available — no return values from `codex exec`.
5. **Existence check on output file.** The only reliable signal that dispatch succeeded; `codex exec` exit code alone is not trustworthy.
6. **Exit with diagnostic on failure.** Surfaces the failure mode to the user with a pointer to RESEARCH.md §Q2, not a silent success.

```
# TODO (Q2 spike candidate): cross-model dispatch reliability is unmeasured.
# Post-implementation, design a spike that dispatches 5-10 audit task specs
# of varying complexity via codex exec and measures dispatch success, output
# correctness, latency, and failure modes. Until the spike lands, cross_model
# ships with experimental flag and interactive-mode default. See RESEARCH.md §Q2.
```

## Step 8: Collect Output and Report

After the dispatch returns:

- **Self delegation:** the Task tool returns the agent's response. Verify that `${SESSION_DIR}/${SLUG}-output.md` exists on disk — the agent is expected to write the file rather than return the audit as its response text. If the file is missing, read the agent's return text to diagnose, and either re-dispatch or report the failure.
- **Cross-model delegation:** verify `${SESSION_DIR}/${SLUG}-output.md` exists via `ls` or Read. If missing, report the failure per Step 7 Path B's exit path — do not attempt to reconstruct the audit from the dispatch log.

Write a brief completion report to the user:

```
───────────────────────────────────────────────────────────────

## Audit: {scope}

**Session:** ${SESSION_DIR}
**Classification:** {subject} × {orientation} × {delegation}
**Obligations composed:** core (5 rules) + {orientation} ({N} obligations) + {subject or "no subject"} + {cross-cutting obligations triggered}
**Output:** ${SESSION_DIR}/${SLUG}-output.md

**Observations from the auditor:**
{2-4 bullets summarizing: headline findings, any tensions navigated, any framework-invisibility surfaces, any substantial "What the Obligations Didn't Capture" content}

───────────────────────────────────────────────────────────────
```

Commit the session directory atomically using the standard `gsd-tools.cjs commit` pattern (verified subcommand — `node ./.claude/get-shit-done-reflect/bin/gsd-tools.cjs commit` exists per the tool's Commands list and is the pattern used across all GSD commands per RESEARCH.md §"Don't Hand-Roll" row 4):

```bash
node ./.claude/get-shit-done-reflect/bin/gsd-tools.cjs commit \
  "audit({subject}x{orientation}x{delegation}): {scope}" \
  --files "${SESSION_DIR}/"
```

The `commit_docs` flag in `.planning/config.json` gates whether the commit actually runs — this is the standard pattern across all GSD commands. If `commit_docs` is false, the tool records a no-op and returns successfully; the session directory is left on disk uncommitted.

**Prohibitions (carried from the plan):**

- Do NOT build abstraction layers for classification (no scoring rubric, no decision tree, no state machine). The classification is a light LLM reading of conversation context, not an algorithm.
- Do NOT build a "session state machine" — the command is one-shot with `--continue` as the resume path for existing sessions.
- Do NOT omit the cross-model experimental warning or the `--trust-cross-model` opt-in for `--auto` mode.
- Do NOT reference `audit-ground-rules.md` by path in the task spec body — copy the rules per DC-2. The task spec is the only place the auditor will see the obligations.
- Do NOT treat the scaffolds from `audit-conventions.md` Section 4.3 as mandatory structure for standard-orientation audits. They are suggested starting shapes the auditor is free to depart from.
- Do NOT collapse the composition principle into a precedence rule. If obligations tension, the task spec surfaces the tension to the auditor rather than resolving it.

</process>

