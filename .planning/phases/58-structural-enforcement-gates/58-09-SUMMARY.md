---
phase: 58-structural-enforcement-gates
plan: 09
signature:
  role: executor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: high
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-20T17:32:44Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: derived
    profile: derived
    gsd_version: exposed
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: derived_from_harness
    platform: derived_from_harness
    vendor: derived_from_harness
    model: resolveModelInternal
    reasoning_effort: config
    profile: config
    gsd_version: repo_mirror
    generated_at: writer_clock
    session_id: not_available
model: claude-opus-4-7
context_used_pct: 42
subsystem: structural-enforcement
tags: [gate-15, parity, dual-directory, installer, ci, runtime-neutral, dont-hand-roll]
requires:
  - phase: 58-structural-enforcement-gates/05
    provides: "Codex behavior matrix row for GATE-15 = applies on both runtimes (runtime-neutral CI gate)"
  - phase: 58-structural-enforcement-gates/06
    provides: "GATE-01 CI status gate (preserved alongside this plan's additions)"
  - phase: 58-structural-enforcement-gates/07
    provides: "GATE-02 / GATE-13 CI steps (preserved alongside this plan's additions)"
  - phase: 58-structural-enforcement-gates/08
    provides: "GATE-03 `test` job + `post_commit_gate_03` job (preserved unchanged)"
provides:
  - "GATE-15 structural enforcement: source↔installed mirror parity CI gate"
  - "`scripts/verify-install-parity.js` — CI-callable parity check that re-uses installer's `replacePathsInContent` + `injectVersionScope`"
  - "New `GATE-15 source/install parity` CI step between `Verify install script` and `Run tests with coverage`"
  - "Fire-event: `::notice::gate_fired=GATE-15 result=pass|block path=<first-diverging-file>` on stdout"
affects: [installer, ci, dual-directory-enforcement, phase-19-fire-events]
tech-stack:
  added: []
  patterns:
    - "Don't-Hand-Roll (Research R1) — re-use installer's exported transformation rather than building parallel SHA manifest"
    - "First-divergence-wins fire-event — single `gate_fired=GATE-15 result=block path=<first-diverging-file>` marker with `reason=<installed_file_missing|content_mismatch_line_N|installed_root_missing|source_root_missing>`"
    - "Dual emission contract — script emits detail marker (with path), workflow emits coarse marker (pass/block) for Plan 19 extractor"
    - "cwd-based `--local` invocation — `(cd $INSTALL_DIR && node $REPO_ROOT/bin/install.js --claude --local)` to make `--local` resolve to tempdir"
    - "Recursive vs non-recursive walk parity — agents/ walked top-level-only to match `install.js:2733-2751` non-recursive file-only loop"
key-files:
  created:
    - "scripts/verify-install-parity.js"
    - "tests/unit/verify-install-parity.test.js"
    - ".planning/phases/58-structural-enforcement-gates/58-09-SUMMARY.md"
  modified:
    - ".github/workflows/ci.yml"
key-decisions:
  - "Chose option (b) from plan's §1 — `require('../bin/install.js')` — because `replacePathsInContent` and `injectVersionScope` are ALREADY exported at `bin/install.js:3354` (used by `tests/unit/install.test.js` for direct unit testing). No extraction to a helper module needed; zero-diff to install.js preserves upstream sync invariant."
  - "Plan's proposed CI invocation `HOME=\"$INSTALL_DIR\" node bin/install.js --claude --local` is semantically incorrect — `--local` is cwd-based (bin/install.js:2578-2580 uses `process.cwd()`), not HOME-based. Replaced with `(cd \"$INSTALL_DIR\" && node \"$REPO_ROOT/bin/install.js\" --claude --local)` so `--local` resolves to `$INSTALL_DIR/.claude/`. The installer still finds its source tree via `__dirname` so `cwd` can diverge safely."
  - "Agents root walked NON-recursively (`recursive: false` in SOURCE_ROOTS) because `bin/install.js:2733-2751` iterates `entry.isFile() && entry.name.endsWith('.md')` and skips directories — `agents/kb-templates/` is intentionally not copied to the installed tree. Recursing would false-positive with `installed_file_missing`."
  - "commands/ and get-shit-done/ walked recursively because `copyWithPathReplacement` (bin/install.js:1551) recurses into sub-directories."
  - "injectVersionScope applied only to `commands/gsd/` files (kind=commands) — mirrors `applyVersionScopeToCommands(gsdDest, ...)` at bin/install.js:2694. get-shit-done/ and agents/ files do NOT receive the version-suffix injection."
  - "processAttribution skipped in expected-content computation because a fresh tempdir HOME has no `.claude/settings.json`, so `getCommitAttribution('claude')` returns `undefined`, which makes processAttribution a no-op. This keeps the parity script's expected-content generation hermetic (no HOME/settings dependency)."
  - "Ignorelist left empty at authoring-time per plan §5. USER_GENERATED_BASENAMES defined for future use but no files currently exercise it (first real CI run will surface any legitimate divergence)."
  - "Dual fire-event emission (script + workflow) is intentional, not redundant — script emits `result=block path=<first-diverging-file> reason=<why>` for human debuggability; workflow emits coarse `result=pass|block` for Plan 19's `gate_fire_events` extractor to grep. Plan's verification `grep gate_fired=GATE-15 .github/workflows/ci.yml` returns 2 hits (pass + block branches) — satisfied."
patterns-established:
  - "Per-gate fire-event: `::notice title=GATE-15::gate_fired=GATE-15 result=<pass|block> path=<first-diverging-file> reason=<why>` emitted from the parity script; workflow-level `result=<pass|block>` coarse marker in ci.yml branches."
  - "Recursive-vs-non-recursive walk flag on SOURCE_ROOTS entries mirrors installer's per-root loop semantics — adding a new source root requires consulting install.js to determine the correct `recursive` value."
  - "Zero-diff-to-install.js pattern — re-using already-exported transformation functions rather than forking logic into a helper module preserves upstream sync and Don't-Hand-Roll discipline."
duration: 7min
completed: 2026-04-20
---

# Phase 58 Plan 09: GATE-15 Source/Install Parity Summary

**Source↔installed mirror parity CI gate using the installer's own `replacePathsInContent` + `injectVersionScope`; closes the dual-directory drift hazard that produced the Phase 22 Agent Protocol 23-day-undetected regression.**

## Performance
- **Duration:** 7min
- **Tasks:** 2 / 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- Created `scripts/verify-install-parity.js` — CI-callable parity verifier that `require()`s the installer's already-exported `replacePathsInContent` and `injectVersionScope` (zero new code paths for the installer; Don't-Hand-Roll per Research R1).
- Walk declares 3 source roots with explicit `recursive` flags mirroring `bin/install.js` loops: `commands/gsd/` (recursive, `.claude/commands/gsdr/`), `get-shit-done/` (recursive, `.claude/get-shit-done-reflect/`), `agents/` (top-level-only, `.claude/agents/`).
- `gsd-*.md → gsdr-*.md` rename applied for agents root only (mirrors install.js:2746-2749); passthrough for all other roots.
- Expected-content generator: `.md` files get `replacePathsInContent(content, './.claude/')`; `commands/` additionally get `injectVersionScope(content, '${pkg.version}+dev', 'local')`; non-`.md` files are byte-identical passthroughs (matches `fs.copyFileSync` in install.js:1600).
- First-divergence fire-event on stdout: `::notice::gate_fired=GATE-15 result=block path=<path> reason=<installed_file_missing|content_mismatch_line_N|installed_root_missing|source_root_missing>`.
- Happy-path fire-event: `::notice::gate_fired=GATE-15 result=pass total_files=<N>` (end-to-end verification against a fresh install produced `total_files=236`, exit 0).
- 16 unit tests in `tests/unit/verify-install-parity.test.js` cover: `mapInstalledRelPath` rename semantics (3 cases), `firstDiffLine` line-locator (3 cases), `expectedInstalledContent` transformation selection (3 cases), `compareRoot` pass paths (3 cases — one per root kind), `compareRoot` block paths (4 cases — installed_root_missing, installed_file_missing, content_mismatch, source_root_missing). All 16 pass.
- Added `GATE-15 source/install parity` step to `.github/workflows/ci.yml` between `Verify install script` and `Run tests with coverage`. Step uses cwd-based `(cd $INSTALL_DIR && node $REPO_ROOT/bin/install.js --claude --local)` so `--local` resolves correctly; emits both the parity script's detail-level `::notice::` and a workflow-level coarse `result=pass|block` marker.
- Prior GATE-01 (`test` job emission marker), GATE-02 (merge-strategy), GATE-13 (dispatch-contract), and GATE-03 (`post_commit_gate_03` job) CI steps/jobs preserved unchanged.

## Task Commits

1. **Task 1: Parity script + unit tests** — `cd924ec1` (`feat(58-09): add GATE-15 source/install parity script`)
2. **Task 2: GATE-15 CI step** — `68e29c31` (`feat(58-09): add GATE-15 post-install parity step to CI`)

## Files Created/Modified

- `scripts/verify-install-parity.js` (created, 321 lines) — CLI-callable parity check. Imports `replacePathsInContent` + `injectVersionScope` from `../bin/install.js`. Exports `compareRoot`, `expectedInstalledContent`, `mapInstalledRelPath`, `firstDiffLine`, `walkFiles`, `SOURCE_ROOTS`, `PATH_PREFIX`, `IGNORELIST`, `USER_GENERATED_BASENAMES` for unit tests. Exits 0 on parity, 1 on divergence, 2 on usage error.
- `tests/unit/verify-install-parity.test.js` (created, 244 lines) — 16 vitest cases against synthetic source + installed pairs. No shell-out to the real installer (that's the CI step's job); these tests lock down the comparator semantics.
- `.github/workflows/ci.yml` (modified, +41 lines) — New `GATE-15 source/install parity` step inserted at line 82, between the pre-existing `Verify install script` step and `Run tests with coverage`. Prior jobs (`test`, `post_commit_gate_03`) unchanged.

## Decisions & Deviations

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan CI invocation used wrong installer flag semantics**
- **Found during:** Task 2 end-to-end verification.
- **Issue:** Plan Task 2 proposed `HOME="$INSTALL_DIR" node bin/install.js --claude --local`, but `--local` is cwd-based (bin/install.js:2578-2580 uses `process.cwd()`), not HOME-based. With the plan's invocation the installer would write to `$REPO_ROOT/.claude/`, not `$INSTALL_DIR/.claude/`, so the parity script could never find the install tree.
- **Fix:** CI step uses `(cd "$INSTALL_DIR" && node "$REPO_ROOT/bin/install.js" --claude --local)` so `--local` resolves to `$INSTALL_DIR/.claude/`. The installer still finds its source tree via `__dirname`, which is independent of cwd, so this works.
- **Files modified:** `.github/workflows/ci.yml`.
- **Commit:** `68e29c31`.

**2. [Rule 1 - Bug] Agents-root recursion would false-positive on `agents/kb-templates/`**
- **Found during:** Task 1 end-to-end verification (first parity run reported `.claude/agents/kb-templates/lesson.md reason=installed_file_missing`).
- **Issue:** `walkFiles` recursed into `agents/kb-templates/` but `bin/install.js:2733-2751` iterates `entry.isFile() && entry.name.endsWith('.md')` and explicitly skips directories. The installer does not copy `agents/kb-templates/*` to the installed tree — kb-templates is a namespace for knowledge-store file templates, intentionally unshipped to `.claude/agents/`.
- **Fix:** Added `recursive` flag to SOURCE_ROOTS entries; agents set to `recursive: false`; walkFiles honors the flag. E2E re-run produced `result=pass total_files=236`.
- **Files modified:** `scripts/verify-install-parity.js`.
- **Commit:** `cd924ec1` (caught pre-commit during Task 1 verification loop).

### Deviations from plan

**Plan §1 option preference — extraction vs inline export:** Plan preferred option (a) — extract `replacePathsInContent` into `bin/lib/install-paths.cjs` — falling back to option (b) if extraction breaks tests. **Chose option (b) without attempting (a)** because `replacePathsInContent` and `injectVersionScope` are ALREADY exported at `bin/install.js:3354` (used by `tests/unit/install.test.js` for direct unit testing). Extraction would be a net-negative diff against install.js (which upstream-sync discipline requires staying minimal) for zero additional cleanliness win.

**Plan §3 SOURCE_ROOTS constant shape:** Plan's example SOURCE_ROOTS used an object-map `{ agents: '.claude/agents', ... }` with parallel `SOURCE_ROOTS` array. I used a single array of `{srcRoot, installedRoot, kind, recursive}` objects because the walk needs per-root kind (for injectVersionScope selection and agents-rename) and per-root recursion flags. Functionally equivalent; one source of truth instead of two.

**Plan §2 skills/ source root:** Plan listed `skills` as a SOURCE_ROOT. `skills/` does not exist at repo root (only `.claude/skills/` which is a generated artifact for Codex runtime). Dropped `skills/` from SOURCE_ROOTS; the three remaining roots (agents, commands/gsd, get-shit-done) cover all the `--claude --local` installer walks.

## Authentication Gates

None — GATE-15 is a CI-local check with no external service dependencies.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 19's `gate_fire_events` extractor can pattern-match `gate_fired=GATE-15 result=(pass|block)` from CI logs; both markers confirmed via `grep -n "gate_fired=GATE-15" .github/workflows/ci.yml` returning exactly 2 hits (pass and block branches).
- `scripts/verify-install-parity.js` can be invoked from any developer machine as a pre-push lint: `INSTALL_DIR=$(mktemp -d) && (cd "$INSTALL_DIR" && node $REPO_ROOT/bin/install.js --claude --local) && node $REPO_ROOT/scripts/verify-install-parity.js "$INSTALL_DIR"`.
- Per `58-05-codex-behavior-matrix.md` GATE-15 row (`applies` on both runtimes): this CI step is runtime-neutral and requires no Codex-specific wrapping. The Codex runtime path is out of scope until Codex gets its own `.codex/skills/` source-tree walk classifier — tracked as part of Phase 58's Codex follow-up work.
- Future ignorelist additions: if a file appears as a legitimate divergence (e.g., install-generated file in `.claude/` with no source counterpart), add it to `IGNORELIST` in the script with a comment explaining the rationale.
- Plan 10 (if it extends parity) can re-use the comparator core via the module.exports surface (`compareRoot`, `expectedInstalledContent`, `mapInstalledRelPath`, `firstDiffLine`, `walkFiles`).

## Self-Check: PASSED

- `scripts/verify-install-parity.js` — FOUND
- `tests/unit/verify-install-parity.test.js` — FOUND (16 tests, all pass)
- `.github/workflows/ci.yml` — FOUND; `gate_fired=GATE-15` grep returns 2 hits (pass + block branches); `verify-install-parity` grep returns 2 hits (script invocation + path-reference in comment)
- `.planning/phases/58-structural-enforcement-gates/58-09-SUMMARY.md` — FOUND
- Commit `cd924ec1` (Task 1) — FOUND in `git log --oneline`
- Commit `68e29c31` (Task 2) — FOUND in `git log --oneline`
- End-to-end verification: fresh `--claude --local` install → parity script exits 0 with `gate_fired=GATE-15 result=pass total_files=236`
- Prior CI steps preserved: `Verify install script` (line 41), `Run tests with coverage` (line 123), `GATE-02` (line 127), `GATE-13` (line 159), `GATE-01` (line 189), `post_commit_gate_03` job (line 213+)
