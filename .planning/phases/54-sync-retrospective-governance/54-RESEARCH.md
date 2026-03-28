# Phase 54: Sync Retrospective & Governance - Research

**Researched:** 2026-03-28
**Domain:** Fork governance, upstream trajectory analysis, sync retrospective, infrastructure fixes
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Updates to the v1.17+ roadmap deliberation must add a revision/postscript section, not rewrite the original analysis -- deliberation-revision-lineage deliberation constrains this
- FORK-DIVERGENCES.md and FORK-STRATEGY.md are project planning docs (not deliberations), so they can be updated in-place
- INF-05 through INF-08 (upstream analysis, feature overlap, retrospective, signal cross-reference) must complete before INF-03, INF-04, INF-09 (governance deliverables) are written
- The governance docs are grounded in the analysis -- not the other way around

### Claude's Discretion
- Cache key format (hashed vs readable filename)
- FORK-DIVERGENCES table structure -- may need redesign for the modular layout
- Upstream analysis artifact format -- could be a standalone analysis document, a section in FORK-STRATEGY.md, or folded into CONTEXT.md appendices
- How to present the signal cross-reference -- table, narrative, or both
- Whether to include a formal "Upstream Sync Readiness Checklist" in FORK-STRATEGY.md
- Exact telemetry fix approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Summary

Phase 54 is primarily an analytical and governance phase, not a code-heavy implementation phase. The core work is examining upstream's trajectory (412 commits past v1.22.4 baseline, now at v1.30.0), mapping feature overlap between fork and upstream, retrospecting the 10-phase v1.18 sync experience, cross-referencing the fork's 139 signals against upstream's issue tracker, and producing governance artifacts grounded in that analysis. Two infrastructure fixes (CI cache scoping and progress telemetry) are also included.

Research reveals that upstream has evolved substantially since the drift ledger (v1.28.0): v1.29.0 added Windsurf runtime support and agent skill injection, while v1.30.0 introduced GSD SDK -- a headless CLI for autonomous project execution. Upstream's issue tracker shows a fast-growing user base generating ~30 issues in 6 days (March 22-28), dominated by cross-runtime bugs, verification quality concerns, and SDK breakage. The fork's design philosophy (epistemic self-improvement -- "the system never makes the same mistake twice") contrasts with upstream's trajectory toward breadth (more runtimes, SDK automation, multi-project workspaces). This philosophical divergence explains many feature gaps and should be the organizing principle for the overlap analysis.

The infrastructure fixes are well-scoped: the CI cache bug is a single file fix (line 11 of `gsd-ci-status.js`), with 4 confirmed consumers. The progress telemetry overstatement is a frontmatter staleness issue -- STATE.md YAML says 28/32 plans (91%) while live `roadmap analyze` correctly shows 32/32 (100%).

**Primary recommendation:** Structure the phase as analysis-first (INF-05/06/07/08), then governance-as-output (INF-03/04/09), with infrastructure fixes (INF-01/02) parallelizable against the analysis work.

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `gh` CLI | installed | GitHub API access for upstream issues/PRs/releases | Already used by CI hooks; provides structured JSON output |
| `gsd-tools.cjs` | v1.17.5 | Roadmap analysis, state queries, commit tooling | Project's own CLI -- authoritative for progress data |
| `git diff` | installed | Module-level divergence detection | Direct comparison against v1.22.4 baseline and upstream/main |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `git log upstream/main` | Commit-level trajectory analysis | INF-05 upstream analysis |
| `gh issue list / gh pr list` | Issue/PR theme analysis | INF-05 (what upstream responds to) |
| `.planning/knowledge/index.md` | Signal KB for cross-reference | INF-08 signal comparison |
| UPSTREAM-DRIFT-LEDGER.md | Prior classification baseline | INF-09 gap assessment |

### No Additional Libraries Needed
This phase produces Markdown analysis artifacts and two small JS fixes. No new npm dependencies.

## Architecture Patterns

### Phase 54 Artifact Structure
```
.planning/phases/54-sync-retrospective-governance/
  54-CONTEXT.md              # Already exists
  54-RESEARCH.md             # This file
  54-XX-PLAN.md              # Plans
  54-UPSTREAM-ANALYSIS.md    # INF-05: standalone analysis artifact
  54-FEATURE-OVERLAP.md      # INF-06: feature inventory with dispositions
  54-RETROSPECTIVE.md        # INF-07: v1.18 sync retrospective
  54-SIGNAL-CROSSREF.md      # INF-08: signal vs upstream issues
```

### Pattern 1: Analysis-Then-Governance Flow
**What:** Complete INF-05/06/07/08 analysis artifacts before writing INF-03/04/09 governance updates.
**When to use:** When governance documents should be grounded in evidence, not assumptions.
**Rationale:** CONTEXT.md explicitly locks this ordering. The analysis artifacts contain the findings; the governance docs generalize those findings into durable policy.

### Pattern 2: Standalone Analysis Artifacts (Recommended)
**What:** INF-05 through INF-08 each produce a standalone Markdown document in the phase directory.
**When to use:** For referenceable analysis that governance docs can cite.
**Why not fold into FORK-STRATEGY.md:** The analysis is phase-specific evidence; governance docs should cite it, not contain it. Keeps FORK-STRATEGY.md focused on policy.

### Pattern 3: Module-Level Divergence Tracking
**What:** FORK-DIVERGENCES.md redesigned around the 16-module `lib/*.cjs` structure instead of the pre-modularization monolith.
**When to use:** INF-03 -- the current FORK-DIVERGENCES.md is from 2026-02-10, before modularization.
**Structure:**
```markdown
## Module Divergence Matrix

| Module | Lines Diff | Fork Modifications | Merge Stance |
|--------|-----------|-------------------|--------------|
| core.cjs | 262 | parseIncludeFlag, loadManifest, loadProjectConfig, atomicWriteJson | hybrid |
| automation.cjs | 471 | FEATURE_CAPABILITY_MAP, fork-specific automation logic | keep-fork |
| health-probe.cjs | 650 | Entire module is fork-only | keep-fork |
| sensors.cjs | 154 | Fork-specific sensor implementations | keep-fork |
| milestone.cjs | 0 | Pure upstream | adopt-upstream |
| state.cjs | 0 | Pure upstream | adopt-upstream |
| template.cjs | 0 | Pure upstream | adopt-upstream |
| verify.cjs | 0 | Pure upstream | adopt-upstream |
```

### Pattern 4: Signal Cross-Reference Methodology
**What:** A structured comparison of the fork's signal KB themes against upstream's issue tracker themes.
**When to use:** INF-08 -- this is a first-of-its-kind analysis for this project.
**Methodology:**
1. Categorize fork signals by theme (already available: deviation=38, testing=13, config=12, plan-accuracy=10, CI=8, workflow-gap=4)
2. Categorize upstream issues by theme (from research: cross-runtime bugs, verification quality, SDK bugs, installer issues, worktree problems, agent quality, i18n)
3. Build a comparison matrix: themes both sides caught, themes only fork caught, themes only upstream caught
4. Analyze: do shared themes mean convergence? Do unique themes reveal blind spots or different priorities?

### Anti-Patterns to Avoid
- **Governance-first writing:** Do NOT update FORK-DIVERGENCES.md or FORK-STRATEGY.md before the analysis work (INF-05-08) is complete. CONTEXT.md locks this ordering.
- **Adoption advocacy:** The upstream analysis should be descriptive and evaluative. Describing what upstream built is NOT a recommendation to adopt it.
- **Monolith-era divergence tracking:** Do NOT update FORK-DIVERGENCES.md as if the runtime is still one file. The modular structure demands module-level granularity.
- **Rewriting the deliberation:** The v1.17+ roadmap deliberation update must be append-only (dated revision section). This is a locked constraint from the deliberation-revision-lineage deliberation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upstream commit classification | Manual commit-by-commit review of 412 commits | `gh` API + release notes for cluster-level analysis | The drift ledger already classified through v1.28.0 (372 commits); only ~40 post-ledger commits need fresh classification |
| Module divergence detection | Manual file comparison | `git diff v1.22.4 -- get-shit-done/bin/lib/` per module | Git's diff is authoritative; research already ran this and produced the diff-lines table |
| Progress calculation | Custom PLAN/SUMMARY counting | `gsd-tools.cjs roadmap analyze` | Already implements disk-based counting; the live output is the ground truth |
| Signal theme categorization | Reading all 139 signal files | `index.md` tag aggregation | Tags are already assigned; aggregate by tag, don't re-read raw signals |
| Cache key generation | Custom hashing scheme | `${repoName}--${branch}` readable format in filename | Hashing obscures debugging; readable filenames make cache inspection trivial |

**Key insight:** This phase is analysis and documentation, not software engineering. The "don't hand-roll" principle here means: use existing data sources (drift ledger, signal KB, gh API, git diff), don't re-derive from scratch.

## Common Pitfalls

### Pitfall 1: Stale FORK-DIVERGENCES.md as Truth
**What goes wrong:** Trusting the current FORK-DIVERGENCES.md (last updated 2026-02-10) as accurate for the post-modularization codebase.
**Why it happens:** The file exists and looks authoritative. But it describes the pre-modularization monolith.
**How to avoid:** Derive actual divergence state from current code (`git diff` per module). The FORK-DIVERGENCES.md rewrite should be based on current reality, not the stale document.
**Warning signs:** References to "gsd-tools.js" (the old monolith filename -- it is now gsd-tools.cjs with 16 lib modules).

### Pitfall 2: Drift Ledger Assumed Complete
**What goes wrong:** Treating UPSTREAM-DRIFT-LEDGER.md as covering all upstream changes. It covers through v1.28.0 (372 commits). Upstream is now at v1.30.0 with 412 commits past baseline -- 40 commits unclassified.
**Why it happens:** The ledger is comprehensive and well-structured, making it easy to forget its explicit scope boundary.
**How to avoid:** INF-09 must extend the ledger's coverage to v1.30.0. Use the same C1-C11 cluster framework where applicable, add new clusters for SDK/headless features.
**Warning signs:** Any analysis that stops at v1.28.0 or references only C1-C11 without addressing v1.29.0/v1.30.0.

### Pitfall 3: Progress Telemetry "Fix" That Masks the Root Cause
**What goes wrong:** Patching STATE.md values without understanding the mechanism.
**Why it happens:** The overstatement is visible (91% vs 100%), but the root cause is structural: `buildStateFrontmatter()` in state.cjs reads from disk at write-time, and `cmdStateUpdateProgress()` uses the same disk-based counting as `roadmap analyze`. The STATE.md frontmatter is stale because it was last synced when the last `writeStateMd()` call ran -- but if no state field was updated since Phase 53, the frontmatter reflects that snapshot.
**How to avoid:** Understand that the YAML frontmatter is synced on every `writeStateMd()` call, and `buildStateFrontmatter()` already computes from disk. The fix is to ensure `cmdStateUpdateProgress()` is called when it should be (possibly by the executor at phase completion), not to change the computation.
**Warning signs:** A fix that re-implements disk counting instead of ensuring the existing mechanism runs at the right time.

### Pitfall 4: CI Cache Consumer Breakage
**What goes wrong:** Changing the cache file path without updating all 4 consumers.
**Why it happens:** The hook and statusline are the obvious consumers, but the health-check hook and the dist/ copies are easy to miss.
**How to avoid:** The consumer map (identified in research):
1. `hooks/gsd-ci-status.js` -- **WRITER** (line 11: defines cache path)
2. `hooks/gsd-statusline.js` -- READER (line 108: reads `gsd-ci-status.json`)
3. `hooks/gsd-health-check.js` -- does NOT read CI cache (reads `gsd-health-score.json` separately)
4. `hooks/dist/gsd-ci-status.js` -- WRITER (built copy)
5. `hooks/dist/gsd-statusline.js` -- READER (built copy)
6. `hooks/dist/gsd-health-check.js` -- does NOT read CI cache
7. `bin/install.js` -- registers hook paths but does not read cache contents
**Warning signs:** Forgetting to rebuild hooks (`npm run build:hooks`) after changing source files.

### Pitfall 5: Deliberation Rewrite Instead of Revision
**What goes wrong:** Editing the v1.17+ roadmap deliberation's original analysis sections.
**Why it happens:** It's natural to want to update the text to reflect current reality.
**How to avoid:** The deliberation-revision-lineage deliberation (concluded) establishes that revisions to deliberations must be append-only: add a dated `## Revision: [date]` section at the end. The original text is preserved for citation stability.
**Warning signs:** Git diff showing deletions in the original deliberation text (before the revision section).

## Code Examples

### INF-01: CI Cache Scoping Fix

The current bug is on line 11 of `hooks/gsd-ci-status.js`:
```javascript
// CURRENT (global, cross-project pollution)
const cacheFile = path.join(cacheDir, 'gsd-ci-status.json');

// FIX: scope by repo name and branch
// The repo name comes from the git remote or directory name
// The branch is already read later in the script
```

The fix needs to:
1. Derive a project identifier (repo name from `git remote` or `path.basename(cwd)`)
2. Include branch in the cache filename
3. Update the statusline reader to use the same scoped path

Recommended cache key format (readable, not hashed):
```javascript
// In the spawned child:
let repoName = 'unknown';
try {
  repoName = execSync('git remote get-url origin', { encoding: 'utf8', timeout: 5000 })
    .trim().split('/').pop().replace(/\.git$/, '');
} catch {
  try { repoName = require('path').basename(process.cwd()); } catch {}
}
const cacheFile = path.join(cacheDir, `gsd-ci-status--${repoName}--${branch}.json`);
```

The statusline reader must mirror this logic:
```javascript
// hooks/gsd-statusline.js line ~108
// Instead of hardcoded 'gsd-ci-status.json', derive the same scoped filename
```

### INF-02: Deliberation Revision Pattern

The v1.17+ roadmap deliberation update follows this structure:
```markdown
## Revision: 2026-03-28 (v1.18 Milestone Completion)

### Context
v1.18 "Upstream Sync & Deep Integration" is complete. This revision adds
the milestone as a completed theme and updates forward-looking analysis.

### What Changed
- [Summary of what v1.18 accomplished]
- [How it relates to the original deliberation's themes]

### Impact on Original Analysis
- [Which original themes were addressed]
- [Which remain open for future milestones]
```

### Progress Telemetry Investigation Result

Research found the concrete overstatement mechanism:

```
STATE.md frontmatter (snapshot):  completed_plans: 28, percent: 91
roadmap analyze (live):           total_summaries: 32, progress_percent: 100
```

Root cause: `buildStateFrontmatter()` in `state.cjs` (line 558-662) computes progress from disk on every `writeStateMd()` call. But `cmdStateUpdateProgress()` (line 273-314) -- the function that explicitly updates the Progress field in STATE.md body -- was not called after the last few plans completed. The YAML frontmatter remained at its last-written snapshot.

The body field `Progress: [####################] 91%` is also stale -- it was last set by `cmdStateUpdateProgress()` at some earlier point.

Fix approach: ensure `cmdStateUpdateProgress()` runs at the right lifecycle points. The executor's `advance-plan` flow calls `writeStateMd()` but does not call `cmdStateUpdateProgress()`. The progress bar in the body therefore drifts from reality as plans complete without an explicit progress update call.

## State of the Art

### Upstream Evolution Since v1.22.4 Baseline

| Version | Date | Key Features | Direction |
|---------|------|-------------|-----------|
| v1.23.0-v1.28.0 | 2026-03-10 to 2026-03-22 | Worktree isolation, workstreams, forensics, multi-runtime installer, security scanning, temp reaper | Infrastructure hardening, multi-project scale |
| v1.29.0 | 2026-03-25 | Windsurf runtime, agent skill injection, security CI, i18n (Korean, Portuguese, Japanese) | Runtime breadth, internationalization |
| v1.30.0 | 2026-03-27 | GSD SDK (headless CLI), `--sdk` installer flag, auto `--init`, prompt sanitizer | Autonomous execution, SDK/API surface |

### Upstream Design Philosophy (Derived from Evidence)

| Signal | What It Reveals |
|--------|----------------|
| 5 runtimes (Claude, Codex, Gemini, Windsurf, Copilot) | Breadth over depth -- maximize adoption surface |
| GSD SDK (headless CLI) | Moving toward automation/CI integration |
| Agent skill injection (#1355) | User extensibility without forking |
| Security scanning CI | Hardening for broader user base |
| i18n (4 languages) | Community-driven international growth |
| Workstream namespacing | Enterprise/multi-project scale |
| ~30 issues in 6 days (Mar 22-28) | Rapidly growing user base, strain on stability |
| Open PR backlog: 30+ PRs | High velocity, community contributions, maintenance pressure |

**Upstream philosophy summary:** Maximize adoption through runtime breadth, user-facing automation (SDK), and community accessibility (i18n). Quality and verification are addressed reactively (issues drive fixes) rather than proactively (no signal/reflection system).

### Fork Design Philosophy (Established)

| Core Value | Expression |
|-----------|-----------|
| "Never make the same mistake twice" | Signal -> Reflection -> Lesson -> KB pipeline |
| Epistemic self-improvement | Deliberations, health probes, verification depth standards |
| Process quality over feature breadth | 139 signals tracking process failures, not just code bugs |
| One runtime, deep integration | Claude Code focus; cross-runtime as converter, not native |

### Upstream Issue Tracker Themes (March 22-28, 2026)

| Theme | Count | Example Issues | Fork Equivalent |
|-------|-------|---------------|-----------------|
| Cross-runtime bugs | 8 | #1351, #1376, #1379, #1392, #1430 | Cross-runtime converters (QT22-28) |
| Verification quality | 4 | #1418, #1431, #1457, #1434 | Signal pipeline + health probes |
| SDK/headless bugs | 3 | #1424, #1433, #1435 | No equivalent |
| Worktree problems | 2 | #1451, #1334 | No equivalent (no worktree support) |
| Agent quality | 3 | #1388, #1453, #1441 | Agent protocol, plan checker |
| Installer issues | 3 | #1421, #1423, #1430 | Installer tests (Phase 50-51) |
| Feature requests | 7 | #1395, #1399, #1400, #1413, #1420, #1449, #1390 | N/A |

### Post-Drift-Ledger Changes (v1.29.0 + v1.30.0)

The drift ledger (2026-03-24) classified through v1.28.0. Since then, 40 additional commits shipped in two releases:

**v1.29.0 (2026-03-25):** ~21 commits
- Windsurf runtime (new runtime) -- extends C11 (broader feature additions)
- Agent skill injection via config (#1355) -- new capability, extends C11
- Security CI scanning -- extends C10 (security hardening)
- i18n (Korean, Portuguese) -- community contributions, new cluster
- Bug fixes: begin-phase field preservation, frontmatter indent, agent recognition, Codex config

**v1.30.0 (2026-03-27):** ~4 commits (plus post-release fix)
- GSD SDK -- headless CLI with `init` + `auto` commands -- **new capability, new cluster**
- `--sdk` installer flag, auto `--init`, prompt sanitizer
- Post-release fix: repo-local gsd-tools.cjs resolution (#1425)

**Recommended classification using drift ledger framework:**
- C12 (new): Windsurf runtime + agent skill injection -- `candidate-next-milestone`
- C13 (new): GSD SDK / headless automation -- `defer` (substantially different direction)
- C14 (new): i18n / community docs -- `defer` (internationalization not relevant to fork)
- C10 extension: Security CI additions -- remains `candidate-next-milestone`
- Bug fixes: Most are v1.29-v1.30-specific or cross-runtime-specific, low relevance to fork

### Health vs Health-Check Overlap (Worked Example)

| Aspect | Upstream `/gsd:health` | Fork `/gsd:health-check` |
|--------|----------------------|------------------------|
| **Scope** | `.planning/` directory integrity | Workspace state (KB, config, planning, stale artifacts) |
| **Mechanism** | Workflow-driven checks | Health probes (`health-probe.cjs`) + sensors + cached score |
| **Automation** | Manual invocation only | SessionStart hook trigger, reactive threshold, cache staleness |
| **Output** | Actionable issue report | Traffic light score (GREEN/YELLOW/RED) in statusline |
| **Repair** | `--repair` flag | `--fix` flag |
| **Philosophy** | "Is the project structure valid?" | "Is the project's epistemic health good?" |

**Analysis:** These are complementary, not conflicting. Upstream's health checks structural integrity (missing files, invalid config). The fork's health-check measures epistemic quality (signal density, automation watchdog, KB integrity). They address different levels of the same concern. The naming collision (`health` vs `health-check`) is confusing but not a merge conflict -- they are separate commands with separate workflows.

**Disposition:** Complementary. The fork should keep both: adopt upstream's structural checks, keep its own epistemic probes. Naming resolution needed if both ship.

## Module Divergence Inventory

Research measured diff lines for each `lib/*.cjs` module against the v1.22.4 baseline:

| Module | Diff Lines | Fork Content | Category |
|--------|-----------|-------------|----------|
| `health-probe.cjs` | 650 | Entire module is fork-only | Fork-only |
| `automation.cjs` | 471 | FEATURE_CAPABILITY_MAP, automation stats, fork-specific logic | Fork-heavy |
| `manifest.cjs` | 463 | Feature manifest loading, migration specs, self-test | Fork-heavy |
| `backlog.cjs` | 359 | Fork backlog management (signals, KB) | Fork-heavy |
| `core.cjs` | 262 | parseIncludeFlag, loadManifest, loadProjectConfig, atomicWriteJson, MODEL_PROFILES | Hybrid (fork additions to upstream base) |
| `init.cjs` | 253 | Fork-specific init overrides, --include flag | Hybrid |
| `commands.cjs` | 178 | Fork command routing additions | Hybrid |
| `sensors.cjs` | 154 | Fork-specific sensor implementations | Fork-only |
| `config.cjs` | 117 | Fork config handling additions | Hybrid |
| `frontmatter.cjs` | 110 | Signal schema validation, tiered validation | Hybrid |
| `phase.cjs` | 57 | Minor fork adjustments | Mostly upstream |
| `roadmap.cjs` | 42 | Minor fork adjustments | Mostly upstream |
| `milestone.cjs` | 0 | Pure upstream | Upstream-only |
| `state.cjs` | 0 | Pure upstream | Upstream-only |
| `template.cjs` | 0 | Pure upstream | Upstream-only |
| `verify.cjs` | 0 | Pure upstream | Upstream-only |

**Summary:** 5 fork-heavy modules, 6 hybrid modules, 4 pure upstream modules, 1 nearly-upstream module.

## CI Cache Consumer Map (Q5 Resolved)

Complete consumer/producer map for `gsd-ci-status.json`:

| File | Role | How It Uses Cache |
|------|------|------------------|
| `hooks/gsd-ci-status.js` | WRITER | Line 11: `path.join(cacheDir, 'gsd-ci-status.json')` -- writes CI status |
| `hooks/gsd-statusline.js` | READER | Line 108: reads `gsd-ci-status.json` for CI FAIL indicator |
| `hooks/dist/gsd-ci-status.js` | WRITER | Built copy of source hook |
| `hooks/dist/gsd-statusline.js` | READER | Built copy of source hook |
| `bin/install.js` | REGISTRAR | Registers hook paths in settings.json; does NOT read cache |
| `hooks/gsd-health-check.js` | NONE | Reads `gsd-health-score.json` separately, NOT CI cache |

**Fix scope:** Source files to change: `gsd-ci-status.js` (writer) and `gsd-statusline.js` (reader). Then run `npm run build:hooks` to regenerate `dist/` copies. No other consumers.

## Progress Telemetry Overstatement (Q6 Resolved)

**Concrete bug identified:**

| Source | total_plans | completed_plans | percent |
|--------|------------|----------------|---------|
| STATE.md frontmatter (stale) | 32 | 28 | 91% |
| STATE.md body (stale) | -- | -- | "91%" |
| `roadmap analyze` (live) | 32 | 32 | 100% |
| `buildStateFrontmatter()` (if re-run now) | 32 | 32 | 100% |

**Root cause chain:**
1. `writeStateMd()` calls `syncStateFrontmatter()` which calls `buildStateFrontmatter()` -- this recomputes from disk
2. `buildStateFrontmatter()` correctly counts PLAN/SUMMARY files from disk
3. But `writeStateMd()` only runs when some OTHER state field is updated (status, plan number, blocker, etc.)
4. The body's Progress field is updated by `cmdStateUpdateProgress()` which writes via `writeStateMd()` -- triggering a frontmatter resync
5. If neither the body Progress field NOR any other state field is updated, the frontmatter stales

**Why it happened now:** The last 4 plans (Phase 53 P01-P04) completed, but `cmdStateUpdateProgress()` was not called between the last state write and now. The executor's advance-plan flow updates Current Plan and Status but does not explicitly call `cmdStateUpdateProgress()`.

**Fix approach:** The executor or the phase-completion workflow should call `cmdStateUpdateProgress()` after the last plan completes. This is a workflow/lifecycle gap, not a computation bug.

**SC-2 notes:** STATE.md YAML and body are both stale. ROADMAP.md itself is correct (its analyze function reads live from disk). The overstatement is in STATE.md specifically.

## Retrospective Structure (Q8 Recommendation)

**Recommended: Standalone document at `54-RETROSPECTIVE.md`**

Structure:
```markdown
# v1.18 Sync Retrospective

## Scope
- 10 phases + 1 inserted phase (45-53 + 48.1)
- 32 plans, ~19 days (2026-03-10 to 2026-03-28)
- 139 signals captured across project lifetime

## What Worked
[Patterns that should be preserved]

## What Didn't
[Problems that need process changes]

## Sync-Round Issues Needing Future Attention
[Problems from this sync that should be addressed in future milestones]

## Signal History Analysis
[Cross-reference with INF-08 findings]

## Quantitative Summary
[Duration, plans, deviations, signal density per phase]

## Lessons for Next Sync
[Actionable policy recommendations flowing into INF-04]
```

**Why standalone:** The retrospective is a referenceable artifact that governance docs (INF-04 FORK-STRATEGY.md) should cite. Embedding it in FORK-STRATEGY.md would make the strategy doc too long and mix evidence with policy.

## Open Questions

### Resolved
- **Q5 (CI cache consumers):** 2 source files (writer + reader) + 2 dist copies. No other consumers. Fix is well-scoped.
- **Q6 (Progress overstatement):** Frontmatter staleness caused by `writeStateMd()` not being called after last plans completed. Not a computation bug.
- **Q7 (Module vs file-level tracking):** Module-level tracking is correct. 16 modules: 4 pure upstream, 5 fork-only/heavy, 6 hybrid, 1 mostly-upstream. Diff-lines table above provides the data.
- **Q8 (Retrospective structure):** Standalone document, structure above.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| How exactly should the signal cross-reference methodology work? | Medium | Define in plan: categorize both sides by theme, build comparison matrix. Novel analysis -- methodology should be documented in the plan, not assumed. |
| What should FORK-DIVERGENCES.md's module-level table look like? | Low | Use the module divergence inventory from this research as the starting point. Claude's discretion per CONTEXT.md. |
| Should the upstream analysis artifact cover ALL 412 commits or just the delta since the drift ledger? | Medium | Focus on delta (v1.29.0, v1.30.0 = ~40 commits) since the ledger already covers v1.22.4-v1.28.0. Cite the ledger for the earlier period. |

### Still Open
- The exact boundary between "behind" and "intentionally different" for each feature gap requires the INF-06 analysis to determine. Research provides the framework (design philosophy comparison) but the actual classification is execution work.
- Whether upstream's SDK direction represents a strategic fork in their evolution that fundamentally changes the sync relationship -- this is an analytical judgment that INF-05 must make.

## Sources

### Primary (HIGH confidence)
- `git diff v1.22.4 -- get-shit-done/bin/lib/` -- Module-level divergence data (ran locally)
- `git log upstream/main --oneline -50` -- Upstream commit history (local git)
- `gh issue list --repo gsd-build/get-shit-done --limit 50 --state all` -- Issue tracker themes (GitHub API, live)
- `gh pr list --repo gsd-build/get-shit-done --limit 30 --state all` -- PR patterns (GitHub API, live)
- `gh api repos/gsd-build/get-shit-done/releases` -- Release notes for v1.28.0, v1.29.0, v1.30.0 (GitHub API, live)
- `hooks/gsd-ci-status.js` source code -- Cache path and writer logic (read directly)
- `hooks/gsd-statusline.js` source code -- Cache reader logic (read directly)
- `get-shit-done/bin/lib/state.cjs` source code -- Progress computation logic (read directly)
- `get-shit-done/bin/lib/roadmap.cjs` source code -- Roadmap analysis logic (read directly)
- `gsd-tools.cjs roadmap analyze` output -- Live progress data (ran locally)
- `gsd-tools.cjs state json` output -- Stale frontmatter data (ran locally)
- `.planning/STATE.md` -- Current state file (read directly)
- `.planning/FORK-DIVERGENCES.md` -- Current divergence manifest (read directly, confirmed stale)
- `.planning/FORK-STRATEGY.md` -- Current sync policy (read directly)
- `UPSTREAM-DRIFT-LEDGER.md` -- Prior drift classification (read directly)

### Secondary (MEDIUM confidence)
- Upstream design philosophy -- inferred from commit patterns, issue themes, release notes, and repo description. Not explicitly stated by upstream.
- Post-drift-ledger classification (C12/C13/C14) -- applied Phase 48.1's framework to new commits. Reasonable extrapolation but not peer-reviewed.

## Metadata

**Confidence breakdown:**
- Infrastructure fixes (INF-01, progress telemetry): HIGH -- direct code inspection, consumer map verified, bug mechanism identified
- Upstream trajectory (INF-05): HIGH -- based on live GitHub data (issues, PRs, releases, commits)
- Feature overlap (INF-06 framework): HIGH -- module diff data is authoritative; philosophical framing is MEDIUM (interpretive)
- Retrospective structure (INF-07): MEDIUM -- structure is recommended based on project conventions; no prior precedent for sync retrospectives
- Signal cross-reference (INF-08): MEDIUM -- methodology proposed but novel; execution may reveal surprises
- Governance outputs (INF-03/04/09): HIGH -- inputs are well-understood; these are synthesis tasks

**Research date:** 2026-03-28
**Valid until:** 2026-04-15 (upstream moves fast; issue tracker data stales within days)

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), scanned all 139 signals and 1 spike entry.

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| Signal themes | signals | Aggregated tag distribution: deviation(38), testing(13), config(12), plan-accuracy(10), CI(8), workflow-gap(4) | Signal Cross-Reference methodology (INF-08) |
| sig-2026-03-28-squash-merge-destroys-commit-history | signal | Recent signal about squash merge traceability loss | Retrospective: sync-round issues needing future attention |
| sig-2026-03-28-eager-bypass-of-protocol-when-scope-needs-revision | signal | Scope revision protocol gap | Retrospective: workflow gaps surfaced during v1.18 |
| sig-2026-03-28-offer-next-skips-pr-workflow | signal | Phase transition skips PR workflow | Retrospective: workflow gaps surfaced during v1.18 |
| spk-2026-03-01-claude-code-session-log-location | spike | Claude Code session log location confirmed | Not directly relevant to Phase 54 domain |

No spike deduplication applicable -- Phase 54's research questions are analytical, not technology-selection questions.
