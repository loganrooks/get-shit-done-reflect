#!/usr/bin/env node

/**
 * GSD Tools — CLI utility for GSD workflow operations (GSD Reflect fork)
 *
 * Pure CLI router: dispatches all commands to lib/*.cjs modules.
 * Contains zero inline function definitions — only requires and async main().
 *
 * Module extraction history:
 *   Phase 45: renamed gsd-tools.js -> gsd-tools.cjs
 *   Phase 46: adopted upstream lib/*.cjs modules (frontmatter, init, commands, config)
 *   Phase 47: extracted fork modules (sensors, backlog, health-probe, manifest, automation)
 *   Phase 48: extended upstream modules with fork behavior (frontmatter signal schema,
 *             init --include support, list-todos enrichment, config-set/get permissive paths)
 *
 * Usage: node gsd-tools.cjs <command> [args] [--raw] [--cwd <path>]
 *
 * See upstream docs for full command reference. Fork additions:
 *   manifest diff-config|validate|get-prompts|apply-migration|log-migration|auto-detect
 *   backlog add|list|update|stats|group|promote|index
 *   automation resolve-level|track-event|lock|unlock|check-lock|regime-change|reflection-counter
 *   sensors list|blind-spots
 *   health-probe signal-metrics|signal-density|automation-watchdog|validation-coverage
 *   patches -- classify local runtime/source divergence through the shared patch classifier
 *   init execute-phase <phase> [--include state,config,roadmap]
 *   init plan-phase <phase> [--include state,roadmap,research,context,verification,uat,requirements]
 *   init progress [--include state,roadmap,project,config]
 *   measurement rebuild|query -- rebuild/query the measurement substrate
 *   list-todos [area] -- enriched with priority/source/status fields
 *   config-set <key.path> <value> -- permissive (no allowlist)
 *   config-get <key.path> -- graceful (returns {found:false} for missing keys)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { error, output, safeReadFile, loadConfig, findPhaseInternal, resolveModelInternal,
        pathExistsInternal, generateSlugInternal, getMilestoneInfo, normalizePhaseName,
        loadManifest, loadProjectConfig, atomicWriteJson, parseIncludeFlag } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
const roadmap = require('./lib/roadmap.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');
const milestone = require('./lib/milestone.cjs');
const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');
const sensors = require('./lib/sensors.cjs');
const backlog = require('./lib/backlog.cjs');
const healthProbe = require('./lib/health-probe.cjs');
const manifest = require('./lib/manifest.cjs');
const automation = require('./lib/automation.cjs');
const kb = require('./lib/kb.cjs');
const kbQuery = require('./lib/kb-query.cjs');
const kbLink = require('./lib/kb-link.cjs');
const kbHealth = require('./lib/kb-health.cjs');
const kbTransition = require('./lib/kb-transition.cjs');
const telemetry = require('./lib/telemetry.cjs');
const measurement = require('./lib/measurement.cjs');
const quick = require('./lib/quick.cjs');
const handoff = require('./lib/handoff.cjs');
const reconcile = require('./lib/reconcile.cjs');
const archive = require('./lib/archive.cjs');
const release = require('./lib/release.cjs');
const patchClassifier = require('./lib/patch-classifier.cjs');


// ─── CLI Router ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Optional cwd override for sandboxed subagents running outside project root.
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  const command = args[0];

  if (!command) {
    error('Usage: gsd-tools <command> [args] [--raw] [--cwd <path>]\nCommands: state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, config-set, config-get, config-set-model-profile, config-new-project, phases, roadmap, phase, milestone, init, manifest, backlog, automation, sensors, health-probe, patches, kb, telemetry, measurement, quick, handoff, antipatterns, agent, release');
  }

  switch (command) {
    case 'state': {
      const subcommand = args[1];
      if (subcommand === 'json') {
        state.cmdStateJson(cwd, raw);
      } else if (subcommand === 'update') {
        state.cmdStateUpdate(cwd, args[2], args[3]);
      } else if (subcommand === 'get') {
        state.cmdStateGet(cwd, args[2], raw);
      } else if (subcommand === 'patch') {
        const patches = {};
        for (let i = 2; i < args.length; i += 2) {
          const key = args[i].replace(/^--/, '');
          const value = args[i + 1];
          if (key && value !== undefined) {
            patches[key] = value;
          }
        }
        state.cmdStatePatch(cwd, patches, raw);
      } else if (subcommand === 'advance-plan') {
        state.cmdStateAdvancePlan(cwd, raw);
      } else if (subcommand === 'record-metric') {
        const phaseIdx = args.indexOf('--phase');
        const planIdx = args.indexOf('--plan');
        const durationIdx = args.indexOf('--duration');
        const tasksIdx = args.indexOf('--tasks');
        const filesIdx = args.indexOf('--files');
        state.cmdStateRecordMetric(cwd, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          plan: planIdx !== -1 ? args[planIdx + 1] : null,
          duration: durationIdx !== -1 ? args[durationIdx + 1] : null,
          tasks: tasksIdx !== -1 ? args[tasksIdx + 1] : null,
          files: filesIdx !== -1 ? args[filesIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'update-progress') {
        state.cmdStateUpdateProgress(cwd, raw);
      } else if (subcommand === 'add-decision') {
        const phaseIdx = args.indexOf('--phase');
        const summaryIdx = args.indexOf('--summary');
        const summaryFileIdx = args.indexOf('--summary-file');
        const rationaleIdx = args.indexOf('--rationale');
        const rationaleFileIdx = args.indexOf('--rationale-file');
        state.cmdStateAddDecision(cwd, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          summary: summaryIdx !== -1 ? args[summaryIdx + 1] : null,
          summary_file: summaryFileIdx !== -1 ? args[summaryFileIdx + 1] : null,
          rationale: rationaleIdx !== -1 ? args[rationaleIdx + 1] : '',
          rationale_file: rationaleFileIdx !== -1 ? args[rationaleFileIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'add-blocker') {
        const textIdx = args.indexOf('--text');
        const textFileIdx = args.indexOf('--text-file');
        state.cmdStateAddBlocker(cwd, {
          text: textIdx !== -1 ? args[textIdx + 1] : null,
          text_file: textFileIdx !== -1 ? args[textFileIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'resolve-blocker') {
        const textIdx = args.indexOf('--text');
        state.cmdStateResolveBlocker(cwd, textIdx !== -1 ? args[textIdx + 1] : null, raw);
      } else if (subcommand === 'record-session') {
        const stoppedIdx = args.indexOf('--stopped-at');
        const resumeIdx = args.indexOf('--resume-file');
        state.cmdStateRecordSession(cwd, {
          stopped_at: stoppedIdx !== -1 ? args[stoppedIdx + 1] : null,
          resume_file: resumeIdx !== -1 ? args[resumeIdx + 1] : 'None',
        }, raw);
      } else {
        state.cmdStateLoad(cwd, raw);
      }
      break;
    }

    case 'resolve-model': {
      commands.cmdResolveModel(cwd, args[1], raw);
      break;
    }

    case 'find-phase': {
      phase.cmdFindPhase(cwd, args[1], raw);
      break;
    }

    case 'commit': {
      const amend = args.includes('--amend');
      const filesIndex = args.indexOf('--files');
      // Collect all positional args between command name and first flag,
      // then join them -- handles both quoted ("multi word msg") and
      // unquoted (multi word msg) invocations from different shells
      const endIndex = filesIndex !== -1 ? filesIndex : args.length;
      const messageArgs = args.slice(1, endIndex).filter(a => !a.startsWith('--'));
      const message = messageArgs.join(' ') || undefined;
      const files = filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
      commands.cmdCommit(cwd, message, files, raw, amend);
      break;
    }

    case 'verify-summary': {
      const summaryPath = args[1];
      const countIndex = args.indexOf('--check-count');
      const checkCount = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
      verify.cmdVerifySummary(cwd, summaryPath, checkCount, raw);
      break;
    }

    case 'template': {
      const subcommand = args[1];
      if (subcommand === 'select') {
        template.cmdTemplateSelect(cwd, args[2], raw);
      } else if (subcommand === 'fill') {
        const templateType = args[2];
        const phaseIdx = args.indexOf('--phase');
        const planIdx = args.indexOf('--plan');
        const nameIdx = args.indexOf('--name');
        const typeIdx = args.indexOf('--type');
        const waveIdx = args.indexOf('--wave');
        const fieldsIdx = args.indexOf('--fields');
        template.cmdTemplateFill(cwd, templateType, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          plan: planIdx !== -1 ? args[planIdx + 1] : null,
          name: nameIdx !== -1 ? args[nameIdx + 1] : null,
          type: typeIdx !== -1 ? args[typeIdx + 1] : 'execute',
          wave: waveIdx !== -1 ? args[waveIdx + 1] : '1',
          fields: fieldsIdx !== -1 ? JSON.parse(args[fieldsIdx + 1]) : {},
        }, raw);
      } else {
        error('Unknown template subcommand. Available: select, fill');
      }
      break;
    }

    case 'frontmatter': {
      const subcommand = args[1];
      const file = args[2];
      if (subcommand === 'get') {
        const fieldIdx = args.indexOf('--field');
        frontmatter.cmdFrontmatterGet(cwd, file, fieldIdx !== -1 ? args[fieldIdx + 1] : null, raw);
      } else if (subcommand === 'set') {
        const fieldIdx = args.indexOf('--field');
        const valueIdx = args.indexOf('--value');
        frontmatter.cmdFrontmatterSet(cwd, file, fieldIdx !== -1 ? args[fieldIdx + 1] : null, valueIdx !== -1 ? args[valueIdx + 1] : undefined, raw);
      } else if (subcommand === 'merge') {
        const dataIdx = args.indexOf('--data');
        frontmatter.cmdFrontmatterMerge(cwd, file, dataIdx !== -1 ? args[dataIdx + 1] : null, raw);
      } else if (subcommand === 'validate') {
        const schemaIdx = args.indexOf('--schema');
        frontmatter.cmdFrontmatterValidate(cwd, file, schemaIdx !== -1 ? args[schemaIdx + 1] : null, raw);
      } else {
        error('Unknown frontmatter subcommand. Available: get, set, merge, validate');
      }
      break;
    }

    case 'verify': {
      const subcommand = args[1];
      if (subcommand === 'plan-structure') {
        verify.cmdVerifyPlanStructure(cwd, args[2], raw);
      } else if (subcommand === 'phase-completeness') {
        verify.cmdVerifyPhaseCompleteness(cwd, args[2], raw);
      } else if (subcommand === 'references') {
        verify.cmdVerifyReferences(cwd, args[2], raw);
      } else if (subcommand === 'commits') {
        verify.cmdVerifyCommits(cwd, args.slice(2), raw);
      } else if (subcommand === 'artifacts') {
        verify.cmdVerifyArtifacts(cwd, args[2], raw);
      } else if (subcommand === 'key-links') {
        verify.cmdVerifyKeyLinks(cwd, args[2], raw);
      } else if (subcommand === 'ledger') {
        // GATE-09d verifier (Phase 58 Plan 17):
        //   gsd-tools verify ledger <phase> [--strict] [--no-meta-gate]
        //
        // Three structural checks:
        //   1. Claim-coverage: every load-bearing CONTEXT.md claim has a
        //      matching NN-LEDGER.md entry (fuzzy substring match on
        //      entry.context_claim). Authoritative classification rule:
        //      58-04-ledger-schema.md §4 (disjunctive 5-clause).
        //   2. Evidence-paths: every ledger entry with
        //      disposition=implemented_this_phase has non-empty
        //      evidence_paths[] AND every listed path exists on disk.
        //   3. Meta-gate (GATE-09e embedded): every GATE introduced in
        //      the phase (read from CONTEXT.md Requirements-in-scope +
        //      REQUIREMENTS.md traceability table) has >=1 fire-event on
        //      the gate_fire_events extractor (registered by Plan 19).
        //      Warns + skips if extractor not yet registered (deadlock
        //      guard between Plan 17 and Plan 19 execution).
        //
        // Fire-event: ::notice title=GATE-09d::gate_fired=GATE-09d
        //             result=<pass|block> missing_claims=N unwired_gates=M
        // Exit: 0 (raw mode or pass); 1 (block + strict + non-raw).
        const phaseArg = args[2];
        const strict = !args.includes('--no-strict');
        const noMetaGate = args.includes('--no-meta-gate');
        verify.cmdVerifyLedger(cwd, phaseArg, { strict, noMetaGate }, raw);
      } else {
        error('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links, ledger');
      }
      break;
    }

    case 'generate-slug': {
      commands.cmdGenerateSlug(args[1], raw);
      break;
    }

    case 'current-timestamp': {
      commands.cmdCurrentTimestamp(args[1] || 'full', raw);
      break;
    }

    case 'list-todos': {
      commands.cmdForkListTodos(cwd, args[1], raw);
      break;
    }

    case 'verify-path-exists': {
      commands.cmdVerifyPathExists(cwd, args[1], raw);
      break;
    }

    case 'config-ensure-section': {
      config.cmdConfigEnsureSection(cwd, raw);
      break;
    }

    case 'config-set': {
      config.cmdConfigSet(cwd, args[1], args[2], raw);
      break;
    }

    case 'config-get': {
      config.cmdConfigGetGraceful(cwd, args[1], raw);
      break;
    }

    case 'config-set-model-profile': {
      config.cmdConfigSetModelProfile(cwd, args[1], raw);
      break;
    }

    case 'config-new-project': {
      config.cmdConfigNewProject(cwd, args[1], raw);
      break;
    }

    case 'history-digest': {
      commands.cmdHistoryDigest(cwd, raw);
      break;
    }

    case 'phases': {
      const subcommand = args[1];
      if (subcommand === 'list') {
        const typeIndex = args.indexOf('--type');
        const phaseIndex = args.indexOf('--phase');
        const options = {
          type: typeIndex !== -1 ? args[typeIndex + 1] : null,
          phase: phaseIndex !== -1 ? args[phaseIndex + 1] : null,
          includeArchived: args.includes('--include-archived'),
        };
        phase.cmdPhasesList(cwd, options, raw);
      } else if (subcommand === 'clear') {
        milestone.cmdPhasesClear(cwd, raw, args.slice(2));
      } else {
        error('Unknown phases subcommand. Available: list, clear');
      }
      break;
    }

    case 'roadmap': {
      const subcommand = args[1];
      if (subcommand === 'get-phase') {
        roadmap.cmdRoadmapGetPhase(cwd, args[2], raw);
      } else if (subcommand === 'analyze') {
        roadmap.cmdRoadmapAnalyze(cwd, raw);
      } else if (subcommand === 'update-plan-progress') {
        roadmap.cmdRoadmapUpdatePlanProgress(cwd, args[2], raw);
      } else {
        error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
      }
      break;
    }

    case 'requirements': {
      const subcommand = args[1];
      if (subcommand === 'mark-complete') {
        milestone.cmdRequirementsMarkComplete(cwd, args.slice(2), raw);
      } else {
        error('Unknown requirements subcommand. Available: mark-complete');
      }
      break;
    }

    case 'phase': {
      const subcommand = args[1];
      if (subcommand === 'next-decimal') {
        phase.cmdPhaseNextDecimal(cwd, args[2], raw);
      } else if (subcommand === 'add') {
        phase.cmdPhaseAdd(cwd, args.slice(2).join(' '), raw);
      } else if (subcommand === 'insert') {
        phase.cmdPhaseInsert(cwd, args[2], args.slice(3).join(' '), raw);
      } else if (subcommand === 'remove') {
        const forceFlag = args.includes('--force');
        phase.cmdPhaseRemove(cwd, args[2], { force: forceFlag }, raw);
      } else if (subcommand === 'complete') {
        phase.cmdPhaseComplete(cwd, args[2], raw);
      } else if (subcommand === 'advance') {
        // Phase 58 Plan 06 (GATE-01): structural CI-green gate for phase advancement.
        phase.cmdPhaseAdvance(cwd, args.slice(2), raw);
      } else if (subcommand === 'reconcile') {
        // Phase 58 Plan 13 (GATE-10): structural phase-closeout reconciliation.
        reconcile.cmdPhaseReconcile(cwd, args.slice(1), raw);
      } else {
        error('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete, advance, reconcile');
      }
      break;
    }

    case 'milestone': {
      const subcommand = args[1];
      if (subcommand === 'complete') {
        const nameIndex = args.indexOf('--name');
        const archivePhases = args.includes('--archive-phases');
        // Collect --name value (everything after --name until next flag or end)
        let milestoneName = null;
        if (nameIndex !== -1) {
          const nameArgs = [];
          for (let i = nameIndex + 1; i < args.length; i++) {
            if (args[i].startsWith('--')) break;
            nameArgs.push(args[i]);
          }
          milestoneName = nameArgs.join(' ') || null;
        }
        milestone.cmdMilestoneComplete(cwd, args[2], { name: milestoneName, archivePhases }, raw);
      } else {
        error('Unknown milestone subcommand. Available: complete');
      }
      break;
    }

    case 'validate': {
      const subcommand = args[1];
      if (subcommand === 'consistency') {
        verify.cmdValidateConsistency(cwd, raw);
      } else if (subcommand === 'health') {
        const repairFlag = args.includes('--repair');
        verify.cmdValidateHealth(cwd, { repair: repairFlag }, raw);
      } else {
        error('Unknown validate subcommand. Available: consistency, health');
      }
      break;
    }

    case 'progress': {
      const subcommand = args[1] || 'json';
      commands.cmdProgressRender(cwd, subcommand, raw);
      break;
    }

    case 'stats': {
      const subcommand = args[1] || 'json';
      commands.cmdStats(cwd, subcommand, raw);
      break;
    }

    case 'todo': {
      const subcommand = args[1];
      if (subcommand === 'complete') {
        commands.cmdTodoComplete(cwd, args[2], raw);
      } else {
        error('Unknown todo subcommand. Available: complete');
      }
      break;
    }

    case 'scaffold': {
      const scaffoldType = args[1];
      const phaseIndex = args.indexOf('--phase');
      const nameIndex = args.indexOf('--name');
      const scaffoldOptions = {
        phase: phaseIndex !== -1 ? args[phaseIndex + 1] : null,
        name: nameIndex !== -1 ? args.slice(nameIndex + 1).join(' ') : null,
      };
      commands.cmdScaffold(cwd, scaffoldType, scaffoldOptions, raw);
      break;
    }

    case 'init': {
      const workflow = args[1];
      const includes = parseIncludeFlag(args);
      switch (workflow) {
        case 'execute-phase':
          init.cmdInitExecutePhase(cwd, args[2], includes, raw);
          break;
        case 'plan-phase':
          init.cmdInitPlanPhase(cwd, args[2], includes, raw);
          break;
        case 'new-project':
          init.cmdInitNewProject(cwd, raw);
          break;
        case 'new-milestone':
          init.cmdInitNewMilestone(cwd, raw);
          break;
        case 'quick':
          init.cmdInitQuick(cwd, args.slice(2).join(' '), raw);
          break;
        case 'resume':
          init.cmdInitResume(cwd, raw);
          break;
        case 'verify-work':
          init.cmdInitVerifyWork(cwd, args[2], raw);
          break;
        case 'phase-op':
          init.cmdInitPhaseOp(cwd, args[2], raw);
          break;
        case 'todos':
          init.cmdInitTodos(cwd, args[2], raw);
          break;
        case 'milestone-op':
          init.cmdInitMilestoneOp(cwd, raw);
          break;
        case 'map-codebase':
          init.cmdInitMapCodebase(cwd, raw);
          break;
        case 'progress':
          init.cmdInitProgress(cwd, includes, raw);
          break;
        default:
          error(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress`);
      }
      break;
    }

    case 'phase-plan-index': {
      phase.cmdPhasePlanIndex(cwd, args[1], raw);
      break;
    }

    case 'state-snapshot': {
      state.cmdStateSnapshot(cwd, raw);
      break;
    }

    case 'summary-extract': {
      const summaryPath = args[1];
      const fieldsIndex = args.indexOf('--fields');
      const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
      commands.cmdSummaryExtract(cwd, summaryPath, fields, raw);
      break;
    }

    case 'websearch': {
      const query = args[1];
      const limitIdx = args.indexOf('--limit');
      const freshnessIdx = args.indexOf('--freshness');
      await commands.cmdWebsearch(query, {
        limit: limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 10,
        freshness: freshnessIdx !== -1 ? args[freshnessIdx + 1] : null,
      }, raw);
      break;
    }

    case 'manifest': {
      const subcommand = args[1];
      if (subcommand === 'diff-config') {
        manifest.cmdManifestDiffConfig(cwd, raw);
      } else if (subcommand === 'validate') {
        manifest.cmdManifestValidate(cwd, raw);
      } else if (subcommand === 'get-prompts') {
        const feature = args[2];
        manifest.cmdManifestGetPrompts(cwd, feature, raw);
      } else if (subcommand === 'apply-migration') {
        manifest.cmdManifestApplyMigration(cwd, raw);
      } else if (subcommand === 'log-migration') {
        manifest.cmdManifestLogMigration(cwd, raw);
      } else if (subcommand === 'auto-detect') {
        manifest.cmdManifestAutoDetect(cwd, raw);
      } else {
        error('Unknown manifest subcommand. Available: diff-config, validate, get-prompts, apply-migration, log-migration, auto-detect');
      }
      break;
    }

    case 'backlog': {
      const subcommand = args[1];
      if (subcommand === 'add') {
        const titleIdx = args.indexOf('--title');
        const tagsIdx = args.indexOf('--tags');
        const priorityIdx = args.indexOf('--priority');
        const themeIdx = args.indexOf('--theme');
        const sourceIdx = args.indexOf('--source');
        const globalFlag = args.includes('--global');
        backlog.cmdBacklogAdd(cwd, {
          title: titleIdx !== -1 ? args[titleIdx + 1] : null,
          tags: tagsIdx !== -1 ? args[tagsIdx + 1] : null,
          priority: priorityIdx !== -1 ? args[priorityIdx + 1] : 'MEDIUM',
          theme: themeIdx !== -1 ? args[themeIdx + 1] : null,
          source: sourceIdx !== -1 ? args[sourceIdx + 1] : 'command',
          global: globalFlag,
        }, raw);
      } else if (subcommand === 'list') {
        const priorityIdx = args.indexOf('--priority');
        const statusIdx = args.indexOf('--status');
        const tagsIdx = args.indexOf('--tags');
        const globalFlag = args.includes('--global');
        backlog.cmdBacklogList(cwd, {
          priority: priorityIdx !== -1 ? args[priorityIdx + 1] : null,
          status: statusIdx !== -1 ? args[statusIdx + 1] : null,
          tags: tagsIdx !== -1 ? args[tagsIdx + 1] : null,
          global: globalFlag,
        }, raw);
      } else if (subcommand === 'update') {
        const itemId = args[2];
        const priorityIdx = args.indexOf('--priority');
        const statusIdx = args.indexOf('--status');
        const themeIdx = args.indexOf('--theme');
        const tagsIdx = args.indexOf('--tags');
        const milestoneIdx = args.indexOf('--milestone');
        backlog.cmdBacklogUpdate(cwd, itemId, {
          priority: priorityIdx !== -1 ? args[priorityIdx + 1] : undefined,
          status: statusIdx !== -1 ? args[statusIdx + 1] : undefined,
          theme: themeIdx !== -1 ? args[themeIdx + 1] : undefined,
          tags: tagsIdx !== -1 ? args[tagsIdx + 1].split(',').map(t => t.trim()) : undefined,
          milestone: milestoneIdx !== -1 ? args[milestoneIdx + 1] : undefined,
        }, raw);
      } else if (subcommand === 'stats') {
        backlog.cmdBacklogStats(cwd, raw);
      } else if (subcommand === 'group') {
        const byIdx = args.indexOf('--by');
        const globalFlag = args.includes('--global');
        backlog.cmdBacklogGroup(cwd, byIdx !== -1 ? args[byIdx + 1] : 'theme', globalFlag, raw);
      } else if (subcommand === 'promote') {
        const itemId = args[2];
        const toIdx = args.indexOf('--to');
        const milestoneIdx = args.indexOf('--milestone');
        backlog.cmdBacklogPromote(cwd, itemId, toIdx !== -1 ? args[toIdx + 1] : null, milestoneIdx !== -1 ? args[milestoneIdx + 1] : null, raw);
      } else if (subcommand === 'index') {
        const globalFlag = args.includes('--global');
        backlog.cmdBacklogIndex(cwd, globalFlag, raw);
      } else {
        error('Unknown backlog subcommand. Available: add, list, update, stats, group, promote, index');
      }
      break;
    }

    case 'automation': {
      const subcommand = args[1];
      if (subcommand === 'resolve-level') {
        const feature = args[2];
        const contextPctIdx = args.indexOf('--context-pct');
        const runtimeIdx = args.indexOf('--runtime');
        const options = {
          contextPct: contextPctIdx !== -1 ? parseFloat(args[contextPctIdx + 1]) : undefined,
          runtime: runtimeIdx !== -1 ? args[runtimeIdx + 1] : undefined,
        };
        automation.cmdAutomationResolveLevel(cwd, feature, options, raw);
      } else if (subcommand === 'track-event') {
        const feature = args[2];
        const event = args[3];
        const reason = args[4] || undefined;
        automation.cmdAutomationTrackEvent(cwd, feature, event, reason, raw);
      } else if (subcommand === 'lock') {
        const feature = args[2];
        const sourceIdx = args.indexOf('--source');
        const ttlIdx = args.indexOf('--ttl');
        const options = {
          source: sourceIdx !== -1 ? args[sourceIdx + 1] : undefined,
          ttl: ttlIdx !== -1 ? parseInt(args[ttlIdx + 1], 10) : undefined,
        };
        automation.cmdAutomationLock(cwd, feature, options, raw);
      } else if (subcommand === 'unlock') {
        const feature = args[2];
        automation.cmdAutomationUnlock(cwd, feature, raw);
      } else if (subcommand === 'check-lock') {
        const feature = args[2];
        const ttlIdx = args.indexOf('--ttl');
        const options = {
          ttl: ttlIdx !== -1 ? parseInt(args[ttlIdx + 1], 10) : undefined,
        };
        automation.cmdAutomationCheckLock(cwd, feature, options, raw);
      } else if (subcommand === 'regime-change') {
        const desc = args[2];
        const impactIdx = args.indexOf('--impact');
        const priorIdx = args.indexOf('--prior');
        const options = {
          impact: impactIdx !== -1 ? args[impactIdx + 1] : 'Not assessed',
          prior: priorIdx !== -1 ? args[priorIdx + 1] : 'Not recorded',
        };
        automation.cmdAutomationRegimeChange(cwd, desc, options, raw);
      } else if (subcommand === 'reflection-counter') {
        const action = args[2];
        automation.cmdAutomationReflectionCounter(cwd, action, raw);
      } else {
        error('Unknown automation subcommand. Available: resolve-level, track-event, lock, unlock, check-lock, regime-change, reflection-counter');
      }
      break;
    }

    case 'sensors': {
      const subcommand = args[1];
      if (subcommand === 'list') {
        sensors.cmdSensorsList(cwd, raw);
      } else if (subcommand === 'blind-spots') {
        const sensorName = args[2] || undefined;
        sensors.cmdSensorsBlindSpots(cwd, sensorName, raw);
      } else {
        error('Unknown sensors subcommand. Available: list, blind-spots');
      }
      break;
    }

    case 'health-probe': {
      const probeName = args[1];
      if (probeName === 'signal-metrics') {
        healthProbe.cmdHealthProbeSignalMetrics(cwd, raw);
      } else if (probeName === 'signal-density') {
        healthProbe.cmdHealthProbeSignalDensity(cwd, raw);
      } else if (probeName === 'automation-watchdog') {
        healthProbe.cmdHealthProbeAutomationWatchdog(cwd, raw);
      } else if (probeName === 'validation-coverage') {
        healthProbe.cmdHealthProbeValidationCoverage(cwd, raw);
      } else {
        error('Unknown health-probe. Available: signal-metrics, signal-density, automation-watchdog, validation-coverage');
      }
      break;
    }

    case 'patches': {
      patchClassifier.cmdPatches(cwd, raw);
      break;
    }

    case 'kb': {
      const subcommand = args[1];
      if (subcommand === 'rebuild') {
        kb.cmdKbRebuild(cwd, raw);
      } else if (subcommand === 'stats') {
        kb.cmdKbStats(cwd, raw);
      } else if (subcommand === 'migrate') {
        kb.cmdKbMigrate(cwd, raw);
      } else if (subcommand === 'repair') {
        // Phase 59 KB-04d: scope of the repair is carried by the flag(s).
        // Today only `--malformed-targets` is supported; future flags (e.g.
        // `--orphaned-targets`) extend this without breaking callers.
        const repairOptions = {
          malformedTargets: args.includes('--malformed-targets'),
        };
        kb.cmdKbRepair(cwd, raw, repairOptions);
      } else if (subcommand === 'query') {
        // Phase 59 Plan 02 (KB-04b / KB-06a read half): structured AND-filter
        // over signals. Non-mutating; degrades to grep on kb.db absence.
        const qOpts = kbQuery.parseKbQueryOptions(args.slice(2));
        kbQuery.cmdKbQuery(cwd, qOpts, raw);
      } else if (subcommand === 'search') {
        // Phase 59 Plan 02 (KB-04b): FTS5 MATCH over signal_fts + signals
        // join for metadata. Non-mutating; degrades to grep on kb.db absence.
        const searchQuery = args[2];
        const sOpts = kbQuery.parseKbQueryOptions(args.slice(3));
        kbQuery.cmdKbSearch(cwd, searchQuery, sOpts, raw);
      } else if (subcommand === 'link') {
        // Phase 59 Plan 02 (KB-04c / KB-06a read half): inbound/outbound
        // edge traversal. Phase 59 Plan 04 (KB-06b write half): create/delete
        // verbs with BEGIN IMMEDIATE dual-write and frozen-field guard on
        // qualified_by / superseded_by.
        const linkVerb = args[2];
        if (linkVerb === 'show') {
          const signalId = args[3];
          const lOpts = kbLink.parseKbLinkOptions(args.slice(4));
          kbLink.cmdKbLinkShow(cwd, signalId, lOpts, raw);
        } else if (linkVerb === 'create') {
          const srcId = args[3];
          const tgtId = args[4];
          const wOpts = kbLink.parseKbLinkWriteOptions(args.slice(5));
          kbLink.cmdKbLinkCreate(cwd, srcId, tgtId, wOpts, raw);
        } else if (linkVerb === 'delete') {
          const srcId = args[3];
          const tgtId = args[4];
          const wOpts = kbLink.parseKbLinkWriteOptions(args.slice(5));
          kbLink.cmdKbLinkDelete(cwd, srcId, tgtId, wOpts, raw);
        } else {
          error('Usage: gsd-tools kb link <show|create|delete> <signal-id> [...]');
        }
      } else if (subcommand === 'transition') {
        // Phase 59 Plan 04 (KB-06b / KB-07): programmatic lifecycle transition
        // with BEGIN IMMEDIATE dual-write. Replaces the broken-on-Linux
        // reconcile-signal-lifecycle.sh. Usage:
        //   kb transition <signal-id> <new-state> [--reason <text>]
        //                 [--resolved-by-plan <id>] [--strictness strict|flexible|minimal]
        const signalId = args[2];
        const newState = args[3];
        const tOpts = kbTransition.parseKbTransitionOptions(args.slice(4));
        kbTransition.cmdKbTransition(cwd, signalId, newState, tOpts, raw);
      } else if (subcommand === 'health') {
        // Phase 59 Plan 03 (KB-04e / SC-5 / audit §7.1 #7): four-check
        // watchdog over edge integrity, lifecycle-vs-plan consistency,
        // dual-write invariant, and depends_on freshness. Exit code is a
        // bitmask (1=edge, 2=lifecycle, 4=dual_write) so CI can discriminate
        // failure classes without re-parsing text.
        const hOpts = kbHealth.parseKbHealthOptions(args.slice(2));
        kbHealth.cmdKbHealth(cwd, hOpts, raw);
      } else {
        error('Usage: gsd-tools kb <rebuild|stats|migrate|repair|query|search|link|transition|health>');
      }
      break;
    }

    case 'telemetry': {
      const subcommand = args[1];
      const telemetryRaw = raw;
      if (subcommand === 'summary') {
        const includeCaveated = args.includes('--include-caveated');
        telemetry.cmdTelemetrySummary(cwd, { includeCaveated }, telemetryRaw);
      } else if (subcommand === 'session') {
        const sessionId = args[2];
        if (!sessionId) error('Usage: gsd-tools telemetry session <session-id>');
        telemetry.cmdTelemetrySession(cwd, sessionId, telemetryRaw);
      } else if (subcommand === 'phase') {
        const phaseNum = args[2];
        if (!phaseNum) error('Usage: gsd-tools telemetry phase <phase-number>');
        telemetry.cmdTelemetryPhase(cwd, phaseNum, telemetryRaw);
      } else if (subcommand === 'baseline') {
        const includeCaveated = args.includes('--include-caveated');
        telemetry.cmdTelemetryBaseline(cwd, { includeCaveated }, telemetryRaw);
      } else if (subcommand === 'enrich') {
        const sessionId = args[2];
        if (!sessionId) error('Usage: gsd-tools telemetry enrich <session-id>');
        telemetry.cmdTelemetryEnrich(cwd, sessionId, telemetryRaw);
      } else {
        error('Usage: gsd-tools telemetry <summary|session|phase|baseline|enrich>');
      }
      break;
    }

    case 'measurement': {
      measurement.cmdMeasurement(cwd, args.slice(1), raw);
      break;
    }

    case 'quick': {
      // Phase 58 Plan 08 (GATE-03): direct-to-main eligibility classifier.
      // `quick classify [--files <path...>]` returns JSON on stdout and an
      // exit code: 0=pure-docs, 1=runtime-facing, 2=planning-authority, 3=mixed.
      // Omitting --files falls back to `git diff --name-only --cached`.
      const subcommand = args[1];
      if (subcommand === 'classify') {
        quick.cmdQuickClassify(cwd, args.slice(2), raw);
      } else {
        error('Unknown quick subcommand. Available: classify');
      }
      break;
    }

    case 'handoff': {
      // Phase 58 Plan 10 (GATE-04a/04b): resume handoff archive + staleness hard-stop.
      // `handoff resolve [--continue-path PATH] [--state-path PATH] [--auto]`
      // Exit codes: 0 = loaded/archived, 3 = GATE-04b hard-stop (caller aborts),
      //             1 = unexpected error.
      const subcommand = args[1];
      if (subcommand === 'resolve') {
        handoff.cmdHandoffResolve(cwd, args.slice(2), raw);
      } else {
        error('Unknown handoff subcommand. Available: resolve');
      }
      break;
    }

    case 'antipatterns': {
      // Phase 58 Plan 10 (GATE-04c): severity-tagged anti-pattern registry check.
      // `antipatterns check [--pattern-id ID ...] [--auto [--acknowledge-blocking ID ...]]`
      // Exit codes: 0 = pass, 4 = blocking entry needs ack / typed token,
      //             1 = unexpected error.
      const subcommand = args[1];
      if (subcommand === 'check') {
        await handoff.cmdAntipatternsCheck(cwd, args.slice(2), raw);
      } else {
        error('Unknown antipatterns subcommand. Available: check');
      }
      break;
    }

    case 'agent': {
      // Phase 58 Plan 14 (GATE-12): evidence-preserving archive for failed /
      // interrupted agent output. `agent archive --session-id <id> --reason <r>
      // [--phase <N>] [--dry-run] [--metadata <json>] --paths <p> [<p>...]`.
      // Exit codes: 0 = success (all paths archived or missing), 2 = partial
      // failure (one or more moves errored), 1 = usage error.
      const subcommand = args[1];
      if (subcommand === 'archive') {
        archive.cmdAgentArchive(cwd, args.slice(2), raw);
      } else {
        error('Unknown agent subcommand. Available: archive');
      }
      break;
    }

    case 'release': {
      // Phase 58 Plan 15 (GATE-11): release-boundary assertion.
      // `release check [--since <commit>] [--lag-threshold-days N] [--auto]`
      // Exit codes: 0 = current, 1 = lag, 2 = explicitly deferred.
      // Emits `::notice::gate_fired=GATE-11 result=<release_current|release_lag|explicit_defer>` per invocation.
      const subcommand = args[1];
      if (subcommand === 'check') {
        release.cmdReleaseCheck(cwd, args.slice(2), raw);
      } else {
        error('Unknown release subcommand. Available: check');
      }
      break;
    }

    default:
      error(`Unknown command: ${command}`);
  }
}

main();
