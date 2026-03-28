# Feature Overlap Inventory

**Analysis date:** 2026-03-28
**Fork version:** v1.17.5 (post-Phase 53, modular runtime with 16 lib/*.cjs modules)
**Upstream version:** v1.30.0 (17 lib/*.cjs modules)
**Methodology:** Module-level `git diff` against v1.22.4 baseline, cross-referenced with feature documentation and 54-UPSTREAM-ANALYSIS.md design philosophy comparison

## Classification Framework

| Disposition | Meaning | Action Implication |
|-------------|---------|-------------------|
| **Converging** | Both sides building toward the same thing, implementations may merge | Track for future reconciliation |
| **Complementary** | Different angles on the same concern, both add value | Keep both; resolve naming/interface conflicts |
| **Redundant** | Same problem, conflicting implementations | Evaluate which to keep based on design philosophy |
| **Divergent** | Different philosophy, deliberately different approach | Maintain independently; sync only shared substrate |
| **Behind** | Same problem, fork hasn't gotten to it yet | Candidate for adoption when fork addresses the need |
| **Not Applicable** | Upstream feature irrelevant to fork's use case | Ignore; do not adopt |

## Overlap Matrix

### Cross-Runtime Support

| Domain | Fork Feature | Upstream Feature | Disposition | Notes |
|--------|-------------|-----------------|-------------|-------|
| Runtime support | Claude Code native + converters for Gemini, OpenCode, Codex (QT22-28) | Native support for 7 runtimes (Claude, Codex, Gemini, Windsurf, Copilot, Antigravity, Cursor) | **Divergent** | Fork treats non-Claude runtimes as output targets for conversion. Upstream treats each runtime as a first-class citizen. Different strategies serving different goals. |
| Model profiles | `core.cjs` MODEL_PROFILES, cross-runtime model resolution (QT32) | `model-profiles.cjs` (68 lines), `profile-output.cjs` (952 lines), `profile-pipeline.cjs` (539 lines) | **Converging** | Both solve "which model for which agent on which runtime." Fork's approach is compact (in core.cjs); upstream's is a full pipeline. Reconciliation possible at the model-resolution interface. |
| Codex TOML generation | `copyWithPathReplacement` with isCommand/isGlobal params (QT27), TOML conversion | Codex install with `[features]` repair, absolute agent paths | **Complementary** | Fork generates Codex config via converter. Upstream maintains native Codex support. Non-conflicting because they target different install flows. |

### Quality & Verification

| Domain | Fork Feature | Upstream Feature | Disposition | Notes |
|--------|-------------|-----------------|-------------|-------|
| Health monitoring | `health-probe.cjs` (644 lines): signal-density, automation-watchdog, validation-coverage probes; cached score; traffic light statusline | `/gsd:health` workflow: `.planning/` directory integrity, `--repair` flag | **Complementary** | See Worked Example below. Different levels of the same concern. |
| Verification pipeline | Signal-informed verification, must_haves frontmatter, Nyquist validation | Structured verification with SC cross-check, node repair operator, regression gates | **Complementary** | Both extend verification but from different angles. Fork adds epistemic depth; upstream adds structural rigor and automated retry. |
| UAT tracking | Verification workflows + health probes (epistemic) | `uat.cjs` (282 lines): per-phase verification debt tracking | **Behind** | Fork has no structured UAT debt tracking. Upstream's uat.cjs fills a gap the fork has not addressed. |
| Security scanning | None | `security.cjs` (382 lines): prompt injection guards, path traversal prevention, input validation; CI scanning workflows | **Behind** | Fork lacks security scanning entirely. Different threat models (single trusted user vs untrusted community) but basic security hardening is universally needed. |

### Process & Knowledge Management

| Domain | Fork Feature | Upstream Feature | Disposition | Notes |
|--------|-------------|-----------------|-------------|-------|
| Signal pipeline | Full pipeline: capture -> classify -> synthesize -> KB. 139 signals across 7 milestones. `sensors.cjs` (148 lines), `backlog.cjs` (353 lines) | None | **Fork-only** | Upstream has no equivalent. Issues are reported by users, not captured systematically by the tool itself. |
| Knowledge base | Cross-project KB with surfacing, lessons, spikes. `~/.gsd/knowledge/` + `.planning/knowledge/` | Persistent debug KB (v1.24.0) in `.planning/debug/knowledge-base.md` | **Divergent** | Both store learned knowledge, but at very different scales and with different models. Fork's KB is cross-project, typed (lesson/spike), and has automated surfacing. Upstream's is per-project debug-only. |
| Deliberations | Persistent design thinking with revision lineage, citation stability. Dedicated `.planning/deliberations/` directory | None | **Fork-only** | Upstream has no deliberation system. Architectural decisions are made in issues/PRs without formal preservation. |
| Automation framework | `automation.cjs` (465 lines): FEATURE_CAPABILITY_MAP, level-based triggering, maturity gating, deferral logic | Auto-advance pipeline, `--auto` flag, SDK headless execution | **Divergent** | Both automate execution, but with opposite philosophies. Fork gates automation on project maturity. Upstream enables full autonomy from the start. |

### Workflow & Commands

| Domain | Fork Feature | Upstream Feature | Disposition | Notes |
|--------|-------------|-----------------|-------------|-------|
| Autonomous execution | Graduated: FEATURE_CAPABILITY_MAP determines what automation fires at each level | Full autonomous: SDK `init` + `auto`, `--auto` flag chains entire milestone | **Divergent** | Fork's maturity-gating vs upstream's full-autonomy. Design philosophy difference. |
| Agent skill injection | Feature manifest-driven capability gating (`manifest.cjs`, 457 lines) | Config-driven `agent_skills` section (#1355) | **Converging** | Both inject capabilities into agents, but through different mechanisms. Fork uses declarative manifest; upstream uses config. Could reconcile at the capability-declaration interface. |
| Workstream namespacing | None | `workstream.cjs` (491 lines): parallel milestone/workstream management | **Not Applicable** | Fork is single-project, single-user. Multi-project workstreams are irrelevant. |
| Developer profiling | None | `profile-output.cjs` (952 lines), `profile-pipeline.cjs` (539 lines): session analysis across 8 dimensions | **Not Applicable** | Developer profiling serves multi-user adoption. Single-user scholarly tool has no need. |
| SDK / headless CLI | None | GSD SDK with `gsd-sdk init` + `gsd-sdk auto` | **Divergent** | Fork's epistemic approach requires human-in-the-loop judgment. Headless execution removes the human. |
| Context monitoring | Context-monitor hook -> bridge file -> automation deferral (Phase 52) | Context window monitor hook with WARNING/CRITICAL alerts (v1.20.6) | **Converging** | Both monitor context window usage. Fork integrates with automation deferral; upstream alerts the user. Shared concern, different responses. |
| Cross-phase regression | None | Cross-phase regression gate: execute-phase runs prior phases' test suites (v1.26.0) | **Behind** | Fork has no cross-phase regression testing. Valuable quality feature the fork should evaluate. |

### Infrastructure

| Domain | Fork Feature | Upstream Feature | Disposition | Notes |
|--------|-------------|-----------------|-------------|-------|
| Installer | Fork-branded `bin/install.js` with REFLECT banner, version-check hook, migration guide generation (Phase 51) | Multi-runtime interactive installer, `--sdk` flag, `--all` flag, config repair | **Complementary** | Both maintain the same installer file with different extensions. Fork adds migration guides; upstream adds runtime selection. Non-conflicting regions. |
| Config migration | `manifest.cjs` (457 lines): migration specs, version-based upgrade chains, `granularity` rename | `planningPaths()` consolidation, `commit_docs` gitignore auto-detection, workstream-aware signatures | **Complementary** | Fork has structured migration framework. Upstream has ad-hoc config improvements. Fork's approach is more systematic. |
| CI hooks | `gsd-ci-status.js`, `gsd-statusline.js`, `gsd-health-check.js`, `gsd-version-check.js` | Same base hooks + security CI scanning, stale hook detection | **Complementary** | Shared hook infrastructure with fork-specific additions (health-check, version-check) and upstream-specific additions (security scanning). |
| i18n | None | Korean, Portuguese, Japanese documentation | **Not Applicable** | Single-user English-language tool. |

## Worked Example: Health vs Health-Check

This example illustrates the classification methodology applied to the most instructive overlap between fork and upstream.

### What Each Side Built

**Upstream `/gsd:health`** (added v1.20.0):
- Validates `.planning/` directory structural integrity
- Checks: config.json exists and is valid JSON, STATE.md exists and is parseable, required directories present, ROADMAP.md exists
- `--repair` flag: auto-fixes config.json and STATE.md by regenerating from templates
- Invocation: manual, via `/gsd:health` command
- Output: text report listing issues found, with fix suggestions

**Fork `/gsdr:health-check`** (added Phase 41, deep integration Phase 53):
- Measures epistemic health via configurable probes in `health-probe.cjs` (644 lines)
- Probes: `signal-density` (are signals being captured?), `automation-watchdog` (is automation firing appropriately?), `validation-coverage` (are plans meeting their must_haves?)
- Automation: SessionStart hook triggers health check, reactive threshold caching, staleness detection
- Output: traffic light score (GREEN/YELLOW/RED) displayed in statusline via `gsd-health-score.json`
- Integration: cached score feeds into automation deferral decisions

### Why "Complementary" (Not Redundant)

These features address **different levels of the same concern**:

1. **Upstream's concern:** "Is the project structure valid?" -- a prerequisite. If `.planning/` is corrupted, nothing works.
2. **Fork's concern:** "Is the project's epistemic health good?" -- a higher-order question. Even with valid structure, the process may be failing to learn from mistakes.

The naming collision (`health` vs `health-check`) is confusing but not a functional conflict. They are separate commands with separate workflows targeting separate layers:

```
Layer 0: Structural integrity (upstream /gsd:health)
  "Do the files exist? Is the config valid?"

Layer 1: Epistemic health (fork /gsdr:health-check)
  "Are signals being captured? Is automation firing? Are plans meeting criteria?"
```

### Integration Path

If both were to coexist:
- Upstream's structural checks could serve as a prerequisite gate for the fork's epistemic probes (no point measuring signal density if STATE.md is corrupted)
- The naming conflict would need resolution (e.g., fork's probe becomes `health-check` while upstream's structural check stays `health`, or both unify under `health` with subcommands `health structural` / `health epistemic`)
- The fork already adopted upstream's structural checks implicitly through the modular runtime -- the shared `state.cjs`, `config.cjs`, and `core.cjs` modules include upstream's integrity logic

### Analytical Pattern

This example establishes the pattern for classifying other overlaps:

1. **Identify what each side built** (concrete features, not labels)
2. **Determine what concern each addresses** (the "why," not the "what")
3. **Compare the concern level** (structural vs epistemic, reactive vs proactive, breadth vs depth)
4. **Classify based on relationship** (same concern, same level = redundant; same concern, different level = complementary; different concern = divergent)
5. **Identify integration path** (if complementary/converging: how would they coexist?)

## Behind vs Intentionally Different

For each feature gap, this section explicitly classifies using the design philosophy comparison from 54-UPSTREAM-ANALYSIS.md.

### Behind (Same Problem, Fork Will Likely Address)

These are features where the fork agrees with the need but has not yet implemented:

| Feature Gap | Upstream Implementation | Why the Fork Needs This Too | Priority |
|------------|------------------------|---------------------------|----------|
| **Security scanning** | `security.cjs` (382 lines): prompt injection, path traversal, input validation | Security hardening is universally needed regardless of user count or design philosophy. The fork's single-user context has a simpler threat model but is not zero-threat. | Medium -- lower urgency than upstream (no untrusted input) but still a gap |
| **UAT debt tracking** | `uat.cjs` (282 lines): per-phase verification debt | The fork tracks epistemic health but not structured verification debt. Knowing which verifications are outstanding would strengthen the health probe pipeline. | Medium -- would complement existing health probes |
| **Cross-phase regression** | Execute-phase runs prior phases' test suites (v1.26.0) | Regression prevention across phases is a quality concern the fork shares. The fork's signal pipeline catches regressions post-hoc; upstream's regression gate prevents them. | Medium -- proactive prevention complements reactive detection |
| **Requirements coverage gate** | Plan-phase verifies all phase requirements are covered (v1.26.0) | The fork has `must_haves` in plan frontmatter but no automated gate checking that all roadmap requirements are addressed by plans. | Low -- the fork's must_haves approach is more granular |

### Intentionally Different (Philosophy Drives Different Approach)

These are features where the fork's design philosophy leads to a fundamentally different solution:

| Feature Gap | Upstream Approach | Fork's Different Approach | Why Different |
|------------|-------------------|--------------------------|---------------|
| **Full autonomous execution** | SDK headless CLI (`gsd-sdk init` + `auto`), `--auto` flag chains entire milestones | Graduated automation via FEATURE_CAPABILITY_MAP, maturity-gated triggering | Fork's core value is "never make the same mistake twice" -- this requires human judgment at key decision points. Full autonomy removes the human whose learning the system is designed to improve. |
| **Runtime breadth** | 7 native runtimes (Claude, Codex, Gemini, Windsurf, Copilot, Antigravity, Cursor) | 1 native runtime (Claude Code) + 3 converters (Gemini, OpenCode, Codex) | Fork optimizes for depth of integration with one runtime. Converters provide pragmatic multi-runtime output without the maintenance burden of native support. |
| **Quality monitoring** | Reactive: user-reported issues drive fixes; structural health checks | Proactive: signal pipeline, health probes, knowledge base surfacing | Different quality philosophies. Upstream's reactive approach scales with user reports. Fork's proactive approach scales with process maturity. |
| **Knowledge management** | Per-project debug KB (v1.24.0) | Cross-project KB with typed entries (lessons, spikes), automated surfacing, index | Upstream stores debug outcomes locally. Fork treats knowledge as a first-class cross-project resource with retrieval at the point of need. |
| **Extensibility model** | Config-driven agent skills (#1355), user skill injection | Feature manifest with capability map, hook-dependent gating, automation levels | Upstream lets users inject arbitrary skills. Fork declares capabilities in a manifest and gates them on project maturity and context. |
| **Developer profiling** | Full profiling pipeline (profile-output.cjs, profile-pipeline.cjs) | None -- single user, known preferences | Upstream's profiling personalizes experience for diverse users. Fork knows its user. |

### Not Applicable (No Fork Relevance)

| Feature | Upstream Purpose | Why Not Applicable |
|---------|-----------------|-------------------|
| **i18n** (Korean, Portuguese, Japanese) | International community accessibility | Fork is a single-user English-language scholarly tool |
| **Workstream namespacing** (`workstream.cjs`) | Multi-project parallel work | Fork is single-project |
| **Multi-repo workspace** | Monorepo/multi-repo management | Fork operates in one repository |
| **Developer profiling pipeline** | User experience personalization at scale | Single user with known preferences |
| **Qwencode/LM Studio/Zed runtime requests** | Expanding runtime coverage | Fork uses Claude Code; converters cover pragmatic needs |

## Module-Level Divergence Summary

Post-modularization (Phase 45-48), the fork and upstream have different module inventories:

### Fork Modules (16)

| Module | Lines | Category | Fork Content |
|--------|-------|----------|-------------|
| `health-probe.cjs` | 644 | **Fork-only** | Signal-density, automation-watchdog, validation-coverage probes |
| `automation.cjs` | 465 | **Fork-only** | FEATURE_CAPABILITY_MAP, level-based triggering, automation stats |
| `manifest.cjs` | 457 | **Fork-only** | Feature manifest loading, migration specs, self-test |
| `backlog.cjs` | 353 | **Fork-only** | Signal management, KB operations |
| `sensors.cjs` | 148 | **Fork-only** | CI, artifact, git sensors for signal pipeline |
| `core.cjs` | 262 diff | **Hybrid** | parseIncludeFlag, loadManifest, loadProjectConfig, atomicWriteJson, MODEL_PROFILES added to upstream base |
| `init.cjs` | 253 diff | **Hybrid** | Fork-specific init overrides, --include flag |
| `commands.cjs` | 178 diff | **Hybrid** | Fork command routing additions |
| `config.cjs` | 117 diff | **Hybrid** | Fork config handling additions |
| `frontmatter.cjs` | 110 diff | **Hybrid** | Signal schema validation, tiered validation |
| `phase.cjs` | 57 diff | **Mostly upstream** | Minor fork adjustments |
| `roadmap.cjs` | 42 diff | **Mostly upstream** | Minor fork adjustments |
| `milestone.cjs` | 0 diff | **Pure upstream** | Adopted unchanged |
| `state.cjs` | 0 diff | **Pure upstream** | Adopted unchanged |
| `template.cjs` | 0 diff | **Pure upstream** | Adopted unchanged |
| `verify.cjs` | 0 diff | **Pure upstream** | Adopted unchanged |

### Upstream-Only Modules (6, not in fork)

| Module | Lines | Category | Fork Equivalent |
|--------|-------|----------|----------------|
| `workstream.cjs` | 491 | Enterprise scale | None (not applicable) |
| `security.cjs` | 382 | Security hardening | None (behind) |
| `model-profiles.cjs` | 68 | Model resolution | Partial: core.cjs MODEL_PROFILES (converging) |
| `profile-output.cjs` | 952 | Developer profiling | None (not applicable) |
| `profile-pipeline.cjs` | 539 | Developer profiling | None (not applicable) |
| `uat.cjs` | 282 | Verification debt | Partial: health probes (complementary) |

### Summary Counts

| Category | Count | Modules |
|----------|-------|---------|
| Fork-only | 5 | automation, backlog, health-probe, manifest, sensors |
| Hybrid (fork modifications on upstream base) | 6 | core, init, commands, config, frontmatter, phase(+roadmap) |
| Pure/mostly upstream | 4 | milestone, state, template, verify |
| Upstream-only (not in fork) | 6 | workstream, security, model-profiles, profile-output, profile-pipeline, uat |

**Total unique modules:** 22 (16 in fork, 17 in upstream, 11 shared).

## Integration Opportunities

These are areas where the fork could benefit from upstream's work without conflicting with its own philosophy. They are **observations for future planning**, not recommendations for immediate action.

### High Alignment (Shared Substrate)

1. **Bug fixes in shared modules.** Upstream's fixes to `state.cjs`, `milestone.cjs`, `template.cjs`, and `verify.cjs` (the pure-upstream modules) can be adopted wholesale since the fork has not modified these modules. This is the lowest-friction sync path.

2. **Security hardening.** Both projects need basic security. `security.cjs` addresses prompt injection and path traversal -- concerns that apply regardless of user count. The fork could adopt the module and scope it to its threat model.

3. **Cross-phase regression gate.** Running prior phases' test suites during execution is a quality feature that aligns with the fork's proactive quality philosophy. This would complement the signal pipeline's post-hoc detection with pre-hoc prevention.

### Medium Alignment (Evaluate First)

4. **UAT debt tracking.** Upstream's `uat.cjs` tracks per-phase verification debt. The fork's health probes measure similar concerns differently. Evaluation needed to determine whether uat.cjs adds value beyond what health-probe.cjs already provides, or whether the two could be integrated.

5. **Model profile reconciliation.** The fork's `core.cjs` MODEL_PROFILES and upstream's `model-profiles.cjs` solve the same problem. A future sync should reconcile these into one approach, likely keeping the fork's compact version but incorporating any upstream improvements.

6. **Context monitor convergence.** Both projects monitor context window usage. The fork's integration with automation deferral is more sophisticated, but upstream's alert thresholds may have useful calibration data.

### Low Alignment (Philosophical Mismatch)

7. **SDK adoption.** Headless autonomous execution conflicts with the fork's graduated automation philosophy. If the fork ever needs CI/CD integration, it would likely build a different solution that preserves human-in-the-loop decision points.

8. **Additional runtimes.** The fork's converter approach is deliberate. Adding native runtime support would increase maintenance surface for marginal benefit to a single-user tool.

---

*This inventory is referenced by 54-UPSTREAM-ANALYSIS.md for design philosophy context and feeds into FORK-STRATEGY.md (Plan 05) for governance policy.*
