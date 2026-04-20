/**
 * Reconcile — Phase-closeout reconciliation orchestrator (GATE-10)
 *
 * Phase 58 Plan 13 (GATE-10): structural phase-closeout reconciliation as a
 * named CLI substrate. Composes existing state / roadmap primitives into a
 * single exit-coded gate so STATE.md, the active ROADMAP phase row, plan
 * checkboxes, and planning-authority sidecars reconcile atomically at phase
 * close instead of drifting across separate workflow steps.
 *
 * Signals addressed:
 *   - sig-2026-04-17-phase-closeout-left-state-pr-release-pending (5 occurrences)
 *   - sig-2026-04-20-phase-closeout-planning-state-release-lag (6 occurrences)
 *
 * Research R9 (58-RESEARCH.md) established that the read-and-update primitives
 * already exist in state.cjs + roadmap.cjs but no orchestrator composes them.
 * This module is that orchestrator — it does NOT reimplement state-update
 * logic; it calls existing primitives and stages + commits atomically or exits
 * non-zero with a blocking message listing the unreconciled fields.
 *
 * Per-gate Codex behavior (58-05 matrix): applies on both runtimes (CLI is
 * runtime-neutral).
 *
 * Fire-event: emits `::notice title=GATE-10::gate_fired=GATE-10 result=<reconciled|block> fields=<count>`
 * on every invocation (including dry-run) so downstream measurement (Plan 19
 * gate_fire_events extractor) can count invocations regardless of outcome.
 *
 * Exit codes:
 *   0 — reconciled (or dry-run, or no-op when already reconciled)
 *   1 — internal error (unexpected state)
 *   5 — unreconciled: some fields cannot be auto-reconciled; manual resolution
 *       required. Caller prints the list so the user can intervene.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const {
  planningPaths,
  planningDir,
  findPhaseInternal,
  escapeRegex,
  normalizePhaseName,
  atomicWriteFileSync,
  extractCurrentMilestone,
  replaceInCurrentMilestone,
  output,
  error,
} = require('./core.cjs');

// ─── Fire-event emitter ──────────────────────────────────────────────────────

/**
 * Emit the GATE-10 fire-event marker. Always lands on stdout as a `::notice::`
 * line so CI / Plan 19 extractor can count invocations structurally.
 */
function emitFireEvent(result, fieldsCount) {
  // eslint-disable-next-line no-console
  console.log(`::notice title=GATE-10::gate_fired=GATE-10 result=${result} fields=${fieldsCount}`);
}

// ─── Small helpers (local, no new lib) ───────────────────────────────────────

/**
 * Flat STATE.md scalar reader — matches `**Field:** value` and `Field: value`.
 * Intentionally duplicated from state.cjs.stateExtractField so reconcile can
 * snapshot STATE.md without importing state.cjs private helpers.
 */
function readStateField(content, fieldName) {
  const escaped = escapeRegex(fieldName);
  const boldPattern = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.+)`, 'i');
  const m = content.match(boldPattern);
  if (m) return m[1].trim();
  const plain = new RegExp(`^${escaped}:\\s*(.+)`, 'im');
  const pm = content.match(plain);
  return pm ? pm[1].trim() : null;
}

/** Extract progress frontmatter `percent:` value from STATE.md, if present. */
function readFrontmatterPercent(content) {
  const m = content.match(/^---\s*[\s\S]*?^---/m);
  if (!m) return null;
  const fmMatch = m[0].match(/percent:\s*(\d+)/m);
  return fmMatch ? parseInt(fmMatch[1], 10) : null;
}

function shellCapture(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, {
    stdio: 'pipe',
    encoding: 'utf-8',
    ...options,
  });
  return {
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
    exitCode: r.status == null ? -1 : r.status,
    spawnError: r.error || null,
  };
}

/**
 * List planning-authority files touched on the current branch relative to main.
 * Used to compute expected "touched sidecars" set for the phase. If git is
 * unavailable or the main ref can't be resolved, returns [] (non-blocking —
 * reconcile still operates on STATE.md + ROADMAP.md).
 */
function touchedPlanningFiles(cwd) {
  const headCheck = shellCapture('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  if (headCheck.exitCode !== 0) return [];

  // Prefer `origin/main` as the merge base; fall back to local `main`.
  let base = null;
  const remoteMain = shellCapture('git', ['merge-base', 'HEAD', 'origin/main'], { cwd });
  if (remoteMain.exitCode === 0 && remoteMain.stdout) {
    base = remoteMain.stdout;
  } else {
    const localMain = shellCapture('git', ['merge-base', 'HEAD', 'main'], { cwd });
    if (localMain.exitCode === 0 && localMain.stdout) base = localMain.stdout;
  }
  if (!base) return [];

  const diff = shellCapture('git', ['diff', '--name-only', `${base}...HEAD`], { cwd });
  if (diff.exitCode !== 0) return [];

  return diff.stdout
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => p.startsWith('.planning/') && p.endsWith('.md'));
}

// ─── Orchestrator core ───────────────────────────────────────────────────────

/**
 * reconcilePhase(cwd, phaseNumber, options)
 *
 * @param {string} cwd - project root
 * @param {string} phaseNumber - phase identifier ("58", "57.8", etc.)
 * @param {object} options
 * @param {boolean} [options.dryRun=false] - compute diff without writing
 * @param {boolean} [options.autoCommit=false] - stage + commit changes after write
 * @returns {object} { status: 'reconciled'|'noop'|'block', changes: [...], unreconciled: [...] }
 */
function reconcilePhase(cwd, phaseNumber, options = {}) {
  const { dryRun = false, autoCommit = false } = options;

  if (!phaseNumber) {
    return {
      status: 'block',
      changes: [],
      unreconciled: [{ field: 'phase_number', reason: 'missing_argument' }],
    };
  }

  const paths = planningPaths(cwd);
  const phaseInfo = findPhaseInternal(cwd, phaseNumber);
  if (!phaseInfo) {
    return {
      status: 'block',
      changes: [],
      unreconciled: [{ field: 'phase', reason: `phase ${phaseNumber} not found on disk` }],
    };
  }

  const planCount = phaseInfo.plans.length;
  const summaryCount = phaseInfo.summaries.length;

  // 1) Snapshot current state
  const statePath = paths.state;
  const roadmapPath = paths.roadmap;

  if (!fs.existsSync(statePath)) {
    return {
      status: 'block',
      changes: [],
      unreconciled: [{ field: 'STATE.md', reason: 'file_missing' }],
    };
  }
  if (!fs.existsSync(roadmapPath)) {
    return {
      status: 'block',
      changes: [],
      unreconciled: [{ field: 'ROADMAP.md', reason: 'file_missing' }],
    };
  }

  const stateBefore = fs.readFileSync(statePath, 'utf-8');
  const roadmapBefore = fs.readFileSync(roadmapPath, 'utf-8');

  const changes = [];
  const unreconciled = [];

  // 2) Compute expected state
  const today = new Date().toISOString().split('T')[0];
  const currentPlan = readStateField(stateBefore, 'Current Plan') || readStateField(stateBefore, 'Plan');
  const statusField = readStateField(stateBefore, 'Status');

  // Plan completion status per SUMMARY existence. Research R9 recommended this
  // signal first; commit-hash scanning is a refinement reserved for Plan 17+.
  const planIds = phaseInfo.plans.map((f) => f.replace('-PLAN.md', ''));
  const summaryIds = new Set(
    phaseInfo.summaries.map((f) => f.replace('-SUMMARY.md', '').replace('SUMMARY.md', ''))
  );
  const missingSummaries = planIds.filter((id) => !summaryIds.has(id));

  // VERIFICATION.md presence (for complete status computation)
  const phaseFullDir = path.join(cwd, phaseInfo.directory);
  let hasVerification = false;
  let verificationPasses = false;
  try {
    const files = fs.readdirSync(phaseFullDir);
    const vfile = files.find((f) => /-VERIFICATION\.md$/.test(f));
    if (vfile) {
      hasVerification = true;
      const vcontent = fs.readFileSync(path.join(phaseFullDir, vfile), 'utf-8');
      verificationPasses =
        /status:\s*(?:pass|passed)/i.test(vcontent) ||
        /verdict:\s*(?:pass|passed)/i.test(vcontent);
    }
  } catch { /* non-blocking */ }

  const allPlansDone = missingSummaries.length === 0 && planCount > 0;
  const expectedStatus = allPlansDone && hasVerification && verificationPasses
    ? 'complete'
    : 'in_progress';

  // 3) Diff current vs expected — STATE.md expectations
  // (a) STATE.md stopped_at: should reflect the most recent phase-dir activity
  //     OR STATE's own frontmatter last_updated. If it still names an earlier
  //     plan than the most recently landed SUMMARY, flag it as drift.
  const stoppedAtRaw = readStateField(stateBefore, 'Stopped At') || readStateField(stateBefore, 'Stopped at');
  if (summaryCount > 0) {
    // Find the latest SUMMARY id (sorted by disk filename)
    const latestSummary = phaseInfo.summaries.slice().sort().pop();
    const latestId = latestSummary ? latestSummary.replace('-SUMMARY.md', '') : null;
    if (latestId && stoppedAtRaw && !stoppedAtRaw.includes(latestId)) {
      // Only flag if stopped_at references an older plan from the same phase.
      const sameAgeMatch = planIds.some((pid) =>
        pid !== latestId && stoppedAtRaw.includes(pid)
      );
      if (sameAgeMatch) {
        changes.push({
          field: 'STATE.stopped_at',
          current: stoppedAtRaw,
          expected: `references plan ${latestId} (latest SUMMARY in phase ${phaseNumber})`,
          action: 'advisory_drift_flagged_for_manual_edit',
        });
      }
    }
  }

  // (b) STATE.md progress percent — recalculated from disk across current
  //     milestone. Direct compute (not calling cmdStateUpdateProgress so we
  //     can include it in the changes[] surface).
  {
    const phasesDir = paths.phases;
    let totalPlans = 0;
    let totalSummaries = 0;
    if (fs.existsSync(phasesDir)) {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        const files = fs.readdirSync(path.join(phasesDir, e.name));
        totalPlans += files.filter((f) => /-PLAN\.md$/i.test(f)).length;
        totalSummaries += files.filter((f) => /-SUMMARY\.md$/i.test(f)).length;
      }
    }
    const expectedPercent = totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0;
    const currentPercent = readFrontmatterPercent(stateBefore);
    if (currentPercent !== null && currentPercent !== expectedPercent) {
      changes.push({
        field: 'STATE.progress.percent',
        current: currentPercent,
        expected: expectedPercent,
        action: 'update_via_state_update-progress',
      });
    }
  }

  // (c) ROADMAP.md phase row — delegate drift detection to
  //     roadmap.update-plan-progress (compute-then-compare is what that
  //     primitive does internally). We flag drift by comparing the counts
  //     it would write against the current row.
  {
    const phaseEsc = escapeRegex(phaseNumber);
    const rowPattern = new RegExp(`^(\\|\\s*${phaseEsc}\\.?\\s[^|]*(?:\\|[^\\n]*))$`, 'im');
    const rowMatch = roadmapBefore.match(rowPattern);
    if (rowMatch) {
      const cells = rowMatch[1].split('|').slice(1, -1).map((c) => c.trim());
      // 4-col (Phase | Plans | Status | Completed) or 5-col with Milestone.
      const plansCell = cells.length === 5 ? cells[2] : cells[1];
      const expectedPlansCell = `${summaryCount}/${planCount}`;
      if (plansCell !== expectedPlansCell) {
        changes.push({
          field: 'ROADMAP.phase_row.plans',
          current: plansCell,
          expected: expectedPlansCell,
          action: 'update_via_roadmap_update-plan-progress',
        });
      }
    } else {
      changes.push({
        field: 'ROADMAP.phase_row',
        current: 'not_found',
        expected: `row matching Phase ${phaseNumber}`,
        action: 'advisory_row_missing_in_roadmap',
      });
    }
  }

  // (d) Plan checkboxes in ROADMAP — roadmap.update-plan-progress marks them
  //     when summaries exist. We detect drift by checking each summary-backed
  //     plan id's checkbox state in the current roadmap.
  for (const summaryId of summaryIds) {
    if (!summaryId) continue;
    const planEscaped = escapeRegex(summaryId);
    const uncheckedPattern = new RegExp(
      `-\\s*\\[ \\]\\s*(?:\\*\\*)?${planEscaped}(?:\\*\\*)?`,
      'i'
    );
    if (uncheckedPattern.test(roadmapBefore)) {
      changes.push({
        field: `ROADMAP.plan_checkbox[${summaryId}]`,
        current: '[ ]',
        expected: '[x]',
        action: 'update_via_roadmap_update-plan-progress',
      });
    }
  }

  // (e) Touched planning-authority files — best-effort enumeration. Surfaces
  //     any .planning/*.md changes on the phase branch so autoCommit can
  //     include them. Non-blocking if git unavailable.
  const touched = touchedPlanningFiles(cwd);
  if (touched.length > 0) {
    changes.push({
      field: 'branch.touched_planning_files',
      current: `${touched.length} file(s)`,
      expected: 'staged_in_reconcile_commit',
      action: 'list_for_staging',
      files: touched,
    });
  }

  // (f) Unreconcilable case — plans without SUMMARY AND without VERIFICATION
  //     leave expected_status ambiguous (could be in_progress awaiting work,
  //     or blocked waiting on external). Flag per-plan so user can triage.
  //     Only applies when the phase looks "mostly done" (>50% summaries) —
  //     otherwise the ambiguity is ordinary in-progress.
  if (planCount > 0 && summaryCount / planCount > 0.5 && missingSummaries.length > 0 && !hasVerification) {
    for (const pid of missingSummaries) {
      unreconciled.push({
        field: `plan[${pid}]`,
        reason: 'plan_exists_no_summary_no_verification',
        hint: 'ship SUMMARY.md or add entry to NN-LEDGER.md explicitly_deferred',
      });
    }
  }

  // 4) Apply changes (unless dry-run)
  const actionsApplied = [];
  if (!dryRun && changes.length > 0) {
    // (i) ROADMAP + plan checkboxes via existing primitive — cmdRoadmapUpdatePlanProgress
    //     Uses lock internally; idempotent; prints JSON. Invoke via subprocess
    //     so we keep composition clean and don't cross-import roadmap.cjs's
    //     output-contract expectations.
    const toolsPath = path.resolve(__dirname, '..', 'gsd-tools.cjs');
    const roadmapUpdate = shellCapture(
      process.execPath,
      [toolsPath, 'roadmap', 'update-plan-progress', String(phaseNumber), '--raw', '--cwd', cwd],
      { cwd }
    );
    if (roadmapUpdate.exitCode === 0) {
      actionsApplied.push({ action: 'roadmap.update-plan-progress', result: 'ok' });
    } else {
      actionsApplied.push({
        action: 'roadmap.update-plan-progress',
        result: 'error',
        stderr: roadmapUpdate.stderr,
      });
      unreconciled.push({
        field: 'ROADMAP.md',
        reason: 'roadmap_primitive_failed',
        hint: roadmapUpdate.stderr || 'see gsd-tools output',
      });
    }

    // (ii) STATE.md progress via existing primitive — cmdStateUpdateProgress
    const stateProgress = shellCapture(
      process.execPath,
      [toolsPath, 'state', 'update-progress', '--raw', '--cwd', cwd],
      { cwd }
    );
    if (stateProgress.exitCode === 0) {
      actionsApplied.push({ action: 'state.update-progress', result: 'ok' });
    } else {
      actionsApplied.push({
        action: 'state.update-progress',
        result: 'error',
        stderr: stateProgress.stderr,
      });
    }

    // (iii) STATE.md session timestamp via existing primitive — cmdStateRecordSession
    const sessionResult = shellCapture(
      process.execPath,
      [
        toolsPath,
        'state',
        'record-session',
        '--stopped-at',
        `Reconciled phase ${phaseNumber} via GATE-10`,
        '--raw',
        '--cwd',
        cwd,
      ],
      { cwd }
    );
    if (sessionResult.exitCode === 0) {
      actionsApplied.push({ action: 'state.record-session', result: 'ok' });
    }

    // (iv) autoCommit: stage touched files + commit with scaffolded message
    if (autoCommit && unreconciled.length === 0) {
      const filesToStage = [
        path.relative(cwd, statePath),
        path.relative(cwd, roadmapPath),
      ];
      // Include REQUIREMENTS.md if it was touched on branch
      const reqRelative = '.planning/REQUIREMENTS.md';
      if (touched.includes(reqRelative)) filesToStage.push(reqRelative);

      const stageResult = shellCapture('git', ['add', '--', ...filesToStage], { cwd });
      if (stageResult.exitCode === 0) {
        // Check if there's anything to commit
        const diffCached = shellCapture('git', ['diff', '--cached', '--quiet'], { cwd });
        if (diffCached.exitCode !== 0) {
          const msg = `docs(${phaseNumber}): reconcile phase closeout — STATE.md + ROADMAP.md + ${changes.length} field(s)`;
          const commitResult = shellCapture('git', ['commit', '-m', msg], { cwd });
          if (commitResult.exitCode === 0) {
            actionsApplied.push({ action: 'git.commit', result: 'ok', message: msg });
          } else {
            actionsApplied.push({
              action: 'git.commit',
              result: 'error',
              stderr: commitResult.stderr,
            });
          }
        } else {
          actionsApplied.push({ action: 'git.commit', result: 'noop_nothing_staged' });
        }
      }
    }
  }

  // 5) Determine final status
  let status;
  if (unreconciled.length > 0) {
    status = 'block';
  } else if (changes.length === 0) {
    status = 'noop';
  } else {
    status = dryRun ? 'noop' : 'reconciled';
  }

  return {
    status,
    phase: phaseNumber,
    plan_count: planCount,
    summary_count: summaryCount,
    expected_phase_status: expectedStatus,
    changes,
    unreconciled,
    actions_applied: actionsApplied,
    dry_run: dryRun,
  };
}

// ─── CLI entry ───────────────────────────────────────────────────────────────

function cmdPhaseReconcile(cwd, args, raw) {
  // args = ['reconcile', '<phase>', '--dry-run', '--auto-commit', ...]
  const phaseNumber = args[1];
  const dryRun = args.includes('--dry-run');
  const autoCommit = args.includes('--auto-commit');
  // --auto flag kept for symmetry with other gates; currently treated as
  // autoCommit alias per plan spec.
  const auto = args.includes('--auto');

  if (!phaseNumber) {
    error('Usage: gsd-tools phase reconcile <phase_number> [--dry-run] [--auto-commit] [--auto]');
  }

  const normalized = normalizePhaseName(phaseNumber);
  const result = reconcilePhase(cwd, normalized || phaseNumber, {
    dryRun,
    autoCommit: autoCommit || auto,
  });

  // Emit fire-event on every invocation (including dry-run and block) so
  // Plan 19 gate_fire_events extractor can count GATE-10 invocations structurally.
  const fireResult = result.status === 'block' ? 'block' : 'reconciled';
  emitFireEvent(fireResult, result.changes.length);

  output(result, raw);

  // Exit codes per plan spec:
  //   0 — reconciled / noop / dry-run pass
  //   5 — unreconciled (blocking — caller inspects unreconciled[])
  if (result.status === 'block') {
    process.exit(5);
  }
}

module.exports = {
  reconcilePhase,
  cmdPhaseReconcile,
  emitFireEvent,
};
