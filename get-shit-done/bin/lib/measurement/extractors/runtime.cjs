'use strict';

const fs = require('node:fs');

const { buildFeatureRecord, defineExtractor } = require('../registry.cjs');
const {
  countClearInvocations,
  extractCompactionEvents,
  loadClaude,
  scanInterventionPoints,
  scanToolInvocationSequence,
  scanTopicShiftMarkers,
} = require('../sources/claude.cjs');

const MARKER_REGEX_SELF_CORRECTION = /\b(actually|wait|reconsider|correction|let me reconsider|on (second )?thought|I was wrong|revise)\b/gi;
const MARKER_REGEX_UNCERTAINTY = /\b(not sure|uncertain|might(?: not)?|unclear|perhaps|possibly|I think|may(?: not)?)\b/gi;

function getClaudeDataset(context) {
  return context && context.claude ? context.claude : loadClaude(context.cwd, context && context.claudeOptions ? context.claudeOptions : {});
}

function getThinkingSnapshot(session) {
  return session.thinking || {
    emitted: false,
    block_count: 0,
    total_chars: 0,
    visible_chars: 0,
    over_visible_ratio: null,
    dispatch_context: 'unavailable',
  };
}

function classifyThinkingAvailability(session) {
  const thinking = getThinkingSnapshot(session);
  const model = session.runtime_identity && session.runtime_identity.model ? session.runtime_identity.model : '';
  if (thinking.dispatch_context === 'unavailable' || session.parent_jsonl.status !== 'matched') {
    return {
      availability_status: 'not_available',
      gate_applied: null,
      model,
      thinking,
    };
  }

  if (/^claude-haiku/i.test(model)) {
    return {
      availability_status: 'not_applicable',
      gate_applied: 'model_family',
      model,
      thinking,
    };
  }

  if (thinking.dispatch_context === 'subagent') {
    return {
      availability_status: 'not_available',
      gate_applied: 'dispatch_context',
      model,
      thinking,
    };
  }

  if (thinking.block_count === 0) {
    return {
      availability_status: 'not_emitted',
      gate_applied: 'emission_threshold',
      model,
      thinking,
    };
  }

  return {
    availability_status: 'exposed',
    gate_applied: null,
    model,
    thinking,
  };
}

function collectThinkingText(records) {
  let text = '';

  for (const record of records || []) {
    if (!record || record.type !== 'assistant') continue;
    const content = record.message && record.message.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (!block || block.type !== 'thinking') continue;
      const thinkingText = typeof block.thinking === 'string'
        ? block.thinking
        : (typeof block.text === 'string' ? block.text : '');
      if (thinkingText) {
        text += `${thinkingText}\n`;
      }
    }
  }

  return text;
}

function fileFreshness(filePath, observedAt, staleAfterHours = 24) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      stale_after_hours: staleAfterHours,
      age_hours: null,
      reasons: ['source_missing'],
    };
  }

  const stat = fs.statSync(filePath);
  const ageHours = Math.max(0, (Date.parse(observedAt) - stat.mtimeMs) / (60 * 60 * 1000));
  const status = ageHours > staleAfterHours ? 'stale' : 'fresh';
  return {
    status,
    observed_at: observedAt,
    modified_at: stat.mtime.toISOString(),
    stale_after_hours: staleAfterHours,
    age_hours: Number(ageHours.toFixed(3)),
    reasons: status === 'stale' ? [`age_hours=${ageHours.toFixed(2)}`] : [],
  };
}

function combineFreshness(observedAt, paths) {
  const entries = (paths || []).map(filePath => fileFreshness(filePath, observedAt));
  const statuses = entries.map(entry => entry.status);
  if (statuses.includes('stale')) {
    return {
      status: 'stale',
      observed_at: observedAt,
      modified_at: entries.find(entry => entry.modified_at)?.modified_at || null,
      stale_after_hours: 24,
      age_hours: Math.max(...entries.map(entry => entry.age_hours || 0)),
      reasons: entries.flatMap(entry => entry.reasons || []).filter(Boolean),
    };
  }
  if (statuses.includes('unknown')) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: entries.find(entry => entry.modified_at)?.modified_at || null,
      stale_after_hours: 24,
      age_hours: entries.find(entry => entry.age_hours != null)?.age_hours || null,
      reasons: entries.flatMap(entry => entry.reasons || []).filter(Boolean),
    };
  }
  return {
    status: 'fresh',
    observed_at: observedAt,
    modified_at: entries.find(entry => entry.modified_at)?.modified_at || null,
    stale_after_hours: 24,
    age_hours: Math.max(...entries.map(entry => entry.age_hours || 0)),
    reasons: [],
  };
}

function buildCoverage(session, options = {}) {
  const observedSources = ['claude_session_meta'];
  const missingSources = [];

  if (session.parent_jsonl.status === 'matched') {
    observedSources.push('claude_jsonl_projects');
  } else {
    missingSources.push('claude_jsonl_projects');
  }

  if (options.includeSettings) {
    if (options.settingsAvailable) observedSources.push('claude_settings');
    else missingSources.push('claude_settings');
  }

  return {
    raw_sources: [...new Set(['claude_session_meta', 'claude_jsonl_projects', ...(options.includeSettings ? ['claude_settings'] : [])])],
    observed_sources: observedSources,
    missing_sources: missingSources,
    jsonl_state: session.parent_jsonl.status,
    parent_jsonl_path: session.parent_jsonl.path || null,
    project_dir_path: session.parent_jsonl.project_dir_path || null,
    candidate_project_dirs: (session.parent_jsonl.candidate_project_dirs || []).map(candidate => candidate.project_dir_name),
    record_count: session.parent_jsonl.record_count || 0,
  };
}

function identityAvailability(session) {
  return session.parent_jsonl.status === 'matched' ? 'exposed' : 'derived';
}

function identityReliability(session) {
  return session.parent_jsonl.status === 'matched' ? 'direct_observation' : 'artifact_derived';
}

function derivedField(value, provenance) {
  return {
    status: value == null ? 'not_available' : 'derived',
    value: value == null ? null : value,
    provenance,
  };
}

function exposedField(value, provenance) {
  return {
    status: value == null ? 'not_available' : 'exposed',
    value: value == null ? null : value,
    provenance,
  };
}

function buildSessionIdentityValue(claude, session) {
  return {
    session_id: session.session_id,
    runtime: 'claude-code',
    project_path: session.project_path,
    normalized_project_path: session.normalized_project_path,
    model: exposedField(
      session.runtime_identity.model,
      session.runtime_identity.model ? 'Read from `assistant.message.model` in the parent JSONL.' : 'Parent JSONL missing or model not emitted.'
    ),
    claude_code_version: exposedField(
      session.runtime_identity.claude_version,
      session.runtime_identity.claude_version ? 'Read from the JSONL record envelope `version` field.' : 'JSONL version not emitted.'
    ),
    entrypoint: exposedField(
      session.runtime_identity.entrypoint,
      session.runtime_identity.entrypoint ? 'Read from the JSONL record envelope `entrypoint` field.' : 'JSONL entrypoint not emitted.'
    ),
    permission_mode: exposedField(
      session.runtime_identity.permission_mode,
      session.runtime_identity.permission_mode ? 'Read from the JSONL record envelope `permissionMode` field.' : 'Permission mode not emitted in this session.'
    ),
    gsd_version: derivedField(
      claude.gsd_context.gsd_version,
      claude.gsd_context.provenance_notes.length > 0
        ? claude.gsd_context.provenance_notes.join(' ')
        : 'No GSD version context was available from the current workspace.'
    ),
    profile: derivedField(
      claude.gsd_context.profile,
      claude.gsd_context.provenance_notes.length > 0
        ? claude.gsd_context.provenance_notes.join(' ')
        : 'No GSD profile context was available from the current workspace.'
    ),
    timestamps: {
      session_meta_start: session.timestamps.session_meta_start,
      jsonl_first: session.timestamps.jsonl_first,
      jsonl_last: session.timestamps.jsonl_last,
    },
    era_boundary: session.era,
  };
}

const runtimeSessionIdentityExtractor = defineExtractor({
  name: 'runtime_session_identity',
  source_family: 'RUNTIME',
  raw_sources: ['claude_session_meta', 'claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['runtime_session_identity'],
  // agent_performance: value.model + value.profile provide the model/profile provenance this loop requires. cross_session_patterns: session_id + era_boundary enable cross-session clustering per loop theory_of_change.
  serves_loop: ['pipeline_integrity', 'intervention_lifecycle', 'agent_performance', 'cross_session_patterns'],
  distinguishes: ['runtime_identity', 'era_boundary'],
  status_semantics: ['exposed', 'derived', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => buildFeatureRecord(extractor, {
      feature_name: `runtime_session_identity:${session.session_id}`,
      runtime: 'claude-code',
      availability_status: identityAvailability(session),
      symmetry_marker: 'asymmetric_only',
      reliability_tier: identityReliability(session),
      value: buildSessionIdentityValue(claude, session),
      coverage: buildCoverage(session),
      provenance: {
        session_id: session.session_id,
        session_meta_path: session.session_meta.path,
        parent_jsonl_path: session.parent_jsonl.path || null,
        match_method: session.parent_jsonl.match_method || null,
      },
      freshness: combineFreshness(context.observed_at, [
        session.session_meta.path,
        session.parent_jsonl.path,
      ]),
      notes: [
        'Model and Claude Code version come from parent JSONL when present.',
        'GSD version and profile are best-available derived context, not session-native runtime fields.',
      ],
    }));
  },
});

const claudeSettingsAtStartExtractor = defineExtractor({
  name: 'claude_settings_at_start',
  source_family: 'RUNTIME',
  raw_sources: ['claude_settings', 'claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['claude_settings_at_start'],
  // agent_performance: showThinkingSummaries + effective_effort_level ARE runtime settings context per loop theory_of_change.
  serves_loop: ['pipeline_integrity', 'agent_performance'],
  distinguishes: ['settings_at_start', 'effort_override'],
  status_semantics: ['exposed', 'derived', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    const settingsAvailable = claude.settings_at_observation.status !== 'not_available';

    return claude.sessions.map(session => {
      const hasOverride = session.effort_override.status === 'exposed';
      const availabilityStatus = settingsAvailable ? 'derived' : (hasOverride ? 'exposed' : 'not_available');
      const reliabilityTier = settingsAvailable ? 'artifact_derived' : (hasOverride ? 'direct_observation' : 'artifact_derived');
      const effectiveEffort = session.effort_override.value || claude.settings_at_observation.values.effortLevel || null;

      return buildFeatureRecord(extractor, {
        feature_name: `claude_settings_at_start:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: availabilityStatus,
        symmetry_marker: 'asymmetric_only',
        reliability_tier: reliabilityTier,
        value: {
          session_id: session.session_id,
          showThinkingSummaries: derivedField(
            claude.settings_at_observation.values.showThinkingSummaries,
            settingsAvailable
              ? 'Merged Claude settings files observed at measurement time; best-available proxy, not a session-start snapshot.'
              : 'Claude settings files were not available.'
          ),
          effortLevel: derivedField(
            claude.settings_at_observation.values.effortLevel,
            settingsAvailable
              ? 'Merged Claude settings files observed at measurement time; best-available proxy, not a session-start snapshot.'
              : 'Claude settings files were not available.'
          ),
          dispatch_effort: exposedField(
            session.effort_override.value,
            session.effort_override.value
              ? `Observed in parent JSONL via ${session.effort_override.source}.`
              : 'No `/effort` or `--effort` override was observed in the parent JSONL.'
          ),
          effective_effort_level: {
            status: effectiveEffort == null ? 'not_available' : (session.effort_override.value ? 'exposed' : 'derived'),
            value: effectiveEffort,
            provenance: session.effort_override.value
              ? 'Dispatch override wins when present in the parent JSONL.'
              : (settingsAvailable
                ? 'Fell back to the current merged Claude settings because no per-session override was observed.'
                : 'Neither a per-session override nor current settings were available.'),
          },
          skipDangerousModePermissionPrompt: derivedField(
            claude.settings_at_observation.values.skipDangerousModePermissionPrompt,
            settingsAvailable
              ? 'Merged Claude settings files observed at measurement time; best-available proxy, not a session-start snapshot.'
              : 'Claude settings files were not available.'
          ),
        },
        coverage: buildCoverage(session, {
          includeSettings: true,
          settingsAvailable,
        }),
        provenance: {
          session_id: session.session_id,
          settings_sources: claude.settings_at_observation.sources.map(source => source.path),
          effort_override_evidence: session.effort_override.evidence,
        },
        freshness: combineFreshness(context.observed_at, [
          ...claude.settings_at_observation.sources.map(source => source.path),
          session.parent_jsonl.path,
        ]),
        notes: [
          'Current Claude settings are treated as best-available derived context, not as a guaranteed session-start snapshot.',
          'When a per-session effort override is visible in JSONL, it takes precedence over settings-derived effort.',
        ],
      });
    });
  },
});

const thinkingCompositeExtractor = defineExtractor({
  name: 'thinking_composite',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['thinking_composite'],
  serves_loop: ['agent_performance'],
  distinguishes: ['thinking_emission_gate', 'model_stratified_reasoning_effort'],
  status_semantics: ['exposed', 'not_emitted', 'not_applicable', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const thinkingGate = classifyThinkingAvailability(session);
      return buildFeatureRecord(extractor, {
        feature_name: `thinking_composite:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: thinkingGate.availability_status,
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'direct_observation',
        value: {
          session_id: session.session_id,
          thinking_emitted: thinkingGate.thinking.emitted,
          thinking_block_count: thinkingGate.thinking.block_count,
          thinking_total_chars: thinkingGate.thinking.total_chars,
          thinking_over_visible_ratio: thinkingGate.thinking.over_visible_ratio,
          model: thinkingGate.model,
          effective_effort_level: session.effort_override && session.effort_override.value ? session.effort_override.value : null,
          gate_applied: thinkingGate.gate_applied,
          dispatch_context: thinkingGate.thinking.dispatch_context,
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl.path || null,
          gate_spec: 'spike-010-DECISION.md §5',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl.path]),
        notes: [
          'Three-level gate: model_family (Haiku -> not_applicable), dispatch_context (subagent -> not_available), emission_threshold (0 blocks -> not_emitted).',
        ],
      });
    });
  },
});

const markerDensityExtractor = defineExtractor({
  name: 'marker_density',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['marker_density'],
  serves_loop: ['agent_performance'],
  distinguishes: ['effort_marker_presence', 'model_effort_stratification'],
  status_semantics: ['exposed', 'not_emitted', 'not_applicable', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const thinkingGate = classifyThinkingAvailability(session);
      const thinkingText = thinkingGate.availability_status === 'exposed'
        ? collectThinkingText(session.parent_jsonl.records)
        : '';
      const selfCorrections = (thinkingText.match(MARKER_REGEX_SELF_CORRECTION) || []).length;
      const uncertainties = (thinkingText.match(MARKER_REGEX_UNCERTAINTY) || []).length;
      const per1k = count => (thinkingGate.thinking.total_chars > 0 ? (count * 1000) / thinkingGate.thinking.total_chars : 0);

      return buildFeatureRecord(extractor, {
        feature_name: `marker_density:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: thinkingGate.availability_status,
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'direct_observation',
        value: {
          session_id: session.session_id,
          marker_self_correction_density: per1k(selfCorrections),
          marker_uncertainty_density: per1k(uncertainties),
          marker_self_correction_count: selfCorrections,
          marker_uncertainty_count: uncertainties,
          thinking_total_chars: thinkingGate.thinking.total_chars,
          model: thinkingGate.model,
          effort_level: session.effort_override && session.effort_override.value ? session.effort_override.value : null,
          caveat: 'effort_tracking_not_quality_proxy',
          dropped_markers: ['branching', 'dead_end'],
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          regex_spec: 'spike-010-DECISION.md summary complexity extractor updated shape',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl.path]),
        notes: [
          'G-4: Marker density is effort-tracking only.',
          'Branching and dead_end markers were dropped after spike-010 found zero useful matches.',
        ],
      });
    });
  },
});

const clearInvocationExtractor = defineExtractor({
  name: 'clear_invocation',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['clear_invocation'],
  serves_loop: ['cross_session_patterns'],
  distinguishes: ['operator_reset_habit', 'compaction_substitute_signal'],
  status_semantics: ['exposed', 'not_emitted', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const available = session.parent_jsonl.status === 'matched';
      const count = available ? countClearInvocations(session.parent_jsonl.records) : 0;
      return buildFeatureRecord(extractor, {
        feature_name: `clear_invocation:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: !available ? 'not_available' : (count > 0 ? 'exposed' : 'not_emitted'),
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'direct_observation',
        value: {
          session_id: session.session_id,
          clear_invocation_count: count,
          operator_habit: count > 0 ? 'preemptive_reset' : 'no_reset_observed',
          caveat: 'operator_habit_not_reasoning_quality',
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl.path || null,
          scan_rule: '<command-name>/clear user-record match',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl.path]),
        notes: [
          'G-4: clear-invocation is an operator-habit signal.',
          'In this project, /clear is the reset surrogate to compare against compaction behavior.',
        ],
      });
    });
  },
});

const claudeCompactionEventsExtractor = defineExtractor({
  name: 'claude_compaction_events',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['claude_compaction_events'],
  serves_loop: ['cross_runtime_comparison', 'agent_performance'],
  distinguishes: ['compaction_trigger_mix', 'pre_compact_token_pressure'],
  status_semantics: ['exposed', 'not_emitted', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const available = session.parent_jsonl.status === 'matched';
      const events = available
        ? extractCompactionEvents(session.parent_jsonl.records)
        : {
            count: 0,
            triggers: { manual: 0, auto: 0 },
            pre_tokens: [],
            summary_messages: 0,
          };

      return buildFeatureRecord(extractor, {
        feature_name: `claude_compaction_events:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: !available ? 'not_available' : (events.count > 0 ? 'exposed' : 'not_emitted'),
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'direct_observation',
        value: {
          session_id: session.session_id,
          compaction_count: events.count,
          has_compaction: events.count > 0,
          compaction_trigger_mix: events.triggers,
          pre_compact_token_counts: events.pre_tokens,
          summary_messages_found: events.summary_messages,
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl.path || null,
          scan_rule: 'system.compact_boundary + assistant.isCompactSummary per E6.2 Layer 3',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl.path]),
        notes: [
          'Compaction is verified as a real Claude mechanism; zero firings in the local corpus remain valid not_emitted data.',
        ],
      });
    });
  },
});

const sessionTokensJsonlExtractor = defineExtractor({
  name: 'session_tokens_jsonl',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['session_tokens_jsonl'],
  serves_loop: ['pipeline_integrity', 'intervention_lifecycle'],
  distinguishes: ['canonical_token_source', 'jsonl_coverage_gaps'],
  status_semantics: ['exposed', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const available = session.parent_jsonl.status === 'matched' && session.jsonl_usage;
      return buildFeatureRecord(extractor, {
        feature_name: `session_tokens_jsonl:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: available ? 'exposed' : 'not_available',
        symmetry_marker: 'asymmetric_only',
        reliability_tier: available ? 'direct_observation' : 'artifact_derived',
        value: available ? {
          session_id: session.session_id,
          input_tokens_total: session.jsonl_usage.input_tokens_total,
          output_tokens_total: session.jsonl_usage.output_tokens_total,
          cache_creation_tokens_total: session.jsonl_usage.cache_creation_tokens_total,
          cache_read_tokens_total: session.jsonl_usage.cache_read_tokens_total,
          total_context_tokens: session.jsonl_usage.total_context_tokens,
          deduped_message_count: session.jsonl_usage.deduped_message_count,
          session_meta_tokens_ignored: {
            input_tokens: session.session_meta.record.input_tokens || 0,
            output_tokens: session.session_meta.record.output_tokens || 0,
          },
        } : {
          session_id: session.session_id,
          input_tokens_total: null,
          output_tokens_total: null,
          cache_creation_tokens_total: null,
          cache_read_tokens_total: null,
          total_context_tokens: null,
          deduped_message_count: 0,
          session_meta_tokens_ignored: {
            input_tokens: session.session_meta.record.input_tokens || 0,
            output_tokens: session.session_meta.record.output_tokens || 0,
          },
          unavailability_reason: session.parent_jsonl.status,
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl.path || null,
          match_method: session.parent_jsonl.match_method || null,
          dedup_rule: 'max(usage.*) per unique assistant message.id',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl.path]),
        notes: [
          'Parent JSONL is the canonical token source for Phase 57.5.',
          'Session-meta input/output token fields are preserved only as ignored artifacts for auditability.',
        ],
      });
    });
  },
});

const humanTurnCountJsonlExtractor = defineExtractor({
  name: 'human_turn_count_jsonl',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['human_turn_count_jsonl'],
  serves_loop: ['pipeline_integrity', 'intervention_lifecycle'],
  distinguishes: ['human_turn_classifier', 'jsonl_coverage_gaps'],
  status_semantics: ['exposed', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const available = session.parent_jsonl.status === 'matched' && session.human_turns;
      return buildFeatureRecord(extractor, {
        feature_name: `human_turn_count_jsonl:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: available ? 'exposed' : 'not_available',
        symmetry_marker: 'asymmetric_only',
        reliability_tier: available ? 'direct_observation' : 'artifact_derived',
        value: available ? {
          session_id: session.session_id,
          human_turn_count: session.human_turns.human_turn_count,
          filter_rule: 'user role AND NOT isMeta AND NOT isSidechain AND NOT tool_result list AND NOT command-prefix text',
          filter_counts: session.human_turns.filter_counts,
          session_meta_user_message_count_ignored: session.session_meta.record.user_message_count || 0,
        } : {
          session_id: session.session_id,
          human_turn_count: null,
          filter_rule: 'user role AND NOT isMeta AND NOT isSidechain AND NOT tool_result list AND NOT command-prefix text',
          filter_counts: null,
          session_meta_user_message_count_ignored: session.session_meta.record.user_message_count || 0,
          unavailability_reason: session.parent_jsonl.status,
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl.path || null,
          classifier: 'MEAS-RUNTIME-09 four-filter rule',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl.path]),
        notes: [
          'This extractor never falls back to `session_meta.user_message_count`.',
          'Session-meta counts remain visible only as ignored artifacts for provenance.',
        ],
      });
    });
  },
});

const runtimeJsonlCoverageExtractor = defineExtractor({
  name: 'runtime_jsonl_coverage',
  source_family: 'RUNTIME',
  raw_sources: ['claude_session_meta', 'claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['runtime_jsonl_coverage'],
  serves_loop: ['pipeline_integrity', 'agent_performance'],
  distinguishes: ['jsonl_match_state', 'coverage_gap_state'],
  status_semantics: ['exposed', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => buildFeatureRecord(extractor, {
      feature_name: `runtime_jsonl_coverage:${session.session_id}`,
      runtime: 'claude-code',
      availability_status: session.parent_jsonl.status === 'matched' ? 'exposed' : 'not_available',
      symmetry_marker: 'asymmetric_only',
      reliability_tier: 'artifact_derived',
      value: {
        session_id: session.session_id,
        coverage_state: session.parent_jsonl.status,
        match_method: session.parent_jsonl.match_method || null,
        parent_jsonl_path: session.parent_jsonl.path || null,
        project_dir_path: session.parent_jsonl.project_dir_path || null,
        candidate_project_dirs: (session.parent_jsonl.candidate_project_dirs || []).map(candidate => candidate.project_dir_name),
        record_count: session.parent_jsonl.record_count || 0,
      },
      coverage: buildCoverage(session),
      provenance: {
        session_id: session.session_id,
        session_meta_path: session.session_meta.path,
      },
      freshness: combineFreshness(context.observed_at, [
        session.session_meta.path,
        session.parent_jsonl.path,
      ]),
      notes: [
        'Coverage states are explicit so later query layers do not silently collapse unmatched sessions into nulls.',
      ],
    }));
  },
});

const runtimeEraBoundaryRegistryExtractor = defineExtractor({
  name: 'runtime_era_boundary_registry',
  source_family: 'RUNTIME',
  raw_sources: ['claude_session_meta', 'claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['runtime_era_boundary_registry'],
  // cross_session_patterns: era_boundary IS the era-boundary-comparability distinguishing feature of this loop (registry.cjs:84).
  serves_loop: ['pipeline_integrity', 'agent_performance'],
  distinguishes: ['era_partition', 'non_comparable_query_warning'],
  status_semantics: ['exposed', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    if (claude.sessions.length === 0) return [];

    const eras = new Map();
    let sessionsWithoutVersion = 0;
    for (const session of claude.sessions) {
      const key = session.era.era_key;
      const current = eras.get(key) || {
        era_key: key,
        label: session.era.label,
        comparable_group: session.era.comparable_group,
        session_count: 0,
        versions: new Set(),
        warnings: new Set(),
      };
      current.session_count++;
      if (session.era.version) current.versions.add(session.era.version);
      for (const warning of session.era.warnings || []) current.warnings.add(warning);
      eras.set(key, current);
      if (!session.era.version) sessionsWithoutVersion++;
    }

    const eraRows = [...eras.values()].map(entry => ({
      era_key: entry.era_key,
      label: entry.label,
      comparable_group: entry.comparable_group,
      session_count: entry.session_count,
      versions: [...entry.versions].sort(),
      warnings: [...entry.warnings],
    }));

    const comparableGroups = new Set(eraRows.map(entry => entry.comparable_group));
    const warnings = [];
    if (comparableGroups.size > 1) {
      warnings.push(
        'Query spans multiple Claude era boundaries (`user.version`) and should not be aggregated as directly comparable runtime data.'
      );
    }
    if (sessionsWithoutVersion > 0) {
      warnings.push('Some sessions did not expose `user.version`, so the era registry is partially incomplete.');
    }
    warnings.push('Session-meta remains a manual `/insights` product and is not itself an era-neutral runtime source.');

    const matchedSessions = claude.sessions.filter(session => session.parent_jsonl.status === 'matched').length;

    return [buildFeatureRecord(extractor, {
      feature_name: 'runtime_era_boundary_registry:claude-code',
      runtime: 'claude-code',
      availability_status: matchedSessions > 0 ? 'exposed' : 'not_available',
      symmetry_marker: 'asymmetric_only',
      reliability_tier: matchedSessions > 0 ? 'direct_observation' : 'artifact_derived',
      value: {
        runtime: 'claude-code',
        eras: eraRows,
        session_count: claude.sessions.length,
        matched_jsonl_sessions: matchedSessions,
        sessions_without_version: sessionsWithoutVersion,
        comparable: comparableGroups.size <= 1 && sessionsWithoutVersion === 0,
        warnings,
      },
      coverage: {
        raw_sources: ['claude_session_meta', 'claude_jsonl_projects'],
        observed_sources: ['claude_session_meta', ...(matchedSessions > 0 ? ['claude_jsonl_projects'] : [])],
        missing_sources: matchedSessions > 0 ? [] : ['claude_jsonl_projects'],
        session_count: claude.sessions.length,
      },
      provenance: {
        session_ids: claude.sessions.map(session => session.session_id),
      },
      freshness: combineFreshness(context.observed_at, [
        ...claude.sessions.map(session => session.session_meta.path),
        ...claude.sessions.map(session => session.parent_jsonl.path).filter(Boolean),
      ]),
      notes: [
        'Era boundaries are anchored to `user.version` in parent JSONL records.',
        'Queries spanning the pre-2.1.69 and v2.1.69+ groups require explicit warning because their reasoning observability conditions differ.',
      ],
    })];
  },
});

const toolInvocationSequenceExtractor = defineExtractor({
  name: 'tool_invocation_sequence',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['tool_invocation_sequence'],
  serves_loop: ['pipeline_integrity', 'agent_performance'],
  distinguishes: ['tool_use_pattern', 'agent_autonomy_vs_intervention_mix'],
  status_semantics: ['exposed', 'not_emitted', 'not_available'],
  content_contract: 'derived_features_only',
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const available = session.parent_jsonl && session.parent_jsonl.status === 'matched';
      const scan = available
        ? scanToolInvocationSequence(session.parent_jsonl.records)
        : { sequence: [], tool_count_per_tool: {}, distinct_tool_count: 0, tool_sequence_entropy: 0 };
      const hasData = scan.sequence.length > 0;

      return buildFeatureRecord(extractor, {
        feature_name: `tool_invocation_sequence:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: !available ? 'not_available' : (hasData ? 'exposed' : 'not_emitted'),
        symmetry_marker: 'asymmetric_only',
        reliability_tier: available ? 'direct_observation' : 'artifact_derived',
        value: {
          session_id: session.session_id,
          tool_sequence: scan.sequence,
          tool_count_per_tool: scan.tool_count_per_tool,
          distinct_tool_count: scan.distinct_tool_count,
          tool_sequence_entropy: scan.tool_sequence_entropy,
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl && session.parent_jsonl.path ? session.parent_jsonl.path : null,
          scan_rule: 'assistant.message.content[*].type==="tool_use" -> block.name only',
          content_contract: 'derived_features_only',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl && session.parent_jsonl.path].filter(Boolean)),
        notes: [
          'Tool names only. Tool arguments and tool_result content are never extracted.',
          'MEAS-ARCH-09 / DC-3: no raw content re-exposure.',
        ],
      });
    });
  },
});

const topicShiftMarkersExtractor = defineExtractor({
  name: 'topic_shift_markers',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'direct_observation',
  features_produced: ['topic_shift_markers'],
  serves_loop: ['pipeline_integrity', 'cross_session_patterns'],
  distinguishes: ['topic_boundary_density', 'session_focus_cohesion'],
  status_semantics: ['exposed', 'not_emitted', 'not_available'],
  content_contract: 'derived_features_only',
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const available = session.parent_jsonl && session.parent_jsonl.status === 'matched';
      const scan = available
        ? scanTopicShiftMarkers(session.parent_jsonl.records)
        : {
            topic_shift_count: 0,
            clear_shifts: 0,
            compaction_shifts: 0,
            tool_category_shifts: 0,
            mean_shift_interval_turns: null,
            shift_positions: [],
          };
      const hasData = scan.topic_shift_count > 0;

      return buildFeatureRecord(extractor, {
        feature_name: `topic_shift_markers:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: !available ? 'not_available' : (hasData ? 'exposed' : 'not_emitted'),
        symmetry_marker: 'asymmetric_only',
        reliability_tier: available ? 'direct_observation' : 'artifact_derived',
        value: {
          session_id: session.session_id,
          topic_shift_count: scan.topic_shift_count,
          clear_shifts: scan.clear_shifts,
          compaction_shifts: scan.compaction_shifts,
          tool_category_shifts: scan.tool_category_shifts,
          mean_shift_interval_turns: scan.mean_shift_interval_turns,
          shift_positions: scan.shift_positions,
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl && session.parent_jsonl.path ? session.parent_jsonl.path : null,
          scan_rule: 'structural: /clear + compact_boundary + tool_category_change; no semantic analysis',
          content_contract: 'derived_features_only',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl && session.parent_jsonl.path].filter(Boolean)),
        notes: [
          'G-1: structural-only topic-shift indicators. Semantic topic-modeling is out of scope.',
          'Tool-category taxonomy is minimal (investigation/mutation/execution/other).',
        ],
      });
    });
  },
});

const interventionPointsExtractor = defineExtractor({
  name: 'intervention_points',
  source_family: 'RUNTIME',
  raw_sources: ['claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'inferred',
  features_produced: ['intervention_points'],
  serves_loop: ['pipeline_integrity', 'agent_performance'],
  distinguishes: ['mid_sequence_course_correction', 'scope_narrowing_intervention'],
  status_semantics: ['exposed', 'not_emitted', 'not_available'],
  content_contract: 'derived_features_only',
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => {
      const available = session.parent_jsonl && session.parent_jsonl.status === 'matched';
      const scan = available
        ? scanInterventionPoints(session.parent_jsonl.records)
        : {
            intervention_count: 0,
            interventions_per_100_turns: 0,
            mean_intervention_position: null,
            intervention_positions: [],
            total_turns: 0,
            sampled_matches: [],
          };
      const hasData = scan.intervention_count > 0;

      return buildFeatureRecord(extractor, {
        feature_name: `intervention_points:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: !available ? 'not_available' : (hasData ? 'exposed' : 'not_emitted'),
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'inferred',
        value: {
          session_id: session.session_id,
          intervention_count: scan.intervention_count,
          interventions_per_100_turns: scan.interventions_per_100_turns,
          mean_intervention_position: scan.mean_intervention_position,
          intervention_positions: scan.intervention_positions,
          total_turns: scan.total_turns,
        },
        coverage: buildCoverage(session),
        provenance: {
          session_id: session.session_id,
          parent_jsonl_path: session.parent_jsonl && session.parent_jsonl.path ? session.parent_jsonl.path : null,
          scan_rule: 'user_after_2+_assistant AND (marker_regex OR request_interrupted_placeholder); isHumanTurnRecord-guarded',
          heuristic_version: '57.7-v1',
          calibration_report: '.planning/phases/57.7-content-analysis-epistemic-deepening-inserted/57.7-05-CALIBRATION.md',
          content_contract: 'derived_features_only',
        },
        freshness: combineFreshness(context.observed_at, [session.parent_jsonl && session.parent_jsonl.path].filter(Boolean)),
        notes: [
          'Q3 calibration PASSED 2026-04-17: long-session fire rate 19.23% in sample, false-positive rate 0.00%.',
          'Runtime placeholder `[Request interrupted by user]` counts as a structural stop-request signal in 57.7-v1.',
          'sampled_matches remains calibration-only and is not persisted to measurement rows.',
        ],
      });
    });
  },
});

const RUNTIME_EXTRACTORS = Object.freeze([
  runtimeSessionIdentityExtractor,
  claudeSettingsAtStartExtractor,
  thinkingCompositeExtractor,
  markerDensityExtractor,
  clearInvocationExtractor,
  claudeCompactionEventsExtractor,
  sessionTokensJsonlExtractor,
  humanTurnCountJsonlExtractor,
  runtimeJsonlCoverageExtractor,
  runtimeEraBoundaryRegistryExtractor,
  toolInvocationSequenceExtractor,
  topicShiftMarkersExtractor,
  interventionPointsExtractor,
]);

module.exports = {
  RUNTIME_EXTRACTORS,
  claudeCompactionEventsExtractor,
  claude_compaction_events: claudeCompactionEventsExtractor,
  claude_settings_at_start: claudeSettingsAtStartExtractor,
  clearInvocationExtractor,
  clear_invocation: clearInvocationExtractor,
  human_turn_count_jsonl: humanTurnCountJsonlExtractor,
  markerDensityExtractor,
  marker_density: markerDensityExtractor,
  runtimeJsonlCoverageExtractor,
  runtimeEraBoundaryRegistryExtractor,
  runtimeSessionIdentityExtractor,
  runtime_jsonl_coverage: runtimeJsonlCoverageExtractor,
  runtime_era_boundary_registry: runtimeEraBoundaryRegistryExtractor,
  runtime_session_identity: runtimeSessionIdentityExtractor,
  sessionTokensJsonlExtractor,
  session_tokens_jsonl: sessionTokensJsonlExtractor,
  thinkingCompositeExtractor,
  thinking_composite: thinkingCompositeExtractor,
  toolInvocationSequenceExtractor,
  tool_invocation_sequence: toolInvocationSequenceExtractor,
  topicShiftMarkersExtractor,
  topic_shift_markers: topicShiftMarkersExtractor,
  interventionPointsExtractor,
  intervention_points: interventionPointsExtractor,
};
