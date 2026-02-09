# Project Research Summary

**Project:** GSD Self-Improving Extensions (Signals, Spikes, Knowledge Base)
**Domain:** Self-improving AI development tooling
**Researched:** 2026-02-02
**Confidence:** HIGH

## Executive Summary

This project extends the Get-Shit-Done (GSD) AI workflow orchestrator with self-improvement capabilities through signal tracking, structured experimentation, and persistent knowledge management. The approach is grounded in zero-dependency, file-based storage using Node.js built-ins exclusively, maintaining compatibility with GSD's upstream fork strategy.

The recommended architecture uses JSONL for append-only structured event logging, Markdown with YAML frontmatter for human/AI-readable content (experiments, lessons, summaries), and a passive file-based knowledge store at `~/.claude/gsd-knowledge/`. This leverages established patterns from static site generators, observability systems, and knowledge management platforms while respecting the zero-dependency constraint. The critical path is: Signal Capture → Signal Persistence → Knowledge Base Storage → Knowledge Surfacing during research phases.

The primary risk is context window poisoning — injecting signals and knowledge into agent contexts degrades reasoning quality through documented "context rot" effects. Mitigation requires pull-based (lazy) retrieval with strict token budgets, aggressive summarization, and treating context as a zero-sum resource. Secondary risks include knowledge base staleness (the "graveyard" anti-pattern) and fork drift from upstream GSD. Both are addressable through structural design choices: expiry/decay mechanisms for knowledge entries and strict file ownership conventions for fork maintenance.

## Key Findings

### Recommended Stack

GSD's zero-dependency constraint (Node.js built-ins only, no SQLite, no external services) narrows the technology choices decisively. Research validates that file-based patterns with JSONL for structured data and Markdown for human/AI content cover all requirements without dependencies.

**Core technologies:**
- **JSONL files** (via `fs.appendFileSync`): Append-only structured event logging for signals and experiment raw data — corruption-resistant (bad line doesn't break file), streamable, zero parsing of existing content, industry standard for structured logging (Pino, Bunyan, fluentd all use JSONL)
- **Markdown + YAML frontmatter**: Experiment definitions, decision records, and knowledge entries — AI runtimes consume Markdown natively, frontmatter provides structured metadata for programmatic access, prose body enables rich context (same pattern as Hugo, Astro, Obsidian, mdbase-spec)
- **Tag-based indexing via frontmatter**: Cross-project discovery through grep-able tags (`grep -r "tags:.*node" kb/`) — zero-dependency search, multi-valued categorization, sufficient at expected scale (tens to low hundreds of entries)
- **Generated index files**: Disposable Markdown/JSON manifests with entry summaries — avoids agents scanning every file, reduces context window pressure, regenerated on demand

**What NOT to use (and why):**
- SQLite: Native binary dependency, breaks zero-dep constraint, overkill for volume (hundreds not millions of entries), poor git diffing
- Vector search/embeddings: ML model dependencies, unnecessary for expected scale, tag+title grep is sufficient
- JSON arrays for append-only data: Must read+parse+modify+rewrite entire file, corruption of any character breaks entire file
- Custom query languages: Maintenance burden for marginal benefit, `grep` + `JSON.parse()` covers all queries

### Expected Features

Research synthesized from industry trends, competitor patterns, and domain analysis. Confidence is MEDIUM — no single authoritative source for this exact intersection.

**Must have (table stakes):**
- Signal capture on workflow deviation (model mismatch, plan deviation, repeated rewrites, debugging cycles)
- Signal persistence to file (signals must survive `/clear` to enable learning)
- Spike workflow with hypothesis definition (structured experimentation, not aimless exploration)
- Spike decision record output (ADR-style: context, alternatives, results, decision, consequences)
- Knowledge base file storage (lessons persist across sessions and projects in `~/.claude/gsd-knowledge/`)
- Knowledge base read during research (KB query alongside web/Context7 search)
- Phase-end self-reflection (compare plan vs actual execution, detect deviations)

**Should have (differentiators):**
- Cross-project lesson surfacing (surface "last time you used Prisma, you hit X" across projects)
- Spike result reuse/dedup (before running new spike, check if similar question already answered)
- Iterative spike narrowing (multi-round experimentation where round N informs round N+1)
- Signal pattern detection across projects (aggregate pattern recognition over accumulated signals)

**Defer (anti-features or post-v1):**
- Implicit frustration detection (HIGH complexity, uncertain value, risk of false positives)
- Workflow self-modification (frontier feature, high risk of being wrong)
- Real-time metrics dashboard (contradicts CLI-native and file-based architecture)
- ML-based signal classification (adds model dependencies and opacity)
- Continuous background monitoring (adds overhead, complexity; use event-driven checkpoints instead)

**Critical path for MVP:** Signal Capture → Signal Persistence → Knowledge Base Storage → KB Read During Research. This is the minimum chain that delivers "the system remembers and learns."

### Architecture Approach

Component-based architecture with strict boundaries and one-way data flow: Capture → Store → Distill → Surface. Direction is left-to-right only; no component writes upstream.

**Major components:**

1. **Signal Collector** — Captures workflow events (deviations, frustration, struggles, config mismatches) during execution without interrupting flow. Writes structured Markdown signal files to Knowledge Store. Integration: wrapper workflow around existing `execute-phase.md` adds signal capture hooks before/after execution. Fork-friendly: new workflow file delegates to upstream workflow, no modifications to upstream.

2. **Spike Runner** — Manages isolated experiment lifecycle in `.planning/spikes/{name}/` workspace. Translates design uncertainty into testable hypotheses, runs experiments, produces decision records stored in Knowledge Store. Completely independent of main workflow execution (user pauses work, runs spike, resumes with decision). New command `/gsd:spike` + new workflow + new agent — fully additive.

3. **Knowledge Store** — Passive file-based store at `~/.claude/gsd-knowledge/` with directory structure: `signals/{project}/{date}/`, `spikes/{project}/`, `lessons/{category}/`, `index.md` (auto-generated). No logic — just agreed-upon file format (Markdown + YAML frontmatter). All components read/write here. Project-specific signals also copied to `.planning/signals/` for project context, but canonical store is user-level.

4. **Reflection Engine** — Periodic analysis process (explicit `/gsd:reflect` invocation or at milestone completion) that reads accumulated signals, detects patterns, distills lessons, writes to Knowledge Store. Does NOT run during normal execution to avoid context bloat. New command + workflow + agent.

**Key architectural patterns:**
- **Wrapper workflows (fork-friendly extension):** New workflow files wrap and extend existing ones rather than editing upstream files. Example: `execute-phase-reflect.md` wraps `execute-phase.md` and adds signal capture before/after.
- **Parallel research agents (knowledge surfacing):** Add `gsd-knowledge-researcher` as parallel agent alongside existing `gsd-project-researcher` and `gsd-phase-researcher` during research phases, rather than modifying existing researchers.
- **Passive capture, deferred analysis:** Signal capture is cheap (just file writes during execution); analysis is expensive (runs separately during reflection). Keeps execution fast, avoids context bloat.

**Build order:** Phase 1: Knowledge Store (foundation for all others) → Phase 2: Signal Collector (first writer) → Phase 3: Spike Runner (parallel with Phase 2, independent) → Phase 4: Reflection Engine (first reader+writer, needs signals to analyze) → Phase 5: Knowledge Surfacing (integration, needs lessons to surface).

### Critical Pitfalls

Research confidence: HIGH (domain-specific analysis grounded in project constraints and verified sources).

1. **Context Window Poisoning** — Signals and knowledge injected into agent contexts displace task reasoning tokens. Research on context rot (Hong et al., 2025) shows models exhibit sharp quality cliffs, not gradual degradation, as context fills. GSD agents already have large specs (planner: 1386 lines). Prevention: pull-based retrieval (agents query when needed, not push at spawn), hard token budgets (max 2000 tokens knowledge per agent), aggressive summarization (2-3 sentences, not full records), measure before/after quality.

2. **Knowledge Base Graveyard** — Entries accumulate but nobody reads/trusts them. Staleness destroys trust (one wrong lesson → entire KB mentally marked unreliable). Prevention: expiry dates or review triggers on every entry, decay (unretreived entries lose relevance score and auto-archive), quality over quantity (cap at 50 entries per project, 200 global, force ranking), curation as part of workflow (phase completion includes KB review/prune).

3. **Experiments That Never Converge** — Spikes defer decisions indefinitely ("one more thing to test"). Prevention: require convergence criteria at spike creation ("succeeds if X, fails if Y, decide by Z"), hard timeboxes, max spike depth of 2 (escalate to human if two rounds don't resolve), spike output must be decision ("chose A because B") not report ("here are tradeoffs").

4. **Fork Drift From Upstream GSD** — "Additive only" constraint erodes through small modifications that compound into merge conflicts. Prevention: strict file ownership manifest (CI checks upstream files unmodified), extension architecture (new namespaces like `commands/reflect/`, new agent names like `agents/reflect-*.md`), sync weekly (small merges beat large merges), tag changes for upstream proposal.

5. **Signal Noise** — Capturing everything drowns out meaningful patterns (alert fatigue for observability systems). Prevention: define severity levels at design time (critical/notable/trace, only store critical+notable), signal deduplication (15 instances of same signal → one entry with count), require "so what" for each signal type (what action should it trigger?), cap volume per session (max 10 persistent signals per phase).

## Implications for Roadmap

Based on combined research, dependencies, and pitfall avoidance, suggested phase structure:

### Phase 1: Knowledge Store Foundation
**Rationale:** Every other component depends on the Knowledge Store's file format and directory structure. This is pure design — no integration complexity, can be fully specified before implementation begins. Establishes the foundation that all subsequent phases build on.

**Delivers:**
- Directory structure at `~/.claude/gsd-knowledge/` (signals/, spikes/, lessons/, index.md)
- File format specifications (Markdown + YAML frontmatter schemas for signals, spikes, lessons)
- Index generation logic (scan entries, extract frontmatter, write disposable index.md)
- Zero-dependency primitives documentation (how to use Node.js built-ins for all operations)

**Addresses features:**
- Knowledge base file storage (table stakes)
- Lays groundwork for signal persistence and spike storage

**Avoids pitfalls:**
- Context window poisoning (design pull-based retrieval from start)
- Knowledge base graveyard (build in expiry/decay/scoring from day one)
- Query latency (index file design prevents full-scan searches)

**Research flag:** LOW — this is internal design based on established patterns (frontmatter-based content, static site generator indexes). Skip `/gsd:research-phase`.

---

### Phase 2: Signal Capture and Persistence
**Rationale:** Signals are the primary data source for reflection and learning. This phase establishes the data collection layer. Must come after Knowledge Store (depends on file formats) but before Reflection Engine (which needs signals to analyze). Can be built in parallel with Spike Runner since they write to different parts of the Knowledge Store.

**Delivers:**
- Signal taxonomy and severity levels (critical/notable/trace)
- Signal file template (Markdown + frontmatter)
- Wrapper workflow (`execute-phase-reflect.md`) that adds signal capture hooks around existing `execute-phase.md`
- Signal collector agent (`gsd-signal-collector.md`) that detects deviations by comparing PLAN.md vs SUMMARY.md
- Deduplication logic (count repeated signals instead of duplicating entries)

**Addresses features:**
- Signal capture on workflow deviation (table stakes)
- Signal persistence to file (table stakes)

**Avoids pitfalls:**
- Signal noise (severity levels and deduplication from start)
- Fork drift (wrapper workflow pattern, no upstream file edits)
- Performance review effect (capture at orchestrator level, not in agent specs)

**Research flag:** LOW — deviation detection is comparing Markdown files, frustration patterns are heuristic matching, struggle signals are self-reported by executors. Standard file I/O patterns. Skip `/gsd:research-phase`.

---

### Phase 3: Spike Workflow (Parallel with Phase 2)
**Rationale:** Spike workflow is independent of signal tracking — writes to different part of Knowledge Store, different user invocation pattern. Can be built in parallel with Phase 2 for velocity. Delivers structured experimentation capability early, which is valuable even before reflection/learning are implemented.

**Delivers:**
- Spike command (`/gsd:spike`) and workflow (`spike.md`)
- Spike runner agent (`gsd-spike-runner.md`)
- Spike workspace structure (`.planning/spikes/{name}/` with HYPOTHESIS.md, EXPERIMENT.md, DECISION.md)
- Decision record template with mandatory decision field (prevents decision-less reports)
- Convergence constraints: timeboxes, max depth 2, success/failure criteria required upfront

**Addresses features:**
- Spike workflow with hypothesis definition (table stakes)
- Spike decision record output (table stakes)
- Iterative spike narrowing (differentiator)

**Avoids pitfalls:**
- Experiments that never converge (structural constraints in workflow)
- Decision records without decisions (mandatory decision field in template)
- Fork drift (new command/workflow/agent, no upstream edits)

**Research flag:** MEDIUM — hypothesis formation and experiment design may need structured templates/prompts research. Consider `/gsd:research-phase` for "how do other AI dev tools structure experiment workflows?" (OpenDevin, Codium, etc.)

---

### Phase 4: Reflection Engine
**Rationale:** Depends on signals existing to analyze (Phase 2 must complete). This is where captured signals become actionable lessons. Pattern detection and lesson distillation close the self-improvement loop. Must come before knowledge surfacing because surfacing needs lessons to exist.

**Delivers:**
- Reflection command (`/gsd:reflect`) and workflow (`reflect.md`)
- Reflector agent (`gsd-reflector.md`) that reads signals, clusters them, detects patterns, distills lessons
- Lesson file template (Markdown + frontmatter with category, confidence, evidence)
- Decay/expiry mechanism (unretreived entries lose relevance score)
- Integration hook: optional reflection step in `complete-milestone` workflow

**Addresses features:**
- Phase-end self-reflection (table stakes)
- Signal pattern detection across projects (differentiator)

**Avoids pitfalls:**
- Knowledge base graveyard (decay and expiry built into lesson format)
- Context window poisoning (reflection runs separately from execution, doesn't bloat agent contexts)

**Research flag:** MEDIUM-HIGH — pattern detection over signals is a clustering/analysis problem. Consider `/gsd:research-phase` for "what are lightweight pattern detection approaches for structured logs?" (time series anomaly detection, clustering algorithms that work without ML dependencies).

---

### Phase 5: Knowledge Surfacing
**Rationale:** The payoff phase where existing workflows get smarter by consulting accumulated knowledge. Depends on Knowledge Store (Phase 1), lessons existing (Phase 4), and spike results existing (Phase 3). This is where the system closes the loop: captured signals → distilled lessons → surfaced during research → better decisions.

**Delivers:**
- Knowledge researcher agent (`gsd-knowledge-researcher.md`) spawned in parallel with existing project/phase researchers
- Query interface that searches Knowledge Store index.md, filters by relevance (tags, recency, project context)
- Integration into research workflows: KB query runs alongside web/Context7 search
- Pull-based retrieval with token budget enforcement (max 2000 tokens knowledge per agent spawn)
- Lazy loading: agents explicitly request knowledge when needed, not auto-injected at spawn

**Addresses features:**
- Knowledge base read during research (table stakes)
- Cross-project lesson surfacing (differentiator)
- Spike result reuse/dedup (differentiator)

**Avoids pitfalls:**
- Context window poisoning (pull-based retrieval, strict token budgets, aggressive summarization)
- Query latency (index.md provides fast lookup without scanning all files)

**Research flag:** LOW — parallel agent spawning is standard GSD pattern, frontmatter searching is grep-based, token counting is string length. Skip `/gsd:research-phase`.

---

### Phase Ordering Rationale

**Critical path:** Phase 1 → Phase 2 → Phase 4 → Phase 5. Phase 3 (Spike Runner) is off the critical path and can parallelize with Phase 2 for delivery velocity.

**Why this order:**
- **Foundation-first:** Knowledge Store (Phase 1) is pure design with zero integration complexity. Establishes formats all other phases depend on. Building this first prevents rework.
- **Data collection before analysis:** Signals (Phase 2) must be captured before Reflection Engine (Phase 4) can analyze them. No signals → no patterns → no lessons.
- **Parallel value streams:** Signal tracking (Phases 2→4) and spike workflow (Phase 3) are independent features that write to different parts of the Knowledge Store. Parallelizing Phase 2 and Phase 3 delivers structured experimentation capability earlier.
- **Integration last:** Knowledge Surfacing (Phase 5) integrates with existing research workflows. Doing this last means the feature is fully functional (KB populated with lessons and spike results) before we wire it into the main workflow. Reduces risk of surfacing empty/stale knowledge.
- **Pitfall avoidance baked into order:** Context window poisoning (P1) is mitigated by establishing pull-based retrieval in Phase 1 design and enforcing it in Phase 5 integration. Fork drift (P4) is mitigated by using wrapper workflows and parallel agents throughout (no upstream file edits in any phase).

**Dependency visualization:**
```
Phase 1: Knowledge Store
  ├── Phase 2: Signal Collector (depends on file formats)
  │     └── Phase 4: Reflection Engine (depends on signals existing)
  │           └── Phase 5: Knowledge Surfacing (depends on lessons existing)
  │
  └── Phase 3: Spike Runner (depends on file formats, parallel with Phase 2)
        └── Phase 5: Knowledge Surfacing (also depends on spike results)
```

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Spike Workflow):** MEDIUM priority — hypothesis formation and experiment design may benefit from structured templates research. Query: "how do AI dev tools structure experiment workflows?" Sources: OpenDevin docs, Codium experiment features, Addy Osmani's workflow patterns.
- **Phase 4 (Reflection Engine):** MEDIUM-HIGH priority — pattern detection over signals is a clustering/analysis problem without ML dependencies. Query: "lightweight pattern detection for structured logs" Sources: time series anomaly detection algorithms, simple clustering (k-means with cosine similarity, no lib dependency).

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Knowledge Store):** Standard file-based patterns (frontmatter content, static site generator indexes, directory structures). All design, no novel integration.
- **Phase 2 (Signal Collector):** Markdown diff comparison, heuristic pattern matching, file I/O. Well-understood primitives.
- **Phase 5 (Knowledge Surfacing):** Parallel agent spawning (existing GSD pattern), grep-based search, token counting. Standard integration.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency constraint narrows choices decisively. JSONL and Markdown+frontmatter are established patterns with clear rationale. Sources include JSONL industry docs, mdbase-spec, LogTape zero-dep logging. |
| Features | MEDIUM | Synthesized from industry trends and competitor analysis, but no single authoritative source for this exact intersection. Table stakes are well-validated (observability and experiment patterns). Differentiators are novel to CLI tooling domain. |
| Architecture | HIGH | Internal design based on existing GSD codebase analysis. Component boundaries, wrapper workflow pattern, and fork-friendly extension strategy are all grounded in GSD's existing structure. |
| Pitfalls | HIGH | Context rot research (Chroma, Factory.ai, Anthropic) validates context window poisoning as critical risk. Knowledge management failure modes (Bloomfire, Artiquare) are well-documented. Fork drift patterns (Preset, GitHub) are established. |

**Overall confidence:** HIGH

Confidence is high because:
1. The technology stack is constrained and validated (zero-dep requirement eliminates most choices)
2. The architecture leverages GSD's existing patterns (wrapper workflows, parallel agents)
3. The pitfalls are grounded in industry research (context rot, KM failures, fork drift)

The one area of medium confidence (features) doesn't impact implementation decisions — it affects product prioritization, which will be validated through usage.

### Gaps to Address

**Gap 1: Cross-runtime knowledge store path**
- **Issue:** `~/.claude/gsd-knowledge/` works for Claude Code, but OpenCode or Gemini CLI may use different user config directories.
- **Handling:** Add configurable path in GSD config. Default to `~/.claude/` for Claude Code. Document override for other runtimes. Low risk — configuration option handles it.

**Gap 2: Signal volume management over time**
- **Issue:** Thousands of signal files could accumulate over months. Need pruning/archival strategy.
- **Handling:** Part of Reflection Engine design (Phase 4). After signals are processed into lessons, archive them (move to `signals/archive/{year}/`). Configurable retention period (default: 90 days unarchived). Medium priority — implement in Phase 4.

**Gap 3: Implicit frustration detection feasibility**
- **Issue:** Pattern matching for user frustration ("no, that's wrong", agent retries 3 times) may have unacceptable false positive rate.
- **Handling:** Defer to post-MVP. Start with explicit signals only (signal capture requires explicit deviation detection, not sentiment analysis). If demanded later, run a spike (Phase 3) to validate detection accuracy before implementing. Low risk — explicitly deferred to v2+.

**Gap 4: Index generation performance at scale**
- **Issue:** Generating index.md from hundreds of entries on every write may cause noticeable latency.
- **Handling:** Phase 1 design decision. Start with full regeneration (simple). Add lazy regeneration trigger (only regenerate if index is >1 hour old) if performance becomes issue. Can profile during Phase 5 integration when KB is populated. Low risk — optimization can be added later without changing file formats.

## Sources

### Primary (HIGH confidence)

**Stack research:**
- [JSONL for Log Processing](https://jsonl.help/use-cases/log-processing/) — JSONL append-only patterns
- [mdbase Specification](https://mdbase.dev/spec.html) — Frontmatter+filesystem pattern validation
- [LogTape Documentation](https://logtape.org/manual/struct) — Zero-dependency structured logging patterns
- GSD codebase analysis (commands, workflows, agents, templates)

**Architecture research:**
- GSD PROJECT.md, execute-phase.md, agent specifications
- `~/.claude/` directory convention (Claude Code user config location)

**Pitfalls research:**
- [Context Rot: How Increasing Input Tokens Impacts LLM Performance](https://research.trychroma.com/context-rot) — Context window poisoning evidence
- [The Context Window Problem: Scaling Agents Beyond Token Limits](https://factory.ai/news/context-window-problem) — Context management strategies
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Pull-based retrieval patterns
- [7 Deadly Sins That Will Turn Your KM System Into a Graveyard](https://bloomfire.com/blog/seven-deadly-sins-that-will-turn-your-knowledge-management-system-into-a-graveyard/) — Knowledge base failure modes
- [Spikes - Scaled Agile Framework](https://scaledagileframework.com/spikes/) — Experiment convergence patterns
- [Stop Forking Around: Hidden Dangers of Fork Drift](https://preset.io/blog/stop-forking-around-the-hidden-dangers-of-fork-drift-in-open-source-adoption/) — Fork maintenance strategies

### Secondary (MEDIUM confidence)

**Feature research:**
- [O'Reilly Signals for 2026](https://www.oreilly.com/radar/signals-for-2026/) — Industry trends
- [Braintrust AI Observability Guide 2026](https://www.braintrust.dev/articles/best-ai-observability-tools-2026) — Observability patterns
- [ADR Tooling](https://adr.github.io/adr-tooling/) — Decision record ecosystem
- [UK Gov ADR Framework 2025](https://technology.blog.gov.uk/2025/12/08/the-architecture-decision-record-adr-framework-making-better-technology-decisions-across-the-public-sector/) — ADR best practices
- [DeepLearning.AI Reflection Pattern](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection/) — Reflection patterns for agents
- [MemOS Paper](https://statics.memtensor.com.cn/files/MemOS_0707.pdf) — Memory-as-OS-resource concept
- [Addy Osmani LLM Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/) — Experiment-driven workflows

### Tertiary (LOW confidence, supporting context)

- [MarkdownDB](https://markdowndb.com/) — Markdown-to-queryable-index approach (validates pattern, uses SQLite internally)
- [JSONL vs JSON: When to Use JSON Lines](https://superjson.ai/blog/2025-09-07-jsonl-vs-json-data-processing/) — Format comparison

---
*Research completed: 2026-02-02*
*Ready for roadmap: yes*
