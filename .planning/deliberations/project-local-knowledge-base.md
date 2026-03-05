# Deliberation: Project-Local Knowledge Base

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-04 (initial), 2026-03-05 (revised)
**Status:** Concluded (revised)
**Trigger:** Need to run GSD execute-phase on remote Claude Code servers (close laptop, resume later). The KB at `~/.gsd/knowledge/` doesn't exist in remote environments, blocking remote execution.
**Affects:** All phases (KB is read/written by most agents), Phase 38.1 (implementation), Phase 41 (health check improvements)
**Related:**
- `sig-2026-02-11-local-install-global-kb-model` — early signal about local install vs global KB tension
- `sig-2026-02-11-kb-script-wrong-location-and-path` — KB path resolution issues
- `sig-2026-02-11-kb-data-loss-migration-gap` — KB migration fragility
- `les-2026-02-16-dynamic-path-resolution-for-install-context` — path resolution must account for install context
- Prior deliberation: none directly on KB location

## Situation

The knowledge base lives at `~/.gsd/knowledge/` (user-global, outside version control). This creates a hard dependency on the local filesystem that breaks in several scenarios:

1. **Remote execution** — running GSD on Claude Code's servers means a fresh environment with no `~/.gsd/knowledge/`. Agents that read KB for lessons get nothing; signal collection after execution writes to a KB that gets discarded when the container shuts down.
2. **Multi-machine development** — switching machines loses all accumulated knowledge.
3. **Knowledge auditability** — KB evolution is invisible (no git history), unlike every other project artifact.
4. **Cross-project learning** — theoretically supported but unused in practice. All 101 signals and 7 lessons belong to one project.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `grep -r '~/.gsd/knowledge' agents/ get-shit-done/` | 19 source files reference `~/.gsd/knowledge/` | Yes (grep verified) | informal |
| `grep '\.gsd/knowledge' get-shit-done/bin/gsd-tools.js` | gsd-tools.js has ZERO KB references — all KB ops are agent-instruction-driven | Yes (grep returned 0 matches) | informal |
| `du -sh ~/.gsd/knowledge/` | KB is 524K total (101 signals, 7 lessons, 1 spike) — trivially fits in VCS | Yes (du verified) | informal |
| KB index.md | All entries belong to single project `get-shit-done-reflect` | Yes (read index) | informal |
| `bin/install.js` replacePathsInContent() | Installer has specific two-pass KB path conversion logic | Yes (read code) | informal |
| 5 test files | Tests validate KB lives at `~/.gsd/knowledge/` with dozens of assertions | Yes (grep verified) | informal |
| `kb-rebuild-index.sh` | Script hardcodes `~/.gsd/knowledge/` path | Yes (grep verified) | informal |

## Framing

**Core question:** Should the KB primary location move from `~/.gsd/knowledge/` (user-global) to `.planning/knowledge/` (project-local, version-controlled), with the user KB becoming an optional federation/sync layer?

**Adjacent questions:**
- How do agents resolve KB paths when both locations exist?
- What sync semantics (push/pull) enable cross-project learning from project-local primary?
- Should the KB eventually be its own git repository for cross-machine/cross-team sharing?
- Can the KB become an MCP server with semantic tooling, access control, and retrieval capabilities?

## Analysis

### Option A: Project-Local Primary with User-Global Fallback

- **Claim:** Make `.planning/knowledge/` the primary KB location. Agents read/write there. When it doesn't exist (npm user without `gsd:new-project`), fall back to `~/.gsd/knowledge/`.
- **Grounds:** KB is 524K single-project data that logically belongs with project artifacts. 19 files need path changes but gsd-tools.js needs zero changes. Fallback preserves npm user compatibility.
- **Warrant:** Knowledge IS a project artifact — signals reference specific phases, commits, files. Version-controlling it alongside code makes knowledge evolution auditable and enables remote execution.
- **Rebuttal:** Breaks cross-project learning by default (each project has isolated KB). Requires test updates (5 files). Installer logic needs adjustment. Fork divergence from upstream.
- **Qualifier:** Probably the right approach. Cross-project limitation is mitigated by manual sync and the reality that cross-project learning is unused.

### Option B: Keep User-Global, Add Export/Import

- **Claim:** Keep `~/.gsd/knowledge/` as primary. Add `kb export` (copies to `.planning/knowledge/` for VCS) and `kb import` (merges back after remote execution).
- **Grounds:** Minimal code changes. No test breakage. No installer changes.
- **Warrant:** Preserves existing architecture. Export/import is explicit and controllable.
- **Rebuttal:** Requires manual ceremony before every remote execution. Easy to forget. Knowledge still isn't version-controlled by default — only when explicitly exported.
- **Qualifier:** Simpler but less valuable. Trades ongoing friction for lower implementation cost.

### Option C: Dual-Write (Both Locations)

- **Claim:** Agents write to both `.planning/knowledge/` and `~/.gsd/knowledge/` simultaneously.
- **Grounds:** No sync needed. Both always in sync.
- **Warrant:** Eliminates the sync problem entirely.
- **Rebuttal:** Doubles write operations. Agent specs become more complex. Inconsistency risk if one write succeeds and other fails. Over-engineered for current needs.
- **Qualifier:** Not recommended. Complexity outweighs benefit.

## Tensions

1. **Project isolation vs cross-project learning:** Project-local primary isolates knowledge by default. Cross-project value requires explicit sync. But cross-project learning is theoretical — no evidence it's been used.

2. **Simplicity vs universality:** The fallback pattern (project-local → user-global) adds conditional logic to agent specs. But it handles all deployment scenarios cleanly.

3. **Fork divergence:** Changing KB location is a meaningful fork divergence from upstream. But the fork already diverges significantly on KB infrastructure (Phases 1, 14, 19 were all fork-specific).

## Recommendation

**Decision:** Option A — Project-local primary with user-global fallback.

**Rationale:**
- Solves the immediate problem (remote execution) by default, not by ceremony
- Makes knowledge a first-class version-controlled artifact
- Preserves npm user compatibility via fallback
- Cross-project learning deferred to manual sync (adequate for current single-project reality)
- Future vision (MCP server, remote KB repo, team sharing) builds naturally on project-local primary

**Implementation scope:**
1. Agent specs (19 files): unified KB access pattern with fallback
2. Tests (5 files): update assertions for project-local primary
3. Installer: create `.planning/knowledge/` alongside `~/.gsd/knowledge/`
4. kb-rebuild-index: project-local capability
5. KB content copy: `~/.gsd/knowledge/` → `.planning/knowledge/`
6. Potentially: `gsd-tools.js kb` subcommand for path resolution

**Future vision (out of scope for Phase 38.1):**
- Manual `gsd kb push` / `gsd kb pull` for cross-project sync
- User KB (`~/.gsd/knowledge/`) as its own git repo for cross-machine access
- Remote KB repository for team sharing
- MCP server for KB with semantic retrieval, access control, and tooling

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | GSD execute-phase runs successfully on remote Claude Code without any KB-related ceremony | First remote execution attempt | Agent errors about missing KB paths, or signals written to wrong location |
| P2 | `git log .planning/knowledge/` shows knowledge evolution alongside code changes | After 2-3 phases with signal collection | Knowledge files not committed, or committed in bulk rather than alongside phase work |
| P3 | No npm user reports KB-related breakage after update | First npm release with this change | Bug reports about missing KB or broken signal collection |
| P4 | Agent specs become simpler (unified pattern) rather than more complex | Code review of Phase 38.1 PR | Fallback logic adds significant complexity to each agent spec |

## Revision: Lessons Deprecation and Signal Enrichment (2026-03-05)

The initial deliberation (2026-03-04) was conducted under time pressure. A second session re-examined foundational assumptions about KB structure, the role of lessons, and the cross-project vision.

### The Lesson Question

**Inquiry:** Are lessons serving a distinct purpose, or are they redundant with other artifacts?

**Evidence examined:**
- All 7 existing lessons read and categorized
- 2 of 7 are genuinely transferable wisdom; 3 are GSD-workflow-specific; 2 are this-project-specific
- Lesson #1 (path resolution) is already becoming stale — Phase 38.1 is the fix for the issue it describes
- No mechanism exists for lesson invalidation, expiry, or promotion
- The reflection report already contains all pattern analysis that lessons duplicate as individual files

**Analysis from multiple perspectives:**

1. **Lessons as compression:** Lessons compress 78 signals into 7 actionable items — a 9:1 ratio. Real value for context-limited agents. But the reflection report already does this clustering; lessons are excerpts saved as separate files.

2. **Lessons as redundant with authoritative locations:** Every lesson maps to a more natural home:
   - "Exhaustive KEEP lists" → executor agent spec constraint
   - "Runtime verification required" → verifier agent spec instruction
   - "Plans must verify before assuming" → planner agent spec checklist
   - "Context bloat" → agent protocol principle
   - "Plan checker gaps" → plan checker code changes
   - "Zero deviation = spec phases" → observation with no actionable home
   - "Dynamic path resolution" → already in CLAUDE.md
   If a lesson is important enough to exist, it's important enough to become a rule, spec update, or code change.

3. **Lessons as dead-end in pipeline:** Signals → reflection clusters → patterns emerge → lessons restate patterns as files → nothing. No promotion path to agent specs. No retirement mechanism. Lessons accumulate without triggering the changes they recommend.

4. **Lessons vs the cross-project use case:** When asked what cross-project knowledge they'd want, the user said "signals from other projects" — raw observations, not distilled principles. Signals are the communication primitive; lessons are not.

**Decision:** Deprecate the lessons layer. KB structure becomes: signals/ + reflections/ + spikes/. Actionable findings from reflections get promoted directly into agent specs, workflow docs, or code. The reflection report IS the analytical layer.

### Signal Enrichment for Cross-Project Readiness

**Inquiry:** What does a signal need to contain for cross-project use?

**User story:** Project X uses gsd-reflect, hits a problem, files a signal locally. They want to share it with gsd-reflect maintainers with enough context to reproduce. Meanwhile they patch locally; we fix globally and ship.

**This maps to open-source bug reporting with signals as the format.** Current signals lack environmental context to discriminate GSD bugs from environmental issues.

**Decision:** Enrich signal frontmatter with:
- `environment.os` — auto-populated from system
- `environment.node_version` — auto-populated
- `environment.config_profile` — from project config
- `source: local` — default; enables future `external` signals

Reserve (documented but not implemented):
- `upstream_ref` — link to shared version (GitHub issue)
- `upstream_status` — none|reported|acknowledged|fixed

### Revised Phase 38.1 Scope

The phase now includes three tiers:

**MUST — Location Migration:**
1. Create `.planning/knowledge/` with structure: signals/, reflections/, spikes/ (no lessons/)
2. Update 19 agent file KB path references
3. Update 5 test files (cover primary + fallback)
4. Installer creates `.planning/knowledge/` during gsd:new-project
5. Fallback: .planning/knowledge/ absent → ~/.gsd/knowledge/
6. Migrate existing signals, reflections, spikes from ~/.gsd/knowledge/
7. Leave ~/.gsd/knowledge/ in place as fallback

**SHOULD — Structural Clarity:**
8. No lessons/ in new structure (deprecation by omission)
9. Existing 7 lessons remain at ~/.gsd/knowledge/lessons/ as historical artifacts
10. Follow-up task: promote lesson content into agent specs/workflow docs
11. Update reflector spec: stop producing lesson files (reflection reports remain)

**COULD — Future-Proofing:**
12. Enrich signal frontmatter with environment fields
13. Add `source: local` field to signal schema
14. Document signal-sharing interface design (in deliberation, not code)

**WON'T:**
- /gsd:signal --share command
- Signal ingestion from external projects
- Patch-signal traceability
- Lesson content promotion (follow-up, not this phase)

### Revised Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | GSD execute-phase runs successfully on remote Claude Code without KB ceremony | First remote execution | Agent errors about missing KB paths |
| P2 | `git log .planning/knowledge/` shows knowledge evolution alongside code | After 2-3 phases | Knowledge files not committed |
| P3 | No npm user reports KB breakage after update | First npm release | Bug reports about missing KB |
| P4 | Agent specs become simpler (unified pattern) not more complex | Code review of PR | Fallback logic adds significant complexity |
| P5 | Removing lessons/ causes no observable degradation in planning quality | 3 phases after adoption | Planner makes mistakes that a lesson would have prevented |
| P6 | Signal environment fields enable cross-project bug discrimination | First external signal received | Environment context insufficient to reproduce |

## Decision Record

**Decision:** Project-local KB at `.planning/knowledge/` as primary, with `~/.gsd/knowledge/` as fallback. Lessons layer deprecated. Signal schema enriched for cross-project readiness.
**Decided:** 2026-03-04 (initial location decision), 2026-03-05 (structural revision)
**Implemented via:** Phase 38.1 (to be planned)
**Signals addressed:** sig-2026-02-11-local-install-global-kb-model (resolves local-install-global-KB tension by making KB project-local)
