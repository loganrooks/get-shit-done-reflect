# Deliberation: Self-Improvement Pipeline Design

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-19
**Status:** Concluded
**Trigger:** Post-execution reflection from QT22-31 session. A single GitHub issue (#15) expanded into 10 quick tasks, 1 spike, 2 concluded deliberations, and 3 patch releases — revealing systemic gaps in the self-improvement pipeline: local patches invisible to signal tracking, false premises leading to shipped-then-reverted fixes (QT29), model mappings deployed with Claude-specific content to non-Claude runtimes, and no mechanism to flow local fixes back into source. The user requested a thorough deliberation on making the full pipeline epistemically rigorous, traceable, and scientifically sound.
**Affects:** Signal pipeline architecture, installer content generation, model profile system, v1.18+ scope, GSD Reflect core identity
**Related:**
- `.planning/deliberations/signal-lifecycle-closed-loop-gap.md` (Concluded): Programmatic lifecycle transitions, KB health watchdog, deliberation epistemic hardening
- `.planning/deliberations/platform-change-monitoring.md` (Concluded): Two-layer change detection + integration testing strategy
- `.planning/deliberations/deployment-parity-v1.17.2.md` (Concluded): Fixed specific deployment gaps across runtimes
- `.planning/deliberations/epistemic-health-and-variety.md` (Open): Epistemic health probes, warrant typing, variety metrics
- sig-2026-03-19-stale-platform-claims-in-source (critical): Source files contain false capability claims; local patches invisible
- sig-2026-03-17-no-platform-change-detection (notable): No proactive detection of platform changes
- philosophy: lakatos/progressive-improvement — Is the programme progressive or degenerating?
- philosophy: praxis/theory-practice-unity — Theory and practice must inform each other
- philosophy: praxis/spiral-not-pipeline — Development is iterative spiraling, not linear
- philosophy: error-statistics/severity-principle — Tests must probably detect errors if present
- philosophy: schon/reflection-in-action — Reflection during practice vs after
- philosophy: cybernetics/requisite-variety — Sensor variety must match problem variety
- philosophy: stiegler/tertiary-retention — Externalized memory shapes what's thinkable
- philosophy: cartwright/scope-conditions — Lessons are local capacity claims, not universal laws

## Situation

### The QT22-31 Session as Microcosm

A single bug report (Issue #15: Codex TOML backslash breakage) triggered a cascade that exposed multiple pipeline gaps:

1. **Detection gap**: Three platform changes (Codex agents, Gemini template processing, OpenCode .jsonc) went undetected for weeks/months. No sensor covers external platform evolution.

2. **False premise gap (QT29)**: Validated Codex agent files against `config.schema.json` (the wrong schema — it covers `config.toml`, not agent role files). Shipped a "fix" removing `description`. Discovered the published schema wasn't the source of truth for agent files. Reverted. The entire QT29 lifecycle — premise → action → discovery → revert — happened outside any epistemic safeguard. The deliberation skill's Step 2.5 (severe testing) didn't apply because QT29 was a quick task.

3. **Local patch invisibility**: User had manually patched 3 installed Codex files to correct false capability claims (e.g., "Codex cannot spawn sub-agents" — false since Jan 2026). These patches were invisible to the system. QT31 eventually upstreamed them, but only because the user noticed and requested it.

4. **Model mapping drift**: `model-profiles.md` ships with Claude-specific language (`opus`/`sonnet`/`haiku`). These are stable aliases in Claude Code but meaningless in Codex (needs `gpt-5.4` + reasoning effort). User locally patched the installed file with a Codex Resolution section. Source file remains Claude-only.

### Two Categories of Stale Content

Investigation reveals the staleness problem is not uniform:

| Category | Example | Change frequency | Detection difficulty | Correct response |
|----------|---------|------------------|---------------------|-----------------|
| **Capability claims** | "Codex cannot spawn sub-agents" | Low (platform adds feature) | Medium (upstream diff, schema diff) | Update source file, rebuild |
| **Model mappings** | `opus` → `gpt-5.4` | High (new models launch regularly) | Hard (no schema, requires judgment) | Platform-specific: Claude auto-resolves; Codex needs explicit versioned names + reasoning effort |

The strategies differ per platform:
- **Claude Code**: Symbolic names (`opus`/`sonnet`/`haiku`) auto-resolve to latest. Inherently adaptive. No maintenance needed.
- **Codex**: Versioned names only (`gpt-5.4`, `gpt-5.4-mini`). Separate `model_reasoning_effort` parameter (minimal/low/medium/high/xhigh). Goes stale when new models launch. No stable aliases available. However, if no model is specified, Codex defaults to the recommended model — reasoning effort can be varied independently.
- **Gemini CLI**: Has "Auto (Gemini 3)" and "Auto (Gemini 2.5)" modes that automatically select the best model. Similar to Claude's stable aliases.
- **OpenCode**: Unknown naming conventions (not yet configured locally).

### What Prior Deliberations Already Covered

| Deliberation | What it solved | Remaining gap |
|-------------|---------------|---------------|
| signal-lifecycle-closed-loop-gap | Programmatic lifecycle transitions; design principle that critical transitions must be scripts/hooks not agent instructions | The pipeline chain from "user notices problem" → "local fix" → "signal" → "source fix" → "verification" doesn't exist |
| platform-change-monitoring | Change detection (upstream diff + schema diff) as triggers; integration testing as validation | Covers detection of external changes, not the response pipeline or content that changes at different rates |
| epistemic-health-and-variety | Epistemic health probes; warrant typing | Still open; complementary to this deliberation's concerns about epistemic rigor |

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `model-profiles.md` source vs installed Codex copy | Source has Claude-only content; installed copy locally patched with Codex Resolution section mapping opus→gpt-5.4+xhigh, sonnet→gpt-5.4+high, haiku→gpt-5.4-mini+medium | Yes (read both files) | informal |
| `~/.codex/models_cache.json` | Codex uses versioned model names (`gpt-5.4`, `gpt-5.4-mini`), no stable aliases | Yes (read file) | informal |
| Codex docs (developers.openai.com/codex/models) | No "latest" alias; default model used when none specified; reasoning effort is separate param | Yes (web fetch) | informal |
| Gemini CLI docs (geminicli.com/docs/cli/model/) | Has "Auto" modes that auto-select best model per generation | Yes (web fetch) | informal |
| Claude Code model parameter | Accepts `opus`/`sonnet`/`haiku` as stable symbolic names that auto-resolve | Yes (runtime behavior) | informal |
| QT29 shipped-then-reverted | False premise (wrong schema) led to shipped fix → reverted | Yes (commit history) | informal |
| 3 locally patched Codex files (capability claims) | User fixes invisible to system, overwritten on reinstall | Yes (sig-2026-03-19) | sig-2026-03-19-stale-platform-claims-in-source |
| 5 locally patched Codex files (model mapping + workflows) | model-profiles.md, model-profile-resolution.md, set-profile.md, settings.md, help.md all patched | Yes (hash manifest comparison) | informal |
| install.js `replacePathsInContent()` | Does path conversion but zero model name translation | Yes (code read) | informal |
| gsd-tools.js `MODEL_PROFILES` constant + `resolveModelInternal()` | Hardcoded Claude symbolic names; returns opus/sonnet/haiku with no per-runtime mapping | Yes (code read, line 130-142) | informal |

## Framing

**Core question:** How should GSD Reflect's self-improvement pipeline be designed so that:
1. Every intervention is **epistemically grounded** (premises tested before action)
2. The full chain is **traceable** (observation → signal → deliberation → plan → commit → verification)
3. **Local fixes flow back** into the system rather than being invisible and overwritten
4. **Runtime-specific content** (model mappings, capability claims) stays current — with per-platform strategies matching each platform's adaptation characteristics

**Adjacent questions:**
- Should model profiles use a runtime-resolved mapping table (in gsd-tools.js or installer) rather than a static Markdown reference?
- How do we detect when model mappings become stale for platforms without stable aliases?
- Can the local patch detection (already in installer via hash manifest) be connected to the signal pipeline?
- Should epistemic safeguards (severe testing) extend beyond deliberations to quick tasks?

## Analysis

### Concern 4: Per-Platform Model Resolution (resolved)

Three options were explored:

#### Option A: Install-Time Model Table Injection

- **Claim:** Source files should use cross-runtime language with per-runtime resolution sections. The installer injects the correct content at install time. For Codex: symbolic tiers map to concrete model+reasoning_effort pairs.
- **Grounds:** The installer already does per-runtime content conversion (path replacement, frontmatter stripping, TOML generation). Model mapping is another content conversion. User's local patches demonstrate the correct target state.
- **Warrant:** Install time is when the target runtime is known. The mapping lives in the source files, maintained per GSD release. Claude's symbolic names auto-resolve; Codex needs explicit pairs; Gemini has Auto modes.
- **Rebuttal (initial):** "Goes stale between GSD releases when new models launch." However, research falsified the severity of this concern: (a) Codex has a default model if none specified, so reasoning effort alone could work for most tiers; (b) model launches are infrequent enough that GSD patch releases can track them; (c) the user's local patch approach (explicit model+effort table) is pragmatic and mirrors how the user already configures their Codex CLI.
- **Qualifier:** Probably correct. The staleness risk exists but is manageable and acceptable.

#### Option B: Runtime-Resolved Mapping in Config (rejected)

- **Claim:** Add `model_mappings` to `.planning/config.json` where users define their own mappings.
- **Rebuttal:** Adds configuration burden for a problem that can be solved at install time. New users won't know what to put. Overengineered for the current use case.

#### Option C: Hybrid — Ship Defaults, Allow Override (rejected)

- **Claim:** Ship per-runtime defaults, allow user override via config.
- **Rebuttal:** Combines the complexity of both approaches without clear benefit over Option A alone. If defaults are correct (which they need to be for Option A anyway), overrides are rarely needed.

**Resolution:** Option A. The user's existing local patches demonstrate the target state:
- `model-profiles.md`: Cross-runtime language + Codex Resolution section with model+effort pairs
- `model-profile-resolution.md`: Runtime-native resolution pattern with reasoning_effort as a parameter
- Related workflow files (set-profile, settings, help): Updated for cross-runtime model awareness

**Key insight from research:** The haiku tier maps to a different, smaller model (`gpt-5.4-mini`) not just lower reasoning effort on the same model. This means "reasoning effort only" is insufficient — model name + effort as a pair is required for Codex. This pair goes stale but is maintainable per GSD release.

### Concerns 1-3: Design Principles for Future Milestones

These broader pipeline questions are not quick-taskable but produce design principles:

1. **Epistemic grounding beyond deliberations:** The QT29 false positive happened in a quick task where no severe testing applies. Design principle: *Any intervention based on an external source of truth should verify that source is authoritative for the specific claim before acting.* This is a process guideline, not infrastructure.

2. **Full-chain traceability:** The pieces exist (signals, deliberations, plans, commits, verification) but links between them are inconsistent. The signal-lifecycle-closed-loop-gap deliberation addressed the programmatic transition piece. Remaining: linking local patches back into the signal pipeline. This belongs in a future milestone.

3. **Local patch lifecycle:** The installer already detects local patches via hash manifest and backs them up. The missing piece is: surfacing patch existence as a signal or health check finding. Design principle: *Local patches are observations — they indicate the system's outputs were wrong. The patch detection mechanism should connect to the signal pipeline so patches become traceable interventions.* Implementation: a health check probe or signal-collection sensor that reads the manifest, detects modifications, and creates signals.

## Tensions

1. **Adaptivity vs. Explicitness:** Claude auto-resolves model names; Codex requires explicit versioned names. The system must be adaptive where platforms support it and explicit where they don't. No single strategy covers all platforms.

2. **Staleness vs. Simplicity:** Embedding model names means they go stale. But the alternatives (config overrides, runtime resolution) add complexity. The pragmatic middle: accept that model tables need periodic updates, and make the update easy (one section in one file).

3. **Local patches as bugs vs. features:** Local patches indicate the system was wrong (bug) but also represent user customization (feature). The pipeline should distinguish: patches that correct false content should flow back to source; patches that customize behavior should be preserved across updates (which the reapply-patches mechanism already handles).

4. **Epistemic rigor vs. velocity:** Requiring severe testing for every quick task would slow the workflow significantly. But QT29 shows what happens without it. The resolution: apply epistemic rigor to *claims about external systems* specifically, not to all code changes.

## Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | After upstreaming model profile patches, Codex agents will receive correct model+reasoning_effort context without local patching | Next Codex install from source | Codex install still shows Claude-only model language |
| P2 | The next OpenAI model launch (after gpt-5.4) will require updating the Codex Resolution table — this update will be a single-file edit taking <5 minutes | Next major OpenAI model release | Update requires changes to >2 files or takes >30 minutes |
| P3 | Local patch detection connected to signal pipeline (future) will surface at least one user-patch-driven signal within the first milestone of operation | First health check run after implementation | No patches detected despite known local customizations |
| P4 | The QT29 false positive pattern will not recur for claims about external platform schemas, because the process lesson ("verify the source is authoritative") is now documented | Next 5 quick tasks involving external platform validation | A quick task ships a fix based on an unverified external source claim |

## Decision Record

**Decision:** Four-part conclusion:
1. **Model mapping (immediate):** Install-time injection (Option A). Upstream user's local patches to source files. Cross-runtime language + per-runtime resolution sections. Quick task.
2. **Broader epistemic rigor:** Design principle, not infrastructure. Apply severe testing to claims about external systems in all intervention types. Document in PROJECT.md.
3. **Local patch lifecycle:** Future milestone scope. Connect installer's patch detection to signal pipeline via health check probe or sensor.
4. **Full-chain traceability:** Partially addressed by prior deliberations (signal-lifecycle-closed-loop-gap). Remaining gaps (local patch → signal flow) deferred to future milestone.

**Decided:** 2026-03-19
**Implemented via:** QT32 (model mapping patches — immediate), design principles (PROJECT.md — immediate), future milestone phases (local patch lifecycle, traceability — deferred)
**Signals addressed:** sig-2026-03-19-stale-platform-claims-in-source (partially — model mapping aspect)

## Evaluation

<!-- Filled when status moves to evaluated -->
