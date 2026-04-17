'use strict';

const fs = require('node:fs');

const { buildFeatureRecord, defineExtractor } = require('../registry.cjs');
const { loadClaude, SESSION_META_PROVENANCE } = require('../sources/claude.cjs');
const { clusterByMtime, buildStratificationObject, classifySessionSize } = require('../stratify.cjs');

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
  const normalizedPaths = (paths || []).filter(Boolean);
  if (normalizedPaths.length === 0) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      stale_after_hours: 24,
      age_hours: null,
      reasons: ['no_source_paths'],
    };
  }

  const entries = normalizedPaths.map(filePath => fileFreshness(filePath, observedAt));
  const statuses = entries.map(entry => entry.status);
  const knownAges = entries
    .map(entry => entry.age_hours)
    .filter(ageHours => ageHours != null);
  const maxAgeHours = knownAges.length > 0 ? Math.max(...knownAges) : null;
  if (statuses.includes('stale')) {
    return {
      status: 'stale',
      observed_at: observedAt,
      modified_at: entries.find(entry => entry.modified_at)?.modified_at || null,
      stale_after_hours: 24,
      age_hours: maxAgeHours,
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
    age_hours: maxAgeHours,
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

function collectSessionAndFacetFiles(sessions) {
  const allFiles = [];
  for (const session of sessions || []) {
    if (session.session_meta && session.session_meta.path && typeof session.session_meta.mtime_ms === 'number') {
      allFiles.push({
        path: session.session_meta.path,
        mtime: session.session_meta.mtime_ms,
        kind: 'session_meta',
        session_id: session.session_id,
      });
    }
    if (session.facets && session.facets.path && typeof session.facets.mtime_ms === 'number') {
      allFiles.push({
        path: session.facets.path,
        mtime: session.facets.mtime_ms,
        kind: 'facet',
        session_id: session.session_id,
      });
    }
  }
  return allFiles;
}

function findClusterMembership(clusterMap, filePath) {
  if (!clusterMap || clusterMap.size === 0 || !filePath) {
    return null;
  }

  for (const [clusterId, cluster] of clusterMap.entries()) {
    if (cluster.file_set.has(filePath)) {
      return {
        cluster_id: clusterId,
        cluster,
      };
    }
  }

  return null;
}

const REASONING_QUALITY_DECISION_REF = '.planning/spikes/012-C5-reasoning-quality-mechanism/DECISION.md';
const REASONING_QUALITY_PROXY_LABEL = 'reasoning_quality_proxy_only';
const REASONING_QUALITY_GRADER_INDEPENDENCE = 'self_graded';
const REASONING_QUALITY_GRADER_NOTE = [
  'PASS verdicts from self-grading remain subject to future independent-grader validation.',
  'This proxy is not final epistemic closure for reasoning-quality claims.',
].join(' ');
const REASONING_QUALITY_OUTCOME_SCORES = Object.freeze({
  fully_achieved: 1.5,
  mostly_achieved: 1.0,
  partially_achieved: 0.5,
  not_achieved: 0,
});
const REASONING_QUALITY_HELPFULNESS_SCORES = Object.freeze({
  essential: 1.4,
  very_helpful: 1.25,
  moderately_helpful: 0.75,
  slightly_helpful: 0.25,
  not_helpful: 0,
});

function frictionTotal(facet) {
  if (!facet || !facet.friction_counts || typeof facet.friction_counts !== 'object') return 0;
  return Object.values(facet.friction_counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function goalCategoryCount(facet) {
  if (!facet || !facet.goal_categories) return 0;
  if (Array.isArray(facet.goal_categories)) return facet.goal_categories.length;
  if (typeof facet.goal_categories === 'object') return Object.keys(facet.goal_categories).length;
  return 0;
}

function reasoningQualityProxyScore(facet) {
  if (!facet) return null;

  const satisfaction = facet.user_satisfaction_counts || {};
  const likelySatisfied = Number(satisfaction.likely_satisfied) || 0;
  const dissatisfied = Number(satisfaction.dissatisfied) || 0;
  const totalFriction = frictionTotal(facet);
  const goalCategories = goalCategoryCount(facet);

  let score = 1.0;
  score += facet.underlying_goal ? 0.25 : 0;
  score += REASONING_QUALITY_OUTCOME_SCORES[facet.outcome] ?? 0.25;
  score += REASONING_QUALITY_HELPFULNESS_SCORES[facet.claude_helpfulness] ?? 0.4;
  score += facet.primary_success ? 0.25 : 0;
  score += Math.min(0.5, likelySatisfied * 0.15);
  score -= Math.min(1.0, dissatisfied * 0.25);
  score -= Math.min(1.25, totalFriction * 0.2);
  score += Math.min(0.25, goalCategories * 0.05);

  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function reasoningQualityComponentSignals(facet) {
  const satisfaction = facet && facet.user_satisfaction_counts ? facet.user_satisfaction_counts : {};
  return {
    has_underlying_goal: Boolean(facet && facet.underlying_goal),
    outcome: facet && facet.outcome ? facet.outcome : null,
    helpfulness: facet && facet.claude_helpfulness ? facet.claude_helpfulness : null,
    primary_success_present: Boolean(facet && facet.primary_success),
    likely_satisfied: Number(satisfaction.likely_satisfied) || 0,
    dissatisfied: Number(satisfaction.dissatisfied) || 0,
    friction_total: frictionTotal(facet),
    distinct_goal_categories: goalCategoryCount(facet),
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

const facetsSemanticSummaryExtractor = defineExtractor({
  name: 'facets_semantic_summary',
  source_family: 'DERIVED',
  raw_sources: ['claude_facets', 'claude_session_meta'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['facets_semantic_summary'],
  serves_loop: ['signal_quality', 'agent_performance'],
  distinguishes: [
    'semantic_goal_distribution',
    'friction_surface_map',
    // 57.7-06 backfill: aligns registry vocabulary with the facets-coverage asymmetry diagnostic.
    'size_bucket_coverage_bias',
  ],
  status_semantics: ['derived', 'not_available', 'not_emitted'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    const clusterMap = clusterByMtime(collectSessionAndFacetFiles(claude.sessions));

    return claude.sessions.map(session => {
      const hasFacet = Boolean(session.facets && session.facets.record);
      const facet = hasFacet ? session.facets.record : null;
      const stratification = buildStratificationObject({
        session,
        cluster_map: clusterMap,
        session_meta_path: session.session_meta && session.session_meta.path,
        has_facet: hasFacet,
      });

      if (!hasFacet) {
        return buildFeatureRecord(extractor, {
          feature_name: `facets_semantic_summary:${session.session_id}`,
          runtime: 'claude-code',
          availability_status: 'not_emitted',
          symmetry_marker: 'asymmetric_only',
          reliability_tier: 'artifact_derived',
          value: {
            session_id: session.session_id,
            stratification,
          },
          coverage: coverageForSession(session),
          provenance: { session_id: session.session_id, facet_path: null },
          freshness: combineFreshness(context.observed_at, []),
          notes: ['No facet file matched for this session — facets coverage asymmetry per E5.8 Finding C; absence is data.'],
        });
      }

      return buildFeatureRecord(extractor, {
        feature_name: `facets_semantic_summary:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: 'derived',
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'artifact_derived',
        value: {
          session_id: session.session_id,
          underlying_goal: facet.underlying_goal || null,
          goal_categories: facet.goal_categories || [],
          outcome: facet.outcome || null,
          user_satisfaction_counts: facet.user_satisfaction_counts || null,
          claude_helpfulness: facet.claude_helpfulness || null,
          session_type: facet.session_type || null,
          friction_counts: facet.friction_counts || null,
          friction_detail: facet.friction_detail || null,
          primary_success: facet.primary_success || null,
          brief_summary: facet.brief_summary || null,
          stratification,
        },
        coverage: coverageForSession(session),
        provenance: { session_id: session.session_id, facet_path: session.facets.path || null },
        freshness: combineFreshness(context.observed_at, [session.facets.path]),
        notes: [
          'Facets are LLM-extracted (reliability_tier: artifact_derived). NOT a quality proxy.',
          'Stratification fields are MANDATORY per DC-4 / MEAS-DERIVED-02. Report layer must default to stratified view.',
        ],
      });
    });
  },
});

const reasoningQualityProxyExtractor = defineExtractor({
  name: 'reasoning_quality_proxy',
  source_family: 'DERIVED',
  raw_sources: ['claude_facets', 'claude_session_meta'],
  runtimes: ['claude-code'],
  reliability_tier: 'inferred',
  features_produced: ['reasoning_quality_proxy'],
  serves_loop: ['agent_performance'],
  distinguishes: ['reasoning_quality_signal', 'facets_backed_quality_inference'],
  status_semantics: ['derived', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);

    return claude.sessions.map(session => {
      const hasFacet = Boolean(session.facets && session.facets.record);
      if (!hasFacet) {
        return buildFeatureRecord(extractor, {
          feature_name: `reasoning_quality_proxy:${session.session_id}`,
          runtime: 'claude-code',
          availability_status: 'not_available',
          symmetry_marker: 'asymmetric_only',
          reliability_tier: 'inferred',
          value: {
            session_id: session.session_id,
            reasoning_quality_proxy_score: null,
            proxy_mechanism: 'facets-substitute',
            proxy_label: REASONING_QUALITY_PROXY_LABEL,
            skip_reason: 'facets_unavailable',
          },
          coverage: coverageForSession(session),
          provenance: {
            session_id: session.session_id,
            facet_path: null,
            mechanism: 'facets-substitute',
            decision_ref: REASONING_QUALITY_DECISION_REF,
            source_read: 'session.facets.record (direct, not computedFeatures)',
            parallel_to_extractor: 'facets_semantic_summary',
            grader_independence: REASONING_QUALITY_GRADER_INDEPENDENCE,
            grader_independence_note: REASONING_QUALITY_GRADER_NOTE,
            proxy_label: REASONING_QUALITY_PROXY_LABEL,
          },
          freshness: combineFreshness(context.observed_at, [session.session_meta && session.session_meta.path]),
          notes: [
            'Facet coverage gaps stay visible as not_available rather than being silently dropped from the proxy surface.',
            'This extractor reads session.facets.record directly, not context.computedFeatures.',
            'Summary length is never used as a reasoning-quality proxy.',
          ],
        });
      }

      const facet = session.facets.record;
      return buildFeatureRecord(extractor, {
        feature_name: `reasoning_quality_proxy:${session.session_id}`,
        runtime: 'claude-code',
        availability_status: 'derived',
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'inferred',
        value: {
          session_id: session.session_id,
          reasoning_quality_proxy_score: reasoningQualityProxyScore(facet),
          proxy_mechanism: 'facets-substitute',
          proxy_label: REASONING_QUALITY_PROXY_LABEL,
          component_signals: reasoningQualityComponentSignals(facet),
        },
        coverage: coverageForSession(session),
        provenance: {
          session_id: session.session_id,
          facet_path: session.facets.path || null,
          mechanism: 'facets-substitute',
          decision_ref: REASONING_QUALITY_DECISION_REF,
          source_read: 'session.facets.record (direct, not computedFeatures)',
          parallel_to_extractor: 'facets_semantic_summary',
          grader_independence: REASONING_QUALITY_GRADER_INDEPENDENCE,
          grader_independence_note: REASONING_QUALITY_GRADER_NOTE,
          proxy_label: REASONING_QUALITY_PROXY_LABEL,
        },
        freshness: combineFreshness(context.observed_at, [
          session.session_meta && session.session_meta.path,
          session.facets && session.facets.path,
        ]),
        notes: [
          'This feature is a proxy only, not a truth-tracking reasoning-quality measure.',
          'Summary length is never used as a reasoning-quality proxy.',
          'This extractor reads session.facets.record directly, not context.computedFeatures.',
        ],
      });
    });
  },
});

const derivedWritePathProvenanceExtractor = defineExtractor({
  name: 'derived_write_path_provenance',
  source_family: 'DERIVED',
  raw_sources: ['claude_session_meta', 'claude_facets'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['derived_write_path_provenance'],
  serves_loop: ['signal_quality', 'pipeline_integrity'],
  distinguishes: ['bulk_vs_single_write_path', 'mtime_cluster_membership'],
  status_semantics: ['derived', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    const allFiles = collectSessionAndFacetFiles(claude.sessions);
    const clusterMap = clusterByMtime(allFiles);

    return allFiles.map(file => {
      const membership = findClusterMembership(clusterMap, file.path);
      return buildFeatureRecord(extractor, {
        feature_name: `derived_write_path_provenance:${file.path}`,
        runtime: 'claude-code',
        availability_status: 'derived',
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'artifact_derived',
        value: {
          artifact_path: file.path,
          artifact_kind: file.kind,
          modified_at: new Date(file.mtime).toISOString(),
          mtime_cluster_id: membership ? membership.cluster_id : null,
          write_path: membership ? 'bulk' : 'single',
          cluster_size: membership ? membership.cluster.size : null,
          cluster_window_seconds: membership ? membership.cluster.window_seconds : null,
        },
        coverage: { artifact_path: file.path, artifact_kind: file.kind },
        provenance: { cluster_algorithm: 'stratify.cjs:clusterByMtime window=2s min_cluster=5 per E5.8 Finding A' },
        freshness: combineFreshness(context.observed_at, [file.path]),
        notes: ['Classification is snapshot at observed_at. Re-running rebuild during an /insights run may shift membership — that is data per G-6, not a defect.'],
      });
    });
  },
});

const insightsMassRewriteBoundaryExtractor = defineExtractor({
  name: 'insights_mass_rewrite_boundary',
  source_family: 'DERIVED',
  raw_sources: ['claude_session_meta', 'claude_facets'],
  runtimes: ['claude-code'],
  reliability_tier: 'artifact_derived',
  features_produced: ['insights_mass_rewrite_boundary'],
  serves_loop: ['signal_quality', 'cross_session_patterns'],
  distinguishes: ['insights_generation_batch', 'analysis_staleness_detection'],
  status_semantics: ['derived', 'not_available'],
  extract(extractor, context) {
    const claude = getClaudeDataset(context);
    const sessionFiles = claude.sessions
      .filter(session => session.session_meta && session.session_meta.path && typeof session.session_meta.mtime_ms === 'number')
      .map(session => ({
        path: session.session_meta.path,
        mtime: session.session_meta.mtime_ms,
        session_id: session.session_id,
        session,
      }));
    const clusterMap = clusterByMtime(sessionFiles);

    return [...clusterMap.entries()].map(([batchId, cluster]) => {
      const filesInCluster = sessionFiles.filter(sessionFile => cluster.file_set.has(sessionFile.path));
      const sessionIds = filesInCluster.map(sessionFile => sessionFile.session_id);
      const sessionsWithNewerJsonl = [];

      for (const sessionFile of filesInCluster) {
        const jsonlMtime = sessionFile.session.parent_jsonl && sessionFile.session.parent_jsonl.mtime_ms;
        if (typeof jsonlMtime === 'number' && jsonlMtime > sessionFile.mtime) {
          sessionsWithNewerJsonl.push(sessionFile.session_id);
        }
      }

      return buildFeatureRecord(extractor, {
        feature_name: `insights_mass_rewrite_boundary:${batchId}`,
        runtime: 'claude-code',
        availability_status: 'derived',
        symmetry_marker: 'asymmetric_only',
        reliability_tier: 'artifact_derived',
        value: {
          batch_id: batchId,
          batch_mtime_window: {
            start: cluster.window_start,
            end: cluster.window_end,
            duration_seconds: cluster.window_seconds,
          },
          session_ids_in_batch: sessionIds,
          batch_size: cluster.size,
          staleness: {
            sessions_with_newer_jsonl: sessionsWithNewerJsonl,
            stale_analysis_detected: sessionsWithNewerJsonl.length > 0,
          },
        },
        coverage: { batch_id: batchId, session_count: cluster.size },
        provenance: { cluster_algorithm: 'stratify.cjs:clusterByMtime window=2s min_cluster=5' },
        freshness: combineFreshness(context.observed_at, filesInCluster.map(sessionFile => sessionFile.path)),
        notes: ['A /insights batch is detected when ≥5 session-meta files share mtime within 2s. Staleness: JSONL appended after last batch.'],
      });
    });
  },
});

const DERIVED_EXTRACTORS = Object.freeze([
  sessionMetaProvenanceExtractor,
  sessionJsonlCoverageAuditExtractor,
  facetsSemanticSummaryExtractor,
  reasoningQualityProxyExtractor,
  derivedWritePathProvenanceExtractor,
  insightsMassRewriteBoundaryExtractor,
]);

module.exports = {
  DERIVED_EXTRACTORS,
  derivedWritePathProvenanceExtractor,
  facetsSemanticSummaryExtractor,
  insightsMassRewriteBoundaryExtractor,
  reasoningQualityProxyExtractor,
  sessionJsonlCoverageAuditExtractor,
  sessionMetaProvenanceExtractor,
  derived_write_path_provenance: derivedWritePathProvenanceExtractor,
  facets_semantic_summary: facetsSemanticSummaryExtractor,
  insights_mass_rewrite_boundary: insightsMassRewriteBoundaryExtractor,
  reasoning_quality_proxy: reasoningQualityProxyExtractor,
  session_jsonl_coverage_audit: sessionJsonlCoverageAuditExtractor,
  session_meta_provenance: sessionMetaProvenanceExtractor,
};
