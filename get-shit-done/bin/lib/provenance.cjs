'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  MODEL_PROFILES,
  loadConfig,
  resolveModelInternal,
  getRuntimeSessionIdentifiers,
} = require('./core.cjs');

const ROLE_TO_AGENT_TYPE = Object.freeze({
  planner: 'gsd-planner',
  executor: 'gsd-executor',
  verifier: 'gsd-verifier',
  sensor: 'gsd-artifact-sensor',
  synthesizer: 'gsd-signal-synthesizer',
});

const CODEX_EFFORT_BY_TIER = Object.freeze({
  opus: 'xhigh',
  sonnet: 'high',
  haiku: 'medium',
});

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return null;
  }
}

function getCodexThreadMetadata(threadId) {
  if (!threadId) return null;

  const stateStorePath = path.join(os.homedir(), '.codex', 'state_5.sqlite');
  if (!fs.existsSync(stateStorePath)) return null;

  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(stateStorePath, { readonly: true });
    try {
      return db.prepare(`
        SELECT model, reasoning_effort, model_provider
        FROM threads
        WHERE id = ?
      `).get(threadId) || null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

function getAgentTier(cwd, agentType) {
  const normalizedType = agentType.replace(/^gsdr-/, 'gsd-');
  const config = loadConfig(cwd);
  const override = config.model_overrides?.[normalizedType] ?? config.model_overrides?.[agentType];
  if (override) {
    if (['opus', 'sonnet', 'haiku', 'inherit'].includes(override)) {
      return override;
    }
    return null;
  }

  const profile = String(config.model_profile || 'balanced').toLowerCase();
  const agentModels = MODEL_PROFILES[normalizedType] || MODEL_PROFILES[agentType];
  if (!agentModels) return null;
  if (profile === 'inherit') return 'inherit';
  return agentModels[profile] || agentModels.balanced || null;
}

function detectRuntime(cwd) {
  const session = getRuntimeSessionIdentifiers();
  if (session.runtime) return session.runtime;

  if (fs.existsSync(path.join(cwd, '.codex', 'config.toml'))) return 'codex-cli';
  if (fs.existsSync(path.join(cwd, '.claude', 'settings.json'))) return 'claude-code';
  return null;
}

function resolveWriterRuntimeContext(cwd) {
  const session = getRuntimeSessionIdentifiers();
  const runtime = session.runtime || detectRuntime(cwd);
  const harness = runtime || 'not_available';
  const platform = runtime === 'codex-cli'
    ? 'codex'
    : runtime === 'claude-code'
      ? 'claude'
      : 'not_available';
  const vendor = runtime === 'codex-cli'
    ? 'openai'
    : runtime === 'claude-code'
      ? 'anthropic'
      : 'not_available';

  return {
    runtime,
    harness,
    platform,
    vendor,
    session_id: session.session_id || 'not_available',
    status: {
      harness: runtime ? 'exposed' : 'not_available',
      platform: runtime ? 'derived' : 'not_available',
      vendor: runtime ? 'derived' : 'not_available',
      session_id: session.session_id ? 'exposed' : 'not_available',
    },
    source: {
      harness: runtime ? 'runtime_context' : 'not_available',
      platform: runtime ? 'derived_from_harness' : 'not_available',
      vendor: runtime ? 'derived_from_harness' : 'not_available',
      session_id: session.session_source || 'not_available',
    },
  };
}

function resolveWriterGsdVersion(cwd, runtimeContext) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  let configVersion = null;
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (parsed && typeof parsed.gsd_reflect_version === 'string' && parsed.gsd_reflect_version.trim()) {
      configVersion = parsed.gsd_reflect_version.trim();
    }
  } catch {}

  const runtime = runtimeContext && runtimeContext.runtime;
  const installedVersionPath = runtime === 'codex-cli'
    ? path.join(os.homedir(), '.codex', 'get-shit-done-reflect', 'VERSION')
    : runtime === 'claude-code'
      ? path.join(os.homedir(), '.claude', 'get-shit-done-reflect', 'VERSION')
      : null;
  const repoMirrorPath = runtime === 'codex-cli'
    ? path.join(cwd, '.codex', 'get-shit-done-reflect', 'VERSION')
    : runtime === 'claude-code'
      ? path.join(cwd, '.claude', 'get-shit-done-reflect', 'VERSION')
      : null;

  const installedVersion = installedVersionPath ? readFileIfExists(installedVersionPath) : null;
  const repoMirrorVersion = repoMirrorPath ? readFileIfExists(repoMirrorPath) : null;

  if (installedVersion) {
    return {
      value: installedVersion,
      status: 'derived',
      source: 'installed_harness',
      path: installedVersionPath,
    };
  }
  if (configVersion) {
    return {
      value: configVersion,
      status: 'derived',
      source: 'config',
      path: configPath,
    };
  }
  if (repoMirrorVersion) {
    return {
      value: repoMirrorVersion,
      status: 'derived',
      source: 'repo_mirror',
      path: repoMirrorPath,
    };
  }

  return {
    value: 'not_available',
    status: 'not_available',
    source: 'not_available',
    path: null,
  };
}

function resolveWriterModelContext(cwd, role, runtimeContext) {
  const agentType = ROLE_TO_AGENT_TYPE[role];
  const config = loadConfig(cwd);
  const profile = String(config.model_profile || 'balanced').toLowerCase();
  const tier = agentType ? getAgentTier(cwd, agentType) : null;
  const resolvedModel = agentType ? resolveModelInternal(cwd, agentType) : null;
  const codexThread = runtimeContext && runtimeContext.runtime === 'codex-cli' && runtimeContext.session_id !== 'not_available'
    ? getCodexThreadMetadata(runtimeContext.session_id)
    : null;

  let modelValue = 'not_available';
  let modelStatus = 'not_available';
  let modelSource = 'not_available';
  if (codexThread && codexThread.model) {
    modelValue = codexThread.model;
    modelStatus = 'exposed';
    modelSource = 'codex_state_store';
  } else if (resolvedModel) {
    modelValue = resolvedModel;
    modelStatus = 'derived';
    modelSource = 'resolveModelInternal';
  } else if (tier === 'haiku' && runtimeContext && runtimeContext.runtime === 'codex-cli') {
    modelValue = 'gpt-5.4-mini';
    modelStatus = 'derived';
    modelSource = 'codex_profile_resolution';
  }

  let effortValue = 'not_available';
  let effortStatus = 'not_available';
  let effortSource = 'not_available';
  if (codexThread && codexThread.reasoning_effort) {
    effortValue = codexThread.reasoning_effort;
    effortStatus = 'exposed';
    effortSource = 'codex_state_store';
  } else if (runtimeContext && runtimeContext.runtime === 'codex-cli' && tier && CODEX_EFFORT_BY_TIER[tier]) {
    effortValue = CODEX_EFFORT_BY_TIER[tier];
    effortStatus = 'derived';
    effortSource = 'codex_profile_resolution';
  }

  return {
    model: {
      value: modelValue,
      status: modelStatus,
      source: modelSource,
    },
    reasoning_effort: {
      value: effortValue,
      status: effortStatus,
      source: effortSource,
    },
    profile: {
      value: profile || 'not_available',
      status: profile ? 'derived' : 'not_available',
      source: profile ? 'config' : 'not_available',
    },
  };
}

function buildArtifactSignature(options = {}) {
  const cwd = options.cwd || process.cwd();
  const role = options.role || 'executor';
  const generatedAt = options.generatedAt || new Date().toISOString();

  const runtimeContext = resolveWriterRuntimeContext(cwd);
  const version = resolveWriterGsdVersion(cwd, runtimeContext);
  const modelContext = resolveWriterModelContext(cwd, role, runtimeContext);

  return {
    role,
    harness: runtimeContext.harness,
    platform: runtimeContext.platform,
    vendor: runtimeContext.vendor,
    model: modelContext.model.value,
    reasoning_effort: modelContext.reasoning_effort.value,
    profile: modelContext.profile.value,
    gsd_version: version.value,
    generated_at: generatedAt,
    session_id: runtimeContext.session_id,
    provenance_status: {
      role: 'derived',
      harness: runtimeContext.status.harness,
      platform: runtimeContext.status.platform,
      vendor: runtimeContext.status.vendor,
      model: modelContext.model.status,
      reasoning_effort: modelContext.reasoning_effort.status,
      profile: modelContext.profile.status,
      gsd_version: version.status,
      generated_at: 'exposed',
      session_id: runtimeContext.status.session_id,
    },
    provenance_source: {
      role: 'artifact_role',
      harness: runtimeContext.source.harness,
      platform: runtimeContext.source.platform,
      vendor: runtimeContext.source.vendor,
      model: modelContext.model.source,
      reasoning_effort: modelContext.reasoning_effort.source,
      profile: modelContext.profile.source,
      gsd_version: version.source,
      generated_at: 'writer_clock',
      session_id: runtimeContext.source.session_id,
    },
  };
}

function buildSignalProvenance(options = {}) {
  const cwd = options.cwd || process.cwd();
  const aboutWork = Array.isArray(options.aboutWork) ? options.aboutWork : [];
  const detectedBy = options.detectedBy || buildArtifactSignature({ cwd, role: 'sensor' });
  const writtenBy = options.writtenBy || buildArtifactSignature({ cwd, role: 'synthesizer' });

  return {
    about_work: aboutWork,
    detected_by: detectedBy,
    written_by: writtenBy,
  };
}

function buildLegacyFlatEcho(signalProvenance) {
  const source = signalProvenance && signalProvenance.written_by
    ? signalProvenance.written_by
    : signalProvenance && signalProvenance.detected_by
      ? signalProvenance.detected_by
      : null;

  return {
    runtime: source && source.harness && source.harness !== 'not_available' ? source.harness : '',
    model: source && source.model && source.model !== 'not_available' ? source.model : '',
    gsd_version: source && source.gsd_version && source.gsd_version !== 'not_available' ? source.gsd_version : '',
  };
}

module.exports = {
  resolveWriterRuntimeContext,
  resolveWriterGsdVersion,
  resolveWriterModelContext,
  buildArtifactSignature,
  buildSignalProvenance,
  buildLegacyFlatEcho,
};
