# Requirements: GSD Reflect v1.14

**Defined:** 2026-02-11
**Core Value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

## v1.14 Requirements

Requirements for multi-runtime interop milestone. Each maps to roadmap phases.

### Runtime Abstraction

- [ ] **ABST-01**: Installer splits 313+ `~/.claude/` path references into runtime-specific (commands, agents) vs shared (`~/.gsd/`) categories
- [ ] **ABST-02**: Runtime capability matrix exists as a first-class artifact declaring per-runtime tool availability
- [ ] **ABST-03**: Agent specs use feature detection (`has_capability('task_tool')`) not runtime detection (`if runtime === 'codex'`)
- [ ] **ABST-04**: Degraded behavior is documented per runtime (what runs sequentially instead of parallel, what features are unavailable)

### Knowledge Base Migration

- [ ] **KB-01**: Knowledge base migrated from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` with identical directory structure
- [ ] **KB-02**: Installer creates `~/.gsd/knowledge/` directory structure (signals/, spikes/, lessons/) on install
- [ ] **KB-03**: Backward-compatible symlink bridge at old location pointing to new location
- [ ] **KB-04**: Automated migration detects existing `~/.claude/gsd-knowledge/` and copies contents to new location
- [ ] **KB-05**: `GSD_HOME` environment variable overrides `~/.gsd/` default location
- [ ] **KB-06**: All 20+ workflow/reference/agent files updated to use `~/.gsd/knowledge/` path

### Codex CLI Integration

- [ ] **CODEX-01**: Installer accepts `--codex` flag and installs GSD commands as Codex Skills (SKILL.md format)
- [ ] **CODEX-02**: Installer generates `~/.codex/AGENTS.md` with GSD workflow instructions
- [ ] **CODEX-03**: Installer installs reference docs to `~/.codex/get-shit-done/`
- [ ] **CODEX-04**: Path replacement converts `~/.claude/` to `~/.codex/` in Codex-installed files
- [ ] **CODEX-05**: `--all` flag includes Codex as 4th runtime
- [ ] **CODEX-06**: Codex capability limitations documented (no Task tool, no hooks, no tool restrictions)
- [ ] **CODEX-07**: `codex exec` non-interactive mode supported for scripted/CI usage

### Cross-Runtime Handoff

- [ ] **HAND-01**: User can `/gsd:pause-work` in Claude Code and resume work in Codex CLI with full state restoration
- [ ] **HAND-02**: `.continue-here.md` stores semantic state (phase, task, decisions) not procedural commands
- [ ] **HAND-03**: Resume workflow detects current runtime and renders runtime-appropriate command instructions
- [ ] **HAND-04**: STATE.md and `.planning/` files contain zero runtime-specific hardcoded paths

### Signal Enrichment

- [ ] **SIG-01**: Signal entries include `runtime:` field identifying which runtime generated the signal
- [ ] **SIG-02**: Signal entries include `model:` field identifying which LLM model was in use
- [ ] **SIG-03**: Signal template updated with provider/runtime context fields
- [ ] **SIG-04**: Capability gap events logged as signals when a runtime lacks a required capability

### Existing Runtime Validation

- [ ] **VALID-01**: OpenCode installation verified working after all changes
- [ ] **VALID-02**: Gemini CLI installation verified working after all changes
- [ ] **VALID-03**: Multi-runtime install (`--all` with 4 runtimes) completes successfully
- [ ] **VALID-04**: KB accessible and writable from all installed runtimes

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Token Tracking

- **TOK-01**: Signal entries include token usage metrics for the operation that generated the signal
- **TOK-02**: Reflection engine can analyze token efficiency trends across phases
- **TOK-03**: Per-runtime token cost comparison available in milestone reports

### Advanced Cross-Runtime

- **ADV-01**: Full multi-agent orchestration (wave-based parallel execution) works in Codex CLI
- **ADV-02**: Real-time capability negotiation between runtimes (runtime queries available tools at startup)
- **ADV-03**: Shared MCP server configuration across runtimes

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full subagent parity in Codex | Codex CLI has no Task tool equivalent; designing for graceful degradation instead |
| Writing to Codex config.toml | Codex manages its own configuration; GSD only installs skills and AGENTS.md |
| Codex hook integration | Codex has no SessionStart hook equivalent; update checks happen on explicit GSD command invocation |
| Windows-specific runtime support | Fork targets macOS/Linux; Windows fixes from upstream can be adopted later |
| Runtime-specific test suites | Validate via Claude Code + mechanical installer tests; full per-runtime test suite is future work |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ABST-01 | Phase 13 | Pending |
| ABST-02 | Phase 13 | Pending |
| ABST-03 | Phase 13 | Pending |
| ABST-04 | Phase 13 | Pending |
| KB-01 | Phase 14 | Pending |
| KB-02 | Phase 14 | Pending |
| KB-03 | Phase 14 | Pending |
| KB-04 | Phase 14 | Pending |
| KB-05 | Phase 14 | Pending |
| KB-06 | Phase 14 | Pending |
| CODEX-01 | Phase 15 | Pending |
| CODEX-02 | Phase 15 | Pending |
| CODEX-03 | Phase 15 | Pending |
| CODEX-04 | Phase 15 | Pending |
| CODEX-05 | Phase 15 | Pending |
| CODEX-06 | Phase 15 | Pending |
| CODEX-07 | Phase 15 | Pending |
| HAND-01 | Phase 16 | Pending |
| HAND-02 | Phase 16 | Pending |
| HAND-03 | Phase 16 | Pending |
| HAND-04 | Phase 16 | Pending |
| SIG-01 | Phase 16 | Pending |
| SIG-02 | Phase 16 | Pending |
| SIG-03 | Phase 16 | Pending |
| SIG-04 | Phase 16 | Pending |
| VALID-01 | Phase 17 | Pending |
| VALID-02 | Phase 17 | Pending |
| VALID-03 | Phase 17 | Pending |
| VALID-04 | Phase 17 | Pending |

**Coverage:**
- v1.14 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after roadmap creation*
