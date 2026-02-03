# Phase 0: Deployment Infrastructure - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the fork installable via `npx get-shit-done-reflect-cc`, testable in isolated environments, and verifiable through CI/CD. This enables proper E2E verification of all subsequent phases. Includes benchmark suite for evaluating GSD versions.

</domain>

<decisions>
## Implementation Decisions

### Install behavior
- Install works exactly like upstream GSD (overwrite files in ~/.claude/)
- Fork maintenance (additive-only development) is a repo concern, not a deployment concern
- No special conflict handling needed — same install behavior as upstream

### Test environment design
- Both mock tests (fast, deterministic) AND real agent tests (actual API calls)
- Both unit tests for components AND E2E tests for full chain
- Tests serve dual purpose: catch regressions AND document behavior
- Comprehensive edge case coverage across all areas:
  - Signal detection edge cases (empty summaries, missing plans, malformed YAML)
  - Install edge cases (existing files, permissions, partial installs)
  - KB write edge cases (index rebuild, cap enforcement, decay)

### CI/CD scope
- GitHub Actions as CI platform
- CI runs on PRs and main branch pushes
- Required checks, workflow structure, publish automation: Claude's discretion

### Local dev workflow
- Symlinks for hot reload: ~/.claude/get-shit-done/ → repo files
- Mac/Linux only — Windows support not required for dev workflow
- Changes reflect immediately without reinstall

### Benchmark suite
- Tiered benchmarks with different token costs:
  - Quick (cheap): Smoke test, basic functionality
  - Standard (moderate): Normal validation
  - Comprehensive (expensive): Full evaluation
- Metrics include process quality, not just output correctness:
  - Signals captured
  - KB usage
  - Deviation handling
- Track benchmark history over time to see trends
- Include failure scenario testing (malformed plans, missing files)
- Context-dependent evaluation: regression acceptable if progress in more important area
- Must validate phase capabilities and milestone completion
- Human judgment in the loop for interpreting results

### Claude's Discretion
- Test framework choice (Jest, Vitest, Node test runner)
- Test isolation approach (temp dirs vs Docker)
- Test coverage thresholds
- When real agent tests run (every PR vs on-demand vs release)
- Fixture organization and structure
- CI workflow structure and required checks
- npm publish automation level
- Dev setup script vs documentation
- Reset command scope and implementation
- Benchmark task design and authoring
- Benchmark comparison methodology
- Benchmark storage and reporting format
- Benchmark timeouts and failure policies

</decisions>

<specifics>
## Specific Ideas

- "The install should just do what GSD does" — no special handling, same behavior as upstream
- Symlinks are the simplest hot reload solution — essentially free
- Benchmark evaluation needs nuance: "might regress in an irrelevant area but progress in an important way"
- Tests should push the system to its limits but stay token-efficient (3-5 phases)

</specifics>

<deferred>
## Deferred Ideas

- Cross-deployment signal aggregation for improvement proposals — would require telemetry, privacy considerations, consent mechanisms. Potentially valuable for understanding how GSD performs across different users/projects, but significantly beyond Phase 0 scope.

</deferred>

---

*Phase: 00-deployment-infrastructure*
*Context gathered: 2026-02-03*
