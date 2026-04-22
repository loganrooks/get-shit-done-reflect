/**
 * Automation — Automation level resolution, event tracking, locking, regime changes, and reflection counter
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { error, output, loadProjectConfig } = require('./core.cjs');

function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch {
    return null;
  }
}

const installerLib = safeRequire(path.resolve(__dirname, '../../../bin/install.js')) || {};
const getCodexHookSupportStatus = installerLib.getCodexHookSupportStatus;

// ─── Constants ───────────────────────────────────────────────────────────────

const FEATURE_CAPABILITY_MAP = {
  signal_collection: {
    hook_dependent_above: null,  // workflow postlude, not hook-based
    task_tool_dependent: false,
  },
  reflection: {
    hook_dependent_above: null,  // counter-based in workflow
    task_tool_dependent: true,   // spawns reflector as subagent
  },
  health_check: {
    hook_dependent_above: 2,     // session-start nudge needs hooks above level 2
    task_tool_dependent: false,
  },
  ci_status: {
    hook_dependent_above: 1,     // session-start display needs hooks above level 1
    task_tool_dependent: false,
  },
  nyquist_validation: {
    hook_dependent_above: null,   // workflow-triggered, not hook-based
    task_tool_dependent: true,    // spawns gsd-nyquist-auditor via Task()
  },
};

function resolveCodexRuntimeCapabilities(cwd) {
  const localCodexDir = path.join(cwd, '.codex');

  if (typeof getCodexHookSupportStatus !== 'function') {
    return {
      hasHooks: false,
      hasTaskTool: fs.existsSync(localCodexDir),
      hookStatus: null,
      hookStatusError: 'installer helpers unavailable in runtime mirror',
    };
  }

  try {
    const hookStatus = getCodexHookSupportStatus({ cwd, installScope: 'local' });
    return {
      hasHooks: hookStatus.status === 'supported',
      hasTaskTool: Boolean(
        fs.existsSync(localCodexDir) ||
        hookStatus.evidence?.project?.exists ||
        hookStatus.evidence?.global?.exists
      ),
      hookStatus,
    };
  } catch (err) {
    return {
      hasHooks: false,
      hasTaskTool: fs.existsSync(localCodexDir),
      hookStatus: null,
      hookStatusError: err.message,
    };
  }
}

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdAutomationResolveLevel(cwd, feature, options, raw) {
  if (!feature) {
    error('Usage: automation resolve-level <feature> [--context-pct N] [--runtime NAME]');
  }

  const projectConfig = loadProjectConfig(cwd);
  if (!projectConfig) {
    error('No .planning/config.json found.');
  }

  const automation = projectConfig.automation || {};
  const globalLevel = automation.level ?? 1; // Default: nudge

  // Normalize feature name: hyphens -> underscores
  const normalizedFeature = feature.replace(/-/g, '_');

  let effectiveLevel = globalLevel;
  let overrideValue = null;
  const reasons = [];

  // Step 2: Per-feature override (AUTO-02)
  const overrides = automation.overrides || {};
  if (overrides[normalizedFeature] !== undefined) {
    overrideValue = overrides[normalizedFeature];
    effectiveLevel = overrideValue;
    reasons.push(`override: ${normalizedFeature}=${overrideValue}`);
  }

  // Step 2.5: Bridge file context reading (INT-01)
  // When no explicit --context-pct was passed, attempt to read the statusline
  // bridge file from /tmp/ for real context usage data.
  if (options.contextPct === undefined) {
    try {
      const tmpDir = os.tmpdir();
      const bridgeFiles = fs.readdirSync(tmpDir)
        .filter(f => /^claude-ctx-.*\.json$/.test(f) && !f.includes('-warned'))
        .map(f => {
          const fullPath = path.join(tmpDir, f);
          const stat = fs.statSync(fullPath);
          return { path: fullPath, mtime: stat.mtimeMs };
        })
        .sort((a, b) => b.mtime - a.mtime);

      if (bridgeFiles.length > 0) {
        const bridgeContent = fs.readFileSync(bridgeFiles[0].path, 'utf-8');
        const bridgeData = JSON.parse(bridgeContent);
        const nowSec = Math.floor(Date.now() / 1000);
        const ageSec = nowSec - (bridgeData.timestamp || 0);

        if (ageSec <= 120 && bridgeData.used_pct !== undefined) {
          options.contextPct = bridgeData.used_pct;
          reasons.push(`bridge_file: used_pct=${bridgeData.used_pct}%`);
        }
      }
    } catch {
      // Bridge file reading is best-effort -- silent failure
    }
  }

  // Step 3: Context-aware deferral (AUTO-04)
  // Only applies to level 3 (auto) -- levels 0-2 are not context-sensitive
  if (options.contextPct !== undefined) {
    const threshold = automation.context_threshold_pct ?? 60;
    if (options.contextPct > threshold && effectiveLevel >= 3) {
      effectiveLevel = 1; // Downgrade to nudge
      reasons.push(`context_deferred: ${options.contextPct}% > ${threshold}% threshold`);
    }
  }

  // Step 4: Runtime capability cap
  const capEntry = FEATURE_CAPABILITY_MAP[normalizedFeature];
  if (capEntry) {
    // Determine runtime capabilities
    let hasHooks = false;
    let hasTaskTool = false;

    if (options.runtime) {
      // Explicit runtime flag
      hasHooks = options.runtime === 'claude-code' || options.runtime === 'full';
      hasTaskTool = options.runtime === 'claude-code' || options.runtime === 'full';

      if (options.runtime === 'codex-cli') {
        const codexCapabilities = resolveCodexRuntimeCapabilities(cwd);
        hasTaskTool = true;   // multi_agent stable true (codex features list)
        hasHooks = codexCapabilities.hasHooks;
        if (codexCapabilities.hookStatus?.status === 'ambiguous') {
          reasons.push(`codex_hooks_ambiguous: ${codexCapabilities.hookStatus.reason_code}`);
        }
      }
    } else {
      // Heuristic: check for .claude/settings.json with hooks
      try {
        const settingsPath = path.join(cwd, '.claude', 'settings.json');
        if (fs.existsSync(settingsPath)) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
          hasHooks = settings.hooks !== undefined;
          hasTaskTool = true; // Claude Code has task tool if settings exist
        } else {
          // Check for Codex config as fallback
          const codexCapabilities = resolveCodexRuntimeCapabilities(cwd);
          if (codexCapabilities.hasTaskTool) {
            hasTaskTool = true;
            hasHooks = codexCapabilities.hasHooks;
            if (codexCapabilities.hookStatus?.status === 'ambiguous') {
              reasons.push(`codex_hooks_ambiguous: ${codexCapabilities.hookStatus.reason_code}`);
            }
          }
        }
      } catch {
        // settings.json not found or invalid -- assume constrained
      }
    }

    // Cap based on hook dependency
    if (capEntry.hook_dependent_above !== null && !hasHooks) {
      const cap = capEntry.hook_dependent_above;
      if (effectiveLevel > cap) {
        reasons.push(`runtime_capped: ${normalizedFeature} needs hooks above level ${cap}`);
        effectiveLevel = cap;
      }
    }

    // Cap based on task_tool dependency
    if (capEntry.task_tool_dependent && !hasTaskTool) {
      const taskToolCap = 2;
      if (effectiveLevel > taskToolCap) {
        reasons.push(`runtime_capped: ${normalizedFeature} needs task_tool above level ${taskToolCap}`);
        effectiveLevel = taskToolCap;
      }
    }
  }

  // Step 5: Fine-grained knobs (AUTO-03)
  const knobs = automation[normalizedFeature] || {};

  const result = {
    feature: normalizedFeature,
    configured: globalLevel,
    override: overrideValue,
    effective: effectiveLevel,
    reasons,
    knobs,
    level_names: { 0: 'manual', 1: 'nudge', 2: 'prompt', 3: 'auto' }
  };

  output(result, raw);
}

function parseTrackEventReason(event, reason) {
  const parsed = {
    metadata: {},
    reason: reason || undefined,
  };

  if (!reason || event !== 'fire') {
    return parsed;
  }

  const trimmed = String(reason).trim();
  if (!trimmed) {
    return parsed;
  }

  if (trimmed.startsWith('{')) {
    try {
      const payload = JSON.parse(trimmed);
      if (Number.isFinite(payload.last_signal_count)) {
        parsed.metadata.last_signal_count = Number(payload.last_signal_count);
      }
      if (typeof payload.reason === 'string' && payload.reason.trim()) {
        parsed.reason = payload.reason.trim();
      }
      return parsed;
    } catch {
      // Fall through to lightweight key=value parsing.
    }
  }

  const countMatch = trimmed.match(/(?:^|[;, ])(?:signal[-_ ]count|last_signal_count|count)=([0-9]+)/i);
  if (countMatch) {
    parsed.metadata.last_signal_count = Number(countMatch[1]);
    parsed.reason = undefined;
  }

  return parsed;
}

function readAutomationSkipReasons() {
  const manifestPath = path.resolve(__dirname, '..', '..', 'feature-manifest.json');
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return Array.isArray(manifest.automation_skip_reasons)
      ? manifest.automation_skip_reasons
      : [];
  } catch {
    return [];
  }
}

function cmdAutomationTrackEvent(cwd, feature, event, reason, raw) {
  if (!feature || !event) {
    error('Usage: automation track-event <feature> <fire|skip> [reason]');
  }
  if (event !== 'fire' && event !== 'skip') {
    error('Event must be "fire" or "skip"');
  }

  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) {
    error('No .planning/config.json found.');
  }

  // Normalize feature name
  const normalizedFeature = feature.replace(/-/g, '_');

  // Read-modify-write with atomic write
  const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!projectConfig.automation) projectConfig.automation = {};
  if (!projectConfig.automation.stats) projectConfig.automation.stats = {};
  if (!projectConfig.automation.stats[normalizedFeature]) {
    projectConfig.automation.stats[normalizedFeature] = {
      fires: 0,
      skips: 0,
      last_triggered: null,
      last_skip_reason: null,
    };
  }

  const stats = projectConfig.automation.stats[normalizedFeature];
  const parsedReason = parseTrackEventReason(event, reason);
  const skipReason = parsedReason.reason || 'unknown';
  if (event === 'fire') {
    stats.fires++;
    stats.last_triggered = new Date().toISOString();
    stats.last_run_status = 'success';
    if (parsedReason.metadata.last_signal_count !== undefined) {
      stats.last_signal_count = parsedReason.metadata.last_signal_count;
    }
  } else if (event === 'skip') {
    const canonical = readAutomationSkipReasons();
    if (parsedReason.reason && canonical.length > 0 && !canonical.includes(parsedReason.reason)) {
      console.error(`automation track-event: warning: non-canonical skip_reason "${parsedReason.reason}" (not in automation_skip_reasons enum). Continuing.`);
    }
    stats.skips++;
    stats.last_skip_reason = skipReason;
    stats.last_run_status = 'skipped';
  }

  // Atomic write: write to tmp, then rename
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(projectConfig, null, 2) + '\n');
  fs.renameSync(tmpPath, configPath);

  output({ feature: normalizedFeature, event, reason: parsedReason.reason, stats }, raw);
}

function cmdAutomationLock(cwd, feature, options, raw) {
  if (!feature) {
    error('Usage: automation lock <feature> [--source <source>] [--ttl <seconds>]');
  }

  const normalizedFeature = feature.replace(/-/g, '_');
  const lockPath = path.join(cwd, '.planning', `.${normalizedFeature}.lock`);
  const ttl = options.ttl || 300;

  // Check for existing lock
  if (fs.existsSync(lockPath)) {
    const stat = fs.statSync(lockPath);
    const ageSeconds = Math.floor((Date.now() - stat.mtimeMs) / 1000);

    if (ageSeconds > ttl) {
      // Stale lock -- remove and proceed to acquire
      fs.unlinkSync(lockPath);
      const lockContent = {
        pid: process.pid,
        timestamp: new Date().toISOString(),
        trigger_source: options.source || 'unknown',
        ttl_seconds: ttl,
      };
      fs.writeFileSync(lockPath, JSON.stringify(lockContent, null, 2));
      output({ locked: false, acquired: true, stale_removed: true, stale_age_seconds: ageSeconds }, raw);
    } else {
      // Active lock -- report it
      let holder = {};
      try {
        holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      } catch (e) {
        holder = { error: 'could not parse lock file' };
      }
      output({ locked: true, holder, age_seconds: ageSeconds }, raw);
    }
  } else {
    // No lock exists -- acquire
    const lockContent = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      trigger_source: options.source || 'unknown',
      ttl_seconds: ttl,
    };
    fs.writeFileSync(lockPath, JSON.stringify(lockContent, null, 2));
    output({ locked: false, acquired: true }, raw);
  }
}

function cmdAutomationUnlock(cwd, feature, raw) {
  if (!feature) {
    error('Usage: automation unlock <feature>');
  }

  const normalizedFeature = feature.replace(/-/g, '_');
  const lockPath = path.join(cwd, '.planning', `.${normalizedFeature}.lock`);

  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    output({ released: true }, raw);
  } else {
    output({ released: false, reason: 'no_lock_found' }, raw);
  }
}

function cmdAutomationCheckLock(cwd, feature, options, raw) {
  if (!feature) {
    error('Usage: automation check-lock <feature> [--ttl <seconds>]');
  }

  const normalizedFeature = feature.replace(/-/g, '_');
  const lockPath = path.join(cwd, '.planning', `.${normalizedFeature}.lock`);
  const ttl = options.ttl || 300;

  if (!fs.existsSync(lockPath)) {
    output({ locked: false }, raw);
    return;
  }

  const stat = fs.statSync(lockPath);
  const ageSeconds = Math.floor((Date.now() - stat.mtimeMs) / 1000);

  let holder = {};
  try {
    holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (e) {
    holder = { error: 'could not parse lock file' };
  }

  if (ageSeconds > ttl) {
    output({ locked: true, stale: true, age_seconds: ageSeconds, holder }, raw);
  } else {
    output({ locked: true, stale: false, age_seconds: ageSeconds, holder }, raw);
  }
}

function cmdAutomationRegimeChange(cwd, description, options, raw) {
  if (!description) {
    error('Usage: automation regime-change <description> [--impact <impact>] [--prior <prior-regime>]');
  }

  // KB path resolution: project-local primary, ~/.gsd/ fallback. If the
  // project already has a .planning directory, prefer creating the local KB
  // rather than silently switching to the user's global KB.
  const planningDir = path.join(cwd, '.planning');
  let kbDir = path.join(planningDir, 'knowledge');
  if (!fs.existsSync(kbDir) && !fs.existsSync(planningDir)) {
    const globalKbDir = path.join(require('os').homedir(), '.gsd', 'knowledge');
    if (fs.existsSync(globalKbDir)) {
      kbDir = globalKbDir;
    }
    // If neither exists, use project-local and create it
  }

  // Build entry ID
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40).replace(/-$/, '');
  const entryId = `regime-${dateStr}-${slug}`;

  // Project name from cwd basename
  const projectName = path.basename(cwd).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Signal directory
  const signalDir = path.join(kbDir, 'signals', projectName);
  fs.mkdirSync(signalDir, { recursive: true });

  const filePath = path.join(signalDir, `${entryId}.md`);
  const isoTimestamp = now.toISOString();
  const impact = options.impact || 'Not assessed';
  const prior = options.prior || 'Not recorded';

  const content = `---
id: ${entryId}
type: regime_change
project: ${projectName}
tags: [observation-regime, signal-collection, automation]
created: ${isoTimestamp}
status: active
---

# Regime Change: ${description}

## Change

${description}

## Expected Impact

${impact}

## Timestamp

${isoTimestamp}

## Prior Regime

${prior}
`;

  fs.writeFileSync(filePath, content);

  // Attempt to rebuild KB index
  try {
    const projectLocalKbDir = path.join(cwd, '.planning', 'knowledge');
    const bundledScript = path.join(__dirname, '..', 'kb-rebuild-index.sh');
    const gsdHomeScript = process.env.GSD_HOME
      ? path.join(process.env.GSD_HOME, 'bin', 'kb-rebuild-index.sh')
      : null;
    const globalScript = path.join(os.homedir(), '.gsd', 'bin', 'kb-rebuild-index.sh');
    let rebuildScript = null;

    // When writing to a project-local KB, use the script bundled with the
    // current CLI/runtime. Resolving via cwd breaks temp-project and
    // installed-runtime execution, and can accidentally fall back to a large
    // global KB rebuild during tests.
    if (kbDir === projectLocalKbDir && fs.existsSync(bundledScript)) {
      rebuildScript = bundledScript;
    } else if (gsdHomeScript && fs.existsSync(gsdHomeScript)) {
      rebuildScript = gsdHomeScript;
    } else if (fs.existsSync(globalScript)) {
      rebuildScript = globalScript;
    }
    if (rebuildScript) {
      execSync(`bash "${rebuildScript}"`, { cwd: cwd, timeout: 10000, stdio: 'pipe' });
    }
  } catch (e) {
    // Non-blocking: warn but don't fail
    process.stderr.write(`Warning: KB index rebuild failed: ${e.message}\n`);
  }

  output({ written: true, path: filePath, id: entryId }, raw);
}

function cmdAutomationReflectionCounter(cwd, action, raw) {
  if (!action || !['increment', 'check', 'reset'].includes(action)) {
    error('Usage: automation reflection-counter <increment|check|reset>');
  }

  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) {
    error('No .planning/config.json found.');
  }

  const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!projectConfig.automation) projectConfig.automation = {};
  if (!projectConfig.automation.reflection) {
    projectConfig.automation.reflection = {
      auto_reflect: false,
      threshold_phases: 3,
      min_signals: 5,
      phases_since_last_reflect: 0,
      last_reflect_at: null
    };
  }

  const reflection = projectConfig.automation.reflection;

  if (action === 'increment') {
    reflection.phases_since_last_reflect =
      (reflection.phases_since_last_reflect || 0) + 1;
  } else if (action === 'reset') {
    reflection.phases_since_last_reflect = 0;
    reflection.last_reflect_at = new Date().toISOString();
  }
  // 'check' action reads only -- no mutations

  // Atomic write (same pattern as track-event)
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(projectConfig, null, 2) + '\n');
  fs.renameSync(tmpPath, configPath);

  output({
    action,
    phases_since_last_reflect: reflection.phases_since_last_reflect,
    threshold_phases: reflection.threshold_phases || 3,
    min_signals: reflection.min_signals || 5,
    auto_reflect: reflection.auto_reflect || false,
    last_reflect_at: reflection.last_reflect_at
  }, raw);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  cmdAutomationResolveLevel,
  cmdAutomationTrackEvent,
  cmdAutomationLock,
  cmdAutomationUnlock,
  cmdAutomationCheckLock,
  cmdAutomationRegimeChange,
  cmdAutomationReflectionCounter,
  FEATURE_CAPABILITY_MAP,
};
