# Feature Landscape

**Domain:** Self-improving AI dev tooling (signal tracking, experiment workflows, persistent knowledge)
**Researched:** 2026-02-02
**Overall confidence:** MEDIUM — synthesized from industry trends, competitor patterns, and domain analysis; no single authoritative source covers this exact intersection

## Table Stakes

Features users expect. Missing = the system doesn't deliver on its promise of self-improvement.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Signal capture on workflow deviation** | Core promise — if the system can't detect when things go wrong, it can't improve. Every observability system starts here. | Medium | None (foundational) | Must detect: model mismatch, plan deviation, repeated rewrites, excessive debugging cycles. Pattern: compare actual execution against expected workflow graph. |
| **Signal persistence to file** | Signals that vanish on `/clear` are useless. File-based storage is the minimum bar for any learning system. | Low | Signal capture | Append-only log per project, structured Markdown or JSON. Must not bloat context — write-only during execution, read-only on demand. |
| **Spike workflow with hypothesis definition** | Without a structured "what are we testing and why," spikes devolve into aimless exploration. Every experiment framework starts with hypothesis. | Medium | None (foundational) | Minimum: hypothesis statement, success criteria, time-box. Maps to Scrum spike concept but formalized for AI agent context. |
| **Spike decision record output** | Spikes that don't produce a record are wasted work. ADR-style output is standard practice (adr-tools, UK Gov ADR framework). | Low | Spike workflow | Template: context, alternatives considered, experiment results, decision, consequences. Builds on established ADR patterns. |
| **Knowledge base file storage** | The whole point — lessons must persist across sessions and projects. Without this, there's no memory. | Medium | Signal persistence, spike decision records | Location: `~/.gsd/knowledge/` or similar user-global path. Must be file-based per constraints. Structured for queryability without a database. |
| **Knowledge base read during research** | If the KB exists but isn't consulted, it's dead weight. Research agents already search web/Context7 — KB query slots in naturally. | Medium | Knowledge base storage, existing research agent | Integration point: researcher agents query KB alongside WebSearch and Context7. Must not add latency to the happy path when KB is empty. |
| **Phase-end self-reflection** | After each phase completes, the system should assess: what went well, what deviated, what took longer than expected. This is the minimum feedback loop. | Medium | Signal capture | Output: brief reflection appended to signals or KB. Pattern: compare phase plan vs actual execution. |

## Differentiators

Features that set GSD Reflect apart. Not expected in any single tool today, but high-value.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Implicit frustration detection** | No other CLI tool does this. Users say "ugh, try again" or "that's wrong" without invoking a command. Capturing this as a signal without explicit invocation is genuinely novel. | High | Signal capture framework | Requires pattern matching on user messages during execution. Risk: false positives. Must be low-overhead — heuristic, not ML. Confidence: LOW that this can be done well without being annoying. |
| **Cross-project lesson surfacing** | Most tools are project-scoped. Surfacing "last time you used Prisma, you hit X" across projects is the killer feature for a personal dev tool. | High | Knowledge base with structured tagging | Requires: consistent tagging/indexing, relevance scoring, lazy loading to avoid context bloat. The MemOS research direction validates this as a frontier problem. |
| **Spike result reuse / dedup** | Before running a new spike, check if a similar question was already answered. Saves hours of redundant experimentation. | Medium | Knowledge base, spike records with searchable metadata | Key challenge: similarity matching on spike hypotheses. Simple approach: keyword/tag matching. Advanced: semantic similarity (but adds dependency). |
| **Iterative spike narrowing** | Multi-round experimentation where round N informs round N+1's hypothesis. Most experiment tools are single-shot. | Medium | Spike workflow | Pattern: spike produces partial answer + refined question, system supports chaining spikes with back-references. |
| **Signal pattern detection across projects** | "You've hit this class of problem 3 times across different projects" — aggregate pattern recognition over accumulated signals. | High | Knowledge base with substantial signal history | Only valuable after sufficient data accumulates. Should be a later-phase feature. Cold start problem is real. |
| **Proactive lesson surfacing** | KB doesn't just respond to queries — it pushes relevant lessons when it detects a similar context forming. Like "you're setting up a monorepo; last time you learned X." | High | Cross-project KB, context matching | This is the "self-improving" endgame. Requires matching current project context against KB entries. Risk: noise. Must have high precision or users will ignore it. |
| **Workflow self-modification** | System detects recurring signal patterns and proposes workflow changes (e.g., "research phase consistently underestimates time for X — suggest adding a sub-phase"). | Very High | Signal pattern detection, deep workflow model knowledge | Frontier feature. High risk of being wrong. Recommend: suggest-only, never auto-modify. Defer to post-v1. |
| **Semantic drift detection** | Track whether agent outputs are degrading over time — are research summaries getting shallower? Are spike designs getting less rigorous? | High | Signal history, baseline metrics | Inspired by AI observability platforms (Braintrust, Maxim AI). Adapted from production ML monitoring to dev-tool context. Novel in CLI tooling. |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time metrics dashboard** | GSD is CLI-native and file-based. A web UI contradicts the architecture and adds massive complexity for marginal value. Observability tools like Datadog solve a different problem. | File-based signal logs + Markdown reports. If visualization needed, generate static Markdown tables. |
| **Automated code patching from signals** | Signals should inform decisions, not auto-modify code. Auto-patching without human judgment is the #1 cause of agentic AI project failures (40%+ cancellation rate per industry data). | Signals produce recommendations. Humans/agents decide whether to act. |
| **ML-based signal classification** | Adds model dependencies, training data requirements, and opacity. GSD's value is transparency and zero-dependency operation. | Heuristic rules + keyword matching. Simple and debuggable beats sophisticated and opaque. |
| **Multi-user shared knowledge base** | Collaboration features explode complexity (conflict resolution, permissions, privacy). Per-user is the right scope for v1. | Per-user KB in `~/.gsd/knowledge/`. Cross-user sharing can be a future layer if needed. |
| **Structured database for KB** | SQLite or similar breaks GSD's zero-dependency, file-based philosophy and makes the KB opaque to users. | Structured Markdown/JSON files with directory-based organization. Users can read/edit KB entries directly. |
| **Continuous background monitoring** | Always-on processes watching for signals would add overhead, complexity, and runtime dependencies. | Check signals at natural workflow checkpoints (phase transitions, command completion). Event-driven, not polling. |
| **Signal suppression / noise filtering UI** | Building a configuration UI for tuning signal sensitivity is premature optimization. | Start with conservative signal detection (high-confidence only). Add sensitivity knobs only after real usage reveals the need. |
| **Integration with external observability platforms** | OpenTelemetry/Datadog integration sounds impressive but serves a different audience (ops teams, not individual devs using CLI tools). | Keep signals self-contained. If export is needed later, structured files are already portable. |

## Feature Dependencies

```
Signal Capture (foundational)
  --> Signal Persistence (requires capture)
  --> Phase-End Self-Reflection (requires capture)
        --> Signal Pattern Detection (requires accumulated signals)
              --> Workflow Self-Modification (requires pattern detection) [DEFER]

Spike Workflow (foundational)
  --> Spike Decision Records (requires workflow)
  --> Iterative Spike Narrowing (requires workflow)

Knowledge Base Storage (foundational, requires signal persistence + spike records as data sources)
  --> KB Read During Research (requires storage)
  --> Cross-Project Lesson Surfacing (requires storage + tagging)
        --> Proactive Lesson Surfacing (requires cross-project + context matching)
  --> Spike Result Reuse (requires storage + spike records)

Implicit Frustration Detection (independent, but feeds into signal capture)
Semantic Drift Detection (independent, requires signal history)
```

**Critical path:** Signal Capture --> Signal Persistence --> Knowledge Base Storage --> KB Read During Research

This is the minimum chain that delivers the core value proposition: "the system remembers and learns."

## MVP Recommendation

For MVP, prioritize the table stakes in dependency order:

1. **Signal capture + persistence** — the data collection layer. Without signals, nothing downstream works.
2. **Spike workflow + decision records** — structured experimentation. Independent of signals, can be built in parallel.
3. **Knowledge base storage + research integration** — the persistence layer that makes signals and spike results durable and queryable.
4. **Phase-end self-reflection** — closes the feedback loop. Simple to implement once signals exist.

Defer to post-MVP:
- **Implicit frustration detection**: High complexity, uncertain value. Start with explicit signals and add implicit detection after validating the architecture.
- **Cross-project surfacing + proactive lessons**: Requires substantial KB content to be useful. Cold start problem means this delivers no value until the system has been used across multiple projects.
- **Signal pattern detection + workflow self-modification**: Frontier features. Need accumulated data and proven architecture before attempting.
- **Semantic drift detection**: Interesting but requires baseline definitions that don't exist yet.

## Sources

- [O'Reilly Signals for 2026](https://www.oreilly.com/radar/signals-for-2026/) — industry trend overview
- [Braintrust AI Observability Guide 2026](https://www.braintrust.dev/articles/best-ai-observability-tools-2026) — observability platform patterns
- [ADR Tooling](https://adr.github.io/adr-tooling/) — decision record tool ecosystem
- [UK Gov ADR Framework 2025](https://technology.blog.gov.uk/2025/12/08/the-architecture-decision-record-adr-framework-making-better-technology-decisions-across-the-public-sector/) — ADR best practices at scale
- [Galileo Self-Evaluation in AI](https://galileo.ai/blog/self-evaluation-ai-agents-performance-reasoning-reflection) — reflection patterns for agents
- [DeepLearning.AI Reflection Pattern](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection/) — foundational reflection design pattern
- [MemOS Paper](https://statics.memtensor.com.cn/files/MemOS_0707.pdf) — memory-as-OS-resource for AI agents
- [DEV.to: 2026 Year of Agentic Development](https://dev.to/mikulg/2026-the-year-of-agentic-development-4507) — persistent memory trends
- [KM System Features 2026](https://context-clue.com/blog/top-10-knowledge-management-system-features-in-2026/) — knowledge management patterns
- [Addy Osmani LLM Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/) — experiment-driven dev workflows
- [Kore.ai AI Observability](https://www.kore.ai/blog/what-is-ai-observability) — deviation detection patterns
