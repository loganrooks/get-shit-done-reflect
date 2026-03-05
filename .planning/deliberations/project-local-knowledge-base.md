# Deliberation: Project-Local Knowledge Base

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-04
**Status:** Concluded
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

## Decision Record

**Decision:** Project-local KB at `.planning/knowledge/` as primary, with `~/.gsd/knowledge/` as fallback for environments where project-local doesn't exist.
**Decided:** 2026-03-04
**Implemented via:** Phase 38.1 (to be planned)
**Signals addressed:** sig-2026-02-11-local-install-global-kb-model (partially — resolves the local-install-global-KB tension by making KB project-local)
