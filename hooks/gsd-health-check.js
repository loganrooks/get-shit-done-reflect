#!/usr/bin/env node
// Health check session-start trigger
// Called by SessionStart hook - evaluates cached health score
// Follows gsd-ci-status.js pattern: background spawn, cache read, marker write

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const cacheDir = path.join(os.homedir(), '.claude', 'cache');
const cacheFile = path.join(cacheDir, 'gsd-health-score.json');
const markerFile = path.join(cacheDir, 'gsd-health-check-needed');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Run check in background (detached, unref'd)
const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const path = require('path');
  const cacheFile = ${JSON.stringify(cacheFile)};
  const markerFile = ${JSON.stringify(markerFile)};

  // Find project config
  const cwd = process.cwd();
  const configPath = path.join(cwd, '.planning', 'config.json');

  // Read config for frequency and reactive_threshold
  let frequency = 'milestone-only';
  let reactiveThreshold = 'RED';
  let cacheStaleHours = 24;
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    frequency = (config.health_check || {}).frequency || 'milestone-only';
    reactiveThreshold = (config.health_check || {}).reactive_threshold || 'RED';
    cacheStaleHours = (config.health_check || {}).cache_staleness_hours || 24;
  } catch { process.exit(0); } // No config = no trigger

  // Only trigger on 'on-resume' or 'every-phase' frequency
  if (frequency !== 'on-resume' && frequency !== 'every-phase') {
    process.exit(0);
  }

  // Read cached health score
  let needsCheck = false;
  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const ageHours = (Math.floor(Date.now() / 1000) - (cache.checked || 0)) / 3600;

    // Session dedup: if checked within 1 hour, skip (HEALTH-04)
    if (ageHours < 1) {
      process.exit(0);
    }

    // Stale cache: needs fresh check
    if (ageHours >= cacheStaleHours) {
      needsCheck = true;
    }

    // Reactive trigger (HEALTH-06): score below threshold
    if (reactiveThreshold !== 'disabled' && cache.composite) {
      const levels = { GREEN: 0, YELLOW: 1, RED: 2 };
      const scoreLevel = levels[cache.composite] || 0;
      const thresholdLevel = levels[reactiveThreshold] || 2;
      if (scoreLevel >= thresholdLevel) {
        needsCheck = true;
      }
    }
  } catch {
    // No cache or parse error = needs check
    needsCheck = true;
  }

  // Write marker file if check needed
  if (needsCheck) {
    fs.writeFileSync(markerFile, JSON.stringify({
      reason: 'session-start',
      requested: Math.floor(Date.now() / 1000)
    }));
  } else {
    // Clean up stale marker
    try { fs.unlinkSync(markerFile); } catch {}
  }
`], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true
});

child.unref();
