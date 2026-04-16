'use strict';

const fs = require('node:fs');

const { buildFeatureRecord, defineExtractor } = require('../registry.cjs');
const { loadClaude, SESSION_META_PROVENANCE } = require('../sources/claude.cjs');

function getClaudeDataset(context) {
  return context && context.claude ? context.claude : loadClaude(context.cwd, context && context.claudeOptions ? context.claudeOptions : {});
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

function coverageForSession(session) {
  const observedSources = ['claude_session_meta'];
  const missingSources = [];

  if (session.parent_jsonl.status === 'matched') observedSources.push('claude_jsonl_projects');
  else missingSources.push('claude_jsonl_projects');

  if (session.facets.state === 'matched') observedSources.push('claude_facets');
  else missingSources.push('claude_facets');

  return {
    raw_sources: ['claude_session_meta', 'claude_facets', 'claude_jsonl_projects'],
    observed_sources: observedSources,
    missing_sources: missingSources,
    jsonl_state: session.parent_jsonl.status,
    facets_state: session.facets.state,
  };
}

const sessionMetaProvenanceExtractor = defineExtractor({
  name: 'session_meta_provenance',
  source_family: 'DERIVED',
  raw_sources: ['claude_session_meta', 'claude_facets', 'claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['session_meta_provenance'],
  // signal_quality: session_meta provenance IS the signal_provenance distinguishing feature (registry.cjs:70) - distinguishes LLM-extracted facets from direct observation.
  serves_loop: ['pipeline_integrity', 'signal_quality'],
  distinguishes: ['derived_lifecycle', 'manual_write_path', 'coverage_gaps'],
  status_semantics: ['derived', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    return claude.sessions.map(session => buildFeatureRecord(extractor, {
      feature_name: `session_meta_provenance:${session.session_id}`,
      runtime: 'claude-code',
      availability_status: 'derived',
      symmetry_marker: 'asymmetric_derived',
      reliability_tier: 'artifact_derived',
      value: {
        session_id: session.session_id,
        source_family: 'DERIVED',
        scope: SESSION_META_PROVENANCE.scope,
        lifecycle: SESSION_META_PROVENANCE.lifecycle,
        refresh_policy: SESSION_META_PROVENANCE.refresh_policy,
        dependency: SESSION_META_PROVENANCE.dependency,
        write_path: SESSION_META_PROVENANCE.write_path,
        parent_jsonl_state: session.parent_jsonl.status,
        facets_state: session.facets.state,
        annotations: {
          user_message_count: {
            scope: 'non_tool_result_user_records',
            lifecycle: 'frozen_at_last_insights_run_for_sessions_still_running',
            guidance: 'Use `human_turn_count_jsonl` for quantitative human-turn measurement.',
          },
          input_tokens: {
            status: 'uncorrelated_with_jsonl_for_42_percent_of_sample',
            lifecycle: 'frozen_at_last_insights_run_for_sessions_still_running',
            guidance: 'Do not consume as a first-class quantitative metric.',
          },
          output_tokens: {
            status: 'uncorrelated_with_jsonl_for_42_percent_of_sample',
            lifecycle: 'frozen_at_last_insights_run_for_sessions_still_running',
            guidance: 'Do not consume as a first-class quantitative metric.',
          },
        },
      },
      coverage: coverageForSession(session),
      provenance: {
        session_meta_path: session.session_meta.path,
        facets_path: session.facets.path || null,
        parent_jsonl_path: session.parent_jsonl.path || null,
      },
      freshness: combineFreshness(context.observed_at, [
        session.session_meta.path,
        session.facets.path,
      ]),
      notes: [
        'Session-meta is explicitly treated as DERIVED `/insights` output, not as runtime-native telemetry.',
        'Token and user-message fields remain annotated artifacts with lifecycle caveats instead of quantitative ground truth.',
      ],
    }));
  },
});

const sessionJsonlCoverageAuditExtractor = defineExtractor({
  name: 'session_jsonl_coverage_audit',
  source_family: 'DERIVED',
  raw_sources: ['claude_session_meta', 'claude_facets', 'claude_jsonl_projects'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['session_jsonl_coverage_audit'],
  // cross_session_patterns: coverage gaps across sessions are THE coverage-stratification distinguishing feature (registry.cjs:85) - 57.5's two uncovered JSONL sessions (E5.8 Finding E) exemplify why.
  serves_loop: ['pipeline_integrity', 'cross_session_patterns'],
  distinguishes: ['matched_sessions', 'unmatched_sessions', 'missing_runtime_source'],
  status_semantics: ['derived', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    if (claude.sessions.length === 0) return [];

    const summary = {
      matched: 0,
      unmatched: 0,
      missing: 0,
      detail_states: {
        session_dir_only: 0,
        truly_orphaned: 0,
        source_unavailable: 0,
      },
      facets: {
        matched: 0,
        unmatched: 0,
        missing: fs.existsSync(claude.paths.facets_dir) ? 0 : claude.sessions.length,
      },
      sample_session_ids: {
        matched: [],
        unmatched: [],
        missing: [],
      },
    };

    for (const session of claude.sessions) {
      if (session.parent_jsonl.status === 'matched') {
        summary.matched++;
        if (summary.sample_session_ids.matched.length < 5) summary.sample_session_ids.matched.push(session.session_id);
      } else if (session.parent_jsonl.status === 'source_unavailable') {
        summary.missing++;
        summary.detail_states.source_unavailable++;
        if (summary.sample_session_ids.missing.length < 5) summary.sample_session_ids.missing.push(session.session_id);
      } else {
        summary.unmatched++;
        if (session.parent_jsonl.status === 'session_dir_only') summary.detail_states.session_dir_only++;
        if (session.parent_jsonl.status === 'truly_orphaned') summary.detail_states.truly_orphaned++;
        if (summary.sample_session_ids.unmatched.length < 5) summary.sample_session_ids.unmatched.push(session.session_id);
      }

      if (session.facets.state === 'matched') summary.facets.matched++;
      else if (session.facets.state === 'unmatched') summary.facets.unmatched++;
    }

    const warnings = [];
    if (summary.unmatched > 0) {
      warnings.push('Some session-meta entries do not have a matched parent JSONL and remain only partially auditable.');
    }
    if (summary.missing > 0) {
      warnings.push('The Claude JSONL source was unavailable for part of the audit, so unmatched counts are lower-bounded.');
    }

    return [buildFeatureRecord(extractor, {
      feature_name: 'session_jsonl_coverage_audit:claude-code',
      runtime: 'claude-code',
      availability_status: 'derived',
      symmetry_marker: 'asymmetric_derived',
      reliability_tier: 'artifact_derived',
      value: {
        runtime: 'claude-code',
        coverage_categories: {
          matched: summary.matched,
          unmatched: summary.unmatched,
          missing: summary.missing,
        },
        detail_states: summary.detail_states,
        facets: summary.facets,
        sample_session_ids: summary.sample_session_ids,
        warnings,
      },
      coverage: {
        raw_sources: ['claude_session_meta', 'claude_facets', 'claude_jsonl_projects'],
        observed_sources: [
          'claude_session_meta',
          ...(fs.existsSync(claude.paths.facets_dir) ? ['claude_facets'] : []),
          ...(fs.existsSync(claude.paths.projects_dir) ? ['claude_jsonl_projects'] : []),
        ],
        missing_sources: [
          ...(fs.existsSync(claude.paths.facets_dir) ? [] : ['claude_facets']),
          ...(fs.existsSync(claude.paths.projects_dir) ? [] : ['claude_jsonl_projects']),
        ],
        session_count: claude.sessions.length,
      },
      provenance: {
        session_meta_dir: claude.paths.session_meta_dir,
        facets_dir: claude.paths.facets_dir,
        projects_dir: claude.paths.projects_dir,
      },
      freshness: combineFreshness(context.observed_at, [
        claude.paths.session_meta_dir,
        claude.paths.facets_dir,
        claude.paths.projects_dir,
      ]),
      notes: [
        'Coverage categories stay explicit: matched, unmatched, and missing are separate states.',
        'Session-dir-only and truly-orphaned cases are preserved instead of being silently collapsed.',
      ],
    })];
  },
});

const DERIVED_EXTRACTORS = Object.freeze([
  sessionMetaProvenanceExtractor,
  sessionJsonlCoverageAuditExtractor,
]);

module.exports = {
  DERIVED_EXTRACTORS,
  sessionJsonlCoverageAuditExtractor,
  sessionMetaProvenanceExtractor,
  session_jsonl_coverage_audit: sessionJsonlCoverageAuditExtractor,
  session_meta_provenance: sessionMetaProvenanceExtractor,
};
