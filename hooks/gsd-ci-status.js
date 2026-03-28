#!/usr/bin/env node
// Check CI status in background, write result to cache
// Called by SessionStart hook - runs once per session

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const cacheDir = path.join(os.homedir(), '.claude', 'cache');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Run check in background
// Pass cacheDir to child; child computes scoped filename from repo+branch
const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');
  const cacheDir = ${JSON.stringify(cacheDir)};

  // Pre-flight: check gh CLI availability
  try { execSync('command -v gh', { stdio: 'ignore', timeout: 3000 }); }
  catch { process.exit(0); } // No gh CLI -- silent exit

  // Derive repo name for project-scoped cache
  let repoName = 'unknown';
  try {
    repoName = execSync('git remote get-url origin', { encoding: 'utf8', timeout: 5000 })
      .trim().split('/').pop().replace(/\\.git$/, '');
  } catch {
    try { repoName = path.basename(process.cwd()); } catch {}
  }

  // Get current branch
  let branch = 'main';
  try { branch = execSync('git branch --show-current', { encoding: 'utf8', timeout: 5000 }).trim() || 'main'; }
  catch {}

  // Project-scoped cache file: gsd-ci-status--{repo}--{branch}.json
  const cacheFile = path.join(cacheDir, 'gsd-ci-status--' + repoName + '--' + branch + '.json');

  // Pre-flight: check gh auth
  try { execSync('gh auth status', { stdio: 'ignore', timeout: 5000 }); }
  catch {
    fs.writeFileSync(cacheFile, JSON.stringify({
      degraded: true,
      reason: 'gh-not-authenticated',
      checked: Math.floor(Date.now() / 1000)
    }));
    process.exit(0);
  }

  // Get latest run for current branch
  try {
    const runs = JSON.parse(execSync(
      'gh run list --branch "' + branch + '" --limit 1 --json conclusion,displayTitle,name,createdAt,headSha,status',
      { encoding: 'utf8', timeout: 10000 }
    ));

    fs.writeFileSync(cacheFile, JSON.stringify({
      branch,
      latest_run: runs[0] || null,
      checked: Math.floor(Date.now() / 1000)
    }));
  } catch {
    // API call failed -- write degraded status
    fs.writeFileSync(cacheFile, JSON.stringify({
      degraded: true,
      reason: 'gh-api-error',
      branch,
      checked: Math.floor(Date.now() / 1000)
    }));
  }
`], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true
});

child.unref();
