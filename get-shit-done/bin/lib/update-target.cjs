'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const PACKAGE_JSON_PATH = path.resolve(__dirname, '..', '..', '..', 'package.json');
const CODEX_CACHE_DOES_NOT_APPLY_REASON = 'Codex does not install update-check hooks or statusline cache files.';

function expandTildePath(filePath, homeDir = os.homedir()) {
  if (typeof filePath !== 'string') return filePath;
  if (!filePath.startsWith('~/')) return filePath;
  return path.join(homeDir, filePath.slice(2));
}

function getDefaultCodexConfigDir(homeDir = os.homedir()) {
  return path.join(homeDir, '.codex');
}

function getCodexConfigDir(explicitConfigDir = null, env = process.env, homeDir = os.homedir()) {
  if (explicitConfigDir) {
    return path.resolve(expandTildePath(explicitConfigDir, homeDir));
  }
  if (env && env.CODEX_CONFIG_DIR) {
    return path.resolve(expandTildePath(env.CODEX_CONFIG_DIR, homeDir));
  }
  return path.resolve(getDefaultCodexConfigDir(homeDir));
}

function normalizeVersion(version) {
  if (typeof version !== 'string') return null;
  const trimmed = version.trim();
  return trimmed || null;
}

function compareVersions(a, b) {
  const left = String(a || '').replace(/\+dev$/, '').split('.').map(Number);
  const right = String(b || '').replace(/\+dev$/, '').split('.').map(Number);
  const width = Math.max(left.length, right.length);

  for (let index = 0; index < width; index += 1) {
    const leftValue = left[index] || 0;
    const rightValue = right[index] || 0;
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
  }

  return 0;
}

function getLatestPackageVersion(packageJsonPath = PACKAGE_JSON_PATH, readFileSync = fs.readFileSync) {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return normalizeVersion(pkg.version);
  } catch {
    return null;
  }
}

function readVersionIfExists(versionPath, readFileSync = fs.readFileSync) {
  try {
    return normalizeVersion(readFileSync(versionPath, 'utf8'));
  } catch {
    return null;
  }
}

function getScopeLabel(scope) {
  return scope === 'global' ? 'global Codex install' : 'repo-local Codex mirror';
}

function buildCodexScopeState({
  scope,
  dir,
  latestVersion,
  readFileSync = fs.readFileSync,
}) {
  const resolvedDir = path.resolve(dir);
  const versionPath = path.join(resolvedDir, 'get-shit-done-reflect', 'VERSION');
  const version = readVersionIfExists(versionPath, readFileSync);
  const exists = Boolean(version);
  const compareToLatest = exists && latestVersion ? compareVersions(version, latestVersion) : null;
  const isStale = compareToLatest !== null ? compareToLatest < 0 : false;

  return {
    scope,
    label: getScopeLabel(scope),
    dir: resolvedDir,
    version_path: versionPath,
    version,
    exists,
    status: exists ? (isStale ? 'stale' : 'current') : 'missing',
    is_stale: isStale,
    compare_to_latest: compareToLatest,
    evidence_role: scope === 'global' ? 'installed_harness' : 'repo_mirror',
  };
}

function buildCodexInstallArgs(scope, configDir, defaultConfigDir) {
  const args = ['--codex', scope === 'global' ? '--global' : '--local'];
  if (
    scope === 'global' &&
    configDir &&
    defaultConfigDir &&
    path.resolve(configDir) !== path.resolve(defaultConfigDir)
  ) {
    args.push('--config-dir', configDir);
  }
  return args;
}

function cloneScope(scope, extra = {}) {
  return Object.assign({}, scope, extra);
}

function compareScopeAge(left, right) {
  if (!left || !left.exists) return 1;
  if (!right || !right.exists) return -1;
  return compareVersions(left.version, right.version);
}

function selectOlderStaleScope(staleScopes) {
  if (staleScopes.length === 1) return staleScopes[0];
  const [first, second] = staleScopes;
  const comparison = compareScopeAge(first, second);
  if (comparison < 0) return first;
  if (comparison > 0) return second;
  return staleScopes.find(scope => scope.scope === 'global') || first;
}

function shouldSurfaceRemainingScope(selectedScope, otherScope) {
  if (!selectedScope || !otherScope || !otherScope.exists) return false;
  if (selectedScope.is_stale || otherScope.is_stale) return true;
  if (!selectedScope.version || !otherScope.version) return false;
  return compareVersions(selectedScope.version, otherScope.version) !== 0;
}

function describeRemainingScope(selectedScope, otherScope) {
  if (!selectedScope || !otherScope) return null;

  if (selectedScope.is_stale && otherScope.is_stale) {
    return `The ${otherScope.scope} scope also remains stale after selecting ${selectedScope.scope}.`;
  }

  if (otherScope.is_stale) {
    return `The ${otherScope.scope} scope remains stale and differs from the selected ${selectedScope.scope} scope.`;
  }

  return `The ${otherScope.scope} scope differs from the selected ${selectedScope.scope} scope.`;
}

function describeSelection({ selectedScope, otherScope, staleScopes, existingScopes }) {
  if (staleScopes.length > 1) {
    const otherLabel = otherScope ? getScopeLabel(otherScope.scope) : 'other scope';
    if (otherScope && compareVersions(selectedScope.version, otherScope.version) === 0) {
      return {
        reason_code: `both_scopes_stale_same_version_select_${selectedScope.scope}`,
        reason: `Selected ${getScopeLabel(selectedScope.scope)} because both scopes are stale at the same version and global authority wins the tie.`,
      };
    }
    return {
      reason_code: `both_scopes_stale_select_${selectedScope.scope}`,
      reason: `Selected ${getScopeLabel(selectedScope.scope)} because both scopes are stale and it is older than the ${otherLabel}.`,
    };
  }

  if (staleScopes.length === 1) {
    if (!otherScope || !otherScope.exists) {
      return {
        reason_code: `${selectedScope.scope}_stale_only_detected_scope`,
        reason: `Selected ${getScopeLabel(selectedScope.scope)} because it is the only detected Codex scope and it is stale.`,
      };
    }
    return {
      reason_code: `${selectedScope.scope}_stale_${otherScope.scope}_newer`,
      reason: `Selected ${getScopeLabel(selectedScope.scope)} because it is stale while the ${getScopeLabel(otherScope.scope)} is newer.`,
    };
  }

  if (existingScopes.length === 0) {
    return {
      reason_code: 'no_codex_install_detected_default_global',
      reason: 'No Codex install was detected, so the global scope is the default update target.',
    };
  }

  if (existingScopes.length === 1) {
    return {
      reason_code: `${selectedScope.scope}_only_detected_scope`,
      reason: `Selected ${getScopeLabel(selectedScope.scope)} because it is the only detected Codex scope; no update is currently required.`,
    };
  }

  if (otherScope && compareVersions(selectedScope.version, otherScope.version) !== 0) {
    return {
      reason_code: `no_stale_scopes_select_${selectedScope.scope}_by_authority`,
      reason: `Selected ${getScopeLabel(selectedScope.scope)} by authority because no scope is stale, even though the two scopes diverge.`,
    };
  }

  return {
    reason_code: `no_stale_scopes_select_${selectedScope.scope}`,
    reason: `Selected ${getScopeLabel(selectedScope.scope)} because no detected Codex scope is stale.`,
  };
}

function selectCodexUpdateTarget({
  local,
  global,
  configDir,
  defaultConfigDir,
}) {
  const existingScopes = [global, local].filter(scope => scope.exists);
  const staleScopes = existingScopes.filter(scope => scope.is_stale);

  let selectedScope = null;
  if (staleScopes.length > 0) {
    selectedScope = selectOlderStaleScope(staleScopes);
  } else if (global.exists) {
    selectedScope = global;
  } else if (local.exists) {
    selectedScope = local;
  } else {
    selectedScope = cloneScope(global, {
      exists: false,
      version: null,
      status: 'missing',
      is_stale: false,
      compare_to_latest: null,
    });
  }

  const otherScope = selectedScope.scope === 'global' ? local : global;
  const { reason, reason_code } = describeSelection({
    selectedScope,
    otherScope,
    staleScopes,
    existingScopes,
  });

  const remainingScope = shouldSurfaceRemainingScope(selectedScope, otherScope)
    ? cloneScope(otherScope, { reason: describeRemainingScope(selectedScope, otherScope) })
    : null;

  return {
    selected_target: cloneScope(selectedScope),
    install_args: buildCodexInstallArgs(selectedScope.scope, configDir, defaultConfigDir),
    reason,
    reason_code,
    remaining_divergent_scope: remainingScope,
  };
}

function resolveCodexUpdateTarget({
  cwd = process.cwd(),
  explicitConfigDir = null,
  env = process.env,
  homeDir = os.homedir(),
  latestVersion = getLatestPackageVersion(),
  readFileSync = fs.readFileSync,
} = {}) {
  const resolvedCwd = path.resolve(cwd);
  const configDir = getCodexConfigDir(explicitConfigDir, env, homeDir);
  const defaultConfigDir = getDefaultCodexConfigDir(homeDir);
  const local = buildCodexScopeState({
    scope: 'local',
    dir: path.join(resolvedCwd, '.codex'),
    latestVersion,
    readFileSync,
  });
  const global = buildCodexScopeState({
    scope: 'global',
    dir: configDir,
    latestVersion,
    readFileSync,
  });

  const selection = selectCodexUpdateTarget({
    local,
    global,
    configDir,
    defaultConfigDir,
  });

  return {
    runtime: 'codex',
    latest_version: latestVersion,
    config_dir: configDir,
    local,
    global,
    selected_target: selection.selected_target,
    install_args: selection.install_args,
    reason: selection.reason,
    reason_code: selection.reason_code,
    cache_to_clear: null,
    does_not_apply_reason: CODEX_CACHE_DOES_NOT_APPLY_REASON,
    remaining_divergent_scope: selection.remaining_divergent_scope,
    update_available: Boolean(selection.selected_target && selection.selected_target.is_stale),
  };
}

module.exports = {
  CODEX_CACHE_DOES_NOT_APPLY_REASON,
  buildCodexInstallArgs,
  buildCodexScopeState,
  compareVersions,
  expandTildePath,
  getCodexConfigDir,
  getDefaultCodexConfigDir,
  getLatestPackageVersion,
  resolveCodexUpdateTarget,
  selectCodexUpdateTarget,
};
