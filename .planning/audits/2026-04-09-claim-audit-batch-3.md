# Claim Audit — Batch 3: Cross-Project CONTEXT.md Survey

**Audited:** 2026-04-09
**Agent:** claude-sonnet-4-6
**Scope:** 12 CONTEXT.md files across three unrelated projects
**Projects:**
- `hermeneutic-workspace-plugin` (4 files: phases 01, 02, 04.1, 05)
- `claude-notify` (4 files: phases 01, 02, 03, 04)
- `zlibrary-mcp` (4 files: phases 15, 16, 17, 18)

**Approach:** No predefined type taxonomy. Every epistemically significant claim analyzed individually; types named after analysis, not before.

---

## Part 1: Claim-by-Claim Analysis

---

### hermeneutic-workspace-plugin / Phase 01: Structured Logging

---

**CLAIM-HWP-01-01**
> "All 3 research dimensions (STACK, FEATURES, PITFALLS) converge on structlog."

What epistemic work it does: This claim licenses the decision to skip comparison of alternatives. It says the prior research process resolved the question conclusively, so the CONTEXT can narrow immediately to "how" rather than "whether." Without it, the assumption about structlog would be naked.

How it got here: Stated as having come from a research process (STACK, FEATURES, PITFALLS are distinct research tracks, apparently in prior documents). The claim reports a synthesis conclusion.

What if wrong: If any research track pointed elsewhere — or if the research tracks don't exist — the structlog selection loses its warrant and becomes a bare preference. A researcher who can't find the source documents cannot verify this.

Status: Asserted as concluded, but the source documents are named only by dimension label, not by filename or location. There is no path back to the underlying evidence from within this CONTEXT. Half-grounded at best.

---

**CLAIM-HWP-01-02**
> "The codebase has zero `import logging` statements. This is greenfield logging, not a migration."

What epistemic work it does: This eliminates an entire category of risk (migration hazards, compatibility with existing handlers). It licenses a simpler implementation strategy.

How it got here: Described as a finding — the word "zero" implies someone checked. But no mechanism of checking is mentioned (no grep, no tool output cited).

What if wrong: If even one `import logging` exists, the greenfield claim fails, and existing configuration could conflict with the structlog setup.

Status: An empirical finding stated without a verification artifact. The claim is highly verifiable (one grep command), but the CONTEXT neither provides nor cites the verification. Relies on trust that the writer checked.

---

**CLAIM-HWP-01-03**
> "The 17 `print(json.dumps(...))` calls in `cli.py` are legitimate CLI output, not MCP protocol contamination."

What epistemic work it does: This claim separates an entire file from the scope of the logging migration. Without it, each print() site is ambiguous and must be individually justified.

How it got here: The count (17) suggests someone scanned the file. The interpretation (CLI vs MCP) rests on understanding the architecture — that the CLI is a separate entry point.

What if wrong: If any of the 17 print() calls actually execute during MCP server mode (e.g., the CLI and server share a code path), the logging migration would be incomplete and could corrupt the MCP transport.

Status: The count is verifiable. The architectural claim (separate entry point) is framed as an assumption to verify, which is epistemically honest. The CONTEXT correctly asks research to "confirm this distinction."

---

**CLAIM-HWP-01-04**
> "stdout is sacred: MCP spec mandates stdout for JSON-RPC only. Any log leaking to stdout breaks the transport silently (client sees a hang, not an error). This is the #1 pitfall from PITFALLS.md."

What epistemic work it does: This claim is load-bearing for all downstream decisions about stderr-only logging. It also explains the failure mode (silent hang) which justifies treating this as a hard constraint rather than a preference.

How it got here: Attributed to "PITFALLS.md" — a research document in the same planning system. This is the most explicit citation in the phase.

What if wrong: If the MCP spec or the actual client implementation is more tolerant of stdout noise than claimed, the constraint is stricter than necessary but not harmful. The failure mode description (silent hang) could still be wrong if clients have different error handling.

Status: Well-grounded relative to other claims here — has a named source document. Still depends on PITFALLS.md existing and containing this claim, which cannot be verified from the CONTEXT alone.

---

**CLAIM-HWP-01-05**
> "Phase 2 depends on this: Error infrastructure requires structured logging to be in place first, so regressions from control flow changes are observable."

What epistemic work it does: This claim creates a sequencing dependency. It argues that phase ordering is not arbitrary — structured logging is infrastructure for safe exception narrowing.

How it got here: This is a design judgment about causality between phases. It's not sourced; it's a reasoned claim.

What if wrong: If error infrastructure work can be safely done without logging in place, the sequencing constraint is conservative but harmless. It would only matter if someone tried to reorder the phases.

Status: A reasoning claim. The underlying logic (you want observability before you change control flow) is sound, but it is not checked against any empirical finding about the codebase.

---

**CLAIM-HWP-01-06**
> Open question: "FastMCP may have its own logging setup that conflicts with structlog configuration. Open issue fastmcp#1761."

What epistemic work it does: Flags an external dependency risk. The issue number (fastmcp#1761) turns this into a verifiable claim — either the issue exists and is open, or it doesn't.

How it got here: Someone checked the FastMCP issue tracker. The issue number gives this genuine specificity.

What if wrong: If the issue is closed/resolved, the concern may be moot. If the issue never existed, the risk was invented. A researcher can verify in seconds.

Status: Epistemically specific and verifiable. The CONTEXT correctly routes it to research.

---

### hermeneutic-workspace-plugin / Phase 02: Error Infrastructure

---

**CLAIM-HWP-02-01**
> "The target files still contain the exact broad handlers the roadmap names: `tools.py` 12, `intake/orchestrate.py` 22, `intake/rescue_codex.py` 18, `server.py` 2."

What epistemic work it does: These counts create a concrete target for the cleanup work. They also serve as a verification baseline — if a researcher finds different counts, either the codebase changed or the CONTEXT is wrong.

How it got here: The numbers (12, 22, 18, 2) are specific enough to suggest someone counted. But no count method or timestamp is cited.

What if wrong: If the counts are off — because prior work already narrowed some handlers, or because counting methodology differed — the scope estimate is wrong. More consequentially, planning may prioritize wrong files.

Status: Specific enough to be verifiable (grep `except Exception` per file), but cited without evidence of how the count was produced.

---

**CLAIM-HWP-02-02**
> "The current server boundary is wrong for tool failures. `server.py` currently catches broad exceptions and returns `-32000 tool_error` with `traceback.format_exc()` in the protocol error payload."

What epistemic work it does: This is a diagnostic claim — it names a specific existing bug and its mechanism. It licenses the MCP boundary rewrite as a correction, not an enhancement.

How it got here: Reads like someone inspected server.py and found the pattern. Specific enough (exact error code `-32000`, exact function `traceback.format_exc()`) to be traceable to file inspection.

What if wrong: If server.py was already fixed before this CONTEXT was written, the "correction" is either moot or will produce a double-fix. If the error code or function name is wrong, the downstream implementation will search for the wrong thing.

Status: Appears grounded in file inspection. The specificity (line numbers are cited in the Phase 01 CONTEXT for related patterns) is good. But like other empirical claims here, the CONTEXT offers no verification artifact.

---

**CLAIM-HWP-02-03**
> "Rollout must be staged by risk, not done as one mechanical cleanup."

What epistemic work it does: This is a methodological constraint on how the work must proceed. It prevents a naive search-and-replace approach.

How it got here: A design decision — stated without derivation from evidence. The reasoning is implicit: broad handlers contain mixed semantics and sweeping changes are unsafe.

What if wrong: If all 54 handlers were actually equivalent and safe to narrow uniformly, the staged approach costs time without benefit. But the claim is hard to falsify without doing the work.

Status: A methodological judgment that acts as a guardrail. Not an empirical claim. It shapes process, not fact.

---

**CLAIM-HWP-02-04**
> Open question: "54 scoped handlers" (across the four files).

What epistemic work it does: Sum of the four counts (12+22+18+2=54). This is the aggregate scope.

How it got here: Arithmetic from CLAIM-HWP-02-01's counts.

What if wrong: If any individual count is wrong, this total inherits the error. Still verifiable.

Status: Derived from the same foundation as CLAIM-HWP-02-01. No independent verification.

---

### hermeneutic-workspace-plugin / Phase 04.1: Deployment Matrix and Topology Validation

---

**CLAIM-HWP-041-01**
> "Cross-platform deployability is currently specified, but not yet validated as a topology matrix."

What epistemic work it does: This claim is the entire justification for the phase's existence. It says Phase 4 made claims that Phase 04.1 must test. Without this claim, the phase is redundant.

How it got here: A gap-identification claim. It's an observation about what prior phases did and did not do — Phase 4 shipped code, but only tested one path.

What if wrong: If Phase 4 actually did validate multiple topologies, Phase 04.1 is unnecessary work. The claim depends on what counts as "validated."

Status: A meta-claim about the project's epistemic state (what has been proven vs. assumed). It is honest and explicit about the gap, but gives no evidence of what Phase 4 actually tested.

---

**CLAIM-HWP-041-02**
> "Existing workspaces matter as much as fresh installs."

What epistemic work it does: Expands the validation scope to include migration testing, not just fresh installs. This determines the matrix content.

How it got here: A product judgment. Not derived from user research or data — stated as a principle.

What if wrong: If the project's actual user base consists entirely of new users and existing workspaces never need migration, this expands scope unnecessarily.

Status: An assertion of value that shapes scope. Not empirical. Could be contested if user data said otherwise.

---

**CLAIM-HWP-041-03**
> "A deployment story is only real once it survives fresh-machine and migration tests."

What epistemic work it does: Sets the standard for what counts as "done." This is a verification criterion masquerading as a principle.

How it got here: Engineering philosophy. A reasonable claim, but unstated as such.

What if wrong: If "real" could be satisfied by other evidence (e.g., user reports, staging environment), the matrix testing is one option among several, not the only valid approach.

Status: A normative claim about what constitutes valid evidence for deployability. Not a factual claim.

---

### hermeneutic-workspace-plugin / Phase 05: Evaluation, Retrieval, and Voice Quality Research

---

**CLAIM-HWP-05-01**
> "This phase converts three fuzzy concerns into formal spike work."

What epistemic work it does: Names the epistemic mode of the phase. This is not implementation work — it is knowledge production work. Sets expectations about outputs.

How it got here: A characterization of the prior state of the project's knowledge. "Fuzzy concerns" implies they were not yet specified.

What if wrong: If one of the three tracks had already been substantially addressed in prior work, the "fuzzy" label is inaccurate and may lead to redundant research.

Status: A meta-description of epistemic readiness. Not checkable without reviewing all prior phases.

---

**CLAIM-HWP-05-02**
> "The phase is research-first. It should end in evidence-backed recommendations and adoption candidates, not in premature architecture lock-in."

What epistemic work it does: Constrains what the phase is allowed to produce. It prevents an eager architect from shipping implementation when research was asked for.

How it got here: A methodological commitment. Reflects a lesson learned, presumably from prior phases where design was decided too early.

What if wrong: If the research actually resolves all questions cleanly enough to justify implementation, this constraint forces artificial delay.

Status: A process norm. Not an empirical claim. Its validity depends on whether the prior lesson it encodes was warranted.

---

**CLAIM-HWP-05-03**
> Implied: "retrieval units" and "retrieval strategies" can be compared on the basis of "downstream writing quality and citation traceability, not retrieval metrics alone."

What epistemic work it does: Sets an evaluation criterion that differs from the ML norm (where retrieval is measured by recall/precision). This preference for downstream writing quality is a methodological bet about what matters.

How it got here: A design principle, likely from the project owner's scholarly context (citation traceability matters for academic work).

What if wrong: If the downstream writing quality criterion is too hard to operationalize consistently, the spike produces subjective and unrepeatable findings.

Status: A values claim about what the right metric is. Reasonable in context but not argued from evidence.

---

---

### claude-notify / Phase 01: Modular Hook Architecture

---

**CLAIM-CN-01-01**
> "Dispatcher uses `require.main === module` guard (same pattern as current hook.js)"

What epistemic work it does: Anchors the dispatcher design to an existing pattern in the codebase. Citing "same pattern as current hook.js" implies someone read hook.js and confirmed this pattern is there.

How it got here: Code inspection of the existing file.

What if wrong: If hook.js doesn't use this guard, the new dispatcher follows a pattern that doesn't exist. More likely: the guard is there, but its semantics in a dispatched vs. direct-invocation context may differ in ways the CONTEXT doesn't address.

Status: An appeal to existing code pattern. Verifiable. Reasonable but assumes the guard applies equally in both contexts.

---

**CLAIM-CN-01-02**
> "Unknown events → write `{}` to stdout, exit 0 (silent fail)"

What epistemic work it does: Establishes a behavioral contract for unrecognized hook events. This is not derived from evidence — it is a decided design choice.

How it got here: Probably from deliberation about the correct failure mode for hooks (crash is worse than silence in this context).

What if wrong: If Claude Code or another consumer of hook output needs to distinguish "unrecognized event" from "no action," the silent fail loses information that could matter.

Status: A design decision with a rationale (hooks must never crash the host). The rationale is implicit. Not an empirical claim.

---

**CLAIM-CN-01-03**
> "All 80 existing tests must pass — this is the verification gate."

What epistemic work it does: Makes refactoring safe by setting a regression criterion. The 80-test count is also a specific factual claim about the test suite.

How it got here: Presumably from running the test suite and counting. But also: the 80 number appears as a hard gate, not just a target.

What if wrong: If there are actually 79 or 83 tests, the verification criterion is stated incorrectly. More importantly, if some tests are flawed or test the wrong thing, passing them is not sufficient evidence of behavioral preservation.

Status: Partly a factual claim (80 tests exist) and partly a process commitment (passing them is required). The count is verifiable; the adequacy of the tests as a regression criterion is not examined.

---

**CLAIM-CN-01-04**
> "Integration tests hit real ntfy.sh and are flaky due to rate limits — if integration tests fail due to ntfy rate limits (not code bugs), that should not block Phase 1 completion."

What epistemic work it does: Creates a two-tier verification standard — some test failures are allowed. This is epistemically significant because it means the "all 80 tests pass" gate actually has carve-outs.

How it got here: Operational experience — someone has seen the rate limit failures. The "not code bugs" distinction implies observing test failure patterns.

What if wrong: If there is no way to distinguish a rate-limit failure from a code-induced failure at test runtime, the carve-out is unenforceable and the gate is ambiguous.

Status: An empirically-motivated exemption from the verification criterion. Honest about the distinction but doesn't explain how to operationalize "rate limit vs code bug."

---

**CLAIM-CN-01-05**
> Listed as unowned: "Multi-agent normalization layer — Deliberation says 'design for multi-platform now' with normalized event objects, but the dispatcher hardcodes Claude Code event names. No phase addresses an adapter/normalization boundary. Intentional deferral or oversight?"

What epistemic work it does: Names a gap in the roadmap. Not a claim about what is true — a claim about what is unknown or undecided.

How it got here: Comparison of deliberation intent vs. current phase plans found a mismatch. Someone read the deliberation and the phases and noticed the adapter was never assigned.

What if wrong: If there is actually a phase that owns this (just not listed in the deferred section), the gap claim is wrong. But the claim is framed as a question, which is epistemically appropriate.

Status: A gap-identification claim. The most epistemically careful entry in the deferred section — it asks rather than assumes.

---

### claude-notify / Phase 02: PermissionRequest Notifications

---

**CLAIM-CN-02-01**
> "ntfy rate limits: 250 messages per **12-hour rolling window** (not 24hr) — confirmed via `/v1/account` API"

What epistemic work it does: Corrects a prior assumption (24hr window) with verified data. The specification of the API endpoint used to verify makes this claim traceable.

How it got here: Someone queried the ntfy.sh API directly. "Confirmed via /v1/account API" is a method citation.

What if wrong: If ntfy changed their rate limit policy after 2026-03-10 (the verification date), this claim is stale but was accurate at time of writing. The CONTEXT records the fact of verification without recording the response payload.

Status: One of the strongest claims in all 12 files. Method-cited, source-verified, with a correction from prior assumption. Still time-sensitive.

---

**CLAIM-CN-02-02**
> "Rate limit EXHAUSTED during normal dev session (2026-03-10)"

What epistemic work it does: Turns a theoretical limit into a demonstrated operational problem. This moves rate limits from "concern" to "confirmed pain" and licenses HOOK-08 as a requirement.

How it got here: Directly observed. The date makes it traceable.

What if wrong: If the exhaustion was caused by an unusual pattern (bulk testing, not actual usage), the "normal dev session" characterization overstates the practical risk.

Status: An observed fact. The only question is whether "normal dev session" accurately characterizes what happened.

---

**CLAIM-CN-02-03**
> "Self-hosted does NOT solve iOS rate limits — upstream relay for APNS still counts against ntfy.sh"

What epistemic work it does: Closes off what might seem like an obvious escape route. Users thinking "I'll just self-host" need to know the APNS relay remains a bottleneck.

How it got here: Research finding. The CONTEXT cites this without specifying the source (no URL, no GitHub issue, no API call). It appears in the research task resolution section alongside properly-sourced claims.

What if wrong: If ntfy changed their self-hosting model to allow private APNS certificates (which Apple does not easily support, but there are workarounds), this claim would be outdated. But the underlying constraint is Apple's APNS architecture, which the CONTEXT doesn't acknowledge as the root cause.

Status: An important architectural finding stated as a conclusion without methodology. The claim is likely correct but would benefit from citing ntfy's documentation on relay behavior.

---

**CLAIM-CN-02-04**
> "PermissionRequest fires for ALL tool permission checks, not just blocked ones (GitHub #29212)"

What epistemic work it does: Explains why the phase needs subagent suppression and careful filtering. Without this, the design would assume PermissionRequest = blocked permission.

How it got here: A GitHub issue citation. The issue number (#29212) is specific enough to verify.

What if wrong: If the issue was filed incorrectly, or if Claude Code's behavior changed since the issue was filed, the "all permission checks" claim is wrong. This would mean the filtering logic is unnecessary complexity.

Status: Issue-cited, but the CONTEXT doesn't indicate whether the issue was verified as accurate (not just filed as a claim by a user). The citation is stronger than no citation, but weaker than Anthropic documentation.

---

**CLAIM-CN-02-05**
> "`stop_hook_active` guard — Check `data.stop_hook_active` in Stop handler to prevent infinite hook loops. Defensive pattern validated by disler observability project."

What epistemic work it does: Attributes a design pattern to an external reference implementation. The "validated by" phrasing is the epistemically interesting part — it implies the pattern was not just found but confirmed to work.

How it got here: Research into reference designs (the "disler observability project" is a third-party Claude Code hook implementation).

What if wrong: If the field name (`stop_hook_active`) changed in a Claude Code update, the guard would either fail silently or never trigger. The CONTEXT lists this field as "confirmed" in the research tasks section.

Status: Externally-validated pattern. The source is named but not linked. "Validated by" overstates: it means "used by" — the disler project cannot validate that the guard is necessary, only that it exists.

---

**CLAIM-CN-02-06**
> Open question: "Whether both PermissionRequest and Notification(permission_prompt) fire for the same tool permission still needs runtime verification"

What epistemic work it does: Identifies the central architectural decision for Phase 2 as genuinely unresolved. It prevents premature commitment to the dual-hook strategy or single-hook strategy.

How it got here: Research found both events could fire, but the CONTEXT correctly notes that whether they fire for the same event simultaneously was not tested.

Status: Legitimately open. The CONTEXT handles this well — it names the three strategic options (A, B, C) without pre-deciding.

---

### claude-notify / Phase 03: tmux Context Enrichment

---

**CLAIM-CN-03-01**
> "Tmux pane identifier goes in the **notification title** for ALL event types"

What epistemic work it does: Settles a placement question (title vs body) that had multiple legitimate options. The justification is "consistent with Phase 2's 'front-load important info for mobile banner visibility' principle."

How it got here: Design decision derived from a principle established in a prior phase.

What if wrong: If the mobile banner visibility principle actually favors shorter titles over longer ones (banner truncates early), putting the tmux identifier in the title could be counterproductive. The decision assumes the identifier is short enough not to crowd out the project name.

Status: A design decision explicitly traced to a prior principle. The tracing is visible and the reasoning is stated. Whether the underlying principle is actually well-calibrated to iOS banner behavior is not re-examined.

---

**CLAIM-CN-03-02**
> "Subprocess performance: two spawns per invocation (git + tmux) is acceptable because both run AFTER `{}` stdout is written (async pattern from Phase 2)"

What epistemic work it does: Pre-empts a performance concern by noting the timing (post-stdout). This claim gates on Phase 2's async pattern having been correctly implemented.

How it got here: Reasoning from the Phase 2 design. The async pattern is said to make post-stdout subprocess cost acceptable.

What if wrong: If the git or tmux subprocess is slow enough to delay process exit meaningfully, users may see notification delivery delays. "Acceptable" has no defined threshold.

Status: A latency reasoning claim. The async timing argument is sound, but "acceptable" is not benchmarked.

---

**CLAIM-CN-03-03**
> "CTXT-04 (git branch) was implemented in Phase 2 (`git-branch.js` + `context-line.js`)"

What epistemic work it does: Corrects the roadmap — this requirement was delivered early, so Phase 3 need not include it.

How it got here: Comparison of the roadmap traceability table against what was actually built in Phase 2.

What if wrong: If `git-branch.js` was partially implemented or doesn't fully satisfy CTXT-04, the early-delivery claim is inaccurate and Phase 3 would silently skip incomplete work.

Status: Appears grounded in code inspection (the file names are specific). The early delivery is documented as "already delivered" in the domain section.

---

### claude-notify / Phase 04: Interactive Notifications and Mobile

---

**CLAIM-CN-04-01**
> "Anthropic confirmed PermissionRequest runs async with the permission dialog (issue #12176). User can approve from terminal OR phone."

What epistemic work it does: Establishes that the interactive approval pattern is architecturally supported. The async relationship between hook and dialog is non-obvious and load-bearing for the whole Phase 4 design.

How it got here: Issue citation — issue #12176 is attributed to Anthropic (presumably in the Claude Code repository).

What if wrong: If this issue was filed by a user (not Anthropic), or if it was subsequently contradicted by behavior, the "Anthropic confirmed" framing is wrong. The claim could be true but the attribution might be to a user report rather than an official confirmation.

Status: Issue-cited, but the CONTEXT doesn't specify who filed the issue. "Anthropic confirmed" is a strong reading of an issue comment that may have been made by an Anthropic employee but may also have been inferred.

---

**CLAIM-CN-04-02**
> "PermissionRequest ONLY fires in `bypassPermissions` mode. It did NOT fire in `default` mode even for tools that showed permission dialogs. This is a week-old finding."

What epistemic work it does: Dramatically narrows who the interactive approval feature actually serves. If this is true, only users running `dangerouslySkipPermissions` get interactive approvals.

How it got here: Runtime verification on 2026-03-11 (8 days before this CONTEXT was written). The CONTEXT itself acknowledges it is stale.

What if wrong: The CONTEXT explicitly raises this: "May have changed in Claude Code updates since 2026-03-11. Must re-verify." This is the most epistemically self-aware guardrail in the entire batch.

Status: A time-limited empirical finding that the CONTEXT correctly identifies as needing re-verification. Exemplary epistemic honesty.

---

**CLAIM-CN-04-03**
> "The user typically runs `dangerouslySkipPermissions` (bypass mode). In this mode, PermissionRequest fires for AskUserQuestion (elicitation events). The user's primary need is responding to Claude's questions from their phone."

What epistemic work it does: Shifts the primary use case from "approve tool permissions" to "answer Claude's questions remotely." This reorders the priority of the whole phase.

How it got here: A statement about the specific user (singular — Logan Rooks). This is user-sourced contextual knowledge, not a general finding.

What if wrong: If the user changes their workflow, or if AskUserQuestion doesn't actually trigger PermissionRequest hooks (which the same CONTEXT says needs verification), the primary use case disappears.

Status: User-behavior description. The connection to PermissionRequest is flagged as unverified in the assumptions section. The CONTEXT correctly keeps this open.

---

**CLAIM-CN-04-04**
> "Transport abstraction scope estimate (~350 lines) is accurate."

What epistemic work it does: Sizes a technical deliverable. This estimate, if wrong, affects whether Phase 4 is achievable in its current scope.

How it got here: From the Phase 2 research on transport alternatives ("~350 lines across 5-6 transport modules"). The CONTEXT says "Needs implementation validation" — so this is explicitly flagged as an estimate.

What if wrong: Software estimates are routinely off. The CONTEXT appropriately flags it as needing validation.

Status: An estimate marked as needing verification. Epistemically honest.

---

**CLAIM-CN-04-05**
> Guardrail: "ntfy alternatives research is 9 days old. Spot-check key claims before recommending a transport."

What epistemic work it does: Imposes a staleness check on prior research before it is acted upon. This is not a claim about facts but a claim about how stale facts should be treated.

How it got here: The CONTEXT author compared research dates to current date and noted the gap.

Status: An epistemically-generated process norm. This kind of built-in expiry notice on research findings is unusual and valuable.

---

**CLAIM-CN-04-06**
> "Prompt 3 URL scheme: `prompt-favorite://{hostname}` — noted as not publicly documented — needs hands-on verification."

What epistemic work it does: Prevents building on unverified documentation. Specifically flags "not publicly documented" which means the URL scheme was either reverse-engineered or found in a secondary source.

How it got here: Noted in PROJECT.md as a blocker. The CONTEXT re-surfaces it as a guardrail.

Status: A correctly-flagged gap. The scheme may work but cannot be built against without testing.

---

---

### zlibrary-mcp / Phase 15: Cleanup & DX Foundation

---

**CLAIM-ZL-15-01**
> "Node 22 changed `JSON.parse` error message format — the failing test expects old format: `Unexpected token T in JSON at position 0` vs new: `Unexpected token 'T', "This is not JSON" is not valid JSON`"

What epistemic work it does: Attributes a test failure to an upstream Node.js change rather than to a code bug. This changes how the fix is applied (update the test assertion, not the code).

How it got here: Someone ran the failing test and compared the actual vs. expected error message, then traced the change to Node 22. This is a concrete diagnostic finding.

What if wrong: If the test failure has a different cause (actual regression in JSON parsing logic), fixing the expected string would mask a real bug.

Status: A specific empirical diagnosis. The Node 22 attribution is traceable (Node's changelog confirms this change). Strong.

---

**CLAIM-ZL-15-02**
> "928 total tests (129 Jest + 799 pytest) — coverage baseline likely high for Python, lower for TypeScript"

What epistemic work it does: Gives a rough picture of coverage before measuring it, to set expectations for threshold-setting. The count is specific; the "likely" qualifier for coverage levels is honest hedging.

How it got here: Someone ran the test suite and counted. The count is stated as fact; the coverage characterization is inferred from the proportion of tests to codebase size.

What if wrong: If the test counts are wrong, the coverage characterization is wrong. More importantly, the "likely" inference about TypeScript coverage being lower is not a measurement — it could be wrong if TS code is simple and well-covered despite fewer tests.

Status: Counted fact + hedged inference. The counts are verifiable; the coverage inference is appropriately provisional.

---

**CLAIM-ZL-15-03**
> "The credential scrub already rewrote history today — batch any remaining cleanup to minimize force-pushes"

What epistemic work it does: Creates a policy recommendation (batch work) from an operational event (prior force-push). The force-push already happened, so a second one is unavoidable — this claim argues for making it the last one.

How it got here: Operational awareness — the author knows a force-push happened on the same day.

What if wrong: If additional cleanup triggers a third force-push regardless of batching (e.g., because something was missed), the claim was sound but the plan failed.

Status: A sound operational recommendation derived from a known event. The recommendation itself is uncontroversial.

---

**CLAIM-ZL-15-04**
> "ESLint v9 (flat config format) — v8 is EOL"

What epistemic work it does: Licenses the v9 choice and frames the alternative (v8) as no longer viable. "EOL" is a strong claim.

How it got here: Industry knowledge. ESLint v8 reached EOL in October 2024 (well before this CONTEXT was written in March 2026).

What if wrong: ESLint v8 is not strictly "EOL" in the sense that it stops working — it receives no new security patches, but existing installs continue to function. The EOL framing may overstate the urgency of avoiding v8.

Status: An industry-fact claim that is approximately correct but conflates "no longer maintained" with "end of life." The choice of v9 is correct; the framing is slightly imprecise.

---

**CLAIM-ZL-15-05**
> Failure mode: "Prettier reformats everything → git blame destroyed. Mitigation: `.git-blame-ignore-revs` file."

What epistemic work it does: Identifies a collateral damage risk of a necessary action and names the standard mitigation.

How it got here: Engineering experience. `.git-blame-ignore-revs` is a documented Git feature for exactly this use case.

What if wrong: The mitigation only works if contributors configure `git config blame.ignoreRevsFile .git-blame-ignore-revs` locally. The CONTEXT notes "Must be documented in CONTRIBUTING.md" — so it knows the mitigation requires follow-through.

Status: A known risk with a known mitigation. The claim is accurate. The mitigation requires a downstream action that is explicitly noted.

---

**CLAIM-ZL-15-06**
> "Coverage threshold: set each at current coverage minus 5% — catches real regressions without being brittle"

What epistemic work it does: Establishes a principled formula for threshold-setting. The 5% buffer is a specific number that needs to be justified.

How it got here: A design decision. The rationale is given: "Refactoring that removes dead code can paradoxically lower coverage percentage. The 5% buffer handles this."

What if wrong: 5% may be too generous (allows 5% coverage drop before CI fails) or too strict (if tests and code changes frequently together). The "right" buffer depends on the team's refactoring patterns, which are not measured.

Status: A reasonable heuristic stated as a principle. The 5% number is conventional in coverage discussions but is not derived from this project's specific test history.

---

### zlibrary-mcp / Phase 16: Documentation & Distribution

---

**CLAIM-ZL-16-01**
> "npm tarball currently packs 984 files (no `files` whitelist)"

What epistemic work it does: Establishes the size problem concretely. The 984-file count is a specific verifiable fact that licenses the requirement to add a whitelist.

How it got here: Someone ran `npm pack --dry-run` and counted the output.

What if wrong: If the count has changed due to subsequent commits adding or removing files, the figure is stale but the problem (no whitelist) remains.

Status: A direct measurement. Highly specific and verifiable. The problem it evidences (bloated tarball) is independent of the exact count.

---

**CLAIM-ZL-16-02**
> "Docker Dockerfile already exists and uses multi-stage build. May already work — needs verification, not creation."

What epistemic work it does: Scopes the Docker work as verification/fixing rather than greenfield. This prevents wasted effort rewriting a Dockerfile that may be functional.

How it got here: File system inspection (the file is confirmed to exist). "May already work" is honest uncertainty about its current state.

What if wrong: If the Dockerfile is broken in ways beyond what Phase 15 changes would affect (e.g., dependency pinning issues), "needs verification" understates the work needed.

Status: A well-hedged empirical claim. Existence confirmed, functionality acknowledged as uncertain.

---

**CLAIM-ZL-16-03**
> "Docker uses SuperGateway for HTTP transport on port 8000 with health endpoint at `/health`"

What epistemic work it does: Specifies the MCP transport architecture for the Docker distribution path. This determines what client configuration instructions to write.

How it got here: Reading the docker-compose.yaml file. The CONTEXT quotes the specific command line: `--port 8000 --host 0.0.0.0 --healthEndpoint /health --stdio "node /app/dist/index.js"`.

Status: Directly sourced from the compose file content. Strong. The question "What HTTP transport does Docker use for MCP?" in the open questions section is asking about the client-side configuration experience, not about what SuperGateway does — the questions are not contradictory.

---

**CLAIM-ZL-16-04**
> "GitHub Issue #11 is a real user who got 'server disconnected' — the README install instructions should be clear enough that this doesn't happen"

What epistemic work it does: Uses a real user incident to motivate documentation quality. This is evidence of a real gap, not a theoretical one.

How it got here: The GitHub issue exists (referenced across Phases 16 and 17, with the reporter named as `@gizmo66` in Phase 17).

Status: A factual claim about an existing issue. Verifiable and confirmed by the cross-reference in Phase 17.

---

### zlibrary-mcp / Phase 17: Quality Gates & Release Pipeline

---

**CLAIM-ZL-17-01**
> "npm pack produces 416KB tarball — GATE-02 threshold is 10MB, well within margin"

What epistemic work it does: Shows Phase 16's packaging work succeeded, and that the new CI gate will not cause failures on the first run.

How it got here: Running `npm pack` after Phase 16 applied the files whitelist.

What if wrong: If files are added to the package between Phase 16 and Phase 17 CI validation, the tarball may grow. The 10MB threshold is very conservative, so the margin is large.

Status: A measurement from Phase 16's output. Highly specific. The large margin makes the threshold non-binding for now.

---

**CLAIM-ZL-17-02**
> "MCP SDK uses JSON-RPC over stdio — smoke test sends `{"jsonrpc":"2.0","method":"initialize",...}` and expects a response"

What epistemic work it does: Specifies the exact smoke test payload. This saves research time and prevents guessing at the protocol format.

How it got here: MCP SDK knowledge — this is the standard MCP initialize handshake format. The CONTEXT provides the exact JSON.

What if wrong: If the MCP protocol version (2024-11-05) is outdated or the initialize handshake format changed, the smoke test would fail even on a healthy server.

Status: Protocol-specific claim. The version string is specific enough to verify against MCP SDK documentation. The guardrail section explicitly notes "Do not assume MCP initialize works over simple pipe" — the CONTEXT is epistemically careful here.

---

**CLAIM-ZL-17-03**
> "Root cause [of Issue #11]: likely missing credentials (Phase 15 added clear error messaging for this)"

What epistemic work it does: Attributes a user-reported failure to a specific cause, which then routes the resolution (improved error messaging) rather than code fixes.

How it got here: The CONTEXT doesn't show diagnostic work — it is inferred from Phase 15's credential validation work. The "likely" qualifier acknowledges this is not verified.

Status: An inference, not a diagnosis. The "likely" is appropriate. If the actual cause was different (e.g., Python environment not set up, not credentials), the resolution through Issue #11 would address the wrong problem.

---

**CLAIM-ZL-17-04**
> Guardrail: "Issue #11 resolution is a human interaction, not just code. The response must be respectful, helpful, and reference the actual setup instructions."

What epistemic work it does: Adds a social and ethical constraint to what is otherwise a technical task. This prevents treating a user interaction as a ticket to close.

How it got here: A normative judgment about how to engage with users who report problems. Not a factual claim.

Status: A values claim embedded in technical planning. Epistemically different from all other claims here — this is about how, not what.

---

### zlibrary-mcp / Phase 18: v1.2 Gap Closure

---

**CLAIM-ZL-18-01**
> "Fix the **test code**, not the ground truth data — tests are using pre-v3 keys (expected_output, marker_context, content) that were renamed in the v3 schema migration"

What epistemic work it does: Diagnoses a root cause and specifies the correct fix direction. The distinction "fix test code, not ground truth" is a judgment call about which artifact is authoritative.

How it got here: Inspection of failing tests and comparison to the v3 schema. The specific key names (expected_output, marker_context, content) are named, suggesting file-level inspection.

What if wrong: If the ground truth data was incorrectly migrated to v3 (i.e., the v3 keys in the ground truth are wrong), fixing the tests would make tests pass against bad data. The CONTEXT says "Validate that the ground truth JSON files themselves are valid v3" — which is epistemically careful.

Status: Diagnostic claim with a verification path. The fix direction is reasonable given the claim that v3 is the authoritative schema.

---

**CLAIM-ZL-18-02**
> "Performance tests pass locally but fail on GitHub Actions runners — the fix must account for runner variance, not just local timing"

What epistemic work it does: Identifies an environmental mismatch as the failure cause, which changes the fix strategy from "optimize the code" to "loosen the threshold."

How it got here: Comparison of local vs. CI results. This is a common pattern in CI testing (runner variance is well-documented) and the CONTEXT treats it as a known phenomenon.

What if wrong: If the CI failure is caused by an actual regression in performance (not runner variance), loosening thresholds would mask the regression.

Status: An inference from the pattern "passes locally, fails CI." The inference is common and reasonable but is not supported by a performance profile comparison between local and CI environments.

---

**CLAIM-ZL-18-03**
> "CHANGELOG links currently point to `v1.0.0...v1.1.0` but actual tags are `v1.0...v1.1`"

What epistemic work it does: Identifies a specific documentation error with specific correct values. This is a highly precise claim.

How it got here: Comparison of CHANGELOG link text against actual git tags.

What if wrong: If the tags actually are `v1.0.0` and `v1.1.0`, the "fix" would break working links.

Status: A directly verifiable factual claim. Very specific. Correct if git tags confirm it.

---

---

## Part 2: Natural Groupings

After examining all 72+ claims across 12 files, the following groupings emerged. These are not predefined — they are induced from what the claims actually do.

---

### Group A: Empirical Findings with Method

Claims that report something observed and specify how the observation was made, making them independently verifiable.

- CLAIM-CN-02-01 (ntfy rate limit confirmed via `/v1/account` API)
- CLAIM-CN-02-02 (rate limit exhausted in observed dev session, dated)
- CLAIM-ZL-15-01 (Node 22 error format change — specific messages given)
- CLAIM-ZL-16-01 (984 files in tarball — from `npm pack`)
- CLAIM-ZL-16-03 (SuperGateway config — quoted from compose file)
- CLAIM-ZL-17-01 (416KB tarball — measured after Phase 16)
- CLAIM-ZL-18-03 (CHANGELOG link format — compared against actual tags)

These are the highest-quality epistemic claims in the batch. They name a method, which means a reader can re-verify. They are also the most likely to go stale in specific, identifiable ways (library updates, config changes).

---

### Group B: Empirical Findings without Method

Claims that report something observed but don't say how they know. Often identified by specific counts, file names, or code patterns that imply inspection happened.

- CLAIM-HWP-01-02 (zero `import logging` statements)
- CLAIM-HWP-01-03 (17 print() calls in cli.py)
- CLAIM-HWP-02-01 (12/22/18/2 exception handlers across files)
- CLAIM-CN-01-03 (80 tests — implies a test count)
- CLAIM-CN-03-03 (CTXT-04 implemented in Phase 2)
- CLAIM-ZL-15-02 (928 total tests, 129 Jest + 799 pytest)
- CLAIM-ZL-18-01 (test key names — specific pre-v3 keys named)
- CLAIM-ZL-18-02 (passes locally, fails CI)

These are verifiable but not self-verifying. A reader who wants to check must redo the inspection. The claims may have been accurate at time of writing but CONTEXT documents age without their empirical basis refreshing.

---

### Group C: Issue-Cited Claims

Claims grounded in a specific GitHub issue number (or equivalent external ticket). The citation makes them more verifiable than unsourced claims, but introduces new dependencies: on the accuracy of the issue's description, on who filed it, and on whether Claude Code's behavior has changed since the issue was filed.

- CLAIM-HWP-01-06 (FastMCP issue fastmcp#1761)
- CLAIM-CN-02-04 (PermissionRequest behavior, GitHub #29212)
- CLAIM-CN-04-01 (async hook behavior, issue #12176, "Anthropic confirmed")
- CLAIM-ZL-16-04 (Issue #11, real user "server disconnected")
- CLAIM-ZL-17-03 (Issue #11 root cause inference)

Issue citations are epistemically heterogeneous. Issue #11 is the best: the reporter is named, the screenshot described, and the inference labeled "likely." Issue #12176's "Anthropic confirmed" attribution is the weakest: the CONTEXT doesn't say whether it was confirmed by an Anthropic employee's comment or derived from official documentation.

---

### Group D: Design Decisions Presented as Facts

Claims that record a decision but frame it as something structurally required or technically inevitable. These are often in `<constraints>` and `<decisions>` sections but lack the "we decided X" framing — they read like facts about the world.

- CLAIM-HWP-01-04 (stdout is sacred — constraint framed as MCP specification requirement)
- CLAIM-CN-01-02 (unknown events → silent fail — design choice framed as correct behavior)
- CLAIM-CN-03-01 (tmux in title — decision framed as serving a principle)
- CLAIM-HWP-02-03 (staged rollout required — process judgment framed as requirement)

These claims are not wrong, but their epistemic status is ambiguous. Presenting a decision as a structural constraint gives it more force than it deserves — someone reading the CONTEXT cannot easily distinguish "we chose this" from "the spec requires this." The best of these (CLAIM-HWP-01-04) is closest to factual because the MCP spec is a real external document.

---

### Group E: Self-Aware Temporal Claims

Claims that explicitly flag their own potential staleness or call for re-verification before use. This is an unusual and epistemically sophisticated move.

- CLAIM-CN-04-02 (PermissionRequest mode-dependency, "week-old finding" — explicitly calls for re-verification)
- CLAIM-CN-04-05 (ntfy alternatives research is 9 days old — built-in expiry notice)
- CLAIM-CN-04-06 (Prompt 3 URL scheme "not publicly documented — needs hands-on verification")
- Phase 04 guardrail as a whole: "Do not assume AskUserQuestion can be responded to via hooks"

claude-notify Phase 04 is by far the most epistemically self-aware file in this batch. It consistently distinguishes "found" from "verified," "assumption" from "fact," and records the age of evidence alongside its content. This is the practice the other files should emulate.

---

### Group F: Synthesis Conclusions from Named Research Tracks

Claims that report "research shows X" or "dimensions A, B, C all converge on Y" without providing the underlying research as a citation.

- CLAIM-HWP-01-01 (STACK, FEATURES, PITFALLS converge on structlog)
- CLAIM-CN-02-03 (self-hosted ntfy doesn't solve iOS rate limits)
- CLAIM-CN-02-05 ("validated by disler observability project")

These feel grounded but are opaque. They invoke a research process without externalizing its output. A reader cannot check whether STACK research really converged on structlog because the STACK document is not linked. These claims inherit credibility from the research process without sharing its evidence.

---

### Group G: Scope-Boundary Claims

Claims that define what is in or out of scope for a phase. These are significant because they distribute risk — if a boundary claim is wrong, work either bleeds into an adjacent phase or falls in a gap between phases.

- HWP-01: "No changes to tool behavior, error handling, or skill packaging"
- HWP-02: "This phase is not the global cleanup"
- HWP-041: "Phase 04.1 exists to prove those claims on real machine topologies"
- ZL-15: "This phase installs the tools. Phase 17 wires them into CI as enforcement gates."
- ZL-17: "It validates and gates what already exists."
- ZL-18: "No new features, no architectural changes — strictly fixing broken tests"

These claims are rarely investigated — they are declared. But the cross-phase sequencing depends on them. The hermeneutic-workspace-plugin files are particularly careful about this (they use `<domain>` sections explicitly for scope). The zlibrary-mcp files phrase it more conversationally. None of them describe how scope was determined or what would happen if the boundary moved.

---

### Group H: Normative Claims About Quality or Process

Claims that assert what the right approach is, what counts as done, or how people should behave. These are not factual claims — they are value claims embedded in planning documents.

- CLAIM-HWP-05-02 ("research-first, not premature architecture lock-in")
- CLAIM-HWP-05-03 ("judge by downstream writing quality, not retrieval metrics alone")
- CLAIM-ZL-15-06 (5% coverage buffer is the right threshold)
- CLAIM-ZL-17-04 (Issue #11 response must be respectful and helpful)
- CLAIM-CN-04-05 (guardrail framing as a process norm)

These claims are not wrong to make in a CONTEXT document, but they are categorically different from empirical claims and should be read that way. The 5% coverage buffer is the clearest example: it is presented as a derived technical decision but is actually a rule-of-thumb.

---

## Part 3: Boundary Cases and Cross-Cutting Observations

---

### The "marked assumption" that functions as a constraint

Several claims appear in `<assumptions>` sections but are treated by downstream decisions as settled. CLAIM-CN-04-01 (blocking model within 600s timeout) is labeled an assumption but the implementation decision in `<decisions>` builds on it as if it were resolved. The assumption/decision boundary is porous.

---

### Counts are the most common empirical proxy

More claims are grounded through counting (tests, exception handlers, files, print() calls) than through any other method. Counts are easy to verify once and hard to keep current. The 80-test claim (claude-notify Phase 01) was likely accurate when written; by Phase 02, tests had changed. Counts in CONTEXT files carry implicit timestamps.

---

### External citations favor GitHub issues over documentation

Of the issue-cited claims, all cite GitHub issues rather than Anthropic's official Claude Code documentation. This pattern reflects the real state of Claude Code's documentation (often absent or behind the actual behavior), but it means claims about Claude Code's behavior are grounded in user reports and discussions rather than specifications.

---

### The zlibrary-mcp files are operationally concrete; the hermeneutic files are architecturally abstract

The zlibrary-mcp CONTEXT files contain more method-cited empirical claims (file counts, tarball sizes, test names, tag names) because they are downstream of implementation work and doing cleanup. The hermeneutic files are earlier in their lifecycle — they are planning for systems not yet built — so their claims are necessarily more speculative and design-forward. This is appropriate to the project stage, not a quality difference.

---

### claude-notify Phase 04 is an outlier in epistemic care

Phase 04 of claude-notify explicitly records evidence age, marks assumptions as assumptions, and includes guardrails that tell the researcher what NOT to assume. No other file in this batch does all three. The difference correlates with the degree of genuine uncertainty: Phase 04 is facing a novel interactive architecture that has never been built, whereas the other phases are implementing known patterns in known codebases.

---

### Deferred sections show different epistemic postures

The hermeneutic Phase 01 deferred section lists future work. The claude-notify Phase 01 deferred section is more epistemically interesting — it raises unresolved questions about things not owned by any phase, and asks whether they are "intentional deferral or oversight." This is a meta-epistemic observation about the planning system itself, not just a list of future work.

---

## Summary

The 12 files produced roughly 72 analyzable claims. The types that emerged:

| Type (induced) | Character | Quality Range |
|---|---|---|
| A: Empirical with method | Tells you how to verify | Strongest |
| B: Empirical without method | Implies inspection happened | Good but ages silently |
| C: Issue-cited | Traceable but mediated | Variable (depends on issue quality) |
| D: Decision-as-fact | Hides epistemic status | Requires careful reading |
| E: Self-aware temporal | Flags own staleness | Strongest epistemic practice |
| F: Named-research synthesis | Credits a process, not a finding | Opaque |
| G: Scope boundary | Declared, not derived | Rarely examined but high stakes |
| H: Normative/process | Value claim embedded in technical context | Not wrong, but different kind of claim |

The most consequential gap across all 12 files: **empirical claims without method** (Group B). These are the easiest to produce (just state what you found), the most common, and the hardest to audit later — the reader cannot tell whether the claim reflects a careful grep or a memory. A minimal improvement would be to cite the verification method even informally: "grep -c 'except Exception' reveals 22 handlers in orchestrate.py" is the same information as "22 broad handlers in orchestrate.py" but carries its own provenance.

---

*Audit completed 2026-04-09*
*Files examined: 12 CONTEXT.md files across 3 projects*
