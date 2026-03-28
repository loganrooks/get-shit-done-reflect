/**
 * Health Probe -- signal metrics, density tracking, and automation watchdog
 */

const fs = require('fs');
const path = require('path');
const { output, loadManifest } = require('./core.cjs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveKBDir(cwd) {
  const localKB = path.join(cwd, '.planning', 'knowledge');
  const globalKB = path.join(require('os').homedir(), '.gsd', 'knowledge');
  if (fs.existsSync(localKB)) return localKB;
  if (fs.existsSync(globalKB)) return globalKB;
  return null;
}

/**
 * Find the latest regime_change entry in the signals directory.
 * Returns { id, created } or null if no regime_change found.
 */
function findLatestRegimeChange(kbDir) {
  const signalsDir = path.join(kbDir, 'signals');
  if (!fs.existsSync(signalsDir)) return null;

  let latestRegime = null;
  let latestDate = null;

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Check if this is a regime_change entry
            const typeMatch = content.match(/^type:\s*regime_change/m);
            if (!typeMatch) continue;
            const createdMatch = content.match(/^created:\s*(.+)/m);
            if (!createdMatch) continue;
            const created = new Date(createdMatch[1].trim());
            if (isNaN(created.getTime())) continue;
            if (!latestDate || created > latestDate) {
              latestDate = created;
              const idMatch = content.match(/^id:\s*(.+)/m);
              latestRegime = {
                id: idMatch ? idMatch[1].trim() : entry.name.replace(/\.md$/, ''),
                created: created,
              };
            }
          } catch (e) {
            // Skip unparseable files (Pitfall 1)
          }
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }

  scanDir(signalsDir);
  return latestRegime;
}

/**
 * Collect signal files within the current regime, categorized by lifecycle state.
 * Returns { detected: File[], resolved: File[], all: File[] }
 */
function collectRegimeSignals(kbDir, regimeStart) {
  const signalsDir = path.join(kbDir, 'signals');
  const detected = [];
  const resolved = [];
  const all = [];

  if (!fs.existsSync(signalsDir)) return { detected, resolved, all };

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Skip regime_change entries -- they're not regular signals
            const typeMatch = content.match(/^type:\s*(.+)/m);
            if (!typeMatch) continue;
            const type = typeMatch[1].trim();
            if (type === 'regime_change') continue;

            // Check if within regime
            const createdMatch = content.match(/^created:\s*(.+)/m);
            if (!createdMatch) continue;
            const created = new Date(createdMatch[1].trim());
            if (isNaN(created.getTime())) continue;
            if (regimeStart && created < regimeStart) continue;

            // Check lifecycle state
            const lifecycleMatch = content.match(/^lifecycle_state:\s*(.+)/m);
            const lifecycle = lifecycleMatch ? lifecycleMatch[1].trim() : 'detected';

            // Parse phase
            const phaseMatch = content.match(/^phase:\s*(.+)/m);
            const phaseVal = phaseMatch ? phaseMatch[1].trim() : 'unknown';

            // Parse severity
            const severityMatch = content.match(/^severity:\s*(.+)/m);
            const severity = severityMatch ? severityMatch[1].trim() : 'minor';

            const signalInfo = { path: fullPath, lifecycle, phase: phaseVal, severity, created };
            all.push(signalInfo);

            if (lifecycle === 'detected' || lifecycle === 'triaged') {
              detected.push(signalInfo);
            } else if (lifecycle === 'remediated' || lifecycle === 'verified' || lifecycle === 'closed') {
              resolved.push(signalInfo);
            }
          } catch (e) {
            // Skip unparseable files
          }
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }

  scanDir(signalsDir);
  return { detected, resolved, all };
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * health-probe signal-metrics (HEALTH-08)
 * Computes signal-to-resolution ratio within current observation regime.
 */
function cmdHealthProbeSignalMetrics(cwd, raw) {
  const kbDir = resolveKBDir(cwd);

  if (!kbDir) {
    const result = {
      probe_id: 'signal-metrics',
      checks: [{
        id: 'SIG-RATIO-01',
        description: 'Signal-to-resolution ratio within current regime',
        status: 'WARNING',
        detail: 'KB directory not found -- cannot compute signal metrics',
        data: { detected: 0, resolved: 0, ratio: 0, regime: null },
      }],
      dimension_contribution: {
        type: 'workflow',
        signals: { critical: 0, notable: 0, minor: 0 },
      },
    };
    if (raw) {
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
    console.log('Signal Metrics: KB directory not found');
    process.exit(0);
  }

  // Read threshold from config
  let threshold = 5.0;
  try {
    const configPath = path.join(cwd, '.planning', 'config.json');
    if (fs.existsSync(configPath)) {
      const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (projectConfig.health_check && typeof projectConfig.health_check.resolution_ratio_threshold === 'number') {
        threshold = projectConfig.health_check.resolution_ratio_threshold;
      }
    }
  } catch (e) {
    // Use default threshold
  }

  // Find regime boundary
  const regime = findLatestRegimeChange(kbDir);
  const regimeStart = regime ? regime.created : null;

  // Collect signals within regime
  const signals = collectRegimeSignals(kbDir, regimeStart);

  // Compute ratio
  let ratio;
  if (signals.detected.length === 0 && signals.resolved.length === 0) {
    ratio = 0;
  } else if (signals.resolved.length === 0) {
    ratio = Infinity;
  } else {
    ratio = signals.detected.length / signals.resolved.length;
  }

  const status = (ratio <= threshold || ratio === 0) ? 'PASS' : 'WARNING';

  // Count severity distribution from all signals in regime
  const severityCounts = { critical: 0, notable: 0, minor: 0 };
  for (const sig of signals.all) {
    if (severityCounts[sig.severity] !== undefined) {
      severityCounts[sig.severity]++;
    } else {
      severityCounts.minor++;
    }
  }

  const result = {
    probe_id: 'signal-metrics',
    checks: [{
      id: 'SIG-RATIO-01',
      description: 'Signal-to-resolution ratio within current regime',
      status,
      detail: `Ratio ${signals.detected.length}:${signals.resolved.length} (threshold: ${threshold}:1)`,
      data: {
        detected: signals.detected.length,
        resolved: signals.resolved.length,
        ratio: ratio === Infinity ? 'Infinity' : ratio,
        regime: regime ? regime.id : null,
      },
    }],
    dimension_contribution: {
      type: 'workflow',
      signals: severityCounts,
    },
  };

  if (raw) {
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Human-readable output
  const ratioStr = ratio === Infinity ? 'Infinity' : ratio.toFixed(1);
  console.log(`Signal Metrics (HEALTH-08)`);
  console.log(`  Regime: ${regime ? regime.id : 'all history'}`);
  console.log(`  Detected (unresolved): ${signals.detected.length}`);
  console.log(`  Resolved: ${signals.resolved.length}`);
  console.log(`  Ratio: ${ratioStr}:1 (threshold: ${threshold}:1)`);
  console.log(`  Status: ${status}`);
  process.exit(0);
}

/**
 * health-probe signal-density (HEALTH-09)
 * Tracks signal accumulation rate per phase within current observation regime.
 */
function cmdHealthProbeSignalDensity(cwd, raw) {
  const kbDir = resolveKBDir(cwd);

  if (!kbDir) {
    const result = {
      probe_id: 'signal-density',
      checks: [{
        id: 'SIG-DENSITY-01',
        description: 'Signal density trend within current regime',
        status: 'WARNING',
        detail: 'KB directory not found -- cannot compute signal density',
        data: { phases: [], trend: 'stable' },
      }],
      dimension_contribution: {
        type: 'workflow',
        signals: { critical: 0, notable: 0, minor: 0 },
      },
    };
    if (raw) {
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
    console.log('Signal Density: KB directory not found');
    process.exit(0);
  }

  // Find regime boundary
  const regime = findLatestRegimeChange(kbDir);
  const regimeStart = regime ? regime.created : null;

  // Collect signals within regime
  const signals = collectRegimeSignals(kbDir, regimeStart);

  // Group by phase
  const phaseMap = {};
  for (const sig of signals.all) {
    const phaseVal = sig.phase || 'unknown';
    if (!phaseMap[phaseVal]) phaseMap[phaseVal] = 0;
    phaseMap[phaseVal]++;
  }

  // Build sorted densities array (sort by phase number)
  const densities = Object.entries(phaseMap)
    .map(([phaseVal, count]) => ({ phase: phaseVal, count }))
    .sort((a, b) => {
      const numA = parseFloat(a.phase) || 0;
      const numB = parseFloat(b.phase) || 0;
      return numA - numB;
    });

  // Determine trend from last 3 phases
  let trend = 'stable';
  if (densities.length >= 3) {
    const last3 = densities.slice(-3);
    const increasing = last3[0].count < last3[1].count && last3[1].count < last3[2].count;
    const decreasing = last3[0].count > last3[1].count && last3[1].count > last3[2].count;
    if (increasing) trend = 'increasing';
    else if (decreasing) trend = 'decreasing';
  }

  const status = (trend === 'stable' || trend === 'decreasing') ? 'PASS' : 'WARNING';

  // Count severity distribution
  const severityCounts = { critical: 0, notable: 0, minor: 0 };
  for (const sig of signals.all) {
    if (severityCounts[sig.severity] !== undefined) {
      severityCounts[sig.severity]++;
    } else {
      severityCounts.minor++;
    }
  }

  const result = {
    probe_id: 'signal-density',
    checks: [{
      id: 'SIG-DENSITY-01',
      description: 'Signal density trend within current regime',
      status,
      detail: `Trend: ${trend} across ${densities.length} phases`,
      data: { phases: densities, trend },
    }],
    dimension_contribution: {
      type: 'workflow',
      signals: severityCounts,
    },
  };

  if (raw) {
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Human-readable output
  console.log(`Signal Density (HEALTH-09)`);
  console.log(`  Regime: ${regime ? regime.id : 'all history'}`);
  console.log(`  Phases with signals: ${densities.length}`);
  for (const d of densities) {
    console.log(`    Phase ${d.phase}: ${d.count} signals`);
  }
  console.log(`  Trend: ${trend}`);
  console.log(`  Status: ${status}`);
  process.exit(0);
}

/**
 * health-probe automation-watchdog (HEALTH-07)
 * Verifies automation features are firing at expected cadence.
 */
function cmdHealthProbeAutomationWatchdog(cwd, raw) {
  // Read config for automation stats
  let projectConfig = {};
  const configPath = path.join(cwd, '.planning', 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    // Empty config
  }

  const automationStats = (projectConfig.automation && projectConfig.automation.stats) || {};

  // Load feature manifest for expected features and their frequencies
  const manifest = loadManifest(cwd);
  const features = manifest ? manifest.features || {} : {};

  // Map config_key frequency from manifest to expected cadence
  const featureChecks = [];
  const now = Date.now();

  for (const [featureName, featureDef] of Object.entries(features)) {
    const configKey = featureDef.config_key || featureName;
    const schema = featureDef.schema || {};

    // Determine expected frequency from the feature's config or manifest
    let frequency = null;
    if (schema.frequency) {
      // Check config for actual value, otherwise use default
      const featureConfig = projectConfig[configKey] || {};
      frequency = featureConfig.frequency || schema.frequency.default;
    }

    if (!frequency) continue; // No frequency defined -- skip

    // Derive expected cadence in milliseconds
    let expectedCadenceMs;
    switch (frequency) {
      case 'every-phase':
        expectedCadenceMs = 6 * 3600 * 1000; // ~6 hours
        break;
      case 'on-resume':
        expectedCadenceMs = 24 * 3600 * 1000; // 24 hours
        break;
      case 'milestone-only':
        expectedCadenceMs = 7 * 24 * 3600 * 1000; // 7 days (relaxed)
        break;
      case 'explicit-only':
        continue; // No cadence expectation for explicit-only
      default:
        continue;
    }

    const stats = automationStats[configKey] || {};
    const lastTriggered = stats.last_triggered ? new Date(stats.last_triggered).getTime() : 0;
    const elapsed = now - lastTriggered;
    const staleThreshold = expectedCadenceMs * 3; // 3x expected cadence = stale

    let checkStatus;
    let detail;
    if (!stats.last_triggered) {
      checkStatus = 'WARNING';
      detail = `Feature "${configKey}" has never been triggered (expected cadence: ${frequency})`;
    } else if (elapsed > staleThreshold) {
      checkStatus = 'WARNING';
      const daysStale = Math.floor(elapsed / (24 * 3600 * 1000));
      detail = `Feature "${configKey}" last triggered ${daysStale} days ago (expected cadence: ${frequency})`;
    } else {
      checkStatus = 'PASS';
      const hoursAgo = Math.floor(elapsed / (3600 * 1000));
      detail = `Feature "${configKey}" last triggered ${hoursAgo}h ago (cadence: ${frequency})`;
    }

    featureChecks.push({
      id: `WATCHDOG-${configKey.toUpperCase().replace(/_/g, '-')}`,
      description: `Automation cadence for ${configKey}`,
      status: checkStatus,
      detail,
      data: {
        feature: configKey,
        frequency,
        last_triggered: stats.last_triggered || null,
        fires: stats.fires || 0,
      },
    });
  }

  // If no features with frequency were found, report clean state
  if (featureChecks.length === 0) {
    featureChecks.push({
      id: 'WATCHDOG-NONE',
      description: 'No automation features with cadence expectations found',
      status: 'PASS',
      detail: 'No features have a configured frequency requiring watchdog monitoring',
      data: {},
    });
  }

  const overallStatus = featureChecks.some(c => c.status === 'FAIL') ? 'FAIL'
    : featureChecks.some(c => c.status === 'WARNING') ? 'WARNING' : 'PASS';

  const result = {
    probe_id: 'automation-watchdog',
    checks: featureChecks,
    dimension_contribution: {
      type: 'infrastructure',
      signals: { critical: 0, notable: 0, minor: 0 },
    },
  };

  if (raw) {
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Human-readable output
  console.log('Automation Watchdog (HEALTH-07)');
  for (const check of featureChecks) {
    console.log(`  [${check.status}] ${check.detail}`);
  }
  console.log(`  Overall: ${overallStatus}`);
  process.exit(0);
}

/**
 * health-probe validation-coverage (INT-07)
 * Scans VALIDATION.md files across phases and reports Nyquist compliance coverage.
 */
function cmdHealthProbeValidationCoverage(cwd, raw) {
  const phasesDir = path.join(cwd, '.planning', 'phases');

  // Edge case: no phases directory
  if (!fs.existsSync(phasesDir)) {
    const result = {
      probe_id: 'validation-coverage',
      checks: [{
        id: 'VAL-COVERAGE-01',
        description: 'Nyquist validation coverage across phases',
        status: 'PASS',
        detail: 'No phases directory found',
        data: { phases_scanned: 0, phases_with_validation: 0, average_compliance_pct: 0, below_threshold: [] },
      }],
      dimension_contribution: {
        type: 'quality',
        signals: { critical: 0, notable: 0, minor: 0 },
      },
    };
    if (raw) {
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
    console.log('Validation Coverage: No phases directory found');
    process.exit(0);
  }

  // Read threshold from config
  let threshold = 80;
  try {
    const configPath = path.join(cwd, '.planning', 'config.json');
    if (fs.existsSync(configPath)) {
      const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (projectConfig.health_check && typeof projectConfig.health_check.validation_threshold_pct === 'number') {
        threshold = projectConfig.health_check.validation_threshold_pct;
      }
    }
  } catch (e) {
    // Use default threshold
  }

  // Scan phase directories
  let phaseDirs;
  try {
    phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch (e) {
    phaseDirs = [];
  }

  const scanned = phaseDirs.length;
  let withValidation = 0;
  let totalCompliance = 0;
  const belowThreshold = [];

  for (const phaseDir of phaseDirs) {
    const phaseFullPath = path.join(phasesDir, phaseDir);
    // Look for files ending in -VALIDATION.md
    let files;
    try {
      files = fs.readdirSync(phaseFullPath).filter(f => f.endsWith('-VALIDATION.md'));
    } catch (e) {
      continue;
    }

    for (const file of files) {
      const filePath = path.join(phaseFullPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^compliance_pct:\s*(\d+)/m);
        if (!match) continue;
        const compliancePct = parseInt(match[1], 10);
        withValidation++;
        totalCompliance += compliancePct;
        if (compliancePct < threshold) {
          belowThreshold.push({ phase: phaseDir, file, compliance_pct: compliancePct });
        }
      } catch (e) {
        // Skip unreadable files
      }
    }
  }

  const avgCompliance = withValidation > 0 ? Math.round(totalCompliance / withValidation) : 0;
  const status = belowThreshold.length === 0 ? 'PASS' : 'WARNING';

  // Edge case: no VALIDATION.md files found
  if (withValidation === 0) {
    const result = {
      probe_id: 'validation-coverage',
      checks: [{
        id: 'VAL-COVERAGE-01',
        description: 'Nyquist validation coverage across phases',
        status: 'PASS',
        detail: 'No validation files found',
        data: { phases_scanned: scanned, phases_with_validation: 0, average_compliance_pct: 0, below_threshold: [] },
      }],
      dimension_contribution: {
        type: 'quality',
        signals: { critical: 0, notable: 0, minor: 0 },
      },
    };
    if (raw) {
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
    console.log('Validation Coverage: No validation files found');
    process.exit(0);
  }

  const result = {
    probe_id: 'validation-coverage',
    checks: [{
      id: 'VAL-COVERAGE-01',
      description: 'Nyquist validation coverage across phases',
      status,
      detail: `${withValidation}/${scanned} phases validated, average compliance: ${avgCompliance}%`,
      data: { phases_scanned: scanned, phases_with_validation: withValidation, average_compliance_pct: avgCompliance, below_threshold: belowThreshold },
    }],
    dimension_contribution: {
      type: 'quality',
      signals: { critical: 0, notable: belowThreshold.length > 0 ? 1 : 0, minor: 0 },
    },
  };

  if (raw) {
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Human-readable output
  console.log('Validation Coverage (INT-07)');
  console.log(`  Phases scanned: ${scanned}`);
  console.log(`  Phases with validation: ${withValidation}`);
  console.log(`  Average compliance: ${avgCompliance}%`);
  console.log(`  Threshold: ${threshold}%`);
  if (belowThreshold.length > 0) {
    console.log('  Below threshold:');
    for (const bt of belowThreshold) {
      console.log(`    ${bt.phase}: ${bt.compliance_pct}%`);
    }
  }
  console.log(`  Status: ${status}`);
  process.exit(0);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  cmdHealthProbeSignalMetrics,
  cmdHealthProbeSignalDensity,
  cmdHealthProbeAutomationWatchdog,
  cmdHealthProbeValidationCoverage,
};
