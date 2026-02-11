# Knowledge Base Comparison: File-Based KB vs MCP-Based GSD Memory

**Date:** 2026-02-11
**Context:** v1.13.0 release -- comparing the fork's file-based knowledge base (shipped in v1.8.0) against upstream's MCP-based GSD Memory (added in v1.11.2, reverted in v1.11.3)

## 1. Overview

The GSD Reflect fork and upstream GSD have taken different approaches to the same problem: giving AI agents persistent memory across sessions. Both approaches aim to capture lessons from past executions and surface them during future planning.

**File-Based KB (gsd-reflect):** Introduced in v1.8.0, the fork stores signals, spikes, and lessons as Markdown files with YAML frontmatter in `~/.claude/gsd-knowledge/`. A 167-line shell script (`kb-rebuild-index.sh`) regenerates a flat index that agents query via grep. The system has been running in production since v1.8.0 and was exercised extensively during the v1.13 milestone.

**MCP-Based GSD Memory (upstream):** Added in upstream v1.11.2 (commit `af7a057`), this approach used an MCP server with TypeScript and QMD search to store and retrieve agent memories. It was reverted in v1.11.3 (commit `cc3c6ac`) before accumulating real production usage.

This document compares both approaches using actual production data from the v1.13 milestone, not theoretical analysis.

## 2. Comparison Table

| Dimension | File-Based KB (gsd-reflect) | MCP-Based GSD Memory (upstream) |
|-----------|----------------------------|----------------------------------|
| **Persistence model** | Markdown files with YAML frontmatter in `~/.claude/gsd-knowledge/`. Signals, spikes, and lessons are separate files organized by project and category. | MCP server with TypeScript implementation and QMD (query-markdown) search library for semantic retrieval. |
| **Portability** | Files travel with user's home directory. Work across machines via dotfile sync (rsync, chezmoi, bare git repo). No server process needed. | Requires MCP server running on each machine. Server configuration is machine-specific. Sync requires replicating both data and server setup. |
| **Tooling requirements** | One 167-line shell script (`kb-rebuild-index.sh`) with no dependencies beyond bash and standard Unix tools (grep, sed, awk). | MCP server process, Node.js runtime, TypeScript build step, QMD search library. Multiple moving parts. |
| **Context window impact** | Lazy-load: agents read the index (~37 lines currently) and on-demand read specific entries only when relevant. Knowledge surfacing is gated to deviation handling, keeping baseline cost near zero. | Each MCP tool call consumes context window space for the tool definition, request, and response. Frequent queries compound this cost. |
| **Actual utility this milestone** | 13 signals collected across 6 phases, 3 lessons distilled. Patterns detected: conflict prediction calibration, planning scope flexibility, fork test isolation. Index consulted during Phase 12 research and planning. | Upstream reverted before real production usage. No signals collected, no lessons generated, no production data exists. |
| **Failure modes** | Missing rebuild script (documented in `sig-2026-02-10-missing-kb-rebuild-index-script` -- script was missing from initial release, later created). Namespace confusion between projects possible but manageable. Index can go stale if rebuild is not run after writes. | "Writes but doesn't query" -- the stated reason for upstream reversion. Setup friction: users need to configure MCP server before the system works. Server process can crash or fail to start silently. |
| **Maintenance burden** | One 167-line shell script with no external dependencies. Atomic write via temp file + rename. Updates with the npm package. | MCP server requires Node.js dependency management, TypeScript compilation, process lifecycle management. Server bugs require debugging a separate service. |

## 3. Production Data from This Milestone

### Signal Collection

During the v1.13 milestone (Phases 8-11), the file-based KB collected:

- **13 signal files** in `~/.claude/gsd-knowledge/signals/get-shit-done-reflect/` (11 from Phases 8-11 + 2 cross-project from prostagma)
- **4 automated signals** detected from plan/summary artifact comparison (deviations and struggles)
- **7 manual signals** capturing strategic insights about merge strategy, architecture adoption, and testing patterns
- **2 cross-project signals** from the prostagma project (missing kb-rebuild-index script, onboarding config gaps)

### Lesson Generation

Reflection analysis distilled 3 lessons from the 13 signals:

1. **les-2026-02-11-upstream-sync-strategy** (global, workflow): Use traditional merge for large fork sync, predict conflicts by region not file. Evidence: 4 signals.
2. **les-2026-02-11-planning-scope-flexibility** (project, workflow): Sequential plans create scope reduction cascades; plan by decision boundaries. Evidence: 2 signals.
3. **les-2026-02-11-fork-test-isolation** (project, testing): Use isolated temp directories for config testing; verify artifact existence before referencing. Evidence: 2 signals.

### Pattern Detection Results

Three qualifying patterns were detected using severity-weighted thresholds:

| Pattern | Signal Type | Signals | Shared Tags | Actionability |
|---------|------------|---------|-------------|---------------|
| Conflict prediction calibration | deviation | 2 | upstream-sync, merge, conflict-prediction, risk-assessment | Directly actionable: calibrate region-level predictions for v1.14+ sync |
| Planning scope shifts | deviation | 2 | planning, scope-change, merge | Actionable: group by resolution pattern in multi-plan phases |
| Fork test isolation | deviation | 2 | testing, fork-maintenance | Actionable: use temp directories for all config-modifying tests |

### Where KB Was Consulted

- **Phase 12 research:** The researcher read the KB index to identify existing signals and assess coverage gaps. The `sig-2026-02-10-missing-kb-rebuild-index-script` signal directly informed Pitfall 4 (kb-rebuild-index.sh path confusion) in the research output.
- **Phase 12 planning:** The planner used signal tag clusters (merge:6, fork-maintenance:6, upstream-sync:4) to assess pattern detection viability and set the 10-15 signal target.
- **Deviation handling:** Knowledge surfacing is gated to auto-fix scenarios (Rules 1-3). During Phases 8-11 execution, KB was not yet populated with project signals, so no deviation-gated queries occurred. This is expected for a first milestone.

### Where KB Was NOT Consulted (Missed Opportunities)

- **Phase 7 fork strategy planning** could have benefited from KB entries about merge vs rebase from prior projects, but no such entries existed yet.
- **Phase 9 architecture audit** made decisions about gsd-tools.js modification that later became a lesson -- had the lesson existed earlier, it would have accelerated the decision.
- **Cross-phase planning** could have used signal severity trends to prioritize phase ordering, but the KB was empty at project start.

These missed opportunities are inherent to a first milestone: the KB starts empty and accumulates value over time. The second sync (v1.14+) will have these lessons available from the start.

## 4. Analysis of Upstream Reversion

Upstream added MCP Memory in v1.11.2 (commit `af7a057`) and reverted it in v1.11.3 (commit `cc3c6ac`). The stated reasons:

1. **"Writes but doesn't query"**: The system stored memories but agents did not reliably retrieve them during planning. This is the write-read asymmetry problem -- writes are triggered automatically but reads require the agent to know when and what to query.

2. **Setup friction**: Users needed to configure an MCP server before the memory system functioned. This created a boot problem: the feature that should "just work" required manual setup steps that many users never completed.

### Why File-Based Avoids These Failure Modes

**Write-read asymmetry:** The file-based KB uses grep on a flat Markdown index. Reads are the simplest possible operation -- no query engine, no semantic search, no server. The knowledge surfacing rules explicitly define *when* to read (during deviation handling) and *what* to search for (error keywords, technology names). The index file is ~37 lines currently, cheap enough to scan in full.

**Setup friction:** Files in `~/.claude/gsd-knowledge/` require no setup beyond running the first signal collection command. No server to start, no TypeScript to compile, no MCP configuration to maintain. The kb-rebuild-index.sh script runs as part of existing workflows. The initial missing-script issue (sig-2026-02-10-missing-kb-rebuild-index-script) has been resolved.

### What MCP Could Have Offered

The MCP approach, if it had worked, would have provided advantages the file-based system lacks:

- **Semantic search**: Finding related entries based on meaning rather than keyword matching
- **Structured queries**: "Find all lessons about authentication in Python projects" rather than grep patterns
- **Real-time indexing**: No manual rebuild step needed
- **Rich data types**: Beyond Markdown/YAML, potential for structured data, embeddings, metadata

These advantages are real. The question is whether they justify the operational complexity that caused the reversion.

## 5. Honest Assessment of File-Based Limitations

### No Semantic Search

The file-based KB uses keyword matching via grep. Searching for "authentication" will not find entries tagged "auth" or "login" unless those exact terms appear. This limits discovery of tangentially related lessons.

**Impact during v1.13:** Minimal. With 18 total entries, full index scan is feasible. This limitation will compound as the KB grows.

### Manual Index Rebuilding

The index must be regenerated by running `kb-rebuild-index.sh` after any write. If an agent writes a signal but fails to rebuild, the index goes stale and subsequent queries miss the new entry.

**Impact during v1.13:** The missing-script signal (sig-2026-02-10-missing-kb-rebuild-index-script) documented exactly this problem. The script was initially missing from the package, causing 1300+ tokens of wasted context when an agent tried to rebuild. Now resolved, but the manual trigger remains a fragility point.

### No Cross-Machine Sync

Signal and lesson files live in `~/.claude/gsd-knowledge/`. There is no built-in sync mechanism. Users who work across machines must manage this via dotfile sync tools (chezmoi, yadm, bare git repos). Most developers already have dotfile management, but it is an additional requirement.

**Impact during v1.13:** None. Single-machine development. Would matter for team or multi-machine workflows.

### Rule-Based Signal Detection

Automated signal collection uses heuristic rules (plan vs summary comparison, deviation detection). It may miss nuanced patterns that require understanding of intent rather than structural comparison.

**Impact during v1.13:** 4 of 11 signals were automated. The remaining 7 were manual strategic observations that no heuristic could have detected (e.g., "traditional merge is superior for large divergences"). This 36% automation rate suggests the heuristics capture mechanical patterns but strategic insights require human (or agent) judgment.

### Unclear Scale Performance

With 18 entries, the system is fast and manageable. Performance characteristics at 100, 1000, or 10000 entries are unknown:
- Index file could grow to thousands of lines
- grep searches would slow linearly
- Category directories could become unwieldy
- The flat index model may need partitioning

**Impact during v1.13:** None. This is a future concern that should be monitored.

## 6. Conclusion

The file-based KB and the MCP-based GSD Memory represent different points on the complexity-capability tradeoff curve.

The file-based approach prioritizes operational simplicity: no dependencies, no server, no build step. It works because the core operations (write a file, grep an index) are among the most reliable operations in computing. During the v1.13 milestone, it successfully collected 13 signals, distilled 3 actionable lessons, and informed planning decisions -- modest but real utility.

The MCP approach prioritized capability: semantic search, structured queries, real-time indexing. These capabilities could have provided better knowledge discovery at scale. However, the operational complexity (MCP server, TypeScript build, process management) created failure modes that prevented the system from reaching production usage.

Neither approach is categorically superior. The file-based KB is appropriate for small-to-medium knowledge bases (sub-1000 entries) in single-developer or small-team contexts where operational simplicity matters. The MCP approach could be appropriate for larger knowledge bases where semantic search becomes necessary -- but only after resolving the write-read asymmetry and setup friction that caused the reversion.

The v1.13 data point is a single milestone. The file-based KB's value proposition strengthens with accumulated entries across milestones. Whether it scales to production-level usage (hundreds or thousands of entries) remains an open question that future milestones will answer.

---

*Comparison document for Phase 12: Release & Dogfooding*
*Data from: v1.13 milestone (Phases 7-12)*
*Generated: 2026-02-11*
