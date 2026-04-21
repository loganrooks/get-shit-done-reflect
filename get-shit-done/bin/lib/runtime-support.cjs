'use strict';

const INSTALLER_RUNTIME_METADATA = Object.freeze({
  claude: Object.freeze({
    flag: '--claude',
    label: 'Claude Code',
    dirName: '.claude',
    globalDirDisplay: '~/.claude',
  }),
  codex: Object.freeze({
    flag: '--codex',
    label: 'Codex CLI',
    dirName: '.codex',
    globalDirDisplay: '~/.codex',
  }),
});

const SUPPORTED_INSTALLER_RUNTIMES = Object.freeze(Object.keys(INSTALLER_RUNTIME_METADATA));
const UNSUPPORTED_INSTALLER_TARGETS = Object.freeze(['opencode', 'gemini', 'both']);

function getInstallerRuntimeMetadata(runtime) {
  return INSTALLER_RUNTIME_METADATA[runtime] || null;
}

function getInstallerRuntimeLabel(runtime) {
  return getInstallerRuntimeMetadata(runtime)?.label || runtime;
}

function expandInstallerRuntimeSelection({ all = false, explicit = [] } = {}) {
  if (all) {
    return [...SUPPORTED_INSTALLER_RUNTIMES];
  }

  const unique = [];
  for (const runtime of explicit) {
    if (SUPPORTED_INSTALLER_RUNTIMES.includes(runtime) && !unique.includes(runtime)) {
      unique.push(runtime);
    }
  }

  return unique;
}

function formatUnsupportedRuntimeMessage(targets) {
  const requested = [...new Set(targets)].map((target) => (target === 'both' ? '--both' : `--${target}`));
  const supportedFlags = SUPPORTED_INSTALLER_RUNTIMES
    .map((runtime) => getInstallerRuntimeMetadata(runtime).flag)
    .join(', ');
  const plural = requested.length === 1 ? '' : 's';

  return [
    `Unsupported installer target${plural}: ${requested.join(', ')}.`,
    `Supported installer targets: ${supportedFlags}, or --all for all supported runtimes.`,
    'Legacy Gemini/OpenCode installer support has been removed and is not silently remapped.',
    'If you previously installed those runtimes, remove stale GSDR files from .gemini/, .opencode/, or ~/.config/opencode/ manually if needed.',
  ].join('\n');
}

module.exports = {
  INSTALLER_RUNTIME_METADATA,
  SUPPORTED_INSTALLER_RUNTIMES,
  UNSUPPORTED_INSTALLER_TARGETS,
  getInstallerRuntimeMetadata,
  getInstallerRuntimeLabel,
  expandInstallerRuntimeSelection,
  formatUnsupportedRuntimeMessage,
};
