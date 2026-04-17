import { describe, expect } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const CLAUDE_SOURCE_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/sources/claude.cjs')
const RUNTIME_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/runtime.cjs')
const DERIVED_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/extractors/derived.cjs')

const { encodeClaudeProjectPath, loadClaude } = require(CLAUDE_SOURCE_PATH)
const runtime = require(RUNTIME_PATH)
const derived = require(DERIVED_PATH)

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function writeSessionMeta(tmpdir, sessionId, fields = {}) {
  const sessionMetaPath = path.join(tmpdir, 'home', '.claude', 'usage-data', 'session-meta', `${sessionId}.json`)
  await writeJson(sessionMetaPath, {
    session_id: sessionId,
    project_path: tmpdir,
    start_time: '2026-04-16T10:00:00Z',
    duration_minutes: 15,
    user_message_count: 99,
    assistant_message_count: 4,
    input_tokens: 999,
    output_tokens: 555,
    first_prompt: 'fixture prompt',
    ...fields,
  })
}

async function writeFacet(tmpdir, sessionId, fields = {}) {
  const facetPath = path.join(tmpdir, 'home', '.claude', 'usage-data', 'facets', `${sessionId}.json`)
  await writeJson(facetPath, {
    session_id: sessionId,
    outcome: 'fully_achieved',
    friction_counts: { tool_failure: 1 },
    ...fields,
  })
}

function userRecord(sessionId, content, extra = {}) {
  return {
    type: 'user',
    message: {
      role: 'user',
      content,
    },
    sessionId,
    cwd: extra.cwd || '/fixture/project',
    entrypoint: extra.entrypoint || 'cli',
    userType: 'external',
    timestamp: extra.timestamp || '2026-04-16T10:00:00.000Z',
    version: extra.version || '2.1.110',
    ...extra,
  }
}

function assistantRecord(sessionId, messageId, usage, extra = {}) {
  return {
    type: 'assistant',
    message: {
      id: messageId,
      model: extra.model || 'claude-opus-4-6',
      usage,
      role: 'assistant',
      content: [{ type: 'text', text: extra.text || 'fixture response' }],
    },
    sessionId,
    cwd: extra.cwd || '/fixture/project',
    entrypoint: extra.entrypoint || 'cli',
    userType: 'external',
    timestamp: extra.timestamp || '2026-04-16T10:00:05.000Z',
    version: extra.version || '2.1.110',
  }
}

async function writeParentJsonl(tmpdir, sessionId, records, projectPath = tmpdir) {
  const projectDir = path.join(tmpdir, 'home', '.claude', 'projects', encodeClaudeProjectPath(projectPath))
  await fs.mkdir(projectDir, { recursive: true })
  const jsonlPath = path.join(projectDir, `${sessionId}.jsonl`)
  await fs.writeFile(jsonlPath, records.map(record => JSON.stringify(record)).join('\n'))
}

async function setupMeasurementFixture(tmpdir, options = {}) {
  await writeJson(path.join(tmpdir, '.planning', 'config.json'), {
    gsd_reflect_version: '1.19.4+dev',
    model_profile: 'quality',
  })

  await writeJson(path.join(tmpdir, 'home', '.claude', 'settings.json'), {
    showThinkingSummaries: true,
    effortLevel: 'xhigh',
    skipDangerousModePermissionPrompt: true,
  })

  await writeSessionMeta(tmpdir, 'sess-post', {
    input_tokens: 1,
    output_tokens: 2,
    user_message_count: 77,
  })
  await writeSessionMeta(tmpdir, 'sess-pre', {
    input_tokens: 3,
    output_tokens: 4,
    user_message_count: 11,
  })
  await writeSessionMeta(tmpdir, 'sess-dir-only', {
    input_tokens: 22,
    output_tokens: 33,
    user_message_count: 44,
  })

  await writeFacet(tmpdir, 'sess-post')
  await writeFacet(tmpdir, 'sess-pre', { outcome: 'partially_achieved' })
  await writeFacet(tmpdir, 'orphan-facet', { outcome: 'not_achieved' })

  await writeParentJsonl(tmpdir, 'sess-post', [
    userRecord('sess-post', '<local-command-caveat>Ignore local command output.</local-command-caveat>', {
      isMeta: true,
      timestamp: '2026-04-16T10:00:00.000Z',
    }),
    userRecord('sess-post', '<command-name>/effort</command-name>\n<command-message>effort</command-message>\n<command-args>medium</command-args>', {
      timestamp: '2026-04-16T10:00:01.000Z',
    }),
    userRecord('sess-post', '<local-command-stdout>Set effort level to medium.</local-command-stdout>', {
      timestamp: '2026-04-16T10:00:02.000Z',
    }),
    userRecord('sess-post', [{ type: 'tool_result', tool_use_id: 'toolu_fixture', content: 'ok' }], {
      timestamp: '2026-04-16T10:00:03.000Z',
    }),
    userRecord('sess-post', 'Please inspect the runtime extractor.', {
      timestamp: '2026-04-16T10:00:04.000Z',
    }),
    userRecord('sess-post', 'sorry continue', {
      timestamp: '2026-04-16T10:00:05.000Z',
      permissionMode: 'bypassPermissions',
    }),
    assistantRecord('sess-post', 'msg-post-1', {
      input_tokens: 5,
      output_tokens: 10,
      cache_creation_input_tokens: 100,
      cache_read_input_tokens: 90,
    }, {
      timestamp: '2026-04-16T10:00:06.000Z',
    }),
    assistantRecord('sess-post', 'msg-post-1', {
      input_tokens: 5,
      output_tokens: 30,
      cache_creation_input_tokens: 100,
      cache_read_input_tokens: 90,
    }, {
      timestamp: '2026-04-16T10:00:07.000Z',
    }),
    assistantRecord('sess-post', 'msg-post-2', {
      input_tokens: 2,
      output_tokens: 7,
      cache_creation_input_tokens: 40,
      cache_read_input_tokens: 10,
    }, {
      timestamp: '2026-04-16T10:00:08.000Z',
    }),
  ])

  await writeParentJsonl(tmpdir, 'sess-pre', [
    userRecord('sess-pre', 'Older era prompt.', {
      version: '2.1.68',
      timestamp: '2026-03-01T10:00:00.000Z',
    }),
    assistantRecord('sess-pre', 'msg-pre-1', {
      input_tokens: 4,
      output_tokens: 9,
      cache_creation_input_tokens: 50,
      cache_read_input_tokens: 25,
    }, {
      model: 'claude-sonnet-4-5',
      version: '2.1.68',
      timestamp: '2026-03-01T10:00:01.000Z',
    }),
  ])

  if (options.withProjectsDir === false) {
    await fs.rm(path.join(tmpdir, 'home', '.claude', 'projects'), { recursive: true, force: true })
  }
}

function extractRows(tmpdir, options = {}) {
  const claude = loadClaude(tmpdir, {
    homeDir: path.join(tmpdir, 'home'),
    projectFilter: options.projectFilter === undefined ? tmpdir : options.projectFilter,
  })
  const context = {
    cwd: tmpdir,
    observed_at: '2026-04-16T20:00:00.000Z',
    claude,
  }
  return {
    claude,
    runtimeRows: runtime.RUNTIME_EXTRACTORS.flatMap(extractor => extractor.extract(context)),
    derivedRows: derived.DERIVED_EXTRACTORS.flatMap(extractor => extractor.extract(context)),
  }
}

function findFeature(rows, extractorName, featureName) {
  return rows.find(row => row.extractor_name === extractorName && row.feature_name === featureName)
}

describe('measurement runtime and derived extractors', () => {
  tmpdirTest('loader exposes explicit matched and unmatched Claude coverage states', async ({ tmpdir }) => {
    await setupMeasurementFixture(tmpdir)
    const { claude } = extractRows(tmpdir)

    expect(claude.sessions).toHaveLength(3)
    expect(claude.coverage.jsonl.matched).toBe(2)
    expect(claude.coverage.jsonl.unmatched).toBe(1)
    expect(claude.coverage.jsonl.session_dir_only).toBe(1)
    expect(claude.coverage.jsonl.missing).toBe(0)
    expect(claude.coverage.facets.matched_sessions).toBe(2)
    expect(claude.coverage.facets.unmatched_sessions).toBe(1)
    expect(claude.coverage.facets.orphaned_global).toBe(1)
  })

  tmpdirTest('JSONL token totals win over session-meta token fields and never silently fall back', async ({ tmpdir }) => {
    await setupMeasurementFixture(tmpdir)
    const { runtimeRows } = extractRows(tmpdir)

    const matched = findFeature(runtimeRows, 'session_tokens_jsonl', 'session_tokens_jsonl:sess-post')
    const missing = findFeature(runtimeRows, 'session_tokens_jsonl', 'session_tokens_jsonl:sess-dir-only')

    expect(matched.availability_status).toBe('exposed')
    expect(matched.value.input_tokens_total).toBe(7)
    expect(matched.value.output_tokens_total).toBe(37)
    expect(matched.value.cache_creation_tokens_total).toBe(140)
    expect(matched.value.cache_read_tokens_total).toBe(100)
    expect(matched.value.total_context_tokens).toBe(247)
    expect(matched.value.session_meta_tokens_ignored).toEqual({ input_tokens: 1, output_tokens: 2 })

    expect(missing.availability_status).toBe('not_available')
    expect(missing.value.output_tokens_total).toBeNull()
    expect(missing.value.unavailability_reason).toBe('session_dir_only')
    expect(missing.value.session_meta_tokens_ignored).toEqual({ input_tokens: 22, output_tokens: 33 })
  })

  tmpdirTest('human-turn count uses the explicit four-filter rule instead of meta_umc', async ({ tmpdir }) => {
    await setupMeasurementFixture(tmpdir)
    const { runtimeRows } = extractRows(tmpdir)

    const humanTurns = findFeature(runtimeRows, 'human_turn_count_jsonl', 'human_turn_count_jsonl:sess-post')

    expect(humanTurns.availability_status).toBe('exposed')
    expect(humanTurns.value.human_turn_count).toBe(2)
    expect(humanTurns.value.filter_counts.raw_user_records).toBe(6)
    expect(humanTurns.value.filter_counts.filtered_is_meta).toBe(1)
    expect(humanTurns.value.filter_counts.filtered_tool_result_list).toBe(1)
    expect(humanTurns.value.filter_counts.filtered_command_prefix).toBe(2)
    expect(humanTurns.value.session_meta_user_message_count_ignored).toBe(77)
  })

  tmpdirTest('runtime session identity records best-available gsd version and profile with provenance notes', async ({ tmpdir }) => {
    await setupMeasurementFixture(tmpdir)
    const { runtimeRows } = extractRows(tmpdir)

    const identity = findFeature(runtimeRows, 'runtime_session_identity', 'runtime_session_identity:sess-post')

    expect(identity.value.model.status).toBe('exposed')
    expect(identity.value.model.value).toBe('claude-opus-4-6')
    expect(identity.value.gsd_version.status).toBe('derived')
    expect(identity.value.gsd_version.value).toBe('1.19.4+dev')
    expect(identity.value.profile.status).toBe('derived')
    expect(identity.value.profile.value).toBe('quality')
    expect(identity.value.gsd_version.provenance).toMatch(/config\.json/)
    expect(identity.value.era_boundary.era_key).toBe('v2_1_69_plus_setting_gated')
  })

  tmpdirTest('session-meta outputs are marked DERIVED and carry lifecycle caveats', async ({ tmpdir }) => {
    await setupMeasurementFixture(tmpdir)
    const { derivedRows } = extractRows(tmpdir)

    const provenance = findFeature(derivedRows, 'session_meta_provenance', 'session_meta_provenance:sess-post')

    expect(provenance.availability_status).toBe('derived')
    expect(provenance.value.scope).toBe('derived_from_jsonl_via_insights_command')
    expect(provenance.value.lifecycle).toBe('frozen_at_last_insights_run_for_sessions_still_running')
    expect(provenance.value.annotations.input_tokens.status).toMatch(/uncorrelated/)
    expect(provenance.notes.join(' ')).toMatch(/DERIVED/)
  })

  tmpdirTest('era-boundary registry warns when a query spans non-comparable Claude eras', async ({ tmpdir }) => {
    await setupMeasurementFixture(tmpdir)
    const { runtimeRows } = extractRows(tmpdir)

    const eraRegistry = findFeature(runtimeRows, 'runtime_era_boundary_registry', 'runtime_era_boundary_registry:claude-code')

    expect(eraRegistry.availability_status).toBe('exposed')
    expect(eraRegistry.value.comparable).toBe(false)
    expect(eraRegistry.value.eras).toHaveLength(3)
    expect(eraRegistry.value.sessions_without_version).toBe(1)
    expect(eraRegistry.value.eras.map(era => era.era_key).sort()).toEqual([
      'pre_2_1_69_thinking_unconditional',
      'v2_1_69_plus_setting_gated',
      'version_unknown',
    ])
    expect(eraRegistry.value.warnings.join(' ')).toMatch(/multiple Claude era boundaries/)
    expect(eraRegistry.value.warnings.join(' ')).toMatch(/partially incomplete/)
  })

  tmpdirTest('coverage audit reports matched, unmatched, and missing categories explicitly', async ({ tmpdir }) => {
    await setupMeasurementFixture(tmpdir)
    const complete = extractRows(tmpdir)
    const audit = findFeature(
      complete.derivedRows,
      'session_jsonl_coverage_audit',
      'session_jsonl_coverage_audit:claude-code'
    )

    expect(audit.availability_status).toBe('derived')
    expect(audit.value.coverage_categories).toEqual({
      matched: 2,
      unmatched: 1,
      missing: 0,
    })
    expect(audit.value.detail_states.session_dir_only).toBe(1)

    const missingTmp = path.join(tmpdir, 'missing-source')
    await fs.mkdir(missingTmp, { recursive: true })
    await setupMeasurementFixture(missingTmp, { withProjectsDir: false })
    const missing = extractRows(missingTmp)
    const missingAudit = findFeature(
      missing.derivedRows,
      'session_jsonl_coverage_audit',
      'session_jsonl_coverage_audit:claude-code'
    )
    const missingTokens = findFeature(
      missing.runtimeRows,
      'session_tokens_jsonl',
      'session_tokens_jsonl:sess-post'
    )

    expect(missingAudit.value.coverage_categories).toEqual({
      matched: 0,
      unmatched: 0,
      missing: 3,
    })
    expect(missingAudit.value.detail_states.source_unavailable).toBe(3)
    expect(missingTokens.availability_status).toBe('not_available')
    expect(missingTokens.value.unavailability_reason).toBe('source_unavailable')
  })
})
