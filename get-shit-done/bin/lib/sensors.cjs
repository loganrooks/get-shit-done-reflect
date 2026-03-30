/**
 * Sensors -- sensor discovery and blind spot reporting
 */

const fs = require('fs');
const path = require('path');
const { error, output } = require('./core.cjs');

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdSensorsList(cwd, raw) {
  // 1. Discover sensors from file system
  // Try .claude/agents/ first (runtime installed path), fall back to agents/ (dev path)
  let agentsDir = path.join(cwd, '.claude', 'agents');
  if (!fs.existsSync(agentsDir)) {
    agentsDir = path.join(cwd, 'agents');
  }
  if (!fs.existsSync(agentsDir)) {
    error('No agents directory found. Run install first.');
  }

  // Find all sensor agent spec files
  const allFiles = fs.readdirSync(agentsDir);
  const sensorFiles = allFiles.filter(f => /^gsdr?-.*-sensor\.md$/.test(f));

  if (sensorFiles.length === 0) {
    output({ sensors: [], message: 'No sensors discovered' }, raw);
    return;
  }

  // 2. Parse each sensor's frontmatter for contract metadata
  const sensors = sensorFiles.map(file => {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const fmObj = {};
    if (fmMatch) {
      const lines = fmMatch[1].split('\n');
      for (const line of lines) {
        const kvMatch = line.match(/^(\w[\w_]*):\s*(.+)$/);
        if (kvMatch) {
          let val = kvMatch[2].trim();
          if (val === 'null') val = null;
          else if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (/^\d+$/.test(val)) val = parseInt(val, 10);
          fmObj[kvMatch[1]] = val;
        }
      }
    }
    const name = file.replace(/^gsdr?-/, '').replace(/-sensor\.md$/, '');
    return {
      name: fmObj.sensor_name || name,
      file,
      timeout_seconds: fmObj.timeout_seconds || 45,
      config_schema: fmObj.config_schema || null,
    };
  });

  // 3. Cross-reference config for enable/disable
  const configPath = path.join(cwd, '.planning', 'config.json');
  let projectConfig = {};
  if (fs.existsSync(configPath)) {
    try { projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) { /* ignore */ }
  }
  const sensorConfig = (projectConfig.signal_collection && projectConfig.signal_collection.sensors) || {};
  const stats = (projectConfig.automation && projectConfig.automation.stats) || {};

  // 4. Build output rows
  const result = sensors.map(sensor => {
    const cfg = sensorConfig[sensor.name];
    const enabled = cfg && cfg.enabled !== undefined ? cfg.enabled : true;
    const sensorStats = stats['sensor_' + sensor.name];

    // Infer last_run_status from stats
    let lastStatus = 'never';
    if (sensorStats) {
      if (sensorStats.fires > 0 && !sensorStats.last_skip_reason) {
        lastStatus = 'success';
      } else if (sensorStats.last_skip_reason) {
        lastStatus = sensorStats.last_skip_reason;
      } else if (sensorStats.last_triggered) {
        lastStatus = 'success';
      }
    }

    return {
      name: sensor.name,
      enabled,
      timeout: sensor.timeout_seconds,
      last_run: (sensorStats && sensorStats.last_triggered) || 'never',
      last_status: lastStatus,
      signals: (sensorStats && sensorStats.last_signal_count !== undefined) ? sensorStats.last_signal_count : 'N/A',
      fires: (sensorStats && sensorStats.fires) || 0,
      skips: (sensorStats && sensorStats.skips) || 0,
    };
  });

  output({ sensors: result }, raw);
}

function cmdSensorsBlindSpots(cwd, sensorName, raw) {
  // Same discovery logic as cmdSensorsList
  let agentsDir = path.join(cwd, '.claude', 'agents');
  if (!fs.existsSync(agentsDir)) {
    agentsDir = path.join(cwd, 'agents');
  }
  if (!fs.existsSync(agentsDir)) {
    error('No agents directory found.');
  }

  const namePattern = sensorName
    ? new RegExp('^gsdr?-' + sensorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-sensor\\.md$')
    : null;

  const allFiles = fs.readdirSync(agentsDir);
  const sensorFiles = allFiles.filter(f => {
    if (!/^gsdr?-.*-sensor\.md$/.test(f)) return false;
    if (namePattern && !namePattern.test(f)) return false;
    return true;
  });

  if (sensorFiles.length === 0) {
    if (sensorName) {
      error('No sensor found matching "' + sensorName + '"');
    }
    output({ blind_spots: [], message: 'No sensors discovered' }, raw);
    return;
  }

  const blindSpots = sensorFiles.map(file => {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    const name = file.replace(/^gsdr?-/, '').replace(/-sensor\.md$/, '');
    const match = content.match(/<blind_spots>([\s\S]*?)<\/blind_spots>/);
    return {
      sensor: name,
      blind_spots: match ? match[1].trim() : 'No blind spots documented',
    };
  });

  output({ blind_spots: blindSpots }, raw);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  cmdSensorsList,
  cmdSensorsBlindSpots,
};
