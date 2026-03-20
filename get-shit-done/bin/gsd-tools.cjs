#!/usr/bin/env node

/**
 * GSD Tools — CLI utility for GSD workflow operations (GSD Reflect fork)
 *
 * Thin dispatcher that routes upstream commands to lib/*.cjs modules and
 * retains only fork init overrides, fork command overrides, and the CLI router.
 * Fork-specific modules extracted in Phase 47: sensors, backlog, health-probe,
 * manifest, automation.
 *
 * Usage: node gsd-tools.cjs <command> [args] [--raw] [--cwd <path>]
 *
 * See upstream docs for full command reference. Fork additions:
 *   manifest diff-config|validate|get-prompts|apply-migration|log-migration|auto-detect
 *   backlog add|list|update|stats|group|promote|index
 *   automation resolve-level|track-event|lock|unlock|check-lock|regime-change|reflection-counter
 *   sensors list|blind-spots
 *   health-probe signal-metrics|signal-density|automation-watchdog
 *
 * Fork init overrides (4-param signature with --include support):
 *   init execute-phase <phase> [--include state,config,roadmap]
 *   init plan-phase <phase> [--include state,roadmap,research,context,verification,uat,requirements]
 *   init progress [--include state,roadmap,project,config]
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

// ─── Fork Init Overrides ─────────────────────────────────────────────────────

function cmdInitExecutePhase(cwd, phase, includes, raw) {
  if (!phase) {
    error('phase required for init execute-phase');
  }

  const cfg = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);
  const milestoneInfo = getMilestoneInfo(cwd);

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),

    // Config flags
    commit_docs: cfg.commit_docs,
    parallelization: cfg.parallelization,
    branching_strategy: cfg.branching_strategy,
    phase_branch_template: cfg.phase_branch_template,
    milestone_branch_template: cfg.milestone_branch_template,
    verifier_enabled: cfg.verifier,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,

    // Plan inventory
    plans: phaseInfo?.plans || [],
    summaries: phaseInfo?.summaries || [],
    incomplete_plans: phaseInfo?.incomplete_plans || [],
    plan_count: phaseInfo?.plans?.length || 0,
    incomplete_count: phaseInfo?.incomplete_plans?.length || 0,

    // Branch name (pre-computed)
    branch_name: cfg.branching_strategy === 'phase' && phaseInfo
      ? cfg.phase_branch_template
          .replace('{phase}', phaseInfo.phase_number)
          .replace('{slug}', phaseInfo.phase_slug || 'phase')
      : cfg.branching_strategy === 'milestone'
        ? cfg.milestone_branch_template
            .replace('{milestone}', milestoneInfo.version)
            .replace('{slug}', generateSlugInternal(milestoneInfo.name) || 'milestone')
        : null,

    // Milestone info
    milestone_version: milestoneInfo.version,
    milestone_name: milestoneInfo.name,
    milestone_slug: generateSlugInternal(milestoneInfo.name),

    // File existence
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    config_exists: pathExistsInternal(cwd, '.planning/config.json'),
  };

  // Include file contents if requested via --include
  if (includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  if (includes.has('config')) {
    result.config_content = safeReadFile(path.join(cwd, '.planning', 'config.json'));
  }
  if (includes.has('roadmap')) {
    result.roadmap_content = safeReadFile(path.join(cwd, '.planning', 'ROADMAP.md'));
  }

  output(result, raw);
}

function cmdInitPlanPhase(cwd, phase, includes, raw) {
  if (!phase) {
    error('phase required for init plan-phase');
  }

  const cfg = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);

  const result = {
    // Models
    researcher_model: resolveModelInternal(cwd, 'gsd-phase-researcher'),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    checker_model: resolveModelInternal(cwd, 'gsd-plan-checker'),

    // Workflow flags
    research_enabled: cfg.research,
    plan_checker_enabled: cfg.plan_checker,
    commit_docs: cfg.commit_docs,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') || null,

    // Existing artifacts
    has_research: phaseInfo?.has_research || false,
    has_context: phaseInfo?.has_context || false,
    has_plans: (phaseInfo?.plans?.length || 0) > 0,
    plan_count: phaseInfo?.plans?.length || 0,

    // Environment
    planning_exists: pathExistsInternal(cwd, '.planning'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
  };

  // Include file contents if requested via --include
  if (includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  if (includes.has('roadmap')) {
    result.roadmap_content = safeReadFile(path.join(cwd, '.planning', 'ROADMAP.md'));
  }
  if (includes.has('requirements')) {
    result.requirements_content = safeReadFile(path.join(cwd, '.planning', 'REQUIREMENTS.md'));
  }
  if (includes.has('context') && phaseInfo?.directory) {
    // Find *-CONTEXT.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) {
        result.context_content = safeReadFile(path.join(phaseDirFull, contextFile));
      }
    } catch {}
  }
  if (includes.has('research') && phaseInfo?.directory) {
    // Find *-RESEARCH.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_content = safeReadFile(path.join(phaseDirFull, researchFile));
      }
    } catch {}
  }
  if (includes.has('verification') && phaseInfo?.directory) {
    // Find *-VERIFICATION.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
      if (verificationFile) {
        result.verification_content = safeReadFile(path.join(phaseDirFull, verificationFile));
      }
    } catch {}
  }
  if (includes.has('uat') && phaseInfo?.directory) {
    // Find *-UAT.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
      if (uatFile) {
        result.uat_content = safeReadFile(path.join(phaseDirFull, uatFile));
      }
    } catch {}
  }

  output(result, raw);
}

function cmdInitTodos(cwd, area, raw) {
  const cfg = loadConfig(cwd);
  const now = new Date();

  // List todos (reuse existing logic)
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');
  let count = 0;
  const todos = [];

  try {
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
        const createdMatch = content.match(/^created:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const areaMatch = content.match(/^area:\s*(.+)$/m);
        const priorityMatch = content.match(/^priority:\s*(.+)$/m);
        const sourceMatch = content.match(/^source:\s*(.+)$/m);
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const todoArea = areaMatch ? areaMatch[1].trim() : 'general';

        if (area && todoArea !== area) continue;

        count++;
        todos.push({
          file,
          created: createdMatch ? createdMatch[1].trim() : 'unknown',
          title: titleMatch ? titleMatch[1].trim() : 'Untitled',
          area: todoArea,
          priority: priorityMatch ? priorityMatch[1].trim() : 'MEDIUM',
          source: sourceMatch ? sourceMatch[1].trim() : 'unknown',
          status: statusMatch ? statusMatch[1].trim() : 'pending',
          path: path.join('.planning', 'todos', 'pending', file),
        });
      } catch {}
    }
  } catch {}

  const result = {
    // Config
    commit_docs: cfg.commit_docs,

    // Timestamps
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),

    // Todo inventory
    todo_count: count,
    todos,
    area_filter: area || null,

    // Paths
    pending_dir: '.planning/todos/pending',
    completed_dir: '.planning/todos/completed',

    // File existence
    planning_exists: pathExistsInternal(cwd, '.planning'),
    todos_dir_exists: pathExistsInternal(cwd, '.planning/todos'),
    pending_dir_exists: pathExistsInternal(cwd, '.planning/todos/pending'),
  };

  output(result, raw);
}

function cmdInitProgress(cwd, includes, raw) {
  const cfg = loadConfig(cwd);
  const milestoneInfo = getMilestoneInfo(cwd);

  // Analyze phases
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const phases = [];
  let currentPhase = null;
  let nextPhase = null;

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      const match = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
      const phaseNumber = match ? match[1] : dir;
      const phaseName = match && match[2] ? match[2] : null;

      const phasePath = path.join(phasesDir, dir);
      const phaseFiles = fs.readdirSync(phasePath);

      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

      const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                     plans.length > 0 ? 'in_progress' :
                     hasResearch ? 'researched' : 'pending';

      const phaseInfo = {
        number: phaseNumber,
        name: phaseName,
        directory: path.join('.planning', 'phases', dir),
        status,
        plan_count: plans.length,
        summary_count: summaries.length,
        has_research: hasResearch,
      };

      phases.push(phaseInfo);

      // Find current (first incomplete with plans) and next (first pending)
      if (!currentPhase && (status === 'in_progress' || status === 'researched')) {
        currentPhase = phaseInfo;
      }
      if (!nextPhase && status === 'pending') {
        nextPhase = phaseInfo;
      }
    }
  } catch {}

  // Check for paused work
  let pausedAt = null;
  try {
    const stateContent = fs.readFileSync(path.join(cwd, '.planning', 'STATE.md'), 'utf-8');
    const pauseMatch = stateContent.match(/\*\*Paused At:\*\*\s*(.+)/);
    if (pauseMatch) pausedAt = pauseMatch[1].trim();
  } catch {}

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),

    // Config
    commit_docs: cfg.commit_docs,

    // Milestone
    milestone_version: milestoneInfo.version,
    milestone_name: milestoneInfo.name,

    // Phase overview
    phases,
    phase_count: phases.length,
    completed_count: phases.filter(p => p.status === 'complete').length,
    in_progress_count: phases.filter(p => p.status === 'in_progress').length,

    // Current state
    current_phase: currentPhase,
    next_phase: nextPhase,
    paused_at: pausedAt,
    has_work_in_progress: !!currentPhase,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
  };

  // Include file contents if requested via --include
  if (includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  if (includes.has('roadmap')) {
    result.roadmap_content = safeReadFile(path.join(cwd, '.planning', 'ROADMAP.md'));
  }
  if (includes.has('project')) {
    result.project_content = safeReadFile(path.join(cwd, '.planning', 'PROJECT.md'));
  }
  if (includes.has('config')) {
    result.config_content = safeReadFile(path.join(cwd, '.planning', 'config.json'));
  }

  output(result, raw);
}

// ─── Fork Frontmatter Validation (signal schema) ─────────────────────────────

const FORK_SIGNAL_SCHEMA = {
  required: ['id', 'type', 'project', 'tags', 'created', 'severity', 'signal_type'],
  conditional: [
    {
      when: { field: 'severity', value: 'critical' },
      require: ['evidence'],
      recommend: ['confidence', 'confidence_basis'],
    },
    {
      when: { field: 'severity', value: 'notable' },
      recommend: ['evidence', 'confidence'],
    },
  ],
  backward_compat: { field: 'lifecycle_state' },
  recommended: ['lifecycle_state', 'signal_category', 'confidence', 'confidence_basis'],
  optional: ['triage', 'remediation', 'verification', 'lifecycle_log',
             'recurrence_of', 'phase', 'plan', 'polarity', 'source',
             'occurrence_count', 'related_signals', 'runtime', 'model',
             'gsd_version', 'durability', 'status'],
};

function cmdForkFrontmatterValidate(cwd, filePath, schemaName, raw) {
  if (!filePath || !schemaName) { error('file and schema required'); }

  // Only handle signal schema; delegate others to upstream
  if (schemaName !== 'signal') {
    frontmatter.cmdFrontmatterValidate(cwd, filePath, schemaName, raw);
    return;
  }

  const schema = FORK_SIGNAL_SCHEMA;
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }
  const fm = frontmatter.extractFrontmatter(content);

  // Check required fields
  const missing = schema.required.filter(f => fm[f] === undefined);
  const present = schema.required.filter(f => fm[f] !== undefined);

  // Check conditional requirements
  const conditionalMissing = [];
  const conditionalWarnings = [];
  const backwardCompat = schema.backward_compat && fm[schema.backward_compat.field] === undefined;
  if (schema.conditional) {
    for (const cond of schema.conditional) {
      if (fm[cond.when.field] === cond.when.value) {
        if (cond.require) {
          for (const f of cond.require) {
            if (fm[f] === undefined) {
              if (backwardCompat) {
                conditionalWarnings.push(`backward_compat: ${f}`);
              } else {
                conditionalMissing.push(f);
              }
            }
          }
        }
        if (cond.recommend) {
          for (const f of cond.recommend) {
            if (fm[f] === undefined) conditionalWarnings.push(f);
          }
        }
      }
    }
  }

  // Evidence content validation: empty evidence objects don't satisfy the requirement
  if (!backwardCompat && schema.conditional) {
    for (const cond of schema.conditional) {
      if (fm[cond.when.field] === cond.when.value && cond.require) {
        for (const f of cond.require) {
          if (f === 'evidence' && fm.evidence !== undefined) {
            const ev = fm.evidence;
            const hasContent = ev.supporting && ev.supporting.length > 0;
            if (!hasContent) {
              conditionalMissing.push('evidence (empty)');
            }
          }
        }
      }
    }
  }

  // Check recommended fields (warnings only)
  const recommendedMissing = [];
  if (schema.recommended) {
    for (const f of schema.recommended) {
      if (fm[f] === undefined) recommendedMissing.push(f);
    }
  }

  const allMissing = [...missing, ...conditionalMissing];
  output({
    valid: allMissing.length === 0,
    missing: allMissing,
    present,
    warnings: [...conditionalWarnings, ...recommendedMissing.map(f => `recommended: ${f}`)],
    schema: schemaName,
  }, raw, allMissing.length === 0 ? 'valid' : 'invalid');
}

// ─── Fork list-todos override (includes priority, source, status) ─────────────

function cmdForkListTodos(cwd, area, raw) {
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');

  let count = 0;
  const todos = [];

  try {
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
        const createdMatch = content.match(/^created:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const areaMatch = content.match(/^area:\s*(.+)$/m);
        const priorityMatch = content.match(/^priority:\s*(.+)$/m);
        const sourceMatch = content.match(/^source:\s*(.+)$/m);
        const statusMatch = content.match(/^status:\s*(.+)$/m);

        const todoArea = areaMatch ? areaMatch[1].trim() : 'general';

        // Apply area filter if specified
        if (area && todoArea !== area) continue;

        count++;
        todos.push({
          file,
          created: createdMatch ? createdMatch[1].trim() : 'unknown',
          title: titleMatch ? titleMatch[1].trim() : 'Untitled',
          area: todoArea,
          priority: priorityMatch ? priorityMatch[1].trim() : 'MEDIUM',
          source: sourceMatch ? sourceMatch[1].trim() : 'unknown',
          status: statusMatch ? statusMatch[1].trim() : 'pending',
          path: path.join('.planning', 'todos', 'pending', file),
        });
      } catch {}
    }
  } catch {}

  const result = { count, todos };
  output(result, raw, count.toString());
}

// ─── Fork config-set/config-get (permissive key paths) ────────────────────────

function cmdForkConfigSet(cwd, keyPath, value, raw) {
  const configPath = path.join(cwd, '.planning', 'config.json');

  if (!keyPath) {
    error('Usage: config-set <key.path> <value>');
  }

  // Parse value (handle booleans and numbers)
  let parsedValue = value;
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  else if (!isNaN(value) && value !== '') parsedValue = Number(value);

  // Try parsing as JSON for complex values
  if (typeof parsedValue === 'string' && (parsedValue.startsWith('[') || parsedValue.startsWith('{'))) {
    try { parsedValue = JSON.parse(parsedValue); } catch {}
  }

  // Load existing config or start with empty object
  let cfg = {};
  try {
    if (fs.existsSync(configPath)) {
      cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    error('Failed to read config.json: ' + err.message);
  }

  // Set nested value using dot notation (e.g., "workflow.research")
  const keys = keyPath.split('.');
  let current = cfg;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = parsedValue;

  // Write back
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
    const result = { updated: true, key: keyPath, value: parsedValue };
    output(result, raw, `${keyPath}=${parsedValue}`);
  } catch (err) {
    error('Failed to write config.json: ' + err.message);
  }
}

function cmdForkConfigGet(cwd, keyPath, raw) {
  if (!keyPath) {
    error('Usage: config-get <key.path>');
  }

  const configPath = path.join(cwd, '.planning', 'config.json');
  let cfg = {};
  try {
    if (fs.existsSync(configPath)) {
      cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    error('Failed to read config.json: ' + err.message);
  }

  // Navigate nested keys
  const keys = keyPath.split('.');
  let current = cfg;
  for (const key of keys) {
    if (current === undefined || current === null || typeof current !== 'object') {
      output({ key: keyPath, value: undefined, found: false }, raw);
      return;
    }
    current = current[key];
  }

  output({ key: keyPath, value: current, found: current !== undefined }, raw, String(current));
}

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
    error('Usage: gsd-tools <command> [args] [--raw] [--cwd <path>]\nCommands: state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, init, manifest, backlog, automation, sensors, health-probe');
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
        cmdForkFrontmatterValidate(cwd, file, schemaIdx !== -1 ? args[schemaIdx + 1] : null, raw);
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
      } else {
        error('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links');
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
      cmdForkListTodos(cwd, args[1], raw);
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
      cmdForkConfigSet(cwd, args[1], args[2], raw);
      break;
    }

    case 'config-get': {
      cmdForkConfigGet(cwd, args[1], raw);
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
      } else {
        error('Unknown phases subcommand. Available: list');
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
      } else {
        error('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete');
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
          cmdInitExecutePhase(cwd, args[2], includes, raw);
          break;
        case 'plan-phase':
          cmdInitPlanPhase(cwd, args[2], includes, raw);
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
          cmdInitTodos(cwd, args[2], raw);
          break;
        case 'milestone-op':
          init.cmdInitMilestoneOp(cwd, raw);
          break;
        case 'map-codebase':
          init.cmdInitMapCodebase(cwd, raw);
          break;
        case 'progress':
          cmdInitProgress(cwd, includes, raw);
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
      } else {
        error('Unknown health-probe. Available: signal-metrics, signal-density, automation-watchdog');
      }
      break;
    }

    default:
      error(`Unknown command: ${command}`);
  }
}

main();
