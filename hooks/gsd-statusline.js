#!/usr/bin/env node
// gsd-hook-version: {{GSD_VERSION}}
// Claude Code Statusline - GSD Edition
// Shows: model | current task | directory | context usage

const fs = require('fs');
const path = require('path');
const os = require('os');

// Read JSON from stdin
let input = '';
// Timeout guard: if stdin doesn't close within 3s (e.g. pipe issues on
// Windows/Git Bash), exit silently instead of hanging. See #775.
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const session = data.session_id || '';
    const remaining = data.context_window?.remaining_percentage;

    // Context window display (shows USED percentage scaled to usable context)
    // Claude Code reserves ~16.5% for autocompact buffer, so usable context
    // is 83.5% of the total window. We normalize to show 100% at that point.
    const AUTO_COMPACT_BUFFER_PCT = 16.5;
    let ctx = '';
    if (remaining != null) {
      // Normalize: subtract buffer from remaining, scale to usable range
      const usableRemaining = Math.max(0, ((remaining - AUTO_COMPACT_BUFFER_PCT) / (100 - AUTO_COMPACT_BUFFER_PCT)) * 100);
      const used = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));

      // Write context metrics to bridge file for the context-monitor PostToolUse hook.
      // The monitor reads this file to inject agent-facing warnings when context is low.
      if (session) {
        try {
          const bridgePath = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
          const bridgeData = JSON.stringify({
            session_id: session,
            remaining_percentage: remaining,
            used_pct: used,
            timestamp: Math.floor(Date.now() / 1000)
          });
          fs.writeFileSync(bridgePath, bridgeData);
        } catch (e) {
          // Silent fail -- bridge is best-effort, don't break statusline
        }
      }

      // Build progress bar (10 segments)
      const filled = Math.floor(used / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      // Color based on usable context thresholds
      if (used < 50) {
        ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
      } else if (used < 65) {
        ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
      } else if (used < 80) {
        ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
      } else {
        ctx = ` \x1b[5;31m💀 ${bar} ${used}%\x1b[0m`;
      }
    }

    // Current task from todos
    let task = '';
    const homeDir = os.homedir();
    // Respect CLAUDE_CONFIG_DIR for custom config directory setups (#870)
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');
    const todosDir = path.join(claudeDir, 'todos');
    if (session && fs.existsSync(todosDir)) {
      try {
        const files = fs.readdirSync(todosDir)
          .filter(f => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
          .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
          .sort((a, b) => b.mtime - a.mtime);

        if (files.length > 0) {
          try {
            const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
            const inProgress = todos.find(t => t.status === 'in_progress');
            if (inProgress) task = inProgress.activeForm || '';
          } catch (e) {}
        }
      } catch (e) {
        // Silently fail on file system errors - don't break statusline
      }
    }

    // GSD update available?
    let gsdUpdate = '';
    const cacheFile = path.join(claudeDir, 'cache', 'gsd-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cache.update_available) {
          gsdUpdate = '\x1b[33m⬆ /gsd:update\x1b[0m │ ';
        }
      } catch (e) {}
    }

    // CI status from SessionStart hook cache (project-scoped)
    let ciStatus = '';
    const { execSync } = require('child_process');
    let ciRepoName = 'unknown';
    try {
      ciRepoName = execSync('git remote get-url origin', { encoding: 'utf8', timeout: 5000 })
        .trim().split('/').pop().replace(/\.git$/, '');
    } catch {
      try { ciRepoName = path.basename(process.cwd()); } catch {}
    }
    let ciBranch = 'main';
    try { ciBranch = execSync('git branch --show-current', { encoding: 'utf8', timeout: 5000 }).trim() || 'main'; } catch {}
    const ciCacheFile = path.join(claudeDir, 'cache', 'gsd-ci-status--' + ciRepoName + '--' + ciBranch + '.json');
    if (fs.existsSync(ciCacheFile)) {
      try {
        const ciCache = JSON.parse(fs.readFileSync(ciCacheFile, 'utf8'));
        // Only show if cache is less than 1 hour old and not degraded
        const age = Math.floor(Date.now() / 1000) - (ciCache.checked || 0);
        if (age < 3600 && ciCache.latest_run && ciCache.latest_run.conclusion === 'failure') {
          ciStatus = '\x1b[31mCI FAIL\x1b[0m | ';
        }
      } catch (e) {}
    }

    // Health score traffic light from cached health check
    let healthTag = '';
    const healthCacheFile = path.join(claudeDir, 'cache', 'gsd-health-score.json');
    if (fs.existsSync(healthCacheFile)) {
      try {
        const healthCache = JSON.parse(fs.readFileSync(healthCacheFile, 'utf8'));
        const age = Math.floor(Date.now() / 1000) - (healthCache.checked || 0);
        if (age < 86400) { // Less than 24 hours old
          const composite = healthCache.composite;
          if (composite === 'GREEN') {
            healthTag = '\x1b[32mH\x1b[0m | ';
          } else if (composite === 'YELLOW') {
            healthTag = '\x1b[33mH!\x1b[0m | ';
          } else if (composite === 'RED') {
            healthTag = '\x1b[31mH!!\x1b[0m | ';
          }
        }
      } catch (e) {}
    }

    // Health check needed marker (from SessionStart hook)
    // H? is a PASSIVE indicator -- it tells the user "run /gsd:health-check".
    // The marker is cleaned up by the health check workflow's cleanup_marker step
    // (Plan 02) after any health check run completes, at which point the statusline
    // transitions from H? to H/H!/H!! based on the fresh cached score.
    const healthMarkerFile = path.join(claudeDir, 'cache', 'gsd-health-check-needed');
    if (fs.existsSync(healthMarkerFile)) {
      try {
        const marker = JSON.parse(fs.readFileSync(healthMarkerFile, 'utf8'));
        const age = Math.floor(Date.now() / 1000) - (marker.requested || 0);
        if (age < 3600) { // Marker less than 1 hour old
          // Override health tag with "check needed" indicator
          healthTag = '\x1b[33mH?\x1b[0m | ';
        }
      } catch (e) {}
    }

    // Dev install indicator (VERSION file contains +dev suffix on local installs)
    let devTag = '';
    try {
      const versionFile = path.join(dir, '.claude', 'get-shit-done', 'VERSION');
      if (fs.existsSync(versionFile)) {
        const ver = fs.readFileSync(versionFile, 'utf8').trim();
        if (ver.includes('+dev')) {
          devTag = '\x1b[43;30m DEV \x1b[0m │ ';
        }
      }
    } catch {}


    // Automation level indicator
    let autoTag = '';
    try {
      const autoConfigPath = path.join(dir, '.planning', 'config.json');
      if (fs.existsSync(autoConfigPath)) {
        const cfg = JSON.parse(fs.readFileSync(autoConfigPath, 'utf8'));
        if (cfg.automation && cfg.automation.level !== undefined) {
          const configured = cfg.automation.level;
          // Runtime cap heuristic: check if hooks are available
          // If .claude/settings.json has hooks configured, assume full capability
          let effective = configured;
          try {
            const settingsPath = path.join(dir, '.claude', 'settings.json');
            if (fs.existsSync(settingsPath)) {
              const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
              if (!settings.hooks || Object.keys(settings.hooks).length === 0) {
                // No hooks configured -- cap features that need hooks
                if (configured > 2) effective = 2;
              }
            } else {
              // No settings.json -- assume hookless runtime
              if (configured > 2) effective = 2;
            }
          } catch {}

          if (effective < configured) {
            autoTag = `\x1b[36mAuto:${configured}(${effective})\x1b[0m │ `;
          } else {
            autoTag = `\x1b[36mAuto:${configured}\x1b[0m │ `;
          }
        }
      }
    } catch {}

    // Output
    const dirname = path.basename(dir);
    if (task) {
      process.stdout.write(`${devTag}${gsdUpdate}${ciStatus}${healthTag}${autoTag}\x1b[2m${model}\x1b[0m │ \x1b[1m${task}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctx}`);
    } else {
      process.stdout.write(`${devTag}${gsdUpdate}${ciStatus}${healthTag}${autoTag}\x1b[2m${model}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctx}`);
    }
  } catch (e) {
    // Silent fail - don't break statusline on parse errors
  }
});
