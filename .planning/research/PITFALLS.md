# Domain Pitfalls

**Domain:** Self-improving AI dev tooling (signal tracking, experiment workflows, knowledge base)
**Researched:** 2026-02-02
**Overall confidence:** HIGH (domain-specific analysis grounded in project constraints and verified research)

## Critical Pitfalls

Mistakes that cause rewrites, system abandonment, or fundamental architecture problems.

### Pitfall 1: Context Window Poisoning from Signal/Knowledge Injection

**What goes wrong:** Signals, knowledge base entries, and experiment results get injected into agent context windows, consuming token budget that should go to the actual task. Even well-intentioned "here are 5 relevant lessons" preambles degrade reasoning quality. Research on context rot (Hong et al., 2025) shows models exhibit sharp, unpredictable quality cliffs -- not gradual degradation -- as context fills.

**Why it happens:** The intuition "more context = better results" is wrong for LLMs. GSD already has large agent specs (planner: 1386 lines, debugger: 1203 lines). Adding signal summaries, knowledge base results, and experiment conclusions on top pushes agents past their effective context window, which is far smaller than the advertised limit.

**Consequences:** Agent reasoning quality drops silently. Plans get worse. Executors make more mistakes. The system appears to work but produces subtly degraded output. Worse: the degradation is invisible because there is no baseline comparison.

**Warning signs:**
- Agents start ignoring instructions that are "in the middle" of their context
- Plan quality drops after knowledge base grows past ~20 entries
- Researchers produce shallower analysis despite having "more information"
- Users notice agents "forgetting" rules from their spec files

**Prevention:**
- Treat context budget as a zero-sum resource. Every token of signal/knowledge displaces a token of task reasoning.
- Never auto-inject knowledge. Use pull-based retrieval: agent explicitly queries knowledge base when it decides it needs context, not push-based injection at spawn time.
- Set hard token budgets for knowledge injection (e.g., max 2000 tokens of knowledge per agent spawn).
- Summarize aggressively. A knowledge entry should be 2-3 sentences, not a full decision record.
- Measure before/after: compare plan quality with and without knowledge injection during development.

**Phase:** Must be addressed in the knowledge base design phase. Retrofitting lazy loading onto an eager-loading design is a rewrite.

---

### Pitfall 2: The Knowledge Base Graveyard

**What goes wrong:** Knowledge base fills with entries that nobody reads, nobody trusts, and nobody maintains. Entries go stale within weeks. The system becomes a write-only log that consumes storage and attention without producing value. This is the single most common failure mode of knowledge management systems across all domains.

**Why it happens:** Three reinforcing dynamics:
1. **Capture is easy, curation is hard.** Automated signal capture generates volume. Nobody is incentivized to prune, update, or validate entries.
2. **Staleness destroys trust.** One wrong lesson surfaced at the wrong time ("use library X" when X has been deprecated) and users mentally mark the entire knowledge base as unreliable.
3. **Quantity gaming.** If the system measures "number of lessons captured," it optimizes for volume over quality -- the exact anti-pattern documented across enterprise KM failures.

**Consequences:** Users ignore knowledge base results. The feature becomes dead weight. Worse: stale knowledge actively misleads agents, causing them to make decisions based on outdated information.

**Warning signs:**
- Knowledge base grows monotonically (entries added but never removed or updated)
- Same lessons appear in slightly different phrasings (duplication without deduplication)
- Users start skipping the "here's what the knowledge base says" section
- Knowledge entries lack dates or version context

**Prevention:**
- Every entry must have an expiry date or review trigger (e.g., "valid until library X releases v4" or "review after 90 days").
- Implement decay: entries that are never retrieved lose relevance score and eventually auto-archive.
- Quality over quantity: cap the active knowledge base at a fixed size (e.g., 50 entries per project, 200 global). Force ranking.
- Attach provenance: every entry links to the signal or spike that produced it, so users can evaluate trustworthiness.
- Make curation part of the workflow, not a separate chore. Phase completion should include "review/prune knowledge entries from this phase."

**Phase:** Knowledge base architecture phase. The storage format must support expiry, scoring, and archival from day one.

---

### Pitfall 3: Experiments That Never Converge (Permanent Spike Mode)

**What goes wrong:** Spike/experiment workflows become a way to defer decisions indefinitely. Teams run spike after spike without committing to a direction. The experiment framework enables procrastination disguised as rigor.

**Why it happens:** Spikes feel productive -- you're "gathering data." But without explicit convergence criteria defined upfront, there is always one more thing to test. The agile community has documented this extensively: spikes must be timeboxed and must produce a decision, not just more questions.

**Consequences:** Main workflow stalls while experiments run. Context is consumed by experiment overhead instead of shipping. The spike workflow becomes the default mode instead of the exception.

**Warning signs:**
- A spike produces "inconclusive" results and spawns another spike
- More than 2 spikes in sequence on the same question
- Spike results don't get integrated into the main workflow within the same phase
- Spikes lack defined success/failure criteria before they start

**Prevention:**
- Require convergence criteria at spike creation time: "This spike succeeds if X, fails if Y, and we decide by Z."
- Hard timebox: spikes get a fixed context/time budget. When it expires, you decide with what you have.
- Maximum spike depth of 2: if two rounds of experimentation haven't resolved uncertainty, escalate to human decision, don't run a third spike.
- Spike results must produce a decision record, not a report. The output is "We chose A because B" not "Here are the tradeoffs."

**Phase:** Spike workflow design phase. Convergence constraints must be structural (enforced by the workflow), not advisory.

---

### Pitfall 4: Fork Drift From Upstream GSD

**What goes wrong:** "Additive only" changes gradually become entangled with upstream files. A new signal tracking hook needs to modify the executor agent. A knowledge base query needs to be wired into the researcher workflow. Each small modification seems harmless, but they compound into merge conflicts that make upstream syncing painful or impossible.

**Why it happens:** Fork drift is exponential, not linear. Each modification to an upstream file creates a potential conflict with every future upstream change to that file. The "additive only" constraint is easy to state but hard to maintain when building features that naturally want to integrate deeply with existing workflows.

**Consequences:** Upstream improvements become inaccessible. Merges require manual conflict resolution that introduces bugs. Eventually the fork becomes a separate project that happens to share history with upstream.

**Warning signs:**
- Any PR that modifies a file in `commands/gsd/`, `get-shit-done/workflows/`, or `agents/gsd-*.md` (upstream files)
- Merge conflicts increasing in frequency when pulling upstream
- Developers saying "we should just change this one upstream file, it's simpler"
- Extension points requiring patches to upstream code

**Prevention:**
- Strict file ownership: maintain a manifest of upstream-owned files. CI or pre-commit check that these files are unmodified.
- Extension architecture: new commands in a separate namespace (e.g., `commands/reflect/`), new agents with new names (e.g., `agents/reflect-*.md`), new workflows in a separate directory.
- Hook points over modifications: if upstream needs to call reflect features, propose the hook point upstream rather than patching locally.
- Sync weekly: the longer between syncs, the worse drift gets. Regular small merges beat infrequent large merges.
- Tag changes that should go upstream with a marker (e.g., `#propose-upstream`) and actually submit them.

**Phase:** Must be established as a convention in the very first phase and enforced throughout all subsequent phases.

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or feature underperformance.

### Pitfall 5: Signal Noise Drowning Out Signal

**What goes wrong:** The signal tracking system captures everything -- model mismatches, minor plan deviations, user hesitations, retry attempts -- and produces so many signals that meaningful patterns are invisible. Alert fatigue, the dominant problem in observability systems, manifests here as "signal fatigue."

**Why it happens:** It's easier to log everything than to decide what matters. The system designers defer the filtering problem to "later" and implement broad capture first. But once signals accumulate, retroactive filtering is much harder than upfront curation.

**Prevention:**
- Define signal severity levels at design time (critical / notable / trace). Only critical and notable signals are stored persistently. Trace signals are ephemeral.
- Implement signal deduplication: "model mismatch" occurring 15 times in one session should be one signal with a count, not 15 entries.
- Require each signal type to have a defined "so what": what action should this signal trigger? If no action, it's not a signal -- it's a log line.
- Cap signal volume per session (e.g., max 10 persistent signals per phase execution). Force prioritization.

**Phase:** Signal tracking design phase. The taxonomy and severity model must precede the capture implementation.

---

### Pitfall 6: Implicit Signal Capture Becoming Surveillance Theater

**What goes wrong:** The system tries to detect "user frustration" and "agent struggles" through heuristic pattern matching (e.g., user types "no, that's wrong" or agent retries 3 times). These heuristics produce false positives that clutter the signal stream and false negatives that miss real issues. Worse: users feel surveilled and lose trust.

**Why it happens:** Implicit capture is appealing in theory ("the system notices problems without you telling it") but extraordinarily hard in practice. Natural language frustration detection is unreliable. Agent "struggle" patterns vary by task complexity.

**Prevention:**
- Start with explicit signals only. Ship implicit capture as a later enhancement, not a launch feature.
- When adding implicit capture, require a false positive rate below 20% measured on real sessions before enabling by default.
- Make implicit signals visible and dismissable: "I noticed X -- was this a real issue? [yes/no]" User feedback trains the detector.
- Never capture signal content from user messages verbatim. Capture the pattern ("user corrected agent 3 times in task 5") not the content.

**Phase:** Defer to a later phase. Explicit signal capture is the MVP. Implicit detection is a research problem, not a v1 feature.

---

### Pitfall 7: Knowledge Base Query Latency Blocking Workflow

**What goes wrong:** Knowledge base queries during research or planning phases add latency to every agent spawn. File-based search across a growing knowledge base (potentially hundreds of markdown files across `~/.claude/` or similar) becomes slow enough to noticeably delay workflow execution.

**Why it happens:** File-based knowledge bases without indexing require full-text search across all entries. As the knowledge base grows, search time grows linearly. With GSD's zero-dependency constraint, you can't reach for Elasticsearch or SQLite.

**Prevention:**
- Build a lightweight index file (JSON manifest with entry titles, tags, dates, and one-line summaries) that agents search first. Only fetch full entries for matches.
- Scope queries by project and recency by default. "All knowledge everywhere" is rarely what you want.
- Set a hard timeout on knowledge base queries (e.g., 500ms). If search takes longer, skip it and proceed. The workflow must never block on knowledge.
- Consider pre-computing relevance at phase start rather than querying per-agent-spawn.

**Phase:** Knowledge base architecture phase. Index design is a structural decision.

---

### Pitfall 8: Decision Records Without Decisions

**What goes wrong:** Spike workflows produce detailed experiment reports documenting what was tried and what happened, but fail to produce a clear, actionable decision. The report becomes another knowledge base entry that future agents must re-interpret.

**Prevention:**
- Spike output template must have a mandatory "Decision" field that is a single sentence: "Use X" or "Do not use Y because Z."
- Separate the decision from the methodology. The decision is the primary artifact; the methodology is supporting evidence.
- Decision records should be directly consumable by planners: structured enough that a planner agent can read the decision without parsing prose.

**Phase:** Spike workflow design phase. Output template enforces this.

---

## Minor Pitfalls

Mistakes that cause friction but are recoverable.

### Pitfall 9: Knowledge Base Location Fragmentation

**What goes wrong:** Per-user knowledge base (in `~/.claude/` or similar) and per-project signals (in `.planning/`) create two disconnected stores. Cross-referencing requires knowing which store to query. Agents query one but not the other.

**Prevention:**
- Define a clear hierarchy: project signals roll up into the global knowledge base at phase completion. During execution, agents query project signals first, global knowledge second.
- Single query interface that abstracts the storage location. Agents shouldn't need to know where knowledge lives.

**Phase:** Knowledge base architecture phase.

---

### Pitfall 10: Signal Tracking Making Every Session a Performance Review

**What goes wrong:** Agents become aware they're being tracked and the tracking instructions compete with task instructions for attention. The signal tracking system prompt additions cause the agent to focus on meta-cognition ("am I struggling?") instead of the task.

**Prevention:**
- Signal capture should happen at the orchestrator level, not inside individual agent specs. Agents execute; orchestrators observe.
- Keep signal-related instructions out of agent context entirely. The executor agent should not contain "also log signals about your performance."
- Post-hoc analysis: analyze agent output after execution for signal patterns, rather than asking agents to self-report during execution.

**Phase:** Signal tracking architecture phase. This is an architectural decision about where signal capture lives in the stack.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Signal tracking design | Signal noise (P5), surveillance theater (P6), performance review effect (P10) | Define taxonomy and severity before building capture. Keep capture at orchestrator layer. Start explicit-only. |
| Spike workflow design | Never-converging experiments (P3), decision-less reports (P8) | Structural convergence constraints: timeboxes, max depth, mandatory decision field. |
| Knowledge base architecture | Context poisoning (P1), graveyard (P2), query latency (P7), fragmentation (P9) | Pull-based retrieval with token budgets. Expiry/decay from day one. Index file for search. Single query interface. |
| Fork maintenance (all phases) | Fork drift (P4) | File ownership manifest. Separate namespaces. Weekly upstream sync. |
| Integration / wiring phase | Context bloat from connecting everything (P1) | Measure context usage before and after integration. Hard token budgets per knowledge/signal injection. |

## Sources

- [Context Rot: How Increasing Input Tokens Impacts LLM Performance (Chroma Research)](https://research.trychroma.com/context-rot)
- [The Context Window Problem: Scaling Agents Beyond Token Limits (Factory.ai)](https://factory.ai/news/context-window-problem)
- [Effective Context Engineering for AI Agents (Anthropic)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Why Long System Prompts Hurt Context Windows (Medium)](https://medium.com/data-science-collective/why-long-system-prompts-hurt-context-windows-and-how-to-fix-it-7a3696e1cdf9)
- [7 Deadly Sins That Will Turn Your KM System Into a Graveyard (Bloomfire)](https://bloomfire.com/blog/seven-deadly-sins-that-will-turn-your-knowledge-management-system-into-a-graveyard/)
- [Why Knowledge Bases Fail: The Real KM Challenges (Artiquare)](https://www.artiquare.com/why-knowledge-bases-fail-real-km-challenges/)
- [3 Reasons Why Knowledge Management Fails (IFS)](https://blog.ifs.com/3-reasons-why-knowledge-management-fails/)
- [Spikes - Scaled Agile Framework (SAFe)](https://scaledagileframework.com/spikes/)
- [Stop Forking Around: Hidden Dangers of Fork Drift (Preset)](https://preset.io/blog/stop-forking-around-the-hidden-dangers-of-fork-drift-in-open-source-adoption/)
- [Friend Zone: Strategies for Friendly Fork Management (GitHub Blog)](https://github.blog/developer-skills/github/friend-zone-strategies-friendly-fork-management/)
- [LLM Context Management Guide (16x Engineer)](https://eval.16x.engineer/blog/llm-context-management-guide)

---

*Pitfalls research: 2026-02-02*
