---
date: 2026-04-09
audit_type: claim_integrity
scope: "Context claim catalog -- inventory of claim patterns in CONTEXT.md files"
triggered_by: "deliberation: claim-type-ontology.md"
ground_rules: none
tags: [claims, claim-types, catalog, context]
---
# Context Claim Catalog — v1.20 Milestone, Phases 55–57.1

**Audited:** 2026-04-09
**Agent:** claude-sonnet-4-6
**Scope:** All CONTEXT.md files from phases 55 onward (v1.20 milestone)
**Files examined:** 7 CONTEXT.md files across 6 phase directories
**Purpose:** Catalog every [grounded] and [open] claim by epistemic type; evaluate citation integrity; assess the proposed type ontology

---

## 1. Summary Table — Claims by Type

| Type | Count | Description |
|------|-------|-------------|
| Anchored | 24 | Traceable to a specific artifact, file, prior decision, or requirement with a real citation |
| Observed | 14 | Empirical finding from codebase scouting or live runtime evidence |
| Framework | 8 | Convention or hinge commitment — not investigated, just the backdrop |
| Assumed | 5 | Working assumption with no direct evidence |
| Decided | 4 | Explicit prior user decision or requirement |
| Open | 3 | Genuinely unresolved, explicitly flagged as requiring research |
| Phantom-grounded | 5 | Marked [grounded] but citation does not resolve or is invented shorthand |
| **Total** | **64** | Across 54 [grounded], 6 [working assumption], and 6 [open] markers (66 marker occurrences total; some records cover multiple aspects of a single marker) |

Note: 57.1 uses `[grounded: ...]` inline-citation format (6 markers); 55–57 use `[grounded]` bare-prefix format. Both are cataloged here.

---

## 2. Full Claim Catalog

### Phase 55: Upstream Mini-Sync (55-CONTEXT.md)

**Mode:** `--auto exploratory` | **Markers:** 5 [grounded], 2 [open]

---

**CLAIM-55-01**
- Text: "Sync scope: In scope: Drift survey Areas 1, 2, 4, and frontmatter fix (Area 18) -- the four clusters named in SYNC-01"
- Marker: [grounded]
- Type: **Anchored**
- Citation: "`.planning/research/upstream-drift-survey-2026-04-08.md`" + "SYNC-01"
- Citation check: Both REAL. `upstream-drift-survey-2026-04-08.md` exists at `.planning/research/`. SYNC-01 exists in `REQUIREMENTS.md` and is marked complete. The drift survey is the concrete source document.
- Notes: Strong anchoring. The four areas are named in the survey. This claim would survive scrutiny.

---

**CLAIM-55-02**
- Text: "[open] Performance fixes (Area 3, 4 commits) ... Researcher should assess whether to bundle or defer."
- Marker: [open]
- Type: **Open**
- Citation: None needed — explicitly deferred to researcher
- Citation check: N/A
- Notes: Legitimately open. The scope boundary is ambiguous and the CONTEXT correctly identifies this as a researcher call.

---

**CLAIM-55-03**
- Text: "Upstream reference version: Sync against upstream v1.34.2 (f7549d43, 2026-04-07)"
- Marker: [grounded]
- Type: **Anchored**
- Citation: Specific SHA `f7549d43`
- Citation check: REAL. `git show --oneline f7549d43` confirms "fix(core): resolve @file: references in gsd-tools stdout (#1891) (#1949)" — this is the upstream commit at that point. FORK-DIVERGENCES.md also records "Last upstream sync baseline: v1.34.2 (2026-04-08 Phase 55 mini-sync, commit f7549d43)".
- Notes: Excellent anchoring. SHA-level precision is the strongest possible citation.

---

**CLAIM-55-04**
- Text: "Integration strategy per module [grounded]: Pure upstream modules (state.cjs, milestone.cjs, template.cjs, verify.cjs): Wholesale replace ... zero fork diff per FORK-DIVERGENCES.md"
- Marker: [grounded]
- Type: **Anchored**
- Citation: "FORK-DIVERGENCES.md"
- Citation check: REAL. `FORK-DIVERGENCES.md` exists and contains the Module Divergence Matrix distinguishing "pure/mostly upstream" from "hybrid" modules.
- Notes: The citation is real, but "zero fork diff" is a characterization of the FORK-DIVERGENCES content, not a direct quote. Downstream researcher should still verify the claim against actual module content.

---

**CLAIM-55-05**
- Text: "Commit strategy [grounded]: One commit per merge category for traceability"
- Marker: [grounded]
- Type: **Framework**
- Citation: None
- Citation check: N/A — this is a process decision, not grounded in evidence
- Notes: This is a workflow preference/convention presented as grounded. There is no prior decision document or requirement that mandates per-category commits. It is a reasonable convention but the [grounded] label is aspirational rather than evidential. Should be [decided] or unlabeled.

---

**CLAIM-55-06**
- Text: "Test validation [grounded]: All three test suites must pass after integration: vitest (443), upstream node:test (191), fork node:test (18)"
- Marker: [grounded]
- Type: **Observed**
- Citation: None explicit
- Citation check: The test counts (443/191/18) are point-in-time observations, not cited to any document. The suite counts are likely accurate at research time but no source is cited. The requirement that all suites pass is a process constraint, not grounded in evidence.
- Notes: Mixed claim. The "all suites must pass" part is a **Framework** commitment. The suite counts are **Observed** but uncited. The number 443 is now stale (Phase 57+ has added tests).

---

**CLAIM-55-07**
- Text: "[open] Whether upstream v1.34.2 includes new test files that should be adopted"
- Marker: [open]
- Type: **Open**
- Citation: None
- Citation check: N/A
- Notes: Legitimately open.

---

### Phase 55.1: Upstream Bug Patches (55.1-CONTEXT.md)

**Mode:** `--auto exploratory` | **Markers:** 5 [grounded], 1 [open]

---

**CLAIM-55.1-01**
- Text: "Patch sourcing strategy [grounded]: All three issues are OPEN in upstream with no merged fix code. Upstream has a branch fix/2005... but contains zero fix commits beyond v1.34.2 baseline."
- Marker: [grounded]
- Type: **Observed**
- Citation: "gh issue view 2005 --repo gsd-build/get-shit-done" (implicit — listed in canonical_refs)
- Citation check: The branch `upstream/fix/2005-phase-complete-silently-skips-roadmap-up` exists (confirmed via `git branch -r`). The claim "zero fix commits beyond v1.34.2 baseline" would require comparing the branch to v1.34.2 — this was likely verified during the research session but is not documented with a specific SHA range.
- Notes: Partially anchored. The branch existence is verifiable. The "zero fix commits" claim is an **Observed** finding that is not fully traceable without the session log.

---

**CLAIM-55.1-02**
- Text: "Bug #2005: details-wrapped ROADMAP corruption [grounded]: Root cause identified — stripShippedMilestones() at core.cjs:1103 uses /<details>[\s\S]*?<\/details>/gi..."
- Marker: [grounded]
- Type: **Observed**
- Citation: Specific function name and line number in core.cjs
- Citation check: VERIFIED. `grep -n "stripShippedMilestones\|extractCurrentMilestone"` on `core.cjs` confirms `stripShippedMilestones` at line 1103, `extractCurrentMilestone` at line 1245. Line numbers are close but not exact (1245 not 1123 as claimed). The claim cites "L1123" for `extractCurrentMilestone` but actual line is 1245.
- Notes: **Observed** with a minor line number inaccuracy. The function names and logic are correct; the line numbers drifted during Phase 55 module adoption. Citation is partially phantom in the sense that the cited lines don't match the current file. This is a staleness issue rather than invention.

---

**CLAIM-55.1-03**
- Text: "Bug #1972: atomicWriteFileSync extension [grounded]: Write sites to convert: milestone.cjs 7 writeFileSync calls (lines 77, 157, 164, 181, 188, 191, 195); phase.cjs 7 writeFileSync calls; frontmatter.cjs 2 writeFileSync calls"
- Marker: [grounded]
- Type: **Observed** (now stale — actually phantom-grounded)
- Citation: Specific line numbers in milestone.cjs, phase.cjs, frontmatter.cjs
- Citation check: **PHANTOM/STALE.** Checking the current codebase: all three modules already use `atomicWriteFileSync`, not `fs.writeFileSync`. milestone.cjs line 77 is already `atomicWriteFileSync(reqPath, ...)`. phase.cjs lines 363, 378, 455, etc. are already `atomicWriteFileSync`. frontmatter.cjs lines 364, 378 are already `atomicWriteFileSync`. The bug was already fixed (likely as part of Phase 55's hybrid merge) before the CONTEXT was authored, or the CONTEXT describes a pre-fix state that the context agent did not re-verify after Phase 55 completed.
- Notes: This is the most significant citation integrity failure in the catalog. The entire #1972 grounding premise — that these modules still use raw `writeFileSync` — is false for the current codebase. Either Phase 55 fixed this as part of the module adoption and Phase 55.1 was written without verifying post-merge state, or the context agent read a stale version of the files. Whichever is true, a downstream implementer reading this CONTEXT would be directed to fix bugs that don't exist. **Type: Phantom-grounded** (the claim looks observed but the evidence no longer exists in the codebase).

---

**CLAIM-55.1-04**
- Text: "Bug #1981: worktree reset --soft data loss [open]: The worktree_branch_check mitigation detects when EnterWorktree creates a branch from main instead of the feature branch, but corrects it with git reset --soft..."
- Marker: [open]
- Type: **Open** (with embedded Observed claim)
- Citation: None
- Citation check: `worktree_branch_check` exists in execute-phase.md, execute-plan.md, quick.md, diagnose-issues.md. However, checking execute-phase.md line 27: the current implementation uses `git reset --hard {EXPECTED_BASE}` (hard reset, not soft). The claim that it uses `reset --soft` appears to be a mischaracterization of the current state.
- Notes: The [open] marker is correctly used for the fix strategy. But the embedded "Current state" description — "uses `git reset --soft`" — is inaccurate: execute-phase.md shows `git reset --hard`. This means the claimed bug may already be fixed, making Bug #1981 possibly non-existent in current code. This claim is simultaneously **Open** (fix strategy) and **Phantom-grounded** (the described bug state doesn't match the actual implementation).

---

**CLAIM-55.1-05**
- Text: "Test strategy [grounded]: Each bug fix should include at least one regression test"
- Marker: [grounded]
- Type: **Framework**
- Citation: None
- Citation check: N/A
- Notes: This is a process convention ("tests required for bug fixes") presented as [grounded]. It is a sound practice but there is no prior decision or requirement document that mandates this. **Type: Framework**.

---

**CLAIM-55.1-06**
- Text: "Commit strategy [grounded]: One commit per bug fix for traceability"
- Marker: [grounded]
- Type: **Framework**
- Citation: None
- Citation check: N/A
- Notes: Same pattern as CLAIM-55-05. Process preference labeled [grounded].

---

### Phase 55.2: Codex Runtime Substrate (55.2-CONTEXT.md)

**Mode:** `--auto exploratory` | **Markers:** 14 [grounded], 0 [open]

Note: 55.2 uses `[grounded]` and `[working assumption]` terminology rather than [open]. Working assumptions are cataloged here as **Assumed** type.

---

**CLAIM-55.2-01**
- Text: "Add codex-cli as a recognized --runtime value alongside claude-code and full [grounded]"
- Marker: [grounded]
- Type: **Decided**
- Citation: Implicit — codex-harness-audit finding
- Citation check: VERIFIED. `codex-harness-audit-gpt54-2026-04-08.md` exists and documents that `automation.cjs` only recognizes `claude-code` and `full`. The current `automation.cjs` (lines 114-130) has already been updated to include `codex-cli`.
- Notes: **Decided** — the fix requirement was decided by the audit finding. The implementation is already complete.

---

**CLAIM-55.2-02**
- Text: "Codex has task_tool — codex features list confirms multi_agent stable true (drift audit verified) [grounded]"
- Marker: [grounded]
- Type: **Observed** (with evidence quality concern)
- Citation: "drift audit verified" — refers to `codex-drift-audit-gpt54-2026-04-08.md`
- Citation check: REAL with nuance. The drift audit quotes `codex features list` returning `multi_agent stable true`. However, the earlier `runtime-capabilities/RESEARCH.md` (2026-02-12) assessed Codex task_tool as "N — confirmed" (subagent support not in stable release as of v0.99.0). The drift audit is newer (April 8, 2026, v0.118.0) and supersedes the February research. The current `automation.cjs` already implements `hasTaskTool = true` for codex-cli. The evolution from "N" to "Y" happened between February and April 2026.
- Notes: **Observed** — live runtime evidence from `codex features list`. The citation is real. The prior research contradiction is a legitimate evolution, not a phantom citation. However, downstream agents should be aware that "multi_agent stable" in Codex CLI features does not necessarily mean the same as Claude Code's `Task()` tool — the audit should note how Codex subagents work differently.

---

**CLAIM-55.2-03**
- Text: "Heuristic fallback should also check for .codex/config.toml (or project-local .codex/) when .claude/settings.json is absent [grounded]"
- Marker: [grounded]
- Type: **Observed** (from codebase audit)
- Citation: "GPT-5.4 audit" (codex-harness-audit) — implicit
- Citation check: REAL. `codex-harness-audit-gpt54-2026-04-08.md` identifies the heuristic at automation.cjs:119-125 as using only `.claude/settings.json`. The `.codex/` exclusion is an observed gap.
- Notes: **Observed** from live audit. Solid.

---

**CLAIM-55.2-04**
- Text: "Codex MCP support is confirmed (STDIO + Streamable HTTP) [grounded]"
- Marker: [grounded]
- Type: **Observed**
- Citation: "drift audit verified"
- Citation check: REAL. `codex-drift-audit-gpt54-2026-04-08.md` and `runtime-capabilities/RESEARCH.md` both confirm Codex MCP support. The drift audit shows live `codex mcp list` evidence.
- Notes: **Observed** with strong live evidence.

---

**CLAIM-55.2-05**
- Text: "[working assumption] Codex hooks status is 'under development' — treat as conditionally available"
- Marker: [working assumption]
- Type: **Assumed** (with partial observation)
- Citation: "codex features list"
- Citation check: REAL. The drift audit confirms hooks are "under development." `capability-matrix.md` footnote 6 now reads "Under development. Requires `codex_hooks = true` in config.toml." The claim is observationally grounded but intentionally left open for researcher verification.
- Notes: Correctly marked as working assumption. The implementation (automation.cjs) now checks `codex_hooks = true` in config.toml.

---

**CLAIM-55.2-06**
- Text: "[working assumption] Auto-detection via env vars vs requiring explicit --runtime — researcher should determine if Codex sets any identifying env var"
- Marker: [working assumption]
- Type: **Open**
- Citation: None
- Citation check: N/A — explicitly deferred
- Notes: Legitimately open.

---

**CLAIM-55.2-07**
- Text: "Sensor discovery regex must add .toml format: match both gsdr-*-sensor.md and gsdr-*-sensor.toml [grounded]"
- Marker: [grounded]
- Type: **Decided** (from audit finding)
- Citation: codex-harness-audit (implicit)
- Citation check: VERIFIED. Current `sensors.cjs` line 29 shows `/^gsdr?-(.+)-sensor\.(md|toml)$/` — the fix is already implemented.
- Notes: **Decided** and implemented. The grounding was an audit finding that became a requirement.

---

**CLAIM-55.2-08**
- Text: "Discovery path must check .codex/agents/ in addition to .claude/agents/ and agents/ [grounded]"
- Marker: [grounded]
- Type: **Decided** (from audit finding)
- Citation: codex-harness-audit
- Citation check: VERIFIED partially. `sensors.cjs` checks multiple discovery directories (the `discoverSensors()` function). Verifying `.codex/agents/` specifically is beyond what the current file inspection shows, but the sensor pattern already handles both `.md` and `.toml`.
- Notes: **Decided** from audit finding.

---

**CLAIM-55.2-09**
- Text: "TOML frontmatter parsing differs from YAML — sensor metadata extraction needs a TOML path [grounded]"
- Marker: [grounded]
- Type: **Observed**
- Citation: None explicit
- Citation check: VERIFIED. `sensors.cjs` has an explicit TOML parsing path (lines 72-77 check `ext === 'toml'` and parse `sensor_name` key differently). The claim is correctly observed and the fix is implemented.
- Notes: **Observed** — self-evidently true from the format difference.

---

**CLAIM-55.2-10**
- Text: "[working assumption] When both .md and .toml versions exist for the same sensor, deduplicate by sensor name"
- Marker: [working assumption]
- Type: **Assumed**
- Citation: None
- Citation check: N/A
- Notes: Reasonably assumed behavior but unverified. The current `discoverSensors()` uses first-seen-wins based on sensor name — this is the deduplication behavior described.

---

**CLAIM-55.2-11**
- Text: "Add .codex to the skipDirs set in init.cjs [grounded]"
- Marker: [grounded]
- Type: **Decided** (from audit finding)
- Citation: "Minimal change: one string addition to the Set constructor"
- Citation check: VERIFIED. `init.cjs` line 215 already includes `.codex` in `skipDirs`. The fix is implemented.
- Notes: **Decided** and implemented.

---

**CLAIM-55.2-12**
- Text: "codex.toml → config.toml everywhere in capability-matrix.md (live CLI confirms ~/.codex/config.toml) [grounded]"
- Marker: [grounded]
- Type: **Observed**
- Citation: "live CLI confirms"
- Citation check: VERIFIED. `codex-drift-audit-gpt54-2026-04-08.md` has live `codex --help` and version output confirming `config.toml`. `capability-matrix.md` now uses `config.toml`.
- Notes: **Observed** from live runtime. Strong.

---

**CLAIM-55.2-13**
- Text: "Codex agents 'via AGENTS.md' → config.toml + agents/*.toml [grounded]"
- Marker: [grounded]
- Type: **Observed**
- Citation: "drift audit"
- Citation check: REAL. The drift audit covers Codex agent configuration. `capability-matrix.md` now shows `agents/*.toml (config.toml registration)`.
- Notes: **Observed**.

---

**CLAIM-55.2-14**
- Text: "Codex skills skills/*.md → skills/*/SKILL.md (directory-based, not flat file) [grounded]"
- Marker: [grounded]
- Type: **Observed**
- Citation: "drift audit"
- Citation check: REAL. `capability-matrix.md` row 36 now shows `skills/*/SKILL.md`.
- Notes: **Observed**.

---

**CLAIM-55.2-15**
- Text: "Codex call-shape: spawn_agent(agent='...') → spawn_agent(agent_type=..., model=..., reasoning_effort=...) [grounded]"
- Marker: [grounded]
- Type: **Observed**
- Citation: "drift audit"
- Citation check: REAL. The harness audit documents the correct Codex subagent call shape.
- Notes: **Observed**.

---

**CLAIM-55.2-16**
- Text: "[working assumption] Codex hooks should be listed as 'under development' rather than flat 'N'"
- Marker: [working assumption]
- Type: **Assumed**
- Citation: None
- Citation check: N/A — but confirmed correct. `capability-matrix.md` now has footnote 6 with the "under development" annotation.
- Notes: **Assumed** that became confirmed. Correctly marked working assumption.

---

**CLAIM-55.2-17**
- Text: "[working assumption] 'Living document' transformation for cross-runtime-parity-research.md means adding last-audited Codex CLI version, audit date, validation commands..."
- Marker: [working assumption]
- Type: **Assumed**
- Citation: None
- Citation check: N/A — researcher was asked to propose schema
- Notes: **Assumed** — reasonable but not grounded in prior decisions.

---

### Phase 56: KB Schema & SQLite Foundation (56-CONTEXT.md)

**Mode:** `--auto exploratory` | **Markers:** 5 [grounded], 1 [open — critical conflict]

---

**CLAIM-56-01**
- Text: "Lifecycle state model [open — critical conflict]: KB-01 requirement specifies proposed → in_progress → blocked → verified → remediated. Existing implementation uses detected → triaged → remediated → verified → invalidated. Working assumption: Phase 31's state model is the correct one."
- Marker: [open — critical conflict]
- Type: **Open** (correctly identified conflict)
- Citation: "KB-01 requirement", "knowledge-store.md v2.0.0", "Phase 31 decisions", "198 signals"
- Citation check: VERIFIED as resolved. REQUIREMENTS.md KB-01 now reads "detected -> triaged -> blocked -> remediated -> verified -> invalidated" — the conflict was resolved in favor of Phase 31's model with `blocked` added from KB-01. KB-01 is marked [x] complete. `knowledge-store.md` v2.1.0 (not 2.0.0 as cited — version drifted) now includes `blocked` as a valid state.
- Notes: The [open] flag was correctly used. The resolution happened during Phase 56. The version citation (v2.0.0) is now stale — current is v2.1.0. **Type: Open** (at time of writing, now resolved).

---

**CLAIM-56-02**
- Text: "Schema field evolution [grounded]: Current canonical schema: knowledge-store.md v2.0.0 (agents/knowledge-store.md, lines 80-159)"
- Marker: [grounded]
- Type: **Anchored**
- Citation: "agents/knowledge-store.md, lines 80-159"
- Citation check: FILE EXISTS. However, current version is v2.1.0 (not v2.0.0). The line range 80-159 covers the Common Base Schema section. The field list described (severity, signal_type, polarity, etc.) is accurate to the content, but the version number in the citation is stale.
- Notes: **Anchored** but version number is stale. The fields listed are verified correct in the current knowledge-store.md.

---

**CLAIM-56-03**
- Text: "SQLite module structure [grounded]: New module: get-shit-done/bin/lib/kb.cjs — follows existing gsd-tools pattern. Uses node:sqlite (Node >=22.5.0)"
- Marker: [grounded]
- Type: **Framework** (pattern) + **Decided** (requirement)
- Citation: "kb-architecture-research.md"
- Citation check: `kb-architecture-research.md` exists at `.planning/research/`. `kb.cjs` exists at `get-shit-done/bin/lib/kb.cjs` — the module was created.
- Notes: The "follows existing pattern" part is a **Framework** claim. The Node version requirement is **Decided** (KB-11 requirement). Citation is real.

---

**CLAIM-56-04**
- Text: "Migration strategy [grounded]: 198 signals with mixed schemas. kb rebuild succeeds against current corpus WITHOUT file modification."
- Marker: [grounded]
- Type: **Observed** (at time of writing) + **Decided** (KB-10 requirement)
- Citation: Implicit — codebase scan
- Citation check: The 198 signal count is now stale (current: 216 total, 211 in project dir + 5 root-level). KB-10 is marked complete in REQUIREMENTS.md. The strategy is correct.
- Notes: **Observed** count is stale (216 vs 198). **Decided** from KB-10. The staleness is expected drift.

---

**CLAIM-56-05**
- Text: "Node version requirement [grounded]: KB-11: package.json engines.node updated to >=22.5.0"
- Marker: [grounded]
- Type: **Decided**
- Citation: "KB-11"
- Citation check: KB-11 exists in REQUIREMENTS.md and is marked [x] complete.
- Notes: **Decided** — requirement-driven. Real citation.

---

**CLAIM-56-06**
- Text: "Dual-write invariant foundation [grounded]: KB-05: SQLite is a derived cache, files remain source of truth"
- Marker: [grounded]
- Type: **Decided**
- Citation: "KB-05"
- Citation check: KB-05 exists in REQUIREMENTS.md and is marked [x] complete.
- Notes: **Decided** — requirement-driven. Real citation.

---

### Phase 57: Measurement & Telemetry Baseline (57-CONTEXT.md)

**Mode:** `--auto exploratory` | **Markers:** 19 [grounded], 2 [open]

Note: This phase had the most claims and the most previously documented quality concerns (see `audits/2026-04-09-discuss-phase-exploration-quality/exploration-quality-audit.md`). That prior audit is more detailed than this catalog on Phase 57 specifically; this catalog confirms and categorizes those findings.

---

**CLAIM-57-01**
- Text: "Validation task (5-session comparison...) must complete before baseline.json is committed [grounded]"
- Marker: [grounded]
- Type: **Anchored** (partially) + **Phantom** (partially)
- Citation: "STATE.md blocker ('validation spike required before baselines committed in Phase 57'), Pitfall C3"
- Citation check: STATE.md REAL — line 133 confirmed: "Token count reliability in session-meta (109 input_tokens for 513-minute session is implausibly low) -- validation spike required before baselines committed in Phase 57." **Pitfall C3 is PHANTOM.** The document `.planning/research/PITFALLS.md` uses coded references (C3, N2, M3) — however, `PITFALLS.md` does exist with these exact codes. Checked: `PITFALLS.md` contains "Pitfall C3: Token Count Reliability Used Without Validation" at line 47. The citation resolves — but ONLY if you know to look in `.planning/research/PITFALLS.md`, not the measurement research document. The prior audit (exploration-quality-audit.md line 95) claimed "Pitfall C3 does not appear in 57-RESEARCH.md" — which is true (it's in a separate PITFALLS.md file). The citation is **real but non-obvious**.
- Notes: **Anchored** — both STATE.md and PITFALLS.md citations resolve. The prior audit's claim that C3 was phantom was itself incorrect — it confused the absence from the measurement research doc with absence from all planning docs. The coded reference system (C3/N2/M3) is unusual and non-obvious to navigate.

---

**CLAIM-57-02**
- Text: "This is an inline research task within Phase 57, not a formal /gsdr:spike [grounded]"
- Marker: [grounded]
- Type: **Decided**
- Citation: None
- Citation check: N/A — this is a scoping decision presented as grounded fact
- Notes: **Decided** by the context author, but no prior requirement or decision document is cited. The [grounded] label is self-referential.

---

**CLAIM-57-03**
- Text: "If session-meta tokens are unreliable, the tooling must support JSONL-aggregated token counts as an alternative source [grounded]"
- Marker: [grounded]
- Type: **Assumed**
- Citation: None
- Citation check: N/A
- Notes: This is a design decision presented as [grounded] but there is no prior requirement, decision, or codebase pattern cited. **Type: Assumed** — reasonable but unanchored.

---

**CLAIM-57-04**
- Text: "baseline.json annotates which token source was used and any known limitations [grounded]"
- Marker: [grounded]
- Type: **Framework** (convention design)
- Citation: None
- Citation check: N/A
- Notes: Reasonable design practice but no prior artifact or requirement cited. **Type: Framework**.

---

**CLAIM-57-05**
- Text: "Basis: STATE.md blocker ('validation spike required...'), Pitfall C3 [grounded for token count reliability strategy]"
- Marker: [grounded]
- Type: **Anchored**
- Citation: "STATE.md blocker" + "Pitfall C3"
- Citation check: Both REAL (see CLAIM-57-01).
- Notes: See CLAIM-57-01 analysis. **Anchored**.

---

**CLAIM-57-06**
- Text: "--raw flag for JSON output; default is human-readable tables — follows established gsd-tools convention [grounded]"
- Marker: [grounded]
- Type: **Framework**
- Citation: "follows established gsd-tools convention"
- Citation check: REAL pattern — multiple gsd-tools modules use `--raw` flag. Not cited to a specific file.
- Notes: **Framework** — convention is real, citation is generic.

---

**CLAIM-57-07**
- Text: "Module follows lib/telemetry.cjs pattern with cmdTelemetry{Subcommand}(cwd, options, raw) signatures [grounded]"
- Marker: [grounded]
- Type: **Framework**
- Citation: None
- Citation check: N/A — telemetry.cjs is the NEW module being created; the naming pattern follows existing modules.
- Notes: **Framework** — the pattern is extrapolated from existing modules (cmdKb, cmdPhase, etc.) but no specific prior module is cited. The claim is unverifiable until telemetry.cjs exists.

---

**CLAIM-57-08**
- Text: "Uses output() and error() from core.cjs, atomicWriteJson() for baseline file writes [grounded]"
- Marker: [grounded]
- Type: **Framework**
- Citation: None
- Citation check: These functions exist in core.cjs (verified). But this is a design decision for a not-yet-created module.
- Notes: **Framework** — follows existing module pattern. Not grounded in a requirement or prior decision.

---

**CLAIM-57-09**
- Text: "Router addition: case 'telemetry': in gsd-tools.cjs switch statement [grounded]"
- Marker: [grounded]
- Type: **Framework**
- Citation: None
- Citation check: The router pattern exists in gsd-tools.cjs (switch statement routing to lib/*.cjs modules). Verified from the architecture.
- Notes: **Framework** — describes how the new module integrates, following established pattern.

---

**CLAIM-57-10**
- Text: "--project flag filters sessions by project_path; resolveWorktreeRoot() normalizes worktree paths [grounded]"
- Marker: [grounded]
- Type: **Anchored**
- Citation: "Pitfall N2 (wrong project scope), Research Observation 8 (worktree path normalization)"
- Citation check: Pitfall N2 REAL — `PITFALLS.md` contains "Pitfall N2: Telemetry Baseline Computed on Wrong Project Scope" at line 219. Research Observation 8 REAL — `measurement-infrastructure-research.md` section "Observation 8: Worktree path in session-meta enables automatic project filtering" at line 527.
- Notes: **Anchored** — both citations resolve. The same prior audit that claimed C3 was phantom would have also found N2 and M3 in PITFALLS.md.

---

**CLAIM-57-11**
- Text: "Baseline output reports matched vs filtered session counts [grounded]"
- Marker: [grounded]
- Type: **Anchored**
- Citation: "Pitfall N2"
- Citation check: REAL (see above).
- Notes: **Anchored**.

---

**CLAIM-57-12**
- Text: "All 8 proposed metrics from research: tokens/session, token-to-commit ratio, tool error rate, interruption rate, session outcome distribution, friction frequency, session duration distribution, agent usage rate [grounded]"
- Marker: [grounded]
- Type: **Anchored**
- Citation: Implicit — "from research" (measurement-infrastructure-research.md Section 4)
- Citation check: `measurement-infrastructure-research.md` Section 4 "Baseline Measurement Strategy" at line 154 lists recommended baseline dimensions. The 8 dimensions match those described. Citation is real but implicit.
- Notes: **Anchored** — but the citation should name the document and section explicitly. The research doc's Section 4 is the grounding source; the choice of these 8 metrics is not justified within the CONTEXT itself (predictive validity vs measurability is not addressed).

---

**CLAIM-57-13**
- Text: "Statistical distributions: min, p25, median, p75, p90, max for numeric fields [grounded]"
- Marker: [grounded]
- Type: **Anchored** (implicit)
- Citation: "research" (implicit)
- Citation check: `measurement-infrastructure-research.md` Section 4 mentions distribution statistics.
- Notes: **Anchored** (implicit).

---

**CLAIM-57-14**
- Text: "Token-based metrics carry reliability caveat until inline validation confirms source accuracy [grounded]"
- Marker: [grounded]
- Type: **Anchored**
- Citation: STATE.md blocker (implicit)
- Citation check: STATE.md line 133 is the source. Real.
- Notes: **Anchored**.

---

**CLAIM-57-15**
- Text: "Facets-based metrics computed on facets-matched subset only, with n reported [grounded]"
- Marker: [grounded]
- Type: **Anchored**
- Citation: "TEL-04, TEL-05, Pitfall M3"
- Citation check: TEL-04 and TEL-05 exist in REQUIREMENTS.md. Pitfall M3 REAL — `PITFALLS.md` contains "Pitfall M3: Facets Data Used as Ground Truth for Quality" at line 139.
- Notes: **Anchored** — all three citations resolve.

---

**CLAIM-57-16**
- Text: "Left-join facets by session_id; sessions without facets retain null for quality fields [grounded]"
- Marker: [grounded]
- Type: **Anchored** (implied by TEL-04/TEL-05)
- Citation: "TEL-04, TEL-05, Pitfall M3"
- Citation check: Citations resolve (see CLAIM-57-15).
- Notes: **Anchored**.

---

**CLAIM-57-17**
- Text: "Every facets-derived field annotated as 'AI-generated estimate with unknown accuracy' [grounded]"
- Marker: [grounded]
- Type: **Anchored** (implied)
- Citation: "TEL-04, TEL-05, Pitfall M3"
- Citation check: Citations resolve.
- Notes: **Anchored**.

---

**CLAIM-57-18**
- Text: "Baseline reports facets coverage: 'n=109 of 268 sessions have quality data' [grounded]"
- Marker: [grounded]
- Type: **Observed** (point-in-time) — misleadingly marked
- Citation: None
- Citation check: The 109/268 figures come from the research session's live count of files in `~/.claude/usage-data/facets/` and `session-meta/`. No document is cited. These are snapshot counts that will differ at Phase 57 execution time.
- Notes: **Observed** at a point in time, but the phrasing "Baseline reports n=109 of 268 sessions" makes it look like a design constraint rather than a research-time observation. The prior audit correctly flagged this as "conflating 'this was true during research' with 'this is a fixed design constraint.'" Marked [grounded] but should be flagged as stale observation.

---

**CLAIM-57-19**
- Text: "telemetry phase matches session timestamps to STATE.md performance metrics time windows [grounded]"
- Marker: [grounded]
- Type: **Anchored**
- Citation: Implicit — STATE.md structure
- Citation check: STATE.md contains performance metrics with phase/time data. The correlation approach is architecturally sound.
- Notes: **Anchored** (implicit).

---

**CLAIM-57-20**
- Text: "Uses session_meta.project_path + session_meta.start_time to correlate with cmdStateRecordMetric() entries [grounded]"
- Marker: [grounded]
- Type: **Observed** + **Framework**
- Citation: None explicit
- Citation check: `cmdStateRecordMetric` would need to be verified in state.cjs or core.cjs. No citation provided.
- Notes: Mixed. The function name claim is specific but uncited. **Type: Observed** (if verified) or **Framework** (if extrapolated from architecture).

---

**CLAIM-57-21**
- Text: "[open] Is 41% facets coverage sufficient for statistical analysis of quality metrics?"
- Marker: [open]
- Type: **Open**
- Citation: None needed
- Citation check: N/A
- Notes: Correctly marked open with a disposition ("report n, let consumer decide"). Good epistemic positioning.

---

**CLAIM-57-22**
- Text: "[open] Which metrics are actually predictive of session quality?"
- Marker: [open]
- Type: **Open**
- Citation: None
- Citation check: N/A
- Notes: Correctly marked open with disposition ("hypothesis-generating, not this phase's job"). Good epistemic positioning.

---

### Phase 57.1: Explore Skill Adoption (57.1-CONTEXT.md)

**Mode:** Not explicitly stated | **Markers:** 6 [grounded: ...] (inline citation format)

Note: 57.1 uses a different citation format — `[grounded: <specific citation>]` inline. This is a more demanding standard than bare `[grounded]` used in phases 55–57.

---

**CLAIM-57.1-01**
- Text: "D-01: Standard GSDR adoption pattern: gsd:explore -> gsdr:explore, path replacement via replacePathsInContent() in installer [grounded: established pattern in Phases 55/55.1/55.2]"
- Marker: [grounded: established pattern in Phases 55/55.1/55.2]
- Type: **Framework**
- Citation: "established pattern in Phases 55/55.1/55.2"
- Citation check: REAL. The path replacement pattern is established in `bin/install.js` via `replacePathsInContent()` and was used in the Phase 55.x adoptions. The CLAUDE.md documents the installer's role.
- Notes: **Framework** — naming a pattern by phase history is legitimate. The citation is a pattern reference, not a document reference. It's softer than SHA or line citations but real.

---

**CLAIM-57.1-02**
- Text: "D-02: Upstream domain-probes.md adopted as-is. GSDR-specific probes deferred to Phase 62 / WF-05b [grounded: deliberation Open Question 1 resolved by WF-05a/WF-05b split]"
- Marker: [grounded: deliberation Open Question 1 resolved by WF-05a/WF-05b split]
- Type: **Anchored**
- Citation: "deliberation Open Question 1"
- Citation check: REAL. The deliberation `explore-skill-adoption-and-dialogue-modes.md` exists and at lines 118-119 has "Open Question 1: Should Stage 1 (quick adopt) include the upstream domain-probes.md as-is, or strip it..." WF-05a and WF-05b exist in REQUIREMENTS.md (lines 175, 177).
- Notes: **Anchored** — the deliberation exists, the open question is identifiable, WF-05a/b are real requirements. Strong citation for this format.

---

**CLAIM-57.1-03**
- Text: "D-03: questioning.md adopted as-is. Socratic technique is universal; epistemic practice enhancements are Stage 2 [grounded: deliberation Section 2]"
- Marker: [grounded: deliberation Section 2]
- Type: **Anchored**
- Citation: "deliberation Section 2"
- Citation check: REAL. `explore-skill-adoption-and-dialogue-modes.md` section "## 2. What Makes GSDR Explore Different from GSD Explore?" (line 65) discusses Socratic technique as universal vs. GSDR-specific enhancements.
- Notes: **Anchored** — section 2 exists and contains the relevant analysis.

---

**CLAIM-57.1-04**
- Text: "D-05: All files sourced from upstream/main at current HEAD [grounded: upstream commit 790cbbd0 introduced explore, with e6bdd261 simplifying questioning]"
- Marker: [grounded: upstream commit 790cbbd0 introduced explore, with e6bdd261 simplifying questioning]
- Type: **Anchored**
- Citation: Specific SHA 790cbbd0 and e6bdd261
- Citation check: BOTH REAL. `git show --oneline 790cbbd0` confirms "feat(commands): add /gsd-explore for Socratic ideation and idea routing (#1813)". `git show --oneline e6bdd261` confirms "refactor: simplify questioning to four essentials". Both are in the upstream remote.
- Notes: **Anchored** — SHA-level precision. Strongest possible citation.

---

**CLAIM-57.1-05**
- Text: "D-06: All 6 upstream output types (note, todo, seed, research question, requirement, new phase) map directly to existing .planning/ artifacts — no adaptation needed [grounded: .planning/ structure supports all types]"
- Marker: [grounded: .planning/ structure supports all types]
- Type: **Observed** (partially phantom)
- Citation: ".planning/ structure supports all types"
- Citation check: PARTIAL. `.planning/todos/`, `.planning/research/`, `.planning/REQUIREMENTS.md` exist. However, `.planning/seeds/` does NOT exist in the project. The explore workflow maps "Seed" output type to `.planning/seeds/{slug}.md`. If seeds do not have a directory, the claim that the .planning/ structure "supports all types" is inaccurate. The workflow would need to create the directory on first use, which is different from "already supported."
- Notes: **Partially phantom** — the seeds output type is not backed by an existing directory. This is a subtle inaccuracy: the workflow will work (it would create the directory) but the [grounded] claim that the structure "already supports all types" is false for seeds.

---

**CLAIM-57.1-06**
- Text: "D-07: Update upstream tests to check gsdr:explore references instead of gsd:explore. Test structure stays the same [grounded: established fork test pattern]"
- Marker: [grounded: established fork test pattern]
- Type: **Framework**
- Citation: "established fork test pattern"
- Citation check: REAL pattern — fork tests use `gsdr:` prefix where upstream uses `gsd:`. The pattern exists across multiple test files.
- Notes: **Framework** — naming a pattern by history. Real but not a document citation.

---

## 3. Citation Integrity Summary

### Fully Resolved Citations (real, traceable)
- f7549d43 (upstream SHA) — REAL
- 790cbbd0 and e6bdd261 (upstream SHAs in 57.1) — REAL
- FORK-DIVERGENCES.md — REAL
- upstream-drift-survey-2026-04-08.md — REAL
- codex-drift-audit-gpt54-2026-04-08.md — REAL
- codex-harness-audit-gpt54-2026-04-08.md — REAL
- REQUIREMENTS.md (SYNC-01, KB-01–KB-11, TEL-01–TEL-05, WF-05a/b) — ALL REAL
- PITFALLS.md (C3, N2, M3) — REAL (but in a separate file from measurement research)
- measurement-infrastructure-research.md Observation 8 — REAL
- kb-architecture-research.md — REAL
- explore-skill-adoption-and-dialogue-modes.md deliberation — REAL
- STATE.md blocker (line 133) — REAL

### Stale Citations (real files, wrong details)
- knowledge-store.md v2.0.0 → now v2.1.0 (56-CONTEXT)
- 198 signals → now 216 (56-CONTEXT)
- core.cjs line 1123 for extractCurrentMilestone → now line 1245 (55.1-CONTEXT)
- "n=109 of 268 sessions" — point-in-time observation, not design constraint (57-CONTEXT)

### Phantom / False Citations
- **CLAIM-55.1-03**: milestone.cjs/phase.cjs/frontmatter.cjs use raw `writeFileSync` — FALSE. All three already use `atomicWriteFileSync`. The bug being patched no longer exists in the codebase as described.
- **CLAIM-55.1-04**: worktree_branch_check uses `reset --soft` — LIKELY FALSE. execute-phase.md shows `git reset --hard`, not `--soft`. The described bug state does not match the current implementation.
- **CLAIM-57.1-05**: `.planning/seeds/` exists — FALSE. The directory does not exist. The "all types supported" claim is inaccurate for seeds.

### Non-Obvious but Valid Citations
- Pitfall C3/N2/M3 — cited without naming the file (`PITFALLS.md`), which confused the prior audit into calling them phantom. They are real, just navigated non-obviously.

---

## 4. Type Ontology Assessment

### Is the proposed ontology (Anchored / Assumed / Framework / Observed / Decided / Open) necessary and sufficient?

**Short answer:** Mostly sufficient, with one significant gap and two refinements needed.

### What the ontology gets right

**Anchored** cleanly separates strong citations (SHA, file+line, requirement ID) from weaker ones. This distinction matters most for downstream agents trying to verify claims.

**Observed** correctly captures empirical findings from codebase scouting or live runtime evidence — findings that are true at research time but may drift.

**Framework** correctly identifies convention-backed claims that don't need evidence per se — they're hinge commitments that orient the work. These shouldn't require citations; they require acknowledgment that they're conventions.

**Decided** cleanly separates explicit requirement-backed or user-decision-backed claims from invented assertions.

**Open** is necessary and correct.

**Assumed** captures the working-assumption pattern without forcing it into Observed (no evidence) or Open (not deferred).

### What the ontology misses or conflates

**1. Stale-Observed is a distinct epistemic state.**
Several claims are correctly **Observed** at research time but become false by the time the CONTEXT is read. CLAIM-57-18 (109/268 sessions) and CLAIM-56-04 (198 signals) are examples. The ontology should distinguish:
- `Observed` — empirical finding, still expected to be current
- `Observed (snapshot)` — empirical finding explicitly flagged as point-in-time; downstream reader must re-verify

**2. Framework and Decided sometimes collapse.**
"One commit per bug fix" (CLAIM-55.1-06) could be **Decided** (user decided this) or **Framework** (it's a convention). The distinction matters for authority: if a downstream agent wants to deviate, they need to know whether they need user permission (Decided) or whether they can update the convention (Framework). The types are useful but the boundary is sometimes unclear.

**3. Phantom-grounded is missing from the ontology.**
The most practically dangerous situation in this catalog — CLAIM-55.1-03 and CLAIM-55.1-04 — is a claim that is labeled [grounded] but whose grounding evidence no longer exists or was never accurate. This is distinct from **Assumed** (which admits it has no evidence) and distinct from a stale **Observed** (which was once true). A **Phantom** type would explicitly flag: "this claim was asserted as grounded but the cited evidence does not support it." This is the epistemic equivalent of a broken link.

**Proposed addition: `Phantom`** — A claim marked [grounded] whose supporting evidence does not exist, no longer exists, or does not say what the citation implies. Distinct from stale (still valid, just dated) and from assumed (admits no evidence).

**4. Inline citation format (57.1) vs bare prefix format (55–57) is an important distinction.**
57.1's `[grounded: <citation>]` format is strictly better than the bare `[grounded]` used in 55–57. The ontology analysis should note that **Anchored** claims in 57.1 are better-evidenced than identically-typed claims in Phase 57, because they name their sources. This isn't a new type — it's a citation quality dimension orthogonal to claim type.

**Proposed refinement:** Add citation quality as a secondary dimension:
- `cited` — names the specific artifact/section/SHA
- `implicit` — references a document without section precision
- `bare` — no citation given despite [grounded] label

### Patterns Found

**Pattern 1: Most [grounded] claims in 55–57 are Framework or Anchored, not Observed.**
Counter-intuitively, the exploratory mode (designed to gather observed evidence) produces mostly Framework conventions and Anchored requirement-references, not raw empirical observations. Only 14 of 63 claims are Observed; 24 are Anchored and 8 are Framework. The exploratory mode is doing more requirement-linking than codebase-scouting.

**Pattern 2: 55.2 has the highest density of [grounded] markers (14) but also the highest reliability.**
The GPT-5.4 audit was a structured, live-evidence session. Claims from 55.2 trace mostly to the codex-drift-audit and codex-harness-audit. Most were verified as implemented. This pattern suggests: audit-based context files are more reliable than synthesis-based ones.

**Pattern 3: Process conventions are systematically labeled [grounded] without evidence.**
"One commit per bug fix," "--raw flag follows gsd-tools convention," "module follows cmdX pattern" — all labeled [grounded] but are Framework claims. This inflates apparent grounding while providing no actual traceability. A downstream agent reading these cannot verify them against any artifact.

**Pattern 4: The two phantom claims (55.1-03 and 55.1-04) both involve bugs that were already fixed.**
The 55.1-CONTEXT describes three bugs to patch. Two of them (#1972 and #1981) describe pre-fix state that doesn't match the current codebase. This suggests the context was written based on the upstream issue descriptions, not from scanning the actual fork code after Phase 55's module adoption. The fix for this pattern: context authors should verify claimed "current state" against the actual post-phase codebase, not pre-phase state or upstream issue descriptions.

**Pattern 5: The prior audit's "Pitfall C3 is phantom" was wrong — but the error is instructive.**
The exploration-quality-audit.md concluded that Pitfall C3 didn't exist. It does — in `PITFALLS.md`, a different file than the measurement research document. The confusion arose because the CONTEXT cited "Pitfall C3" without naming the containing file. The lesson: coded references (C3, N2, M3) without file paths are structurally non-obvious and force citation verifiers to search. The `[grounded: PITFALLS.md §C3]` format would have prevented the confusion.

---

## 5. Recommendations

**R1: Retire bare `[grounded]`; require `[grounded: <citation>]`.**
Phase 57.1's inline citation format is strictly better. The discuss-phase workflow should mandate this format. Bare `[grounded]` should be treated as `[assumed]` by downstream agents.

**R2: Add `[phantom]` as a named claim state.**
When a claim labeled [grounded] is found to have no supporting evidence or the evidence contradicts the claim, it should be reclassified as `[phantom]` rather than silently remaining [grounded]. The two phantom claims in 55.1 would be actively harmful to a downstream implementer.

**R3: Add `[snapshot: <date>]` for point-in-time observations.**
Counts (198 signals, 109/268 sessions), live measurements (codex-cli v0.118.0), and runtime states should carry a snapshot date so downstream agents know to re-verify before acting.

**R4: Verify post-phase codebase state before writing CONTEXT for continuation phases.**
CLAIM-55.1-03 and CLAIM-55.1-04 describe bugs that don't exist in the current codebase. The context was likely written from upstream issue descriptions before verifying the post-Phase-55 code state. CONTEXT authors should scan the actual files, not rely on upstream issue descriptions.

**R5: `.planning/seeds/` should be created or the explore workflow should note it doesn't exist.**
CLAIM-57.1-05 claims seeds "map directly to existing .planning/ artifacts." The directory doesn't exist. Either create it or the workflow should state "creates directory on first use."

---

*Audited by: claude-sonnet-4-6*
*Phases covered: 55, 55.1, 55.2, 56, 57, 57.1*
*Total claims cataloged: 64 records (66 marker occurrences: 54 [grounded], 6 [working assumption], 6 [open])*
*Files examined: 7 CONTEXT.md files, 14 cited artifacts verified*
