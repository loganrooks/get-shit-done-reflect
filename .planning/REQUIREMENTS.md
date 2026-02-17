# Requirements: GSD Reflect v1.15

**Defined:** 2026-02-17
**Core Value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

## v1.15 Requirements

Requirements for Backlog & Update Experience milestone. Each maps to roadmap phases.

### Agent Boilerplate Extraction

- [ ] **AGENT-01**: Shared agent execution protocol extracted into `references/agent-protocol.md` covering git safety, structured returns, tool conventions, and state file paths
- [ ] **AGENT-02**: All 11 agent specs reference shared protocol via `<required_reading>` instead of inline duplication (~600 lines removed per agent)
- [ ] **AGENT-03**: Agent-specific overrides positioned ABOVE shared protocol reference for stronger positional attention
- [ ] **AGENT-04**: Extraction registry documents what sections moved from which agents to shared protocol
- [ ] **AGENT-05**: Before/after output comparison validates no behavior change for each extracted agent

### Feature Manifest Foundation

- [ ] **MANF-01**: `feature-manifest.json` declares config schema for existing features (health_check, devops, release) with typed defaults, scope (user/project), and init prompts
- [ ] **MANF-02**: gsd-tools.js gains manifest subcommands: `manifest diff-config`, `manifest validate`, `manifest get-prompts`
- [ ] **MANF-03**: Installer copies manifest file to installed location alongside other GSD files
- [ ] **MANF-04**: Manifest is additive-only: describes what CAN exist, not what MUST exist; unknown config fields always preserved
- [ ] **MANF-05**: Manifest version tracked in config.json for upgrade path awareness

### Manifest-Driven Config Migration

- [ ] **MIGR-01**: `/gsd:upgrade-project` reads manifest to detect config gaps and initializes missing sections with defaults or user prompts
- [ ] **MIGR-02**: `/gsd:new-project` uses manifest to gather feature config during project setup (replaces hardcoded config initialization)
- [ ] **MIGR-03**: `/gsd:update` post-install step detects project version gap, surfaces new feature count, offers `/gsd:upgrade-project`
- [ ] **MIGR-04**: Config validation is lenient: warns on unknown fields, never rejects; coerces types where possible; fills missing with defaults
- [ ] **MIGR-05**: Every automated config change appends to `migration-log.md` with timestamp and diff
- [ ] **MIGR-06**: Interrupted migration leaves config in valid state (each field addition is atomic)

### Backlog System Core

- [ ] **BLOG-01**: Backlog items stored as Markdown files with YAML frontmatter (id, title, tags, theme, priority, status, promoted_to, source) in `.planning/backlog/items/`
- [ ] **BLOG-02**: Global backlog at `~/.gsd/backlog/items/` for cross-project ideas (mirroring KB two-tier pattern)
- [ ] **BLOG-03**: gsd-tools.js gains backlog subcommands: `backlog add`, `backlog list`, `backlog group`, `backlog update`, `backlog promote`, `backlog stats`, `backlog index`
- [ ] **BLOG-04**: `/gsd:add-todo` extended with optional `priority` (HIGH/MEDIUM/LOW), `source` (command/phase/conversation), and `status` (pending/triaged/planned/done) frontmatter fields
- [ ] **BLOG-05**: Existing todos auto-default to `priority: MEDIUM, source: unknown, status: pending` -- no migration required for reading
- [ ] **BLOG-06**: STATE.md `### Pending Todos` preserved as lightweight index with links to detail files -- NOT replaced
- [ ] **BLOG-07**: Auto-generated `index.md` in backlog directories (matching KB index pattern)

### Backlog Workflow Integration

- [ ] **BINT-01**: `/gsd:new-milestone` Step 2 reads backlog items, groups by theme/tags, presents with priority, lets user multi-select for milestone scope
- [ ] **BINT-02**: Selected backlog items updated to `status: planned, milestone: vX.Y` with `promoted_to` linking to requirement ID
- [ ] **BINT-03**: `/gsd:check-todos` gains "promote to backlog" action and priority/status filter support
- [ ] **BINT-04**: `/gsd:complete-milestone` includes backlog review step for un-promoted items
- [ ] **BINT-05**: All readers of todo/backlog data enumerated and verified (init, STATE.md, check-todos, resume-work, backlog commands) -- preventing v1.14 data loss pattern

### Workflow DX & Reliability

- [ ] **DX-01**: `/gsd:quick` detects trivial tasks (short description, single concern) and skips planner spawn for direct inline execution
- [ ] **DX-02**: Complex tasks detected by `/gsd:quick` fall back to full planner+executor flow unchanged
- [ ] **DX-03**: Installer wraps file operations in try-catch with descriptive error messages (fs.mkdirSync, fs.cpSync, fs.renameSync)
- [ ] **DX-04**: Shell scripts use portable constructs (`${GSD_HOME:-$HOME/.gsd}`, portable `mktemp`, `set -o pipefail`)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### MCP Server Infrastructure

- **MCP-01**: GSD MCP server with structured write tools (write_signal, write_lesson, write_summary) replacing inline file loading
- **MCP-02**: MCP read tools (search_kb, get_state, get_config) for targeted queries instead of full file loads
- **MCP-03**: Token observability via OpenTelemetry integration and MCP server-side metrics

### Advanced Backlog

- **ABLOG-01**: Cross-project backlog analytics (capture rate, triage rate, graduation-to-milestone rate)
- **ABLOG-02**: External issue tracker sync (GitHub Issues, Linear) as optional integration
- **ABLOG-03**: AI-assisted triage recommendations during milestone planning based on theme alignment

### Self-Review

- **REV-01**: PR code reviewer agent (`gsd-reviewer`) producing structured findings
- **REV-02**: Review findings automatically create signals in the knowledge base

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Web UI / Kanban board for backlog | GSD is CLI-native, zero-dependency; visual boards violate portability promise |
| Automatic priority scoring | Priority is subjective; auto-scoring creates false confidence |
| Real-time sync across sessions | Requires server/WebSocket; git commit is the sync mechanism |
| Mandatory backlog grooming gates | Users have different workflows; nudge, don't block |
| Config migration rollback scripts | Config changes are additive with defaults; nothing to undo |
| Backlog item dependencies | Over-engineering; dependencies belong in roadmap phases, not raw backlog |
| Strict config validation (reject on unknown) | Breaks every existing project; lenient validation only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGENT-01 | Phase 22 | Pending |
| AGENT-02 | Phase 22 | Pending |
| AGENT-03 | Phase 22 | Pending |
| AGENT-04 | Phase 22 | Pending |
| AGENT-05 | Phase 22 | Pending |
| MANF-01 | Phase 23 | Pending |
| MANF-02 | Phase 23 | Pending |
| MANF-03 | Phase 23 | Pending |
| MANF-04 | Phase 23 | Pending |
| MANF-05 | Phase 23 | Pending |
| MIGR-01 | Phase 24 | Pending |
| MIGR-02 | Phase 24 | Pending |
| MIGR-03 | Phase 24 | Pending |
| MIGR-04 | Phase 24 | Pending |
| MIGR-05 | Phase 24 | Pending |
| MIGR-06 | Phase 24 | Pending |
| BLOG-01 | Phase 25 | Pending |
| BLOG-02 | Phase 25 | Pending |
| BLOG-03 | Phase 25 | Pending |
| BLOG-04 | Phase 25 | Pending |
| BLOG-05 | Phase 25 | Pending |
| BLOG-06 | Phase 25 | Pending |
| BLOG-07 | Phase 25 | Pending |
| BINT-01 | Phase 26 | Pending |
| BINT-02 | Phase 26 | Pending |
| BINT-03 | Phase 26 | Pending |
| BINT-04 | Phase 26 | Pending |
| BINT-05 | Phase 26 | Pending |
| DX-01 | Phase 27 | Pending |
| DX-02 | Phase 27 | Pending |
| DX-03 | Phase 27 | Pending |
| DX-04 | Phase 27 | Pending |

**Coverage:**
- v1.15 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after roadmap creation*
