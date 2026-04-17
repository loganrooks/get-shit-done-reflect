'use strict';

const { loadCodex, scanRolloutEvents } = require('../sources/codex.cjs');
const { buildFeatureRecord, defineExtractor } = require('../registry.cjs');

function getCodexDataset(context) {
  if (context && context.codex) return context.codex;
  return loadCodex(
    context.cwd,
    context && context.codexOptions ? context.codexOptions : {}
  );
}

function exposedField(value, provenance) {
  return {
    status: value == null ? 'not_available' : 'exposed',
    value: value == null ? null : value,
    provenance,
  };
}

function derivedField(value, provenance) {
  return {
    status: value == null ? 'not_available' : 'derived',
    value: value == null ? null : value,
    provenance,
  };
}

function buildCoverage(raw, thread) {
  const observedSources = [];
  const missingSources = [];

  if (raw.state_store.exists) observedSources.push('codex_state_store');
  else missingSources.push('codex_state_store');

  if (thread.session_meta.status === 'matched') observedSources.push('codex_sessions');
  else missingSources.push('codex_sessions');

  return {
    raw_sources: ['codex_state_store', 'codex_sessions'],
    observed_sources: observedSources,
    missing_sources: missingSources,
    session_meta_status: thread.session_meta.status,
    complete: missingSources.length === 0,
  };
}

function buildProvenanceNotes(raw, thread) {
  const notes = [
    '`model`, `reasoning_effort`, `sandbox_policy`, `cwd`, and `rollout_path` come from `threads` in `~/.codex/state_5.sqlite`.',
  ];

  if (thread.session_meta.status === 'matched') {
    notes.push('Session header corroboration came from the rollout JSONL `session_meta` record.');
  } else {
    notes.push(`Rollout JSONL header status: ${thread.session_meta.status}.`);
  }

  if (raw.gsd_context.provenance_notes.length > 0) {
    notes.push(raw.gsd_context.provenance_notes.join(' '));
  }

  return notes;
}

function getSandboxMode(thread) {
  if (!thread || !thread.sandbox_policy || typeof thread.sandbox_policy !== 'object') {
    return null;
  }

  if (typeof thread.sandbox_policy.mode === 'string') {
    return thread.sandbox_policy.mode;
  }

  if (typeof thread.sandbox_policy.type === 'string') {
    return thread.sandbox_policy.type;
  }

  return null;
}

function buildRuntimeMetadataValue(raw, thread) {
  const sessionMetaSource = thread.runtime_identity.source || null;
  const sessionMetaGit = thread.runtime_identity.git || null;

  return {
    thread_id: thread.thread_id,
    runtime: 'codex-cli',
    model: exposedField(
      thread.model,
      thread.model
        ? 'Read from `threads.model` in `~/.codex/state_5.sqlite`.'
        : 'Codex thread row did not expose `model`.'
    ),
    reasoning_effort: exposedField(
      thread.reasoning_effort,
      thread.reasoning_effort
        ? 'Read from `threads.reasoning_effort` in `~/.codex/state_5.sqlite`.'
        : 'Codex thread row did not expose `reasoning_effort`.'
    ),
    effort_level_breakdown: {
      reasoning_effort: thread.reasoning_effort || null,
      effort_count_this_thread: 1,
    },
    sandbox_policy: exposedField(
      thread.sandbox_policy,
      thread.sandbox_policy
        ? 'Parsed from the JSON text stored in `threads.sandbox_policy`.'
        : 'Codex thread row did not expose `sandbox_policy`.'
    ),
    sandbox_mode_distribution: {
      mode: getSandboxMode(thread),
      raw: thread.sandbox_policy_text || null,
    },
    approval_mode: exposedField(
      thread.approval_mode,
      thread.approval_mode
        ? 'Read from `threads.approval_mode` in `~/.codex/state_5.sqlite`.'
        : 'Codex thread row did not expose `approval_mode`.'
    ),
    cwd: exposedField(
      thread.cwd,
      thread.cwd
        ? 'Read from `threads.cwd` in `~/.codex/state_5.sqlite`.'
        : 'Codex thread row did not expose `cwd`.'
    ),
    rollout_path: exposedField(
      thread.rollout_path,
      thread.rollout_path
        ? 'Read from `threads.rollout_path` in `~/.codex/state_5.sqlite`.'
        : 'Codex thread row did not expose `rollout_path`.'
    ),
    cli_version: exposedField(
      thread.runtime_identity.cli_version,
      thread.session_meta.status === 'matched'
        ? 'Corroborated from the rollout JSONL `session_meta.cli_version` and thread metadata.'
        : 'Fell back to `threads.cli_version` because rollout header corroboration was unavailable.'
    ),
    model_provider: exposedField(
      thread.runtime_identity.model_provider,
      thread.session_meta.status === 'matched'
        ? 'Corroborated from the rollout JSONL `session_meta.model_provider` and thread metadata.'
        : 'Fell back to `threads.model_provider` because rollout header corroboration was unavailable.'
    ),
    agent_nickname: exposedField(
      thread.runtime_identity.agent_nickname,
      thread.runtime_identity.agent_nickname
        ? 'Best-available agent nickname from rollout `session_meta` or thread metadata.'
        : 'No agent nickname was emitted for this thread.'
    ),
    agent_role: exposedField(
      thread.runtime_identity.agent_role,
      thread.runtime_identity.agent_role
        ? 'Best-available agent role from rollout `session_meta` or thread metadata.'
        : 'No agent role was emitted for this thread.'
    ),
    agent_path: exposedField(
      thread.runtime_identity.agent_path,
      thread.runtime_identity.agent_path
        ? 'Read from `threads.agent_path` or rollout subagent metadata.'
        : 'No agent path was emitted for this thread.'
    ),
    originator: exposedField(
      thread.runtime_identity.originator,
      thread.runtime_identity.originator
        ? 'Read from the rollout JSONL `session_meta.originator` field.'
        : 'Rollout JSONL did not expose `originator`.'
    ),
    source: exposedField(
      sessionMetaSource,
      sessionMetaSource
        ? 'Read from the rollout JSONL `session_meta.source` field.'
        : 'Rollout JSONL did not expose `source`.'
    ),
    git: {
      branch: exposedField(
        sessionMetaGit && sessionMetaGit.branch ? sessionMetaGit.branch : thread.git_branch,
        sessionMetaGit && sessionMetaGit.branch
          ? 'Read from the rollout JSONL `session_meta.git.branch` field.'
          : (thread.git_branch
            ? 'Fell back to `threads.git_branch` in the Codex state store.'
            : 'Git branch was not emitted for this thread.')
      ),
      commit_hash: exposedField(
        sessionMetaGit && sessionMetaGit.commit_hash ? sessionMetaGit.commit_hash : thread.git_sha,
        sessionMetaGit && sessionMetaGit.commit_hash
          ? 'Read from the rollout JSONL `session_meta.git.commit_hash` field.'
          : (thread.git_sha
            ? 'Fell back to `threads.git_sha` in the Codex state store.'
            : 'Git commit hash was not emitted for this thread.')
      ),
      repository_url: exposedField(
        sessionMetaGit && sessionMetaGit.repository_url ? sessionMetaGit.repository_url : thread.git_origin_url,
        sessionMetaGit && sessionMetaGit.repository_url
          ? 'Read from the rollout JSONL `session_meta.git.repository_url` field.'
          : (thread.git_origin_url
            ? 'Fell back to `threads.git_origin_url` in the Codex state store.'
            : 'Repository URL was not emitted for this thread.')
      ),
    },
    gsd_version: derivedField(
      raw.gsd_context.gsd_version,
      raw.gsd_context.provenance_notes.length > 0
        ? raw.gsd_context.provenance_notes.join(' ')
        : 'No best-available GSD version context was available from the current workspace.'
    ),
    profile: derivedField(
      raw.gsd_context.profile,
      raw.gsd_context.provenance_notes.length > 0
        ? raw.gsd_context.provenance_notes.join(' ')
        : 'No best-available GSD profile context was available from the current workspace.'
    ),
    timestamps: {
      thread_created_at: thread.created_at,
      thread_updated_at: thread.updated_at,
      session_meta_timestamp: thread.session_meta.payload ? thread.session_meta.payload.timestamp : null,
    },
  };
}

const codexRuntimeMetadataExtractor = defineExtractor({
  name: 'codex_runtime_metadata',
  source_family: 'RUNTIME',
  raw_sources: ['codex_state_store', 'codex_sessions'],
  runtimes: ['codex-cli'],
  reliability_tier: 'direct_observation',
  features_produced: ['codex_runtime_metadata'],
  // agent_performance: reasoning_effort + sandbox_policy ARE reasoning-effort stratification (registry.cjs:56). cross_runtime_comparison: this extractor IS named in LOOP_DEFINITIONS.cross_runtime_comparison.named_metrics (registry.cjs:94).
  serves_loop: ['pipeline_integrity', 'intervention_lifecycle', 'agent_performance', 'cross_runtime_comparison'],
  distinguishes: ['codex_runtime_identity', 'codex_reasoning_and_sandbox_provenance', 'codex_effort_stratification'],
  status_semantics: ['exposed', 'derived', 'not_available'],
  extract(extractor, context) {
    const raw = getCodexDataset(context);
    return raw.threads.map(thread => buildFeatureRecord(extractor, {
      feature_name: `codex_runtime_metadata:${thread.thread_id}`,
      runtime: 'codex-cli',
      availability_status: 'exposed',
      symmetry_marker: 'asymmetric_only',
      reliability_tier: 'direct_observation',
      value: buildRuntimeMetadataValue(raw, thread),
      coverage: buildCoverage(raw, thread),
      provenance: {
        thread_id: thread.thread_id,
        state_store_path: raw.paths.state_store_path,
        rollout_path: thread.rollout_path,
        session_meta_status: thread.session_meta.status,
        schema_fields: raw.schema.fields,
        observed_at: raw.observed_at,
      },
      freshness: thread.freshness,
      notes: buildProvenanceNotes(raw, thread),
    }));
  },
});

const codexCompactionEventsExtractor = defineExtractor({
  name: 'codex_compaction_events',
  source_family: 'RUNTIME',
  raw_sources: ['codex_sessions'],
  runtimes: ['codex-cli'],
  reliability_tier: 'direct_observation',
  features_produced: ['codex_compaction_events'],
  serves_loop: ['cross_runtime_comparison', 'agent_performance'],
  distinguishes: ['compaction_trigger_mix', 'pre_compact_token_pressure'],
  status_semantics: ['exposed', 'not_emitted', 'not_available'],
  extract(extractor, context) {
    const codex = getCodexDataset(context);
    if (!codex || !Array.isArray(codex.threads)) return [];

    return codex.threads.map(thread => {
      const scan = scanRolloutEvents(thread.rollout_path);
      let availabilityStatus;
      if (scan.error === 'no_path' || scan.error === 'file_missing') availabilityStatus = 'not_available';
      else if (scan.count > 0) availabilityStatus = 'exposed';
      else availabilityStatus = 'not_emitted';

      return buildFeatureRecord(extractor, {
        feature_name: `codex_compaction_events:${thread.thread_id}`,
        runtime: 'codex-cli',
        availability_status: availabilityStatus,
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'direct_observation',
        value: {
          thread_id: thread.thread_id,
          compaction_count: scan.count,
          has_compaction: scan.count > 0,
          replacement_history_lengths: scan.replacement_history_lengths,
          context_compacted_events: scan.context_compacted_events,
        },
        coverage: {
          thread_id: thread.thread_id,
          rollout_scanned: scan.scanned,
        },
        provenance: {
          thread_id: thread.thread_id,
          rollout_path: thread.rollout_path || null,
          scan_error: scan.error,
        },
        freshness: thread.freshness,
        notes: [
          'Codex compaction is observed through rollout context_compacted events.',
          scan.error === 'partial_parse' ? 'Partial parse: some rollout lines were malformed and skipped.' : null,
        ].filter(Boolean),
      });
    });
  },
});

const CODEX_EXTRACTORS = Object.freeze([
  codexRuntimeMetadataExtractor,
  codexCompactionEventsExtractor,
]);

module.exports = {
  CODEX_EXTRACTORS,
  codexCompactionEventsExtractor,
  codex_compaction_events: codexCompactionEventsExtractor,
  codexRuntimeMetadataExtractor,
  codex_runtime_metadata: codexRuntimeMetadataExtractor,
};
