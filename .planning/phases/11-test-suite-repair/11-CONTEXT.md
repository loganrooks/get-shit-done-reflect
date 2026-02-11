# Phase 11: Test Suite Repair & CI/CD Validation - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Get all test suites passing and CI/CD pipelines functional after the Phases 7-10 upstream merge and architecture migration. This covers fork vitest tests, upstream gsd-tools tests, and three CI/CD workflows (ci.yml, publish.yml, smoke-test.yml). No new test coverage for unreleased features — this is repair and validation of existing architecture.

</domain>

<decisions>
## Implementation Decisions

### Test Failure Triage
- Tests that validate old inline-command logic: **rewrite for the new thin orchestrator pattern** (not delete)
- Simple breakage (wrong paths, renamed exports, changed config shape): **Claude's discretion** on batch vs individual fix strategy
- Fork tests overlapping upstream gsd-tools tests: **Claude's discretion** — consolidate where clearly redundant, keep both where coverage differs
- Test count target (42+): **Claude's discretion** — coverage quality matters more than raw count; okay to drop below 42 if equivalent coverage exists via updated/upstream tests
- Test repair order: **Claude's discretion** — determine most efficient order based on dependency analysis
- Test style when fixing: **Claude's discretion** — minimal changes for small fixes, clean up structure when rewriting significantly
- Mocking approach: **Claude's discretion** — follow existing patterns in the test suite
- No known broken test files flagged — Claude discovers and triages all failures systematically
- Commit granularity for test fixes: **Claude's discretion** — group commits logically based on plan structure
- Bugs discovered via tests: **Claude's discretion** — small/obvious bugs fix in-phase, larger issues get logged as todos
- Fork-specific values in tests (package name, URLs): **Claude's discretion** — follow established patterns in test suite

### Upstream Test Integration
- Test framework: **Claude's discretion** — evaluate trade-offs between keeping Node test runner (lower merge friction) vs migrating to vitest (unified experience)
- Upstream branding in tests: **fork-adapt** — update upstream tests to use fork branding where they test user-visible output
- Upstream test failures: **must all pass** — all 63 upstream gsd-tools tests are required, not advisory
- Fork-specific gsd-tools tests: **yes, add them** — tests for fork custom fields (health_check, devops) round-tripping through config commands
- Fork gsd-tools test location: **Claude's discretion** — evaluate separate file (zero merge friction) vs appended section
- Tracking fork adaptations to upstream tests: **Claude's discretion** — evaluate whether separate tracking adds value over git history
- Upstream tests in CI: **Claude's discretion** — determine whether separate step or combined run is better
- Tests for unused upstream features: **Claude's discretion** — evaluate whether features are truly unused vs not yet exposed
- Two test idioms (vitest + node:test): **Claude's discretion** — evaluate practical impact of dual-idiom maintenance

### CI/CD Pipeline Config
- Pre-merge validation: **Claude's discretion** — determine which of the three workflows can/must run on sync branch vs after main merge
- CODEOWNERS: **Claude's discretion** — check whether file exists and recommend appropriate approach
- OIDC: **configured** for npm publishing from fork repo
- CI workflow updates for dual test suites: **Claude's discretion** — evaluate what CI changes are needed vs nice-to-have
- Smoke test: **real installation test** — actually installs the package and runs basic commands
- Smoke test branding check: **Claude's discretion** — determine if branding validation adds value to smoke test
- GitHub Actions secrets: **Claude's discretion** — audit all workflow files and identify required secrets
- Node.js versions in CI: **Claude's discretion** — check existing config and recommend based on package.json engines
- Push timing (local-first vs push-early): **Claude's discretion** — determine most efficient sequence for CI validation
- CI state: **haven't run recently** — discovery needed for current CI health
- Publish workflow trigger: **Claude's discretion** — check current config and recommend safest approach
- Branch protection on main: **Claude's discretion** — determine if this matters for phase and advise

### Wiring Validation Redesign
- Delegation strictness: **Claude's discretion** — determine right level based on how thin orchestrators actually work in the codebase
- Full chain validation (command -> workflow reference -> file exists): **Claude's discretion** — evaluate whether it's worth the complexity
- Fork vs upstream command validation: **Claude's discretion** — pick approach that best matches test structure
- Command count (hardcode vs dynamic): **Claude's discretion** — evaluate trade-off between brittleness and safety
- Install validation in wiring test: **Claude's discretion** — determine right boundary for what "wiring" means
- Reference file validation: **Claude's discretion** — evaluate whether reference/template checks belong in wiring test or separate
- Static checks vs process spawning: **Claude's discretion** — balance speed with thoroughness
- Unconverted commands: **Claude's discretion** — determine whether all commands should be converted by Phase 11 based on Phase 9 work
- Manifest vs dynamic discovery: **Claude's discretion** — evaluate which approach is more maintainable
- Fork file validation (fork-tools.js, reflect templates): **Claude's discretion** — determine whether fork file checks belong in wiring or separate test
- Error message detail: **Claude's discretion** — determine right level of detail for test failure messages
- Pre-commit hook: **Claude's discretion** — evaluate whether wiring test is fast enough for pre-commit
- Test organization (sub-sections vs flat): **Claude's discretion** — match existing test patterns in codebase
- Summary output: **Claude's discretion** — determine whether summary adds value or is noise
- Standard test output: pass/fail per test case

### Claude's Discretion
The user gave Claude broad discretion across all four areas. Key latitude:
- Test repair strategy (batch vs individual, order, style, mocking)
- Upstream test framework decision (keep node:test vs migrate to vitest)
- CI/CD configuration details (workflow changes, node versions, push timing, secrets)
- Wiring test design (strictness, scope, structure, validation depth)
- Commit organization and bug handling during test repair

</decisions>

<specifics>
## Specific Ideas

- Upstream gsd-tools tests must be fork-adapted for branding (package name, URLs) where they test user-visible output
- All 63 upstream tests must pass — they're blocking, not advisory
- Add fork-specific gsd-tools tests for custom config fields (health_check, devops, gsd_reflect_version)
- Smoke test does real installation — validates full install flow
- OIDC is already configured for npm publishing
- CI hasn't been run recently — discovery phase needed for current health

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| How many fork vitest tests are currently failing? | Determines scope of repair work and plan sizing | Critical | Pending |
| Do upstream gsd-tools tests pass as-is on the fork? | May need zero or many adaptations | Critical | Pending |
| What state are the three CI workflows in? | CI hasn't run recently — may have issues beyond test failures | Medium | Pending |
| Are there commands not yet converted to thin orchestrator? | Affects wiring test design and possibly scope | Medium | Pending |

---

*Phase: 11-test-suite-repair*
*Context gathered: 2026-02-11*
