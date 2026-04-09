/**
 * Sensors -- sensor discovery and blind spot reporting
 */

const fs = require('fs');
const path = require('path');
const { error, output } = require('./core.cjs');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Discover all agent directories that exist.
 * Priority order: .claude/agents/ > .codex/agents/ > agents/
 */
function discoverSensorDirs(cwd) {
  const candidates = [
    path.join(cwd, '.claude', 'agents'),
    path.join(cwd, '.codex', 'agents'),
    path.join(cwd, 'agents'),
  ];
  return candidates.filter(d => fs.existsSync(d));
}

/**
 * Discover sensors across all directories. First-seen-wins deduplication:
 * if the same sensor name appears in multiple dirs, the earlier dir takes precedence.
 */
function discoverSensors(dirs) {
  const sensorPattern = /^gsdr?-(.+)-sensor\.(md|toml)$/;
  const seen = new Map(); // name -> { file, dir, ext }
  for (const dir of dirs) {
    let files;
    try { files = fs.readdirSync(dir); } catch { continue; }
    for (const file of files) {
      const match = file.match(sensorPattern);
      if (!match) continue;
      const name = match[1];
      const ext = match[2];
      if (!seen.has(name)) {
        seen.set(name, { file, dir, ext });
      }
    }
  }
  return seen;
}

/**
 * Parse sensor metadata from a file.
 * .md files: extract YAML frontmatter fields.
 * .toml files: use filename-derived name + defaults; extract explicit top-level keys if present.
 */
function parseSensorMetadata(filePath, ext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fmObj = {};

  if (ext === 'md') {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
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
  } else if (ext === 'toml') {
    // Extract explicit top-level TOML keys if present (simple line-by-line regex)
    for (const line of content.split('\n')) {
      const snMatch = line.match(/^sensor_name\s*=\s*"([^"]+)"/);
      if (snMatch) fmObj.sensor_name = snMatch[1];
      const tsMatch = line.match(/^timeout_seconds\s*=\s*(\d+)/);
      if (tsMatch) fmObj.timeout_seconds = parseInt(tsMatch[1], 10);
      const csMatch = line.match(/^config_schema\s*=\s*"([^"]+)"/);
      if (csMatch) fmObj.config_schema = csMatch[1];
    }
  }

  return fmObj;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdSensorsList(cwd, raw) {
  // 1. Discover sensors from file system (multi-directory, multi-format)
  const dirs = discoverSensorDirs(cwd);
  if (dirs.length === 0) {
    error('No agents directory found. Run install first.');
  }
  const sensorMap = discoverSensors(dirs);
  if (sensorMap.size === 0) {
    output({ sensors: [], message: 'No sensors discovered' }, raw);
    return;
  }

  // 2. Parse each sensor's metadata
  const sensors = [];
  for (const [name, { file, dir, ext }] of sensorMap) {
    const filePath = path.join(dir, file);
    const fmObj = parseSensorMetadata(filePath, ext);
    sensors.push({
      name: fmObj.sensor_name || name,
      file,
      timeout_seconds: fmObj.timeout_seconds || 45,
      config_schema: fmObj.config_schema || null,
    });
  }

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
  // Multi-directory discovery (same as cmdSensorsList)
  const dirs = discoverSensorDirs(cwd);
  if (dirs.length === 0) {
    error('No agents directory found.');
  }

  const namePattern = sensorName
    ? new RegExp('^gsdr?-' + sensorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-sensor\\.(md|toml)$')
    : null;

  // Collect sensor files from all directories with dedup
  const sensorPattern = /^gsdr?-.*-sensor\.(md|toml)$/;
  const seenNames = new Set();
  const sensorEntries = []; // { file, dir }

  for (const dir of dirs) {
    let allFiles;
    try { allFiles = fs.readdirSync(dir); } catch { continue; }
    for (const file of allFiles) {
      if (!sensorPattern.test(file)) continue;
      if (namePattern && !namePattern.test(file)) continue;
      const name = file.replace(/^gsdr?-/, '').replace(/-sensor\.(md|toml)$/, '');
      if (!seenNames.has(name)) {
        seenNames.add(name);
        sensorEntries.push({ file, dir });
      }
    }
  }

  if (sensorEntries.length === 0) {
    if (sensorName) {
      error('No sensor found matching "' + sensorName + '"');
    }
    output({ blind_spots: [], message: 'No sensors discovered' }, raw);
    return;
  }

  const blindSpots = sensorEntries.map(({ file, dir }) => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const name = file.replace(/^gsdr?-/, '').replace(/-sensor\.(md|toml)$/, '');
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
  // Exported for testing
  discoverSensorDirs,
  discoverSensors,
  parseSensorMetadata,
};
