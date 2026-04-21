# Phase 58: Structural Enforcement Gates - Research

**Researched:** 2026-04-20
**Domain:** Structural workflow enforcement, CI/hook substrate, scope-translation ledger, delegation hygiene, closeout reconciliation, measurement integration — all within a Node.js CLI / GitHub Actions / Claude Code + Codex dual-runtime harness
**Confidence:** HIGH for substrate findings (direct file reads verified); MEDIUM for extractor registry gate-event consumption (API-compatible but untested with gate-event payloads); LOW for Codex hook timing (still under development flag)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- [governing:reasoned] Structural enforcement means a mechanism that fires **without the agent needing to remember to invoke it** — a hook, an installer-wired workflow step, an exit-coded CLI subcommand, or a CI rule. Prose requests do not count.
- [decided:cited] Every GATE must satisfy the four-property contract: named substrate, measurable fire-event, applies across every workflow that could bypass it, per-gate Codex behavior declaration. (Source: audit §9.3 + ROADMAP.md:316-328)
- [decided:cited] Fire-event surface: hook log entry / workflow-step stdout marker / `session-meta` field. (Source: audit §6.1)
- [decided:cited] GATE-02 enumerates every `gh pr merge` surface — not prose. (Source: audit Finding 2.2)
- [decided:cited] GATE-03 ships with an explicit detection rule (one of three candidates or a composition). (Source: audit Finding 2.3)
- [decided:reasoned] GATE-03 classifies ROADMAP.md and REQUIREMENTS.md as runtime-adjacent planning-authority files. (Source: DC-9)
- [decided:cited] GATE-14 folds into GATE-01 CI enforcement. (Source: audit Finding 3.5 + §9.2)
- [decided:cited] GATE-04a: consumed-on-read archival (mv not rm) to dated archive path. (Source: audit Finding 2.4)
- [decided:cited] GATE-04b: hard-stop staleness if `.continue-here` predates last STATE.md `last_updated` or mainline commit. (Source: REQUIREMENTS.md:226)
- [decided:cited] GATE-04c: upstream blocking/advisory severity framework with mandatory understanding checks. (Source: REQUIREMENTS.md:228)
- [decided:cited] GATE-05 enumerates named delegation sites, not "all delegation workflows" as prose. (Source: REQUIREMENTS.md:230)
- [decided:cited] GATE-13 owns compaction-resilience: restate dispatch contract inline at spawn site. (Source: audit Finding 3.3 + REQUIREMENTS.md:260)
- [decided:cited] Phase 58 does NOT re-do Phase 57.9 work; it consumes the installed hook surface. (Source: ROADMAP.md:317 + audit §9.1)
- [decided:cited] GATE-09a ships as named artifact with schema, not prose convention. (Source: audit §6.2)
- [decided:cited] GATE-09b: any `[open]` scope-boundary question in CONTEXT must resolve or defer before plan-phase. (Source: REQUIREMENTS.md:248)
- [decided:cited] GATE-09c: RESEARCH/PLAN must cite originating CONTEXT claim when narrowing scope. (Source: REQUIREMENTS.md:250)
- [decided:cited] GATE-09d: verifier reads ledger and fails silent disappearance of load-bearing claims. (Source: REQUIREMENTS.md:252)
- [decided:cited] GATE-10: phase-closeout reconciliation structural via gsd-tools subcommand. (Source: REQUIREMENTS.md:254)
- [decided:cited] GATE-11: release-boundary assertion — phase branch merge triggers check. (Source: REQUIREMENTS.md:256)
- [decided:cited] GATE-12: failed/interrupted agent output archived (mv not rm) before redispatch. (Source: REQUIREMENTS.md:258)
- [decided:cited] GATE-15: source↔installed mirror parity as CI check, installer manifest as ground truth. (Source: REQUIREMENTS.md:264)
- [decided:cited] XRT-01: plan-phase assertion — hook-dependent commitments have Codex degradation claim before implementation. (Source: audit Finding 2.10 + REQUIREMENTS.md:419)
- [decided:cited] Per-gate Codex behavior table authored as part of plan scope. (Source: audit §5.3, §9.3)
- [governing:reasoned] If fork narrows upstream richer discuss-phase surface, narrowing requires named rationale under GATE-09c. (Source: REQUIREMENTS.md:244 + GATE-09c)
- [governing:reasoned] Fire-event events feed Phase 57.5 extractors — no new measurement architecture in Phase 58. (Source: G-6)
- [governing:reasoned] Evidence preservation over conservation of artifacts — archive on rm paths. (Source: G-7)

### Claude's Discretion

- Exact CLI shape of the reconciliation subcommand (GATE-10)
- Archive directory naming conventions and retention (GATE-04a, GATE-12)
- GitHub Actions YAML structure for CI-enforced gates (GATE-01, GATE-02, GATE-15)
- Exact copy / prompt wording for blocking-severity mandatory understanding (GATE-04c)
- Ledger front-matter key ordering and optional-fields policy (GATE-09a)
- Pre-push hook vs branch-protection-only implementation of GATE-14 (within the named-substrate constraint)

### Deferred Ideas (OUT OF SCOPE)

- Full Codex hook installer parity beyond SessionStop — Phase 60.1 or later
- Log-sensor live incident-detection wiring for GATE-07 — Phase 60 + 60.1
- Full KB query surface for historical GATE-09 ledger analysis — Phase 59
- Cross-model review of GATE designs themselves — Phase 61 / SPIKE-01
- Generalized dispatch-scope isolation across all agent types — AUT-02 (v1.21)
- Signal-to-workflow auto-elevation on recurrence — Phase 60.1 / REC-01
- Audit §7.4 Codex hooks timing feature-flag stabilization — cross-phase
- Framework-invisibility reframe ("structural vs advisory") — Phase 60.1 (Q4)
</user_constraints>

---

## Summary

Phase 58 replaces advisory workflow controls with structural enforcement across 25 requirements (GATE-01..15 with letter-split sub-requirements + XRT-01). The research reveals a clear substrate landscape: CI is the right enforcement layer for GATE-01/02/03/14/15 because branch protection already requires the "Test" check (`enforce_admins: false` is a gap — see R1); workflow-level mechanics handle session-state gates (GATE-04, GATE-12). The `SessionStop` hook is absent from both runtime installers and is Phase 57.9's job to deliver; Phase 58 is a consumer, not an implementer.

The upstream `discuss-phase-assumptions.md` is now 536 lines (not 671 as REQUIREMENTS.md:236 states — stale figure), with the fork at 279 lines. The delta covers three categories: (a) `gsd-assumptions-analyzer` agent invocation pattern (lines 231-279 upstream, absent in fork), (b) methodology-loading step (lines 199-213 upstream, absent in fork), and (c) mode-aware confidence gating under `--auto` (lines 363-372 upstream, partially absent in fork). GATE-08a–08e scope is plannable against the 536-line baseline.

The extractor registry (`get-shit-done/bin/lib/measurement/registry.cjs`) uses a declarative API (`defineExtractor` / `buildFeatureRecord`) that gate fire-events can feed without new measurement architecture — as long as they target a `raw_source` key in the GSDR source family. A single `gate_fire_events` extractor under the GSDR family pointing to a `.planning/measurement/gate-events/` drop-file directory is the recommended integration shape. The meta-gate (Q5) is cheap at this abstraction level: a verifier step reading the phase's gate-event log. It should be adopted as GATE-09e.

**Primary recommendation:** Serialize in two waves. Wave A covers CI-hosted gates (GATE-01, 02, 03, 14, 15, XRT-01, GATE-09a/b/c) — these can land in parallel as independent CI/workflow file edits with no shared-file conflicts. Wave B covers session-state gates (GATE-04, GATE-05/13, GATE-06/07, GATE-08, GATE-09d, GATE-10/11/12) where GATE-06/07 must explicitly defer to Phase 57.9 completion via AT-1. GATE-10 needs a new `gsd-tools phase reconcile` subcommand — composition from existing primitives is insufficient.

---

## R1 — Substrate Inventory

### CI Substrate (GATE-01, 02, 06, 07, 14, 15)

[evidenced:cited] Branch protection at `loganrooks/get-shit-done-reflect/branches/main`:
- `required_status_checks.contexts: ["Test"]` — one required check exists
- `required_status_checks.strict: false` — branch does NOT need to be up-to-date with main before merge; this is a gap for GATE-01 (can merge with stale branch if Test passes)
- `enforce_admins: false` — admins CAN bypass branch protection (gap for GATE-14; direct pushes by admin are not blocked)
- `allow_force_pushes: false` — force pushes blocked (correct)
- `allow_deletions: false` — main deletions blocked (correct)

**CI workflow** (`.github/workflows/ci.yml`): Runs on push to main AND pull_request to main. Steps: checkout, Node 22.x, `npm ci`, build hooks, `npm test`, `npm run test:infra`, `npm run test:upstream`, `npm run test:upstream:fork`, installer verify. Coverage only on PR. **No grep-level conformance check for `gh pr merge --merge` exists.** No parity check of source vs installed directories post-install.

**GATE-01 substrate gap:** CI exists and is required, but `offer_next` workflow has no exit-coded blocking — it is advisory markdown prose. The CI requirement already enforces Test on PRs; what is missing is the `offer_next` step blocking until PR is created AND CI passes (the workflow must emit a non-zero exit or halt if the CI check has not been awaited). For Codex: no structural hook surface for SessionStop. `enforce_admins: false` means GATE-01 applies to workflow-mediated merges; admin can bypass.

**GATE-14 substrate gap:** `enforce_admins: false` is the critical gap. Branch protection does not prevent admin direct-to-main pushes. CI runs on push to main (catching post-the-fact) but does not block the push itself. A pre-push hook on Claude Code would add a local layer, but `enforce_admins: true` is the proper structural fix for GATE-14.

**GATE-15 substrate gap:** CI installer-verify step (`ci.yml:42-80`) only checks that directories are created — it does NOT compare file contents between `agents/` vs `.claude/agents/`, `get-shit-done/workflows/` vs `.claude/get-shit-done-reflect/workflows/`, etc. A byte-level diff step is missing.

| Gate | Named Substrate Site | Current Posture | What Needs to Change | Codex Behavior |
|------|---------------------|-----------------|---------------------|----------------|
| GATE-01 | `execute-phase.md:777-824` (`offer_next`) | Advisory (no exit-code block) | Add CI-wait loop or exit-coded gate; branch protection `strict: true` recommended | applies-via-workflow-step (manual CI check) |
| GATE-02 | CI `.github/workflows/ci.yml` | No grep check exists | Add `grep -rn "gh pr merge" agents/ get-shit-done/ commands/ --include="*.md" \| grep -v "\-\-merge"` step that fails if `--squash` found or `--merge` absent | applies (file-pattern CI check) |
| GATE-14 | Branch protection + pre-push hook | `enforce_admins: false` gap | Enable `enforce_admins: true` on branch protection, optional pre-push hook as secondary | does-not-apply (no hook surface on Codex for pre-push) |
| GATE-15 | CI installer-verify step | Directory existence only | Add diff step after install comparing source tree vs installed mirror | applies (same CI step, both runtimes) |

### GATE-02: `gh pr merge` Enumeration

[evidenced:cited] Comprehensive grep across all source files:

| Site | Location | Has `--merge` | Notes |
|------|----------|--------------|-------|
| execute-phase.md | `get-shit-done/workflows/execute-phase.md:793` | YES | Conforming; `gh pr merge $CURRENT_BRANCH --merge` |
| complete-milestone.md | `get-shit-done/workflows/complete-milestone.md:721` (offer_next step) | NO | `offer_next` presents completion banner with no `gh pr merge` invocation at all — milestone-boundary merge is not structurally handled |
| gsd-ship skill | Not found in current tree | N/A | Skill not present in source — may be upstream-only or superseded; not a gap in this codebase |
| Release workflow | `.github/workflows/publish.yml` | N/A | Triggered by `release: published` or `workflow_dispatch` — no `gh pr merge` at all; publishes from tag, not from PR merge |

**Result:** The one conforming site is `execute-phase.md:793`. `complete-milestone.md` has no `gh pr merge` invocation in its `offer_next` step — the milestone workflow displays a completion banner but does not structurally invoke a merge. GATE-02's CI grep check covers the source paths; both the existing conforming site and any new invocations (if complete-milestone gains one) will be validated.

### GATE-03: Detection Rule Evaluation (Q1)

[evidenced:cited] Analysis of direct-to-main non-merge commits in last 60 days (from git log):

Direct-to-main commits classified by touched paths:

| Commit | Subject | Runtime files? | Caught by glob (non-.md)? | Caught by diff rule (runtime paths)? | Caught by manifest? |
|--------|---------|---------------|--------------------------|--------------------------------------|---------------------|
| b89e0bab | fix: update CI to Node 22.x | `.github/workflows/ci.yml` | YES (not .md) | YES (.github/) | YES (CI files in source) |
| d1434da5 | chore: update discuss-phase command description | `commands/gsd/discuss-phase.md` | NO (is .md) | YES (commands/) | YES (commands in manifest) |
| 6c8ff768 | fix(quick-31): AGENTS.md + capability matrix | `bin/install.js` | YES | YES (bin/install.js) | YES |
| multiple quick-NN | installer changes | `bin/install.js` | YES | YES | YES |
| 7affaa40 | release: v1.19.6 | `CHANGELOG.md, package.json, templates/config.json` | MIXED (package.json not .md) | MIXED (templates/ is partial) | Mixed — templates in manifest |
| docs(57) commits | planning/57-CONTEXT.md etc. | `.planning/**` | NO (.md) | NO (not runtime path) | NO |

**Q1 Recommendation:** [assumed:reasoned] Use **git-diff-based rule (b)** as primary, with installer-manifest cross-check as secondary validation.

Rationale for preferring git-diff over glob:
- Glob rule (a) misses `commands/gsd/discuss-phase.md` — which is a runtime-facing workflow file, not a pure doc. The `.md` extension does not discriminate docs from runtime workflow files.
- Manifest-based rule (c) requires `dist/MANIFEST` to exist — verified missing (`dist/MANIFEST` not found in repo). Building the manifest as part of the check adds installer coupling.
- Git-diff rule (b) catches the motivating pattern (`260419-6uf` touched installed Codex skill) and the `commands/` path.

**Recommended runtime-adjacent path set for GATE-03:**
```
get-shit-done/bin/
get-shit-done/workflows/
get-shit-done/references/  (authoritative workflow refs)
get-shit-done/templates/
agents/
commands/
bin/install.js
.github/workflows/
.claude/hooks/
.planning/ROADMAP.md
.planning/REQUIREMENTS.md
```

**Pure-prose exception** (direct to main allowed): `.planning/phases/*/`, `.planning/knowledge/`, `.planning/audits/`, `.planning/deliberations/`, `.planning/spikes/`, `CHANGELOG.md`, `*.md` under `docs/`.

**False-positive rate (git-diff rule):** Release commits touch `CHANGELOG.md` + `package.json` — `package.json` is NOT on the runtime list, `CHANGELOG.md` is under the exception. Only the `templates/config.json` in release commits would trigger — but templates are legitimately runtime-facing. Accept as true positive.

**False-negative rate (git-diff rule):** Docs commits to `.planning/**` are correctly passed through. ROADMAP.md and REQUIREMENTS.md direct edits (`260419-wjj` style) are correctly flagged as runtime-adjacent. Zero observed false negatives.

### GATE-14 and GATE-01 Combined

[evidenced:cited] Branch protection state (`enforce_admins: false`, `required_status_checks.strict: false`):
- Changing `enforce_admins: true` requires GitHub Admin API call or UI — this is Claude's Discretion on whether to add a CI step that verifies this, or document it as a manual configuration requirement.
- `strict: false` means PRs can be merged when Test passes even if the branch is behind main — not a blocker for GATE-01 (the PR requirement is about CI passing, not branch freshness). Accept.

### GATE-15: Source↔Installed Parity

[evidenced:cited] `bin/install.js:2856-2880`: Installer copies `hooks/dist/` to `hooks/` with GSDR renaming. For agents, workflows, references, commands: separate copy paths not shown in the hook section but the install step creates `$INSTALL_DIR/.claude/commands/gsdr/` and `$INSTALL_DIR/.claude/get-shit-done-reflect/` directories (verified by ci.yml:51-64).

The existing CI installer-verify step (ci.yml:42-80) checks for directory existence, VERSION file match, but **no byte-level comparison**. GATE-15 needs a new CI step:

```bash
# After install into INSTALL_DIR:
diff -r agents/ "$INSTALL_DIR/.claude/agents/"
diff -r commands/ "$INSTALL_DIR/.claude/commands/"
diff -r get-shit-done/ "$INSTALL_DIR/.claude/get-shit-done-reflect/"
```

Note: The installer performs path-prefix substitution (`get-shit-done/` → `get-shit-done-reflect/`, `gsd-` → `gsdr-`), so a naive diff will always differ. The CI check must normalize substitutions or use the installer's `replacePathsInContent()` output as the reference. Recommend: a post-install manifest file listing SHA256 of installed files, generated by `bin/install.js` itself, compared against source SHA256.

---

## R2 — `.continue-here` Lifecycle (GATE-04a/b/c)

[evidenced:cited] `get-shit-done/workflows/resume-project.md:127-135`: The consume step is:
```bash
rm -f "$CONTINUE_HERE_PATH"
```
No archive. No staleness predicate. The comment explicitly states "This file gets DELETED after resume -- it's not permanent storage."

[evidenced:cited] Grep for `.continue-here` references across all workflow files:

**Sites that read `.continue-here`:**
- `resume-project.md` (the primary load site, lines 70-136)

**Sites that write `.continue-here`:**
- `get-shit-done/workflows/pause-work.md` (writes the handoff file at session pause)
- Potentially: interrupted agent recovery paths (agent-history.json, resume-project.md lines 122-126)

No other sites. The lifecycle is: `pause-work.md` writes → `resume-project.md` reads+deletes.

**Anti-pattern severity framework:** [assumed:reasoned] Upstream's `discuss-phase-assumptions.md` (536-line version) does not contain an explicit "blocking/advisory severity framework" for anti-patterns — that terminology appears in the REQUIREMENTS.md:228 motivation citation for GATE-04c referencing "upstream's hard stop safety gates." This likely refers to a separate upstream pattern in `resume-project.md` or `discuss-phase.md` that needs to be fetched and checked. The fork's current `resume-project.md` has no severity levels. GATE-04c implementation requires: (1) identifying the upstream source for blocking/advisory severity, and (2) adopting it with mandatory-understanding-check copy.

**Proposed archive structure (Claude's Discretion):**
```
.planning/handoff/archive/YYYYMMDD-HHMMSS.continue-here
```

**Staleness predicate for GATE-04b:**
```bash
CONTINUE_AGE=$(stat -c %Y "$CONTINUE_HERE_PATH")
STATE_AGE=$(git log -1 --format="%ct" -- .planning/STATE.md)
if [ "$CONTINUE_AGE" -lt "$STATE_AGE" ]; then
  echo "HARD STOP: .continue-here predates STATE.md last commit. Triage required."
  exit 1
fi
```

---

## R3 — Delegation Site Enumeration (GATE-05, GATE-13)

[evidenced:cited] Full delegation spawn inventory from grep across `agents/`, `commands/`, `get-shit-done/workflows/`, `get-shit-done/templates/`:

| Site | File | Type | Model Echoed? | Contract Stated? |
|------|------|------|--------------|-----------------|
| Sensor dispatch loop | `collect-signals.md:264-280` | Named (sensor agents) | NO — MODEL variable used but not echoed to user before spawn | NO inline contract |
| Phase researcher | `plan-phase.md:126-132` | Named (gsd-phase-researcher / general-purpose) | NO — `researcher_model` used but not announced | NO inline contract |
| Planner | `plan-phase.md:345-351` | Named (gsd-planner / general-purpose) | NO | NO |
| Plan checker | `plan-phase.md:400-408` | Named (gsd-plan-checker) | NO | NO |
| Context-checker (in discuss-phase) | `plan-phase.md:448-456` | Named (general-purpose) | NO | NO |
| gsd-executor per plan | `execute-phase.md:189-192` | Named (gsd-executor) | NO | NO |
| gsd-verifier | `execute-phase.md:330-336` | Named (gsd-verifier) | NO | NO |
| gsd-reflector | `reflect.md:269-369` | Named (gsd-reflector) | NO | NO |
| gsd-assumptions-analyzer | `discuss-phase-assumptions.md` (fork: absent; upstream: lines 231-279) | Ad-hoc (not yet in fork) | N/A | N/A |
| diagnose-issues explore | `diagnose-issues.md:109-118` | Ad-hoc (general-purpose) | NO | NO |
| audit | `audit.md:~Step 7` | Named (gsdr-auditor) | NO | NO |
| new-project research | `new-project.md:435-617` | Ad-hoc (general-purpose × 5) | NO | NO |

**GATE-05 key finding:** [evidenced:cited] `collect-signals.md:249-251` echoes the enabled/disabled sensor list but does NOT echo the MODEL or REASONING_EFFORT to user before the spawn loop begins at line 275. The GATE-05 fix is: immediately before `for ENTRY in ENABLED_SENSOR_RUNS`, emit a banner:
```
Dispatching [N] sensors:
  - [NAME] → model=[MODEL], effort=[REASONING_EFFORT]
  ...
```

**GATE-13 key finding:** [evidenced:cited] Every spawn site (plan-phase.md:126-132, execute-phase.md:189-192) uses inline model/subagent_type variables but does NOT restate the full dispatch contract (required inputs, output path, reasoning effort) inline at the call site. Under Codex auto-compact, context preceding the spawn can be lost, changing which model or what inputs are passed. The fix is adding a structured comment block at each spawn site.

**GATE-05 and GATE-13 are distinct:** GATE-05 is visibility to user (operator can catch misconfiguration); GATE-13 is resilience against context compression (spawn contract cannot drift). Both apply to the same spawn sites but verify different failure modes.

---

## R4 — Hook Substrate Landscape (GATE-06, GATE-07 consumer-side)

[evidenced:cited] `.claude/settings.json` (full file, 54 lines):
- `SessionStart`: 4 hooks (gsdr-check-update, gsdr-version-check, gsdr-ci-status, gsdr-health-check)
- `PostToolUse`: 1 hook (gsdr-context-monitor, matches `Bash|Edit|Write|MultiEdit|Agent|Task`)
- `statusLine`: gsdr-statusline.js
- **`SessionStop`: ABSENT**

[evidenced:cited] `bin/install.js:2094`: Installer enumerates `['SessionStart', 'PostToolUse', 'AfterTool', 'PreToolUse', 'BeforeTool']` for cleanup — does NOT include `SessionStop`. This means no code path currently installs or removes `SessionStop` hooks.

[evidenced:cited] `bin/install.js:2846-2856`: Codex hook installation is unconditionally skipped (`if (!isCodex)` guard — hooks are NOT installed to Codex runtime at all).

[evidenced:cited] `.planning/research/cross-runtime-parity-research.md:70-80` (correct path, not `get-shit-done/references/` as CONTEXT.md incorrectly listed): Codex hooks available under `codex_hooks` feature flag since v0.115.0. `SessionStop` available on Codex since v0.115.0. Feature is "under development."

**Minimum contract Phase 57.9 must deliver for Phase 58 GATE-06/07:**

| Deliverable | Required by | Description |
|-------------|-------------|-------------|
| Installer writes `SessionStop` in `settings.json` | GATE-06 | Hook path: `test -f .claude/hooks/gsdr-closeout.js && node .claude/hooks/gsdr-closeout.js` |
| Installer writes `.codex/hooks.json` when `codex_hooks=true` | GATE-06 Codex | With SessionStop entry; explicit waiver marker written when flag absent |
| Canonical `postlude_fired` marker in hook output | GATE-06 | Structural evidence the postlude ran; consumable by GSDR extractor |
| Session-level incident markers | GATE-07 | At minimum: `error_count`, `direction_changes`, `destructive_events` or explicit `not_available` per-counter |

If Phase 57.9 delivers `not_available` markers on Codex, GATE-06/07 declare Codex behavior as `does-not-apply-with-reason: codex_hooks not enabled at install time` in the per-gate Codex table.

---

## R5 — Discuss-Phase Richer Adoption (Q2, GATE-08a/b/c/d/e)

[evidenced:cited] Upstream `discuss-phase-assumptions.md`: **536 lines** (fetched 2026-04-20 from `gsd-build/get-shit-done` main). REQUIREMENTS.md:236 states "671 lines" — this figure is stale by approximately 135 lines. The number has decreased, suggesting upstream pruned the file since the REQUIREMENTS.md figure was captured.

[evidenced:cited] Fork `discuss-phase-assumptions.md`: 279 lines.

**Delta: 536 upstream vs 279 fork = 257-line gap.**

Categories of the gap (per upstream structure analysis):

| Category | Upstream (lines) | Fork Status | Recommendation |
|----------|-----------------|-------------|----------------|
| (a) Methodology loading | Lines 199-213: explicit step loading project-level methodology file before assumption analysis | ABSENT in fork | Adopt-as-is — methodology loading is a content-quality improvement with no fork-specific conflict |
| (b) `gsd-assumptions-analyzer` agent invocation | Lines 231-279: calibrated spawning (conservative/opinionated/pragmatic-fast tiers), model-echoing before spawn, result integration | ABSENT in fork (agent also absent) | Adopt-as-is — this is GATE-08b and provides the structured agent GATE-05/GATE-13 patterns as well |
| (c) Mode-aware confidence gating | Lines 363-372: under `--auto`, skip correction step if all assumptions are Confident/Likely | PARTIALLY absent — `--auto` detection exists but the confidence gate logic is missing | Adopt-as-is — the confidence gate prevents unnecessary user interruption |
| (d) Available agent types declaration | Lines 1-14: `<available_agent_types>` block naming `gsd-assumptions-analyzer` | ABSENT | Adopt-as-is — this is the dispatch contract GATE-13 requires |
| (e) Downstream awareness | Lines 15-27: `<downstream_awareness>` block explaining CONTEXT.md feeds | Present in fork via `<purpose>` tag | Already adopted — no gap |

[assumed:reasoned] No category requires rejection. All delta content is methodology improvement that aligns with the fork's existing pattern. Fork narrowings if any should be GATE-09c-cited.

**Does upstream `gsd-assumptions-analyzer` agent exist?** [assumed:reasoned] The `<available_agent_types>` block in upstream names it. The agent was not confirmed via GitHub API in this research pass — checking the agent directory listing is GATE-08a's explicit verification step. Note for planner: GATE-08b requires creating the agent in `agents/gsdr-assumptions-analyzer.md` if it does not exist in fork.

**Mode-aware gates in upstream plan-phase.md and progress.md:** Not fetched in this research pass. This is a GATE-08d gap to verify during planning — plan-phase.md in the fork at lines 126-132 dispatches researcher without mode-awareness. GATE-08d adds mode checks.

---

## R6 — GATE-09 Ledger Prototype (Q3)

### Existing Deferrals and Narrowings in Phase Artifacts

[evidenced:cited] Phase 57.7 Plan 10 SUMMARY (`57.7-10-SUMMARY.md:key-decisions`):
- "The vision-drop revision ships as `unclassified`: 57.7 added real scope-narrowing evidence, but it did not resolve the original anomaly-register bar for a progressive revision."
- The GATE-09 pending intervention record uses YAML frontmatter with fields: `intervention_id`, `interpretation_id`, `intervention_description`, `intervention_artifact`, `predicted_outcome`, `actual_outcome`, `outcome_status`.

[evidenced:cited] Phase 57.8 RESEARCH.md key decisions are prose, not structured. Phase 57.4 VERIFICATION.md uses a structured table for requirements coverage but no claim-disposition schema.

[evidenced:cited] `frontmatter.cjs` exists in the `get-shit-done/bin/lib/` tree (implied by Phase 57.8 research referencing it as a validator candidate). The KB uses YAML frontmatter via `extractFrontmatter()`. The dual-write invariant (files + SQLite) is established in Phase 56 + 57.8.

### Three Candidate Ledger Layouts

**Layout 1: Standalone `NN-LEDGER.md`**
```yaml
---
phase: 58-structural-enforcement-gates
generated_at: 2026-04-21T00:00:00Z
---
claims:
  - context_claim: "GATE-01 blocking substrate is best as CI rule"
    claim_type: assumed:reasoned
    disposition: implemented_this_phase
    target_phase_if_deferred: null
    narrowing_provenance: null
  - context_claim: "GATE-06/07 depend on Phase 57.9 substrate"
    claim_type: projected:reasoned
    disposition: explicitly_deferred
    target_phase_if_deferred: "57.9"
    narrowing_provenance: "AT-1 per CONTEXT.md §Acceptance Tests"
```

| Criterion | Assessment |
|-----------|-----------|
| Verifier tooling | Easy — `gsd-tools` reads `NN-LEDGER.md` via standard frontmatter path; clear file target |
| KB schema extension | New entry class required (or treat as signal variant); minimal columns |
| Compatibility | Additive — new file class, no existing artifact modified |
| Discoverability | Clear naming convention; phase directory already has CONTEXT/PLAN/SUMMARY/VERIFICATION |

**Layout 2: YAML block inside `NN-SUMMARY.md`**
```yaml
claims_ledger:
  - context_claim: "..."
    disposition: implemented_this_phase
```
| Criterion | Assessment |
|-----------|-----------|
| Verifier tooling | Harder — parser must extract nested YAML block from SUMMARY frontmatter; SUMMARY frontmatter is already complex |
| KB schema extension | Existing SUMMARY schema must absorb new top-level array — migration risk |
| Compatibility | Risky — SUMMARY.md frontmatter is already parsed by `extractFrontmatter()` in measurement extractors |

**Layout 3: Frontmatter extension on `NN-VERIFICATION.md`**
| Criterion | Assessment |
|-----------|-----------|
| Verifier tooling | Natural — VERIFICATION already contains "did claims survive" logic; verifier reads this |
| KB schema extension | Same migration concern as Layout 2 |
| Compatibility | VERIFICATION frontmatter is simpler than SUMMARY; lower collision risk |

**Q3 Recommendation:** [assumed:reasoned] **Standalone `NN-LEDGER.md` (Layout 1).** Reasons: (a) clean verifier target — one file, one schema; (b) no migration risk to existing SUMMARY/VERIFICATION parsers (the measurement extractors at `extractors/gsdr.cjs` parse SUMMARY; touching its schema risks regression); (c) consistent with the intervention-record pattern (`2026-04-17-gate-09-scope-translation-pending.md` uses a standalone YAML-frontmatter file); (d) `frontmatter.cjs` can validate independently.

**Recommended ledger schema (GATE-09a):**
```yaml
---
phase: NN-phase-name
generated_at: ISO8601
schema_version: "1.0"
---
claims:
  - context_claim: "verbatim claim text or short ID"
    claim_type: "decided:cited | assumed:reasoned | governing:reasoned | ..."
    load_bearing: true|false
    disposition: "implemented_this_phase | explicitly_deferred | rejected_with_reason | left_open_blocking_planning"
    target_phase_if_deferred: "NN or null"
    narrowing_provenance: "citation to originating CONTEXT claim + reason, or null"
    implemented_by: "plan file(s) or null"
```

**"Load-bearing" classification rule:** A claim is load-bearing if its `claim_type` is `[decided:*]`, `[stipulated:*]`, or `[governing:*]`, OR if it is `[assumed:*]` and appears in the `<dependencies>` table as a dependency for a `[decided:*]` claim.

**KB schema impact:** The ledger does not need to be indexed in `kb.db` in Phase 58. Phase 59 (KB query / FTS5) is the natural home for ledger query surface. Phase 58 ships the file format; Phase 59 adds the query. This is the explicit deferral.

---

## R7 — Measurement-Layer Consumption of Gate Fire-Events (G-6, DC-2)

[evidenced:cited] `get-shit-done/bin/lib/measurement/registry.cjs`:
- `REQUIRED_EXTRACTOR_FIELDS`: `name`, `source_family`, `raw_sources`, `runtimes`, `reliability_tier`, `features_produced`, `serves_loop`, `distinguishes`
- `SOURCE_FAMILIES`: `['RUNTIME', 'DERIVED', 'GSDR']` — gate fire-events belong in `GSDR` family
- `LOOP_DEFINITIONS` names 6 loops; `pipeline_integrity` is the closest home for gate fire-events
- API: `defineExtractor(...)` / `buildFeatureRecord(...)` — standard registration pattern

[evidenced:cited] `extractors/gsdr.cjs` pattern: reads from `.planning/config.json`, measurement artifacts, and KB via `loadGsdr()`. Gate fire-events would be a new `raw_source` key — e.g., a drop-file directory `.planning/measurement/gate-events/` where each gate writes a line on fire.

**Can existing registry consume gate fire-events without new measurement architecture?** [assumed:reasoned] YES — with the following design:

1. Each gate emits a structured log line to a file: `.planning/measurement/gate-events/GATE-NN-YYYY-MM-DD.jsonl`
   ```json
   {"gate":"GATE-01","fired_at":"2026-04-21T10:30:00Z","runtime":"claude-code","phase":"58","trigger":"offer_next","result":"blocked"}
   ```

2. A new `gate_fire_events` extractor in `GSDR` family reads this directory:
   ```javascript
   defineExtractor({
     name: 'gate_fire_events',
     source_family: 'GSDR',
     raw_sources: ['gate_events_dir'],
     runtimes: ['claude', 'codex'],
     reliability_tier: 'artifact_derived',
     features_produced: ['gate_id', 'fired_at', 'runtime', 'phase', 'trigger', 'result'],
     serves_loop: ['pipeline_integrity'],
     distinguishes: ['gate_coverage', 'gate_fire_rate'],
   });
   ```

3. Stratification: `stratify.cjs` groups by `gate_id × runtime × model` if model is in the event record. Straightforward extension.

**Single extractor vs one-per-gate:** Use single `gate_fire_events` extractor. Per-gate extractors would create 15+ registration entries for Phase 58 alone; single extractor with `gate_id` as a feature dimension is cleaner and matches the `sensorStatsFromConfig()` pattern.

**Cost:** Low. One extractor file, one drop-directory. No new measurement architecture.

---

## R8 — Meta-Gate Feasibility (Q5)

[evidenced:cited] The GATE-09 pending intervention record (`2026-04-17-gate-09-scope-translation-pending.md`) demonstrates the intervention-record pattern. The `phase_57_5_live_registry_query` interpretation surface can receive new extractor features.

**Q5 Answer: Adopt the meta-gate as GATE-09e.** [assumed:reasoned] Reasoning:

- **Query shape:** After Phase 58 completes, the verifier reads `.planning/measurement/gate-events/*.jsonl` and asserts that every GATE-01..15 appears at least once with `phase: 58`.
- **Cost:** One verifier step (bash + grep). No new tooling required beyond R7's drop-directory.
- **Fit:** The `pipeline_integrity` loop already tracks gate coverage concepts. The verifier query is: `for gate in {GATE-01..GATE-15}; do grep -l "\"gate\":\"$gate\"" .planning/measurement/gate-events/*-58*.jsonl || FAIL; done`
- **Cheap vs expensive:** Cheap — the R7 drop-directory design makes this trivial.

**GATE-09e requirement text:**
> "Every Phase 58 gate (GATE-01..GATE-15) emits at least one fire-event record in the gate-events log during the phase that introduces it. Verification fails if any gate has no record."

This catches "gate installed but not wired" — the exact failure mode audit §2.6/2.7 describes.

---

## R9 — `gsd-tools` Composability for GATE-10 (Q6)

[evidenced:cited] `gsd-tools.cjs:153-163`:
- `state record-session`: accepts `--stopped-at` and `--resume-file`; updates STATE.md with session stop point and resume file reference
- `state add-blocker`, `state resolve-blocker`: blocker management
- `state` (load): reads and displays STATE.md

[evidenced:cited] `gsd-tools.cjs:176-186`:
- `commit`: wraps `git commit -m` with optional `--files` flag for staged files

**Q6 Answer: Existing primitives are INSUFFICIENT for GATE-10. A new `gsd-tools phase reconcile` subcommand is warranted.** [assumed:reasoned]

Reasons:
- `state record-session` updates STATE.md `stopped_at` — but GATE-10 needs to update MULTIPLE files atomically: STATE.md (current phase + status), ROADMAP.md (phase row percent/status), phase plan checkboxes, and any planning-authority sidecars.
- No existing command reads ROADMAP.md and validates that the phase row is current.
- The existing `commit` command commits already-staged files — but there is no command that stages the correct files for a phase-closeout commit.
- Composition via shell scripting (`gsd-tools state record-session && gsd-tools commit ...`) is possible but fragile — it does not validate that the ROADMAP row is consistent with STATE.md, which is the core of GATE-10.

**Recommended new subcommand:** `gsd-tools phase reconcile [phase] [--status STATUS] [--percent PCT]`
- Reads current STATE.md and ROADMAP.md
- Validates that the phase row matches the declared status
- Stages STATE.md + ROADMAP.md + plan files (if checkboxes need update) for the reconciliation commit
- Emits a gate fire-event record for GATE-10
- Exits non-zero if any file is inconsistent

**Minimum viable implementation:** ~100-200 lines in gsd-tools.cjs state/phase handling section. No new dependencies.

---

## R10 — Chain Integrity Against Predecessor Audits

### Finding 2 (installed-agent verification)

[assumed:reasoned] Phase 55.2 VERIFICATION.md (verified: 2026-04-08):
- Truth 2: "Agent and sensor discovery handles both .md and .toml formats" — VERIFIED by `core.cjs checkAgentsInstalled` at line 1385.
- Finding 2 from codex-harness-audit-gpt54 was about `core.cjs:1274-1297` (installed-agent verification). Phase 55.2 specifically addressed `core.cjs` agent detection. **Status: Remediated by Phase 55.2 (HIGH confidence, based on VERIFICATION.md direct read).** The `checkAgentsInstalled` path now handles `.toml` alongside `.md`.

### Finding 3 (sensor introspection)

[evidenced:cited] Phase 55.2 VERIFICATION.md Truth 2: "sensors.cjs: discoverSensorDirs scans all 3 dirs; discoverSensors regex matches .md and .toml." **Status: Remediated by Phase 55.2 (HIGH confidence).**

### Finding 4 (init.cjs brownfield)

[evidenced:cited] Phase 55.2 VERIFICATION.md Truth 3: "init.cjs line 215: .codex present in skipDirs Set." **Status: Remediated by Phase 55.2 (HIGH confidence).**

### `signal-detection.md:67-76` — Codex model-class heuristic

[evidenced:cited] `get-shit-done/references/signal-detection.md:69-70` (verified by direct read):
```
| `quality` | opus-class (claude-opus-*) |
| `balanced` | sonnet-class (claude-sonnet-*) |
```
**Status: STILL PRESENT — not remediated.** The heuristics use Claude model-class patterns only. A Codex session using `o3`, `o4-mini`, or other OpenAI models would not be classified correctly by these rules. This undermines GATE-05 and GATE-07 measurement effectiveness on Codex. Note as `Genuine Gap` in R12 — out of scope for Phase 58 (deferred per audit §8 to AUT-02/v1.21), but the planner must note this as a measurement-accuracy caveat in the Codex per-gate declarations.

### `complete-milestone.md:721` — `gh pr merge` presence

[evidenced:cited] `complete-milestone.md:721-750`: The `offer_next` step body shows a completion banner with milestone summary and "Start Next Milestone" prompt — **NO `gh pr merge` invocation exists in this step.** The milestone workflow does not structurally merge anything; it assumes the PR was merged before `complete-milestone` was invoked. This is consistent with the current usage pattern but means milestone-boundary merges happen through `execute-phase.md:793` (the one conforming site), not through `complete-milestone.md`. GATE-02 CI grep check covers the source paths and will correctly pass (no non-conforming sites) while correctly confirming the one conforming site.

---

## R11 — Release-Workflow Wiring (GATE-11 Precondition)

[evidenced:cited] `.github/workflows/publish.yml` trigger shape:
- Trigger: `release: published` (GitHub Release published event) OR `workflow_dispatch` with `release_ref` input
- NOT triggered by: PR merge to main, tag push alone
- Flow: checkout at tag ref → resolve target → npm publish → optional GitHub Release notes update

**What "release-boundary assertion" looks like:**

GATE-11 needs to fire when a phase branch merges to main and asserts either:
1. A GitHub Release has been created for the current version, OR
2. An explicit "release deferred — reason: [X]" record exists

**Recommended substrate for GATE-11:** A new step in `execute-phase.md:offer_next` (after merge) that:
```bash
# Check if a release exists for the current package version
VERSION=$(node -p "require('./package.json').version")
if gh release view "reflect-v$VERSION" &>/dev/null; then
  echo "GATE-11: Release reflect-v$VERSION exists — boundary satisfied"
else
  echo "GATE-11: No release for reflect-v$VERSION — advance release or record deferral"
  # Emit gate fire-event with result=deferred
fi
```

This is a workflow-level check (not CI) because it fires at phase-merge time, not on every PR. Codex behavior: `applies-via-workflow-step` (same check available via `gh` CLI on Codex).

---

## Architecture Patterns

### Pattern 1: CI-as-Structural-Gate

For GATE-01, 02, 14, 15: enforcement in GitHub Actions workflow, not in agent workflow text.

```yaml
# .github/workflows/ci.yml — add these jobs:

- name: GATE-02 merge-strategy conformance
  run: |
    # Fail if --squash found, or if gh pr merge without --merge
    if grep -rn "gh pr merge" agents/ get-shit-done/ commands/ --include="*.md" | grep -v "\-\-merge"; then
      echo "GATE-02 FAIL: gh pr merge without --merge found"
      exit 1
    fi
    echo "GATE-02 PASS: all gh pr merge invocations use --merge"

- name: GATE-15 source/install parity
  run: |
    INSTALL_DIR=$(mktemp -d)
    HOME="$INSTALL_DIR" node bin/install.js --claude 2>&1
    # Compare with normalized substitutions
    node scripts/verify-install-parity.js "$INSTALL_DIR" || exit 1
```

### Pattern 2: Workflow-Level Exit-Coded Gate

For GATE-04, GATE-10, GATE-11, GATE-12: workflow step with exit code enforced.

```markdown
<step name="resume_check">
```bash
CONTINUE_HERE_PATH=".continue-here"
if [ -f "$CONTINUE_HERE_PATH" ]; then
  CONTINUE_AGE=$(stat -c %Y "$CONTINUE_HERE_PATH")
  STATE_AGE=$(git log -1 --format="%ct" -- .planning/STATE.md)
  if [ "$CONTINUE_AGE" -lt "$STATE_AGE" ]; then
    echo "GATE-04b HARD STOP: .continue-here is stale (predates STATE.md)"
    echo "gate_id=GATE-04b fired_at=$(date -u +%Y-%m-%dT%H:%M:%SZ) result=hard_stop" \
      >> .planning/measurement/gate-events/GATE-04b-$(date +%Y-%m-%d).jsonl
    exit 1
  fi
  # Archive before consume
  ARCHIVE_PATH=".planning/handoff/archive/$(date +%Y%m%d-%H%M%S).continue-here"
  mkdir -p .planning/handoff/archive/
  mv "$CONTINUE_HERE_PATH" "$ARCHIVE_PATH"
  echo "GATE-04a: Archived to $ARCHIVE_PATH"
fi
```
</step>
```

### Pattern 3: Dispatch Contract Restatement (GATE-13)

For every named delegation spawn site:

```markdown
# DISPATCH CONTRACT (restated inline — compaction-resilient per GATE-13)
# Agent: gsdr-phase-researcher
# Model: {researcher_model} (resolved from model-profiles.cjs profile={model_profile})
# Reasoning effort: default (researcher profile)
# Required inputs: phase number, CONTEXT.md path, RESEARCH.md output path
# Output: RESEARCH.md at {phase_dir}/{padded_phase}-RESEARCH.md
# Codex behavior: applies-via-workflow-step
Task(
  prompt="First, read ...",
  subagent_type="general-purpose",
  model="{researcher_model}",
  ...
)
```

### Pattern 4: Gate Fire-Event Drop-File

For all gates that need measurable fire-events:

```bash
# Standard gate fire-event emit pattern
emit_gate_event() {
  local gate=$1 result=$2 phase=$3
  local dir=".planning/measurement/gate-events"
  mkdir -p "$dir"
  echo "{\"gate\":\"$gate\",\"fired_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"result\":\"$result\",\"phase\":\"$phase\",\"runtime\":\"claude-code\"}" \
    >> "$dir/$gate-$(date +%Y-%m-%d).jsonl"
}
```

### Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ledger schema validation | Custom JSON parser | `frontmatter.cjs` (existing in gsd-tools) | Already handles YAML frontmatter across all KB entry types |
| Branch protection enforcement | Pre-push hook cascade | `gh api repos/.../protection` + `enforce_admins: true` | Server-side enforcement cannot be bypassed by local config changes |
| Source/install parity | Custom diff logic | `bin/install.js`-emitted SHA256 manifest | The installer already knows what it installed; use that as the ground truth |
| Multi-file phase reconciliation | String concatenation of state subcommands | New `gsd-tools phase reconcile` | Atomic validation + file staging is not composable from primitives without data loss risk |

---

## Common Pitfalls

### Pitfall 1: Structural Gate That Is Still Advisory
**What goes wrong:** A gate requirement is satisfied by adding a workflow step that asks the agent something. The agent reads it and complies — until it doesn't.
**Why it happens:** The requirement says "blocks" but the implementation is markdown prose with no exit code and no hook.
**How to avoid:** Every GATE must have either (a) an exit-coded bash step in a workflow, (b) a CI rule that blocks PR merge, or (c) an installed hook that fires automatically. Test by checking: can the agent skip this step without the system detecting it?
**Warning signs:** A GATE verification that passes by grep-for-text rather than by running a command.

### Pitfall 2: Advisory-by-Composition
**What goes wrong:** GATE-02 is implemented in `execute-phase.md` but not in `complete-milestone.md`. A milestone-boundary merge bypasses the gate.
**Why it happens:** Implementation follows the motivation example (execute-phase) not the requirement scope ("every surface").
**How to avoid:** For each gate, enumerate ALL workflow files that own the lifecycle event the gate covers. DC-3 (no advisory by composition) is the check.
**Warning signs:** Requirement text says "all workflows" but plan only names one file.

### Pitfall 3: GATE-09 Collapses to Prose
**What goes wrong:** The GATE-09 ledger is delivered as a section in PHASE-SUMMARY.md with narrative text, not YAML. The verifier cannot parse it.
**Why it happens:** SUMMARY.md is the natural phase artifact; adding to it feels like doing the work.
**How to avoid:** GATE-09a requires a standalone `NN-LEDGER.md` with a machine-readable YAML block. The SUMMARY may reference it but the ledger is NOT the SUMMARY prose.
**Warning signs:** "Ledger" delivered as bullet points in prose. `frontmatter.cjs` validation cannot be applied.

### Pitfall 4: Phase 57.9 Completion Incorrectly Assumed
**What goes wrong:** GATE-06 and GATE-07 are planned as if Phase 57.9 has shipped, but 57.9 has no phase directory and no plans (AT-1 check).
**Why it happens:** ROADMAP.md lists 57.9 as a dependency; planner assumes it will be done.
**How to avoid:** AT-1 in CONTEXT.md is explicit — Phase 58 plan must either (a) confirm 57.9 is complete at plan-phase entry, or (b) explicitly defer GATE-06/07 with GATE-09c provenance. Option (b) is the expected path given 57.9 has no plans yet.
**Warning signs:** GATE-06/07 in Phase 58 PLAN.md without a 57.9 prerequisite check step.

### Pitfall 5: `enforce_admins: false` Left Unclosed
**What goes wrong:** GATE-14 is declared complete via a pre-push hook, but admin direct-pushes bypass the hook and the branch protection is not strict.
**Why it happens:** Pre-push hooks are under Claude's Discretion per CONTEXT.md; easy to ship the hook without the server-side protection.
**How to avoid:** GATE-14 plan must include enabling `enforce_admins: true` on branch protection, not only a pre-push hook.
**Warning signs:** GATE-14 verified via "hook added" without branch protection audit.

---

## Open Questions

### Resolved

- **Q1 (GATE-03 detection rule):** Git-diff-based rule (b) recommended. Enumerates runtime-adjacent path set; glob rule (a) fails on `commands/*.md` workflow files; manifest rule (c) blocked by absent `dist/MANIFEST`. See R1.
- **Q2 (upstream discuss-phase line count):** 536 lines (not 671 — stale REQUIREMENTS.md figure). Delta = 257 lines across 4 categories. All adopt-as-is recommended. See R5.
- **Q3 (ledger file location):** Standalone `NN-LEDGER.md` recommended. See R6.
- **Q4 (framework-invisibility):** Accepted as deferred to Phase 60.1 per CONTEXT.md guidance. Not resolvable from declarative surface. See below.
- **Q5 (meta-gate):** Adopt as GATE-09e. Cheap implementation via R7 drop-directory. See R8.
- **Q6 (gsd-tools composability):** New `gsd-tools phase reconcile` subcommand required. Composition insufficient. See R9.

### Genuine Gaps

| Question | Criticality | Recommendation | Rationale |
|----------|-------------|----------------|-----------|
| Q4: Framework-invisibility ("structural vs advisory") | Low | Accept-risk — deferred to Phase 60.1 intervention-outcome loop per CONTEXT.md guidance | Cannot resolve from declarative surface; needs post-Phase-58 behavioral trial |
| `signal-detection.md:67-76` Codex model-class heuristic (R10) | Medium | Accept-risk for Phase 58; note in per-gate Codex declarations | Stale; affects measurement accuracy on Codex sessions but fix is AUT-02 scope (v1.21) |
| Upstream `gsd-assumptions-analyzer` agent existence | Low | Verify during GATE-08a execution (plan-phase step) | Not confirmed via GitHub API; GATE-08b may need to create from scratch vs adapt |
| Upstream plan-phase.md and progress.md mode-aware gate text | Low | Fetch during GATE-08d implementation | Not fetched in this pass; only discuss-phase-assumptions.md was fetched |
| Phase 57.9 readiness at plan-phase entry | Critical | Check AT-1 before plan-phase proceeds; defer GATE-06/07 via GATE-09c if 57.9 not ready | 57.9 has no phase directory; no plans. This is the expected state — AT-1 formalizes the explicit deferral path |
| `enforce_admins: true` feasibility (repo permissions) | Medium | Verify repo admin access at plan-phase time; document as manual step if CI automation is insufficient | Branch protection changes require admin permissions; automated CI cannot self-modify branch protection |

### Still Open
- Whether upstream `gsd-assumptions-analyzer` agent spec is byte-for-byte adoptable vs needs fork adaptation (model names, path prefixes, tool declarations)
- Whether `complete-milestone.md` should gain an explicit `gh pr merge --merge` invocation or whether milestone-boundary merges are always done via the `execute-phase.md` path (architectural question for GATE-02)

---

## Plan Recommendations

### Wave Structure

**Wave A — CI-hosted gates (no session state dependency, can land in parallel):**
- Plan A1: CI enforcement (GATE-01 CI-wait loop, GATE-02 grep check, GATE-03 detection rule in quick.md, GATE-14 branch protection + pre-push hook) — touches `execute-phase.md`, `quick.md`, `ci.yml`, branch protection
- Plan A2: Parity and XRT-01 (GATE-15 CI parity check, XRT-01 plan-phase assertion, per-gate Codex behavior table) — touches `ci.yml`, `bin/install.js`, `plan-phase.md`, REQUIREMENTS.md
- Plan A3: GATE-09a/b/c (ledger schema, planning gate, narrowing-provenance rule) — touches new `NN-LEDGER.md` template, `frontmatter.cjs`, `plan-phase.md`

**Wave B — Session-state gates (serialize by file ownership):**
- Plan B1: `.continue-here` lifecycle (GATE-04a/b/c) — touches `resume-project.md` only
- Plan B2: Delegation hygiene (GATE-05, GATE-13) — touches `collect-signals.md`, `plan-phase.md`, `execute-phase.md`, `reflect.md`, `audit.md`; **overlaps with A1** on `plan-phase.md` and `execute-phase.md` — serialize B2 after A1
- Plan B3: Phase closeout reconciliation (GATE-10, GATE-11, GATE-12, `gsd-tools phase reconcile`) — touches `gsd-tools.cjs`, `execute-phase.md`, `complete-milestone.md`; **overlaps with A1** on `execute-phase.md` — serialize B3 after A1/B2
- Plan B4: GATE-08 (discuss-phase adoption, `gsd-assumptions-analyzer` agent) — new agent file + `discuss-phase-assumptions.md` + `plan-phase.md` + `progress.md`; **overlaps with A1/B2** on `plan-phase.md` — serialize after B2
- Plan B5: GATE-09d + meta-gate (GATE-09e) — ledger verifier, gate-event extractor, verification step — touches `extractors/gsdr.cjs`, verification workflow; depends on B3 (gate-event drop-dir from GATE-10/11/12)
- Plan B6: GATE-06/07 — **explicitly defer or mark as waiting-on-57.9** per AT-1; if 57.9 has shipped by plan-phase, integrate in this plan; if not, write the deferral ledger entry in the `58-LEDGER.md`

**File-scope overlap warnings:**
- `execute-phase.md` is touched by A1 (GATE-01/02), B2 (GATE-05/13), and B3 (GATE-10/11) — serialize these plans or split into non-conflicting sections
- `plan-phase.md` is touched by A1 (GATE-01), A3 (GATE-09b), B2 (GATE-05/13), B4 (GATE-08d) — serialize B-wave plans on this file
- `ci.yml` is touched by A1 and A2 — A1 and A2 can be waved together if wave-level test runs are between them

**GATE-09c applied reflexively to this research:** All Q1-Q6 resolutions above constitute narrowings from CONTEXT.md open claims. The planner must cite this RESEARCH.md as the provenance source in the `58-LEDGER.md` for these resolutions. Specifically:
- Q1 → git-diff rule selected over glob/manifest
- Q2 → 536-line baseline selected, not 671
- Q3 → standalone LEDGER.md selected
- Q5 → GATE-09e added
- Q6 → new `phase reconcile` subcommand added

---

## Sources

### Primary (HIGH confidence)
- `.planning/audits/2026-04-20-phase-58-structural-gates-gap-audit/phase-58-structural-gates-gap-audit-output.md` — primary audit authority for Phase 58, all findings
- `.planning/phases/58-structural-enforcement-gates/58-CONTEXT.md` — phase context and typed claims
- `.planning/phases/58-structural-enforcement-gates/58-DISCUSSION-LOG.md` — claim justifications and context-checker verification
- `.planning/REQUIREMENTS.md:205-265` — GATE-01..15 + XRT-01 requirement text (lines read directly)
- `.planning/ROADMAP.md:141-150` — Phase 57.9 prerequisite definition
- `.github/workflows/ci.yml` — CI substrate (read directly)
- `.github/workflows/publish.yml` — release workflow (read directly)
- `.claude/settings.json` — hook surface (read directly, 54 lines)
- `get-shit-done/workflows/execute-phase.md:777-824` — offer_next substrate
- `get-shit-done/workflows/complete-milestone.md:721-750` — offer_next milestone step
- `get-shit-done/workflows/quick.md:155-175` — quick task branching logic
- `get-shit-done/workflows/resume-project.md:120-138` — .continue-here lifecycle
- `get-shit-done/workflows/collect-signals.md:242-280` — sensor spawn loop
- `get-shit-done/workflows/discuss-phase-assumptions.md` (fork, 279 lines, read directly)
- `get-shit-done/bin/lib/measurement/registry.cjs` — extractor registry API (read directly)
- `get-shit-done/bin/lib/measurement/extractors/gsdr.cjs:1-120` — GSDR extractor pattern
- `get-shit-done/bin/gsd-tools.cjs:145-186` — state primitives
- `bin/install.js:2085-2895` — installer hook/parity logic
- `.planning/phases/55.2-codex-runtime-substrate/55.2-VERIFICATION.md` — chain integrity (read directly)
- `.planning/phases/57.7-content-analysis-epistemic-deepening-inserted/57.7-10-SUMMARY.md` — vision-drop revision precedent
- `.planning/measurement/interventions/2026-04-17-gate-09-scope-translation-pending.md` — ledger/intervention schema precedent
- `.planning/research/cross-runtime-parity-research.md:70-80` — Codex hook availability
- `get-shit-done/references/signal-detection.md:67-76` — model-class heuristics (stale)
- `gh api repos/loganrooks/get-shit-done-reflect/branches/main/protection` — branch protection state (read directly)
- `git log --first-parent main --no-merges --since="60 days ago"` — direct-to-main commit corpus (run directly)

### Secondary (MEDIUM confidence)
- WebFetch: `https://raw.githubusercontent.com/gsd-build/get-shit-done/main/get-shit-done/workflows/discuss-phase-assumptions.md` — upstream 536-line current state (fetched 2026-04-20); upstream agent directory NOT verified

### Tertiary (LOW confidence)
- Upstream `gsd-assumptions-analyzer` agent presence — inferred from `<available_agent_types>` block in upstream workflow; not independently verified via GitHub API directory listing

---

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`). Relevant signals applied:

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-04-10-ci-branch-protection-bypass-recurrence | signal | CI + direct-push bypass recurred 3× despite earlier remediation | R1 (GATE-14 gap analysis) |
| sig-2026-04-20-phase-closeout-planning-state-release-lag | signal | Closeout seam left STATE/PR/release pending (6 occurrences) | R11 (GATE-11) |
| sig-2026-04-17-phase-closeout-left-state-pr-release-pending | signal | Same pattern, 5 occurrences | R11 |
| sig-2026-04-17-codex-auto-compact-prompt-parity-gap | signal | Codex auto-compact silently dropped delegation conventions (3×) | R3 (GATE-13) |
| sig-2026-04-10-researcher-model-override-leak-third-occurrence | signal | Model override leaked from sensors to researcher (3×) | R3 (GATE-05) |
| sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving | signal | Orchestrator used rm on partial output (2×) | R2 (GATE-12) |
| sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop | signal | Upstream discuss features dropped silently | R5 (GATE-08) |
| sig-2026-04-10-phase-574-pr45-ci-clean-mergeable-baseline | signal | CI + required checks already operational — positive baseline | R1 (GATE-01) |

No spikes in the KB directly match Phase 58 gate implementation domain.

---

## RESEARCH COMPLETE

**Phase:** 58 - Structural Enforcement Gates
**Confidence:** HIGH for substrate findings; MEDIUM for extractor registry gate-event consumption; LOW for Codex hook timing

### Key Findings

- CI branch protection has `enforce_admins: false` — GATE-14 cannot rely on branch protection alone for admin direct-push prevention without enabling this. All other existing CI infrastructure is solid for GATE-01/02/15.
- Upstream `discuss-phase-assumptions.md` is 536 lines (not 671). Fork delta of 257 lines is plannable across 4 categories, all adopt-as-is.
- Q3 resolved: standalone `NN-LEDGER.md` with YAML frontmatter is the correct ledger location — avoids parser migration risk in existing SUMMARY/VERIFICATION measurement extractors.
- Q5 resolved: meta-gate (GATE-09e) is cheap via drop-file gate-events directory — one verifier bash step, no new measurement architecture.
- Q6 resolved: `gsd-tools phase reconcile` new subcommand is required — existing `state record-session` + `commit` primitives cannot atomically validate and stage the multi-file reconciliation.
- Phase 57.9 has NO phase directory and NO plans. AT-1 applies: Phase 58 plan must explicitly defer GATE-06/07 with GATE-09c provenance, not claim them as deliverable.

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Substrate (CI, hooks, workflows) | HIGH | All files read directly; branch protection verified via API |
| Detection rule (Q1) | HIGH | 60-day commit corpus analyzed; rule boundaries tested against real examples |
| Upstream delta (Q2) | MEDIUM | Fetched upstream file, counted lines; agent existence not independently verified |
| Ledger design (Q3) | MEDIUM | Three options analyzed; recommendation based on parser compatibility assessment |
| Extractor registry integration | MEDIUM | API-compatible by inspection; not tested with gate-event payload format |
| Chain integrity findings | HIGH | 55.2-VERIFICATION.md read directly; stale heuristic verified by direct grep |

### Ready for Planning
Research complete. Planner can now create PLAN.md files. AT-1 check must be the first step in plan-phase.md: confirm Phase 57.9 status and either (a) confirm it is complete or (b) write GATE-06/07 deferral into the ledger.
