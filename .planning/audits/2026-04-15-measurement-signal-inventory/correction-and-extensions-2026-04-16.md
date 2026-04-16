---
date: 2026-04-16
audit_subject: codebase_forensics
audit_orientation: corrective_extension
audit_delegation: self (single-agent, user-prompted mid-conversation)
scope: "Correct Anomaly A4 of synthesis-output.md (Claude JSONL thinking content is 'permanently empty') based on research + empirical verification + intervention test. Extend signal inventory with new fields and derived features that A4 had foreclosed. Update cross-platform asymmetry table (Section 2.3) and architectural decisions (Section 8.3). Promote billing-layer token-accounting anomaly that was listed as 'did not look at' (Section 7.3.b) to a first-class measurement implication."
auditor_model: claude-opus-4-6
triggered_by: "user feedback during measurement infrastructure design conversation, 2026-04-16 — the day after the audit completed. Prompted by the user noticing that the original audit's A4 claim contradicted their own experience of seeing thinking content in earlier sessions."
ground_rules: "core+exploratory — this document inherits Rule 1 (evidence-grounded claims) and Rule 2 (epistemic status tags) from framing.md. Additionally obeys the status-downgrade prohibition: the original synthesis-output.md is not edited except for a pointer forward; its original epistemic state is preserved for audit traceability."
tags: [measurement, signal-inventory, correction, thinking-summaries, phase-57.5-prereq, out-of-workflow]
corrects:
  - synthesis-output.md Section 5 Anomaly A4 ("Claude session JSONL thinking block content is permanently empty")
  - synthesis-output.md Section 2.3 "Reasoning Visibility" asymmetry table
extends:
  - synthesis-output.md Section 1 Loop 3 (Agent Performance) — new signals for thinking summary content and derived thinking-token count
  - synthesis-output.md Section 5 Anomaly register — new item promoted from Section 7.3.b (billing/phantom token asymmetry)
  - synthesis-output.md Section 8.3 Decision 5 (cross-runtime not_available markers) — refined symmetry classes
  - synthesis-output.md Section 8.3 — new Decision 6 (model-family gate on reasoning metrics)
  - synthesis-output.md Section 8.1 Priority lists — new Priority 1/2 extractors
predecessor_audits:
  - ./synthesis-output.md (the document this corrects)
  - ../2026-04-10-phase-57-vision-drop-investigation/ (great-grandparent)
---

# Correction and Extensions: Measurement Signal Inventory

## 0. Deviation Testimony (why this document exists outside the formal workflow)

Per user-memory "Deviation Testimony Required": artifacts outside formal workflows must explain why they deviate and what workflow was inadequate.

**This document is not a lane output.** The original audit ran as a 4-lane parallel sweep on 2026-04-15, with synthesis-output.md sealed that evening. The formal workflow concluded.

**What triggered this correction was out-of-band.** On 2026-04-16, in the same conversation where the user was beginning to plan Phase 57.5 from the audit outputs, the user reacted to Anomaly A4 ("thinking content permanently empty") with skepticism: they recalled having seen non-empty thinking content in earlier sessions and noted that Lane 2's "always empty across 61 files" claim did not match their experience. This prompted:

1. A research dispatch (web search + GitHub issue inspection + official docs review)
2. An empirical re-verification across a larger sample of the JSONL corpus
3. An intervention test: flipping `showThinkingSummaries: true` in `~/.claude/settings.json` and observing new sessions

The falsification came from this cascade, not from the planned audit. The existing audit workflow had no provision for "a finding is empirically contradicted the day after the audit completes." There are three options in that case:

- **Edit the audit in place** (violates status downgrade prohibition — the original document captures Lane 2's 61-file sample as evidence of what was epistemically true at the time)
- **Drop the new finding into Phase 57.5 planning without recording it** (breaks traceability — future readers of the audit would not know A4 was wrong)
- **Write this correction document and link to it** (chosen)

The deviation is therefore: using the audit directory as a dialogic record rather than a sealed artifact, by appending a correction while preserving the original. This preserves Rule 1 evidence chains in both documents.

**What workflow was inadequate:** the audit framing assumed a single-shot investigation. It had no self-correcting mechanism for findings falsified by evidence discovered after synthesis. A more mature workflow would have a formal "follow-up falsifications" lane that runs after synthesis, explicitly tasked with stress-testing the strongest claims. This correction is a manual execution of that missing lane, scoped to just one claim (A4) because that's what the user surfaced. Other A-items may have similar vulnerabilities that were not tested.

---

## 1. Correction of Anomaly A4

### 1.1 Original Claim (preserved verbatim from synthesis-output.md §5)

> **A4: Claude session JSONL thinking block content is permanently empty (Lane 2, carried forward)**
>
> Lane 2 verified across 61 files: `assistant.content[].thinking` is always an empty string. The `signature` field confirms thinking occurred. This is not a logging gap — it's Anthropic's intentional design. Reasoning content is not persisted.
>
> **Cross-lane comparison:** Codex's `response_item/reasoning` also has null `content` and encrypted `encrypted_content`. Both runtimes strip thinking content, but for different reasons (privacy/IP protection for Claude, encryption for Codex).
>
> **Impact:** Any measurement that depends on reasoning quality must use proxies (reasoning token count, output quality, verification scores) rather than direct reasoning inspection. This is a hard ceiling for both runtimes.

### 1.2 Falsifying Evidence Chain

The original claim was wrong in three progressively stronger ways: (a) it misread a recent product change as a fundamental design invariant, (b) it overlooked a user-facing setting that restores the content, and (c) it did not observe the behavior under an inverted setting. Evidence is presented in the order it became available.

#### Layer 1: Research (2026-04-15 late night)

**Status: research-only. Source-backed but not empirically verified by me.**

A research agent (web search + GitHub issue review + official docs) produced the following grounded findings:

| Finding | Source | URL |
|---|---|---|
| Primary open bug report filed against anthropics/claude-code for "thinking blocks empty" | GitHub issue #30958 (OPEN) | github.com/anthropics/claude-code/issues/30958 |
| A similar issue was closed as NOT_PLANNED | GitHub issue #31326 (closed) | github.com/anthropics/claude-code/issues/31326 |
| JSONL-specific thinking-empty bug report | GitHub issue #32810 (OPEN) | github.com/anthropics/claude-code/issues/32810 |
| Session-resume 400 bug from empty-thinking propagation (duplicate, closed) | GitHub issue #46843 | github.com/anthropics/claude-code/issues/46843 |
| Community feature request "show thinking summaries", 207 upvotes, open since September 2025 | GitHub issue #8477 | github.com/anthropics/claude-code/issues/8477 |
| Official `showThinkingSummaries` setting entry | Claude Code docs | code.claude.com/docs/en/settings |
| Official billing warning: users pay raw thinking tokens; receive summaries | Claude Code docs | code.claude.com/docs/en/common-workflows |
| Extended thinking API docs: only `summarized` or `omitted` display modes; full reasoning encrypted in `signature` | Platform docs | platform.claude.com/docs/en/docs/build-with-claude/extended-thinking |

From these sources, the research agent reconstructed a timeline for the redaction behavior:

- **~2026-03-05** — Claude Code v2.1.69 introduces the `redact-thinking-2026-02-12` beta header in API requests.
- **~2026-03-08** — Server-side `tengu_quiet_hollow` flag enabled globally by Anthropic.
- **~2026-03-12** — Near-100% redaction observed in new sessions; thinking content empty by default.
- **Current (v2.1.110)** — Behavior governed by the `showThinkingSummaries` setting. When `true`, summaries are written to JSONL as the `thinking` field content. When `false` (the default), the content is blank.

This immediately undermines Lane 2's "permanently empty" framing: the Lane 2 sample was taken from sessions that post-dated the ~2026-03-12 redaction point but predated any setting change. What Lane 2 observed is consistent with the narrower claim "sessions with `showThinkingSummaries: false` (default) after v2.1.69 have empty thinking content."

**Status of this layer:** these are claims from documentation and issue threads. They establish that a configurable lever exists and that the behavior is recent, not fundamental. They do not yet establish that flipping the lever restores content in this environment.

#### Layer 2: Empirical verification across this project's corpus (2026-04-15)

**Status: verified-across-corpus for the samples, still pre-intervention.**

Re-ran the thinking-block audit across a larger sample than Lane 2's 61 files:

| Corpus | Total thinking blocks | Non-empty | Rate | Interpretation |
|---|---|---|---|---|
| Parent JSONL files (1,174 sampled, pre-intervention) | 1,474 | 109 | **7.4%** | Pre-v2.1.69 sessions that escaped redaction |
| Subagent JSONL files (500 sampled, pre-intervention) | 40 | 15 | **37.5%** | Non-interactive mode bypasses redaction per docs — rate ~5x higher |

**Implication for Lane 2's claim:** Lane 2's N=61 sample happened to contain zero non-empty thinking blocks, but the fuller corpus shows 7.4% are non-empty at the parent level and 37.5% at the subagent level. Lane 2's "always empty" was a sampling artifact; the epistemic status `sampled` was correct for Lane 2 but the generalization to "permanently empty by design" outran the sample.

**Parallel finding (unrelated to thinking redaction):** the newest message timestamp across the 265 session-meta files is `2026-03-15T22:04:07.894Z`. Session-meta generation stopped around the v2.1.78/79 boundary. This corroborates the audit's Anomaly A2 (session-meta corpus is a dead artifact from Mar 15 onward) and provides a version-anchored endpoint. This is not part of the A4 falsification but was surfaced during the same verification pass.

#### Layer 3: Intervention test (2026-04-16)

**Status: intervention-tested.**

Set `showThinkingSummaries: true` in `~/.claude/settings.json`. New sessions that ran after the setting was written produced non-empty thinking content in all observed sessions:

| Session ID (prefix) | Non-empty / Total thinking blocks | Character-length range (non-empty) |
|---|---|---|
| ce8d9971 | 6/6 | — |
| 66fc219d | 4/4 | — |
| 7f31069b | 7/7 | — |
| 60097de9 | 6/6 | — |
| bab26d16 | 18/18 | — |
| (aggregate across post-setting sessions) | — | 107 – 11,473 characters |

The current session (started before the setting flip, then the flip happened mid-session) showed 3/12 non-empty — and the three non-empty blocks are the turns that ran after the setting write. This is a clean counterfactual: holding the session fixed, changing the setting changes the data.

**Subagent observation:** one subagent dispatched during this period ran on Haiku 4.5 (`agent-a8d9c168`, dispatched from session `ce8d9971`). It emitted 0 thinking blocks total. This is model-family behavior, not dispatch-mode behavior — Haiku models do not support extended thinking on the API, so no thinking blocks are emitted regardless of setting. This matters for the new architectural decision in §5 below.

### 1.3 Corrected Claim

**A4 (corrected, 2026-04-16):** Claude session JSONL thinking block content is **NOT** permanently empty. Its presence is governed by three conjoined factors:

1. **Claude Code version** — Before v2.1.69 (~Mar 5, 2026), thinking content was written unconditionally. After v2.1.69 with server-side `tengu_quiet_hollow` enabled (~Mar 12, 2026), content is redacted by default. Version boundary.
2. **`showThinkingSummaries` setting** — In current versions (v2.1.110 verified), setting this to `true` in `settings.json` restores summary content to the JSONL `thinking` field. Lever.
3. **Model family** — Only thinking-capable models (Opus 4/4.5/4.6, Sonnet 4/4.5/4.6) emit thinking blocks. Haiku does not, at any setting value. Hardware gate.

**What actually is a ceiling:** raw, pre-summarization thinking content is not available from any Claude runtime — the API only exposes summaries. The `signature` field attests to reasoning but is opaque. Codex's `encrypted_content` is similarly opaque. Both runtimes gate raw thinking content behind cryptographic signatures. But the **summary** is recoverable for Claude under the right settings, and it is a first-class signal source.

**Epistemic status:** intervention-tested (the setting-flip counterfactual holds for this environment and Claude Code v2.1.110). The timeline (v2.1.69 / v2.1.78 boundaries) is research-only and inferred from multiple issue threads and release notes — would benefit from direct confirmation against release changelogs.

---

## 2. New Signals Added to the Inventory

These signals were absent from the original 4-lane inventory because A4 foreclosed their existence. Now that A4 is corrected, they need to be recorded.

### 2.1 First-order signals (directly extractable from JSONL)

| Signal | Raw Field / Feature | Runtime | Epistemic Status | Loops served | Key constraints |
|---|---|---|---|---|---|
| Per-turn thinking summary content | `assistant.content[type=='thinking'].thinking` (non-empty string when setting + version + model permit) | Claude | Intervention-tested (2026-04-16 sessions) | Agent performance, Signal quality | **Triple-gated**: v2.1.69+ redacts by default; `showThinkingSummaries` must be `true`; model must be Opus or Sonnet (not Haiku). Content is a summary, not raw reasoning. |
| Thinking summary presence | Non-empty thinking content, boolean | Claude | Intervention-tested | Agent performance, Cross-runtime | Strong indicator that extended thinking ran on a thinking-capable model under a permissive setting. |
| Thinking signature | `assistant.content[type=='thinking'].signature` | Claude | Sampled (Lane 2 already observed this) | Cross-runtime | Confirms thinking ran, independent of summary content. Cryptographic — not inspectable. Symmetric with Codex `encrypted_content`. |
| `showThinkingSummaries` setting state at session start | Value in `settings.json` read at session start | Claude | Inferred (needs settings-snapshot extractor) | Cross-session, Agent performance | Without capturing setting state, thinking-content absence is ambiguous: is it from setting-off, model=Haiku, or old version? Settings snapshot disambiguates. |
| Claude Code version as era boundary | `user.version` (Lane 2 already identified this field) | Claude | Sampled | Pipeline integrity, Cross-runtime | **Now load-bearing**: v2.1.69 is the redaction boundary; v2.1.78/79 is the session-meta generation boundary. Version is not decorative — it partitions the corpus into epistemically different eras. |

### 2.2 Derived signals (computable from first-order extraction)

| Derived signal | Formula | Epistemic status | Loops served | Notes |
|---|---|---|---|---|
| Raw thinking token count (per turn) | `usage.output_tokens − tokens(visible_output_text) − tokens(visible_thinking_summary)` | Inferred (needs empirical confirmation that `output_tokens` includes raw thinking tokens per billing asymmetry — see §4) | Agent performance | If confirmed, this makes Claude reasoning-token-cost derivable, closing what synthesis Section 2.3 called "no bridge." |
| Summary length | `len(thinking_summary_text)` per turn, aggregated per session | Intervention-tested for extraction | Agent performance, Signal quality | Proxy for reasoning breadth. **Caveat**: summary length is not linear with reasoning depth — summarizer flattens branching into linear narrative. |
| Self-correction marker density | Count of markers like "actually", "wait", "let me reconsider", "on second thought", "I was wrong about" per unit summary length | Speculative (needs marker-set calibration) | Signal quality | Proxy for reasoning-quality fragility — high marker density suggests the model was correcting itself. |
| Branching marker density | Count of markers like "option A/B/C", "alternatively", "another approach would be", "on the other hand" per unit summary length | Speculative (needs marker-set calibration) | Signal quality | Proxy for breadth of consideration. Complements length, which is a breadth-without-structure proxy. |
| Uncertainty expression density | Count of markers like "I'm not sure", "this might not", "it's unclear whether" per unit summary length | Speculative | Signal quality | Proxy for self-reported confidence; pairs naturally with the facets dataset's `claude_helpfulness` field as a cross-check. |
| Dead-end acknowledgment density | Count of markers like "that didn't work", "this approach fails because", "dead end" per unit summary length | Speculative | Signal quality | Proxy for exploratory-vs-monotonic reasoning. |
| Thinking-block rate per turn | Non-empty thinking blocks / total turns | Verified via intervention test | Agent performance | For a given model + setting, this should be ~100% in post-v2.1.69 era (when all three gates open). Deviation from 100% is itself signal. |

**Why "speculative" on the marker-based extractors:** the marker sets above are plausible linguistic heuristics but have not been empirically calibrated against any ground truth for reasoning quality in this environment. A spike dispatch that samples a small labeled corpus against expert judgment would promote these to "intervention-tested" or falsify them.

### 2.3 Why summary length is weaker than it looks

The 11,473-character summary observed in the intervention-test sessions is striking. Some preliminary cautions for using summary length as a metric:

- **Summarizer output ceiling is unknown.** 11,473 characters is the longest observed; we do not have evidence whether there is a hard cap somewhere higher. If a cap exists, length plateaus and stops discriminating between "lots of reasoning" and "lots of reasoning above the cap."
- **Summaries flatten branching.** Two sessions with the same summary length may reflect: (a) linear reasoning with many steps, or (b) branching reasoning with many considered-and-rejected paths compressed into linear narrative. Length alone does not distinguish these.
- **Summary format may vary by model.** Opus 4.6's summarizer may produce different density than Sonnet 4.6's. Cross-model length comparisons need calibration.
- **Summary format may vary by Claude Code version.** The summarizer is a product feature, not a stable API contract. Length distributions should be anchored to `user.version`.

These caveats motivate the derived marker-density features as supplements — they capture structure that length misses.

---

## 3. Cross-Platform Asymmetry Reconciliation

This section supersedes **Section 2.3 "Reasoning Visibility"** of synthesis-output.md for the purpose of Phase 57.5 design work. The original table remains in the audit for traceability.

### 3.1 Corrected reasoning asymmetry table

| Dimension | Claude Code | Codex CLI | Symmetry class | Bridge? |
|---|---|---|---|---|
| **Reasoning presence** | `assistant.content[type=='thinking']` block with non-empty `signature`. Verified across corpus. | `response_item/reasoning` with `encrypted_content` blob. | **Symmetric: available** | Both confirm reasoning happened, via different cryptographic attestations. |
| **Reasoning summary content** | `assistant.content[type=='thinking'].thinking` — non-empty when (v2.1.69+ AND `showThinkingSummaries=true` AND thinking-capable model). Range 107–11,473 chars observed. | `response_item/reasoning.summary` field — empty in the samples Lane 3 examined. | **Asymmetric: Claude-available-under-setting, Codex-empty** | Claude extraction is gated but feasible. Codex summary absence may be a Lane 3 sampling artifact or genuine — needs follow-up research analogous to this one. |
| **Reasoning token count** | **Derivable**: `usage.output_tokens − tokens(visible_output) − tokens(thinking_summary)`. Feasibility pending empirical confirmation. | `token_count.reasoning_output_tokens` — exposed directly. | **Asymmetric: Claude-derivable, Codex-exposed** | Bridge possible once derivation is confirmed. Prior claim of "Codex-unique, no bridge" is falsified. |
| **Reasoning effort level** | No equivalent setting. | `threads.reasoning_effort`: xhigh/high/medium/low. | **Asymmetric: Codex-only** | No bridge. Codex-unique control surface. |
| **Raw pre-summary reasoning content** | **Not recoverable** — only summary exposed; signature is opaque. | **Not recoverable** — `encrypted_content` is opaque. | **Symmetric: unavailable** | Hard ceiling. This is the actual ceiling that A4 mistakenly attributed to the summary layer. |

### 3.2 Summary

The original Section 2.3 verdict — "Reasoning is the most asymmetric domain. Codex provides effort level, token cost separation, and encrypted content (presence confirmation). Claude provides presence confirmation (thinking blocks with signatures) but nothing else" — was wrong in one half and right in the other:

- **Right**: the presence/signature layer is symmetric; the reasoning-effort-level layer is Codex-only; raw pre-summary content is symmetrically unavailable.
- **Wrong**: Claude does provide content — a post-hoc summary — under the right settings. The summary is extractable, measurable, and analyzable. The reasoning-token-count layer is also bridgeable via derivation, not structurally unavailable.

---

## 4. Billing / Phantom Token Anomaly (promoted)

Synthesis §7.3.b listed Anthropic billing data as something the audit "did not look at." The research in §1.2 (Layer 1) surfaced enough of the billing layer to promote this from "not-examined" to "first-class measurement concern."

### 4.1 The billing asymmetry

**Source:** Claude Code documentation (code.claude.com/docs/en/common-workflows) and Anthropic extended-thinking API docs (platform.claude.com/docs/en/docs/build-with-claude/extended-thinking), both accessed via research agent 2026-04-15.

The documented behavior:

- The API charges for the **raw thinking tokens** (all tokens generated by the thinking process, pre-summarization).
- The API returns to the client only the **summary** (or nothing, if display mode is `omitted`).
- The `usage.output_tokens` field, per the billing docs, includes the thinking token count — because that is what is billed.

**Implication for measurement:** `usage.output_tokens` in Claude JSONL likely counts something materially larger than what the visible output text accounts for. If we tokenize the visible assistant text and the visible thinking summary, we get a number; the `output_tokens` field gives a different, larger number; the delta is the raw thinking cost.

### 4.2 Why this is load-bearing

Three consequences:

1. **Existing token-efficiency analyses may be miscalibrated.** Any metric that treats `output_tokens` as "how many tokens did the model produce that we can see" has been mixing visible production with invisible reasoning cost. The larger the reasoning-heavy fraction of the workload, the larger the mismeasurement.
2. **Raw thinking token count becomes derivable** (see §2.2 table). This closes the "Codex-unique reasoning token cost" asymmetry noted in the original synthesis.
3. **Cost attribution becomes non-transparent.** Users see a summary and assume the cost equals the visible output's size. The actual cost is higher. For a measurement system meant to surface agent efficiency honestly, the phantom cost must be surfaced, not hidden in aggregate `output_tokens`.

### 4.3 Proposed anomaly entry (for the corrected register)

> **A9: Phantom thinking tokens in `usage.output_tokens` (billing asymmetry)**
>
> Claude Code users are billed for raw thinking tokens but receive only a summary (or nothing). The `usage.output_tokens` field includes the raw thinking count per billing documentation. This means `output_tokens − tokens(visible_output) − tokens(thinking_summary) ≈ raw_thinking_tokens`. Any token-efficiency metric using `output_tokens` as "visible production cost" conflates visible output cost with invisible reasoning cost.
>
> **Epistemic status:** Inferred from billing docs; needs empirical confirmation by taking a session where all three quantities are extractable and computing the delta. If the delta is positive and non-trivial, the hypothesis holds.
>
> **Impact on design:** MEAS- requirements should distinguish "visible output tokens" from "thinking tokens" and never report an unlabeled token count for cost-related metrics. The phantom token derivation also gives Claude a reasoning-cost signal that closes the §2.3 Codex-uniqueness claim.

---

## 5. Architectural Decision Updates

### 5.1 Refinement to Decision 5

**Original (synthesis-output.md §8.3 Decision 5):**

> Cross-runtime comparison requires explicit `not_available` markers, not null. When a query touches reasoning_effort for Claude sessions, or reasoning_output_tokens for Claude, the system must return "not available for this runtime" rather than null/zero.

**Refinement:** the reasoning-visibility space is not two-class (available / not_available) but four-class. MEAS- requirements should encode:

| Symmetry class | Meaning | Current examples |
|---|---|---|
| `symmetric_available` | Both runtimes expose the signal; bridge is direct or simple normalization | Reasoning presence/signature; model ID; token-count aggregate |
| `symmetric_unavailable` | Neither runtime exposes the signal; hard ceiling | Raw pre-summary reasoning content |
| `asymmetric_derived` | One runtime exposes directly; the other is derivable from other exposed fields | Reasoning token count (Codex: direct; Claude: derivable from `output_tokens` delta, pending §4 confirmation) |
| `asymmetric_only` | Only one runtime exposes the signal at all; no derivation path | Codex `reasoning_effort`; Claude `showThinkingSummaries` gate state |

The `asymmetric_derived` class is new — it didn't appear in the original Decision 5 because A4 had closed off the derivation path. Reopening that path forces a three-state markers scheme (`exposed` / `derived` / `not_available`) rather than two-state.

### 5.2 New Decision 6 — Subagent reasoning observability is model-family-gated

Per user memory "Sensors Use Sonnet" and "Explore Always Sonnet," sensor and explore agents default to Sonnet, which *does* support extended thinking. But other agent types in the GSD harness may run on Haiku (e.g., quick tasks, fast-path dispatches in the budget profile). Haiku does not emit thinking blocks at all.

**Implication:** reasoning-based metrics (summary length, self-correction density, reasoning token count) have a **precondition**: model family supports extended thinking. For Haiku-dispatched subagents, these metrics are structurally undefined — the agent didn't fail to emit thinking content, there is no thinking content to emit.

**Decision 6 text:**

> **Model family is a precondition for reasoning metrics, not an optional stratification variable.** The extractor registry must tag reasoning-derived features with a `requires_thinking_capable_model` precondition. Queries against these features for Haiku-dispatched agents must return `not_applicable` (a distinct status from `not_available` — the signal does not exist, not "exists but we cannot see it"). The agent-performance loop must either (a) filter to thinking-capable models when computing reasoning metrics, or (b) explicitly report "N thinking-capable agents, M Haiku agents — reasoning metrics computed on N only."

This connects directly to the "Sensors Use Sonnet" preference: if sensors moved to Haiku (say, for budget reasons), the sensor-performance loop would silently lose its reasoning signal. Decision 6 requires this silent loss to become an explicit gap.

---

## 6. Implications for MEAS- Requirements (Phase 57.5 Governance Updates)

These additions/changes should flow into REQUIREMENTS.md's MEAS- family during the Phase 57.5 governance pass.

### 6.1 Summary complexity extractor (new derived-feature requirement)

**Proposed requirement:** the extractor registry shall include a `thinking_summary_complexity` extractor producing: length (characters), self-correction marker density, branching marker density, uncertainty density, dead-end acknowledgment density. Per-turn and per-session aggregations. Must accept `model_family` as a precondition and `setting_state` as a filter.

**Epistemic status of features produced:** length is intervention-tested; marker-density features are speculative pending spike-level calibration.

### 6.2 Raw thinking token count extractor (new derived-feature requirement)

**Proposed requirement:** the extractor shall produce `raw_thinking_tokens_per_turn = output_tokens − tokens(visible_output) − tokens(thinking_summary)` for Claude sessions where all three operands are extractable. For Codex, the equivalent comes directly from `token_count.reasoning_output_tokens`. The extractor shall report both quantities on a common axis labeled `reasoning_tokens`.

**Precondition:** pending empirical confirmation of §4's billing-docs claim. If the derivation yields negative numbers on real sessions, the claim is falsified and this requirement must be revised.

### 6.3 Settings-state capture at session start (new first-order requirement)

**Proposed requirement:** the raw-layer ingester shall snapshot `~/.claude/settings.json` at session start and record the value of `showThinkingSummaries` (and any other measurement-relevant settings — e.g., `skipDangerousModePermissionPrompt` bears on tool-call friction metrics). The snapshot is attached to the session as a `settings_at_start` object.

**Why:** without this, thinking-content absence is ambiguous across three causes: version-era redaction, setting-off, or Haiku model. The snapshot disambiguates.

### 6.4 Model-family gate on reasoning metrics (new requirement, from Decision 6)

**Proposed requirement:** every reasoning-derived feature shall declare `requires_thinking_capable_model: true`. The query layer shall return `not_applicable` (distinct from `not_available`) when this precondition fails. The agent-performance loop shall report thinking-capable-model counts alongside any reasoning metric.

### 6.5 Phantom token reconciliation (new quality-check requirement)

**Proposed requirement:** the extractor registry shall include a reconciliation check that compares `output_tokens` against `tokens(visible_output) + tokens(thinking_summary)`. The delta is labeled `phantom_thinking_tokens`. When delta is consistently non-negative across a session, the billing-docs claim is confirmed for that session. When delta is negative, the extractor must flag the session for investigation (token count inconsistency).

### 6.6 Version-as-era-boundary propagation (extends synthesis §8.3 Decision 3)

**Proposed requirement:** Decision 3 (era boundaries as schema metadata) shall include `user.version` as an era partitioner for reasoning-related features. Specifically:

- `v < 2.1.69` → thinking content present by default (pre-redaction era).
- `v >= 2.1.69` → thinking content gated by `showThinkingSummaries` setting.
- `v >= 2.1.78/79` → session-meta generation stopped (Anomaly A2 anchor point).

Queries spanning these boundaries must warn the user that the populations are not comparable.

---

## 7. Extractor Priority Additions (extending synthesis §8.1)

Adding to the Priority 1 (trivial, high coverage) list:

> **11. Claude thinking summary extractor** — Extract `assistant.content[type=='thinking'].thinking` text + `signature` per turn, aggregated per session. Trivial now that A4 is corrected. Serves: agent performance, signal quality. Precondition: model is thinking-capable; prefers `showThinkingSummaries=true` sessions.
>
> **12. Settings-state snapshot extractor** — Read `~/.claude/settings.json` at session start, record relevant fields (`showThinkingSummaries`, `skipDangerousModePermissionPrompt`). Trivial. Serves: disambiguates signal absence; cross-session.

Adding to the Priority 2 (moderate effort, high value) list:

> **13. Phantom thinking token reconciler** — Compute `output_tokens − tokens(visible_output) − tokens(thinking_summary)` and surface as `raw_thinking_tokens`. Moderate (requires tokenizer for visible text; tokenizer choice matters). Serves: agent performance, cross-runtime (bridges the previously asymmetric reasoning-token-cost signal). Blocked on empirical confirmation of §4 hypothesis.
>
> **14. Summary complexity feature extractor** — Compute length, self-correction density, branching density, uncertainty density, dead-end density from thinking summary text. Moderate. Serves: signal quality, agent performance. Marker-set calibration needed before use as anything stronger than a dashboard feature.

---

## 8. Open Questions

Items where this correction document's claims remain inferred or where the evidence is single-environment-only. These should be candidates for follow-up spikes or lane-level verification.

1. **Does `usage.output_tokens` definitively include raw thinking tokens?** §4's claim is derived from billing documentation. Needs empirical confirmation: take a session where thinking summaries are on, extract `output_tokens`, tokenize the visible assistant text + thinking summary text, compute the delta. If delta is consistently positive across multiple sessions, confirmed. If not, the billing doc is either wrong or the JSONL `output_tokens` is a different quantity from the billing-side `output_tokens`.

2. **Is there a hard cap on summary length?** The longest observed was 11,473 characters. Does the summarizer have a ceiling (e.g., at 16K, 32K, or some model-specific limit)? A spike could dispatch a deliberately reasoning-heavy task (e.g., "enumerate considerations in this design with 20+ branches") and observe whether summaries plateau.

3. **Does Haiku truly emit zero thinking content regardless of settings?** Observed in one subagent (`agent-a8d9c168`). Haiku 4.5's extended-thinking capability should be confirmed against official model-capability documentation. If some Haiku variant supports thinking, Decision 6's model-family gate needs to be more granular than "Haiku vs Sonnet/Opus."

4. **Is the subagent 5x thinking-content rate (37.5% vs 7.4%) an artifact of non-interactive-mode bypass, or of a different subagent setting inheritance?** The docs note that non-interactive mode bypasses redaction, which is consistent with the observation. But it's also possible subagents run with different settings inheritance (e.g., they inherit the parent's settings snapshot, and pre-redaction parents' snapshots carry forward).

5. **Does `showThinkingSummaries: true` affect billing?** The billing docs imply billing is based on the raw thinking tokens regardless of what is displayed. If correct, enabling the setting is free. If not, the setting flip may have cost implications worth flagging to users.

6. **Does Codex's `response_item/reasoning.summary` field fill under any setting or configuration?** Lane 3 observed it empty. Given the Claude-side finding that a single setting unlocks summaries, Codex deserves analogous research: is there an OpenAI-side `showReasoningSummaries` equivalent, or a Codex CLI flag that exposes reasoning content? The prior Lane 3 sampling may be as incomplete as Lane 2's was.

7. **Are the marker-density features (self-correction, branching, uncertainty, dead-end) actually predictive of anything useful?** They are plausible heuristics but uncalibrated. A spike that samples, say, 30 labeled sessions (labeled by a human or strong-model audit) and regresses marker densities against labels would either validate or falsify these as first-class features.

8. **What Claude Code changelog entry documents v2.1.69's redaction change?** The research agent inferred the version boundary from issue threads and a beta-header name. A direct read of the v2.1.69 release notes (if public) would ground the claim.

9. **Do other A-items in synthesis-output.md §5 have similar vulnerabilities to late-breaking falsification?** A4 was falsified by a user-prompted follow-up. No comparable follow-up has been performed against A1 (token semantics), A2 (corpus non-overlap), A5 (message count overcount), A6 (compaction asymmetry), or A7/A8 (the "surprises" which are not anomalies in the same sense). The missing "follow-up falsifications lane" from §0 could be scoped to cover these systematically.

---

*Correction-and-extensions completed 2026-04-16. Epistemic statuses are stated per claim; none are upgraded relative to original sources. This document is appended, not merged — the original synthesis-output.md is preserved per the status downgrade prohibition.*
