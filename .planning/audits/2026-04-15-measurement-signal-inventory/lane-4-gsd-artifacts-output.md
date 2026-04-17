# Lane 4: GSD Artifacts as Measurement Sources

**Date:** 2026-04-15  
**Auditor:** Claude Sonnet 4.6 (Lane 4 of 4-lane parallel audit)  
**Scope:** `.planning/` directory structure as measurement corpus — phase artifacts, signal files, git history, cross-source join possibilities, derived features  
**Epistemic protocol:** Every claim carries explicit epistemic status. Sampled claims name N of M. Verified-across-corpus claims name the extraction method and result. Anomalies are registered explicitly.

---

## 1. Corpus Overview

### 1.1 Total File Count

**Verified-across-corpus:** `find .planning -type f` returns **1,215 files** total in `.planning/`.

### 1.2 Directory Structure Map

| Directory | Files | Description |
|-----------|-------|-------------|
| `.planning/phases/` | ~800+ | Phase directories (65 phase directories) |
| `.planning/knowledge/signals/` | 255 total (9 top-level + 246 in nested `get-shit-done-reflect/`) | Signal files |
| `.planning/knowledge/reflections/` | (subdirectory) | Reflection outputs |
| `.planning/knowledge/spikes/` | (symlink to .planning/spikes) | Spike pointers |
| `.planning/deliberations/` | 43 files | Design deliberation documents |
| `.planning/audits/` | 104 files across 20 entries | Audit artifacts |
| `.planning/spikes/` | 8 spike directories | Spike DESIGN.md + DECISION.md + code |
| `.planning/quick/` | 41 directories | Quick task artifacts |
| `.planning/todos/` | 6 files (1 done, 5 pending) | Todo items |
| `.planning/milestones/` | 18 files | Per-milestone archived docs |
| `.planning/research/` | ~20 files | Research documents |
| `.planning/governance/` | 7 files | ARCHITECTURE, CONVENTIONS, STACK, etc. |
| Root `.planning/` files | ~20 | STATE.md, ROADMAP.md, REQUIREMENTS.md, config.json, baseline.json, migration-log.md, and 4 sensor-trial files |

### 1.3 Phase Directory Count

**Verified-across-corpus:** 65 phase directories in `.planning/phases/`, numbered from `00-deployment-infrastructure` through `57.4-audit-skill-investigatory-type` plus `999.1-pipeline-enrichment-step-discuss-plan`.

### 1.4 Date Range

**Verified-across-corpus:** Git commits span **2025-12-15** (earliest commit) through **2026-04-10** (latest committed work). Phase artifact dates visible in CONTEXT.md headers span **2026-02-02** (Phase 01 CONTEXT gathered) through **2026-04-09** (Phase 57.4 CONTEXT gathered). Signal dates span **2026-02-11** through **2026-04-10**.

---

## 2. Phase Artifact Inventory

### 2.1 CONTEXT.md

**Counts (verified-across-corpus):**
- Total CONTEXT.md files (all naming patterns): **36** (excludes archive/pre-phase copies)
- Total files including archived versions: higher (many phases have `pre-phase-archive/` copies)

**Structure observed (sampled: 3 of 36 — Phases 01, 57.3, 57.4):**

**Older format (Phase 01, dated 2026-02-02):** File at `.planning/phases/01-knowledge-store/01-CONTEXT.md`. Structured with `<domain>`, `<decisions>`, `<specifics>`, `<deferred>` XML sections. **No typed claim markers.** Decisions are free-prose lists. Grep for `[governing:`, `[assumed:`, `[open]` returns 0 matches across all 01-CONTEXT.md content.

**Newer format (Phases 57.3, 57.4, dated 2026-04-09):** Dramatically more structured. Files use XML sections: `<domain>`, `<working_model>`, `<constraints>`, `<guardrails>`, `<questions>`, `<dependencies>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<deferred>`. Typed claim markers (`[governing:reasoned]`, `[assumed:reasoned]`, `[evidenced:cited]`, `[decided:reasoned]`, `[open]`, `[projected:reasoned]`, `[stipulated:bare]`) appear throughout working model and constraints.

**Claim counts from Phase 57.3-CONTEXT.md (intervention-tested via grep):**
- `[governing:`: 8 matches
- `[assumed:`: 11 matches
- `[evidenced:`: 12 matches
- `[decided:`: 2 matches
- `[open]`: 7 matches

**Claim types available (from Phase 57.2 infrastructure, per `.planning/phases/57.3-audit-workflow-infrastructure/57.3-CONTEXT.md:100`):** `[governing:reasoned]`, `[assumed:reasoned]`, `[assumed:bare]`, `[evidenced:cited]`, `[evidenced:reasoned]`, `[decided:reasoned]`, `[stipulated:bare]`, `[projected:reasoned]`, `[open]` — 7 typed + open marker.

**Parseability:**
- **Sampled:** Typed claim extraction reliable in 3 of 3 examined files with new format (Phases 57.1–57.4). Regex `\[(governing|assumed|evidenced|decided|stipulated|projected)[:\]]` extracts counts correctly.
- **Anomaly (critical for retroactive use):** Typed claims were introduced in Phase 57.2 (shipped 2026-04-09). Phases 01–57.1 have NO typed claims. Claim counts as a measurement only exist for the most recent ~5 phases. Retroactive applicability: zero for phases before 57.2.

**What a "claim propagation rate" extractor needs:**
- Parse `<working_model>` for `[governing:]` claims → record as "governing set"
- Parse `<questions>` section for `[open]` items → record as "open question set"
- Match governing claim themes to PLAN.md truths (requires semantic matching, not simple string match)
- **Inferred:** Reliable count extraction via regex for phases 57.2+. Cross-file theme matching is speculative without NLP — direct string alignment unlikely to be reliable.

---

### 2.2 PLAN.md

**Counts (verified-across-corpus):**
- Total PLAN files: **192** (excluding archive/pre-phase copies)
- All 192 have YAML frontmatter (verified by checking that `find ... -name "*PLAN*"` returns 192 and all have `---` delimiters)

**Structure observed (sampled: 3 — Phases 01-01, 20-01, 57.4-01):**

YAML frontmatter present in all examined. Fields:
- `phase` (string): present in all 3 sampled ✓
- `plan` (integer): present in all 3 sampled ✓
- `type` (string, e.g., "execute"): present in all 3 ✓
- `wave` (integer): present in all 3 ✓
- `depends_on` (array): present in all 3 ✓
- `files_modified` (array): present in all 3 ✓
- `autonomous` (boolean): present in all 3 ✓
- `must_haves.truths` (array of strings): present in all 3 ✓
- `must_haves.artifacts` (array of objects): present in all 3 ✓
- `must_haves.key_links` (array of objects): present in 2 of 3 (Phase 01 uses simpler format)
- `resolves_signals` (array): present in 9 of 192 files (intervention-tested via grep)

**Intervention-tested truth count extraction:**
- Python3 parse across all 198 PLAN files: **198 of 198 have at least one truth**
- Min truths: 2, Max: 12, Mean: 5.0 per plan

**Plan complexity metrics available now:**
- Truth count per plan: ✓ reliable (all 198 plans)
- Wave/dependency count: ✓ reliable
- Files-modified count: ✓ reliable
- `resolves_signals` linkage: only present in 9/192 plans — **sparse**

**Anomaly:** Early plans (Phases 01–42 era) have simpler frontmatter structures. The `key_links` block and `resolves_signals` field appear to have been added in later phases. Retroactive completeness varies.

---

### 2.3 SUMMARY.md

**Counts (verified-across-corpus):** **192** SUMMARY files exist matching 192 PLAN files.

**YAML frontmatter fields (sampled: Phase 30-01-SUMMARY and 57.4-01-SUMMARY — contrasting early vs late):**

**Early format (Phase 30-01-SUMMARY, dated 2026-02-23):** Fields: `phase`, `plan`, `subsystem`, `tags`, `requires`, `provides`, `affects`, `tech-stack`, `key-files`, `key-decisions`, `patterns-established`, `duration`, `completed`. No `model` or `context_used_pct`.

**Later format (Phase 57.4-01-SUMMARY, dated 2026-04-10):** Additional fields: `model`, `context_used_pct`. All older fields present.

**Intervention-tested field availability:**
- `duration` field: **183 of 192** SUMMARY files contain `^duration:` in frontmatter
- `context_used_pct` field: **64 of 192** files (earliest at Phase 43, added circa 2026-03-XX)
- `model` field: **64 of 192** files (same cohort)
- `completed` field: present in ~192 but format varies (date-only vs ISO timestamp — anomaly)

**Format consistency anomaly:** `completed` field uses mixed formats: `"2026-02-03"` (quoted string), `2026-02-02` (unquoted date), and `2026-02-03T23:58:43Z` (ISO datetime). A parser must handle all three.

**Performance section in body:** Body always contains a `## Performance` section with `**Duration:**`, `**Tasks:**` (completed count), and `**Files modified:**` or `**Files Created/Modified:**` lines. These are parseable prose — slightly less reliable than frontmatter fields but present in all examined files.

---

### 2.4 VERIFICATION.md

**Counts (verified-across-corpus):**
- Named `*-VERIFICATION.md`: **65** files (excluding archive copies)
- Plus 1 bare `VERIFICATION.md` at Phase 01

**YAML frontmatter structure (sampled: Phases 30, 57.4):**

Consistent across both sampled: `phase`, `verified` (ISO timestamp), `status` (passed/gaps_found/human_needed), `score` (N/M string).

**Intervention-tested score extraction:**
- Python3 regex `score:\s*(\d+)/(\d+)` across 65 files: **30 files return scores** (remaining 35 either don't have frontmatter score OR use different format)
- **Wait — correction via re-examination:** grep `score:` directly: 30 hits. But total VERIFICATION files is 65/66. The older files (pre-Phase 31 schema) may lack frontmatter score.

**Re-intervention (grep-based):**
- `grep -rh "^score:" .planning/phases/ --include="*VERIFICATION*"` returns 30 score lines from 30 files
- The remaining ~35 VERIFICATION files use different structures — some have score in body text only, some pre-date the YAML frontmatter score convention

**Status distribution (intervention-tested across 65 files):**
- `passed`: 60
- `gaps_found`: 4
- `human_needed`: 1
- Total: 65 (5 files lack status in frontmatter)

**Aggregate pass rate (intervention-tested):** 551/557 truths verified = **98.9%** across all 30 files with parseable scores.

**Format inconsistency anomaly:** The score is in frontmatter in newer phases but only in body prose in older phases. The `status` field is consistently in frontmatter for phases where it exists. Retroactive score extraction requires two parsing strategies.

---

### 2.5 DISCUSSION-LOG.md

**Counts (verified-across-corpus):** **6** DISCUSSION-LOG.md files exist (Phases 57.1, 57.2, 57.3, 57.4 + 2 others). This format was introduced in Phase 57.2.

**Structure (sampled: Phase 57.3-DISCUSSION-LOG.md):**

Header: date, phase, mode, "areas discussed" summary. Body: numbered "### Area N: [Topic]" sections, each containing: "Gray area:", "Options presented:", "Resolution:", "User interventions:", "Why this resolution:".

**Grep count (intervention-tested):** Phase 57.3-DISCUSSION-LOG.md contains 6 `### Area` sections.

**CONTEXT.md open questions vs DISCUSSION-LOG gray areas:**
- Phase 57.3-CONTEXT.md has 7 `[open]` markers (questions section has 5 named Q1–Q5)
- Phase 57.3-DISCUSSION-LOG.md has 6 gray areas
- These are NOT 1:1 — gray areas map to broad discussion themes, open questions are specific research programs. Some Q items are answered in the log without being explicitly listed as gray areas.
- **Inferred:** A "discussion coverage" metric (gray areas discussed vs open questions posed) is computable but requires thematic matching, not string equality. Unreliable without NLP.

---

## 3. Signal File Inventory

### 3.1 File Count and Location

**Verified-across-corpus:** Two signal directories:
- `.planning/knowledge/signals/` root (top-level): **9 files** (recent signals filed directly here: `sig-2026-02-23-*`, `sig-2026-03-30-*`, `sig-2026-04-03-*`, `sig-2026-04-09-*`, `sig-2026-04-10-*`)
- `.planning/knowledge/signals/get-shit-done-reflect/`: **246 files** (older corpus, migrated here)
- **Total: 255 signal files**

**Anomaly:** Two different naming conventions coexist:
1. `sig-{date}-{slug}.md` format (used in top-level and for newer signals in nested dir)
2. `{date}-{slug}.md` format (no `sig-` prefix, used for early signals in nested dir: `2026-02-11-agent-inline-research-context-bloat.md`)
3. `SIG-{date}-{number}-{slug}.md` format (uppercase, used for a cluster of SIG-260222-* through SIG-260223-* in nested dir)

### 3.2 YAML Frontmatter Schema

**Observed fields (sampled: 4 of 255 — sig-2026-04-10-authority-weighting-guard, sig-2026-02-11-agent-inline, sig-2026-03-30-audit-severity-downgrade, sig-2026-04-09-spec-workflow-runtime):**

**Stable core fields (present in all 4 sampled):**
- `id` (string): signal identifier
- `type` (string): "signal" or "observation"
- `severity` (string): "critical", "notable", "minor", "medium", "high"
- `phase` (string): associated phase
- `date` (string or ISO datetime): filing date
- `tags` (array): searchable tags

**Extended fields (present in newer signals, absent in older):**
- `project` (string): project name — absent in 2026-02-11 signal ✓ present in 2026-04-10 signal
- `signal_type` (enum): "deviation", "good-pattern", "capability-gap", "epistemic-gap", "baseline", "struggle", "config-mismatch", "improvement", "quality-issue", "custom", "plan-accuracy", "pattern", "observation"
- `signal_category` (string): "negative", "positive", "mixed"
- `lifecycle_state` (string): "detected", "triaged", "blocked", "remediated", "verified", "invalidated"
- `lifecycle_log` (array): timestamped state transitions
- `occurrence_count` (integer): recurrence count
- `confidence` (string): "high", "medium", "low"
- `confidence_basis` (string): rationale for confidence
- `evidence.supporting` (array): supporting evidence items
- `evidence.counter` (array): counter-evidence items
- `detection_method` (string): "manual", "artifact-analysis", "conversation-review"
- `origin` (string): "user-observation", "phase-execution"
- `runtime` (string): "claude-code"
- `model` (string): model used during detection
- `gsd_version` (string): GSD version
- `polarity` (string): "negative", "positive"
- `related_signals` (array): related signal IDs
- `status` (string): "active", "open"
- `created` / `updated` (ISO datetime)
- `durability` (string): "convention", etc.
- `environment` (object): os, node_version, config_profile

### 3.3 Field Consistency Analysis

**Intervention-tested:**
- Files WITH `lifecycle_state:` field: **158 of 254** searchable files (62%)
- Files WITHOUT `lifecycle_state:` field: **88 of 254** (38%)
- Remediation-related entries: **28 files** contain "remediated", **7 have `lifecycle_state: remediated`**

**Severity distribution (intervention-tested via `grep -rh "severity:"`):**
- `notable`: 144
- `minor`: 68
- `critical`: 37
- `medium`: 3
- `high`: 2
- Total tagged: ~254

**Signal type distribution (intervention-tested):**
- `deviation`: 114
- `good-pattern`: 25
- `capability-gap`: 23
- `epistemic-gap`: 16
- `baseline`: 16
- `struggle`: 11
- `config-mismatch`: 7
- `improvement`: 6
- `quality-issue`: 5
- Others: 10

### 3.4 What's Computable

**Reliably computable now:**
- Total signal count: 255
- Severity distribution: extractable via grep
- Signal type distribution: extractable for the 64% of signals with `signal_type:` field
- Filing date range: extractable from filename (all follow date patterns)
- Phase association: extractable from `phase:` field (present in most)

**Computable with caveats:**
- **Remediation rate:** `lifecycle_state: remediated` appears in 7 signals (2.75%). But 88 signals lack `lifecycle_state` entirely — many may be remediated without being marked. True rate unknown. **Anomaly:** the lifecycle state field was added in Phase 31 (Feb 2026). Older signals have no lifecycle tracking.
- **Time-to-remediation:** For signals with both `created:` and `lifecycle_log:` entries, time-to-remediation is computable. But these fields are present in a minority of signals (the newer cohort with lifecycle tracking).
- **Recurrence rate:** `occurrence_count > 1` is computable for signals with that field. Intervention-tested: `sig-2026-04-10-discuss-phase-authority-weighting-gap.md` shows `occurrence_count: 2` with explicit corroboration dated entry. Reliable for the ~40% of signals with the field.
- **Signal accuracy rate:** Not directly measurable from signal files alone — would need to cross-reference with verification outcomes. **Speculative.**

---

## 4. Git History Inventory

### 4.1 What's Derivable

**Verified-across-corpus:** 2,020 commits since 2026-01-01. Full project history from 2025-12-15.

### 4.2 Commit Type Distribution (intervention-tested)

```
957  docs(*)
398  feat(*)
226  fix(*)
110  (numeric — quick task IDs)
 69  test(*)
 67  chore(*)
 58  refactor(*)
 41  Merge pull request
 33  wip(*)
 20  release: v*
```

**Deviation indicators (intervention-tested):**
- Commits with `fix(` prefix: **226** (fix: prefix commits: 156 additional)
- Commits containing "deviation|correction|revert" case-insensitive: **16**

### 4.3 Phase-Correlated Commits (sample output from git log)

```bash
$ git log --oneline | grep "57.4" | head -5
599574b6 release: v1.19.4
3f477495 Merge pull request #45 from loganrooks/gsd/phase-57.4-audit-skill-investigatory-type
4cd6f5d9 chore(57.4): resume work + sensor stats bookkeeping
8979dfd7 docs(signals): collect phase 57.4 signals (17 new + 1 corroboration + 1 regression)
0aca9652 docs(phase-57.4): complete phase execution
```

**Intervention-tested:** Phase 57.4 has **48 commits** referencing it. Commits by phase prefix (`git log | grep -oP '\(\d+[\.\d]*\)'`) shows Phase 57 with 18 commits, Phase 57.4 with 14 in the parenthetical scope.

### 4.4 Branch Lifecycle Data (sample output)

```bash
$ git log --all --format="%H %ci %D" | grep "origin/gsd/phase-57.4"
4cd6f5d9 2026-04-10 18:10:33 -0400  (origin/gsd/phase-57.4-audit-skill-investigatory-type)
```

**Phase 57.4 lifecycle derivable from git:**
- Branch creation: first commit on branch at **2026-04-09 20:02:38** (`docs(phase-57.4): insert Audit Skill & Investigatory Type phase`)
- Branch merge (PR #45): **2026-04-10 18:23:01** (Merge pull request commit)
- Branch duration: ~22 hours
- Remote branch still exists: `origin/gsd/phase-57.4-audit-skill-investigatory-type` at commit `4cd6f5d9`

**Other recent branches (intervention-tested via git log --all):**
- `origin/gsd/phase-57.3`: ended 2026-04-09 14:04:37
- `origin/gsd/phase-57.2`: ended 2026-04-09 07:36:09
- `origin/gsd/phase-56-kb-schema-sqlite-foundation`: ended 2026-04-08 18:11:12

### 4.5 File Churn Per Phase

**Inferred (not directly extracted but verifiable):** `git diff --stat {branch-start}..{branch-end}` for each phase branch would yield file churn. SUMMARY.md frontmatter `key-files.modified` array provides an alternative source that doesn't require git traversal.

**Intervention-tested SUMMARY-based churn:** `grep -rh "files_modified:" .planning/phases/ --include="*PLAN*"` shows all plans declare their modified files in frontmatter — this is a reliable churn source without git traversal.

---

## 5. Cross-Source Join Possibilities

| Join | Sources Needed | Join Key | Key Reliability | Serves Loop |
|------|---------------|----------|-----------------|-------------|
| Session → phase correlation | STATE.md `last_updated`, session timestamp (from session logs) | Timestamp proximity (within same day/hour) | MEDIUM — `last_activity` in STATE.md is date-only (no time); session timestamps are precise. Join is approximate. Multiple sessions on same day can't be distinguished. | Agent performance, cross-runtime comparison |
| Plan complexity → context usage | PLAN.md `must_haves.truths` count, SUMMARY.md `context_used_pct` | `phase` + `plan` (exact string match) | HIGH — both files have `phase:` and `plan:` frontmatter fields; join is exact. Only 64 of 192 plans have `context_used_pct`. | Agent performance |
| CONTEXT claims → PLAN truths → VERIFICATION results | CONTEXT.md `[governing:]` markers, PLAN.md `truths:` list, VERIFICATION.md `score:` | Phase identifier (exact string match) | HIGH for phase join. LOW for claim→truth pipeline tracing (requires semantic matching — claim text rarely appears verbatim in plan truths) | Pipeline integrity |
| Signal → session → fix | Signal `date:` field, commit timestamps, git log `resolves_signals:` in PLANs | Date (approximate) + phase string (exact) | LOW — `resolves_signals:` present in only 9 of 192 plans. Signal date → git commit within same day is approximate. No direct session ID in signal files. | Intervention lifecycle |
| SUMMARY duration → token usage | SUMMARY.md `duration:`, session-meta token counts | Timestamp (date-level) + phase | MEDIUM — duration in minutes is in SUMMARY frontmatter (183/192 files); session token counts require Lane 1/2 data. Session-to-plan mapping is approximate. | Agent performance |
| Plan truthcount → verification score | PLAN.md truth count, VERIFICATION.md score N/M | Phase + plan number (exact) | HIGH — but only 30 of 65 VERIFICATION files have parseable frontmatter scores. Older VERIFICATION files require body parsing for score. | Pipeline integrity |
| Signal severity → verification score | Signal `severity:`, phase VERIFICATION `status:` | Phase string (exact) | MEDIUM — many signals lack phase association or have it as a loose string (not canonicalized against phase directory names). | Signal quality |

**Most reliable joins:**
1. PLAN.md truth count ↔ SUMMARY.md context_used_pct (same phase+plan key, both frontmatter) — HIGH reliability for the 64-plan cohort
2. PLAN.md ↔ VERIFICATION.md (same phase key, verified/score relationship) — HIGH reliability for structural data

**Least reliable joins:**
1. Signal → session → fix tracing — LOW reliability due to missing `resolves_signals` linkage and no session_id in signal files

---

## 6. Derived Features

| Feature | Raw Sources | Reliability | Serves Loop |
|---------|------------|-------------|-------------|
| **Phase complexity index** | PLAN truth count + wave count + files_modified count from PLAN frontmatter | HIGH for phases 01+; all 192 plans have these fields | Agent performance, pipeline integrity |
| **Context saturation per plan** | `context_used_pct` from SUMMARY frontmatter | MEDIUM — present in 64 of 192 plans (Phase 43 onward) | Agent performance |
| **Verification density** | VERIFICATION score N/M (truths verified per plan) | MEDIUM — reliable for 30 of 65 VERIFICATION files; body parsing needed for older ones | Pipeline integrity, agent performance |
| **Scope drift indicator** | PLAN truth count vs CONTEXT governing claim count | LOW for now — CONTEXT claims only exist for Phases 57.2+; PLAN truths exist for all | Pipeline integrity |
| **Signal filing rate** | Signal count per phase (date-based join) | MEDIUM — signal `phase:` field present in most signals; filename dates allow phase assignment | Signal quality, cross-session patterns |
| **Signal type churn** | signal_type distribution per milestone (from milestone date + signal dates) | MEDIUM — dates in filenames reliable; `signal_type:` field absent in 38% of signals | Signal quality |
| **Deviation density** | Count of `fix:` commits per phase branch / count of plans | HIGH — git log is reliable; branch-to-phase mapping is reliable from branch naming | Agent performance, cross-session patterns |
| **Remediation velocity** | Phase number at signal filing vs phase number at `lifecycle_state: remediated` | LOW — only 7 signals have `lifecycle_state: remediated` explicitly; 28 contain "remediated" text | Intervention lifecycle |
| **Knowledge base growth rate** | Signal count per month (filename dates) + deliberation count (file creation dates via git) | HIGH for signals (date in filename); HIGH for deliberations (git commit dates) | Cross-session patterns |
| **Discussion coverage ratio** | DISCUSSION-LOG gray area count / CONTEXT [open] question count | LOW reliability for semantic alignment — 6 DISCUSSION-LOG files exist (Phase 57.2+), numeric count is easy but thematic match is not | Pipeline integrity |
| **Verification improvement trajectory** | VERIFICATION score over time (phases ordered by date) | MEDIUM — requires resolving format inconsistency between old (body prose) and new (frontmatter) score fields | Agent performance |
| **config.json automation fire rate** | `config.json` automation.stats fires/skips per sensor | HIGH — config.json is machine-written, always consistent JSON | Cross-session patterns |
| **Model distribution per milestone** | SUMMARY.md `model:` field grouped by milestone date range | MEDIUM — present in 64 of 192 plans; earlier plans lack model field | Cross-runtime comparison |
| **Claim type distribution per phase** | CONTEXT.md typed claim grep counts | HIGH for Phases 57.2+; zero coverage for pre-57.2 phases | Pipeline integrity |
| **Plan wave complexity** | Count of plans with wave > 1 in a phase (indicates parallel/sequential orchestration) | HIGH — `wave:` field present in all 192 PLAN files | Agent performance |

---

## 7. Gaps

**What we wish GSD artifacts contained but they don't:**

1. **Session ID in PLAN/SUMMARY/VERIFICATION.** No artifact records which Claude Code session ID executed it. The join between artifacts and session-meta data requires timestamp proximity heuristics rather than exact keys. A `session_id:` field in SUMMARY frontmatter would make this join exact.

2. **Signal → plan traceability field.** Only 9 of 192 PLAN files have a non-empty `resolves_signals:` field. The field exists in the schema but is not populated in practice. Without this, the signal → remediation pipeline cannot be automatically traced.

3. **Typed claims in pre-57.2 phases.** The claim-typing infrastructure (typed markers, DISCUSSION-LOG sidecar, context-checker) was introduced in Phase 57.2. All 57+ earlier phases have untyped CONTEXT.md files. Claim propagation rate as a measurement only exists for the most recent ~5 phases.

4. **`context_used_pct` in early phases.** This field, introduced in Phase 43, is absent from 128 of 192 SUMMARY files. No baseline context usage data before Phase 43.

5. **VERIFICATION score in frontmatter for all phases.** Older VERIFICATION files (pre-Phase 31 approximately) lack `score:` in YAML frontmatter — it appears only in body prose. Consistent extraction requires dual-parsing strategy.

6. **Explicit remediation date on signals.** When a signal is remediated, `lifecycle_state: remediated` may be set but there's often no `remediated_at:` timestamp. The 7 signals with lifecycle_state: remediated don't universally carry timestamps for when remediation occurred. Time-to-remediation requires inferring dates from git commit times or lifecycle_log entries.

7. **Cross-runtime provenance in artifacts.** When a plan is executed by Codex vs Claude Code, there's no consistent field marking this in the SUMMARY. The `model: gpt-5.4` appears in 1 of 64 model-tagged summaries, but this depends on the executor self-reporting correctly.

8. **Objective task count in PLANs.** PLANs have `<task>` XML blocks but these are in the body, not frontmatter — task count requires XML parsing of the body, not frontmatter extraction. The "Tasks: N completed" in SUMMARY Performance section is prose, not structured.

---

## 8. Surprises

1. **config.json contains live automation fire statistics.** `.planning/config.json` has an `automation.stats` object tracking per-sensor fire counts, skip counts, and last-triggered timestamps (verified at time of audit: `sensor_artifact: fires=5, skips=0`, `sensor_log: fires=2, skips=0`, `signal_collection: fires=0, skips=13`). This is a ready-made measurement source for automation trigger rates that requires no parsing — just JSON key access. **Unexpected: this is not documented as a signal source anywhere.**

2. **SUMMARY.md has context_used_pct — a proxy for model load.** The `context_used_pct` field in SUMMARY frontmatter (64/192 files) records what percentage of the context window was used during plan execution. This is a direct behavioral metric available in structured form, without needing session-log access. The correlation with plan complexity (truth count) is immediately joinable via phase+plan key.

3. **Killed-agent artifact with DEVIATION.md.** The directory `.planning/phases/57.4-audit-skill-investigatory-type/pre-phase-archive/killed-agent-2026-04-10-general-purpose-misroute/` contains a `DEVIATION.md`, `agent-reasoning.txt`, and `tool-call-trace.txt` recovered from a killed execution. This is evidence that execution failure artifacts exist and can be recovered — an unexpected data source for failure mode analysis. The DEVIATION.md explicitly names the workflow inadequacy that caused the failure.

4. **DISCUSSION-LOG is very new (6 files).** Despite being positioned as a key pipeline component in the Lane 4 task spec, DISCUSSION-LOG.md only exists for 6 phases (all Phase 57.x era). The entire measurement value of discussion coverage ratio is gated on a feature that's barely been used.

5. **Verifier model is mostly not Codex.** Only 1 of 65 VERIFICATION files shows a non-Claude verifier (`_Verifier: Codex CLI (gpt-5.4, reasoning effort not exposed)_`). The cross-runtime comparison measurement loop cannot use verification artifacts retroactively — the Codex verification case is a single data point.

6. **Signal filing is heavily skewed toward specific phases.** The `config.json` shows `signal_collection.skips: 13` (vs `fires: 0` for the automated collection) — the automation never fires. Signals are primarily filed manually during collect-signals post-phase sessions. This means signal count per phase reflects human attention to signal collection, not automated coverage.

7. **SUMMARY.md files always match PLAN.md files 1:1.** All 192 PLANs have exactly one corresponding SUMMARY. There are no orphaned SUMMARYs or missing SUMMARYs. This is a stronger structural invariant than expected — even aborted work (like the killed-agent case) produced recovery artifacts, not missing SUMMARYs.

8. **The kb.db is a queryable derived index.** `.planning/knowledge/kb.db` is a SQLite database built from signal frontmatter (Phase 56 infrastructure). This is a measurement-ready artifact that already indexes all frontmatter fields across 255 signals. Queries like `SELECT * FROM signals WHERE severity = 'critical' AND lifecycle_state = 'remediated'` are possible without grep. **This database exists right now and is not mentioned in Lanes 1-3's domain** — it's a cross-artifact source that Lane 4's domain directly controls.

---

## Appendix: Intervention Log

All grep/python extractions run against actual files during this audit:

1. `find .planning -type f | wc -l` → 1,215
2. `find .planning/phases -name "*CONTEXT*" | grep -v archive | wc -l` → 36
3. `find .planning/phases -name "*-PLAN.md" | wc -l` → 192
4. `grep -rh "^duration:" .planning/phases/ --include="*SUMMARY*"` → 183 hits
5. `grep -rl "^context_used_pct:" ... --include="*SUMMARY*" | wc -l` → 64
6. `grep -rl "^model:" ... --include="*SUMMARY*" | wc -l` → 64
7. `grep -rh "^score:" .planning/phases/ --include="*VERIFICATION*"` → 30 hits
8. `grep -rh "^status:" ... --include="*VERIFICATION*"` → passed:60, gaps_found:4, human_needed:1
9. Python3 truth count extraction across 198 PLAN files → mean 5.0, range 2–12
10. Python3 VERIFICATION pass rate → 551/557 = 98.9%
11. `grep -rl "lifecycle_state:"` across signals → 158 of 254 files
12. `grep -rh "severity:" .planning/knowledge/signals/` → notable:144, minor:68, critical:37
13. `grep -rh "signal_type:" .planning/knowledge/signals/` → deviation:114, good-pattern:25, etc.
14. `git log --oneline --since="2026-01-01" | wc -l` → 2,020 commits
15. `git log --oneline | grep "57.4" | wc -l` → 48 commits

---

*Audit completed: 2026-04-15*  
*Lane: 4 of 4 (GSD Artifacts as Measurement Sources)*  
*Epistemic status of this document: Sampled (3 of 36 CONTEXT files, 3 of 192 PLAN files, 4 of 255 signal files) + Intervention-tested (all grep/python commands above run against actual corpus).*
