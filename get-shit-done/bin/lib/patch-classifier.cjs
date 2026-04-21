'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const pkg = require('../../../package.json');
const {
  fileHash,
  generateManifest,
  replacePathsInContent,
  convertClaudeToCodexMarkdown,
  convertClaudeToCodexAgentToml,
  convertClaudeToCodexSkill,
  claudeToCodexTools,
  PATCHES_DIR_NAME,
  MANIFEST_NAME,
  getGlobalDir,
  extractFrontmatterAndBody,
  extractFrontmatterField,
  injectVersionScope,
  readSettings,
} = require('../../../bin/install.js');

const LEGACY_PATCHES_DIR_NAME = 'gsd-local-patches';
const RUNTIME_DIRS = Object.freeze({
  claude: '.claude',
  codex: '.codex',
});
const CAPABILITY_MATRIX_COLUMN_BY_RUNTIME = Object.freeze({
  claude: 1,
  codex: 4,
});

const skillSourceIndexCache = new Map();

function runtimeDirName(runtime) {
  return RUNTIME_DIRS[runtime] || `.${runtime}`;
}

function runtimePathPrefix(runtime) {
  return `./${runtimeDirName(runtime)}/`;
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalizeRelPath(relPath) {
  return String(relPath || '').replace(/\\/g, '/');
}

function inferRuntimeFromDir(runtimeDir) {
  const normalized = normalizeRelPath(runtimeDir || '');
  if (normalized.endsWith('/.claude') || normalized === '.claude') return 'claude';
  if (normalized.endsWith('/.codex') || normalized === '.codex') return 'codex';
  return null;
}

function readFileHashIfPresent(filePath) {
  return fs.existsSync(filePath) ? fileHash(filePath) : null;
}

function readTextIfPresent(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function getRuntimeAttribution(runtime) {
  if (runtime === 'codex') {
    return undefined;
  }

  try {
    const settings = readSettings(path.join(getGlobalDir('claude'), 'settings.json'));
    if (!settings.attribution || settings.attribution.commit === undefined) {
      return undefined;
    }
    if (settings.attribution.commit === '') {
      return null;
    }
    return settings.attribution.commit;
  } catch {
    return undefined;
  }
}

function applyAttribution(content, attribution) {
  if (attribution === null) {
    return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, '');
  }
  if (attribution === undefined) {
    return content;
  }
  const safeAttribution = attribution.replace(/\$/g, '$$$$');
  return content.replace(/Co-Authored-By:.*$/gim, `Co-Authored-By: ${safeAttribution}`);
}

function isDogfoodingRepo(cwd) {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return false;
    const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (pkgJson.name !== 'get-shit-done-reflect-cc') return false;
    if (!fs.existsSync(path.join(cwd, '.git'))) return false;
    if (!fs.existsSync(path.join(cwd, 'bin', 'install.js'))) return false;
    if (!fs.existsSync(path.join(cwd, 'agents'))) return false;
    if (!fs.existsSync(path.join(cwd, 'get-shit-done'))) return false;
    return true;
  } catch {
    return false;
  }
}

function loadCapabilityMatrix(runtimeDir, runtime = inferRuntimeFromDir(runtimeDir)) {
  const candidateRoots = [runtimeDir];

  if (runtime) {
    try {
      candidateRoots.push(getGlobalDir(runtime));
    } catch {
      // Ignore unsupported runtimes.
    }
  }

  const seen = new Set();
  for (const root of candidateRoots.filter(Boolean)) {
    const resolvedRoot = path.resolve(root);
    if (seen.has(resolvedRoot)) continue;
    seen.add(resolvedRoot);
    const matrixPath = path.join(resolvedRoot, 'get-shit-done-reflect', 'references', 'capability-matrix.md');
    if (fs.existsSync(matrixPath)) {
      return fs.readFileSync(matrixPath, 'utf8');
    }
  }

  return null;
}

function inferCapabilityCategory(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (normalized.includes('hooks/') || normalized.startsWith('hooks/')) return 'hooks';
  if (normalized.startsWith('tool_permissions/')) return 'tool_permissions';
  if (normalized.startsWith('mcp/') || normalized.startsWith('mcp_servers/')) return 'mcp_servers';
  return normalized.split('/')[0] || '';
}

function artifactCategoryApplies(runtime, relPath, capabilityMatrixText) {
  const normalized = normalizeRelPath(relPath);
  if (normalized.includes('hooks/') || normalized.startsWith('hooks/')) {
    if (runtime === 'codex') {
      return { applies: false, reason: 'codex-hooks-under-development' };
    }
    return { applies: true, reason: null };
  }

  const matrixColumn = CAPABILITY_MATRIX_COLUMN_BY_RUNTIME[runtime];
  if (matrixColumn == null) {
    return { applies: true, reason: 'runtime-not-in-matrix-columns' };
  }
  if (!capabilityMatrixText) {
    return { applies: true, reason: null };
  }

  const category = inferCapabilityCategory(normalized);
  if (!category) {
    return { applies: true, reason: null };
  }

  const rows = capabilityMatrixText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && !/^(\|\s*-+\s*)+\|?$/.test(line));

  for (const row of rows) {
    const cells = row.split('|').map((cell) => cell.trim());
    const rowCategory = (cells[1] || '').toLowerCase();
    if (!rowCategory || rowCategory === 'capability' || rowCategory === 'property' || rowCategory === 'feature') {
      continue;
    }
    if (rowCategory !== category.toLowerCase()) {
      continue;
    }

    const cell = (cells[matrixColumn + 1] || '').trim();
    if (!cell) {
      return { applies: true, reason: null };
    }
    if (cell === 'N') {
      return { applies: false, reason: `capability-matrix-${runtime}-column-is-N` };
    }
    if (/^Y\s*\[/.test(cell)) {
      return { applies: true, reason: `capability-matrix-${runtime}-conditional-Y-footnote` };
    }
    return { applies: true, reason: null };
  }

  return { applies: true, reason: null };
}

function buildClassification(className, confidence, evidence, isDogfooding, remediation, lowConfidence = false) {
  const severityByClass = {
    bug: isDogfooding ? 'trace' : 'notable',
    stale: isDogfooding ? 'trace' : 'notable',
    customization: isDogfooding ? 'trace' : 'minor',
    'format-drift': isDogfooding ? 'trace' : 'minor',
    'feature-gap': isDogfooding ? 'trace' : 'notable',
  };

  const result = {
    class: className,
    confidence,
    evidence,
    severity: severityByClass[className],
    remediation,
  };

  if (lowConfidence) {
    result.low_confidence = true;
  }

  return result;
}

function classify({
  relPath,
  runtime,
  manifestHash,
  installedHash,
  sourceHash,
  sourceFileExists,
  inLocalPatches = false,
  crossRuntimeInstalled = null,
  capabilityMatrixText = null,
  isDogfooding = false,
}) {
  const evidence = {
    relPath,
    runtime,
    manifestHash: manifestHash || null,
    installedHash: installedHash || null,
    sourceHash: sourceHash || null,
    sourceFileExists: Boolean(sourceFileExists),
    inLocalPatches: Boolean(inLocalPatches),
  };

  if (crossRuntimeInstalled && crossRuntimeInstalled.claudeHash && crossRuntimeInstalled.codexHash) {
    if (crossRuntimeInstalled.claudeHash !== crossRuntimeInstalled.codexHash) {
      return buildClassification(
        'format-drift',
        'medium',
        { ...evidence, ...crossRuntimeInstalled, note: 'post-normalization hash mismatch' },
        isDogfooding,
        `node bin/install.js --${runtime === 'claude' ? 'codex' : 'claude'}`
      );
    }
  }

  if (!installedHash && sourceFileExists) {
    const applies = artifactCategoryApplies(runtime, relPath, capabilityMatrixText);
    if (!applies.applies) {
      return buildClassification(
        'feature-gap',
        'high',
        { ...evidence, representability_reason: applies.reason },
        isDogfooding,
        null
      );
    }
    return buildClassification(
      'stale',
      inLocalPatches ? 'high' : 'medium',
      { ...evidence, reason: inLocalPatches ? 'patch-backup-without-installed-file' : 'installer-did-not-include-file' },
      isDogfooding,
      `node bin/install.js --${runtime}`
    );
  }

  if (!sourceFileExists) {
    if (installedHash || manifestHash || inLocalPatches) {
      return buildClassification(
        'stale',
        'medium',
        { ...evidence, reason: 'source-file-no-longer-exists' },
        isDogfooding,
        `node bin/install.js --${runtime}`
      );
    }
    return null;
  }

  if (installedHash && sourceHash && installedHash === sourceHash) {
    if (manifestHash && manifestHash !== installedHash) {
      return buildClassification(
        'stale',
        'high',
        { ...evidence, reason: 'manifest-out-of-date' },
        isDogfooding,
        `node bin/install.js --${runtime}`
      );
    }
    return null;
  }

  if (installedHash && sourceHash && installedHash !== sourceHash) {
    if (manifestHash && manifestHash === installedHash) {
      return buildClassification(
        'stale',
        'high',
        { ...evidence, reason: 'installed-matches-manifest-source-changed' },
        isDogfooding,
        `node bin/install.js --${runtime}`
      );
    }

    if (manifestHash && manifestHash === sourceHash && inLocalPatches) {
      return buildClassification(
        'customization',
        'high',
        { ...evidence, reason: 'installed-diff-preserved-in-local-patches' },
        isDogfooding,
        '/gsdr:reapply-patches'
      );
    }

    if (inLocalPatches && manifestHash && manifestHash !== sourceHash) {
      return buildClassification(
        'stale',
        'high',
        { ...evidence, reason: 'historical-patch-backup-precedes-current-source' },
        isDogfooding,
        `node bin/install.js --${runtime}`
      );
    }
  }

  if (manifestHash && installedHash && installedHash !== manifestHash) {
    if (inLocalPatches) {
      return buildClassification(
        'customization',
        sourceHash ? 'medium' : 'high',
        { ...evidence, reason: 'manifest-diverged-and-backup-present' },
        isDogfooding,
        '/gsdr:reapply-patches'
      );
    }

    return buildClassification(
      'bug',
      'low',
      { ...evidence, reason: 'manifest-installed-source-mismatch-without-explanation' },
      isDogfooding,
      'file a bug; check installer output for conversion errors',
      true
    );
  }

  if (!installedHash && inLocalPatches) {
    return buildClassification(
      'stale',
      'high',
      { ...evidence, reason: 'patch-backup-only-entry' },
      isDogfooding,
      `node bin/install.js --${runtime}`
    );
  }

  return null;
}

function scanPatchesDirectories(runtimeDir) {
  const results = [];

  for (const dirName of [PATCHES_DIR_NAME, LEGACY_PATCHES_DIR_NAME]) {
    const backupDir = path.join(runtimeDir, dirName);
    const metaPath = path.join(backupDir, 'backup-meta.json');
    if (!fs.existsSync(metaPath)) continue;

    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const files = Array.isArray(meta.files)
        ? meta.files.map((relPath) => [relPath, null])
        : Object.entries(meta.files || {});

      for (const [rawRelPath, metaEntry] of files) {
        const relPath = normalizeRelPath(rawRelPath);
        results.push({
          relPath,
          filename: relPath,
          backupDir,
          legacyNaming: dirName === LEGACY_PATCHES_DIR_NAME,
          fromVersion: meta.from_version || meta.version || null,
          metaEntry,
        });
      }
    } catch {
      // Skip malformed backup metadata.
    }
  }

  return results;
}

function walkCommandFiles(root, prefix = 'gsdr', result = new Map()) {
  if (!fs.existsSync(root)) return result;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkCommandFiles(entryPath, `${prefix}-${entry.name}`, result);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const baseName = entry.name.replace(/\.md$/, '');
    result.set(`${prefix}-${baseName}`, entryPath);
  }
  return result;
}

function getSkillSourceIndex(cwd) {
  const cacheKey = path.resolve(cwd);
  if (!skillSourceIndexCache.has(cacheKey)) {
    skillSourceIndexCache.set(cacheKey, walkCommandFiles(path.join(cwd, 'commands', 'gsd')));
  }
  return skillSourceIndexCache.get(cacheKey);
}

function resolveAgentSourcePath(cwd, relPath) {
  const baseName = path.basename(relPath).replace(/\.(md|toml)$/, '');
  const direct = path.join(cwd, 'agents', `${baseName}.md`);
  if (fs.existsSync(direct)) return direct;

  if (baseName.startsWith('gsdr-')) {
    const gsdVariant = path.join(cwd, 'agents', `${baseName.replace(/^gsdr-/, 'gsd-')}.md`);
    if (fs.existsSync(gsdVariant)) return gsdVariant;
  }

  return null;
}

function resolveSourceInfo(cwd, runtime, relPath) {
  const normalized = normalizeRelPath(relPath);
  const pathPrefix = runtimePathPrefix(runtime);
  const attribution = getRuntimeAttribution(runtime);
  const versionString = `${pkg.version}+dev`;

  if (normalized === 'AGENTS.md' && runtime === 'codex') {
    return { sourceFileExists: false, sourceHash: null, sourcePath: null };
  }

  if (normalized === 'get-shit-done-reflect/VERSION') {
    return {
      sourceFileExists: true,
      sourceHash: hashContent(Buffer.from(versionString, 'utf8')),
      sourcePath: path.join(cwd, 'package.json'),
    };
  }

  if (normalized.startsWith('get-shit-done-reflect/')) {
    const sourcePath = path.join(cwd, 'get-shit-done', normalized.slice('get-shit-done-reflect/'.length));
    if (!fs.existsSync(sourcePath)) {
      return { sourceFileExists: false, sourceHash: null, sourcePath };
    }
    if (!sourcePath.endsWith('.md')) {
      return { sourceFileExists: true, sourceHash: fileHash(sourcePath), sourcePath };
    }

    let content = fs.readFileSync(sourcePath, 'utf8');
    content = replacePathsInContent(content, pathPrefix, pathPrefix);
    content = applyAttribution(content, attribution);
    if (runtime === 'codex') {
      content = convertClaudeToCodexMarkdown(content);
    }

    return { sourceFileExists: true, sourceHash: hashContent(Buffer.from(content, 'utf8')), sourcePath };
  }

  if (normalized.startsWith('commands/gsdr/') && runtime === 'claude') {
    const sourcePath = path.join(cwd, 'commands', 'gsd', normalized.slice('commands/gsdr/'.length));
    if (!fs.existsSync(sourcePath)) {
      return { sourceFileExists: false, sourceHash: null, sourcePath };
    }

    let content = fs.readFileSync(sourcePath, 'utf8');
    content = replacePathsInContent(content, pathPrefix, pathPrefix);
    content = applyAttribution(content, attribution);
    content = injectVersionScope(content, versionString, 'local');

    return { sourceFileExists: true, sourceHash: hashContent(Buffer.from(content, 'utf8')), sourcePath };
  }

  if (normalized.startsWith('skills/') && runtime === 'codex' && normalized.endsWith('/SKILL.md')) {
    const skillName = normalized.split('/')[1] || '';
    const sourcePath = getSkillSourceIndex(cwd).get(skillName) || null;
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return { sourceFileExists: false, sourceHash: null, sourcePath };
    }

    let content = fs.readFileSync(sourcePath, 'utf8');
    content = replacePathsInContent(content, pathPrefix, pathPrefix);
    content = applyAttribution(content, attribution);
    content = convertClaudeToCodexSkill(content, skillName, pathPrefix);

    return { sourceFileExists: true, sourceHash: hashContent(Buffer.from(content, 'utf8')), sourcePath };
  }

  if (normalized.startsWith('agents/')) {
    const sourcePath = resolveAgentSourcePath(cwd, normalized);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return { sourceFileExists: false, sourceHash: null, sourcePath };
    }

    let content = fs.readFileSync(sourcePath, 'utf8');
    content = replacePathsInContent(content, pathPrefix, pathPrefix);
    content = applyAttribution(content, attribution);

    if (runtime === 'codex' && normalized.endsWith('.toml')) {
      const agentName = path.basename(normalized, '.toml');
      content = convertClaudeToCodexAgentToml(content, agentName);
    }

    return { sourceFileExists: true, sourceHash: hashContent(Buffer.from(content, 'utf8')), sourcePath };
  }

  if (normalized.startsWith('hooks/') && runtime === 'claude') {
    const sourcePath = path.join(cwd, 'hooks', 'dist', path.basename(normalized));
    if (!fs.existsSync(sourcePath)) {
      return { sourceFileExists: false, sourceHash: null, sourcePath };
    }
    return { sourceFileExists: true, sourceHash: fileHash(sourcePath), sourcePath };
  }

  const fallbackSourcePath = path.join(cwd, normalized);
  if (!fs.existsSync(fallbackSourcePath)) {
    return { sourceFileExists: false, sourceHash: null, sourcePath: fallbackSourcePath };
  }

  return { sourceFileExists: true, sourceHash: fileHash(fallbackSourcePath), sourcePath: fallbackSourcePath };
}

function buildSignal(classification, runtime, relPath) {
  return {
    summary: `${classification.class} divergence in ${runtime}: ${relPath}`,
    class: classification.class,
    confidence: classification.confidence,
    signal_type: classification.class === 'feature-gap' || classification.class === 'format-drift'
      ? 'capability-gap'
      : 'convention-deviation',
    severity: classification.severity,
    tags: ['patch-sensor', classification.class, `runtime-${runtime}`],
    evidence: classification.evidence,
    remediation: classification.remediation,
    ...(classification.low_confidence ? { low_confidence: true } : {}),
    detected_by: { runtime: 'unknown', sensor: 'gsd-patch-sensor' },
    about_work: [{ path: relPath, runtime, kind: 'installed-file' }],
  };
}

function loadRuntimeState(cwd, runtime) {
  const runtimeDir = path.join(cwd, runtimeDirName(runtime));
  if (!fs.existsSync(runtimeDir)) {
    return null;
  }

  const manifestPath = path.join(runtimeDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return {
      runtime,
      runtimeDir,
      manifestFiles: manifest.files || {},
      patchEntries: scanPatchesDirectories(runtimeDir),
      capabilityMatrixText: loadCapabilityMatrix(runtimeDir, runtime),
    };
  } catch {
    return {
      runtime,
      runtimeDir,
      manifestFiles: null,
      patchEntries: [],
      capabilityMatrixText: loadCapabilityMatrix(runtimeDir, runtime),
      manifestError: true,
    };
  }
}

function runSensor(cwd) {
  const dogfoodingMode = isDogfoodingRepo(cwd);
  const signals = [];
  const stats = {
    files_scanned: 0,
    divergences_found: 0,
    classification_failures: 0,
  };

  for (const runtime of Object.keys(RUNTIME_DIRS)) {
    const state = loadRuntimeState(cwd, runtime);
    if (!state) continue;
    if (state.manifestError || !state.manifestFiles) {
      stats.classification_failures += 1;
      continue;
    }

    const patchIndex = new Map(state.patchEntries.map((entry) => [entry.relPath, entry]));
    const seen = new Set();

    for (const [rawRelPath, manifestEntry] of Object.entries(state.manifestFiles)) {
      const relPath = normalizeRelPath(rawRelPath);
      const manifestHash = typeof manifestEntry === 'string' ? manifestEntry : manifestEntry?.hash || null;
      const installedHash = readFileHashIfPresent(path.join(state.runtimeDir, relPath));
      const sourceInfo = resolveSourceInfo(cwd, runtime, relPath);
      const classification = classify({
        relPath,
        runtime,
        manifestHash,
        installedHash,
        sourceHash: sourceInfo.sourceHash,
        sourceFileExists: sourceInfo.sourceFileExists,
        inLocalPatches: patchIndex.has(relPath),
        crossRuntimeInstalled: null,
        capabilityMatrixText: state.capabilityMatrixText,
        isDogfooding: dogfoodingMode,
      });

      stats.files_scanned += 1;
      seen.add(relPath);

      if (classification) {
        stats.divergences_found += 1;
        signals.push(buildSignal(classification, runtime, relPath));
      }
    }

    for (const patchEntry of state.patchEntries) {
      if (seen.has(patchEntry.relPath)) continue;

      const installedHash = readFileHashIfPresent(path.join(state.runtimeDir, patchEntry.relPath));
      const sourceInfo = resolveSourceInfo(cwd, runtime, patchEntry.relPath);
      const manifestHash = patchEntry.metaEntry && typeof patchEntry.metaEntry === 'object'
        ? patchEntry.metaEntry.hash || null
        : null;

      const classification = classify({
        relPath: patchEntry.relPath,
        runtime,
        manifestHash,
        installedHash,
        sourceHash: sourceInfo.sourceHash,
        sourceFileExists: sourceInfo.sourceFileExists,
        inLocalPatches: true,
        crossRuntimeInstalled: null,
        capabilityMatrixText: state.capabilityMatrixText,
        isDogfooding: dogfoodingMode,
      });

      stats.files_scanned += 1;

      if (classification) {
        stats.divergences_found += 1;
        signals.push(buildSignal(classification, runtime, patchEntry.relPath));
      }
    }
  }

  return {
    sensor: 'patch',
    signals,
    stats,
    dogfooding_mode: dogfoodingMode,
  };
}

function cmdPatches(cwd, raw) {
  const result = runSensor(cwd);

  if (raw) {
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }

  console.log('');
  if (result.dogfooding_mode) {
    console.log('  Dogfooding mode — GSDR source repo detected. Expected divergence.');
    console.log('');
  }

  console.log(`  Patch-sensor scan: ${result.stats.files_scanned} file entries scanned.`);
  console.log(`  Divergences found: ${result.stats.divergences_found}`);
  if (result.stats.classification_failures > 0) {
    console.log(`  Classification failures: ${result.stats.classification_failures}`);
  }

  if (result.signals.length === 0) {
    console.log('  No divergences.');
    console.log('');
    return 0;
  }

  console.log('');
  console.log('  CLASS            CONFIDENCE  SEVERITY   RUNTIME   PATH');
  for (const signal of result.signals) {
    const relPath = signal.about_work?.[0]?.path || '<unknown>';
    const runtime = signal.about_work?.[0]?.runtime || '<unknown>';
    console.log(
      `  ${String(signal.class || '-').padEnd(16)} ${String(signal.confidence || '-').padEnd(11)} ${String(signal.severity || '-').padEnd(10)} ${String(runtime).padEnd(9)} ${relPath}`
    );
    if (signal.remediation) {
      console.log(`                   -> ${signal.remediation}`);
    }
  }
  console.log('');
  return 0;
}

module.exports = {
  isDogfoodingRepo,
  classify,
  artifactCategoryApplies,
  loadCapabilityMatrix,
  scanPatchesDirectories,
  runSensor,
  cmdPatches,
  LEGACY_PATCHES_DIR_NAME,
  // Exported for consumers that need the installer's exact vocabulary.
  PATCHES_DIR_NAME,
  MANIFEST_NAME,
  generateManifest,
  claudeToCodexTools,
  extractFrontmatterAndBody,
  extractFrontmatterField,
};
